import { DEG_Utility } from "../utility.js"

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DegenesisItem extends Item {



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
        if (this.data.data.action == "custom")
            return this.data.data.description
        else return DEG_Utility.getModificationActions()[this.data.data.action] + " Tests"
    }

    _complicationDropdownData()
    {
        return this.data.data.description;
    }
}
