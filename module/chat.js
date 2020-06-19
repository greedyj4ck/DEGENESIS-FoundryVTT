export class DegenesisChat {



    static renderRollCard(rollResult)
    {
        rollResult.rolls.forEach(r => {
            r.img = `systems/degenesis/icons/dice-faces/d${r.roll}.svg`
        })


        renderTemplate("systems/degenesis/templates/chat/roll-card.html", rollResult).then(html => {
            ChatMessage.create({content : html, sound : CONFIG.sounds.dice})
        })
    }
}