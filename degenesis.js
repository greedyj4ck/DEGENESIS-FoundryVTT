/*
██████╗ ███████╗ ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗
██╔══██╗██╔════╝██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝
██║  ██║█████╗  ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗
██║  ██║██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║
██████╔╝███████╗╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║
╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝
FOUNDRY VTT SYSTEM IMPLEMENTATION
AUTHORS: MOO MAN, DARKHAN, CLEMEVILZZ, KRISTJANLAANE, GREEDYJ4CK, PABRUVA
*/

// THIS FILE IS ENTRY POINT FOR ENTIRE SYSTEM
// IMPORT MODULES
import { DEGENESIS } from "./module/config.js";
import { DEG_Utility } from "./module/utility.js";
import { DegenesisItemSheet } from "./module/item/item-sheet.js";
import { DegenesisItem } from "./module/item/item-degenesis.js";
import { DegenesisActorSheet } from "./module/actor/actor-sheet.js";
//import { DegenesisFromHellSheet } from "./module/actor/fromHell-sheet.js";
//import { DegenesisNPCSheet } from "./module/actor/npc-sheet.js";
import { DegenesisActor } from "./module/actor/actor-degenesis.js";
import { DegenesisCombat } from "./module/combat-degenesis.js";
import { DegenesisDice } from "./module/dice.js";
import { DegenesisChat } from "./module/chat.js";
import { DegenesisSystemSettings } from "./module/settings.js";
import { DegenesisChatMessage } from "./module/chat-message.js"; // FOR FUTURE CHATMESSAGE FUNCTIONALITY
import ActorConfigure from "./module/apps/actor-configure.js";
import hooks from "./module/hooks/hooks.js";

/* -------------------------------------------- */
/*  FOUNDRY VTT INITIALIZATION                  */
/* -------------------------------------------- */

// HOOK IS FIRING ON LOADING SYSTEM
Hooks.once("init", async function () {
  console.log(
    `%cDEGENESIS` + `%c | Initializing`,
    "color: #ed1d27",
    "color: unset"
  );

  document.onkeydown = function (e) {
    if (e.keyCode == 123)
      console.log(
        `%cDEGENESIS` + `%c | Welcome, Chronicler`,
        "color: #ed1d27",
        "color: unset"
      );
  };

  // REGISTERING SYSTEM SETTINGS
  DegenesisSystemSettings();

  /**
   * SET AN INITIATIVE FORMULA FOR THE SYSTEM
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 0,
  };

  // SET CUSTOM BANNERS FOR COMPENDIUMS

  CONFIG.Actor.compendiumBanner =
    "/systems/degenesis/ui/packs/actors-comp.webp";
  CONFIG.Adventure.compendiumBanner =
    "/systems/degenesis/ui/packs/adventures-comp.webp";
  CONFIG.Cards.compendiumBanner = "/systems/degenesis/ui/packs/cards-comp.webp";
  CONFIG.Item.compendiumBanner = "/systems/degenesis/ui/packs/items-comp.webp";
  CONFIG.JournalEntry.compendiumBanner =
    "/systems/degenesis/ui/packs/journals-comp.webp";
  CONFIG.Macro.compendiumBanner =
    "/systems/degenesis/ui/packs/macros-comp.webp";
  CONFIG.Playlist.compendiumBanner =
    "/systems/degenesis/ui/packs/playlists-comp.webp";
  CONFIG.RollTable.compendiumBanner =
    "/systems/degenesis/ui/packs/rolltables-comp.webp";

  CONFIG.Scene.compendiumBanner =
    "/systems/degenesis/ui/packs/scenes-comp.webp";

  // REGISTER SHEET APPLICATION CLASSES
  // MOVED TO ARROW FUNCTION FOR BETTER HANDLING

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("degenesis", DegenesisActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "TYPES.Actor.TypeCharacterSheet",
  });

  // W.I.P - not for main release :) Gonna move this later into special dev branch ^_^

  /*   Actors.registerSheet("degenesis", DegenesisFromHellSheet, {
    types: ["fromhell"],
    makeDefault: true,
    label: "ACTOR.TypeFromHellSheet",
  });
  Actors.registerSheet("degenesis", DegenesisNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "ACTOR.TypeNpcSheet",
  }); */
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("degenesis", DegenesisItemSheet, { makeDefault: true });

  // PRE-LOAD TEMPLATES
  loadTemplates([
    "systems/degenesis/templates/common/sheet-footer.html",
    "systems/degenesis/templates/common/sheet-vertical-bar.html",
    "systems/degenesis/templates/common/item-sheet-tabs.html",
    "systems/degenesis/templates/common/item-sheet-description.html",
    "systems/degenesis/templates/common/item-sheet-qualities.html",
    "systems/degenesis/templates/common/item-sheet-mods.html",
    "systems/degenesis/templates/actor/actor-attributes-skills-diamonds.html",
    "systems/degenesis/templates/actor/actor-inventory.html",
    "systems/degenesis/templates/actor/actor-advantages.html",
    "systems/degenesis/templates/actor/actor-condition.html",
    "systems/degenesis/templates/actor/actor-combat.html",
    "systems/degenesis/templates/actor/actor-history.html",
    "systems/degenesis/templates/item/item-header.html",
    "systems/degenesis/templates/item/item-header-physical.html",
    "systems/degenesis/templates/item/item-header-physical-no-qty.html",
    "systems/degenesis/templates/chat/roll-card.html",
  ]);

  // ASSIGN THE ACTOR CLASS TO THE CONFIG
  CONFIG.Actor.documentClass = DegenesisActor;
  CONFIG.Item.documentClass = DegenesisItem;
  CONFIG.Combat.documentClass = DegenesisCombat;

  // ASSIGN CHATMESSAGE CLASS TO THE CONFIG - FOR NOW DEGENESISCHATMESSAGE CLASS WILL BE USED
  // INSTEAD OF DEFAULT FOUNDRY ONE
  CONFIG.ChatMessage.documentClass = DegenesisChatMessage;

  // REGISTERING APPS

  game.degenesis = {
    apps: {
      DegenesisActorSheet,
      // DegenesisFromHellSheet,
      // DegenesisNPCSheet,
      DegenesisItemSheet,
      DegenesisChatMessage,
      ActorConfigure,
    },
    entities: {
      DegenesisActor,
      DegenesisItem,
    },
    utility: DEG_Utility,
    config: DEGENESIS,
    dice: DegenesisDice,
    chat: DegenesisChat,
  };

  // SETTING FONTS FOR USAGE (COULD BE REPLACED WITH CSS?)
  CONFIG.fontDefinitions = {
    Calluna: {
      editor: true,
      fonts: [{ urls: ["systems/degenesis/fonts/Calluna-Regular.otf"] }],
    },
  };

  CONFIG.canvasTextStyle = new PIXI.TextStyle({
    fontFamily: "Calluna",
    fontSize: 36,
    fill: "#FFFFFF",
    stroke: "#111111",
    strokeThickness: 1,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: 0,
    dropShadowDistance: 0,
    align: "center",
    wordWrap: false,
  });
});

// HOOK IS FIRED ON SETUP STAGE
Hooks.on("setup", () => {
  for (let group in DEGENESIS) {
    for (let key in DEGENESIS[group])
      if (typeof DEGENESIS[group][key] == "string")
        DEGENESIS[group][key] = game.i18n.localize(DEGENESIS[group][key]);
  }
});

// REGISTER ALL OTHER HOOKS
hooks();
