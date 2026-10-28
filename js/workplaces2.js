'use strict';
// Interior e responsável para as construções novas (as suas e as obras das vilas). Cada prédio ganha o lado de dentro,
// uma pessoa de verdade que cuida dele (sempre alguém do povo, com o ofício do lugar) e uma loja com o que tem a ver
// com o prédio: a vidraria vende vidro e frascos, o açougue vende carne, a casa da moeda vende lingotes...
// Os prédios que já têm uma função própria (depósitos, capela, observatório, posto de muda) continuam fazendo isso no
// balcão; aí o responsável vende pela conversa ("Negociar").
// Ficam de fora o que é ao ar livre ou enfeite (campos, pomares, cercas, estátuas, poços, bancas) e as casas dos moradores.

// ofícios novos: [masculino, feminino, cor da roupa, roupa do ofício]
const WP2_RANKS = {
  founder: ['Fundidor', 'Fundidora', '#6a4a3a', 'apron_leather'], glazier: ['Vidreiro', 'Vidreira', '#4a7a8a', 'apron_leather'],
  dyer: ['Tintureiro', 'Tintureira', '#7a3a6a', 'apron_white'], mage: ['Mago', 'Maga', '#3a2a6a', 'robe'],
  astronomer: ['Astrônomo', 'Astrônoma', '#2a3a5a', 'scholar'], storekeeper: ['Almoxarife', 'Almoxarife', '#6a5a4a', 'apron_leather'],
  engineer: ['Engenheiro', 'Engenheira', '#5a5a4a', 'apron_leather'], rancher: ['Rancheiro', 'Rancheira', '#7a5a3a', 'fur'],
  washer: ['Lavadeiro', 'Lavadeira', '#7a9ab0', 'apron_white'], basketmaker: ['Cesteiro', 'Cesteira', '#9a7a4a', 'patched'],
  fisher: ['Pescador', 'Pescadora', '#3a5a7a', 'sailor'], cobbler: ['Sapateiro', 'Sapateira', '#6a4a2a', 'apron_leather'],
  charcoaler: ['Carvoeiro', 'Carvoeira', '#3a3a3a', 'patched'], butcher: ['Açougueiro', 'Açougueira', '#8a3a3a', 'apron_white'],
  fishmonger: ['Peixeiro', 'Peixeira', '#4a6a8a', 'apron_white'], cheesemaker: ['Queijeiro', 'Queijeira', '#c8b070', 'apron_white'],
  courier: ['Carteiro', 'Carteira', '#5a4a7a', 'coat'], pawnbroker: ['Penhorista', 'Penhorista', '#5a4a2a', 'coat'],
  artisan: ['Artesão', 'Artesã', '#8a6a4a', 'apron_leather'], clerk: ['Escrivão', 'Escrivã', '#3a3a5a', 'scholar'],
  guildmaster: ['Mestre da Guilda', 'Mestra da Guilda', '#6a2a2a', 'coat'], minter: ['Moedeiro', 'Moedeira', '#8a7a3a', 'apron_leather'],
  monk: ['Monge', 'Monja', '#4a3a2a', 'robe'], scholar: ['Erudito', 'Erudita', '#2a2a4a', 'scholar'], sacristan: ['Sacristão', 'Sacristã', '#2a2a34', 'robe'],
};
// prédio → [ofício, planta, tema, de quem é, loja, ícone, nome da loja, o que vende, usa a ação de fora no balcão]
const WP2 = {
  // ---- as suas construções
  smelter:        ['founder', 'w_smithy', 'stone', 'player', '⚒️', 'Fundição', ['iron_bar', 'bronze_bar', 'brass_bar', 'pewter_bar', 'electrum_bar', 'steel_bar', 'chain_links', 'quicklime', 'coal']],
  glassworks:     ['glazier', 'pottery', 'stone', 'player', '🔷', 'Vidraria', ['glass', 'vial', 'lens', 'lantern', 'oil_lamp', 'spyglass', 'silver_mirror', 'stained_glass', 'sand']],
  dyeworks:       ['dyer', 'w_weaver', 'wood', 'player', '🎨', 'Tinturaria', ['dye_red', 'dye_blue', 'dye_yellow', 'red_cloth', 'blue_cloth', 'felt', 'ink', 'painting']],
  winepress:      ['vintner', 'cellar', 'stone', 'player', '🍇', 'Lagar', ['olive_oil', 'grape_juice', 'wine', 'brandy', 'mulled_wine', 'grape', 'olive']],
  biz_winery:     ['vintner', 'cellar', 'stone', 'player', '🍷', 'Vinícola', ['wine', 'aged_wine', 'grape', 'grape_juice', 'brandy', 'cask']],
  sawmill_p:      ['sawyer', 'w_lumber', 'wood', 'player', '🪚', 'Serraria', ['plank', 'beam', 'pitch', 'paper', 'crossbow', 'bolt', 'lute', 'toy_horse', 'wood_shield']],
  mage_tower:     ['mage', 'tower', 'stone', 'player', '🔮', 'Torre do Mago', ['scroll_fireball', 'scroll_heal', 'scroll_recall', 'scroll_haste', 'scroll_shield', 'apprentice_staff', 'arcane_wand', 'orb', 'tome', 'wizard_hat', 'mage_robe', 'runestone']],
  silkhouse:      ['weaver', 'w_weaver', 'wood', 'player', '🐛', 'Sirgaria', ['silk_cocoon', 'silk_thread', 'silk_cloth', 'silk_hood', 'scarf']],
  biz_ranch:      ['rancher', 'stable', 'wood', 'player', '🐄', 'Rancho', ['meat', 'wool', 'milk', 'leather', 'cheese', 'butter', 'saddle', 'rope']],
  war_stable:     ['groom', 'stable', 'wood', 'player', '🐎', 'Estábulo de Guerra', ['saddle', 'horsehair', 'rope', 'leather', 'barley', 'apple', 'carrot']],
  siege_workshop: ['engineer', 'w_lumber', 'wood', 'player', '🏹', 'Oficina de Cerco', ['ram', 'catapult', 'beam', 'rope', 'nails', 'chain_links', 'pitch']],
  windmill:       ['miller', 'w_mill', 'wood', 'player', '🌬️', 'Moinho de Vento', ['flour', 'wheat', 'barley', 'bread', 'rye_bread', 'wheat_seed']],
  granary_p:      ['granger', 'granary', 'wood', 'player', '🌾', 'Celeiro', ['wheat', 'barley', 'flour', 'carrot', 'cabbage', 'apple', 'wheat_seed', 'barley_seed'], true],
  warehouse:      ['storekeeper', 'granary', 'wood', 'player', '📦', 'Armazém Grande', ['rope', 'nails', 'plank', 'cask', 'leather_bag', 'torch', 'salt', 'cloth'], true],
  icehouse:       ['storekeeper', 'cellar', 'stone', 'player', '🧊', 'Casa de Gelo', ['ice', 'salted_meat', 'salted_fish', 'smoked_meat', 'cheese', 'butter'], true],
  chapel_p:       ['caretaker', 'chapel', 'chapel', 'player', '🕯️', 'Capela', ['candle', 'incense', 'holy_water', 'rosary', 'relic'], true],
  observatory:    ['astronomer', 'tower', 'stone', 'player', '🔭', 'Observatório', ['spyglass', 'lens', 'compass', 'treasure_map', 'parchment', 'ink', 'book'], true],
  relay:          ['groom', 'stable', 'wood', 'player', '🐴', 'Posto de Muda', ['saddle', 'rope', 'barley', 'apple', 'carrot', 'leather'], true],
  // ---- as obras das vilas
  vlaundry:   ['washer', 'bath', 'stone', 'npc', '🧺', 'Lavanderia', ['soap', 'linen_cloth', 'cloth', 'wool_cloth', 'scarf', 'linen_tunic']],
  vbasket:    ['basketmaker', 'w_weaver', 'wood', 'npc', '🧺', 'Cestaria', ['reed_basket', 'reed', 'rope', 'fiber', 'leather_bag']],
  voven:      ['baker', 'w_bakery', 'wood', 'npc', '🔥', 'Forno Comunitário', ['bread', 'rye_bread', 'sweet_roll', 'biscuit', 'garlic_bread', 'meat_pie', 'apple_pie', 'flour']],
  vfishery:   ['fisher', 'w_shop', 'wood', 'npc', '🎣', 'Pesqueiro', ['trout', 'carp', 'sardine', 'cod', 'mussels', 'fishing_rod', 'fishing_net', 'fish_oil']],
  vshoe:      ['cobbler', 'w_shop', 'wood', 'npc', '👞', 'Sapataria', ['leather_boots', 'fur_boots', 'rabbit_boots', 'noble_shoes', 'leather', 'hard_leather']],
  vcharcoal:  ['charcoaler', 'smoke', 'wood', 'npc', '⚫', 'Carvoaria', ['coal', 'wood', 'pitch', 'torch', 'peat']],
  vbutcher:   ['butcher', 'smoke', 'wood', 'npc', '🥩', 'Açougue', ['meat', 'ham', 'bacon', 'sausage', 'smoked_meat', 'salted_meat', 'rabbit_meat', 'venison', 'duck_meat']],
  vfishshop:  ['fishmonger', 'w_shop', 'wood', 'npc', '🐟', 'Peixaria', ['trout', 'carp', 'sardine', 'cod', 'salted_fish', 'smoked_fish', 'mussels', 'cooked_fish']],
  vpotter:    ['potter', 'pottery', 'stone', 'npc', '🏺', 'Olaria', ['clay_pot', 'glazed_vase', 'brick', 'roof_tile', 'clay']],
  vcheese:    ['cheesemaker', 'cellar', 'stone', 'npc', '🧀', 'Queijaria', ['cheese', 'goat_cheese', 'butter', 'curd', 'milk', 'goat_milk', 'goat_yogurt']],
  vinn2:      ['innkeeper', 'w_inn', 'wood', 'npc', '🛏️', 'Pousada', ['beer', 'mead', 'wine', 'cider', 'stew', 'bread', 'cooked_meat', 'cheese']],
  vpost:      ['courier', 'w_shop', 'wood', 'npc', '✉️', 'Correio', ['parchment', 'paper', 'ink', 'candle', 'treasure_map', 'compass']],
  vguard:     ['sergeant', 'barracks', 'stone', 'npc', '🛡️', 'Posto da Guarda', ['arrow', 'iron_arrow', 'torch', 'rope', 'iron_spear', 'wood_shield', 'leather_cap', 'gambeson']],
  vorphan:    ['caretaker', 'school', 'wood', 'npc', '🧸', 'Orfanato', ['rag_doll', 'toy_horse', 'flute', 'dice', 'bread', 'candied_apple']],
  vpawn:      ['pawnbroker', 'w_shop', 'wood', 'npc', '💍', 'Casa de Penhores', ['silver_ring', 'gold_ring', 'gem_ring', 'silver_brooch', 'ancient_coin', 'pearl_necklace', 'amber_amulet', 'lucky_charm']],
  vinfirm:    ['healer', 'clinic', 'wood', 'npc', '🩹', 'Enfermaria', ['herbal_salve', 'healing_potion', 'greater_healing', 'antidote', 'herbal_tea', 'herb', 'tonic']],
  vcraft:     ['artisan', 'w_lumber', 'wood', 'npc', '🛠️', 'Oficina dos Artesãos', ['wooden_chair', 'cask', 'leather_bag', 'lute', 'flute', 'chess_set', 'toy_horse', 'carpenter_hammer', 'saw']],
  vhall:      ['clerk', 'school', 'wood', 'npc', '🏛️', 'Prefeitura', ['parchment', 'ink', 'book', 'candle', 'paper']],
  vguild:     ['guildmaster', 'school', 'wood', 'npc', '⚜️', 'Guilda', ['tongs', 'saw', 'carpenter_hammer', 'pitchfork', 'sickle', 'shears', 'bellows', 'pestle']],
  vmint:      ['minter', 'w_smithy', 'stone', 'npc', '🪙', 'Casa da Moeda', ['silver_bar', 'gold_bar', 'electrum_bar', 'ancient_coin', 'gold_thread']],
  vhmarket:   ['trader', 'w_shop', 'wood', 'npc', '🏬', 'Mercado Coberto', ['spices', 'salt', 'silk_cloth', 'wine', 'olive_oil', 'honey', 'cheese', 'dates', 'amber', 'perfume']],
  vthermae:   ['bather', 'bath', 'stone', 'npc', '🧖', 'Termas', ['soap', 'perfume', 'herbal_tea', 'lavender', 'rose_petals', 'cloth']],
  vmonastery: ['monk', 'chapel', 'chapel', 'npc', '⛪', 'Mosteiro', ['book', 'tome', 'candle', 'incense', 'mead', 'honey', 'herbal_tea', 'rosary']],
  vuniv:      ['scholar', 'school', 'stone', 'npc', '🎓', 'Universidade', ['book', 'tome', 'parchment', 'ink', 'lens', 'compass', 'wisdom_potion']],
  vcathedral: ['sacristan', 'chapel', 'chapel', 'npc', '⛪', 'Catedral', ['candle', 'incense', 'holy_water', 'rosary', 'relic', 'stained_glass']],
};

