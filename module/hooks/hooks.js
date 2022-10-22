// REGISTERING ALL THE NECESSARY HOOKS 

import actorHooks from "./actor.js"
import chatHooks from "./chat.js"
import contextHooks from "./context.js"
import tokenOverrides from "./tokenOverrides.js"
import itemHooks from "./item.js";
import handlebars from "./handlebars.js"
import diceSoNiceHooks from "./dsn.js"

export default function () {
    actorHooks();
    itemHooks();
    chatHooks();
    contextHooks();
    tokenOverrides();
    handlebars();
    diceSoNiceHooks();
}