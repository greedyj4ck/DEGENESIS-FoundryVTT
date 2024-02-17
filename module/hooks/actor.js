export default function () {
  Hooks.on("combatRound", function () {
    const encounter = game.combats.combats.find((e) => e.active === true);

    encounter.combatants.forEach(function (combatant, index) {
      const itemIds = combatant.actor.items
        .filter((e) => e.name === "Spent Ego Bonus")
        .map(function (value, index) {
          return value._id;
        });

      combatant.actor.deleteEmbeddedDocuments("Item", itemIds);
    });
  });
}
