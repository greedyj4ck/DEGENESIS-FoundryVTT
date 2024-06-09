import { DegenesisChat } from "./chat.js";
import { DEGENESIS } from "./config.js";

export class DegenesisCombat extends Combat {
  constructor(...args) {
    super(...args);
  }

  /** @override */
  async rollInitiative(
    ids,
    { formula = null, updateTurn = true, messageOptions = {} } = {}
  ) {
    // return await super.rollInitiative(ids, {formula, updateTurn, messageOptions});
    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    // Iterate over Combatants, performing an initiative roll for each

    const updates = [];

    for (let [i, id] of ids.entries()) {
      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if (!combatant?.isOwner) return results;

      // Produce an initiative roll for the Combatant (depends on actor type)
      let initiativeValue;

      switch (combatant.actor.type) {
        case "fromhell": {
          initiativeValue = DegenesisCombat.rollInitiativeForFromHell(
            combatant.actor,
            messageOptions
          );
          break;
        }
        case "aberrant": {
          initiativeValue = DegenesisCombat.rollInitiativeForAberrant(
            combatant.actor,
            messageOptions
          );
          break;
        }

        default: {
          initiativeValue = DegenesisCombat.rollInitiativeFor(
            combatant.actor,
            messageOptions
          );
          break;
        }
      }

      updates.push({ _id: id, initiative: initiativeValue });
    }

    const initiativeValues = await Promise.all(
      updates.map((object) => object.initiative)
    );

    updates.forEach((object, index) => {
      object.initiative = initiativeValues[index];
    });

    if (!updates.length) return this;
    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", updates);
    // Ensure the turn order remains with the same combatant
    if (updateTurn) {
      const currentId = this.combatant.id;
      await this.updateSource({
        turn: this.turns.findIndex((t) => t.id === currentId),
      });
    }
    return this;
  }

  /** @override */
  async rollAll(options) {
    const ids = this.combatants.reduce((ids, c) => {
      if (c.isOwner && c.initiative === null) ids.push(c.id);
      return ids;
    }, []);
    return this.rollInitiative(ids, options);
  }

  /** @override */
  async rollNPC(options) {
    const ids = this.combatants.reduce((ids, c) => {
      if (c.isOwner && c.isNPC && c.initiative === null) ids.push(c.id);
      return ids;
    }, []);
    return this.rollInitiative(ids, options);
  }

  /** @override */
  async resetAll() {
    this.combatants.forEach((c) => {
      const actor = c.actor;
      if (!actor) return;
      actor.update({
        "system.state.initiative.value": 0,
        "system.state.initiative.actions": 1,
      });
    });
    return await super.resetAll();
  }

  static async rollInitiativeFor(actor, messageOptions = {}) {
    if (!actor) return 0;
    const spentEgo = actor.state.spentEgo.value;
    const { rollResults, cardData } = await actor.rollFightRoll("initiative", {
      skipDialog: messageOptions.skipDialog ? messageOptions.skipDialog : false,
      spentEgo,
    });
    let actionCount = 1;
    if (rollResults.triggers > 1) {
      actionCount = 1 + Math.floor(rollResults.triggers / 2);
    }
    let newEgo = actor.condition.ego.value;

    if (newEgo + spentEgo > actor.condition.ego.max) {
      ui.notifications.notify(
        `${actor.name} ${game.i18n.localize("UI.NotEnoughEgo")}`
      );
      return;
    }

    if (spentEgo > 0) {
      newEgo += spentEgo;

      if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;
      // Create a "modifier" item to give a bonus on the first roll.
      // Additionally, add a flag with the modifiers ID so it can be detected and deleted when rolling
      let spentEgoActionModifier = foundry.utils.deepClone(
        DEGENESIS.systemItems.spentEgoActionModifier
      );
      spentEgoActionModifier.system.number = spentEgo;
      spentEgoActionModifier.name = "Spent Ego Bonus";
      let modifier = await actor.createEmbeddedDocuments("Item", [
        spentEgoActionModifier,
      ]);
      await actor.setFlag(
        "degenesis",
        "spentEgoActionModifier",
        modifier[0].id
      );
      ui.notifications.notify("Ego Spent Action Modifier Added");

      cardData.spentEgo = spentEgo;
    }
    const initiativeValue = rollResults.successes;
    actor.update({
      "system.condition.ego.value": newEgo,
      "system.state.spentEgo.actionBonus": spentEgo,
      "system.state.spentEgo.value": 0,
      "system.state.initiative.value": initiativeValue,
      "system.state.initiative.actions": actionCount,
    });
    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }

  // FROM HELL ROUTINES

