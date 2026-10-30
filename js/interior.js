'use strict';
// Lugares fechados: o lado de dentro das lojas, tavernas, capelas, do castelo (sala do trono), das suas casas e dos
// seus empreendimentos. Para não mexer no mapa do mundo, cada lugar é montado num pedaço de mar aberto bem longe da
// terra: o herói é levado até lá e, ao sair, aquele pedaço volta a ser mar. O mundo continua vivo enquanto isso.
// Também guarda quem cuida de cada loja (Shops): cada loja tem o seu dono, mesmo que a vila tenha duas iguais.

// ====================================================================== donos das lojas
// Cada loja de vila (armazém, ferreiro, madeireira, pedreira, taverna) tem o seu responsável: p.shop = okey da loja.
const SHOP_KEEPER = { store: 'merchant', smith: 'smith', lumber: 'lumber', quarry: 'mason', tavern: 'innkeeper' };
const Shops = {
  _map: null, _n: -1,
  // okey → construção (refeito quando a lista de construções muda)
  byKey(k) {
    if (this._n !== World.structs.length || !this._map) { this._map = new Map(); for (const s of World.structs) if (!s.removed) this._map.set(s.okey, s); this._n = World.structs.length; }
    const s = this._map.get(k);
    return s && !s.removed ? s : null;
  },
  isShop(s) { return !!s && !s.removed && SHOP_KEEPER[s.type] !== undefined && s.village !== undefined; },
  list(vi) { return World.structs.filter(s => this.isShop(s) && s.village === vi); },
  keeper(s) {
    if (!s) return null;
    for (const p of G.people) if (p.alive && p.shop === s.okey && !p.capanga) return p;
    return null;
  },
  // a loja onde a pessoa trabalha (se a dela sumiu, fica sem loja até ser ligada a outra)
  workOf(p) { if (!p.shop) return null; const s = this.byKey(p.shop); if (!s || !this.isShop(s)) return null; return s; },
  // primeira loja do tipo na vila (para quem ainda não tem loja ligada)
  firstOf(vi, rank) { return this.list(vi).find(s => SHOP_KEEPER[s.type] === rank) || null; },
  // liga cada loja a um responsável: quem já tem o ofício (e nenhuma loja) assume a loja vaga do mesmo tipo; nas vilas
  // que não são suas, o conselho da vila escolhe alguém para as lojas que continuam vagas
  ensure() {
    const owners = new Set();
    for (const p of G.people) if (p.alive && p.shop) { const s = this.byKey(p.shop); if (s && this.isShop(s) && SHOP_KEEPER[s.type] === p.rank && !owners.has(s.okey)) owners.add(s.okey); else p.shop = null; }
    World.villages.forEach((v, vi) => {
      for (const s of this.list(vi)) {
        if (owners.has(s.okey)) continue;
        const rank = SHOP_KEEPER[s.type];
        let q = G.people.find(p => p.alive && !p.shop && !p.capanga && p.rank === rank && p.home.type === 'village' && p.home.idx === vi);
        if (!q && !People.canAppoint(vi) && G.day > 1) { q = People.shopCandidates(vi, rank)[0]; if (q) People.appoint(q, rank, 'O conselho da vila'); }
        else if (!q && G.day <= 1) { q = People.shopCandidates(vi, rank)[0]; if (q) q.rank = rank; }
        if (q) { q.shop = s.okey; owners.add(s.okey); }
      }
    });
  },
  // lojas sem responsável numa vila
  vacant(vi) { return this.list(vi).filter(s => !this.keeper(s)); },
};

// ====================================================================== pisos e paredes de dentro
// (os tipos T.WFLOOR, T.SFLOOR, T.IWALL e T.VOID ficam no world.js)
const ROOM_TYPES = {
  store:      { lay: 'shop',    theme: 'wood',   name: s => `Armazém de ${Places.vname(s)}` },
  smith:      { lay: 'smithy',  theme: 'stone',  name: s => `Ferreiro de ${Places.vname(s)}` },
  lumber:     { lay: 'lumber',  theme: 'wood',   name: s => `Madeireira de ${Places.vname(s)}` },
  quarry:     { lay: 'quarry',  theme: 'stone',  name: s => `Pedreira de ${Places.vname(s)}` },
  tavern:     { lay: 'tavern',  theme: 'wood',   name: s => `Taverna de ${Places.vname(s)}` },
  chapel:     { lay: 'chapel',  theme: 'chapel', name: s => `Capela de ${Places.vname(s)}` },
  cathedral:  { lay: 'chapel',  theme: 'chapel', big: true, name: s => `Catedral de ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : ''}` },
  castle:     { lay: 'throne',  theme: 'castle', name: s => `Sala do Trono · ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].name : ''}` },
  cabin:      { lay: 'home',    theme: 'wood',   name: () => 'Sua Cabana' },
  house:      { lay: 'home',    theme: 'wood',   name: () => 'Sua Casa' },
  manor:      { lay: 'home',    theme: 'wood',   big: true, name: () => 'Seu Casarão' },
  ptavern:    { lay: 'tavern',  theme: 'wood',   mine: true, name: () => 'Sua Taverna' },
  arena:      { lay: 'coliseum', theme: 'castle', name: s => `Arena de ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : ''}` },
  port:       { lay: 'harbor',  theme: 'wood',   name: s => `Porto de ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : ''}` },
  cemetery:   { lay: 'graveyard', theme: 'stone', name: s => `Cemitério de ${CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : ''}` },
};
// os empreendimentos do jogador (menos os que ficam ao ar livre) também têm o lado de dentro
const BIZ_ROOMS = { biz_mill: 'mill', biz_lumber: 'lumber', biz_quarry: 'quarry', biz_mine: 'mine', biz_smithy: 'smithy', biz_shop: 'shop' };
const ROOM_SHUT = ['store', 'smith', 'lumber', 'quarry']; // fecham à noite

