'use strict';
// Crianças e filhos:
//  • Ninguém (gente ou bicho) mata quem tem menos de 18 anos: menores não viram alvo e não levam dano de outros; só o
//    herói pode feri-los (e responde por isso).
//  • A partir dos 16 anos, os seus filhos podem ser armados e equipados (na conversa: "Armar e equipar") e podem ir
//    com você, sem pagar nada ("Vir comigo"), contando como seguidor.
const KIDS = {
  AGE_SAFE: 18, AGE_ARM: 16,
  minor(e) { return !!(e && e !== P && e.npc && e.npc.age < this.AGE_SAFE); },
  mine(p) { return !!p && p.alive && p.kin === 'child'; },
};

{
  // menores não são alvo de ninguém além do herói
  const ht0 = hostile;
  hostile = function (a, b) { if (b !== P && a !== P && KIDS.minor(b)) return false; return ht0(a, b); };
  const dm0 = Game.damage.bind(Game);
  Game.damage = function (target, amount, src) {
    if (KIDS.minor(target) && src && src !== P) { if (target.target === src) target.target = null; return; }
    return dm0(target, amount, src);
  };
  // os seus filhos de 16 anos ou mais: armar, equipar e levar com você
  const lac0 = Lifesim.acts.bind(Lifesim);
  Lifesim.acts = function (p, acts) {
    lac0(p, acts);
    if (!KIDS.mine(p) || p.age < KIDS.AGE_ARM) return;
    if (!p.capanga) {
      acts.push(['equipc', '🛡️ Armar e equipar']);
      acts.push(['kinjoin', '⚔️ Vir comigo']);
    }
  };
  const tka0 = UI.talkAct.bind(UI);
  UI.talkAct = function (d) {
    if (d && d.op === 'kinjoin') {
      const p = People.get(+d.id); if (!KIDS.mine(p) || p.age < KIDS.AGE_ARM || p.capanga) return;
      let r;
      if (Game.allies().length >= Game.followerCap()) r = { text: 'Eu iria, mas você já tem gente demais te seguindo.', note: 'Limite de seguidores atingido (construa casas e quartéis).' };
      else {
        for (const e of G.ents) if (e.npc === p) e.dead = true; G.spawned.delete(p.id);
        p.capanga = true; p.oldHome = p.home; p.equip = p.equip || {};
        Game.spawnCapanga(p);
        r = { text: 'Finalmente! Vou com você. Pode contar comigo.', note: `${p.name} agora segue você. Arme e equipe pela conversa; "Dispensar" manda de volta para casa.` };
      }
      this.showTalk(p.id, r); return;
    }
    if (d && (d.op === 'ceq' || d.op === 'equipc' || d.op === 'cun')) { const p = People.get(+d.id); if (p && KIDS.mine(p) && p.age >= KIDS.AGE_ARM) p.equip = p.equip || {}; }
    return tka0(d);
  };
}
