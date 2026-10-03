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
    if (rx || ry) { G.mouse.wx = P.x + rx * 140; G.mouse.wy = P.y - 14 + ry * 140; G.mouse.x = (G.mouse.wx - G.cam.x) * (Game.zoom || 1); G.mouse.y = (G.mouse.wy - G.cam.y) * (Game.zoom || 1); }
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
    if (hit(7)) Moves.startHeavy();
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
    // joystick translúcido com setas; à direita, botões redondos e meio transparentes (estilo "Last Day on Earth")
    el.innerHTML = `<div class="tc-stick" id="tcStick"><span class="tc-ar up"></span><span class="tc-ar dn"></span><span class="tc-ar lf"></span><span class="tc-ar rt"></span><div class="tc-knob" id="tcKnob"></div></div>
      <div class="tc-btns">
        <button class="tc-b tc-main" data-tc="atk" aria-label="Atacar">${icon('sword')}</button>
        <button class="tc-b" data-tc="use" aria-label="Interagir">${icon('hand')}</button>
        <button class="tc-b" data-tc="run" aria-label="Correr">${icon('run')}</button>
        <button class="tc-b tc-bag hidden" data-tc="q0" aria-label="Algibeira 1"></button>
        <button class="tc-b tc-bag hidden" data-tc="q1" aria-label="Algibeira 2"></button>
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
        if (k === 'atk') { G.keys.Space = true; Game.playerAction(false, true); } // segurar repete o golpe
        if (k === 'use') Game.interact();
        if (k === 'run') { G.touchSprint = !G.touchSprint; b.classList.toggle('on', G.touchSprint); }
        if (k === 'q0' || k === 'q1') {
          const it = P.quick[+k[1]] && ITEMS[P.quick[+k[1]]];
          if (it && it.tool) { Game.wield(P.quick[+k[1]]); G.keys.Space = true; Game.playerAction(false, true); } // empunha e já trabalha; segurar continua
          else Game.useQuick(+k[1]);
        }
      });
      const up = () => {
        if (k === 'atk' || k === 'q0' || k === 'q1') G.keys.Space = false;
      };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
  },
  // mostra só o que dá para usar agora: algibeira com item, ferramenta com alvo, interação com algo por perto
  update() {
    const el = document.getElementById('touch');
    if (!el || !el.firstChild) return;
    el.querySelector('[data-tc="use"]').classList.toggle('off', !Game.canInteract());
    el.querySelector('[data-tc="run"]').classList.toggle('on', !!G.touchSprint);
    for (const q of [0, 1]) {
      const b = el.querySelector(`[data-tc="q${q}"]`), k = P.quick[q], it = k && ITEMS[k], n = k ? Inv.count(k) : 0;
      b.classList.toggle('hidden', !it || n <= 0);
      if (!it || n <= 0) continue;
      const key = k + ':' + n;
      if (b.dataset.k !== key) { b.dataset.k = key; b.innerHTML = `<span class="tc-it">${it.icon}</span><span class="tc-n">${n}</span>`; b.title = it.name; }
      b.classList.toggle('off', !!it.tool && !Game.toolUsable(k));
      b.classList.toggle('eq', !!it.tool && P.equip.tool === k);
    }
  },
  show(on) {
    this.on = on;
    document.getElementById('touch').classList.toggle('hidden', !on);
    document.body.classList.toggle('touchui', on);
  },
};
