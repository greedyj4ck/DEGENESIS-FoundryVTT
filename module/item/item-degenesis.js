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
          preparedData.isMelee = DegenesisItem.isMelee(this.data);

        
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
        tags.push(`DIST: ${DegenesisItem.isMelee(this.data) ? data.distance.melee : `${data.dist.short} / ${data.dist.far}` }`)
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

    static isMelee(data) 
    {
        if (data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[data.data.group] == "projectiles" ? false : true 
    }
}
