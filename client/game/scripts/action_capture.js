
const capture = {
    latest: {
        rounds: 0,
        keyLeft: false, keyRight: false, 
        keyFaster: false, keySlower: false
    },
    rounds: []
};

function hasActionChanged() {
    let leftChanged = capture.latest.keyLeft !== keyLeft;
    let rightChanged = capture.latest.keyRight !== keyRight;
    let fasterChanged = capture.latest.keyFaster !== keyFaster;
    let slowerChanged = capture.latest.keySlower !== keySlower;
    return leftChanged || rightChanged || fasterChanged || slowerChanged;
}

function finishCapture() {
    capture.rounds.push(capture.latest);
    capture.map = map.name;
    capture.laps = laps;
    delete capture.latest;
    console.log(capture);
}

function updateCapture() {
    if (hasActionChanged()) {
        capture.rounds.push(capture.latest);
        capture.latest = {
            rounds: 0,
            keyLeft: keyLeft, keyRight: keyRight, 
            keyFaster: keyFaster, keySlower: keySlower
        };
    }
    else {
        capture.latest.rounds = capture.latest.rounds+1;
    }
}
