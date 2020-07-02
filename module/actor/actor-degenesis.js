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
    
            data.data.condition.ego.max =           (this.getFocusOrPrimal().value + data.data.attributes[this.getFocusOrPrimal().attribute].value) * 2;
            data.data.condition.spore.max =         (this.getFaithOrWillpower().value + data.data.attributes[this.getFaithOrWillpower().attribute].value) * 2
            data.data.condition.fleshwounds.max =   (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            data.data.condition.trauma.max =        (data.data.attributes.body.value + data.data.attributes.psyche.value);

            data.data.general.movement =        data.data.attributes.body.value + data.data.skills.athletics.value;      
            data.data.general.encumbrance.max = data.data.attributes.body.value + data.data.skills.force.value;      
            data.data.general.actionModifier =  data.data.state.state.motion ? -2 : 0 // todo: more
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

        preparedData.conceptIcon =  this.data.data.details.concept.value ? `systems/degenesis/icons/concept/${this.data.data.details.concept.value}.svg` : "systems/degenesis/icons/blank.png";
        preparedData.cultIcon =     this.data.data.details.cult.value ? `systems/degenesis/icons/cult/${this.data.data.details.cult.value}.svg` : "systems/degenesis/icons/blank.png";
        preparedData.cultureIcon =  this.data.data.details.culture.value ? `systems/degenesis/icons/culture/${this.data.data.details.culture.value}.svg` : "systems/degenesis/icons/blank.png";

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
            weapons: {header : "WEAPONS" , items : []},
            armor: {header : "ARMOR" , items : []},
            equipment: {header : "EQUIPMENT" , items : []}
        }
        let potentials = [];
        let modifiers = [];
        let complications = [];
        let equippedWeapons = [];
        let encumbrance = actorData.data.general.encumbrance;

        for (let i of actorData.items)
        {
            if (i.type == "weapon")
            {
                inventory.weapons.items.push(i);
                if(i.data.equipped)
                    equippedWeapons.push(this.prepareWeapon(i));
                encumbrance.current += i.data.encumbrance                
            }
            if (i.type == "armor")
            {
                inventory.armor.items.push(i);
            }
            if (i.type == "equipment")
            {
                inventory.equipment.items.push(i);
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


        encumbrance.pct = encumbrance.current/encumbrance.max * 100

        return {
            inventory,
            equippedWeapons,
            potentials,
            modifiers,
            complications,
            encumbrance
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

    prepareWeapon(weapon) {
        weapon.isMelee = DegenesisItem.isMelee(weapon);
        let skill = this.data.data.skills[DEGENESIS.weaponGroupSkill[weapon.data.group]]
        weapon.attackDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling
        weapon.defenseDice = skill.value + this.data.data.attributes[skill.attribute].value + weapon.data.handling
        return weapon
    }



    setupSkill(skill) {
        let dialogData = {
            title : DEGENESIS.skills[skill],
            preFilled : this.calculateModifiers(),
            template : "systems/degenesis/templates/apps/roll-dialog.html",
        },
            cardData = {
                template : "systems/degenesis/templates/chat/roll-card.html",
                flavor : `${DEGENESIS.skills[skill]}`,
                speaker : {
                    alias : this.data.name
                }
            },
            rollData = {
                skill : this.data.data.skills[skill],
                actionNumber : this.data.data.attributes[this.data.data.skills[skill].attribute].value + this.data.data.skills[skill].value
            }

        
        //let rollResult = await DegenesisDice.rollAction(rollData)
        return {dialogData, cardData, rollData}
    }


    async rollSkill(skill) 
    {
        let rollData = {
            actionNumber : this.data.data.attributes[skill.attribute].value + skill.value
        }
        let rollResult = await DegenesisDice.rollAction(rollData)

        return rollResult
    }

    calculateModifiers() {
        return {}
    }

}
