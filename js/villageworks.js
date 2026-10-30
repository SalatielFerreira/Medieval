'use strict';
// Obras que fazem a vila enriquecer: cada uma rende algo todo mês — aluguéis e comércio (Salin), recursos para o
// reino (trigo, madeira, pedra, ferro), prosperidade (a vila sobe de nível), lugar para mais gente morar e a chance
// de atrair uma família nova. O governador da vila recebe o dinheiro; numa vila do seu reino (sem você de governador), vai
// para o tesouro. Nas vilas dos outros reinos, o rendimento fica com eles.

// rent = Salin por mês · stock = recursos por mês para o reino · pm = prosperidade por mês
// cap = moradores a mais · attract = chance por mês de uma família nova se mudar para a vila
const VWORKS = {
  vbakery:   { name: 'Padaria',              icon: '🥖', w: 2, h: 2, cost: { wood: 30, stone: 20 },               rent: 12, pm: 0.15, attract: 0.04, desc: 'Pão quentinho todo dia: o povo fica mais feliz.' },
  vmill:     { name: 'Moinho',               icon: '🌬️', w: 2, h: 2, cost: { wood: 40, stone: 20 },               stock: { wheat: 20 }, pm: 0.1, desc: 'Mói o trigo das plantações.' },
  vorchard:  { name: 'Pomar Comunitário',    icon: '🍎', w: 3, h: 2, cost: { wood: 15, dirt: 6 },                 stock: { wheat: 8 }, pm: 0.12, attract: 0.04, desc: 'Árvores frutíferas para todos.' },
  vpasture:  { name: 'Pasto de Ovelhas',     icon: '🐑', w: 3, h: 2, cost: { wood: 25 },                          rent: 8, pm: 0.1, desc: 'Lã e leite para vender na feira.' },
  vapiary:   { name: 'Apiário',              icon: '🐝', w: 2, h: 1, cost: { wood: 15 },                          rent: 6, pm: 0.08, desc: 'Colmeias: mel e cera para o comércio.' },
  vinn:      { name: 'Estalagem',            icon: '🛏️', w: 3, h: 2, cost: { wood: 50, stone: 25 },               rent: 20, attract: 0.08, desc: 'Viajantes pousam aqui, e alguns ficam para sempre.' },
  vschool:   { name: 'Escola',               icon: '📚', w: 3, h: 2, cost: { wood: 40, stone: 30 },               pm: 0.25, attract: 0.06, desc: 'As famílias querem estudo para os filhos.' },
  vbath:     { name: 'Casa de Banhos',       icon: '🛁', w: 2, h: 2, cost: { stone: 40, wood: 20 },               pm: 0.2, cap: 4, desc: 'Banhos quentes e saúde para a vila.' },
  vgarden:   { name: 'Praça Florida',        icon: '🌷', w: 2, h: 2, cost: { wood: 10, stone: 10, dirt: 4 },      pm: 0.12, attract: 0.05, desc: 'Flores e bancos: um lugar bonito para viver.' },
  vtower:    { name: 'Torre de Vigia',       icon: '🗼', w: 1, h: 1, cost: { stone: 40, wood: 10 },               pm: 0.1, desc: 'Vigias no alto: a vila se sente segura.' },
  vtenement: { name: 'Casas de Aluguel',     icon: '🏘️', w: 3, h: 2, cost: { wood: 60, stone: 40 },               rent: 15, cap: 10, attract: 0.1, desc: 'Moradias para alugar: cabem mais famílias.' },
  vweaver:   { name: 'Tecelagem',            icon: '🧵', w: 2, h: 2, cost: { wood: 30, stone: 10 },               rent: 14, pm: 0.1, desc: 'Teares fazem tecidos para vender.' },
  vbrewery:  { name: 'Cervejaria da Vila',   icon: '🍻', w: 2, h: 2, cost: { wood: 35, stone: 15 },               rent: 16, pm: 0.1, desc: 'Cerveja de cevada para as tavernas.' },
  vtrade:    { name: 'Entreposto Comercial', icon: '🏬', w: 3, h: 2, cost: { wood: 50, stone: 40, iron_bar: 2 },  rent: 25, pm: 0.15, attract: 0.05, desc: 'Mercadores de longe compram e vendem aqui.' },
  vstable:   { name: 'Estrebaria',           icon: '🐎', w: 3, h: 2, cost: { wood: 40 },                          rent: 10, pm: 0.05, desc: 'Aluga cavalos e guarda os dos viajantes.' },
  vmine:     { name: 'Mina da Vila',         icon: '⛏️', w: 2, h: 2, cost: { wood: 30, stone: 30 },               stock: { iron_ore: 6, stone: 8 }, desc: 'Mineiros tiram ferro e pedra para o reino.' },
  vsawmill:  { name: 'Serraria da Vila',     icon: '🪚', w: 2, h: 2, cost: { wood: 20, stone: 20 },               stock: { wood: 15 }, desc: 'Tábuas e madeira para o reino.' },
  vgranary:  { name: 'Celeiro',              icon: '🏚️', w: 3, h: 2, cost: { wood: 40 },                          stock: { wheat: 6 }, pm: 0.1, cap: 3, desc: 'Guarda a colheita: ninguém passa fome.' },
  vclinic:   { name: 'Casa de Curas',        icon: '🌿', w: 2, h: 2, cost: { wood: 25, stone: 20, herb: 4 },      pm: 0.18, cap: 2, attract: 0.05, desc: 'Uma curandeira cuida dos doentes.' },
  // ---- obras novas (o dobro das obras da vila)
  vgarden2:  { name: 'Horta Comunitária',     icon: '🥬', w: 3, h: 2, cost: { wood: 10, dirt: 8 },                  stock: { wheat: 6 }, pm: 0.06, attract: 0.02, look: ['field', '#6a4a2a', '#5aa83a'], desc: 'Couves e nabos para as famílias da vila.' },
  vcross:    { name: 'Cruzeiro',              icon: '✝️', w: 1, h: 1, cost: { stone: 18, wood: 4 },                 pm: 0.06, look: ['monument', '#a8a296', '✝️'], desc: 'Uma cruz de pedra na entrada da vila.' },
  vlaundry:  { name: 'Lavadouro',             icon: '🫧', w: 2, h: 1, cost: { stone: 20, wood: 6 },                 pm: 0.1, cap: 1, look: ['yard', '#8fb8c8', '#f2efe6'], desc: 'Tanques de pedra para lavar a roupa.' },
  vbarley:   { name: 'Campo de Cevada',       icon: '🌾', w: 3, h: 2, cost: { wood: 10, dirt: 10 },                 stock: { wheat: 10 }, look: ['field', '#7a5a2a', '#d8b84a'], desc: 'Cevada para o pão e a cerveja.' },
  vflax:     { name: 'Campo de Linho',        icon: '🌱', w: 3, h: 2, cost: { wood: 12, dirt: 8 },                  rent: 8, look: ['field', '#6a4a2a', '#7a9ad8'], desc: 'Linho para os tecelões venderem.' },
  vhens:     { name: 'Galinheiro da Vila',    icon: '🐔', w: 2, h: 2, cost: { wood: 20 },                           rent: 7, pm: 0.06, look: ['yard', '#a8904a', '#f2e6c8'], desc: 'Ovos frescos para a feira.' },
  vwood:     { name: 'Lenhador da Vila',      icon: '🪓', w: 2, h: 2, cost: { wood: 15, stone: 10 },                stock: { wood: 10 }, look: ['house', '#9a7a52', '#4a6a3a'], desc: 'Lenhadores trazem toras para o reino.' },
  vbasket:   { name: 'Cesteiro',              icon: '🧺', w: 2, h: 1, cost: { wood: 20, rope: 2 },                  rent: 8, look: ['house', '#c8a878', '#8a6a3a'], desc: 'Cestos de vime para a feira.' },
  vpigs:     { name: 'Pocilga da Vila',       icon: '🐖', w: 3, h: 2, cost: { wood: 30 },                           rent: 9, pm: 0.05, look: ['yard', '#7a5a3a', '#e8a0a0'], desc: 'Porcos engordam para o inverno.' },
  voven:     { name: 'Forno Comunitário',     icon: '🔥', w: 2, h: 2, cost: { stone: 25, clay: 6 },                 rent: 6, pm: 0.08, attract: 0.02, look: ['house', '#c8a888', '#7a4a3a'], desc: 'Todos assam o pão no mesmo forno.' },
  vfishery:  { name: 'Pesqueira do Rio',      icon: '🎣', w: 2, h: 2, cost: { wood: 25, rope: 4 },                  rent: 10, stock: { wheat: 4 }, look: ['yard', '#4a8ab8', '#c8d8e8'], desc: 'Redes e covos: peixe para a vila.' },
  vshoe:     { name: 'Sapateiro da Vila',     icon: '👞', w: 2, h: 1, cost: { wood: 20, leather: 6 },               rent: 11, look: ['house', '#d8c8a8', '#6a3a2a'], desc: 'Botas e sandálias sob medida.' },
  vcharcoal: { name: 'Carvoeiro',             icon: '⚫', w: 2, h: 2, cost: { wood: 30, clay: 6 },                  rent: 10, stock: { wood: 4 }, look: ['house', '#6a5a4a', '#3a3a3a'], desc: 'Fornos de carvão para os ferreiros.' },
  vspring:   { name: 'Fonte Sagrada',         icon: '💧', w: 1, h: 1, cost: { stone: 30, marble: 4 },               pm: 0.12, attract: 0.03, look: ['monument', '#d8d4cc', '💧'], desc: 'Água que dizem curar: peregrinos vêm de longe.' },
  vbutcher:  { name: 'Açougue da Vila',       icon: '🥩', w: 2, h: 2, cost: { wood: 25, stone: 20 },                rent: 12, pm: 0.08, look: ['house', '#e2d4b4', '#a03a3a'], desc: 'Carne fresca todo dia.' },
  vfishshop: { name: 'Peixaria',              icon: '🐟', w: 2, h: 2, cost: { wood: 30, stone: 15 },                rent: 12, pm: 0.08, attract: 0.02, look: ['house', '#d8e0e2', '#2a5a7a'], desc: 'Peixe salgado e fresco na banca.' },
  vpotter:   { name: 'Oleiro da Vila',        icon: '🏺', w: 2, h: 2, cost: { clay: 20, stone: 15, wood: 10 },      rent: 12, stock: { stone: 4 }, look: ['house', '#d8a878', '#8a4a2a'], desc: 'Potes, telhas e tijolos.' },
  vcheese:   { name: 'Queijaria',             icon: '🧀', w: 2, h: 2, cost: { wood: 25, stone: 20, clay: 6 },       rent: 14, pm: 0.08, look: ['house', '#efe2b8', '#a8791a'], desc: 'Queijos curados que viajam longe.' },
  vcattle:   { name: 'Feira do Gado',         icon: '🐄', w: 4, h: 3, cost: { wood: 45 },                           rent: 18, pm: 0.1, attract: 0.03, look: ['yard', '#8aa04a', '#5a3a2a'], desc: 'Uma vez por mês, compra e venda de gado.' },
  vinn2:     { name: 'Albergue dos Peregrinos', icon: '🎒', w: 3, h: 2, cost: { wood: 45, stone: 20 },              cap: 6, attract: 0.06, look: ['house', '#e2d8c4', '#5a6a3a'], desc: 'Pouso barato: muitos acabam ficando.' },
  vpost:     { name: 'Correio',               icon: '📯', w: 2, h: 2, cost: { wood: 35, stone: 20 },                pm: 0.15, attract: 0.03, look: ['house', '#e8dcc0', '#2a4a8a'], desc: 'Mensageiros a cavalo ligam a vila ao reino.' },
  vguard:    { name: 'Posto da Guarda',       icon: '💂', w: 2, h: 2, cost: { stone: 35, wood: 20, iron_bar: 2 },   pm: 0.12, cap: 2, look: ['big', '#9a958c', '#5a5a6a'], desc: 'Guardas da vila: menos ladrões e mais paz.' },
  vorphan:   { name: 'Orfanato',              icon: '🧸', w: 3, h: 2, cost: { wood: 40, stone: 30 },                pm: 0.12, cap: 6, attract: 0.04, look: ['house', '#f0e4cc', '#c86a4a'], desc: 'Um lar para as crianças sem família.' },
  vpawn:     { name: 'Casa de Penhores',      icon: '💰', w: 2, h: 2, cost: { stone: 40, wood: 20, iron_bar: 2 },   rent: 22, look: ['house', '#c8b490', '#3a5a3a'], desc: 'Empréstimos com garantia: lucro certo.' },
  vinfirm:   { name: 'Enfermaria',            icon: '⚕️', w: 3, h: 2, cost: { stone: 45, wood: 30, herb: 8 },       pm: 0.22, cap: 3, attract: 0.05, look: ['house', '#f2efe6', '#3a7a5a'], desc: 'Leitos e curandeiros: a vila vive mais.' },
  vcraft:    { name: 'Bairro dos Artesãos',   icon: '🛠️', w: 4, h: 3, cost: { wood: 80, stone: 50, nails: 20 },     rent: 20, cap: 8, attract: 0.06, look: ['hall', '#d8c39a', '#7b3b22'], desc: 'Oficinas e casas dos artesãos lado a lado.' },
  vhall:     { name: 'Paço do Concelho',      icon: '🏛️', w: 3, h: 3, cost: { stone: 60, wood: 40, glass: 4 },      rent: 10, pm: 0.3, look: ['hall', '#e8e0cc', '#2a4a6a'], desc: 'Onde os anciãos governam a vila.' },
  vguild:    { name: 'Sede das Corporações',  icon: '⚖️', w: 3, h: 3, cost: { stone: 70, wood: 40, iron_bar: 4 },   rent: 30, pm: 0.15, look: ['hall', '#d8c8a0', '#6a2a3a'], desc: 'Os ofícios da vila se organizam e lucram.' },
  vmint:     { name: 'Casa da Moeda',         icon: '🪙', w: 3, h: 2, cost: { stone: 60, iron_bar: 6, gold_bar: 1 }, rent: 45, look: ['big', '#b8b0a0', '#8a6a1a'], desc: 'Cunha moedas: dinheiro todo mês.' },
  vhmarket:  { name: 'Mercado Coberto',       icon: '🏪', w: 4, h: 3, cost: { wood: 60, stone: 50, iron_bar: 3 },   rent: 35, pm: 0.15, attract: 0.04, look: ['hall', '#c9a978', '#a03a2a'], desc: 'Bancas sob um telhado: feira o ano todo.' },
  vthermae:  { name: 'Termas',                icon: '🧖', w: 3, h: 3, cost: { stone: 80, marble: 10, glass: 4 },    pm: 0.3, cap: 4, attract: 0.06, look: ['hall', '#e2e6e2', '#3a7a9a'], desc: 'Banhos romanos de água quente.' },
  vmonastery:{ name: 'Mosteiro',              icon: '🙏', w: 4, h: 3, cost: { stone: 90, wood: 50, glass: 6 },      stock: { wheat: 8 }, pm: 0.3, cap: 5, attract: 0.05, look: ['big', '#d8cfbc', '#5a4a3a'], desc: 'Monges rezam, plantam e copiam livros.' },
  vuniv:     { name: 'Universidade',          icon: '🎓', w: 4, h: 3, cost: { stone: 100, wood: 50, glass: 10, iron_bar: 4 }, pm: 0.4, attract: 0.08, look: ['big', '#efe6d2', '#2a3a6a'], desc: 'Mestres e estudantes de todos os reinos.' },
  vcathedral:{ name: 'Catedral',              icon: '⛪', w: 4, h: 3, cost: { stone: 150, marble: 20, glass: 12, gold_bar: 2 }, pm: 0.5, attract: 0.1, look: ['big', '#e8e2d4', '#4a5a7a'], desc: 'A maior obra da fé: a vila vira destino de peregrinos.' },
};
const STOCK_NAMES = { wheat: 'trigo', wood: 'madeira', stone: 'pedra', iron_ore: 'ferro' };
// o texto da obra mostra o que ela rende
for (const [k, d] of Object.entries(VWORKS)) {
  const parts = [];
  if (d.rent) parts.push(`+${d.rent} Salin por mês`);
  if (d.stock) parts.push(Object.entries(d.stock).map(([r, n]) => `+${n} de ${STOCK_NAMES[r]}`).join(', ') + ' por mês para o reino');
  if (d.pm) parts.push('a vila prospera mais rápido');
  if (d.cap) parts.push(`+${d.cap} moradores`);
  if (d.attract) parts.push('atrai famílias novas');
  CIVIC[k] = Object.assign({}, d, { desc: d.desc + ' ' + parts.join(' · ') + '.' });
  CIV_STRUCTS[k] = { name: d.name, blocks: true };
}

