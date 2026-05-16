# Tower Defense

A fresh military-future 2.5D tower defense project designed for Unity + C# production and immediate GitHub Pages playtesting.

## Live Build

The recommended public URL is the baseline GitHub Pages repository URL, not a visible `/docs` redirect. Keep the Pages source set to `/docs` so GitHub serves the game at the clean repo URL, for example `https://<user>.github.io/<repo>/`.

The root `index.html` also loads the same `/docs` assets directly as a safety fallback. If Pages is accidentally pointed at the repo root, players still get the game instead of being bounced to `/docs/`.

After pushing to GitHub:
1. Open the repository settings.
2. Go to Pages.
3. Set source to `Deploy from a branch`.
4. Select branch `main` and folder `/docs`.
5. Open the published Pages URL and confirm it stays on the baseline repo URL while loading the game.

## Current Playable

The current `/docs` build is a standalone WebGL-style browser prototype:
- Open-grid mazing with path validation
- Five data-driven tower types
- Six enemy types
- Wave economy and upgrades
- Commander abilities: Airstrike, EMP Pulse, Emergency Repair
- Victory/defeat loop

## Future Unity Target

When Unity is installed, use Unity 6.3 LTS with URP and port the `/docs` prototype behavior into the C# scaffolding under `Assets/Scripts`.

## Local Browser Test

From the project root:

```powershell
python -m http.server 8080 -d docs
```

Then open:

```txt
http://localhost:8080
```

To test the root fallback shell:

```powershell
python -m http.server 8081
```

Then open:

```txt
http://localhost:8081
```

## Manual Release Flow

1. Test the game locally.
2. Update `/docs` with the latest playable build.
3. Commit source and `/docs`.
4. Push to GitHub.
5. Verify the GitHub Pages URL loads and starts a mission.

## Manual QA Checklist

Before release, run through these browser checks:

1. Start a mission and confirm the battlefield, HUD, and mission briefing fit on desktop and mobile widths.
2. Select a tower and hover several tiles: valid, blocked, occupied, spawn/base, enemy-occupied, and path-breaking previews should be visually distinct.
3. Build a legal maze, then confirm path-blocking placement is rejected.
4. Select a tower, verify the stat panel, choose a branch upgrade, and confirm range, damage, fire rate, next cost, and sell value update.
5. Launch each wave, confirm the countdown banner appears, and use pause/resume plus speed toggle during combat.
6. Save, refresh, load, and confirm towers, enemies, credits, wave state, and cooldowns restore without crashing.
7. Trigger base damage and confirm the red pulse appears.
8. Finish both defeat and victory flows and confirm the mission summary is readable.
9. Open `?debug=1` locally and confirm the debug credits, skip wave, and clear save buttons work.
10. Start each challenge mode once and confirm credits, sell rules, enemy durability, scoring, and restart behavior match the selected mode.
