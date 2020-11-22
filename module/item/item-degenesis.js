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
        if (this.type == "transportation")
        {
            if (!data.data.droppable && data.data.dropped)
                data.data.dropped = false;
        }
    }

    prepareDisplayData() {
        let preparedData = {};
        if (this.data.type == "modifier")
        {
          if (this.data.data.action == "custom")
            preparedData.customAction = true;
        }
        if (this.data.type == "weapon")
        {
          preparedData.qualities = [];
          this.data.data.qualities.forEach(q => {
            let qualityString = DEGENESIS.weaponQualities[q.name] + " "
            qualityString = qualityString.concat(q.values.map(v => `(${v.value})`).join(", "))
            preparedData.qualities.push(qualityString)
        })
          preparedData.isMelee = DegenesisItem.isMelee(this.data);
          preparedData.isSonic = DegenesisItem.isSonic(this.data);
          preparedData.specialty = !!this.data.data.qualities.find(q => q.name == "special")

        
        }
        if (this.data.type == "armor")
        {
          preparedData.qualities = [];
          this.data.data.qualities.forEach(q => {
            let qualityString = DEGENESIS.armorQualities[q.name] + " "
            qualityString = qualityString.concat(q.values.map(v => `(${v.value})`).join(", "))
            preparedData.qualities.push(qualityString)
        })
        }
        return preparedData
    }

    dropdownData()
    {
        return this[`_${this.type}DropdownData`]()
    }

    _potentialDropdownData()
    {
        return {text :`<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>:${this.data.data.effect}<br><br><b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.data.data.rules}`}
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
            text = `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${this.data.name}<br>
                <b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.displayNumber}${this.data.data.type} `+this.data.data.description;
            else text = `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${this.data.name}<br>
                <b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.displayNumber}${this.data.data.type} on `+ DEG_Utility.getModificationActions()[this.data.data.action] + ` tests`

        return {text}

    }

    _complicationDropdownData()
    {
        return {text : this.data.data.description}
    }

    _weaponDropdownData()
    {
        let tags = [];
        let data = duplicate(this.data.data);
        let text = `${data.description}`

        if (this.data.data.qualities.find(q => q.name == "special") && getProperty(this.data, "flags.degenesis.specialty"))
            text = text.concat(`<br><b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${this.data.flags.degenesis.specialty}`)
        tags.push(DEGENESIS.weaponGroups[data.group])
        /*tags.push(`TECH: ${DEGENESIS.techValues[data.tech]}`)*/
        /*tags.push(`SLOTS: ${data.slots.used}/${data.slots.total}`)*/
        tags.push(`${game.i18n.localize("DGNS.Handling")}: ${data.handling}D`)
        tags.push(`${game.i18n.localize("DGNS.Damage")}: ${DegenesisItem.damageFormula(data)}`)
        tags.push(`${game.i18n.localize("DGNS.Distance")}: ${DegenesisItem.isMelee(this.data) ? data.distance.melee : `${data.distance.short} / ${data.distance.far}` }`)
        if(DegenesisItem.isMelee(this.data)==false){tags.push(data.mag.belt ? `${game.i18n.localize("DGNS.Magazine")}: ${game.i18n.localize("DGNS.Belt")}` : `${game.i18n.localize("DGNS.Magazine")}: ${data.mag.size}`)};
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if(data.cult){tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`)};
        if(data.resources){tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`)};
        tags = tags.concat(DegenesisItem.formatQualities(this.data));
        tags.filter(t => !!t)
        return {
            text : text,
            tags : tags        
        }
    }
    _armorDropdownData()
    {
        let tags = [];
        let data = duplicate(this.data.data);
        let text = `${data.description}`;

        tags.push(`${game.i18n.localize("DGNS.ArmorValue")}: ${data.AP}`)
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if(data.cult){tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`)};
        if(data.resources){tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`)};
        tags = tags.concat(DegenesisItem.formatQualities(this.data));
        tags.filter(t => !!t)
        return {
            text : text,
            tags : tags        
        }
    }
    _legacyDropdownData()
    {
        let data = duplicate(this.data.data);
        let text = `<b>${game.i18n.localize("DGNS.Bonus").toUpperCase()}</b>: ${data.bonus}<br><br><b>${game.i18n.localize("DGNS.Legacy").toUpperCase()}</b>: ${data.legacy}<br><br><b>${game.i18n.localize("DGNS.Drawback").toUpperCase()}</b>: ${data.drawback}`;

        return {
            text : text,
        }
    }
    _equipmentDropdownData()
    {
        let tags = [];
        let data = duplicate(this.data.data);
        let text = `${data.description}` + `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>: ${data.effect}`;
       console.log(this)
        tags.push(`${game.i18n.localize("DGNS.Group")}: ${DEGENESIS.equipmentGroups[data.group]}`)
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if(data.cult){tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`)};
        if(data.resources){tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`)};
        tags.filter(t => !!t)
        return {
            text : text,
            tags : tags        
        }
    }

    _transportationDropdownData()
    {
        return {
            text : this.data.data.description,
            tags : this.data.items.map(i => i.name)
        }

    }


    static isMelee(data)
    {
        if (data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[data.data.group] == "projectiles" || data.data.group =="sonic" ? false : true 
    }

    static isRanged(data) 
    {
        if (data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[data.data.group] == "projectiles" && data.data.group != "sonic"
    }

    
    static isSonic(data) 
    {
        if (data.type = "weapon")
            return data.data.group == "sonic" 
    }

    static damageFormula(weaponData) {
        const baseDamage = `${weaponData.damage}`;
        if (!weaponData.damageBonus) {
            return baseDamage;
        }
        const damageModifier = DEGENESIS.damageModifiers[weaponData.damageBonus];
        if (!damageModifier) {
            return baseDamage;
        }
        return baseDamage + damageModifier.blueprint;
    }

    static fullDamage(weaponData, force, triggers) {
        const baseValue = parseInt(weaponData.damage);
        if (!weaponData.damageBonus) {
            return baseValue;
        }
        const damageModifier = DEGENESIS.damageModifiers[weaponData.damageBonus];
        if (!damageModifier) {
            return baseValue;
        }
        return baseValue + damageModifier.calculate(force, triggers);
    }

    static matchAmmo(weapon, ammo)
    {
        let ammoName = DEGENESIS.calibers[weapon.data.caliber]
        let matchingCalibers = ammo.filter(a => a.name == ammoName)
        return matchingCalibers
    }

    static totalAmmoAvailable(weapon, ammoList)
    {
        let compatibleAmmo = this.matchAmmo(weapon, ammoList)
        return compatibleAmmo.reduce((a, b) => a + b.data.quantity, 0)
    }


    static formatQualities(itemData)
    {
        let qualitiesFormatted = [];
        itemData.data.qualities.forEach(q => {
            let qualityString = DEGENESIS[`${itemData.type}Qualities`][q.name] + " "
            if (q.values.length)
                qualityString = qualityString.concat("(" + q.values.map(v => `${v.value}`).join(", ") + ")")
            qualitiesFormatted.push(qualityString)
        })
        return qualitiesFormatted
    }
}
