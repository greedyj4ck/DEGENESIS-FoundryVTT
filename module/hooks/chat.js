export default function () {
  //Hooks.on("chatMessage", (html, content, msg) => {
  //
  //   }
  // })

  Hooks.on("renderChatMessage", async (app, html, msg) => {
    // Do not display "Blind" chat cards to non-gm

    let portraitPath = app.flags.portrait;

    if (app.flags.portrait) {
      html[0].innerHTML =
        `<div class="portrait-wrapper" style="background-image: linear-gradient(to bottom, var(--b-alpha-8), var(--b-alpha-5)), url('` +
        portraitPath +
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
  });

  // Activate chat listeners defined in dice-wfrp4e.js
  Hooks.on("renderChatLog", (log, html, data) => {});
}
