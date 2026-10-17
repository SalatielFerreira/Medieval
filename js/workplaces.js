'use strict';
// Todo prédio (menos as casas dos moradores) tem o lado de dentro e um responsável que cuida do lugar:
// as obras das vilas (padaria, escola, banhos...), os empreendimentos das famílias, o santuário, o cemitério, a arena
// e os seus prédios (quartel, estábulo, adega, torre de arqueiros...). O responsável é uma pessoa de verdade, com
// nome e família, ligada ao prédio como os donos das lojas (p.shop = okey). Na torre de arqueiros ele fica lá em cima.

// ofícios novos
Object.assign(RANKS, {
  baker:       { m: 'Padeiro', f: 'Padeira', order: 5 },
  miller:      { m: 'Moleiro', f: 'Moleira', order: 5 },
  teacher:     { m: 'Professor', f: 'Professora', order: 5 },
  bather:      { m: 'Atendente dos Banhos', f: 'Atendente dos Banhos', order: 6 },
  watchman:    { m: 'Vigia', f: 'Vigia', fighter: true, order: 6 },
  weaver:      { m: 'Tecelão', f: 'Tecelã', order: 5 },
  brewer:      { m: 'Cervejeiro', f: 'Cervejeira', order: 5 },
  trader:      { m: 'Mercador', f: 'Mercadora', order: 5 },
  groom:       { m: 'Cavalariço', f: 'Cavalariça', order: 6 },
  miner:       { m: 'Mineiro', f: 'Mineira', order: 6 },
  sawyer:      { m: 'Serrador', f: 'Serradora', order: 6 },
  granger:     { m: 'Celeireiro', f: 'Celeireira', order: 6 },
  healer:      { m: 'Curandeiro', f: 'Curandeira', order: 5 },
  hermit:      { m: 'Ermitão', f: 'Ermitã', order: 6 },
  gravedigger: { m: 'Coveiro', f: 'Coveira', order: 6 },
  arenamaster: { m: 'Mestre da Arena', f: 'Mestra da Arena', fighter: true, order: 5 },
  caretaker:   { m: 'Zelador', f: 'Zeladora', order: 6 },
  archer:      { m: 'Arqueiro', f: 'Arqueira', fighter: true, order: 6 },
  sergeant:    { m: 'Sargento', f: 'Sargenta', fighter: true, order: 5 },
  armorer:     { m: 'Armeiro', f: 'Armeira', order: 5 },
  vintner:     { m: 'Adegueiro', f: 'Adegueira', order: 6 },
  potter:      { m: 'Oleiro', f: 'Oleira', order: 6 },
  carpenter:   { m: 'Carpinteiro', f: 'Carpinteira', order: 6 },
  smoker:      { m: 'Defumador', f: 'Defumadora', order: 6 },
});
Object.assign(RANK_LOOK, {
  baker: '#c8a070', miller: '#b0a080', teacher: '#3a4a6a', bather: '#5a8aa0', watchman: '#6a6a5a', weaver: '#8a4a6a', brewer: '#8a6a2a',
  trader: '#6a5a2a', groom: '#6a4a2a', miner: '#4a4a4a', sawyer: '#7a5a30', granger: '#9a7a3a', healer: '#5a7a4a', hermit: '#6a5a4a',
  gravedigger: '#3a3a3a', arenamaster: '#7a3a2a', caretaker: '#6a6a7a', archer: '#4a6a3a', sergeant: '#7a7a80', armorer: '#5a5a60',
  vintner: '#6a2a3a', potter: '#a8553a', carpenter: '#8a6a3a', smoker: '#6a4a3a',
});

// prédio → [ofício do responsável, planta, tema, de quem é ('npc' | 'player'), usa a ação de fora lá dentro]
const WORKPLACES = {
  vbakery: ['baker', 'w_bakery', 'wood', 'npc'], vmill: ['miller', 'w_mill', 'wood', 'npc'], vinn: ['innkeeper', 'w_inn', 'wood', 'npc'],
  vschool: ['teacher', 'school', 'wood', 'npc'], vbath: ['bather', 'bath', 'stone', 'npc'], vtower: ['watchman', 'tower', 'stone', 'npc'],
  vweaver: ['weaver', 'w_weaver', 'wood', 'npc'], vbrewery: ['brewer', 'w_brewhouse', 'wood', 'npc'], vtrade: ['trader', 'w_shop', 'wood', 'npc'],
  vstable: ['groom', 'stable', 'wood', 'npc'], vmine: ['miner', 'w_mine', 'stone', 'npc'], vsawmill: ['sawyer', 'w_lumber', 'wood', 'npc'],
  vgranary: ['granger', 'granary', 'wood', 'npc'], vclinic: ['healer', 'clinic', 'wood', 'npc'],
  fmill: ['miller', 'w_mill', 'wood', 'npc', true], fshop: ['merchant', 'w_shop', 'wood', 'npc', true], fforge: ['smith', 'w_smithy', 'stone', 'npc', true],
  shrine: ['hermit', 'shrine', 'chapel', 'npc', true],
  barracks: ['sergeant', 'barracks', 'stone', 'player', true], brewery: ['brewer', 'w_brewhouse', 'wood', 'player', true],
  stable: ['groom', 'stable', 'wood', 'player', true], smokehouse: ['smoker', 'smoke', 'wood', 'player', true],
  kiln: ['potter', 'pottery', 'stone', 'player', true], carpentry: ['carpenter', 'w_lumber', 'wood', 'player', true],
  watchtower: ['watchman', 'tower', 'wood', 'player', true], archer_tower: ['archer', 'tower', 'stone', 'player', true],
  armory: ['armorer', 'armory', 'stone', 'player', true], cellar: ['vintner', 'cellar', 'stone', 'player', true],
  mushroom: ['caretaker', 'cellar', 'stone', 'player', true],
};
// cemitério e arena já têm o lado de dentro: ganham o responsável
for (const [k, r] of Object.entries(WORKPLACES)) SHOP_KEEPER[k] = r[0];
Object.assign(SHOP_KEEPER, { cemetery: 'gravedigger', arena: 'arenamaster' });

