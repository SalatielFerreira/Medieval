'use strict';
// Criação de cavalos e corridas (Portfólio → 🐎 Haras e corridas; e no seu Estábulo).
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
  bar(n) { return `<span class="hs-bar"><i style="width:${n * 10}%"></i></span>`; },
  card(h, acts) {
    this.fix(h); const B = HORSE_BREEDS[h.breed], age = Math.max(0, G.day - (h.born || 0));
    return `<div class="hs-card"><span class="hs-ic" style="color:${h.color}">🐎</span><div class="hs-info"><b>${UI.esc(h.name)} <small>${B.name} · ${h.sex === 'm' ? '♂ garanhão' : '♀ égua'}${this.adult(h) ? '' : ` · potro (${age}/${HORSE_GROW} meses)`}${h.foal ? ' · prenha 🍼' : ''}</small></b>
      <div class="hs-stats"><span>💨 Velocidade ${this.bar(h.speed)}</span><span>🫁 Fôlego ${this.bar(h.stamina)}</span><span>💪 Força ${this.bar(h.strength)}</span></div></div><span class="act-row">${acts || ''}</span></div>`;
  },
  page() {
    const S = this.S(), R = this.nextRace(), mine = P.horse ? this.fix(P.horse) : null, pr = this.pair();
    const herd = this.herd().map(h => this.card(h, `<button data-act="hs" data-op="ride" data-i="${h.id}" ${this.adult(h) ? '' : 'disabled'}>🐎 Montar este</button><button data-act="hs" data-op="sell" data-i="${h.id}">💰 Vender</button>`)).join('');
    const shop = Object.entries(HORSE_BREEDS).map(([k, B]) => `<button data-act="hs" data-op="buy" data-k="${k}" ${P.gold >= B.price ? '' : 'disabled'} title="velocidade ${B.speed} · fôlego ${B.stamina} · força ${B.strength}">${B.name} — ${B.price} 🪙</button>`).join('');
    const breed = pr.mares.length && pr.studs.length ? `<div class="act-row hs-breed"><select id="hsM">${pr.mares.map(h => `<option value="${h.id}">♀ ${UI.esc(h.name)}</option>`).join('')}</select> × <select id="hsS">${pr.studs.map(h => `<option value="${h.id}">♂ ${UI.esc(h.name)}</option>`).join('')}</select><button class="primary" data-act="hs" data-op="breed">💕 Cruzar</button></div>` : '<small class="muted">Para cruzar: uma égua e um garanhão adultos (um deles pode ser o que você monta).</small>';
    const field = this.field(R).map(h => `<span class="hs-chip">${UI.esc(h.name)} · ${HORSE_BREEDS[h.breed].name} (💨${h.speed} 🫁${h.stamina})</span>`).join('');
    return `<div class="card"><div class="sec">🐎 O seu cavalo</div>${mine ? this.card(mine) : '<p class="muted">Você ainda não tem cavalo.</p>'}</div>
      <div class="card"><div class="sec">🏇 Grande Prêmio de ${CIV_DEFS[R.ci].short} <span>inscrição ${this.RACE_FEE} 🪙 · prêmios ${this.PRIZES.join(' / ')} 🪙</span></div><div class="hs-field">${field}</div>
        <div class="act-row"><button class="primary" data-act="hs" data-op="race" ${!R.ran && P.horse && P.gold >= this.RACE_FEE ? '' : 'disabled'}>${R.ran ? 'Já correu este mês' : '🏁 Correr'}</button></div>
        ${S.hist.length ? `<small class="muted">Últimas: ${S.hist.slice(0, 5).map(x => `${x.place}º com ${UI.esc(x.horse)}`).join(' · ')}</small>` : ''}</div>
      <div class="card"><div class="sec">🏡 O seu haras <span>${this.herd().length}/${this.stalls()} vagas (${STALLS_PER} por Estábulo)</span></div>${herd || '<p class="muted">Nenhum cavalo no haras. Construa um Estábulo e compre ou crie cavalos.</p>'}${breed}</div>
      <div class="card"><div class="sec">🛒 Comprar cavalo</div><div class="act-row" style="flex-wrap:wrap">${shop}</div></div>`;
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
  UI.open = function (title, body, fn, args, sub) { if (fn === 'showStable') body += `<div class="act-row"><button class="primary" data-act="hs" data-op="page">🏡 Haras e corridas</button></div>`; return op0(title, body, fn, args, sub); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Horses.monthTick(); };
  const ni0 = Board.navItems.bind(Board);
  Board.navItems = function () { return ni0().concat([['x:horses', '🐎', 'Haras e corridas', Horses.nextRace().ran ? '' : '!']]); };
  const kp0 = UI.kPage.bind(UI);
  UI.kPage = function (nav) { if (nav === 'x:horses') return UI.pageHead('🐎', 'Haras e corridas', 'Raças, qualidades, cruzamentos, potros e o Grande Prêmio') + Horses.page(); return kp0(nav); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a !== 'hs') return a0(a, d);
    switch (d.op) {
      case 'page': UI.sel.knav = 'x:horses'; UI.showKingdom(); return;
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
