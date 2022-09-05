//=========================================================================
// canvas rendering helpers
//=========================================================================

var Render = {

    polygon: function (ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    },

    //---------------------------------------------------------------------------

    segment: function (ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {

        var r1 = Render.rumbleWidth(w1, lanes),
            r2 = Render.rumbleWidth(w2, lanes),
            l1 = Render.laneMarkerWidth(w1, lanes),
            l2 = Render.laneMarkerWidth(w2, lanes),
            lanew1, lanew2, lanex1, lanex2, lane;

        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);

        Render.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
        Render.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        Render.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

        if (color.lane) {
            lanew1 = w1 * 2 / lanes;
            lanew2 = w2 * 2 / lanes;
            lanex1 = x1 - w1 + lanew1;
            lanex2 = x2 - w2 + lanew2;
            for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++)
                Render.polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
        }

        Render.fog(ctx, 0, y1, width, y2 - y1, fog);
    },

    //---------------------------------------------------------------------------

    background: function (ctx, background, width, height, layer, rotation, offset) {

        rotation = rotation || 0;
        offset = offset || 0;

        var imageW = layer.w / 2;
        var imageH = layer.h;

        var sourceX = layer.x + Math.floor(layer.w * rotation);
        var sourceY = layer.y
        var sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
        var sourceH = imageH;

        var destX = 0;
        var destY = offset;
        var destW = Math.floor(width * (sourceW / imageW));
        var destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if (sourceW < imageW)
            ctx.drawImage(background, layer.x, sourceY, imageW - sourceW, sourceH, destW - 1, destY, width - destW, destH);
    },

    //---------------------------------------------------------------------------

    place: function (ctx, place, dist, x, y) {
        ctx.fillStyle = "black";
        ctx.fillRect(x - dist / 2, y - 50, dist, 20);
        ctx.lineWidth = "1";
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.rect(x - dist / 2, y - 50, dist, dist / 2);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = "20px Arial";
        ctx.fillText(place, x - dist / 2 + 5, y - 33);
    },

    //---------------------------------------------------------------------------

    sprite: function (ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY, speedPercent) {

        //  scale for projection AND relative to roadWidth
        var destW = (sprite.w * scale * width / 2) * (SPRITES.SCALE * roadWidth);
        var destH = (sprite.h * scale * width / 2) * (SPRITES.SCALE * roadWidth);

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));

        var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        if (clipH < destH) {
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
            if (!motionBlurOn) {
                // Skip rendering motion blur
            }
            else if (speedPercent && speedPercent > 0.5 && speedPercent <= 0.8) {
                ctx.globalAlpha = 0.5;
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX - 2, destY, destW, destH - clipH);
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX + 2, destY, destW, destH - clipH);
                ctx.globalAlpha = 1;
            }
            else if (speedPercent && speedPercent > 0.8 && speedPercent <= 0.95) {
                ctx.globalAlpha = 0.5;
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX - 3, destY, destW, destH - clipH);
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX + 3, destY, destW, destH - clipH);
                ctx.globalAlpha = 1;
            }
            else if (speedPercent && speedPercent > 0.95) {
                ctx.globalAlpha = 0.5;
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX - 5, destY, destW, destH - clipH);
                ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX + 5, destY, destW, destH - clipH);
                ctx.globalAlpha = 1;
            }
        }
    },

    //---------------------------------------------------------------------------

    player: function (ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
        var bounce = 0;
        if (screenShakeOn && !paused) {
            bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1, 1]) * 4;
        }
        scale = 0.000335;

        if (durability <= maxDurability * 3 / 4) {
            if (durability <= maxDurability * 3 / 4 && durability > maxDurability * 2 / 4) {
                Render.smoke(ctx, 1);
                if (cameraView === 2) {
                    var crashSprite = SPRITES.SHATTERED1;
                    Render.sprite(ctx, 1000, 600, resolution, roadWidth, sprites, crashSprite, scale, 420, 500 + bounce, -0.5, -1);
                }
            }
            else if (durability <= maxDurability * 2 / 4 && durability > maxDurability * 1 / 4) {
                Render.smoke(ctx, 2);
                if (cameraView === 2) {
                    var crashSprite = SPRITES.SHATTERED2;
                    Render.sprite(ctx, 1100, 600, resolution, roadWidth, sprites, crashSprite, scale, 460, 550 + bounce, -0.5, -1);
                }
            }
            else if (durability <= maxDurability * 1 / 4 && durability > 0) {
                Render.smoke(ctx, 5);
                if (cameraView === 2) {
                    var crashSprite = SPRITES.SHATTERED3;
                    Render.sprite(ctx, 1000, 900, resolution, roadWidth, sprites, crashSprite, scale, 430, 650 + bounce, -0.5, -1);
                }
            }
            else {
                Render.smoke(ctx, 10);
                if (cameraView === 2) {
                    var crashSprite = SPRITES.SHATTERED4;
                    Render.sprite(ctx, width, height, resolution, roadWidth, sprites, crashSprite, scale, destX, destY + bounce, -0.5, -1);
                }
            }
        }

        var sprite;
        if (cameraView === 1) {
            if (wrecked || paused) {
                sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
            }
            else if (steer < 0)
                sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
            else if (steer > 0)
                sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
            else
                sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
        }
        else if (cameraView === 2) {
            if (wrecked || paused) {
                sprite = SPRITES.PLAYER_FPS_STRAIGHT;
            }
            else if (steer < 0)
                sprite = SPRITES.PLAYER_FPS_LEFT;
            else if (steer > 0)
                sprite = SPRITES.PLAYER_FPS_RIGHT;
            else
                sprite = SPRITES.PLAYER_FPS_STRAIGHT;
        }
        else {
            if (wrecked || paused) {
                sprite = SPRITES.PLAYER_FPS_STRAIGHT;
            }
            else if (steer < 0)
                sprite = SPRITES.PLAYER_FPS_LEFT;
            else if (steer > 0)
                sprite = SPRITES.PLAYER_FPS_RIGHT;
            else
                sprite = SPRITES.PLAYER_FPS_STRAIGHT;
        }

        Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);

        if (cameraView === 1 && speed > 0 && !wrecked && !finished) {
            Render.exhaust(ctx);
        }

        if (durability <= maxDurability * 3 / 4) {
            if (durability <= maxDurability * 3 / 4 && durability > maxDurability * 2 / 4) {
                if (cameraView === 1) {
                    var crashSprite = SPRITES.SHATTERED1;
                    Render.sprite(ctx, 1000, 600, resolution, roadWidth, sprites, crashSprite, scale, 420, 500 + bounce, -0.5, -1);
                }
            }
            else if (durability <= maxDurability * 2 / 4 && durability > maxDurability * 1 / 4) {
                if (cameraView === 1) {
                    var crashSprite = SPRITES.SHATTERED2;
                    Render.sprite(ctx, 1100, 600, resolution, roadWidth, sprites, crashSprite, scale, 460, 550 + bounce, -0.5, -1);
                }
            }
            else if (durability <= maxDurability * 1 / 4 && durability > 0) {
                if (cameraView === 1) {
                    var crashSprite = SPRITES.SHATTERED3;
                    Render.sprite(ctx, 1000, 900, resolution, roadWidth, sprites, crashSprite, scale, 430, 650 + bounce, -0.5, -1);
                }
            }
            else {
                if (cameraView === 1) {
                    var crashSprite = SPRITES.SHATTERED4;
                    Render.sprite(ctx, width, height, resolution, roadWidth, sprites, crashSprite, scale, destX, destY + bounce, -0.5, -1);
                }
            }
        }
    },

    //---------------------------------------------------------------------------

    fog: function (ctx, x, y, width, height, fog) {
        if (fog < 1) {
            ctx.globalAlpha = (1 - fog)
            ctx.fillStyle = COLORS.FOG;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = 1;
        }
    },

    //---------------------------------------------------------------------------

    smoke: function (ctx, density) {
        updateSmoke();
        drawSmoke(density);
    },

    exhaust: function (ctx) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "rgb(0, 256, 256)";
        var renderX = canvas.width / 2;
        if (keyLeft) { renderX += 35; }
        else if (keyRight) { renderX -= 35; }

        ctx.beginPath();
        ctx.ellipse(renderX - 50, 630, 60, 70, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(renderX - 50, 630, 50, 60, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(renderX - 50, 630, 40, 50, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(renderX + 50, 630, 60, 70, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(renderX + 50, 630, 50, 60, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(renderX + 50, 630, 40, 50, Math.PI / 2, 0, 2 * Math.PI);
        ctx.fill();

        for (let i = 0; i < Math.ceil(10 * speed / maxSpeed); i++) {
            var randY = 150 * Math.random();
            var randSize = 75 * Math.random();
            var incr = Math.floor(randY / 2);
            ctx.beginPath();
            ctx.ellipse(renderX - 50 - randY, 630 + randY, 50 + incr + randSize, 60 + incr + randSize, Math.PI / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(renderX + 50 + randY, 630 + randY, 50 + incr + randSize, 60 + incr + randSize, Math.PI / 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    //---------------------------------------------------------------------------

    data: function (ctx, place) {
        if (place) {
            var countHeight = 60;
            ctx.fillStyle = "black";
            ctx.globalAlpha = 0.4;
            ctx.fillRect(0, 0, canvas.width, countHeight);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white';

            if (mode === "time_trial") {
                ctx.font = "25px Arial";
                ctx.fillText("Time: " + formatTime(currentLapTime), 20, 40);
                ctx.fillText("Last: " + formatTime(lastLapTime), 250, 40);
                ctx.fillText("Best: " + formatTime(fastLapTime), 480, 40);
            }
            else if (mode === "race") {
                ctx.font = "50px Arial";
                ctx.fillText(place, canvas.width / 2 - 90, 50);
                ctx.font = "30px Arial";
                ctx.fillText("/" + (cars.length + 1), canvas.width / 2, 50);
                ctx.fillText("Lap:", 10, 40);
                ctx.font = "50px Arial";
                ctx.fillText(lap, 70, 50);
                ctx.font = "30px Arial";
                ctx.fillText("/" + laps, 130, 50);
            }

            var speedInKMH = 5 * Math.round(speed / 500) * 1.6;
            ctx.font = "50px Arial";
            ctx.fillText(speedInKMH, 850, 50);
            ctx.font = "30px Arial";
            ctx.fillText("km/h", 940, 50);

            //Render.throttleMeter2(ctx);

            Render.throttleMeter1(ctx);
        }
    },

    throttleMeter1: function (ctx) {
        if (speed > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "rgb(0, 256, 256)";
            var maxHeight = 450;
            var pillarHeight = speed / maxSpeed * maxHeight;
            var colorHeight = 15;
            var partHeight = 20;
            var maxPillars = Math.ceil(maxHeight / colorHeight);
            var pillars = Math.floor(pillarHeight / colorHeight);
            for (let i = 0; i < pillars; i++) {
                ctx.fillRect(canvas.width - 25 - i * 3 - 2, canvas.height - 100 - i * partHeight - 2, i * 3 + 5 + 4, colorHeight + 4);
                ctx.fillRect(canvas.width - 25 - i * 3, canvas.height - 100 - i * partHeight, i * 3 + 5, colorHeight);
                ctx.fillRect(canvas.width - 25 - i * 3 + 2, canvas.height - 100 - i * partHeight + 2, i * 3 + 5 - 4, colorHeight - 4);
            }
            if (Math.floor(pillarHeight / colorHeight) < Math.floor(maxHeight / colorHeight)) {
                var remainder = pillarHeight % colorHeight;
                ctx.fillRect(canvas.width - 25 - pillars * 3 - 2, canvas.height - 100 - pillars * partHeight - remainder + colorHeight - 2, pillars * 3 + 5 + 4, remainder + 4);
                ctx.fillRect(canvas.width - 25 - pillars * 3, canvas.height - 100 - pillars * partHeight - remainder + colorHeight, pillars * 3 + 5, remainder);
                ctx.fillRect(canvas.width - 25 - pillars * 3 + 2, canvas.height - 100 - pillars * partHeight - remainder + colorHeight + 2, pillars * 3 + 5 - 4, remainder - 4);
            }

            if (speed / maxSpeed === 1) {
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(canvas.width - 50, canvas.height - 100, 10, 0, 2 * Math.PI, false);
                ctx.lineWidth = 6;
                ctx.strokeStyle = 'rgb(0, 256, 256)';
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(canvas.width - 50, canvas.height - 100, 10, 0, 2 * Math.PI, false);
                ctx.lineWidth = 10;
                ctx.strokeStyle = 'rgb(0, 256, 256)';
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }
    },

    throttleMeter2: function (ctx) {
        var circles = 9;
        var strain = Math.floor(speed / maxSpeed * circles);
        var circleColor;
        if (strain >= 9) { circleColor = "red"; }
        else if (strain >= 6) { circleColor = "orange"; }
        else { circleColor = "green"; }

        ctx.globalAlpha = 0.6;
        for (var i = 0; i < circles; i++) {
            ctx.beginPath();
            ctx.arc(canvas.width / 2 - 90 + i * 20, 100, 6, 0, 2 * Math.PI, false);
            if (i < strain) { ctx.fillStyle = circleColor; }
            else { ctx.fillStyle = "black"; }
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#003300';
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    },

    //---------------------------------------------------------------------------

    finished: function (ctx) {
        var countHeight = 200;
        ctx.fillStyle = "black";
        ctx.fillRect(
            0, canvas.height / 2 - countHeight,
            canvas.width, countHeight
        );

        ctx.fillStyle = 'white';
        ctx.font = "100px Arial";
        var text = "Finished " + finishedPlace;
        if (finishedPlace === 1) { text += "st" }
        else if (finishedPlace === 2) { text += "nd" }
        else if (finishedPlace === 3) { text += "rd" }
        else { text += "th" }
        ctx.fillText(text, canvas.width / 2 - 300, canvas.height / 2 - countHeight / 3);

        ctx.font = "35px Arial";
        var text2 = "Continue in " + Math.ceil(continueCountdown / 100)
        ctx.fillText(text2, canvas.width / 2 - 100, canvas.height / 2 - countHeight / 3 + 50);
    },

    //---------------------------------------------------------------------------

    wrecked: function (ctx) {
        Render.data(ctx, finishedPlace);

        var countHeight = 200;
        ctx.fillStyle = "black";
        ctx.fillRect(
            0, canvas.height / 2 - countHeight,
            canvas.width, countHeight
        );

        ctx.fillStyle = 'white';
        ctx.font = "100px Arial";
        var text = "Wrecked"
        ctx.fillText(text, canvas.width / 2 - 180, canvas.height / 2 - countHeight / 3);

        ctx.font = "35px Arial";
        var text2 = "Continue in " + Math.ceil(continueCountdown / 100)
        ctx.fillText(text2, canvas.width / 2 - 100, canvas.height / 2 - countHeight / 3 + 50);
    },

    //---------------------------------------------------------------------------

    paused: function (ctx) {
        Render.data(ctx, place);

        var countHeight = 200;
        ctx.fillStyle = "black";
        ctx.fillRect(
            0, canvas.height / 2 - countHeight,
            canvas.width, countHeight
        );

        ctx.fillStyle = 'white';
        ctx.font = "100px Arial";
        var text = "Paused"
        ctx.fillText(text, canvas.width / 2 - 180, canvas.height / 2 - countHeight / 3);

    },

    //---------------------------------------------------------------------------

    countdown: function (ctx, count) {
        var countHeight = 200;
        ctx.fillStyle = "black";
        ctx.fillRect(
            0, canvas.height / 2 - countHeight,
            canvas.width, countHeight
        );
        ctx.fillStyle = 'white';
        ctx.font = "100px Arial";
        ctx.fillText(Math.ceil(count / 100), canvas.width / 2 - 25, canvas.height / 2 - countHeight / 3);
    },

    rumbleWidth: function (projectedRoadWidth, lanes) { return projectedRoadWidth / Math.max(6, 2 * lanes); },
    laneMarkerWidth: function (projectedRoadWidth, lanes) { return projectedRoadWidth / Math.max(32, 8 * lanes); }

}
