//=============================================================================
// RACING GAME VARIABLES
//=============================================================================

document.title = 'Retro Racing Game';

var searchParams = window.location.search.substring(1).split('&');
var map = searchParams[0].split('=')[1];

var KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
  A:     65,
  D:     68,
  S:     83,
  W:     87
};

var COLORS = {};
for (let i = 0;i < maps.length;i++) {
  if (maps[i].id === map) {
    COLORS = maps[i].COLORS;
  }
}

var BACKGROUND = {
  HILLS: { x:   5, y:   5, w: 1280, h: 480 },
  SKY:   { x:   5, y: 495, w: 1280, h: 480 },
  TREES: { x:   5, y: 985, w: 1280, h: 480 }
};

var SPRITES = {
  PALM_TREE:              { x:    5, y:    5, w:  215, h:  540 },
  BILLBOARD08:            { x:  230, y:    5, w:  385, h:  265 },
  TREE1:                  { x:  625, y:    5, w:  360, h:  360 },
  DEAD_TREE1:             { x:    5, y:  555, w:  135, h:  332 },
  BILLBOARD09:            { x:  150, y:  555, w:  328, h:  282 },
  BOULDER3:               { x:  230, y:  280, w:  320, h:  220 },
  COLUMN:                 { x:  995, y:    5, w:  200, h:  315 },
  BILLBOARD01:            { x:  625, y:  375, w:  300, h:  170 },
  BILLBOARD06:            { x:  488, y:  555, w:  298, h:  190 },
  BILLBOARD05:            { x:    5, y:  897, w:  298, h:  190 },
  BILLBOARD07:            { x:  313, y:  897, w:  298, h:  190 },
  BOULDER2:               { x:  621, y:  897, w:  298, h:  140 },
  TREE2:                  { x: 1205, y:    5, w:  282, h:  295 },
  BILLBOARD04:            { x: 1205, y:  310, w:  268, h:  170 },
  DEAD_TREE2:             { x: 1205, y:  490, w:  150, h:  260 },
  BOULDER1:               { x: 1205, y:  760, w:  168, h:  248 },
  BUSH1:                  { x:    5, y: 1097, w:  240, h:  155 },
  CACTUS:                 { x:  929, y:  897, w:  235, h:  118 },
  BUSH2:                  { x:  255, y: 1097, w:  232, h:  152 },
  BILLBOARD03:            { x:    5, y: 1262, w:  230, h:  220 },
  BILLBOARD02:            { x:  245, y: 1262, w:  215, h:  220 },
  STUMP:                  { x:  995, y:  330, w:  195, h:  140 },
  SEMI:                   { x: 1365, y:  490, w:  122, h:  144 },
  TRUCK:                  { x: 1365, y:  644, w:  100, h:   78 },
  CAR03:                  { x: 1383, y:  760, w:   88, h:   55 },
  CAR02:                  { x: 1383, y:  825, w:   80, h:   59 },
  CAR04:                  { x: 1383, y:  894, w:   80, h:   57 },
  CAR01:                  { x: 1205, y: 1018, w:   80, h:   56 },
  PLAYER_UPHILL_LEFT:     { x:  870, y: 1597, w:  624, h:  403 },
  PLAYER_UPHILL_STRAIGHT: { x:  868, y: 1084, w:  624, h:  403 },
  PLAYER_UPHILL_RIGHT:    { x:    0, y: 1597, w:  624, h:  403 },
  PLAYER_LEFT:            { x:  870, y: 1597, w:  624, h:  403 },
  PLAYER_STRAIGHT:        { x:  868, y: 1084, w:  624, h:  403 },
  PLAYER_RIGHT:           { x:    0, y: 1597, w:  624, h:  403 }
};

SPRITES.SCALE = 0.3 * (1/80) // the reference sprite width should be 1/3rd the (half-)roadWidth

SPRITES.BILLBOARDS = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
SPRITES.PLANTS     = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3];
SPRITES.CARS       = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK];

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