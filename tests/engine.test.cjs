const test = require('node:test');
const assert = require('node:assert/strict');
const Pala = require('../js/engine.js');

function advance(engine, seconds, input) {
  for (let remaining = seconds; remaining > 0.00001; remaining -= 0.2) engine.update(Math.min(0.2, remaining), input);
}

function playLevel(level, upgrades, equipment) {
  const game = new Pala.Engine({ level, upgrades, equipment });
  let ticks = 0;
  while (game.state.phase === 'playing' && ticks++ < 1500) {
    const state = game.state;
    const allies = state.units.filter((unit) => unit.side === 'ally');
    const enemies = state.units.filter((unit) => unit.side === 'enemy');
    const tanks = allies.filter((unit) => ['mouse', 'bear', 'hedgehog', 'boar'].includes(unit.kind));
    const ranged = allies.filter((unit) => ['rabbit', 'fox', 'squirrel'].includes(unit.kind));
    if (!tanks.length) game.summon('mouse');
    else if (!ranged.length) game.summon('rabbit');
    else if (level >= 3 && !tanks.some((unit) => unit.kind === 'bear')) game.summon('bear');
    else if (level >= 6 && !ranged.some((unit) => unit.kind === 'fox')) game.summon('fox');
    else if (level >= 14 && !allies.some((unit) => unit.kind === 'owl')) game.summon('owl');
    else if (level >= 18 && !tanks.some((unit) => unit.kind === 'boar')) game.summon('boar');
    else if (level >= 11 && !tanks.some((unit) => unit.kind === 'hedgehog')) game.summon('hedgehog');
    else if (level >= 8 && !ranged.some((unit) => unit.kind === 'squirrel')) game.summon('squirrel');
    else if (level >= 14 && allies.filter((unit) => unit.kind === 'owl').length < 2 && state.time > 10) game.summon('owl');
    else if (tanks.length < 3) game.summon('mouse');
    else if (ranged.length < 5) game.summon('rabbit');
    else if (level >= 6 && ranged.filter((unit) => unit.kind === 'fox').length < 3) game.summon('fox');
    else if (level >= 3 && tanks.filter((unit) => unit.kind === 'bear').length < 3) game.summon('bear');
    else if (ranged.length < 12) game.summon('rabbit');
    const frontline = tanks.length ? Math.max(...tanks.map((unit) => unit.x)) : allies.length ? Math.max(...allies.map((unit) => unit.x)) : 450;
    const enemyFront = enemies.length ? Math.min(...enemies.map((unit) => unit.x)) : 2400;
    let destination = Math.min(frontline - 85, enemyFront - 125, 2160);
    if (state.time < 4) destination = 380;
    const move = Math.abs(destination - state.hero.x) < 12 ? 0 : Math.sign(destination - state.hero.x);
    if (state.hero.hp < state.hero.maxHp * 0.7 || allies.filter((unit) => unit.hp < unit.maxHp * 0.6 && Math.abs(unit.x - state.hero.x) < 450).length >= 2) game.cast('heal');
    if (enemies.filter((unit) => Math.abs(unit.x - state.hero.x) < 650).length >= 4 && state.mana > 60) game.cast('frost');
    if (state.mana >= 46) game.cast('bolt');
    game.update(0.2, { move });
  }
  return game;
}

test('campaign has twenty-four unique levels, eight companions and varied enemies', () => {
  assert.equal(Pala.DATA.levels.length, 24);
  assert.equal(Pala.DATA.chapters.length, 6);
  assert.equal(Pala.DATA.units.length, 8);
  assert.equal(Object.keys(Pala.DATA.enemies).length, 12);
  assert.deepEqual(Pala.DATA.levels.filter((level) => level.boss).map((level) => level.id), [3, 6, 9, 12, 16, 20, 24]);
  assert.equal(Pala.DATA.units.find((unit) => unit.id === 'bear').unlockLevel, 3);
  assert.equal(Pala.DATA.units.find((unit) => unit.id === 'fox').unlockLevel, 6);
  assert.equal(Pala.DATA.upgrades.length, 4);
  assert.ok(Pala.upgradeCost('vitality', 2) > Pala.upgradeCost('vitality', 1));
});

