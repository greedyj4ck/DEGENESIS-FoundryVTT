import {DegenesisChat} from "./chat.js";
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
            actor.update({
                "data.state.initiative.value": 0,
                "data.state.initiative.actions": 1
            });
        });
        return await super.resetAll();
    }

    static rollInitiative(actor) {
        if (!actor) return 0;
        const spentEgo = actor.data.data.state.spentEgo.value;
        const {rollResults, cardData} = actor.rollFightRollSync("initiative", spentEgo);
        let actionCount = 1;
        if (rollResults.triggers > 1) {
            actionCount = 1 + Math.floor(rollResults.triggers / 2);
        }
        let newEgo = actor.data.data.condition.ego.value;
        if (spentEgo > 0) {
            newEgo += spentEgo;
            if (newEgo > actor.data.data.condition.ego.max)
                newEgo = actor.data.data.condition.ego.max;
            // Create a "modifier" item to give a bonus on the first roll.
            // Additionally, add a flag with the modifiers ID so it can be detected and deleted when rolling
            let spentEgoActionModifier = duplicate(DEGENESIS.systemItems.spentEgoActionModifier)
            spentEgoActionModifier.data.number = spentEgo;
            spentEgoActionModifier.name = "Spent Ego Bonus"
            actor.createEmbeddedEntity("OwnedItem", spentEgoActionModifier).then(i => {
                actor.setFlag("degenesis", "spentEgoActionModifier", i._id)
                ui.notifications.notify("Ego Spent Action Modifier Added")
            })
            cardData.spentEgo = spentEgo;
        }
        const initiativeValue = rollResults.successes;
        actor.update({
            "data.condition.ego.value": newEgo,
            "data.state.spentEgo.actionBonus": spentEgo,
            "data.state.spentEgo.value": 0,
            "data.state.initiative.value": initiativeValue,
            "data.state.initiative.actions": actionCount
        });
        cardData.initiative = initiativeValue;
        cardData.actions = actionCount;
        DegenesisChat.renderRollCard(rollResults, cardData);
        // console.log(`${actor.name} has initiative ${actor.data.data.state.initiative.value} and ${actor.data.data.state.initiative.actions} action(s) this round`);
        return initiativeValue;
    }
}
