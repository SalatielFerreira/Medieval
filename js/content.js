'use strict';
// Mais coisas no mundo: dez empreendimentos novos (com o lado de dentro), horta e pomar, praça (poço, chafariz, estátua,
// lampião, banco, canteiros e cercas), cultura e fé (biblioteca, campo de treino, oratório), torre de vigia, as oficinas
// novas (defumadouro, tear e olaria) e as obras novas que governadores e reis erguem nas vilas. Também desenha tudo isso.

// ---------------------------------------------------------------- empreendimentos novos
Object.assign(BIZ_TYPES, {
  biz_bakery:     { skill: 'peasant',   slots: 3, wage: 4, out: { bread: 4, apple_pie: 1 } },
  biz_brewery:    { skill: 'innkeeper', slots: 2, wage: 5, out: { beer: 3, mead: 1 } },
  biz_tannery:    { skill: 'hunter',    slots: 3, wage: 4, out: { leather: 3, hard_leather: 1 } },
  biz_weaver:     { skill: 'peasant',   slots: 3, wage: 4, out: { cloth: 3, rope: 2, wool_cloth: 1 } },
  biz_fishery:    { skill: 'sailor',    slots: 3, wage: 4, out: { trout: 2, cod: 2, sardine: 2 } },
  biz_winery:     { skill: 'peasant',   slots: 3, wage: 5, out: { wine: 3 }, season: true },
  biz_ranch:      { skill: 'hunter',    slots: 3, wage: 4, out: { meat: 3, wool: 2, milk: 2, leather: 1 } },
  biz_inn:        { skill: 'innkeeper', slots: 3, wage: 5, gold: 12 },
  biz_jeweler:    { skill: 'smith',     slots: 2, wage: 7, out: { silver_ring: 1, gold_ring: 1 } },
  biz_apothecary: { skill: 'peasant',   slots: 2, wage: 5, out: { herbal_salve: 2, healing_potion: 1 } },
});
Object.assign(BIZ_TRADE, { biz_bakery: 'store', biz_brewery: 'store', biz_tannery: 'hunter', biz_weaver: 'store', biz_fishery: 'store', biz_winery: 'store',
  biz_ranch: 'hunter', biz_inn: 'store', biz_jeweler: 'smith', biz_apothecary: 'store' });
Object.assign(BIZ_ROOMS, { biz_bakery: 'bakery', biz_brewery: 'brewhouse', biz_tannery: 'tannery', biz_weaver: 'weaver', biz_fishery: 'fishery', biz_inn: 'inn', biz_jeweler: 'jeweler', biz_apothecary: 'apothecary' });
Object.assign(ROOM_TYPES, {
  library: { lay: 'library', theme: 'wood', name: () => 'Sua Biblioteca', owned: true },
  oratory: { lay: 'oratory', theme: 'chapel', name: () => 'Seu Oratório', owned: true },
});
// lojas de vila vendem algumas coisas novas
SHOPS.store.sells.push('cheese', 'smoked_meat', 'candle', 'clay_pot');
SHOPS.hunter.sells.push('fur_boots', 'tusk_amulet');
SHOPS.smith.sells.push('gold_ring');
GIFTABLE.push('cheese', 'candle', 'book', 'tapestry', 'tusk_amulet', 'gold_ring', 'gem_ring', 'healing_potion');
for (const k in ITEMS) ITEMS[k].key = k;

