# Dragon Isles

A personal, microtransaction-free dragon-breeding game inspired by Dragon City, for the
owner's iPhone. It's an installable web app (PWA) in `docs/`, plain JavaScript modules with
no build step, served by GitHub Pages from branch `claude/dragon-city-game-yppbve`, folder
`/docs`. Saves live in the phone's localStorage.

- Work on branch `claude/dragon-city-game-yppbve`. Don't open a pull request unless asked.
- All names and art are original. Never copy Social Point's dragons, names or assets.
- Never ask the owner to paste API keys, tokens or passwords into the chat.
- Run locally: `npx http-server -p 8124 -c-1 .` from the repo root, then open
  `http://127.0.0.1:8124/docs/` (game) or `http://127.0.0.1:8124/tools/gallery.html`
  (every dragon; `?ids=a,b&stage=baby|young|adult|all&cols=N`, `&drawn=1` for the drawn art).
- After changing files the phone should re-download, bump `CACHE` in `docs/sw.js`.
- `.claude/agents/dragon-city-judge.md` is a reviewer agent that knows Dragon City; use it
  for a second opinion on how the game or art compares.

## Map

- `docs/js/data.js` elements, 82 dragons, breeding, buildings, islands. `docs/js/designs.js`
  each dragon's design (body plan, head, horns, wings, colours, pattern).
- `docs/js/art.js` draws dragons as SVG. If `docs/art/manifest.json` lists
  `<id>-<stage>` it shows `docs/art/dragons/<id>-<stage>.webp` instead (young falls back
  to the adult image, scaled down).
- `docs/js/{game,ui,island,world,dragons,battle,battleui,shop,sound,main}.js` game logic
  and screens. `tools/` dev tools (gallery, screenshots, art pipeline).

## Current job: painted dragon art on this PC's GPU

The owner found the drawn SVG dragons too flat and childish. They want art at the level
of Dragon City: detailed, mature, hand-painted. Their main reference is a hand-painted 2D
illustration of a midnight-navy dragon with glowing cyan swirl markings, cyan fin crest
and spines, and red eyes; the `abyssal` dragon is based on it. This PC runs Windows with
an RTX 5060 (8 GB VRAM).

The pipeline is in `tools/art/` and its `README.md` has the full steps. In short:

1. Check ComfyUI is installed and running (ComfyUI Desktop uses `http://127.0.0.1:8000`;
   classic ComfyUI uses `8188`, so pass `--server`). If it isn't installed, walk the owner
   through installing ComfyUI Desktop (https://www.comfy.org/download). Downloads and
   installs on their PC need their OK.
2. `python tools/art/generate.py --list-models` shows the checkpoints. An SDXL model
   suits 8 GB well (DreamShaper XL or Juggernaut XL, normal versions, from civitai.com;
   it goes in ComfyUI's `models/checkpoints`). If none is there, help the owner get one.
3. `pip install -r tools/art/requirements.txt` (Pillow, rembg, onnxruntime). rembg
   downloads its background-removal model on first use.
4. Start with Abyssal only:
   `python tools/art/generate.py --ckpt <model> --only abyssal --variants 4`
   Raw images land in `tools/art/raw/` (not committed). Look at them yourself.
5. Tune before scaling up. The shared style, negative prompt and the wording for every
   body part are at the top of `tools/art/build_prompts.mjs`. Edit there, run
   `node tools/art/build_prompts.mjs`, and regenerate with `--force`. Check: one dragon,
   whole body in frame, facing right, plain background, matches its design, painted and
   detailed rather than cartoony, and consistent from dragon to dragon. Try a few
   samplers/CFG values or models if the look is off; `--preset` and the workflow file are
   there for that, and a custom ComfyUI workflow (exported in API format with `{{PROMPT}}`
   and `{{NEGATIVE}}` in the prompt boxes) can be used with `--workflow`.
6. `python tools/art/postprocess.py --only abyssal --pick abyssal-adult=N` cuts out the
   background and writes the game image and manifest entry. `--flip <id>-<stage>` mirrors
   one that faces left. Check it in the gallery and in the game.
7. Show the owner Abyssal (adult and baby) and get their OK on the style before doing
   the rest. Then do a handful of different body plans (e.g. emberjaw, tidefin, a
   serpent, a golem, a bird, a wraith) and show those too.
8. When the owner approves, run all 82 dragons (adult and baby; omit `--only`). Finished
   images are skipped on reruns. Review every dragon and redo bad ones
   (`--only <id> --force`, or pick another variant).
9. Commit `docs/art/` (and any prompt changes), bump `CACHE` in `docs/sw.js`, push to
   `claude/dragon-city-game-yppbve`. GitHub Pages updates the game on the phone.
