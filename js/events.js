'use strict';
// Eventos no mundo, perto do jogador: raramente, um dragão fora das cavernas. Um evento de cada vez; eles não ficam no jogo salvo.


const WorldEvents = {
  t: 150, // segundos reais até o primeiro evento
  cur() { return G.wevent || null; },
  reset() {
    G.wevent = null; this.t = 150;
    for (const p of G.people || []) if (p.lost) p.lost = false;
  },
  update(dt) {
    if (G.dungeon) return;
    const ev = G.wevent;
    if (ev) { this.tick(ev, dt); return; }
    this.t -= dt;
    if (this.t > 0) return;
    this.t = U.rnd(240, 420);
    if (Math.random() < 0.89 || G.day < 4) return; // o dragão é raro: quase sempre nada acontece
    this.start('dragon');
  },
  // lugar livre e aberto a uma certa distância do jogador (em blocos)
  spotAround(r0, r1) {
    for (let k = 0; k < 120; k++) {
      const a = Math.random() * Math.PI * 2, r = U.rnd(r0, r1);
      const x = Math.floor(P.x / TILE + Math.cos(a) * r), y = Math.floor(P.y / TILE + Math.sin(a) * r);
      if (!World.areaOk(x - 1, y - 1, 3, 3) || !World.areaFree(x - 1, y - 1, 3, 3)) continue;
      const t = World.tile(x, y);
      if (World.obj[World.idx(x, y)] || t === T.ROAD || t === T.BRIDGE) continue;
      if (World.villages.some(v => U.dist(v.x, v.y, x, y) < 14) || World.capitals.some(c => U.dist(c.x, c.y, x, y) < 14) || World.camps.some(c => U.dist(c.x, c.y, x, y) < 10)) continue;
      return { x, y };
    }
    return null;
  },
  ping(x, y, name) { G.ping = { x: x + 0.5, y: y + 0.5, name, wev: true }; },
  start(kind) {
    const until = G.realTime + 600;
    if (kind === 'dragon') {
      const s = this.spotAround(24, 34);
      if (!s) return false;
      G.wevent = { kind, x: s.x, y: s.y, until, hp: null };
      this.ping(s.x, s.y, 'Dragão avistado');
      UI.banner('🐉 Um dragão desceu das montanhas!');
      UI.msg('🐉 Um Dragão Ancestral foi visto aqui perto (marcado no mapa). Quem o derrotar fica rico e famoso... se sobreviver.', 'bad');
      Diplo.chronicle('🐉 Um Dragão Ancestral foi avistado fora das cavernas.');
    } else return false; // só existe o dragão
    return true;
  },
  near(x, y, r) { return U.dist(P.x / TILE, P.y / TILE, x, y) < r; },
  tick(ev, dt) {
    if (G.realTime > ev.until) { this.end(ev, false); return; }
    if (ev.kind === 'dragon') {
      let e = G.ents.find(x => x.tag === 'wev' && x.kind === 'dragon' && !x.dead);
      if (!e && this.near(ev.x, ev.y, 36)) {
        e = Game.spawn('dragon', (ev.x + 0.5) * TILE, (ev.y + 0.8) * TILE, { leash: 18, tag: 'wev', mult: 0.7 });
        if (ev.hp) e.hp = ev.hp;
      }
      if (e) { ev.hp = e.hp; ev.x = e.x / TILE; ev.y = e.y / TILE; }
    }
  },
  onKill(e) {
    const ev = G.wevent;
    if (!ev) return;
    if (ev.kind === 'dragon' && e.kind === 'dragon') this.end(ev, true);
  },
  end(ev, ok, info) {
    if (!ev) return;
    G.wevent = null;
    if (G.ping && G.ping.wev) G.ping = null;
    if (ev.kind === 'dragon') {
      if (ok) {
        const gold = 400;
        P.gold += gold; Court.addFame(15); Game.gainXp(150);
        UI.banner('🐉 O dragão caiu!');
        UI.msg(`Você derrotou o Dragão Ancestral! +${gold} 🪙, escamas de dragão e muita fama.`, 'gold', true);
        Diplo.chronicle(`🐉 ${G.name} ${G.surname} derrotou um Dragão Ancestral fora das cavernas!`, true);
        Progress.diary('🐉 Derrotou um dragão fora das cavernas.');
      } else {
        for (const e of G.ents) if (e.tag === 'wev') e.dead = true;
        UI.msg('🐉 O dragão abriu as asas e voou para longe.');
      }
    }
  },
};

