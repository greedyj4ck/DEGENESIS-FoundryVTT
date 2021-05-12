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

        // Set wounds, advantage, and display name visibility
        if (!data.token)
            mergeObject(data,
                {
                    //"token.bar1": { "attribute": "status.wounds" },                 // Default Bar 1 to Wounds
                    //"token.bar2": { "attribute": "status.advantage" },               // Default Bar 2 to Advantage
                    "token.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display name to be on owner hover
                    "token.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display bars to be on owner hover
                    "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
                    "token.name": data.name                                       // Set token name to actor name
                })

        // Default characters to HasVision = true and Link Data = true
        if (data.type == "character") {
            data.token.vision = true;
            data.token.actorLink = true;
        }
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
                    armor.equipment += i.data.AP;
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

        this.getItemTypes("transportation").map(i => encumbrance.current += this.processTransportation().total)

        encumbrance.pct = encumbrance.current / encumbrance.max * 100;

        if (encumbrance.pct > 100) {
            encumbrance.over = true// = "var(--degenesis-red)";
        } else {
            encumbrance.over = false;
        }

        this.general.armor += armor.equipment + armor.modifier

    }

    prepareArmor(armor) {
    //     armor.qualities = armor.data.qualities.map(q => { return {
    //         key : q.name,
    //         display : [q.values.length ? DEGENESIS.armorQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.armorQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
    //     }
    //  })
    //     return armor
    }   
    prepareShield(shield) {
    //     shield.qualities = shield.data.qualities.map(q => { return {
    //         key : q.name,
    //         display : [q.values.length ? DEGENESIS.shieldQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.shieldQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
    //     }
    //  })
    //     return shield
    }  

    //#endregion

    //#region Roll Setup
    setupSkill(skill, options = {}) {
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.modifiers.forDialog("skill", skill),
            customModifiers : getProperty(this, "data.flags.degenesis.modifiers.custom"),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        }
        dialogData.rollMethod = this.rollSkill;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/roll-card.html", DEGENESIS.skills[skill])

        let rollData = {
            skill : this.data.data.skills[skill],
            actionNumber : this.getSkillTotal(skill)
        }

        //let rollResult = await DegenesisDice.rollAction(rollData)
        return {dialogData, cardData, rollData}
    }

    setupWeapon(weapon, options = {}) {
        let skill = DEGENESIS.weaponGroupSkill[weapon.data.group]
        let dialogData = {
            title : `Weapon - ${weapon.name}`,
            prefilled : this.modifiers.forDialog("weapon", skill, options.use),
            customModifiers : getProperty(this, "data.flags.degenesis.modifiers.custom"),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        }
        dialogData.rollMethod = this.rollWeapon;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/weapon-roll-card.html", weapon.name + " - " + DEGENESIS.skills[DEGENESIS.weaponGroupSkill[weapon.group]])

        let rollData = {
            skill : this.skills[skill],
            actionNumber : options.use.includes("attack") ? weapon.attackDice : weapon.defenseDice,
            weapon : weapon
        }

        if (options.use && weapon.isRanged)
        {
            if (options.use == "attack-short")
                rollData.actionNumber = weapon.effectiveDice
            else if (options.use == "attack-far")
                rollData.actionNumber = weapon.farDice
            else if (options.use == "attack-extreme")
                rollData.actionNumber = weapon.extremeDice
        }

        return {dialogData, cardData, rollData}
    }

    setupFightRoll(type, options = {})
    {
        let skill = DEGENESIS.fightRolls[type]
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.modifiers.forDialog(type, skill),
            customModifiers : getProperty(this, "data.flags.degenesis.modifiers.custom"),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        }
        dialogData.rollMethod = this.rollSkill;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/roll-card.html", DEGENESIS.skills[skill])

        if (type == "initiative")
            cardData = this.constructCardData("systems/degenesis/templates/chat/initiative-roll-card.html", DEGENESIS.skills[skill] + " - " + "Initiative") 

        let rollData = {
            skill : this.data.data.skills[skill],
            actionNumber : this.getSkillTotal(skill)
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
    async rollSkill(skill) 
    {
        let {dialogData, cardData, rollData} = this.setupSkill(skill)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        this.postRollChecks(rollResults, skill)
        return {rollResults, cardData}
    }

    rollSkillSync(skill) 
    {
        let {dialogData, rollData} = this.setupSkill(skill)
        let rollResults = DegenesisDice.rollWithout3dDice(rollData)
        this.postRollChecks(rollResults, skill)
        return {rollResults, cardData}
    }

    async rollWeapon(weapon, options = {}) 
    {
        let {dialogData, cardData, rollData} = this.setupWeapon(weapon, options)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        const fullDamage = DegenesisItem.fullDamage(rollResults.triggers, {modifier : this.data.flags.degenesis.modifiers.damage})
        cardData.damageFull = `${fullDamage}`;
        rollResults.weapon = rollData.weapon
        if (rollData.weapon.isRanged)
            this.updateEmbeddedEntity("OwnedItem", {_id : rollData.weaponid, "data.mag.current" : rollData.weapon.data.mag.current - 1})
        this.postRollChecks(rollResults, "weapon")
        return {rollResults, cardData}
    }

        
    async rollFightRoll(type) 
    {
        let {dialogData, cardData, rollData} = this.setupFightRoll(type)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        this.postRollChecks(rollResults, type)
        return {rollResults, cardData}
    }

    rollFightRollSync(type, spentEgo)
    {
        let {dialogData, cardData, rollData} = this.setupFightRoll(type)
        rollData.actionNumber += spentEgo;
        rollData.diceModifier = dialogData.prefilled.diceModifier;
        rollData.successModifier = dialogData.prefilled.successModifier;
        rollData.triggerModifier = dialogData.prefilled.triggerModifier;
        let rollResults = DegenesisDice.rollWithout3dDice(rollData)
        console.log(rollResults)
        this.postRollChecks(rollResults, type)
        return {rollResults, cardData}
    }

    postRollChecks(rollResults, type)
    {
        let egoModifierId = this.getFlag("degenesis", "spentEgoActionModifier")
        if (egoModifierId)
        {
            this.deleteEmbeddedDocuments("Item", [egoModifierId]).then(a => {
                this.update({"flags.degenesis.-=spentEgoActionModifier" : null})
                ui.notifications.notify("Used Ego Spend Action Modifier")
            })
        }
        if (type !== "initiative" && this.data.data.state.initiative.actions > 1)
            this.update({"data.state.initiative.actions" : this.data.data.state.initiative.actions - 1})
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

    get meleeWeapons() { return this.weaponItems.filter(i => i.isMelee)}
    get rangedWeapons() { return this.weaponItems.filter(i => i.isRanged)}
    get sonicWeapons() { return this.weaponItems.filter(i => i.isSonic)}
    
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
