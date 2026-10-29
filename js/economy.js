'use strict';
// Economia:
//  • seus empreendimentos têm no máximo 2 funcionários (produzem o mesmo com menos gente) e você define o preço;
//  • cada tipo de estabelecimento vende o que é dele, com itens novos (farinha, pão doce, sidra, manteiga, pérola...);
//  • o nível das vilas sobe conforme o poder econômico delas (moradores, lojas com dono, obras, negócios, comércio);
//  • o governador tem a janela de administração da vila (Portfólio → Suas vilas).

// ------------------------------------------------------------------ itens novos
Object.assign(ITEMS, {
  flour:         { name: 'Farinha',            icon: '🌾', cat: 'Materiais', price: 4 },
  sweet_roll:    { name: 'Pão Doce',           icon: '🥐', cat: 'Comida',    price: 10, food: 18, heal: 6 },
  rye_bread:     { name: 'Pão de Centeio',     icon: '🍞', cat: 'Comida',    price: 9,  food: 34, heal: 10 },
  biscuit:       { name: 'Biscoito',           icon: '🍪', cat: 'Comida',    price: 6,  food: 10, heal: 3 },
  cider:         { name: 'Sidra',              icon: '🍏', cat: 'Comida',    price: 16, food: 4,  heal: 6 },
  dark_ale:      { name: 'Cerveja Preta',      icon: '🍺', cat: 'Comida',    price: 18, food: 6,  heal: 5, buff: 'courage' },
  grape:         { name: 'Uva',                icon: '🍇', cat: 'Comida',    price: 2,  food: 4,  heal: 1 },
  salted_fish:   { name: 'Peixe Salgado',      icon: '🐟', cat: 'Comida',    price: 12, food: 22, heal: 6 },
  herbal_tea:    { name: 'Chá de Ervas',       icon: '🍵', cat: 'Comida',    price: 8,  food: 3,  heal: 20 },
  antidote:      { name: 'Antídoto',           icon: '🧪', cat: 'Comida',    price: 30, food: 0,  heal: 35 },
  butter:        { name: 'Manteiga',           icon: '🧈', cat: 'Comida',    price: 10, food: 8,  heal: 4 },
  curd:          { name: 'Coalhada',           icon: '🥛', cat: 'Comida',    price: 7,  food: 12, heal: 4 },
  linen_cloth:   { name: 'Tecido de Linho',    icon: '🧻', cat: 'Materiais', price: 8 },
  fish_oil:      { name: 'Óleo de Peixe',      icon: '🫙', cat: 'Materiais', price: 7 },
  beeswax:       { name: 'Cera de Abelha',     icon: '🍯', cat: 'Materiais', price: 6 },
  roof_tile:     { name: 'Telha',              icon: '🧱', cat: 'Materiais', price: 3 },
  cask:          { name: 'Barril',             icon: '🛢️', cat: 'Materiais', price: 12 },
  scarf:         { name: 'Lenço Bordado',      icon: '🧣', cat: 'Diversos',  price: 28 },
  leather_bag:   { name: 'Bolsa de Couro',     icon: '👜', cat: 'Diversos',  price: 26 },
  saddle:        { name: 'Sela',               icon: '🏇', cat: 'Diversos',  price: 60 },
  pearl:         { name: 'Pérola',             icon: '⚪', cat: 'Diversos',  price: 70 },
  silver_brooch: { name: 'Broche de Prata',    icon: '📍', cat: 'Diversos',  price: 110 },
  oil_lamp:      { name: 'Lamparina',          icon: '🪔', cat: 'Diversos',  price: 22 },
  glazed_vase:   { name: 'Vaso Vidrado',       icon: '🏺', cat: 'Diversos',  price: 40 },
  wooden_chair:  { name: 'Cadeira de Madeira', icon: '🪑', cat: 'Diversos',  price: 24 },
});
for (const k in ITEMS) ITEMS[k].key = k;
GIFTABLE.push('scarf', 'pearl', 'silver_brooch', 'glazed_vase', 'sweet_roll', 'cider');

