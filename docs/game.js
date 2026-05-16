import { GAME_DATA } from "./data.js";
import * as Core from "./modules/core.js";
import * as Storage from "./modules/storage.js";
import * as UiPanel from "./modules/ui.js";
import { drawBattlefield } from "./modules/render.js";

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
  upgradeChoices: document.getElementById("upgradeChoices"),
  sell: document.getElementById("sell"),
  nextWave: document.getElementById("nextWave"),
  pauseToggle: document.getElementById("pauseToggle"),
  speedToggle: document.getElementById("speedToggle"),
  saveGame: document.getElementById("saveGame"),
  loadGame: document.getElementById("loadGame"),
  resetGame: document.getElementById("resetGame"),
  soundToggle: document.getElementById("soundToggle"),
  muteToggle: document.getElementById("muteToggle"),
  audioStatus: document.getElementById("audioStatus"),
  volume: document.getElementById("volume"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  resultStats: document.getElementById("resultStats"),
  start: document.getElementById("start"),
  challengeModes: document.getElementById("challengeModes"),
  waveTraits: document.getElementById("waveTraits"),
  towerDetails: document.getElementById("towerDetails"),
  battleBanner: document.getElementById("battleBanner"),
  pauseOverlay: document.getElementById("pauseOverlay"),
  debugPanel: document.getElementById("debugPanel"),
  debugCredits: document.getElementById("debugCredits"),
  debugWave: document.getElementById("debugWave"),
  debugSaveClear: document.getElementById("debugSaveClear"),
};

const towerDefs = GAME_DATA.towers;
const enemyDefs = GAME_DATA.enemies;
const waves = GAME_DATA.waves;
const abilityDefs = GAME_DATA.abilities;
const challengeDefs = GAME_DATA.challenges || {};
const BASE_CANVAS_WIDTH = 1280;
const BASE_CANVAS_HEIGHT = 860;
const SPEED_STEPS = [1, 1.5, 2];
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";

const grid = Core.createGrid(GAME_DATA.grid);

function fitGridToCanvas() {
  const scale = Math.min(canvas.width / BASE_CANVAS_WIDTH, canvas.height / BASE_CANVAS_HEIGHT) || 1;
  grid.tileW = Math.max(20, Math.round(GAME_DATA.grid.tileW * scale));
  grid.tileH = Math.max(10, Math.round(GAME_DATA.grid.tileH * scale));
  grid.originX = Math.round(GAME_DATA.grid.originX * (canvas.width / BASE_CANVAS_WIDTH));
  grid.originY = Math.round(GAME_DATA.grid.originY * (canvas.height / BASE_CANVAS_HEIGHT));
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    fitGridToCanvas();
  }
}

resizeCanvas();

const state = {
  started: false,
  paused: false,
  speedIndex: 0,
  challengeKey: "standard",
  credits: GAME_DATA.mission.startCredits,
  base: GAME_DATA.mission.baseIntegrity,
  waveIndex: 0,
  waveActive: false,
  waveCountdown: 0,
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
  upgradeKey: "",
  message: "Select a tower or commander ability.",
  log: ["Mission systems online."],
  gameOver: false,
  victory: false,
  lastTime: 0,
  pauseStartedAt: 0,
  basePulse: 0,
  screenShake: 0,
  banner: { text: "", life: 0 },
  stats: Core.createStats(),
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
  return Core.cellKey(x, y);
}

function centerOf(cell) {
  return Core.centerOf(grid, cell);
}

function screenToCell(mx, my) {
  return Core.screenToCell(grid, mx, my);
}

function isOccupied(x, y, ignoreTower = null) {
  return Core.isOccupied(state, x, y, ignoreTower);
}

function isEnemyOnCell(x, y) {
  return Core.isEnemyOnCell(grid, state, x, y);
}

function isBuildable(x, y) {
  return Core.isBuildable(grid, state, x, y);
}

function findPathFrom(start, extraBlock = null) {
  return Core.findPathFrom(grid, state, start, extraBlock);
}

function findPath(extraBlock = null) {
  return Core.findPath(grid, state, extraBlock);
}

function currentPath() {
  return Core.currentPath(grid, state);
}

