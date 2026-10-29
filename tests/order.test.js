// Ordem: em toda lista, do mais fácil (mais barato) ao mais difícil (mais caro). O Castelo é o último da Moradia;
// cada categoria do menu Construção, as receitas de cada oficina e as lojas seguem o valor do custo.
'use strict';
const { open } = require('./harness');
module.exports = async () => {
  const { page, errors, close } = await open(), fails = [];
  try {
    const r = await page.evaluate(() => {
      const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
      if (!Urban.hasAny()) Game.becomeRuler(0, 'teste'); // para a categoria "Obras nas vilas" aparecer
      UI.showBuild(); UI.close();
      for (const [key, , name, list] of UI.buildCats) {
        // nas Obras nas vilas, a ordem vale dentro de cada classe (Moradia, Comércio, Serviços...)
        for (const part of key === 'obras' ? [...new Set(list.map(k => UI.buildClass[k]))].map(c => list.filter(k => UI.buildClass[k] === c)) : [list]) {
          const vs = part.map(k => Order.buildValue(k)).filter(v => v !== null);
          for (let i = 1; i < vs.length; i++) if (vs[i] < vs[i - 1]) { bad.push(`${name}: fora de ordem em ${part[i]}`); break; }
        }
        const tools = list.map(k => Order.buildValue(k) === null);
        ok(tools.indexOf(true) < 0 || tools.slice(tools.indexOf(true)).every(Boolean), `${name}: as ferramentas grátis não estão no fim`);
        void key;
      }
      const mor = UI.buildCats.find(c => c[0] === 'moradia')[3];
      ok(mor[mor.length - 1] === 'pcastle', 'o Castelo não é o último da Moradia: ' + mor.join(', '));
      for (const st of Object.keys(STATIONS).concat([null])) {
        const L = RECIPES.filter(x => x.station === st).map(x => Order.recipeValue(x));
        for (let i = 1; i < L.length; i++) if (L[i] < L[i - 1]) { bad.push('receitas fora de ordem: ' + (st || 'à mão')); break; }
      }
      for (const k in SHOPS) { const L = (SHOPS[k].sells || []).map(i => Order.itemValue(i)); for (let i = 1; i < L.length; i++) if (L[i] < L[i - 1]) { bad.push('loja fora de ordem: ' + k); break; } }
      return { bad, mor: mor.map(k => BUILDINGS[k] ? BUILDINGS[k].name : k) };
    });
    console.log('    Moradia: ' + r.mor.join(' → '));
    fails.push(...r.bad);
  } finally { await close(); }
  return fails.concat(errors.map(e => 'erro no jogo: ' + e));
};
