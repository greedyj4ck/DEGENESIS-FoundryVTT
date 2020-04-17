/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { DegenesisItemSheet } from "./item/item-sheet.js";
import { DegenesisItem } from "./item/item-degenesis.js";
import { DegenesisActorSheet } from "./actor/actor-sheet.js";
import { DegenesisActor } from "./actor/actor-degenesis.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`DEGENESIS | Initializing`);

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

    // Assign the actor class to the CONFIG
  CONFIG.Actor.entityClass = DegenesisActor;
  CONFIG.Item.entityClass = DegenesisItem;
});