function refreshEnemyPaths() {
  Core.refreshEnemyPaths(grid, state);
}

function makeTower(type, x, y) {
  return Core.makeTower(towerDefs, type, x, y);
}

function branchData(tower) {
  return Core.branchData(tower);
}

function branchTier(tower) {
  return Core.branchTier(tower);
}

function towerUpgradeCost(tower, branchKey = tower.branch) {
  return Core.towerUpgradeCost(tower, branchKey);
}

function chooseBranchUpgrade(branchKey) {
  const tower = state.selectedTower;
  if (!tower || tower.level !== 1 || !tower.def.branches || !tower.def.branches[branchKey]) return;
  const branch = tower.def.branches[branchKey];
  const cost = branch.tiers[0].cost;
  if (state.credits < cost) {
    setMessage(`Insufficient credits. ${branch.name} costs ${cost}.`, true);
    playDenied();
    return;
  }
  state.credits -= cost;
  tower.branch = branchKey;
  tower.level = 2;
  tower.cooldown = 0;
  state.stats.upgradesPurchased += 1;
  setMessage(`${tower.def.name} branched into ${branch.name}.`, true);
  const pos = centerOf(tower);
  addEffect(pos.x, pos.y - 20, branch.color || tower.def.accent, 0.6, 58);
  playDeploy();
  state.upgradeKey = "";
  saveGameState();
}

function towerStats(tower) {
  return Core.towerStats(tower);
}

function challenge() {
  return challengeDefs[state.challengeKey] || challengeDefs.standard || {
    name: "Standard",
    scoreMultiplier: 1,
    startCreditsMultiplier: 1,
    enemyHpMultiplier: 1,
    rewardMultiplier: 1,
    noSell: false,
  };
}

function startingCredits() {
  return Math.round(GAME_DATA.mission.startCredits * (challenge().startCreditsMultiplier || 1));
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 5);
}

function setMessage(message, log = false) {
  state.message = message;
  if (log) addLog(message);
}

function showBanner(text, life = 1.8) {
  state.banner = { text, life };
}

function describeWave(index) {
  return Core.describeWave(waves, enemyDefs, index);
}

function describeWaveTraits(index) {
  return Core.describeWaveTraits(waves, enemyDefs, index);
}

function snapshotAbilityCooldowns() {
  return Storage.snapshotAbilityCooldowns(state, abilityDefs);
}

function restoreAbilityCooldowns(cooldowns = {}) {
  Storage.restoreAbilityCooldowns(abilityDefs, cooldowns);
}

function saveGameState(manual = false) {
  if (!window.localStorage || !state.started) return false;
  const payload = Storage.serializeState(state, abilityDefs, manual);
  try {
    Storage.writeSavedGame(payload);
    if (manual) state.stats.saves = payload.stats.saves;
    if (manual) setMessage("Mission saved.", true);
    return true;
  } catch {
    if (manual) setMessage("Save failed: storage unavailable.", true);
    return false;
  }
}

function clearSavedGame() {
  Storage.clearSavedGame();
}

function hasSavedGame() {
  return Storage.hasSavedGame();
}

