const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  credits: document.getElementById("credits"),
  base: document.getElementById("base"),
  wave: document.getElementById("wave"),
  selection: document.getElementById("selection"),
  towerButtons: document.getElementById("towerButtons"),
  abilityButtons: document.getElementById("abilityButtons"),
  upgrade: document.getElementById("upgrade"),
  sell: document.getElementById("sell"),
  nextWave: document.getElementById("nextWave"),
  overlay: document.getElementById("overlay"),
  start: document.getElementById("start"),
};

const grid = {
  cols: 13,
  rows: 9,
  tileW: 72,
  tileH: 36,
  originX: 640,
  originY: 118,
  spawn: { x: 0, y: 4 },
  base: { x: 12, y: 4 },
  blocked: new Set(["5,1", "6,1", "7,1", "4,7", "5,7", "8,7", "9,7"]),
};

const towerDefs = {
  rifle: {
    name: "Rifle Turret",
    cost: 90,
    range: 2.7,
    fireRate: 0.48,
    damage: 18,
    color: "#8fb0bb",
    accent: "#e9f7ff",
    text: "Fast single target",
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
  },
};

const enemyDefs = {
  scout: { name: "Scout", hp: 70, speed: 1.55, reward: 16, color: "#ffcf5a", armor: 0 },
  carrier: { name: "Armored Carrier", hp: 220, speed: 0.72, reward: 36, color: "#a8b1b6", armor: 6 },
  shield: { name: "Shield Drone", hp: 125, speed: 1.0, reward: 28, color: "#80f6ff", armor: 2, shield: 55 },
  swarm: { name: "Swarm Bot", hp: 44, speed: 1.35, reward: 10, color: "#ff9969", armor: 0 },
  jammer: { name: "Jammer", hp: 150, speed: 0.95, reward: 34, color: "#de7dff", armor: 1, jammer: true },
  boss: { name: "Siege Walker", hp: 1400, speed: 0.42, reward: 240, color: "#ff6f5f", armor: 10, boss: true },
};

const waves = [
  [{ type: "scout", count: 8, gap: 0.75 }],
  [{ type: "scout", count: 8, gap: 0.5 }, { type: "swarm", count: 10, gap: 0.32 }],
  [{ type: "carrier", count: 5, gap: 0.9 }, { type: "shield", count: 3, gap: 0.85 }],
  [{ type: "swarm", count: 20, gap: 0.22 }, { type: "jammer", count: 3, gap: 1.1 }],
  [{ type: "carrier", count: 8, gap: 0.7 }, { type: "shield", count: 5, gap: 0.68 }],
  [{ type: "scout", count: 14, gap: 0.38 }, { type: "jammer", count: 5, gap: 0.75 }, { type: "carrier", count: 6, gap: 0.75 }],
  [{ type: "boss", count: 1, gap: 0.1 }, { type: "swarm", count: 18, gap: 0.26 }, { type: "shield", count: 6, gap: 0.6 }],
];

const abilityDefs = {
  airstrike: { name: "Airstrike", cooldown: 18, radius: 1.35, damage: 180, color: "#ffcf5a", text: "Area burst" },
  empPulse: { name: "EMP Pulse", cooldown: 15, radius: 1.7, damage: 30, slow: 0.25, slowTime: 4.5, color: "#6ff3d0", text: "Slow and shield break" },
  repair: { name: "Emergency Repair", cooldown: 28, radius: 0, heal: 25, color: "#6ff3a4", text: "Restore base" },
};

const state = {
  started: false,
  credits: 360,
  base: 100,
  waveIndex: 0,
  waveActive: false,
  spawnQueue: [],
  spawnTimer: 0,
  towers: [],
  enemies: [],
  projectiles: [],
  effects: [],
  selectedTowerType: null,
  selectedAbility: null,
  selectedTower: null,
  hoverCell: null,
  message: "Select a tower or commander ability.",
  gameOver: false,
  victory: false,
  lastTime: 0,
};

function cellKey(x, y) {
  return `${x},${y}`;
}

function centerOf(cell) {
  return {
    x: grid.originX + (cell.x - cell.y) * grid.tileW / 2,
    y: grid.originY + (cell.x + cell.y) * grid.tileH / 2,
  };
}

