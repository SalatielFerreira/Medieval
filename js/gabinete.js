'use strict';
// O gabinete: cada cargo da corte de um rei da IA tem uma tarefa de verdade (no seu reino, quem manda em tudo é você):
//  ⚔️ General — manda nos soldados do rei: recruta com o tesouro, pede escolta e, quando o reino está em guerra,
//     é convocado todo mês para comandar o exército no campo de batalha (vencer traz a vila mais próxima do inimigo,
//     o resgate e a paz; perder custa ouro e uma vila, e o rei perde a confiança).
//  💰 Secretário do Tesouro — cuida da economia: a taxa dos impostos, os investimentos do reino (fazendas, serrarias,
//     pedreiras, minas, moradias e muralhas), as festas do povo e as dívidas com o banco. Todo mês o rei olha as contas.
//  📜 Conselheiro — escolhe as leis com o rei: propõe leis novas e o fim das que não servem (o rei aceita conforme a
//     amizade, o jeito dele e as sociedades secretas na corte). As leis dos reinos da IA agora valem de verdade.
//  🤝 Embaixador — alianças, paz e guerra com os outros reinos.
// A janela 🏛️ Corte e cidadania reúne tudo: 🪪 Cidadania · 🏛️ A corte (rei, cargos, exigências e as sociedades) · o
// seu cargo (a tarefa). Duas propostas, dois investimentos e um recrutamento por mês.
const GAB_LIMIT = { law: 2, invest: 2, recruit: 1, festival: 1, debt: 1 };
const GAB_FEST = 200, GAB_RECRUIT = 6;

