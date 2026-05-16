let artManifest = null;
const spriteCache = new Map();
const ART_THEME_SET = new Set(["sprites", "classic"]);
let artTheme = "sprites";

function cacheKey(group, type, variant = "base") {
  return `${group}:${type}:${variant}`;
}

function collectManifestEntries(art = {}) {
  const entries = [];

  Object.entries(art.towers || {}).forEach(([type, config]) => {
    if (config.base?.src) entries.push([cacheKey("tower", type, "base"), config.base]);
    Object.entries(config.branches || {}).forEach(([branch, branchConfig]) => {
      if (branchConfig?.src) entries.push([cacheKey("tower", type, branch), branchConfig]);
    });
  });

  Object.entries(art.enemies || {}).forEach(([type, config]) => {
    if (config?.src) entries.push([cacheKey("enemy", type, "base"), config]);
  });

  Object.entries(art.projectiles || {}).forEach(([type, config]) => {
    if (config?.src) entries.push([cacheKey("projectile", type, "base"), config]);
  });

  return entries;
}

function ensureSpriteLoaded(key, descriptor) {
  const existing = spriteCache.get(key);
  if (existing) return existing.promise;
  if (typeof Image === "undefined" || !descriptor?.src) return Promise.resolve(false);

  const image = new Image();
  const record = {
    descriptor,
    image,
    ready: false,
    failed: false,
    promise: null,
  };

  record.promise = new Promise((resolve) => {
    image.onload = () => {
      record.ready = true;
      resolve(true);
    };
    image.onerror = () => {
      record.failed = true;
      resolve(false);
    };
  });

  image.src = descriptor.src;
  spriteCache.set(key, record);
  return record.promise;
}

export function loadGameAssets(art = {}) {
  artManifest = art;
  return Promise.all(collectManifestEntries(art).map(([key, descriptor]) => ensureSpriteLoaded(key, descriptor)));
}

export function normalizeArtTheme(theme) {
  if (theme === "auto") return "sprites";
  return ART_THEME_SET.has(theme) ? theme : "sprites";
}

export function setArtTheme(theme) {
  artTheme = normalizeArtTheme(theme);
}

export function getArtTheme() {
  return artTheme;
}

function getRecord(key) {
  return spriteCache.get(key) || null;
}

function towerDescriptor(type, branch = null) {
  const tower = artManifest?.towers?.[type];
  if (!tower) return null;
  return branch && tower.branches?.[branch] ? tower.branches[branch] : tower.base || null;
}

function towerRecord(type, branch = null) {
  if (branch && getRecord(cacheKey("tower", type, branch))) return getRecord(cacheKey("tower", type, branch));
  return getRecord(cacheKey("tower", type, "base"));
}

function enemyDescriptor(type) {
  return artManifest?.enemies?.[type] || null;
}

function enemyRecord(type) {
  return getRecord(cacheKey("enemy", type, "base"));
}

function projectileDescriptor(type) {
  return artManifest?.projectiles?.[type] || null;
}

function projectileRecord(type) {
  return getRecord(cacheKey("projectile", type, "base"));
}

export function hasTowerSprite(tower) {
  return artTheme !== "classic" && Boolean(towerRecord(tower.type, tower.branch)?.ready);
}

export function hasEnemySprite(enemy) {
  return artTheme !== "classic" && Boolean(enemyRecord(enemy.type)?.ready);
}

export function hasProjectileSprite(kind) {
  return artTheme !== "classic" && Boolean(projectileRecord(kind)?.ready);
}

function drawRecord(ctx, record, x, y, descriptor, scale = 1) {
  if (!record?.ready || !record.image) return false;
  const width = Math.round((descriptor.width || record.image.naturalWidth || 32) * scale);
  const height = Math.round((descriptor.height || record.image.naturalHeight || 32) * scale);
  const anchorX = descriptor.anchorX ?? 0.5;
  const anchorY = descriptor.anchorY ?? 0.5;
  ctx.drawImage(record.image, x - width * anchorX, y - height * anchorY, width, height);
  return true;
}

export function drawTowerSprite(ctx, tower, x, y, scale = 1) {
  const descriptor = towerDescriptor(tower.type, tower.branch);
  const record = towerRecord(tower.type, tower.branch);
  return descriptor ? drawRecord(ctx, record, x, y, descriptor, scale) : false;
}

export function drawEnemySprite(ctx, enemy, x, y, scale = 1) {
  const descriptor = enemyDescriptor(enemy.type);
  const record = enemyRecord(enemy.type);
  return descriptor ? drawRecord(ctx, record, x, y, descriptor, scale) : false;
}

export function drawProjectileSprite(ctx, kind, x, y, scale = 1) {
  const descriptor = projectileDescriptor(kind);
  const record = projectileRecord(kind);
  return descriptor ? drawRecord(ctx, record, x, y, descriptor, scale) : false;
}
