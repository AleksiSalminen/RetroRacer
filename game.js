
var fps = 60;                      // how many 'update' frames per second
var step = 0.4 / fps;                   // how long is each frame (in seconds)
var width = 1024;                    // logical canvas width
var height = 768;                     // logical canvas height
var centrifugal = 0.5;                     // centrifugal force multiplier when going around curves
var offRoadDecel = 0.99;                    // speed multiplier when off road (e.g. you lose 2% speed each update frame)
var skySpeed = 0.0001;                   // background sky layer scroll speed when going around curve (or up hill)
var hillSpeed = 0.0002;                   // background hill layer scroll speed when going around curve (or up hill)
var treeSpeed = 0.0003;                   // background tree layer scroll speed when going around curve (or up hill)
var skyOffset = 0;                       // current sky scroll offset
var hillOffset = 0;                       // current hill scroll offset
var treeOffset = 0;                       // current tree scroll offset
var segments = [];                      // array of road segments
var cars = [];                      // array of cars on the road
var canvas = Dom.get('canvas');       // our canvas...
var ctx = canvas.getContext('2d'); // ...and its drawing context
var background = null;                    // our background image (loaded below)
var sprites = null;                    // our spritesheet (loaded below)
var resolution = null;                    // scaling factor to provide resolution independence (computed)
var roadWidth = 3000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
var segmentLength = 200;                     // length of a single segment
var rumbleLength = 3;                       // number of segments per red/white rumble strip
var trackLength = null;                    // z length of entire track (computed)
var lanes = 0;                       // number of lanes
for (let i = 0;i < maps.length;i++) {
    if (maps[i].id === map) {
        lanes = maps[i].lanes;
    }
}
var fieldOfView = 140;                     // angle (degrees) for field of view
var cameraHeight = 550;                    // z height of camera
var cameraDepth = null;                    // z distance camera is from screen (computed)
var drawDistance = 300;                     // number of segments to draw
var playerX = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
var playerZ = null;                    // player relative z distance from camera (computed)
var fogDensity = 5;                       // exponential fog density
var position = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
var speed = 0;                       // current speed
var speedCap = segmentLength / step;      // speed cap (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
var maxSpeed = speedCap * 0.95;              // max speed of the car
var accel = 3999;             // acceleration rate - tuned until it 'felt' right
var breaking = -maxSpeed;               // deceleration rate when braking
var turning = 2;
var decel = 0;             // 'natural' deceleration rate when neither accelerating, nor braking
var offRoadDecel = -maxSpeed / 2;             // off road deceleration is somewhere in between
var offRoadLimit = maxSpeed / 4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
var totalCars = 200;                     // total number of cars on the road
var currentLapTime = 0;                       // current lap time
var lastLapTime = null;                    // last lap time

var keyLeft = false;
var keyRight = false;
var keyFaster = false;
var keySlower = false;

var hud = {
    speed: { value: null, dom: Dom.get('speed_value') },
    current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
    last_lap_time: { value: null, dom: Dom.get('last_lap_time_value') },
    fast_lap_time: { value: null, dom: Dom.get('fast_lap_time_value') }
}

//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================

function update(dt) {

    var n, car, carW, sprite, spriteW;
    var playerSegment = findSegment(position + playerZ);
    var playerW = 80 * SPRITES.SCALE;
    var speedPercent = speed / speedCap;
    var dx = dt * turning * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
    var startPosition = position;

    updateCars(dt, playerSegment, playerW);

    position = Util.increase(position, dt * speed, trackLength);

    if (keyLeft)
        playerX = playerX - dx;
    else if (keyRight)
        playerX = playerX + dx;

    playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

    if (keyFaster)
        speed = Util.accelerate(speed, accel, dt);
    else if (keySlower)
        speed = Util.accelerate(speed, breaking, dt);
    else
        speed = Util.accelerate(speed, decel, dt);


    if ((playerX < -1) || (playerX > 1)) {

        if (speed > offRoadLimit)
            speed = Util.accelerate(speed, offRoadDecel, dt);

        for (n = 0; n < playerSegment.sprites.length; n++) {
            sprite = playerSegment.sprites[n];
            spriteW = sprite.source.w * SPRITES.SCALE;
            if (Util.overlap(playerX, playerW, sprite.offset + spriteW / 2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
                speed = speedCap / 5;
                position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // stop in front of sprite (at front of segment)
                break;
            }
        }
    }

    for (n = 0; n < playerSegment.cars.length; n++) {
        car = playerSegment.cars[n];
        carW = car.sprite.w * SPRITES.SCALE;
        if (speed > car.speed) {
            if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
                speed = car.speed * (car.speed / speed);
                position = Util.increase(car.z, -playerZ, trackLength);
                break;
            }
        }
    }

    playerX = Util.limit(playerX, -3, 3);     // dont ever let it go too far out of bounds
    speed = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

    skyOffset = Util.increase(skyOffset, skySpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);
    hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);
    treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);

    if (position > playerZ) {
        if (currentLapTime && (startPosition < playerZ)) {
            lastLapTime = currentLapTime;
            currentLapTime = 0;
            if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
                Dom.storage.fast_lap_time = lastLapTime;
                updateHud('fast_lap_time', formatTime(lastLapTime));
                Dom.addClassName('fast_lap_time', 'fastest');
                Dom.addClassName('last_lap_time', 'fastest');
            }
            else {
                Dom.removeClassName('fast_lap_time', 'fastest');
                Dom.removeClassName('last_lap_time', 'fastest');
            }
            updateHud('last_lap_time', formatTime(lastLapTime));
            Dom.show('last_lap_time');
        }
        else {
            currentLapTime += dt;
        }
    }

    updateHud('speed', 5 * Math.round(speed / 500));
    updateHud('current_lap_time', formatTime(currentLapTime));
}

