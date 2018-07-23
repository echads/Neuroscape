// Neuroscape_BPM_Module.js
//
// Created by Milad Nazeri and Liv Erikson on 2018-07-16
//
// Copyright 2018 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

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