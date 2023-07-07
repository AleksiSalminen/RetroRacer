//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================

function update(dt) {
    if (paused) {
        // Skip everything
    }
    else if (playing) {
        var n, car, carW, sprite, spriteW;
        var playerSegment = findSegment(position + playerZ);
        var playerW = 80 * SPRITES.SCALE;
        var speedPercent = speed / speedCap;
        var dx = dt * turning * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
        var startPosition = position;

        updateCars(dt, playerSegment, playerW);

        position = Util.increase(position, dt * speed, trackLength);

        if (finished || wrecked) {
            if (continueCountdown <= continueCount) {
                location.href = "../free_play/free_play.html";
            }
            else {
                continueCountdown--;
            }
        }

        if (!place) {
            place = cars.length + 1;
        }

        if (crashToObstacle && timeSinceCrash < crashTimer) {
            timeSinceCrash++;
        }
        else if (crashToObstacle && timeSinceCrash >= crashTimer) {
            crashToObstacle = false;
            timeSinceCrash = 0;
        }

        if (hasControl) {
            if (captureActions) {
                updateCapture();
            }

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
        }
        else {
            speed = Util.accelerate(speed, breaking, dt);
        }
        

        if ((playerX < -1) || (playerX > 1)) {

            if (speed > offRoadLimit)
                speed = Util.accelerate(speed, offRoadDecel, dt);

            for (n = 0; n < playerSegment.sprites.length; n++) {
                sprite = playerSegment.sprites[n];
                spriteW = sprite.source.w * SPRITES.SCALE;
                if (Util.overlap(playerX, playerW, sprite.offset + spriteW / 2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
                    var oldSpeed = speed;
                    speed = speedCap / 5;
                    position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // Crashes to an obstacle
                    if (!crashToObstacle) {
                        crashToObstacle = true;
                        timeSinceCrash = 0;
                        Game.playCrashSound();
                        durability -= Math.floor(oldSpeed/maxSpeed*20);
                        if (durability <= 0) {
                            wrecked = true;
                            hasControl = false;
                            finishedPlace = cars.length+1;
                        }
                    }
                    break;
                }
            }
        }

        for (n = 0; n < playerSegment.cars.length; n++) {
            car = playerSegment.cars[n];
            carW = car.sprite.w * SPRITES.SCALE;
            if (speed > car.speed) {
                if (place === car.place + 1) {
                    place -= 1;
                    car.place += 1;
                }
                if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
                    var oldSpeed = speed;
                    speed = car.speed * (car.speed / speed);
                    position = Util.increase(car.z, -playerZ, trackLength); // Crashes to another vehicle
                    if (!crashToObstacle) {
                        crashToObstacle = true;
                        timeSinceCrash = 0;
                        Game.playCrashSound();
                        durability -= Math.floor(oldSpeed / car.speed * 5);
                        if (durability <= 0) {
                            wrecked = true;
                            hasControl = false;
                            finishedPlace = cars.length+1;
                        }
                    }
                    break;
                }
            }
            else if (speed <= car.speed && place === car.place - 1) {
                place += 1;
                car.place -= 1;
            }
        }

        playerX = Util.limit(playerX, -3, 3);     // dont ever let it go too far out of bounds
        speed = Util.limit(speed, 0, maxSpeed); // or exceed maxSpeed

        skyOffset = Util.increase(skyOffset, skySpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);
        hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);
        treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position - startPosition) / segmentLength, 1);

        if (position > playerZ) {
            if (currentLapTime && (startPosition < playerZ)) {
                lap++;
                if (laps > 0 && lap > laps) {
                    finished = true;
                    hasControl = false;
                    finishedPlace = place;
                    if (captureActions) {
                        finishCapture();
                        uploadCapture();
                    }
                }
                lastLapTime = currentLapTime;
                currentLapTime = 0;
                if (fastLapTime === 0 || lastLapTime <= fastLapTime) {
                    fastLapTime = lastLapTime;
                }
            }
            else {
                currentLapTime += dt;
            }
        }

        updateEngineSound(speedPercent);
    }
    else if (countDown <= startCount) {
        playing = true;
        hasControl = true;
        initSmoke(ctx, SPRITES.SMOKE);
    }
    else {
        countDown--;
    }
}

//-------------------------------------------------------------------------