const Gab = {
  esc(s) { return UI.esc(s); },
  arms(ci, sz) { return ci >= 0 && CIV_DEFS[ci] ? Heraldry.armsSvg(ci, sz) : `<span class="cd-free" style="font-size:${Math.round(sz * 0.7)}px">🏳️</span>`; },
  cur() { const c = RoyalCourt.C(); return c && G.civs[c.civ] && G.civs[c.civ].ruler !== 'player' ? c : null; },
  // o reino em que você é general (ou null)
  genOf() { const c = this.cur(); return c && c.office === 'general' && G.civs[c.civ].ruler === 'npc' && !Cid.ruled().length ? c.civ : null; },
  // o que já foi feito neste mês
  used(kind) { const c = this.cur(); return c && c.used && c.used.d === G.day ? c.used[kind] || 0 : 0; },
  use(kind) { const c = this.cur(); if (!c) return; if (!c.used || c.used.d !== G.day) c.used = { d: G.day }; c.used[kind] = (c.used[kind] || 0) + 1; },
  left(kind) { return Math.max(0, GAB_LIMIT[kind] - this.used(kind)); },
  log(t) { const c = this.cur(); if (!c) return; const L = c.log || (c.log = []); L.unshift({ day: G.day, t }); if (L.length > 10) L.length = 10; },
  // ---------------------------------------------------------------- ⚔️ general
  recruit() {
    const c = this.cur(); if (!c || c.office !== 'general' || !this.left('recruit')) return;
    const cv = G.civs[c.civ], g0 = cv.garrison;
    Game.kRecruit(c.civ, GAB_RECRUIT);
    if (cv.garrison > g0) { this.use('recruit'); Court.addService(c.civ, 1); this.log(`🪖 Recrutou ${cv.garrison - g0} soldados com o tesouro do rei.`); }
    else UI.msg('O tesouro (40 🪙 e 5 de trigo por soldado) ou a guarnição cheia não deixam recrutar agora.', 'bad');
    UI.refresh();
  },
  // ---------------------------------------------------------------- 💰 secretário do tesouro
  setTax(d) {
    const c = this.cur(); if (!c || c.office !== 'treasurer') return;
    const cv = G.civs[c.civ]; cv.secTax = U.clamp(Math.round(((cv.secTax !== undefined ? cv.secTax : cv.tax) + d) * 100) / 100, 0.04, 0.3); cv.tax = cv.secTax;
    UI.refresh();
  },
  invest(k) {
    const c = this.cur(); if (!c || c.office !== 'treasurer' || !this.left('invest')) return;
    const cv = G.civs[c.civ], lv = cv.invest[k];
    Game.invest(c.civ, k);
    if (cv.invest[k] > lv) { this.use('invest'); Court.addService(c.civ, 2); this.log(`${INVESTMENTS[k].icon} Investiu em ${INVESTMENTS[k].name} (nível ${cv.invest[k]}).`); }
    else UI.msg('O tesouro ou o estoque do reino não pagam este investimento.', 'bad');
    UI.refresh();
  },
  festival() {
    const c = this.cur(); if (!c || c.office !== 'treasurer' || !this.left('festival')) return;
    const cv = G.civs[c.civ]; if (cv.treasury < GAB_FEST + 50) { UI.msg('O tesouro não aguenta uma festa agora.', 'bad'); return; }
    cv.treasury -= GAB_FEST; cv.festival = (cv.festival || 0) + 10; this.use('festival');
    UI.msg(`🎉 Festa do povo em ${CIV_DEFS[c.civ].short} (−${GAB_FEST} 🪙 do tesouro): a felicidade sobe no fim do mês.`, 'gold'); this.log('🎉 Organizou uma festa do povo.');
    UI.refresh();
  },
  payDebt() {
    const c = this.cur(); if (!c || c.office !== 'treasurer' || !this.left('debt')) return;
    const cv = G.civs[c.civ], K = Bank.K(c.civ), n = Math.min(K.debt, Math.max(0, cv.treasury - 100));
    if (n <= 0) { UI.msg(K.debt ? 'O tesouro está baixo demais para pagar a dívida.' : 'O reino não deve nada ao banco.', 'bad'); return; }
    cv.treasury -= n; K.debt -= n; K.reserve += n; this.use('debt'); Court.addService(c.civ, 2);
    UI.msg(`🏦 ${n} 🪙 da dívida de ${CIV_DEFS[c.civ].short} com o banco foram pagos.`, 'gold'); this.log(`🏦 Pagou ${n} 🪙 da dívida do reino.`);
    UI.refresh();
  },
  // ---------------------------------------------------------------- 📜 conselheiro
  likes(ci, k) { const P0 = typeof Personas !== 'undefined' ? Personas.of(ci) : null; return !!P0 && P0.laws.includes(k); },
  lawChance(ci, k, enact) {
    const mine = Cid.mySoc(), king = Cid.king(ci), ks = king ? Cid.socOf(king) : null;
    let ch = 0.4 + Cid.kingAff(ci) / 200;
    if (this.likes(ci, k)) ch += enact ? 0.25 : -0.35;
    if (mine && ks === mine) ch += 0.2; else if (mine && ks) ch -= 0.1;
    if (mine) ch += 0.05 * (typeof Politics !== 'undefined' ? Politics.circlePeople(ci) : []).filter(x => Secret.isBro(x.p, mine)).length;
    return U.clamp(ch, 0.05, 0.95);
  },
  propose(k, enact) {
    const c = this.cur(); if (!c || c.office !== 'advisor' || !LAWS[k] || !this.left('law')) return;
    const cv = G.civs[c.civ], L = cv.laws || (cv.laws = []), king = cv.rulerName;
    if (enact && (L.includes(k) || L.length >= LAW_MAX)) return;
    if (!enact && !L.includes(k)) return;
    this.use('law');
    if (Math.random() < this.lawChance(c.civ, k, enact)) {
      if (enact) L.push(k); else cv.laws = L.filter(x => x !== k);
      Cid.addKingAff(c.civ, 2); Court.addService(c.civ, 2);
      UI.msg(`📜 ${king} aceitou o seu conselho: ${enact ? 'nova lei' : 'fim da lei'} "${LAWS[k].name}" em ${CIV_DEFS[c.civ].short}.`, 'gold', true);
      Diplo.chronicle(`📜 ${CIV_DEFS[c.civ].short}: ${enact ? 'nova lei' : 'acabou a lei'} "${LAWS[k].name}", a conselho de ${G.name}.`);
      this.log(`${LAWS[k].icon} ${enact ? 'Aprovou' : 'Revogou'} "${LAWS[k].name}".`);
    } else { Cid.addKingAff(c.civ, -1); UI.msg(`📜 ${king} ouviu, mas não quis ${enact ? 'a lei' : 'acabar com a lei'} "${LAWS[k].name}".`, 'bad'); this.log(`✖ O rei recusou ${enact ? '' : 'o fim de '}"${LAWS[k].name}".`); }
    UI.refresh();
  },
  // ---------------------------------------------------------------- ⚔️ a guerra comandada pelo general
  genFinish(win) {
    const B = G.place; if (!B || B.done) return; B.done = true;
    const side = B.side, enemy = B.enemy, myC = G.civs[side], foC = G.civs[enemy], king = myC.rulerName;
    const lostMine = B.fake ? 0 : B.start[side] - War.fighters(side).length, lostFoe = B.fake ? 0 : B.start[enemy] - War.fighters(enemy).length;
    const rep = { win, side, enemy, own: true, gen: true, lostMine, lostFoe, lines: [], knocked: !!B.knockedOut };
    G.warRest = G.warRest || {}; G.warRest[Diplo.pairKey(side, enemy)] = G.day + 1;
    const near = (vs, ci) => vs.reduce((b, x) => U.dist(x.x, x.y, World.capitals[ci].x, World.capitals[ci].y) < U.dist(b.x, b.y, World.capitals[ci].x, World.capitals[ci].y) ? x : b);
    if (win) {
      Game.gainXp(150 + lostFoe * 6); Progress.add('battlesWon'); Court.addFame(10);
      const loot = Math.min(foC.treasury, Math.round(foC.treasury * 0.4) + 80); foC.treasury -= loot; myC.treasury += loot;
      rep.lines.push(`💰 O rei inimigo pagou ${loot} 🪙 de resgate ao tesouro de ${CIV_DEFS[side].short}.`);
      const vs = Diplo.villagesOf(enemy);
      if (vs.length > 1) { const v = near(vs, side); Diplo.captureVillage(v, side, true); World.buildMinimap(); rep.lines.push(`🏴 ${v.name} passou para ${CIV_DEFS[side].short}.`); }
      if (Diplo.atWar(side, enemy)) Diplo.makePeace(side, enemy, `${CIV_DEFS[enemy].short} perdeu a batalha para o general ${G.name}`);
      rep.lines.push(`🕊️ ${CIV_DEFS[enemy].short} pediu a paz.`);
      myC.happy = Math.min(100, myC.happy + 8);
      const prize = 200 + Math.round(loot * 0.15); P.gold += prize; Game.addRelation(side, 10); Cid.addKingAff(side, 10); Court.addService(side, 12);
      rep.lines.push(`👑 ${king} premia o seu general: +${prize} 🪙, +10 de relação, +10 de amizade do rei e +10 de fama.`);
      Diplo.chronicle(`🏆 ${CIV_DEFS[side].short} venceu ${CIV_DEFS[enemy].short} numa grande batalha comandada pelo general ${G.name}.`, true);
      Progress.diary(`⚔️ Como general de ${CIV_DEFS[side].short}, venceu ${CIV_DEFS[enemy].short} (${lostFoe} inimigos caídos, ${lostMine} perdas).`);
      this.log(`🏆 Venceu ${CIV_DEFS[enemy].short} no campo de batalha.`);
    } else {
      if (B.surrendered) rep.lines.push('🏳️ Você se rendeu e deixou o campo de batalha com vida.');
      else rep.lines.push(rep.knocked ? '🩸 Você foi ferido e carregado para longe do campo.' : '🩸 O exército do rei foi destruído.');
      const toll = Math.round(myC.treasury * 0.3); myC.treasury -= toll; foC.treasury += toll; rep.lines.push(`💰 O inimigo levou ${toll} 🪙 do tesouro do rei.`);
      const vs = Diplo.villagesOf(side);
      if (vs.length > 1) { const v = near(vs, enemy); Diplo.captureVillage(v, enemy, true); World.buildMinimap(); rep.lines.push(`🔥 ${CIV_DEFS[enemy].short} tomou ${v.name}.`); }
      myC.happy = Math.max(0, myC.happy - 10);
      const a = B.surrendered ? 10 : 6; Cid.addKingAff(side, -a); Game.addRelation(side, -4); if (B.surrendered) Court.addFame(-5);
      rep.lines.push(`😞 ${king} esperava mais do general dele (−${a} de amizade do rei, −4 de relação).`);
      rep.lines.push('⚔️ A guerra continua: o inimigo voltará no mês que vem.');
      Diplo.chronicle(`💀 ${CIV_DEFS[enemy].short} derrotou ${CIV_DEFS[side].short} numa grande batalha.`, true);
      Progress.diary(`🩸 Como general de ${CIV_DEFS[side].short}, perdeu a batalha contra ${CIV_DEFS[enemy].short}.`);
      this.log(`💀 Perdeu para ${CIV_DEFS[enemy].short}.`);
    }
    War.leave();
    UI.showWarReport(rep);
  },
  // deixar o rei comandar a batalha deste mês (ela acontece sem você)
  delegate() {
    const wc = G.warCall; if (!wc || !wc.gen) return;
    G.warCall = null; War.badge(null); Cid.addKingAff(wc.side, -3);
    UI.msg(`🏳️ Você deixou ${G.civs[wc.side].rulerName} comandar a batalha deste mês (−3 de amizade do rei).`, 'bad');
    UI.close();
  },
};