// ====================================================================== rotina dos moradores
// De dia trabalham. Ao entardecer muitos vão à taverna (o padre vai à capela). À noite cada um entra na
// própria casa e dorme: a casa acende a luz. Mendigos e quem não tem casa ficam pela praça.
const Routine = {
  occ: new Set(),
  phase() { const h = Game.hour(); return h >= 21 || h < 6 ? 'night' : h >= 17 ? 'evening' : 'day'; },
  door(s) { return { x: (s.x + s.w / 2) * TILE, y: (s.y + s.h + 0.7) * TILE }; },
  // anda até um lugar; se ficar 4 s sem avançar (preso atrás de casas), contorna e aparece perto do destino
  go(e, tx, ty, sp, dt) {
    const d = U.dist(e.x, e.y, tx, ty);
    if (!e.goT || e.goT.x !== tx || e.goT.y !== ty) e.goT = { x: tx, y: ty, d, t: 0 };
    const g = e.goT;
    g.t += dt;
    if (g.t > 4) { if (g.d - d < 24) { const s = freeSpotNear(tx, ty, 40); e.x = s.x; e.y = s.y; } g.d = U.dist(e.x, e.y, tx, ty); g.t = 0; }
    e.moveToward(tx, ty, sp, dt);
  },
  // ao aparecer à noite, a pessoa já está dormindo em casa
  placed(e) {
    if (this.phase() === 'night' && e.house && !G.dungeon) { const d = this.door(e.house); e.x = d.x; e.y = d.y; e.sleeping = true; }
  },
  // quem fica lá dentro: o dono da loja de dia (o da taverna também à noitinha); os fregueses da taverna à noitinha
  staysIn(e, s, ph) {
    const own = e.npc.shop === s.okey;
    if (own) return ph === 'day' || (s.type === 'tavern' && ph === 'evening');
    return s.type === 'tavern' && ph === 'evening';
  },
  entersWork(e) { const s = World.structs[e.workS]; return !!s && !s.removed && Shops.isShop(s) && e.npc.shop === s.okey; },
  goesOut(e) { return e.npc.rank === 'innkeeper' || (e.npc.age >= 16 && U.hash2(e.npc.id, 3, 77) < 0.55); },
  eveningTarget(e) {
    const v = World.villages[e.vi];
    if (!v) return null;
    if (e.npc.rank === 'priest' && v.chapel && !v.chapel.removed) return this.door(v.chapel);
    if (this.goesOut(e) && v.tavern && !v.tavern.removed) return Object.assign(this.door(v.tavern), { s: v.tavern });
    return e.house && !e.house.removed ? this.door(e.house) : null;
  },
  update(e, dt, sp) {
    if (G.dungeon || !e.npc) return false;
    // partindo em viagem: anda até a saída da vila e some na estrada
    if (e.leaving) {
      this.go(e, e.leaving.x, e.leaving.y, sp * 0.7, dt);
      if (U.dist(e.x, e.y, e.leaving.x, e.leaving.y) < 20 || U.dist(e.x, e.y, P.x, P.y) > 26 * TILE) { e.dead = true; G.spawned.delete(e.npc.id); }
      return true;
    }
    if (e.vi === undefined) return false;
    const ph = this.phase();
    // dentro da loja ou da taverna: some do mapa (e aparece lá dentro quando você entra)
    if (e.inside !== undefined && e.inside !== null) {
      const s = World.structs[e.inside];
      if (s && !s.removed && this.staysIn(e, s, ph)) return true;
      const d = s ? this.door(s) : { x: e.x, y: e.y };
      e.inside = null; e.sleeping = false; e.x = d.x; e.y = d.y + 6;
      return false;
    }
    if (e.sleeping) { if (ph === 'night' && e.house && !e.house.removed) return true; e.sleeping = false; return false; }
    if (ph === 'day') {
      e.nightT = 0;
      // de manhã quem trabalha sai de casa e vai a pé até o trabalho (loja, capela, porto, empreendimento)
      if (e.workAt && !e.atWork) {
        if (U.dist(e.x, e.y, e.workAt.x, e.workAt.y) > 18) { this.go(e, e.workAt.x, e.workAt.y, sp * 0.65, dt); return true; }
        e.atWork = true; e.home = { x: e.workAt.x, y: e.workAt.y };
      }
      // chegou na loja: entra e atende lá dentro
      if (e.atWork && e.workS !== undefined && this.entersWork(e)) { e.inside = e.workS; e.sleeping = true; return true; }
      // quem está construindo a casa da família trabalha na obra
      const b = e.npc.age >= 16 && !SHOP_RANKS.includes(e.npc.rank) && e.npc.rank !== 'priest' ? Homes.buildOf(e.npc) : null;
      return b ? Homes.work(e, b, dt, sp) : false;
    }
    e.atWork = false; // amanhã cedo vai de novo até o trabalho
    e.house = Homes.houseOf(e.npc); // a casa pode ter ficado pronta (ou ter sido demolida)
    // larga o trabalho: o que estava carregando vai para a vila
    if (e.work && e.work.mode !== 'idle') { if (e.work.carry) NPCWork.deposit(e, e.work); e.work.mode = 'idle'; e.work.t = 5; }
    const tg = ph === 'night' ? (e.house && !e.house.removed ? this.door(e.house) : null) : this.eveningTarget(e);
    if (!tg) return false;
    const d = U.dist(e.x, e.y, tg.x, tg.y);
    // quem ficar preso no caminho também acaba entrando em casa
    if (ph === 'night') e.nightT = (e.nightT || 0) + dt;
    if (ph === 'night' && (d < 16 || e.nightT > DAY_LEN * 0.12)) { e.sleeping = true; e.x = tg.x; e.y = tg.y; return true; }
    if (d > 44) { this.go(e, tg.x, tg.y, Math.max(sp, 34), dt); return true; }
    // chegou na taverna: entra
    if (tg.s && tg.s.type === 'tavern' && ph === 'evening' && d < 30) { e.inside = tg.s.id; e.sleeping = true; return true; }
    if (tg.s && d >= 30) { this.go(e, tg.x, tg.y, Math.max(sp, 34), dt); return true; }
    // chegou: fica conversando por ali
    const r = e.rt || (e.rt = { t: 0, x: tg.x, y: tg.y });
    r.t -= dt;
    if (r.t <= 0) { r.t = U.rnd(2, 5); const a = Math.random() * Math.PI * 2, rr = U.rnd(10, 34); r.x = tg.x + Math.cos(a) * rr; r.y = tg.y + 6 + Math.abs(Math.sin(a)) * rr * 0.6; }
    if (U.dist(e.x, e.y, r.x, r.y) > 6) e.moveToward(r.x, r.y, sp * 0.4, dt);
    return true;
  },
  // uma vez por quadro: quais casas têm alguém dormindo
  frame() {
    this.occ = new Set();
    for (const e of G.ents) if (e.sleeping) { if (e.inside != null) this.occ.add(e.inside); else if (e.house) this.occ.add(e.house.id); }
  },
  // janela acesa: alguém em casa, ou começo da noite (quando todos ainda estão acordados)
  lit(s) {
    if (s.type === 'tavern') { const h = Game.hour(); return h >= 17 || h < 2; }
    const h = Game.hour();
    return this.occ.has(s.id) || (h >= 17 && h < 22);
  },
};

