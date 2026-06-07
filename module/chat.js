import { DEGENESIS } from "./config.js";
import { DEG_Utility } from "./utility.js";

export class DegenesisChat {

  static async renderRollCard(rollResult, cardData, extraFlags = {}) {

    rollResult.rolls?.forEach((r) => {
      r.img = `systems/degenesis/icons/dice-faces/d${r.result}.svg`;
    });

    rollResult.secondaryRolls?.forEach((r) => {
      r.img = `systems/degenesis/icons/dice-faces/d${r.result}.svg`;
    });

    rollResult.enResult = rollResult.result;
    rollResult.result = DEGENESIS.rollResults[rollResult.result];

    const mergedData = foundry.utils.mergeObject(
      foundry.utils.deepClone(cardData),
      rollResult
    );

    const html = await renderTemplate(mergedData.template, mergedData);

    const chatData = DEG_Utility.chatDataSetup(html, mergedData.speaker);

    if (Object.keys(extraFlags).length) {
      chatData.flags = foundry.utils.mergeObject(chatData.flags ?? {}, extraFlags);
    }

    await ChatMessage.create(chatData);
  }
}
