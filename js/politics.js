'use strict';
// Política das vilas e do trono.
//  • Vilas: o governador é eleito pelo povo e governa por um mandato de 5 meses (5 anos de vida). Ganha quem tem mais
//    feitos pela vila (obras, doações, festas, investimentos, bandidos derrotados, ofício bem feito), melhor
//    relacionamento com os moradores e mais fama. Os anciãos votam com peso 3. Você também precisa se reeleger.
//  • Trono: o rei passa a coroa de pai para filho, a não ser que alguém a tome. As únicas formas são matar o rei
//    (na guerra ou na sala do trono) ou comprar todos à volta dele (o conselho e o general) e atacar sem que ninguém
//    o proteja. Famílias descontentes tramam golpes nos reinos da IA e também contra você.

const POL_TERM = 5;
const KING_CIRCLE = { general: ['General', 'Generala', '⚔️'], treasurer: ['Tesoureiro', 'Tesoureira', '💰'], chamberlain: ['Camareiro', 'Camareira', '🗝️'], captain: ['Capitão da guarda', 'Capitã da guarda', '🛡️'] };

const Politics = {
  S() { const u = G.urban || (G.urban = {}); const s = u.pol || (u.pol = { deeds: {}, circle: {}, bribes: {}, plots: [], log: [] }); return s; },
  log(t) { const L = this.S().log; L.unshift({ day: G.day, t }); if (L.length > 20) L.length = 20; },
  // ---------------------------------------------------------------- feitos pela vila
  deeds(vi, who) { const d = this.S().deeds[vi]; return d ? Math.round(d[who] || 0) : 0; },
  addDeed(vi, who, n, why) {
    if (vi === undefined || vi < 0 || !World.villages[vi] || !n) return;
    const D = this.S().deeds, d = D[vi] || (D[vi] = {}); d[who] = Math.min(250, (d[who] || 0) + n);
    if (who === 'player' && why) Game.note(`🏘️ ${why} (+${Math.round(n)} feitos por ${World.villages[vi].name}).`);
  },
  fame(who) {
    if (who === 'player') return Math.min(120, Court.fame() / 2);
    const p = G.people[who]; if (!p) return 0;
    return Math.min(120, (p.hero ? (p.hero.fame || 0) / 2 : 0) + ({ knight: 25, priest: 18, merchant: 12, smith: 10, innkeeper: 10, mason: 8, lumber: 8 }[p.rank] || 0) + Math.min(25, People.purse(p) / 40) + (p.age >= 50 ? 8 : 0));
  },
  // o que um morador acha de um candidato (−100 a 100)
  likes(r, who) {
    if (who === 'player') return r.aff || 0;
    const c = G.people[who]; if (!c) return 0; const t = Society.ties(r);
    return (t.friends.includes(c.id) ? 45 : 0) - (t.foes.includes(c.id) ? 45 : 0) + (r.fam === c.fam ? 35 : 0) + (r.rank === c.rank ? 8 : 0);
  },
  rel(vi, who) { const R = People.residents(vi).filter(p => p.age >= 16); return R.length ? Math.round(R.reduce((a, r) => a + this.likes(r, who), 0) / R.length) : 0; },
  score(vi, who) { const d = this.deeds(vi, who), f = Math.round(this.fame(who)), r = this.rel(vi, who); return { d, f, r }; },
  whoName(k) { return k === 'player' ? 'você' : G.people[+k] ? G.people[+k].name : '?'; },
  // empate: numa vila de um reino, o rei decide; numa vila livre, quem já governava fica no cargo, e entre dois novos
  // candidatos o governador anterior decide (sem ele, o ancião mais velho)
  tieBreak(vi, tied) {
    const v = World.villages[vi], c = !v.free && G.civs[v.civ] && !G.civs[v.civ].anarchy ? G.civs[v.civ] : null;
    if (c) {
      if (c.ruler === 'player') return { pending: true, by: 'rei' };
      const w = this.pick(c.rulerId !== null ? People.get(c.rulerId) : null, tied, vi, c);
      return { win: w, how: `${c.rulerName} desempatou a favor de ${this.whoName(w)}` };
    }
    const inc = v.lord === 'player' ? 'player' : v.chief !== undefined && v.chief !== 'player' ? String(v.chief) : null;
    if (inc && tied.includes(inc)) return { win: inc, how: `${inc === 'player' ? 'você já governava e ficou' : `${this.whoName(inc)} já governava e ficou`} no cargo` };
    if (inc === 'player') return { pending: true, by: 'governador' };
    const prev = inc ? G.people[+inc] : null, dec = prev && prev.alive ? prev : Society.elders(vi)[0] || null, w = this.pick(dec, tied, vi, null);
    return { win: w, how: `${dec ? dec === prev ? `o governador anterior, ${dec.name},` : `o ancião ${dec.name}` : 'a sorte'} desempatou a favor de ${this.whoName(w)}` };
  },
  // quem decide (um rei, o governador anterior ou um ancião) escolhe a família, os amigos e quem fez mais pela vila
  pick(dec, tied, vi, c) {
    const val = k => {
      const base = this.deeds(vi, k) * 0.3 + this.fame(k) * 0.3;
      if (k === 'player') return base + (dec ? dec.aff || 0 : 0) + (c ? (c.relation || 0) * 0.5 : 0);
      const p = G.people[+k]; if (!p) return -999;
      return base + (dec ? (p.fam === dec.fam ? 60 : 0) + this.likes(dec, p.id) : 0);
    };
    return tied.slice().sort((a, b) => val(b) - val(a))[0];
  },
  // a sua decisão no empate (como rei ou como governador anterior)
  decide(vi, who) {
    const E = Society.E(vi); if (!E.tie || !E.tie.ids.includes(who)) return;
    Society.finishElection(vi, who, E.tie.res, `você, ${E.tie.by === 'rei' ? 'como rei' : 'como governador anterior'}, desempatou a favor de ${who === 'player' ? 'si mesmo' : this.whoName(who)}`);
  },
  // inscrições nos 3 meses antes da eleição: o governador tenta a reeleição e quem tem feitos e fama se candidata
  pool(vi) { return People.residents(vi).filter(p => p.age >= 25 && !p.kin && !p.capanga && p.spouse !== 'player' && p.rank !== 'child'); },
  val(vi, p) { const s = this.score(vi, p.id); return s.d * 1.2 + s.f + s.r * 0.3; },
  registerTick(vi, force) {
    const v = World.villages[vi], E = Society.E(vi); if (!v || E.tie) return;
    if (!force && E.next - G.day > 3) return;
    Society.candidates(vi);
    const cur = v.chief !== undefined && v.chief !== 'player' ? G.people[v.chief] : null;
    const add = (p, why) => { if (!p || E.reg.includes(p.id) || E.reg.length >= 3) return; E.reg.push(p.id); if (why) Rumors.atV(vi, `${p.name} ${why}.`); };
    if (cur && cur.alive && cur.home.type === 'village' && cur.home.idx === vi && (force || Math.random() < 0.8)) add(cur, 'vai tentar a reeleição');
    for (const p of this.pool(vi).filter(p => p !== cur && !E.reg.includes(p.id)).sort((a, b) => this.deeds(vi, b.id) + this.fame(b.id) - this.deeds(vi, a.id) - this.fame(a.id)).slice(0, 6).sort((a, b) => this.val(vi, b) - this.val(vi, a)).slice(0, 4)) if (force ? E.reg.length < 2 : Math.random() < 0.3) add(p, `se candidatou a governador de ${v.name}`);
    // ninguém se inscreveu: o conselho da vila indica o morador com mais feitos e fama
    if (force && !E.reg.length && !(E.me || v.lord === 'player')) { const p = this.pool(vi).sort((a, b) => this.val(vi, b) - this.val(vi, a))[0]; add(p, 'foi indicado pelo conselho da vila'); }
  },
  ties() { return Object.keys(Society.S().elect).filter(vi => Society.S().elect[vi].tie && World.villages[vi]).map(Number); },
  // feitos dos moradores todo mês (ofício, governo e doações), e o tempo apaga um pouco
  monthTick() {
    // empate esperando a sua decisão há um mês: o conselho da vila escolhe
    for (const vi of this.ties()) { const E = Society.E(vi); if (G.day - E.tie.day >= 1) Society.finishElection(vi, this.pick(null, E.tie.ids, vi, null), E.tie.res, 'você não decidiu a tempo e o conselho da vila escolheu'); }
    World.villages.forEach((v, vi) => this.registerTick(vi));
    const D = this.S().deeds;
    for (const vi in D) for (const k in D[vi]) { D[vi][k] *= 0.97; if (D[vi][k] < 0.5) delete D[vi][k]; }
    World.villages.forEach((v, vi) => {
      for (const p of People.residents(vi)) {
        if (!People.isAdult(p) || p.capanga || p.kin) continue;
        let n = 0;
        if (p.shop) n += 1; if (['priest', 'knight'].includes(p.rank)) n += 1; if (v.chief === p.id) n += 1.5;
        if (People.purse(p) > 300 && Math.random() < 0.12) { const g = U.rint(30, 90); p.purse -= g; v.prosper = (v.prosper || 0) + g / 300; n += 4; if (Math.random() < 0.4) Rumors.atV(vi, `${p.name} ${U.pick(['pagou a reforma do poço', 'deu um banquete para a vila', 'consertou a ponte com o próprio dinheiro', 'doou trigo aos pobres'])}.`); }
        if (n) this.addDeed(vi, p.id, n);
      }
    });
    this.throneTick();
  },

  // ---------------------------------------------------------------- o círculo do rei (reinos da IA): conselho e general
  circle(ci) {
    const C = this.S().circle, c = G.civs[ci]; if (!c || c.ruler === 'player') return {};
    const cc = C[ci] || (C[ci] = {});
    for (const seat in KING_CIRCLE) {
      const p = cc[seat] !== undefined ? G.people[cc[seat]] : null;
      if (p && p.alive && p.civ === ci) continue;
      const knight = G.people.find(q => q.alive && q.civ === ci && q.rank === 'knight' && !Object.values(cc).includes(q.id) && !q.capanga && q.spouse !== 'player');
      const q = seat === 'general' && knight ? knight : People.create({ rank: 'knight', civ: ci, home: { type: 'castle', civ: ci }, age: U.rint(30, 58) });
      cc[seat] = q.id; delete q.bribed;
    }
    return cc;
  },
  circlePeople(ci) { return Object.entries(this.circle(ci)).map(([seat, id]) => ({ seat, p: G.people[id] })).filter(x => x.p && x.p.alive); },
  seatOf(p) { if (!p || p.civ < 0) return null; const cc = this.S().circle[p.civ]; if (!cc) return null; const e = Object.entries(cc).find(([, id]) => id === p.id); return e ? e[0] : null; },
  bought(ci) { return this.circlePeople(ci).filter(x => x.p.bribed === 'player').length; },
  // todos comprados: ninguém protege o rei na sala do trono
  ready(ci) { const L = this.circlePeople(ci); return L.length > 0 && L.every(x => x.p.bribed === 'player'); },
  bribeCost(p) { return Math.round((180 + Math.max(0, 60 - (p.aff || 0)) * 4) * (this.seatOf(p) === 'general' ? 1.5 : 1)); },
  bribeChance(p) { return U.clamp(0.35 + (p.aff || 0) / 160 + (p.trait === 'ganancioso' ? 0.25 : p.trait === 'leal' ? -0.3 : 0) - (G.civs[p.civ].relation < 0 ? 0.1 : 0), 0.05, 0.9); },
  bribe(p) {
    const ci = p.civ, c = G.civs[ci], cost = this.bribeCost(p), seat = this.seatOf(p);
    if (!c || c.ruler === 'player' || !seat) return { text: 'Do que você está falando?', note: '' };
    if (p.bribed === 'player') return { text: 'Já disse: na hora certa, eu olho para o outro lado.', note: '' };
    if (P.gold < cost) return { text: 'Isso não paga nem o meu silêncio.', note: `Você precisa de ${cost} 🪙.` };
    if (Math.random() < this.bribeChance(p)) {
      P.gold -= cost; p.purse = People.purse(p) + cost; p.bribed = 'player'; People.addAff(p, 5);
      const n = this.bought(ci), tot = this.circlePeople(ci).length;
      this.log(`🤫 Você comprou ${People.full(p)} (${KING_CIRCLE[seat][p.sex === 'f' ? 1 : 0]} de ${CIV_DEFS[ci].short}).`);
      return { text: U.pick(['Ouro fala mais alto que juramento. Conte comigo.', 'Quando chegar a hora, a minha espada fica na bainha.', 'O rei nunca me pagou tão bem.']), note: `🤫 ${n} de ${tot} do círculo do rei comprados.${n === tot ? ' Ninguém mais protege o rei na sala do trono!' : ''}` };
    }
    P.gold -= Math.round(cost / 2); p.purse = People.purse(p) + Math.round(cost / 2); People.addAff(p, -15); // ele fica com o dinheiro
    if (Math.random() < 0.45) { Game.addRelation(ci, -20); this.log(`🚨 ${People.full(p)} contou ao rei de ${CIV_DEFS[ci].short} que você tentou suborná-lo.`); return { text: 'Traição? O rei vai saber disso!', note: `🚨 Recusou e contou ao rei (relação −20, perdeu ${Math.round(cost / 2)} 🪙).` }; }
    return { text: 'Guarde o seu ouro. Eu não vi nada, e você não disse nada.', note: `Recusou (perdeu ${Math.round(cost / 2)} 🪙).` };
  },

  // ---------------------------------------------------------------- golpes de estado
  throneTick() {
    const S = this.S();
    // famílias descontentes tramam nos reinos da IA
    for (const c of G.civs) {
      if (c.ruler !== 'npc' || c.anarchy || S.plots.some(x => x.ci === c.id)) continue;
      const royal = c.rulerId !== null && G.people[c.rulerId] ? G.people[c.rulerId].fam : -1;
      const f = Object.values(Families.F()).find(f => !f.player && f.id !== royal && f.civ === c.id && f.loyalty < 30 && f.wealth >= 350 && Families.adults(f).length >= 2 && Math.random() < 0.03 * (typeof Personas !== 'undefined' ? Personas.plotMul(c.id) : 1));
      if (f) S.plots.push({ ci: c.id, fam: f.id, day: G.day, bought: [], known: false });
    }
    for (const pl of S.plots.slice()) {
      const c = G.civs[pl.ci], f = Families.get(pl.fam);
      if (!c || c.ruler !== 'npc' || c.anarchy || !f || !Families.adults(f).length) { S.plots = S.plots.filter(x => x !== pl); continue; }
      // o boato chega até você (se estiver no reino ou tiver um espião lá)
      const here = World.inb(Math.floor(P.x / TILE), Math.floor(P.y / TILE)) && World.terr[World.idx(Math.floor(P.x / TILE), Math.floor(P.y / TILE))] === pl.ci;
      const spy = typeof Reign !== 'undefined' && Reign.R().spies && Reign.R().spies[pl.ci];
      if (!pl.known && (spy ? 0.6 : here ? 0.25 : 0.04) > Math.random()) { pl.known = true; UI.msg(`🗡️ Boato: a ${Families.name(f)} está comprando o círculo do rei de ${CIV_DEFS[pl.ci].short} para dar um golpe.`, 'gold', true); this.log(`🗡️ A ${Families.name(f)} trama um golpe em ${CIV_DEFS[pl.ci].short}.`); }
      // compra um do círculo por mês
      const left = this.circlePeople(pl.ci).filter(x => !pl.bought.includes(x.p.id) && x.p.bribed !== 'player');
      if (left.length) { const x = left[0]; if (f.wealth >= 80 && Math.random() < 0.5 + f.wealth / 3000 - (x.p.trait === 'leal' ? 0.3 : 0)) { f.wealth -= 80; pl.bought.push(x.p.id); } continue; }
      this.npcCoup(pl, f);
      S.plots = S.plots.filter(x => x !== pl);
    }
    // contra você: famílias do seu reino com pouca lealdade
    if (typeof Reign !== 'undefined' && Reign.isKing()) {
      const R = Reign.R(), m = Reign.main();
      if (m && !R.plots.some(x => x.kind === 'usurp')) {
        const f = Object.values(Families.F()).find(f => !f.player && f.civ === m.id && f.loyalty < 25 && f.wealth >= 300 && Families.adults(f).length >= 2 && Math.random() < 0.1);
        const h = f && Families.head(f);
        if (h) { Reign.newPlot(h.id, 'usurp'); const pl = R.plots.find(x => x.pid === h.id); if (pl) pl.fam = f.id; }
      }
      for (const pl of R.plots.filter(x => x.kind === 'usurp')) for (const k in R.council) { const mb = Reign.member(k); if (mb && !mb.boughtBy && Math.random() < 0.5) { mb.boughtBy = pl.fam; mb.loyal = Math.max(0, (mb.loyal || 50) - 25); break; } }
    }
  },
  npcCoup(pl, f) {
    const c = G.civs[pl.ci], king = c.rulerId !== null ? People.get(c.rulerId) : null, h0 = Families.head(f), head = h0 && h0 !== king ? h0 : Families.adults(f).find(p => p !== king) || null;
    const share = pl.bought.length / Math.max(1, this.circlePeople(pl.ci).length);
    const ok = head && Math.random() < U.clamp(0.4 + share * 0.45 - c.garrison / 80 + (typeof Personas !== 'undefined' ? Personas.coupMod(c.id) : 0) + (typeof Mercs !== 'undefined' ? Mercs.coupBonus(pl.fam) : 0), 0.1, 0.9);
    const old = c.rulerName;
    if (ok) {
      if (king && king.alive) People.die(king, 'assassinado num golpe de estado');
      for (const p of G.people) if (p.alive && p.rank === 'ruler' && p.civ === pl.ci && p !== head) p.rank = 'knight';
      Succession.seat(c, head, 'ruler'); f.loyalty = 90; c.happy = Math.max(0, c.happy - 10);
      Heraldry.apply();
      for (const id of pl.bought) { const p = G.people[id]; if (p) delete p.bribed; }
      UI.msg(`🗡️👑 Golpe em ${CIV_DEFS[pl.ci].short}! A ${Families.name(f)} comprou o conselho e o general: ${old} foi morto e ${c.rulerName} tomou o trono.`, 'gold', true);
      Diplo.chronicle(`🗡️ Golpe de estado em ${CIV_DEFS[pl.ci].name}: a ${Families.name(f)} matou ${old} e ${c.rulerName} subiu ao trono.`, true);
    } else {
      if (head) People.die(head, 'executado por traição');
      f.loyalty = 40; f.wealth = Math.round(f.wealth * 0.3);
      if (pl.known || Math.random() < 0.3) UI.msg(`⛓️ O golpe da ${Families.name(f)} em ${CIV_DEFS[pl.ci].short} fracassou: o chefe da família foi executado.`, '', true);
      Diplo.chronicle(`⛓️ ${old} esmagou o golpe da ${Families.name(f)} em ${CIV_DEFS[pl.ci].name}.`, true);
    }
    this.log(ok ? `👑 A ${Families.name(f)} tomou o trono de ${CIV_DEFS[pl.ci].short}.` : `⛓️ O golpe da ${Families.name(f)} em ${CIV_DEFS[pl.ci].short} fracassou.`);
  },
  // o golpe contra você: soldados comprados atacam onde você estiver; a guarda não ajuda
  coupStrike(pl) {
    const m = Reign.main(), p = G.people[pl.pid], f = Families.get(pl.fam);
    if (!m || !p || !p.alive) return;
    if (G.place || G.dungeon || War.isBattle() || G.siege) { G.coupWait = pl; return; }
    const R = Reign.R(), boughtN = Object.keys(R.council).filter(k => { const mb = Reign.member(k); return mb && mb.boughtBy === pl.fam; }).length;
    const n = 4 + boughtN + Math.min(4, Math.floor(((f && f.wealth) || 0) / 400));
    G.coup = { ci: m.id, pid: p.id, fam: pl.fam, t: 150 };
    const a0 = Math.random() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const a = a0 + (k - n / 2) * 0.35, s = freeSpotNear(P.x + Math.cos(a) * 7 * TILE, P.y + Math.sin(a) * 6 * TILE, 3 * TILE);
      const g = Game.spawn('guard', s.x, s.y, { civ: m.id, leash: 60, tag: 'coup' }); g.angry = true; g.target = P; g.aggroOv = 40; g.maxHp = g.hp = Math.round(g.maxHp * 1.3);
    }
    UI.banner('🗡️ Golpe de estado!');
    UI.msg(`🗡️ ${People.full(p)}${f ? ` e a ${Families.name(f)}` : ''} compraram o seu conselho: ${n} soldados traidores atacam você e a guarda não vem ajudar! Lute pela sua vida e pela coroa.`, 'bad', true);
    Reign.chron && Reign.chron(`🗡️ Golpe de estado de ${People.full(p)}.`);
  },
  coupUpdate(dt) {
    if (G.coupWait && !G.place && !G.dungeon && !War.isBattle() && !G.siege && G.state === 'play') { const pl = G.coupWait; G.coupWait = null; this.coupStrike(pl); }
    const C = G.coup; if (!C) return;
    C.t -= dt;
    const alive = G.ents.filter(e => !e.dead && e.tag === 'coup');
    if (alive.length && C.t > 0) return;
    for (const e of alive) e.dead = true;
    G.coup = null;
    const p = G.people[C.pid], f = Families.get(C.fam), c = G.civs[C.ci];
    if (!c || c.ruler !== 'player') return;
    if (f) { f.loyalty = 55; f.wealth = Math.round(f.wealth * 0.2); for (const q of Families.adults(f)) { q.home = { type: 'wild' }; People.addAff(q, -40); } }
    if (p && p.alive) p.jail = G.day + 12;
    for (const k in Reign.R().council) { const mb = Reign.member(k); if (mb && mb.boughtBy === C.fam) { delete mb.boughtBy; mb.loyal = 20; } }
    UI.banner('⚔️ O golpe foi esmagado!');
    UI.msg(`⚔️ Você venceu os traidores! ${p ? People.full(p) : 'O chefe do golpe'} foi preso e a ${f ? Families.name(f) : 'família'} foi expulsa do reino. Os conselheiros que se venderam estão de olho baixo.`, 'gold', true);
    Court.addFame(15); this.log(`⚔️ Você esmagou o golpe da ${f ? Families.name(f) : 'família'}.`);
    Diplo.chronicle(`⚔️ ${G.name} ${G.surname || ''} esmagou um golpe de estado em ${CIV_DEFS[C.ci].name}.`, true);
  },

  // ---------------------------------------------------------------- ações do jogador nas vilas
  donate(vi, n) {
    const v = World.villages[vi]; if (!v || P.gold < n) { UI.msg(`Você precisa de ${n} 🪙.`, 'bad'); return; }
    P.gold -= n; v.prosper = (v.prosper || 0) + n / 200;
    const m0 = UI.msg; UI.msg = () => {}; try { for (const r of People.residents(vi)) People.addAff(r, 1); } finally { UI.msg = m0; }
    this.addDeed(vi, 'player', n / 25, `Você doou ${n} 🪙 para as obras de ${v.name}`); Sound.play('coin');
  },
  party(vi) {
    const v = World.villages[vi]; if (!v) return; if (P.gold < 150) { UI.msg('A festa custa 150 🪙.', 'bad'); return; }
    if (v.partyDay === G.day) { UI.msg('Já houve festa este mês.', 'bad'); return; }
    P.gold -= 150; v.partyDay = G.day;
    const m0 = UI.msg; UI.msg = () => {}; try { for (const r of People.residents(vi)) People.addAff(r, 3); } finally { UI.msg = m0; }
    this.addDeed(vi, 'player', 5, `🎉 Você deu uma festa em ${v.name}: música, comida e vinho para todos`);
  },

  // ---------------------------------------------------------------- a página de política
  villageCard(vi) {
    const v = World.villages[vi], E = Society.E(vi), C = Society.candidates(vi), res = Society.votes(vi), tot = Object.values(res).reduce((a, n) => a + n, 0) || 1;
    const chief = v.lord === 'player' ? 'Você' : v.chief !== undefined && G.people[v.chief] ? People.full(G.people[v.chief]) : '—';
    const rows = [...(E.me || v.lord === 'player' ? ['player'] : []), ...C.map(p => p.id)].map(who => {
      const sc = this.score(vi, who), nm = who === 'player' ? 'Você' : People.full(G.people[who]), pct = Math.round((res[who] || 0) / tot * 100);
      return `<div class="pol-c ${who === 'player' ? 'me' : ''}"><b>${UI.esc(nm)}</b><span class="pol-sc"><i title="Feitos pela vila">🏗️ ${sc.d}</i><i title="Relacionamento com os moradores">💞 ${sc.r}</i><i title="Fama">⭐ ${sc.f}</i></span>
        <span class="pol-bar"><i style="width:${pct}%"></i></span><small>${pct}% dos votos${who !== 'player' && E.support === who ? ' · você apoia' : ''}</small>
        ${who !== 'player' && E.support !== who ? `<button data-act="pol" data-op="support" data-v="${vi}" data-p="${who}">Apoiar</button>` : ''}</div>`;
    }).join('');
    const running = E.me || v.lord === 'player';
    const tie = E.tie ? `<div class="pol-tie"><b>⚖️ Empate: ${E.tie.by === 'rei' ? 'como rei' : 'como governador anterior'}, você decide quem governa</b><small>Se não decidir até ${Calendar.short(E.tie.day + 1)}, o conselho da vila escolhe.</small>
      <div class="act-row">${E.tie.ids.map(k => `<button class="primary" data-act="pol" data-op="tie" data-v="${vi}" data-p="${k}">${k === 'player' ? 'Eu mesmo' : UI.esc(People.full(G.people[+k]))} (${E.tie.res[k]} votos)</button>`).join('')}</div></div>` : '';
    return `<div class="card pol-v">${tie}<div class="sec">🏘️ ${UI.esc(v.name)} <span>${v.free ? 'vila livre' : CIV_DEFS[v.civ].short} · eleição em ${Calendar.short(E.next)}</span></div>
      <p class="dt-desc">Governador: <b>${UI.esc(chief)}</b>${v.lord === 'player' ? ' (você concorre à reeleição)' : ''} · mandato de ${POL_TERM} meses · anciãos: ${Society.elders(vi).map(p => UI.esc(p.name)).join(', ') || '—'}</p>
      <div class="pol-cands">${rows || `<p class="muted">Ninguém se inscreveu ainda (as inscrições abrem em ${Calendar.short(Math.max(G.day, E.next - 3))}).</p>`}</div>
      <div class="act-row">${!running ? `<button class="primary" data-act="pol" data-op="run" data-v="${vi}" ${P.gold >= 50 ? '' : 'disabled'}>🗳️ Candidatar-se (50 🪙)</button>` : `<button data-act="pol" data-op="rally" data-v="${vi}" ${P.gold >= 40 ? '' : 'disabled'}>📣 Comício (40 🪙)</button>`}
        <button data-act="pol" data-op="donate" data-v="${vi}" ${P.gold >= 100 ? '' : 'disabled'}>🏗️ Doar 100 🪙 às obras</button><button data-act="pol" data-op="party" data-v="${vi}" ${P.gold >= 150 && v.partyDay !== G.day ? '' : 'disabled'}>🎉 Festa (150 🪙)</button></div></div>`;
  },
  page() {
    const S = this.S(), here = World.villages.map((v, vi) => ({ v, vi, d: U.dist(P.x / TILE, P.y / TILE, v.x, v.y) })).filter(x => x.v && !x.v.ruin || x.v.lord === 'player');
    const show = here.filter(x => Society.E(x.vi).tie).concat(here.filter(x => !Society.E(x.vi).tie && (x.v.lord === 'player' || Society.E(x.vi).me))).concat(here.filter(x => x.v.lord !== 'player' && !Society.E(x.vi).me && !Society.E(x.vi).tie).sort((a, b) => a.d - b.d).slice(0, 4));
    let h = `<div class="card"><div class="sec">🗳️ Como funcionam as eleições</div><p class="dt-desc">O governador de cada vila é eleito pelo povo para um mandato de ${POL_TERM} meses (${POL_TERM} anos de vida). Pesa o que cada um fez pela vila (🏗️ obras, doações, festas, investimentos e bandidos derrotados por perto), o relacionamento com os moradores (💞) e a fama (⭐). Os anciãos votam com peso 3. Só concorre quem se inscreve (nos 3 meses antes da eleição) e candidato não vota. Quem governa também precisa se reeleger.</p></div>`;
    h += show.map(x => this.villageCard(x.vi)).join('');
    // tronos
    const kings = G.civs.filter(c => c.ruler === 'npc' && !c.anarchy).map(c => {
      const L = this.circlePeople(c.id), b = this.bought(c.id), plot = S.plots.find(x => x.ci === c.id && x.known);
      return `<div class="crow"><span class="ri">${Heraldry.armsSvg(c.id, 18)}</span><span><b>${UI.esc(c.rulerName)}</b><small>${CIV_DEFS[c.id].name} · círculo do rei: ${L.map(x => `${KING_CIRCLE[x.seat][2]} ${UI.esc(x.p.name)}${x.p.bribed === 'player' ? ' ✓' : ''}`).join(' · ')}</small>
        <small>${b ? `🤫 Você comprou ${b} de ${L.length}${b === L.length ? ' — <b class="ok">ninguém protege o rei na sala do trono</b>' : ''}` : 'Para tomar o trono: compre todo o círculo (fale com eles no castelo) ou mate o rei na guerra ou na sala do trono.'}${plot ? ` · 🗡️ <b class="bad">A ${UI.esc(Families.name(Families.get(plot.fam)) || '')} trama um golpe</b>` : ''}</small></span></div>`;
    }).join('');
    h += `<div class="card"><div class="sec">👑 Os tronos <span>a coroa passa de pai para filho, a não ser que alguém a tome</span></div>${kings}</div>`;
    if (typeof Reign !== 'undefined' && Reign.isKing()) {
      const m = Reign.main(), fams = Object.values(Families.F()).filter(f => !f.player && f.civ === m.id && Families.adults(f).length).sort((a, b) => a.loyalty - b.loyalty).slice(0, 4);
      const R = Reign.R(), bought = Object.keys(R.council).map(k => Reign.member(k)).filter(mb => mb && mb.boughtBy !== undefined && R.plots.some(x => x.found && x.fam === mb.boughtBy));
      h += `<div class="card"><div class="sec">🛡️ O seu trono <span>${CIV_DEFS[m.id].short}</span></div><p class="dt-desc">Famílias com pouca lealdade e dinheiro tramam: compram o seu conselho e mandam soldados traidores atacar você. O mestre espião descobre os complôs (Reinado → Espionagem); os não descobertos atacam em 2 meses.</p>
        ${fams.map(f => `<div class="crow"><span class="ri">🏛️</span><span><b>${UI.esc(Families.name(f))}</b><small>lealdade <b class="${f.loyalty < 25 ? 'bad' : f.loyalty > 60 ? 'ok' : ''}">${Math.round(f.loyalty)}</b> · riqueza ${Math.round(f.wealth)} 🪙</small></span></div>`).join('')}
        ${bought.length ? `<p class="bad">🤫 Conselheiros comprados pelos golpistas: ${bought.map(mb => UI.esc(mb.name)).join(', ')}.</p>` : ''}</div>`;
    }
    if (S.log.length) h += `<div class="card"><div class="sec">📒 Notícias da política</div>${S.log.slice(0, 8).map(l => `<div class="bank-log"><small>${Calendar.short(l.day)}</small> ${UI.esc(l.t)}</div>`).join('')}</div>`;
    return h;
  },
};

