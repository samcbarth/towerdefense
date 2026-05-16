export const GAME_DATA = {
  mission: {
    name: "Operation Blackline",
    subtitle: "Military-future WebGL tower defense prototype",
    briefing: "Enemy armor is advancing across the expanded Blackline depot. Build a legal maze through a 30x30 industrial battlefield, choose tower branches, and preserve one route to the base.",
    startCredits: 720,
    baseIntegrity: 100,
  },
  grid: {
    cols: 30,
    rows: 30,
    tileW: 34,
    tileH: 17,
    originX: 640,
    originY: 78,
    spawn: { x: 0, y: 15 },
    base: { x: 29, y: 15 },
    blocked: [
      "14,14", "15,14", "14,15", "15,15",
      "6,6", "23,6", "6,23", "23,23"
    ],
    blockedRects: [
      { x: 4, y: 3, w: 5, h: 2 },
      { x: 11, y: 2, w: 3, h: 4 },
      { x: 20, y: 3, w: 5, h: 2 },
      { x: 3, y: 8, w: 3, h: 5 },
      { x: 9, y: 9, w: 4, h: 2 },
      { x: 17, y: 9, w: 4, h: 2 },
      { x: 24, y: 8, w: 3, h: 5 },
      { x: 6, y: 17, w: 4, h: 2 },
      { x: 12, y: 18, w: 2, h: 5 },
      { x: 16, y: 18, w: 2, h: 5 },
      { x: 20, y: 17, w: 4, h: 2 },
      { x: 4, y: 25, w: 5, h: 2 },
      { x: 11, y: 24, w: 3, h: 3 },
      { x: 20, y: 25, w: 5, h: 2 }
    ],
    terrain: {
      reinforced: ["1,15", "28,15", "28,14", "28,16"],
      hazard: ["13,13", "16,13", "13,16", "16,16"],
      relay: ["6,6", "23,6", "6,23", "23,23"],
      runway: ["0,15", "1,15", "2,15", "3,15", "4,15", "5,15", "6,15", "7,15", "8,15", "9,15", "10,15", "11,15", "12,15", "13,15", "16,15", "17,15", "18,15", "19,15", "20,15", "21,15", "22,15", "23,15", "24,15", "25,15", "26,15", "27,15", "28,15", "29,15"],
    },
    terrainRects: {
      hazard: [
        { x: 13, y: 12, w: 4, h: 1 },
        { x: 13, y: 17, w: 4, h: 1 }
      ],
      reinforced: [
        { x: 0, y: 14, w: 2, h: 3 },
        { x: 28, y: 14, w: 2, h: 3 }
      ],
      runway: [
        { x: 0, y: 14, w: 30, h: 1 },
        { x: 0, y: 16, w: 30, h: 1 }
      ]
    },
  },
  towers: {
    rifle: {
      name: "Rifle Turret",
      cost: 90,
      range: 2.7,
      fireRate: 0.48,
      damage: 18,
      color: "#8fb0bb",
      accent: "#e9f7ff",
      text: "Fast single target",
      role: "Reliable anti-scout fire.",
      branches: {
        rapid: {
          name: "Rapid Fire",
          color: "#91f0ff",
          description: "Higher fire rate and range for shredding light waves.",
          tiers: [
            { cost: 110, fireRateMultiplier: 0.68, rangeBonus: 0.25, damageMultiplier: 1.08 },
            { cost: 185, fireRateMultiplier: 0.52, rangeBonus: 0.45, damageMultiplier: 1.18 }
          ],
        },
        piercer: {
          name: "Armor Piercer",
          color: "#ffd36a",
          description: "Armor bypass rounds for carriers and boss pressure.",
          tiers: [
            { cost: 125, damageMultiplier: 1.35, armorPierce: 5, rangeBonus: 0.15 },
            { cost: 210, damageMultiplier: 1.78, armorPierce: 11, rangeBonus: 0.3 }
          ],
        },
      },
    },
    missile: {
      name: "Missile Battery",
      cost: 150,
      range: 3.1,
      fireRate: 1.12,
      damage: 34,
      splash: 1.1,
      color: "#b6a16b",
      accent: "#ffcf5a",
      text: "Splash damage",
      role: "Breaks clustered swarm waves.",
      branches: {
        cluster: {
          name: "Cluster Warheads",
          color: "#ffdf7e",
          description: "Wider splash and faster reload for swarm control.",
          tiers: [
            { cost: 180, splashBonus: 0.55, fireRateMultiplier: 0.86, damageMultiplier: 1.08 },
            { cost: 285, splashBonus: 1.05, fireRateMultiplier: 0.76, damageMultiplier: 1.18 }
          ],
        },
        bunker: {
          name: "Bunker Buster",
          color: "#ff8f5d",
          description: "Heavy warheads punch armor and hit bosses harder.",
          tiers: [
            { cost: 205, damageMultiplier: 1.45, armorPierce: 8, splashBonus: 0.15 },
            { cost: 325, damageMultiplier: 2.0, armorPierce: 15, bossMultiplier: 1.28 }
          ],
        },
      },
    },
    railgun: {
      name: "Railgun",
      cost: 220,
      range: 4.4,
      fireRate: 1.8,
      damage: 96,
      pierce: true,
      color: "#6c8df0",
      accent: "#b4c8ff",
      text: "Heavy line shot",
      role: "Deletes armored priority targets.",
      branches: {
        overcharge: {
          name: "Overcharge Beam",
          color: "#9bb8ff",
          description: "Massive damage and armor piercing at a slower cadence.",
          tiers: [
            { cost: 250, damageMultiplier: 1.58, armorPierce: 9, fireRateMultiplier: 1.1 },
            { cost: 380, damageMultiplier: 2.25, armorPierce: 19, bossMultiplier: 1.22, fireRateMultiplier: 1.18 }
          ],
        },
        cycling: {
          name: "Capacitor Cycling",
          color: "#75f0ff",
          description: "Faster rail shots with improved range for lane coverage.",
          tiers: [
            { cost: 240, fireRateMultiplier: 0.72, rangeBonus: 0.5, damageMultiplier: 1.12 },
            { cost: 350, fireRateMultiplier: 0.56, rangeBonus: 0.8, damageMultiplier: 1.25 }
          ],
        },
      },
    },
    emp: {
      name: "EMP Spire",
      cost: 130,
      range: 2.6,
      fireRate: 1.35,
      damage: 8,
      slow: 0.42,
      slowTime: 2.4,
      color: "#6ff3d0",
      accent: "#d6fff5",
      text: "Slow support",
      role: "Controls shielded and fast units.",
      branches: {
        freeze: {
          name: "Deep Freeze",
          color: "#9effff",
          description: "Longer, stronger slows for holding enemies in kill zones.",
          tiers: [
            { cost: 150, slowMultiplier: 0.3, slowTimeBonus: 1.7, rangeBonus: 0.25 },
            { cost: 235, slowMultiplier: 0.2, slowTimeBonus: 3.1, rangeBonus: 0.5 }
          ],
        },
        breaker: {
          name: "Shield Breaker",
          color: "#fff4aa",
          description: "Breaks shields and strips armor while still slowing.",
          tiers: [
            { cost: 165, breaksShield: true, armorShred: 5, damageMultiplier: 1.2 },
            { cost: 260, breaksShield: true, armorShred: 10, damageMultiplier: 1.55, slowTimeBonus: 1.0 }
          ],
        },
      },
    },
    drone: {
      name: "Drone Nest",
      cost: 185,
      range: 3.4,
      fireRate: 0.92,
      damage: 26,
      homing: true,
      color: "#c492ff",
      accent: "#f0dcff",
      text: "Flexible pursuit",
      role: "Covers awkward maze angles.",
      branches: {
        interceptor: {
          name: "Interceptor Swarm",
          color: "#e0b6ff",
          description: "Fast drone launches for broad coverage against light units.",
          tiers: [
            { cost: 210, fireRateMultiplier: 0.66, rangeBonus: 0.35, damageMultiplier: 1.08 },
            { cost: 325, fireRateMultiplier: 0.48, rangeBonus: 0.7, damageMultiplier: 1.18 }
          ],
        },
        hunter: {
          name: "Hunter-Killer Drones",
          color: "#ff9cee",
          description: "Hard-hitting drones focus heavy targets and bosses.",
          tiers: [
            { cost: 225, damageMultiplier: 1.48, armorPierce: 5, bossMultiplier: 1.16 },
            { cost: 355, damageMultiplier: 1.95, armorPierce: 10, bossMultiplier: 1.38 }
          ],
        },
      },
    },
  },
  enemies: {
    scout: { name: "Scout", hp: 70, speed: 1.55, reward: 16, color: "#ffcf5a", armor: 0, threat: "Fast" },
    carrier: { name: "Armored Carrier", hp: 220, speed: 0.72, reward: 36, color: "#a8b1b6", armor: 6, threat: "Armored" },
    shield: { name: "Shield Drone", hp: 125, speed: 1.0, reward: 28, color: "#80f6ff", armor: 2, shield: 55, threat: "Shield" },
    swarm: { name: "Swarm Bot", hp: 44, speed: 1.35, reward: 10, color: "#ff9969", armor: 0, threat: "Swarm" },
    jammer: { name: "Jammer", hp: 150, speed: 0.95, reward: 34, color: "#de7dff", armor: 1, jammer: true, threat: "Disruptor" },
    bastion: { name: "Bastion Tank", hp: 390, speed: 0.56, reward: 90, color: "#86a2b1", armor: 8, shield: 65, threat: "Mini-Boss" },
    boss: { name: "Siege Walker", hp: 1400, speed: 0.42, reward: 240, color: "#ff6f5f", armor: 10, boss: true, threat: "Boss" },
  },
  waves: [
    { name: "Recon Probe", reward: 100, groups: [{ type: "scout", count: 8, gap: 0.75 }] },
    { name: "Swarm Screen", reward: 120, groups: [{ type: "scout", count: 8, gap: 0.5 }, { type: "swarm", count: 10, gap: 0.32 }] },
    { name: "Shielded Armor", reward: 140, groups: [{ type: "carrier", count: 5, gap: 0.9 }, { type: "shield", count: 3, gap: 0.85 }] },
    { name: "Signal Jam", reward: 150, groups: [{ type: "swarm", count: 20, gap: 0.22 }, { type: "jammer", count: 3, gap: 1.1 }] },
    { name: "Heavy Push", reward: 185, groups: [{ type: "carrier", count: 6, gap: 0.72 }, { type: "shield", count: 4, gap: 0.68 }, { type: "bastion", count: 1, gap: 0.25 }] },
    { name: "Combined Arms", reward: 205, groups: [{ type: "scout", count: 12, gap: 0.4 }, { type: "jammer", count: 4, gap: 0.78 }, { type: "carrier", count: 6, gap: 0.78 }, { type: "bastion", count: 1, gap: 1.0 }] },
    { name: "Siege Walker", reward: 0, groups: [{ type: "swarm", count: 10, gap: 0.24 }, { type: "boss", count: 1, gap: 0.1 }, { type: "shield", count: 5, gap: 0.62 }, { type: "jammer", count: 2, gap: 1.15 }] },
  ],
  abilities: {
    airstrike: { name: "Airstrike", cooldown: 18, radius: 1.35, damage: 180, color: "#ffcf5a", text: "Area burst" },
    empPulse: { name: "EMP Pulse", cooldown: 15, radius: 1.7, damage: 30, slow: 0.25, slowTime: 4.5, color: "#6ff3d0", text: "Slow and shield break" },
    repair: { name: "Emergency Repair", cooldown: 28, radius: 0, heal: 25, color: "#6ff3a4", text: "Restore base" },
  },
};

if (typeof window !== "undefined") window.GAME_DATA = GAME_DATA;