test('survival advances cleared waves, pauses for a blessing and scales to a boss wave', () => {
  const events = [];
  const game = new Pala.Engine({ mode: 'survival', unlockedLevel: 1, onEvent: event => events.push(event) });
  assert.equal(game.state.tower, null);
  game.state.food = 100;
  assert.equal(game.summon('bear'), true);
  for (let wave = 1; wave <= 3; wave++) {
    game.startWave();
    game.spawnQueue = [];
    game.state.units = game.state.units.filter(unit => unit.side === 'ally');
    game.update(0.05);
  }
  assert.equal(game.state.wave, 3);
  assert.equal(game.state.paused, true);
  assert.equal(game.state.survivalChoices.length, 3);
  assert.equal(new Set(game.state.survivalChoices).size, 3);
  assert.equal(events.filter(event => event.type === 'survivalChoice').length, 1);
  assert.equal(game.chooseSurvivalBlessing('invalid'), false);
  const choice = game.state.survivalChoices[0];
  assert.equal(game.chooseSurvivalBlessing(choice), true);
  assert.equal(game.state.paused, false);
  assert.equal(game.state.survivalChoices.length, 0);
  assert.equal(game.chooseSurvivalBlessing(choice), false);
  game.startWave();
  game.startWave();
  assert.equal(game.state.wave, 5);
  assert.ok(game.spawnQueue.some(spawn => spawn.kind === 'boss'));
  const firstWaveEnemy = new Pala.Engine({ mode: 'survival' });
  firstWaveEnemy.startWave();
  const early = firstWaveEnemy.spawnEnemy('skeleton');
  const late = game.spawnEnemy('skeleton');
  assert.ok(late.maxHp > early.maxHp);
  game.damage(game.state.hero, game.state.hero.maxHp * 2, late);
  assert.equal(game.state.phase, 'lost');
  assert.equal(game.state.result.wave, 5);
});

test('new companions provide healing, thorns, splash and charge', () => {
  const game = new Pala.Engine({ level: 18 });
  game.state.food = 500;
  for (const id of ['squirrel', 'hedgehog', 'owl', 'boar']) assert.equal(game.summon(id), true);
  const owl = game.state.units.find(unit => unit.kind === 'owl');
  const bear = game.state.units.find(unit => unit.kind === 'hedgehog');
  const boar = game.state.units.find(unit => unit.kind === 'boar');
  game.state.hero.hp -= 70;
  owl.attackTimer = 0;
  game.update(0.05);
  assert.ok(game.state.hero.hp > game.state.hero.maxHp - 70);
  const attacker = game.spawnEnemy('skeleton', bear.x + 25);
  game.attack(attacker, bear);
  assert.ok(attacker.hp < attacker.maxHp);
  const target = game.spawnEnemy('sentinel', boar.x + 35);
  const before = target.x;
  game.attack(boar, target);
  assert.ok(target.x > before);
  assert.ok(target.hp < target.maxHp);
});

test('survival rotates tactical formations and brings later waves closer within the arena', () => {
  const events = [];
  const game = new Pala.Engine({ mode: 'survival', onEvent: event => events.push(event) });
  const allowed = [null, ['skeleton', 'bat', 'wraith', 'hound', 'bomber'], ['skeleton', 'slime', 'brute', 'sentinel'], ['skeleton', 'necromancer', 'archer', 'shaman']];
  const names = ['常规', '疾袭', '重甲', '秘术'];
  for (let index = 0; index < 4; index++) {
    game.spawnQueue = [];
    game.startWave();
    assert.equal(game.state.formationName, names[index]);
    assert.ok(game.state.formationDescription.length > 0);
    assert.equal(events.at(-1).formationName, names[index]);
    if (allowed[index]) assert.ok(game.spawnQueue.every(spawn => allowed[index].includes(spawn.kind)));
    assert.ok(game.spawnQueue.every(spawn => index ? spawn.x === game.state.hero.x + 600 : spawn.x === undefined));
  }
  game.state.hero.x = game.state.worldWidth - 200;
  game.spawnQueue = [];
  game.startWave();
  assert.ok(game.spawnQueue.some(spawn => spawn.kind === 'boss'));
  assert.ok(game.spawnQueue.every(spawn => spawn.x <= game.state.worldWidth - 80));
  const campaign = new Pala.Engine({ level: 19 });
  campaign.startWave();
  assert.ok(campaign.spawnQueue.every(spawn => spawn.x === undefined));
  assert.deepEqual(Pala.enemyRoster(1), ['skeleton', 'skeleton', 'slime']);
  assert.ok(Pala.enemyRoster(24).includes('shaman'));
});

