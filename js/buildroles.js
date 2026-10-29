'use strict';
// O que cada categoria de construção faz (menu Construção):
//  • 🔨 Produção: interação direta, sem lado de dentro e sem responsável — só fabricar. A ficha da construção mostra,
//    embaixo do custo, tudo o que ela pode produzir.
//  • 🐄 Fazenda e animais: interação direta, sem lado de dentro. Ao interagir abre a loja do responsável (compra e venda
//    do que o imóvel produz) e, na mesma janela, o que já se fazia lá (colher, recolher, comprar animais). O responsável
//    não fica parado na frente: anda livre pelo mapa, como qualquer morador.
//  • 💼 Empreendimentos, ⛲ Praça e decoração, 📦 Baús e estábulo: como sempre foram.
//  • 📚 Cultura, fé e treino: lado de dentro, responsável e loja; o que cada um já fazia continua lá dentro.
//  • 🛡️ Defesa e exército: saem do seu menu e vão para as Obras (a janela só aparece para governador ou rei),
//    com os mesmos interiores, fabricação e lojas.
//  • 🛣️ Infraestrutura: saem o Atracadouro, o Guindaste de Obra e o Moinho de Vento.
//  • 🏗️ Obras nas vilas: todo prédio tem lado de dentro, responsável e loja do que ele é (ficam ao ar livre a muralha,
//    o portão, o poço, as plantações, os enfeites e as casas dos moradores). O portão se emenda no muro, e a Estrebaria
//    vende cavalos, carroças e o que eles usam.
const BR = {
  PROD: ['campfire', 'workbench', 'carpentry', 'forge', 'oven', 'brewery', 'smokehouse', 'loom', 'kiln', 'tanrack', 'alchemy'],
  FARM: ['farm', 'garden', 'orchard', 'flaxfield', 'herbgarden', 'mushroom', 'coop', 'pen', 'pigsty', 'dovecote', 'fishpond', 'beehive'],
  CULT: ['library', 'oratory', 'training', 'archery', 'stage', 'watchtower'],
  DEF: ['barracks', 'archer_tower', 'armory', 'spikes', 'wall_wood', 'wall_stone'],
  PRACA: ['well_p', 'fountain', 'statue', 'lamppost', 'bench', 'pergola', 'sundial', 'flagpole_p', 'flowerbed', 'hedge', 'fence'],
  // repetidas com as obras da vila (fica a da vila): poço, chafariz, estátua, lampião, torre de vigia e capela
  DUP: ['well_p', 'fountain', 'statue', 'lamppost', 'watchtower', 'chapel_p'],
  INFRA_OUT: ['crane', 'windmill', 'dock', 'sewer', 'cistern'],
  // fora do menu (as que você já construiu continuam funcionando)
  OUT: ['hut', 'tent', 'treehouse', 'longhouse', 'stonetower', 'villa', 'big_chest', 'granary_p', 'icehouse'],
};
for (const [k, c] of [['PROD', 'producao'], ['FARM', 'fazenda'], ['CULT', 'cultura'], ['DEF', 'defesa'], ['PRACA', 'praca']]) BR[k] = BR[k].concat((UI.expCats && UI.expCats[c]) || []).filter(t => BUILDINGS[t]);

// ofícios novos
Object.assign(RANKS, {
  farmer: { m: 'Lavrador', f: 'Lavradora', order: 6 }, landlord: { m: 'Senhorio', f: 'Senhoria', order: 6 }, minstrel: { m: 'Menestrel', f: 'Menestrel', order: 6 }, herald: { m: 'Arauto', f: 'Arauta', order: 6 },
});
Object.assign(RANK_LOOK, { landlord: '#6a5a3a', farmer: '#7a8a3a', minstrel: '#8a3a6a', herald: '#6a2a2a' });
if (typeof PEOPLE_OUTFIT !== 'undefined') Object.assign(PEOPLE_OUTFIT, { farmer: PEOPLE_OUTFIT.farmer || 'patched', minstrel: PEOPLE_OUTFIT.minstrel || 'coat', landlord: PEOPLE_OUTFIT.landlord || 'coat', herald: PEOPLE_OUTFIT.herald || 'coat' });