// ====================================================================== você no círculo do rei
// O círculo do rei são os quatro cargos da corte: com um cargo, você ocupa a cadeira dele (quem estava ali sai do círculo
// enquanto você tiver o cargo: não aparece no castelo nem pode ser comprado, e volta quando você deixar o cargo).
const GAB_SEAT = { advisor: 'advisor', treasurer: 'treasurer', general: 'general', diplomat: 'diplomat' };
Object.assign(Gab, {
  mySeat(ci) { const c = this.cur(); return c && c.civ === ci ? GAB_SEAT[c.office] || null : null; },
  circleMe(ci) {
    const c = this.cur(); if (!c || c.civ !== ci) return null;
    const seat = GAB_SEAT[c.office] || null, cc = seat && typeof Politics !== 'undefined' ? Politics.S().circle[ci] : null, was = cc && cc[seat] !== undefined && G.people[cc[seat]] ? People.full(G.people[cc[seat]]) : null;
    return { seat, was, icon: COURT_OFFICES[c.office].icon, name: RoyalCourt.officeName(c.office) };
  },
});
if (typeof Politics !== 'undefined') {
  const cp0 = Politics.circlePeople.bind(Politics);
  Politics.circlePeople = function (ci) { const L = cp0(ci), seat = Gab.mySeat(ci); return seat ? L.filter(x => x.seat !== seat) : L; };
  const so0 = Politics.seatOf.bind(Politics);
  Politics.seatOf = function (p) { const seat = so0(p); return seat && p && Gab.mySeat(p.civ) === seat ? null : seat; };
}

