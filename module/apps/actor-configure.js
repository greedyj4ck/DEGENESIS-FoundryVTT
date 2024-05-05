/**
 * A Form used to override sheet auto calculations
 * @extends {FormApplication}
 */
export default class ActorConfigure extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "actor-configure",
      classes: ["degenesis", "actor-configure"],
      title: game.i18n.localize("DGNS.ConfigureActor"),
      template: "systems/degenesis/templates/apps/actor-configure.html",
      closeOnSubmit: true,
    });
  }

  constructor(object, options) {
    super(object, options);
  }

  /** This needs to be adjusted to modify other values, not only current ones. */
  async _updateObject(event, formData) {
    this.object.update(formData);
  }
}
