'use strict';
// A vida das pessoas, mais perto da vida real: gravidez de nove meses (com parteira, enxoval e o risco do parto), funerais
// e luto, testamento e brigas por herança, memória e emoções, boatos que correm de vila em vila, aprendizes que viram
// oficiais e mestres, crianças na escola e brincando, empréstimos e dívidas, crimes com prisão e guardas, aluguel de
// casas e a escassez que encarece a comida e o ferro. Vale para você e para os moradores.

// ====================================================================== memória e emoções
const MEM_TEXT = {
  gift: ['Ainda lembro do presente que você me deu.', 'Você foi tão gentil comigo outro dia!'],
  gold: ['Nunca esqueci da sua ajuda com aquelas moedas.', 'Aquelas moedas me salvaram o mês.'],
  insult: ['Ainda não esqueci o que você me disse.', 'Você me ofendeu. Não pense que eu esqueci.'],
  robbed: ['Ladrão! Eu sei que foi você que mexeu nas minhas coisas!', 'Fique longe da minha loja.'],
  attacked: ['Você me atacou! Ainda tenho as marcas.'],
  funeral: ['Obrigado por ter ido ao enterro. Significou muito para a família.'],
  hired: ['Obrigado pelo trabalho. A família agradece.'],
  fired: ['Você me mandou embora... ainda dói.'],
  loan: ['O empréstimo me ajudou muito.'],
  rent: ['A casa que você nos aluga é muito boa.'],
  evicted: ['Você jogou a minha família na rua!'],
  midwife: ['Que alegria ter ajudado o seu filho a nascer!'],
};
const MEM_GOOD = { gift: 1, gold: 1, funeral: 1, hired: 1, loan: 1, rent: 1, midwife: 1 };
const MOODS = {
  joy:   { icon: '😊', name: 'alegre',    lines: ['Hoje acordei feliz da vida!', 'Que dia bonito, não acha?', 'Ando com o coração leve.'] },
  anger: { icon: '😠', name: 'com raiva', lines: ['Hoje não estou bom para conversa.', 'Tem gente nesta vila que me tira do sério!', 'Não me provoque hoje.'] },
  sad:   { icon: '😢', name: 'triste',    lines: ['Ando tão desanimado...', 'Tem dias que é difícil levantar da cama.', 'Sinto falta de tempos melhores.'] },
  envy:  { icon: '😒', name: 'com inveja', lines: ['Tem vizinho vivendo bem demais... não é justo.', 'Uns nascem com sorte, outros com a enxada na mão.', 'Por que nunca sou eu?'] },
};
const Mind = {
  remember(p, k) { if (!p || !p.alive) return; p.mem = (p.mem || []).filter(m => m.k !== k); p.mem.push({ k, day: G.day }); if (p.mem.length > 6) p.mem.shift(); },
  recent(p) { const m = (p.mem || []).filter(x => G.day - x.day <= 18); return m.length ? m[m.length - 1] : null; },
  mood(p) { return p.mood || (p.mood = { joy: 0, anger: 0, sad: 0, envy: 0 }); },
  feel(p, k, n) { if (!p || !p.alive) return; const m = this.mood(p); m[k] = U.clamp((m[k] || 0) + n, 0, 100); },
  main(p) { const m = this.mood(p); let best = null, bv = 25; for (const k in m) if (m[k] > bv) { bv = m[k]; best = k; } return best; },
  // o que a pessoa diz: lembranças, luto, gravidez, sonhos de criança, humor
  line(p) {
    if (p.jail > G.day) return 'Estou preso... mas um dia eu saio daqui.';
    const r = this.recent(p);
    if (r && Math.random() < 0.6) return U.pick(MEM_TEXT[r.k] || ['...']);
    if (p.mourn > G.day && p.mournFor) return U.pick([`Desde que ${p.mournFor} partiu, nada tem graça.`, `Ainda visto preto por ${p.mournFor}.`, `Sinto tanta falta de ${p.mournFor}...`]);
    if (p.preg) { const mo = G.day - p.preg.since; return mo < 3 ? 'Tenho uma novidade: estou esperando um bebê!' : mo < 7 ? `Já são ${mo} meses... a barriga só cresce!` : 'O bebê vai nascer a qualquer momento!'; }
    if (p.feud && G.people[p.feud] && G.people[p.feud].alive) return `Não me fale do meu irmão ${G.people[p.feud].name}. Ficou com o que era meu!`;
    if (p.debt) return 'Estou devendo dinheiro... não sei como vou pagar.';
    if (p.age >= 6 && p.age < 14) {
      if (p.dream && Math.random() < 0.5) return `Quando eu crescer, quero ser ${Careers.dreamName(p)}!`;
      return U.pick(['Hoje na escola o padre ensinou as letras!', 'Vamos brincar de pega-pega?', 'Eu sou o mais rápido da vila!', 'Minha mãe disse para voltar antes de escurecer.']);
    }
    if (p.career && p.career.lvl === 0) return U.pick([`Estou aprendendo o ofício de ${Careers.tradeName(p.career.trade, 'm').toLowerCase()} com o mestre.`, 'O mestre diz que eu tenho jeito!']);
    const mo = this.main(p);
    if (mo && Math.random() < 0.7) return U.pick(MOODS[mo].lines);
    return null;
  },
  monthTick() {
    for (const p of G.people) {
      if (!p.alive || !p.mood) continue;
      const m = p.mood; for (const k in m) m[k] = Math.round(m[k] * 0.6);
      if (p.mourn > G.day) m.sad = Math.max(m.sad, 45);
    }
    // inveja: quem é pobre olha o vizinho rico
    for (const v of World.villages) {
      const vi = World.villages.indexOf(v), res = People.residents(vi).filter(p => p.age >= 16);
      if (res.length < 4 || Math.random() > 0.3) continue;
      const rich = res.reduce((b, p) => People.purse(p) > People.purse(b) ? p : b, res[0]), poor = U.pick(res);
      if (poor !== rich && People.purse(rich) > People.purse(poor) * 3) this.feel(poor, 'envy', 40);
    }
  },
};

// ====================================================================== boatos
const Rumors = {
  L() { return G.rumors || (G.rumors = []); },
  // tone: +1 elogia o herói, −1 fala mal dele (muda a amizade das vilas onde o boato chega)
  add(text, x, y, o) {
    o = o || {};
    if (this.L().some(r => r.text === text && G.day - r.day < 3)) return;
    this.L().unshift({ text, x: Math.round(x), y: Math.round(y), day: G.day, reach: 8, about: o.about !== undefined ? o.about : null, tone: o.tone || 0, hit: [] });
    if (this.L().length > 50) this.L().length = 50;
  },
  atP(text, o) { this.add(text, P.x / TILE, P.y / TILE, o); },
  atV(vi, text, o) { const v = World.villages[vi]; if (v) this.add(text, v.x, v.y, o); },
  // os boatos que chegaram onde a pessoa mora
  known(p) {
    const h = p.home && p.home.type === 'village' && World.villages[p.home.idx] ? World.villages[p.home.idx] : null;
    const x = h ? h.x : P.x / TILE, y = h ? h.y : P.y / TILE;
    return this.L().filter(r => r.about !== p.id && U.dist(r.x, r.y, x, y) <= r.reach);
  },
  forVillage(vi) { const v = World.villages[vi]; return v ? this.L().filter(r => U.dist(r.x, r.y, v.x, v.y) <= r.reach) : []; },
  monthTick() {
    const L = this.L();
    for (const r of L) {
      r.reach += 28;
      if (!r.tone) continue;
      World.villages.forEach((v, vi) => {
        if (r.hit.includes(vi) || U.dist(r.x, r.y, v.x, v.y) > r.reach) return;
        r.hit.push(vi);
        for (const p of People.residents(vi)) if (!p.kin) p.aff = U.clamp(p.aff + r.tone * 3, -100, 100);
      });
    }
    G.rumors = L.filter(r => G.day - r.day <= 24);
    // fofoca: alguém anda saindo escondido...
    if (Math.random() < 0.25) {
      const vi = U.rint(0, World.villages.length - 1), res = People.residents(vi).filter(p => p.age >= 18 && p.spouse !== null && p.spouse !== 'player' && !p.kin);
      const a = U.pick(res), b = a && U.pick(People.residents(vi).filter(q => q.age >= 18 && q.sex !== a.sex && q.id !== a.spouse && q !== a && !q.kin));
      if (a && b) {
        this.atV(vi, `Dizem que ${People.full(a)} anda se encontrando escondido com ${People.full(b)}...`);
        const sp = G.people[a.spouse]; if (sp && sp.alive) Mind.feel(sp, 'anger', 50);
      }
    }
  },
};