const Work = {
  // a vila de quem cuida do prédio: a do próprio prédio ou a mais perto dele
  vi(s) {
    if (s.village !== undefined && World.villages[s.village]) return s.village;
    if (s._wvi !== undefined && s._wvx === s.x && s._wvy === s.y) return s._wvi;
    let best = -1, bd = 1e9;
    World.villages.forEach((v, i) => { const d = U.dist(s.x, s.y, v.x, v.y); if (d < bd) { bd = d; best = i; } });
    s._wvi = best; s._wvx = s.x; s._wvy = s.y;
    return best;
  },
  spec(s) { const r = WORKPLACES[s.type]; if (!r || (r[3] === 'player') !== (s.owner === 'player')) return null; return r; },
  def(s) {
    if (!s || s.removed || s.hidden) return null;
    const r = this.spec(s); if (!r) return null;
    const nm = r[3] === 'player' ? () => `${/(a|Torre)$/.test(BUILDINGS[s.type].name.split(' ')[0]) ? 'Sua' : 'Seu'} ${BUILDINGS[s.type].name}`
      : s.type === 'shrine' ? () => s.sname || 'Santuário'
      : () => { const v = World.villages[this.vi(s)]; return `${CIV_STRUCTS[s.type].name}${v ? ' de ' + v.name : ''}`; };
    return { lay: r[1], theme: r[2], orig: !!r[4], name: nm };
  },
  // o responsável desenhado no alto da torre de arqueiros (procura rápida: guarda quem foi da última vez)
  keeperFast(s) {
    const p = s._kp !== undefined ? G.people[s._kp] : null;
    if (p && p.alive && p.shop === s.okey) return p;
    const k = Shops.keeper(s); s._kp = k ? k.id : undefined; s._kpT = G.realTime;
    return k;
  },
  drawGuard(ctx, s, X, Y, time) {
    if ((s._kpT || 0) > G.realTime - 2 && s._kp === undefined) return; // sem ninguém: tenta de novo daqui a pouco
    const k = this.keeperFast(s); if (!k) return;
    const lk = People.look(k), w = s.w * TILE;
    const t = Content2.towerAim && Content2.towerAim[s.id], aiming = t && t.until > G.realTime;
    const dir = aiming ? t.dir : Math.sin(time * 0.35 + s.id) > 0 ? 1 : -1;
    drawHuman(ctx, X + w / 2, Y - 29, Object.assign(lk, { helmet: '#9aa0a8', armor: '#8d949c', weapon: '#8b5a2b', wlen: 10, dir, aim: aiming ? t.a : undefined, scale: 0.92 }));
  },
};

