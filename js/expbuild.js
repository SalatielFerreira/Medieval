'use strict';
// Expansão das construções: o dobro de opções em cada categoria do menu Construção.
// Moradia 15 · Produção 20 · Fazenda e animais 20 · Empreendimentos 45 · Praça e decoração 20 · Cultura, fé e treino 10
// Baús e estábulo 10 · Defesa e exército 10 · Infraestrutura 15.
// Cada construção tem uma função de verdade e conversa com o resto do jogo: moradias dão seguidores, aluguel e fama;
// oficinas abrem receitas novas; criações produzem matérias-primas todo mês; empreendimentos empregam moradores,
// vendem no balcão e enchem o caixa; praças e obras de infraestrutura aumentam o poder econômico da vila mais próxima
// (e o nível dela sobe) e a felicidade do reino; defesas atiram e atrasam inimigos; o estábulo de guerra e a oficina de
// cerco reforçam o exército.

RANKS.mage = { m: 'Mago', f: 'Maga', order: 5 };
RANKS.tailor = { m: 'Alfaiate', f: 'Costureira', order: 6 };
RANKS.glazier = { m: 'Vidreiro', f: 'Vidreira', order: 6 };
if (typeof RANK_LOOK !== 'undefined') Object.assign(RANK_LOOK, { mage: '#3a3a8a', tailor: '#8a4a6a', glazier: '#4a8aa0' });

