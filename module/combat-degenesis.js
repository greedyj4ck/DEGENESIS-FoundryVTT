import {DegenesisChat} from "./chat.js";
import {DegenesisDice} from "./dice.js";
import {DEGENESIS} from "./config.js";

export class DegenesisCombat extends Combat {
    constructor(...args) {
        super(...args);
    }

    /** @override */
    async rollInitiative(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {
        // return await super.rollInitiative(ids, {formula, updateTurn, messageOptions});
        // Structure input data
        ids = typeof ids === "string" ? [ids] : ids;
        // Iterate over Combatants, performing an initiative roll for each
        const updates = ids.reduce((updates, id) => {
            const c = this.getCombatant(id);
            if (!c || !c.owner) return updates;
            const actor = c.actor;
            const initiativeValue = DegenesisCombat.rollInitiative(actor);
            updates.push({_id: id, initiative: initiativeValue});
            return updates;
        }, []);
        if (!updates.length) return this;
        // Update multiple combatants
        await this.updateEmbeddedEntity("Combatant", updates);
        // Ensure the turn order remains with the same combatant
        if (updateTurn) {
            const currentId = this.combatant._id;
            await this.update({turn: this.turns.findIndex(t => t._id === currentId)});
        }
        return this;
    }

    /** @override */
    async resetAll() {
        this.data.combatants.forEach(c => {
            const actor = c.actor;
            if (!actor) return;
            DegenesisCombat.resetInitiativeState(actor);
            if (actor.data.data.state.spentEgo.actionBonus > 0) {
                actor.update({
                    "data.state.spentEgo.actionBonus": 0,
                    "data.state.initiative.actions": 1
                });
            }
            else {
                actor.update({
                    "data.state.initiative.actions": 1
                });
            }
        });
        return await super.resetAll();
    }

    static rollInitiative(actor) {
        if (!actor) return 0;
        this.resetInitiativeState(actor);
        const skill = DEGENESIS.fightRolls.initiative;
        const spentEgo = actor.data.data.state.spentEgo.value;
        const rollData = {
            skill: actor.data.data.skills[skill],
            actionNumber: actor.data.data.attributes[actor.data.data.skills[skill].attribute].value + actor.data.data.skills[skill].value + spentEgo
        };
        const {rollResults, cardData} = actor.rollFightRollSync("initiative");
        let actionCount = 1;
        if (rollResults.triggers > 1) {
            actionCount = 1 + Math.floor(rollResults.triggers / 2);
        }
        if (spentEgo > 0) {
            let newEgo = actor.data.data.condition.ego.value + spentEgo;
            if (newEgo > actor.data.data.condition.ego.max)
                newEgo = actor.data.data.condition.ego.max;
            
            // Create a "modifier" item to give a bonus on the first roll. Additionally, add a flag with the modifiers ID so it can be detected and deleted when rolling
            let spentEgoActionModifier = duplicate(DEGENESIS.systemItems.spentEgoActionModifier)
            spentEgoActionModifier.data.number = spentEgo;
            spentEgoActionModifier.name = "Spent Ego Bonus"
            actor.createEmbeddedEntity("OwnedItem", spentEgoActionModifier).then(i => {
                actor.setFlag("degenesis", "spentEgoActionModifier", i._id)
                ui.notifications.notify("Ego Spent Action Modifier Added")
            })
            actor.update({
                "data.condition.ego.value": newEgo,
                "data.state.spentEgo.actionBonus": spentEgo,
                "data.state.spentEgo.value": 0,
                "data.state.initiative.actions": actionCount
            });
            cardData.spentEgo = spentEgo;
        }
        const initiativeValue = rollResults.successes;
        // console.log(`${actor.name} has initiative ${actor.data.data.state.initiative.value} and ${actor.data.data.state.initiative.actions} action(s) this round`);
        cardData.initiative = initiativeValue;
        cardData.actions = actionCount;
        DegenesisChat.renderRollCard(rollResults, cardData);
        return initiativeValue;
    }

    static resetInitiativeState(actor) {
        actor.update({
            "data.state.initiative.value": 0,
            "data.state.initiative.actions": 1
        });
    }
}
