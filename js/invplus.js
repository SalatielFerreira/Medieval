'use strict';
// Inventário: o anel (espaço novo embaixo das botas), o balão com o nome do item ao parar o mouse em cima e a limpeza
// de itens que saíram do jogo (jogos salvos antigos com Dados de Osso, por exemplo).
//  • 💍 Anel de Prata: 5% mais barato nas lojas.
//  • 💍 Anel de Ouro: +1 de fama por mês e mais charme (as pessoas gostam 25% mais do que você faz por elas).
//  • 💎 Anel de Gema: +3 de defesa.
const RINGS = {
  silver_ring: 'Equipado: 5% mais barato nas lojas',
  gold_ring: 'Equipado: +1 de fama por mês e mais charme',
  gem_ring: 'Equipado: +3 de defesa',
};
for (const k in RINGS) if (ITEMS[k]) { ITEMS[k].slot = 'ring'; ITEMS[k].ringFx = RINGS[k]; }

// a janela Criação saiu: as ferramentas e armas que se faziam com as mãos agora se fazem na Bancada
for (const r of RECIPES) if (!r.station) r.station = 'bancada';
if (BUILDINGS.workbench) BUILDINGS.workbench.desc = 'Ferramentas e armas simples (machado, picareta, pá, enxada, vara de pesca, tocha, lança, faca, porrete e flechas), tecidos, roupas de linho e couro, machadinhas e barcos.';

const InvPlus = {
  ring() { return P.equip && P.equip.ring; },
  // tira dos lugares do herói os itens que não existem mais
  clean() {
    const gone = k => !ITEMS[Inv.baseOf(k)];
    for (const k of Object.keys(P.inv || {})) if (gone(k)) delete P.inv[k];
    if (P.stacks) for (const k of Object.keys(P.stacks)) if (gone(k)) delete P.stacks[k];
    if (P.quick) P.quick = P.quick.map(k => k && gone(k) ? null : k);
    if (P.equip) for (const s in P.equip) if (P.equip[s] && gone(P.equip[s])) P.equip[s] = null;
    if (P.bag) P.bag = P.bag.map(k => k && gone(k) ? null : k);
    for (const b of Object.values(G.storage || {})) if (b && typeof b === 'object') for (const k of Object.keys(b)) if (!ITEMS[k]) delete b[k];
  },
  // ---------------------------------------------------------------- balão do nome
  tip: null,
  initTip() {
    const el = document.createElement('div'); el.className = 'itip hidden'; document.body.appendChild(el); this.tip = el;
    let cur = null;
    const hide = () => { cur = null; el.classList.add('hidden'); };
    document.addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t || document.body.classList.contains('dragging')) { if (cur) hide(); return; }
      if (t !== cur) { cur = t; el.textContent = t.dataset.tip; el.classList.remove('hidden'); }
      const w = el.offsetWidth, h = el.offsetHeight;
      el.style.left = Math.min(innerWidth - w - 6, e.clientX + 14) + 'px';
      el.style.top = Math.max(6, e.clientY - h - 10) + 'px';
    }, { passive: true });
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('pointerleave', hide);
  },
};

{
  // anel de prata: compras mais baratas
  const pf0 = Game.priceFor.bind(Game);
  Game.priceFor = function (ci, k, owner) { const r = pf0(ci, k, owner); if (InvPlus.ring() === 'silver_ring') r.buy = Math.max(1, Math.round(r.buy * 0.95)); return r; };
  // anel de gema: defesa
  const pd0 = Game.pDef.bind(Game);
  Game.pDef = function () { return pd0() + (InvPlus.ring() === 'gem_ring' ? 3 : 0); };
  // anel de ouro: charme (o carinho que você ganha cresce) e fama todo mês
  const aa0 = People.addAff.bind(People);
  People.addAff = function (p, n) { return aa0(p, n > 0 && InvPlus.ring() === 'gold_ring' ? n * 1.25 : n); };
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); if (InvPlus.ring() === 'gold_ring') Court.addFame(1); };
  // a ficha do anel diz o que ele faz
  const id0 = UI.itemDesc.bind(UI);
  UI.itemDesc = function (it) { const d = id0(it); return it && it.ringFx ? (d ? d + ' · ' : '') + it.ringFx : d; };
  // jogo salvo com itens que saíram do jogo
  const ld0 = Game.load.bind(Game);
  Game.load = async function (...a) { const r = await ld0(...a); try { if (G.state === 'play') InvPlus.clean(); } catch (e) { console.error(e); } return r; };
  InvPlus.initTip();
}