// ------------------------------------------------------------------ quem cuida de cada prédio
Shops.isShop = function (s) {
  if (!s || s.removed || s.hidden || SHOP_KEEPER[s.type] === undefined) return false;
  if (WORKPLACES[s.type]) return !!Work.spec(s) && Work.vi(s) >= 0;
  return s.village !== undefined || ((s.type === 'cemetery' || s.type === 'arena') && Work.vi(s) >= 0);
};
Shops.list = function (vi) { return World.structs.filter(s => this.isShop(s) && Work.vi(s) === vi); };
Shops.ensure = function () {
  const owners = new Set(), used = new Set();
  for (const p of G.people) if (p.alive && p.shop) { const s = this.byKey(p.shop); if (s && this.isShop(s) && SHOP_KEEPER[s.type] === p.rank && !owners.has(s.okey)) owners.add(s.okey); else p.shop = null; }
  const free = q => q && q.alive && !q.shop && !q.capanga && !used.has(q.id) && q.age >= 16 && !q.kin && q.spouse !== 'player' && !People.isCourt(q) && !q.trip && !q.port;
  const hired = [];
  for (const s of World.structs) {
    if (!this.isShop(s) || owners.has(s.okey)) continue;
    const vi = Work.vi(s), v = World.villages[vi], rank = SHOP_KEEPER[s.type], mine = s.owner === 'player';
    let q = null;
    // empreendimento de família: alguém da própria família
    if (s.fam !== undefined && Families.get(s.fam)) q = Families.members(Families.get(s.fam)).find(m => free(m) && m.age >= 18 && ['peasant', 'wanderer', rank].includes(m.rank) && !Families.isChief(m)) || null;
    if (!q) q = G.people.find(p => free(p) && p.rank === rank && p.home.type === 'village' && p.home.idx === vi) || null;
    // todo prédio sempre tem alguém cuidando: um morador sem emprego assume (ou chega alguém de fora)
    if (!q) {
      q = People.shopCandidates(vi, rank).filter(free)[0] || null;
      // ninguém disponível na vila: chega alguém de fora para o serviço
      if (!q && v) { q = People.create({ rank, civ: v.civ, home: { type: 'village', idx: vi }, age: U.rint(20, 45), sex: RANKS[rank].fighter && Math.random() < 0.8 ? 'm' : undefined }); q.met = false; }
      if (q) q.rank = rank;
    }
    if (!q) continue;
    q.shop = s.okey; owners.add(s.okey); used.add(q.id);
    if (mine && G.day > 0) hired.push(`${People.full(q)} (${RANKS[rank][q.sex]} — ${Work.def(s).name()})`);
  }
  if (hired.length && G.state === 'play') UI.msg(`🧑‍🔧 ${hired.length === 1 ? 'Novo responsável' : 'Novos responsáveis'} nos seus prédios: ${hired.slice(0, 3).join('; ')}${hired.length > 3 ? '…' : ''}.`, 'gold');
};
People.openVacancies = function () {
  const out = [];
  World.villages.forEach((v, vi) => {
    if (!this.canAppoint(vi)) return;
    for (const s of Shops.vacant(vi)) if (s.owner !== 'player') out.push({ vi, rank: SHOP_KEEPER[s.type], sid: s.id });
  });
  return out;
};

// o prédio do jogador que muda de lugar leva o responsável junto (a chave dele é a posição)
{
  const rl0 = Urban.relocate.bind(Urban);
  Urban.relocate = function (s, nx, ny, quiet) {
    const old = s.okey;
    rl0(s, nx, ny, quiet);
    if (s.built && s.owner === 'player') {
      s.okey = s.type + '@' + s.x + ',' + s.y;
      if (old !== s.okey) { for (const p of G.people) if (p.shop === old) p.shop = s.okey; Shops._map = null; }
    }
  };
  // ao construir: o prédio já ganha o responsável
  const pb0 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function (...a) { const n = World.structs.length, r = pb0(...a); if (World.structs.length > n && World.structs.slice(n).some(s => Shops.isShop(s))) Shops.ensure(); return r; };
  const ac0 = Urban.addCivic.bind(Urban);
  Urban.addCivic = function (type, tx, ty, vi, quiet) { const r = ac0(type, tx, ty, vi, quiet); if (!quiet && SHOP_KEEPER[type]) Shops.ensure(); return r; };
}

// ------------------------------------------------------------------ entrar
{
  // todo prédio com interior mostra "entrar" ao chegar perto (as obras das vilas não tinham ação nenhuma)
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) {
    const l = il0(s); if (l) return l;
    const d = !s.removed && !s.hidden && Places.def(s);
    return d ? `${d.name(s)} — entrar` : l;
  };
  // ao entrar, se o lugar ficou sem ninguém (o responsável morreu ou se mudou), alguém assume na hora
  const er0 = Places.enterRoom.bind(Places);
  Places.enterRoom = function (src) { if (Shops.isShop(src) && !Shops.keeper(src)) Shops.ensure(); return er0(src); };
  const def0 = Places.def.bind(Places);
  Places.def = function (s) { return def0(s) || Work.def(s); };
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    const s = G.place && G.place.src;
    if (f.act === 'work') { const k = s && Shops.keeper(s); return k ? `Falar com ${k.name} (${People.title(k)})` : 'Balcão — ninguém cuidando agora'; }
    if (f.act === 'orig') return (s && Game.interactLabel(s)) || 'Usar';
    return fl0(f);
  };
  const use0 = Places.use.bind(Places);
  Places.use = function (f) {
    const s = G.place && G.place.src;
    if (f.act === 'work') { const k = s && Shops.keeper(s); if (k) UI.showTalk(k.id); else UI.msg('Ninguém está cuidando deste lugar agora.'); return; }
    if (f.act === 'orig') { Game.useStruct(s); return; }
    return use0(f);
  };
  // a torre de arqueiros: o soldado responsável fica lá em cima (o vigia passa o dia e a noite no posto)
  const st0 = Routine.staysIn.bind(Routine);
  Routine.staysIn = function (e, s, ph) { if (e.npc.shop === s.okey && (s.type === 'archer_tower' || s.type === 'watchtower' || s.type === 'vtower')) return true; return st0(e, s, ph); };
  const ds0 = World.drawStruct.bind(World);
  World.drawStruct = function (ctx, s, X, Y, time) { ds0(ctx, s, X, Y, time); if (s.type === 'archer_tower' && s.owner === 'player' && s.built && !s.hidden && !s.removed) Work.drawGuard(ctx, s, X, Y, time); };
}

