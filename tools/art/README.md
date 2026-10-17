# Painted dragon art

The game draws every dragon itself, but it can use painted images instead. Put an image at
`docs/art/dragons/<dragon id>-<stage>.webp`, list it in `docs/art/manifest.json`, and the
game shows it everywhere that dragon appears. Dragons without an image keep the drawn art,
so you can add images a few at a time. If a dragon only has an `adult` image, its young
stage uses that image at a smaller size.

The scripts here make those images with an AI image model:

| File | What it does |
| --- | --- |
| `prompts.json` | One prompt per dragon (adult and baby), written from its design. |
| `build_prompts.mjs` | Rebuilds `prompts.json` after designs change: `node tools/art/build_prompts.mjs` |
| `generate.py` | Sends the prompts to ComfyUI on your PC (or Cloudflare) and saves raw images in `tools/art/raw/`. |
| `postprocess.py` | Removes the background, trims, sizes and saves the images into the game. |
| `workflow_txt2img.json` | A basic ComfyUI workflow the generator uses by default. |

## Option A: your own GPU with ComfyUI (free, no limits)

An RTX 5060 (8 GB) runs SDXL models comfortably, at around 10–20 seconds per image.

1. **Install ComfyUI Desktop** from <https://www.comfy.org/download> (Windows, NVIDIA).
   It installs a PyTorch build that supports RTX 50-series cards. Open it once so it
   finishes setting up.
2. **Get a model.** Download an SDXL checkpoint (`.safetensors`) and put it in ComfyUI's
   `models/checkpoints` folder. Good ones for painted creature art, from
   <https://civitai.com>: *DreamShaper XL* or *Juggernaut XL* (use the normal versions,
   not "Lightning" or "Turbo"). Restart ComfyUI and check the model shows up in the
   **Load Checkpoint** node. Note its exact file name.
3. **Check the address.** ComfyUI Desktop listens on `http://127.0.0.1:8000` by default (the
   scripts' default); the classic ComfyUI uses `8188`, so add `--server http://127.0.0.1:8188`
   if that's what you run. ComfyUI must be open while the script runs.
4. **Install Python 3** from <https://www.python.org/downloads/> (tick *Add Python to PATH*).
   Then, in a terminal in this repository's folder:

   ```
   pip install -r tools/art/requirements.txt
   ```

5. **Try one dragon first** (three versions to choose from):

   ```
   python tools/art/generate.py --ckpt dreamshaperXL.safetensors --only abyssal --variants 3
   python tools/art/postprocess.py --only abyssal
   ```

   Open the images in `tools/art/raw/` and pick the best one, e.g. version 2:

   ```
   python tools/art/postprocess.py --only abyssal --pick abyssal-adult=2
   ```

   If a dragon faces left, add `--flip abyssal-adult`.

6. **Look at it in the game's dragon gallery**: run `npx http-server -p 8124 -c-1 .` in the
   repository folder and open
   <http://127.0.0.1:8124/tools/gallery.html?ids=abyssal&stage=all>
   (add `&drawn=1` to compare with the drawn art).
7. **Do the rest** when you're happy with the look. Leave out `--only` to do all 82 dragons;
   images that already exist are skipped, so you can stop and continue any time.
8. **Put them in the game**: commit `docs/art/` and push. GitHub Pages updates the game
   and your phone picks it up on the next launch. (`tools/art/raw/` is not committed.)

### Using your own ComfyUI workflow

To use a workflow you built in ComfyUI (a FLUX model, LoRAs, upscaling, anything), type
`{{PROMPT}}` in the positive prompt box and `{{NEGATIVE}}` in the negative one, then use
**Workflow → Export (API)** and run:

```
python tools/art/generate.py --workflow my_workflow_api.json
```

The script gives every image its own seed. Any `{{STEPS}}`, `{{CFG}}`, `{{WIDTH}}` or
`{{HEIGHT}}` you put in the exported file are filled in too.

FLUX models give the most polished results but are large for 8 GB. If you try one, use a
small GGUF or fp8 version with `--preset flux-schnell`.

## Option B: Cloudflare Workers AI (free daily allowance, no GPU needed)

1. Make a free account at <https://dash.cloudflare.com>. Your **Account ID** is on the
   Workers & Pages overview page.
2. Under **My Profile → API Tokens**, create a token with the *Workers AI* template.
3. Set both as environment variables in your terminal (never paste them into a chat or a
   file in this repository):

   ```
   set CLOUDFLARE_ACCOUNT_ID=...        (Windows; use export on Mac/Linux)
   set CLOUDFLARE_API_TOKEN=...
   python tools/art/generate.py --backend cloudflare --only abyssal --variants 3
   ```

4. Continue from step 5 above with `postprocess.py`. When the daily allowance runs out,
   run the same command the next day; finished images are skipped.

## Tips

- The shared style and the wording for each body type, horn, wing and pattern live at the
  top of `build_prompts.mjs`. Change them there and rebuild, rather than editing
  `prompts.json` by hand.
- `--seed 1234` makes a run repeatable; `--force` regenerates images that already exist.
- `postprocess.py --keep-bg` skips background removal, for images that already have a
  transparent background.