// ---------------------------------------------------------------- plantas dos cômodos novos
Object.assign(LAYOUTS, {
  bakery() {
    return { w: 11, h: 8, items: [['oven', 0, 0, 2], ['oven', 2, 0, 2], ['breadrack', 6, -1, 2], ['flour', 9, 0], ['flour', 10, 0], ['sacks', 10, 1], ['table', 3, 3, 3, 1],
      ['counter', 6, 5, 3, 1, { act: 'bizshop' }], ['desk', 0, 5, 2, 1, { act: 'biz' }], ['window', 5, -1], ['lamp', 8, -1], ['barrel', 10, 7], ['rug', 4, 6, 2, 2]],
      keeper: [7, 4], staff: [[1, 1], [4, 2], [8, 2]], wander: [[3, 6], [9, 5]] };
  },
  brewhouse() {
    return { w: 12, h: 8, items: [['vat', 0, 0, 2, 2], ['vat', 3, 0, 2, 2], ['kegs', 8, 0, 2], ['kegs', 10, 0, 2], ['kegs', 8, 1, 2], ['sacks', 11, 3], ['window', 6, -1], ['lamp', 2, -1], ['lamp', 9, -1],
      ['counter', 5, 4, 3, 1, { act: 'bizshop' }], ['desk', 0, 4, 2, 1, { act: 'biz' }], ['table', 9, 6, 2], ['stool', 8, 6], ['stool', 11, 6], ['barrel', 0, 7]],
      keeper: [6, 3], staff: [[2, 2], [5, 2], [9, 3]], wander: [[3, 6], [6, 6]] };
  },
  tannery() {
    return { w: 12, h: 8, items: [['hides', 0, -1, 2], ['hides', 3, -1, 2], ['hides', 8, -1, 2], ['vat', 0, 1, 2, 2], ['vat', 3, 1, 2, 2], ['planks', 9, 1, 2], ['window', 6, -1], ['lamp', 11, -1],
      ['counter', 5, 4, 3, 1, { act: 'bizshop' }], ['desk', 0, 5, 2, 1, { act: 'biz' }], ['crate', 11, 7], ['barrel', 10, 7]],
      keeper: [6, 3], staff: [[2, 3], [6, 1], [9, 3]], wander: [[3, 6], [8, 6]] };
  },
  weaver() {
    return { w: 12, h: 8, items: [['loomf', 0, 0, 2], ['loomf', 3, 0, 2], ['loomf', 6, 0, 2], ['shelf', 9, -1, 3], ['sacks', 10, 1], ['sacks', 11, 1], ['window', 2, -1], ['lamp', 5, -1],
      ['counter', 5, 4, 3, 1, { act: 'bizshop' }], ['desk', 0, 4, 2, 1, { act: 'biz' }], ['rug', 9, 4, 2, 2], ['crate', 11, 7], ['plant', 0, 7]],
      keeper: [6, 3], staff: [[1, 1], [4, 1], [7, 1]], wander: [[3, 6], [9, 6]] };
  },
  fishery() {
    return { w: 12, h: 8, items: [['nets', 0, -1, 2], ['nets', 4, -1, 2], ['barrel', 0, 0], ['barrel', 1, 0], ['fishrack', 8, 0, 3], ['crate', 11, 0], ['window', 7, -1], ['lamp', 11, -1],
      ['counter', 5, 4, 3, 1, { act: 'bizshop' }], ['desk', 0, 4, 2, 1, { act: 'biz' }], ['table', 9, 5, 2], ['barrel', 0, 7], ['crate', 11, 7]],
      keeper: [6, 3], staff: [[3, 1], [7, 2], [10, 2]], wander: [[3, 6], [8, 6]] };
  },
  inn() {
    const L = LAYOUTS.tavern({ mine: true });
    L.items = L.items.map(it => it[0] === 'bar' ? ['bar', 3, 2, 5, 1, { act: 'bizshop' }] : it).concat([['desk', 12, 7, 2, 1, { act: 'biz' }], ['bed', 0, 3, 1, 2], ['bed', 13, 4, 1, 2]]);
    return L;
  },
  jeweler() {
    return { w: 10, h: 7, items: [['display', 1, 3, 2], ['display', 7, 3, 2], ['jewelbench', 0, 0, 2], ['jewelbench', 7, 0, 2], ['stained', 4, -1, 2], ['lamp', 3, -1], ['lamp', 6, -1],
      ['counter', 3, 4, 4, 1, { act: 'bizshop' }], ['desk', 4, 0, 2, 1, { act: 'biz' }], ['plant', 0, 6], ['plant', 9, 6], ['carpet', 4, 5, 2, 2]],
      keeper: [5, 3], staff: [[1, 1], [8, 1]], wander: [[2, 5], [8, 5]] };
  },
  apothecary() {
    return { w: 10, h: 7, items: [['herbs', 0, -1, 2], ['herbs', 7, -1, 2], ['shelf', 3, -1, 3], ['cauldron', 0, 1, 1, 1, { light: 1, lr: 80, lcol: '#7aff9a' }], ['table', 7, 1, 2], ['sacks', 9, 3],
      ['counter', 3, 3, 4, 1, { act: 'bizshop' }], ['desk', 0, 4, 2, 1, { act: 'biz' }], ['plant', 9, 6], ['window', 2, -1], ['lamp', 6, -1]],
      keeper: [5, 2], staff: [[1, 2], [8, 2]], wander: [[3, 5], [7, 5]] };
  },
  library() {
    return { w: 11, h: 8, items: [['bookshelf', 0, -1, 2], ['bookshelf', 2, -1, 2], ['bookshelf', 7, -1, 2], ['bookshelf', 9, -1, 2], ['bookshelf', 0, 2, 2], ['bookshelf', 9, 2, 2],
      ['window', 5, -1], ['lamp', 4, -1], ['lamp', 6, -1], ['desk', 4, 2, 3, 1, { act: 'study' }], ['table', 2, 5, 2], ['table', 7, 5, 2], ['stool', 1, 5], ['stool', 9, 5], ['carpet', 5, 3, 1, 5], ['plant', 0, 7], ['plant', 10, 7]],
      wander: [[3, 4], [8, 4]] };
  },
  oratory() {
    return { w: 8, h: 7, items: [['altar', 3, 1, 2, 1, { act: 'pray' }], ['candles', 1, 1, 1, 1, { light: 1 }], ['candles', 6, 1, 1, 1, { light: 1 }], ['stained', 3, -1, 2], ['carpet', 3, 2, 2, 5],
      ['pew', 0, 4, 3], ['pew', 5, 4, 3], ['plant', 0, 0], ['plant', 7, 0]], wander: [[2, 5]] };
  },
});
Object.assign(FURN, {
  vat: { block: true }, hides: {}, loomf: { block: true }, nets: {}, fishrack: { block: true }, display: { block: true }, jewelbench: { block: true },
  herbs: {}, cauldron: { block: true }, breadrack: {},
});
// desenho dos móveis novos (chamado pelo drawFurn)
const FURN_EXTRA = {
  vat(ctx, f, X, Y, t, H) { const { R, ell, sh } = H, w = f.w * TILE, h = f.h * TILE; sh(2, h - 6, w - 4, 8); ell(w / 2, h / 2 + 6, w / 2 - 4, h / 2 - 6, '#7a4a22'); ell(w / 2, h / 2 + 2, w / 2 - 7, h / 2 - 12, '#8a6a2a'); ell(w / 2, h / 2 + 2, w / 2 - 10, h / 2 - 15, '#c8a040'); R(4, h / 2, w - 8, 2, '#3a3a3a'); },
  hides(ctx, f, X, Y, t, H) { const { R } = H, w = f.w * TILE; R(2, 3, w - 4, 3, '#5a3a1e'); for (let k = 0; k < f.w * 2; k++) { const x = 6 + k * 14; R(x, 6, 10, 18, ['#8a5a30', '#a0703a', '#6a4422'][k % 3]); R(x + 2, 22, 6, 4, ['#8a5a30', '#a0703a', '#6a4422'][k % 3]); } },
  loomf(ctx, f, X, Y, t, H) { const { R, sh } = H, w = f.w * TILE; sh(2, 26, w - 4, 5); R(2, -6, 4, 34, '#6b4423'); R(w - 6, -6, 4, 34, '#6b4423'); R(2, -6, w - 4, 4, '#8b5f38'); for (let k = 8; k < w - 8; k += 3) R(k, -2, 1, 22, ['#d8c8a8', '#c84a4a', '#4a7ac8'][(k / 3 | 0) % 3]); R(6, 16, w - 12, 6, '#b8a888'); R(4, 22, w - 8, 3, '#8b5f38'); },
  nets(ctx, f, X, Y, t, H) { const w = f.w * TILE; ctx.strokeStyle = '#c8b88a'; ctx.lineWidth = 1; for (let k = 4; k < w - 2; k += 5) { ctx.beginPath(); ctx.moveTo(X + k, Y + 4); ctx.lineTo(X + k + 6, Y + 28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X + k + 6, Y + 4); ctx.lineTo(X + k, Y + 28); ctx.stroke(); } H.R(2, 2, w - 4, 3, '#5a3a1e'); },
  fishrack(ctx, f, X, Y, t, H) { const { R, sh } = H, w = f.w * TILE; sh(2, 26, w - 4, 5); R(2, 2, 3, 26, '#6b4423'); R(w - 5, 2, 3, 26, '#6b4423'); R(2, 4, w - 4, 2, '#8b5f38'); for (let k = 0; k < f.w * 3; k++) { const x = 8 + k * 9; R(x, 6, 2, 3, '#3a3a3a'); R(x - 2, 9, 6, 13, k % 2 ? '#9ab0c0' : '#c0a080'); } },
  display(ctx, f, X, Y, t, H) { const { R, sh } = H, w = f.w * TILE; sh(0, 26, w, 5); R(2, 8, w - 4, 20, '#5a3a1e'); R(4, 6, w - 8, 10, 'rgba(200,230,255,0.45)'); const g = ['#ffd54a', '#c8d0d8', '#e04a8a', '#4ac8e0']; for (let k = 0; k < f.w * 2; k++) R(8 + k * 12, 10, 5, 4, g[(k + f.id) % 4]); R(4, 6, w - 8, 1, '#ffffff'); },
  jewelbench(ctx, f, X, Y, t, H) { const { R, sh } = H, w = f.w * TILE; sh(2, 26, w - 4, 5); R(2, 10, w - 4, 8, '#8a5a30'); R(4, 18, 3, 10, '#5a3a1e'); R(w - 7, 18, 3, 10, '#5a3a1e'); R(10, 6, 6, 4, '#ffd54a'); R(20, 7, 4, 3, '#c8d0d8'); R(w - 14, 4, 8, 6, '#3a3a40'); },
  herbs(ctx, f, X, Y, t, H) { const { R } = H, w = f.w * TILE; R(2, 3, w - 4, 2, '#5a3a1e'); for (let k = 0; k < f.w * 3; k++) { const x = 6 + k * 9; R(x + 1, 5, 1, 4, '#5a3a1e'); R(x - 2, 9, 7, 12, ['#5a8a3a', '#7a9a4a', '#8a6a9a'][k % 3]); } },
  cauldron(ctx, f, X, Y, t, H) { const { R, ell, sh } = H; sh(4, 26, 24, 5); R(8, 24, 3, 6, '#2a2a2a'); R(21, 24, 3, 6, '#2a2a2a'); ell(16, 18, 12, 9, '#2a2a30'); ell(16, 12, 10, 3, '#5ad87a'); for (let k = 0; k < 3; k++) { const yy = 10 - ((t * 20 + k * 7) % 14); ell(10 + k * 6, yy, 2, 2, 'rgba(150,255,170,0.6)'); } },
  breadrack(ctx, f, X, Y, t, H) { const { R, ell } = H, w = f.w * TILE; R(2, 3, w - 4, 24, '#5a3a1e'); for (let r = 0; r < 2; r++) { R(4, 12 + r * 10, w - 8, 2, '#8a5a30'); for (let k = 0; k < f.w * 2; k++) ell(10 + k * 13, 9 + r * 10, 5, 3, '#c8883a'); } },
};

