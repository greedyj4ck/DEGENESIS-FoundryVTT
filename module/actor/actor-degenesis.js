import { DEGENESIS } from "../config.js";
import { DegenesisDice } from "../dice.js";
import { DegenesisChat } from "../chat.js";
import { ModifierManager } from "../modifier-manager.js";
import { AutomateEncumbrancePenalty } from "../settings.js";

// CLEANED UP IMPORTS
import { DegenesisItem } from "../item/item-degenesis.js";
import { DEG_Utility } from "../utility.js";

// Dunno why the code looks like this but it works ¯\_(ツ)_/¯

/**
 * Extend FVTT Actor class for Degenesis functionality
 * @extends {Actor}
 */

export class DegenesisActor extends Actor {
  // TODO: CHECK IF UPDATESOURCE IS VALID METHOD FOR TOKEN
  // this.data.update -> this.updateSource

  // REGION | _PRE METHODS

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    // Set wounds, advantage, and display name visibility
    if (!data.prototypeToken)
      this.updateSource({
        "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL, // Default disposition to neutral
        "token.name": data.name, // Set token name to actor name
        "token.img": "systems/degenesis/assets/tokens/default.png",
      });

    // Default characters to HasVision = true and Link Data = true
    if (data.type == "character") {
      this.updateSource({ "token.vision": true });
      this.updateSource({ "token.actorLink": true });
    }

