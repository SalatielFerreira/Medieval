'use strict';
// Entidades: movimento, IA das criaturas e desenho de personagens e animais.

function moveEnt(e, dx, dy) {
  const r = e.r * 0.8;
  let moved = false;
  if (dx) { const nx = e.x + dx; if (!World.blockedAt(nx, e.y, r, e.sailing)) { e.x = nx; moved = true; } }
  if (dy) { const ny = e.y + dy; if (!World.blockedAt(e.x, ny, r, e.sailing)) { e.y = ny; moved = true; } }
  return moved;
}

function freeSpotNear(px, py, radiusPx) {
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * radiusPx;
    const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (!World.blockedAt(x, y, 9)) return { x, y };
  }
  return { x: px, y: py };
}

// Facção efetiva: guardas de um reino governado pelo jogador ficam do lado do jogador.
function fac(e) {
  if (e === P) return 'player';
  if (e.faction === 'civ') return e.civ < 0 || G.civs[e.civ].ruler === 'player' ? 'player' : 'civ' + e.civ;
  return e.faction;
}

// a quer atacar b?
function hostile(a, b) {
  if (a.faction === 'pet' || b.faction === 'pet' || a.kind === 'caravan') return false;
  if (a.faction === 'rebel' || b.faction === 'rebel') return Families.rebelHostile(a, b);
  // campeão da arena só luta com o jogador; máquinas de cerco não atacam ninguém
  if (a.faction === 'arena') return b === P;
  if (b.faction === 'arena') return a === P;
  if (a.faction === 'engine') return false;
  if (b.faction === 'engine') return b.side === 'player' ? (a.kind === 'guard' && a.civ >= 0 && G.civs[a.civ].ruler !== 'player' && G.civs[a.civ].atWar) : fac(a) === 'player' && a !== P ? true : a === P;
  // guardas da coroa numa revolta atacam quem apoia os rebeldes
  if (a.tag && a.tag.startsWith('crw') && (b === P || fac(b) === 'player')) { const r = Families.revolt(+a.tag.slice(3)); if (r && !r.done && r.side === 'rebel') return true; }
  if (b.tag && b.tag.startsWith('crw') && fac(a) === 'player') { const r = Families.revolt(+b.tag.slice(3)); if (r && !r.done && r.side === 'rebel') return true; }
  if (a.angry) return b === P || fac(b) === 'player';
  if (b.angry && fac(a) === 'player') return true;
  if (a.npc && a.npc.hostile) return b === P || (b.npc && b.npc.capanga);
  if (b.npc && b.npc.hostile && fac(a) === 'player') return true;
  // soldados de lados opostos numa batalha em campo aberto
  if (a.battle && a.battle === b.battle && a.civ !== b.civ) return true;
  const fa = fac(a), fb = fac(b);
  if (fa === fb || a.dmg <= 0 || b.kind === 'villager') return false;
  if (a.kind === 'boar') return a.provoked && fb === 'player';
  if (b.kind === 'deer' || b.kind === 'boar') return false;
  if (fa === 'wild') return fb === 'player';
  if (fa === 'bandit') return fb === 'player' || fb.startsWith('civ');
  if (fa.startsWith('civ')) {
    if (fb === 'bandit' || fb === 'wild') return true;
    if (fb === 'player') return G.civs[a.civ].atWar;
    if (fb.startsWith('civ') && b.kind === 'guard' && a.kind === 'guard') return Diplo.atWar(a.civ, b.civ);
    return false;
  }
  if (fa === 'player') {
    if (fb === 'bandit' || fb === 'wild') return true;
    if (fb.startsWith('civ')) return G.civs[b.civ].atWar;
  }
  return false;
}

// O jogador pode golpear esta criatura?
function canHit(e) {
  if (e.faction === 'pet') return false;
  if (e.faction === 'arena') return true;
  if (e.faction === 'engine') return e.side === 'enemy';
  if (e.faction === 'rebel') return true;
  if (e.tag && e.tag.startsWith('crw')) { const r = Families.revolt(+e.tag.slice(3)); if (r && !r.done && r.side === 'rebel') return true; }
  if (e.angry || e.hostileToPlayer) return true;
  if (e.npc && e.npc.hostile) return true;
  if (e.kind === 'villager') return false;
  const f = fac(e);
  if (f === 'player') return false;
  if (f.startsWith('civ')) return G.civs[e.civ].atWar;
  return true;
}

function findTarget(e) {
  let best = null, bd = (e.aggroOv || e.def.aggro || 6) * TILE;
  if (hostile(e, P)) { const d = U.dist(e.x, e.y, P.x, P.y); if (d < bd) { bd = d; best = P; } }
  for (const c of G.ents) {
    if (c === e || c.dead) continue;
    const d = U.dist(e.x, e.y, c.x, c.y);
    if (d < bd && hostile(e, c)) { bd = d; best = c; }
  }
  return best;
}

