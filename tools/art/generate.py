"""Generate painted dragon images from tools/art/prompts.json.

Backends:
  comfyui     ComfyUI running on this PC (default, http://127.0.0.1:8000). Free, uses your GPU.
  cloudflare  Cloudflare Workers AI (FLUX.1 schnell). Needs CLOUDFLARE_ACCOUNT_ID and
              CLOUDFLARE_API_TOKEN in the environment.

Raw images go to tools/art/raw/<id>-<stage>-<n>.png. Run postprocess.py afterwards to cut
out backgrounds and copy them into the game.

Examples:
  python tools/art/generate.py --list-models
  python tools/art/generate.py --only emberjaw --variants 3
  python tools/art/generate.py --ckpt juggernautXL.safetensors
  python tools/art/generate.py --preset flux-schnell --ckpt flux1-schnell-fp8.safetensors
  python tools/art/generate.py --workflow my_workflow_api.json
  python tools/art/generate.py --backend cloudflare --stages adult
"""
import argparse
import base64
import json
import os
import random
import sys
import time
import urllib.parse
import urllib.request
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')

# Sampler settings that suit common model families.
PRESETS = {
    'sdxl': {'steps': 30, 'cfg': 6.0, 'sampler': 'dpmpp_2m', 'scheduler': 'karras', 'width': 1024, 'height': 1024},
    'flux-schnell': {'steps': 4, 'cfg': 1.0, 'sampler': 'euler', 'scheduler': 'simple', 'width': 1024, 'height': 1024},
}


def fill(node, values):
    """Replace {{NAME}} placeholders anywhere in a workflow (numbers stay numbers)."""
    if isinstance(node, dict):
        return {k: fill(v, values) for k, v in node.items()}
    if isinstance(node, list):
        return [fill(v, values) for v in node]
    if isinstance(node, str):
        for key, val in values.items():
            tag = '{{' + key + '}}'
            if node == tag:
                return val
            if tag in node:
                node = node.replace(tag, str(val))
    return node


def http_json(url, data=None, headers=None, timeout=600):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def comfy_generate(server, workflow, values):
    wf = fill(workflow, values)
    # Exported workflows have a fixed seed; give every image its own.
    for node in wf.values():
        inputs = node.get('inputs', {})
        for key in ('seed', 'noise_seed'):
            if isinstance(inputs.get(key), int):
                inputs[key] = values['SEED']
    client = str(uuid.uuid4())
    queued = http_json(f'{server}/prompt', {'prompt': wf, 'client_id': client})
    pid = queued['prompt_id']
    while True:
        hist = http_json(f'{server}/history/{pid}')
        if pid in hist:
            break
        time.sleep(1)
    for out in hist[pid]['outputs'].values():
        for img in out.get('images', []):
            q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img['subfolder'], 'type': img['type']})
            with urllib.request.urlopen(f'{server}/view?{q}') as r:
                return r.read()
    raise RuntimeError('ComfyUI returned no image (check the workflow has a SaveImage node)')


def cloudflare_generate(prompt, seed):
    acct = os.environ.get('CLOUDFLARE_ACCOUNT_ID')
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    if not acct or not token:
        sys.exit('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first.')
    url = f'https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/@cf/black-forest-labs/flux-1-schnell'
    res = http_json(url, {'prompt': prompt[:2048], 'steps': 8, 'seed': seed}, {'Authorization': f'Bearer {token}'})
    return base64.b64decode(res['result']['image'])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--backend', choices=['comfyui', 'cloudflare'], default='comfyui')
    ap.add_argument('--server', default='http://127.0.0.1:8000', help='ComfyUI address (Desktop app: 8000, classic: 8188)')
    ap.add_argument('--workflow', default=os.path.join(HERE, 'workflow_txt2img.json'),
                    help='ComfyUI workflow in API format with {{PROMPT}} and {{NEGATIVE}} placeholders')
    ap.add_argument('--ckpt', default='', help='checkpoint file name as listed in ComfyUI (for the default workflow)')
    ap.add_argument('--preset', choices=list(PRESETS), default='sdxl')
    ap.add_argument('--only', default='', help='comma-separated dragon ids')
    ap.add_argument('--stages', default='adult,baby', help='adult, baby or both')
    ap.add_argument('--variants', type=int, default=1, help='images per dragon to choose from')
    ap.add_argument('--force', action='store_true', help='regenerate images that already exist')
    ap.add_argument('--seed', type=int, default=None, help='base seed (default: random)')
    ap.add_argument('--list-models', action='store_true', help='print the checkpoints ComfyUI can load, then stop')
    args = ap.parse_args()

    if args.list_models:
        info = http_json(f'{args.server}/object_info/CheckpointLoaderSimple')
        names = info['CheckpointLoaderSimple']['input']['required']['ckpt_name'][0]
        print('\n'.join(names) if names else 'No checkpoints found. Put a .safetensors model in ComfyUI\'s models/checkpoints folder.')
        return

    prompts = json.load(open(os.path.join(HERE, 'prompts.json')))
    only = {s.strip() for s in args.only.split(',') if s.strip()}
    stages = {s.strip() for s in args.stages.split(',')}
    jobs = [p for p in prompts if (not only or p['id'] in only) and p['stage'] in stages]
    os.makedirs(RAW, exist_ok=True)

    workflow = None
    if args.backend == 'comfyui':
        workflow = json.load(open(args.workflow))
        if '{{CKPT}}' in json.dumps(workflow) and not args.ckpt:
            sys.exit('Pass --ckpt with your model file name (as shown in ComfyUI\'s Load Checkpoint node), '
                     'or export your own workflow and pass --workflow.')
    base = args.seed if args.seed is not None else random.randrange(1 << 30)
    total = len(jobs) * args.variants
    done = 0
    for p in jobs:
        for n in range(1, args.variants + 1):
            done += 1
            out = os.path.join(RAW, f"{p['id']}-{p['stage']}-{n}.png")
            if os.path.exists(out) and not args.force:
                continue
            seed = base + done * 7919
            print(f'[{done}/{total}] {p["name"]} ({p["stage"]}) #{n} ...', flush=True)
            try:
                if args.backend == 'comfyui':
                    vals = {'PROMPT': p['prompt'], 'NEGATIVE': p['negative'], 'SEED': seed, 'CKPT': args.ckpt}
                    vals.update({k.upper(): v for k, v in PRESETS[args.preset].items()})
                    data = comfy_generate(args.server, workflow, vals)
                else:
                    data = cloudflare_generate(p['prompt'], seed)
            except Exception as e:  # keep going; rerun later to fill gaps
                print(f'   failed: {e}', flush=True)
                continue
            with open(out, 'wb') as f:
                f.write(data)
    print(f'Done. Raw images are in {RAW}. Next: python tools/art/postprocess.py')


if __name__ == '__main__':
    main()