    if (!data.img)
      this.updateSource({ img: "systems/degenesis/assets/tokens/default.png" });
  }

  async _preUpdate(updateData, options, user) {
    await super._preUpdate(updateData, options, user);

    // Reset the opposing skill if a skill value is changed. i.e. if faith is changed, set willpower to 0
    if (getProperty(updateData, "system.skills.faith.value"))
      setProperty(updateData, "system.skills.willpower.value", 0);
    else if (getProperty(updateData, "system.skills.willpower.value"))
      setProperty(updateData, "system.skills.faith.value", 0);
    else if (getProperty(updateData, "system.skills.focus.value"))
      setProperty(updateData, "system.skills.primal.value", 0);
    else if (getProperty(updateData, "system.skills.primal.value"))
      setProperty(updateData, "system.skills.focus.value", 0);
  }

  // REGION | DATA PREPARATION

  prepareData() {
    // Actor character type
    if (this.type === "character") {
      try {
        super.prepareData();
        this.itemCategories = this.itemTypes;
        this.modifiers = new ModifierManager(this);

        this.condition.ego.max =
          this.condition.ego.override ||
          (this.focusOrPrimal.value +
            this.attributes[this.focusOrPrimal.attribute].value) *
            2;
        this.condition.spore.max =
          this.condition.spore.override ||
          (this.faithOrWillpower.value +
            this.attributes[this.faithOrWillpower.attribute].value) *
            2;
        this.condition.fleshwounds.max =
          this.condition.fleshwounds.override ||
          (this.attributes.body.value + this.skills.toughness.value) * 2;
        this.condition.trauma.max =
          this.condition.trauma.override ||
          this.attributes.body.value + this.attributes.psyche.value;
        this.general.encumbrance.max =
          this.general.encumbrance.override ||
          this.attributes.body.value + this.skills.force.value;

        this.prepareItems();

        // CONDITIONAL FOR AUTOMATIC ENCUMBRANCE PENALTY
        if (AutomateEncumbrancePenalty()) {
          this.modifiers.addEncumbranceModifiers(this);
        }

        this.general.actionModifier = this.modifiers.action.D;
        this.general.movement =
          this.attributes.body.value +
          this.skills.athletics.value +
          (this.modifiers.movement || 0);
        this.fighting.initiative =
          this.attributes.psyche.value +
          this.skills.reaction.value +
          this.modifiers.action.D +
          this.modifiers.initiative.D;
        this.fighting.dodge =
          this.attributes.agility.value +
          this.skills.mobility.value +
          this.modifiers.action.D +
          this.modifiers.dodge.D;
        this.fighting.mentalDefense =
          this.attributes.psyche.value +
          this.faithOrWillpower.value +
          this.modifiers.action.D +
          this.modifiers.mentalDefense.D;
        this.fighting.passiveDefense =
          1 +
          this.state.cover.value +
          (this.state.motion ? 1 : 0) +
          (this.state.active ? 1 : 0) +
          (this.modifiers.p_defense || 0);
      } catch (e) {
        console.error(e);
      }
    }

    // DATA PREPARATION | FROM HELL ACTOR

    if (this.type === "fromhell") {
      try {
        super.prepareData();
        this.itemCategories = this.itemTypes;
        this.modifiers = new ModifierManager(this);

        this.general.actionModifier = this.modifiers.action.D;
        this.prepareFromHellItems();
      } catch (e) {
        console.error(e);
      }
    }

    // Npc actor type
    if (this.type === "npc") {
      try {
        super.prepareData();

        // Here will come data preparation code for NPC actor
      } catch (e) {
        console.error(e);
      }
    }

    // Abberant actor type

    if (this.type === "abberant") {
      try {
        super.prepareData();

        // Here will come data preparation code for Abberant actor
      } catch (e) {
        console.error(e);
      }
    }
  }

  prepareItems() {
    let encumbrance = this.general.encumbrance;

    let armor = {
      equipment: 0,
      modifier: 0,
    };

    let inContainers = [];
    for (let i of this.items) {
      i.prepareOwnedData();
      if (i.location) {
        inContainers.push(i);
        continue;
      } else if (i.encumbrance && i.type != "transportation") {
        encumbrance.current += i.encumbrance * i.quantity;
      }

      if (i.type == "armor" && i.equipped) {
        if (armor.equipment == 0) {
          armor.equipment += i.AP;
        } else if (armor.equipment <= 3 && i.AP <= armor.equipment) {
          armor.equipment += 1;
        } else if (armor.equipment <= 3 && i.AP >= armor.equipment) {
          armor.equipment = i.AP + 1;
        } else if (i.AP >= armor.equipment && armor.equipment >= 4) {
          armor.equipment = i.AP;
        }
      }

      // Modifiers fix

      if (i.type == "modifier" && i.enabled) {
        if (i.action == "armor") {
          armor.modifier += i.modifyNumber;
        }
        if (i.action == "p_defense") {
          this.modifiers.p_defense += i.modifyNumber;
        }
      }
    }

    this.getItemTypes("transportation").map(
      (i) => (encumbrance.current += i.processTransportation().total)
    );

    encumbrance.pct = (encumbrance.current / encumbrance.max) * 100;

    if (encumbrance.pct > 100) {
      encumbrance.over = true; // = "var(--degenesis-red)";
    } else {
      encumbrance.over = false;
    }

    this.general.armor += armor.equipment + armor.modifier;
  }

  prepareFromHellItems() {
    for (let i of this.items) {
      i.prepareOwnedData();
    }
  }

  // ROLL SETUP
  setupSkill(skill) {
    let dialogData = {
      title: DEGENESIS.skills[skill],
      prefilled: this.modifiers.forDialog("skill", skill),
      customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: true,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };
    dialogData.rollMethod = this.rollSkill;
    // ADD PREFILLED DICE MODIFIERS FOR TOTALROLLMODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/roll-card.html",
      DEGENESIS.skills[skill]
    );

    let rollData = {
      skill: this.system.skills[skill],
      actionNumber: this.getSkillTotal(skill),
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    //let rollResult = await DegenesisDice.rollAction(rollData)
    return { dialogData, cardData, rollData };
  }

  // SIMPLE DICE ROLL SETUP
  setupDice(type, dice) {
    let dialogData = {
      title: DEGENESIS.diceRolls[type],
      // prefilled: this.modifiers.forDialog("skill", skill),
      // customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: false,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };
    dialogData.rollMethod = this.rollDice;
    // ADD PREFILLED DICE MODIFIERS FOR TOTALROLLMODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/roll-card.html",
      DEGENESIS.diceRolls[type]
    );

    let rollData = {
      type: type,
      actionNumber: dice,
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    //let rollResult = await DegenesisDice.rollAction(rollData)
    return { dialogData, cardData, rollData };
  }

  setupWeapon(
    weapon,
    { use = "attack", secondary = false, secondarySkill = "" }
  ) {
    let skill = secondary
      ? secondarySkill || weapon.secondarySkill
      : weapon.skill;
    let dialogData = {
      title: `Weapon - ${weapon.name}`,
      prefilled: this.modifiers.forDialog("weapon", skill, use),
      secondarySkill: weapon.secondarySkill,
      customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: true,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };
    dialogData.rollMethod = this.rollWeapon;
    // ADD PREFILLED DICE MODIFIERS FOR TOTALROLLMODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/weapon-roll-card.html",
      weapon.name + " - " + DEGENESIS.skills[weapon.skill]
    );

    let rollData = {
      skill: this.skills[skill],
      actionNumber: use.includes("attack")
        ? weapon.dice.attack
        : weapon.dice.defense,
      weapon: weapon,
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    if (use && weapon.isRanged) {
      if (use == "attack-short") rollData.actionNumber = weapon.dice.effective;
      else if (use == "attack-far") rollData.actionNumber = weapon.dice.far;
      else if (use == "attack-extreme")
        rollData.actionNumber = weapon.dice.extreme;
    }

    if (secondary)
      rollData.actionNumber = this.getSkillTotal(
        secondarySkill || weapon.secondarySkill
      ); // weapon.dice uses primary skill, so override with secondary skill if using secondarry

    return { dialogData, cardData, rollData };
  }

  setupFightRoll(type, { skillOverride = "" } = {}) {
    let skill = skillOverride || DEGENESIS.fightRolls[type];
    let dialogData = {
      title: DEGENESIS.skills[skill],
      prefilled: this.modifiers.forDialog(type, skill),
      customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: true,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };
    dialogData.rollMethod = this.rollSkill;
    // ADD PREFILLED DICE MODIFIERS FOR TOTALROLLMODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/roll-card.html",
      DEGENESIS.skills[skill]
    );

    if (type == "initiative")
      cardData = this.constructCardData(
        "systems/degenesis/templates/chat/initiative-roll-card.html",
        DEGENESIS.skills[skill] + " - " + "Initiative"
      );

    let rollData = {
      skill: this.system.skills[skill],
      actionNumber: this.getSkillTotal(skill),
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    // Accounts for the action modifier
    rollData.actionNumber = this.fighting[type];

    return { dialogData, cardData, rollData };
  }

  constructCardData(template, cardTitle) {
    return {
      title: cardTitle,
      template,
      speaker: {
        alias: this.name,
        portrait: this.img,
      },
    };
  }

  // REGION | ROLL PROCESSING
  async rollSkill(skill, { skipDialog = false, override = {} }) {
    let { dialogData, cardData, rollData } = this.setupSkill(skill);

    for (const key in override) {
      dialogData[key] = override[key];
    }

    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }

    let rollResults = await DegenesisDice.rollAction(rollData);

    if (rollData.secondary)
      await this.handleSecondaryRoll(
        { dialogData, cardData, rollData, rollResults },
        this.setupSkill(rollData.secondary)
      );

    this.postRollChecks(rollResults, skill);

    DegenesisChat.renderRollCard(rollResults, cardData);

    return { rollResults, cardData };
  }

  /*  This is new dice rolling method that allows to pass pure 
      action dice number and description for simple rolls.  */

  async rollDice(dice, { skipDialog = false, override = {} }) {
    let { dialogData, cardData, rollData } = this.setupSkill(skill);

    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }

    let rollResults = await DegenesisDice.rollAction(rollData);

    if (rollData.secondary)
      await this.handleSecondaryRoll(
        { dialogData, cardData, rollData, rollResults },
        this.setupSkill(rollData.secondary)
      );

    this.postRollChecks(rollResults, skill);

    DegenesisChat.renderRollCard(rollResults, cardData);

    return { rollResults, cardData };
  }

  async rollWeapon(weapon, { skipDialog = false, use = "attack" }) {
    let { dialogData, cardData, rollData } = this.setupWeapon(weapon, { use });
    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }
    let rollResults = await DegenesisDice.rollAction(rollData);
    rollResults.weapon = weapon;
    if (rollData.secondary) {
      if (use == "attack-sonic")
        // Call with sonic flag so the card holds the relevant target difficulty information. More details in the method itself
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          }),
          { isSonicAttack: true }
        );
      else
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          })
        );
      cardData.title = `${weapon.name}<br>(${
        DEGENESIS.skills[weapon.skill]
      } + ${rollData.secondary || DEGENESIS.skills[weapon.secondarySkill]})`;
    }

    const fullDamage = weapon.fullDamage(rollResults.triggers, {
      modifier: this.modifiers.damage,
    });
    cardData.damageFull = `${fullDamage}`;
    if (rollData.weapon.isRanged)
      this.updateEmbeddedDocuments("Item", [
        {
          _id: rollData.weapon.id,
          "data.mag.current": rollData.weapon.mag.current - 1,
        },
      ]);
    this.postRollChecks(rollResults, "weapon");
    return { rollResults, cardData };
  }

  async rollFightRoll(type, { skipDialog = false, spentEgo = 0 }) {
    let { dialogData, cardData, rollData } = this.setupFightRoll(type);
    rollData.actionNumber += spentEgo;
    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }
    let rollResults = await DegenesisDice.rollAction(rollData);

    if (rollData.secondary)
      await this.handleSecondaryRoll(
        { dialogData, cardData, rollData, rollResults },
        this.setupFightRoll(type, { skillOverride: rollData.secondary })
      );

    this.postRollChecks(rollResults, type);
    return { rollResults, cardData };
  }

  // FROM HELL ROUTINES
  async rollFightRollFromHell(
    type,
    dice,
    { skipDialog = false, spentEgo = 0 }
  ) {
    let { dialogData, cardData, rollData } = this.setupFightRollFromHell(
      type,
      dice
    );

    rollData.actionNumber += spentEgo;

    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }

    let rollResults = await DegenesisDice.rollAction(rollData);

    if (rollData.secondary)
      await this.handleSecondaryRoll(
        { dialogData, cardData, rollData, rollResults },
        this.setupFightRoll(type, { skillOverride: rollData.secondary })
      );

    this.postRollChecks(rollResults, type);
    return { rollResults, cardData };
  }

  setupFightRollFromHell(type = {}, dice) {
    let dialogData = {
      title: DEGENESIS.diceRolls[type],
      prefilled: this.modifiers.forDialog(type), // NOT PASSING SKILL HERE AS THERE IS NO SUCH THING HERE,
      // customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dice-dialog.html", // DIFFERENT TEMPLATE FOR MOB ROLLS ?
      showSecondaryOption: false,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };

    // METHOD NEEDS TO BE CHANGED FOR SIMPLE ROLLS
    dialogData.rollMethod = this.rollDice;

    // ADD PREFILLED DICE MODIFIERS FOR TOTALROLLMODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/roll-card.html",
      DEGENESIS.diceRolls[type]
    );

    if (type == "initiative")
      cardData = this.constructCardData(
        "systems/degenesis/templates/chat/initiative-roll-card.html",
        DEGENESIS.diceRolls[type]
      );

    let rollData = {
      type: type,
      actionNumber: dice,
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    // ACCOUNTS FOR THE ACTION MODIFIER
    // THIS NEEDS TO BE REDONE OR DISABLED FOR FROM HELL ACTOR

    // rollData.actionNumber = this.fighting[type];

    return { dialogData, cardData, rollData };
  }

  async rollAttack(attack, { skipDialog = false, use = null }) {
    let { dialogData, cardData, rollData } = this.setupAttack(attack, { use });
    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }
    let rollResults = await DegenesisDice.rollAction(rollData);
    rollResults.weapon = attack;
    if (rollData.secondary) {
      if (use == "attack-sonic")
        // Call with sonic flag so the card holds the relevant target difficulty information. More details in the method itself
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          }),
          { isSonicAttack: true }
        );
      else
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          })
        );
      cardData.title = `${weapon.name}<br>(${
        DEGENESIS.skills[weapon.skill]
      } + ${rollData.secondary || DEGENESIS.skills[weapon.secondarySkill]})`;
    }

    const fullDamage = attack.fullDamage(rollResults.triggers, {
      modifier: this.modifiers.damage,
    });
    cardData.damageFull = `${fullDamage}`;

    this.postRollChecks(rollResults, "weapon");
    return { rollResults, cardData };
  }

  async rollDefense(defense, { skipDialog = false, use = null }) {
    let { dialogData, cardData, rollData } = this.setupDefense(defense, {
      use,
    });
    if (!skipDialog)
      rollData = await DegenesisDice.showRollDialog({ dialogData, rollData });
    else {
      rollData.diceModifier = dialogData.prefilled.diceModifier;
      rollData.successModifier = dialogData.prefilled.successModifier;
      rollData.triggerModifier = dialogData.prefilled.triggerModifier;
    }
    let rollResults = await DegenesisDice.rollAction(rollData);
    rollResults.weapon = defense;

    if (rollData.secondary) {
      if (use == "attack-sonic")
        // Call with sonic flag so the card holds the relevant target difficulty information. More details in the method itself
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          }),
          { isSonicAttack: true }
        );
      else
        await this.handleSecondaryRoll(
          { dialogData, cardData, rollData, rollResults },
          this.setupWeapon(weapon, {
            use,
            secondary: true,
            secondarySkill: rollData.secondary,
          })
        );
      cardData.title = `${weapon.name}<br>(${
        DEGENESIS.skills[weapon.skill]
      } + ${rollData.secondary || DEGENESIS.skills[weapon.secondarySkill]})`;
    }

    this.postRollChecks(rollResults, "defense");
    return { rollResults, cardData };
  }

  setupAttack(attack, { use = "attack", secondary = false, skill = null }) {
    let dialogData = {
      title: `Attack - ${attack.name}`,
      prefilled: this.modifiers.forDialog("weapon", skill, use), // Investigate this
      customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: false,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };
    dialogData.rollMethod = this.rollAttack;
    // ADD PREFILLED DICE MODIFIERS FOR TOTAL ROLL MODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/weapon-roll-card.html",
      attack.name // Add attack title or description later
    );

    // Needs to be modified to match simple dice roll method
    let rollData = {
      type: "Test value",
      actionNumber: attack.dice.attack,
      weapon: attack,
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    // Uhmm.... needs to get back and change atack item structure
    if (use && !attack.isMelee) {
      if (use == "attack-short") rollData.actionNumber = attack.dice.effective;
      else if (use == "attack-far") rollData.actionNumber = attack.dice.far;
      else if (use == "attack-extreme")
        rollData.actionNumber = attack.dice.extreme;
    }

    // There will be no secondaries (i think...) ....
    if (secondary)
      rollData.actionNumber = this.getSkillTotal(
        secondarySkill || weapon.secondarySkill
      );

    return { dialogData, cardData, rollData };
  }

  setupDefense(defense, { use = "defense", secondary = false, skill = null }) {
    let dialogData = {
      title: `${defense.group} - ${defense.name}`,
      prefilled: this.modifiers.forDialog("defense", skill, use), // Investigate this
      customModifiers: this.modifiers.custom,
      template: "systems/degenesis/templates/apps/roll-dialog.html",
      showSecondaryOption: false,
      totalRollModifiers: {
        diceModifier: 0,
        successModifier: 0,
        triggerModifier: 0,
      },
    };

    dialogData.rollMethod = this.rollDefense;
    // ADD PREFILLED DICE MODIFIERS FOR TOTAL ROLL MODIFIERS
    dialogData.totalRollModifiers.diceModifier +=
      dialogData.prefilled.diceModifier;
    dialogData.totalRollModifiers.successModifier +=
      dialogData.prefilled.successModifier;
    dialogData.totalRollModifiers.triggerModifier +=
      dialogData.prefilled.triggerModifier;

    let cardData = this.constructCardData(
      "systems/degenesis/templates/chat/roll-card.html",
      `${DEGENESIS.defenseGroups[defense.group]} - ${defense.name}`
    );

    let actionNumber = defense.dice[defense.group];

    /*   switch(defense.group){
      case 'passive':
        actionNumber = defense.dice.passive;
        break;
      case 'activeMelee':
        actionNumber = defense.dice.activeMelee;
        break;
      case 'activeRanged':
        actionNumber = defense.dice.activeRanged;
        break;
      case 'mental':
        actionNumber = defense.dice.mental;
        break;
    } */

    // Needs to be modified to match simple dice roll method
    let rollData = {
      // type: "Test value",
      actionNumber: actionNumber,
      weapon: defense,
      difficulty: 0,
      diceModifier: 0,
      successModifier: 0,
      triggerModifier: 0,
    };

    // Uhmm.... needs to get back and change atack item structure

    // There will be no secondaries (i think...) ....
    if (secondary)
      rollData.actionNumber = this.getSkillTotal(
        secondarySkill || weapon.secondarySkill
      );

    return { dialogData, cardData, rollData };
  }

  async handleSecondaryRoll(
    { dialogData, cardData, rollData, rollResults } = {},
    secondary,
    { skipDialog = false, isSonicAttack = false } = {}
  ) {
    if (rollResults.result == "success") {
      secondary.dialogData.title +=
        " - " + game.i18n.localize("DGNS.Secondary");
      secondary.dialogData.prefilled.difficulty = rollData.difficulty;
      secondary.dialogData.showSecondaryOption = false; // Don't show a secondary option for secondary roll dialogs
      if (!skipDialog)
        rollData = await DegenesisDice.showRollDialog({
          dialogData: secondary.dialogData,
          rollData: secondary.rollData,
        });
      else {
        secondary.rollData.diceModifier =
          secondary.dialogData.prefilled.diceModifier;
        secondary.rollData.successModifier =
          secondary.dialogData.prefilled.successModifier;
        secondary.rollData.triggerModifier =
          secondary.dialogData.prefilled.triggerModifier;
      }

      cardData.title += " + " + secondary.cardData.title;

      // Don't use ego action modifier on secondary roll
      // This should not be required anymore :)
      /*   let actionModifier = this.getFlag("degenesis", "spentEgoActionModifier");
      if (actionModifier)
        secondary.rollData.diceModifier -=
          this.items.get(actionModifier)?.modifyNumber || 0; */

      let secondaryRollResults = await DegenesisDice.rollAction(
        secondary.rollData
      );

      // Sonic weaponry The target makes a mental defense roll gainst the highest roll of the Engineering + Domination combo (KAT166). Rendered in roll-card.html chat template
      let mostSuccesses =
        rollResults.successes > secondaryRollResults.successes
          ? rollResults.successes
          : secondaryRollResults.successes;
      if (isSonicAttack) cardData.mostSuccesses = mostSuccesses;

      rollResults.triggers += secondaryRollResults.triggers;
      rollResults.successes = secondaryRollResults.successes;
      rollResults.result = secondaryRollResults.result;
      rollResults.secondaryRolls = secondaryRollResults.rolls;
    } else if (!rollData.difficulty)
      ui.notifications.notify(
        game.i18n.localize("DGNS.SecondaryNeedsDifficulty")
      );
  }

  async postRollChecks(rollResults, type) {
    // CHEKING IF THERE WAS PREVIOUS EGO MODIFIER AND DELETE IT
    // USED WHEN ROLLING INITIATIVE WITH SPEND EGO VALUE

    let egoModifierId = this.getFlag("degenesis", "spentEgoActionModifier");
    if (egoModifierId) {
      await this.deleteEmbeddedDocuments("Item", [egoModifierId]);
      await this.update({ "flags.degenesis.-=spentEgoActionModifier": null });
      ui.notifications.notify("Used Ego Spend Action Modifier");
    }
    if (type !== "initiative" && this.state.initiative.actions > 1)
      await this.update({
        "data.state.initiative.actions": this.state.initiative.actions - 1,
      });
  }

  // REGION | CONVENIENCE HELPERS

  getItemTypes(type) {
    return (this.itemCategories || this.itemTypes)[type];
  }

  getSkillTotal(skill, options = { modifiers: false }) {
    let total =
      this.attributes[this.skills[skill].attribute].value +
      this.skills[skill].value;
    return options.modifiers
      ? total + this.modifiers.forDialog("skill", skill).diceModifier
      : total;
  }

  get faithOrWillpower() {
    if (this.skills.willpower.value) return this.skills.willpower;
    else if (this.skills.faith.value) return this.skills.faith;
    else return this.skills.willpower;
  }

  get focusOrPrimal() {
    if (this.skills.focus.value) return this.skills.focus;
    else if (this.skills.primal.value) return this.skills.primal;
    else return this.skills.focus;
  }

  // REGION | FORMATTED GETTERS

  get Concept() {
    return DEGENESIS.concepts[this.details.concept.value];
  }
  get Cult() {
    return DEGENESIS.cults[this.details.cult.value];
  }
  get Culture() {
    return DEGENESIS.cultures[this.details.culture.value];
  }

  // REGION | ITEM GETTERS

  get weaponItems() {
    return this.getItemTypes("weapon");
  }
  get armorItems() {
    return this.getItemTypes("armor");
  }
  get equipmentItems() {
    return this.getItemTypes("equipment");
  }
  get artifactItems() {
    return this.getItemTypes("artifact");
  }
  get ammunitionItems() {
    return this.getItemTypes("ammunition");
  }
  get transportationItems() {
    return this.getItemTypes("transportation");
  }
  get modItems() {
    return this.getItemTypes("mod");
  }
  get burnItems() {
    return this.getItemTypes("burn");
  }
  get potentialItems() {
    return this.getItemTypes("potential");
  }
  get modifierItems() {
    return this.getItemTypes("modifier");
  }
  get shieldItems() {
    return this.getItemTypes("shield");
  }
  get complicationItems() {
    return this.getItemTypes("complication");
  }
  get legacyItems() {
    return this.getItemTypes("legacy");
  }

  get attackItems() {
    return this.getItemTypes("attack");
  }

  get defenseItems() {
    return this.getItemTypes("defense");
  }

  // REGION | DATA GETTERS

  get general() {
    return this.system.general;
  }
  get fighting() {
    return this.system.fighting;
  }
  get state() {
    return this.system.state;
  }
  get details() {
    return this.system.details;
  }
  get attributes() {
    return this.system.attributes;
  }
  get skills() {
    return this.system.skills;
  }
  get condition() {
    return this.system.condition;
  }
  get backgrounds() {
    return this.system.backgrounds;
  }
  get scars() {
    return this.system.scars;
  }
  get relationships() {
    return this.system.relationships;
  }
}