function loadGameState(manual = false) {
  if (!window.localStorage) return false;
  const save = Storage.readSavedGame();
  if (!save) {
    if (manual) setMessage("No saved mission found.", true);
    return false;
  }
  if (Storage.isTerminalSave(save, waves.length)) {
    clearSavedGame();
    if (manual) setMessage("Saved mission had already ended. Starting fresh.", true);
    return false;
  }

  try {
    state.started = Boolean(save.started);
    state.paused = Boolean(save.paused);
    state.pauseStartedAt = state.paused ? performance.now() / 1000 : 0;
    state.speedIndex = Math.max(0, Math.min(SPEED_STEPS.length - 1, Number(save.speedIndex) || 0));
    state.challengeKey = challengeDefs[save.challengeKey] ? save.challengeKey : "standard";
    state.credits = Number(save.credits) || startingCredits();
    state.base = Number(save.base) || GAME_DATA.mission.baseIntegrity;
    state.waveIndex = Number(save.waveIndex) || 0;
    state.waveActive = Boolean(save.waveActive);
    state.waveCountdown = Number(save.waveCountdown) || 0;
    state.spawnQueue = Array.isArray(save.spawnQueue) ? save.spawnQueue.map((item) => ({ type: item.type, delay: Number(item.delay) || 0 })) : [];
    state.spawnTimer = Number(save.spawnTimer) || 0;
    state.towers = Array.isArray(save.towers)
      ? save.towers.map((tower) => ({
          type: tower.type,
          x: tower.x,
          y: tower.y,
          level: Math.max(1, Math.min(3, Number(tower.level) || 1)),
          branch: tower.branch || null,
          cooldown: Number(tower.cooldown) || 0,
          def: towerDefs[tower.type],
        })).filter((tower) => tower.def)
      : [];
    state.enemies = Array.isArray(save.enemies)
      ? save.enemies.map((enemy) => {
          const def = enemyDefs[enemy.type];
          if (!def) return null;
          return {
            type: enemy.type,
            def,
            hp: Number(enemy.hp) || def.hp,
            maxHp: Number(enemy.maxHp) || def.hp,
            reward: Number(enemy.reward) || def.reward,
            shield: Number(enemy.shield) || 0,
            maxShield: Number(enemy.maxShield) || Number(enemy.shield) || def.shield || 0,
            path: Array.isArray(enemy.path) ? enemy.path.map((cell) => ({ x: cell.x, y: cell.y })) : [],
            pathIndex: Math.max(0, Number(enemy.pathIndex) || 0),
            x: Number(enemy.x) || 0,
            y: Number(enemy.y) || 0,
            slowUntil: Number(enemy.slowUntil) || 0,
            slowMultiplier: Number(enemy.slowMultiplier) || 1,
            armorShred: Number(enemy.armorShred) || 0,
            armorShredUntil: Number(enemy.armorShredUntil) || 0,
            splitDepth: Number(enemy.splitDepth) || 0,
            reached: Boolean(enemy.reached),
          };
        }).filter(Boolean)
      : [];
    state.selectedTowerType = save.selectedTowerType || null;
    state.selectedAbility = save.selectedAbility || null;
    state.selectedTower = null;
    state.hoverCell = null;
    state.projectiles = [];
    state.effects = [];
    state.basePulse = 0;
    state.screenShake = 0;
    state.banner = { text: "", life: 0 };
    state.message = save.message || "Mission restored.";
    state.log = Array.isArray(save.log) && save.log.length ? save.log.slice(0, 5) : ["Mission restored."];
    state.gameOver = false;
    state.victory = false;
    state.lastTime = performance.now();
    state.stats = {
      towersBuilt: Number(save.stats?.towersBuilt) || 0,
      towersSold: Number(save.stats?.towersSold) || 0,
      upgradesPurchased: Number(save.stats?.upgradesPurchased) || 0,
      enemiesDestroyed: Number(save.stats?.enemiesDestroyed) || 0,
      enemiesLeaked: Number(save.stats?.enemiesLeaked) || 0,
      baseDamageTaken: Number(save.stats?.baseDamageTaken) || 0,
      damageDealt: Number(save.stats?.damageDealt) || 0,
      abilitiesUsed: Number(save.stats?.abilitiesUsed) || 0,
      wavesCleared: Number(save.stats?.wavesCleared) || 0,
      saves: Number(save.stats?.saves) || 0,
    };
    restoreAbilityCooldowns(save.cooldowns || {});
    ui.overlay.classList.add("hidden");
    ui.overlayTitle.textContent = "Hold the corridor.";
    ui.overlayText.textContent = "Build a maze, keep the convoy path open, upgrade towers, and use commander abilities to stop the siege wave.";
    ui.resultStats.innerHTML = "";
    ui.start.textContent = "Start Mission";
    state.upgradeKey = "";
    if (manual) setMessage("Mission restored from save.", true);
    return true;
  } catch {
    if (manual) setMessage("Save data was corrupted.", true);
    return false;
  }
}