class Creature {
  constructor(kind, x, y, opts = {}) {
    const d = CREATURES[kind];
    this.kind = kind; this.def = d;
    this.x = x; this.y = y; this.r = d.r;
    const hostileKind = ['wolf', 'boar', 'bandit', 'guard', 'lord', 'skeleton', 'spider', 'bat', 'troll', 'skel_king', 'spider_queen', 'dragon'].includes(kind);
    this.maxHp = this.hp = Math.round(d.hp * (opts.mult || 1) * (hostileKind && G.diff ? DIFFICULTY[G.diff].hp : 1));
    this.dmg = Math.round(d.dmg * (opts.mult ? Math.sqrt(opts.mult) : 1));
    this.faction = d.faction;
    this.civ = opts.civ !== undefined ? opts.civ : -1;
    this.home = { x, y };
    this.leash = (opts.leash || 10) * TILE;
    this.tag = opts.tag || null;
    this.camp = opts.camp || null;
    this.archer = !!opts.archer;
    this.siegeOf = opts.siegeOf !== undefined ? opts.siegeOf : -1;
    this.npc = opts.npc || null;
    this.name = opts.name || (this.npc ? People.full(this.npc) : d.name);
    if (this.npc) {
      const n = this.npc;
      if (n.age < 14) { this.dmg = 0; this.maxHp = this.hp = 25; }
      if (n.rank === 'knight') { this.dmg = 14; this.maxHp = this.hp = 110; }
      if (n.capanga) { const st = People.capangaStats(n); this.dmg = st.dmg; this.maxHp = this.hp = 70 + Math.min(40, n.age); }
    }
    this.look = opts.look || {};
    this.target = null; this.provoked = false; this.returning = false;
    this.atkCd = 0; this.hurt = 0; this.scanT = Math.random() * 0.4; this.wt = 0; this.wx = x; this.wy = y;
    this.dir = 1; this.aim = 0; this.swing = 0; this.anim = Math.random() * 10; this.moving = false;
    this.stuckT = 0; this.sx = 0; this.sy = 0; this.dead = false;
  }

  moveToward(tx, ty, sp, dt) {
    const dx = tx - this.x, dy = ty - this.y;
    const L = Math.hypot(dx, dy);
    if (L < 2) return;
    let vx = dx / L * sp * dt, vy = dy / L * sp * dt;
    if (this.stuckT > 0) { this.stuckT -= dt; vx = this.sx * sp * dt; vy = this.sy * sp * dt; }
    const ox = this.x, oy = this.y;
    moveEnt(this, vx, vy);
    if (Math.abs(this.x - ox) + Math.abs(this.y - oy) < 0.3 * sp * dt && this.stuckT <= 0) {
      this.stuckT = 0.5;
      const a = Math.atan2(dy, dx) + (Math.random() < 0.5 ? 1.6 : -1.6);
      this.sx = Math.cos(a); this.sy = Math.sin(a);
    }
    this.moving = true;
    if (Math.abs(dx) > 1) this.dir = dx < 0 ? -1 : 1;
  }

  wander(dt, sp) {
    this.wt -= dt;
    if (this.wt <= 0) {
      this.wt = U.rnd(2, 5);
      if (Math.random() < 0.35) { this.wx = this.x; this.wy = this.y; }
      else {
        const a = Math.random() * Math.PI * 2, d = Math.random() * this.leash * 0.7;
        this.wx = this.home.x + Math.cos(a) * d; this.wy = this.home.y + Math.sin(a) * d;
      }
    }
    if (U.dist(this.x, this.y, this.wx, this.wy) > 6) this.moveToward(this.wx, this.wy, sp * 0.45, dt);
  }