// ====================================================================== a janela 🏛️ Corte e cidadania
Object.assign(Gab, {
  bar(v, max, cls) { return `<i class="cd-bar ${cls || ''}"><i style="width:${U.clamp(v / Math.max(1, max) * 100, 0, 100)}%"></i></i>`; },
  emb(k, sz) { const d = SECRET_SOC[k]; return d && Secret.emblem ? Secret.emblem(d, sz || 16) : ''; },
  // 🪪 cidadania
  cidPage() {
    const esc = this.esc.bind(this), me = Cid.get(), king = Cid.ruled().length > 0, cur = RoyalCourt.C();
    const hero = `<div class="cd-hero" style="--c:${me >= 0 ? Game.civColor(me) : '#8a7a5a'}"><div class="cd-harms">${this.arms(me, 52)}</div>
      <div class="cd-htx"><small>Sua cidadania</small><h3>${king ? `Rei de ${esc(Cid.name(me))}` : me >= 0 ? `Cidadão de ${esc(CIV_DEFS[me].name)}` : 'Livre, sem reino'}</h3>
        <p>${king ? 'Você é rei: a sua cidadania é o seu reino e, nele, quem manda em tudo é você.' : me >= 0 ? `Desde ${Calendar.short(Math.max(0, Cid.S().since))}. Cargo na corte e título de nobreza, só aqui.` : 'Escolha um reino para ser seu (sem cargo) ou ganhe a cidadania ao assumir um cargo ou um título.'}</p></div>
      <div class="cd-rules"><span>🪪 Cargo e título só no reino da cidadania</span><span>🔁 Trocar de cidadania = perder cargo e título</span><span>🏠 Casa e empreendimento: em qualquer reino (taxa por mês)</span><span>🔨 Oficina, criação e baú: terra livre e o seu reino</span>
        ${me >= 0 && !king ? '<button class="mini danger" data-act="cidSet" data-c="-1">🏳️ Renunciar</button>' : ''}</div></div>`;
    const bill = typeof Taxes !== 'undefined' ? Object.fromEntries(Taxes.mine().map(b => [b.ci, b])) : {};
    const cards = G.civs.filter(c => c && !c.dead).map(c => {
      const ci = c.id, mine = ci === me, own = c.ruler === 'player', aff = Cid.kingAff(ci), rel = Math.round(c.relation || 0), lv = Court.levelIn(ci);
      const btn = own ? '<span class="cd-tag ok">👑 Seu reino</span>' : mine ? '<span class="cd-tag ok">✔ Sua cidadania</span>' : king ? '' : c.atWar ? '<span class="cd-tag bad">⚔️ Em guerra com você</span>'
        : `<button class="${me < 0 ? 'primary' : ''}" data-act="cidSet" data-c="${ci}">🪪 ${me < 0 ? 'Tornar-me cidadão' : 'Mudar para cá'}</button>`;
      return `<div class="cd-k ${mine ? 'on' : ''}" style="--c:${Game.civColor(ci)}"><div class="cd-kh">${this.arms(ci, 30)}<div><b>${esc(CIV_DEFS[ci].short)}</b><small>${own ? 'você' : esc(c.rulerName)}</small></div></div>
        ${own ? '<div class="cd-kr"><span>👑 o rei é você</span></div>' : `<div class="cd-kr"><span>🤝 Reino</span>${this.bar(rel + 100, 200, rel >= COURT_REL ? 'ok' : '')}<b>${rel}</b></div>
        <div class="cd-kr"><span>👑 Rei</span>${this.bar(aff + 100, 200, aff >= COURT_NEED.advisor.aff ? 'ok' : '')}<b>${aff}</b></div>`}
        <div class="cd-kx">${bill[ci] ? `<em title="Taxa mensal dos seus imóveis neste reino">🏛️ ${bill[ci].houses} ${bill[ci].houses === 1 ? 'imóvel' : 'imóveis'} · ${bill[ci].n} 🪙/mês</em>` : ''}${lv >= 0 ? `<em>${NOBLE_TITLES[lv].icon} ${esc(P.sex === 'f' ? NOBLE_TITLES[lv].f : NOBLE_TITLES[lv].m)}</em>` : ''}${cur && cur.civ === ci ? `<em>${COURT_OFFICES[cur.office].icon} ${esc(RoyalCourt.officeName(cur.office))}</em>` : ''}</div>${btn}</div>`;
    }).join('');
    return `<div class="cd-pg">${hero}<div class="cd-kgrid">${cards}</div></div>`;
  },
  // o reino da página da corte: o da cidadania; livre, o escolhido (ou o mais perto de convidar)
  courtCiv() {
    const me = Cid.get(); if (me >= 0) return me;
    const sel = UI.sel.cdCiv; if (sel >= 0 && G.civs[sel] && G.civs[sel].ruler !== 'player' && !G.civs[sel].dead) return sel;
    const L = G.civs.filter(c => c && !c.dead && c.ruler !== 'player' && Cid.king(c.id));
    L.sort((a, b) => (Math.min(b.relation, 40) + Math.min(Cid.kingAff(b.id), 25)) - (Math.min(a.relation, 40) + Math.min(Cid.kingAff(a.id), 25)));
    return L.length ? L[0].id : -1;
  },
  // 🏛️ a corte
  courtPage() {
    const esc = this.esc.bind(this), ci = this.courtCiv(), me = Cid.get();
    if (ci < 0 || Cid.ruled().length) return `<div class="sv-none">👑<small>${Cid.ruled().length ? 'Você é rei: no seu reino você comanda tudo (Portfólio → Reinado). Não serve à corte de outro rei.' : 'Nenhum rei para servir agora.'}</small></div>`;
    const c = G.civs[ci], king = Cid.king(ci), cur = RoyalCourt.C(), member = RoyalCourt.isMember(ci), inv = G.courtInvite && G.courtInvite.civ === ci;
    const P0 = typeof Personas !== 'undefined' ? Personas.of(ci) : null, ks = king ? Cid.socOf(king) : null, aff = Cid.kingAff(ci);
    const pick = me < 0 ? `<div class="cd-pick"><small>Ver a corte de:</small>${G.civs.filter(x => x && !x.dead && x.ruler !== 'player').map(x => `<button class="${x.id === ci ? 'on' : ''}" data-act="cdCiv" data-c="${x.id}" title="${esc(CIV_DEFS[x.id].short)}">${this.arms(x.id, 18)}</button>`).join('')}</div>` : '';
    const status = member ? `<div class="cd-st ok">${COURT_OFFICES[cur.office].icon} Você é <b>${esc(RoyalCourt.officeName(cur.office))}</b> desde ${Calendar.short(cur.since2 || cur.since)}.</div>
        <div class="act-row"><button data-act="caudience" ${G.day - cur.audience >= COURT_AUDIENCE_DAYS ? '' : 'disabled'}>📜 Audiência com o rei</button><button class="danger" data-act="cleave">🚪 Deixar a corte</button></div>`
      : inv ? `<div class="cd-st gold">👑 ${esc(c.rulerName)} convidou você para a corte!</div><div class="act-row"><button class="primary" data-act="cjoin" data-c="${ci}">✔ Aceitar</button><button data-act="cdecline" data-c="${ci}">Recusar</button></div>`
      : `<div class="cd-st">${Cid.allows(ci) ? 'Você ainda não serve a esta corte.' : esc(Cid.why(ci))}</div>
        <div class="act-row"><button class="primary" data-act="cdAsk" data-c="${ci}" ${Cid.canHold(ci, 'advisor') ? '' : 'disabled'}>🏛️ Pedir um lugar na corte</button></div>`;
    const kingCard = `<div class="card cd-king" style="--c:${Game.civColor(ci)}"><div class="cd-kingh">${this.arms(ci, 40)}<div><small>${esc(CIV_DEFS[ci].name)}</small><b>${esc(c.rulerName)}</b>
        <span>${P0 ? `${P0.icon} ${P0.name}` : ''}${ks ? ` · ${this.emb(ks, 14)} ${esc(SECRET_SOC[ks].name)}` : ''}</span></div></div>
      <div class="cd-kr"><span>👑 Amizade do rei</span>${this.bar(aff + 100, 200, aff >= 0 ? 'ok' : 'bad')}<b>${aff}</b></div>
      <div class="cd-kr"><span>🤝 Relação com o reino</span>${this.bar((c.relation || 0) + 100, 200, (c.relation || 0) >= COURT_REL ? 'ok' : '')}<b>${Math.round(c.relation || 0)}</b></div>
      <div class="cd-kr"><span>⭐ Reconhecimento</span>${this.bar(RoyalCourt.renown(ci), 100, '')}<b>${RoyalCourt.renown(ci)}</b></div>${status}</div>`;
    const F = Cid.forces(ci), mine = Cid.mySoc(), notes = Cid.mods(ci).notes;
    const forces = `<div class="card cd-forces"><div class="sec">🕯️ Sociedades na corte</div>${F.length ? F.map(f => `<div class="cd-fr ${f.k === mine ? 'mine' : ''}">${this.emb(f.k, 18)}<div><b>${esc(f.d.name)}${f.k === mine ? ' · a sua' : ''}</b><small>${f.who.map(w => `${esc(w.role)}: ${esc(w.p.name)}`).join(' · ')}</small></div></div>`).join('') : '<small class="muted">Ninguém da corte é de uma sociedade secreta.</small>'}
      ${notes.map(([cl, t]) => `<div class="cd-note ${cl}">${t}</div>`).join('')}${mine ? '' : '<small class="muted cd-hint">Entrar para uma sociedade secreta (a do rei, de preferência) abre as portas da corte.</small>'}</div>`;
    const cc = typeof Politics !== 'undefined' ? Politics.circle(ci) : {};
    const offices = Object.entries(COURT_OFFICES).map(([k, o]) => {
      const ch = Cid.checks(ci, k).slice(0, 3), ok = Cid.canHold(ci, k), on = member && cur.office === k, hp = cc[k] !== undefined ? G.people[cc[k]] : null;
      return `<div class="cd-of ${on ? 'on' : ''} ${ok ? 'can' : ''}"><div class="cd-ofh"><span>${o.icon}</span><div><b>${esc(RoyalCourt.officeName(k))}</b><small>${o.task}</small></div></div>
        <small class="cd-hold ${on ? 'me' : ''}">${on ? '👤 Este cargo é seu' : hp && hp.alive ? `👤 Hoje: ${esc(People.full(hp))}${ok && member ? ' · você pode tomar o lugar' : ''}` : '👤 Vago'}</small>
        <small class="cd-ofd">${esc(o.desc)}</small>
        ${ch.map(([lab, good, v, need]) => `<div class="cd-req ${good ? 'ok' : 'bad'}"><span>${good ? '✔' : '✖'} ${lab}</span><b>${v}/${need}</b></div>`).join('')}
        ${on ? `<button class="primary" data-act="svsub" data-g="cd" data-t="cargo">${o.icon} Abrir a tarefa</button>` : member ? `<button data-act="coffice" data-k="${k}" ${ok ? '' : 'disabled'}>Assumir o cargo</button>` : '<small class="muted cd-wait">entre para a corte primeiro</small>'}</div>`;
    }).join('');
    return `<div class="cd-pg"><div class="cd-court"><div class="cd-col">${pick}${kingCard}${forces}</div><div class="cd-ofs">${offices}</div></div></div>`;
  },
  // a tarefa do cargo
  taskPage() {
    const cur = this.cur(); if (!cur) return '<div class="sv-none">🏛️<small>Sem cargo na corte.</small></div>';
    const ci = cur.civ, c = G.civs[ci], esc = this.esc.bind(this), o = COURT_OFFICES[cur.office];
    const head = `<div class="cd-th" style="--c:${Game.civColor(ci)}"><span class="cd-thi">${o.icon}</span><div><b>${esc(RoyalCourt.officeName(cur.office))} de ${esc(CIV_DEFS[ci].short)}</b><small>${esc(o.desc)}</small></div>
      <div class="cd-chips"><span>💰 <b>${Math.round(c.treasury).toLocaleString('pt-BR')}</b> tesouro</span><span>🛡️ <b>${c.garrison}</b> soldados</span><span>😊 <b>${Math.round(c.happy)}</b></span><span>👑 <b>${Cid.kingAff(ci)}</b> amizade</span></div></div>`;
    const logC = `<div class="card cd-log"><div class="sec">📜 O que você fez</div>${(cur.log || []).slice(0, 6).map(l => `<div><em>${Calendar.short(l.day)}</em><span>${esc(l.t)}</span></div>`).join('') || '<small class="muted">Nada ainda.</small>'}</div>`;
    let body = '';
    if (cur.office === 'general') {
      const wars = Diplo.warsOf(ci), wc = G.warCall;
      const warRows = wars.map(w => { const e = w.a === ci ? w.b : w.a, my = Diplo.strength(ci), fo = Diplo.strength(e), pct = Math.round(my / Math.max(1, my + fo) * 100);
        return `<div class="cd-war"><div class="cd-warh">${this.arms(ci, 18)}<b>×</b>${this.arms(e, 18)}<span>${esc(CIV_DEFS[e].short)}</span>${wc && wc.gen && wc.enemy === e ? '<em class="bad">batalha marcada</em>' : ''}</div>
          <i class="cd-vs"><i style="width:${pct}%;background:${Game.civColor(ci)}"></i><i style="width:${100 - pct}%;background:${Game.civColor(e)}"></i></i>
          ${wc && wc.gen && wc.enemy === e ? '<button class="primary" data-act="cdCouncil">⚔️ Abrir o Conselho de Guerra</button>' : '<small class="muted">Todo mês o inimigo vem: você é convocado para comandar o exército.</small>'}</div>`; }).join('');
      body = `<div class="cd-task"><div class="card"><div class="sec">🛡️ O exército do rei</div>
          <div class="cd-tiles"><div><b>${c.garrison}</b><small>de ${Game.maxGarrison(c)} soldados</small></div><div><b>${War.knightsOf(ci)}</b><small>cavaleiros</small></div><div><b>${Math.round(c.stock.wheat || 0)}</b><small>trigo</small></div></div>
          <div class="cd-act"><button class="primary" data-act="cdRecruit" ${this.left('recruit') ? '' : 'disabled'}>🪖 Recrutar até ${GAB_RECRUIT} soldados</button><small>40 🪙 e 5 de trigo cada, do tesouro · ${this.left('recruit')}/${GAB_LIMIT.recruit} este mês</small></div>
          <div class="cd-act"><button data-act="cescort" ${c.garrison > 2 && Game.allies().length < Game.followerCap() ? '' : 'disabled'}>⚔️ Pedir escolta</button><small>um soldado do rei passa a seguir você</small></div>
          <div class="cd-how"><b>📜 Como funciona</b><span>⚔️ Em guerra, todo mês você é convocado e comanda o exército do rei no campo de batalha.</span><span>🏆 Vencer: uma vila do inimigo, o resgate, a paz e prêmio do rei.</span><span>💀 Perder: ouro e uma vila, e o rei confia menos em você.</span><span>🏳️ Dá para deixar o rei comandar, mas ele não gosta.</span></div></div>
        <div class="card"><div class="sec">⚔️ Guerras do reino</div>${warRows || `<div class="cd-peace">🕊️ ${esc(CIV_DEFS[ci].short)} está em paz.<small>Quando houver guerra, você é convocado todo mês para comandar o exército no campo de batalha. Vencer traz uma vila do inimigo, o resgate e a paz.</small></div>`}</div>${logC}</div>`;
    } else if (cur.office === 'treasurer') {
      const fc = Game.civForecast(c), K = Bank.K(ci), tax = Math.round(c.tax * 100), happyT = Math.round(U.clamp(78 - c.tax * 160 + 5, 0, 100));
      const inv = Object.entries(INVESTMENTS).map(([k, x]) => { const can = Object.entries(x.cost).every(([r, n]) => (r === 'gold' ? c.treasury : c.stock[r] || 0) >= n);
        return `<div class="cd-inv"><span>${x.icon}</span><div><b>${esc(x.name)} <em>nv ${c.invest[k]}</em></b><small>${esc(x.desc)}</small><small class="muted">${Object.entries(x.cost).map(([r, n]) => `${n} ${r === 'gold' ? '🪙' : ITEMS[r] ? ITEMS[r].icon : r}`).join(' · ')}</small></div>
          <button data-act="cdInvest" data-k="${k}" ${can && this.left('invest') ? '' : 'disabled'}>Investir</button></div>`; }).join('');
      body = `<div class="cd-task"><div class="card"><div class="sec">💰 As contas do reino</div>
          <div class="cd-tiles"><div><b>${Math.round(c.treasury).toLocaleString('pt-BR')}</b><small>tesouro</small></div><div><b class="ok">+${fc.income}</b><small>impostos/mês</small></div><div><b class="bad">−${fc.upkeep}</b><small>soldados/mês</small></div><div><b>${c.pop}</b><small>moradores</small></div></div>
          <div class="cd-tax"><span>🏛️ Impostos</span><button data-act="cdTax" data-d="-0.02" ${c.tax <= 0.04 ? 'disabled' : ''}>−</button><b>${tax}%</b><button data-act="cdTax" data-d="0.02" ${c.tax >= 0.3 ? 'disabled' : ''}>+</button>
            <small>felicidade tende a ${happyT} · ${c.secTax !== undefined ? 'taxa sua' : 'taxa do rei'}</small></div>
          <div class="cd-act"><button data-act="cdFest" ${this.left('festival') && c.treasury >= GAB_FEST + 50 ? '' : 'disabled'}>🎉 Festa do povo (${GAB_FEST} 🪙)</button><small>+felicidade no fim do mês</small></div>
          <div class="cd-act"><button data-act="cdDebt" ${this.left('debt') && K.debt > 0 && c.treasury > 100 ? '' : 'disabled'}>🏦 Pagar a dívida</button><small>o reino deve ${Math.round(K.debt)} 🪙 ao banco</small></div>
          <div class="cd-how"><b>📜 O rei olha as contas todo mês</b><span>😊 Povo feliz (55+) e tesouro crescendo: +amizade do rei.</span><span>😠 Povo infeliz (abaixo de 30) ou tesouro minguando: −amizade.</span><span>🏛️ Imposto alto enche o tesouro, mas o povo fica triste.</span></div></div>
        <div class="card cd-invs"><div class="sec">🏗️ Investimentos <span>${this.left('invest')}/${GAB_LIMIT.invest} este mês</span></div>${inv}</div>${logC}</div>`;
    } else if (cur.office === 'advisor') {
      const L = (c.laws || []).filter(k => LAWS[k]), free = Object.keys(LAWS).filter(k => !L.includes(k));
      const law = (k, enact) => { const d = LAWS[k], ch = Math.round(this.lawChance(ci, k, enact) * 100);
        return `<div class="cd-law ${enact ? '' : 'on'}"><span>${d.icon}</span><div><b>${esc(d.name)}${this.likes(ci, k) ? ' <em>o rei gosta</em>' : ''}</b><small>${esc(d.desc)}</small></div>
          <button class="${enact ? 'primary' : 'danger'}" data-act="cdLaw" data-k="${k}" data-e="${enact ? 1 : 0}" ${this.left('law') && (!enact || L.length < LAW_MAX) ? '' : 'disabled'}>${enact ? 'Propor' : 'Revogar'} · ${ch}%</button></div>`; };
      body = `<div class="cd-task"><div class="card"><div class="sec">⚖️ Leis em vigor <span>${L.length}/${LAW_MAX}</span></div>${L.map(k => law(k, false)).join('') || '<small class="muted">Nenhuma lei.</small>'}
          <small class="muted cd-hint">As leis mexem na felicidade e no tesouro do reino todo mês. O rei aceita conforme a amizade com você, o jeito dele e as sociedades na corte. ${this.left('law')}/${GAB_LIMIT.law} propostas este mês.</small></div>
        <div class="card cd-laws"><div class="sec">📜 Propor uma lei</div>${free.map(k => law(k, true)).join('')}</div>${logC}</div>`;
    } else {
      const rows = G.civs.filter(x => x && !x.dead && x.id !== ci).map(x => { const war = Diplo.atWar(ci, x.id), al = Diplo.allied(ci, x.id), r = Math.round(Diplo.rel(ci, x.id));
        return `<div class="cd-dip">${this.arms(x.id, 22)}<div><b>${esc(CIV_DEFS[x.id].short)}</b><small>${war ? '<span class="bad">⚔️ em guerra</span>' : al ? '<span class="ok">🤝 aliados</span>' : 'neutros'} · relação ${r}</small></div>
          ${this.bar(r + 100, 200, r >= 0 ? 'ok' : 'bad')}
          <span class="cd-dipb">${war ? `<button data-act="cprop" data-o="${x.id}" data-x="peace">🕊️ Paz</button>` : `<button data-act="cprop" data-o="${x.id}" data-x="ally" ${al ? 'disabled' : ''}>🤝 Aliança</button>${x.ruler === 'player' ? '' : `<button class="danger" data-act="cprop" data-o="${x.id}" data-x="war">⚔️ Guerra</button>`}`}</span></div>`; }).join('');
      body = `<div class="cd-task cd-task2"><div class="card cd-dips"><div class="sec">🤝 ${esc(CIV_DEFS[ci].short)} e os outros reinos</div>${rows}</div>${logC}</div>`;
    }
    return `<div class="cd-pg">${head}${body}</div>`;
  },
  html() {
    const cur = this.cur(), list = [['cid', '🪪', 'Cidadania', this.cidPage()], ['corte', '🏛️', 'A corte', this.courtPage()]];
    if (cur) list.push(['cargo', COURT_OFFICES[cur.office].icon, COURT_OFFICES[cur.office].task, this.taskPage()]);
    return `<div class="cdw">${Services.subs('cd', list)}</div>`;
  },
});
if (!WIDE_PANELS.includes('showCorte')) WIDE_PANELS.push('showCorte');
UI.showCorte = function (tab) {
  if (tab) (this.sel.svSub || (this.sel.svSub = {})).cd = tab;
  this.open('🏛️ Corte e cidadania', Gab.html(), 'showCorte', [], 'A sua cidadania, a corte do rei e a tarefa do seu cargo');
};