// ====================================================================== passeios para outros reinos
// Desempregados e crianças viajam de vez em quando para vilas de outros reinos que estão em paz com o seu.
// Ficam lá alguns meses como visitantes (você os encontra pela vila) e depois voltam para casa.
const Trips = {
  canGo(p) {
    if (!p || !p.alive || p.trip || p.home.type !== 'village' || !World.villages[p.home.idx]) return false;
    if (G.day - (p.tripBack === undefined ? -99 : p.tripBack) < 3) return false; // fica um tempo em casa entre um passeio e outro
    if (p.capanga || p.kin || p.council || p.port || p.spouse === 'player' || (p.job !== undefined && p.job !== null) || p.hostile) return false;
    if (Families.isChief(p) || People.isCourt(p)) return false;
    return (p.age >= 6 && p.age < 14) || (p.age >= 14 && ['peasant', 'wanderer', 'beggar', 'child'].includes(p.rank));
  },
  civOfVillage(vi) { const v = World.villages[vi]; return v ? v.civ : -1; },
  peaceful(a, b) { return a !== b && a >= 0 && b >= 0 && !Diplo.atWar(a, b); },
  destinations(p) {
    const from = World.villages[p.home.idx], civ = from.civ;
    return World.villages.map((v, vi) => ({ v, vi })).filter(x => !x.v.free && this.peaceful(civ, x.v.civ))
      .sort((a, b) => U.dist(a.v.x, a.v.y, from.x, from.y) - U.dist(b.v.x, b.v.y, from.x, from.y));
  },
  where(p) { return p && p.trip && World.villages[p.trip.vi] ? World.villages[p.trip.vi] : null; },
  // uma vez por mês: quem está fora volta (no fim da viagem ou se estourar uma guerra) e alguns saem para passear
  monthTick() {
    if (G.dungeon) return;
    for (const p of G.people) {
      if (!p.alive || !p.trip) continue;
      const home = p.home.type === 'village' ? this.civOfVillage(p.home.idx) : -1, dest = this.civOfVillage(p.trip.vi);
      const war = !this.peaceful(home, dest);
      if (G.day >= p.trip.until || war || !this.canStay(p)) this.end(p, war);
    }
    for (const p of G.people) {
      if (!this.canGo(p)) continue;
      if (Math.random() > (p.age < 14 ? 0.025 : 0.04)) continue;
      const list = this.destinations(p);
      if (!list.length) continue;
      const pick = list[Math.min(list.length - 1, Math.floor(Math.random() * Math.min(4, list.length)))];
      this.start(p, pick.vi, U.rint(1, 3));
    }
  },
  canStay(p) { return p.alive && !p.capanga && (p.job === undefined || p.job === null); },
  start(p, vi, months) {
    p.trip = { vi, until: G.day + months, since: G.day };
    const e = G.spawned.get(p.id);
    if (e && !e.dead) {
      // sai andando pela estrada, na direção da vila de destino
      const v = World.villages[vi], a = Math.atan2(v.y * TILE - e.y, v.x * TILE - e.x);
      e.leaving = { x: e.x + Math.cos(a) * 18 * TILE, y: e.y + Math.sin(a) * 18 * TILE };
      e.sleeping = false;
    }
    if (p.met || p.aff >= 10) UI.msg(`🧳 ${People.full(p)} saiu para passear em ${World.villages[vi].name} (${CIV_DEFS[World.villages[vi].civ].short}).`);
  },
  end(p, war) {
    const v = this.where(p);
    delete p.trip; p.tripBack = G.day;
    const e = G.spawned.get(p.id);
    if (e) { e.dead = true; G.spawned.delete(p.id); } // reaparece em casa
    if (v && (p.met || p.aff >= 10)) UI.msg(war ? `⚔️ ${People.full(p)} voltou às pressas de ${v.name}: estourou uma guerra.` : `🏠 ${People.full(p)} voltou do passeio em ${v.name}.`);
  },
  // visitantes aparecem pela vila de destino (perto da taverna ou da praça)
  visitors(vi) { return G.people.filter(p => p.alive && p.trip && p.trip.vi === vi); },
};
