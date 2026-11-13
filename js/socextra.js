'use strict';
// Sociedades, terceira parte:
//  • ❄️ Sociedade Thule: a oitava sociedade, nascida da lenda de Thule — a ilha perdida no extremo norte. Marinheiros,
//    madeireiros e mineiros guardam as runas e os mapas do gelo. (Inspirada só na lenda: nada a ver com a sociedade
//    real de 1918.)
//  • 🛣️ Cada templo das sociedades nos reinos ganha uma estrada em volta, ligada à estrada mais próxima.
//  • 🏛️ Cada templo tem um interior com o tema da sua sociedade: a loja maçônica com as duas colunas e o altar do
//    esquadro e do compasso, a sala capitular dos Templários com armaduras e estandartes, o gabinete dos Illuminati com
//    livros e o olho, a cripta do Priorado com vitrais, a enfermaria dos Hospitalários, o salão de armas Teutônico, o
//    laboratório da Rosa-Cruz e o salão das runas de Thule com a lareira e o barco. Só os irmãos entram; lá dentro estão
//    o líder do templo e os irmãos daquele reino, e o altar abre a janela do templo.
SECRET_SOC.thule = { name: 'Sociedade Thule', icon: '❄️', col: '#1e3a5a', cross: '#cfe8ff', mat: 'silver', lvl: 4, fame: 30,
  oath: 'Guardar as runas do norte e nunca revelar o caminho para Thule.', likes: ['beast', 'guardians', 'wolves', 'soc_net'], motto: 'Além do gelo, a ilha perdida.' };
KORDERS.thule = SECRET_SOC.thule;
{ const mi0 = KOrders.makeItems.bind(KOrders); KOrders.makeItems = function (k, d) { const r = mi0(k, d); for (const x of ['ko_tabard_' + k, 'ko_helm_' + k]) if (ITEMS[x]) ITEMS[x].key = x; return r; }; }
KOrders.makeItems('thule', SECRET_SOC.thule);
for (const k in ITEMS) if (ITEMS[k] && ITEMS[k].key !== k) ITEMS[k].key = k; // (os mantos e elmos novos com o próprio código)
if (typeof Commerce !== 'undefined') {
  Commerce.GUILDS.thule = { name: 'Sociedade Thule', icon: '❄️', trade: 'marinheiros, madeireiros e mineiros', ranks: ['sailor', 'lumber', 'miner'], biz: ['biz_shipyard', 'biz_mine'] };
  for (const k of ['crafts', 'healers']) if (Commerce.GUILDS[k]) Commerce.GUILDS[k].biz = Commerce.GUILDS[k].biz.filter(b => !['biz_shipyard', 'biz_mine'].includes(b));
}
SOC_LORE.thule = { ranks: ['Viajante', 'Guardião das Runas', 'Skald', 'Mestre de Thule'], temple: 'Salão das Runas', head: 'Mestre de Thule', member: 'irmão do norte',
  posts: { tesoureiro: 'Guardião do Ouro', orador: 'Skald', guarda: 'Sentinela do Gelo', secretario: 'Mestre das Runas' },
  custom: 'Reúnem-se à volta do fogo num salão de madeira, contam as sagas dos navegadores e guardam os mapas do caminho para a ilha de gelo.' };
Soc2.DUES.thule = 15;

