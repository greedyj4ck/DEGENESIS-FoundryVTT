import { DEGENESIS } from "../config.js";

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

            if (data.data.skills.focus.value)
                data.data.status.ego.max = (data.data.skills.focus.value + data.data.attributes[data.data.skills.focus.attribute].value) * 2
            else if (data.data.skills.primal.value)
                data.data.status.ego.max = (data.data.skills.primal.value + data.data.attributes[data.data.skills.primal.attribute].value) * 2

            if (data.data.skills.willpower.value)
                data.data.status.spore.max = (data.data.skills.willpower.value + data.data.attributes[data.data.skills.willpower.attribute].value) * 2
            else if (data.data.skills.faith.value)
                data.data.status.spore.max = (data.data.skills.faith.value + data.data.attributes[data.data.skills.faith.attribute].value) * 2
    
            data.data.status.fleshwounds.max = (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            
            // data.data.status.ego.max = 10;
            // data.data.status.fleshwounds.max = 10;
            // data.data.status.spore.max =10;
            // data.data.status.ego.max = 10;
            
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
        preparedData.inventory = this.prepareItems()
        preparedData.culture = DEGENESIS.cultures[this.data.data.details.culture.value]
        preparedData.cult = DEGENESIS.cults[this.data.data.details.cult.value]
        preparedData.concept = DEGENESIS.concepts[this.data.data.details.concept.value]
        preparedData.cultureDescription = DEGENESIS.cultureDescription[this.data.data.details.culture.value]
        preparedData.cultDescription = DEGENESIS.cultDescription[this.data.data.details.cult.value]
        preparedData.conceptDescription = DEGENESIS.conceptDescription[this.data.data.details.concept.value]
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
            this.addDiamonds(attrGroup, 6)

            for (let skillKey in attrGroup.skills)
                this.addDiamonds(attrGroup.skills[skillKey], 6)
        }
        return attributeSkillGroups;
    }

    prepareBackgrounds()
    {
        let backgrounds = duplicate(this.data.data.backgrounds)
        for (let bg in backgrounds)
        {
            this.addDiamonds(backgrounds[bg], 6);
            backgrounds[bg].label = backgrounds[bg].label.toUpperCase()
        }
        return backgrounds
    }

    addDiamonds(data, diamondMax = 0)
    {
        data.diamonds = [];
        for (let i = 0; i < diamondMax; i++)
        {
            data.diamonds.push({
                filled : i + 1 <= data.value
            })
        }
    }

    prepareItems() 
    {
        let actorData = duplicate(this.data)
        let inventory = {
            weapons: {header : "WEAPONS" , items : []},
            armor: {header : "ARMOR" , items : []},
            equipment: {header : "EQUIPMENT" , items : []}
        }

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
        }
        return inventory;
    }
}
