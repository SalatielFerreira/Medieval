'use strict';
// A vida dos seus filhos depois dos 18 anos:
//  • 🏡 Aos 18, cada filho sai de casa e vai morar numa vila (a mais perto da sua casa no reino da sua cidadania; os
//    irmãos se espalham pelas vilas vizinhas). Lá ele constrói a própria casa, como todo morador, e segue na sua família
//    (a mesma casa nas Grandes Casas): os filhos dos seus filhos continuam a família.
//  • 💼 A profissão que você escolheu vira o ofício dele (Cavaleiro, Comerciante, Ferreiro; os outros viram camponeses).
//  • 💍 Ele se casa com quem quiser (como os outros moradores) ou com quem você arranjar; a esposa vai morar com ele.
//  • 🏘️ Pode ser eleito governador da vila, 🏛️ ser chamado para a corte do rei do reino onde mora (um dos quatro cargos)
//    e 👑 tomar o trono: os mais ambiciosos tramam golpes sozinhos (você fica sabendo e pode financiar ou pedir que
//    desistam), e na conversa você mesmo pode mandar tramar. Se der certo, ele vira rei; se falhar, vai preso ou morre.
//  • Na família (Portfólio → Família) cada filho mostra o que faz da vida: onde mora, o ofício, a corte, o trono.
const Grown = {
  AGE: 18, COUP_AGE: 20,
  CAREER: { knight: 'knight', merchant: 'merchant', smith: 'smith', farmer: 'peasant', governor: 'peasant', scholar: 'peasant' },
  mine(p) { return !!p && p.alive && p.kin === 'child' && !!p.grown; },
  list() { return G.people.filter(p => this.mine(p)); },
  // um neto: filho de um dos seus filhos
  grand(p) { return !!p && !p.kin && (p.parents || []).some(id => { const q = G.people[id]; return q && q.kin === 'child'; }); },
  realmOf(p) { const ci = Families.civOf(p); return ci >= 0 && G.civs[ci] && !G.civs[ci].dead ? ci : -1; },
  king(p) { return G.civs.find(c => c && !c.dead && c.rulerId === p.id && c.ruler !== 'player') || null; },
  // a vila onde vai morar: perto da sua casa, no reino da sua cidadania (ou a mais perto, se você é livre)
  pickVillage() {
    const ci = typeof Cid !== 'undefined' ? Cid.get() : -1, hx = (G.spawn ? G.spawn.x : P.x) / TILE, hy = (G.spawn ? G.spawn.y : P.y) / TILE;
    const vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.ruin);
    const mine = ci >= 0 ? vs.filter(x => x.v.civ === ci && !x.v.free) : [];
    const L = (mine.length ? mine : vs).sort((a, b) => U.dist(a.v.x, a.v.y, hx, hy) - U.dist(b.v.x, b.v.y, hx, hy));
    if (!L.length) return -1;
    return L[Math.min(L.length - 1, this.list().length % 3)].i; // os irmãos se espalham pelas três vilas mais perto
  },
  // sair de casa aos 18
  emancipate(p) {
    if (!p || p.grown || p.capanga || !p.alive) return false;
    p.grown = true; p.ambition = p.ambition || ({ orgulhoso: 2, ganancioso: 1.8, corajoso: 1.4 }[p.trait] || 1) * U.rnd(0.7, 1.3);
    if (p.home.type !== 'player') return true; // já mora em outro lugar (casou fora, refém, trono...)
    const vi = this.pickVillage(); if (vi < 0) return true;
    const v = World.villages[vi];
    p.home = { type: 'village', idx: vi }; p.civ = v.free ? -1 : v.civ;
    if (p.rank === 'peasant' || p.rank === 'child') p.rank = this.CAREER[p.prof] || 'peasant';
    p.purse = Math.max(People.purse(p), 150);
    const sp = typeof p.spouse === 'number' ? G.people[p.spouse] : null;
    if (sp && sp.alive && sp.home.type === 'player') { sp.home = { type: 'village', idx: vi }; sp.civ = p.civ; }
    for (const q of [p, sp]) { const e = q && G.spawned.get(q.id); if (e) { e.dead = true; G.spawned.delete(q.id); } }
    if (typeof Perf !== 'undefined' && Perf.resDirty) Perf.resDirty();
    UI.msg(`🏡 ${p.name} fez ${p.age} anos e saiu de casa: vai viver em ${v.name}${v.free ? '' : ` (${CIV_DEFS[v.civ].short})`} como ${RANKS[p.rank][p.sex].toLowerCase()} e construir a própria casa. Agora tem a vida ${p.sex === 'f' ? 'dela' : 'dele'}.`, 'gold', true);
    Progress.diary(`🏡 ${p.name} saiu de casa e foi viver em ${v.name}.`);
    return true;
  },
  // o que o filho faz da vida (para a família e a conversa)
  role(p) {
    const k = this.king(p); if (k) return `👑 ${p.sex === 'f' ? 'Rainha' : 'Rei'} de ${CIV_DEFS[k.id].short}`;
    if (p.rank === 'consort') return `👑 ${RANKS.consort[p.sex]} de ${CIV_DEFS[p.civ] ? CIV_DEFS[p.civ].short : '?'}`;
    const seat = typeof Politics !== 'undefined' ? Politics.seatOf(p) : null;
    const vi = Chiefdom.vilOf(p), v = vi >= 0 ? World.villages[vi] : null;
    const parts = [seat && KING_CIRCLE[seat] ? `${KING_CIRCLE[seat][2]} ${KING_CIRCLE[seat][p.sex === 'f' ? 1 : 0]}` : null, v ? `🏘️ governa ${v.name}` : null, RANKS[p.rank] ? RANKS[p.rank][p.sex] : '', p.home.type === 'village' ? `mora em ${World.villages[p.home.idx].name}` : null, p.coup ? '🗡️ tramando um golpe' : null];
    return parts.filter(Boolean).join(' · ');
  },
  // as etiquetas curtas da árvore da família
  tags(p) {
    const k = this.king(p); if (k) return [`👑 ${p.sex === 'f' ? 'Rainha' : 'Rei'} de ${CIV_DEFS[k.id].short}`];
    const out = [], seat = typeof Politics !== 'undefined' ? Politics.seatOf(p) : null, vi = Chiefdom.vilOf(p);
    if (p.rank === 'consort') out.push(`👑 ${RANKS.consort[p.sex]}`);
    if (seat && KING_CIRCLE[seat]) out.push(`${KING_CIRCLE[seat][2]} ${KING_CIRCLE[seat][p.sex === 'f' ? 1 : 0].replace(' do Rei', '')} de ${CIV_DEFS[p.civ] ? CIV_DEFS[p.civ].short : '?'}`);
    if (vi >= 0) out.push(`🏘️ governa ${World.villages[vi].name}`);
    if (p.coup) out.push('🗡️ tramando um golpe');
    if (p.jail > G.day) out.push('⛓️ preso');
    if (!out.length && p.home.type === 'village') out.push(`🏡 ${RANKS[p.rank] ? RANKS[p.rank][p.sex] : ''} em ${World.villages[p.home.idx].name}`);
    return out;
  },
  // ---------------------------------------------------------------- a corte
  courtTick(p) {
    const ci = this.realmOf(p), c = ci >= 0 ? G.civs[ci] : null;
    if (!c || c.ruler === 'player' || p.age < 22 || this.king(p) || p.rank === 'consort' || Politics.seatOf(p)) return;
    const ch = 0.05 + (p.rank === 'knight' ? 0.08 : 0) + Math.min(0.1, (p.fame || 0) / 400) + (Chiefdom.vilOf(p) >= 0 ? 0.05 : 0);
    if (Math.random() > ch) return;
    const cc = Politics.circle(ci), seats = Object.keys(KING_CIRCLE), seat = p.rank === 'knight' && Math.random() < 0.5 ? 'general' : U.pick(seats);
    p.civ = ci; cc[seat] = p.id; delete p.bribed; People.addAff(p, 3);
    const t = `🏛️ ${p.name}, ${p.sex === 'f' ? 'sua filha' : 'seu filho'}, foi chamad${p.sex === 'f' ? 'a' : 'o'} para a corte de ${CIV_DEFS[ci].short}: agora é ${KING_CIRCLE[seat][p.sex === 'f' ? 1 : 0]}.`;
    UI.msg(t, 'gold', true); Progress.diary(t);
  },
  // ---------------------------------------------------------------- o golpe
  canCoup(p) {
    if (!this.mine(p)) return 'não é seu filho adulto';
    if (p.age < this.COUP_AGE) return `precisa ter ${this.COUP_AGE} anos`;
    if (this.king(p)) return 'já é rei';
    if (p.capanga) return 'está com você (dispense primeiro)';
    if (p.jail > G.day) return 'está preso';
    const ci = this.realmOf(p), c = ci >= 0 ? G.civs[ci] : null;
    if (!c || c.anarchy || c.rulerId == null) return 'mora num lugar sem rei';
    if (c.ruler === 'player') return 'o reino é seu';
    return null;
  },
  strength(p) {
    const ci = this.realmOf(p), seat = typeof Politics !== 'undefined' ? Politics.seatOf(p) : null, f = Families.of(p);
    return 10 + (seat ? 25 : 0) + (seat === 'general' ? 10 : 0) + (p.rank === 'knight' ? 10 : 0) + (Chiefdom.vilOf(p) >= 0 ? 10 : 0) + (p.fame || 0) / 4
      + ((p.coup && p.coup.fund) || 0) / 150 + Math.min(30, ((f && f.wealth) || 0) / 400) + (ci >= 0 && G.civs[ci].happy < 35 ? 10 : 0);
  },
  chance(p) {
    const ci = this.realmOf(p), c = ci >= 0 ? G.civs[ci] : null; if (!c) return 0;
    const def = 15 + (c.garrison || 0) * 1.2 + (c.happy || 50) / 5;
    const s = this.strength(p); return U.clamp(s / (s + def), 0.05, 0.9);
  },
  plot(p, by) {
    const why = this.canCoup(p); if (why) return why;
    if (p.coup) return 'já está tramando';
    const ci = this.realmOf(p);
    p.coup = { ci, since: G.day, ripe: G.day + (by === 'player' ? 2 : 3), fund: 0, by };
    return null;
  },
  fund(p, n) {
    if (!p.coup) return false; if (P.gold < n) { UI.msg(`O golpe precisa de ${n.toLocaleString('pt-BR')} 🪙.`, 'bad'); return false; }
    P.gold -= n; p.coup.fund += n; Sound.play('coin'); return true;
  },
  resolve(p) {
    const ci = p.coup.ci, c = G.civs[ci]; p.coup = null;
    if (!c || c.dead || c.ruler === 'player') return;
    if (this.canCoup(p) || this.realmOf(p) !== ci) return;
    const ch = this.chance(p), king = People.get(c.rulerId), old = c.rulerName;
    if (Math.random() < ch && king && king.alive) {
      People.die(king, `derrubado pelo golpe de ${p.name}`);
      for (const q of G.people) if (q.alive && q.rank === 'ruler' && q.civ === ci && q !== p) q.rank = 'knight';
      const cc = Politics.S().circle[ci]; if (cc) for (const s in cc) if (cc[s] === p.id) delete cc[s];
      if (Chiefdom.vilOf(p) >= 0) { const v = World.villages[Chiefdom.vilOf(p)]; delete v.elected; v.chief = undefined; }
      Succession.seat(c, p, 'ruler');
      const sp = typeof p.spouse === 'number' ? G.people[p.spouse] : null; if (sp && sp.alive) { sp.rank = 'consort'; sp.home = { type: 'castle', civ: ci }; sp.civ = ci; const e = G.spawned.get(sp.id); if (e) { e.dead = true; G.spawned.delete(sp.id); } }
      if (typeof Heraldry !== 'undefined' && Heraldry.apply) Heraldry.apply();
      c.happy = Math.max(0, (c.happy || 50) - 6); Game.addRelation(ci, 20); People.addAff(p, 10); Court.addFame(8);
      const t = `👑 Golpe em ${CIV_DEFS[ci].name}! ${p.name}, ${p.sex === 'f' ? 'sua filha' : 'seu filho'}, derrubou ${old} e agora é ${p.sex === 'f' ? 'rainha' : 'rei'}.`;
      UI.banner(`👑 ${p.name} tomou o trono de ${CIV_DEFS[ci].short}`); UI.msg(t, 'gold', true); Progress.diary(t);
      Diplo.chronicle(`🗡️ ${old} caiu num golpe em ${CIV_DEFS[ci].name}: ${People.full(p)} subiu ao trono.`, true);
    } else {
      Game.addRelation(ci, -15);
      if (Math.random() < 0.5) {
        People.die(p, 'executado depois de um golpe fracassado');
        UI.msg(`⚰️ O golpe de ${p.name} contra ${old} fracassou (chance era ${Math.round(ch * 100)}%): ${p.sex === 'f' ? 'ela foi executada' : 'ele foi executado'}.`, 'bad', true);
      } else {
        p.jail = G.day + 6; const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); }
        const cc = Politics.S().circle[ci]; if (cc) for (const s in cc) if (cc[s] === p.id) delete cc[s];
        UI.msg(`⛓️ O golpe de ${p.name} contra ${old} fracassou (chance era ${Math.round(ch * 100)}%): ${p.sex === 'f' ? 'ela está presa' : 'ele está preso'} por 6 meses e perdeu o cargo na corte.`, 'bad', true);
      }
      Progress.diary(`🗡️ O golpe de ${p.name} em ${CIV_DEFS[ci].short} fracassou.`);
    }
  },
  ambitionTick(p) {
    if (p.coup) { if (G.day >= p.coup.ripe) this.resolve(p); return; }
    if (this.canCoup(p)) return;
    const seat = Politics.seatOf(p), amb = (p.ambition || 1) * (1 + (seat ? 1.5 : 0) + (p.rank === 'knight' ? 0.5 : 0) + (Chiefdom.vilOf(p) >= 0 ? 0.5 : 0));
    if (Math.random() > 0.012 * amb) return;
    if (this.plot(p, 'self')) return;
    UI.msg(`🗡️ ${p.name}, ${p.sex === 'f' ? 'sua filha' : 'seu filho'}, está tramando tomar o trono de ${CIV_DEFS[p.coup.ci].short} (em ${p.coup.ripe - G.day} meses, chance hoje ${Math.round(this.chance(p) * 100)}%). Converse com ${p.sex === 'f' ? 'ela' : 'ele'} para financiar o golpe ou pedir que desista.`, 'gold', true);
  },
  monthTick() {
    for (const p of G.people) if (p.alive && p.kin === 'child' && !p.grown && p.age >= this.AGE && !p.capanga) this.emancipate(p);
    for (const p of this.list()) { try { this.courtTick(p); this.ambitionTick(p); } catch (e) { console.error(e); } }
  },
};

