// CLASS FOR CREATING ROLLDIALOG 

export default class RollDialog extends Dialog {

    _onValueChange()
    {
        // GRAB ALL THE CUSTOM MODIFIERS 
        let modifiers = this._getSelectedModifiers()

        // CALCULATE TOTAL MODIFIERS FOR ROLL
        this.data.dialogData.totalRollModifiers.diceModifier = this.userEntry.diceModifier + this.data.dialogData.prefilled.diceModifier + modifiers.diceModifier
        this.data.dialogData.totalRollModifiers.successModifier = this.userEntry.successModifier + this.data.dialogData.prefilled.successModifier + modifiers.successModifier
        this.data.dialogData.totalRollModifiers.triggerModifier =  this.userEntry.triggerModifier + this.data.dialogData.prefilled.triggerModifier + modifiers.triggerModifier     

        // UPDATE DISPLAYED TOTAL MODIFIERS
        this.TotalDiceModifierDiv[0].innerHTML = String(this.data.dialogData.totalRollModifiers.diceModifier) + 'D'
        this.TotalSuccessModifierDiv[0].innerHTML = String(this.data.dialogData.totalRollModifiers.successModifier) + 'S'
        this.TotalTriggerModifierDiv[0].innerHTML = String(this.data.dialogData.totalRollModifiers.triggerModifier) + 'T'
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


    resetValues() {

        // RESET BUTTON FUNCTIONALITY INSTEAD USING DEFAULT FORM RESET (ISSUES WITH REFRESHING VALUES)

        this.customModifiers.val(null);

        // SET USER ENTRY VALUES TO 0

        this.userEntry = {
            diceModifier : 0,
            successModifier: 0,
            triggerModifier : 0}

        this.diceModifierInput.val(0);
        this.successModifierInput.val(0)
        this.triggerModifierInput.val(0)

        // LAUNCH NEW CALCULATION
        this._onValueChange();

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
        
        // SETUP USER ENTRY TO 0

        this.userEntry = {
            diceModifier : 0, 
            successModifier : 0, 
            triggerModifier : 0, 
        }

        // FIND HTML TO UPDATE LATER AFTER VALUE CHANGES

        this.TotalDiceModifierDiv = html.find("div[id='TotalRollDiceModifier']");
        this.TotalSuccessModifierDiv = html.find("div[id='TotalRollSuccessModifier']");
        this.TotalTriggerModifierDiv = html.find("div[id='TotalRollTriggerModifier']");


        // ACTIVATE LISTENERS FOR INPUT FIELDS
        
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

        this.resetButton = html.find(".custom-modifiers-reset-button").click(ev => {
            this.resetValues()
        })
    }
}