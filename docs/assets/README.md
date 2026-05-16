# Asset Drop Layout

This browser build now supports sprite-first rendering with procedural fallback.

You can drop PNGs into these folders and the game will use them automatically when the filenames match the manifest in [data.js](C:/Users/samcb/OneDrive/Desktop/GAMING/TowerDefense/docs/data.js).

The repo now includes a wired-in free asset pack from Kenney under `docs/assets/sources/kenney-topdown/`, plus the baked game-ready PNGs under the folders below. The original pack license is mirrored at `docs/assets/kenney/LICENSE.txt`.

Expected layout:

```txt
docs/assets/
  towers/
    rifle/base.png
    rifle/rapid.png
    rifle/piercer.png
    missile/base.png
    missile/cluster.png
    missile/bunker.png
    railgun/base.png
    railgun/overcharge.png
    railgun/cycling.png
    emp/base.png
    emp/freeze.png
    emp/breaker.png
    drone/base.png
    drone/interceptor.png
    drone/hunter.png
  enemies/
    scout.png
    carrier.png
    shield.png
    swarm.png
    jammer.png
    splitter.png
    mender.png
    bastion.png
    boss.png
  projectiles/
    rifle.png
    missile.png
    railgun.png
    emp.png
    drone.png
```

Guidelines:

- Transparent PNGs work best.
- Keep each sprite centered on its main body.
- The current live build uses Kenney top-down sprites, so matching a top-down or shallow-angle direction will blend in best.
- If a file is missing, the renderer falls back to the current hand-drawn version.
- If a sprite feels too large or too low/high on the tile, adjust its `width`, `height`, `anchorX`, or `anchorY` in `GAME_DATA.art`.
