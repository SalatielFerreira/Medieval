'use strict';
// A personalidade de cada rei da IA muda como o reino vive: impostos, gastos, banco, guerra, golpes e leis.
// Vem do jeito de ser do rei (o traço) e muda quando outro rei assume. Assim o mundo muda mesmo sem você.

const PERSONAS = {
  gastador:  { name: 'Gastador',  icon: '💸', tax: 0.15, war: 1,   peace: 1,   plot: 1.6, merc: 0.6, coup: 0,     laws: ['vinho', 'caca'],     desc: 'Festas, palácios e banquetes: gasta mais do que arrecada e vive pedindo ao banco. Pode quebrar o reino.' },
  guerreiro: { name: 'Guerreiro', icon: '⚔️', tax: 0.13, war: 3,   peace: 0.4, plot: 1,   merc: 1.6, coup: -0.12, laws: ['armas', 'combate'],  desc: 'Quer glória: mais soldados, mais guerras e mercenários. Esmaga golpes com mão de ferro.' },
  prudente:  { name: 'Prudente',  icon: '⚖️', tax: 0.1,  war: 0.4, peace: 2.5, plot: 0.8, merc: 0.4, coup: -0.05, laws: ['feira', 'escola'],   desc: 'Poupa, paga as dívidas em dia e evita guerras. O tesouro cresce devagar e sempre.' },
  devoto:    { name: 'Devoto',    icon: '🙏', tax: 0.08, war: 0.6, peace: 1.6, plot: 0.6, merc: 0.3, coup: 0,     laws: ['duelos', 'culto'],   desc: 'Impostos baixos e doações aos templos: o povo o ama e as famílias tramam menos.' },
};
const TRAIT_PERSONA = { ganancioso: 'gastador', orgulhoso: 'gastador', alegre: 'gastador', romantico: 'gastador', corajoso: 'guerreiro', rabugento: 'guerreiro', desconfiado: 'prudente', leal: 'prudente', timido: 'prudente', gentil: 'devoto' };

const Personas = {
  of(ci) {
    const c = G.civs[ci]; if (!c || c.ruler === 'player') return null;
    if (!c.persona || !PERSONAS[c.persona]) this.pick(c);
    return PERSONAS[c.persona];
  },
  pick(c) {
    const k = c.rulerId !== null && c.rulerId !== undefined ? People.get(c.rulerId) : null;
    const keys = Object.keys(PERSONAS);
    c.persona = (k && TRAIT_PERSONA[k.trait]) || keys[(c.id * 7 + (k ? k.id : 0)) % keys.length];
    c.laws = PERSONAS[c.persona].laws.slice();
  },
  plotMul(ci) { const p = this.of(ci); return p ? p.plot : 1; },
  coupMod(ci) { const p = this.of(ci); return p ? p.coup : 0; },
  // todo mês, depois da economia de cada reino da IA
  monthCiv(c) {
    const P0 = this.of(c.id); if (!P0 || c.anarchy) return;
    c.tax = U.clamp((c.tax || 0.1) + (P0.tax - (c.tax || 0.1)) * 0.3, 0.04, 0.3);
    const K = typeof Bank !== 'undefined' ? Bank.K(c.id) : null;
    if (c.persona === 'gastador') {
      if (c.treasury > 300) { const g = Math.round(c.treasury * U.rnd(0.08, 0.18)); c.treasury -= g; c.happy = Math.min(100, c.happy + g / 120); }
      if (K && Math.random() < 0.1) { const n = U.rint(100, 250); K.debt += n; K.reserve = Math.max(0, K.reserve - n); }
      if (K && Math.random() < 0.015) { const n = U.rint(500, 900); K.debt += n; K.reserve = Math.max(0, K.reserve - n); Diplo.chronicle(`💸 ${c.rulerName} pediu ${n} moedas ao banco para ${U.pick(['um palácio de verão', 'o casamento da filha', 'um banquete de sete dias', 'uma estátua de ouro'])}.`); }
    } else if (c.persona === 'prudente') {
      if (K && K.debt > 0 && c.treasury > 100) { const n = Math.min(K.debt, Math.round(c.treasury * 0.3)); c.treasury -= n; K.debt -= n; K.reserve += n; }
    } else if (c.persona === 'devoto') {
      if (c.treasury > 120) { const g = Math.round(c.treasury * 0.05); c.treasury -= g; c.happy = Math.min(100, c.happy + 1.5); }
    } else if (c.persona === 'guerreiro') {
      if (c.garrison < Game.maxGarrison(c) && c.treasury > 120) { c.garrison++; c.treasury -= 60; }
    }
  },
  // guerra e paz conforme o rei
  warTick() {
    for (const c of G.civs) {
      const P0 = this.of(c.id); if (!P0 || c.anarchy) continue;
      if (Math.random() < 0.025 * P0.war && Diplo.warsOf(c.id).length < 2) {
        const foes = G.civs.filter(o => o.id !== c.id && !Diplo.atWar(c.id, o.id) && Diplo.rel(c.id, o.id) < 0 && o.ruler !== 'player' && !Diplo.allied(c.id, o.id)).sort((a, b) => a.garrison - b.garrison);
        if (foes[0]) Diplo.declareWar(c.id, foes[0].id, U.pick(['cobiça por suas terras', 'um insulto no torneio', 'vingança antiga', 'disputa de fronteira']));
      }
      for (const w of Diplo.warsOf(c.id)) if (G.day - (w.since || G.day) > 3 && Math.random() < 0.05 * P0.peace) { const o = w.a === c.id ? w.b : w.a; if (G.civs[o].ruler !== 'player') Diplo.makePeace(w.a, w.b, `${c.rulerName} quis a paz`); }
    }
  },
};

{
  const tc0 = Game.tickCiv.bind(Game);
  Game.tickCiv = function (c) { const r = tc0(c); if (c.ruler === 'npc') Personas.monthCiv(c); return r; };
  const dt0 = Diplo.tickDay.bind(Diplo);
  Diplo.tickDay = function (...a) { const r = dt0(...a); Personas.warTick(); return r; };
  // novo rei, nova personalidade
  const se0 = Succession.seat.bind(Succession);
  Succession.seat = function (c, p, rank) { const r = se0(c, p, rank); if (c) Personas.pick(c); return r; };
  const su0 = People.succeed.bind(People);
  People.succeed = function (ci, heir, old) { const r = su0(ci, heir, old); if (G.civs[ci] && G.civs[ci].ruler !== 'player') Personas.pick(G.civs[ci]); return r; };
  // no castelo dos outros: quem é o rei
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showCastle' && args && G.civs[args[0]] && G.civs[args[0]].ruler === 'npc') {
      const ci = args[0], c = G.civs[ci], P0 = Personas.of(ci);
      if (P0) body = `<div class="card persona"><div class="sec">${P0.icon} ${UI.esc(c.rulerName)} é ${P0.name.toLowerCase()} <span>personalidade do rei</span></div><p class="dt-desc">${P0.desc}</p>${c.laws && c.laws.length && typeof LAWS !== 'undefined' ? `<div class="persona-laws">${c.laws.map(k => LAWS[k] ? `<span>${LAWS[k].icon} ${LAWS[k].name}</span>` : '').join('')}</div>` : ''}</div>` + body;
    }
    return op0(title, body, fn, args, sub);
  };
}
