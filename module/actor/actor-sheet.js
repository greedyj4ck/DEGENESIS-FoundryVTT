import {DEGENESIS} from "../config.js";
import {DEG_Utility} from "../utility.js";
import {DegenesisChat} from "../chat.js"
import {DegenesisItem} from "../item/item-degenesis.js"
import {DegenesisCombat} from "../combat-degenesis.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DegenesisActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["degenesis", "sheet", "actor"],
            template: "systems/degenesis/templates/actor/actor-sheet.html",
            width: 685,
            height: 723,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".tab-content", initial: "main"}],
            scrollY: [".relationship", ".tab-content"]
        });
    }

    /* -------------------------------------------- */
    /** @override */
    getData() {
        const data = super.getData();
        this.addConfigData(data);

        // Used for Modifier item list
        data.modifyActions = DEG_Utility.getModificationActions()
        data.isGM = game.user.isGM;
        mergeObject(data, this.actor.prepareDisplayData());
        return data;
    }

    /* -------------------------------------------- */
    addConfigData(sheetData) {
        sheetData.concepts = DEGENESIS.concepts
        sheetData.cults = DEGENESIS.cults
        sheetData.cultures = DEGENESIS.cultures
        sheetData.modifyTypes = DEGENESIS.modifyTypes;
        sheetData.techValues = DEGENESIS.techValues;
        sheetData.backgrounds = DEGENESIS.backgrounds;
    }

    _dropdown(event, dropdownData) {
        let dropdownHTML = ""
        event.preventDefault()
        let li = $(event.currentTarget).parents(".item")
        // Toggle expansion for an item
        if (li.hasClass("expanded")) // If expansion already shown - remove
        {
            let summary = li.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            // Add a div with the item summary belowe the item
            let div
            if (!dropdownData) {
                return
            } else {
                dropdownHTML = `<div class="item-summary">${dropdownData.text}`;
            }
            if (dropdownData.tags) {
                let tags = `<div class='tags'>`
                dropdownData.tags.forEach(tag => {
                    tags = tags.concat(`<span class='tag'>${tag}</span>`)
                })
                dropdownHTML = dropdownHTML.concat(tags)
            }
            dropdownHTML += "</div>"
            div = $(dropdownHTML)
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass("expanded");
    }

    // Handle custom drop events (currently just putting items into containers)
    _onDrop(event) {
        let transportTarget = $(event.target).parent(".transport-drop")[0]
        if (transportTarget)
        {
            let jsonData = JSON.parse(event.dataTransfer.getData("text/plain"))
            let itemData = jsonData.data;
            if (itemData.type == "weapon" || itemData.type == "armor" || itemData.type == "ammunition" || itemData.type == "equipment" || itemData.type == "mod" || itemData.type == "shield" || itemData.type == "artifact")
            {
                itemData.data.location = transportTarget.dataset["itemId"]
                this.actor.updateEmbeddedEntity("OwnedItem", itemData)
            }
        }
        else
            super._onDrop(event);
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
        html.find(".item-edit").click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            this.actor.items.find(i => i._id == itemId).sheet.render(true)
        })
        html.find(".item-delete").click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            this.actor.deleteEmbeddedEntity("OwnedItem", itemId)
        })
        html.find(".item-post").click(ev => {
        })
        html.find(".item-add").click(ev => {
            let type = $(ev.currentTarget).attr("data-item");
            this.actor.createEmbeddedEntity("OwnedItem", {name: `New ${type.capitalize()}`, type: type})
        })
        // Respond to diamond clicks
        html.find(".diamond").click(ev => {
            let actorData = duplicate(this.actor)
            let index = Number($(ev.currentTarget).attr("data-index"));
            let target = $(ev.currentTarget).parents(".diamond-row").attr("data-target")
            if (target == "item") {
                let itemData = duplicate(this.actor.items.find(i => i._id == $(ev.currentTarget).parents(".item").attr("data-item-id")))
                target = $(ev.currentTarget).parents(".diamond-row").attr("data-item-target")
                let value = getProperty(itemData, target)
                if (value == index + 1)                 // If the last one was clicked, decrease by 1
                    setProperty(itemData, target, index)
                else                                    // Otherwise, value = index clicked
                    setProperty(itemData, target, index + 1)
                this.actor.updateEmbeddedEntity("OwnedItem", itemData)
                return
            }
            let value = getProperty(actorData, target)
            if (value == index + 1)                 // If the last one was clicked, decrease by 1
                setProperty(actorData, target, index)
            else                                    // Otherwise, value = index clicked
                setProperty(actorData, target, index + 1)
            // If attribute selected
            let attributeElement = $(ev.currentTarget).parents(".attribute");
            if (attributeElement.length) {
                // Constrain attributes to be greater than 0
                if (getProperty(actorData, target) <= 0)
                    setProperty(actorData, target, 1)
            }
            if (target == "data.skills.faith.value")
                setProperty(actorData, "data.skills.willpower.value", 0)
            else if (target == "data.skills.willpower.value")
                setProperty(actorData, "data.skills.faith.value", 0)
            else if (target == "data.skills.focus.value")
                setProperty(actorData, "data.skills.primal.value", 0)
            else if (target == "data.skills.primal.value")
                setProperty(actorData, "data.skills.focus.value", 0)
            this.actor.update(actorData);
        })
        html.find(".perma").mousedown(ev => {
            if (event.button != CONST.CLICK.RIGHT)
                return
            let actorData = duplicate(this.actor)
            let index = Number($(ev.currentTarget).attr("data-index"));
            let target = "data.condition.spore.permanent"
            let value = getProperty(actorData, target)
            if (value == index + 1)                 // If the last one was clicked, decrease by 1
                setProperty(actorData, target, index)
            else                                    // Otherwise, value = index clicked
                setProperty(actorData, target, index + 1)
            // If attribute selected
            let attributeElement = $(ev.currentTarget).parents(".attribute");
            if (attributeElement.length) {
                // Constrain attributes to be greater than 0
                if (getProperty(actorData, target) <= 0)
                    setProperty(actorData, target, 1)
            }
            this.actor.update(actorData);
        })
        html.find(".checkbox").click(ev => {
            let actorData = duplicate(this.actor)
            let target = $(ev.currentTarget).attr("data-target")
            if (target == "item") {
                target = $(ev.currentTarget).attr("data-item-target")
                let itemData = duplicate(this.actor.getEmbeddedEntity("OwnedItem", $(ev.currentTarget).parents(".item").attr("data-item-id")))
                setProperty(itemData, target, !getProperty(itemData, target));
                console.log(getProperty(itemData, target))
                this.actor.updateEmbeddedEntity("OwnedItem", itemData);
                return;
            }
            if (target)
                setProperty(actorData, target, !getProperty(actorData, target))
            this.actor.update(actorData);
        })
        html.find(".relationships-cultes,.relationships-bonus").change(ev => {
            let elem = $(ev.currentTarget)
            let editType = elem.hasClass("relationships-cultes") ? "group" : "modifier"
            let relationships = duplicate(this.actor.data.data.relationships)
            let index = Number(elem.parents(".relationships-li").attr("data-index"))
            if (isNaN(index)) // New relationship
            {
                let newRelationship = {}
                newRelationship[editType] = elem[0].value
                relationships.push(newRelationship)
            } else
                relationships[index][editType] = elem[0].value
            relationships = relationships.filter(r => !!r.group)
            this.actor.update({"data.relationships": relationships})
        })
        html.find(".dropdown").click(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            let item = this.actor.items.find(i => i._id == itemId)
            this._dropdown(ev, item.dropdownData())
        })
        html.find(".quality-dropdown").click(ev => {
            let type = $(ev.currentTarget).attr("data-type")
            let key = $(ev.currentTarget).attr("data-key")
            let valueObject = DEGENESIS[`${type}QualitiesValues`]
            let nameObject = DEGENESIS[`${type}Qualities`]
            let descriptionObject = DEGENESIS[`${type}QualityDescription`]
            let text = `<b>${nameObject[key]} `
            if (Object.keys(valueObject[key]).length)
                text = text.concat("(" + valueObject[key].map(value => `${DEGENESIS.qualityValues[value]}`).join(", ")) + "):</b> "
            else
                text = text.concat(": </b>")
            text = text.concat(descriptionObject[key])
            this._dropdown(ev, {text})
        })
        html.find(".complications-name, .complications-rating").change(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            if (itemId == "new")
                return this.actor.createEmbeddedEntity("OwnedItem", {type: "complication", name: ev.target.value})
            let itemData = duplicate(this.actor.items.find(i => i._id == itemId));
            let target = $(ev.currentTarget).attr("data-target")
            if (target == "name" && !event.target.value)
                return this.actor.deleteEmbeddedEntity("OwnedItem", itemId)
            setProperty(itemData, target, ev.target.value)
            this.actor.updateEmbeddedEntity("OwnedItem", itemData)
        })
        html.find(".skill-name").click(async ev => {
            let skill = $(ev.currentTarget).parents(".skill").attr("data-target")
            let {rollResults, cardData} = await this.actor.rollSkill(skill)
            DegenesisChat.renderRollCard(rollResults, cardData)
        })
        html.find(".initiative-roll").click(async ev => {
            const tokens = this.actor.isToken ? [this.actor.token] : this.actor.getActiveTokens();
            if (tokens.length > 0) {
                const initiativeConfiguration = {createCombatants: true, rerollInitiative: true, initiativeOptions: {}};
                await this.actor.rollInitiative(initiativeConfiguration);
            } else {
                DegenesisCombat.rollInitiative(this.actor);
            }
        })
        html.find(".fight-roll").click(async ev => {
            let type = $(ev.currentTarget).attr("data-roll")
            let {rollResults, cardData} = await this.actor.rollFightRoll(type)
            DegenesisChat.renderRollCard(rollResults, cardData)
        })
        html.find(".roll-weapon").click(async ev => {
            let weaponId = $(ev.currentTarget).parents(".weapon").attr("data-item-id")
            let use = $(ev.currentTarget).attr("data-use");
            let weapon = this.actor.getEmbeddedEntity("OwnedItem", weaponId)
            let {rollResults, cardData} = await this.actor.rollWeapon(weapon, {use})
            DegenesisChat.renderRollCard(rollResults, cardData)
        })
        html.find(".quantity-click").mousedown(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            let value = event.button == CONST.CLICK.LEFT ? 1 : -1
            value = event.ctrlKey ? value * 10 : value
            let item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", itemId))
            item.data.quantity += value
            item.data.quantity = item.data.quantity < 0 ? 0 : item.data.quantity
            this.actor.updateEmbeddedEntity("OwnedItem", item)
        })
        html.find(".reload-click").mousedown(ev => {
            let itemId = $(ev.currentTarget).parents(".item").attr("data-item-id")
            let item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", itemId))
            let ammo = duplicate(this.actor.data.items.filter(i => i.type == "ammunition"))
            ammo = DegenesisItem.matchAmmo(item, ammo)
            let magLeft = item.data.mag.size - item.data.mag.current
            if (ev.button == CONST.CLICK.RIGHT) {
                item.data.mag.current = 0;
                this.actor.updateEmbeddedEntity("OwnedItem", item)
                return
            }
            for (let a of ammo) {
                if (magLeft <= 0)
                    break;
                if (magLeft <= a.data.quantity) {
                    item.data.mag.current += magLeft;
                    a.data.quantity -= magLeft;
                    magLeft = 0;
                } else {
                    item.data.mag.current += a.data.quantity;
                    magLeft -= a.data.quantity
                    a.data.quantity = 0;
                }
            }
            this.actor.updateEmbeddedEntity("OwnedItem", item)
            this.actor.updateEmbeddedEntity("OwnedItem", ammo)
        })
        // TODO: unloading the magazine just deletes the ammo
        // TODO: Salvo
        // TODO: Ammo check before firing
        html.find(".aggregate").click(async ev => {
            let group = $(ev.currentTarget).parents(".inventory-group").attr("data-group")
            if (group == "ammunition") {
                let compiledAmmoNames = [];
                let compiledAmmo = [];
                let ammo = duplicate(this.actor.items.filter(i => i.type == "ammunition"))
                await this.actor.deleteEmbeddedEntity("OwnedItem", ammo.map(i => i._id))
                for (let a of ammo)
                    if (!compiledAmmoNames.includes(a.name))
                        compiledAmmoNames.push(a.name)
                for (let name of compiledAmmoNames) {
                    let ammoToCombine = ammo.filter(a => a.name == name)
                    let ammoItem = ammoToCombine[0]
                    ammoItem.data.quantity = ammoToCombine.reduce((a, b) => a + b.data.quantity, 0)
                    compiledAmmo.push(ammoItem);
                }
                this.actor.createEmbeddedEntity("OwnedItem", compiledAmmo)
            }
        })

        html.find(".tag.container-item").mousedown(ev => {
            let itemId = $(ev.currentTarget).attr("data-item-id")
            let item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", itemId))
            if (ev.button == CONST.CLICK.RIGHT)
            {
                item.data.location = "";
                this.actor.updateEmbeddedEntity("OwnedItem", item)
            }
            else 
                this.actor.items.get(itemId).sheet.render(true)

        })
    }

    /* -------------------------------------------- */
}
