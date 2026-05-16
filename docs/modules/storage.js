export const STORAGE_KEY = "iron-grid-defense-save-v3";
const LEGACY_KEYS = ["iron-grid-defense-save-v2"];

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
    version: 3,
    started: state.started,
    paused: state.paused,
    speedIndex: state.speedIndex,
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
      shield: enemy.shield,
      path: enemy.path.map((cell) => ({ x: cell.x, y: cell.y })),
      pathIndex: enemy.pathIndex,
      x: enemy.x,
      y: enemy.y,
      slowUntil: enemy.slowUntil,
      slowMultiplier: enemy.slowMultiplier,
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
  if (rawSave.version === 3) return rawSave;
  if (!rawSave.version || rawSave.version === 2) {
    return {
      ...rawSave,
      version: 3,
      waveCountdown: Number(rawSave.waveCountdown) || 0,
      stats: {
        towersBuilt: Number(rawSave.stats?.towersBuilt) || 0,
        towersSold: Number(rawSave.stats?.towersSold) || 0,
        enemiesDestroyed: Number(rawSave.stats?.enemiesDestroyed) || 0,
        damageDealt: Number(rawSave.stats?.damageDealt) || 0,
        abilitiesUsed: Number(rawSave.stats?.abilitiesUsed) || 0,
        wavesCleared: Number(rawSave.stats?.wavesCleared) || 0,
        saves: Number(rawSave.stats?.saves) || 0,
      },
    };
  }
  return null;
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
