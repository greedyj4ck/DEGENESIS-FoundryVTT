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

            if (data.data.skills.focus.value)
                data.data.condition.ego.max = (data.data.skills.focus.value + data.data.attributes[data.data.skills.focus.attribute].value) * 2
            else if (data.data.skills.primal.value)
                data.data.condition.ego.max = (data.data.skills.primal.value + data.data.attributes[data.data.skills.primal.attribute].value) * 2

            if (data.data.skills.willpower.value)
                data.data.condition.spore.max = (data.data.skills.willpower.value + data.data.attributes[data.data.skills.willpower.attribute].value) * 2
            else if (data.data.skills.faith.value)
                data.data.condition.spore.max = (data.data.skills.faith.value + data.data.attributes[data.data.skills.faith.attribute].value) * 2
    
            data.data.condition.fleshwounds.max = (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            
            // data.data.condition.ego.max = 10;
            // data.data.condition.fleshwounds.max = 10;
            // data.data.condition.spore.max =10;
            // data.data.condition.ego.max = 10;
            
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
                DEG_Utility.addDiamonds(attrGroup.skills[skillKey], 6)
        }
        return attributeSkillGroups;
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
        }
        return {
            inventory,
            potentials
        }
    }

    preparePotential(potential) {
        DEG_Utility.addDiamonds(potential, 3, "data.level")
        return potential
    }
}
