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
        return data
    }
}