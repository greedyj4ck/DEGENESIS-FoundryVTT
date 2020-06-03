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
        return `<div class="break"></div><b>EFFECT</b>: ${this.data.data.effect}<br><br>
                <b>RULES</b>: ${this.data.data.rules}`
    }
}
