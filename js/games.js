'use strict';
// Jogos dos Sete Reinos: todo mês de agosto, cada ano num reino diferente, as provas acontecem na arena do reino anfitrião
// (justa, arco e flecha e duelos). Cada reino manda os seus heróis; você compete indo até a arena. Medalhas, ouro e fama
// para os vencedores, festa no reino campeão e o povo vai até lá para assistir.

const GAMES_MONTH = 7; // agosto
const GAMES_EVENTS = { joust: ['🐎', 'Justa'], archery: ['🏹', 'Arco e flecha'], duel: ['⚔️', 'Duelos'] };
const GAMES_PRIZE = [500, 250, 100], GAMES_FAME = [20, 10, 5];

const Games = {
  S() { const u = G.urban || (G.urban = {}); return u.games || (u.games = { year: 0, host: -1, on: false, day: -1, me: {}, champs: {}, medals: {}, history: [] }); },
  hostName() { const S = this.S(); return S.host >= 0 && CIV_DEFS[S.host] ? CIV_DEFS[S.host].short : '?'; },
  nextHost() { const S = this.S(); for (let k = 1; k <= G.civs.length; k++) { const ci = (S.host + k + G.civs.length) % G.civs.length; if (G.civs[ci] && !G.civs[ci].anarchy) return ci; } return 0; },
  // o campeão de cada reino em cada prova (heróis primeiro; sem herói, um cavaleiro)
  champs(ev) {
    const S = this.S(); const out = [];
    G.civs.forEach((c, ci) => {
      if (!c || c.anarchy) return;
      const key = ci + ':' + ev; let p = S.champs[key] !== undefined ? G.people[S.champs[key]] : null;
      if (!p || !p.alive) {
        const used = Object.values(S.champs), list = (typeof Heroes !== 'undefined' ? Heroes.of(ci) : []).concat(G.people.filter(q => q.alive && q.civ === ci && q.rank === 'knight'));
        p = list.find(q => !used.includes(q.id)) || list[0] || null; if (p) S.champs[key] = p.id;
      }
      if (p) out.push({ ci, p, power: 40 + (p.hero ? Math.min(60, p.hero.fame / 3) : 10) + (p.str ? p.str / 10 : 0) });
    });
    return out;
  },
  start() {
    const S = this.S(), cd = Calendar.of(G.day);
    S.year = cd.year; S.host = this.nextHost(); S.on = true; S.day = G.day; S.me = {}; S.champs = {};
    const c = G.civs[S.host]; c.happy = Math.min(100, c.happy + 5);
    UI.banner(`🏅 Jogos dos Sete Reinos em ${this.hostName()}!`);
    UI.msg(`🏅 Começaram os Jogos dos Sete Reinos na arena de ${this.hostName()}: justa, arco e flecha e duelos. Vá até a arena para competir (até o fim do mês). O povo de todos os reinos está a caminho.`, 'gold', true);
    Diplo.chronicle(`🏅 ${CIV_DEFS[S.host].name} recebe os Jogos dos Sete Reinos do ano ${S.year}.`, true);
  },
  // o resultado: o jogador compete com a nota que fez; os campeões da IA, pela força com um pouco de sorte
  resolve() {
    const S = this.S(); S.on = false;
    const rec = { year: S.year, host: S.host, ev: {} }, gold = {};
    for (const ev of Object.keys(GAMES_EVENTS)) {
      const list = this.champs(ev).map(x => ({ who: x.p.id, name: People.full(x.p), ci: x.ci, score: x.power * U.rnd(0.6, 1.25) }));
      if (S.me[ev] !== undefined) list.push({ who: 'player', name: `${G.name} ${G.surname || ''}`.trim(), ci: G.mainRealm !== undefined && G.mainRealm !== null ? G.mainRealm : -1, score: S.me[ev] });
      list.sort((a, b) => b.score - a.score);
      rec.ev[ev] = list.slice(0, 3).map(x => ({ name: x.name, ci: x.ci, who: x.who }));
      list.slice(0, 3).forEach((x, k) => {
        if (x.ci >= 0) { const m = S.medals[x.ci] || (S.medals[x.ci] = [0, 0, 0]); m[k]++; if (k === 0) gold[x.ci] = (gold[x.ci] || 0) + 1; }
        if (x.who === 'player') { P.gold += GAMES_PRIZE[k]; Court.addFame(GAMES_FAME[k]); UI.msg(`🏅 ${['🥇 Ouro', '🥈 Prata', '🥉 Bronze'][k]} na ${GAMES_EVENTS[ev][1]}! +${GAMES_PRIZE[k]} 🪙 e +${GAMES_FAME[k]} de fama.`, 'gold', true); Progress.diary(`🏅 ${['Ouro', 'Prata', 'Bronze'][k]} na ${GAMES_EVENTS[ev][1]} dos Jogos dos Sete Reinos (${this.hostName()}).`); }
        else { const p = G.people[x.who]; if (p && p.hero && typeof Heroes !== 'undefined') Heroes.deed(p, `${['venceu', 'foi prata', 'foi bronze'][k]} na ${GAMES_EVENTS[ev][1].toLowerCase()} dos Jogos em ${this.hostName()}`, GAMES_FAME[k]); }
      });
    }
    const best = Object.entries(gold).sort((a, b) => b[1] - a[1])[0];
    if (best) { const c = G.civs[best[0]]; c.happy = Math.min(100, c.happy + 6); rec.champion = +best[0]; Diplo.chronicle(`🏅 ${CIV_DEFS[best[0]].name} foi o grande campeão dos Jogos do ano ${S.year}.`, true); }
    S.history.unshift(rec); if (S.history.length > 12) S.history.length = 12;
    UI.msg(`🏅 Fim dos Jogos dos Sete Reinos: ${Object.entries(rec.ev).map(([ev, L]) => `${GAMES_EVENTS[ev][0]} ${L[0] ? L[0].name : '—'}`).join(' · ')}.`, 'gold', true);
  },
  monthTick() {
    const S = this.S(), cd = Calendar.of(G.day);
    if (S.on && G.day > S.day) this.resolve();
    if (cd.month === GAMES_MONTH && S.year !== cd.year) this.start();
  },
  // ---------------------------------------------------------------- você compete
  canPlay(ev) { const S = this.S(); return S.on && S.me[ev] === undefined && Arena.inColiseum(S.host); },
  play(ev) {
    const S = this.S();
    if (!S.on) { UI.msg('Os Jogos não estão acontecendo agora.', 'bad'); return; }
    if (!Arena.inColiseum(S.host)) { UI.msg(`As provas são na arena de ${this.hostName()}.`, 'bad'); return; }
    if (S.me[ev] !== undefined) { UI.msg('Você já competiu nessa prova.', 'bad'); return; }
    G.gamesBout = ev; UI.close();
    if (ev === 'joust') { Arena.joustStart(S.host, 2, 0); if (!G.joust) G.gamesBout = null; }
    else if (ev === 'duel') { Arena.startDuel(S.host, 2, 0); if (!G.duel) G.gamesBout = null; }
    else this.archery();
  },
  // arco e flecha: a marca corre de um lado para o outro; atire quando ela passar pelo centro (3 flechas)
  archery() { G.arch = { shots: [], t0: performance.now(), period: Math.max(700, 1300 - P.level * 15) }; this.showArch(); },
  showArch() {
    const A = G.arch; A.t0 = performance.now();
    const pts = A.shots.reduce((a, n) => a + n, 0);
    UI.open('🏹 Arco e flecha', `<div class="arch"><p class="dt-desc">Atire quando a marca passar pelo centro do alvo. ${3 - A.shots.length} flecha(s).</p>
      <div class="arch-bar"><b class="arch-c"></b><i class="arch-mk" style="animation-duration:${A.period / 2}ms"></i></div>
      <div class="arch-shots">${A.shots.map(n => `<span class="${n >= 8 ? 'ok' : n <= 3 ? 'bad' : ''}">🎯 ${n}</span>`).join('')}</div><p><b>${pts}</b> de 30 pontos</p>
      <div class="act-row">${A.shots.length < 3 ? '<button class="primary" data-act="gArrow">🏹 Atirar</button>' : '<button class="primary" data-act="gArchEnd">Terminar</button>'}</div></div>`, 'showArch', [], `Jogos dos Sete Reinos · ${this.hostName()}`);
  },
  shoot() {
    const A = G.arch; if (!A || A.shots.length >= 3) return;
    const ph = ((performance.now() - A.t0) % A.period) / A.period, pos = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    A.shots.push(Math.max(0, Math.round(10 - Math.abs(pos - 0.5) * 40))); Sound.play('hit', { vol: 0.4 });
    this.showArch();
  },
  archEnd() { const A = G.arch; if (!A) return; this.S().me.archery = Math.round(A.shots.reduce((a, n) => a + n, 0) * 3.3); G.arch = null; G.gamesBout = null; UI.msg(`🏹 Você fez ${this.S().me.archery} pontos no arco e flecha. O resultado sai no fim do mês.`, 'gold'); UI.showGames(); },
  // ---------------------------------------------------------------- janela
  page() {
    const S = this.S(), esc = UI.esc.bind(UI), cd = Calendar.of(G.day);
    const next = S.on ? `<b class="ok">Acontecendo agora em ${esc(this.hostName())}</b> (até ${Calendar.short(S.day + 1)})` : `Próximos jogos: agosto do ano ${cd.month < GAMES_MONTH ? cd.year : cd.year + 1}, em ${esc(CIV_DEFS[this.nextHost()].short)}`;
    const evs = Object.entries(GAMES_EVENTS).map(([ev, [ic, nm]]) => {
      const L = this.champs(ev).sort((a, b) => b.power - a.power);
      return `<div class="card games-ev"><div class="sec">${ic} ${nm} ${S.me[ev] !== undefined ? `<span>você fez ${S.me[ev]} pontos</span>` : ''}</div>
        ${L.map(x => `<div class="games-c">${Heraldry.armsSvg(x.ci, 14)} <b>${esc(People.full(x.p))}</b><small>${CIV_DEFS[x.ci].short} · força ${Math.round(x.power)}</small></div>`).join('')}
        ${S.on ? `<button class="primary" data-act="gPlay" data-k="${ev}" ${this.canPlay(ev) ? '' : 'disabled'}>${S.me[ev] !== undefined ? '✔ Você já competiu' : Arena.inColiseum(S.host) ? 'Competir' : `Vá à arena de ${esc(this.hostName())}`}</button>` : ''}</div>`;
    }).join('');
    const table = Object.entries(S.medals).sort((a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1]).map(([ci, m]) => `<tr><td>${Heraldry.armsSvg(+ci, 14)} ${CIV_DEFS[ci].short}</td><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td></tr>`).join('');
    const hist = S.history.map(h => `<div class="bank-log"><small>ano ${h.year} · ${CIV_DEFS[h.host].short}</small> ${Object.entries(h.ev).map(([ev, L]) => `${GAMES_EVENTS[ev][0]} ${esc(L[0] ? L[0].name : '—')}`).join(' · ')}${h.champion !== undefined ? ` · 🏆 ${CIV_DEFS[h.champion].short}` : ''}</div>`).join('');
    return `<div class="card games-top"><div class="sec">🏅 Jogos dos Sete Reinos</div><p class="dt-desc">Todo agosto, cada ano num reino, os heróis dos sete reinos disputam a justa, o arco e flecha e os duelos na grande arena, diante do povo. ${next}.</p>
      <p class="dt-desc">Prêmios: 🥇 ${GAMES_PRIZE[0]} 🪙 · 🥈 ${GAMES_PRIZE[1]} 🪙 · 🥉 ${GAMES_PRIZE[2]} 🪙, e fama. O reino com mais ouros faz festa.</p></div>
      <div class="games-grid">${evs}</div>
      ${table ? `<div class="card"><div class="sec">🏆 Quadro de medalhas</div><div class="tbl-wrap"><table class="games-t"><tr><th>Reino</th><th>🥇</th><th>🥈</th><th>🥉</th></tr>${table}</table></div></div>` : ''}
      ${hist ? `<div class="card"><div class="sec">📜 Jogos anteriores</div>${hist}</div>` : ''}`;
  },
};
UI.showGames = function () { this.open('🏅 Jogos dos Sete Reinos', `<div class="gamesw">${Games.page()}</div>`, 'showGames', [], 'Justa, arco e flecha e duelos entre os reinos'); };

