'use strict';
// Diplomacia mais rica: tratados entre reinos (os seus e os da IA).
//  • 💍 Casamento entre dinastias: um filho ou filha sua (16+, solteiro) casa com o herdeiro de outro reino. O reino da
//    noiva ou do noivo paga um dote e, se você governa um reino, os dois viram aliados. Sem reino, a coroa de lá passa a
//    gostar muito mais de você. Quem casa vai morar no castelo do outro reino.
//  • 📦 Tratado de comércio (12 meses): os dois tesouros recebem uma renda todo mês, a relação melhora e você compra 5%
//    mais barato naquele reino.
//  • 💰 Tributo (12 meses): um reino bem mais forte exige uma parte do tesouro do mais fraco todo mês. Quem recusa fica com
//    raiva (e pode declarar guerra). Em guerra, você pode comprar a paz pagando tributo em vez de ouro de uma vez.
//  • 🕊️ Reféns: para selar a paz, um reino entrega alguém da família real ao outro por 12 meses. Enquanto o refém estiver
//    lá, quem o entregou não declara guerra a quem o guarda. Se você atacar um reino que guarda um filho seu, ele morre.
// A IA também assina tratados de comércio, cobra tributos e troca reféns entre si.
const PACT_MONTHS = 12, PACT_TRIB_MAX = 300, PACT_ASK_WAIT = 6;

