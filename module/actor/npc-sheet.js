// NPC Actor Sheet
// V. 0.1 
// Early prototyping phase


// Required modules 

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
            template: "systems/degenesis/templates/actor/npc/npc-sheet.html",
            width: 685,
            height: 723,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".tab-content", initial: "main" }],
            scrollY: [".relationship", ".tab-content"]
        });
    }


    /* ######## DATA PREPARATION STAGE  ######## */ 

    // Preparing data for Sheet to be displayed

    async getData() {
        const data = await super.getData();

        data.data = data.actor.system

        // Used for Modifier item list
        //data.modifyActions = DEG_Utility.getModificationActions()

        await this.prepareSheetData(data);
        return data;
    }

    async prepareSheetData(sheetData) {


        sheetData.enrichment = await this._handleEnrichment()

    }


    // Add HTML Enrichment stuff for editors fields (like item's links etc.)

    async _handleEnrichment() {
       /*  let enrichment = {}
        enrichment["system.biography.value"] = await TextEditor.enrichHTML(this.actor.system.biography, { async: true, secrets: this.actor.isOwner, relativeTo: this.actor })
        enrichment["system.gmnotes.value"] = await TextEditor.enrichHTML(this.actor.system.gmnotes, { async: true, secrets: this.actor.isOwner, relativeTo: this.actor })

        return expandObject(enrichment) */
    }



    /* ######## FUNCTIONALITY ########*/

    // END OF CLASS


















 }