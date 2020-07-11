import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisDice } from "../dice.js";
import { DegenesisItem } from "../item/item-degenesis.js";

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

            let modifierArray = this.data.items.filter(i => i.type == "modifier").map(m => m.data);
            let modifiers = {};
            modifiers.custom = [];
            modifierArray.forEach(mod => {
                if (mod.action == "custom")
                {
                    modifiers.custom.push(mod);
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
            setProperty(this.data.flags, "degenesis.modifiers" ,  modifiers)
    
            data.data.condition.ego.max =           (this.getFocusOrPrimal().value + data.data.attributes[this.getFocusOrPrimal().attribute].value) * 2;
            data.data.condition.spore.max =         (this.getFaithOrWillpower().value + data.data.attributes[this.getFaithOrWillpower().attribute].value) * 2
            data.data.condition.fleshwounds.max =   (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            data.data.condition.trauma.max =        (data.data.attributes.body.value + data.data.attributes.psyche.value);

            data.data.general.movement =        data.data.attributes.body.value + data.data.skills.athletics.value;      
            data.data.general.encumbrance.max = data.data.attributes.body.value + data.data.skills.force.value;      
            data.data.general.actionModifier =  data.data.state.state.motion ? -2 : 0 
            //data.data.general.actionModifier += getProperty(modifiers, "action.D") || 0; 
            data.data.fighting.initiative =     data.data.attributes.psyche.value + data.data.skills.reaction.value + data.data.general.actionModifier;
            data.data.fighting.dodge =          data.data.attributes.agility.value + data.data.skills.mobility.value + data.data.general.actionModifier;
            data.data.fighting.mentalDefense =  data.data.attributes.psyche.value + this.getFaithOrWillpower().value + data.data.general.actionModifier;
            data.data.fighting.passiveDefense = 1 + data.data.state.state.cover.value + (data.data.state.state.motion ? 1 : 0) + (data.data.state.state.active ? 1 : 0);
                                                // Temporarily state.state, not sure why it's nested


        }
        catch(e)
        {
            console.error(e);
        }
    }
    
    prepare() 
    {
        let preparedData = {};
        preparedData.attributeSkillGroups = this.sortAttributesSkillsDiamonds();
        preparedData.backgrounds = this.prepareBackgrounds();

        preparedData.infamy =       DEG_Utility.addDiamonds(duplicate(this.data.data.scars.infamy), 6)
        preparedData.ego =          DEG_Utility.addDiamonds(duplicate(this.data.data.condition.ego), 20)
        preparedData.spore =        DEG_Utility.addDiamonds(duplicate(this.data.data.condition.spore), 20)
        preparedData.fleshwounds =  DEG_Utility.addDiamonds(duplicate(this.data.data.condition.fleshwounds), 20)
        preparedData.trauma =       DEG_Utility.addDiamonds(duplicate(this.data.data.condition.trauma), 12)
        preparedData.cover =        DEG_Utility.addDiamonds(duplicate(this.data.data.state.state.cover), 3)
        preparedData.spentEgo =     DEG_Utility.addDiamonds(duplicate(this.data.data.state.state.spentEgo), 3)

        preparedData.culture =  DEGENESIS.cultures[this.data.data.details.culture.value]
        preparedData.cult =     DEGENESIS.cults[this.data.data.details.cult.value]
        preparedData.concept =  DEGENESIS.concepts[this.data.data.details.concept.value]

        preparedData.cultureDescription =   DEGENESIS.cultureDescription[this.data.data.details.culture.value]
        preparedData.cultDescription =      DEGENESIS.cultDescription[this.data.data.details.cult.value]
        preparedData.conceptDescription =   DEGENESIS.conceptDescription[this.data.data.details.concept.value]

        preparedData.conceptIcon =  this.data.data.details.concept.value ?  `systems/degenesis/icons/concept/${this.data.data.details.concept.value}.svg` : "systems/degenesis/icons/blank.png";
        preparedData.cultIcon =     this.data.data.details.cult.value    ?  `systems/degenesis/icons/cult/${this.data.data.details.cult.value}.svg`       : "systems/degenesis/icons/blank.png";
        preparedData.cultureIcon =  this.data.data.details.culture.value ?  `systems/degenesis/icons/culture/${this.data.data.details.culture.value}.svg` : "systems/degenesis/icons/blank.png";

        mergeObject(preparedData, this.prepareItems())
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


    prepareItems() 
    {
        let actorData = duplicate(this.data)
        let inventory = {
            weapons: {header : game.i18n.localize("DGNS.Weapons") , items : [], toggleable : true, toggleDisplay: game.i18n.localize("DGNS.Equipped")},
            armor: {header : game.i18n.localize("DGNS.Armor") , items : [], toggleable : true, toggleDisplay : game.i18n.localize("DGNS.Worn")},
            ammunition : {header : game.i18n.localize("DGNS.Ammunition"), items : []},
            survivalEquipment : {header : game.i18n.localize("DGNS.Survival"), items : []},
            technology : {header : game.i18n.localize("DGNS.Technology"), items : []},
            medicalEquipment : {header : game.i18n.localize("DGNS.Medicine"), items : []},
            elysianOils : {header : game.i18n.localize("DGNS.ElysianOils"), items : []},
            primalIngenuity : {header : game.i18n.localize("DGNS.PrimalIngenuity"), items : []},
            other : {header : game.i18n.localize("DGNS.Other"), items : []},
        }
        let potentials = [];
        let modifiers = [];
        let complications = [];
        let meleeWeapons = [];
        let rangedWeapons = [];
        let sonicWeapons = [];
        let equippedArmor = [];
        let encumbrance = actorData.data.general.encumbrance;

        for (let i of actorData.items)
        {
            if (i.type == "weapon")
            {
                inventory.weapons.items.push(i);
             
            }
            if (i.type == "armor")
            {
                inventory.armor.items.push(i);
                if(i.data.equipped)
                    equippedArmor.push(this.prepareArmor(i));
                encumbrance.current += i.data.encumbrance   
            }
            if (i.type == "equipment")
            {
                inventory.equipment.items.push(i);
            }
            if (i.type == "ammunition")
            {
                inventory.ammunition.items.push(i);
            }
            if (i.type == "potential")
            {
                potentials.push(this.preparePotential(i));
            }
            if (i.type == "modifier")
            {
                modifiers.push(this.prepareModifier(i));
            }
            if (i.type == "complication")
            {
                complications.push(i);
            }
        }

        for (let wep of inventory.weapons.items)
        {
            if(wep.data.equipped)
            {
                let weapon = this.prepareWeapon(wep, inventory.ammunition.items);
                if (weapon.isSonic)
                    sonicWeapons.push(weapon);
                else if (weapon.isMelee)
                    meleeWeapons.push(weapon);
                else
                    rangedWeapons.push(weapon)
            }
            encumbrance.current += wep.data.encumbrance   
        }


        encumbrance.pct = encumbrance.current/encumbrance.max * 100

        return {
            inventory,
            meleeWeapons,
            rangedWeapons,
            sonicWeapons,
            equippedArmor,
            potentials,
            modifiers,
            complications,
            encumbrance,
        }
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
            weapon.attackDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling
            weapon.defenseDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling
        }
        weapon.qualities = weapon.data.qualities.map(q => { return {
                                                                key : q.name,
                                                                display : [q.values.length ? DEGENESIS.weaponQualities[q.name] + " (" + q.values.map(v => `${v.value}`).join(", ")+")" : DEGENESIS.weaponQualities[q.name] ] // Without the ternary, empty parentheses would be displayed if no quality values
                                                            }
                                                         })

        if (weapon.isRanged)
        {
            weapon.totalAvailableAmmo = DegenesisItem.totalAmmoAvailable(weapon, ammo)
            weapon.effectiveDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling
            weapon.farDice = weapon.effectiveDice - 4 > 0  ? weapon.effectiveDice - 4 : 0 
            weapon.extremeDice = weapon.effectiveDice - 8 > 0  ? weapon.effectiveDice - 8 : 0 
        }

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



    setupSkill(skill, options = {}) {
        let dialogData = {
            title : DEGENESIS.skills[skill],
            prefilled : this.calculateModifiers("skill", skill),
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
            prefilled : this.calculateModifiers("weapon", skill),
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
        return {rollResults, cardData}
    }

    async rollWeapon(weapon) 
    {
        let {dialogData, cardData, rollData} = this.setupWeapon(weapon)
        rollData = await DegenesisDice.showRollDialog({dialogData, rollData})
        let rollResults = await DegenesisDice.rollAction(rollData)
        rollResults.weapon = rollData.weapon
        if (rollData.weapon.isRanged)
            this.updateEmbeddedEntity("OwnedItem", {_id : rollData.weapon._id, "data.mag.current" : rollData.weapon.data.mag.current - 1})
        return {rollResults, cardData}
    }

    calculateModifiers(type, skill, use) {
        console.log(type, skill)
        let modifiers = getProperty(this, "data.flags.degenesis.modifiers");
        let prefilled = {
            diceModifier : 0,
            successModifier : 0,
            triggerModifier : 0,
        }
        if (modifiers["action"])
        {
            prefilled.diceModifier += modifiers["action"].D
            prefilled.successModifier += modifiers["action"].S
            prefilled.triggerModifier += modifiers["action"].T

        }
        return prefilled
    }

}
