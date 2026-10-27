'use strict';
// Mercenários e companhias livres: grupos com nome, capitão e tamanho próprios. Quem paga leva a companhia para a guerra
// (soma ao exército) ou para um golpe (segura a guarda real na porta da sala do trono). Pagamento atrasado dois
// meses: a companhia troca de lado (vai lutar pelo inimigo, se junta à família que trama contra você ou vira bando de
// saqueadores). Os reis guerreiros e as famílias golpistas também contratam.

const MERC_CO = [
  { id: 'lobo', name: 'Companhia do Lobo Cinzento', icon: '🐺', size: 14, q: 1, fee: 90, motto: 'Pagou, a matilha caça.' },
  { id: 'lancas', name: 'Lanças Negras', icon: '🗡️', size: 18, q: 0.9, fee: 100, motto: 'Mil lanças, um só preço.' },
  { id: 'corvos', name: 'Corvos de Ferro', icon: '🪶', size: 10, q: 1.35, fee: 115, motto: 'Onde passamos, só ficam os corvos.' },
  { id: 'leao', name: 'Bando do Leão de Ouro', icon: '🦁', size: 22, q: 0.85, fee: 125, motto: 'Ouro na mão, leão no campo.' },
  { id: 'pantano', name: 'Arqueiros do Pântano', icon: '🏹', size: 12, q: 1.1, fee: 85, motto: 'Nunca vimos o inimigo de perto.' },
  { id: 'errantes', name: 'Cavaleiros Errantes', icon: '🐎', size: 8, q: 1.5, fee: 135, motto: 'Sem senhor, sem pátria, sem medo.' },
];

