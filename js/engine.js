/* Deterministic, DOM-free battle rules. Coordinates are world pixels. */
(function (root) {
  'use strict';

  const Pala = root.Pala = root.Pala || {};
  const units = [
    { id: 'mouse', name: '坚果剑士', description: '敏捷的前线伙伴，便宜、可靠。', cost: 12, cooldown: 2.4, unlockLevel: 1, hp: 82, damage: 11, range: 39, attackInterval: 0.9, speed: 66, ranged: false, canHitAir: false },
    { id: 'rabbit', name: '苜蓿游侠', description: '远程弓箭手，可以攻击飞行敌人。', cost: 24, cooldown: 4.8, unlockLevel: 1, hp: 62, damage: 15, range: 275, attackInterval: 1.2, speed: 56, ranged: true, canHitAir: true },
    { id: 'bear', name: '松果重卫', description: '坚实的近战盾墙，第 3 关解锁。', cost: 44, cooldown: 8, unlockLevel: 3, hp: 310, damage: 29, range: 49, attackInterval: 1.5, speed: 43, ranged: false, canHitAir: false },
    { id: 'fox', name: '星火法师', description: '魔法弹造成范围伤害，第 6 关解锁。', cost: 58, cooldown: 10, unlockLevel: 6, hp: 98, damage: 32, range: 315, attackInterval: 1.65, speed: 52, ranged: true, canHitAir: true, splash: 86 },
    { id: 'squirrel', name: '松果投手', description: '向敌群投掷爆裂松果，适合清理密集敌人。', cost: 39, cooldown: 7, unlockLevel: 8, hp: 76, damage: 23, range: 240, attackInterval: 1.55, speed: 60, ranged: true, canHitAir: true, splash: 70 },
    { id: 'hedgehog', name: '荆刺守卫', description: '厚实的前排，受到近战攻击会反弹伤害。', cost: 48, cooldown: 9, unlockLevel: 11, hp: 360, damage: 20, range: 42, attackInterval: 1.35, speed: 38, ranged: false, canHitAir: false, armor: 0.16, thorns: 0.32 },
    { id: 'owl', name: '月羽医师', description: '跟随前线，周期性治疗附近受伤伙伴。', cost: 55, cooldown: 11, unlockLevel: 14, hp: 130, damage: 0, range: 0, attackInterval: 4.5, speed: 58, ranged: false, canHitAir: false, healer: true, healing: 48 },
    { id: 'boar', name: '破晓野猪', description: '冲入敌阵，蓄力攻击会击退地面敌人。', cost: 72, cooldown: 12, unlockLevel: 18, hp: 290, damage: 38, range: 46, attackInterval: 1.25, speed: 92, ranged: false, canHitAir: false, charger: true }
  ];
  const spells = [
    { id: 'bolt', name: '圣光雷击', description: '劈向前方敌人，造成范围伤害。', cost: 22, cooldown: 5.5, key: 'J', damage: 84, radius: 115 },
    { id: 'heal', name: '生命祷言', description: '恢复自己与周围伙伴的生命。', cost: 30, cooldown: 11, key: 'K', healing: 100, radius: 460 },
    { id: 'frost', name: '寒霜领域', description: '冻结战线：伤害并减速敌人 7 秒。', cost: 34, cooldown: 14, key: 'L', damage: 25, radius: 370, duration: 7 }
  ];
  const equipment = [
    { id: 'glimmer_staff', slot: 'staff', name: '微光权杖', description: '帕拉最初的权杖，三种魔法保持均衡。', cost: 0, unlockLevel: 1 },
    { id: 'storm_staff', slot: 'staff', name: '雷鸣权杖', description: '圣光雷击伤害提高 35%，帕拉普通攻击提高 15%。', cost: 180, unlockLevel: 4, boltDamage: 0.35, heroDamage: 0.15 },
    { id: 'frost_staff', slot: 'staff', name: '霜纹权杖', description: '寒霜领域伤害提高 45%，减速延长 3 秒。', cost: 240, unlockLevel: 8, frostDamage: 0.45, frostDuration: 3 },
    { id: 'renewal_staff', slot: 'staff', name: '祈愿权杖', description: '生命祷言额外治疗 55 点，帕拉光环范围增加 30。', cost: 300, unlockLevel: 13, healBonus: 55, auraRadius: 30 },
    { id: 'traveler_ring', slot: 'ring', name: '旅者之环', description: '轻巧的旧戒指，没有额外加成。', cost: 0, unlockLevel: 1 },
    { id: 'harvest_ring', slot: 'ring', name: '丰收之环', description: '食物上限增加 25，每秒额外恢复 0.65 食物。', cost: 160, unlockLevel: 3, foodCap: 25, foodRegen: 0.65 },
    { id: 'spring_ring', slot: 'ring', name: '灵泉之环', description: '魔法上限增加 25，每秒额外恢复 0.7 魔法。', cost: 210, unlockLevel: 6, manaCap: 25, manaRegen: 0.7 },
    { id: 'guardian_ring', slot: 'ring', name: '守望之环', description: '帕拉最大生命增加 90，光环范围增加 25。', cost: 280, unlockLevel: 11, heroHp: 90, auraRadius: 25 }
  ];
  const enemies = {
    skeleton: { name: '荒骨兵', hp: 62, damage: 9, range: 36, attackInterval: 1.15, speed: 45 },
    slime: { name: '幽苔史莱姆', hp: 126, damage: 12, range: 38, attackInterval: 1.5, speed: 31 },
    bat: { name: '暮色蝠', hp: 44, damage: 8, range: 45, attackInterval: 1.05, speed: 75, flying: true },
    brute: { name: '石甲巨兽', hp: 245, damage: 24, range: 49, attackInterval: 1.65, speed: 27 },
    necromancer: { name: '枯枝巫师', hp: 145, damage: 20, range: 295, attackInterval: 1.9, speed: 32, ranged: true },
    boss: { name: '暗影领主', hp: 440, damage: 37, range: 67, attackInterval: 1.7, speed: 26, splash: 75 },
    archer: { name: '骸骨射手', hp: 92, damage: 15, range: 250, attackInterval: 1.55, speed: 42, ranged: true },
    wraith: { name: '寒雾幽影', hp: 116, damage: 15, range: 58, attackInterval: 1.25, speed: 64, flying: true },
    hound: { name: '夜袭猎犬', hp: 138, damage: 19, range: 43, attackInterval: 1.1, speed: 92 },
    sentinel: { name: '铁壳守卫', hp: 390, damage: 22, range: 46, attackInterval: 1.55, speed: 29, armor: 0.22 },
    shaman: { name: '灰烬祭司', hp: 175, damage: 11, range: 245, attackInterval: 2, speed: 32, ranged: true, healer: true, healing: 36 },
    bomber: { name: '裂火虫', hp: 86, damage: 13, range: 30, attackInterval: 1.3, speed: 77, deathBurst: 55 }
  };
  const enemyIntel = {
    skeleton: { firstLevel: 1, trait: '近战 · 群攻', counter: '生命较低，用廉价剑士挡住即可。' },
    slime: { firstLevel: 1, trait: '近战 · 厚血', counter: '移动缓慢；让游侠在盾卫身后持续输出。' },
    bat: { firstLevel: 2, trait: '飞行 · 快速', counter: '近战伙伴无法攻击它，派出游侠或法师。' },
    brute: { firstLevel: 4, trait: '近战 · 重击', counter: '伤害高但动作慢，用重卫承伤并在后排集火。' },
    necromancer: { firstLevel: 5, trait: '远程 · 召唤', counter: '会召来荒骨兵；用范围法术尽快打断其阵地。' },
    boss: { firstLevel: 3, trait: '首领 · 范围攻击', counter: '击败领主才能解除首领关据点的护盾。' },
    archer: { firstLevel: 13, trait: '远程 · 射手', counter: '射程长但脆弱，野猪冲锋或雷击可以快速处理。' },
    wraith: { firstLevel: 13, trait: '飞行 · 游击', counter: '让能对空的伙伴守住后排，别让它越过盾卫。' },
    hound: { firstLevel: 15, trait: '近战 · 疾速', counter: '移动很快，预留前排或用寒霜领域减速。' },
    sentinel: { firstLevel: 17, trait: '近战 · 重甲', counter: '护甲减伤，集中法术和后排火力击破。' },
    shaman: { firstLevel: 17, trait: '远程 · 治疗', counter: '会治疗受伤敌军，优先用雷击或冲锋清除。' },
    bomber: { firstLevel: 19, trait: '近战 · 自爆', counter: '死亡时伤及附近友军；尽量在远处击杀。' }
  };
  const levelNames = [
    ['苔光小径', '让第一束晨光，照进被遗忘的森林。'],
    ['低语树海', '林间不止有脚步声，还有翅膀声。'],
    ['荆棘之门', '与新加入的松果重卫，一同击败守门者。'],
    ['旧王大道', '石板之下，沉睡的军团已经醒来。'],
    ['断壁钟楼', '远处的法师正在召回旧日亡灵。'],
    ['余烬城关', '穿越火与灰，星火法师将与你同行。'],
    ['月影湿地', '在月色里守住彼此的光。'],
    ['遗忘庭院', '敌人越来越密集，试试寒霜与星火。'],
    ['无声王座', '古老王庭的最后一名守卫。'],
    ['幽蓝裂谷', '深渊近在眼前，伙伴就在身边。'],
    ['永夜回廊', '所有训练，都是为了最后的黎明。'],
    ['黎明之誓', '摧毁暗影核心，让森林重新醒来。'],
    ['霜石隘口', '在冰封山口迎战骸骨射手。'],
    ['白羽哨站', '月羽医师加入远征，伤者有了新的希望。'],
    ['冰镜长廊', '寒雾幽影在镜面之间游荡。'],
    ['霜王之眠', '击败冰封的领主，点燃山巅烽火。'],
    ['灰烬荒原', '灰烬祭司在火光后方集结军团。'],
    ['熔炉边界', '破晓野猪加入战线，冲破铁壳守卫。'],
    ['赤炎裂缝', '小心裂火虫在死亡时引燃战场。'],
    ['火山之心', '穿过熔岩，斩断暗影的第二道锁链。'],
    ['曙光原野', '黎明临近，敌人的最后军团开始反扑。'],
    ['晨星祭坛', '守住阵型，向古老祭坛发起进攻。'],
    ['天空阶梯', '越过云端，找到暗影力量的源头。'],
    ['终焉晨曦', '让光照到每一位并肩作战的伙伴。']
  ];
  const chapters = [
    { name: '翡翠边境', english: 'THE EMERALD FRONTIER', biome: 'forest' },
    { name: '失落古城', english: 'THE LOST CITADEL', biome: 'ruins' },
    { name: '永夜之森', english: 'THE ENDLESS NIGHT', biome: 'night' },
    { name: '霜石山脉', english: 'THE FROZEN RIDGE', biome: 'frost' },
    { name: '赤焰荒原', english: 'THE ASHEN WILDS', biome: 'ember' },
    { name: '破晓天际', english: 'THE DAWNING SKY', biome: 'dawn' }
  ];
  const levels = levelNames.map(function (names, index) {
    const id = index + 1;
    return {
      id: id, name: names[0], subtitle: names[1], biome: chapters[Math.floor(index / 4)].biome,
      difficulty: id <= 3 ? '初程' : id <= 8 ? '进阶' : id <= 15 ? '挑战' : id <= 21 ? '危境' : '决战',
      reward: 70 + id * 25,
      waveCount: id <= 12 ? 4 + Math.floor(id / 3) : id <= 16 ? 5 : 6,
      waveInterval: Math.max(10.5, 15 - id * 0.3),
      towerHp: 460 + Math.min(id, 12) * 125 + Math.max(0, id - 12) * 70,
      boss: id <= 12 ? id % 3 === 0 : id % 4 === 0, recommendedUpgrades: Math.floor((id - 1) / 3)
    };
  });
  const upgrades = [
    { id: 'vitality', name: '橡木之心', description: '每级增加帕拉 65 点生命。', maxLevel: 7, baseCost: 75, costMultiplier: 1.55 },
    { id: 'leadership', name: '勇气旗帜', description: '每级增加帕拉与伙伴 12% 伤害。', maxLevel: 7, baseCost: 90, costMultiplier: 1.55 },
    { id: 'provision', name: '丰收口袋', description: '每级增加每秒 0.45 食物恢复与 10 上限。', maxLevel: 7, baseCost: 85, costMultiplier: 1.55 },
    { id: 'focus', name: '星辰祝福', description: '每级增加每秒 0.4 魔法恢复与 10 上限。', maxLevel: 7, baseCost: 80, costMultiplier: 1.55 }
  ];
  const survivalBlessings = [
    { id: 'heart', name: '生命祈愿', description: '生命上限 +65，并恢复 120 生命。' },
    { id: 'supplies', name: '丰收补给', description: '食物上限 +25，每秒恢复 +0.7。' },
    { id: 'magic', name: '星辉冥想', description: '魔法上限 +25，每秒恢复 +0.7。' },
    { id: 'rally', name: '勇气号角', description: '帕拉与所有伙伴伤害 +15%。' }
  ];
  Pala.DATA = { units: units, spells: spells, levels: levels, chapters: chapters, upgrades: upgrades, enemies: enemies, enemyIntel: enemyIntel, equipment: equipment, survivalBlessings: survivalBlessings };
  Pala.upgradeCost = function (id, currentLevel) {
    const upgrade = upgrades.find(function (item) { return item.id === id; });
    return upgrade ? Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel || 0)) : 0;
  };

  const clamp = function (value, low, high) { return Math.max(low, Math.min(high, value)); };
  Pala.enemyRoster = function (levelId) {
    const tier = clamp(Math.floor(Number(levelId) || 1), 1, levels.length);
    const roster = ['skeleton', 'skeleton', 'slime'];
    if (tier >= 2) roster.push('bat');
    if (tier >= 4) roster.push('brute');
    if (tier >= 5) roster.push('necromancer');
    if (tier >= 13) roster.push('archer', 'wraith');
    if (tier >= 15) roster.push('hound');
    if (tier >= 17) roster.push('sentinel', 'shaman');
    if (tier >= 19) roster.push('bomber', 'bomber');
    return roster;
  };
  const survivalFormations = [
    { name: '常规', description: '敌军混合推进，保持前后排协作。' },
    { name: '疾袭', description: '快速与飞行敌人来袭，保留对空火力。', kinds: ['skeleton', 'bat', 'wraith', 'hound', 'bomber'] },
    { name: '重甲', description: '厚血前排推进，集中火力并及时治疗。', kinds: ['skeleton', 'slime', 'brute', 'sentinel'] },
    { name: '秘术', description: '远程与召唤敌人集结，利用范围法术清场。', kinds: ['skeleton', 'necromancer', 'archer', 'shaman'] }
  ];

  class Engine {
    constructor(options) {
      options = options || {};
      this.mode = options.mode === 'survival' ? 'survival' : 'campaign';
      this.level = levels[clamp(Math.floor(Number(options.level) || 1), 1, levels.length) - 1];
      this.unlockedLevel = this.mode === 'survival' ? levels.length : Math.max(this.level.id, clamp(Math.floor(Number(options.unlockedLevel) || 1), 1, levels.length));
      this.upgrades = {};
      upgrades.forEach((item) => { this.upgrades[item.id] = clamp(Math.floor(Number((options.upgrades || {})[item.id]) || 0), 0, item.maxLevel); });
      this.staff = equipment.find((item) => item.slot === 'staff' && item.id === options.equipment?.staff) || equipment[0];
      this.ring = equipment.find((item) => item.slot === 'ring' && item.id === options.equipment?.ring) || equipment[4];
      this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : function () {};
      this.seed = (Number(options.seed) || this.level.id * 7919) >>> 0;
      this.nextId = 1;
      this.spawnQueue = [];
      this.nextWaveAt = this.mode === 'survival' ? 2 : 3;
      this.bossSpawned = false;
      this.towerReinforced = false;
      this.waveClearHandled = false;
      this.survivalDamage = 1;
      const heroHp = 340 + this.upgrades.vitality * 65 + (this.ring.heroHp || 0);
      this.state = {
        phase: 'playing', paused: false, time: 0, food: 42, maxFood: 100 + this.upgrades.provision * 10 + (this.ring.foodCap || 0),
        mana: 64, maxMana: 100 + this.upgrades.focus * 10 + (this.ring.manaCap || 0), foodRegen: 2.6 + this.upgrades.provision * 0.45 + (this.ring.foodRegen || 0),
        manaRegen: 2.5 + this.upgrades.focus * 0.4 + (this.ring.manaRegen || 0), kills: 0, wave: 0, waveCount: this.mode === 'survival' ? Infinity : this.level.waveCount,
        hero: {
          id: 'hero', kind: 'hero', side: 'ally', x: this.mode === 'survival' ? 420 : 300, y: 0, hp: heroHp, maxHp: heroHp, facing: 1,
          state: 'idle', speed: 142, damage: 19 * (1 + this.upgrades.leadership * 0.12) * (1 + (this.staff.heroDamage || 0)),
          range: 80, attackInterval: 0.82, attackTimer: 0, auraRadius: 225 + (this.staff.auraRadius || 0) + (this.ring.auraRadius || 0), canHitAir: true, hitFlash: 0,
          staffId: this.staff.id, ringId: this.ring.id
        },
        units: [], tower: this.mode === 'survival' ? null : { id: 'tower', kind: 'tower', side: 'enemy', x: 2280, y: 0, hp: this.level.towerHp, maxHp: this.level.towerHp, facing: -1, range: 380, attackTimer: 2, hitFlash: 0, shielded: this.level.boss, reinforced: false },
        projectiles: [], effects: [], cooldowns: {}, worldWidth: this.mode === 'survival' ? 1500 : 2400, level: this.mode === 'survival' ? { id: 0, name: '无尽生存', biome: 'night' } : this.level, maxUnits: 28,
        mode: this.mode, survivalChoices: [], nextWaveIn: this.nextWaveAt, formationName: '常规', formationDescription: survivalFormations[0].description, result: null
      };
      units.concat(spells).forEach((item) => { this.state.cooldowns[item.id] = 0; });
    }

    random() {
      this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }

    emit(type, details) {
      this.onEvent(Object.assign({ type: type, time: this.state.time }, details || {}));
    }

    effect(kind, x, y, radius, side) {
      const life = kind === 'frost' ? 0.9 : kind === 'heal' ? 0.8 : kind === 'bolt' ? 0.48 : 0.4;
      this.state.effects.push({ id: 'effect-' + this.nextId++, kind: kind, x: x, y: y || 0, radius: radius || 28, side: side || 'ally', age: 0, life: life, maxLife: life });
    }

    numberEffect(target, amount, healing) {
      if (amount <= 0) return;
      const effects = this.state.effects;
      const existing = effects.find(effect => effect.kind === 'number' && effect.entityId === target.id && effect.healing === healing && effect.age < 0.12);
      if (existing) { existing.amount += amount; return; }
      const numbers = effects.filter(effect => effect.kind === 'number');
      if (numbers.length >= 32) effects.splice(effects.indexOf(numbers[0]), 1);
      effects.push({ id: 'effect-' + this.nextId++, kind: 'number', entityId: target.id, x: target.x, y: target.y - 42, amount: amount, side: target.side, healing: healing, age: 0, life: 0.85, maxLife: 0.85 });
    }

    summon(unitId) {
      const state = this.state;
      const data = units.find(function (item) { return item.id === unitId; });
      if (!data || state.phase !== 'playing' || state.paused || data.unlockLevel > this.unlockedLevel || state.food < data.cost || state.cooldowns[unitId] > 0 || state.units.filter(function (unit) { return unit.side === 'ally' && unit.hp > 0; }).length >= state.maxUnits) return false;
      state.food -= data.cost;
      state.cooldowns[unitId] = data.cooldown;
      const unit = Object.assign({}, data, {
        id: 'ally-' + this.nextId++, kind: data.id, side: 'ally', x: Math.max(70, state.hero.x - 75 - this.random() * 22), y: 0,
        hp: data.hp, maxHp: data.hp, damage: data.damage * (1 + this.upgrades.leadership * 0.12) * this.survivalDamage,
        facing: 1, state: 'walk', attackTimer: 0.15, hitFlash: 0, slowTime: 0, aura: false, chargeTimer: 0
      });
      state.units.push(unit);
      this.effect('spawn', unit.x, 0, 24);
      this.emit('summon', { unitId: unitId, entityId: unit.id, x: unit.x });
      return true;
    }

    cast(spellId) {
      const state = this.state;
      const spell = spells.find(function (item) { return item.id === spellId; });
      if (!spell || state.phase !== 'playing' || state.paused || state.mana < spell.cost || state.cooldowns[spellId] > 0) return false;
      const hero = state.hero;
      let target;
      if (spellId === 'heal') {
        const friends = [hero].concat(state.units.filter(function (unit) { return unit.side === 'ally' && unit.hp > 0 && Math.abs(unit.x - hero.x) <= spell.radius; }));
        if (!friends.some(function (unit) { return unit.hp < unit.maxHp; })) return false;
        friends.forEach((unit) => {
          const before = unit.hp;
          unit.hp = Math.min(unit.maxHp, unit.hp + spell.healing + this.upgrades.focus * 12 + (this.staff.healBonus || 0));
          this.numberEffect(unit, unit.hp - before, true);
          this.effect('heal', unit.x, unit.y, 36);
        });
        target = hero;
      } else {
        // Lightning may target the enemy tower; frost is an anti-unit spell.
        // Excluding the tower while searching prevents a nearby tower from
        // masking a valid enemy standing slightly farther away.
        target = this.findTarget(hero, spellId === 'bolt' ? 900 : 800, spellId === 'bolt');
        if (!target) return false;
        const center = target.x;
        const victims = state.units.filter(function (unit) { return unit.side === 'enemy' && unit.hp > 0 && Math.abs(unit.x - center) <= spell.radius; });
        if (spellId === 'bolt' && state.tower && Math.abs(state.tower.x - center) <= spell.radius) victims.push(state.tower);
        this.effect(spellId, center, 0, spell.radius);
        victims.forEach((unit) => {
          if (spellId === 'frost') unit.slowTime = Math.max(unit.slowTime || 0, spell.duration + (this.staff.frostDuration || 0));
          const staffBonus = spellId === 'bolt' ? this.staff.boltDamage || 0 : this.staff.frostDamage || 0;
          this.damage(unit, spell.damage * (1 + this.upgrades.focus * 0.08) * (1 + staffBonus), hero);
        });
      }
      state.mana -= spell.cost;
      state.cooldowns[spellId] = spell.cooldown;
      this.emit('cast', { spellId: spellId, x: target.x, y: target.y });
      return true;
    }

    setPaused(paused) {
      this.state.paused = Boolean(paused);
    }

    chooseSurvivalBlessing(id) {
      const state = this.state;
      if (this.mode !== 'survival' || !state.paused || !state.survivalChoices.includes(id)) return false;
      if (id === 'heart') {
        state.hero.maxHp += 65;
        const before = state.hero.hp;
        state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + 120);
        this.numberEffect(state.hero, state.hero.hp - before, true);
      } else if (id === 'supplies') {
        state.maxFood += 25;
        state.foodRegen += 0.7;
        state.food = Math.min(state.maxFood, state.food + 25);
      } else if (id === 'magic') {
        state.maxMana += 25;
        state.manaRegen += 0.7;
        state.mana = Math.min(state.maxMana, state.mana + 25);
      } else if (id === 'rally') {
        this.survivalDamage *= 1.15;
        state.hero.damage *= 1.15;
        state.units.filter(unit => unit.side === 'ally').forEach(unit => { unit.damage *= 1.15; });
      }
      state.survivalChoices = [];
      state.paused = false;
      this.nextWaveAt = state.time + 3;
      this.emit('blessing', { id: id });
      return true;
    }

    spawnEnemy(kind, x) {
      if (kind === 'boss') this.bossSpawned = true;
      const data = enemies[kind];
      const tier = this.mode === 'survival' ? Math.min(24, Math.max(1, Math.floor(this.state.wave * 1.5))) : this.level.id;
      const extra = this.mode === 'survival' ? Math.max(0, this.state.wave - 16) : 0;
      const scale = (1 + (Math.min(tier, 12) - 1) * 0.095 + Math.max(0, tier - 12) * 0.025) * (1 + extra * 0.07);
      const hp = Math.round((data.hp + (kind === 'boss' ? Math.min(tier, 12) * 24 + Math.max(0, tier - 12) * 10 : 0)) * scale);
      const unit = Object.assign({}, data, {
        id: 'enemy-' + this.nextId++, kind: kind, side: 'enemy', x: x === undefined ? (this.mode === 'survival' ? 1390 : 2250) : x, y: data.flying ? -48 : 0,
        hp: hp, maxHp: hp, damage: data.damage * (1 + (Math.min(tier, 12) - 1) * 0.055 + Math.max(0, tier - 12) * 0.018 + extra * 0.035),
        facing: -1, state: 'walk', attackTimer: 0.4, hitFlash: 0, slowTime: 0, canHitAir: true,
        summonTimer: kind === 'necromancer' ? 12 : 0, summonsLeft: kind === 'necromancer' ? 3 : 0,
        healTimer: kind === 'shaman' ? 5 : 0
      });
      this.state.units.push(unit);
      this.effect('spawn', unit.x, unit.y, 28, 'enemy');
      return unit;
    }

    startWave() {
      const state = this.state;
      state.wave += 1;
      this.waveClearHandled = false;
      if (this.mode === 'survival') this.bossSpawned = false;
      const tier = this.mode === 'survival' ? Math.min(24, Math.floor(state.wave * 1.5)) : this.level.id;
      const count = this.mode === 'survival' ? Math.min(12, 3 + Math.floor(state.wave * 0.7)) : Math.min(5, 2 + Math.floor((this.level.id - 1) / 3)) + (state.wave % 2 === 0 ? 1 : 0);
      const formation = survivalFormations[this.mode === 'survival' ? (state.wave - 1) % survivalFormations.length : 0];
      state.formationName = formation.name;
      state.formationDescription = formation.description;
      const roster = Pala.enemyRoster(tier).filter(kind => !formation.kinds || formation.kinds.includes(kind));
      const spawnX = this.mode === 'survival' && state.wave > 1 ? clamp(state.hero.x + 600, 650, state.worldWidth - 110) : undefined;
      for (let i = 0; i < count; i++) {
        const kind = roster[Math.floor(this.random() * roster.length)];
        this.spawnQueue.push({ at: state.time + i * 0.8, kind: kind, x: spawnX });
      }
      const boss = this.mode === 'survival' ? state.wave % 5 === 0 : this.level.boss && state.wave === state.waveCount && !this.bossSpawned;
      if (boss) this.spawnQueue.push({ at: state.time + count * 0.8, kind: 'boss', x: spawnX });
      this.nextWaveAt = this.mode === 'survival' ? Infinity : state.time + this.level.waveInterval;
      this.emit('wave', { wave: state.wave, waveCount: state.waveCount, boss: boss, formationName: formation.name, formationDescription: formation.description });
    }

    reinforceTower() {
      if (this.towerReinforced) return;
      this.towerReinforced = true;
      this.state.tower.reinforced = true;
      const roster = this.level.id < 5 ? ['skeleton', 'slime', 'skeleton']
        : this.level.id < 13 ? ['skeleton', 'brute', 'bat']
          : this.level.id < 17 ? ['archer', 'wraith', 'brute']
            : this.level.id < 21 ? ['sentinel', 'hound', 'shaman']
              : ['sentinel', 'bomber', 'wraith', 'shaman'];
      roster.forEach((kind, index) => this.spawnEnemy(kind, this.state.tower.x - 100 - index * 40));
      this.effect('burst', this.state.tower.x, -55, 100, 'enemy');
      this.emit('reinforcement', { count: roster.length, x: this.state.tower.x });
    }

    findTarget(attacker, maxRange, includeTower) {
      const state = this.state;
      const candidates = attacker.side === 'ally' ? state.units : [state.hero].concat(state.units);
      let target = null;
      let distance = maxRange === undefined ? Infinity : maxRange;
      for (const candidate of candidates) {
        if (candidate.hp <= 0 || candidate.side === attacker.side || (candidate.flying && !attacker.canHitAir)) continue;
        const gap = Math.abs(candidate.x - attacker.x);
        if (gap < distance || (!target && gap <= distance)) {
          target = candidate;
          distance = gap;
        }
      }
      if (includeTower && attacker.side === 'ally' && state.tower && state.tower.hp > 0) {
        const gap = Math.abs(state.tower.x - attacker.x);
        if (gap < distance || (!target && gap <= distance)) target = state.tower;
      }
      return target;
    }

    damage(target, amount, source) {
      const state = this.state;
      if (target.hp <= 0 || state.phase !== 'playing') return;
      if (target.kind === 'tower' && target.shielded) {
        if (!this.bossSpawned) {
          this.spawnQueue = this.spawnQueue.filter(function (spawn) { return spawn.kind !== 'boss'; });
          this.spawnEnemy('boss', state.tower.x - 115);
          this.emit('wave', { wave: state.wave, waveCount: state.waveCount, boss: true, ambush: true });
        }
        this.effect('frost', target.x, -70, 70, 'enemy');
        return;
      }
      if (target.side === 'ally' && target.kind !== 'hero' && Math.abs(target.x - state.hero.x) <= state.hero.auraRadius) amount *= 0.88;
      if (target.armor) amount *= 1 - target.armor;
      amount = Math.max(1, amount);
      const before = target.hp;
      target.hp = Math.max(0, target.hp - amount);
      if (target.kind === 'tower' && !this.towerReinforced && target.hp <= target.maxHp / 2) {
        target.hp = Math.max(target.hp, target.maxHp / 2);
        this.reinforceTower();
      }
      amount = before - target.hp;
      target.hitFlash = 0.13;
      this.effect('hit', target.x, target.y - 18, Math.min(36, 12 + amount * 0.2), source.side);
      this.numberEffect(target, amount, false);
      this.emit('hit', { sourceId: source.id, targetId: target.id, damage: amount, x: target.x, y: target.y, side: source.side });
      if (target.hp <= 0) {
        this.effect('death', target.x, target.y, target.kind === 'boss' ? 85 : 35, target.side);
        if (target.kind === 'hero') this.finish('lost');
        else if (target.kind === 'tower') this.finish('won');
        else {
          if (target.side === 'enemy') {
            if (target.kind === 'boss' && state.tower) state.tower.shielded = false;
            state.kills += 1;
            state.food = Math.min(state.maxFood, state.food + (target.kind === 'boss' ? 8 : 1.5));
            state.mana = Math.min(state.maxMana, state.mana + (target.kind === 'boss' ? 8 : 2));
          }
          this.emit('kill', { unitId: target.id, kind: target.kind, side: target.side, x: target.x });
          if (target.deathBurst && state.phase === 'playing') {
            this.effect('burst', target.x, target.y, target.deathBurst, target.side);
            [state.hero].concat(state.units).forEach((victim) => {
              if (victim.hp > 0 && victim.side !== target.side && Math.abs(victim.x - target.x) <= target.deathBurst) {
                this.damage(victim, target.damage * 2.4, target);
              }
            });
          }
        }
      }
    }

    finish(phase) {
      if (this.state.phase !== 'playing') return;
      const state = this.state;
      state.phase = phase;
      state.result = { won: phase === 'won', level: this.level.id, time: state.time, kills: state.kills, wave: state.wave, reward: phase === 'won' ? this.level.reward : 0, stars: phase === 'won' ? (state.hero.hp / state.hero.maxHp >= 0.6 ? 3 : state.hero.hp / state.hero.maxHp >= 0.3 ? 2 : 1) : 0 };
      this.emit(phase === 'won' ? 'win' : 'lose', state.result);
    }

    attack(attacker, target) {
      attacker.state = 'attack';
      attacker.facing = target.x >= attacker.x ? 1 : -1;
      const aura = attacker.side === 'ally' && attacker.kind !== 'hero' && Math.abs(attacker.x - this.state.hero.x) <= this.state.hero.auraRadius;
      attacker.attackTimer = attacker.attackInterval / (aura ? 1.18 : 1);
      const charged = attacker.charger && attacker.chargeTimer <= 0 && target.kind !== 'tower';
      const damage = attacker.damage * (aura ? 1.12 : 1) * (charged ? 2.1 : 1);
      if (charged) {
        attacker.chargeTimer = 6.5;
        this.effect('charge', target.x, target.y, 48, attacker.side);
      }
      if (attacker.ranged) {
        const kind = attacker.kind === 'rabbit' ? 'arrow' : attacker.kind === 'squirrel' ? 'acorn' : attacker.side === 'enemy' ? 'dark' : 'orb';
        this.state.projectiles.push({
          id: 'projectile-' + this.nextId++, kind: kind, sourceId: attacker.id, side: attacker.side,
          x: attacker.x, y: attacker.y - 29, targetId: target.id, targetX: target.x, targetY: target.y - 22,
          damage: damage, speed: kind === 'arrow' ? 550 : 390, splash: attacker.splash || 0, life: 6, maxLife: 6
        });
      } else {
        this.damage(target, damage, attacker);
        if (charged && target.hp > 0 && !target.flying) target.x = clamp(target.x + (attacker.side === 'ally' ? 80 : -80), 40, this.state.worldWidth - 80);
        if (target.thorns && target.hp > 0 && attacker.hp > 0 && this.state.phase === 'playing') this.damage(attacker, damage * target.thorns, target);
        if (attacker.splash && this.state.phase === 'playing') {
          const others = [this.state.hero].concat(this.state.units);
          others.forEach((unit) => {
            if (unit.id !== target.id && unit.side !== attacker.side && unit.hp > 0 && Math.abs(unit.x - target.x) < attacker.splash) this.damage(unit, damage * 0.5, attacker);
          });
        }
      }
    }

    updateProjectiles(dt) {
      const state = this.state;
      const entities = [state.hero].concat(state.tower ? [state.tower] : [], state.units);
      for (const shot of state.projectiles) {
        shot.life -= dt;
        const target = entities.find(function (unit) { return unit.id === shot.targetId && unit.hp > 0; });
        if (!target) { shot.life = 0; continue; }
        shot.targetX = target.x;
        shot.targetY = target.y - 22;
        const dx = shot.targetX - shot.x;
        const dy = shot.targetY - shot.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= shot.speed * dt) {
          this.damage(target, shot.damage, shot);
          if (shot.splash) {
            for (const unit of entities) {
              if (unit.id !== target.id && unit.side !== shot.side && unit.hp > 0 && Math.abs(unit.x - target.x) <= shot.splash) this.damage(unit, shot.damage * 0.65, shot);
            }
            this.effect(shot.kind === 'acorn' ? 'burst' : 'bolt', target.x, target.y, shot.splash, shot.side);
          }
          shot.life = 0;
        } else {
          shot.x += dx / distance * shot.speed * dt;
          shot.y += dy / distance * shot.speed * dt;
        }
      }
      state.projectiles = state.projectiles.filter(function (shot) { return shot.life > 0; });
    }

    step(dt, move) {
      const state = this.state;
      state.time += dt;
      state.food = Math.min(state.maxFood, state.food + state.foodRegen * dt);
      state.mana = Math.min(state.maxMana, state.mana + state.manaRegen * dt);
      Object.keys(state.cooldowns).forEach(function (key) { state.cooldowns[key] = Math.max(0, state.cooldowns[key] - dt); });
      if (state.wave < state.waveCount && state.time >= this.nextWaveAt) this.startWave();
      for (const spawn of this.spawnQueue) {
        if (spawn.at <= state.time && !spawn.done) {
          if (spawn.kind !== 'boss' || !this.bossSpawned) this.spawnEnemy(spawn.kind, spawn.x);
          spawn.done = true;
        }
      }
      this.spawnQueue = this.spawnQueue.filter(function (spawn) { return !spawn.done; });
      state.nextWaveIn = state.wave < state.waveCount ? Math.max(0, this.nextWaveAt - state.time) : 0;

      const hero = state.hero;
      hero.attackTimer = Math.max(0, hero.attackTimer - dt);
      hero.hitFlash = Math.max(0, hero.hitFlash - dt);
      if (move) {
        hero.x = clamp(hero.x + move * hero.speed * dt, 85, state.worldWidth - 200);
        hero.facing = move > 0 ? 1 : -1;
        hero.state = 'walk';
      } else hero.state = 'idle';
      const heroTarget = this.findTarget(hero, hero.range, true);
      if (heroTarget && hero.attackTimer <= 0) this.attack(hero, heroTarget);

      for (const unit of state.units.slice()) {
        if (unit.hp <= 0 || state.phase !== 'playing') continue;
        unit.attackTimer = Math.max(0, unit.attackTimer - dt);
        if (unit.chargeTimer > 0) unit.chargeTimer = Math.max(0, unit.chargeTimer - dt);
        unit.hitFlash = Math.max(0, unit.hitFlash - dt);
        unit.slowTime = Math.max(0, unit.slowTime - dt);
        unit.aura = unit.side === 'ally' && Math.abs(unit.x - hero.x) <= hero.auraRadius;
        if (unit.kind === 'owl') {
          const friends = [hero].concat(state.units.filter((friend) => friend.side === 'ally' && friend.hp > 0));
          const wounded = friends.filter((friend) => friend.hp < friend.maxHp && Math.abs(friend.x - unit.x) <= 230)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          const follow = clamp(hero.x - 55, 90, state.worldWidth - 270);
          if (Math.abs(follow - unit.x) > 28) {
            unit.x += Math.sign(follow - unit.x) * Math.min(unit.speed * dt, Math.abs(follow - unit.x));
            unit.state = 'walk';
          } else unit.state = 'idle';
          if (wounded && unit.attackTimer <= 0) {
            const before = wounded.hp;
            wounded.hp = Math.min(wounded.maxHp, wounded.hp + unit.healing * (1 + this.upgrades.focus * 0.08));
            this.numberEffect(wounded, wounded.hp - before, true);
            unit.attackTimer = unit.attackInterval;
            unit.state = 'attack';
            this.effect('heal', wounded.x, wounded.y, 32);
            this.emit('heal', { sourceId: unit.id, targetId: wounded.id, x: wounded.x });
          }
          continue;
        }
        if (unit.kind === 'shaman') {
          unit.healTimer -= dt;
          if (unit.healTimer <= 0) {
            const wounded = state.units.filter((friend) => friend.side === 'enemy' && friend.hp > 0 && friend.hp < friend.maxHp && Math.abs(friend.x - unit.x) <= 240)
              .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
            if (wounded) {
              const tier = this.mode === 'survival' ? Math.min(24, Math.max(1, Math.floor(state.wave * 1.5))) : this.level.id;
              const before = wounded.hp;
              wounded.hp = Math.min(wounded.maxHp, wounded.hp + unit.healing * (1 + tier * 0.04));
              this.numberEffect(wounded, wounded.hp - before, true);
              this.effect('heal', wounded.x, wounded.y, 30, 'enemy');
              this.emit('heal', { sourceId: unit.id, targetId: wounded.id, x: wounded.x });
            }
            unit.healTimer = 5.5;
          }
        }
        const target = this.findTarget(unit, Infinity, true);
        if (!target) { unit.state = 'idle'; continue; }
        const gap = target.x - unit.x;
        if (Math.abs(gap) <= unit.range) {
          unit.state = unit.attackTimer > unit.attackInterval * 0.65 ? 'attack' : 'idle';
          if (unit.attackTimer <= 0) this.attack(unit, target);
        } else {
          const direction = gap > 0 ? 1 : -1;
          unit.facing = direction;
          unit.state = 'walk';
          const speed = unit.speed * (unit.slowTime > 0 ? 0.38 : 1);
          unit.x += direction * Math.min(speed * dt, Math.abs(gap) - unit.range);
          unit.x = clamp(unit.x, 40, state.worldWidth - 80);
        }
        if (unit.kind === 'necromancer') {
          unit.summonTimer -= dt * (unit.slowTime > 0 ? 0.38 : 1);
          if (unit.summonTimer <= 0 && unit.summonsLeft > 0 && state.units.filter(function (entity) { return entity.side === 'enemy' && entity.hp > 0; }).length < 32) {
            this.spawnEnemy('skeleton', unit.x - 32);
            unit.summonTimer = 14;
            unit.summonsLeft -= 1;
          }
        }
      }

      const tower = state.tower;
      if (tower) {
        tower.hitFlash = Math.max(0, tower.hitFlash - dt);
        tower.attackTimer -= dt;
        if (tower.hp > 0 && tower.attackTimer <= 0) {
          const target = this.findTarget(tower, tower.range, false);
          if (target) {
            tower.attackTimer = 2.65;
            state.projectiles.push({ id: 'projectile-' + this.nextId++, kind: 'dark', sourceId: tower.id, side: 'enemy', x: tower.x, y: -105, targetId: target.id, targetX: target.x, targetY: target.y - 22, damage: 13 + this.level.id, speed: 360, splash: 0, life: 6, maxLife: 6 });
          }
        }
      }
      this.updateProjectiles(dt);
      state.units = state.units.filter(function (unit) { return unit.hp > 0; });
      state.effects.forEach(function (effect) { effect.life -= dt; effect.age += dt; });
      state.effects = state.effects.filter(function (effect) { return effect.life > 0; });
      if (hero.hp <= 0) this.finish('lost');
      else if (tower && tower.hp <= 0) this.finish('won');
      if (this.mode === 'survival' && state.phase === 'playing' && state.wave > 0 && !this.waveClearHandled && !this.spawnQueue.length && !state.units.some(unit => unit.side === 'enemy')) {
        this.waveClearHandled = true;
        if (state.wave % 3 === 0) {
          const choices = survivalBlessings.slice();
          for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
          }
          state.survivalChoices = choices.slice(0, 3).map(choice => choice.id);
          state.paused = true;
          this.emit('survivalChoice', { wave: state.wave, choices: state.survivalChoices });
        } else this.nextWaveAt = state.time + 3;
      }
    }

    update(dt, input) {
      if (this.state.phase !== 'playing' || this.state.paused || !Number.isFinite(dt) || dt <= 0) return;
      const move = clamp(Number(input && input.move) || 0, -1, 1);
      let remaining = Math.min(dt, 0.25);
      while (remaining > 0.000001 && this.state.phase === 'playing' && !this.state.paused) {
        const step = Math.min(remaining, 1 / 30);
        this.step(step, move);
        remaining -= step;
      }
    }
  }

  Pala.Engine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Pala;
})(typeof globalThis !== 'undefined' ? globalThis : this);
