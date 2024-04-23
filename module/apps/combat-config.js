export class DegenesisCombatTrackerConfig extends CombatTrackerConfig {
  constructor(...args) {
    super(...args);
  }
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "combat-config",
      title: game.i18n.localize("COMBAT.Settings"),
      classes: ["sheet", "combat-sheet"],
      template: "systems/degenesis/templates/apps/combat-tracker-config.html",
      width: 420,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options = {}) {
    const attributes = TokenDocument.implementation.getTrackedAttributes();
    attributes.bar.forEach((a) => a.push("value"));
    const combatThemeSetting = game.settings.settings.get("core.combatTheme");
    return {
      settings: game.settings.get("core", Combat.CONFIG_SETTING),
      attributeChoices:
        TokenDocument.implementation.getTrackedAttributeChoices(attributes),
      combatTheme: combatThemeSetting,
      selectedTheme: game.settings.get("core", "combatTheme"),
      user: game.user,
    };
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    game.settings.set("core", "combatTheme", formData.combatTheme);
    if (!game.user.isGM) return;
    return game.settings.set("core", Combat.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".audio-preview").click(this.#onAudioPreview.bind(this));
  }

  /* -------------------------------------------- */

  #audioPreviewState = 0;

  /**
   * Handle previewing a sound file for a Combat Tracker setting
   * @param {Event} event   The initial button click event
   * @private
   */
  #onAudioPreview(event) {
    const themeName = this.form.combatTheme.value;
    const theme = CONFIG.Combat.sounds[themeName];
    if (!theme || theme === "none") return;
    const announcements = CONST.COMBAT_ANNOUNCEMENTS;
    const announcement =
      announcements[this.#audioPreviewState++ % announcements.length];
    const sounds = theme[announcement];
    if (!sounds) return;
    const src = sounds[Math.floor(Math.random() * sounds.length)];
    game.audio.play(src, { context: game.audio.interface });
  }

  /* -------------------------------------------- */

  /** @override */
  async _onChangeInput(event) {
    if (event.currentTarget.name === "combatTheme") this.#audioPreviewState = 0;
    return super._onChangeInput(event);
  }
}
