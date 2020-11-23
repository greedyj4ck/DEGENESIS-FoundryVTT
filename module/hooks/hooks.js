import actor from "./actor.js"
import chat from "./chat.js"
import context from "./context.js"
import tokenOverrides from "./tokenOverrides.js"
import item from "./item.js";

export default function () {
    actor();
    item();
    chat();
    context();
    tokenOverrides();
}