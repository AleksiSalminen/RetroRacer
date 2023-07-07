
const capture = {
    latest: {
        id: 1,
        rounds: 0,
        keyLeft: false, keyRight: false, 
        keyFaster: false, keySlower: false
    },
    rounds: []
};

const playBacks = [];

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
}

function updateCapture() {
    if (hasActionChanged()) {
        capture.rounds.push(capture.latest);
        capture.latest = {
            id: capture.rounds.length+1,
            rounds: 0,
            keyLeft: keyLeft, keyRight: keyRight, 
            keyFaster: keyFaster, keySlower: keySlower
        };
    }
    else {
        capture.latest.rounds = capture.latest.rounds+1;
    }
}

// Playback

function startPlayBack(capture) {
    capture.frame = 0;
    playBacks.push(capture);
}

function updatePlayBacks() {
    playBacks.forEach((playBack) => {
        playBack.frame++;
    });
}

function getCurrentPBFrame(id) {
    playBacks.forEach((playBack) => {
        if (playBack.id === id) {
            return playBack.rounds[id-1];
        }
    });
    return null;
}