function screenToCell(mx, my) {
  const dx = mx - grid.originX;
  const dy = my - grid.originY;
  const x = Math.floor(dy / grid.tileH + dx / grid.tileW);
  const y = Math.floor(dy / grid.tileH - dx / grid.tileW);
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return null;
  return { x, y };
}

function isOccupied(x, y, ignoreTower = null) {
  return state.towers.some((tower) => tower !== ignoreTower && tower.x === x && tower.y === y);
}

function isEnemyOnCell(x, y) {
  return state.enemies.some((enemy) => {
    const cell = screenToCell(enemy.x, enemy.y);
    return cell && cell.x === x && cell.y === y;
  });
}

function isBuildable(x, y) {
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return false;
  if (cellKey(x, y) === cellKey(grid.spawn.x, grid.spawn.y)) return false;
  if (cellKey(x, y) === cellKey(grid.base.x, grid.base.y)) return false;
  if (grid.blocked.has(cellKey(x, y))) return false;
  if (isEnemyOnCell(x, y)) return false;
  return !isOccupied(x, y);
}

function findPathFrom(start, extraBlock = null) {
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

function findPath(extraBlock = null) {
  return findPathFrom(grid.spawn, extraBlock);
}

function currentPath() {
  return findPath() || [grid.spawn, grid.base];
}

function refreshEnemyPaths() {
  for (const enemy of state.enemies) {
    const currentCell = screenToCell(enemy.x, enemy.y) || enemy.path[enemy.pathIndex] || grid.spawn;
    const path = findPathFrom(currentCell);
    if (path) {
      enemy.path = path;
      enemy.pathIndex = 0;
    }
  }
}

function makeTower(type, x, y) {
  return {
    type,
    x,
    y,
    level: 1,
    cooldown: 0,
    def: towerDefs[type],
  };
}

function towerStats(tower) {
  const scale = 1 + (tower.level - 1) * 0.34;
  return {
    range: tower.def.range + (tower.level - 1) * 0.22,
    fireRate: Math.max(0.22, tower.def.fireRate * (1 - (tower.level - 1) * 0.12)),
    damage: tower.def.damage * scale,
  };
}

function spawnEnemy(type) {
  const def = enemyDefs[type];
  const path = currentPath();
  const pos = centerOf(path[0]);
  state.enemies.push({
    type,
    def,
    hp: def.hp,
    maxHp: def.hp,
    shield: def.shield || 0,
    path,
    pathIndex: 0,
    x: pos.x,
    y: pos.y,
    slowUntil: 0,
    slowMultiplier: 1,
    reached: false,
  });
}

function queueWave() {
  if (state.waveActive || state.gameOver || state.waveIndex >= waves.length) return;
  state.waveActive = true;
  state.spawnQueue = [];
  waves[state.waveIndex].forEach((group) => {
    for (let i = 0; i < group.count; i++) {
      state.spawnQueue.push({ type: group.type, delay: group.gap });
    }
  });
  state.spawnTimer = 0.35;
  state.message = `Wave ${state.waveIndex + 1} inbound.`;
}

function damageEnemy(enemy, amount, options = {}) {
  let damage = Math.max(1, amount - (enemy.def.armor || 0));
  if (enemy.shield > 0) {
    const shieldHit = Math.min(enemy.shield, damage);
    enemy.shield -= shieldHit;
    damage -= shieldHit;
  }
  enemy.hp -= damage;
  if (options.slow) {
    enemy.slowMultiplier = options.slow;
    enemy.slowUntil = performance.now() / 1000 + (options.slowTime || 1.5);
  }
  if (enemy.hp <= 0) {
    state.credits += enemy.def.reward;
    addEffect(enemy.x, enemy.y, enemy.def.color, 0.4, 28);
    enemy.dead = true;
  }
}

function addEffect(x, y, color, life, radius) {
  state.effects.push({ x, y, color, life, maxLife: life, radius });
}

function updateSpawning(dt) {
  if (!state.waveActive || state.spawnQueue.length === 0) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const next = state.spawnQueue.shift();
    spawnEnemy(next.type);
    state.spawnTimer = next.delay;
  }
}