// ====================================================================== gravidez e parto
// natalidade: a chance de uma mulher casada (18 a 42 anos) engravidar em cada mês, e a de nascerem gêmeos
const BIRTH_RATE = 0.075, TWINS_RATE = 0.05;
const Birth = {
  LEN: 9,
  midwife(vi) {
    const res = People.residents(vi).filter(p => p.sex === 'f' && p.age >= 35 && !People.isCourt(p) && !p.capanga && !p.kin);
    const m = res.find(p => p.midwife) || res.sort((a, b) => a.id - b.id)[0] || null;
    if (m) m.midwife = true;
    return m;
  },
  conceive(m, f) {
    m.preg = { since: G.day, due: G.day + this.LEN, father: f === 'player' ? 'player' : f.id };
    Mind.feel(m, 'joy', 50); if (f !== 'player') Mind.feel(f, 'joy', 40);
    if (m.home.type === 'village') Rumors.atV(m.home.idx, `${People.full(m)} está esperando um bebê!`);
  },
  monthTick() {
    for (const m of G.people) {
      if (!m.alive) continue;
      if (m.preg && m.preg.father !== 'player' && G.day >= m.preg.due) { this.deliver(m); continue; }
      if (m.preg || m.sex !== 'f' || m.age < 18 || m.age > 42 || m.spouse === null || m.spouse === 'player') continue;
      const s = G.people[m.spouse];
      if (!s || !s.alive || m.jail > G.day) continue;
      if (Math.random() < BIRTH_RATE * Families.birthFactor(m)) this.conceive(m, s);
    }
  },
  // o parto de uma moradora (com ou sem parteira na vila)
  deliver(m) {
    const f = G.people[m.preg.father], vi = m.home.type === 'village' ? m.home.idx : -1, mw = vi >= 0 ? this.midwife(vi) : null;
    m.preg = null;
    if (!f) return;
    const royal = m.rank === 'ruler' || f.rank === 'ruler' || m.rank === 'consort';
    const n = Math.random() < TWINS_RATE ? 2 : 1, kids = [];
    for (let k = 0; k < n; k++) { const c = People.child(m, f, { rank: royal ? 'heir' : 'child' }); c.age = 0; kids.push(c); }
    Mind.feel(m, 'joy', 70); Mind.feel(f, 'joy', 60);
    const known = m.met || f.met || m.aff >= 10 || f.aff >= 10;
    if (Math.random() < (mw ? 0.015 : 0.05)) { People.die(kids[0], 'logo ao nascer'); }
    if (Math.random() < (mw ? 0.01 : 0.035)) { People.die(m, 'no parto'); return; }
    if (vi >= 0) Rumors.atV(vi, `${n === 2 ? 'Nasceram gêmeos' : `Nasceu ${kids[0].sex === 'f' ? 'a filha' : 'o filho'}`} de ${People.full(m)} e ${f.name}${mw ? `, com a ajuda da parteira ${mw.name}` : ''}.`);
    if (known) UI.msg(`👶 ${n === 2 ? 'Nasceram gêmeos' : 'Nasceu um bebê'} na família de ${People.full(m)}.`);
  },
  // gravidez do herói (ou da esposa/marido do herói)
  playerMother() { const sp = G.family.spouse !== null ? People.get(G.family.spouse) : null; return P.sex === 'f' ? 'player' : sp && sp.sex === 'f' ? sp : null; },
  startPlayer() {
    const f = G.family; f.dueDay = G.day + this.LEN; f.pregSince = G.day; f.midwife = false;
    const m = this.playerMother(); if (m && m !== 'player') this.conceive(m, 'player');
    UI.msg(`💕 Uma criança está a caminho! Nasce em ${this.LEN} meses. Contrate uma parteira e compre um enxoval no armazém para um parto seguro.`, 'gold', true);
  },
  monthsP() { return G.family.dueDay ? Math.max(0, G.day - (G.family.pregSince !== undefined ? G.family.pregSince : G.family.dueDay - this.LEN)) : 0; },
  // chegou o dia: o parto (pode dar errado sem parteira)
  playerDue() {
    const f = G.family, m = this.playerMother(), safe = !!f.midwife, gear = Inv.count('layette') > 0;
    f.dueDay = 0; if (m && m !== 'player') m.preg = null;
    if (gear) Inv.add('layette', -1);
    const babyRisk = (safe ? 0.01 : 0.05) * (gear ? 0.5 : 1), momRisk = safe ? 0.005 : 0.03;
    if (m && m !== 'player' && Math.random() < momRisk) { People.die(m, 'no parto'); UI.banner('✝ Um parto trágico'); }
    if (m === 'player' && !safe && Math.random() < 0.25) { P.hp = Math.max(1, Math.round(P.maxHp * 0.25)); UI.msg('O parto foi difícil. Você precisa descansar.', 'bad', true); }
    if (Math.random() < babyRisk) { UI.banner('✝ O bebê não resistiu'); UI.msg('O bebê nasceu fraco e não resistiu. A família está de luto.', 'bad', true); if (m && m !== 'player') { m.mourn = G.day + 3; m.mournFor = 'o bebê'; Mind.feel(m, 'sad', 90); } return; }
    setTimeout(() => UI.showBirth(), 50);
  },
};

