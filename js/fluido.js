'use strict';
// Andar sem engasgos: ao chegar perto de uma vila, umas vinte pessoas aparecem de uma vez e cada uma monta a própria
// figura no primeiro desenho — tudo no mesmo quadro (30 ms ou mais). Agora no máximo 5 pessoas novas montam a figura
// por quadro; as outras aparecem nos quadros seguintes (em um pedaço de segundo todas estão lá).
const Fluido = { frame: 0, fresh: 0, MAX: 3 };
{
  const rd0 = Game.render.bind(Game);
  Game.render = function (...a) { Fluido.frame++; Fluido.fresh = 0; return rd0(...a); };
  const cd0 = Creature.prototype.draw;
  Creature.prototype.draw = function (ctx, cx, cy) {
    if (!this._drawn) { if (Fluido.fresh >= Fluido.MAX) return; Fluido.fresh++; this._drawn = true; }
    return cd0.call(this, ctx, cx, cy);
  };
}

// As etiquetas sobre as pessoas (nome · idade e o título) eram escritas letra por letra a cada quadro — numa vila cheia,
// mais de 10 ms só de texto. Agora cada etiqueta é desenhada uma vez e guardada pronta; nos quadros seguintes é copiada.
{
  const TAGS = new Map();
  const dg0 = Game.drawTag.bind(Game);
  Game.drawTag = function (ctx, e, cx, cy, d, z = 1) {
    let name, sub, col = '#d8c9a6';
    if (e.npc) {
      const p = e.npc, rel = People.relation(p);
      name = `${p.name} · ${p.age} ${p.age === 1 ? 'ano' : 'anos'}`;
      const foe = Court.enemyPerson(p), why = p.hit ? (p.hit.kind === 'hunter' ? 'CAÇADOR DE RECOMPENSA' : 'ASSASSINO') : p.band ? 'BANDIDO' : 'RANCOR';
      sub = People.title(p) + (p.hostile ? ' · ' + why : foe ? ' · INIMIGO' : rel.text !== 'Estranho' && rel.text !== 'Estranha' ? ' · ' + rel.text : '');
      col = p.hostile || foe ? '#ff5d5d' : rel.col;
    } else {
      if (!e.tmp) e.tmp = { name: U.pick(Math.random() < 0.8 ? NAMES_M : NAMES_F), age: U.rint(19, 45) };
      if (!CIV_DEFS[e.civ]) return dg0(ctx, e, cx, cy, d, z);
      name = `${e.tmp.name} · ${e.tmp.age} anos`; sub = 'Soldado de ' + CIV_DEFS[e.civ].short;
    }
    Game._lastTag = name + '|' + sub + '|'; // (o texto da última etiqueta: os testes conferem o que ela diz)
    const tf = ctx.getTransform(), s = Math.max(1, Math.min(4, Math.hypot(tf.a, tf.b))) * z, key = name + '|' + sub + '|' + col + '|' + s.toFixed(2);
    let c = TAGS.get(key);
    if (!c) {
      const m = document.createElement('canvas').getContext('2d');
      m.font = '600 11px "Segoe UI", sans-serif'; const w1 = m.measureText(name).width; m.font = '10px "Segoe UI", sans-serif';
      const w = Math.ceil(Math.max(w1, m.measureText(sub).width) + 12);
      c = document.createElement('canvas'); c.width = Math.ceil(w * s); c.height = Math.ceil(28 * s); c.w = w;
      const g = c.getContext('2d'); g.scale(s, s);
      g.fillStyle = 'rgba(14,10,6,0.78)'; g.beginPath(); g.roundRect(0, 0, w, 27, 5); g.fill();
      g.textAlign = 'center'; g.fillStyle = '#ffe9b0'; g.font = '600 11px "Segoe UI", sans-serif'; g.fillText(name, w / 2, 11);
      g.fillStyle = col; g.font = '10px "Segoe UI", sans-serif'; g.fillText(sub, w / 2, 22);
      if (TAGS.size > 400) TAGS.delete(TAGS.keys().next().value);
      TAGS.set(key, c);
    } else { TAGS.delete(key); TAGS.set(key, c); }
    const x = (e.x - cx) * z, y = (e.y - cy - (e.npc && e.npc.age < 14 ? 34 : 50)) * z;
    ctx.save(); ctx.globalAlpha = U.clamp(1.6 - d / (4 * TILE), 0.3, 1);
    ctx.drawImage(c, x - c.w / 2, y - 26, c.w, 28);
    ctx.restore();
  };
}

