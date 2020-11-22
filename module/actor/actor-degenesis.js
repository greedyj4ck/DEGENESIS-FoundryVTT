import {DEGENESIS} from "../config.js";
import {DEG_Utility} from "../utility.js";
import {DegenesisDice} from "../dice.js";
import {DegenesisItem} from "../item/item-degenesis.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DegenesisActor extends Actor {
  
    prepareData() 
    {
        try
        {
            super.prepareData();
            const data = this.data;
            let modifiers = this.getModifiers();
            setProperty(this.data.flags, "degenesis.modifiers", modifiers)
    
            data.data.condition.ego.max =           (this.getFocusOrPrimal().value + data.data.attributes[this.getFocusOrPrimal().attribute].value) * 2;
            data.data.condition.spore.max =         (this.getFaithOrWillpower().value + data.data.attributes[this.getFaithOrWillpower().attribute].value) * 2
            data.data.condition.fleshwounds.max =   (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            data.data.condition.trauma.max =        (data.data.attributes.body.value + data.data.attributes.psyche.value);

            data.data.general.actionModifier = modifiers.action.D
            data.data.general.movement =        data.data.attributes.body.value + data.data.skills.athletics.value + (getProperty(this.data.flags, "degenesis.modifiers.movement") || 0);      
            data.data.general.encumbrance.max = data.data.attributes.body.value + data.data.skills.force.value;      
            data.data.fighting.initiative =     data.data.attributes.psyche.value + data.data.skills.reaction.value + modifiers.action.D;
            data.data.fighting.dodge =          data.data.attributes.agility.value + data.data.skills.mobility.value + modifiers.action.D;
            data.data.fighting.mentalDefense =  data.data.attributes.psyche.value + this.getFaithOrWillpower().value + modifiers.action.D;
            data.data.fighting.passiveDefense = 1 + data.data.state.cover.value + (data.data.state.motion ? 1 : 0) + (data.data.state.active ? 1 : 0) + (getProperty(this.data.flags, "degenesis.modifiers.p_defense") || 0);

            this.prepareItems();

        }
        catch(e)
        {
            console.error(e);
        }
    }

    getModifiers()
    {
        let shields = this.data.items.filter(i => i.type == "shield" && i.data.equipped)
        let shieldPassiveModifier = 0;
        let shieldActiveModifier = 0;
        let shieldAttackModifier = 0;

        shields.forEach(s => {
            shieldActiveModifier += s.data.defense.D
            shieldPassiveModifier += s.data.defense.p_defense
            shieldAttackModifier += s.data.attack.D
        })

        let modifierArray = this.data.items.filter(i => i.type == "modifier").map(m => m.data);
        let modifiers = {};
        modifiers.custom = [];
        modifierArray.forEach(mod => {
            if (mod.action == "custom")
            {
                modifiers.custom.push(mod);
            }
            else if (DEGENESIS.noType.includes(mod.action))
            {
                if (!modifiers[mod.action])
                    modifiers[mod.action] = mod.number
                else
                    modifiers[mod.action] += mod.number
            }
            else if (mod.action && mod.type)
            {
                if (!modifiers[mod.action])
                {
                    modifiers[mod.action] = {
                        "D" : 0,
                        "S" : 0,
                        "T" : 0,
                    }
                }
                modifiers[mod.action][mod.type] += mod.number;
            }
        })
        if (!modifiers["action"])
        {
            modifiers.action = {
                "D" : 0,
                "S" : 0,
                "T" : 0,
            }
        }
        if (!modifiers["attack"])
        {
            modifiers.attack = {
                "D" : 0,
                "S" : 0,
                "T" : 0,
            }
        }
        if (!modifiers["p_defense"])
        {
            modifiers.p_defense = 0
        }
        if (!modifiers["a_defense"])
        {
            modifiers.a_defense = {
                "D" : 0,
                "S" : 0,
                "T" : 0,
            }
        }
        modifiers.action.D = this.data.data.state.motion ? modifiers.action.D - 2 : modifiers.action.D
        modifiers.attack.D = modifiers.attack.D ? modifiers.attack.D + shieldAttackModifier : shieldAttackModifier
        modifiers.p_defense = modifiers.p_defense ? modifiers.p_defense + shieldPassiveModifier : shieldPassiveModifier
        modifiers.a_defense.D = modifiers.a_defense.D ? modifiers.a_defense.D + shieldActiveModifier : shieldActiveModifier
        return modifiers
    }    
    
    prepareDisplayData() 
    {
        let preparedData = {};
        preparedData.attributeSkillGroups = this.sortAttributesSkillsDiamonds();
        preparedData.backgrounds = this.prepareBackgrounds();

        preparedData.infamy =       DEG_Utility.addDiamonds(duplicate(this.data.data.scars.infamy), 6)
        preparedData.ego =          DEG_Utility.addDiamonds(duplicate(this.data.data.condition.ego), 24)
        preparedData.spore =        DEG_Utility.addDiamonds(duplicate(this.data.data.condition.spore), 24)
        preparedData.fleshwounds =  DEG_Utility.addDiamonds(duplicate(this.data.data.condition.fleshwounds), 24)
        preparedData.trauma =       DEG_Utility.addDiamonds(duplicate(this.data.data.condition.trauma), 12)
        preparedData.cover =        DEG_Utility.addDiamonds(duplicate(this.data.data.state.cover), 3)
        preparedData.spentEgo =     DEG_Utility.addDiamonds(duplicate(this.data.data.state.spentEgo), 3)

        preparedData.culture =  DEGENESIS.cultures[this.data.data.details.culture.value]
        preparedData.cult =     DEGENESIS.cults[this.data.data.details.cult.value]
        preparedData.concept =  DEGENESIS.concepts[this.data.data.details.concept.value]

        preparedData.cultureDescription =   DEGENESIS.cultureDescription[this.data.data.details.culture.value]
        preparedData.cultDescription =      DEGENESIS.cultDescription[this.data.data.details.cult.value]
        preparedData.conceptDescription =   DEGENESIS.conceptDescription[this.data.data.details.concept.value]

        preparedData.conceptIcon =  this.data.data.details.concept.value ?  `systems/degenesis/icons/concept/${this.data.data.details.concept.value}.svg` : "systems/degenesis/icons/blank.png";
        preparedData.cultIcon =     this.data.data.details.cult.value    ?  `systems/degenesis/icons/cult/${this.data.data.details.cult.value}.svg`       : "systems/degenesis/icons/blank.png";
        preparedData.cultureIcon =  this.data.data.details.culture.value ?  `systems/degenesis/icons/culture/${this.data.data.details.culture.value}.svg` : "systems/degenesis/icons/blank.png";

        return preparedData;
    }

    sortAttributesSkills()
    {
        let attributeSkillGroups = {}

        for (let attribute in this.data.data.attributes)
        {
            attributeSkillGroups[attribute] = {label: DEGENESIS.attributes[attribute], value :this.data.data.attributes[attribute].value, skills: {}}
        }
        for (let skill in this.data.data.skills)
        {
            this.data.data.skills[skill].label = DEGENESIS.skills[skill];
            attributeSkillGroups[this.data.data.skills[skill].attribute].skills[skill] = this.data.data.skills[skill];
        }
        return attributeSkillGroups;
    }

    sortAttributesSkillsDiamonds()
    {
        let attributeSkillGroups = this.sortAttributesSkills()

        for (let attrKey in attributeSkillGroups)
        {
            let attrGroup = attributeSkillGroups[attrKey]
            DEG_Utility.addDiamonds(attrGroup, 6)

            for (let skillKey in attrGroup.skills)
            {
                DEG_Utility.addDiamonds(attrGroup.skills[skillKey], 6)

                if (skillKey == "faith" && attrGroup.skills[skillKey].value)
                {
                    attrGroup.skills["willpower"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "willpower" && attrGroup.skills[skillKey].value)
                {
                    attrGroup.skills["faith"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "primal" && attrGroup.skills[skillKey].value)
                {
                    attributeSkillGroups["intellect"].skills["focus"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "focus" && attrGroup.skills[skillKey].value)
                {
                    attributeSkillGroups["instinct"].skills["primal"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
            }
        }
        return attributeSkillGroups;
    }

    getFaithOrWillpower()
    {
        if (this.data.data.skills.willpower.value)
            return this.data.data.skills.willpower
        else if (this.data.data.skills.faith.value)
            return this.data.data.skills.faith
        else return this.data.data.skills.willpower
    }

    getFocusOrPrimal(){
        if (this.data.data.skills.focus.value)
            return this.data.data.skills.focus
        else if (this.data.data.skills.primal.value)
            return this.data.data.skills.primal
        else return this.data.data.skills.focus
    }

    prepareBackgrounds()
    {
        let backgrounds = duplicate(this.data.data.backgrounds)
        for (let bg in backgrounds)
        {
            DEG_Utility.addDiamonds(backgrounds[bg], 6);
            backgrounds[bg].label = backgrounds[bg].label.toUpperCase()
        }
        return backgrounds
    }


    prepareItems() {
        let actorData = duplicate(this.data);
        let inventory = {
            weapons: { header: game.i18n.localize("DGNS.Weapons"), type: 'weapon', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Equipped") },
            armor: { header: game.i18n.localize("DGNS.Armor"), type: 'armor', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Worn") },
            shields: { header: game.i18n.localize("DGNS.Shields"), type: 'shield', items: [], toggleable: true, toggleDisplay: game.i18n.localize("DGNS.Equipped") },
            ammunition: { header: game.i18n.localize("DGNS.Ammunition"), type: 'ammunition', items: [] },
            equipment: { header: game.i18n.localize("DGNS.Equipments"), type: 'equipment', items: [] },
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
                encumbrance.current += i.data.encumbrance
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
            weapon.attackDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.applyModifiers("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "attack").diceModifier
            weapon.defenseDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.applyModifiers("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "defense").diceModifier
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
            weapon.effectiveDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling + this.applyModifiers("weapon", DEGENESIS.weaponGroupSkill[weapon.data.group], "attack").diceModifier
            weapon.farDice = weapon.effectiveDice - 4 > 0  ? weapon.effectiveDice - 4 : 0 
            weapon.extremeDice = weapon.effectiveDice - 8 > 0  ? weapon.effectiveDice - 8 : 0 
        }
        weapon.damageFormula = DegenesisItem.damageFormula(weapon.data);

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
        transportation.items = this.data.items.filter(i => i.data.location == transportation._id )
        if (transportation.data.mode && !transportation.data.dropped)
            transportation.totalEnc += game.degenesis.config.transportationEncumbranceCalculation[transportation.data.mode](transportation.items, transportation.data.transportValue)
        else if (transportation.data.dropped)
            transportation.totalEnc = 0;
        return transportation.totalEnc;
    }



    setupSkill(skill, options = {}) {
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.applyModifiers("skill", skill),
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
        weapon = this.prepareWeapon(duplicate(weapon));
        let dialogData = {
            title : `Weapon - ${weapon.name}`,
            prefilled : this.applyModifiers("weapon", skill, options.use),
            customModifiers : getProperty(this, "data.flags.degenesis.modifiers.custom"),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        }
        dialogData.rollMethod = this.rollWeapon;

        let cardData = this.constructCardData("systems/degenesis/templates/chat/weapon-roll-card.html", weapon.name + " - " + DEGENESIS.skills[DEGENESIS.weaponGroupSkill[weapon.data.group]])

        let rollData = {
            skill : this.data.data.skills[skill],
            actionNumber : this.data.data.attributes[this.data.data.skills[skill].attribute].value + this.data.data.skills[skill].value + weapon.data.handling,
            weapon : weapon
        }

        return {dialogData, cardData, rollData}
    }

    setupFightRoll(type, options = {})
    {
        let skill = DEGENESIS.fightRolls[type]
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.applyModifiers(type, skill),
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
        this.postRollChecks(rollResults)
        return {rollResults, cardData}
    }

    rollSkillSync(skill) 
    {
        let {dialogData, rollData} = this.setupSkill(skill)
        let rollResults = DegenesisDice.rollWithout3dDice(rollData)
        this.postRollChecks(rollResults)
        return {rollResults, cardData}
    }

    async rollWeapon(weapon) 
    {
        let {dialogData, cardData, rollData} = this.setupWeapon(weapon)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        const bodyValue = this.data.data.attributes.body.value;
        const forceValue = this.data.data.skills.force.value;
        const bodyForceValue = bodyValue + forceValue;
        const fullDamage = DegenesisItem.fullDamage(weapon.data, bodyForceValue, rollResults.triggers);
        cardData.damageFull = `${fullDamage}`;
        rollResults.weapon = rollData.weapon
        if (rollData.weapon.isRanged)
            this.updateEmbeddedEntity("OwnedItem", {_id : rollData.weapon._id, "data.mag.current" : rollData.weapon.data.mag.current - 1})
        this.postRollChecks(rollResults)
        return {rollResults, cardData}
    }

        
    async rollFightRoll(type) 
    {
        let {dialogData, cardData, rollData} = this.setupFightRoll(type)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        this.postRollChecks(rollResults)
        return {rollResults, cardData}
    }

    rollFightRollSync(type) 
    {
        let {dialogData, cardData, rollData} = this.setupFightRoll(type)
        let rollResults = DegenesisDice.rollWithout3dDice(rollData)
        this.postRollChecks(rollResults)
        return {rollResults, cardData}
    }

    postRollChecks(rollResults)
    {
        let egoModifierId = this.getFlag("degenesis", "spentEgoActionModifier")
        if (egoModifierId)
        {
            this.deleteEmbeddedEntity("OwnedItem", egoModifierId).then(a => {
                this.update({"flags.degenesis.-=spentEgoActionModifier" : null})
                ui.notifications.notify("Used Ego Spend Action Modifier")
            })
        }
        if (this.data.data.state.initiative.actions > 1)
            this.update({"data.state.initiative.actions" : this.data.data.state.initiative.actions - 1})
    }

    /**
     * 
     * @param {String} type "weapon", "skill"  "initiative", "dodge", "action", 
     * @param {String} skill Skill used
     * @param {String} use Some specifiec, "attack", "defense", etc
     */
    applyModifiers(type, skill, use) {
        let modifiers = getProperty(this, "data.flags.degenesis.modifiers");
        let prefilled = {
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0,
        }
        for (let modifier in modifiers)
        {
            let useModifier = false;
            if ( modifier == "action" ||
                (modifier == "initiative" && type == "initiative") ||
                (modifier == "dodge" && type == "dodge") ||
                (modifier == "attack" && use == "attack") ||
                (modifier == "a_defense" && use == "defense"))
            {
                useModifier = true;
            }
            else if (modifier.includes("attr:"))
            {
                let attrMod = modifier.split(":")[1]
                if (attrMod == DEGENESIS.skillAttributes[skill])
                    useModifier = true;
            }
            else if (modifier.includes("skill:"))
            {
                let skillMod = modifier.split(":")[1]
                if (skillMod == skill)
                    useModifier = true;
            }

            if (useModifier)
            {   
                prefilled.diceModifier += modifiers[modifier].D
                prefilled.successModifier += modifiers[modifier].S
                prefilled.triggerModifier += modifiers[modifier].T
            }

        }
        return prefilled
    }

}