// ---------------------------------------------------------------- sistemas
const Content = {
  // luzes à noite (raio do brilho)
  LIGHTS: { lamppost: 120, vlamp: 120, watchtower: 70, kiln: 90, smokehouse: 60, biz_inn: 90, biz_bakery: 80, oratory: 70, library: 70, fountain: 50, vfountain: 50, vmarket: 80 },
  // o que a horta e o pomar dão por mês
  produce(s) {
    const w = Season.winter();
    if (s.type === 'garden') return w ? { carrot: 1, cabbage: 1 } : { carrot: 3, cabbage: 2 };
    if (s.type === 'orchard') return w ? {} : { apple: 6 };
    return null;
  },
  monthTick() {
    Succession.tick();
    for (const s of World.structs) {
      if (s.owner !== 'player' || s.removed) continue;
      const out = this.produce(s); if (!out) continue;
      s.goods = s.goods || {};
      for (const k in out) s.goods[k] = Math.min(60, (s.goods[k] || 0) + out[k]);
    }
  },
  mine(type) { return World.structs.filter(s => s.owner === 'player' && !s.removed && s.type === type); },
  capBonus() { return Math.min(4, this.mine('watchtower').length * 2); },
  // ao construir: prestígio da estátua e do chafariz
  onBuild(k) {
    if (k === 'statue') { Court.addFame(5); UI.msg('🗿 O povo admira a sua estátua (+5 de fama).', 'gold'); }
    if (k === 'fountain') { Court.addFame(3); UI.msg('⛲ O chafariz enfeita a sua terra (+3 de fama).', 'gold'); }
  },
  label(s) {
    if (s.owner !== 'player') return { vfountain: '⛲ Chafariz da vila — jogar uma moeda', vmarket: '🎪 Feira da vila — comprar e vender' }[s.type] || '';
    switch (s.type) {
      case 'garden': return `Horta — ${this.goodsTxt(s) || 'crescendo'}`;
      case 'orchard': return `Pomar — ${this.goodsTxt(s) || 'crescendo'}`;
      case 'well_p': return 'Poço — beber água';
      case 'fountain': return 'Chafariz — jogar uma moeda';
      case 'bench': return 'Banco — sentar e descansar';
      case 'training': return 'Campo de Treino — treinar';
      case 'watchtower': return 'Torre de Vigia — olhar ao redor';
      case 'smokehouse': return 'Defumadouro — defumar';
      case 'loom': return 'Tear — tecer';
      case 'kiln': return 'Olaria — moldar barro';
      case 'library': return 'Biblioteca — estudar';
      case 'oratory': return 'Oratório — rezar';
    }
    return '';
  },
  goodsTxt(s) { return Object.entries(s.goods || {}).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', '); },
  // devolve true se cuidou da interação
  interact(s) {
    if (s.type === 'vmarket') { UI.showShop('store', s.village, null); return true; }
    if (s.owner === 'player' || s.type === 'vfountain') switch (s.type) {
      case 'garden': case 'orchard': Biz.collect(s); return true;
      case 'well_p': P.stamina = Game.maxSt(); UI.msg('💧 Água fresca do poço: energia cheia.'); Sound.play('splash'); return true;
      case 'fountain': case 'vfountain':
        if (P.gold < 1) { UI.msg('Você não tem nem uma moeda.'); return true; }
        P.gold -= 1; Sound.play('coin');
        if (Math.random() < 0.35) { Farm.addBuff('blessed'); UI.msg('⛲ A moeda brilhou no fundo do chafariz... você se sente abençoado!', 'gold'); } else UI.msg('⛲ Você fez um pedido e jogou uma moeda.');
        return true;
      case 'bench': P.stamina = Math.min(Game.maxSt(), P.stamina + 50); UI.msg('🪑 Você se senta um pouco e recupera o fôlego.'); return true;
      case 'training': this.train(); return true;
      case 'watchtower': this.watch(); return true;
      case 'smokehouse': UI.showCrafting('defumador'); return true;
      case 'loom': UI.showCrafting('tear'); return true;
      case 'kiln': UI.showCrafting('olaria'); return true;
      case 'library': this.study(); return true;
      case 'oratory': this.pray(); return true;
    }
    return false;
  },
  // ações dos móveis de dentro (estudar na biblioteca, rezar no oratório)
  act(a) { if (a === 'study') { this.study(); return true; } if (a === 'pray') { this.pray(); return true; } return false; },
  study() {
    if (G.studyDay === G.day) { UI.msg('📖 Você já estudou este mês. Volte no mês que vem.'); return; }
    G.studyDay = G.day; const xp = 40 + P.level * 8;
    Game.gainXp(xp); Farm.addBuff('wisdom'); G.stats.studied = (G.stats.studied || 0) + 1;
    UI.msg(`📖 Horas de leitura: +${xp} de experiência e Sabedoria.`, 'gold'); Sound.play('levelup');
  },
  pray() {
    if (G.prayOrDay === G.day) { UI.msg('🙏 Você já rezou aqui este mês.'); return; }
    G.prayOrDay = G.day; Farm.addBuff('blessed'); G.piety = (G.piety || 0) + 3;
    UI.msg('🙏 Você reza em silêncio no oratório: Bênção e +3 de devoção.', 'gold');
  },
  train() {
    if ((G.trainT || 0) > G.realTime) { UI.msg(`🎯 Descanse um pouco antes de treinar de novo (${Math.ceil(G.trainT - G.realTime)} s).`); return; }
    if (P.stamina < 30) { UI.msg('🎯 Você está cansado demais para treinar.', 'bad'); return; }
    P.stamina -= 30; G.trainT = G.realTime + 40;
    const xp = 25 + P.level * 3; Game.gainXp(xp);
    for (const a of Game.allies()) if (a.npc && U.dist(a.x, a.y, P.x, P.y) < 10 * TILE) People.capXp(a.npc, 15);
    P.swing = 0.3; Sound.play('swing');
    UI.msg(`🎯 Golpes nos bonecos de palha: +${xp} de experiência${Game.allies().length ? ' (seus capangas também treinaram)' : ''}.`, 'gold');
  },
  watch() {
    const px = P.x / TILE, py = P.y / TILE;
    const camps = World.camps.filter(c => !c.cleared && U.dist(c.x, c.y, px, py) < 50).length;
    const foes = G.ents.filter(e => !e.dead && e.dmg > 0 && hostile(e, P) && U.dist(e.x, e.y, P.x, P.y) < 30 * TILE).length;
    const wars = G.civs.filter(c => c.ruler !== 'player' && c.atWar).map(c => CIV_DEFS[c.id].short);
    UI.msg(`🗼 Do alto da torre: ${camps ? `${camps} acampamento(s) de bandidos por perto` : 'nenhum acampamento de bandidos por perto'}, ${foes ? `${foes} inimigo(s) à vista` : 'nenhum inimigo à vista'}${wars.length ? ` · em guerra com você: ${wars.join(', ')}` : ''}.`, camps || foes ? 'bad' : '');
  },
};

