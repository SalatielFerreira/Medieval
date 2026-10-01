'use strict';
// Mercado com preços que mudam (escassez, fartura, guerra, inverno, caravanas) e as caravanas de comércio do jogador.

const MARKET_GOODS = ['wood', 'hardwood', 'stone', 'clay', 'coal', 'copper_ore', 'tin_ore', 'iron_ore', 'iron_bar', 'bronze_bar', 'leather', 'wool', 'cloth', 'rope',
  'wheat', 'barley', 'bread', 'meat', 'cooked_meat', 'honey', 'beer', 'mead', 'wine', 'spices', 'silk_cloth', 'gem', 'iron_sword', 'chainmail'];
const GOOD_GROUPS = {
  food: ['wheat', 'barley', 'bread', 'meat', 'cooked_meat', 'honey'],
  war: ['iron_bar', 'bronze_bar', 'leather', 'iron_sword', 'chainmail', 'coal'],
  winter: ['wood', 'hardwood', 'coal', 'wool', 'cloth', 'bread', 'meat'],
  luxury: ['spices', 'silk_cloth', 'wine', 'mead', 'gem', 'honey'],
};

const Market = {
  M() { return G.market || (G.market = {}); },
  f(ci, k) { const m = this.M()[ci]; return m && m[k] !== undefined ? m[k] : 1; },
  set(ci, k, v) { const M = this.M(); M[ci] = M[ci] || {}; M[ci][k] = U.clamp(v, 0.45, 2.4); },
  bump(ci, k, mult) { if (ci >= 0) this.set(ci, k, this.f(ci, k) * mult); },
  // compras e vendas do jogador mexem no preço
  traded(ci, k, n, mode) { if (MARKET_GOODS.includes(k)) this.bump(ci, k, mode === 'sell' ? Math.pow(0.994, n) : Math.pow(1.006, n)); },
  dayTick() {
    const winter = Season.winter();
    for (let ci = 0; ci < CIV_DEFS.length; ci++) {
      const war = G.civs[ci].atWar || Diplo.warsOf(ci).length > 0;
      for (const k of MARKET_GOODS) {
        let target = 1;
        if (war && GOOD_GROUPS.war.includes(k)) target *= 1.4;
        if (war && GOOD_GROUPS.food.includes(k)) target *= 1.15;
        if (winter && GOOD_GROUPS.winter.includes(k)) target *= 1.3;
        const v = this.f(ci, k);
        this.set(ci, k, v + (target - v) * 0.15 + U.rnd(-0.04, 0.04));
      }
      // eventos: escassez ou fartura de algum produto
      if (Math.random() < 0.18) {
        const k = U.pick(MARKET_GOODS), up = Math.random() < 0.55;
        this.bump(ci, k, up ? U.rnd(1.35, 1.7) : U.rnd(0.55, 0.75));
        Diplo.chronicle(`${up ? '📈 Escassez' : '📉 Fartura'} de ${ITEMS[k].name} em ${Diplo.name(ci)}: os preços ${up ? 'dispararam' : 'despencaram'}.`);
      }
    }
  },
  // caravana assaltada: os produtos dela ficam escassos no destino
  robbed(c) { for (const g of c.goods || c.cargo || []) this.bump(c.to, g.k, 1.25); },
  trend(ci, k) { const v = this.f(ci, k); return v > 1.12 ? 'up' : v < 0.88 ? 'down' : ''; },
  sellPrice(ci, k) { return Game.price(ci, k).sell; },
  buyPrice(ci, k) { return Game.price(ci, k).buy; },

  // ------------------------------------------------------------ caravanas do jogador
  origin() {
    // reino de onde a caravana parte: o castelo ou vila mais próximos (até 14 passos)
    let best = null, bd = 14;
    for (let c = 0; c < CIV_DEFS.length; c++) { const cp = World.capitals[c]; const d = U.dist(P.x / TILE, P.y / TILE, cp.x, cp.y); if (d < bd) { bd = d; best = c; } }
    for (const v of World.villages) { const d = U.dist(P.x / TILE, P.y / TILE, v.x, v.y); if (d < bd) { bd = d; best = v.civ; } }
    return G.dungeon ? null : best;
  },
  risk(from, to, guards) {
    let r = 0.2 + (Diplo.atWar(from, to) || G.civs[to].atWar ? 0.15 : 0) + (World.camps.filter(c => !c.cleared).length > 6 ? 0.05 : 0) - guards * 0.06;
    return U.clamp(r, 0.03, 0.6);
  },
  cost(guards) { return 40 + guards * 30; },
  estimate(to, cargo) { return Object.entries(cargo).reduce((s, [k, n]) => s + this.sellPrice(to, k) * n, 0); },
  mine() { return (G.caravans || []).filter(c => c.owner === 'player' && !c.done); },
  send(from, to, cargo, guards) {
    const items = Object.entries(cargo).filter(([k, n]) => n > 0 && Inv.count(k) >= n);
    if (!items.length) { UI.msg('Escolha mercadorias para a caravana.', 'bad'); return false; }
    if (from === to) { UI.msg('Escolha um reino de destino diferente.', 'bad'); return false; }
    const price = this.cost(guards);
    if (P.gold < price) { UI.msg(`Montar a caravana custa ${price} 🪙.`, 'bad'); return false; }
    const a = World.capitals[from].door, b = World.capitals[to].door;
    const path = World.findPath(a.x, a.y, b.x, b.y);
    if (!path || path.length < 10) { UI.msg('Não há estrada entre esses reinos.', 'bad'); return false; }
    path.reverse();
    P.gold -= price;
    for (const [k, n] of items) Inv.add(k, -n);
    const c = { id: 900000 + G.day * 100 + U.rint(0, 99), from, to, path, pos: 0, done: false, robbed: false, escort: 0, ambush: Math.random() < this.risk(from, to, guards) * 1.4, ambushed: false,
      owner: 'player', guards, cargo: items.map(([k, n]) => ({ k, n })), goods: items.map(([k, n]) => ({ k, n })), risk: this.risk(from, to, guards), sent: G.day, value: this.estimate(to, cargo) };
    G.caravans = G.caravans || []; G.caravans.push(c);
    UI.msg(`🐫 Sua caravana partiu de ${Diplo.name(from)} rumo a ${Diplo.name(to)} com ${items.map(([k, n]) => n + ' ' + ITEMS[k].name).join(', ')}. Risco de assalto: ${Math.round(c.risk * 100)}%.`, 'gold');
    Progress.add('caravansSent');
    return true;
  },
  // chegada: vende tudo no destino (se ninguém roubou pelo caminho)
  arrive(c) {
    let lost = 0;
    if (!c.ambushed && Math.random() < c.risk) {
      lost = Math.random() < 0.4 ? 1 : U.rnd(0.4, 0.8);
      for (const g of c.cargo) g.n = Math.floor(g.n * (1 - lost));
      this.robbed(c);
    }
    let gold = 0;
    for (const g of c.cargo) { if (g.n <= 0) continue; gold += this.sellPrice(c.to, g.k) * g.n; this.traded(c.to, g.k, g.n, 'sell'); }
    P.gold += gold;
    G.stats.caravanProfit = (G.stats.caravanProfit || 0) + gold;
    if (lost >= 1) UI.msg(`🏴 Bandidos saquearam toda a carga da sua caravana a caminho de ${Diplo.name(c.to)}!`, 'bad');
    else UI.msg(`🐫 Sua caravana chegou a ${Diplo.name(c.to)}${lost ? ' (bandidos levaram parte da carga)' : ''} e vendeu tudo por ${gold} 🪙.`, lost ? 'bad' : 'gold');
    Progress.diary(`🐫 Caravana para ${Diplo.name(c.to)}: ${gold} 🪙${lost ? ' (assaltada)' : ''}.`);
  },
  lost(c) {
    c.done = true;
    this.robbed(c);
    UI.msg(`🏴 Sua caravana foi destruída pelos bandidos! A carga se perdeu.`, 'bad');
  },
};
