/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import {DegenesisItemSheet} from "./module/item/item-sheet.js";
import {DegenesisItem} from "./module/item/item-degenesis.js";
import {DegenesisActorSheet} from "./module/actor/actor-sheet.js";
import {DegenesisActor} from "./module/actor/actor-degenesis.js";
import {DEGENESIS} from "./module/config.js";
import {DegenesisImporter} from "./module/importer.js"
import {ClusterInterface} from "./module/apps/cluster.js"
import {DegenesisDice} from "./module/dice.js";
import { DegenesisChat } from "./module/chat.js";

// import tippy from './node_modules/tippy.js';
// import './node_modules/tippy.js/dist/tippy.css'; // optional for styling

const _getInitiativeFormula = combatant => {
  const actor = combatant.actor;
  if (!actor) return "0";
  const {rollResults, cardData} = actor.rollFightRollSync("initiative");
  if (rollResults.triggers > 1) {
    actor.data.data.fighting.actionsCurrent = 1 + Math.floor(rollResults.triggers / 2);
  } else {
    actor.data.data.fighting.actionsCurrent = 1;
  }

  let spentEgo = actor.data.data.state.spentEgo.value;
  let newEgo = actor.data.data.condition.ego.value + spentEgo;
  if (newEgo > actor.data.data.condition.ego.max)
    newEgo = actor.data.data.condition.ego.max;
  
  actor.update({
    "data.condition.ego.value" : newEgo, 
    "data.state.spentEgo.actionBonus" : spentEgo,
    "data.state.spentEgo.value" : 0
  })

  DegenesisChat.renderRollCard(rollResults, cardData)
  return rollResults.successes.toFixed(0);
};

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
	  formula: "0",
    decimals: 2
  };
  Combat.prototype._getInitiativeFormula = _getInitiativeFormula;
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
    "systems/degenesis/templates/actor/actor-history.html",
    "systems/degenesis/templates/item/item-header.html",
    "systems/degenesis/templates/item/item-header-physical.html",
    "systems/degenesis/templates/chat/roll-card.html"
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
      return false

  }
})

// Activate chat listeners defined in dice-wfrp4e.js
Hooks.on('renderChatLog', (log, html, data) => {

  html.find(".chat-control-icon").click(ev => {
     let cl = new ClusterInterface();
     cl.render(true);
  })

  html.find(".chat-control-icon").mouseover(ev => {
    $(ev.currentTarget).attr("title", "Access The Cluster")
 })

});
