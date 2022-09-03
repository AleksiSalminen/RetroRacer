//=========================================================================
// UPDATE THE GAME WORLD
//=========================================================================

function update(dt) {
    if (playing) {
        var n, car, carW, sprite, spriteW;
        var playerSegment = findSegment(position + playerZ);
        var playerW = 80 * SPRITES.SCALE;
        var speedPercent = speed / speedCap;
        var dx = dt * turning * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
        var startPosition = position;

        updateCars(dt, playerSegment, playerW);

        position = Util.increase(position, dt * speed, trackLength);

        if (finished) {
            if (continueCountdown <= continueCount) {
                location.href = "./index.html";
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
                    speed = speedCap / 5;
                    position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength); // Crashes to an obstacle
                    if (!crashToObstacle) {
                        crashToObstacle = true;
                        timeSinceCrash = 0;
                        Game.playCrashSound();
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
                    speed = car.speed * (car.speed / speed);
                    position = Util.increase(car.z, -playerZ, trackLength); // Crashes to another vehicle
                    if (!crashToObstacle) {
                        crashToObstacle = true;
                        timeSinceCrash = 0;
                        Game.playCrashSound();
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
                if (lap > laps) {
                    finished = true;
                    hasControl = false;
                    finishedPlace = place;
                }
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

        updateEngineSound(speedPercent);

        updateHud('speed', 5 * Math.round(speed / 500) * 1.6);
        updateHud('current_lap_time', formatTime(currentLapTime));

    }
    else if (countDown <= startCount) {
        playing = true;
        hasControl = true;
    }
    else {
        countDown--;
    }
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

//-------------------------------------------------------------------------

function updateEngineSound(speedPercent) {
    engineSound1.playbackRate = 0.5;
    engineSound1.volume = speedPercent / 3;
    var buffer = 1;
    if (engineSound1.currentTime > engineSound1.duration - buffer) {
        engineSound1.currentTime = 0;
        engineSound1.play();
    }

    engineSound2.playbackRate = speedPercent * 5 + 2;
    var buffer = 0.2;
    if (engineSound2.currentTime > engineSound2.duration - buffer) {
        engineSound2.currentTime = 0;
        engineSound2.play();
    }

    engineSound3.playbackRate = speedPercent * 2 + 1;
    var buffer = 1;
    if (engineSound3.currentTime > engineSound3.duration - buffer) {
        engineSound3.currentTime = 0;
        engineSound3.play();
    }

    engineSound4.volume = speedPercent / 3;
    var buffer = 0.5;
    if (engineSound4.currentTime > engineSound4.duration - buffer) {
        engineSound4.currentTime = 0;
        engineSound4.play();
    }
}
