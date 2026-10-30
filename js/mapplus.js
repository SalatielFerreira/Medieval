'use strict';
// Mapa com as construções identificadas: cada loja, serviço, templo, porto, prisão, banco, negócio, fazenda e perigo
// ganha um selo com o ícone dele na cor da sua categoria (o nome aparece ao aproximar). Na lateral, os filtros por
// categoria (ligar e desligar) e "Perto de você" (as lojas e serviços mais próximos, para marcar como destino); ao passar
// o mouse, a dica diz o que é, de quem é e quem cuida. A neblina continua escondendo o que você ainda não viu.
const MAP_CATS = {
  shop:   ['🛒', 'Lojas e serviços', '#e8a23a'],
  power:  ['🏰', 'Poder e ordem', '#c84a4a'],
  faith:  ['⛪', 'Fé e descanso', '#9a8ae0'],
  travel: ['⚓', 'Viagem e montaria', '#3aa0d0'],
  biz:    ['💼', 'Empreendimentos', '#c8a040'],
  farm:   ['🌾', 'Campos e criações', '#6aa84a'],
  mine:   ['⭐', 'Suas construções', '#ffd54a'],
  home:   ['🏠', 'Casas', '#a08868'],
  danger: ['⚠️', 'Perigos', '#e04848'],
};
const MAP_ICON = {
  vhouse: '🏠', house: '🏠', cabin: '🛖', vbuild: '🏗️', cave: '🕳️', field: '🌾', camp: '⛺', castle: '🏰', store: '🛒', tavern: '🍺', smith: '⚒️', lumber: '🪵', quarry: '🪨',
  arena: '🏟️', chapel: '⛪', cathedral: '⛪', port: '⚓', cemetery: '⚰️', bank: '🏦', prison: '⛓️', shrine: '✨', haras: '🐎', stable: '🐴', vstable: '🐴',
  vbakery: '🥖', vmill: '🌬️', vinn: '🛏️', vschool: '📚', vbath: '🛁', vtower: '🗼', vweaver: '🧵', vbrewery: '🍺', vtrade: '🛒', vmine: '⛏️', vsawmill: '🪚',
  vgranary: '🌾', vclinic: '🌿', fmill: '🌬️', fshop: '🏪', fforge: '⚒️', vgate: '🚪', relay: '🐴', dock: '⚓', barracks: '🛡️', watchtower: '🗼', archer_tower: '🏹',
};
const MAP_SKIP = new Set(['wall_wood', 'wall_stone', 'vwall', 'fence', 'hedge', 'lamppost', 'bench', 'flowerbed', 'cave_exit', 'road', 'chest', 'big_chest', 'campfire', 'workbench']);
const MAP_IMPORTANT = new Set(['port', 'arena', 'prison', 'bank', 'cathedral', 'shrine', 'camp', 'haras']);

