# Asset Drop Layout

This browser build now supports sprite-first rendering with procedural fallback.

You can drop PNGs into these folders and the game will use them automatically when the filenames match the manifest in [data.js](C:/Users/samcb/OneDrive/Desktop/GAMING/TowerDefense/docs/data.js).

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
- Tower sprites should face the same general isometric direction as the current procedural art.
- If a file is missing, the renderer falls back to the current hand-drawn version.
- If a sprite feels too large or too low/high on the tile, adjust its `width`, `height`, `anchorX`, or `anchorY` in `GAME_DATA.art`.
