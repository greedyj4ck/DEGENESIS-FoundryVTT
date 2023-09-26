// NPC Actor Sheet
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
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

export class DegenesisNPCSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["degenesis", "sheet", "npc"],
      template: "systems/degenesis/templates/actor/npc/npc-sheet.html",
      width: 720,
      height: 720,
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
    // Prepare attributeSkillGroups

    sheetData.attributeSkillGroups = this.sortAttributesSkills();
    // sheetData.enrichment = await this._handleEnrichment();

    sheetData.conceptIcon = this.actor.details.concept.value
      ? `systems/degenesis/icons/concept/${this.actor.details.concept.value}.svg`
      : "systems/degenesis/icons/blank.png";
    sheetData.cultIcon = this.actor.details.cult.value
      ? `systems/degenesis/icons/cult/${this.actor.details.cult.value}.svg`
      : "systems/degenesis/icons/blank.png";
    sheetData.cultureIcon = this.actor.details.culture.value
      ? `systems/degenesis/icons/culture/${this.actor.details.culture.value}.svg`
      : "systems/degenesis/icons/blank.png";
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

    return expandObject(enrichment);
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

    // Plus and Minus buttons handlers

    html.find(".btn-add").click(this._onButtonAddClick.bind(this));
    html.find(".btn-remove").click(this._onButtonRemoveClick.bind(this));

    // Roll functionality for skills

    html.find(".skill-name").click(this._onSkillClick.bind(this));

    //  html.find(".dynamic-input").keydown(this._dynamicInput.bind(this));

    //html.find(".initiative-roll").click(this._onInitiativeClick.bind(this)); // Initiative Roll
    //html.find(".diamond").click(this._onDiamondClick.bind(this));
    //html.find(".perma").mousedown(this._onPermaDiamondClick.bind(this));
    //html.find(".checkbox").click(this._onCheckboxClick.bind(this));

    //$("input[type=text]").focusin(function () {
    //  $(this).select();
    //});

    // Update Inventory Item
    //html.find(".item-add").click(this._onItemCreate.bind(this));
    //html.find(".item-edit").click(this._onItemEdit.bind(this));
    //html.find(".item-delete").click(this._onItemDelete.bind(this));
    //html.find(".item-post").click(this._onPostItem.bind(this));

    // Attack and defense items hooks
    //html.find(".roll-attack").click(this._onAttackClick.bind(this));
    //html.find(".roll-defense").click(this._onDefenseClick.bind(this));

    //html
    //html.find(".dropdown").click(this._onDropdown.bind(this));

    //.find(".relationships-cultes,.relationships-bonus")
    //.change(this._onRelationshipEdit.bind(this));

    //html.find(".quality-dropdown").click(this._onQualityDropdown.bind(this));
    //html
    //.find(".complications-name, .complications-rating")
    //.change(this._onComplicationEdit.bind(this));

    //html.find(".fight-roll").click(this._onFightClick.bind(this));

    //html.find(".quantity-click").mousedown(this._onQualityClick.bind(this));
    //html.find(".reload-click").mousedown(this._onReloadClick.bind(this));
    //html.find(".aggregate").click(this._onAggregateClick.bind(this));
    //html
    //.find(".tag.container-item")
    //.mousedown(this._onContainerItemClick.bind(this));
  }

  _onButtonAddClick(event) {
    let actorData = this.actor.toObject();

    let target = $(event.currentTarget).parent().attr("data-target");
    let currentValue = getProperty(actorData, target);

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parent()
        .attr("data-targetParent");
      let parentValues = getProperty(this.actor, targetParent);

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
          setProperty(actorData, target, minimum);
        } else {
          setProperty(actorData, target, currentValue - 1);
        }
      } else {
        if (currentValue + 1 > maximum) {
          setProperty(actorData, target, maximum);
        } else {
          setProperty(actorData, target, currentValue + 1);
        }
      }
    } else {
      setProperty(actorData, target, currentValue + 1);
    }

    this.actor.update(actorData);
  }

  _onButtonRemoveClick(event) {
    let actorData = this.actor.toObject();

    let target = $(event.currentTarget).parent().attr("data-target");
    let currentValue = getProperty(actorData, target);

    if (target.split(".")[1] === "condition") {
      let targetParent = $(event.currentTarget)
        .parent()
        .attr("data-targetParent");
      let parentValues = getProperty(this.actor, targetParent);

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
          setProperty(actorData, target, maximum);
        } else {
          setProperty(actorData, target, currentValue + 1);
        }
      } else {
        if (currentValue - 1 < minimum) {
          setProperty(actorData, target, minimum);
        } else {
          setProperty(actorData, target, currentValue - 1);
        }
      }
    } else {
      setProperty(actorData, target, currentValue + -1);
    }

    this.actor.update(actorData);
  }

  async _onSkillClick(event) {
    let skill = $(event.currentTarget).attr("data-target");
    let skipDialog = event.ctrlKey;

    await this.actor.rollNPCSkill(skill, { skipDialog });
  }

  /* ######## FUNCTIONALITY ########*/

  // END OF CLASS
}
