import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DegenesisItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
			classes: ["degenesis", "sheet", "item"],
			width: 520,
			height: 480,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details"}]
		});
  }

  get template() {
    return `systems/degenesis/templates/item/item-${this.item.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();


    data.techValues = DEGENESIS.techValues
    if (data.type = "modifier")
    {
      if (data.data.action == "custom")
        data.customAction = true;
      data.modifyActions = DEG_Utility.getModificationActions();
      data.modifyTypes = DEGENESIS.modifyTypes;
    }
    if (data.type = "weapon")
    {
      data["weaponGroups"] = DEGENESIS.weaponGroups;
      data["qualities"] = {};
      data.isMelee = DEGENESIS.weaponGroupSkill[data.data.group] == "projectiles" ? false : true 
      for (let q in DEGENESIS.weaponQualities)
      {
        data["qualities"][q] = {
          "name" : DEGENESIS.weaponQualities[q],
          "description" : DEGENESIS.weaponQualityDescription[q],
          "values" : DEGENESIS.weaponQualitiesValues[q]
        }
      }
    }


    return data;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);


    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

  }

  /* -------------------------------------------- */

}
