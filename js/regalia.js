'use strict';
// Peças de leilão: o que se arremata no leilão aparece no herói com a forma de verdade — a Coroa de Cristal é uma coroa de
// cristais (não um elmo), o Elmo de Dragão tem chifres e espinhos, a Cota de Mithril brilha com runas, o Escudo de Dragão
// leva o brasão dourado, as armas raras deixam um brilho na lâmina. Quem veste alguma delas tem um cintilar em volta.
// Na mochila, essas peças ganham a moldura dourada de "Peça de leilão".
const REGALIA = {
  crystal_crown: { glow: '#9ef0ff' },
  dragon_helm:   { glow: '#ff7a4a' },
  mithril_mail:  { glow: '#c8f4ff' },
  dragon_shield: { glow: '#ffcf4a' },
  mithril_sword: { glow: '#9fe8ff', blade: true },
  royal_sword:   { glow: '#ffe28a', blade: true },
  storm_staff:   { glow: '#a89cff', blade: true },
  elven_bow:     { glow: '#c8ffb0', blade: true },
};
const Regalia = {
  is(k) { return !!REGALIA[k] || (typeof Commerce !== 'undefined' && Commerce.AUCTION_POOL.includes(k)); },
  // o que o herói veste agora, em ordem (vira parte da chave da figura guardada)
  worn() { return Object.values(P.equip || {}).filter(k => k && REGALIA[k]); },
};