const Pacts = {
  S() { const u = G.urban || (G.urban = {}); const S = u.pacts || (u.pacts = {}); S.trade = S.trade || []; S.trib = S.trib || []; S.host = S.host || []; S.wed = S.wed || []; S.ask = S.ask || {}; return S; },
  // o seu reino principal (o que assina pelos outros); -1 sem reino
  main() { const m = G.mainRealm; if (m !== null && m !== undefined && G.civs[m] && G.civs[m].ruler === 'player') return m; const c = G.civs.find(x => x.ruler === 'player'); return c ? c.id : -1; },
  mine(ci) { return ci >= 0 && G.civs[ci] && G.civs[ci].ruler === 'player'; },
  rel(ci) { const m = this.main(); return m >= 0 ? Diplo.rel(m, ci) : (G.civs[ci].relation || 0); },
  addRel(ci, n) { const m = this.main(); if (m >= 0) Diplo.addRel(m, ci, n); else Game.addRelation(ci, n); },
  pair(a, b) { return Diplo.pairKey(a, b); },
  // ---------------------------------------------------------------- consultas
  trade(a, b) { return this.S().trade.find(t => this.pair(t.a, t.b) === this.pair(a, b)); },
  tribOf(from, to) { return this.S().trib.find(t => t.from === from && t.to === to); },
  hostagesHeldBy(to) { return this.S().host.filter(h => h.to === to); },
  // um refém de "from" está guardado por "to": "from" não pode atacar "to"
  bound(from, to) { return this.S().host.some(h => h.from === from && h.to === to && G.people[h.pid] && G.people[h.pid].alive); },
  income(a, b) { return 20 + Math.round(Math.min(G.civs[a].pop || 0, G.civs[b].pop || 0) * 0.15); },
  power(ci) { return Math.max(1, Diplo.strength(ci)); },
  others() { return G.civs.filter(c => !c.dead && c.ruler !== 'player'); },
  // ---------------------------------------------------------------- casamento entre dinastias
  kids() { const held = new Set(this.S().host.map(h => h.pid)); return G.people.filter(p => p.alive && p.kin === 'child' && p.age >= 16 && p.spouse === null && !p.engaged && !held.has(p.id)); },
  heirs(ci, sex) { return G.people.filter(p => p.alive && p.rank === 'heir' && p.civ === ci && p.age >= 16 && p.spouse === null && !p.kin && (!sex || p.sex !== sex)); },
  wedChance(ci) { const m = this.main(); return U.clamp(0.3 + this.rel(ci) / 150 + (m >= 0 ? 0.25 : 0) + Math.max(0, Court.levelIn(ci)) * 0.05, 0.05, 0.95); },
  dowry(ci) { return Math.min(Math.max(0, Math.round(G.civs[ci].treasury * 0.1)), 400) + 100; },
  wed(kid, ci) {
    const S = this.S(), k = G.people[kid], c = G.civs[ci]; if (!k || !c) return;
    const h = this.heirs(ci, k.sex)[0];
    if (!h) { UI.msg(`${CIV_DEFS[ci].short} não tem herdeiro livre para casar.`, 'bad'); return; }
    if (this.rel(ci) < 10) { UI.msg(`A coroa de ${CIV_DEFS[ci].short} não confia em você o bastante (relação 10+).`, 'bad'); return; }
    if (G.day - (S.ask[ci] || -99) < PACT_ASK_WAIT) { UI.msg(`${CIV_DEFS[ci].short} acabou de recusar. Espere alguns meses.`, 'bad'); return; }
    if (Math.random() > this.wedChance(ci)) {
      S.ask[ci] = G.day; this.addRel(ci, -5);
      UI.msg(`💔 ${c.rulerName} recusou o casamento de ${k.name} com ${h.name}.`, 'bad', true);
      return;
    }
    People.marry(k, h);
    k.home = { type: 'castle', civ: ci };
    const g = Math.min(this.dowry(ci), Math.max(0, Math.floor(c.treasury))); c.treasury -= g; P.gold += g;
    const m = this.main();
    if (m >= 0 && !Diplo.atWar(m, ci)) { Diplo.addRel(m, ci, 25); Diplo.ally(m, ci); } else this.addRel(ci, 25);
    Game.addRelation(ci, 10);
    S.wed.push({ a: m, b: ci, kid: k.id, heir: h.id, day: G.day, mine: true });
    UI.banner(`💍 Casamento real: ${k.name} e ${h.name}`);
    UI.msg(`💍 ${k.name} casou-se com ${People.title(h)} ${h.name}, de ${CIV_DEFS[ci].name}. Dote: +${g} 🪙.${m >= 0 ? ` ${CIV_DEFS[m].short} e ${CIV_DEFS[ci].short} agora são aliados.` : ''}`, 'gold', true);
    Progress.diary(`💍 ${k.name} casou-se com ${h.name}, herdeiro de ${CIV_DEFS[ci].name}.`);
    Diplo.chronicle(`💍 Casamento entre dinastias: ${k.name} ${k.surname} casou-se com ${People.title(h)} ${h.name} de ${Diplo.name(ci)}.`, true);
  },
  // ---------------------------------------------------------------- comércio
  signTrade(a, b, quiet) {
    const S = this.S(), old = this.trade(a, b);
    if (old) { old.until = G.day + PACT_MONTHS; return true; }
    S.trade.push({ a, b, since: G.day, until: G.day + PACT_MONTHS });
    Diplo.addRel(a, b, 8);
    Diplo.chronicle(`📦 ${Diplo.name(a)} e ${Diplo.name(b)} assinaram um tratado de comércio.`, !quiet || Diplo.involves(a, b));
    return true;
  },
  askTrade(ci) {
    const m = this.main(); if (m < 0) return;
    const c = G.civs[m];
    if (Diplo.atWar(m, ci)) { UI.msg('Não se faz comércio com quem está em guerra com você.', 'bad'); return; }
    if (Diplo.rel(m, ci) < 15) { UI.msg(`${CIV_DEFS[ci].short} não quer acordo com você (relação 15+).`, 'bad'); return; }
    if (c.treasury < 100) { UI.msg('O tesouro precisa de 100 🪙 para os embaixadores.', 'bad'); return; }
    c.treasury -= 100; this.signTrade(m, ci);
    UI.msg(`📦 Tratado de comércio com ${CIV_DEFS[ci].name} por ${PACT_MONTHS} meses: +${this.income(m, ci)} 🪙 por mês para cada tesouro e 5% de desconto nas compras lá.`, 'gold', true);
  },
  // ---------------------------------------------------------------- tributos
  tribAmount(from) { return U.clamp(Math.round(G.civs[from].treasury * 0.03), 25, PACT_TRIB_MAX); },
  setTrib(from, to, amt, months) {
    const S = this.S(); S.trib = S.trib.filter(t => !(t.from === from && t.to === to));
    S.trib.push({ from, to, amt, until: G.day + (months || PACT_MONTHS), missed: 0 });
  },
  demandOdds(ci) { const m = this.main(); if (m < 0) return 0; const r = this.power(m) / this.power(ci); return r < 1.5 ? 0 : U.clamp((r - 1.2) * 0.6, 0.1, 0.85); },
  demand(ci) {
    const m = this.main(); if (m < 0) return;
    if (this.tribOf(ci, m)) { UI.msg(`${CIV_DEFS[ci].short} já paga tributo a você.`, 'bad'); return; }
    const p = this.demandOdds(ci);
    if (!p) { UI.msg(`${CIV_DEFS[ci].short} não tem medo de você: o seu exército precisa ser bem mais forte (1,5×).`, 'bad'); return; }
    if (Math.random() < p) {
      const amt = this.tribAmount(ci); this.setTrib(ci, m, amt); Diplo.addRel(m, ci, -10);
      Diplo.chronicle(`💰 ${Diplo.name(ci)} curvou-se e vai pagar tributo a ${Diplo.name(m)}.`, true);
      UI.msg(`💰 ${CIV_DEFS[ci].short} aceitou pagar ${amt} 🪙 por mês ao seu tesouro, por ${PACT_MONTHS} meses.`, 'gold', true);
    } else {
      Diplo.addRel(m, ci, -20);
      UI.msg(`😠 ${G.civs[ci].rulerName} rasgou a sua carta de tributo.`, 'bad', true);
      if (Diplo.rel(m, ci) < -40 && !Diplo.atWar(m, ci) && !this.bound(ci, m)) Diplo.declareWar(ci, m, 'a exigência de tributo');
    }
  },
  // em guerra: a paz em troca de tributo (o seu reino paga por 8 meses)
  peaceTribute(ci) {
    const m = this.main(); if (m < 0 || !Diplo.atWar(m, ci)) return;
    const amt = U.clamp(Math.round(this.power(ci) * 3), 30, PACT_TRIB_MAX);
    if (Math.random() < 0.75) { this.setTrib(m, ci, amt, 8); Diplo.makePeace(m, ci, `${Diplo.name(m)} vai pagar ${amt} moedas por mês, por 8 meses`); UI.msg(`🕊️ Paz com ${CIV_DEFS[ci].short}: o seu tesouro paga ${amt} 🪙 por mês, por 8 meses.`, 'gold', true); }
    else UI.msg(`${G.civs[ci].rulerName} quer sangue, não ouro: recusou a paz.`, 'bad', true);
  },
  // ---------------------------------------------------------------- reféns
  // quem um reino da IA entrega: o herdeiro, um cavaleiro ou alguém da corte
  hostageOf(ci) {
    const held = new Set(this.S().host.map(h => h.pid));
    return G.people.find(p => p.alive && p.civ === ci && p.rank === 'heir' && !held.has(p.id) && !p.kin) || G.people.find(p => p.alive && p.civ === ci && p.rank === 'knight' && !held.has(p.id) && !p.kin && !p.capanga) || null;
  },
  give(pid, from, to) {
    const p = G.people[pid]; if (!p) return;
    this.S().host.push({ pid, from, to, until: G.day + PACT_MONTHS, home: p.home });
    p.home = { type: 'castle', civ: to };
  },
  release(h, why) {
    const S = this.S(), p = G.people[h.pid]; S.host = S.host.filter(x => x !== h);
    if (p && p.alive) { p.home = h.home && h.home.type !== 'wild' ? h.home : (h.from >= 0 ? { type: 'castle', civ: h.from } : { type: 'player' }); if (p.kin === 'child') p.home = { type: 'player' }; }
    if (why) Diplo.chronicle(`🕊️ ${p ? p.name : 'O refém'} voltou para ${h.from >= 0 && !this.mine(h.from) ? Diplo.name(h.from) : 'casa'} — ${why}.`, this.mine(h.from) || this.mine(h.to));
  },
  // em guerra e mais forte: a paz se o inimigo entregar um refém
  peaceHostage(ci) {
    const m = this.main(); if (m < 0 || !Diplo.atWar(m, ci)) return;
    const r = this.power(m) / this.power(ci), p = this.hostageOf(ci);
    if (!p) { UI.msg(`${CIV_DEFS[ci].short} não tem ninguém da corte para entregar.`, 'bad'); return; }
    if (r >= 1.2 && Math.random() < U.clamp(0.3 + (r - 1.2) * 0.6, 0.3, 0.9)) {
      this.give(p.id, ci, m); Diplo.makePeace(m, ci, `${p.name} foi entregue como refém`);
      UI.msg(`🕊️ Paz com ${CIV_DEFS[ci].short}: ${People.title(p)} ${p.name} fica no seu castelo como refém por ${PACT_MONTHS} meses. Enquanto isso, eles não podem atacar você.`, 'gold', true);
    } else UI.msg(`${G.civs[ci].rulerName} não aceita entregar ninguém${r < 1.2 ? ' (o seu exército precisa ser mais forte)' : ''}.`, 'bad', true);
  },
  // perdendo a guerra: entregar um filho seu em troca da paz
  offerHostage(kid, ci) {
    const m = this.main(), k = G.people[kid]; if (m < 0 || !k || !Diplo.atWar(m, ci)) return;
    if (Math.random() < 0.8) {
      this.give(kid, m, ci); Diplo.makePeace(m, ci, `${k.name} ${k.surname} foi entregue como refém`);
      UI.msg(`🕊️ Paz com ${CIV_DEFS[ci].short}: ${k.name} vai morar no castelo de lá por ${PACT_MONTHS} meses. Não ataque ${CIV_DEFS[ci].short} enquanto isso — a vida de ${k.name} depende disso.`, 'gold', true);
      Progress.diary(`🕊️ ${k.name} foi entregue como refém a ${CIV_DEFS[ci].name} para selar a paz.`);
    } else UI.msg(`${G.civs[ci].rulerName} recusou o refém.`, 'bad', true);
  },
  // ---------------------------------------------------------------- todo mês
  monthTick() {
    const S = this.S(), out = [];
    // comércio: renda para os dois lados
    for (const t of S.trade.slice()) {
      const A = G.civs[t.a], B = G.civs[t.b];
      if (!A || !B || A.dead || B.dead || Diplo.atWar(t.a, t.b) || G.day > t.until || A.anarchy || B.anarchy) { S.trade = S.trade.filter(x => x !== t); if (this.mine(t.a) || this.mine(t.b)) out.push(`📦 O tratado de comércio entre ${CIV_DEFS[t.a].short} e ${CIV_DEFS[t.b].short} acabou.`); continue; }
      const g = this.income(t.a, t.b); A.treasury += g; B.treasury += g; Diplo.addRel(t.a, t.b, 1);
      if (this.mine(t.a) || this.mine(t.b)) out.push(`📦 Comércio com ${CIV_DEFS[this.mine(t.a) ? t.b : t.a].short}: +${g} 🪙 no tesouro.`);
    }
    // tributos: paga o que der; duas faltas e o acordo acaba (com raiva)
    for (const t of S.trib.slice()) {
      const F = G.civs[t.from], T0 = G.civs[t.to];
      if (!F || !T0 || F.dead || T0.dead || G.day > t.until || F.anarchy) { S.trib = S.trib.filter(x => x !== t); continue; }
      const g = Math.min(t.amt, Math.max(0, Math.floor(F.treasury))); F.treasury -= g; T0.treasury += g;
      if (g < t.amt) t.missed++; else t.missed = 0;
      if (this.mine(t.to) && g) out.push(`💰 Tributo de ${CIV_DEFS[t.from].short}: +${g} 🪙.`);
      if (this.mine(t.from)) out.push(`💰 Tributo pago a ${CIV_DEFS[t.to].short}: −${g} 🪙.`);
      if (t.missed >= 2) {
        S.trib = S.trib.filter(x => x !== t); Diplo.addRel(t.from, t.to, -25);
        Diplo.chronicle(`💢 ${Diplo.name(t.from)} deixou de pagar o tributo a ${Diplo.name(t.to)}.`, this.mine(t.from) || this.mine(t.to));
        if (!this.mine(t.to) && !Diplo.atWar(t.to, t.from) && !this.bound(t.to, t.from) && Math.random() < 0.5) Diplo.declareWar(t.to, t.from, 'o tributo atrasado');
      }
    }
    // reféns: voltam no fim do prazo (ou somem se morreram)
    for (const h of S.host.slice()) {
      const p = G.people[h.pid];
      if (!p || !p.alive) { S.host = S.host.filter(x => x !== h); continue; }
      if (G.day >= h.until) { this.release(h, 'o prazo acabou'); if (h.from >= 0 && h.to >= 0) Diplo.addRel(h.from, h.to, 10); }
    }
    // a IA também negocia
    const ai = this.others();
    for (let k = 0; k < 2 && ai.length > 1; k++) {
      const a = U.pick(ai), b = U.pick(ai.filter(x => x !== a)); if (!b) break;
      const r = Diplo.rel(a.id, b.id);
      if (r > 20 && !this.trade(a.id, b.id) && !Diplo.atWar(a.id, b.id) && Math.random() < 0.3) this.signTrade(a.id, b.id, true);
      else if (!Diplo.allied(a.id, b.id) && !this.tribOf(b.id, a.id) && this.power(a.id) / this.power(b.id) >= 1.8 && r < 10 && Math.random() < 0.15) {
        if (Math.random() < 0.6) { this.setTrib(b.id, a.id, this.tribAmount(b.id)); Diplo.chronicle(`💰 ${Diplo.name(b.id)} passou a pagar tributo a ${Diplo.name(a.id)}.`); }
        else { Diplo.addRel(a.id, b.id, -15); Diplo.chronicle(`😠 ${Diplo.name(b.id)} recusou pagar tributo a ${Diplo.name(a.id)}.`); }
      }
    }
    if (S.wed.length > 30) S.wed.splice(0, S.wed.length - 30);
    for (const l of out) Game.note(l);
  },
  sig() { const S = this.S(); return [S.trade.length, S.trib.length, S.host.map(h => h.pid).join('.'), S.wed.length].join('|'); },
  // ---------------------------------------------------------------- a página
  page() {
    const S = this.S(), m = this.main(), esc = UI.esc.bind(UI), kids = this.kids();
    const btn = (op, c, label, ok, cls, extra) => `<button class="${cls || ''}" data-act="pact" data-op="${op}" data-c="${c}"${extra || ''} ${ok ? '' : 'disabled'}>${label}</button>`;
    const relTag = ci => { const r = Math.round(this.rel(ci)); return `<b class="${r >= 15 ? 'ok' : r < 0 ? 'bad' : ''}">${r}</b>`; };
    // casamentos
    const wedRows = this.others().map(c => {
      const hs = this.heirs(c.id), can = kids.filter(k => hs.some(h => h.sex !== k.sex));
      const wait = G.day - (S.ask[c.id] || -99) < PACT_ASK_WAIT;
      return `<div class="crow pc-row"><span class="ri">${Heraldry.armsSvg(c.id, 22)}</span><span><b>${CIV_DEFS[c.id].short}</b><small>relação ${relTag(c.id)} · ${hs.length ? hs.map(h => `${h.sex === 'f' ? '👸' : '🤴'} ${esc(h.name)} (${h.age})`).join(', ') : 'nenhum herdeiro solteiro'}${wait ? ' · recusou há pouco' : ''}</small></span>
        <span class="act-row">${can.map(k => btn('wed', c.id, `💍 ${esc(k.name)} (${Math.round(this.wedChance(c.id) * 100)}%)`, this.rel(c.id) >= 10 && !wait, 'primary', ` data-k="${k.id}"`)).join('') || '<small class="muted">sem par</small>'}</span></div>`;
    }).join('');
    const wedCard = `<div class="card"><div class="sec">💍 Casamento entre dinastias <span>${kids.length ? `${kids.length} filho(s) em idade de casar` : 'nenhum filho seu com 16+ e solteiro'}</span></div>
      <p class="dt-desc">O reino de lá paga um dote${m >= 0 ? ' e vira aliado do seu' : ' e a coroa passa a gostar muito de você'}. Quem casa vai morar no castelo de lá. Precisa de relação 10+.</p>${wedRows}</div>`;
    if (m < 0) return wedCard + `<div class="card"><div class="sec">📜 Tratados entre reinos</div><p class="muted">Comércio, tributos e reféns são assinados por reis. Conquiste ou herde um reino para negociar com os outros.</p></div>` + this.worldCard();
    const rows = this.others().map(c => {
      const ci = c.id, war = Diplo.atWar(m, ci), tr = this.trade(m, ci), tin = this.tribOf(ci, m), tout = this.tribOf(m, ci), dodds = this.demandOdds(ci);
      const st = [war ? '<span class="badge">GUERRA</span>' : '', Diplo.allied(m, ci) ? '<span class="tag">ALIADO</span>' : '', tr ? `<span class="tag">📦 ${tr.until - G.day} m</span>` : '', tin ? `<span class="tag">💰 recebe ${tin.amt}</span>` : '', tout ? `<span class="tag bad">💰 paga ${tout.amt}</span>` : ''].join(' ');
      const acts = war
        ? btn('ptrib', ci, `🕊️ Paz com tributo (${U.clamp(Math.round(this.power(ci) * 3), 30, PACT_TRIB_MAX)}/mês)`, true) + btn('phost', ci, '🕊️ Paz se entregarem um refém', !!this.hostageOf(ci)) + (kids.length ? kids.slice(0, 2).map(k => btn('ohost', ci, `🤲 Entregar ${esc(k.name)} como refém`, true, 'danger', ` data-k="${k.id}"`)).join('') : '')
        : btn('trade', ci, tr ? '📦 Renovar comércio (100)' : '📦 Tratado de comércio (100)', Diplo.rel(m, ci) >= 15 && G.civs[m].treasury >= 100) + btn('demand', ci, `💰 Exigir tributo${dodds ? ` (${Math.round(dodds * 100)}%)` : ''}`, !!dodds && !tin, 'danger');
      return `<div class="crow pc-row"><span class="ri">${Heraldry.armsSvg(ci, 22)}</span><span><b>${CIV_DEFS[ci].short} ${st}</b><small>relação ${relTag(ci)} · força ${Math.round(this.power(ci))} contra ${Math.round(this.power(m))} sua${tr ? ` · comércio +${this.income(m, ci)} 🪙/mês` : ''}</small></span><span class="act-row">${acts}</span></div>`;
    }).join('');
    const held = S.host.filter(h => h.to === m || this.mine(h.to)), given = S.host.filter(h => this.mine(h.from));
    const hostRow = (h, mineHeld) => { const p = G.people[h.pid]; if (!p) return ''; return `<div class="crow"><span class="ri">${mineHeld ? '🔐' : '🤲'}</span><span><b>${esc(People.full(p))}</b><small>${mineHeld ? `refém de ${CIV_DEFS[h.from] ? CIV_DEFS[h.from].short : '?'} no seu castelo` : `seu refém em ${CIV_DEFS[h.to].short}`} · volta em ${h.until - G.day} ${h.until - G.day === 1 ? 'mês' : 'meses'}</small></span>${mineHeld ? `<span class="act-row">${btn('free', S.host.indexOf(h), '🕊️ Libertar agora (+15 relação)', true)}</span>` : ''}</div>`; };
    const hostCard = held.length || given.length ? `<div class="card"><div class="sec">🕊️ Reféns</div>${held.map(h => hostRow(h, true)).join('')}${given.map(h => hostRow(h, false)).join('')}</div>` : '';
    return wedCard + `<div class="card"><div class="sec">📜 Tratados de ${CIV_DEFS[m].short} <span>tesouro ${Math.round(G.civs[m].treasury)} 🪙</span></div>
      <p class="dt-desc">📦 Comércio: renda para os dois tesouros por ${PACT_MONTHS} meses (relação 15+). 💰 Tributo: só um reino bem mais fraco (você 1,5× mais forte) aceita — quem recusa fica com raiva. Em guerra: compre a paz com tributo ou com reféns.</p>${rows}</div>` + hostCard + this.worldCard();
  },
  worldCard() {
    const S = this.S(), ai = x => !this.mine(x);
    const lines = [...S.trade.filter(t => ai(t.a) && ai(t.b)).map(t => `📦 ${CIV_DEFS[t.a].short} ⇄ ${CIV_DEFS[t.b].short}`), ...S.trib.filter(t => ai(t.from) && ai(t.to)).map(t => `💰 ${CIV_DEFS[t.from].short} paga ${t.amt} a ${CIV_DEFS[t.to].short}`),
      ...S.host.filter(h => ai(h.from) && ai(h.to)).map(h => `🕊️ ${G.people[h.pid] ? UI.esc(G.people[h.pid].name) : '?'} (${CIV_DEFS[h.from].short}) refém em ${CIV_DEFS[h.to].short}`)];
    return `<div class="card"><div class="sec">🌍 Tratados entre os outros reinos <span>${lines.length}</span></div>${lines.length ? `<div class="pc-world">${lines.map(l => `<span>${l}</span>`).join('')}</div>` : '<p class="muted">Nenhum tratado em vigor entre os reinos da IA.</p>'}</div>`;
  },
};

