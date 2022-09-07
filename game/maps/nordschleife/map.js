
var map = {

    id: "nordschleife",

    name: "Nordschleife",

    lanes: 0,

    COLORS: {
        SKY:  '#72D7EE',
        TREE: '#005108',
        FOG:  '#505050',
        LIGHT:  { road: '#2f2f2f', grass: '#2f814e', rumble: 'white', lane: '#CCCCCC'  },
        DARK:   { road: '#2f2f2f', grass: '#276940', rumble: 'red'                   },
        START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
        FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
    },

    RACER_NAMES: [
        "Becky", "Tom", "Junnu", "Slim Mill", "Matti Meikäläinen"
    ],

    resetRoad: function () {
        segments = [];
        
        addRoad(50, 50, 50, 0, 100);
        addRoad(40, 40, 40, -20, 0);
        addRoad(70, 70, 70, 0, -20);
        addRoad(80, 80, 80, 3, -30);
        addRoad(40, 40, 40, 7, 5);
        addRoad(5, 5, 5, 0, 0);
        addRoad(50, 50, 50, -2, 3);
        addRoad(50, 50, 50, 0, -2);
        addRoad(15, 15, 15, -12, 0);
        addRoad(30, 30, 30, 16, 0);
        addRoad(50, 50, 50, 5, 3);
        addRoad(40, 40, 40, -10, 5);
        addRoad(20, 20, 20, 10, -10);
        addRoad(40, 40, 40, -10, 10);
        addRoad(70, 70, 70, 0, 50);
        addRoad(50, 50, 50, 10, 40);
        addRoad(50, 50, 50, -10, -50);
        addRoad(70, 70, 70, 0, -50);
        addRoad(70, 70, 70, 0, 50);

        this.resetSprites();
        resetCars();

        segments[findSegment(playerZ).index + 2].color = this.COLORS.START;
        segments[findSegment(playerZ).index + 3].color = this.COLORS.START;
        for (var n = 0; n < rumbleLength; n++)
            segments[segments.length - 1 - n].color = this.COLORS.FINISH;

        trackLength = segments.length * segmentLength;
    },

    resetSprites: function resetSprites() {
        

    }

};
