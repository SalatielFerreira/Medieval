// Botão Voltar das janelas: só conta a troca de janela (ações dentro da mesma janela não viram passos),
// o círculo da neblina quatro vezes maior que o original e a barba na frente do braço.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const out = [], ok = (c, t) => { if (!c) out.push(t); };
      UI.close();
      // inventário: várias ações dentro dele (cada uma redesenha a janela) e Voltar sai direto para o jogo
      UI.showInventory(); for (let k = 0; k < 5; k++) { UI.sel.inv = k; UI.cur.args = [k]; UI.showInventory(); }
      ok(UI.hist.length === 0, `ações dentro do inventário viraram ${UI.hist.length} passos do Voltar`);
      UI.act('wback', {}); ok(UI.panel.classList.contains('hidden'), 'Voltar não saiu do inventário direto para o jogo');
      // de janela para janela: Voltar volta para a anterior
      UI.showInventory(); UI.showCrafting(); UI.showCrafting(); ok(UI.hist.length === 1, `inventário → criar deveria ter 1 passo (tem ${UI.hist.length})`);
      UI.act('wback', {}); ok(UI.cur && UI.cur.fn === 'showInventory', 'Voltar não voltou para o inventário');
      UI.act('wback', {}); ok(UI.panel.classList.contains('hidden'), 'Voltar não saiu para o jogo');
      // ida e volta pela mesma janela não acumula passos
      UI.showInventory(); UI.showCrafting(); UI.showInventory(); ok(UI.hist.length === 0, 'voltar à janela do caminho acumulou passos');
      UI.close();
      // neblina: o raio dobrou
      ok(FOG_R === 52, `o raio da neblina é ${FOG_R}`);
      return out;
    });
    fails.push(...r);
    // barba: a ponta da barba longa aparece por cima do braço (o pixel da barba não muda quando o braço é pintado de outra cor)
    const b = await page.evaluate(() => {
      const draw = sleeve => { const c = document.createElement('canvas'); c.width = 120; c.height = 140; const g = c.getContext('2d'); g.setTransform(3, 0, 0, 3, 60, 135);
        humanBody(g, { body: sleeve, legs: '#333', skin: '#f0c896', hair: '#5a3a1a', hairStyle: 'short', beardStyle: 'long', beard: true, dir: 1, anim: 0, moving: false }, 0);
        return g.getImageData(60 + 2.4 * 3, 135 - 20.4 * 3, 1, 1).data.join(); };
      return [draw('#ff0000'), draw('#0000ff')];
    });
    if (b[0] !== b[1]) fails.push('a barba longa está atrás do braço');
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
