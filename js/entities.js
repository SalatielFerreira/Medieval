'use strict';
// Entidades: movimento, IA das criaturas e desenho de personagens e animais.

function moveEnt(e, dx, dy) {
  const r = e.r * 0.8;
  let moved = false;
  if (dx) { const nx = e.x + dx; if (!World.blockedAt(nx, e.y, r, e.sailing) && !Arena.keepsOut(e, nx, e.y)) { e.x = nx; moved = true; } }
  if (dy) { const ny = e.y + dy; if (!World.blockedAt(e.x, ny, r, e.sailing) && !Arena.keepsOut(e, e.x, ny)) { e.y = ny; moved = true; } }
  return moved;
}

function freeSpotNear(px, py, radiusPx) {
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * radiusPx;
    const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (!World.blockedAt(x, y, 9) && !Arena.zoneAt(x, y)) return { x, y };
  }
  // sem lugar livre por perto: procura mais longe antes de desistir
  for (let k = 0; k < 40; k++) {
    const a = Math.random() * Math.PI * 2, d = radiusPx + Math.random() * Math.max(64, radiusPx * 2);
    const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d;
    if (!World.blockedAt(x, y, 9) && !Arena.zoneAt(x, y)) return { x, y };
  }
  return { x: px, y: py };
}

// Facção efetiva: guardas de um reino governado pelo jogador ficam do lado do jogador.
function fac(e) {
  if (e === P) return 'player';
  if (e.faction === 'civ') return e.civ < 0 || G.civs[e.civ].ruler === 'player' ? 'player' : 'civ' + e.civ;
  return e.faction;
}

