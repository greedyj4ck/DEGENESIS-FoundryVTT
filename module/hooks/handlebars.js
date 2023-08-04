import { DEGENESIS } from "../config.js"
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

        Handlebars.registerHelper('moreThanSixDice', function (rolls) {
            if (rolls.length > 6) { return true; } else { return false; }
        })

        Handlebars.registerHelper('isSuccess', function (result) {
            if (result === 'success') { return true; } else { return false }
        })

        Handlebars.registerHelper('currentEgo', function (ego) {
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
        Handlebars.registerHelper('drawTitle', function (title) {
            return `<div class="header-column header-line">
                        <div class="square little left"></div>
                        <svg class="start-line" height="11" width="9%">
                            <line x1="0%" y1="5" x2="88%" y2="5" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                            <line x1="88%" y1="5" x2="100%" y2="11" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                        </svg>
                        <svg class="title-line middle-left" height="11" width="100%">
                            <line x1="0" y1="11" x2="100%" y2="11" style="stroke: black; stroke-width: 1"></line>
                        </svg>
                        <div class="middle-name">${title}</div>
                        <svg class="title-line middle-right" height="11" width="100%">
                            <line x1="0" y1="11" x2="100%" y2="11" style="stroke: black; stroke-width: 1"></line>
                        </svg>
                        <svg class="start-line" height="11" width="9%">
                            <line x1="0%" y1="11" x2="12%" y2="5" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                            <line x1="12%" y1="5" x2="100%" y2="5" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                        </svg>
                        <div class="square little right"></div>
                    </div>
                    <div class="break"></div>`;
        })
        Handlebars.registerHelper('drawSubtitle', function (title) {
            return `<div class="body-column body-line">
                        <div class="square little left"></div>
                        <svg class="title-line middle-left" height="11" width="100%">
                            <line x1="0" y1="11" x2="100%" y2="11" style="stroke:black;stroke-width:1"></line>
                        </svg>
                        <div class="middle-name">${title}</div>
                        <svg class="title-line middle-right" height="11" width="100%">
                            <line x1="0" y1="11" x2="100%" y2="11" style="stroke:black;stroke-width:1"></line>
                        </svg>
                        <div class="square little right"></div>
                    </div>`;
        })
        Handlebars.registerHelper('drawImage', (item) => `<div class="img-frame"><img class="profile-img" src="${item.img}" data-edit="img" title="${item.name}" height="100" width="100" /></div>`)
        Handlebars.registerHelper('drawStartLine', function (width) {
            return `<svg class="tab-start-line" height="23" width="${width}">
                        <line x1="0" y1="7" x2="10" y2="7" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                        <line x1="10" y1="7" x2="26" y2="23" style="stroke: rgb(164, 164, 164); stroke-width: 1"></line>
                    </svg>`;
        })

    })
}
