'use strict';
// Painel do reino: tudo num só lugar. Para cada reino (os seus primeiro), os números de agora com a mudança desde o mês
// passado, um gráfico de cada um ao longo dos meses (até 3 anos), as ameaças do momento e uma tabela com o histórico.
// O histórico é anotado na virada de cada mês, de todos os reinos (poucos números: o jogo salvo quase não cresce).
const BOARD_KEEP = 36;
const BOARD_METRICS = [
  // [chave, ícone, nome, unidade]
  ['pop', '👥', 'População', ''],
  ['tre', '💰', 'Tesouro', ' 🪙'],
  ['hap', '😊', 'Felicidade', '%'],
  ['army', '🛡️', 'Exército', ' soldados'],
  ['bank', '🏦', 'Reserva do banco', ' 🪙'],
  ['debt', '🧾', 'Dívida com o banco', ' 🪙'],
];

const Board = {
  S() { const u = G.urban || (G.urban = {}); return u.board || (u.board = {}); },
  now(ci) {
    const c = G.civs[ci], K = typeof Bank !== 'undefined' ? Bank.K(ci) : { reserve: 0, debt: 0 };
    const merc = typeof Mercs !== 'undefined' && Mercs.soldiersOf ? (Mercs.soldiersOf(ci) || 0) + (c.ruler === 'player' && Pacts.main() === ci ? Mercs.soldiersOf('player') || 0 : 0) : 0;
    return { d: G.day, pop: Math.round(c.pop || 0), tre: Math.round(c.treasury || 0), hap: Math.round(c.happy || 0), army: Math.round((c.garrison || 0) + merc), bank: Math.round(K.reserve || 0), debt: Math.round(K.debt || 0) };
  },
  record() {
    const S = this.S();
    for (const c of G.civs) {
      if (c.dead) continue;
      const H = S[c.id] || (S[c.id] = []), r = this.now(c.id);
      if (H.length && H[H.length - 1].d === r.d) H[H.length - 1] = r; else H.push(r);
      if (H.length > BOARD_KEEP) H.splice(0, H.length - BOARD_KEEP);
    }
  },
  // o histórico com o mês de agora no fim (o que mudou desde a virada também aparece)
  hist(ci) { const H = (this.S()[ci] || []).slice(), r = this.now(ci); if (H.length && H[H.length - 1].d === r.d) H[H.length - 1] = r; else H.push(r); return H; },
  // ---------------------------------------------------------------- ameaças
  threats(ci) {
    const c = G.civs[ci], out = [], add = (lvl, ic, t) => out.push({ lvl, ic, t });
    for (const w of Diplo.warsOf(ci)) { const o = w.a === ci ? w.b : w.a; add(3, '⚔️', `Guerra com ${CIV_DEFS[o].short} (desde ${Calendar.short(w.since)})`); }
    if (c.anarchy) add(3, '💥', 'Anarquia: o reino quebrou');
    if (c.rebel > 0) add(3, '🔥', 'Rebelião em andamento');
    if (typeof Bank !== 'undefined') { const K = Bank.K(ci); if (K.crisis >= 2) add(3, '🏦', 'Banco em crise grave'); else if (K.crisis) add(2, '🏦', 'Banco em crise'); const camps = Bank.B().camps.filter(x => x.ci === ci && !x.cleared).length; if (camps) add(2, '🏴', `${camps} acampamento(s) de bárbaros`); }
    if ((c.happy || 0) < 35) add(2, '😠', `Povo descontente (${Math.round(c.happy)}%)`);
    const raided = World.villages.filter(v => v && !v.free && v.civ === ci && v.raid && v.raid.until >= G.day); if (raided.length) add(3, '🔥', `Vilas atacadas: ${raided.map(v => v.name).join(', ')}`);
    if (c.ruler === 'player' && typeof Court !== 'undefined' && Court.plotsOf && Court.plotsOf(ci).length) add(3, '🗡️', 'Complô na corte');
    for (const o of G.civs) if (o.id !== ci && !o.dead && !Diplo.atWar(ci, o.id) && Diplo.rel(ci, o.id) < -40) add(1, '⚠️', `${CIV_DEFS[o.id].short} hostil (relação ${Math.round(Diplo.rel(ci, o.id))})`);
    if (typeof Pacts !== 'undefined') for (const t of Pacts.S().trib.filter(t => t.from === ci)) add(1, '💰', `Paga tributo a ${CIV_DEFS[t.to].short}: ${t.amt} 🪙/mês`);
    if (typeof Clima !== 'undefined') { if (Clima.drought(ci)) add(2, '🔥', 'Seca: comida mais cara, vilas perdendo prosperidade'); else if (Season.winter()) add(1, '❄️', 'Inverno: comida cara e estradas lentas'); }
    const H = this.hist(ci); if (H.length >= 4 && H.slice(-4).every((r, i, a) => !i || r.tre < a[i - 1].tre)) add(2, '📉', 'O tesouro cai há 3 meses');
    return out.sort((a, b) => b.lvl - a.lvl);
  },
  // ---------------------------------------------------------------- gráfico de uma série (uma linha, um eixo)
  chart(H, key, unit) {
    const W = 300, Ht = 110, L = 40, R = 10, T = 10, B = 22, vals = H.map(r => r[key]);
    let mn = Math.min(...vals), mx = Math.max(...vals); if (key === 'hap') { mn = Math.min(mn, 0); mx = Math.max(mx, 100); } if (mn > 0 && key !== 'hap') mn = Math.max(0, mn - (mx - mn) * 0.15); if (mx === mn) mx = mn + 1;
    const x = i => L + (H.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (H.length - 1)), y = v => T + (1 - (v - mn) / (mx - mn)) * (Ht - T - B);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const fmt = v => Math.abs(v) >= 10000 ? (v / 1000).toFixed(0) + ' mil' : Math.round(v).toLocaleString('pt-BR');
    const last = vals[vals.length - 1], lx = x(vals.length - 1), ly = y(last);
    const hits = H.map((r, i) => `<rect class="rb-hit" x="${(x(i) - (W - L - R) / Math.max(1, H.length - 1) / 2).toFixed(1)}" y="${T}" width="${Math.max(6, (W - L - R) / Math.max(1, H.length - 1)).toFixed(1)}" height="${Ht - T - B}"><title>${Calendar.short(r.d)}: ${fmt(r[key])}${unit}</title></rect><circle class="rb-dot" cx="${x(i).toFixed(1)}" cy="${y(r[key]).toFixed(1)}" r="4"/>`).join('');
    return `<svg class="rb-chart" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="${key}">
      <line class="rb-grid" x1="${L}" x2="${W - R}" y1="${y(mx)}" y2="${y(mx)}"/><line class="rb-grid" x1="${L}" x2="${W - R}" y1="${y(mn)}" y2="${y(mn)}"/>
      <text class="rb-ax" x="${L - 4}" y="${y(mx) + 4}" text-anchor="end">${fmt(mx)}</text><text class="rb-ax" x="${L - 4}" y="${y(mn) + 4}" text-anchor="end">${fmt(mn)}</text>
      <text class="rb-ax" x="${L}" y="${Ht - 6}">${Calendar.short(H[0].d)}</text><text class="rb-ax" x="${W - R}" y="${Ht - 6}" text-anchor="end">${H.length > 1 ? Calendar.short(H[H.length - 1].d) : ''}</text>
      ${H.length > 1 ? `<polygon class="rb-area" points="${x(0)},${y(mn)} ${pts} ${lx},${y(mn)}"/><polyline class="rb-line" points="${pts}"/>` : ''}
      <circle class="rb-last" cx="${lx}" cy="${ly}" r="4"/>${hits}</svg>`;
  },
  // os itens do grupo Gestão do Portfólio
  navItems() {
    const th = G.civs.filter(c => c.ruler === 'player').reduce((a, c) => a + this.threats(c.id).filter(t => t.lvl >= 3).length, 0);
    return [['x:painel', '📈', 'Painel do reino', th || '', th > 0], ['x:pacts', '📜', 'Tratados', Pacts.S().host.length || ''], ['x:clima', SEASONS[Season.idx()].icon, 'Estações e clima']];
  },
  // ---------------------------------------------------------------- a página
  page(ci) {
    const civs = G.civs.filter(c => !c.dead).sort((a, b) => (b.ruler === 'player') - (a.ruler === 'player') || a.id - b.id);
    if (ci === undefined || !G.civs[ci] || G.civs[ci].dead) ci = civs.length ? civs[0].id : 0;
    const c = G.civs[ci], H = this.hist(ci), cur = H[H.length - 1], prev = H.length > 1 ? H[H.length - 2] : null, esc = UI.esc.bind(UI), mine = c.ruler === 'player';
    const chips = civs.map(o => `<button class="tab ${o.id === ci ? 'on' : ''}" data-act="rboard" data-c="${o.id}">${Heraldry.armsSvg(o.id, 14)} ${CIV_DEFS[o.id].short}${o.ruler === 'player' ? ' 👑' : ''}</button>`).join('');
    const tiles = BOARD_METRICS.map(([k, ic, name, unit]) => {
      const v = cur[k], d = prev ? v - prev[k] : 0, good = k === 'debt' ? d < 0 : d > 0;
      return `<div class="rb-tile"><small>${ic} ${name}</small><b>${v.toLocaleString('pt-BR')}${unit.trim() === '%' ? '%' : ''}</b><span class="${!d ? 'muted' : good ? 'ok' : 'bad'}">${!prev ? 'primeiro mês' : d ? `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('pt-BR')} no mês` : '— igual'}</span></div>`;
    }).join('');
    const th = this.threats(ci);
    const threats = `<div class="card rb-threats"><div class="sec">🚨 Ameaças <span>${th.length ? th.length : 'nenhuma'}</span></div>${th.length ? th.map(t => `<div class="rb-th l${t.lvl}"><span>${t.ic}</span><span>${esc(t.t)}</span><em>${['', 'atenção', 'sério', 'grave'][t.lvl]}</em></div>`).join('') : '<p class="ok">✅ Tudo em paz no reino.</p>'}</div>`;
    const charts = BOARD_METRICS.map(([k, ic, name, unit]) => `<div class="card rb-c"><div class="sec">${ic} ${name}</div>${this.chart(H, k, unit)}</div>`).join('');
    const table = `<details class="rb-tab"><summary>📋 Ver a tabela dos meses (${H.length})</summary><div class="rb-scroll"><table class="trade"><tr><th>Mês</th>${BOARD_METRICS.map(([, ic, name]) => `<th>${ic} ${name}</th>`).join('')}</tr>${H.slice().reverse().map(r => `<tr><td>${Calendar.short(r.d)}</td>${BOARD_METRICS.map(([k]) => `<td>${r[k].toLocaleString('pt-BR')}</td>`).join('')}</tr>`).join('')}</table></div></details>`;
    const wx = typeof Clima !== 'undefined' ? `<span class="tag">${CLIMA[Clima.kind(ci)].icon} ${CLIMA[Clima.kind(ci)].name}</span> <span class="tag">${SEASONS[Season.idx()].icon} ${SEASONS[Season.idx()].name}</span>` : '';
    return `<div class="rb-chips">${chips}</div>
      <div class="rb-title">${Heraldry.armsSvg(ci, 40)}<div><h3>${esc(CIV_DEFS[ci].name)}</h3><small>${mine ? 'seu reino' : esc(c.rulerName)} · ${World.villages.filter(v => v && !v.free && v.civ === ci).length} vilas ${wx}</small></div></div>
      <div class="rb-tiles">${tiles}</div>${threats}<div class="rb-grid2">${charts}</div>${table}`;
  },
};

{
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Board.record(); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) {
    if (nav === 'x:painel') return UI.pageHead('📈', 'Painel do reino', 'População, tesouro, felicidade, exército, banco e ameaças, mês a mês') + Board.page(UI.sel.rbCiv);
    if (nav === 'x:pacts') return UI.pageHead('📜', 'Tratados', 'Casamentos entre dinastias, comércio, tributos e reféns') + Pacts.page();
    if (nav === 'x:clima') return UI.pageHead(SEASONS[Season.idx()].icon, 'Estações e clima', 'O que a estação e o tempo de cada reino mudam no jogo') + Clima.page();
    return kp0(nav);
  };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'rboard') { UI.sel.rbCiv = +d.c; UI.sel.knav = 'x:painel'; UI.showKingdom(); return; } return a0(a, d); };
  UI.showBoard = function (ci) { if (ci !== undefined) this.sel.rbCiv = ci; this.sel.knav = 'x:painel'; this.showKingdom(); };
}
