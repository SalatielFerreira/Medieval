'use strict';
// Imposto dos moradores: todo mês cada morador adulto de uma vila paga ao reino a taxa definida pelo rei (sai do bolso
// dele: é o dinheiro que a arrecadação do reino já conta). Você também paga: cada casa sua dentro de um reino que você
// não governa paga a taxa do rei daquele reino (casa maior, imposto maior). Sem ouro para pagar, o rei se irrita.
const TAX_HOUSE = { hut: 0.6, cabin: 1, lodge: 1.2, farmhouse: 1.2, house: 1.5, townhouse: 1.8, manor: 2.5, villa: 3, mansion: 3.5, palacete: 4.5 };
const Taxes = {
  S() { const u = G.urban || (G.urban = {}); return u.taxes || (u.taxes = { last: null, owed: {} }); },
  // valor por morador e por casa: a taxa do rei (0% a 50%) vira moedas
  perHead(c) { return Math.round((c.tax || 0) * 40); },
  isHome(s) { return !!s && s.owner === 'player' && !s.removed && (['cabin', 'house', 'manor', 'hut'].includes(s.type) || (BUILDINGS[s.type] && BUILDINGS[s.type].home)); },
  realmOf(s) { if (!World.terr) return -1; const ci = World.terr[World.idx(s.x + (s.w >> 1), s.y + (s.h >> 1))]; return ci >= 0 && G.civs[ci] && !G.civs[ci].dead && !G.civs[ci].anarchy ? ci : -1; },
  // o que você deve neste mês, reino por reino
  mine() {
    const out = {};
    for (const s of World.structs) {
      if (!this.isHome(s)) continue;
      const ci = this.realmOf(s); if (ci < 0 || G.civs[ci].ruler === 'player') continue;
      const n = Math.max(1, Math.round(this.perHead(G.civs[ci]) * (TAX_HOUSE[s.type] || 1.5)));
      const o = out[ci] || (out[ci] = { ci, n: 0, houses: 0 }); o.n += n; o.houses++;
    }
    return Object.values(out);
  },
  monthTick() {
    // os moradores pagam do próprio bolso
    let heads = 0;
    World.villages.forEach((v, vi) => {
      if (!v || v.free || v.ruin) return; const c = G.civs[v.civ]; if (!c || c.dead || c.anarchy) return;
      const t = this.perHead(c); if (t <= 0) return;
      for (const p of People.residents(vi)) { if (!p.alive || p.age < 18 || p.kin || p.capanga) continue; const pu = People.purse(p); if (pu >= t) { p.purse = pu - t; heads++; } }
    });
    // e você, pelas suas casas
    const S = this.S(), bill = this.mine(); let paid = 0, missed = [];
    for (const b of bill) {
      const c = G.civs[b.ci];
      if (P.gold >= b.n) { P.gold -= b.n; c.treasury += b.n; paid += b.n; }
      else { missed.push(b); Game.addRelation(b.ci, -4); }
    }
    S.last = { day: G.day, heads, paid, bill: bill.map(b => ({ ci: b.ci, n: b.n, houses: b.houses })), missed: missed.map(b => b.ci) };
    if (paid) Game.note(`🏛️ Imposto das suas casas: −${paid} 🪙 (${bill.filter(b => !missed.includes(b)).map(b => `${CIV_DEFS[b.ci].short} ${b.n}`).join(', ')}).`);
    for (const b of missed) UI.msg(`🏛️ Você não pagou o imposto de ${b.n} 🪙 das suas casas em ${CIV_DEFS[b.ci].short}: o rei não gostou.`, 'bad', true);
  },
};
{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Taxes.monthTick(); } catch (e) { console.error(e); } };
  // ao construir uma casa num reino que não é seu: avisa o imposto
  const pb0 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function (...a) {
    const n0 = World.structs.length, r = pb0(...a);
    try { for (const s of World.structs.slice(n0)) if (Taxes.isHome(s)) { const ci = Taxes.realmOf(s); if (ci >= 0 && G.civs[ci].ruler !== 'player') UI.msg(`🏛️ Esta casa fica em ${CIV_DEFS[ci].short}: você paga ${Math.max(1, Math.round(Taxes.perHead(G.civs[ci]) * (TAX_HOUSE[s.type] || 1.5)))} 🪙 por mês de imposto ao rei (taxa de ${Math.round(G.civs[ci].tax * 100)}%).`, 'gold'); } } catch (e) { console.error(e); }
    return r;
  };
}
