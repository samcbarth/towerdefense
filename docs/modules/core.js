export function expandRectCells(rects = []) {
  const cells = [];
  rects.forEach((rect) => {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        cells.push(`${x},${y}`);
      }
    }
  });
  return cells;
}

export function createGrid(gridData) {
  const terrainCells = Object.fromEntries(
    Object.entries(gridData.terrain || {}).map(([key, cells]) => [key, [...cells]])
  );

  Object.entries(gridData.terrainRects || {}).forEach(([key, rects]) => {
    terrainCells[key] = [...(terrainCells[key] || []), ...expandRectCells(rects)];
  });

  return {
    ...gridData,
    blocked: new Set([...(gridData.blocked || []), ...expandRectCells(gridData.blockedRects)]),
    terrain: Object.fromEntries(
      Object.entries(terrainCells).map(([key, cells]) => [key, new Set(cells)])
    ),
  };
}

export function createStats() {
  return {
    towersBuilt: 0,
    towersSold: 0,
    upgradesPurchased: 0,
    enemiesDestroyed: 0,
    enemiesLeaked: 0,
    baseDamageTaken: 0,
    damageDealt: 0,
    abilitiesUsed: 0,
    wavesCleared: 0,
    saves: 0,
  };
}

export function cellKey(x, y) {
  return `${x},${y}`;
}

export function centerOf(grid, cell) {
  return {
    x: grid.originX + (cell.x - cell.y) * grid.tileW / 2,
    y: grid.originY + (cell.x + cell.y) * grid.tileH / 2,
  };
}

export function screenToCell(grid, mx, my) {
  const dx = mx - grid.originX;
  const dy = my - grid.originY;
  const x = Math.floor(dy / grid.tileH + dx / grid.tileW);
  const y = Math.floor(dy / grid.tileH - dx / grid.tileW);
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return null;
  return { x, y };
}

export function makeTower(towerDefs, type, x, y) {
  return {
    type,
    x,
    y,
    level: 1,
    branch: null,
    cooldown: 0,
    def: towerDefs[type],
  };
}

export function branchData(tower) {
  if (!tower.branch || !tower.def.branches) return null;
  return tower.def.branches[tower.branch];
}

export function branchTier(tower) {
  const branch = branchData(tower);
  if (!branch) return null;
  return branch.tiers[Math.max(0, tower.level - 2)] || null;
}

export function towerUpgradeCost(tower, branchKey = tower.branch) {
  if (tower.def.branches && tower.level === 1 && branchKey) {
    return tower.def.branches[branchKey].tiers[0].cost;
  }
  if (tower.def.branches && tower.level === 2 && branchKey) {
    return tower.def.branches[branchKey].tiers[1].cost;
  }
  return Math.round(tower.def.cost * (0.72 + tower.level * 0.52));
}

export function towerSellValue(tower) {
  return Math.round(tower.def.cost * (0.5 + tower.level * 0.18));
}

export function towerStats(tower) {
  const scale = 1 + (tower.level - 1) * 0.34;
  const tier = branchTier(tower);
  const stats = {
    range: tower.def.range + (tower.level - 1) * 0.22,
    fireRate: Math.max(0.22, tower.def.fireRate * (1 - (tower.level - 1) * 0.12)),
    damage: tower.def.damage * scale,
    splash: tower.def.splash || 0,
    slow: tower.def.slow,
    slowTime: tower.def.slowTime,
    pierce: tower.def.pierce,
    homing: tower.def.homing,
    armorPierce: 0,
    bossMultiplier: 1,
    breaksShield: false,
    armorShred: 0,
    slowDamageMultiplier: 1,
    shreddedDamageMultiplier: 1,
    shieldlessDamageMultiplier: 1,
    priority: tower.def.priority || "nearest",
    color: tower.def.color,
    accent: tower.def.accent,
  };
  if (!tier) return stats;

  stats.range += tier.rangeBonus || 0;
  stats.fireRate = Math.max(0.18, stats.fireRate * (tier.fireRateMultiplier || 1));
  stats.damage *= tier.damageMultiplier || 1;
  stats.splash += tier.splashBonus || 0;
  stats.slow = tier.slowMultiplier ?? stats.slow;
  stats.slowTime = (stats.slowTime || 0) + (tier.slowTimeBonus || 0);
  stats.armorPierce = tier.armorPierce || 0;
  stats.bossMultiplier = tier.bossMultiplier || 1;
  stats.breaksShield = Boolean(tier.breaksShield);
  stats.armorShred = tier.armorShred || 0;
  stats.slowDamageMultiplier = tier.slowDamageMultiplier || stats.slowDamageMultiplier;
  stats.shreddedDamageMultiplier = tier.shreddedDamageMultiplier || stats.shreddedDamageMultiplier;
  stats.shieldlessDamageMultiplier = tier.shieldlessDamageMultiplier || stats.shieldlessDamageMultiplier;
  stats.priority = tier.priority || stats.priority;
  stats.accent = branchData(tower).color || stats.accent;
  return stats;
}

export function effectiveTowerStats(tower, target, now = performance.now() / 1000) {
  const stats = towerStats(tower);
  const targetSlowed = target && target.slowUntil && now < target.slowUntil;
  const targetShredded = target && target.armorShredUntil && now < target.armorShredUntil && target.armorShred > 0;
  const targetShieldless = target && (target.def.shield || 0) > 0 && target.shield <= 0;

  return {
    ...stats,
    damage: stats.damage
      * (targetSlowed ? stats.slowDamageMultiplier : 1)
      * (targetShredded ? stats.shreddedDamageMultiplier : 1)
      * (targetShieldless ? stats.shieldlessDamageMultiplier : 1),
  };
}

