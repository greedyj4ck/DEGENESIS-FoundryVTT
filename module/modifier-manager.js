import { DEGENESIS } from "./config.js";

export class ModifierManager {
  constructor(actor) {
    /** @type {{ label?: string, labelKey?: string, value: number }[]} Dice (D) only, same order as applied to action.D */
    this.actionDiceBreakdown = [];
    /** @type {Object<string, Array<{name: string, D: number, S: number, T: number}>>} Sources for each modifier key */
    this._modifierSources = {};

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
      // Handle new effects array format
      const effectsToProcess = mod.system.effects && mod.system.effects.length > 0
        ? mod.system.effects
        : (mod.system.action ? [{ action: mod.system.action, type: mod.system.type, number: mod.system.number }] : []);

      effectsToProcess.forEach((effect) => {
        if (effect.action == "custom") {
          this.custom.push(mod);
        } else if (DEGENESIS.noType.includes(effect.action)) {
          if (!this[effect.action]) this[effect.action] = effect.number;
          else this[effect.action] += effect.number;
          // Track source
          if (!this._modifierSources[effect.action]) this._modifierSources[effect.action] = [];
          this._modifierSources[effect.action].push({ name: mod.name, value: Number(effect.number) || 0, type: "" });
        } else if (effect.action && effect.type) {
          if (!this[effect.action]) {
            this[effect.action] = {
              D: 0,
              S: 0,
              T: 0,
            };
          }
          const modifyType = effect.type === "D" ? "D" : (effect.type === "S" ? "S" : "T");
          const modifyNumber = Number(effect.number) || 0;
          this[effect.action][modifyType] += modifyNumber;
          // Track source
          if (!this._modifierSources[effect.action]) this._modifierSources[effect.action] = [];
          this._modifierSources[effect.action].push({ name: mod.name, value: modifyNumber, type: modifyType });
          if (
            effect.action === "action" &&
            modifyType === "D" &&
            modifyNumber
          ) {
            this.actionDiceBreakdown.push({
              label: mod.name,
              value: modifyNumber,
            });
          }
        }
      });
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
    if (actor.system.state.motion) {
      this.action.D -= 2;
      this.actionDiceBreakdown.push({
        labelKey: "DGNS.InMotion",
        value: -2,
      });
      if (!this._modifierSources["action"]) this._modifierSources["action"] = [];
      this._modifierSources["action"].push({ name: game.i18n.localize("DGNS.InMotion"), value: -2, type: "D" });
    }
    const traumaVal = Number(actor.system.condition.trauma.value) || 0;
    if (traumaVal) {
      this.action.D -= traumaVal;
      this.actionDiceBreakdown.push({
        labelKey: "DGNS.Trauma",
        value: -traumaVal,
      });
      if (!this._modifierSources["action"]) this._modifierSources["action"] = [];
      this._modifierSources["action"].push({ name: game.i18n.localize("DGNS.Trauma"), value: -traumaVal, type: "D" });
    }
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
      this.actionDiceBreakdown.push({
        labelKey: "DGNS.ActionModEncumbranceExcess",
        value: -penalty,
      });
      if (!this._modifierSources["action"]) this._modifierSources["action"] = [];
      this._modifierSources["action"].push({ name: game.i18n.localize("DGNS.Encumbrance"), value: -penalty, type: "D" });
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
      displayDice: 0,
      displaySuccess: 0,
      displayTrigger: 0,
      breakdown: [],
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
      // Skip internal properties
      if (modifier === "_modifierSources" || modifier === "actionDiceBreakdown" || modifier === "custom") continue;

      let useModifier = false;
      let showInDisplay = false;

      if (modifier == "action") {
        // Action modifier is always relevant for display
        showInDisplay = true;
        // But only added to prefilled calculation values for certain types
        // (for weapon/dodge/initiative it's already baked into actionNumber)
        if (type != "weapon" && type != "dodge" && type != "initiative") {
          useModifier = true;
        }
      } else if (modifier.includes("attr:")) {
        let attrMod = modifier.split(":")[1];
        if (attrMod == DEGENESIS.skillAttributes[skill]) {
          useModifier = true;
          showInDisplay = true;
        }
      } else if (modifier.includes("skill:")) {
        let skillMod = modifier.split(":")[1];
        if (skillMod == skill) {
          useModifier = true;
          showInDisplay = true;
        }
      } else if (
        (modifier == "attack" && use && use.includes("attack")) ||
        (modifier == "a_defense" && use == "defense") ||
        (modifier == "dodge" && type == "dodge") ||
        (modifier == "initiative" && type == "initiative") ||
        (modifier == "mentalDefense" && (type == "mentalDefense" || type == "mentalDefenseWill" || type == "mentalDefenseFaith"))
      ) {
        showInDisplay = true;
      }

      if (useModifier) {
        prefilled.diceModifier += this[modifier].D;
        prefilled.successModifier += this[modifier].S;
        prefilled.triggerModifier += this[modifier].T;
      }

      // Display values include ALL modifiers (even those baked into base dice)
      if (showInDisplay && this[modifier] && typeof this[modifier] === "object") {
        prefilled.displayDice += this[modifier].D || 0;
        prefilled.displaySuccess += this[modifier].S || 0;
        prefilled.displayTrigger += this[modifier].T || 0;

        // Build breakdown from source modifiers
        const sources = this._modifierSources?.[modifier] || [];
        sources.forEach((src) => {
          const display = (src.value > 0 ? "+" : "") + src.value + src.type;
          const color = src.value > 0 ? "#6bcf6b" : "#cf6b6b";
          prefilled.breakdown.push({ name: src.name, display, color });
        });
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
      // Skip internal properties
      if (modifier === "_modifierSources" || modifier === "actionDiceBreakdown" || modifier === "custom") continue;

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
