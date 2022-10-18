import { DEGENESIS } from "./config.js"

export class DEG_Utility {
    static addDiamonds(data, diamondMax = 0, valueAttribute = "value") {
        data.diamonds = [];
        for (let i = 0; i < diamondMax; i++) {
            data.diamonds.push({
                filled: i + 1 <= getProperty(data, valueAttribute)
            })
        }

        if (getProperty(data, "max")) {
            for (let i = 0; i < diamondMax; i++) {
                data.diamonds[i].locked = i + 1 > getProperty(data, "max")
            }
        }

        if (data.permanent) {
            for (let i = 0; i < data.permanent; i++) {
                data.diamonds[i].permanent = true
            }
        }

        return data
    }

    static addAttributeType(data, attribute, condition) {
        const currentType = DEGENESIS.attributeType[attribute];

        data.isPreferred = currentType === condition;

        return data;
    }

    static getModificationActions() {
        let actions = foundry.utils.deepClone(DEGENESIS.modifyActions);

        for (let attr in DEGENESIS.attributeAbbrev)
            actions[`attr:${attr}`] = `All ${DEGENESIS.attributeAbbrev[attr]}`

        for (let skill in DEGENESIS.skills)
            actions[`skill:${skill}`] = `${DEGENESIS.attributeAbbrev[DEGENESIS.skillAttributes[skill]]}+${DEGENESIS.skills[skill]}`

        actions[`custom`] = `Custom`

        return actions;
    }

    static findKey(value, object) {
        for (let key in object)
            if (object[key] === value)
                return key
        throw "Could not find key corresponding to " + value
    }

    /**
 * Helper function to set up chat data (set roll mode and content).
 * 
 * @param {String} content 
 * @param {String} modeOverride 
 * @param {Boolean} isRoll 
 */
    static chatDataSetup(content, speaker, modeOverride, isRoll = false, forceWhisper) {

        // Failsafe variable if there is no portrait specified within Actor/Item
        let portraitPath;
        if (speaker) { portraitPath = speaker.portrait; } else { portraitPath = null }

        //Standard chatData preparation
        let chatData = {
            user: game.userid,
            rollMode: modeOverride || game.settings.get("core", "rollMode"),
            content: content,
            speaker: speaker,
            flags: { portrait: portraitPath } // Flags are getting passed to ChatMessage class - only way to get some information into those
        };
        if (isRoll)
            chatData.sound = CONFIG.sounds.dice

        if (["gmroll", "blindroll"].includes(chatData.rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
        if (chatData.rollMode === "blindroll") chatData["blind"] = true;
        else if (chatData.rollMode === "selfroll") chatData["whisper"] = [game.user];

        if (forceWhisper) { // Final force !
            chatData["speaker"] = ChatMessage.getSpeaker();
            chatData["whisper"] = ChatMessage.getWhisperRecipients(forceWhisper);

        }

        return chatData;
    }
}