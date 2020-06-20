
export class DegenesisDice 
{
    
    static async rollAction({actionNumber, difficulty=0, dieBonus=0, successBonus=0, triggerBonus=0})
    {
        let rollResult = {}

        let successes;
        let triggers = triggerBonus;
        let ones = 0;
        let result;
        let rolls = [];

        let autoSuccesses = 0;
        if (actionNumber > 12)
        {
            autoSuccesses = actionNumber - 12;
            actionNumber = 12;
        }
        let roll = new Roll(`${actionNumber + dieBonus}d6cs>3`);
        if (game.dice3d)
            await game.dice3d.showForRoll(roll);
        

        rolls = roll.parts[0].rolls;
        successes = roll.total + autoSuccesses + successBonus;

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
}