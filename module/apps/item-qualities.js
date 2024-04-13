import { DEGENESIS } from "../config.js";

/**
 * A specialized form used to select item qualities and their values
 * @extends {FormApplication}
 */
export class ItemQualities extends DocumentSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "item-quality-selector",
      classes: ["degenesis", "quality-selector"],
      title: "Item Qualities Selection",
      template: "systems/degenesis/templates/apps/item-qualities.html",
      width: 390,
      resizable: true,
      closeOnSubmit: true,
    });
  }

  constructor(object, options) {
    super(object, options);
    this.tempData = this.object.toObject();
    this.qualityType = this.object.type;
  }

  get title() {
    return `${this.object.name} Qualities`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    let qualities = {};

    let qualityList;
    let qualityDescriptions;
    let qualityValues;

    if (this.qualityType == "mod") this.qualityType = this.object.modType;

    qualityList = DEGENESIS[`${this.qualityType}Qualities`];
    qualityDescriptions = DEGENESIS[`${this.qualityType}QualityDescription`];
    qualityValues = DEGENESIS[`${this.qualityType}QualitiesValues`];

    // For each weapon quality in configuration (we want to display all of them to show checkboxes)
    for (let q in qualityList) {
      qualities[q] = {
        checked: !!this.tempData.system.qualities.find(
          (quality) => quality.name == q
        ), // Should be checked if weapon has it
        name: qualityList[q], // Display name
        description: qualityDescriptions[q], // Description (to be used for tooltip/dropdown)
        values: foundry.utils.deepClone(qualityValues[q]), // Array of possible values for each quality (eg. Dazed (3) )
      };
      // Map each quality to a function to determine how the values are filled.
      // If the user specified 3 for Dazed, we need to retrieve that and fill the input with that value
      qualities[q].values = qualities[q].values.map((val) => {
        // If the weapon has the quality
        let existingQuality = this.tempData.system.qualities.find(
          (quality) => q == quality.name
        );
        if (existingQuality)
          // Set the value to an object with the specified value, placeholder, and config key object
          return {
            value: existingQuality.values.find((v) => v.name == val).value,
            placeholder: DEGENESIS.qualityValues[val],
            key: val,
          };
        // Set the value to an object with with no value, but with the placeholder and the config key
        else
          return {
            value: "",
            placeholder: DEGENESIS.qualityValues[val],
            key: val,
          };
      });
    }
    return { qualities: qualities };
  }

  /* -------------------------------------------- */

  // Update the object

  activateListeners(html) {
    super.activateListeners(html);

    html.submit((e) => {
      e.preventDefault();
      this.object.update({ "data.qualities": this.tempData.system.qualities });
      this.close();
    });

    html.find(".checkbox").click((ev) => {
      let quality = {};
      quality.name = $(ev.currentTarget).attr("data-quality");
      quality.values = foundry.utils.deepClone(
        DEGENESIS[`${this.qualityType}QualitiesValues`][quality.name]
      );

      let valueInputs = $(ev.currentTarget)
        .parents(".item-quality")
        .find(".quality-value");

      for (let i = 0; i < valueInputs.length; i++)
        quality.values[i] = {
          name: quality.values[i],
          value: valueInputs[i].value,
        };

      let qualities = this.tempData.system.qualities;
      if (qualities.find((q) => q.name == quality.name))
        qualities.splice(
          qualities.findIndex((q) => q.name == quality.name),
          1
        );
      else qualities.push(quality);

      this.render(true);
    });

    html.find(".quality-value").change((ev) => {
      let target = $(ev.currentTarget)
        .parents(".quality-inputs")
        .attr("data-quality");
      let valueKey = $(ev.currentTarget).attr("data-value-key");
      let qualities = this.tempData.system.qualities;
      let existingQuality = qualities.find((q) => q.name == target);
      if (!existingQuality) return;
      existingQuality.values.find((v) => v.name == valueKey).value =
        ev.target.value;
    });
  }
}
