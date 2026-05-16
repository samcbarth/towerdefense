const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  credits: document.getElementById("credits"),
  base: document.getElementById("base"),
  wave: document.getElementById("wave"),
  selection: document.getElementById("selection"),
  missionName: document.getElementById("missionName"),
  missionBriefing: document.getElementById("missionBriefing"),
  waveName: document.getElementById("waveName"),
  waveComposition: document.getElementById("waveComposition"),
  combatLog: document.getElementById("combatLog"),
  towerButtons: document.getElementById("towerButtons"),
  abilityButtons: document.getElementById("abilityButtons"),
  upgrade: document.getElementById("upgrade"),
  sell: document.getElementById("sell"),
  nextWave: document.getElementById("nextWave"),
  soundToggle: document.getElementById("soundToggle"),
  muteToggle: document.getElementById("muteToggle"),
  audioStatus: document.getElementById("audioStatus"),
  volume: document.getElementById("volume"),
  overlay: document.getElementById("overlay"),
  start: document.getElementById("start"),
};

const towerDefs = GAME_DATA.towers;
const enemyDefs = GAME_DATA.enemies;
const waves = GAME_DATA.waves;
const abilityDefs = GAME_DATA.abilities;
const grid = {
  ...GAME_DATA.grid,
  blocked: new Set(GAME_DATA.grid.blocked),
  terrain: Object.fromEntries(
    Object.entries(GAME_DATA.grid.terrain || {}).map(([key, cells]) => [key, new Set(cells)])
  ),
};

const state = {
  started: false,
  credits: GAME_DATA.mission.startCredits,
  base: GAME_DATA.mission.baseIntegrity,
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
  log: ["Mission systems online."],
  gameOver: false,
  victory: false,
  lastTime: 0,
};

const audio = {
  context: null,
  master: null,
  muted: false,
  volume: 0.7,
  lastFireAt: 0,
  lastImpactAt: 0,
  fallbackUrl: null,
};

function setAudioStatus(text, mode = "") {
  ui.audioStatus.textContent = text;
  ui.audioStatus.classList.toggle("ready", mode === "ready");
  ui.audioStatus.classList.toggle("blocked", mode === "blocked");
}

function ensureAudio() {
  if (audio.context) {
    if (audio.context.state === "suspended") {
      audio.context.resume()
        .then(() => setAudioStatus(`Audio ${audio.context.state}`, audio.context.state === "running" ? "ready" : ""))
        .catch(() => setAudioStatus("Audio blocked", "blocked"));
    } else {
      setAudioStatus(`Audio ${audio.context.state}`, audio.context.state === "running" ? "ready" : "");
    }
    return true;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    ui.soundToggle.textContent = "No Audio";
    ui.soundToggle.disabled = true;
    ui.muteToggle.disabled = true;
    setAudioStatus("No Web Audio", "blocked");
    return false;
  }

  audio.context = new AudioContext();
  audio.master = audio.context.createGain();
  audio.master.gain.value = audio.muted ? 0 : audio.volume;
  audio.master.connect(audio.context.destination);
  audio.context.resume()
    .then(() => setAudioStatus(`Audio ${audio.context.state}`, audio.context.state === "running" ? "ready" : ""))
    .catch(() => setAudioStatus("Audio blocked", "blocked"));
  return true;
}

function setVolume(value) {
  audio.volume = Number(value) / 100;
  if (audio.master) audio.master.gain.value = audio.muted ? 0 : audio.volume;
}

function setMuted(muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : audio.volume;
  ui.muteToggle.textContent = muted ? "Unmute" : "Mute";
  setAudioStatus(muted ? "Muted" : "Audio ready", muted ? "" : "ready");
}

function createFallbackBeepUrl() {
  if (audio.fallbackUrl) return audio.fallbackUrl;

  const sampleRate = 44100;
  const duration = 0.55;
  const samples = Math.floor(sampleRate * duration);
  const bytesPerSample = 2;
  const dataSize = samples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, text) {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    const sweep = 440 + t * 620;
    const value = Math.sin(Math.PI * 2 * sweep * t) * envelope * 0.55;
    view.setInt16(44 + i * 2, value * 32767, true);
  }

  audio.fallbackUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  return audio.fallbackUrl;
}

function playFallbackBeep() {
  if (audio.muted) return;
  const beep = new Audio(createFallbackBeepUrl());
  beep.volume = Math.min(1, Math.max(0, audio.volume));
  beep.play()
    .then(() => setAudioStatus("Audio playing", "ready"))
    .catch(() => setAudioStatus("Click blocked", "blocked"));
}

