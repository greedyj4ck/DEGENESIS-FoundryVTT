import { DEGENESIS } from "../config.js";
import { MODULE } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js";
import { DegenesisItem } from "../item/item-degenesis.js";
import { DegenesisCombat } from "../combat-degenesis.js";
import ActorConfigure from "../apps/actor-configure.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DegenesisCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["degenesis", "sheet", "actor", "character"],
      template:
        "systems/degenesis/templates/actor/character/character-sheet.html",
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
        ".tab-content-container",
        "div.modifiers-data",
        "div.complications-data",
        "div.arsenal-state-container",
        "div.inventory-list-container",
      ],
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _renderOuter() {
    const html = await super._renderOuter();
    const header = html[0].querySelector(".window-header");

    // Add edit <-> play slide toggle.

    if (this.isEditable) {
      const toggleDiv = document.createElement("div");
      toggleDiv.classList.add("edit-switch-container");

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.id = "edit-switch";
      toggle.classList.add("lock-slider");
      toggle.checked = !this.isLocked();

      const label = document.createElement("label");
      label.htmlFor = "edit-switch";
      label.dataset.tooltip = "UI.SheetLocked";
      label.setAttribute("aria-label", game.i18n.localize("UI.SheetLocked"));

      toggle.addEventListener("change", this._onChangeSheetLock.bind(this));
      toggle.addEventListener("dblclick", (event) => event.stopPropagation());

      label.addEventListener("dblclick", (event) => event.stopPropagation());

      toggleDiv.appendChild(toggle);
      toggleDiv.appendChild(label);
      header.insertAdjacentElement("afterbegin", toggleDiv);
    }

    // Adjust header buttons.
    header.querySelectorAll(".header-button").forEach((btn) => {
      const label = btn.querySelector(":scope > i").nextSibling;
      btn.dataset.tooltip = label.textContent;
      btn.setAttribute("aria-label", label.textContent);
      label.remove();
    });
    /* 
    const idLink = header.querySelector(".document-id-link");
    if ( idLink ) {
      const firstButton = header.querySelector(".header-button");
      firstButton?.insertAdjacentElement("beforebegin", idLink);
    }

    if ( !game.user.isGM && this.actor.limited ) {
      html[0].classList.add("limited");
      return html;
    }
 */

    return html;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.actor.isOwner) {
      buttons.unshift({
        label: "DGNS.Configure",
        class: "configure",
        icon: "fas fa-wrench",
        onclick: (ev) => new ActorConfigure(this.actor).render(true),
      });
    }
    return buttons;
  }

  /* -------------------------------------------- */
  /** @override */

  // Experimental ASYNC

  async getData() {
    const data = await super.getData();

    data.system = data.actor.system;

    // Used for Modifier item list
    data.modifyActions = DEG_Utility.getModificationActions();

    await this.prepareSheetData(data);
    return data;
  }

  // Experimental ASYNC

  async prepareSheetData(sheetData) {
    sheetData.attributeSkillGroups = this.sortAttributesSkillsDiamonds();
    sheetData.conceptIcon = this.actor.details.concept.value
      ? `systems/degenesis/icons/concept/${this.actor.details.concept.value}.svg`
      : "systems/degenesis/icons/blank.svg";
    sheetData.cultIcon = this.actor.details.cult.value
      ? `systems/degenesis/icons/cult/${this.actor.details.cult.value}.svg`
      : "systems/degenesis/icons/blank.svg";
    sheetData.cultureIcon = this.actor.details.culture.value
      ? `systems/degenesis/icons/culture/${this.actor.details.culture.value}.svg`
      : "systems/degenesis/icons/blank.svg";

    if (sheetData.system.general.encumbrance.pct > 100) {
      sheetData.system.general.encumbrance.color = "var(--degenesis-red)";
    } else {
      sheetData.system.general.encumbrance.color = "black";
    }

    DEG_Utility.addDiamonds(sheetData.system.scars.infamy, 6);
    DEG_Utility.addDiamonds(
      sheetData.system.condition.ego,
      Math.max(sheetData.system.condition.ego.max + 3, 24)
    );
    DEG_Utility.addDiamonds(
      sheetData.system.condition.spore,
      Math.max(sheetData.system.condition.spore.max + 3, 24)
    );
    DEG_Utility.addDiamonds(
      sheetData.system.condition.fleshwounds,
      Math.max(sheetData.system.condition.fleshwounds.max + 3, 24)
    );
    DEG_Utility.addDiamonds(
      sheetData.system.condition.trauma,
      Math.max(sheetData.system.condition.trauma.max + 3, 12)
    );
    DEG_Utility.addDiamonds(sheetData.system.state.cover, 3);
    DEG_Utility.addDiamonds(sheetData.system.state.spentEgo, 3);

    for (let bg in sheetData.system.backgrounds) {
      DEG_Utility.addDiamonds(sheetData.system.backgrounds[bg], 6);
      sheetData.system.backgrounds[bg].label = game.i18n
        .localize(sheetData.system.backgrounds[bg].label)
        .toUpperCase();
    }

    sheetData.inventory = this.constructInventory();
    sheetData.arsenal = this.constructArsenal();
    sheetData.transportation = {
      header: game.i18n.localize("DGNS.Transportation"),
      type: "transportation",
      items: this.actor.transportationItems,
      toggleDisplay: game.i18n.localize("DGNS.Dropped"),
    };

    // Enrich raw HTML for Text Editor and expand for new functionalities like links...
    // Borrowed from moo-man's WRFP implementation ^_^ <3

    sheetData.enrichment = await this._handleEnrichment();

    /// Add Sheet edit lock flag if not exists
    if (sheetData.document.getFlag(MODULE, "sheetLocked") === undefined) {
      sheetData.document.setFlag(MODULE, "sheetLocked", true);
    }
  }

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

    return foundry.utils.expandObject(enrichment);
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

  sortAttributesSkillsDiamonds() {
    let attributeSkillGroups = this.sortAttributesSkills();

    const isFocus = !!attributeSkillGroups.intellect.skills.focus.value;
    const type = isFocus ? "focus" : "primal";

    for (let attrKey in attributeSkillGroups) {
      let attrGroup = attributeSkillGroups[attrKey];
      DEG_Utility.addDiamonds(attrGroup, 6);
      DEG_Utility.addAttributeType(attrGroup, attrKey, type);
      for (let skillKey in attrGroup.skills) {
        DEG_Utility.addDiamonds(attrGroup.skills[skillKey], 6);

        if (skillKey == "faith" && attrGroup.skills[skillKey].value) {
          attrGroup.skills["willpower"].unused = true;
          attrGroup.skills[skillKey].unused = false;
        } else if (
          skillKey == "willpower" &&
          attrGroup.skills[skillKey].value
        ) {
          attrGroup.skills["faith"].unused = true;
          attrGroup.skills[skillKey].unused = false;
        } else if (skillKey == "primal" && attrGroup.skills[skillKey].value) {
          attributeSkillGroups["intellect"].skills["focus"].unused = true;
          attrGroup.skills[skillKey].unused = false;
        } else if (skillKey == "focus" && attrGroup.skills[skillKey].value) {
          attributeSkillGroups["instinct"].skills["primal"].unused = true;
          attrGroup.skills[skillKey].unused = false;
        }
      }
    }
    return attributeSkillGroups;
  }

  constructInventory() {
    return {
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

      /**survivalEquipment : {header : game.i18n.localize("DGNS.Survival"), type: 'survivalEquipment', items : []},
            technology : {header : game.i18n.localize("DGNS.Technology"), type: 'technology', items : []},
            medicalEquipment : {header : game.i18n.localize("DGNS.Medicine"), type: 'medicalEquipment', items : []},
            elysianOils : {header : game.i18n.localize("DGNS.ElysianOils"), type: 'elysianOil', items : []},
            burn : {header : game.i18n.localize("DGNS.Burn"), type: 'burn', items : []},
            primalIngenuity : {header : game.i18n.localize("DGNS.PrimalIngenuity"), type: 'primalIngenuity', items : []},
            other : {header : game.i18n.localize("DGNS.Other"), type: 'other', items : []},*/
    };
  }

  constructArsenal() {
    return {
      meleeWeapons: this.actor.weaponItems.filter(
        (i) => i.isMelee && i.equipped && !i.inContainer
      ),
      rangedWeapons: this.actor.weaponItems.filter(
        (i) => i.isRanged && i.equipped && !i.inContainer
      ),
      sonicWeapons: this.actor.weaponItems.filter(
        (i) => i.isSonic && i.equipped && !i.inContainer
      ),
      armor: this.actor.armorItems.filter((i) => i.equipped && !i.inCointaer),
    };
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

    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".item-add").click(this._onItemCreate.bind(this));
    html.find(".item-post").click(this._onPostItem.bind(this));
    html.find(".diamond").click(this._onDiamondClick.bind(this));

    html.find(".perma").mousedown(this._onPermaDiamondClick.bind(this));
    html.find(".checkbox").click(this._onCheckboxClick.bind(this));
    html
      .find(".relationships-cultes,.relationships-bonus")
      .change(this._onRelationshipEdit.bind(this));
    html.find(".dropdown").click(this._onDropdown.bind(this));
    html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this));
    html
      .find(".complications-name, .complications-rating")
      .change(this._onComplicationEdit.bind(this));
    html.find(".skill-name").click(this._onSkillClick.bind(this));
    html.find(".initiative-roll").click(this._onInitiativeClick.bind(this));
    html.find(".fight-roll").click(this._onFightClick.bind(this));
    html.find(".roll-weapon").click(this._onWeaponClick.bind(this));
    html.find(".quantity-click").mousedown(this._onQualityClick.bind(this));
    html.find(".reload-click").mousedown(this._onReloadClick.bind(this));
    html.find(".aggregate").click(this._onAggregateClick.bind(this));
    html
      .find(".tag.container-item")
      .mousedown(this._onContainerItemClick.bind(this));
  }

  // Handle custom drop events (currently just putting items into containers)
  async _onDrop(event) {
    if (this.isLocked({ notify: true })) return;
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

  _onItemEdit(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.items.get(itemId).sheet.render(true);
  }
  _onItemDelete(event) {
    if (this.isLocked({ notify: true })) return;
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
  _onItemCreate(event) {
    if (this.isLocked({ notify: true })) return;
    let type = $(event.currentTarget).attr("data-item");
    this.actor.createEmbeddedDocuments("Item", [
      { name: `New ${type.capitalize()}`, type: type },
    ]);
  }

  _onPostItem(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    this.actor.items.get(itemId).postToChat();
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

      maximum = parentValues.max;

      /*   if (parentValues.override > 0) {
        //  maximum = parentValues.override;
      } else {
      
      } */
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
      if (
        target.split(".")[1] === "attributes" ||
        target.split(".")[1] === "skills" ||
        target.split(".")[1] === "backgrounds" ||
        target.split(".")[1] === "scars"
      ) {
        if (this.isLocked({ notify: true })) return;
      }

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

  _onPermaDiamondClick(event) {
    if (event.button != 2) return;
    let actorData = this.actor.toObject();
    let index = Number($(event.currentTarget).attr("data-index"));
    let target = "system.condition.spore.permanent";
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
    this.actor.update(actorData);
  }
  _onCheckboxClick(event) {
    let target = $(event.currentTarget).attr("data-target");
    if (target == "item") {
      target = $(event.currentTarget).attr("data-item-target");
      let item = this.actor.items.get(
        $(event.currentTarget).parents(".item").attr("data-item-id")
      );
      item.update({ [`${target}`]: !foundry.utils.getProperty(item, target) });
      return;
    }
    if (target)
      this.actor.update({
        [`${target}`]: !foundry.utils.getProperty(this.actor, target),
      });
  }
  _onRelationshipEdit(event) {
    let elem = $(event.currentTarget);
    let editType = elem.hasClass("relationships-cultes") ? "group" : "modifier";
    let relationships = foundry.utils.deepClone(
      this.actor.system.relationships
    );
    let index = Number(elem.parents(".relationships-li").attr("data-index"));
    if (isNaN(index)) {
      // New relationship
      let newRelationship = {};
      newRelationship[editType] = elem[0].value;
      relationships.push(newRelationship);
    } else relationships[index][editType] = elem[0].value;
    relationships = relationships.filter((r) => !!r.group);
    this.actor.update({ "system.relationships": relationships });
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
  _onComplicationEdit(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    if (itemId == "new") return;

    this.actor.createEmbeddedDocuments("Item", [
      { type: "complication", name: event.target.value },
    ]);
    let item = this.actor.items.get(itemId);
    let target = $(event.currentTarget).attr("data-target");
    if (target == "name" && !event.target.value)
      return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    item.update({ target: event.target.value });
  }
  async _onSkillClick(event) {
    let skill = $(event.currentTarget).parents(".skill").attr("data-target");
    let skipDialog = event.ctrlKey;

    await this.actor.rollSkill(skill, { skipDialog });
  }
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
          if (c.system.tokenId !== this.token.id) return arr;
        } else {
          if (c.system.actorId !== this.actor.id) return arr;
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
      DegenesisCombat.rollInitiativeFor(this.actor);
    }
  }

  async _onFightClick(event) {
    let type = $(event.currentTarget).attr("data-roll");
    let skipDialog = event.ctrlKey;
    let { rollResults, cardData } = await this.actor.rollFightRoll(type, {
      skipDialog,
    });
    DegenesisChat.renderRollCard(rollResults, cardData);
  }
  async _onWeaponClick(event) {
    let weaponId = $(event.currentTarget)
      .parents(".weapon")
      .attr("data-item-id");
    let skipDialog = event.ctrlKey;
    let use = $(event.currentTarget).attr("data-use");
    let weapon = this.actor.items.get(weaponId);

    if (weapon.system.mag.current <= 0 && weapon.isRanged && !weapon.isSonic) {
      weapon.system.mag.current = 0;
      ui.notifications.error(game.i18n.localize("UI.NoAmmoLeft"));
      return;
    }

    let { rollResults, cardData } = await this.actor.rollWeapon(weapon, {
      use,
      skipDialog,
    });
    DegenesisChat.renderRollCard(rollResults, cardData);
  }
  _onQualityClick(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    let value = event.button == 0 ? 1 : -1;
    value = event.ctrlKey ? value * 10 : value;
    let item = this.actor.items.get(itemId);
    let newQty = item.quantity + value;
    newQty = newQty < 0 ? 0 : newQty;
    item.update({ "system.quantity": newQty });
  }
  _onReloadClick(event) {
    let itemId = $(event.currentTarget).parents(".item").attr("data-item-id");
    let item = this.actor.items.get(itemId);
    let itemData = item.toObject();
    let ammo = this.actor.getItemTypes("ammunition");
    ammo = DegenesisItem.matchAmmo(item, ammo).map((a) => a.toObject());
    let magLeft = item.mag.size - item.mag.current;
    if (event.button == 2) return item.update({ "system.mag.current": 0 });

    for (let a of ammo) {
      if (magLeft <= 0) break;
      if (magLeft <= a.system.quantity) {
        itemData.system.mag.current += magLeft;
        a.system.quantity -= magLeft;
        magLeft = 0;
      } else {
        itemData.system.mag.current += a.system.quantity;
        magLeft -= a.quantity;
        a.system.quantity = 0;
      }
    }
    this.actor.updateEmbeddedDocuments("Item", [itemData]);
    this.actor.updateEmbeddedDocuments("Item", [ammo][0]);
  }
  async _onAggregateClick(event) {
    let group = $(event.currentTarget)
      .parents(".inventory-group")
      .attr("data-group");
    if (group == "ammunition") {
      let compiledAmmoNames = [];
      let compiledAmmo = [];
      let ids = this.actor.getItemTypes("ammunition").map((i) => i.id);
      let ammo = await this.actor
        .deleteEmbeddedDocuments("Item", ids)
        .map((i) => i.data);

      for (let a of ammo)
        if (!compiledAmmoNames.includes(a.name)) compiledAmmoNames.push(a.name);

      for (let name of compiledAmmoNames) {
        let ammoToCombine = ammo.filter((a) => a.name == name);
        let ammoItem = ammoToCombine[0];
        ammoItem.data.quantity = ammoToCombine.reduce(
          (a, b) => a + b.data.quantity,
          0
        );
        compiledAmmo.push(ammoItem);
      }
      this.actor.createEmbeddedDocuments("Item", [compiledAmmo]);
    }
  }
  _onContainerItemClick(event) {
    let itemId = $(event.currentTarget).attr("data-item-id");
    let item = this.actor.items.get(itemId);
    if (event.button == 2) {
      item.update({ "system.location": "" });
    } else item.sheet.render(true);
  }

  async _onChangeSheetLock(event) {
    const toggle = event.currentTarget;
    const label = toggle.nextElementSibling;

    /*     const label = game.i18n.localize(
      `DND5E.SheetMode${toggle.checked ? "Play" : "Edit"}`
    );
    toggle.dataset.tooltip = label;
    toggle.setAttribute("aria-label", label); */

    if (this.isLocked()) {
      this.document.setFlag(MODULE, "sheetLocked", false);
      toggle.checked = true;
      label.dataset.tooltip = "UI.SheetUnlocked";
      label.setAttribute("aria-label", game.i18n.localize("UI.SheetUnlocked"));
    } else {
      this.document.setFlag(MODULE, "sheetLocked", true);
      toggle.checked = false;
      label.dataset.tooltip = "UI.SheetLocked";
      label.setAttribute("aria-label", game.i18n.localize("UI.SheetLocked"));
    }
  }

  /* -------------------------------------------- */

  /* HELPER FUNCTIONS */

  isLocked(notify = false) {
    let lockStatus = this.document.getFlag(MODULE, "sheetLocked");

    if (lockStatus !== undefined) {
      if (lockStatus) {
        if (notify) {
          ui.notifications.notify(
            game.i18n.localize("UI.SheetLockedNotification")
          );
        }
        return true;
      } else {
        return false;
      }
    } else return true;
  }
}