// lojas: prédio → [ícone, nome, ofício, o que vende]
const BR_SHOPS = {
  // fazenda e animais (o responsável vende o que o imóvel produz)
  farm:        ['🌾', 'Fazenda', 'farmer', ['wheat', 'barley', 'flour', 'wheat_seed', 'barley_seed']],
  garden:      ['🥕', 'Horta', 'farmer', ['carrot', 'cabbage', 'onion', 'garlic', 'carrot_seed', 'cabbage_seed']],
  orchard:     ['🍎', 'Pomar', 'farmer', ['apple', 'pear', 'cherry', 'apple_pie', 'cider']],
  flaxfield:   ['🧵', 'Linhal', 'farmer', ['fiber', 'rope', 'cloth', 'linen_cloth']],
  herbgarden:  ['🌿', 'Canteiro de Ervas', 'farmer', ['herb', 'herbal_salve', 'herbal_tea', 'lavender']],
  mushroom:    ['🍄', 'Cogumelal', 'farmer', ['mushroom', 'mushroom_soup']],
  coop:        ['🐔', 'Galinheiro', 'keeperA', ['egg', 'feather', 'chicken', 'cooked_chicken']],
  pen:         ['🐄', 'Curral', 'keeperA', ['milk', 'wool', 'cheese', 'butter', 'leather', 'meat']],
  pigsty:      ['🐖', 'Chiqueiro', 'keeperA', ['meat', 'leather', 'bacon', 'ham', 'sausage']],
  dovecote:    ['🕊️', 'Pombal', 'keeperA', ['feather', 'egg']],
  fishpond:    ['🐟', 'Viveiro de Peixes', 'keeperA', ['carp', 'trout', 'cooked_fish']],
  beehive:     ['🐝', 'Colmeia', 'keeperA', ['honey', 'beeswax', 'candle', 'mead']],
  vineyard:    ['🍇', 'Vinhedo', 'farmer', ['grape', 'grape_juice', 'wine']],
  olivegrove:  ['🫒', 'Olival', 'farmer', ['olive', 'olive_oil']],
  goatpen:     ['🐐', 'Cabril', 'keeperA', ['goat_milk', 'goat_horn', 'goat_cheese', 'goat_yogurt']],
  silkhouse:   ['🐛', 'Sirgaria', 'keeperA', ['silk_cocoon', 'silk_thread', 'silk_cloth']],
  duckpond:    ['🦆', 'Lago dos Patos', 'keeperA', ['duck_egg', 'duck_meat', 'feather', 'roast_duck']],
  rabbithutch: ['🐇', 'Coelheira', 'keeperA', ['rabbit_meat', 'rabbit_hide', 'rabbit_stew']],
  hopfield:    ['🌱', 'Lupulal', 'farmer', ['hops', 'hop_ale', 'barley']],
  sunflowers:  ['🌻', 'Campo de Girassóis', 'farmer', ['sunflower', 'dye_yellow']],
  // cultura, fé e treino (as funções de sempre continuam lá dentro)
  library:     ['📚', 'Biblioteca', 'scholar', ['book', 'tome', 'parchment', 'paper', 'ink', 'candle']],
  oratory:     ['🙏', 'Oratório', 'monk', ['candle', 'incense', 'rosary', 'holy_water']],
  training:    ['⚔️', 'Campo de Treino', 'sergeant', ['wooden_sword', 'iron_sword', 'wood_shield', 'buckler', 'leather_cap', 'gambeson', 'iron_spear']],
  archery:     ['🎯', 'Estande de Tiro', 'archer', ['arrow', 'iron_arrow', 'short_bow', 'yew_bow', 'horn_bow', 'feather', 'bolt', 'crossbow']],
  stage:       ['🎭', 'Palco dos Menestréis', 'minstrel', ['lute', 'flute', 'war_drum', 'mead', 'wine', 'candied_apple']],
  watchtower:  ['🗼', 'Torre de Vigia', 'watchman', ['arrow', 'short_bow', 'torch', 'rope', 'leather', 'spyglass']],
  tiltyard:    ['🐎', 'Liça de Justa', 'herald', ['saddle', 'horsehair', 'iron_helm', 'wood_shield', 'iron_spear', 'banner']],
  stone_circle:['🗿', 'Círculo de Pedras', 'hermit', ['runestone', 'herb', 'candle', 'amber', 'lucky_charm', 'amber_amulet']],
  // obras das vilas que ainda não tinham lado de dentro
  vmarket:     ['🎪', 'Feira', 'trader', ['bread', 'cheese', 'apple', 'carrot', 'cloth', 'rope', 'salt', 'honey', 'wine', 'candle']],
  vorchard:    ['🍎', 'Pomar Comunitário', 'farmer', ['apple', 'pear', 'cherry', 'cider', 'apple_pie']],
  vpasture:    ['🐑', 'Pasto de Ovelhas', 'rancher', ['wool', 'milk', 'cheese', 'meat', 'leather', 'wool_cloth']],
  vapiary:     ['🐝', 'Apiário', 'keeperA', ['honey', 'beeswax', 'candle', 'mead']],
  vhens:       ['🐔', 'Galinheiro da Vila', 'keeperA', ['egg', 'feather', 'chicken']],
  vwood:       ['🪓', 'Lenhador da Vila', 'sawyer', ['wood', 'hardwood', 'plank', 'resin', 'coal']],
  vpigs:       ['🐖', 'Pocilga da Vila', 'keeperA', ['meat', 'bacon', 'ham', 'sausage', 'leather']],
  vspring:     ['💧', 'Fonte Sagrada', 'hermit', ['holy_water', 'herb', 'candle', 'herbal_tea']],
  vcattle:     ['🐂', 'Feira do Gado', 'rancher', ['meat', 'milk', 'leather', 'wool', 'cheese', 'butter', 'saddle']],
  chapel:      ['⛪', 'Capela', 'priest', ['candle', 'incense', 'holy_water', 'rosary']],
  vtenement:   ['🏘️', 'Casas de Aluguel', 'landlord', ['candle', 'bread', 'cloth', 'wool_cloth', 'rope', 'torch', 'plank', 'nails', 'roof_tile', 'clay']],
};
// lado de dentro de quem ainda não tinha: [planta, tema]
const BR_ROOMS = {
  training: ['barracks', 'wood'], archery: ['armory', 'wood'], stage: ['school', 'wood'], tiltyard: ['stable', 'wood'], stone_circle: ['shrine', 'stone'],
  library: ['school', 'wood'], oratory: ['shrine', 'chapel'],
  vmarket: ['w_shop', 'wood'], vorchard: ['granary', 'wood'], vpasture: ['stable', 'wood'], vapiary: ['cellar', 'wood'], vhens: ['coop', 'wood'],
  vwood: ['w_lumber', 'wood'], vpigs: ['stable', 'wood'], vspring: ['shrine', 'stone'], vcattle: ['stable', 'wood'],
  vtenement: ['w_inn', 'wood'],
};
// a Estrebaria da vila também vende o que os cavalos usam
const BR_STABLE_ITEMS = ['saddle', 'horsehair', 'horseshoe', 'rope', 'leather', 'wheat', 'barley', 'apple', 'carrot', 'hay'];
const BR_HORSE = 240, BR_CART = 170;

