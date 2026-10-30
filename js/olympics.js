'use strict';
// Jogos dos Sete Reinos (Portfólio → Jogos) redesenhado em páginas que cabem na janela (Services.subs/paginate):
//  🏟️ O evento: onde os Jogos estão acontecendo (ou o próximo anfitrião e quantos meses faltam), o seu progresso, os
//     prêmios no pódio e como funciona;
//  ⚔️ As provas: as sete provas com os favoritos de cada reino e o botão de competir;
//  📜 Registros: cada edição já disputada (ano, anfitrião, grande campeão) com o pódio de cada prova;
//  🏆 Medalhas e lendas: o quadro de medalhas de todos os tempos, os atletas com mais medalhas e as suas medalhas.
// As provas, os prêmios e o histórico são os de games.js.
const Olympics = {
  esc(s) { return UI.esc(s); },
  arms(ci, sz) { return ci >= 0 && CIV_DEFS[ci] ? Heraldry.armsSvg(ci, sz) : '<span class="og-noarms">🏳️</span>'; },
  civName(ci) { return ci >= 0 && CIV_DEFS[ci] ? CIV_DEFS[ci].short : 'sem reino'; },
  // quantos meses até agosto
  monthsLeft() { const m = Calendar.of(G.day).month; return m < GAMES_MONTH ? GAMES_MONTH - m : 12 - m + GAMES_MONTH; },
  // os atletas com mais medalhas, juntando todas as edições
  legends() {
    const by = {};
    for (const h of Games.S().history) for (const [ev, L] of Object.entries(h.ev)) L.forEach((x, k) => { if (!x) return; const key = x.who === 'player' ? 'player' : x.name; const r = by[key] || (by[key] = { name: x.name, ci: x.ci, who: x.who, m: [0, 0, 0], evs: {} }); r.m[k]++; r.evs[ev] = (r.evs[ev] || 0) + 1; });
    return Object.values(by).sort((a, b) => b.m[0] - a.m[0] || b.m[1] - a.m[1] || b.m[2] - a.m[2]);
  },
  // ---------------------------------------------------------------- a competição ao vivo
  // Quando os Jogos começam, cada atleta da IA ganha a nota que vai fazer e o momento do mês em que compete; a página
  // mostra, prova a prova, quem já competiu e em que lugar está (você no meio). O pódio final usa essas mesmas notas.
  // Quando os Jogos acabam, a classificação é limpa (o resultado fica nos Registros).
  live() {
    const S = Games.S(); if (!S.on) return null;
    if (!S.live) { S.live = {}; for (const ev of Object.keys(GAMES_EVENTS)) S.live[ev] = Games.champs(ev).map(x => ({ who: x.p.id, ci: x.ci, name: People.full(x.p), score: Math.round(x.power * U.rnd(0.6, 1.25)), t: U.rnd(0.05, 0.95) })); }
    return S.live;
  },
  frac() { const S = Games.S(); return G.day > S.day ? 1 : U.clamp((G.time || 0) / DAY_LEN, 0, 1); },
  standings(ev) {
    const S = Games.S(), L = this.live(); if (!L) return { list: [], total: 0 };
    const f = this.frac(), all = (L[ev] || []).filter(x => G.people[x.who] && G.people[x.who].alive);
    const list = all.filter(x => x.t <= f).map(x => ({ ...x }));
    if (S.me[ev] !== undefined) list.push({ who: 'player', ci: G.mainRealm !== undefined && G.mainRealm !== null ? G.mainRealm : -1, name: `${G.name} ${G.surname || ''}`.trim(), score: S.me[ev] });
    list.sort((a, b) => b.score - a.score);
    return { list, total: all.length + 1 };
  },
  card(ev, canHere) {
    const S = Games.S(), esc = this.esc.bind(this), [ic, nm, desc] = GAMES_EVENTS[ev], me = S.me[ev];
    if (!S.on) return `<div class="og-ev off"><div class="og-eh"><span>${ic}</span><b>${nm}</b></div><small class="og-desc">${desc}</small><div class="og-empty">⏳ Sem competição agora.<br><small>Os atletas aparecem aqui quando os Jogos começarem, em agosto.</small></div></div>`;
    const st = this.standings(ev), mx = Math.max(1, ...st.list.map(x => x.score)), pos = st.list.findIndex(x => x.who === 'player');
    const top = st.list.slice(0, 3); if (pos >= 3) top.push(st.list[pos]);
    return `<div class="og-ev ${me !== undefined ? 'done' : ''}"><div class="og-eh"><span>${ic}</span><b>${nm}</b>${me !== undefined ? `<em>${pos + 1}º · ${me} pts</em>` : ''}</div><small class="og-desc">${desc}</small>
      <div class="og-live2"><small>🔴 Classificação ao vivo · ${st.list.length} de ${st.total} competiram</small>${top.length ? top.map(x => { const k = st.list.indexOf(x);
        return `<div class="${x.who === 'player' ? 'me' : ''}"><em>${k < 3 ? GAMES_MEDAL[k] : `${k + 1}º`}</em>${this.arms(x.ci, 14)}<span>${esc(x.name)}</span><i class="og-b"><i style="width:${x.score / mx * 100}%"></i></i><b>${x.score}</b></div>`; }).join('') : '<div class="og-wait2">Ninguém competiu ainda.</div>'}</div>
      ${canHere ? `<button class="${me === undefined ? 'primary' : ''}" data-act="gPlay" data-k="${ev}" ${Games.canPlay(ev) ? '' : 'disabled'}>${me !== undefined ? '✔ Você já competiu' : `${ic} Competir`}</button>` : `<small class="muted og-wait">${me !== undefined ? '✔ Você já competiu' : `Compita na arena de ${esc(Games.hostName())}`}</small>`}</div>`;
  },
  html() {
    const S = Games.S(), esc = this.esc.bind(this), cd = Calendar.of(G.day), evKeys = Object.keys(GAMES_EVENTS);
    const host = S.on ? S.host : Games.nextHost(), done = evKeys.filter(ev => S.me[ev] !== undefined).length;
    const inArena = S.on && Arena.inColiseum(S.host);
    // 🏟️ o evento
    const status = S.on
      ? `<div class="og-live"><i></i>Acontecendo agora</div><h3>Jogos do ano ${S.year} em ${esc(CIV_DEFS[S.host].name)}</h3><p>Na grande arena de ${esc(CIV_DEFS[S.host].short)}, até ${Calendar.short(S.day + 1)}. ${inArena ? '<b class="ok">Você está na arena: escolha uma prova!</b>' : `Vá até a arena de ${esc(CIV_DEFS[S.host].short)} para competir.`}</p>`
      : `<div class="og-soon">Próximos Jogos</div><h3>Agosto do ano ${cd.month < GAMES_MONTH ? cd.year : cd.year + 1} em ${esc(CIV_DEFS[host].name)}</h3><p>Faltam <b>${this.monthsLeft()} ${this.monthsLeft() === 1 ? 'mês' : 'meses'}</b>. Cada ano os Jogos são num reino diferente, na arena do anfitrião.</p>`;
    const ring = `<div class="og-ring" style="--p:${done / evKeys.length * 100}"><b>${done}/${evKeys.length}</b><small>provas</small></div>`;
    const hosts = (() => { const L = []; let h = S.on ? S.host : (S.host >= 0 ? S.host : -1); for (let k = 0; k < 4; k++) { h = (h + 1 + G.civs.length) % G.civs.length; while (G.civs[h] && G.civs[h].anarchy) h = (h + 1) % G.civs.length; L.push(h); } return L; })();
    const evento = `<div class="og-hero" style="--c:${Game.civColor(host)}"><div class="og-arms">${this.arms(host, 72)}</div><div class="og-htx">${status}</div>${S.on ? ring : `<div class="og-count"><b>${this.monthsLeft()}</b><small>${this.monthsLeft() === 1 ? 'mês' : 'meses'}</small></div>`}</div>
      <div class="og-row">
        <div class="card og-prize"><div class="sec">🏅 Prêmios de cada prova</div><div class="og-pod">${[1, 0, 2].map(k => `<div class="p${k + 1}"><b>${GAMES_MEDAL[k]}</b><span>${GAMES_PRIZE[k].toLocaleString('pt-BR')} 🪙</span><small>+${GAMES_FAME[k]} de fama</small><i></i></div>`).join('')}</div><small class="muted">O reino com mais ouros é o grande campeão e faz festa. Cinco medalhas nos mesmos Jogos: +15 de fama.</small></div>
        <div class="card og-how"><div class="sec">📜 Como funciona</div>
          <div class="og-step"><span>📅</span><b>Todo agosto</b><small>cada ano num reino diferente</small></div><div class="og-step"><span>🏟️</span><b>Na arena do anfitrião</b><small>vá até lá para competir</small></div>
          <div class="og-step"><span>⚔️</span><b>Sete provas</b><small>quatro de luta, justa, arco e corrida</small></div><div class="og-step"><span>🎖️</span><b>Pódio em cada prova</b><small>ouro, prata e bronze, com prêmio e fama</small></div>
          <div class="og-next"><small>Próximos anfitriões:</small>${hosts.map(h => `<span>${this.arms(h, 14)} ${this.civName(h)}</span>`).join('')}</div></div></div>`;
    // ⚔️ as provas
    const provas = `<div class="og-evs sv-pl">${evKeys.map(ev => this.card(ev, inArena)).join('')}</div>`;
    // 📜 registros: uma edição por quadro
    const regs = S.history.length ? `<div class="og-hist sv-pl">${S.history.map((h, i) => `<div class="og-ed" style="--c:${Game.civColor(h.host)}"><div class="og-edh">${this.arms(h.host, 34)}<div><b>Jogos do ano ${h.year}</b><small>em ${esc(CIV_DEFS[h.host] ? CIV_DEFS[h.host].name : '?')}</small></div>${h.champion !== undefined ? `<span class="og-champ">🏆 Grande campeão: ${this.arms(h.champion, 16)} <b>${this.civName(h.champion)}</b></span>` : ''}</div>
        <div class="og-edg">${Object.entries(h.ev).filter(([ev]) => GAMES_EVENTS[ev]).map(([ev, L]) => `<div class="og-er"><span class="og-ei">${GAMES_EVENTS[ev][0]} ${GAMES_EVENTS[ev][1]}</span>${[0, 1, 2].map(k => { const x = L[k]; return `<span class="og-m m${k} ${x && x.who === 'player' ? 'me' : ''}">${GAMES_MEDAL[k]} ${x ? `${this.arms(x.ci, 12)} ${esc(x.name)}` : '—'}</span>`; }).join('')}</div>`).join('')}</div></div>`).join('')}</div>`
      : '<div class="sv-none">📜<small>Nenhuma edição disputada ainda. Os primeiros Jogos são em agosto.</small></div>';
    // 🏆 medalhas e lendas
    const noRealm = [0, 0, 0]; for (const h of S.history) for (const L of Object.values(h.ev)) L.forEach((x, k) => { if (x && !(x.ci >= 0)) noRealm[k]++; }); // quem competiu sem reino (como você, sem trono)
    const tab = Object.entries(S.medals).map(([ci, m]) => ({ ci: +ci, m })).concat(noRealm.some(n => n) ? [{ ci: -1, m: noRealm }] : []).sort((a, b) => b.m[0] - a.m[0] || b.m[1] - a.m[1] || b.m[2] - a.m[2]);
    const mxT = Math.max(1, ...tab.map(x => x.m[0] + x.m[1] + x.m[2]));
    const leg = this.legends(), me = leg.find(x => x.who === 'player');
    const medals = `<div class="og-row two"><div class="card og-table"><div class="sec">🏆 Quadro de medalhas <span>de todos os tempos</span></div>${tab.length ? `<div class="og-th"><span></span><span>Reino</span><span>🥇</span><span>🥈</span><span>🥉</span><span></span></div>${tab.map((x, i) => `<div class="og-tr ${i === 0 ? 'top' : ''}"><em>${i + 1}º</em><span>${this.arms(x.ci, 16)} ${this.civName(x.ci)}</span><b>${x.m[0]}</b><b>${x.m[1]}</b><b>${x.m[2]}</b><i class="og-b"><i style="width:${(x.m[0] + x.m[1] + x.m[2]) / mxT * 100}%;background:${x.ci >= 0 ? Game.civColor(x.ci) : '#8a7a5a'}"></i></i></div>`).join('')}` : '<div class="sv-none">🏆<small>Nenhuma medalha ainda.</small></div>'}</div>
      <div class="og-col"><div class="card og-me"><div class="sec">🎖️ As suas medalhas</div>${me ? `<div class="og-mine">${[0, 1, 2].map(k => `<div><b>${GAMES_MEDAL[k]}</b><span>${me.m[k]}</span><small>${GAMES_MEDAL_N[k]}</small></div>`).join('')}</div><small class="muted">Em: ${Object.keys(me.evs).map(ev => GAMES_EVENTS[ev] ? GAMES_EVENTS[ev][0] : '').join(' ')}</small>` : '<small class="muted">Nenhuma ainda. Vá à arena do anfitrião em agosto!</small>'}</div>
        <div class="card og-leg"><div class="sec">🌟 Lendas dos Jogos</div>${leg.slice(0, 7).map((x, i) => `<div class="og-lr ${x.who === 'player' ? 'me' : ''}"><em>${i + 1}</em>${this.arms(x.ci, 14)}<span>${esc(x.name)}${x.ci >= 0 ? '' : ' <i class="og-nr">sem reino</i>'}</span><small>🥇${x.m[0]} 🥈${x.m[1]} 🥉${x.m[2]}</small></div>`).join('') || '<small class="muted">As lendas aparecem depois dos primeiros Jogos.</small>'}</div></div></div>`;
    const list = [['evento', '🏟️', S.on ? 'O evento • agora' : 'O evento', evento], ['provas', '⚔️', 'As provas', provas], ['registros', '📜', `Registros${S.history.length ? ` (${S.history.length})` : ''}`, regs], ['medalhas', '🏆', 'Medalhas e lendas', medals]];
    return Services.subs('og', list);
  },
};

