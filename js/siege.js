'use strict';
// Cercos de verdade: portões com resistência, aríetes e catapultas, muralhas que caem,
// e exércitos inimigos que atacam o castelo e as vilas do jogador.

const Sieges = {
  boulders: [],
  gatePos(ci) { const d = World.capitals[ci].door; return { x: (d.x + 0.5) * TILE, y: (d.y - 0.3) * TILE }; },
  gateMax(ci) { return 260 + G.civs[ci].invest.walls * 90; },
  castleStruct(ci) { return World.capitals[ci].struct; },

  // ------------------------------------------------------------ cerco feito pelo jogador
  start(s) { s.gate = this.gateMax(s.civ); s.gateMax = s.gate; },
  // portão ainda de pé? (os defensores atiram das muralhas e o soberano não sai)
  gateUp() { const s = G.siege; return !!(s && s.gate > 0); },
  hitGate(dmg, by) {
    const s = G.siege;
    if (!s || s.gate <= 0) return;
    s.gate = Math.max(0, s.gate - dmg);
    const g = this.gatePos(s.civ);
    Game.addText(g.x, g.y - 30, '-' + Math.round(dmg), '#ffb070');
    Game.burst(g.x, g.y, '#8b5a2b', 6);
    Sound.play('chop', { vol: 0.7 });
    if (s.gate <= 0) {
      this.castleStruct(s.civ).gateBroken = true;
      UI.banner('💥 O portão caiu!');
      UI.msg(`O portão do castelo de ${CIV_DEFS[s.civ].short} foi derrubado! Avance contra a guarnição.`, 'gold', true);
      Sound.play('roar', { vol: 0.5 });
    }
  },
  // golpe do jogador perto do portão
  playerNearGate() {
    const s = G.siege;
    if (!s || s.gate <= 0) return false;
    const g = this.gatePos(s.civ);
    return U.dist(P.x, P.y - 10, g.x, g.y) < 2.3 * TILE;
  },
  // montar uma máquina de cerco perto do jogador
  deploy(kind) {
    const item = kind === 'ram' ? 'ram' : 'catapult';
    if (Inv.count(item) <= 0) { UI.msg(`Você não tem ${ITEMS[item].name}. Construa na bancada.`, 'bad'); return; }
    const target = this.myTarget();
    if (!target) { UI.msg('Monte as máquinas de cerco perto de um castelo inimigo durante um cerco.', 'bad'); return; }
    Inv.add(item, -1);
    const sp = freeSpotNear(P.x + P.dir * 40, P.y + 20, 2 * TILE);
    const e = Game.spawn(kind === 'ram' ? 'ram_e' : 'catapult_e', sp.x, sp.y, { leash: 999 });
    e.side = 'player'; e.target = null; e.siegeTarget = target; e.cd = 1;
    UI.msg(`${ITEMS[item].icon} ${ITEMS[item].name} montad${kind === 'ram' ? 'o' : 'a'}! Proteja ${kind === 'ram' ? 'o aríete' : 'a catapulta'} dos defensores.`, 'gold');
  },
  myTarget() {
    if (G.siege && G.siege.gate > 0 && U.dist(P.x / TILE, P.y / TILE, World.capitals[G.siege.civ].x, World.capitals[G.siege.civ].y) < 22) return { kind: 'gate', civ: G.siege.civ };
    return null;
  },

  // ------------------------------------------------------------ máquinas de cerco (entidades)
  engineUpdate(e, dt) {
    e.anim += dt; e.hurt -= dt; e.cd -= dt; e.moving = false;
    const t = e.siegeTarget, pos = this.targetPos(t);
    if (!pos) { if (e.side !== 'player') e.dead = true; return; }
    const d = U.dist(e.x, e.y, pos.x, pos.y + 20);
    if (e.kind === 'ram_e') {
      if (d > 26) { e.moveToward(pos.x, pos.y + 20, e.def.speed, dt); e.moving = true; }
      else if (e.cd <= 0) { e.cd = 1.6; e.swing = 0.3; this.damageTarget(t, 30, e); }
      e.swing = Math.max(0, (e.swing || 0) - dt);
    } else if (e.cd <= 0 && d < 12 * TILE) {
      e.cd = 3.8;
      this.boulders.push({ x0: e.x, y0: e.y - 20, x1: pos.x + U.rnd(-14, 14), y1: pos.y + U.rnd(-6, 10), t: 0, dur: 1.2, t2: t, by: e });
      Sound.play('bow', { vol: 0.8 });
    }
    if (Math.abs(pos.x - e.x) > 4) e.dir = pos.x < e.x ? -1 : 1;
  },
  targetPos(t) {
    if (!t) return null;
    if (t.kind === 'gate') { if (t.civ === (G.siege && G.siege.civ) && G.siege.gate > 0) return this.gatePos(t.civ); const a = this.assaultOf(t); return a && a.gate > 0 ? this.gatePos(t.civ) : null; }
    if (t.kind === 'struct') { const s = World.structs[t.id]; return s && !s.hidden && !s.ruined ? { x: (s.x + s.w / 2) * TILE, y: (s.y + s.h) * TILE - 8 } : null; }
    return null;
  },
  damageTarget(t, dmg, by) {
    if (t.kind === 'gate') {
      if (G.siege && G.siege.civ === t.civ && by.side === 'player') return this.hitGate(dmg, by);
      const a = this.assaultOf(t);
      if (a) { a.gate = Math.max(0, a.gate - dmg); const g = this.gatePos(t.civ); Game.addText(g.x, g.y - 30, '-' + dmg, '#ff7070'); Game.burst(g.x, g.y, '#8b5a2b', 6);
        if (a.gate <= 0) { this.castleStruct(t.civ).gateBroken = true; UI.banner('💥 Seu portão caiu!'); UI.msg('Os inimigos derrubaram o portão! Defenda o castelo com a guarnição.', 'bad'); } }
    } else if (t.kind === 'struct') {
      const s = World.structs[t.id];
      if (!s || s.hidden) return;
      s.hp = (s.hp === undefined ? 90 : s.hp) - dmg;
      Game.burst((s.x + s.w / 2) * TILE, (s.y + s.h / 2) * TILE, '#9a9488', 8);
      if (s.hp <= 0) {
        if (s.type === 'vhouse') { s.ruined = true; const v = World.villages[s.village]; if (v) v.ruin = Math.min(3, (v.ruin || 0) + 1); }
        else World.removeStruct(s);
        Sound.play('mine');
      }
    }
  },
  updateBoulders(dt) {
    for (const b of this.boulders) {
      b.t += dt;
      if (b.t >= b.dur && !b.hit) {
        b.hit = true;
        Game.burst(b.x1, b.y1, '#7a7468', 14);
        Sound.play('mine', { vol: 0.8 });
        const pos = this.targetPos(b.t2);
        if (pos && U.dist(pos.x, pos.y, b.x1, b.y1) < 46) this.damageTarget(b.t2, 45, b.by);
        // estilhaços ferem quem está perto (menos o lado de quem atirou)
        for (const e of G.ents) if (!e.dead && e.faction !== 'engine' && U.dist(e.x, e.y, b.x1, b.y1) < 42 && (b.by.side === 'player' ? fac(e) !== 'player' : fac(e) === 'player') && e.kind !== 'villager') Game.damage(e, 22, null);
        if (b.by.side !== 'player' && U.dist(P.x, P.y, b.x1, b.y1) < 42) Game.damage(P, 18, null);
      }
    }
    this.boulders = this.boulders.filter(b => b.t < b.dur + 0.3);
  },
  drawBoulders(ctx, cx, cy) {
    for (const b of this.boulders) {
      const k = Math.min(1, b.t / b.dur), x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 120;
      if (k < 1) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(b.x0 + (b.x1 - b.x0) * k - cx, b.y0 + (b.y1 - b.y0) * k - cy + 20, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a6458'; ctx.beginPath(); ctx.arc(x - cx, y - cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8a847a'; ctx.fillRect(x - cx - 3, y - cy - 4, 3, 3); }
    }
  },
  // barra de vida do portão durante cercos e ataques
  drawGateBar(ctx, cw) {
    let g = null, max = 1, label = '';
    if (G.siege && G.siege.gateMax) { g = G.siege.gate; max = G.siege.gateMax; label = `Portão de ${CIV_DEFS[G.siege.civ].short}`; }
    const a = (G.assaults || []).find(x => x.state === 'attack' && x.target.kind === 'gate' && x.near);
    if (a) { g = a.gate; max = a.gateMax; label = 'Seu portão'; }
    if (g === null) return;
    const w = 260, x = cw / 2 - w / 2, y = 58;
    ctx.fillStyle = 'rgba(20,14,8,0.8)'; ctx.fillRect(x - 4, y - 16, w + 8, 30);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = g > 0 ? '#c8873a' : '#555'; ctx.fillRect(x, y, w * Math.max(0, g) / max, 8);
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(g > 0 ? `🚪 ${label}: ${Math.ceil(g)} / ${max}` : `💥 ${label}: destruído`, cw / 2, y - 3);
  },

  // ------------------------------------------------------------ ataques inimigos às terras do jogador
  assaultOf(t) { return (G.assaults || []).find(a => a.state === 'attack' && a.target.kind === t.kind && a.target.civ === t.civ); },
  dayTick() {
    G.assaults = (G.assaults || []).filter(a => a.state !== 'done' || G.day - a.day < 4 * ECON_DAYS);
    for (const a of G.assaults) {
      if (a.state === 'march' && G.day >= a.day) {
        a.state = 'attack'; a.days = 0;
        UI.banner(`⚔️ ${Diplo.name(a.att)} ataca ${this.targetName(a)}!`);
        UI.msg(`O exército de ${Diplo.name(a.att)} chegou a ${this.targetName(a)}. Vá defender!`, 'bad');
      } else if (a.state === 'attack') {
        a.days++;
        if (!a.near || a.days >= 2) this.resolve(a);
      }
    }
    // reinos em guerra com o jogador preparam ataques
    if (G.assaults.some(a => a.state !== 'done')) return;
    for (const c of G.civs) {
      if (c.ruler === 'player') continue;
      const enemyOfMine = G.civs.find(m => m.ruler === 'player' && Diplo.atWar(c.id, m.id));
      const myVillages = World.villages.map((v, i) => ({ v, i })).filter(x => x.v.lord === 'player' && (Diplo.atWar(c.id, x.v.civ) || c.atWar));
      if ((!enemyOfMine && !myVillages.length) || c.garrison < 6 || Math.random() > 0.3) continue;
      let target;
      if (enemyOfMine && (Math.random() < 0.5 || !myVillages.length)) target = { kind: 'gate', civ: enemyOfMine.id };
      else { const x = myVillages.length ? U.pick(myVillages) : null; if (!x) continue; target = { kind: 'village', vi: x.i, civ: x.v.civ }; }
      const a = { id: G.day * 10 + c.id, att: c.id, target, day: G.day + ECON_DAYS, state: 'march', str: Math.round(c.garrison * 0.6 + 6), engines: c.garrison > 12 ? 2 : 1,
        gate: target.kind === 'gate' ? this.gateMax(target.civ) : 0, gateMax: target.kind === 'gate' ? this.gateMax(target.civ) : 0, spawnedEngines: 0 };
      G.assaults.push(a);
      c.atWar = true;
      UI.banner(`🚩 ${Diplo.name(c.id)} marcha contra ${this.targetName(a)}!`);
      UI.msg(`Espiões avisam: o exército de ${Diplo.name(c.id)} (${a.str} soldados, ${a.engines} máquina(s) de cerco) chega em ${daysText(ECON_DAYS)} a ${this.targetName(a)}.`, 'bad');
      Diplo.chronicle(`🚩 ${Diplo.name(c.id)} marcha contra ${this.targetName(a)}.`);
      break;
    }
  },
  targetName(a) { return a.target.kind === 'gate' ? 'o castelo de ' + CIV_DEFS[a.target.civ].short : World.villages[a.target.vi].name; },
  targetCenter(a) {
    if (a.target.kind === 'gate') { const cp = World.capitals[a.target.civ]; return { x: cp.door.x, y: cp.door.y + 3 }; }
    const v = World.villages[a.target.vi]; return { x: v.x, y: v.y };
  },
  // batalha resolvida longe do jogador (ou depois de 2 dias)
  resolve(a) {
    a.state = 'done';
    for (const e of G.ents) if (e.tag === 'asl' + a.id || e.tag === 'def' + a.id || (e.faction === 'engine' && e.assault === a.id)) e.dead = true;
    const civ = a.target.civ, c = G.civs[civ], gen = Court.member(civ, 'general');
    const defense = c.garrison * 1.3 + c.invest.walls * 4 + (gen ? gen.comp * 1.5 : 0) + (a.target.kind === 'gate' ? 6 : 2) + (a.gate > 0 ? 4 : -4) + Guards.power(a.target);
    const attack = a.str + U.rnd(0, 6);
    const att = G.civs[a.att];
    if (a.str <= 0 || defense >= attack) {
      att.garrison = Math.max(0, att.garrison - 3);
      UI.msg(`🛡️ ${this.targetName(a)} resistiu ao ataque de ${Diplo.name(a.att)}!`, 'gold', true);
      Diplo.chronicle(`🛡️ ${this.targetName(a)} resistiu ao ataque de ${Diplo.name(a.att)}.`, true);
      if (a.fought) { Court.addFame(8); Progress.add('defenses'); }
    } else if (a.target.kind === 'village') {
      const v = World.villages[a.target.vi];
      v.lord = undefined; v.ruin = Math.min(3, (v.ruin || 0) + 2);
      if (v.civ !== a.att) Diplo.captureVillage(v, a.att);
      UI.msg(`🔥 ${v.name} caiu nas mãos de ${Diplo.name(a.att)}. Você perdeu a vila.`, 'bad');
      Progress.diary(`🔥 Perdeu ${v.name} para ${Diplo.name(a.att)}.`);
    } else {
      c.garrison = 2;
      const gov = People.create({ rank: 'ruler', civ, home: { type: 'castle', civ }, age: U.rint(30, 50), aff: -60, surname: (Families.of(People.get(att.rulerId)) || {}).surname });
      Heraldry.apply(); c.ruler = 'npc'; c.rulerId = gov.id; c.rulerName = People.title(gov) + ' ' + gov.name; c.relation = -60; c.happy = 40;
      Diplo.makePeace(a.att, civ, `${CIV_DEFS[civ].short} foi conquistado`);
      UI.banner(`🏴 ${CIV_DEFS[civ].short} caiu!`);
      UI.msg(`O castelo de ${CIV_DEFS[civ].short} foi tomado por ${Diplo.name(a.att)}. Você perdeu o reino!`, 'bad');
      Progress.diary(`🏴 Perdeu o reino de ${CIV_DEFS[civ].short} para ${Diplo.name(a.att)}.`);
    }
    const cs = this.castleStruct(civ); if (cs) cs.gateBroken = false;
  },
  // durante o ataque, perto do jogador, as tropas e máquinas aparecem
  update(dt) {
    this.updateBoulders(dt);
    if (G.dungeon) return;
    for (const s of World.capitals.map(c => c.struct)) if (s && s.gateBroken && !(G.siege && G.siege.civ === s.owner) && !(G.assaults || []).some(a => a.state === 'attack' && a.target.civ === s.owner && a.gate <= 0)) s.gateBroken = false;
    this.t = (this.t || 0) - dt;
    if (this.t > 0 || G.dungeon) return;
    this.t = 1;
    // assassinos contratados por conspiradores
    if (G.assassins > 0 && !G.dungeon && Math.random() < 0.15) {
      G.assassins--;
      const a = Math.random() * Math.PI * 2, sp = freeSpotNear(P.x + Math.cos(a) * 300, P.y + Math.sin(a) * 220, 2 * TILE);
      const e = Game.spawn('bandit', sp.x, sp.y, { leash: 40, tag: 'assassin' }); e.angry = true; e.aggroOv = 30; e.target = P;
      if (G.assassins === 2) UI.msg('🗡️ Vultos encapuzados seguem você...', 'bad');
    }
    for (const a of G.assaults || []) {
      if (a.state !== 'attack') continue;
      const ctr = this.targetCenter(a);
      a.near = U.dist(P.x / TILE, P.y / TILE, ctr.x, ctr.y) < 30;
      if (!a.near) continue;
      a.fought = true;
      const tag = 'asl' + a.id, alive = G.ents.filter(e => e.tag === tag && !e.dead).length;
      if (a.str <= 0 && alive === 0) { this.resolve(a); continue; }
      const ang0 = a.id % 6;
      if (a.str > alive && alive < 6) {
        const ang = ang0 + U.rnd(-0.6, 0.6), sp = freeSpotNear((ctr.x + Math.cos(ang) * 13) * TILE, (ctr.y + Math.sin(ang) * 10) * TILE, 3 * TILE);
        const e = Game.spawn('guard', sp.x, sp.y, { civ: a.att, leash: 40, tag, archer: Math.random() < 0.3 });
        e.home = { x: ctr.x * TILE, y: ctr.y * TILE }; e.aggroOv = 14; e.assault = a.id;
      }
      // máquinas de cerco inimigas
      if (a.spawnedEngines < a.engines) {
        a.spawnedEngines++;
        const kind = a.spawnedEngines === 1 ? 'ram_e' : 'catapult_e';
        const ang = ang0 + (kind === 'ram_e' ? 0 : 0.5), dist = kind === 'ram_e' ? 12 : 9;
        const sp = freeSpotNear((ctr.x + Math.cos(ang) * dist) * TILE, (ctr.y + Math.sin(ang) * dist * 0.8) * TILE, 3 * TILE);
        const e = Game.spawn(kind, sp.x, sp.y, { civ: a.att, leash: 999 });
        e.side = 'enemy'; e.assault = a.id; e.cd = 3; e.civ = a.att;
        e.siegeTarget = a.target.kind === 'gate' ? { kind: 'gate', civ: a.target.civ } : this.villageTarget(a);
      }
      for (const e of G.ents) if (e.faction === 'engine' && e.side === 'enemy' && e.assault === a.id && !e.dead && !this.targetPos(e.siegeTarget)) e.siegeTarget = a.target.kind === 'gate' ? null : this.villageTarget(a);
      // defensores do castelo do jogador
      if (a.target.kind === 'gate') {
        const c = G.civs[a.target.civ], dtag = 'def' + a.id, nd = G.ents.filter(e => e.tag === dtag && !e.dead).length;
        if (c.garrison > nd && nd < 5) {
          const cp = World.capitals[a.target.civ], sp = freeSpotNear((cp.door.x + 0.5) * TILE, (cp.door.y + 1.5) * TILE, 2 * TILE);
          const e = Game.spawn('guard', sp.x, sp.y, { civ: a.target.civ, leash: 10, tag: dtag }); e.aggroOv = 12;
        }
        if (a.gate <= 0 && c.garrison <= 0) this.resolve(a);
      }
    }
  },
  villageTarget(a) {
    const v = World.villages[a.target.vi];
    const s = World.structs.filter(s => !s.hidden && !s.ruined && (s.village === a.target.vi || U.dist(s.x, s.y, v.x, v.y) < 16) && ['vhouse', 'vwall', 'store', 'tavern', 'well', 'chapel'].includes(s.type))
      .sort((p, q) => U.dist(p.x, p.y, v.x, v.y) - U.dist(q.x, q.y, v.x, v.y))[0];
    return s ? { kind: 'struct', id: s.id } : null;
  },
  soldierKilled(e) { const a = (G.assaults || []).find(x => x.id === e.assault); if (a) a.str = Math.max(0, a.str - 1); },
};