{
  // refém guardado: quem o entregou não ataca quem o guarda; atacar o reino que guarda um filho seu custa a vida dele
  const dw0 = Diplo.declareWar.bind(Diplo);
  Diplo.declareWar = function (a, b, why) {
    if (this.atWar(a, b)) return dw0(a, b, why);
    const S = Pacts.S();
    if (Pacts.bound(a, b) && G.civs[a].ruler !== 'player') return; // a IA respeita o refém
    const r = dw0(a, b, why); if (!this.atWar(a, b)) return r;
    for (const h of S.host.filter(x => x.from === a && x.to === b)) {
      const p = G.people[h.pid]; S.host = S.host.filter(x => x !== h);
      if (p && p.alive) {
        People.die(p, 'executado como refém');
        Diplo.chronicle(`⚰️ ${Diplo.name(a)} atacou ${Diplo.name(b)} e o refém ${p.name} foi executado.`, true);
        if (p.kin === 'child') UI.msg(`⚰️ ${p.name}, seu filho refém em ${CIV_DEFS[b].short}, foi executado quando você declarou guerra.`, 'bad', true);
      }
    }
    // quem guarda um refém e ataca quem o entregou: o refém foge para casa e todos olham torto
    for (const h of S.host.filter(x => x.from === b && x.to === a)) { Pacts.release(h, 'fugiu quando a guerra começou'); for (const c of G.civs) if (c.id !== a) Diplo.addRel(a, c.id, -5); }
    // guerra rasga os tratados de comércio e de tributo entre os dois
    S.trade = S.trade.filter(t => Pacts.pair(t.a, t.b) !== Pacts.pair(a, b));
    S.trib = S.trib.filter(t => Pacts.pair(t.from, t.to) !== Pacts.pair(a, b));
    return r;
  };
  // a IA que perde uma guerra às vezes entrega um refém ou fica pagando tributo
  const mp0 = Diplo.makePeace.bind(Diplo);
  Diplo.makePeace = function (a, b, why) {
    const was = this.atWar(a, b), r = mp0(a, b, why);
    if (was && G.civs[a] && G.civs[b] && G.civs[a].ruler !== 'player' && G.civs[b].ruler !== 'player' && !Pacts.S().host.some(h => Pacts.pair(h.from, h.to) === Pacts.pair(a, b))) {
      const [win, lose] = Diplo.strength(a) >= Diplo.strength(b) ? [a, b] : [b, a], p = Pacts.hostageOf(lose);
      if (p && Math.random() < 0.3) { Pacts.give(p.id, lose, win); Diplo.chronicle(`🕊️ ${People.title(p)} ${p.name} de ${Diplo.name(lose)} foi entregue como refém a ${Diplo.name(win)}.`); }
      else if (Math.random() < 0.4) { Pacts.setTrib(lose, win, Pacts.tribAmount(lose), 6); Diplo.chronicle(`💰 ${Diplo.name(lose)} vai pagar tributo a ${Diplo.name(win)} por 6 meses.`); }
    }
    return r;
  };
  // comércio: 5% mais barato para você nos reinos com tratado
  const pf0 = Game.priceFor.bind(Game);
  Game.priceFor = function (ci, k, owner) {
    const r = pf0(ci, k, owner), m = Pacts.main();
    if (m >= 0 && ci >= 0 && ci !== m && Pacts.trade(m, ci)) r.buy = Math.max(1, Math.round(r.buy * 0.95));
    return r;
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Pacts.monthTick(); };
  Perf.defer(Pacts, 'monthTick', 'Pacts.monthTick');
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'pact') return a0(a, d);
    const c = +d.c;
    switch (d.op) {
      case 'wed': Pacts.wed(+d.k, c); break;
      case 'trade': Pacts.askTrade(c); break;
      case 'demand': Dialog.confirm({ icon: '💰', title: `Exigir tributo de ${CIV_DEFS[c].short}`, danger: true, ok: 'Exigir', text: `Chance de aceitarem: ${Math.round(Pacts.demandOdds(c) * 100)}%. Se recusarem, a relação cai 20 e eles podem declarar guerra.` }, () => { Pacts.demand(c); UI.refresh(); }); return;
      case 'ptrib': Pacts.peaceTribute(c); break;
      case 'phost': Pacts.peaceHostage(c); break;
      case 'ohost': { const k = G.people[+d.k]; Dialog.confirm({ icon: '🤲', title: `Entregar ${k ? k.name : ''} como refém`, danger: true, ok: 'Entregar', text: `${k ? k.name : 'Seu filho'} vai morar no castelo de ${CIV_DEFS[c].short} por ${PACT_MONTHS} meses, e a guerra acaba. Se você atacar ${CIV_DEFS[c].short} nesse tempo, ${k ? k.name : 'o refém'} será executado.` }, () => { Pacts.offerHostage(+d.k, c); UI.refresh(); }); return; }
      case 'free': { const h = Pacts.S().host[c]; if (h) { Pacts.release(h, 'libertado por você'); if (h.from >= 0) Pacts.addRel(h.from, 15); UI.msg('🕊️ Refém libertado. A outra coroa agradece.', 'gold'); } break; }
    }
    UI.refresh();
  };
}