// ------------------------------------------------------------------ ganchos
{
  // eleições: mandato de 5 meses, voto por feitos, relacionamento e fama; o governador também se reelege
  // só concorre quem se inscreveu (o governador costuma tentar a reeleição); sem ninguém, o conselho indica alguém
  Society.candidates = function (vi) {
    const E = this.E(vi), ok = p => p && p.alive && p.home.type === 'village' && p.home.idx === vi && !p.capanga && p.spouse !== 'player';
    E.reg = (E.reg || []).filter(id => ok(G.people[id]));
    E.cand = E.reg.slice(); return E.reg.map(id => G.people[id]);
  };
  Society.votes = function (vi) {
    const v = World.villages[vi], E = this.E(vi), C = this.candidates(vi), elders = this.elders(vi), res = {}, me = E.me || v.lord === 'player';
    for (const c of C) res[c.id] = 0; if (me) res.player = 0;
    const base = {}; for (const c of C) base[c.id] = Politics.deeds(vi, c.id) * 0.6 + Politics.fame(c.id) * 0.4; if (me) base.player = Politics.deeds(vi, 'player') * 0.6 + Politics.fame('player') * 0.4 + E.push;
    const cands = new Set(C.map(c => c.id));
    for (const r of People.residents(vi).filter(p => p.age >= 16 && !cands.has(p.id))) { // candidato não vota (nem em si mesmo)
      const w = elders.includes(r) ? 3 : 1; let best = null, bs = -1e9;
      for (const who of Object.keys(res)) {
        const s = base[who] + Politics.likes(r, who === 'player' ? 'player' : +who) * 0.8 + (who !== 'player' && E.support === +who ? (r.aff || 0) * 0.25 : 0) + U.hash2(r.id, who === 'player' ? 999 : +who, G.day) * 18;
        if (s > bs) { bs = s; best = who; }
      }
      if (best !== null) res[best] += w;
    }
    return res;
  };
  Society.election = function (vi) {
    const v = World.villages[vi], E = this.E(vi); if (!v) return;
    E.next = G.day + POL_TERM;
    if (v.ruin >= 3 && !People.residents(vi).length) return;
    const wasMe = v.lord === 'player'; if (wasMe) E.me = true;
    Politics.registerTick(vi, true);
    const res = this.votes(vi), ids = Object.keys(res); if (!ids.length) { E.me = false; return; }
    ids.sort((a, b) => res[b] - res[a]);
    const tied = ids.filter(k => res[k] === res[ids[0]]);
    let win = ids[0], how = '';
    if (tied.length > 1) {
      const t = Politics.tieBreak(vi, tied);
      if (t.pending) { E.tie = { ids: tied, res, day: G.day, by: t.by }; UI.banner('⚖️ Empate na eleição'); UI.msg(`⚖️ Empate na eleição de ${v.name} (${tied.map(k => Politics.whoName(k)).join(' × ')}): ${t.by === 'rei' ? 'como rei' : 'como governador anterior'}, você decide quem governa (Sociedade → Política).`, 'gold', true); return; }
      win = t.win; how = t.how;
    }
    this.finishElection(vi, win, res, how);
  };
  // fecha a eleição: quem venceu assume (ou você continua, ou perde o cargo)
  Society.finishElection = function (vi, win, res, how) {
    const v = World.villages[vi], E = this.E(vi), wasMe = v.lord === 'player', ids = Object.keys(res);
    const tot = ids.reduce((a, k) => a + res[k], 0);
    delete E.tie;
    if (how) { Politics.log(`⚖️ Empate em ${v.name}: ${how}.`); Rumors.atV(vi, `A eleição de ${v.name} empatou: ${how}.`); }
    const known = E.me || E.support !== null || U.dist(P.x / TILE, P.y / TILE, v.x, v.y) < 40 || (G.civs[v.civ] && G.civs[v.civ].ruler === 'player');
    if (win === 'player') {
      if (wasMe) { UI.msg(`🗳️ Reeleito em ${v.name} com ${res.player} de ${tot} votos${how ? ` (${how})` : ''}! Mais ${POL_TERM} meses de mandato.`, 'gold', true); Progress.diary(`🗳️ Reeleito governador de ${v.name}.`); }
      else Chiefdom.grant(vi, `🗳️ O povo de ${v.name} te elegeu com ${res.player} de ${tot} votos!`);
      this.rep('povo', 4); Politics.log(`🗳️ Você ${wasMe ? 'foi reeleito' : 'venceu a eleição'} em ${v.name}.`);
    } else {
      const p = G.people[+win];
      if (wasMe) { v.lord = undefined; UI.banner(`🗳️ Você perdeu ${v.name}`); UI.msg(`🗳️ ${p.name} venceu a eleição em ${v.name} (${res[win]} de ${tot} votos; você teve ${res.player}). Você deixou de ser governador.`, 'bad', true); Progress.diary(`🗳️ Perdeu a eleição em ${v.name}.`); Diplo.chronicle(`🗳️ ${People.full(p)} venceu ${G.name} ${G.surname || ''} na eleição de ${v.name}.`, true); }
      v.chief = p.id; v.elected = p.id; v.lordFam = p.fam;
      if (E.support === p.id) { People.addAff(p, 25); UI.msg(`🗳️ ${p.name}, que você apoiou, venceu a eleição de ${v.name}: agora é seu aliado (+25 de amizade).`, 'gold', true); }
      else if (known && !wasMe) UI.msg(`🗳️ ${p.name} venceu a eleição de ${v.name} (${res[win]} de ${tot} votos${how ? `; ${how}` : ''}).${E.me ? ` Você teve ${res.player}.` : ''}`, E.me ? 'bad' : '');
      Rumors.atV(vi, `${p.name} foi eleito governador de ${v.name} por ${POL_TERM} anos.`); Politics.log(`🗳️ ${People.full(p)} eleito em ${v.name}.`);
      Families.refresh();
    }
    E.me = false; E.push = 0; E.support = null; E.reg = [];
  };
  // o eleito continua governando (as famílias não tiram o cargo dele); se morrer ou se mudar, há eleição no mês seguinte
  const fr0 = Families.refresh.bind(Families);
  Families.refresh = function () {
    fr0();
    World.villages.forEach((v, vi) => {
      if (v.lord === 'player' || v.elected === undefined) return;
      const p = G.people[v.elected];
      if (p && p.alive && p.home.type === 'village' && p.home.idx === vi) v.chief = p.id;
      else { delete v.elected; const E = Society.E(vi); E.next = Math.min(E.next, G.day + 1); }
    });
  };
  // ações de campanha
  Society.campaign = function (vi) {
    const E = this.E(vi), v = World.villages[vi]; if (!E.me && v.lord !== 'player') return; if (P.gold < 40) { UI.msg('Um comício custa 40 🪙.', 'bad'); return; }
    P.gold -= 40; E.push += 4; this.cascading = true; const m0 = UI.msg; UI.msg = () => {}; try { for (const r of People.residents(vi)) People.addAff(r, 2); } finally { UI.msg = m0; this.cascading = false; }
    UI.msg(`📣 Comício em ${v.name}: o povo gostou (+2 de amizade com todos os moradores).`, 'gold');
  };
  // os feitos do jogador: obras na vila, investimentos e bandidos derrotados por perto
  const ac0 = Urban.addCivic.bind(Urban);
  Urban.addCivic = function (type, tx, ty, vi, quiet) {
    const s = ac0(type, tx, ty, vi, quiet);
    if (!quiet && this.mode && CIVIC[type]) Politics.addDeed(vi, 'player', U.clamp(Order.costValue(CIVIC[type].cost) / 15, 3, 20), `🏗️ Você ergueu ${CIVIC[type].name} em ${World.villages[vi] ? World.villages[vi].name : ''}`);
    return s;
  };
  const iv0 = Fin.investVillage.bind(Fin);
  Fin.investVillage = function (vi, n) { const g0 = P.gold; iv0(vi, n); if (P.gold < g0) Politics.addDeed(vi, 'player', (g0 - P.gold) / 40); };
  const kl0 = Game.kill.bind(Game);
  Game.kill = function (e, src) {
    const r = kl0(e, src);
    if (e && e.kind === 'bandit' && (!src || src === P || src.kind === 'ally')) { const vi = World.villages.findIndex(v => U.dist(v.x, v.y, e.x / TILE, e.y / TILE) < 20); if (vi >= 0) Politics.addDeed(vi, 'player', 1.5); }
    return r;
  };
  // a página de política fica na aba Política da Sociedade
  const sh0 = Society.show.bind(Society);
  Society.show = function (tab) {
    const t = tab || UI.sel.socTab || 'rep';
    if (t !== 'politics') return sh0(tab);
    let a = null; const op = UI.open; UI.open = (...x) => { a = x; }; try { sh0('politics'); } finally { UI.open = op; }
    if (!a) return;
    const b = a[1], i = b.indexOf('<div class="tabs">'), j = i >= 0 ? b.indexOf('</div>', i) + 6 : 0;
    return UI.open(a[0], b.slice(0, j) + Politics.page(), a[2], a[3], a[4]);
  };
  // o círculo do rei: suborno pela conversa (só quem é do círculo de um rei da IA)
  const as0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    as0(p, acts);
    const seat = Politics.seatOf(p);
    if (seat && G.civs[p.civ] && G.civs[p.civ].ruler === 'npc' && p.bribed !== 'player') acts.push(['pBribe', `🤫 Subornar (${Politics.bribeCost(p)} 🪙 · chance ${Math.round(Politics.bribeChance(p) * 100)}%)`]);
  };
  const ta0 = Lifesim.talkAct.bind(Lifesim);
  Lifesim.talkAct = function (p, op) { if (op === 'pBribe') return Politics.bribe(p); return ta0(p, op); };
  const ch0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) {
    const out = ch0(p), seat = Politics.seatOf(p);
    if (seat) out.push(`<span class="tag" style="background:#5a3a1a">${KING_CIRCLE[seat][2]} ${KING_CIRCLE[seat][p.sex === 'f' ? 1 : 0]} de ${CIV_DEFS[p.civ].short}</span>`);
    if (p.bribed === 'player') out.push('<span class="tag" style="background:#3a2a5a">🤫 Comprado por você</span>');
    return out;
  };
  // o círculo do rei mora no castelo e aparece na sala do trono; comprado, ninguém protege o rei
  const pp0 = Places.people.bind(Places);
  Places.people = function (src, d, L) {
    if (d.lay === 'throne' && G.civs[src.owner] && G.civs[src.owner].ruler === 'npc') Politics.circle(src.owner);
    pp0(src, d, L);
    if (d.lay !== 'throne' || !Politics.ready(src.owner)) return;
    for (const e of G.ents) if (!e.dead && e.royalGuard) e.dead = true;
    const king = G.ents.find(e => !e.dead && e.npc && e.npc.rank === 'ruler' && e.placeNpc); if (king) { king.maxHp = king.hp = 260; king.dmg = 16; }
    UI.msg('🤫 O círculo do rei é seu: os guardas saíram da sala e ninguém vai proteger o rei.', 'gold', true);
  };
  const dr0 = Game.defendRoyal.bind(Game);
  Game.defendRoyal = function (ci, p) { if (Politics.ready(ci)) return; return dr0(ci, p); };
  // castelo dos outros: o círculo do rei
  const op0 = UI.open.bind(UI);
  UI.open = function (title, body, fn, args, sub) {
    if (fn === 'showCastle' && args && G.civs[args[0]] && G.civs[args[0]].ruler === 'npc') {
      const ci = args[0], L = Politics.circlePeople(ci), b = Politics.bought(ci);
      body += `<div class="card"><div class="sec">🤫 O círculo do rei <span>${b}/${L.length} comprados</span></div>${L.map(x => `<div class="crow"><span class="ri">${KING_CIRCLE[x.seat][2]}</span><span><b>${UI.esc(People.full(x.p))}</b><small>${KING_CIRCLE[x.seat][x.p.sex === 'f' ? 1 : 0]}${x.p.bribed === 'player' ? ' · <b class="ok">comprado</b>' : ` · suborno ${Politics.bribeCost(x.p)} 🪙 · chance ${Math.round(Politics.bribeChance(x.p) * 100)}%`}</small></span><span class="act-row"><button data-act="tk" data-op="open" data-id="${x.p.id}">💬 Conversar</button></span></div>`).join('')}
        <p class="dt-desc">Compre todos (o conselho e o general) e, na sala do trono, ninguém vai proteger o rei. Se alguém recusar, pode contar ao rei.</p></div>`;
    }
    return op0(title, body, fn, args, sub);
  };
  // golpe contra você: o complô de uma família vira um ataque
  Reign.PLOT_TXT.usurp = 'compra o conselho e o general para tomar o trono';
  const ps0 = Reign.plotStrike.bind(Reign);
  Reign.plotStrike = function (pl) { if (pl.kind === 'usurp') return Politics.coupStrike(pl); return ps0(pl); };
  const rp0 = Reign.resolvePlot.bind(Reign);
  Reign.resolvePlot = function (i, how) {
    const pl = this.R().plots[i];
    if (pl && pl.kind === 'usurp') { for (const k in this.R().council) { const mb = this.member(k); if (mb && mb.boughtBy === pl.fam) delete mb.boughtBy; } const f = Families.get(pl.fam); if (f) f.loyalty = how === 'pardon' ? 55 : 35; }
    return rp0(i, how);
  };
  // morreu no golpe: a coroa vai para a família golpista (o herdeiro fica com os outros reinos)
  const pd0 = Game.playerDie.bind(Game);
  Game.playerDie = function (cause) {
    const C = G.coup;
    if (C && !P.dead) {
      const c = G.civs[C.ci], p = G.people[C.pid], f = Families.get(C.fam);
      G.coup = null; for (const e of G.ents) if (e.tag === 'coup') e.dead = true;
      if (c && c.ruler === 'player' && p && p.alive) {
        Succession.seat(c, p, 'ruler'); c.relation = -50; c.atWar = false; if (f) f.loyalty = 95;
        if (G.mainRealm === C.ci) { const o = G.civs.find(x => x.ruler === 'player'); G.mainRealm = o ? o.id : null; }
        Heraldry.apply();
        UI.msg(`🗡️👑 Os golpistas venceram: ${c.rulerName}${f ? ` (${Families.name(f)})` : ''} tomou o trono de ${CIV_DEFS[C.ci].short}.`, 'bad', true);
        Diplo.chronicle(`🗡️ ${c.rulerName} derrubou ${G.name} ${G.surname || ''} num golpe e tomou ${CIV_DEFS[C.ci].name}.`, true);
        Politics.log(`🗡️ Você perdeu ${CIV_DEFS[C.ci].short} num golpe de estado.`);
      }
      return pd0(cause || 'assassinado num golpe de estado');
    }
    return pd0(cause);
  };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); Politics.monthTick(); };
  const cu0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { cu0(dt); Politics.coupUpdate(dt); };
  const a0 = UI.act.bind(UI);
  UI.act = function (a, d) {
    if (a === 'pol') {
      const vi = +d.v;
      if (d.op === 'run') Society.run(vi);
      if (d.op === 'rally') Society.campaign(vi);
      if (d.op === 'donate') Politics.donate(vi, 100);
      if (d.op === 'party') Politics.party(vi);
      if (d.op === 'support') Society.support(vi, +d.p);
      if (d.op === 'tie') Politics.decide(vi, d.p);
      Society.show('politics'); return;
    }
    return a0(a, d);
  };
}
