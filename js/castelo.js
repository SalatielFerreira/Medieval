'use strict';
// A janela do Castelo de outro reino, reorganizada (as ações e as regras são as mesmas): no alto o brasão, a bandeira,
// o lema e o soberano com a personalidade dele; embaixo três colunas — os números do reino, o que você pode fazer ali
// (cada ação com uma frase dizendo para que serve) e a corte com os títulos de nobreza.
if (!WIDE_PANELS.includes('showCastle')) WIDE_PANELS.push('showCastle');
const CASTLE_ACTS = {
  bank: ['🏦', 'O banco do reino', 'Conta, aplicações, empréstimos e expedições.'],
  tribute: ['🎁', 'Oferecer tributo', 'Um presente em ouro ao soberano: a relação com o reino sobe.'],
  claim: ['📜', 'Reivindicar o trono', 'Com relação 75 ou mais, o soberano pode passar a coroa a você, sem guerra.'],
  war: ['⚔️', 'Mensageiro de guerra', 'Declarar guerra ou mandar um ultimato em ouro.'],
  peace: ['🕊️', 'Mensageiro de paz', 'Oferecer ouro para acabar com a guerra.'],
};
{
  const sc0 = UI.showCastle.bind(UI);
  UI.showCastle = function (ci, ...rest) {
    const r = sc0(ci, ...rest);
    try {
      const pb = this.panel && this.panel.querySelector('.pb'); if (!pb || pb.querySelector('.cs3')) return r;
      const c = G.civs[ci], col = Game.civColor(ci), esc = this.esc.bind(this);
      const persona = pb.querySelector('.card.persona'), herald = pb.querySelector('.castle-herald'), stats = pb.querySelector(':scope > .stats'), btns = pb.querySelector(':scope > .btns');
      const court = pb.querySelector('.court-card'), rest2 = [...pb.querySelectorAll(':scope > .card')].filter(x => x !== persona && x !== court);
      const arms = herald ? herald.querySelector('svg.harms') : null, flag = herald ? herald.querySelector('svg.hflag') : null, motto = herald ? herald.querySelector('p') : null;
      const pTitle = persona ? persona.querySelector('.sec') : null, pDesc = persona ? persona.querySelector('.dt-desc') : null, pLaws = persona ? persona.querySelector('.persona-laws') : null;
      const tiles = stats ? [...stats.children].map(d => `<div class="cs3-tile">${d.innerHTML}</div>`).join('') : '';
      const acts = btns ? [...btns.querySelectorAll('button')].map(b => { const k = b.dataset.act, A = CASTLE_ACTS[k] || ['•', b.textContent.trim(), ''];
        b.classList.add('cs3-btn'); const cost = (b.textContent.match(/(\d[\d.]*)\s*(?:🪙|$)/) || b.textContent.match(/—\s*(\d[\d.]*)/) || [])[1];
        b.innerHTML = { bank: '🏦 Abrir o banco', tribute: `🎁 Dar ${cost || 100} 🪙`, claim: `📜 Reivindicar — ${cost || 1500} 🪙`, war: '📜 Enviar o mensageiro', peace: '🕊️ Enviar o mensageiro' }[k] || b.innerHTML; return `<div class="cs3-act ${b.disabled ? 'off' : ''} ${k === 'war' ? 'war' : ''}"><span class="cs3-ai">${A[0]}</span><div><b>${esc(A[1])}</b><small>${esc(A[2])}</small></div>${b.outerHTML}</div>`; }).join('') : '';
      const rel = Math.round(c.relation || 0), relCls = rel >= 40 ? 'ok' : rel <= -30 ? 'bad' : '';
      const html = `<div class="cs3" style="--c:${col}">
        <div class="cs3-hero"><div class="cs3-arms">${arms ? arms.outerHTML : ''}${flag ? flag.outerHTML : ''}</div>
          <div class="cs3-name"><small>${esc(CIV_DEFS[ci].name)}</small><h3>Castelo de ${esc(CIV_DEFS[ci].short)}</h3>${motto ? `<i>${motto.textContent}</i>` : ''}</div>
          <div class="cs3-ruler"><small>Soberano · personalidade do rei</small><b>${pTitle ? esc(pTitle.childNodes[0] ? pTitle.childNodes[0].textContent.trim() : pTitle.textContent) : esc(c.rulerName)}</b>${pDesc ? `<i>${pDesc.innerHTML}</i>` : ''}${pLaws ? `<div class="cs3-laws">${pLaws.innerHTML}</div>` : ''}</div>
          <div class="cs3-rel ${relCls}"><small>Relação</small><b>${rel}</b><i>${c.atWar ? '⚔️ em guerra' : '🕊️ em paz'}</i></div></div>
        <div class="cs3-cols">
          <section class="card cs3-c"><div class="sec">📊 O reino</div><div class="cs3-tiles">${tiles}</div></section>
          <section class="card cs3-c"><div class="sec">🎯 O que você pode fazer aqui</div>${acts}</section>
          <section class="card cs3-c cs3-court">${court ? court.innerHTML : ''}${rest2.map(x => `<div class="cs3-more">${x.innerHTML}</div>`).join('')}</section>
        </div></div>`;
      pb.innerHTML = html;
    } catch (e) { console.error(e); }
    return r;
  };
}