// ---------------------------------------------------------------- interiores (um tema para cada sociedade)
const LODGE_ROOMS = {
  crafts:    { theme: 'stone',  items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['emblem', 6, -1, 2], ['pillar', 4, 2], ['pillar', 9, 2], ['candles', 5, 1, 1, 1, { light: 1 }], ['candles', 8, 1, 1, 1, { light: 1 }],
    ['carpet', 5, 3, 4, 5], ['pew', 1, 3, 3], ['pew', 1, 6, 3], ['pew', 10, 3, 3], ['pew', 10, 6, 3], ['desk', 0, 1, 2, 1], ['desk', 12, 1, 2, 1], ['lamp', 2, -1], ['lamp', 11, -1], ['banner', 0, -1], ['banner', 13, -1]] },
  smiths:    { theme: 'castle', items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['banner', 3, -1], ['banner', 6, -1], ['banner', 7, -1], ['banner', 10, -1], ['armor', 1, 0], ['armor', 12, 0], ['weaponrack', 0, 3, 1, 2], ['weaponrack', 13, 3, 1, 2],
    ['longtable', 5, 4, 4, 1], ['bench', 5, 3, 4], ['bench', 5, 5, 4], ['brazier', 4, 1, 1, 1, { light: 1 }], ['brazier', 9, 1, 1, 1, { light: 1 }], ['carpet', 6, 6, 2, 4], ['pillar', 2, 7], ['pillar', 11, 7]] },
  merchants: { theme: 'stone',  items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['emblem', 6, -1, 2], ['bookshelf', 0, 0, 2, 1], ['bookshelf', 2, 0, 2, 1], ['bookshelf', 10, 0, 2, 1], ['bookshelf', 12, 0, 2, 1],
    ['table', 5, 4, 4, 2], ['stool', 4, 4], ['stool', 9, 4], ['stool', 4, 5], ['stool', 9, 5], ['candles', 5, 1, 1, 1, { light: 1 }], ['candles', 8, 1, 1, 1, { light: 1 }], ['desk', 0, 6, 2, 1], ['desk', 12, 6, 2, 1], ['rug', 5, 7, 4, 2], ['lamp', 3, -1], ['lamp', 10, -1]] },
  weavers:   { theme: 'chapel', items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['stained', 2, -1], ['stained', 6, -1, 2], ['stained', 11, -1], ['candles', 4, 1, 1, 1, { light: 1 }], ['candles', 9, 1, 1, 1, { light: 1 }], ['angel', 1, 1], ['angel', 12, 1],
    ['mausoleum', 0, 6, 2, 2], ['mausoleum', 12, 6, 2, 2], ['cembook', 6, 4, 2, 1], ['carpet', 6, 5, 2, 5], ['pew', 2, 4, 3], ['pew', 9, 4, 3], ['pew', 2, 7, 3], ['pew', 9, 7, 3]] },
  victuals:  { theme: 'wood',   items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['banner', 5, -1], ['banner', 8, -1], ['bed', 0, 2, 1, 2], ['bed', 0, 5, 1, 2], ['bed', 13, 2, 1, 2], ['bed', 13, 5, 1, 2],
    ['longtable', 4, 4, 6, 1], ['bench', 4, 3, 6], ['bench', 4, 5, 6], ['hearth', 6, 8, 2, 1, { light: 1 }], ['kegs', 11, 8], ['barrel', 2, 8], ['candles', 4, 1, 1, 1, { light: 1 }], ['candles', 9, 1, 1, 1, { light: 1 }]] },
  hunters:   { theme: 'castle', items: [['throne', 6, 0, 2, 1, { act: 'lodge' }], ['banner', 2, -1], ['banner', 5, -1], ['banner', 8, -1], ['banner', 11, -1], ['armor', 0, 0], ['armor', 13, 0], ['weaponrack', 0, 2, 1, 2], ['weaponrack', 13, 2, 1, 2],
    ['brazier', 4, 1, 1, 1, { light: 1 }], ['brazier', 9, 1, 1, 1, { light: 1 }], ['carpet', 6, 1, 2, 9], ['longtable', 2, 6, 3, 1], ['longtable', 9, 6, 3, 1], ['pillar', 3, 3], ['pillar', 10, 3]] },
  healers:   { theme: 'chapel', items: [['altar', 6, 1, 2, 1, { act: 'lodge' }], ['flowerbed', 6, 3, 2, 1], ['bookshelf', 0, 0, 2, 1], ['bookshelf', 12, 0, 2, 1], ['furnace', 0, 6, 2, 1, { light: 1 }], ['desk', 12, 6, 2, 1],
    ['table', 5, 5, 4, 2], ['candles', 4, 1, 1, 1, { light: 1 }], ['candles', 9, 1, 1, 1, { light: 1 }], ['plant', 3, 0], ['plant', 10, 0], ['plant', 0, 9], ['plant', 13, 9], ['stained', 6, -1, 2], ['rug', 5, 8, 4, 1]] },
  thule:     { theme: 'wood',   items: [['throne', 6, 0, 2, 1, { act: 'lodge' }], ['fireplace', 6, 4, 2, 1, { light: 1 }], ['rug', 5, 5, 4, 2], ['bench', 3, 4, 2], ['bench', 9, 4, 2], ['longtable', 1, 7, 4, 1], ['longtable', 9, 7, 4, 1],
    ['logs', 0, 0], ['logs', 13, 0], ['anchor', 0, 3], ['rowboat', 11, 1, 2, 2], ['banner', 3, -1], ['banner', 10, -1], ['brazier', 4, 1, 1, 1, { light: 1 }], ['brazier', 9, 1, 1, 1, { light: 1 }]] },
};
for (const [k, R] of Object.entries(LODGE_ROOMS)) LAYOUTS['lodge_' + k] = () => ({ w: 14, h: 10, items: R.items, keeper: [6.5, 2.2], staff: [[3, 2.5], [10.5, 2.5]], wander: [[3, 5], [10, 5], [4, 8], [9, 8], [6, 7.5], [8, 7.5]] });
ROOM_TYPES.soc_lodge = { lay: 'lodge_crafts', theme: 'stone', name: s => Lodges.name(s.soc, s.owner) };

