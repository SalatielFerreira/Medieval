'use strict';
// Pessoas favoritas: na conversa, "☆ Favoritar" marca a pessoa. Ela ganha uma estrelinha dourada discreta sobre a
// cabeça, aparece com uma estrela no mapa grande e no minimapa (onde está agora, ou na casa dela quando está longe) e
// numa seção "Favoritos" ao lado do mapa, para marcar como destino. A marca vai junto com a pessoa no jogo salvo.

const Favorites = {
  list() { return G.people.filter(p => p.alive && p.starred); },
  // onde a pessoa está (em blocos do mapa): perto de você, onde anda; longe, a casa dela
  where(p) {
    const e = G.spawned && G.spawned.get(p.id);
    if (e && !e.dead && !G.place) return { x: e.x / TILE, y: e.y / TILE, here: true };
    const h = p.home || {};
    if (h.type === 'village' && World.villages[h.idx]) { const v = World.villages[h.idx]; return { x: v.x + 0.5, y: v.y + 0.5 }; }
    if (h.type === 'castle' && World.capitals[h.civ]) { const c = World.capitals[h.civ]; return { x: c.x + 0.5, y: c.y + 0.5 }; }
    if (h.type === 'player' && G.spawn) return { x: G.spawn.x / TILE, y: G.spawn.y / TILE };
    if (p.soldierOf !== undefined && World.capitals[p.soldierOf]) { const c = World.capitals[p.soldierOf]; return { x: c.x + 0.5, y: c.y + 0.5 }; }
    return null;
  },
  toggle(p) {
    p.starred = !p.starred;
    return { text: p.starred ? 'Hum? Você está me olhando com atenção...' : 'Tudo bem, fica para outra vez.', note: p.starred ? `⭐ ${p.name} está nos seus favoritos: uma estrela fica sobre a cabeça e no mapa.` : `${p.name} saiu dos favoritos.` };
  },
  // estrelinha de cinco pontas
  star(g, x, y, r, fill) {
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = fill || '#ffd54a'; g.fill(); g.lineWidth = Math.max(1, r * 0.25); g.strokeStyle = 'rgba(58,38,6,0.85)'; g.stroke();
  },
};

{
  // na conversa: favoritar / tirar
  const a0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) { a0(p, acts); acts.push(['fav', p.starred ? '★ Tirar dos favoritos' : '☆ Favoritar (estrela no mapa)']); };
  const t0 = Lifesim.talkAct.bind(Lifesim);
  Lifesim.talkAct = function (p, op) { return op === 'fav' ? Favorites.toggle(p) : t0(p, op); };
  const c0 = Lifesim.chips.bind(Lifesim);
  Lifesim.chips = function (p) { const out = c0(p); if (p.starred) out.unshift('<span class="tag" style="background:#6a5210">⭐ Favorito</span>'); return out; };
  // estrela discreta sobre a cabeça
  const d0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    d0.call(this, ctx, cx, cy);
    if (!this.npc || !this.npc.starred || this.dead || this.sleeping || this.inRoom) return;
    const bob = Math.sin((G.realTime || 0) * 2.4 + this.npc.id) * 1.2;
    ctx.save(); ctx.globalAlpha = 0.92;
    Favorites.star(ctx, Math.round(this.x - cx + 11), Math.round(this.y - cy - 44 + bob), 3.8); // ao lado da cabeça (acima ficam o nome e os balões)
    ctx.restore();
  };
  // mapa grande: estrelas e a seção de favoritos
  const md0 = MapView.draw.bind(MapView);
  MapView.draw = function () {
    md0();
    const L = Favorites.list(); if (!L.length || !this.cv) return;
    const g = this.cv.getContext('2d'), dpr = window.devicePixelRatio || 1, z = this.z;
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of L) {
      const w = Favorites.where(p); if (!w) continue;
      const x = (w.x - this.ox) * z, y = (w.y - this.oy) * z;
      if (x < -20 || y < -20 || x > this.cw + 20 || y > this.ch + 20) continue;
      Favorites.star(g, x, y - 10, 7); g.font = '600 11px "Segoe UI", sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(14,10,6,0.85)';
      g.strokeText(p.name, x, y - 21); g.fillStyle = '#ffe9a8'; g.fillText(p.name, x, y - 21);
    }
    g.restore();
  };
  const ms0 = MapView.renderSide.bind(MapView);
  MapView.renderSide = function () {
    ms0();
    const L = Favorites.list(); if (!this.side || !L.length) return;
    const rows = L.map(p => { const w = Favorites.where(p); if (!w) return ''; return `<div class="mv-row" data-goto="${w.x},${w.y}" data-name="${UI.esc(p.name + ' ' + p.surname)}">
        <span class="dot" style="background:#ffd54a"></span><div class="t"><b>⭐ ${UI.esc(p.name + ' ' + p.surname)}</b><small>${UI.esc(People.title(p))}${w.here ? ' · aqui perto' : ' · em casa'} · ${this.distText(w.x, w.y)}</small></div>
        <button class="pinbtn" title="Marcar como destino">${icon('pin')}</button></div>`; }).join('');
    this.side.insertAdjacentHTML('afterbegin', `<div class="mv-sec"><h4>Favoritos</h4>${rows}</div>`);
  };
  // minimapa: estrelinhas
  const mm0 = Game.drawMinimap.bind(Game);
  Game.drawMinimap = function (ctx, cw) {
    mm0(ctx, cw);
    if (!this.miniRect) return;
    const L = Favorites.list(); if (!L.length) return;
    const { x: x0, y: y0, s: S } = this.miniRect, k = S / WORLD_W;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, S, S); ctx.clip();
    for (const p of L) { const w = Favorites.where(p); if (w) Favorites.star(ctx, x0 + w.x * k, y0 + w.y * k, 4); }
    ctx.restore();
  };
}
