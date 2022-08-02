import { DEGENESIS } from "../config.js";
import { DEG_Utility } from "../utility.js";
import { DegenesisChat } from "../chat.js"
import { DegenesisItem } from "../item/item-degenesis.js"
import { DegenesisCombat } from "../combat-degenesis.js";
import ActorConfigure from "../apps/actor-configure.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

 export class DegenesisNPCSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["degenesis", "sheet", "npc"],
            template: "systems/degenesis/templates/actor/npc-sheet.html",
            width: 685,
            height: 723,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-content", initial: "main" }],
            scrollY: [".relationship", ".tab-content"]
        });
    }

 }