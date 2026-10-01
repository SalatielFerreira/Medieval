'use strict';
// Controle (gamepad) e controles de toque para celular e tablet.

const Pad = {
  prev: [], block: false, connected: false,
  // botões no padrão Xbox/PlayStation: A/✕ ação, B/○ esquiva, X/□ interagir, Y/△ mochila,
  // LB troca ferramenta, RB bloqueia, LT monta, RT golpe forte, Back mapa, Start ajustes, setas = algibeira
  update() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = list && Array.from(list).find(x => x && x.connected);
    if (!p) { if (this.connected) { this.connected = false; G.padMove = null; } return; }
    if (!this.connected) { this.connected = true; UI.msg('🎮 Controle conectado!', 'gold'); }
    const b = p.buttons.map(x => x.pressed), was = i => this.prev[i], hit = i => b[i] && !was(i);
    const dz = v => Math.abs(v) < 0.2 ? 0 : v;
    const lx = dz(p.axes[0] || 0), ly = dz(p.axes[1] || 0), rx = dz(p.axes[2] || 0), ry = dz(p.axes[3] || 0);
    G.padMove = lx || ly ? { x: lx, y: ly } : null;
    if (rx || ry) { G.mouse.wx = P.x + rx * 140; G.mouse.wy = P.y - 14 + ry * 140; G.mouse.x = G.mouse.wx - G.cam.x; G.mouse.y = G.mouse.wy - G.cam.y; }
    else if (G.padMove) { G.mouse.wx = P.x + lx * 80; G.mouse.wy = P.y - 14 + ly * 80; }
    if (G.state !== 'play') { this.prev = b; return; }
    if (UI.isOpen()) {
      if (hit(1) || hit(9)) UI.close();
      this.prev = b; return;
    }
    G.keys.Space = !!b[0];
    if (hit(0)) Game.playerAction(false, true);
    if (hit(1)) Moves.dodge();
    if (hit(2)) Game.interact();
    if (hit(3)) UI.toggle('showInventory');
    if (hit(4)) Game.cycleTool();
    this.block = !!b[5];
    if (hit(6)) Ride.toggle();
    if (hit(7)) Moves.startCharge();
    if (!b[7] && was(7)) Moves.release();
    if (hit(8)) UI.toggle('showMap');
    if (hit(9)) UI.showSettings();
    [12, 13, 14, 15].forEach((i, q) => { if (hit(i)) Game.useQuick(q); });
    this.prev = b;
  },
};

const Touch = {
  on: false, block: false, stick: null,
  isTouch() { return ('ontouchstart' in window) || (window.matchMedia && matchMedia('(pointer: coarse)').matches); },
  init() {
    const el = document.getElementById('touch');
    el.innerHTML = `<div class="tc-stick" id="tcStick"><div class="tc-knob" id="tcKnob"></div></div>
      <div class="tc-btns">
        <button class="tc-b tc-main" data-tc="atk">⚔️<small>Atacar</small></button>
        <button class="tc-b" data-tc="use">✋<small>Usar (E)</small></button>
        <button class="tc-b" data-tc="block">🛡️<small>Bloquear</small></button>
        <button class="tc-b" data-tc="dodge">💨<small>Esquiva</small></button>
        <button class="tc-b sm" data-tc="ride">🐴</button>
        <button class="tc-b sm" data-tc="tool">⛏️</button>
        <button class="tc-b sm" data-tc="order">👣</button>
        <button class="tc-b sm" data-tc="eat">🍎</button>
      </div>`;
    const stick = document.getElementById('tcStick'), knob = document.getElementById('tcKnob');
    const moveStick = (cx, cy) => {
      const r = stick.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
      let dx = cx - ox, dy = cy - oy; const L = Math.hypot(dx, dy), max = r.width / 2;
      if (L > max) { dx = dx / L * max; dy = dy / L * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const n = Math.hypot(dx, dy) / max;
      G.touchMove = n > 0.18 ? { x: dx / max, y: dy / max } : null;
      if (G.touchMove) { G.mouse.wx = P.x + dx * 3; G.mouse.wy = P.y - 14 + dy * 3; }
    };
    stick.addEventListener('pointerdown', e => { this.stick = e.pointerId; stick.setPointerCapture(e.pointerId); moveStick(e.clientX, e.clientY); e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === this.stick) moveStick(e.clientX, e.clientY); });
    const endStick = e => { if (e.pointerId !== this.stick) return; this.stick = null; knob.style.transform = ''; G.touchMove = null; };
    stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
    el.querySelectorAll('[data-tc]').forEach(b => {
      const k = b.dataset.tc;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); Sound.init();
        if (G.state !== 'play' || G.paused) return;
        if (k === 'atk') { if (this.meleeWeapon()) Moves.startCharge(); else { G.keys.Space = true; Game.playerAction(false, true); } }
        if (k === 'use') Game.interact();
        if (k === 'block') this.block = true;
        if (k === 'dodge') Moves.dodge();
        if (k === 'ride') Ride.toggle();
        if (k === 'tool') Game.cycleTool();
        if (k === 'order') Orders.cycle();
        if (k === 'eat') Game.eatBest();
      });
      const up = () => {
        if (k === 'atk') { G.keys.Space = false; if (P.charging) Moves.release(); }
        if (k === 'block') this.block = false;
      };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
  },
  meleeWeapon() { const w = P.equip.weapon && ITEMS[P.equip.weapon]; return !w || !w.ranged; },
  show(on) {
    this.on = on;
    document.getElementById('touch').classList.toggle('hidden', !on);
    document.body.classList.toggle('touchui', on);
  },
};
