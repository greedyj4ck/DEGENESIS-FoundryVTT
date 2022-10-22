// Overridden ChatMessage class from Foundry
// Not much going on here, for now, but could be useful for later hacks ;) 

import { DEGENESIS } from "./config.js"
import { DEG_Utility } from "./utility.js";

/**
 * Extend FVTT ChatMessage class for Degenesis functionality
 * @extends { ChatMessage }
 * 
 */
export class DegenesisChatMessage extends ChatMessage {


  /** @override */
  async getHTML() {

    // Determine some metadata

    console.log("Firing custom chat Message")

    const data = this.toObject(false);
    data.content = await TextEditor.enrichHTML(this.content, { async: true, rollData: this.getRollData() });
    const isWhisper = this.whisper.length;

    // Construct message data
    const messageData = {
      message: data,
      user: game.user,
      author: this.user,
      alias: this.alias,
      cardPortrait: this.cardPortrait,
      cssClass: [
        this.type === CONST.CHAT_MESSAGE_TYPES.IC ? "ic" : null,
        this.type === CONST.CHAT_MESSAGE_TYPES.EMOTE ? "emote" : null,
        isWhisper ? "whisper" : null,
        this.blind ? "blind" : null
      ].filterJoin(" "),
      isWhisper: this.whisper.length,
      canDelete: game.user.isGM,  // Only GM users are allowed to have the trash-bin icon in the chat log itself
      whisperTo: this.whisper.map(u => {
        let user = game.users.get(u);
        return user ? user.name : null;
      }).filterJoin(", ")
    };

    // Render message data specifically for ROLL type messages
    if (this.isRoll) {
      await this._renderRollContent(messageData);
    }

    // Define a border color
    if (this.type === CONST.CHAT_MESSAGE_TYPES.OOC) {
      messageData.borderColor = this.user?.color;
    }

    // Render the chat message
    let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
    html = $(html);

    // Flag expanded state of dice rolls
    if (this._rollExpanded) html.find(".dice-tooltip").addClass("expanded");

    /**
     * A hook event that fires for each ChatMessage which is rendered for addition to the ChatLog.
     * This hook allows for final customization of the message HTML before it is added to the log.
     * @function renderChatMessage
     * @memberof hookEvents
     * @param {ChatMessage} message   The ChatMessage document being rendered
     * @param {jQuery} html           The pending HTML as a jQuery object
     * @param {object} data           The input data provided for template rendering
     */
    Hooks.call("renderChatMessage", this, html, messageData);

    // CHAT ANIMATIONS :) 

    html[0].classList.add('animate__animated', 'animate__fadeInDown', 'animate__faster');
    html[0].addEventListener('animationend', () => {
      html[0].classList.remove('animate__animated', 'animate__fadeInDown', 'animate__faster');
    });

    return html;
  }


  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
  }

}