// ====================================================================== funerais, luto, testamento e herança
const Funerals = {
  L() { return G.funerals || (G.funerals = []); },
  family(p) { const ids = [...(p.children || []), ...(p.parents || []), ...(p.spouse !== null && p.spouse !== 'player' ? [p.spouse] : [])]; for (const q of G.people) if (q.alive && q !== p && q.parents && p.parents && q.parents.some(x => p.parents.includes(x))) ids.push(q.id); return [...new Set(ids)].map(id => G.people[id]).filter(q => q && q.alive && !q.kin); },
  before(p) { return { purse: p.purse || 0, kids: (p.children || []).map(id => G.people[id]).filter(c => c && c.alive && c.age >= 14 && !c.kin), shop: p.shop, rank: p.rank, home: p.home, x: P.x, y: P.y }; },
  after(p, cause, snap) {
    const fam = this.family(p), vi = p.home && p.home.type === 'village' ? p.home.idx : -1;
    // luto
    for (const q of fam) { q.mourn = G.day + 3; q.mournFor = p.name; Mind.feel(q, 'sad', 70); }
    // túmulo com o nome (a família do herói já ganha a lápide dela)
    const known = p.hero || p.legend || p.met || p.aff >= 10 || Families.isChief(p) || snap.shop || (vi >= 0 && World.villages[vi] && G.civs[World.villages[vi].civ] && G.civs[World.villages[vi].civ].ruler === 'player');
    if (!Graves.isFamily(p) && known && p.age > 0) {
      Graves.add(p, cause); const L = Graves.list(), g = L[L.length - 1]; if (g && g.pid === p.id) g.kind = 'village';
      const vg = L.filter(x => x.kind === 'village'); if (vg.length > 60) L.splice(L.indexOf(vg[0]), 1);
    }
    // cortejo e enterro: a família vai até a capela da vila
    if (vi >= 0 && fam.length) {
      this.L().push({ pid: p.id, name: p.name, vi, day: G.day, t0: G.realTime, until: G.realTime + 180, mourners: fam.slice(0, 6).map(q => q.id), seen: false });
      if (known) UI.msg(`⚰️ O enterro de ${People.full(p)} é hoje na capela de ${World.villages[vi].name}.`);
    }
    // testamento: a bolsa fica com os filhos adultos (ou com o cônjuge)
    const heirs = snap.kids.filter(c => c.alive);
    const spouse = p.spouse !== null && p.spouse !== 'player' ? G.people[p.spouse] : null;
    if (snap.purse > 0) {
      if (heirs.length) { const share = Math.floor(snap.purse / heirs.length); for (const c of heirs) c.purse = People.purse(c) + share; }
      else if (spouse && spouse.alive) spouse.purse = People.purse(spouse) + snap.purse;
      p.purse = 0;
    }
    // às vezes os irmãos brigam pela herança
    if (heirs.length >= 2 && (snap.purse >= 150 || snap.shop) && Math.random() < 0.35) {
      const [a, b] = heirs.sort((x, y) => y.age - x.age);
      a.feud = b.id; b.feud = a.id; a.feudUntil = b.feudUntil = G.day + 8; Mind.feel(a, 'anger', 60); Mind.feel(b, 'anger', 60);
      if (vi >= 0) {
        Rumors.atV(vi, `Os irmãos ${a.name} e ${b.name} brigam pela herança de ${p.name}.`);
        const v = World.villages[vi], c = G.civs[v.civ];
        if (c && c.ruler === 'player' && !G.trial) G.trial = { ci: v.civ, vi, id: 'disputa', day: G.day, data: { a: a.id, b: b.id, dead: p.name, amount: snap.purse } };
      }
    }
    // a loja ficou vaga: o melhor oficial do ofício assume
    if (snap.shop) setTimeout(() => Careers.fillShop(snap.shop, snap.rank), 0);
    // crime: matar um inocente
    if (cause === 'morto por você' && !p.hostile && !Court.isEnemy(Families.of(p))) Crime.commit(Crime.civAt(snap.x, snap.y, p), `assassinato de ${p.name}`, 450, snap.x, snap.y);
  },
  // a cada quadro: quem está no cortejo anda até a capela; se você estiver lá, a família agradece
  update() {
    const L = this.L(); if (!L.length) return;
    G.funerals = L.filter(f => G.day - f.day <= 1 && G.realTime < f.until + 30 && G.realTime >= f.t0 - 5); // o enterro dura uns minutos
    for (const f of G.funerals) {
      const v = World.villages[f.vi]; if (!v) continue;
      const ch = v.chapel && !v.chapel.removed ? v.chapel : null, tx = ch ? (ch.x + ch.w / 2) * TILE : (v.x + 0.5) * TILE, ty = ch ? (ch.y + ch.h + 1.4) * TILE : (v.y + 1) * TILE;
      if (!f.seen && G.realTime < f.until && U.dist(P.x, P.y, tx, ty) < 4 * TILE) {
        f.seen = true; Faith.addPiety && Faith.addPiety(1);
        for (const id of f.mourners) { const q = G.people[id]; if (q && q.alive) { People.addAff(q, 8); Mind.remember(q, 'funeral'); } }
        UI.msg(`🕯️ Você acompanhou o enterro de ${f.name}. A família agradece (+8 de amizade).`, 'gold');
      }
    }
  },
  // o alvo de quem está no cortejo
  target(e) {
    if (!e.npc) return null;
    for (const f of this.L()) {
      if (G.realTime >= f.until || !f.mourners.includes(e.npc.id)) continue;
      const v = World.villages[f.vi]; if (!v) continue;
      const ch = v.chapel && !v.chapel.removed ? v.chapel : null, k = f.mourners.indexOf(e.npc.id);
      return { x: (ch ? ch.x + ch.w / 2 : v.x + 0.5) * TILE + (k % 3 - 1) * 18, y: (ch ? ch.y + ch.h + 1.6 : v.y + 1) * TILE + Math.floor(k / 3) * 16, f, lead: k < 2 };
    }
    return null;
  },
};

// ====================================================================== aprendizes, oficiais e mestres; infância e escola
const TRADES = { smith: ['Ferreiro', 'Ferreira'], merchant: ['Comerciante', 'Comerciante'], lumber: ['Madeireiro', 'Madeireira'], mason: ['Pedreiro', 'Pedreira'],
  innkeeper: ['Taverneiro', 'Taverneira'], hunter: ['Caçador', 'Caçadora'], baker: ['Padeiro', 'Padeira'], weaver: ['Tecelão', 'Tecelã'], healer: ['Curandeiro', 'Curandeira'],
  potter: ['Oleiro', 'Oleira'], brewer: ['Cervejeiro', 'Cervejeira'] };
const DREAMS = ['smith', 'merchant', 'hunter', 'knight', 'priest', 'baker', 'healer', 'innkeeper', 'sailor', 'mason'];
const CAREER_LVL = ['Aprendiz', 'Oficial', 'Mestre'];
const Careers = {
  tradeName(t, sex) { const n = TRADES[t]; return n ? n[sex === 'f' ? 1 : 0] : (RANKS[t] ? RANKS[t][sex === 'f' ? 'f' : 'm'] : t); },
  dreamName(p) { const d = p.dream; if (d === 'knight') return p.sex === 'f' ? 'dama cavaleira' : 'cavaleiro'; if (d === 'priest') return p.sex === 'f' ? 'madre' : 'padre'; if (d === 'sailor') return p.sex === 'f' ? 'marinheira' : 'marinheiro'; return this.tradeName(d, p.sex).toLowerCase(); },
  title(p) {
    if (p.jail > G.day) return p.sex === 'f' ? 'Presa' : 'Preso';
    if (p.midwife && p.rank === 'peasant') return 'Parteira';
    if (p.retired) return p.sex === 'f' ? 'Aposentada' : 'Aposentado';
    const c = p.career;
    if (c && ['peasant', 'child'].includes(p.rank) && !p.shop) return `${CAREER_LVL[c.lvl]}${c.lvl === 0 ? ' de ' + this.tradeName(c.trade, 'm').toLowerCase() : ' ' + this.tradeName(c.trade, p.sex).toLowerCase()}`;
    if (p.age >= 6 && p.age < 14 && p.rank === 'child') return p.sex === 'f' ? 'Menina' : 'Menino';
    return null;
  },
  // o mestre de um ofício na vila (dono da loja do ofício)
  masterOf(vi, trade) { return G.people.find(q => q.alive && q.rank === trade && q.home.type === 'village' && q.home.idx === vi && (q.shop || trade === 'hunter')) || null; },
  monthTick() {
    for (const p of G.people) {
      if (!p.alive || p.kin || p.capanga) continue;
      // sonho de criança (aos 10 anos)
      if (p.age >= 10 && p.age < 14 && !p.dream) {
        const par = (p.parents || []).map(id => G.people[id]).find(q => q && TRADES[q.rank]);
        Ranking.stats(p);
        p.dream = par && Math.random() < 0.5 ? par.rank : p.str > 60 && Math.random() < 0.5 ? 'knight' : p.int > 60 && Math.random() < 0.4 ? 'priest' : U.pick(DREAMS);
      }
      // a escola da capela deixa as crianças mais espertas
      if (p.age >= 6 && p.age < 14 && p.home.type === 'village') { const v = World.villages[p.home.idx]; if (v && v.chapel && !v.chapel.removed && Math.random() < 0.5) { Ranking.stats(p); p.int = Math.min(99, p.int + 1); } }
      // vira aprendiz de um mestre
      if (p.age >= 12 && p.age < 18 && !p.career && p.home.type === 'village' && !People.isCourt(p) && Math.random() < 0.1) {
        const vi = p.home.idx, want = TRADES[p.dream] ? p.dream : null;
        const trade = (want && this.masterOf(vi, want) ? want : U.pick(Object.keys(TRADES).filter(t => this.masterOf(vi, t))));
        const m = trade && this.masterOf(vi, trade);
        if (m) { p.career = { trade, lvl: 0, master: m.id, xp: 0 }; Mind.feel(p, 'joy', 30); if (p.met || p.aff >= 10) UI.msg(`🎓 ${People.full(p)} virou aprendiz de ${m.name}, ${People.title(m).toLowerCase()}.`); }
      }
      const c = p.career;
      if (c && !p.shop) {
        const m = G.people[c.master];
        c.xp += m && m.alive ? 1 : 0.5;
        if (c.lvl === 0 && p.age >= 18 && c.xp >= 30) { c.lvl = 1; if (p.met || p.aff >= 10) UI.msg(`🎓 ${People.full(p)} virou oficial de ${this.tradeName(c.trade, 'm').toLowerCase()}.`); }
        else if (c.lvl === 1 && p.age >= 25 && c.xp >= 80) { c.lvl = 2; if (p.met || p.aff >= 10) UI.msg(`🏅 ${People.full(p)} agora é mestre ${this.tradeName(c.trade, p.sex).toLowerCase()}.`); }
        if (c.lvl > 0) p.purse = People.purse(p) + (c.lvl === 2 ? 6 : 3);
      }
      // quem sonhou ser cavaleiro vai para as armas aos 18
      if (p.dream === 'knight' && p.age === 18 && p.rank === 'peasant' && !p.career && (p.str || 0) >= 55 && Math.random() < 0.5) { p.rank = 'mercenary'; if (p.met) UI.msg(`⚔️ ${People.full(p)} pegou em armas, como sonhava desde criança.`); }
      // o velho mestre se aposenta e passa a loja adiante
      if (p.shop && p.age >= 60 && Math.random() < 0.2 && TRADES[p.rank]) this.retire(p);
    }
  },
  successor(vi, trade, old) {
    const kids = old ? (old.children || []).map(id => G.people[id]).filter(c => c && c.alive && c.age >= 18 && !c.kin && !c.capanga && !c.shop && !People.isCourt(c)) : [];
    const pros = G.people.filter(q => q.alive && q.career && q.career.trade === trade && q.career.lvl >= 1 && !q.shop && q.home.type === 'village' && q.home.idx === vi && !q.capanga);
    return kids.find(c => c.career && c.career.trade === trade) || pros.sort((a, b) => b.career.lvl - a.career.lvl || b.career.xp - a.career.xp)[0] || kids[0] || null;
  },
  retire(p) {
    const vi = p.home.type === 'village' ? p.home.idx : -1; if (vi < 0) return;
    const q = this.successor(vi, p.rank, p); if (!q) return;
    q.rank = p.rank; q.shop = p.shop; q.career = { trade: p.rank, lvl: 2, master: p.id, xp: 100 };
    p.shop = null; p.retired = true; p.rank = 'peasant';
    Rumors.atV(vi, `${p.name} se aposentou e passou o ofício para ${q.name}.`);
    if (p.met || q.met || p.aff >= 10) UI.msg(`🪑 ${People.full(p)} se aposentou. ${People.full(q)} agora cuida do ofício.`);
  },
  // a loja de quem morreu ficou sem ninguém: o melhor oficial assume
  fillShop(okey, rank) {
    if (!TRADES[rank] || G.people.some(q => q.alive && q.shop === okey)) return;
    const s = Shops.byKey(okey); if (!s || s.village === undefined) return;
    const q = this.successor(s.village, rank, null); if (!q) return;
    q.rank = rank; q.shop = okey; q.career = q.career || { trade: rank, lvl: 1, master: -1, xp: 40 };
    if (q.met || q.aff >= 10) UI.msg(`🎓 ${People.full(q)}, oficial do ofício, assumiu a loja.`);
  },
};

