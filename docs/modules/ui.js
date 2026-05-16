import { branchData, branchTier, towerSellValue, towerStats, towerUpgradeCost } from "./core.js";

export function towerUpgradeLabel(tower) {
  if (tower.def.branches && tower.level === 1) return "Choose Branch";
  if (tower.level === 2 && tower.branch) return "Upgrade Tier 3";
  return "Upgrade";
}

export function selectedTowerText(tower, message) {
  const branch = branchData(tower);
  return `${tower.def.name} tier ${tower.level}${branch ? ` (${branch.name})` : ""}. ${message}`;
}

export function renderUpgradeChoices(container, tower, onBranchChoice) {
  container.innerHTML = "";
  if (!tower || tower.level >= 3) return;

  if (tower.def.branches && tower.level === 1) {
    Object.entries(tower.def.branches).forEach(([key, branch]) => {
      const button = document.createElement("button");
      button.className = "upgrade-choice";
      button.innerHTML = `<strong>${branch.name}</strong><span>${branch.tiers[0].cost} cr - ${branch.role || "Branch role"} - ${branch.description}</span>`;
      button.addEventListener("click", () => onBranchChoice(key));
      container.appendChild(button);
    });
    return;
  }

  const branch = branchData(tower);
  if (branch) {
    const info = document.createElement("button");
    info.className = "upgrade-choice active";
    const tier = branchTier(tower);
    info.disabled = true;
    info.innerHTML = `<strong>${branch.name}</strong><span>${tier ? `${towerUpgradeCost(tower)} cr - branch locked in.` : "Branch locked in."}</span>`;
    container.appendChild(info);
  }
}

export function renderTowerDetails(container, tower) {
  if (!tower) {
    container.innerHTML = "";
    return;
  }

  const stats = towerStats(tower);
  const branch = branchData(tower);
  const nextCost = tower.level >= 3 ? "Max" : `${towerUpgradeCost(tower)} cr`;
  const branchRole = branch?.role || tower.def.role || "Flexible defense";
  const effects = [
    stats.splash ? `Splash ${stats.splash.toFixed(1)}` : null,
    stats.slow ? `Slow ${Math.round((1 - stats.slow) * 100)}%` : null,
    stats.armorPierce ? `Pierce ${stats.armorPierce}` : null,
    stats.armorShred ? `Shred ${stats.armorShred}` : null,
    stats.breaksShield ? "Shield break" : null,
    stats.bossMultiplier > 1 ? `Boss x${stats.bossMultiplier.toFixed(2)}` : null,
    stats.slowDamageMultiplier > 1 ? `Slow combo x${stats.slowDamageMultiplier.toFixed(2)}` : null,
    stats.shreddedDamageMultiplier > 1 ? `Shred combo x${stats.shreddedDamageMultiplier.toFixed(2)}` : null,
    stats.shieldlessDamageMultiplier > 1 ? `Shieldless x${stats.shieldlessDamageMultiplier.toFixed(2)}` : null,
  ].filter(Boolean).join(" / ") || "Standard fire";

  container.innerHTML = `
    <div class="tower-detail-header">
      <strong>${tower.def.name}</strong>
      <span>${branch ? branch.name : "Unbranched"}</span>
    </div>
    <p class="tower-role">${branchRole}</p>
    <div class="tower-stat-grid">
      <span><b>${stats.range.toFixed(1)}</b> Range</span>
      <span><b>${Math.round(stats.damage)}</b> Damage</span>
      <span><b>${stats.fireRate.toFixed(2)}s</b> Fire</span>
      <span><b>${nextCost}</b> Next</span>
      <span><b>${towerSellValue(tower)} cr</b> Sell</span>
      <span><b>${tower.level}/3</b> Tier</span>
    </div>
    <p>${effects}</p>
  `;
}

export function missionGrade(stats, wavesLength, baseIntegrity, victory, challenge = {}) {
  const clearRatio = wavesLength ? stats.wavesCleared / wavesLength : 0;
  const baseRatio = Math.max(0, baseIntegrity) / 100;
  const leakPenalty = Math.min(0.35, (stats.enemiesLeaked || 0) * 0.035);
  const sellPenalty = Math.min(0.1, (stats.towersSold || 0) * 0.012);
  const score = Math.max(0, Math.round(1000
    * clearRatio
    * (0.55 + baseRatio * 0.45)
    * (challenge.scoreMultiplier || 1)
    * (1 - leakPenalty - sellPenalty)));

  let grade = "D";
  if (victory && score >= 980) grade = "S";
  else if (victory && score >= 840) grade = "A";
  else if (victory && score >= 700) grade = "B";
  else if (clearRatio >= 0.55) grade = "C";

  return { grade, score };
}

export function missionDiagnosis(stats, victory) {
  if (victory) {
    if ((stats.enemiesLeaked || 0) === 0) return "Clean hold. Try a harder challenge or a leaner build.";
    if ((stats.baseDamageTaken || 0) > 24) return "Sector secured, but leaks got through. Add more slow zones or fast cleanup near the base.";
    return "Sector secured with light pressure. Branch timing and coverage held together.";
  }
  if ((stats.enemiesLeaked || 0) >= 4) return "Too many leaks reached the base. Add interceptors, slows, or a final cleanup pocket.";
  if ((stats.wavesCleared || 0) < 3) return "The opening economy collapsed early. Start with cheaper coverage before heavy upgrades.";
  if ((stats.damageDealt || 0) < 2500) return "Damage output lagged behind the wave curve. Add armor pierce or splash before the next heavy push.";
  return "The defense almost stabilized. Shift one branch toward support control or armor shred.";
}

export function renderMissionSummary(container, stats, wavesLength, baseIntegrity = 0, victory = false, challenge = {}) {
  const { grade, score } = missionGrade(stats, wavesLength, baseIntegrity, victory, challenge);
  container.innerHTML = [
    { label: "Grade", value: grade },
    { label: "Score", value: `${score}` },
    { label: "Waves cleared", value: `${stats.wavesCleared}/${wavesLength}` },
    { label: "Enemies destroyed", value: `${stats.enemiesDestroyed}` },
    { label: "Enemies leaked", value: `${stats.enemiesLeaked || 0}` },
    { label: "Base damage", value: `${stats.baseDamageTaken || 0}` },
    { label: "Damage dealt", value: `${Math.round(stats.damageDealt)}` },
    { label: "Towers built", value: `${stats.towersBuilt}` },
    { label: "Abilities used", value: `${stats.abilitiesUsed}` },
    { label: "Challenge", value: challenge.name || "Standard" },
  ].map((item) => `<div class="result-stat"><strong>${item.value}</strong><span>${item.label}</span></div>`).join("");
}
