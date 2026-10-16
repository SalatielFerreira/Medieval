'use strict';
// Clima visual do mundo: brilho quente das luzes à noite, tons do amanhecer e do entardecer, fumaça nas chaminés,
// reflexos na água, sombras de nuvens, pássaros de dia, vaga-lumes nas noites quentes e bordas da tela suavemente escuras.
// Tudo é só desenho (não muda o jogo) e pode ser desligado em Ajustes → Tela ("Efeitos de ambiente").

const SMOKE_FROM = { vhouse: 1, tavern: 1, smith: 1, forge: 1, oven: 1, cabin: 1, house: 1, manor: 1, biz_bakery: 1, smokehouse: 1, kiln: 1, biz_smithy: 1, fforge: 1, biz_inn: 1, ptavern: 1, castle: 0.6 };

const Ambience = {
  smoke: [], birds: null, emitT: 0, vig: null, vigKey: '',
  on() { return G.settings.ambience !== false; },
  outdoors() { return !G.dungeon && !Places.room(); },
  // fumaça das chaminés (casas com gente, oficinas e tavernas)
  updateSmoke(dt, vis) {
    this.emitT -= dt;
    if (this.emitT <= 0 && this.outdoors()) {
      this.emitT = 0.12;
      const h = Game.hour();
      for (const s of vis) {
        const k = SMOKE_FROM[s.type]; if (!k || s.ruined) continue;
        if (s.type === 'vhouse' && !(Routine.lit(s) || (h >= 6 && h < 9))) continue;
        if (U.hash2(s.id, Math.floor(G.realTime * 3), 91) > 0.32 * k) continue;
        const cx = (s.x + s.w * (s.type === 'castle' ? 0.5 : 0.74)) * TILE, cy = s.y * TILE + (s.type === 'castle' ? 6 : 2);
        if (this.smoke.length < 220) this.smoke.push({ x: cx + U.rnd(-2, 2), y: cy, vx: U.rnd(4, 10), vy: U.rnd(-18, -12), life: 1, size: U.rnd(3, 5) });
      }
    }
    for (const p of this.smoke) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx += 3 * dt; p.life -= dt * 0.32; p.size += dt * 3.2; }
    this.smoke = this.smoke.filter(p => p.life > 0);
  },
  drawSmoke(ctx, cx, cy) {
    for (const p of this.smoke) { ctx.fillStyle = `rgba(215,215,220,${0.28 * p.life})`; ctx.beginPath(); ctx.arc(p.x - cx, p.y - cy, p.size, 0, Math.PI * 2); ctx.fill(); }
  },
  // brilhos que dançam na água
  drawWater(ctx, cx, cy, cw, ch, t) {
    if (World.season === 3) return;
    const x0 = Math.max(0, Math.floor(cx / TILE)), x1 = Math.min(WORLD_W - 1, Math.floor((cx + cw) / TILE)), y0 = Math.max(0, Math.floor(cy / TILE)), y1 = Math.min(WORLD_H - 1, Math.floor((cy + ch) / TILE));
    if ((x1 - x0) * (y1 - y0) > 5000) return;
    ctx.fillStyle = 'rgba(235,248,255,0.75)';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const tt = World.tiles[y * WORLD_W + x]; if (tt !== T.WATER && tt !== T.DEEP) continue;
      const hsh = U.hash2(x, y, 7); if (hsh > 0.12) continue;
      const ph = Math.sin(t * (1.4 + hsh * 6) + hsh * 40);
      if (ph < 0.55) continue;
      const len = Math.round(3 + ph * 5), ox = (hsh * 997) % 24, oy = (hsh * 577) % 26;
      ctx.globalAlpha = (ph - 0.55) * 2; ctx.fillRect(x * TILE - cx + ox, y * TILE - cy + oy, len, 1.5);
    }
    ctx.globalAlpha = 1;
  },
  // sombras de nuvens passando pelo chão (só de dia)
  drawClouds(ctx, cx, cy, cw, ch, t) {
    if (G.darkness > 0.05 || (G.weather && G.weather.level > 0.3)) return;
    const span = 3200, sp = 14;
    for (let k = 0; k < 6; k++) {
      const bx = (U.hash2(k, 1, 33) * span + t * sp) % span, by = U.hash2(k, 2, 33) * span;
      const wx = Math.floor((cx - bx) / span) * span + bx, wy = Math.floor((cy - by) / span) * span + by;
      for (const [ox, oy] of [[0, 0], [span, 0], [0, span], [span, span]]) {
        const x = wx + ox - cx, y = wy + oy - cy;
        if (x < -400 || y < -300 || x > cw + 400 || y > ch + 300) continue;
        const g = ctx.createRadialGradient(x, y, 20, x, y, 260);
        g.addColorStop(0, 'rgba(10,20,40,0.12)'); g.addColorStop(1, 'rgba(10,20,40,0)');
        ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1.6, 0.8); ctx.translate(-x, -y); ctx.fillRect(x - 260, y - 260, 520, 520); ctx.restore();
      }
    }
  },
  // brilho quente em volta das luzes (fogueiras, forjas, janelas, lampiões)
  glow(ctx, list, dark) {
    if (!list.length || dark < 0.15) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col] of list) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, r * 0.8);
      g.addColorStop(0, U.rgba(col || '#ff9a40', 0.22 * dark)); g.addColorStop(1, U.rgba(col || '#ff9a40', 0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  },
  // pássaros cruzando o céu de dia e vaga-lumes nas noites de primavera e verão (em pixels da tela)
  drawLife(ctx, sw, sh, t) {
    if (!this.outdoors()) return;
    if (G.darkness < 0.1 && World.season !== 3) {
      if (!this.birds || this.birds.t > this.birds.dur) this.birds = Math.random() < 0.004 ? { t: 0, dur: 14, y: U.rnd(0.12, 0.5) * sh, n: U.rint(3, 6), dir: Math.random() < 0.5 ? 1 : -1 } : (this.birds && this.birds.t <= this.birds.dur ? this.birds : null);
      const b = this.birds;
      if (b) {
        b.t += 1 / 60;
        const k = b.t / b.dur, bx = b.dir > 0 ? -60 + k * (sw + 120) : sw + 60 - k * (sw + 120);
        ctx.strokeStyle = 'rgba(30,30,40,0.7)'; ctx.lineWidth = 1.6;
        for (let i = 0; i < b.n; i++) {
          const x = bx - b.dir * i * 16, y = b.y + Math.abs(i - b.n / 2) * 9 + Math.sin(t * 2 + i) * 3, f = Math.sin(t * 10 + i * 1.3) * 3;
          ctx.beginPath(); ctx.moveTo(x - 6, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 6, y - f); ctx.stroke();
        }
      }
    }
    if (G.darkness > 0.4 && (World.season === 0 || World.season === 1) && !(G.weather && G.weather.level > 0.2)) {
      for (let i = 0; i < 26; i++) {
        const hx = U.hash2(i, 5, 71), hy = U.hash2(i, 9, 71);
        const x = (hx * sw + Math.sin(t * 0.5 + i) * 40 + sw) % sw, y = (hy * sh + Math.cos(t * 0.4 + i * 2) * 30 + sh) % sh;
        const a = Math.max(0, Math.sin(t * (1.5 + hx * 2) + i * 3));
        if (a < 0.2) continue;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, `rgba(220,255,120,${0.85 * a})`); g.addColorStop(1, 'rgba(220,255,120,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 7, y - 7, 14, 14);
      }
    }
  },
  // cor do céu: rosado no amanhecer, dourado no entardecer
  tint(ctx, sw, sh) {
    if (!this.outdoors()) return;
    const h = Game.hour();
    let col = null, a = 0;
    if (h >= 6 && h < 8.5) { col = '255,160,140'; a = 0.17 * (1 - (h - 6) / 2.5); }
    else if (h >= 16 && h < 21) { col = '255,140,50'; a = 0.24 * Math.min(1, (h - 16) / 3) * (h > 20.2 ? Math.max(0, (21 - h) / 0.8) : 1); }
    if (col && a > 0.005) {
      ctx.fillStyle = `rgba(${col},${a.toFixed(3)})`; ctx.fillRect(0, 0, sw, sh);
      // o fim da tarde também escurece um pouco, puxando para o lilás
      if (h >= 18) { ctx.fillStyle = `rgba(60,30,80,${(Math.min(1, (h - 18) / 2) * 0.12).toFixed(3)})`; ctx.fillRect(0, 0, sw, sh); }
    }
  },
  vignette(ctx, sw, sh) {
    const key = sw + 'x' + sh;
    if (this.vigKey !== key) {
      this.vigKey = key;
      const c = document.createElement('canvas'); c.width = Math.max(1, sw >> 2); c.height = Math.max(1, sh >> 2);
      const g = c.getContext('2d'), gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.hypot(c.width, c.height) * 0.62);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,6,2,0.38)');
      g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      this.vig = c;
    }
    if (this.vig) ctx.drawImage(this.vig, 0, 0, sw, sh);
  },
};
