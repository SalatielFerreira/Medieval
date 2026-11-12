'use strict';
// O portão, de novo:
//  • Construir: com muro seu (de pedra ou paliçada) o botão do portão funciona, mesmo sem governar vila nem reino.
//  • Sem responsável: o portão não tem porteiro. Ele mesmo fecha diante de inimigos, à noite (toque de recolher),
//    revista as cargas e cobra. Os porteiros contratados antes voltam a ser moradores comuns.
//  • Quem configura: dentro de um reino, o governador da vila e o rei; fora dos reinos, só você. Quando quem manda é
//    um governador ou rei da IA, o portão segue as regras dele e a cobrança vai para o caixa da vila.
//  • A janela nova: a situação do portão, aberto / automático / fechado, as cobranças (caravanas e pessoas, com
//    isenção para o reino e os aliados), as regras (fechar diante de inimigos, toque de recolher, revistar, barrar
//    caravanas de inimigos em guerra, só caravanas do reino), o movimento dos últimos meses e o livro do portão.
if (typeof SHOP_KEEPER !== 'undefined') delete SHOP_KEEPER.vgate;
const GATE_TOLLS2 = [0, 5, 10, 20, 40, 80], GATE_FEES2 = [0, 2, 5, 10, 20];

Object.assign(Gate, {
  // o reino em que o portão está (−1: terras livres)
  realm(s) { if (!World.terr) return -1; const c = World.terr[World.idx(s.x, s.y)]; return c >= 0 && G.civs[c] && !G.civs[c].dead && !G.civs[c].anarchy ? c : -1; },
  // a vila cuja área tem o portão (se houver)
  homeVillage(s) { const v = World.villages[s.village]; if (v && !v.ruin && U.dist(s.x, s.y, v.x, v.y) <= GATE_REACH) return s.village; const vi = Urban.villageNear(s.x, s.y, GATE_REACH); return vi >= 0 ? vi : -1; },
  // quem configura: dentro de um reino, o governador da vila e o rei; fora dos reinos, você
  canConfig(s) {
    const ci = this.realm(s);
    if (ci < 0) return true;
    if (G.civs[ci].ruler === 'player') return true;
    const vi = this.homeVillage(s), v = World.villages[vi];
    return !!v && v.lord === 'player' && (v.free || v.civ === ci);
  },
  ruler(s) {
    const ci = this.realm(s);
    if (ci < 0) return { who: 'você', how: 'terras livres: fora de qualquer reino, só você configura' };
    const c = G.civs[ci], vi = this.homeVillage(s), v = World.villages[vi];
    if (c.ruler === 'player') return { who: 'você', how: `você é soberano de ${CIV_DEFS[ci].short}` };
    if (v && v.lord === 'player') return { who: 'você', how: `você governa ${v.name}` };
    const ch = v && v.chief !== undefined && v.chief !== null ? People.get(v.chief) : null;
    return { who: ch && ch.alive ? People.full(ch) : c.rulerName, how: ch && ch.alive ? `governador de ${v.name} (${CIV_DEFS[ci].short})` : `soberano de ${CIV_DEFS[ci].short}` };
  },
  place(s) { const vi = this.homeVillage(s), v = World.villages[vi], ci = this.realm(s); return v ? v.name : ci >= 0 ? `terras de ${CIV_DEFS[ci].short}` : 'terras livres'; },
  // quem recebe o que o portão cobra
  pay(s, n) {
    if (n <= 0) return;
    const d = this.data(s);
    if (this.canConfig(s)) { P.gold += n; d.earned = (d.earned || 0) + n; return; }
    const vi = this.homeVillage(s);
    if (vi >= 0 && typeof Money !== 'undefined') Money.toVillage(vi, n);
    else { const ci = this.realm(s); if (ci >= 0) G.civs[ci].treasury += n; }
  },
  // a caravana atravessa: regras, pedágio, revista
  caravanPass(c, s) {
    const d = this.data(s), v = World.villages[this.homeVillage(s)], ci = this.realm(s);
    c.gates = c.gates || {}; if (c.gates[s.id]) return; c.gates[s.id] = 1;
    const from = c.from, back = why => {
      d.back = (d.back || 0) + 1; this.log(s, `🐫↩️ Caravana de ${CIV_DEFS[from] ? CIV_DEFS[from].short : 'fora'} deu meia-volta: ${why}.`);
      if (from >= 0 && from !== ci) Game.addRelation(from, -2);
      c.done = true; for (const e of G.ents) if (e.carId === c.id || e.tag === 'carg' + c.id) e.dead = true;
    };
    if (d.manual === 'closed') return back('o portão estava trancado');
    if (d.warBlock && ci >= 0 && from >= 0 && from !== ci && Diplo.atWar(from, ci)) return back('inimigos em guerra não passam');
    if (d.onlyRealm && ci >= 0 && from !== ci) return back('só caravanas do reino passam');
    const free = d.allyFree && ci >= 0 && (from === ci || Diplo.allied(from, ci));
    const toll = free ? 0 : d.toll, tol = U.rint(10, 40) * (from === ci ? 1.4 : 1);
    if (toll > tol * 1.5) return back(`pedágio de ${toll} 🪙 caro demais`);
    let got = toll, line = `🐫 Caravana de ${CIV_DEFS[from] ? CIV_DEFS[from].short : 'fora'} passou${toll ? ` e pagou ${toll} 🪙` : free ? ' (isenta)' : ''}.`;
    if (toll > tol) { line += ' (reclamou do preço)'; if (from >= 0) Game.addRelation(from, -1); }
    else if (v) v.prosper = Math.min(PROSPER_MAX, v.prosper + 0.25);
    if (d.search && Math.random() < 0.15) { const f = U.rint(40, 90); got += f; line += ` Na revista, contrabando apreendido: multa de ${f} 🪙.`; }
    d.cars = (d.cars || 0) + 1; d.month = (d.month || 0) + got;
    this.pay(s, got); this.log(s, line);
  },
  // todo mês: forasteiros, revistas e o histórico; o portão de um governador ou rei da IA segue as regras dele
  monthTick() {
    for (const s of this.list()) {
      const d = this.data(s), v = World.villages[this.homeVillage(s)], ci = this.realm(s), mine = this.canConfig(s);
      d.lastCars = d.cars || 0; // (as caravanas do mês ficam para a conta da economia da vila)
      if (!mine) { d.manual = null; d.auto = true; d.curfew = ci >= 0 && !!G.civs[ci].atWar; d.warBlock = true; }
      const visitors = d.manual === 'closed' ? 0 : (v ? 3 + Math.round(People.residents(this.homeVillage(s)).length / 5) : 1) + U.rint(0, 4);
      let got = 0;
      if (d.fee > 0 && visitors) { got += visitors * d.fee; if (v) v.prosper = Math.max(0, v.prosper - d.fee * 0.15); }
      const parts = [`🚶 Entraram ${visitors} forasteiros${d.fee && visitors ? ` (${visitors * d.fee} 🪙 de entrada)` : ''} e ${d.cars || 0} caravanas.`];
      if (d.search && visitors && Math.random() < 0.3) { const f = U.rint(20, 50); got += f; parts.push(`🦹 A revista barrou um ladrão de fora (multa de ${f} 🪙).`); }
      this.pay(s, got); d.month = (d.month || 0) + got;
      for (const t of parts) this.log(s, t);
      d.hist = d.hist || []; d.hist.push({ m: d.month || 0, c: d.cars || 0, v: visitors }); if (d.hist.length > 6) d.hist.shift();
      d.lastMonth = d.month || 0; d.month = 0; d.cars = 0; d.back = 0;
    }
  },
  // com o portão fechando diante de inimigos, o saque e a tomada da vila nem sempre dão certo (não precisa de porteiro)
  guarded(vi) { const v = World.villages[vi]; return !!v && this.list().some(s => this.homeVillage(s) === vi && (this.peek(s) || {}).auto !== false && (this.peek(s) || {}).manual !== 'open'); },
});
// (mudar de lugar e demolir: quem configura e também quem ergueu o portão no próprio muro)
Gate.mine = s => !!s && (Gate.canConfig(s) || !!s.pgate);

