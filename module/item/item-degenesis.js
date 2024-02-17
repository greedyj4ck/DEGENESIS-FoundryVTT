import { DEG_Utility } from "../utility.js";
import { DEGENESIS } from "../config.js";

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
      if (!this.system.group) this.system.group = "brawl";
    }

    if (this.type == "attack") {
      if (!this.system.group) this.system.group = "closeQuarter";
    }

    if (this.type == "defense") {
      if (!this.system.group) this.system.group = "passive";
    }

    if (this.type == "phenomenon") {
      if (!this.system.rapture) this.system.rapture = "generic";
    }

    // Force undroppable transportation items to not be dropped
    if (this.type == "transportation") {
      if (!this.droppable && this.dropped) this.system.dropped = false;
    }
  }

  prepareOwnedData() {
    // Apply item modifications first, not after values are set for weapons.
    if (this.slots) this._applyMods();

    // If item is a weapon: prepare weapon data.
    if (this.type == "weapon") this.prepareWeapon();

    // If From Hell category
    if (this.type == "attack") this.prepareAttack();
    if (this.type == "defense") this.prepareDefense();

    if (this.type == "transportation")
      this.itemsWithin = this.actor.items.filter((i) => i.location == this.id);
  }

  prepareWeapon() {
    console.log(`prepareWeapon fired....`);

    let dice = {
      attack: undefined,
      defense: undefined,
      effective: undefined,
      far: undefined,
      extreme: undefined,
    };

    if (!this.isSonic) {
      dice.attack =
        this.ownerSkillTotal +
        this.handling +
        this.actor.modifiers.forSheet("weapon", this.skill, "attack")
          .diceModifier;
      dice.defense =
        this.ownerSkillTotal +
        this.handling +
        this.actor.modifiers.forSheet("weapon", this.skill, "defense")
          .diceModifier;
    } else if (this.isSonic) {
      dice.attack =
        this.ownerSkillTotal +
        this.handling +
        this.actor.modifiers.forSheet("weapon", this.skill, "attack")
          .diceModifier;
    }

    if (this.isRanged) {
      (dice.effective =
        this.ownerSkillTotal +
        this.handling +
        this.actor.modifiers.forSheet("weapon", this.skill, "attack")
          .diceModifier),
        (dice.far = dice.effective - 4 > 0 ? dice.effective - 4 : 0),
        (dice.extreme = dice.effective - 8 > 0 ? dice.effective - 8 : 0);
    }

    this.system.dice = dice; // CHECK FOR DATA.DICE
  }

  // Prepare data for attack item type for From Hell
  prepareAttack() {
    let dice = {
      attack: undefined,
      effective: undefined,
      far: undefined,
      extreme: undefined,
    };

    if (this.isMelee) {
      dice.attack =
        this.attack.D +
        this.actor.modifiers.forSheet("attack", null, "attack").diceModifier;
    } else {
      (dice.effective =
        this.attack.D +
        this.actor.modifiers.forSheet("attack", null, "attack").diceModifier),
        (dice.far = dice.effective - 4 > 0 ? dice.effective - 4 : 0),
        (dice.extreme = dice.effective - 8 > 0 ? dice.effective - 8 : 0);
    }
    this.system.dice = dice;
  }

  // Prepare proper dice values for defense items
  prepareDefense() {
    // forSheet(type, skill, use) function shortcut
    let dice = {
      passive: undefined,
      activeMelee: undefined,
      activeRanged: undefined,
      mental: undefined,
    };

    if (this.group == "passive") {
      dice.passive = this.defense.D;
    }
    if (this.group == "meleeActive") {
      dice.meleeActive =
        this.defense.D +
        this.actor.modifiers.forSheet("defense", null, "defense").diceModifier;
    }
    if (this.group == "rangedActive") {
      dice.rangedActive =
        this.defense.D +
        this.actor.modifiers.forSheet("defense", null, "defense").diceModifier;
    }
    if (this.group == "mental") {
      dice.mental =
        this.defense.D +
        this.actor.modifiers.forSheet("mentalDefense", null, "mentalDefense")
          .diceModifier;
    }

    this.system.dice = dice;
  }

  //#endregion

  //#region General Functions

  async postToChat() {
    let chatData = this.dropdownData();

    chatData.item = this;

    chatData.showGeneral = this.isWeapon;

    let html = await renderTemplate(
      "systems/degenesis/templates/chat/post-item.html",
      chatData
    );
    let cardData = DEG_Utility.chatDataSetup(html);
    cardData.flags = {
      degenesis: {
        transfer: this.toObject(),
      },
    };
    ChatMessage.create(cardData);
  }

  _applyMods() {
    let mods = (this.getFlag("degenesis", "mods") || []).map(
      (i) => new DegenesisItem(i)
    );

    // reset slot calculation data
    this.system.slots.used = 0;
    this._source.system.slots.used = 0;

    for (let mod of mods) {
      // Apply the mod's changes, adding or overwriting as specified
      for (let change of mod.changes) {
        if (change.mode == "add" && change.value) {
          let current = getProperty(this.system, change.key);
          if (Number.isNumeric(current)) {
            setProperty(this.system, change.key, current + change.value);
          }
        } else if (change.mode == "override" && change.value) {
          setProperty(this.system, change.key, change.value);
        }
      }

      // Append the mod's qualities to the item's
      if (mod.qualities.length) {
        this.system.qualities = this.qualities.concat(mod.qualities);
      }

      // Calculate slot cost for the mod
      this.system.slots.used += mod.slotCost;
      this._source.system.slots.used = this.system.slots.used;
    }
  }

  getModChanges() {
    let changes = (this.getFlag("degenesis", "mods") || [])
      .map((i) => new DegenesisItem(i))
      .reduce((acc, current) => {
        acc = acc.concat(current.changes);
        return acc;
      }, []);
    return changes;
  }

  dropdownData() {
    return this[`_${this.type}DropdownData`]();
  }

  //#endregion

  //#region Weapon Functions
  /**
   * Match a weapon and its useable ammo from an array of ammo
   *
   * @param {Array} ammoList
   */
  totalAmmoAvailable() {
    let ammoList = this.actor.getItemTypes("ammunition");
    let compatibleAmmo = this.matchAmmo(this, ammoList);
    return compatibleAmmo.reduce((a, b) => a + b.quantity, 0);
  }

  fullDamage(triggers, { body, force, modifier }) {
    let damage;

    if (this.actor.type === "character") {
      let bodyTotal = this.actor.attributes.body.value + (body || 0);
      let forceTotal = this.actor.skills.force.value + (force || 0);

      const baseValue = parseInt(this.damage) + (modifier || 0);

      damage = baseValue;
      if (this.DamageBonus)
        damage += this.DamageBonus.calculate(bodyTotal + forceTotal, triggers);
    } else if (this.actor.type === "fromhell") {
      const baseValue = parseInt(this.damage) + (modifier || 0);
      damage = baseValue;
      if (this.DamageBonus) {
        damage += this.DamageBonus.calculate(triggers);
      }
    } else if (this.actor.type === "npc") {
      const baseValue = parseInt(this.damage) + (modifier || 0);
      damage = baseValue;
      if (this.DamageBonus) {
        damage += this.DamageBonus.calculate(triggers);
      }
    } else if (this.actor.type === "aberrant") {
      const baseValue = parseInt(this.damage) + (modifier || 0);
      damage = baseValue;
      if (this.DamageBonus) {
        damage += this.DamageBonus.calculate(triggers);
      }
    }

    return damage;
  }

  static matchAmmo(weapon, ammo) {
    return ammo.filter(
      (a) => a.type == "ammunition" && a.name == weapon.Caliber
    );
  }

  //#endregion

  //#region Transportation Functions
  processTransportation() {
    let enc = {
      total: this.encumbrance,
      self: this.encumbrance,
      carrying: 0,
      items: [],
    };
    enc.items = this.actor.items.filter((i) => i.location == this.id);
    if (this.mode && !this.dropped)
      enc.carrying += DEGENESIS.transportationEncumbranceCalculation[this.mode](
        enc.items,
        this.transportValue
      );
    else if (this.dropped) {
      enc.total = 0;
      enc.carrying = 0;
      enc.self = 0;
    }
    enc.total += enc.carrying;
    return enc;
  }
  //#endregion

  //#region Dropdown Data
  _potentialDropdownData() {
    return {
      text: `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>:${
        this.effect
      }<br><br><b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${
        this.rules
      }`,
    };
  }
  _modifierDropdownData() {
    let displayNumber;
    if (this.modifyNumber > 0) {
      displayNumber = "+" + this.modifyNumber;
    } else {
      displayNumber = this.modifyNumber;
    }
    let text;
    if (this.action == "custom")
      text =
        `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${
          this.name
        }<br>
                <b>${game.i18n
                  .localize("DGNS.Rules")
                  .toUpperCase()}</b>: ${displayNumber}${this.modifyType} ` +
        this.description;
    else
      text =
        `<b>${game.i18n.localize("DGNS.Name").toUpperCase()}</b>: ${
          this.name
        }<br>
                <b>${game.i18n
                  .localize("DGNS.Rules")
                  .toUpperCase()}</b>: ${displayNumber}${this.modifyType} on ` +
        DEG_Utility.getModificationActions()[this.action] +
        ` tests`;

    return { text };
  }
  _complicationDropdownData() {
    return { text: this.description };
  }
  _weaponDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    if (
      this.qualities.find((q) => q.name == "special") &&
      getProperty(this, "flags.degenesis.specialty")
    )
      text = text.concat(
        `<br><b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${
          this.flags.degenesis.specialty
        }`
      );
    tags.push(DEGENESIS.weaponGroups[data.group]);
    /*tags.push(`TECH: ${DEGENESIS.techValues[data.tech]}`)*/
    /*tags.push(`SLOTS: ${data.slots.used}/${data.slots.total}`)*/
    tags.push(`${game.i18n.localize("DGNS.Handling")}: ${data.handling}D`);
    tags.push(`${game.i18n.localize("DGNS.Damage")}: ${this.DamageFormula}`);
    tags.push(
      `${game.i18n.localize("DGNS.Distance")}: ${
        this.isMelee
          ? data.distance.melee
          : `${data.distance.short} / ${data.distance.far}`
      }`
    );
    if (this.isMelee == false) {
      tags.push(
        data.mag.belt
          ? `${game.i18n.localize("DGNS.Magazine")}: ${game.i18n.localize(
              "DGNS.Belt"
            )}`
          : `${game.i18n.localize("DGNS.Magazine")}: ${data.mag.size}`
      );
    }
    tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`);
    if (data.cult) {
      tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`);
    }
    if (data.resources) {
      tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`);
    }
    tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _armorDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    tags.push(`${game.i18n.localize("DGNS.ArmorValue")}: ${data.AP}`);
    tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`);
    if (data.cult) {
      tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`);
    }
    if (data.resources) {
      tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`);
    }
    tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _legacyDropdownData() {
    let data = foundry.utils.deepClone(this.system);
    let text = `<b>${game.i18n.localize("DGNS.Bonus").toUpperCase()}</b>: ${
      data.bonus
    }<br><br><b>${game.i18n.localize("DGNS.Legacy").toUpperCase()}</b>: ${
      data.legacy
    }<br><br><b>${game.i18n.localize("DGNS.Drawback").toUpperCase()}</b>: ${
      data.drawback
    }`;

    return {
      text: text,
    };
  }
  _equipmentDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text =
      `${this.description}` +
      `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>: ${
        data.effect
      }`;
    tags.push(
      `${game.i18n.localize("DGNS.Group")}: ${
        DEGENESIS.equipmentGroups[data.group]
      }`
    );
    tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`);
    if (data.cult) {
      tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`);
    }
    if (data.resources) {
      tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`);
    }
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _transportationDropdownData() {
    return {
      text: this.description,
      tags: this.itemsWithin.map((i) => i.name),
    };
  }
  _ammunitionDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    tags.push(`${game.i18n.localize("DGNS.Damage")}: ${this.DamageFormula}`);
    tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`);
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _shieldDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    if (
      this.qualities.find((q) => q.name == "special") &&
      getProperty(this, "flags.degenesis.specialty")
    )
      text = text.concat(
        `<br><b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${
          this.flags.degenesis.specialty
        }`
      );

    tags.push(`${game.i18n.localize("DGNS.Armor")}: ${data.defense.D}`);
    tags.push(
      `${game.i18n.localize("DGNS.PassiveDef")}: ${data.defense.p_defense}`
    );
    tags.push(`${game.i18n.localize("DGNS.Attack")}: ${data.attack.D}`);
    tags.push(`${game.i18n.localize("DGNS.Value")}: ${data.value}`);

    if (data.cult) {
      tags.push(`${game.i18n.localize("DGNS.Cult")}: ${data.cult}`);
    }
    if (data.resources) {
      tags.push(`${game.i18n.localize("DGNS.Resources")}: ${data.resources}`);
    }
    tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _modDropdownData() {
    let changes = [];

    let text = `${this.description}`;
    let data = foundry.utils.deepClone(this.system);

    for (let change of data.changes) {
      changes.push(
        `${game.i18n.localize("DGNS." + this.capitalize(change.key))}: ${
          change.mode
        } ${change.value}`
      );
    }

    return { text: text + "\nChanges:\n" + changes };
  }
  /* From Hell dropdown definitions */
  _attackDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    if (
      this.qualities.find((q) => q.name == "special") &&
      getProperty(this, "flags.degenesis.specialty")
    ) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${
          this.flags.degenesis.specialty
        }<br>`
      );
    }

    if (this.effect) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>: ${
          this.effect
        }<br>`
      );
    }
    if (this.rules) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${
          this.rules
        }<br>`
      );
    }

    tags.push(DEGENESIS.attackGroups[data.group]);
    tags.push(`${game.i18n.localize("DGNS.Damage")}: ${this.DamageFormula}`);
    tags.push(
      `${game.i18n.localize("DGNS.Distance")}: ${
        this.isMelee
          ? data.distance.melee
          : `${data.distance.short} / ${data.distance.far}`
      }`
    );

    tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _defenseDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    if (
      this.qualities.find((q) => q.name == "special") &&
      getProperty(this, "flags.degenesis.specialty")
    ) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Specialty").toUpperCase()}</b>: ${
          this.flags.degenesis.specialty
        }<br>`
      );
    }

    if (this.effect) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Effect").toUpperCase()}</b>: ${
          this.effect
        }<br>`
      );
    }
    if (this.rules) {
      text = text.concat(
        `<b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${
          this.rules
        }<br>`
      );
    }

    tags.push(DEGENESIS.defenseGroups[data.group]);
    tags.push(`${game.i18n.localize("DGNS.Defense")}: ${this.defense.D}`);

    tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }
  _phenomenonDropdownData() {
    let tags = [];
    let data = foundry.utils.deepClone(this.system);
    let text = `${this.description}`;

    if (this.rules) {
      text = text.concat(
        `
        <br><br>
        <b>${game.i18n.localize("DGNS.Rules").toUpperCase()}</b>: ${
          this.rules
        }<br>`
      );
    }

    tags.push(`${game.i18n.localize("DGNS.Level")}: ${this.level}`);

    //   tags = tags.concat(Object.values(this.Qualities));
    tags.filter((t) => !!t);
    return {
      text: text,
      tags: tags,
    };
  }

  //#endregion

  //#region Helpers

  capitalize(string) {
    // Capitalize first letter of a string
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  //#endregion

  //#region Getters
  // @@@@@@@@ CALCULATION GETTERS @@@@@@@
  get isMelee() {
    if (this.type === "attack") {
      return this.group == "closeQuarter" ? true : false;
    }
    if (this.system.type === "weapon") {
      return DEGENESIS.weaponGroupSkill[this.group] == "projectiles" ||
        this.group == "sonic"
        ? false
        : true;
    }
  }
  get isRanged() {
    if (this.system.type === "weapon")
      return (
        DEGENESIS.weaponGroupSkill[this.group] == "projectiles" &&
        this.group != "sonic"
      );
  }

  get isSonic() {
    if ((this.system.type = "weapon")) return this.group == "sonic";
  }

  get hasSpecialty() {
    return !!(
      this.qualities && this.qualities.find((q) => q.name == "special")
    );
  }

  get skill() {
    return this.primarySkill || DEGENESIS.weaponGroupSkill[this.group];
  }

  get ownerSkill() {
    return this.actor.skills[this.skill];
  }

  get ownerSkillTotal() {
    return this.actor.getSkillTotal(this.skill);
  }

  get potentialDiamonds() {
    let data = this.toObject();
    DEG_Utility.addDiamonds(data, 3, "system.level");
    return data.diamonds;
  }

  get inContainer() {
    let container = this.actor.items.get(this.location);
    if (container && container.type == "transportation") return true;
    else return false;
  }

  // @@@@@@@@ FORMATTED GETTERS @@@@@@@@

  get Tech() {
    return DEGENESIS.techValues[this.tech];
  }

  get Caliber() {
    return DEGENESIS.calibers[this.caliber];
  }

  get Group() {
    if (this.group && DEGENESIS[`${this.type}Groups`])
      return DEGENESIS[`${this.type}Groups`][this.group];
  }

  get DamageType() {
    return DEGENESIS.damageTypes[this.damageType];
  }

  get DamageBonus() {
    return DEGENESIS.damageModifiers[this.damageBonus];
  }

  get DamageFormula() {
    let formula = `${this.damage}`;
    if (this.DamageBonus) formula += this.DamageBonus.blueprint;
    return formula;
  }

  get Qualities() {
    let formattedQualities = {};
    let type = this.type;
    if (type == "mod") type = this.modType;

    if (type == "weapon" || type == "armor" || type == "attack") {
      this.system.qualities.forEach((q) => {
        let qualityString = DEGENESIS[`${type}Qualities`][q.name] + " ";
        qualityString = qualityString.concat(
          q.values.map((v) => `(${v.value})`).join(", ")
        );
        formattedQualities[q.name] = qualityString;
      });
    }

    return formattedQualities;
  }

  get ModifyType() {
    return DEGENESIS.modifyTypes[this.modifyType];
  }

  get ModifyNumber() {
    if (this.modifyNumber > 0) {
      return "+" + this.modifyNumber;
    } else {
      return this.modifyNumber;
    }
  }

  get ActionType() {
    return DEG_Utility.getModificationActions()[this.action];
  }

  // @@@@@@@@ DATA GETTERS @@@@@@@@@@
  get AP() {
    return this.system.AP;
  }
  get action() {
    return this.system.action;
  }
  get attack() {
    return this.system.attack;
  }
  get augmentation() {
    return this.system.augmentation;
  }
  get bonus() {
    return this.system.bonus;
  }
  get caliber() {
    return this.system.caliber;
  }
  get changes() {
    return this.system.changes;
  }
  get cost() {
    return this.system.cost;
  }
  get cult() {
    return this.system.cult;
  }
  get damage() {
    return this.system.damage;
  }
  get damageBonus() {
    return this.system.damageBonus;
  }
  get damageType() {
    return this.system.damageType;
  }
  get defense() {
    return this.system.defense;
  }
  get description() {
    return this.system.description || "";
  }
  get disabled() {
    return this.system.disabled;
  }
  get distance() {
    return this.system.distance;
  }
  get drawback() {
    return this.system.drawback;
  }
  get droppable() {
    return this.system.droppable;
  }
  get dropped() {
    return this.system.dropped;
  }
  get effect() {
    return this.system.effect;
  }
  get enabled() {
    return !this.system.disabled;
  }
  get encumbrance() {
    return this.system.encumbrance;
  }
  get equipped() {
    return this.system.equipped;
  }
  get group() {
    return this.system.group;
  }
  get handling() {
    return this.system.handling;
  }
  get legacy() {
    return this.system.legacy;
  }
  get level() {
    return this.system.level;
  }
  get location() {
    return this.system.location;
  }
  get mag() {
    return this.system.mag;
  }
  get modType() {
    return this.system.modType;
  }
  get mode() {
    return this.system.mode;
  }
  get modifyType() {
    return this.system.type;
  }
  get modifyNumber() {
    return this.system.number;
  }
  get modifyShowName() {
    return this.system.showName;
  }
  get origin() {
    return this.system.origin;
  }
  get prerequisite() {
    return this.system.prerequisite;
  }
  get qualities() {
    return this.system.qualities;
  }
  get quantity() {
    return this.system.quantity;
  }
  get rating() {
    return this.system.rating;
  }
  get resources() {
    return this.system.resources;
  }
  get rules() {
    return this.system.rules;
  }
  get slotCost() {
    return this.system.slotCost;
  }
  get slots() {
    return this.system.slots;
  }
  get tech() {
    return this.system.tech;
  }
  get transportValue() {
    return this.system.transportValue;
  }
  get value() {
    return this.system.value;
  }
  get primarySkill() {
    return this.system.primarySkill;
  }
  get secondarySkill() {
    return this.system.secondarySkill;
  }

  get rapture() {
    return this.system.rapture;
  }

  //      Processed data getters
  get dice() {
    return this.system.dice;
  }

  //#endregion
}
