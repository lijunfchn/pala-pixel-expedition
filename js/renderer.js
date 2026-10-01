/* Original pixel artwork and Canvas renderer. No external images or fonts. */
(function () {
  'use strict';
  const Pala = globalThis.Pala = globalThis.Pala || {};
  const WIDTH = 560, HEIGHT = 240, GROUND = 181, SCALE = 0.5;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const noise = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const palettes = {
    forest: { sky: '#b7d1bc', haze: '#d5dcc1', light: '#f2dfab', distant: '#819f91', far: '#537e74', mid: '#335f55', dark: '#203f38', leaf: '#52794b', leafLight: '#73935c', grass: '#728455', grassTop: '#94a66b', earth: '#71674b', path: '#b2a27a', edge: '#d1c08c' },
    ruins: { sky: '#c5ccb0', haze: '#e1d7b3', light: '#fae8ad', distant: '#99a69a', far: '#6c867a', mid: '#48645a', dark: '#2b413b', leaf: '#707f46', leafLight: '#97a260', grass: '#8b8b56', grassTop: '#b1ad70', earth: '#7c6b50', path: '#b3a17c', edge: '#d1bd90' },
    night: { sky: '#203440', haze: '#354f56', light: '#b9d6be', distant: '#345663', far: '#2b4b53', mid: '#244843', dark: '#152e30', leaf: '#355c52', leafLight: '#537c65', grass: '#47634d', grassTop: '#648067', earth: '#3a4540', path: '#697562', edge: '#899479' },
    frost: { sky: '#9ebbc3', haze: '#c8d8d3', light: '#f5ede0', distant: '#8daeb8', far: '#628d9a', mid: '#466d78', dark: '#284a58', leaf: '#7ca6a6', leafLight: '#b7d4c9', grass: '#c0d6ce', grassTop: '#e0eee2', earth: '#657f83', path: '#d2ded5', edge: '#f2f5df' },
    ember: { sky: '#5c484e', haze: '#9f695e', light: '#f6bb72', distant: '#896269', far: '#66545b', mid: '#55464b', dark: '#352d36', leaf: '#7c5343', leafLight: '#b2754d', grass: '#6b5549', grassTop: '#a76d4b', earth: '#493b39', path: '#776154', edge: '#d3915b' },
    dawn: { sky: '#c4c5c4', haze: '#f0ddc8', light: '#ffe2a4', distant: '#a3a9aa', far: '#798f91', mid: '#5b7b79', dark: '#355a57', leaf: '#7b9b7d', leafLight: '#b1c49d', grass: '#a9b592', grassTop: '#d0d9ab', earth: '#8d8b79', path: '#c9bf9f', edge: '#efe0b9' }
  };
  const colors = {
    '.': null, o: '#243b39', k: '#253333', w: '#eee8d1', W: '#fff4d5', g: '#c4c9b6', d: '#81958c',
    b: '#396b8b', B: '#619ca7', n: '#23475c', y: '#e1b95e', Y: '#f6d98a', r: '#92634b', R: '#c18a66',
    p: '#dba498', t: '#ae8461', T: '#d4ac77', f: '#cf8652', F: '#e9b269', v: '#76648d', V: '#ae8faf',
    e: '#d77169', E: '#ffb48d', s: '#87ae76', S: '#b4d895', q: '#536d58', Q: '#7e9684',
    a: '#aa554e', A: '#e39b60', h: '#536c78', H: '#83a9b1', c: '#426d69', C: '#93c9bd',
    i: '#453a47', I: '#705c70', m: '#c9a778', M: '#f0d4a0', u: '#9d8e76', U: '#d7cbb0'
  };
  const sprites = {
    hero: [
      '.........yy.........','........yYYy........','.......yYYYYy.......','......oyyyyyyo......',
      '.....owwwwwwwwo.....','....owWWWWWWWwo.....','...obWWWWWWWWWbo....','...obWwWWWWwWWbo....',
      '...onWkWWWWkWnbo....','...onWkWWWWkWnbo....','....owWWwwWWwo......','.....owWppWwo.......',
      '......owwwwo........','.....owwWwwo........','...bboywwywggbb.....','..bbnoyYYYYygdbb....',
      '..bbnogyWWygddbb....','.bbnboogwgggoobbb...','.bnnboggWWWggoob....','.bnnboogYYYYgoob....',
      '.bnnboogwgggggob....','..nbboowgggggoob....','..nbbooggggggoob....','...bbooggggggob.....',
      '....ooowddwwoo......','....owwoddooww......','....owwo..owwo.......','....oggo..oggo.......',
      '...owwwo..owwwo......','...ooooo..ooooo......'
    ],
    mouse: [
      '..oppo....oppo...','..pwwo....owwp...','...owwoooowwo....','....ogwwwwgo.....',
      '....owkwkwwo.....','.....wwpwwwo.....','.....ogwgoo......','....oryyrro......',
      '....oryyyroo.....','...ogryrrrgoo....','...ogrryrrogo....','....oryyyro......',
      '....orrrrro......','.....oggoo.......','.....oggoo.......','....ooo.ooo......'
    ],
    rabbit: [
      '.....oo..oo......','....owpoowpo.....','....owpoowpo.....','....owpoowpo.....',
      '....owwoowwo.....','....owwwwwwo.....','....owkwkwwo.....','.....wwpwwwo.....',
      '.....owwwoo......','....oqsssqoo.....','....osSSsso......','...oqssyssoo.....',
      '...oqssysogo.....','....oqssso.......','....oqssso.......','.....oggo........',
      '.....oggo........','....ooooooo......'
    ],
    bear: [
      '....otto....otto....','...otTTto..otTTto...','....otTTTooTTTto....','...otTTTTTTTTTTto...',
      '...otTkTTTTkTTTto...','...otTTWWWWTTTTto...','....otTWkkWTTTto....','....ootTTTTTtoo.....',
      '...oodggyyggddoo....','..oddgggYYggggddo...','.oddggggyygggggddo..','.odgggggyyggggggdo..',
      '.odgggggyyggggggdo..','..odgggggggggggdo...','...ogggggggggggo....','...oyyyyyyyyyyyo....',
      '...oddddoodddddo....','....odddooddddo.....','....otTTooTTTto.....','...ootTTooTTTtoo....',
      '...ooooo..oooooo....'
    ],
    fox: [
      '....oo.....oo....','....oFo...oFo....','....oFfo.oFfo....','.....oFFFFFo.....',
      '.....ofFkfFo.....','.....ofWWWfo.....','......owpwo......','......owwo.......',
      '....ovVyyVvo.....','...ovVVyyVVvo....','...ovVVyyVVvo....','...ovVyyyyVvo....',
      '....ovVVVVvo.....','....ovVVVVvo.....','....ovVvvVvo.....','....ovv..vvo.....',
      '....off..ffo.....','....ooo..ooo.....'
    ],
    skeleton: [
      '.....ooooo.......','....ogwwwwwo.....','....owwwwwwo.....','....owkkwkwo.....',
      '....owkkwkwo.....','.....owkwoo......','.....owwwwo......','......oggo.......',
      '....oogwgoo......','...ogwwwwggo.....','...ogogwgoog.....','...ooogwgooo.....',
      '.....ogwgo.......','.....ogwgo.......','.....owwwo.......','.....og.go.......',
      '.....og.go.......','....ogg.ggo......','....ooo.ooo......'
    ],
    slime: [
      '......sssss......','....ssSSSSSss....','...sSSSSSSSSSs...','..sSSSSSSSSSSSs..',
      '..sSSkSSSkSSSSs..','.sSSSkSSSkSSSSSs.','.sSSSSSSSSSSSSSs.','.sSSSSsssSSSSSSs.',
      '.sSSSSSSSSSSSSSs.','..sSSSSSSSSSSSs..','...qqqqqqqqqqq...'
    ],
    bat: [
      '.o..............o.','.vo....oo......ov.','.vVo..ovvo....oVv.', '.vvVoovVVvoooVVvv.',
      '..vVVVveevVVVVVv..','...vvvVVVVVvvvv...','....oooVVVVooo....','......ovvvo.......',
      '.......ooo........'
    ],
    brute: [
      '....o.........o.....','...owoo.....oowo....','...owwoolloowwwo....','....oolllllloo......',
      '....oqSSSSSSqo......','...oqSSSSSSSSqo.....','...oqSeSSSeSSqo.....','...oqSSSSSSSSqo.....',
      '....oSWWWWWWSo......','....oqSSSSSSqo......','...ootrrrrrtoo......','..oqSSqrrrqSSqo.....',
      '.oqSSSqrrrqSSSqo....','.oqSSSqrrrqSSSqo....','..oqSSqrrrqSSqo.....','...ooorryrrooo......',
      '....orrrrrro........','....oqSooSqo........','....oqSooSqo........','...oqSSooSSqo.......',
      '...oooo..oooo.......'
    ],
    necromancer: [
      '.......oo........','......ovvo.......','.....ovVVvo......','....ovVVVVvo.....',
      '....ovkkkkvo.....','....ovkeekvo.....','.....vkkkkv......','.....ovyyvo......',
      '....ovVyyVvo.....','...ovVVyyVVvo....','..ovVVVyyVVVvo...','..ovVVVyyVVVvo...',
      '...ovVVyyVVvo....','....ovVyyVvo.....','....ovVyyVvo.....','...ovVVyyVVvo....',
      '..ovVVVyyVVVvo...','..oooooooooooo...'
    ],
    squirrel: [
      '.oorRo...ootto...ootto','orRRRRo.otTTTto.otTTTto','orRRRRRooTTTTTooTTTTto','orRRRRRRotTTTTTTTTTto.',
      '.orRRRRRotTkTTkTTto..','..orRRRRotTTppTTTto..','...orRRRRotTTTTTto...','...orRRRRotTTtto.....',
      '....orRRRyyRro.......','....orRRRyyRRro......','.....orRRyyRRro......','.....orRrYYrRro......',
      '......orRRRRro.......','......orRRRRro.......','......orRooRro.......','......ott..tto.......',
      '......ooo..ooo.......'
    ],
    hedgehog: [
      '...ommommommommo....','..ommmommmommmmo....','.ommommommommommo...','..ommmommommommmo...',
      '..oqQQQQQQQQQQqo....','..oqQqQQQQQQqQQqo...','..oqQqQkQQQkQQqo...','...oqQQQppQQQqo.....',
      '....oqQQQQQQqo......','...ohhHHyyHHhho.....','..ohhHHHyyHHHhho....','..ohHHHHyyHHHHho....',
      '..ohHHHHyyHHHHho....','...ohHHHHHHHho......','....ohHHHHHho.......','....ohhHHHhho.......',
      '....omm...mmo.......','....ooo...ooo.......'
    ],
    owl: [
      '....owwwwwwwwo......','...owwwwwwwwwwo.....','..owwWwwWWwwwWwo....','..owWwWWwwWWwWwo....',
      '..owWkWWwwWWkWwo....','..owWkWwYYwWkWwo....','...owWWwppwWWwo.....','....owwwwwwwwo......',
      '...ohHcCCCCcHhho....','..ohHccCCCCccHhho...','..ohHcccYYcccHhho...','...ohHccYYccHhho....',
      '....ohHcCCcHhho.....','.....ohHccHhho......','......ohHhHho.......','......ohHhHho.......',
      '......ommommo.......','......ooo.ooo.......'
    ],
    boar: [
      '......ooorRrRro........','...oorRRRRRRRRRrro.....','..orRRRRRRRRRRRRRRro....','..orRRRrrRRRRRRRRRRro...',
      '.orRRRRRRRRRRRRkRRRRro..','.orRRRRRRRRRRRRRRRRRro..','..orRRRRRRRRRRppWWRro..','...orRRRRRRRRRppWWRro..',
      '....orRRRyyyyRRRRRRro...','....ohHHHyyyyHHHHHhho...','.....ohHHHyyHHHHHho....','......ohHHHHHHHHHho.....',
      '......ohHHo..ohHHo......','......orRRo..orRRo......','......orRRo..orRRo......','......ooooo..ooooo......'
    ],
    archer: [
      '.....oiiiiio........','....oiUUUUUio.......','....oUwwwwwUo.......','....owkwkwwo........',
      '....owwwwwwo........','.....owwwwo.........','....ovVVyVVvo.......','...ovVVVyVVVvo......',
      '...ovVVVyVVVvo......','....ovVyyyVvo.......','.....ovVVVvo........','.....ovVVVvo........',
      '.....oww.wwo........','.....oww.wwo........','.....ooo.ooo........'
    ],
    wraith: [
      '......oHHHHo........','.....oHCCCCCHo......','....oHCCCCCCCHo.....','....oHCkCCkCCHo.....',
      '....oHCCeeCCCHo.....','.....oHCCCCCHo......','....oHCCCCCCCHo.....','...oHHCCCCCCCHHo....',
      '..oHHCCCCCCCCCHHo...','..oHCCCCCCCCCCCHo...','...oHCCCCCCCCCHo....','....oHCCCCCCCHo.....',
      '.....oHCCCCCHo......','......oHCCCHo.......','.......oHCHo........','........oHo.........'
    ],
    hound: [
      '....oiio......oiio....','...oiIIIo...oiIIIIo...','..oiIIIIIIooiIIIIIIo..','..oiIIIIIIIIIIIIIIIo...','..oiIIIIIIIIIIeIIIIIo..',
      '.oiIIIIIIIIIIIIIIIIIIIo.','.oiIIIIIIIIIIIIIIIIWWo.','..oiIIIIIIIIIIIIIIIWWo.','...oiIIyyyyIIIIIIIIIIo..','....oiIyyyyIIIIIIIoo...',
      '.....oiIIIIIIIIIIIo.....','.....oiIIo...oiIIIo.....','.....oiIIo...oiIIIo.....','.....oiIIo...oiIIIo.....','.....ooooo...ooooo.....'
    ],
    sentinel: [
      '....ohhhhhhhhhho.....','...ohHHHHHHHHHho....','..ohHHHHHHHHHHHho...','..ohHkHHHHHkHHHho...',
      '..ohHHHHyyHHHHHho...','...ohHHHyyHHHho.....','..ohhhHHyyHHhhho....','.ohHHHHHyyHHHHHho...','.ohHHHHHyyHHHHHho...',
      '.ohHHHHHyyHHHHHho...','.ohHHHHHyyHHHHHho...','..ohHHHHHHHHHHho....','...ohHHHHHHHhho.....','...ohHHooHHHhho.....',
      '...ohHHo.oHHHho.....','...ohHHo.oHHHho.....','...oooo...oooo......'
    ],
    shaman: [
      '......oiiiio........','.....oiIIIIio.......','....oiIIIIIIio......','....oiIeeIeIIio.....','....oiIIIIIIio......',
      '.....oiIIIIio.......','....oiiiyyiiio......','...oiIIyyyyIIio.....','..oiIIIIyyIIIIio....','..oiIIIIyyIIIIio....',
      '..oiIIIIyyIIIIio....','...oiIIIyyIIIio.....','....oiIIyyIIio......','....oiIIyyIIio......','...oiIIIyyIIIio.....',
      '..oiIIIIyyIIIIio....','..ooooooooooooo.....'
    ],
    bomber: [
      '.......oAAAo........','.....oAAAAAAAo......','....oAAAEAAAAAo.....','...oAAAAAEEAAAAo....','...oAAeAAAAeAAAo....',
      '...oAAeAAAAeAAAo....','...oAAAAEEAAAAAo....','....oAAAAAAAAAo.....','.....oAAAAAAAo......','......oAAAAAo.......',
      '......ommmmo........','.....omm..mmo.......','.....ooo..ooo.......'
    ]
  };
  // The boss uses its own contrasting metal and ember palette over the brute silhouette.
  sprites.boss = sprites.brute.map(row => row.replaceAll('S', 'v').replaceAll('q', 'n').replaceAll('r', 'd').replaceAll('t', 'y'));
  colors.l = '#435347';
  const spriteCache = new Map();
  function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function polygon(ctx, points, color) {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(Math.round(p[0]), Math.round(p[1])) : ctx.moveTo(Math.round(p[0]), Math.round(p[1])));
    ctx.closePath(); ctx.fill();
  }
  function disk(ctx, x, y, radius, color) {
    const r = Math.max(1, Math.round(radius));
    const bands = Math.max(1, Math.ceil(r / 2));
    for (let i = -bands; i <= bands; i++) {
      const dy = i * 2, half = Math.sqrt(Math.max(0, r * r - dy * dy));
      if (half > 0) rect(ctx, x - half, y + dy, half * 2, 2, color);
    }
  }
  function sprite(ctx, kind, x, y, facing, scale, tint) {
    const matrix = sprites[kind] || sprites.skeleton;
    const width = Math.max(...matrix.map(row => row.length));
    const key = kind + (tint || '');
    if(!spriteCache.has(key)) {
      const texture=document.createElement('canvas');texture.width=width;texture.height=matrix.length;
      const painter=texture.getContext('2d');
      matrix.forEach((row,yy)=>{
        for(let xx=0;xx<row.length;xx++) {
          const color=colors[row[xx]];
          if(color)rect(painter,xx,yy,1,1,tint||color);
        }
      });
      spriteCache.set(key,texture);
    }
    const drawWidth=Math.round(width*scale),drawHeight=Math.round(matrix.length*scale);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(facing<0?-1:1,1);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(spriteCache.get(key),-Math.round(drawWidth/2),-drawHeight,drawWidth,drawHeight);
    ctx.restore();
    return { width: width * scale, height: matrix.length * scale };
  }
  function pine(ctx, x, y, size, color, highlight) {
    rect(ctx, x - size * .04, y - size * .67, size * .08, size * .68, color);
    for (let layer = 0; layer < 4; layer++) {
      const top = y - size + layer * size * .17, width = size * (.23 + layer * .11);
      polygon(ctx, [[x, top], [x - width * .37, top + size * .19], [x - width * .23, top + size * .19], [x - width * .52, top + size * .36], [x + width * .52, top + size * .36], [x + width * .25, top + size * .18], [x + width * .37, top + size * .18]], color);
      if (highlight) polygon(ctx, [[x, top + 2], [x - width * .3, top + size * .19], [x - width * .2, top + size * .19], [x - width * .42, top + size * .30], [x - 1, top + size * .28]], highlight);
    }
  }
  function foliage(ctx, x, y, radius, shadow, light, seed) {
    const points = [[-.7,0],[-.9,-.2],[-.82,-.57],[-.45,-.65],[-.36,-.96],[.12,-1.05],[.36,-.88],[.72,-.73],[.85,-.33],[.69,-.05],[.26,.15],[-.2,.12]];
    polygon(ctx, points.map(p => [x + p[0] * radius, y + p[1] * radius]), shadow);
    polygon(ctx, [[x-radius*.77,y-radius*.37],[x-radius*.58,y-radius*.67],[x-radius*.3,y-radius*.62],[x-radius*.19,y-radius*.9],[x+radius*.14,y-radius*.9],[x+radius*.23,y-radius*.7],[x+radius*.61,y-radius*.56],[x+radius*.45,y-radius*.4],[x+radius*.12,y-radius*.44],[x-radius*.08,y-radius*.2],[x-radius*.4,y-radius*.22]], light);
    for(let i = 0; i < 9; i++) {
      const dx = (noise(seed + i) - .5) * radius * 1.25, dy = -noise(seed + i + 12) * radius * .73;
      rect(ctx, x + dx, y + dy, 3 + noise(i + seed + 8) * 5, 2, i % 3 ? light : shadow);
    }
  }
  function tree(ctx, x, ground, height, p, seed, front) {
    const w = height * .15;
    polygon(ctx, [[x-w*.45,ground],[x-w*.33,ground-height*.8],[x+w*.09,ground-height*.85],[x+w*.4,ground-4],[x+w*.8,ground],[x-w*.8,ground]], front ? '#293e31' : '#48513a');
    rect(ctx, x - w * .12, ground-height*.76, w*.2, height*.73, front ? '#3e4b35' : '#66704b');
    polygon(ctx, [[x,ground-height*.39],[x-height*.26,ground-height*.62],[x-height*.25,ground-height*.68],[x+3,ground-height*.51]], '#3c5038');
    polygon(ctx, [[x+2,ground-height*.5],[x+height*.25,ground-height*.73],[x+height*.27,ground-height*.68],[x+3,ground-height*.38]], '#3c5038');
    const shadow = front ? p.dark : p.mid, light = front ? p.mid : p.leaf;
    foliage(ctx,x-height*.24,ground-height*.65,height*.31,shadow,light,seed);
    foliage(ctx,x+height*.25,ground-height*.66,height*.32,shadow,light,seed+2);
    foliage(ctx,x-height*.04,ground-height*.8,height*.39,shadow,light,seed+4);
    if(!front) foliage(ctx,x-height*.1,ground-height*.91,height*.21,p.leaf,p.leafLight,seed+6);
    for(let i=0;i<4;i++) rect(ctx,x-4+noise(seed+i)*8,ground-height*.55+noise(seed+i+8)*height*.4,2,4,front?'#22362e':'#3e5035');
  }
  function cloud(ctx,x,y,width,color) {
    rect(ctx,x,y,width,4,color); rect(ctx,x+width*.12,y-3,width*.7,4,color);
    rect(ctx,x+width*.26,y-6,width*.4,4,color); rect(ctx,x+width*.46,y-9,width*.17,4,color);
  }
  function gravestone(ctx,x,y,p,seed) {
    rect(ctx,x-5,y-15,10,15,'#566961'); rect(ctx,x-3,y-18,6,3,'#7e8b78');
    rect(ctx,x-4,y-14,7,13,'#8c9880'); rect(ctx,x-1,y-12,1,7,'#596e62');
    rect(ctx,x-3,y-10,5,1,'#596e62'); rect(ctx,x-6,y-2,13,3,p.leaf);
    if(seed%2) rect(ctx,x+3,y-8,3,7,p.mid);
  }
  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d', { alpha: false });
      this.surface = document.createElement('canvas'); this.surface.width = WIDTH; this.surface.height = HEIGHT;
      this.ctx = this.surface.getContext('2d', { alpha: false });
      this.ctx.imageSmoothingEnabled = false;
      this.camera = 0; this.levelKey = ''; this.frame = 0;
      canvas.style.imageRendering = 'pixelated';
      canvas.setAttribute('aria-label', '圣犬帕拉：像素远征游戏画面');
    }
    reset() {
      this.camera = 0;
      this.levelKey = '';
    }
    present() {
      const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
      const width = Math.round((this.canvas.clientWidth || WIDTH * 2) * ratio);
      const height = Math.round(width * HEIGHT / WIDTH);
      if(this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
      this.context.imageSmoothingEnabled = false;
      this.context.drawImage(this.surface, 0, 0, this.canvas.width, this.canvas.height);
    }
    background(time, biome, camera, camp) {
      const ctx = this.ctx, p = palettes[biome] || palettes.forest;
      rect(ctx,0,0,WIDTH,HEIGHT,p.sky);
      rect(ctx,0,38,WIDTH,40,p.haze);
      rect(ctx,0,78,WIDTH,48,biome==='night'?'#456664':biome==='frost'?'#b3ccd0':biome==='ember'?'#8e6260':biome==='dawn'?'#e3d4bd':'#c0cdb2');
      const sunX = 395 - camera*.045, sunY = 40;
      if(biome==='night') {
        for(let i=0;i<41;i++) {
          const alpha = .35 + .35 * Math.sin(time*.5+i);
          ctx.globalAlpha = alpha; rect(ctx,noise(i+10)*WIDTH,noise(i+90)*74, i%9===0?2:1,1,'#d6e5bf');
        }
        ctx.globalAlpha=1; disk(ctx,sunX,sunY,14,'#cedabe'); disk(ctx,sunX+6,sunY-4,12,p.sky);
      } else {
        ctx.globalAlpha=.24; disk(ctx,sunX,sunY,30,p.light);ctx.globalAlpha=1;
        disk(ctx,sunX,sunY,18,p.light);
        rect(ctx,sunX-21,sunY+9,42,2,p.haze);
      }
      for(let i=0;i<5;i++) {
        const x = ((i*139 + time*1.6-camera*.08+650)%780)-100;
        cloud(ctx,x,21+noise(i+30)*41,34+noise(i)*46,biome==='night'?'#506c69':biome==='ember'?'#b07e70':biome==='frost'?'#e5efea':biome==='dawn'?'#fff0d5':'#e5e5c7');
      }
      for(let i=-1;i<7;i++) {
        const x = i*145-camera*.12;
        polygon(ctx,[[x-40,126],[x+19,73+noise(i+5)*22],[x+39,70+noise(i+6)*19],[x+105,121],[x+150,133]],p.distant);
        polygon(ctx,[[x+19,73+noise(i+5)*22],[x+39,70+noise(i+6)*19],[x+79,106],[x+41,92],[x+30,95]],biome==='night'?'#466771':biome==='frost'?'#dcece8':biome==='ember'?'#a9786c':biome==='dawn'?'#f6e6cd':'#a7b6a1');
      }
      rect(ctx,0,125,WIDTH,42,p.far);
      for(let i=-2;i<25;i++) {
        const x = i*35-camera*.22%35;
        pine(ctx,x,151,37+noise(i+21)*43,p.far, i%4===0?p.distant:null);
      }
      rect(ctx,0,148,WIDTH,37,p.mid);
      if(biome==='ruins') this.ruins(camera,p);
      if(biome==='frost') this.frost(camera);
      if(biome==='ember') this.ember(camera,time);
      if(biome==='dawn') this.dawn(camera,p);
      for(let i=-1;i<9;i++) {
        const x=i*98-(camera*.4)%98;
        tree(ctx,x,174,63+noise(i+70)*37,p,i+51,false);
      }
      // Small clearings and shrubs create a legible path beneath the character silhouettes.
      rect(ctx,0,164,WIDTH,23,p.leaf);
      for(let i=0;i<31;i++) {
        const x = i*23-(camera*.65)%23;
        foliage(ctx,x,177,12+noise(i+20)*9,p.mid,p.leaf,i+71);
      }
      if(biome==='night' || biome==='ruins') for(let i=0;i<9;i++) gravestone(ctx,i*81-camera*.65%81,176,p,i);
      rect(ctx,0,176,WIDTH,5,p.grassTop);
      rect(ctx,0,181,WIDTH,59,p.earth);
      rect(ctx,0,181,WIDTH,21,p.grass);
      polygon(ctx,[[0,187],[63,185],[137,190],[217,186],[301,187],[365,185],[435,189],[WIDTH,187],[WIDTH,216],[480,214],[389,218],[316,214],[249,217],[172,214],[94,217],[0,214]],p.path);
      rect(ctx,0,186,WIDTH,2,p.edge);
      for(let i=0;i<107;i++) {
        const x = (noise(i+3)*850-camera)%650;
        const y = 186+noise(i+9)*31;
        rect(ctx,x,y,2+noise(i+1)*5,1,i%3===0?p.edge:p.earth);
      }
      for(let i=0;i<55;i++) {
        const x = ((i*13-camera)%590+590)%590-15;
        const y = 177+noise(i+1)*5;
        rect(ctx,x,y,1,3,p.mid);rect(ctx,x-2,y-2,1,3,p.grassTop);
        if(i%5===0) {rect(ctx,x+2,y-3,2,2,biome==='night'?'#97bbaf':biome==='frost'?'#f5f8ec':biome==='ember'?'#f3aa64':'#e9d68e');rect(ctx,x+2,y-1,1,3,p.mid);}
      }
      if(biome==='frost') for(let i=0;i<18;i++) {
        const x=((i*41-camera*.26)%600+600)%600-20,y=20+(i*47)%170;
        rect(ctx,x,y,2,2,'#edf6ed');rect(ctx,x-2,y+2,1,1,'#d2e9e7');
      }
      if(biome==='ember') for(let i=0;i<14;i++) {
        const x=((i*59+time*(3+i%3)-camera*.18)%610+610)%610-20,y=88+(i*41)%85;
        rect(ctx,x,y,2,2,i%2?'#e8a467':'#d57c57');
      }
      if(biome!=='night') {
        ctx.globalAlpha=.035;
        polygon(ctx,[[345,0],[366,0],[233,180],[173,180]],'#fff4bf');
        polygon(ctx,[[389,0],[400,0],[321,180],[279,180]],'#fff4bf');ctx.globalAlpha=1;
      }
      if(camp) {
        tree(ctx,19,192,163,p,415,true);
        tree(ctx,554,188,179,p,515,true);
        this.tent(291,180,p);
        this.banner(324,180,time,'ally',.8);
        this.crate(461,197);
      }
      return p;
    }
    ruins(camera,p) {
      const ctx=this.ctx;
      for(let i=-1;i<6;i++) {
        const x=i*141-camera*.31%141, y=158;
        rect(ctx,x-12,y-66,24,65,'#6e7e6b');rect(ctx,x-8,y-65,16,65,'#a0ab89');
        rect(ctx,x-17,y-70,34,7,'#bbc29c');rect(ctx,x-17,y-5,34,7,'#809274');
        rect(ctx,x-2,y-59,3,49,'#8e9c7d');rect(ctx,x+11,y-60,2,37,'#536c5b');
        polygon(ctx,[[x-12,y-43],[x-3,y-38],[x-8,y-32],[x-6,y-24],[x-10,y-16],[x-8,y-31]],'#65775f');
        rect(ctx,x+8,y-66,5,24,p.leaf);rect(ctx,x+3,y-55,7,3,p.leafLight);
        if(i%2===0) {rect(ctx,x-15,y-74,90,6,'#7d8d72');rect(ctx,x-12,y-75,79,3,'#bac39f');}
      }
    }
    frost(camera) {
      const c=this.ctx;
      for(let i=-1;i<8;i++) {
        const x=i*94-(camera*.3)%94,y=169,h=24+noise(i+34)*24;
        polygon(c,[[x-12,y],[x-5,y-h*.48],[x-2,y-h],[x+6,y-h*.45],[x+11,y]],'#5d929c');
        polygon(c,[[x-5,y-h*.48],[x-2,y-h],[x+2,y-h*.51],[x,y-h*.66]],'#e4f2e9');
        polygon(c,[[x+5,y-10],[x+9,y-27],[x+13,y-10]],'#b6dcd8');
        rect(c,x-10,y-2,22,3,'#e0eee6');
      }
    }
    ember(camera,time) {
      const c=this.ctx;
      for(let i=-1;i<7;i++) {
        const x=i*117-(camera*.3)%117,y=172;
        polygon(c,[[x-29,y],[x-12,y-35],[x-3,y-39],[x+13,y-18],[x+27,y]],'#453e42');
        polygon(c,[[x-12,y-35],[x-3,y-39],[x+13,y-18],[x+8,y-23],[x-5,y-33]],'#91604d');
        rect(c,x-18,y-2,41,2,'#d2824c');rect(c,x-9,y-3,13,1,'#f1b36d');
        if(i%2===0) this.fire(x+16,y-3,time+i,.38,false);
      }
    }
    dawn(camera,p) {
      const c=this.ctx;
      for(let i=-1;i<7;i++) {
        const x=i*132-(camera*.32)%132,y=171;
        rect(c,x-23,y-48,7,47,'#667f79');rect(c,x+16,y-48,7,47,'#496e69');
        rect(c,x-25,y-51,50,5,'#a7b8a0');rect(c,x-20,y-55,40,4,'#e6d8ac');
        rect(c,x-21,y-37,3,23,p.leafLight);rect(c,x+18,y-31,2,18,p.leafLight);
        rect(c,x-28,y-2,57,4,'#a7b8a0');
      }
    }
    tent(x,y,p) {
      const ctx=this.ctx;
      polygon(ctx,[[x-37,y],[x-7,y-42],[x+34,y],[x-37,y]],'#9e926b');
      polygon(ctx,[[x-7,y-42],[x+21,y-44],[x+57,y-1],[x+34,y]],'#c1ac7b');
      polygon(ctx,[[x-7,y-34],[x+17,y-1],[x-26,y-1]],'#38483b');
      polygon(ctx,[[x-7,y-42],[x-2,y-39],[x-23,y],[x-37,y]],'#d4bd84');
      rect(ctx,x-7,y-48,2,52,'#6b6848');rect(ctx,x+24,y-45,2,5,'#6b6848');
      rect(ctx,x+34,y-1,24,2,p.dark);
    }
    crate(x,y) {
      const c=this.ctx;rect(c,x-10,y-12,20,14,'#4e4c35');rect(c,x-9,y-11,18,11,'#886e46');
      rect(c,x-8,y-10,16,2,'#bea074');rect(c,x-8,y-5,16,1,'#4e4c35');
      rect(c,x-7,y-11,2,12,'#b59763');rect(c,x+5,y-11,2,12,'#b59763');
    }
    banner(x,y,time,side,scale) {
      const ctx=this.ctx, s=scale||1, flap=Math.round(Math.sin(time*3+x)*2);
      rect(ctx,x,y-61*s,2*s,61*s,'#685a3d');rect(ctx,x-1,y-63*s,4*s,4*s,'#e2c277');
      polygon(ctx,[[x+2,y-59*s],[x+25*s,y-57*s+flap],[x+25*s,y-34*s+flap],[x+14*s,y-39*s],[x+2,y-34*s]],side==='ally'?'#285b70':'#654b77');
      rect(ctx,x+3,y-59*s,20*s,2*s,side==='ally'?'#5a969d':'#9779aa');
      rect(ctx,x+11*s,y-54*s,3*s,13*s,'#dbc584');rect(ctx,x+7*s,y-50*s,11*s,3*s,'#dbc584');
    }
    tower(x,y,time,hp,maxHp,shielded,reinforced) {
      const ctx=this.ctx;
      ctx.globalAlpha=.2;disk(ctx,x,y+4,36,'#1b222a');ctx.globalAlpha=1;
      polygon(ctx,[[x-27,y],[x-25,y-44],[x-18,y-53],[x-18,y-67],[x-10,y-67],[x-10,y-58],[x+10,y-58],[x+10,y-67],[x+18,y-67],[x+18,y-53],[x+25,y-44],[x+27,y]],'#34394b');
      rect(ctx,x-23,y-45,46,43,'#555369');rect(ctx,x-18,y-54,36,11,'#6d6477');
      rect(ctx,x-25,y-4,50,6,'#8b7e83');rect(ctx,x-27,y-7,54,4,'#615968');
      rect(ctx,x-24,y-45,8,38,'#6d687a');rect(ctx,x+16,y-45,8,38,'#413d54');
      for(let row=0;row<5;row++) {
        rect(ctx,x-23,y-43+row*8,46,1,'#3e3e53');
        rect(ctx,x-16+(row%2)*7,y-42+row*8,1,7,'#3e3e53');rect(ctx,x+15-(row%2)*7,y-42+row*8,1,7,'#3e3e53');
      }
      polygon(ctx,[[x-11,y-4],[x-11,y-27],[x-8,y-33],[x-3,y-36],[x+3,y-36],[x+8,y-33],[x+11,y-27],[x+11,y-4]],'#202434');
      ctx.globalAlpha=.58+.2*Math.sin(time*2);
      polygon(ctx,[[x-8,y-6],[x-8,y-25],[x-4,y-31],[x+3,y-31],[x+8,y-25],[x+8,y-6]],'#785387');
      ctx.globalAlpha=1;
      for(let i=0;i<4;i++) rect(ctx,x-7+i*4,y-27,1,23,'#303047');
      polygon(ctx,[[x,y-87],[x+9,y-74],[x,y-61],[x-9,y-74]],'#493e61');
      polygon(ctx,[[x,y-84],[x+5,y-74],[x,y-65],[x-5,y-74]],'#b097c5');
      polygon(ctx,[[x,y-82],[x,y-67],[x-4,y-74]],'#ded0d1');
      rect(ctx,x-21,y-50,4,3,'#d5b777');rect(ctx,x+17,y-50,4,3,'#d5b777');
      this.fire(x-21,y-46,time,0.38,true);this.fire(x+21,y-46,time+1,.38,true);
      if(reinforced) {
        polygon(ctx,[[x-7,y-42],[x-2,y-37],[x-5,y-29],[x+2,y-24],[x-1,y-16]],'#d39172');
        polygon(ctx,[[x+14,y-39],[x+9,y-34],[x+13,y-27],[x+8,y-20]],'#d39172');
        ctxAlpha(ctx,.22+.08*Math.sin(time*8),()=>disk(ctx,x,y-75,18,'#e89768'));
      }
      if(shielded) {
        ctx.save();ctx.globalAlpha=.11+.03*Math.sin(time*2);
        polygon(ctx,[[x-36,y+1],[x-39,y-42],[x-27,y-78],[x,y-99],[x+27,y-78],[x+39,y-42],[x+36,y+1]],'#b5a2d0');
        ctx.globalAlpha=.56;ctx.strokeStyle='#b3a0d2';ctx.lineWidth=1;ctx.setLineDash([4,5]);
        ctx.beginPath();ctx.moveTo(x-36,y);ctx.lineTo(x-39,y-42);ctx.lineTo(x-27,y-78);ctx.lineTo(x,y-99);ctx.lineTo(x+27,y-78);ctx.lineTo(x+39,y-42);ctx.lineTo(x+36,y);ctx.stroke();
        ctx.restore();
      }
      if(hp<maxHp) this.health(x,y-96,hp,maxHp,49,'#be7878');
    }
    fire(x,y,time,scale,purple) {
      const ctx=this.ctx, s=scale||1, wave=Math.sin(time*12);
      const dark=purple?'#725784':'#9b6440', mid=purple?'#ae7fb6':'#dc9951', light=purple?'#dcadd1':'#f8d57d';
      ctx.globalAlpha=.08;disk(ctx,x,y-8*s,25*s,light);ctx.globalAlpha=.12;disk(ctx,x,y-8*s,17*s,mid);ctx.globalAlpha=1;
      rect(ctx,x-9*s,y-2*s,18*s,4*s,'#554c35');rect(ctx,x-7*s,y-4*s,13*s,3*s,'#806540');
      polygon(ctx,[[x-8*s,y-3*s],[x-8*s,y-10*s],[x-4*s,y-17*s+wave],[x-1*s,y-13*s],[x+2*s,y-25*s-wave],[x+5*s,y-15*s],[x+8*s,y-10*s],[x+7*s,y-3*s]],dark);
      polygon(ctx,[[x-5*s,y-3*s],[x-5*s,y-11*s],[x,y-18*s-wave],[x+2*s,y-12*s],[x+5*s,y-8*s],[x+4*s,y-3*s]],mid);
      polygon(ctx,[[x-2*s,y-3*s],[x-2*s,y-8*s],[x+1*s,y-13*s],[x+3*s,y-7*s],[x+2*s,y-3*s]],light);
      for(let i=0;i<3;i++){const rise=(time*12+i*9)%29;rect(ctx,x+Math.sin(i+time*2)*6*s,y-(rise+9)*s,s,s,light);}
    }
    health(x,y,hp,maxHp,width,color) {
      if(!maxHp) return;
      rect(this.ctx,x-width/2-1,y-1,width+2,5,'#223c35');
      rect(this.ctx,x-width/2,y,width,3,'#526256');
      rect(this.ctx,x-width/2,y,Math.ceil(width*clamp(hp/maxHp,0,1)),3,color);
      rect(this.ctx,x-width/2,y,Math.ceil(width*clamp(hp/maxHp,0,1)),1,'#c6d5ad');
    }
    entity(entity,time,camera,options) {
      const ctx=this.ctx, kind=entity.kind||'hero';
      const x=entity.x*SCALE-camera;
      if(x<-50 || x>WIDTH+50) return;
      const unique=typeof entity.id==='number'?entity.id:String(entity.id||kind).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
      const phase=time*(kind==='hero'?9:8)+unique;
      const walking=entity.state==='walk' || entity.moving;
      const bounce=walking?Math.sin(phase)*1.4:Math.sin(time*2+unique)*.35;
      const isBat=kind==='bat';
      const y=(options&&options.y!=null?options.y:GROUND+3+(kind==='hero'?0:unique%6))+(entity.y||0)*SCALE+(isBat?Math.sin(time*7+unique)*3:bounce);
      let scale=kind==='hero'?1.42:kind==='boss'?1.9:kind==='brute'||kind==='sentinel'||kind==='boar'?1.44:kind==='bear'||kind==='hedgehog'?1.36:kind==='wraith'?1.4:1.34;
      const face=entity.facing<0?-1:1;
      ctx.globalAlpha=.18;
      rect(ctx,x-(kind==='boss'?17:11),GROUND+3+(kind==='hero'?0:unique%6),kind==='boss'?34:22,3,'#22382c');ctx.globalAlpha=1;
      if(kind==='fox') {
        polygon(ctx,[[x-face*4,y-8],[x-face*18,y-9],[x-face*21,y-18],[x-face*14,y-19],[x-face*8,y-13]],'#bc7448');
        polygon(ctx,[[x-face*21,y-18],[x-face*16,y-19],[x-face*16,y-13],[x-face*19,y-13]],'#ecdfba');
      }
      if(kind==='mouse') {
        rect(ctx,x-face*13,y-6,5,2,'#d09d89');rect(ctx,x-face*16,y-8,3,2,'#d09d89');
      }
      if(kind==='owl') {
        polygon(ctx,[[x-face*5,y-19],[x-face*20,y-11+Math.sin(time*7+unique)*2],[x-face*13,y-28]],'#6fadb2');
        polygon(ctx,[[x-face*9,y-18],[x-face*17,y-14+Math.sin(time*7+unique)*2],[x-face*12,y-24]],'#c4e0cf');
      }
      if(kind==='bat') {
        ctx.save();ctx.translate(x,y-4);ctx.scale(1,.7+.3*Math.sin(time*16));sprite(ctx,kind,0,4,face,scale,entity.hitFlash>0?'#fff2c8':null);ctx.restore();
      } else sprite(ctx,kind,x,y,face,scale,entity.hitFlash>0?'#fff2c8':null);
      const swing=entity.state==='attack'?Math.max(0,Math.sin(time*11+unique))*5:0;
      this.gear(kind,x,y,face,time,swing,scale,entity.staffId);
      if(kind==='hero' && entity.ringId && entity.ringId!=='traveler_ring') {
        const ringColor={harvest_ring:'#e6c478',spring_ring:'#a3d8da',guardian_ring:'#b7df9d'}[entity.ringId];
        rect(ctx,x+face*9*scale-2,y-11*scale,5,3,ringColor);
        rect(ctx,x+face*9*scale,y-13*scale,2,2,'#fff0c5');
      }
      if(walking && !isBat) {
        rect(ctx,x-6,y-1,4,2,'#263d37');rect(ctx,x+3,y-1+Math.sin(phase)*1.4,4,2,'#263d37');
        if(Math.sin(phase)>.9) {ctx.globalAlpha=.3;rect(ctx,x-face*12,y,3,2,'#d2be90');ctx.globalAlpha=1;}
      }
      const matrix=sprites[kind]||sprites.skeleton;
      if(!options?.hideHealth && (kind==='hero'||entity.hp<entity.maxHp)) this.health(x,y-matrix.length*scale-8,entity.hp,entity.maxHp,kind==='hero'?31:kind==='boss'?41:22,entity.side==='enemy'?'#cb857c':'#9dbe82');
      if(entity.slowed||entity.slowTime>0) {rect(ctx,x-8,y-1,3,3,'#bce0dd');rect(ctx,x+6,y-2,3,3,'#94c8cb');}
    }
    gear(kind,x,y,face,time,swing,s,staffId) {
      const c=this.ctx, arm=x+face*8*s;
      if(kind==='hero'||kind==='fox'||kind==='necromancer'||kind==='owl'||kind==='shaman') {
        const poleX=x+face*(10*s+swing*.3);
        rect(c,poleX,y-24*s,2,24*s,'#69553c');rect(c,poleX,y-25*s,2,5,'#d6b660');
        if(kind==='hero') {
          const gem={storm_staff:'#a9ddeb',frost_staff:'#b2e3e4',renewal_staff:'#b8dfa0'}[staffId]||'#eee2a3';
          rect(c,poleX-3,y-29*s,8,8,'#ccad60');rect(c,poleX-2,y-28*s,6,6,gem);
          rect(c,poleX,y-31*s,2,11,'#f4e6a5');rect(c,poleX-4,y-27*s,10,2,'#f4e6a5');
          rect(c,poleX,y-27*s,2,2,staffId==='storm_staff'?'#487aa1':staffId==='renewal_staff'?'#66915f':'#76a6ad');
          if(staffId==='storm_staff') polygon(c,[[poleX+3,y-35*s],[poleX+7,y-35*s],[poleX+4,y-30*s],[poleX+8,y-30*s],[poleX+2,y-24*s],[poleX+4,y-29*s]],'#c7f1ed');
          if(staffId==='frost_staff') polygon(c,[[poleX+1,y-36*s],[poleX+5,y-31*s],[poleX+1,y-26*s],[poleX-3,y-31*s]],'#d3f2ec');
          if(staffId==='renewal_staff') {rect(c,poleX-6,y-33*s,13,2,'#d7ecb7');rect(c,poleX,y-37*s,2,12,'#d7ecb7');}
        } else {
          const color=kind==='fox'?'#edc67c':kind==='owl'?'#b7e2c0':kind==='shaman'?'#e4a06b':'#b990c5';
          polygon(c,[[poleX+1,y-30*s],[poleX+5,y-26*s],[poleX+1,y-22*s],[poleX-3,y-26*s]],color);
          rect(c,poleX,y-28*s,2,2,'#efdfc3');
          if(kind==='owl') {rect(c,poleX-1,y-27*s,4,2,'#eff6d8');rect(c,poleX,y-28*s,2,4,'#eff6d8');}
          if(kind==='shaman') rect(c,poleX-3,y-31*s,7,2,'#eeb77b');
        }
        rect(c,arm-1,y-12*s,4,3,kind==='hero'?'#ebe4c8':kind==='fox'?'#d6945d':kind==='owl'?'#d4e7ce':'#b8b19b');
      } else if(kind==='mouse'||kind==='skeleton') {
        const px=arm+face*swing, py=y-11*s;
        polygon(c,[[px-1,py],[px+face*9,py-10+swing],[px+face*11,py-11+swing],[px+face*3,py+1]],'#c5d2c5');
        rect(c,px-2,py,5,2,'#d6b66c');rect(c,px,py+2,2,3,'#72503c');
        if(swing>3){ctxAlpha(c,.45,()=>rect(c,px+face*10,py-6,4,1,'#f3e2b1'));}
      } else if(kind==='rabbit'||kind==='archer') {
        polygon(c,[[arm,y-21*s],[arm+face*6,y-17*s],[arm+face*8,y-12*s],[arm+face*6,y-7*s],[arm,y-4*s],[arm+face*4,y-11*s],[arm+face*4,y-15*s]],'#b89b62');
        rect(c,arm,y-20*s,1,15*s,'#e7d5a4');rect(c,arm-3,y-12*s,14*face,1,'#d7ceaa');
      } else if(kind==='bear'||kind==='hedgehog') {
        const sx=x+face*7*s;
        polygon(c,[[sx-8,y-20],[sx+8,y-20],[sx+9,y-9],[sx+5,y-2],[sx,y+1],[sx-5,y-2],[sx-9,y-9]],kind==='hedgehog'?'#a5c5b9':'#cfb069');
        polygon(c,[[sx-6,y-18],[sx+6,y-18],[sx+6,y-9],[sx+3,y-4],[sx,y-2],[sx-4,y-5],[sx-6,y-9]],kind==='hedgehog'?'#3f6676':'#426978');
        rect(c,sx-1,y-17,2,13,'#d8c385');rect(c,sx-5,y-13,10,2,'#d8c385');
        if(kind==='hedgehog') for(let i=0;i<3;i++) polygon(c,[[sx-6+i*5,y-20],[sx-4+i*5,y-25],[sx-1+i*5,y-20]],'#e5d5aa');
      } else if(kind==='squirrel') {
        const px=arm+face*3;
        rect(c,px-2,y-17*s,7,7,'#9b623e');rect(c,px-1,y-16*s,5,4,'#dfad62');
        polygon(c,[[px+face*2,y-19*s],[px+face*5,y-18*s],[px+face*3,y-14*s]],'#e9cc83');
      } else if(kind==='boar') {
        const px=x+face*(12*s+swing*.5);
        rect(c,px,y-33*s,2,32*s,'#7b6145');
        polygon(c,[[px-4,y-38*s],[px+5,y-38*s],[px+2,y-29*s],[px-2,y-29*s]],'#d5e2d8');
        rect(c,px-3,y-31*s,8,2,'#edca80');
      } else if(kind==='sentinel') {
        const px=arm+face*3;
        rect(c,px,y-24*s+swing,3,25,'#64747a');
        rect(c,px-6,y-27*s+swing,15,9,'#99b6bd');rect(c,px-4,y-27*s+swing,11,2,'#d6dad0');
      } else if(kind==='brute'||kind==='boss') {
        const px=arm+face*4;
        rect(c,px,y-22*s+swing,3,23,'#755942');rect(c,px-5,y-27*s+swing,13,12,kind==='boss'?'#b6a291':'#626d63');
        rect(c,px-5,y-27*s+swing,13,3,'#a7aaa0');rect(c,px-6,y-24*s+swing,2,8,'#d5c5a1');
      } else if(kind==='bomber') {
        rect(c,x-1,y-17*s,2,7,'#d6af71');
        rect(c,x,y-20*s,3,3,'#f2d98a');
        rect(c,x+2,y-22*s,2,2,'#e29a60');
      }
    }
    aura(hero,camera,time) {
      if(!hero||hero.hp<=0) return;
      const ctx=this.ctx,x=hero.x*SCALE-camera,radius=(hero.auraRadius||190)*SCALE;
      ctx.save();ctx.translate(x,GROUND+5);ctx.scale(1,.16);
      ctx.globalAlpha=.045;ctx.fillStyle='#f3db83';ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.24;ctx.strokeStyle='#f5de8f';ctx.lineWidth=5;ctx.setLineDash([9,9]);ctx.lineDashOffset=-time*8;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
      for(let i=0;i<5;i++){
        const t=(time*.25+i*.19)%1,px=x+Math.sin(i*9.2)*radius*.7;
        ctx.globalAlpha=Math.sin(t*Math.PI)*.45;rect(ctx,px,GROUND-3-t*19,1,2,'#f4df93');
      }ctx.globalAlpha=1;
    }
    projectile(p,camera,time) {
      const c=this.ctx,x=p.x*SCALE-camera,y=GROUND+(p.y||-25)*SCALE;
      if(x<-10||x>WIDTH+10)return;
      if(p.kind==='arrow') {
        const angle=Math.atan2((p.targetY||0)-(p.y||0),(p.targetX??p.x+100)-p.x);
        c.save();c.translate(x,y);c.rotate(angle);rect(c,-6,0,11,1,'#765a39');rect(c,3,-1,3,3,'#e8e6cc');rect(c,-6,-1,3,1,'#ddd8b7');c.restore();
      } else if(p.kind==='acorn') {
        ctxAlpha(c,.3,()=>disk(c,x,y,7,'#e9ae65'));
        rect(c,x-3,y-3,6,5,'#9b6041');rect(c,x-3,y-4,6,2,'#e2bd72');
        rect(c,x-1,y-6,2,2,'#7b5c3d');rect(c,x+3,y,2,1,'#f5d084');
      } else {
        const color=p.side==='enemy'?'#b492c9':'#edc06c';
        ctxAlpha(c,.22,()=>disk(c,x,y,7,color));disk(c,x,y,3,color);rect(c,x-1,y-1,2,2,'#fff2c5');
        rect(c,x+(p.side==='enemy'?5:-7),y,3,1,color);
      }
    }
    effect(effect,camera,time,groundOnly) {
      const c=this.ctx,x=effect.x*SCALE-camera,y=GROUND+(effect.y||0)*SCALE;
      const progress=clamp(1-(effect.life||0)/(effect.maxLife||1),0,1);
      const kind=effect.kind;
      if(groundOnly) {
        if(kind==='frost'||kind==='heal'){
          const radius=(effect.radius||120)*SCALE;
          c.save();c.translate(x,y+2);c.scale(1,.24);c.globalAlpha=(1-progress)*.3;c.strokeStyle=kind==='heal'?'#b5dea4':'#9bdae1';c.lineWidth=2;c.beginPath();c.arc(0,0,radius*(.7+progress*.3),0,Math.PI*2);c.stroke();c.restore();
        }return;
      }
      if(kind==='bolt') {
        const top=y-102;
        ctxAlpha(c,(1-progress)*.8,()=>{polygon(c,[[x-2,top],[x+7,top],[x-3,y-65],[x+8,y-65],[x-6,y-18],[x-1,y-52],[x-10,y-52]],'#ffe3a2');rect(c,x-1,y-30,3,23,'#fff5ce');});
      }
      if(kind==='charge') {
        ctxAlpha(c,(1-progress)*.7,()=>{
          for(let i=0;i<3;i++) polygon(c,[[x-25-progress*18-i*9,y-9+i*4],[x-12-progress*10-i*9,y-11+i*4],[x-18-progress*16-i*9,y-7+i*4]],'#e9c183');
        });
      }
      if(kind==='burst') {
        ctxAlpha(c,(1-progress)*.58,()=>disk(c,x,y-11,7+progress*(effect.radius||45)*SCALE,'#f1a05e'));
        ctxAlpha(c,(1-progress)*.8,()=>disk(c,x,y-11,4+progress*(effect.radius||45)*SCALE*.7,'#ffe1a0'));
      }
      const color=kind==='frost'?'#bbe2de':kind==='heal'?'#b7df94':kind==='burst'?'#f5bf78':kind==='charge'?'#ead296':kind==='spawn'?'#ddcf92':kind==='death'?'#a8ad89':'#ffe0a1';
      const count=kind==='frost'||kind==='burst'?16:kind==='heal'?12:kind==='death'?10:7;
      for(let i=0;i<count;i++) {
        const angle=i/count*Math.PI*2,rad=(kind==='frost'?35:kind==='burst'?32:kind==='heal'?25:12)*progress;
        const px=x+Math.cos(angle)*rad,py=y-13+Math.sin(angle)*rad*.7-progress*9;
        ctxAlpha(c,1-progress,()=>{
          if(kind==='heal') {rect(c,px-2,py,5,1,color);rect(c,px,py-2,1,5,color);}
          else rect(c,px,py,kind==='death'?3:2,2,color);
        });
      }
    }
    foreground(time,p,camera,biome) {
      const c=this.ctx;
      polygon(c,[[0,222],[27,218],[61,222],[89,219],[127,224],[164,219],[218,223],[260,217],[312,221],[361,219],[414,224],[453,220],[508,217],[560,222],[560,240],[0,240]],p.dark);
      for(let i=0;i<49;i++) {
        const x=((i*17-camera*1.15)%590+590)%590-12,y=220+noise(i+7)*9, sway=Math.round(Math.sin(time*1.4+i)*2);
        polygon(c,[[x,y+9],[x-3+sway,y-4],[x+1,y],[x+4+sway,y-8],[x+4,y+8]],i%3===0?p.mid:'#354e3c');
        if(i%9===0) {rect(c,x+2,y-7,3,2,biome==='night'?'#869d9e':'#bcaf6c');rect(c,x+3,y-9,1,2,biome==='night'?'#b6cfc4':'#e1cc8b');}
      }
      for(let i=0;i<7;i++) {
        const x=((i*92+time*(5+i*.4)-camera*.3)%610+610)%610-25;
        const y=25+((time*(2+i*.1)+i*29)%174)+Math.sin(time+i)*3;
        ctxAlpha(c,.55,()=>rect(c,x,y,biome==='night'?1:3,1,biome==='night'?'#cbdba0':p.leafLight));
      }
    }
    navigation(state,camera) {
      const c=this.ctx,hero=state.hero;
      if(!hero)return;
      const width=96,left=WIDTH-111,top=13,total=state.worldWidth||2400;
      ctxAlpha(c,.78,()=>rect(c,left-7,top-7,width+14,24,'#263c36'));
      rect(c,left,top+5,width,2,'#7a8970');rect(c,left,top+4,2,4,'#d6c188');rect(c,left+width-2,top+2,3,6,'#a17e9e');
      const visibleWidth=WIDTH/SCALE/total*width,visibleX=camera/SCALE/total*width;
      rect(c,left+visibleX,top+9,visibleWidth,1,'#637d71');
      for(const unit of state.units||[]){rect(c,left+unit.x/total*width,top+4,1,3,unit.side==='enemy'?'#c493a0':'#96bba8');}
      rect(c,left+hero.x/total*width-1,top+2,3,6,'#f1d991');
      const tower=state.tower;
      if(tower && tower.x*SCALE-camera>WIDTH-25) {
        c.fillStyle='#d5debb';c.font='7px sans-serif';c.textAlign='right';c.fillText('敌方据点  ›',WIDTH-13,top+27);c.textAlign='left';
      }
    }
    render(state,dt) {
      if(!state||!state.hero){this.renderCamp((this.frame++)/60);return;}
      const time=state.time||0,biome=state.level?.biome||'forest';
      const max=Math.max(0,(state.worldWidth||2400)*SCALE-WIDTH),target=clamp(state.hero.x*SCALE-205,0,max);
      const levelKey=state.level?.id||state.level?.name||'level';
      if(this.levelKey!==levelKey){this.camera=target;this.levelKey=levelKey;}
      this.camera+=(target-this.camera)*Math.min(1,(dt||.016)*5);
      const camera=Math.round(this.camera),p=this.background(time,biome,camera,false);
      const baseX=50*SCALE-camera;
      if(baseX>-50)this.banner(baseX,GROUND,time,'ally',1);
      this.aura(state.hero,camera,time);
      for(const effect of state.effects||[])this.effect(effect,camera,time,true);
      if(state.tower)this.tower(state.tower.x*SCALE-camera,GROUND+3,time,state.tower.hp,state.tower.maxHp,state.tower.shielded,state.tower.reinforced);
      const entities=[...state.units||[],state.hero].filter(e=>e.hp>0);
      entities.sort((a,b)=>(a.kind==='hero'?1:0)-(b.kind==='hero'?1:0));
      entities.forEach(e=>this.entity(e,time,camera));
      for(const projectile of state.projectiles||[])this.projectile(projectile,camera,time);
      for(const effect of state.effects||[])this.effect(effect,camera,time,false);
      this.foreground(time,p,camera,biome);
      this.navigation(state,camera);
      if(state.hero.hp<=0) {
        ctxAlpha(this.ctx,.3,()=>rect(this.ctx,0,0,WIDTH,HEIGHT,'#242f36'));
      }
      this.present();
    }
    renderCamp(time,biome,equipment) {
      const t=Number(time)||0,p=this.background(t,biome||'forest',0,true);
      this.aura({x:698,hp:100,auraRadius:125},0,t);
      const camp=[
        {kind:'squirrel',x:557,y:0,facing:1},{kind:'mouse',x:610,y:0,facing:1},
        {kind:'hero',x:686,y:0,facing:1,staffId:equipment?.staff,ringId:equipment?.ring},{kind:'rabbit',x:751,y:0,facing:-1},
        {kind:'hedgehog',x:814,y:0,facing:-1},{kind:'bear',x:873,y:0,facing:-1},
        {kind:'owl',x:927,y:0,facing:-1},{kind:'fox',x:978,y:0,facing:-1},
        {kind:'boar',x:1040,y:0,facing:-1}
      ];
      camp.forEach((unit,i)=>this.entity({...unit,id:i,side:'ally',state:'idle',hp:100,maxHp:100},t,0,{y:186+(i===0?-1:0),hideHealth:true}));
      this.fire(380,201,t,.83,false);
      rect(this.ctx,399,194,25,4,'#594e36');rect(this.ctx,402,192,20,2,'#8a7150');
      this.foreground(t,p,0,biome||'forest');
      this.present();
    }
    drawIcon(canvas,kind,scale) { return drawIcon(canvas,kind,scale); }
  }
  function ctxAlpha(ctx,alpha,callback){ctx.save();ctx.globalAlpha=alpha;callback();ctx.restore();}
  function drawIcon(canvas,kind,scale) {
    const dimension=typeof scale==='number'?Math.max(32,Math.round(64*scale)):64;
    canvas.width=dimension;canvas.height=dimension;canvas.style.imageRendering='pixelated';
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,dimension,dimension);
    const s=dimension/64;c.save();c.scale(s,s);
    if(sprites[kind]) {
      const unitScale=kind==='hero'?1.85:kind==='bear'||kind==='brute'||kind==='boss'||kind==='boar'||kind==='sentinel'?2.1:2.2;
      sprite(c,kind,32,kind==='slime'||kind==='bat'?44:55,1,unitScale);
      Renderer.prototype.gear.call({ctx:c},kind,32,kind==='slime'||kind==='bat'?44:55,1,0,0,unitScale);
    } else if(kind==='heal') {
      rect(c,25,13,14,38,'#6d9e76');rect(c,13,25,38,14,'#6d9e76');rect(c,28,16,8,32,'#c5dea0');rect(c,16,28,32,8,'#c5dea0');
      rect(c,42,12,3,3,'#e0dc9d');rect(c,12,44,3,3,'#e0dc9d');
    } else if(kind==='frost') {
      rect(c,30,11,4,42,'#b1dcdd');rect(c,11,30,42,4,'#b1dcdd');
      polygon(c,[[17,15],[49,47],[46,50],[14,18]],'#82b9c7');polygon(c,[[47,14],[14,47],[17,50],[50,17]],'#82b9c7');
      rect(c,25,25,14,14,'#d3e9dd');rect(c,28,28,8,8,'#93c6cd');
    } else if(kind==='bolt'||kind==='lightning') {
      polygon(c,[[32,7],[45,7],[34,27],[46,27],[21,57],[28,36],[18,36]],'#f0d388');
      polygon(c,[[32,9],[38,9],[28,30],[36,30],[24,47],[31,32],[23,32]],'#fff0b3');
    } else if(kind==='food') {
      rect(c,20,16,25,30,'#966e45');rect(c,18,20,29,23,'#d7ab68');rect(c,22,17,21,24,'#e8c686');
      rect(c,23,21,3,15,'#ba884d');rect(c,31,19,3,15,'#ba884d');rect(c,39,21,3,13,'#ba884d');
    } else if(kind==='mana') {
      rect(c,26,12,12,5,'#dfc791');rect(c,27,17,10,9,'#a9c2bc');
      polygon(c,[[27,24],[20,34],[20,47],[25,52],[39,52],[44,47],[44,34],[37,24]],'#8aabb2');
      polygon(c,[[23,35],[41,35],[41,46],[37,49],[27,49],[23,45]],'#5b9daf');rect(c,25,35,3,10,'#c1ded1');
    } else if(kind==='gold'||kind==='coin') {
      disk(c,32,32,19,'#9c743e');disk(c,32,30,17,'#d9b76c');disk(c,32,30,12,'#af894c');rect(c,30,20,4,20,'#edcf84');rect(c,26,24,12,4,'#edcf84');
    } else if(kind==='heart') {
      polygon(c,[[13,19],[21,13],[28,14],[32,20],[37,14],[44,13],[51,20],[51,31],[32,51],[13,31]],'#c78079');
      rect(c,17,20,9,4,'#e5b099');
    } else {
      rect(c,19,17,26,32,'#638975');rect(c,23,21,18,24,'#b6c8a0');rect(c,28,24,8,17,'#78966d');
    }
    c.restore();return canvas;
  }
  function drawEquipmentIcon(canvas,id) {
    canvas.width=64;canvas.height=64;canvas.style.imageRendering='pixelated';
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,64,64);
    const gems={glimmer_staff:'#f1d786',storm_staff:'#a8e4ee',frost_staff:'#c9eff0',renewal_staff:'#b9df9b',traveler_ring:'#d9be83',harvest_ring:'#e8c16c',spring_ring:'#9dd4de',guardian_ring:'#b8d89c'};
    const gem=gems[id]||'#f1d786';
    if(id.endsWith('_ring')) {
      disk(c,32,37,21,'#6e613f');disk(c,32,34,19,'#d5b66f');disk(c,32,34,13,'#5f684e');disk(c,32,34,10,'#23372f');
      rect(c,22,14,20,8,'#916f47');rect(c,24,13,16,7,gem);rect(c,28,12,8,3,'#f6ebc3');
      rect(c,14,37,3,7,'#f0d695');rect(c,47,30,3,7,'#f0d695');
    } else {
      rect(c,29,23,7,36,'#463f37');rect(c,31,23,3,35,'#b39158');rect(c,27,53,11,4,'#e8c780');
      polygon(c,[[32,5],[43,17],[32,29],[21,17]],'#806c53');
      polygon(c,[[32,8],[39,17],[32,25],[25,17]],gem);
      rect(c,30,11,4,4,'#fff3cf');rect(c,17,17,30,3,'#d3b674');
      if(id==='storm_staff') polygon(c,[[39,5],[45,5],[41,13],[47,13],[37,24],[40,15]],'#e3f8e9');
      if(id==='frost_staff') {rect(c,16,11,3,12,'#d9f5ec');rect(c,13,15,9,3,'#d9f5ec');rect(c,45,11,3,12,'#d9f5ec');rect(c,42,15,9,3,'#d9f5ec');}
      if(id==='renewal_staff') {rect(c,29,5,6,24,'#d4edb2');rect(c,22,14,20,5,'#d4edb2');}
    }
    return canvas;
  }
  Pala.Renderer=Renderer;
  Pala.drawIcon=drawIcon;
  Pala.drawEquipmentIcon=drawEquipmentIcon;
})();
