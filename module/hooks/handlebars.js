import { DEGENESIS } from "../config.js";
import { MODULE } from "../config.js";
import { ShowInventoryHeaders } from "../settings.js";

export default function () {
  Hooks.on("init", () => {
    Handlebars.registerHelper("ifIsGM", function (options) {
      return game.user.isGM ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper("isGM", function (options) {
      return game.user.isGM;
    });

    Handlebars.registerHelper("config", function (key) {
      return DEGENESIS[key];
    });

    Handlebars.registerHelper("configLookup", function (obj, key) {
      return DEGENESIS[obj][key];
    });

    Handlebars.registerHelper("capitalize", function (aString) {
      return aString.charAt(0).toUpperCase() + aString.slice(1);
    });

    Handlebars.registerHelper("showHeaders", function (options) {
      return ShowInventoryHeaders();
    });

    Handlebars.registerHelper("moreThanSixDice", function (rolls) {
      if (rolls.length > 6) {
        return true;
      } else {
        return false;
      }
    });

    Handlebars.registerHelper("isSuccess", function (result) {
      if (result === "success") {
        return true;
      } else {
        return false;
      }
    });

    Handlebars.registerHelper("currentEgo", function (ego) {
      return ego.max - ego.value;
    });

    Handlebars.registerHelper("baseSkillDie", function (skill, attribute) {
      return skill.value - attribute.value;
    });

    Handlebars.registerHelper("isSimpleSection", function (section) {
      if (section.type === "attack" || section.type === "defense") {
        return true;
      } else {
        return false;
      }
    });

    Handlebars.registerHelper("isFieldLocked", function (sheet) {
      try {
        if (sheet.document.getFlag(MODULE, "sheetLocked")) {
          return "disabled";
        } else {
          return;
        }
      } catch (err) {
        return;
      }
    });

    Handlebars.registerHelper("isSheetLocked", function (sheet) {
      try {
        if (sheet.document.getFlag(MODULE, "sheetLocked")) {
          return true;
        } else {
          return false;
        }
      } catch (err) {
        return true;
      }
    });

    Handlebars.registerHelper(
      "calculateDamage",
      function (weapon, body, force, modifier = null) {
        if (
          weapon.DamageBonus &&
          weapon.DamageBonus.blueprint.indexOf("F") !== -1
        ) {
          let dmg =
            parseInt(weapon.damage) +
            weapon.DamageBonus.calculate(body + force);
          return dmg;
        } else {
          return weapon.DamageFormula;
        }
      }
    );
  });
}