test('charge knockback stays inside the smaller survival arena', () => {
  const game = new Pala.Engine({ mode: 'survival' });
  game.state.food = 100;
  game.summon('boar');
  const boar = game.state.units.find(unit => unit.kind === 'boar');
  boar.x = 1360;
  const sentinel = game.spawnEnemy('sentinel', 1400);
  game.attack(boar, sentinel);
  assert.ok(sentinel.hp > 0);
  assert.equal(sentinel.x, game.state.worldWidth - 80);
});

test('combat numbers show actual health changes, merge rapid hits and stay bounded', () => {
  const events = [];
  const game = new Pala.Engine({ onEvent: event => events.push(event) });
  const tower = game.state.tower;
  game.damage(tower, tower.maxHp * 3, game.state.hero);
  const towerNumber = game.state.effects.find(effect => effect.kind === 'number' && effect.entityId === tower.id);
  assert.equal(towerNumber.amount, tower.maxHp / 2);
  assert.equal(towerNumber.side, 'enemy');
  assert.equal(towerNumber.healing, false);
  assert.equal(events.find(event => event.type === 'hit' && event.targetId === tower.id).damage, tower.maxHp / 2);
  game.state.hero.hp -= 37;
  game.cast('heal');
  const healingNumber = game.state.effects.find(effect => effect.kind === 'number' && effect.entityId === 'hero');
  assert.equal(healingNumber.amount, 37);
  assert.equal(healingNumber.healing, true);
  assert.equal(healingNumber.side, 'ally');
  const skeleton = game.spawnEnemy('skeleton', 900);
  game.damage(skeleton, 1, game.state.hero);
  game.damage(skeleton, 1, game.state.hero);
  assert.equal(game.state.effects.filter(effect => effect.kind === 'number' && effect.entityId === skeleton.id).length, 1);
  assert.equal(game.state.effects.find(effect => effect.kind === 'number' && effect.entityId === skeleton.id).amount, 2);
  for (let index = 0; index < 40; index++) game.damage(game.spawnEnemy('skeleton', 1000), 1, game.state.hero);
  assert.equal(game.state.effects.filter(effect => effect.kind === 'number').length, 32);
});

test('equipped staff and ring specialize spells and battle resources', () => {
  const plain = new Pala.Engine();
  const storm = new Pala.Engine({ equipment: { staff: 'storm_staff', ring: 'harvest_ring' } });
  assert.ok(storm.state.hero.damage > plain.state.hero.damage);
  assert.equal(storm.state.maxFood - plain.state.maxFood, 25);
  assert.ok(Math.abs(storm.state.foodRegen - plain.state.foodRegen - 0.65) < 0.00001);
  const plainSlime = plain.spawnEnemy('slime', 600);
  const stormSlime = storm.spawnEnemy('slime', 600);
  plain.cast('bolt');
  storm.cast('bolt');
  assert.ok(stormSlime.hp < plainSlime.hp);

  const frost = new Pala.Engine({ equipment: { staff: 'frost_staff', ring: 'spring_ring' } });
  assert.equal(frost.state.maxMana - plain.state.maxMana, 25);
  const frostTarget = frost.spawnEnemy('slime', 600);
  frost.cast('frost');
  assert.ok(frostTarget.slowTime > Pala.DATA.spells.find(spell => spell.id === 'frost').duration);
  const renewal = new Pala.Engine({ equipment: { staff: 'renewal_staff', ring: 'guardian_ring' } });
  assert.equal(renewal.state.hero.maxHp - plain.state.hero.maxHp, 90);
  assert.equal(renewal.state.hero.auraRadius - plain.state.hero.auraRadius, 55);
  plain.state.hero.hp -= 200;
  renewal.state.hero.hp -= 200;
  plain.cast('heal');
  renewal.cast('heal');
  assert.ok(renewal.state.hero.maxHp - renewal.state.hero.hp < plain.state.hero.maxHp - plain.state.hero.hp);
});

