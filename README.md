# Dragon Isles

A dragon breeding game inspired by Dragon City, made to play on your own phone. It's free with no purchases, ads or paywalls.

- 82 dragons across 12 elements and 5 rarities
- Breeding, hatching, habitats, farms, decorations and a Wish Totem
- Adventure (40 stages), Arena leagues and an endless Tower of Trials
- Works offline; your save stays on your phone

The game lives in [`docs/`](docs). The full list of dragons, elements, buildings and modes is in [`docs/GUIDE.md`](docs/GUIDE.md).

## Put it on your iPhone

1. On GitHub, open this repo's **Settings → Pages**.
2. Under **Build and deployment**, pick **Deploy from a branch**, choose the branch with the game and the **`/docs`** folder, then **Save**.
3. Wait a minute or two. The page shows the game's address (`https://<user>.github.io/<repo>/`).
4. Open that address in **Safari** on your iPhone, tap **Share → Add to Home Screen**.
5. Launch **Dragon Isles** from your Home Screen. It runs full screen and works offline.

Copy a backup code from ⚙️ Settings now and then. If you ever delete the app, you can restore your island from it.

## Run it on a computer

It's plain HTML/JS with no build step. Serve the `docs` folder with any static server, for example:

```sh
npx http-server docs
```
