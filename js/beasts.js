'use strict';
// Animais da fazenda (vaca, ovelha, galinha) e o Dragão Ancestral redesenhados no mesmo estilo dos animais
// selvagens (patas com joelho e casco, corpo com volume, cabeça detalhada). Os bichos do curral ficam dentro da cerca.

// ------------------------------------------------------------------ fazenda
function drawFarmAnimal(ctx, x, y, kind, dir, moving, anim) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
  if (kind === 'chicken') { drawChicken(ctx, moving, anim); ctx.restore(); return; }
  const cow = kind === 'cow';
  const L = cow ? { leg: 9, bx: 14, bh: 10, lw: 2.8, c: '#f2efe6', hoof: '#2a2018' }
    : { leg: 6, bx: 10, bh: 9, lw: 2, c: '#efe9dc', hoof: '#2a2420' };
  ell(ctx, 0, 0, L.bx + 2, 3.4, 'rgba(0,0,0,0.25)');
  const by = -L.leg - L.bh / 2, top = by - L.bh / 2;
  const sw = k => moving ? Math.sin(anim * 13 + k) * 0.45 : 0;
  const legC = cow ? '#efe9dc' : '#3a3028';
  const leg = (lx, ph, far) => {
    const a = sw(ph), kx = lx + Math.sin(a) * L.leg * 0.4, ky = by + L.bh * 0.3 + L.leg * 0.5;
    const fx = kx + Math.sin(a * 1.2) * L.leg * 0.35, fy = -Math.max(0, Math.sin(anim * 13 + ph)) * (moving ? 1.4 : 0);
    limb2(ctx, lx, by + L.bh * 0.1, kx, ky, fx, fy - 0.8, L.lw, far ? shd(legC, -0.2) : legC);
    rr(ctx, fx - L.lw * 0.55, fy - 1.6, L.lw * 1.1, 1.6, 0.4, L.hoof);
  };
  leg(-L.bx * 0.6, Math.PI, true); leg(L.bx * 0.5, 0, true);
  if (cow) {
    // cauda com tufo
    const tw = moving ? Math.sin(anim * 8) * 0.3 : Math.sin(anim * 2.5) * 0.2;
    ctx.save(); ctx.translate(-L.bx + 1, top + 2); ctx.rotate(0.35 + tw); limb(ctx, 0, 0, -1, 9, 1.2, L.c); ell(ctx, -1.2, 10, 1.6, 2.2, '#2a2018'); ctx.restore();
    ell(ctx, 0, by, L.bx, L.bh / 2, L.c);
    ell(ctx, -L.bx * 0.6, by - 0.5, L.bh * 0.55, L.bh * 0.58, L.c); ell(ctx, L.bx * 0.55, by, L.bh * 0.58, L.bh * 0.6, L.c);
    // manchas pretas
    ell(ctx, -5, by - 2, 4.6, 3.2, '#2a2420', 0.3); ell(ctx, 5, by + 1, 3.6, 2.6, '#2a2420', -0.2); ell(ctx, -10.5, by + 1.5, 2.4, 2, '#2a2420');
    ell(ctx, 0, by + 3.8, 8, 1.6, 'rgba(0,0,0,0.1)');
    ell(ctx, -3, by + L.bh * 0.45, 3, 1.8, '#f0b8b0'); // úbere
    leg(-L.bx * 0.42, 0, false); leg(L.bx * 0.66, Math.PI, false);
    const hx = L.bx + 3, hy = top + 1;
    limb(ctx, L.bx * 0.7, top + 3, hx - 1, hy + 1, 6, L.c);
    ell(ctx, hx, hy, 3.6, 3.4, L.c); ell(ctx, hx + 3.4, hy + 2.2, 2.8, 2.2, '#f0c8b8'); ell(ctx, hx + 4.6, hy + 2, 0.5, 0.5, '#5a3a30');
    ell(ctx, hx - 0.6, hy - 1.6, 2, 1.6, '#2a2420'); // mancha na cabeça
    ell(ctx, hx + 0.8, hy - 0.6, 0.8, 0.8, '#1a120a');
    ell(ctx, hx - 2.4, hy - 1, 2.2, 0.9, L.c, -0.4);
    limb(ctx, hx - 0.6, hy - 2.8, hx - 2, hy - 5, 1.1, '#e8dcb8'); limb(ctx, hx + 0.8, hy - 2.8, hx + 1.6, hy - 5.2, 1.1, '#e8dcb8'); // chifres
  } else {
    // ovelha: lã em tufos, cara e patas escuras
    ell(ctx, -L.bx + 0.5, top + 3, 2.2, 2, L.c);
    for (const [ox, oy, r] of [[-7, -1, 4.2], [-3, -3, 4.6], [2, -3, 4.6], [6, -1, 4.2], [-6, 2.6, 4], [0, 2.8, 4.4], [5, 2.4, 4]]) ell(ctx, ox, by + oy, r, r * 0.9, L.c);
    for (const [ox, oy] of [[-5, -4], [0, -5], [4.5, -4], [-2, 0], [3, 0]]) ell(ctx, ox, by + oy, 1.6, 1.2, '#fbf7ee');
    ell(ctx, 0, by + 4.6, 8, 1.4, 'rgba(0,0,0,0.12)');
    leg(-L.bx * 0.42, 0, false); leg(L.bx * 0.62, Math.PI, false);
    const nod = moving ? Math.sin(anim * 13) * 0.5 : Math.sin(anim * 1.5) * 0.4;
    const hx = L.bx + 1.5, hy = top + 3 + nod;
    ell(ctx, hx - 2, hy - 1, 3.4, 3, L.c); // topete de lã
    ell(ctx, hx + 0.6, hy + 0.8, 2.6, 2.4, '#3a3028'); ell(ctx, hx + 3, hy + 1.8, 1.8, 1.5, '#3a3028');
    ell(ctx, hx - 1.8, hy + 0.4, 2.2, 0.9, '#3a3028', 0.4); // orelha
    ell(ctx, hx + 1.2, hy, 0.7, 0.7, '#f0e0a0'); ctx.fillStyle = '#1a120a'; ctx.fillRect(hx + 1, hy - 0.2, 0.6, 0.4);
  }
  ctx.restore();
}
function drawChicken(ctx, moving, anim) {
  const bob = moving ? Math.abs(Math.sin(anim * 14)) * 1.2 : 0, pk = !moving && Math.sin(anim * 1.7) > 0.8 ? 3 : 0, px = pk * 0.5;
  ell(ctx, 0, 0, 6, 1.8, 'rgba(0,0,0,0.25)');
  const st = moving ? Math.sin(anim * 14) * 1.6 : 0;
  limb2(ctx, -1, -4, -1.4 + st * 0.3, -2, -1 + st, 0, 1, '#e8a030'); limb2(ctx, 1.4, -4, 1.4 - st * 0.3, -2, 1.6 - st, 0, 1, '#e8a030');
  ctx.translate(0, -bob);
  poly(ctx, [-4, -8, -9, -14, -7.5, -8.5, -10, -11, -5, -6], '#d8d0c0'); // cauda
  poly(ctx, [-5, -9, -8.4, -15, -6, -9], '#2a5a3a');
  ell(ctx, 0, -7.4, 5.6, 4.2, '#f4f0e6'); ell(ctx, -1, -6.6, 3.4, 2.4, '#e2dccc', 0.3); // asa
  ell(ctx, 3.6 + px, -11.4 + pk, 2.6, 2.6, '#f4f0e6');
  poly(ctx, [2.6 + px, -13.4 + pk, 3.4 + px, -15.4 + pk, 4.4 + px, -13.8 + pk, 5 + px, -15 + pk, 5.4 + px, -13 + pk], '#d83020'); // crista
  poly(ctx, [5.8 + px, -11.8 + pk, 8 + px, -11 + pk, 5.8 + px, -10.2 + pk], '#e8a030'); // bico
  ell(ctx, 5.2 + px, -9.6 + pk, 0.8, 1.2, '#d83020');
  ctx.fillStyle = '#1a120a'; ctx.fillRect(4.2 + px, -12.2 + pk, 0.9, 0.9);
}

