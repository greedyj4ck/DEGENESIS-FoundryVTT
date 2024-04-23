//import { DegenesisCombatTrackerConfig } from "../apps/combat-config";

export default function () {
  // Apply select2 to item
  Hooks.once("ready", () => {});

  Hooks.on("renderSettings", (app, [html]) => {
    const details = html.querySelector("#game-details");
    const pip = details.querySelector(".system-info .update");
    details.querySelector(".system").remove();

    const badge = document.createElement("div");
    badge.classList.add("dgns", "system-badge");
    badge.innerHTML = `
    <img src="systems/degenesis/ui/degenesis-white.svg" data-tooltip="${game.system.title}" alt="${game.system.title}">
    <span class="system-info">${game.system.version}</span>
  
  `;
    if (pip)
      badge
        .querySelector(".system-info")
        .insertAdjacentElement("beforeend", pip);
    details.insertAdjacentElement("beforebegin", badge);
  });

  Hooks.on("renderChatLog", () => {
    $("select.roll-type-select").select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $("#chat-controls"),
    });
  });

  Hooks.on("renderRollDialog", (app, [html]) => {
    $(".roll-dialog select").select2({
      dropdownParent: $(`#${app.id}`),
    });
  });

  Hooks.on("renderDegenesisCharacterSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownAutoWidth: true,
      dropdownParent: $(`#${app.id}`),
    });
  });

  Hooks.on("renderDegenesisNPCSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $(`#${app.id}`),
    });
  });

  Hooks.on("renderDegenesisAberrantSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $(`#${app.id}`),
    });
  });

  Hooks.on("renderDegenesisItemSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: 8,
      dropdownParent: $(`#${app.id}`),
      dropdownAutoWidth: true,
      width: "style",
    });
  });

  /*   Hooks.on("renderCombatTracker", (app, [html]) => {
    $(".combat-settings")
      .off("click")
      .on("click", (ev) => {
        ev.preventDefault();
        new DegenesisCombatTrackerConfig(undefined, {}).render(true);
      });
  }); */
}

//  Hooks.on({})