// animais que fogem de você (não atacam)
const PREY_FLEE = ['deer', 'fox', 'rabbit', 'goat', 'camel'];
const PREDATORS = ['wolf', 'bear', 'croc'];
// a quer atacar b?
function hostile(a, b) {
  if (a.faction === 'pet' || b.faction === 'pet' || a.kind === 'caravan') return false;
  // no campo de batalha: cada lado ataca o outro
  if (a.battle && a.battle === b.battle) return a.civ !== b.civ && a.dmg > 0;
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
  // predadores (lobo, urso, crocodilo) atacam moradores e viajantes, podendo matá-los (não dentro dos lugares fechados)
  if (PREDATORS.includes(a.kind) && b.kind === 'villager' && b.npc && !b.placeNpc) return true;
  if (fa === fb || a.dmg <= 0 || b.kind === 'villager') return false;
  if (a.kind === 'boar') return a.provoked && fb === 'player';
  if (b.kind === 'deer' || b.kind === 'boar' || PREY_FLEE.includes(b.kind)) return false;
  if (fa === 'wild') return fb === 'player' || (!!a.raid && b.kind === 'guard');
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
  if (e.faction === 'pet' || e.faction === 'duelist') return false;
  if (e.faction === 'arena') return true;
  if (e.faction === 'engine') return e.side === 'enemy';
  if (e.faction === 'rebel') return true;
  if (e.tag && e.tag.startsWith('crw')) { const r = Families.revolt(+e.tag.slice(3)); if (r && !r.done && r.side === 'rebel') return true; }
  if (e.angry || e.hostileToPlayer) return true;
  if (e.npc && e.npc.hostile) return true;
  if (e.npc && Court.enemyPerson(e.npc)) return true;
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
      if (n.capanga) { const st = People.capangaStats(n); this.dmg = st.dmg; this.maxHp = this.hp = st.hp; }
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
    if (this.inRoom) return; // está lá dentro do lugar onde o herói entrou (sai com ele pela porta)
    // dormindo em casa (rotina dos moradores): só espera o dia chegar
    if (this.sleeping) { Routine.update(this, dt, 0); return; }
    // acompanhando o jogador (mercador perdido)
    if (this.escort) {
      this.anim += dt; this.hurt -= dt; this.moving = false;
      const dp = U.dist(this.x, this.y, P.x, P.y);
      if (dp > 20 * TILE) { const s = freeSpotNear(P.x, P.y, 60); this.x = s.x; this.y = s.y; }
      else if (dp > 46) this.moveToward(P.x - P.dir * 30, P.y + 8, 125, dt);
      return;
    }
    if (this.kind === 'caravan') { this.anim += dt; this.hurt -= dt; Caravans.move(this, dt); return; }
    if ((this.kind === 'ally' && Places.room() && Places.room().lay !== 'throne') || (this.kind === 'dog' && G.place)) { this.anim += dt; this.moving = false; return; } // os capangas esperam do lado de fora
    if (this.faction === 'engine') { if (this.battleCat) War.catUpdate(this, dt); else Sieges.engineUpdate(this, dt); return; }
    if (this.follow) { if (this.follow.dead) this.follow = null; else { this.home.x = this.follow.x - 24; this.home.y = this.follow.y + 14; } }
    // capangas: a ordem do grupo e a postura de cada um decidem de que distância eles atacam
    if ((this.kind === 'ally' || this.kind === 'sentry') && this.npc) {
      const ord = G.order || 'follow', st = STANCES[this.npc.stance] || STANCES.normal;
      const base = this.kind === 'sentry' ? 11 : ord === 'attack' ? 15 : ord === 'hold' ? 7 : 8;
      this.aggroOv = Math.max(3, base + st.aggro);
    }
    // moradores e animais não ficam amontoados: afastam-se uns dos outros
    if (this.kind === 'villager' || this.faction === 'pet' || this.kind === 'ally' || this.kind === 'sentry') {
      for (const o of G.ents) {
        if (o === this || o.dead || o.sleeping || (o.kind !== this.kind && !(this.faction === 'pet' && o.faction === 'pet'))) continue;
        const dx = this.x - o.x, dy = this.y - o.y, dd = dx * dx + dy * dy;
        if (dd < 900 && dd > 0.01) { const L = Math.sqrt(dd); moveEnt(this, dx / L * 40 * dt, dy / L * 40 * dt); }
      }
    }
    this.atkCd -= dt; this.hurt -= dt; this.scanT -= dt; this.anim += dt; this.swing = Math.max(0, this.swing - dt);
    this.moving = false;
    const sp = d.speed * World.speedAt(this.x, this.y) * (this.spMul || 1);
    if (this.placeNpc && this.kind === 'villager' && Places.npcUpdate(this, dt, sp) !== 'fight') return;

    if (PREY_FLEE.includes(this.kind)) {
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
        if (ord === 'hold' && G.holdPos ? U.dist(this.x, this.y, G.holdPos.x, G.holdPos.y) > 9 * TILE : U.dist(this.x, this.y, P.x, P.y) > ((this.npc && STANCES[this.npc.stance] ? STANCES[this.npc.stance].chase : 11) + (ord === 'attack' ? 7 : 0)) * TILE) this.target = null;
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
    if (this.kind === 'villager' && this.npc && (Routine.update(this, dt, sp) || NPCWork.update(this, dt, sp))) return;
    if (this.returning) {
      this.moveToward(this.home.x, this.home.y, sp * 0.8, dt);
      if (U.dist(this.x, this.y, this.home.x, this.home.y) < 2 * TILE) this.returning = false;
      return;
    }
    this.wander(dt, sp);
  }

  draw(ctx, cx, cy) {
    if (this.sleeping || this.inRoom) return;
    const x = this.x - cx, y = this.y - cy;
    const hurt = this.hurt > 0;
    switch (this.kind) {
      case 'deer': case 'wolf': case 'boar': case 'fox': case 'rabbit': case 'goat': case 'bear': case 'moose': case 'camel': case 'croc': drawAnimal(ctx, x, y, this.kind, this.dir, this.moving, this.anim, hurt); break;
      case 'dog': drawAnimal(ctx, x, y, 'wolf', this.dir, this.moving, this.anim, hurt); ctx.fillStyle = '#c8302a'; ctx.fillRect(Math.round(x + this.dir * 6) - 3, Math.round(y) - 15, 6, 2); break; // cão de guarda (coleira vermelha)
      case 'spider': drawSpider(ctx, x, y, 1, this.anim, hurt, '#2a2028'); break;
      case 'chicken': case 'cow': case 'sheep': drawFarmAnimal(ctx, x, y, this.kind, this.dir, this.moving, this.anim); break;
      case 'caravan': drawCaravan(ctx, x, y, this.dir, this.anim, this.moving, this.car && this.car.owner === 'player' ? PLAYER_COLOR : Game.civColor(this.civ), hurt); break;
      case 'ram_e': case 'catapult_e': drawEngine(ctx, x, y, this.kind, this.dir, this.anim, this.moving, hurt, this.swing, this.side); break;
      case 'champion':
        drawHuman(ctx, x, y, { scale: 1.12, body: this.body || '#7a1f2a', legs: '#2a2420', hair: '#2a1a12', armor: '#c8a040', helmet: '#d8b860', weapon: '#d8d8e0', wlen: 20, shield: '#8a1a1a',
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
        // cavaleiro montado (campo de batalha)
        if (this.mounted) { drawHorse(ctx, x, y, this.dir, this.anim, this.moving, '#5a3a22', false); drawHuman(ctx, x - this.dir * 2, y - 17, { body: col, legs: '#3a3a40', helmet: '#c8ccd2', armor: '#aab0b8', weapon: '#cfd6dd', wlen: 24, shield: col, seated: true, aim: this.aim, swing: this.swing, dir: this.dir, moving: false, anim: this.anim, hurt }); break; }
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
// ---------------------------------------------------------------- desenho das pessoas e dos animais
// Formas arredondadas com luz e sombra (lado da frente mais claro, lado de trás mais escuro), rosto com
// olhos, sobrancelhas, nariz e boca, cabelo com volume, roupas com cinto e dobras, e animais com anatomia
// (pescoço, patas com juntas, focinho, orelhas e cauda). Tudo é desenhado olhando para +x e espelhado.
const SHADE_CACHE = new Map();
function shd(c, k) { const key = c + '|' + k; let v = SHADE_CACHE.get(key); if (v === undefined) { v = U.shade(c, k); if (SHADE_CACHE.size > 4000) SHADE_CACHE.clear(); SHADE_CACHE.set(key, v); } return v; }
function rrPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function rr(ctx, x, y, w, h, r, col) { ctx.fillStyle = col; rrPath(ctx, x, y, w, h, r); ctx.fill(); }
function ell(ctx, x, y, rx, ry, col, rot) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); ctx.fill(); }
function poly(ctx, pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); }
function limb(ctx, x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function limb2(ctx, x1, y1, x2, y2, x3, y3, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke(); }

// corpo da pessoa (tudo menos a arma e a sombra), já na origem: pés em (0, 0), olhando para +x e espelhado por dir.
// Rosto com íris, pálpebra, cílios e lábios; cabelo e barba com volume e mechas; roupas com gola, cadarço, barra,
// punhos e algibeira; armadura com cota de malha; botas com cano dobrado.
function humanBody(ctx, o, dir, t) {
  const hurt = o.hurt, fem = !!(o.fem || o.skirt);
  const C = c => hurt ? '#ff8a8a' : c, S = (c, k) => shd(C(c), k);
  const step = o.moving ? Math.sin(t * 12) : 0;
  const bob = o.moving ? -Math.abs(Math.sin(t * 12)) * 1.1 : Math.sin(t * 2.2) * 0.3;
  const body = o.body || '#7a6a50', legs = o.legs || '#3b2a1a', skin = o.skin || '#f0c896', hair = o.hair || '#5a3a1a';
  const sleeve = o.armor || body, holding = !!(o.weapon || o.swing > 0 || o.rod);
  const trim = S(body, fem ? 0.3 : -0.34), hc = C(hair), hd = shd(hc, -0.22), hl = shd(hc, 0.26);
  const seed = ((hair + skin).split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0);
  const eyeCol = ['#5a3a20', '#3a5a8a', '#4a7a3a', '#6a4a2a', '#2a2a2a'][seed % 5];

  ctx.save(); ctx.scale(dir, 1);
  // ---- capa (atrás de tudo), com forro e broche
  if (o.cape) {
    const sw = o.moving ? Math.sin(t * 12) * 1.2 : 0;
    poly(ctx, [-6, -23 + bob, 5, -23 + bob, 6 - sw, -3, -2 - sw, -1.5, -10 - sw, -3], S(o.cape, -0.18));
    poly(ctx, [-6, -23 + bob, 2, -23 + bob, -1 - sw, -3, -10 - sw, -3.5], C(o.cape));
    limb(ctx, -8 - sw, -10, -9.5 - sw, -4, 0.8, S(o.cape, -0.32)); limb(ctx, -4.5 - sw, -12, -5.4 - sw, -3.5, 0.7, S(o.cape, 0.14));
    ctx.fillStyle = S(o.cape, -0.4); ctx.fillRect(-10 - sw, -3.6, 9, 0.8);
  }
  // ---- escudo nas costas
  if (o.shield && !o.shieldUp) {
    poly(ctx, [-11.5, -22 + bob, -4.5, -22 + bob, -4.5, -15 + bob, -8, -9.5 + bob, -11.5, -15 + bob], S(o.shield, -0.4));
    poly(ctx, [-10.8, -21.2 + bob, -5.2, -21.2 + bob, -5.2, -15.3 + bob, -8, -10.8 + bob, -10.8, -15.3 + bob], C(o.shield));
    limb(ctx, -10.2, -20.4 + bob, -5.8, -20.4 + bob, 0.6, S(o.shield, 0.25));
    ell(ctx, -8, -16.5 + bob, 1.3, 1.3, S(o.shield, 0.35));
  }
  // ---- braço de trás (manga, punho e mão)
  const bArm = o.moving ? Math.sin(t * 12 + Math.PI) * 0.55 : 0.12;
  const bhx = -3.6 + Math.sin(bArm) * 5, bhy = -21 + bob + Math.cos(bArm) * 7;
  limb(ctx, -3.6, -21 + bob, bhx, bhy, 3.4, S(sleeve, -0.25));
  limb(ctx, -3.6 + (bhx + 3.6) * 0.78, -21 + bob + (bhy + 21 - bob) * 0.78, bhx, bhy - 0.4, 3.6, o.armor ? S(o.armor, -0.1) : S(sleeve, -0.34));
  ell(ctx, bhx, bhy + 0.7, 1.4, 1.5, S(skin, -0.18));
  // ---- pernas, joelhos e botas
  if (o.seated) {
    limb2(ctx, -2, -10, 6, -10, 6.5, -2, 4.2, S(legs, -0.15));
    limb2(ctx, 1, -10, 8, -10, 8.5, -2, 4.2, C(legs));
    rr(ctx, 6.5, -3, 4.6, 2.6, 1.2, C(o.boots || '#3b2a1e'));
  } else {
    const lift = k => Math.max(0, k) * 1.6;
    const bx = -1.6 - step * 2.2, fx = 1.4 + step * 2.2;
    rr(ctx, bx - 2.1, -10.5, 4.2, 10.5 - lift(-step), 1.6, S(legs, -0.22));
    rr(ctx, fx - 2.1, -10.5, 4.2, 10.5 - lift(step), 1.6, C(legs));
    rr(ctx, fx + 0.6, -10, 1.2, 8.5 - lift(step), 0.6, S(legs, 0.14));
    ell(ctx, fx + 0.4, -5.6 - lift(step) * 0.5, 1.4, 0.7, S(legs, -0.12));   // dobra do joelho
    const shoe = C(o.boots || '#3b2a1e'), bh = o.boots ? 5 : 2.8;
    for (const [lx, l, front] of [[bx, lift(-step), false], [fx, lift(step), true]]) {
      const sc = front ? shoe : shd(shoe, -0.18);
      rr(ctx, lx - 2.4, -bh - l, 5.8, bh, 1.2, sc);
      rr(ctx, lx + 1.6, -2.4 - l, 2.4, 2.4, 1.1, sc);                          // bico
      if (o.boots) { ctx.fillStyle = shd(sc, 0.22); ctx.fillRect(lx - 2.4, -bh - l, 5.8, 1.2); }   // cano dobrado
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(lx - 2.4, -0.9 - l, 6.4, 0.9);              // sola
      if (front) { ctx.fillStyle = shd(sc, 0.3); ctx.fillRect(lx + 0.4, -bh - l + (o.boots ? 1.6 : 0.4), 0.8, 0.6); }
    }
  }
  ctx.translate(0, bob);
  // ---- saia (vestido) ou aba da túnica
  if (o.skirt) {
    poly(ctx, [-6.4, -12.5, 6.4, -12.5, 8.4, -2.4, -8.4, -2.4], S(body, -0.05));
    poly(ctx, [-6.4, -12.5, -3, -12.5, -4.4, -2.4, -8.4, -2.4], S(body, -0.18));
    for (const [x1, x2, k] of [[-1.4, -2, -0.22], [2, 2.8, -0.2], [4.6, 5.8, 0.12]]) limb(ctx, x1, -11.6, x2, -3.2, 0.7, S(body, k));
    ctx.fillStyle = trim; ctx.fillRect(-8.4, -3.6, 16.8, 1.2);
    ctx.fillStyle = S(body, -0.3); ctx.fillRect(-8.4, -2.6, 16.8, 0.4);
  } else if (!o.seated) {
    poly(ctx, [-6.6, -12.2, 6.6, -12.2, 7.3, -6.4, -7.3, -6.4], S(body, -0.06));
    poly(ctx, [-6.6, -12.2, -3, -12.2, -3.4, -6.4, -7.3, -6.4], S(body, -0.2));
    ctx.fillStyle = trim; ctx.fillRect(-7.3, -7.4, 14.6, 1);
    limb(ctx, 1.2, -10.6, 1.4, -6.6, 0.6, S(body, -0.28));                     // abertura da túnica
  }
  // ---- tronco: luz, sombra, gola, cadarço e dobras
  rr(ctx, -6.6, -23.6, 13.2, 14, 3.2, C(body));
  rr(ctx, -6.6, -23.6, 4.2, 14, 3, S(body, -0.2));
  rr(ctx, 3.4, -22.4, 2.2, 11, 1.1, S(body, 0.16));
  limb(ctx, -0.8, -19, -0.2, -13.4, 0.6, S(body, -0.16)); limb(ctx, 3, -15.8, 4.6, -13.6, 0.5, S(body, -0.14));
  if (fem) {
    rr(ctx, -0.8, -23.8, 5.6, 2.8, 1.3, S(skin, -0.04));                       // decote redondo
    ctx.fillStyle = trim; ctx.fillRect(-1, -21.4, 6, 0.8);
    ctx.strokeStyle = S(body, -0.22); ctx.lineWidth = 0.3; ctx.beginPath();     // cadarço do corpete
    for (let y = -20.2; y < -15.5; y += 1.6) { ctx.moveTo(0.8, y); ctx.lineTo(2.8, y + 1.2); ctx.moveTo(2.8, y); ctx.lineTo(0.8, y + 1.2); }
    ctx.stroke();
  } else {
    poly(ctx, [0, -23.6, 4.2, -23.6, 2, -20.2], S(skin, -0.05));               // decote em V
    limb(ctx, 0, -23.4, 2, -20.2, 0.7, trim); limb(ctx, 4.2, -23.4, 2, -20.2, 0.7, trim);
    ctx.strokeStyle = S(body, -0.24); ctx.lineWidth = 0.3; ctx.beginPath();
    for (let y = -19.6; y < -17; y += 1.4) { ctx.moveTo(1.2, y); ctx.lineTo(2.8, y + 1); ctx.moveTo(2.8, y); ctx.lineTo(1.2, y + 1); }
    ctx.stroke();
  }
  ctx.fillStyle = shd(trim, -0.1); ctx.fillRect(-6, -23.9, 6, 0.9);            // gola atrás
  // cinto com fivela e algibeira
  ctx.fillStyle = C('#4a3020'); ctx.fillRect(-6.6, -12.9, 13.2, 2);
  ctx.fillStyle = C('#6a4a2a'); ctx.fillRect(-6.6, -12.9, 13.2, 0.5);
  rr(ctx, -6.4, -12.4, 3, 3.6, 0.9, C('#6a4428')); ctx.fillStyle = C('#4a2e16'); ctx.fillRect(-6.4, -12.4, 3, 0.9);
  ctx.fillStyle = C('#d8b25a'); ctx.fillRect(2.2, -13.2, 2.2, 2.6); ctx.fillStyle = C('#8a6a2a'); ctx.fillRect(2.8, -12.6, 1, 1.4);
  if (o.armor) {
    const a = o.armor;
    // cota de malha por baixo, aparecendo na cintura
    rr(ctx, -6.8, -13.4, 13.6, 4.8, 1.4, S(a, -0.18));
    ctx.fillStyle = S(a, 0.18); for (let y = -13; y < -9; y += 1.2) for (let x = -6.4 + ((y * 10) % 2 ? 0.6 : 0); x < 6.6; x += 1.3) ctx.fillRect(x, y, 0.6, 0.6);
    rr(ctx, -6.6, -23.6, 13.2, 10.6, 3.2, C(a));
    rr(ctx, -6.6, -23.6, 4, 10.6, 3, S(a, -0.22));
    rr(ctx, 1.6, -22.6, 3.2, 7.4, 1.6, S(a, 0.3));
    limb(ctx, 0.4, -22.8, 0.6, -14.2, 0.6, S(a, -0.3));                         // aresta do peitoral
    ctx.fillStyle = S(a, -0.35); ctx.fillRect(-6.4, -13.6, 12.8, 0.9);
    ctx.fillStyle = S(a, 0.45); for (const [rx, ry] of [[-4.5, -21.5], [4.5, -21.5], [-4.5, -15], [4.5, -15]]) ctx.fillRect(rx, ry, 0.9, 0.9);
    ell(ctx, -5.2, -22.6, 3.2, 2.3, S(a, -0.2)); ell(ctx, 4.8, -22.6, 3.3, 2.5, S(a, 0.06)); ell(ctx, 5.2, -23.6, 1.2, 0.55, S(a, 0.32));
    limb(ctx, 2, -21.4, 7.6, -21.4, 0.5, S(a, -0.25));                          // lâmina da ombreira
  }
  // ---- pescoço
  rr(ctx, -1.4, -25.5, 3.4, 3, 1, S(skin, -0.16));
  ell(ctx, 0.4, -23.6, 1.8, 0.6, S(skin, -0.25));
  // ---- cabelo de trás (antes da cabeça)
  const hs = o.hairStyle || 'short', bareHead = !o.hood && !o.helmet;
  const strand = (x1, y1, x2, y2, c, w) => limb(ctx, x1, y1, x2, y2, w || 0.5, c);
  if (bareHead && !o.cap) {
    if (hs === 'long') {
      rr(ctx, -6.2, -34.8, 7.8, 15.6, 3.4, hd); rr(ctx, -5.6, -34, 6.4, 14, 3, hc);
      for (const x of [-4.6, -2.8, -1]) strand(x, -31, x - 0.4, -21.6, hd, 0.5);
      strand(-3.6, -32, -4, -24, hl, 0.45);
      poly(ctx, [-6, -21.4, -4.6, -19.4, -3.4, -21, -2, -19.2, -0.6, -21.2, 1.2, -20.4, 1.2, -22, -6, -22], hc);   // pontas desfiadas
    }
    if (hs === 'braids') for (const bx of [-5.8, -2.8]) {
      rr(ctx, bx, -31.4, 2.6, 14, 1.3, hd);
      for (let k = -30.4; k < -18.4; k += 2.2) { ell(ctx, bx + 1.3, k + 0.8, 1.4, 1.1, hc); strand(bx + 0.5, k + 0.3, bx + 2, k + 1.4, hl, 0.4); }
      rr(ctx, bx + 0.4, -18.6, 1.8, 1, 0.4, C('#b03040'));
    }
    if (hs === 'ponytail') {
      const sw = o.moving ? Math.sin(t * 12) * 1.1 : 0;
      ctx.fillStyle = hd; ctx.beginPath(); ctx.moveTo(-5, -33); ctx.quadraticCurveTo(-10 - sw, -30, -8.4 - sw, -21.4); ctx.lineTo(-6.4 - sw, -21.8); ctx.quadraticCurveTo(-7.4, -28, -4, -31); ctx.fill();
      strand(-6.4, -30, -7.6 - sw, -23, hl, 0.45);
      rr(ctx, -6.4, -32.6, 2.2, 1.6, 0.6, C('#8a2a2a'));
    }
    if (hs === 'curly') { ell(ctx, -0.6, -31, 7.2, 6.4, hd); for (const [cx, cy] of [[-5.6, -28], [-5.8, -32], [-3.8, -35]]) ell(ctx, cx, cy, 2.4, 2.4, hc); }
  }
  // ---- cabeça
  rr(ctx, -4.9, -34.8, 10.2, 10.8, 4.2, C(skin));
  rr(ctx, -4.9, -34.8, 3.4, 10.8, 3.2, S(skin, -0.12));
  ell(ctx, 1.4, -25.2, 3.4, 1, S(skin, -0.12));                                  // sombra do queixo
  ell(ctx, 3.8, -28.6, 1.4, 0.9, 'rgba(255,255,255,0.12)');                      // maçã do rosto
  ell(ctx, -2.3, -29.2, 1.35, 2, S(skin, -0.1)); ctx.fillStyle = S(skin, -0.32); ctx.fillRect(-2.6, -29.8, 0.6, 1.4); ctx.fillRect(-2.4, -28.4, 0.8, 0.4);
  // olhos
  rr(ctx, 2.2, -30.9, 2.4, 2.1, 0.7, '#f6f2ea');
  ctx.fillStyle = eyeCol; ctx.fillRect(3.3, -30.9, 1.3, 2.1);
  ctx.fillStyle = '#120a06'; ctx.fillRect(3.6, -30.5, 0.8, 1.4);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(3.4, -30.7, 0.5, 0.5);
  ctx.fillStyle = S(skin, -0.45); ctx.fillRect(2.1, -31.2, 2.7, 0.55);          // pálpebra
  rr(ctx, -0.8, -30.8, 1.5, 1.9, 0.5, '#e8e2d8'); ctx.fillStyle = eyeCol; ctx.fillRect(-0.3, -30.7, 0.9, 1.8); ctx.fillStyle = '#120a06'; ctx.fillRect(-0.1, -30.4, 0.5, 1.2);
  ctx.fillStyle = S(skin, -0.45); ctx.fillRect(-0.9, -31.1, 1.7, 0.5);
  if (fem) { ctx.fillStyle = '#1a0e08'; ctx.fillRect(4.4, -31.6, 0.9, 0.5); ctx.fillRect(4.7, -31.2, 0.6, 0.4); ctx.fillRect(-1.2, -31.4, 0.6, 0.4); }
  // sobrancelhas
  if (fem) { limb(ctx, 2, -32.1, 4.9, -32.5, 0.5, hd); limb(ctx, -1, -31.9, 0.8, -32.2, 0.45, hd); }
  else { poly(ctx, [1.9, -32.2, 5, -32.7, 5, -31.9, 1.9, -31.6], hd); poly(ctx, [-1.1, -31.9, 0.9, -32.3, 0.9, -31.6, -1.1, -31.4], hd); }
  // nariz, boca e bochecha
  rr(ctx, 4.8, -30, 1.4, 2.9, 0.6, S(skin, -0.1)); ctx.fillStyle = S(skin, 0.14); ctx.fillRect(4.9, -30, 0.5, 1.6);
  ctx.fillStyle = S(skin, -0.35); ctx.fillRect(5.3, -27.4, 0.8, 0.4); ctx.fillRect(4.6, -27.3, 0.5, 0.5);
  if (fem) { ctx.fillStyle = C('#a84858'); ctx.fillRect(2.5, -26.9, 2.4, 0.6); ctx.fillStyle = C('#d07a84'); ctx.fillRect(2.7, -26.3, 2, 0.6); }
  else { ctx.fillStyle = S(skin, -0.42); ctx.fillRect(2.6, -26.6, 2.2, 0.6); ctx.fillStyle = S(skin, -0.2); ctx.fillRect(2.9, -26, 1.6, 0.4); }
  ctx.fillStyle = fem ? 'rgba(230,100,110,0.22)' : 'rgba(220,90,90,0.13)'; ctx.fillRect(2, -28.5, 2.8, 1.3);
  // ---- cabelo da frente, com mechas e brilho
  if (bareHead && !o.cap) {
    const cap = (yy, h) => {
      rr(ctx, -5.5, yy, 11.2, h, 3.3, hd); rr(ctx, -5.2, yy + 0.3, 10.6, h - 0.6, 3, hc);
      rr(ctx, -5.4, yy + 1.4, 3.6, 7, 1.7, hc); rr(ctx, -5.4, yy + 1.4, 1.4, 7, 0.7, hd);       // lado (costeleta)
      for (const x of [-2.4, 0.2, 2.6]) strand(x, yy + 0.8, x + 1.4, yy + h - 0.4, hd, 0.45);
      strand(-1.4, yy + 0.6, 2.8, yy + 0.9, hl, 0.6);
    };
    switch (hs) {
      case 'bald':
        ell(ctx, -0.6, -33.8, 2.8, 0.9, 'rgba(255,255,255,0.24)'); rr(ctx, -5.2, -31.4, 2.6, 5, 1.1, hc);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-4.4, -33.2, 8.6, 1.2); break;
      case 'mohawk':
        rr(ctx, -2.2, -39.4, 3.6, 6.6, 1.6, hd); rr(ctx, -1.8, -39, 2.8, 5.8, 1.3, hc); strand(-0.8, -38.6, -0.4, -34, hl, 0.6);
        ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(-4.6, -34, 9, 1.4); break;
      case 'curly':
        for (const [cx, cy] of [[-4.2, -33], [-1.8, -35.2], [1.2, -35.6], [3.8, -34], [-4.9, -30.6], [4.9, -32]]) { ell(ctx, cx, cy, 2.5, 2.3, hd); ell(ctx, cx + 0.2, cy - 0.2, 2.1, 1.9, hc); ell(ctx, cx + 0.6, cy - 0.8, 0.8, 0.5, hl); }
        break;
      case 'bun':
        cap(-36.2, 4.8); ell(ctx, -3.6, -37.6, 2.8, 2.5, hd); ell(ctx, -3.4, -37.8, 2.3, 2.1, hc); strand(-5, -38.4, -2, -36.8, hl, 0.5);
        rr(ctx, -4.6, -35.8, 2.4, 0.8, 0.3, C('#8a2a2a')); break;
      case 'long': cap(-36.4, 5.2); rr(ctx, 3.4, -33.8, 2.2, 3.4, 0.9, hc); strand(4, -33.4, 4.4, -30.8, hd, 0.4); break;
      case 'braids': case 'ponytail': cap(-36.2, 4.6); break;
      default: cap(-36.2, 4.8); rr(ctx, 3.2, -33.6, 2.6, 2, 0.9, hc); poly(ctx, [5.8, -33.4, 6.2, -32, 4.6, -32.6], hc);   // franja
    }
  }
  // ---- barba e bigode, com textura
  const bs = o.beardStyle || (o.beard ? 'short' : 'none');
  if (bs !== 'none' && !o.hood) {
    const bc = shd(hc, -0.04), bd = shd(hc, -0.28);
    const tex = (x0, y0, x1, y1) => { for (let x = x0; x < x1; x += 1.3) strand(x, y0, x + 0.3, y1, bd, 0.4); };
    if (bs === 'short') { poly(ctx, [-1.8, -28.6, 0, -27.2, 5.3, -27, 4.8, -24.4, 2.6, -23.4, 0.4, -23.8, -2.4, -26.2], bc); tex(0.2, -26.8, 4.6, -24.2); }
    if (bs === 'full') { poly(ctx, [-2.4, -30, 0.4, -27.6, 5.4, -27.2, 5.1, -24, 2.8, -22.4, 0, -22.8, -2.8, -25.8], bc); tex(-1.6, -27, 4.8, -23.2); ell(ctx, 1.8, -23.6, 2.4, 0.8, bd); ell(ctx, 2.4, -26.4, 1, 0.4, shd(hc, 0.2)); }
    if (bs === 'long') { poly(ctx, [-1.8, -28.6, 5.3, -27, 4.6, -22.2, 2.6, -19.2, 0.8, -19.6, -1.6, -24], bc); tex(0.6, -26, 4, -20.4); strand(1.8, -25.4, 2.2, -20.6, shd(hc, 0.22), 0.5); }
    if (bs === 'goatee') { rr(ctx, 2.3, -26.2, 2.6, 3.2, 1.1, bc); tex(2.6, -25.6, 4.6, -23.4); }
    // bigode em arco (todas)
    ctx.fillStyle = bc; ctx.beginPath(); ctx.moveTo(1.8, -26.8); ctx.quadraticCurveTo(3.8, -28.4, 5.8, -27.1); ctx.lineTo(5.6, -26.5); ctx.quadraticCurveTo(3.8, -27.4, 2, -26.2); ctx.fill();
    strand(2.6, -27.4, 5, -27.3, shd(hc, 0.2), 0.35);
    ctx.fillStyle = S(skin, -0.42); ctx.fillRect(2.9, -26.3, 1.7, 0.45);
  }
  // ---- capuz, gorro, elmo e coroa
  if (o.hood) {
    rr(ctx, -6.4, -27, 13, 4.4, 2, S(o.hood, -0.12));
    rr(ctx, -6, -36.6, 8.6, 12.4, 4.4, C(o.hood));
    rr(ctx, -6, -36.6, 12, 4.4, 3, C(o.hood));
    rr(ctx, -6, -36.6, 3.4, 12.4, 3, S(o.hood, -0.2));
    limb(ctx, -3, -35, -2.4, -27, 0.5, S(o.hood, -0.28)); limb(ctx, 0.4, -36, 3.4, -33.6, 0.5, S(o.hood, 0.14));
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(1.6, -32.2, 4.4, 2.4);
  } else if (o.cap) {
    if (bareHead) { rr(ctx, -5.2, -33, 2.6, 6, 1.2, hc); strand(-4.4, -32.4, -4.6, -27.6, hd, 0.45); }
    rr(ctx, -5.6, -36.6, 11, 4.6, 2.6, C(o.cap)); rr(ctx, -5.6, -36.6, 3.4, 4.6, 2, S(o.cap, -0.2));
    rr(ctx, 2.6, -33.2, 4.2, 1.3, 0.6, S(o.cap, -0.25)); rr(ctx, -2, -36.2, 4.2, 1, 0.5, S(o.cap, 0.2));
    limb(ctx, -1, -36.4, 1.6, -32.6, 0.45, S(o.cap, -0.3));
  } else if (o.helmet) {
    const hm = o.helmet;
    rr(ctx, -5.8, -31.6, 2.8, 6, 1, S(hm, -0.3));
    rr(ctx, -5.8, -37.4, 11.6, 7.6, 4.4, C(hm));
    rr(ctx, -5.8, -37.4, 4, 7.6, 3.4, S(hm, -0.2));
    ctx.fillStyle = S(hm, -0.35); ctx.fillRect(-5.8, -31.9, 11.6, 1.5);
    ctx.fillStyle = S(hm, 0.3); for (const x of [-3.6, -0.6, 2.4]) ctx.fillRect(x, -31.6, 0.7, 0.7);
    rr(ctx, 3.6, -32, 1.3, 4.6, 0.5, S(hm, -0.1));
    limb(ctx, 0.4, -37.2, 0.6, -32.2, 0.6, S(hm, -0.18));                         // crista
    rr(ctx, -2.2, -36.6, 4.4, 1.3, 0.6, S(hm, 0.4)); ctx.fillStyle = S(hm, 0.55); ctx.fillRect(-1.4, -36.3, 1.4, 0.6);
  }
  if (o.crown) {
    const g = C('#e8b923'), gd = shd(g, -0.3);
    ctx.fillStyle = gd; ctx.fillRect(-5.2, -36.4, 10.4, 2.4);
    poly(ctx, [-5.2, -36, -4.4, -40, -3.2, -36.4], g); poly(ctx, [-1.4, -36.4, -0.2, -40.8, 1, -36.4], g); poly(ctx, [2.8, -36.4, 4, -40, 5.2, -36], g);
    ell(ctx, -4.4, -40.2, 0.6, 0.6, C('#f4f0e8')); ell(ctx, -0.2, -41, 0.7, 0.7, C('#f4f0e8')); ell(ctx, 4, -40.2, 0.6, 0.6, C('#f4f0e8'));
    ctx.fillStyle = g; ctx.fillRect(-5.2, -36.8, 10.4, 1.4);
    ctx.fillStyle = C('#d0303a'); ctx.fillRect(-0.7, -35.6, 1.4, 1.4); ctx.fillStyle = C('#3a6ad0'); ctx.fillRect(-4, -35.4, 1.1, 1.1); ctx.fillRect(3, -35.4, 1.1, 1.1);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-4.6, -36.6, 8, 0.4);
  }
  // ---- braço da frente: manga, punho e mão com polegar
  let fhx, fhy;
  if (holding) { fhx = 6.6; fhy = -15; }
  else { const fa = o.moving ? Math.sin(t * 12) * 0.55 : 0.05; fhx = 4.6 + Math.sin(fa) * 6; fhy = -21 + Math.cos(fa) * 8.6; }
  const ex = (3.8 + fhx) / 2 + 0.6, ey = (-21.2 + fhy) / 2 + 0.4;
  limb2(ctx, 3.8, -21.2, ex, ey, fhx, fhy, 3.5, C(sleeve));
  limb(ctx, 4.6, -20.6, ex + 0.2, ey, 1, S(sleeve, 0.18));
  limb(ctx, ex + (fhx - ex) * 0.62, ey + (fhy - ey) * 0.62, fhx, fhy - 0.3, 3.7, o.armor ? S(o.armor, 0.12) : trim);   // punho
  ell(ctx, fhx, fhy + 0.5, 1.45, 1.6, S(skin, -0.06)); ell(ctx, fhx + 0.4, fhy + 0.1, 0.6, 0.5, S(skin, 0.12));
  ell(ctx, fhx + 1.1, fhy - 0.2, 0.55, 0.75, S(skin, -0.12));                    // polegar
  // ---- escudo erguido
  if (o.shieldUp && o.shield) {
    poly(ctx, [4.6, -26, 13.2, -26, 13.2, -17.4, 8.9, -9.4, 4.6, -17.4], S(o.shield, -0.4));
    poly(ctx, [5.4, -25.2, 12.4, -25.2, 12.4, -17.6, 8.9, -10.8, 5.4, -17.6], C(o.shield));
    rr(ctx, 6, -24.6, 1.4, 9, 0.7, 'rgba(255,255,255,0.3)');
    ell(ctx, 8.9, -19, 1.6, 1.6, S(o.shield, 0.35));
  }
  ctx.restore();
}
// O corpo é desenhado uma vez por visual e por quadro (8 quadros andando, 4 parado) numa imagem guardada,
// na resolução da tela; a cada quadro do jogo só se copia a imagem. A arma é desenhada ao vivo (segue a mira).
const HUMAN_CACHE = new Map();
function humanFrame(o) {
  const t = o.anim || 0;
  if (o.moving) { const f = ((Math.floor(t * 12 / (Math.PI * 2) * 8) % 8) + 8) % 8; return { key: 'm' + f, t: (f + 0.5) / 8 * Math.PI * 2 / 12 }; }
  const f = ((Math.floor(t * 2.2 / (Math.PI * 2) * 4) % 4) + 4) % 4; return { key: 'i' + f, t: (f + 0.5) / 4 * Math.PI * 2 / 2.2 };
}
function drawHuman(ctx, x, y, o) {
  const s = o.scale || 1, dir = o.dir < 0 ? -1 : 1, fr = humanFrame(o);
  const tf = ctx.getTransform(), res = Math.max(1, Math.min(10, Math.round(Math.hypot(tf.a, tf.b) * s * 2) / 2));
  const key = [fr.key, dir, res, o.body, o.legs, o.skin, o.hair, o.hairStyle, o.beardStyle, o.beard, o.armor, o.helmet, o.cap, o.hood, o.crown, o.cape,
    o.skirt, o.fem, o.boots, o.shield, o.shieldUp, o.seated, o.hurt, !!(o.weapon || o.swing > 0 || o.rod)].join('|');
  let cv = HUMAN_CACHE.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = Math.ceil(44 * res); cv.height = Math.ceil(54 * res);
    const g = cv.getContext('2d'); g.scale(res, res); g.translate(22, 46);
    humanBody(g, o, dir, fr.t);
    // contorno escuro e suave em volta da figura (deixa a pessoa nítida sobre qualquer chão)
    const sil = document.createElement('canvas'); sil.width = cv.width; sil.height = cv.height;
    const sg = sil.getContext('2d'); sg.drawImage(cv, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(24,14,8,0.62)'; sg.fillRect(0, 0, sil.width, sil.height);
    const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
    const og = out.getContext('2d'), d1 = Math.max(1, Math.round(res * 0.5));
    for (const [dx, dy] of [[d1, 0], [-d1, 0], [0, d1], [0, -d1]]) og.drawImage(sil, dx, dy);
    og.drawImage(cv, 0, 0);
    cv = out;
    if (HUMAN_CACHE.size > 900) HUMAN_CACHE.delete(HUMAN_CACHE.keys().next().value);
    HUMAN_CACHE.set(key, cv);
  }
  const bob = o.moving ? -Math.abs(Math.sin(fr.t * 12)) * 1.1 : Math.sin(fr.t * 2.2) * 0.3;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(s, s);
  ell(ctx, 0, 0, 9.5, 3.2, 'rgba(0,0,0,0.26)'); ell(ctx, 0, 0, 6, 2, 'rgba(0,0,0,0.12)'); // sombra no chão
  ctx.drawImage(cv, -22, -46, cv.width / res, cv.height / res);

  // ---- arma ou ferramenta (no mundo: a mira não é espelhada)
  const ang = o.swing > 0 ? o.aim - 1.3 + (1 - o.swing / 0.25) * 2.6 : (dir > 0 ? 0.9 : Math.PI - 0.9);
  if (o.rod) {
    ctx.save(); ctx.translate(dir * 6.6, -15 + bob); ctx.rotate(dir > 0 ? -0.6 : Math.PI + 0.6);
    limb(ctx, 0, 0, 26, 0, 1.6, '#6b4423'); limb(ctx, 14, 0, 26, 0, 1, '#8a5a30'); rr(ctx, 3, -1.6, 3.4, 3.2, 1, '#c9a050');
    ctx.restore();
  } else if (o.weapon || o.swing > 0) {
    ctx.save(); ctx.translate(dir * 6.6, -15 + bob); ctx.rotate(ang);
    const len = o.wlen || 8, wc = o.weapon || '#9a9a9a';
    rr(ctx, -1.5, -1.5, 6.5, 3, 1, '#4a2e16');
    ctx.fillStyle = '#2a1a0e'; for (let k = 0; k < 5; k += 1.6) ctx.fillRect(k, -1.5, 0.5, 3);
    ell(ctx, -1.8, 0, 1.4, 1.4, '#c9a050');
    if (o.tool === 'axe' || o.tool === 'pick' || o.tool === 'shovel') {
      limb(ctx, 4.5, 0, len + 3, 0, 2, '#6b4423');
      const tc = o.toolCol || '#9a9a9a';
      if (o.tool === 'axe') { poly(ctx, [len - 1, -1.2, len + 4, -6.5, len + 6, -5, len + 5, 1.5, len + 1, 1.5], tc); limb(ctx, len + 4.5, -5.8, len + 5.6, 0.8, 0.8, shd(tc, 0.35)); }
      if (o.tool === 'pick') { ctx.strokeStyle = tc; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(len + 1, -8); ctx.quadraticCurveTo(len + 4.5, 0, len + 1, 8); ctx.stroke(); }
      if (o.tool === 'shovel') { poly(ctx, [len + 2, -3.6, len + 8, -3, len + 9.5, 0, len + 8, 3, len + 2, 3.6], tc); limb(ctx, len + 3, -2.6, len + 7.6, -2.2, 0.8, shd(tc, 0.35)); }
    } else if (o.weapon) {
      ctx.fillStyle = shd(wc, -0.35); ctx.fillRect(4.6, -3.6, 1.8, 7.2);
      ctx.fillStyle = shd(wc, 0.2); ctx.fillRect(4.6, -3.6, 1.8, 1);
      poly(ctx, [6.4, -1.7, 6.4 + len, -0.5, 8.4 + len, 0, 6.4 + len, 0.5, 6.4, 1.7], wc);
      limb(ctx, 7, -1.1, 6 + len, -0.4, 0.7, 'rgba(255,255,255,0.65)');
      limb(ctx, 7.5, 0.2, 5 + len * 0.8, 0.1, 0.5, shd(wc, -0.25));
    }
    ctx.restore();
  }
  if (o.swing > 0) {
    const a = o.swing / 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.45) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -15, 27, o.aim - 1.0, o.aim + 1.0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.2) + ')'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, -15, 24, o.aim - 0.7, o.aim + 0.7); ctx.stroke();
  }
  ctx.restore();
}