// ------------------------------------------------------------------ cada estabelecimento com a sua mercadoria
{
  const has = l => l.filter(k => ITEMS[k]);
  const SHOP_LISTS = {
    bakery:     ['🍞', 'Padaria',          'baker',     ['bread', 'rye_bread', 'sweet_roll', 'biscuit', 'apple_pie', 'honey_cake', 'meat_pie', 'flour', 'egg', 'butter']],
    mill:       ['🌾', 'Moinho',           'miller',    ['flour', 'wheat', 'barley', 'wheat_seed', 'barley_seed', 'bread']],
    brewer:     ['🍺', 'Cervejaria',       'brewer',    ['beer', 'dark_ale', 'mead', 'cider', 'barley', 'honey', 'cask']],
    inn:        ['🛏️', 'Estalagem',        'innkeeper', ['beer', 'cider', 'wine', 'stew', 'fish_stew', 'cooked_meat', 'rye_bread', 'cheese', 'candle']],
    weaver:     ['🧵', 'Tecelagem',        'weaver',    ['cloth', 'linen_cloth', 'wool_cloth', 'silk_cloth', 'rope', 'scarf', 'linen_tunic', 'linen_pants', 'linen_hood', 'wool_hood', 'wool_cloak', 'tapestry']],
    tannery:    ['🧥', 'Curtume',          'hunter',    ['leather', 'hard_leather', 'leather_bag', 'saddle', 'leather_cap', 'leather_jerkin', 'leather_breeches', 'leather_boots', 'rabbit_hide']],
    fishery:    ['🐟', 'Pesqueiro',        'merchant',  ['trout', 'cod', 'sardine', 'carp', 'salted_fish', 'smoked_fish', 'fish_oil', 'fishing_rod']],
    winery:     ['🍷', 'Vinícola',         'merchant',  ['grape', 'wine', 'aged_wine', 'cask']],
    ranch:      ['🐄', 'Rancho',           'hunter',    ['meat', 'milk', 'wool', 'leather', 'egg', 'salted_meat', 'sausage']],
    jeweler:    ['💍', 'Joalheria',        'smith',     ['silver_ring', 'gold_ring', 'gem_ring', 'pearl', 'silver_brooch', 'amber_amulet', 'gem', 'silver_bar', 'gold_bar']],
    apothecary: ['🌿', 'Botica',           'merchant',  ['herb', 'herbal_tea', 'herbal_salve', 'antidote', 'healing_potion', 'tonic', 'stamina_potion', 'honey']],
    dairy:      ['🧀', 'Laticínio',        'merchant',  ['milk', 'cheese', 'butter', 'curd', 'egg']],
    chandler:   ['🕯️', 'Cerieiro',         'merchant',  ['candle', 'beeswax', 'oil_lamp', 'honey', 'fish_oil']],
    pottery:    ['🏺', 'Olaria',           'potter',    ['clay_pot', 'glazed_vase', 'brick', 'roof_tile', 'clay', 'sand']],
    carpentry:  ['🪚', 'Carpintaria',      'carpenter', ['plank', 'beam', 'nails', 'cask', 'wooden_chair', 'wood', 'hardwood']],
    bank:       ['🏦', 'Casa de Câmbio',   'merchant',  ['gold_bar', 'silver_bar', 'ancient_coin', 'gem', 'pearl']],
    granary:    ['🌽', 'Celeiro',          'granger',   ['wheat', 'barley', 'flour', 'carrot', 'cabbage', 'apple', 'wheat_seed', 'barley_seed', 'carrot_seed', 'cabbage_seed']],
    clinic:     ['🌿', 'Casa de Curas',    'healer',    ['herb', 'herbal_tea', 'herbal_salve', 'antidote', 'healing_potion', 'honey']],
    stable:     ['🐴', 'Estrebaria',       'groom',     ['saddle', 'rope', 'leather', 'wheat', 'apple', 'carrot', 'barley']],
    trade:      ['🐫', 'Entreposto',       'trader',    ['spices', 'silk_cloth', 'salt', 'amber', 'camel_hair', 'pearl', 'wine', 'iron_bar', 'reed_basket']],
  };
  for (const [k, [icon, name, rank, list]] of Object.entries(SHOP_LISTS)) {
    const sells = has(list);
    SHOPS[k] = Object.assign(SHOPS[k] || {}, { name, icon, rank: (SHOPS[k] && SHOPS[k].rank) || rank, sells, buys: it => !!it && sells.includes(it.key) });
  }
  // os seus empreendimentos compram no atacado (e vendem) o que é do ramo deles
  Object.assign(BIZ_TRADE, { biz_mine: 'mine', biz_mill: 'mill', biz_farm: 'granary', ptavern: 'inn', biz_bakery: 'bakery', biz_brewery: 'brewer', biz_tannery: 'tannery',
    biz_weaver: 'weaver', biz_fishery: 'fishery', biz_winery: 'winery', biz_ranch: 'ranch', biz_inn: 'inn', biz_jeweler: 'jeweler', biz_apothecary: 'apothecary',
    biz_carpentry: 'carpentry', biz_chandler: 'chandler', biz_pottery: 'pottery', biz_bank: 'bank', biz_dairy: 'dairy' });
  // e produzem também os itens novos do ramo
  const add = (t, o) => { if (BIZ_TYPES[t]) BIZ_TYPES[t].out = Object.assign({}, BIZ_TYPES[t].out || {}, o); };
  add('biz_mill', { flour: 6 }); add('biz_bakery', { sweet_roll: 2, rye_bread: 2 }); add('biz_brewery', { cider: 1 }); add('biz_dairy', { butter: 2 });
  add('biz_fishery', { salted_fish: 2 }); add('biz_chandler', { beeswax: 2 }); add('biz_pottery', { roof_tile: 4 }); add('biz_carpentry', { cask: 1 });
  add('biz_winery', { grape: 4 }); add('biz_weaver', { linen_cloth: 2 }); add('biz_tannery', { leather_bag: 1 }); add('biz_jeweler', { pearl: 1 });
}

