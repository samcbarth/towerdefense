# Tower Defense

A fresh military-future 2.5D tower defense project designed for Unity + C# production and immediate GitHub Pages playtesting.

## Live Build

The playable browser build lives in `/docs` so GitHub Pages can serve it from the `main` branch.

After pushing to GitHub:
1. Open the repository settings.
2. Go to Pages.
3. Set source to `Deploy from a branch`.
4. Select branch `main` and folder `/docs`.
5. Open the published Pages URL.

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

## Manual Release Flow

1. Test the game locally.
2. Update `/docs` with the latest playable build.
3. Commit source and `/docs`.
4. Push to GitHub.
5. Verify the GitHub Pages URL loads and starts a mission.

