// From Hell Actor Sheet
// V. 0.1
// Early prototyping phase

// Required modules
import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js";
import { DegenesisItem } from "../item/item-degenesis.js";
import { DegenesisCombat } from "../combat-degenesis.js";
import ActorConfigure from "../apps/actor-configure.js";

/**
 * Extending default Foundry ActorSheet
 * @extends {ActorSheet}
 */

// Main class definition
export class DegenesisFromHellSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["degenesis", "sheet", "fromHell"],
      template:
        "systems/degenesis/templates/actor/fromHell/fromHell-sheet.html",
      width: 550,
      height: 535,
      tabs: [
        {
          navSelector: ".sh-tabs",
          contentSelector: ".tab-content-container",
          initial: "main",
        },
      ],
      scrollY: [".relationship", ".tab-content"],
    });
  }

  /* ######## DATA PREPARATION STAGE  ######## */

  // Preparing data for Sheet to be displayed

  async getData() {
    const data = await super.getData();

    data.data = data.actor.system;

    // Used for Modifier item list
    //data.modifyActions = DEG_Utility.getModificationActions()

    await this.prepareSheetData(data);
    return data;
  }

  async prepareSheetData(sheetData) {
    // ADDING DIAMONDS ONTO SHEET

    DEG_Utility.addDiamonds(
      sheetData.data.condition.ego,
      sheetData.data.condition.ego.max
    );
    DEG_Utility.addDiamonds(
      sheetData.data.condition.fleshwounds,
      sheetData.data.condition.fleshwounds.max
    );
    DEG_Utility.addDiamonds(
      sheetData.data.condition.trauma,
      sheetData.data.condition.trauma.max
    );
    DEG_Utility.addDiamonds(sheetData.data.state.spentEgo, 3);

    // PREPARE DATA FOR FROM HELL SHEET
    sheetData.inventory = this.constructInventory();
    sheetData.enrichment = await this._handleEnrichment();
  }

  // CONSTRUCT INVETORY FOR ATTACKS / DEFENSE ITEMS
  constructInventory() {
    return {
      attack: {
        header: game.i18n.localize("DGNS.Attack"),
        type: "attack",
        items: this.actor.attackItems,
        toggleable: false,
        toggleDisplay: game.i18n.localize("DGNS.Active"),
      },
      defense: {
        header: game.i18n.localize("DGNS.Defense"),
        type: "defense",
        items: this.actor.defenseItems,
        toggleable: false,
        toggleDisplay: game.i18n.localize("DGNS.Active"),
      },
    };
  }

  // CONSTRUCT ARSENAL NOT REQUIRED ?

  async _handleEnrichment() {
    // Add HTML Enrichment stuff for editors fields (like item's links etc.)
    /*  let enrichment = {}
        enrichment["system.biography.value"] = await TextEditor.enrichHTML(this.actor.system.biography, { async: true, secrets: this.actor.isOwner, relativeTo: this.actor })
        enrichment["system.gmnotes.value"] = await TextEditor.enrichHTML(this.actor.system.gmnotes, { async: true, secrets: this.actor.isOwner, relativeTo: this.actor })

        return expandObject(enrichment) */
  }

  /* ######## HTML LISTENERS  ######## */

  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    $("input[type=text]").focusin(function () {
      $(this).select();
    });

    html.find(".initiative-roll").click(this._onInitiativeClick.bind(this)); // Initiative Roll
    html.find(".diamond").click(this._onDiamondClick.bind(this));
    html.find(".perma").mousedown(this._onPermaDiamondClick.bind(this));
    html.find(".checkbox").click(this._onCheckboxClick.bind(this));

    $("input[type=text]").focusin(function () {
      $(this).select();
    });

    // Update Inventory Item
    html.find(".item-add").click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".item-post").click(this._onPostItem.bind(this));

    //html

    //.find(".relationships-cultes,.relationships-bonus")
    //.change(this._onRelationshipEdit.bind(this));
    //html.find(".dropdown").click(this._onDropdown.bind(this));
    //html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this));
    //html
    //.find(".complications-name, .complications-rating")
    //.change(this._onComplicationEdit.bind(this));
    //html.find(".skill-name").click(this._onSkillClick.bind(this));

    //html.find(".fight-roll").click(this._onFightClick.bind(this));
    //html.find(".roll-weapon").click(this._onWeaponClick.bind(this));
    //html.find(".quantity-click").mousedown(this._onQualityClick.bind(this));
    //html.find(".reload-click").mousedown(this._onReloadClick.bind(this));
    //html.find(".aggregate").click(this._onAggregateClick.bind(this));
    //html
    //.find(".tag.container-item")
    //.mousedown(this._onContainerItemClick.bind(this));
  }

  /* ######## FUNCTIONALITY EVENTS ########*/

  _onItemCreate(event) {
    let type = $(event.currentTarget).attr("data-item");
    this.actor.createEmbeddedDocuments("Item", [
      { name: `New ${type.capitalize()}`, type: type },
    ]);
  }

  _onItemEdit(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.items.get(itemId).sheet.render(true);
  }
  _onPostItem(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.items.get(itemId).postToChat();
  }

  _onItemDelete(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  async _onInitiativeClick(event) {
    console.log("Rolling initiative for from hell :)");

    const tokens = this.actor.isToken
      ? [this.actor.token]
      : this.actor.getActiveTokens(true);
    if (
      tokens.length > 0 &&
      game.combat !== null &&
      game.combat.combatants.contents.length !== 0
    ) {
      const initiativeConfiguration = {
        createCombatants: true,
        rerollInitiative: true,
        initiativeOptions: {},
      };

      const combatantToken = game.combat.combatants.reduce((arr, c) => {
        if (this.actor.isToken == true) {
          if (c.data.tokenId !== this.token.id) return arr;
        } else {
          if (c.data.actorId !== this.actor.id) return arr;
          if (c.token.isLinked !== true) return arr;
        }

        if (!initiativeConfiguration.rerollInitiative && c.initiative !== null)
          return arr;
        arr.push(c.id);
        return arr;
      }, []);
      await game.combat.rollInitiative(combatantToken, initiativeConfiguration);
      return game.combat;
    } else {
      DegenesisCombat.rollInitiativeForFromHell(this.actor);
    }
  }

  async _onDrop(event) {
    /*   let transportTarget = $(event.target).parent(".transport-drop")[0];
    if (transportTarget) {
      let jsonData = JSON.parse(event.dataTransfer.getData("text/plain"));
      let itemData = await fromUuid(jsonData.uuid);
      if (
        itemData.type == "weapon" ||
        itemData.type == "armor" ||
        itemData.type == "ammunition" ||
        itemData.type == "equipment" ||
        itemData.type == "mod" ||
        itemData.type == "shield" ||
        itemData.type == "artifact"
      )
        this.actor.updateEmbeddedDocuments("Item", [
          {
            _id: itemData._id,
            "data.location": transportTarget.dataset["itemId"],
          },
        ]);
    } else { */
    let dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
    if (dropData.type == "item") {
      return this.actor.createEmbeddedDocuments("Item", [dropData.payload]);
    }

    super._onDrop(event);
  }

  _onDiamondClick(event) {
    let actorData = this.actor.toObject();
    let index = Number($(event.currentTarget).attr("data-index"));
    let target = $(event.currentTarget)
      .parents(".diamond-row")
      .attr("data-target");
    if (target == "item") {
      let itemData = this.actor.items
        .get($(event.currentTarget).parents(".item").attr("data-item-id"))
        .toObject();
      target = $(event.currentTarget)
        .parents(".diamond-row")
        .attr("data-item-target");
      let value = getProperty(itemData, target);
      if (value == index + 1)
        // If the last one was clicked, decrease by 1
        setProperty(itemData, target, index);
      // Otherwise, value = index clicked
      else setProperty(itemData, target, index + 1);
      this.actor.updateEmbeddedDocuments("Item", [itemData]);
      return;
    }

    // Fix for condition values being changed over their max/min value.

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parents(".diamond-row")
        .attr("data-targetParent");
      let parentValues = getProperty(this.actor, targetParent);

      // Minimum is checked for permanent spore infestation, else 0
      let minimum;
      let maximum;

      if (parentValues.override > 0) {
        maximum = parentValues.override;
      } else {
        maximum = parentValues.max;
      }
      if (parentValues.permanent > 0) {
        minimum = parentValues.permanent;
      } else {
        minimum = 0;
      }

      if (index + 1 <= maximum && index + 1 > minimum) {
        if (parentValues.value == index + 1)
          // If the last one was clicked, decrease by 1
          setProperty(actorData, target, index);
        // Otherwise, value = index clicked
        else setProperty(actorData, target, index + 1); // If attribute selected
        let attributeElement = $(event.currentTarget).parents(".attribute");
        if (attributeElement.length) {
          // Constrain attributes to be greater than 0
          if (getProperty(actorData, target) <= 0)
            setProperty(actorData, target, 1);
        }
      }
    } else {
      let value = getProperty(actorData, target);
      if (value == index + 1)
        // If the last one was clicked, decrease by 1
        setProperty(actorData, target, index);
      // Otherwise, value = index clicked
      else setProperty(actorData, target, index + 1); // If attribute selected
      let attributeElement = $(event.currentTarget).parents(".attribute");
      if (attributeElement.length) {
        // Constrain attributes to be greater than 0
        if (getProperty(actorData, target) <= 0)
          setProperty(actorData, target, 1);
      }
    }
    this.actor.update(actorData);
  }
  _onPermaDiamondClick(event) {
    if (event.button != 2) return;
    let actorData = this.actor.toObject();
    let index = Number($(event.currentTarget).attr("data-index"));
    let target = "system.condition.spore.permanent";
    let value = getProperty(actorData, target);
    if (value == index + 1)
      // If the last one was clicked, decrease by 1
      setProperty(actorData, target, index);
    // Otherwise, value = index clicked
    else setProperty(actorData, target, index + 1); // If attribute selected
    let attributeElement = $(event.currentTarget).parents(".attribute");
    if (attributeElement.length) {
      // Constrain attributes to be greater than 0
      if (getProperty(actorData, target) <= 0)
        setProperty(actorData, target, 1);
    }
    this.actor.update(actorData);
  }
  _onCheckboxClick(event) {
    let target = $(event.currentTarget).attr("data-target");
    if (target == "item") {
      target = $(event.currentTarget).attr("data-item-target");
      let item = this.actor.items.get(
        $(event.currentTarget).parents(".item").attr("data-item-id")
      );
      item.update({ [`${target}`]: !getProperty(item, target) });
      return;
    }
    if (target)
      this.actor.update({ [`${target}`]: !getProperty(this.actor, target) });
  }
  // END OF CLASS
}