// A névoa por cima do minimapa: em vez de redimensionar o desenho da névoa a cada quadro (e reenviá-lo para a placa de
// vídeo cada vez que ela muda), uma cópia já no tamanho do minimapa, refeita no máximo a cada 1,5 s.
{
  let cache = null, ver = -1, at = -99, ns = 0;
  const rv0 = Fog.reveal.bind(Fog);
  Fog.reveal = function (...a) { const n = rv0(...a); if (n) ns++; return n; };
  const ini0 = Fog.init.bind(Fog);
  Fog.init = function (...a) { const r = ini0(...a); ns++; ver = -1; return r; };
  Fog.drawOver = function (g, x, y, w, h) {
    if (!this.on() || !this.cv) return;
    // no mapa grande, aproximado: só o pedaço da névoa que aparece na tela (uma cópia do tamanho do mundo em zoom
    // máximo passaria de 17 mil pixels de lado)
    if (w > 2048) {
      const sc = g.getTransform().a || 1, VW = g.canvas.width / sc, VH = g.canvas.height / sc, im = this.cv;
      const dx0 = Math.max(x, 0), dy0 = Math.max(y, 0), dx1 = Math.min(x + w, VW), dy1 = Math.min(y + h, VH);
      if (dx1 <= dx0 || dy1 <= dy0) return;
      const fx = im.width / w, fy = im.height / h;
      // (a origem vai até a borda da casa de névoa, para o degradê não "andar" ao arrastar)
      const sx0 = Math.floor((dx0 - x) * fx), sy0 = Math.floor((dy0 - y) * fy), sx1 = Math.min(im.width, Math.ceil((dx1 - x) * fx)), sy1 = Math.min(im.height, Math.ceil((dy1 - y) * fy));
      g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = 0.97;
      g.drawImage(im, sx0, sy0, sx1 - sx0, sy1 - sy0, x + sx0 / fx, y + sy0 / fy, (sx1 - sx0) / fx, (sy1 - sy0) / fy);
      g.restore(); return;
    }
    const s = Math.round(w), now = performance.now() / 1000;
    if (!cache || cache.width !== s || (ver !== ns && now - at > 1.5)) {
      if (!cache || cache.width !== s) { cache = document.createElement('canvas'); cache.width = cache.height = s; }
      const c = cache.getContext('2d'); c.clearRect(0, 0, s, s); c.imageSmoothingEnabled = true; c.drawImage(this.cv, 0, 0, s, s);
      ver = ns; at = now;
    }
    g.save(); g.globalAlpha = 0.97; g.drawImage(cache, x, y, w, h); g.restore();
  };
}

// os balões de humor: os desenhos dos ícones ficam prontos ao começar e ao carregar (o primeiro emoji de cada tipo
// custava um engasgo ao chegar perto da primeira vila)
{
  const warm = () => {
    try {
      const res = Math.max(1, Math.min(8, Math.round((G.settings && G.settings.zoom ? +G.settings.zoom : 1) * (window.devicePixelRatio || 1) * 2) / 2));
      for (const ic of ['⛓️', '🖤', '🤰', '💸', '😠', '😢', '😒', '😊', '💍', '🎉', '🍼', '⚰️', '💔', '📜']) for (const r of [res, 1, 1.5, 2]) News.bubbleImg(ic, r);
    } catch (e) { /* (sem balões ainda) */ }
  };
  for (const k of ['newGame', 'load']) { const f0 = Game[k].bind(Game); Game[k] = async function (...a) { const r = await f0(...a); if (G.state === 'play') warm(); return r; }; }
}

// ao salvar: quem falta para cuidar de um prédio é contratado antes (senão ele só aparecia ao carregar o jogo)
{
  const sv0 = Game.save.bind(Game);
  Game.save = function (...a) { try { if (G.state === 'play') { Shops.ensure(); Ports.ensureKeepers(); } } catch (e) { console.error(e); } return sv0(...a); };
}

// com o mapa do mundo aberto (ele cobre a tela inteira), o mundo por baixo não é desenhado: era um quadro inteiro do
// jogo, a cada quadro, por trás do mapa — o que deixava arrastar o mapa pesado
{
  const rd0 = Game.render.bind(Game);
  Game.render = function (...a) { if (typeof MapView !== 'undefined' && MapView.isOpen && this._mapDrawn) return; const r = rd0(...a); this._mapDrawn = typeof MapView !== 'undefined' && MapView.isOpen; return r; };
}
