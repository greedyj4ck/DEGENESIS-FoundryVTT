import RollDialog from "./apps/roll-dialog.js"

export class DegenesisDice
{
    static async rollAction({actionNumber, difficulty = 0, diceModifier = 0, successModifier = 0, triggerModifier = 0}={}, {dsn = true, secondaryRollData=undefined}={}) {
        const [rollResult, roll] = await this.calculateRollResult({
            actionNumber,
            difficulty,
            diceModifier,
            successModifier,
            triggerModifier
        });
        if (game.dice3d && dsn)
            await game.dice3d.showForRoll(roll);
            
        return rollResult;
    }



    static async calculateRollResult({actionNumber, difficulty = 0, diceModifier = 0, successModifier = 0, triggerModifier = 0}) {
        let rollResult = {}

        let successes;
        let triggers = triggerModifier;
        let ones = 0;
        let result;
        let rolls = [];

        actionNumber += diceModifier
        let autoSuccesses = 0;
        if (actionNumber > 12) {
            autoSuccesses = actionNumber - 12;
            actionNumber = 12;
        }
        let roll = new Roll(`${actionNumber}d6cs>3`);
        await roll.roll();

        rolls = roll.terms[0].results;
        successes = roll.total + autoSuccesses + successModifier;

        rolls.forEach(r => {
            if (r.result == 6)
                triggers++;
            if (r.result == 1)
                ones++;
        })

        if (difficulty > 0) {
            if (successes >= difficulty) {
                result = "success"
            } else {
                result = "failure"
                if (ones > successes)
                    result = "botch"
            }
        }

        rollResult = {
            successes,
            triggers,
            ones,
            result,
            rolls
        }
        return [rollResult, roll];
    }

    static async showRollDialog({dialogData, rollData, cardData})
    {
        let html = await renderTemplate("systems/degenesis/templates/apps/roll-dialog.html", dialogData)
        return new Promise((resolve, reject) => {
            new RollDialog({
                content : html,
                title : dialogData.title,
                buttons : {
                    "roll" : {
                        label : "Roll",
                        callback : async (dlg) => {
                            rollData.difficulty = parseInt(dlg.find('[name="difficulty"]').val() || 0)
                            rollData.diceModifier = parseInt(dlg.find('[name="diceModifier"]').val() || 0)
                            rollData.successModifier = parseInt(dlg.find('[name="successModifier"]').val() || 0)
                            rollData.triggerModifier = parseInt(dlg.find('[name="triggerModifier"]').val() || 0)
                            resolve(rollData)
                        }
                    },
                close : reject
                },
                default: "roll",
                dialogData
            }, {classes : ["roll-dialog"]}).render(true)
        })
    }
}
