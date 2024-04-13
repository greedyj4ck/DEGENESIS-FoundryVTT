import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { ItemQualities } from "../apps/item-qualities.js";

/**
 * Extend the basic ItemSheet with for Degenesis
 * @extends {ItemSheet}
 */
export class DegenesisItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["degenesis", "sheet", "item"],
      width: 550,
      height: 535,
      tabs: [
        {
          navSelector: ".sh-tabs",
          contentSelector: ".sh-body",
          initial: "details",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      scrollY: [".sh-body"],
    });
  }

  get template() {
    return `systems/degenesis/templates/item/item-${this.item.type}-sheet.html`;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.item.isOwner) {
      buttons.unshift({
        label: "DGNS.Post",
        class: "post",
        icon: "fas fa-comment",
        onclick: (ev) => this.item.postToChat(),
      });
    }
    return buttons;
  }

  /** @override */
  // Experimental ASYNC
  async getData() {
    const data = await super.getData();

    /// CHECK THIS OUT
    /* const data = await super.getData();
    data.system = data.actor.system; */

    data.system = data.item._source.system;
    // console.log(data)
    this.processTypes(data);

    // Enrich raw HTML for Text Editor and expand for new functionalities like links...
    // Borrowed from moo-man's WRFP implementation ^_^ <3

    data.enrichment = await this._handleEnrichment();

    return data;
  }

  processTypes(data) {
    if (data.item.type == "modifier") {
      data.modifyActions = DEG_Utility.getModificationActions();
      if (!DEGENESIS.noType.includes(data.data.action)) data.showType = true;
    }
  }

  async _handleEnrichment() {
    let enrichment = {};
    enrichment["system.description.value"] = await TextEditor.enrichHTML(
      this.item.system.description,
      { async: true }
    );

    return foundry.utils.expandObject(enrichment);
  }

  async _onDrop(event) {
    let data = JSON.parse(event.dataTransfer.getData("text/plain"));
    let item = await Item.implementation.fromDropData(data);
    if (!item || item.type != "mod") return;
    let mods = foundry.utils.deepClone(
      this.item.getFlag("degenesis", "mods") || []
    );
    mods.push(item);
    await this.item.unsetFlag("degenesis", "mods");
    await this.item.setFlag("degenesis", "mods", mods);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    html.find(".checkbox").click(this._onCheckboxClick.bind(this));
    html.find(".quality-value").change(this._onQualityValueChange.bind(this));
    html.find(".mod-delete").click(this._onModDelete.bind(this));
    html.find(".mod-edit").click(this._onModEdit.bind(this));
    html.find(".mod-control").click(this._onModControlClick.bind(this));
    html.find(".mod-change").change(this._onModChanges.bind(this));

    html.find(".item-quality-config").click((ev) => {
      new ItemQualities(this.item).render(true);
    });
  }

  _onCheckboxClick(ev) {
    let itemData = this.item.toObject();
    let target = $(ev.currentTarget).attr("data-target");

    if (target == "quality") {
      let quality = {};
      quality.name = $(ev.currentTarget).attr("data-quality");
      quality.values = foundry.utils.deepClone(
        DEGENESIS[`${this.item.type}QualitiesValues`][quality.name]
      );

      let valueInputs = $(ev.currentTarget)
        .parents(".item-quality")
        .find(".quality-value");

      for (let i = 0; i < valueInputs.length; i++)
        quality.values[i] = {
          name: quality.values[i],
          value: valueInputs[i].value,
        };

      let qualities = foundry.utils.deepClone(this.item.data.data.qualities);
      if (qualities.find((q) => q.name == quality.name))
        qualities.splice(
          qualities.findIndex((q) => q.name == quality.name),
          1
        );
      else qualities.push(quality);

      this.item.update({ "data.qualities": qualities });
      return;
    }

    if (target)
      foundry.utils.setProperty(
        itemData,
        target,
        !foundry.utils.getProperty(itemData, target)
      );
    this.item.update(itemData);
  }

  _onQualityValueChange(ev) {
    let target = $(ev.currentTarget)
      .parents(".quality-inputs")
      .attr("data-quality");
    let valueKey = $(ev.currentTarget).attr("data-value-key");
    let qualities = foundry.utils.deepClone(this.item.data.data.qualities);
    let existingQuality = qualities.find((q) => q.name == target);
    if (!existingQuality) return;
    existingQuality.values.find((v) => v.name == valueKey).value =
      ev.target.value;
    this.item.update({ "data.qualities": qualities });
  }

  _onModDelete(ev) {
    let index = Number(
      $(ev.currentTarget).parents(".item").attr("data-item-id")
    );
    let mods = foundry.utils.deepClone(this.item.flags.degenesis.mods);
    mods.splice(index, 1);
    this.item.setFlag("degenesis", "mods", mods);
  }

  _onModEdit(ev) {
    let index = Number(
      $(ev.currentTarget).parents(".item").attr("data-item-id")
    );
    let mod = this.item.flags.degenesis.mods[index];
    ui.notifications.warn(game.i18n.localize("DGNS.ModEditWarning"));
    new game.degenesis.entities.DegenesisItem(mod).sheet.render(true);
  }

  _onModControlClick(ev) {
    let index = $(ev.currentTarget)
      .parents(".effect-change")
      .attr("data-index");
    let action = $(ev.currentTarget).attr("data-action");
    let changes = foundry.utils.deepClone(this.item.system.changes);
    if (action == "delete") {
      changes.splice(index, 1);
    } else if (action == "add") {
      changes.push({ key: "", mode: "add", value: 0 });
    }
    this.item.update({ "data.changes": changes });
  }

  _onModChanges(ev) {
    let index = $(ev.currentTarget)
      .parents(".effect-change")
      .attr("data-index");
    let type = $(ev.currentTarget).attr("data-type");
    let changes = foundry.utils.deepClone(this.item.system.changes);
    let newValue = ev.target.value;
    if (Number.isNumeric(newValue)) newValue = Number(newValue);

    changes[index][type] = newValue;
    this.item.update({ "data.changes": changes });
  }
}
