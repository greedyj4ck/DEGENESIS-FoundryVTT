//import { DegenesisCombatTrackerConfig } from "../apps/combat-config";

import { injectSVGIcons } from "../item/svg.js";

export default function () {
  // Apply select2 to item
  Hooks.once("ready", () => {});

  Hooks.on("renderSettings", (app, html) => {
    const details = html.querySelector("section.info");
    const pip = details.querySelector(".system .update");
    details.querySelector(".system").remove();

    const badge = document.createElement("div");
    badge.classList.add("dgns", "system-badge");
    badge.innerHTML = `
    <img src="systems/degenesis/ui/degenesis-logo-white.svg" data-tooltip="${game.system.title}" alt="${game.system.title}">
    <span class="system-info">${game.system.version}</span>
  `;
    if (pip)
      badge
        .querySelector(".system-info")
        .insertAdjacentElement("beforeend", pip);
    details.insertBefore(badge, details.querySelector("div.build"));
  });

  Hooks.on("renderChatLog", () => {
    $("select.roll-type-select").select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $("#chat-controls"),
    });
  });

  Hooks.on("renderFormApplication", (app, [html]) => {
    $(`#${app.id} select`).select2({
      dropdownParent: $(`[data-appid=${app.appId}]`),
      minimumResultsForSearch: Infinity,
    });
  });

  Hooks.on("renderRollDialog", (app, [html]) => {
    $(".roll-dialog select").select2({
      minimumResultsForSearch: 10,

      language: {
        noResults: function () {
          return game.i18n.localize("UI.None");
        },
      },
      dropdownParent: $(`#${app.id}`),
    });
  });

  Hooks.on("renderRollPhenomenonDialog", (app, [html]) => {
    $("select").select2({
      minimumResultsForSearch: 10,
      dropdownParent: $(`[data-appid=${app.appId}]`),
      language: {
        noResults: function () {
          return game.i18n.localize("UI.None");
        },
      },
    });
  });

  Hooks.on("renderDegenesisCharacterSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownAutoWidth: true,
      dropdownParent: $(`[data-appid=${app.appId}]`),
    });

    const SVG_ICONS = [
      { selector: "[data-culture-icon]", className: "culture-img" },
      { selector: "[data-concept-icon]", className: "concept-img" },
      { selector: "[data-cult-icon]", className: "cult-img" },
    ];
    // Fix for inline styling
    injectSVGIcons(html, SVG_ICONS);
  });

  Hooks.on("renderDegenesisNPCSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $(`[data-appid=${app.appId}]`),
    });

    const SVG_ICONS = [
      { selector: "[data-culture-icon]", className: "culture-img" },
      { selector: "[data-concept-icon]", className: "concept-img" },
      { selector: "[data-cult-icon]", className: "cult-img" },
    ];
    // Fix for inline styling
    injectSVGIcons(html, SVG_ICONS);
  });

  Hooks.on("renderDegenesisAberrantSheet", (app, [html]) => {
    $(`#${app.id} select`).select2({
      minimumResultsForSearch: Infinity,
      dropdownParent: $(`[data-appid=${app.appId}]`),
    });

    const SVG_ICONS = [
      { selector: "[data-rapture-icon]", className: "rapture-img" },
    ];
    // Fix for inline styling
    injectSVGIcons(html, SVG_ICONS);
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
