### A 3D Chronos Omega Tree, drawn from the owner's blueprint board and the canon's five-dimensional lattice (2026-11-15)

**Why.** The owner asked that the supplied images and videos *inspire* new work, built for real in 3D and 5D, not copied as flat pictures. I looked at `assets/concept/board-01.jpg` (the unified blueprint: a golden twin helix grown as a tree around an Omega axis, nine stages, twelve houses), `reel-01.jpg`, `assets/movies/franchise-01.jpg` and `assets/legacy/sign-leo.webp`. The platform's 3-D layer (`omega-sculpture.js`) had no scene for the board's central image.

**"5D" is the canon's, not mine.** `omega-canon.json` `nine_fold` defines a five-dimensional 9x9x9x9x9 lattice of 59,049 nodes. The scene carries it as: three axes place a node in a cube, the fourth coordinate rotates the cube about the trunk, the fifth is nine nested shells (gold inside, cyan outside). Time is the motion: the nine stages pulse as a wave. That is one reading of the canon's definition; I did not find a canon rule for how to draw it, so the mapping is mine and stated in the file header.

**Fix.** `SCENES.chronos` in `omega-sculpture.js`, mounted on `sculpture.html`:
- a twin helix (gold and cyan tubes) with the canon's radius profile of a tree (root flare, narrow waist, spreading crown), nine stage nodes on the axis with rungs between the strands, a crown of twelve house medallions that face the viewer, and a sampled projection of the lattice;
- **every 20th lattice node is drawn: 2,953 of 59,049.** Drawing all would cost the page and show nothing more. The caption says so and the count is published as `scene.count`;
- nothing about the member is invented: a stage is lit and a marker drawn only from measured tier progress (`OmegaSculptureDataViz` or `opt.tierProgress`), and a sign is highlighted only if the mount names one with `data-sculpt-sign`;
- no picture is loaded; every shape is built in code. It shares the single WebGL context, the reduced-motion handling and the 2-D fallback of the existing layer.
- `scripts/tests/test_chronos_scene.py` (5 tests) pins all of that.

**Verified.**
- Headless Chromium, real WebGL: `OmegaSculpture.scenes` lists `chronos`; status `live: true`, `records: 2953` (= ceil(59049/20), computed independently), `links: 21` (9 stages + 12 houses), **0 console errors**.
- Phone (390x844, mobile): live, buffer 640x920 against box 320x460 (buffer >= box). Reduced motion: live, static pose. WebGL forced absent: `fallback: true`, no dead box, 0 errors.
- I looked at the rendered frames. First render: the roots ran into the caption and the crown read edge-on as a line. Fixed by raising the camera and turning each medallion to face the viewer; re-rendered and re-read.
- Member state: with `OmegaSculptureDataViz` at 60% and `data-sculpt-sign="Leo"`, bright pixels were 1653-1986 over four runs against 1204-1490 over four runs with no state. The ranges do not overlap. **The sample is small and the layer's own noise is about +-14%** (`CLAUDE.md` section 8.4), so read this as "the state path draws something", not as a measured effect size.
- Mutation run on the test: a different stride, an always-visible marker, a random position and a texture loader are each caught.

**Not done / not verified.**
- The `degraded: true` flag appeared in headless runs: `frameMs` was 220-300 here because the browser renders in software. I have not measured it on a real GPU, so I cannot say how it performs for a member.
- The trunk is narrower than the tree on the board, and the board's dense circuit and chart detail is not drawn. It is inspired by the board, not a reproduction.
- No video was used. I looked at stills only; the 12 series and 12 movie clips and the demo reel were not analysed.
- The "6 scenes" count in `CLAUDE.md` section 4 was already stale (the layer has ten scenes now); I did not edit that file, which sits at its token budget.
- The deployed site could not be viewed from this session.
