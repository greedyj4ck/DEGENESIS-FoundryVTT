import { DEG_Utility } from "../utility.js";

/**
 * Extend FVTT CombatTracker class for Degenesis functionality
 * @extends { CombatTracker }
 *
 */
export class DegenesisCombatTracker extends CombatTracker {
  constructor(options) {
    super(options);
  }

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "combat",
      template: "systems/degenesis/templates/apps/combat-tracker.html",
      title: "COMBAT.SidebarTitle",
      scrollY: [".directory-list"],
    });
  }

  /** @inheritdoc */
  async getData(options) {
    let context = await super.getData(options);

    context.turns.forEach((turn) => {
      try {
        turn.flags = context.combat.combatants.get(turn.id)?.flags;
        turn.actorType = context.combat.combatants.get(turn.id)?.actor.type;
        turn.actor = context.combat.combatants.get(turn.id)?.actor;
        DEG_Utility.addDiamonds(turn.actor.system.state.spentEgo, 3);
      } catch (error) {
        context.combat.deleteEmbeddedDocuments("Combatant", [turn.id]);
      }
    });
    return context;
  }

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".diamond").click((ev) => this._onDiamondClick(ev));
    html.find(".action-add").click((ev) => this._onActionBtnClick(ev, "add"));
    html
      .find(".action-remove")
      .click((ev) => this._onActionBtnClick(ev, "remove"));

    html
      .find(".combat-button.initiative-all")
      .click((ev) => this._onInitiativeAllClick(ev));
    html
      .find(".combat-button.initiative-npc")
      .click((ev) => this._onInitiativeNPCClick(ev));
  }

  async _onInitiativeAllClick(event) {
    let skipDialog = !event.ctrlKey;
    let updateTurn = this.viewed.round > 0 ? true : false;
    game.combat.rollAll({
      updateTurn: updateTurn,
      messageOptions: { skipDialog: skipDialog },
    });
  }

  async _onInitiativeNPCClick(event) {
    let skipDialog = !event.ctrlKey;
    let updateTurn = this.viewed.round > 0 ? true : false;
    game.combat.rollNPC({
      updateTurn: updateTurn,
      messageOptions: { skipDialog: skipDialog },
    });
  }

  async _onActionBtnClick(event, op) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);

    let actorData = c.actor.toObject();
    let newValue;

    if (op === "add") {
      newValue = c.actor.system.state.initiative.actions + 1;
    } else if (op === "remove") {
      newValue = c.actor.system.state.initiative.actions - 1;
      if (newValue < 0) {
        newValue = 0;
      }
    }

    foundry.utils.setProperty(
      actorData,
      "system.state.initiative.actions",
      newValue
    );
    await c.actor.update(actorData);
  }

  async _onDiamondClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);

    let actorData = c.actor.toObject();
    let index = Number($(event.currentTarget).attr("data-index"));
    let target = $(event.currentTarget)
      .parents(".diamond-row")
      .attr("data-target");

    let value = foundry.utils.getProperty(actorData, target);
    if (value == index + 1)
      // If the last one was clicked, decrease by 1
      foundry.utils.setProperty(actorData, target, index);
    // Otherwise, value = index clicked
    else foundry.utils.setProperty(actorData, target, index + 1); // If attribute selected
    let attributeElement = $(event.currentTarget).parents(".attribute");
    if (attributeElement.length) {
      // Constrain attributes to be greater than 0
      if (foundry.utils.getProperty(actorData, target) <= 0)
        foundry.utils.setProperty(actorData, target, 1);
    }
    c.actor.update(actorData);
  }
}