// ------------------------------------------------------------------ plantas dos cômodos
// Cada planta devolve o tamanho do chão (w × h blocos), os móveis ([tipo, x, y, w, h, extra]) e os lugares das pessoas.
// y = -1 é a parede do fundo (janelas, lampiões, prateleiras penduradas).
const LAYOUTS = {
  shop(o) {
    return { w: 12, h: 8, items: [
      ['shelf', 0, 0, 2], ['shelf', 2, 0, 2], ['shelf', 8, 0, 2], ['shelf', 10, 0, 2], ['window', 5, -1], ['window', 6, -1], ['lamp', 4, -1], ['lamp', 7, -1],
      ['counter', 4, 3, 4, 1, { act: o.mine ? 'bizshop' : 'shop' }], ['barrel', 0, 6], ['barrel', 0, 7], ['sacks', 11, 6], ['sacks', 11, 7], ['crate', 10, 7], ['crate', 1, 7],
      ['rug', 5, 5, 2, 2], ['plant', 11, 3], ...(o.mine ? [['desk', 0, 3, 2, 1, { act: 'biz' }]] : [])],
      keeper: [6, 2], wander: [[3, 5], [8, 5], [9, 2], [2, 2]] };
  },
  smithy(o) {
    return { w: 12, h: 8, items: [
      ['furnace', 0, 0, 2], ['anvil', 3, 1], ['toolrack', 4, -1, 2], ['weaponrack', 9, 0, 2], ['window', 7, -1], ['lamp', 11, -1],
      ['counter', 6, 3, 3, 1, { act: o.mine ? 'bizshop' : 'shop' }], ['barrel', 11, 1], ['coal', 0, 6], ['coal', 1, 7], ['crate', 11, 7], ['grind', 10, 4],
      ...(o.mine ? [['desk', 0, 3, 2, 1, { act: 'biz' }], ['anvil', 3, 5]] : [])],
      keeper: [7, 2], staff: [[3, 2], [3, 6], [1, 2]], wander: [[5, 6], [9, 6]] };
  },
  lumber(o) {
    return { w: 12, h: 8, items: [
      ['logs', 0, 0, 2], ['logs', 0, 1, 2], ['sawbench', 4, 1, 2], ['planks', 9, 0, 2], ['planks', 10, 1, 2], ['toolrack', 6, -1, 2], ['window', 3, -1], ['lamp', 8, -1],
      ['counter', 5, 4, 3, 1, { act: o.mine ? 'bizshop' : 'shop' }], ['barrel', 11, 6], ['crate', 0, 7], ['logs', 9, 7, 2],
      ...(o.mine ? [['desk', 0, 4, 2, 1, { act: 'biz' }]] : [])],
      keeper: [6, 3], staff: [[4, 2], [3, 1], [8, 1]], wander: [[3, 6], [8, 6]] };
  },
  quarry(o) {
    return { w: 12, h: 8, items: [
      ['stones', 0, 0], ['stones', 1, 0], ['stones', 0, 1], ['orecart', 10, 0], ['orecart', 11, 2], ['toolrack', 4, -1, 2], ['window', 8, -1], ['lamp', 2, -1],
      ['counter', 5, 3, 3, 1, { act: o.mine ? 'bizshop' : 'shop' }], ['crate', 11, 7], ['stones', 0, 7], ['barrel', 1, 7], ['bench', 8, 6, 2],
      ...(o.mine ? [['desk', 0, 4, 2, 1, { act: 'biz' }]] : [])],
      keeper: [6, 2], staff: [[2, 1], [9, 1], [3, 5]], wander: [[3, 5], [9, 4]] };
  },
  mine() {
    return { w: 12, h: 8, items: [
      ['beam', 1, 0], ['beam', 5, 0], ['beam', 9, 0], ['minehole', 2, 0, 2], ['minehole', 7, 0, 2], ['orecart', 4, 3], ['orecart', 10, 3], ['stones', 0, 6], ['stones', 11, 6],
      ['lamp', 4, -1], ['lamp', 6, -1], ['lamp', 10, -1], ['desk', 0, 3, 2, 1, { act: 'biz' }], ['counter', 6, 5, 3, 1, { act: 'bizshop' }], ['crate', 11, 7], ['crate', 0, 7]],
      keeper: [7, 4], staff: [[3, 1], [8, 1], [6, 2]], wander: [[3, 6], [9, 6]] };
  },
  mill() {
    return { w: 12, h: 8, items: [
      ['millstone', 4, 0, 2, 2], ['sacks', 0, 0], ['sacks', 1, 0], ['sacks', 0, 1], ['flour', 9, 0], ['flour', 10, 0], ['flour', 11, 0], ['oven', 10, 2, 2], ['window', 7, -1], ['lamp', 2, -1],
      ['desk', 0, 4, 2, 1, { act: 'biz' }], ['counter', 6, 4, 3, 1, { act: 'bizshop' }], ['barrel', 11, 7], ['table', 3, 6, 2], ['rug', 6, 6, 2, 2]],
      keeper: [7, 3], staff: [[3, 1], [8, 2], [7, 1]], wander: [[3, 5], [10, 5]] };
  },
  tavern(o) {
    return { w: 14, h: 9, items: [
      ['bar', 3, 2, 5, 1, { act: o.mine ? 'ptavern' : 'tavern' }], ['kegs', 0, 0, 2], ['kegs', 0, 1, 2], ['shelf', 3, -1, 2], ['shelf', 6, -1, 2], ['fireplace', 11, 0, 2, 1, { light: 1 }],
      ['lamp', 9, -1], ['lamp', 1, -1], ['table', 2, 5, 2], ['table', 6, 5, 2], ['table', 10, 5, 2], ['table', 4, 7, 2], ['table', 9, 7, 2],
      ['stool', 1, 5], ['stool', 4, 5], ['stool', 5, 5], ['stool', 8, 5], ['stool', 9, 5], ['stool', 12, 5], ['stool', 3, 7], ['stool', 6, 7], ['stool', 8, 7], ['stool', 11, 7],
      ['rug', 10, 2, 3, 2], ['board', 13, 3], ['barrel', 13, 8], ['barrel', 0, 8]],
      keeper: [5, 1], seats: [[1, 5], [4, 5], [5, 5], [8, 5], [9, 5], [12, 5], [3, 7], [6, 7], [8, 7], [11, 7], [11, 2], [12, 3]], wander: [[7, 3], [2, 3]] };
  },
  chapel(o) {
    const big = o.big;
    return { w: big ? 14 : 10, h: big ? 12 : 10, items: [
      ['altar', big ? 6 : 4, 1, 2, 1, { act: 'chapel' }], ['candles', big ? 4 : 2, 1, 1, 1, { light: 1 }], ['candles', big ? 9 : 7, 1, 1, 1, { light: 1 }],
      ['stained', big ? 3 : 2, -1], ['stained', big ? 10 : 7, -1], ...(big ? [['stained', 6, -1, 2], ['pillar', 1, 3], ['pillar', 12, 3], ['pillar', 1, 7], ['pillar', 12, 7]] : []),
      ['carpet', big ? 6 : 4, 3, 2, big ? 9 : 7], ...[3, 5, 7, ...(big ? [9] : [])].flatMap(y => [['pew', big ? 2 : 1, y, 3], ['pew', big ? 9 : 6, y, 3]]),
      ['plant', 0, 0], ['plant', big ? 13 : 9, 0]],
      keeper: [big ? 6.5 : 4.5, 2], seats: [3, 5, 7].flatMap(y => [[big ? 3 : 2, y], [big ? 10 : 7, y]]) };
  },
  throne() {
    return { w: 16, h: 11, items: [
      ['throne', 7, 0, 2, 1, { act: 'throne' }], ['carpet', 7, 1, 2, 10], ['banner', 3, -1], ['banner', 12, -1], ['banner', 6, -1], ['banner', 9, -1], ['window', 1, -1], ['window', 14, -1],
      ['pillar', 2, 2], ['pillar', 13, 2], ['pillar', 2, 6], ['pillar', 13, 6], ['brazier', 5, 1, 1, 1, { light: 1 }], ['brazier', 10, 1, 1, 1, { light: 1 }],
      // o quarto real (canto da esquerda): a cama de casal do rei, para salvar e dormir
      ['bed', 0, 8, 1, 2, { act: 'royalbed' }], ['bed', 1, 8, 1, 2, { act: 'royalbed' }], ['rug', 0, 10, 2, 1],
      ['longtable', 15, 8, 1, 3], ['plant', 0, 0], ['plant', 15, 0], ['armor', 4, 0], ['armor', 11, 0]],
      keeper: [7.5, 1.3], staff: [[6, 2], [9.5, 2], [4, 4], [11, 4], [4, 8], [11, 8]], wander: [[5, 6], [10, 6]] };
  },
  // coliseu: arquibancadas em degraus nos três lados (a plateia senta nelas), camarote real no alto,
  // areia com o brasão do reino no meio, colunas e braseiros nos cantos, portão de ferro dos lutadores
  // e, na entrada, a mesa de inscrição, o suporte de armas e barracas de comida e bebida
  coliseum() {
    // lugares intercalados (alto, esquerda, direita...) para a plateia se espalhar pelos três lados
    const top = [], left = [], right = [];
    for (const y of [2, 1]) for (const x of [1, 3, 5, 7, 9, 16, 18, 20, 22, 24]) top.push([x + (y === 1 ? 1 : 0), y]);
    for (const y of [4, 6, 8, 10, 12, 5, 9, 11]) { left.push([y % 2 ? 1 : 2, y]); right.push([y % 2 ? 24 : 23, y]); }
    const crowd = [];
    for (let k = 0; crowd.length < top.length + left.length + right.length; k++) for (const list of [top, left, right, top]) if (list[k] && !crowd.includes(list[k])) crowd.push(list[k]);
    return { w: 26, h: 17, tiles: [[T.SAND, 5, 4, 16, 9]],
      items: [['stands', 0, 0, 11, 3, { rows: 3 }], ['stands', 15, 0, 11, 3, { rows: 3 }], ['box', 11, 0, 4, 3],
        ['stands', 0, 3, 4, 10, { side: 1 }], ['stands', 22, 3, 4, 10, { side: 1 }],
        ['banner', 2, -1], ['banner', 6, -1], ['banner', 9, -1], ['banner', 16, -1], ['banner', 19, -1], ['banner', 23, -1],
        ['pillar', 4, 3], ['pillar', 21, 3], ['pillar', 4, 12], ['pillar', 21, 12],
        ['brazier', 5, 4, 1, 1, { light: 1 }], ['brazier', 20, 4, 1, 1, { light: 1 }], ['brazier', 5, 12, 1, 1, { light: 1 }], ['brazier', 20, 12, 1, 1, { light: 1 }],
        ['emblem', 11, 6, 4, 4], ['portcullis', 21, 7, 1, 3],
        ['arenadesk', 1, 14, 3, 1, { act: 'arena' }], ['foodstall', 7, 14, 3, 1], ['foodstall', 16, 14, 3, 1, { drink: 1 }],
        ['weaponrack', 22, 14, 3], ['barrel', 5, 15], ['barrel', 20, 15], ['plant', 0, 16], ['plant', 25, 16]],
      center: [13, 8], seats: [[4, 14], [21, 14], [6, 16], [19, 16]],
      // camarote real (dentro do camarote, à vista) e lugares da plateia, sentados nas arquibancadas
      royal: [[12, 2], [13, 2], [11, 2], [14, 2]], crowd };
  },
  // cemitério: gramado com caminho de terra, mausoléu dos heróis no alto, lápides da família (uma por parente
  // enterrado no reino, com o nome) e túmulos antigos completando as fileiras, ciprestes, lanternas, anjo,
  // canteiros, bancos e o livro do cemitério na entrada
  graveyard(o) {
    const ci = o.src ? o.src.owner : 0, all = Graves.inCiv(ci), fam = all.filter(g => g.kind !== 'hero').sort((a, b) => b.day - a.day);
    const slots = []; for (const y of [4, 7, 10]) for (const x of [2, 4, 6, 12, 14, 16]) slots.push([x, y]);
    const items = [['mausoleum', 7, 0, 5, 3, { act: 'mausoleum' }], ['cypress', 1, 0], ['cypress', 17, 0], ['cypress', 0, 6], ['cypress', 18, 6], ['cypress', 0, 10], ['cypress', 18, 10],
      ['lantern', 8, 4, 1, 1, { light: 1 }], ['lantern', 10, 4, 1, 1, { light: 1 }], ['lantern', 8, 10, 1, 1, { light: 1 }], ['lantern', 10, 10, 1, 1, { light: 1 }],
      ['angel', 9, 7], ['cembook', 8, 12, 1, 1, { act: 'cembook' }], ['bench', 1, 12, 2], ['bench', 16, 12, 2], ['flowerbed', 4, 12, 3, 1], ['flowerbed', 12, 12, 3, 1]];
    slots.forEach(([x, y], k) => { const g = fam[k]; items.push(g ? ['grave', x, y, 1, 1, { act: 'grave', gi: Graves.list().indexOf(g), gname: g.name.split(' ')[0], hero: false }] : ['oldgrave', x, y, 1, 1, { tilt: (k * 7) % 3 }]); });
    return { w: 19, h: 13, tiles: [[T.GRASS, 0, 0, 19, 13], [T.ROAD, 9, 3, 1, 10]], items, keeper: [9, 11], wander: [[5, 9], [13, 9]] };
  },
  harbor() {
    return { w: 16, h: 9, tiles: [[T.DEEP, 11, 0, 5, 9], [T.BRIDGE, 11, 3, 4, 2]], // a água do porto é funda: só se anda no cais
      items: [['counter', 3, 3, 4, 1, { act: 'port' }], ['nets', 0, -1, 2], ['nets', 6, -1, 2], ['window', 3, -1], ['lamp', 9, -1], ['lamp', 2, -1],
        ['barrel', 0, 0], ['barrel', 1, 0], ['crate', 0, 1], ['crate', 8, 0], ['crate', 9, 0], ['sacks', 9, 1], ['fishrack', 0, 6, 3], ['barrel', 9, 7], ['crate', 9, 8],
        ['anchor', 7, 6], ['rowboat', 13, 5, 2, 2, { act: 'sail' }], ['bollard', 10, 2], ['bollard', 10, 6]],
      keeper: [5, 2], wander: [[5, 6], [8, 4]] };
  },
  home(o) {
    const big = o.big;
    return { w: big ? 12 : 9, h: big ? 9 : 7, items: [
      ['bed', 0, 0, 1, 2, { act: 'rest' }], ...(big ? [['bed', 2, 0, 1, 2, { act: 'rest' }], ['bookshelf', 6, -1, 2], ['armor', 11, 0]] : []),
      ['hearth', big ? 9 : 6, 0, 2, 1, { act: 'craft:fogueira', light: 1 }], ['table', big ? 5 : 3, 3, 2], ['stool', big ? 4 : 2, 3], ['stool', big ? 7 : 5, 3],
      ['rug', big ? 5 : 3, 4, 2, 2], ['chestf', big ? 11 : 8, 3], ['window', big ? 4 : 2, -1], ['lamp', big ? 8 : 5, -1], ['barrel', 0, big ? 8 : 6], ['plant', big ? 11 : 8, big ? 8 : 6]],
      wander: [[2, 4], [5, 5], [big ? 9 : 6, 4]] };
  },
};

