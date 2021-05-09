import { DEGENESIS } from "./config.js"

export class DegenesisImporter 
{
    static KatharSysCharacterImportDialog(actorId)
    {
        new Dialog({
            content : "Input your KatharSys Character ID<div><input name='id'/></div>",
            title : "KatharSys Import",
            buttons : {
            "import" : {
                label : "Import",
                callback : async (dlg) => {
                    let actorData = await this.KatharSysCharacterImport(dlg.find("input[name=id]").val())
                    game.actors.get(actorId).update(actorData);
                }
            }
        }
        }).render(true)
    }
    static async KatharSysCharacterImport(id)
    {
        let response = await fetch("http://localhost:3000/katharsys", {
            method: "POST",
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
            body : "uid="+id
        })
        let actor = { name : "", data : foundry.utils.deepClone(game.system.model.Actor.character)}
        let importString = await response.text();
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