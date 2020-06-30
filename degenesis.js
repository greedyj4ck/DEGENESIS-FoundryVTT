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

// import tippy from './node_modules/tippy.js';
// import './node_modules/tippy.js/dist/tippy.css'; // optional for styling

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
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
	  formula: "1d20",
    decimals: 2
  };

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("dnd5e", DegenesisActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("dnd5e", DegenesisItemSheet, {makeDefault: true});

  // Pre-load templates
  loadTemplates([
    "systems/degenesis/templates/actor/actor-main.html",
    "systems/degenesis/templates/actor/actor-attributes-skills.html",
    "systems/degenesis/templates/actor/actor-attributes-skills-diamonds.html",
    "systems/degenesis/templates/actor/actor-inventory.html",
    "systems/degenesis/templates/actor/actor-advantages.html",
    "systems/degenesis/templates/actor/actor-condition.html",
    "systems/degenesis/templates/actor/actor-combat.html",
    "systems/degenesis/templates/actor/actor-combat.html",
    "systems/degenesis/templates/item/item-header.html",
    "systems/degenesis/templates/item/item-header-physical.html"
  ]);

    // Assign the actor class to the CONFIG
  CONFIG.Actor.entityClass = DegenesisActor;
  CONFIG.Item.entityClass = DegenesisItem;
});

Hooks.on("setup", () => {
  for(let group in DEGENESIS)
  {
      for(let key in DEGENESIS[group])
        if (typeof DEGENESIS[group][key] == "string")
          DEGENESIS[group][key] = game.i18n.localize(DEGENESIS[group][key])
  }
})

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({id:"degenesis",name:"DEGENESIS: Rebirth"},true);
  dice3d.addDicePreset({
    type:"d6",
    labels:[
      'systems/degenesis/icons/dice-faces/d1c.png', 
      'systems/degenesis/icons/dice-faces/d2c.png', 
      'systems/degenesis/icons/dice-faces/d3c.png', 
      'systems/degenesis/icons/dice-faces/d4c.png', 
      'systems/degenesis/icons/dice-faces/d5c.png', 
      'systems/degenesis/icons/dice-faces/d6c.png'
    ],
    bumpMaps:[
      'systems/degenesis/icons/dice-faces/d1c_bump.png', 
      'systems/degenesis/icons/dice-faces/d2c_bump.png', 
      'systems/degenesis/icons/dice-faces/d3c_bump.png', 
      'systems/degenesis/icons/dice-faces/d4c_bump.png', 
      'systems/degenesis/icons/dice-faces/d5c_bump.png', 
      'systems/degenesis/icons/dice-faces/d6c_bump.png'
    ],
    system:"degenesis"
  });
});



Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
    options.push( 
    {
      name : "Import KatharSys Character",
      condition: true,
      icon: '<i class="fas fa-plus"></i>',
      callback: target => {
        DegenesisImporter.KatharSysCharacterImportDialog(target.attr('data-entity-id'))
      }
      
    })
  })

Hooks.on("chatMessage", (html, content, msg) => {
  let command = content.split(" ");
  if (command[0].includes("/name"))
  {
        let response = fetch("http://localhost:3000/name", {
            method: "POST"
        }).then(r => r.text())
        .then(text => {
            let name = `${text} 
            <span class="cluster-credits">Powered by <a href="https://degenesis-cluster.com">Degenesis Cluster</a></span>` 
            // send request
            ChatMessage.create({content : name})
      }).catch(error => {
        console.error(error)
        ui.notifications.error(error)
      })
  }
  return false
})

// Activate chat listeners defined in dice-wfrp4e.js
Hooks.on('renderChatLog', (log, html, data) => {
  console.log(log, html, data)

  html.find(".roll-type-select").click(ev => {
     let cl = new ClusterInterface();
     cl.render(true);
  })

  html.find(".roll-type-select").mouseover(ev => {
    $(ev.currentTarget).attr("title", "Access The Cluster")
 })

});
