/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { DegenesisItemSheet } from "./module/item/item-sheet.js";
import { DegenesisItem } from "./module/item/item-degenesis.js";
import { DegenesisActorSheet } from "./module/actor/actor-sheet.js";
import { DegenesisNPCSheet } from "./module/actor/npc-sheet.js";
import { DegenesisActor } from "./module/actor/actor-degenesis.js";
import { DEGENESIS } from "./module/config.js";
import { DegenesisImporter } from "./module/importer.js"
import { ClusterInterface } from "./module/apps/cluster.js"
import { DegenesisCombat } from "./module/combat-degenesis.js";
import { DegenesisDice } from "./module/dice.js";
import { DEG_Utility } from "./module/utility.js";
import { DegenesisChat } from "./module/chat.js";
import { DegenesisSystemSettings } from "./module/settings.js"
import ActorConfigure from "./module/apps/actor-configure.js"
import NPCConfigure from "./module/apps/npc-configure.js"
import hooks from "./module/hooks/hooks.js"



/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function () {
  console.log(`%cDEGENESIS` + `%c | Initializing`, "color: #ed1d27", "color: unset");

  document.onkeydown = function (e) {
    if (e.keyCode == 123)
      console.log(`%cDEGENESIS` + `%c | Welcome, Chronicler`, "color: #ed1d27", "color: unset");
  }

  // REGISTER SYSTEM SETTINGS
  DegenesisSystemSettings();

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 0
  };

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("degenesis", DegenesisActorSheet, { makeDefault: true });
  Actors.registerSheet("degenesis", DegenesisNPCSheet, { makeDefault: false });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("degenesis", DegenesisItemSheet, { makeDefault: true });

  // Pre-load templates
  loadTemplates([
    "systems/degenesis/templates/actor/actor-attributes-skills-diamonds.html",
    "systems/degenesis/templates/actor/actor-inventory.html",
    "systems/degenesis/templates/actor/actor-advantages.html",
    "systems/degenesis/templates/actor/actor-condition.html",
    "systems/degenesis/templates/actor/actor-combat.html",
    "systems/degenesis/templates/actor/actor-history.html",
    "systems/degenesis/templates/npc/npc-skills.html",
    "systems/degenesis/templates/npc/npc-condition.html",
    "systems/degenesis/templates/npc/npc-combat.html",
    "systems/degenesis/templates/npc/npc-history.html",
    "systems/degenesis/templates/item/item-header.html",
    "systems/degenesis/templates/item/item-header-physical.html",
    "systems/degenesis/templates/item/item-header-physical-no-qty.html",
    "systems/degenesis/templates/chat/roll-card.html"
  ]);

  // Assign the actor class to the CONFIG
  CONFIG.Actor.documentClass = DegenesisActor;
  CONFIG.Item.documentClass = DegenesisItem;
  CONFIG.Combat.documentClass = DegenesisCombat;


  game.degenesis = {
    apps : {
      DegenesisActorSheet,
      DegenesisNPCSheet,
      DegenesisItemSheet,
      ClusterInterface,
      DegenesisImporter,
      ActorConfigure,
      NPCConfigure
    },
    entities : {
      DegenesisActor,
      DegenesisItem
    },
    utility: DEG_Utility,
    config : DEGENESIS,
    dice : DegenesisDice,
    chat : DegenesisChat
  }

  // game.importData = function() {
  //     let weapons = []
  //     fetch("systems/degenesis/tb_weapons_melee.json").then(r => r.json().then(json => {
  //     for (let item of json.items)
  //     {
  //       let itemData = foundry.utils.deepClone(game.system.model.Item.weapon)
  //       itemData.cult = item.cult.join(", ")
  //       itemData.damage = item.damage
  //       itemData.description = item.description
  //       itemData.encumbrance = item.encumbrance || 0
  //       itemData.distance.melee = item.distance || 0
  //       itemData.handling = item.handling || 0

  //       itemData.qualities = item.qualities.map(q => {
  //         let qualityObj = {
  //           name : q.name = DEG_Utility.findKey(q.name, DEGENESIS.weaponQualities),
  //         }
  //         qualityObj.values = DEGENESIS.weaponQualitiesValues[qualityObj.name].map(name => {return {name}})
  //         if (q.property)
  //           qualityObj.values[0].value = q.property
  //         return qualityObj
  //       })
  //       itemData.resources = item.resources || 0
  //       itemData.slots = {total: item.slots || 0, used : 0}
  //       itemData.value = item.value || 0
  //       let newItem = {name : item.name, data : itemData, type : "weapon"}
  //       if (item.specialty)
  //         setProperty(newItem, "flags.degenesis.specialty", item.specialty)

  //       weapons.push(newItem);
  //     }
  //   }))
  //   return weapons
  // }

  
 
 CONFIG.fontDefinitions = 
  {
    "Calluna": {
      editor: true,
      fonts: [
        {urls: ["systems/degenesis/fonts/Calluna-Regular.otf"]},
      ]
    }
  }


  CONFIG.canvasTextStyle = new PIXI.TextStyle({
    fontFamily: "Calluna",
    fontSize: 36,
    fill: "#FFFFFF",
    stroke: '#111111',
    strokeThickness: 1,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: 0,
    dropShadowDistance: 0,
    align: "center",
    wordWrap: false
  })

});


  Hooks.on("setup", () => {
    for (let group in DEGENESIS) {
      for (let key in DEGENESIS[group])
        if (typeof DEGENESIS[group][key] == "string")
          DEGENESIS[group][key] = game.i18n.localize(DEGENESIS[group][key])
    }
  })

  // Register all other hooks
  hooks();


