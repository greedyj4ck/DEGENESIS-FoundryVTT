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
  
    prepareData() 
    {
        try
        {
            super.prepareData();
            const data = this.data;
            this.itemCategories = this.itemTypes
            this.modifiers = new ModifierManager(this);
            //setProperty(this.data.flags, "degenesis.modifiers", modifiers)
    
            data.data.condition.ego.max =           data.data.condition.ego.override || (this.focusOrPrimal.value + data.data.attributes[this.focusOrPrimal.attribute].value) * 2;
            data.data.condition.spore.max =         data.data.condition.spore.override || (this.faithOrWillpower.value + data.data.attributes[this.faithOrWillpower.attribute].value) * 2
            data.data.condition.fleshwounds.max =   data.data.condition.fleshwounds.override || (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            data.data.condition.trauma.max =        data.data.condition.trauma.override || (data.data.attributes.body.value + data.data.attributes.psyche.value);
            data.data.general.encumbrance.max =     data.data.general.encumbrance.override || (data.data.attributes.body.value + data.data.skills.force.value);

            this.prepareItems();
            this.modifiers.addEncumbranceModifiers(this)

            data.data.general.actionModifier = modifiers.action.D
            data.data.general.movement =        data.data.attributes.body.value + data.data.skills.athletics.value + (getProperty(this.data.flags, "degenesis.modifiers.movement") || 0);      
            data.data.fighting.initiative =     data.data.attributes.psyche.value + data.data.skills.reaction.value + modifiers.action.D + modifiers.initiative.D;
            data.data.fighting.dodge =          data.data.attributes.agility.value + data.data.skills.mobility.value + modifiers.action.D + modifiers.dodge.D;
            data.data.fighting.mentalDefense =  data.data.attributes.psyche.value + this.faithOrWillpower.value + modifiers.action.D + modifiers.mentalDefense.D;
            data.data.fighting.passiveDefense = 1 + data.data.state.cover.value + (data.data.state.motion ? 1 : 0) + (data.data.state.active ? 1 : 0) + (getProperty(this.data.flags, "degenesis.modifiers.p_defense") || 0);

        }
        catch(e)
        {
            console.error(e);
        }
    }
    


    

   
    get faithOrWillpower()
    {
        if (this.data.data.skills.willpower.value)
            return this.data.data.skills.willpower
        else if (this.data.data.skills.faith.value)
            return this.data.data.skills.faith
        else return this.data.data.skills.willpower
    }

    get focusOrPrimal(){
        if (this.data.data.skills.focus.value)
            return this.data.data.skills.focus
        else if (this.data.data.skills.primal.value)
            return this.data.data.skills.primal
        else return this.data.data.skills.focus
    }


    prepareItems() {
        this.itemCategories
        let inventory = {
            weapons: { header: game.i18n.localize("DGNS.Weapons"), type: 'weapon', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Equipped") },
            armor: { header: game.i18n.localize("DGNS.Armor"), type: 'armor', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Worn") },
            shields: { header: game.i18n.localize("DGNS.Shields"), type: 'shield', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Equipped") },
            ammunition: { header: game.i18n.localize("DGNS.Ammunition"), type: 'ammunition', items: [] },
            equipment: { header: game.i18n.localize("DGNS.Equipments"), type: 'equipment', items: [] },
            mods: { header: game.i18n.localize("DGNS.Mods"), type: 'mod', items: [] },
            /**survivalEquipment : {header : game.i18n.localize("DGNS.Survival"), type: 'survivalEquipment', items : []},
            technology : {header : game.i18n.localize("DGNS.Technology"), type: 'technology', items : []},
            medicalEquipment : {header : game.i18n.localize("DGNS.Medicine"), type: 'medicalEquipment', items : []},
            elysianOils : {header : game.i18n.localize("DGNS.ElysianOils"), type: 'elysianOil', items : []},
            burn : {header : game.i18n.localize("DGNS.Burn"), type: 'burn', items : []},
            primalIngenuity : {header : game.i18n.localize("DGNS.PrimalIngenuity"), type: 'primalIngenuity', items : []},
            other : {header : game.i18n.localize("DGNS.Other"), type: 'other', items : []},*/
            artifact: { header: game.i18n.localize("DGNS.Artifact"), type: 'artifact', items: [] },
        }

        let transportation = { header: game.i18n.localize("DGNS.Transportation"), type: 'transportation', items: [], toggleDisplay: game.i18n.localize("DGNS.Dropped") } // Separate transportation from inventory because it has a different format
        let potentials = [];
        let modifiers = [];
        let legacies = [];
        let complications = [];
        let meleeWeapons = [];
        let rangedWeapons = [];
        let sonicWeapons = [];
        let equippedArmor = [];
        let equippedShields = [];
        let encumbrance = actorData.data.general.encumbrance;
        let totalArmor = actorData.data.general.combat;
        let equipmentArmor = 0;
        let modifierArmor = 0;

        let inContainers = [];

        for (let i of actorData.items) {
            if (i.data.location)
            {
                inContainers.push(i);
                continue
            }

            if (i.type == "weapon") {
                inventory.weapons.items.push(i);
                encumbrance.current += i.data.encumbrance * i.data.quantity
            }
            if (i.type == "armor") {
                inventory.armor.items.push(i);
                if (i.data.equipped) {
                    equippedArmor.push(this.prepareArmor(i));

                    if (equipmentArmor == 0) {
                        equipmentArmor += i.data.AP;
                    }
                    else if (equipmentArmor <= 3 && i.data.AP <= equipmentArmor) {
                        equipmentArmor += 1;
                    }
                    else if (equipmentArmor <= 3 && i.data.AP >= equipmentArmor) {
                        equipmentArmor = i.data.AP + 1;
                    }
                    else if (i.data.AP >= equipmentArmor && equipmentArmor >= 4) {
                        equipmentArmor = i.data.AP;
                    }  
                }
                encumbrance.current += i.data.encumbrance * i.data.quantity
            }
            if (i.type == "shield") {
                inventory.shields.items.push(i);
                if (i.data.equipped)
                    equippedShields.push(this.prepareShield(i));
                encumbrance.current += i.data.encumbrance * i.data.quantity
            }
            if (i.type == "equipment") {
                inventory.equipment.items.push(i);
                encumbrance.current += i.data.encumbrance * i.data.quantity

            }
            if (i.type == "ammunition") {
                inventory.ammunition.items.push(i);
            }
            if (i.type == "transportation") {
                transportation.items.push(i);
            }
            if (i.type == "potential") {
                potentials.push(this.preparePotential(i));
            }
            if (i.type == "modifier") {
                modifiers.push(this.prepareModifier(i));
                if (i.data.action == "armor") {
                    modifierArmor += i.data.number;
                }
            }
            if (i.type == "mod") {
                inventory.mods.items.push(i);
            }
            if (i.type == "complication") {
                complications.push(i);
            }
            if (i.type == "legacy") {
                legacies.push(i);
            }
        }

        for (let wep of inventory.weapons.items) {
            if (wep.data.equipped) {
                let weapon = this.prepareWeapon(wep, inventory.ammunition.items);
                if (weapon.isSonic)
                    sonicWeapons.push(weapon);
                else if (weapon.isMelee)
                    meleeWeapons.push(weapon);
                else
                    rangedWeapons.push(weapon)
            }
        }

        transportation.items.map(i => encumbrance.current += this.prepareTransport(i))

        encumbrance.pct = encumbrance.current / encumbrance.max * 100;
        if (encumbrance.pct > 100) {
            encumbrance.color = "var(--degenesis-red)";
        } else {
            encumbrance.color = "black";
        }

        totalArmor = equipmentArmor + modifierArmor;

        mergeObject(this.data,
            {
                inventory,
                transportation,
                meleeWeapons,
                rangedWeapons,
                legacies,
                sonicWeapons,
                equippedArmor,
                potentials,
                modifiers,
                complications,
                encumbrance,
                totalArmor
            })
    }

    preparePotential(potential) {
        DEG_Utility.addDiamonds(potential, 3, "data.level")
        return potential
    }
    
    prepareModifier(modifier) {
        modifier.actionType = DEG_Utility.getModificationActions()[modifier.data.action]
        modifier.modifyType = DEGENESIS.modifyTypes[modifier.data.type]
        if(modifier.data.number>0){
            modifier.displayNumber = '+'+modifier.data.number;
        }
        else {
            modifier.displayNumber = modifier.data.number;
        }
        return modifier
    }

    prepareWeapon(weapon, ammo = []) {
        weapon.isMelee = DegenesisItem.isMelee(weapon);
        weapon.isSonic = DegenesisItem.isSonic(weapon);
        weapon.isRanged = DegenesisItem.isRanged(weapon);
        let skill = this.data.data.skills[DEGENESIS.weaponGroupSkill[weapon.data.group]]
        if (!weapon.isSonic)
        {
            weapon.attackDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "attack").diceModifier
            weapon.defenseDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "defense").diceModifier
        }
        weapon.qualities = weapon.data.qualities.map(q => { return {
                                                                key : q.name,
                                                                display : [q.values.length ? DEGENESIS.weaponQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.weaponQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
                                                            }
                                                         })

        if (weapon.isRanged)
        {
            weapon.caliber = DEGENESIS.calibers[weapon.data.caliber]
            weapon.totalAvailableAmmo = DegenesisItem.totalAmmoAvailable(weapon, ammo)
            weapon.effectiveDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "attack").diceModifier
            weapon.farDice = weapon.effectiveDice - 4 > 0  ? weapon.effectiveDice - 4 : 0 
            weapon.extremeDice = weapon.effectiveDice - 8 > 0  ? weapon.effectiveDice - 8 : 0 
        }
        weapon.damageFormula = DegenesisItem.damageFormula(weapon.data);
        weapon.damageType = game.i18n.localize(DEGENESIS.damageTypes[weapon.data.damageType])

        return weapon
    }

    prepareArmor(armor) {
        armor.qualities = armor.data.qualities.map(q => { return {
            key : q.name,
            display : [q.values.length ? DEGENESIS.armorQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.armorQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
        }
     })
        return armor
    }   
    prepareShield(shield) {
        shield.qualities = shield.data.qualities.map(q => { return {
            key : q.name,
            display : [q.values.length ? DEGENESIS.shieldQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.shieldQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
        }
     })
        return shield
    }  

    prepareTransport(transportation) {
        transportation.totalEnc = transportation.data.encumbrance;
        transportation.items = this.data.items.filter(i => i.data.location == transportationid )
        if (transportation.data.mode && !transportation.data.dropped)
            transportation.totalEnc += game.degenesis.config.transportationEncumbranceCalculation[transportation.data.mode](transportation.items, transportation.data.transportValue)
        else if (transportation.data.dropped)
            transportation.totalEnc = 0;
        return transportation.totalEnc;
    }



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
            actionNumber : this.data.data.attributes[this.data.data.skills[skill].attribute].value + this.data.data.skills[skill].value
        }

        //let rollResult = await DegenesisDice.rollAction(rollData)
        return {dialogData, cardData, rollData}
    }

    setupWeapon(weapon, options = {}) {
        let skill = DEGENESIS.weaponGroupSkill[weapon.data.group]
        weapon = this.prepareWeapon(foundry.utils.deepClone(weapon));
        let dialogData = {
            title : `Weapon - ${weapon.name}`,
            prefilled : this.modifiers.forDialog("weapon", skill, options.use),
            customModifiers : getProperty(this, "data.flags.degenesis.modifiers.custom"),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        }
        dialogData.rollMethod = this.rollWeapon;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/weapon-roll-card.html", weapon.name + " - " + DEGENESIS.skills[DEGENESIS.weaponGroupSkill[weapon.data.group]])

        let rollData = {
            skill : this.data.data.skills[skill],
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
            actionNumber : this.data.data.attributes[this.data.data.skills[skill].attribute].value + this.data.data.skills[skill].value
        }

        // Accounts for the action modifier
        rollData.actionNumber = this.data.data.fighting[type]



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
        const bodyValue = this.data.data.attributes.body.value;
        const forceValue = this.data.data.skills.force.value;
        const bodyForceValue = bodyValue + forceValue;
        const fullDamage = DegenesisItem.fullDamage(weapon.data, bodyForceValue, rollResults.triggers) + this.data.flags.degenesis.modifiers.damage;
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

    getItemTypes(type)
    {
        return (this.itemCategories || this.itemTypes)[type]
    }


    get concept(){
        return DEGENESIS.concepts[this.details.concept.value]
    }
    get cult(){
        return DEGENESIS.cults[this.details.cult.value]
    }
    get culture(){
        return DEGENESIS.cultures[this.details.culture.value]
    }

    get details() {
        return this.data.data.details
    }
    get attributes() {
        return this.data.data.attributes
    }
    get skills() {
        return this.data.data.skills
    }
    get condition() {
        return this.data.data.condition
    }
    get backgrounds() {
        return this.data.data.backgrounds
    }
    get scars() {
        return this.data.data.scars
    }
    get relationships() {
        return this.data.data.relationships
    }

}