  update(dt) {
    const d = this.def;
    if (this.kind === 'caravan') { this.anim += dt; this.hurt -= dt; Caravans.move(this, dt); return; }
    if (this.faction === 'engine') { Sieges.engineUpdate(this, dt); return; }
    if (this.follow) { if (this.follow.dead) this.follow = null; else { this.home.x = this.follow.x - 24; this.home.y = this.follow.y + 14; } }
    if (this.kind === 'ally') {
      const ord = G.order || 'follow';
      this.aggroOv = ord === 'attack' ? 15 : ord === 'hold' ? 7 : 0;
    }
    // moradores e animais não ficam amontoados: afastam-se uns dos outros
    if (this.kind === 'villager' || this.faction === 'pet' || this.kind === 'ally' || this.kind === 'sentry') {
      for (const o of G.ents) {
        if (o === this || o.dead || (o.kind !== this.kind && !(this.faction === 'pet' && o.faction === 'pet'))) continue;
        const dx = this.x - o.x, dy = this.y - o.y, dd = dx * dx + dy * dy;
        if (dd < 900 && dd > 0.01) { const L = Math.sqrt(dd); moveEnt(this, dx / L * 40 * dt, dy / L * 40 * dt); }
      }
    }
    this.atkCd -= dt; this.hurt -= dt; this.scanT -= dt; this.anim += dt; this.swing = Math.max(0, this.swing - dt);
    this.moving = false;
    const sp = d.speed * World.speedAt(this.x, this.y);

    if (this.kind === 'deer') {
      let th = null, td = 5 * TILE;
      const dp = U.dist(this.x, this.y, P.x, P.y); if (dp < td) { td = dp; th = P; }
      if (th) {
        const a = Math.atan2(this.y - th.y, this.x - th.x);
        this.moveToward(this.x + Math.cos(a) * 60, this.y + Math.sin(a) * 60, sp * 1.3, dt);
      } else this.wander(dt, sp);
      return;
    }

    if (this.scanT <= 0) {
      this.scanT = 0.35 + Math.random() * 0.2;
      if (this.dmg > 0 && !this.returning) { const t = findTarget(this); if (t) this.target = t; }
    }
    const tg = this.target;
    if (tg && (tg.dead || !hostile(this, tg) || U.dist(this.x, this.y, tg.x, tg.y) > ((d.aggro || 6) + 6) * TILE)) this.target = null;

    if (this.target) {
      const t = this.target;
      const dd = U.dist(this.x, this.y, t.x, t.y);
      const reach = this.r + (t.r || 10) + 10;
      if (this.archer && dd > 2.5 * TILE && dd < 8 * TILE) {
        if (this.atkCd <= 0) { this.atkCd = 1.8; this.swing = 0.25; Ranged.fire(this, Math.atan2(t.y - 14 - (this.y - 16), t.x - this.x), this.dmg * 0.8, 'arrow'); Sound.play('bow', { vol: 0.6 }); }
      } else if (dd > reach) this.moveToward(t.x, t.y, sp * 1.1, dt);
      else if (this.atkCd <= 0) { this.atkCd = 1.1; this.swing = 0.25; Game.damage(t, this.dmg, this); }
      this.dir = t.x < this.x ? -1 : 1;
      this.aim = Math.atan2(t.y - this.y, t.x - this.x);
      if (this.kind === 'ally') {
        const ord = G.order || 'follow';
        if (ord === 'hold' && G.holdPos ? U.dist(this.x, this.y, G.holdPos.x, G.holdPos.y) > 9 * TILE : U.dist(this.x, this.y, P.x, P.y) > (ord === 'attack' ? 18 : 11) * TILE) this.target = null;
      } else if (this.siegeOf < 0 && U.dist(this.x, this.y, this.home.x, this.home.y) > this.leash * 1.8) {
        this.target = null; this.returning = true;
      }
      return;
    }

    if (this.kind === 'ally') {
      const allies = Game.allies(), si = Math.max(0, allies.indexOf(this)), ring = si < 5 ? 0 : 1;
      const ang = (ring ? (si - 5) / Math.max(1, allies.length - 5) : si / Math.min(5, allies.length)) * Math.PI * 2 + 0.6 + ring * 0.6;
      const hold = G.order === 'hold' && G.holdPos;
      const bx = hold ? G.holdPos.x : P.x, by = hold ? G.holdPos.y : P.y;
      const fx = bx + Math.cos(ang) * (44 + ring * 34), fy = by + Math.sin(ang) * (30 + ring * 24);
      if (hold) { if (U.dist(this.x, this.y, fx, fy) > 18) this.moveToward(fx, fy, sp * 0.8, dt); return; }
      const dp = U.dist(this.x, this.y, P.x, P.y);
      if (dp > 22 * TILE) { const s = freeSpotNear(P.x, P.y, 60); this.x = s.x; this.y = s.y; }
      else if (U.dist(this.x, this.y, fx, fy) > 18) this.moveToward(fx, fy, sp * (dp > 5 * TILE ? 1.1 : 0.75), dt);
      return;
    }
    if (this.kind === 'villager' && this.npc && NPCWork.update(this, dt, sp)) return;
    if (this.returning) {
      this.moveToward(this.home.x, this.home.y, sp * 0.8, dt);
      if (U.dist(this.x, this.y, this.home.x, this.home.y) < 2 * TILE) this.returning = false;
      return;
    }
    this.wander(dt, sp);
  }

