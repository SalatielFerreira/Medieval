'use strict';
// Jogos dos Sete Reinos: todo mês de agosto, cada ano num reino diferente, as provas acontecem na arena do reino anfitrião.
// São sete provas — a maioria de luta: duelo de espadas, luta sem armas, o Desafio dos Três (três duelos seguidos), o
// Duelo dos Campeões contra o melhor herói dos reinos, a justa, o arco e flecha e a corrida a cavalo. Cada reino manda os
// seus heróis; você compete indo até a arena. Quando você termina todas as provas, os Jogos se encerram na hora (senão,
// no fim do mês) com a cerimônia dos pódios: ouro, prata e bronze em cada prova, com prêmio e fama para os três.

const GAMES_MONTH = 7; // agosto
const GAMES_EVENTS = {
  duel:     ['⚔️', 'Duelo de espadas',    'Um duelo contra um veterano: quem cair primeiro perde.'],
  brawl:    ['👊', 'Luta sem armas',      'Só os punhos: as armas ficam de fora da areia.'],
  gauntlet: ['🛡️', 'Desafio dos Três',    'Três duelos seguidos, do lutador ao campeão. Cada vitória vale pontos.'],
  masters:  ['👑', 'Duelo dos Campeões',  'Contra o herói mais forte dos sete reinos.'],
  joust:    ['🐎', 'Justa',               'Três passadas a cavalo com a lança.'],
  archery:  ['🏹', 'Arco e flecha',       'Três flechas no alvo.'],
  race:     ['🏇', 'Corrida a cavalo',    'Três retas: esporeie quando a marca passar pela faixa verde.'],
};
const GAMES_DUELS = ['duel', 'brawl', 'gauntlet', 'masters'];
const GAMES_PRIZE = [1500, 800, 400], GAMES_FAME = [20, 10, 5];
const GAMES_MEDAL = ['🥇', '🥈', '🥉'], GAMES_MEDAL_N = ['Ouro', 'Prata', 'Bronze'];

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
      if (p) out.push({ ci, p, power: 40 + (p.hero ? Math.min(60, p.hero.fame / 3) : 10) + (p.str ? p.str / 10 : 0) + (GAMES_DUELS.includes(ev) && p.hero ? 6 : 0) });
    });
    return out;
  },
  // o herói mais forte de todos (o adversário do Duelo dos Campeões)
  bestChamp() { return this.champs('masters').sort((a, b) => b.power - a.power)[0] || null; },
  allDone() { const S = this.S(); return Object.keys(GAMES_EVENTS).every(ev => S.me[ev] !== undefined); },
  start() {
    const S = this.S(), cd = Calendar.of(G.day);
    S.year = cd.year; S.host = this.nextHost(); S.on = true; S.day = G.day; S.me = {}; S.champs = {};
    const c = G.civs[S.host]; c.happy = Math.min(100, c.happy + 5);
    UI.banner(`🏅 Jogos dos Sete Reinos em ${this.hostName()}!`);
    UI.msg(`🏅 Começaram os Jogos dos Sete Reinos na arena de ${this.hostName()}: sete provas (${Object.values(GAMES_EVENTS).map(e => e[1].toLowerCase()).join(', ')}). Vá até a arena para competir. Quando você terminar todas, os Jogos se encerram com os pódios.`, 'gold', true);
    Diplo.chronicle(`🏅 ${CIV_DEFS[S.host].name} recebe os Jogos dos Sete Reinos do ano ${S.year}.`, true);
  },
  // o resultado: o jogador compete com a nota que fez; os campeões da IA, pela força com um pouco de sorte.
  // Cada prova tem o seu pódio, e os três primeiros levam prêmio e fama.
  resolve() {
    const S = this.S(); if (!S.on) return null; S.on = false;
    const rec = { year: S.year, host: S.host, ev: {} }, gold = {};
    let mine = 0;
    for (const ev of Object.keys(GAMES_EVENTS)) {
      const list = this.champs(ev).map(x => ({ who: x.p.id, name: People.full(x.p), ci: x.ci, score: Math.round(x.power * U.rnd(0.6, 1.25)) }));
      if (S.me[ev] !== undefined) list.push({ who: 'player', name: `${G.name} ${G.surname || ''}`.trim(), ci: G.mainRealm !== undefined && G.mainRealm !== null ? G.mainRealm : -1, score: S.me[ev] });
      list.sort((a, b) => b.score - a.score);
      rec.ev[ev] = list.slice(0, 3).map(x => ({ name: x.name, ci: x.ci, who: x.who, score: x.score }));
      list.slice(0, 3).forEach((x, k) => {
        if (x.ci >= 0) { const m = S.medals[x.ci] || (S.medals[x.ci] = [0, 0, 0]); m[k]++; if (k === 0) gold[x.ci] = (gold[x.ci] || 0) + 1; }
        if (x.who === 'player') {
          P.gold += GAMES_PRIZE[k]; Court.addFame(GAMES_FAME[k]); mine++;
          UI.msg(`🏅 ${GAMES_MEDAL[k]} ${GAMES_MEDAL_N[k]} em ${GAMES_EVENTS[ev][1]}! +${GAMES_PRIZE[k]} 🪙 e +${GAMES_FAME[k]} de fama.`, 'gold', true);
          Progress.diary(`🏅 ${GAMES_MEDAL_N[k]} em ${GAMES_EVENTS[ev][1]} nos Jogos dos Sete Reinos (${this.hostName()}).`);
        } else {
          const p = G.people[x.who]; if (!p) return;
          p.purse = People.purse(p) + Math.round(GAMES_PRIZE[k] / 4);
          if (p.hero && typeof Heroes !== 'undefined') Heroes.deed(p, `${['venceu', 'foi prata', 'foi bronze'][k]} em ${GAMES_EVENTS[ev][1].toLowerCase()} nos Jogos em ${this.hostName()}`, GAMES_FAME[k]);
        }
      });
    }
    const best = Object.entries(gold).sort((a, b) => b[1] - a[1])[0];
    if (best) { const c = G.civs[best[0]]; c.happy = Math.min(100, c.happy + 6); rec.champion = +best[0]; Diplo.chronicle(`🏅 ${CIV_DEFS[best[0]].name} foi o grande campeão dos Jogos do ano ${S.year}.`, true); }
    if (mine >= 5) { Court.addFame(15); UI.msg(`🌟 ${mine} medalhas nos mesmos Jogos: o povo dos sete reinos fala do seu nome (+15 de fama).`, 'gold', true); }
    S.history.unshift(rec); if (S.history.length > 12) S.history.length = 12;
    UI.msg(`🏅 Fim dos Jogos dos Sete Reinos: ${Object.entries(rec.ev).map(([ev, L]) => `${GAMES_EVENTS[ev][0]} ${L[0] ? L[0].name : '—'}`).join(' · ')}.`, 'gold', true);
    return rec;
  },
  // você terminou todas as provas: os Jogos se encerram agora, com a cerimônia
  finishIfDone() {
    const S = this.S(); if (!S.on || !this.allDone()) return;
    setTimeout(() => {
      if (!S.on || G.duel || G.joust || G.arch || G.race) return;
      const rec = this.resolve(); if (!rec) return;
      UI.banner('🏅 Cerimônia dos pódios');
      UI.showPodium(rec);
    }, 1600);
  },
  monthTick() {
    const S = this.S(), cd = Calendar.of(G.day);
    G.gamesBout = null; G.gamesRun = null;
    if (S.on && G.day > S.day) this.resolve();
    if (cd.month === GAMES_MONTH && S.year !== cd.year) this.start();
  },
  // ---------------------------------------------------------------- você compete
  canPlay(ev) { const S = this.S(); return S.on && S.me[ev] === undefined && Arena.inColiseum(S.host) && !G.duel && !G.joust; },
  done(ev, score, text, good) {
    const S = this.S(); S.me[ev] = Math.round(score); G.gamesBout = null; G.gamesRun = null;
    const left = Object.keys(GAMES_EVENTS).filter(k => S.me[k] === undefined).length;
    UI.msg(`${GAMES_EVENTS[ev][0]} ${text} (${S.me[ev]} pontos). ${left ? `Faltam ${left} prova(s).` : 'Era a última prova: os Jogos vão se encerrar com os pódios!'}`, good ? 'gold' : 'bad', !left);
    this.finishIfDone();
  },
  play(ev) {
    const S = this.S();
    if (!S.on) { UI.msg('Os Jogos não estão acontecendo agora.', 'bad'); return; }
    if (!Arena.inColiseum(S.host)) { UI.msg(`As provas são na arena de ${this.hostName()}.`, 'bad'); return; }
    if (S.me[ev] !== undefined) { UI.msg('Você já competiu nessa prova.', 'bad'); return; }
    if (G.duel || G.joust) return;
    G.gamesBout = ev; UI.close();
    if (ev === 'joust') { Arena.joustStart(S.host, 2, 0); if (!G.joust) G.gamesBout = null; }
    else if (ev === 'duel') this.fight(1);
    else if (ev === 'brawl') this.fight(0, { brawl: true });
    else if (ev === 'gauntlet') { G.gamesRun = { ev, wins: 0 }; this.fight(0); }
    else if (ev === 'masters') this.fight(2, { masters: true });
    else if (ev === 'race') this.race();
    else this.archery();
  },
  // um duelo dos Jogos na areia (sem aposta); a luta sem armas e o Duelo dos Campeões mudam o adversário
  fight(tier, o) {
    const S = this.S(); P.hp = Math.max(P.hp, P.maxHp * 0.8);
    Arena.startDuel(S.host, tier, 0);
    const d = G.duel; if (!d) { G.gamesBout = null; G.gamesRun = null; return; }
    d.games = G.gamesBout;
    if (o && o.brawl) { d.brawl = true; d.ent.dmg = Math.round(d.ent.dmg * 0.6); d.ent.hp = d.ent.maxHp = Math.round(d.ent.maxHp * 0.7); d.ent.duelName = `${d.ent.duelName} (de punhos)`; }
    if (o && o.masters) {
      const b = this.bestChamp();
      if (b) { d.ent.duelName = People.full(b.p); d.ent.name = d.ent.duelName; const k = 1 + Math.min(0.6, b.power / 200); d.ent.hp = d.ent.maxHp = Math.round(d.ent.maxHp * k); d.ent.dmg = Math.round(d.ent.dmg * (0.9 + k / 5)); }
      UI.banner(`👑 ${d.ent.duelName}, campeão dos campeões`);
    }
  },
  // pontos de um duelo vencido: vencer com mais vida vale mais
  duelScore(base) { return base + Math.round(25 * U.clamp(P.hp / P.maxHp, 0, 1)); },
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
  archEnd() {
    const A = G.arch; if (!A) return;
    const pts = Math.round(A.shots.reduce((a, n) => a + n, 0) * 3.3); G.arch = null;
    this.done('archery', pts, 'Você terminou o arco e flecha', pts >= 50); UI.showGames();
  },
  // corrida a cavalo: três retas; a faixa verde fica mais estreita a cada reta
  race() { G.race = { laps: [], t0: performance.now(), period: Math.max(650, 1150 - P.level * 12) }; this.showRace(); },
  raceZone() { const R = G.race; return 0.22 - R.laps.length * 0.05; },
  showRace() {
    const R = G.race; R.t0 = performance.now();
    const pts = R.laps.reduce((a, n) => a + n, 0), z = this.raceZone();
    UI.open('🏇 Corrida a cavalo', `<div class="arch"><p class="dt-desc">Esporeie quando a marca passar pela faixa verde. ${3 - R.laps.length} reta(s) até a chegada.</p>
      <div class="arch-bar race-bar"><b class="race-z" style="left:${(0.5 - z / 2) * 100}%;width:${z * 100}%"></b><i class="arch-mk" style="animation-duration:${R.period / 2}ms"></i></div>
      <div class="arch-shots">${R.laps.map(n => `<span class="${n >= 8 ? 'ok' : n <= 3 ? 'bad' : ''}">🏇 ${n}</span>`).join('')}</div><p><b>${pts}</b> de 30 pontos</p>
      <div class="act-row">${R.laps.length < 3 ? '<button class="primary" data-act="gSpur">🏇 Esporear</button>' : '<button class="primary" data-act="gRaceEnd">Cruzar a chegada</button>'}</div></div>`, 'showRace', [], `Jogos dos Sete Reinos · ${this.hostName()}`);
  },
  spur() {
    const R = G.race; if (!R || R.laps.length >= 3) return;
    const ph = ((performance.now() - R.t0) % R.period) / R.period, pos = ph < 0.5 ? ph * 2 : 2 - ph * 2, off = Math.abs(pos - 0.5), z = this.raceZone() / 2;
    R.laps.push(off <= z ? 10 - Math.round(off / z * 3) : Math.max(0, Math.round(6 - (off - z) * 30))); Sound.play('swing', { vol: 0.4 });
    this.showRace();
  },
  raceEnd() {
    const R = G.race; if (!R) return;
    const pts = Math.round(R.laps.reduce((a, n) => a + n, 0) * 3.3); G.race = null;
    this.done('race', pts, 'Você cruzou a chegada da corrida', pts >= 50); UI.showGames();
  },
  // ---------------------------------------------------------------- janelas
  podiumHtml(rec) {
    const esc = UI.esc.bind(UI);
    const step = (x, k) => x ? `<div class="pod-s p${k}"><span class="pod-who ${x.who === 'player' ? 'me' : ''}">${x.ci >= 0 ? Heraldry.armsSvg(x.ci, 14) : ''} ${esc(x.name)}</span><small>${x.score !== undefined ? x.score + ' pts' : ''}</small><div class="pod-b">${GAMES_MEDAL[k]}<i>${k + 1}º</i></div></div>` : `<div class="pod-s p${k}"><div class="pod-b">—</div></div>`;
    return Object.entries(rec.ev).map(([ev, L]) => GAMES_EVENTS[ev] ? `<div class="card pod-card"><div class="sec">${GAMES_EVENTS[ev][0]} ${GAMES_EVENTS[ev][1]}</div>
      <div class="podium">${step(L[1], 1)}${step(L[0], 0)}${step(L[2], 2)}</div></div>` : '').join('');
  },
  page() {
    const S = this.S(), esc = UI.esc.bind(UI), cd = Calendar.of(G.day);
    const next = S.on ? `<b class="ok">Acontecendo agora em ${esc(this.hostName())}</b> (até ${Calendar.short(S.day + 1)})` : `Próximos jogos: agosto do ano ${cd.month < GAMES_MONTH ? cd.year : cd.year + 1}, em ${esc(CIV_DEFS[this.nextHost()].short)}`;
    const done = Object.keys(GAMES_EVENTS).filter(ev => S.me[ev] !== undefined).length;
    const evs = Object.entries(GAMES_EVENTS).map(([ev, [ic, nm, desc]]) => {
      const L = this.champs(ev).sort((a, b) => b.power - a.power);
      return `<div class="card games-ev"><div class="sec">${ic} ${nm} ${S.me[ev] !== undefined ? `<span>você fez ${S.me[ev]} pontos</span>` : ''}</div><small class="muted">${desc}</small>
        ${L.slice(0, 4).map(x => `<div class="games-c">${Heraldry.armsSvg(x.ci, 14)} <b>${esc(People.full(x.p))}</b><small>${CIV_DEFS[x.ci].short} · força ${Math.round(x.power)}</small></div>`).join('')}
        ${S.on ? `<button class="primary" data-act="gPlay" data-k="${ev}" ${this.canPlay(ev) ? '' : 'disabled'}>${S.me[ev] !== undefined ? '✔ Você já competiu' : Arena.inColiseum(S.host) ? 'Competir' : `Vá à arena de ${esc(this.hostName())}`}</button>` : ''}</div>`;
    }).join('');
    const table = Object.entries(S.medals).sort((a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1]).map(([ci, m]) => `<tr><td>${Heraldry.armsSvg(+ci, 14)} ${CIV_DEFS[ci].short}</td><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td></tr>`).join('');
    const hist = S.history.map((h, i) => `<div class="bank-log"><small>ano ${h.year} · ${CIV_DEFS[h.host].short}</small> ${Object.entries(h.ev).filter(([ev]) => GAMES_EVENTS[ev]).map(([ev, L]) => `${GAMES_EVENTS[ev][0]} ${esc(L[0] ? L[0].name : '—')}`).join(' · ')}${h.champion !== undefined ? ` · 🏆 ${CIV_DEFS[h.champion].short}` : ''} <button class="mini" data-act="gPodium" data-i="${i}">🏅 Pódios</button></div>`).join('');
    return `<div class="card games-top"><div class="sec">🏅 Jogos dos Sete Reinos</div><p class="dt-desc">Todo agosto, cada ano num reino, os heróis dos sete reinos disputam sete provas na grande arena, diante do povo. ${next}.</p>
      <p class="dt-desc">Em cada prova: 🥇 ${GAMES_PRIZE[0]} 🪙 · 🥈 ${GAMES_PRIZE[1]} 🪙 · 🥉 ${GAMES_PRIZE[2]} 🪙, e fama (${GAMES_FAME.join(' / ')}). O reino com mais ouros faz festa. ${S.on ? `Você fez <b>${done} de ${Object.keys(GAMES_EVENTS).length}</b> provas — ao terminar todas, os Jogos se encerram com a cerimônia dos pódios.` : ''}</p></div>
      <div class="games-grid">${evs}</div>
      ${table ? `<div class="card"><div class="sec">🏆 Quadro de medalhas</div><div class="tbl-wrap"><table class="games-t"><tr><th>Reino</th><th>🥇</th><th>🥈</th><th>🥉</th></tr>${table}</table></div></div>` : ''}
      ${hist ? `<div class="card"><div class="sec">📜 Jogos anteriores</div>${hist}</div>` : ''}`;
  },
};
UI.showGames = function () { this.open('🏅 Jogos dos Sete Reinos', `<div class="gamesw">${Games.page()}</div>`, 'showGames', [], 'Sete provas entre os reinos: duelos, justa, arco e corrida'); };
UI.showPodium = function (rec) {
  if (typeof rec === 'number') rec = Games.S().history[rec];
  if (!rec) return;
  this.open('🏅 Pódios dos Jogos', `<div class="gamesw"><div class="card games-top"><div class="sec">🏅 Jogos dos Sete Reinos · ano ${rec.year} · ${CIV_DEFS[rec.host].short}</div>
    ${rec.champion !== undefined ? `<p class="dt-desc">🏆 Grande campeão: ${Heraldry.armsSvg(rec.champion, 16)} <b>${CIV_DEFS[rec.champion].name}</b></p>` : ''}</div>
    <div class="games-grid">${Games.podiumHtml(rec)}</div><div class="act-row"><button data-act="games">📋 Jogos e medalhas</button></div></div>`, 'showPodium', [rec], 'Ouro, prata e bronze de cada prova');
};