{
  for (const [k, [m, f, col, outfit]] of Object.entries(WP2_RANKS)) {
    if (!RANKS[k]) RANKS[k] = { m, f, order: 6 };
    if (!RANK_LOOK[k]) RANK_LOOK[k] = col;
    if (!PEOPLE_OUTFIT[k]) PEOPLE_OUTFIT[k] = outfit;
  }
  const shopOf = {};
  for (const [type, [rank, lay, theme, owner, icon, name, list, orig]] of Object.entries(WP2)) {
    // planta, responsável e de quem é (tabela das plantas em workplaces.js)
    WORKPLACES[type] = [rank, lay, theme, owner, !!orig];
    SHOP_KEEPER[type] = rank;
    // a loja do prédio: só o que existe no jogo
    // do mais barato ao mais caro, como todas as lojas do jogo (Order, em order.js)
    const key = 'wp_' + type, sells = list.filter(i => ITEMS[i]).sort((x, y) => Order.itemValue(x) - Order.itemValue(y));
    SHOPS[key] = { name, icon, rank, sells, buys: it => !!it && sells.includes(it.key) };
    if (RANKS[rank] && !RANKS[rank].shop) RANKS[rank].shop = key;
    if (!People.PURSE[rank]) People.PURSE[rank] = [180, 520];
    shopOf[type] = { key, orig: !!orig };
  }
  // no balcão: o responsável negocia (menos nos prédios com função própria, que fazem o que sempre fizeram)
  const so0 = Work.shopOf;
  Work.shopOf = s => so0(s) || (s && shopOf[s.type] && !shopOf[s.type].orig && Work.spec(s) ? shopOf[s.type].key : null);
  // na conversa, "Negociar" abre a loja do prédio de quem cuida dele (cada um vende o do próprio lugar)
  const ta0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const p = d && d.op === 'shopnpc' ? People.get(+d.id) : null, s = p && p.shop && Shops.byKey(p.shop), sk = s && shopOf[s.type];
    if (sk) { this.showShop(sk.key, Work.vi(s), p.id); return; }
    return ta0(d);
  };
}