// ------------------------------------------------------------------ plantas dos cômodos
// nas plantas emprestadas dos seus empreendimentos, o balcão vira "falar com o responsável" e a mesa de contas
// vira a ação do prédio (a mesma de quando se clicava nele por fora)
const workStrip = (L, o) => {
  L.items = L.items.map(it => {
    const ex = it[5]; if (!ex || !ex.act) return it;
    const a = ex.act;
    if (['shop', 'bizshop', 'tavern', 'ptavern'].includes(a)) return [it[0], it[1], it[2], it[3], it[4], Object.assign({}, ex, { act: 'work' })];
    if (a === 'biz') return [it[0], it[1], it[2], it[3], it[4], o.orig ? Object.assign({}, ex, { act: 'orig' }) : Object.assign({}, ex, { act: undefined })];
    return it;
  });
  if (o.orig && !L.items.some(it => it[5] && it[5].act === 'orig')) L.items.push(['desk', 0, L.h - 2, 2, 1, { act: 'orig' }]);
  return L;
};
const ORIG = (o, x, y, k = 'desk', w = 2) => (o.orig ? [[k, x, y, w, 1, { act: 'orig' }]] : []);
Object.assign(LAYOUTS, {
  w_bakery: o => workStrip(LAYOUTS.bakery(o), o), w_mill: o => workStrip(LAYOUTS.mill(o), o), w_weaver: o => workStrip(LAYOUTS.weaver(o), o),
  w_brewhouse: o => workStrip(LAYOUTS.brewhouse(o), o), w_shop: o => workStrip(LAYOUTS.shop(Object.assign({}, o, { mine: true })), o),
  w_smithy: o => workStrip(LAYOUTS.smithy(Object.assign({}, o, { mine: true })), o), w_lumber: o => workStrip(LAYOUTS.lumber(Object.assign({}, o, { mine: true })), o),
  w_mine: o => workStrip(LAYOUTS.mine(o), o), w_inn: o => workStrip(LAYOUTS.inn(o), o),
  // escola: lousa, a mesa do professor e as carteiras
  school(o) {
    return { w: 12, h: 8, items: [['slate', 4, -1, 4], ['window', 1, -1], ['window', 10, -1], ['lamp', 8, -1], ['bookshelf', 0, 0, 2], ['plant', 11, 0],
      ['desk', 5, 1, 2, 1, { act: 'work' }], ['table', 2, 3, 2], ['table', 8, 3, 2], ['table', 2, 5, 2], ['table', 8, 5, 2],
      ['stool', 2, 4], ['stool', 3, 4], ['stool', 8, 4], ['stool', 9, 4], ['stool', 2, 6], ['stool', 3, 6], ['stool', 8, 6], ['stool', 9, 6], ['plant', 11, 7], ...ORIG(o, 0, 7)],
      keeper: [6, 0], wander: [[5, 5], [6, 3], [10, 2]] };
  },
  // casa de banhos: tinas de água quente, braseiro e bancos
  bath(o) {
    return { w: 12, h: 8, items: [['tub', 1, 1, 3, 2], ['tub', 8, 1, 3, 2], ['brazier', 11, 0, 1, 1, { light: 1 }], ['brazier', 0, 0, 1, 1, { light: 1 }], ['window', 2, -1], ['window', 9, -1], ['lamp', 5, -1],
      ['counter', 5, 4, 2, 1, { act: 'work' }], ['bench', 1, 5, 3], ['bench', 8, 5, 3], ['barrel', 0, 7], ['plant', 11, 7], ['rug', 5, 1, 2, 2], ...ORIG(o, 9, 7)],
      keeper: [5, 3], wander: [[2, 4], [9, 4]] };
  },
  // torre: escada para o alto, armas, mesa da guarda e braseiro
  tower(o) {
    return { w: 9, h: 8, items: [['ladder', 3, -1, 2], ['weaponrack', 0, 0, 2], ['barrel', 8, 0], ['crate', 8, 1], ['window', 1, -1], ['banner', 6, -1], ['lamp', 7, -1],
      ['counter', 3, 2, 3, 1, { act: 'work' }], ['table', 1, 5, 2], ['stool', 0, 5], ['stool', 3, 5], ['brazier', 8, 5, 1, 1, { light: 1 }], ['crate', 0, 7], ...ORIG(o, 6, 7)],
      keeper: [4, 1], wander: [[6, 4], [2, 3]] };
  },
  // estábulo: baias com cavalos, feno, arreios
  stable(o) {
    return { w: 13, h: 8, items: [['stall', 0, 0, 2, 2], ['stall', 2, 0, 2, 2], ['stall', 4, 0, 2, 2], ['hay', 10, 0, 2, 1], ['hay', 11, 1], ['toolrack', 7, -1, 2], ['window', 9, -1], ['lamp', 6, -1],
      ['counter', 7, 4, 3, 1, { act: 'work' }], ['sacks', 0, 7], ['crate', 1, 7], ['barrel', 12, 7], ['hay', 0, 4], ...ORIG(o, 10, 6)],
      keeper: [8, 3], wander: [[3, 5], [11, 4]] };
  },
  // celeiro: sacas, farinha e caixotes até o teto
  granary(o) {
    return { w: 12, h: 8, items: [['sacks', 0, 0], ['sacks', 1, 0], ['sacks', 2, 0], ['sacks', 0, 1], ['sacks', 1, 1], ['crate', 5, 0], ['crate', 6, 0], ['flour', 9, 0], ['flour', 10, 0], ['flour', 11, 0], ['sacks', 11, 1],
      ['hay', 0, 3, 2, 1], ['window', 4, -1], ['lamp', 8, -1], ['counter', 5, 4, 3, 1, { act: 'work' }], ['barrel', 0, 7], ['barrel', 11, 7], ['crate', 11, 5], ...ORIG(o, 1, 6)],
      keeper: [6, 3], wander: [[3, 5], [9, 5]] };
  },
  // casa de curas: leitos, ervas penduradas e o caldeirão de unguentos
  clinic(o) {
    return { w: 12, h: 8, items: [['bed', 0, 0, 1, 2], ['bed', 2, 0, 1, 2], ['bed', 9, 0, 1, 2], ['bed', 11, 0, 1, 2], ['herbs', 4, -1, 2], ['lamp', 3, -1], ['window', 7, -1],
      ['cauldron', 6, 1, 1, 1, { light: 1, lr: 80, lcol: '#7aff9a' }], ['shelf', 8, -1, 1], ['table', 0, 5, 2], ['counter', 5, 4, 3, 1, { act: 'work' }], ['plant', 11, 7], ['sacks', 11, 4], ...ORIG(o, 9, 6)],
      keeper: [6, 3], wander: [[3, 6], [9, 5]] };
  },
  // santuário: altar de pedra com velas e bancos (a bênção é no altar)
  shrine(o) {
    return { w: 9, h: 8, items: [['altar', 3, 1, 3, 1, { act: 'orig' }], ['candles', 1, 1, 1, 1, { light: 1 }], ['candles', 7, 1, 1, 1, { light: 1 }], ['stained', 3, -1, 3], ['carpet', 4, 2, 1, 6],
      ['pew', 0, 4, 3], ['pew', 6, 4, 3], ['plant', 0, 0], ['plant', 8, 0], ['lantern', 0, 7, 1, 1, { light: 1 }], ['lantern', 8, 7, 1, 1, { light: 1 }]],
      keeper: [6, 2], wander: [[2, 6], [6, 6]] };
  },
  // quartel: beliches, mesa dos soldados, armas e armaduras
  barracks(o) {
    return { w: 14, h: 9, items: [['bed', 0, 0, 1, 2], ['bed', 2, 0, 1, 2], ['bed', 4, 0, 1, 2], ['bed', 9, 0, 1, 2], ['bed', 11, 0, 1, 2], ['bed', 13, 0, 1, 2],
      ['banner', 6, -1], ['banner', 7, -1], ['brazier', 6, 1, 1, 1, { light: 1 }], ['table', 4, 4, 2], ['table', 8, 4, 2], ['stool', 3, 4], ['stool', 6, 4], ['stool', 7, 4], ['stool', 10, 4],
      ['weaponrack', 0, 7, 3], ['armor', 13, 7], ['armor', 12, 7], ['desk', 10, 6, 2, 1, { act: 'work' }], ...ORIG(o, 0, 5, 'board', 1)],
      keeper: [11, 5], wander: [[2, 5], [12, 3]] };
  },
  armory(o) {
    return { w: 12, h: 8, items: [['weaponrack', 0, 0, 2], ['weaponrack', 3, 0, 2], ['weaponrack', 7, 0, 2], ['weaponrack', 10, 0, 2], ['armor', 0, 3], ['armor', 0, 5], ['armor', 11, 3], ['armor', 11, 5],
      ['anvil', 5, 2], ['toolrack', 5, -1, 2], ['banner', 2, -1], ['banner', 9, -1], ['lamp', 8, -1], ['crate', 10, 7], ['crate', 1, 7], ['counter', 5, 5, 3, 1, { act: 'work' }], ...ORIG(o, 2, 7)],
      keeper: [6, 4], wander: [[3, 3], [8, 3]] };
  },
  // adega (e o cogumelal): barris, tonéis e pouca luz
  cellar(o) {
    return { w: 10, h: 7, items: [['kegs', 0, 0, 2], ['kegs', 0, 1, 2], ['kegs', 8, 0, 2], ['kegs', 8, 1, 2], ['barrel', 3, 0], ['barrel', 6, 0], ['lamp', 2, -1], ['lamp', 7, -1],
      ['table', 4, 3, 2], ['stool', 3, 3], ['stool', 6, 3], ['crate', 0, 6], ['barrel', 9, 6], ...ORIG(o, 7, 5)],
      keeper: [5, 1], wander: [[2, 4], [8, 4]] };
  },
  // defumadouro: varais de carne e peixe sobre o braseiro
  smoke(o) {
    return { w: 11, h: 7, items: [['fishrack', 0, 0, 3], ['fishrack', 4, 0, 3], ['hides', 8, -1, 2], ['brazier', 9, 1, 1, 1, { light: 1 }], ['window', 3, -1], ['lamp', 7, -1],
      ['table', 1, 3, 2], ['counter', 5, 3, 3, 1, { act: 'work' }], ['barrel', 0, 6], ['crate', 10, 6], ...ORIG(o, 7, 5)],
      keeper: [6, 2], wander: [[2, 5], [9, 4]] };
  },
  // olaria: fornos, prateleiras de potes e o barro
  pottery(o) {
    return { w: 11, h: 7, items: [['oven', 0, 0, 2], ['oven', 2, 0, 2], ['shelf', 5, -1, 3], ['stones', 9, 0], ['stones', 10, 0], ['sacks', 10, 2], ['window', 8, -1],
      ['table', 3, 3, 3, 1], ['counter', 7, 3, 2, 1, { act: 'work' }], ['crate', 0, 6], ['barrel', 10, 6], ...ORIG(o, 1, 5)],
      keeper: [7, 2], wander: [[2, 4], [9, 5]] };
  },
});
Object.assign(FURN, { tub: { block: true }, stall: { block: true }, hay: { block: true }, slate: {}, ladder: {} });
Object.assign(FURN_EXTRA, {
  tub(ctx, f, X, Y, t, H) {
    const { R, ell, sh } = H, w = f.w * TILE, h = f.h * TILE;
    sh(2, h - 6, w - 4, 7); R(2, 6, w - 4, h - 10, '#7a5a3a'); R(2, 6, w - 4, 3, '#9a7448'); R(5, 10, w - 10, h - 18, '#5aa0c8'); R(5, 10, w - 10, 2, '#9ad0ec');
    for (let k = 0; k < 3; k++) { const yy = 4 - ((t * 10 + k * 5) % 14); ell(12 + k * (w - 24) / 2, yy, 4, 3, 'rgba(255,255,255,0.35)'); }
  },
  stall(ctx, f, X, Y, t, H) {
    const { R, ell } = H, w = f.w * TILE, h = f.h * TILE;
    R(3, h - 6, w - 6, 5, '#d8c070'); R(0, 4, 3, h - 4, '#6b4423'); R(w - 3, 4, 3, h - 4, '#6b4423'); R(0, 14, w, 3, '#8b5f38');
    const c = ['#7a4a2a', '#3a2a1e', '#c8b8a0'][f.id % 3], b = Math.sin(t * 1.5 + f.id) * 1;
    ell(w / 2 - 2, h / 2 + 8, 15, 9, c); R(w / 2 - 14, h / 2 + 12, 3, 12, c); R(w / 2 + 8, h / 2 + 12, 3, 12, c);
    R(w / 2 + 8, h / 2 - 8 + b, 6, 14, c); ell(w / 2 + 13, h / 2 - 9 + b, 7, 4, c); R(w / 2 + 6, h / 2 - 8 + b, 2, 12, '#2a1a10');
  },
  hay(ctx, f, X, Y, t, H) {
    const { R, ell, sh } = H, w = f.w * TILE, h = f.h * TILE;
    sh(2, h - 6, w - 4, 6); ell(w / 2, h - 13, w / 2 - 2, 12, '#d8c070'); for (let k = 6; k < w - 6; k += 5) R(k, h - 22 + (k % 3), 1, 12, '#b89a40'); R(4, h - 14, w - 8, 2, '#8a6a2a');
  },
  slate(ctx, f, X, Y, t, H) {
    const { R } = H, w = f.w * TILE;
    R(2, 2, w - 4, 26, '#5a3a1e'); R(4, 4, w - 8, 22, '#2a3a32');
    for (let k = 0; k < 4; k++) R(10 + (k % 2) * 6, 8 + k * 4, w - 40 + (k * 7) % 20, 1, '#e8e8e0');
    R(w - 26, 9, 10, 10, 'rgba(232,232,224,0.0)'); R(w - 22, 8, 1, 12, '#e8e8e0'); R(w - 28, 14, 13, 1, '#e8e8e0'); R(6, 28, w - 12, 2, '#8a5a30');
  },
  ladder(ctx, f, X, Y, t, H) {
    const { R } = H, w = f.w * TILE;
    R(w / 2 - 12, -18, 3, 50, '#6b4423'); R(w / 2 + 9, -18, 3, 50, '#6b4423'); for (let y = -14; y < 30; y += 7) R(w / 2 - 10, y, 20, 2, '#8b5f38');
    R(w / 2 - 14, -22, 28, 4, '#3a2a1e');
  },
});

