
const ROAD = {
    LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
    HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
    CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
}

function lastY () { return (segments.length == 0) ? 0 : segments[segments.length - 1].p2.world.y; }

function addSegment (curve, y) {
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
}

function addSprite (n, sprite, offset) {
    segments[n].sprites.push({ source: sprite, offset: offset });
}

function addRoad (enter, hold, leave, curve, y) {
    var startY = lastY();
    var endY = startY + (Util.toInt(y, 0) * segmentLength);
    var n, total = enter + hold + leave;
    for (n = 0; n < enter; n++)
        addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    for (n = 0; n < hold; n++)
        addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
    for (n = 0; n < leave; n++)
        addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
}

function addStraight (num) {
    num = num || ROAD.LENGTH.MEDIUM;
    addRoad(num, num, num, 0, 0);
}

function addHill (num, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    height = height || ROAD.HILL.MEDIUM;
    addRoad(num, num, num, 0, height);
}

function addCurve (num, curve, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    curve = curve || ROAD.CURVE.MEDIUM;
    height = height || ROAD.HILL.NONE;
    addRoad(num, num, num, curve, height);
}
