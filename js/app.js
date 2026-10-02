(function () {
  'use strict';
  const { DATA, Engine, Renderer, Audio, Storage, upgradeCost, enemyRoster } = window.Pala;
  const $ = id => document.getElementById(id);
  const renderer = new Renderer($('game-canvas'));
  const sound = new Audio();
  let local;
  try { local = window.localStorage; } catch (_) { local = null; }
  const loaded = Storage.load(local);
  const save = loaded.data;
  let selectedLevel = save.unlocked;
  let engine = null;
  let mode = 'camp';
  let resultHandled = false;
  let previousTime = 0;
  let accumulator = 0;
  let uiElapsed = 0;
  let campTime = 0;
  let battleSpeed = 1;
  let toastTimer;
  let resumeAfterModal = false;
  const keys = new Set();
  const pointers = new Map();
  const buttonRefs = new Map();
  const chapterNumbers = ['一', '二', '三', '四', '五', '六'];
  const chapterRoman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const chapters = DATA.chapters.map((chapter, index) => ({
    label: `第${chapterNumbers[index]}章 / ${chapter.name}`,
    english: `CHAPTER ${chapterRoman[index]} · ${chapter.english}`
  }));
  const equipmentById = id => DATA.equipment.find(item => item.id === id);
  sound.setMuted(save.muted);

  function notify(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2800);
  }

  function persist() {
    const available = Storage.save(local, save);
    $('save-status').textContent = available ? '进度自动保存在当前浏览器' : '浏览器存储不可用，本次进度仅保留到关闭页面';
    $('coins').textContent = save.coins.toLocaleString('zh-CN');
  }

  function audioGesture() {
    sound.unlock();
    sound.startMusic();
  }

  function icon(canvas, kind) {
    if (window.Pala.drawIcon) window.Pala.drawIcon(canvas, kind);
    else renderer.drawIcon(canvas, kind);
  }

  function renderCampUI() {
    const level = DATA.levels[selectedLevel - 1];
    const chapter = chapters[Math.floor((selectedLevel - 1) / 4)];
    $('chapter-label').textContent = chapter.label;
    $('campaign-progress').innerHTML = `战役进度 <b>${String(save.completed.length).padStart(2, '0')}</b> / ${DATA.levels.length}`;
    $('survival-best').textContent = save.bestSurvival.wave || save.bestSurvival.kills ? `最佳纪录 · ${save.bestSurvival.wave} 波 · 击退 ${save.bestSurvival.kills} 名敌人` : '最佳纪录 · 尚未挑战';
    $('mission-number').textContent = String(selectedLevel).padStart(2, '0');
    $('mission-region').textContent = chapter.english;
    $('mission-name').textContent = level.name;
    $('mission-description').textContent = level.subtitle;
    $('mission-difficulty').innerHTML = `难度 <b>${level.difficulty}${level.boss ? ' · 首领' : ''}</b>`;
    $('mission-reward').textContent = `${save.completed.includes(selectedLevel) ? Math.floor(level.reward * 0.4) : level.reward} 金币`;
    $('mission-reward').parentElement.firstChild.textContent = save.completed.includes(selectedLevel) ? '重访奖励 ' : '首通奖励 ';
    $('mission-gear').textContent = `装备 ${equipmentById(save.equipped.staff).name} · ${equipmentById(save.equipped.ring).name}`;
    const roster = enemyRoster(selectedLevel);
    const enemyKinds = [...new Set(roster.concat(level.boss ? ['boss'] : []))];
    const bestTime = save.bestTimes[selectedLevel];
    $('mission-intel').innerHTML = `<div class="intel-heading"><b>战前情报</b><span>${level.waveCount} 波敌军 · 据点 ${level.towerHp} 生命${level.boss ? ' · 先击败首领解除护盾' : ''}</span></div><div class="intel-enemies">${enemyKinds.map(kind => `<span class="intel-enemy" title="${DATA.enemyIntel[kind].counter}"><canvas width="32" height="32" data-icon="${kind}" aria-hidden="true"></canvas>${DATA.enemies[kind].name}</span>`).join('')}</div><div class="intel-record"><span>${save.completed.includes(selectedLevel) ? `最佳评价 ${'★'.repeat(save.stars[selectedLevel] || 1)}${'☆'.repeat(3 - (save.stars[selectedLevel] || 1))} · 最佳用时 ${bestTime ? formatTime(bestTime) : '尚未记录'}` : '三星目标：胜利时帕拉生命不低于 60%'}</span><span>${enemyKinds.some(kind => DATA.enemies[kind].flying) ? '带上游侠或法师应对飞行敌人' : '前排承伤，远程输出；半血据点会召来援军'}</span></div>`;
    $('mission-intel').querySelectorAll('canvas').forEach(canvas => icon(canvas, canvas.dataset.icon));
    $('start-button').innerHTML = `${save.completed.includes(selectedLevel) ? '重访此地' : '开始远征'} <span>→</span>`;
    const stageButton = item => {
      const done = save.completed.includes(item.id);
      const current = selectedLevel === item.id;
      const locked = item.id > save.unlocked;
      return `<button class="level-node${done ? ' completed' : ''}${current ? ' current' : ''}${item.boss ? ' boss' : ''}" data-level="${item.id}" ${locked ? 'disabled' : ''} aria-label="第 ${item.id} 关 ${item.name}${locked ? '，尚未解锁' : done ? '，已通关' : ''}" aria-pressed="${current}"><span class="node-circle">${locked ? '·' : String(item.id).padStart(2, '0')}</span><span class="node-name">${item.name}</span><span class="node-stars">${done ? '★'.repeat(save.stars[item.id] || 1) : item.boss ? '首领' : ''}</span></button>`;
    };
    $('level-list').innerHTML = DATA.chapters.map((item, index) => `<div class="chapter-card${Math.floor((selectedLevel - 1) / 4) === index ? ' current-chapter' : ''}"><div class="chapter-card-heading"><span>CHAPTER ${chapterRoman[index]}</span><b>${item.name}</b></div><div class="chapter-stages">${DATA.levels.slice(index * 4, index * 4 + 4).map(stageButton).join('')}</div></div>`).join('');
    $('level-list').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      selectedLevel = Number(button.dataset.level);
      sound.play('click');
      renderCampUI();
    }));
    $('companion-list').innerHTML = DATA.units.map((unit, index) => {
      const locked = save.unlocked < unit.unlockLevel;
      const roles = ['VANGUARD', 'RANGER', 'GUARDIAN', 'MAGE', 'ARTILLERY', 'DEFENDER', 'HEALER', 'CHARGER'];
      return `<div class="companion-card${locked ? ' locked' : ''}"><canvas width="48" height="48" data-icon="${unit.id}" aria-hidden="true"></canvas><div><h3>${unit.name}</h3><p>${locked ? `抵达第 ${unit.unlockLevel} 关后加入队伍` : unit.description}</p></div><span class="companion-tag">${roles[index]}</span></div>`;
    }).join('');
    $('companion-list').querySelectorAll('canvas').forEach(canvas => icon(canvas, canvas.dataset.icon));
    $('coins').textContent = save.coins.toLocaleString('zh-CN');
  }

  function showCamp() {
    engine = null;
    mode = 'camp';
    sound.setScene('camp');
    sound.startMusic();
    keys.clear();
    pointers.clear();
    document.body.classList.remove('battle-mode');
    ['camp-intro', 'camp-scene-label', 'mission-panel', 'mission-intel', 'survival-section', 'campaign-section', 'companions-section'].forEach(id => { $(id).hidden = false; });
    ['battle-hud', 'battle-controls', 'battle-info', 'battle-tip', 'battle-overlay'].forEach(id => { $(id).hidden = true; });
    $('camp-button').disabled = false;
    $('footer-hint').innerHTML = '键盘 / 鼠标 / 触控 <span class="footer-separator">·</span> VERSION 2.4';
    renderCampUI();
  }

  function buildAbilities() {
    buttonRefs.clear();
    function fill(parentId, entries, isSpell) {
      $(parentId).innerHTML = entries.map((item, index) => `<button class="ability-button" data-ability="${item.id}" aria-label="${item.name}，${item.cost} ${isSpell ? '魔法' : '食物'}。${item.description}" title="${item.description}"><span class="ability-key">${isSpell ? item.key : index + 1}</span><canvas width="48" height="48" aria-hidden="true"></canvas><span class="ability-name">${item.name}</span><span class="ability-cost">${isSpell ? '✦' : '◆'} ${item.cost}</span><span class="ability-cooldown"></span><span class="ability-timer"></span></button>`).join('');
      $(parentId).querySelectorAll('button').forEach(button => {
        const id = button.dataset.ability;
        icon(button.querySelector('canvas'), id);
        buttonRefs.set(id, { button, cover: button.querySelector('.ability-cooldown'), timer: button.querySelector('.ability-timer') });
        button.addEventListener('click', () => useAbility(id, isSpell));
      });
    }
    fill('unit-buttons', DATA.units, false);
    fill('spell-buttons', DATA.spells, true);
  }

  function startBattle(levelNumber, battleMode = 'campaign') {
    audioGesture();
    if (battleMode !== 'survival') selectedLevel = Math.min(levelNumber, save.unlocked);
    renderer.reset();
    keys.clear();
    pointers.clear();
    resultHandled = false;
    battleSpeed = 1;
    accumulator = 0;
    engine = new Engine({ mode: battleMode, seed: battleMode === 'survival' ? Date.now() : undefined, level: battleMode === 'survival' ? 1 : selectedLevel, upgrades: save.upgrades, equipment: save.equipped, unlockedLevel: save.unlocked, onEvent: event => {
      if (['summon', 'cast', 'wave', 'win', 'lose'].includes(event.type)) sound.play(event.type);
      else if (event.type === 'hit' && event.side === 'ally') sound.play('hit');
      if (event.type === 'reinforcement') { sound.play('wave'); notify(`据点半血警报！${event.count} 名守军赶来增援。`); }
      if (event.type === 'wave' && event.boss) { sound.setScene('boss'); notify(battleMode === 'survival' ? `第 ${event.wave} 波首领来袭！` : '暗影领主出现了！保护帕拉，集中火力。'); }
      else if (event.type === 'wave' && battleMode === 'survival' && event.formationName) notify(`第 ${event.wave} 波 · ${event.formationName}：${event.formationDescription}`);
      if (event.type === 'kill' && event.kind === 'boss') sound.setScene(battleMode === 'survival' ? 'survival' : 'battle');
      if (event.type === 'survivalChoice') showSurvivalChoice();
    } });
    sound.setScene(battleMode === 'survival' ? 'survival' : 'battle');
    mode = 'battle';
    document.body.classList.add('battle-mode');
    ['camp-intro', 'camp-scene-label', 'mission-panel', 'mission-intel', 'survival-section', 'campaign-section', 'companions-section', 'battle-overlay'].forEach(id => { $(id).hidden = true; });
    ['battle-hud', 'battle-controls', 'battle-info', 'battle-tip'].forEach(id => { $(id).hidden = false; });
    $('battle-tip').textContent = battleMode === 'survival' ? '守住帕拉，清空敌军后进入下一波。所有伙伴均可召唤。' : '先按 1、2 召唤伙伴，再按 D 随队推进。光环会强化附近友军。';
    $('chapter-label').textContent = battleMode === 'survival' ? '无尽生存 / 暗影潮汐' : `${chapters[Math.floor((selectedLevel - 1) / 4)].label} · 第 ${String(selectedLevel).padStart(2, '0')} 关`;
    $('battle-mission').textContent = battleMode === 'survival' ? '暗影潮汐 / 击退敌军 · 挑战极限' : `${engine.state.level.name} / ${engine.state.level.boss ? '击败首领 · 摧毁据点' : '摧毁暗影据点'}`;
    $('camp-button').disabled = true;
    $('footer-hint').textContent = 'A / D 移动 · 1—8 召唤 · J K L 魔法 · F 战速 · Esc 暂停';
    buildAbilities();
    updateHUD();
    $('pause-button').focus({ preventScroll: true });
  }

  function useAbility(id, isSpell) {
    if (!engine || engine.state.phase !== 'playing' || engine.state.paused || $('modal').open) return;
    audioGesture();
    const success = isSpell ? engine.cast(id) : engine.summon(id);
    if (!success && isSpell && !engine.state.cooldowns[id]) {
      const spell = DATA.spells.find(item => item.id === id);
      if (engine.state.mana < spell.cost) notify('魔法正在恢复，请稍等。');
      else notify(id === 'heal' ? '附近伙伴生命充足，暂不需要治疗。' : '前方还没有可施法的目标，随队再靠近一些。');
    }
    updateHUD();
  }

  function updateHUD() {
    if (!engine) return;
    const state = engine.state;
    [['health', state.hero.hp, state.hero.maxHp], ['food', state.food, state.maxFood], ['mana', state.mana, state.maxMana]].forEach(([id, value, max]) => {
      $(`${id}-text`).textContent = `${Math.ceil(value)} / ${max}`;
      $(`${id}-fill`).style.width = `${Math.max(0, Math.min(100, value / max * 100))}%`;
    });
    const army = state.units.filter(unit => unit.side === 'ally' && unit.hp > 0).length;
    $('army-count').textContent = `${army} / ${state.maxUnits}`;
    const countdown = Number.isFinite(state.nextWaveIn) ? `下一波 ${Math.ceil(state.nextWaveIn)} 秒` : '';
    if (state.mode === 'survival') {
      const remaining = state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length + engine.spawnQueue.length;
      $('battle-wave').textContent = `第 ${Math.max(0, state.wave)} 波${state.formationName ? ' · ' + state.formationName : ''} · ${countdown || `剩余 ${remaining} 名敌军`} · ${formatTime(state.time)}`;
    } else $('battle-wave').textContent = `波次 ${Math.max(0, state.wave)} / ${state.waveCount} · ${state.wave < state.waveCount ? countdown : '末波已到'} · ${formatTime(state.time)}`;
    $('speed-button').textContent = `${battleSpeed}×`;
    $('speed-button').setAttribute('aria-pressed', String(battleSpeed === 2));
    $('speed-button').setAttribute('aria-label', `切换为${battleSpeed === 1 ? '双倍' : '正常'}战斗速度`);
    $('speed-button').disabled = state.phase !== 'playing';
    DATA.units.concat(DATA.spells).forEach(item => {
      const ref = buttonRefs.get(item.id);
      const cooldown = state.cooldowns[item.id] || 0;
      const isSpell = Boolean(item.key);
      const locked = !isSpell && state.mode !== 'survival' && item.unlockLevel > save.unlocked;
      ref.button.disabled = state.paused || state.phase !== 'playing' || locked || cooldown > 0 || (isSpell ? state.mana : state.food) < item.cost || (!isSpell && army >= state.maxUnits);
      ref.cover.style.height = `${Math.min(100, cooldown / item.cooldown * 100)}%`;
      ref.timer.textContent = locked ? `${item.unlockLevel}关` : cooldown > 0 ? cooldown.toFixed(1) : '';
    });
    const time = state.time;
    $('battle-tip').hidden = time > 25;
    if (time > 12 && time <= 25) $('battle-tip').textContent = state.mode === 'survival' ? '每三波可选一次祝福。J 雷击 · K 治疗 · L 冰霜，英雄阵亡即结束。' : 'J 圣光雷击 · K 治疗自己与伙伴 · L 冰霜减速。英雄阵亡则远征失败。';
  }

  function formatTime(time) {
    return `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;
  }

  function toggleSpeed() {
    if (!engine || engine.state.phase !== 'playing' || $('modal').open) return;
    battleSpeed = battleSpeed === 1 ? 2 : 1;
    sound.play('click');
    updateHUD();
    notify(`战斗速度 ${battleSpeed}× · F 可切换`);
  }

  function overlay(html) {
    $('battle-overlay').innerHTML = `<div class="result-card">${html}</div>`;
    $('battle-overlay').hidden = false;
  }

  function showSurvivalChoice() {
    if (!engine || !engine.state.survivalChoices.length) return;
    const choices = engine.state.survivalChoices.map(id => DATA.survivalBlessings.find(item => item.id === id));
    overlay(`<div class="eyebrow">WAVE ${engine.state.wave} CLEARED</div><h2>选择一项生存祝福</h2><p>祝福只在本次挑战生效。下一波暗影很快就会到来。</p><div class="blessing-choices">${choices.map(item => `<button data-blessing="${item.id}"><b>${item.name}</b><span>${item.description}</span></button>`).join('')}</div>`);
    $('battle-overlay').querySelectorAll('[data-blessing]').forEach(button => button.addEventListener('click', () => {
      if (!engine.chooseSurvivalBlessing(button.dataset.blessing)) return;
      $('battle-overlay').hidden = true;
      accumulator = 0;
      sound.play('click');
      updateHUD();
    }));
    updateHUD();
  }

  function pauseBattle() {
    if (engine?.state.survivalChoices.length) { showSurvivalChoice(); return; }
    if (!engine || engine.state.phase !== 'playing' || $('modal').open) return;
    if (engine.state.paused) { resumeBattle(); return; }
    engine.setPaused(true);
    keys.clear();
    pointers.clear();
    sound.stopMusic();
    overlay(`<div class="eyebrow">TAKE A BREATH, LITTLE HERO</div><h2>暂歇片刻</h2><p>伙伴们会在这里等你。<br>调整好呼吸，再一起向前。</p><div class="result-actions"><button class="primary-button" id="resume-battle">${engine.mode === 'survival' ? '继续挑战' : '继续远征'} →</button><button class="secondary-button" id="leave-battle">返回营地</button></div>`);
    $('resume-battle').addEventListener('click', resumeBattle);
    $('leave-battle').addEventListener('click', confirmLeave);
    updateHUD();
  }

  function resumeBattle() {
    if (!engine || engine.state.phase !== 'playing') return;
    if (engine.state.survivalChoices.length) { showSurvivalChoice(); return; }
    keys.clear();
    engine.setPaused(false);
    $('battle-overlay').hidden = true;
    accumulator = 0;
    audioGesture();
    updateHUD();
  }

  function confirmLeave() {
    if (!engine || engine.state.phase !== 'playing') { showCamp(); return; }
    const wasChoosing = engine.state.survivalChoices.length > 0;
    engine.setPaused(true);
    keys.clear();
    pointers.clear();
    overlay(`<div class="eyebrow">RETURN TO CAMP</div><h2>收队回营？</h2><p>${engine.mode === 'survival' ? '本次生存挑战将结束，不结算金币或最佳纪录。' : '本次战斗将结束，尚未获得的奖励不会结算。<br>已完成的关卡与营地升级会保留。'}</p><div class="result-actions"><button class="secondary-button" id="confirm-leave">返回营地</button><button class="primary-button" id="keep-fighting">继续战斗 →</button></div>`);
    $('confirm-leave').addEventListener('click', () => { showCamp(); audioGesture(); });
    $('keep-fighting').addEventListener('click', wasChoosing ? showSurvivalChoice : resumeBattle);
    updateHUD();
  }

  function finishBattle() {
    if (resultHandled) return;
    resultHandled = true;
    sound.stopMusic();
    const state = engine.state;
    if (state.mode === 'survival') {
      const cleared = Math.max(0, state.wave - (engine.waveClearHandled ? 0 : 1));
      const reward = Math.min(600, cleared * 20 + state.kills * 2);
      const oldBest = save.bestSurvival;
      const record = cleared > oldBest.wave || (cleared === oldBest.wave && state.kills > oldBest.kills);
      if (record) save.bestSurvival = { wave: cleared, kills: state.kills };
      save.coins += reward;
      persist();
      keys.clear();
      pointers.clear();
      $('battle-tip').hidden = true;
      overlay(`<div class="eyebrow">THE NIGHT WILL RETURN</div><h2>本次生存结束</h2><p>${record ? '新的最佳纪录！' : '微光仍在，整备后再挑战。'} 战役进度不受影响。</p><div class="result-stats"><span><b>${cleared}</b>守住波次</span><span><b>${state.kills}</b>击退敌人</span><span><b class="gold">+${reward}</b>获得金币</span></div><div class="result-actions"><button class="secondary-button" id="result-camp">返回营地</button><button class="primary-button" id="result-next">再次挑战 ↻</button></div>`);
      $('result-camp').addEventListener('click', showCamp);
      $('result-next').addEventListener('click', () => startBattle(selectedLevel, 'survival'));
      updateHUD();
      return;
    }
    const won = state.phase === 'won';
    const result = state.result;
    const firstWin = !save.completed.includes(selectedLevel);
    const stars = result.stars || 1;
    const reward = won ? (firstWin ? result.reward : Math.floor(result.reward * 0.4)) : 0;
    if (won) {
      save.coins += reward;
      if (firstWin) save.completed.push(selectedLevel);
      save.unlocked = Math.max(save.unlocked, Math.min(DATA.levels.length, selectedLevel + 1));
      save.stars[selectedLevel] = Math.max(save.stars[selectedLevel] || 0, stars);
      save.bestTimes[selectedLevel] = Math.min(save.bestTimes[selectedLevel] || Infinity, state.time);
      persist();
    }
    keys.clear();
    pointers.clear();
    $('battle-tip').hidden = true;
    const allDone = won && save.completed.length === DATA.levels.length;
    const newUnit = firstWin && won ? DATA.units.find(unit => unit.unlockLevel === selectedLevel + 1) : null;
    const message = allDone ? '长夜已经结束。谢谢你，守住了森林里的每一束微光。' : won ? newUnit ? `${newUnit.name}已加入营地，下一关可以召唤！` : '又一片土地重获安宁。伙伴们已经准备好新的旅程。' : '火种仍在，远征还会继续。试着补充前排、及时治疗，或回营地强化队伍。';
    overlay(`<div class="eyebrow">${won ? allDone ? 'THE FOREST REMEMBERS YOUR NAME' : 'ANOTHER LIGHT IN THE DARK' : 'EVERY HERO STARTS AGAIN'}</div><h2>${won ? allDone ? '黎明终将到来' : '微光，向前一步' : '暂别这片战场'}</h2>${won ? `<div class="result-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>` : ''}<p>${message}</p><div class="result-stats"><span><b>${formatTime(state.time)}</b>远征用时</span><span><b>${state.kills}</b>击退敌人</span><span><b class="gold">+${reward}</b>${firstWin ? '获得金币' : '重访奖励'}</span></div><div class="result-actions"><button class="secondary-button" id="result-camp">返回营地</button><button class="primary-button" id="result-next">${won ? selectedLevel < DATA.levels.length ? '下一关 →' : '重温终章 ↻' : '再次挑战 ↻'}</button></div>`);
    $('result-camp').addEventListener('click', () => { selectedLevel = save.unlocked; showCamp(); });
    $('result-next').addEventListener('click', () => startBattle(won ? Math.min(DATA.levels.length, selectedLevel + 1) : selectedLevel));
    updateHUD();
  }

  function openModal(html) {
    resumeAfterModal = Boolean(engine && engine.state.phase === 'playing' && !engine.state.paused);
    if (resumeAfterModal) engine.setPaused(true);
    keys.clear();
    pointers.clear();
    $('modal-content').innerHTML = html;
    if (!$('modal').open) $('modal').showModal();
  }

  function showWorkshop() {
    if (mode === 'battle' && engine?.state.phase === 'playing') return;
    audioGesture();
    openModal('<h2 id="modal-title">装备与强化</h2><p>帕拉可装备一根权杖和一枚戒指。购买后永久拥有，出发前可免费切换；强化同样永久生效。</p><div class="workshop-wallet"></div><h3 class="manual-subtitle">帕拉的装备</h3><div class="equipment-grid"></div><h3 class="manual-subtitle">营地强化</h3><div class="upgrade-grid"></div>');
    renderWorkshop();
  }

  function renderWorkshop() {
    $('modal-content').querySelector('.workshop-wallet').textContent = `◆ 营地金币 ${save.coins}`;
    const equipmentGrid = $('modal-content').querySelector('.equipment-grid');
    equipmentGrid.innerHTML = DATA.equipment.map(item => {
      const owned = save.ownedEquipment.includes(item.id);
      const equipped = save.equipped[item.slot] === item.id;
      const locked = save.unlocked < item.unlockLevel;
      const label = equipped ? '已装备' : owned ? '装备' : locked ? `第 ${item.unlockLevel} 关解锁` : `购买并装备 · ◆ ${item.cost}`;
      return `<article class="equipment-card${equipped ? ' equipped' : ''}"><canvas width="64" height="64" data-equipment-icon="${item.id}" aria-hidden="true"></canvas><div class="equipment-copy"><small>${item.slot === 'staff' ? '权杖 · 主动魔法' : '戒指 · 被动增益'}</small><h4>${item.name}</h4><p>${item.description}</p></div><button data-equip="${item.id}" ${equipped || locked || (!owned && save.coins < item.cost) ? 'disabled' : ''}>${label}</button></article>`;
    }).join('');
    equipmentGrid.querySelectorAll('canvas').forEach(canvas => window.Pala.drawEquipmentIcon(canvas, canvas.dataset.equipmentIcon));
    equipmentGrid.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      const item = equipmentById(button.dataset.equip);
      if (!item || save.unlocked < item.unlockLevel) return;
      const owned = save.ownedEquipment.includes(item.id);
      if (!owned) {
        if (save.coins < item.cost) return;
        save.coins -= item.cost;
        save.ownedEquipment.push(item.id);
      }
      save.equipped[item.slot] = item.id;
      sound.play('cast');
      persist();
      renderWorkshop();
      renderCampUI();
      notify(`${item.name}${owned ? '已装备' : '已购入并装备'}`);
    }));
    const grid = $('modal-content').querySelector('.upgrade-grid');
    grid.innerHTML = DATA.upgrades.map(item => {
      const current = save.upgrades[item.id];
      const cost = upgradeCost(item.id, current);
      const maxed = current >= item.maxLevel;
      return `<div class="upgrade-card"><h3>${item.name} <small class="gold">${current}/${item.maxLevel}</small></h3><p>${item.description}</p><div class="upgrade-level">${Array.from({ length: item.maxLevel }, (_, i) => `<i class="${i < current ? 'filled' : ''}"></i>`).join('')}</div><button data-upgrade="${item.id}" ${maxed || save.coins < cost ? 'disabled' : ''}>${maxed ? '已达到最高等级' : `强化 · ◆ ${cost}`}</button></div>`;
    }).join('');
    grid.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      const item = DATA.upgrades.find(upgrade => upgrade.id === button.dataset.upgrade);
      const current = save.upgrades[item.id];
      const cost = upgradeCost(item.id, current);
      if (current >= item.maxLevel || save.coins < cost) return;
      save.coins -= cost;
      save.upgrades[item.id]++;
      sound.play('cast');
      persist();
      renderWorkshop();
      notify(`${item.name}已强化至 ${current + 1} 级`);
    }));
  }

  function showCodex() {
    audioGesture();
    openModal('<h2 id="modal-title">远征图鉴</h2><p>了解伙伴与敌军的基础属性，选择适合当前战线的阵容。高关卡的敌人会变得更强。</p><div class="codex-tabs" role="tablist" aria-label="图鉴类别"><button type="button" role="tab" data-codex-tab="units" aria-controls="codex-grid">兵种图鉴</button><button type="button" role="tab" data-codex-tab="enemies" aria-controls="codex-grid">怪物图鉴</button></div><div id="codex-grid" class="codex-grid" role="tabpanel"></div><p class="codex-note">敌方据点血量首次降至一半时会召来守军。首领关需先击败领主才能攻击据点。</p>');
    $('modal-content').querySelectorAll('[data-codex-tab]').forEach(button => button.addEventListener('click', () => renderCodex(button.dataset.codexTab)));
    renderCodex('units');
  }

  function renderCodex(tab) {
    $('modal-content').querySelectorAll('[data-codex-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.codexTab === tab)));
    const grid = $('codex-grid');
    if (tab === 'units') {
      grid.innerHTML = DATA.units.map(unit => {
        const role = unit.healer ? '治疗' : unit.ranged ? '远程' : '近战';
        const action = unit.healer ? `治疗 ${unit.healing}` : `攻击 ${unit.damage}`;
        return `<article class="codex-card"><canvas width="64" height="64" data-icon="${unit.id}" aria-hidden="true"></canvas><div><small>第 ${unit.unlockLevel} 关解锁 · ${role}${unit.canHitAir ? ' · 可对空' : ''}</small><h3>${unit.name}</h3><p>${unit.description}</p><div class="codex-stats"><span>生命 <b>${unit.hp}</b></span><span>${action}</span><span>食物 <b>${unit.cost}</b></span><span>冷却 <b>${unit.cooldown}s</b></span></div></div></article>`;
      }).join('');
    } else {
      grid.innerHTML = Object.entries(DATA.enemies).map(([kind, enemy]) => {
        const intel = DATA.enemyIntel[kind];
        return `<article class="codex-card"><canvas width="64" height="64" data-icon="${kind}" aria-hidden="true"></canvas><div><small>第 ${intel.firstLevel} 关起 · ${intel.trait}</small><h3>${enemy.name}</h3><p>${intel.counter}</p><div class="codex-stats"><span>基础生命 <b>${enemy.hp}</b></span><span>基础攻击 <b>${enemy.damage}</b></span><span>速度 <b>${enemy.speed}</b></span></div></div></article>`;
      }).join('');
    }
    grid.querySelectorAll('canvas').forEach(canvas => icon(canvas, canvas.dataset.icon));
  }

  function showManual() {
    audioGesture();
    openModal(`<h2 id="modal-title">冒险手册</h2>
      <p>带领动物伙伴夺回六片失落的土地。前排承伤、后排输出；让帕拉靠近队伍，光环便能提升伙伴的攻防。</p>
      <div class="manual-row"><span>A / D · ← / →</span><span>左右移动帕拉，或按住战斗面板上的方向按钮。</span></div>
      <div class="manual-row"><span>数字键 1—8</span><span>召唤八种伙伴。战役中逐步解锁；生存模式中全部可用。</span></div>
      <div class="manual-row"><span>J · 圣光雷击</span><span>打击敌群，也可攻击据点。</span></div>
      <div class="manual-row"><span>K · 生命祷言</span><span>治疗帕拉和附近受伤的伙伴。</span></div>
      <div class="manual-row"><span>L · 寒霜领域</span><span>伤害敌群，并降低其移动速度。</span></div>
      <div class="manual-row"><span>Esc / 空格</span><span>暂停或继续。切换窗口时自动暂停。</span></div>
      <div class="manual-row"><span>F · 战斗速度</span><span>切换 1× / 2×。出兵、移动和敌军同速变化；用时按游戏内时间记录，每次出发恢复 1×。</span></div>
      <h3 class="manual-subtitle">组合你的队伍</h3>
      <p>松果投手的爆裂攻击适合清理群怪；荆刺守卫能反弹近战伤害；月羽医师会治疗伤员；破晓野猪可冲散敌阵。飞行敌人需要游侠、法师或投手处理。后期的祭司会为敌军治疗，裂火虫倒下时会引发爆炸。</p>
      <p>“装备与强化”可购买并切换帕拉的权杖与戒指；远征图鉴记录兵种和怪物的基础属性与应对方法。敌方据点首次降到半血会召集守军增援。</p>
      <h3 class="manual-subtitle">无尽生存</h3>
      <p>从营地进入，逐波清除敌军；疾袭、重甲与秘术编队轮换，每三波从三项随机祝福中选一项，每五波出现首领。第二波起敌军根据帕拉的站位从前方进场，留意波次提示。祝福只在本次挑战生效，当前装备与营地强化会带入战斗。帕拉阵亡后按守住的波次与击退敌人结算金币，并保存最佳纪录；战役进度不会改变。</p>
      <p class="manual-note">英雄阵亡即失败。首领关必须先击败暗影领主，才可击破带护盾的据点。胜利解锁下一关并获得金币；营地升级和已购买装备永久保留。重访关卡可获得 40% 金币。星级取决于获胜时帕拉的剩余生命。</p>
      <p>进度保存在当前浏览器。切换浏览器、访问地址或清理网站数据可能影响存档。</p>`);
  }

  function updateSoundButton() {
    $('sound-button').textContent = save.muted ? '♪̸' : '♫';
    $('sound-button').setAttribute('aria-label', save.muted ? '开启声音' : '关闭声音');
    $('sound-button').title = save.muted ? '开启声音' : '关闭声音';
    $('sound-button').style.opacity = save.muted ? '0.5' : '1';
  }

  $('start-button').addEventListener('click', () => startBattle(selectedLevel));
  $('survival-start').addEventListener('click', () => startBattle(selectedLevel, 'survival'));
  $('camp-button').addEventListener('click', showWorkshop);
  $('upgrades-link').addEventListener('click', showWorkshop);
  $('codex-button').addEventListener('click', showCodex);
  $('help-button').addEventListener('click', showManual);
  $('map-button').addEventListener('click', () => { if (mode === 'battle') confirmLeave(); else renderCampUI(); });
  $('brand-home').addEventListener('click', event => { event.preventDefault(); if (mode === 'battle') confirmLeave(); });
  $('pause-button').addEventListener('click', pauseBattle);
  $('speed-button').addEventListener('click', toggleSpeed);
  $('close-modal').addEventListener('click', () => $('modal').close());
  $('modal').addEventListener('close', () => {
    if (resumeAfterModal && engine?.state.phase === 'playing') resumeBattle();
    resumeAfterModal = false;
  });
  $('modal').addEventListener('click', event => { if (event.target === $('modal')) { const rect = $('modal').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('modal').close(); } });
  $('sound-button').addEventListener('click', () => {
    save.muted = !save.muted;
    sound.setMuted(save.muted);
    audioGesture();
    updateSoundButton();
    persist();
  });
  $('fullscreen-button').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else notify('当前浏览器不支持全屏，可使用浏览器的全屏菜单。');
    } catch (_) { notify('当前浏览器未允许全屏，可尝试按 F11。'); }
  });
  document.addEventListener('keydown', event => {
    if ($('modal').open || mode !== 'battle' || !engine) return;
    const battleActive = engine.state.phase === 'playing';
    if (battleActive && ['ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(event.code)) event.preventDefault();
    if (battleActive && ['Escape', 'Space'].includes(event.code)) { if (!event.repeat) pauseBattle(); return; }
    if (battleActive && event.code === 'KeyF' && !event.ctrlKey && !event.altKey && !event.metaKey) { event.preventDefault(); if (!event.repeat) toggleSpeed(); return; }
    if (!battleActive || engine.state.paused) return;
    keys.add(event.code);
    if (event.repeat) return;
    const number = /^Digit([1-8])$/.exec(event.code) || /^Numpad([1-8])$/.exec(event.code);
    if (number) useAbility(DATA.units[Number(number[1]) - 1].id, false);
    const spell = { KeyJ: 'bolt', KeyK: 'heal', KeyL: 'frost' }[event.code];
    if (spell) useAbility(spell, true);
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  ['left', 'right'].forEach(direction => {
    const button = $(`move-${direction}`);
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (!engine || engine.state.paused || engine.state.phase !== 'playing') return;
      audioGesture();
      pointers.set(event.pointerId, direction === 'left' ? -1 : 1);
      button.setPointerCapture(event.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, event => pointers.delete(event.pointerId)));
  });
  function backgroundPause() {
    keys.clear();
    pointers.clear();
    if (engine && engine.state.phase === 'playing' && !engine.state.paused && !$('modal').open) pauseBattle();
  }
  window.addEventListener('blur', backgroundPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) backgroundPause(); });

  function frame(timestamp) {
    const dt = Math.min(0.05, Math.max(0, (timestamp - previousTime) / 1000 || 0));
    previousTime = timestamp;
    campTime += dt;
    if (mode === 'camp') renderer.renderCamp(campTime, DATA.levels[selectedLevel - 1].biome, save.equipped);
    else if (engine) {
      if (!engine.state.paused && engine.state.phase === 'playing') {
        const left = keys.has('KeyA') || keys.has('ArrowLeft') || [...pointers.values()].includes(-1);
        const right = keys.has('KeyD') || keys.has('ArrowRight') || [...pointers.values()].includes(1);
        accumulator += dt * battleSpeed;
        while (accumulator >= 1 / 60) { engine.update(1 / 60, { move: Number(right) - Number(left) }); accumulator -= 1 / 60; }
      }
      renderer.render(engine.state, dt);
      uiElapsed += dt;
      if (uiElapsed >= 0.1) { updateHUD(); uiElapsed = 0; }
      if (engine.state.phase !== 'playing') finishBattle();
    }
    requestAnimationFrame(frame);
  }

  icon($('brand-icon'), 'hero');
  updateSoundButton();
  showCamp();
  if (!loaded.available) $('save-status').textContent = '未能读取存档，本次从新的营地开始';
  requestAnimationFrame(frame);
})();