export function scoreEnemyForTower(tower, enemy, distanceTiles, now = performance.now() / 1000) {
  const stats = towerStats(tower);
  let score = distanceTiles;
  if (stats.priority === "armor") score -= Math.min(8, enemy.def.armor || 0) * 0.28;
  if (stats.priority === "boss" && (enemy.def.boss || enemy.def.threat === "Mini-Boss")) score -= 2.2;
  if (stats.priority === "swarm" && enemy.def.threat === "Swarm") score -= 1.4;
  if (stats.priority === "support" && (enemy.def.jammer || enemy.def.repairAura)) score -= 2.0;
  if (enemy.slowUntil && now < enemy.slowUntil) score -= 0.25;
  return score;
}

export function isOccupied(state, x, y, ignoreTower = null) {
  return state.towers.some((tower) => tower !== ignoreTower && tower.x === x && tower.y === y);
}

export function isEnemyOnCell(grid, state, x, y) {
  return state.enemies.some((enemy) => {
    const cell = screenToCell(grid, enemy.x, enemy.y);
    return cell && cell.x === x && cell.y === y;
  });
}

export function isBuildable(grid, state, x, y) {
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return false;
  if (cellKey(x, y) === cellKey(grid.spawn.x, grid.spawn.y)) return false;
  if (cellKey(x, y) === cellKey(grid.base.x, grid.base.y)) return false;
  if (grid.blocked.has(cellKey(x, y))) return false;
  if (isEnemyOnCell(grid, state, x, y)) return false;
  return !isOccupied(state, x, y);
}

export function terrainHas(grid, type, key) {
  return grid.terrain[type] && grid.terrain[type].has(key);
}

export function findPathFrom(grid, state, start, extraBlock = null) {
  const goal = grid.base;
  const open = [start];
  const cameFrom = new Map();
  const visited = new Set([cellKey(start.x, start.y)]);
  const blocks = new Set([...grid.blocked]);

  state.towers.forEach((tower) => blocks.add(cellKey(tower.x, tower.y)));
  if (extraBlock) blocks.add(cellKey(extraBlock.x, extraBlock.y));

  while (open.length) {
    const current = open.shift();
    if (current.x === goal.x && current.y === goal.y) {
      const path = [goal];
      let cursor = cellKey(goal.x, goal.y);
      while (cameFrom.has(cursor)) {
        const prev = cameFrom.get(cursor);
        path.unshift(prev);
        cursor = cellKey(prev.x, prev.y);
      }
      return path;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const next of neighbors) {
      const key = cellKey(next.x, next.y);
      if (next.x < 0 || next.y < 0 || next.x >= grid.cols || next.y >= grid.rows) continue;
      if (blocks.has(key) && key !== cellKey(goal.x, goal.y)) continue;
      if (visited.has(key)) continue;
      visited.add(key);
      cameFrom.set(key, current);
      open.push(next);
    }
  }

  return null;
}

export function findPath(grid, state, extraBlock = null) {
  return findPathFrom(grid, state, grid.spawn, extraBlock);
}

export function currentPath(grid, state) {
  return findPath(grid, state) || [grid.spawn, grid.base];
}

export function refreshEnemyPaths(grid, state) {
  for (const enemy of state.enemies) {
    const currentCell = screenToCell(grid, enemy.x, enemy.y) || enemy.path[enemy.pathIndex] || grid.spawn;
    const path = findPathFrom(grid, state, currentCell);
    if (path) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
  }
}

export function describeWave(waves, enemyDefs, index) {
  const wave = waves[index];
  if (!wave) return "Mission complete";
  return wave.groups
    .map((group) => `${group.count} ${enemyDefs[group.type].name}`)
    .join(" + ");
}

export function describeWaveTraits(waves, enemyDefs, index) {
  const wave = waves[index];
  if (!wave) return "No more threats scheduled.";
  const traits = new Set();
  if (wave.intel) traits.add(wave.intel);
  wave.groups.forEach((group) => {
    const def = enemyDefs[group.type];
    if (def.threat) traits.add(def.threat);
    if (def.boss) traits.add("Boss");
    if (def.jammer) traits.add("Disruptor");
    if (def.repairAura) traits.add("Support");
    if (def.splitInto) traits.add("Splits");
    if (def.regen) traits.add("Regenerates");
    if (def.shield) traits.add("Shielded");
    if ((def.armor || 0) >= 6) traits.add("Armored");
  });
  return traits.size ? `Traits: ${Array.from(traits).join(" / ")}` : "Traits: Standard assault";
}

export function classifyBuildCell(grid, state, cell) {
  if (!cell) return { type: "none", label: "Out of bounds" };
  const key = cellKey(cell.x, cell.y);
  if (key === cellKey(grid.spawn.x, grid.spawn.y)) return { type: "reserved", label: "Spawn route" };
  if (key === cellKey(grid.base.x, grid.base.y)) return { type: "reserved", label: "Base tile" };
  if (grid.blocked.has(key)) return { type: "blocked", label: "Blocked terrain" };
  if (isOccupied(state, cell.x, cell.y)) return { type: "occupied", label: "Tower occupied" };
  if (isEnemyOnCell(grid, state, cell.x, cell.y)) return { type: "enemy", label: "Enemy movement" };
  if (!findPath(grid, state, cell)) return { type: "path", label: "Would block convoy path" };
  return { type: "valid", label: "Valid build tile" };
}
