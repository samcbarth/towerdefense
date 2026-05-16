export const STORAGE_KEY = "iron-grid-defense-save-v4";
const LEGACY_KEYS = ["iron-grid-defense-save-v3", "iron-grid-defense-save-v2"];
export const ART_THEME_KEY = "iron-grid-defense-art-theme-v1";
const VALID_ART_THEMES = new Set(["sprites", "classic"]);

function normalizeArtTheme(theme) {
  if (theme === "auto") return "sprites";
  return VALID_ART_THEMES.has(theme) ? theme : "sprites";
}

export function hasSavedGame(storage = localStorage) {
  try {
    return Boolean(storage.getItem(STORAGE_KEY) || LEGACY_KEYS.some((key) => storage.getItem(key)));
  } catch {
    return false;
  }
}

export function clearSavedGame(storage = localStorage) {
  try {
    storage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage may be unavailable in private or embedded contexts.
  }
}

export function snapshotAbilityCooldowns(state, abilityDefs, now = performance.now() / 1000) {
  const clock = state.paused && state.pauseStartedAt ? state.pauseStartedAt : now;
  return Object.fromEntries(
    Object.entries(abilityDefs).map(([key, ability]) => [key, Math.max(0, (ability.readyAt || 0) - clock)])
  );
}

export function restoreAbilityCooldowns(abilityDefs, cooldowns = {}, now = performance.now() / 1000) {
  Object.entries(abilityDefs).forEach(([key, ability]) => {
    const remaining = Number(cooldowns[key] || 0);
    ability.readyAt = remaining > 0 ? now + remaining : 0;
  });
}

export function serializeState(state, abilityDefs, manual = false) {
  const saveStats = {
    ...state.stats,
    saves: manual ? state.stats.saves + 1 : state.stats.saves,
  };

  return {
    version: 4,
    artTheme: normalizeArtTheme(state.artTheme),
    started: state.started,
    paused: state.paused,
    speedIndex: state.speedIndex,
    challengeKey: state.challengeKey || "standard",
    credits: state.credits,
    base: state.base,
    waveIndex: state.waveIndex,
    waveActive: state.waveActive,
    waveCountdown: state.waveCountdown,
    spawnQueue: state.spawnQueue.map((item) => ({ ...item })),
    spawnTimer: state.spawnTimer,
    towers: state.towers.map((tower) => ({
      type: tower.type,
      x: tower.x,
      y: tower.y,
      level: tower.level,
      branch: tower.branch,
      cooldown: tower.cooldown,
    })),
    enemies: state.enemies.map((enemy) => ({
      type: enemy.type,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      reward: enemy.reward,
      shield: enemy.shield,
      maxShield: enemy.maxShield,
      path: enemy.path.map((cell) => ({ x: cell.x, y: cell.y })),
      pathIndex: enemy.pathIndex,
      x: enemy.x,
      y: enemy.y,
      slowUntil: enemy.slowUntil,
      slowMultiplier: enemy.slowMultiplier,
      armorShred: enemy.armorShred,
      armorShredUntil: enemy.armorShredUntil,
      splitDepth: enemy.splitDepth,
      reached: enemy.reached,
    })),
    selectedTowerType: state.selectedTowerType,
    selectedAbility: state.selectedAbility,
    message: state.message,
    log: state.log,
    stats: saveStats,
    cooldowns: snapshotAbilityCooldowns(state, abilityDefs),
  };
}

export function migrateSave(rawSave) {
  if (!rawSave || typeof rawSave !== "object") return null;
  if (rawSave.version === 4) {
    return {
      ...rawSave,
      artTheme: normalizeArtTheme(rawSave.artTheme),
    };
  }
  if (!rawSave.version || rawSave.version === 2 || rawSave.version === 3) {
    return {
      ...rawSave,
      version: 4,
      artTheme: normalizeArtTheme(rawSave.artTheme),
      waveCountdown: Number(rawSave.waveCountdown) || 0,
      stats: {
      towersBuilt: Number(rawSave.stats?.towersBuilt) || 0,
      towersSold: Number(rawSave.stats?.towersSold) || 0,
      upgradesPurchased: Number(rawSave.stats?.upgradesPurchased) || 0,
      enemiesDestroyed: Number(rawSave.stats?.enemiesDestroyed) || 0,
      enemiesLeaked: Number(rawSave.stats?.enemiesLeaked) || 0,
      baseDamageTaken: Number(rawSave.stats?.baseDamageTaken) || 0,
      damageDealt: Number(rawSave.stats?.damageDealt) || 0,
        abilitiesUsed: Number(rawSave.stats?.abilitiesUsed) || 0,
        wavesCleared: Number(rawSave.stats?.wavesCleared) || 0,
        saves: Number(rawSave.stats?.saves) || 0,
      },
    };
  }
  return null;
}

export function isTerminalSave(save, totalWaves) {
  if (!save || typeof save !== "object") return false;
  if (Number(save.base) <= 0) return true;

  const waveIndex = Number(save.waveIndex);
  const waveActive = Boolean(save.waveActive);
  const spawnQueue = Array.isArray(save.spawnQueue) ? save.spawnQueue : [];
  const enemies = Array.isArray(save.enemies) ? save.enemies : [];

  return waveIndex >= totalWaves && !waveActive && spawnQueue.length === 0 && enemies.length === 0;
}

export function readSavedGame(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY) || LEGACY_KEYS.map((key) => storage.getItem(key)).find(Boolean);
    return raw ? migrateSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeSavedGame(payload, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readArtTheme(storage = localStorage) {
  try {
    const value = storage.getItem(ART_THEME_KEY);
    return value ? normalizeArtTheme(value) : null;
  } catch {
    return null;
  }
}

export function writeArtTheme(theme, storage = localStorage) {
  try {
    storage.setItem(ART_THEME_KEY, normalizeArtTheme(theme));
  } catch {
    // Storage may be unavailable in private or embedded contexts.
  }
}