// ====================================================================== empréstimos e dívidas
const Loans = {
  L() { return G.loans || (G.loans = []); },
  OFFERS: { crown: { rate: 0.05, months: 8, amounts: [200, 500, 1500] }, merchant: { rate: 0.09, months: 6, amounts: [50, 150, 400] } },
  lenderName(l) { return l.kind === 'crown' ? `Tesouro de ${CIV_DEFS[l.ci].short}` : (G.people[l.pid] ? People.full(G.people[l.pid]) : 'agiota'); },
  take(kind, ci, pid, amount) {
    const o = this.OFFERS[kind];
    if (this.L().filter(l => l.left > 0).length >= 3) { UI.msg('Ninguém empresta para quem já deve a três credores.', 'bad'); return; }
    const total = Math.round(amount * (1 + o.rate * o.months)), monthly = Math.ceil(total / o.months);
    this.L().push({ kind, ci, pid, principal: amount, left: total, monthly, missed: 0, day: G.day });
    P.gold += amount; Sound.play('coin');
    if (pid !== undefined && G.people[pid]) Mind.remember(G.people[pid], 'loan');
    UI.msg(`💰 Empréstimo de ${amount} 🪙: você vai pagar ${monthly} 🪙 por mês, ${o.months} meses (${total} 🪙 no total).`, 'gold', true);
  },
  pay(i, all) {
    const l = this.L()[i]; if (!l || l.left <= 0) return;
    const n = Math.min(l.left, all ? l.left : l.monthly, P.gold);
    if (n <= 0) { UI.msg('Ouro insuficiente.', 'bad'); return; }
    P.gold -= n; l.left -= n; l.missed = 0; Sound.play('coin');
    UI.msg(l.left <= 0 ? `✅ Dívida com ${this.lenderName(l)} quitada!` : `Pagou ${n} 🪙. Faltam ${l.left} 🪙.`, 'gold');
    if (l.left <= 0) G.loans = this.L().filter(x => x.left > 0);
  },
  monthTick() {
    for (const l of this.L()) {
      if (l.left <= 0) continue;
      const n = Math.min(l.monthly, l.left);
      if (P.gold >= n) { P.gold -= n; l.left -= n; l.missed = 0; Game.note(`💰 Parcela do empréstimo (${this.lenderName(l)}): −${n} 🪙.`); continue; }
      l.missed++;
      UI.msg(`⚠️ Você não pagou a parcela de ${n} 🪙 a ${this.lenderName(l)} (${l.missed}ª vez).`, 'bad', true);
      if (l.missed >= 2) {
        // os cobradores levam o que acharem
        let took = Math.min(P.gold, l.left); P.gold -= took; l.left -= took;
        for (const k of Object.keys(P.inv).sort((a, b) => ITEMS[b].price - ITEMS[a].price)) {
          if (l.left <= 0) break;
          if (Object.values(P.equip).includes(k)) continue;
          const val = Math.max(1, Math.round(ITEMS[k].price * 0.5)), q = Math.min(P.inv[k], Math.ceil(l.left / val));
          if (q > 0) { Inv.add(k, -q); l.left -= q * val; took += q * val; }
        }
        if (took) UI.msg(`🧾 Os cobradores de ${this.lenderName(l)} levaram ${took} 🪙 em ouro e bens.`, 'bad', true);
      }
      if (l.missed >= 3 && l.left > 0) { Crime.commit(l.ci, 'dívida não paga', l.left, null, null, true); l.left = 0; }
    }
    G.loans = this.L().filter(l => l.left > 0);
    // dívidas dos moradores (a sua Casa de Câmbio empresta e cobra)
    for (const p of G.people) {
      if (!p.alive || p.kin || p.capanga || p.age < 18 || p.home.type !== 'village') continue;
      if (p.debt) {
        if (G.day < p.debt.due) continue;
        const d = p.debt, bank = d.bank !== undefined ? World.structs[d.bank] : null;
        if (People.purse(p) >= d.total) { p.purse -= d.total; if (bank && !bank.removed) { bank.till = (bank.till || 0) + d.total; Biz.addRev(bank, d.total - d.amount); } p.debt = null; continue; }
        // não pagou
        const vi = p.home.idx; p.debt = null; Mind.feel(p, 'sad', 50);
        if (p.shop && Math.random() < 0.5) { p.purse = 0; Rumors.atV(vi, `${People.full(p)} não pagou as dívidas e perdeu tudo o que tinha na loja.`); }
        else { p.jail = G.day + 3; Rumors.atV(vi, `${People.full(p)} não pagou a dívida e foi preso.`); const e = G.spawned.get(p.id); if (e) { e.dead = true; G.spawned.delete(p.id); } }
        continue;
      }
      if (People.purse(p) < 30 && Math.random() < (Scarcity.hard(p) ? 0.08 : 0.02)) {
        const amount = U.rint(60, 180), vi = p.home.idx;
        const bank = World.structs.find(s => s.owner === 'player' && s.type === 'biz_bank' && !s.removed && (s.till || 0) >= amount && Biz.crowd(s).vi === vi && Biz.workerCount(s) > 0);
        p.debt = { amount, total: Math.round(amount * 1.3), due: G.day + 6, bank: bank ? bank.id : undefined };
        p.purse = People.purse(p) + amount;
        if (bank) { bank.till -= amount; Mind.remember(p, 'loan'); }
        Rumors.atV(vi, `${People.full(p)} pediu dinheiro emprestado${bank ? ' na sua Casa de Câmbio' : ' a um agiota'}.`);
      }
    }
  },
};

