import { DEG_Utility } from "../utility.js"

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
            if (hasProperty(this.data, "flags.degenesis.mods"))
                this.data.flags.degenesis.mods.forEach(m => {slotsUsed += m.data.slotCost})

            data.data.slots.used = slotsUsed;
        }
    }

    dropdownData()
    {
        return this[`_${this.type}DropdownData`]()
    }

    _potentialDropdownData()
    {
        return `<b>EFFECT</b>: ${this.data.data.effect}<br><br>
                <b>RULES</b>: ${this.data.data.rules}`
    }
    _modifierDropdownData()
    {
        if(this.data.data.number>0){
            this.displayNumber = '+'+this.data.data.number;
        }
        else {
            this.displayNumber = this.data.data.number;
        }

        if (this.data.data.action == "custom")
            return `<b>NAME</b>: ${this.data.name}<br>
                <b>RULES</b>: ${this.displayNumber}${this.data.data.type} `+this.data.data.description;
        // else return DEG_Utility.getModificationActions()[this.data.data.action] + " Tests"
            else return `<b>NAME</b>: ${this.data.name}<br>
                <b>RULES</b>: ${this.displayNumber}${this.data.data.type} on `+ DEG_Utility.getModificationActions()[this.data.data.action] + ` tests`
    }

    _complicationDropdownData()
    {
        return this.data.data.description;
    }
}
