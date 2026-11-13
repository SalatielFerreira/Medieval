'use strict';
// Imposto dos moradores: todo mês cada morador adulto de uma vila paga ao reino a taxa definida pelo rei (sai do bolso
// dele: é o dinheiro que a arrecadação do reino já conta). Você também paga: cada imóvel seu (casa, empreendimento,
// oficina, criação, baú...) dentro de um reino que você não governa paga por mês uma taxa ao reino, conforme o imposto
// do rei e o tamanho do imóvel. Sem ouro para pagar, o rei se irrita.
const TAX_HOUSE = { hut: 0.6, cabin: 1, lodge: 1.2, farmhouse: 1.2, house: 1.5, townhouse: 1.8, manor: 2.5, villa: 3, mansion: 3.5, palacete: 4.5 };
const Taxes = {
  S() { const u = G.urban || (G.urban = {}); return u.taxes || (u.taxes = { last: null, owed: {} }); },
  // valor por morador e por casa: a taxa do rei (0% a 50%) vira moedas
  perHead(c) { return Math.round((c.tax || 0) * 40); },
  isHome(s) { return !!s && s.owner === 'player' && !s.removed && (['cabin', 'house', 'manor', 'hut'].includes(s.type) || (BUILDINGS[s.type] && BUILDINGS[s.type].home)); },
  realmOf(s) { if (!World.terr) return -1; const ci = World.terr[World.idx(s.x + (s.w >> 1), s.y + (s.h >> 1))]; return ci >= 0 && G.civs[ci] && !G.civs[ci].dead && !G.civs[ci].anarchy ? ci : -1; },
  // o peso de cada imóvel na taxa: casa pelo tamanho; empreendimento 2 (banco 4); oficina 0,8; criação e plantação 0,6;
  // baú 0,2 a 0,3; estábulo e o resto 0,5. Com a licença de comércio do reino, o empreendimento paga metade.
  weight(s) {
    const k = s.type;
    if (TAX_HOUSE[k] !== undefined) return TAX_HOUSE[k];
    if (typeof BIZ_TYPES !== 'undefined' && BIZ_TYPES[k]) return (k === 'biz_bank' ? 4 : 2) * (typeof Fin !== 'undefined' && Fin.hasLicense(this.realmOf(s)) ? 0.5 : 1);
    if (k === 'chest') return 0.2; if (k === 'big_chest' || k === 'cellar') return 0.3;
    const cat = typeof Cid !== 'undefined' ? Cid.buildCat(k) : null;
    return cat === 'producao' ? 0.8 : cat === 'fazenda' ? 0.6 : 0.5;
  },
  // imóvel seu que paga taxa: dentro de um reino que você não governa (rei) e fora das vilas que você governa
  taxed(s) {
    if (!s || s.owner !== 'player' || s.removed || !BUILDINGS[s.type] || ['pcastle', 'road', 'wall_wood', 'wall_stone'].includes(s.type)) return -1;
    const ci = this.realmOf(s); if (ci < 0 || G.civs[ci].ruler === 'player') return -1;
    if (Urban.authority(s.x + (s.w >> 1), s.y + (s.h >> 1))) return -1;
    return ci;
  },
  fee(s, ci) { return Math.max(1, Math.round(this.perHead(G.civs[ci]) * this.weight(s))); },
  // o que você deve neste mês, reino por reino
  mine() {
    const out = {};
    for (const s of World.structs) {
      const ci = this.taxed(s); if (ci < 0) continue;
      const o = out[ci] || (out[ci] = { ci, n: 0, houses: 0 }); o.n += this.fee(s, ci); o.houses++;
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
    if (paid) Game.note(`🏛️ Taxa dos seus imóveis: −${paid} 🪙 (${bill.filter(b => !missed.includes(b)).map(b => `${CIV_DEFS[b.ci].short} ${b.n}`).join(', ')}).`);
    for (const b of missed) UI.msg(`🏛️ Você não pagou a taxa de ${b.n} 🪙 dos seus imóveis em ${CIV_DEFS[b.ci].short}: o rei não gostou.`, 'bad', true);
  },
};
{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Taxes.monthTick(); } catch (e) { console.error(e); } };
  // ao construir uma casa num reino que não é seu: avisa o imposto
  const pb0 = Game.placeBuilding.bind(Game);
  Game.placeBuilding = function (...a) {
    const n0 = World.structs.length, r = pb0(...a);
    try { for (const s of World.structs.slice(n0)) { const ci = Taxes.taxed(s); if (ci >= 0) UI.msg(`🏛️ Este imóvel fica em ${CIV_DEFS[ci].short}: você paga ${Taxes.fee(s, ci)} 🪙 por mês de taxa ao reino (imposto de ${Math.round(G.civs[ci].tax * 100)}%).`, 'gold'); } } catch (e) { console.error(e); }
    return r;
  };
}
