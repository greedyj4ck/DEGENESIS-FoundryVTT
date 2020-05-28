import { DEGENESIS } from "../config.js";

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
      width: 600,
      height: 750,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".tab-content", initial: "main"}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    this.loadConfigData(data);
    data.conceptIcon = this.actor.data.data.details.concept.value ? `systems/degenesis/icons/concept/${this.actor.data.data.details.concept.value}.svg` : "systems/degenesis/icons/blank.png";
    data.cultIcon = this.actor.data.data.details.cult.value ? `systems/degenesis/icons/cult/${this.actor.data.data.details.cult.value}.svg` : "systems/degenesis/icons/blank.png";
    data.cultureIcon = this.actor.data.data.details.culture.value ? `systems/degenesis/icons/culture/${this.actor.data.data.details.culture.value}.svg` : "systems/degenesis/icons/blank.png";

    data.data.status.ego.pct = (1 - data.data.status.ego.value / data.data.status.ego.max)*100;
    data.data.status.fleshwounds.pct = (1 - data.data.status.fleshwounds.value / data.data.status.fleshwounds.max)*100;
    data.data.status.spore.pct = (1 - data.data.status.spore.value / data.data.status.spore.max)*100;
    data.data.status.trauma.pct = (1 - data.data.status.trauma.value / data.data.status.trauma.max)*100;

    mergeObject(data, this.actor.prepare());
    return data;
  }

  /* -------------------------------------------- */


  loadConfigData(sheetData) {
    sheetData.concepts = DEGENESIS.concepts
    sheetData.cults = DEGENESIS.cults
    sheetData.cultures = DEGENESIS.cultures


  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    $("input[type=text]").focusin(function() {
      $(this).select();
    });


    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */
}