// as Obras nas vilas numa janela só, separadas por classe (o que não estiver aqui vai para Serviços).
// As suas de Praça, Cultura e Defesa entram nas classes delas (menos as repetidas com as da vila).
const OBRAS_CLASSES = [
  ['casa', '🏠', 'Moradia', ['c:vhouse', 'c:vtenement']],
  ['com', '🛒', 'Comércio', ['c:store', 'c:tavern', 'c:vinn', 'c:vinn2', 'c:vmarket', 'c:vhmarket', 'c:vtrade', 'c:vfishshop', 'c:vpawn', 'c:bank']],
  ['serv', '🏛️', 'Serviços', ['c:vpost', 'c:vclinic', 'c:vinfirm', 'c:vbath', 'c:vthermae', 'c:vlaundry', 'c:vorphan', 'c:vhall', 'c:vmint', 'c:port', 'c:cemetery']],
  ['prod', '🔨', 'Produção', ['c:smith', 'c:lumber', 'c:quarry', 'c:vbakery', 'c:voven', 'c:vmill', 'c:vsawmill', 'c:vmine', 'c:vweaver', 'c:vbrewery', 'c:vbasket', 'c:vcharcoal', 'c:vshoe', 'c:vbutcher', 'c:vpotter', 'c:vcheese', 'c:vfishery', 'c:vcraft', 'c:vguild']],
  ['faz', '🐄', 'Fazenda e animais', ['c:field', 'c:vgarden2', 'c:vapiary', 'c:vbarley', 'c:vflax', 'c:vorchard', 'c:vhens', 'c:vpasture', 'c:vwood', 'c:vpigs', 'c:vstable', 'c:vgranary', 'c:vcattle']],
  ['praca', '⛲', 'Praça e decoração', ['c:well', 'c:vlamp', 'c:vgarden', 'c:vfountain', 'c:vstatue', 'PRACA']],
  ['cult', '📚', 'Cultura e educação', ['c:vschool', 'c:vuniv', 'library', 'stage', 'observatory', 'c:arena']],
  ['fe', '⛪', 'Fé', ['c:chapel', 'c:vcross', 'c:vspring', 'c:vmonastery', 'c:vcathedral', 'oratory', 'stone_circle']],
  ['def', '🛡️', 'Defesa e treino', ['c:vgate', 'c:vtower', 'c:vguard', 'DEF', 'training', 'archery', 'tiltyard']],
];
// Produção, Fazenda e animais, Empreendimentos e Baús e estábulo também separados por classe (o que não estiver aqui vai para a última)
const BR_CLASSES = {
  producao: [
    ['coz', '🔥', 'Cozinha e bebidas', ['campfire', 'oven', 'smokehouse', 'quern', 'brewery', 'winepress']],
    ['mad', '🪵', 'Madeira e ferramentas', ['workbench', 'carpentry', 'sawmill_p']],
    ['met', '⚒️', 'Metais e armas', ['forge', 'smelter', 'armorer_bench', 'goldsmith']],
    ['tec', '🧵', 'Tecidos e couro', ['tanrack', 'loom', 'dyeworks']],
    ['bar', '🏺', 'Barro e vidro', ['kiln', 'glassworks']],
    ['mag', '🔮', 'Poções e magia', ['alchemy', 'mage_tower']],
  ],
  fazenda: [
    ['lav', '🌾', 'Lavouras', ['farm', 'garden', 'herbgarden', 'flaxfield', 'sunflowers', 'hopfield', 'mushroom']],
    ['pom', '🍇', 'Pomares e vinhas', ['orchard', 'olivegrove', 'vineyard']],
    ['ani', '🐄', 'Animais', ['coop', 'pen', 'pigsty', 'goatpen', 'rabbithutch', 'dovecote', 'duckpond']],
    ['esp', '🐝', 'Criações especiais', ['beehive', 'fishpond', 'silkhouse']],
  ],
  negocios: [
    ['cam', '🌾', 'Campo e criação', ['biz_farm', 'biz_ranch', 'biz_dairy', 'biz_winery', 'biz_press', 'biz_mill', 'biz_stables']],
    ['mat', '⛏️', 'Matérias-primas', ['biz_quarry', 'biz_lumber', 'biz_mine', 'biz_charcoal', 'biz_saltworks', 'biz_fishery', 'biz_mason']],
    ['com', '🍞', 'Comida e bebida', ['biz_bakery', 'biz_butcher', 'biz_brewery', 'biz_cooper']],
    ['ofi', '🔨', 'Ofícios', ['biz_ropery', 'biz_tannery', 'biz_weaver', 'biz_dyer', 'biz_cobbler', 'biz_tailor', 'biz_pottery', 'biz_carpentry', 'biz_bowyer', 'biz_glass', 'biz_chandler', 'biz_smithy', 'biz_smelter', 'biz_armorer', 'biz_jeweler', 'biz_shipyard']],
    ['srv', '🛒', 'Comércio e serviços', ['biz_shop', 'ptavern', 'biz_inn', 'biz_barber', 'biz_bathhouse', 'biz_bank', 'biz_apothecary', 'biz_perfumer', 'biz_scribe', 'biz_magic', 'biz_theatre']],
  ],
  guarda: [
    ['itens', '📦', 'Guardar itens', ['chest', 'warehouse', 'cellar']],
    ['ouro', '💰', 'Guardar ouro', ['vault']],
    ['bichos', '🐴', 'Animais e carga', ['stable', 'kennel', 'cartshed']],
  ],
};

