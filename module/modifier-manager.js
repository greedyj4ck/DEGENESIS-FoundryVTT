import { DEGENESIS } from "./config.js";

export class ModifierManager {
  constructor(actor) {
    let shields = actor.getItemTypes("shield").filter((i) => i.equipped);
    let shieldPassiveModifier = 0;
    let shieldActiveModifier = 0;
    let shieldAttackModifier = 0;

    shields.forEach((s) => {
      shieldActiveModifier += s.defense.D;
      shieldPassiveModifier += s.defense.p_defense;
      shieldAttackModifier += s.attack.D;
    });

    let modifierArray = actor.getItemTypes("modifier").filter((i) => i.enabled);
    this.custom = [];
    modifierArray.forEach((mod) => {
      if (mod.action == "custom") {
        this.custom.push(mod);
      } else if (DEGENESIS.noType.includes(mod.action)) {
        if (!this[mod.action]) this[mod.action] = mod.number;
        else this[mod.action] += mod.number;
      } else if (mod.action && mod.type) {
        if (!this[mod.action]) {
          this[mod.action] = {
            D: 0,
            S: 0,
            T: 0,
          };
        }
        this[mod.action][mod.modifyType] += mod.modifyNumber;
      }
    });
    if (!this["action"]) {
      this.action = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    if (!this["attack"]) {
      this.attack = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    if (!this["p_defense"]) {
      this.p_defense = 0;
    }
    if (!this["damage"]) {
      this.damage = 0;
    }
    if (!this["a_defense"]) {
      this.a_defense = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    if (!this["dodge"]) {
      this.dodge = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    if (!this["mentalDefense"]) {
      this.mentalDefense = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    if (!this["initiative"]) {
      this.initiative = {
        D: 0,
        S: 0,
        T: 0,
      };
    }
    this.action.D = actor.system.state.motion
      ? this.action.D - 2
      : this.action.D;
    this.action.D -= actor.system.condition.trauma.value;
    this.attack.D = this.attack.D
      ? this.attack.D + shieldAttackModifier
      : shieldAttackModifier;
    this.p_defense = this.p_defense
      ? this.p_defense + shieldPassiveModifier
      : shieldPassiveModifier;
    this.a_defense.D = this.a_defense.D
      ? this.a_defense.D + shieldActiveModifier
      : shieldActiveModifier;
  }

  addEncumbranceModifiers(actor) {
    if (
      actor.system.general.encumbrance &&
      actor.system.general.encumbrance.current >
        actor.system.general.encumbrance.max
    ) {
      let penalty =
        actor.system.general.encumbrance.current -
        actor.system.general.encumbrance.max;

      this.action.D -= penalty;
      // this.attack.D -= penalty;
    }
  }

  /**
   *
   * @param {String} type "weapon", "skill"  "initiative", "dodge", "action",
   * @param {String} skill Skill used
   * @param {String} use Some specifiec, "attack", "defense", etc
   */

  forDialog(type, skill = "none", use, phenomenon = null) {
    let prefilled = {
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    if (game.user.targets.size && use != "attack-sonic") {
      // Attack difficulty is target's passive defense by default
      prefilled.difficulty = Array.from(
        game.user.targets
      )[0].actor.system.fighting.passiveDefense;
    } else if (use == "attack-sonic")
      // Sonic attacks have no intrinsic difficulty (always are defended mentally), a simple success should suffice
      prefilled.difficulty = 1;

    if (type == "phenomenon" && phenomenon) {
      prefilled.overload = 0;
      prefilled.difficulty = phenomenon.level;
    }

    for (let modifier in this) {
      let useModifier = false;
      if (
        modifier == "action" &&
        type != "weapon" &&
        type != "dodge" &&
        type != "mentalDefense" &&
        type != "initiative" &&
        type != "phenomenon"
      ) {
        useModifier = true;
      } else if (modifier.includes("attr:")) {
        let attrMod = modifier.split(":")[1];
        if (attrMod == DEGENESIS.skillAttributes[skill]) useModifier = true;
      } else if (modifier.includes("skill:")) {
        let skillMod = modifier.split(":")[1];
        if (skillMod == skill) useModifier = true;
      }

      if (useModifier) {
        prefilled.diceModifier += this[modifier].D;
        prefilled.successModifier += this[modifier].S;
        prefilled.triggerModifier += this[modifier].T;
      }
    }
    return prefilled;
  }

  /**
   *
   * @param {String} type "weapon", "skill"  "initiative", "dodge", "action",
   * @param {String} skill Skill used
   * @param {String} use Some specifiec, "attack", "defense", etc
   */
  forSheet(type, skill, use) {
    let prefilled = {
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    for (let modifier in this) {
      let useModifier = false;
      if (
        modifier == "action" ||
        (modifier == "initiative" && type == "initiative") ||
        (modifier == "dodge" && type == "dodge") ||
        (modifier == "mentalDefense" && type == "mentalDefense") ||
        (modifier == "attack" && use == "attack") ||
        (modifier == "a_defense" && use == "defense")
      ) {
        useModifier = true;
      } else if (modifier.includes("attr:")) {
        let attrMod = modifier.split(":")[1];
        if (attrMod == DEGENESIS.skillAttributes[skill]) useModifier = true;
      } else if (modifier.includes("skill:")) {
        let skillMod = modifier.split(":")[1];
        if (skillMod == skill) useModifier = true;
      }

      if (useModifier) {
        prefilled.diceModifier += this[modifier].D;
        prefilled.successModifier += this[modifier].S;
        prefilled.triggerModifier += this[modifier].T;
      }
    }
    return prefilled;
  }
}
