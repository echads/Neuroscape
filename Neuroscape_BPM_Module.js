var MILISECONDS_PER_SECOND = 1000;
var SECONDS_IN_MIN = 60;
var MILISECONDS_PER_MINUTE = SECONDS_IN_MIN * MILISECONDS_PER_SECOND;

function getMilisecondsPerBeat(bpm) {
    return MILISECONDS_PER_MINUTE / bpm;
}

function getMetersPerSecondForBeat(bpm, distance) {
    return distance / getMetersPerSecondForBeat(bpm);
}

module.exports = {
    getMilisecondsPerBeat: getMilisecondsPerBeat,
    getMetersPerSecondForBeat: getMetersPerSecondForBeat
};