'use strict';
// O ritmo das eras: o mundo evolui devagar, ao longo de gerações (cada mês do calendário vale um ano de vida).
//  • 🛣️ Estradas: a cada 100 anos começa uma nova melhoria (cascalho aos 100, pedra aos 200, calçada aos 300, Estrada
//    Real aos 400), e ela se espalha devagar pelos reinos.
//  • 🏘️ Vilas: o nível mais alto que uma vila alcança sobe com os anos — o auge (nível 10) só perto dos 1000 anos.
//    A economia continua a mesma: a prosperidade só não passa do teto da era.
//  • 🛡️ As defesas das vilas da IA também acompanham as eras (paliçada reforçada aos 200, muralha de pedra aos 400...).
// Jogos salvos começam a contar de agora: o que já tinha evoluído fica como está.
const ERA_ROAD = 100, ERA_VILLAGE = 105, ERA_DEF = 200;
const Era = {
  S() { const u = G.urban || (G.urban = {}); return u.era || (u.era = { start: G.day || 1, age: 0 }); },
  years() { return Math.max(0, (G.day || 1) - this.S().start); },
  roadMax() { return Math.min(5, 1 + Math.floor(this.years() / ERA_ROAD)); },
  // o nível que cada vila pode alcançar agora (o que ela já tinha ao começar a contar fica garantido)
  villageCap(v) { if (v.lvl0 === undefined) v.lvl0 = v.level || 1; return Math.max(v.lvl0, v.capital ? Towns.levelOf(32) : 1, Math.min(VILLAGE_MAX, 1 + Math.floor(this.years() / ERA_VILLAGE))); },
  prosperCap(v) { const L = this.villageCap(v); return L >= VILLAGE_MAX ? PROSPER_MAX : VILLAGE_LVLS[L] - 0.01; },
  defMax() { return Math.min(3, Math.floor(this.years() / ERA_DEF)); },
  clamp() { for (const v of World.villages) if (v && v.prosper > this.prosperCap(v)) v.prosper = this.prosperCap(v); },
  nextRoad() { const y = this.years(); return this.roadMax() >= 5 ? null : ERA_ROAD - (y % ERA_ROAD); },
  // uma era nova: a notícia corre
  tick() {
    const S = this.S(), age = Math.floor(this.years() / ERA_ROAD);
    if (age > S.age) {
      S.age = age; const L = this.roadMax(), names = ['', 'de terra', 'de cascalho', 'de pedra', 'calçadas', 'Reais'];
      const t = `📜 Começa uma nova era (${this.years()} anos): ${L <= 5 && age <= 4 ? `as estradas dos reinos podem ser ${names[L]}` : 'os reinos seguem crescendo'} e as vilas podem chegar ao nível ${Math.min(VILLAGE_MAX, 1 + Math.floor(this.years() / ERA_VILLAGE))}.`;
      UI.banner('📜 Uma nova era'); UI.msg(t, 'gold', true); if (typeof Diplo !== 'undefined') Diplo.chronicle(t, true);
    }
  },
  card() {
    const y = this.years(), nr = this.nextRoad(), cap = Math.min(VILLAGE_MAX, 1 + Math.floor(y / ERA_VILLAGE));
    return `<div class="card era-card"><div class="sec">📜 A era <span>${y} anos desde o começo</span></div>
      <p class="dt-desc">O mundo evolui ao longo de gerações: as vilas chegam até o <b>nível ${cap}</b> nesta era e as estradas até o <b>nível ${this.roadMax()}</b>.${nr ? ` A próxima melhoria das estradas começa em <b>${nr} anos</b>.` : ''}${cap < VILLAGE_MAX ? ` O auge das vilas (nível ${VILLAGE_MAX}) só chega perto dos ${(VILLAGE_MAX - 1) * ERA_VILLAGE} anos.` : ''}</p></div>`;
  },
};

{
  // a prosperidade não passa do teto da era (antes de a vila calcular o nível)
  const dt0 = Towns.dayTick.bind(Towns);
  Towns.dayTick = function (...a) { try { Era.clamp(); } catch (e) { console.error(e); } return dt0(...a); };
  if (typeof VillageEcon !== 'undefined') {
    const de0 = VillageEcon.delta.bind(VillageEcon);
    VillageEcon.delta = function (v, ...a) { const d = de0(v, ...a); const room = Era.prosperCap(v) - (v.prosper || 0); return d > 0 ? Math.min(d, Math.max(0, room)) : d; };
  }
  const mt0 = Lifesim.monthTick.bind(Lifesim);
  Lifesim.monthTick = function () { mt0(); try { Era.clamp(); Era.tick(); } catch (e) { console.error(e); } };
  // a página da vila (governador) mostra a era
  if (typeof Reinado !== 'undefined') { const vg0 = Reinado.village.bind(Reinado); Reinado.village = function (vi) { return vg0(vi) + Era.card(); }; }
  // começa a contar no jogo novo e ao carregar um jogo salvo antigo (sem rebaixar nada)
  const ng0 = Game.newGame.bind(Game);
  Game.newGame = async function (...a) { const r = await ng0(...a); if (G.state === 'play') { const S = Era.S(); S.start = G.day || 1; S.age = 0; for (const v of World.villages) if (v) v.lvl0 = v.level || 1; } return r; };
}