const VillageWorks = {
  of(vi) { return World.structs.filter(s => s && s.village === vi && VWORKS[s.type] && !s.removed && !s.hidden); },
  capOf(vi) { return this.of(vi).reduce((n, s) => n + (VWORKS[s.type].cap || 0), 0); },
  // uma vez por mês: rendimento, recursos, prosperidade e famílias novas
  monthTick() {
    let mine = 0; const got = {};
    World.villages.forEach((v, vi) => {
      const list = this.of(vi); if (!list.length) return;
      const c = G.civs[v.civ], chief = v.lord === 'player', king = !v.free && c && c.ruler === 'player';
      let rent = 0, pm = 0, attract = 0;
      for (const s of list) {
        const d = VWORKS[s.type]; rent += d.rent || 0; pm += d.pm || 0; attract += d.attract || 0;
        for (const [r, n] of Object.entries(d.stock || {})) {
          if (!v.free && c) { c.stock[r] = Math.min(3000, (c.stock[r] || 0) + n); if (king) got[r] = (got[r] || 0) + n; }
          else rent += Math.round(n * 1.5); // vila livre: vende o que produz
        }
      }
      v.prosper = Math.min(typeof PROSPER_MAX !== 'undefined' ? PROSPER_MAX : 140, (v.prosper || 0) + pm);
      if (chief) { P.gold += rent; mine += rent; }
      else if (c) { c.treasury += rent; if (king) mine += rent; }
      if (attract && Math.random() < Math.min(0.6, attract) && People.residents(vi).length < Families.vcap(v)) {
        // durante o jogo, a mudança da família é um pedaço próprio do mês (procurar quem se muda é pesado)
        if (typeof Perf !== 'undefined' && Perf.slicing) Perf.queue.push(Object.assign(() => { if (World.villages[vi] === v) Families.settle(v, vi, 1); }, { label: 'Families.settle' }));
        else Families.settle(v, vi, 1);
        if (chief || king) Game.note(`👪 Uma família nova se mudou para ${v.name}, atraída pelas obras da vila.`, 'gold');
      }
    });
    const res = Object.entries(got).map(([r, n]) => `${n} de ${STOCK_NAMES[r]}`).join(', ');
    if (mine || res) Game.note(`🏘️ As obras das suas vilas renderam${mine ? ` ${mine} Salin` : ''}${mine && res ? ' e' : ''}${res ? ` ${res} para o reino` : ''}.`, 'gold');
  },
};

