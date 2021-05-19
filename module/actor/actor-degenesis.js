import {DEGENESIS} from "../config.js";
import {DEG_Utility} from "../utility.js";
import {DegenesisDice} from "../dice.js";
import {DegenesisItem} from "../item/item-degenesis.js";
import ModifierManager from "../modifier-manager.js";

/**
 * Extend FVTT Actor class for Degenesis functionality
 * @extends {Actor}
 */
export class DegenesisActor extends Actor {


    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user)
        // Set wounds, advantage, and display name visibility
        if (!data.token)
            this.data.update(
                {
                    "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
                    "token.name": data.name,                                       // Set token name to actor name
                    "token.img" : "systems/degenesis/assets/tokens/default.png",
                })

        // Default characters to HasVision = true and Link Data = true
        if (data.type == "character") {
            this.data.update({"token.vision" :  true});
            this.data.update({"token.actorLink" :  true});
        }

        if (!data.img)
            this.data.update({img : "systems/degenesis/assets/tokens/default.png"})

    }

    async _preUpdate(updateData, options, user) {

        await super._preUpdate(updateData, options, user)

        // Reset the opposing skill if a skill value is changed. i.e. if faith is changed, set willpower to 0
        if (getProperty(updateData, "data.skills.faith.value"))
            setProperty(updateData, "data.skills.willpower.value", 0)

        else if (getProperty(updateData, "data.skills.willpower.value"))
            setProperty(updateData, "data.skills.faith.value", 0)

        else if (getProperty(updateData, "data.skills.focus.value"))
            setProperty(updateData, "data.skills.primal.value", 0)

        else if (getProperty(updateData, "data.skills.primal.value"))
            setProperty(updateData, "data.skills.focus.value", 0)

    }


    //#region Data Preparation
    prepareData() 
    {
        try
        {
            super.prepareData();
            const data = this.data.data;
            this.itemCategories = this.itemTypes
            this.modifiers = new ModifierManager(this);
    
           data.condition.ego.max =           data.condition.ego.override || (this.focusOrPrimal.value + data.attributes[this.focusOrPrimal.attribute].value) * 2;
           data.condition.spore.max =         data.condition.spore.override || (this.faithOrWillpower.value + data.attributes[this.faithOrWillpower.attribute].value) * 2
           data.condition.fleshwounds.max =   data.condition.fleshwounds.override || (data.attributes.body.value + data.skills.toughness.value) * 2 
           data.condition.trauma.max =        data.condition.trauma.override || (data.attributes.body.value + data.attributes.psyche.value);
           data.general.encumbrance.max =     data.general.encumbrance.override || (data.attributes.body.value + data.skills.force.value);

            this.prepareItems();
            this.modifiers.addEncumbranceModifiers(this)

            data.general.actionModifier = this.modifiers.action.D
            data.general.movement =        data.attributes.body.value + data.skills.athletics.value + (this.modifiers.movement || 0)
            data.fighting.initiative =     data.attributes.psyche.value + data.skills.reaction.value + this.modifiers.action.D + this.modifiers.initiative.D;
            data.fighting.dodge =          data.attributes.agility.value + data.skills.mobility.value + this.modifiers.action.D + this.modifiers.dodge.D;
            data.fighting.mentalDefense =  data.attributes.psyche.value + this.faithOrWillpower.value + this.modifiers.action.D + this.modifiers.mentalDefense.D;
            data.fighting.passiveDefense = 1 + data.state.cover.value + (data.state.motion ? 1 : 0) + (data.state.active ? 1 : 0) + (this.modifiers.p_defense || 0);

        }
        catch(e)
        {
            console.error(e);
        }
    }
     



    prepareItems() {

        let encumbrance = this.general.encumbrance

        let armor = {
            equipment : 0,
            modifier : 0,
        }

        let inContainers = [];
        for (let i of this.items) 
        {
            i.prepareOwnedData()
            if (i.location)
            {
                inContainers.push(i);
                continue
            }
            else if (i.encumbrance && i.type != "transportation")
            {
                encumbrance.current += i.encumbrance * i.quantity
            }

            if (i.type == "armor" && i.equipped)
            {
                if (armor.equipment == 0) {
                    armor.equipment += i.AP;
                }
                else if (armor.equipment <= 3 && i.AP <= armor.equipment) {
                    armor.equipment += 1;
                }
                else if (armor.equipment <= 3 && i.AP >= armor.equipment) {
                    armor.equipment = i.AP + 1;
                }
                else if (i.AP >= armor.equipment && armor.equipment >= 4) {
                    armor.equipment = i.AP;
                }  
            }

            if (i.type == "modifier") {
                if (i.action == "armor") {
                    armor.modifier += i.modifyNumber;
                }
            }
        }

        this.getItemTypes("transportation").map(i => encumbrance.current += i.processTransportation().total)

        encumbrance.pct = encumbrance.current / encumbrance.max * 100;

        if (encumbrance.pct > 100) {
            encumbrance.over = true// = "var(--degenesis-red)";
        } else {
            encumbrance.over = false;
        }

        this.general.armor += armor.equipment + armor.modifier

    }

    //#endregion

    //#region Roll Setup
    setupSkill(skill) {
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.modifiers.forDialog("skill", skill),
            customModifiers : this.modifiers.custom,
            template : "systems/degenesis/templates/apps/roll-dialog.html",
            showSecondaryOption: true
        }
        dialogData.rollMethod = this.rollSkill;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/roll-card.html", DEGENESIS.skills[skill])

        let rollData = {
            skill : this.data.data.skills[skill],
            actionNumber : this.getSkillTotal(skill),
            difficulty : 0,
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0
        }

        //let rollResult = await DegenesisDice.rollAction(rollData)
        return {dialogData, cardData, rollData}
    }

    setupWeapon(weapon, {use="attack", secondary=false, secondarySkill=""}) {
        let skill = secondary ? (secondarySkill || weapon.secondarySkill) : weapon.skill
        let dialogData = {
            title : `Weapon - ${weapon.name}`,
            prefilled : this.modifiers.forDialog("weapon", skill, use),
            secondarySkill : weapon.secondarySkill,
            customModifiers : this.modifiers.custom,
            template : "systems/degenesis/templates/apps/roll-dialog.html",
            showSecondaryOption: true
        }
        dialogData.rollMethod = this.rollWeapon;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/weapon-roll-card.html", weapon.name + " - " + DEGENESIS.skills[weapon.skill])

        let rollData = {
            skill : this.skills[skill],
            actionNumber : use.includes("attack") ? weapon.dice.attack : weapon.dice.defense,
            weapon : weapon,
            difficulty : 0,
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0
        }

        if (use && weapon.isRanged)
        {
            if (use == "attack-short")
                rollData.actionNumber = weapon.dice.effective
            else if (use == "attack-far")
                rollData.actionNumber = weapon.dice.far
            else if (use == "attack-extreme")
                rollData.actionNumber = weapon.dice.extremes
        }

        if (secondary)
            rollData.actionNumber = this.getSkillTotal(weapon.secondarySkill) // weapon.dice uses primary skill, so override with secondary skill if using secondarry

        return {dialogData, cardData, rollData}
    }

    setupFightRoll(type, {skillOverride=""}={})
    {
        let skill = skillOverride || DEGENESIS.fightRolls[type]
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.modifiers.forDialog(type, skill),
            customModifiers : this.modifiers.custom,
            template : "systems/degenesis/templates/apps/roll-dialog.html",
            showSecondaryOption: true
        }
        dialogData.rollMethod = this.rollSkill;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/roll-card.html", DEGENESIS.skills[skill])

        if (type == "initiative")
            cardData = this.constructCardData("systems/degenesis/templates/chat/initiative-roll-card.html", DEGENESIS.skills[skill] + " - " + "Initiative") 

        let rollData = {
            skill : this.data.data.skills[skill],
            actionNumber : this.getSkillTotal(skill),
            difficulty : 0,
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0
        }

        // Accounts for the action modifier
        rollData.actionNumber = this.fighting[type]



        return {dialogData, cardData, rollData}
    }

    constructCardData(template, cardTitle) {
        return {
            title : cardTitle,
            template,
            speaker : {
                alias : this.data.name
            }
        }
    }

    //#endregion

    //#region Roll Processing
    async rollSkill(skill, {skipDialog = false}) 
    {
        let { dialogData, cardData, rollData } = this.setupSkill(skill)
        if (!skipDialog)
            rollData = await DegenesisDice.showRollDialog({ dialogData, rollData })
        else {
            rollData.diceModifier = dialogData.prefilled.diceModifier;
            rollData.successModifier = dialogData.prefilled.successModifier;
            rollData.triggerModifier = dialogData.prefilled.triggerModifier;
        }
        let rollResults = await DegenesisDice.rollAction(rollData)

        
        if (rollData.secondary)
            await this.handleSecondaryRoll({ dialogData, cardData, rollData, rollResults }, this.setupSkill(rollData.secondary) )   

        this.postRollChecks(rollResults, skill)
        return { rollResults, cardData }
    }

    async rollWeapon(weapon, { skipDialog = false, use = "attack"}) {
        let { dialogData, cardData, rollData } = this.setupWeapon(weapon, { use })
        if (!skipDialog)
            rollData = await DegenesisDice.showRollDialog({ dialogData, rollData })
        else {
            rollData.diceModifier = dialogData.prefilled.diceModifier;
            rollData.successModifier = dialogData.prefilled.successModifier;
            rollData.triggerModifier = dialogData.prefilled.triggerModifier;
        }
        let rollResults = await DegenesisDice.rollAction(rollData)
        rollResults.weapon = weapon
        if (rollData.secondary)
        {
            await this.handleSecondaryRoll({ dialogData, cardData, rollData, rollResults }, this.setupWeapon(weapon, { use , secondary : true, secondarySkill : rollData.secondary}) )   
            cardData.title = `${weapon.name}<br>(${DEGENESIS.skills[weapon.skill]} + ${DEGENESIS.skills[weapon.secondarySkill]})`
        }

        const fullDamage = weapon.fullDamage(rollResults.triggers, { modifier: this.modifiers.damage })
        cardData.damageFull = `${fullDamage}`;
        if (rollData.weapon.isRanged)
            this.updateEmbeddedDocuments("Item", [{ _id: rollData.weapon.id, "data.mag.current": rollData.weapon.mag.current - 1 }])
        this.postRollChecks(rollResults, "weapon")
        return { rollResults, cardData }
    }


    async rollFightRoll(type, { skipDialog = false, spentEgo = 0 }) {
        let { dialogData, cardData, rollData } = this.setupFightRoll(type)
        rollData.actionNumber += spentEgo;
        if (!skipDialog)
            rollData = await DegenesisDice.showRollDialog({ dialogData, rollData })
        else {
            rollData.diceModifier = dialogData.prefilled.diceModifier;
            rollData.successModifier = dialogData.prefilled.successModifier;
            rollData.triggerModifier = dialogData.prefilled.triggerModifier;
        }
        let rollResults = await DegenesisDice.rollAction(rollData)

        if (rollData.secondary)
            await this.handleSecondaryRoll({ dialogData, cardData, rollData, rollResults }, this.setupFightRoll(type, {skillOverride : rollData.secondary}) )   

        this.postRollChecks(rollResults, type)
        return { rollResults, cardData }
    }

    async handleSecondaryRoll({ dialogData, cardData, rollData, rollResults }={}, secondary, {skipDialog=false}={})
    {
        if (rollResults.result == "success")
        {
            secondary.dialogData.title += " - " + game.i18n.localize("DGNS.Secondary")
            secondary.dialogData.prefilled.difficulty = rollData.difficulty
            secondary.dialogData.showSecondaryOption = false; // Don't show a secondary option for secondary roll dialogs
            if (!skipDialog)
                rollData = await DegenesisDice.showRollDialog({ dialogData : secondary.dialogData, rollData : secondary.rollData })
            else {
                secondary.rollData.diceModifier =    secondary.dialogData.prefilled.diceModifier;
                secondary.rollData.successModifier = secondary.dialogData.prefilled.successModifier;
                secondary.rollData.triggerModifier = secondary.dialogData.prefilled.triggerModifier;
            }

            cardData.title+= " + " + secondary.cardData.title

            // Don't use ego action modifier on secondary roll
            let actionModifier = this.getFlag("degenesis", "spentEgoActionModifier");
            if (actionModifier)
                secondary.rollData.diceModifier -= (this.items.get(actionModifier)?.modifyNumber || 0)

            let secondaryRollResults = await DegenesisDice.rollAction(secondary.rollData)

            rollResults.triggers += secondaryRollResults.triggers;
            rollResults.successes = secondaryRollResults.successes;
            rollResults.result = secondaryRollResults.result
            rollResults.secondaryRolls = secondaryRollResults.rolls
        }
        else if (!rollData.difficulty)
            ui.notifications.notify(game.i18n.localize("DGNS.SecondaryNeedsDifficulty"))
    }

    async postRollChecks(rollResults, type)
    {
        let egoModifierId = this.getFlag("degenesis", "spentEgoActionModifier")
        if (egoModifierId)
        {
           await this.deleteEmbeddedDocuments("Item", [egoModifierId])
           await this.update({"flags.degenesis.-=spentEgoActionModifier" : null})
           ui.notifications.notify("Used Ego Spend Action Modifier")
        }
        if (type !== "initiative" && this.data.data.state.initiative.actions > 1)
            await this.update({"data.state.initiative.actions" : this.data.data.state.initiative.actions - 1})
    }
    //#endregion

    //#region Convenience Helpers
    getItemTypes(type)
    {
        return (this.itemCategories || this.itemTypes)[type]
    }

    getSkillTotal(skill, options = {modifiers : false})
    {
        let total =  this.attributes[this.skills[skill].attribute].value + this.skills[skill].value
        return options.modifiers ? total + this.modifiers.forDialog("skill", skill).diceModifier : total
    }
    //#endregion

    //#region Getters
    // @@@@@@@@ CALCULATION GETTERS @@@@@@
    get faithOrWillpower() {
        if (this.data.data.skills.willpower.value)
            return this.data.data.skills.willpower
        else if (this.data.data.skills.faith.value)
            return this.data.data.skills.faith
        else return this.data.data.skills.willpower
    }

    get focusOrPrimal() {
        if (this.data.data.skills.focus.value) return this.data.data.skills.focus
        else if (this.data.data.skills.primal.value)
            return this.data.data.skills.primal
        else return this.data.data.skills.focus
    }

    // @@@@@@@@ FORMATTED GETTERS @@@@@@@@
    get Concept() { return DEGENESIS.concepts[this.details.concept.value] }
    get Cult() { return DEGENESIS.cults[this.details.cult.value] }
    get Culture() { return DEGENESIS.cultures[this.details.culture.value] }

    // @@@@@@@ ITEM GETTERS @@@@@@@@@
    get weaponItems() {return this.getItemTypes("weapon")}
    get armorItems() {return this.getItemTypes("armor")}
    get equipmentItems() {return this.getItemTypes("equipment")}
    get artifactItems() {return this.getItemTypes("artifact")}
    get ammunitionItems() {return this.getItemTypes("ammunition")}
    get transportationItems() {return this.getItemTypes("transportation")}
    get modItems() {return this.getItemTypes("mod")}
    get burnItems() {return this.getItemTypes("burn")}
    get potentialItems() {return this.getItemTypes("potential")}
    get modifierItems() {return this.getItemTypes("modifier")}
    get shieldItems() {return this.getItemTypes("shield")}
    get complicationItems() {return this.getItemTypes("complication")}
    get legacyItems() {return this.getItemTypes("legacy")}
    
    // @@@@@@@@ DATA GETTERS @@@@@@@@@@
    get general() { return this.data.data.general}
    get fighting() { return this.data.data.fighting}
    get state() { return this.data.data.state}
    get details() { return this.data.data.details}
    get attributes() { return this.data.data.attributes}
    get skills() { return this.data.data.skills}
    get condition() { return this.data.data.condition}
    get backgrounds() { return this.data.data.backgrounds}
    get scars() { return this.data.data.scars}
    get relationships() { return this.data.data.relationships}
    //#endregion
}