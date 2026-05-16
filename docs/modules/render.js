import { cellKey, centerOf, classifyBuildCell, currentPath, terrainHas, towerStats } from "./core.js";

function drawTile(ctx, grid, cell, fill, stroke = "#2a4037") {
  const p = centerOf(grid, cell);
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

function drawTerrainDetail(ctx, grid, cell, key) {
  const p = centerOf(grid, cell);

  if (terrainHas(grid, "runway", key)) {
    ctx.strokeStyle = "rgba(143, 176, 187, 0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 18, p.y);
    ctx.lineTo(p.x + 18, p.y);
    ctx.stroke();
  }

  if (terrainHas(grid, "reinforced", key)) {
    ctx.strokeStyle = "rgba(111, 243, 164, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 16, p.y - 10, 32, 20);
  }

  if (terrainHas(grid, "hazard", key)) {
    ctx.fillStyle = "rgba(255, 207, 90, 0.2)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 10);
    ctx.lineTo(p.x + 14, p.y + 8);
    ctx.lineTo(p.x - 14, p.y + 8);
    ctx.closePath();
    ctx.fill();
  }

  if (terrainHas(grid, "relay", key)) {
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

function drawBlockedDetail(ctx, grid, cell, key) {
  const p = centerOf(grid, cell);
  const blockW = Math.max(16, grid.tileW * 0.56);
  const blockH = Math.max(12, grid.tileH * 0.85);
  const capW = blockW * 0.55;
  ctx.fillStyle = terrainHas(grid, "relay", key) ? "#102d2a" : "#111615";
  ctx.fillRect(p.x - blockW / 2, p.y - blockH - 6, blockW, blockH + 6);
  ctx.fillStyle = terrainHas(grid, "relay", key) ? "#6ff3d0" : "#53645e";
  ctx.fillRect(p.x - capW / 2, p.y - blockH - 13, capW, 7);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.strokeRect(p.x - blockW / 2, p.y - blockH - 6, blockW, blockH + 6);
}

function drawTowerRange(ctx, grid, tower) {
  const stats = towerStats(tower);
  const p = centerOf(grid, tower);
  const radius = stats.range * grid.tileW;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = stats.accent;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = stats.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawTower(ctx, grid, tower) {
  const p = centerOf(grid, tower);
  const stats = towerStats(tower);
  const size = 18 + tower.level * 3;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = stats.color;
  ctx.fillRect(p.x - size / 2, p.y - 26 - tower.level * 3, size, 26 + tower.level * 3);
  ctx.fillStyle = stats.accent;
  ctx.fillRect(p.x - 4, p.y - 44 - tower.level * 4, 8, 18);
  ctx.fillStyle = "#09110f";
  ctx.font = "700 12px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(tower.level, p.x, p.y - 9);
}

function drawEnemyMarkers(ctx, enemy, width, y) {
  const markers = [
    enemy.shield > 0 ? "#80f6ff" : null,
    enemy.def.armor > 0 ? "#ffcf5a" : null,
    enemy.def.jammer ? "#de7dff" : null,
    enemy.def.boss ? "#ff6f5f" : null,
  ].filter(Boolean);
  markers.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(enemy.x - width / 2 + 5 + index * 8, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawEnemy(ctx, enemy) {
  const width = enemy.def.boss ? 44 : enemy.def.threat === "Mini-Boss" ? 36 : 26;
  const height = enemy.def.boss ? 34 : enemy.def.threat === "Mini-Boss" ? 28 : 22;
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
  drawEnemyMarkers(ctx, enemy, width, enemy.y - height / 2 - 17);
}

function hoverFill(grid, state, cell, fallback) {
  if (!cell || state.selectedAbility) return state.selectedAbility ? "#31506a" : fallback;
  if (!state.selectedTowerType) return "#263b34";
  const preview = classifyBuildCell(grid, state, cell);
  const fills = {
    valid: "#285c3f",
    blocked: "#54312f",
    occupied: "#56451f",
    reserved: "#4b2634",
    enemy: "#59353f",
    path: "#5b2e2e",
    none: fallback,
  };
  return fills[preview.type] || fallback;
}

export function drawBattlefield(ctx, canvas, grid, state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0b1714");
  grad.addColorStop(1, "#14201c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const path = currentPath(grid, state);
  const pathKeys = new Set(path.map((cell) => cellKey(cell.x, cell.y)));

  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const key = cellKey(x, y);
      let fill = "#172520";
      if (grid.blocked.has(key)) fill = "#0a0f0e";
      if (terrainHas(grid, "hazard", key)) fill = "#2b291d";
      if (terrainHas(grid, "reinforced", key)) fill = "#1d302a";
      if (pathKeys.has(key)) fill = "#25362e";
      if (terrainHas(grid, "runway", key) && pathKeys.has(key)) fill = "#2d3a34";
      if (x === grid.spawn.x && y === grid.spawn.y) fill = "#394025";
      if (x === grid.base.x && y === grid.base.y) fill = "#3d2523";
      if (state.hoverCell && state.hoverCell.x === x && state.hoverCell.y === y) {
        fill = hoverFill(grid, state, { x, y }, fill);
      }
      drawTile(ctx, grid, { x, y }, fill);
      drawTerrainDetail(ctx, grid, { x, y }, key);
      if (grid.blocked.has(key)) drawBlockedDetail(ctx, grid, { x, y }, key);
    }
  }

  if (state.selectedTower) drawTowerRange(ctx, grid, state.selectedTower);

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

  state.towers.forEach((tower) => drawTower(ctx, grid, tower));

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

  state.enemies.forEach((enemy) => drawEnemy(ctx, enemy));

  if (state.basePulse > 0) {
    ctx.globalAlpha = Math.min(0.28, state.basePulse * 0.28);
    ctx.fillStyle = "#ff6f5f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}