{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Grown.monthTick(); } catch (e) { console.error(e); } };
  // o título: o ofício de verdade (a profissão de quando morava em casa fica para trás)
  const ti0 = People.title.bind(People);
  People.title = function (p) { if (p && p.grown && p.prof) { const pr = p.prof; p.prof = null; try { return ti0(p); } finally { p.prof = pr; } } return ti0(p); };
  // na árvore da família: o que cada filho adulto faz da vida
  if (typeof Arvore !== 'undefined') {
    const cd0 = Arvore.card.bind(Arvore);
    Arvore.card = function (q, o) {
      if (!Grown.mine(q)) return cd0(q, o);
      const pr = q.prof; q.prof = null;
      try {
        const h = cd0(q, o), t = Grown.tags(q).map(x => `<i class="av-t">${UI.esc(x)}</i>`).join('');
        return h.includes('<span class="av-tags">') ? h.replace('<span class="av-tags">', '<span class="av-tags">' + t) : h.replace('</small></span>', `</small><span class="av-tags">${t}</span></span>`);
      } finally { q.prof = pr; }
    };
  }
  // "Seu neto"
  const rl0 = People.relation.bind(People);
  People.relation = function (p) { if (Grown.grand(p)) return { text: p.sex === 'm' ? 'Seu neto' : 'Sua neta', col: '#ffd54a' }; return rl0(p); };
  // casamento arranjado de um filho que já mora sozinho: a esposa vai morar com ele
  const ar0 = Court.arrange.bind(Court);
  Court.arrange = function (child, p) { const r = ar0(child, p); if (r !== false && child && child.grown && child.sex === 'm' && child.home.type !== 'player' && p.home.type === 'player') { p.home = { ...child.home }; p.civ = child.civ; } return r; };
  // na conversa: tramar, financiar ou desistir do golpe
  const lac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    lac0(p, acts);
    if (!Grown.mine(p)) return;
    if (p.coup) { acts.push(['gcFund', `💰 Financiar o golpe (1.000 🪙) · chance ${Math.round(Grown.chance(p) * 100)}%`]); acts.push(['gcStop', '🛑 Desistir do golpe']); }
    else if (!Grown.canCoup(p)) acts.push(['gcPlot', `👑 Tomar o trono de ${CIV_DEFS[Grown.realmOf(p)].short} · chance ${Math.round(Grown.chance(p) * 100)}%`]);
  };
  const tka0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    const p = d && ['gcFund', 'gcStop', 'gcPlot'].includes(d.op) ? People.get(+d.id) : null;
    if (!p) return tka0(d);
    let r;
    if (d.op === 'gcPlot') { const why = Grown.plot(p, 'player'); r = why ? { text: 'Agora não dá.', note: why } : { text: `Contava com isso. Em ${p.coup.ripe - G.day} meses o trono de ${CIV_DEFS[p.coup.ci].short} é nosso.`, note: `Golpe tramado: chance hoje ${Math.round(Grown.chance(p) * 100)}%. Financie para aumentar (cargo na corte, ser cavaleiro, governar uma vila e a riqueza da família também ajudam).` }; }
    else if (d.op === 'gcFund') { r = Grown.fund(p, 1000) ? { text: 'Com esse ouro compro espadas e silêncio.', note: `Golpe financiado: ${p.coup.fund.toLocaleString('pt-BR')} 🪙 · chance ${Math.round(Grown.chance(p) * 100)}%.` } : { text: 'Sem ouro, sem golpe.', note: 'Falta ouro.' }; }
    else { p.coup = null; r = { text: 'Está bem... por enquanto.', note: 'Desistiu do golpe.' }; }
    this.showTalk(p.id, r);
  };
}