{
  // resultado da justa e do duelo quando são dos Jogos
  const je0 = Arena.joustEnd.bind(Arena);
  Arena.joustEnd = function (win) { const g = G.gamesBout; const r = je0(win); if (g === 'joust') { Games.S().me.joust = win ? 92 : 40; G.gamesBout = null; UI.msg(`🐎 Justa dos Jogos: ${win ? 'você derrubou o adversário' : 'você caiu do cavalo'} (${Games.S().me.joust} pontos). O resultado sai no fim do mês.`, win ? 'gold' : 'bad'); } return r; };
  const aw0 = Arena.win.bind(Arena);
  Arena.win = function (...a) { const g = G.gamesBout; const r = aw0(...a); if (g === 'duel') { Games.S().me.duel = 90; G.gamesBout = null; UI.msg('⚔️ Duelo dos Jogos vencido (90 pontos). O resultado sai no fim do mês.', 'gold'); } return r; };
  const al0 = Arena.lose.bind(Arena);
  Arena.lose = function (...a) { const g = G.gamesBout; const r = al0(...a); if (g === 'duel') { Games.S().me.duel = 35; G.gamesBout = null; } return r; };
  // na banca da arena anfitriã: as provas
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    const S = Games.S();
    if (fn === 'showArena' && args && S.on && args[0] === S.host) body = `<div class="card games-top"><div class="sec">🏅 Jogos dos Sete Reinos <span>até ${Calendar.short(S.day + 1)}</span></div><div class="act-row">${Object.entries(GAMES_EVENTS).map(([ev, [ic, nm]]) => `<button class="primary" data-act="gPlay" data-k="${ev}" ${Games.canPlay(ev) ? '' : 'disabled'}>${ic} ${nm}${S.me[ev] !== undefined ? ' ✔' : ''}</button>`).join('')}<button data-act="games">📋 Competidores e medalhas</button></div></div>` + body;
    return op0(title, body, fn, args, sub);
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Games.monthTick(); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'games') { UI.showGames(); return; }
    if (a === 'gPlay') { Games.play(d.k); return; }
    if (a === 'gArrow') { Games.shoot(); return; }
    if (a === 'gArchEnd') { Games.archEnd(); return; }
    return a0(a, d);
  };
}
