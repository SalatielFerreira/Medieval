'use strict';
// Arenas nas capitais: duelos, justas a cavalo, o Grande Torneio anual e apostas.

const ARENA_TIERS = [
  { name: 'Lutador',  hp: 90,  dmg: 8,  prize: 40,  odds: 1.6, fame: 3,  lvl: 1 },
  { name: 'Veterano', hp: 150, dmg: 12, prize: 110, odds: 2.2, fame: 6,  lvl: 4 },
  { name: 'Campeão',  hp: 240, dmg: 17, prize: 260, odds: 3.5, fame: 12, lvl: 8 },
];
const ARENA_MAX_BET = 100000; // aposta máxima em Salin
const EPITHETS = ['o Touro', 'a Raposa', 'Mão de Ferro', 'o Lobo', 'Coração Bravo', 'o Gigante', 'a Víbora', 'o Martelo', 'Olho de Falcão', 'o Implacável'];

const Arena = {
  // uma arena perto de cada capital (posição sempre igual para o mesmo mundo)
  init() {
    for (let c = 0; c < CIV_DEFS.length; c++) {
      const cp = World.capitals[c];
      if (cp.arena) continue;
      cp.arena = this.place('arena', cp.x, cp.y, 4, 3, c, 8, 15, c * 1.7);
    }
  },
  place(type, cx, cy, w, h, owner, r0, r1, a0) {
    for (let r = r0; r <= r1; r++) for (let k = 0; k < 32; k++) {
      const a = a0 + k / 32 * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * r) - (w >> 1), y = Math.round(cy + Math.sin(a) * r * 0.8) - (h >> 1);
      if (!World.areaOk(x - 1, y - 1, w + 2, h + 2) || !World.areaFree(x - 1, y - 1, w + 2, h + 2) || Towns.onRoad(x, y, w, h)) continue;
      return World.addStruct(type, x, y, w, h, owner);
    }
    return null;
  },
  arenaOf(ci) { return World.capitals[ci].arena; },
  // dentro do coliseu, o centro da areia é o lugar da luta
  inColiseum(ci) { return !!(G.place && G.place.kind === 'room' && G.place.type === 'arena' && G.place.src.owner === ci); },
  center(ci) {
    if (this.inColiseum(ci)) return { x: (G.place.fx0 + 13) * TILE, y: (G.place.fy0 + 8.6) * TILE };
    const s = this.arenaOf(ci); return { x: (s.x + s.w / 2) * TILE, y: (s.y + s.h / 2 + 0.5) * TILE };
  },
  fighterName(ci, tier) { return `${U.pick(NAMES_M.concat(NAMES_F))} ${U.pick(EPITHETS)}`; },

  // ------------------------------------------------------------ duelo na arena (não é mortal)
  // ------------------------------------------------------------ só quem luta pisa na arena
  zoneAt(x, y) {
    if (typeof World === 'undefined' || !World.capitals || G.dungeon) return null;
    for (const cp of World.capitals) {
      const s = cp && cp.arena;
      if (!s || s.removed || s.hidden) continue;
      if (x >= s.x * TILE && x < (s.x + s.w) * TILE && y >= s.y * TILE && y < (s.y + s.h) * TILE + 6) return s;
    }
    return null;
  },
  fighter(e) { return !!G.duel && (e === P || e === G.duel.ent); },
  // a areia do coliseu (por dentro), em pixels
  sandRect() {
    const pl = G.place; if (!pl || pl.lay !== 'coliseum') return null;
    return { x0: (pl.fx0 + 5) * TILE, x1: (pl.fx0 + 21) * TILE, y0: (pl.fy0 + 4) * TILE + 4, y1: (pl.fy0 + 13) * TILE + 6 };
  },
  inSand(r, x, y) { return x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1; },
  // impede entrar na arena quem não está lutando (quem já está dentro pode sair)
  keepsOut(e, x, y) {
    const r = this.sandRect();
    if (r) {
      const now = this.inSand(r, e.x, e.y), next = this.inSand(r, x, y);
      if (this.fighter(e) || e.faction === 'duelist') return now && !next && !!(G.duel || this.show); // lutando: não sai da areia
      return next && !now;                                                                            // os outros não entram
    }
    const a = this.zoneAt(x, y);
    if (!a || this.zoneAt(e.x, e.y) === a || this.fighter(e)) return false;
    return true;
  },
  // tira da arena quem não está lutando (e põe o herói na entrada quando a luta acaba)
  clear(s, keepPlayer) {
    const r = this.sandRect();
    if (r && !keepPlayer && this.inSand(r, P.x, P.y)) { P.x = (G.place.fx0 + 13.5) * TILE; P.y = (G.place.fy0 + 14.6) * TILE; }
    if (!s) return;
    const out = (e) => { const p = freeSpotNear((s.x + s.w / 2) * TILE, (s.y + s.h + 1.6) * TILE, 2.5 * TILE); e.x = p.x; e.y = p.y; };
    for (const e of G.ents) if (!e.dead && e !== (G.duel && G.duel.ent) && this.zoneAt(e.x, e.y) === s) out(e);
    if (!keepPlayer && this.zoneAt(P.x, P.y) === s) out(P);
  },
  startDuel(ci, tier, bet, round) {
    if (G.duel) return;
    if (bet > P.gold) bet = P.gold;
    P.gold -= bet;
    const t = ARENA_TIERS[tier], c = this.center(ci);
    P.x = c.x - 40; P.y = c.y; P.mounted = false; // os dois lutadores começam dentro da arena
    for (const a of Game.allies()) { const s = freeSpotNear(c.x - 160, c.y + 60, 60); a.x = s.x; a.y = s.y; }
    const e = Game.spawn('champion', c.x + 40, c.y, { leash: 6 * TILE });
    const mult = 1 + (P.level - 1) * 0.06;
    e.hp = e.maxHp = Math.round(t.hp * mult); e.dmg = Math.round(t.dmg * mult); e.home = { x: c.x, y: c.y }; e.leash = 6 * TILE;
    e.duelName = this.fighterName(ci, tier); e.aggroOv = 20; e.target = P;
    G.duel = { ci, tier, bet, ent: e, round: round || 0, tourney: round !== undefined };
    this.clear(this.arenaOf(ci), true); // a plateia sai da areia
    UI.close();
    UI.banner(`⚔️ ${e.duelName} (${t.name})`);
    UI.msg(`Duelo na arena de ${CIV_DEFS[ci].short}! A luta só acaba quando a vida de um dos dois zerar. Ninguém morre de verdade: quem cair perde e não leva o prêmio.${bet ? ` Aposta: ${bet} 🪙 (paga ${t.odds}×).` : ''}`, 'gold');
  },
  // o campeão foi derrotado
  win() {
    const ar = G.duel ? this.arenaOf(G.duel.ci) : null;
    const d = G.duel; if (!d) return;
    G.duel = null;
    const t = ARENA_TIERS[d.tier], won = Math.round(d.bet * t.odds);
    P.gold += t.prize + won; Court.addFame(t.fame); Court.addService(d.ci, 2); Game.gainXp(20 + d.tier * 20);
    Progress.add('duelsWon');
    P.hp = Math.max(P.hp, P.maxHp * 0.5);
    UI.msg(`🏆 Vitória na arena! Prêmio ${t.prize} 🪙${won ? ` + aposta ${won} 🪙` : ''} · +${t.fame} de fama.`, 'gold', true);
    Sound.play('levelup');
    if (d.tourney && d.round < 2) this.tourneyNext(d.ci, d.round);
    else { if (d.tourney) this.tourneyNext(d.ci, d.round); this.clear(ar); } // luta acabou: o herói sai da areia
  },
  lose(reason) {
    const ar = G.duel ? this.arenaOf(G.duel.ci) : null;
    const d = G.duel; if (!d) return;
    G.duel = null;
    if (d.ent && !d.ent.dead) d.ent.dead = true;
    P.hp = Math.max(P.hp, P.maxHp * 0.3); P.hurt = 0;
    UI.banner('😵 Derrota na arena');
    UI.msg(`Você ${reason || 'caiu na areia'}.${d.bet ? ` Perdeu a aposta de ${d.bet} 🪙.` : ''}${d.tourney ? ' Sua participação no torneio terminou.' : ''}`, 'bad');
    if (d.tourney) { const tr = this.tourney(); if (tr) tr.out = true; }
    this.clear(ar);
  },
  update() {
    this.watchUpdate(1 / 60);
    const d = G.duel;
    if (!d) return;
    const c = this.center(d.ci);
    if (d.ent.dead && G.duel) { this.win(); return; }
    if (!this.sandRect() && U.dist(P.x, P.y, c.x, c.y) > 9 * TILE) this.lose('abandonou a arena'); // no coliseu não dá para sair da areia no meio da luta
  },
  // o jogador leva um golpe do campeão: não morre na arena
  playerHit(d) {
    if (!G.duel) return false;
    if (P.hp - d <= 0) { P.hp = 0; this.lose('caiu na areia, sem forças'); return true; }
    return false;
  },

  // ------------------------------------------------------------ Grande Torneio (uma capital por ano)
  tourney() { const t = G.tourney; return t && G.day <= t.until ? t : null; },
  dayTick() {
    // uma vez por ano, o mês de junho inteiro
    const cd = Calendar.of(G.day);
    if (cd.month === 5 && !this.tourney()) {
      const ci = U.rint(0, CIV_DEFS.length - 1);
      G.tourney = { ci, until: G.day, round: 0, out: false, won: false };
      Diplo.chronicle(`🏟️ O Grande Torneio acontece em ${Diplo.name(ci)} durante todo o mês de ${Calendar.text(G.day)}! Prêmio: 500 🪙 e muita fama.`, true);
    }
  },
  enterTourney(ci) {
    const t = this.tourney();
    if (!t || t.ci !== ci || t.out || t.won) return;
    if (P.gold < 50) { UI.msg('A inscrição custa 50 🪙.', 'bad'); return; }
    P.gold -= 50; t.entered = true; if (G.civs[t.ci]) G.civs[t.ci].treasury += 50; // a inscrição vai para o reino do torneio
    UI.msg('Você se inscreveu no Grande Torneio! Três lutas seguidas: vença todas para levar o prêmio.', 'gold');
    this.startDuel(ci, 0, 0, 0);
  },
  tourneyNext(ci, round) {
    const t = this.tourney(); if (!t) return;
    if (round >= 2) {
      t.won = true; P.gold += 500; Court.addFame(25); Court.addService(ci, 10); Game.addRelation(ci, 10);
      Progress.add('tourneys'); Progress.diary(`🏟️ Venceu o Grande Torneio de ${CIV_DEFS[ci].short}!`);
      Diplo.chronicle(`🏆 ${G.name} ${G.surname} venceu o Grande Torneio de ${Diplo.name(ci)}!`, true);
      UI.banner('🏆 Campeão do Grande Torneio!');
      return;
    }
    UI.msg(`Próxima luta do torneio (${round + 2}ª de 3) em instantes...`, 'gold');
    setTimeout(() => { if (G.state === 'play' && !P.dead) { P.hp = Math.max(P.hp, P.maxHp * 0.7); this.startDuel(ci, round + 1, 0, round + 1); } }, 1800);
  },

  // ------------------------------------------------------------ apostas em lutas de outros
  fightCard(ci) {
    const key = ci + '-' + G.day;
    if (!this.card || this.card.key !== key) {
      const a = { name: this.fighterName(), pow: U.rint(40, 100) }, b = { name: this.fighterName(), pow: U.rint(40, 100) };
      const pa = a.pow / (a.pow + b.pow);
      a.odds = Math.max(1.15, Math.round((0.92 / pa) * 10) / 10); b.odds = Math.max(1.15, Math.round((0.92 / (1 - pa)) * 10) / 10);
      this.card = { key, a, b, done: false };
    }
    return this.card;
  },
  bet(ci, side, amount) {
    const card = this.fightCard(ci);
    if (card.done || amount <= 0 || amount > P.gold) return;
    if (this.inColiseum(ci) && !this.show && !G.duel) { P.gold -= amount; card.done = true; this.watch(ci, card, side, amount); return; }
    P.gold -= amount; card.done = true;
    const f = card[side], other = card[side === 'a' ? 'b' : 'a'];
    const winA = Math.random() < card.a.pow / (card.a.pow + card.b.pow);
    const winner = winA ? card.a : card.b;
    setTimeout(() => {
      if (winner === f) { const g = Math.round(amount * f.odds); P.gold += g; UI.msg(`🎉 ${f.name} venceu ${other.name}! Você ganhou ${g} 🪙.`, 'gold'); Sound.play('coin'); }
      else UI.msg(`😩 ${winner.name} venceu. Você perdeu ${amount} 🪙.`, 'bad');
      UI.refresh();
    }, 1200);
    UI.msg(`A luta começou: ${card.a.name} × ${card.b.name}...`);
  },

  // a luta em que você apostou acontece na areia, com a plateia vibrando
  watch(ci, card, side, amount) {
    const c = this.center(ci), id = 9000 + (G.day % 900);
    const mk = (f, dx, col) => {
      const e = Game.spawn('champion', c.x + dx, c.y, { leash: 5 });
      e.faction = 'duelist'; e.battle = id; e.civ = dx < 0 ? 100 : 101; e.body = col; e.duelName = f.name; e.name = f.name; e.aggroOv = 20; e.siegeOf = 999; e.leash = 5 * TILE;
      e.hp = e.maxHp = 120 + f.pow * 2; e.dmg = Math.round(6 + f.pow / 10);
      return e;
    };
    const a = mk(card.a, -60, '#2a4a8a'), b = mk(card.b, 60, '#8e1f2a');
    this.show = { ci, a, b, side, amount, card, t: 0 };
    UI.close();
    UI.banner(`🏟️ ${card.a.name} × ${card.b.name}`);
    UI.msg(`Você apostou ${amount} 🪙 em ${card[side].name}. A plateia grita!`, 'gold');
    Sound.play('roar', { vol: 0.4 });
  },
  watchUpdate(dt) {
    const w = this.show; if (!w) return;
    w.t += dt;
    if (!this.inColiseum(w.ci)) { for (const e of [w.a, w.b]) e.dead = true; this.show = null; P.gold += w.amount; UI.msg('Você saiu da arena: a aposta foi devolvida.'); return; }
    if (!w.a.dead && !w.b.dead && w.t < 60) return;
    const winA = w.b.dead || (!w.a.dead && w.a.hp / w.a.maxHp >= w.b.hp / w.b.maxHp), winner = winA ? w.card.a : w.card.b, f = w.card[w.side];
    for (const e of [w.a, w.b]) e.dead = true;
    this.show = null;
    if (winner === f) { const g = Math.round(w.amount * f.odds); P.gold += g; UI.banner(`🎉 ${f.name} venceu!`); UI.msg(`🎉 ${f.name} venceu! Você ganhou ${g} 🪙.`, 'gold'); Sound.play('coin'); }
    else { UI.banner(`😩 ${winner.name} venceu`); UI.msg(`😩 ${winner.name} venceu. Você perdeu ${w.amount} 🪙.`, 'bad'); }
    Sound.play('roar', { vol: 0.3 });
  },

  // ------------------------------------------------------------ justa a cavalo (minijogo de pontaria)
  joustStart(ci, tier, bet) {
    if (!P.horse) { UI.msg('Você precisa de um cavalo para a justa.', 'bad'); return; }
    if (!Ride.here()) { UI.msg(`${P.horse.name} está esperando no estábulo. Vá buscá-lo para a justa.`, 'bad'); return; }
    if (bet > P.gold) bet = P.gold;
    P.gold -= bet;
    G.joust = { ci, tier, bet, pass: 0, me: 0, foe: 0, foeName: this.fighterName(), t0: performance.now(), log: [], over: false };
    UI.showJoust();
  },
  // posição da marca (0..1, vai e volta) no tempo atual
  joustPos() { const j = G.joust; const sp = 0.9 + j.tier * 0.35 + j.pass * 0.15; const t = ((performance.now() - j.t0) / 1000 * sp) % 2; return t < 1 ? t : 2 - t; },
  joustStrike() {
    const j = G.joust;
    if (!j || j.over) return;
    const pos = this.joustPos(), off = Math.abs(pos - 0.5);
    const mine = off < 0.04 ? 3 : off < 0.1 ? 2 : off < 0.18 ? 1 : 0;
    const skill = [0.35, 0.5, 0.65][j.tier];
    const r = Math.random(), foe = r < skill * 0.25 ? 3 : r < skill ? 2 : r < skill + 0.25 ? 1 : 0;
    j.me += mine; j.foe += foe; j.pass++;
    const txt = ['errou a lança', 'acertou de raspão', 'acertou o escudo', 'DERRUBOU o adversário!'];
    j.log.push(`${j.pass}ª passada: você ${txt[mine]} (${mine}) · ${j.foeName} ${txt[foe].replace('o adversário', 'você')} (${foe})`);
    Sound.play(mine >= 2 ? 'hit' : 'swing');
    if (mine === 3 && foe < 3) this.joustEnd(true);
    else if (foe === 3 && mine < 3) this.joustEnd(false);
    else if (j.pass >= 3) this.joustEnd(j.me > j.foe ? true : j.me < j.foe ? false : null);
    else j.t0 = performance.now() - Math.random() * 800;
  },
  joustEnd(win) {
    const j = G.joust; j.over = true;
    const t = ARENA_TIERS[j.tier];
    if (win === null) { P.gold += j.bet; j.result = 'Empate! A aposta foi devolvida.'; }
    else if (win) { const won = Math.round(j.bet * t.odds); P.gold += t.prize + won; Court.addFame(t.fame + 2); Court.addService(j.ci, 2); Progress.add('joustsWon'); j.result = `🏆 Vitória! Prêmio ${t.prize} 🪙${won ? ' + aposta ' + won + ' 🪙' : ''}.`; Sound.play('levelup'); }
    else j.result = `😵 ${j.foeName} venceu a justa.${j.bet ? ' Você perdeu a aposta.' : ''}`;
  },
};