const SocX = {
  // estrada em volta do templo, ligada à estrada mais próxima (uma vez por templo)
  road(s) {
    const C = CastleRoads, S = C.S(), key = 'lodge@' + s.x + ',' + s.y; if (S[key]) return; S[key] = 1;
    const ring = new Set();
    for (let j = s.y - 1; j <= s.y + s.h; j++) for (let i = s.x - 1; i <= s.x + s.w; i++) {
      if (j !== s.y - 1 && j !== s.y + s.h && i !== s.x - 1 && i !== s.x + s.w) continue;
      if (C.carve(i, j) || (World.inb(i, j) && World.tiles[World.idx(i, j)] === T.ROAD)) ring.add(World.idx(i, j));
    }
    if (ring.size) C.link([...ring], ring);
    World.touchArea(s.x - 30, s.y - 30, s.w + 60, s.h + 60);
  },
  // os templos que faltam (a Thule nos jogos salvos) e as estradas
  ensure() {
    const L = Lodges.L(), keys = Object.keys(SECRET_SOC);
    for (const c of G.civs) {
      if (!c || c.dead || !World.capitals[c.id]) continue;
      const taken = L.list.filter(x => x.ci === c.id).map(x => ({ x: x.x, y: x.y }));
      for (const [ki, k] of keys.entries()) {
        if (L.list.some(x => x.k === k && x.ci === c.id)) continue;
        const p = Lodges.spread(c.id, taken) || Lodges.spot(c.id, ki); if (!p) continue;
        taken.push(p); World.freeArea(p.x, p.y, 3, 3); L.list.push({ k, ci: c.id, x: p.x, y: p.y }); World.addStruct('soc_lodge', p.x, p.y, 3, 3, c.id, { soc: k });
      }
    }
    for (const x of L.list) { const s = Lodges.struct(x.k, x.ci); if (s) this.road(s); }
  },
};

{
  // só os irmãos entram no templo; lá dentro, o tema da sociedade
  const df0 = Places.def.bind(Places);
  Places.def = function (s) {
    if (s && s.type === 'soc_lodge') { if (Secret.key() !== s.soc) return null; const R = LODGE_ROOMS[s.soc] || LODGE_ROOMS.crafts; return { lay: 'lodge_' + (LODGE_ROOMS[s.soc] ? s.soc : 'crafts'), theme: R.theme, name: () => Lodges.name(s.soc, s.owner) }; }
    return df0(s);
  };
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) { if (f && f.act === 'lodge') { const s = G.place && G.place.src; return s ? `${SocLore.of(s.soc).head} — o templo: reunião, irmãos e a loja` : 'O templo'; } return fl0(f); };
  const us0 = Places.use.bind(Places);
  Places.use = function (f) { if (f && f.act === 'lodge') { const s = G.place && G.place.src; if (s) Lodges.show(s.id); return; } return us0(f); };
  // lá dentro: o líder do templo no altar e os irmãos daquele reino
  const pe0 = Places.people.bind(Places);
  Places.people = function (src, d, L) {
    pe0(src, d, L);
    if (!src || src.type !== 'soc_lodge') return;
    const P0 = G.place, ci = src.owner, at = ([x, y]) => [(P0.fx0 + x + 0.5) * TILE, (P0.fy0 + y + 0.85) * TILE];
    const put = (p, spot, still) => { if (!p || G.spawned.has(p.id)) return; const [x, y] = at(spot), e = Game.spawn('villager', x, y, { civ: ci, npc: p, leash: still ? 0.4 : 1.6 }); e.placeNpc = true; if (still) e.still = true; G.spawned.set(p.id, e); };
    const h = Lodges.head(src.soc, ci); if (h && h !== 'player') put(h, L.keeper, true);
    Lodges.brothersIn(src.soc, ci).filter(p => p !== h && p.alive && p.age >= 16 && !p.capanga && !(p.jail > G.day)).slice(0, L.wander.length).forEach((p, k) => put(p, L.wander[k], false));
  };
  // ao começar e ao carregar: os templos da Thule e as estradas
  const run = () => { try { SocX.ensure(); SocLore.sync(); } catch (e) { console.error(e); } };
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') run(); return r; };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') run(); return r; };
  // o rótulo: irmão entra; quem não é fala com o líder na porta
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s && s.type === 'soc_lodge') return `${Lodges.name(s.soc, s.owner)} — ${Secret.key() === s.soc ? 'Entrar' : `só irmãos · falar com o ${SocLore.of(s.soc).head}`}`; return il0(s); };
}
