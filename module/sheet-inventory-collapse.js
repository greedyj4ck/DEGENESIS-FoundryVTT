/**
 * Collapsible inventory categories (localStorage per world + actor).
 * @param {Actor} actor
 */
export function inventoryCollapseStorageKey(actor) {
  const world = game.world?.id ?? "none";
  return `degenesis.inventory.collapsedCategories.${world}.${actor.id}`;
}

/**
 * @param {Actor} actor
 * @returns {Set<string>}
 */
export function loadInventoryCollapsedSet(actor) {
  try {
    const raw = localStorage.getItem(inventoryCollapseStorageKey(actor));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * @param {Actor} actor
 * @param {Set<string>} collapsed
 */
export function saveInventoryCollapsedSet(actor, collapsed) {
  try {
    localStorage.setItem(
      inventoryCollapseStorageKey(actor),
      JSON.stringify([...collapsed])
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {jQuery} html
 * @param {Actor} actor
 */
export function applyInventoryCollapsedState(html, actor) {
  const collapsed = loadInventoryCollapsedSet(actor);
  html.find(".inventory-group[data-inventory-category]").each((_, el) => {
    const cat = el.getAttribute("data-inventory-category");
    if (cat && collapsed.has(cat)) el.classList.add("collapsed");
    else el.classList.remove("collapsed");
  });
}

/**
 * @param {jQuery} html
 * @param {Actor} actor
 */
export function registerInventoryCategoryCollapse(html, actor) {
  applyInventoryCollapsedState(html, actor);

  html.find(".inventory-category-toggle").on("click", (ev) => {
    ev.preventDefault();
    const group = $(ev.currentTarget).closest(".inventory-group");
    const cat = group.attr("data-inventory-category");
    if (!cat) return;
    group.toggleClass("collapsed");
    const collapsed = loadInventoryCollapsedSet(actor);
    if (group.hasClass("collapsed")) collapsed.add(cat);
    else collapsed.delete(cat);
    saveInventoryCollapsedSet(actor, collapsed);
  });
}
