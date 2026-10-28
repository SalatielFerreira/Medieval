'use strict';
// Tela de passagem: ao entrar e sair de um imóvel, de uma caverna e de uma batalha, a tela fica coberta por um instante
// com uma cena animada (uma porta que se abre, tochas, espadas cruzadas...) enquanto o lugar novo é montado e desenhado.
// A troca acontece na hora, por baixo da cortina; ela segura pelo menos ~0,4 s e só some depois de o lugar novo ter sido
// desenhado duas vezes — assim nada aparece pela metade. Rápida: menos de meio segundo no total.
const TRANS_KINDS = {
  enter:  { ic: '🚪', anim: 'door',   txt: 'Entrando' },
  exit:   { ic: '🌄', anim: 'door',   txt: 'Saindo' },
  battle: { ic: '⚔️', anim: 'swords', txt: 'Rumo ao campo de batalha' },
  back:   { ic: '🏳️', anim: 'swords', txt: 'Voltando do campo de batalha' },
  cave:   { ic: '🕯️', anim: 'torch',  txt: 'Descendo à caverna' },
  cave2:  { ic: '☀️', anim: 'torch',  txt: 'Voltando à luz do dia' },
};
const Trans = {
  el: null, t: null, busy: 0,
  make() {
    if (this.el) return this.el;
    const el = document.createElement('div'); el.id = 'trans'; el.className = 'trans hidden';
    el.innerHTML = '<div class="tr-card"><div class="tr-art"><i class="tr-l"></i><i class="tr-r"></i><span class="tr-ic"></span></div><b class="tr-t"></b><small class="tr-n"></small><div class="tr-bar"><i></i></div></div>';
    document.body.appendChild(el); this.el = el; return el;
  },
  show(kind, name) {
    if (typeof G === 'undefined' || G.state !== 'play') return;
    const k = TRANS_KINDS[kind] || TRANS_KINDS.enter, el = this.make();
    el.className = `trans a-${k.anim}`; void el.offsetWidth; el.classList.add('on');
    el.querySelector('.tr-ic').textContent = k.ic; el.querySelector('.tr-t').textContent = k.txt; el.querySelector('.tr-n').textContent = name || '';
    const id = ++this.busy, t0 = performance.now();
    queueMicrotask(() => { if (G.state !== 'play' && id === this.busy) { this.busy++; el.className = 'trans hidden'; } }); // indo para o menu: sem cortina
    clearTimeout(this.t);
    // espera dois quadros desenhados e o tempo mínimo; então abre a cortina
    let frames = 0;
    const tick = () => { if (id !== this.busy) return; frames++; if (frames < 3 || performance.now() - t0 < 380) { requestAnimationFrame(tick); return; } el.classList.add('out'); this.t = setTimeout(() => { if (id === this.busy) el.className = 'trans hidden'; }, 260); };
    requestAnimationFrame(tick);
  },
};

{
  // imóveis: o cavalo — quem entra montado sai montado
  const en0 = Places.enterRoom.bind(Places);
  Places.enterRoom = function (src) {
    const mounted = !!(P.mounted && P.horse), before = G.place;
    const r = en0(src);
    if (G.place && G.place !== before) { G.place.wasMounted = mounted; Trans.show('enter', G.place.name); }
    return r;
  };
  const ex0 = Places.exit.bind(Places);
  Places.exit = function (quiet) {
    const pl = G.place, name = pl && pl.kind === 'room' && src2name(pl);
    const r = ex0(quiet);
    if (pl && pl.kind === 'room') {
      if (pl.wasMounted && P.horse && !P.horse.stall) { P.mounted = true; P.hx = P.x; P.hy = P.y; }
      if (!quiet) Trans.show('exit', name);
    }
    return r;
  };
  function src2name(pl) { return pl.src && pl.src.village !== undefined && World.villages[pl.src.village] ? World.villages[pl.src.village].name : ''; }
  // batalhas (guerras e assaltos a castelos)
  const wrapBattle = (o, startK, endK) => {
    if (!o) return;
    if (o[startK]) { const f = o[startK].bind(o); o[startK] = function (...a) { const b = G.place; const r = f(...a); if (G.place && G.place !== b && G.place.kind === 'battle') Trans.show('battle', G.place.enemy !== undefined && CIV_DEFS[G.place.enemy] ? 'contra ' + CIV_DEFS[G.place.enemy].name : ''); return r; }; }
    if (o[endK]) { const f = o[endK].bind(o); o[endK] = function (...a) { const b = G.place && G.place.kind === 'battle'; const r = f(...a); if (b && !(G.place && G.place.kind === 'battle')) Trans.show('back'); return r; }; }
  };
  wrapBattle(War, 'start', 'leave');
  wrapBattle(Assault, 'start', 'leave');
  // cavernas
  const dg0 = Dungeon.enter.bind(Dungeon);
  Dungeon.enter = function (...a) { const b = G.dungeon; const r = dg0(...a); if (G.dungeon && G.dungeon !== b) Trans.show('cave', G.dungeon.name); return r; };
  const dx0 = Dungeon.exit.bind(Dungeon);
  Dungeon.exit = function (...a) { const b = G.dungeon; const r = dx0(...a); if (b && !G.dungeon) Trans.show('cave2'); return r; };
}