function spawnEnemy(type, options = {}) {
  const def = enemyDefs[type];
  const path = options.path || (options.cell ? findPathFrom(options.cell) : currentPath()) || currentPath();
  const pos = centerOf(path[0]);
  const hpMultiplier = (options.hpMultiplier || 1) * (challenge().enemyHpMultiplier || 1);
  const rewardMultiplier = (options.rewardMultiplier || 1) * (challenge().rewardMultiplier || 1);
  const maxHp = Math.round(def.hp * hpMultiplier);
  state.enemies.push({
    type,
    def,
    hp: maxHp,
    maxHp,
    reward: Math.max(1, Math.round(def.reward * rewardMultiplier)),
    shield: Math.round((def.shield || 0) * hpMultiplier),
    maxShield: Math.round((def.shield || 0) * hpMultiplier),
    path,
    pathIndex: 0,
    x: options.x ?? pos.x,
    y: options.y ?? pos.y,
    slowUntil: 0,
    slowMultiplier: 1,
    armorShred: 0,
    armorShredUntil: 0,
    splitDepth: options.splitDepth || 0,
    reached: false,
  });
}

function queueWave() {
  if (state.waveActive || state.gameOver || state.waveIndex >= waves.length) return;
  const wave = waves[state.waveIndex];
  state.waveActive = true;
  state.waveCountdown = 2.2;
  state.spawnQueue = [];
  wave.groups.forEach((group) => {
    for (let i = 0; i < group.count; i++) {
      state.spawnQueue.push({ type: group.type, delay: group.gap });
    }
  });
  state.spawnTimer = 0.2;
  setMessage(`Wave ${state.waveIndex + 1}: ${wave.name} inbound.`, true);
  showBanner(`Wave ${state.waveIndex + 1} inbound`);
  playWaveCue();
  saveGameState();
}

function damageEnemy(enemy, amount, options = {}) {
  if (options.breaksShield) enemy.shield = 0;
  const now = performance.now() / 1000;
  if (options.armorShred) {
    enemy.armorShred = Math.max(enemy.armorShred || 0, options.armorShred);
    enemy.armorShredUntil = Math.max(enemy.armorShredUntil || 0, now + 4.5);
  }
  const activeShred = enemy.armorShredUntil && now < enemy.armorShredUntil ? enemy.armorShred || 0 : 0;
  const effectiveArmor = Math.max(0, (enemy.def.armor || 0) - (options.armorPierce || 0) - activeShred);
  let damage = Math.max(1, amount * (enemy.def.boss ? options.bossMultiplier || 1 : 1) - effectiveArmor);
  state.stats.damageDealt += damage;
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
    state.credits += enemy.reward || enemy.def.reward;
    addEffect(enemy.x, enemy.y, enemy.def.color, 0.4, 28);
    if (enemy.def.splitInto && (enemy.splitDepth || 0) < 1) {
      const split = enemy.def.splitInto;
      const cell = Core.screenToCell(grid, enemy.x, enemy.y);
      for (let i = 0; i < split.count; i++) {
        spawnEnemy(split.type, {
          cell,
          x: enemy.x + (i - (split.count - 1) / 2) * 12,
          y: enemy.y + (i % 2 ? 8 : -8),
          hpMultiplier: split.hpMultiplier || 0.75,
          rewardMultiplier: split.rewardMultiplier || 0.5,
          splitDepth: (enemy.splitDepth || 0) + 1,
        });
      }
      addEffect(enemy.x, enemy.y, "#ffdf7e", 0.35, 44);
    }
    enemy.dead = true;
    state.stats.enemiesDestroyed += 1;
  }
}

function addEffect(x, y, color, life, radius) {
  state.effects.push({ x, y, color, life, maxLife: life, radius });
}