function updateCars(dt, playerSegment, playerW) {
    var n, car, oldSegment, newSegment, oldZ;
    for (n = 0; n < cars.length; n++) {
        car = cars[n];
        oldSegment = findSegment(car.z);
        car.offset = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
        oldZ = car.z;
        car.z = Util.increase(car.z, dt * car.speed, trackLength);
        if (oldZ > car.z) {
            car.lap++;
            if (laps > 0 && car.lap > laps) {
                car.finished = true;
            }
        }
        car.percent = Util.percentRemaining(car.z, segmentLength); // useful for interpolation during rendering phase
        newSegment = findSegment(car.z);
        for (let i = 0; i < oldSegment.cars.length; i++) {
            let otherCar = oldSegment.cars[i];
            if (car.speed > otherCar.speed && car.place === otherCar.place + 1) {
                car.place -= 1;
                otherCar.place += 1;
            }
            else if (car.speed <= otherCar.speed && car.place === otherCar.place - 1) {
                car.place += 1;
                otherCar.place -= 1;
            }
        }
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

function resetCars() {
    cars = [];
    var calcs = [];
    var n, car, segment, offset, z, sprite, speed, calc, name, rand;
    for (var n = 0; n < totalCars; n++) {
        offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
        // Make every car start at the startline (that's why 0)
        z = Math.floor(0 * segments.length) * segmentLength;
        sprite = Util.randomChoice(SPRITES.CARS);
        calc = Math.random() * (oCarSpeedTop-oCarSpeedLow) + oCarSpeedLow;
        calc = Math.round(calc * 10000) / 10000;
        // Make sure every car is given different speed
        while (calcs.includes(calc)) {
            calc = Math.random() * (oCarSpeedTop-oCarSpeedLow) + oCarSpeedLow;
            calc = Math.round(calc * 10000) / 10000;
        }
        calcs.push(calc);
        speed = speedCap * (calc/100);
        // Get random name from list
        rand = Math.floor(Math.random() * map.RACER_NAMES.length);
        name = map.RACER_NAMES[rand];
        car = { offset: offset, z: z, sprite: sprite, speed: speed, name: name, lap: 1, finished: false };
        segment = findSegment(car.z);
        segment.cars.push(car);
        cars.push(car);
    }
    cars.sort((a,b) => (a.speed > b.speed) ? -1 : ((b.speed > a.speed) ? 1 : 0))
    let i = 1;
    cars.forEach(function (car) {
        car.place = i; i++;
    });
}

//-------------------------------------------------------------------------

function updateHud(key, value) {
    if (hud[key].value !== value) {
        hud[key].value = value;
        Dom.set(hud[key].dom, value);
    }
}

function formatTime(dt) {
    var minutes = Math.floor(dt / 60);
    var seconds = Math.floor(dt - (minutes * 60));
    var tenths = Math.floor(10 * (dt - Math.floor(dt)));
    return (minutes < 10 ? "0" : "") + minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
}

//-------------------------------------------------------------------------

function updateEngineSound(speedPercent) {
    engineSound1.volume = speedPercent / 3;
    var buffer = 1;
    if (engineSound1.currentTime > engineSound1.duration - buffer) {
        engineSound1.currentTime = 0;
        engineSound1.play();
    }
    engineSound1.volume *= volume/100;

    engineSound2.playbackRate = speedPercent * 5 + 2;
    var buffer = 0.2;
    if (engineSound2.currentTime > engineSound2.duration - buffer) {
        engineSound2.currentTime = 0;
        engineSound2.play();
    }
    engineSound2.volume *= volume/100;

    engineSound3.playbackRate = speedPercent * 2 + 1;
    var buffer = 1;
    if (engineSound3.currentTime > engineSound3.duration - buffer) {
        engineSound3.currentTime = 0;
        engineSound3.play();
    }
    engineSound3.volume *= volume/100;

    engineSound4.volume = speedPercent / 3;
    var buffer = 0.5;
    if (engineSound4.currentTime > engineSound4.duration - buffer) {
        engineSound4.currentTime = 0;
        engineSound4.play();
    }
    engineSound4.volume *= volume/100;
}

function muteSound() {
    Dom.get("volume").value = 0;
    volume = 0;
    updateSound();
}

function updateSound() {
    music.volume = 1.0 * volume/100
    updateEngineSound(speed/maxSpeed);
}