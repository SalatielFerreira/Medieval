'use strict';
// O campo de batalha, mais bonito e mais útil:
//  • 🌄 O terreno: sem os quadrados de estrada soltos no meio da grama. Lama pisoteada, crateras onde as pedras das
//    catapultas caem, flechas cravadas no chão; nos acampamentos, estandartes nas cores do reino, carroças de
//    suprimentos, fardos de feno, armeiros e estacas afiadas na frente das linhas.
//  • 🏰 O castelo: muralhas de pedra com ameias e passadiço, torres redondas com telhado nas cores do reino e bandeira,
//    a casa do portão com arco, portas reforçadas e grade levadiça (que racham conforme apanham), a torre de menagem com
//    telhado, janelas acesas e estandartes, e o pátio calçado de pedra com uma estrada de terra até o portão.
//  • 🪨 As catapultas: estrutura de madeira com rodas raiadas, feixe de cordas, braço com a concha e a pedra, e o
//    estandarte do lado de cada uma; o braço dispara quando ela atira.
//  • 📊 O placar: os brasões e as cores dos dois lados, quantos infantes, arqueiros, cavaleiros e catapultas cada um tem,
//    se o rei está de pé, a barra de forças e a vida do portão.
//  • 📯 Ordens para o seu exército (botões no pé da tela): ⚔️ Atacar, 🛡️ Segurar a linha e ↩️ Recuar.
// Os desenhos pesados (muralhas, torres, portão, menagem, catapultas) ficam guardados prontos (por tamanho e zoom).
const BF = {
  cache: new Map(),
  res(ctx) { const tf = ctx.getTransform(); return Math.max(1, Math.min(3, Math.round(Math.hypot(tf.a, tf.b) * 2) / 2)); },
  sprite(ctx, key, w, h, padT, padX, draw) {
    const r = this.res(ctx), k = key + '@' + r; let c = this.cache.get(k);
    if (!c) {
      c = document.createElement('canvas'); c.width = Math.ceil((w + padX * 2) * r); c.height = Math.ceil((h + padT + 6) * r);
      const g = c.getContext('2d'); g.scale(r, r); g.translate(padX, padT); draw(g, w, h);
      if (this.cache.size > 260) this.cache.clear(); this.cache.set(k, c);
    }
    ctx.drawImage(c, -padX, -padT, w + padX * 2, h + padT + 6);
  },
  seen(ctx, X, Y, w, h, padT) { const tf = ctx.getTransform(), s = Math.hypot(tf.a, tf.b) || 1, vw = ctx.canvas.width / s, vh = ctx.canvas.height / s; return X + w > -90 && Y + h > -40 && X < vw + 90 && Y - padT < vh + 60; },
  hash(a, b) { return U.hash2(a | 0, b | 0, 13); },
  // pedras de muralha: fileiras desencontradas com leve variação de tom
  stones(g, x, y, w, h, base, seed, bw = 14, bh = 7) {
    g.fillStyle = shd(base, -0.28); g.fillRect(x, y, w, h);
    for (let r = 0, yy = y; yy < y + h; r++, yy += bh) {
      const off = r % 2 ? bw / 2 : 0;
      for (let xx = x - off; xx < x + w; xx += bw) {
        const x0 = Math.max(x, xx + 1), x1 = Math.min(x + w, xx + bw - 1), y1 = Math.min(y + h, yy + bh - 1);
        if (x1 <= x0 || y1 <= yy + 1) continue;
        const v = (this.hash(xx * 3 + seed, yy * 7) - 0.5) * 0.14;
        g.fillStyle = shd(base, v); g.fillRect(x0, yy + 1, x1 - x0, y1 - yy - 1);
        g.fillStyle = shd(base, v + 0.12); g.fillRect(x0, yy + 1, x1 - x0, 1);
      }
    }
  },
  flag(g, x, y, col, time, len = 18) {
    g.fillStyle = '#3a2a1a'; g.fillRect(x - 1, y, 2, len + 8);
    const wv = Math.sin(time * 4 + x) * 2;
    g.fillStyle = col; g.beginPath(); g.moveTo(x + 1, y); g.quadraticCurveTo(x + len * 0.5, y + 2 + wv, x + len, y + 3 + wv); g.lineTo(x + len - 2, y + 7 + wv); g.quadraticCurveTo(x + len * 0.5, y + 10 - wv, x + 1, y + 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 1, y + 1, len * 0.6, 2);
  },
};
const BF_STONE = '#a49d90';
// propriedades dos enfeites novos: no chão (por baixo das pessoas) ou de pé (na ordem de profundidade, sem bloquear)
if (typeof FURN !== 'undefined') Object.assign(FURN, { bf_mud: { flat: true }, bf_crater: { flat: true }, bf_arrows: { flat: true }, bf_yard: { flat: true }, bf_road: { flat: true },
  bf_banner: {}, bf_hay: {}, bf_wagon: {}, bf_rack: {}, bf_stakes: {} });