function updateSpawning(dt) {
  if (!state.waveActive || state.spawnQueue.length === 0) return;
  if (state.waveCountdown > 0) {
    state.waveCountdown = Math.max(0, state.waveCountdown - dt);
    return;
  }
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
    if (enemy.def.regen && enemy.hp < enemy.maxHp) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.def.regen * dt);
    }
    if (enemy.def.repairAura) {
      for (const ally of state.enemies) {
        if (ally === enemy || ally.dead) continue;
        const dist = Math.hypot(ally.x - enemy.x, ally.y - enemy.y);
        if (dist < 115) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 8 * dt);
          if (ally.maxShield && ally.shield < ally.maxShield) ally.shield = Math.min(ally.maxShield, ally.shield + 10 * dt);
        }
      }
    }
    if (enemy.pathIndex >= enemy.path.length - 1) {
      enemy.reached = true;
      const baseDamage = enemy.def.boss ? 35 : enemy.def.threat === "Mini-Boss" ? 18 : 8;
      state.base -= baseDamage;
      state.stats.enemiesLeaked += 1;
      state.stats.baseDamageTaken += baseDamage;
      enemy.dead = true;
      state.basePulse = 1;
      state.screenShake = Math.max(state.screenShake, enemy.def.boss ? 1 : 0.55);
      addEffect(enemy.x, enemy.y, "#ff6f5f", 0.55, 44);
      playBaseHit();
      continue;
    }

    const target = centerOf(enemy.path[enemy.pathIndex + 1]);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    const slow = now < enemy.slowUntil ? enemy.slowMultiplier : 1;
    const menderBoost = state.enemies.some((ally) => ally !== enemy && ally.def.repairAura && Math.hypot(ally.x - enemy.x, ally.y - enemy.y) < 115) ? 1.08 : 1;
    const speed = enemy.def.speed * slow * menderBoost * 72;

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
    state.stats.wavesCleared += 1;
    if (state.waveIndex >= waves.length) {
      endGame(true);
    } else {
      setMessage(`Wave cleared. +${clearedWave.reward} credits. Prepare for wave ${state.waveIndex + 1}.`, true);
      showBanner(`Wave cleared +${clearedWave.reward} credits`, 2.2);
      saveGameState();
    }
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    let stats = towerStats(tower);
    const origin = centerOf(tower);
    let target = null;
    let best = Infinity;

    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.x - origin.x, enemy.y - origin.y) / grid.tileW;
      const score = Core.scoreEnemyForTower(tower, enemy, dist);
      if (dist <= stats.range && score < best) {
        target = enemy;
        best = score;
      }
    }

    if (!target) continue;

    stats = Core.effectiveTowerStats(tower, target);
    const jammerPenalty = state.enemies.some((enemy) => enemy.def.jammer && Math.hypot(enemy.x - origin.x, enemy.y - origin.y) < 160) ? 1.35 : 1;
    tower.cooldown = stats.fireRate * jammerPenalty;

    if (tower.def.pierce) {
      damageEnemy(target, stats.damage, {
        armorPierce: stats.armorPierce,
        bossMultiplier: stats.bossMultiplier,
        breaksShield: stats.breaksShield,
        armorShred: stats.armorShred,
      });
      state.projectiles.push({ x: origin.x, y: origin.y - 34, tx: target.x, ty: target.y, life: 0.16, color: stats.accent, beam: true });
      addEffect(target.x, target.y, stats.accent, 0.2, 16);
      playFire(tower.type);
      playImpact(target.def.boss);
    } else {
      state.projectiles.push({
        x: origin.x,
        y: origin.y - 24,
        target,
        speed: tower.def.homing ? 460 : 620,
        damage: stats.damage,
        splash: stats.splash,
        slow: stats.slow,
        slowTime: stats.slowTime,
        armorPierce: stats.armorPierce,
        bossMultiplier: stats.bossMultiplier,
        breaksShield: stats.breaksShield,
        armorShred: stats.armorShred,
        color: stats.accent,
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
          if (splashDist <= p.splash) {
            damageEnemy(enemy, p.damage * (1 - splashDist / (p.splash + 0.1)), {
              armorPierce: p.armorPierce,
              bossMultiplier: p.bossMultiplier,
              breaksShield: p.breaksShield,
              armorShred: p.armorShred,
            });
          }
        }
        addEffect(p.target.x, p.target.y, p.color, 0.35, 42);
        state.screenShake = Math.max(state.screenShake, 0.18);
        playImpact(true);
      } else {
        damageEnemy(p.target, p.damage, {
          slow: p.slow,
          slowTime: p.slowTime,
          armorPierce: p.armorPierce,
          bossMultiplier: p.bossMultiplier,
          breaksShield: p.breaksShield,
          armorShred: p.armorShred,
        });
        addEffect(p.target.x, p.target.y, p.color, 0.22, 18);
        if (p.damage > 100 || p.target.def.boss) state.screenShake = Math.max(state.screenShake, 0.12);
        playImpact(p.target.def.boss);
      }
      p.dead = true;
    } else {
      p.vx = (dx / dist) * p.speed;
      p.vy = (dy / dist) * p.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.dead && (p.life === undefined || p.life > 0));
}