// ------------------------------------------------------------------ dragão
function drawDragon(ctx, x, y, dir, anim, hurt) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir * 1.6, 1.6);
  const H = c => hurt ? shd('#ff8a8a', 0) : c;
  const body = H('#a8282a'), dark = H('#6a1414'), belly = H('#e0a860'), mem = H('#7a1e22'), bone = H('#4a0c0e');
  const flap = Math.sin(anim * 3), breathe = Math.sin(anim * 1.6) * 0.6;
  ell(ctx, 0, 0, 32, 7, 'rgba(0,0,0,0.35)');
  // asa: membrana com "dedos" de osso
  const wing = (sx, sy, k, col, b) => {
    const tipY = -52 - flap * 12 * k, midY = -44 - flap * 9 * k;
    poly(ctx, [sx, sy, sx - 10, tipY + 6, sx - 22, tipY, sx - 28, midY + 8, sx - 34, midY + 16, sx - 20, sy + 2], col);
    ctx.strokeStyle = b; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx - 10, tipY + 6); ctx.lineTo(sx - 22, tipY);
    ctx.moveTo(sx - 10, tipY + 6); ctx.lineTo(sx - 28, midY + 8); ctx.moveTo(sx - 10, tipY + 6); ctx.lineTo(sx - 34, midY + 16); ctx.moveTo(sx - 10, tipY + 6); ctx.lineTo(sx - 20, sy + 2);
    ctx.stroke();
  };
  wing(-2, -26, 0.8, shd(mem, -0.25), shd(bone, -0.2));
  // cauda que balança, terminando em ponta
  const sway = Math.sin(anim * 2) * 4;
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, tx = -16 - t * 34, ty = -16 + t * 8 + Math.sin(t * 3 + anim * 2) * sway * t;
    ell(ctx, tx, ty, 6.5 - t * 5, 5.5 - t * 4, body);
    if (k % 2 === 0 && k < 9) poly(ctx, [tx - 2, ty - (5 - t * 4), tx, ty - (9 - t * 6), tx + 2, ty - (5 - t * 4)], dark);
    if (k === 10) poly(ctx, [tx + 1, ty - 1, tx - 7, ty - 5, tx - 4, ty, tx - 7, ty + 5], dark);
  }
  // patas com garras (as do lado de lá mais escuras)
  const pata = (lx, ph, far) => {
    const a = Math.sin(anim * 4 + ph) * 0.15, c = far ? shd(body, -0.25) : body;
    const kx = lx + 4 + a * 6, ky = -10, fx = lx + a * 4, fy = -1;
    limb2(ctx, lx, -16, kx, ky, fx, fy, 5.2, c);
    for (const cx of [-1.5, 1, 3.5]) poly(ctx, [fx + cx, fy, fx + cx + 2.4, fy + 1.4, fx + cx + 0.6, fy - 1], H('#e8dcc0'));
  };
  pata(-11, 0, true); pata(9, 1.5, true);
  // corpo, peito e barriga com escamas
  ell(ctx, 0, -18, 21, 11 + breathe, body);
  ell(ctx, 11, -20, 10, 11.5 + breathe, body);
  ell(ctx, -11, -17, 10, 10, body);
  ell(ctx, 3, -11 + breathe * 0.5, 15, 4.2, belly);
  ctx.fillStyle = H('#c08848'); for (let k = -10; k <= 14; k += 4) ctx.fillRect(k, -13 + breathe * 0.5, 0.8, 5);
  ell(ctx, -2, -25, 16, 3, 'rgba(255,255,255,0.08)');
  // espinhos das costas
  for (let k = -16; k <= 12; k += 5) poly(ctx, [k - 2.4, -27 - breathe, k + 0.6, -34 - breathe - (k > 0 ? 1 : 0), k + 2.6, -27 - breathe], dark);
  pata(-7, 3, false); pata(14, 4.5, false);
  // pescoço em S e cabeça com chifres
  const hb = Math.sin(anim * 1.4) * 1.6;
  for (let k = 0; k <= 7; k++) {
    const t = k / 7, nx = 14 + t * 16, ny = -24 - t * 16 - Math.sin(t * Math.PI) * 3 + hb * t;
    ell(ctx, nx, ny, 6.4 - t * 2, 6 - t * 1.8, body);
    if (k % 2 === 1) poly(ctx, [nx - 2, ny - 5, nx, ny - 9, nx + 2, ny - 5], dark);
  }
  const hx = 32, hy = -41 + hb;
  poly(ctx, [hx - 3, hy - 3, hx - 12, hy - 10, hx - 6, hy - 4], H('#e8dcc0')); poly(ctx, [hx - 1, hy - 4, hx - 7, hy - 13, hx - 2, hy - 6], H('#e8dcc0'));
  ell(ctx, hx, hy, 7.4, 5.4, body);
  ell(ctx, hx + 7, hy + 1.6, 6.4, 3.4, body); // focinho
  ell(ctx, hx + 6, hy + 4.4, 5.6, 1.8, dark); // mandíbula
  ctx.fillStyle = H('#f2ead8'); for (let k = 0; k < 4; k++) ctx.fillRect(hx + 4 + k * 2, hy + 3, 0.9, 1.6); // dentes
  ell(ctx, hx + 12.4, hy + 0.4, 0.8, 0.6, '#1a0a0a'); // narina
  ell(ctx, hx + 1.4, hy - 1.6, 1.8, 1.3, '#ffd34a'); ctx.fillStyle = '#1a0a0a'; ctx.fillRect(hx + 1.2, hy - 2.6, 0.6, 2); // olho de pupila em fenda
  ell(ctx, hx - 1, hy - 3.4, 3.2, 1, dark, -0.2);
  for (let k = 0; k < 2; k++) { const t = (anim * 0.8 + k * 0.5) % 1; ell(ctx, hx + 13 + t * 4, hy - 1 - t * 8, 1.4 + t * 2.4, 1.2 + t * 2, `rgba(90,80,80,${0.45 * (1 - t)})`); } // fumaça
  wing(4, -26, 1, mem, bone);
  // sopro de fogo
  if (Math.sin(anim * 1.3) > 0.85) {
    const g = ctx.createLinearGradient(hx + 12, 0, hx + 48, 0); g.addColorStop(0, 'rgba(255,240,150,0.95)'); g.addColorStop(0.5, 'rgba(255,140,40,0.85)'); g.addColorStop(1, 'rgba(200,40,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx + 12, hy + 2); ctx.quadraticCurveTo(hx + 30, hy - 10, hx + 48, hy - 6); ctx.quadraticCurveTo(hx + 32, hy + 4, hx + 48, hy + 12); ctx.quadraticCurveTo(hx + 30, hy + 10, hx + 12, hy + 3); ctx.fill();
    for (let k = 0; k < 5; k++) { const t = (anim * 3 + k * 0.21) % 1; ell(ctx, hx + 14 + t * 34, hy + 2 + Math.sin(k * 7 + anim * 9) * t * 8, 2.6 * (1 - t) + 0.6, 2.2 * (1 - t) + 0.5, `rgba(255,${180 - k * 20},60,${0.8 * (1 - t)})`); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ bichos do curral ficam dentro da cerca
{
  const amb0 = Farm.ambient.bind(Farm);
  Farm.ambient = function () {
    amb0();
    for (const e of G.ents) {
      if (e.dead || !e.tag || !e.tag.startsWith('pet') || e.pen) continue;
      const s = World.structs[parseInt(e.tag.slice(3), 10)];
      if (!s || s.removed || s.type !== 'pen') continue;
      e.pen = { x0: (s.x + 0.45) * TILE, y0: (s.y + 0.9) * TILE, x1: (s.x + s.w - 0.45) * TILE, y1: (s.y + s.h - 0.15) * TILE };
      e.x = U.rnd(e.pen.x0, e.pen.x1); e.y = U.rnd(e.pen.y0, e.pen.y1); e.home = { x: (e.pen.x0 + e.pen.x1) / 2, y: (e.pen.y0 + e.pen.y1) / 2 };
    }
  };
  const up0 = Creature.prototype.update;
  Creature.prototype.update = function (dt) {
    const r = up0.call(this, dt);
    const p = this.pen;
    if (p && !this.dead) { if (this.x < p.x0 || this.x > p.x1) { this.x = U.clamp(this.x, p.x0, p.x1); this.dir = -this.dir; } this.y = U.clamp(this.y, p.y0, p.y1); }
    return r;
  };
}
