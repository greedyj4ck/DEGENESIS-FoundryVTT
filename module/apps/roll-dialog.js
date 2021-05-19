

export default class RollDialog extends Dialog {

    _onValueChange()
    {
        let modifiers = this._getSelectedModifiers()

        this.diceModifierInput.val(this.userEntry.diceModifier + modifiers.diceModifier)
        this.successModifierInput.val(this.userEntry.successModifier + modifiers.successModifier)
        this.triggerModifierInput.val(this.userEntry.triggerModifier + modifiers.triggerModifier)
    }

    _getSelectedModifiers()
    {
        let totalMods = {
            diceModifier : 0,
            successModifier : 0,
            triggerModifier   : 0
        }
        this.customModifiers.val().forEach(i => {
            let index = Number(i)
            let modifierSelected = this.data.dialogData.customModifiers[index]

            switch (modifierSelected.modifyType) {
                case "D":
                    totalMods.diceModifier += modifierSelected.modifyNumber
                    break;
                case "S":
                    totalMods.successModifier += modifierSelected.modifyNumber
                    break;
                case "T":
                    totalMods.triggerModifier += modifierSelected.modifyNumber
                    break;
            }
        })
        return totalMods
    }

    submit(button)
    {   
        let difficulty = this.element.find("input[name='difficulty']").val()
        let secondary = this.element.find(".secondary-select").val()

        if (secondary && !difficulty)
            return ui.notifications.error(game.i18n.localize("DGNS.SecondaryNeedsDifficulty"))

        super.submit(button)
    }

    activateListeners(html)
    {
        super.activateListeners(html)

        $("input").focusin(function () {
            $(this).select();
        });
        
        this.userEntry = {
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0
        }
        this.diceModifierInput = html.find("input[name='diceModifier']").change(ev => {
            this.userEntry.diceModifier = Number(ev.target.value)
            this._onValueChange()

        })
        this.successModifierInput = html.find("input[name='successModifier']").change(ev => {
            this.userEntry.successModifier = Number(ev.target.value)
            this._onValueChange()

        })
        this.triggerModifierInput = html.find("input[name='triggerModifier']").change(ev => {
            this.userEntry.triggerModifier = Number(ev.target.value)
            this._onValueChange()

        })

        this.customModifiers = html.find(".custom-modifiers").change(ev => {
            this._onValueChange()
        })
    }
}