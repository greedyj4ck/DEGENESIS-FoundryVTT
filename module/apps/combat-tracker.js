import { DEG_Utility } from "../utility.js";

const { CombatTracker } = foundry.applications.sidebar.tabs;

/**
 * Extend FVTT CombatTracker class for Degenesis functionality
 * @extends { CombatTracker }
 *
 */
export class DegenesisCombatTracker extends CombatTracker {
	static DEFAULT_OPTIONS = {
		actions: {
			diamondClick: DegenesisCombatTracker.diamondClick,
			actionClick: DegenesisCombatTracker.actionClick,
			rollNPC: DegenesisCombatTracker.rollNPC,
			rollAll: DegenesisCombatTracker.rollAll,
		}
	}

	static PARTS = {
		header: {
			template: "templates/sidebar/tabs/combat/header.hbs"
		},
		tracker: {
			template: "systems/degenesis/templates/apps/combat-tracker.hbs",
			scrollable: [""]
		},
		footer: {
			template: "templates/sidebar/tabs/combat/footer.hbs"
		}
	};

	/**
	 * @inheritdoc
	 **/
	async _prepareTrackerContext(context, options) {
		await super._prepareTrackerContext(context, options);

		if (context.turns) {
			context.turns.forEach((turn) => {
				try {
					turn.flags = context.combat.combatants.get(turn.id)?.flags;
					turn.actorType = context.combat.combatants.get(turn.id)?.actor.type;
					turn.actor = context.combat.combatants.get(turn.id)?.actor;
					DEG_Utility.addDiamonds(turn.actor.system.state.spentEgo, 3);

					if (turn.actorType === "aberrant") {
						DEG_Utility.addDiamonds(turn.actor.system.state.spentSpore, 3);
					}
				} catch (error) {
					context.combat.deleteEmbeddedDocuments("Combatant", [turn.id]);
				}
			});
		}
	}

	static async rollAll(event) {
		let skipDialog = !event.ctrlKey;
		let updateTurn = this.viewed.round > 0 ? true : false;
		game.combat.rollAll({
			updateTurn: updateTurn,
			messageOptions: { skipDialog },
		});
	}

	static async rollNPC(event) {
		let skipDialog = !event.ctrlKey;
		let updateTurn = this.viewed.round > 0 ? true : false;
		game.combat.rollNPC({
			updateTurn: updateTurn,
			messageOptions: { skipDialog },
		});
	}

	static async actionClick(event) {
		event.preventDefault();
		event.stopPropagation();
		const btn = event.target;
		const li = btn.closest(".combatant");
		const combat = this.viewed;
		const c = combat.combatants.get(li.dataset.combatantId);
		const op = btn.dataset.op;

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

	static diamondClick(event) {
		event.preventDefault();
		event.stopPropagation();
		const btn = event.target?.closest("a");
		const li = btn.closest(".combatant");
		const combat = this.viewed;
		const c = combat.combatants.get(li.dataset.combatantId);

		let actorData = c.actor.toObject();
		let index = Number(btn.dataset.index);
		let target = $(btn)
			.parents(".diamond-row")
			.attr("data-target");

		let value = foundry.utils.getProperty(actorData, target);
		if (value == index + 1)
			// If the last one was clicked, decrease by 1
			foundry.utils.setProperty(actorData, target, index);
		// Otherwise, value = index clicked
		else foundry.utils.setProperty(actorData, target, index + 1); // If attribute selected
		let attributeElement = $(btn).parents(".attribute");
		if (attributeElement.length) {
			// Constrain attributes to be greater than 0
			if (foundry.utils.getProperty(actorData, target) <= 0)
				foundry.utils.setProperty(actorData, target, 1);
		}
		c.actor.update(actorData);
	}
}