// ====================================================================== os lugares
const Places = {
  zone: null, furn: [], lightList: [],
  vname(s) { const v = World.villages[s.village]; return v ? v.name : ''; },
  room() { return G.place && G.place.kind === 'room' ? G.place : null; },
  // tipo de cômodo de uma construção (ou null)
  def(s) {
    if (!s || s.removed) return null;
    if (ROOM_TYPES[s.type]) {
      if ((['cabin', 'house', 'manor', 'ptavern', 'hut', 'lodge', 'villa'].includes(s.type) || ROOM_TYPES[s.type].owned) && s.owner !== 'player') return null;
      return ROOM_TYPES[s.type];
    }
    if (BIZ_ROOMS[s.type] && s.owner === 'player') return { lay: BIZ_ROOMS[s.type], theme: ['smithy', 'quarry', 'mine'].includes(BIZ_ROOMS[s.type]) ? 'stone' : 'wood', mine: true, biz: true, name: () => `${/(a|gem)$/i.test(BUILDINGS[s.type].name.split(' ')[0]) ? 'Sua' : 'Seu'} ${BUILDINGS[s.type].name}` };
    return null;
  },
  enterable(s) { return !!this.def(s) && !G.dungeon && !G.place && !G.siege && !G.duel && !!this.area(); },

  // ---------------------------------------------------------------- o pedaço de mar reservado
  // retângulo de mar aberto (sem ilhas nem construções) longe das bordas do mapa; null se o mundo não tem mar em volta
  area() {
    if (this.zone && this.zone.W === WORLD_W) return this.zone.ok ? this.zone : null;
    const W = WORLD_W, H = WORLD_H, w = 132, h = 96, m = 20;
    const bad = new Int32Array((W + 1) * (H + 1));
    for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { const i = y * W + x; if (World.tiles[i] !== T.DEEP || World.sgrid[i] >= 0) row++; bad[(y + 1) * (W + 1) + x + 1] = bad[y * (W + 1) + x + 1] + row; } }
    const sum = (x, y, ww, hh) => bad[(y + hh) * (W + 1) + x + ww] - bad[y * (W + 1) + x + ww] - bad[(y + hh) * (W + 1) + x] + bad[y * (W + 1) + x];
    let best = null;
    for (const [ww, hh] of [[w, h], [104, 76], [64, 44]]) {
      for (let y = m; y + hh + m < H && !best; y += 4) for (let x = m; x + ww + m < W; x += 4) {
        if (sum(x, y, ww, hh)) continue;
        if (World.islands.some(is => U.dist(x + ww / 2, y + hh / 2, is.x, is.y) < is.r + Math.max(ww, hh) / 2 + 6)) continue;
        best = { x, y, w: ww, h: hh }; break;
      }
      if (best) break;
    }
    this.zone = Object.assign({ W, ok: !!best }, best || {});
    return best ? this.zone : null;
  },
  // guarda o pedaço original (para devolver o mar ao sair)
  carve(x0, y0, w, h) {
    const keep = { x0, y0, w, h, tiles: new Uint8Array(w * h), obj: new Uint8Array(w * h) };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = World.idx(x0 + x, y0 + y); keep.tiles[y * w + x] = World.tiles[i]; keep.obj[y * w + x] = World.obj[i]; }
    return keep;
  },
  uncarve(k) {
    for (let y = 0; y < k.h; y++) for (let x = 0; x < k.w; x++) { const i = World.idx(k.x0 + x, k.y0 + y); World.tiles[i] = k.tiles[y * k.w + x]; World.obj[i] = k.obj[y * k.w + x]; if (World.solid) World.solid[i] = 0; }
    World.chunks.clear();
  },
  setT(x, y, t) { if (World.inb(x, y)) { const i = World.idx(x, y); World.tiles[i] = t; World.obj[i] = 0; } },

  // ---------------------------------------------------------------- entrar num cômodo
  enterRoom(src) {
    const d = this.def(src), Z = this.area();
    if (!d || !Z) return false;
    if (ROOM_SHUT.includes(src.type) && Routine.phase() === 'night') { UI.msg(`🌙 ${d.name(src)} está fechada. Volte de manhã.`, 'bad'); return true; }
    if (P.fishing) P.fishing = null;
    if (P.mounted) { P.mounted = false; P.hx = P.x - 26; P.hy = P.y + 4; }
    const L = LAYOUTS[d.lay](Object.assign({}, d, { mine: !!d.mine, src }));
    const cxz = Z.x + (Z.w >> 1), cyz = Z.y + (Z.h >> 1);
    const fx0 = cxz - (L.w >> 1), fy0 = cyz - (L.h >> 1);
    const keep = this.carve(fx0 - 16, fy0 - 13, L.w + 32, L.h + 27);
    World.roomTheme = d.theme;
    for (let y = keep.y0; y < keep.y0 + keep.h; y++) for (let x = keep.x0; x < keep.x0 + keep.w; x++) this.setT(x, y, T.VOID);
    const floor = d.theme === 'wood' ? T.WFLOOR : T.SFLOOR;
    for (let y = fy0 - 2; y <= fy0 + L.h; y++) for (let x = fx0 - 1; x <= fx0 + L.w; x++) this.setT(x, y, T.IWALL);
    for (let y = fy0; y < fy0 + L.h; y++) for (let x = fx0; x < fx0 + L.w; x++) this.setT(x, y, floor);
    for (const [tt, x, y, w, h] of L.tiles || []) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.setT(fx0 + x + i, fy0 + y + j, tt);
    const door = { x: fx0 + ((L.doorX !== undefined ? L.doorX : L.w >> 1) | 0), y: fy0 + L.h };
    this.setT(door.x, door.y, floor);
    World.chunks.clear();
    // móveis
    if (!World.solid || World.solid.length !== WORLD_W * WORLD_H) World.solid = new Uint8Array(WORLD_W * WORLD_H);
    this.furn = [];
    for (const it of L.items) {
      const [k, x, y, w, h, ex] = it;
      const f = Object.assign({ k, x: fx0 + x, y: fy0 + y, w: w || 1, h: h || 1, id: this.furn.length }, FURN[k] || {}, ex || {});
      this.furn.push(f);
      if (f.block && y >= 0) for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) World.solid[World.idx(f.x + i, f.y + j)] = 1;
    }
    this.furn.push(Object.assign({ k: 'door', x: door.x, y: door.y, w: 1, h: 1, id: this.furn.length }, FURN.door));
    const cv = Game.canvas, zoom = U.clamp(Math.min((cv ? cv.width : 1280) / ((L.w + 3) * TILE), (cv ? cv.height : 720) / ((L.h + 5) * TILE)), 1, 2.6);
    G.place = { kind: 'room', lay: d.lay, src, srcKey: src.okey, type: src.type, name: d.name(src), theme: d.theme, fx0, fy0, w: L.w, h: L.h, door, keep, zoom,
      back: { x: (src.x + src.w / 2) * TILE, y: (src.y + src.h + 0.9) * TILE }, since: G.realTime };
    // o herói entra pela porta
    P.x = (door.x + 0.5) * TILE; P.y = (door.y - 0.2) * TILE; P.dir = 1; P.sailing = false;
    G.ping = G.ping || null;
    this.people(src, d, L);
    this.lightList = this.furn.filter(f => f.light).map(f => ({ x: (f.x + f.w / 2) * TILE, y: (f.y + f.h / 2) * TILE, r: f.lr || 120, col: f.lcol || '#ffb35a', day: !!f.day }));
    UI.close();
    UI.banner('🚪 ' + G.place.name);
    Sound.play('chest', { vol: 0.5 });
    return true;
  },
  // quem está lá dentro
  people(src, d, L) {
    const P0 = G.place, at = ([x, y]) => [P0.fx0 + x, P0.fy0 + y], door = P0.back;
    const away = p => { const o = G.spawned.get(p.id); return !!o && !o.dead && !o.placeNpc && U.dist(o.x, o.y, door.x, door.y) > 14 * TILE; };
    const put = (p, spot, opts) => {
      if (!p || !p.alive) return null;
      const old = G.spawned.get(p.id); // a pessoa lá fora continua (volta a ser ela quando você sair)
      const [tx, ty] = at(spot);
      const civ = p.civ >= 0 ? p.civ : typeof src.owner === 'number' ? src.owner : -1;
      const e = Game.spawn('villager', (tx + 0.5) * TILE, (ty + 0.85) * TILE, { civ, npc: p, leash: (opts && opts.leash) || 0.4 });
      e.placeNpc = true; e.still = !!(opts && opts.still); e.dir = (opts && opts.dir) || 1; e.outside = old && !old.dead && !old.placeNpc ? old : null;
      if (e.outside) e.outside.inRoom = true; // a pessoa de fora "entrou": não anda lá fora enquanto você está aqui
      G.spawned.set(p.id, e);
      return e;
    };
    const used = new Set();
    const take = p => { if (!p || used.has(p.id)) return null; used.add(p.id); return p; };
    const vi = src.village, ph = Routine.phase();
    const locals = () => vi !== undefined ? People.residents(vi).filter(p => People.isAdult(p) && !People.isCourt(p) && !p.trip && !p.shop && p.rank !== 'priest' && !used.has(p.id) && !away(p)) : [];
    const pick = (list, n, salt) => list.map(p => ({ p, h: U.hash2(p.id, G.day, salt) })).sort((a, b) => a.h - b.h).slice(0, n).map(o => o.p);
    const wanderers = (n, salt) => { let k = 0; for (const p of pick(locals(), n, salt)) put(take(p), L.wander[k++ % L.wander.length], { leash: 2.2 }); };
    if (d.lay === 'throne') {
      const ci = src.owner, ruled = G.civs[ci] && G.civs[ci].ruler === 'player';
      const court = G.people.filter(p => p.alive && !p.capanga && p.rank !== 'soldier' && (p.home.type === 'castle' && p.home.civ === ci || (p.council && Families.civOf(p) === ci)));
      const ruler = ruled ? null : (court.find(p => p.id === G.civs[ci].rulerId) || court.find(p => p.rank === 'ruler')); // o soberano de agora
      // o soberano é bem defendido: muito mais vida e golpes pesados (um golpe de estado exige o melhor equipamento e todos os capangas)
      if (ruler) { const k0 = put(take(ruler), L.keeper, { still: true }); if (k0) { k0.maxHp = k0.hp = 900; k0.dmg = 28; k0.royal = true; } }
      let k = 0;
      for (const p of court.filter(p => p !== ruler).sort((a, b) => (b.rank === 'consort') - (a.rank === 'consort') || (b.rank === 'heir') - (a.rank === 'heir')).slice(0, L.staff.length)) put(take(p), L.staff[k++], { leash: 0.6 });
      // guarda real: de 4 a 8 soldados de elite, conforme a guarnição do reino (2 se o castelo é seu)
      const spots = [[3, 9], [12, 9], [3, 5], [12, 5], [3, 3], [12, 3], [5, 9], [10, 9]]; // fora das colunas
      const n = ruled ? 2 : Math.min(spots.length, 4 + Math.floor(((G.civs[ci] && G.civs[ci].garrison) || 0) / 4));
      for (const [x, y] of spots.slice(0, n)) {
        const [tx, ty] = at([x, y]); const g = Game.spawn('guard', (tx + 0.5) * TILE, (ty + 0.8) * TILE, { civ: ci, leash: 0.5, tag: 'room' }); g.placeNpc = true;
        if (!ruled) { g.maxHp = g.hp = Math.round(g.maxHp * 2.2); g.dmg = Math.round(g.dmg * 1.6); g.royalGuard = true; }
      }
      // os capangas entram com você na sala do trono (nos outros lugares eles esperam do lado de fora)
      let a = 0; for (const e of G.ents) if (e.kind === 'ally' && !e.dead) { const [tx, ty] = at([6 + (a % 4), 10 - Math.floor(a / 4)]); e.x = (tx + 0.5) * TILE; e.y = (ty + 0.8) * TILE; e.target = null; a++; }
      return;
    }
    if (d.lay === 'chapel') {
      const priest = G.people.find(p => p.alive && p.rank === 'priest' && !p.capanga && (vi !== undefined ? p.home.type === 'village' && p.home.idx === vi : Families.civOf(p) === src.owner));
      if (priest) put(take(priest), L.keeper, { still: true });
      let k = 0; for (const p of pick(locals(), ph === 'day' ? 2 : 1, 41)) put(take(p), L.seats[k++], { still: true, dir: -1 });
      return;
    }
    if (d.lay === 'coliseum') {
      // camarote: o rei, a rainha e os príncipes do reino (no seu reino, o seu cônjuge e os seus filhos)
      const ci = src.owner, cv = G.civs[ci];
      let royals = [];
      if (cv && cv.ruler === 'player') royals = G.people.filter(p => p.alive && !p.capanga && (p.spouse === 'player' || p.kin === 'child') && p.age >= 4);
      else {
        const atCourt = p => p.alive && !p.capanga && p.home.type === 'castle' && p.home.civ === ci;
        const ruler = G.people.find(p => atCourt(p) && p.rank === 'ruler');
        royals = [ruler, ...G.people.filter(p => atCourt(p) && p.rank === 'consort'), ...G.people.filter(p => atCourt(p) && p.rank === 'heir'),
          ...(ruler ? ruler.children.map(id => G.people[id]).filter(q => q && atCourt(q)) : [])].filter((p, k, a) => p && a.indexOf(p) === k);
      }
      royals = royals.filter(p => !away(p));
      royals.slice(0, L.royal.length).forEach((p, k) => put(take(p), L.royal[k], { still: true, dir: k % 2 ? -1 : 1 }));
      put(take(Shops.keeper(src)), [2, 13], { still: true }); // o mestre da arena, na mesa de inscrição
      // plateia: gente do reino nas arquibancadas, mais cheia de dia
      const ofCiv = p => p.civ === ci || (p.home.type === 'village' && World.villages[p.home.idx] && World.villages[p.home.idx].civ === ci);
      const crowd = G.people.filter(p => p.alive && People.isAdult(p) && !p.capanga && !p.kin && p.spouse !== 'player' && !People.isCourt(p) && !p.trip && ofCiv(p) && !used.has(p.id) && !away(p));
      const n = Math.min(L.crowd.length, ph === 'day' ? 28 : 16);
      let j = 0; for (const p of pick(crowd, n, 37)) { const sp = L.crowd[j++]; put(take(p), sp, { still: true, dir: sp[0] < 11 ? 1 : -1 }); }
      return;
    }
    if (d.lay === 'graveyard') { put(take(Shops.keeper(src)), L.keeper, { still: true }); return; } // o coveiro (e o silêncio)
    if (d.lay === 'harbor') {
      put(take(Ports.keeper(src)), L.keeper, { still: true });
      return;
    }
    if (d.lay === 'home') {
      let k = 0; for (const p of G.people.filter(p => p.alive && p.home.type === 'player' && !p.capanga).slice(0, 4)) put(take(p), L.wander[k++ % L.wander.length], { leash: 1.6 });
      return;
    }
    if (d.biz) {
      const ws = Biz.workers(src);
      if (ws[0]) put(take(ws[0]), L.keeper, { still: true });
      let k = 0; for (const p of ws.slice(1)) put(take(p), (L.staff || L.wander)[k++ % (L.staff || L.wander).length], { leash: 0.8 });
      // hóspedes e fregueses (estalagem): mais gente quanto maior a freguesia
      if (L.seats) { let j = 0; for (const p of pick(locals(), Math.min(L.seats.length, Math.round(1 + Biz.popMul(src) * 2)), 29)) put(take(p), L.seats[j++], { still: true, dir: j % 2 ? 1 : -1 }); }
      return;
    }
    if (d.lay === 'tavern') {
      if (d.mine) { const ws = Biz.workers(src); if (ws[0]) put(take(ws[0]), L.keeper, { still: true }); let k = 0; for (const p of ws.slice(1)) put(take(p), L.wander[k++ % L.wander.length], { leash: 1.5 }); }
      else put(take(Shops.keeper(src)), L.keeper, { still: true });
      // fregueses: de noite quem já estava lá dentro e mais alguns da vila; de dia poucos (viajantes e caçadores)
      const inside = G.ents.filter(e => !e.dead && e.npc && e.inside === src.id).map(e => e.npc);
      const n = ph === 'day' ? 2 : 6;
      const guests = inside.concat(pick(locals().filter(p => !inside.includes(p)), Math.max(0, n - inside.length), 17)).slice(0, L.seats.length);
      let k = 0; for (const p of guests) { const t = take(p); if (t) put(t, L.seats[k++], { still: true, dir: k % 2 ? 1 : -1 }); }
      return;
    }
    // loja de vila: o dono no balcão e um ou dois fregueses
    put(take(Shops.keeper(src)), L.keeper, { still: true });
    if (L.staff && src.type === 'smith') { /* o ferreiro trabalha sozinho */ }
    wanderers(ph === 'day' ? 2 : 1, 23);
  },

  // ---------------------------------------------------------------- sair
  exit(quiet) {
    const pl = G.place;
    if (!pl) return;
    // as cópias de dentro somem; quem estava lá fora segue a vida de onde estava (ninguém é recriado na praça)
    for (const e of G.ents) if (e.placeNpc) {
      e.dead = true;
      if (e.npc && G.spawned.get(e.npc.id) === e) { G.spawned.delete(e.npc.id); if (e.outside && !e.outside.dead) G.spawned.set(e.npc.id, e.outside); }
    }
    // quem estava lá dentro sai junto pela porta (quem morreu lá dentro não volta)
    for (const o of G.ents) if (o.inRoom) {
      o.inRoom = false;
      if (o.npc && !o.npc.alive) { o.dead = true; continue; }
      const sp = freeSpotNear(pl.back.x + U.rnd(-40, 40), pl.back.y + U.rnd(10, 40), 60); o.x = sp.x; o.y = sp.y; o.target = null;
    }
    G.ents = G.ents.filter(e => !e.dead);
    if (pl.keep) this.uncarve(pl.keep);
    this.furn = []; this.lightList = []; World.roomTheme = null;
    G.place = null;
    P.x = pl.back.x; P.y = pl.back.y;
    if (World.blockedAt(P.x, P.y, 8)) { const s = freeSpotNear(P.x, P.y, 60); P.x = s.x; P.y = s.y; }
    for (const a of G.ents) if (a.kind === 'ally' && U.dist(a.x, a.y, P.x, P.y) > 8 * TILE) { const s = freeSpotNear(P.x, P.y, 50); a.x = s.x; a.y = s.y; a.target = null; }
    if (!quiet) Sound.play('chest', { vol: 0.4 });
  },

  // ---------------------------------------------------------------- a cada quadro
  update(dt) {
    const pl = this.room();
    if (!pl) return;
    // a construção pode ter sido demolida (ou a loja fechada) enquanto você estava lá dentro
    if (!pl.src || pl.src.removed) { this.exit(); UI.msg('O lugar foi desfeito e você saiu.'); return; }
    // pisar na porta sai
    if (P.y > (pl.door.y + 0.62) * TILE && Math.abs(P.x - (pl.door.x + 0.5) * TILE) < TILE) this.exit();
  },
  // pessoas lá dentro: o dono fica no balcão olhando para você; os fregueses andam um pouco
  npcUpdate(e, dt, sp) {
    e.anim += dt; e.hurt -= dt; e.moving = false;
    if (e.angry) return 'fight'; // quem foi atacado revida (lutando como lá fora)
    if (e.still) { e.dir = P.x < e.x ? -1 : 1; return; }
    e.wander(dt, sp * 0.6);
  },

  // ---------------------------------------------------------------- móveis: interagir e desenhar
  nearFurn() {
    if (!this.room()) return null;
    const ptx = P.x / TILE, pty = (P.y - 6) / TILE;
    let best = null, bd = 1.25;
    for (const f of this.furn) {
      if (!f.act) continue;
      const fy = f.y < 0 ? f.y : f.y;
      const dx = Math.max(f.x - ptx, 0, ptx - (f.x + f.w)), dy = Math.max(fy - pty, 0, pty - (fy + f.h));
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  },
  furnLabel(f) {
    const s = G.place && G.place.src;
    switch (f.act) {
      case 'shop': return 'Balcão — comprar e vender';
      case 'bizshop': return 'Balcão — comprar e vender no seu empreendimento';
      case 'biz': return 'Mesa de contas — funcionários e produção';
      case 'tavern': return 'Balcão da taverna';
      case 'ptavern': return 'Balcão da sua taverna';
      case 'chapel': return 'Altar — rezar e falar com o padre';
      case 'throne': return s && G.civs[s.owner] && G.civs[s.owner].ruler === 'player' ? 'Trono — governar o reino' : 'Trono — audiência com o soberano';
      case 'rest': return 'Cama — salvar e dormir';
      case 'royalbed': return 'Quarto real — salvar e dormir';
      case 'exit': return 'Porta — sair';
      case 'study': return 'Mesa de estudos — estudar';
      case 'port': return 'Balcão do porto — vender pescados e comprar equipamento';
      case 'grave': return `🪦 Lápide de ${f.gname || 'um parente'} — ler`;
      case 'mausoleum': return '🏛️ Mausoléu dos heróis da dinastia';
      case 'cembook': return '📖 Livro do cemitério — todas as lápides da família';
      case 'arena': return 'Banca da arena — lutar, justas, torneio e apostas';
      case 'sail': return Inv.count('boat') > 0 ? 'Barco — sair navegando pelo cais' : 'Barco — você precisa de um Barco a Remo';
      case 'pray': return 'Altar — rezar';
    }
    if (f.act && f.act.startsWith('craft:')) return 'Lareira — cozinhar';
    return '';
  },
  use(f) {
    const s = G.place.src;
    switch (f.act) {
      case 'shop': { const k = Shops.keeper(s); UI.showShop(s.type, s.village, k ? k.id : null); return; }
      case 'bizshop': UI.showBizShop(s.id); return;
      case 'biz': UI.showBiz(s.id); return;
      case 'tavern': UI.showTavern(s.id); return;
      case 'ptavern': UI.showPTavern(s.id); return;
      case 'chapel': UI.showChapel(s.id); return;
      case 'throne': if (G.civs[s.owner].ruler === 'player') UI.showKingdom(s.owner); else UI.showCastle(s.owner); return;
      case 'rest': UI.showRest(s.id); return;
      case 'royalbed': this.royalBed(s); return;
      case 'exit': this.exit(); return;
      case 'port': UI.showPort(s.id); return;
      case 'arena': UI.showArena(s.owner); return;
      case 'grave': case 'mausoleum': case 'cembook': {
        const all = Graves.inCiv(s.owner).slice().sort((a, b) => b.day - a.day);
        let k = 0;
        if (f.act === 'grave') k = Math.max(0, all.indexOf(Graves.list()[f.gi]));
        if (f.act === 'mausoleum') { k = all.findIndex(g => g.kind === 'hero'); if (k < 0) { UI.msg('🏛️ O mausoléu guarda os heróis da sua dinastia. Ainda não há nenhum descansando aqui.'); return; } }
        UI.sel.grave = k; UI.showCemetery(s.owner); return;
      }
      case 'sail': this.sailOut(s); return;
    }
    if (Content.act(f.act)) return;
    if (f.act && f.act.startsWith('craft:')) UI.showCrafting(f.act.slice(6));
  },
  // o quarto real do castelo: só o rei deste reino dorme aqui (dormir salva o jogo e o castelo vira o ponto de retorno)
  royalBed(s) {
    const c = G.civs[s.owner];
    if (!c || c.ruler !== 'player') { UI.msg('👑 O quarto real é só do rei. Os guardas não deixam você passar.', 'bad'); return; }
    const hurt = P.hp < P.maxHp;
    if (!UI.royalBedUI) UI.royalBedUI = sid => this.royalBed(World.structs[sid]); // para a janela poder se redesenhar
    UI.open('👑 Quarto Real', `<div class="rest"><div class="rest-acts">
        <button class="ra main" data-act="sleep" data-s="${s.id}"><span class="ra-ic">🛏️</span><span class="ra-t"><b>Dormir até o amanhecer</b><small>${hurt ? 'Recupera toda a vida · ' : ''}salva no espaço ${G.slot} · o castelo vira o seu ponto de retorno</small></span></button>
      </div></div>`, 'royalBedUI', [s.id], `O quarto do rei de ${CIV_DEFS[s.owner].short}`);
  },
  // janelas só clareiam de dia
  // sair do porto de barco: aparece navegando na água em frente ao cais
  sailOut(s) {
    if (Inv.count('boat') <= 0) { UI.msg('🛶 Você precisa de um Barco a Remo (o mestre do porto vende).', 'bad'); return; }
    let best = null, bd = 1e9;
    for (let y = s.y + s.h; y < s.y + s.h + 10; y++) for (let x = s.x - 4; x < s.x + s.w + 4; x++) {
      if (!World.inb(x, y)) continue;
      const t = World.tile(x, y);
      if (!World.isWater(t) || t === T.BRIDGE || World.blocked(x, y, true)) continue;
      const d = U.dist(x, y, s.x + s.w / 2, s.y + s.h + 2); if (d < bd) { bd = d; best = { x, y }; }
    }
    this.exit(true);
    if (!best) { UI.msg('A água em frente ao porto está bloqueada: você saiu pela porta.', 'bad'); return; }
    P.sailing = true; P.fishing = null; P.mounted = false; P.x = (best.x + 0.5) * TILE; P.y = (best.y + 0.8) * TILE;
    UI.msg('🛶 Você saiu do porto navegando! Aperte Interagir perto da margem para desembarcar.', 'gold');
    Sound.play('splash');
  },
  lights() { if (!this.room()) return []; const day = Routine.phase() === 'day'; return this.lightList.filter(L => !L.day || day); },
  draw(ctx, f, X, Y, time) { drawFurn(ctx, f, X, Y, time); },
};