//-------------------------------------------------------------------------

function updateCars(dt, playerSegment, playerW) {
    var n, car, oldSegment, newSegment;
    for (n = 0; n < cars.length; n++) {
        car = cars[n];
        oldSegment = findSegment(car.z);
        car.offset = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
        car.z = Util.increase(car.z, dt * car.speed, trackLength);
        car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
        newSegment = findSegment(car.z);
        if (oldSegment != newSegment) {
            index = oldSegment.cars.indexOf(car);
            oldSegment.cars.splice(index, 1);
            newSegment.cars.push(car);
        }
    }
}

function updateCarOffset(car, carSegment, playerSegment, playerW) {

    var i, j, dir, segment, otherCar, otherCarW, lookahead = 20, carW = car.sprite.w * SPRITES.SCALE;

    // optimization, dont bother steering around other cars when 'out of sight' of the player
    if ((carSegment.index - playerSegment.index) > drawDistance)
        return 0;

    for (i = 1; i < lookahead; i++) {
        segment = segments[(carSegment.index + i) % segments.length];

        if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
            if (playerX > 0.5)
                dir = -1;
            else if (playerX < -0.5)
                dir = 1;
            else
                dir = (car.offset > playerX) ? 1 : -1;
            return dir * 1 / i * (car.speed - speed) / speedCap; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
        }

        for (j = 0; j < segment.cars.length; j++) {
            otherCar = segment.cars[j];
            otherCarW = otherCar.sprite.w * SPRITES.SCALE;
            if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
                if (otherCar.offset > 0.5)
                    dir = -1;
                else if (otherCar.offset < -0.5)
                    dir = 1;
                else
                    dir = (car.offset > otherCar.offset) ? 1 : -1;
                return dir * 1 / i * (car.speed - otherCar.speed) / speedCap;
            }
        }
    }

    // if no cars ahead, but I have somehow ended up off road, then steer back on
    if (car.offset < -0.9)
        return 0.1;
    else if (car.offset > 0.9)
        return -0.1;
    else
        return 0;
}

//-------------------------------------------------------------------------

function updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
    if (hud[key].value !== value) {
        hud[key].value = value;
        Dom.set(hud[key].dom, value);
    }
}

function formatTime(dt) {
    var minutes = Math.floor(dt / 60);
    var seconds = Math.floor(dt - (minutes * 60));
    var tenths = Math.floor(10 * (dt - Math.floor(dt)));
    if (minutes > 0)
        return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
    else
        return seconds + "." + tenths;
}

//=========================================================================
// RENDER THE GAME WORLD
//=========================================================================

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

    postShake();

    Render.polygon(ctx, 0, window.height, 0, window.height-50, window.width, window.height-50, window.width, window.height, '#000000');
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

function findSegment(z) {
    return segments[Math.floor(z / segmentLength) % segments.length];
}

//=========================================================================
// THE GAME LOOP
//=========================================================================

Game.run({
    canvas: canvas, render: render, update: update, step: step,
    images: ["../maps/"+map+"/background", "../maps/"+map+"/sprites"],
    keys: [
        { keys: [KEY.LEFT, KEY.A], mode: 'down', action: function () { keyLeft = true; } },
        { keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function () { keyRight = true; } },
        { keys: [KEY.UP, KEY.W], mode: 'down', action: function () { keyFaster = true; } },
        { keys: [KEY.DOWN, KEY.S], mode: 'down', action: function () { keySlower = true; } },
        { keys: [KEY.LEFT, KEY.A], mode: 'up', action: function () { keyLeft = false; } },
        { keys: [KEY.RIGHT, KEY.D], mode: 'up', action: function () { keyRight = false; } },
        { keys: [KEY.UP, KEY.W], mode: 'up', action: function () { keyFaster = false; } },
        { keys: [KEY.DOWN, KEY.S], mode: 'up', action: function () { keySlower = false; } }
    ],
    ready: function (images) {
        background = images[0];
        sprites = images[1];
        reset();
        Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
        updateHud('fast_lap_time', formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
    }
});

function reset(options) {
    options = options || {};
    canvas.width = width = Util.toInt(options.width, width);
    canvas.height = height = Util.toInt(options.height, height);
    lanes = Util.toInt(options.lanes, lanes);
    roadWidth = Util.toInt(options.roadWidth, roadWidth);
    cameraHeight = Util.toInt(options.cameraHeight, cameraHeight);
    drawDistance = Util.toInt(options.drawDistance, drawDistance);
    fogDensity = Util.toInt(options.fogDensity, fogDensity);
    fieldOfView = Util.toInt(options.fieldOfView, fieldOfView);
    segmentLength = Util.toInt(options.segmentLength, segmentLength);
    rumbleLength = Util.toInt(options.rumbleLength, rumbleLength);
    cameraDepth = 1 / Math.tan((fieldOfView / 2) * Math.PI / 180);
    playerZ = (cameraHeight * cameraDepth);
    resolution = height / 480;

    if ((segments.length == 0) || (options.segmentLength) || (options.rumbleLength))
        for (let i = 0;i < maps.length;i++) {
            if (maps[i].id === map) {
                maps[i].resetRoad(); // only rebuild road when necessary
                i = maps.length;
            }
        }
}