// desenho das máquinas de cerco
function drawEngine(ctx, x, y, kind, dir, anim, moving, hurt, swing, side) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
  const wood = hurt ? '#c07060' : '#7a5230', dark = '#4a2f18';
  const wheel = (wx) => { ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, -7, 7, 0, Math.PI * 2); ctx.stroke(); const r = anim * (moving ? 5 : 0); ctx.beginPath(); ctx.moveTo(wx + Math.cos(r) * 7, -7 + Math.sin(r) * 7); ctx.lineTo(wx - Math.cos(r) * 7, -7 - Math.sin(r) * 7); ctx.stroke(); };
  if (kind === 'ram_e') {
    ctx.fillStyle = wood; ctx.fillRect(-26, -30, 48, 18);
    ctx.fillStyle = side === 'player' ? PLAYER_COLOR : '#8e1f2a'; ctx.beginPath(); ctx.moveTo(-28, -30); ctx.lineTo(-2, -44); ctx.lineTo(24, -30); ctx.fill();
    const push = (swing || 0) > 0 ? 8 : 0;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-14 + push, -24, 44, 7); ctx.fillStyle = '#8a8f96'; ctx.fillRect(28 + push, -26, 8, 11);
    wheel(-16); wheel(14);
  } else {
    ctx.fillStyle = wood; ctx.fillRect(-22, -16, 44, 8);
    ctx.fillRect(-4, -34, 6, 20);
    const arm = -0.9 + Math.min(1, anim % 3.8 < 0.25 ? 1.6 : 0);
    ctx.save(); ctx.translate(0, -30); ctx.rotate(arm); ctx.fillStyle = dark; ctx.fillRect(-2, -30, 4, 34); ctx.fillStyle = '#6a6458'; ctx.beginPath(); ctx.arc(0, -30, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = side === 'player' ? PLAYER_COLOR : '#8e1f2a'; ctx.fillRect(14, -26, 8, 10);
    wheel(-16); wheel(16);
  }
  ctx.restore();
}
