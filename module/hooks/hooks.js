import actor from "./actor.js"
import chat from "./chat.js"
import context from "./context.js"
import tokenOverrides from "./tokenOverrides.js"

export default function () {
    actor();
    chat();
    context();
    tokenOverrides();
}