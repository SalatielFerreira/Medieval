// Inventário: sem a seção de bolsos (o bolso é um atalho, o item fica na mochila com a marquinha), espaço do anel embaixo
// das botas (com o efeito de cada anel), botões organizados, dividir automático (7 vira 4 e 3), nome do item no balão
// junto do cursor; uma só receita de Tocha e de Flecha; os Dados de Osso saíram do jogo (e de jogos salvos antigos).
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); }, html = () => UI.panel ? UI.panel.innerHTML : '';
      UI.msg = () => {}; Dialog.autoYes = true;
      Inv.add('bread', 7); UI.sel.inv = 'bread'; UI.sel.cell = 'bread'; UI.showInventory();
      ok(!html().includes('>Bolsos<'), 'o inventário ainda mostra os bolsos');
      ok(html().includes('data-slot="ring"'), 'falta o espaço do anel');
      const slots = [...UI.panel.querySelectorAll('.pd-col')[1].querySelectorAll('[data-slot]')].map(e => e.dataset.slot); ok(slots.indexOf('ring') === slots.indexOf('feet') + 1, 'o anel não fica embaixo das botas');
      ok(UI.panel.querySelector('.tile[data-tip]'), 'o item não tem o balão com o nome');
      // o bolso saiu do jogo: nem botão na mochila, nem atalho ao lado do relógio
      ok(!UI.panel.querySelector('[data-act="ipocket"]') && !/Bolso \d/.test(html()), 'a mochila ainda tem os botões de bolso');
      ok(!document.getElementById('pockets') && typeof Game.useQuick === 'undefined', 'o bolso ainda existe no jogo');
      // dividir automático
      UI.act('isplit', {}); const parts = Inv.bag().filter(c => c && Inv.baseOf(c) === 'bread').map(c => Inv.cellN(c)).sort().join(); ok(parts === '3,4', 'dividir 7 não deu 4 e 3: ' + parts);
      ok(!UI.panel.querySelector('#splitN'), 'o dividir ainda pede a quantidade');
      // anéis
      Inv.add('gem_ring', 1); const d0 = Game.pDef(); Game.equip('gem_ring'); ok(P.equip.ring === 'gem_ring' && Game.pDef() === d0 + 3, 'o anel de gema não dá defesa');
      Inv.add('silver_ring', 1); const k = Object.keys(ITEMS).find(x => ITEMS[x].cat === 'Comida' && ITEMS[x].price >= 20), p0 = Game.priceFor(0, k, { aff: 0 }).buy; Game.equip('silver_ring'); ok(Game.priceFor(0, k, { aff: 0 }).buy < p0, 'o anel de prata não dá desconto');
      // receitas e dados
      ok(RECIPES.filter(r => r.out === 'torch' && !r.station).length === 1 && RECIPES.find(r => r.out === 'torch' && !r.station).n === 4, 'tocha: deveria haver só a receita de 4');
      ok(RECIPES.filter(r => r.out === 'arrow' && !r.station).length === 1 && RECIPES.find(r => r.out === 'arrow' && !r.station).n === 8, 'flecha: deveria haver só a receita de 8');
      ok(!ITEMS.dice && !Object.values(SHOPS).some(s => s.sells && s.sells.includes('dice')), 'os Dados de Osso ainda existem');
      UI.showCrafting(null); ok(!/Tocha ×|Flecha ×/.test(html()), 'a criação ainda mostra ×N no nome');
      return bad;
    });
    fails.push(...r);
    // jogo salvo antigo com dados: o item some ao carregar (posto e salvo no mesmo instante, sem quadro no meio)
    await page.evaluate(() => { P.inv.dice = 2; P.quick[1] = 'dice'; Game.save(); delete P.inv.dice; P.quick[1] = null; }); await page.evaluate(() => Game.load(3));
    await page.waitForFunction(() => G.state === 'play', { timeout: 120000 });
    const left = await page.evaluate(() => [P.inv.dice, P.quick[1], P.equip.ring]);
    if (left[0] || left[1] === 'dice') fails.push('os dados do jogo salvo antigo não sumiram');
    if (left[2] !== 'silver_ring') fails.push('o anel equipado não voltou ao carregar: ' + left[2]);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
