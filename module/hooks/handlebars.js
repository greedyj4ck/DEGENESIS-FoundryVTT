import {DEGENESIS} from "../config.js"
import { ShowInventoryHeaders } from "../settings.js"

export default function () {

    Hooks.on("init", () => {
        Handlebars.registerHelper("ifIsGM", function (options) {
            return game.user.isGM ? options.fn(this) : options.inverse(this)
        })


        Handlebars.registerHelper("isGM", function (options) {
            return game.user.isGM
        })


        Handlebars.registerHelper("config", function (key) {
            return DEGENESIS[key]
        })
        
        Handlebars.registerHelper("configLookup", function (obj, key) {
            return DEGENESIS[obj][key]
        })

        Handlebars.registerHelper('capitalize', function (aString) {
            return aString.charAt(0).toUpperCase() + aString.slice(1);
        })

        Handlebars.registerHelper('showHeaders', function (options) {
            return ShowInventoryHeaders()
        })

    })
}
