import { DEG_Utility } from "./utility.js";

/** Types allowed inside transportation (same rules as drag-drop onto `.transport-drop`). */
export const STOW_ALLOWED_TYPES = new Set([
  "weapon",
  "armor",
  "ammunition",
  "equipment",
  "mod",
  "shield",
  "artifact",
]);

/**
 * @param {string|undefined} type
 * @returns {boolean}
 */
export function isStowableItemType(type) {
  return Boolean(type && STOW_ALLOWED_TYPES.has(type));
}

/**
 * @param {foundry.documents.Item | import("./item/item-degenesis.js").DegenesisItem | null | undefined} item
 * @returns {boolean}
 */
export function isStowableItem(item) {
  return isStowableItemType(item?.type);
}

/**
 * @param {Actor} actor
 * @param {foundry.documents.Item} item
 * @returns {Promise<string|null>} transportation item id, or null if cancelled / none
 */
export function promptStowInTransport(actor, item) {
  const transports = actor.items.filter((i) => i.type === "transportation");
  if (!transports.length) {
    ui.notifications.warn(game.i18n.localize("UI.StowNoTransport"));
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (v) => {
      if (resolved) return;
      resolved = true;
      resolve(v);
    };

    const options = transports
      .map(
        (t) =>
          `<option value="${DEG_Utility.escapeHtml(t.id)}">${DEG_Utility.escapeHtml(t.name)}</option>`
      )
      .join("");

    new Dialog(
      {
        title: game.i18n.localize("UI.StowDialogTitle"),
        content: `<form class="degenesis-stow-form"><p>${game.i18n.localize(
          "UI.StowDialogPrompt"
        )}</p><div class="form-group"><label>${game.i18n.localize(
          "UI.StowDialogSelectLabel"
        )}</label><select name="transport" class="degenesis-stow-select" style="width:100%">${options}</select></div></form>`,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-box"></i>',
            label: game.i18n.localize("UI.StowDialogConfirm"),
            callback: (html) => {
              const id = html.find('[name="transport"]').val();
              finish(typeof id === "string" ? id : null);
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("UI.StowDialogCancel"),
            callback: () => finish(null),
          },
        },
        default: "confirm",
        close: () => finish(null),
      },
      { width: 400 }
    ).render(true);
  });
}

/**
 * @param {Actor} actor
 * @param {foundry.documents.Item} item
 * @param {string} transportId
 * @returns {Promise<void>}
 */
export async function setItemTransportLocation(actor, item, transportId) {
  const t = actor.items.get(transportId);
  if (!t || t.type !== "transportation") return;
  await actor.updateEmbeddedDocuments("Item", [
    { _id: item.id, "system.location": transportId },
  ]);
}
