import { DegenesisItem } from "./item/item-degenesis.js";

/**
 * World Item document ids for intrinsic unarmed melee (e.g. punch / kick).
 * Clone these with `{ parent: actor }` so they never need to live in the actor's inventory.
 */
export const INTRINSIC_MELEE_WORLD_ITEM_IDS = [
  "0QODrW1e8iCzdIp4",
  "jlAw3QBDSNPpfS1d",
];

/**
 * Ephemeral weapon owned by `actor`, backed by a world Item definition.
 * @param {Actor} actor
 * @param {string} worldItemId
 * @returns {DegenesisItem|null}
 */
export function createIntrinsicMeleeWeapon(actor, worldItemId) {
  if (!actor || !worldItemId) return null;
  const doc = game.items.get(worldItemId);
  if (!doc || doc.type !== "weapon") return null;
  const item = new DegenesisItem(doc.toObject(false), { parent: actor });
  item.prepareOwnedData();
  return item;
}

/**
 * @param {Actor} actor
 * @returns {{ worldId: string, weapon: DegenesisItem }[]}
 */
export function getIntrinsicMeleeWeaponRows(actor) {
  const rows = [];
  for (const id of INTRINSIC_MELEE_WORLD_ITEM_IDS) {
    const weapon = createIntrinsicMeleeWeapon(actor, id);
    if (weapon) rows.push({ worldId: id, weapon });
  }
  return rows;
}

/**
 * Ensures parry selection can use intrinsic unarmed weapons even though they are not embedded.
 * @param {Actor} actor
 * @param {Item[]} baseList
 * @returns {Item[]}
 */
export function appendIntrinsicMeleeWeaponsForParry(actor, baseList) {
  const result = [...baseList];
  const seen = new Set(result.map((i) => i.id));
  for (const id of INTRINSIC_MELEE_WORLD_ITEM_IDS) {
    const w = createIntrinsicMeleeWeapon(actor, id);
    if (w && !seen.has(w.id)) {
      result.push(w);
      seen.add(w.id);
    }
  }
  return result;
}