// desenho das obras novas
const _drawStructExtraBase = drawStructExtra;
drawStructExtra = function (ctx, s, X, Y, time, H) {
  if (!VWORKS[s.type]) return _drawStructExtraBase(ctx, s, X, Y, time, H);
  const { R, roof, house, shadow, flag, w, h } = H, sn = World.season;
  const ell = (x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(X + x, Y + y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const sign = (x, y, ic) => { R(x, y, 14, 11, '#5a3a1e'); ctx.font = '9px sans-serif'; ctx.fillText(ic, X + x + 1, Y + y + 9); };
  const tree = (x, y, fruit) => { ell(x, y + 10, 7, 2.5, 'rgba(0,0,0,0.25)'); R(x - 2, y - 2, 4, 12, '#6b4423'); ell(x, y - 6, 9, 8, sn === 3 ? '#dfe6ea' : sn === 2 ? '#c8883a' : '#3f7f2a'); if (fruit && sn < 2) for (const [dx, dy] of [[-4, -7], [3, -4], [0, -10]]) R(x + dx, y + dy, 2, 2, fruit); };
  const fence = () => { ctx.strokeStyle = '#8b5f38'; ctx.lineWidth = 2; ctx.strokeRect(X + 3, Y + 3, w - 6, h - 6); for (let k = 4; k < w; k += 12) R(k, 0, 3, 7, '#7a5230'); };
  switch (s.type) {
    case 'vbakery': house('#ecdcbc', '#9a3a2a'); R(w - 16, -4, 8, 14, '#8a7a6a'); sign(w - 22, 30, '🥖'); break;
    case 'vmill': {
      house('#d8c8a8', '#7a5a3a');
      const a = Math.PI / 4; ctx.save(); ctx.translate(X + w / 2, Y + 10); ctx.rotate(a); // pás paradas
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-2, 2, 4, 22); ctx.fillStyle = '#8a6a42'; ctx.fillRect(-1, 2, 2, 22); }
      ctx.restore(); ell(w / 2, 10, 3, 3, '#5a3a1e'); break;
    }
    case 'vorchard': { R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#6a9a3a'); for (const [x, y] of [[16, 22], [48, 18], [80, 24], [30, 50], [66, 52]]) tree(x, y, '#e0302a'); break; }
    case 'vpasture': {
      R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#7aa04a'); fence();
      const bob = Math.sin(time * 2) * 1;
      for (const [x, y] of [[22, 28], [52, 40], [74, 24]]) { ell(x, y + 8, 9, 3, 'rgba(0,0,0,0.2)'); ell(x, y + bob, 9, 7, '#f2efe6'); ell(x + 8, y - 2 + bob, 4, 4, '#3a3a3a'); R(x - 5, y + 5, 2, 5, '#3a3a3a'); R(x + 3, y + 5, 2, 5, '#3a3a3a'); }
      break;
    }
    case 'vapiary': { R(2, 14, w - 4, h - 14, sn === 3 ? '#dfe6ea' : '#7aa04a'); for (const x of [8, 26, 44]) { R(x, 10, 14, 16, '#e0b850'); R(x, 14, 14, 2, '#a07a2a'); R(x, 20, 14, 2, '#a07a2a'); R(x - 1, 8, 16, 3, '#8a5a30'); R(x + 5, 22, 4, 3, '#3a2a1a'); }
      for (let k = 0; k < 5; k++) R(10 + ((time * 30 + k * 23) % 50), 4 + Math.sin(time * 6 + k) * 3, 2, 2, '#2a2a2a'); break; }
    case 'vinn': house('#e2d4b4', '#2a5a7a'); R(w - 30, 18, 22, 4, '#5a3a1e'); sign(w - 24, 30, '🛏️'); break;
    case 'vschool': house('#efe6d2', '#8e1f2a'); R(w / 2 - 4, -10, 8, 14, '#8e1f2a'); ell(w / 2, -12, 5, 5, '#d4b14a'); sign(w - 24, 30, '📚'); break;
    case 'vbath': house('#d8dcd8', '#3a6a8a'); for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(240,240,250,${0.35 - k * 0.1})`; ctx.beginPath(); ctx.arc(X + w / 2 + Math.sin(time + k) * 4, Y - 4 - k * 8 - (time * 6 % 8), 4 + k, 0, Math.PI * 2); ctx.fill(); } sign(w - 22, 30, '🛁'); break;
    case 'vgarden': {
      R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : '#6aa04a'); R(w / 2 - 4, 2, 8, h - 4, '#c8b48a');
      const cols = ['#d0304a', '#f0e040', '#e86aa0', '#8a6ad8', '#ffffff'];
      if (sn !== 3) for (let k = 0; k < 18; k++) R(4 + (k * 37) % (w / 2 - 10) + (k % 2 ? w / 2 + 4 : 0), 6 + (k * 13) % (h - 14), 3, 3, cols[k % cols.length]);
      R(8, h - 14, 18, 4, '#7a5230'); R(w - 26, h - 14, 18, 4, '#7a5230'); break;
    }
    case 'vtower': { shadow(); R(6, -30, 20, 58, '#9a958c'); R(6, -30, 5, 58, '#b8b2a6'); R(2, -38, 28, 10, '#857f74'); for (let k = 2; k < 30; k += 8) R(k, -44, 5, 6, '#857f74'); R(13, -18, 6, 9, '#2a2420'); flag(14, -44, Game.civColor(typeof s.owner === 'number' ? s.owner : 0)); break; }
    case 'vtenement': { house('#d8c39a', '#7b3b22'); R(w / 2 - 2, 26, 4, h - 30, U.shade('#d8c39a', -0.2)); R(w / 2 + 10, 32, 8, 8, '#2a2a3a'); R(w / 2 - 18, 32, 8, 8, '#2a2a3a'); sign(8, 44, '🏘️'); break; }
    case 'vweaver': house('#ddd0b4', '#6a4a8a'); for (let k = 0; k < 4; k++) R(10 + k * 6, h - 10, 4, 6, ['#c84a4a', '#4a7ac8', '#d8b84a', '#5aa85a'][k]); sign(w - 24, 30, '🧵'); break;
    case 'vbrewery': house('#a07a4a', '#5a3a1e'); for (const bx of [6, 22]) { R(bx, h - 16, 12, 12, '#7a4a22'); R(bx, h - 12, 12, 2, '#3a3a3a'); } sign(w - 24, 30, '🍻'); break;
    case 'vtrade': house('#c9a978', '#2a6a4a'); for (let k = 0; k < 3; k++) R(w - 40 + k * 11, h - 14, 9, 10, ['#e2b23a', '#c24b3a', '#6aa84f'][k]); sign(10, 44, '🏬'); break;
    case 'vstable': { shadow(); R(4, 24, w - 8, h - 28, '#8a5a30'); roof(2, 8, w - 4, 18, '#5a3a1e'); for (let k = 0; k < 3; k++) { R(10 + k * 28, h - 24, 20, 20, '#3a2414'); R(14 + k * 28, h - 20, 12, 8, '#7a4a26'); } break; }
    case 'vmine': { shadow(); R(4, 10, w - 8, h - 12, '#7a746a'); R(4, 10, w - 8, 6, '#8f897e'); R(w / 2 - 12, h - 26, 24, 24, '#1a1612'); R(w / 2 - 14, h - 28, 28, 4, '#6b4423'); R(w / 2 - 14, h - 28, 4, 26, '#6b4423'); R(w / 2 + 10, h - 28, 4, 26, '#6b4423');
      R(w - 18, h - 12, 12, 8, '#5a3a1e'); R(w - 16, h - 14, 8, 4, '#c27a45'); break; }
    case 'vsawmill': house('#b08a5a', '#5a4026'); for (let k = 0; k < 3; k++) R(6, h - 10 - k * 4, 26, 3, k % 2 ? '#a8743e' : '#8a5a30'); ell(w - 14, h - 14, 8, 8, '#9aa0a8'); break;
    case 'vgranary': { shadow(); R(6, 20, w - 12, h - 24, '#9a3a2a'); roof(2, 2, w - 4, 22, '#6a2a1a'); R(w / 2 - 12, h - 26, 24, 22, '#5a2a1a'); ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + w / 2 - 12, Y + h - 26); ctx.lineTo(X + w / 2 + 12, Y + h - 4); ctx.moveTo(X + w / 2 + 12, Y + h - 26); ctx.lineTo(X + w / 2 - 12, Y + h - 4); ctx.stroke(); break; }
    case 'vclinic': house('#efe6d2', '#3a6a3a'); for (let k = 0; k < 3; k++) { R(8 + k * 8, h - 12, 6, 6, '#9a5a3a'); ell(11 + k * 8, h - 14, 4, 3, '#5a9a3a'); } sign(w - 22, 30, '🌿'); break;
    default: {
      const L = VWORKS[s.type].look || ['house', '#d8c39a', '#7b3b22'], ic = VWORKS[s.type].icon, [kind, c1, c2] = L;
      const big = (x, y, sz, t) => { ctx.font = `${sz}px sans-serif`; ctx.fillText(t, X + x, Y + y); };
      if (kind === 'field') { R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : c1); if (sn !== 3) for (let y = 8; y < h - 6; y += 8) for (let x = 6; x < w - 6; x += 7) R(x, y + Math.sin(time * 2 + x) * 0.6, 3, 5, sn === 2 ? '#c8a04a' : c2); sign(w - 18, h - 14, ic); }
      else if (kind === 'yard') { R(2, 2, w - 4, h - 4, sn === 3 ? '#dfe6ea' : c1); fence(); const bob = Math.sin(time * 2) * 1; for (let k = 0; k < Math.max(1, Math.floor(w / 24)); k++) { const x = 16 + k * 24, y = h / 2 + (k % 2 ? 6 : -2); ell(x, y + 7, 7, 2.5, 'rgba(0,0,0,0.2)'); ell(x, y + bob, 7, 5, c2); ell(x + 6, y - 2 + bob, 3, 3, U.shade(c2, -0.4)); } sign(w - 18, 4, ic); }
      else if (kind === 'monument') { shadow(); R(w / 2 - 10, h - 10, 20, 8, U.shade(c1, -0.2)); R(w / 2 - 6, h - 24, 12, 16, c1); big(w / 2 - 8, h - 26, 16, c2); }
      else if (kind === 'hall') { house(c1, c2); for (let k = 10; k < w - 10; k += 14) R(k, 26, 4, h - 32, U.shade(c1, 0.12)); R(6, h - 10, w - 12, 4, U.shade(c1, -0.25)); sign(w / 2 - 7, 8, ic); }
      else if (kind === 'big') { house(c1, c2); R(w - 26, -26, 18, 52, U.shade(c1, -0.08)); roof(w - 30, -40, 26, 16, c2); R(w - 20, -14, 6, 9, '#2a2420'); flag(w - 18, -40, Game.civColor(typeof s.owner === 'number' ? s.owner : 0)); sign(10, 44, ic); }
      // obra de uma fileira só (2×1: Cesteiro, Sapateiro): casinha baixa — a casa comum foi feita para dois blocos de
      // altura e deixava a janela e a placa para fora do prédio
      else if (h < 48) { shadow(); R(4, 10, w - 8, h - 12, c1); R(4, h - 4, w - 8, 2, U.shade(c1, -0.15)); R(w / 2 - 4, h - 16, 8, 14, '#5a3a1e'); R(w / 2 + 1, h - 10, 2, 2, '#d4b14a'); R(9, 14, 7, 6, '#2a2a3a'); roof(2, -10, w - 4, 22, c2); sign(w - 20, 13, ic); }
      else { house(c1, c2); if (/[🔥⚫]/u.test(ic)) for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(200,200,200,${0.35 - k * 0.1})`; ctx.beginPath(); ctx.arc(X + w - 14 + Math.sin(time + k) * 3, Y - 6 - k * 8 - (time * 6 % 8), 3 + k, 0, Math.PI * 2); ctx.fill(); } sign(w - 22, 30, ic); }
      break;
    }
  }
};
