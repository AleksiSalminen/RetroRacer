
var map = {

    id: "nurburgring",

    name: "Nurburgring",

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

        addStraight(300);
        addHill(300, 300);
        addRoad(50, 50, 50, -6, -20);
        addRoad(200, 200, -25, 0, -100);

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
