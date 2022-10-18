// DEGENESIS SYSTEM SETTINGS MODULE
// USED FOR REGISTERING GAME SYSTEM SETTINGS

const system = "degenesis"

export const DegenesisSystemSettings = () => {

  // AUTOMATIC ENCUMBRANCE CALCULATION SWITCH FOR STANDARD ROLLS

  game.settings.register(system, "AutomateEncumbrancePenalty", {
    name: "DGNS.SettingsEncumbrancePenalty",
    hint: "DGNS.SettingsEncumbrancePenaltyHelper",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  // ALLOW ROLLS WITH MINIMUM ONE ACTION NUMBER

  game.settings.register(system, "MinimumOneAN",
    {
      name: "DGNS.SettingsMinimumOneAN",
      hint: "DGNS.SettingsMinimumOneANHelper",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });

  game.settings.register(system, "ShowInventoryHeaders",
    {
      name: "DGNS.SettingsShowInventoryHeaders",
      hint: "DGNS.SettingsShowInventoryHeadersHelper",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
    });

  console.log(`%cDEGENESIS` + `%c | Settings registered`, "color: #ed1d27", "color: unset");
}

export const AutomateEncumbrancePenalty = () => {
  return game.settings.get(system, "AutomateEncumbrancePenalty");
};

export const MinimumOneAN = () => {
  return game.settings.get(system, "MinimumOneAN");
};

export const ShowInventoryHeaders = () => {
  return game.settings.get(system, "ShowInventoryHeaders");
}; 