// ------------------------------------------------------------------ poucos funcionários: no máximo 2 (rendendo o mesmo)
{
  for (const d of Object.values(BIZ_TYPES)) if (d.slots > 2) { d.boost = d.slots / 2; d.slots = 2; }
  const fc0 = Biz.forecast.bind(Biz);
  Biz.forecast = function (s) {
    const r = fc0(s), d = BIZ_TYPES[s.type];
    if (d && d.boost) { for (const k in r.out) r.out[k] = Math.round(r.out[k] * d.boost); r.gold = Math.round(r.gold * d.boost); }
    return r;
  };
  // quem passou do limite volta para casa (sem perder a amizade)
  Biz.trim = function () {
    let n = 0;
    for (const s of this.list()) {
      const ws = this.workers(s), max = BIZ_TYPES[s.type].slots;
      for (const p of ws.slice(max)) { s.workers = s.workers.filter(id => id !== p.id); p.job = null; const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); } n++; }
    }
    if (n) UI.msg(`💼 Agora cada empreendimento tem no máximo 2 funcionários (eles rendem o mesmo): ${n} ${n === 1 ? 'trabalhador voltou' : 'trabalhadores voltaram'} para casa.`, 'gold');
    return n;
  };
  const dt0 = Biz.dayTick.bind(Biz);
  Biz.dayTick = function (...a) { this.trim(); return dt0(...a); };
}

