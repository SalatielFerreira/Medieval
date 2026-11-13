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

// janela aberta cobrindo a tela inteira (as principais no computador; todas no celular): o mundo por baixo não é
// desenhado — o jogo continua andando, só não pinta o que ninguém vê. Assim a troca de janelas fica com o quadro livre.
{
  const cover = () => {
    const pn = UI.panel; if (!UI.cur || !pn || pn.classList.contains('hidden')) { UI._cover = false; return; }
    const r = pn.getBoundingClientRect(); UI._cover = r.left <= 1 && r.top <= 1 && r.right >= window.innerWidth - 1 && r.bottom >= window.innerHeight - 1;
  };
  // (a medida é tirada no quadro seguinte, junto com o desenho: medir logo ao abrir forçava o navegador a montar a
  // página antes da hora, e as janelas ainda mexem em si mesmas depois de abertas)
  let dirty = true;
  const op0 = UI.open.bind(UI);
  UI.open = function (...a) { dirty = true; return op0(...a); };
  const cl0 = UI.close.bind(UI);
  UI.close = function (...a) { UI._cover = false; dirty = true; return cl0(...a); };
  window.addEventListener('resize', () => { dirty = true; });
  const rd0 = Game.render.bind(Game);
  Game.render = function (...a) {
    if (dirty) { dirty = false; try { cover(); } catch (e) { UI._cover = false; } }
    const hide = UI._cover && UI.cur && UI.panel && !UI.panel.classList.contains('hidden');
    if (hide && this._coverDrawn) return;
    const r = rd0(...a); this._coverDrawn = !!hide; return r;
  };
}

// o responsável de cada loja: um índice loja → pessoa (refeito a cada meio segundo) no lugar de percorrer o povo todo
// a cada pergunta; o índice só é usado se a pessoa ainda for mesmo da loja (senão procura como antes)
{
  let idx = null, at = -1, pp = null;
  const k0 = Shops.keeper.bind(Shops);
  Shops.keeper = function (s) {
    if (!s) return null;
    const now = performance.now();
    if (!idx || pp !== G.people || now - at > 500) { idx = new Map(); for (const p of G.people) if (p.alive && p.shop && !p.capanga && !idx.has(p.shop)) idx.set(p.shop, p); at = now; pp = G.people; }
    const c = idx.get(s.okey);
    if (c && c.alive && c.shop === s.okey && !c.capanga) return c;
    const r = k0(s); if (r) idx.set(s.okey, r); else idx.delete(s.okey); return r;
  };
}

// listas pedidas a cada quadro: guardadas por meio segundo
{
  const fl0 = Favorites.list.bind(Favorites);
  Favorites.list = function () { if (this._L2 && this._pp2 === G.people && G.realTime - this._t2 < 0.5) return this._L2; this._t2 = G.realTime; this._pp2 = G.people; return (this._L2 = fl0()); };
  if (typeof Gate !== 'undefined') { let L = null, at = -1, n = -1; const gl0 = Gate.list.bind(Gate); Gate.list = function () { if (L && n === World.structs.length && G.realTime - at < 0.5) return L; at = G.realTime; n = World.structs.length; return (L = gl0()); }; }
  if (typeof Content !== 'undefined' && Content.mine) { const M = new Map(); const cm0 = Content.mine.bind(Content); Content.mine = function (type) { const c = M.get(type); if (c && c.n === World.structs.length && G.realTime - c.t < 0.5) return c.L; const L = cm0(type); M.set(type, { L, n: World.structs.length, t: G.realTime }); return L; }; }
}

// a fumaça das chaminés: só a que aparece na tela, e cada baforada é um desenho pronto (um círculo macio) copiado com a
// transparência dela — antes cada uma montava a cor em texto e desenhava um círculo novo, até as fora da tela
if (typeof Ambience !== 'undefined' && Ambience.drawSmoke) {
  let puff = null;
  const sprite = () => { if (puff) return puff; puff = document.createElement('canvas'); puff.width = puff.height = 32; const g = puff.getContext('2d'); g.fillStyle = 'rgb(215,215,220)'; g.beginPath(); g.arc(16, 16, 16, 0, Math.PI * 2); g.fill(); return puff; };
  Ambience.drawSmoke = function (ctx, cx, cy) {
    if (!this.smoke || !this.smoke.length) return;
    const z = Game.zoom || 1, cw = Game.canvas.width / z, ch = Game.canvas.height / z, im = sprite(), a0 = ctx.globalAlpha;
    for (const p of this.smoke) {
      const x = p.x - cx, y = p.y - cy, r = p.size; if (x < -r || y < -r || x > cw + r || y > ch + r) continue;
      ctx.globalAlpha = a0 * 0.28 * p.life; ctx.drawImage(im, x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = a0;
  };
}