const BuildRoles = {
  shopOf: {},
  // o nome da categoria das obras: no reino para o rei, na vila para o governador
  classesOf(cat) { return cat === 'obras' ? OBRAS_CLASSES : BR_CLASSES[cat] || null; },
  obrasName() { return G.civs.some(c => c.ruler === 'player') ? 'Obras no reino' : 'Obras na vila'; },
  isProd(t) { return BR.PROD.includes(t); },
  isFarm(t) { return BR.FARM.includes(t); },
  // o que uma construção de produção fabrica (pelas receitas das estações dela)
  products(t) {
    const st = Object.keys(STATIONS).filter(s => STATIONS[s].types.includes(t));
    const seen = new Set(), out = [];
    for (const r of RECIPES) if (st.includes(r.station) && ITEMS[r.out] && !seen.has(r.out)) { seen.add(r.out); out.push(r.out); }
    return out;
  },
  // quem cuida da construção de fazenda (anda livre pelo mapa)
  keeper(s) { return Shops.keeper(s); },
  // fazenda e animais: a loja do responsável + o que se fazia ali
  openFarm(s) {
    const sk = this.shopOf[s.type]; if (!sk) return false;
    Shops.ensure();
    const k = this.keeper(s);
    UI.sel.brFarm = s.id;
    if (k) UI.showShop(sk, Work.vi(s), k.id);
    else UI.open(`${SHOPS[sk].icon} ${SHOPS[sk].name}`, `<p class="muted">Ninguém está cuidando deste lugar agora. Um morador da vila mais perto assume logo.</p>${this.farmBar(s)}`, 'brFarm', [s.id]);
    return true;
  },
  farmBar(s) {
    const k = this.keeper(s);
    return `<div class="card br-farm"><div class="sec">${UI.esc(BUILDINGS[s.type] ? BUILDINGS[s.type].name : '')} <span>${k ? `responsável: ${UI.esc(People.full(k))} — anda pelo mapa, mas sempre atende aqui` : 'sem responsável'}</span></div>
      <div class="act-row"><button class="primary" data-act="brfarm" data-s="${s.id}">🧺 Cuidar do lugar (colher, recolher, animais)</button></div></div>`;
  },
};