// ------------------------------------------------------------------ negociar com o responsável
// cada estabelecimento vende o que é dele, e quem negocia é sempre o responsável (no balcão ou na conversa)
{
  const has = list => list.filter(k => ITEMS[k]);
  const NEW_SHOPS = {
    bakery:  ['🍞', 'Padaria', 'baker', ['bread', 'flour', 'wheat', 'egg', 'milk', 'honey', 'cheese', 'honey_cake', 'meat_pie', 'apple_pie', 'cake']],
    mill:    ['🌾', 'Moinho', 'miller', ['flour', 'wheat', 'barley', 'wheat_seed', 'barley_seed', 'sacks']],
    inn:     ['🛏️', 'Estalagem', 'innkeeper', ['beer', 'mead', 'wine', 'bread', 'cooked_meat', 'cooked_fish', 'stew', 'cheese']],
    school:  ['📚', 'Escola', 'teacher', ['parchment', 'book', 'candle', 'ink']],
    bath:    ['🛁', 'Casa de Banhos', 'bather', ['herbal_salve', 'herb', 'cloth', 'soap', 'candle']],
    tower:   ['🗼', 'Torre de Vigia', 'watchman', ['arrow', 'bow', 'torch', 'rope', 'leather']],
    weaver:  ['🧵', 'Tecelagem', 'weaver', ['cloth', 'wool_cloth', 'rope', 'fiber', 'wool', 'linen_hood', 'linen_tunic', 'linen_pants', 'wool_hat', 'tapestry', 'silk_cloth']],
    brewer:  ['🍺', 'Cervejaria', 'brewer', ['beer', 'mead', 'wine', 'barley', 'honey', 'barley_seed']],
    trade:   ['🐫', 'Entreposto', 'trader', ['spices', 'silk_cloth', 'wine', 'salt', 'iron_bar', 'cloth', 'honey', 'amber', 'camel_hair', 'gem']],
    stable:  ['🐴', 'Estrebaria', 'groom', ['rope', 'leather', 'wheat', 'apple', 'carrot', 'barley']],
    mine:    ['⛏️', 'Mina', 'miner', ['coal', 'iron_ore', 'copper_ore', 'tin_ore', 'silver_ore', 'gold_ore', 'stone']],
    sawmill: ['🪚', 'Serraria', 'sawyer', ['wood', 'hardwood', 'plank', 'beam', 'resin']],
    granary: ['🌽', 'Celeiro', 'granger', ['wheat', 'barley', 'flour', 'carrot', 'cabbage', 'apple', 'wheat_seed', 'barley_seed', 'carrot_seed', 'cabbage_seed']],
    clinic:  ['🌿', 'Casa de Curas', 'healer', ['herb', 'herbal_salve', 'healing_potion', 'bandage', 'honey']],
  };
  for (const [k, [icon, name, rank, list]] of Object.entries(NEW_SHOPS)) {
    const sells = has(list);
    SHOPS[k] = { name, icon, rank, sells, buys: it => !!it && sells.includes(it.key) };
    if (RANKS[rank] && !RANKS[rank].shop) RANKS[rank].shop = k;
    if (!People.PURSE[rank]) People.PURSE[rank] = [180, 520];
  }
  // prédio → loja (a estalagem negocia como estalagem; os empreendimentos das famílias, como armazém, moinho e ferreiro)
  const WORK_SHOP = { vbakery: 'bakery', vmill: 'mill', fmill: 'mill', vinn: 'inn', vschool: 'school', vbath: 'bath', vtower: 'tower', vweaver: 'weaver',
    vbrewery: 'brewer', vtrade: 'trade', vstable: 'stable', vmine: 'mine', vsawmill: 'sawmill', vgranary: 'granary', vclinic: 'clinic', fshop: 'store', fforge: 'smith' };
  Work.shopOf = s => (s && WORK_SHOP[s.type]) || null;
  const use1 = Places.use.bind(Places);
  Places.use = function (f) {
    const s = G.place && G.place.src, sk = f.act === 'work' && Work.shopOf(s);
    if (sk) { const k = Shops.keeper(s); if (k) { UI.showShop(sk, Work.vi(s), k.id); return; } }
    return use1(f);
  };
  const fl1 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    const s = G.place && G.place.src, sk = f.act === 'work' && Work.shopOf(s);
    if (sk) { const k = Shops.keeper(s); return k ? `Balcão — negociar com ${k.name} (${People.title(k)})` : 'Balcão — ninguém cuidando agora'; }
    return fl1(f);
  };
}

