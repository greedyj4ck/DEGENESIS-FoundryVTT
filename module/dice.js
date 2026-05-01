import RollDialog from "./apps/roll-dialog.js";
import RollPhenomenonDialog from "./apps/roll-phenomenon-dialog.js";
import { MinimumOneAN } from "./settings.js";

export class DegenesisDice {
  static async rollAction(
    {
      actionNumber,
      difficulty = 0,
      diceModifier = 0,
      successModifier = 0,
      triggerModifier = 0,
      overload = 0,
    } = {},
    { dsn = true } = {}
  ) {
    const [rollResult, roll] = await this.calculateRollResult({
      actionNumber,
      difficulty,
      diceModifier,
      successModifier,
      triggerModifier,
      overload,
    });

    if (game.dice3d && dsn) {
      // Temporary DiceSoNice Fix

      let usersArr = [];
      let gmArr = [];
      let isBlind = false;

      let rollMode = game.settings.get("core", "rollMode");

      for (User of game.users) {
        if (User.isGM == true) {
          gmArr.push(User);
        }
      }

      switch (rollMode) {
        case "publicroll":
          usersArr = null;
          break;
        case "selfroll":
          usersArr.push(game.user);
          break;
        case "blindroll":
          usersArr = gmArr;
          isBlind = true; // This will break a blind roll for GM
          break;
        case "gmroll":
          usersArr = gmArr;
          usersArr.push(game.user);
          break;
      }

      await game.dice3d.showForRoll(roll, game.user, true, usersArr, isBlind);
    }

    return rollResult;
  }

  static async calculateRollResult({
    actionNumber,
    difficulty = 0,
    diceModifier = 0,
    successModifier = 0,
    triggerModifier = 0,
    overload = 0,
  }) {
    let rollResult = {};

    let successes;
    let triggers = triggerModifier;
    let ones = 0;
    let result;
    let rolls = [];

    actionNumber += diceModifier;
    let autoSuccesses = 0;
    if (actionNumber > 12) {
      autoSuccesses = actionNumber - 12;
      actionNumber = 12;
    }

    if ((actionNumber <= 0) & MinimumOneAN()) {
      actionNumber = 1;
    }

    let roll = new Roll(`${actionNumber}d6cs>3`);
    await roll.evaluate();

    rolls = roll.terms[0].results;
    successes = roll.total + autoSuccesses + successModifier;

    rolls.forEach((r) => {
      if (r.result == 6) triggers++;
      if (r.result == 1) ones++;
    });

    if (difficulty > 0) {
      if (successes >= difficulty) {
        result = "success";
      } else {
        result = "failure";
        if (ones > successes) result = "botch";
      }
    }

    rollResult = {
      successes,
      triggers,
      ones,
      result,
      rolls,
      overload,
    };
    return [rollResult, roll];
  }

