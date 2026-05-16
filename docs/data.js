export const GAME_DATA = {
  mission: {
    name: "Operation Blackline",
    subtitle: "Military-future WebGL tower defense prototype",
    briefing: "Enemy armor is advancing across the expanded Blackline depot. Build a legal maze through a 30x30 industrial battlefield, choose tower branches, and preserve one route to the base.",
    startCredits: 720,
    baseIntegrity: 100,
  },
  challenges: {
    standard: {
      name: "Standard",
      description: "Balanced mission rules.",
      scoreMultiplier: 1,
      startCreditsMultiplier: 1,
      enemyHpMultiplier: 1,
      rewardMultiplier: 1,
      noSell: false,
    },
    lowCredit: {
      name: "Lean Budget",
      description: "Start with fewer credits for a higher grade bonus.",
      scoreMultiplier: 1.18,
      startCreditsMultiplier: 0.76,
      enemyHpMultiplier: 1,
      rewardMultiplier: 1.05,
      noSell: false,
    },
    elite: {
      name: "Elite Columns",
      description: "Enemies arrive tougher, but pay slightly better.",
      scoreMultiplier: 1.28,
      startCreditsMultiplier: 1,
      enemyHpMultiplier: 1.18,
      rewardMultiplier: 1.12,
      noSell: false,
    },
    noSell: {
      name: "Locked Emplacements",
      description: "Selling is disabled after towers are placed.",
      scoreMultiplier: 1.22,
      startCreditsMultiplier: 1,
      enemyHpMultiplier: 1,
      rewardMultiplier: 1.08,
      noSell: true,
    },
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
      role: "Reliable anti-scout fire and finisher coverage.",
      branches: {
        rapid: {
          name: "Rapid Fire",
          color: "#91f0ff",
          role: "Anti-swarm sustained fire",
          description: "Higher fire rate, range, and shieldless follow-up for light waves.",
          tiers: [
            { cost: 105, fireRateMultiplier: 0.64, rangeBonus: 0.25, damageMultiplier: 1.02, shieldlessDamageMultiplier: 1.12, priority: "swarm" },
            { cost: 180, fireRateMultiplier: 0.48, rangeBonus: 0.45, damageMultiplier: 1.12, shieldlessDamageMultiplier: 1.22, priority: "swarm" }
          ],
        },
        piercer: {
          name: "Armor Piercer",
          color: "#ffd36a",
          role: "Cheap armor answer",
          description: "Armor bypass rounds for carriers and boss pressure.",
          tiers: [
            { cost: 130, damageMultiplier: 1.32, armorPierce: 6, rangeBonus: 0.12, priority: "armor" },
            { cost: 215, damageMultiplier: 1.7, armorPierce: 12, rangeBonus: 0.25, shreddedDamageMultiplier: 1.12, priority: "armor" }
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
          role: "Swarm and split cleanup",
          description: "Wider splash and faster reload for swarm and splitter cleanup.",
          tiers: [
            { cost: 175, splashBonus: 0.65, fireRateMultiplier: 0.84, damageMultiplier: 1.04, priority: "swarm" },
            { cost: 295, splashBonus: 1.2, fireRateMultiplier: 0.72, damageMultiplier: 1.12, priority: "swarm" }
          ],
        },
        bunker: {
          name: "Bunker Buster",
          color: "#ff8f5d",
          role: "Armor and boss burst",
          description: "Heavy warheads punch armor, exploit slows, and hit bosses harder.",
          tiers: [
            { cost: 205, damageMultiplier: 1.42, armorPierce: 8, splashBonus: 0.1, slowDamageMultiplier: 1.16, priority: "armor" },
            { cost: 335, damageMultiplier: 1.92, armorPierce: 16, bossMultiplier: 1.3, slowDamageMultiplier: 1.24, priority: "boss" }
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
          role: "Boss and shredded armor execution",
          description: "Massive damage and armor piercing at a slower cadence.",
          tiers: [
            { cost: 250, damageMultiplier: 1.55, armorPierce: 10, shreddedDamageMultiplier: 1.18, fireRateMultiplier: 1.1, priority: "armor" },
            { cost: 390, damageMultiplier: 2.15, armorPierce: 20, bossMultiplier: 1.24, shreddedDamageMultiplier: 1.32, fireRateMultiplier: 1.18, priority: "boss" }
          ],
        },
        cycling: {
          name: "Capacitor Cycling",
          color: "#75f0ff",
          role: "Long-range lane coverage",
          description: "Faster rail shots with improved range for wide lane coverage.",
          tiers: [
            { cost: 230, fireRateMultiplier: 0.7, rangeBonus: 0.5, damageMultiplier: 1.1 },
            { cost: 345, fireRateMultiplier: 0.54, rangeBonus: 0.85, damageMultiplier: 1.24 }
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
          role: "Kill-zone control",
          description: "Longer, stronger slows for holding enemies in missile kill zones.",
          tiers: [
            { cost: 145, slowMultiplier: 0.3, slowTimeBonus: 1.9, rangeBonus: 0.25, priority: "support" },
            { cost: 240, slowMultiplier: 0.2, slowTimeBonus: 3.4, rangeBonus: 0.55, priority: "support" }
          ],
        },
        breaker: {
          name: "Shield Breaker",
          color: "#fff4aa",
          role: "Shield break and armor shred",
          description: "Breaks shields and leaves armor shredded for other towers.",
          tiers: [
            { cost: 165, breaksShield: true, armorShred: 5, damageMultiplier: 1.15, slowTimeBonus: 0.4, priority: "armor" },
            { cost: 265, breaksShield: true, armorShred: 11, damageMultiplier: 1.45, slowTimeBonus: 1.3, priority: "armor" }
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
          role: "Map-wide fast response",
          description: "Fast drone launches for broad coverage against light and support units.",
          tiers: [
            { cost: 205, fireRateMultiplier: 0.66, rangeBonus: 0.4, damageMultiplier: 1.06, priority: "support" },
            { cost: 320, fireRateMultiplier: 0.48, rangeBonus: 0.75, damageMultiplier: 1.16, priority: "support" }
          ],
        },
        hunter: {
          name: "Hunter-Killer Drones",
          color: "#ff9cee",
          role: "Boss pursuit and armor cleanup",
          description: "Hard-hitting drones exploit shredded armor and focus heavies.",
          tiers: [
            { cost: 225, damageMultiplier: 1.42, armorPierce: 5, bossMultiplier: 1.16, shreddedDamageMultiplier: 1.14, priority: "armor" },
            { cost: 360, damageMultiplier: 1.86, armorPierce: 11, bossMultiplier: 1.38, shreddedDamageMultiplier: 1.26, priority: "boss" }
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
    splitter: { name: "Splitter Node", hp: 118, speed: 1.05, reward: 24, color: "#f6b05d", armor: 1, splitInto: { type: "swarm", count: 3, hpMultiplier: 0.75, rewardMultiplier: 0.45 }, threat: "Splits" },
    mender: { name: "Field Mender", hp: 175, speed: 0.82, reward: 44, color: "#6ff3a4", armor: 2, repairAura: true, regen: 5, threat: "Support" },
    bastion: { name: "Bastion Tank", hp: 390, speed: 0.56, reward: 90, color: "#86a2b1", armor: 8, shield: 65, threat: "Mini-Boss" },
    boss: { name: "Siege Walker", hp: 1400, speed: 0.42, reward: 240, color: "#ff6f5f", armor: 10, boss: true, threat: "Boss" },
  },
  waves: [
    { name: "Recon Probe", intel: "Fast openers", reward: 100, groups: [{ type: "scout", count: 8, gap: 0.72 }] },
    { name: "Swarm Screen", intel: "Splash check", reward: 120, groups: [{ type: "scout", count: 7, gap: 0.48 }, { type: "swarm", count: 12, gap: 0.3 }] },
    { name: "Shielded Armor", intel: "Pierce or shield break", reward: 145, groups: [{ type: "carrier", count: 5, gap: 0.86 }, { type: "shield", count: 4, gap: 0.78 }] },
    { name: "Signal Jam", intel: "Support target priority", reward: 160, groups: [{ type: "swarm", count: 18, gap: 0.22 }, { type: "jammer", count: 3, gap: 1.0 }, { type: "splitter", count: 2, gap: 0.75 }] },
    { name: "Repair Column", intel: "Kill support before heavies", reward: 180, groups: [{ type: "mender", count: 3, gap: 1.0 }, { type: "carrier", count: 6, gap: 0.72 }, { type: "shield", count: 4, gap: 0.64 }] },
    { name: "Heavy Push", intel: "Mini-boss armor test", reward: 205, groups: [{ type: "carrier", count: 6, gap: 0.68 }, { type: "splitter", count: 4, gap: 0.52 }, { type: "bastion", count: 1, gap: 0.25 }] },
    { name: "Combined Arms", intel: "Everything at once", reward: 230, groups: [{ type: "scout", count: 10, gap: 0.38 }, { type: "jammer", count: 3, gap: 0.78 }, { type: "mender", count: 2, gap: 0.9 }, { type: "carrier", count: 6, gap: 0.72 }, { type: "bastion", count: 1, gap: 1.0 }] },
    { name: "Siege Walker", intel: "Final boss with escorts", reward: 0, groups: [{ type: "swarm", count: 8, gap: 0.22 }, { type: "boss", count: 1, gap: 0.1 }, { type: "shield", count: 5, gap: 0.58 }, { type: "jammer", count: 2, gap: 1.05 }, { type: "mender", count: 2, gap: 1.1 }] },
  ],
  art: {
    mode: "auto",
    towers: {
      rifle: {
        base: { src: "assets/towers/rifle/base.png", width: 46, height: 60, anchorX: 0.5, anchorY: 0.82 },
        branches: {
          rapid: { src: "assets/towers/rifle/rapid.png", width: 50, height: 60, anchorX: 0.5, anchorY: 0.82 },
          piercer: { src: "assets/towers/rifle/piercer.png", width: 50, height: 64, anchorX: 0.5, anchorY: 0.84 },
        },
      },
      missile: {
        base: { src: "assets/towers/missile/base.png", width: 60, height: 54, anchorX: 0.5, anchorY: 0.78 },
        branches: {
          cluster: { src: "assets/towers/missile/cluster.png", width: 62, height: 56, anchorX: 0.5, anchorY: 0.78 },
          bunker: { src: "assets/towers/missile/bunker.png", width: 60, height: 60, anchorX: 0.5, anchorY: 0.8 },
        },
      },
      railgun: {
        base: { src: "assets/towers/railgun/base.png", width: 56, height: 76, anchorX: 0.5, anchorY: 0.88 },
        branches: {
          overcharge: { src: "assets/towers/railgun/overcharge.png", width: 64, height: 84, anchorX: 0.5, anchorY: 0.9 },
          cycling: { src: "assets/towers/railgun/cycling.png", width: 64, height: 78, anchorX: 0.5, anchorY: 0.88 },
        },
      },
      emp: {
        base: { src: "assets/towers/emp/base.png", width: 52, height: 72, anchorX: 0.5, anchorY: 0.86 },
        branches: {
          freeze: { src: "assets/towers/emp/freeze.png", width: 58, height: 76, anchorX: 0.5, anchorY: 0.86 },
          breaker: { src: "assets/towers/emp/breaker.png", width: 58, height: 74, anchorX: 0.5, anchorY: 0.86 },
        },
      },
      drone: {
        base: { src: "assets/towers/drone/base.png", width: 58, height: 58, anchorX: 0.5, anchorY: 0.7 },
        branches: {
          interceptor: { src: "assets/towers/drone/interceptor.png", width: 64, height: 60, anchorX: 0.5, anchorY: 0.7 },
          hunter: { src: "assets/towers/drone/hunter.png", width: 60, height: 60, anchorX: 0.5, anchorY: 0.72 },
        },
      },
    },
    enemies: {
      scout: { src: "assets/enemies/scout.png", width: 34, height: 24, anchorX: 0.5, anchorY: 0.68 },
      carrier: { src: "assets/enemies/carrier.png", width: 38, height: 28, anchorX: 0.5, anchorY: 0.76 },
      shield: { src: "assets/enemies/shield.png", width: 34, height: 28, anchorX: 0.5, anchorY: 0.72 },
      swarm: { src: "assets/enemies/swarm.png", width: 22, height: 18, anchorX: 0.5, anchorY: 0.66 },
      jammer: { src: "assets/enemies/jammer.png", width: 34, height: 30, anchorX: 0.5, anchorY: 0.76 },
      splitter: { src: "assets/enemies/splitter.png", width: 30, height: 28, anchorX: 0.5, anchorY: 0.74 },
      mender: { src: "assets/enemies/mender.png", width: 34, height: 32, anchorX: 0.5, anchorY: 0.78 },
      bastion: { src: "assets/enemies/bastion.png", width: 46, height: 34, anchorX: 0.5, anchorY: 0.8 },
      boss: { src: "assets/enemies/boss.png", width: 72, height: 64, anchorX: 0.5, anchorY: 0.84 },
    },
    projectiles: {
      rifle: { src: "assets/projectiles/rifle.png", width: 12, height: 12, anchorX: 0.5, anchorY: 0.5 },
      missile: { src: "assets/projectiles/missile.png", width: 18, height: 18, anchorX: 0.5, anchorY: 0.5 },
      railgun: { src: "assets/projectiles/railgun.png", width: 16, height: 16, anchorX: 0.5, anchorY: 0.5 },
      emp: { src: "assets/projectiles/emp.png", width: 18, height: 18, anchorX: 0.5, anchorY: 0.5 },
      drone: { src: "assets/projectiles/drone.png", width: 16, height: 16, anchorX: 0.5, anchorY: 0.5 },
    },
  },
  abilities: {
    airstrike: { name: "Airstrike", cooldown: 18, radius: 1.35, damage: 180, color: "#ffcf5a", text: "Area burst" },
    empPulse: { name: "EMP Pulse", cooldown: 15, radius: 1.7, damage: 30, slow: 0.25, slowTime: 4.5, color: "#6ff3d0", text: "Slow and shield break" },
    repair: { name: "Emergency Repair", cooldown: 28, radius: 0, heal: 25, color: "#6ff3a4", text: "Restore base" },
  },
};

if (typeof window !== "undefined") window.GAME_DATA = GAME_DATA;
