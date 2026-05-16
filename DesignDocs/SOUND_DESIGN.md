# Sound Design

## Direction

Iron Grid Defense should sound like a compact military command interface layered over heavy battlefield machinery.

The current live build uses browser-generated Web Audio cues so the game has sound immediately without external asset loading.

## Current Cue Families

- UI: short tactical clicks for selection and command confirmation.
- Denied actions: low descending error tone.
- Tower deployment and upgrades: mechanical activation pulse.
- Tower fire: distinct signatures for rifle, missile, railgun, EMP, and drone towers.
- Impacts: short filtered noise bursts with stronger hits for explosions and bosses.
- Wave launch: three-step warning alarm.
- Commander abilities: unique stingers for Airstrike, EMP Pulse, and Emergency Repair.
- Base damage: low warning impact.
- Mission end: clear victory or defeat musical cue.

## Rules

- Keep gameplay audio low enough that rapid fire does not become harsh.
- Throttle repeated fire and impact sounds.
- Give each tower a recognizable sound identity.
- Use audio to clarify player feedback: success, denial, danger, and reward.
- Replace generated cues with authored audio assets later only after the gameplay mix is proven.

