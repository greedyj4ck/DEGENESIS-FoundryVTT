import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";

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
    
            data.data.condition.ego.max = (this.getFocusOrPrimal().value + data.data.attributes[this.getFocusOrPrimal().attribute].value) * 2;
            data.data.condition.spore.max = (this.getFaithOrWillpower().value + data.data.attributes[this.getFaithOrWillpower().attribute].value) * 2
            data.data.condition.fleshwounds.max = (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            data.data.condition.trauma.max = (data.data.attributes.body.value + data.data.attributes.psyche.value);
            
        }
        catch(e)
        {
            console.log(e);
        }
    }
    
    prepare() 
    {
        let preparedData = {};
        preparedData.attributeSkillGroups = this.sortAttributesSkillsDiamonds();
        preparedData.backgrounds = this.prepareBackgrounds();
        preparedData.infamy = DEG_Utility.addDiamonds(duplicate(this.data.data.scars.infamy), 6)
        preparedData.ego = DEG_Utility.addDiamonds(duplicate(this.data.data.condition.ego), 20)
        preparedData.spore = DEG_Utility.addDiamonds(duplicate(this.data.data.condition.spore), 20)
        preparedData.fleshwounds = DEG_Utility.addDiamonds(duplicate(this.data.data.condition.fleshwounds), 20)
        preparedData.trauma = DEG_Utility.addDiamonds(duplicate(this.data.data.condition.trauma), 12)
        preparedData.culture = DEGENESIS.cultures[this.data.data.details.culture.value]
        preparedData.cult = DEGENESIS.cults[this.data.data.details.cult.value]
        preparedData.concept = DEGENESIS.concepts[this.data.data.details.concept.value]
        preparedData.cultureDescription = DEGENESIS.cultureDescription[this.data.data.details.culture.value]
        preparedData.cultDescription = DEGENESIS.cultDescription[this.data.data.details.cult.value]
        preparedData.conceptDescription = DEGENESIS.conceptDescription[this.data.data.details.concept.value]

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
    }

    getFocusOrPrimal(){
        if (this.data.data.skills.focus.value)
            return this.data.data.skills.focus
        else if (this.data.data.skills.primal.value)
            return this.data.data.skills.primal
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

        for (let i of actorData.items)
        {
            if (i.type == "weapon")
            {
                inventory.weapons.items.push(i);
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
        return {
            inventory,
            potentials,
            modifiers,
            complications
        }
    }

    preparePotential(potential) {
        DEG_Utility.addDiamonds(potential, 3, "data.level")
        return potential
    }
    
    prepareModifier(modifier) {
        modifier.actionType = DEG_Utility.getModificationActions()[modifier.data.action]
        modifier.modifyType = DEGENESIS.modifyTypes[modifier.data.type]
        return modifier
    }
}
