(function (root) {
  'use strict';
  const KEY = 'paladog-pixel-save-v1';
  const upgradeIds = ['vitality', 'leadership', 'provision', 'focus'];
  const levelCount = root.Pala?.DATA?.levels?.length || 24;
  const integer = (value, min, max, fallback) => Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
  const defaultEquipment = { staff: 'glimmer_staff', ring: 'traveler_ring' };
  function fresh() {
    return { version: 1, coins: 120, unlocked: 1, completed: [], stars: {}, bestTimes: {}, bestSurvival: { wave: 0, kills: 0 }, upgrades: { vitality: 0, leadership: 0, provision: 0, focus: 0 }, ownedEquipment: Object.values(defaultEquipment), equipped: { ...defaultEquipment }, muted: false };
  }
  function normalize(raw) {
    const data = fresh();
    if (!raw || raw.version !== 1) return data;
    data.coins = integer(raw.coins, 0, 9999999, 120);
    data.completed = [...new Set(Array.isArray(raw.completed) ? raw.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= levelCount) : [])].sort((a, b) => a - b);
    // Progress is contiguous: malformed imported/browser data cannot skip the campaign.
    let unlocked = 1;
    while (data.completed.includes(unlocked) && unlocked < levelCount) unlocked++;
    data.unlocked = unlocked;
    for (let level = 1; level <= levelCount; level++) {
      if (data.completed.includes(level)) data.stars[level] = integer(raw.stars?.[level], 1, 3, 1);
      if (Number.isFinite(raw.bestTimes?.[level]) && raw.bestTimes[level] > 0) data.bestTimes[level] = raw.bestTimes[level];
    }
    data.bestSurvival.wave = integer(raw.bestSurvival?.wave, 0, 9999, 0);
    data.bestSurvival.kills = integer(raw.bestSurvival?.kills, 0, 999999, 0);
    upgradeIds.forEach(id => { data.upgrades[id] = integer(raw.upgrades?.[id], 0, 7, 0); });
    const catalog = root.Pala?.DATA?.equipment || Object.entries(defaultEquipment).map(([slot, id]) => ({ slot, id }));
    const validIds = new Set(catalog.map(item => item.id));
    data.ownedEquipment = [...new Set(data.ownedEquipment.concat(Array.isArray(raw.ownedEquipment) ? raw.ownedEquipment.filter(id => validIds.has(id)) : []))];
    for (const slot of ['staff', 'ring']) {
      const id = raw.equipped?.[slot];
      if (data.ownedEquipment.includes(id) && catalog.some(item => item.id === id && item.slot === slot)) data.equipped[slot] = id;
    }
    data.muted = raw.muted === true;
    return data;
  }
  function load(storage) {
    try { return { data: normalize(JSON.parse(storage.getItem(KEY))), available: true }; }
    catch (_) { return { data: fresh(), available: false }; }
  }
  function save(storage, data) {
    try { storage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (_) { return false; }
  }
  root.Pala = root.Pala || {};
  root.Pala.Storage = { KEY, fresh, normalize, load, save };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Pala.Storage;
})(typeof globalThis !== 'undefined' ? globalThis : window);