test('tower calls one reinforcement wave at half health, after any boss shield is removed', () => {
  const events = [];
  const game = new Pala.Engine({ onEvent: event => events.push(event) });
  const tower = game.state.tower;
  game.damage(tower, tower.maxHp, game.state.hero);
  assert.equal(tower.hp, tower.maxHp / 2);
  assert.equal(tower.reinforced, true);
  assert.equal(game.state.units.filter(unit => unit.side === 'enemy').length, 3);
  assert.equal(events.filter(event => event.type === 'reinforcement').length, 1);
  game.damage(tower, 10, game.state.hero);
  assert.equal(events.filter(event => event.type === 'reinforcement').length, 1);
  game.damage(tower, tower.maxHp, game.state.hero);
  assert.equal(game.state.phase, 'won');

  const bossLevel = new Pala.Engine({ level: 3 });
  bossLevel.damage(bossLevel.state.tower, 1000, bossLevel.state.hero);
  assert.equal(bossLevel.state.tower.reinforced, false);
  assert.equal(bossLevel.state.tower.hp, bossLevel.state.tower.maxHp);
  const boss = bossLevel.state.units.find(unit => unit.kind === 'boss');
  bossLevel.damage(boss, 100000, bossLevel.state.hero);
  bossLevel.damage(bossLevel.state.tower, 1000, bossLevel.state.hero);
  assert.equal(bossLevel.state.tower.reinforced, true);
});

test('late enemies appear in regional rosters and bomber death damages nearby allies', () => {
  const early = new Pala.Engine({ level: 12 });
  early.startWave();
  assert.equal(early.spawnQueue.some(item => ['archer', 'wraith', 'hound', 'sentinel', 'shaman', 'bomber'].includes(item.kind)), false);
  const late = new Pala.Engine({ level: 24 });
  const seen = new Set();
  for (let i = 0; i < 30; i++) { late.startWave(); late.spawnQueue.forEach(item => seen.add(item.kind)); late.spawnQueue = []; }
  for (const id of ['archer', 'wraith', 'hound', 'sentinel', 'shaman', 'bomber']) assert.ok(seen.has(id), id);
  const game = new Pala.Engine({ level: 19 });
  const bomber = game.spawnEnemy('bomber', game.state.hero.x + 28);
  const hp = game.state.hero.hp;
  game.damage(bomber, 1000, game.state.hero);
  assert.ok(game.state.hero.hp < hp);
});

test('summons spend food, enforce cooldown, unlocks and available resources', () => {
  const game = new Pala.Engine({ level: 1 });
  assert.equal(game.summon('bear'), false);
  assert.equal(game.summon('unknown'), false);
  assert.equal(game.summon('mouse'), true);
  assert.equal(game.state.food, 30);
  assert.equal(game.summon('mouse'), false);
  assert.equal(game.summon('rabbit'), true);
  assert.equal(game.state.food, 6);
  advance(game, 2.5);
  assert.ok(game.state.food > 12);
  assert.equal(game.summon('mouse'), true);
  assert.equal(game.state.units.filter((unit) => unit.side === 'ally').length, 3);
});

test('pause freezes resources, positions, timers and rejects actions', () => {
  const game = new Pala.Engine();
  game.summon('mouse');
  game.setPaused(true);
  const before = JSON.stringify(game.state);
  advance(game, 10, { move: 1 });
  assert.equal(game.summon('rabbit'), false);
  assert.equal(game.cast('bolt'), false);
  assert.equal(JSON.stringify(game.state), before);
  game.setPaused(false);
  advance(game, 0.2, { move: 1 });
  assert.ok(game.state.hero.x > 300);
});

test('long frames are capped, non-finite time is ignored and resources stay bounded', () => {
  const game = new Pala.Engine();
  game.update(Infinity);
  game.update(NaN);
  game.update(-10);
  assert.equal(game.state.time, 0);
  game.update(100);
  assert.ok(Math.abs(game.state.time - 0.25) < 0.00001);
  game.state.food = game.state.maxFood;
  game.state.mana = game.state.maxMana;
  advance(game, 1);
  assert.equal(game.state.food, game.state.maxFood);
  assert.equal(game.state.mana, game.state.maxMana);
});

test('heal requires an injured target, restores allies and charges exactly once', () => {
  const game = new Pala.Engine({ level: 3 });
  assert.equal(game.cast('heal'), false);
  assert.equal(game.state.mana, 64);
  game.summon('mouse');
  game.state.hero.hp -= 180;
  game.state.units[0].hp = 10;
  assert.equal(game.cast('heal'), true);
  assert.equal(game.state.hero.hp, 260);
  assert.equal(game.state.units[0].hp, game.state.units[0].maxHp);
  assert.equal(game.state.mana, 34);
  assert.equal(game.cast('heal'), false);
});

