/**
 * A Form used to override sheet auto calculations
 * @extends {FormApplication}
 */
export default class CustomSkills extends FormApplication {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          id: "custom-skills",
        classes: ["degenesis", "custom-skills"],
        title: game.i18n.localize("DGNS.ConfigureActor"),
        template: "systems/degenesis/templates/apps/custom-skills.html",
        closeOnSubmit: true,
      });
    }

    constructor(object, options) {
      super(object, options)

    }

    async _updateObject(event, formData) {
        this.object.update(formData)
    }
  }