// ====================================================================== crime, prisão e guardas
const Crime = {
  W() { return G.wanted || (G.wanted = {}); },
  wanted(ci) { const w = this.W()[ci]; return w && w.bounty > 0 ? w : null; },
  hunting(ci) { const w = this.wanted(ci); return !!(w && w.resist); },
  civAt(x, y, p) { const t = World.inb(Math.floor(x / TILE), Math.floor(y / TILE)) ? World.terr[World.idx(Math.floor(x / TILE), Math.floor(y / TILE))] : -1; return t >= 0 ? t : p && p.civ >= 0 ? p.civ : -1; },
  // alguém viu? então o reino passa a procurar você
  commit(ci, what, fine, x, y, sure) {
    if (ci === undefined || ci < 0 || !G.civs[ci] || G.civs[ci].ruler === 'player') return false;
    const px = x !== null && x !== undefined ? x : P.x, py = y !== null && y !== undefined ? y : P.y;
    const seen = sure || G.ents.some(e => !e.dead && (e.kind === 'guard' || (e.npc && e.kind === 'villager' && !e.sleeping)) && U.dist(e.x, e.y, px, py) < 9 * TILE);
    if (!seen && Math.random() > 0.25) return false;
    const w = this.W()[ci] || (this.W()[ci] = { bounty: 0, crimes: [], resist: false });
    w.bounty += Math.round(fine); w.crimes.push(what); if (w.crimes.length > 5) w.crimes.shift(); w.day = G.day;
    UI.banner(`⚖️ Procurado em ${CIV_DEFS[ci].short}!`);
    UI.msg(`⚖️ ${seen ? 'Testemunhas viram' : 'Descobriram'}: ${what}. Você é procurado em ${CIV_DEFS[ci].name} (multa de ${w.bounty} 🪙). Os guardas de lá vão tentar prender você.`, 'bad', true);
    this.rumor(`Procuram ${G.name} em ${CIV_DEFS[ci].short} por ${what}.`, px / TILE, py / TILE);
    return true;
  },
  rumor(text, x, y) { Rumors.add(text, x, y, { about: 'player', tone: -1 }); },
  clear(ci) { delete this.W()[ci]; },
  monthTick() {
    for (const ci in this.W()) { const w = this.W()[ci]; w.bounty = Math.round(w.bounty * 0.92); if (w.bounty < 25) delete this.W()[ci]; }
    // ladrões roubam casas à noite
    World.villages.forEach((v, vi) => {
      if (Math.random() > 0.08) return;
      const res = People.residents(vi).filter(p => p.age >= 16 && !p.kin && !p.capanga && !People.isCourt(p));
      const thief = U.pick(res.filter(p => ['beggar', 'wanderer', 'peasant'].includes(p.rank) && (People.purse(p) < 60 || (p.mood && p.mood.envy > 30))));
      const fams = [...new Set(res.map(p => p.fam))].map(id => Families.get(id)).filter(f => f && !f.player && f.wealth > 80 && (!thief || f.id !== thief.fam));
      const vf = U.pick(fams); if (!thief || !vf) return;
      const loot = Math.round(vf.wealth * U.rnd(0.15, 0.35)); vf.wealth -= loot;
      for (const q of Families.members(vf)) Mind.feel(q, 'anger', 40);
      const guarded = !v.free && G.civs[v.civ] && G.civs[v.civ].garrison > 0;
      if (guarded && Math.random() < 0.5) { thief.jail = G.day + 3; Rumors.atV(vi, `${People.full(thief)} foi preso por roubar a casa da família ${vf.surname}.`); const e = G.spawned.get(thief.id); if (e) { e.dead = true; G.spawned.delete(thief.id); } }
      else { thief.purse = People.purse(thief) + loot; Rumors.atV(vi, `Ladrões entraram à noite na casa da família ${vf.surname} e levaram ${loot} 🪙.`); }
    });
    // e de vez em quando nas suas casas (cães, arcas reforçadas e lampiões espantam os ladrões)
    const homes = World.structs.filter(s => s.owner === 'player' && !s.removed && ['house', 'manor', 'villa', 'hut', 'lodge', 'chest'].includes(s.type));
    if (homes.length && Math.random() < 0.06) {
      const s = U.pick(homes), box = Store.box(s), keys = Object.keys(box).filter(k => box[k] > 0);
      const safe = Content.mine('kennel').length || World.structs.some(o => o.owner === 'player' && (o.type === 'lamppost' || o.type === 'big_chest') && !o.removed && U.dist(o.x, o.y, s.x, s.y) < 8);
      if (keys.length && !safe) {
        const k = U.pick(keys), n = Math.max(1, Math.ceil(box[k] * 0.4)); box[k] -= n; if (box[k] <= 0) delete box[k];
        UI.msg(`🦹 Ladrões entraram à noite na sua ${BUILDINGS[s.type] ? BUILDINGS[s.type].name.toLowerCase() : 'casa'} e levaram ${n} ${ITEMS[k].name}. Um cão de guarda, um lampião ou uma arca reforçada ajudam.`, 'bad', true);
      }
    }
    // presos cumprem a pena
    for (const p of G.people) if (p.alive && p.jail && p.jail <= G.day) { p.jail = 0; Mind.feel(p, 'sad', 30); }
  },
  // a cada quadro: um guarda do reino onde você é procurado chega perto e dá voz de prisão
  update() {
    if (UI.isOpen() || UI.modal || G.place || G.dungeon || P.dead) return;
    if ((this.askT || 0) > G.realTime) return;
    for (const ci in this.W()) {
      const w = this.wanted(+ci); if (!w || w.resist) continue;
      const g = G.ents.find(e => !e.dead && e.kind === 'guard' && e.civ === +ci && U.dist(e.x, e.y, P.x, P.y) < 4.5 * TILE);
      if (g) { this.askT = G.realTime + 40; UI.showArrest(+ci); return; }
    }
  },
  pay(ci) { const w = this.wanted(ci); if (!w) return; if (P.gold < w.bounty) { UI.msg('Você não tem ouro para a multa.', 'bad'); return; } P.gold -= w.bounty; G.civs[ci].treasury += w.bounty; this.clear(ci); UI.msg(`⚖️ Multa paga. Você não é mais procurado em ${CIV_DEFS[ci].short}.`, 'gold'); },
  prison(ci) {
    const w = this.wanted(ci); if (!w) return;
    const months = U.clamp(1 + Math.floor(w.bounty / 200), 1, 6), cp = World.capitals[ci];
    this.clear(ci); UI.close();
    for (let k = 0; k < months; k++) Game.onNewDay();
    P.hunger = Math.min(P.hunger, 40); P.stamina = Math.min(P.stamina, 40);
    if (cp && cp.door) { P.x = (cp.door.x + 0.5) * TILE; P.y = (cp.door.y + 2.5) * TILE; }
    Rumors.add(`${G.name} cumpriu ${months} ${months === 1 ? 'mês' : 'meses'} de prisão em ${CIV_DEFS[ci].short}.`, P.x / TILE, P.y / TILE, { about: 'player' });
    UI.banner('⛓️ Você está livre'); UI.msg(`⛓️ Você passou ${months} ${months === 1 ? 'mês' : 'meses'} na prisão de ${CIV_DEFS[ci].short} e foi solto.`, 'bad', true);
  },
  labor(ci) {
    const w = this.wanted(ci); if (!w || w.bounty > 400) return;
    this.clear(ci); UI.close(); Game.onNewDay();
    P.stamina = 5; P.hunger = Math.max(0, P.hunger - 35); Game.gainXp(20);
    UI.msg(`⚒️ Um mês carregando pedras nas obras de ${CIV_DEFS[ci].short}. A pena foi paga.`, 'bad', true);
  },
  resist(ci) { const w = this.wanted(ci); if (!w) return; w.resist = true; UI.close(); UI.msg(`🗡️ Você resistiu à prisão! Os guardas de ${CIV_DEFS[ci].short} vão atacar até você pagar a multa.`, 'bad', true); w.bounty += 100; },
};

