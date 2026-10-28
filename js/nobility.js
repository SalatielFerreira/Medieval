'use strict';
// Poder da nobreza e deixar o poder.
//  • Cada título vale mais dentro do reino que o concedeu (as vantagens se somam, do Cavaleiro ao Duque):
//      voz nas eleições das vilas do reino, feudos (vilas que pagam renda ao nobre, saída do tesouro do reino),
//      relação com a coroa que cresce sozinha, multas menores (o Duque não paga multa no reino) e, para o Duque,
//      o direito de erguer muralha e portão em qualquer vila do reino.
//  • Deixar o poder: na página "Coroa e títulos" do Portfólio você renuncia ao trono de um reino, ao governo de uma
//    vila (o morador mais respeitado assume até a próxima eleição) ou a um título de nobreza.
const NOBLE_POWERS = [
  // por título: [voz nas eleições, vilas do feudo, relação por mês, desconto nas multas, ergue muralha nas vilas do reino]
  { voice: 8,  fiefs: 0, rel: 0, fine: 0,    walls: false },
  { voice: 16, fiefs: 1, rel: 0, fine: 0,    walls: false },
  { voice: 24, fiefs: 2, rel: 1, fine: 0.25, walls: false },
  { voice: 32, fiefs: 3, rel: 1, fine: 0.5,  walls: false },
  { voice: 40, fiefs: 4, rel: 2, fine: 1,    walls: true },
];
const FIEF_RENT = 3; // Salin por morador da vila do feudo, todo mês

