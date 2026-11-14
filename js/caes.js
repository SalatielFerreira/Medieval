'use strict';
// O cão de guarda: mande ele ficar e proteger um lugar, ou vir com você.
//  • Perto do cão aparece o botão "🛡️ Ficar e proteger aqui" (ou "👣 Vir comigo"); no computador também a tecla H
//    (vale para todos os cães) e a linha do cão no quadro das ordens, embaixo da ordem aos capangas.
//  • Guardando, o cão fica onde você mandou e ataca quem chegar perto (até uns 7 passos), voltando depois para o lugar;
//    a ordem fica guardada no jogo salvo.
//  • Ele recupera a vida sozinho: alguns segundos sem brigar e a vida volta aos poucos (cheia em uns 25 segundos).
const DOG_LEASH = 4, DOG_REGEN = 0.04; // folga do lugar guardado (em blocos) e vida recuperada por segundo (fração)
const Dogs = {
  S() { const u = G.urban || (G.urban = {}); return u.dogs || (u.dogs = { stay: [] }); },
  list() { return typeof Content2 !== 'undefined' ? Content2.dogs() : []; },
  near() { let best = null, bd = 3 * TILE; for (const d of this.list()) { const dd = U.dist(d.x, d.y, P.x, P.y); if (dd < bd) { bd = dd; best = d; } } return best; },
  stay(d, pos, quiet) {
    d.stay = { x: pos.x, y: pos.y }; d.follow = null; d.home = { x: pos.x, y: pos.y }; d.leash = DOG_LEASH * TILE; d.target = null; d.returning = true;
    this.save();
    if (!quiet) { UI.msg('🐕 Seu cão vai ficar e proteger este lugar.', 'gold'); Game.addText(d.x, d.y - 30, '🛡️ Guardando', '#ffd36b'); Sound.play('ui'); }
  },
  follow(d, quiet) {
    d.stay = null; d.follow = P; d.leash = 2 * TILE; d.returning = false; d.target = null;
    this.save();
    if (!quiet) { UI.msg('🐕 Seu cão vem com você.', 'gold'); Game.addText(d.x, d.y - 30, '👣 Seguindo', '#ffd36b'); Sound.play('ui'); }
  },
  toggle(d) { if (!d) return; if (d.stay) this.follow(d); else this.stay(d, { x: d.x, y: d.y }); },
  // tecla H: se algum está vindo com você, todos ficam onde estão; senão, todos vêm
  toggleAll() {
    const L = this.list(); if (!L.length) { UI.msg('🐕 Você não tem cão de guarda (construa um canil).', 'bad'); return; }
    const anyFollow = L.some(d => !d.stay), one = L.length === 1;
    for (const d of L) { if (anyFollow) { if (!d.stay) this.stay(d, { x: d.x, y: d.y }, true); } else this.follow(d, true); }
    UI.msg(anyFollow ? (one ? '🐕 Seu cão fica e protege onde está.' : '🐕 Seus cães ficam e protegem onde estão.') : (one ? '🐕 Seu cão vem com você.' : '🐕 Seus cães vêm com você.'), 'gold');
    Sound.play('ui');
  },
  save() { this.S().stay = this.list().map(d => d.stay ? { x: Math.round(d.stay.x), y: Math.round(d.stay.y) } : null); },
  // cada quadro: a ordem guardada vale para os cães que acabaram de aparecer (ao carregar) e a vida volta sozinha
  update(dt) {
    const L = this.list(); if (!L.length) return;
    const st = this.S().stay;
    L.forEach((d, i) => {
      if (!d._dogSync) { d._dogSync = true; const p = st[i]; if (p) { this.stay(d, p, true); if (U.dist(d.x, d.y, p.x, p.y) > 2 * TILE) { d.x = p.x; d.y = p.y; } } }
      if (d.hp < d.maxHp && !d.target && d.hurt < -3) d.hp = Math.min(d.maxHp, d.hp + d.maxHp * DOG_REGEN * dt);
    });
  },
  // o botão em cima do cão (computador e celular)
  btn() {
    let el = document.getElementById('dogBtn');
    if (!el) {
      el = document.createElement('div'); el.id = 'dogBtn';
      el.addEventListener('click', ev => { ev.stopPropagation(); const d = this._btnDog; if (d && !d.dead) this.toggle(d); });
      document.body.appendChild(el);
    }
    return el;
  },
  place(cx, cy) {
    const el = this.btn(), d = !UI.isOpen() && !P.dead && !G.place && G.state === 'play' ? this.near() : null;
    this._btnDog = d;
    if (!d) { if (el.style.display !== 'none') el.style.display = 'none'; return; }
    const t = d.stay ? '👣 Vir comigo' : '🛡️ Ficar e proteger aqui';
    if (el.dataset.t !== t) { el.dataset.t = t; el.innerHTML = `<span>🐕</span>${t}`; }
    el.style.display = 'flex';
    const z = Game.zoom || 1; el.style.left = Math.round((d.x - cx) * z) + 'px'; el.style.top = Math.round((d.y - cy - 34) * z - 30) + 'px';
  },
  // a linha do cão no quadro das ordens (computador)
  sync() {
    const q = document.getElementById('quick'); if (!q) return;
    let row = document.getElementById('qDogBox');
    if (!row) {
      const box = document.createElement('div'); box.className = 'q-row';
      box.innerHTML = `<div class="q-ord" id="qDogBox" title="Cão de guarda: clique (ou ${Keys.label('dog')}) para ficar ou seguir"><b id="qDog"></b></div>`;
      q.appendChild(box); row = document.getElementById('qDogBox');
      row.addEventListener('click', ev => { ev.stopPropagation(); if (G.state === 'play' && !G.paused) this.toggleAll(); });
    }
    const L = G.state === 'play' ? this.list() : [];
    const t = !L.length ? '' : L.every(d => d.stay) ? '🐕 Cão: guardando' : L.some(d => d.stay) ? '🐕 Cães: alguns guardando' : '🐕 Cão: seguindo';
    row.parentElement.style.display = t ? '' : 'none';
    const b = document.getElementById('qDog'); if (b && b.textContent !== t) b.textContent = t;
  },
};
{
  // a cada quadro (o mesmo laço do canil)
  const u0 = Content2.update.bind(Content2);
  Content2.update = function (dt) { const r = u0(dt); try { Dogs.update(dt); } catch (e) { console.error(e); } return r; };
  // o botão acompanha o cão; o cão guardando ganha um escudinho em cima
  const rd0 = Game.render.bind(Game);
  Game.render = function (...a) {
    const r = rd0(...a);
    if (G.state !== 'play') return r;
    const z = this.zoom || 1, cx = Math.round(G.cam.x * z) / z, cy = Math.round(G.cam.y * z) / z;
    Dogs.place(cx, cy);
    if (!G.place) {
      const L = Dogs.list().filter(d => d.stay);
      if (L.length) { const ctx = this.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; for (const d of L) ctx.fillText('🛡️', Math.round((d.x - cx) * z), Math.round((d.y - cy - 30) * z)); ctx.restore(); }
    }
    return r;
  };
  // tecla H (ou a que você escolheu em Ajustes → Controles)
  window.addEventListener('keydown', e => {
    if (G.state !== 'play' || G.paused || UI.isOpen() || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
    if (Keys.map(e.code) === 'KeyH' && !e.repeat) Dogs.toggleAll();
  });
  setInterval(() => { try { Dogs.sync(); } catch (e) { /* ainda sem quadro */ } }, 500);
}
