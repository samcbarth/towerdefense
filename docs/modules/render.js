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

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
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
    polygon(ctx, [
      { x: p.x, y: p.y - 10 },
      { x: p.x + 14, y: p.y + 8 },
      { x: p.x - 14, y: p.y + 8 },
    ]);
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
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = stats.accent;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = stats.accent;
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function towerBranchColor(tower, stats) {
  return tower.def.branches?.[tower.branch]?.color || stats.accent;
}

function drawTowerPedestal(ctx, p, tone, accent) {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101715";
  polygon(ctx, [
    { x: p.x, y: p.y - 6 },
    { x: p.x + 18, y: p.y + 4 },
    { x: p.x, y: p.y + 14 },
    { x: p.x - 18, y: p.y + 4 },
  ]);
  ctx.fill();
  ctx.strokeStyle = tone;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p.x - 10, p.y + 4);
  ctx.lineTo(p.x + 10, p.y + 4);
  ctx.stroke();
}

function drawRifleTower(ctx, p, tower, stats, now) {
  const branchColor = towerBranchColor(tower, stats);
  const pulse = Math.sin(now * 0.01 + tower.x) * 1.5;
  drawTowerPedestal(ctx, p, stats.color, branchColor);
  ctx.fillStyle = stats.color;
  ctx.fillRect(p.x - 9, p.y - 24, 18, 24);
  ctx.fillStyle = branchColor;
  ctx.fillRect(p.x - 3, p.y - 34, 6, 12);
  ctx.fillStyle = "#dff8ff";
  if (tower.branch === "rapid") {
    ctx.fillRect(p.x - 10, p.y - 32 + pulse, 5, 18);
    ctx.fillRect(p.x + 5, p.y - 32 - pulse, 5, 18);
  } else {
    ctx.fillRect(p.x - 2, p.y - 38, 4, 24);
    ctx.fillRect(p.x - 1, p.y - 42, 2, 6);
  }
}

function drawMissileTower(ctx, p, tower, stats, now) {
  const branchColor = towerBranchColor(tower, stats);
  const sway = Math.sin(now * 0.006 + tower.y) * 2;
  drawTowerPedestal(ctx, p, stats.color, branchColor);
  ctx.fillStyle = stats.color;
  ctx.fillRect(p.x - 14, p.y - 18, 28, 18);
  ctx.fillStyle = "#3b2f1d";
  ctx.fillRect(p.x - 10, p.y - 28, 8, 12);
  ctx.fillRect(p.x + 2, p.y - 28, 8, 12);
  ctx.fillStyle = branchColor;
  if (tower.branch === "cluster") {
    ctx.fillRect(p.x - 12, p.y - 30 + sway * 0.3, 12, 5);
    ctx.fillRect(p.x, p.y - 30 - sway * 0.3, 12, 5);
    ctx.fillRect(p.x - 6, p.y - 37, 12, 4);
  } else {
    ctx.fillRect(p.x - 11, p.y - 34, 9, 6);
    ctx.fillRect(p.x + 2, p.y - 34, 9, 6);
    ctx.fillRect(p.x - 2, p.y - 40, 4, 10);
  }
}

function drawRailgunTower(ctx, p, tower, stats, now) {
  const branchColor = towerBranchColor(tower, stats);
  const charge = (Math.sin(now * 0.008 + tower.x * 0.6) + 1) * 0.5;
  drawTowerPedestal(ctx, p, stats.color, branchColor);
  ctx.fillStyle = stats.color;
  ctx.fillRect(p.x - 7, p.y - 34, 14, 34);
  ctx.strokeStyle = branchColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 24, 7 + charge * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d8e4ff";
  if (tower.branch === "cycling") {
    ctx.fillRect(p.x - 14, p.y - 30, 28, 5);
    ctx.fillRect(p.x - 11, p.y - 24, 22, 4);
  } else {
    ctx.fillRect(p.x - 18, p.y - 32, 36, 6);
    ctx.fillRect(p.x - 3, p.y - 42, 6, 14);
  }
}

