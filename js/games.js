'use strict';
// Jogos dos Sete Reinos: todo mês de agosto, cada ano num reino diferente, as provas acontecem na arena do reino anfitrião.
// São dez provas, disputadas em ordem — a primeira libera a segunda, a segunda libera a terceira e assim por diante:
// arco e flecha, lançamento de dardo, corrida a cavalo, cabo de força, luta sem armas, duelo de espadas, duelo de
// machados, justa, o Desafio dos Três (três duelos seguidos) e, por último, o Duelo dos Campeões contra o melhor herói
// dos reinos. Cada reino manda os seus heróis; você compete indo até a arena. Quando você termina todas as provas, os
// Jogos se encerram na hora (senão, no fim do mês) com a cerimônia dos pódios: ouro, prata e bronze em cada prova, com
// prêmio e fama para os três, e o pódio dos reinos do ano (quem ganhou mais medalhas), com prêmio para o tesouro.

const GAMES_MONTH = 7; // agosto
const GAMES_EVENTS = {
  archery:  ['🏹', 'Arco e flecha',       'Três flechas no alvo: solte quando a marca passar pelo centro.'],
  javelin:  ['🎯', 'Lançamento de dardo', 'Três arremessos: solte com a força no máximo, a marca bem na ponta direita.'],
  race:     ['🏇', 'Corrida a cavalo',    'Três retas: esporeie quando a marca passar pela faixa verde.'],
  tug:      ['🪢', 'Cabo de força',       'Cinco segundos puxando a corda: quanto mais puxões, mais pontos.'],
  brawl:    ['👊', 'Luta sem armas',      'Só os punhos: as armas ficam de fora da areia.'],
  duel:     ['⚔️', 'Duelo de espadas',    'Um duelo contra um veterano: quem cair primeiro perde.'],
  axes:     ['🪓', 'Duelo de machados',   'Golpes pesados dos dois lados: o machado derruba depressa.'],
  joust:    ['🐎', 'Justa',               'Três passadas a cavalo com a lança.'],
  gauntlet: ['🛡️', 'Desafio dos Três',    'Três duelos seguidos, do lutador ao campeão. Cada vitória vale pontos.'],
  masters:  ['👑', 'Duelo dos Campeões',  'A grande final: contra o herói mais forte dos sete reinos.'],
};
const GAMES_ORDER = Object.keys(GAMES_EVENTS); // a ordem das provas: cada uma libera a seguinte
const GAMES_DUELS = ['duel', 'brawl', 'axes', 'gauntlet', 'masters'];
const GAMES_PRIZE = [2000, 1000, 500], GAMES_FAME = [20, 10, 5];
const GAMES_MEDAL = ['🥇', '🥈', '🥉'], GAMES_MEDAL_N = ['Ouro', 'Prata', 'Bronze'];
// o pódio dos reinos (quem ganhou mais medalhas no ano): prêmio no tesouro e alegria do povo
const GAMES_KPRIZE = [3000, 1500, 800], GAMES_KHAPPY = [8, 4, 2];
// prêmios especiais: atleta dos Jogos (mais medalhas da edição), fez as dez provas, ouro em todas
const GAMES_STAR = { gold: 3000, fame: 30 }, GAMES_ALL = { gold: 500, fame: 5 }, GAMES_SWEEP = { gold: 10000, fame: 60 };