// animais: quadrúpedes com corpo, peito e quadril, pescoço, patas com joelho, cascos ou patas, focinho e cauda
const ANIMAL_LOOK = {
  //        corpo      barriga    escuro     focinho    patas  meio-comprimento altura  cabeça  pescoço(ângulo, comp.)
  deer:   { c: '#a8743e', b: '#e8d4b0', d: '#6e4a26', s: '#4a3020', leg: 11, bx: 11, bh: 8,  hr: 3.4, na: -1.1, nl: 8,  snout: 3.6, ear: 'deer',  tail: 'deer', hoof: '#2a1a10', lw: 2.2 },
  wolf:   { c: '#82858c', b: '#d0d2d6', d: '#55575c', s: '#2a2a2a', leg: 8,  bx: 11, bh: 8,  hr: 3.6, na: -0.5, nl: 5,  snout: 4.2, ear: 'wolf',  tail: 'wolf', hoof: '#3a3a3a', lw: 2.4 },
  boar:   { c: '#5e3f2c', b: '#7a5a44', d: '#3a2618', s: '#c99a8a', leg: 6,  bx: 11, bh: 10, hr: 4.2, na: -0.15, nl: 3, snout: 4.4, ear: 'boar',  tail: 'pig',  hoof: '#1a1208', lw: 2.6 },
  fox:    { c: '#d0682a', b: '#f6efe2', d: '#7a3a14', s: '#1a1a1a', leg: 6,  bx: 9,  bh: 6,  hr: 3,   na: -0.5, nl: 4,  snout: 3.8, ear: 'fox',   tail: 'fox',  hoof: '#2a1a10', lw: 1.8 },
  rabbit: { c: '#c9b99c', b: '#f2ece0', d: '#8a7a60', s: '#c08080', leg: 3,  bx: 7,  bh: 7,  hr: 3.2, na: -0.9, nl: 2,  snout: 1.6, ear: 'rabbit', tail: 'puff', hoof: '#8a7a60', lw: 2.2 },
  goat:   { c: '#cfc6b4', b: '#ece6d8', d: '#7e7464', s: '#5a4a3a', leg: 10, bx: 10, bh: 8,  hr: 3.2, na: -1.0, nl: 6,  snout: 3.4, ear: 'goat',  tail: 'goat', hoof: '#2a2420', lw: 2   },
  moose:  { c: '#5a3e2a', b: '#7a5a42', d: '#3a2618', s: '#2a1a10', leg: 14, bx: 13, bh: 11, hr: 3.8, na: -0.45, nl: 7, snout: 5.2, ear: 'goat', tail: 'stub', hoof: '#1a1208', lw: 2.8 },
  camel:  { c: '#c8a46a', b: '#e0c890', d: '#8a6a3a', s: '#4a3626', leg: 15, bx: 12, bh: 9,  hr: 3.2, na: -1.25, nl: 12, snout: 4, ear: 'goat', tail: 'goat', hoof: '#5a4228', lw: 2.4 },
  bear:   { c: '#5e3c24', b: '#7a5234', d: '#36220f', s: '#2a1a10', leg: 8,  bx: 13, bh: 12, hr: 4.6, na: -0.25, nl: 4, snout: 3.6, ear: 'bear',  tail: 'stub', hoof: '#1a1208', lw: 4   },
};
function drawAnimal(ctx, x, y, kind, dir, moving, anim, hurt) {
  if (kind === 'croc') { drawCroc(ctx, x, y, dir, moving, anim, hurt); return; }
  const L = ANIMAL_LOOK[kind] || ANIMAL_LOOK.deer;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir, 1);
  if (kind === 'bear') ctx.scale(1.25, 1.25);
  if (kind === 'moose') ctx.scale(1.2, 1.2);
  if (kind === 'rabbit') ctx.scale(0.62, 0.62);
  const H = c => hurt ? shd('#ff8a8a', c === L.d ? -0.2 : 0) : c;
  const body = H(L.c), dark = H(L.d), belly = H(L.b);
  const hop = kind === 'rabbit' && moving ? -Math.abs(Math.sin(anim * 10)) * 5 : 0;
  ell(ctx, 0, 0, L.bx + 2, 3.6, 'rgba(0,0,0,0.26)');
  ctx.translate(0, hop);
  const by = -L.leg - L.bh / 2, top = by - L.bh / 2;
  const sw = k => moving ? Math.sin(anim * 14 + k) * 0.45 : 0;
  // patas: duas de trás e duas da frente, as do lado de lá mais escuras
  const leg = (lx, ph, far) => {
    const a = sw(ph), kx = lx + Math.sin(a) * L.leg * 0.45, ky = by + L.bh * 0.3 + L.leg * 0.5;
    const fx = kx + Math.sin(a * 1.2) * L.leg * 0.4, fy = -Math.max(0, Math.sin(anim * 14 + ph)) * (moving ? 1.6 : 0);
    const c = far ? shd(dark, -0.1) : (kind === 'fox' || kind === 'wolf' ? dark : body);
    limb2(ctx, lx, by + L.bh * 0.1, kx, ky, fx, fy - 0.8, L.lw, c);
    if (kind === 'bear' || kind === 'wolf' || kind === 'fox' || kind === 'rabbit') ell(ctx, fx + 0.6, fy - 0.6, L.lw * 0.7, L.lw * 0.45, far ? shd(dark, -0.2) : dark);
    else rr(ctx, fx - L.lw * 0.5, fy - 1.6, L.lw * 1.05, 1.6, 0.4, H(L.hoof));
  };
  leg(-L.bx * 0.62, Math.PI, true); leg(L.bx * 0.5, 0, true);
  // cauda (atrás do corpo)
  const tw = moving ? Math.sin(anim * 9) * 0.3 : Math.sin(anim * 3) * 0.15;
  ctx.save(); ctx.translate(-L.bx + 1, top + L.bh * 0.3); ctx.rotate(tw);
  if (L.tail === 'fox') { ell(ctx, -6, 2, 7, 3.2, body, -0.35); ell(ctx, -12, 4.2, 2.4, 2, H('#f6efe2'), -0.35); }
  else if (L.tail === 'wolf') { ell(ctx, -5, 3.4, 6, 2.4, body, -0.7); ell(ctx, -8.6, 6.6, 2, 1.6, dark, -0.7); }
  else if (L.tail === 'deer') { ell(ctx, -1.6, 1, 2.4, 1.6, body); ell(ctx, -2, 1.8, 1.6, 1.2, H('#f6f2ea')); }
  else if (L.tail === 'goat') { ell(ctx, -1.6, -0.6, 2.2, 1.3, body, -0.6); }
  else if (L.tail === 'puff') { ell(ctx, -0.8, 1, 2.6, 2.4, H('#f6f2ea')); }
  else if (L.tail === 'pig') { ctx.strokeStyle = dark; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(-1.6, 1.4, 1.4, 0, Math.PI * 1.6); ctx.stroke(); }
  else ell(ctx, -0.6, 0.6, 1.8, 1.4, body);
  ctx.restore();
  // corpo com peito e quadril
  ell(ctx, 0, by, L.bx, L.bh / 2, body);
  ell(ctx, -L.bx * 0.55, by - L.bh * 0.08, L.bh * 0.55, L.bh * 0.58, body);
  ell(ctx, L.bx * 0.55, by - L.bh * 0.05, L.bh * 0.58, L.bh * 0.6, body);
  if (kind === 'bear') ell(ctx, L.bx * 0.25, top + 1.4, L.bx * 0.45, L.bh * 0.3, body); // corcova
  if (kind === 'camel') { ell(ctx, -1, top - 1.6, L.bx * 0.5, L.bh * 0.62, body); ell(ctx, -1.6, top - 3.4, L.bx * 0.3, L.bh * 0.3, shd(body, 0.1)); }
  if (kind === 'moose') ell(ctx, L.bx * 0.45, top + 0.6, L.bx * 0.42, L.bh * 0.3, dark);
  ell(ctx, 0.5, by + L.bh * 0.24, L.bx * 0.72, L.bh * 0.24, belly);
  ell(ctx, -1, top + L.bh * 0.18, L.bx * 0.8, L.bh * 0.16, 'rgba(0,0,0,0.14)');
  ell(ctx, 1, top + L.bh * 0.08, L.bx * 0.5, L.bh * 0.08, 'rgba(255,255,255,0.12)');
  if (kind === 'deer') for (const [sx, sy] of [[-5, -2], [-2, -3.4], [1.5, -2.6], [-6.5, 0.5]]) ell(ctx, sx, top + L.bh * 0.4 + sy + 2, 0.8, 0.6, H('#f2e6cc'));
  if (kind === 'boar') { ctx.fillStyle = dark; for (let k = -L.bx + 2; k < L.bx - 1; k += 1.8) ctx.fillRect(k, top - 1.6 + Math.abs(k) * 0.05, 1, 2.6); }
  if (kind === 'wolf') ell(ctx, L.bx * 0.6, by - L.bh * 0.2, L.bh * 0.5, L.bh * 0.55, H('#9a9ca2'));
  // patas do lado de cá
  leg(-L.bx * 0.45, 0, false); leg(L.bx * 0.66, Math.PI, false);
  // pescoço e cabeça
  const nx = L.bx * 0.72, ny = top + L.bh * 0.35;
  const hx = nx + Math.cos(L.na) * L.nl, hy = ny + Math.sin(L.na) * L.nl;
  limb(ctx, nx - 1, ny + 1.5, hx, hy, L.hr * 1.5, body);
  if (kind === 'goat' || kind === 'deer') limb(ctx, nx, ny + 2.4, hx - 0.4, hy + 1, L.hr * 0.7, belly);
  ell(ctx, hx, hy, L.hr * 1.05, L.hr * 0.9, body);
  // focinho
  const sx = hx + L.hr * 0.75, sy = hy + L.hr * 0.3;
  ell(ctx, sx + L.snout * 0.45, sy, L.snout * 0.65, L.hr * (kind === 'boar' ? 0.62 : 0.48), kind === 'boar' ? H('#7a5444') : (kind === 'fox' || kind === 'goat' || kind === 'deer' ? shd(body, -0.06) : shd(body, 0.08)));
  if (kind === 'fox' || kind === 'wolf') ell(ctx, sx + L.snout * 0.2, sy + L.hr * 0.3, L.snout * 0.6, L.hr * 0.28, belly);
  if (kind === 'boar') { ell(ctx, sx + L.snout * 1.05, sy, 1.2, 1.6, H('#c99a8a')); ctx.fillStyle = '#2a1a10'; ctx.fillRect(sx + L.snout * 1.05, sy - 0.8, 0.5, 0.6); ctx.fillRect(sx + L.snout * 1.05, sy + 0.3, 0.5, 0.6);
    poly(ctx, [sx + L.snout * 0.6, sy + 1.2, sx + L.snout * 0.9, sy - 2.2, sx + L.snout * 0.45, sy + 1.4], H('#f2efe6')); }
  else ell(ctx, sx + L.snout * 1.02, sy - 0.2, kind === 'rabbit' ? 0.8 : 1.1, kind === 'rabbit' ? 0.7 : 0.9, H(L.s));
  if (kind === 'goat') ell(ctx, sx + 0.6, sy + L.hr * 0.9, 1, 2.2, H('#e9e2d2'));
  // olho
  const ex = hx + L.hr * 0.35, ey = hy - L.hr * 0.22;
  ell(ctx, ex, ey, 0.95, 0.9, kind === 'wolf' ? '#e8c040' : '#1a120a'); ctx.fillStyle = kind === 'wolf' ? '#1a120a' : 'rgba(255,255,255,0.8)';
  if (kind === 'wolf') ctx.fillRect(ex, ey - 0.5, 0.5, 1); else ctx.fillRect(ex + 0.2, ey - 0.6, 0.45, 0.45);
  // orelhas, chifres, galhada
  const ex2 = hx - L.hr * 0.35, ey2 = hy - L.hr * 0.7;
  if (L.ear === 'rabbit') { ell(ctx, ex2, ey2 - 4.6, 1.2, 4.4, body, -0.25); ell(ctx, ex2 + 0.2, ey2 - 4.6, 0.6, 3.4, H('#e8b0b0'), -0.25); ell(ctx, ex2 - 1.6, ey2 - 4, 1.1, 4, shd(body, -0.15), -0.45); }
  else if (L.ear === 'fox' || L.ear === 'wolf') { poly(ctx, [ex2 - 1.6, ey2 + 1, ex2 - 0.4, ey2 - 3.8, ex2 + 1.4, ey2 + 0.6], kind === 'fox' ? dark : body); poly(ctx, [ex2 - 0.9, ey2 + 0.6, ex2 - 0.3, ey2 - 2, ex2 + 0.6, ey2 + 0.4], kind === 'fox' ? H('#f6efe2') : dark); }
  else if (L.ear === 'bear') { ell(ctx, ex2, ey2, 1.6, 1.5, body); ell(ctx, ex2, ey2, 0.8, 0.8, dark); }
  else if (L.ear === 'boar') poly(ctx, [ex2 - 1.6, ey2 + 1.4, ex2 - 0.6, ey2 - 2.6, ex2 + 1.2, ey2 + 1], dark);
  else { ell(ctx, ex2 - 1.2, ey2 + 0.6, 2.2, 0.9, body, -0.5); ell(ctx, ex2 - 1.2, ey2 + 0.6, 1.2, 0.45, H('#d8b0a0'), -0.5); }
  if (kind === 'goat') { ctx.strokeStyle = H('#6a5a42'); ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 0.6, hy - L.hr * 0.8); ctx.quadraticCurveTo(hx - 5, hy - 7, hx - 5.6, hy - 2.4); ctx.stroke(); }
  if (kind === 'moose') {
    // galhada em pá
    const ac = H('#d8c49a');
    ell(ctx, hx - 3.4, hy - 5.4, 3.6, 1.6, ac, -0.35); ell(ctx, hx + 1.4, hy - 6, 3, 1.4, ac, 0.3);
    ctx.fillStyle = ac; for (const [ax, ay] of [[-6.4, -7], [-4.6, -7.6], [-2.6, -7.4], [0, -7.8], [2.6, -7.6], [4, -7]]) ctx.fillRect(hx + ax, hy + ay, 0.9, 1.6);
    limb(ctx, sx + L.snout * 0.4, sy + 1.2, sx + L.snout * 0.3, sy + 4.2, 1.4, dark); // barbela
  }
  if (kind === 'deer') {
    ctx.strokeStyle = H('#d9c39a'); ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(hx - 0.4, hy - L.hr * 0.8); ctx.lineTo(hx - 2, hy - 9); ctx.lineTo(hx - 4.6, hy - 12.4);
    ctx.moveTo(hx - 1.4, hy - 6.4); ctx.lineTo(hx + 1.4, hy - 9.2); ctx.moveTo(hx - 2, hy - 9); ctx.lineTo(hx - 0.6, hy - 12.6); ctx.moveTo(hx - 3.6, hy - 11); ctx.lineTo(hx - 6.6, hy - 11.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCroc(ctx, x, y, dir, moving, anim, hurt) {
  const body = hurt ? '#ff8a8a' : '#4f6030', dark = hurt ? shd('#ff8a8a', -0.2) : '#2e3a1a', belly = hurt ? '#ffb0b0' : '#b4b07a';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  ell(ctx, 0, 0, 17, 3.2, 'rgba(0,0,0,0.26)');
  const sw = moving ? Math.sin(anim * 9) : Math.sin(anim * 1.5) * 0.3;
  // patas abertas
  for (const [lx, ph, far] of [[-6, 0, true], [6, Math.PI, true], [-5, Math.PI, false], [7, 0, false]]) {
    const a = moving ? Math.sin(anim * 9 + ph) * 2 : 0;
    limb2(ctx, lx, -3.5, lx + a - 1.5, -1.2, lx + a + 0.5, -0.2, 2.2, far ? shd(dark, -0.1) : body);
    ell(ctx, lx + a + 1, -0.3, 1.4, 0.7, dark);
  }
  // cauda (balança)
  ctx.beginPath(); ctx.moveTo(-8, -6.4); ctx.quadraticCurveTo(-15, -5 + sw * 2, -23, -2.4 + sw * 3); ctx.lineTo(-8, -2.2); ctx.closePath(); ctx.fillStyle = body; ctx.fill();
  ctx.fillStyle = dark; for (let k = 0; k < 5; k++) { const tx = -10 - k * 2.6, ty = -6 + k * 0.7 + sw * (k * 0.5); ctx.fillRect(tx, ty - 0.8, 1.2, 1); }
  // corpo
  ell(ctx, 0, -4.2, 10, 3.2, body);
  ell(ctx, 0.5, -2.6, 8.4, 1.4, belly);
  ctx.fillStyle = dark; for (let k = -7; k <= 7; k += 2.2) ctx.fillRect(k, -7.4 + Math.abs(k) * 0.06, 1.3, 1.1); // escamas do dorso
  ctx.fillStyle = shd(body, 0.14); for (let k = -6; k <= 6; k += 3) ctx.fillRect(k + 1, -5.6, 1, 1);
  // cabeça e focinho
  ell(ctx, 10.4, -4.4, 3.6, 2.6, body);
  poly(ctx, [11, -5.8, 20.5, -4.6, 21, -3.2, 11, -2.4], body);
  poly(ctx, [11.5, -3.2, 20.6, -3.4, 20.2, -2.2, 11.5, -2], shd(body, -0.12));
  ctx.fillStyle = '#f2efe2'; for (let k = 13; k < 20.5; k += 1.6) { ctx.fillRect(k, -3.3, 0.6, 0.9); }
  ell(ctx, 11.6, -6.3, 1.3, 1, shd(body, 0.08)); ell(ctx, 11.9, -6.5, 0.6, 0.55, '#e8c040'); ctx.fillStyle = '#1a120a'; ctx.fillRect(11.8, -6.9, 0.3, 0.8);
  ell(ctx, 20.2, -5, 0.5, 0.35, dark);
  ctx.restore();
}

const TOOL_COLORS = ['#9a9a9a', '#8a8a80', '#cd8a4a', '#9aa0a8', '#e0e6ec'];

function playerLook() {
  const it = k => (P.equip[k] ? ITEMS[P.equip[k]] : null);
  const head = it('head'), torso = it('torso'), legs = it('legs'), feet = it('feet');
  const wep = it('weapon'), tool = it('tool');
  const kingOf = G.civs.some(c => c.ruler === 'player');
  const metalHead = head && !['linen_hood', 'leather_cap', 'silk_hood', 'fox_hood'].includes(P.equip.head);
  const gathering = !!P.toolAnim && P.swing > 0;
  const female = P.sex === 'f';
  return {
    body: torso ? torso.color : ((P.style && P.style.tunic) || (female ? '#8f3d5e' : '#3d6b8f')), legs: legs ? legs.color : ((P.style && P.style.pants) || '#4a3a2a'),
    hair: People.hairAt(P.hairBase || '#4a2a12', P.age || 25), hairStyle: (P.style && P.style.hair) || (female ? 'long' : 'short'),
    beardStyle: female ? 'none' : ((P.style && P.style.beard) || ((P.age || 25) >= 22 ? 'short' : 'none')), fem: female, skirt: female && !legs && !(P.style && P.style.noSkirt), skin: P.skin || '#f0c896',
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