const Mercs = {
  M() {
    const u = G.urban || (G.urban = {}); const m = u.merc || (u.merc = { co: {}, log: [] });
    for (const d of MERC_CO) if (!m.co[d.id]) m.co[d.id] = { size: d.size, loyal: 60, emp: null, unpaid: 0, since: 0, wins: 0, leader: null };
    return m;
  },
  def(id) { return MERC_CO.find(d => d.id === id); },
  co(id) { return this.M().co[id]; },
  leader(id) {
    const c = this.co(id); let p = c.leader !== null ? People.get(c.leader) : null;
    if (!p || !p.alive) { p = People.create({ rank: 'knight', civ: -1, home: { type: 'wild' }, age: U.rint(28, 55), trait: U.pick(['corajoso', 'orgulhoso', 'ganancioso', 'rabugento']) }); c.leader = p.id; }
    return p;
  },
  fee(id) { const d = this.def(id), c = this.co(id); return Math.round(d.fee + c.size * 3); },
  log(t) { const L = this.M().log; L.unshift({ day: G.day, t }); if (L.length > 14) L.length = 14; },
  empName(e) { if (e === null) return 'livre'; if (e === 'player') return 'você'; if (typeof e === 'number') return G.civs[e] ? G.civs[e].rulerName : '?'; const f = Families.get(+String(e).slice(2)); return f ? Families.name(f) : '?'; },
  mine() { return MERC_CO.filter(d => this.co(d.id).emp === 'player'); },
  // força de uma companhia (em soldados equivalentes)
  power(id) { const c = this.co(id), d = this.def(id); return Math.round(c.size * d.q); },
  hire(id) {
    const c = this.co(id), d = this.def(id), fee = this.fee(id);
    if (c.emp !== null) { UI.msg(`${d.name} já serve a ${this.empName(c.emp)}.`, 'bad'); return; }
    if ((c.grudge || -99) > G.day - 6) { UI.msg(`${d.name} não esqueceu o calote: não aceita o seu ouro tão cedo.`, 'bad'); return; }
    if (P.gold < fee) { UI.msg(`O primeiro mês custa ${fee} 🪙.`, 'bad'); return; }
    P.gold -= fee; c.emp = 'player'; c.unpaid = 0; c.since = G.day; c.loyal = Math.max(c.loyal, 55);
    const L = this.leader(id); this.log(`${d.icon} Você contratou ${d.name}.`);
    UI.msg(`${d.icon} ${d.name} (${c.size} homens, ${L.sex === 'f' ? 'capitã' : 'capitão'} ${L.name}) agora luta por você: ${fee} 🪙 por mês. "${d.motto}"`, 'gold', true);
  },
  dismiss(id) { const c = this.co(id), d = this.def(id); if (c.emp !== 'player') return; c.emp = null; this.log(`${d.icon} Você dispensou ${d.name}.`); UI.msg(`${d.icon} ${d.name} foi dispensada e procura outro patrão.`); },
  // soldados mercenários de quem luta (para as batalhas)
  soldiersOf(emp) { return MERC_CO.filter(d => this.co(d.id).emp === emp).reduce((a, d) => a + this.power(d.id), 0); },
  coupBonus(fam) { return MERC_CO.some(d => this.co(d.id).emp === 'f:' + fam) ? 0.15 : 0; },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const M = this.M();
    for (const d of MERC_CO) {
      const c = M.co[d.id];
      c.size = Math.min(d.size + 6, c.size + (c.size < d.size ? 2 : 0));
      if (c.emp === 'player') {
        const fee = this.fee(d.id), k = G.civs.find(x => x.ruler === 'player' && x.treasury >= fee);
        if (P.gold >= fee) { P.gold -= fee; c.unpaid = 0; c.loyal = Math.min(100, c.loyal + 4); Game.note(`${d.icon} Soldo de ${d.name}: −${fee} 🪙.`); }
        else if (k) { k.treasury -= fee; c.unpaid = 0; Game.note(`${d.icon} O tesouro de ${CIV_DEFS[k.id].short} pagou ${d.name}: −${fee} 🪙.`); }
        else { c.unpaid++; c.loyal -= 25; UI.msg(`${d.icon} Você não pagou ${d.name} (${c.unpaid}º mês). "${this.leader(d.id).name} está perdendo a paciência."`, 'bad', true); if (c.unpaid >= 2) this.betray(d.id); }
      } else if (typeof c.emp === 'number') {
        const ci = c.emp, k = G.civs[ci];
        if (!k || k.ruler === 'player' || k.anarchy || (!Diplo.warsOf(ci).length && Math.random() < 0.4)) { c.emp = null; continue; }
        const fee = this.fee(d.id); if (k.treasury >= fee) k.treasury -= fee; else { c.emp = null; this.log(`${d.icon} ${d.name} largou ${k.rulerName}: sem pagamento.`); }
      } else if (c.emp && String(c.emp).startsWith('f:')) {
        const f = Families.get(+c.emp.slice(2)); if (!f || f.wealth < 60 || Math.random() < 0.2) c.emp = null; else f.wealth -= 60;
      } else {
        // livres: reis em guerra (sobretudo os guerreiros) e famílias golpistas contratam
        const want = G.civs.filter(k => k.ruler === 'npc' && !k.anarchy && Diplo.warsOf(k.id).length && k.treasury > this.fee(d.id) * 2 && Math.random() < 0.15 * (typeof Personas !== 'undefined' && Personas.of(k.id) ? Personas.of(k.id).merc : 1));
        if (want[0]) { c.emp = want[0].id; c.since = G.day; this.log(`${d.icon} ${d.name} foi contratada por ${want[0].rulerName}.`); continue; }
        const pl = typeof Politics !== 'undefined' ? Politics.S().plots.find(x => Families.get(x.fam) && Families.get(x.fam).wealth > 300) : null;
        if (pl && Math.random() < 0.2) { c.emp = 'f:' + pl.fam; c.since = G.day; if (pl.known) this.log(`${d.icon} ${d.name} foi contratada pela ${Families.name(Families.get(pl.fam))}.`); }
      }
    }
  },
  // pagamento atrasado: a companhia troca de lado
  betray(id) {
    const c = this.co(id), d = this.def(id); c.unpaid = 0; c.grudge = G.day;
    const myWar = G.civs.filter(x => x.ruler === 'player').flatMap(x => Diplo.warsOf(x.id).map(w => w.a === x.id ? w.b : w.a)).find(o => G.civs[o] && G.civs[o].ruler !== 'player');
    const plot = typeof Reign !== 'undefined' && Reign.isKing() ? Reign.R().plots.find(x => x.kind === 'usurp' && x.fam !== undefined) : null;
    if (myWar !== undefined) { c.emp = myWar; UI.banner(`${d.icon} ${d.name} traiu você!`); UI.msg(`${d.icon} Sem pagamento, ${d.name} passou para o lado de ${G.civs[myWar].rulerName} na guerra contra você!`, 'bad', true); }
    else if (plot) { c.emp = 'f:' + plot.fam; UI.msg(`${d.icon} Sem pagamento, ${d.name} se vendeu para quem trama contra você no reino...`, 'bad', true); }
    else {
      c.emp = null; c.size = Math.max(4, Math.round(c.size * 0.7));
      const v = World.villages.find(x => x.lord === 'player' || (!x.free && G.civs[x.civ] && G.civs[x.civ].ruler === 'player')) || World.villages[0];
      if (v && typeof Bank !== 'undefined') { const s = Bank.campSpot(v); if (s) { Bank.B().camps.push({ x: s.x, y: s.y, ci: -1 }); Bank.addCamp(s.x, s.y); World.chunks = new Map(); } v.raid = { by: v.civ, until: G.day + ECON_DAYS }; v.ruin = Math.min(3, (v.ruin || 0) + 1); }
      UI.banner(`${d.icon} ${d.name} virou bando!`); UI.msg(`${d.icon} Sem pagamento, ${d.name} virou bando de saqueadores${v ? ` e atacou ${v.name}` : ''}!`, 'bad', true);
    }
    this.log(`💀 ${d.name} trocou de lado por falta de pagamento.`);
    Diplo.chronicle(`💀 ${d.name} abandonou ${G.name} ${G.surname || ''} por falta de pagamento.`, true);
  },
  // ---------------------------------------------------------------- janela
  page() {
    const M = this.M(), esc = UI.esc.bind(UI);
    const rows = MERC_CO.map(d => {
      const c = M.co[d.id], L = this.leader(d.id), mine = c.emp === 'player';
      return `<div class="card merc ${mine ? 'mine' : ''}"><div class="sec">${d.icon} ${esc(d.name)} <span>${mine ? '⚔️ luta por você' : c.emp === null ? 'livre' : 'serve a ' + esc(this.empName(c.emp))}</span></div>
        <p class="dt-desc">"${esc(d.motto)}" · ${L.sex === 'f' ? 'capitã' : 'capitão'} <b>${esc(L.name)}</b></p>
        <div class="merc-row"><span>👥 <b>${c.size}</b> homens</span><span>⭐ qualidade <b>${Math.round(d.q * 100)}%</b></span><span>⚔️ força <b>${this.power(d.id)}</b></span><span>🪙 <b>${this.fee(d.id)}</b>/mês</span><span>🤝 lealdade <b class="${c.loyal < 40 ? 'bad' : ''}">${Math.round(c.loyal)}</b></span>${c.unpaid ? `<span class="bad">⚠️ ${c.unpaid} mês sem soldo</span>` : ''}</div>
        <div class="act-row">${mine ? `<button data-act="mercOut" data-k="${d.id}">Dispensar</button><button data-act="tk" data-op="open" data-id="${L.id}">💬 Falar com ${L.sex === 'f' ? 'a capitã' : 'o capitão'}</button>` : c.emp === null ? `<button class="primary" data-act="mercHire" data-k="${d.id}" ${P.gold >= this.fee(d.id) ? '' : 'disabled'}>Contratar (${this.fee(d.id)} 🪙)</button>` : ''}</div></div>`;
    }).join('');
    return `<div class="card"><div class="sec">⚔️ Companhias livres</div><p class="dt-desc">Mercenários lutam por quem paga: somam ao seu exército nas guerras e, num golpe, seguram a guarda real na porta da sala do trono. O soldo sai do seu bolso (ou do tesouro do seu reino). Dois meses sem pagar e a companhia troca de lado: vai para o inimigo, para quem trama contra você ou vira bando de saqueadores.</p></div>
      <div class="merc-grid">${rows}</div>${M.log.length ? `<div class="card"><div class="sec">📒 Notícias das companhias</div>${M.log.slice(0, 8).map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${esc(l.t)}</div>`).join('')}</div>` : ''}`;
  },
};
UI.showMercs = function () { this.open('⚔️ Mercenários', `<div class="mercw">${Mercs.page()}</div>`, 'showMercs', [], 'Companhias livres para a guerra e para golpes'); };

{
  // nas guerras: as companhias de cada lado entram no exército
  const ao0 = War.armyOf.bind(War);
  War.armyOf = function (ci, cfg) {
    const a = ao0(ci, cfg); if (!a) return a;
    const mine = G.civs[ci] && G.civs[ci].ruler === 'player' || (G.warCall && G.warCall.side === ci && !G.warCall.own);
    const n = Mercs.soldiersOf(ci) + (mine ? Mercs.soldiersOf('player') : 0);
    if (n) { a.soldiers += Math.min(30, n); a.mercs = n; }
    return a;
  };
  // golpe contra você: a companhia da família golpista ataca junto
  const cs0 = Politics.coupStrike.bind(Politics);
  Politics.coupStrike = function (pl) {
    cs0(pl);
    if (!G.coup) return;
    const d = MERC_CO.find(x => Mercs.co(x.id).emp === 'f:' + pl.fam); if (!d) return;
    const k = Math.min(6, Math.ceil(Mercs.power(d.id) / 4)), m = Reign.main();
    for (let j = 0; j < k; j++) { const a = Math.random() * Math.PI * 2, s = freeSpotNear(P.x + Math.cos(a) * 8 * TILE, P.y + Math.sin(a) * 7 * TILE, 3 * TILE); const g = Game.spawn('guard', s.x, s.y, { civ: m.id, leash: 60, tag: 'coup' }); g.angry = true; g.target = P; g.aggroOv = 40; }
    UI.msg(`${d.icon} ${d.name} veio junto com os golpistas: ${k} mercenários a mais!`, 'bad', true);
  };
  // o seu golpe: a companhia segura parte da guarda real na porta
  const pp0 = Places.people.bind(Places);
  Places.people = function (src, d, L) {
    pp0(src, d, L);
    if (d.lay !== 'throne' || !G.civs[src.owner] || G.civs[src.owner].ruler === 'player') return;
    const n = Math.floor(Mercs.soldiersOf('player') / 5); if (!n) return;
    let k = 0; for (const e of G.ents) if (!e.dead && e.royalGuard && k < n) { e.dead = true; k++; }
    if (k) UI.msg(`⚔️ Os seus mercenários seguram ${k} guarda(s) real(is) na porta.`, 'gold');
  };
  // na taverna: as companhias livres
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showTavern') { const free = MERC_CO.filter(d => Mercs.co(d.id).emp === null); if (free.length || Mercs.mine().length) body += `<div class="card"><div class="sec">⚔️ Companhias livres <span>${free.length} procurando patrão</span></div><p class="dt-desc">${free.map(d => `${d.icon} ${UI.esc(d.name)}`).join(' · ') || 'Nenhuma livre agora.'}</p><button data-act="mercs">Ver as companhias</button></div>`; }
    return op0(title, body, fn, args, sub);
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Mercs.monthTick(); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'mercs') { UI.showMercs(); return; }
    if (a === 'mercHire') { Mercs.hire(d.k); UI.refresh(); return; }
    if (a === 'mercOut') { Mercs.dismiss(d.k); UI.refresh(); return; }
    return a0(a, d);
  };
}
