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
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
  }

  get template() {
    return `systems/degenesis/templates/item/item-${this.item.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();


    if (data.type = "modifier")
    {
      if (data.data.action == "custom")
        data.customAction = true;
      data.modifyActions = DEG_Utility.getModificationActions();
      data.modifyTypes = DEGENESIS.modifyTypes;
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