{
  const has = list => list.filter(k => ITEMS[k]);
  // ---------------------------------------------------------------- produção: sem lado de dentro nem responsável
  for (const t of BR.PROD) { delete WORKPLACES[t]; delete SHOP_KEEPER[t]; }
  // ---------------------------------------------------------------- lojas novas
  for (const [type, [icon, name, rank, list]] of Object.entries(BR_SHOPS)) {
    const key = 'br_' + type, sells = has(list).sort((x, y) => Order.itemValue(x) - Order.itemValue(y));
    if (!sells.length) continue;
    SHOPS[key] = { name, icon, rank, sells, buys: it => !!it && sells.includes(it.key) };
    if (!People.PURSE[rank]) People.PURSE[rank] = [180, 520];
    if (RANKS[rank] && !RANKS[rank].shop) RANKS[rank].shop = key; // "Negociar" na conversa
    BuildRoles.shopOf[type] = key;
    SHOP_KEEPER[type] = rank;
  }
  // obras com responsável que ainda não abriam a loja dele: Observatório, Torre de Arqueiros e Quartel
  for (const t of ['observatory', 'archer_tower', 'barracks']) { const sk = SHOP_KEEPER[t] && RANKS[SHOP_KEEPER[t]] && RANKS[SHOP_KEEPER[t]].shop; if (sk && SHOPS[sk] && !BuildRoles.shopOf[t]) BuildRoles.shopOf[t] = sk; }
  // nas obras não se produz nada: o Estábulo de Guerra não rende mais crina (só os cavaleiros nas batalhas)
  if (typeof EXPB !== 'undefined' && EXPB.war_stable && EXPB.war_stable.fn) delete EXPB.war_stable.fn.farm;
  if (BUILDINGS.war_stable) BUILDINGS.war_stable.desc = BUILDINGS.war_stable.desc.replace(' e crina todo mês', '');
  // a Estrebaria (obra da vila) vende mais coisas de cavalo
  if (SHOPS.stable) for (const k of has(BR_STABLE_ITEMS)) if (!SHOPS.stable.sells.includes(k)) SHOPS.stable.sells.push(k);
  // ---------------------------------------------------------------- fazenda e animais: sem lado de dentro
  for (const t of BR.FARM) delete WORKPLACES[t];
  // ---------------------------------------------------------------- cultura e obras: lado de dentro + responsável
  for (const [t, [lay, theme]] of Object.entries(BR_ROOMS)) {
    const owner = CIVIC[t] || VWORKS[t] ? 'npc' : 'player';
    if (!WORKPLACES[t]) WORKPLACES[t] = [SHOP_KEEPER[t], lay, theme, owner, owner === 'player'];
  }
  // plantas próprias que não tinham lugar para o responsável (biblioteca, oratório, capela): ele fica perto da porta
  for (const lay of ['library', 'oratory', 'chapel']) {
    const f0 = LAYOUTS[lay]; if (typeof f0 !== 'function') continue;
    LAYOUTS[lay] = function (...a) { const L = f0.apply(this, a); if (L && !L.keeper) L.keeper = [Math.max(1, Math.floor(L.w / 2) - 2), Math.max(1, L.h - 2)]; return L; };
  }
  // a capela já tem o lado de dentro: o padre da vila é o responsável e vende pela conversa
  // ---------------------------------------------------------------- quem é loja
  const is0 = Shops.isShop.bind(Shops);
  Shops.isShop = function (s) {
    if (!s || s.removed || s.hidden) return false;
    if (BR.PROD.includes(s.type) && s.owner === 'player') return false;
    // fazenda (sua) e cultura (sua) sem planta própria: responsável da vila mais perto
    if (BuildRoles.shopOf[s.type] && s.owner === 'player' && !WORKPLACES[s.type]) return Work.vi(s) >= 0;
    if (s.type === 'chapel') return s.village !== undefined && Work.vi(s) >= 0;
    return is0(s);
  };
  // a fazenda tem nome (avisos, conversa), mas não tem lado de dentro
  const wd0 = Work.def.bind(Work);
  Work.def = function (s) {
    const d = wd0(s); if (d || !s || s.removed || s.hidden || s.owner !== 'player' || !BR.FARM.includes(s.type) || !BUILDINGS[s.type]) return d;
    return { outdoor: true, name: () => `${/a$/.test(BUILDINGS[s.type].name.split(' ')[0]) ? 'Sua' : 'Seu'} ${BUILDINGS[s.type].name}` };
  };
  const pd0 = Places.def.bind(Places);
  Places.def = function (s) { const d = pd0(s); return d && d.outdoor ? null : d; };
  // o responsável da fazenda não fica plantado na porta: anda livre (não tem "trabalho" para ir a pé)
  const wo0 = Shops.workOf.bind(Shops);
  Shops.workOf = function (p) { const s = wo0(p); return s && BR.FARM.includes(s.type) ? null : s; };
  // ---------------------------------------------------------------- a loja de cada prédio
  const so0 = Work.shopOf;
  Work.shopOf = s => (s && BuildRoles.shopOf[s.type] && !BR.FARM.includes(s.type) ? BuildRoles.shopOf[s.type] : null) || so0(s);
  // na conversa, "Negociar" abre a loja do prédio de quem cuida dele
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const p = d && d.op === 'shopnpc' ? People.get(+d.id) : null, s = p && p.shop && Shops.byKey(p.shop), sk = s && BuildRoles.shopOf[s.type];
    if (sk) { if (BR.FARM.includes(s.type)) UI.sel.brFarm = s.id; this.showShop(sk, Work.vi(s), p.id); return; }
    return ta0(d);
  };
  // ---------------------------------------------------------------- interagir com a fazenda: a loja (com o que se fazia ali)
  const us0 = Game.useStruct.bind(Game);
  BuildRoles.oldUse = us0;
  Game.useStruct = function (s) {
    if (s && s.owner === 'player' && BR.FARM.includes(s.type) && !G.place && BuildRoles.openFarm(s)) return;
    return us0(s);
  };
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showShop' && this.sel.brFarm !== undefined) {
      const s = World.structs[this.sel.brFarm];
      if (s && !s.removed && args && args[0] === BuildRoles.shopOf[s.type]) body = BuildRoles.farmBar(s) + body;
      else this.sel.brFarm = undefined;
    } else if (fn !== 'brFarm') this.sel.brFarm = undefined;
    // a Estrebaria vende cavalos e carroças
    if (fn === 'showShop' && args && args[0] === 'stable') {
      body = `<div class="card br-horse"><div class="sec">🐴 Cavalos e carroças</div><div class="act-row">
        <button class="primary" data-act="buyride" data-k="horse" data-p="${BR_HORSE}" ${!P.horse && P.gold >= BR_HORSE ? '' : 'disabled'}>🐴 ${P.horse ? 'Você já tem ' + this.esc(P.horse.name) : `Comprar um cavalo — ${BR_HORSE} 🪙`}</button>
        <button data-act="buyride" data-k="cart" data-p="${BR_CART}" ${P.horse && !P.cart && P.gold >= BR_CART ? '' : 'disabled'}>🛒 ${P.cart ? 'Você já tem uma carroça' : `Comprar uma carroça — ${BR_CART} 🪙`}</button>
        <button data-act="hsell" data-s="-1" ${P.horse && !Ride.stall() ? '' : 'disabled'}>💰 Vender ${P.horse ? this.esc(P.horse.name) : 'o cavalo'} — ${Ride.sellPrice()} 🪙</button></div>
        <small class="muted">${P.horse && Ride.stall() ? 'O seu cavalo está no seu estábulo: traga-o para vender aqui.' : 'Cavalo para montar (R) e carregar peso; a carroça carrega muito mais.'}</small></div>` + body;
    }
    return op0(title, body, fn, args, sub);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'brfarm') { const s = World.structs[+d.s]; UI.sel.brFarm = undefined; UI.close(); if (s) BuildRoles.oldUse(s); return; }
    return a0(a, d);
  };
  // ---------------------------------------------------------------- menu Construção
  const sb0 = UI.showBuild.bind(UI);
  UI.showBuild = function () {
    // a janela original só monta as categorias (sem abrir); depois: sai a Defesa do seu menu e a infraestrutura
    // retirada, e a Defesa entra nas Obras (onde você governa)
    const o1 = this.open, f1 = this.fitDetail, keep = [this.sel.bcat, this.sel.build]; let out = null;
    this.open = function (title, body, fn, args, sub) { out = [title, body, fn, args, sub]; }; this.fitDetail = () => {};
    try { sb0(); } finally { this.open = o1; this.fitDetail = f1; [this.sel.bcat, this.sel.build] = keep; }
    let cats = this.buildCats;
    const auth = Urban.hasAny();
    // Praça e decoração e Cultura, fé e treino também são obras da vila: saem da sua base e entram nas Obras
    const obras = cats.find(c => c[0] === 'obras');
    cats = cats.filter(c => !['defesa', 'praca', 'cultura', 'obras'].includes(c[0])).map(c => [c[0], c[1], c[2], c[3].filter(k => !BR.INFRA_OUT.includes(k) && !BR.OUT.includes(k))]);
    UI.buildClass = {};
    // Produção, Fazenda e animais e Empreendimentos: cada classe do mais fácil ao mais difícil
    for (const c of cats) {
      const cls = BR_CLASSES[c[0]]; if (!cls) continue;
      const of = x => (cls.find(q => q[3].includes(x)) || cls[cls.length - 1])[0];
      c[3] = cls.flatMap(([k]) => Order.sortBuild(c[3].filter(x => of(x) === k)));
      for (const x of c[3]) UI.buildClass[x] = of(x);
    }
    if (auth) {
      // uma categoria só (Obras nas vilas), com a lista em classes: cada classe do mais fácil ao mais difícil
      const civ = new Set(obras ? obras[3] : []), have = k => (k.startsWith('c:') ? civ.has(k) : !!BUILDINGS[k]) && !BR.DUP.includes(k), used = new Set(), list = [];
      const classes = OBRAS_CLASSES.map(([k, ic, name, keys]) => [k, ic, name, keys.flatMap(x => x === 'PRACA' ? BR.PRACA : x === 'DEF' ? BR.DEF : [x]).filter(have)]);
      for (const c of classes) c[3].forEach(x => used.add(x));
      const rest = [...civ].filter(x => !used.has(x) && have(x)); classes.find(c => c[0] === 'serv')[3].push(...rest);
      for (const [k, , , keys] of classes) for (const x of Order.sortBuild([...new Set(keys)])) { if (UI.buildClass[x]) continue; UI.buildClass[x] = k; list.push(x); }
      cats.push(['obras', '🏗️', BuildRoles.obrasName(), list]);
    }
    this.buildCats = cats;
    // a categoria escolhida saiu do menu (Defesa, Praça, Cultura ou Obras antigas): vai para onde a construção está agora
    const S = this.sel;
    if (!cats.some(c => c[0] === S.bcat)) { const w = cats.find(c => c[3].includes(S.build)); S.bcat = w ? w[0] : 'moradia'; }
    return BuildRoles.renderBuild(out);
  };
  // ficha da construção: o que a produção fabrica (embaixo do custo) e o que a fazenda vende
  const bd0 = UI.buildDetailHtml.bind(UI);
  UI.buildDetailHtml = function (k) {
    let h = bd0(k);
    const kcat = (UI.buildCats || []).find(c => c[3].includes(k)), kcl = kcat && BuildRoles.classesOf(kcat[0]), kd = kcl && UI.buildClass && kcl.find(x => x[0] === UI.buildClass[k]);
    if (kd) h = h.replace(`<div class="dt-cat">${kcat[2]}</div>`, `<div class="dt-cat">${kcat[2]} · ${kd[1]} ${kd[2]}</div>`);
    const chips = list => `<div class="chips br-prod">${list.slice(0, 24).map(i => `<span class="chip">${UI.ii(i)} ${ITEMS[i].name}</span>`).join('')}${list.length > 24 ? `<span class="chip">+${list.length - 24}</span>` : ''}</div>`;
    let extra = '';
    if (BR.PROD.includes(k)) { const p = BuildRoles.products(k); if (p.length) extra = `<div><div class="sec">🛠️ Pode produzir <span>${p.length} ${p.length === 1 ? 'item' : 'itens'}</span></div>${chips(p)}</div>`; }
    else if (BR.FARM.includes(k) && BuildRoles.shopOf[k]) extra = `<div><div class="sec">🧺 O responsável vende</div>${chips(SHOPS[BuildRoles.shopOf[k]].sells)}</div>`;
    if (!extra) return h;
    const at = h.indexOf('<small class="muted">Depois de clicar');
    return at >= 0 ? h.slice(0, at) + extra + h.slice(at) : h + extra;
  };
  // ---------------------------------------------------------------- o portão se emenda no muro
  const dw0 = World.drawWall.bind(World);
  World.drawWall = function (ctx, s, X, Y, stone) {
    if (!s || s.x === undefined) return dw0(ctx, s, X, Y, stone);
    const wa = this.wallAt;
    this.wallAt = function (x, y) { if (wa.call(this, x, y)) return true; const id = this.inb(x, y) ? this.sgrid[this.idx(x, y)] : -1, o = id >= 0 && this.structs[id]; return !!o && !o.removed && !o.hidden && o.type === 'vgate'; };
    try { return dw0(ctx, s, X, Y, stone); } finally { this.wallAt = wa; }
  };
}