// propriedades de cada móvel: block = não dá para atravessar; flat = desenhado no chão (por baixo das pessoas)
const FURN = {
  shelf: { block: true }, counter: { block: true }, barrel: { block: true }, crate: { block: true }, sacks: { block: true }, table: { block: true },
  stool: { flat: true }, rug: { flat: true }, carpet: { flat: true }, fireplace: { block: true, light: 1, lr: 170 }, furnace: { block: true, light: 1, lr: 150, lcol: '#ff8a3a' },
  anvil: { block: true }, toolrack: {}, weaponrack: { block: true }, logs: { block: true }, sawbench: { block: true }, planks: { block: true }, stones: { block: true },
  orecart: { block: true }, bar: { block: true }, kegs: { block: true }, altar: { block: true }, candles: { block: true, light: 1, lr: 90, lcol: '#ffd98a' }, pew: { block: true },
  window: { light: 1, lr: 110, lcol: '#bcd7ff', day: true }, stained: { light: 1, lr: 120, lcol: '#d8b8ff', day: true }, lamp: { light: 1, lr: 120, lcol: '#ffc06a' },
  banner: {}, throne: { block: true }, pillar: { block: true }, brazier: { block: true, light: 1, lr: 140, lcol: '#ff9a40' }, longtable: { block: true }, armor: { block: true },
  bed: { block: true }, hearth: { block: true, light: 1, lr: 160 }, chestf: { block: true }, bookshelf: {}, plant: { block: true }, board: {}, bench: { block: true },
  coal: { block: true }, grind: { block: true }, beam: { block: true }, minehole: { block: true }, millstone: { block: true }, flour: { block: true }, oven: { block: true, light: 1, lr: 110, lcol: '#ff8a3a' },
  desk: { block: true }, door: { act: 'exit', flat: true }, stands: { flat: true }, grave: { block: true }, oldgrave: { block: true }, mausoleum: { block: true }, cypress: { block: true }, lantern: { block: true, light: 1, lr: 120, lcol: '#ffd27a' }, angel: { block: true }, cembook: { block: true }, flowerbed: { flat: true }, box: { block: true, flat: true }, pillar: { block: true }, portcullis: { block: true }, emblem: { flat: true }, foodstall: { block: true }, arenadesk: { block: true }, anchor: { block: true }, rowboat: { flat: true }, bollard: { block: true },
  tent: { block: true }, flagpole: { block: true }, campfire2: { block: true },
};

