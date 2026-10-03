'use strict';
// Núcleo do jogo: estado, loop, controles, combate, economia, cerco e salvamento.

// níveis de zoom da câmera (1 = o mais afastado); múltiplos que mantêm os pixels nítidos
const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2, 2.5];

const G = {
  state: 'menu', paused: false, time: 0, day: 1, ents: [], texts: [], parts: [],
  cam: { x: 0, y: 0 }, keys: {}, mouse: { x: 0, y: 0, wx: 0, wy: 0, down: false },
  placing: null, siege: null, civs: [], spawn: { x: 0, y: 0 }, zone: -2,
  groups: {}, timers: { spawn: 0, amb: 0, regrow: 0, hud: 0 }, name: 'Aventureiro',
  darkness: 0, realTime: 0, lastWarn: 0, ping: null,
  people: [], family: { spouse: null, tryChild: false, dueDay: 0 }, spawned: new Map(),
  settings: { uiScale: 'auto', minimap: true, miniSize: 180, numbers: true, keysbar: false, music: 0.5, sfx: 0.7, mute: false, touch: 'auto' },
  storage: {}, dungeons: {}, dungeon: null, diplo: null, weather: null, slot: 1,
  plots: {}, order: 'follow', battles: [], caravans: [], stats: {}, ach: {}, diary: [], dynasty: [], diff: 'normal', hoverNpc: null,
};
const SETTINGS_KEY = 'coroa_de_ferro_ajustes';
const P = {};

const Inv = {
  // grupos (ex.: "fish") somam todos os itens do grupo
  count(k) { return ITEM_GROUPS[k] ? ITEM_GROUPS[k].reduce((s, g) => s + (P.inv[g] || 0), 0) : (P.inv[k] || 0); },
  add(k, n) {
    P.inv[k] = (P.inv[k] || 0) + n;
    if (P.inv[k] <= 0) {
      delete P.inv[k];
      for (const s in P.equip) if (P.equip[s] === k) P.equip[s] = null;
      for (let q = 0; q < P.quick.length; q++) if (P.quick[q] === k) P.quick[q] = null;
    }
  },
  // a mochila tem casas fixas (P.bag): cada item fica onde você colocou. Itens nos bolsos ou equipados saem da
  // mochila; quando voltam (ou chegam itens novos) ocupam a primeira casa livre. São 18 casas (crescem de 6 em 6 se precisar).
  bag() {
    const out = new Set([...P.quick, ...Object.values(P.equip)].filter(Boolean));
    const want = Object.keys(P.inv).filter(k => P.inv[k] > 0 && ITEMS[k] && !out.has(k));
    const fresh = !P.bag || !P.bag.length;
    const seen = new Set(), b = (P.bag || []).map(k => { if (!k || !want.includes(k) || seen.has(k)) return null; seen.add(k); return k; });
    const missing = want.filter(k => !seen.has(k));
    if (fresh && missing.length) { const ord = UI.invKeys(['Recursos', 'Materiais', 'Comida', 'Sementes', 'Ferramentas', 'Armas', 'Armaduras', 'Diversos']); missing.sort((a, c) => ord.indexOf(a) - ord.indexOf(c)); }
    for (const k of missing) { const i = b.indexOf(null); if (i >= 0) b[i] = k; else b.push(k); }
    while (b.length > 18 && b[b.length - 1] === null) b.pop();
    const n = Math.max(18, Math.ceil(b.length / 6) * 6);
    while (b.length < n) b.push(null);
    P.bag = b;
    return b;
  },
  // devolve um item à mochila numa casa escolhida (ou na primeira livre)
  toBag(k, at) {
    const b = this.bag();
    const i = at !== undefined && at !== null && at >= 0 ? at : b.indexOf(null);
    const cur = b.indexOf(k); if (cur >= 0) b[cur] = null;
    if (i >= 0 && i < b.length) { const other = b[i]; b[i] = k; if (other && other !== k) { const j = b.indexOf(null); if (j >= 0) b[j] = other; else b.push(other); } }
    else b.push(k);
  },
  has(cost) {
    for (const k in cost) {
      if (k === 'gold') { if (P.gold < cost.gold) return false; }
      else if (this.count(k) < cost[k]) return false;
    }
    return true;
  },
  pay(cost) {
    for (const k in cost) {
      if (k === 'gold') { P.gold -= cost.gold; continue; }
      if (!ITEM_GROUPS[k]) { this.add(k, -cost[k]); continue; }
      let left = cost[k];
      for (const g of ITEM_GROUPS[k]) { const n = Math.min(left, P.inv[g] || 0); if (n) { this.add(g, -n); left -= n; } }
    }
  },
};

