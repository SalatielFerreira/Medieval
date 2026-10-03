'use strict';
// A corte dos reis: com reconhecimento suficiente num reino, o rei convida o herói para a corte.
// Na corte: salário, um cargo (conselheiro, tesoureiro, general ou embaixador), audiências com o rei
// e a obrigação de aparecer no castelo de tempos em tempos. Só se serve a uma corte por vez.

const COURT_INVITE = { renown: 40, rel: 40 };
const COURT_ABSENCE = { warn: 3 * ECON_DAYS, expel: 5 * ECON_DAYS }; // meses sem aparecer no castelo
const COURT_AUDIENCE_DAYS = ECON_DAYS; // uma audiência por mês
const COURT_OFFICES = {
  advisor:   { name: 'Conselheiro do Rei',  f: 'Conselheira do Rei',  icon: '📜', renown: 40, pay: 20, desc: 'Aconselha o rei: +2 de serviço prestado e +1 de relação por mês.' },
  treasurer: { name: 'Tesoureiro Real',     f: 'Tesoureira Real',     icon: '💰', renown: 60, pay: 30, desc: 'Cuida do tesouro: o reino arrecada 10% a mais e você recebe uma parte.' },
  general:   { name: 'General do Rei',      f: 'Generala do Rei',     icon: '⚔️', renown: 70, pay: 30, desc: 'Comanda a guarnição: +1 soldado por ciclo e você pode pedir escolta ao rei.' },
  diplomat:  { name: 'Embaixador',          f: 'Embaixadora',         icon: '🤝', renown: 80, pay: 25, desc: 'Representa o reino: melhora as relações e pode propor ao rei alianças, paz ou guerra.' },
};

