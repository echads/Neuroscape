// DJ_Sensor_Zone_Client.js
//
// Created by Milad Nazeri on 2018-06-19
//
// Copyright 2018 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var getProps = Util.Entity.getProps,
        searchForChildren = Util.Entity.searchForChildren,
        vec = Util.Maths.vec;

    var BPM_Module = Script.require("./Neuroscape_BPM_Module.js?" + Date.now());
    var getMilisecondsPerBeat = BPM_Module.getMilisecondsPerBeat,
        getMetersPerSecondForBeat = BPM_Module.getMetersPerSecondForBeat;

    // Log Setup
    var LOG_CONFIG = {},
        LOG_ENTER = Util.Debug.LOG_ENTER,
        LOG_UPDATE = Util.Debug.LOG_UPDATE,
        LOG_ERROR = Util.Debug.LOG_ERROR,
        LOG_VALUE = Util.Debug.LOG_VALUE,
        LOG_ARCHIVE = Util.Debug.LOG_ARCHIVE;

    LOG_CONFIG[LOG_ENTER] = true;
    LOG_CONFIG[LOG_UPDATE] = true;
    LOG_CONFIG[LOG_ERROR] = true;
    LOG_CONFIG[LOG_VALUE] = true;
    LOG_CONFIG[LOG_ARCHIVE] = false;
    var log = Util.Debug.log(LOG_CONFIG);

    // Init 
    var BASE_NAME = "Neuroscape_",
        entityID,
        name = null,
        DEBUG = false,
        loadedChildren = false,
        gameRunning = false,
        gameInterval = null,
        lastplay = null,
        sound,
        currentBeat = 0,
        currentBPM = 120,
        COUNT_IN = 4,
        distance = 0,
        milisecondsPerBeat = 0,
        milisecondsPerMeter = 0,
        metersPerSecond = 0,
        HIT_TIME = 100,
        SEARCH_FOR_CHILDREN_TIMEOUT = 5000,
        SOUND_URL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/bell.wav?3",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        ORB = "Neuroscape_Orb",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        START_BUTTON = "Neuroscape_StartButton",
        ORB_ID = "orb",
        PLAYER_ID = "player",
        self;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        childrenIDS = {
            Neuroscape_Boundary_Left: null,
            Neuroscape_Boundary_Right: null,
            Neuroscape_Orb: null,
            Neuroscape_StartButton: null,
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null
        },
        differenceVector = {},
        directionOne = {},
        directionTwo = {},        
        gameType = {
            NORMAL: 0,
            SYNCOPATED: 1,
            CONTINUOUS: 2
        },
        boundaryLeftProps = {},
        boundaryRightProps = {},
        position = {},
        collisionRecords = [],
        childrenNames = Object.keys(childrenIDS);

    // Constructor Functions
    function CollisionRecord (id, duringBeat, collisionTime, collider) {
        this.id = id;
        this.duringBeat = duringBeat;
        this.collisionTime = collisionTime;
        this.colllider = collider;
    };

    // Procedural Functions

    // Entity Definition
    function Neuroscape_Gamezone_Server() {
        self = this;
    }

    Neuroscape_Gamezone_Server.prototype = {
        remotelyCallable: [
            "toggleGame"
        ],
        calculateBPMAndDistance: function(position1, position2) {
            function roundPos(position) {
                var roundObj = {};
                roundObj.x = +position.x.toFixed(2);
                roundObj.y = +position.y.toFixed(2);
                roundObj.z = +position.z.toFixed(2);
                return roundObj;
            }
            position1 = roundPos(position1);
            position2 = roundPos(position2);
            log(LOG_VALUE, "position1", position1);
            log(LOG_VALUE, "position2", position2);
            milisecondsPerBeat = getMilisecondsPerBeat(currentBPM);
            log(LOG_VALUE, "milisecondsPerBeat", milisecondsPerBeat);
            distance = +Vec3.distance(position2, position1).toFixed(2);
            log(LOG_VALUE, "distance", distance);
            milisecondsPerMeter = distance / milisecondsPerBeat;
            log(LOG_VALUE, "milisecondsPerMeter", milisecondsPerMeter);
            metersPerSecond = +Math.sqrt(milisecondsPerMeter * 1000).toFixed(2);
            log(LOG_VALUE, "metersPerSecond", metersPerSecond);
            differenceVector = Vec3.subtract(position2, position1);
            log(LOG_VALUE, "differenceVector", differenceVector);
            directionOne = Vec3.multiply(metersPerSecond, differenceVector);
            log(LOG_VALUE, "directionOne", directionOne);
            directionTwo = Vec3.multiply(-metersPerSecond, differenceVector);
            log(LOG_VALUE, "directionTwo", directionTwo);
        },
        getID: function(id) {
            if (id === childrenIDS[ORB]) {
                return ORB_ID;
            }
            if (id === (childrenIDS[BOUNDARY_LEFT] || childrenIDS[BOUNDARY_RIGHT])) {
                return PLAYER_ID;
            }
        },
        incrementBeat: function() {
            currentBeat++;
        },
        onBeat: function() {
            var stringDirection = "",
                stringStartPosition = "",
                boundary;

            if (currentBeat % 2 === 0) {
                stringDirection = JSON.stringify(directionOne);
                stringStartPosition = JSON.stringify(boundaryLeftProps.position);
                log(LOG_ARCHIVE, "stringStartPosition", stringStartPosition);
                boundary = BOUNDARY_LEFT;
            } else {
                stringDirection = JSON.stringify(directionTwo);
                stringStartPosition = JSON.stringify(boundaryRightProps.position);
                log(LOG_ARCHIVE, "stringStartPosition", stringStartPosition);
                boundary = BOUNDARY_RIGHT;
            }
            Audio.playSound(sound, {
                position: JSON.parse(stringStartPosition),
                volume: 0.5
            });
            Entities.callEntityMethod(childrenIDS[boundary], "hitColor");
            Script.setTimeout(function() {
                Entities.callEntityMethod(childrenIDS[boundary], "restColor");
            }, HIT_TIME);
            Entities.callEntityMethod(childrenIDS[ORB], "setOrbPositionTo", [stringStartPosition]);
            // self.playSound(stringStartPosition);
            Entities.callEntityMethod(childrenIDS[ORB], "moveOrb", [stringDirection]);
            self.incrementBeat();
        },
        preload: function (id) {
            entityID = id;
            log(LOG_VALUE, "SOUND_URL", SOUND_URL);
            sound = SoundCache.getSound(SOUND_URL);
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            position = currentProperties.position;

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties.BASE_NAME.DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }

            searchForChildren(entityID, childrenNames, function(children) {
                loadedChildren = true;
                Object.keys(children).forEach(function(name) {
                    childrenIDS[name] = children[name];
                });
                log(LOG_ENTER, "FOUND ALL CHILDREN");
                boundaryLeftProps = getProps(childrenIDS[BOUNDARY_LEFT]);
                boundaryRightProps = getProps(childrenIDS[BOUNDARY_RIGHT]);
            }, SEARCH_FOR_CHILDREN_TIMEOUT);
        },
        playSound: function(position) {
            if (typeof position === "string") {
                position = JSON.parse(position);
            }
            log(LOG_VALUE, "Now - lastplay", Date.now() - lastplay);
            lastplay = Date.now(),
            Audio.playSound(sound, {
                position: position,
                volume: 0.5
            });
        },
        recordCollision: function(id, param) {
            // #TODO
        },
        reset: function() {
            currentBeat = 0;
        },
        startGame: function() {
            log(LOG_ENTER, "STARTING GAME");
            var stringStartPosition = "";

            if (!loadedChildren) {
                log(LOG_ERROR, "CHILDREN AREN'T LOADED");
                return;
            }

            this.reset();
            gameRunning = true;
            stringStartPosition = JSON.stringify(boundaryLeftProps.position);
            this.calculateBPMAndDistance(boundaryLeftProps.position, boundaryRightProps.position);
            Entities.callEntityMethod(childrenIDS[START_BUTTON], "changeColor", ["red"]);
            Entities.callEntityMethod(childrenIDS[ORB], "setOrbPositionTo", [stringStartPosition]);
            gameInterval = Script.setInterval(this.onBeat, milisecondsPerBeat);
        },
        stopGame: function() {
            log(LOG_ENTER, "STOPPING GAME");
            gameRunning = false;            
            Entities.callEntityMethod(childrenIDS[START_BUTTON], "changeColor", ["green"]);
            Entities.callEntityMethod(childrenIDS[ORB], "reset");
            Script.clearInterval(gameInterval);
            gameInterval = null;
        },
        setBPM: function(newBPM) {
            currentBPM = newBPM;
        },
        toggleGame: function(id, param) {
            log(LOG_ENTER, "TOGGLEGAME CALLED");
            if (!gameRunning) {
                this.startGame();
            } else {
                this.stopGame();
            }
        },
        unload: function () {
            if (gameInterval) {
                Script.clearInterval(gameInterval);
            }
        }
    };

    return new Neuroscape_Gamezone_Server();
});
