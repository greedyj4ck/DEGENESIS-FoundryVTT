import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js"
import { DegenesisItem } from "../item/item-degenesis.js"
import { DegenesisCombat } from "../combat-degenesis.js";
import NPCConfigure from "../apps/npc-configure.js";
import CustomSkills from "../apps/custom-skills.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

 export class DegenesisNPCSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["degenesis", "sheet", "npc"],
            template: "systems/degenesis/templates/npc/npc-sheet.html",
            width: 685,
            height: 723, // Adjust to minimize scroll
            // No tab nav in NPC sheet first iteration
            // tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-content", initial: "main" }],
            // Need to define scss elements for NPC sheet scrollY
            scrollY: [".relationship", ".tab-content"]
        });
     }

     _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (this.actor.isOwner) {
            buttons.unshift(
                {
                    label: "DGNS.Configure",
                    class: "configure",
                    icon: "fas fa-wrench",
                    onclick: ev => new NPCConfigure(this.actor).render(true)
                })
        }
        return buttons
     }

    /* -------------------------------------------- */
    /** @override */
    getData() {
        const data = super.getData();

        data.data = data.actor.system

        // Used for Modifier item list
        data.modifyActions = DEG_Utility.getModificationActions()


        this.prepareSheetData(data);
        return data;
     }


    prepareSheetData(sheetData) {
        this.actor.system.attributeSkillGroups = this.sortAttributesSkillsDiamonds();

        // sheetData.conceptIcon = this.actor.details.concept.value ? `systems/degenesis/icons/concept/${this.actor.details.concept.value}.svg` : "systems/degenesis/icons/blank.png"
        // sheetData.cultIcon = this.actor.details.cult.value ? `systems/degenesis/icons/cult/${this.actor.details.cult.value}.svg` : "systems/degenesis/icons/blank.png"
        // sheetData.cultureIcon = this.actor.details.culture.value ? `systems/degenesis/icons/culture/${this.actor.details.culture.value}.svg` : "systems/degenesis/icons/blank.png"

        // if (sheetData.data.general.encumbrance.pct > 100) {
        //     sheetData.data.general.encumbrance.color = "var(--degenesis-red)";
        // } else {
        //     sheetData.data.general.encumbrance.color = "black";
        // }

        // DEG_Utility.addDiamonds(sheetData.data.scars.infamy, 6)
        // DEG_Utility.addDiamonds(sheetData.data.condition.ego, 24)
        // DEG_Utility.addDiamonds(sheetData.data.condition.spore, 24)
        // DEG_Utility.addDiamonds(sheetData.data.condition.fleshwounds, 24)
        // DEG_Utility.addDiamonds(sheetData.data.condition.trauma, 12)
        DEG_Utility.addDiamonds(sheetData.data.state.cover, 3)
        DEG_Utility.addDiamonds(sheetData.data.state.spentEgo, 3)

        // for (let bg in sheetData.data.backgrounds) {
        //     DEG_Utility.addDiamonds(sheetData.data.backgrounds[bg], 6);
        //     sheetData.data.backgrounds[bg].label = game.i18n.localize(sheetData.data.backgrounds[bg].label).toUpperCase()
        // }

        // sheetData.inventory = this.constructInventory()
        sheetData.arsenal = this.constructArsenal()
        // sheetData.transportation = { header: game.i18n.localize("DGNS.Transportation"), type: 'transportation', items: this.actor.transportationItems, toggleDisplay: game.i18n.localize("DGNS.Dropped") }

     }

    sortAttributesSkills() {
        let attributeSkillGroups = {}

        for (let attribute in this.actor.attributes) {
            attributeSkillGroups[attribute] = { label: DEGENESIS.attributes[attribute], value: this.actor.attributes[attribute].value, skills: {} }
        }
        for (let skill in this.actor.skills) {
            this.actor.skills[skill].label = DEGENESIS.skills[skill];
            attributeSkillGroups[this.actor.skills[skill].attribute].skills[skill] = this.actor.skills[skill];
        }
        return attributeSkillGroups;
     }

    sortAttributesSkillsDiamonds() {
        let attributeSkillGroups = this.sortAttributesSkills()

        const isFocus = !!attributeSkillGroups.intellect.skills.focus.value;
        const type = isFocus ? 'focus' : 'primal';

        for (let attrKey in attributeSkillGroups) {
            let attrGroup = attributeSkillGroups[attrKey]
            // DEG_Utility.addDiamonds(attrGroup, 6)
            // DEG_Utility.addAttributeType(attrGroup, attrKey, type);
            for (let skillKey in attrGroup.skills) {
                // DEG_Utility.addDiamonds(attrGroup.skills[skillKey], 6)

                if (skillKey == "faith" && attrGroup.skills[skillKey].value) {
                    attrGroup.skills["willpower"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "willpower" && attrGroup.skills[skillKey].value) {
                    attrGroup.skills["faith"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "primal" && attrGroup.skills[skillKey].value) {
                    attributeSkillGroups["intellect"].skills["focus"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
                else if (skillKey == "focus" && attrGroup.skills[skillKey].value) {
                    attributeSkillGroups["instinct"].skills["primal"].unused = true;
                    attrGroup.skills[skillKey].unused = false;
                }
            }
        }
        return attributeSkillGroups;
    }

     constructArsenal() {
        // All items are automatically equipped on NPCs, just classify em.
        return {
            meleeWeapons: this.actor.weaponItems.filter(i => i.isMelee),
            rangedWeapons: this.actor.weaponItems.filter(i => i.isRanged),
            sonicWeapons: this.actor.weaponItems.filter(i => i.isSonic),
            armor : this.actor.armorItems.filter(i => i.equipped)
        }
     }

    /* -------------------------------------------- */
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        $("input[type=text]").focusin(function () {
            $(this).select();
        });
        // Update Inventory Item
        html.find(".item-edit").click(this._onItemEdit.bind(this))
        html.find(".item-delete").click(this._onItemDelete.bind(this))
        html.find(".item-add").click(this._onItemCreate.bind(this)) // needed?
        html.find(".item-post").click(this._onPostItem.bind(this)) // needed?
        html.find(".condition-edit").click(this._onPlusMinusClick.bind(this))

        // Condition & combat listeners
        html.find(".diamond").click(this._onDiamondClick.bind(this)) // ego and cover tracking
        // html.find(".perma").mousedown(this._onPermaDiamondClick.bind(this)) // needed?
        html.find(".checkbox").click(this._onCheckboxClick.bind(this)) // combat state
        // html.find(".dropdown").click(this._onDropdown.bind(this)) // used for mods
        html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this))
        html.find(".skill-name").click(this._onSkillClick.bind(this))
        
        //html.find(".skills-add").click(ev => new CustomSkills(this.actor).render(true))
        html.find(".skills-add").click(this._onSkillEdit.bind(this))

        html.find(".initiative-roll").click(this._onInitiativeClick.bind(this))
        html.find(".fight-roll").click(this._onFightClick.bind(this))
        html.find(".roll-weapon").click(this._onWeaponClick.bind(this))
        html.find(".quantity-click").mousedown(this._onQuantityClick.bind(this)) // used for ammo, recycle for condition
        html.find(".reload-click").mousedown(this._onReloadClick.bind(this))
        // html.find(".aggregate").click(this._onAggregateClick.bind(this)) // was is das?
        // html.find(".tag.container-item").mousedown(this._onContainerItemClick.bind(this))
     }

    _onItemEdit(event) {
        let itemId = $(event.currentTarget).parents(".item").attr("data-item-id")
        this.actor.items.get(itemId).sheet.render(true)
    }
    _onItemDelete(event) {
        let itemId = $(event.currentTarget).parents(".item").attr("data-item-id")
        this.actor.deleteEmbeddedDocuments("Item", [itemId])
    }
    _onItemCreate(event) {
        let type = $(event.currentTarget).attr("data-item");
        this.actor.createEmbeddedDocuments("Item", [{ name: `New ${type.capitalize()}`, type: type }])
     }
    _onPostItem(event) {
        let itemId = $(event.currentTarget).parents(".item").attr("data-item-id")
        this.actor.items.get(itemId).postToChat()
     }
    _onDiamondClick(event) { // TODO adjust
        let actorData = this.actor.toObject()
        let index = Number($(event.currentTarget).attr("data-index"));
        let target = $(event.currentTarget).parents(".diamond-row").attr("data-target")
        // if (target == "item") {
        //     let itemData = this.actor.items.get($(event.currentTarget).parents(".item").attr("data-item-id")).toObject()
        //     target = $(event.currentTarget).parents(".diamond-row").attr("data-item-target")
        //     let value = getProperty(itemData, target)
        //     if (value == index + 1) // If the last one was clicked, decrease by 1
        //         setProperty(itemData, target, index)
        //     else // Otherwise, value = index clicked
        //         setProperty(itemData, target, index + 1)
        //     this.actor.updateEmbeddedDocuments("Item", [itemData])
        //     return
        // }
        let value = getProperty(actorData, target)
        if (value == index + 1) // If the last one was clicked, decrease by 1
            setProperty(actorData, target, index)
        else // Otherwise, value = index clicked
            setProperty(actorData, target, index + 1) // If attribute selected
        let attributeElement = $(event.currentTarget).parents(".attribute");
        if (attributeElement.length) { // Constrain attributes to be greater than 0
            if (getProperty(actorData, target) <= 0)
                setProperty(actorData, target, 1)
        }
        this.actor.update(actorData);
     }

     _onPlusMinusClick(event) {
        let actorData = this.actor.toObject()
        let quantity = $(event.currentTarget).attr("data-target-sign") == "plus" ? 1 : -1
        let target = $(event.currentTarget).attr("data-target")
        let max = $(event.currentTarget).attr("data-target-max")

        if (event.button === 2 || event.ctrlKey) {
            quantity *= 5
        }

         let value = getProperty(actorData, target)
         setProperty(actorData, target, value + quantity)

        if (getProperty(actorData, target) > getProperty(actorData, max)) {
            setProperty(actorData, target, getProperty(actorData, max))
         }
        if (getProperty(actorData, target) < 0) {
            setProperty(actorData, target, 0)
         }

        this.actor.update(actorData)
    }
    _onCheckboxClick(event) {
        let target = $(event.currentTarget).attr("data-target")
        // if (target == "item") {
        //     target = $(event.currentTarget).attr("data-item-target")
        //     let item = this.actor.items.get($(event.currentTarget).parents(".item").attr("data-item-id"))
        //     item.update({ [`${target}`]: !getProperty(item, target) })
        //     return;
        // }
        if (target)
            this.actor.update({[`${target}`] : !getProperty(this.actor, target)});
     }
    _onQualityDropdown(event) {
        let type = $(event.currentTarget).attr("data-type")
        let key = $(event.currentTarget).attr("data-key")
        let valueObject = DEGENESIS[`${type}QualitiesValues`]
        let nameObject = DEGENESIS[`${type}Qualities`]
        let descriptionObject = DEGENESIS[`${type}QualityDescription`]
        let text = `<b>${nameObject[key]} `
        if (Object.keys(valueObject[key]).length) text = text.concat("(" + valueObject[key].map(value => `${DEGENESIS.qualityValues[value]}`).join(", ")) + "):</b> "
        else
            text = text.concat(": </b>")
        text = text.concat(descriptionObject[key])
        this._dropdown(event, { text })
     }
    async _onSkillClick(event) {
        let skill = $(event.currentTarget).parents(".skill").attr("data-target")
        let skipDialog = event.ctrlKey
        let { rollResults, cardData } = await this.actor.rollSkill(skill, {skipDialog})
        DegenesisChat.renderRollCard(rollResults, cardData)
     }

     _onSkillEdit(event) {
         new CustomSkills(this.actor).render(true)
     }

    async _onInitiativeClick(event) {
        const tokens = this.actor.isToken ? [this.actor.token] : this.actor.getActiveTokens(true);
        if (tokens.length > 0 && game.combat !== null && game.combat.combatants.contents.length !== 0) {

            const initiativeConfiguration = { createCombatants: true, rerollInitiative: true, initiativeOptions: {} };
            const combatantToken = game.combat.combatants.reduce((arr, c) => {

                if (this.actor.isToken == true){
                    if (c.data.tokenId !== this.token.id ) return arr;
                } else {
                    if (c.data.actorId !== this.actor.id ) return arr;
                    if (c.token.isLinked !== true) return arr;
                }

                if ( !initiativeConfiguration.rerollInitiative && c.initiative !== null ) return arr;
                arr.push(c.id);
                return arr;
              }, []);
           await game.combat.rollInitiative(combatantToken,initiativeConfiguration);
           return game.combat;
        }
        else {
            DegenesisCombat.rollInitiativeFor(this.actor);
        }
     }
    async _onFightClick(event) {
        let type = $(event.currentTarget).attr("data-roll")
        let skipDialog = event.ctrlKey
        let { rollResults, cardData } = await this.actor.rollFightRoll(type, {skipDialog})
        DegenesisChat.renderRollCard(rollResults, cardData)
     }
    async _onWeaponClick(event) {
        let weaponId = $(event.currentTarget).parents(".weapon").attr("data-item-id")
        let skipDialog = event.ctrlKey
        let use = $(event.currentTarget).attr("data-use");
        let weapon = this.actor.items.get(weaponId)
        let { rollResults, cardData } = await this.actor.rollWeapon(weapon, { use, skipDialog })
        DegenesisChat.renderRollCard(rollResults, cardData)
    }
    _onQuantityClick(event) {
        let itemId = $(event.currentTarget).parents(".item").attr("data-item-id")
        let value = event.button == 0 ? 1 : -1
        value = event.ctrlKey ? value * 10 : value
        let item = this.actor.items.get(itemId)
        let newQty = item.quantity + value
        newQty = newQty < 0 ? 0 : newQty
        item.update({ "data.quantity": newQty })
    }
    _onReloadClick(event) { // NPCs have infinite ammo, remove ammo retrieval
        let itemId = $(event.currentTarget).parents(".item").attr("data-item-id")
        let item = this.actor.items.get(itemId)
        let itemData = item.toObject()
        let magLeft = item.mag.size - item.mag.current
        if (event.button == 2)
            return item.update({ "data.mag.current": 0 })

        if (magLeft > 0) {
            itemData.data.mag.current += magLeft;
            magLeft = 0;
        }
        this.actor.updateEmbeddedDocuments("Item", [itemData])
    }
}
