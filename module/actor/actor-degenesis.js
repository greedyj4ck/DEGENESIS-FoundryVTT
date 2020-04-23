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
        preparedData.attributeSkillGroups = this.sortAttributesSkills();
        preparedData.inventory = this.prepareItems()
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
