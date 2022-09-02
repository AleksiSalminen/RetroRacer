
maps.push({

    id: "city",

    lanes: 4,

    COLORS: {
        SKY:  '#72D7EE',
        TREE: '#005108',
        FOG:  '#505050',
        LIGHT:  { road: '#2f2f2f', grass: '#413021', rumble: '#555555', lane: '#CCCCCC'  },
        DARK:   { road: '#2f2f2f', grass: '#372040', rumble: '#BBBBBB'                   },
        START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
        FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
    },

    lastY: function () { return (segments.length == 0) ? 0 : segments[segments.length - 1].p2.world.y; },

    addSegment: function (curve, y) {
        var n = segments.length;
        segments.push({
            index: n,
            p1: { world: { y: this.lastY(), z: n * segmentLength }, camera: {}, screen: {} },
            p2: { world: { y: y, z: (n + 1) * segmentLength }, camera: {}, screen: {} },
            curve: curve,
            sprites: [],
            cars: [],
            color: Math.floor(n / rumbleLength) % 2 ? this.COLORS.DARK : this.COLORS.LIGHT
        });
    },

    addSprite: function (n, sprite, offset) {
        segments[n].sprites.push({ source: sprite, offset: offset });
    },

    addRoad: function (enter, hold, leave, curve, y) {
        var startY = this.lastY();
        var endY = startY + (Util.toInt(y, 0) * segmentLength);
        var n, total = enter + hold + leave;
        for (n = 0; n < enter; n++)
            this.addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
        for (n = 0; n < hold; n++)
            this.addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
        for (n = 0; n < leave; n++)
            this.addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
    },

    ROAD: {
        LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
        HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
        CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
    },

    addStraight: function (num) {
        num = num || this.ROAD.LENGTH.MEDIUM;
        this.addRoad(num, num, num, 0, 0);
    },

    addHill: function (num, height) {
        num = num || this.ROAD.LENGTH.MEDIUM;
        height = height || this.ROAD.HILL.MEDIUM;
        this.addRoad(num, num, num, 0, height);
    },

    addCurve: function (num, curve, height) {
        num = num || this.ROAD.LENGTH.MEDIUM;
        curve = curve || this.ROAD.CURVE.MEDIUM;
        height = height || this.ROAD.HILL.NONE;
        this.addRoad(num, num, num, curve, height);
    },

    addLowRollingHills: function (num, height) {
        num = num || this.ROAD.LENGTH.SHORT;
        height = height || this.ROAD.HILL.LOW;
        this.addRoad(num, num, num, 0, height / 2);
        this.addRoad(num, num, num, 0, -height);
        this.addRoad(num, num, num, this.ROAD.CURVE.EASY, height);
        this.addRoad(num, num, num, 0, 0);
        this.addRoad(num, num, num, -this.ROAD.CURVE.EASY, height / 2);
        this.addRoad(num, num, num, 0, 0);
    },

    addSCurves: function () {
        this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.EASY, this.ROAD.HILL.NONE);
        this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.MEDIUM, this.ROAD.HILL.MEDIUM);
        this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.EASY, -this.ROAD.HILL.LOW);
        this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.EASY, this.ROAD.HILL.MEDIUM);
        this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.MEDIUM, -this.ROAD.HILL.MEDIUM);
    },

    addBumps: function () {
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -2);
        this.addRoad(10, 10, 10, 0, -5);
        this.addRoad(10, 10, 10, 0, 8);
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -7);
        this.addRoad(10, 10, 10, 0, 5);
        this.addRoad(10, 10, 10, 0, -2);
    },

    addDownhillToEnd: function (num) {
        num = num || 200;
        this.addRoad(num, num, num, -this.ROAD.CURVE.EASY, -this.lastY() / segmentLength);
    },

    resetRoad: function () {
        segments = [];

        this.addStraight(this.ROAD.LENGTH.SHORT);
        this.addLowRollingHills();
        this.addBumps();
        this.addBumps();
        this.addBumps();
        this.addSCurves();
        this.addDownhillToEnd();

        this.resetSprites();
        this.resetCars();

        segments[findSegment(playerZ).index + 2].color = this.COLORS.START;
        segments[findSegment(playerZ).index + 3].color = this.COLORS.START;
        for (var n = 0; n < rumbleLength; n++)
            segments[segments.length - 1 - n].color = this.COLORS.FINISH;

        trackLength = segments.length * segmentLength;
    },

    resetSprites: function resetSprites() {
        var n, i;

        this.addSprite(20, SPRITES.BILLBOARD07, -1);
        this.addSprite(40, SPRITES.BILLBOARD06, -1);
        this.addSprite(60, SPRITES.BILLBOARD08, -1);
        this.addSprite(80, SPRITES.BILLBOARD09, -1);
        this.addSprite(100, SPRITES.BILLBOARD01, -1);
        this.addSprite(120, SPRITES.BILLBOARD02, -1);
        this.addSprite(140, SPRITES.BILLBOARD03, -1);
        this.addSprite(160, SPRITES.BILLBOARD04, -1);
        this.addSprite(180, SPRITES.BILLBOARD05, -1);

        this.addSprite(240, SPRITES.BILLBOARD07, -1.2);
        this.addSprite(240, SPRITES.BILLBOARD06, 1.2);
        this.addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2);
        this.addSprite(segments.length - 25, SPRITES.BILLBOARD06, 1.2);

        for (n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
            this.addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
            this.addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
        }

        for (n = 250; n < 1000; n += 5) {
            this.addSprite(n, SPRITES.COLUMN, 1.1);
            this.addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - (Math.random() * 2));
            this.addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - (Math.random() * 2));
        }

        for (n = 200; n < segments.length; n += 3) {
            this.addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1, -1]) * (2 + Math.random() * 5));
        }

        var side, sprite, offset;
        for (n = 1000; n < (segments.length - 50); n += 100) {
            side = Util.randomChoice([1, -1]);
            this.addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
            for (i = 0; i < 20; i++) {
                sprite = Util.randomChoice(SPRITES.PLANTS);
                offset = side * (1.5 + Math.random());
                this.addSprite(n + Util.randomInt(0, 50), sprite, offset);
            }

        }

    },

    resetCars: function () {
        cars = [];
        totalCars = 30;
        var n, car, segment, offset, z, sprite, speed;
        for (var n = 0; n < totalCars; n++) {
            offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
            z = Math.floor(Math.random() * segments.length) * segmentLength;
            sprite = Util.randomChoice(SPRITES.CARS);
            speed = speedCap / 4 + Math.random() * speedCap / (sprite == SPRITES.SEMI ? 4 : 2);
            car = { offset: offset, z: z, sprite: sprite, speed: speed };
            segment = findSegment(car.z);
            segment.cars.push(car);
            cars.push(car);
        }
    }

});
