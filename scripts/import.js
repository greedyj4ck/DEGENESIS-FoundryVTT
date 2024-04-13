// SCRIPT FOR IMPORTING ITEMS FROM JSON FILE

game.importData = function () {
  let weapons = [];
  fetch("systems/degenesis/tb_weapons_melee.json").then((r) =>
    r.json().then((json) => {
      for (let item of json.items) {
        //game.system is deprecated.... -> game.model
        let itemData = foundry.utils.deepClone(game.model.Item.weapon);
        itemData.cult = item.cult.join(", ");
        itemData.damage = item.damage;
        itemData.description = item.description;
        itemData.encumbrance = item.encumbrance || 0;
        itemData.distance.melee = item.distance || 0;
        itemData.handling = item.handling || 0;

        itemData.qualities = item.qualities.map((q) => {
          let qualityObj = {
            name: (q.name = DEG_Utility.findKey(
              q.name,
              DEGENESIS.weaponQualities
            )),
          };
          qualityObj.values = DEGENESIS.weaponQualitiesValues[
            qualityObj.name
          ].map((name) => {
            return { name };
          });
          if (q.property) qualityObj.values[0].value = q.property;
          return qualityObj;
        });
        itemData.resources = item.resources || 0;
        itemData.slots = { total: item.slots || 0, used: 0 };
        itemData.value = item.value || 0;
        let newItem = { name: item.name, data: itemData, type: "weapon" };
        if (item.specialty)
          foundry.utils.setProperty(
            newItem,
            "flags.degenesis.specialty",
            item.specialty
          );

        weapons.push(newItem);
      }
    })
  );
  return weapons;
};
