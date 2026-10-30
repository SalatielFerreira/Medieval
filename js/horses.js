'use strict';
// Criação de cavalos e corridas. Os cavalos se compram no Estábulo; o Haras (Construção → Baús e estábulo) é onde se
// cruza e de onde se corre: lá dentro ficam as baias, a baia de cruzamento, a mesa do Grande Prêmio e o livro do haras.
//  • Cada cavalo tem raça e três qualidades (de 1 a 10): velocidade (anda mais rápido montado), fôlego (corre mais tempo
//    nas corridas e embala a carga mais depressa) e força (carrega mais peso e bate mais forte na carga).
//  • Raças: Puro-Sangue (veloz), Árabe (fôlego), Percherão (força), Andaluz (equilibrado) e Pônei (barato).
//  • O haras: os cavalos ficam no seu Estábulo (um por vaga: 4 por estábulo). Cruze uma égua e um garanhão: em 2 meses
//    nasce um potro que puxa os pais (às vezes melhor que os dois); ele pode ser montado com 4 meses de idade.
//  • Corridas: todo mês há um Grande Prêmio num reino (taxa de 30 🪙). O seu cavalo corre contra 5 cavalos da região, ao
//    vivo na janela: prêmios de 400, 150 e 60 🪙 (e fama).
const HORSE_BREEDS = {
  puro:      { name: 'Puro-Sangue', speed: 9, stamina: 6, strength: 4, price: 520, colors: ['#5a3a1e', '#2a1a10', '#8a5a2e'] },
  arabe:     { name: 'Árabe',       speed: 7, stamina: 9, strength: 4, price: 480, colors: ['#e8e2d6', '#9a9a9a', '#c9b08a'] },
  percherao: { name: 'Percherão',   speed: 4, stamina: 6, strength: 10, price: 420, colors: ['#3a3a3e', '#7a7a80', '#2a2a2e'] },
  andaluz:   { name: 'Andaluz',     speed: 7, stamina: 7, strength: 6, price: 380, colors: ['#d8d2c8', '#7a4a26', '#3a2a1e'] },
  ponei:     { name: 'Pônei',       speed: 3, stamina: 8, strength: 5, price: 140, colors: ['#c9a06a', '#8a6a4a', '#f2efe6'] },
};
const STALLS_PER = 4, HORSE_FOAL = 2, HORSE_GROW = 4;

