import { DEGENESIS } from "./config.js"

export class DegenesisImporter 
{
    static KatharSysCharacterImport(actorId)
    {
        new Dialog({
            content : "Input your KatharSys Character ID<div><input name='id'/></div>",
            title : "KatharSys Import",
            buttons : {
                title : "Import",
                callback : async (dlg) => {
                    let actorData = await this.KatharSysCharacterImport(dlg.find("input[name=id]").val())
                    game.actors.get(actorId).update(actorData);
                }
            }

        })
    }
    static KatharSysCharacterImport(id)
    {


        let actor = { name : "", data : duplicate(game.system.model.Actor.character)}
        let importString = "0&e135fec6-7b50-4f86-e440-f2443895640f&75e8e561-f589-4b19-91fb-7333e95cf7cd&1|name|ag|rank|experience|sex|height|weight|money| test|1|2|3| | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | ||0|0|0|312113|221023201110001002010222010023221122|123123|100000|0|0"
        let importValues = importString.split("|")
        actor.name = importValues[1]
        actor.data.details.age.value = importValues[2]
        actor.data.details.rank.value = importValues[3]
        actor.data.details.experience.value = importValues[4]
        actor.data.details.sex.value = importValues[5]
        actor.data.details.height.value = importValues[6]
        actor.data.details.weight.value = importValues[7]
        actor.data.details.dinars.value = importValues[8]
        actor.data.details.culture.value = Object.keys(DEGENESIS.cultures)[parseInt(importValues[68])]
        actor.data.details.concept.value = Object.keys(DEGENESIS.concepts)[parseInt(importValues[69])]
        actor.data.details.cult.value = Object.keys(DEGENESIS.cults)[parseInt(importValues[70])]

        var attr = importValues[71].split("");
        for(let i = 0; i < Object.keys(actor.data.attributes).length; i++)
        {
            actor.data.attributes[Object.keys(actor.data.attributes)[i]].value = parseInt(attr[i]);
        }
        
        var skills = importValues[72].split("");
        for(let i = 0; i < Object.keys(actor.data.skills).length; i++)
        {
            actor.data.skills[Object.keys(actor.data.skills)[i]].value = parseInt(skills[i]);
        }

        var backgrounds = importValues[73].split("");
        for(let i = 0; i < Object.keys(actor.data.backgrounds).length; i++)
        {
            actor.data.backgrounds[Object.keys(actor.data.backgrounds)[i]].value = parseInt(backgrounds[i]);
        }

        return actor;
        
    }
}