// ---------------------------------------------------------------- obras novas nas vilas (governadores e reis)
Object.assign(CIVIC, {
  vfountain: { name: 'Chafariz',  icon: '⛲', w: 2, h: 2, cost: { stone: 40, iron_bar: 2 }, desc: 'Enfeita a praça: a vila prospera mais rápido.', prosper: 3 },
  vstatue:   { name: 'Estátua',   icon: '🗿', w: 1, h: 1, cost: { stone: 50 },              desc: 'Uma estátua em honra ao soberano.', prosper: 2 },
  vlamp:     { name: 'Lampião',   icon: '🏮', w: 1, h: 1, cost: { iron_bar: 1, wood: 2 },   desc: 'Ilumina as ruas à noite.' },
  arena:     { name: 'Arena',    icon: '🏟️', w: 4, h: 3, cost: { stone: 120, wood: 60, iron_bar: 6 }, desc: 'Só o rei: um coliseu para duelos, justas, torneios e apostas, com o povo nas arquibancadas.', king: true, prosper: 3 },
  vmarket:   { name: 'Feira',     icon: '🎪', w: 3, h: 2, cost: { wood: 30, cloth: 6 },     desc: 'Barracas de feira na praça: a vila prospera e o comércio cresce.', prosper: 4 },
});

