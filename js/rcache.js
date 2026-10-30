'use strict';
// Construções desenhadas uma vez e copiadas depois. Antes, cada prédio na tela era refeito forma por forma 60 vezes por
// segundo (o maior gasto do jogo depois das pessoas). Agora cada um vira uma figura pronta, na resolução da tela:
// - os prédios parados são copiados (e refeitos a cada 2 segundos, para mudanças como portão fechado, obra andando ou
//   dano aparecerem logo) — cada um no seu tempo (com um sorteio, para não vencerem todos juntos), só enquanto sobra
//   tempo no quadro e na mesma tela (sem criar outra): numa cidade cheia, era o que travava a tela de tempos em tempos;
// - cada figura é recortada no tamanho do que tem desenhado (a folga para telhados e bandeiras é quase toda vazia): um
//   trecho de muro é copiado como um quadradinho, não como uma imagem dez vezes maior;
// - toda construção é estática: é desenhada sempre no mesmo instante (fogo, fumaça, bandeiras, água, peixes e pássaros
//   dos prédios ficam parados), e por isso nenhuma precisa ser refeita o tempo todo;
// - prévias de construção (meio transparentes) e qualquer coisa que não seja um prédio do mundo são desenhadas ao vivo.
const RCACHE_PAD = { l: 64, r: 64, t: 128, b: 48 }; // folga: telhados, torres e bandeiras passam do quadrado do prédio
const RCACHE_TTL = 2;                               // segundos até refazer a figura de um prédio parado
const RCACHE_ANIM = 0.1;                            // (sem uso: as construções não se mexem mais)
const RCACHE_STILL = 0.5;                           // o instante em que toda construção é desenhada (fica parada nele)
const RCache = {
  map: new WeakMap(),   // prédio → { key, cv, res, born } ou { live: true, key }
  on: true,
  stats: { hit: 0, draw: 0, live: 0 },
  budget: { start: 0, used: 0, ms: 3 },   // tempo por quadro para refazer figuras que só envelheceram
  res(ctx) { const tf = ctx.getTransform(); return Math.max(1, Math.min(4, Math.round(Math.hypot(tf.a, tf.b) * 2) / 2)); },
  // o que, se mudar, pede uma figura nova na hora
  key(s, res) { return [res, s.type, s.w, s.h, s.x, s.y, s.owner, s.progress, s.ruined, s.ruin, s.gateClosed, s.gateBroken, s.blocks, s.level, s.lv, G.season, World.season].join('|'); },
  render(draw, s, w, h, res, time, into) {
    const W = Math.ceil(w * res), H = Math.ceil(h * res);
    const cv = into && into.width === W && into.height === H ? into : document.createElement('canvas');
    if (cv !== into) { cv.width = W; cv.height = H; }
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false; g.scale(res, res);
    draw(g, s, RCACHE_PAD.l, RCACHE_PAD.t, time);
    return cv;
  },
  same(a, b) {
    const da = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, db = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3]) > 6) return false;
    return true;
  },
  // o retângulo que tem desenho (nas duas figuras), com uma folga de 3 pontos
  box(a, b) {
    const W = a.width, H = a.height, da = a.getContext('2d').getImageData(0, 0, W, H).data, db = b.getContext('2d').getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0, i = y * W * 4 + 3; x < W; x++, i += 4) if (da[i] || db[i]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { x: 0, y: 0, w: 1, h: 1 };
    x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(W - 1, x1 + 3); y1 = Math.min(H - 1, y1 + 3);
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  },
  // copia só o retângulo com desenho para a figura guardada (reaproveita a tela, se já for desse tamanho)
  crop(src, bx, into) {
    const cv = into && into.width === bx.w && into.height === bx.h ? into : document.createElement('canvas');
    if (cv !== into) { cv.width = bx.w; cv.height = bx.h; }
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, bx.w, bx.h); g.drawImage(src, bx.x, bx.y, bx.w, bx.h, 0, 0, bx.w, bx.h);
    return cv;
  },
  wrap(draw) {
    return (ctx, s, X, Y, time) => {
      // só prédios de verdade do mundo, desenhados opacos e fora das salas
      if (!this.on || !s || s.id === undefined || World.structs[s.id] !== s || ctx.globalAlpha !== 1 || G.place || G.dungeon) return draw(ctx, s, X, Y, time);
      time = RCACHE_STILL; // construção parada: sempre o mesmo instante
      const res = this.res(ctx), key = this.key(s, res), now = G.realTime || 0;
      let c = this.map.get(s);
      const ttl = c && c.live ? RCACHE_ANIM : (c && c.ttl) || RCACHE_TTL;
      const B = this.budget, t0 = performance.now();
      if (t0 - B.start > 8) { B.start = t0; B.used = 0; } // um quadro novo: o orçamento recomeça
      // aparência nova: na hora; figura que só envelheceu (ou animada): se sobrar tempo neste quadro
      if (!c || c.key !== key || (now - c.born > ttl && B.used < B.ms)) {
        const w = s.w * TILE + RCACHE_PAD.l + RCACHE_PAD.r, h = s.h * TILE + RCACHE_PAD.t + RCACHE_PAD.b;
        // primeira vez com esta aparência: confere se o desenho muda com o tempo
        if (!c || c.key !== key) {
          const a = this.render(draw, s, w, h, res, time), bx = this.box(a, a);
          c = { key, cv: this.crop(a, bx), bx, res, born: now, live: false, ttl: RCACHE_TTL + Math.random() * 2 }; this.map.set(s, c); this.stats.draw++;
        } else {
          // refaz numa tela de rascunho do tamanho inteiro e copia só o retângulo com desenho
          this.scratch = this.render(draw, s, w, h, res, time, this.scratch);
          c.cv = this.crop(this.scratch, c.bx, c.cv); c.born = now; if (c.live) this.stats.live++; else this.stats.draw++;
        }
        B.used += performance.now() - t0;
      } else this.stats.hit++;
      ctx.drawImage(c.cv, Math.round(X) - RCACHE_PAD.l + c.bx.x / c.res, Math.round(Y) - RCACHE_PAD.t + c.bx.y / c.res, c.cv.width / c.res, c.cv.height / c.res);
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