function updateEffects(dt) {
  state.effects.forEach((effect) => effect.life -= dt);
  state.effects = state.effects.filter((effect) => effect.life > 0);
  state.basePulse = Math.max(0, state.basePulse - dt * 2.4);
  state.screenShake = Math.max(0, state.screenShake - dt * 3.2);
  if (state.banner.life > 0) state.banner.life = Math.max(0, state.banner.life - dt);
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
  const preview = Core.classifyBuildCell(grid, state, cell);
  if (preview.type !== "valid") {
    setMessage(`Cannot deploy there: ${preview.label}.`, true);
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
  state.stats.towersBuilt += 1;
  refreshEnemyPaths();
  setMessage(`${def.name} deployed.`, true);
  playDeploy();
  saveGameState();
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
    state.stats.abilitiesUsed += 1;
    setMessage("Emergency repair completed.", true);
    addEffect(centerOf(grid.base).x, centerOf(grid.base).y, ability.color, 0.7, 70);
    playAbility(key);
    saveGameState();
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
  state.stats.abilitiesUsed += 1;
  setMessage(`${ability.name} executed.`, true);
  addEffect(hit.x, hit.y, ability.color, 0.65, ability.radius * grid.tileW);
  playAbility(key);
  saveGameState();
}

function upgradeSelected() {
  const tower = state.selectedTower;
  if (!tower || tower.level >= 3) return;
  const cost = towerUpgradeCost(tower);
  if (tower.def.branches && tower.level === 1 && !tower.branch) {
    setMessage("Choose a branch upgrade from the panel below.", true);
    playUi();
    UiPanel.renderUpgradeChoices(ui.upgradeChoices, tower, chooseBranchUpgrade);
    return;
  }
  if (state.credits < cost) {
    setMessage(`Insufficient credits. Upgrade costs ${cost}.`, true);
    playDenied();
    return;
  }
  state.credits -= cost;
  tower.level++;
  state.stats.upgradesPurchased += 1;
  setMessage(`${tower.def.name} upgraded to tier ${tower.level}.`, true);
  const pos = centerOf(tower);
  addEffect(pos.x, pos.y - 20, towerStats(tower).accent, 0.55, 54);
  playDeploy();
  state.upgradeKey = "";
  saveGameState();
}

function sellSelected() {
  const tower = state.selectedTower;
  if (!tower) return;
  if (challenge().noSell) {
    setMessage("Locked Emplacements challenge: selling is disabled.", true);
    playDenied();
    return;
  }
  state.credits += Math.round(tower.def.cost * (0.5 + tower.level * 0.18));
  state.towers = state.towers.filter((item) => item !== tower);
  state.selectedTower = null;
  state.stats.towersSold += 1;
  setMessage("Tower sold.", true);
  playUi();
  saveGameState();
}

function renderMissionSummary(victory) {
  UiPanel.renderMissionSummary(ui.resultStats, state.stats, waves.length, state.base, victory, challenge());
  ui.overlayTitle.textContent = victory ? "Sector secured." : "Base overrun.";
  ui.overlayText.textContent = victory
    ? UiPanel.missionDiagnosis(state.stats, true)
    : UiPanel.missionDiagnosis(state.stats, false);
}

function resetMissionChrome() {
  ui.pauseOverlay.classList.add("hidden");
  ui.battleBanner.classList.remove("visible");
  ui.battleBanner.textContent = "";
  ui.resultStats.innerHTML = "";
  ui.towerDetails.innerHTML = "";
  ui.upgradeChoices.innerHTML = "";
  ui.overlayTitle.textContent = "Hold the corridor.";
  ui.overlayText.textContent = "Build a maze, keep the convoy path open, upgrade towers, and use commander abilities to stop the siege wave.";
}

function showStartOverlay(message = "New mission ready. Choose a challenge mode, then start when you are ready.") {
  clearSavedGame();
  Object.assign(state, {
    started: false,
    paused: false,
    speedIndex: 0,
    credits: startingCredits(),
    base: GAME_DATA.mission.baseIntegrity,
    waveIndex: 0,
    waveActive: false,
    waveCountdown: 0,
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
    upgradeKey: "",
    message,
    log: ["Mission reset."],
    gameOver: false,
    victory: false,
    lastTime: performance.now(),
    pauseStartedAt: 0,
    basePulse: 0,
    screenShake: 0,
    banner: { text: "", life: 0 },
    stats: Core.createStats(),
  });
  Object.values(abilityDefs).forEach((ability) => ability.readyAt = 0);
  resetMissionChrome();
  ui.overlay.classList.remove("hidden");
  ui.start.textContent = "Start Mission";
  state.upgradeKey = "";
  updateUi();
  draw();
}

function endGame(victory) {
  state.gameOver = true;
  state.victory = victory;
  state.paused = false;
  state.waveActive = false;
  state.waveCountdown = 0;
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.banner = { text: "", life: 0 };
  addLog(victory ? "Mission victory confirmed." : "Base integrity failed.");
  playMissionEnd(victory);
  renderMissionSummary(victory);
  ui.overlay.classList.remove("hidden");
  ui.start.textContent = "Restart Mission";
  clearSavedGame();
}

function restart() {
  clearSavedGame();
  Object.assign(state, {
    started: true,
    paused: false,
    speedIndex: 0,
    credits: startingCredits(),
    base: GAME_DATA.mission.baseIntegrity,
    waveIndex: 0,
    waveActive: false,
    waveCountdown: 0,
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
    upgradeKey: "",
    message: "Build a maze, then launch wave one.",
    log: ["Mission started.", "Build phase active."],
    gameOver: false,
    victory: false,
    lastTime: performance.now(),
    pauseStartedAt: 0,
    basePulse: 0,
    screenShake: 0,
    banner: { text: "", life: 0 },
    stats: Core.createStats(),
  });
  Object.values(abilityDefs).forEach((ability) => ability.readyAt = 0);
  resetMissionChrome();
  ui.overlay.classList.add("hidden");
  ui.start.textContent = "Start Mission";
  updateUi();
  draw();
  saveGameState();
}

function draw() {
  drawBattlefield(ctx, canvas, grid, state);
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
  ui.waveTraits.textContent = describeWaveTraits(state.waveIndex);
  ui.combatLog.innerHTML = state.log.map((entry) => `<span>${entry}</span>`).join("");
  ui.selection.textContent = state.selectedTower
    ? UiPanel.selectedTowerText(state.selectedTower, state.message)
    : state.message;
  UiPanel.renderTowerDetails(ui.towerDetails, state.selectedTower);
  ui.upgrade.disabled = !state.selectedTower || state.selectedTower.level >= 3;
  ui.upgrade.textContent = state.selectedTower ? UiPanel.towerUpgradeLabel(state.selectedTower) : "Upgrade";
  ui.sell.disabled = !state.selectedTower || challenge().noSell;
  ui.nextWave.disabled = state.waveActive || state.gameOver || !state.started || state.paused;
  ui.pauseToggle.disabled = !state.started || state.gameOver;
  ui.pauseToggle.textContent = state.paused ? "Resume" : "Pause";
  ui.speedToggle.disabled = !state.started || state.gameOver;
  ui.speedToggle.textContent = `Speed x${SPEED_STEPS[state.speedIndex] || 1}`;
  ui.saveGame.disabled = !state.started || state.gameOver;
  ui.loadGame.disabled = !hasSavedGame();
  ui.resetGame.disabled = false;
  ui.pauseOverlay.classList.toggle("hidden", !state.paused || state.gameOver);
  ui.battleBanner.textContent = state.waveCountdown > 0
    ? `Wave starts in ${Math.ceil(state.waveCountdown)}`
    : state.banner.text;
  ui.battleBanner.classList.toggle("visible", state.waveCountdown > 0 || state.banner.life > 0);

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
  document.querySelectorAll("[data-challenge]").forEach((button) => {
    button.classList.toggle("active", button.dataset.challenge === state.challengeKey);
  });

  const upgradeKey = state.selectedTower
    ? `${state.selectedTower.type}:${state.selectedTower.level}:${state.selectedTower.branch || ""}`
    : "none";
  if (state.upgradeKey !== upgradeKey) {
    state.upgradeKey = upgradeKey;
    UiPanel.renderUpgradeChoices(ui.upgradeChoices, state.selectedTower, chooseBranchUpgrade);
  }
}

function tick(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.033, (nowMs - state.lastTime) / 1000 || 0);
  state.lastTime = nowMs;

  if (state.started && !state.gameOver && !state.paused) {
    const scaledDt = dt * (SPEED_STEPS[state.speedIndex] || 1);
    updateSpawning(scaledDt);
    updateEnemies(scaledDt, now);
    updateTowers(scaledDt);
    updateProjectiles(scaledDt);
    updateEffects(scaledDt);
  }

  draw();
  updateUi();
  requestAnimationFrame(tick);
}