// [chave, categoria, nome, largura, altura, sólida, custo, descrição, função, aparência]
const EXP_BUILDINGS = [
  // ---------------------------------------------------------------- moradia (+8)
  ['tent', 'moradia', 'Barraca de Viagem', 2, 2, true, { cloth: 6, wood: 6, rope: 2 }, 'Abrigo leve para salvar e dormir em qualquer canto do mapa.', { home: 0, rent: 4 }, { k: 'tent', c: '#c8b890', s: '#8e1f2a' }],
  ['treehouse', 'moradia', 'Casa na Árvore', 2, 2, true, { wood: 30, plank: 10, rope: 4 }, 'Lar no alto de um carvalho: salve, durma e veja longe. +1 seguidor.', { home: 1, rent: 10 }, { k: 'treehouse' }],
  ['longhouse', 'moradia', 'Casa Comprida', 4, 2, true, { wood: 50, stone: 10, plank: 10 }, 'Salão nórdico de madeira para a família e os seus homens. +3 seguidores.', { home: 3, rent: 22 }, { k: 'house', wall: '#7a5230', roof: '#4a5a2a', sign: '🛡️', long: true }],
  ['farmhouse', 'moradia', 'Casa de Fazenda', 3, 2, true, { wood: 35, stone: 15, plank: 6 }, 'Casa do campo: salve e durma. As suas criações num raio de 12 passos produzem 20% a mais. +1 seguidor.', { home: 1, rent: 16, farmAura: 0.2 }, { k: 'house', wall: '#e6dcc4', roof: '#a8553a', sign: '🌾' }],
  ['townhouse', 'moradia', 'Sobrado', 2, 3, true, { brick: 25, plank: 12, roof_tile: 10, glass: 2 }, 'Casa de dois andares na cidade: rende bom aluguel. +2 seguidores.', { home: 2, rent: 28 }, { k: 'house', wall: '#d8c8a8', roof: '#7a3a2a', sign: '🏘️', tall: true }],
  ['stonetower', 'moradia', 'Torre de Pedra', 2, 2, true, { stone_block: 30, plank: 8, iron_bar: 4 }, 'Torre residencial fortificada: salve, durma e vigie. +2 seguidores e +3 de fama.', { home: 2, rent: 20, fame: 3 }, { k: 'tower', wall: '#9a948a', roof: '#4a4a5a' }],
  ['mansion', 'moradia', 'Mansão', 4, 3, true, { brick: 50, marble_block: 6, plank: 20, glass: 6, roof_tile: 20 }, 'Residência de grande senhor: +4 seguidores, +8 de fama e aluguel alto.', { home: 4, rent: 45, fame: 8 }, { k: 'house', wall: '#efe6d2', roof: '#3a4a6a', sign: '🏛️', big: true }],
  ['palacete', 'moradia', 'Palacete', 5, 3, true, { marble_block: 20, brick: 40, glass: 12, gold_bar: 4, plank: 20 }, 'Um pequeno palácio de mármore: +6 seguidores, +15 de fama e o melhor aluguel do reino.', { home: 6, rent: 70, fame: 15 }, { k: 'house', wall: '#f4f0e6', roof: '#6a2a5a', sign: '👑', big: true, palace: true }],
  // ---------------------------------------------------------------- produção (+9)
  ['sawmill_p', 'producao', 'Serraria Manual', 3, 2, true, { wood: 30, iron_bar: 3, stone: 8 }, 'Piche, papel, bestas, virotes, alaúdes, brinquedos e escudos de madeira.', { station: 'serraria' }, { k: 'shed', wall: '#9a6a3a', roof: '#6a4a2a', sign: '🪚', logs: true }],
  ['smelter', 'producao', 'Fundição', 2, 2, true, { stone: 30, brick: 15, clay: 10, iron_bar: 2 }, 'Ligas e metais raros: latão, estanho-chumbo, eletro, mithril, correntes e cal.', { station: 'fundicao' }, { k: 'kiln', wall: '#8a7a70', fire: true, sign: '⚒️' }],
  ['glassworks', 'producao', 'Vidraria', 2, 2, true, { brick: 20, stone: 10, clay: 8 }, 'Vidro, frascos, lentes, lanternas, lunetas, espelhos e vitrais.', { station: 'vidraria' }, { k: 'kiln', wall: '#b8a890', fire: true, sign: '🔷', glass: true }],
  ['goldsmith', 'producao', 'Bancada de Ourives', 2, 1, true, { plank: 6, iron_bar: 2, silver_bar: 1 }, 'Colares, amuletos da sorte, bússolas, rosários, fios de ouro e relíquias.', { station: 'ourives' }, { k: 'bench', top: '#6a4a2a', items: ['#e8c040', '#c8d0d8', '#4ac8e0'] }],
  ['dyeworks', 'producao', 'Tinturaria', 3, 2, false, { wood: 20, clay: 8, plank: 6 }, 'Tintas, tecidos escarlate e anil, feltro, tinta de escrever e pinturas.', { station: 'tinturaria' }, { k: 'vats', colors: ['#c8302a', '#3a5ad0', '#e8c830'] }],
  ['winepress', 'producao', 'Lagar', 2, 2, true, { hardwood: 6, wood: 15, stone: 10, iron_bar: 2 }, 'Azeite, suco de uva, vinho, aguardente e vinho quente.', { station: 'lagar' }, { k: 'press' }],
  ['quern', 'producao', 'Moenda de Pedra', 2, 2, true, { stone: 25, wood: 10 }, 'Farinha, adubo de farinha de osso e sabão.', { station: 'moenda' }, { k: 'quern' }],
  ['mage_tower', 'producao', 'Torre do Mago', 2, 2, true, { stone_block: 30, glass: 4, runestone: 1, plank: 10 }, 'Pergaminhos de magia, cajados, varinhas, orbes, tomos e as vestes dos magos.', { station: 'arcano' }, { k: 'magetower' }],
  ['armorer_bench', 'producao', 'Oficina do Armeiro', 3, 2, true, { stone: 25, wood: 15, iron_bar: 8, leather: 4 }, 'Espadas longas, montantes, alabardas, armaduras de escamas, prata, mithril e dragão.', { station: 'armeiro' }, { k: 'shed', wall: '#8f8a80', roof: '#4a4a52', sign: '🛡️', anvil: true }],
  // ---------------------------------------------------------------- fazenda e animais (+8)
  ['vineyard', 'fazenda', 'Vinhedo', 3, 3, false, { wood: 20, rope: 6 }, 'Parreiras: uvas todo mês (menos no inverno).', { farm: { grape: 6 }, season: true }, { k: 'field', soil: '#6e4f2e', plant: '#4f8a36', fruit: '#6a2a7a', stakes: true }],
  ['olivegrove', 'fazenda', 'Olival', 3, 3, false, { wood: 15, stone: 6 }, 'Oliveiras: azeitonas todo mês (menos no inverno).', { farm: { olive: 5 }, season: true }, { k: 'grove', leaf: '#7a8a5a', fruit: '#4a5a1a' }],
  ['goatpen', 'fazenda', 'Cabril', 3, 2, false, { wood: 25, fiber: 4 }, 'Cabras: leite de cabra todo mês e, às vezes, chifres.', { farm: { goat_milk: 4, goat_horn: 0.3 } }, { k: 'pen', ground: '#8a7a50', animal: '#e8e0d0', horn: true }],
  ['silkhouse', 'fazenda', 'Sirgaria', 2, 2, true, { wood: 20, cloth: 4, plank: 4 }, 'Bichos-da-seda nas amoreiras: casulos de seda todo mês.', { farm: { silk_cocoon: 3 } }, { k: 'house', wall: '#e6dcc4', roof: '#4f8a36', sign: '🐛' }],
  ['duckpond', 'fazenda', 'Lago dos Patos', 3, 2, false, { wood: 10, stone: 10 }, 'Patos: ovos de pata, carne e penas todo mês.', { farm: { duck_egg: 3, duck_meat: 1, feather: 2 } }, { k: 'pond', water: '#3a7bc8', bird: '#f4f0e0' }],
  ['rabbithutch', 'fazenda', 'Coelheira', 2, 1, true, { wood: 12, fiber: 3 }, 'Coelhos: carne e peles todo mês.', { farm: { rabbit_meat: 3, rabbit_hide: 2 } }, { k: 'hutch' }],
  ['hopfield', 'fazenda', 'Lupulal', 3, 2, false, { wood: 15, rope: 4 }, 'Lúpulo nas estacas: a cerveja de lúpulo é a mais cara da taverna.', { farm: { hops: 6 }, season: true }, { k: 'field', soil: '#6e4f2e', plant: '#6aa84f', fruit: '#a8e070', stakes: true, tall: true }],
  ['sunflowers', 'fazenda', 'Campo de Girassóis', 3, 2, false, { wood: 8 }, 'Girassóis: sementes para tinta amarela e para os pássaros.', { farm: { sunflower: 7 }, season: true }, { k: 'field', soil: '#6e4f2e', plant: '#5a9a3a', fruit: '#f0c830', flower: true }],
  // ---------------------------------------------------------------- empreendimentos (+22)
  ['biz_glass', 'negocios', 'Vidraria Comercial', 2, 2, true, { brick: 20, stone: 15, clay: 8 }, 'Empreendimento: vidreiros fazem vidro e frascos todo mês.', { biz: { skill: 'glazier', slots: 2, wage: 5, out: { glass: 4, vial: 3 } }, trade: 'glass', room: 'pottery', shop: ['🔷', 'Vidraria', 'glazier', ['glass', 'vial', 'lens', 'lantern', 'silver_mirror', 'stained_glass', 'spyglass']] }, { k: 'kiln', wall: '#b8a890', fire: true, sign: '🔷', glass: true }],
  ['biz_dyer', 'negocios', 'Tinturaria Comercial', 3, 2, true, { wood: 25, clay: 10, plank: 8 }, 'Empreendimento: tintureiros tingem tecidos e vendem tintas.', { biz: { skill: 'weaver', slots: 2, wage: 4, out: { dye_red: 2, dye_blue: 2, dye_yellow: 2, red_cloth: 1 } }, trade: 'dyer', room: 'weaver', shop: ['🎨', 'Tinturaria', 'weaver', ['dye_red', 'dye_blue', 'dye_yellow', 'red_cloth', 'blue_cloth', 'felt', 'ink', 'painting']] }, { k: 'vats', colors: ['#8a3a9a', '#c8302a', '#3a5ad0'], house: true }],
  ['biz_press', 'negocios', 'Lagar de Azeite', 2, 2, true, { hardwood: 6, stone: 15, wood: 15 }, 'Empreendimento: prensa azeite e suco de uva.', { biz: { skill: 'vintner', slots: 2, wage: 4, out: { olive_oil: 4, grape_juice: 2 } }, trade: 'press', room: 'cellar', shop: ['🫒', 'Lagar', 'vintner', ['olive', 'olive_oil', 'grape', 'grape_juice', 'olive_bread', 'cask']] }, { k: 'press', house: true }],
  ['biz_smelter', 'negocios', 'Fundição Comercial', 2, 2, true, { stone: 35, brick: 20, iron_bar: 4 }, 'Empreendimento: fundidores produzem latão e estanho-chumbo.', { biz: { skill: 'smith', slots: 2, wage: 6, out: { brass_bar: 2, pewter_bar: 2, chain_links: 2 } }, trade: 'smelter', room: 'smithy', shop: ['⚒️', 'Fundição', 'smith', ['brass_bar', 'pewter_bar', 'chain_links', 'quicklime', 'zinc_ore', 'lead_ore', 'coal', 'iron_bar']] }, { k: 'kiln', wall: '#8a7a70', fire: true, sign: '⚒️' }],
  ['biz_armorer', 'negocios', 'Armaria', 3, 2, true, { stone: 30, wood: 15, iron_bar: 10, leather: 4 }, 'Empreendimento: armeiros fazem gambesões, gorros acolchoados e correntes.', { biz: { skill: 'armorer', slots: 2, wage: 7, out: { gambeson: 1, padded_cap: 1, chain_links: 2, buckler: 1 } }, trade: 'armorer', room: 'armory', shop: ['🛡️', 'Armaria', 'armorer', ['gambeson', 'padded_cap', 'padded_pants', 'buckler', 'bronze_shield', 'kite_shield', 'scale_armor', 'scale_helm', 'great_helm', 'brigandine', 'longsword', 'halberd', 'flail', 'morning_star', 'rapier', 'greatsword', 'warhammer', 'scimitar', 'scale_greaves', 'scale_boots', 'silver_helm', 'tower_shield', 'war_horn']] }, { k: 'shed', wall: '#8f8a80', roof: '#4a4a52', sign: '🛡️', anvil: true }],
  ['biz_bowyer', 'negocios', 'Arcoaria', 2, 2, true, { wood: 30, yew_wood: 6, rope: 6 }, 'Empreendimento: flecheiros fazem flechas e virotes.', { biz: { skill: 'hunter', slots: 2, wage: 4, out: { arrow: 20, bolt: 10 } }, trade: 'bowyer', room: 'lumber', shop: ['🏹', 'Arcoaria', 'hunter', ['arrow', 'iron_arrow', 'bolt', 'short_bow', 'yew_bow', 'horn_bow', 'crossbow', 'heavy_crossbow', 'feather']] }, { k: 'house', wall: '#9a7a4a', roof: '#3e5a2a', sign: '🏹' }],
  ['biz_scribe', 'negocios', 'Casa do Escriba', 2, 2, true, { brick: 15, plank: 10, glass: 2 }, 'Empreendimento: escribas fazem papel, tinta e livros.', { biz: { skill: 'teacher', slots: 2, wage: 5, out: { paper: 4, ink: 2, book: 1 } }, trade: 'scribe', room: 'library', shop: ['📜', 'Casa do Escriba', 'teacher', ['paper', 'ink', 'parchment', 'book', 'tome', 'treasure_map', 'candle']] }, { k: 'house', wall: '#e8dcc0', roof: '#5a3a6a', sign: '📜' }],
  ['biz_magic', 'negocios', 'Loja de Magia', 2, 2, true, { stone_block: 20, glass: 4, runestone: 1, plank: 8 }, 'Empreendimento: um mago encanta pergaminhos e prepara poções de foco.', { biz: { skill: 'mage', slots: 1, wage: 12, out: { scroll_heal: 1, focus_potion: 1, vial: 2 } }, trade: 'magic', room: 'apothecary', shop: ['🔮', 'Loja de Magia', 'mage', ['scroll_fireball', 'scroll_heal', 'scroll_recall', 'scroll_haste', 'scroll_shield', 'scroll_storm', 'apprentice_staff', 'arcane_wand', 'wizard_hat', 'mage_robe', 'orb', 'runestone', 'focus_potion', 'moonpetal']] }, { k: 'magetower', shop: true }],
  ['biz_butcher', 'negocios', 'Açougue', 2, 2, true, { wood: 25, stone: 10, salt: 4 }, 'Empreendimento: carne, linguiça, presunto e toucinho.', { biz: { skill: 'hunter', slots: 2, wage: 4, out: { meat: 5, sausage: 2, ham: 1, bacon: 2 } }, trade: 'butcher', room: 'smoke', shop: ['🥩', 'Açougue', 'hunter', ['meat', 'sausage', 'ham', 'bacon', 'venison', 'rabbit_meat', 'duck_meat', 'salted_meat', 'bear_fat']] }, { k: 'house', wall: '#e8dcc0', roof: '#8a2a2a', sign: '🥩' }],
  ['biz_tailor', 'negocios', 'Alfaiataria', 2, 2, true, { wood: 20, cloth: 8, plank: 6 }, 'Empreendimento: roupas finas para nobres e lenços bordados.', { biz: { skill: 'tailor', slots: 2, wage: 5, out: { felt: 2, scarf: 1, linen_tunic: 1 } }, trade: 'tailor', room: 'weaver', shop: ['🧵', 'Alfaiataria', 'tailor', ['noble_hat', 'noble_doublet', 'noble_hose', 'scarf', 'linen_tunic', 'linen_pants', 'wool_hood', 'felt', 'silk_thread', 'gold_thread']] }, { k: 'house', wall: '#d8c8b8', roof: '#6a2a5a', sign: '🧵' }],
  ['biz_cobbler', 'negocios', 'Sapataria', 2, 2, true, { wood: 20, leather: 6, plank: 4 }, 'Empreendimento: botas de couro e botas forradas.', { biz: { skill: 'hunter', slots: 2, wage: 4, out: { leather_boots: 1, rabbit_boots: 1 } }, trade: 'cobbler', room: 'tannery', shop: ['👢', 'Sapataria', 'hunter', ['leather_boots', 'rabbit_boots', 'fur_boots', 'noble_shoes', 'ranger_boots', 'mage_slippers', 'leather']] }, { k: 'house', wall: '#c8a878', roof: '#5a3a1e', sign: '👢' }],
  ['biz_barber', 'negocios', 'Barbearia', 2, 1, true, { wood: 15, plank: 6, soap: 2 }, 'Empreendimento: barba, cabelo e sangria. Rende ouro todo mês.', { biz: { skill: 'healer', slots: 1, wage: 4, gold: 10 }, trade: 'barber', room: 'bath', shop: ['💈', 'Barbearia', 'healer', ['soap', 'perfume', 'herbal_salve', 'herbal_tea']] }, { k: 'house', wall: '#f0e8e0', roof: '#c8302a', sign: '💈', small: true }],
  ['biz_bathhouse', 'negocios', 'Casa de Banhos', 3, 2, true, { stone_block: 20, brick: 10, plank: 6 }, 'Empreendimento: banhos quentes. Rende bom ouro todo mês.', { biz: { skill: 'bather', slots: 2, wage: 5, gold: 16 }, trade: 'bathshop', room: 'bath', shop: ['🛁', 'Casa de Banhos', 'bather', ['soap', 'perfume', 'herbal_tea', 'royal_jelly']] }, { k: 'house', wall: '#d8d0c0', roof: '#3a6a8a', sign: '🛁', steam: true }],
  ['biz_stables', 'negocios', 'Cavalariça de Aluguel', 3, 2, true, { wood: 40, stone: 10, rope: 6 }, 'Empreendimento: aluga cavalos aos viajantes e vende crina.', { biz: { skill: 'groom', slots: 2, wage: 4, gold: 8, out: { horsehair: 2 } }, trade: 'stable', room: 'stable', shop: null }, { k: 'barn', wall: '#8a5a30', roof: '#5a3a1e', sign: '🐎' }],
  ['biz_shipyard', 'negocios', 'Estaleiro', 3, 2, true, { wood: 50, rope: 10, pitch: 6, iron_bar: 4 }, 'Empreendimento: piche, cordas e barcos (construa perto da água).', { biz: { skill: 'carpenter', slots: 3, wage: 5, gold: 6, out: { pitch: 2, rope: 3 } }, trade: 'shipyard', room: 'harbor', shop: ['⚓', 'Estaleiro', 'carpenter', ['boat', 'pitch', 'rope', 'fishing_net', 'plank', 'beam']] }, { k: 'shipyard' }],
  ['biz_charcoal', 'negocios', 'Carvoaria', 2, 2, false, { wood: 25, stone: 10, clay: 6 }, 'Empreendimento: carvão vegetal e piche das fornalhas de barro.', { biz: { skill: 'lumber', slots: 2, wage: 3, out: { coal: 7, pitch: 1 } }, trade: 'charcoal', room: 'smoke', shop: ['⚫', 'Carvoaria', 'lumber', ['coal', 'pitch', 'wood', 'bark', 'torch']] }, { k: 'charcoal' }],
  ['biz_saltworks', 'negocios', 'Salina', 3, 3, false, { wood: 15, stone: 15 }, 'Empreendimento: sal (o melhor é perto do mar) e peixe salgado.', { biz: { skill: 'peasant', slots: 3, wage: 3, out: { salt: 8, salted_fish: 1 } }, trade: 'saltworks', room: 'granary', shop: ['🧂', 'Salina', 'peasant', ['salt', 'salted_fish', 'salted_meat', 'ham', 'seaweed']] }, { k: 'saltpans' }],
  ['biz_cooper', 'negocios', 'Tanoaria', 2, 2, true, { wood: 30, iron_bar: 3 }, 'Empreendimento: barris para vinho, cerveja e salmoura.', { biz: { skill: 'carpenter', slots: 2, wage: 4, out: { cask: 3 } }, trade: 'cooper', room: 'lumber', shop: ['🛢️', 'Tanoaria', 'carpenter', ['cask', 'plank', 'beam', 'nails', 'pitch']] }, { k: 'house', wall: '#a8784a', roof: '#5a3a1e', sign: '🛢️', barrels: true }],
  ['biz_perfumer', 'negocios', 'Perfumaria', 2, 2, true, { brick: 12, glass: 4, plank: 6 }, 'Empreendimento: perfumes, sabões finos e geleia real.', { biz: { skill: 'healer', slots: 2, wage: 6, out: { perfume: 1, soap: 2, royal_jelly: 1 } }, trade: 'perfumer', room: 'apothecary', shop: ['🧴', 'Perfumaria', 'healer', ['perfume', 'soap', 'lavender', 'rose_petals', 'royal_jelly', 'incense', 'vial']] }, { k: 'house', wall: '#f0e0e8', roof: '#9a7ad8', sign: '🧴' }],
  ['biz_theatre', 'negocios', 'Teatro', 4, 3, true, { stone_block: 25, plank: 20, red_cloth: 4 }, 'Empreendimento: peças e músicos. Rende muito ouro e fama no seu reino.', { biz: { skill: 'innkeeper', slots: 3, wage: 6, gold: 24 }, trade: 'theatre', room: 'tavern', shop: ['🎭', 'Teatro', 'innkeeper', ['lute', 'flute', 'war_drum', 'painting', 'wine', 'mulled_wine']], fame: 4 }, { k: 'theatre' }],
  ['biz_mason', 'negocios', 'Canteiro de Pedra', 3, 2, false, { stone: 30, wood: 15, iron_bar: 3 }, 'Empreendimento: blocos de pedra, mármore e cal para as grandes obras.', { biz: { skill: 'mason', slots: 3, wage: 5, out: { stone_block: 4, quicklime: 2, marble_block: 1 } }, trade: 'mason', room: 'quarry', shop: ['🧱', 'Canteiro', 'mason', ['stone_block', 'marble_block', 'quicklime', 'granite', 'limestone', 'marble', 'mortar', 'brick']] }, { k: 'stoneyard' }],
  ['biz_ropery', 'negocios', 'Cordoaria', 3, 1, true, { wood: 20, fiber: 10 }, 'Empreendimento: cordas e redes de pesca.', { biz: { skill: 'peasant', slots: 2, wage: 3, out: { rope: 6, fishing_net: 1 } }, trade: 'ropery', room: 'weaver', shop: ['🪢', 'Cordoaria', 'weaver', ['rope', 'fishing_net', 'fiber', 'cloth', 'hunting_trap']] }, { k: 'ropewalk' }],
  // ---------------------------------------------------------------- praça e decoração (+9)
  ['gazebo', 'praca', 'Coreto', 2, 2, false, { plank: 12, wood: 10, roof_tile: 6 }, 'Música aos domingos: descanso (energia cheia) e charme uma vez por mês. Anima a vila.', { deco: { power: 6, happy: 1, act: 'gazebo' } }, { k: 'gazebo' }],
  ['obelisk', 'praca', 'Obelisco', 1, 1, true, { stone_block: 12, marble: 2 }, 'Marco de pedra com o seu brasão: +4 de fama e prestígio para a vila.', { deco: { power: 4, fame: 4 } }, { k: 'obelisk' }],
  ['wishwell', 'praca', 'Poço dos Desejos', 1, 1, true, { stone: 12, wood: 4, rope: 1 }, 'Jogue uma moeda e faça um pedido: às vezes a sorte responde.', { deco: { power: 3, act: 'wish' } }, { k: 'wishwell' }],
  ['pond_d', 'praca', 'Lago Ornamental', 3, 2, false, { stone: 20, clay: 6 }, 'Lago com carpas e nenúfares: descansar à beira recupera a vida.', { deco: { power: 5, happy: 1, act: 'pond' } }, { k: 'pond', water: '#4a8ad8', lily: true, carp: true }],
  ['arch', 'praca', 'Arco Triunfal', 2, 1, true, { stone_block: 25, marble_block: 4, gold_bar: 1 }, 'Celebra as suas vitórias: +10 de fama e o reino fica mais feliz.', { deco: { power: 8, fame: 10, happy: 2 } }, { k: 'arch' }],
  ['topiary', 'praca', 'Jardim de Topiaria', 2, 2, false, { wood: 6, dirt: 10, bone_meal: 4 }, 'Arbustos esculpidos em forma de bichos: a vila fica mais bonita.', { deco: { power: 5, happy: 1 } }, { k: 'topiary' }],
  ['equestrian', 'praca', 'Estátua Equestre', 2, 2, true, { marble_block: 8, bronze_bar: 6 }, 'Você a cavalo, em bronze: +8 de fama.', { deco: { power: 6, fame: 8 } }, { k: 'equestrian' }],
  ['pillory', 'praca', 'Pelourinho', 1, 1, true, { wood: 10, iron_bar: 2 }, 'A justiça à vista de todos: menos ladrões na vila e ordem no reino.', { deco: { power: 2, happy: 1, act: 'pillory', order: true } }, { k: 'pillory' }],
  ['market_stall', 'praca', 'Barraca de Feira', 2, 1, true, { wood: 12, cloth: 4 }, 'Sua barraca vende excedentes na feira: um pouco de ouro todo mês (mais perto de uma vila).', { deco: { power: 3, act: 'stall' }, till: [6, 14] }, { k: 'stall' }],
  // ---------------------------------------------------------------- cultura, fé e treino (+4)
  ['chapel_p', 'cultura', 'Capela Particular', 2, 2, true, { stone_block: 15, glass: 2, plank: 6 }, 'Reze uma vez por mês: bênção e +2 de fé. A fé da sua casa cresce sozinha.', { act: 'chapel', piety: 1 }, { k: 'chapel' }],
  ['observatory', 'cultura', 'Observatório', 2, 2, true, { stone_block: 20, lens: 2, brass_bar: 2 }, 'Estude as estrelas: sabedoria e a previsão do tempo e das colheitas.', { act: 'observe' }, { k: 'observatory' }],
  ['tiltyard', 'cultura', 'Liça de Justa', 4, 2, false, { wood: 30, plank: 10, red_cloth: 2 }, 'Treine justa uma vez por mês: experiência, força e fama de cavaleiro.', { act: 'joust' }, { k: 'tiltyard' }],
  ['stone_circle', 'cultura', 'Círculo de Pedras', 3, 3, false, { stone: 40, runestone: 1 }, 'Pedras antigas: medite (energia cheia e sabedoria) e as suas magias ficam 15% mais fortes por um mês.', { act: 'circle' }, { k: 'circle' }],
  // ---------------------------------------------------------------- baús e estábulo (+5)
  ['granary_p', 'guarda', 'Celeiro', 2, 2, true, { wood: 30, plank: 8, stone: 6 }, 'Guarda grãos e comida. Todo mês, o trigo guardado vira farinha (5 por mês).', { store: true, flour: true }, { k: 'barn', wall: '#a8784a', roof: '#8a3a2a', sign: '🌾' }],
  ['warehouse', 'guarda', 'Armazém Grande', 3, 2, true, { wood: 40, plank: 16, iron_bar: 2 }, 'Um depósito enorme para guardar o que não cabe na mochila.', { store: true }, { k: 'barn', wall: '#8a7a6a', roof: '#4a4a52', sign: '📦' }],
  ['vault', 'guarda', 'Cofre', 1, 1, true, { stone_block: 8, iron_bar: 6, brass_bar: 2 }, 'Guarde ouro a salvo dos ladrões. Rende 1% ao mês.', { act: 'vault' }, { k: 'vault' }],
  ['cartshed', 'guarda', 'Garagem de Carroças', 3, 2, true, { wood: 30, plank: 10, iron_bar: 2 }, 'Carroças e mulas de carga: +100 de capacidade de carga.', { carry: 100 }, { k: 'barn', wall: '#9a6a3a', roof: '#5a4a3a', sign: '🛒', open: true }],
  ['icehouse', 'guarda', 'Casa de Gelo', 2, 2, true, { stone: 25, wood: 10, peat: 0 }, 'Depósito frio meio enterrado: guarda comida e junta gelo no inverno.', { store: true, ice: true }, { k: 'icehouse' }],
  // ---------------------------------------------------------------- defesa e exército (+4)
  ['ballista', 'defesa', 'Balista', 2, 2, true, { hardwood: 6, iron_bar: 6, rope: 4 }, 'Arma de cerco fixa: atira virotes gigantes em inimigos a até 12 passos.', { def: 'ballista' }, { k: 'ballista' }],
  ['trench', 'defesa', 'Fosso com Estacas', 2, 1, false, { dirt: 10, wood: 6 }, 'Inimigos que passam por aqui ficam lentos e se ferem.', { def: 'trench' }, { k: 'trench' }],
  ['war_stable', 'defesa', 'Estábulo de Guerra', 3, 2, true, { wood: 40, stone: 15, iron_bar: 4, horsehair: 0 }, 'Cavalos de guerra: +2 cavaleiros no seu exército em cada batalha (até 4) e crina todo mês.', { def: 'cavalry', farm: { horsehair: 2 } }, { k: 'barn', wall: '#6a4a2a', roof: '#3a3a42', sign: '🐎' }],
  ['siege_workshop', 'defesa', 'Oficina de Cerco', 3, 2, true, { wood: 40, hardwood: 6, iron_bar: 6, rope: 6 }, 'Catapultas e aríetes 30% mais baratos no arsenal, e até 10 catapultas nas batalhas.', { def: 'siege' }, { k: 'siegeyard' }],
  // ---------------------------------------------------------------- infraestrutura (+7)
  ['crane', 'infra', 'Guindaste de Obra', 2, 2, false, { wood: 30, rope: 8, iron_bar: 2 }, 'Construções a até 20 passos dele gastam 10% menos material.', { infra: 'crane' }, { k: 'crane' }],
  ['cistern', 'infra', 'Cisterna', 2, 2, true, { stone_block: 10, clay: 6 }, 'Rega sozinha as plantações a até 10 passos e dá gelo no inverno. A vila fica mais saudável.', { infra: 'cistern', power: 4 }, { k: 'cistern' }],
  ['windmill', 'infra', 'Moinho de Vento', 2, 2, true, { wood: 35, stone: 15, cloth: 6 }, 'Mói o trigo do lugar: 6 de farinha por mês. Uma marca da vila no horizonte.', { infra: 'windmill', farm: { flour: 6 }, power: 5 }, { k: 'windmill' }],
  ['sewer', 'infra', 'Rede de Esgoto', 2, 1, false, { stone_block: 12, brick: 10 }, 'Água limpa e menos doença: a vila cresce e o reino fica mais feliz.', { infra: 'sewer', power: 7, happy: 1 }, { k: 'sewer' }],
  ['dock', 'infra', 'Atracadouro', 2, 2, false, { wood: 25, plank: 8, rope: 4 }, 'Cais de pesca (construa à beira da água): peixe e mexilhões todo mês.', { infra: 'dock', farm: { carp: 2, cod: 1, mussels: 2 }, power: 3 }, { k: 'dock' }],
  ['toll', 'infra', 'Posto de Pedágio', 2, 1, true, { wood: 20, stone: 10 }, 'Cobra pedágio de quem passa pela estrada (construa ao lado de uma): ouro todo mês.', { infra: 'toll', till: [8, 22] }, { k: 'toll' }],
  ['relay', 'infra', 'Posto de Muda', 2, 2, true, { wood: 30, stone: 10, rope: 4 }, 'Cavalos descansados: viaje na hora entre os seus postos de muda (5 🪙).', { infra: 'relay', power: 2 }, { k: 'barn', wall: '#a8885a', roof: '#3a5a7a', sign: '🐴' }],
];
for (const [k, cat, name, w, h, blocks, cost, desc, fn, look] of EXP_BUILDINGS) {
  if (BUILDINGS[k]) continue;
  const c = Object.fromEntries(Object.entries(cost).filter(([i, n]) => ITEMS[i] && n > 0));
  BUILDINGS[k] = { name, w, h, blocks, cost: c, desc, exp: { cat, fn, look } };
  if (fn.home !== undefined) BUILDINGS[k].home = true;
}
const EXPB = Object.fromEntries(EXP_BUILDINGS.map(r => [r[0], { cat: r[1], fn: r[8], look: r[9] }]));
const expFn = t => (EXPB[t] && EXPB[t].fn) || null;

