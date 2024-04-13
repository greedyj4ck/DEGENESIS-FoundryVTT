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
    });
  });

  Hooks.on("renderRollDialog", (app, [html]) => {
    $(".roll-dialog select").select2({});
  });
}
