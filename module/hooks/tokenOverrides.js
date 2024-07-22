export default function () {
  Hooks.on("init", () => {
    Token.prototype._refreshTarget = function () {
      this.target.clear();
      if (!this.targeted.size) return;

      // Determine whether the current user has target and any other users
      const [others, user] = Array.from(this.targeted).partition(
        (u) => u === game.user
      );
      const userTarget = user.length;

      // For the current user, draw the target arrows
      if (userTarget) {
        let p = 10;
        let a = canvas.dimensions.size / 3; // size of triangle
        let ah = 0.5 * a * Math.sqrt(3); // height of triangle
        let off = canvas.dimensions.size / 8; // offset of triangles

        let h = this.h;
        let hh = h / 2;
        let w = this.w;
        let hw = w / 2;

        this.target
          .lineStyle(2, 0x83754e)
          .drawPolygon([hw, -p, hw + a / 2, -p - ah, hw - a / 2, -p - ah]) // draw first triangle
          .drawPolygon([
            hw,
            -p - off,
            hw + a / 2,
            -p - off - ah,
            hw - a / 2,
            -p - off - ah,
          ]) // draw second triangle with offset
          .drawPolygon([
            hw,
            -p - 2 * off,
            hw + a / 2,
            -p - 2 * off - ah,
            hw - a / 2,
            -p - 2 * off - ah,
          ]); // draw third triangle with double offset
      }

      // For other users, draw offset pips
      for (let [i, u] of others.entries()) {
        let color = Color.from(u.data.color);
        this.target
          .beginFill(color, 1.0)
          .lineStyle(2, 0x0000000)
          .drawCircle(2 + i * 8, 0, 6);
      }
    };

    Token.prototype._drawBar = function (number, bar, data) {
      const val = Number(data.value);
      const pct = Math.clamped(val, 0, data.max) / data.max;
      let h = Math.max(canvas.dimensions.size / 12, 8);
      if (this.height >= 2) h *= 1.6; // Enlarge the bar for large tokens

      // Draw the bar
      let color = number === 0 ? [0.777, 0.0951, 0.1279] : [1, 1, 1];
      bar
        .clear()
        .beginFill(0x000000, 0.5)
        .lineStyle(2, 0x000000, 0.9)
        .drawRoundedRect(0, 0, this.w, h, 3)
        .beginFill(PIXI.utils.rgb2hex(color), 0.8)
        .lineStyle(1, 0x000000, 0.8)
        .drawRoundedRect(1, 1, pct * (this.w - 2), h - 2, 2);

      // Set position
      let posY = number === 0 ? this.h - h : 0;
      bar.position.set(0, posY);
    };
  });
}
