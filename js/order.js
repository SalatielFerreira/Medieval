'use strict';
// Ordem do jogo inteiro: tudo aparece do mais fácil (mais barato) para o mais difícil (mais caro).
// A medida é uma só: o valor de mercado do que a coisa custa (cada material pelo preço dele, mais o ouro).
// Vale para o menu Construção (o Castelo é o último da Moradia), as obras nas vilas, as receitas de cada oficina,
// o que as lojas vendem e compram e as máquinas e melhorias do arsenal.

const Order = {
  // valor de um custo { item: quantidade } (+ ouro)
  costValue(cost, gold) {
    let v = gold || 0;
    for (const k in cost || {}) {
      const it = ITEMS[k] || (ITEM_GROUPS[k] && ITEMS[ITEM_GROUPS[k][0]]);
      v += (it ? it.price || 1 : 1) * cost[k];
    }
    return v;
  },
  // dificuldade de uma construção do menu (estradas e obras de vila incluídas)
  buildValue(k) {
    if (k === 'road') return -1; // a primeira estrada é grátis
    if (BUILDINGS[k]) return this.costValue(BUILDINGS[k].cost, k === 'pcastle' && typeof REALM_GOLD !== 'undefined' ? REALM_GOLD : 0);
    const inf = typeof Urban !== 'undefined' && Urban.info ? Urban.info(k) : null;
    if (!inf || !inf.cost) return null; // ferramentas (tirar estrada, mudar, demolir): ficam no fim, na ordem de sempre
    return this.costValue(inf.cost, inf.gold);
  },
  // lista de construções: com custo, do mais barato ao mais caro; as ferramentas grátis no fim
  sortBuild(list) {
    const withV = list.map((k, i) => ({ k, i, v: this.buildValue(k) }));
    const priced = withV.filter(x => x.v !== null).sort((a, b) => a.v - b.v || a.i - b.i);
    return priced.concat(withV.filter(x => x.v === null)).map(x => x.k);
  },
  recipeValue(r) { return this.costValue(r.cost) + (r.station ? 0.001 : 0); },
  itemValue(k) { return ITEMS[k] ? ITEMS[k].price || 0 : 0; },
};

// receitas: em cada oficina, da mais simples à mais cara (o índice das receitas só é usado pelas janelas)
RECIPES.sort((a, b) => Order.recipeValue(a) - Order.recipeValue(b) || Order.itemValue(a.out) - Order.itemValue(b.out));
// lojas: da mercadoria mais barata à mais cara
for (const k in SHOPS) if (Array.isArray(SHOPS[k].sells)) SHOPS[k].sells.sort((a, b) => Order.itemValue(a) - Order.itemValue(b));
// arsenal, investimentos do reino, obras da coroa e obras das vilas: do mais barato ao mais caro
Order.sortObj = obj => { const sorted = Object.entries(obj).sort((a, b) => Order.costValue(a[1].cost, a[1].gold) - Order.costValue(b[1].cost, b[1].gold)); for (const [k] of sorted) { const v = obj[k]; delete obj[k]; obj[k] = v; } };
for (const o of [typeof ARSENAL_ENGINES !== 'undefined' && ARSENAL_ENGINES, typeof ARSENAL_UPS !== 'undefined' && ARSENAL_UPS, INVESTMENTS, typeof WORKS !== 'undefined' && WORKS, typeof VWORKS !== 'undefined' && VWORKS]) if (o) Order.sortObj(o);
