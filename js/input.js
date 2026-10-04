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
    [12, 13].forEach((i, q) => { if (hit(i)) Game.useQuick(q); });
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
  KEYS: { stick: 'Joystick', atk: 'Atacar', use: 'Interagir', run: 'Correr', q0: 'Bolso 1', q1: 'Bolso 2' },
  items() { return [...document.querySelectorAll('#touch [data-tcl]')]; },
  applyLayout(L) {
    L = L === false ? null : L || this.layout || G.settings.touchLayout || null;
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
  // editor: escolha um controle (na lista ou tocando nele), arraste para mover e use a barra para o tamanho.
  // Cada controle guarda a própria posição e o próprio tamanho. Salvar grava; Cancelar (ou Esc) sai sem mudar nada.
  editInit() {
    const bar = document.createElement('div'); bar.id = 'tcEdit'; bar.className = 'hidden';
    bar.innerHTML = `<div class="tce-pick" id="tcePick">${Object.entries(this.KEYS).map(([k, n]) => `<button data-tcp="${k}">${n}</button>`).join('')}</div>
      <div class="tce-row"><span class="tce-lab">Tamanho</span><input type="range" id="tceRange" min="50" max="180" step="5" value="100"><b id="tceSize">100%</b>
        <button data-tce="reset" title="Volta todos os controles ao lugar original">↺ Padrão</button><button data-tce="cancel">✕ Cancelar</button><button class="primary" data-tce="save">✔ Salvar</button></div>
      <small class="tce-tip">Toque num controle e arraste para mover · a barra muda só o tamanho do controle escolhido</small>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', e => {
      const p = e.target.closest('[data-tcp]'); if (p) { this.select(p.dataset.tcp); return; }
      const b = e.target.closest('[data-tce]'); if (b) this.editAct(b.dataset.tce);
    });
    document.getElementById('tceRange').addEventListener('input', e => this.setSize(+e.target.value / 100));
    // arrastar: começa tocando num controle; o movimento é acompanhado na tela inteira (o dedo pode sair de cima dele)
    let drag = null;
    document.getElementById('touch').addEventListener('pointerdown', e => {
      if (!this.editing) return;
      e.stopPropagation(); e.preventDefault();
      const it = e.target.closest('[data-tcl]');
      if (!it || drag) return;
      const k = it.dataset.tcl, c = this.layout[k];
      this.select(k);
      drag = { id: e.pointerId, k, dx: c.x * innerWidth - e.clientX, dy: c.y * innerHeight - e.clientY };
    }, true);
    window.addEventListener('pointermove', e => {
      if (!this.editing || !drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const c = this.layout[drag.k];
      c.x = U.clamp((e.clientX + drag.dx) / innerWidth, 0.04, 0.96);
      c.y = U.clamp((e.clientY + drag.dy) / innerHeight, 0.06, 0.96);
      this.applyLayout(this.layout);
    }, { passive: false });
    const up = e => { if (drag && e.pointerId === drag.id) drag = null; };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', e => { if (this.editing && e.code === 'Escape') { e.stopPropagation(); this.editAct('cancel'); } }, true);
  },
  select(k) {
    this.sel = k;
    for (const it of this.items()) it.classList.toggle('tce-on', it.dataset.tcl === k);
    for (const b of document.querySelectorAll('#tcePick [data-tcp]')) b.classList.toggle('on', b.dataset.tcp === k);
    const s = this.layout[k].s;
    document.getElementById('tceRange').value = Math.round(s * 100);
    document.getElementById('tceSize').textContent = Math.round(s * 100) + '%';
  },
  setSize(s) {
    if (!this.sel) return;
    this.layout[this.sel].s = Math.round(U.clamp(s, 0.5, 1.8) * 100) / 100;
    this.applyLayout(this.layout);
    document.getElementById('tceSize').textContent = Math.round(this.layout[this.sel].s * 100) + '%';
  },
  // posições e tamanhos originais (sem nada escolhido)
  defaults() {
    this.applyLayout(false);
    const L = this.measure();
    return L;
  },
  edit() {
    if (!document.getElementById('touch').firstChild) this.init();
    this.wasOn = this.on;
    this.show(true);
    UI.close();
    this.editing = true; G.paused = true; G.touchMove = null; G.keys.Space = false;
    document.body.classList.add('tc-edit');
    for (const it of this.items()) it.classList.remove('off');
    this.update(); // algibeira vazia aparece para poder ser posicionada
    const base = this.defaults(), saved = G.settings.touchLayout || {};
    this.layout = {};
    for (const k in base) this.layout[k] = saved[k] ? Object.assign({}, saved[k]) : base[k];
    this.applyLayout(this.layout);
    document.getElementById('tcEdit').classList.remove('hidden');
    this.select('stick');
  },
  editAct(a) {
    if (a === 'reset') { this.layout = this.defaults(); this.applyLayout(this.layout); this.select(this.sel || 'stick'); UI.msg('Controles de volta ao lugar original. Toque em Salvar para manter.'); }
    else if (a === 'save') this.editEnd(true);
    else if (a === 'cancel') this.editEnd(false);
  },
  editEnd(save) {
    if (!this.editing) return;
    if (save) Game.setSetting('touchLayout', JSON.parse(JSON.stringify(this.layout)));
    this.editing = false;
    document.body.classList.remove('tc-edit');
    document.getElementById('tcEdit').classList.add('hidden');
    for (const it of this.items()) it.classList.remove('tce-on');
    this.layout = null; this.sel = null;
    this.applyLayout();
    this.update();
    this.show(this.wasOn);
    UI.showSettings('controles');
    UI.msg(save ? '🕹️ Controles salvos: ficam assim sempre que você entrar.' : 'Nada foi mudado nos controles.');
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
      if (b.dataset.k !== key) { b.dataset.k = key; b.innerHTML = `<span class="tc-it">${UI.ii(k)}</span><span class="tc-n">${n}</span>`; b.title = it.name; }
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

// ================================================================ teclas escolhidas pelo jogador (Ajustes → Controles)
// O jogo continua lendo as teclas "padrão" (KeyW, Space...): a tecla que você apertou é traduzida para a tecla padrão
// da ação que você escolheu. Setas e Esc ficam fixos. G.settings.keymap = { ação: código da tecla }.
const KEY_ACTIONS = [
  ['up', 'Andar para cima', 'KeyW'], ['down', 'Andar para baixo', 'KeyS'], ['left', 'Andar para a esquerda', 'KeyA'], ['right', 'Andar para a direita', 'KeyD'],
  ['run', 'Correr', 'ShiftLeft'], ['attack', 'Atacar e coletar', 'Space'], ['heavy', 'Golpe forte (segure e solte)', 'KeyV'], ['block', 'Bloquear com o escudo', 'KeyX'],
  ['dodge', 'Esquivar', 'KeyZ'], ['interact', 'Conversar e interagir', 'KeyE'], ['eat', 'Comer a melhor comida', 'KeyF'], ['tool', 'Trocar a ferramenta', 'KeyQ'],
  ['ride', 'Montar no cavalo', 'KeyR'], ['orders', 'Ordens aos capangas', 'KeyT'], ['siege', 'Aríete ou catapulta (cerco)', 'KeyG'],
  ['quick1', 'Usar o bolso 1', 'Digit1'], ['quick2', 'Usar o bolso 2', 'Digit2'],
  ['inventory', 'Mochila', 'KeyI'], ['craft', 'Criar', 'KeyC'], ['build', 'Construir', 'KeyB'], ['kingdom', 'Portfólio', 'KeyK'], ['map', 'Mapa', 'KeyM'], ['diary', 'Diário', 'KeyJ'],
];
const Keys = {
  waiting: null,
  def(a) { return KEY_ACTIONS.find(x => x[0] === a)[2]; },
  get(a) { const m = G.settings.keymap || {}; return m[a] || this.def(a); },
  // código apertado → código padrão da ação (null = tecla padrão que agora não faz nada)
  table() {
    if (this._t && this._tk === JSON.stringify(G.settings.keymap || {})) return this._t;
    const t = {};
    for (const [a, , d] of KEY_ACTIONS) t[this.get(a)] = d;
    if (t.ShiftLeft) t.ShiftRight = t.ShiftLeft;
    for (const [a, , d] of KEY_ACTIONS) if (!(d in t)) t[d] = null;
    if (this.get('run') === 'ShiftLeft' && !('ShiftRight' in t)) t.ShiftRight = 'ShiftRight';
    this._t = t; this._tk = JSON.stringify(G.settings.keymap || {});
    return t;
  },
  map(code) { const t = this.table(); return code in t ? t[code] : code; },
  name(code) {
    if (!code) return '—';
    const special = { Space: 'Espaço', ShiftLeft: 'Shift', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', AltRight: 'Alt Gr', Tab: 'Tab', Enter: 'Enter',
      Backspace: 'Apagar', CapsLock: 'Caps', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Comma: ',', Period: '.', Slash: ';', Semicolon: 'Ç', Quote: '~', BracketLeft: '´', BracketRight: '[', Backslash: ']', Minus: '-', Equal: '=', Backquote: "'" };
    if (special[code]) return special[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
    return code.replace(/^F(\d+)$/, 'F$1');
  },
  // escolher: a tecla já usada por outra ação troca de lugar com ela
  bind(a, code) {
    const m = Object.assign({}, G.settings.keymap || {}), old = this.get(a);
    const other = KEY_ACTIONS.find(x => x[0] !== a && this.get(x[0]) === code);
    m[a] = code;
    if (other) m[other[0]] = old;
    for (const [k, , d] of KEY_ACTIONS) if (m[k] === d) delete m[k];
    Game.setSetting('keymap', m);
    return other ? other[1] : null;
  },
  reset() { Game.setSetting('keymap', {}); },
};
