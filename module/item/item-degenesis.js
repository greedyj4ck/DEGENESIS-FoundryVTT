import { DEG_Utility } from "../utility.js"
import { DEGENESIS } from "../config.js"

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DegenesisItem extends Item {


    prepareData() {
        super.prepareData();
        const data = this.data;

        if (this.type == "weapon")
        {
            let slotsUsed = 0;
            if (this.getFlag("degenesis", "mods"))
                this.data.flags.degenesis.mods.forEach(m => {slotsUsed += m.data.slotCost})

            data.data.slots.used = slotsUsed;
        }
    }

    prepare() {
        let preparedData = {};
        if (this.data.type == "modifier")
        {
          if (this.data.data.action == "custom")
            preparedData.customAction = true;
        }
        if (this.data.type == "weapon")
        {
          preparedData.qualities = {};
          preparedData.isMelee = this.isMelee();

          // For each weapon quality in configuration (we want to display all of them to show checkboxes)
          for (let q in DEGENESIS.weaponQualities)
          {
            preparedData.qualities[q] = {
              "checked" : !!this.data.data.qualities.find(quality => quality.name == q), // Should be checked if weapon has it
              "name" : DEGENESIS.weaponQualities[q],                                     // Display name
              "description" : DEGENESIS.weaponQualityDescription[q],                     // Description (to be used for tooltip/dropdown)
              "values" : duplicate(DEGENESIS.weaponQualitiesValues[q])                   // Array of possible values for each quality (eg. Dazed (3) )
            }
            // Map each quality to a function to determine how the values are filled.
            // If the user specified 3 for Dazed, we need to retrieve that and fill the input with that value
            preparedData.qualities[q].values = preparedData.qualities[q].values.map(val => {
              // If the weapon has the quality
              let existingQuality = this.data.data.qualities.find(quality => q == quality.name)
              if (existingQuality) // Set the value to an object with the specified value, placeholder, and config key object
                return {value : existingQuality.values.find(v => v.name == val).value, placeholder : DEGENESIS.qualityValues[val], key : val}
              else                 // Set the value to an object with with no value, but with the placeholder and the config key
                return {value : "", placeholder : DEGENESIS.qualityValues[val], key: val}
            })
          }
        }
        return preparedData
    }

    dropdownData()
    {
        return this[`_${this.type}DropdownData`]()
    }

    _potentialDropdownData()
    {
        return {text :`<b>EFFECT</b>: ${this.data.data.effect}<br><br><b>RULES</b>: ${this.data.data.rules}`}
    }
    _modifierDropdownData()
    {
        if(this.data.data.number>0){
            this.displayNumber = '+'+this.data.data.number;
        }
        else {
            this.displayNumber = this.data.data.number;
        }
        let text;
        if (this.data.data.action == "custom")
            text = `<b>NAME</b>: ${this.data.name}<br>
                <b>RULES</b>: ${this.displayNumber}${this.data.data.type} `+this.data.data.description;
            else text = `<b>NAME</b>: ${this.data.name}<br>
                <b>RULES</b>: ${this.displayNumber}${this.data.data.type} on `+ DEG_Utility.getModificationActions()[this.data.data.action] + ` tests`

        return {text}

    }

    _complicationDropdownData()
    {
        return {text : this.data.data.description}
    }

    _weaponDropdownData()
    {
        let tags = [];
        let data = duplicate(this.data.data)
        tags.push(DEGENESIS.weaponGroups[data.group])
        tags.push(`TECH: ${DEGENESIS.techValues[data.tech]}`)
        tags.push(`SLOTS: ${data.slots.used}/${data.slots.total}`)
        tags.push(data.damage)
        tags.push(`DIST: ${this.isMelee() ? data.distance.melee : `${data.dist.short} / ${data.dist.far}` }`)
        tags.push(data.mag.belt ? `MAG: ${data.mag.size}` : "MAG: BELT")
        tags.push(data.value)
        tags.push(data.cult)
        data.qualities.forEach(q => {
            let qualityString = DEGENESIS.weaponQualities[q.name] + " "
            qualityString = qualityString.concat(q.values.map(v => `(${v.value})`).join(", "))
            tags.push(qualityString)
        })
        tags.filter(t => !!t)
        return {
            text : data.description,
            tags : tags        
        }
    }

    isMelee() 
    {
        if (this.data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[this.data.data.group] == "projectiles" ? false : true 
    }
}
