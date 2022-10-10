/**
 * A Form used to override sheet auto calculations
 * @extends {FormApplication}
 */
export default class NPCConfigure extends FormApplication {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          id: "npc-configure",
        classes: ["degenesis", "npc-configure"],
        title: game.i18n.localize("DGNS.ConfigureActor"),
        template: "systems/degenesis/templates/apps/npc-configure.html",
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