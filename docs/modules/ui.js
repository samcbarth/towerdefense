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
      button.innerHTML = `<strong>${branch.name}</strong><span>${branch.tiers[0].cost} cr - ${branch.description}</span>`;
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
  const effects = [
    stats.splash ? `Splash ${stats.splash.toFixed(1)}` : null,
    stats.slow ? `Slow ${Math.round((1 - stats.slow) * 100)}%` : null,
    stats.armorPierce ? `Pierce ${stats.armorPierce}` : null,
    stats.armorShred ? `Shred ${stats.armorShred}` : null,
    stats.breaksShield ? "Shield break" : null,
    stats.bossMultiplier > 1 ? `Boss x${stats.bossMultiplier.toFixed(2)}` : null,
  ].filter(Boolean).join(" / ") || "Standard fire";

  container.innerHTML = `
    <div class="tower-detail-header">
      <strong>${tower.def.name}</strong>
      <span>${branch ? branch.name : "Unbranched"}</span>
    </div>
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

export function renderMissionSummary(container, stats, wavesLength) {
  container.innerHTML = [
    { label: "Waves cleared", value: `${stats.wavesCleared}/${wavesLength}` },
    { label: "Enemies destroyed", value: `${stats.enemiesDestroyed}` },
    { label: "Damage dealt", value: `${Math.round(stats.damageDealt)}` },
    { label: "Towers built", value: `${stats.towersBuilt}` },
    { label: "Towers sold", value: `${stats.towersSold}` },
    { label: "Abilities used", value: `${stats.abilitiesUsed}` },
    { label: "Manual saves", value: `${stats.saves}` },
  ].map((item) => `<div class="result-stat"><strong>${item.value}</strong><span>${item.label}</span></div>`).join("");
}
