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
      width: 685,
      height: 723,
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


    // Respond to diamond clicks
    html.find(".diamond").click(ev => {
      let actorData = duplicate(this.actor)
      let index = Number($(ev.currentTarget).attr("data-index"));
      let target = $(ev.currentTarget).parents(".diamond-row").attr("data-target")

      let value = getProperty(actorData, target)
      if (value == index + 1)                 // If the last one was clicked, decrease by 1
        setProperty(actorData, target, index)
      else                                    // Otherwise, value = index clicked
        setProperty(actorData, target, index + 1)

      // If attribute selected
      let attributeElement = $(ev.currentTarget).parents(".attribute");
      if (attributeElement.length)
      {
        // Constrain attributes to be greater than 0
        if (getProperty(actorData, target) <= 0)
          setProperty(actorData, target, 1)
      }

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
      }
      else 
        relationships[index][editType] = elem[0].value
      
      relationships = relationships.filter(r => !!r.group)
      this.actor.update({"data.relationships" : relationships})
    })

  }

  /* -------------------------------------------- */
}