const Games = {
  S() { const u = G.urban || (G.urban = {}); return u.games || (u.games = { year: 0, host: -1, on: false, day: -1, me: {}, champs: {}, medals: {}, history: [] }); },
  // o reino que você representa: o da sua cidadania (sem cidadania, você compete sem reino)
  myCi() { return typeof Cid !== 'undefined' ? Cid.get() : G.mainRealm !== undefined && G.mainRealm !== null ? G.mainRealm : -1; },
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
  allDone() { const S = this.S(); return GAMES_ORDER.every(ev => S.me[ev] !== undefined); },
  // as provas são em ordem: a primeira está sempre liberada; as outras, depois que você faz a anterior
  prevEv(ev) { const i = GAMES_ORDER.indexOf(ev); return i > 0 ? GAMES_ORDER[i - 1] : null; },
  unlocked(ev) { const S = this.S(), pv = this.prevEv(ev); return !pv || S.me[pv] !== undefined; },
  // a próxima prova que você tem de fazer (null quando já fez todas)
  nextEv() { const S = this.S(); return GAMES_ORDER.find(ev => S.me[ev] === undefined) || null; },
  // o quadro de medalhas de uma edição: cada reino com [ouro, prata, bronze] e o total (quem ganhou mais medalhas na frente)
  kingdoms(rec) {
    const by = {};
    for (const L of Object.values(rec.ev || {})) L.forEach((x, k) => { if (!x) return; const ci = x.ci >= 0 ? x.ci : -1, r = by[ci] || (by[ci] = { ci, m: [0, 0, 0], t: 0 }); r.m[k]++; r.t++; });
    return Object.values(by).sort((a, b) => b.t - a.t || b.m[0] - a.m[0] || b.m[1] - a.m[1] || a.ci - b.ci);
  },
  // os atletas de uma edição pelas medalhas
  athletes(rec) {
    const by = {};
    for (const L of Object.values(rec.ev || {})) L.forEach((x, k) => { if (!x) return; const key = x.who === 'player' ? 'player' : x.who, r = by[key] || (by[key] = { name: x.name, ci: x.ci, who: x.who, m: [0, 0, 0], t: 0 }); r.m[k]++; r.t++; });
    return Object.values(by).sort((a, b) => b.t - a.t || b.m[0] - a.m[0] || b.m[1] - a.m[1]);
  },
  start() {
    const S = this.S(), cd = Calendar.of(G.day);
    S.year = cd.year; S.host = this.nextHost(); S.on = true; S.day = G.day; S.me = {}; S.champs = {};
    const c = G.civs[S.host]; c.happy = Math.min(100, c.happy + 5); c.treasury = (c.treasury || 0) + 1000; // os visitantes enchem as tavernas do anfitrião
    UI.banner(`🏅 Jogos dos Sete Reinos em ${this.hostName()}!`);
    UI.msg(`🏅 Começaram os Jogos dos Sete Reinos na arena de ${this.hostName()}: dez provas, uma depois da outra (${GAMES_ORDER.map(e => GAMES_EVENTS[e][1].toLowerCase()).join(', ')}). Vá até a arena para competir. Quando você terminar todas, os Jogos se encerram com os pódios.`, 'gold', true);
    Diplo.chronicle(`🏅 ${CIV_DEFS[S.host].name} recebe os Jogos dos Sete Reinos do ano ${S.year}.`, true);
  },
  // o resultado: o jogador compete com a nota que fez; os campeões da IA, pela força com um pouco de sorte.
  // Cada prova tem o seu pódio, e os três primeiros levam prêmio e fama.
  resolve() {
    const S = this.S(); if (!S.on) return null; S.on = false;
    const rec = { year: S.year, host: S.host, ev: {} }, gold = {};
    let mine = 0;
    for (const ev of GAMES_ORDER) {
      const list = this.champs(ev).map(x => ({ who: x.p.id, name: People.full(x.p), ci: x.ci, score: Math.round(x.power * U.rnd(0.6, 1.25)) }));
      if (S.me[ev] !== undefined) list.push({ who: 'player', name: `${G.name} ${G.surname || ''}`.trim(), ci: Games.myCi(), score: S.me[ev] });
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
    // 🏆 o pódio dos reinos do ano: quem ganhou mais medalhas (ouro desempata, depois prata e bronze)
    const kp = this.kingdoms(rec).filter(x => x.ci >= 0 && G.civs[x.ci]).slice(0, 3);
    rec.kpod = kp.map(x => x.ci);
    kp.forEach((x, k) => {
      const c = G.civs[x.ci]; c.treasury = (c.treasury || 0) + GAMES_KPRIZE[k]; c.happy = Math.min(100, (c.happy || 0) + GAMES_KHAPPY[k]);
      if (c.ruler === 'player') { Court.addFame(GAMES_FAME[k]); UI.msg(`🏆 O seu reino, ${CIV_DEFS[x.ci].name}, ficou em ${k + 1}º lugar no quadro de medalhas dos Jogos: +${GAMES_KPRIZE[k].toLocaleString('pt-BR')} 🪙 no tesouro, o povo em festa e +${GAMES_FAME[k]} de fama para você.`, 'gold', true); }
    });
    if (kp[0]) { rec.champion = kp[0].ci; Diplo.chronicle(`🏆 ${CIV_DEFS[kp[0].ci].name} foi o grande campeão dos Jogos do ano ${S.year}, com ${kp[0].t} medalhas (${kp[0].m[0]} de ouro).`, true); }
    // 🌟 o atleta dos Jogos: quem ganhou mais medalhas na edição
    const star = this.athletes(rec)[0];
    if (star) rec.star = { name: star.name, ci: star.ci, who: star.who, m: star.m };
    const my = rec.mine = [0, 0, 0]; for (const L of Object.values(rec.ev)) L.forEach((x, k) => { if (x && x.who === 'player') my[k]++; });
    const bonus = (t, o, why) => { P.gold += o.gold; Court.addFame(o.fame); rec.awards.push(t); UI.msg(`${t}: ${why} +${o.gold.toLocaleString('pt-BR')} 🪙 e +${o.fame} de fama.`, 'gold', true); Progress.diary(`${t} nos Jogos dos Sete Reinos do ano ${S.year}.`); };
    rec.awards = [];
    if (star && star.who === 'player') bonus('🌟 Atleta dos Jogos', GAMES_STAR, `ninguém ganhou mais medalhas do que você (${star.t}).`);
    if (my[0] === GAMES_ORDER.length) bonus('👑 Lenda dos Sete Reinos', GAMES_SWEEP, 'ouro nas dez provas! Os bardos vão cantar isso por gerações.');
    if (GAMES_ORDER.every(ev => S.me[ev] !== undefined)) bonus('🎖️ Atleta completo', GAMES_ALL, 'você disputou as dez provas.');
    if (mine >= 5) { Court.addFame(15); UI.msg(`🌟 ${mine} medalhas nos mesmos Jogos: o povo dos sete reinos fala do seu nome (+15 de fama).`, 'gold', true); }
    S.history.unshift(rec); if (S.history.length > 12) S.history.length = 12;
    UI.msg(`🏅 Fim dos Jogos dos Sete Reinos: ${Object.entries(rec.ev).map(([ev, L]) => `${GAMES_EVENTS[ev][0]} ${L[0] ? L[0].name : '—'}`).join(' · ')}.`, 'gold', true);
    return rec;
  },
  // você terminou todas as provas: os Jogos se encerram agora, com a cerimônia
  finishIfDone() {
    const S = this.S(); if (!S.on || !this.allDone()) return;
    setTimeout(() => {
      if (!S.on || G.duel || G.joust || this.busy()) return;
      const rec = this.resolve(); if (!rec) return;
      UI.banner('🏅 Cerimônia dos pódios');
      (UI.sel.svSub || (UI.sel.svSub = {})).ogp = 'reinos'; if (UI.sel.svPg) UI.sel.svPg['ogp:provas'] = 0;
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
  canPlay(ev) { const S = this.S(); return S.on && S.me[ev] === undefined && this.unlocked(ev) && Arena.inColiseum(S.host) && !G.duel && !G.joust; },
  busy() { return !!(G.arch || G.race || G.jav || G.tug); },
  // uma prova de mira ficou aberta (a janela foi fechada no meio): volta para ela
  resume() { if (G.arch) this.showArch(); else if (G.race) this.showRace(); else if (G.jav) this.showJav(); else if (G.tug) this.showTug(); },
  done(ev, score, text, good) {
    const S = this.S(); S.me[ev] = Math.round(score); G.gamesBout = null; G.gamesRun = null; if (UI.sel) UI.sel.ogEv = null; // a trilha da Arena passa para a próxima prova
    const left = GAMES_ORDER.filter(k => S.me[k] === undefined).length, nx = this.nextEv();
    UI.msg(`${GAMES_EVENTS[ev][0]} ${text} (${S.me[ev]} pontos). ${left ? `Faltam ${left} prova(s): liberada a ${GAMES_ORDER.indexOf(nx) + 1}ª, ${GAMES_EVENTS[nx][0]} ${GAMES_EVENTS[nx][1]}.` : 'Era a última prova: os Jogos vão se encerrar com os pódios!'}`, good ? 'gold' : 'bad', !left);
    this.finishIfDone();
  },
  play(ev) {
    const S = this.S();
    if (!S.on) { UI.msg('Os Jogos não estão acontecendo agora.', 'bad'); return; }
    if (!Arena.inColiseum(S.host)) { UI.msg(`As provas são na arena de ${this.hostName()}.`, 'bad'); return; }
    if (S.me[ev] !== undefined) { UI.msg('Você já competiu nessa prova.', 'bad'); return; }
    if (!GAMES_EVENTS[ev]) return;
    if (!this.unlocked(ev)) { const pv = this.prevEv(ev); UI.msg(`🔒 As provas são em ordem: primeiro faça a ${GAMES_ORDER.indexOf(pv) + 1}ª, ${GAMES_EVENTS[pv][1]}.`, 'bad'); return; }
    if (G.duel || G.joust) return;
    if (this.busy()) { this.resume(); return; }
    G.gamesBout = ev; UI.close();
    if (ev === 'joust') { Arena.joustStart(S.host, 2, 0); if (!G.joust) G.gamesBout = null; }
    else if (ev === 'duel') this.fight(1);
    else if (ev === 'brawl') this.fight(0, { brawl: true });
    else if (ev === 'gauntlet') { G.gamesRun = { ev, wins: 0 }; this.fight(0); }
    else if (ev === 'masters') this.fight(2, { masters: true });
    else if (ev === 'axes') this.fight(1, { axes: true });
    else if (ev === 'race') this.race();
    else if (ev === 'javelin') this.javelin();
    else if (ev === 'tug') this.tug();
    else this.archery();
  },
  // um duelo dos Jogos na areia (sem aposta); a luta sem armas e o Duelo dos Campeões mudam o adversário
  fight(tier, o) {
    const S = this.S(); P.hp = Math.max(P.hp, P.maxHp * 0.8);
    Arena.startDuel(S.host, tier, 0);
    const d = G.duel; if (!d) { G.gamesBout = null; G.gamesRun = null; return; }
    d.games = G.gamesBout;
    if (o && o.brawl) { d.brawl = true; d.ent.dmg = Math.round(d.ent.dmg * 0.6); d.ent.hp = d.ent.maxHp = Math.round(d.ent.maxHp * 0.7); d.ent.duelName = `${d.ent.duelName} (de punhos)`; }
    if (o && o.axes) { d.axes = true; d.ent.dmg = Math.round(d.ent.dmg * 1.5); d.ent.hp = d.ent.maxHp = Math.round(d.ent.maxHp * 0.8); d.ent.duelName = `${d.ent.duelName} (de machado)`; }
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
  // lançamento de dardo: a marca vai e volta na barra da força; solte quando ela estiver na ponta direita (3 arremessos)
  javelin() { G.jav = { th: [], t0: performance.now(), period: Math.max(650, 1200 - P.level * 14) }; this.showJav(); },
  showJav() {
    const J = G.jav; J.t0 = performance.now();
    const best = Math.max(0, ...J.th);
    UI.open('🎯 Lançamento de dardo', `<div class="arch"><p class="dt-desc">Solte o dardo quando a marca chegar perto da ponta direita: é a força máxima. ${3 - J.th.length} arremesso(s).</p>
      <div class="arch-bar jav-bar"><b class="jav-z"></b><i class="arch-mk" style="animation-duration:${J.period / 2}ms"></i></div>
      <div class="arch-shots">${J.th.map(m => `<span class="${m >= 60 ? 'ok' : m <= 30 ? 'bad' : ''}">🎯 ${m} m</span>`).join('')}</div><p>Melhor arremesso: <b>${best} m</b> · soma <b>${J.th.reduce((a, n) => a + n, 0)}</b> de 225 m</p>
      <div class="act-row">${J.th.length < 3 ? '<button class="primary" data-act="gThrow">🎯 Arremessar</button>' : '<button class="primary" data-act="gJavEnd">Terminar</button>'}</div></div>`, 'showJav', [], `Jogos dos Sete Reinos · ${this.hostName()}`);
  },
  throwJav() {
    const J = G.jav; if (!J || J.th.length >= 3) return;
    const ph = ((performance.now() - J.t0) % J.period) / J.period, pos = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    J.th.push(Math.round(15 + pos * pos * 60)); Sound.play('swing', { vol: 0.4 });
    this.showJav();
  },
  javEnd() {
    const J = G.jav; if (!J) return;
    const pts = Math.round(J.th.reduce((a, n) => a + n, 0) / 225 * 100); G.jav = null;
    this.done('javelin', pts, `Você lançou o dardo a ${Math.max(0, ...J.th)} metros`, pts >= 60); UI.showGames();
  },
  // cabo de força: cinco segundos a partir do primeiro puxão; o adversário puxa num ritmo firme e o nó da corda
  // mostra quem está ganhando
  tug() { G.tug = { n: 0, t0: 0, dur: 5000, end: false }; this.showTug(); },
  tugPos(T) { const el = T.t0 ? Math.min(T.dur, performance.now() - T.t0) / 1000 : 0; return U.clamp(50 + (T.n - el * 6) * 2.2, 4, 96); },
  showTug() {
    const T = G.tug, left = T.end ? 0 : T.t0 ? Math.max(0, Math.ceil((T.dur - (performance.now() - T.t0)) / 1000)) : T.dur / 1000;
    UI.open('🪢 Cabo de força', `<div class="arch"><p class="dt-desc">Puxe a corda o mais rápido que puder: são ${T.dur / 1000} segundos a partir do primeiro puxão. Traga o nó para o seu lado (a direita).</p>
      <div class="tug-bar"><b class="tug-mid"></b><span class="tug-l">adversário</span><span class="tug-r">você</span><i class="tug-knot" style="left:${this.tugPos(T)}%"></i></div>
      <p><b class="tug-n">${T.n}</b> puxões · <span class="tug-t">${T.end ? 'acabou o tempo!' : T.t0 ? `${left} s` : 'o tempo começa no primeiro puxão'}</span></p>
      <div class="act-row">${T.end ? '<button class="primary" data-act="gTugEnd">Terminar</button>' : '<button class="primary tug-go" data-act="gPull">🪢 Puxar!</button>'}</div></div>`, 'showTug', [], `Jogos dos Sete Reinos · ${this.hostName()}`);
  },
  pull() {
    const T = G.tug; if (!T || T.end) return;
    if (!T.t0) { T.t0 = performance.now(); setTimeout(() => { if (G.tug === T) { T.end = true; if (UI.cur && UI.cur.fn === 'showTug') this.showTug(); } }, T.dur); }
    if (performance.now() - T.t0 > T.dur) { T.end = true; this.showTug(); return; }
    T.n++; if (T.n % 4 === 0) Sound.play('swing', { vol: 0.25 });
    const p = UI.panel, n = p && p.querySelector('.tug-n'), k = p && p.querySelector('.tug-knot'), t = p && p.querySelector('.tug-t');
    if (n && k) { n.textContent = T.n; k.style.left = this.tugPos(T) + '%'; if (t) t.textContent = `${Math.max(0, Math.ceil((T.dur - (performance.now() - T.t0)) / 1000))} s`; } else this.showTug();
  },
  tugEnd() {
    const T = G.tug; if (!T) return;
    const pts = Math.round(U.clamp(T.n * 2.4, 5, 100)), win = this.tugPos(T) > 50; G.tug = null;
    this.done('tug', pts, `Cabo de força: ${T.n} puxões, ${win ? 'a corda veio para o seu lado' : 'o adversário segurou a corda'}`, win); UI.showGames();
  },
  // ---------------------------------------------------------------- janelas
  // os pódios de cada prova (na ordem das provas)
  podiumHtml(rec) {
    const esc = UI.esc.bind(UI);
    const step = (x, k) => x ? `<div class="pod-s p${k}"><span class="pod-who ${x.who === 'player' ? 'me' : ''}">${x.ci >= 0 ? Heraldry.armsSvg(x.ci, 14) : ''} ${esc(x.name)}</span><small>${x.score !== undefined ? x.score + ' pts' : ''}</small><div class="pod-b">${GAMES_MEDAL[k]}<i>${k + 1}º</i></div></div>` : `<div class="pod-s p${k}"><div class="pod-b">—</div></div>`;
    const keys = GAMES_ORDER.filter(ev => rec.ev[ev]).concat(Object.keys(rec.ev).filter(ev => GAMES_EVENTS[ev] && !GAMES_ORDER.includes(ev)));
    return keys.map(ev => { const L = rec.ev[ev], n = GAMES_ORDER.indexOf(ev) + 1; return `<div class="card pod-card"><div class="sec">${n ? `<em class="pod-n">${n}</em>` : ''}${GAMES_EVENTS[ev][0]} ${GAMES_EVENTS[ev][1]}</div>
      <div class="podium">${step(L[1], 1)}${step(L[0], 0)}${step(L[2], 2)}</div></div>`; }).join('');
  },
  // o pódio dos reinos do ano: o reino que ganhou mais medalhas no alto, com o prêmio de cada lugar
  kpodHtml(rec) {
    const K = this.kingdoms(rec).filter(x => x.ci >= 0 && CIV_DEFS[x.ci]);
    const step = (x, k) => x ? `<div class="kp-s p${k}"><div class="kp-arms">${Heraldry.armsSvg(x.ci, k ? 40 : 52)}</div><b>${UI.esc(CIV_DEFS[x.ci].short)}</b>
        <span class="kp-m">${x.m.map((n, j) => `<em>${GAMES_MEDAL[j]}${n}</em>`).join('')}</span><small>${x.t} ${x.t === 1 ? 'medalha' : 'medalhas'}</small>
        <div class="kp-b">${k ? GAMES_MEDAL[k] : '🏆'}<i>${k + 1}º</i><u>+${GAMES_KPRIZE[k].toLocaleString('pt-BR')} 🪙</u></div></div>` : `<div class="kp-s p${k}"><div class="kp-b">—</div></div>`;
    return `<div class="kpodium">${step(K[1], 1)}${step(K[0], 0)}${step(K[2], 2)}</div>`;
  },
  // o quadro de medalhas de uma edição (todos os reinos, e você se competiu sem reino)
  ktableHtml(rec) {
    const K = this.kingdoms(rec), mx = Math.max(1, ...K.map(x => x.t)), R = K.filter(x => x.ci >= 0).concat(K.filter(x => x.ci < 0)); // quem competiu sem reino fica no fim, sem lugar
    return R.map((x, i) => `<div class="kt-r ${i < 3 && x.ci >= 0 ? 'top' : ''} ${x.ci < 0 ? 'nr' : ''}"><em>${x.ci < 0 ? '—' : i + 1 + 'º'}</em>${x.ci >= 0 ? Heraldry.armsSvg(x.ci, 16) : '🏳️'}<span>${x.ci >= 0 ? UI.esc(CIV_DEFS[x.ci].short) : 'sem reino'}</span>${x.m.map(n => `<b>${n}</b>`).join('')}<i class="og-b"><i style="width:${x.t / mx * 100}%"></i></i><strong>${x.t}</strong></div>`).join('');
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
for (const f of ['showGames', 'showPodium']) if (!WIDE_PANELS.includes(f)) WIDE_PANELS.push(f); // janelas principais: tela cheia no PC
UI.showGames = function () { this.open('🏅 Jogos dos Sete Reinos', `<div class="gamesw">${Games.page()}</div>`, 'showGames', [], 'Dez provas em ordem entre os reinos: mira, cavalo, força e luta'); };
// a cerimônia dos pódios: 🏆 o pódio dos reinos do ano (com o quadro de medalhas e os prêmios especiais) e 🏅 o pódio de cada prova
UI.showPodium = function (rec) {
  if (typeof rec === 'number') rec = Games.S().history[rec];
  if (!rec) return;
  const esc = this.esc.bind(this), my = rec.mine || [0, 0, 0], star = rec.star;
  const head = `<div class="og-ph" style="--c:${Game.civColor(rec.host)}">${Heraldry.armsSvg(rec.host, 34)}<div><b>Jogos do ano ${rec.year}</b><small>na arena de ${esc(CIV_DEFS[rec.host].name)}</small></div>
    ${rec.champion !== undefined && CIV_DEFS[rec.champion] ? `<span class="og-champ">🏆 ${Heraldry.armsSvg(rec.champion, 16)} ${esc(CIV_DEFS[rec.champion].short)}, campeão do ano</span>` : ''}</div>`;
  const reinos = `<div class="og-row og-pr"><div class="card"><div class="sec">🏆 Pódio dos reinos <span>quem ganhou mais medalhas</span></div>${Games.kpodHtml(rec)}
      <small class="muted og-kpz">O tesouro do 1º lugar ganha ${GAMES_KPRIZE[0].toLocaleString('pt-BR')} 🪙 (2º ${GAMES_KPRIZE[1].toLocaleString('pt-BR')}, 3º ${GAMES_KPRIZE[2].toLocaleString('pt-BR')}) e o povo faz festa.</small></div>
    <div class="og-col"><div class="card"><div class="sec">📊 Quadro de medalhas do ano</div><div class="kt-h"><span></span><span></span><span>Reino</span><span>🥇</span><span>🥈</span><span>🥉</span><span></span><span>total</span></div>${Games.ktableHtml(rec)}</div>
      <div class="card og-aw"><div class="sec">🌟 Destaques</div>
        ${star ? `<div class="og-awr"><span>🌟</span><div><b>Atleta dos Jogos: ${star.ci >= 0 ? Heraldry.armsSvg(star.ci, 14) : ''} ${esc(star.name)}</b><small>${star.m.map((n, j) => n ? `${GAMES_MEDAL[j]} ${n}` : '').filter(Boolean).join(' · ')}${star.who === 'player' ? ` · prêmio ${GAMES_STAR.gold.toLocaleString('pt-BR')} 🪙` : ''}</small></div></div>` : ''}
        <div class="og-awr"><span>🎖️</span><div><b>As suas medalhas: ${my.map((n, j) => `${GAMES_MEDAL[j]} ${n}`).join(' · ')}</b><small>${(rec.awards || []).length ? esc(rec.awards.join(' · ')) : my[0] + my[1] + my[2] ? 'medalha em cada pódio: prêmio e fama' : 'nenhuma medalha desta vez'}</small></div></div></div></div></div>`;
  const provas = `<div class="games-grid og-pgrid sv-pl">${Games.podiumHtml(rec)}</div>`;
  const nEv = Object.keys(rec.ev).filter(ev => GAMES_EVENTS[ev]).length;
  this.open('🏅 Pódios dos Jogos', `<div class="gamesw og-podw">${head}${Services.subs('ogp', [['reinos', '🏆', 'Pódio dos reinos', reinos], ['provas', '🏅', `As ${nEv} provas`, provas]])}</div>`, 'showPodium', [rec], 'O pódio dos reinos do ano e o de cada prova');
  try { Services.paginate(); } catch (e) { console.error(e); }
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
    else if (g === 'axes') Games.done('axes', Games.duelScore(75), 'Duelo de machados vencido', true);
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
  Game.pDmg = function () { if (G.duel && G.duel.brawl) return 5 + (P.level - 1) * 1.2; if (G.duel && G.duel.axes) return pd0() * 1.4; return pd0(); };
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
    if (a === 'gThrow') { Games.throwJav(); return; }
    if (a === 'gJavEnd') { Games.javEnd(); return; }
    if (a === 'gPull') { Games.pull(); return; }
    if (a === 'gTugEnd') { Games.tugEnd(); return; }
    if (a === 'gPodium') { UI.showPodium(+d.i); return; }
    return a0(a, d);
  };
}