test('lightning hits flying targets and frost slows a group', () => {
  const game = new Pala.Engine({ level: 2 });
  game.state.mana = 100;
  const bat = game.spawnEnemy('bat', 700);
  const slime = game.spawnEnemy('slime', 750);
  assert.equal(game.cast('frost'), true);
  assert.ok(bat.slowTime > 6);
  assert.ok(slime.slowTime > 6);
  const oldX = slime.x;
  advance(game, 0.2);
  assert.ok(oldX - slime.x < 3);
  assert.equal(game.cast('bolt'), true);
  assert.equal(bat.hp, 0);
  assert.ok(game.state.kills >= 1);
});

test('frost can target an enemy when the untargetable tower is closer', () => {
  const game = new Pala.Engine({ level: 1 });
  game.state.mana = 100;
  game.state.hero.x = 2000;
  const skeleton = game.spawnEnemy('skeleton', 1650);
  const towerHp = game.state.tower.hp;
  assert.equal(Math.abs(game.state.tower.x - game.state.hero.x) < Math.abs(skeleton.x - game.state.hero.x), true);
  assert.equal(game.cast('frost'), true);
  assert.ok(skeleton.slowTime > 6);
  assert.ok(skeleton.hp < skeleton.maxHp);
  assert.equal(game.state.tower.hp, towerHp);
});

test('ranged attacks apply damage on impact and expire when their target dies', () => {
  const game = new Pala.Engine({ level: 2 });
  game.summon('rabbit');
  const rabbit = game.state.units[0];
  rabbit.x = 600;
  rabbit.attackTimer = 0;
  const target = game.spawnEnemy('slime', 850);
  const hp = target.hp;
  game.update(0.03);
  assert.equal(target.hp, hp);
  assert.equal(game.state.projectiles.length, 1);
  advance(game, 0.6);
  assert.ok(target.hp < hp);
  rabbit.attackTimer = 0;
  game.update(0.03);
  target.hp = 0;
  game.update(0.03);
  assert.equal(game.state.projectiles.filter((shot) => shot.targetId === target.id).length, 0);
});

test('hero death ends a battle and result events only fire once', () => {
  const events = [];
  const game = new Pala.Engine({ onEvent: (event) => events.push(event) });
  game.state.hero.hp = 1;
  const enemy = game.spawnEnemy('brute', game.state.hero.x + 35);
  enemy.attackTimer = 0;
  game.update(0.1);
  assert.equal(game.state.phase, 'lost');
  assert.equal(game.state.result.reward, 0);
  const time = game.state.time;
  advance(game, 20);
  assert.equal(game.state.time, time);
  assert.equal(events.filter((event) => event.type === 'lose').length, 1);
  assert.equal(game.summon('mouse'), false);
});

test('destroying the enemy tower wins and records reward', () => {
  const events = [];
  const game = new Pala.Engine({ onEvent: (event) => events.push(event) });
  game.state.hero.x = 2200;
  game.towerReinforced = true;
  game.state.tower.hp = 1;
  game.update(0.1);
  assert.equal(game.state.phase, 'won');
  assert.equal(game.state.result.reward, Pala.DATA.levels[0].reward);
  assert.equal(events.filter((event) => event.type === 'win').length, 1);
});

test('replaying an early level keeps campaign-unlocked companions available', () => {
  const game = new Pala.Engine({ level: 1, unlockedLevel: 6 });
  game.state.food = 100;
  assert.equal(game.summon('fox'), true);
  const locked = new Pala.Engine({ level: 1 });
  locked.state.food = 100;
  assert.equal(locked.summon('fox'), false);
});

test('a boss tower cannot be rushed before defeating its guardian', () => {
  const game = new Pala.Engine({ level: 3 });
  game.state.hero.x = 2200;
  const hp = game.state.tower.hp;
  game.update(0.1);
  assert.equal(game.state.tower.hp, hp);
  assert.equal(game.state.tower.shielded, true);
  const boss = game.state.units.find((unit) => unit.kind === 'boss');
  assert.ok(boss);
  boss.hp = 1;
  assert.equal(game.cast('bolt'), true);
  assert.equal(boss.hp, 0);
  assert.equal(game.state.tower.shielded, false);
  game.towerReinforced = true;
  game.state.tower.hp = 1;
  advance(game, 1);
  assert.equal(game.state.phase, 'won');
  assert.equal(game.state.kills, 1);
});

