'use strict';
// Dentro de um imóvel, no campo de batalha ou nas cavernas:
//  • o mapa não abre (os botões Mapa e Construir somem da barra e as setas das janelas pulam do Portfólio para o Diário);
//  • não se constrói nada (o Construir avisa e não abre o modo de obras).
const Lugares = {
  inside() { return !!(G.place || G.dungeon); },
  canMap() { return G.state === 'play' && !this.inside(); },
  why() { return G.dungeon ? 'nas cavernas' : G.place && G.place.kind === 'battle' ? 'no campo de batalha' : 'dentro de um imóvel'; },
  wins() { return MAIN_WINDOWS.filter(w => (w[0] !== 'showMap' && w[0] !== 'showBuild') || !this.inside()); },
  _tb: null,
  // o botão do mapa na barra aparece e some conforme o lugar
  syncBar() {
    const can = this.canMap(); if (can === this._tb) return; this._tb = can;
    for (const fn of ['showMap', 'showBuild']) { const b = document.querySelector(`#toolbar [data-tb="${fn}"]`); if (b) b.hidden = !can; } // (o Construir também some)
  },
};
{
  const sm0 = UI.showMap.bind(UI);
  UI.showMap = function (...a) { if (!Lugares.canMap()) { UI.msg(`🗺️ O mapa não abre ${Lugares.why()}.`, 'bad'); return; } return sm0(...a); };
  const tg0 = UI.toggle.bind(UI);
  UI.toggle = function (fn, ...a) { if (fn === 'showMap' && !Lugares.canMap()) { if (MapView.isOpen) MapView.hide(); UI.msg(`🗺️ O mapa não abre ${Lugares.why()}.`, 'bad'); return; } return tg0(fn, ...a); };
  // as setas das janelas principais: sem o mapa quando ele não abre
  UI.winNavHtml = function (fn, attr) {
    const L = Lugares.wins(), i = L.findIndex(w => w[0] === fn); if (i < 0) return '';
    const n = L.length, prev = L[(i - 1 + n) % n], next = L[(i + 1) % n], a = attr || 'data-act="wnav"';
    return `<div class="ph-nav"><button class="nav-arr" ${a} data-d="-1" title="${prev[1]}">${icon('chevL')}</button><button class="nav-arr" ${a} data-d="1" title="${next[1]}">${icon('chevR')}</button></div>`;
  };
  UI.wnav = function (d) {
    const L = Lugares.wins(), i = L.findIndex(w => this.cur && w[0] === this.cur.fn); if (i < 0) return;
    const fn = L[(i + d + L.length) % L.length][0];
    G.placing = null; Urban.stop(); this[fn](); Sound.play('ui');
  };
  // não se constrói dentro de um imóvel
  const cb0 = Game.canBuild.bind(Game);
  Game.canBuild = function (...a) { if (Lugares.inside()) return `Não dá para construir ${Lugares.why()}`; return cb0(...a); };
  const sp0 = Game.startPlacing.bind(Game);
  Game.startPlacing = function (k) { if (Lugares.inside()) { UI.msg(`🏗️ Não dá para construir ${Lugares.why()}. Saia primeiro.`, 'bad'); return; } return sp0(k); };
  const us0 = Urban.start.bind(Urban);
  Urban.start = function (mode) { if (Lugares.inside()) { UI.msg(`🏗️ Não dá para fazer obras ${Lugares.why()}. Saia primeiro.`, 'bad'); return; } return us0(mode); };
  const sb0 = UI.showBuild.bind(UI);
  UI.showBuild = function (...a) { if (Lugares.inside()) { UI.msg(`🏗️ Não dá para construir ${Lugares.why()}. Saia primeiro.`, 'bad'); if (this.cur && this.cur.fn === 'showBuild') this.close(); return; } return sb0(...a); };
  // a cada quadro: o botão do mapa (só quando muda de lugar)
  const rd0 = Game.render.bind(Game);
  Game.render = function (...a) { const r = rd0(...a); Lugares.syncBar(); return r; };
}