// ---------------------------------------------------------------- desenho das construções novas
function drawStructExtra(ctx, s, X, Y, time, H) {
  const { R, roof, house, flame, flag, shadow, w, h } = H;
  const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const sign = (x, y, ic) => { R(x, y, 14, 11, '#5a3a1e'); ctx.font = '9px sans-serif'; ctx.fillText(ic, X + x + 1, Y + y + 9); };
  const night = G.darkness > 0.2, sn = World.season;
  switch (s.type) {
    case 'biz_bakery': house('#ecdcbc', '#9a3a2a'); R(w - 16, -4, 8, 14, '#8a7a6a'); sign(w - 22, 30, '🥖'); break;
    case 'biz_brewery': house('#a07a4a', '#5a3a1e'); for (const bx of [8, 26]) { R(bx, h - 18, 14, 14, '#7a4a22'); R(bx, h - 14, 14, 2, '#3a3a3a'); } sign(w - 24, 30, '🍺'); break;
    case 'biz_tannery': {
      shadow(); R(6, 26, w - 12, h - 30, '#8a6a42'); roof(4, 8, w - 8, 20, '#6a4a2a');
      for (let k = 0; k < 3; k++) { R(10 + k * 26, h - 22, 3, 18, '#5a3a1e'); R(14 + k * 26, h - 20, 10, 12, ['#8a5a30', '#a0703a', '#6a4422'][k]); }
      break;
    }
    case 'biz_weaver': house('#ddd0b4', '#6a4a8a'); sign(w - 24, 30, '🧶'); for (let k = 0; k < 4; k++) R(10 + k * 6, h - 10, 4, 6, ['#c84a4a', '#4a7ac8', '#d8b84a', '#5aa85a'][k]); break;
    case 'biz_fishery': {
      shadow(); R(6, 26, w - 12, h - 30, '#8a6a4a'); for (let k = 28; k < h - 4; k += 5) R(6, k, w - 12, 1, '#6a4a2a'); roof(4, 8, w - 8, 20, '#2a5a7a');
      ctx.strokeStyle = '#c8b88a'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(X + 10 + k * 6, Y + h - 20); ctx.lineTo(X + 16 + k * 6, Y + h - 4); ctx.stroke(); }
      for (let k = 0; k < 3; k++) R(w - 34 + k * 9, h - 16, 6, 10, k % 2 ? '#9ab0c0' : '#c0a080');
      break;
    }
    case 'biz_winery': {
      R(2, 2, w - 4, h - 4, '#6a5a2e');
      for (let k = 8; k < h - 30; k += 12) { R(4, k, w - 8, 2, '#7a5230'); for (let j = 8; j < w - 6; j += 9) { R(j, k - 9, 2, 10, '#5a3a1e'); if (sn !== 3) { R(j - 3, k - 8, 8, 5, sn === 2 ? '#a8783a' : '#4f8a36'); ctx.fillStyle = '#6a2a6a'; ctx.beginPath(); ctx.arc(X + j + 1, Y + k - 3, 2.5, 0, Math.PI * 2); ctx.fill(); } } }
      R(w - 40, h - 34, 34, 28, '#c9a978'); roof(w - 42, h - 46, 38, 14, '#7b3b22'); R(w - 27, h - 22, 8, 16, '#4a2e16');
      for (const bx of [8, 22]) { R(bx, h - 16, 12, 12, '#7a4a22'); R(bx, h - 12, 12, 2, '#3a3a3a'); }
      break;
    }
    case 'biz_ranch': {
      R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#7a9a4a');
      ctx.strokeStyle = '#8b5f38'; ctx.lineWidth = 3; ctx.strokeRect(X + 3, Y + 3, w - 6, h - 6);
      for (let k = 4; k < w; k += 12) R(k, -2, 3, 8, '#7a5230');
      R(8, 8, 52, 40, '#a8352a'); ctx.fillStyle = '#7a2420'; ctx.beginPath(); ctx.moveTo(X + 4, Y + 10); ctx.lineTo(X + 34, Y - 8); ctx.lineTo(X + 64, Y + 10); ctx.fill();
      R(26, 24, 16, 24, '#3a2410'); R(26, 24, 16, 2, '#efe6d2'); ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 26, Y + 26); ctx.lineTo(X + 42, Y + 46); ctx.moveTo(X + 42, Y + 26); ctx.lineTo(X + 26, Y + 46); ctx.stroke();
      for (const [cx2, cy2, c] of [[80, 40, '#efe6d2'], [100, 66, '#5a3a22'], [74, 74, '#f2f2f2']]) { ell(cx2, cy2, 9, 6, c); R(cx2 + 6, cy2 - 6, 6, 5, c); R(cx2 - 6, cy2 + 4, 2, 5, '#3a2a1a'); R(cx2 + 4, cy2 + 4, 2, 5, '#3a2a1a'); }
      R(w - 30, h - 20, 22, 12, '#d8b84a');
      break;
    }
    case 'biz_inn': {
      shadow(); R(6, 20, w - 12, h - 24, '#d8c39a'); R(6, 52, w - 12, 3, '#8a6a42'); for (const x of [12, 36, 60]) { R(x, 28, 12, 12, '#2a2a3a'); R(x, 60, 12, 12, '#2a2a3a'); if (night) { R(x + 2, 30, 8, 8, '#ffd36b'); R(x + 2, 62, 8, 8, '#ffd36b'); } }
      R(w / 2 - 6, h - 22, 12, 18, '#5a3a1e'); roof(4, 0, w - 8, 22, '#7b3b22'); sign(w - 24, h - 34, '🛏️');
      break;
    }
    case 'biz_jeweler': {
      shadow(); R(4, 22, w - 8, h - 26, '#b8b4aa'); for (let k = 26; k < h - 6; k += 6) R(4, k, w - 8, 1, '#9a968c');
      for (let k = 0; k < 4; k++) R(2 + k * ((w - 4) / 4), 14, Math.ceil((w - 4) / 4), 10, k % 2 ? '#f2efe6' : '#6a2a8a');
      R(w / 2 - 5, h - 20, 10, 16, '#4a2e16'); ctx.fillStyle = '#4ac8e0'; ctx.beginPath(); ctx.moveTo(X + 14, Y + 30); ctx.lineTo(X + 19, Y + 36); ctx.lineTo(X + 14, Y + 44); ctx.lineTo(X + 9, Y + 36); ctx.fill();
      break;
    }
    case 'biz_apothecary': house('#d8d0b0', '#3a6a3a'); sign(w - 22, 30, '🧪'); for (let k = 0; k < 3; k++) { R(8 + k * 8, h - 10, 6, 6, '#9a5a3a'); ell(11 + k * 8, h - 12, 4, 3, '#5a9a3a'); } break;
    case 'smokehouse': {
      shadow(); R(6, 18, w - 12, h - 22, '#7d7f86'); for (let k = 22; k < h - 6; k += 6) R(6, k, w - 12, 1, '#5d5f64'); roof(4, 4, w - 8, 18, '#4a3a2a');
      R(w / 2 - 6, h - 18, 12, 14, '#2a1a10'); for (let k = 0; k < 3; k++) { const yy = 2 - ((time * 14 + k * 9) % 26); ell(w - 14 + Math.sin(time + k) * 3, yy, 4 + k, 3 + k, 'rgba(200,200,200,0.35)'); }
      R(w - 18, -2, 8, 10, '#5d5f64');
      break;
    }
    case 'loom': { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, w - 8, 5); R(4, -6, 4, 34, '#6b4423'); R(w - 8, -6, 4, 34, '#6b4423'); R(4, -6, w - 8, 4, '#8b5f38'); for (let k = 10; k < w - 10; k += 3) R(k, -2, 1, 20, ['#d8c8a8', '#c84a4a', '#4a7ac8'][(k / 3 | 0) % 3]); R(8, 16, w - 16, 6, '#b8a888'); break; }
    case 'kiln': {
      shadow(); ctx.fillStyle = '#a8553a'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 10, w / 2 - 4, h / 2 + 4, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#8a4430'; for (let k = 0; k < 4; k++) ctx.fillRect(X + 8, Y + 20 + k * 8, w - 16, 1);
      const g = 0.7 + Math.sin(time * 8 + s.id) * 0.2; ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 8, 10, Math.PI, 0); ctx.fill();
      ctx.fillStyle = U.rgba('#ff7a1c', g); ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 7, 7, Math.PI, 0); ctx.fill(); R(w / 2 - 4, -4, 8, 12, '#8a4430');
      for (let k = 0; k < 3; k++) R(w - 14 + k * 4, h - 8, 3, 4, '#c8865a');
      break;
    }
    case 'garden': {
      R(2, 2, w - 4, h - 4, '#6e4f2e');
      for (let k = 8; k < h - 2; k += 10) { R(4, k, w - 8, 3, '#5a3f22'); for (let j = 6; j < w - 6; j += 8) { const g = sn === 3 ? '#9a9a8a' : '#5aa83a'; R(j, k - 5, 2, 5, g); R(j - 2, k - 6, 6, 2, g); if ((j / 8 | 0) % 2 && sn !== 3) R(j, k - 1, 2, 2, '#e07a2a'); } }
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, w - 2, h - 2);
      if (s.goods && Object.values(s.goods).some(n => n > 0)) { R(w - 14, 2, 12, 9, '#7a4a22'); R(w - 12, 0, 8, 4, '#e07a2a'); }
      break;
    }
    case 'orchard': {
      R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : sn === 2 ? '#8a7a3a' : '#5d9e3f');
      for (const [tx, ty] of [[22, 30], [70, 26], [30, 76], [76, 74]]) {
        ell(tx, ty + 14, 12, 4, 'rgba(0,0,0,0.25)'); R(tx - 2, ty, 5, 16, '#5b3a1e');
        const leaf = sn === 3 ? '#c8d0d0' : sn === 2 ? '#c8883a' : '#3d7a2a'; ell(tx, ty - 4, 14, 12, leaf); ell(tx - 5, ty - 8, 7, 6, U.shade(leaf, 0.1));
        if (sn === 1 || (sn === 0 && s.goods && s.goods.apple)) for (let k = 0; k < 5; k++) ell(tx - 8 + (k * 7) % 16, ty - 10 + (k * 5) % 12, 2, 2, '#d8302a');
      }
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 1, Y + 1, w - 2, h - 2);
      break;
    }
    case 'well_p': {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 3, Y + 26, 26, 5);
      R(5, 14, 22, 14, '#8b8d93'); R(5, 14, 22, 3, '#a5a7ad'); R(9, 17, 14, 4, '#2a4a6a');
      R(5, 0, 3, 16, '#6b4423'); R(24, 0, 3, 16, '#6b4423'); R(3, -2, 26, 4, '#8a5a1a'); R(14, 2, 4, 6, '#7a5230');
      break;
    }
    case 'fountain': case 'vfountain': {
      ell(w / 2, h - 10, w / 2 - 2, 10, 'rgba(0,0,0,0.25)'); ell(w / 2, h - 16, w / 2 - 4, 14, '#9a9ca2'); ell(w / 2, h - 18, w / 2 - 8, 10, '#3a7bc8');
      ell(w / 2 - 6, h - 20, 6, 3, 'rgba(255,255,255,0.35)'); R(w / 2 - 3, 8, 6, h - 28, '#b8bac0'); ell(w / 2, 10, 8, 4, '#a5a7ad');
      for (let k = 0; k < 6; k++) { const a = (time * 3 + k) % 1; const sx2 = w / 2 + (k % 2 ? 1 : -1) * a * 14, sy2 = 8 + a * a * 30 - a * 8; ctx.fillStyle = `rgba(190,225,255,${0.8 - a * 0.6})`; ctx.fillRect(X + sx2, Y + sy2, 2, 3); }
      break;
    }
    case 'statue': case 'vstatue': {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 2, Y + 26, 28, 6);
      R(4, 18, 24, 10, '#a5a7ad'); R(2, 16, 28, 4, '#c5c7cd');
      const c = s.type === 'statue' ? '#d8b860' : '#b8bac0';
      R(12, -14, 8, 30, c); R(10, -18, 12, 8, c); R(13, -24, 6, 7, c); R(6, -8, 6, 4, c); R(20, -8, 4, 14, c); R(22, -18, 2, 14, '#e8e8f0');
      if (s.type === 'statue') R(12, -27, 8, 3, '#ffd54a');
      break;
    }
    case 'lamppost': case 'vlamp': {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 10, Y + 27, 12, 4);
      R(14, -14, 4, 42, '#2e2e32'); R(10, 26, 12, 4, '#2e2e32'); R(10, -22, 12, 10, '#3a3a40');
      R(12, -20, 8, 6, night ? '#ffd36b' : '#d8d0b0'); R(9, -24, 14, 3, '#2e2e32');
      if (night) { const g = ctx.createRadialGradient(X + 16, Y - 17, 1, X + 16, Y - 17, 18); g.addColorStop(0, 'rgba(255,210,110,0.55)'); g.addColorStop(1, 'rgba(255,210,110,0)'); ctx.fillStyle = g; ctx.fillRect(X - 4, Y - 37, 40, 40); }
      break;
    }
    case 'bench': { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X + 4, Y + 26, w - 8, 5); R(4, 12, w - 8, 8, '#a06a35'); R(4, 6, w - 8, 4, '#8a5a2a'); R(6, 20, 3, 8, '#5a3a1e'); R(w - 9, 20, 3, 8, '#5a3a1e'); break; }
    case 'flowerbed': {
      R(2, 10, w - 4, h - 12, '#6e4f2e'); R(2, 10, w - 4, 2, '#8a6a42');
      if (sn !== 3) { const cs = sn === 2 ? ['#d88a3a', '#c8583a', '#e0b04a'] : ['#e04a6a', '#f2e36b', '#9a5ad8', '#f5f5f5', '#e07a2a']; for (let k = 0; k < (w - 8) / 5; k++) { R(5 + k * 5, 12 + (k % 2) * 6, 1, 6, '#4f8a36'); ell(5.5 + k * 5, 12 + (k % 2) * 6, 2.5, 2.5, cs[k % cs.length]); } }
      break;
    }
    case 'hedge': { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(X + 2, Y + 26, 28, 5); const g = sn === 3 ? '#a8b8a8' : '#3f7a2e'; R(2, 4, 28, 24, g); R(2, 4, 28, 4, U.shade(g, 0.12)); ell(8, 8, 5, 4, U.shade(g, 0.08)); ell(22, 10, 6, 4, U.shade(g, -0.06)); break; }
    case 'fence': { for (const x of [3, 13, 23]) { R(x, 8, 6, 20, '#a07a4a'); R(x + 1, 6, 4, 3, '#a07a4a'); } R(0, 13, 32, 3, '#7a5230'); R(0, 22, 32, 3, '#7a5230'); break; }
    case 'library': {
      shadow(); R(6, 24, w - 12, h - 28, '#b8b4aa'); for (let k = 28; k < h - 6; k += 6) R(6, k, w - 12, 1, '#9a968c');
      for (const x of [14, 34, 54, 74]) { R(x, 32, 8, 14, night ? '#ffd36b' : '#3a4a6a'); R(x, 30, 8, 2, '#d0ccc2'); }
      R(w / 2 - 7, h - 22, 14, 18, '#4a2e16'); roof(4, 4, w - 8, 22, '#2a4a6a'); sign(w - 24, h - 30, '📚');
      break;
    }
    case 'training': {
      R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#a8885a'); ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, w - 4, h - 4);
      for (const [dx2, dy2] of [[22, 40], [70, 40]]) { R(dx2 - 1, dy2 - 6, 3, 30, '#6b4423'); R(dx2 - 12, dy2, 26, 4, '#6b4423'); ell(dx2, dy2 - 2, 8, 12, '#d8b84a'); ell(dx2, dy2 - 16, 6, 6, '#e0c060'); R(dx2 - 3, dy2 - 4, 6, 2, '#8a6a2a'); }
      ell(48, 76, 12, 12, '#efe6d2'); ell(48, 76, 8, 8, '#c8302a'); ell(48, 76, 4, 4, '#efe6d2'); R(46, 86, 4, 8, '#6b4423');
      break;
    }
    case 'oratory': {
      shadow(); R(6, 26, w - 12, h - 30, '#e6dfcc'); ctx.fillStyle = '#5a5a6a'; ctx.beginPath(); ctx.moveTo(X + 2, Y + 28); ctx.lineTo(X + w / 2, Y + 6); ctx.lineTo(X + w - 2, Y + 28); ctx.fill();
      R(w / 2 - 1, -6, 2, 14, '#d4b14a'); R(w / 2 - 5, -2, 10, 2, '#d4b14a'); R(w / 2 - 6, h - 20, 12, 16, '#5a3a1e');
      R(10, 34, 6, 10, night ? '#ffd36b' : '#6a8ab0'); R(w - 16, 34, 6, 10, night ? '#ffd36b' : '#6a8ab0');
      break;
    }
    case 'watchtower': {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 8);
      R(8, 4, 4, h - 6, '#6b4423'); R(w - 12, 4, 4, h - 6, '#6b4423'); for (let k = 10; k < h - 6; k += 12) { ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 10, Y + k); ctx.lineTo(X + w - 10, Y + k + 10); ctx.stroke(); }
      R(2, -30, w - 4, 10, '#8a5a30'); R(2, -32, w - 4, 3, '#a8743e'); for (let k = 4; k < w - 4; k += 8) R(k, -42, 3, 12, '#7a5230');
      ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.moveTo(X - 2, Y - 42); ctx.lineTo(X + w / 2, Y - 62); ctx.lineTo(X + w + 2, Y - 42); ctx.fill();
      flag(w / 2 - 1, -60, PLAYER_COLOR);
      if (night) flame(w / 2, -32, 0.5);
      break;
    }
    case 'vmarket': {
      shadow();
      for (let k = 0; k < 3; k++) { const x0 = 4 + k * 30; R(x0, 26, 26, 20, '#8b5a2b'); R(x0 + 2, 10, 2, 36, '#5e3c1c'); R(x0 + 22, 10, 2, 36, '#5e3c1c');
        for (let j = 0; j < 4; j++) R(x0 + j * 7, 6, 7, 10, j % 2 ? '#f2efe6' : ['#c84a4a', '#4a7ac8', '#d8b84a'][k]);
        for (let j = 0; j < 3; j++) R(x0 + 4 + j * 7, 22, 5, 4, ['#e2b23a', '#c24b3a', '#6aa84f', '#b07d4a'][(j + k) % 4]); }
      break;
    }
  }
}