// ====================================================================== aluguel de casas
const RENT = { hut: 6, house: 15, lodge: 18, manor: 30, villa: 50 };
const Rent = {
  houseFor(p) {
    if (!p || p.fam === undefined) return null;
    return World.structs.find(s => s.owner === 'player' && !s.removed && s.tenant === p.fam) || null;
  },
  candidates(s) {
    let vi = -1, bd = 32;
    World.villages.forEach((v, i) => { const d = U.dist(v.x, v.y, s.x, s.y); if (d < bd) { bd = d; vi = i; } });
    if (vi < 0) return [];
    const fams = [...new Set(People.residents(vi).map(p => p.fam))].map(id => Families.get(id))
      .filter(f => f && !f.player && !f.noble && f.wealth >= RENT[s.type] * 3 && !World.structs.some(o => o.tenant === f.id && !o.removed) && Families.members(f).length >= 2);
    return fams.sort((a, b) => b.wealth - a.wealth).slice(0, 4);
  },
  rentTo(sid, fid) {
    const s = World.structs[sid], f = Families.get(fid); if (!s || !f) return;
    s.tenant = fid; s.rentMiss = 0;
    for (const q of Families.members(f)) { Mind.remember(q, 'rent'); const e = G.spawned.get(q.id); if (e) { e.dead = true; G.spawned.delete(q.id); } }
    UI.msg(`🏠 A família ${f.surname} alugou a sua ${BUILDINGS[s.type].name.toLowerCase()} por ${RENT[s.type]} 🪙 por mês.`, 'gold');
  },
  evict(sid) {
    const s = World.structs[sid], f = s && Families.get(s.tenant); if (!s) return;
    s.tenant = undefined;
    if (f) for (const q of Families.members(f)) { Mind.remember(q, 'evicted'); Mind.feel(q, 'anger', 60); People.addAff(q, -15); }
    UI.msg(`🏚️ Você despejou ${f ? 'a família ' + f.surname : 'os inquilinos'}.`, 'bad');
  },
  monthTick() {
    for (const s of World.structs) {
      if (s.owner !== 'player' || s.removed || s.tenant === undefined || s.tenant === null) continue;
      const f = Families.get(s.tenant), r = RENT[s.type] || 10;
      if (!f || !Families.members(f).length) { s.tenant = undefined; continue; }
      if (f.wealth >= r) { f.wealth -= r; P.gold += r; s.rentMiss = 0; Game.note(`🏠 Aluguel da família ${f.surname}: +${r} 🪙.`); }
      else if (++s.rentMiss >= 2) { s.tenant = undefined; UI.msg(`🏚️ A família ${f.surname} não pagou o aluguel duas vezes e saiu da sua casa.`, 'bad'); continue; }
      // a família juntou dinheiro e comprou casa própria
      if (f.wealth > 700 && Math.random() < 0.15) { s.tenant = undefined; UI.msg(`🏡 A família ${f.surname} juntou dinheiro, comprou casa própria e entregou a sua.`); }
    }
  },
  html(s) {
    if (!RENT[s.type] || s.owner !== 'player') return '';
    if (s.tenant !== undefined && s.tenant !== null) {
      const f = Families.get(s.tenant);
      return `<div class="card rent-card"><div class="sec">🏠 Alugada <span>${RENT[s.type]} 🪙 por mês</span></div><p>A família <b>${f ? UI.esc(f.surname) : '?'}</b> mora aqui${f ? ` (${Families.members(f).length} pessoas)` : ''}. Enquanto estiver alugada, você não dorme nela.</p>
        <div class="act-row"><button data-act="rentout" data-s="${s.id}">🏚️ Despejar</button></div></div>`;
    }
    const cs = this.candidates(s);
    return `<div class="card rent-card"><div class="sec">🏠 Alugar para uma família <span>${RENT[s.type]} 🪙 por mês</span></div>${cs.length ? cs.map(f => `<div class="crow"><span class="ri">🏛️</span><span><b>Família ${UI.esc(f.surname)}</b><small>${Families.members(f).length} pessoas · guardado: ${Math.round(f.wealth)} 🪙</small></span><span class="act-row"><button data-act="rentin" data-s="${s.id}" data-f="${f.id}">Alugar</button></span></div>`).join('') : '<p class="muted">Nenhuma família da vila mais próxima pode pagar agora.</p>'}</div>`;
  },
};

// ====================================================================== escassez e inflação
const FOOD_KEYS = new Set(Object.keys(ITEMS).filter(k => ITEMS[k].cat === 'Comida' || ['wheat', 'barley', 'carrot_seed', 'wheat_seed'].includes(k)));
const METAL_KEYS = new Set(Object.keys(ITEMS).filter(k => /_bar$|_ore$/.test(k) || ['Armas', 'Armaduras'].includes(ITEMS[k].cat) || k === 'coal'));
const Scarcity = {
  state(ci) { const c = G.civs[ci]; return c ? (c.scar || (c.scar = { drought: 0, famine: false, war: false })) : null; },
  mul(ci, k) {
    const s = this.state(ci); if (!s) return 1;
    if (FOOD_KEYS.has(k)) return (s.drought ? 1.6 : 1) * (s.famine ? 1.5 : 1) * (s.war ? 1.1 : 1);
    if (METAL_KEYS.has(k)) return s.war ? 1.35 : 1;
    return 1;
  },
  hard(p) { const v = p.home && p.home.type === 'village' ? World.villages[p.home.idx] : null; const s = v ? this.state(v.civ) : null; return !!(s && (s.drought || s.famine)); },
  note(ci) {
    const s = this.state(ci); if (!s) return '';
    const parts = [s.drought ? '☀️ seca: a comida está 60% mais cara' : '', s.famine ? '🌾 falta trigo: o pão sumiu das prateleiras' : '', s.war ? '⚔️ guerra: ferro e armas 35% mais caros' : ''].filter(Boolean);
    return parts.length ? `<div class="scar-note">${parts.join(' · ')}</div>` : '';
  },
  monthTick() {
    const summer = Season.cur && Season.cur().name && /ver/i.test(Season.cur().name);
    for (const c of G.civs) {
      const s = this.state(c.id);
      if (s.drought > 0) s.drought--;
      else if (summer && Math.random() < 0.15) { s.drought = 2; Diplo.chronicle(`☀️ Seca em ${CIV_DEFS[c.id].short}: as plantações secam e a comida encarece.`, c.ruler === 'player'); }
      s.famine = s.drought > 0 && ((c.stock && c.stock.wheat) || 0) < c.pop * 0.5 || (((c.stock && c.stock.wheat) || 0) < c.pop * 0.15);
      s.war = Diplo.warsOf(c.id).length > 0;
      // saques: o povo faminto e revoltado saqueia o armazém
      if (s.famine && c.happy < 45 && Math.random() < 0.3) {
        const vs = World.villages.map((v, vi) => ({ v, vi })).filter(x => x.v.civ === c.id && !x.v.free && x.v.store), x = U.pick(vs);
        if (x) { const k = Shops.keeper(x.v.store); if (k) { k.purse = Math.round(People.purse(k) * 0.5); Mind.feel(k, 'anger', 60); } Rumors.atV(x.vi, `Saques em ${x.v.name}: o povo faminto invadiu o armazém.`); if (c.ruler === 'player') UI.msg(`🔥 Saques em ${x.v.name}: o povo faminto invadiu o armazém! Mande trigo ou baixe os impostos.`, 'bad', true); }
      }
    }
  },
  // em tempo de fome os moradores fazem fila na porta do armazém
  queueSpot(e) {
    const v = World.villages[e.vi]; if (!v || !v.store || v.store.removed) return null;
    const s = this.state(v.civ); if (!s || !(s.famine || s.drought)) return null;
    const h = Game.hour(); if (h < 8 || h > 16 || e.npc.age < 16 || U.hash2(e.npc.id, G.day, 5) > 0.35) return null;
    const k = Math.floor(U.hash2(e.npc.id, 9, 5) * 7), st = v.store;
    return { x: (st.x + st.w / 2) * TILE + 6, y: (st.y + st.h + 1) * TILE + k * 15 };
  },
};

