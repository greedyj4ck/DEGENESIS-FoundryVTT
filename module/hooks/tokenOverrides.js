export default function () {
    Hooks.on("init", () => {
        Token.prototype._refreshTarget = function () {
            this.targeted.clear();
            if (!this.targeted.size) return;

            // Determine whether the current user has target and any other users
            const [others, user] = Array.from(this.targeted).partition(u => u === game.user);
            const userTarget = user.length;

            // For the current user, draw the target arrows
            if (userTarget) {
                let p = 4;
                let aw = 12;
                let h = this.h;
                let hh = h / 2;
                let w = this.w;
                let hw = w / 2;
                let ah = canvas.dimensions.size / 3;
                this.target.beginFill(0xed1d27, 1.0).lineStyle(1, 0x000000)
                    .drawPolygon([-p, hh, -p - aw, hh - ah, -p - aw, hh + ah])
                    .drawPolygon([w + p, hh, w + p + aw, hh - ah, w + p + aw, hh + ah])
                    .drawPolygon([hw, -p, hw - ah, -p - aw, hw + ah, -p - aw])
                    .drawPolygon([hw, h + p, hw - ah, h + p + aw, hw + ah, h + p + aw]);
            }

            // For other users, draw offset pips
            for (let [i, u] of others.entries()) {
                let color = colorStringToHex(u.data.color);
                this.target.beginFill(color, 1.0).lineStyle(2, 0x0000000).drawCircle(2 + (i * 8), 0, 6);
            }
        }

        Token.prototype._drawBar = function (number, bar, data) {
            const val = Number(data.value);
            const pct = Math.clamped(val, 0, data.max) / data.max;
            let h = Math.max((canvas.dimensions.size / 12), 8);
            if (this.data.height >= 2) h *= 1.6;  // Enlarge the bar for large tokens

            // Draw the bar
            let color = (number === 0) ? [0.777, 0.0951, 0.1279] : [1, 1, 1];
            bar.clear()
                .beginFill(0x000000, 0.5)
                .lineStyle(2, 0x000000, 0.9)
                .drawRoundedRect(0, 0, this.w, h, 3)
                .beginFill(PIXI.utils.rgb2hex(color), 0.8)
                .lineStyle(1, 0x000000, 0.8)
                .drawRoundedRect(1, 1, pct * (this.w - 2), h - 2, 2);

            // Set position
            let posY = number === 0 ? this.h - h : 0;
            bar.position.set(0, posY);
        }
    });
}