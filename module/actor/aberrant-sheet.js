import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js";
import { DegenesisItem } from "../item/item-degenesis.js";
import { DegenesisCombat } from "../combat-degenesis.js";
import ActorConfigure from "../apps/actor-configure.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

export class DegenesisAberrantSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["degenesis", "sheet", "actor", "aberrant"],
      template:
        "systems/degenesis/templates/actor/aberrant/aberrant-sheet.html",
      width: 720,
      height: 720,
      tabs: [
        {
          navSelector: ".sh-tabs",
          contentSelector: ".tab-content-container",
          initial: "main",
        },
      ],
      scrollY: [
        ".relationship",
        ".tab-content",
        ".combat-container",
        ".phenomena-container",
        ".inventory-list-container",
      ],
    });
  }

  /* ######## DATA PREPARATION STAGE  ######## */
  // Preparing data for Sheet to be displayed

  async getData() {
    const data = await super.getData();

    data.system = data.actor.system;

    // Used for Modifier item list
    data.modifyActions = DEG_Utility.getModificationActions();
    await this.prepareSheetData(data);

    return data;
  }

  async prepareSheetData(sheetData) {
    sheetData.raptureIcon = this.actor.system.rapture
      ? `systems/degenesis/icons/from-hell/${this.actor.system.rapture}.svg`
      : "systems/degenesis/icons/from-hell/psychonautics.svg";

    sheetData.phaseIcon = `systems/degenesis/icons/state/${this.actor.system.phase}.svg`;
    sheetData.attributeSkillGroups = this.sortAttributesSkills(); // Prepare attributeSkillGroups
    sheetData.inventory = this.constructInventory(); // - Construct inventory needs modification to handle all type of items
    sheetData.transportation = {
      header: game.i18n.localize("DGNS.Transportation"),
      type: "transportation",
      items: this.actor.transportationItems,
      toggleDisplay: game.i18n.localize("DGNS.Dropped"),
    };
    sheetData.enrichment = await this._handleEnrichment();

    DEG_Utility.addDiamonds(sheetData.system.state.spentEgo, 3);
    DEG_Utility.addDiamonds(sheetData.system.state.spentSpore, 3);
  }

  sortAttributesSkills() {
    let attributeSkillGroups = {};

    for (let attribute in this.actor.attributes) {
      attributeSkillGroups[attribute] = {
        label: DEGENESIS.attributes[attribute],
        value: this.actor.attributes[attribute].value,
        skills: {},
      };
    }
    for (let skill in this.actor.skills) {
      this.actor.skills[skill].label = DEGENESIS.skills[skill];
      attributeSkillGroups[this.actor.skills[skill].attribute].skills[skill] =
        this.actor.skills[skill];
    }

    return attributeSkillGroups;
  }

  // Add HTML Enrichment stuff for editors fields (like item's links etc.)

  async _handleEnrichment() {
    let enrichment = {};

    enrichment["system.biography.value"] = await TextEditor.enrichHTML(
      this.actor.system.biography,
      { async: true, secrets: this.actor.isOwner, relativeTo: this.actor }
    );
    enrichment["system.gmnotes.value"] = await TextEditor.enrichHTML(
      this.actor.system.gmnotes,
      { async: true, secrets: this.actor.isOwner, relativeTo: this.actor }
    );
    enrichment["system.tactics.value"] = await TextEditor.enrichHTML(
      this.actor.system.tactics,
      { async: true, secrets: this.actor.isOwner, relativeTo: this.actor }
    );

    return foundry.utils.expandObject(enrichment);
  }
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

      weapons: {
        header: game.i18n.localize("DGNS.Weapons"),
        type: "weapon",
        items: this.actor.weaponItems.filter((i) => !i.inContainer),
        toggleable: true,
        toggleDisplay: game.i18n.localize("DGNS.Equipped"),
      },
      armor: {
        header: game.i18n.localize("DGNS.Armor"),
        type: "armor",
        items: this.actor.armorItems.filter((i) => !i.inContainer),
        toggleable: true,
        toggleDisplay: game.i18n.localize("DGNS.Worn"),
      },
      shields: {
        header: game.i18n.localize("DGNS.Shields"),
        type: "shield",
        items: this.actor.shieldItems.filter((i) => !i.inContainer),
        toggleable: true,
        toggleDisplay: game.i18n.localize("DGNS.Equipped"),
      },
      ammunition: {
        header: game.i18n.localize("DGNS.Ammunition"),
        type: "ammunition",
        items: this.actor.ammunitionItems.filter((i) => !i.inContainer),
      },
      equipment: {
        header: game.i18n.localize("DGNS.Equipments"),
        type: "equipment",
        items: this.actor.equipmentItems.filter((i) => !i.inContainer),
      },
      mods: {
        header: game.i18n.localize("DGNS.Mods"),
        type: "mod",
        items: this.actor.modItems.filter((i) => !i.inContainer),
      },
      artifact: {
        header: game.i18n.localize("DGNS.Artifact"),
        type: "artifact",
        items: this.actor.artifactItems.filter((i) => !i.inContainer),
      },
    };
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

    // Update Inventory Item
    html.find(".item-add").click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".item-post").click(this._onPostItem.bind(this));

    // Plus and Minus buttons handlers

    html.find(".btn-add").click(this._onButtonAddClick.bind(this));
    html.find(".btn-remove").click(this._onButtonRemoveClick.bind(this));

    // Roll functionality for skills

    html.find(".skill-name").click(this._onSkillClick.bind(this));
    html.find(".diamond").click(this._onDiamondClick.bind(this));

    html.find(".initiative-roll").click(this._onInitiativeClick.bind(this)); // Initiative Roll

    // Attack and defense items hooks
    html.find(".roll-attack").click(this._onAttackClick.bind(this));
    html.find(".roll-defense").click(this._onDefenseClick.bind(this));

    html.find(".dropdown").click(this._onDropdown.bind(this));
    html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this));

    html
      .find(".phenomenon-activate")
      .click(this._onPhenomenonActivateClick.bind(this));

    html
      .find(".tag.container-item")
      .mousedown(this._onContainerItemClick.bind(this));

    html.find("input.stat-input").blur(this._onStatInput.bind(this));

    //  html.find(".dynamic-input").keydown(this._dynamicInput.bind(this));
  }

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

  _onButtonAddClick(event) {
    let actorData = this.actor.toObject();

    let target = $(event.currentTarget).parent().attr("data-target");
    let currentValue = foundry.utils.getProperty(actorData, target);

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parent()
        .attr("data-targetParent");
      let parentValues = foundry.utils.getProperty(this.actor, targetParent);

      let minimum;
      let maximum;

      maximum = parentValues.max;

      if (parentValues.permanent > 0) {
        minimum = parentValues.permanent;
      } else {
        minimum = 0;
      }

      if (target === "system.condition.ego.value") {
        if (currentValue - 1 < minimum) {
          foundry.utils.setProperty(actorData, target, minimum);
        } else {
          foundry.utils.setProperty(actorData, target, currentValue - 1);
        }
      } else {
        if (currentValue + 1 > maximum) {
          foundry.utils.setProperty(actorData, target, maximum);
        } else {
          foundry.utils.setProperty(actorData, target, currentValue + 1);
        }
      }
    } else {
      foundry.utils.setProperty(actorData, target, currentValue + 1);
    }

    this.actor.update(actorData);
  }

  _onButtonRemoveClick(event) {
    let actorData = this.actor.toObject();

    let target = $(event.currentTarget).parent().attr("data-target");
    let currentValue = foundry.utils.getProperty(actorData, target);

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parent()
        .attr("data-targetParent");
      let parentValues = foundry.utils.getProperty(this.actor, targetParent);

      let minimum;
      let maximum;

      maximum = parentValues.max;

      if (parentValues.permanent > 0) {
        minimum = parentValues.permanent;
      } else {
        minimum = 0;
      }

      if (target === "system.condition.ego.value") {
        if (currentValue + 1 > maximum) {
          foundry.utils.setProperty(actorData, target, maximum);
        } else {
          foundry.utils.setProperty(actorData, target, currentValue + 1);
        }
      } else {
        if (currentValue - 1 < minimum) {
          foundry.utils.setProperty(actorData, target, minimum);
        } else {
          foundry.utils.setProperty(actorData, target, currentValue - 1);
        }
      }
    } else {
      foundry.utils.setProperty(actorData, target, currentValue + -1);
    }

    this.actor.update(actorData);
  }

  async _onSkillClick(event) {
    let skill = $(event.currentTarget).attr("data-target");
    let skipDialog = event.ctrlKey;

    await this.actor.rollNPCSkill(skill, { skipDialog });
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
      let value = foundry.utils.getProperty(itemData, target);
      if (value == index + 1)
        // If the last one was clicked, decrease by 1
        foundry.utils.setProperty(itemData, target, index);
      // Otherwise, value = index clicked
      else foundry.utils.setProperty(itemData, target, index + 1);
      this.actor.updateEmbeddedDocuments("Item", [itemData]);
      return;
    }

    // Fix for condition values being changed over their max/min value.

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parents(".diamond-row")
        .attr("data-targetParent");
      let parentValues = foundry.utils.getProperty(this.actor, targetParent);

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
          foundry.utils.setProperty(actorData, target, index);
        // Otherwise, value = index clicked
        else foundry.utils.setProperty(actorData, target, index + 1); // If attribute selected
        let attributeElement = $(event.currentTarget).parents(".attribute");
        if (attributeElement.length) {
          // Constrain attributes to be greater than 0
          if (foundry.utils.getProperty(actorData, target) <= 0)
            foundry.utils.setProperty(actorData, target, 1);
        }
      }
    } else {
      let value = foundry.utils.getProperty(actorData, target);
      if (value == index + 1)
        // If the last one was clicked, decrease by 1
        foundry.utils.setProperty(actorData, target, index);
      // Otherwise, value = index clicked
      else foundry.utils.setProperty(actorData, target, index + 1); // If attribute selected
      let attributeElement = $(event.currentTarget).parents(".attribute");
      if (attributeElement.length) {
        // Constrain attributes to be greater than 0
        if (foundry.utils.getProperty(actorData, target) <= 0)
          foundry.utils.setProperty(actorData, target, 1);
      }
    }
    this.actor.update(actorData);
  }

  // Combat hooks

  async _onInitiativeClick(event) {
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
          if (c.tokenId !== this.token.id) return arr;
        } else {
          if (c.actor.system.actorId !== this.actor.id) return arr;
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
      DegenesisCombat.rollInitiativeForAberrant(this.actor);
    }
  }

  // Attack roll using new simplified dice roll manager
  async _onAttackClick(event) {
    let attackId = $(event.currentTarget)
      .parents(".attack")
      .attr("data-item-id");
    let skipDialog = event.ctrlKey;
    let use = $(event.currentTarget).attr("data-use");
    let attack = this.actor.items.get(attackId);

    // Add conditional for range weapons without ammo

    let { rollResults, cardData } = await this.actor.rollAttack(attack, {
      use,
      skipDialog,
    });
    DegenesisChat.renderRollCard(rollResults, cardData);
  }

  // Defense roll using new simplified dice roll manager
  async _onDefenseClick(event) {
    let defenseId = $(event.currentTarget)
      .parents(".defense")
      .attr("data-item-id");
    let skipDialog = event.ctrlKey;
    let use = $(event.currentTarget).attr("data-use");
    let defense = this.actor.items.get(defenseId);

    if (defense.system.group === "passive") {
      ui.notifications.notify(game.i18n.localize("UI.CannotRollPassive"));
      return;
    }

    let { rollResults, cardData } = await this.actor.rollDefense(defense, {
      use,
      skipDialog,
    });
    DegenesisChat.renderRollCard(rollResults, cardData);
  }

  _onDropdown(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    let item = this.actor.items.get(itemId);
    if (item.type !== "transportation") {
      this._dropdown(event, item.dropdownData());
    } else {
      this._dropdownTransportation(event);
    }
  }
  _dropdown(event, dropdownData) {
    let dropdownHTML = "";
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    // Toggle expansion for an item
    if (li.hasClass("expanded")) {
      // If expansion already shown - remove
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      // Add a div with the item summary belowe the item
      let div;
      if (!dropdownData) {
        return;
      } else {
        dropdownHTML = `<div class="item-summary">${dropdownData.text}`;
      }
      if (dropdownData.tags) {
        let tags = `<div class='tags'>`;
        dropdownData.tags.forEach((tag) => {
          tags = tags.concat(`<span class='tag'>${tag}</span>`);
        });
        dropdownHTML = dropdownHTML.concat(tags);
      }
      dropdownHTML += "</div>";
      div = $(dropdownHTML);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  _onQualityDropdown(event) {
    let type = $(event.currentTarget).attr("data-type");
    let key = $(event.currentTarget).attr("data-key");
    let valueObject = DEGENESIS[`${type}QualitiesValues`];
    let nameObject = DEGENESIS[`${type}Qualities`];
    let descriptionObject = DEGENESIS[`${type}QualityDescription`];
    let text = `<b>${nameObject[key]} `;
    if (Object.keys(valueObject[key]).length)
      text =
        text.concat(
          "(" +
            valueObject[key]
              .map((value) => `${DEGENESIS.qualityValues[value]}`)
              .join(", ")
        ) + "):</b> ";
    else text = text.concat(": </b>");
    text = text.concat(descriptionObject[key]);
    this._dropdown(event, { text });
  }

  // Special set of instructions for fixing transportation items
  _dropdownTransportation(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let summary = li.children(".item-summary");
    if (li.hasClass("expanded")) {
      // If expansion already shown - remove
      summary.slideUp(200);
    } else {
      // Add a div with the item summary belowe the item
      summary.slideDown(200, () => {});
    }
    li.toggleClass("expanded");
  }

  async _onDrop(event) {
    let transportTarget = $(event.target).parent(".transport-drop")[0];
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
            "system.location": transportTarget.dataset["itemId"],
          },
        ]);
    } else {
      let dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
      if (dropData.type == "item") {
        return this.actor.createEmbeddedDocuments("Item", [dropData.payload]);
      }
    }
    super._onDrop(event);
  }

  _onContainerItemClick(event) {
    let itemId = $(event.currentTarget).attr("data-item-id");
    let item = this.actor.items.get(itemId);
    if (event.button == 2) {
      item.update({ "system.location": "" });
    } else item.sheet.render(true);
  }

  async _onPhenomenonActivateClick(event) {
    let aberrant = this.actor;
    let itemId = $(event.currentTarget)
      .parents(".phenomenon")
      .attr("data-item-id");
    let phenomenon = this.actor.items.get(itemId);
    let skipDialog = event.ctrlKey;

    let actionNumber;

    if (aberrant.system.phase == "primal") {
      actionNumber = aberrant.system.condition.spore.value;
    } else {
      actionNumber =
        aberrant.system.condition.ego.max - aberrant.system.condition.ego.value;
    }

    let { rollResults, cardData } = await this.actor.rollActivatePhenomenon(
      phenomenon,
      actionNumber,
      {
        skipDialog: skipDialog,
      }
    );
    DegenesisChat.renderRollCard(rollResults, cardData);
  }

  _onStatInput(event) {
    let inputStat = $(event.currentTarget);

    let min = inputStat.attr("min");
    let max = inputStat.attr("max");

    if (max && inputStat[0].value > parseInt(max)) {
      inputStat[0].value = max;
    }

    if (min && inputStat[0].value < parseInt(min)) {
      inputStat[0].value = min;
    }
  }
}