// ------------------------------------------------------------------ galinheiro e canil também têm o lado de dentro
Object.assign(RANKS, { keeperA: { m: 'Tratador', f: 'Tratadora', order: 6 } });
RANK_LOOK.keeperA = '#7a6a3a';
Object.assign(WORKPLACES, { coop: ['keeperA', 'coop', 'wood', 'player', true], kennel: ['keeperA', 'kennel', 'wood', 'player', true] });
SHOP_KEEPER.coop = SHOP_KEEPER.kennel = 'keeperA';
Object.assign(LAYOUTS, {
  coop(o) {
    return { w: 10, h: 7, items: [['nest', 0, 0], ['nest', 1, 0], ['nest', 2, 0], ['nest', 7, 0], ['nest', 8, 0], ['nest', 9, 0], ['hay', 4, 0, 2, 1], ['window', 3, -1], ['lamp', 6, -1],
      ['sacks', 0, 6], ['barrel', 9, 6], ['crate', 9, 4], ['counter', 3, 3, 2, 1, { act: 'work' }], ...ORIG(o, 6, 5)], keeper: [4, 2], wander: [[2, 4], [7, 3]] };
  },
  kennel(o) {
    return { w: 10, h: 7, items: [['dogbed', 0, 0, 2, 1], ['dogbed', 8, 0, 2, 1], ['hay', 4, 0, 2, 1], ['toolrack', 3, -1, 2], ['window', 7, -1], ['lamp', 1, -1],
      ['barrel', 0, 6], ['crate', 9, 6], ['counter', 4, 3, 2, 1, { act: 'work' }], ...ORIG(o, 7, 4)], keeper: [5, 2], wander: [[2, 4], [7, 3]] };
  },
});
Object.assign(FURN, { nest: { block: true }, dogbed: { block: true } });
Object.assign(FURN_EXTRA, {
  nest(ctx, f, X, Y, t, H) {
    const { R, ell, sh } = H; sh(2, 24, 28, 6); R(2, 14, 28, 14, '#8b5f38'); ell(16, 16, 12, 4, '#d8c070');
    const b = Math.sin(t * 3 + f.id) * 0.8, c = f.id % 3 ? '#f4ead8' : '#b8703a';
    ell(16, 11 + b, 8, 6, c); ell(22, 6 + b, 3.6, 3.4, c); R(23, 2 + b, 3, 2, '#d8302a'); R(25, 6 + b, 3, 1.6, '#e0a526'); R(22, 5 + b, 1, 1, '#1a120a');
  },
  dogbed(ctx, f, X, Y, t, H) {
    const { R, ell, sh } = H, w = f.w * TILE; sh(2, 24, w - 4, 6); ell(w / 2, 20, w / 2 - 3, 8, '#7a3a2a'); ell(w / 2, 19, w / 2 - 7, 5, '#a85a3a');
    const br = Math.sin(t * 2 + f.id) * 0.6, c = ['#8a6a4a', '#3a2a1e', '#c8b8a0'][f.id % 3];
    ell(w / 2 - 2, 15 + br, 11, 5, c); ell(w / 2 + 9, 13, 5, 4, c); ell(w / 2 + 12, 15, 2.6, 2, c); R(w / 2 + 7, 9, 2, 4, c); R(w / 2 + 13, 14, 1, 1, '#1a120a'); ell(w / 2 - 13, 16, 4, 1.6, c, 0.4);
  },
});

