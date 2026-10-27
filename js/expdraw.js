'use strict';
// Desenho das construções novas no mapa (com dia e noite, estações e animação) e os ícones delas no menu Construção.

{
  const d0 = drawStructExtra;
  // eslint-disable-next-line no-global-assign
  drawStructExtra = function (ctx, s, X, Y, time, H) {
    const b = EXPB[s.type];
    if (!b) return d0(ctx, s, X, Y, time, H);
    const { R, roof, house, flame, flag, shadow, w, h } = H, L = b.look;
    const night = G.darkness > 0.2, sn = World.season, winter = Season.winter();
    const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); };
    const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X + pts[0], Y + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(X + pts[i], Y + pts[i + 1]); ctx.closePath(); ctx.fill(); };
    const line = (x1, y1, x2, y2, c, lw) => { ctx.strokeStyle = c; ctx.lineWidth = lw || 1; ctx.beginPath(); ctx.moveTo(X + x1, Y + y1); ctx.lineTo(X + x2, Y + y2); ctx.stroke(); };
    const sign = (x, y, ic) => { R(x, y, 14, 11, '#5a3a1e'); R(x + 1, y + 1, 12, 9, '#7a5230'); ctx.font = '8px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(ic, X + x + 1.5, Y + y + 8.5); };
    const glow = (x, y, ww, hh) => R(x, y, ww, hh, night ? U.rgba('#ffd36b', 0.85 + Math.sin(time * 3 + s.id) * 0.12) : '#2a2a3a');
    const fence = (c) => { ctx.strokeStyle = c || '#8b5f38'; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, w - 4, h - 4); for (let k = 4; k < w; k += 10) { R(k, -1, 2, 5, '#7a5230'); R(k, h - 5, 2, 5, '#7a5230'); } };
    const snow = (x, y, ww) => { if (winter) R(x, y, ww, 3, '#f4f8fc'); };
    const smoke = (x, y) => { for (let k = 0; k < 3; k++) { const t = (time * 0.6 + k / 3) % 1; ell(x + Math.sin(t * 6 + k) * 3, y - t * 22, 3 + t * 4, 3 + t * 4, `rgba(200,200,200,${0.45 * (1 - t)})`); } };
    const person = (x, y, c) => { ell(x, y - 9, 2.6, 2.6, '#f0c896'); R(x - 2.5, y - 7, 5, 7, c); };
    switch (L.k) {
      case 'house': {
        house(L.wall, L.roof);
        if (L.tall) { R(12, 52, 8, 8, '#2a2a3a'); R(w - 20, 52, 8, 8, '#2a2a3a'); glow(13, 53, 6, 6); glow(w - 19, 53, 6, 6); R(6, 48, w - 12, 2, U.shade(L.wall, -0.2)); }
        if (L.long) { for (let x = 24; x < w - 24; x += 20) { R(x, 32, 8, 8, '#2a2a3a'); glow(x + 1, 33, 6, 6); } R(2, 20, 6, 6, '#c8a860'); R(w - 8, 20, 6, 6, '#c8a860'); }
        if (L.big) { for (let x = 14; x < w - 14; x += 22) { R(x, 30, 4, h - 36, U.shade(L.wall, -0.1)); } R(w / 2 - 14, h - 6, 28, 4, '#c8bfa8'); flag(10, 4, PLAYER_COLOR); if (L.palace) { flag(w - 14, 4, PLAYER_COLOR); ell(w / 2, 4, 10, 8, '#d8b84a'); ell(w / 2, 4, 6, 5, U.shade(L.roof, 0.2)); } }
        if (L.steam) for (let k = 0; k < 2; k++) smoke(16 + k * (w - 32), 10);
        if (L.barrels) for (let k = 0; k < 3; k++) { ell(10 + k * 9, h - 6, 4, 5, '#8a5a30'); R(6 + k * 9, h - 8, 8, 1, '#4a4a52'); }
        if (L.sign) sign(w - 24, 30, L.sign);
        snow(4, 2, w - 8);
        break;
      }
      case 'tower': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 6, Y + h - 6, w - 10, 8);
        R(10, -26, w - 20, h + 20, L.wall); for (let k = -20; k < h - 6; k += 7) R(10, k, w - 20, 1, U.shade(L.wall, -0.18));
        R(10, -26, 5, h + 20, U.shade(L.wall, -0.15));
        poly([6, -26, w / 2, -54, w - 6, -26], L.roof); R(6, -27, w - 12, 3, U.shade(L.roof, -0.2));
        R(w / 2 - 6, h - 20, 12, 16, '#3a2410'); R(w / 2 - 4, -10, 8, 10, '#2a2a3a'); glow(w / 2 - 3, -9, 6, 8); glow(w / 2 - 3, 18, 6, 8);
        flag(w / 2 - 1, -54, PLAYER_COLOR); snow(8, -27, w - 16);
        break;
      }
      case 'tent': {
        shadow(); const c = L.c, d = U.shade(c, -0.25);
        poly([4, h - 4, w / 2, 6, w - 4, h - 4], c); poly([w / 2, 6, w - 4, h - 4, w / 2 + 6, h - 4], d);
        for (let k = 0; k < 3; k++) line(w / 2 - 2 - k * 7, 14 + k * 12, w / 2 - 6 - k * 9, h - 4, L.s, 2);
        poly([w / 2 - 5, h - 4, w / 2, h - 18, w / 2 + 5, h - 4], '#2a1a0e'); R(w / 2 - 1, 0, 2, 8, '#5a3a1e'); flag(w / 2 - 1, 2, PLAYER_COLOR);
        if (night) flame(w - 8, h - 2, 0.4);
        break;
      }
      case 'treehouse': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 6, Y + h - 6, w - 10, 8);
        R(w / 2 - 6, 10, 12, h - 12, '#6a4423'); R(w / 2 - 6, 10, 4, h - 12, '#4a2e16');
        const leaf = sn === 3 ? '#c8d0d0' : sn === 2 ? '#c8883a' : '#3d7a2a';
        for (const [x, y, r] of [[8, 0, 14], [w - 8, 2, 14], [w / 2, -12, 16], [w / 2 - 14, -4, 12], [w / 2 + 14, -6, 12]]) ell(x, y, r, r * 0.8, leaf);
        R(6, 6, w - 12, 18, '#9a6a3a'); for (let k = 8; k < 24; k += 4) R(6, k, w - 12, 1, '#7a5230'); poly([2, 8, w / 2, -6, w - 2, 8], '#6a4a2a');
        R(w / 2 - 4, 12, 8, 12, '#3a2410'); glow(10, 12, 6, 6); glow(w - 16, 12, 6, 6);
        for (let k = 26; k < h - 2; k += 5) R(w - 16, k, 8, 2, '#8a6a42'); R(w - 16, 24, 2, h - 26, '#6a4423'); R(w - 10, 24, 2, h - 26, '#6a4423');
        break;
      }
      case 'shed': {
        shadow(); R(4, 22, w - 8, h - 26, L.wall); roof(2, 6, w - 4, 18, L.roof);
        R(8, 26, w - 16, h - 32, U.shade(L.wall, -0.35));
        if (L.logs) for (let k = 0; k < 3; k++) { R(10, h - 14 + k * 3, 30, 3, ['#a8743e', '#c89a5a', '#8a5a30'][k]); ell(40, h - 12.5 + k * 3, 1.6, 1.5, '#e0c08a'); }
        if (L.anvil) { R(w / 2 - 10, h - 12, 20, 5, '#4a4a52'); R(w / 2 - 5, h - 8, 10, 6, '#3a3a40'); const sp = Math.sin(time * 9) > 0.7; if (sp) for (let k = 0; k < 3; k++) R(w / 2 + k * 3 - 3, h - 18 - k * 2, 1, 1, '#ffd34a'); }
        if (L.sign) sign(w - 22, 30, L.sign);
        snow(2, 6, w - 4);
        break;
      }
      case 'kiln': {
        shadow(); R(4, 26, w - 8, h - 30, L.wall); for (let k = 30; k < h - 4; k += 6) R(4, k, w - 8, 1, U.shade(L.wall, -0.15));
        ctx.fillStyle = U.shade(L.wall, -0.1); ctx.beginPath(); ctx.ellipse(X + w / 2, Y + 28, w / 2 - 4, 22, 0, Math.PI, 0); ctx.fill();
        R(w - 18, -14, 10, 28, '#6a5a50'); smoke(w - 13, -16);
        const f = 0.7 + Math.sin(time * 8) * 0.2; ctx.fillStyle = `rgba(255,140,40,${f})`; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 10, 9, Math.PI, 0); ctx.fill(); R(w / 2 - 9, h - 10, 18, 6, `rgba(255,190,80,${f})`);
        if (L.glass) for (let k = 0; k < 4; k++) { R(6 + k * 6, h - 22, 4, 8, ['#4ac8e0', '#5ad87a', '#a8d8e8', '#c84ac8'][k]); R(7 + k * 6, h - 24, 2, 2, '#e8f8ff'); }
        if (L.sign) sign(6, 30, L.sign);
        break;
      }
      case 'bench': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 6);
        R(4, 8, w - 8, 10, L.top); R(4, 16, w - 8, 3, U.shade(L.top, -0.3)); R(6, 18, 4, 12, '#4a2e16'); R(w - 10, 18, 4, 12, '#4a2e16');
        L.items.forEach((c, k) => { ell(14 + k * 14, 6, 4, 3, c); ell(13 + k * 14, 5, 1.4, 1, '#ffffff'); });
        const sp = (time * 2) % 1 < 0.15; if (sp) ell(w - 14, 4, 2, 2, '#fff8c8'); R(w - 18, 0, 3, 8, '#9a9aa2');
        break;
      }
      case 'vats': {
        if (L.house) { house('#e8dcc0', '#6a3a6a'); sign(w - 24, 30, '🎨'); }
        const by = L.house ? h - 4 : h - 8;
        L.colors.forEach((c, k) => { const x = 14 + k * ((w - 28) / 2); ell(x, by - 6, 11, 6, '#6a4423'); ell(x, by - 8, 9, 4, c); ell(x - 3, by - 9, 3, 1.2, 'rgba(255,255,255,0.35)'); });
        if (!L.house) { line(4, 6, w - 4, 6, '#5a3a1e', 1); for (let k = 0; k < 4; k++) { const sw = Math.sin(time * 2 + k) * 1.5; R(10 + k * 20 + sw, 7, 12, 14, L.colors[k % 3]); } R(2, 2, 3, 30, '#5a3a1e'); R(w - 5, 2, 3, 30, '#5a3a1e'); }
        break;
      }
      case 'press': {
        if (L.house) { house('#e6d6b8', '#6a2a3a'); sign(w - 24, 30, '🫒'); break; }
        shadow(); R(6, 26, w - 12, h - 30, '#8a5a30'); R(4, 6, 4, 34, '#5a3a1e'); R(w - 8, 6, 4, 34, '#5a3a1e'); R(4, 4, w - 8, 6, '#6a4423');
        const turn = (time * 0.8) % (Math.PI * 2); R(w / 2 - 2, 8, 4, 18, '#9a9aa2'); line(w / 2 - Math.cos(turn) * 14, 12, w / 2 + Math.cos(turn) * 14, 12, '#6a4423', 3);
        ell(w / 2, 30, 16, 6, '#4a2e16'); ell(w / 2, 29, 13, 4, '#6a2a7a'); for (let k = 0; k < 2; k++) { ell(12 + k * (w - 24), h - 8, 6, 7, '#8a5a30'); R(6 + k * (w - 24), h - 10, 12, 1, '#4a4a52'); }
        break;
      }
      case 'quern': {
        shadow(); ell(w / 2, h / 2 + 8, w / 2 - 6, 14, '#8b8d93'); ell(w / 2, h / 2 + 4, w / 2 - 10, 11, '#a5a7ad');
        const a = time * 1.4; ell(w / 2, h / 2, 12, 7, '#9a9aa0'); line(w / 2, h / 2, w / 2 + Math.cos(a) * 26, h / 2 + Math.sin(a) * 10, '#6a4423', 3);
        ell(w / 2 + Math.cos(a) * 26, h / 2 + Math.sin(a) * 10 - 4, 3, 5, '#7a5a3a');
        for (let k = 0; k < 2; k++) { ell(8 + k * (w - 16), h - 8, 6, 7, '#e8dcc0'); R(5 + k * (w - 16), h - 15, 6, 2, '#c8b890'); }
        break;
      }
      case 'magetower': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 8, Y + h - 6, w - 14, 8);
        R(14, -34, w - 28, h + 28, '#6a6a80'); for (let k = -28; k < h - 6; k += 8) R(14, k, w - 28, 1, '#55556a'); R(14, -34, 5, h + 28, '#55556a');
        poly([8, -34, w / 2, -76, w - 8, -34], '#3a2a7a'); R(8, -35, w - 16, 3, '#2a1a5a');
        const st = Math.sin(time * 3) * 0.5 + 0.5; ell(w / 2, -76, 4, 4, `rgba(255,240,120,${0.5 + st * 0.5})`);
        for (const [x, y] of [[w / 2 - 4, -20], [w / 2 - 4, 8]]) { R(x, y, 8, 10, `rgba(${180 + st * 60},120,255,0.95)`); }
        R(w / 2 - 6, h - 20, 12, 16, '#2a1a3a');
        for (let k = 0; k < 3; k++) { const a = time * 1.5 + k * 2.1; ell(w / 2 + Math.cos(a) * 22, -40 + Math.sin(a) * 8, 1.6, 1.6, ['#c84ae0', '#4ac8e0', '#f0e060'][k]); }
        if (L.shop) sign(w - 20, h - 20, '🔮');
        break;
      }
      case 'field': {
        R(2, 2, w - 4, h - 4, L.soil); for (let k = 6; k < h - 2; k += 8) R(4, k + 3, w - 8, 2, U.shade(L.soil, -0.18));
        const off = (L.season || EXPB[s.type].fn.season) && winter;
        for (let k = 6; k < h - 4; k += 8) for (let j = 6; j < w - 4; j += L.stakes ? 10 : 7) {
          const sw = Math.sin(time * 2 + j * 0.3 + k) * 0.8;
          if (L.stakes) { R(j, k - (L.tall ? 16 : 9), 1.5, L.tall ? 18 : 11, '#7a5230'); }
          if (off) { R(j - 1, k - 2, 3, 2, '#8a8a7a'); continue; }
          ell(j + sw, k - (L.tall ? 10 : 4), 3.4, L.tall ? 7 : 4, L.plant);
          if (L.flower) { ell(j + sw, k - 9, 3, 3, L.fruit); ell(j + sw, k - 9, 1.2, 1.2, '#5a3a10'); }
          else if (sn === 1 || sn === 2) { ell(j + sw - 1, k - (L.tall ? 8 : 3), 1.6, 1.6, L.fruit); ell(j + sw + 1.5, k - (L.tall ? 12 : 5), 1.4, 1.4, L.fruit); }
        }
        fence('#7a5230');
        break;
      }
      case 'grove': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#e8eef2' : '#7a8a4a');
        for (let y = 18; y < h; y += 30) for (let x = 16; x < w; x += 32) {
          ell(x, y + 10, 8, 3, 'rgba(0,0,0,0.25)'); R(x - 2, y, 4, 12, '#6a5a3a');
          ell(x, y - 2, 12, 9, sn === 3 ? '#a8b0a8' : L.leaf); ell(x - 4, y - 5, 5, 3, U.shade(L.leaf, 0.15));
          if (sn === 2) for (let k = 0; k < 4; k++) ell(x - 6 + k * 4, y + (k % 2) * 3, 1.6, 1.6, L.fruit);
        }
        break;
      }
      case 'pen': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#e8eef2' : L.ground); fence();
        R(w - 26, 6, 22, 18, '#9a7a4a'); poly([w - 28, 8, w - 15, -2, w - 2, 8], '#6a4a2a');
        for (const [px, py, k] of [[16, 30, 0], [38, 22, 1], [30, 46, 2], [56, 40, 3]]) {
          if (px > w - 10 || py > h - 6) continue;
          const b = Math.sin(time * 2 + k) * 0.8; ell(px, py + b, 8, 5, L.animal); ell(px + 7, py - 3 + b, 3.4, 3, L.animal); R(px - 5, py + 4, 2, 4, '#5a4a3a'); R(px + 3, py + 4, 2, 4, '#5a4a3a');
          if (L.horn) { line(px + 7, py - 6 + b, px + 5, py - 9 + b, '#6a5a4a', 1.2); line(px + 8, py - 6 + b, px + 10, py - 9 + b, '#6a5a4a', 1.2); }
          ell(px + 9, py - 3 + b, 0.8, 0.8, '#1a1a1a');
        }
        break;
      }
      case 'pond': {
        ell(w / 2, h / 2, w / 2 - 2, h / 2 - 2, '#8b8d93'); ell(w / 2, h / 2, w / 2 - 6, h / 2 - 6, winter ? '#c8e0f0' : L.water);
        ell(w / 2 - 12, h / 2 - 6, 10, 3, 'rgba(255,255,255,0.22)');
        if (!winter) {
          if (L.lily) for (const [x, y] of [[16, 20], [w - 20, h - 18], [w / 2 + 6, 14]]) { ell(x, y, 5, 3, '#4f8a36'); ell(x + 1, y - 1, 1.5, 1.5, '#f0a0c0'); }
          if (L.carp) for (let k = 0; k < 3; k++) { const a = time * (0.7 + k * 0.25) + k * 2; ell(w / 2 + Math.cos(a) * 18, h / 2 + Math.sin(a) * 9, 4, 2, k === 1 ? '#f0f0f0' : '#e8742a'); }
          if (L.bird) for (let k = 0; k < 3; k++) { const a = time * 0.4 + k * 2.1; const x = w / 2 + Math.cos(a) * (w / 2 - 18), y = h / 2 + Math.sin(a) * (h / 2 - 14); ell(x, y, 5, 3, L.bird); ell(x + 4 * Math.sign(Math.cos(a + 1.6) || 1), y - 3, 2.4, 2.2, '#3a7a4a'); R(x + 5 * Math.sign(Math.cos(a + 1.6) || 1), y - 3, 3, 1.2, '#e8a030'); }
        }
        R(4, h - 8, 10, 6, '#4f8a36'); R(w - 14, 4, 8, 8, '#4f8a36');
        break;
      }
      case 'hutch': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 5, w - 8, 5);
        R(4, 6, w - 8, 20, '#9a6a3a'); poly([2, 8, w / 2, -4, w - 2, 8], '#6a4a2a');
        for (let k = 0; k < 2; k++) { R(8 + k * 26, 10, 20, 12, '#3a2410'); for (let j = 0; j < 5; j++) R(9 + k * 26 + j * 4, 10, 1, 12, '#9a9aa2'); ell(16 + k * 26, 18, 4, 3, k ? '#e0d4bc' : '#8a6a4a'); R(17 + k * 26, 13, 1.5, 4, k ? '#e0d4bc' : '#8a6a4a'); }
        R(6, 26, 4, 6, '#4a2e16'); R(w - 10, 26, 4, 6, '#4a2e16');
        break;
      }
      case 'barn': {
        shadow(); R(4, 24, w - 8, h - 28, L.wall); for (let x = 8; x < w - 4; x += 6) R(x, 24, 1, h - 28, U.shade(L.wall, -0.15));
        roof(2, 4, w - 4, 22, L.roof);
        if (L.open) { R(w / 2 - 22, h - 26, 44, 22, '#2a1a0e'); ell(w / 2 - 12, h - 8, 6, 6, '#6a4423'); ell(w / 2 + 12, h - 8, 6, 6, '#6a4423'); R(w / 2 - 18, h - 18, 36, 6, '#a8743e'); }
        else { R(w / 2 - 12, h - 24, 24, 20, U.shade(L.wall, -0.3)); line(w / 2 - 12, h - 24, w / 2 + 12, h - 4, '#e8dcc0', 1.4); line(w / 2 + 12, h - 24, w / 2 - 12, h - 4, '#e8dcc0', 1.4); }
        if (L.sign) sign(8, 28, L.sign); snow(2, 4, w - 4);
        break;
      }
      case 'shipyard': {
        R(2, h - 22, w - 4, 20, '#7a5230'); for (let k = h - 20; k < h; k += 5) R(2, k, w - 4, 1, '#5a3a1e');
        ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X + 14, Y + h - 30); ctx.quadraticCurveTo(X + w / 2, Y + h - 6, X + w - 14, Y + h - 30); ctx.stroke();
        for (let k = 0; k < 6; k++) { const x = 20 + k * ((w - 40) / 5); line(x, h - 30 + Math.abs(k - 2.5) * -2, x, h - 14 + Math.abs(k - 2.5) * 2, '#a8743e', 2); }
        R(w - 12, -10, 4, h - 6, '#5a3a1e'); line(w - 10, -8, w - 40, 0, '#5a3a1e', 3); line(w - 38, 0, w - 38, 14, '#9a9aa2', 1); R(w - 41, 14, 6, 5, '#6a4423');
        sign(6, 4, '⚓');
        break;
      }
      case 'charcoal': {
        for (const [x, y] of [[w / 2 - 14, h / 2 + 4], [w / 2 + 14, h / 2 + 10]]) { ell(x, y + 4, 16, 6, 'rgba(0,0,0,0.25)'); ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(X + x, Y + y, 14, 12, 0, Math.PI, 0); ctx.fill(); ell(x, y - 2, 10, 3, '#3a2a1e'); smoke(x, y - 12); if (night) ell(x, y - 1, 3, 1.5, '#ff8a30'); }
        for (let k = 0; k < 4; k++) R(6, 6 + k * 4, 18, 3, ['#8a5a30', '#6a4423'][k % 2]);
        break;
      }
      case 'saltpans': {
        R(2, 2, w - 4, h - 4, '#b8a888');
        for (let y = 6; y < h - 6; y += 24) for (let x = 6; x < w - 6; x += 28) { R(x, y, 24, 20, '#8a7a60'); R(x + 2, y + 2, 20, 16, (x + y) % 3 ? '#a8d0e8' : '#f4f0e8'); if ((x + y) % 3 === 0) for (let k = 0; k < 4; k++) R(x + 4 + k * 4, y + 6 + (k % 2) * 4, 3, 2, '#ffffff'); }
        ell(w - 14, h - 12, 7, 5, '#f4f0e8'); ell(w - 14, h - 15, 5, 3, '#ffffff');
        break;
      }
      case 'theatre': {
        shadow(); ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 6, w / 2 - 4, h - 20, 0, Math.PI, 0); ctx.fill();
        for (let k = 0; k < 4; k++) { ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 6, w / 2 - 10 - k * 9, h - 26 - k * 9, 0, Math.PI, 0); ctx.stroke(); }
        R(w / 2 - 26, h - 30, 52, 26, '#8e1f2a'); R(w / 2 - 24, h - 28, 48, 4, '#c8302a'); for (let x = 8; x < w - 8; x += 18) R(x, 14, 5, h - 20, '#efe6d2');
        R(4, 10, w - 8, 6, '#c8bfa8'); ctx.font = '12px sans-serif'; ctx.fillText('🎭', X + w / 2 - 7, Y + h - 10);
        flag(8, 10, PLAYER_COLOR); flag(w - 12, 10, PLAYER_COLOR);
        break;
      }
      case 'stoneyard': {
        R(2, 2, w - 4, h - 4, '#a89a80');
        for (let k = 0; k < 6; k++) { const x = 8 + (k % 3) * 18, y = 22 + Math.floor(k / 3) * 14; R(x, y, 14, 10, k === 4 ? '#ece8e0' : '#9a9a98'); R(x, y, 14, 3, k === 4 ? '#ffffff' : '#c0c0bc'); }
        line(w - 30, h - 6, w - 18, 4, '#6a4423', 3); line(w - 6, h - 6, w - 18, 4, '#6a4423', 3); line(w - 18, 4, w - 18, 26, '#9a9aa2', 1); R(w - 24, 26, 12, 8, '#9a9a98');
        person(w - 40, h - 4, '#8a7a5a');
        break;
      }
      case 'ropewalk': {
        shadow(); R(2, 8, w - 4, h - 12, '#9a7a4a'); roof(0, -6, w, 16, '#6a4a2a');
        for (let k = 0; k < 3; k++) line(10, 16 + k * 4, w - 10, 16 + k * 4, '#d8c8a0', 1.2);
        R(4, 12, 6, 16, '#5a3a1e'); R(w - 10, 12, 6, 16, '#5a3a1e'); const a = time * 3; line(7, 20, 7 + Math.cos(a) * 4, 20 + Math.sin(a) * 4, '#3a2a1a', 1.5);
        break;
      }
      case 'gazebo': {
        ell(w / 2, h - 10, w / 2 - 4, 10, 'rgba(0,0,0,0.2)'); ell(w / 2, h - 12, w / 2 - 6, 9, '#c8bfa8');
        for (const x of [10, w / 2 - 2, w - 14]) R(x, 6, 4, h - 18, '#efe6d2');
        poly([2, 10, w / 2, -16, w - 2, 10], '#6a2a3a'); poly([2, 10, w / 2, 4, w - 2, 10], '#4a1a2a'); ell(w / 2, -16, 3, 3, '#d8b84a');
        if (sn !== 3) for (let k = 0; k < 5; k++) ell(6 + k * 13, 12 + (k % 2) * 3, 3, 2, ['#e04a6a', '#f2e36b', '#9a5ad8'][k % 3]);
        const b = Math.abs(Math.sin(time * 4)) * 1.5; person(w / 2 - 8, h - 12 - b, '#2a4a8a'); person(w / 2 + 8, h - 12, '#8e1f2a');
        break;
      }
      case 'obelisk': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, 24, 5);
        R(6, 22, 20, 8, '#a5a7ad'); poly([10, 22, 13, -34, 19, -34, 22, 22], '#c5c7cd'); poly([10, 22, 13, -34, 15, -34, 13, 22], '#9a9ca2');
        poly([13, -34, 16, -42, 19, -34], '#e8c040'); ctx.font = '8px sans-serif'; ctx.fillText('⚜', X + 12, Y + 6);
        break;
      }
      case 'wishwell': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 2, Y + 26, 28, 5);
        ell(16, 22, 13, 7, '#8b8d93'); ell(16, 20, 10, 5, '#2a4a7a'); const g = (time * 2) % 1; if (g < 0.3) ell(13, 20, 1.5, 1, '#ffd54a');
        R(3, -6, 3, 28, '#6a4423'); R(26, -6, 3, 28, '#6a4423'); poly([0, -4, 16, -16, 32, -4], '#8a3a2a'); line(16, -4, 16, 14, '#c8b890', 1); R(14, 12, 4, 4, '#7a5230');
        break;
      }
      case 'arch': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 2, Y + h - 6, w - 4, 6);
        R(2, -30, 14, h + 26, '#d8d0c0'); R(w - 16, -30, 14, h + 26, '#d8d0c0'); R(2, -38, w - 4, 12, '#e8e0d0');
        ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.arc(X + w / 2, Y - 26, w / 2 - 16, Math.PI, 0); ctx.lineTo(X + w - 16, Y - 26); ctx.fill();
        ctx.fillStyle = '#4f8a36'; ctx.beginPath(); ctx.arc(X + w / 2, Y - 14, w / 2 - 16, Math.PI, 0); ctx.fill();
        R(w / 2 - 4, -36, 8, 8, '#e8c040'); for (const x of [4, w - 14]) for (let y = -24; y < h - 6; y += 10) R(x, y, 10, 1, '#b8b0a0');
        flag(4, -38, PLAYER_COLOR); flag(w - 6, -38, PLAYER_COLOR);
        break;
      }
      case 'topiary': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#e8eef2' : '#6a9a3a'); ctx.strokeStyle = '#c8bfa8'; ctx.lineWidth = 3; ctx.strokeRect(X + 4, Y + 4, w - 8, h - 8);
        const g = sn === 3 ? '#a8b8a8' : '#2e6a2a';
        ell(18, 22, 10, 10, g); ell(18, 14, 6, 6, g); // bola dupla
        ell(w - 20, 30, 12, 8, g); ell(w - 12, 22, 5, 5, g); poly([w - 30, 26, w - 36, 20, w - 30, 30], g); // pássaro
        poly([w / 2 - 8, h - 6, w / 2, h - 34, w / 2 + 8, h - 6], g); // cone
        if (sn === 0 || sn === 1) for (let k = 0; k < 8; k++) ell(8 + (k * 9) % (w - 16), h - 8 - (k % 2) * 4, 2, 2, ['#e04a6a', '#f2e36b', '#ffffff'][k % 3]);
        break;
      }
      case 'equestrian': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 6);
        R(8, h - 22, w - 16, 18, '#d8d0c0'); R(6, h - 24, w - 12, 4, '#e8e0d0'); R(6, h - 6, w - 12, 3, '#b8b0a0');
        const br = '#8a6a3a'; ell(w / 2, h - 36, 16, 8, br); R(w / 2 - 12, h - 34, 3, 12, br); R(w / 2 + 9, h - 34, 3, 12, br); poly([w / 2 + 12, h - 40, w / 2 + 22, h - 54, w / 2 + 24, h - 46, w / 2 + 16, h - 34], br);
        R(w / 2 - 3, h - 56, 6, 16, br); ell(w / 2, h - 58, 3.4, 3.4, br); line(w / 2 + 3, h - 52, w / 2 + 14, h - 64, '#a88a5a', 2);
        break;
      }
      case 'pillory': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + 26, 24, 5);
        R(14, -8, 4, 36, '#6a4423'); R(4, -2, 24, 8, '#8a5a30'); for (const x of [8, 15, 22]) ell(x, 2, 2.4, 2.4, '#3a2410'); R(4, 1, 24, 1, '#5a3a1e');
        R(2, 26, 28, 3, '#7a5a3a');
        break;
      }
      case 'stall': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 2, Y + h - 5, w - 4, 5);
        R(4, 10, w - 8, 16, '#8b5a2b'); R(4, 10, w - 8, 3, '#a8743e'); R(4, -8, 3, 34, '#5a3a1e'); R(w - 7, -8, 3, 34, '#5a3a1e');
        for (let k = 0; k < 6; k++) poly([2 + k * ((w - 4) / 6), -8, 2 + (k + 1) * ((w - 4) / 6), -8, 2 + (k + 1) * ((w - 4) / 6), 0, 2 + k * ((w - 4) / 6), 2], k % 2 ? '#f2efe6' : '#c84a4a');
        for (let k = 0; k < 5; k++) ell(10 + k * 10, 8, 3.4, 3, ['#e8742a', '#c8302a', '#7ac04a', '#f2c84a', '#8a3a9a'][k]);
        break;
      }
      case 'chapel': {
        shadow(); R(6, 22, w - 12, h - 26, '#e6dcc4'); roof(4, 4, w - 8, 20, '#5a4a6a');
        R(w / 2 - 2, -20, 4, 24, '#efe6d2'); R(w / 2 - 6, -14, 12, 3, '#efe6d2');
        ctx.fillStyle = night ? '#ffd36b' : '#3a5ad0'; ctx.beginPath(); ctx.arc(X + w / 2, Y + 34, 6, 0, Math.PI * 2); ctx.fill(); R(w / 2 - 6, 34, 12, 1, '#c8302a'); R(w / 2, 28, 1, 12, '#e8c040');
        R(w / 2 - 6, h - 18, 12, 14, '#5a3a1e'); ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.arc(X + w / 2, Y + h - 18, 6, Math.PI, 0); ctx.fill();
        snow(4, 4, w - 8);
        break;
      }
      case 'observatory': {
        shadow(); R(10, 14, w - 20, h - 18, '#a5a7ad'); for (let k = 18; k < h - 4; k += 7) R(10, k, w - 20, 1, '#8a8c92');
        ctx.fillStyle = '#5a6a8a'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + 16, w / 2 - 8, 18, 0, Math.PI, 0); ctx.fill();
        R(w / 2 - 2, -4, 4, 20, '#2a2a3a'); const a = -0.9 + Math.sin(time * 0.3) * 0.3; line(w / 2, 4, w / 2 + Math.cos(a) * 26, 4 + Math.sin(a) * 26, '#c8a040', 4);
        R(w / 2 - 5, h - 16, 10, 12, '#3a2410'); if (night) for (let k = 0; k < 4; k++) ell(6 + k * 16, -14 - (k % 2) * 8, 1, 1, '#ffffff');
        break;
      }
      case 'tiltyard': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#e8eef2' : '#b8a878'); fence('#8a5a30');
        R(8, h / 2 - 2, w - 16, 4, '#efe6d2'); for (let x = 10; x < w - 10; x += 14) R(x, h / 2 - 6, 3, 10, '#8e1f2a');
        const p = (time * 0.25) % 1, hx = 12 + p * (w - 24);
        ell(hx, h / 2 - 12, 9, 5, '#5a3a2a'); R(hx - 2, h / 2 - 24, 5, 10, '#8d949c'); line(hx + 2, h / 2 - 18, hx + 20, h / 2 - 22, '#d8c8a0', 2);
        flag(4, 10, '#8e1f2a'); flag(w - 8, 10, '#2a4a8a');
        break;
      }
      case 'circle': {
        R(2, 2, w - 4, h - 4, sn === 3 ? '#e8eef2' : '#6a8a4a');
        const st = Math.sin(time * 2) * 0.5 + 0.5; ell(w / 2, h / 2, 10, 6, `rgba(160,120,255,${0.25 + st * 0.35})`);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = w / 2 + Math.cos(a) * (w / 2 - 12), y = h / 2 + Math.sin(a) * (h / 2 - 14); R(x - 4, y - 16, 8, 18, '#8a8c92'); R(x - 4, y - 16, 3, 18, '#6a6c72'); if (k % 2 === 0) R(x - 2, y - 10, 4, 1, `rgba(180,240,255,${st})`); }
        ell(w / 2, h / 2 - 2, 2, 2, `rgba(255,255,255,${st})`);
        break;
      }
      case 'vault': {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X + 2, Y + 26, 28, 5);
        R(4, 2, 24, 26, '#5a5e66'); R(4, 2, 24, 4, '#7a7e86'); R(6, 8, 20, 18, '#4a4e56'); ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X + 16, Y + 17, 5, 0, Math.PI * 2); ctx.stroke();
        const a = time * 0.5; line(16, 17, 16 + Math.cos(a) * 4, 17 + Math.sin(a) * 4, '#c8a040', 1.5); for (const y of [8, 22]) R(24, y, 3, 4, '#2a2e36');
        break;
      }
      case 'icehouse': {
        shadow(); ctx.fillStyle = '#7a8a6a'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 8, w / 2 - 2, h - 10, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = winter ? '#f4f8fc' : '#5a8a3a'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h - 12, w / 2 - 6, h - 18, 0, Math.PI, 0); ctx.fill();
        R(w / 2 - 8, h - 22, 16, 18, '#9a9ca2'); R(w / 2 - 6, h - 20, 12, 16, '#3a4a5a'); ell(w / 2, h - 13, 2, 2, '#a8d8f0');
        break;
      }
      case 'ballista': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 6);
        R(6, h - 22, w - 12, 18, '#8a5a30'); for (let k = h - 20; k < h - 4; k += 5) R(6, k, w - 12, 1, '#6a4423');
        const a = s.aim !== undefined ? s.aim : -Math.PI / 2, cx = w / 2, cy = h - 26;
        ctx.save(); ctx.translate(X + cx, Y + cy); ctx.rotate(a);
        ctx.fillStyle = '#6a4423'; ctx.fillRect(-14, -3, 34, 6); ctx.strokeStyle = '#4a2e16'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, -18); ctx.quadraticCurveTo(-2, 0, 8, 18); ctx.stroke();
        ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(-10, 0); ctx.lineTo(8, 18); ctx.stroke(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(18, -1.5, 8, 3);
        ctx.restore();
        break;
      }
      case 'trench': {
        R(0, 6, w, h - 10, '#4a3420'); R(0, 6, w, 3, '#6a4a2a'); R(0, h - 7, w, 3, '#2a1a0e');
        for (let x = 4; x < w - 2; x += 8) poly([x - 2, h - 6, x + 1, 2, x + 3, h - 6], '#9a7040');
        break;
      }
      case 'siegeyard': {
        R(2, 2, w - 4, h - 4, '#9a8a60'); fence();
        R(10, h - 22, 40, 12, '#7a5230'); ell(16, h - 8, 5, 5, '#5a3a1e'); ell(44, h - 8, 5, 5, '#5a3a1e'); const a = -0.8 + Math.sin(time) * 0.2; line(30, h - 22, 30 + Math.cos(a) * 26, h - 22 + Math.sin(a) * 26, '#6a4423', 3); ell(30 + Math.cos(a) * 26, h - 22 + Math.sin(a) * 26, 4, 3, '#4a2e16');
        for (let k = 0; k < 4; k++) R(w - 40, 10 + k * 5, 34, 3, ['#a8743e', '#8a5a30'][k % 2]);
        break;
      }
      case 'crane': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 6);
        const a = time * 1.2; ctx.strokeStyle = '#6a4423'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X + 18, Y + h - 22, 14, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 4; k++) line(18, h - 22, 18 + Math.cos(a + k * Math.PI / 4) * 14, h - 22 + Math.sin(a + k * Math.PI / 4) * 14, '#8a5a30', 1.5);
        line(18, h - 22, w - 10, -30, '#5a3a1e', 4); line(w - 10, -30, w - 10, 10 + Math.sin(time) * 6, '#d8c8a0', 1); R(w - 16, 10 + Math.sin(time) * 6, 12, 8, '#9a9a98');
        break;
      }
      case 'cistern': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 4, Y + h - 6, w - 8, 6);
        ell(w / 2, h / 2 + 6, w / 2 - 4, h / 2 - 6, '#a5a7ad'); ell(w / 2, h / 2 + 2, w / 2 - 9, h / 2 - 11, winter ? '#d8f0ff' : '#3a6aa8');
        ell(w / 2 - 6, h / 2 - 2, 5, 2, 'rgba(255,255,255,0.3)'); R(w / 2 - 2, 0, 4, 14, '#6a4423'); R(w / 2 - 10, -2, 20, 4, '#8a5a30');
        break;
      }
      case 'windmill': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 6, Y + h - 6, w - 10, 6);
        poly([12, h - 4, 18, -10, w - 18, -10, w - 12, h - 4], '#e6dcc4'); poly([12, h - 4, 18, -10, 24, -10, 20, h - 4], '#c8bfa8');
        poly([14, -10, w / 2, -26, w - 14, -10], '#8a3a2a'); R(w / 2 - 5, h - 18, 10, 14, '#5a3a1e'); glow(w / 2 - 3, 14, 6, 6);
        const a = time * 1.6, cx = w / 2, cy = -12;
        for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2; ctx.save(); ctx.translate(X + cx, Y + cy); ctx.rotate(b); ctx.fillStyle = '#6a4423'; ctx.fillRect(0, -1.5, 30, 3); ctx.fillStyle = 'rgba(240,232,214,0.95)'; ctx.fillRect(6, 1.5, 22, 8); ctx.restore(); }
        ell(cx, cy, 3, 3, '#3a2410');
        break;
      }
      case 'sewer': {
        R(2, 6, w - 4, h - 10, '#8b8d93'); R(6, 10, w - 12, h - 18, '#3a4a4a');
        for (let x = 8; x < w - 8; x += 5) R(x, 10, 2, h - 18, '#6a6c72'); const f = (time * 2) % 1; ell(w / 2 + (f - 0.5) * 20, h / 2, 3, 1, 'rgba(160,200,220,0.6)');
        break;
      }
      case 'dock': {
        R(2, 6, w - 4, h - 10, '#7a5230'); for (let k = 8; k < h - 4; k += 6) R(2, k, w - 4, 2, '#5a3a1e');
        for (const [x, y] of [[4, h - 6], [w - 8, h - 6], [4, 4], [w - 8, 4]]) R(x, y, 4, 8, '#4a2e16');
        ctx.fillStyle = '#8a5a30'; ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h + 4, 20, 6, 0, 0, Math.PI); ctx.fill(); ell(w - 14, 14, 5, 4, '#a8743e'); line(w - 14, 10, w - 6, -6, '#6a4423', 1.2);
        break;
      }
      case 'toll': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(X + 2, Y + h - 6, w - 4, 6);
        R(4, 2, 22, 24, '#9a7a4a'); poly([2, 4, 15, -8, 28, 4], '#6a3a2a'); R(9, 10, 12, 8, '#2a2a3a'); glow(10, 11, 10, 6);
        const up = Math.sin(time * 0.7) > 0.6 ? -0.8 : 0; ctx.save(); ctx.translate(X + 28, Y + 18); ctx.rotate(up); for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#f2efe6' : '#c8302a'; ctx.fillRect(k * 6, -2, 6, 4); } ctx.restore(); R(26, 14, 4, 14, '#4a2e16');
        break;
      }
      default: return d0(ctx, s, X, Y, time, H);
    }
  };
}