// ------------------------------------------------------------------ você define o preço dos seus empreendimentos
const BIZ_PRICES = [0.6, 0.8, 1, 1.2, 1.5, 2];
{
  Biz.price = s => (Biz.earn(s).priceMul || 1);
  Biz.demand = s => U.clamp(1.6 - 0.6 * Biz.price(s), 0.25, 1.3); // preço alto: vende menos
  const sk0 = Biz.sellK.bind(Biz);
  Biz.sellK = s => Math.round(sk0(s) * Biz.price(s) * 100) / 100;
  // balcão: os fregueses compram menos quando está caro (e mais quando está barato)
  Biz.shelfSales = function (s) {
    if (!s.shelf) return 0;
    const mul = this.popMul(s), pm = this.price(s);
    let left = Math.round((3 + 4 * mul * (1 + this.workerCount(s) * 0.25)) * this.demand(s)), rev = 0;
    for (const k of Object.keys(s.shelf).sort((a, b) => ITEMS[b].price - ITEMS[a].price)) {
      while (left > 0 && s.shelf[k] > 0) { s.shelf[k]--; left--; rev += Math.round(ITEMS[k].price * Math.min(1.25, 0.9 + 0.1 * mul) * pm); }
      if (s.shelf[k] <= 0) delete s.shelf[k];
    }
    if (rev) { s.till = (s.till || 0) + rev; this.addRev(s, rev); }
    return rev;
  };
  // venda automática: caro demais, parte da produção fica guardada esperando comprador
  Biz.cashOut = function (s) {
    let g = s.till || 0; const dm = Math.min(1, this.demand(s)), k = this.sellK(s);
    for (const it in s.goods || {}) { const n = s.goods[it], sold = Math.ceil(n * dm); g += Math.round(ITEMS[it].price * k * sold); s.goods[it] = n - sold; if (s.goods[it] <= 0) delete s.goods[it]; }
    s.till = 0; P.gold += g;
    return g;
  };
  const sb0 = UI.showBiz.bind(UI);
  UI.showBiz = function (sid) {
    sb0(sid);
    const s = World.structs[sid], pb = this.panel && this.panel.querySelector('.pb'); if (!s || !pb) return;
    const pm = Biz.price(s), dm = Biz.demand(s), div = document.createElement('div'); div.className = 'card'; div.style.marginTop = '10px';
    div.innerHTML = `<div class="sec">🏷️ Preço dos seus produtos <span>${Math.round(pm * 100)}% do preço normal</span></div>
      <p class="dt-desc">Mais caro: cada venda rende mais, mas os fregueses compram menos (o resto fica guardado). Mais barato: vende tudo e a freguesia aumenta. Hoje os fregueses levam cerca de <b>${Math.round(Math.min(1, dm) * 100)}%</b> do que você põe à venda.</p>
      <div class="act-row">${BIZ_PRICES.map(m => `<button data-act="bizprice" data-s="${sid}" data-v="${m}" class="${Math.abs(m - pm) < 0.01 ? 'primary' : ''}">${Math.round(m * 100)}%</button>`).join('')}</div>`;
    pb.appendChild(div);
  };
  const act0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'bizprice') { const s = World.structs[+d.s]; if (s) { Biz.earn(s).priceMul = +d.v; this.showBiz(s.id); } return; } return act0(a, d); };
}