test('melee companions skip airborne enemies while archers can engage them', () => {
  const game = new Pala.Engine({ level: 2 });
  game.summon('mouse');
  game.summon('rabbit');
  const mouse = game.state.units.find((unit) => unit.kind === 'mouse');
  const rabbit = game.state.units.find((unit) => unit.kind === 'rabbit');
  const bat = game.spawnEnemy('bat', 500);
  mouse.x = 480;
  rabbit.x = 350;
  assert.notEqual(game.findTarget(mouse, 100, false), bat);
  assert.equal(game.findTarget(rabbit, 275, false), bat);
  const skeleton = game.spawnEnemy('skeleton', 525);
  assert.equal(game.findTarget(mouse, 100, false), skeleton);
});

test('upgrades affect health, damage and both regeneration rates', () => {
  const normal = new Pala.Engine();
  const improved = new Pala.Engine({ upgrades: { vitality: 2, leadership: 2, provision: 2, focus: 2 } });
  assert.equal(improved.state.hero.maxHp - normal.state.hero.maxHp, 130);
  assert.ok(improved.state.hero.damage > normal.state.hero.damage);
  assert.ok(improved.state.foodRegen > normal.state.foodRegen);
  assert.ok(improved.state.manaRegen > normal.state.manaRegen);
  const bounded = new Pala.Engine({ upgrades: { vitality: 200, provision: -2 } });
  assert.equal(bounded.upgrades.vitality, 7);
  assert.equal(bounded.upgrades.provision, 0);
});

test('a fixed seed produces the same battle', () => {
  const first = new Pala.Engine({ level: 5, seed: 42 });
  const second = new Pala.Engine({ level: 5, seed: 42 });
  first.summon('mouse');
  second.summon('mouse');
  advance(first, 20, { move: 1 });
  advance(second, 20, { move: 1 });
  assert.deepEqual(first.state, second.state);
});

test('campaign is completable using only first-clear income and affordable upgrades and equipment', () => {
  let coins = 120;
  const upgrades = { vitality: 0, leadership: 0, provision: 0, focus: 0 };
  const equipment = { staff: 'glimmer_staff', ring: 'traveler_ring' };
  for (let level = 1; level <= 24; level++) {
    for (const id of ['harvest_ring', 'storm_staff']) {
      const item = Pala.DATA.equipment.find(item => item.id === id);
      if (level >= item.unlockLevel && equipment[item.slot] !== id && coins >= item.cost) {
        coins -= item.cost;
        equipment[item.slot] = id;
      }
    }
    while (true) {
      const next = Pala.DATA.upgrades.filter(item => upgrades[item.id] < item.maxLevel)
        .map(item => ({ id: item.id, cost: Pala.upgradeCost(item.id, upgrades[item.id]) })).sort((a, b) => a.cost - b.cost)[0];
      if (!next || next.cost > coins) break;
      coins -= next.cost;
      upgrades[next.id]++;
    }
    assert.ok(coins >= 0);
    const game = playLevel(level, upgrades, equipment);
    assert.equal(game.state.phase, 'won', `level=${level}, upgrades=${JSON.stringify(upgrades)}, time=${game.state.time.toFixed(1)}`);
    assert.ok(game.state.time < 300);
    coins += game.state.result.reward;
  }
  assert.equal(equipment.staff, 'storm_staff');
  assert.equal(equipment.ring, 'harvest_ring');
});

for (let level = 1; level <= 24; level++) {
  test(`campaign level ${level} is winnable with a frontline strategy`, () => {
    const tier = Math.min(7, Math.floor((level - 1) / 3));
    const game = playLevel(level, { vitality: tier, leadership: tier, provision: tier, focus: tier });
    const state = game.state;
    assert.equal(state.phase, 'won', `level=${level}, time=${state.time.toFixed(1)}, tower=${state.tower.hp.toFixed(0)}, hero=${state.hero.hp.toFixed(0)}, kills=${state.kills}`);
    assert.ok(state.time < 300, `Battle too long: ${state.time}`);
    console.log(`level ${level}: ${state.time.toFixed(1)}s, ${state.kills} kills, hero ${Math.round(state.hero.hp / state.hero.maxHp * 100)}%`);
  });
}