function playTone({ frequency = 440, duration = 0.12, type = "sine", gain = 0.08, slideTo = null, delay = 0 }) {
  if (audio.muted || !ensureAudio()) return;
  const now = audio.context.currentTime + delay;
  const osc = audio.context.createOscillator();
  const amp = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(audio.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playNoise({ duration = 0.12, gain = 0.05, filter = 900, delay = 0 }) {
  if (audio.muted || !ensureAudio()) return;
  const now = audio.context.currentTime + delay;
  const sampleRate = audio.context.sampleRate;
  const buffer = audio.context.createBuffer(1, Math.max(1, sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = audio.context.createBufferSource();
  const amp = audio.context.createGain();
  const band = audio.context.createBiquadFilter();
  band.type = "lowpass";
  band.frequency.value = filter;
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.buffer = buffer;
  source.connect(band);
  band.connect(amp);
  amp.connect(audio.master);
  source.start(now);
}

function playUi() {
  playTone({ frequency: 740, slideTo: 980, duration: 0.07, type: "triangle", gain: 0.07 });
}

function playDenied() {
  playTone({ frequency: 170, slideTo: 105, duration: 0.18, type: "sawtooth", gain: 0.08 });
}

function playDeploy() {
  playTone({ frequency: 260, slideTo: 420, duration: 0.14, type: "square", gain: 0.075 });
  playNoise({ duration: 0.1, gain: 0.045, filter: 700, delay: 0.04 });
}

function playWaveCue() {
  playTone({ frequency: 196, duration: 0.16, type: "sawtooth", gain: 0.05 });
  playTone({ frequency: 294, duration: 0.16, type: "sawtooth", gain: 0.045, delay: 0.14 });
  playTone({ frequency: 392, duration: 0.22, type: "sawtooth", gain: 0.04, delay: 0.28 });
}

function playFire(type) {
  const now = performance.now();
  if (now - audio.lastFireAt < 38) return;
  audio.lastFireAt = now;
  const profiles = {
    rifle: { frequency: 760, slideTo: 300, duration: 0.045, type: "square", gain: 0.018 },
    missile: { frequency: 130, slideTo: 82, duration: 0.13, type: "sawtooth", gain: 0.028 },
    railgun: { frequency: 980, slideTo: 1700, duration: 0.11, type: "sawtooth", gain: 0.032 },
    emp: { frequency: 420, slideTo: 250, duration: 0.16, type: "sine", gain: 0.026 },
    drone: { frequency: 520, slideTo: 720, duration: 0.075, type: "triangle", gain: 0.021 },
  };
  playTone(profiles[type] || profiles.rifle);
}

function playImpact(strong = false) {
  const now = performance.now();
  if (now - audio.lastImpactAt < 42) return;
  audio.lastImpactAt = now;
  playNoise({ duration: strong ? 0.18 : 0.08, gain: strong ? 0.052 : 0.026, filter: strong ? 520 : 1100 });
}

function playAbility(key) {
  if (key === "airstrike") {
    playTone({ frequency: 220, slideTo: 92, duration: 0.28, type: "sawtooth", gain: 0.055 });
    playNoise({ duration: 0.3, gain: 0.065, filter: 620, delay: 0.08 });
  } else if (key === "empPulse") {
    playTone({ frequency: 880, slideTo: 180, duration: 0.32, type: "sine", gain: 0.05 });
    playTone({ frequency: 1320, slideTo: 240, duration: 0.28, type: "triangle", gain: 0.032, delay: 0.04 });
  } else {
    playTone({ frequency: 330, slideTo: 660, duration: 0.18, type: "triangle", gain: 0.045 });
    playTone({ frequency: 660, slideTo: 990, duration: 0.16, type: "sine", gain: 0.03, delay: 0.12 });
  }
}

function playTestSound() {
  setMuted(false);
  ensureAudio();
  playFallbackBeep();
  playTone({ frequency: 330, duration: 0.13, type: "triangle", gain: 0.08 });
  playTone({ frequency: 550, duration: 0.13, type: "triangle", gain: 0.075, delay: 0.12 });
  playTone({ frequency: 825, duration: 0.22, type: "triangle", gain: 0.07, delay: 0.24 });
  playNoise({ duration: 0.09, gain: 0.035, filter: 1400, delay: 0.42 });
}

function playBaseHit() {
  playTone({ frequency: 92, slideTo: 58, duration: 0.34, type: "sawtooth", gain: 0.06 });
  playNoise({ duration: 0.2, gain: 0.045, filter: 420 });
}

function playMissionEnd(victory) {
  if (victory) {
    playTone({ frequency: 330, duration: 0.16, type: "triangle", gain: 0.05 });
    playTone({ frequency: 495, duration: 0.16, type: "triangle", gain: 0.045, delay: 0.16 });
    playTone({ frequency: 660, duration: 0.36, type: "triangle", gain: 0.042, delay: 0.32 });
  } else {
    playTone({ frequency: 220, slideTo: 82, duration: 0.48, type: "sawtooth", gain: 0.055 });
    playNoise({ duration: 0.35, gain: 0.04, filter: 360, delay: 0.08 });
  }
}

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

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 5);
}

function setMessage(message, log = false) {
  state.message = message;
  if (log) addLog(message);
}

function describeWave(index) {
  const wave = waves[index];
  if (!wave) return "Mission complete";
  return wave.groups
    .map((group) => `${group.count} ${enemyDefs[group.type].name}`)
    .join(" + ");
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
  const wave = waves[state.waveIndex];
  state.waveActive = true;
  state.spawnQueue = [];
  wave.groups.forEach((group) => {
    for (let i = 0; i < group.count; i++) {
      state.spawnQueue.push({ type: group.type, delay: group.gap });
    }
  });
  state.spawnTimer = 0.35;
  setMessage(`Wave ${state.waveIndex + 1}: ${wave.name} inbound.`, true);
  playWaveCue();
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
      playBaseHit();
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
    const clearedWave = waves[state.waveIndex];
    state.waveIndex++;
    state.credits += clearedWave.reward;
    if (state.waveIndex >= waves.length) {
      endGame(true);
    } else {
      setMessage(`Wave cleared. +${clearedWave.reward} credits. Prepare for wave ${state.waveIndex + 1}.`, true);
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
      playFire(tower.type);
      playImpact(target.def.boss);
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
      playFire(tower.type);
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
        playImpact(true);
      } else {
        damageEnemy(p.target, p.damage, { slow: p.slow, slowTime: p.slowTime });
        addEffect(p.target.x, p.target.y, p.color, 0.22, 18);
        playImpact(p.target.def.boss);
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
    setMessage(`Insufficient credits. ${def.name} costs ${def.cost}.`, true);
    playDenied();
    return;
  }
  if (!isBuildable(cell.x, cell.y)) {
    setMessage("Cannot deploy there: tile is blocked, occupied, reserved, or under enemy movement.", true);
    playDenied();
    return;
  }
  if (!findPath(cell)) {
    setMessage("Placement rejected: convoy path must stay open.", true);
    playDenied();
    return;
  }
  state.towers.push(makeTower(type, cell.x, cell.y));
  state.credits -= def.cost;
  refreshEnemyPaths();
  setMessage(`${def.name} deployed.`, true);
  playDeploy();
}

function useAbility(cell) {
  const key = state.selectedAbility;
  if (!key) return;
  const ability = abilityDefs[key];
  const now = performance.now() / 1000;
  if (ability.readyAt && ability.readyAt > now) {
    setMessage(`${ability.name} cooling down.`, true);
    playDenied();
    return;
  }

  if (key === "repair") {
    state.base = Math.min(GAME_DATA.mission.baseIntegrity, state.base + ability.heal);
    ability.readyAt = now + ability.cooldown;
    setMessage("Emergency repair completed.", true);
    addEffect(centerOf(grid.base).x, centerOf(grid.base).y, ability.color, 0.7, 70);
    playAbility(key);
    return;
  }

  if (!cell) {
    playDenied();
    return;
  }
  const hit = centerOf(cell);
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - hit.x, enemy.y - hit.y) / grid.tileW;
    if (dist <= ability.radius) {
      if (key === "empPulse") enemy.shield = 0;
      damageEnemy(enemy, ability.damage, { slow: ability.slow, slowTime: ability.slowTime });
    }
  }
  ability.readyAt = now + ability.cooldown;
  setMessage(`${ability.name} executed.`, true);
  addEffect(hit.x, hit.y, ability.color, 0.65, ability.radius * grid.tileW);
  playAbility(key);
}