function updateEnemies(dt, now) {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    if (enemy.pathIndex >= enemy.path.length - 1) {
      enemy.reached = true;
      state.base -= enemy.def.boss ? 35 : 8;
      enemy.dead = true;
      addEffect(enemy.x, enemy.y, "#ff6f5f", 0.55, 44);
      continue;
    }

    const target = centerOf(enemy.path[enemy.pathIndex + 1]);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const slow = now < enemy.slowUntil ? enemy.slowMultiplier : 1;
    const speed = enemy.def.speed * slow * 72;

    if (dist < speed * dt) {
      enemy.x = target.x;
      enemy.y = target.y;
      enemy.pathIndex++;
    } else {
      enemy.x += (dx / dist) * speed * dt;
      enemy.y += (dy / dist) * speed * dt;
    }
  }

  state.enemies = state.enemies.filter((enemy) => !enemy.dead);

  if (state.base <= 0) {
    endGame(false);
  }

  if (state.waveActive && state.spawnQueue.length === 0 && state.enemies.length === 0) {
    state.waveActive = false;
    state.waveIndex++;
    state.credits += 80 + state.waveIndex * 20;
    if (state.waveIndex >= waves.length) {
      endGame(true);
    } else {
      state.message = `Wave cleared. Prepare for wave ${state.waveIndex + 1}.`;
    }
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    const stats = towerStats(tower);
    const origin = centerOf(tower);
    let target = null;
    let best = Infinity;

    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.x - origin.x, enemy.y - origin.y) / grid.tileW;
      if (dist <= stats.range && dist < best) {
        target = enemy;
        best = dist;
      }
    }

    if (!target) continue;

    const jammerPenalty = state.enemies.some((enemy) => enemy.def.jammer && Math.hypot(enemy.x - origin.x, enemy.y - origin.y) < 160) ? 1.35 : 1;
    tower.cooldown = stats.fireRate * jammerPenalty;

    if (tower.def.pierce) {
      damageEnemy(target, stats.damage);
      state.projectiles.push({ x: origin.x, y: origin.y - 34, tx: target.x, ty: target.y, life: 0.16, color: tower.def.accent, beam: true });
      addEffect(target.x, target.y, tower.def.accent, 0.2, 16);
    } else {
      state.projectiles.push({
        x: origin.x,
        y: origin.y - 24,
        target,
        speed: tower.def.homing ? 460 : 620,
        damage: stats.damage,
        splash: tower.def.splash || 0,
        slow: tower.def.slow,
        slowTime: tower.def.slowTime,
        color: tower.def.accent,
      });
    }
  }
}

function updateProjectiles(dt) {
  for (const p of state.projectiles) {
    if (p.beam) {
      p.life -= dt;
      continue;
    }
    if (!p.target || p.target.dead) {
      p.dead = true;
      continue;
    }
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < p.speed * dt) {
      if (p.splash > 0) {
        for (const enemy of state.enemies) {
          const splashDist = Math.hypot(enemy.x - p.target.x, enemy.y - p.target.y) / grid.tileW;
          if (splashDist <= p.splash) damageEnemy(enemy, p.damage * (1 - splashDist / (p.splash + 0.1)));
        }
        addEffect(p.target.x, p.target.y, p.color, 0.35, 42);
      } else {
        damageEnemy(p.target, p.damage, { slow: p.slow, slowTime: p.slowTime });
        addEffect(p.target.x, p.target.y, p.color, 0.22, 18);
      }
      p.dead = true;
    } else {
      p.x += (dx / dist) * p.speed * dt;
      p.y += (dy / dist) * p.speed * dt;
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.dead && (p.life === undefined || p.life > 0));
}

function updateEffects(dt) {
  state.effects.forEach((effect) => effect.life -= dt);
  state.effects = state.effects.filter((effect) => effect.life > 0);
}

function placeTower(cell) {
  const type = state.selectedTowerType;
  if (!type || !cell) return;
  const def = towerDefs[type];
  if (state.credits < def.cost) {
    state.message = "Insufficient credits.";
    return;
  }
  if (!isBuildable(cell.x, cell.y)) {
    state.message = "Cannot deploy there.";
    return;
  }
  if (!findPath(cell)) {
    state.message = "Placement rejected: convoy path must stay open.";
    return;
  }
  state.towers.push(makeTower(type, cell.x, cell.y));
  state.credits -= def.cost;
  refreshEnemyPaths();
  state.message = `${def.name} deployed.`;
}

