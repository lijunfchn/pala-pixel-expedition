const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/engine.js');
const storage = require('../js/storage.js');

test('new campaigns begin with spendable coins and only stage one unlocked', () => {
  const data = storage.load({ getItem: () => null }).data;
  assert.equal(data.coins, 120);
  assert.equal(data.unlocked, 1);
  assert.deepEqual(data.completed, []);
  assert.deepEqual(data.equipped, { staff: 'glimmer_staff', ring: 'traveler_ring' });
  assert.deepEqual(data.bestSurvival, { wave: 0, kills: 0 });
});
test('save data survives a storage round trip', () => {
  let text;
  const adapter = { setItem: (_, value) => { text = value; }, getItem: () => text };
  const data = storage.fresh();
  Object.assign(data, { coins: 351, completed: [1, 2], unlocked: 3, stars: { 1: 3, 2: 2 }, muted: true });
  data.upgrades.focus = 2;
  data.ownedEquipment.push('storm_staff');
  data.equipped.staff = 'storm_staff';
  data.bestSurvival = { wave: 8, kills: 61 };
  assert.equal(storage.save(adapter, data), true);
  assert.deepEqual(storage.load(adapter).data, data);
});
test('old progress migrates to the expanded campaign without skipping a level', () => {
  const data = storage.normalize({ version: 1, coins: 300, completed: Array.from({ length: 12 }, (_, i) => i + 1), upgrades: { focus: 3 } });
  assert.equal(data.unlocked, 13);
  assert.equal(data.coins, 300);
  assert.equal(data.upgrades.focus, 3);
  assert.deepEqual(data.equipped, { staff: 'glimmer_staff', ring: 'traveler_ring' });
  assert.deepEqual(data.bestSurvival, { wave: 0, kills: 0 });
});
test('invalid progress and upgrades are bounded without trusting arbitrary objects', () => {
  const data = storage.normalize({ version: 1, coins: -42, completed: [1, 1, 12, '2', 999], unlocked: 999, upgrades: { vitality: 800, leadership: -10 }, stars: { 1: 9 }, ownedEquipment: ['storm_staff', 'fake'], equipped: { staff: 'traveler_ring', ring: 'fake' } });
  assert.equal(data.coins, 0);
  assert.equal(data.unlocked, 2);
  assert.equal(data.upgrades.vitality, 7);
  assert.equal(data.upgrades.leadership, 0);
  assert.equal(data.stars[1], 3);
  assert.equal(data.ownedEquipment.includes('fake'), false);
  assert.deepEqual(data.equipped, { staff: 'glimmer_staff', ring: 'traveler_ring' });
});
test('corrupt or inaccessible storage still allows an in-memory campaign', () => {
  assert.equal(storage.load({ getItem: () => '{broken' }).data.unlocked, 1);
  assert.equal(storage.load({ getItem: () => { throw Error('blocked'); } }).available, false);
  assert.equal(storage.save({ setItem: () => { throw Error('quota'); } }, storage.fresh()), false);
});
