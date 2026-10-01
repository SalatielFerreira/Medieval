'use strict';
// Reinos vivos: relações entre os reinos, guerras, alianças, casamentos reais e crônicas do mundo.

const Diplo = {
  init() {
    const n = CIV_DEFS.length, rel = [];
    for (let a = 0; a < n; a++) { rel.push([]); for (let b = 0; b < n; b++) rel[a].push(0); }
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) rel[a][b] = rel[b][a] = U.rint(-45, 45);
    G.diplo = { rel, wars: [], allies: [], log: [] };
  },
  D() { if (!G.diplo) this.init(); return G.diplo; },
  rel(a, b) { return this.D().rel[a][b]; },
  addRel(a, b, n) { const r = this.D().rel; r[a][b] = r[b][a] = U.clamp(r[a][b] + n, -100, 100); },
  pairKey(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); },
  atWar(a, b) { return a !== b && this.D().wars.some(w => this.pairKey(w.a, w.b) === this.pairKey(a, b)); },
  allied(a, b) { return a !== b && this.D().allies.includes(this.pairKey(a, b)); },
  warsOf(a) { return this.D().wars.filter(w => w.a === a || w.b === a); },
  name(c) { return CIV_DEFS[c].short; },
  chronicle(text, important) {
    const D = this.D();
    D.log.unshift({ day: G.day, text });
    if (D.log.length > 80) D.log.length = 80;
    if (important) UI.msg('📜 ' + text, 'gold');
  },
  // o jogador sente as notícias dos reinos que governa ou onde está
  involves(...cs) { return cs.some(c => G.civs[c] && G.civs[c].ruler === 'player'); },

  declareWar(a, b, why) {
    if (this.atWar(a, b)) return;
    const D = this.D();
    D.allies = D.allies.filter(k => k !== this.pairKey(a, b));
    D.wars.push({ a, b, since: G.day });
    this.addRel(a, b, -20);
    this.chronicle(`⚔️ ${this.name(a)} declarou guerra a ${this.name(b)}${why ? ' — ' + why : ''}.`, true);
    // o jogador que governa um dos lados entra na guerra: os soldados inimigos passam a atacá-lo
    if (G.civs[a].ruler === 'player' && G.civs[b].ruler !== 'player') G.civs[b].atWar = true;
    if (G.civs[b].ruler === 'player' && G.civs[a].ruler !== 'player') G.civs[a].atWar = true;
    // aliados entram na guerra
    for (const k of D.allies.slice()) {
      const [x, y] = k.split('-').map(Number);
      const ally = x === b ? y : y === b ? x : -1;
      if (ally >= 0 && ally !== a && !this.atWar(ally, a) && this.rel(ally, a) < 20) {
        D.wars.push({ a: ally, b: a, since: G.day });
        this.chronicle(`🛡️ ${this.name(ally)} honra a aliança e entra na guerra contra ${this.name(a)}.`);
      }
    }
  },
  makePeace(a, b, why) {
    const D = this.D();
    D.wars = D.wars.filter(w => this.pairKey(w.a, w.b) !== this.pairKey(a, b));
    this.D().rel[a][b] = this.D().rel[b][a] = Math.max(this.rel(a, b), -15);
    this.chronicle(`🕊️ ${this.name(a)} e ${this.name(b)} assinaram a paz${why ? ' — ' + why : ''}.`, this.involves(a, b));
    for (const [x, y] of [[a, b], [b, a]]) if (G.civs[x].ruler === 'player' && G.civs[y].ruler !== 'player' && !this.warsOf(y).some(w => G.civs[w.a].ruler === 'player' || G.civs[w.b].ruler === 'player')) G.civs[y].atWar = false;
  },
  ally(a, b) {
    const D = this.D(), k = this.pairKey(a, b);
    if (D.allies.includes(k) || this.atWar(a, b)) return;
    D.allies.push(k);
    this.addRel(a, b, 15);
    this.chronicle(`🤝 ${this.name(a)} e ${this.name(b)} firmaram uma aliança.`, this.involves(a, b));
  },
  royalWedding(a, b) {
    const free = c => G.people.filter(p => p.alive && p.rank === 'heir' && p.civ === c && p.age >= 17 && p.spouse === null && !p.kin);
    const ha = free(a), hb = free(b);
    if (!ha.length || !hb.length) return false;
    const x = ha[0], y = hb.find(p => p.sex !== x.sex);
    if (!y) return false;
    People.marry(x, y);
    y.home = { type: 'castle', civ: a }; y.civ = a;
    this.addRel(a, b, 25);
    this.chronicle(`💍 Casamento real: ${People.title(x)} ${x.name} de ${this.name(a)} casou-se com ${People.title(y)} ${y.name} de ${this.name(b)}.`, true);
    this.ally(a, b);
    return true;
  },
  strength(c) {
    const civ = G.civs[c];
    let s = civ.garrison + civ.invest.walls * 3 + Math.min(10, civ.treasury / 150);
    for (const k of this.D().allies) { const [x, y] = k.split('-').map(Number); if (x === c || y === c) s += G.civs[x === c ? y : x].garrison * 0.25; }
    return s;
  },
  villagesOf(c) { return World.villages.filter(v => v.civ === c); },

  // ------------------------------------------------------------ um dia no mundo
  tickDay() {
    if (G.dungeon) return; // as mudanças de território precisam do mapa do mundo carregado
    const D = this.D(), n = CIV_DEFS.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      let drift = U.rnd(-5, 4.5);
      if (this.allied(a, b)) drift += 1.5;
      if (this.atWar(a, b)) drift -= 1;
      this.addRel(a, b, drift);
    }
    // incidentes e acordos mexem nas relações e viram notícia
    if (Math.random() < 0.35) {
      const a = U.rint(0, n - 1), b = (a + U.rint(1, n - 1)) % n;
      if (Math.random() < 0.55) {
        this.addRel(a, b, -U.rint(12, 25));
        this.chronicle(`⚠️ ${U.pick(['Incidente de fronteira', 'Caravana saqueada', 'Embaixador expulso', 'Disputa por um rio', 'Espião capturado'])} entre ${this.name(a)} e ${this.name(b)}.`);
      } else {
        this.addRel(a, b, U.rint(10, 20));
        this.chronicle(`📦 ${U.pick(['Acordo comercial', 'Festa de amizade', 'Troca de presentes', 'Torneio conjunto'])} entre ${this.name(a)} e ${this.name(b)}.`);
      }
    }
    // eventos diplomáticos (só entre reinos governados pela IA, ou contra o jogador)
    for (let k = 0; k < 2; k++) {
      const a = U.rint(0, n - 1), b = (a + U.rint(1, n - 1)) % n;
      const r = this.rel(a, b), aiA = G.civs[a].ruler !== 'player';
      if (aiA && r < -40 && !this.atWar(a, b) && this.warsOf(a).length < 2) this.declareWar(a, b, U.pick(['disputa de fronteira', 'insulto na corte', 'roubo de gado', 'cobiça por suas minas']));
      else if (r > 45 && !this.allied(a, b) && aiA && G.civs[b].ruler !== 'player') this.ally(a, b);
      else if (r > 25 && aiA && G.civs[b].ruler !== 'player' && Math.random() < 0.3) this.royalWedding(a, b);
    }
    // batalhas das guerras em andamento
    for (const w of D.wars.slice()) {
      const sa = this.strength(w.a) + U.rnd(0, 8), sb = this.strength(w.b) + U.rnd(0, 8);
      const [win, lose] = sa >= sb ? [w.a, w.b] : [w.b, w.a];
      const L = G.civs[lose], Wn = G.civs[win];
      L.garrison = Math.max(0, L.garrison - U.rint(1, 3));
      Wn.garrison = Math.max(0, Wn.garrison - U.rint(0, 1));
      const loot = Math.min(L.treasury, U.rint(40, 140));
      L.treasury -= loot; Wn.treasury += loot;
      L.happy = Math.max(0, L.happy - 4);
      const targets = this.villagesOf(lose);
      if (targets.length) {
        const v = targets.reduce((best, x) => U.dist(x.x, x.y, World.capitals[win].x, World.capitals[win].y) < U.dist(best.x, best.y, World.capitals[win].x, World.capitals[win].y) ? x : best, targets[0]);
        v.raid = { by: win, until: G.day + 1 };
        if (this.involves(lose)) UI.msg(`🔥 ${this.name(win)} está atacando ${v.name}! Vá defender a vila.`, 'bad');
        if (L.garrison < 3 && targets.length > 1 && Math.random() < 0.35) this.captureVillage(v, win);
      }
      const dur = G.day - w.since;
      if ((dur > 5 && Math.random() < 0.3) || (L.garrison <= 0 && G.civs[lose].ruler !== 'player')) {
        const tribute = Math.min(L.treasury, 200);
        L.treasury -= tribute; Wn.treasury += tribute;
        this.makePeace(w.a, w.b, tribute ? `${this.name(lose)} pagou ${tribute} moedas de tributo` : 'os dois lados estão exaustos');
      }
    }
  },
  captureVillage(v, winner, quiet) {
    const old = v.civ, vi = World.villages.indexOf(v);
    v.civ = winner; v.raid = null;
    for (const s of World.structs) {
      if (s.owner !== old) continue;
      if (s.village === vi || U.dist(s.x, s.y, v.x, v.y) < 9) s.owner = winner;
    }
    for (let y = v.y - 18; y <= v.y + 18; y++) for (let x = v.x - 18; x <= v.x + 18; x++) {
      if (!World.inb(x, y)) continue;
      const i = World.idx(x, y);
      if (World.terr[i] === old && U.dist(x, y, v.x, v.y) < 17) World.terr[i] = winner;
    }
    for (const p of G.people) if (p.alive && p.home.type === 'village' && p.home.idx === vi) p.civ = winner;
    World.chunks = new Map();
    if (quiet) return;
    World.buildMinimap();
    this.chronicle(`🏴 ${this.name(winner)} conquistou ${v.name.startsWith("Vila ") ? "a " + v.name : "a vila de " + v.name}, que pertencia a ${this.name(old)}.`, true);
    if (G.civs[old].ruler === 'player') UI.banner(`🔥 ${v.name} foi tomada por ${this.name(winner)}!`);
  },

  // ------------------------------------------------------------ ações do jogador como soberano
  playerAction(mine, other, act) {
    const c = G.civs[mine];
    if (act === 'gift' && c.treasury >= 100) { c.treasury -= 100; this.addRel(mine, other, 12); UI.msg(`Presentes enviados a ${this.name(other)} (+12 relação).`, 'gold'); }
    if (act === 'ally' && c.treasury >= 200 && this.rel(mine, other) >= 40) { c.treasury -= 200; this.ally(mine, other); }
    if (act === 'peace' && c.treasury >= 300 && this.atWar(mine, other)) { c.treasury -= 300; G.civs[other].treasury += 300; this.makePeace(mine, other, `${G.name} pagou 300 moedas`); }
    if (act === 'war' && !this.atWar(mine, other)) this.declareWar(mine, other, `ordem de ${G.name}`);
  },
};