// ====================================================================== empreendimentos das outras famílias: incendiar ou tomar
// Incendiar destrói o empreendimento; tomar à força faz dele um empreendimento seu. As duas coisas tornam a família
// sua inimiga (os adultos dela podem enfrentar você) e irritam o reino dono da terra. Sendo rei das terras, você pode
// confiscar: é legal, mas a família perde muita lealdade.
const FAMILY_SEIZE = { fmill: 'biz_mill', fshop: 'biz_shop', fforge: 'biz_smithy', ffarm: 'biz_farm', fvine: 'biz_winery' };
const FamilyCrime = {
  info(s) {
    const f = Families.get(s.fam), d = FAMILY_BIZ[s.type], ci = typeof s.owner === 'number' ? s.owner : -1;
    return { f, d, ci, king: ci >= 0 && G.civs[ci] && G.civs[ci].ruler === 'player' };
  },
  near(s) { return U.dist(P.x / TILE, P.y / TILE, s.x + s.w / 2, s.y + s.h / 2) < 5; },
  // tira o empreendimento do registro da família (para não voltar ao carregar o jogo)
  unrecord(s) {
    const f = Families.get(s.fam);
    if (f) { f.biz = (f.biz || []).filter(b => !(b.type === s.type && b.x === s.x && b.y === s.y)); f.wealth = Math.max(0, (f.wealth || 0) - 150); }
    World.removeStruct(s);
  },
  // as consequências do crime
  outrage(f, ci, king, what) {
    if (!king) {
      if (f && !Court.isEnemy(f)) Court.declareEnemy(f);
      if (ci >= 0 && G.civs[ci] && G.civs[ci].ruler !== 'player') { Game.addRelation(ci, -15); UI.msg(`⚖️ ${CIV_DEFS[ci].short} soube do crime: −15 de relação.`, 'bad'); }
      Court.addFame(-3);
    } else if (f) {
      f.loyalty = Math.max(0, (f.loyalty || 50) - 40);
      for (const p of Families.members(f)) People.addAff(p, -30);
      if (f.loyalty < 15 && Math.random() < 0.5 && !Families.activeRevoltOf(f)) Families.startRevolt(f);
    }
    Diplo.chronicle(`${what} ${f ? `da ${Families.name(f)}` : ''}.`, true);
  },
  burn(sid) {
    const s = World.structs[sid]; if (!s || s.removed || !FAMILY_BIZ[s.type]) return;
    if (!this.near(s)) { UI.msg('Chegue perto do empreendimento.', 'bad'); return; }
    const { f, d, ci, king } = this.info(s);
    const cx = (s.x + s.w / 2) * TILE, cy = (s.y + s.h / 2) * TILE;
    this.unrecord(s);
    for (let k = 0; k < 4; k++) Game.burst(cx + U.rnd(-30, 30), cy + U.rnd(-20, 20), k % 2 ? '#ff7b1c' : '#5a5a5a', 16);
    Sound.play('roar', { vol: 0.3 });
    UI.close(); UI.banner(`🔥 ${d.name} em chamas!`);
    UI.msg(`🔥 Você incendiou ${d.name.toLowerCase() === 'quinta' ? 'a' : 'o'} ${d.name} ${f ? 'da ' + Families.name(f) : ''}.`, 'bad');
    this.outrage(f, ci, king, `🔥 ${G.name} incendiou ${d.name.toLowerCase() === 'quinta' ? 'a' : 'o'} ${d.name}`);
    Progress.diary(`🔥 Incendiou um empreendimento${f ? ' da ' + Families.name(f) : ''}.`);
  },
  seize(sid) {
    const s = World.structs[sid]; if (!s || s.removed || !FAMILY_BIZ[s.type]) return;
    if (!this.near(s)) { UI.msg('Chegue perto do empreendimento.', 'bad'); return; }
    const { f, d, ci, king } = this.info(s);
    let type = FAMILY_SEIZE[s.type];
    const b = BUILDINGS[type];
    // o vinhedo vira vinícola se couber; se não, quinta comercial
    if (b.w > s.w || b.h > s.h) { const okx = [...Array(b.w)].every((_, i) => [...Array(b.h)].every((__, j) => (i < s.w && j < s.h) || (World.areaOk(s.x + i, s.y + j, 1, 1) && World.areaFree(s.x + i, s.y + j, 1, 1)))); if (!okx) type = 'biz_farm'; }
    const x = s.x, y = s.y, B = BUILDINGS[type];
    this.unrecord(s);
    const ns = World.addStruct(type, x, y, B.w, B.h, 'player', { built: true });
    Sound.play('coin'); UI.close();
    UI.banner(`${king ? '👑 Confiscado' : '🗝️ Tomado'}: ${B.name}`);
    UI.msg(`${king ? '👑 Por ordem real, ' : '🗝️ À força, '}${d.name.toLowerCase() === 'quinta' ? 'a' : 'o'} ${d.name} ${f ? 'da ' + Families.name(f) : ''} agora é ${/(a|gem)$/i.test(B.name.split(' ')[0]) ? 'sua' : 'seu'}: ${B.name}. Contrate funcionários para ele produzir.`, 'gold');
    this.outrage(f, ci, king, king ? `👑 ${G.name} confiscou um empreendimento` : `🗝️ ${G.name} tomou à força um empreendimento`);
    Progress.diary(`${king ? '👑 Confiscou' : '🗝️ Tomou à força'} um empreendimento${f ? ' da ' + Families.name(f) : ''}.`);
    return ns;
  },
};

