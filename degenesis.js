/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { DegenesisItemSheet } from "./module/item/item-sheet.js";
import { DegenesisItem } from "./module/item/item-degenesis.js";
import { DegenesisActorSheet } from "./module/actor/actor-sheet.js";
import { DegenesisActor } from "./module/actor/actor-degenesis.js";
import { DEGENESIS } from "./module/config.js";
import { DegenesisImporter } from "./module/importer.js"
import { ClusterInterface } from "./module/apps/cluster.js"
import { DegenesisCombat } from "./module/combat-degenesis.js";
import { DegenesisDice } from "./module/dice.js";
import { DEG_Utility } from "./module/utility.js";
import { DegenesisChat } from "./module/chat.js";
import hooks from "./module/hooks/hooks.js"

// import tippy from './node_modules/tippy.js';
// import './node_modules/tippy.js/dist/tippy.css'; // optional for styling

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function () {
  console.log(`%cDEGENESIS` + `%c | Initializing`, "color: #ed1d27", "color: unset");

  document.onkeydown = function (e) {
    if (e.keyCode == 123)
      console.log(`%cDEGENESIS` + `%c | Welcome, Chronicler`, "color: #ed1d27", "color: unset");
  }

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
  Actors.registerSheet("dnd5e", DegenesisActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("dnd5e", DegenesisItemSheet, { makeDefault: true });

  // Pre-load templates
  loadTemplates([
    "systems/degenesis/templates/actor/actor-attributes-skills.html",
    "systems/degenesis/templates/actor/actor-attributes-skills-diamonds.html",
    "systems/degenesis/templates/actor/actor-inventory.html",
    "systems/degenesis/templates/actor/actor-advantages.html",
    "systems/degenesis/templates/actor/actor-condition.html",
    "systems/degenesis/templates/actor/actor-combat.html",
    "systems/degenesis/templates/actor/actor-history.html",
    "systems/degenesis/templates/item/item-header.html",
    "systems/degenesis/templates/item/item-header-physical.html",
    "systems/degenesis/templates/item/item-header-physical-no-qty.html",
    "systems/degenesis/templates/chat/roll-card.html"
  ]);

  // Assign the actor class to the CONFIG
  CONFIG.Actor.entityClass = DegenesisActor;
  CONFIG.Item.entityClass = DegenesisItem;
  CONFIG.Combat.entityClass = DegenesisCombat;


  game.degenesis = {
    apps : {
      DegenesisActorSheet,
      DegenesisItemSheet,
      ClusterInterface,
      DegenesisImporter
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

  game.importData = function() {
      let weapons = []
      fetch("systems/degenesis/tb_weapons_melee.json").then(r => r.json().then(json => {
      for (let item of json.items)
      {
        let itemData = duplicate(game.system.model.Item.weapon)
        itemData.cult = item.cult.join(", ")
        itemData.damage = item.damage
        itemData.description = item.description
        itemData.encumbrance = item.encumbrance || 0
        itemData.distance.melee = item.distance || 0
        itemData.handling = item.handling || 0

        itemData.qualities = item.qualities.map(q => {
          let qualityObj = {
            name : q.name = DEG_Utility.findKey(q.name, DEGENESIS.weaponQualities),
          }
          qualityObj.values = DEGENESIS.weaponQualitiesValues[qualityObj.name].map(name => {return {name}})
          if (q.property)
            qualityObj.values[0].value = q.property
          return qualityObj
        })
        itemData.resources = item.resources || 0
        itemData.slots = {total: item.slots || 0, used : 0}
        itemData.value = item.value || 0
        let newItem = {name : item.name, data : itemData, type : "weapon"}
        if (item.specialty)
          setProperty(newItem, "flags.degenesis.specialty", item.specialty)

        weapons.push(newItem);
      }
    }))
    return weapons
  }

  
  CONFIG.fontFamilies.push("Calluna")
  FONTS["Calluna"] = {
    custom: {
      families: ['Calluna'],
      urls: ['systems/degenesis/fonts/Calluna-Regular.otf']
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

  loadFont("Calluna")

});


  Hooks.on("setup", () => {
    for (let group in DEGENESIS) {
      for (let key in DEGENESIS[group])
        if (typeof DEGENESIS[group][key] == "string")
          DEGENESIS[group][key] = game.i18n.localize(DEGENESIS[group][key])
    }
  })

  Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSystem({ id: "degenesis", name: "DEGENESIS: Rebirth" }, "exclusive");
    dice3d.addDicePreset({
      type: "d6",
      labels: [
        'systems/degenesis/icons/dice-faces/d1.png',
        'systems/degenesis/icons/dice-faces/d2.png',
        'systems/degenesis/icons/dice-faces/d3.png',
        'systems/degenesis/icons/dice-faces/d4.png',
        'systems/degenesis/icons/dice-faces/d5.png',
        'systems/degenesis/icons/dice-faces/d6.png'
      ],
      bumpMaps: [
        'systems/degenesis/icons/dice-faces/d1_bump.png',
        'systems/degenesis/icons/dice-faces/d2_bump.png',
        'systems/degenesis/icons/dice-faces/d3_bump.png',
        'systems/degenesis/icons/dice-faces/d4_bump.png',
        'systems/degenesis/icons/dice-faces/d5_bump.png',
        'systems/degenesis/icons/dice-faces/d6_bump.png'
      ],
      system: "degenesis"
    });

    dice3d.addSystem(
      { id: "degenesis3d-black", name: "DEGENESIS: Rebirth Black 3D" },
      "exclusive"
    );
    dice3d.addSystem(
      { id: "degenesis3d-white", name: "DEGENESIS: Rebirth White 3D" },
      "exclusive"
    );
    dice3d.addSystem(
      { id: "degenesis3d-pureBlood", name: "DEGENESIS: Rebirth Pure Blood 3D" },
      "exclusive"
    );
    dice3d.addSystem(
      {
        id: "degenesis3d-taintedBlood",
        name: "DEGENESIS: Rebirth Tainted Blood 3D",
      },
      "exclusive"
    );
  
    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_black.gltf",
      system: "degenesis3d-black",
    });
  
    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_white.gltf",
      system: "degenesis3d-white",
    });
  
    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_pureBlood.gltf",
      system: "degenesis3d-pureBlood",
    });
  
    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_taintedBlood.gltf",
      system: "degenesis3d-taintedBlood",
    });
    

  });

  // Register all other hooks
  hooks();