// moradias: dormir, salvar, cozinhar, entrar, alugar
for (const [k, b] of Object.entries(EXPB)) if (b.fn.home !== undefined) {
  STATIONS.fogueira.types.push(k);
  ROOM_TYPES[k] = { lay: 'home', theme: b.look.k === 'tower' ? 'stone' : 'wood', owned: true, big: !!b.look.big, name: () => BUILDINGS[k].name };
  if (typeof RENT !== 'undefined') RENT[k] = b.fn.rent;
}
// empreendimentos: tipo, ramo (balcão), interior e loja própria
for (const [k, b] of Object.entries(EXPB)) if (b.fn.biz) {
  BIZ_TYPES[k] = Object.assign({}, b.fn.biz);
  BIZ_TRADE[k] = b.fn.trade; BIZ_ROOMS[k] = b.fn.room;
  if (b.fn.shop) {
    const [icon, name, rank, list] = b.fn.shop, sells = list.filter(i => ITEMS[i]);
    SHOPS[b.fn.trade] = Object.assign(SHOPS[b.fn.trade] || {}, { name, icon, rank: (SHOPS[b.fn.trade] && SHOPS[b.fn.trade].rank) || rank, sells, buys: it => !!it && sells.includes(it.key) });
  }
}
if (SHOPS.stable && SHOPS.stable.sells) for (const i of ['horsehair', 'pitchfork']) if (ITEMS[i] && !SHOPS.stable.sells.includes(i)) SHOPS.stable.sells.push(i);
if (typeof SMOKE_FROM !== 'undefined') Object.assign(SMOKE_FROM, { smelter: 1, glassworks: 1, biz_glass: 1, biz_smelter: 1, biz_charcoal: 1, biz_butcher: 0.5, biz_bathhouse: 0.6, longhouse: 1, farmhouse: 1, townhouse: 1, mansion: 1, palacete: 1, treehouse: 0.5 });