function upgradeSelected() {
  const tower = state.selectedTower;
  if (!tower || tower.level >= 3) return;
  const cost = Math.round(tower.def.cost * (0.72 + tower.level * 0.52));
  if (state.credits < cost) {
    setMessage(`Insufficient credits. Upgrade costs ${cost}.`, true);
    playDenied();
    return;
  }
  state.credits -= cost;
  tower.level++;
  setMessage(`${tower.def.name} upgraded to tier ${tower.level}.`, true);
  playDeploy();
}

function sellSelected() {
  const tower = state.selectedTower;
  if (!tower) return;
  state.credits += Math.round(tower.def.cost * (0.5 + tower.level * 0.18));
  state.towers = state.towers.filter((item) => item !== tower);
  state.selectedTower = null;
  setMessage("Tower sold.", true);
  playUi();
}

function endGame(victory) {
  state.gameOver = true;
  state.victory = victory;
  addLog(victory ? "Mission victory confirmed." : "Base integrity failed.");
  playMissionEnd(victory);
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
    credits: GAME_DATA.mission.startCredits,
    base: GAME_DATA.mission.baseIntegrity,
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
    log: ["Mission started.", "Build phase active."],
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

function terrainHas(type, key) {
  return grid.terrain[type] && grid.terrain[type].has(key);
}

function drawTerrainDetail(cell, key) {
  const p = centerOf(cell);

  if (terrainHas("runway", key)) {
    ctx.strokeStyle = "rgba(143, 176, 187, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 18, p.y);
    ctx.lineTo(p.x + 18, p.y);
    ctx.stroke();
  }

  if (terrainHas("reinforced", key)) {
    ctx.strokeStyle = "rgba(111, 243, 164, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 16, p.y - 10, 32, 20);
  }

  if (terrainHas("hazard", key)) {
    ctx.fillStyle = "rgba(255, 207, 90, 0.2)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 10);
    ctx.lineTo(p.x + 14, p.y + 8);
    ctx.lineTo(p.x - 14, p.y + 8);
    ctx.closePath();
    ctx.fill();
  }

  if (terrainHas("relay", key)) {
    ctx.strokeStyle = "rgba(111, 243, 208, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 1);
    ctx.lineTo(p.x, p.y - 24);
    ctx.stroke();
  }
}

function drawBlockedDetail(cell, key) {
  const p = centerOf(cell);
  ctx.fillStyle = terrainHas("relay", key) ? "#102d2a" : "#111615";
  ctx.fillRect(p.x - 18, p.y - 18, 36, 26);
  ctx.fillStyle = terrainHas("relay", key) ? "#6ff3d0" : "#53645e";
  ctx.fillRect(p.x - 10, p.y - 27, 20, 9);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.strokeRect(p.x - 18, p.y - 18, 36, 26);
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
      if (terrainHas("hazard", key)) fill = "#2b291d";
      if (terrainHas("reinforced", key)) fill = "#1d302a";
      if (pathKeys.has(key)) fill = "#25362e";
      if (terrainHas("runway", key) && pathKeys.has(key)) fill = "#2d3a34";
      if (x === grid.spawn.x && y === grid.spawn.y) fill = "#394025";
      if (x === grid.base.x && y === grid.base.y) fill = "#3d2523";
      if (state.hoverCell && state.hoverCell.x === x && state.hoverCell.y === y) fill = state.selectedTowerType || state.selectedAbility ? "#335446" : "#263b34";
      drawTile({ x, y }, fill);
      drawTerrainDetail({ x, y }, key);
      if (grid.blocked.has(key)) drawBlockedDetail({ x, y }, key);
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
  ui.missionName.textContent = GAME_DATA.mission.name;
  ui.missionBriefing.textContent = GAME_DATA.mission.briefing;
  const nextWave = waves[state.waveIndex];
  ui.waveName.textContent = nextWave
    ? `${state.waveActive ? "Active" : "Next"} Wave ${state.waveIndex + 1}: ${nextWave.name}`
    : "Mission complete";
  ui.waveComposition.textContent = describeWave(state.waveIndex);
  ui.combatLog.innerHTML = state.log.map((entry) => `<span>${entry}</span>`).join("");
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
      ensureAudio();
      playUi();
      state.selectedTowerType = state.selectedTowerType === key ? null : key;
      state.selectedAbility = null;
      state.selectedTower = null;
      setMessage(`${tower.name}: ${tower.role || tower.text}`);
    });
    ui.towerButtons.appendChild(button);
  });

  Object.entries(abilityDefs).forEach(([key, ability]) => {
    const button = document.createElement("button");
    button.className = "ability-button";
    button.dataset.ability = key;
    button.innerHTML = `${ability.name}<span>${ability.text}</span>`;
    button.addEventListener("click", () => {
      ensureAudio();
      playUi();
      state.selectedAbility = state.selectedAbility === key ? null : key;
      state.selectedTowerType = null;
      state.selectedTower = null;
      setMessage(`${ability.name}: ${ability.text}`);
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
  ensureAudio();
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
  setMessage(state.selectedTower ? "Tower selected." : "Select a tower, ability, or occupied tile.");
  playUi();
});

ui.start.addEventListener("click", () => {
  ensureAudio();
  playUi();
  restart();
});
ui.nextWave.addEventListener("click", () => {
  ensureAudio();
  queueWave();
});
ui.upgrade.addEventListener("click", () => {
  ensureAudio();
  upgradeSelected();
});
ui.sell.addEventListener("click", () => {
  ensureAudio();
  sellSelected();
});
ui.soundToggle.addEventListener("click", () => {
  ensureAudio();
  playTestSound();
});
ui.muteToggle.addEventListener("click", () => {
  ensureAudio();
  setMuted(!audio.muted);
  if (!audio.muted) playTestSound();
});
ui.volume.addEventListener("input", () => {
  ensureAudio();
  setVolume(ui.volume.value);
  if (!audio.muted) playUi();
});

buildButtons();
setVolume(ui.volume.value);
requestAnimationFrame(tick);
