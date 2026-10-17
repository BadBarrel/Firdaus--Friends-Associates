"""Turn raw generated images into game art.

For each dragon/stage it takes a raw image (variant 1, or the one you pick), removes the
background, trims, flips if needed so the dragon faces right, fits it into a 512x512 square
standing on the bottom edge, and saves docs/art/dragons/<id>-<stage>.webp. It then rewrites
docs/art/manifest.json so the game uses the images.

Examples:
  python tools/art/postprocess.py                       # everything in tools/art/raw
  python tools/art/postprocess.py --pick emberjaw-adult=3,tidefin-adult=2
  python tools/art/postprocess.py --flip emberjaw-adult  # dragon was facing left
  python tools/art/postprocess.py --keep-bg             # skip background removal
"""
import argparse
import glob
import json
import os
import re

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(ROOT, 'docs', 'art', 'dragons')
MANIFEST = os.path.join(ROOT, 'docs', 'art', 'manifest.json')
SIZE = 512


def parse_map(text):
    out = {}
    for item in filter(None, (s.strip() for s in text.split(','))):
        key, _, val = item.partition('=')
        out[key] = val or True
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--pick', default='', help='choose a variant, e.g. emberjaw-adult=2')
    ap.add_argument('--flip', default='', help='mirror these so they face right, e.g. emberjaw-adult,tidefin-baby')
    ap.add_argument('--keep-bg', action='store_true', help='do not remove the background')
    ap.add_argument('--only', default='', help='comma-separated dragon ids')
    args = ap.parse_args()

    picks = parse_map(args.pick)
    flips = parse_map(args.flip)
    only = {s.strip() for s in args.only.split(',') if s.strip()}

    remove = None
    if not args.keep_bg:
        from rembg import new_session, remove as rembg_remove
        session = new_session('isnet-general-use')
        remove = lambda im: rembg_remove(im, session=session)

    # Group raw files by "<id>-<stage>".
    groups = {}
    for path in glob.glob(os.path.join(RAW, '*.png')):
        m = re.match(r'(.+)-(adult|baby|young)-(\d+)\.png$', os.path.basename(path))
        if m:
            groups.setdefault(f'{m.group(1)}-{m.group(2)}', {})[m.group(3)] = path

    os.makedirs(OUT, exist_ok=True)
    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    for key in sorted(groups):
        if only and key.rsplit('-', 1)[0] not in only:
            continue
        variants = groups[key]
        choice = str(picks.get(key, '1'))
        path = variants.get(choice) or variants[sorted(variants)[0]]
        im = Image.open(path).convert('RGBA')
        if remove:
            im = remove(im)
        box = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
        if box:
            im = im.crop(box)
        if key in flips:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        # Fit inside the square, standing on the bottom edge.
        scale = min((SIZE * 0.96) / im.width, (SIZE * 0.96) / im.height)
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
        canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, ((SIZE - im.width) // 2, SIZE - im.height - 6), im)
        canvas.save(os.path.join(OUT, f'{key}.webp'), 'WEBP', quality=88, method=6)
        manifest[key] = True
        print(f'saved docs/art/dragons/{key}.webp (from {os.path.basename(path)})')

    with open(MANIFEST, 'w') as f:
        json.dump(dict(sorted(manifest.items())), f, indent=1)
        f.write('\n')
    print(f'{len(manifest)} images listed in docs/art/manifest.json')


if __name__ == '__main__':
    main()