// as categorias do menu Construção recebem as novas
{
  // a lista de categorias é montada dentro do showBuild (ui.js), que acrescenta estas
  UI.expCats = Object.fromEntries(['moradia', 'producao', 'fazenda', 'negocios', 'praca', 'cultura', 'guarda', 'defesa', 'infra'].map(c => [c, EXP_BUILDINGS.filter(r => r[1] === c).map(r => r[0])]));
}

// ------------------------------------------------------------------ o que cada construção nova faz
const ExpBuild = {
  t: 0,
  mine(t) { return Content.mine(t); },
  near(s, R) { return World.structs.filter(o => o !== s && o.owner === 'player' && !o.removed && U.dist(o.x + o.w / 2, o.y + o.h / 2, s.x + s.w / 2, s.y + s.h / 2) < R); },
  homes() { return World.structs.filter(s => s.owner === 'player' && !s.removed && expFn(s.type) && expFn(s.type).home !== undefined); },
  // produção mensal das criações e de algumas obras
  produce(s) {
    const f = expFn(s.type); if (!f || !f.farm) return null;
    if (f.season && Season.winter()) return null;
    const out = {};
    let mul = 1;
    // a casa de fazenda perto aumenta 20%
    if (World.structs.some(o => o.owner === 'player' && !o.removed && o.type === 'farmhouse' && U.dist(o.x, o.y, s.x, s.y) < 12)) mul *= 1.2;
    for (const k in f.farm) { const n = f.farm[k] * mul; const whole = Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0); if (whole > 0 && ITEMS[k]) out[k] = whole; }
    return Object.keys(out).length ? out : null;
  },
  label(s) {
    const b = EXPB[s.type]; if (!b || s.owner !== 'player') return '';
    const f = b.fn, name = BUILDINGS[s.type].name;
    if (f.home !== undefined) return `${name} — salvar e dormir`;
    if (f.station) return `${name} — ${STATIONS[f.station].name}`;
    if (f.farm && !f.def && !f.infra) return `${name} — ${Content.goodsTxt(s) || (f.season && Season.winter() ? 'parado no inverno' : 'produzindo')}`;
    if (f.store) return `${name} — guardar itens`;
    const acts = { gazebo: 'descansar e ouvir música', wish: 'jogar uma moeda', pond: 'descansar à beira', pillory: 'a justiça da vila', stall: s.till ? `recolher ${s.till} 🪙` : 'vendendo na feira',
      chapel: 'rezar', observe: 'estudar as estrelas', joust: 'treinar justa', circle: 'meditar', vault: `${this.V().gold} 🪙 guardados` };
    if (f.deco && f.deco.act) return `${name} — ${acts[f.deco.act]}`;
    if (f.act) return `${name} — ${acts[f.act]}`;
    if (f.infra === 'relay') return `${name} — viajar`;
    if (f.infra === 'toll') return `${name} — ${s.till ? `recolher ${s.till} 🪙` : 'cobrando pedágio'}`;
    if (f.infra === 'dock' || f.infra === 'windmill' || f.def === 'cavalry') return `${name} — ${Content.goodsTxt(s) || 'trabalhando'}`;
    return name;
  },
  interact(s) {
    const b = EXPB[s.type]; if (!b || s.owner !== 'player') return false;
    const f = b.fn;
    if (f.home !== undefined) { UI.showRest(s.id); return true; }
    if (f.station) { UI.showCrafting(f.station); return true; }
    if (f.store) { UI.showChest(s.id); return true; }
    if (f.farm || f.till) { Biz.collect(s); return true; }
    const act = (f.deco && f.deco.act) || f.act;
    const once = key => { G.urban = G.urban || {}; const m = G.urban.expOnce || (G.urban.expOnce = {}); if (m[key + s.id] === G.day) return false; m[key + s.id] = G.day; return true; };
    switch (act) {
      case 'gazebo': P.stamina = Game.maxSt(); if (once('gz')) { Farm.addBuff('charm'); UI.msg('🎻 A banda toca no coreto: energia cheia e charme (+preço melhor nas lojas).', 'gold'); } else UI.msg('🎻 Um descanso no coreto: energia cheia.'); return true;
      case 'wish': {
        if (P.gold < 1) { UI.msg('Você não tem nem uma moeda.'); return true; }
        P.gold -= 1; Sound.play('splash');
        const r = Math.random() * (1 + Expansion.luck() * 0.3);
        if (r > 0.97) { const g = U.rint(40, 120); P.gold += g; UI.msg(`✨ O poço brilha: você encontra ${g} 🪙 no fundo!`, 'gold'); }
        else if (r > 0.85) { Farm.addBuff(U.pick(['charm', 'courage', 'blessed'])); UI.msg('✨ O desejo foi ouvido: você se sente abençoado.', 'gold'); }
        else UI.msg('💧 A moeda afunda... quem sabe da próxima vez.');
        return true;
      }
      case 'pond': P.hp = Math.min(P.maxHp, P.hp + Math.round(P.maxHp * 0.35)); UI.msg('🪷 As carpas nadam entre os nenúfares. Você descansa e recupera a vida.'); return true;
      case 'pillory': UI.msg('⚖️ O pelourinho lembra a todos que há lei por aqui: menos furtos nas casas da vila e mais ordem no reino.'); return true;
      case 'stall': Biz.collect(s); return true;
      case 'chapel': if (!once('ch')) { UI.msg('🙏 Você já rezou este mês na capela.'); return true; } Farm.addBuff('blessed'); G.piety = (G.piety || 0) + 2; UI.msg('🙏 Uma prece em silêncio: bênção e +2 de fé.', 'gold'); return true;
      case 'observe': {
        if (once('ob')) Farm.addBuff('wisdom');
        const next = SEASONS[(World.season + 1) % SEASONS.length];
        const dry = G.civs.filter(c => c.scar && c.scar.drought).map(c => CIV_DEFS[c.id].short);
        UI.msg(`🔭 As estrelas dizem: ${next ? `${next.name} se aproxima` : 'o tempo vai mudar'}. ${dry.length ? `Seca em ${dry.join(', ')}: a comida vai encarecer lá.` : 'Nenhuma seca à vista: boas colheitas.'} (sabedoria +)`, 'gold', true);
        return true;
      }
      case 'joust': if (!once('jo')) { UI.msg('🐎 Os cavalos descansam: volte no mês que vem.'); return true; } Game.gainXp(40 + P.level * 2); Farm.addBuff('str'); Court.addFame(1); UI.msg('🐎 Uma tarde de justas na liça: +experiência, força e +1 de fama.', 'gold'); return true;
      case 'circle': P.stamina = Game.maxSt(); if (once('ci')) { Farm.addBuff('wisdom'); G.urban.circleUntil = G.day + 1; UI.msg('🔮 As pedras zumbem: energia cheia, sabedoria e magia 15% mais forte por um mês.', 'gold'); } else UI.msg('🔮 Você medita entre as pedras: energia cheia.'); return true;
      case 'vault': this.vaultUI(); return true;
    }
    if (f.infra === 'relay') { this.relayUI(s); return true; }
    if (f.infra === 'crane') { UI.msg('🏗️ O guindaste ergue as cargas pesadas: construções a até 20 passos gastam 10% menos.'); return true; }
    if (f.infra === 'cistern') { UI.msg('💧 A cisterna rega as plantações a até 10 passos todos os dias.'); P.stamina = Game.maxSt(); return true; }
    if (f.infra === 'sewer') { UI.msg('🚰 Água limpa e esgoto fechado: menos doença, a vila cresce mais rápido.'); return true; }
    if (f.def === 'ballista') { UI.msg('🎯 A balista vigia o horizonte: atira em inimigos a até 12 passos.'); return true; }
    if (f.def === 'trench') { UI.msg('🕳️ O fosso atrasa e fere quem tentar passar.'); return true; }
    if (f.def === 'siege') { UI.msg(`⚙️ Oficina de cerco: máquinas 30% mais baratas no arsenal e até ${WAR_CATS_MAX} catapultas nas batalhas.`); return true; }
    if (f.deco) { UI.msg(`🏛️ ${BUILDINGS[s.type].name}: ${BUILDINGS[s.type].desc}`); return true; }
    return false;
  },
  onBuild(k) {
    const b = EXPB[k]; if (!b) return;
    const fame = (b.fn.fame || 0) + ((b.fn.deco && b.fn.deco.fame) || 0);
    if (fame) { Court.addFame(fame); UI.msg(`🏛️ ${BUILDINGS[k].name}: +${fame} de fama.`, 'gold'); }
  },
  capBonus() { return Math.min(16, this.homes().reduce((a, s) => a + (expFn(s.type).home || 0), 0)); },
  carry() { return this.mine('cartshed').length ? 100 : 0; },
  // ---- cofre
  V() { G.urban = G.urban || {}; return G.urban.vault || (G.urban.vault = { gold: 0 }); },
  vaultUI() {
    const V = this.V();
    UI.open('🔒 Cofre', `<p>No cofre: <b>${V.gold} 🪙</b> · no bolso: <b>${P.gold} 🪙</b>. O ouro do cofre não é roubado e rende 1% ao mês (até 50 🪙).</p>
      <div class="act-row">${[1, 100, 1000, 5000].map(n => `<button data-act="vault" data-op="in" data-n="${n}" ${P.gold >= n ? '' : 'disabled'}>Guardar ${n}</button>`).join('')}<button data-act="vault" data-op="in" data-n="all" ${P.gold > 0 ? '' : 'disabled'}>Guardar tudo</button>
      </div><div class="act-row">${[1, 100, 1000, 5000].map(n => `<button data-act="vault" data-op="out" data-n="${n}" ${V.gold >= n ? '' : 'disabled'}>Tirar ${n}</button>`).join('')}<button data-act="vault" data-op="out" data-n="all" ${V.gold > 0 ? '' : 'disabled'}>Tirar tudo</button></div>`, 'showVault', [], 'Seu ouro a salvo');
  },
  // ---- posto de muda
  relayUI(s) {
    const L = this.mine('relay').filter(o => o !== s);
    UI.open('🐴 Posto de Muda', L.length ? `<p>Cavalos descansados levam você a outro posto seu na hora, por 5 🪙.</p><div class="list">${L.map(o => `<div class="item"><span class="ic">🐴</span><div class="info"><b>Posto em ${this.where(o)}</b><small>${Math.round(U.dist(o.x, o.y, s.x, s.y))} passos daqui</small></div><button data-act="relaygo" data-s="${o.id}" ${P.gold >= 5 ? '' : 'disabled'}>Viajar</button></div>`).join('')}</div>`
      : '<p>Construa outro Posto de Muda em outro lugar do mapa para viajar entre eles.</p>', 'showRelay', [s.id], 'Viagem rápida entre os seus postos');
  },
  where(o) { const v = World.villages.reduce((b, x) => !b || U.dist(x.x, x.y, o.x, o.y) < U.dist(b.x, b.y, o.x, o.y) ? x : b, null); return v ? `perto de ${v.name}` : 'terras selvagens'; },
  // ---- todo mês
  monthTick() {
    for (const s of World.structs) {
      if (s.owner !== 'player' || s.removed) continue;
      const f = expFn(s.type); if (!f) continue;
      const till = f.till;
      if (till) {
        let g = U.rint(till[0], till[1]);
        if (s.type === 'toll') { let road = false; for (let dy = -2; dy <= s.h + 1 && !road; dy++) for (let dx = -2; dx <= s.w + 1; dx++) if (World.tile(s.x + dx, s.y + dy) === T.ROAD) { road = true; break; } if (!road) g = 2; }
        if (s.type === 'market_stall' && World.villages.some(v => U.dist(v.x, v.y, s.x, s.y) < 18)) g += 8;
        s.till = Math.min(400, (s.till || 0) + g);
      }
      if (f.flour) { const box = Store.box(s), w = Math.min(7, box.wheat || 0); if (w >= 2) { box.wheat -= w; if (!box.wheat) delete box.wheat; box.flour = (box.flour || 0) + Math.floor(w * 0.75); } }
      if ((f.ice || f.infra === 'cistern') && Season.winter()) { if (f.store) { const box = Store.box(s); box.ice = Math.min(40, (box.ice || 0) + 6); } else { s.goods = s.goods || {}; s.goods.ice = Math.min(30, (s.goods.ice || 0) + 4); } }
      if (f.piety) G.piety = (G.piety || 0) + f.piety;
    }
    // felicidade do reino: praças, arco, esgoto e pelourinho do seu reino (no máximo +3 por mês)
    const add = {};
    for (const s of World.structs) {
      if (s.owner !== 'player' || s.removed) continue;
      const f = expFn(s.type), h = f && ((f.deco && f.deco.happy) || f.happy); if (!h) continue;
      const ci = World.terr[World.idx(s.x, s.y)]; if (ci < 0 || !G.civs[ci] || G.civs[ci].ruler !== 'player') continue;
      add[ci] = (add[ci] || 0) + h;
    }
    for (const ci in add) G.civs[ci].happy = Math.min(100, G.civs[ci].happy + Math.min(3, add[ci]));
    // o cofre rende
    const V = this.V(); if (V.gold > 0) V.gold += Math.min(50, Math.floor(V.gold * 0.01));
  },
  // ---- a cada quadro: balistas e fossos
  update(dt) {
    if (G.dungeon || G.state !== 'play' || G.place) return;
    this.t -= dt; if (this.t > 0) return; this.t = 0.4;
    for (const s of this.mine('ballista')) {
      if (U.dist(s.x, s.y, P.x / TILE, P.y / TILE) > 40) continue;
      s.shotT = (s.shotT || 0) - 0.4; if (s.shotT > 0) continue;
      const cx = (s.x + s.w / 2) * TILE, cy = (s.y + s.h / 2) * TILE;
      let best = null, bd = 12 * TILE;
      for (const e of G.ents) { if (e.dead || e.kind === 'villager' || e.dmg <= 0 || !hostile(e, P)) continue; const d = U.dist(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = e; } }
      if (!best) continue;
      const a = Math.atan2(best.y - 14 - cy, best.x - cx);
      Ranged.fire({ x: cx, y: cy + 14, faction: 'player', dmg: 40, civ: -1 }, a, 40, 'bolt'); Sound.play('bow'); s.shotT = 2.6; s.aim = a;
    }
    const tr = this.mine('trench');
    if (tr.length) for (const e of G.ents) {
      if (e.dead || e.dmg <= 0 || !hostile(e, P)) continue;
      const tx = e.x / TILE, ty = (e.y - 4) / TILE;
      if (tr.some(s => tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h)) { e.slowUntil = G.realTime + 1.2; e.trenchT = (e.trenchT || 0) - 0.4; if (e.trenchT <= 0) { e.trenchT = 1.2; Game.damage(e, 6, null); } }
    }
  },
};

