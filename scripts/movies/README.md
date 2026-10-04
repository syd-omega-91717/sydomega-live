# Franchise films renderer

Renders the 12 films on `movies.html` (`assets/movies/franchise-NN.mp4` and `.jpg`).
It does not ship: `scripts/` is excluded by `scripts/vercel-build.sh`. Only the output in `assets/movies/` ships.

```sh
OMEGA_SCRATCHPAD=<dir containing node_modules/playwright-core> node scripts/movies/render.js   # [--only 3,7] [--keep] [--jobs 4]
```

- `scene.html` is a deterministic canvas scene: a seeded RNG, and time taken from the frame index. Each film is 12 s at 24 fps and runs in four parts: a nebula cold open, the owner's zodiac art forged from particles (`/assets/legacy/sign-<sign>.webp`, read at render time and not copied), the title card, and the closing `Ω SYD OMEGA 91717` sigil.
- `render.js` serves the repo root on a throwaway localhost port and steps the frames headless as PNGs into `$OMEGA_SCRATCHPAD/movie-frames/`. It then encodes them with the system `ffmpeg`: libx264 yuv420p, 1280×720, 24 fps, `+faststart`, and an AAC 64k synthesized drone.
- If a film comes out over 1.5 MB, the script raises CRF and encodes again. It lowers JPEG quality the same way until each poster is at most 120 KB.