// ---------------------------------------------------------------- a janela do portão
Gate.open = function (sid) {
  const s = World.structs[sid]; if (!s || s.removed || s.type !== 'vgate') return;
  const d = this.data(s), mine = this.canConfig(s), closed = this.closedNow(s, d), ru = this.ruler(s), esc = UI.esc.bind(UI);
  const alarm = d.alarm > G.realTime, night = d.curfew && Routine.phase() === 'night';
  const state = d.manual === 'closed' ? ['🔒', 'Trancado', 'fechado por ordem de quem manda'] : d.manual === 'open' ? ['🔓', 'Sempre aberto', 'ninguém fecha, nem diante de inimigos'] : alarm ? ['⚠️', 'Fechado', 'inimigos à vista'] : night ? ['🌙', 'Fechado', 'toque de recolher'] : ['🔓', 'Aberto', 'automático: fecha sozinho quando precisa'];
  const B = (k, v, lab, on, extra) => `<button class="${on ? 'on' : ''}" data-act="gate" data-s="${s.id}" data-k="${k}" data-v="${v}" ${mine ? '' : 'disabled'} ${extra || ''}>${lab}</button>`;
  const T = (k, ic, lab, desc) => `<div class="gt-rule ${d[k] ? 'on' : ''}"><span>${ic}</span><div><b>${lab}</b><small>${desc}</small></div>${B(k, d[k] ? 0 : 1, d[k] ? 'Ligado' : 'Desligado', !!d[k])}</div>`;
  const hist = (d.hist || []).slice(-6), mx = Math.max(10, ...hist.map(h => h.m));
  const bars = hist.length ? hist.map((h, i) => `<div class="gt-bar" title="${h.m} 🪙 · ${h.c} caravanas · ${h.v} forasteiros"><i style="height:${Math.max(4, Math.round(h.m / mx * 100))}%"></i><small>${i === hist.length - 1 ? 'último' : `-${hist.length - 1 - i}`}</small></div>`).join('') : '<p class="muted">O histórico começa no fim do mês.</p>';
  const body = `<div class="gt">
    <div class="gt-top ${closed ? 'closed' : 'open'}"><div class="gt-ic">${state[0]}</div><div class="gt-tx"><small>Portão · ${esc(this.place(s))}</small><h3>${state[1]}</h3><i>${state[2]}</i></div>
      <div class="gt-who"><small>Quem configura</small><b>${esc(ru.who)}</b><i>${esc(ru.how)}</i></div></div>
    <div class="gt-cols">
      <div class="card gt-c"><div class="sec">🚪 Funcionamento</div>
        <div class="gt-mode">${B('manual', 'open', '🔓 Sempre aberto', d.manual === 'open')}${B('manual', 'auto', '⚙️ Automático', !d.manual)}${B('manual', 'closed', '🔒 Trancado', d.manual === 'closed')}</div>
        <div class="gt-kv"><span>💰 Rendeu no total</span><b>${(d.earned || 0).toLocaleString('pt-BR')} 🪙</b></div>
        <div class="gt-kv"><span>📅 Mês passado</span><b>${d.lastMonth || 0} 🪙</b></div>
        <div class="gt-kv"><span>🐫 Caravanas neste mês</span><b>${d.cars || 0}${d.back ? ` · ${d.back} voltaram` : ''}</b></div>
        <div class="sec" style="margin-top:8px">📊 Últimos meses</div><div class="gt-bars">${bars}</div>
        ${!mine && closed ? `<div class="act-row" style="margin-top:8px"><button class="primary" data-act="gate" data-s="${s.id}" data-k="pass" data-v="1">🙋 Pedir passagem${d.fee ? ` (${d.fee} 🪙)` : ''}</button></div>` : ''}</div>
      <div class="card gt-c"><div class="sec">🪙 Cobranças</div>
        <div class="gt-charge"><div><b>🐫 Pedágio das caravanas</b><small>caro demais, elas dão meia-volta e o reino delas se irrita</small></div><div class="gt-seg">${GATE_TOLLS2.map(t => B('toll', t, t ? t + ' 🪙' : 'Grátis', d.toll === t)).join('')}</div></div>
        <div class="gt-charge"><div><b>🚶 Entrada das pessoas</b><small>cobrada dos forasteiros; cara demais esfria a vila</small></div><div class="gt-seg">${GATE_FEES2.map(t => B('fee', t, t ? t + ' 🪙' : 'Grátis', d.fee === t)).join('')}</div></div>
        ${T('allyFree', '🤝', 'Isentar o reino e os aliados', 'caravanas do próprio reino e de reinos aliados não pagam')}</div>
      <div class="card gt-c"><div class="sec">🛡️ Regras</div>
        ${T('auto', '⚔️', 'Fechar diante de inimigos', 'bandidos, feras ou soldados inimigos por perto: tranca na hora')}
        ${T('curfew', '🌙', 'Toque de recolher', 'fechado à noite')}
        ${T('search', '🔍', 'Revistar as cargas', 'multas de contrabando e ladrões barrados')}
        ${T('warBlock', '🏴', 'Barrar inimigos em guerra', 'caravanas de reinos em guerra voltam')}
        ${T('onlyRealm', '🏰', 'Só caravanas do reino', 'as de fora dão meia-volta')}</div>
    </div>
    <div class="card gt-log"><div class="sec">📖 Livro do portão</div><div class="gt-ll">${d.log.length ? d.log.map(l => `<div><em>${Calendar.short(l.day)}</em> ${esc(l.text)}</div>`).join('') : '<p class="muted">Nada anotado ainda.</p>'}</div></div>
  </div>`;
  UI.open(`🚪 Portão de ${this.place(s)}`, body, 'showGate', [sid], mine ? 'Você configura este portão' : `Configurado por ${ru.who}`);
};
Gate.act = function (dd) {
  const s = World.structs[+dd.s]; if (!s) return;
  const d = this.data(s), v = World.villages[this.homeVillage(s)], ci = this.realm(s);
  if (dd.k === 'pass') {
    if (typeof Crime !== 'undefined' && ci >= 0 && Crime.wanted(ci)) { this.log(s, `⚖️ ${G.name} pediu passagem e foi reconhecido: procurado.`); UI.showArrest(ci); return; }
    if (ci >= 0 && G.civs[ci].atWar && Diplo.atWar && G.civs.some(c => c.ruler === 'player' && Diplo.atWar(c.id, ci))) { UI.msg('🚪 "Inimigos do reino não passam!"', 'bad'); return; }
    if (d.manual === 'closed') { UI.msg('🚪 O portão está trancado por ordem de quem manda.', 'bad'); return; }
    if (d.fee && P.gold < d.fee) { UI.msg(`🚪 A entrada custa ${d.fee} 🪙.`, 'bad'); return; }
    if (d.fee) { P.gold -= d.fee; this.pay(s, d.fee); }
    s.passUntil = G.realTime + 5; this.apply(s); this.log(s, `🚶 ${G.name} pediu passagem${d.fee ? ` e pagou ${d.fee} 🪙` : ''}.`);
    UI.close(); UI.msg('🚪 O portão se abre para você passar.'); return;
  }
  if (!this.canConfig(s)) { UI.msg(`Só ${this.ruler(s).who} configura este portão.`, 'bad'); return; }
  if (dd.k === 'manual') d.manual = dd.v === 'auto' ? null : dd.v;
  else if (dd.k === 'toll' || dd.k === 'fee') d[dd.k] = +dd.v;
  else if (['auto', 'curfew', 'search', 'allyFree', 'warBlock', 'onlyRealm'].includes(dd.k)) d[dd.k] = dd.v === '1';
  void v; this.apply(s); this.open(s.id);
};

{
  // o botão do portão funciona com muro seu (antes, só para quem governava)
  const st0 = Urban.start.bind(Urban);
  Urban.start = function (mode) {
    if (mode === 'c:vgate' && !this.hasAny() && Gate.ownsWalls && Gate.ownsWalls()) { const h0 = this.hasAny; this.hasAny = () => true; try { return st0(mode); } finally { this.hasAny = h0; } }
    return st0(mode);
  };
  const il0 = Game.interactLabel.bind(Game);
  Game.interactLabel = function (s) { if (s && s.type === 'vgate') return `Portão — ${Gate.canConfig(s) ? 'configurar' : s.gateClosed ? 'pedir passagem' : 'ver o portão'}`; return il0(s); };
  // sem porteiro: quem era porteiro volta a ser morador comum (jogos salvos)
  const dismiss = () => { for (const p of G.people) if (p && p.rank === 'gatekeeper') { p.rank = 'peasant'; p.shop = null; const e = G.spawned && G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); } } };
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); if (G.state === 'play') { try { dismiss(); } catch (e) { console.error(e); } } return r; };
}
