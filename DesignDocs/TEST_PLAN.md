# Test Plan

## Smoke Test

- Open `/docs/index.html` through a local static server.
- Confirm the main menu loads.
- Start the mission.

## Feature Tests

- Place each tower type.
- Attempt to block the only path and confirm placement is rejected.
- Upgrade and sell a tower.
- Use Airstrike, EMP Pulse, and Emergency Repair.
- Survive through the boss wave.

## Regression Tests

- Refreshing the browser returns to the menu.
- Credits, base integrity, and wave counters update correctly.
- Full boss wave remains responsive.
- Victory and defeat overlays work.