// ====================================================================== tudo junto: ganchos no jogo
const Lifesim = {
  monthTick() {
    Mind.monthTick(); Rumors.monthTick(); Birth.monthTick(); Careers.monthTick(); Loans.monthTick(); Crime.monthTick(); Rent.monthTick(); Scarcity.monthTick();
    for (const p of G.people) if (p.feud && G.day >= (p.feudUntil || 0)) p.feud = null;
  },
  update() { Funerals.update(); Crime.update(); },
  // fichinhas na conversa: humor, luto, gravidez, carreira, dívida, prisão
  chips(p) {
    const out = [], mo = Mind.main(p);
    if (p.mourn > G.day) out.push(`<span class="tag" style="background:#2a2a2e">🖤 De luto${p.mournFor ? ' por ' + UI.esc(p.mournFor) : ''}</span>`);
    if (p.preg) out.push(`<span class="tag" style="background:#8a4a6a">🤰 Grávida de ${Math.max(1, G.day - p.preg.since)} ${G.day - p.preg.since === 1 ? 'mês' : 'meses'}</span>`);
    if (mo) out.push(`<span>${MOODS[mo].icon} ${MOODS[mo].name}</span>`);
    if (p.career && !p.shop) out.push(`<span>🎓 ${CAREER_LVL[p.career.lvl]} · ${Careers.tradeName(p.career.trade, p.sex)}</span>`);
    if (p.dream && p.age < 14) out.push(`<span>💭 Quer ser ${Careers.dreamName(p)}</span>`);
    if (p.debt) out.push('<span class="tag" style="background:#6a3a1a">🧾 Endividado</span>');
    if (p.midwife) out.push('<span>👶 Parteira</span>');
    const m = Mind.recent(p); if (m) out.push(`<span>${MEM_GOOD[m.k] ? '💚' : '💢'} Lembra: ${{ gift: 'do seu presente', gold: 'da sua ajuda', insult: 'da ofensa', robbed: 'do roubo', attacked: 'do ataque', funeral: 'de você no enterro', hired: 'do emprego', fired: 'da demissão', loan: 'do empréstimo', rent: 'do aluguel', evicted: 'do despejo', midwife: 'do parto' }[m.k]}</span>`);
    return out;
  },
  acts(p, acts) {
    if (p.age >= 14) acts.push(['gossip', '👂 Perguntar as novidades']);
    if (p.rank === 'merchant' && p.home.type === 'village') acts.push(['loanask', '💰 Pedir empréstimo']);
    if (p.midwife && G.family.dueDay && !G.family.midwife) acts.push(['midwife', '👶 Contratar como parteira — 40 🪙']);
  },
  talkAct(p, op) {
    if (op === 'gossip') {
      const rs = Rumors.known(p).filter(r => r.about !== p.id);
      if (!rs.length) return { text: 'Por aqui tudo calmo. Nenhuma novidade.', note: '' };
      const r = U.pick(rs.slice(0, 8)); return { text: `Ouvi dizer que... ${r.text}`, note: r.about === 'player' ? (r.tone < 0 ? 'O boato sobre você está correndo as vilas.' : 'Falam bem de você por aí.') : '' };
    }
    if (op === 'loanask') { UI.showLoans('merchant', p.civ >= 0 ? p.civ : (World.villages[p.home.idx] || {}).civ, p.id); return 'shown'; }
    if (op === 'midwife') {
      if (P.gold < 40) return { text: 'Meu trabalho tem preço, querido.', note: 'Você precisa de 40 🪙.' };
      P.gold -= 40; G.family.midwife = true; Mind.remember(p, 'midwife');
      return { text: 'Pode deixar comigo. Na hora do parto eu estarei lá!', note: 'Parteira contratada: o parto fica muito mais seguro.' };
    }
    return null;
  },
  // na loja: aviso de escassez e furtar algo da prateleira
  shopExtra(civ, owner, type, vi) {
    const k = `${owner.id}-${G.day}`, tried = G.stealTry && G.stealTry[k];
    return `${Scarcity.note(civ)}<div class="act-row steal-row"><button data-act="steal" data-t="${type}" data-v="${vi}" data-o="${owner.id}" ${tried ? 'disabled' : ''}>🤫 Furtar algo da prateleira${tried ? ' (já tentou este mês)' : ''}</button></div>`;
  },
  steal(type, vi, oid) {
    const owner = People.get(oid), sh = SHOPS[type]; if (!owner || !sh) return;
    G.stealTry = G.stealTry || {}; G.stealTry[`${owner.id}-${G.day}`] = 1;
    const cheap = sh.sells.filter(k => ITEMS[k] && ITEMS[k].price <= 40), k = U.pick(cheap.length ? cheap : sh.sells);
    const night = G.darkness > 0.3, chance = 0.45 + (night ? 0.15 : 0) - (owner.aff > 40 ? 0.1 : 0) - (TRAITS[owner.trait] && owner.trait === 'desconfiado' ? 0.15 : 0);
    if (Math.random() < chance) { Inv.add(k, 1); UI.msg(`🤫 Você escondeu ${ITEMS[k].name} na roupa sem ninguém ver.`, 'gold'); Faith.addSin && Faith.addSin(1, 'Furtar'); UI.refresh(); return; }
    People.addAff(owner, -35); Mind.remember(owner, 'robbed'); Mind.feel(owner, 'anger', 70);
    UI.close(); UI.msg(`😱 ${owner.name} pegou você furtando ${ITEMS[k].name}!`, 'bad', true);
    const ci = owner.civ >= 0 ? owner.civ : (World.villages[vi] || {}).civ;
    Crime.commit(ci, 'furto na loja', 60 + ITEMS[k].price * 3, null, null, true);
  },
};

// ---------------------------------------------------------------- janelas: empréstimos e prisão
UI.showLoans = function (kind, ci, pid) {
  const o = Loans.OFFERS[kind], L = Loans.L();
  const lender = kind === 'crown' ? `o tesouro de ${CIV_DEFS[ci].name}` : (G.people[pid] ? People.full(G.people[pid]) : 'o agiota');
  const offers = o.amounts.map(a => { const total = Math.round(a * (1 + o.rate * o.months)); return `<div class="crow"><span class="ri">💰</span><span><b>${a} 🪙</b><small>${o.months} parcelas de ${Math.ceil(total / o.months)} 🪙 · total ${total} 🪙 (${Math.round(o.rate * 100)}% ao mês)</small></span><span class="act-row"><button class="primary" data-act="loantake" data-k="${kind}" data-c="${ci}" data-p="${pid === undefined ? '' : pid}" data-n="${a}">Pegar</button></span></div>`; }).join('');
  const mine = L.map((l, i) => `<div class="crow"><span class="ri">🧾</span><span><b>${Loans.lenderName(l)}</b><small>deve ${l.left} 🪙 · parcela ${l.monthly} 🪙${l.missed ? ` · <b class="bad">${l.missed} parcela(s) atrasada(s)</b>` : ''}</small></span><span class="act-row"><button data-act="loanpay" data-i="${i}">Pagar parcela</button><button data-act="loanpayall" data-i="${i}">Quitar</button></span></div>`).join('');
  const h = `<p>Quem empresta é <b>${UI.esc(lender)}</b>. As parcelas saem do seu ouro todo mês. Atrasou duas vezes, os cobradores levam ouro e bens; atrasou três, você vira procurado no reino.</p>
    <div class="card"><div class="sec">💰 Empréstimos oferecidos</div>${offers}</div>
    <div class="card"><div class="sec">🧾 Suas dívidas <span>${L.length}</span></div>${mine || '<p class="muted">Você não deve nada a ninguém.</p>'}</div>`;
  this.open('💰 Empréstimos', h, 'showLoans', [kind, ci, pid], 'Pegar dinheiro emprestado com juros');
};
UI.showArrest = function (ci) {
  const w = Crime.wanted(ci); if (!w) return;
  const months = U.clamp(1 + Math.floor(w.bounty / 200), 1, 6);
  const h = `<div class="arrest"><p class="bad"><b>"Em nome ${/^(Rainha|Imperatriz|Duquesa|Condessa|Princesa|Senhora|Dama)/.test(G.civs[ci].rulerName) ? 'da' : /^(Rei|Imperador|Duque|Conde|Príncipe|Senhor|Lorde|Chefe)/.test(G.civs[ci].rulerName) ? 'do' : 'de'} ${UI.esc(G.civs[ci].rulerName)}, você está preso!"</b></p><p>Acusações: ${w.crimes.map(c => UI.esc(c)).join(', ')}.</p>
    <div class="act-row" style="flex-direction:column;align-items:stretch">
      <button class="primary" data-act="arrestpay" data-c="${ci}" ${P.gold >= w.bounty ? '' : 'disabled'}>💰 Pagar a multa — ${w.bounty} 🪙</button>
      <button data-act="arrestjail" data-c="${ci}">⛓️ Cumprir pena na prisão — ${months} ${months === 1 ? 'mês' : 'meses'} (o tempo passa)</button>
      <button data-act="arrestlabor" data-c="${ci}" ${w.bounty <= 400 ? '' : 'disabled'}>⚒️ Trabalho forçado — 1 mês nas obras${w.bounty > 400 ? ' (multa alta demais)' : ''}</button>
      <button data-act="arrestresist" data-c="${ci}">🗡️ Resistir à prisão (os guardas vão atacar)</button></div></div>`;
  this.open(`⚖️ Preso em ${CIV_DEFS[ci].short}`, h, 'showArrest', [ci], 'A justiça do reino');
};

