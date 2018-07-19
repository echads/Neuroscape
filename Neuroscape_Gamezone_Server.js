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
        gameTimer = null,
        lastplay = null,
        sound,
        currentBeat = 0,
        currentBPM = 100,
        currentDuration = 30000,
        audioCue = true,
        visualCue = true,
        COUNT_IN = 4,
        distance = 0,
        milisecondsPerBeat = 0,
        milisecondsPerMeter = 0,
        metersPerSecond = 0,
        HIT_TIME = 100,
        SEARCH_FOR_CHILDREN_TIMEOUT = 5000,
        activeClientID = "",
        SOUND_URL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/bell.wav?3",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        ORB = "Neuroscape_Orb",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        START_BUTTON = "Neuroscape_StartButton",
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
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
        orbProps = {},
        position = {},
        collisionRecords = [],
        orbInitPosition = {},
        orbStartPosition = {},
        orbEndPosition = {},
        currentBeatRecord = {},
        childrenNames = Object.keys(childrenIDS),
        collisionCollection = [];

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
            "toggleGame",
            "recordCollision",
            "incrementBeat"
        ],
        calculateBPMAndDistance: function(position1, position2) {
            log(LOG_VALUE, "position1", position1);
            log(LOG_VALUE, "position2", position2);
            milisecondsPerBeat = getMilisecondsPerBeat(currentBPM);
            log(LOG_VALUE, "milisecondsPerBeat", milisecondsPerBeat);
            distance = Vec3.distance(position2, position1);
            log(LOG_VALUE, "distance", distance);
            milisecondsPerMeter = Math.sqrt(distance) / milisecondsPerBeat;
            log(LOG_VALUE, "milisecondsPerMeter", milisecondsPerMeter);
            metersPerSecond = milisecondsPerMeter * 1000;
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
            var currentIndex = collisionCollection.length -1;
            var prevIndex = collisionCollection.length -2;
            if (currentBeat > 0) {
                var previousBeatRecord = collisionCollection[currentIndex];
                var previousOrbCollisionTime = previousBeatRecord[ORB].collisionTime;
                var currentOrbCollisionTime = currentBeatRecord[ORB].collisionTime;
                if (currentBeatRecord[STICK_LEFT]) {
                    var currentLStickCollisionTime = currentBeatRecord[STICK_LEFT].collisionTime;
                    currentBeatRecord[STICK_LEFT].latencyLastBeat = currentLStickCollisionTime - previousOrbCollisionTime;
                    currentBeatRecord[STICK_LEFT].latencyCurrentBeat = currentLStickCollisionTime - currentOrbCollisionTime;
                }
                if (currentBeatRecord[STICK_RIGHT]) {
                    var currentRStickCollisionTime = currentBeatRecord[STICK_RIGHT].collisionTime;
                    currentBeatRecord[STICK_RIGHT].latencyLastBeat = currentRStickCollisionTime - previousOrbCollisionTime;
                    currentBeatRecord[STICK_RIGHT].latencyCurrentBeat = currentRStickCollisionTime - currentOrbCollisionTime;
                }
                var beatDelta = currentOrbCollisionTime - previousOrbCollisionTime;
                currentBeatRecord[ORB].beatDelta = beatDelta;
            }
            collisionCollection.push(currentBeatRecord);
            currentBeat++;
            currentBeatRecord = {};
            var startIndex = collisionCollection.length -4 < 0 ? 0 : collisionCollection.length -4;
            var endIndex = collisionCollection.length - 1;
            var slicedBeatRecord = collisionCollection.slice(startIndex, endIndex);
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(slicedBeatRecord)]);
        },
        initComponents: function() {

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
            // Audio.playSound(sound, {
            //     position: JSON.parse(stringStartPosition),
            //     volume: 0.5
            // });
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
                orbProps = getProps(childrenIDS[ORB]);
                self.setOrbPositions();
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
            log(LOG_ARCHIVE, "IN RECORD COLLISION");
            var collisionObject = JSON.parse(param[0]);
            var collisionRecord = new CollisionRecord(
                collisionObject.id,
                currentBeat,
                collisionObject.time
            );
            currentBeatRecord[collisionObject.id] = collisionRecord;
        },
        reset: function() {
            currentBeat = 0;
        },
        setOrbPositions: function() {
            log(LOG_ENTER, "IN SET ORB POSITIONS!");
            var radius = orbProps.dimensions.x / 2;
            var boundaryWidth = boundaryLeftProps.dimensions.x;
            var offset = radius + boundaryWidth;
            var boundaryLeftGetRight = Quat.getRight(boundaryLeftProps.rotation);
            var boundaryRightGetRight = Quat.getRight(boundaryRightProps.rotation);
            orbStartPosition = Vec3.sum(
                boundaryLeftProps.position,
                Vec3.multiply(
                    boundaryLeftGetRight,
                    offset
                )
            );
            orbEndPosition = Vec3.sum(
                boundaryRightProps.position,
                Vec3.multiply(
                    boundaryRightGetRight,
                    -offset
                )
            );
            log(LOG_VALUE, "ORB End POSITION", orbEndPosition);

        },
        startGame: function() {
            var stringDirection = "",
                stringStartPosition = "";
            
            log(LOG_ENTER, "STARTING GAME");
            var stringStartPosition = "";

            if (!loadedChildren) {
                log(LOG_ERROR, "CHILDREN AREN'T LOADED");
                return;
            }

            gameRunning = true;
            stringStartPosition = JSON.stringify(orbStartPosition);
            this.reset();
            this.calculateBPMAndDistance(orbStartPosition, orbEndPosition);
            this.updateComponents();
            Entities.callEntityMethod(childrenIDS[START_BUTTON], "changeColor", ["red"]);
            // Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "setOrbPositionTo", [stringStartPosition]);
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "moveDirection", [DIRECTION_ONE]);
            Script.setTimeout(this.stopGame, currentDuration);
        },
        stopGame: function() {
            log(LOG_ENTER, "STOPPING GAME");
            log(LOG_VALUE, "FINAL COLLECTION", collisionCollection);
            gameRunning = false;            
            Entities.callEntityMethod(childrenIDS[START_BUTTON], "changeColor", ["green"]);
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "reset");
            log(LOG_VALUE, "TOTAL VALUES", collisionCollection);
        },
        setBPM: function(newBPM) {
            currentBPM = newBPM;
        },
        toggleGame: function(id, param) {
            activeClientID = param[0];
            log(LOG_VALUE, "activeClientID", activeClientID);
            log(LOG_ENTER, "TOGGLEGAME CALLED");
            if (!gameRunning) {
                this.startGame();
            } else {
                this.stopGame();
            }
        },
        updateComponents: function() {
            var options = {
                directionOne: directionOne,
                directionTwo: directionTwo,
                audioCue: audioCue,
                visualCue: visualCue
            };
            var stringOptions = JSON.stringify(options);
            
            [BOUNDARY_LEFT, BOUNDARY_RIGHT, ORB].forEach(function(entity) {
                Entities.callEntityMethod(childrenIDS[entity], "update", [stringOptions]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[entity], "update", [stringOptions]);
            });
        },
        unload: function () {
            if (gameInterval) {
                // Script.clearInterval(gameInterval);
            }
        }
    };

    return new Neuroscape_Gamezone_Server();
});
