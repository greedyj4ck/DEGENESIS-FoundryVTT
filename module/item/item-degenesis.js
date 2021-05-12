import { DEG_Utility } from "../utility.js"
import { DEGENESIS } from "../config.js"

/**
 * Extend the FVTT Item class for Degenesis functionality
 * @extends {ItemSheet}
 */
export class DegenesisItem extends Item {


    //#region Data Preparation 
    prepareData() {
        super.prepareData();

        // Ensure weapons have a group
        if (this.type == "weapon") {
            if (!this.data.data.group)
                this.data.data.group = "brawl"

        }

        // Force undroppable transportation items to not be dropped
        if (this.type == "transportation") {
            if (!this.droppable && this.dropped)
                this.data.data.dropped = false;
        }

        // Apply item modifications
        if (this.slots)
            this._applyMods()

    }

    prepareOwnedData() 
    {
        if (this.type == "weapon")
            this.prepareWeapon()

    }

    prepareWeapon() {
        let dice = {
            attack : undefined,
            defense : undefined,
            effective : undefined,
            far : undefined,
            extreme : undefined
        }

        if (!this.isSonic)
        {
            dice.attack = this.ownerSkillTotal + this.handling + this.actor.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[this.group], "attack").diceModifier
            dice.defense = this.ownerSkillTotal + this.handling + this.actor.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[this.group], "defense").diceModifier
        }

        if (this.isRanged)
        {
            dice.effective = this.ownerSkillTotal + this.handling + this.actor.modifiers.forSheet("weapon", DEGENESIS.weaponGroupSkill[this.group], "attack").diceModifier,
            dice.far = dice.effective - 4 > 0  ? dice.effective - 4 : 0 ,
            dice.extreme = dice.effective - 8 > 0  ? dice.effective - 8 : 0 
        }

        this.data.dice = dice
    }


    //#endregion

    //#region General Functions

    _applyMods() {
        let mods = (this.getFlag("degenesis", "mods") || []).map(i => new Item(i))

        for (let mod of mods) {
            // Apply the mod's changes, adding or overwriting as specified
            for (let change of mod.changes) {
                if (change.mode == "add" && change.value) {
                    let current = getProperty(this.data, change.key)
                    if (Number.isNumeric(current)) {
                        setProperty(this.data, change.key, current + change.value)
                    }
                }
                else if (change.mode == "overwrite" && change.value) {
                    setProperty(this.data, change.key, change.value)
                }
            }

            // Append the mod's qualities to the item's
            if (mod.qualities.length) {
                this.data.data.qualities = this.data.data.qualities.concat(mod.data.qualities)
            }

            // Calculate slot cost for the mod
            this.data.data.slots.used += mod.slotCost
        }
    }

    dropdownData() {
        return this[`_${this.type}DropdownData`]()
    }

    //#endregion

    //#region Weapon Functions
    /**
     * Match a weapon and its useable ammo from an array of ammo
     * 
     * @param {Array} ammoList 
     */
    totalAmmoAvailable() {

        let ammoList = this.actor.getItemTypes("ammunition")
        let compatibleAmmo = this.matchAmmo(this, ammoList)
        return compatibleAmmo.reduce((a, b) => a + b.quantity, 0)
    }


    fullDamage(triggers, {body, force, modifier}) 
    {
        let bodyForce = (body || 0) + (force || 0)

        if (this.isOwned)
            bodyForce += this.actor.attributes.body.value + this.actor.attributes.force.value   

        const baseValue = parseInt(this.damage) + (modifier || 0);
        const damageWithTriggers = baseValue + triggers;
        if (!this.DamageBonus) {
            return damageWithTriggers;
        }
        return damageWithTriggers + this.DamageBonus.calculate(force, triggers);
    }

    static matchAmmo(weapon, ammo) {
        return ammo.filter(a => a.type == "ammunition" && a.name == weapon.Caliber)
    }   

    //#endregion

    //#region Transportation Functions
    processTransportation() {
        let enc = {
            total : this.encumbrance,
            self : this.encumbrance,
            carrying : 0,
            items : []
        }
        enc.items = this.actor.items.filter(i => i.location == this.id)
        if (this.mode && !this.dropped)
            enc.carrying += DEGENESIS.transportationEncumbranceCalculation[transportation.data]
        else if (this.dropped)
        {
            enc.total = 0
            enc.carrying = 0
            enc.self = 0
        }
        enc.total += enc.carrying
        return enc
    }
    //#endregion

    
    //#region Dropdown Data
    _potentialDropdownData() {
        return { text: `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>:${this.data.data.effect}<br><br><b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.data.data.rules}` }
    }
    _modifierDropdownData() {
        if (this.data.data.number > 0) {
            this.displayNumber = '+' + this.data.data.number;
        }
        else {
            this.displayNumber = this.data.data.number;
        }
        let text;
        if (this.data.data.action == "custom")
            text = `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${this.data.name}<br>
                <b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.displayNumber}${this.data.data.type} ` + this.data.data.description;
        else text = `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${this.data.name}<br>
                <b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${this.displayNumber}${this.data.data.type} on ` + DEG_Utility.getModificationActions()[this.data.data.action] + ` tests`

        return { text }

    }

    _complicationDropdownData() {
        return { text: this.data.data.description }
    }

    _weaponDropdownData() {
        let tags = [];
        let data = foundry.utils.deepClone(this.data.data);
        let text = `${data.description}`

        if (this.data.data.qualities.find(q => q.name == "special") && getProperty(this.data, "flags.degenesis.specialty"))
            text = text.concat(`<br><b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${this.data.flags.degenesis.specialty}`)
        tags.push(DEGENESIS.weaponGroups[data.group])
        /*tags.push(`TECH: ${DEGENESIS.techValues[data.tech]}`)*/
        /*tags.push(`SLOTS: ${data.slots.used}/${data.slots.total}`)*/
        tags.push(`${game.i18n.localize("DGNS.Handling")}: ${data.handling}D`)
        tags.push(`${game.i18n.localize("DGNS.Damage")}: ${DegenesisItem.damageFormula(data)}`)
        tags.push(`${game.i18n.localize("DGNS.Distance")}: ${this.isMelee ? data.distance.melee : `${data.distance.short} / ${data.distance.far}`}`)
        if (this.isMelee == false) { tags.push(data.mag.belt ? `${game.i18n.localize("DGNS.Magazine")}: ${game.i18n.localize("DGNS.Belt")}` : `${game.i18n.localize("DGNS.Magazine")}: ${data.mag.size}`) };
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if (data.cult) { tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`) };
        if (data.resources) { tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`) };
        tags = tags.concat(DegenesisItem.formatQualities(this.data));
        tags.filter(t => !!t)
        return {
            text: text,
            tags: tags
        }
    }
    _armorDropdownData() {
        let tags = [];
        let data = foundry.utils.deepClone(this.data.data);
        let text = `${data.description}`;

        tags.push(`${game.i18n.localize("DGNS.ArmorValue")}: ${data.AP}`)
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if (data.cult) { tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`) };
        if (data.resources) { tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`) };
        tags = tags.concat(DegenesisItem.formatQualities(this.data));
        tags.filter(t => !!t)
        return {
            text: text,
            tags: tags
        }
    }
    _legacyDropdownData() {
        let data = foundry.utils.deepClone(this.data.data);
        let text = `<b>${game.i18n.localize("DGNS.Bonus").toUpperCase()}</b>: ${data.bonus}<br><br><b>${game.i18n.localize("DGNS.Legacy").toUpperCase()}</b>: ${data.legacy}<br><br><b>${game.i18n.localize("DGNS.Drawback").toUpperCase()}</b>: ${data.drawback}`;

        return {
            text: text,
        }
    }
    _equipmentDropdownData() {
        let tags = [];
        let data = foundry.utils.deepClone(this.data.data);
        let text = `${data.description}` + `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>: ${data.effect}`;
        console.log(this)
        tags.push(`${game.i18n.localize("DGNS.Group")}: ${DEGENESIS.equipmentGroups[data.group]}`)
        tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`)
        if (data.cult) { tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`) };
        if (data.resources) { tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`) };
        tags.filter(t => !!t)
        return {
            text: text,
            tags: tags
        }
    }

    _transportationDropdownData() {
        return {
            text: this.data.data.description,
            tags: this.data.items.map(i => i.name)
        }

    }
    //#endregion

    //#region Getters
    // @@@@@@@@ CALCULATION GETTERS @@@@@@@
    get isMelee() {
        if (this.data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[this.group] == "projectiles" || this.group == "sonic" ? false : true
    }

    get isRanged() {
        if (this.data.type = "weapon")
            return DEGENESIS.weaponGroupSkill[this.group] == "projectiles" && this.group != "sonic"
    }


    get isSonic() {
        if (this.data.type = "weapon")
            return this.group == "sonic"
    }

    get hasSpecialty() {
        return !!this.data.data.qualities.find(q => q.name == "special")
    }

    get skill() {
        return DEGENESIS.weaponGroupSkill[this.group]
    }

    get ownerSkill() {
        return this.actor.skills[DEGENESIS.weaponGroupSkill[this.group]]
    }

    get ownerSkillTotal() {
        return this.actor.getSkillTotal(this.skill)
    }

    get potentialDiamonds() {
        let data = this.toObject();
        DEG_Utility.addDiamonds(data, 3, "data.level")
        return data.data.level
    }

    get inContainer() {
        let container = this.actor.items.get(this.location)
        if (container && container.type == "transportation")
            return true
        else 
            return false;
    }

    // @@@@@@@@ FORMATTED GETTERS @@@@@@@@

    get Tech() {
        return DEGENESIS.techValues[this.tech]
    }

    get Caliber() {
        return DEGENESIS.calibers[this.caliber]
    }

    get Group() {
        return DEGENESIS[`${this.data.type}Groups`][this.group]       
    }

    get DamageType() {
        return DEGENESIS.damageTypes[weapon.data.damageType]   
    }

    get DamageBonus() {
        return DEGENESIS.damageModifiers[this.damageBonus]
    }

    get DamageFormula() {

        let formula = `${this.damage}`
        if (this.DamageBonus)
            formula += this.DamageBonus.blueprint
        return formula
    }

    get Qualities() {

        let formattedQualities = []
        let type = this.data.type
        if (type == "mod")
            type = this.data.data.modType;

        if (type == "weapon" || type == "armour") {
            this.data.data.qualities.forEach(q => {
                let qualityString = DEGENESIS[`${type}Qualities`][q.name] + " "
                qualityString = qualityString.concat(q.values.map(v => `(${v.value})`).join(", "))
                formattedQualities.push(qualityString)
            })
        }
        
        return formattedQualities

    }

    get ModifyType() {
        return DEGENESIS.modifyTypes[this.modType]
    }

    get ModifyNumber() {
        if(this.modifyNumber>0){
            return '+'+this.modifyNumber;
        }
        else {
            return this.modifyNumber;
        }
    }

    get ActionType() {
        return DEG_Utility.getModificationActions()[this.action]
    }

    // @@@@@@@@ DATA GETTERS @@@@@@@@@@
    get AP() { return this.data.data.AP }
    get action() { return this.data.data.action }
    get attack() { return this.data.data.attack }
    get augmentation() { return this.data.data.augmentation }
    get bonus() { return this.data.data.bonus }
    get caliber() { return this.data.data.caliber }
    get changes() { return this.data.data.changes }
    get cost() { return this.data.data.cost }
    get cult() { return this.data.data.cult }
    get damage() { return this.data.data.damage }
    get damageBonus() { return this.data.data.damageBonus }
    get damageType() { return this.data.data.damageType }
    get defense() { return this.data.data.defense }
    get description() { return this.data.data.description }
    get disabled() { return this.data.data.disabled }
    get distance() { return this.data.data.distance }
    get drawback() { return this.data.data.drawback }
    get droppable() { return this.data.data.droppable }
    get dropped() { return this.data.data.dropped }
    get effect() { return this.data.data.effect }
    get enabled() { return !this.data.data.disabled }
    get encumbrance() { return this.data.data.encumbrance }
    get equipped() { return this.data.data.equipped }
    get group() { return this.data.data.group }
    get handling() { return this.data.data.handling }
    get legacy() { return this.data.data.legacy }
    get level() { return this.data.data.level }
    get location() { return this.data.data.location }
    get mag() { return this.data.data.mag }
    get modType() { return this.data.data.modType }
    get modType() { return this.data.data.type }
    get mode() { return this.data.data.mode }
    get modifyNumber() { return this.data.data.number }
    get origin() { return this.data.data.origin }
    get prerequisite() { return this.data.data.prerequisite }
    get qualities() { return this.data.data.qualities }
    get quantity() { return this.data.data.quantity }
    get rating() { return this.data.data.rating }
    get resources() { return this.data.data.resources }
    get rules() { return this.data.data.rules }
    get slotCost() { return this.data.data.slotCost }
    get slots() { return this.data.data.slots }
    get tech() { return this.data.data.tech }
    get transportValue() { return this.data.data.transportValue }
    get value() { return this.data.data.value }

    //      Processed data getters
    get dice() { return this.data.dice}

    //#endregion

}