  static async rollInitiativeForFromHell(actor, messageOptions = {}) {
    if (!actor) return 0;
    const spentEgo = actor.state.spentEgo.value;
    const actionModifier = actor.general.actionModifier;

    const { rollResults, cardData } = await actor.rollFightRollFromHell(
      "initiative",
      actor.fighting.initiative + actionModifier,
      {
        skipDialog: messageOptions.skipDialog
          ? messageOptions.skipDialog
          : false,
        spentEgo,
      }
    );
    let actionCount = 1;

    if (rollResults.triggers > 1) {
      actionCount = 1 + Math.floor(rollResults.triggers / 2);
    }

    let newEgo = actor.condition.ego.value;

    if (newEgo + spentEgo > actor.condition.ego.max) {
      ui.notifications.notify(
        `${actor.name} ${game.i18n.localize("UI.NotEnoughEgo")}`
      );
      return;
    }

    if (spentEgo > 0) {
      newEgo += spentEgo;
      if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;

      let spentEgoActionModifier = foundry.utils.deepClone(
        DEGENESIS.systemItems.spentEgoActionModifier
      );

      spentEgoActionModifier.system.number = spentEgo;
      spentEgoActionModifier.name = "Spent Ego Bonus";

      let modifier = await actor.createEmbeddedDocuments("Item", [
        spentEgoActionModifier,
      ]);

      await actor.setFlag(
        "degenesis",
        "spentEgoActionModifier",
        modifier[0].id
      );

      ui.notifications.notify("Ego Spent Action Modifier Added");

      cardData.spentEgo = spentEgo;
    }
    const initiativeValue = rollResults.successes;
    actor.update({
      "system.condition.ego.value": newEgo,
      "system.state.spentEgo.actionBonus": spentEgo,
      "system.state.spentEgo.value": 0,
      "system.state.initiative.value": initiativeValue,
      "system.state.initiative.actions": actionCount,
    });
    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }

  // ABERRANT ROUTINES

  static async rollInitiativeForAberrant(actor, messageOptions = {}) {
    if (!actor) return 0;

    const actionModifier = actor.general.actionModifier;
    let spentPoints;

    if (actor.system.phase === "primal") {
      spentPoints = actor.state.spentSpore.value;
    } else {
      spentPoints = actor.state.spentEgo.value;
    }

    let spentEgo = spentPoints;

    const { rollResults, cardData } = await actor.rollFightRollFromHell(
      "initiative",
      actor.fighting.initiative + actionModifier,
      {
        skipDialog: messageOptions.skipDialog
          ? messageOptions.skipDialog
          : false,
        spentEgo,
      }
    );

    let actionCount = 1;

    if (rollResults.triggers > 1) {
      actionCount = 1 + Math.floor(rollResults.triggers / 2);
    }

    const initiativeValue = rollResults.successes;

    if (actor.system.phase === "primal") {
      let newSpore = actor.condition.spore.value;
      if (spentPoints > 0) {
        newSpore -= spentPoints;
        if (newSpore < 0) newSpore = 0;

        let spentSporeActionModifier = foundry.utils.deepClone(
          DEGENESIS.systemItems.spentSporeActionModifier
        );

        spentSporeActionModifier.system.number = spentPoints;
        spentSporeActionModifier.name = "Spent Spore Bonus";

        let modifier = await actor.createEmbeddedDocuments("Item", [
          spentSporeActionModifier,
        ]);
        await actor.setFlag(
          "degenesis",
          "spentSporeActionModifier",
          modifier[0].id
        );

        ui.notifications.notify(
          game.i18n.localize("UI.SpentSporeNotification")
        );

        actor.update({
          "system.condition.spore.value": newSpore,
          "system.state.spentSpore.actionBonus": spentPoints,
          "system.state.spentSpore.value": 0,
          "system.state.initiative.value": initiativeValue,
          "system.state.initiative.actions": actionCount,
        });
        cardData.spentSpore = spentPoints;
      }
    } else {
      let newEgo = actor.condition.ego.value;
      if (newEgo + spentEgo > actor.condition.ego.max) {
        ui.notifications.notify(
          `${actor.name} ${game.i18n.localize("UI.NotEnoughEgo")}`
        );
        return;
      }
      if (spentPoints > 0) {
        newEgo += spentPoints;
        if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;

        let spentEgoActionModifier = foundry.utils.deepClone(
          DEGENESIS.systemItems.spentEgoActionModifier
        );

        spentEgoActionModifier.system.number = spentPoints;
        spentEgoActionModifier.name = "Spent Ego Bonus";

        let modifier = await actor.createEmbeddedDocuments("Item", [
          spentEgoActionModifier,
        ]);

        await actor.setFlag(
          "degenesis",
          "spentEgoActionModifier",
          modifier[0].id
        );

        ui.notifications.notify(game.i18n.localize("UI.SpentEgoNotification"));
        cardData.spentEgo = spentPoints;
        actor.update({
          "system.condition.ego.value": newEgo,
          "system.state.spentEgo.actionBonus": spentPoints,
          "system.state.spentEgo.value": 0,
          "system.state.initiative.value": initiativeValue,
          "system.state.initiative.actions": actionCount,
        });
      }
    }

    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }
}
