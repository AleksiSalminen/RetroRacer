
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

    addLowRollingHills: function (num, height) {
        num = num || ROAD.LENGTH.SHORT;
        height = height || ROAD.HILL.LOW;
        addRoad(num, num, num, 0, height / 2);
        addRoad(num, num, num, 0, -height);
        addRoad(num, num, num, ROAD.CURVE.EASY, height);
        addRoad(num, num, num, 0, 0);
        addRoad(num, num, num, -ROAD.CURVE.EASY, height / 2);
        addRoad(num, num, num, 0, 0);
    },

    addSCurves: function () {
        addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE);
        addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
        addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW);
        addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM);
        addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
    },

    addBumps: function () {
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -2);
        addRoad(10, 10, 10, 0, -5);
        addRoad(10, 10, 10, 0, 8);
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -7);
        addRoad(10, 10, 10, 0, 5);
        addRoad(10, 10, 10, 0, -2);
    },

    addDownhillToEnd: function (num) {
        num = num || 200;
        addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY() / segmentLength);
    },

    resetRoad: function () {
        segments = [];

        addStraight(ROAD.LENGTH.SHORT);
        this.addLowRollingHills();
        this.addBumps();
        this.addBumps();
        this.addBumps();
        this.addSCurves();
        this.addDownhillToEnd();

        this.resetSprites();
        resetCars();

        segments[findSegment(playerZ).index + 2].color = this.COLORS.START;
        segments[findSegment(playerZ).index + 3].color = this.COLORS.START;
        for (var n = 0; n < rumbleLength; n++)
            segments[segments.length - 1 - n].color = this.COLORS.FINISH;

        trackLength = segments.length * segmentLength;
    },

    resetSprites: function resetSprites() {
        var n, i;

        addSprite(20, SPRITES.BILLBOARD07, -1);
        addSprite(40, SPRITES.BILLBOARD06, -1);
        addSprite(60, SPRITES.BILLBOARD08, -1);
        addSprite(80, SPRITES.BILLBOARD09, -1);
        addSprite(100, SPRITES.BILLBOARD01, -1);
        addSprite(120, SPRITES.BILLBOARD02, -1);
        addSprite(140, SPRITES.BILLBOARD03, -1);
        addSprite(160, SPRITES.BILLBOARD04, -1);
        addSprite(180, SPRITES.BILLBOARD05, -1);

        addSprite(240, SPRITES.BILLBOARD07, -1.2);
        addSprite(240, SPRITES.BILLBOARD06, 1.2);
        addSprite(segments.length - 25, SPRITES.BILLBOARD07, -1.2);
        addSprite(segments.length - 25, SPRITES.BILLBOARD06, 1.2);

        for (n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
            addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
            addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
        }

        for (n = 250; n < 1000; n += 5) {
            addSprite(n, SPRITES.COLUMN, 1.1);
            addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - (Math.random() * 2));
            addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - (Math.random() * 2));
        }

        for (n = 200; n < segments.length; n += 3) {
            addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1, -1]) * (2 + Math.random() * 5));
        }

        var side, sprite, offset;
        for (n = 1000; n < (segments.length - 50); n += 100) {
            side = Util.randomChoice([1, -1]);
            addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
            for (i = 0; i < 20; i++) {
                sprite = Util.randomChoice(SPRITES.PLANTS);
                offset = side * (1.5 + Math.random());
                addSprite(n + Util.randomInt(0, 50), sprite, offset);
            }

        }

    }

});
