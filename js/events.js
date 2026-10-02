'use strict';
// Eventos no mundo, perto do jogador: mercador perdido, tesouro enterrado, alcateia atacando uma vila
// e, raramente, um dragão fora das cavernas. Um evento de cada vez; eles não ficam no jogo salvo.

const TREASURE_LOOT = [['gem', 1, 2], ['silver_bar', 1, 3], ['gold_bar', 1, 2], ['ancient_coin', 2, 5], ['silver_ring', 1, 1], ['spices', 2, 4], ['silk_cloth', 1, 3]];
const MERCHANT_GOODS = ['spices', 'silk_cloth', 'wine', 'honey', 'cloth'];

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
    if (Math.random() < 0.25) return; // às vezes nada acontece
    const r = Math.random();
    const kind = r < 0.3 ? 'lost' : r < 0.6 ? 'treasure' : r < 0.93 || G.day < 20 ? 'wolves' : 'dragon';
    this.start(kind);
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
    if (kind === 'lost') {
      const s = this.spotAround(14, 26);
      if (!s) return false;
      const p = People.create({ rank: 'merchant', civ: -1, age: U.rint(28, 62), home: { type: 'wild' }, trait: U.pick(['gentil', 'alegre', 'timido', 'leal']) });
      p.lost = true; p.met = true;
      G.wevent = { kind, pid: p.id, x: s.x, y: s.y, until, escort: false };
      this.spawnLost(G.wevent);
      this.ping(s.x, s.y, 'Mercador perdido');
      UI.banner('🧭 Alguém pede socorro');
      UI.msg(`🧭 ${p.name}, ${p.sex === 'f' ? 'uma mercadora perdida' : 'um mercador perdido'}, grita por ajuda aqui perto (marcado no mapa). Converse e leve-${p.sex === 'f' ? 'a' : 'o'} até uma vila ou castelo.`, 'gold');
    } else if (kind === 'treasure') {
      const s = this.spotAround(18, 34);
      if (!s) return false;
      const st = World.addStruct('dig', s.x, s.y, 1, 1, -1, { wev: true });
      G.wevent = { kind, sid: st.id, x: s.x, y: s.y, until: G.realTime + 900 };
      this.ping(s.x, s.y, 'Tesouro enterrado');
      UI.banner('🗺️ Um tesouro enterrado!');
      UI.msg('🗺️ Um andarilho contou onde há um tesouro enterrado aqui perto (marcado no mapa). Leve uma picareta ou uma enxada para cavar.', 'gold');
    } else if (kind === 'wolves') {
      let vi = -1, bd = 45;
      World.villages.forEach((v, i) => { const d = U.dist(P.x / TILE, P.y / TILE, v.x, v.y); if (d < bd) { bd = d; vi = i; } });
      if (vi < 0) return false;
      const v = World.villages[vi], n = U.rint(5, 7);
      G.wevent = { kind, vi, n, left: n, spawned: 0, x: v.x, y: v.y, until };
      this.ping(v.x, v.y - 1, `Lobos em ${v.name}`);
      UI.banner(`🐺 Lobos atacam ${v.name}!`);
      UI.msg(`🐺 Uma alcateia está atacando ${v.name} (marcado no mapa). Vá defender os moradores e a vila vai recompensar você.`, 'bad');
    } else if (kind === 'dragon') {
      const s = this.spotAround(24, 34);
      if (!s) return false;
      G.wevent = { kind, x: s.x, y: s.y, until, hp: null };
      this.ping(s.x, s.y, 'Dragão avistado');
      UI.banner('🐉 Um dragão desceu das montanhas!');
      UI.msg('🐉 Um Dragão Ancestral foi visto aqui perto (marcado no mapa). Quem o derrotar fica rico e famoso... se sobreviver.', 'bad');
      Diplo.chronicle('🐉 Um Dragão Ancestral foi avistado fora das cavernas.');
    }
    return true;
  },
  spawnLost(ev) {
    const p = G.people[ev.pid];
    const e = Game.spawn('villager', (ev.x + 0.5) * TILE, (ev.y + 0.8) * TILE, { civ: -1, npc: p, leash: 1.5, tag: 'wev' });
    e.escort = ev.escort;
    G.spawned.set(p.id, e);
    return e;
  },
  // o jogador aceita acompanhar o mercador
  escort() {
    const ev = G.wevent;
    if (!ev || ev.kind !== 'lost') return;
    ev.escort = true; ev.until = G.realTime + 900;
    const e = G.spawned.get(ev.pid); if (e) e.escort = true;
    if (G.ping && G.ping.wev) G.ping = null;
  },
  near(x, y, r) { return U.dist(P.x / TILE, P.y / TILE, x, y) < r; },
  tick(ev, dt) {
    if (G.realTime > ev.until) { this.end(ev, false); return; }
    if (ev.kind === 'lost') {
      const p = G.people[ev.pid];
      if (!p || !p.alive) { this.end(ev, false, 'dead'); return; }
      let e = G.spawned.get(ev.pid);
      if (!e || e.dead) {
        if (ev.escort || this.near(ev.x, ev.y, 30)) { if (ev.escort) { const s = freeSpotNear(P.x, P.y, 60); ev.x = s.x / TILE; ev.y = s.y / TILE; } e = this.spawnLost(ev); }
        else return;
      }
      if (!ev.escort) return;
      ev.x = e.x / TILE; ev.y = e.y / TILE;
      const tx = e.x / TILE, ty = e.y / TILE;
      const vi = World.villages.findIndex(v => U.dist(v.x, v.y, tx, ty) < 7);
      const ci = World.capitals.findIndex(c => U.dist(c.x, c.y, tx, ty) < 10);
      if (vi >= 0 || ci >= 0) this.end(ev, true, vi >= 0 ? { vi } : { ci });
    } else if (ev.kind === 'treasure') {
      const s = World.structs[ev.sid];
      if (!s || s.removed) G.wevent = null;
    } else if (ev.kind === 'wolves') {
      const v = World.villages[ev.vi];
      if (!v) { G.wevent = null; return; }
      const alive = G.ents.filter(e => e.tag === 'wev' && !e.dead).length;
      if (this.near(v.x, v.y, 32) && alive < ev.left && ev.left > 0) {
        for (let k = alive; k < ev.left; k++) {
          const a = Math.random() * Math.PI * 2, r = U.rnd(5, 9);
          const sp = freeSpotNear((v.x + Math.cos(a) * r) * TILE, (v.y + Math.sin(a) * r * 0.8) * TILE, 3 * TILE);
          const alpha = k === 0 && !ev.alphaDead;
          const e = Game.spawn('wolf', sp.x, sp.y, { leash: 14, tag: 'wev', mult: alpha ? 2.2 : 1.2, name: alpha ? 'Lobo Alfa' : undefined });
          e.raid = true; e.alpha = alpha; e.aggroOv = 12; e.home = { x: v.x * TILE, y: v.y * TILE };
        }
        ev.spawned = 1;
      }
      if (ev.spawned && ev.left <= 0) this.end(ev, true);
    } else if (ev.kind === 'dragon') {
      let e = G.ents.find(x => x.tag === 'wev' && x.kind === 'dragon' && !x.dead);
      if (!e && this.near(ev.x, ev.y, 36)) {
        e = Game.spawn('dragon', (ev.x + 0.5) * TILE, (ev.y + 0.8) * TILE, { leash: 18, tag: 'wev', mult: 0.7 });
        if (ev.hp) e.hp = ev.hp;
      }
      if (e) { ev.hp = e.hp; ev.x = e.x / TILE; ev.y = e.y / TILE; }
    }
  },
  // cavar o tesouro (precisa de picareta ou enxada na mochila)
  dig(s) {
    const tool = Object.keys(P.inv).find(k => ITEMS[k].tool === 'pick' || ITEMS[k].tool === 'hoe');
    if (!tool) { UI.msg('Você precisa de uma picareta ou de uma enxada para cavar.', 'bad'); return; }
    const gold = U.rint(80, 220), got = [`${gold} 🪙`];
    P.gold += gold;
    for (let k = U.rint(2, 3); k > 0; k--) { const [it, a, b] = U.pick(TREASURE_LOOT), n = U.rint(a, b); Inv.add(it, n); got.push(`${n} ${ITEMS[it].name}`); }
    if (Math.random() < 0.12) { const it = U.pick(['ancient_blade', 'troll_club', 'silk_hood', 'royal_helm']); Inv.add(it, 1); got.push('✨ ' + ITEMS[it].name); }
    Game.burst((s.x + 0.5) * TILE, (s.y + 0.5) * TILE, '#8b5a2b', 18);
    Sound.play('chest'); Sound.play('coin');
    World.removeStruct(s);
    UI.banner('💰 Tesouro desenterrado!');
    UI.msg(`Você cavou com ${ITEMS[tool].name} e achou: ${got.join(', ')}.`, 'gold');
    Progress.add('treasures'); Game.gainXp(30);
    this.end(G.wevent, true);
  },
  onKill(e) {
    const ev = G.wevent;
    if (!ev) return;
    if (ev.kind === 'wolves' && e.kind === 'wolf') { ev.left = Math.max(0, ev.left - 1); if (e.alpha) ev.alphaDead = true; }
    if (ev.kind === 'dragon' && e.kind === 'dragon') this.end(ev, true);
  },
  end(ev, ok, info) {
    if (!ev) return;
    G.wevent = null;
    if (G.ping && G.ping.wev) G.ping = null;
    if (ev.kind === 'lost') {
      const p = G.people[ev.pid], e = G.spawned.get(ev.pid);
      if (e) { e.escort = false; e.tag = null; }
      if (!p) return;
      p.lost = false;
      if (ok) {
        const vi = info.vi !== undefined ? info.vi : World.villages.reduce((b, v, i) => b < 0 || U.dist(v.x, v.y, World.capitals[info.ci].x, World.capitals[info.ci].y) < U.dist(World.villages[b].x, World.villages[b].y, World.capitals[info.ci].x, World.capitals[info.ci].y) ? i : b, -1);
        const v = World.villages[vi];
        p.home = { type: 'village', idx: vi }; p.civ = v.civ;
        if (e) e.dead = true;
        G.spawned.delete(p.id);
        People.addAff(p, 40);
        const gold = U.rint(60, 140), k = U.pick(MERCHANT_GOODS), n = U.rint(2, 4);
        P.gold += gold; Inv.add(k, n); Game.gainXp(30); Game.addRelation(v.civ, 4);
        UI.banner('🧭 Mercador a salvo!');
        UI.msg(`${p.name} chegou a ${v.name} são e salvo e paga ${gold} 🪙 e ${n} ${ITEMS[k].name}. Agora mora lá e é seu amigo.`, 'gold');
        Progress.add('rescues'); Sound.play('coin');
      } else {
        if (info === 'dead') { UI.msg('O mercador perdido não sobreviveu à viagem.', 'bad'); return; }
        if (e) e.dead = true;
        G.spawned.delete(p.id);
        UI.msg(`${p.name} cansou de esperar e seguiu sozinho pela estrada.`);
      }
      return;
    }
    if (ev.kind === 'treasure') {
      const s = World.structs[ev.sid];
      if (!ok && s && !s.removed) { World.removeStruct(s); UI.msg('Alguém chegou antes: o tesouro enterrado já foi levado.'); }
      return;
    }
    if (ev.kind === 'wolves') {
      const v = World.villages[ev.vi];
      if (ok) {
        const gold = U.rint(50, 120);
        P.gold += gold; Game.addRelation(v.civ, 8); Court.addService(v.civ, 4); Game.gainXp(40);
        for (const p of People.residents(ev.vi)) p.aff = Math.min(100, p.aff + 5);
        UI.banner(`🐺 ${v.name} está a salvo!`);
        UI.msg(`Você espantou a alcateia. ${v.name} agradece com ${gold} 🪙 (+8 de relação com ${CIV_DEFS[v.civ].short}, os moradores gostam mais de você).`, 'gold');
        Progress.add('wolfRaids'); Sound.play('coin');
      } else {
        for (const e of G.ents) if (e.tag === 'wev') e.dead = true;
        v.prosper = Math.max(0, (v.prosper || 0) - 3);
        UI.msg(`🐺 Os lobos atacaram ${v.name} e fugiram para a floresta. A vila ficou mais pobre.`, 'bad');
      }
      return;
    }
    if (ev.kind === 'dragon') {
      if (ok) {
        const gold = 400;
        P.gold += gold; Court.addFame(15); Game.gainXp(150);
        UI.banner('🐉 O dragão caiu!');
        UI.msg(`Você derrotou o Dragão Ancestral! +${gold} 🪙, escamas de dragão e muita fama.`, 'gold');
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
  goesOut(e) { return e.npc.rank === 'innkeeper' || (e.npc.age >= 16 && U.hash2(e.npc.id, 3, 77) < 0.55); },
  eveningTarget(e) {
    const v = World.villages[e.vi];
    if (!v) return null;
    if (e.npc.rank === 'priest' && v.chapel && !v.chapel.removed) return this.door(v.chapel);
    if (this.goesOut(e) && v.tavern && !v.tavern.removed) return this.door(v.tavern);
    return e.house && !e.house.removed ? this.door(e.house) : null;
  },
  update(e, dt, sp) {
    if (G.dungeon || e.vi === undefined || !e.npc) return false;
    const ph = this.phase();
    if (e.sleeping) { if (ph === 'night' && e.house && !e.house.removed) return true; e.sleeping = false; return false; }
    if (ph === 'day') {
      e.nightT = 0;
      // quem está construindo a casa da família trabalha na obra
      const b = e.npc.age >= 16 && !SHOP_RANKS.includes(e.npc.rank) && e.npc.rank !== 'priest' ? Homes.buildOf(e.npc) : null;
      return b ? Homes.work(e, b, dt, sp) : false;
    }
    e.house = Homes.houseOf(e.npc); // a casa pode ter ficado pronta (ou ter sido demolida)
    // larga o trabalho: o que estava carregando vai para a vila
    if (e.work && e.work.mode !== 'idle') { if (e.work.carry) NPCWork.deposit(e, e.work); e.work.mode = 'idle'; e.work.t = 5; }
    const tg = ph === 'night' ? (e.house && !e.house.removed ? this.door(e.house) : null) : this.eveningTarget(e);
    if (!tg) return false;
    const d = U.dist(e.x, e.y, tg.x, tg.y);
    // quem ficar preso no caminho também acaba entrando em casa
    if (ph === 'night') e.nightT = (e.nightT || 0) + dt;
    if (ph === 'night' && (d < 16 || e.nightT > 25)) { e.sleeping = true; e.x = tg.x; e.y = tg.y; return true; }
    if (d > 44) { this.go(e, tg.x, tg.y, Math.max(sp, 34), dt); return true; }
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
    for (const e of G.ents) if (e.sleeping && e.house) this.occ.add(e.house.id);
  },
  // janela acesa: alguém em casa, ou começo da noite (quando todos ainda estão acordados)
  lit(s) {
    if (s.type === 'tavern') { const h = Game.hour(); return h >= 17 || h < 2; }
    const h = Game.hour();
    return this.occ.has(s.id) || (h >= 17 && h < 22);
  },
};