const RoyalCourt = {
  C() { return G.courtier || null; },
  isMember(ci) { const c = this.C(); return !!c && c.civ === ci; },
  // reconhecimento num reino: serviços prestados + fama + relação
  renown(ci) {
    const c = G.civs[ci];
    return Math.round(Court.service(ci) + Court.fame() / 5 + Math.max(0, c.relation) / 5);
  },
  canBeInvited(ci) {
    const c = G.civs[ci];
    return c.ruler !== 'player' && !c.atWar && c.relation >= COURT_INVITE.rel && this.renown(ci) >= COURT_INVITE.renown && !this.isMember(ci);
  },
  officeName(k) { const o = COURT_OFFICES[k]; return P.sex === 'f' ? o.f : o.name; },

  // uma vez por mês: convites, salário, efeitos do cargo e a obrigação de aparecer
  tick() {
    const cur = this.C();
    // convite pendente vence em 3 meses
    if (G.courtInvite && (G.day - G.courtInvite.day > 3 * ECON_DAYS || !this.canBeInvited(G.courtInvite.civ))) G.courtInvite = null;
    if (!G.courtInvite) {
      const cands = G.civs.filter(c => this.canBeInvited(c.id) && (!G.courtRefused || !G.courtRefused[c.id] || G.day - G.courtRefused[c.id] > 6 * ECON_DAYS))
        .sort((a, b) => this.renown(b.id) - this.renown(a.id));
      if (cands.length && Math.random() < 0.6) this.invite(cands[0].id);
    }
    if (!cur) return;
    const c = G.civs[cur.civ];
    if (c.ruler === 'player') { this.leave('agora você é o próprio rei', true); return; }
    if (c.atWar || c.relation < 10) { this.leave(c.atWar ? 'você está em guerra com o reino' : 'o rei perdeu a confiança em você'); return; }
    const away = G.day - cur.lastVisit;
    if (away > COURT_ABSENCE.expel) { this.leave('você sumiu do castelo por tempo demais'); Game.addRelation(cur.civ, -10); return; }
    if (away > COURT_ABSENCE.warn) UI.msg(`👑 ${c.rulerName} estranha a sua ausência na corte de ${CIV_DEFS[cur.civ].short}. Apareça no castelo logo (${daysText(COURT_ABSENCE.expel - away)}).`, 'bad');
    // salário e o efeito do cargo
    const o = COURT_OFFICES[cur.office], fc = Game.civForecast(c);
    const pay = Math.min(o.pay + Math.floor(this.renown(cur.civ) / 20) * 5, Math.max(0, c.treasury - 40));
    if (pay > 0) { c.treasury -= pay; P.gold += pay; Game.note(`👑 Salário de ${this.officeName(cur.office)} de ${CIV_DEFS[cur.civ].short}: +${pay} 🪙.`); }
    Court.addService(cur.civ, 2);
    if (cur.office === 'advisor') Game.addRelation(cur.civ, 1);
    if (cur.office === 'treasurer') { const g = Math.round(fc.income * 0.1); c.treasury += g; const cut = Math.round(g * 0.3); if (cut > 0) { P.gold += cut; Game.note(`💰 Sua parte como tesoureiro: +${cut} 🪙.`); } }
    if (cur.office === 'general' && c.garrison < Game.maxGarrison(c)) c.garrison++;
    if (cur.office === 'diplomat') for (const other of G.civs) if (other.id !== cur.civ) Diplo.addRel(cur.civ, other.id, 0.6);
  },
  invite(ci) {
    G.courtInvite = { civ: ci, day: G.day };
    const c = G.civs[ci], other = this.C();
    UI.msg(`👑 ${c.rulerName} convida você para a corte de ${CIV_DEFS[ci].short}!`, 'gold', true);
    Dialog.confirm({ icon: '👑', title: 'Convite da corte',
      text: `${c.rulerName} reconhece seus serviços e convida você para fazer parte da corte de ${CIV_DEFS[ci].name}. Na corte você recebe salário, ganha um cargo e tem a atenção do rei, mas precisa aparecer no castelo pelo menos a cada ${COURT_ABSENCE.warn} dias.${other ? ` Você deixará a corte de ${CIV_DEFS[other.civ].short}.` : ''}`,
      ok: 'Aceitar o convite', cancel: 'Responder depois' }, () => this.join(ci));
  },
  join(ci) {
    if (!G.courtInvite || G.courtInvite.civ !== ci) return false;
    const old = this.C();
    if (old && old.civ !== ci) this.leave(`você aceitou servir a ${CIV_DEFS[ci].short}`, true);
    G.courtier = { civ: ci, office: 'advisor', since: G.day, lastVisit: G.day, audience: -99 };
    G.courtInvite = null;
    Game.addRelation(ci, 5);
    UI.banner(`👑 Membro da corte de ${CIV_DEFS[ci].short}`);
    UI.msg(`Você agora é ${this.officeName('advisor')} de ${CIV_DEFS[ci].short}. Com mais reconhecimento, peça outros cargos no castelo.`, 'gold');
    Progress.diary(`👑 Entrou para a corte de ${CIV_DEFS[ci].short}.`);
    Diplo.chronicle(`👑 ${G.name} ${G.surname} entrou para a corte de ${Diplo.name(ci)}.`);
    Sound.play('levelup');
    return true;
  },
  decline(ci) {
    G.courtInvite = null;
    G.courtRefused = G.courtRefused || {}; G.courtRefused[ci] = G.day;
    UI.msg(`Você recusou o convite da corte de ${CIV_DEFS[ci].short}.`);
  },
  leave(why, quiet) {
    const cur = this.C();
    if (!cur) return;
    G.courtier = null;
    UI.msg(`👑 Você deixou a corte de ${CIV_DEFS[cur.civ].short} — ${why}.`, quiet ? '' : 'bad');
    Progress.diary(`👑 Deixou a corte de ${CIV_DEFS[cur.civ].short} (${why}).`);
  },
  // aparecer no castelo conta como presença na corte
  visit(ci) { const c = this.C(); if (c && c.civ === ci) c.lastVisit = G.day; },
  setOffice(k) {
    const cur = this.C(), o = COURT_OFFICES[k];
    if (!cur || !o || this.renown(cur.civ) < o.renown) return;
    cur.office = k;
    UI.msg(`${o.icon} Você agora é ${this.officeName(k)} de ${CIV_DEFS[cur.civ].short}.`, 'gold');
  },
  // audiência com o rei: um presente ou favor (uma vez por mês)
  audience() {
    const cur = this.C();
    if (!cur || G.day - cur.audience < COURT_AUDIENCE_DAYS) return;
    cur.audience = G.day;
    const c = G.civs[cur.civ], r = Math.random();
    if (r < 0.4) { const g = Math.min(U.rint(60, 150), Math.max(0, c.treasury - 50)); P.gold += g; UI.msg(`👑 ${c.rulerName} agradece seus conselhos com ${g} 🪙.`, 'gold'); }
    else if (r < 0.7) { const it = U.pick(['iron_sword', 'chainmail', 'silver_ring', 'steel_bar', 'wine', 'spices']); Inv.add(it, 1); UI.msg(`👑 ${c.rulerName} presenteia você com ${ITEMS[it].icon} ${ITEMS[it].name}.`, 'gold'); }
    else { Court.addService(cur.civ, 5); Court.addFame(3); UI.msg(`👑 ${c.rulerName} elogia você diante de toda a corte (+5 de serviço, +3 de fama).`, 'gold'); }
    Game.addRelation(cur.civ, 2);
  },
  // general: um soldado do rei passa a seguir você
  escort() {
    const cur = this.C();
    if (!cur || cur.office !== 'general') return;
    const c = G.civs[cur.civ];
    if (c.garrison <= 2 || Game.allies().length >= Game.followerCap()) return;
    c.garrison--; Game.newMercenary(cur.civ);
    UI.msg('⚔️ Um soldado do rei agora acompanha você.', 'gold');
  },
  // embaixador: propõe ao rei uma aliança, a paz ou uma guerra contra outro reino
  propose(other, act) {
    const cur = this.C();
    if (!cur || cur.office !== 'diplomat') return;
    const a = cur.civ, rel = Diplo.rel(a, other), king = G.civs[a].rulerName;
    const chance = act === 'ally' ? (rel >= 30 ? 0.75 : 0.25) : act === 'peace' ? 0.6 : rel < -20 ? 0.6 : 0.2;
    if (Math.random() > chance) { UI.msg(`👑 ${king} ouve a proposta, mas não concorda.`, 'bad'); Game.addRelation(a, -1); return; }
    if (act === 'ally' && !Diplo.allied(a, other) && !Diplo.atWar(a, other)) Diplo.ally(a, other);
    if (act === 'peace' && Diplo.atWar(a, other)) Diplo.makePeace(a, other, `negociada por ${G.name}`);
    if (act === 'war' && !Diplo.atWar(a, other) && G.civs[other].ruler !== 'player') Diplo.declareWar(a, other, `conselho de ${G.name}`);
    Court.addService(a, 3);
    UI.msg(`👑 ${king} aceita a sua proposta.`, 'gold');
  },
};