// ------------------------------------------------------------------ o terreno e os enfeites, depois de montar a batalha
const BFField = {
  rng: null,
  r() { return this.rng(); },
  add(k, x, y, w, h, extra) { const f = Object.assign({ k, x, y, w: w || 1, h: h || 1, id: Places.furn.length }, FURN[k] || {}, extra || {}); Places.furn.push(f); return f; },
  // tira os quadrados de estrada soltos no meio da grama (e a estrada/pátio de terra do castelo: viram enfeite no chão)
  clean(B) {
    for (let y = B.fy0; y < B.fy0 + B.h; y++) for (let x = B.fx0; x < B.fx0 + B.w; x++) { const i = World.idx(x, y); if (World.tiles[i] === T.ROAD) World.tiles[i] = T.GRASS; }
    World.chunks.clear();
  },
  decorate(B) {
    this.rng = U.mulberry32(((B.id || 1) * 7919 + G.day) >>> 0);
    const A = B.assault, cy = B.fy0 + B.h / 2;
    this.clean(B);
    if (A) {
      this.add('bf_yard', A.x0 + 1, A.y0 + 1, A.w - 2, A.h - 2);
      this.add('bf_road', B.fx0 + 16, A.gy - 1, A.x0 - (B.fx0 + 16) + 1, 5);
    }
    // lama pisoteada no meio do campo
    for (let k = 0; k < 26; k++) {
      const x = B.fx0 + 14 + this.r() * (B.w - 28), y = B.fy0 + 6 + this.r() * (B.h - 12);
      if (A && x > A.x0 - 2) continue;
      this.add('bf_mud', Math.floor(x), Math.floor(y), 1, 1, { rx: 18 + this.r() * 46, ry: 8 + this.r() * 18, tone: this.r() });
    }
    for (let k = 0; k < 10; k++) { const x = B.fx0 + 30 + this.r() * (B.w - 60), y = B.fy0 + 8 + this.r() * (B.h - 16); if (A && x > A.x0 - 3) continue; this.add('bf_arrows', Math.floor(x), Math.floor(y), 1, 1, { n: 3 + Math.floor(this.r() * 5), seed: k }); }
    // os acampamentos: estandartes, carroças, feno e armeiros (atrás das tropas, sem bloquear ninguém)
    const camp = (x0, ci, flip) => {
      for (const [dx, dy, k] of [[0, -14, 'bf_banner'], [0, 13, 'bf_banner'], [-6, -5, 'bf_wagon'], [-7, 7, 'bf_hay'], [-4, 10, 'bf_hay'], [-5, -11, 'bf_rack'], [3, -16, 'bf_hay']]) {
        const x = Math.round(x0 + dx * flip), y = Math.round(cy + dy);
        if (x < B.fx0 + 1 || x > B.fx0 + B.w - 3 || y < B.fy0 + 1 || y > B.fy0 + B.h - 2) continue;
        this.add(k, x, y, k === 'bf_wagon' ? 3 : k === 'bf_rack' ? 2 : 1, 1, { civ: ci, flip });
      }
    };
    if (A) { camp(B.fx0 + 12, A.att, 1); for (let k = -2; k <= 2; k++) this.add('bf_stakes', A.x0 - 5, Math.round(A.gy + 1 + k * 4 - 1), 1, 3, { civ: A.def }); }
    else {
      camp(B.fx0 + Math.round(B.w * 0.38) - 24, B.side, 1); camp(B.fx0 + Math.round(B.w * 0.62) + 22, B.enemy, -1);
      // estacas afiadas na frente das linhas
      for (const [x, ci] of [[B.fx0 + Math.round(B.w * 0.38) + 3, B.side], [B.fx0 + Math.round(B.w * 0.62) - 4, B.enemy]]) for (let k = -3; k <= 3; k++) if (k !== 0) this.add('bf_stakes', x, Math.round(cy + k * 5 - 1), 1, 3, { civ: ci });
    }
  },
  crater(x, y) {
    const B = G.place; if (!B || B.kind !== 'battle') return;
    const n = Places.furn.filter(f => f.k === 'bf_crater').length; if (n > 40) { const i = Places.furn.findIndex(f => f.k === 'bf_crater'); if (i >= 0) Places.furn.splice(i, 1); }
    this.add('bf_crater', Math.floor(x / TILE), Math.floor(y / TILE), 1, 1, { ox: x - Math.floor(x / TILE) * TILE, oy: y - Math.floor(y / TILE) * TILE, r: 12 + Math.random() * 8 });
  },
};