  /**
   * How many rounds to fire for Salvoes / Rafales weapons.
   * @param {import("./item/item-degenesis.js").DegenesisItem} _weapon
   * @param {number} max Upper bound (salvoes rating and magazine)
   * @returns {Promise<number|null>} Selected count, or null if cancelled
   */
  static async promptSalvoesCount(_weapon, max) {
    const defaultVal = max;
    const content = await renderTemplate(
      "systems/degenesis/templates/apps/salvoes-dialog.html",
      {
        prompt: game.i18n.localize("UI.SalvoesDialogPrompt"),
        hint: game.i18n.format("UI.SalvoesDialogHint", { max }),
        labelAmount: game.i18n.localize("UI.SalvoesDialogRounds"),
        max,
        defaultVal,
      }
    );
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };
      const min = 1;
      new Dialog({
        title: game.i18n.localize("UI.SalvoesDialogTitle"),
        content,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-crosshairs"></i>',
            label: game.i18n.localize("UI.SalvoesDialogConfirm"),
            callback: (html) => {
              const raw = html.find('[name="rounds"]').val();
              const v = parseInt(String(raw).trim(), 10);
              if (!Number.isInteger(v) || v < min || v > max) {
                ui.notifications.warn(
                  game.i18n.format("UI.SalvoesDialogInvalidAmount", {
                    min,
                    max,
                  })
                );
                return false;
              }
              finish(v);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("UI.SalvoesDialogCancel"),
            callback: () => finish(null),
          },
        },
        default: "confirm",
        close: () => finish(null),
      }).render(true);
    });
  }

  // ROLL DIALOG TEMPLATES FOR SKILL AND SIMPLE DICE (ACTION NUMBER BASED) ROLLS :)

  static async showRollDialog({ dialogData, rollData, cardData }) {
    let html = await renderTemplate(
      "systems/degenesis/templates/apps/roll-dialog.html",
      dialogData
    );
    return new Promise((resolve, reject) => {
      new RollDialog(
        {
          content: html,
          title: dialogData.title,
          buttons: {
            roll: {
              label: game.i18n.localize("UI.Roll"),
              callback: async (dlg) => {
                rollData.difficulty = parseInt(
                  dlg.find('[name="difficulty"]').val() || 0
                );
                // CHANGE CALLBACK VALUES FOR TOTALMODIFIERS
                rollData.diceModifier = parseInt(
                  dialogData.totalRollModifiers.diceModifier || 0
                );
                rollData.successModifier = parseInt(
                  dialogData.totalRollModifiers.successModifier || 0
                );
                rollData.triggerModifier = parseInt(
                  dialogData.totalRollModifiers.triggerModifier || 0
                );
                rollData.secondary = dlg.find(".secondary-select").val();
                resolve(rollData);
              },
            },
          },
          default: "roll",
          dialogData,
        },
        { classes: ["roll-dialog"] }
      ).render(true);
    });
  }

  static async showDiceRollDialog({ dialogData, rollData, cardData }) {
    let html = await renderTemplate(
      "systems/degenesis/templates/apps/roll-dice-dialog.html",
      dialogData
    );
    return new Promise((resolve, reject) => {
      new RollDialog(
        {
          content: html,
          title: dialogData.title,
          buttons: {
            roll: {
              label: game.i18n.localize("UI.Roll"),
              callback: async (dlg) => {
                rollData.difficulty = parseInt(
                  dlg.find('[name="difficulty"]').val() || 0
                );
                // CHANGE CALLBACK VALUES FOR TOTALMODIFIERS
                rollData.diceModifier = parseInt(
                  dialogData.totalRollModifiers.diceModifier || 0
                );
                rollData.successModifier = parseInt(
                  dialogData.totalRollModifiers.successModifier || 0
                );
                rollData.triggerModifier = parseInt(
                  dialogData.totalRollModifiers.triggerModifier || 0
                );
                rollData.secondary = dlg.find(".secondary-select").val();
                resolve(rollData);
              },
            },
          },
          default: "roll",
          dialogData,
        },
        { classes: ["roll-dice-dialog"] }
      ).render(true);
    });
  }

  static async showPhenomenonRollDialog({ dialogData, rollData, cardData }) {
    let html = await renderTemplate(
      "systems/degenesis/templates/apps/roll-phenomenon-dialog.html",
      dialogData
    );
    return new Promise((resolve, reject) => {
      new RollPhenomenonDialog(
        {
          content: html,
          title: dialogData.title,
          buttons: {
            roll: {
              label: game.i18n.localize("UI.Roll"),
              callback: async (dlg) => {
                rollData.overload = parseInt(
                  dlg.find('[name="overload"]').val() || 0
                );
                rollData.difficulty = parseInt(
                  dlg.find('[name="difficulty"]').val() || 0
                );
                // CHANGE CALLBACK VALUES FOR TOTALMODIFIERS
                rollData.diceModifier = parseInt(
                  dialogData.totalRollModifiers.diceModifier || 0
                );
                rollData.successModifier = parseInt(
                  dialogData.totalRollModifiers.successModifier || 0
                );
                rollData.triggerModifier = parseInt(
                  dialogData.totalRollModifiers.triggerModifier || 0
                );
                rollData.secondary = dlg.find(".secondary-select").val();
                resolve(rollData);
              },
            },
          },
          default: "roll",
          dialogData,
        },
        { classes: ["roll-phenomenon-dialog"] }
      ).render(true);
    });
  }
}
