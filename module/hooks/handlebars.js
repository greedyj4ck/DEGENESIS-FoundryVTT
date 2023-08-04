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

        Handlebars.registerHelper('moreThanSixDice', function(rolls) {
            if(rolls.length > 6){return true;}else{return false;}
                })

        Handlebars.registerHelper('isSuccess', function(result){
            if(result ==='success'){return true;}else{return false}
        })

        Handlebars.registerHelper('currentEgo', function(ego){
            
            return (ego.max - ego.value)
        })

        Handlebars.registerHelper('drawPageSquare', function (index, max) {
            let result = '<div class="footer-diamond">';

            for (let i = 0; i < max; i++) {
                if (i == index) result += '<div class="square little black"></div>';
                else result += '<div class="square little"></div>';
            }

            return result + '</div>';
        })
        Handlebars.registerHelper('drawImage', (item) => `<div class="img-frame"><img class="profile-img" src="${item.img}" data-edit="img" title="${item.name}" height="100" width="100" /></div>`)
    })
}
