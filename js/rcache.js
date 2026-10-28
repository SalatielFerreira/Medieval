'use strict';
// Construções desenhadas uma vez e copiadas depois. Antes, cada prédio na tela era refeito forma por forma 60 vezes por
// segundo (o maior gasto do jogo depois das pessoas). Agora cada um vira uma figura pronta, na resolução da tela:
// - os prédios parados são copiados (e refeitos a cada 2 segundos, para mudanças como portão fechado, obra andando ou
//   dano aparecerem logo);
// - os animados (fogo, fumaça, pás do moinho, bandeiras, água) são descobertos sozinhos — desenhando duas vezes em
//   momentos diferentes e comparando — e são refeitos 10 vezes por segundo (animação suave, 6 vezes menos trabalho);
// - prévias de construção (meio transparentes) e qualquer coisa que não seja um prédio do mundo são desenhadas ao vivo.
const RCACHE_PAD = { l: 64, r: 64, t: 128, b: 48 }; // folga: telhados, torres e bandeiras passam do quadrado do prédio
const RCACHE_TTL = 2;                               // segundos até refazer a figura de um prédio parado
const RCACHE_ANIM = 0.1;                            // e a de um prédio animado (10 vezes por segundo)
const RCache = {
  map: new WeakMap(),   // prédio → { key, cv, res, born } ou { live: true, key }
  on: true,
  stats: { hit: 0, draw: 0, live: 0 },
  res(ctx) { const tf = ctx.getTransform(); return Math.max(1, Math.min(4, Math.round(Math.hypot(tf.a, tf.b) * 2) / 2)); },
  // o que, se mudar, pede uma figura nova na hora
  key(s, res) { return [res, s.type, s.w, s.h, s.x, s.y, s.owner, s.progress, s.ruined, s.ruin, s.gateClosed, s.gateBroken, s.blocks, s.level, s.lv, G.season, World.season].join('|'); },
  render(draw, s, w, h, res, time) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(res, res);
    draw(g, s, RCACHE_PAD.l, RCACHE_PAD.t, time);
    return cv;
  },
  same(a, b) {
    const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3]) > 6) return false;
    return true;
  },
  wrap(draw) {
    return (ctx, s, X, Y, time) => {
      // só prédios de verdade do mundo, desenhados opacos e fora das salas
      if (!this.on || !s || s.id === undefined || World.structs[s.id] !== s || ctx.globalAlpha !== 1 || G.place || G.dungeon) return draw(ctx, s, X, Y, time);
      const res = this.res(ctx), key = this.key(s, res), now = G.realTime || 0;
      let c = this.map.get(s);
      const ttl = c && c.live ? RCACHE_ANIM : RCACHE_TTL;
      if (!c || c.key !== key || now - c.born > ttl) {
        const w = s.w * TILE + RCACHE_PAD.l + RCACHE_PAD.r, h = s.h * TILE + RCACHE_PAD.t + RCACHE_PAD.b;
        const a = this.render(draw, s, w, h, res, time);
        // primeira vez com esta aparência: confere se o desenho muda com o tempo
        if (!c || c.key !== key) {
          const b = this.render(draw, s, w, h, res, time + 0.37);
          c = { key, cv: a, res, born: now, live: !this.same(a, b) }; this.map.set(s, c); this.stats.draw++;
        } else { c = { key, cv: a, res, born: now, live: c.live }; this.map.set(s, c); if (c.live) this.stats.live++; else this.stats.draw++; }
      } else this.stats.hit++;
      ctx.drawImage(c.cv, Math.round(X) - RCACHE_PAD.l, Math.round(Y) - RCACHE_PAD.t, c.cv.width / c.res, c.cv.height / c.res);
    };
  },
};
World.drawStruct = RCache.wrap(World.drawStruct.bind(World));

// ---------------------------------------------------------------- cavalos: os quadros do passo ficam prontos
// O desenho do cavalo só depende da cor, do lado, da carroça e da fase do passo: 16 quadros no galope (o ciclo inteiro das
// patas, da cauda e da cabeça) e 12 parado, guardados na resolução da tela.
{
  const HC = new Map(), BOX = { l: 64, r: 44, t: 60, b: 14 }, TAU = Math.PI * 2;
  const dh0 = drawHorse;
  // eslint-disable-next-line no-global-assign
  drawHorse = function (ctx, x, y, dir, anim, moving, col, cart) {
    if (!RCache.on || ctx.globalAlpha !== 1) return dh0(ctx, x, y, dir, anim, moving, col, cart);
    const per = moving ? TAU / 3 : TAU * 2, n = moving ? 16 : 12;
    const f = ((Math.floor((anim || 0) / per * n) % n) + n) % n, a = (f + 0.5) / n * per;
    const res = RCache.res(ctx), d = dir < 0 ? -1 : 1, key = [res, d, f, moving ? 1 : 0, col, cart ? 1 : 0].join('|');
    let cv = HC.get(key);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = Math.ceil((BOX.l + BOX.r) * res); cv.height = Math.ceil((BOX.t + BOX.b) * res);
      const g = cv.getContext('2d'); g.scale(res, res);
      // o desenho original vira o lado sozinho: aqui o ponto de apoio fica no meio, com folga para a carroça atrás
      dh0(g, d > 0 ? BOX.l : BOX.r, BOX.t, d, a, moving, col, cart);
      if (HC.size > 600) HC.delete(HC.keys().next().value);
      HC.set(key, cv);
    }
    ctx.drawImage(cv, Math.round(x) - (d > 0 ? BOX.l : BOX.r), Math.round(y) - BOX.t, cv.width / res, cv.height / res);
  };
}