// ------------------------------------------------------------------ os desenhos
const BFDraw = {
  wall(ctx, f, X, Y) {
    const w = f.w * TILE, h = f.h * TILE;
    if (!f.vert) {
      const up = 30;
      BF.sprite(ctx, `cw|${f.w}|${f.h}|${f.x % 2}`, w, h, up + 12, 2, (g) => {
        BF.stones(g, 0, -up + 12, w, h + up - 14, BF_STONE, f.x);
        g.fillStyle = shd(BF_STONE, 0.18); g.fillRect(0, -up + 2, w, 11);              // o passadiço
        g.fillStyle = shd(BF_STONE, -0.35); g.fillRect(0, -up + 12, w, 2);
        for (let x = 1; x < w; x += 12) { g.fillStyle = shd(BF_STONE, 0.08); g.fillRect(x, -up - 8, 7, 10); g.fillStyle = shd(BF_STONE, -0.3); g.fillRect(x + 6, -up - 8, 1.5, 10); g.fillStyle = shd(BF_STONE, 0.3); g.fillRect(x, -up - 8, 7, 1.5); } // ameias
        g.fillStyle = 'rgba(60,90,40,0.35)'; for (let x = 0; x < w; x += 9) g.fillRect(x, h - 4 - (x * 7 % 3), 5, 3);   // musgo no pé
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, h - 2, w, 4);
      });
    } else {
      BF.sprite(ctx, `cv|${f.w}`, w, h, 26, 2, (g) => {
        BF.stones(g, 0, -26, w, h + 26, shd(BF_STONE, -0.04), 5, 12, 7);
        g.fillStyle = shd(BF_STONE, 0.16); g.fillRect(9, -26, w - 18, h + 26);           // o passadiço visto de cima
        for (const x of [1, w - 8]) { g.fillStyle = shd(BF_STONE, 0.06); g.fillRect(x, -26, 7, h + 26); g.fillStyle = shd(BF_STONE, -0.32); for (let y = -26 + 9; y < h; y += 12) g.fillRect(x, y, 7, 3); }
      });
    }
  },
  tower(ctx, f, X, Y, time) {
    const w = f.w * TILE, h = f.h * TILE, col = f.civ >= 0 ? Game.civColor(f.civ) : '#8e1f2a';
    BF.sprite(ctx, `ct|${f.w}|${col}`, w, h, 96, 4, (g) => {
      const cx = w / 2, top = -50, R = w / 2 - 3;
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx, h - 6, R + 4, 9, 0, 0, Math.PI * 2); g.fill();
      const grd = g.createLinearGradient(cx - R, 0, cx + R, 0); grd.addColorStop(0, shd(BF_STONE, -0.32)); grd.addColorStop(0.45, shd(BF_STONE, 0.12)); grd.addColorStop(1, shd(BF_STONE, -0.4));
      g.fillStyle = grd; g.fillRect(cx - R, top, R * 2, h - 6 - top); g.beginPath(); g.ellipse(cx, h - 6, R, 7, 0, 0, Math.PI); g.fill();
      g.strokeStyle = 'rgba(40,36,30,0.35)'; g.lineWidth = 1; for (let y = top + 8; y < h - 8; y += 8) { g.beginPath(); g.moveTo(cx - R, y); g.quadraticCurveTo(cx, y + 3, cx + R, y); g.stroke(); }
      for (const y of [top + 18, top + 40]) { g.fillStyle = '#1e1c22'; g.fillRect(cx - 2, y, 4, 11); }          // seteiras
      g.fillStyle = shd(BF_STONE, 0.1); g.beginPath(); g.ellipse(cx, top, R + 3, 8, 0, 0, Math.PI * 2); g.fill(); // o anel das ameias
      for (let k = 0; k < 7; k++) { const a = Math.PI * (k / 6), x = cx - Math.cos(a) * (R + 1); g.fillStyle = shd(BF_STONE, k % 2 ? -0.1 : 0.06); g.fillRect(x - 3, top - 2 + Math.sin(a) * 6, 6, 8); }
      // telhado cônico nas cores do reino
      g.fillStyle = col; g.beginPath(); g.moveTo(cx - R - 5, top - 2); g.lineTo(cx, top - 44); g.lineTo(cx + R + 5, top - 2); g.quadraticCurveTo(cx, top + 5, cx - R - 5, top - 2); g.fill();
      g.fillStyle = shd(col, -0.35); g.beginPath(); g.moveTo(cx, top - 44); g.lineTo(cx + R + 5, top - 2); g.quadraticCurveTo(cx + R * 0.4, top + 3, cx + 2, top + 2); g.fill();
      g.strokeStyle = shd(col, -0.45); g.lineWidth = 1; for (let k = 1; k < 4; k++) { const yy = top - 2 - k * 10; const half = (R + 5) * (1 - k / 4.4); g.beginPath(); g.moveTo(cx - half, yy + 2); g.quadraticCurveTo(cx, yy + 5, cx + half, yy + 2); g.stroke(); }
    });
    BF.flag(ctx, w / 2, -96 - 18 + 2, col, time, 16);
  },
  gate(ctx, f, X, Y) {
    const w = f.w * TILE, h = f.h * TILE, A = Assault.A(), dmg = A && A.gateMax ? 1 - A.gateHp / A.gateMax : 0, step = f.broken ? 9 : Math.min(3, Math.floor(dmg * 4));
    BF.sprite(ctx, `cg|${f.w}|${f.h}|${step}`, w, h, 40, 6, (g) => {
      BF.stones(g, -4, -36, w + 8, h + 34, shd(BF_STONE, -0.06), 9, 12, 7);
      for (let x = -4; x < w + 4; x += 11) { g.fillStyle = shd(BF_STONE, 0.1); g.fillRect(x, -44, 7, 9); }
      // o arco e a passagem
      const ax = 6, aw = w - 12, ay = 6;
      g.fillStyle = '#16120e'; g.beginPath(); g.moveTo(ax, h - 2); g.lineTo(ax, ay + aw / 2); g.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); g.lineTo(ax + aw, h - 2); g.fill();
      g.strokeStyle = shd(BF_STONE, 0.25); g.lineWidth = 3; g.beginPath(); g.arc(ax + aw / 2, ay + aw / 2, aw / 2 + 2, Math.PI, 0); g.stroke();
      if (step === 9) { // arrombado: lascas e entulho
        for (let k = 0; k < 9; k++) { g.fillStyle = k % 3 ? '#6a4423' : '#5a5650'; g.save(); g.translate(ax + 4 + (k * 13) % (aw - 6), h - 10 - (k * 7) % 22); g.rotate(k); g.fillRect(-5, -2, 10, 4); g.restore(); }
        return;
      }
      // as portas de madeira com cintas de ferro
      g.fillStyle = '#6e4626'; g.beginPath(); g.moveTo(ax + 2, h - 2); g.lineTo(ax + 2, ay + aw / 2); g.arc(ax + aw / 2, ay + aw / 2, aw / 2 - 2, Math.PI, 0); g.lineTo(ax + aw - 2, h - 2); g.fill();
      g.fillStyle = '#4a2e16'; for (let x = ax + 8; x < ax + aw - 4; x += 8) g.fillRect(x, ay + 6, 1.5, h - ay - 8); g.fillRect(ax + aw / 2 - 1, ay, 2, h - ay);
      g.fillStyle = '#3a3a42'; for (const y of [ay + 20, h * 0.55, h - 16]) { g.fillRect(ax + 2, y, aw - 4, 4); for (let x = ax + 6; x < ax + aw - 4; x += 9) { g.fillStyle = '#8a8f96'; g.fillRect(x, y + 1, 2, 2); g.fillStyle = '#3a3a42'; } }
      // a grade levadiça no alto
      g.fillStyle = 'rgba(40,40,46,0.9)'; for (let x = ax + 4; x < ax + aw - 2; x += 7) g.fillRect(x, ay + 2, 2, 16); g.fillRect(ax + 2, ay + 10, aw - 4, 2);
      // rachaduras conforme apanha
      g.strokeStyle = '#1e140a'; g.lineWidth = 2;
      if (step >= 1) { g.beginPath(); g.moveTo(ax + 10, ay + 30); g.lineTo(ax + 18, ay + 44); g.lineTo(ax + 12, ay + 58); g.stroke(); }
      if (step >= 2) { g.beginPath(); g.moveTo(ax + aw - 10, h * 0.5); g.lineTo(ax + aw - 20, h * 0.62); g.lineTo(ax + aw - 14, h * 0.78); g.stroke(); g.fillStyle = '#1e140a'; g.fillRect(ax + 14, h * 0.7, 9, 6); }
      if (step >= 3) { g.fillStyle = '#120c06'; g.fillRect(ax + aw / 2 - 8, h * 0.4, 16, 12); g.fillRect(ax + 6, h - 30, 12, 8); }
    });
  },
  keep(ctx, f, X, Y, time) {
    const w = f.w * TILE, h = f.h * TILE, col = f.civ >= 0 ? Game.civColor(f.civ) : '#8e1f2a', night = G.darkness > 0.2;
    BF.sprite(ctx, `ck|${f.w}|${f.h}|${col}|${night ? 1 : 0}`, w, h, 120, 6, (g) => {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-4, h - 6, w + 8, 10);
      BF.stones(g, 0, -60, w, h + 56, shd(BF_STONE, 0.04), 21, 16, 8);
      g.fillStyle = shd(BF_STONE, -0.3); g.fillRect(0, -60, 8, h + 56); g.fillRect(w - 8, -60, 8, h + 56);
      // telhado de duas águas nas cores do reino
      g.fillStyle = shd(col, -0.2); g.beginPath(); g.moveTo(-6, -58); g.lineTo(w / 2, -112); g.lineTo(w + 6, -58); g.fill();
      g.fillStyle = col; g.beginPath(); g.moveTo(-6, -58); g.lineTo(w / 2, -112); g.lineTo(w / 2, -58); g.fill();
      g.strokeStyle = shd(col, -0.45); g.lineWidth = 1; for (let k = 1; k < 6; k++) { const yy = -58 - k * 9, hw = (w / 2 + 6) * (1 - k / 6); g.beginPath(); g.moveTo(w / 2 - hw, yy); g.lineTo(w / 2 + hw, yy); g.stroke(); }
      g.fillStyle = shd(BF_STONE, 0.2); g.fillRect(-6, -60, w + 12, 4);
      // janelas (acesas de noite) e a porta em arco
      for (const x of [22, w / 2 - 6, w - 34]) for (const y of [-44, -14]) { g.fillStyle = '#1a1620'; g.fillRect(x, y, 12, 16); g.beginPath(); g.arc(x + 6, y, 6, Math.PI, 0); g.fill(); if (night) { g.fillStyle = '#ffcf6b'; g.fillRect(x + 2, y + 1, 8, 13); } }
      g.fillStyle = '#4a2e16'; g.fillRect(w / 2 - 15, h - 40, 30, 38); g.beginPath(); g.arc(w / 2, h - 40, 15, Math.PI, 0); g.fill();
      g.fillStyle = '#3a3a42'; g.fillRect(w / 2 - 15, h - 28, 30, 3); g.fillRect(w / 2 - 15, h - 14, 30, 3);
      // estandartes compridos
      for (const x of [10, w - 26]) { g.fillStyle = col; g.fillRect(x, -52, 16, 40); g.beginPath(); g.moveTo(x, -12); g.lineTo(x + 8, -4); g.lineTo(x + 16, -12); g.fill(); g.fillStyle = 'rgba(255,230,160,0.8)'; g.fillRect(x + 6, -44, 4, 18); g.fillRect(x + 2, -38, 12, 4); g.fillStyle = '#c8a24a'; g.fillRect(x - 2, -54, 20, 3); }
    });
    BF.flag(ctx, w / 2, -112 - 30, col, time, 22);
  },
  catapult(ctx, x, y, dir, anim, hurt, swing, side, civ) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(dir, 1);
    const col = civ >= 0 && G.civs[civ] ? Game.civColor(civ) : side === 'player' ? PLAYER_COLOR : '#8e1f2a';
    BF.sprite(ctx, `cat|${col}|${hurt ? 1 : 0}`, 0, 0, 52, 32, (g) => {
      const wood = hurt ? '#c07060' : '#8a5e34', dark = hurt ? '#8a4a40' : '#4e321a', light = '#a8784a';
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 0, 28, 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = dark; g.fillRect(-24, -13, 48, 6); g.fillStyle = wood; g.fillRect(-24, -15, 48, 4); g.fillStyle = light; g.fillRect(-24, -15, 48, 1.5); // chassi
      g.fillStyle = wood; g.beginPath(); g.moveTo(-6, -13); g.lineTo(0, -34); g.lineTo(6, -13); g.lineTo(3, -13); g.lineTo(0, -28); g.lineTo(-3, -13); g.fill(); // o cavalete
      g.fillStyle = '#c8b48a'; g.fillRect(-10, -18, 8, 6); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 4; k++) g.fillRect(-10 + k * 2, -18, 1, 6); // feixe de cordas
      g.fillStyle = col; g.fillRect(14, -26, 9, 9); g.fillStyle = shd(col, -0.3); g.fillRect(14, -18, 9, 2); g.fillStyle = '#3a2a1a'; g.fillRect(13, -30, 1.5, 18); // estandarte
      for (const wx of [-16, 16]) { g.fillStyle = dark; g.beginPath(); g.arc(wx, -6, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = wood; g.beginPath(); g.arc(wx, -6, 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = dark; g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(wx - Math.cos(a) * 5, -6 - Math.sin(a) * 5); g.lineTo(wx + Math.cos(a) * 5, -6 + Math.sin(a) * 5); g.stroke(); } g.fillStyle = '#3a3a42'; g.beginPath(); g.arc(wx, -6, 1.6, 0, Math.PI * 2); g.fill(); }
    });
    // o braço (animado): deitado para trás, dispara para a frente quando atira
    const fire = Math.max(0, swing || 0), arm = fire > 0 ? -0.15 - (0.4 - Math.min(0.4, fire)) * 1.2 : -1.25;
    ctx.save(); ctx.translate(-6, -16); ctx.rotate(arm);
    ctx.fillStyle = hurt ? '#8a4a40' : '#5a3a1e'; ctx.fillRect(-2, -34, 4, 36);
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(0, -35, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    if (!(fire > 0.05)) { ctx.fillStyle = '#7a756a'; ctx.beginPath(); ctx.arc(0, -37, 3.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  },
  // enfeites
  furn(ctx, f, X, Y, time) {
    const w = f.w * TILE;
    switch (f.k) {
      case 'bf_mud': { const t = f.tone; ctx.fillStyle = `rgba(${70 + t * 20 | 0},${52 + t * 10 | 0},${30},0.32)`; ctx.beginPath(); ctx.ellipse(X + 16, Y + 16, f.rx, f.ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(40,28,16,0.18)'; ctx.beginPath(); ctx.ellipse(X + 16 + f.rx * 0.2, Y + 18, f.rx * 0.55, f.ry * 0.5, 0, 0, Math.PI * 2); ctx.fill(); return; }
      case 'bf_crater': { const cx = X + f.ox, cy = Y + f.oy; ctx.fillStyle = 'rgba(30,22,14,0.45)'; ctx.beginPath(); ctx.ellipse(cx, cy, f.r, f.r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(120,96,64,0.4)'; ctx.beginPath(); ctx.ellipse(cx, cy - f.r * 0.15, f.r * 1.2, f.r * 0.7, 0, Math.PI, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,96,64,0.35)'; ctx.stroke(); return; }
      case 'bf_arrows': { for (let k = 0; k < f.n; k++) { const ax = X + 4 + BF.hash(f.seed, k) * 24, ay = Y + 6 + BF.hash(k, f.seed) * 20; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 4, ay - 9); ctx.stroke(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(ax - 5, ay - 11, 3, 3); } return; }
      case 'bf_yard': {
        if (!BFDraw.yardPat) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#7e786c'; g.fillRect(0, 0, 64, 64); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const off = r % 2 ? 8 : 0, v = (BF.hash(r, k) - 0.5) * 0.16; g.fillStyle = shd('#9a9488', v); g.fillRect(k * 16 + off - (off && k === 3 ? 16 : 0) + 1, r * 16 + 1, 14, 14); g.fillStyle = shd('#9a9488', v + 0.12); g.fillRect(k * 16 + off - (off && k === 3 ? 16 : 0) + 1, r * 16 + 1, 14, 1); } BFDraw.yardPat = ctx.createPattern(c, 'repeat'); }
        ctx.save(); ctx.translate(X, Y); ctx.fillStyle = BFDraw.yardPat; ctx.fillRect(0, 0, f.w * TILE, f.h * TILE); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, f.w * TILE, 10); ctx.restore(); return;
      }
      case 'bf_road': {
        const h = f.h * TILE; ctx.fillStyle = 'rgba(112,86,54,0.85)'; ctx.beginPath(); ctx.moveTo(X, Y + h * 0.18); ctx.bezierCurveTo(X + w * 0.4, Y + h * 0.05, X + w * 0.7, Y + h * 0.3, X + w, Y + h * 0.2); ctx.lineTo(X + w, Y + h * 0.82); ctx.bezierCurveTo(X + w * 0.7, Y + h * 0.7, X + w * 0.4, Y + h * 0.95, X, Y + h * 0.82); ctx.fill();
        ctx.strokeStyle = 'rgba(70,52,30,0.5)'; ctx.lineWidth = 2; for (const k of [0.38, 0.62]) { ctx.beginPath(); ctx.moveTo(X, Y + h * k); ctx.bezierCurveTo(X + w * 0.4, Y + h * (k - 0.06), X + w * 0.7, Y + h * (k + 0.06), X + w, Y + h * k); ctx.stroke(); }
        return;
      }
      case 'bf_banner': { const col = f.civ >= 0 ? Game.civColor(f.civ) : '#8e1f2a'; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 28, 8, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a321a'; ctx.fillRect(X + 15, Y - 34, 3, 62); ctx.fillStyle = '#c8a24a'; ctx.fillRect(X + 6, Y - 34, 20, 3); const wv = Math.sin(time * 3 + f.x) * 1.5; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X + 7, Y - 31); ctx.lineTo(X + 25, Y - 31); ctx.lineTo(X + 25 + wv, Y - 4); ctx.lineTo(X + 16, Y + 2); ctx.lineTo(X + 7 + wv, Y - 4); ctx.fill(); ctx.fillStyle = 'rgba(255,230,160,0.75)'; ctx.fillRect(X + 14, Y - 26, 4, 18); ctx.fillRect(X + 10, Y - 20, 12, 4); return; }
      case 'bf_hay': { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 26, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c8a24a'; ctx.fillRect(X + 3, Y + 8, 26, 18); ctx.fillStyle = '#e0c068'; ctx.fillRect(X + 3, Y + 8, 26, 4); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(X + 9, Y + 8, 2, 18); ctx.fillRect(X + 21, Y + 8, 2, 18); return; }
      case 'bf_rack': { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(X + 2, Y + 4, 3, 24); ctx.fillRect(X + w - 5, Y + 4, 3, 24); ctx.fillRect(X + 2, Y + 8, w - 4, 3); for (let k = 0; k < 5; k++) { const x = X + 9 + k * 10; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, Y - 12, 2, 38); ctx.fillStyle = '#b8bec6'; ctx.beginPath(); ctx.moveTo(x - 2, Y - 12); ctx.lineTo(x + 1, Y - 22); ctx.lineTo(x + 4, Y - 12); ctx.fill(); } return; }
      case 'bf_wagon': {
        const col = f.civ >= 0 ? Game.civColor(f.civ) : '#8e1f2a';
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + 28, w / 2, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7a5230'; ctx.fillRect(X + 6, Y + 6, w - 12, 16); ctx.fillStyle = '#5a3a1e'; ctx.fillRect(X + 6, Y + 18, w - 12, 4);
        ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(X + 8, Y + 8); ctx.quadraticCurveTo(X + w / 2, Y - 18, X + w - 8, Y + 8); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(X + w / 2 - 6, Y - 4, 12, 6);
        for (const wx of [X + 16, X + w - 16]) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(wx, Y + 24, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.arc(wx, Y + 24, 3, 0, Math.PI * 2); ctx.fill(); }
        return;
      }
      case 'bf_stakes': { const h = f.h * TILE; for (let k = 0; k < 6; k++) { const y = Y + 4 + k * (h - 8) / 5, x = X + 10 + (k % 2) * 6; ctx.fillStyle = '#5a3a1e'; ctx.save(); ctx.translate(x, y); ctx.rotate(f.civ !== undefined && G.place && G.place.side === f.civ ? -0.7 : 0.7); ctx.fillRect(-1.5, -12, 3, 16); ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.moveTo(-1.5, -12); ctx.lineTo(0, -17); ctx.lineTo(1.5, -12); ctx.fill(); ctx.restore(); } ctx.fillStyle = '#4a2e16'; ctx.fillRect(X + 9, Y + 6, 3, h - 10); return; }
    }
  },
};

// ------------------------------------------------------------------ o placar e as ordens
const BFHud = {
  count(ci) {
    const o = { inf: 0, arc: 0, cav: 0, cat: 0, king: false };
    for (const e of War.units(ci)) { if (e.faction === 'engine') o.cat++; else if (e.battleKing) o.king = true; else if (e.mounted) o.cav++; else if (e.archer) o.arc++; else o.inf++; }
    return o;
  },
  draw(ctx, cw) {
    const B = G.place; if (!B || B.kind !== 'battle') return;
    const a = this.count(B.side), b = this.count(B.enemy), na = a.inf + a.arc + a.cav + a.cat, nb = b.inf + b.arc + b.cav + b.cat;
    // no celular o placar fica entre o cartão do herói (esquerda) e o relógio (direita)
    const small = document.body.classList.contains('small'), w = small ? Math.max(280, Math.min(520, cw - 370)) : Math.min(640, cw - 24), x = cw / 2 - w / 2, y = small ? 6 : 12, H = 62;
    ctx.save();
    ctx.fillStyle = 'rgba(18,13,8,0.86)'; ctx.strokeStyle = 'rgba(214,174,96,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 8, y - 6, w + 16, H, 10) : ctx.rect(x - 8, y - 6, w + 16, H); ctx.fill(); ctx.stroke();
    const shield = (sx, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 11, y); ctx.lineTo(sx + 11, y); ctx.lineTo(sx + 11, y + 13); ctx.quadraticCurveTo(sx, y + 26, sx - 11, y + 13); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e8c06a'; ctx.lineWidth = 1.5; ctx.stroke(); };
    const ca = Game.civColor(B.side), cb = Game.civColor(B.enemy);
    shield(x + 12, ca); shield(x + w - 12, cb);
    ctx.font = 'bold 13px Georgia, serif'; ctx.fillStyle = '#ffe9a8'; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText(`${CIV_DEFS[B.side].short}${a.king ? ' 👑' : ''}`, x + 30, y + 12);
    ctx.textAlign = 'right'; ctx.fillText(`${b.king ? '👑 ' : ''}${CIV_DEFS[B.enemy].short}`, x + w - 30, y + 12);
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#e8d8b0';
    const line = o => `⚔️${o.inf}  🏹${o.arc}  🐎${o.cav}  🪨${o.cat}`;
    ctx.textAlign = 'left'; ctx.fillText(line(a), x + 30, y + 27); ctx.textAlign = 'right'; ctx.fillText(line(b), x + w - 30, y + 27);
    // a barra de forças
    const by = y + 34, bw = w - 8, tot = Math.max(1, na + nb), split = bw * na / tot;
    ctx.fillStyle = '#2a1e12'; ctx.fillRect(x + 4, by, bw, 10);
    const g1 = ctx.createLinearGradient(0, by, 0, by + 10); g1.addColorStop(0, shd(ca, 0.25)); g1.addColorStop(1, shd(ca, -0.2)); ctx.fillStyle = g1; ctx.fillRect(x + 4, by, split, 10);
    const g2 = ctx.createLinearGradient(0, by, 0, by + 10); g2.addColorStop(0, shd(cb, 0.25)); g2.addColorStop(1, shd(cb, -0.2)); ctx.fillStyle = g2; ctx.fillRect(x + 4 + split, by, bw - split, 10);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x + 4 + split - 1, by - 2, 2, 14);
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(na, x + 8, by + 9); ctx.textAlign = 'right'; ctx.fillText(nb, x + w - 8, by + 9);
    ctx.textAlign = 'center'; ctx.font = 'bold 12px Georgia, serif'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText(B.phase === 'intro' ? `Os exércitos se encaram... ${Math.max(1, Math.ceil(4 - B.t))}` : B.done ? '' : ({ hold: '🛡️ Segurando a linha', fall: '↩️ Recuando', charge: '⚔️ À carga!' }[B.order] || '⚔️'), cw / 2, y + 20);
    // o portão (assalto a castelo ou a vila)
    const A = B.assault;
    if (A && A.gateMax) {
      const gw = Math.min(260, w * 0.5), gx = cw / 2 - gw / 2, gy = y + H + 2;
      ctx.fillStyle = 'rgba(18,13,8,0.86)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(gx - 8, gy - 2, gw + 16, 24, 8) : ctx.rect(gx - 8, gy - 2, gw + 16, 24); ctx.fill(); ctx.strokeStyle = 'rgba(214,174,96,0.5)'; ctx.stroke();
      ctx.fillStyle = '#3a2410'; ctx.fillRect(gx, gy + 13, gw, 5); ctx.fillStyle = A.gateHp > 0 ? '#d8963e' : '#6a6a6a'; ctx.fillRect(gx, gy + 13, gw * Math.max(0, A.gateHp) / A.gateMax, 5);
      ctx.font = 'bold 10.5px sans-serif'; ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center';
      ctx.fillText(A.gateHp > 0 ? `🚪 ${A.village !== undefined ? 'Portão da vila' : 'Portão'}: ${Math.ceil(A.gateHp).toLocaleString('pt-BR')} / ${A.gateMax.toLocaleString('pt-BR')} (${Math.round(A.gateHp / A.gateMax * 100)}%)` : `🚪 Portão arrombado · ${A.village !== undefined ? 'tomem a vila!' : 'derrube o rei!'}`, cw / 2, gy + 10);
    }
    ctx.restore();
  },
  // botões de ordem para o seu exército
  bar() {
    let el = document.getElementById('bfOrders');
    if (!el) {
      el = document.createElement('div'); el.id = 'bfOrders'; el.className = 'hidden';
      el.innerHTML = [['charge', '⚔️', 'Atacar'], ['hold', '🛡️', 'Segurar'], ['fall', '↩️', 'Recuar']].map(([k, i, l]) => `<button data-o="${k}"><span>${i}</span><b>${l}</b></button>`).join('');
      el.addEventListener('click', e => { const b = e.target.closest('button[data-o]'); if (!b) return; e.stopPropagation(); BFHud.order(b.dataset.o); });
      document.body.appendChild(el);
    }
    return el;
  },
  canOrder() { const B = G.place; return !!(B && B.kind === 'battle' && !B.done && !P.dead && !(B.assault && B.assault.mode === 'defend')); },
  order(o) {
    const B = G.place; if (!this.canOrder()) return;
    B.order = o; UI.msg({ charge: '⚔️ À carga! Todos contra o inimigo.', hold: '🛡️ Segurem a linha: ninguém sai do lugar.', fall: '↩️ Recuar! O exército volta para perto do acampamento.' }[o]);
    Sound.play('horn');
    if (o === 'charge' && !B.assault) for (const e of War.units(B.side)) if (e.faction !== 'engine' && !e.battleKing) { e.aggroOv = 80; e.home = e.home || { x: e.x, y: e.y }; }
    this.sync();
  },
  sync() { const el = this.bar(), B = G.place, on = this.canOrder() && B.phase === 'fight'; el.classList.toggle('hidden', !on); if (on) for (const b of el.querySelectorAll('button')) b.classList.toggle('on', b.dataset.o === (B.order || 'charge')); },
  // as ordens valem a cada quadro (depois do comando de cada modo de batalha)
  apply() {
    const B = G.place; if (!B || B.kind !== 'battle' || B.phase !== 'fight' || B.done || !B.order || B.order === 'charge') return;
    if (B.assault && B.assault.mode === 'defend') return;
    const back = B.order === 'fall' ? -7 * TILE : 0, R = B.order === 'hold' ? 6 : 2.5;
    for (const e of G.ents) {
      if (e.dead || e.battle !== B.id || e.wside !== B.side || e.faction === 'engine' || e.battleKing) continue;
      if (!e.bfStart) e.bfStart = { x: e.x, y: e.y };
      e.home = { x: e.bfStart.x + back, y: e.bfStart.y }; e.aggroOv = R;
      if (e.target && U.dist(e.target.x, e.target.y, e.x, e.y) > R * TILE) e.target = null;
      if (!e.target) { e.wx = e.home.x; e.wy = e.home.y; e.wt = 0.6; }
    }
  },
};

{
  // montar a batalha: o terreno limpo e os enfeites (campo aberto e assalto)
  const ws0 = War.start.bind(War);
  War.start = function (...a) { const r = ws0(...a); try { if (G.place && G.place.kind === 'battle' && !G.place.fake) BFField.decorate(G.place); } catch (e) { console.error(e); } return r; };
  // os soldados guardam o lugar de partida (para segurar a linha e recuar)
  const dp0 = War.deploy.bind(War);
  War.deploy = function (...a) { const n0 = G.ents.length; const r = dp0(...a); for (let i = n0; i < G.ents.length; i++) { const e = G.ents[i]; if (e && e.battle) e.bfStart = { x: e.x, y: e.y }; } return r; };
  // crateras onde as pedras caem
  const ld0 = War.land.bind(War);
  War.land = function (b) { const r = ld0(b); try { BFField.crater(b.x1, b.y1); } catch (e) { console.error(e); } return r; };
  // as ordens e os botões
  const up0 = War.update.bind(War);
  War.update = function (dt) { const r = up0(dt); try { BFHud.apply(); BFHud.sync(); } catch (e) { console.error(e); } return r; };
  // o placar novo (inclui o portão)
  War.drawHud = function (ctx, cw) { BFHud.draw(ctx, cw); };
  // os desenhos novos
  const df0 = drawFurn;
  // eslint-disable-next-line no-global-assign
  drawFurn = function (ctx, f, X, Y, time) {
    const k = f.k;
    if (k && k.startsWith('bf_')) { if (BF.seen(ctx, X, Y, f.w * TILE, f.h * TILE, 60)) BFDraw.furn(ctx, f, X, Y, time); return; }
    if (k === 'cwall' || k === 'ctower' || k === 'cgate' || k === 'ckeep') {
      if (!BF.seen(ctx, X, Y, f.w * TILE, f.h * TILE, 160)) return;
      ctx.save(); ctx.translate(Math.round(X), Math.round(Y));
      try { if (k === 'cwall') BFDraw.wall(ctx, f, 0, 0); else if (k === 'ctower') BFDraw.tower(ctx, f, 0, 0, time); else if (k === 'cgate') BFDraw.gate(ctx, f, 0, 0); else BFDraw.keep(ctx, f, 0, 0, time); }
      finally { ctx.restore(); }
      return;
    }
    return df0(ctx, f, X, Y, time);
  };
  // a catapulta nova (o aríete continua o mesmo)
  const de0 = drawEngine;
  // eslint-disable-next-line no-global-assign
  drawEngine = function (ctx, x, y, kind, dir, anim, moving, hurt, swing, side) {
    if (kind !== 'catapult_e') return de0(ctx, x, y, kind, dir, anim, moving, hurt, swing, side);
    const B = G.place, civ = B && B.kind === 'battle' ? (side === 'player' ? (B.assault ? (B.assault.mode === 'defend' ? B.assault.def : B.assault.att) : B.side) : (B.assault ? (B.assault.mode === 'defend' ? B.assault.att : B.assault.def) : B.enemy)) : -1;
    BFDraw.catapult(ctx, x, y, dir, anim, hurt, swing, side, civ);
  };
}
