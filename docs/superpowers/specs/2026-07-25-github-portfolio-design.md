# GitHub Portfolio Design — teddy8023mars

Date: 2026-07-25 · Status: approved (user delegated remaining decisions)

## Goal

Turn github.com/teddy8023mars into a portfolio serving three purposes, in priority order:
1. **Job hunting** — recruiters must get the picture in 30 seconds
2. **Personal brand** — memorable, shareable, playful
3. **Personal archive** — projects organized and preserved

Positioning: **"Builds real tools with AI agents"** — the portfolio's story is not "I wrote an agent demo" but "I ship macOS apps, trading systems and full-stack platforms, using agents as the workflow."

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Account | `teddy8023mars` (2017 history, keep contribution graph) |
| Repos made public | QuickMD, DeskCat, leetcode-tracker |
| Repo kept private | portfolio-tracker — **real account ID found in git history** (`acc_id` w/ `TrdEnv.REAL`); featured on site without source link |
| Site structure | **A: single-scene isometric studio** (user picked over hub-scenes / controllable-cat-street) |
| Art style | Warm low-poly "the cat's study" + day/night theme (recommended, user delegated) |
| Escape hatch | Non-negotiable: always-visible "Text version" button, WebGL-failure fallback, loader skip after 3 s |

## Architecture

Static site, no build step. `teddy8023mars.github.io` repo → GitHub Pages.

- `index.html` — import map, HUD overlay, panel, loader, text version
- `js/main.js` — one Three.js module: room, lights, themes, raycasting, camera tweens, cat head-tracking
- `vendor/` — three.js r160 + OrbitControls + GLTFLoader (vendored; no CDN dependency)
- `assets/cat.glb` — Quaternius CC0 cat, same model DeskCat uses (236 KB)

### Room = project map

| Object | Project | Interaction |
|---|---|---|
| Desk monitor (markdown page) | QuickMD | click → camera focus + panel |
| Wall screen (live-drawn chart, "DRY_RUN · shadow mode") | Trading bot | click → panel, no repo link (private) |
| Whiteboard (graph + "LC 75 ✓") | leetcode-tracker | click → panel |
| The cat on the desk | DeskCat | head follows cursor — a live demo of DeskCat's core feature |

Decorations: window (sun by day, stars by night), floor lamp (on at night), bookshelf, plant, rug.

### Fallbacks
- No WebGL → text version, permanent
- cat.glb load failure → procedural stand-in cat (spheres + cones)
- Loader stuck → 8 s safety timeout force-finishes; skip button at 3 s
- `prefers-reduced-motion` → no auto-rotate, instant camera cuts

## Profile layer

- `teddy8023mars/teddy8023mars` README: hero screenshot linking to the 3D studio + recruiter-scannable text (projects table, stack, links)
- Pinned: QuickMD, DeskCat, leetcode-tracker, fk_popmart
- Bio + blog URL point at the studio