  draw(ctx, cx, cy) {
    const x = this.x - cx, y = this.y - cy;
    const hurt = this.hurt > 0;
    switch (this.kind) {
      case 'deer': case 'wolf': case 'boar': drawAnimal(ctx, x, y, this.kind, this.dir, this.moving, this.anim, hurt); break;
      case 'spider': drawSpider(ctx, x, y, 1, this.anim, hurt, '#2a2028'); break;
      case 'chicken': case 'cow': case 'sheep': drawFarmAnimal(ctx, x, y, this.kind, this.dir, this.moving, this.anim); break;
      case 'caravan': drawCaravan(ctx, x, y, this.dir, this.anim, this.moving, this.car && this.car.owner === 'player' ? PLAYER_COLOR : Game.civColor(this.civ), hurt); break;
      case 'ram_e': case 'catapult_e': drawEngine(ctx, x, y, this.kind, this.dir, this.anim, this.moving, hurt, this.swing, this.side); break;
      case 'champion':
        drawHuman(ctx, x, y, { scale: 1.12, body: '#7a1f2a', legs: '#2a2420', hair: '#2a1a12', armor: '#c8a040', helmet: '#d8b860', weapon: '#d8d8e0', wlen: 20, shield: '#8a1a1a',
          aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      case 'spider_queen': drawSpider(ctx, x, y, 2.1, this.anim, hurt, '#4a1f5a'); break;
      case 'bat': drawBat(ctx, x, y, this.anim, hurt); break;
      case 'dragon': drawDragon(ctx, x, y, this.dir, this.anim, hurt); break;
      case 'skeleton': case 'skel_king':
        drawHuman(ctx, x, y, { scale: this.kind === 'skel_king' ? 1.5 : 1, body: '#d8d4c8', legs: '#c8c4b8', skin: '#e8e4d8', hair: '#e8e4d8', crown: this.kind === 'skel_king',
          cape: this.kind === 'skel_king' ? '#4a1f5a' : null, weapon: this.archer ? '#8b5a2b' : '#9a9a9a', wlen: this.archer ? 10 : 18, aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      case 'troll':
        drawHuman(ctx, x, y, { scale: 1.9, body: '#5a6a3a', legs: '#3a4a2a', skin: '#7a8a5a', hair: '#3a4a2a', weapon: '#6a5a3a', wlen: 22, aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      case 'rebel':
        drawHuman(ctx, x, y, { body: this.famColor || '#7a3a2a', legs: '#2a2420', hair: '#2a1a12', cap: '#3a2a1a', armor: '#6a6a70', weapon: this.archer ? '#8b5a2b' : '#a0a0a8', wlen: this.archer ? 10 : 17,
          aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      case 'bandit':
        drawHuman(ctx, x, y, { body: '#3b2b2b', legs: '#2a1f1a', hair: '#1a1a1a', hood: '#4a1f1f', weapon: '#9a9a9a', wlen: 16, aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      case 'guard': {
        const col = Game.civColor(this.civ);
        drawHuman(ctx, x, y, { body: col, legs: '#3a3a40', helmet: '#9aa0a8', armor: '#8d949c', weapon: '#cfd6dd', wlen: 20, shield: col, aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      }
      case 'lord': {
        const col = Game.civColor(this.civ);
        const lk = this.npc ? People.look(this.npc) : {};
        drawHuman(ctx, x, y, { scale: 1.3, body: col, legs: '#2a2a30', cape: U.shade(col, -0.2), crown: true, armor: '#d9dee3', weapon: '#ffd54a', wlen: 24,
          hair: lk.hair, hairStyle: lk.hairStyle, beard: lk.beard, beardStyle: lk.beardStyle, skirt: lk.skirt, skin: lk.skin, aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        break;
      }
      case 'villager': case 'ally': case 'sentry': {
        if (this.npc) {
          const lk = People.look(this.npc);
          if (this.npc.capanga && !this.npc.equip.torso) lk.body = PLAYER_COLOR;
          // civis trabalhando: machado, picareta ou as mãos, e a carga nas costas
          const wt = this.kind === 'villager' ? NPCWork.toolOf(this) : null;
          const work = wt ? { weapon: '#7a5230', wlen: 12, tool: wt, toolCol: '#9a9a9a' } : {};
          drawHuman(ctx, x, y, Object.assign(lk, work, { aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt }));
          if (this.work && this.work.carry) { ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ITEMS[this.work.carry.k].icon, x - this.dir * 9, y - 30); }
        } else {
          drawHuman(ctx, x, y, { body: PLAYER_COLOR, legs: '#3a3a40', helmet: '#9aa0a8', armor: '#8d949c', weapon: '#cfd6dd', wlen: 20, shield: '#a8791a', aim: this.aim, swing: this.swing, dir: this.dir, moving: this.moving, anim: this.anim, hurt });
        }
        break;
      }
    }
    if ((this.hp < this.maxHp || this.kind === 'lord') && !this.def.boss && this.faction !== 'pet') {
      const bw = this.kind === 'lord' ? 50 : 26;
      const top = this.kind === 'lord' ? 52 : 42;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - bw / 2 - 1, y - top - 1, bw + 2, 5);
      ctx.fillStyle = fac(this) === 'player' ? '#5fd35f' : '#e04848';
      ctx.fillRect(x - bw / 2, y - top, bw * Math.max(0, this.hp / this.maxHp), 3);
    }
    if (this.kind === 'lord') {
      ctx.font = 'bold 12px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText(this.name, x + 1, y - 57);
      ctx.fillStyle = '#ffd54a'; ctx.fillText(this.name, x, y - 58);
      ctx.textAlign = 'left';
    }
  }
}

// ------------------------------------------------------------------ desenho
function drawHuman(ctx, x, y, o) {
  const s = o.scale || 1;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  const step = o.moving ? Math.sin(o.anim * 12) * 3 : 0;
  const hurt = o.hurt;
  const C = col => hurt ? '#ff8080' : col;
  if (o.cape) { ctx.fillStyle = C(o.cape); ctx.fillRect(-8, -22, 16, 18); }
  ctx.fillStyle = C(o.legs || '#3b2a1a');
  if (o.seated) { ctx.fillRect(-6, -9, 12, 4); ctx.fillRect(-7, -9, 4, 9); }
  else {
    ctx.fillRect(-5, -9, 4, 9 - Math.max(0, step));
    ctx.fillRect(1, -9, 4, 9 - Math.max(0, -step));
  }
  if (o.boots) {
    ctx.fillStyle = C(o.boots);
    ctx.fillRect(-6, -3 - Math.max(0, step), 5, 3); ctx.fillRect(1, -3 - Math.max(0, -step), 5, 3);
  }
  ctx.fillStyle = C(o.body);
  ctx.fillRect(-7, -22, 14, 14);
  if (o.skirt) { ctx.fillStyle = C(U.shade(o.body, -0.08)); ctx.fillRect(-8, -12, 16, 7); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-8, -6, 16, 1); }
  if (o.armor) {
    ctx.fillStyle = C(o.armor); ctx.fillRect(-7, -22, 14, 9);
    ctx.fillStyle = C(U.shade(o.armor, 0.12)); ctx.fillRect(-9, -22, 4, 4); ctx.fillRect(5, -22, 4, 4);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-7, -12, 14, 2);
  // braços
  ctx.fillStyle = C(o.armor || o.body);
  ctx.fillRect(-10, -20 + (o.moving ? step * 0.5 : 0), 3, 9);
  ctx.fillRect(7, -20 - (o.moving ? step * 0.5 : 0), 3, 9);
  // cabeça
  const hs = o.hairStyle || 'short', hcol = C(o.hair || '#5a3a1a');
  if (!o.hood && !o.helmet) {
    ctx.fillStyle = hcol;
    if (hs === 'long') ctx.fillRect(-6, -33, 12, 13);
    if (hs === 'braids') { ctx.fillRect(-7, -31, 3, 15); ctx.fillRect(4, -31, 3, 15); }
    if (hs === 'ponytail') ctx.fillRect(o.dir > 0 ? -8 : 5, -32, 3, 11);
    if (hs === 'curly') ctx.fillRect(-7, -35, 14, 9);
  }
  ctx.fillStyle = C(o.skin || '#f0c896'); ctx.fillRect(-5, -32, 10, 10);
  ctx.fillStyle = '#2a1a10';
  if (o.dir > 0) { ctx.fillRect(1, -28, 2, 2); ctx.fillRect(-2, -28, 2, 2); }
  else { ctx.fillRect(-3, -28, 2, 2); ctx.fillRect(0, -28, 2, 2); }
  if (o.hood) { ctx.fillStyle = C(o.hood); ctx.fillRect(-6, -34, 12, 5); ctx.fillRect(-6, -34, 2, 10); ctx.fillRect(4, -34, 2, 10); }
  else if (o.cap) { ctx.fillStyle = C(o.hair || '#5a3a1a'); ctx.fillRect(o.dir > 0 ? -5 : 3, -32, 2, 5); ctx.fillStyle = C(o.cap); ctx.fillRect(-6, -35, 12, 5); ctx.fillRect(o.dir > 0 ? -6 : 4, -33, 2, 5); }
  else if (o.helmet) { ctx.fillStyle = C(o.helmet); ctx.fillRect(-6, -35, 12, 6); ctx.fillRect(-1, -29, 2, 4); }
  else {
    ctx.fillStyle = hcol;
    switch (hs) {
      case 'long': ctx.fillRect(-6, -35, 12, 5); ctx.fillRect(o.dir > 0 ? -6 : 4, -33, 2, 12); break;
      case 'bald': ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-5, -32, 10, 2); break;
      case 'mohawk': ctx.fillRect(-1, -38, 3, 7); break;
      case 'curly': ctx.fillRect(-6, -36, 12, 5); ctx.fillRect(-7, -33, 2, 4); ctx.fillRect(5, -33, 2, 4); break;
      case 'bun': ctx.fillRect(-5, -34, 10, 3); ctx.fillRect(-2, -38, 5, 4); break;
      case 'braids': case 'ponytail': ctx.fillRect(-5, -34, 10, 3); break;
      default: ctx.fillRect(-5, -34, 10, 4); ctx.fillRect(o.dir > 0 ? -5 : 3, -34, 2, 7);
    }
  }
  const bs = o.beardStyle || (o.beard ? 'short' : 'none');
  if (bs !== 'none' && !o.hood) {
    ctx.fillStyle = hcol;
    if (bs === 'short') { ctx.fillRect(-4, -25, 8, 3); ctx.fillRect(o.dir > 0 ? 3 : -5, -27, 2, 3); }
    if (bs === 'full') { ctx.fillRect(-5, -26, 10, 5); ctx.fillRect(-5, -29, 2, 4); ctx.fillRect(3, -29, 2, 4); }
    if (bs === 'mustache') ctx.fillRect(-3, -25, 6, 1);
    if (bs === 'goatee') { ctx.fillRect(-3, -25, 6, 1); ctx.fillRect(-1, -24, 3, 3); }
    if (bs === 'long') { ctx.fillRect(-4, -26, 8, 4); ctx.fillRect(-3, -22, 6, 5); }
  }
  if (o.crown) {
    ctx.fillStyle = '#ffd54a';
    ctx.fillRect(-6, -36, 12, 3);
    ctx.fillRect(-6, -39, 2, 3); ctx.fillRect(-1, -40, 2, 4); ctx.fillRect(4, -39, 2, 3);
  }
  // escudo
  if (o.shieldUp && o.shield) {
    // escudo erguido na frente do corpo (bloqueando)
    const sx = o.dir > 0 ? 5 : -13;
    ctx.fillStyle = '#3a2410'; ctx.fillRect(sx - 1, -26, 10, 17);
    ctx.fillStyle = C(o.shield); ctx.fillRect(sx, -25, 8, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sx + 1, -24, 2, 13);
  } else if (o.shield) {
    const sx = o.dir > 0 ? -12 : 7;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(sx, -21, 6, 11);
    ctx.fillStyle = C(o.shield); ctx.fillRect(sx + 1, -20, 4, 9);
  }
  // arma
  let ang;
  if (o.swing > 0) ang = o.aim - 1.3 + (1 - o.swing / 0.25) * 2.6;
  else ang = o.dir > 0 ? 0.9 : Math.PI - 0.9;
  if (o.rod) {
    // vara de pesca erguida (a linha é desenhada à parte)
    ctx.save(); ctx.translate(o.dir > 0 ? 7 : -7, -15); ctx.rotate(o.dir > 0 ? -0.6 : Math.PI + 0.6);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(0, -1, 26, 2); ctx.fillStyle = '#c9a050'; ctx.fillRect(4, -1.5, 3, 3);
    ctx.restore();
  } else if (o.weapon || o.swing > 0) {
    ctx.save();
    ctx.translate(o.dir > 0 ? 7 : -7, -15);
    ctx.rotate(ang);
    const len = o.wlen || 8;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(0, -1.5, 6, 3);
    if (o.weapon) { ctx.fillStyle = o.weapon; ctx.fillRect(5, -2, len, 4); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(6, -2, len - 2, 1); }
    if (o.tool === 'axe') { ctx.fillStyle = o.toolCol || '#9a9a9a'; ctx.fillRect(len - 2, -6, 6, 8); }
    if (o.tool === 'pick') { ctx.fillStyle = o.toolCol || '#9a9a9a'; ctx.fillRect(len, -8, 3, 16); }
    ctx.restore();
  }
  if (o.swing > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,' + (o.swing / 0.25 * 0.5) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -15, 28, o.aim - 1.0, o.aim + 1.0); ctx.stroke();
  }
  ctx.restore();
}

function drawAnimal(ctx, x, y, kind, dir, moving, anim, hurt) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
  const step = moving ? Math.sin(anim * 14) * 2.5 : 0;
  const pal = {
    deer: { body: '#a0703c', dark: '#6e4a26', legs: 10, h: 6 },
    wolf: { body: '#7d7f86', dark: '#55575c', legs: 8, h: 6 },
    boar: { body: '#5a3b2a', dark: '#3a2618', legs: 6, h: 8 },
  }[kind];
  const body = hurt ? '#ff8080' : pal.body;
  ctx.fillStyle = pal.dark;
  ctx.fillRect(-9, -pal.legs, 3, pal.legs - step); ctx.fillRect(-4, -pal.legs, 3, pal.legs + step);
  ctx.fillRect(4, -pal.legs, 3, pal.legs - step); ctx.fillRect(8, -pal.legs, 3, pal.legs + step);
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(0, -pal.legs - pal.h / 2 - 1, 12, pal.h, 0, 0, Math.PI * 2); ctx.fill();
  const hy = -pal.legs - pal.h - 2;
  if (kind === 'deer') {
    ctx.fillRect(9, hy - 8, 4, 10); ctx.fillRect(10, hy - 12, 8, 6);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(15, hy - 11, 2, 2);
    ctx.fillStyle = '#d9c39a'; ctx.fillRect(10, hy - 18, 2, 6); ctx.fillRect(8, hy - 20, 2, 3); ctx.fillRect(12, hy - 20, 2, 3); ctx.fillRect(14, hy - 17, 2, 5);
    ctx.fillStyle = '#f2efe6'; ctx.fillRect(-13, hy + 2, 3, 3);
  } else if (kind === 'wolf') {
    ctx.fillRect(9, hy - 2, 9, 7); ctx.fillRect(16, hy + 1, 5, 4);
    ctx.fillStyle = pal.dark; ctx.fillRect(10, hy - 5, 3, 4); ctx.fillRect(14, hy - 5, 3, 4);
    ctx.fillStyle = '#ffdc4a'; ctx.fillRect(14, hy, 2, 2);
    ctx.fillStyle = body; ctx.save(); ctx.translate(-11, hy + 4); ctx.rotate(-0.5 + Math.sin(anim * 6) * 0.2); ctx.fillRect(-9, -2, 10, 4); ctx.restore();
  } else {
    ctx.fillRect(9, hy + 1, 9, 9);
    ctx.fillStyle = '#c99a8a'; ctx.fillRect(17, hy + 5, 3, 4);
    ctx.fillStyle = '#f2efe6'; ctx.fillRect(16, hy + 8, 2, 4);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(13, hy + 3, 2, 2);
    ctx.fillStyle = pal.dark; for (let k = -8; k < 8; k += 3) ctx.fillRect(k, -pal.legs - pal.h * 2 + 1, 2, 3);
  }
  ctx.restore();
}

const TOOL_COLORS = ['#9a9a9a', '#8a8a80', '#cd8a4a', '#9aa0a8', '#e0e6ec'];

function playerLook() {
  const it = k => (P.equip[k] ? ITEMS[P.equip[k]] : null);
  const head = it('head'), torso = it('torso'), legs = it('legs'), feet = it('feet');
  const wep = it('weapon'), tool = it('tool');
  const kingOf = G.civs.some(c => c.ruler === 'player');
  const metalHead = head && !['linen_hood', 'leather_cap'].includes(P.equip.head);
  const gathering = !!P.toolAnim && P.swing > 0;
  const female = P.sex === 'f';
  return {
    body: torso ? torso.color : ((P.style && P.style.tunic) || (female ? '#8f3d5e' : '#3d6b8f')), legs: legs ? legs.color : ((P.style && P.style.pants) || '#4a3a2a'),
    hair: People.hairAt(P.hairBase || '#4a2a12', P.age || 25), hairStyle: (P.style && P.style.hair) || (female ? 'long' : 'short'),
    beardStyle: female ? 'none' : ((P.style && P.style.beard) || ((P.age || 25) >= 22 ? 'short' : 'none')), skirt: female && !legs && !(P.style && P.style.noSkirt), skin: P.skin || '#f0c896',
    shield: P.equip.shield ? ITEMS[P.equip.shield].color : null, shieldUp: !!P.blocking,
    armor: torso && torso.def >= 3 ? torso.color : null,
    boots: feet ? feet.color : null,
    helmet: metalHead && P.equip.head !== 'royal_helm' ? head.color : null,
    cap: head && !metalHead ? head.color : null,
    crown: kingOf || P.equip.head === 'royal_helm', cape: kingOf ? '#8e1f2a' : null,
    rod: !!P.fishing,
    weapon: gathering ? '#7a5230' : (wep ? wep.color : null), wlen: gathering ? 12 : (wep ? wep.len : 8),
    tool: gathering ? P.toolAnim : null, toolCol: tool ? TOOL_COLORS[tool.tier] : null,
    aim: P.aim, swing: P.swing, dir: P.dir, moving: P.moving, anim: P.anim, hurt: P.hurt > 0,
  };
}

function drawBoat(ctx, x, y, dir, anim, moving, front) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + Math.sin(anim * 3) * 1.5));
  ctx.scale(dir, 1);
  if (!front) {
    if (moving) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-26, 0, 9, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4a2c12'; ctx.beginPath(); ctx.ellipse(0, -3, 23, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e1c0c'; ctx.beginPath(); ctx.ellipse(0, -4, 18, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#7a4f2a';
    ctx.beginPath(); ctx.moveTo(-23, -4); ctx.quadraticCurveTo(0, 9, 25, -6); ctx.lineTo(22, 1); ctx.quadraticCurveTo(0, 13, -21, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a6a3c'; ctx.fillRect(-15, 0, 30, 2);
    const a = Math.sin(anim * (moving ? 8 : 1.5)) * 0.5;
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(2 + Math.cos(1.1 + a) * 20, -12 + Math.sin(1.1 + a) * 16); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(ctx, cx, cy) {
  const x = P.x - cx, y = P.y - cy;
  if (P.sailing) drawBoat(ctx, x, y, P.dir, P.anim, P.moving, false);
  if (P.mounted && P.horse) {
    drawHorse(ctx, x, y, P.dir, P.anim, P.moving, (P.horse.color || '#7a4a26'), P.cart);
    drawHuman(ctx, x - P.dir * 2, y - 17, Object.assign(playerLook(), { seated: true, moving: false, skirt: false }));
  } else
  drawHuman(ctx, x, y - (P.sailing ? 5 : 0), playerLook());
  if (P.sailing) drawBoat(ctx, x, y, P.dir, P.anim, P.moving, true);
  // linha e boia de pesca
  const f = P.fishing;
  if (f) {
    const bite = f.state === 'bite';
    const bx = f.x * TILE - cx, by = f.y * TILE - cy + (bite ? 3 : Math.sin(P.anim * 4) * 1.5);
    const tipX = x + P.dir * 27, tipY = y - 34 - (P.sailing ? 5 : 0);
    ctx.strokeStyle = 'rgba(240,240,240,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + 10, bx, by); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(bx, by + 2, 6 + (bite ? 4 : 0), 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e03030'; ctx.fillRect(bx - 2, by - 4, 4, 3);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 2, by - 1, 4, 2);
    if (bite) {
      ctx.font = 'bold 26px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText('!', x + 1, y - 51);
      ctx.fillStyle = '#ffd54a'; ctx.fillText('!', x, y - 52);
      ctx.textAlign = 'left';
    }
  }
}

function drawFarmAnimal(ctx, x, y, kind, dir, moving, anim) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  const st = moving ? Math.sin(anim * 14) * 2 : 0;
  if (kind === 'chicken') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a030'; ctx.fillRect(-2, -3, 1, 3 - st); ctx.fillRect(1, -3, 1, 3 + st);
    ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.ellipse(0, -7, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(3, -13, 4, 5); ctx.fillStyle = '#d83020'; ctx.fillRect(4, -15, 2, 2);
    ctx.fillStyle = '#e8a030'; ctx.fillRect(7, -11, 2, 1); ctx.fillStyle = '#000'; ctx.fillRect(5, -12, 1, 1);
  } else {
    const cow = kind === 'cow', w = cow ? 15 : 11, h = cow ? 8 : 7;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, w, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cow ? '#3a2a20' : '#6a5a4a';
    for (const lx of [-w + 3, -w + 7, w - 8, w - 4]) ctx.fillRect(lx, -9, 2, 9 + (lx % 2 ? st : -st));
    ctx.fillStyle = cow ? '#f2efe6' : '#ecebe2';
    if (cow) { ctx.fillRect(-w, -18, w * 2, h + 3); ctx.fillStyle = '#2a2018'; ctx.fillRect(-6, -17, 6, 5); ctx.fillRect(4, -14, 5, 4); }
    else { ctx.beginPath(); ctx.ellipse(0, -14, w, h, 0, 0, Math.PI * 2); ctx.fill(); for (let k = -8; k < 9; k += 4) { ctx.beginPath(); ctx.arc(k, -19, 3, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = cow ? '#f2efe6' : '#3a3028';
    ctx.fillRect(w - 2, cow ? -20 : -19, cow ? 8 : 6, cow ? 8 : 6);
    ctx.fillStyle = '#000'; ctx.fillRect(w + 2, cow ? -18 : -17, 1, 1);
    if (cow) { ctx.fillStyle = '#e8c8b0'; ctx.fillRect(w + 2, -15, 4, 3); ctx.fillStyle = '#c9b48a'; ctx.fillRect(w - 1, -22, 2, 2); ctx.fillRect(w + 4, -22, 2, 2); }
  }
  ctx.restore();
}