function drawEmpTower(ctx, p, tower, stats, now) {
  const branchColor = towerBranchColor(tower, stats);
  const pulse = (Math.sin(now * 0.01 + tower.y * 0.7) + 1) * 0.5;
  drawTowerPedestal(ctx, p, stats.color, branchColor);
  ctx.strokeStyle = branchColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 14, 8 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = stats.color;
  ctx.fillRect(p.x - 4, p.y - 30, 8, 30);
  ctx.fillStyle = "#dcfff7";
  ctx.fillRect(p.x - 2, p.y - 40, 4, 10);
  if (tower.branch === "breaker") {
    ctx.fillStyle = branchColor;
    ctx.fillRect(p.x - 14, p.y - 24, 8, 4);
    ctx.fillRect(p.x + 6, p.y - 24, 8, 4);
  } else {
    ctx.strokeStyle = branchColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 20, 15 + pulse * 2, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
}

function drawDroneTower(ctx, p, tower, stats, now) {
  const branchColor = towerBranchColor(tower, stats);
  const orbit = now * 0.006;
  drawTowerPedestal(ctx, p, stats.color, branchColor);
  ctx.fillStyle = stats.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = branchColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, tower.branch === "hunter" ? 16 : 19, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = branchColor;
  for (let i = 0; i < 2; i++) {
    const angle = orbit + i * Math.PI;
    const radius = tower.branch === "hunter" ? 14 : 18;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(angle) * radius, p.y - 12 + Math.sin(angle) * radius * 0.45, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTowerLevel(ctx, p, tower) {
  ctx.fillStyle = "#09110f";
  ctx.font = "700 12px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(tower.level, p.x, p.y - 6);
}

function drawTower(ctx, grid, tower, now) {
  const p = centerOf(grid, tower);
  const stats = towerStats(tower);
  switch (tower.type) {
    case "rifle":
      drawRifleTower(ctx, p, tower, stats, now);
      break;
    case "missile":
      drawMissileTower(ctx, p, tower, stats, now);
      break;
    case "railgun":
      drawRailgunTower(ctx, p, tower, stats, now);
      break;
    case "emp":
      drawEmpTower(ctx, p, tower, stats, now);
      break;
    case "drone":
      drawDroneTower(ctx, p, tower, stats, now);
      break;
    default:
      drawTowerPedestal(ctx, p, stats.color, stats.accent);
  }
  drawTowerLevel(ctx, p, tower);
}

function drawEnemyMarkers(ctx, enemy, width, y, now) {
  const markers = [
    enemy.shield > 0 ? "#80f6ff" : null,
    enemy.def.armor > 0 ? "#ffcf5a" : null,
    enemy.armorShredUntil && enemy.armorShredUntil > now ? "#fff4aa" : null,
    enemy.def.jammer ? "#de7dff" : null,
    enemy.def.repairAura ? "#6ff3a4" : null,
    enemy.def.splitInto ? "#f6b05d" : null,
    enemy.def.boss ? "#ff6f5f" : null,
  ].filter(Boolean);
  markers.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(enemy.x - width / 2 + 5 + index * 8, y + Math.sin(now * 0.014 + index) * 1.5, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function enemyDimensions(enemy) {
  if (enemy.def.boss) return { width: 48, height: 34 };
  if (enemy.def.threat === "Mini-Boss") return { width: 38, height: 28 };
  if (enemy.type === "swarm") return { width: 18, height: 14 };
  if (enemy.type === "scout") return { width: 22, height: 16 };
  return { width: 26, height: 22 };
}

function drawScout(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  polygon(ctx, [
    { x: enemy.x - w / 2, y: enemy.y + 2 + bob },
    { x: enemy.x + w / 4, y: enemy.y - h / 2 + bob },
    { x: enemy.x + w / 2, y: enemy.y + bob },
    { x: enemy.x + w / 4, y: enemy.y + h / 2 + bob },
  ]);
  ctx.fill();
}

function drawCarrier(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - w / 2, enemy.y - h / 2 + bob, w, h);
  ctx.fillStyle = "#56626a";
  ctx.fillRect(enemy.x - w / 2 - 2, enemy.y + h / 2 - 1 + bob, w + 4, 4);
  ctx.fillStyle = "#cfd6da";
  ctx.fillRect(enemy.x - 5, enemy.y - 5 + bob, 10, 10);
}

function drawShieldDrone(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  polygon(ctx, [
    { x: enemy.x, y: enemy.y - h / 2 + bob },
    { x: enemy.x + w / 2, y: enemy.y + bob },
    { x: enemy.x, y: enemy.y + h / 2 + bob },
    { x: enemy.x - w / 2, y: enemy.y + bob },
  ]);
  ctx.fill();
  ctx.strokeStyle = "#d9ffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + bob, w * 0.36, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSwarmBot(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  polygon(ctx, [
    { x: enemy.x - w / 2, y: enemy.y + bob },
    { x: enemy.x - 2, y: enemy.y - h / 2 + bob },
    { x: enemy.x + w / 2, y: enemy.y + bob },
    { x: enemy.x + 2, y: enemy.y + h / 2 + bob },
  ]);
  ctx.fill();
}

function drawJammer(ctx, enemy, w, h, bob, now) {
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - w / 2, enemy.y - h / 2 + bob, w, h);
  ctx.strokeStyle = "#f0b1ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(enemy.x - 5, enemy.y - h / 2 - 6 + bob);
  ctx.lineTo(enemy.x - 10, enemy.y - h / 2 - 14 + bob);
  ctx.moveTo(enemy.x + 5, enemy.y - h / 2 - 6 + bob);
  ctx.lineTo(enemy.x + 10, enemy.y - h / 2 - 14 + bob);
  ctx.stroke();
  ctx.globalAlpha = 0.2 + (Math.sin(now * 0.018) + 1) * 0.08;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + bob, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSplitter(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + bob, w * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe0ad";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(enemy.x - 5, enemy.y - 5 + bob);
  ctx.lineTo(enemy.x + 3, enemy.y + 2 + bob);
  ctx.lineTo(enemy.x - 1, enemy.y + 8 + bob);
  ctx.stroke();
}

function drawMender(ctx, enemy, w, h, bob, now) {
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - 7, enemy.y - h / 2 + bob, 14, h);
  ctx.fillRect(enemy.x - w / 2, enemy.y - 3 + bob, 6, 6);
  ctx.fillRect(enemy.x + w / 2 - 6, enemy.y - 3 + bob, 6, 6);
  ctx.strokeStyle = "rgba(111, 243, 164, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y + bob, 18 + Math.sin(now * 0.018) * 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBastion(ctx, enemy, w, h, bob) {
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - w / 2, enemy.y - h / 2 + bob, w, h);
  ctx.fillStyle = "#d5e0e7";
  ctx.fillRect(enemy.x - 6, enemy.y - h / 2 - 4 + bob, 12, 10);
  ctx.fillStyle = "#607682";
  ctx.fillRect(enemy.x - w / 2 - 4, enemy.y + h / 2 - 2 + bob, w + 8, 5);
}