// a janela de construção refeita com as categorias novas (a original monta as categorias e abre a janela)
BuildRoles.renderBuild = function (first) {
  const S = UI.sel, cats = UI.buildCats;
  const catOf = k => (cats.find(c => c[3].includes(k)) || cats[0])[0];
  if (!S.bcat || !cats.some(c => c[0] === S.bcat)) S.bcat = S.build ? catOf(S.build) : 'moradia';
  const cat = cats.find(c => c[0] === S.bcat);
  if (!S.build || !cat[3].includes(S.build)) S.build = cat[3][0];
  const costMini = cost => Object.entries(cost).map(([k, n]) => `<i class="${Inv.count(k) >= n ? 'ok' : 'bad'}">${UI.ii(k)}${n}</i>`).join('');
  // nas categorias com classes: o título de cada classe antes das construções dela
  let lastCls = null;
  const cls = BuildRoles.classesOf(cat[0]);
  const head = k => { const c = cls && UI.buildClass[k]; if (!c || c === lastCls) return ''; lastCls = c; const d = cls.find(x => x[0] === c); return d ? `<div class="grp">${d[1]} ${d[2]}</div>` : ''; };
  const rows = cat[3].map(k => head(k) + (() => {
    const b = UI.binfo(k), tool = !b.cost;
    const sub = tool ? b.sub : `${b.owned !== undefined ? (b.owned ? `você tem ${b.owned} · ` : '') : ''}<span class="bcost">${costMini(b.cost)}</span>`;
    return `<button class="rrow ${S.build === k ? 'on' : ''}" data-act="bsel" data-k="${k}"><span class="ri">${b.icon}</span>
      <span><b>${b.name}</b><small>${sub}</small></span><span class="rs ${tool || b.can ? 'ok' : 'mat'}">${tool ? 'Grátis' : b.can ? 'Disponível' : 'Falta material'}</span></button>`;
  })()).join('');
  UI.buildCatKey = S.bcat;
  const b = UI.binfo(S.build);
  const detail = `<div class="cdt-in">${UI.buildDetailHtml(S.build)}</div>
    <div class="act-row"><button class="primary" data-act="${BUILDINGS[S.build] ? 'build' : 'urban'}" data-k="${S.build}" ${b.can ? '' : 'disabled'}>${b.btn}</button></div>`;
  const ready = c => c[3].filter(k => { const x = UI.binfo(k); return x.cost && x.can; }).length;
  const vil = c => c[0] === 'infra' || c[0] === 'obras';
  const groups = [['Sua base', cats.filter(c => !vil(c)).map(c => [c[0], c[1], c[2], ready(c) ? '✓' + ready(c) : ''])], ['Estradas e vilas', cats.filter(vil).map(c => [c[0], c[1], c[2]])]];
  UI.open('Construção', `<div class="bld iconnav">${UI.navHtml(groups, S.bcat, 'bcat', `<div class="split"><div class="col"><div class="scroll" data-scroll="build">${rows}</div></div><div class="card detail bld-dt">${detail}</div></div>`)}</div>`,
    'showBuild', [], (first && first[4]) || 'Erga sua base, abra estradas e reforme as vilas');
  UI.fitDetail('.bld-dt', cat[3], k => UI.buildDetailHtml(k), S.bcat);
};