{
  // a aparência do herói: a coroa de cristal substitui o elmo e a coroa de ouro
  const pl0 = playerLook;
  // eslint-disable-next-line no-global-assign
  playerLook = function () {
    const o = pl0(), w = Regalia.worn();
    if (!w.length) return o;
    o.regalia = w.join(',');
    if (P.equip.head === 'crystal_crown') { o.helmet = null; o.cap = null; o.crown = false; }
    const wep = P.equip.weapon; if (REGALIA[wep] && REGALIA[wep].blade) o.wglow = REGALIA[wep].glow;
    o.glow = REGALIA[w[0]].glow;
    return o;
  };

  // por cima do corpo (entra na figura guardada): coroa de cristal, chifres do elmo, runas da cota, brasão do escudo
  const hb0 = humanBody;
  // eslint-disable-next-line no-global-assign
  humanBody = function (ctx, o, dir, t) {
    hb0(ctx, o, dir, t);
    if (!o.regalia) return;
    const has = k => o.regalia.indexOf(k) >= 0, bob = o.moving ? -Math.abs(Math.sin(t * 12)) * 1.1 : Math.sin(t * 2.2) * 0.3;
    ctx.save(); ctx.scale(dir, 1);
    if (has('mithril_mail') && o.armor) {
      ctx.globalAlpha = 0.85;
      limb(ctx, -3.6, -21.6, -3.6, -15, 0.45, '#effcff'); limb(ctx, -3.6, -18.4, -1.6, -20.2, 0.45, '#effcff');
      limb(ctx, 2.6, -21, 4, -16, 0.45, '#effcff'); limb(ctx, 2.2, -18, 4.4, -18, 0.45, '#effcff');
      ctx.globalAlpha = 1; ell(ctx, 0.4, -19, 1.1, 1.1, '#bff3ff'); ell(ctx, 0.4, -19, 0.5, 0.5, '#ffffff');
    }
    if (has('dragon_shield') && o.shield) {
      if (o.shieldUp) {
        poly(ctx, [7, -23.6, 10.8, -23.6, 11.4, -20.6, 8.9, -15.6, 6.4, -20.6], '#e8b923');
        ell(ctx, 8.9, -21.2, 0.7, 0.7, '#b0302a'); limb(ctx, 7.4, -19, 10.4, -19, 0.5, '#7a1e14');
      } else {
        poly(ctx, [-10.4, -20.6 + bob, -8.6, -20.6 + bob, -8.2, -17 + bob, -9.4, -13 + bob, -10.4, -17 + bob], '#e8b923');
        ell(ctx, -9.4, -18.4 + bob, 0.5, 0.5, '#7a1e14');
      }
    }
    if (has('dragon_helm') && o.helmet) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#efe4c8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, -35.6); ctx.quadraticCurveTo(-10, -37, -9.4, -43); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4.4, -36.2); ctx.quadraticCurveTo(8.4, -38, 7.6, -43.4); ctx.stroke();
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(-5.4, -35.4); ctx.quadraticCurveTo(-9.6, -36.8, -9.2, -42); ctx.stroke();
      for (const [x, h] of [[-2.6, 2.6], [-0.4, 3.4], [1.8, 2.6]]) poly(ctx, [x - 0.8, -37.2, x, -37.2 - h, x + 0.8, -37.2], '#7a1e14');
      ell(ctx, 3.8, -33.2, 0.9, 0.5, '#ffd84a'); ell(ctx, 3.8, -33.2, 0.4, 0.3, '#fff6c0');
    }
    if (has('crystal_crown')) {
      ctx.fillStyle = '#5ab6cf'; ctx.fillRect(-5.4, -36.8, 10.8, 2.2);
      ctx.fillStyle = '#c8f6ff'; ctx.fillRect(-5.4, -36.8, 10.8, 0.7);
      // cinco cristais de alturas diferentes, com a face clara e a escura
      for (const [x, h, w] of [[-4.4, 4, 1.1], [-2.2, 5.6, 1.2], [0, 7.4, 1.4], [2.2, 5.6, 1.2], [4.4, 4, 1.1]]) {
        poly(ctx, [x - w, -36.6, x, -36.6 - h, x + w, -36.6], '#7fd8ee');
        poly(ctx, [x, -36.6, x, -36.6 - h, x + w, -36.6], '#3e9ab8');
        limb(ctx, x - w * 0.45, -37, x - 0.15, -36.4 - h * 0.85, 0.35, '#f2feff');
      }
      ell(ctx, 0, -35.7, 0.8, 0.8, '#e6fbff'); ell(ctx, -3.3, -35.7, 0.5, 0.5, '#b8f0ff'); ell(ctx, 3.3, -35.7, 0.5, 0.5, '#b8f0ff');
    }
    ctx.restore();
  };

  // ao vivo (não entra na figura guardada): brilho na lâmina e o cintilar em volta de quem veste peças de leilão
  const dh0 = drawHuman;
  // eslint-disable-next-line no-global-assign
  drawHuman = function (ctx, x, y, o) {
    dh0(ctx, x, y, o);
    if (!o.regalia) return;
    const s = o.scale || 1, dir = o.dir < 0 ? -1 : 1, now = (typeof G !== 'undefined' && G.realTime) || performance.now() / 1000;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(s, s);
    const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
    if (o.wglow && o.weapon && !o.rod && !o.tool) {
      const bob = o.moving ? -Math.abs(Math.sin((o.anim || 0) * 12)) * 1.1 : 0;
      const ang = o.swing > 0 ? o.aim - 1.3 + (1 - o.swing / 0.25) * 2.6 : (dir > 0 ? 0.9 : Math.PI - 0.9), len = o.wlen || 8;
      ctx.save(); ctx.translate(dir * 6.6, -15 + bob); ctx.rotate(ang);
      ctx.globalAlpha = 0.28 + Math.sin(now * 5) * 0.1; limb(ctx, 7, 0, 7 + len, 0, 3.4, o.wglow);
      ctx.globalAlpha = 0.5; limb(ctx, 7, 0, 7 + len, 0, 1.1, '#ffffff');
      ctx.restore();
    }
    // três faíscas girando devagar em volta do corpo
    for (let k = 0; k < 3; k++) {
      const a = now * 1.3 + k * 2.09, tw = (Math.sin(now * 4 + k * 1.7) + 1) / 2;
      const px = Math.cos(a) * 11, py = -20 + Math.sin(a * 1.4) * 13;
      ctx.globalAlpha = 0.25 + tw * 0.55;
      ctx.fillStyle = o.glow; ctx.fillRect(px - 0.4, py - 1.6, 0.8, 3.2); ctx.fillRect(px - 1.6, py - 0.4, 3.2, 0.8);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = op;
    ctx.restore();
  };

  // mochila: moldura dourada e o selo "Peça de leilão"
  const ii0 = UI.ii.bind(UI);
  UI.ii = function (x) {
    const h = ii0(x); if (!x) return h;
    if (!this._itemKey) this._itemKey = new Map(Object.entries(ITEMS).map(([k, v]) => [v, k]));
    const k = typeof x === 'string' ? x : this._itemKey.get(x);
    return k && Regalia.is(k) ? `<i class="ii-legend" title="✨ Peça de leilão">${h}</i>` : h;
  };
  for (const k of Object.keys(ITEMS)) if (Regalia.is(k) && ITEMS[k].desc !== undefined && ITEMS[k].desc.indexOf('Peça de leilão') < 0) ITEMS[k].desc = '✨ Peça de leilão. ' + ITEMS[k].desc;
}
