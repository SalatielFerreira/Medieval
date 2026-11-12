'use strict';
// Muro e portão na Infraestrutura (junto da estrada) e de graça: o Muro de Pedra, a Paliçada e o Portão não custam
// material (o portão continua só para quem governa a vila ou entre os seus próprios muros).
for (const k of ['wall_stone', 'wall_wood']) if (BUILDINGS[k]) { BUILDINGS[k].cost = {}; BUILDINGS[k].desc = BUILDINGS[k].desc.replace(/\s*\(\d+ [^)]*por trecho\)/, ' (de graça)'); }
if (CIVIC.vgate) CIVIC.vgate.cost = {};
if (CIVIC.vwall) CIVIC.vwall.cost = {};
UI.expCats = UI.expCats || {};
UI.expCats.infra = [...new Set([...(UI.expCats.infra || []), 'wall_stone', 'wall_wood', 'c:vgate'])];
// fora das Obras nas vilas e da Defesa (para não aparecerem repetidos)
if (typeof BR !== 'undefined') { for (const k of ['wall_stone', 'wall_wood', 'c:vgate']) if (!BR.DUP.includes(k)) BR.DUP.push(k); if (Array.isArray(BR.DEF)) BR.DEF = BR.DEF.filter(k => !['wall_stone', 'wall_wood'].includes(k)); }
{
  // o portão: liberado sem material (só falta governar a vila ou ter muro seu)
  const in0 = Urban.info.bind(Urban);
  Urban.info = function (k) { const r = in0(k); if (r && k === 'c:vgate') { r.cost = {}; r.sub = '1×1 · entre muros · de graça'; } return r; };
}
// na Infraestrutura: um grupo próprio, entre as estradas e as ferramentas
if (typeof BR_CLASSES !== 'undefined' && BR_CLASSES.infra && !BR_CLASSES.infra.some(c => c[0] === 'muros')) {
  const i = BR_CLASSES.infra.findIndex(c => c[0] === 'ferr');
  BR_CLASSES.infra.splice(i < 0 ? BR_CLASSES.infra.length : i, 0, ['muros', '🧱', 'Muros e portão', ['wall_stone', 'wall_wood', 'c:vgate']]);
}