const Horses = {
  S() { const u = G.urban || (G.urban = {}); return u.haras || (u.haras = { herd: [], seq: 0, race: null, hist: [] }); },
  // o cavalo de agora sempre com qualidades (o de jogos antigos vira Andaluz)
  fix(h) { if (h && h.speed === undefined) Object.assign(h, { breed: 'andaluz', speed: 6, stamina: 6, strength: 6, sex: Math.random() < 0.5 ? 'm' : 'f', born: (G.day || 0) - 12 }); return h; },
  make(breed, o) {
    const B = HORSE_BREEDS[breed], j = () => U.rint(-1, 1);
    return Object.assign({ id: ++this.S().seq, name: U.pick(HORSE_NAMES.concat(['Fumaça', 'Pérola', 'Corisco', 'Duquesa', 'Valente', 'Brisa', 'Sultão', 'Aurora'])), breed, sex: Math.random() < 0.5 ? 'm' : 'f',
      color: U.pick(B.colors), speed: U.clamp(B.speed + j(), 1, 10), stamina: U.clamp(B.stamina + j(), 1, 10), strength: U.clamp(B.strength + j(), 1, 10), born: G.day - 12 }, o || {});
  },
  stalls() { return World.structs.filter(s => s.type === 'stable' && s.owner === 'player' && !s.removed).length * STALLS_PER; },
  herd() { return this.S().herd; },
  adult(h) { return G.day - (h.born || 0) >= HORSE_GROW; },
  score(h) { return h.speed * 2 + h.stamina + h.strength * 0.5; },
  // comprar (no Estábulo ou na Estrebaria): vai para o haras, ou fica com você se ainda não tem cavalo
  buy(breed) {
    const B = HORSE_BREEDS[breed]; if (!B) return;
    if (P.gold < B.price) { UI.msg(`O ${B.name} custa ${B.price} 🪙.`, 'bad'); return; }
    if (P.horse && this.herd().length >= this.stalls()) { UI.msg(this.stalls() ? 'O seu haras está cheio: construa outro Estábulo.' : 'Você já tem um cavalo: construa um Estábulo para criar mais.', 'bad'); return; }
    P.gold -= B.price; const h = this.make(breed);
    if (!P.horse) { P.horse = h; P.hx = P.x - 30; P.hy = P.y; } else this.herd().push(h);
    Sound.play('neigh'); UI.msg(`🐎 ${h.name}, ${B.name} (${h.sex === 'm' ? 'garanhão' : 'égua'}), é seu! ${P.horse === h ? '' : 'Está no seu haras.'}`, 'gold');
  },
  // trocar o cavalo montado por um do haras
  ride(id) {
    const H = this.herd(), h = H.find(x => x.id === id); if (!h) return;
    if (!this.adult(h)) { UI.msg(`${h.name} ainda é potro.`, 'bad'); return; }
    const cur = P.horse; this.S().herd = H.filter(x => x !== h);
    if (cur) { this.fix(cur); cur.stall = null; this.herd().push(cur); }
    P.horse = h; h.stall = null; P.hx = P.x - 30; P.hy = P.y; P.mounted = false;
    UI.msg(`🐎 Agora você vai com ${h.name}.`, 'gold');
  },
  sell(id) { const H = this.herd(), h = H.find(x => x.id === id); if (!h) return; const g = Math.round(HORSE_BREEDS[h.breed].price * 0.45 * (0.6 + this.score(h) / 45)); this.S().herd = H.filter(x => x !== h); P.gold += g; Sound.play('coin'); UI.msg(`💰 Você vendeu ${h.name} por ${g} 🪙.`, 'gold'); },
  // cruzar: égua + garanhão adultos
  pair() { const all = [P.horse && this.fix(P.horse), ...this.herd()].filter(h => h && this.adult(h) && !h.foal); return { mares: all.filter(h => h.sex === 'f'), studs: all.filter(h => h.sex === 'm') }; },
  breed(mid, sid) {
    const all = [P.horse, ...this.herd()].filter(Boolean), m = all.find(h => h.id === mid), s = all.find(h => h.id === sid);
    if (!m || !s || m.sex !== 'f' || s.sex !== 'm') return;
    if (this.herd().length + 1 > this.stalls()) { UI.msg('Não há vaga no haras para o potro.', 'bad'); return; }
    m.foal = { sire: s.id, due: G.day + HORSE_FOAL, mix: [s.speed, s.stamina, s.strength, s.breed] };
    UI.msg(`💕 ${m.name} e ${s.name} cruzaram. O potro nasce em ${HORSE_FOAL} meses.`, 'gold');
  },
  birth(m) {
    const [sp, st, sr, sb] = m.foal.mix, mix = (a, b) => U.clamp(Math.round((a + b) / 2 + (Math.random() < 0.3 ? 1 : 0) + U.rint(-1, 1) * 0.5), 1, 10);
    const breed = Math.random() < 0.5 ? m.breed : sb, f = this.make(breed, { speed: mix(m.speed, sp), stamina: mix(m.stamina, st), strength: mix(m.strength, sr), born: G.day, color: Math.random() < 0.5 ? m.color : U.pick(HORSE_BREEDS[breed].colors) });
    m.foal = null; this.herd().push(f);
    UI.msg(`🐴 Nasceu ${f.name}, ${f.sex === 'm' ? 'um potro' : 'uma potranca'} ${HORSE_BREEDS[breed].name} (velocidade ${f.speed}, fôlego ${f.stamina}, força ${f.strength})!`, 'gold', true);
    Progress.add('foals');
  },
  // ---------------------------------------------------------------- corridas
  RACE_FEE: 30, PRIZES: [400, 150, 60],
  nextRace() {
    const S = this.S();
    if (!S.race || S.race.day < G.day) S.race = { day: G.day, ci: (G.day * 3) % G.civs.length, ran: false, field: null };
    return S.race;
  },
  field(R) {
    if (!R.field) R.field = Array.from({ length: 5 }, () => { const b = U.pick(Object.keys(HORSE_BREEDS).filter(k => k !== 'ponei')), h = this.make(b); h.rider = People.full(People.create({ rank: 'peasant', age: U.rint(18, 35) })); return h; });
    return R.field;
  },
  race() {
    const R = this.nextRace(); if (R.ran) { UI.msg('O Grande Prêmio deste mês já foi corrido.', 'bad'); return; }
    if (!P.horse) { UI.msg('Você precisa de um cavalo para correr.', 'bad'); return; }
    if (P.gold < this.RACE_FEE) { UI.msg(`A inscrição custa ${this.RACE_FEE} 🪙.`, 'bad'); return; }
    P.gold -= this.RACE_FEE; R.ran = true; this.fix(P.horse);
    const runners = [{ h: P.horse, me: true, rider: G.name }, ...this.field(R).map(h => ({ h, rider: h.rider }))];
    // simulação: a velocidade conta sempre, o fôlego decide a reta final
    const LEN = 100, steps = [];
    for (const r of runners) r.pos = 0;
    for (let t = 0; t < 200 && runners.some(r => r.pos < LEN); t++) {
      for (const r of runners) { if (r.pos >= LEN) continue; const tired = r.pos > 55 ? (10 - r.h.stamina) * 0.09 : 0; r.pos += Math.max(0.3, r.h.speed * 0.18 + 0.6 - tired + Math.random() * 0.9); if (r.pos >= LEN && r.end === undefined) r.end = t + Math.random() * 0.5; }
      steps.push(runners.map(r => Math.min(LEN, r.pos)));
    }
    const order = runners.slice().sort((a, b) => a.end - b.end), place = order.findIndex(r => r.me) + 1, prize = this.PRIZES[place - 1] || 0;
    if (prize) { P.gold += prize; Court.addFame(place === 1 ? 10 : 3); }
    if (place === 1) Progress.add('raceWins');
    this.S().hist.unshift({ day: G.day, ci: R.ci, place, horse: P.horse.name }); if (this.S().hist.length > 10) this.S().hist.length = 10;
    this.show(runners, steps, order, place, prize, R.ci);
  },
  show(runners, steps, order, place, prize, ci) {
    const lanes = runners.map((r, i) => `<div class="hr-lane ${r.me ? 'me' : ''}"><span class="hr-name">${UI.esc(r.h.name)}<small>${UI.esc(r.rider)}</small></span><div class="hr-track"><i class="hr-horse" id="hrH${i}" style="left:0%">🏇</i></div></div>`).join('');
    const res = `<ol class="hr-res" id="hrRes" hidden>${order.map(r => `<li class="${r.me ? 'me' : ''}">${UI.esc(r.h.name)} <small>${UI.esc(r.rider)} · ${HORSE_BREEDS[r.h.breed].name}</small></li>`).join('')}</ol>
      <p class="hr-msg" id="hrMsg" hidden>${place === 1 ? `🏆 Vitória! +${prize} 🪙 e +10 de fama.` : prize ? `🏅 ${place}º lugar: +${prize} 🪙.` : `${place}º lugar. Treine (ou crie) um cavalo mais rápido!`}</p>`;
    UI.open(`🐎 Grande Prêmio de ${CIV_DEFS[ci].short}`, `<div class="hr-race">${lanes}</div>${res}`, 'horseRace', []);
    let k = 0; const tick = () => {
      if (!document.getElementById('hrH0')) return;
      const st = steps[Math.min(k, steps.length - 1)];
      st.forEach((p, i) => { const el = document.getElementById('hrH' + i); if (el) el.style.left = (p * 0.92) + '%'; });
      k++;
      if (k < steps.length) setTimeout(tick, 70); else { const a = document.getElementById('hrRes'), b = document.getElementById('hrMsg'); if (a) a.hidden = false; if (b) b.hidden = false; }
    };
    setTimeout(tick, 300);
  },
  monthTick() {
    for (const h of [P.horse, ...this.herd()]) if (h && h.foal && G.day >= h.foal.due) this.birth(h);
    this.nextRace();
  },
  // ---------------------------------------------------------------- telas
  // a janela do Haras (aberta lá dentro) em duas abas: 🐎 Estrebaria (o seu cavalo, as baias e o cruzamento) e
  // 🏇 Grande Prêmio (o páreo do mês, os rivais, a sua chance e o histórico). As raças à venda ficam no Estábulo.
  TABS: [['estrebaria', '🐎', 'Estrebaria e cruzamento'], ['premio', '🏇', 'Grande Prêmio']],
  BREED_TXT: { puro: 'O mais veloz: nasceu para as corridas.', arabe: 'Fôlego de sobra: aguenta a reta final.', percherao: 'Força bruta: carrega peso e bate forte na carga.',
    andaluz: 'Equilibrado em tudo: bom para começar.', ponei: 'Barato e resistente, mas lento.' },
  // o cavalo desenhado na cor dele (crina e cauda mais escuras)
  svg(color, size) {
    return `<svg class="hs-svg" viewBox="0 0 64 48" width="${size}" height="${size * 0.75}" aria-hidden="true"><g fill="${color}" stroke="rgba(0,0,0,.45)" stroke-width="1">
      <path d="M15 24 Q6 27 8 38 Q11 31 16 27 Z" fill="rgba(30,20,12,.85)"/>
      <rect x="18" y="28" width="3.4" height="14" rx="1.2"/><rect x="23.5" y="29" width="3.4" height="13" rx="1.2"/><rect x="35" y="29" width="3.4" height="13" rx="1.2"/><rect x="40.5" y="28" width="3.4" height="14" rx="1.2"/>
      <ellipse cx="30" cy="24" rx="16" ry="8.5"/><path d="M40 21 L45 8 L52 9 L47 25 Z"/><path d="M45 8 L52 3.5 L61 12 L58 15.5 L50 12.5 Z"/><path d="M49.5 5.5 L51 1 L53 5 Z"/></g>
      <path d="M45.5 7.5 Q41.5 14 40.5 21.5 L43.5 21.5 Q44.5 14 49 7.5 Z" fill="rgba(30,20,12,.85)"/>
      <g fill="#2a1a10"><rect x="18" y="41" width="3.4" height="2"/><rect x="23.5" y="41" width="3.4" height="2"/><rect x="35" y="41" width="3.4" height="2"/><rect x="40.5" y="41" width="3.4" height="2"/></g><circle cx="55" cy="8.5" r="0.9" fill="#111"/></svg>`;
  },
  bar(n, cls) { return `<span class="hs-bar ${cls || ''}"><i style="width:${n * 10}%"></i></span>`; },
  stats(h) { return `<div class="hs-stats"><span>💨 Velocidade ${this.bar(h.speed, 'sp')}<b>${h.speed}</b></span><span>🫁 Fôlego ${this.bar(h.stamina, 'st')}<b>${h.stamina}</b></span><span>💪 Força ${this.bar(h.strength, 'sr')}<b>${h.strength}</b></span></div>`; },
  // nota de 1 a 5 ferraduras (pelo que vale numa corrida)
  stars(h) { const n = U.clamp(Math.round((this.score(h) - 8) / 5), 1, 5); return `<span class="hs-stars" title="nota de corrida">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`; },
  who(h) { const age = Math.max(0, G.day - (h.born || 0)); return `${HORSE_BREEDS[h.breed].name} · ${h.sex === 'm' ? '♂ garanhão' : '♀ égua'}${this.adult(h) ? '' : ` · potro (${age}/${HORSE_GROW} meses)`}`; },
  card(h, acts) {
    this.fix(h);
    return `<div class="hs-card"><span class="hs-pic">${this.svg(h.color, 54)}</span><div class="hs-info"><b>${UI.esc(h.name)} ${this.stars(h)}</b><small>${this.who(h)}${h.foal ? ` · prenha 🍼 (nasce em ${Math.max(0, h.foal.due - G.day)} ${h.foal.due - G.day === 1 ? 'mês' : 'meses'})` : ''}</small>
      ${this.stats(h)}</div>${acts ? `<span class="hs-acts">${acts}</span>` : ''}</div>`;
  },
  tabs(tab) {
    const R = this.nextRace();
    return `<div class="tabs subtabs hs-tabs">${this.TABS.map(([k, ic, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-act="hs" data-op="tab" data-k="${k}">${ic} ${l}${k === 'premio' && !R.ran ? ' <em class="hs-dot">!</em>' : ''}</button>`).join('')}</div>`;
  },
  // as raças à venda (no Estábulo)
  market() {
      const full = P.horse && this.herd().length >= this.stalls();
      return `<div class="hs-pg hs-mkt">${Object.entries(HORSE_BREEDS).map(([k, B]) => `<div class="hs-breedc">
          <div class="hs-bpics">${B.colors.map(c => this.svg(c, 52)).join('')}</div>
          <b>${B.name}</b><small>${this.BREED_TXT[k] || ''}</small>
          ${this.stats({ speed: B.speed, stamina: B.stamina, strength: B.strength })}
          <button class="${P.gold >= B.price && !full ? 'primary' : ''}" data-act="hs" data-op="buy" data-k="${k}" ${P.gold >= B.price && !full ? '' : 'disabled'}>Comprar — ${B.price} 🪙</button></div>`).join('')}
        <small class="muted hs-mnote">${!P.horse ? 'O primeiro cavalo vem montado com você.' : full ? (this.stalls() ? 'As suas baias estão cheias: construa outro Estábulo.' : 'Você já tem um cavalo: construa um Estábulo para comprar mais.') : 'O cavalo comprado vai para uma baia livre do seu haras.'} As qualidades variam um pouco de cavalo para cavalo.</small></div>`;
  },
  // o seu Haras (a construção)
  haras() { return World.structs.find(s => s && !s.removed && s.type === 'haras' && s.owner === 'player') || null; },
  page() {
    const S = this.S(), tab = this.TABS.some(t => t[0] === UI.sel.hsTab) ? UI.sel.hsTab : 'estrebaria', mine = P.horse ? this.fix(P.horse) : null;
    let body;
    if (tab === 'estrebaria') {
      const stalls = this.stalls(), herd = this.herd(), pr = this.pair();
      const hero = mine ? `<div class="hs-hero"><div class="hs-hero-pic" style="--c:${mine.color}">${this.svg(mine.color, 150)}</div>
          <div class="hs-hero-tx"><small>O cavalo que você monta</small><h3>${UI.esc(mine.name)} ${this.stars(mine)}</h3><div class="hs-who">${this.who(mine)}${mine.foal ? ' · prenha 🍼' : ''}</div>${this.stats(mine)}
          <div class="hs-tips"><span>💨 mais rápido montado</span><span>🫁 corre mais nas corridas</span><span>💪 carrega mais peso</span></div></div></div>`
        : `<div class="hs-hero empty"><div class="hs-hero-pic">${this.svg('#6a5a44', 150)}</div><div class="hs-hero-tx"><h3>Você ainda não tem cavalo</h3><div class="hs-who">Compre um no seu Estábulo: o primeiro vem montado com você.</div>
          <small class="muted">Os cavalos se compram no Estábulo.</small></div></div>`;
      const slots = [];
      for (const h of herd) slots.push(`<div class="hs-stall">${this.card(h, `<button data-act="hs" data-op="ride" data-i="${h.id}" ${this.adult(h) ? '' : 'disabled'}>🐎 Montar</button><button data-act="hs" data-op="sell" data-i="${h.id}">💰 Vender</button>`)}</div>`);
      for (let i = herd.length; i < stalls; i++) slots.push('<div class="hs-stall free"><span>🌾</span><small>Baia livre</small></div>');
      const stable = `<div class="card hs-stable"><div class="sec">🏡 As suas baias <span>${herd.length}/${stalls} ocupadas · ${STALLS_PER} por Estábulo</span></div>
        ${stalls ? `<div class="hs-stalls">${slots.join('')}</div>` : '<div class="hs-none">🏚️<b>Sem baias</b><small>Construa um Estábulo (Construção → Baús e estábulo) para guardar até 4 cavalos e criar potros.</small></div>'}</div>`;
      const avg = (a, b) => Math.round((a + b) / 2);
      const m0 = pr.mares[0], s0 = pr.studs[0];
      const breed = `<div class="card hs-cross"><div class="sec">💕 Cruzamento <span>o potro nasce em ${HORSE_FOAL} meses e cresce em ${HORSE_GROW}</span></div>
        ${m0 && s0 ? `<div class="hs-pair"><label>♀ Égua<select id="hsM">${pr.mares.map(h => `<option value="${h.id}">${UI.esc(h.name)} (💨${h.speed} 🫁${h.stamina} 💪${h.strength})</option>`).join('')}</select></label><span class="hs-x">×</span>
          <label>♂ Garanhão<select id="hsS">${pr.studs.map(h => `<option value="${h.id}">${UI.esc(h.name)} (💨${h.speed} 🫁${h.stamina} 💪${h.strength})</option>`).join('')}</select></label>
          <button class="primary" data-act="hs" data-op="breed" ${herd.length < stalls ? '' : 'disabled'}>💕 Cruzar</button></div>
          <small class="muted">Potro esperado de ${UI.esc(m0.name)} × ${UI.esc(s0.name)}: 💨 ~${avg(m0.speed, s0.speed)} · 🫁 ~${avg(m0.stamina, s0.stamina)} · 💪 ~${avg(m0.strength, s0.strength)} (às vezes sai melhor que os pais)${herd.length < stalls ? '' : ' · falta uma baia livre para o potro'}.</small>`
          : `<small class="muted">Para cruzar: uma égua e um garanhão adultos (um deles pode ser o que você monta). Você tem ${pr.mares.length} ${pr.mares.length === 1 ? 'égua' : 'éguas'} e ${pr.studs.length} ${pr.studs.length === 1 ? 'garanhão' : 'garanhões'} prontos.</small>`}</div>`;
      body = `<div class="hs-pg hs-est">${hero}${stable}${breed}</div>`;
    } else if (tab === 'premio') {
      const R = this.nextRace(), field = this.field(R);
      const all = [...(mine ? [{ h: mine, me: true }] : []), ...field.map(h => ({ h }))].sort((a, b) => this.score(b.h) - this.score(a.h));
      const pos = all.findIndex(x => x.me) + 1;
      const chance = !mine ? 'Você precisa de um cavalo para correr.' : pos === 1 ? '🔥 Favorito! O seu cavalo é o melhor do páreo.' : pos <= 3 ? `👍 Boa chance de pódio: ${pos}º melhor do páreo.` : `😬 Azarão: ${pos}º de ${all.length} no papel. O fôlego decide a reta final.`;
      const wins = S.hist.filter(x => x.place === 1).length, pods = S.hist.filter(x => x.place <= 3).length;
      const medal = n => ['🥇', '🥈', '🥉'][n - 1] || `${n}º`;
      body = `<div class="hs-pg hs-pre">
        <div class="hs-banner"><div><small>Grande Prêmio do mês</small><h3>🏇 ${CIV_DEFS[R.ci].short}</h3><span>inscrição ${this.RACE_FEE} 🪙 · 100 varas de pista · 6 cavalos</span></div>
          <div class="hs-podium">${this.PRIZES.map((p, i) => `<div class="p${i + 1}"><b>${medal(i + 1)}</b><span>${p} 🪙</span>${i === 0 ? '<small>+10 de fama</small>' : '<small>+3 de fama</small>'}</div>`).join('')}</div>
          <div class="hs-go"><button class="primary big" data-act="hs" data-op="race" ${!R.ran && mine && P.gold >= this.RACE_FEE ? '' : 'disabled'}>${R.ran ? '✔ Já correu este mês' : '🏁 Correr agora'}</button><small>${R.ran ? 'O próximo páreo é no mês que vem.' : chance}</small></div></div>
        <div class="card hs-fieldc"><div class="sec">🐎 O páreo <span>do melhor para o pior, no papel</span></div>
          ${all.map((x, i) => `<div class="hs-run ${x.me ? 'me' : ''}"><em>${i + 1}</em><span class="hs-pic">${this.svg(x.h.color, 40)}</span><span class="hs-rn"><b>${UI.esc(x.h.name)}</b><small>${x.me ? `você, ${UI.esc(G.name)}` : UI.esc(x.h.rider)} · ${HORSE_BREEDS[x.h.breed].name}</small></span>
            <span class="hs-rs">💨 ${this.bar(x.h.speed, 'sp')} 🫁 ${this.bar(x.h.stamina, 'st')}</span>${this.stars(x.h)}</div>`).join('')}</div>
        <div class="card hs-hist"><div class="sec">📜 As suas corridas <span>${wins} ${wins === 1 ? 'vitória' : 'vitórias'} · ${pods} no pódio</span></div>
          ${S.hist.length ? S.hist.map(x => `<div class="hs-hr"><b>${medal(x.place)}</b><span>${UI.esc(x.horse)}</span><small>${CIV_DEFS[x.ci] ? CIV_DEFS[x.ci].short : ''} · ${Calendar.full(x.day)}</small></div>`).join('') : '<div class="hs-none">🏁<small>Nenhuma corrida ainda. O primeiro páreo está esperando você.</small></div>'}</div>
      </div>`;
    }
    return this.tabs(tab) + body;
  },
};

{
  // velocidade, força e fôlego no jogo
  const sp0 = Ride.speed.bind(Ride);
  Ride.speed = function () { const h = P.horse; return P.mounted && h && h.speed !== undefined ? 1.55 + h.speed * 0.07 : sp0(); };
  const cap0 = Store.capacity.bind(Store);
  Store.capacity = function () { const h = P.horse; return cap0() + (Ride.here() && h && h.strength !== undefined ? (h.strength - 6) * 8 : 0); };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); const h = P.horse; if (P.mounted && P.moving && h && h.stamina !== undefined) P.gallop = Math.min(3, (P.gallop || 0) + dt * (h.stamina - 6) * 0.06); };
  // compra antiga (taverna, estábulo, estrebaria): o cavalo nasce com raça
  const by0 = Ride.buy.bind(Ride);
  Ride.buy = function (kind, price) { const had = P.horse; const r = by0(kind, price); if (kind === 'horse' && !had && P.horse) Object.assign(P.horse, Horses.make('andaluz', { name: P.horse.name, color: P.horse.color })); return r; };
  // no Estábulo: o haras
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) { if (fn === 'showStable') body += `<div class="card hs-stmkt"><div class="sec">🐎 Cavalos de raça <span>para montar e para o seu Haras</span></div>${Horses.market()}</div>`; return op0(title, body, fn, args, sub); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Horses.monthTick(); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'hs') return a0(a, d);
    switch (d.op) {
      case 'page': UI.showHaras(); return;
      case 'tab': UI.sel.hsTab = d.k; break;
      case 'buy': Horses.buy(d.k); break;
      case 'ride': Horses.ride(+d.i); break;
      case 'sell': Dialog.confirm({ icon: '🐎', title: 'Vender o cavalo', ok: 'Vender', text: 'Ele não volta mais.' }, () => { Horses.sell(+d.i); UI.refresh(); }); return;
      case 'breed': { const m = document.getElementById('hsM'), s = document.getElementById('hsS'); if (m && s) Horses.breed(+m.value, +s.value); break; }
      case 'race': Horses.race(); return;
    }
    UI.refresh();
  };
  ACHIEVEMENTS.push({ id: 'race1', icon: '🏇', name: 'Vencedor do Grande Prêmio', desc: 'Vença uma corrida de cavalos.', t: s => (s.raceWins || 0) >= 1 }, { id: 'breeder', icon: '🐴', name: 'Criador', desc: 'Faça nascer 3 potros.', t: s => (s.foals || 0) >= 3 });
}

// ---------------------------------------------------------------- o Haras (construção em Baús e estábulo, com interior)
BUILDINGS.haras = { name: 'Haras', w: 4, h: 3, blocks: true, cost: { wood: 60, stone: 20, rope: 8, leather: 6 },
  desc: 'Criação e corrida de cavalos. Lá dentro: as baias, a baia de cruzamento, a mesa do Grande Prêmio e o livro do haras.' };
EXPB.haras = { cat: 'guarda', fn: {}, look: { k: 'barn', wall: '#9a6a3e', roof: '#7a2a24', sign: '🐎' } };
BUILD_ICONS.haras = () => `<path d="M2 15 L16 5 L30 15 Z" fill="#7a2a24" stroke="#3a1210" stroke-width="1.2"/><rect x="4" y="15" width="24" height="14" fill="#9a6a3e" stroke="#4a2e16" stroke-width="1.1"/>`
  + `<path d="M12 28 L12 21 Q12 16 17 16 L21 15 L23 18 L20 19 L19 28 Z" fill="#3a2416"/><path d="M17 16 Q15 19 15 23" stroke="#1a0e08" stroke-width="1.4" fill="none"/>`;
if (UI.expCats && UI.expCats.guarda && !UI.expCats.guarda.includes('haras')) UI.expCats.guarda.push('haras');
if (typeof BR_CLASSES !== 'undefined') { const c = BR_CLASSES.guarda.find(x => x[0] === 'bichos'); if (c && !c[3].includes('haras')) c[3].splice(1, 0, 'haras'); }
// o cavalariço cuida do Haras; lá dentro: 4 baias, a baia de cruzamento, a mesa do Grande Prêmio e o livro do haras
WORKPLACES.haras = ['groom', 'haras', 'wood', 'player'];
SHOP_KEEPER.haras = 'groom';
LAYOUTS.haras = function () {
  return { w: 16, h: 10, items: [['stall', 0, 0, 2, 2], ['stall', 2, 0, 2, 2], ['stall', 4, 0, 2, 2], ['stall', 6, 0, 2, 2], ['hay', 9, 0, 2, 1], ['hay', 10, 1], ['toolrack', 12, -1, 2], ['window', 9, -1],
    ['lamp', 3, -1], ['lamp', 14, -1], ['banner', 15, -1], ['stall', 13, 3, 2, 2, { act: 'hsbreed' }], ['counter', 6, 5, 3, 1, { act: 'hsrace' }], ['desk', 0, 7, 2, 1, { act: 'hsbook' }],
    ['sacks', 0, 9], ['barrel', 15, 9], ['crate', 14, 9], ['hay', 11, 8]],
    keeper: [7, 4], wander: [[3, 5], [11, 6]] };
};
// as duas janelas ocupam a tela inteira (os cartões dos cavalos lado a lado)
for (const fn of ['showHaras', 'showStable']) if (!WIDE_PANELS.includes(fn)) WIDE_PANELS.push(fn);
UI.showHaras = function (tab) {
  if (tab) UI.sel.hsTab = tab;
  UI.open('Haras', `<div class="hs-win">${Horses.page()}</div>`, 'showHaras', [], 'Os seus cavalos, o cruzamento e o Grande Prêmio');
};
{
  const us0 = Places.use.bind(Places);
  Places.use = function (f) {
    if (f && f.act === 'hsrace') { UI.showHaras('premio'); return; }
    if (f && (f.act === 'hsbreed' || f.act === 'hsbook')) { UI.showHaras('estrebaria'); return; }
    return us0(f);
  };
  const fl0 = Places.furnLabel.bind(Places);
  Places.furnLabel = function (f) {
    if (f && f.act === 'hsrace') { const R = Horses.nextRace(); return `Mesa do Grande Prêmio — ${R.ran ? 'já correu este mês' : `inscrever e correr (${CIV_DEFS[R.ci].short})`}`; }
    if (f && f.act === 'hsbreed') return 'Baia de cruzamento — cruzar égua e garanhão';
    if (f && f.act === 'hsbook') return 'Livro do haras — os seus cavalos';
    return fl0(f);
  };
  // correr e cruzar só no seu Haras
  const rc0 = Horses.race.bind(Horses), br0 = Horses.breed.bind(Horses);
  Horses.race = function (...a) { if (!Horses.haras()) { UI.msg('Construa um Haras: o Grande Prêmio se corre de lá.', 'bad'); return; } return rc0(...a); };
  Horses.breed = function (...a) { if (!Horses.haras()) { UI.msg('Construa um Haras para cruzar os seus cavalos.', 'bad'); return; } return br0(...a); };
}