// ====================================================================== sucessão do trono
// Quando o rei morre, o filho mais velho herda o reino e os outros seguem como príncipes. Se o herdeiro tiver menos de
// 16 anos e a mãe (ou o pai) estiver viva, ela governa como rainha regente; quando ele faz 16, assume o trono e ela
// vira rainha-mãe (consorte do reino).
const Succession = {
  pass(realms, chosen, eldest, spouse) {
    const playerIsKing = eldest === chosen;
    const age = p => p === chosen ? P.age : p.age;
    G.regency = G.regency || [];
    let note = '';
    for (const ci of realms) {
      const c = G.civs[ci];
      if (age(eldest) < 16 && spouse) {
        // regência: a mãe (ou o pai) governa até o herdeiro fazer 16
        this.seat(c, spouse, 'ruler');
        G.regency.push({ ci, regent: spouse.id, heir: playerIsKing ? 'player' : eldest.id });
        note = `${spouse.name} governa como ${spouse.sex === 'f' ? 'rainha regente' : 'rei regente'} até ${playerIsKing ? 'você' : eldest.name} fazer 16 anos.`;
      } else if (!playerIsKing) {
        this.seat(c, eldest, 'ruler');
        note = `${eldest.name}, ${eldest.sex === 'f' ? 'a filha' : 'o filho'} mais velho, assumiu o trono. Você é ${chosen.sex === 'f' ? 'princesa' : 'príncipe'}.`;
      }
      if (spouse && c.ruler === 'player') spouse.rank = 'consort';
    }
    if (!playerIsKing || (age(eldest) < 16 && spouse)) {
      for (const ci of realms) Diplo.chronicle(`👑 ${G.civs[ci].rulerName} assume ${CIV_DEFS[ci].name} após a morte do soberano.`, true);
    }
    if (eldest && !playerIsKing && eldest.alive) { eldest.kin = 'sibling'; }
    return note;
  },
  // põe uma pessoa no trono (governo da IA)
  seat(c, p, rank) {
    c.ruler = 'npc'; c.rulerId = p.id; p.rank = rank; p.home = { type: 'castle', civ: c.id }; p.civ = c.id;
    c.rulerName = `${p.sex === 'f' ? 'Rainha' : 'Rei'} ${p.name}`;
    const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
  },
  // todo mês: o herdeiro fez 16 anos? então assume e a regente vira rainha-mãe
  tick() {
    for (const r of (G.regency || []).slice()) {
      const c = G.civs[r.ci], regent = People.get(r.regent);
      const heir = r.heir === 'player' ? null : People.get(r.heir);
      const hAge = r.heir === 'player' ? P.age : heir && heir.alive ? heir.age : 99;
      if (hAge < 16 && regent && regent.alive && c.rulerId === r.regent) continue;
      G.regency = G.regency.filter(x => x !== r);
      if (c.rulerId !== r.regent) continue; // o reino mudou de mãos no meio do caminho
      if (regent && regent.alive) { regent.rank = 'consort'; }
      if (r.heir === 'player') Game.becomeRuler(r.ci, `Você completou 16 anos e assumiu o trono${regent && regent.alive ? `; ${regent.name} agora é ${regent.sex === 'f' ? 'rainha-mãe' : 'rei-pai'}` : ''}.`);
      else if (heir && heir.alive) { this.seat(c, heir, 'ruler'); if (regent && regent.alive) regent.rank = 'consort'; Diplo.chronicle(`👑 ${heir.name} completou 16 anos e assumiu ${CIV_DEFS[r.ci].name}.`, true); }
    }
  },
};