const Game = {
  // ================================================================ inicialização
  boot() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d');
    const resize = () => {
      this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
      this.light.width = window.innerWidth; this.light.height = window.innerHeight;
    };
    window.addEventListener('resize', resize); resize();

    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.onKey(e.code);
      G.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      G.keys[e.code] = false;
      if (e.code === 'KeyV' && P.charging && G.state === 'play' && !G.paused) Moves.release();
    });
    window.addEventListener('blur', () => { G.keys = {}; G.mouse.down = false; });
    this.canvas.addEventListener('mousemove', e => { G.mouse.x = e.clientX; G.mouse.y = e.clientY; });
    // roda do mouse: aproxima ou afasta a câmera do personagem
    this.canvas.addEventListener('wheel', e => {
      if (G.state !== 'play') return;
      e.preventDefault();
      const steps = ZOOM_LEVELS, cur = steps.indexOf(this.zoomStep()), i = U.clamp(cur + (e.deltaY < 0 ? 1 : -1), 0, steps.length - 1);
      G.settings.zoom = steps[i];
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (err) { /* vale só nesta sessão */ }
    }, { passive: false });
    this.canvas.addEventListener('mousedown', e => {
      if (G.state !== 'play' || G.paused) return;
      if (e.button === 2) { if (Urban.mode) Urban.cancel(); else if (G.placing) G.placing = null; else G.mouse.right = true; return; }
      if (e.button !== 0) return;
      const mm = this.miniRect;
      if (mm && e.clientX >= mm.x && e.clientX <= mm.x + mm.s && e.clientY >= mm.y && e.clientY <= mm.y + mm.s) { UI.toggle('showMap'); return; }
      if (Urban.mode) { Urban.click(); return; }
      if (G.placing) { this.placeBuilding(); return; }
      // clicar numa pessoa abre a conversa com ela
      const h = G.hoverNpc;
      if (h && !h.dead && U.dist(h.x, h.y, P.x, P.y) < 4.5 * TILE) { UI.showTalk(h.npc.id); return; }
      const car = G.ents.find(c => c.kind === 'caravan' && !c.dead && U.dist(c.x, c.y - 14, G.mouse.wx, G.mouse.wy) < 30 && U.dist(c.x, c.y, P.x, P.y) < 4 * TILE);
      if (car && !car.hostileToPlayer) { UI.showCaravan(car); return; }
      G.mouse.down = true;
      // segurar o clique repete o golpe: ataca e coleta sem precisar clicar de novo (golpe forte: tecla V)
      this.playerAction(true, true);
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 2) { G.mouse.right = false; return; }
      Urban.drag = false;
      G.mouse.down = false;
      if (P.charging && G.state === 'play' && !G.paused) Moves.release();
      P.charging = false;
    });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    try { Object.assign(G.settings, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}); } catch (e) { /* ajustes padrão */ }
    Saves.migrate();
    Sound.setVol({ music: +G.settings.music, sfx: +G.settings.sfx, mute: !!G.settings.mute });
    UI.init();
    Touch.init();
    window.addEventListener('resize', () => this.applySettings());
    if (!Resume.restore()) UI.showMainMenu();
    Resume.watch();
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      G.realTime += dt;
      Pad.update();
      if (G.state === 'play' && !G.paused) this.update(dt);
      if (G.state === 'play' && (this.hudT = (this.hudT || 0) - dt) <= 0) { this.hudT = 0.12; UI.updateHUD(); }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  resetPlayer(x, y) {
    Object.assign(P, {
      x, y, r: 10, hp: 100, maxHp: 100, stamina: 100, hunger: 100, gold: 20, level: 1, xp: 0,
      inv: {}, equip: { weapon: null, tool: null, tool2: null, head: null, torso: null, legs: null, feet: null }, bag: [],
      quick: [null, null], sailing: false, fishing: null, sex: 'm', age: 25, hairBase: '#5a3a1a', skin: '#f0c896',
      aim: 0, dir: 1, atkCd: 0, swing: 0, hurt: 0, moving: false, anim: 0, dead: false, toolAnim: null,
      horse: null, cart: false, mounted: false, stepT: 0, bagLvl: 1, invOrder: [],
    });
  },

  initCivs() {
    G.civs = CIV_DEFS.map((d, i) => ({
      id: i, ruler: 'npc', rulerName: d.ruler, pop: 140 + U.rint(0, 60), treasury: 600 + U.rint(0, 400),
      garrison: 10 + U.rint(0, 6), tax: 0.12, happy: 60, relation: 0, atWar: false, rebel: 0, festival: 0,
      stock: { wheat: 120, wood: 80, stone: 60, iron_ore: 20 },
      invest: { farms: 0, sawmill: 0, quarry: 0, mines: 0, housing: 0, walls: 0 },
    }));
  },

  // o mundo é gerado num Web Worker (a tela de carregamento continua animada)
  async newGame(opts, onProgress) {
    const name = opts.name;
    G.name = name;
    G.slot = opts.slot || Saves.firstFree() || 1;
    G.terrain = TERRAIN_V;
    const ok = await WorldGen.run(WORLD_SEED, onProgress, G.terrain);
    if (!ok) throw new Error('Falha ao gerar o mundo');
    this.initCivs();
    G.family = { spouse: null, tryChild: false, dueDay: 0 };
    G.spawned = new Map(); G.storage = {}; G.dungeons = {}; G.dungeon = null; G.weather = null;
    Diplo.init();
    People.generate();
    G.diff = opts.diff || 'normal';
    G.plots = {}; G.order = 'follow'; G.battles = []; G.caravans = []; G.stats = {}; G.ach = {}; G.diary = []; G.dynasty = [];
    Towns.init(); Towns.applyAll();
    G.revolts = []; G.founded = []; G.births = {}; G.lastBirths = {}; G.playerFam = undefined;
    G.surname = (opts.surname || '').trim() || Families.newSurname();
    Arena.init(); Faith.init();
    Families.init(); Families.ensurePlayer(); Faith.ensurePriests();
    G.homes = {}; G.npcHouses = []; G.npcHouseSeq = 0; Homes.touch(); Homes.dayTick(false);
    G.title = { lvl: -1, civ: -1 }; G.civilTitles = {}; G.service = {}; G.fame = 0; G.market = {}; G.assaults = []; G.piety = 0; G.tourney = null; G.duel = null; G.joust = null;
    G.plotsC = []; G.assassins = 0; G.shrines = {}; G.pilgrim = null; G.urban = {}; G.vwar = null; G.askDay = {}; G.econT = 0; G.ledger = []; G.heraldry = {}; Heraldry.apply(); G.courtier = null; G.courtInvite = null; G.courtRefused = {}; Urban.stop(); WorldEvents.reset();
    const d = World.start.door;
    this.resetPlayer((d.x + 0.5) * TILE, (d.y + 1) * TILE);
    G.spawn = { x: P.x, y: P.y };
    Object.assign(P, { sex: opts.sex, age: opts.age, hairBase: opts.hair, skin: opts.skin || '#f0c896', style: opts.style || null });
    Progress.diary(`🛖 ${name} ${G.surname} chegou à sua cabana, com ${opts.age} anos, para começar uma nova vida.`);
    G.time = NIGHT_LEN; G.day = 1; G.ents = []; G.texts = []; G.parts = []; G.siege = null; G.placing = null; G.groups = {}; G.zone = -2;
    Ranged.projs = []; World.season = -1; Season.apply(false);
    G.state = 'play'; G.paused = false; G.ping = null; UI.showGameUI(true);
  },

  toMenu() { Resume.clear(); Urban.stop(); UI.close(); if (G.dungeon) Dungeon.exit(true); G.state = 'menu'; G.ents = []; UI.prompt(null); UI.showGameUI(false); UI.showMainMenu(); },

  // ================================================================ salvar / carregar (3 espaços)
  saveInfo() { return Saves.list().filter(Boolean).sort((a, b) => b.savedAt - a.savedAt)[0] || null; },
  snapshot() {
    return {
      v: 5, slot: G.slot, savedAt: Date.now(), seed: World.seed, terrain: G.terrain || TERRAIN_V, ping: G.ping, name: G.name, surname: G.surname, time: G.time, day: G.day, spawn: G.spawn,
      player: { x: P.x, y: P.y, hp: P.hp, maxHp: P.maxHp, stamina: P.stamina, hunger: P.hunger, gold: P.gold, level: P.level, xp: P.xp, inv: P.inv, equip: P.equip,
        quick: P.quick, sex: P.sex, age: P.age, hairBase: P.hairBase, skin: P.skin, horse: P.horse || null, cart: !!P.cart, bagLvl: P.bagLvl || 1, invOrder: P.invOrder || [], bag: P.bag || [], style: P.style || null, seed: P.seed || null, water: P.water || 0 },
      plots: G.plots, order: G.order, battles: G.battles, stats: G.stats, ach: G.ach, diary: G.diary, dynasty: G.dynasty, diff: G.diff,
      vlife: World.villages.map(v => ({ prosper: v.prosper, level: v.level, ruin: v.ruin, lord: v.lord || null })),
      urban: G.urban || {}, askDay: G.askDay || {}, econT: G.econT || 0, ledger: G.ledger || [], heraldry: G.heraldry || {}, courtier: G.courtier || null, courtInvite: G.courtInvite || null, courtRefused: G.courtRefused || {}, homes: G.homes || {}, npcHouses: G.npcHouses || [], npcHouseSeq: G.npcHouseSeq || 0,
      people: this.packPeople(), family: G.family,
      fams: G.fams, famSeq: G.famSeq, playerFam: G.playerFam, revolts: G.revolts, founded: G.founded, births: G.births, lastBirths: G.lastBirths,
      title: G.title, titleV: 2, civilTitles: G.civilTitles || {}, service: G.service, fame: G.fame, market: G.market, assaults: G.assaults, piety: G.piety, tourney: G.tourney, plotsC: G.plotsC, assassins: G.assassins,
      shrines: G.shrines, pilgrim: G.pilgrim, prayDay: G.prayDay, pcaravans: (G.caravans || []).filter(c => c.owner === 'player' && !c.done), civs: G.civs, storage: G.storage, dungeons: G.dungeons, diplo: G.diplo,
      vciv: World.villages.map(v => v.civ),
      built: World.structs.filter(s => s.built && !s.removed).map(s => ({ type: s.type, x: s.x, y: s.y, animals: s.animals, goods: s.goods, stock: s.stock, till: s.till, workers: s.workers, autosell: s.autosell, oldId: s.id })),
      camps: World.camps.map(c => ({ cleared: c.cleared, left: c.left, respawnDay: c.respawnDay })),
      obj: U.u8ToB64(World.obj),
      regrow: World.regrow,
    };
  },
  // pessoas falecidas são guardadas de forma resumida (o arquivo não cresce sem parar)
  packPeople() {
    const ref = new Set();
    for (const p of G.people) if (p.alive) { for (const id of p.parents) ref.add(id); for (const id of p.children) ref.add(id); if (typeof p.spouse === 'number') ref.add(p.spouse); }
    return G.people.map(p => p.alive ? p : ref.has(p.id) || p.kin || p.becamePlayer ? this.slimDead(p)
      : { id: p.id, alive: false, sex: p.sex, name: p.name, surname: p.surname, age: p.age, rank: p.rank, civ: p.civ, home: { type: 'wild' }, parents: [], children: [], spouse: null, equip: {}, aff: 0, rom: 0, gone: true });
  },
  slimDead(p) {
    const o = {};
    for (const k of ['id', 'sex', 'name', 'surname', 'maiden', 'fam', 'age', 'rank', 'civ', 'home', 'parents', 'children', 'spouse', 'kin', 'hair', 'skin', 'trait', 'aff', 'becamePlayer', 'prof']) if (p[k] !== undefined) o[k] = p[k];
    o.alive = false; o.equip = {}; o.rom = 0;
    return o;
  },
  save(at, quiet) {
    if (G.dungeon) { UI.msg('Não é possível salvar dentro de uma caverna.', 'bad'); return false; }
    if (at) G.spawn = { x: (at.x + at.w / 2) * TILE, y: (at.y + at.h + 0.9) * TILE };
    try {
      Saves.write(G.slot || 1, this.snapshot());
      UI.msg(quiet ? `💾 Salvamento automático (espaço ${G.slot}).` : `💾 Jogo salvo no espaço ${G.slot}.`, 'gold', !quiet);
      return true;
    } catch (e) {
      UI.msg('Erro ao salvar: o armazenamento do navegador está cheio. Exporte e apague um espaço antigo.', 'bad');
      return false;
    }
  },
  async load(slot, onProgress, data) {
    const s = data || Saves.read(slot);
    if (!s) return false;
    // jogos salvos antes da mudança das montanhas não têm "terrain": usam o terreno antigo (versão 1)
    G.terrain = s.terrain || 1;
    const ok = await WorldGen.run(s.seed, onProgress, G.terrain);
    if (!ok) return false;
    G.slot = slot;
    G.name = s.name; G.ping = s.ping || null; G.time = s.time; G.day = s.day; G.spawn = s.spawn; G.civs = s.civs;
    this.resetPlayer(s.player.x, s.player.y);
    Object.assign(P, s.player);
    P.mounted = false; P.hx = P.x - 30; P.hy = P.y;
    P.quick = [(P.quick || [])[0] || null, (P.quick || [])[1] || null];
    P.equip = Object.assign({ weapon: null, tool: null, tool2: null, head: null, torso: null, legs: null, feet: null }, P.equip || {});
    P.bag = P.bag || [];
    (s.vlife || []).forEach((l, i) => { if (World.villages[i]) Object.assign(World.villages[i], l); });
    Towns.init(); Towns.applyAll();
    Arena.init(); Faith.init();
    const idMap = {};
    for (const b of s.built) {
      const def = BUILDINGS[b.type];
      if (def) { const st = World.addStruct(b.type, b.x, b.y, def.w, def.h, 'player', { built: true, animals: b.animals, goods: b.goods, stock: b.stock, till: b.till, workers: b.workers, autosell: b.autosell }); if (b.oldId !== undefined) idMap[b.oldId] = st.id; }
    }
    G.fams = s.fams || {}; G.famSeq = s.famSeq || 0; G.founded = s.founded || []; G.revolts = s.revolts || [];
    G.births = s.births || {}; G.lastBirths = s.lastBirths || {}; G.playerFam = s.playerFam;
    Families.restore();
    s.camps.forEach((c, i) => { if (World.camps[i]) Object.assign(World.camps[i], c); });
    World.obj = U.b64ToU8(s.obj);
    for (let i = 0; i < World.obj.length; i++) if (World.obj[i]) World.objHp[i] = OBJ[World.obj[i]].hp;
    World.regrow = s.regrow || [];
    G.ents = []; G.texts = []; G.parts = []; G.siege = null; G.placing = null; G.groups = {}; G.zone = -2; Ranged.projs = [];
    G.people = s.people || []; G.family = s.family || { spouse: null, tryChild: false, dueDay: 0 }; G.spawned = new Map();
    // funcionários apontam para o novo número da construção
    for (const p of G.people) if (p.job !== undefined && p.job !== null) p.job = idMap[p.job] !== undefined ? idMap[p.job] : null;
    G.surname = s.surname || Families.newSurname();
    if (!s.fams) Families.init(); else { for (const p of G.people) Families.attach(p); }
    Families.ensurePlayer(); Families.refresh(); Faith.ensurePriests();
    G.title = s.title || { lvl: -1, civ: -1 }; G.civilTitles = s.civilTitles || {}; if (!s.titleV && G.title.lvl >= 3) G.title.lvl++; /* Marquês entrou antes do Duque */ G.service = s.service || {}; G.fame = s.fame || 0; G.market = s.market || {}; G.assaults = (s.assaults || []).filter(a => a.state !== 'done');
    for (const a of G.assaults) { a.spawnedEngines = 0; a.near = false; }
    G.piety = s.piety || 0; G.tourney = s.tourney || null; G.plotsC = s.plotsC || []; G.assassins = s.assassins || 0; G.shrines = s.shrines || {}; G.pilgrim = s.pilgrim ?? null; G.prayDay = s.prayDay;
    G.duel = null; G.joust = null; G.vwar = null; Urban.stop(); WorldEvents.reset();
    G.urban = s.urban || {}; G.askDay = s.askDay || {}; G.econT = s.econT || 0; G.ledger = s.ledger || []; G.heraldry = s.heraldry || {}; Heraldry.apply(); G.courtier = s.courtier || null; G.courtInvite = s.courtInvite || null; G.courtRefused = s.courtRefused || {};
    G.storage = s.storage || {}; G.dungeons = s.dungeons || {}; G.dungeon = null; G.diplo = s.diplo || null; G.weather = null;
    if (!G.diplo) Diplo.init();
    (s.vciv || []).forEach((c, i) => { const v = World.villages[i]; if (v && v.civ !== c) Diplo.captureVillage(v, c, true); });
    World.buildMinimap();
    World.season = -1; Season.apply(false);
    G.plots = s.plots || {}; G.order = s.order || 'follow'; G.battles = (s.battles || []).filter(b => !b.done); G.caravans = s.pcaravans || [];
    for (const b of G.battles) b.started = false;
    G.stats = s.stats || {}; G.ach = s.ach || {}; G.diary = s.diary || []; G.dynasty = s.dynasty || []; G.diff = s.diff || 'normal';
    (s.vlife || []).forEach((l, i) => { if (World.villages[i]) Object.assign(World.villages[i], l); });
    Towns.init(); Towns.applyAll();
    G.homes = s.homes || {}; G.npcHouses = s.npcHouses || []; G.npcHouseSeq = s.npcHouseSeq || 0;
    Homes.restore();
    Urban.restore(); Families.refresh(); Homes.dayTick(false);
    for (const p of G.people) if (p.alive && p.capanga && !p.post) this.spawnCapanga(p);
    G.state = 'play'; G.paused = false; UI.showGameUI(true);
    if (!data) UI.msg(`Bem-vindo de volta, ${G.name}! ${Calendar.full(G.day)} · ${Season.cur().icon} ${Season.cur().name}.`, 'gold');
    return true;
  },

  // ================================================================ atributos do jogador
  pDmg() {
    const base = (P.equip.weapon ? ITEMS[P.equip.weapon].dmg : 4) + (P.level - 1) * 1.5;
    return base * (1 + (Farm.has('str') ? 0.2 : 0) + (Farm.has('courage') ? 0.15 : 0) + (Farm.has('holy') ? 0.15 : 0));
  },
  pDef() { return ARMOR_SLOTS.reduce((s, k) => s + (P.equip[k] ? ITEMS[P.equip[k]].def || 0 : 0), 0) + (Farm.has('def') ? 4 : 0) + (Farm.has('blessed') ? 2 : 0) + (Farm.has('holy') ? 3 : 0); },
  xpNext() { return 40 + P.level * 40; },
  // ferramenta empunhada, se for do tipo pedido; senão, as mãos
  toolFor(type) {
    const k = P.equip.tool, it = k && ITEMS[k];
    return it && it.tool === type ? { tier: it.tier, power: it.power, name: it.name } : { tier: 0, power: 1, name: 'Mãos' };
  },
  toolList() {
    return Object.keys(P.inv).filter(k => ITEMS[k].slot === 'tool')
      .sort((a, b) => (ITEMS[a].tool + ITEMS[a].tier).localeCompare(ITEMS[b].tool + ITEMS[b].tier));
  },
  cycleTool() {
    if (P.equip.tool2) { const a = P.equip.tool; P.equip.tool = P.equip.tool2; P.equip.tool2 = a; if (P.fishing) P.fishing = null; UI.msg('Em mãos: ' + (P.equip.tool ? ITEMS[P.equip.tool].name : 'nenhuma ferramenta')); return; }
    const list = [null, ...this.toolList()];
    const i = list.indexOf(P.equip.tool);
    P.equip.tool = list[(i + 1) % list.length];
    if (P.fishing) P.fishing = null;
    UI.msg('Em mãos: ' + (P.equip.tool ? ITEMS[P.equip.tool].name : 'nenhuma ferramenta'));
  },
  useQuick(slot) {
    const k = P.quick[slot];
    if (!k) { UI.msg(`O espaço ${slot + 1} da algibeira está vazio. Use o inventário (I) para guardar itens nele.`); return; }
    if (Inv.count(k) <= 0) { UI.msg(`Acabou: ${ITEMS[k].name}.`, 'bad'); return; }
    if (ITEMS[k].tool) { this.wield(k); return; }
    this.eat(k);
  },
  // empunha a ferramenta (sem aviso: o ícone na mão já mostra)
  wield(k) { if (P.equip.tool !== k) { if (P.equip.tool2 === k) P.equip.tool2 = P.equip.tool; P.equip.tool = k; if (P.fishing) P.fishing = null; } },
  // dá para usar esta ferramenta agora? (árvore ou rocha por perto, terra para arar, água para pescar/encher)
  toolUsable(k) {
    const it = ITEMS[k], type = it && it.tool;
    if (!type || Inv.count(k) <= 0 || G.dungeon || P.mounted || P.sailing) return false;
    const ptx = P.x / TILE, pty = (P.y - 8) / TILE;
    if (type === 'axe' || type === 'pick') {
      for (let y = Math.floor(pty) - 2; y <= Math.floor(pty) + 2; y++) for (let x = Math.floor(ptx) - 2; x <= Math.floor(ptx) + 2; x++) {
        if (!World.inb(x, y)) continue;
        const o = World.obj[World.idx(x, y)];
        if (o && OBJ[o].tool === type && U.dist(x + 0.5, y + 0.5, ptx, pty) < 1.8) return true;
      }
      return false;
    }
    const fx = Math.floor((P.x + (P.dir > 0 ? 26 : -26)) / TILE), fy = Math.floor((P.y - 8) / TILE);
    if (!World.inb(fx, fy)) return false;
    const i = World.idx(fx, fy);
    if (type === 'hoe') return !!Farm.plots()[i] || (Farm.tillable(World.tiles[i]) && !World.obj[i] && World.sgrid[i] < 0);
    if (type === 'rod' || type === 'water') return !!this.findNearTile((x, y) => World.isWater(World.tile(x, y))) || (type === 'water' && !!Farm.plots()[i]);
    return false;
  },
  // há alguém ou algo para interagir aqui perto?
  canInteract() {
    if (this.nearestNpc() || this.nearestInteract()) return true;
    if (G.ents.some(c => c.kind === 'caravan' && !c.dead && !c.hostileToPlayer && U.dist(c.x, c.y, P.x, P.y) < 2.4 * TILE)) return true;
    return !!this.boatAction();
  },
  setQuick(slot, k) {
    for (let s = 0; s < P.quick.length; s++) if (P.quick[s] === k) P.quick[s] = null;
    for (const s in P.equip) if (P.equip[s] === k) P.equip[s] = null;
    P.quick[slot] = k;
  },
  gainXp(n) {
    if (Farm.has('wisdom')) n = Math.ceil(n * 1.3);
    P.xp += n;
    while (P.xp >= this.xpNext()) {
      P.xp -= this.xpNext(); P.level++; P.maxHp += 10; P.hp = P.maxHp;
      Sound.play('levelup');
      UI.banner('⭐ Nível ' + P.level + '!');
      UI.msg(`Você subiu para o nível ${P.level}! Vida máxima +10, dano +1.5.`, 'gold', true);
    }
  },
  allies() { return G.ents.filter(e => e.kind === 'ally' && !e.dead); },
  followerCap() {
    return 10 + Court.capBonus();
  },
  // cor do reino: a escolhida pelo rei; reinos do jogador sem cor própria usam o dourado do jogador
  civColor(ci) { return G.civs[ci] && G.civs[ci].ruler === 'player' && !Heraldry.customColor(ci) ? PLAYER_COLOR : CIV_DEFS[ci].color; },
  // G.time: 0..NIGHT_LEN é a noite (21h às 6h), depois vem o dia (6h às 21h)
  hour() { const t = G.time; return t < NIGHT_LEN ? (21 + t / NIGHT_LEN * 9) % 24 : 6 + (t - NIGHT_LEN) / DAYLIGHT_LEN * 15; },
  isNight() { return G.time < NIGHT_LEN; },
  // põe o relógio numa hora do dia (6h–21h é dia, 21h–6h é noite)
  setHour(h) { h = ((h % 24) + 24) % 24; G.time = h >= 6 && h < 21 ? NIGHT_LEN + (h - 6) / 15 * DAYLIGHT_LEN : ((h - 21 + 24) % 24) / 9 * NIGHT_LEN; },
  // quanto do dia já passou (a "pizza" do relógio): 0 no amanhecer, 1 quando escurece
  dayFill() { return G.time < NIGHT_LEN ? 0 : U.clamp((G.time - NIGHT_LEN) / DAYLIGHT_LEN, 0, 1); },
  // escurece só quando o dia acaba; clareia nos últimos segundos da noite
  calcDarkness() {
    if (G.dungeon) return 0.86;
    const t = G.time, M = 0.62, fade = 6;
    if (t < NIGHT_LEN - fade) return M;
    if (t < NIGHT_LEN) return (NIGHT_LEN - t) / fade * M;
    if (t > DAY_LEN - 2) return M * (t - (DAY_LEN - 2)) / 2;
    return 0;
  },
  relationText(c) {
    if (c.ruler === 'player') return '<span class="ok">Seu reino</span>';
    const r = c.relation;
    return r >= 75 ? '<span class="ok">Aliado</span>' : r >= 40 ? '<span class="ok">Amigável</span>' : r >= 10 ? 'Cordial' : r > -20 ? 'Neutro' : r > -60 ? '<span class="bad">Hostil</span>' : '<span class="bad">Inimigo</span>';
  },
  addRelation(ci, n) {
    const c = G.civs[ci];
    if (c.ruler === 'player') return;
    c.relation = U.clamp(c.relation + n, -100, 100);
  },
  buildIcon(k) { return { biz_farm: '🌾', biz_mill: '🌬️', biz_lumber: '🪚', biz_quarry: '🪨', biz_mine: '⛏️', biz_smithy: '⚒️', biz_shop: '🏪', cabin: '🛖', campfire: '🔥', workbench: '🪚', forge: '⚒️', house: '🏠', manor: '🏛️', farm: '🌾', barracks: '🛡️', wall_wood: '🪵', wall_stone: '🧱', chest: '📦', stable: '🐴',
    oven: '🥖', brewery: '🍺', coop: '🐔', pen: '🐄', beehive: '🐝', ptavern: '🍻' }[k] || '🏗️'; },

  // ================================================================ entrada
  onKey(code) {
    if (code === 'Space' && G.joust && !G.joust.over && UI.cur && UI.cur.fn === 'showJoust') { Arena.joustStrike(); UI.showJoust(); return; }
    if (G.state !== 'play' || P.dead || UI.modal) return;
    if (code === 'Escape') {
      if (Urban.mode) { Urban.stop(); return; }
      if (G.placing) { G.placing = null; return; }
      if (UI.isOpen()) { UI.close(); return; }
      UI.showSettings(); return;
    }
    const map = { KeyI: 'showInventory', KeyC: 'showCrafting', KeyB: 'showBuild', KeyK: 'showKingdom', KeyM: 'showMap', KeyJ: 'showDiary' };
    if (map[code]) {
      if (UI.cur && UI.cur.fn === map[code]) UI.close();
      else { G.placing = null; Urban.stop(); UI[map[code]](); }
      return;
    }
    if (MapView.isOpen) {
      if (code === 'Equal' || code === 'NumpadAdd') MapView.tool('in');
      else if (code === 'Minus' || code === 'NumpadSubtract') MapView.tool('out');
      else if (code === 'Space') MapView.tool('me');
      return;
    }
    if (UI.isOpen()) return;
    if (code === 'KeyE') this.interact();
    else if (code === 'Space') this.playerAction(false, true);
    else if (code === 'KeyF') this.eatBest();
    else if (code === 'KeyQ') this.cycleTool();
    else if (code === 'KeyR') Ride.toggle();
    else if (code === 'KeyZ') Moves.dodge();
    else if (code === 'KeyV') Moves.startHeavy();
    else if (code === 'KeyG') Sieges.deploy(Inv.count('ram') > 0 ? 'ram' : 'catapult');
    else if (code === 'KeyT') Orders.cycle();
    else if (code === 'KeyJ') UI.toggle('showDiary');
    else if (/^Digit[1-2]$/.test(code)) this.useQuick(+code.slice(5) - 1);
  },

  // ================================================================ atualização
  update(dt) {
    G.time += dt;
    if (G.time >= DAY_LEN) { G.time -= DAY_LEN; this.onNewDay(); }
    G.darkness = this.calcDarkness();
    this.updatePlayer(dt);

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.kind === 'ally') e.slot = i;
      if (!e.dead) e.update(dt);
    }
    for (const e of G.ents) if (e.dead && e.npc && G.spawned.get(e.npc.id) === e) G.spawned.delete(e.npc.id);
    G.ents = G.ents.filter(e => !e.dead);

    for (const [i, t] of World.shakes) { if (t - dt <= 0) World.shakes.delete(i); else World.shakes.set(i, t - dt); }
    for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt; }
    G.parts = G.parts.filter(p => p.life > 0);
    for (const t of G.texts) { t.y -= 28 * dt; t.life -= dt; }
    G.texts = G.texts.filter(t => t.life > 0);

    const T_ = G.timers;
    T_.spawn -= dt; T_.amb -= dt; T_.regrow -= dt; T_.hud -= dt;
    if (!G.dungeon) {
      if (T_.spawn <= 0) { T_.spawn = 1.5; this.spawnWild(); }
      if (T_.amb <= 0) { T_.amb = 1; this.ambient(); }
      if (T_.regrow <= 0) { T_.regrow = 1; World.updateRegrow(1, P.x, P.y); }
    }
    if (!G.dungeon) this.updateSiege(dt);
    WorldEvents.update(dt);
    Ranged.update(dt);
    Battles.update();
    Caravans.update(dt);
    Families.update(dt); Chiefdom.update(dt); Urban.update();
    Sieges.update(dt); Arena.update();
    this.progT = (this.progT || 0) - dt;
    if (this.progT <= 0) {
      this.progT = 2;
      Progress.check();
      if (!G.dungeon && World.islands.some(is => U.dist(P.x / TILE, P.y / TILE, is.x, is.y) < is.r)) G.stats.islands = 1;
    }
    Ride.follow(dt);
    Season.weather(dt);
    this.updateAudio(dt);

    // câmera (com zoom suave até o nível escolhido na roda do mouse)
    const want = this.zoomStep();
    this.zoom = this.zoom || want;
    this.zoom += (want - this.zoom) * Math.min(1, dt * 10);
    if (Math.abs(want - this.zoom) < 0.002) this.zoom = want;
    const zm = this.zoom, cw = this.canvas.width / zm, ch = this.canvas.height / zm;
    G.cam.x = U.clamp(P.x - cw / 2, 0, Math.max(0, WORLD_W * TILE - cw));
    G.cam.y = U.clamp(P.y - 16 - ch / 2, 0, Math.max(0, WORLD_H * TILE - ch));
    G.mouse.wx = G.mouse.x / zm + G.cam.x; G.mouse.wy = G.mouse.y / zm + G.cam.y;

    // mudança de território
    if (G.ping && U.dist(P.x / TILE, P.y / TILE, G.ping.x, G.ping.y) < 1.6) {
      UI.banner('📍 Destino alcançado');
      UI.msg('Você chegou a: ' + G.ping.name + '.', 'gold');
      G.ping = null;
    }
    const z = G.dungeon ? -1 : World.terrAt(P.x, P.y);
    if (z !== G.zone && !G.dungeon) {
      if (G.zone !== -2) UI.banner(z >= 0 ? CIV_DEFS[z].name : 'Terras Selvagens');
      G.zone = z;
    }
    if (T_.hud <= 0) {
      T_.hud = 0.12;
      const npc = this.nearestNpc();
      const s = npc ? null : this.nearestInteract();
      const boat = s || npc ? null : this.boatAction();
      UI.prompt(Urban.mode ? Urban.prompt() : G.placing ? `Posicionando <b>${BUILDINGS[G.placing].name}</b> — clique para construir · botão direito/Esc cancela`
        : P.fishing ? (P.fishing.state === 'bite' ? '<b>❗ O peixe mordeu! Clique ou aperte Espaço AGORA!</b>' : '🎣 Pescando... espere o peixe morder (andar recolhe a linha)')
        : npc ? `${npc.npc.name} - Interagir` : s ? `${this.interactName(s)} - Interagir` : boat ? 'Barco - Interagir' : null);
    }
  },

  updatePlayer(dt) {
    Moves.update(dt);
    P.atkCd -= dt; P.hurt -= dt; P.swing = Math.max(0, P.swing - dt); P.anim += dt;
    let dx = 0, dy = 0;
    const k = G.keys;
    if (k.KeyW || k.ArrowUp) dy -= 1;
    if (k.KeyS || k.ArrowDown) dy += 1;
    if (k.KeyA || k.ArrowLeft) dx -= 1;
    if (k.KeyD || k.ArrowRight) dx += 1;
    // controle analógico (gamepad ou joystick de toque)
    const an = G.padMove || G.touchMove;
    if (an && !dx && !dy) { dx = an.x; dy = an.y; }
    P.moving = !!(dx || dy) && !(P.dodgeT > 0);
    const sprint = (k.ShiftLeft || k.ShiftRight || G.touchSprint) && P.moving && P.stamina > 1;
    if (P.moving && P.fishing) { P.fishing = null; UI.msg('Você recolheu a linha.'); }
    const heavy = Store.over();
    const run = sprint && !heavy;
    if (P.moving) {
      const L = Math.hypot(dx, dy);
      const terrain = P.mounted ? Math.max(0.7, World.speedAt(P.x, P.y)) : World.speedAt(P.x, P.y);
      const L2 = an && !k.KeyW && !k.KeyS && !k.KeyA && !k.KeyD ? Math.min(1, L * 1.15) : 1; // inclinação do analógico
      const slow = (P.blocking ? 0.45 : 1) * (P.charging ? 0.65 : 1) * (Farm.has('mead') ? 1.1 : 1);
      const sp = (P.sailing ? 175 : 135 * terrain * Ride.speed()) * (run ? 1.6 : 1) * (heavy ? 0.5 : 1) * slow * Math.min(1, L2) * dt;
      moveEnt(P, dx / L * sp, dy / L * sp);
      if (dx) P.dir = dx < 0 ? -1 : 1;
      P.mdx = dx; P.mdy = dy;
      // passos
      P.stepT -= dt * (run ? 1.5 : 1);
      if (P.stepT <= 0 && !P.sailing) {
        P.stepT = P.mounted ? 0.24 : 0.34;
        const t = World.tile(Math.floor(P.x / TILE), Math.floor((P.y - 4) / TILE));
        Sound.play(P.mounted ? 'gallop' : 'step', { surface: t === T.WATER && Season.idx() !== 3 ? 'water' : t === T.SNOW || Season.idx() === 3 ? 'snow' : t === T.ROAD || t === T.BRIDGE || t === T.CFLOOR ? 'road' : 'grass' });
      }
    }
    if (heavy && P.moving && G.realTime - (this.heavyMsg || 0) > 15) { this.heavyMsg = G.realTime; UI.msg(`Você está sobrecarregado (${Store.weight()}/${Store.capacity()}). Guarde itens num baú ou compre um cavalo.`, 'bad'); }
    if (run) P.stamina = Math.max(0, P.stamina - 20 * dt);
    else if (!P.blocking) P.stamina = Math.min(100, P.stamina + 14 * dt * (Farm.has('vigor') ? 2 : 1));

    // no inverno a fome aperta, a menos que você esteja bem agasalhado
    const cold = Season.winter() && !G.dungeon && !['wolf_cloak', 'dragon_mail'].includes(P.equip.torso);
    if (cold && G.realTime - (this.coldMsg || 0) > 90) { this.coldMsg = G.realTime; UI.msg('❄️ Você está com frio e sente mais fome. Um Manto de Pele de Lobo protege do inverno.'); }
    P.hunger = Math.max(0, P.hunger - dt * (run ? 0.4 : 0.22) * (cold ? 1.4 : 1) * DIFFICULTY[G.diff || 'normal'].hunger);
    if (P.hunger <= 0) {
      P.hp -= dt * 1.2;
      if (G.realTime - (this.starveMsg || 0) > 12) { this.starveMsg = G.realTime; UI.msg('Você está faminto! Coma algo (F).', 'bad'); }
      if (P.hp <= 0) this.playerDie('de fome');
    } else if (P.hunger > 30 && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + dt * 0.6 * (Farm.has('regen') ? 3 : Farm.has('mead') || Farm.has('blessed') ? 2 : 1));

    this.updateFishing(dt);
    if ((G.keys.Space || G.mouse.down) && !P.charging && P.atkCd <= 0 && !G.placing && !Urban.mode && !P.blocking) this.playerAction(G.mouse.down, false);
  },

  // ================================================================ ações do jogador
  // fresh = clique/tecla acabou de ser pressionado (não é segurar)
  playerAction(useMouse, fresh) {
    if (P.fishing) { if (fresh) this.reelIn(); return; }
    if (P.atkCd > 0) return;
    const aimM = Math.atan2(G.mouse.wy - (P.y - 14), G.mouse.wx - P.x);
    // arco: atira no alvo mais próximo à frente (ou na direção do mouse)
    const wep = P.equip.weapon && ITEMS[P.equip.weapon];
    if (wep && wep.ranged) {
      let tgt = null, bd = 11 * TILE;
      for (const e of G.ents) {
        if (e.dead || !canHit(e)) continue;
        const d = U.dist(P.x, P.y, e.x, e.y);
        if (d > bd) continue;
        if (useMouse && U.angDiff(Math.atan2(e.y - P.y, e.x - P.x), aimM) > 0.35) continue;
        bd = d; tgt = e;
      }
      const overObj = useMouse && World.inb(Math.floor(G.mouse.wx / TILE), Math.floor(G.mouse.wy / TILE)) && World.obj[World.idx(Math.floor(G.mouse.wx / TILE), Math.floor(G.mouse.wy / TILE))]
        && U.dist(P.x, P.y, G.mouse.wx, G.mouse.wy) < 2.2 * TILE;
      if (tgt || (useMouse && !overObj)) {
        const aim = tgt ? Math.atan2(tgt.y - 14 - (P.y - 16), tgt.x - P.x) : aimM;
        this.ranged = true;
        Ranged.shoot(aim);
        return;
      }
    }
    // 1) criatura ao alcance
    let target = null, td = 1e9;
    for (const e of G.ents) {
      if (e.dead || !canHit(e)) continue;
      const d = U.dist(P.x, P.y - 10, e.x, e.y - 10);
      if (d > 40 + e.r) continue;
      if (useMouse && U.angDiff(Math.atan2(e.y - P.y, e.x - P.x), aimM) > 1.4) continue;
      if (d < td) { td = d; target = e; }
    }
    if (target) {
      P.aim = Math.atan2(target.y - P.y, target.x - P.x);
      P.dir = target.x < P.x ? -1 : 1;
      P.swing = 0.25; P.toolAnim = null;
      const tired = P.stamina < 4;
      P.stamina = Math.max(0, P.stamina - 4);
      P.atkCd = tired ? 0.9 : 0.45;
      Sound.play('swing');
      this.damage(target, wep && wep.ranged ? 3 : this.pDmg(), P);
      return;
    }
    // 1b) portão do castelo sitiado
    if (Sieges.playerNearGate()) {
      P.swing = 0.25; P.atkCd = 0.6; P.stamina = Math.max(0, P.stamina - 4); Sound.play('swing');
      Sieges.hitGate(this.pDmg() * 0.5, P);
      return;
    }
    // 2) pesca, se a vara estiver empunhada
    if (P.equip.tool && ITEMS[P.equip.tool].tool === 'rod') { if (fresh) this.castLine(useMouse, aimM); return; }
    if (P.sailing) return;
    if (P.mounted) { if (fresh && G.realTime - (this.mountMsg || 0) > 3) { this.mountMsg = G.realTime; UI.msg('Desmonte (R) para coletar recursos.'); } return; }
    // 3) lavoura: enxada (arar/plantar/colher) e regador
    const ptool = P.equip.tool && ITEMS[P.equip.tool].tool;
    {
      let fx = Math.floor((P.x + Math.cos(useMouse ? aimM : (P.dir > 0 ? 0 : Math.PI)) * 26) / TILE), fy = Math.floor((P.y - 8) / TILE);
      if (useMouse) { const mx = Math.floor(G.mouse.wx / TILE), my = Math.floor(G.mouse.wy / TILE); if (U.dist(mx + 0.5, my + 0.5, P.x / TILE, (P.y - 8) / TILE) < 2.3) { fx = mx; fy = my; } }
      if ((ptool === 'hoe' || ptool === 'water') && Farm.use(ptool, fx, fy)) { P.swing = 0.25; P.atkCd = 0.4; P.toolAnim = ptool === 'hoe' ? 'pick' : null; return; }
      const pl = World.inb(fx, fy) && G.plots[World.idx(fx, fy)];
      if (pl && pl.crop && pl.stage >= CROPS[pl.crop].days && !World.obj[World.idx(fx, fy)]) { Farm.harvest(World.idx(fx, fy)); P.atkCd = 0.4; return; }
    }
    // 4) recurso
    let ti = -1;
    const ptx = P.x / TILE, pty = (P.y - 8) / TILE;
    if (useMouse) {
      const mx = Math.floor(G.mouse.wx / TILE), my = Math.floor(G.mouse.wy / TILE);
      if (World.inb(mx, my) && World.obj[World.idx(mx, my)] && U.dist(mx + 0.5, my + 0.5, ptx, pty) < 1.9) ti = World.idx(mx, my);
    }
    if (ti < 0) {
      let bd = 1.7;
      const face = useMouse ? aimM : (P.dir > 0 ? 0 : Math.PI);
      for (let y = Math.floor(pty) - 2; y <= Math.floor(pty) + 2; y++) for (let x = Math.floor(ptx) - 2; x <= Math.floor(ptx) + 2; x++) {
        if (!World.inb(x, y) || !World.obj[World.idx(x, y)]) continue;
        const d = U.dist(x + 0.5, y + 0.5, ptx, pty) + U.angDiff(Math.atan2(y + 0.5 - pty, x + 0.5 - ptx), face) * 0.25;
        if (d < bd) { bd = d; ti = World.idx(x, y); }
      }
    }
    if (ti >= 0) {
      const tx = ti % WORLD_W, ty = (ti / WORLD_W) | 0;
      P.aim = Math.atan2((ty + 0.5) * TILE - (P.y - 14), (tx + 0.5) * TILE - P.x);
      P.dir = (tx + 0.5) * TILE < P.x ? -1 : 1;
      P.swing = 0.25; P.atkCd = 0.42;
      const need = OBJ[World.obj[ti]].tool;
      if (need && P.equip.tool2 && ITEMS[P.equip.tool2].tool === need && !(P.equip.tool && ITEMS[P.equip.tool].tool === need)) { const a = P.equip.tool; P.equip.tool = P.equip.tool2; P.equip.tool2 = a; }
      P.toolAnim = need && P.equip.tool && ITEMS[P.equip.tool].tool === need ? need : null;
      this.gather(ti);
      return;
    }
    if (useMouse) { P.aim = aimM; P.dir = Math.cos(aimM) < 0 ? -1 : 1; P.swing = 0.25; P.atkCd = 0.35; P.toolAnim = null; }
  },

  gather(i) {
    const type = World.obj[i], o = OBJ[type];
    const tool = o.tool ? this.toolFor(o.tool) : { tier: 0, power: 1 };
    const tx = i % WORLD_W, ty = (i / WORLD_W) | 0;
    const px = (tx + 0.5) * TILE, py = (ty + 0.3) * TILE;
    // ferramenta melhor na mochila, mas não empunhada
    const better = o.tool && this.toolList().filter(k => ITEMS[k].tool === o.tool && ITEMS[k].tier > tool.tier).pop();
    if (tool.tier < o.min) {
      if (G.realTime - G.lastWarn > 2) {
        G.lastWarn = G.realTime;
        const tname = `${o.tool === 'axe' ? 'um Machado' : 'uma Picareta'} de ${TIER_NAMES[o.min]} ou melhor`;
        UI.msg(better && ITEMS[better].tier >= o.min ? `Empunhe ${ITEMS[better].name} para isso — aperte Q para trocar a ferramenta.` : `${o.name} exige ${tname}.`, 'bad');
      }
      this.addText(px, py - 10, '✖', '#ff6b6b');
      return;
    }
    if (better && G.realTime - (this.toolHint || 0) > 20) {
      this.toolHint = G.realTime;
      UI.msg(`Dica: empunhe ${ITEMS[better].name} (tecla Q) para trabalhar mais rápido.`);
    }
    World.objHp[i] = Math.max(0, World.objHp[i] - tool.power);
    World.shake(i);
    Sound.play(o.tool === 'axe' ? 'chop' : o.tool === 'pick' ? 'mine' : 'pickup');
    if (World.objHp[i] <= 0) { Progress.add(o.tree ? 'trees' : o.tool === 'pick' ? 'ores' : 'plants'); if (type === 16) Progress.add('gems'); }
    this.burst(px, py, o.pc, 5);
    if (World.objHp[i] > 0) return;
    let k = 0;
    for (const res in o.drops) {
      const [a, b] = o.drops[res];
      const n = U.rint(a, b) + (tool.tier >= 3 && res !== 'stone' ? 1 : 0);
      if (n <= 0) continue;
      Inv.add(res, n);
      this.addText(px, py - 14 - k * 14, `+${n} ${ITEMS[res].name}`, '#ffe9a8');
      k++;
    }
    this.gainXp(1);
    if (o.tool) Sound.play('pickup');
    World.removeObj(i);
    this.burst(px, py, o.pc, 12);
  },

  interactLabel(s) {
    switch (s.type) {
      case 'cabin': return 'Cabana — salvar, dormir e cozinhar';
      case 'house': return 'Casa — salvar e dormir';
      case 'manor': return 'Casarão — salvar e dormir';
      case 'chest': return 'Baú — guardar itens';
      case 'coop': return `Galinheiro — ${(s.animals && s.animals.chicken) || 0} galinhas`;
      case 'pen': return 'Curral — vacas e ovelhas';
      case 'beehive': return 'Colmeia — recolher mel';
      case 'ptavern': return 'Sua Taverna — estoque e lucros';
      case 'oven': return 'Forno a Lenha — cozinhar';
      case 'brewery': return 'Cervejaria — fabricar bebidas';
      case 'stable': return 'Estábulo — cavalos e carroças';
      case 'cave': return `Entrar: ${s.cname}${G.dungeons[s.cave] && G.dungeons[s.cave].cleared ? ' (limpa)' : ''}`;
      case 'cave_exit': return 'Sair da caverna';
      case 'tchest': return s.opened ? 'Baú vazio' : 'Abrir o baú de tesouro';
      case 'campfire': return 'Fogueira — cozinhar';
      case 'workbench': return 'Bancada — criar';
      case 'forge': return 'Forja — forjar';
      case 'farm': return 'Fazenda';
      case 'barracks': return 'Quartel — treinar soldados';
      case 'store': case 'smith': case 'lumber': case 'quarry': return `${SHOPS[s.type].icon} ${SHOPS[s.type].name} de ${World.villages[s.village].name}`;
      case 'tavern': return 'Taverna de ' + World.villages[s.village].name;
      case 'castle': return 'Castelo — ' + CIV_DEFS[s.owner].name;
      case 'fmill': case 'fshop': case 'fforge': case 'ffarm': case 'fvine': return Families.bizName(s);
      case 'chapel': return '⛪ Capela de ' + (World.villages[s.village] ? World.villages[s.village].name : '');
      case 'cathedral': return '⛪ Catedral de ' + CIV_DEFS[s.owner].short;
      case 'shrine': return `🕯️ ${s.sname}${G.shrines && G.shrines[s.shrine] ? ' (visitado)' : ''}`;
      case 'dig': return '⛏️ Cavar o tesouro enterrado (picareta ou enxada)';
      case 'arena': return '🏟️ Arena de ' + CIV_DEFS[s.owner].short + (Arena.tourney() && Arena.tourney().ci === s.owner ? ' — GRANDE TORNEIO!' : '');
    }
    if (BIZ_TYPES[s.type] && s.owner === 'player') return `💼 ${BUILDINGS[s.type].name} — ${Biz.workerCount(s)}/${BIZ_TYPES[s.type].slots} funcionários`;
    return '';
  },
  // só o nome da coisa (sem emoji e sem a explicação depois do travessão)
  interactName(s) {
    switch (s.type) {
      case 'cave': return s.cname;
      case 'cave_exit': return 'Saída da caverna';
      case 'tchest': return 'Baú de tesouro';
      case 'dig': return 'Tesouro enterrado';
      case 'castle': return 'Castelo de ' + CIV_DEFS[s.owner].short;
      case 'shrine': return s.sname;
    }
    return this.interactLabel(s).replace(/^[^\p{L}\p{N}]+/u, '').split(' — ')[0].trim();
  },
  nearestInteract() {
    const ptx = P.x / TILE, pty = (P.y - 6) / TILE;
    let best = null, bd = 1.3;
    for (const s of World.structs) {
      if (s.hidden || !this.interactLabel(s)) continue;
      if (Math.abs(s.x - ptx) > 12 || Math.abs(s.y - pty) > 12) continue;
      const dx = Math.max(s.x - ptx, 0, ptx - (s.x + s.w)), dy = Math.max(s.y - pty, 0, pty - (s.y + s.h));
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  },
  nearestNpc() {
    let best = null, bd = 1.9 * TILE;
    for (const e of G.ents) {
      if (e.dead || e.sleeping || !e.npc || e.npc.hostile) continue;
      const d = U.dist(e.x, e.y, P.x, P.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  },
  interact() {
    const n = this.nearestNpc();
    if (n) { UI.showTalk(n.npc.id); return; }
    const s = this.nearestInteract();
    if (!s) {
      const car = G.ents.find(c => c.kind === 'caravan' && !c.dead && !c.hostileToPlayer && U.dist(c.x, c.y, P.x, P.y) < 2.4 * TILE);
      if (car) { UI.showCaravan(car); return; }
      const b = this.boatAction(); if (b) b.run(); return;
    }
    switch (s.type) {
      case 'cabin': case 'house': case 'manor': UI.showRest(s.id); break;
      case 'chest': UI.showChest(s.id); break;
      case 'coop': case 'pen': case 'beehive': UI.showAnimals(s.id); break;
      case 'ptavern': UI.showPTavern(s.id); break;
      case 'fmill': case 'fshop': case 'fforge': case 'ffarm': case 'fvine': UI.showFamily(s.fam); break;
      case 'chapel': case 'cathedral': UI.showChapel(s.id); break;
      case 'shrine': Faith.visitShrine(s); break;
      case 'arena': UI.showArena(s.owner); break;
      case 'biz_farm': case 'biz_mill': case 'biz_lumber': case 'biz_quarry': case 'biz_mine': case 'biz_smithy': case 'biz_shop': UI.showBiz(s.id); break;
      case 'oven': UI.showCrafting('cozinha'); break;
      case 'brewery': UI.showCrafting('cervejaria'); break;
      case 'stable': UI.showStable(); break;
      case 'cave': Dungeon.enter(s); break;
      case 'cave_exit': Dungeon.exit(false); break;
      case 'tchest': Dungeon.openChest(s); break;
      case 'campfire': UI.showCrafting('fogueira'); break;
      case 'workbench': UI.showCrafting('bancada'); break;
      case 'forge': UI.showCrafting('forja'); break;
      case 'farm': UI.showFarm(); break;
      case 'barracks': UI.showBarracks(); break;
      case 'store': case 'smith': case 'lumber': case 'quarry': UI.showShop(s.type, s.village); break;
      case 'tavern': UI.showTavern(s.id); break;
      case 'castle': if (G.civs[s.owner].ruler === 'player') UI.showKingdom(s.owner); else UI.showCastle(s.owner); break;
      case 'dig': WorldEvents.dig(s); break;
    }
  },
  nearStation(st) {
    const types = STATIONS[st].types;
    return World.structs.some(s => s.owner === 'player' && types.includes(s.type) &&
      U.dist(P.x, P.y, (s.x + s.w / 2) * TILE, (s.y + s.h / 2) * TILE) < 4.5 * TILE);
  },

  equip(k, slot) {
    const it = ITEMS[k]; if (!it.slot || Inv.count(k) <= 0) return;
    slot = slot || it.slot;
    if (it.slot === 'tool' && !slot.startsWith('tool')) return;
    if (it.slot === 'tool' && slot === 'tool' && P.equip.tool2 === k) P.equip.tool2 = null;
    if (slot === 'tool2' && P.equip.tool === k) P.equip.tool = null;
    for (let q = 0; q < P.quick.length; q++) if (P.quick[q] === k) P.quick[q] = null;
    P.equip[slot] = k; UI.msg('Equipado: ' + it.name);
  },
  eat(k) {
    const it = ITEMS[k];
    if ((!it.food && !it.heal) || Inv.count(k) <= 0) return;
    Inv.add(k, -1);
    P.hunger = Math.min(100, P.hunger + (it.food || 0));
    P.hp = Math.min(P.maxHp, P.hp + (it.heal || 0));
    this.addText(P.x, P.y - 44, it.food ? `+${it.food} 🍎` : `+${it.heal} ❤`, '#9be37a');
    if (it.buff) { Farm.addBuff(it.buff); if (['beer', 'mead', 'wine'].includes(k)) Progress.add('drinks'); }
  },

  // ================================================================ pesca
  castLine(useMouse, aim) {
    const px = P.x / TILE, py = (P.y - 8) / TILE;
    const fishable = (x, y) => World.inb(x, y) && (World.tile(x, y) === T.WATER || World.tile(x, y) === T.DEEP);
    let best = null;
    if (useMouse) {
      const mx = Math.floor(G.mouse.wx / TILE), my = Math.floor(G.mouse.wy / TILE);
      if (fishable(mx, my) && U.dist(mx + 0.5, my + 0.5, px, py) < 4) best = { x: mx, y: my };
    }
    if (!best) {
      let bd = 3.5;
      const face = useMouse ? aim : (P.dir > 0 ? 0 : Math.PI);
      for (let y = Math.floor(py) - 3; y <= Math.floor(py) + 3; y++) for (let x = Math.floor(px) - 3; x <= Math.floor(px) + 3; x++) {
        if (!fishable(x, y)) continue;
        const d = U.dist(x + 0.5, y + 0.5, px, py);
        if (P.sailing && d < 1.2) continue;
        const sc = d + U.angDiff(Math.atan2(y + 0.5 - py, x + 0.5 - px), face) * 0.4;
        if (sc < bd) { bd = sc; best = { x, y }; }
      }
    }
    if (!best) { UI.msg('Não há água por perto. Pesque em rios, lagos ou no mar.', 'bad'); P.atkCd = 0.5; return; }
    const i = World.idx(best.x, best.y);
    P.fishing = {
      x: best.x + 0.5, y: best.y + 0.5, state: 'wait', t: U.rnd(2.5, 6),
      water: World.tiles[i] === T.DEEP ? 'deep' : World.elev[i] < 0.33 ? 'sea' : 'river',
    };
    P.aim = Math.atan2(P.fishing.y * TILE - P.y, P.fishing.x * TILE - P.x);
    P.dir = P.fishing.x * TILE < P.x ? -1 : 1;
    P.atkCd = 0.4;
    this.burst(P.fishing.x * TILE, P.fishing.y * TILE, '#bfe3f5', 6);
  },
  updateFishing(dt) {
    const f = P.fishing;
    if (!f) return;
    f.t -= dt;
    if (f.state === 'wait' && f.t <= 0) {
      f.state = 'bite'; f.t = 0.9;
      this.burst(f.x * TILE, f.y * TILE, '#ffffff', 10);
    } else if (f.state === 'bite' && f.t <= 0) {
      f.state = 'wait'; f.t = U.rnd(2.5, 6);
      UI.msg('O peixe escapou... espere outra mordida.');
    }
  },
  reelIn() {
    const f = P.fishing;
    P.fishing = null; P.atkCd = 0.5; P.swing = 0.25;
    if (f.state !== 'bite') { UI.msg('Você puxou a linha cedo demais.'); return; }
    const tables = {
      deep:  [['cod', 50], ['sardine', 32], ['goldfish', 6], ['old_boot', 12]],
      sea:   [['sardine', 38], ['carp', 36], ['trout', 10], ['goldfish', 4], ['old_boot', 12]],
      river: [['trout', 55], ['carp', 30], ['goldfish', 5], ['old_boot', 10]],
    };
    let r = Math.random() * 100, got = 'old_boot';
    for (const [k, w] of tables[f.water]) { if (r < w) { got = k; break; } r -= w; }
    Inv.add(got, 1);
    this.addText(P.x, P.y - 50, `+1 ${ITEMS[got].name}`, got === 'goldfish' ? '#ffd54a' : '#ffe9a8');
    if (got === 'goldfish') { UI.msg('✨ Um raro Peixe-Dourado! Vale muito nos mercados.', 'gold'); Progress.add('goldfish'); }
    if (got !== 'old_boot') Progress.add('fish');
    this.gainXp(got === 'old_boot' ? 1 : 4);
  },

  // ================================================================ barco
  findNearTile(pred) {
    const px = P.x / TILE, py = (P.y - 8) / TILE;
    let best = null, bd = 1.6;
    for (let y = Math.floor(py) - 2; y <= Math.floor(py) + 2; y++) for (let x = Math.floor(px) - 2; x <= Math.floor(px) + 2; x++) {
      if (!World.inb(x, y) || !pred(x, y)) continue;
      const d = U.dist(x + 0.5, y + 0.5, px, py);
      if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  },
  boatAction() {
    if (P.sailing) {
      const land = this.findNearTile((x, y) => !World.isWater(World.tile(x, y)) && !World.blocked(x, y, false));
      return land && { label: 'Desembarcar', run: () => {
        P.sailing = false; P.x = (land.x + 0.5) * TILE; P.y = (land.y + 0.8) * TILE;
        UI.msg('Você desembarcou. O barco volta para a mochila.');
      } };
    }
    if (Inv.count('boat') <= 0) return null;
    const water = this.findNearTile((x, y) => World.isWater(World.tile(x, y)) && World.tile(x, y) !== T.BRIDGE && !World.blocked(x, y, true));
    return water && { label: 'Embarcar no Barco a Remo', run: () => {
      P.sailing = true; P.fishing = null; P.x = (water.x + 0.5) * TILE; P.y = (water.y + 0.8) * TILE;
      UI.msg('🛶 Você está navegando! Aperte E perto da margem para desembarcar.', 'gold');
    } };
  },
  eatBest() {
    const foods = Object.keys(P.inv).filter(k => ITEMS[k].food);
    if (!foods.length) { UI.msg('Você não tem comida!', 'bad'); return; }
    const hurt = P.hp < P.maxHp * 0.6;
    foods.sort((a, b) => hurt ? ITEMS[b].heal - ITEMS[a].heal : ITEMS[b].food - ITEMS[a].food);
    this.eat(foods[0]);
    UI.msg('Você comeu: ' + ITEMS[foods[0]].name);
  },
  craft(ri, n) {
    const r = RECIPES[ri];
    if (r.station && !this.nearStation(r.station)) return;
    let made = 0;
    for (let k = 0; k < n && Inv.has(r.cost); k++) { Inv.pay(r.cost); Inv.add(r.out, r.n); made += r.n; }
    if (made) {
      UI.msg(`Você criou ${made}× ${ITEMS[r.out].name}.`, 'gold');
      Progress.add('crafted', made);
      this.gainXp(made * 2);
      const it = ITEMS[r.out];
      const val = x => x ? (x.dmg || x.def || x.tier || 0) : -1;
      const cur = P.equip[it.slot] && ITEMS[P.equip[it.slot]];
      if (it.slot && (!cur || (cur.tool === it.tool && val(it) > val(cur)) || (!it.tool && val(it) > val(cur)))) this.equip(r.out);
    }
  },

  // ================================================================ construção
  startPlacing(k) { G.placing = k; },
  canBuild(k, tx, ty) {
    const b = BUILDINGS[k];
    for (let y = ty; y < ty + b.h; y++) for (let x = tx; x < tx + b.w; x++) {
      if (!World.inb(x, y)) return 'Fora do mapa';
      const i = World.idx(x, y), t = World.tiles[i];
      if (!TINFO[t].walk || t === T.WATER || t === T.BRIDGE) return 'Terreno inválido';
      if (t === T.ROAD) return 'Não construa sobre a estrada';
      if (World.obj[i]) return 'Remova árvores/rochas primeiro';
      if (World.sgrid[i] >= 0) return 'Já há uma construção aqui';
    }
    const cx = (tx + b.w / 2) * TILE, cy = (ty + b.h / 2) * TILE;
    if (U.dist(cx, cy, P.x, P.y) > 8 * TILE) return 'Longe demais';
    if (b.blocks && P.x + P.r > tx * TILE && P.x - P.r < (tx + b.w) * TILE && P.y > ty * TILE && P.y - P.r < (ty + b.h) * TILE) return 'Você está no caminho';
    if (!Urban.authority(Math.floor(tx + b.w / 2), Math.floor(ty + b.h / 2))) for (const s of World.structs) {
      if (s.hidden || (typeof s.owner !== 'number' && s.owner !== 'bandit')) continue;
      if (tx < s.x + s.w + 2 && tx + b.w > s.x - 2 && ty < s.y + s.h + 2 && ty + b.h > s.y - 2) return 'Perto demais de uma cidade';
    }
    return null;
  },
  placeBuilding() {
    const k = G.placing, b = BUILDINGS[k];
    const tx = Math.floor(G.mouse.wx / TILE - b.w / 2 + 0.5), ty = Math.floor(G.mouse.wy / TILE - b.h / 2 + 0.5);
    const err = this.canBuild(k, tx, ty);
    if (err) { UI.msg(err, 'bad'); return; }
    if (!Inv.has(b.cost)) { UI.msg('Recursos insuficientes para ' + b.name + '.', 'bad'); G.placing = null; return; }
    Inv.pay(b.cost);
    World.addStruct(k, tx, ty, b.w, b.h, 'player', { built: true });
    this.burst((tx + b.w / 2) * TILE, (ty + b.h / 2) * TILE, '#c9a978', 20);
    UI.msg(`${b.name} construída!`, 'gold');
    Progress.add('built'); if (!G.stats['b_' + k]) { G.stats['b_' + k] = 1; Progress.diary(`🏗️ Construiu: ${b.name}.`); }
    this.gainXp(5);
    const wall = k === 'wall_wood' || k === 'wall_stone';
    if (!wall || !Inv.has(b.cost)) G.placing = null;
  },

  // ================================================================ combate
  damage(target, amount, src) {
    if (target.dead) return;
    if (target === P) {
      Sound.play('hurt');
      // cada ponto de defesa reduz o dano proporcionalmente (22 de defesa = 58% menos dano)
      amount = Moves.filter(amount * DIFFICULTY[G.diff || 'normal'].dmg, src);
      if (amount <= 0) return;
      const d = Math.max(1, Math.round(amount * (0.85 + Math.random() * 0.3) * 40 / (40 + this.pDef() * 2.5)));
      if (src && src.faction === 'arena' && Arena.playerHit(d)) return;
      P.hp -= d; P.hurt = 0.25;
      this.addText(P.x, P.y - 40, '-' + d, '#ff5555');
      if (P.hp <= 0) this.playerDie();
      return;
    }
    let d = Math.max(1, Math.round(amount * (0.85 + Math.random() * 0.3)));
    if (target.npc && target.npc.capanga) d = Math.max(1, Math.round(d * 40 / (40 + People.capangaStats(target.npc).def * 2.5) * (STANCES[target.npc.stance] || STANCES.normal).taken));
    target.hp -= d; target.hurt = 0.2;
    Sound.play('hit', { vol: src === P ? 1 : 0.5 });
    this.addText(target.x, target.y - 38, '-' + d, src === P ? '#ffffff' : '#ffd0a0');
    this.burst(target.x, target.y - 14, '#b02020', 4);
    if (src) {
      const a = Math.atan2(target.y - src.y, target.x - src.x);
      moveEnt(target, Math.cos(a) * 8, Math.sin(a) * 8);
      if (target.kind === 'boar') target.provoked = true;
      if (target.npc && (src === P || fac(src) === 'player') && Court.enemyPerson(target.npc)) target.angry = true; // inimigo golpeado revida
      if (target.def.dmg > 0 && hostile(target, src)) target.target = src;
    }
    if (src === P && target.kind === 'rebel') { const r = Families.revolt(target.revolt); if (r && !r.side && G.civs[r.civ].ruler !== 'player') Families.joinRevolt(r, 'crown'); }
    if (target.hp <= 0) this.kill(target, src);
  },

  kill(e, src) {
    e.dead = true;
    this.burst(e.x, e.y - 12, '#8a1a1a', 14);
    const byPlayer = src === P || (src && fac(src) === 'player');
    if (byPlayer) {
      const d = e.def;
      let k = 0;
      for (const res in d.drops || {}) {
        const n = U.rint(d.drops[res][0], d.drops[res][1]);
        if (n > 0) { Inv.add(res, n); this.addText(e.x, e.y - 50 - k * 14, `+${n} ${ITEMS[res].name}`, '#ffe9a8'); k++; }
      }
      if (d.gold) { const g = U.rint(d.gold[0], d.gold[1]); P.gold += g; this.addText(e.x, e.y - 50 - k * 14, `+${g} 🪙`, '#ffd54a'); }
      if (d.xp) this.gainXp(d.xp);
      // capangas ganham experiência: quem deu o golpe final leva tudo; os que estão perto do jogador, um terço
      if (d.xp && src && src.npc && src.npc.capanga) People.capXp(src.npc, d.xp);
      else if (d.xp && src === P) for (const a of this.allies()) if (a.npc && U.dist(a.x, a.y, P.x, P.y) < 10 * TILE) People.capXp(a.npc, Math.ceil(d.xp / 3));
    }
    if (e.militia !== undefined) Chiefdom.killed(e);
    else if ((e.kind === 'guard') && e.civ >= 0) {
      const c = G.civs[e.civ];
      c.garrison = Math.max(0, c.garrison - 1);
    }
    if (e.kind === 'bandit') {
      if (byPlayer) for (const c of G.civs) this.addRelation(c.id, 0.5);
      if (e.camp && !e.camp.cleared) {
        e.camp.left--;
        if (e.camp.left <= 0) this.campCleared(e.camp);
      }
    }
    if (e.kind === 'lord') this.conquer(e.civ);
    if (e.def.boss) Dungeon.onBossKill(e);
    if (byPlayer && e.def.gold) Sound.play('coin');
    if (e.npc) People.die(e.npc, byPlayer && !e.npc.capanga ? 'morto por você' : 'em combate');
    if (byPlayer) { Progress.add('kill_' + e.kind); if (e.def.boss) Progress.add('bosses'); }
    if (e.kind === 'caravan' && e.car && byPlayer) Caravans.loot(e.car, e);
    if (e.kind === 'rebel') Families.rebelKilled(e);
    if (e.tag === 'wev') WorldEvents.onKill(e);
    if (e.assault !== undefined) Sieges.soldierKilled(e);
    if (e.kind === 'caravan' && e.car && !byPlayer) { if (e.car.owner === 'player') Market.lost(e.car); else e.car.done = true; }
    if (byPlayer && e.kind === 'bandit') Court.addService(World.terr[World.idx(Math.floor(e.x / TILE), Math.floor(e.y / TILE))], 1);
  },

  campCleared(camp) {
    Progress.add('camps');
    camp.cleared = true; camp.respawnDay = G.day + 4 * ECON_DAYS;
    const g = U.rint(40, 90);
    P.gold += g; Inv.add('iron_bar', 2);
    for (const c of G.civs) this.addRelation(c.id, 6);
    UI.banner('🏕️ Acampamento de bandidos destruído!');
    UI.msg(`Você saqueou o acampamento: +${g} 🪙 e 2 Barras de Ferro. Todos os reinos agradecem (+6 relação).`, 'gold');
  },

  playerDie(cause) {
    if (P.dead) return;
    if (!DIFFICULTY[G.diff || 'normal'].gameover) {
      // modo fácil: acorda em casa e perde parte do ouro
      if (G.dungeon) Dungeon.exit(true);
      const lost = Math.floor(P.gold * 0.25);
      P.gold -= lost; P.x = G.spawn.x; P.y = G.spawn.y; P.hp = P.maxHp; P.hunger = Math.max(P.hunger, 50); P.stamina = 100;
      P.sailing = false; P.fishing = null; P.mounted = false;
      if (G.siege) this.endSiege('O cerco fracassou.');
      for (const e of G.ents) if (e.kind !== 'ally' && U.dist(e.x, e.y, P.x, P.y) < 12 * TILE && e.def.dmg > 0 && hostile(e, P)) e.dead = true;
      UI.banner('☠️ Você caiu...'); UI.msg(`Você acordou em casa e perdeu ${lost} 🪙 (modo Fácil).`, 'bad');
      Sound.play('die');
      return;
    }
    P.dead = true; P.hp = 0; P.sailing = false; P.fishing = null;
    if (G.siege) this.endSiege(null);
    G.mouse.down = false; G.keys = {};
    UI.close();
    G.paused = true;
    Sound.play('die');
    this.lastCause = cause || 'em combate';
    Progress.diary(`✝ ${G.name} morreu ${this.lastCause} aos ${P.age} anos.`);
    UI.showGameOver(cause || 'em combate');
  },
  heirs() { return G.people.filter(p => p.alive && p.kin === 'child'); },
  continueAs(id) {
    if (G.dungeon) Dungeon.exit(true);
    P.mounted = false;
    const c = People.get(id);
    const oldName = G.name;
    const years = Math.max(0, 16 - c.age);
    if (years) { People.ageAll(years); G.day += years * 30; } // cada ano de vida dura um mês do calendário
    for (const p of G.people) {
      if (p === c) continue;
      if (p.kin === 'child') p.kin = 'sibling';
      else if (p.kin === 'sibling' || p.kin === 'parent') p.kin = null;
    }
    if (G.family.spouse !== null) { const sp = People.get(G.family.spouse); if (sp) { sp.spouse = null; sp.kin = 'parent'; } }
    G.family = { spouse: null, tryChild: false, dueDay: 0 };
    c.alive = false; c.becamePlayer = true;
    for (const e of G.ents) if (e.npc === c) e.dead = true;
    G.spawned.delete(c.id);
    G.name = c.name;
    Progress.endHero(this.lastCause || 'em combate');
    Progress.diary(`👑 ${c.name} assumiu o legado de ${oldName}.`);
    const lvl = Math.max(1, Math.floor(P.level / 2)) + (c.prof === 'scholar' ? 4 : 0);
    Object.assign(P, { sex: c.sex, age: c.age, hairBase: c.hair, skin: c.skin, dead: false, level: lvl, xp: 0, maxHp: 100 + (lvl - 1) * 10 });
    P.hp = P.maxHp; P.hunger = 80; P.stamina = 100; P.x = G.spawn.x; P.y = G.spawn.y;
    for (const civ of G.civs) if (civ.ruler === 'player') civ.rulerName = G.name;
    for (const a of this.allies()) { const sp = freeSpotNear(P.x, P.y, 50); a.x = sp.x; a.y = sp.y; a.target = null; }
    G.ents = G.ents.filter(e => e.kind === 'ally' || U.dist(e.x, e.y, P.x, P.y) > 14 * TILE || !hostile(e, P));
    UI.hideGameOver();
    G.paused = false;
    UI.banner(`👑 ${c.name} continua o legado de ${oldName}`);
    UI.msg(years ? `⏳ ${years} anos se passaram. ${c.name}, agora com ${c.age} anos, herdou tudo de ${oldName}.` : `${c.name} herdou tudo de ${oldName}: ouro, itens, construções e reinos.`, 'gold', true);
    this.save(null);
  },
  birth(name, sex) {
    const sp = G.family.spouse !== null ? People.get(G.family.spouse) : null;
    const c = People.create({
      name, sex, age: 0, rank: 'child', civ: -1, home: { type: 'player' }, surname: G.surname, fam: G.playerFam,
      hair: Math.random() < 0.5 || !sp ? P.hairBase : sp.hair, parents: ['player', sp ? sp.id : null], kin: 'child',
    });
    c.aff = 100; c.met = true;
    Progress.add('children'); Progress.diary(`👶 Nasceu ${name}.`);
    if (sp) sp.children.push(c.id);
    UI.banner(`👶 Nasceu ${sex === 'm' ? 'o' : 'a'} pequen${sex === 'm' ? 'o' : 'a'} ${name}!`);
    UI.msg(`${name} nasceu! ${sex === 'm' ? 'É um menino' : 'É uma menina'}. Se você morrer, poderá continuar a jornada como ${sex === 'm' ? 'ele' : 'ela'}.`, 'gold', true);
  },

  // ================================================================ criaturas
  spawn(kind, x, y, opts) { const c = new Creature(kind, x, y, opts); G.ents.push(c); return c; },
  spawnCapanga(p) {
    const s = freeSpotNear(P.x, P.y, 50);
    const e = this.spawn('ally', s.x, s.y, { leash: 30, npc: p });
    G.spawned.set(p.id, e);
    return e;
  },
  refreshCapanga(p) {
    const e = G.spawned.get(p.id);
    if (!e) return;
    const st = People.capangaStats(p);
    e.dmg = st.dmg; e.maxHp = st.hp; e.hp = Math.min(e.hp, st.hp);
  },
  newMercenary(civ) {
    const p = People.create({ rank: 'mercenary', civ: civ >= 0 ? civ : -1, age: U.rint(20, 45), home: { type: 'wild' }, aff: 30,
      trait: U.pick(['corajoso', 'leal', 'ganancioso', 'orgulhoso', 'alegre']) });
    p.capanga = true; p.met = true; p.oldHome = { type: 'wild' };
    p.equip.weapon = 'battle_axe'; p.equip.torso = 'leather_jerkin';
    this.spawnCapanga(p);
    return p;
  },

  spawnWild() {
    const far = 44 * TILE;
    for (const e of G.ents) {
      if (e.kind !== 'ally' && e.siegeOf < 0 && U.dist(e.x, e.y, P.x, P.y) > far) {
        e.dead = true;
        if (e.npc) G.spawned.delete(e.npc.id);
        if (e.camp) e.camp.active = Math.max(0, (e.camp.active || 1) - 1);
        if (e.tag) G.groups[e.tag] = Math.max(0, (G.groups[e.tag] || 1) - 1);
      }
    }
    const wild = G.ents.filter(e => !e.dead && (e.kind === 'deer' || e.kind === 'boar' || e.kind === 'wolf')).length;
    if (wild >= 14) return;
    const a = Math.random() * Math.PI * 2, d = U.rnd(16, 26) * TILE;
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (!World.inb(tx, ty) || World.blockedAt(x, y, 10)) return;
    const t = World.tile(tx, ty);
    const night = G.darkness > 0.3, r = Math.random();
    let kind = null;
    if (t === T.FOREST) kind = r < 0.3 + (night ? 0.25 : 0) ? 'wolf' : r < 0.75 ? 'deer' : 'boar';
    else if (t === T.GRASS) kind = r < (night ? 0.3 : 0.06) ? 'wolf' : r < 0.75 ? 'deer' : 'boar';
    else if (t === T.SNOW || t === T.HILL) kind = r < 0.45 ? 'wolf' : 'deer';
    if (!kind) return;
    const nearTown = World.capitals.some(c => U.dist(tx, ty, c.x, c.y) < 14) || World.villages.some(v => U.dist(tx, ty, v.x, v.y) < 10);
    if (kind === 'wolf' && (nearTown || (G.day === 1 && !night))) return;
    if (Season.winter() && kind === 'deer' && Math.random() < 0.4) kind = 'wolf';
    this.spawn(kind, x, y, { leash: 14, mult: kind === 'wolf' && Season.winter() ? 1.35 : 1 });
  },

  ambient() {
    const ptx = P.x / TILE, pty = P.y / TILE;
    // bandidos nos acampamentos
    for (const camp of World.camps) {
      if (camp.cleared) continue;
      const near = U.dist(ptx, pty, camp.x + 1.5, camp.y + 1.5) < 30;
      const alive = G.ents.filter(e => e.camp === camp && !e.dead).length;
      if (near && alive < camp.left) {
        const s = freeSpotNear((camp.x + 1.5) * TILE, (camp.y + 2) * TILE, 3 * TILE);
        this.spawn('bandit', s.x, s.y, { camp, leash: 8, archer: Math.random() < 0.3 });
      }
    }
    // guardas e aldeões
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c], civ = G.civs[c];
      if (U.dist(ptx, pty, cp.x, cp.y) < 32) {
        const max = Math.min(3, civ.garrison);
        this.ensureGroup('cap' + c, max, () => {
          const s = freeSpotNear((cp.door.x + 0.5) * TILE, (cp.door.y + 1.5) * TILE, 3 * TILE);
          return this.spawn('guard', s.x, s.y, { civ: c, leash: 7, tag: 'cap' + c, archer: Math.random() < 0.25 });
        });
      }
    }
    const spawnNpc = (p, x, y, leash, civ) => {
      const s = freeSpotNear(x + U.rnd(-1, 1) * TILE, y + U.rnd(-0.5, 0.5) * TILE, TILE * 2);
      const e = this.spawn('villager', s.x, s.y, { civ, npc: p, leash });
      G.spawned.set(p.id, e);
      return e;
    };
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      if (U.dist(ptx, pty, cp.x, cp.y) > 30) continue;
      for (const p of G.people) if (p.alive && p.rank === 'knight' && p.home.type === 'castle' && p.home.civ === c && !p.capanga && !G.spawned.has(p.id))
        spawnNpc(p, (cp.door.x + 0.5) * TILE, (cp.door.y + 2) * TILE, 6, c);
    }
    if (U.dist(P.x, P.y, G.spawn.x, G.spawn.y) < 26 * TILE) for (const p of G.people) {
      if (p.alive && p.home.type === 'player' && !p.capanga && !G.spawned.has(p.id)) spawnNpc(p, G.spawn.x, G.spawn.y + TILE, 4, -1);
    }
    World.villages.forEach((v, vi) => {
      if (U.dist(ptx, pty, v.x, v.y) > 30) return;
      // vila sob ataque de um reino inimigo
      if (v.raid && v.raid.until >= G.day && Diplo.atWar(v.raid.by, v.civ)) this.ensureGroup('raid' + vi, 4, () => {
        const a = Math.random() * Math.PI * 2;
        const s = freeSpotNear((v.x + Math.cos(a) * 9) * TILE, (v.y + Math.sin(a) * 7) * TILE, 3 * TILE);
        return this.spawn('guard', s.x, s.y, { civ: v.raid.by, leash: 14, tag: 'raid' + vi, archer: Math.random() < 0.3 });
      });
      // cada morador tem a sua casa (mendigos dormem na praça); de dia fica no trabalho ou perto de casa
      for (const p of People.residents(vi)) {
        if (G.spawned.has(p.id)) continue;
        const h = Homes.houseOf(p); // a casa da família (pode ainda não ter: aí fica pela praça)
        const work = { merchant: v.store, smith: v.smith, lumber: v.lumber, mason: v.quarry, innkeeper: v.tavern, priest: v.chapel }[p.rank];
        let e;
        if (work && !work.removed && p.age >= 14) e = spawnNpc(p, (work.x + work.w / 2) * TILE, (work.y + work.h + 0.8) * TILE, 1.5, v.civ);
        else if (h) e = spawnNpc(p, (h.x + h.w / 2) * TILE, (h.y + h.h + 0.9) * TILE, p.rank === 'hunter' ? 36 : p.rank === 'wanderer' ? 32 : 4.5, v.civ);
        else e = spawnNpc(p, (v.x + 0.5) * TILE, (v.y - 0.3) * TILE, p.rank === 'hunter' ? 36 : p.rank === 'wanderer' ? 32 : p.rank === 'beggar' ? 6 : 9, v.civ);
        e.house = h; e.vi = vi;
        Routine.placed(e);
      }
      if (!v.free && G.civs[v.civ].garrison > 0) this.ensureGroup('vg' + vi, 1, () => {
        const s = freeSpotNear((v.x + 0.5) * TILE, (v.y - 0.5) * TILE, 2 * TILE);
        return this.spawn('guard', s.x, s.y, { civ: v.civ, leash: 6, tag: 'vg' + vi });
      });
    });
    Biz.ambient(spawnNpc);
    Guards.ambient();
    Farm.ambient();
  },
  ensureGroup(tag, max, make) {
    const n = G.ents.filter(e => e.tag === tag && !e.dead).length;
    const key = 'next_' + tag;
    if (n < max && (G.groups[key] || 0) <= G.realTime) {
      for (let k = n === 0 ? max : 1; k > 0; k--) make();
      G.groups[key] = G.realTime + 25;
    }
  },

  // ================================================================ diplomacia e guerra
  tribute(ci) {
    if (P.gold < 100) return;
    Court.addService(ci, 3);
    P.gold -= 100; G.civs[ci].treasury += 100; this.addRelation(ci, 8);
    UI.msg(`${G.civs[ci].rulerName} aceita seu tributo.`, 'gold');
  },
  declareWar(ci) {
    const c = G.civs[ci];
    c.atWar = true; this.addRelation(ci, -60);
    if (Court.T().civ === ci) Court.loseTitle('você declarou guerra ao seu suserano');
    if (RoyalCourt.isMember(ci)) RoyalCourt.leave('você declarou guerra ao rei');
    for (const o of G.civs) if (o.id !== ci) this.addRelation(o.id, -8);
    UI.banner(`⚔️ Guerra contra ${CIV_DEFS[ci].short}!`);
    this.startSiege(ci);
  },
  startSiege(ci) {
    const cp = World.capitals[ci];
    if (U.dist(P.x / TILE, P.y / TILE, cp.x, cp.y) > 20) { UI.msg('Aproxime-se do castelo para iniciar o cerco.', 'bad'); return; }
    G.siege = { civ: ci, t: 0, lord: false };
    Sieges.start(G.siege);
    UI.msg(`O cerco a ${CIV_DEFS[ci].name} começou! Derrote os ${G.civs[ci].garrison} soldados da guarnição e depois o soberano.`, 'bad');
  },
  makePeace(ci) {
    const c = G.civs[ci];
    if (P.gold < 300) return;
    P.gold -= 300; c.treasury += 300; c.atWar = false; c.relation = Math.max(c.relation, -20);
    if (G.siege && G.siege.civ === ci) this.endSiege(null);
    UI.msg(`Paz selada com ${CIV_DEFS[ci].name}.`, 'gold', true);
  },
  updateSiege(dt) {
    const s = G.siege;
    if (!s) return;
    const c = G.civs[s.civ], cp = World.capitals[s.civ];
    const gx = (cp.door.x + 0.5) * TILE, gy = (cp.door.y + 1) * TILE;
    if (U.dist(P.x, P.y, gx, gy) > 40 * TILE) { this.endSiege('Você se afastou e o cerco foi abandonado.'); return; }
    s.t -= dt;
    const active = G.ents.filter(e => e.siegeOf === s.civ && !e.dead);
    const guards = active.filter(e => e.kind === 'guard').length + G.ents.filter(e => e.tag === 'cap' + s.civ && !e.dead).length;
    if (c.garrison > guards && active.length < 5 && s.t <= 0) {
      s.t = 2.5;
      const p = freeSpotNear(gx, gy + TILE, 2 * TILE);
      // enquanto o portão estiver de pé, arqueiros atiram das muralhas
      this.spawn('guard', p.x, p.y, { civ: s.civ, siegeOf: s.civ, leash: Sieges.gateUp() ? 6 : 30, mult: 1 + c.invest.walls * 0.1, archer: Sieges.gateUp() || Math.random() < 0.2 });
    }
    if (c.garrison <= 0 && guards === 0 && !s.lord && !Sieges.gateUp()) {
      s.lord = true;
      const p = freeSpotNear(gx, gy + TILE, TILE);
      this.spawn('lord', p.x, p.y, { civ: s.civ, siegeOf: s.civ, leash: 30, name: c.rulerName, npc: c.rulerId != null ? People.get(c.rulerId) : null });
      UI.banner(`👑 ${c.rulerName} sai para lutar!`);
      UI.msg(`A guarnição caiu! ${c.rulerName} empunha a espada diante dos portões.`, 'bad');
    }
  },
  endSiege(text) {
    if (!G.siege) return;
    for (const e of G.ents) if (e.siegeOf === G.siege.civ) e.dead = true;
    G.siege = null;
    if (text) UI.msg(text, 'bad');
  },
  becomeRuler(ci, how) {
    const c = G.civs[ci];
    c.ruler = 'player'; c.atWar = false; c.rulerName = G.name; c.rulerId = null; c.relation = 100; c.rebel = 0;
    if (G.siege && G.siege.civ === ci) { for (const e of G.ents) if (e.siegeOf === ci) e.dead = true; G.siege = null; }
    UI.banner(`👑 ${G.name}, soberano de ${CIV_DEFS[ci].short}!`);
    UI.msg(`${how} Você agora governa ${CIV_DEFS[ci].name}! Aperte K para administrar o reino.`, 'gold', true);
  },
  conquer(ci) {
    const c = G.civs[ci];
    const spoils = Math.floor(c.treasury * 0.4);
    c.treasury -= spoils; P.gold += spoils;
    c.happy = Math.max(20, c.happy - 20); c.garrison = 4;
    for (const o of G.civs) if (o.id !== ci) this.addRelation(o.id, -15);
    Progress.add('castlesTaken');
    this.becomeRuler(ci, `O castelo caiu e você saqueou ${spoils} 🪙.`);
  },
  claimNeeds(ci) { const duke = Court.T().civ === ci && Court.T().lvl >= 4; return { rel: duke ? 60 : 75, gold: duke ? 800 : 1500 }; },
  claimThrone(ci) {
    const c = G.civs[ci], need = this.claimNeeds(ci);
    if (c.relation < need.rel || P.gold < need.gold) return;
    const old = c.rulerId != null ? People.get(c.rulerId) : null;
    if (old) old.rank = 'knight';
    c.rulerId = null;
    P.gold -= need.gold; c.treasury += need.gold;
    this.becomeRuler(ci, `${c.rulerName} abdica em seu favor diante da corte.`);
  },

  // ================================================================ comércio e seguidores
  price(ci, k) {
    const base = ITEMS[k].price;
    let mod = 1;
    const prod = CIV_DEFS[ci].prod[k];
    if (prod !== undefined) mod = U.clamp(1.35 - prod / 30, 0.6, 1.4);
    const st = G.civs[ci].stock[k];
    if (st !== undefined) mod *= U.clamp(1.3 - st / 400, 0.7, 1.3);
    mod *= Market.f(ci, k);
    return { buy: Math.max(1, Math.round(base * mod * 1.3)), sell: Math.max(1, Math.floor(base * mod * 0.7)) };
  },
  priceFor(ci, k, owner) {
    const pr = this.price(ci < 0 ? 0 : ci, k);
    if (!owner) return pr;
    const charm = (Farm.has('charm') ? 0.1 : 0) + Court.discount(ci), dsell = DIFFICULTY[G.diff || 'normal'].sell;
    return { buy: Math.max(1, Math.round(pr.buy * (1 - owner.aff / 400 - charm))), sell: Math.max(1, Math.round(pr.sell * (1 + owner.aff / 500 + charm) * dsell)) };
  },
  trade(ci, k, n, mode, owner) {
    if (ci < 0) ci = 0;
    const c = G.civs[ci], pr = this.priceFor(ci, k, owner);
    if (owner) People.addAff(owner, Math.min(3, n * 0.3));
    const raw = c.stock[k] !== undefined;
    if (mode === 'buy') {
      n = Math.min(n, Math.floor(P.gold / pr.buy));
      if (raw) n = Math.min(n, c.stock[k]);
      if (n <= 0) return;
      P.gold -= n * pr.buy; c.treasury += n * pr.buy;
      if (raw) c.stock[k] -= n;
      Inv.add(k, n);
      Market.traded(ci, k, n, 'buy');
    } else {
      n = Math.min(n, Inv.count(k), Math.floor(c.treasury / pr.sell));
      if (n <= 0) return;
      P.gold += n * pr.sell; c.treasury -= n * pr.sell;
      if (raw) c.stock[k] += n;
      Inv.add(k, -n);
      Market.traded(ci, k, n, 'sell');
      this.addRelation(ci, n * pr.sell / 60);
    }
  },
  hire() {
    if (P.gold < 60 || this.allies().length >= this.followerCap()) return;
    P.gold -= 60; const m = this.newMercenary(G.zone);
    UI.msg(`${People.full(m)}, mercenári${m.sex === 'm' ? 'o' : 'a'}, se junta a você! Fale com ${m.sex === 'm' ? 'ele' : 'ela'} para equipar armas e armaduras.`, 'gold');
  },
  train() {
    const cost = { gold: 35, wheat: 5 };
    if (!Inv.has(cost) || this.allies().length >= this.followerCap()) return;
    Inv.pay(cost); this.newMercenary(-1);
    UI.msg('Um novo soldado foi treinado!', 'gold');
  },

  // ================================================================ economia dos reinos
  popCap(c) { return 180 + c.invest.housing * 40; },
  maxGarrison(c) { return 18 + c.invest.walls * 6; },
  civForecast(c) {
    const d = CIV_DEFS[c.id], f = c.pop / 150;
    const byRes = { wheat: 'farms', wood: 'sawmill', stone: 'quarry', iron_ore: 'mines' };
    const prod = {};
    for (const r of KINGDOM_RES) prod[r] = Math.round((d.prod[r] || 0) * f * (1 + 0.25 * c.invest[byRes[r]]) * (r === 'wheat' ? Season.cur().wheat : 1));
    return { prod, wheat: prod.wheat, need: Math.round(c.pop * 0.13), income: Math.round(c.pop * c.tax * 2), upkeep: c.garrison };
  },
  tickCiv(c) {
    const fc = this.civForecast(c);
    for (const r of KINGDOM_RES) c.stock[r] = Math.min(3000, (c.stock[r] || 0) + fc.prod[r]);
    let fed = true;
    if (c.stock.wheat >= fc.need) c.stock.wheat -= fc.need; else { c.stock.wheat = 0; fed = false; }
    c.treasury += fc.income - fc.upkeep;
    let broke = false;
    if (c.treasury < 0) { c.treasury = 0; broke = true; }
    const target = U.clamp(78 - c.tax * 160 + (fed ? 5 : -30) + (broke ? -15 : 0) + (c.festival || 0), 0, 100);
    c.festival = 0;
    c.happy = U.clamp(c.happy + (target - c.happy) * 0.3, 0, 100);
    if (fed && c.happy > 50) c.pop = Math.min(this.popCap(c), Math.round(c.pop * 1.03 + 1));
    else if (!fed || c.happy < 30) c.pop = Math.max(40, Math.round(c.pop * 0.96));

    if (c.ruler === 'npc') {
      if (c.garrison < this.maxGarrison(c) && c.treasury > 150) { c.garrison = Math.min(this.maxGarrison(c), c.garrison + 2); c.treasury -= 80; }
      if (!c.atWar && c.relation < 0) c.relation = Math.min(0, c.relation + 2);
    } else {
      if (!fed) UI.msg(`⚠️ ${CIV_DEFS[c.id].short}: falta trigo! O povo passa fome.`, 'bad');
      if (c.happy < 15) {
        c.rebel++;
        UI.msg(`⚠️ ${CIV_DEFS[c.id].short} está à beira da revolta (${c.rebel}/3)! Baixe os impostos ou faça um festival.`, 'bad');
        if (c.rebel >= 3) this.rebellion(c);
      } else c.rebel = 0;
    }
  },
  rebellion(c) {
    const rebel = People.create({ rank: 'ruler', civ: c.id, home: { type: 'castle', civ: c.id }, age: U.rint(30, 50), aff: -80, trait: U.pick(['orgulhoso', 'corajoso']) });
    c.ruler = 'npc'; c.rulerId = rebel.id; c.rulerName = People.title(rebel) + ' ' + rebel.name; c.atWar = true; c.garrison = 8; c.happy = 55; c.rebel = 0; c.relation = -80; c.tax = 0.12;
    UI.banner(`🔥 Revolta em ${CIV_DEFS[c.id].short}!`);
    UI.msg(`O povo de ${CIV_DEFS[c.id].name} se revoltou e coroou ${c.rulerName}. Você perdeu o reino!`, 'bad');
  },
  onNewDay() {
    G.day++;
    Season.apply(true);
    for (const camp of World.camps) if (camp.cleared && G.day >= camp.respawnDay) { camp.cleared = false; camp.left = 4; }
    // a vida (envelhecer, casar, ter filhos) anda um ano a cada ano do calendário (em janeiro)
    if (Calendar.of(G.day).month === 0 && G.day > 1) People.tickYear();
    Arena.dayTick(); Progress.dayTick(); Guards.dayTick(); Homes.dayTick(true);
    G.econT = (G.econT || 0) + 1;
    if (G.econT >= ECON_DAYS) { G.econT = 0; this.econTick(); }
    if (G.family.dueDay && G.day >= G.family.dueDay) { G.family.dueDay = 0; setTimeout(() => UI.showBirth(), 50); }
    const cd = Calendar.of(G.day);
    UI.banner(`📅 ${MONTHS[cd.month][0]} do ano ${cd.year}`);
  },
  // uma vez por mês: a economia e o mundo andam
  econTick() {
    const gold0 = P.gold, inv0 = Object.assign({}, P.inv);
    this.ledger = [];
    const farms = World.structs.filter(s => s.owner === 'player' && s.type === 'farm' && !s.removed).length, crop = Season.cur().farm;
    if (farms && crop) { Inv.add('wheat', farms * crop); this.note(`🌾 Suas fazendas produziram ${farms * crop} de trigo.`); }
    else if (farms) this.note('❄️ No inverno as fazendas não produzem.');
    const allies = this.allies(), caps = G.people.filter(p => p.alive && p.capanga);
    const upkeep = caps.length * 4; // seguidores e guardas recebem soldo
    if (upkeep) {
      const k = G.civs.find(c => c.ruler === 'player' && c.treasury >= upkeep);
      if (P.gold >= upkeep) { P.gold -= upkeep; this.note(`⚔️ Soldo dos capangas: −${upkeep} 🪙.`); }
      else if (k) { k.treasury -= upkeep; this.note(`⚔️ O tesouro de ${CIV_DEFS[k.id].short} pagou ${upkeep} 🪙 de soldo.`); }
      else { const q = allies.length ? allies[allies.length - 1].npc : caps[caps.length - 1]; if (q) People.dismiss(q); UI.msg('Um soldado abandonou você por falta de pagamento.', 'bad'); }
    }
    for (const c of G.civs) this.tickCiv(c);
    Diplo.tickDay();
    Families.dayTick(); Biz.dayTick();
    Faith.ensurePriests();
    Market.dayTick(); Court.dayTick(); Court.rivalTick(); Court.stipendTick(); RoyalCourt.tick();
    if (!G.dungeon) Sieges.dayTick();
    Farm.dayTick(!!G.rainedToday); G.rainedToday = false;
    Farm.produce(); Farm.tavernTick();
    if (!G.dungeon) { Towns.dayTick(); Caravans.dayTick(); Battles.dayTick(); }
    Progress.econTick();
    // resumo: uma linha só, com o saldo de ouro e o que entrou na mochila; os detalhes ficam no Diário
    const notes = this.ledger; this.ledger = null;
    const dg = P.gold - gold0, got = [];
    for (const k in P.inv) { const d = P.inv[k] - (inv0[k] || 0); if (d > 0) got.push(`+${d} ${ITEMS[k].name}`); }
    if (dg || got.length || notes.length) {
      G.ledger = G.ledger || [];
      G.ledger.unshift({ day: G.day, gold: dg, got, notes });
      if (G.ledger.length > 30) G.ledger.length = 30;
      const parts = [dg ? `${dg > 0 ? '+' : ''}${dg} 🪙` : '', ...got.slice(0, 3)].filter(Boolean);
      UI.msg(`📒 Resumo do mês: ${parts.join(' · ') || 'sem mudanças no seu bolso'}${got.length > 3 ? ' ...' : ''} (Diário → Contas)`, dg < 0 ? 'bad' : '');
    }
  },
  // mensagens de rotina durante o resumo vão para o Diário; fora dele aparecem normalmente
  note(text) { if (this.ledger) this.ledger.push(text); else UI.msg(text); },
  sleep(s) {
    P.hp = P.maxHp; P.stamina = 100; P.hunger = Math.max(0, P.hunger - 20);
    const night = this.isNight();
    World.updateRegrow(night ? NIGHT_LEN - G.time : DAY_LEN - G.time + NIGHT_LEN, P.x, P.y); // o tempo pulado também conta para as plantas crescerem
    G.time = NIGHT_LEN;
    const f = G.family, sp = f.spouse !== null ? People.get(f.spouse) : null;
    if (sp && sp.alive && f.tryChild && !f.dueDay) {
      f.tryChild = false;
      if (Math.random() < 0.65) { f.dueDay = G.day + 2 * ECON_DAYS + 1; UI.msg(`💕 Uma criança está a caminho! Ela chegará em ${daysText(2 * ECON_DAYS)}.`, 'gold', true); }
      else UI.msg('Nenhum bebê desta vez... conversem e tentem de novo.');
    }
    if (!night) this.onNewDay();
    this.save(s, true);
    UI.banner(`🛏️ ${Calendar.full(G.day)}`);
  },

  // ---------------------------------------------------------------- ações do painel do reino
  setTax(ci, d) { const c = G.civs[ci]; c.tax = U.clamp(Math.round((c.tax + d) * 100) / 100, 0, 0.5); },
  kGold(ci, n) {
    const c = G.civs[ci];
    if (n === '-all') { P.gold += c.treasury; c.treasury = 0; }
    else if (n === 'all') { c.treasury += P.gold; P.gold = 0; }
    else {
      const v = +n;
      if (v < 0 && c.treasury >= -v) { c.treasury += v; P.gold -= v; }
      if (v > 0 && P.gold >= v) { c.treasury += v; P.gold -= v; }
    }
  },
  kRes(ci, k, n) {
    const c = G.civs[ci];
    if (n < 0 && (c.stock[k] || 0) >= -n) { c.stock[k] += n; Inv.add(k, -n); }
    if (n > 0 && Inv.count(k) >= n) { c.stock[k] = (c.stock[k] || 0) + n; Inv.add(k, -n); }
  },
  invest(ci, k) {
    const c = G.civs[ci], inv = INVESTMENTS[k];
    const have = r => r === 'gold' ? c.treasury : (c.stock[r] || 0);
    if (!Object.entries(inv.cost).every(([r, n]) => have(r) >= n)) return;
    for (const [r, n] of Object.entries(inv.cost)) { if (r === 'gold') c.treasury -= n; else c.stock[r] -= n; }
    c.invest[k]++;
    UI.msg(`${inv.name} de ${CIV_DEFS[ci].short} agora no nível ${c.invest[k]}.`, 'gold');
  },
  kRecruit(ci) {
    const c = G.civs[ci];
    if (c.treasury < 40 || c.stock.wheat < 5 || c.garrison >= this.maxGarrison(c)) return;
    c.treasury -= 40; c.stock.wheat -= 5; c.garrison++;
  },
  kEscort(ci) {
    const c = G.civs[ci];
    if (c.garrison <= 1 || this.allies().length >= this.followerCap()) return;
    c.garrison--; this.newMercenary(ci);
    UI.msg('Um soldado da guarnição agora acompanha você.', 'gold');
  },
  kFestival(ci) {
    const c = G.civs[ci];
    if (c.treasury < 100 || c.stock.wheat < 40) return;
    c.treasury -= 100; c.stock.wheat -= 40; c.festival = 20; c.happy = Math.min(100, c.happy + 10);
    UI.msg(`🎉 O povo de ${CIV_DEFS[ci].short} celebra em sua honra!`, 'gold');
  },

  // ================================================================ som ambiente e trilha
  updateAudio(dt) {
    this.audT = (this.audT || 0) - dt;
    if (this.audT > 0) return;
    this.audT = 0.15;
    // estalos de fogueira, forja e acampamentos por perto
    let best = 99;
    for (const s of World.structs) {
      if (s.type !== 'campfire' && s.type !== 'forge' && !(s.type === 'camp' && !s.cleared) && s.type !== 'smith' && s.type !== 'castle') continue;
      const d = U.dist(P.x / TILE, P.y / TILE, s.x + s.w / 2, s.y + s.h / 2);
      if (d < best) best = d;
    }
    if (best < 7 && Math.random() < 0.7) Sound.play('crackle', { vol: 1 - best / 7 });
    // trilha conforme a situação
    const boss = G.ents.some(e => e.def.boss && !e.dead && U.dist(e.x, e.y, P.x, P.y) < 14 * TILE);
    const danger = G.siege || boss || G.ents.some(e => !e.dead && e.target === P && e.def.dmg > 0);
    Sound.music(boss || G.siege ? 'battle' : G.dungeon ? 'cave' : danger ? 'battle' : G.darkness > 0.35 ? 'night' : 'day');
  },

  // ================================================================ efeitos
  addText(x, y, text, color) { G.texts.push({ x, y, text, color, life: 1.2 }); },
  burst(x, y, color, n) {
    for (let k = 0; k < n; k++) G.parts.push({ x, y, vx: U.rnd(-60, 60), vy: U.rnd(-90, -20), life: U.rnd(0.3, 0.7), color, size: U.rint(2, 4) });
  },

  zoomStep() { const z = +G.settings.zoom || 1; return ZOOM_LEVELS.includes(z) ? z : 1; },
  // ================================================================ renderização
  render() {
    const ctx = this.ctx, sw = this.canvas.width, sh = this.canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d4e89'; ctx.fillRect(0, 0, sw, sh);
    if (G.state !== 'play') return;
    // o mundo é desenhado em escala (zoom); cw/ch são o tamanho da vista em pixels do mundo
    const z = this.zoom || 1, cw = sw / z, ch = sh / z;
    const cx = Math.round(G.cam.x * z) / z, cy = Math.round(G.cam.y * z) / z;
    const t = G.realTime;
    ctx.setTransform(z, 0, 0, z, 0, 0);

    // terreno
    const CPX = CH * TILE;
    for (let gy = Math.floor(cy / CPX); gy <= Math.floor((cy + ch) / CPX); gy++)
      for (let gx = Math.floor(cx / CPX); gx <= Math.floor((cx + cw) / CPX); gx++) {
        if (gx < 0 || gy < 0 || gx * CH >= WORLD_W || gy * CH >= WORLD_H) continue;
        ctx.drawImage(World.getChunk(gx, gy), gx * CPX - cx, gy * CPX - cy, CPX + 1 / z, CPX + 1 / z);
      }

    Routine.frame();
    // construções planas por baixo, demais ordenadas por profundidade
    const list = [];
    const vis = [];
    for (const s of World.structs) {
      const sx = s.x * TILE - cx, sy = s.y * TILE - cy;
      if (s.hidden || sx > cw + 64 || sy > ch + 64 || sx + s.w * TILE < -64 || sy + s.h * TILE < -96) continue;
      vis.push(s);
      if (!s.blocks && s.type !== 'campfire') World.drawStruct(ctx, s, sx, sy, t);
      else list.push({ y: (s.y + s.h) * TILE - 2, k: 1, s });
    }
    if (!G.dungeon) Farm.draw(ctx, cx, cy, cw, ch);
    // pessoa sob o cursor: destaque e conversa ao clicar
    G.hoverNpc = null;
    { let bd = 22;
      for (const e of G.ents) {
        if (e.dead || e.sleeping || !e.npc || e.npc.hostile) continue;
        const d = U.dist(e.x, e.y - 16, G.mouse.wx, G.mouse.wy);
        if (d < bd) { bd = d; G.hoverNpc = e; }
      }
      const h = G.hoverNpc;
      if (h) { ctx.strokeStyle = 'rgba(255,213,74,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x - cx, h.y - cy, 13, 5, 0, 0, Math.PI * 2); ctx.stroke(); } }
    if (P.charging && P.charge > 0.1) {
      const k = Math.min(1, P.charge / 0.45);
      ctx.strokeStyle = k >= 1 ? 'rgba(255,200,60,0.95)' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(P.x - cx, P.y - cy - 16, 24, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    }
    const tx0 = Math.max(0, Math.floor(cx / TILE) - 1), tx1 = Math.min(WORLD_W - 1, Math.floor((cx + cw) / TILE) + 1);
    const ty0 = Math.max(0, Math.floor(cy / TILE) - 1), ty1 = Math.min(WORLD_H - 1, Math.floor((cy + ch) / TILE) + 2);
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      const i = y * WORLD_W + x;
      if (World.obj[i]) list.push({ y: (y + 1) * TILE - 1, k: 0, i, x, y: (y + 1) * TILE - 1, ty: y });
    }
    for (const e of G.ents) {
      if (e.sleeping || e.x - cx < -40 || e.x - cx > cw + 40 || e.y - cy < -60 || e.y - cy > ch + 60) continue;
      list.push({ y: e.y, k: 2, e });
    }
    list.push({ y: P.y, k: 3 });
    if (P.horse && !P.mounted && !G.dungeon && !P.sailing) list.push({ y: P.hy, k: 4 });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) {
      if (d.k === 0) World.drawObj(ctx, d.i, d.x * TILE - cx, d.ty * TILE - cy);
      else if (d.k === 1) World.drawStruct(ctx, d.s, d.s.x * TILE - cx, d.s.y * TILE - cy, t);
      else if (d.k === 2) d.e.draw(ctx, cx, cy);
      else if (d.k === 4) drawHorse(ctx, P.hx - cx, P.hy - cy, P.hdir || 1, P.anim, P.hmoving, (P.horse.color || '#7a4a26'), P.cart);
      else drawPlayer(ctx, cx, cy);
    }

    // fantasma da construção
    if (G.placing) {
      const b = BUILDINGS[G.placing];
      const px = Math.floor(G.mouse.wx / TILE - b.w / 2 + 0.5), py = Math.floor(G.mouse.wy / TILE - b.h / 2 + 0.5);
      const err = this.canBuild(G.placing, px, py);
      ctx.globalAlpha = 0.6;
      World.drawStruct(ctx, { type: G.placing, w: b.w, h: b.h, owner: 'player', cleared: false }, px * TILE - cx, py * TILE - cy, t);
      ctx.globalAlpha = 1;
      ctx.fillStyle = err ? 'rgba(220,40,40,0.35)' : 'rgba(60,220,80,0.3)';
      ctx.fillRect(px * TILE - cx, py * TILE - cy, b.w * TILE, b.h * TILE);
      if (err) { ctx.font = '13px Georgia, serif'; ctx.fillStyle = '#fff'; ctx.fillText(err, px * TILE - cx, py * TILE - cy - 6); }
    }

    for (const p of G.parts) { ctx.fillStyle = p.color; ctx.fillRect(p.x - cx, p.y - cy, p.size, p.size); }
    Ranged.draw(ctx, cx, cy);

    Urban.draw(ctx, cx, cy, t);

    // iluminação noturna
    if (G.darkness > 0.01) {
      const l = this.lctx;
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, sw, sh);
      l.fillStyle = G.dungeon ? `rgba(6,4,2,${G.darkness})` : `rgba(8,12,38,${G.darkness})`;
      l.fillRect(0, 0, sw, sh);
      l.globalCompositeOperation = 'destination-out';
      l.setTransform(z, 0, 0, z, 0, 0);
      const hole = (x, y, r) => {
        const g = l.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = g; l.beginPath(); l.arc(x, y, r, 0, Math.PI * 2); l.fill();
      };
      hole(P.x - cx, P.y - cy - 16, G.dungeon ? 250 : 170);
      for (const s of vis) {
        const sx = (s.x + s.w / 2) * TILE - cx, sy = (s.y + s.h / 2) * TILE - cy;
        const flick = Math.sin(t * 9 + s.id) * 6;
        if (s.type === 'campfire') hole(sx, sy, 140 + flick);
        else if (s.type === 'forge') hole(sx, sy, 120 + flick);
        else if (s.type === 'camp' && !s.cleared) hole(sx, sy + 20, 120 + flick);
        else if (s.type === 'cave_exit') hole(sx, sy, 160);
        else if (s.type === 'tchest' && !s.opened) hole(sx, sy, 60);
        else if (s.type === 'castle') { hole(sx - 22, (s.y + s.h) * TILE - cy - 20, 110 + flick); hole(sx + 22, (s.y + s.h) * TILE - cy - 20, 110 + flick); }
        else if (s.type === 'vhouse' || s.type === 'tavern') { if (Routine.lit(s)) hole(sx, sy, s.type === 'tavern' ? 115 + flick : 80); }
        else if (s.type === 'cabin' || s.type === 'house' || s.type === 'store') hole(sx, sy, 80);
      }
      ctx.drawImage(this.light, 0, 0, cw, ch);
    }

    Sieges.drawBoulders(ctx, cx, cy);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // rótulos
    ctx.textAlign = 'center';
    for (const s of vis) {
      let label = null, col = '#fff';
      if (s.type === 'castle') { label = CIV_DEFS[s.owner].name + (G.civs[s.owner].ruler === 'player' ? ' 👑' : ''); col = this.civColor(s.owner); }
      else if (s.type === 'store') { const v = World.villages[s.village]; label = v.name + (v.lord === 'player' ? ' 🏠' : ''); if (v.lord === 'player') col = '#ffd54a'; }
      else if (FAMILY_BIZ[s.type] && U.dist(P.x, P.y, (s.x + 1) * TILE, (s.y + 1) * TILE) < 7 * TILE) { label = Families.bizName(s); col = '#e8d8b4'; }
      else if (BIZ_TYPES[s.type] && s.owner === 'player' && s.type !== 'ptavern' && U.dist(P.x, P.y, (s.x + 1) * TILE, (s.y + 1) * TILE) < 7 * TILE) { label = `💼 ${BUILDINGS[s.type].name}`; col = '#ffe9a8'; }
      else if (s.type === 'camp' && !s.cleared) { label = 'Acampamento de Bandidos'; col = '#ff7070'; }
      else if (s.type === 'arena') { label = '🏟️ Arena' + (Arena.tourney() && Arena.tourney().ci === s.owner ? ' · Grande Torneio' : ''); col = '#ffd54a'; }
      else if (s.type === 'shrine') { label = '🕯️ ' + s.sname; col = '#e8e0ff'; }
      else if (s.type === 'cathedral') { label = '⛪ Catedral'; col = '#e8e0ff'; }
      if (!label) continue;
      const lx = ((s.x + s.w / 2) * TILE - cx) * z, ly = (s.y * TILE - cy) * z - (s.type === 'castle' ? 22 : 10);
      ctx.font = 'bold 14px Georgia, serif';
      const w = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(20,14,8,0.7)'; ctx.fillRect(lx - w / 2, ly - 14, w, 19);
      ctx.fillStyle = col; ctx.fillText(label, lx, ly);
    }
    // nomes só das 6 pessoas mais próximas, para não poluir a tela
    let talkTo = null, td = 1.9 * TILE;
    const tags = [];
    for (const e of G.ents) {
      if (e.dead || e.sleeping || e.kind === 'lord' || (!e.npc && e.kind !== 'guard')) continue;
      const d = U.dist(e.x, e.y, P.x, P.y);
      if (d > 5 * TILE) continue;
      tags.push([d, e]);
      if (e.npc && !e.npc.hostile && d < td) { td = d; talkTo = e; }
    }
    tags.sort((a, b) => a[0] - b[0]);
    for (const [d, e] of tags.slice(0, 6).reverse()) this.drawTag(ctx, e, cx, cy, d, z);
    if (G.hoverNpc && U.dist(G.hoverNpc.x, G.hoverNpc.y, P.x, P.y) < 4.5 * TILE) talkTo = G.hoverNpc;
    UI.talkButton(UI.isOpen() || P.dead ? null : talkTo, cx, cy);
    for (const tx of G.texts) {
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillStyle = '#000'; ctx.fillText(tx.text, (tx.x - cx) * z + 1, (tx.y - cy) * z + 1);
      ctx.fillStyle = tx.color; ctx.fillText(tx.text, (tx.x - cx) * z, (tx.y - cy) * z);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    this.drawPing(ctx, cx, cy, sw, sh, z);
    Season.drawWeather(ctx, sw, sh);
    this.drawBossBar(ctx, sw);
    Sieges.drawGateBar(ctx, sw);
    this.drawMinimap(ctx, sw);
  },

  drawBossBar(ctx, cw) {
    const b = G.ents.find(e => e.def.boss && !e.dead && U.dist(e.x, e.y, P.x, P.y) < 14 * TILE);
    if (!b) return;
    if (!b.roared) { b.roared = true; Sound.play('roar'); UI.banner('☠ ' + b.def.name); }
    const w = Math.min(520, cw - 420), x = (cw - w) / 2, y = 22;
    ctx.fillStyle = 'rgba(14,8,6,0.85)'; ctx.beginPath(); ctx.roundRect(x - 10, y - 8, w + 20, 40, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(214,120,96,0.7)'; ctx.stroke();
    ctx.font = '700 13px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffb8a8'; ctx.fillText(b.def.name, cw / 2, y + 6);
    ctx.fillStyle = '#2a0e0a'; ctx.fillRect(x, y + 14, w, 9);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x, y + 14, w * Math.max(0, b.hp / b.maxHp), 9);
    ctx.textAlign = 'left';
  },
  drawTag(ctx, e, cx, cy, d, z = 1) {
    let name, sub, col = '#d8c9a6';
    if (e.npc) {
      const p = e.npc, rel = People.relation(p);
      name = `${p.name} · ${p.age} ${p.age === 1 ? 'ano' : 'anos'}`;
      const foe = Court.enemyPerson(p);
      sub = People.title(p) + (p.hostile ? ' · HOSTIL' : foe ? ' · INIMIGO' : rel.text !== 'Estranho' && rel.text !== 'Estranha' ? ' · ' + rel.text : '');
      col = p.hostile || foe ? '#ff5d5d' : rel.col;
    } else {
      if (!e.tmp) e.tmp = { name: U.pick(Math.random() < 0.8 ? NAMES_M : NAMES_F), age: U.rint(19, 45) };
      name = `${e.tmp.name} · ${e.tmp.age} anos`;
      sub = 'Soldado de ' + CIV_DEFS[e.civ].short;
    }
    const x = (e.x - cx) * z, y = (e.y - cy - (e.npc && e.npc.age < 14 ? 34 : 50)) * z;
    ctx.save();
    ctx.globalAlpha = U.clamp(1.6 - d / (4 * TILE), 0.3, 1);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    const w1 = ctx.measureText(name).width;
    ctx.font = '10px "Segoe UI", sans-serif';
    const w = Math.max(w1, ctx.measureText(sub).width) + 12;
    ctx.fillStyle = 'rgba(14,10,6,0.78)';
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 26, w, 27, 5); ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9b0'; ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillText(name, x, y - 15);
    ctx.fillStyle = col; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText(sub, x, y - 4);
    ctx.restore();
  },

  drawMinimap(ctx, cw) {
    if (!G.settings.minimap) { this.miniRect = null; return; }
    const S = this.miniSizeNow || +G.settings.miniSize, x0 = cw - S - 18, y0 = 18, k = S / WORLD_W;
    this.miniRect = { x: x0, y: y0, s: S };
    // moldura
    ctx.fillStyle = 'rgba(15,11,7,0.92)';
    ctx.beginPath(); ctx.roundRect(x0 - 5, y0 - 5, S + 10, S + 10, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(214,174,96,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x0, y0, S, S, 6); ctx.clip();
    ctx.drawImage(World.mini, x0, y0, S, S);
    World.capitals.forEach((cp, c) => {
      ctx.fillStyle = '#000'; ctx.fillRect(x0 + cp.x * k - 3.5, y0 + cp.y * k - 3.5, 7, 7);
      ctx.fillStyle = this.civColor(c); ctx.fillRect(x0 + cp.x * k - 2.5, y0 + cp.y * k - 2.5, 5, 5);
    });
    ctx.fillStyle = '#c9a0ff';
    for (const cv of World.caves || []) ctx.fillRect(x0 + cv.x * k - 1, y0 + cv.y * k - 1, 3, 3);
    ctx.fillStyle = '#fff';
    for (const v of World.villages) ctx.fillRect(x0 + v.x * k - 1, y0 + v.y * k - 1, 2, 2);
    ctx.fillStyle = '#ffd54a';
    for (const s of World.structs) if (s.owner === 'player') ctx.fillRect(x0 + s.x * k - 1, y0 + s.y * k - 1, 3, 3);
    ctx.fillStyle = '#ff4040';
    for (const c of World.camps) if (!c.cleared) ctx.fillRect(x0 + (c.x + 1) * k - 1, y0 + (c.y + 1) * k - 1, 3, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + G.cam.x / TILE * k, y0 + G.cam.y / TILE * k, this.canvas.width / (this.zoom || 1) / TILE * k, this.canvas.height / (this.zoom || 1) / TILE * k);
    const px = x0 + P.x / TILE * k, py = y0 + P.y / TILE * k;
    if (G.ping) {
      const gx = x0 + G.ping.x * k, gy = y0 + G.ping.y * k;
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(gx, gy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#3a2606'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy - 5); ctx.lineTo(gx + 4, gy); ctx.lineTo(gx, gy + 5); ctx.lineTo(gx - 4, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const pr = (G.realTime * 1.5) % 1;
    ctx.strokeStyle = `rgba(140,210,255,${1 - pr})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 3 + pr * 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b4f8a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    // indicações
    ctx.font = 'bold 10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15,11,7,0.9)'; ctx.beginPath(); ctx.arc(x0 + S / 2, y0 - 1, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1e4c6'; ctx.fillText('N', x0 + S / 2, y0 + 3);
    ctx.fillStyle = 'rgba(15,11,7,0.85)'; ctx.fillRect(x0 + S - 46, y0 + S - 16, 46, 16);
    ctx.fillStyle = '#e8dcc0'; ctx.font = '600 10px "Segoe UI", sans-serif'; ctx.fillText('mapa', x0 + S - 23, y0 + S - 5);
    ctx.textAlign = 'left';
  },

  // seta e marcador do destino marcado no mapa
  drawPing(ctx, cx, cy, cw, ch, z = 1) {
    if (!G.ping) return;
    const t = G.realTime;
    const px = (G.ping.x * TILE - cx) * z, py = (G.ping.y * TILE - cy) * z;
    const dist = MapView.distText(G.ping.x, G.ping.y);
    ctx.textAlign = 'center';
    if (px > 30 && px < cw - 30 && py > 60 && py < ch - 30) {
      const beam = ctx.createLinearGradient(0, py - 180, 0, py);
      beam.addColorStop(0, 'rgba(255,213,74,0)'); beam.addColorStop(1, 'rgba(255,213,74,0.35)');
      ctx.fillStyle = beam; ctx.fillRect(px - 7, py - 180, 14, 180);
      const pr = (t * 1.2) % 1;
      ctx.strokeStyle = `rgba(255,213,74,${1 - pr})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(px, py, 8 + pr * 26, (8 + pr * 26) * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
      MapView.drawPin(ctx, px, py - 6 - Math.abs(Math.sin(t * 3)) * 8, 1.1);
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(`${G.ping.name} · ${dist}`, px, py - 52);
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(`${G.ping.name} · ${dist}`, px, py - 52);
    } else {
      // bússola ao redor do personagem apontando para o destino
      const sx = (P.x - cx) * z, sy = (P.y - cy - 16) * z, a = Math.atan2(py - sy, px - sx);
      const ca = Math.cos(a), sa = Math.sin(a);
      const R = 62 + Math.sin(t * 5) * 3;
      const ex = sx + ca * R, ey = sy + sa * R;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
      ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#3a2606'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-7, -10); ctx.lineTo(-2, 0); ctx.lineTo(-7, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.font = '700 12px "Segoe UI", sans-serif';
      const lx = sx + ca * (R + 30), ly = sy + sa * (R + 24);
      const w = ctx.measureText(dist).width + 14;
      ctx.fillStyle = 'rgba(15,11,7,0.85)'; ctx.beginPath(); ctx.roundRect(lx - w / 2, ly - 10, w, 19, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,213,74,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(dist, lx, ly + 4);
    }
    ctx.textAlign = 'left';
  },

  playerTitle() {
    const ruled = G.civs.filter(c => c.ruler === 'player');
    if (ruled.length) return { king: true, text: 'Soberano de ' + CIV_DEFS[ruled[0].id].short + (ruled.length > 1 ? ` e +${ruled.length - 1}` : '') };
    if (Court.title()) return { king: false, text: Court.title().icon + ' ' + Court.titleName() };
    const l = P.level;
    return { king: false, text: l < 3 ? 'Andarilho' : l < 6 ? 'Aventureiro' : l < 10 ? 'Guerreiro' : l < 15 ? 'Campeão' : 'Lenda do Reino' };
  },

  drawPortrait(cv) {
    const key = [P.equip.weapon, P.equip.head, P.equip.torso, P.equip.legs, P.equip.feet, G.civs.some(c => c.ruler === 'player'), P.hurt > 0].join('|');
    if (key === this.portraitKey) return;
    this.portraitKey = key;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    const look = playerLook();
    drawHuman(g, cv.width / 2, cv.height + 30, Object.assign({}, look, { scale: 2.1, dir: 1, moving: false, swing: 0, weapon: null, tool: null, hurt: false }));
  },

  applySettings() {
    const s = G.settings, root = document.documentElement.style;
    // o zoom do CSS também escala top/right/largura; compensamos para a coluna da direita ficar sempre logo abaixo do minimapa
    // escala automática conforme o tamanho da tela
    const small = window.innerWidth < 760 || window.innerHeight < 520;
    // telas pequenas (celular deitado) encolhem menos: os painéis já são compactos e o texto precisa ser legível
    const z = s.uiScale === 'auto' ? (small ? U.clamp(Math.min(window.innerWidth / 1000, window.innerHeight / 560), 0.6, 0.9) : U.clamp(Math.min(window.innerWidth / 1400, window.innerHeight / 820) * 1.02, 0.55, 1)) : +s.uiScale;
    const miniSize = small ? Math.min(+s.miniSize, 120) : +s.miniSize;
    this.miniSizeNow = miniSize;
    Touch.show(G.state === 'play' && (s.touch === 'on' || (s.touch === 'auto' && Touch.isTouch())));
    document.body.classList.toggle('small', small);
    const miniH = s.minimap ? miniSize + 22 : 0, miniW = s.minimap ? miniSize + 10 : 186;
    root.setProperty('--mini-h', miniH + 'px');
    root.setProperty('--mini-w', Math.max(186, miniW) + 'px');
    for (const id of ['hud', 'rightcol', 'toolbar', 'log']) document.getElementById(id).style.zoom = z;
    const rc = document.getElementById('rightcol');
    rc.style.top = ((14 + miniH) / z) + 'px';
    rc.style.right = (14 / z) + 'px';
    // em telas pequenas a coluna da direita (tempo e algibeira) tem exatamente a largura do minimapa
    rc.style.width = ((small && s.minimap ? miniW : Math.max(186, miniW)) / z) + 'px';
    document.body.classList.toggle('nonum', !s.numbers);
    document.body.classList.toggle('keysbar', !!s.keysbar && G.state === 'play');
    document.getElementById('keys').classList.toggle('hidden', !s.keysbar || G.state !== 'play');
  },
  setSetting(k, v) {
    G.settings[k] = ((k === 'uiScale' && v !== 'auto') || k === 'miniSize' || k === 'music' || k === 'sfx') ? +v : v;
    if (k === 'diff') { G.diff = v; UI.msg(`Dificuldade: ${DIFFICULTY[v].name}.`, 'gold'); }
    Sound.setVol({ music: +G.settings.music, sfx: +G.settings.sfx, mute: !!G.settings.mute });
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(G.settings)); } catch (e) { /* armazenamento indisponível: vale só nesta sessão */ }
    this.applySettings();
  },
};

// ================================================================ recarregar a página volta para onde você estava
// A cópia fica só nesta aba (sessionStorage) e não mexe nos espaços de salvamento: é a partida como estava,
// a janela aberta e, no menu, a tela em que você estava (com o herói que estava criando).
const Resume = {
  KEY: 'medieval_resume',
  write() {
    try {
      let st;
      if (G.state === 'play') {
        if (G.dungeon) return; // dentro de cavernas fica valendo a última cópia de fora
        const win = UI.cur && !UI.panel.classList.contains('hidden') ? { fn: UI.cur.fn, args: UI.cur.args || [] } : null;
        st = { kind: 'game', slot: G.slot, win, map: !!MapView.isOpen, sel: UI.sel, data: 'LZ1:' + LZ.compress(JSON.stringify(Game.snapshot())) };
      } else if (G.state === 'menu') st = { kind: 'menu', card: Menu.card || 'main', hero: Menu.hero };
      if (st) sessionStorage.setItem(this.KEY, JSON.stringify(st));
    } catch (e) { /* sem espaço na aba: recarregar volta ao menu */ }
  },
  clear() { try { sessionStorage.removeItem(this.KEY); } catch (e) { /* nada guardado */ } },
  watch() {
    window.addEventListener('pagehide', () => this.write());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.write(); });
    setInterval(() => { if (G.state === 'play' && !G.paused) this.write(); }, 20000);
  },
  // devolve true se voltou para algum lugar (senão o jogo abre no menu inicial)
  restore() {
    let st = null;
    try { st = JSON.parse(sessionStorage.getItem(this.KEY) || 'null'); } catch (e) { st = null; }
    if (!st) return false;
    if (st.kind === 'menu') {
      Menu.show();
      if (st.hero) Menu.hero = st.hero;
      if (st.card === 'create') Menu.createCard(); else if (st.card === 'slots') Menu.slotsCard();
      return true;
    }
    if (st.kind !== 'game' || !st.data) return false;
    let data;
    try { data = JSON.parse(LZ.decompress(st.data.slice(4))); } catch (e) { return false; }
    UI.loading('Voltando para a sua jornada...', async prog => {
      if (!(await Game.load(st.slot, prog, data))) { this.clear(); UI.showMainMenu(); return; }
      if (st.sel) Object.assign(UI.sel, st.sel);
      if (st.map) UI.toggle('showMap');
      else if (st.win && typeof UI[st.win.fn] === 'function') { try { UI[st.win.fn](...st.win.args); } catch (e) { UI.close(); } }
    });
    return true;
  },
};

// os scripts podem chegar depois do evento load (carregador com versão), então inicia de qualquer jeito
// textos do jogo não podem ser selecionados, copiados ou arrastados (só os campos de digitar)
{
  const typing = t => t && t.closest && t.closest('input, textarea, [contenteditable="true"]');
  for (const ev of ['selectstart', 'copy', 'cut', 'dragstart']) document.addEventListener(ev, e => { if (!typing(e.target)) e.preventDefault(); });
}
if (document.readyState === 'complete') Game.boot(); else window.addEventListener('load', () => Game.boot());