{
  // ---------------------------------------------------------------- ações
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    switch (a) {
      case 'corte': UI.showCorte(d.t); return;
      case 'cidSet': Cid.choose(+d.c); return;
      case 'cdCiv': this.sel.cdCiv = +d.c; this.refresh(); return;
      case 'cdAsk': Cid.ask(+d.c); this.refresh(); return;
      case 'cdRecruit': Gab.recruit(); return;
      case 'cdTax': Gab.setTax(+d.d); return;
      case 'cdInvest': Gab.invest(d.k); return;
      case 'cdFest': Gab.festival(); return;
      case 'cdDebt': Gab.payDebt(); return;
      case 'cdLaw': Gab.propose(d.k, d.e === '1'); return;
      case 'cdCouncil': UI.showWarCouncil(); return;
      case 'cdDelegate': Gab.delegate(); return;
    }
    const r = a0(a, d);
    // ações da corte feitas dentro desta janela: ela se atualiza
    if (['coffice', 'caudience', 'cescort', 'cprop', 'cjoin', 'cdecline'].includes(a) && this.cur && this.cur.fn === 'showCorte') this.refresh();
    return r;
  };
  // ---------------------------------------------------------------- o general comanda as guerras do rei
  const ms0 = War.mySide.bind(War);
  War.mySide = function (w) {
    const r = ms0(w); if (r !== null) return r;
    const g = Gab.genOf(); if (g === null || (w.a !== g && w.b !== g)) return null;
    const o = w.a === g ? w.b : w.a; return G.civs[o] && G.civs[o].ruler !== 'player' ? g : null;
  };
  const sm0 = War.summon.bind(War);
  War.summon = function (side, enemy, own) {
    if (!own || !G.civs[side] || G.civs[side].ruler === 'player' || Gab.genOf() !== side) return sm0(side, enemy, own);
    G.warCall = { side, enemy, own: true, gen: true, day: G.day, shown: false, deadline: null, assault: null, cfg: this.defaults(side, true) };
    UI.banner(`⚔️ General, ${CIV_DEFS[enemy].short} marcha contra ${CIV_DEFS[side].short}!`);
    UI.msg(`⚔️ ${G.civs[side].rulerName} convoca o general: o exército de ${CIV_DEFS[enemy].name} se aproxima. Monte o exército do rei no Conselho de Guerra e comande a batalha.`, 'bad', true);
    Sound.play('ui');
  };
  const st0 = War.start.bind(War);
  War.start = function (...a) {
    const wc = G.warCall, gen = !!(wc && wc.gen);
    if (gen) wc.assault = null;
    War._gen = gen;
    try { st0(...a); } finally { War._gen = false; }
    if (gen && G.place && G.place.kind === 'battle' && !G.place.done) G.place.gen = true;
  };
  const si0 = War.simulate.bind(War);
  War.simulate = function (wc) { const gen = !!(wc && wc.gen), old = War._gen; War._gen = old || gen; try { return si0(wc); } finally { War._gen = old; } };
  const fi0 = War.finish.bind(War);
  War.finish = function (win) { if (War._gen || (G.place && G.place.gen)) return Gab.genFinish(win); return fi0(win); };
  // o Conselho de Guerra do general: o exército é do rei, sem invadir castelos; dá para deixar o rei comandar
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    const wc = G.warCall;
    if (fn === 'showWarCouncil' && wc && wc.gen) {
      body = body.replace(`${CIV_DEFS[wc.enemy].name} declarou guerra ao seu reino`, `General, ${CIV_DEFS[wc.enemy].name} ataca ${CIV_DEFS[wc.side].name}`)
        .replace('Você é o soberano: não há como fugir. Escolha quem vai e parta para o campo de batalha.', `${G.civs[wc.side].rulerName} entrega o exército a você: escolha quem vai e comande a batalha. Vencer traz uma vila do inimigo e a paz.`);
      sub = `General de ${CIV_DEFS[wc.side].short}`;
    }
    const r = op0(title, body, fn, args, sub);
    if (fn === 'showWarCouncil' && wc && wc.gen && this.panel) {
      this.panel.querySelectorAll('[data-act="wassault"]').forEach(b => b.remove());
      const go = this.panel.querySelector('.wc-go'); if (go && !go.querySelector('[data-act="cdDelegate"]')) go.insertAdjacentHTML('beforeend', '<button data-act="cdDelegate">🏳️ Deixar o rei comandar</button>');
    }
    return r;
  };
  // ---------------------------------------------------------------- o secretário manda nos impostos
  if (typeof Personas !== 'undefined') {
    const mc0 = Personas.monthCiv.bind(Personas);
    Personas.monthCiv = function (c) {
      const r = mc0(c), cur = Gab.cur();
      if (c.secTax !== undefined) { if (cur && cur.civ === c.id && cur.office === 'treasurer') c.tax = c.secTax; else delete c.secTax; }
      return r;
    };
  }
  // ---------------------------------------------------------------- as leis dos reinos da IA valem de verdade
  const tc0 = Game.tickCiv.bind(Game);
  Game.tickCiv = function (c) {
    const r = tc0(c);
    if (c.ruler === 'npc' && c.laws) for (const k of c.laws) { const d = LAWS[k]; if (!d) continue; if (d.happy) c.happy = U.clamp(c.happy + d.happy, 0, 100); if (d.income) c.treasury = Math.max(0, c.treasury + Math.round(c.pop * d.income)); }
    return r;
  };
  // ---------------------------------------------------------------- todo mês o rei olha o trabalho do secretário
  const tk0 = RoyalCourt.tick.bind(RoyalCourt);
  RoyalCourt.tick = function () {
    tk0();
    const cur = Gab.cur(); if (!cur || cur.office !== 'treasurer') return;
    const c = G.civs[cur.civ], before = cur.lastT;
    if (before !== undefined) {
      if (c.happy >= 55 && c.treasury >= before) { Cid.addKingAff(cur.civ, 2); Court.addService(cur.civ, 1); Game.note(`💰 ${c.rulerName} gostou das contas do reino (+2 de amizade).`); }
      else if (c.happy < 30 || c.treasury < before * 0.6) { Cid.addKingAff(cur.civ, -3); UI.msg(`💰 ${c.rulerName} reclama das contas de ${CIV_DEFS[cur.civ].short}: o povo infeliz ou o tesouro minguando (−3 de amizade).`, 'bad'); }
    }
    cur.lastT = c.treasury;
  };
  // ---------------------------------------------------------------- caminhos para a janela
  const op1 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    // no castelo: a corte e o título abrem a janela nova
    if (fn === 'showCastle' && args && args[0] !== undefined) {
      const ci = args[0];
      body = body.replace('<div class="card court-card">', `<div class="card court-card"><div class="act-row cd-open"><button class="primary" data-act="corte" data-t="corte">🏛️ Corte e cidadania</button></div>`);
      if (!Cid.allows(ci)) body = body.replace(/data-act="title" data-c="(\d+)"/, 'data-act="title" data-c="$1" disabled') + '';
    }
    return op1(title, body, fn, args, sub);
  };
  const ci0 = UI.courtInvHtml && UI.courtInvHtml.bind(UI);
  if (ci0) UI.courtInvHtml = function () { return ci0().replace(/<\/div>$/, `<div class="act-row"><button data-act="corte">🏛️ Corte e cidadania</button></div></div>`); };
  const tc1 = UI.titleCard.bind(UI);
  UI.titleCard = function (ci) {
    if (!Cid.allows(ci) && Court.levelIn(ci) < 0) return `<div class="card" style="margin-top:10px"><div class="sec">⚜️ Títulos de nobreza</div><p class="dt-desc">${this.esc(Cid.why(ci))}</p><div class="act-row"><button data-act="corte" data-t="cid">🪪 Cidadania</button></div></div>`;
    return tc1(ci).replace('Seus outros títulos continuam valendo', 'Seus outros títulos');
  };
}
