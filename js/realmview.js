'use strict';
// Painel do reino redesenhado (Portfólio → Gestão → 📈 Painel do reino). Os números e o histórico são os mesmos de
// realmboard.js; a página agora tem a faixa do reino (brasão, quem governa, vilas, tempo e a saúde do reino num medidor)
// e três abas:
//  📊 Visão geral: os seis números com mini gráfico, a mudança do mês e a posição entre os reinos; as ameaças por
//     gravidade e o comparativo com os outros reinos;
//  📈 Gráficos: os seis gráficos grandes, mês a mês;
//  📋 Meses: a tabela de todos os meses anotados.
const RV_TABS = [['geral', '📊', 'Visão geral'], ['graficos', '📈', 'Gráficos'], ['meses', '📋', 'Meses']];

const RealmView = {
  // saúde do reino (0 a 100): felicidade, tesouro, dívida e ameaças
  health(ci) {
    const c = G.civs[ci], H = Board.hist(ci), cur = H[H.length - 1], th = Board.threats(ci);
    let s = (c.happy || 0) * 0.45 + Math.min(25, (cur.tre || 0) / 400) + Math.min(15, (cur.army || 0) / 4) + 15;
    s -= th.reduce((a, t) => a + [0, 2, 6, 12][t.lvl], 0) + Math.min(15, (cur.debt || 0) / 500);
    s = Math.round(U.clamp(s, 0, 100));
    const lab = s >= 70 ? ['Próspero', '#9be37a'] : s >= 45 ? ['Estável', '#e8c06a'] : s >= 25 ? ['Em apuros', '#ffab6a'] : ['Em perigo', '#ff7a6a'];
    return { s, lab: lab[0], col: lab[1] };
  },
  // a posição do reino num número, entre os reinos vivos
  rank(ci, k) {
    const all = G.civs.filter(c => !c.dead).map(c => ({ id: c.id, v: Board.now(c.id)[k] })).sort((a, b) => k === 'debt' ? a.v - b.v : b.v - a.v);
    return { pos: all.findIndex(x => x.id === ci) + 1, of: all.length };
  },
  spark(H, k) {
    const v = H.map(r => r[k]); if (v.length < 2) return '<svg class="rv-spark" viewBox="0 0 100 28"></svg>';
    const mn = Math.min(...v), mx = Math.max(...v), y = x => 26 - (x - mn) / Math.max(1, mx - mn) * 22, pts = v.map((x, i) => `${(i / (v.length - 1) * 100).toFixed(1)},${y(x).toFixed(1)}`).join(' ');
    return `<svg class="rv-spark" viewBox="0 0 100 28" preserveAspectRatio="none"><polygon points="0,28 ${pts} 100,28" class="a"/><polyline points="${pts}" class="l"/></svg>`;
  },
  gauge(h) {
    const a = h.s / 100 * 180, r = 42, cx = 50, cy = 50, rad = d => (180 - d) * Math.PI / 180, px = cx + r * Math.cos(rad(a)), py = cy - r * Math.sin(rad(a));
    return `<svg class="rv-gauge" viewBox="0 0 100 60"><path d="M8 50 A42 42 0 0 1 92 50" class="bg"/><path d="M8 50 A42 42 0 ${a > 180 ? 1 : 0} 1 ${px.toFixed(1)} ${py.toFixed(1)}" style="stroke:${h.col}" class="fg"/>
      <text x="50" y="44" text-anchor="middle" class="n">${h.s}</text><text x="50" y="57" text-anchor="middle" class="t" style="fill:${h.col}">${h.lab}</text></svg>`;
  },
  page(ci) {
    const civs = G.civs.filter(c => !c.dead).sort((a, b) => (b.ruler === 'player') - (a.ruler === 'player') || a.id - b.id);
    if (ci === undefined || !G.civs[ci] || G.civs[ci].dead) ci = civs.length ? civs[0].id : 0;
    const c = G.civs[ci], H = Board.hist(ci), cur = H[H.length - 1], prev = H.length > 1 ? H[H.length - 2] : null, esc = UI.esc.bind(UI), mine = c.ruler === 'player';
    const tab = RV_TABS.some(t => t[0] === UI.sel.rvTab) ? UI.sel.rvTab : 'geral', col = Game.civColor(ci), h = this.health(ci);
    const fmt = n => Math.round(n).toLocaleString('pt-BR');
    const chips = `<div class="rv-chips">${civs.map(o => `<button class="rv-chip ${o.id === ci ? 'on' : ''}" style="--c:${Game.civColor(o.id)}" data-act="rboard" data-c="${o.id}">${Heraldry.armsSvg(o.id, 16)} ${CIV_DEFS[o.id].short}${o.ruler === 'player' ? ' 👑' : ''}</button>`).join('')}</div>`;
    const vils = World.villages.filter(v => v && !v.free && v.civ === ci).length;
    const wx = typeof Clima !== 'undefined' ? `<span>${CLIMA[Clima.kind(ci)].icon} ${CLIMA[Clima.kind(ci)].name}</span><span>${SEASONS[Season.idx()].icon} ${SEASONS[Season.idx()].name}</span>` : '';
    const hero = `<div class="rv-hero" style="--c:${col}"><div class="rv-arms">${Heraldry.armsSvg(ci, 64)}</div>
      <div class="rv-htx"><small>${mine ? 'O seu reino' : 'Reino vizinho'}</small><h3>${esc(CIV_DEFS[ci].name)}</h3>
        <div class="rv-tags"><span>👑 ${mine ? 'você governa' : esc(c.rulerName || '')}</span><span>🏘️ ${vils} ${vils === 1 ? 'vila' : 'vilas'}</span>${wx}${Diplo.warsOf(ci).length ? `<span class="war">⚔️ em guerra</span>` : '<span>🕊️ em paz</span>'}</div></div>
      <div class="rv-health"><small>Saúde do reino</small>${this.gauge(h)}</div></div>`;
    const tabs = `<div class="tabs subtabs rv-tabs">${RV_TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="rvtab" data-t="${k}">${ic} ${l}</button>`).join('')}</div>`;
    let body;
    if (tab === 'geral') {
      const tiles = BOARD_METRICS.map(([k, ic, name, unit]) => {
        const v = cur[k], d = prev ? v - prev[k] : 0, good = k === 'debt' ? d < 0 : d > 0, rk = this.rank(ci, k);
        return `<div class="rv-tile"><div class="rv-th"><span>${ic}</span><small>${name}</small><em class="${rk.pos === 1 ? 'top' : ''}">${rk.pos}º de ${rk.of}</em></div>
          <b>${fmt(v)}${unit.trim() === '%' ? '%' : ''}</b><span class="rv-d ${!d ? '' : good ? 'ok' : 'bad'}">${!prev ? 'primeiro mês' : d ? `${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))} no mês` : '= igual ao mês passado'}</span>${this.spark(H, k)}</div>`;
      }).join('');
      const th = Board.threats(ci);
      const threats = `<div class="card rv-threats"><div class="sec">🚨 Ameaças <span>${th.length || 'nenhuma'}</span></div>${th.length ? th.slice(0, 8).map(t => `<div class="rv-thr l${t.lvl}"><span>${t.ic}</span><span>${esc(t.t)}</span><em>${['', 'atenção', 'sério', 'grave'][t.lvl]}</em></div>`).join('') + (th.length > 8 ? `<small class="muted">e mais ${th.length - 8}</small>` : '')
        : '<div class="rv-calm">🕊️<b>Tudo em paz</b><small>Nenhuma ameaça ao reino neste mês.</small></div>'}</div>`;
      const maxPop = Math.max(...civs.map(o => Board.now(o.id).pop), 1), maxArmy = Math.max(...civs.map(o => Board.now(o.id).army), 1);
      const cmp = `<div class="card rv-cmp"><div class="sec">🏰 Entre os reinos <span>população e exército</span></div>${civs.map(o => { const n = Board.now(o.id);
        return `<div class="rv-cr ${o.id === ci ? 'on' : ''}"><span>${Heraldry.armsSvg(o.id, 16)}</span><b>${CIV_DEFS[o.id].short}</b><span class="rv-b2"><i style="width:${n.pop / maxPop * 100}%;background:${Game.civColor(o.id)}"></i></span><small>👥 ${fmt(n.pop)}</small><span class="rv-b2"><i class="ar" style="width:${n.army / maxArmy * 100}%"></i></span><small>🛡️ ${fmt(n.army)}</small></div>`; }).join('')}</div>`;
      // espiões estrangeiros (lawsplus.js): o investigador nas vilas do seu reino
      const spy = mine && typeof LawsPlus !== 'undefined' ? (() => { const vs = World.villages.map((v, i) => ({ v, i })).filter(x => x.v && !x.v.free && x.v.civ === ci);
        return `<div class="card rv-spy"><div class="sec">🗝️ Investigar espiões <span>150 🪙 por vila · 70% de achar</span></div><div class="rv-spyb">${vs.map(x => `<button data-act="lx" data-op="spy" data-v="${x.i}" ${P.gold >= 150 ? '' : 'disabled'}>🔎 ${esc(x.v.name)}</button>`).join('') || '<small class="muted">Nenhuma vila no reino.</small>'}</div></div>`; })() : '';
      body = `<div class="rv-geral"><div class="rv-tiles">${tiles}</div><div class="rv-side">${threats}${spy}${cmp}</div></div>`;
    } else if (tab === 'graficos') {
      body = `<div class="rv-charts">${BOARD_METRICS.map(([k, ic, name, unit]) => `<div class="card rv-c"><div class="sec">${ic} ${name} <span>${fmt(cur[k])}${unit}</span></div>${Board.chart(H, k, unit)}</div>`).join('')}</div>
        <small class="muted">Os números são anotados na virada de cada mês (até ${BOARD_KEEP} meses). Passe o mouse num ponto para ver o mês.</small>`;
    } else {
      body = `<div class="card rv-table"><div class="sec">📋 Todos os meses <span>${H.length}</span></div><div class="rb-scroll"><table class="trade rv-tbl"><tr><th>Mês</th>${BOARD_METRICS.map(([, ic, name]) => `<th>${ic} ${name}</th>`).join('')}</tr>
        ${H.slice().reverse().map((r, i, a) => `<tr><td>${Calendar.short(r.d)}</td>${BOARD_METRICS.map(([k]) => { const p = a[i + 1], d = p ? r[k] - p[k] : 0, good = k === 'debt' ? d < 0 : d > 0; return `<td>${fmt(r[k])}${d ? ` <small class="${good ? 'ok' : 'bad'}">${d > 0 ? '▲' : '▼'}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</table></div></div>`;
    }
    return chips + hero + tabs + body;
  },
};

// (substitui a página inteira: o quadro dos espiões, que lawsplus.js acrescentava embaixo, agora fica na Visão geral)
Board.page = function (ci) { return RealmView.page(ci); };
{
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) { if (a === 'rvtab') { UI.sel.rvTab = d.t; UI.sel.knav = 'x:painel'; UI.showKingdom(); return; } return a0(a, d); };
}