// a página 🏅 Jogos dentro da Arena (abaixo de Torneio): o evento e as provas, com o botão de competir
Olympics.arena = function (ci) {
  const S = Games.S(), esc = this.esc.bind(this), keys = Object.keys(GAMES_EVENTS), here = S.on && S.host === ci, done = keys.filter(ev => S.me[ev] !== undefined).length;
  const host = S.on ? S.host : Games.nextHost();
  const head = UI.pageHead('🏅', 'Jogos dos Sete Reinos', here ? `Acontecendo nesta arena até ${Calendar.short(S.day + 1)}` : S.on ? `Este ano os Jogos são na arena de ${esc(Games.hostName())}` : `Próximos: agosto, na arena de ${esc(CIV_DEFS[host].short)}`);
  const bar = `<div class="og-abar" style="--c:${Game.civColor(host)}">${this.arms(host, 40)}<div><b>${here ? '● Acontecendo agora, aqui' : S.on ? `Acontecendo em ${esc(CIV_DEFS[S.host].name)}` : `Próximos Jogos em ${esc(CIV_DEFS[host].name)}`}</b><small>${here ? `Você fez ${done} de ${keys.length} provas. Ao terminar todas, os Jogos se encerram com os pódios.` : S.on ? `Viaje até a arena de ${esc(Games.hostName())} para competir.` : `Faltam ${this.monthsLeft()} ${this.monthsLeft() === 1 ? 'mês' : 'meses'} (todo agosto, cada ano num reino).`}</small></div>
    <span class="og-aprize">${[0, 1, 2].map(k => `<em>${GAMES_MEDAL[k]} ${GAMES_PRIZE[k].toLocaleString('pt-BR')} 🪙</em>`).join('')}</span><button data-act="games">📋 Registros e medalhas</button></div>`;
  const cards = keys.map(ev => this.card(ev, here)).join('');
  return head + `<div class="og-apage">${bar}<div class="og-evs og-arena">${cards}</div></div>`;
};
Games.page = function () { return Olympics.html(); };
{
  // os Jogos começam: a competição ao vivo é sorteada; terminam: o pódio sai das mesmas notas e tudo é limpo
  const st0 = Games.start.bind(Games);
  Games.start = function (...a) { const r = st0(...a); this.S().live = null; Olympics.live(); return r; };
  const rs0 = Games.resolve.bind(Games);
  Games.resolve = function (...a) {
    const S = this.S(), L = S.on ? Olympics.live() : null, ch0 = this.champs, rnd0 = U.rnd;
    if (L) { this.champs = ev => (L[ev] || []).filter(x => G.people[x.who] && G.people[x.who].alive).map(x => ({ ci: x.ci, p: G.people[x.who], power: x.score })); U.rnd = (a, b) => (a <= 1 && b >= 1 ? 1 : rnd0(a, b)); }
    let r; try { r = rs0(...a); } finally { this.champs = ch0; U.rnd = rnd0; }
    if (r) { S.live = null; S.me = {}; }
    return r;
  };
}
{
  // a página cabe na janela: o que não couber vira partes
  const sk0 = UI.showKingdom.bind(UI);
  UI.showKingdom = function (...a) { const r = sk0(...a); if (this.sel.knav === 'x:games') { try { Services.paginate(); } catch (e) { console.error(e); } } return r; };
  const sg0 = UI.showGames.bind(UI);
  UI.showGames = function (...a) { const r = sg0(...a); try { Services.paginate(); } catch (e) { console.error(e); } return r; };
  // a Arena ganha a página 🏅 Jogos (abaixo de Torneio)
  const sa0 = UI.showArena.bind(UI);
  UI.showArena = function (ci) {
    const want = this.sel.atab === 'jogos', S = Games.S(), op = this.open; let a = null;
    if (want) this.sel.atab = 'lutar';
    this.open = (...x) => { a = x; };
    try { sa0(ci); } finally { this.open = op; if (want) this.sel.atab = 'jogos'; }
    if (!a) return;
    const t = document.createElement('template'); t.innerHTML = a[1];
    const tor = t.content.querySelector('[data-act="anav"][data-k="torneio"]');
    if (tor) tor.insertAdjacentHTML('afterend', `<button class="snav-i" data-act="anav" data-k="jogos"><span class="si">🏅</span><span class="sl">Jogos</span>${S.on && S.host === ci ? '<em class="warn">!</em>' : ''}</button>`);
    if (want) {
      t.content.querySelectorAll('[data-act="anav"]').forEach(b => b.classList.toggle('on', b.dataset.k === 'jogos'));
      const body = t.content.querySelector('.snav-body'); if (body) body.innerHTML = `<div class="kpg">${Olympics.arena(ci)}</div>`;
    }
    const r = this.open(a[0], t.innerHTML, a[2], a[3], a[4]);
    this.fitReino('a:' + (want ? 'jogos' : this.sel.atab || 'lutar'), 'ar/' + (want ? 'jogos' : this.sel.atab || 'lutar'));
    return r;
  };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:games') return this.pageHead('🏅', 'Jogos dos Sete Reinos', 'O evento, as provas, os registros de cada edição e as medalhas') + Games.page(); return kp0(nav); };
}
