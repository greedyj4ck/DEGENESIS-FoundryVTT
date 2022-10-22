import { DEGENESIS } from "./config.js"
import { DEG_Utility } from "./utility.js";


export class DegenesisChat {

    static renderRollCard(rollResult, cardData) {
        rollResult.rolls.forEach(r => {
            r.img = `systems/degenesis/icons/dice-faces/d${r.result}.svg`
        })

        if (rollResult.secondaryRolls) {
            rollResult.secondaryRolls.forEach(r => {
                r.img = `systems/degenesis/icons/dice-faces/d${r.result}.svg`
            })
        }

        rollResult.enResult = rollResult.result // Original result before translation - used for styling
        rollResult.result = DEGENESIS.rollResults[rollResult.result]

        mergeObject(cardData, rollResult);

        renderTemplate(cardData.template, cardData).then(html => {
            let chatData = DEG_Utility.chatDataSetup(html, cardData.speaker); // Passing additional data here
            chatData.speaker = cardData.speaker;
            ChatMessage.create(chatData)
        })
    }
}