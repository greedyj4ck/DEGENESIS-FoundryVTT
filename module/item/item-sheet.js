import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { ItemQualities } from "../apps/item-qualities.js"

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DegenesisItemSheet extends ItemSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
			classes: ["degenesis", "sheet", "item"],
			width: 550,
			height: 534,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      scrollY: [".sheet-body"]
		});
  }

  get template() {
    return `systems/degenesis/templates/item/item-${this.item.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    this.loadConfigData(data)
    mergeObject(data, this.item.prepare())
    return data;
  }

  loadConfigData(data) 
  {
    data.techValues = DEGENESIS.techValues
    if (data.item.type == "modifier")
    {
      data.modifyActions = DEG_Utility.getModificationActions();
      data.modifyTypes = DEGENESIS.modifyTypes;
      if (data.data.action == "custom")
        data.customAction = true;
    }
    if (data.item.type == "weapon")
    {
      data.weaponGroups = DEGENESIS.weaponGroups;
      data.calibers = DEGENESIS.calibers;
    }
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
        let quality = {}
        quality.name = $(ev.currentTarget).attr("data-quality");
        quality.values = duplicate(DEGENESIS[`${this.item.type}QualitiesValues`][quality.name]);
        
        let valueInputs = $(ev.currentTarget).parents(".item-quality").find(".quality-value")

        for(let i = 0 ; i < valueInputs.length; i++)
          quality.values[i] = {name : quality.values[i], value : valueInputs[i].value}

        let qualities = duplicate(this.item.data.data.qualities);
        if (qualities.find(q => q.name == quality.name))
          qualities.splice(qualities.findIndex(q => q.name == quality.name), 1)
        else
          qualities.push(quality)

        this.item.update({"data.qualities" : qualities})
        return;
      }

      if (target)
        setProperty(itemData, target, !getProperty(itemData, target))
      this.item.update(itemData);
    })

    html.find(".quality-value").change(ev => {
      let target = $(ev.currentTarget).parents(".quality-inputs").attr("data-quality");
      let valueKey = $(ev.currentTarget).attr("data-value-key");
      let qualities = duplicate(this.item.data.data.qualities)
      let existingQuality = qualities.find(q => q.name == target)
      if (!existingQuality)
        return
      existingQuality.values.find(v => v.name == valueKey).value = ev.target.value
      this.item.update({"data.qualities" : qualities});
    })


    html.find(".item-quality-config").click(ev => {
      new ItemQualities(this.item).render(true)
    })

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

  }

  /* -------------------------------------------- */

}