// ------------------------------------------------------------------ desenho dos móveis (pixel art, 32 px por bloco)
function drawFurn(ctx, f, X, Y, time) {
  const w = f.w * TILE, h = f.h * TILE;
  const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
  const sh = (x, y, ww, hh) => { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(Math.round(X + x), Math.round(Y + y), ww, hh); };
  const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const wood = '#8a5a30', dark = '#5a3a1e', light = '#a8743e';
  const fl = (x, y, s) => { const a = Math.sin(time * 14 + f.id * 3) * 1.4; ctx.fillStyle = '#ff7b1c'; ctx.beginPath(); ctx.moveTo(X + x - 4 * s, Y + y); ctx.lineTo(X + x + a, Y + y - 11 * s); ctx.lineTo(X + x + 4 * s, Y + y); ctx.fill(); ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.moveTo(X + x - 2 * s, Y + y); ctx.lineTo(X + x - a * 0.5, Y + y - 6 * s); ctx.lineTo(X + x + 2 * s, Y + y); ctx.fill(); };
  const goods = ['#e2b23a', '#c24b3a', '#6aa84f', '#b07d4a', '#e6e6e6', '#7a8ac8', '#d88a3a'];
  switch (f.k) {
    case 'shelf': case 'bookshelf': {
      if (f.y >= 0) sh(2, h - 4, w - 4, 6);
      const top = f.y < 0 ? 2 : -10;
      R(2, top, w - 4, h - top - 2, dark); R(4, top + 2, w - 8, h - top - 6, '#3e2812');
      for (let k = 0; k < 3; k++) { const yy = top + 4 + k * ((h - top - 6) / 3); R(4, yy + 8, w - 8, 2, wood);
        for (let j = 0; j < (w - 10) / 6; j++) R(6 + j * 6, yy + 1, 4, 7, f.k === 'bookshelf' ? ['#7a2a2a', '#2a4a7a', '#2a6a3a', '#8a6a2a'][(j + k) % 4] : goods[(j * 3 + k + f.id) % goods.length]); }
      break;
    }
    case 'counter': case 'bar': case 'desk': {
      sh(0, h - 2, w, 6);
      R(0, 4, w, h - 4, wood); R(0, 4, w, 6, light); R(0, h - 4, w, 4, dark);
      for (let k = 8; k < w - 4; k += 16) R(k, 12, 2, h - 16, dark);
      if (f.k === 'bar') { for (let k = 10; k < w - 6; k += 26) { R(k, -2, 6, 8, '#d8c890'); R(k + 1, -4, 4, 3, '#f2ead0'); } }
      else if (f.k === 'desk') { R(8, -1, 14, 7, '#e8dcc0'); R(26, 0, 4, 6, '#2a2a2a'); R(w - 18, -2, 10, 8, '#c8a050'); }
      else { R(10, -2, 10, 6, '#e2b23a'); R(w - 22, -3, 12, 7, '#d8d0c0'); R(w - 20, -1, 8, 2, '#c24b3a'); }
      break;
    }
    case 'barrel': case 'kegs': {
      const n = f.k === 'kegs' ? f.w * 2 : 1;
      for (let k = 0; k < n; k++) { const bx = f.k === 'kegs' ? 4 + k * 15 : 6, bw = f.k === 'kegs' ? 13 : 20; sh(bx, h - 6, bw, 6);
        R(bx, 4, bw, h - 8, '#7a4a22'); R(bx + 2, 4, bw - 4, h - 8, '#8f5a2a'); R(bx, 9, bw, 2, '#3a3a3a'); R(bx, h - 10, bw, 2, '#3a3a3a'); R(bx + 2, 2, bw - 4, 4, '#a06a35'); }
      break;
    }
    case 'crate': sh(3, h - 5, 26, 6); R(4, 6, 24, 22, '#9a6a3a'); R(4, 6, 24, 3, '#b07d4a'); R(4, 6, 2, 22, dark); R(26, 6, 2, 22, dark); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 6, Y + 9); ctx.lineTo(X + 26, Y + 26); ctx.stroke(); break;
    case 'sacks': case 'flour': { const c = f.k === 'flour' ? '#efe8d8' : '#c8b07a'; sh(3, h - 5, 26, 6); ell(11, 20, 9, 10, c); ell(21, 21, 9, 9, U.shade(c, -0.08)); R(8, 9, 6, 3, U.shade(c, -0.25)); R(18, 11, 6, 3, U.shade(c, -0.25)); break; }
    case 'table': case 'longtable': {
      sh(2, h - 4, w - 4, 6);
      R(2, 6, w - 4, h - 12, '#9a6a3a'); R(2, 6, w - 4, 3, '#b8844a'); R(4, h - 7, 3, 7, dark); R(w - 7, h - 7, 3, 7, dark);
      R(8, 8, 6, 4, '#e8e0d0'); R(w - 16, 9, 7, 5, '#c8a050'); if (f.w > 1) R(w / 2 - 3, 10, 6, 6, '#7a2a2a');
      break;
    }
    case 'stool': ell(16, 26, 7, 3, 'rgba(0,0,0,0.25)'); R(9, 14, 14, 5, '#a06a35'); R(10, 19, 2, 8, dark); R(20, 19, 2, 8, dark); break;
    case 'bench': sh(2, h - 4, w - 4, 6); R(2, 10, w - 4, 8, '#a06a35'); R(4, 18, 3, 10, dark); R(w - 7, 18, 3, 10, dark); break;
    case 'rug': { R(2, 2, w - 4, h - 4, '#7a2a2a'); R(5, 5, w - 10, h - 10, '#9a3a2a'); ctx.strokeStyle = '#d8a84a'; ctx.lineWidth = 2; ctx.strokeRect(X + 7, Y + 7, w - 14, h - 14); break; }
    case 'carpet': R(4, 0, w - 8, h, '#8e1f2a'); R(6, 0, 2, h, '#d8a84a'); R(w - 8, 0, 2, h, '#d8a84a'); break;
    case 'fireplace': case 'hearth': {
      R(0, -22, w, h + 18, '#7d7f86'); R(2, -22, w - 4, 6, '#9a9ca2'); for (let k = -16; k < h - 4; k += 7) R(0, k, w, 1, '#5d5f64');
      R(10, -6, w - 20, h - 2, '#1a120c'); fl(w / 2 - 6, h - 6, 0.9); fl(w / 2 + 6, h - 6, 0.8); R(8, h - 6, w - 16, 3, '#5a3a1e'); break;
    }
    case 'furnace': case 'oven': {
      R(0, -18, w, h + 14, '#6f7177'); R(0, -18, w, 4, '#8a8c92'); R(w - 14, -30, 10, 14, '#55575c');
      const g = 0.7 + Math.sin(time * 9 + f.id) * 0.2; ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 6, 12, Math.PI, 0); ctx.fill();
      ctx.fillStyle = U.rgba('#ff7a1c', g); ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 5, 9, Math.PI, 0); ctx.fill(); break;
    }
    case 'anvil': sh(4, 24, 24, 6); R(8, 18, 16, 10, '#5a3a1e'); R(4, 10, 24, 8, '#3a3a40'); R(2, 10, 6, 4, '#3a3a40'); R(6, 10, 18, 2, '#6a6a72'); break;
    case 'grind': sh(4, 24, 24, 6); ell(16, 16, 10, 10, '#8a8a8a'); ell(16, 16, 3, 3, '#5a5a5a'); R(6, 22, 20, 6, dark); break;
    case 'toolrack': case 'weaponrack': {
      const top = f.y < 0 ? 4 : -8; R(2, top, w - 4, 4, dark);
      for (let k = 0; k < f.w * 2; k++) { const x = 8 + k * 14; R(x, top + 4, 2, 18, '#7a5230'); R(x - 3, top + 20, 8, 5, f.k === 'weaponrack' ? '#cfd6dd' : '#8a8a8a'); }
      break;
    }
    case 'logs': for (let k = 0; k < f.w * 3; k++) { const x = 6 + k * 10, y = 12 + (k % 2) * 6; ell(x, y + 6, 6, 6, '#7a4a22'); ell(x, y + 6, 3, 3, '#d9b07a'); } sh(2, h - 4, w - 4, 4); break;
    case 'planks': sh(2, h - 4, w - 4, 5); for (let k = 0; k < 4; k++) R(2, 8 + k * 5, w - 4, 4, k % 2 ? '#c89a5a' : '#b8884a'); break;
    case 'sawbench': sh(2, h - 4, w - 4, 6); R(2, 10, w - 4, 8, '#a06a35'); R(4, 18, 3, 10, dark); R(w - 7, 18, 3, 10, dark); R(w / 2 - 12, 4, 24, 6, '#9a9aa2'); for (let k = 0; k < 6; k++) R(w / 2 - 12 + k * 4, 10, 2, 2, '#6a6a72'); break;
    case 'stones': case 'coal': { const c = f.k === 'coal' ? '#2a2a2e' : '#9a9488'; sh(3, 24, 26, 6); ell(12, 20, 9, 7, c); ell(21, 22, 8, 6, U.shade(c, -0.1)); ell(16, 14, 7, 6, U.shade(c, 0.08)); break; }
    case 'orecart': sh(2, 26, 28, 5); R(4, 10, 24, 14, '#5a5a62'); R(4, 10, 24, 3, '#7a7a82'); ell(9, 26, 4, 4, '#2a2a2a'); ell(23, 26, 4, 4, '#2a2a2a'); R(7, 7, 6, 4, '#c27a45'); R(15, 6, 6, 5, '#9aa0a8'); R(20, 8, 5, 3, '#2a2a2e'); break;
    case 'beam': R(10, -26, 12, h + 22, '#6b4423'); R(10, -26, 12, 3, '#8b5f38'); break;
    case 'minehole': R(2, -20, w - 4, h + 14, '#1a1410'); R(0, -24, w, 6, '#6b4423'); R(0, -24, 5, h + 20, '#6b4423'); R(w - 5, -24, 5, h + 20, '#6b4423'); break;
    case 'millstone': { sh(2, h - 6, w - 4, 8); ell(w / 2, h / 2 + 4, w / 2 - 4, h / 2 - 8, '#8a8a8a'); ell(w / 2, h / 2 + 2, w / 2 - 8, h / 2 - 12, '#a5a5a5'); const a = time * 1.5; R(w / 2 - 2, h / 2 - 2, 4, 4, '#5a5a5a'); ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X + w / 2, Y + h / 2); ctx.lineTo(X + w / 2 + Math.cos(a) * 26, Y + h / 2 + Math.sin(a) * 12); ctx.stroke(); break; }
    case 'altar': sh(0, h - 4, w, 6); R(2, 8, w - 4, h - 10, '#e6dfcc'); R(0, 6, w, 5, '#f2ece0'); R(w / 2 - 2, -14, 4, 20, '#d4b14a'); R(w / 2 - 7, -9, 14, 3, '#d4b14a'); R(6, 4, 10, 3, '#8e1f2a'); break;
    case 'candles': for (const [x, hh] of [[8, 14], [16, 18], [24, 12]]) { R(x - 2, 28 - hh, 4, hh, '#efe8d8'); fl(x, 28 - hh, 0.45); } R(4, 26, 24, 4, '#c8a050'); break;
    case 'pew': sh(0, h - 4, w, 5); R(0, 6, w, 6, '#7a4a22'); R(0, 12, w, 8, '#9a6a3a'); R(0, 12, w, 2, '#b07d4a'); R(2, 20, 3, 8, dark); R(w - 5, 20, 3, 8, dark); break;
    case 'window': { const day = G.darkness < 0.3; R(4, 4, 24, 22, '#3a2a1a'); R(6, 6, 20, 18, day ? '#9ac8f0' : '#26344a'); R(15, 6, 2, 18, '#3a2a1a'); R(6, 14, 20, 2, '#3a2a1a'); if (day) R(7, 7, 6, 5, 'rgba(255,255,255,0.45)'); break; }
    case 'stained': { R(3, 2, w - 6, 26, '#3a2a1a'); const cs = ['#c84a4a', '#4a7ac8', '#d8b84a', '#5aa85a', '#9a5ac8']; for (let k = 0; k < 6; k++) R(5 + (k % 2) * ((w - 10) / 2), 4 + Math.floor(k / 2) * 8, (w - 10) / 2, 7, cs[(k + f.id) % cs.length]); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(X + 5, Y + 4, w - 10, 24); break; }
    case 'lamp': { R(15, 4, 2, 6, '#3a3a3a'); R(11, 10, 10, 10, '#2a2a2a'); const g = 0.8 + Math.sin(time * 7 + f.id) * 0.15; R(13, 12, 6, 6, U.rgba('#ffd36b', g)); break; }
    case 'banner': { const col = G.place && typeof G.place.src.owner === 'number' ? Game.civColor(G.place.src.owner) : PLAYER_COLOR; R(6, 0, 20, 2, '#3a2a1a'); R(8, 2, 16, 24, col); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + 8, Y + 26); ctx.lineTo(X + 16, Y + 31); ctx.lineTo(X + 24, Y + 26); ctx.fill(); if (G.place && typeof G.place.src.owner === 'number') Heraldry.drawArms(ctx, X + 16, Y + 14, 10, G.place.src.owner); break; }
    case 'throne': { sh(0, h - 4, w, 6); R(10, -26, w - 20, 34, '#8e1f2a'); R(8, -30, w - 16, 6, '#d8a84a'); R(6, 6, w - 12, h - 8, '#a8791a'); R(10, 4, w - 20, 10, '#8e1f2a'); R(4, -4, 6, h, '#d8a84a'); R(w - 10, -4, 6, h, '#d8a84a'); R(w / 2 - 3, -36, 6, 6, '#ffd54a'); break; }
    case 'pillar': R(6, -40, 20, 66, '#b8b4aa'); R(4, -42, 24, 6, '#d0ccc2'); R(4, 22, 24, 6, '#9a968c'); R(10, -36, 2, 58, 'rgba(0,0,0,0.12)'); sh(4, 26, 24, 5); break;
    case 'brazier': { R(10, 14, 12, 14, '#3a3a40'); R(6, 10, 20, 6, '#5a5a62'); fl(16, 12, 1.1); break; }
    case 'armor': { sh(6, 26, 20, 5); R(14, 18, 4, 10, dark); R(9, 4, 14, 14, '#9aa0a8'); R(11, -4, 10, 8, '#8d949c'); R(12, -1, 8, 2, '#2a2a2a'); R(6, 6, 4, 10, '#8d949c'); R(22, 6, 4, 10, '#8d949c'); break; }
    case 'bed': { sh(0, h - 4, w, 6); R(2, 2, w - 4, h - 6, '#6b4423'); R(4, 4, w - 8, 10, '#efe8d8'); R(4, 14, w - 8, h - 22, '#2a4a8a'); R(4, 14, w - 8, 3, '#3a5aa0'); break; }
    case 'chestf': sh(3, 26, 26, 5); R(4, 12, 24, 16, '#8b5a2b'); R(4, 10, 24, 6, '#a06a35'); R(4, 16, 24, 2, dark); R(14, 15, 4, 5, '#ffd54a'); break;
    case 'plant': sh(8, 26, 16, 4); R(10, 18, 12, 10, '#9a5a3a'); ell(16, 12, 9, 8, '#3f7a2e'); ell(12, 9, 5, 5, '#5a9a3a'); ell(20, 10, 5, 5, '#4f8a36'); break;
    case 'board': { R(4, 2, 24, 22, dark); R(6, 4, 20, 18, '#c8a878'); R(8, 6, 7, 6, '#efe8d8'); R(17, 8, 7, 8, '#efe8d8'); R(9, 14, 6, 6, '#e8dcc0'); break; }
    case 'tent': {
      const col = f.civ !== undefined ? Game.civColor(f.civ) : '#b89a6a';
      sh(-2, h - 4, w + 4, 8);
      ctx.fillStyle = '#d8c8a0'; ctx.beginPath(); ctx.moveTo(X - 4, Y + h); ctx.lineTo(X + w / 2, Y - 22); ctx.lineTo(X + w + 4, Y + h); ctx.fill();
      ctx.fillStyle = U.shade('#d8c8a0', -0.15); ctx.beginPath(); ctx.moveTo(X + w / 2, Y - 22); ctx.lineTo(X + w + 4, Y + h); ctx.lineTo(X + w / 2 + 6, Y + h); ctx.fill();
      R(w / 2 - 6, h - 16, 12, 16, '#3a2a1a'); R(-4, h - 30, w + 8, 4, col); R(w / 2 - 1, -30, 2, 10, '#5a3a1e');
      break;
    }
    case 'flagpole': { R(14, -40, 3, 68, '#5a3a1e'); if (f.civ !== undefined && G.civs[f.civ]) Heraldry.drawFlag(ctx, X + 17, Y - 40, 20, 13, f.civ, time); sh(8, 26, 16, 4); break; }
    case 'campfire2': { ell(16, 26, 12, 4, 'rgba(0,0,0,0.25)'); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; R(14 + Math.cos(a) * 10, 22 + Math.sin(a) * 4, 4, 3, '#7d7d7d'); } R(8, 22, 16, 3, '#5a3618'); fl(16, 24, 1); break; }
    default: if (typeof FURN_EXTRA !== 'undefined' && FURN_EXTRA[f.k]) FURN_EXTRA[f.k](ctx, f, X, Y, time, { R, sh, ell, fl }); break;
    case 'stands': {
      const side = !!f.side;
      R(0, side ? 0 : -14, w, h + (side ? 0 : 14), '#8f8a80');
      if (side) {
        // degraus em pé (colunas), cada um com um banco comprido de madeira
        for (let c = 0; c < f.w; c++) {
          const x = c * TILE, shade = c % 2 ? '#99948a' : '#8a857b';
          R(x, 0, TILE, h, shade); R(x, 0, 3, h, '#a8a296'); R(x + TILE - 3, 0, 3, h, '#6f6a62');
          R(x + 10, 0, 12, h, '#8a5a30'); R(x + 10, 0, 3, h, '#a8743e'); R(x + 20, 0, 2, h, '#5a3a1e');
          for (let y = 8; y < h; y += TILE) R(x + 9, y, 14, 2, '#5a3a1e');
        }
      } else {
        // fileiras deitadas (de cima para baixo), cada uma com um banco
        const rows = Math.round((h + 14) / 15);
        for (let r = 0; r < rows; r++) {
          const y = -14 + r * 15;
          R(0, y, w, 15, r % 2 ? '#99948a' : '#8a857b'); R(0, y, w, 2, '#a8a296'); R(0, y + 13, w, 2, '#6f6a62');
          R(0, y + 5, w, 5, '#8a5a30'); R(0, y + 5, w, 1, '#a8743e'); R(0, y + 9, w, 1, '#5a3a1e');
          for (let x = 14; x < w; x += TILE) R(x, y + 10, 3, 3, '#5a3a1e');
        }
      }
      break;
    }
    case 'box': {
      R(0, -18, w, h + 16, '#6e1822'); R(0, -18, w, 4, '#d8a84a'); R(0, -14, w, 10, '#8e1f2a');
      for (let k = 0; k < 8; k++) R(k * (w / 8), -4, w / 8 - 2, 5, k % 2 ? '#d8a84a' : '#8e1f2a');
      for (let k = 0; k < 4; k++) { const cx = 14 + k * 28; R(cx, 22, 14, 18, '#5a2a1a'); R(cx, 18, 14, 6, '#c8a040'); R(cx + 2, 26, 10, 8, '#a8202a'); }
      R(4, h - 6, w - 8, 4, '#d8a84a');
      if (G.place && typeof G.place.src.owner === 'number') Heraldry.drawArms(ctx, X + w / 2, Y - 8, 12, G.place.src.owner);
      break;
    }
    case 'grave': {
      sh(3, 24, 26, 6); R(6, 22, 20, 6, '#5a4632'); R(8, 20, 16, 3, '#6a5440');
      ctx.fillStyle = '#a8aaa4'; ctx.beginPath(); ctx.moveTo(X + 7, Y + 22); ctx.lineTo(X + 7, Y + 4); ctx.arc(X + 16, Y + 4, 9, Math.PI, 0); ctx.lineTo(X + 25, Y + 22); ctx.fill();
      R(21, 2, 4, 20, '#8a8c86'); R(7, 3, 2, 19, '#c4c6c0');
      R(14, 2, 4, 9, '#6e706a'); R(11, 4, 10, 3, '#6e706a');
      if (f.gname) { ctx.fillStyle = '#3a3a34'; ctx.font = 'bold 6px serif'; ctx.textAlign = 'center'; ctx.fillText(f.gname.slice(0, 8), X + 16, Y + 18); ctx.textAlign = 'left'; }
      const gr = Graves.list()[f.gi]; if (gr && gr.flowers !== undefined && G.day - gr.flowers < 3) { R(9, 23, 3, 3, '#d0304a'); R(14, 24, 3, 3, '#f0e040'); R(19, 23, 3, 3, '#e86aa0'); }
      break;
    }
    case 'oldgrave': {
      sh(4, 24, 24, 5); R(7, 22, 18, 5, '#4a3e2e');
      ctx.save(); ctx.translate(X + 16, Y + 22); ctx.rotate((f.tilt - 1) * 0.12);
      ctx.fillStyle = '#7e8078'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, -14); ctx.arc(0, -14, 8, Math.PI, 0); ctx.lineTo(8, 0); ctx.fill();
      ctx.fillStyle = '#5a7a3a'; ctx.fillRect(-8, -4, 6, 4); ctx.fillRect(3, -12, 4, 3); ctx.fillStyle = '#4a4c46'; ctx.fillRect(-2, -18, 1, 8); ctx.fillRect(0, -12, 3, 1);
      ctx.restore(); break;
    }
    case 'mausoleum': {
      sh(0, h - 4, w, 8);
      R(8, 30, w - 16, h - 30, '#9a958c'); R(8, 30, w - 16, 4, '#b8b2a6');
      ctx.fillStyle = '#7e786e'; ctx.beginPath(); ctx.moveTo(X + 2, Y + 32); ctx.lineTo(X + w / 2, Y + 4); ctx.lineTo(X + w - 2, Y + 32); ctx.fill();
      ctx.fillStyle = '#a8a296'; ctx.beginPath(); ctx.moveTo(X + 14, Y + 28); ctx.lineTo(X + w / 2, Y + 12); ctx.lineTo(X + w - 14, Y + 28); ctx.fill();
      for (const cx of [16, 40, w - 46, w - 22]) { R(cx, 34, 6, h - 40, '#c8c2b4'); R(cx - 2, 34, 10, 3, '#d8d2c4'); }
      R(w / 2 - 12, 48, 24, h - 54, '#2a2420'); R(w / 2 - 12, 48, 24, 3, '#4a4038'); R(w / 2 - 1, 52, 2, h - 58, '#4a4038');
      ctx.fillStyle = '#e8b923'; ctx.fillRect(X + w / 2 - 8, Y + 18, 16, 4); for (const dx of [-8, -1, 6]) ctx.fillRect(X + w / 2 + dx, Y + 13, 2, 5);
      break;
    }
    case 'cypress': { sh(4, 26, 24, 6); R(14, 18, 4, 12, '#4a3420'); ell(16, 6, 8, 20, '#22402a'); ell(14, 2, 4, 14, '#2f5534'); ell(18, 10, 3, 9, '#1a3420'); break; }
    case 'lantern': { R(14, -10, 4, 38, '#2e2e34'); R(10, -18, 12, 10, '#3a3a40'); R(12, -16, 8, 6, 'rgba(255,214,120,0.95)'); R(9, -20, 14, 3, '#2e2e34'); break; }
    case 'angel': {
      sh(4, 26, 24, 6); R(8, 20, 16, 8, '#8f897e'); R(6, 24, 20, 4, '#a8a296');
      ctx.fillStyle = '#c8c2b4'; ctx.beginPath(); ctx.moveTo(X + 16, Y - 6); ctx.lineTo(X + 4, Y + 4); ctx.lineTo(X + 10, Y + 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(X + 16, Y - 6); ctx.lineTo(X + 28, Y + 4); ctx.lineTo(X + 22, Y + 12); ctx.fill();
      R(12, -2, 8, 22, '#d8d2c4'); ell(16, -6, 4, 4, '#e0dace'); ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X + 16, Y - 12, 4, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'cembook': { sh(4, 26, 24, 5); R(13, 12, 6, 16, '#5a3a1e'); R(6, 6, 20, 8, '#7a4a26'); R(8, 4, 8, 6, '#efe6d2'); R(16, 4, 8, 6, '#e6dcc4'); R(15, 4, 2, 6, '#8a6a4a'); break; }
    case 'flowerbed': {
      R(0, 6, w, h - 8, '#4a3626'); R(0, 6, w, 2, '#5e4632');
      const cols = ['#d0304a', '#f0e040', '#e86aa0', '#ffffff', '#8a6ad8'];
      for (let k = 0; k < f.w * 5; k++) { const x = 3 + (k * 37) % (w - 6), y = 9 + (k * 13) % (h - 14); R(x, y + 2, 1, 4, '#3a7a2a'); R(x - 1, y, 3, 3, cols[k % cols.length]); }
      break;
    }
    case 'pillar': { sh(4, 26, 26, 6); R(6, -26, 20, 54, '#a8a296'); R(6, -26, 5, 54, '#c8c2b4'); R(21, -26, 5, 54, '#857f74'); R(2, -32, 28, 8, '#b8b2a6'); R(2, 22, 28, 8, '#8f897e'); R(2, -32, 28, 2, '#d8d2c4'); break; }
    case 'portcullis': {
      R(-4, -4, w + 8, h + 8, '#6e6a62'); R(0, 0, w, h, '#1a1612');
      ctx.fillStyle = '#4a4a52'; for (let x = 3; x < w; x += 7) ctx.fillRect(Math.round(X + x), Math.round(Y), 2, h); for (let y = 6; y < h; y += 10) ctx.fillRect(Math.round(X), Math.round(Y + y), w, 2);
      ctx.fillStyle = '#7a7a84'; for (let x = 3; x < w; x += 7) ctx.fillRect(Math.round(X + x), Math.round(Y + h - 4), 2, 4); break;
    }
    case 'emblem': {
      const owner = G.place && typeof G.place.src.owner === 'number' ? G.place.src.owner : -1;
      ell(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 'rgba(120,80,40,0.16)'); ell(w / 2, h / 2, w / 2 - 10, h / 2 - 10, 'rgba(255,240,200,0.12)');
      ctx.strokeStyle = 'rgba(110,70,30,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h / 2, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(X + w / 2 + Math.cos(an) * 22, Y + h / 2 + Math.sin(an) * 22); ctx.lineTo(X + w / 2 + Math.cos(an) * (w / 2 - 8), Y + h / 2 + Math.sin(an) * (h / 2 - 8)); ctx.stroke(); }
      if (owner >= 0) { ctx.globalAlpha = 0.55; Heraldry.drawArms(ctx, X + w / 2, Y + h / 2 + 4, 26, owner); ctx.globalAlpha = 1; }
      break;
    }
    case 'foodstall': {
      sh(0, h - 2, w, 6); R(2, 6, w - 4, h - 6, '#7a4a26'); R(2, 6, w - 4, 4, '#9a6a3a');
      const col = f.drink ? '#3a6ab0' : '#b0303a';
      for (let k = 0; k < 6; k++) R(k * (w / 6), -18, Math.ceil(w / 6), 10, k % 2 ? '#efe6d2' : col);
      R(2, -8, 3, 16, '#5a3a1e'); R(w - 5, -8, 3, 16, '#5a3a1e');
      if (f.drink) for (let k = 0; k < 4; k++) { R(10 + k * 18, -2, 10, 9, '#8a5a30'); R(10 + k * 18, 1, 10, 2, '#5a3a1e'); }
      else for (let k = 0; k < 5; k++) ell(12 + k * 16, 2, 6, 4, ['#c8883a', '#e2b23a', '#b0503a', '#d8a868', '#c8883a'][k]);
      break;
    }
    case 'arenadesk': { sh(0, h - 2, w, 6); R(0, 4, w, h - 4, '#8a5a30'); R(0, 4, w, 5, '#a8743e'); R(8, -4, 18, 9, '#efe6d2'); R(10, -2, 14, 1, '#3a3a3a'); R(10, 1, 10, 1, '#3a3a3a'); R(w - 22, -2, 12, 7, '#ffd54a'); break; }
    case 'anchor': { sh(4, 26, 24, 5); ctx.strokeStyle = '#5a5a62'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X + 16, Y + 4); ctx.lineTo(X + 16, Y + 26); ctx.stroke(); ctx.beginPath(); ctx.arc(X + 16, Y + 18, 10, 0.2, Math.PI - 0.2); ctx.stroke(); R(10, 6, 12, 3, '#5a5a62'); ell(16, 3, 3, 3, '#5a5a62'); break; }
    case 'bollard': { sh(8, 26, 16, 4); R(11, 10, 10, 18, '#5a3a1e'); R(9, 8, 14, 4, '#7a5230'); ctx.strokeStyle = '#c8b88a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 21, Y + 16); ctx.lineTo(X + 34, Y + 22); ctx.stroke(); break; }
    case 'rowboat': {
      const bob = Math.sin(time * 2) * 1.5;
      ell(w / 2, h / 2 + 8 + bob, w / 2 - 4, h / 2 - 12, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h / 2 + bob, w / 2 - 6, h / 2 - 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a06a35'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h / 2 - 2 + bob, w / 2 - 10, h / 2 - 18, 0, 0, Math.PI * 2); ctx.fill();
      R(w / 2 - 14, h / 2 - 4 + bob, 28, 3, '#5a3a1e'); R(8, h / 2 + bob, 24, 2, '#c8a878'); R(w - 30, h / 2 - 6 + bob, 22, 2, '#c8a878');
      if (Inv.count('boat') > 0) { ctx.fillStyle = 'rgba(255,230,150,0.9)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⛵', X + w / 2, Y + 4 + bob); ctx.textAlign = 'left'; }
      break;
    }
    case 'door': { R(4, -2, 24, 6, '#3a2410'); R(6, 2, 20, 28, 'rgba(255,220,150,0.18)'); ctx.fillStyle = 'rgba(255,230,170,0.85)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▼', X + 16, Y + 22); ctx.textAlign = 'left'; break; }
  }
}
