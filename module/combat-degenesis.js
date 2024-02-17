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
            combatant.actor
          );
          break;
        }
        default: {
          initiativeValue = DegenesisCombat.rollInitiativeFor(combatant.actor);
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
      await this.update({
        turn: this.turns.findIndex((t) => t.id === currentId),
      });
    }
    return this;
  }

  /** @override */
  async resetAll() {
    this.combatants.forEach((c) => {
      const actor = c.actor;
      if (!actor) return;
      actor.update({
        "data.state.initiative.value": 0,
        "data.state.initiative.actions": 1,
      });
    });
    return await super.resetAll();
  }

  static async rollInitiativeFor(actor) {
    if (!actor) return 0;
    const spentEgo = actor.state.spentEgo.value;
    const { rollResults, cardData } = await actor.rollFightRoll("initiative", {
      skipDialog: true,
      spentEgo,
    });
    let actionCount = 1;
    if (rollResults.triggers > 1) {
      actionCount = 1 + Math.floor(rollResults.triggers / 2);
    }
    let newEgo = actor.condition.ego.value;
    if (spentEgo > 0) {
      newEgo += spentEgo;
      if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;
      // Create a "modifier" item to give a bonus on the first roll.
      // Additionally, add a flag with the modifiers ID so it can be detected and deleted when rolling
      let spentEgoActionModifier = foundry.utils.deepClone(
        DEGENESIS.systemItems.spentEgoActionModifier
      );
      spentEgoActionModifier.data.number = spentEgo;
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
      "data.condition.ego.value": newEgo,
      "data.state.spentEgo.actionBonus": spentEgo,
      "data.state.spentEgo.value": 0,
      "data.state.initiative.value": initiativeValue,
      "data.state.initiative.actions": actionCount,
    });
    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }

  // FROM HELL ROUTINES

  static async rollInitiativeForFromHell(actor) {
    if (!actor) return 0;
    const spentEgo = actor.state.spentEgo.value;
    const actionModifier = actor.general.actionModifier;

    const { rollResults, cardData } = await actor.rollFightRollFromHell(
      "initiative",
      actor.fighting.initiative + actionModifier,
      {
        skipDialog: false,
        spentEgo,
      }
    );
    let actionCount = 1;

    if (rollResults.triggers > 1) {
      actionCount = 1 + Math.floor(rollResults.triggers / 2);
    }

    let newEgo = actor.condition.ego.value;
    if (spentEgo > 0) {
      newEgo += spentEgo;
      if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;

      let spentEgoActionModifier = foundry.utils.deepClone(
        DEGENESIS.systemItems.spentEgoActionModifier
      );

      spentEgoActionModifier.data.number = spentEgo;
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
      "data.condition.ego.value": newEgo,
      "data.state.spentEgo.actionBonus": spentEgo,
      "data.state.spentEgo.value": 0,
      "data.state.initiative.value": initiativeValue,
      "data.state.initiative.actions": actionCount,
    });
    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }

  // ABERRANT ROUTINES

  static async rollInitiativeForAberrant(actor) {
    if (!actor) return 0;

    const actionModifier = actor.general.actionModifier;
    let spentPoints;

    if (actor.system.phase === "primal") {
      spentPoints = actor.state.spentSpore.value;
    } else {
      spentPoints = actor.state.spentEgo.value;
    }

    const { rollResults, cardData } = await actor.rollFightRollFromHell(
      "initiative",
      actor.fighting.initiative + actionModifier,
      {
        skipDialog: false,
        spentPoints,
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

        spentSporeActionModifier.data.number = spentPoints;
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
          "data.condition.spore.value": newSpore,
          "data.state.spentSpore.actionBonus": spentPoints,
          "data.state.spentSpore.value": 0,
          "data.state.initiative.value": initiativeValue,
          "data.state.initiative.actions": actionCount,
        });
        cardData.spentSpore = spentPoints;
      }
    } else {
      let newEgo = actor.condition.ego.value;
      if (spentPoints > 0) {
        newEgo += spentPoints;
        if (newEgo > actor.condition.ego.max) newEgo = actor.condition.ego.max;

        let spentEgoActionModifier = foundry.utils.deepClone(
          DEGENESIS.systemItems.spentEgoActionModifier
        );

        spentEgoActionModifier.data.number = spentPoints;
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
          "data.condition.ego.value": newEgo,
          "data.state.spentEgo.actionBonus": spentPoints,
          "data.state.spentEgo.value": 0,
          "data.state.initiative.value": initiativeValue,
          "data.state.initiative.actions": actionCount,
        });
      }
    }

    cardData.initiative = initiativeValue;
    cardData.actions = actionCount;
    DegenesisChat.renderRollCard(rollResults, cardData);

    return initiativeValue;
  }
}
