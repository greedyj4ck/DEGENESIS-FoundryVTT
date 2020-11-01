import { DEGENESIS } from "./config.js"

export class DegenesisChat {



    static renderRollCard(rollResult, cardData)
    {
        rollResult.rolls.forEach(r => {
            r.img = `systems/degenesis/icons/dice-faces/d${r.result}.svg`
        })

        rollResult.result = DEGENESIS.rollResults[rollResult.result]

        mergeObject(cardData, rollResult);

        renderTemplate(cardData.template, cardData).then(html => {
            ChatMessage.create({
                content : html,
                //sound : CONFIG.sounds.dice,
                speaker : cardData.speaker,
            })
        })
    }
}