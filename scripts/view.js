//=========================================================================
// RENDER THE GAME WORLD
//=========================================================================


// Polyfill for requestAnimationFrame
if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                   window.mozRequestAnimationFrame    || 
                                   window.oRequestAnimationFrame      || 
                                   window.msRequestAnimationFrame     || 
                                   function(callback, element) {
                                     window.setTimeout(callback, 1000 / 60);
                                   }
}

function render() {

    var baseSegment = findSegment(position);
    var basePercent = Util.percentRemaining(position, segmentLength);
    var playerSegment = findSegment(position + playerZ);
    var playerPercent = Util.percentRemaining(position + playerZ, segmentLength);
    var playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    var maxy = height;
    
    var x = 0;
    var dx = - (baseSegment.curve * basePercent);

    ctx.clearRect(0, 0, width, height);

    preShake(speed / speedCap);

    Render.background(ctx, background, width, height, BACKGROUND.SKY, skyOffset, resolution * skySpeed * playerY);
    Render.background(ctx, background, width, height, BACKGROUND.HILLS, hillOffset, resolution * hillSpeed * playerY);
    Render.background(ctx, background, width, height, BACKGROUND.TREES, treeOffset, resolution * treeSpeed * playerY);

    var n, i, segment, car, sprite, spriteScale, spriteX, spriteY;

    for (n = 0; n < drawDistance; n++) {

        segment = segments[(baseSegment.index + n) % segments.length];
        segment.looped = segment.index < baseSegment.index;
        segment.fog = Util.exponentialFog(n / drawDistance, fogDensity);
        segment.clip = maxy;

        Util.project(segment.p1, (playerX * roadWidth) - x, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);
        Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? trackLength : 0), cameraDepth, width, height, roadWidth);

        x = x + dx;
        dx = dx + segment.curve;

        if ((segment.p1.camera.z <= cameraDepth) || // behind us
            (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
            (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
            continue;

        Render.segment(ctx, width, lanes,
            segment.p1.screen.x,
            segment.p1.screen.y,
            segment.p1.screen.w,
            segment.p2.screen.x,
            segment.p2.screen.y,
            segment.p2.screen.w,
            segment.fog,
            segment.color);

        maxy = segment.p1.screen.y;
    }

    for (n = (drawDistance - 1); n > 0; n--) {
        segment = segments[(baseSegment.index + n) % segments.length];

        for (i = 0; i < segment.cars.length; i++) {
            car = segment.cars[i];
            sprite = car.sprite;
            spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
            spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * roadWidth * width / 2);
            spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
            Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip, speed / speedCap);
            if (car.place < place && car.place >= place-5) {
                let dist = 40;
                Render.place(ctx, car.place, dist, spriteX, spriteY);
            }
        }

        for (i = 0; i < segment.sprites.length; i++) {
            sprite = segment.sprites[i];
            spriteScale = segment.p1.screen.scale;
            spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width / 2);
            spriteY = segment.p1.screen.y;
            Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip, speed / speedCap);
        }

        if (segment == playerSegment) {
            Render.player(ctx, width, height, resolution, roadWidth, sprites, speed / speedCap,
                cameraDepth / playerZ,
                width / 2,
                (height / 2) - (cameraDepth / playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height / 2),
                speed * (keyLeft ? -1 : keyRight ? 1 : 0),
                playerSegment.p2.world.y - playerSegment.p1.world.y);
        }
    }

    if (crashToObstacle) {
        crashShake(timeSinceCrash, speed / speedCap);
    }

    postShake();

    Render.polygon(ctx, 0, window.height, 0, window.height-50, window.width, window.height-50, window.width, window.height, '#000000');

    if (!playing && !finished && !wrecked) {
        Render.countdown(ctx, countDown);
    }
    else if (finished) {
        Render.finished(ctx);
    }
    else if (wrecked) {
        Render.wrecked(ctx);
    }
    else {
        Render.data(ctx, place);
    }
}

function preShake(speedPercent) {
    var shake = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1,1]) * 3;
    ctx.save();
    var dx = Math.random()*shake;
    var dy = Math.random()*shake;
    ctx.translate(dx, dy); 
}

function postShake() {
    ctx.restore();
}

function crashShake(timeSinceCrash) {
    if (!finished) {
        var ratio = timeSinceCrash/crashTimer;
        ctx.globalAlpha = 1 - ratio;
        ctx.fillStyle = 'rgb(100,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

function findSegment(z) {
    return segments[Math.floor(z / segmentLength) % segments.length];
}