const Nobility = {
  power(ci) { const l = Court.levelIn(ci); return l >= 0 ? NOBLE_POWERS[Math.min(l, NOBLE_POWERS.length - 1)] : null; },
  // o que o título dá, em palavras (para as janelas)
  lines(lvl) {
    const p = NOBLE_POWERS[lvl], t = NOBLE_TITLES[lvl], out = [];
    out.push(`🛒 ${Math.round((0.05 + lvl * 0.02) * 100)}% de desconto nas lojas do reino`);
    out.push(`🗳️ Voz nas eleições das vilas do reino (+${p.voice} de prestígio)`);
    if (t.caps) out.push(`⚔️ +${t.caps} capangas`);
    if (t.stipend) out.push(`💰 ${t.stipend} 🪙 por dia do rei`);
    if (p.fiefs) out.push(`🏘️ Feudo: ${p.fiefs} vila(s) do reino pagam ${FIEF_RENT} 🪙 por morador todo mês`);
    if (p.rel) out.push(`🤝 +${p.rel} de relação com a coroa por mês`);
    if (p.fine >= 1) out.push('⚖️ Foro de nobreza: não paga multa no reino'); else if (p.fine) out.push(`⚖️ Multas ${Math.round(p.fine * 100)}% menores no reino`);
    if (p.walls) out.push('🧱 Ergue muralha e portão em qualquer vila do reino');
    if (t.k === 'duke') out.push('👑 Pode reivindicar o trono');
    return out;
  },
  // as vilas do feudo: as mais cheias do reino (que não são suas)
  fiefsOf(ci) {
    const p = this.power(ci); if (!p || !p.fiefs || !G.civs[ci] || G.civs[ci].ruler === 'player') return [];
    return World.villages.map((v, i) => ({ v, i, n: People.residents(i).length })).filter(x => x.v && !x.v.free && !x.v.ruin && x.v.civ === ci && x.v.lord !== 'player')
      .sort((a, b) => b.n - a.n || a.i - b.i).slice(0, p.fiefs);
  },
  monthTick() {
    for (const ci of Court.titledCivs()) {
      const c = G.civs[ci], p = this.power(ci); if (!c || !p || c.ruler === 'player') continue;
      if (p.rel && !c.atWar) c.relation = Math.min(100, (c.relation || 0) + p.rel);
      const f = this.fiefsOf(ci); if (!f.length) continue;
      const due = f.reduce((a, x) => a + x.n * FIEF_RENT, 0), g = Math.min(due, Math.max(0, Math.round(c.treasury - 100)));
      if (g > 0) { c.treasury -= g; P.gold += g; Game.note(`🏘️ Renda dos feudos em ${CIV_DEFS[ci].short} (${f.map(x => x.v.name).join(', ')}): +${g} 🪙.`); }
    }
  },
  // ---------------------------------------------------------------- deixar o poder
  leaveVillage(vi) {
    const v = World.villages[vi]; if (!v || v.lord !== 'player') return;
    const pool = Politics.pool(vi), p = pool.sort((a, b) => Politics.val(vi, b) - Politics.val(vi, a))[0];
    v.lord = undefined;
    if (p) { v.chief = p.id; v.elected = p.id; v.lordFam = p.fam; }
    const E = Society.E(vi); E.next = G.day + 1; E.me = false;
    Families.refresh();
    UI.banner(`🏘️ Você deixou ${v.name}`);
    UI.msg(`🏘️ Você deixou o governo de ${v.name}.${p ? ` ${People.full(p)}, o morador mais respeitado, governa até a eleição do mês que vem.` : ' O conselho da vila governa até a eleição do mês que vem.'}`, 'gold', true);
    Progress.diary(`🏘️ Deixou o governo de ${v.name}.`);
    Diplo.chronicle(`🏘️ ${G.name} ${G.surname || ''} deixou o governo de ${v.name}.`, true);
    if (p) Rumors.atV(vi, `${p.name} assumiu o governo de ${v.name} depois que ${G.name} deixou o cargo.`);
    UI.refresh();
  },
  askVillage(vi) {
    const v = World.villages[vi]; if (!v || v.lord !== 'player') return;
    Dialog.confirm({ icon: '🏘️', title: `Deixar o governo de ${v.name}`, danger: true, ok: 'Deixar o cargo',
      text: `Você deixa de ser governador de ${v.name}: não recebe mais os impostos e aluguéis da vila nem pode mexer nas obras e muralhas dela. O morador mais respeitado assume até a eleição do mês que vem (você pode se candidatar de novo).` }, () => this.leaveVillage(vi));
  },
  askTitle(ci) {
    const l = Court.levelIn(ci); if (l < 0) return;
    Dialog.confirm({ icon: NOBLE_TITLES[l].icon, title: `Renunciar ao título de ${Court.titleName(l, ci)}`, danger: true, ok: 'Renunciar',
      text: `Você devolve o título a ${G.civs[ci].ruler === 'player' ? 'você mesmo' : G.civs[ci].rulerName} e perde todos os poderes dele em ${CIV_DEFS[ci].name} (renda, feudos, voz e desconto). Para tê-lo de novo, será preciso pedir outra vez, do começo.` },
      () => { Court.loseTitle('você renunciou', ci); Game.addRelation(ci, -3); UI.refresh(); });
  },
  // a página "Coroa e títulos": os poderes de cada título e os cargos que você pode deixar
  cardsHtml() {
    const esc = UI.esc.bind(UI), ruled = G.civs.filter(c => c.ruler === 'player'), vils = Urban.myVillages(), tit = Court.titledCivs();
    const pw = tit.length ? `<div class="card nb-pow"><div class="sec">⚜️ Poderes dos seus títulos</div>${tit.map(ci => { const l = Court.levelIn(ci), f = this.fiefsOf(ci);
      return `<div class="nb-t"><b>${NOBLE_TITLES[l].icon} ${esc(Court.titleName(l, ci))}</b><ul>${this.lines(l).map(x => `<li>${x}</li>`).join('')}</ul>${f.length ? `<small class="muted">Feudo agora: ${f.map(x => `${esc(x.v.name)} (${x.n})`).join(', ')}</small>` : ''}</div>`; }).join('')}</div>`
      : `<div class="card nb-pow"><div class="sec">⚜️ O que cada título dá</div><small class="muted">Peça no castelo de um reino. Cada título vale no reino que o concedeu, e os poderes se somam:</small>${NOBLE_TITLES.map((t, l) => `<div class="nb-t"><b>${t.icon} ${P.sex === 'f' ? t.f : t.m}</b><ul>${this.lines(l).slice(1).map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>`;
    const rows = [
      ...ruled.map(c => `<div class="nb-row"><span>${Heraldry.armsSvg(c.id, 16)} Soberano de <b>${CIV_DEFS[c.id].short}</b></span><button class="danger" data-act="abdicate" data-c="${c.id}">👑 Renunciar ao trono</button></div>`),
      ...vils.map(({ v, i }) => `<div class="nb-row"><span>🏘️ Governador de <b>${esc(v.name)}</b></span><button class="danger" data-act="nbLeaveV" data-v="${i}">Deixar o governo</button></div>`),
      ...tit.map(ci => `<div class="nb-row"><span>${NOBLE_TITLES[Court.levelIn(ci)].icon} <b>${esc(Court.titleName(Court.levelIn(ci), ci))}</b></span><button class="danger" data-act="nbLeaveT" data-c="${ci}">Renunciar ao título</button></div>`),
    ];
    const leave = `<div class="card nb-leave"><div class="sec">🏳️ Deixar o poder</div>${rows.length ? rows.join('') : '<small class="muted">Você não tem trono, vila nem título para deixar.</small>'}</div>`;
    return pw + leave;
  },
};

{
  // voz nas eleições: o título no reino da vila soma prestígio
  const sc0 = Politics.score.bind(Politics);
  Politics.score = function (vi, who) {
    const r = sc0(vi, who), v = World.villages[vi];
    if (who === 'player' && v && !v.free) { const p = Nobility.power(v.civ); if (p) r.f += p.voice; }
    return r;
  };
  // multas menores (e nenhuma para o Duque) no reino do título
  const cm0 = Crime.commit.bind(Crime);
  Crime.commit = function (ci, what, fine, ...rest) {
    const p = ci !== undefined && ci >= 0 ? Nobility.power(ci) : null;
    if (p && p.fine >= 1) { Game.note(`⚖️ Foro de nobreza: como ${Court.titleName(Court.levelIn(ci), ci)}, ninguém em ${CIV_DEFS[ci].short} ousa cobrar multa de você.`); return false; }
    return cm0(ci, what, p && p.fine ? Math.round(fine * (1 - p.fine)) : fine, ...rest);
  };
  // o Duque ergue muralha e portão em qualquer vila do reino
  const wa0 = Gate.wallAuthErr.bind(Gate);
  Gate.wallAuthErr = function (tx, ty, what) {
    const e = wa0(tx, ty, what); if (!e) return e;
    const v = World.villages[Urban.villageNear(tx, ty, GATE_REACH)];
    const p = v && !v.free ? Nobility.power(v.civ) : null;
    return p && p.walls ? null : e;
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Nobility.monthTick(); };
  // a página "Coroa e títulos" do Portfólio ganha os poderes e o "Deixar o poder"
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { const h = kp0(nav); return nav === 'crown' ? h + Nobility.cardsHtml() : h; };
  // o cartão do título no castelo mostra o que o próximo título dá
  const tc0 = UI.titleCard.bind(UI);
  UI.titleCard = function (ci) {
    const h = tc0(ci), r = Court.nextReq(ci); if (!r) return h;
    return h.replace(`<p class="dt-desc">Vantagens: ${r.t.perks}.</p>`, `<p class="dt-desc">Poderes no reino como ${P.sex === 'f' ? r.t.f : r.t.m}:</p><ul class="nb-ul">${Nobility.lines(r.lvl).map(x => `<li>${x}</li>`).join('')}</ul>`);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'nbLeaveV') { Nobility.askVillage(+d.v); return; }
    if (a === 'nbLeaveT') { Nobility.askTitle(+d.c); return; }
    return a0(a, d);
  };
}
// os textos dos títulos acompanham os poderes novos
NOBLE_TITLES.forEach((t, l) => { t.perks = Nobility.lines(l).join(' · '); });
