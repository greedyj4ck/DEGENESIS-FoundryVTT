import {DegenesisChat} from "./chat.js"

export class DegenesisDice 
{
    static async rollAction({actionNumber, difficulty=0, diceModifier=0, successModifier=0, triggerModifier=0})
    {
        let rollResult = {}

        let successes;
        let triggers = triggerModifier;
        let ones = 0;
        let result;
        let rolls = [];

        actionNumber += diceModifier
        let autoSuccesses = 0;
        if (actionNumber > 12)
        {
            autoSuccesses = actionNumber - 12;
            actionNumber = 12;
        }
        let roll = new Roll(`${actionNumber}d6cs>3`);
        if (game.dice3d)
            await game.dice3d.showForRoll(roll);
        

        rolls = roll.parts[0].rolls;
        successes = roll.total + autoSuccesses + successModifier;

        rolls.forEach(r => {
            if (r.roll == 6)
                triggers++;
            if (r.roll == 1)
                ones++;
        })

        if (difficulty > 0)
        {
            if (successes >= difficulty)
            {
                result = "success"
            }
            else 
            {
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
        return rollResult;
    }


    static async showRollDialog({dialogData, rollData, cardData})
    {
        return renderTemplate("systems/degenesis/templates/apps/roll-dialog.html", dialogData).then(html => {
            new Dialog({
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
                            let customModifiersIndices = dlg.find('[name="customModifiers"]').val().map(m => parseInt(m))
                            customModifiersIndices.forEach(index => {
                                let modifier = dialogData.customModifiers[index];
                                switch(modifier.type)
                                {
                                    case "D":
                                        rollData.diceModifier += modifier.number;
                                        break;
                                    case "S":
                                        rollData.successModifier += modifier.number;
                                        break;
                                    case "T":
                                        rollData.triggerModifier += modifier.number;
                                        break;
                                }
                            })

                            let rollResult = await DegenesisDice.rollAction(rollData)
                            DegenesisChat.renderRollCard(rollResult, cardData)
                        }
                    }
                }
            }, {classes : ["roll-dialog"]}).render(true)

        })
    }
}