// ------------------------------------------------------------------ poder econômico das vilas (o nível sobe com ele)
// ritmo do crescimento: uma vila leva uns 48 meses para ir do nível 1 ao 3–4
const VILLAGE_GROWTH = 0.5;
const VillageEcon = {
  // de onde vem a força da economia da vila
  parts(vi) {
    const v = World.villages[vi]; if (!v) return [];
    const res = People.residents(vi), adults = res.filter(p => p.age >= 16).length;
    const shops = World.structs.filter(s => !s.removed && !s.hidden && Shops.isShop(s) && s.village === vi && s.owner !== 'player');
    const staffed = shops.filter(s => Shops.keeper(s)).length;
    const works = typeof VillageWorks !== 'undefined' ? VillageWorks.of(vi) : [];
    const rent = works.reduce((a, s) => a + ((VWORKS[s.type] || {}).rent || 0), 0);
    const fam = World.structs.filter(s => !s.removed && s.fam !== undefined && s.village === vi).length;
    const deco = World.structs.filter(s => !s.removed && !s.hidden && s.village === vi && ['vmarket', 'vfountain', 'vstatue'].includes(s.type)).reduce((a, s) => a + ({ vmarket: 8, vfountain: 4, vstatue: 3 })[s.type], 0);
    const gates = typeof Gate !== 'undefined' ? Gate.list().filter(s => s.village === vi) : [];
    const cars = gates.reduce((a, s) => a + ((Gate.peek(s) || {}).lastCars || 0), 0);
    const out = [
      ['👪', 'Moradores que trabalham e compram', adults],
      ['🏪', `Lojas e obras com responsável (${staffed}/${shops.length})`, staffed * 6],
      ['🏗️', 'Aluguéis das obras da vila', Math.round(rent * 0.5)],
      ['🏭', 'Negócios das famílias', fam * 5],
      ['⛲', 'Feira, chafariz e estátua', deco],
      ['🐫', 'Caravanas pelo portão (mês passado)', cars * 3],
      ['💰', 'Investimentos no desenvolvimento', typeof Fin !== 'undefined' ? Math.round(Fin.vinv(vi) / 40) : 0],
    ];
    if (v.ruin) out.push(['🔥', 'Casas em ruína', -v.ruin * 5]);
    return out;
  },
  power(vi) { return Math.max(0, this.parts(vi).reduce((a, p) => a + p[2], 0)); },
  // quanto a vila cresce por mês: o poder econômico puxa, cada nível exige uma economia maior
  base(v, vi) { return this.power(vi) / 50 - ((v.level || 1) - 1) * 0.2; },
  delta(v, vi, happy, rich, raided) {
    const econ = this.base(v, vi), mood = (happy - 45) / 70 + (rich ? 0.25 : 0);
    const d = (U.clamp(econ, -1, 3) + mood + U.rnd(-0.3, 0.4)) * VILLAGE_GROWTH - (raided ? 5 : 0);
    v.grow = { d: Math.round(d * 100) / 100, econ: Math.round(econ * 100) / 100, mood: Math.round(mood * 100) / 100, raided: !!raided, day: G.day };
    return d;
  },
  // previsão para a janela: crescimento por mês (economia + humor + obras), quanto falta e em quantos meses
  forecast(vi) {
    const v = World.villages[vi], c = G.civs[v.civ];
    const happy = v.free ? 60 : c ? c.happy : 50, rich = !v.free && c && c.treasury > 600;
    const works = (typeof VillageWorks !== 'undefined' ? VillageWorks.of(vi).reduce((a, s) => a + ((VWORKS[s.type] || {}).pm || 0), 0) : 0) * VILLAGE_GROWTH;
    const econ = U.clamp(this.base(v, vi), -1, 3) * VILLAGE_GROWTH, mood = ((happy - 45) / 70 + (rich ? 0.25 : 0)) * VILLAGE_GROWTH, per = econ + mood + works + 0.025;
    const lvl = v.level || 1, next = lvl < VILLAGE_MAX ? VILLAGE_LVLS[lvl] : null, from = VILLAGE_LVLS[lvl - 1] || 0;
    const left = next !== null ? Math.max(0, next - v.prosper) : 0;
    return { econ, mood, works, per, lvl, next, from, left, months: next === null ? null : per > 0.05 ? Math.ceil(left / per) : null, power: this.power(vi) };
  },
};
{
  const vw0 = VillageWorks.monthTick.bind(VillageWorks);
  VillageWorks.monthTick = function (...a) {
    const before = World.villages.map(v => v.prosper || 0);
    const r = vw0(...a);
    World.villages.forEach((v, i) => { const g = (v.prosper || 0) - before[i]; if (g > 0) v.prosper = before[i] + g * VILLAGE_GROWTH; });
    return r;
  };
  // as caravanas do mês ficam guardadas para a conta do mês seguinte
  const gm0 = Gate.monthTick.bind(Gate);
  Gate.monthTick = function () { for (const s of this.list()) { const d = this.peek(s); if (d) d.lastCars = d.cars || 0; } return gm0(); };
}