const MapPlus = {
  off() { const S = UI.sel; return S.mapOff || (S.mapOff = { home: true }); },
  name(s) { return (CIV_STRUCTS[s.type] && CIV_STRUCTS[s.type].name) || (BUILDINGS[s.type] && BUILDINGS[s.type].name) || s.sname || s.type; },
  icon(s) { if (MAP_ICON[s.type]) return MAP_ICON[s.type]; const b = Game.buildIcon ? Game.buildIcon(s.type) : ''; return typeof b === 'string' && b && !b.includes('<') ? b : '🏠'; },
  cat(s) {
    const t = s.type;
    if (t === 'camp' || t === 'cave') return 'danger';
    if (s.owner === 'player') return BIZ_TYPES[t] ? 'biz' : 'mine';
    if (['castle', 'prison', 'arena', 'bank', 'barracks', 'vtower', 'watchtower', 'archer_tower', 'vgate'].includes(t)) return 'power';
    if (['chapel', 'cathedral', 'shrine', 'cemetery', 'oratory', 'vbath', 'vclinic'].includes(t)) return 'faith';
    if (['port', 'stable', 'vstable', 'haras', 'relay', 'dock'].includes(t)) return 'travel';
    if (BIZ_TYPES[t]) return 'biz';
    if (/field|farm|garden|orchard|coop|pen|pigsty|beehive|flax|herb|mushroom|dovecote|fishpond|granary/.test(t)) return 'farm';
    if (['vhouse', 'house', 'cabin', 'vbuild', 'lodge', 'manor', 'villa'].includes(t)) return 'home';
    return 'shop';
  },
  list() {
    const n = World.structs.length;
    if (this._n !== n || G.day !== this._d) { this._n = n; this._d = G.day; this._L = World.structs.filter(s => s && !s.removed && !s.hidden && !MAP_SKIP.has(s.type) && s.type !== 'castle').map(s => ({ s, cat: this.cat(s), x: s.x + s.w / 2, y: s.y + s.h / 2 })); }
    return this._L;
  },
  // o selo (ícone num círculo da cor da categoria), guardado pronto
  sprite(ic, col, r) {
    const key = ic + col + r, C = this._sp || (this._sp = new Map()); let c = C.get(key);
    if (!c) {
      const d = Math.ceil(r * 2 + 6), dpr = window.devicePixelRatio || 1; c = document.createElement('canvas'); c.width = c.height = Math.ceil(d * dpr); c.dataset.d = d;
      const g = c.getContext('2d'); g.scale(dpr, dpr); const m = d / 2;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(m, m + 1.5, r + 1.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a1208'; g.beginPath(); g.arc(m, m, r + 1.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = col; g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(m, m - r * 0.35, r * 0.7, Math.PI, 0); g.fill(); g.fillStyle = '#fff';
      g.font = `${Math.round(r * 1.35)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ic, m, m + r * 0.06);
      C.set(key, c);
    }
    return c;
  },
  draw(g, X, Y, z, cw, ch) {
    if (z < 2.2) return;
    const off = this.off(), fog = typeof Fog !== 'undefined' && Fog.on();
    const r = U.clamp(z * 0.8, 8, 16), labels = z >= 12;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const it of this.list()) {
      if (off[it.cat]) continue;
      if (z < 6 && !MAP_IMPORTANT.has(it.s.type)) continue;
      const x = X(it.x), y = Y(it.y); if (x < -20 || y < -20 || x > cw + 20 || y > ch + 20) continue;
      if (fog && !Fog.seen(it.x, it.y)) continue;
      // (o banco já tem o nome dele no mapa: sem rótulo repetido)
      const sp = this.sprite(this.icon(it.s), MAP_CATS[it.cat][2], r), d = +sp.dataset.d;
      g.drawImage(sp, x - d / 2, y - d / 2, d, d);
      if (labels && it.s.type !== 'bank') { const t = this.name(it.s); g.font = '600 11px "Segoe UI", sans-serif'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 3; g.strokeText(t, x, y + r + 10); g.fillStyle = '#fff3d0'; g.fillText(t, x, y + r + 10); }
    }
    g.restore();
  },
  at(tx, ty, rad) { let best = null, bd = rad; const off = this.off(); for (const it of this.list()) { if (off[it.cat]) continue; const dd = U.dist(tx, ty, it.x, it.y); if (dd < bd) { bd = dd; best = it; } } return best; },
  info(it) {
    const s = it.s, k = typeof Shops !== 'undefined' && Shops.isShop && Shops.isShop(s) ? Shops.keeper(s) : null;
    const vi = typeof Work !== 'undefined' ? Work.vi(s) : -1, v = vi >= 0 ? World.villages[vi] : null;
    const owner = s.owner === 'player' ? 'sua' : typeof s.owner === 'number' && CIV_DEFS[s.owner] ? CIV_DEFS[s.owner].short : v ? v.name : '';
    return `<b>${this.icon(s)} ${UI.esc(this.name(s))}</b> <small style="color:${MAP_CATS[it.cat][2]}">${MAP_CATS[it.cat][1]}</small><br>${k ? `👤 ${UI.esc(People.full(k))} · ${UI.esc(People.title(k))}<br>` : ''}${owner ? `🏳️ ${UI.esc(owner)}${v && owner !== v.name ? ` · ${UI.esc(v.name)}` : ''}<br>` : ''}`;
  },
  side() {
    const off = this.off(), px = P.x / TILE, py = P.y / TILE, fog = typeof Fog !== 'undefined' && Fog.on();
    const counts = {}; for (const it of this.list()) counts[it.cat] = (counts[it.cat] || 0) + 1;
    const chips = Object.entries(MAP_CATS).map(([k, [ic, nm, col]]) => `<button class="mp-chip ${off[k] ? 'off' : ''}" data-mv="mpf:${k}" style="--c:${col}"><span>${ic}</span>${nm}<em>${counts[k] || 0}</em></button>`).join('');
    const near = this.list().filter(it => ['shop', 'faith', 'travel', 'power'].includes(it.cat) && (!fog || Fog.seen(it.x, it.y))).map(it => ({ it, d: U.dist(px, py, it.x, it.y) })).sort((a, b) => a.d - b.d).slice(0, 8);
    return `<div class="mv-sec mp-sec"><h4>🗺️ O que mostrar</h4><div class="mp-chips">${chips}</div></div>
      <div class="mv-sec"><h4>📍 Perto de você</h4>${near.map(({ it }) => `<div class="mv-row" data-goto="${it.x},${it.y}" data-name="${UI.esc(this.name(it.s))}"><span class="mp-ic" style="--c:${MAP_CATS[it.cat][2]}">${this.icon(it.s)}</span>
        <div class="t"><b>${UI.esc(this.name(it.s))}</b><small>${MAP_CATS[it.cat][1]} · ${MapView.distText(it.x, it.y)}</small></div><button class="pinbtn" title="Marcar como destino">${icon('pin')}</button></div>`).join('') || '<small class="muted">Nada por perto.</small>'}</div>`;
  },
};

{
  // a lateral: filtros e "perto de você" no alto
  const rs0 = MapView.renderSide.bind(MapView);
  MapView.renderSide = function (...a) { const r = rs0(...a); if (this.side) { const ping = this.side.querySelector('.mv-sec'); const html = MapPlus.side(); if (ping && /Destino atual/.test(ping.textContent)) ping.insertAdjacentHTML('afterend', html); else this.side.insertAdjacentHTML('afterbegin', html); } return r; };
  // ligar e desligar uma categoria
  const tl0 = MapView.tool.bind(MapView);
  MapView.tool = function (a) { if (typeof a === 'string' && a.startsWith('mpf:')) { const k = a.slice(4), off = MapPlus.off(); off[k] = !off[k]; this.renderSide(); return; } return tl0(a); };
  // a dica: o que é, quem cuida e de quem é
  const ut0 = MapView.updateTip.bind(MapView);
  MapView.updateTip = function (...a) {
    const r = ut0(...a), h = this.hover; if (!h || this.tip.style.display === 'none') return r;
    const tx = this.ox + h.mx / this.z, ty = this.oy + h.my / this.z;
    if (this.z < 2.2) return r;
    const it = MapPlus.at(tx, ty, Math.max(1.2, 9 / this.z)); if (!it || (typeof Fog !== 'undefined' && Fog.on() && !Fog.seen(it.x, it.y))) return r;
    this.tip.insertAdjacentHTML('afterbegin', `<div class="mp-tip">${MapPlus.info(it)}</div>`);
    return r;
  };
}