function useAbility(cell) {
  const key = state.selectedAbility;
  if (!key) return;
  const ability = abilityDefs[key];
  const now = performance.now() / 1000;
  if (ability.readyAt && ability.readyAt > now) {
    state.message = `${ability.name} cooling down.`;
    return;
  }

  if (key === "repair") {
    state.base = Math.min(100, state.base + ability.heal);
    ability.readyAt = now + ability.cooldown;
    state.message = "Emergency repair completed.";
    addEffect(centerOf(grid.base).x, centerOf(grid.base).y, ability.color, 0.7, 70);
    return;
  }

  if (!cell) return;
  const hit = centerOf(cell);
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - hit.x, enemy.y - hit.y) / grid.tileW;
    if (dist <= ability.radius) {
      if (key === "empPulse") enemy.shield = 0;
      damageEnemy(enemy, ability.damage, { slow: ability.slow, slowTime: ability.slowTime });
    }
  }
  ability.readyAt = now + ability.cooldown;
  state.message = `${ability.name} executed.`;
  addEffect(hit.x, hit.y, ability.color, 0.65, ability.radius * grid.tileW);
}

function upgradeSelected() {
  const tower = state.selectedTower;
  if (!tower || tower.level >= 3) return;
  const cost = Math.round(tower.def.cost * (0.72 + tower.level * 0.52));
  if (state.credits < cost) {
    state.message = "Insufficient credits for upgrade.";
    return;
  }
  state.credits -= cost;
  tower.level++;
  state.message = `${tower.def.name} upgraded to tier ${tower.level}.`;
}

function sellSelected() {
  const tower = state.selectedTower;
  if (!tower) return;
  state.credits += Math.round(tower.def.cost * (0.5 + tower.level * 0.18));
  state.towers = state.towers.filter((item) => item !== tower);
  state.selectedTower = null;
  state.message = "Tower sold.";
}

function endGame(victory) {
  state.gameOver = true;
  state.victory = victory;
  ui.overlay.classList.remove("hidden");
  ui.overlay.querySelector("h2").textContent = victory ? "Sector secured." : "Base overrun.";
  ui.overlay.querySelector("p").textContent = victory
    ? "The convoy has been broken. Refresh or restart to run the mission again."
    : "The line collapsed. Restart and reshape the maze.";
  ui.start.textContent = "Restart Mission";
}

function restart() {
  Object.assign(state, {
    started: true,
    credits: 360,
    base: 100,
    waveIndex: 0,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    selectedTowerType: null,
    selectedAbility: null,
    selectedTower: null,
    hoverCell: null,
    message: "Build a maze, then launch wave one.",
    gameOver: false,
    victory: false,
    lastTime: performance.now(),
  });
  Object.values(abilityDefs).forEach((ability) => ability.readyAt = 0);
  ui.overlay.classList.add("hidden");
}

function drawTile(cell, fill, stroke = "#2a4037") {
  const p = centerOf(cell);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - grid.tileH / 2);
  ctx.lineTo(p.x + grid.tileW / 2, p.y);
  ctx.lineTo(p.x, p.y + grid.tileH / 2);
  ctx.lineTo(p.x - grid.tileW / 2, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawTower(tower) {
  const p = centerOf(tower);
  const size = 18 + tower.level * 3;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tower.def.color;
  ctx.fillRect(p.x - size / 2, p.y - 26 - tower.level * 3, size, 26 + tower.level * 3);
  ctx.fillStyle = tower.def.accent;
  ctx.fillRect(p.x - 4, p.y - 44 - tower.level * 4, 8, 18);
  ctx.fillStyle = "#09110f";
  ctx.font = "700 12px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(tower.level, p.x, p.y - 9);
}

function drawEnemy(enemy) {
  const width = enemy.def.boss ? 44 : 26;
  const height = enemy.def.boss ? 34 : 22;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 10, width * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2, width, height);
  if (enemy.shield > 0) {
    ctx.strokeStyle = "#80f6ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x - width / 2 - 4, enemy.y - height / 2 - 4, width + 8, height + 8);
  }
  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = "#1d2624";
  ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2 - 9, width, 4);
  ctx.fillStyle = hpPct > 0.4 ? "#6ff3a4" : "#ff6f5f";
  ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2 - 9, width * hpPct, 4);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0b1714");
  grad.addColorStop(1, "#14201c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const path = currentPath();
  const pathKeys = new Set(path.map((cell) => cellKey(cell.x, cell.y)));

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const key = cellKey(x, y);
      let fill = "#172520";
      if (grid.blocked.has(key)) fill = "#0a0f0e";
      if (pathKeys.has(key)) fill = "#25362e";
      if (x === grid.spawn.x && y === grid.spawn.y) fill = "#394025";
      if (x === grid.base.x && y === grid.base.y) fill = "#3d2523";
      if (state.hoverCell && state.hoverCell.x === x && state.hoverCell.y === y) fill = state.selectedTowerType || state.selectedAbility ? "#335446" : "#263b34";
      drawTile({ x, y }, fill);
    }
  }

  for (const effect of state.effects) {
    const pct = effect.life / effect.maxLife;
    ctx.strokeStyle = effect.color;
    ctx.globalAlpha = pct;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * (1.15 - pct * 0.35), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  state.towers.forEach(drawTower);

  for (const p of state.projectiles) {
    if (p.beam) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.tx, p.ty);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  state.enemies.forEach(drawEnemy);
}

