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
    const context = await super.getData(options);
    //context.icons = CONFIG.XWING.icons;

    context.turns.forEach((turn) => {
      //turn.flags = context.combat.combatants.get(turn.id)?.flags;
      turn.actorType = context.combat.combatants.get(turn.id)?.actor.type;
    });

    return context;
  }
}
