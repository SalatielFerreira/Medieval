'use strict';
// O caminho do dinheiro: tudo o que sai da sua bolsa para alguém entra na riqueza de quem recebe.
//  • Pessoa: a bolsa dela (a "Riqueza" da Ficha) — presente em dinheiro, recrutar, subornar, salário dos funcionários,
//    adiantamento de contrato, dote, parteira, favor de companheiro, soldo dos capangas, parcela de empréstimo.
//  • Vila: o caixa da vila (o mesmo das obras dos governadores) — doação, festa, comício, candidatura, pedágio do portão.
//  • Reino: o tesouro — compras sem comerciante (animais, cavalos, navio, viagem), inscrição no torneio.
//  • Família: a riqueza da casa — aliança, favor.
//  • Igreja: o padre da vila (ou o tesouro do reino, onde não há padre) — doação, bênção, penitência, missa, dízimo,
//    casamento; a esmola vai para os mendigos da vila.
const Money = {
  n(x) { return Math.max(0, Math.round(x || 0)); },
  toPerson(p, x) { const n = this.n(x); if (p && n) p.purse = People.purse(p) + n; return n; },
  // dividido entre várias pessoas (o resto da divisão vai para a primeira)
  toPeople(list, x) { const n = this.n(x), L = (list || []).filter(Boolean); if (!n || !L.length) return 0; const each = Math.floor(n / L.length); L.forEach((p, i) => this.toPerson(p, each + (i ? 0 : n - each * L.length))); return n; },
  toRealm(ci, x) { const n = this.n(x), c = G.civs[ci]; if (c && !c.dead && n) c.treasury += n; return n; },
  toVillage(vi, x) { const n = this.n(x); if (n && World.villages[vi]) NpcWorks.addFund(vi, n); return n; },
  toFamily(f, x) { const n = this.n(x); if (f && n) f.wealth = (f.wealth || 0) + n; return n; },
  // onde você está: a vila mais perto (até um pouco fora dela) e o reino do chão (ou o da vila mais perto)
  here() { return { x: Math.floor(P.x / TILE), y: Math.floor(P.y / TILE) }; },
  villageHere() { const h = this.here(); return Urban.villageNear(h.x, h.y, VILLAGE_R + 6); },
  realmHere() {
    const h = this.here(), t = World.inb(h.x, h.y) ? World.terr[World.idx(h.x, h.y)] : -1;
    if (t >= 0 && G.civs[t] && !G.civs[t].dead) return t;
    let b = -1, bd = 1e9; World.villages.forEach(v => { if (!v || v.free) return; const d = U.dist(h.x, h.y, v.x, v.y); if (d < bd) { bd = d; b = v.civ; } });
    return b;
  },
  // compra sem comerciante: o tesouro do reino de onde você está (como nas lojas sem dono)
  toMarket(x) { return this.toRealm(this.realmHere(), x); },
  // a igreja: o padre da vila de onde você está; sem padre, o tesouro do reino
  toChurch(x, vi) {
    const v = vi !== undefined && vi !== null && vi >= 0 ? vi : this.villageHere(), pr = v >= 0 ? Faith.priestOf(v) : null;
    return pr ? this.toPerson(pr, x) : this.toMarket(x);
  },
  // embrulha uma função: o que ela tirar da sua bolsa vai para quem `to` disser
  wrap(o, name, to) {
    const f = o && o[name]; if (typeof f !== 'function') return;
    o[name] = function (...a) { const g0 = P.gold, r = f.apply(this, a), paid = g0 - P.gold; if (paid > 0) { try { to(paid, a, r); } catch (e) { console.error(e); } } return r; };
  },
};

// o caixa da vila (também usado pelas obras dos governadores da IA)
NpcWorks.addFund = function (vi, n) { const st = this.state(vi); st.fund = (st.fund || 0) + Math.round(n); return st.fund; };
NpcWorks.fundOf = function (vi) { return World.villages[vi] ? Math.round(this.state(vi).fund || 0) : 0; };

{
  // pessoas
  Money.wrap(People, 'giveGold', (n, [p]) => Money.toPerson(p, n));
  Money.wrap(People, 'recruit', (n, [p]) => Money.toPerson(p, n));
  Money.wrap(People, 'bribe', (n, [p]) => Money.toPerson(p, n));
  Money.wrap(Court, 'arrange', (n, [, p]) => { const f = p && Families.get(p.fam); if (f) Money.toFamily(f, n); else Money.toPerson(p, n); }); // o dote vai para a casa da noiva (ou do noivo)
  // salário dos funcionários dos seus empreendimentos
  const aw0 = Biz.addWages.bind(Biz);
  Biz.addWages = function (s, n) { const r = aw0(s, n); if (n > 0) Money.toPeople(this.workers(s), n); return r; };
  // vila
  Money.wrap(Politics, 'donate', (n, [vi]) => Money.toVillage(vi, n));
  Money.wrap(Society, 'run', (n, [vi]) => Money.toVillage(vi, n));
  Money.wrap(Society, 'campaign', (n, [vi]) => Money.toVillage(vi, n));
  Money.wrap(Politics, 'party', (n, [vi]) => Money.toVillage(vi, n));
  Money.wrap(Society, 'banquet', n => { const vi = Money.villageHere(); if (vi >= 0) Money.toVillage(vi, n); else Money.toMarket(n); });
  // compras sem comerciante
  Money.wrap(Farm, 'buyAnimal', n => Money.toMarket(n));
  if (typeof Horses !== 'undefined') Money.wrap(Horses, 'buy', n => Money.toMarket(n));
  Money.wrap(Ride, 'buy', n => Money.toMarket(n));
  // igreja
  for (const k of ['donate', 'bless', 'confess', 'requiem']) Money.wrap(Faith, k, n => Money.toChurch(n));
  Money.wrap(Faith, 'wed', (n, [, vi]) => Money.toChurch(n, vi));
  Money.wrap(Faith, 'alms', (n, [vi]) => { const poor = vi !== undefined && vi !== null ? People.residents(vi).filter(q => q.rank === 'beggar') : []; if (poor.length) Money.toPeople(poor, n); else Money.toVillage(vi, n); });
}
