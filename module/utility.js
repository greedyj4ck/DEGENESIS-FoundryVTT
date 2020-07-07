import {DEGENESIS} from "./config.js"

export class DEG_Utility {
    static addDiamonds(data, diamondMax = 0, valueAttribute = "value")
    {
        data.diamonds = [];
        for (let i = 0; i < diamondMax; i++)
        {
            data.diamonds.push({
                filled : i + 1 <= getProperty(data, valueAttribute)
            })
        }

        if (getProperty(data, "max"))
        {
            for (let i = 0; i < diamondMax; i++)
            {
                data.diamonds[i].locked = i + 1 > getProperty(data, "max")
            }
        }   

        if (data.permanent)
        {
            for (let i = 0; i < data.permanent; i++)
            {
                data.diamonds[i].permanent = true
            }
        }

        return data
    }

    static getModificationActions()
    {
        let actions = duplicate(DEGENESIS.modifyActions);

        for(let attr in DEGENESIS.attributeAbbrev)
            actions[`attr:${attr}`] = `All ${DEGENESIS.attributeAbbrev[attr]}`

        for(let skill in DEGENESIS.skills)
            actions[`skill:${skill}`] = `${DEGENESIS.attributeAbbrev[DEGENESIS.skillAttributes[skill]]}+${DEGENESIS.skills[skill]}`

        actions[`custom`] = `Custom`
        
        return actions;
    }

    static findKey(value, object)
    {
        for (let key in object) 
            if (object[key] === value)
                return key
        throw "Could not find key corresponding to " + value
    }
}