function updateUi() {
  ui.credits.textContent = `Credits ${state.credits}`;
  ui.base.textContent = `Base ${Math.max(0, Math.round(state.base))}`;
  ui.wave.textContent = `Wave ${Math.min(state.waveIndex + 1, waves.length)}/${waves.length}`;
  ui.selection.textContent = state.selectedTower
    ? `${state.selectedTower.def.name} tier ${state.selectedTower.level}. ${state.message}`
    : state.message;
  ui.upgrade.disabled = !state.selectedTower || state.selectedTower.level >= 3;
  ui.sell.disabled = !state.selectedTower;
  ui.nextWave.disabled = state.waveActive || state.gameOver || !state.started;

  document.querySelectorAll("[data-tower]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tower === state.selectedTowerType);
  });
  document.querySelectorAll("[data-ability]").forEach((button) => {
    const ability = abilityDefs[button.dataset.ability];
    const remaining = Math.max(0, (ability.readyAt || 0) - performance.now() / 1000);
    button.classList.toggle("active", button.dataset.ability === state.selectedAbility);
    const label = button.querySelector("span");
    label.textContent = remaining > 0 ? `${Math.ceil(remaining)}s cooldown` : ability.text;
  });
}

function tick(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.033, (nowMs - state.lastTime) / 1000 || 0);
  state.lastTime = nowMs;

  if (state.started && !state.gameOver) {
    updateSpawning(dt);
    updateEnemies(dt, now);
    updateTowers(dt);
    updateProjectiles(dt);
    updateEffects(dt);
  }

  draw();
  updateUi();
  requestAnimationFrame(tick);
}

function buildButtons() {
  Object.entries(towerDefs).forEach(([key, tower]) => {
    const button = document.createElement("button");
    button.className = "tower-button";
    button.dataset.tower = key;
    button.innerHTML = `${tower.name}<span>${tower.cost} cr - ${tower.text}</span>`;
    button.addEventListener("click", () => {
      state.selectedTowerType = state.selectedTowerType === key ? null : key;
      state.selectedAbility = null;
      state.selectedTower = null;
      state.message = tower.text;
    });
    ui.towerButtons.appendChild(button);
  });

  Object.entries(abilityDefs).forEach(([key, ability]) => {
    const button = document.createElement("button");
    button.className = "ability-button";
    button.dataset.ability = key;
    button.innerHTML = `${ability.name}<span>${ability.text}</span>`;
    button.addEventListener("click", () => {
      state.selectedAbility = state.selectedAbility === key ? null : key;
      state.selectedTowerType = null;
      state.selectedTower = null;
      state.message = ability.text;
    });
    ui.abilityButtons.appendChild(button);
  });
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  state.hoverCell = screenToCell((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
});

canvas.addEventListener("click", () => {
  if (!state.started || state.gameOver) return;
  const cell = state.hoverCell;
  if (state.selectedTowerType) {
    placeTower(cell);
    return;
  }
  if (state.selectedAbility) {
    useAbility(cell);
    return;
  }
  if (!cell) return;
  state.selectedTower = state.towers.find((tower) => tower.x === cell.x && tower.y === cell.y) || null;
  state.message = state.selectedTower ? "Tower selected." : "Select a tower, ability, or occupied tile.";
});

ui.start.addEventListener("click", restart);
ui.nextWave.addEventListener("click", queueWave);
ui.upgrade.addEventListener("click", upgradeSelected);
ui.sell.addEventListener("click", sellSelected);

buildButtons();
requestAnimationFrame(tick);
