/**
 * Combat-related hooks for Degenesis.
 */

export default function registerCombatHooks() {
  Hooks.on("updateCombat", (combat, changed) => {
    if (!game.user.isGM) return;
    if (!changed || !("round" in changed)) return;
    if (!combat?.combatants?.size) return;

    const updates = [];
    for (const c of combat.combatants.contents) {
      const actor = c.actor;
      if (!actor?.system?.state) continue;
      if (actor.system.state.motion === true) {
        updates.push({ _id: actor.id, "system.state.motion": false });
      }
    }
    if (updates.length) void Actor.updateDocuments(updates);
  });
}
