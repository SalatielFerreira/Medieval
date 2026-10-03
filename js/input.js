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
    el.innerHTML = `<div class="tc-stick" id="tcStick" data-tcl="stick"><span class="tc-ar up"></span><span class="tc-ar dn"></span><span class="tc-ar lf"></span><span class="tc-ar rt"></span><div class="tc-knob" id="tcKnob"></div></div>
      <div class="tc-btns">
        <button class="tc-b tc-main" data-tc="atk" data-tcl="atk" aria-label="Atacar">${icon('sword')}</button>
        <button class="tc-b" data-tc="use" data-tcl="use" aria-label="Interagir">${icon('hand')}</button>
        <button class="tc-b" data-tc="run" data-tcl="run" aria-label="Correr">${icon('run')}</button>
        <button class="tc-b tc-bag hidden" data-tc="q0" data-tcl="q0" aria-label="Algibeira 1"></button>
        <button class="tc-b tc-bag hidden" data-tc="q1" data-tcl="q1" aria-label="Algibeira 2"></button>
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
    this.editInit();
    this.applyLayout();
  },

  // ------------------------------------------------------------ posição e tamanho que você escolheu (Ajustes → Controles)
  // Fica em G.settings.touchLayout: { stick: { x, y, s }, atk: {...} } — x e y são o centro em fração da tela, s o tamanho.
  KEYS: { stick: 'Joystick', atk: 'Atacar', use: 'Interagir', run: 'Correr', q0: 'Algibeira 1', q1: 'Algibeira 2' },
  items() { return [...document.querySelectorAll('#touch [data-tcl]')]; },
  applyLayout(L) {
    L = L || this.layout || G.settings.touchLayout || null;
    const el = document.getElementById('touch');
    if (!el) return;
    el.classList.toggle('tcl', !!L);
    for (const it of this.items()) {
      const c = L && L[it.dataset.tcl];
      if (c) { it.style.left = c.x * 100 + '%'; it.style.top = c.y * 100 + '%'; it.style.right = it.style.bottom = 'auto'; it.style.transform = `translate(-50%, -50%) scale(${c.s})`; }
      else { it.style.left = it.style.top = it.style.right = it.style.bottom = it.style.transform = ''; }
    }
  },
  // posição atual de cada controle (para começar a editar de onde estão)
  measure() {
    const L = {}, W = window.innerWidth, H = window.innerHeight;
    for (const it of this.items()) {
      const r = it.getBoundingClientRect();
      L[it.dataset.tcl] = { x: (r.left + r.width / 2) / W, y: (r.top + r.height / 2) / H, s: Math.round(r.width / (it.offsetWidth || r.width) * 100) / 100 };
    }
    return L;
  },
  editInit() {
    const el = document.getElementById('touch'), pts = new Map();
    let drag = null, pinch = null;
    const bar = document.createElement('div'); bar.id = 'tcEdit'; bar.className = 'hidden';
    bar.innerHTML = `<div class="tce-info"><b id="tceName">Toque num controle</b><small>Arraste para mover · dois dedos ou − / + para o tamanho</small></div>
      <div class="tce-size"><button data-tce="minus">−</button><span id="tceSize">100%</span><button data-tce="plus">+</button></div>
      <button data-tce="reset">↺ Padrão</button><button class="primary" data-tce="done">✔ Concluir</button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', e => { const b = e.target.closest('[data-tce]'); if (b) this.editAct(b.dataset.tce); });
    // no modo de edição o toque move e redimensiona (e não ataca nem anda)
    el.addEventListener('pointerdown', e => {
      if (!this.editing) return;
      e.stopPropagation(); e.preventDefault();
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const it = e.target.closest('[data-tcl]');
      if (it) { this.select(it.dataset.tcl); const c = this.layout[it.dataset.tcl]; drag = { id: e.pointerId, k: it.dataset.tcl, dx: c.x * innerWidth - e.clientX, dy: c.y * innerHeight - e.clientY }; }
      if (pts.size === 2 && this.sel) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: this.layout[this.sel].s }; drag = null; }
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    }, true);
    el.addEventListener('pointermove', e => {
      if (!this.editing || !pts.has(e.pointerId)) return;
      e.stopPropagation();
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) { const [a, b] = [...pts.values()]; this.resize(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, true); return; }
      if (drag && drag.id === e.pointerId) {
        const c = this.layout[drag.k];
        c.x = U.clamp((e.clientX + drag.dx) / innerWidth, 0.03, 0.97); c.y = U.clamp((e.clientY + drag.dy) / innerHeight, 0.05, 0.97);
        this.applyLayout(this.layout);
      }
    }, true);
    const up = e => { if (!this.editing) return; e.stopPropagation(); pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (drag && drag.id === e.pointerId) drag = null; };
    el.addEventListener('pointerup', up, true); el.addEventListener('pointercancel', up, true);
  },
  select(k) {
    this.sel = k;
    for (const it of this.items()) it.classList.toggle('tce-on', it.dataset.tcl === k);
    document.getElementById('tceName').textContent = k ? this.KEYS[k] : 'Toque num controle';
    document.getElementById('tceSize').textContent = k ? Math.round(this.layout[k].s * 100) + '%' : '—';
  },
  resize(s, abs) {
    if (!this.sel) return;
    const c = this.layout[this.sel];
    c.s = Math.round(U.clamp(abs ? s : c.s + s, 0.5, 1.8) * 100) / 100;
    this.applyLayout(this.layout); this.select(this.sel);
  },
  edit() {
    if (!document.getElementById('touch').firstChild) this.init();
    this.wasOn = this.on;
    this.show(true);
    UI.close();
    this.editing = true; G.paused = true; G.touchMove = null; G.keys.Space = false;
    document.body.classList.add('tc-edit');
    for (const it of this.items()) it.classList.remove('off');
    this.layout = G.settings.touchLayout ? JSON.parse(JSON.stringify(G.settings.touchLayout)) : this.measure();
    // controles que não estavam medidos (ex.: algibeira vazia) entram onde estão agora
    const now = this.measure(); for (const k in now) if (!this.layout[k]) this.layout[k] = now[k];
    this.applyLayout(this.layout);
    document.getElementById('tcEdit').classList.remove('hidden');
    this.select('stick');
  },
  editAct(a) {
    if (a === 'minus') this.resize(-0.1);
    else if (a === 'plus') this.resize(0.1);
    else if (a === 'reset') { this.layout = null; this.applyLayout(null); document.getElementById('touch').classList.remove('tcl'); requestAnimationFrame(() => { this.layout = this.measure(); this.applyLayout(this.layout); this.select(this.sel || 'stick'); this.resetPending = true; }); }
    else if (a === 'done') this.editEnd(true);
  },
  editEnd(save) {
    this.editing = false;
    document.body.classList.remove('tc-edit');
    document.getElementById('tcEdit').classList.add('hidden');
    for (const it of this.items()) it.classList.remove('tce-on');
    if (save) Game.setSetting('touchLayout', this.resetPending ? null : this.layout);
    this.resetPending = false; this.layout = null; this.sel = null;
    this.applyLayout();
    this.update();
    this.show(this.wasOn);
    UI.showSettings('controles');
    UI.msg(save ? '🕹️ Controles salvos: ficam assim sempre que você entrar.' : '');
  },
  // mostra só o que dá para usar agora: algibeira com item, ferramenta com alvo, interação com algo por perto
  update() {
    const el = document.getElementById('touch');
    if (!el || !el.firstChild) return;
    el.querySelector('[data-tc="use"]').classList.toggle('off', !Game.canInteract());
    el.querySelector('[data-tc="run"]').classList.toggle('on', !!G.touchSprint);
    for (const q of [0, 1]) {
      const b = el.querySelector(`[data-tc="q${q}"]`), k = P.quick[q], it = k && ITEMS[k], n = k ? Inv.count(k) : 0;
      b.classList.toggle('hidden', !this.editing && (!it || n <= 0));
      if (!it || n <= 0) { if (this.editing && !b.dataset.k) b.innerHTML = '<span class="tc-it">👝</span>'; continue; }
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