// ------------------------------------------------------------------ ganchos
{
  const p0 = Content.produce.bind(Content); Content.produce = s => p0(s) || ExpBuild.produce(s);
  const l0 = Content.label.bind(Content); Content.label = s => l0(s) || ExpBuild.label(s);
  const i0 = Content.interact.bind(Content); Content.interact = s => i0(s) || ExpBuild.interact(s);
  const b0 = Content.onBuild.bind(Content); Content.onBuild = k => { b0(k); ExpBuild.onBuild(k); };
  const c0 = Content.capBonus.bind(Content); Content.capBonus = () => c0() + ExpBuild.capBonus();
  const m0 = Content.monthTick.bind(Content); Content.monthTick = () => { m0(); ExpBuild.monthTick(); };
  const u0 = Content2.update.bind(Content2); Content2.update = dt => { u0(dt); ExpBuild.update(dt); };
  const cap0 = Store.capacity.bind(Store); Store.capacity = () => cap0() + ExpBuild.carry();
  // o guindaste poupa 10% do material das obras perto dele
  const pb0 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function () {
    const k = G.placing, b = BUILDINGS[k], before = b ? Object.fromEntries(Object.keys(b.cost).map(c => [c, Inv.count(c)])) : null;
    const near = b && ExpBuild.mine('crane').some(c => U.dist(c.x, c.y, G.mouse.wx / TILE, G.mouse.wy / TILE) < 20);
    pb0();
    if (near) { let back = 0; for (const c in before) { const r = Math.floor((before[c] - Inv.count(c)) * 0.1); if (r > 0) { Inv.add(c, r); back += r; } } if (back) UI.msg(`🏗️ O guindaste poupou ${back} materiais.`); }
  };
  // a cisterna rega as plantações perto dela
  const d0 = Farm.dayTick.bind(Farm);
  Farm.dayTick = function (rained) {
    const cs = ExpBuild.mine('cistern');
    if (cs.length) for (const k in this.plots()) { const x = k % WORLD_W, y = (k / WORLD_W) | 0; if (cs.some(c => U.dist(c.x, c.y, x, y) < 10)) G.plots[k].watered = true; }
    return d0(rained);
  };
  // praças e obras do senhor perto da vila contam no poder econômico dela
  if (typeof VillageEcon !== 'undefined' && VillageEcon.parts) {
    const pp0 = VillageEcon.parts.bind(VillageEcon);
    VillageEcon.parts = function (vi) {
      const out = pp0(vi), v = World.villages[vi]; if (!v) return out;
      let pts = 0;
      for (const s of World.structs) {
        if (s.removed || s.owner !== 'player' || U.dist(s.x, s.y, v.x, v.y) > 26) continue;
        const f = expFn(s.type); if (!f) continue;
        pts += (f.deco && f.deco.power) || f.power || (f.biz ? 4 : 0) || (f.home !== undefined ? 2 : 0);
      }
      if (pts) out.push(['🏛️', 'Praças, obras e negócios do senhor por perto', pts]);
      return out;
    };
  }
  // pelourinho: os ladrões evitam as vilas que têm um por perto (o sorteio de roubo da vila fica 3x mais difícil)
  if (typeof Crime !== 'undefined') Crime.guarded = vi => { const v = World.villages[vi]; return !!v && ExpBuild.mine('pillory').some(s => U.dist(v.x, v.y, s.x, s.y) < 24); };
  // estábulo de guerra: cavaleiros a mais no seu exército
  const ar0 = War.armyOf.bind(War);
  War.armyOf = function (ci, cfg) {
    const a = ar0(ci, cfg);
    if (G.civs[ci] && G.civs[ci].ruler === 'player') a.cav += Math.min(4, ExpBuild.mine('war_stable').length * 2);
    return a;
  };
  // oficina de cerco: máquinas 30% mais baratas
  if (typeof Arsenal !== 'undefined') {
    const cheap = o => ExpBuild.mine('siege_workshop').length && Object.values(ARSENAL_ENGINES).includes(o) ? Object.assign({}, o, { gold: Math.round(o.gold * 0.7) }) : o;
    const cn0 = Arsenal.can.bind(Arsenal), py0 = Arsenal.pay.bind(Arsenal);
    Arsenal.can = o => cn0(cheap(o)); Arsenal.pay = o => py0(cheap(o));
  }
  // ações das janelas novas
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'vault') {
      const V = ExpBuild.V(), n = d.n === 'all' ? (d.op === 'in' ? P.gold : V.gold) : +d.n;
      if (d.op === 'in') { const m = Math.min(n, P.gold); P.gold -= m; V.gold += m; } else { const m = Math.min(n, V.gold); V.gold -= m; P.gold += m; }
      Sound.play('coin'); ExpBuild.vaultUI(); return;
    }
    if (a === 'relaygo') {
      const s = World.structs[+d.s]; if (!s || P.gold < 5) return;
      P.gold -= 5; UI.close(); P.mounted = false; P.sailing = false;
      const sp = freeSpotNear((s.x + s.w / 2) * TILE, (s.y + s.h + 0.8) * TILE, 60); P.x = sp.x; P.y = sp.y;
      UI.msg(`🐴 Cavalos trocados no caminho: você chegou ao posto ${ExpBuild.where(s)}.`, 'gold'); return;
    }
    return a0(a, d);
  };
  // magia mais forte no mês do círculo de pedras
  const pd0 = Game.pDmg.bind(Game);
  Game.pDmg = function () { const d = pd0(); const w = P.equip.weapon && ITEMS[P.equip.weapon]; return w && w.magic && G.urban && G.urban.circleUntil >= G.day ? d * 1.15 : d; };
}
const WAR_CATS_MAX = 10;
