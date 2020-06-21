import { DEGENESIS } from "./config.js"

export class DegenesisChat {



    static renderRollCard(rollResult, cardData)
    {
        rollResult.rolls.forEach(r => {
            r.img = `systems/degenesis/icons/dice-faces/d${r.roll}.svg`
        })

        rollResult.result = DEGENESIS.rollResults[rollResult.result]


        renderTemplate(cardData.template, rollResult).then(html => {
            ChatMessage.create({
                content : html,
                //sound : CONFIG.sounds.dice,
                speaker : cardData.speaker,
                flavor : cardData.flavor
            })
        })
    }
}