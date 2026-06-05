import { applyAutomatedDamageFromMessage } from "../combat-automation.js";

// Module-level flag for logs state
let DEGENESIS_LOGS_ENABLED = false;

export function isLogsEnabled() {
  return DEGENESIS_LOGS_ENABLED;
}

export default function () {
  Hooks.on("chatMessage", (html, content, msg) => {
    // Handle /logs command
    if (content.trim() === "/logs") {
      if (!game.user.isGM) {
        ui.notifications.warn(game.i18n.localize("DGNS.LogsOnlyGM"));
        return false;
      }

      DEGENESIS_LOGS_ENABLED = !DEGENESIS_LOGS_ENABLED;

      const statusText = DEGENESIS_LOGS_ENABLED
        ? game.i18n.localize("DGNS.LogsEnabled")
        : game.i18n.localize("DGNS.LogsDisabled");

      ChatMessage.create({
        content: `<strong style="color: #4b7bec;">${statusText}</strong>`,
        blind: true,
        flags: {
          degenesis: {
            isSystemLog: true,
          },
        },
      });

      return false;
    }
  });

  Hooks.on("renderChatMessage", async (app, html, msg) => {
    // Do not display "Blind" chat cards to non-gm

    let portraitPath = app.flags.portrait;

    if (portraitPath?.path) {
      html[0].innerHTML =
        `<div class="portrait-wrapper" style="background-image: linear-gradient(to bottom, var(--b-alpha-8), var(--b-alpha-5)), url('` +
        portraitPath.path +
        `')">\n` +
        html[0].innerHTML +
        "\n</div>";
    } else {
      html[0].innerHTML =
        `<div class="portrait-wrapper">\n` + html[0].innerHTML + "\n</div>";
    }

    if (html.hasClass("blind") && !game.user.isGM) {
      html.find(".message-header").remove(); // Remove header so Foundry does not attempt to update its timestamp
      html.html("").css("display", "none");
    }

    let postedItem = html.find(".post-item")[0];
    if (postedItem) {
      let descriptionButton = html.find(".button-toggle-description")[0];
      if (descriptionButton) {
        descriptionButton.addEventListener("click", (ev) => {
          let description = html.find(".description-text");

          description.addClass("animate__animated", "animate__bounceOutLeft");
          description.toggleClass("description-show");
        });
      }

      postedItem.setAttribute("draggable", true);
      postedItem.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            type: "item",
            payload: app.getFlag("degenesis", "transfer"),
          })
        );
      });
    }

    const autoCombat = app.flags?.degenesis?.autoCombatDamage;
    if (autoCombat) {
      const applyButton = html.find(".degenesis-apply-damage-button")[0];
      if (applyButton) {
        applyButton.addEventListener("click", async (ev) => {
          ev.preventDefault();
          await applyAutomatedDamageFromMessage(app);
        });
        applyButton.addEventListener("contextmenu", (ev) => {
          ev.preventDefault();
        });
      }
    }
  });

  // Activate chat listeners defined in dice-wfrp4e.js
  Hooks.on("renderChatLog", (log, html, data) => {});
}
