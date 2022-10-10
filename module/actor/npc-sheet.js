import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js"
import { DegenesisItem } from "../item/item-degenesis.js"
import { DegenesisCombat } from "../combat-degenesis.js";
import NPCConfigure from "../apps/npc-configure.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

 export class DegenesisNPCSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["degenesis", "sheet", "npc"],
            template: "systems/degenesis/templates/actor/npc-sheet.html",
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
        // sheetData.attributeSkillGroups = this.sortAttributesSkillsDiamonds();

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
        html.find(".item-add").click(this._onItemCreate.bind(this))
        html.find(".item-post").click(this._onPostItem.bind(this))
        html.find(".diamond").click(this._onDiamondClick.bind(this))
        html.find(".perma").mousedown(this._onPermaDiamondClick.bind(this))
        html.find(".checkbox").click(this._onCheckboxClick.bind(this))
        html.find(".relationships-cultes,.relationships-bonus").change(this._onRelationshipEdit.bind(this))
        html.find(".dropdown").click(this._onDropdown.bind(this))
        html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this))
        html.find(".complications-name, .complications-rating").change(this._onComplicationEdit.bind(this))
        html.find(".skill-name").click(this._onSkillClick.bind(this))
        html.find(".initiative-roll").click(this._onInitiativeClick.bind(this))
        html.find(".fight-roll").click(this._onFightClick.bind(this))
        html.find(".roll-weapon").click(this._onWeaponClick.bind(this))
        html.find(".quantity-click").mousedown(this._onQualityClick.bind(this))
        html.find(".reload-click").mousedown(this._onReloadClick.bind(this))
        html.find(".aggregate").click(this._onAggregateClick.bind(this))
        html.find(".tag.container-item").mousedown(this._onContainerItemClick.bind(this))
    }
 }