// ------------------------------------------------------------------ quem trabalha: sempre camponeses
// funcionários dos seus empreendimentos e responsáveis dos prédios saem do povo: camponeses adultos, nunca gente da
// corte, de família real ou nobre, padres ou soldados
People.royalKin = function (p) {
  const f = Families.of(p); if (!f) return false;
  if (f.noble) return true;
  return G.people.some(m => m.alive && m.fam === f.id && (NOBLE_RANKS.includes(m.rank) || (m.home && m.home.type === 'castle')));
};
People.commoner = function (p) { return !!p && p.alive && p.rank === 'peasant' && People.isAdult(p) && !People.isCourt(p) && !People.royalKin(p) && !p.council; };
{
  const can0 = Biz.can.bind(Biz);
  Biz.can = function (p) {
    const r = can0(p); if (r !== true) return r;
    if (p.rank !== 'peasant') return 'Só camponeses trabalham nos empreendimentos.';
    if (People.royalKin(p)) return 'Sou de família nobre: não trabalho por salário.';
    return true;
  };
  const sc0 = People.shopCandidates.bind(People);
  People.shopCandidates = function (vi, rank) { return sc0(vi, rank).filter(q => People.commoner(q)); };
  // o primeiro funcionário vem sozinho (sem adiantamento): o camponês livre mais perto
  Biz.autoHire = function (quiet) {
    let n = 0;
    for (const s of this.list()) {
      if (s.removed || this.workerCount(s) > 0) continue;
      const c = this.candidates(s)[0];
      const p = c && c.p;
      if (!p) continue;
      s.workers = (s.workers || []).filter(id => G.people[id] && G.people[id].alive && G.people[id].job === s.id);
      s.workers.push(p.id); p.job = s.id; p.met = true;
      const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
      if (!quiet) UI.msg(`💼 ${People.full(p)} foi contratad${p.sex === 'f' ? 'a' : 'o'} para o seu ${this.name(s)} (${this.wage(p, s)} 🪙 por mês).`, 'gold');
      n++;
    }
    return n;
  };
  const bd0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { const r = bd0(...a); this.autoHire(); return r; };
  const pb1 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function (...a) { const n = World.structs.length, r = pb1(...a); if (World.structs.slice(n).some(s => BIZ_TYPES[s.type] && s.owner === 'player')) Biz.autoHire(); return r; };
  const er1 = Places.enterRoom.bind(Places);
  Places.enterRoom = function (src) { if (src && src.owner === 'player' && BIZ_TYPES[src.type] && !Biz.workerCount(src)) Biz.autoHire(); return er1(src); };
}
