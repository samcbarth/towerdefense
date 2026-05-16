# Build And Test

## Current Browser Build

The current playable build is served from `/docs`.

Run locally:

```powershell
python -m http.server 8080 -d docs
```

Open:

```txt
http://localhost:8080
```

## GitHub Pages

Configure GitHub Pages to serve from:

```txt
main branch /docs folder
```

## Unity Target

Install Unity Hub and Unity 6.3 LTS. Create or open a Unity project in this folder, then migrate the browser prototype systems into the C# scaffold in `Assets/Scripts`.

## Healthy Build Check

For the current browser build:
- Page loads without console errors.
- Start button begins the mission.
- Towers can be placed.
- Waves spawn.
- Victory/defeat appears.

