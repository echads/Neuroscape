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
        rotation = null,
        position = null,
        currentBeat = 1,
        currentSpeed = 0,
        currentDuration = 30000,
        currentAV = null,
        currentGameType = null,
        currentLevel = 1,
        currentLatency = 0,
        prevLatency = 0,
        finalLatency = 0,
        audioCue = true,
        visualCue = true,
        COUNT_IN = 4,
        distance = 0,
        milisecondsPerBeat = 0,
        milisecondsPerMeter = 0,
        metersPerSecond = 0,
        HIT_TIME = 100,
        SEARCH_FOR_CHILDREN_TIMEOUT = 5000,
        previousTargetTime = 0,
        targetTime = 0,
        activeClientID = "",
        SOUND_URL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/bell.wav?3",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        ORB = "Neuroscape_Orb",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        PAD_LEFT = "Neuroscape_Drumstick_Pads_Left",
        PAD_RIGHT = "Neuroscape_Drumstick_Pads_Right",
        START_BUTTON = "Neuroscape_StartButton",
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
        ORB_ID = "orb",
        PLAYER_ID = "player",
        SLOW = 750,
        MEDIUM = 500,
        FAST = 350,
        ON = "on",
        OFF = "off",
        CONTINUOUS = "continuous",
        AUDIO = "audio",
        VISUAL = "visual",
        AUDIOVISUAL = "audiovisual",
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
            Neuroscape_Drumstick_Right: null,
            Neuroscape_Drumstick_Pads_Left: null,
            Neuroscape_Drumstick_Pads_Right: null
        },
        differenceVector = {},
        directionOne = {},
        directionTwo = {},        
        boundaryLeftProps = {},
        boundaryRightProps = {},
        orbProps = {},
        position = {},
        collisionRecords = [],
        orbInitPosition = {},
        gameData = {},
        levelMap = {},
        levelData = {},
        orbStartPosition = {},
        orbEndPosition = {},
        currentBeatRecord = {},
        nameMap = {
            Neuroscape_Drumstick_Left: "Stick_Left",
            Neuroscape_Drumstick_Right: "Stick_Right",
            Neuroscape_Orb: "Orb"
        },
        status = {
            speed: currentSpeed,
            level: currentLevel,
            type: currentGameType,
            av: currentAV,
            beat: currentBeat,
            latency: currentLatency
        },
        childrenNames = Object.keys(childrenIDS),
        collisionCollection = [];

    // Constructor Functions
    function CollisionRecord (duringBeat, collisionTime) {
        this.duringBeat = duringBeat;
        this.collisionTime = collisionTime;
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
            milisecondsPerBeat = currentSpeed;
            log(LOG_VALUE, "milisecondsPerBeat", milisecondsPerBeat);
            distance = Vec3.distance(position2, position1);
            log(LOG_VALUE, "distance", distance);
            milisecondsPerMeter = Math.sqrt(distance) / milisecondsPerBeat;
            log(LOG_VALUE, "milisecondsPerMeter", milisecondsPerMeter);
            metersPerSecond = milisecondsPerMeter * 1000;
            log(LOG_VALUE, "metersPerSecond", metersPerSecond);
            var localOffset = Quat.getRight(orbProps.rotation);
            log(LOG_VALUE, "differenceVector", differenceVector);
            directionOne = Vec3.multiply(metersPerSecond, localOffset);
            log(LOG_VALUE, "directionOne", directionOne);
            directionTwo = Vec3.multiply(-metersPerSecond, localOffset);
            log(LOG_VALUE, "directionTwo", directionTwo);
        },
        createLevelMap: function() {

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
            var currentIndex = collisionCollection.length -1,
                previousBeatRecord = null,
                previousOrbCollisionTime = 0,
                currentOrbCollisionTime = 0,
                beatDelta = 0;

            if (currentBeat > 0) {
                previousBeatRecord = collisionCollection[currentIndex];
                if (previousBeatRecord) {
                    previousOrbCollisionTime = previousBeatRecord[nameMap[ORB]].collisionTime;
                }
                if (currentBeatRecord[nameMap[ORB]]) {
                    currentOrbCollisionTime = currentBeatRecord[nameMap[ORB]].collisionTime;
                    beatDelta = currentOrbCollisionTime - previousOrbCollisionTime;
                    currentBeatRecord[nameMap[ORB]].beatDelta = beatDelta;
                }

                collisionCollection.push(currentBeatRecord);
                currentBeatRecord = {};
                currentBeatRecord[nameMap[STICK_LEFT]] = [];
                currentBeatRecord[nameMap[STICK_RIGHT]] = [];
                previousTargetTime = targetTime;
                targetTime = Date.now() + currentSpeed;
            }

            currentBeat++;
            this.updateStatus();
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
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
            sound = SoundCache.getSound(SOUND_URL);
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            position = currentProperties.position;
            rotation = currentProperties.rotation;
            
            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
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

            currentSpeed = FAST;
            currentAV = AUDIOVISUAL;
            currentGameType = CONTINUOUS;
            currentLevel = 1;
        },
        recordCollision: function(id, param) {
            log(LOG_ARCHIVE, "IN RECORD COLLISION");
            var collisionObject = JSON.parse(param[0]);
            var collisionRecord = new CollisionRecord(
                currentBeat,
                collisionObject.time
            );
            log(LOG_VALUE, "CURRENT BEAT RECORD", currentBeatRecord);

            if (collisionObject.id === ORB) {
                currentBeatRecord[nameMap[collisionObject.id]] = collisionRecord;
                this.incrementBeat();
            }

            if (currentBeat <= 0) { 
                return;
            }
            if (collisionObject.id === STICK_LEFT) {
                currentLatency = Math.abs(collisionRecord.collisionTime - targetTime);
                prevLatency = Math.abs(collisionRecord.collisionTime - previousTargetTime);
                finalLatency = Math.min(currentLatency, prevLatency);
                currentBeatRecord[nameMap[STICK_LEFT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });

                log(LOG_ENTER, "About to call update Stick Latency pad left", childrenIDS[PAD_LEFT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_LEFT], "updateStickLatency", [STICK_LEFT, String(currentSpeed), String(finalLatency)]);
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
            }

            if (collisionObject.id === STICK_RIGHT) {
                currentLatency = Math.abs(collisionRecord.collisionTime - targetTime);
                prevLatency = Math.abs(collisionRecord.collisionTime - previousTargetTime);
                finalLatency = Math.min(currentLatency, prevLatency);
                currentBeatRecord[nameMap[STICK_RIGHT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });
                log(LOG_ENTER, "About to call update Stick Latency pad Right", childrenIDS[PAD_RIGHT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_RIGHT], "updateStickLatency", [STICK_RIGHT, String(currentSpeed), String(finalLatency)]);
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
            }
        },
        reset: function() {
            currentBeat = 0 - COUNT_IN;
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify({})]);
            currentLatency = 0;
            prevLatency = 0;
            currentBeatRecord[nameMap[STICK_LEFT]] = [];
            currentBeatRecord[nameMap[STICK_RIGHT]] = [];
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
            // this.calculateBPMAndDistance(orbStartPosition, orbEndPosition);
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
        startLevel: function(level) {
            // #TODO
        },
        stopLevel: function() {
            // #TODO
        },
        setBPM: function(newBPM) {
            currentSpeed = newBPM;
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
        updateStatus: function() {
            status = {
                speed: currentSpeed,
                level: currentLevel,
                type: currentGameType,
                av: currentAV,
                beat: currentBeat,
                latency: finalLatency
            };
        },
        unload: function () {
            // if (gameInterval) {
            //     // Script.clearInterval(gameInterval);
            // }
        }
    };

    return new Neuroscape_Gamezone_Server();
});