// ------------------------------------------------------------------ ícones do menu Construção
{
  // um item desenhado (das formas dos ícones) dentro do ícone da construção
  const mini = (shape, mat, x = 14, y = 14, sz = 18) => { const f = ART_SHAPES[shape], p = MAT[mat]; return f && p ? `<svg x="${x}" y="${y}" width="${sz}" height="${sz}" viewBox="0 0 32 32">${f(p[0], p[1], p[2])}</svg>` : ''; };
  const full = (shape, mat) => mini(shape, mat, 0, 0, 32);
  const coin = BI.coin || '';
  const ICON = {
    tent: () => `<path d="M3 28 L16 5 L29 28 Z" fill="#c8b890" stroke="#5a4a30" stroke-width="1.3"/><path d="M16 5 L29 28 L20 28 Z" fill="#a89870"/><path d="M12 28 L16 18 L20 28 Z" fill="#3a2a1a"/><path d="M8 20 L24 20" stroke="#8e1f2a" stroke-width="1.6"/>`,
    treehouse: () => `<rect x="14" y="16" width="5" height="14" fill="#6a4423"/><circle cx="9" cy="9" r="7" fill="#3d7a2a"/><circle cx="23" cy="9" r="7" fill="#3d7a2a"/><circle cx="16" cy="5" r="6" fill="#4f8a36"/><rect x="7" y="11" width="18" height="9" fill="#9a6a3a" stroke="#4a2e16"/><path d="M5 12 L16 5 L27 12" fill="#6a4a2a"/><rect x="14" y="14" width="4" height="6" fill="#3a2410"/>`,
    longhouse: () => BI.house('#7a5230', '#4a5a2a', 1, 12, 30, 16),
    farmhouse: () => BI.house('#e6dcc4', '#a8553a') + mini('sheaf', 'straw', 18, 18, 14),
    townhouse: () => BI.house('#d8c8a8', '#7a3a2a', 7, 6, 18, 24) + `<rect x="10" y="17" width="4" height="4" fill="#3a4a6a"/><rect x="18" y="17" width="4" height="4" fill="#3a4a6a"/>`,
    stonetower: () => `<rect x="9" y="9" width="14" height="21" fill="#9a948a" stroke="#4a4440" stroke-width="1.2"/><path d="M7 10 L16 1 L25 10 Z" fill="#4a4a5a" stroke="#2a2a3a"/><rect x="14" y="13" width="4" height="5" fill="#ffd36b"/><rect x="13" y="23" width="6" height="7" fill="#3a2410"/>`,
    mansion: () => BI.house('#efe6d2', '#3a4a6a', 2, 11, 28, 18) + `<path d="M8 16 L8 28 M14 16 L14 28 M18 16 L18 28 M24 16 L24 28" stroke="#c8bfa8" stroke-width="1.4"/>`,
    palacete: () => BI.house('#f4f0e6', '#6a2a5a', 1, 12, 30, 17) + `<circle cx="16" cy="6" r="4" fill="#d8b84a" stroke="#8a6a10"/><path d="M7 17 L7 28 M12 17 L12 28 M20 17 L20 28 M25 17 L25 28" stroke="#d8d0c0" stroke-width="1.4"/>`,
    sawmill_p: () => full('saw', 'steel'), smelter: () => full('bar', 'brass'), glassworks: () => full('flask', 'glass'), goldsmith: () => full('necklace', 'gold'),
    dyeworks: () => `<ellipse cx="9" cy="22" rx="7" ry="5" fill="#6a4423"/><ellipse cx="9" cy="20" rx="5.5" ry="3" fill="#c8302a"/><ellipse cx="23" cy="22" rx="7" ry="5" fill="#6a4423"/><ellipse cx="23" cy="20" rx="5.5" ry="3" fill="#3a5ad0"/><ellipse cx="16" cy="11" rx="7" ry="5" fill="#6a4423"/><ellipse cx="16" cy="9" rx="5.5" ry="3" fill="#e8c830"/>`,
    winepress: () => full('jug', 'wine'), quern: () => `<ellipse cx="16" cy="20" rx="13" ry="7" fill="#8b8d93" stroke="#4a4c52" stroke-width="1.2"/><ellipse cx="16" cy="16" rx="10" ry="5" fill="#a5a7ad" stroke="#4a4c52"/><path d="M16 16 L29 9" stroke="#6a4423" stroke-width="2.6" stroke-linecap="round"/>`,
    mage_tower: () => `<rect x="11" y="12" width="10" height="18" fill="#6a6a80" stroke="#3a3a4a"/><path d="M8 13 L16 1 L24 13 Z" fill="#3a2a7a" stroke="#1a1a4a"/><circle cx="16" cy="2" r="2" fill="#f2e070"/><rect x="14" y="16" width="4" height="5" fill="#c084ff"/>`,
    armorer_bench: () => full('cuirass', 'steel'),
    vineyard: () => full('berries', 'wine'), olivegrove: () => full('berries', 'olive'), goatpen: () => full('horn', 'horn'), silkhouse: () => full('egg', 'cocoon'),
    duckpond: () => `<ellipse cx="16" cy="20" rx="14" ry="9" fill="#3a7bc8" stroke="#2a4a7a"/><ellipse cx="15" cy="17" rx="7" ry="4.5" fill="#f4f0e0"/><circle cx="21" cy="13" r="3.4" fill="#3a7a4a"/><path d="M24 13 L28 13.5 L24 15 Z" fill="#e8a030"/>`,
    rabbithutch: () => full('pelt', 'rabbit'), hopfield: () => full('herbs', 'hops'), sunflowers: () => `<path d="M16 30 L16 14" stroke="#4f8a36" stroke-width="2"/><circle cx="16" cy="11" r="9" fill="#f0c830"/><circle cx="16" cy="11" r="4.5" fill="#5a3a10"/><path d="M16 22 L10 18" stroke="#4f8a36" stroke-width="2"/>`,
    biz_glass: () => full('flask', 'glass') + coin, biz_dyer: () => full('roll', 'red') + coin, biz_press: () => full('bottle', 'olive') + coin, biz_smelter: () => full('bar', 'pewter') + coin,
    biz_armorer: () => full('shield', 'steel') + coin, biz_bowyer: () => full('crossbow', 'oak') + coin, biz_scribe: () => full('book', 'mage') + coin, biz_magic: () => full('orb', 'arcane') + coin,
    biz_butcher: () => full('meat', 'rawmeat') + coin, biz_tailor: () => full('tunic', 'noble') + coin, biz_cobbler: () => full('boots', 'leather') + coin,
    biz_barber: () => `<rect x="12" y="3" width="8" height="24" rx="4" fill="#f2efe6" stroke="#5a5a62" stroke-width="1.2"/><path d="M12 8 L20 4 M12 14 L20 10 M12 20 L20 16 M12 26 L20 22" stroke="#c8302a" stroke-width="2"/><path d="M12 9 L20 5 M12 15 L20 11 M12 21 L20 17" stroke="#3a5ad0" stroke-width="1"/>` + coin,
    biz_bathhouse: () => `<path d="M4 16 L28 16 L26 26 Q16 30 6 26 Z" fill="#a8d8e8" stroke="#3a6a8a" stroke-width="1.3"/><path d="M10 12 Q8 8 11 5 M16 12 Q14 7 17 3 M22 12 Q20 8 23 5" stroke="#c8d8e0" stroke-width="1.6" fill="none"/>` + coin,
    biz_stables: () => full('horn', 'bark') + coin, biz_shipyard: () => full('boat', 'oak') + coin, biz_charcoal: () => full('lump', 'coal') + coin, biz_saltworks: () => full('sandpile', 'white') + coin,
    biz_cooper: () => `<ellipse cx="16" cy="16" rx="10" ry="13" fill="#a8743e" stroke="#4a2e16" stroke-width="1.3"/><path d="M6 10 Q16 13 26 10 M6 22 Q16 25 26 22" stroke="#5a5a62" stroke-width="2" fill="none"/><path d="M12 4 L12 28 M20 4 L20 28" stroke="#7a4a24" stroke-width=".8"/>` + coin,
    biz_perfumer: () => full('bottle', 'lavender') + coin,
    biz_theatre: () => `<path d="M4 8 Q4 22 12 24 Q18 22 18 8 Q11 11 4 8 Z" fill="#f2efe6" stroke="#3a2a1a" stroke-width="1.2"/><path d="M8 14 Q9 13 10 14 M13 14 Q14 13 15 14 M8 18 Q11 21 14 18" stroke="#3a2a1a" stroke-width="1.2" fill="none"/><path d="M14 12 Q14 26 22 28 Q29 26 29 12 Q21 15 14 12 Z" fill="#c8302a" stroke="#3a2a1a" stroke-width="1.2"/><path d="M18 18 Q19 17 20 18 M23 18 Q24 17 25 18 M18 24 Q21 21 25 24" stroke="#3a2a1a" stroke-width="1.2" fill="none"/>` + coin,
    biz_mason: () => full('brick', 'rock') + coin, biz_ropery: () => full('rope', 'fiber') + coin,
    gazebo: () => `<path d="M3 13 L16 3 L29 13 Z" fill="#6a2a3a" stroke="#3a1020" stroke-width="1.2"/><path d="M6 13 L6 26 M16 13 L16 26 M26 13 L26 26" stroke="#efe6d2" stroke-width="2.4"/><ellipse cx="16" cy="27" rx="13" ry="3" fill="#c8bfa8"/>`,
    obelisk: () => `<path d="M12 28 L14 6 L18 6 L20 28 Z" fill="#c5c7cd" stroke="#6a6c72" stroke-width="1.2"/><path d="M14 6 L16 1 L18 6 Z" fill="#e8c040"/><rect x="9" y="27" width="14" height="3" fill="#a5a7ad"/>`,
    wishwell: () => `<ellipse cx="16" cy="23" rx="12" ry="6" fill="#8b8d93" stroke="#4a4c52"/><ellipse cx="16" cy="21" rx="9" ry="3.6" fill="#2a4a7a"/><path d="M5 22 L5 8 M27 22 L27 8" stroke="#6a4423" stroke-width="2"/><path d="M2 9 L16 2 L30 9 Z" fill="#8a3a2a"/><circle cx="13" cy="21" r="1.6" fill="#ffd54a"/>`,
    pond_d: () => `<ellipse cx="16" cy="18" rx="14" ry="10" fill="#4a8ad8" stroke="#2a4a7a" stroke-width="1.2"/><ellipse cx="10" cy="16" rx="4" ry="2.4" fill="#4f8a36"/><circle cx="10" cy="15" r="1.4" fill="#f0a0c0"/><ellipse cx="20" cy="21" rx="4" ry="2" fill="#e8742a"/>`,
    arch: () => `<path d="M3 30 L3 6 L29 6 L29 30 L22 30 L22 16 Q16 9 10 16 L10 30 Z" fill="#d8d0c0" stroke="#7a7060" stroke-width="1.2"/><rect x="14" y="7" width="4" height="4" fill="#e8c040"/>`,
    topiary: () => `<circle cx="10" cy="20" r="6" fill="#2e6a2a"/><circle cx="10" cy="12" r="4" fill="#2e6a2a"/><path d="M18 28 L22 6 L26 28 Z" fill="#3a7a2a"/><rect x="2" y="27" width="28" height="3" fill="#c8bfa8"/>`,
    equestrian: () => `<rect x="6" y="22" width="20" height="8" fill="#d8d0c0" stroke="#7a7060"/><ellipse cx="15" cy="16" rx="8" ry="4" fill="#8a6a3a"/><path d="M21 15 L25 7 L27 9 L24 17 Z" fill="#8a6a3a"/><rect x="13" y="5" width="4" height="9" fill="#8a6a3a"/><circle cx="15" cy="4" r="2.4" fill="#8a6a3a"/>`,
    pillory: () => `<rect x="14" y="8" width="4" height="22" fill="#6a4423"/><rect x="3" y="7" width="26" height="7" rx="1" fill="#8a5a30" stroke="#4a2e16"/><circle cx="8" cy="10.5" r="2" fill="#3a2410"/><circle cx="16" cy="10.5" r="2.4" fill="#3a2410"/><circle cx="24" cy="10.5" r="2" fill="#3a2410"/>`,
    market_stall: () => `<rect x="4" y="16" width="24" height="12" fill="#8b5a2b" stroke="#4a2e16"/><path d="M2 8 L30 8 L30 14 L2 14 Z" fill="#c84a4a"/><path d="M7 8 L7 14 M14 8 L14 14 M21 8 L21 14" stroke="#f2efe6" stroke-width="3"/><circle cx="10" cy="15" r="2.4" fill="#e8742a"/><circle cx="16" cy="15" r="2.4" fill="#7ac04a"/><circle cx="22" cy="15" r="2.4" fill="#c8302a"/>`,
    chapel_p: () => BI.house('#e6dcc4', '#5a4a6a') + `<path d="M16 0 L16 6 M13 2.5 L19 2.5" stroke="#e8c040" stroke-width="1.6"/>`,
    observatory: () => `<rect x="7" y="16" width="18" height="14" fill="#a5a7ad" stroke="#5a5c62"/><path d="M5 17 Q16 2 27 17 Z" fill="#5a6a8a" stroke="#2a3a5a"/><path d="M16 12 L27 3" stroke="#c8a040" stroke-width="3" stroke-linecap="round"/>`,
    tiltyard: () => full('spear', 'wood') + `<rect x="2" y="26" width="28" height="3" fill="#8e1f2a"/>`,
    stone_circle: () => `${[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * Math.PI * 2, x = 16 + Math.cos(a) * 11, y = 17 + Math.sin(a) * 8; return `<rect x="${x - 2.4}" y="${y - 7}" width="4.8" height="10" fill="#8a8c92" stroke="#4a4c52" stroke-width=".8"/>`; }).join('')}<circle cx="16" cy="17" r="3" fill="#c084ff"/>`,
    granary_p: () => BI.house('#a8784a', '#8a3a2a') + mini('sack', 'straw', 17, 17, 14), warehouse: () => full('sack', 'linenc'), vault: () => `<rect x="5" y="5" width="22" height="22" rx="2" fill="#5a5e66" stroke="#2a2e36" stroke-width="1.4"/><circle cx="16" cy="16" r="5.5" fill="none" stroke="#c8a040" stroke-width="2"/><path d="M16 16 L19 13" stroke="#c8a040" stroke-width="1.6"/><rect x="24" y="8" width="3" height="4" fill="#2a2e36"/>`,
    cartshed: () => `<path d="M3 20 L25 20 L25 12 L3 12 Z" fill="#a8743e" stroke="#4a2e16" stroke-width="1.2"/><circle cx="9" cy="23" r="4.5" fill="#6a4423" stroke="#3a2010"/><circle cx="21" cy="23" r="4.5" fill="#6a4423" stroke="#3a2010"/><path d="M25 14 L31 10" stroke="#6a4423" stroke-width="2"/>`,
    icehouse: () => `<path d="M3 28 Q16 2 29 28 Z" fill="#7a8a6a" stroke="#4a5a3a" stroke-width="1.2"/><path d="M8 20 Q16 6 24 20" fill="#f4f8fc"/><rect x="12" y="19" width="8" height="9" fill="#3a4a5a"/>` + mini('gem', 'ice', 20, 18, 12),
    ballista: () => full('crossbow', 'oak') + `<rect x="4" y="25" width="24" height="5" fill="#8a5a30"/>`,
    trench: () => `<rect x="2" y="16" width="28" height="12" fill="#4a3420"/>${[5, 11, 17, 23].map(x => `<path d="M${x} 28 L${x + 3} 8 L${x + 5} 28 Z" fill="#9a7040" stroke="#5a3a1e" stroke-width=".8"/>`).join('')}`,
    war_stable: () => full('horn', 'bark') + mini('shield', 'steel', 16, 16, 16), siege_workshop: () => full('catapult', 'oak'),
    crane: () => `<circle cx="9" cy="22" r="7" fill="none" stroke="#6a4423" stroke-width="2.4"/><path d="M9 22 L28 3" stroke="#5a3a1e" stroke-width="3"/><path d="M28 3 L28 18" stroke="#d8c8a0" stroke-width="1"/><rect x="24" y="18" width="8" height="6" fill="#9a9a98"/>`,
    cistern: () => `<ellipse cx="16" cy="19" rx="13" ry="9" fill="#a5a7ad" stroke="#5a5c62" stroke-width="1.2"/><ellipse cx="16" cy="17" rx="9" ry="5" fill="#3a6aa8"/><path d="M16 4 L16 14 M10 4 L22 4" stroke="#6a4423" stroke-width="2"/>`,
    windmill: () => `<path d="M10 30 L13 12 L19 12 L22 30 Z" fill="#e6dcc4" stroke="#7a6a50"/><path d="M16 11 L5 2 M16 11 L27 2 M16 11 L5 20 M16 11 L27 20" stroke="#6a4423" stroke-width="2"/><path d="M16 11 L8 3 L5 6 Z M16 11 L24 3 L27 6 Z M16 11 L8 19 L5 16 Z M16 11 L24 19 L27 16 Z" fill="#f0e8d6"/><circle cx="16" cy="11" r="2" fill="#3a2410"/>`,
    sewer: () => `<rect x="3" y="8" width="26" height="16" rx="2" fill="#8b8d93" stroke="#4a4c52"/><rect x="6" y="11" width="20" height="10" fill="#3a4a4a"/>${[8, 12, 16, 20, 24].map(x => `<path d="M${x} 11 L${x} 21" stroke="#6a6c72" stroke-width="1.6"/>`).join('')}`,
    dock: () => `<rect x="4" y="4" width="24" height="18" fill="#7a5230" stroke="#4a2e16"/><path d="M4 9 L28 9 M4 14 L28 14 M4 19 L28 19" stroke="#5a3a1e"/><path d="M2 26 Q16 32 30 26" stroke="#3a7bc8" stroke-width="3" fill="none"/>`,
    toll: () => `<rect x="3" y="10" width="11" height="18" fill="#9a7a4a" stroke="#4a2e16"/><path d="M1 11 L8.5 3 L16 11 Z" fill="#6a3a2a"/><path d="M14 20 L31 20" stroke="#c8302a" stroke-width="3"/><path d="M17 20 L20 20 M23 20 L26 20" stroke="#f2efe6" stroke-width="3"/>` + coin,
    relay: () => full('horn', 'bark') + mini('compass', 'brass', 17, 17, 14),
  };
  for (const k in ICON) if (!BUILD_ICONS[k]) BUILD_ICONS[k] = ICON[k];
  if (buildArt.cache) for (const k in ICON) delete buildArt.cache[k];
}