// ====================================================================== ganchos nos sistemas que já existem
{
  // morte: luto, enterro, testamento, briga de herança e crime
  const die0 = People.die.bind(People);
  People.die = function (p, cause) { if (!p || !p.alive) return; const snap = Funerals.before(p); die0(p, cause); Funerals.after(p, cause, snap); };
  // fala: lembranças e humor
  const say0 = People.say.bind(People);
  People.say = function (p) { const l = Mind.line(p); return l && Math.random() < 0.65 ? l : say0(p); };
  for (const [fn, k] of [['gift', 'gift'], ['giveGold', 'gold'], ['insult', 'insult']]) {
    const f0 = People[fn].bind(People);
    People[fn] = function (p, ...a) { const r = f0(p, ...a); if (r) { Mind.remember(p, k); Mind.feel(p, k === 'insult' ? 'anger' : 'joy', k === 'insult' ? 45 : 25); } return r; };
  }
  // títulos: aprendiz, oficial, mestre, parteira, aposentado, preso
  const t0 = People.title.bind(People); People.title = p => Careers.title(p) || t0(p);
  // aparência: roupa de luto e barriga de grávida
  const l0 = People.look.bind(People);
  People.look = p => { const lk = l0(p); if (p.mourn > G.day) { lk.body = '#2a2a2e'; if (!['ruler', 'consort', 'heir'].includes(p.rank)) lk.cape = null; } if (p.preg) lk.preg = Math.min(1, (G.day - p.preg.since + 1) / Birth.LEN); return lk; };
  // casamento vira alegria e boato
  const m0 = People.marry.bind(People);
  People.marry = (a, b) => { m0(a, b); Mind.feel(a, 'joy', 60); Mind.feel(b, 'joy', 60); if (a.home && a.home.type === 'village') Rumors.atV(a.home.idx, `${a.name} e ${b.name} se casaram!`); };
  // casa alugada: a família inquilina dorme na sua casa
  const h0 = Homes.houseOf.bind(Homes); Homes.houseOf = p => Rent.houseFor(p) || h0(p);
  // preços: seca, fome e guerra
  const f0 = Market.f.bind(Market); Market.f = (ci, k) => f0(ci, k) * Scarcity.mul(ci, k);
  // incendiar ou roubar empreendimento é crime
  const o0 = FamilyCrime.outrage.bind(FamilyCrime);
  FamilyCrime.outrage = (f, ci, king, what) => { o0(f, ci, king, what); if (!king) Crime.commit(ci, /incend/.test(what) ? 'incêndio criminoso' : 'roubo de empreendimento', 300); };
  // quem está de luto trabalha menos
  const bf0 = Biz.forecast.bind(Biz);
  Biz.forecast = s => { const r = bf0(s), ws = Biz.workers(s), n = ws.filter(p => p.mourn > G.day).length; if (n && ws.length) { const k = 1 - 0.5 * n / ws.length; for (const it in r.out) r.out[it] = Math.round(r.out[it] * k); r.gold = Math.round(r.gold * k); } return r; };
  const hi0 = Biz.hire.bind(Biz); Biz.hire = (p, s) => { const r = hi0(p, s); if (r) { Mind.remember(p, 'hired'); Mind.feel(p, 'joy', 40); } return r; };
  const fi0 = Biz.fire.bind(Biz); Biz.fire = p => { fi0(p); Mind.remember(p, 'fired'); Mind.feel(p, 'sad', 40); };
  // rotina: cortejo do enterro, fila do armazém na fome, escola de manhã e brincadeira à tarde
  const ru0 = Routine.update.bind(Routine);
  Routine.update = function (e, dt, sp) {
    if (e.npc && !e.sleeping && e.vi !== undefined && !G.dungeon && !e.leaving && (e.inside === undefined || e.inside === null)) {
      const ph = this.phase();
      const ft = ph !== 'night' ? Funerals.target(e) : null;
      e.funeralLead = !!(ft && ft.lead);
      if (ft) { if (U.dist(e.x, e.y, ft.x, ft.y) > 10) this.go(e, ft.x, ft.y, sp * 0.45, dt); else e.dir = 1; return true; }
      const q = ph === 'day' ? Scarcity.queueSpot(e) : null;
      if (q) { if (U.dist(e.x, e.y, q.x, q.y) > 8) this.go(e, q.x, q.y, sp * 0.7, dt); return true; }
      const v = World.villages[e.vi];
      if (v && ph === 'day' && e.npc.age >= 6 && e.npc.age < 14) {
        if (Game.hour() < 12 && v.chapel && !v.chapel.removed) { const d = this.door(v.chapel), tx = d.x + ((e.npc.id % 5) - 2) * 12, ty = d.y + 12 + (e.npc.id % 2) * 12; if (U.dist(e.x, e.y, tx, ty) > 8) this.go(e, tx, ty, sp * 0.8, dt); return true; }
        const a = G.realTime * 0.8 + e.npc.id * 1.7, tx = (v.x + 0.5) * TILE + Math.cos(a) * 64, ty = (v.y + 1) * TILE + Math.sin(a * 1.3) * 40;
        e.moveToward(tx, ty, sp * 1.15, dt); return true;
      }
    }
    return ru0(e, dt, sp);
  };
  // barriga de grávida (e o caixão nos ombros de quem lidera o cortejo)
  const dh0 = drawHuman;
  // eslint-disable-next-line no-global-assign
  drawHuman = function (ctx, x, y, o) {
    dh0(ctx, x, y, o);
    if (o && o.preg) { const s = o.scale || 1, d = o.dir || 1; ctx.fillStyle = o.body || '#8a6d4a'; ctx.beginPath(); ctx.ellipse(x + d * (2 + 3 * o.preg) * s, y - 13 * s, (2 + 3 * o.preg) * s, (3 + 2.5 * o.preg) * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x + d * (3 + 3 * o.preg) * s, y - 14 * s, 1.4 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  };
  const pl0 = playerLook;
  // eslint-disable-next-line no-global-assign
  playerLook = function () { const lk = pl0(); if (P.sex === 'f' && G.family && G.family.dueDay) lk.preg = Math.min(1, (Birth.monthsP() + 1) / Birth.LEN); return lk; };
  // boatos na taverna
  const tv0 = UI.showTavern.bind(UI);
  UI.showTavern = function (sid, rumor) { if (!rumor) { const s = World.structs[sid], rs = s ? Rumors.forVillage(s.village) : []; if (rs.length && Math.random() < 0.7) rumor = U.pick(rs.slice(0, 10)).text; } return tv0(sid, rumor); };
  // briga de herança no tribunal do rei
  TRIALS.push({ id: 'disputa', icon: '⚖️', text: v => { const d = (G.trial && G.trial.data) || {}, a = G.people[d.a], b = G.people[d.b]; return `Os irmãos ${a ? a.name : '?'} e ${b ? b.name : '?'} disputam a herança de ${d.dead || '?'} em ${v.name}.`; },
    opts: [
      ['Dividir igualmente', c => { const d = G.trial.data, a = G.people[d.a], b = G.people[d.b]; for (const q of [a, b]) if (q) { q.feud = null; Mind.feel(q, 'joy', 20); } c.happy = Math.min(100, c.happy + 2); return 'Os irmãos dividem tudo e fazem as pazes (+2).'; }],
      ['Tudo para o mais velho', c => { const d = G.trial.data, a = G.people[d.a], b = G.people[d.b]; if (a && b) { const n = Math.floor(People.purse(b) / 2); b.purse -= n; a.purse = People.purse(a) + n; Mind.feel(b, 'anger', 60); a.feud = b.feud = null; } return `${a ? a.name : 'O mais velho'} fica com a herança; ${b ? b.name : 'o irmão'} sai furioso.`; }],
      ['A coroa fica com a herança', c => { const d = G.trial.data; let got = 0; for (const id of [d.a, d.b]) { const q = G.people[id]; if (q) { const n = Math.floor(People.purse(q) / 2); q.purse -= n; got += n; q.feud = null; Mind.feel(q, 'anger', 60); } } c.treasury += got; c.happy = Math.max(0, c.happy - 3); return `A coroa recolheu ${got} 🪙. O povo acha a decisão injusta (−3).`; }],
    ] });
}
SHOPS.store.sells.push('layette');
