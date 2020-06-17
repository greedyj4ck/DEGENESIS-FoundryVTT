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
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
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
    if (data.item.type == "modifier")
    {
      if (data.data.action == "custom")
        data.customAction = true;
      data.modifyActions = DEG_Utility.getModificationActions();
      data.modifyTypes = DEGENESIS.modifyTypes;
    }
    if (data.item.type == "weapon")
    {
      data["weaponGroups"] = DEGENESIS.weaponGroups;
      data["qualities"] = {};
      data.isMelee = DEGENESIS.weaponGroupSkill[data.data.group] == "projectiles" ? false : true 
      for (let q in DEGENESIS.weaponQualities)
      {
        data["qualities"][q] = {
          "checked" : data.data.qualities.includes(q),
          "name" : DEGENESIS.weaponQualities[q],
          "description" : DEGENESIS.weaponQualityDescription[q],
          "values" : DEGENESIS.weaponQualitiesValues[q]
        }
      }
    }


    return data;
  }


  async _onDrop(event) {
    let data = JSON.parse(event.dataTransfer.getData('text/plain'));
    let item = game.items.get(data.id);
    if (!item || item.type != "mod") return;
    let mods = duplicate(this.item.getFlag("degenesis", "mods") || []);
    mods.push(item.data);
    this.item.unsetFlag("degenesis", "mods")
    await this.item.setFlag("degenesis", "mods", mods);
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    html.find(".checkbox").click(ev => {
      let itemData = duplicate(this.item)
      let target = $(ev.currentTarget).attr("data-target")

      if (target == "quality")
      {
        let quality = $(ev.currentTarget).attr("data-quality");
        let qualities = duplicate(this.item.data.data.qualities);
        if (qualities.includes(quality))
          qualities.splice(qualities.indexOf(quality), 1)
        else
          qualities.push(quality)

        this.item.update({"data.qualities" : qualities})
        return;
      }

      if (target)
        setProperty(itemData, target, !getProperty(itemData, target))
      this.item.update(itemData);
    })



    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

  }

  /* -------------------------------------------- */

}