// ------------------------------------------------------------------ janela de administração da vila (governador)
const VillageAdmin = {
  page(vi) {
    const v = World.villages[vi]; if (!v) return '<p class="muted">Vila não encontrada.</p>';
    const S = UI.sel, sub = ['resumo', 'economia', 'gente'].includes(S.vsub) ? S.vsub : 'resumo', f = VillageEcon.forecast(vi);
    const tabs = `<div class="tabs subtabs">${[['resumo', '📊 Resumo'], ['economia', '💰 Economia'], ['gente', '👪 Gente e obras']].map(([k, l]) => `<button class="tab ${sub === k ? 'on' : ''}" data-act="vsub" data-s="${k}">${l}</button>`).join('')}</div>`;
    const head = UI.pageHead('🏘️', v.name, `${v.free ? 'Vila livre' : 'Vila de ' + CIV_DEFS[v.civ].name} · você é o governador`) + tabs;
    const sign = n => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2);
    if (sub === 'resumo') {
      const pct = f.next !== null ? U.clamp((v.prosper - f.from) / (f.next - f.from) * 100, 0, 100) : 100;
      const res = People.residents(vi), cap = Families.vcap(v);
      return head + `<div class="card"><div class="sec">⭐ Nível ${f.lvl}${f.next !== null ? ` → ${f.lvl + 1}` : ' (máximo)'} <span>prosperidade ${Math.floor(v.prosper)}${f.next !== null ? ` / ${f.next}` : ''}</span></div>
          <div class="va-bar"><i style="width:${pct}%"></i></div>
          <div class="tiles big">
            <div class="stile"><small>Crescimento por mês</small><b class="${f.per >= 0 ? 'ok' : 'bad'}">${sign(f.per)}</b></div>
            <div class="stile"><small>Próximo nível</small><b>${f.next === null ? '—' : f.months === null ? 'parado' : f.months <= 1 ? 'este mês' : `~${f.months} meses`}</b></div>
            <div class="stile"><small>Poder econômico</small><b>${Math.round(f.power)}</b></div>
            <div class="stile"><small>Moradores</small><b>${res.length} / ${cap}</b></div></div>
          <p class="dt-desc">${v.grow ? `Mês passado: ${sign(v.grow.d)}${v.grow.raided ? ' (a vila foi saqueada)' : ''}. ` : ''}O nível sobe com a <b>prosperidade</b>, que cresce todo mês conforme o <b>poder econômico</b> da vila — e cada nível exige uma economia maior.${v.free && f.lvl >= REALM_LVL ? ' A vila já pode virar o seu reino: erga o Castelo (Construir → Moradia).' : v.free ? ` No nível ${REALM_LVL} ela pode virar o seu reino.` : ''}</p></div>
        <div class="card"><div class="sec">📈 De onde vem o crescimento <span>por mês</span></div>
          <div class="kv"><div>Economia (poder ${Math.round(f.power)} − exigência do nível ${f.lvl})<b class="${f.econ >= 0 ? 'ok' : 'bad'}">${sign(f.econ)}</b></div>
            <div>Humor do povo${v.free ? ' (vila livre)' : ' e tesouro do reino'}<b class="${f.mood >= 0 ? 'ok' : 'bad'}">${sign(f.mood)}</b></div>
            <div>Obras da vila (escola, banhos, padaria...)<b class="ok">${sign(f.works)}</b></div></div></div>`;
    }
    if (sub === 'economia') {
      const parts = VillageEcon.parts(vi), works = VillageWorks.of(vi), rent = works.reduce((a, s) => a + ((VWORKS[s.type] || {}).rent || 0), 0);
      const gates = Gate.list().filter(s => s.village === vi);
      const tips = [];
      if (!parts[1] || parts[1][2] < World.structs.filter(s => Shops.isShop(s) && s.village === vi && s.owner !== 'player').length * 6) tips.push('Ponha um responsável em todas as lojas e obras (aba Gente e obras).');
      for (const [k, d] of Object.entries(VWORKS).filter(([k]) => !works.some(s => s.type === k)).sort((a, b) => ((b[1].pm || 0) + (b[1].rent || 0) / 40) - ((a[1].pm || 0) + (a[1].rent || 0) / 40)).slice(0, 3)) tips.push(`Construa ${d.icon} ${d.name}${d.pm ? ` (+${Math.round(d.pm * VILLAGE_GROWTH * 100) / 100} de prosperidade por mês)` : ''}${d.rent ? ` · aluguel de ${d.rent} 🪙` : ''}.`);
      if (!gates.length) tips.push('Um portão na muralha cobra pedágio e as caravanas que passam aquecem o comércio.');
      if (!World.structs.some(s => !s.removed && s.village === vi && s.type === 'vmarket')) tips.push('A Feira na praça dá +8 de poder econômico.');
      return head + `<div class="card"><div class="sec">💪 Poder econômico <span>${Math.round(VillageEcon.power(vi))}</span></div>
          <div class="kv">${parts.map(([ic, l, n]) => `<div>${ic} ${l}<b class="${n >= 0 ? 'ok' : 'bad'}">${n >= 0 ? '+' : ''}${Math.round(n)}</b></div>`).join('')}</div>
          <p class="dt-desc">Para subir do nível ${f.lvl} sem depender da sorte, a vila precisa de mais de <b>${Math.round((f.lvl - 1) * 0.2 * 50)}</b> de poder econômico.</p></div>
        <div class="card"><div class="sec">🪙 Rendas da vila <span>por mês</span></div>
          <div class="kv"><div>Aluguéis das obras (vão para você, o governador)<b>${rent} 🪙</b></div>
            ${typeof NpcWorks !== 'undefined' ? `<div>🏦 Caixa da vila (doações, festas, entradas)<b>${NpcWorks.fundOf(vi)} 🪙</b></div>` : ''}
            ${gates.map(s => { const d = Gate.peek(s) || {}; return `<div>🚪 Portão: pedágio ${d.toll || 0} 🪙 · entrada ${d.fee || 0} 🪙<b>${d.lastMonth !== undefined ? d.lastMonth : 0} 🪙 no mês passado</b></div>`; }).join('')}</div></div>
        <div class="card"><div class="sec">💡 Como fazer a vila crescer</div><ul class="glog">${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
    }
    // gente e obras
    const shops = World.structs.filter(s => !s.removed && !s.hidden && Shops.isShop(s) && s.village === vi && s.owner !== 'player');
    const works = VillageWorks.of(vi), res = People.residents(vi);
    const idle = res.filter(p => People.commoner && People.commoner(p) && !p.shop && !p.job && p.age >= 18).length;
    const nm = s => (Places.def(s) ? Places.def(s).name(s) : (CIV_STRUCTS[s.type] || {}).name || s.type);
    return head + `<div class="card"><div class="sec">🏪 Lojas e obras <span>${shops.filter(s => Shops.keeper(s)).length}/${shops.length} com responsável</span></div>
        ${shops.map(s => { const k = Shops.keeper(s); return `<div class="crow"><span class="ri">${(VWORKS[s.type] || CIVIC[s.type] || {}).icon || '🏠'}</span><span><b>${UI.esc(nm(s))}</b><small>${k ? `${People.title(k)} ${UI.esc(People.full(k))}` : 'sem responsável'}</small></span>
          <span class="act-row">${k ? `<button data-act="tk" data-op="open" data-id="${k.id}">💬</button>` : `<button class="primary" data-act="vfill" data-s="${s.id}">Pôr alguém</button>`}</span></div>`; }).join('') || '<p class="muted">Nenhuma loja ainda.</p>'}</div>
      <div class="card"><div class="sec">👪 Moradores <span>${res.length} · ${idle} sem emprego</span></div>
        <div class="kv"><div>Lugar para morar<b>${res.length} / ${Families.vcap(v)}</b></div><div>Obras da vila<b>${works.length}</b></div><div>Portões<b>${Gate.list().filter(s => s.village === vi).length}</b></div></div>
        <div class="act-row"><button data-act="vbuild">🏗️ Construir obras na vila</button></div></div>`;
  },
  // põe o primeiro morador disponível como responsável
  fill(s) {
    if (!s || Shops.keeper(s)) return;
    const vi = Work.vi(s), rank = SHOP_KEEPER[s.type];
    const q = People.shopCandidates(vi, rank).find(p => !p.shop && !p.job);
    if (!q) { UI.msg('Ninguém disponível na vila agora: chegará alguém de fora no mês que vem.', 'bad'); return; }
    q.rank = rank; q.shop = s.okey; q.met = true;
    UI.msg(`🏪 ${People.full(q)} agora cuida de ${Places.def(s) ? Places.def(s).name(s) : 'lá'}.`, 'gold');
  },
};
{
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (nav && nav.startsWith('v:')) { const vi = +nav.slice(2), v = World.villages[vi]; if (v && v.lord === 'player') return VillageAdmin.page(vi); this.sel.knav = 'overview'; return kp0('overview'); }
    return kp0(nav);
  };
  const act1 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'vsub') { this.sel.vsub = d.s; this.refresh && this.refresh(); return; }
    if (a === 'vfill') { VillageAdmin.fill(World.structs[+d.s]); this.refresh && this.refresh(); return; }
    if (a === 'vbuild') { this.sel.bcat = 'obras'; this.close(); UI.toggle('showBuild'); return; }
    return act1(a, d);
  };
}