{
  // fim de um duelo dos Jogos: a nota de cada prova (no Desafio dos Três, a próxima luta começa logo)
  const aw0 = Arena.win.bind(Arena);
  Arena.win = function (...a) {
    const d = G.duel, g = d && d.games; const r = aw0(...a);
    if (!g) return r;
    if (g === 'gauntlet') {
      const run = G.gamesRun || { wins: 0 }; run.wins++;
      if (run.wins < 3) { G.gamesRun = run; G.gamesBout = 'gauntlet'; UI.msg(`🛡️ ${run.wins}ª vitória no Desafio dos Três! A próxima luta começa em instantes...`, 'gold'); setTimeout(() => { if (G.state === 'play' && !P.dead && G.gamesRun === run) Games.fight(run.wins); }, 1800); }
      else Games.done('gauntlet', Games.duelScore(85), 'Você venceu os três duelos do Desafio dos Três', true);
    } else if (g === 'brawl') Games.done('brawl', Games.duelScore(70), 'Luta sem armas vencida', true);
    else if (g === 'masters') Games.done('masters', Games.duelScore(95), `Você derrotou ${d.ent.duelName} no Duelo dos Campeões`, true);
    else Games.done('duel', Games.duelScore(70), 'Duelo de espadas vencido', true);
    return r;
  };
  const al0 = Arena.lose.bind(Arena);
  Arena.lose = function (...a) {
    const d = G.duel, g = d && d.games; const r = al0(...a);
    if (!g) return r;
    if (g === 'gauntlet') { const w = G.gamesRun ? G.gamesRun.wins : 0; Games.done('gauntlet', 25 + w * 25, `Você caiu na ${w + 1}ª luta do Desafio dos Três`, w >= 2); }
    else Games.done(g, g === 'masters' ? 55 : 35, `Você perdeu ${GAMES_EVENTS[g][1].toLowerCase()}`, false);
    return r;
  };
  // luta sem armas: o seu golpe é o dos punhos e a arma não aparece na mão
  const pd0 = Game.pDmg.bind(Game);
  Game.pDmg = function () { if (G.duel && G.duel.brawl) return 5 + (P.level - 1) * 1.2; return pd0(); };
  const pl0 = playerLook;
  // eslint-disable-next-line no-global-assign
  playerLook = function () { const o = pl0(); if (G.duel && G.duel.brawl) { o.weapon = null; o.wglow = null; } return o; };
  // resultado da justa quando é dos Jogos
  const je0 = Arena.joustEnd.bind(Arena);
  Arena.joustEnd = function (win) { const g = G.gamesBout; const r = je0(win); if (g === 'joust') Games.done('joust', win ? 92 : win === null ? 60 : 40, `Justa dos Jogos: ${win ? 'você derrubou o adversário' : win === null ? 'empate nas passadas' : 'você caiu do cavalo'}`, !!win); return r; };
  // na banca da arena anfitriã: as provas
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    const S = Games.S();
    // (as provas agora ficam na página 🏅 Jogos da Arena: olympics.js)
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
    if (a === 'gSpur') { Games.spur(); return; }
    if (a === 'gRaceEnd') { Games.raceEnd(); return; }
    if (a === 'gPodium') { UI.showPodium(+d.i); return; }
    return a0(a, d);
  };
}
