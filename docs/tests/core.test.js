import { GAME_DATA } from "../data.js";
import {
  classifyBuildCell,
  createGrid,
  createStats,
  describeWaveTraits,
  effectiveTowerStats,
  findPath,
  makeTower,
  scoreEnemyForTower,
  towerStats,
  towerUpgradeCost,
} from "../modules/core.js";
import { isTerminalSave, migrateSave, serializeState } from "../modules/storage.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function baseState() {
  return {
    started: true,
    paused: false,
    speedIndex: 0,
    credits: GAME_DATA.mission.startCredits,
    base: GAME_DATA.mission.baseIntegrity,
    waveIndex: 0,
    waveActive: false,
    waveCountdown: 0,
    spawnQueue: [],
    spawnTimer: 0,
    towers: [],
    enemies: [],
    selectedTowerType: "rifle",
    selectedAbility: null,
    selectedTower: null,
    hoverCell: null,
    message: "",
    log: [],
    gameOver: false,
    victory: false,
    lastTime: 0,
    pauseStartedAt: 0,
    basePulse: 0,
    banner: { text: "", life: 0 },
    stats: createStats(),
  };
}

const grid = createGrid(GAME_DATA.grid);

{
  const state = baseState();
  assert(findPath(grid, state)?.length > 0, "default map should have a valid convoy path");
}

{
  const state = baseState();
  assert(classifyBuildCell(grid, state, grid.spawn).type === "reserved", "spawn tile should be reserved");
  assert(classifyBuildCell(grid, state, { x: 5, y: 3 }).type === "blocked", "blocked terrain should reject builds");
  assert(classifyBuildCell(grid, state, { x: 2, y: 12 }).type === "valid", "open terrain should allow builds");
}

{
  const state = baseState();
  state.towers.push(makeTower(GAME_DATA.towers, "rifle", 2, 12));
  assert(classifyBuildCell(grid, state, { x: 2, y: 12 }).type === "occupied", "occupied tile should reject builds");
}

{
  const tower = makeTower(GAME_DATA.towers, "missile", 4, 14);
  assert(towerUpgradeCost(tower, "cluster") === GAME_DATA.towers.missile.branches.cluster.tiers[0].cost, "branch cost should come from data");
  tower.branch = "cluster";
  tower.level = 2;
  const stats = towerStats(tower);
  assert(stats.splash > GAME_DATA.towers.missile.splash, "cluster branch should improve splash");
}

{
  const tower = makeTower(GAME_DATA.towers, "missile", 4, 14);
  tower.branch = "bunker";
  tower.level = 2;
  const target = { def: GAME_DATA.enemies.carrier, shield: 0, slowUntil: 999, armorShredUntil: 0 };
  const stats = effectiveTowerStats(tower, target, 1);
  assert(stats.damage > towerStats(tower).damage, "bunker missiles should gain damage against slowed targets");
}

{
  const tower = makeTower(GAME_DATA.towers, "drone", 4, 14);
  tower.branch = "interceptor";
  tower.level = 2;
  const supportScore = scoreEnemyForTower(tower, { def: GAME_DATA.enemies.mender }, 3, 1);
  const normalScore = scoreEnemyForTower(tower, { def: GAME_DATA.enemies.scout }, 3, 1);
  assert(supportScore < normalScore, "interceptor drones should prioritize support enemies");
}

{
  const traits = describeWaveTraits(GAME_DATA.waves, GAME_DATA.enemies, 3);
  assert(traits.includes("Splits"), "wave intel should surface splitter threats");
}

{
  const state = baseState();
  state.towers.push(makeTower(GAME_DATA.towers, "rifle", 2, 12));
  const payload = serializeState(state, GAME_DATA.abilities, true);
  assert(payload.version === 3, "new saves should use version 3");
  assert(payload.stats.saves === 1, "manual save should increment save count in payload");
}

{
  const migrated = migrateSave({ version: 2, started: true, stats: { towersBuilt: 1 } });
  assert(migrated.version === 3, "v2 saves should migrate to v3");
  assert(migrated.waveCountdown === 0, "migrated saves should default wave countdown");
  assert(migrated.stats.towersBuilt === 1, "migrated saves should preserve stats");
}

{
  const terminalSave = {
    version: 3,
    started: true,
    base: 84,
    waveIndex: GAME_DATA.waves.length,
    waveActive: false,
    spawnQueue: [],
    enemies: [],
  };
  assert(isTerminalSave(terminalSave, GAME_DATA.waves.length), "completed missions should be treated as terminal saves");
}

{
  const activeSave = {
    version: 3,
    started: true,
    base: 84,
    waveIndex: GAME_DATA.waves.length - 1,
    waveActive: true,
    spawnQueue: [],
    enemies: [{ type: "drone" }],
  };
  assert(!isTerminalSave(activeSave, GAME_DATA.waves.length), "active missions should remain loadable");
}

console.log("core tests passed");