function drawBoss(ctx, enemy, w, h, bob, now) {
  ctx.fillStyle = enemy.def.color;
  ctx.fillRect(enemy.x - w / 2 + 6, enemy.y - h / 2 + bob, w - 12, h);
  ctx.fillStyle = "#2e1313";
  ctx.fillRect(enemy.x - 8, enemy.y - h / 2 - 8 + bob, 16, 10);
  ctx.strokeStyle = "#ffc1b8";
  ctx.lineWidth = 3;
  for (const leg of [-16, -6, 6, 16]) {
    const swing = Math.sin(now * 0.012 + leg) * 4;
    ctx.beginPath();
    ctx.moveTo(enemy.x + leg, enemy.y + h / 2 - 2 + bob);
    ctx.lineTo(enemy.x + leg + swing, enemy.y + h / 2 + 14 + bob);
    ctx.stroke();
  }
}

function drawEnemy(ctx, enemy, now) {
  const { width, height } = enemyDimensions(enemy);
  const bob = enemy.def.boss ? Math.sin(now * 0.007) * 1.5 : Math.sin(now * 0.012 + enemy.x * 0.02) * 1.2;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 10, width * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (enemy.type) {
    case "scout":
      drawScout(ctx, enemy, width, height, bob);
      break;
    case "carrier":
      drawCarrier(ctx, enemy, width, height, bob);
      break;
    case "shield":
      drawShieldDrone(ctx, enemy, width, height, bob);
      break;
    case "swarm":
      drawSwarmBot(ctx, enemy, width, height, bob);
      break;
    case "jammer":
      drawJammer(ctx, enemy, width, height, bob, now);
      break;
    case "splitter":
      drawSplitter(ctx, enemy, width, height, bob);
      break;
    case "mender":
      drawMender(ctx, enemy, width, height, bob, now);
      break;
    case "bastion":
      drawBastion(ctx, enemy, width, height, bob);
      break;
    case "boss":
      drawBoss(ctx, enemy, width, height, bob, now);
      break;
    default:
      ctx.fillStyle = enemy.def.color;
      ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2 + bob, width, height);
  }

  if (enemy.shield > 0) {
    ctx.strokeStyle = "#80f6ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x - width / 2 - 4, enemy.y - height / 2 - 4 + bob, width + 8, height + 8);
  }
  if (enemy.armorShredUntil && enemy.armorShredUntil > now) {
    ctx.strokeStyle = "#fff4aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - width / 2, enemy.y + height / 2 + 6 + bob);
    ctx.lineTo(enemy.x + width / 2, enemy.y + height / 2 + 6 + bob);
    ctx.stroke();
  }

  const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = "#1d2624";
  ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2 - 10 + bob, width, 4);
  ctx.fillStyle = hpPct > 0.4 ? "#6ff3a4" : "#ff6f5f";
  ctx.fillRect(enemy.x - width / 2, enemy.y - height / 2 - 10 + bob, width * hpPct, 4);
  drawEnemyMarkers(ctx, enemy, width, enemy.y - height / 2 - 18 + bob, now);
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