function buildButtons() {
  Object.entries(challengeDefs).forEach(([key, mode]) => {
    const button = document.createElement("button");
    button.className = "challenge-button";
    button.dataset.challenge = key;
    button.innerHTML = `<strong>${mode.name}</strong><span>${mode.description}</span>`;
    button.addEventListener("click", () => {
      ensureAudio();
      state.challengeKey = key;
      setMessage(`${mode.name} challenge selected.`);
      playUi();
      updateUi();
    });
    ui.challengeModes.appendChild(button);
  });

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
ui.pauseToggle.addEventListener("click", () => {
  ensureAudio();
  if (!state.started || state.gameOver) return;
  const now = performance.now() / 1000;
  if (!state.paused) {
    state.paused = true;
    state.pauseStartedAt = now;
    setMessage("Mission paused.", true);
  } else {
    const pausedFor = Math.max(0, now - (state.pauseStartedAt || now));
    Object.values(abilityDefs).forEach((ability) => {
      if (ability.readyAt) ability.readyAt += pausedFor;
    });
    state.enemies.forEach((enemy) => {
      if (enemy.slowUntil) enemy.slowUntil += pausedFor;
    });
    state.paused = false;
    state.pauseStartedAt = 0;
    setMessage("Mission resumed.", true);
  }
  playUi();
  saveGameState();
});
ui.speedToggle.addEventListener("click", () => {
  ensureAudio();
  if (!state.started || state.gameOver) return;
  state.speedIndex = (state.speedIndex + 1) % SPEED_STEPS.length;
  setMessage(`Time scale set to x${SPEED_STEPS[state.speedIndex]}.`, true);
  playUi();
  saveGameState();
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
ui.saveGame.addEventListener("click", () => {
  ensureAudio();
  saveGameState(true);
});
ui.loadGame.addEventListener("click", () => {
  ensureAudio();
  loadGameState(true);
});
ui.resetGame.addEventListener("click", () => {
  ensureAudio();
  playUi();
  showStartOverlay();
});
ui.debugCredits.addEventListener("click", () => {
  if (!DEBUG_MODE) return;
  state.credits += 500;
  setMessage("Debug credits added.", true);
});
ui.debugWave.addEventListener("click", () => {
  if (!DEBUG_MODE || !state.started || state.gameOver) return;
  state.spawnQueue = [];
  state.enemies = [];
  state.waveActive = false;
  state.waveCountdown = 0;
  state.waveIndex = Math.min(waves.length - 1, state.waveIndex + 1);
  showBanner("Debug wave skip", 1.4);
  setMessage("Debug wave skip applied.", true);
});
ui.debugSaveClear.addEventListener("click", () => {
  if (!DEBUG_MODE) return;
  clearSavedGame();
  setMessage("Debug save cleared.", true);
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

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => {
  if (state.started && !state.gameOver) saveGameState();
});

buildButtons();
setVolume(ui.volume.value);
ui.debugPanel.hidden = !DEBUG_MODE;
loadGameState(false);
requestAnimationFrame(tick);
