'use strict';
// Mapa do mundo em tela cheia: zoom, arrastar, marcação de destino e lista de locais.

const MAP_MAX_ZOOM = 28;   // pixels por tile
const METERS_PER_TILE = 5;

const MapView = {
  isOpen: false, z: 0, ox: 0, oy: 0, drag: null, inited: false,

  init() {
    this.el = document.getElementById('mapView');
    this.el.innerHTML = `
      <div class="mv-head">
        <div class="mv-title">${icon('map')}<span>Mapa do Mundo</span></div>
        <div class="mv-tools">
          <button data-mv="out" title="Afastar (−)">${icon('minus')}</button>
          <div class="mv-zoom" id="mvZoom">100%</div>
          <button data-mv="in" title="Aproximar (+)">${icon('plus')}</button>
          <span class="sep"></span>
          <button data-mv="me" title="Centralizar em mim (Espaço)">${icon('locate')}<span>Minha posição</span></button>
          <button data-mv="fit" title="Ver o mundo inteiro">${icon('layers')}<span>Mundo inteiro</span></button>
          <button data-mv="goping" title="Mostrar a marcação">${icon('pin')}<span>Marcação</span></button>
          <button data-mv="clear" title="Remover a marcação">${icon('trash')}</button>
          <span class="sep"></span>
          <button data-mv="close" class="mv-close" title="Fechar (M ou Esc)">${icon('x')}</button>
        </div>
      </div>
      <div class="mv-body">
        <div class="mv-canvas" id="mvWrap">
          <canvas id="mvCanvas"></canvas>
          <div class="mv-tip" id="mvTip"></div>
          <div class="mv-hint">${icon('pin')} Clique para marcar um destino · Arraste para mover · Roda do mouse para zoom · Botão direito remove a marcação</div>
        </div>
        <aside class="mv-side" id="mvSide"></aside>
      </div>`;
    this.cv = document.getElementById('mvCanvas');
    this.wrap = document.getElementById('mvWrap');
    this.tip = document.getElementById('mvTip');
    this.side = document.getElementById('mvSide');

    this.el.addEventListener('click', e => {
      const b = e.target.closest('[data-mv]');
      if (b) this.tool(b.dataset.mv);
      const r = e.target.closest('[data-goto]');
      if (r) {
        const [x, y] = r.dataset.goto.split(',').map(Number);
        if (e.target.closest('.pinbtn')) this.setPing(x, y, r.dataset.name);
        else this.centerOn(x, y, Math.max(this.z, 8));
      }
    });
    const cv = this.cv;
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoomAt(e.deltaY < 0 ? 1.25 : 1 / 1.25, e.offsetX, e.offsetY);
    }, { passive: false });
    cv.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      this.drag = { x: e.clientX, y: e.clientY, ox: this.ox, oy: this.oy, moved: false };
    });
    window.addEventListener('mousemove', e => {
      if (!this.isOpen) return;
      if (this.drag) {
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) { this.drag.moved = true; this.wrap.classList.add('dragging'); }
        if (this.drag.moved) {
          this.ox = this.drag.ox - dx / this.z; this.oy = this.drag.oy - dy / this.z;
          this.clamp();
        }
      }
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      this.hover = mx >= 0 && my >= 0 && mx < r.width && my < r.height ? { mx, my } : null;
      this.updateTip();
    });
    window.addEventListener('mouseup', e => {
      if (!this.isOpen || !this.drag) return;
      const d = this.drag;
      this.drag = null; this.wrap.classList.remove('dragging');
      if (!d.moved && e.target === cv) {
        const r = cv.getBoundingClientRect();
        const tx = this.ox + (e.clientX - r.left) / this.z, ty = this.oy + (e.clientY - r.top) / this.z;
        if (World.inb(Math.floor(tx), Math.floor(ty))) this.setPing(Math.floor(tx) + 0.5, Math.floor(ty) + 0.5);
      }
    });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); this.clearPing(); });
    cv.addEventListener('mouseleave', () => { this.hover = null; this.updateTip(); });
    window.addEventListener('resize', () => { if (this.isOpen) { this.resize(); this.clamp(); } });
    this.inited = true;
  },

  // ------------------------------------------------------------ abrir / fechar
  show() {
    if (!this.inited) this.init();
    this.el.classList.remove('hidden');
    this.isOpen = true;
    this.resize();
    const fit = this.fitZoom();
    if (!this.z) this.centerOn(P.x / TILE, P.y / TILE, Math.min(MAP_MAX_ZOOM, fit * 2.2));
    else this.centerOn(P.x / TILE, P.y / TILE, this.z);
    this.renderSide();
    const loop = () => { if (!this.isOpen) return; this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },
  hide() {
    if (!this.isOpen) return;
    this.isOpen = false; this.drag = null; this.hover = null;
    this.el.classList.add('hidden');
  },

  resize() {
    const r = this.wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    this.cw = r.width; this.ch = r.height;
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
  },
  fitZoom() { return Math.min(this.cw / WORLD_W, this.ch / WORLD_H) * 0.95; },
  clamp() {
    const vw = this.cw / this.z, vh = this.ch / this.z, m = 12;
    this.ox = vw >= WORLD_W ? (WORLD_W - vw) / 2 : U.clamp(this.ox, -m, WORLD_W - vw + m);
    this.oy = vh >= WORLD_H ? (WORLD_H - vh) / 2 : U.clamp(this.oy, -m, WORLD_H - vh + m);
  },
  centerOn(tx, ty, z) {
    this.z = U.clamp(z || this.z, this.fitZoom(), MAP_MAX_ZOOM);
    this.ox = tx - this.cw / this.z / 2; this.oy = ty - this.ch / this.z / 2;
    this.clamp();
  },
  zoomAt(f, sx, sy) {
    const wx = this.ox + sx / this.z, wy = this.oy + sy / this.z;
    this.z = U.clamp(this.z * f, this.fitZoom(), MAP_MAX_ZOOM);
    this.ox = wx - sx / this.z; this.oy = wy - sy / this.z;
    this.clamp();
  },
  tool(a) {
    switch (a) {
      case 'in': this.zoomAt(1.4, this.cw / 2, this.ch / 2); break;
      case 'out': this.zoomAt(1 / 1.4, this.cw / 2, this.ch / 2); break;
      case 'me': this.centerOn(P.x / TILE, P.y / TILE, Math.max(this.z, this.fitZoom() * 2.5)); break;
      case 'fit': this.centerOn(WORLD_W / 2, WORLD_H / 2, this.fitZoom()); break;
      case 'goping': if (G.ping) this.centerOn(G.ping.x, G.ping.y, Math.max(this.z, 8)); break;
      case 'clear': this.clearPing(); break;
      case 'close': UI.close(); break;
    }
  },

  // ------------------------------------------------------------ marcação
  setPing(x, y, name) {
    const place = name || (this.placeAt(x, y, 3) || {}).name || 'Destino marcado';
    G.ping = { x, y, name: place };
    UI.msg(`📍 Destino: ${place} — a ${this.distText(x, y)}. Siga a seta na tela.`, 'gold');
    this.renderSide();
  },
  clearPing() {
    if (!G.ping) return;
    G.ping = null;
    this.renderSide();
  },
  distText(x, y) {
    const m = Math.round(U.dist(P.x / TILE, P.y / TILE, x, y) * METERS_PER_TILE);
    return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : m + ' m';
  },

  // ------------------------------------------------------------ locais
  places() {
    const out = [];
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      out.push({ kind: 'castle', x: cp.x + 0.5, y: cp.y + 0.5, name: 'Castelo de ' + CIV_DEFS[c].short, sub: CIV_DEFS[c].name, color: Game.civColor(c), civ: c });
    }
    for (const v of World.villages) out.push({ kind: 'village', x: v.x + 0.5, y: v.y - 0.5, name: v.name, sub: 'Vila de ' + CIV_DEFS[v.civ].short, color: '#f2efe6', civ: v.civ });
    for (let c = 0; c < CIV_DEFS.length; c++) { const a = World.capitals[c].arena; if (a) out.push({ kind: 'arena', x: a.x + a.w / 2, y: a.y + a.h / 2, name: 'Arena de ' + CIV_DEFS[c].short, sub: Arena.tourney() && Arena.tourney().ci === c ? 'Grande Torneio!' : 'Duelos e justas', color: '#ffd54a', civ: c }); }
    for (const s of World.shrines || []) out.push({ kind: 'shrine', x: s.x + 1, y: s.y + 1, name: s.sname, sub: G.shrines && G.shrines[s.shrine] ? 'Visitado' : 'Peregrinação', color: '#e8e0ff' });
    for (const s of World.camps) if (!s.cleared) out.push({ kind: 'camp', x: s.x + 1.5, y: s.y + 1.5, name: 'Acampamento de Bandidos', sub: 'Perigo', color: '#e04848' });
    for (const s of World.structs) {
      if (s.owner !== 'player' || !['cabin', 'house', 'forge', 'barracks', 'farm'].includes(s.type)) continue;
      out.push({ kind: 'mine', x: s.x + s.w / 2, y: s.y + s.h / 2, name: (s === World.startCabin ? 'Sua Cabana' : BUILDINGS[s.type].name), sub: 'Sua construção', color: PLAYER_COLOR });
    }
    return out;
  },
  placeAt(x, y, r) {
    let best = null, bd = r;
    for (const p of this.places()) { const d = U.dist(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
    return best;
  },

  renderSide() {
    if (!this.side) return;
    const row = (p, extra) => `<div class="mv-row" data-goto="${p.x},${p.y}" data-name="${UI.esc(p.name)}">
        <span class="dot" style="background:${p.color}"></span>
        <div class="t"><b>${UI.esc(p.name)}</b><small>${extra || p.sub} · ${this.distText(p.x, p.y)}</small></div>
        <button class="pinbtn" title="Marcar como destino">${icon('pin')}</button></div>`;
    let h = '';
    if (G.ping) h += `<div class="mv-sec"><h4>Destino atual</h4><div class="mv-ping">${icon('pin')} <b>${UI.esc(G.ping.name)}</b><br><small>a ${this.distText(G.ping.x, G.ping.y)} de você</small></div></div>`;
    h += '<div class="mv-sec"><h4>Reinos</h4>';
    const places = this.places();
    for (const p of places.filter(p => p.kind === 'castle')) {
      const c = G.civs[p.civ];
      h += row(p, `${UI.esc(c.rulerName)}${c.ruler === 'player' ? ' 👑' : ''}${c.atWar ? ' · <span class="bad">em guerra</span>' : ''}`);
    }
    h += '</div><div class="mv-sec"><h4>Vilas</h4>' + places.filter(p => p.kind === 'village').map(p => row(p)).join('') + '</div>';
    const mine = places.filter(p => p.kind === 'mine');
    if (mine.length) h += '<div class="mv-sec"><h4>Suas construções</h4>' + mine.map(p => row(p)).join('') + '</div>';
    const special = places.filter(p => p.kind === 'arena' || p.kind === 'shrine');
    if (special.length) h += '<div class="mv-sec"><h4>Arenas e santuários</h4>' + special.map(p => row(p)).join('') + '</div>';
    const camps = places.filter(p => p.kind === 'camp');
    if (camps.length) h += '<div class="mv-sec"><h4>Perigos</h4>' + camps.map(p => row(p)).join('') + '</div>';
    h += `<div class="mv-sec"><h4>Legenda</h4>
      <div class="legend-row"><span class="lg-me"></span> Você</div>
      <div class="legend-row"><span class="lg-castle"></span> Castelo (cor do reino)</div>
      <div class="legend-row"><span class="lg-village"></span> Vila</div>
      <div class="legend-row"><span class="lg-mine"></span> Suas construções</div>
      <div class="legend-row"><span class="lg-camp">✕</span> Acampamento de bandidos</div>
      <div class="legend-row"><span class="lg-road"></span> Estrada</div></div>`;
    this.side.innerHTML = h;
  },

  updateTip() {
    const h = this.hover;
    if (!h || (this.drag && this.drag.moved)) { this.tip.style.display = 'none'; return; }
    const tx = this.ox + h.mx / this.z, ty = this.oy + h.my / this.z;
    const ix = Math.floor(tx), iy = Math.floor(ty);
    if (!World.inb(ix, iy)) { this.tip.style.display = 'none'; return; }
    const p = this.placeAt(tx, ty, Math.max(2, 10 / this.z));
    const t = World.terr[World.idx(ix, iy)];
    const terr = t >= 0 ? `<span style="color:${Game.civColor(t)}">●</span> ${CIV_DEFS[t].name}` : 'Terras Selvagens';
    this.tip.innerHTML = `${p ? `<b>${UI.esc(p.name)}</b><br>` : ''}${TINFO[World.tile(ix, iy)].name} · ${terr}<br><span class="muted2">a ${this.distText(tx, ty)} · clique para marcar</span>`;
    this.tip.style.display = 'block';
    const w = this.tip.offsetWidth, hh = this.tip.offsetHeight;
    this.tip.style.left = Math.min(h.mx + 16, this.cw - w - 8) + 'px';
    this.tip.style.top = Math.min(h.my + 16, this.ch - hh - 8) + 'px';
  },

  // ------------------------------------------------------------ desenho
  draw() {
    const g = this.cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    const z = this.z, ox = this.ox, oy = this.oy, cw = this.cw, ch = this.ch, t = performance.now() / 1000;
    const X = tx => (tx - ox) * z, Y = ty => (ty - oy) * z;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#16385f'; g.fillRect(0, 0, cw, ch);

    if (z >= 9) {
      const tx0 = Math.max(0, Math.floor(ox / CH)), tx1 = Math.min(WORLD_W / CH - 1, Math.floor((ox + cw / z) / CH));
      const ty0 = Math.max(0, Math.floor(oy / CH)), ty1 = Math.min(WORLD_H / CH - 1, Math.floor((oy + ch / z) / CH));
      for (let gy = ty0; gy <= ty1; gy++) for (let gx = tx0; gx <= tx1; gx++)
        g.drawImage(World.getChunk(gx, gy), Math.floor(X(gx * CH)), Math.floor(Y(gy * CH)), Math.ceil(CH * z) + 1, Math.ceil(CH * z) + 1);
      // árvores e rochas como pontos
      const a0 = Math.max(0, Math.floor(ox)), a1 = Math.min(WORLD_W - 1, Math.ceil(ox + cw / z));
      const b0 = Math.max(0, Math.floor(oy)), b1 = Math.min(WORLD_H - 1, Math.ceil(oy + ch / z));
      const s = Math.max(2, z * 0.45);
      for (let y = b0; y <= b1; y++) for (let x = a0; x <= a1; x++) {
        const o = World.obj[y * WORLD_W + x];
        if (!o) continue;
        g.fillStyle = OBJ[o].tree ? 'rgba(20,60,20,0.85)' : OBJ[o].pc;
        g.fillRect(X(x + 0.5) - s / 2, Y(y + 0.5) - s / 2, s, s);
      }
      // construções das vilas e acampamentos vistos de cima
      for (const st of World.structs) {
        if (st.owner === 'player' || st.type === 'castle') continue;
        const col = st.type === 'field' ? '#c9a24a' : st.type === 'camp' ? '#6a5034'
          : st.type === 'store' ? Game.civColor(st.owner) : U.shade(CIV_DEFS[st.owner].roof, 0.05);
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(X(st.x) + 1, Y(st.y) + 2, st.w * z - 2, st.h * z - 2);
        g.fillStyle = col; g.fillRect(X(st.x) + 1, Y(st.y) + 1, st.w * z - 2, st.h * z - 2);
      }
    } else {
      g.drawImage(World.mini, X(0), Y(0), WORLD_W * z, WORLD_H * z);
    }

    // vinheta
    const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = vg; g.fillRect(0, 0, cw, ch);
    g.imageSmoothingEnabled = true;
    g.textAlign = 'center'; g.textBaseline = 'middle';

    const label = (txt, x, y, font, col, stroke) => {
      g.font = font; g.lineJoin = 'round';
      g.strokeStyle = stroke || 'rgba(0,0,0,0.85)'; g.lineWidth = 3.5; g.strokeText(txt, x, y);
      g.fillStyle = col; g.fillText(txt, x, y);
    };

    // nomes dos reinos
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      const fs = U.clamp(z * 2.4, 12, 30);
      g.save();
      if ('letterSpacing' in g) g.letterSpacing = Math.round(fs * 0.18) + 'px';
      label(CIV_DEFS[c].short.toUpperCase(), X(cp.x + 0.5), Y(cp.y - 5.5), `700 ${fs}px Georgia, serif`, U.rgba(Game.civColor(c), 0.95));
      g.restore();
    }
    // acampamentos
    for (const s of World.camps) {
      if (s.cleared) continue;
      const x = X(s.x + 1.5), y = Y(s.y + 1.5), r = U.clamp(z * 1.1, 5, 12);
      g.fillStyle = 'rgba(40,0,0,0.75)'; g.beginPath(); g.arc(x, y, r + 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ff4a4a'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.6); g.lineTo(x + r * 0.6, y + r * 0.6); g.moveTo(x + r * 0.6, y - r * 0.6); g.lineTo(x - r * 0.6, y + r * 0.6); g.stroke();
    }
    // construções do jogador
    for (const s of World.structs) {
      if (s.owner !== 'player') continue;
      const w = Math.max(5, s.w * z), h = Math.max(5, s.h * z);
      g.fillStyle = '#000'; g.fillRect(X(s.x + s.w / 2) - w / 2 - 1.5, Y(s.y + s.h / 2) - h / 2 - 1.5, w + 3, h + 3);
      g.fillStyle = PLAYER_COLOR; g.fillRect(X(s.x + s.w / 2) - w / 2, Y(s.y + s.h / 2) - h / 2, w, h);
    }
    // vilas
    for (const v of World.villages) {
      const x = X(v.x + 0.5), y = Y(v.y), r = U.clamp(z * 0.9, 3.5, 8);
      g.fillStyle = '#1a1208'; g.beginPath(); g.arc(x, y, r + 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      if (z >= 3.2) label(v.name, x, y - r - 10, `600 ${U.clamp(z * 1.3, 11, 15)}px "Segoe UI", sans-serif`, '#fff8e6');
    }
    // castelos
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      const x = X(cp.x + 0.5), y = Y(cp.y + 0.5), s = U.clamp(z * 3, 14, 34);
      const col = Game.civColor(c);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - s / 2 - 2, y - s / 2 + 2, s + 4, s + 2);
      g.fillStyle = '#1a1208'; g.fillRect(x - s / 2 - 1.5, y - s / 2 - 1.5, s + 3, s + 3);
      g.fillStyle = col; g.fillRect(x - s / 2, y - s / 2 + s * 0.25, s, s * 0.75);
      for (let k = 0; k < 3; k++) g.fillRect(x - s / 2 + k * s * 0.4, y - s / 2, s * 0.2, s * 0.3);
      g.fillStyle = '#1a1208'; g.fillRect(x - s * 0.12, y + s * 0.1, s * 0.24, s * 0.4);
      if (G.civs[c].ruler === 'player') label('👑', x, y - s / 2 - 10, `${s * 0.6}px sans-serif`, '#ffd54a');
      if (G.civs[c].atWar) label('⚔', x + s / 2 + 8, y - s / 2, `bold ${s * 0.5}px sans-serif`, '#ff6b6b');
    }

    // marcação e rota
    const px = X(P.x / TILE), py = Y(P.y / TILE);
    if (G.ping) {
      const gx = X(G.ping.x), gy = Y(G.ping.y);
      g.save();
      g.setLineDash([8, 6]); g.lineDashOffset = -t * 30;
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5; g.beginPath(); g.moveTo(px, py); g.lineTo(gx, gy); g.stroke();
      g.strokeStyle = '#ffd54a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, py); g.lineTo(gx, gy); g.stroke();
      g.restore();
      const pr = (t * 1.2) % 1;
      g.strokeStyle = `rgba(255,213,74,${1 - pr})`; g.lineWidth = 2.5;
      g.beginPath(); g.arc(gx, gy, 6 + pr * 22, 0, Math.PI * 2); g.stroke();
      this.drawPin(g, gx, gy, 1.15);
      label(`${G.ping.name} · ${this.distText(G.ping.x, G.ping.y)}`, gx, gy - 44, '600 13px "Segoe UI", sans-serif', '#ffe9a8');
    }
    // jogador
    const pr = (t * 1.5) % 1;
    g.strokeStyle = `rgba(120,200,255,${1 - pr})`; g.lineWidth = 2;
    g.beginPath(); g.arc(px, py, 7 + pr * 16, 0, Math.PI * 2); g.stroke();
    g.save(); g.translate(px, py); g.rotate(P.mdx || P.mdy ? Math.atan2(P.mdy || 0, P.mdx || 0) : (P.dir > 0 ? 0 : Math.PI));
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1b4f8a'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, -7.5); g.lineTo(-3, 0); g.lineTo(-7, 7.5); g.closePath(); g.fill(); g.stroke();
    g.restore();

    // bússola e escala
    g.save(); g.translate(cw - 34, 34);
    g.fillStyle = 'rgba(14,10,6,0.8)'; g.strokeStyle = 'rgba(214,174,96,0.8)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#e04848'; g.beginPath(); g.moveTo(0, -15); g.lineTo(5, 0); g.lineTo(-5, 0); g.fill();
    g.fillStyle = '#f1e4c6'; g.beginPath(); g.moveTo(0, 15); g.lineTo(5, 0); g.lineTo(-5, 0); g.fill();
    label('N', 0, -27, 'bold 11px "Segoe UI", sans-serif', '#f1e4c6');
    g.restore();
    const steps = [10, 20, 50, 100, 200, 500, 1000];
    const meters = steps.find(m => m / METERS_PER_TILE * z >= 70) || 1000;
    const bw = meters / METERS_PER_TILE * z;
    g.fillStyle = 'rgba(14,10,6,0.75)'; g.fillRect(cw - bw - 30, ch - 38, bw + 18, 26);
    g.fillStyle = '#f1e4c6'; g.fillRect(cw - bw - 21, ch - 22, bw, 3);
    g.fillRect(cw - bw - 21, ch - 27, 2, 8); g.fillRect(cw - 23, ch - 27, 2, 8);
    g.font = '600 11px "Segoe UI", sans-serif'; g.fillText(meters >= 1000 ? '1 km' : meters + ' m', cw - bw / 2 - 21, ch - 31);

    document.getElementById('mvZoom').textContent = Math.round(this.z / this.fitZoom() * 100) + '%';
  },

  drawPin(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd54a'; g.strokeStyle = '#3a2606'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-4, -8, -11, -14, -11, -22); g.arc(0, -22, 11, Math.PI, 0); g.bezierCurveTo(11, -14, 4, -8, 0, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#3a2606'; g.beginPath(); g.arc(0, -22, 4.5, 0, Math.PI * 2); g.fill();
    g.restore();
  },
};