function drawEffect(ctx, effect) {
  const pct = effect.life / effect.maxLife;
  ctx.strokeStyle = effect.color;
  ctx.globalAlpha = pct;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, effect.radius * (1.15 - pct * 0.35), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = pct * 0.18;
  ctx.fillStyle = effect.color;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, effect.radius * (0.42 + pct * 0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawProjectile(ctx, p) {
  if (p.beam) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.kind === "railgun" ? 5 : 4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.tx, p.ty);
    ctx.stroke();
    if (p.kind === "railgun") {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#e6f0ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.tx, p.ty);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return;
  }

  ctx.strokeStyle = p.color;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x - (p.vx || 0) * 0.04, p.y - (p.vy || 0) * 0.04);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (p.kind === "missile") {
    ctx.fillStyle = p.color;
    polygon(ctx, [
      { x: p.x, y: p.y - 6 },
      { x: p.x + 5, y: p.y + 3 },
      { x: p.x, y: p.y + 6 },
      { x: p.x - 5, y: p.y + 3 },
    ]);
    ctx.fill();
    return;
  }

  if (p.kind === "drone") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (p.kind === "emp") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8fffb";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.kind === "rifle" ? 3.5 : 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBattlefield(ctx, canvas, grid, state) {
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (state.screenShake > 0) {
    const shake = state.screenShake * 8;
    ctx.translate(Math.sin(state.screenShake * 57) * shake, Math.cos(state.screenShake * 43) * shake);
  }
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

  for (const effect of state.effects) drawEffect(ctx, effect);

  state.towers.forEach((tower) => drawTower(ctx, grid, tower, now));
  for (const p of state.projectiles) drawProjectile(ctx, p);
  state.enemies.forEach((enemy) => drawEnemy(ctx, enemy, now));

  if (state.basePulse > 0) {
    ctx.globalAlpha = Math.min(0.28, state.basePulse * 0.28);
    ctx.fillStyle = "#ff6f5f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
