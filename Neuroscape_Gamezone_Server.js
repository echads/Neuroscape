// Neuroscape_Gamezone_Server.js
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
    var request = Script.require("./request.js").request;
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
        LOG_VALUE_EZ = Util.Debug.LOG_VALUE_EZ,
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
        gamePause = false,
        gameStartTime = null,
        gameEndTime = null,
        gameTimer = null,
        lastplay = null,
        sound,
        rotation = null,
        position = null,
        nextLevel = null,
        currentBeat = 1,
        currentSpeed = 0,
        currentDuration = 6000,
        currentAV = null,
        currentGameType = null,
        currentLevel = 1,
        currentLatency = 0,
        currentLevelStartTime = 0,
        tempAV = null,
        tempGameType = null,
        prevLatency = 0,
        finalLatency = 0,
        COUNT_IN = 4,
        distance = 0,
        milisecondsPerBeat = 0,
        milisecondsPerMeter = 0,
        metersPerSecond = 0,
        previousTargetTime = 0,
        targetTime = 0,
        activeClientID = "",
        SEARCH_FOR_CHILDREN_TIMEOUT = 5000,
        HIT_TIME = 100,
        SOUND_URL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/bell.wav?3",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        ORB = "Neuroscape_Orb",
        MOUSE_PRESS = "Mouse_Press",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        PAD_LEFT = "Neuroscape_Drumstick_Pads_Left",
        PAD_RIGHT = "Neuroscape_Drumstick_Pads_Right",
        START_BUTTON = "Neuroscape_StartButton",
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
        POST_URL = "https://neuroscape.glitch.me/json/",
        STARTING_MESSAGE = "Hit the Drumpad \nto start!",
        CONTINUE_MESSAGE = "Hit the Drumpad \nto continue!\n",
        DONE_MESSAGE = "THANKS FOR\nPLAYING!",
        GET_READY_MESSAGE = "GET READY IN: ",
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
        DEFAULT_AV = AUDIOVISUAL,
        DEFAULT_GAME_TYPE = ON,
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
        gameData = {
        },
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
        speedMap = {
            SLOW: "Slow",
            MEDIUM: "Medium",
            FAST: "Fast"
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
        collisionCollection = [],
        allLevelsData = [],
        levels = [],
        // testLevels = ["Level_1", "Level_2", "Level_3", "Level_10", "Level_11", "Level_12", "Level_19", "Level_20", "Level_21"],
        testLevels = ["Level_4", "Level_5"];


    // Constructor Functions
    function CollisionRecord(duringBeat, collisionTime) {
        this.duringBeat = duringBeat;
        this.collisionTime = collisionTime;
    }

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
        calculateBPMAndDistance: function (position1, position2) {
            milisecondsPerBeat = currentSpeed;
            distance = Vec3.distance(position2, position1);
            milisecondsPerMeter = Math.sqrt(distance) / milisecondsPerBeat;
            metersPerSecond = milisecondsPerMeter * 1000;
            var localOffset = Quat.getRight(orbProps.rotation);
            directionOne = Vec3.multiply(metersPerSecond, localOffset);
            directionTwo = Vec3.multiply(-metersPerSecond, localOffset);

            log(LOG_ARCHIVE, "position1", position1);
            log(LOG_ARCHIVE, "position2", position2);
            log(LOG_ARCHIVE, "milisecondsPerBeat", milisecondsPerBeat);
            log(LOG_ARCHIVE, "distance", distance);
            log(LOG_ARCHIVE, "milisecondsPerMeter", milisecondsPerMeter);
            log(LOG_ARCHIVE, "metersPerSecond", metersPerSecond);
            log(LOG_ARCHIVE, "differenceVector", differenceVector);
            log(LOG_ARCHIVE, "directionOne", directionOne);
            log(LOG_ARCHIVE, "directionTwo", directionTwo);
        },
        calculateLatency: function(collisionTime) {
            currentLatency = Math.abs(collisionTime - targetTime);
            prevLatency = Math.abs(collisionTime - previousTargetTime);
            finalLatency = Math.min(currentLatency, prevLatency);
        },
        createLevelMap: function () {
            log(LOG_ENTER, "IN CREATE LEVEL MAP");
            var levelCounter = 1,
                BASENAME = "Level_",
                gameTypes = [ON, OFF, CONTINUOUS],
                speeds = [SLOW, MEDIUM, FAST],
                avs = [AUDIOVISUAL, AUDIO, VISUAL];
            
            function Level(level, speed, gameType, av) {
                this.level = level;
                this.speed = speed;
                this.gameType = gameType;
                this.av = av;
            }
            // Level(BASENAME + levelCounter, gameTypes[0], speeds[0], avs[0])
            speeds.forEach(function(speed) {
                gameTypes.forEach(function(gameType) {
                    avs.forEach(function(av) {
                        var name = BASENAME + levelCounter;
                        levelMap[name] = new Level(name, speed, gameType, av);
                        levelCounter++;
                    });
                });
            });
            levels = Object.keys(levelMap);
        },
        getID: function (id) {
            if (id === childrenIDS[ORB]) {
                return ORB_ID;
            }
            if (id === (childrenIDS[BOUNDARY_LEFT] || childrenIDS[BOUNDARY_RIGHT])) {
                return PLAYER_ID;
            }
        },
        incrementBeat: function () {
            var currentIndex = collisionCollection.length - 1,
                previousBeatRecord = null,
                previousOrbCollisionTime = 0,
                currentOrbCollisionTime = 0,
                beatDelta = 0,
                sendMessage = "";

            if (currentBeat >= 0) {
                previousBeatRecord = collisionCollection[currentIndex];

                if (previousBeatRecord) {
                    previousOrbCollisionTime = previousBeatRecord[nameMap[ORB]].collisionTime;
                }

                if (currentBeatRecord[nameMap[ORB]]) {
                    log(LOG_ARCHIVE, "CURRENT BEAT RECORD For ORB", currentBeatRecord[nameMap[ORB]]);
                    currentOrbCollisionTime = currentBeatRecord[nameMap[ORB]].collisionTime;
                    beatDelta = currentOrbCollisionTime - previousOrbCollisionTime;
                    currentBeatRecord[nameMap[ORB]].beatDelta = beatDelta;
                }

                collisionCollection.push(currentBeatRecord);
                currentBeatRecord = {};
                currentBeatRecord[nameMap[STICK_LEFT]] = [];
                currentBeatRecord[nameMap[STICK_RIGHT]] = [];
                currentBeatRecord[MOUSE_PRESS] = [];
                previousTargetTime = targetTime;
                if (currentGameType === OFF) {
                    targetTime = Date.now() + currentSpeed / 2;
                } else {
                    targetTime = Date.now() + currentSpeed;
                }

                currentBeat++;
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);

            } else {
                currentBeat++;
                sendMessage += GET_READY_MESSAGE + Math.abs(currentBeat);
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
                
                if (currentBeat === 0) {
                    currentGameType = tempGameType;
                    currentAV = tempAV;
                    this.updateComponents();
                }
            }
        },
        postData: function() {
            log(LOG_ENTER, "IN POST DATA", gameData)

            var options = {
                url: POST_URL,
                method: "POST",
                json: true,
                body: gameData
            };

            request(options);
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
                activeClientID = userdataProperties[BASE_NAME].activeClientID;

            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }

            searchForChildren(entityID, childrenNames, function (children) {
                loadedChildren = true;
                Object.keys(children).forEach(function (name) {
                    childrenIDS[name] = children[name];
                });
                log(LOG_ENTER, "FOUND ALL CHILDREN");
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [STARTING_MESSAGE]);
                boundaryLeftProps = getProps(childrenIDS[BOUNDARY_LEFT]);
                boundaryRightProps = getProps(childrenIDS[BOUNDARY_RIGHT]);
                orbProps = getProps(childrenIDS[ORB]);
                self.setOrbPositions();
            }, SEARCH_FOR_CHILDREN_TIMEOUT);

            currentSpeed = FAST;
            currentAV = AUDIOVISUAL;
            currentGameType = ON;
            currentLevel = 1;
            this.createLevelMap();
        },
        prepNextLevel: function () {
            nextLevel = levelMap[nextLevel];
            currentLevel = nextLevel.level;
            currentSpeed = nextLevel.speed;
            currentGameType = nextLevel.gameType;
            currentAV = nextLevel.av;
        },
        recordCollision: function (id, param) {
            log(LOG_ARCHIVE, "IN RECORD COLLISION");
            var collisionObject = JSON.parse(param[0]);
            var collisionRecord = new CollisionRecord(
                currentBeat,
                collisionObject.time
            );
            log(LOG_ARCHIVE, "CURRENT BEAT RECORD", currentBeatRecord);

            if (gameRunning === false) {
                this.startGame();
                return;
            }

            if (gamePause === true) {
                this.startLevel();
                gamePause = false;
                return;
            }

            if (collisionObject.id === ORB) {
                currentBeatRecord[nameMap[collisionObject.id]] = collisionRecord;
                this.incrementBeat();
            }

            if (currentBeat <= 0) {
                return;
            }

            if (collisionObject.id === MOUSE_PRESS) {
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[MOUSE_PRESS].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });

                // Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_LEFT], "updateStickLatency", [STICK_LEFT, String(currentSpeed), String(finalLatency)]);
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
            }

            if (collisionObject.id === STICK_LEFT) {
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[nameMap[STICK_LEFT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });

                log(LOG_ARCHIVE, "About to call update Stick Latency pad left", childrenIDS[PAD_LEFT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_LEFT], "updateStickLatency", [STICK_LEFT, String(currentSpeed), String(finalLatency)]);
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
            }

            if (collisionObject.id === STICK_RIGHT) {
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[nameMap[STICK_RIGHT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });
                log(LOG_ARCHIVE, "About to call update Stick Latency pad Right", childrenIDS[PAD_RIGHT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_RIGHT], "updateStickLatency", [STICK_RIGHT, String(currentSpeed), String(finalLatency)]);
                this.updateStatus();
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
            }
        },
        reset: function () {
            currentBeat = 0 - COUNT_IN;
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify({})]);
            currentLatency = 0;
            prevLatency = 0;
            currentBeatRecord[nameMap[STICK_LEFT]] = [];
            currentBeatRecord[nameMap[STICK_RIGHT]] = [];
            currentBeatRecord[MOUSE_PRESS] = [];
        },
        setOrbPositions: function () {
            log(LOG_ARCHIVE, "IN SET ORB POSITIONS!");
            var radius = orbProps.dimensions.x / 2,
                boundaryWidth = boundaryLeftProps.dimensions.x,
                offset = radius + boundaryWidth,
                boundaryLeftGetRight = Quat.getRight(boundaryLeftProps.rotation),
                boundaryRightGetRight = Quat.getRight(boundaryRightProps.rotation);

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
        },
        startGame: function () {
            log(LOG_ENTER, "STARTING GAME");

            if (!loadedChildren) {
                log(LOG_ERROR, "CHILDREN AREN'T LOADED");
                return;
            }

            gameData.startTime = Date.now();

            this.createLevelMap();

            gameRunning = true;
            
            // Entities.callEntityMethod(childrenIDS[START_BUTTON], "changeColor", ["red"]);
            nextLevel = levels.shift();
            this.prepNextLevel();
            this.startLevel();
        },
        stopGame: function () {
            log(LOG_ENTER, "STOPPING GAME");
            gameData.stopTime = Date.now();
            gameData.allLevelsData = allLevelsData;
            self.postData();
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [DONE_MESSAGE]);
            gameRunning = false;
            log(LOG_VALUE, "FINAL GAMEDATA", gameData);
        },
        startLevel: function () {
            log(LOG_ARCHIVE, "nextLevel", nextLevel);
            log(LOG_ARCHIVE, "levelMap", levelMap);

            this.storeTempTypes();
            this.updateComponents();
            this.calculateBPMAndDistance(orbStartPosition, orbEndPosition);
            this.reset();
            this.updateComponents();
            
            currentLevelStartTime = Date.now();
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "moveDirection", [DIRECTION_ONE]);
            Script.setTimeout(this.stopLevel, currentDuration);
        },
        stopLevel: function () {
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "reset");
            // var nextLevel = levels.shift();
            nextLevel = levels.shift();
            if (!nextLevel) {
                self.stopGame();
            } else {
                gamePause = true;
                levelData = {
                    level: currentLevel,
                    speed: currentSpeed,
                    gameType: currentGameType,
                    av: currentAV,
                    startTime: currentLevelStartTime,
                    stopTime: Date.now(),
                    collisionData: collisionCollection
                };
                allLevelsData.push(levelData);
                collisionCollection = [];

                log(LOG_VALUE, "next level", nextLevel);
                self.prepNextLevel();

                var sendMessage = "";
                sendMessage += CONTINUE_MESSAGE;
                sendMessage += "\nNext Level: \n\t" + currentLevel;
                sendMessage += "\nNext Speed: \n\t" + currentSpeed + "ms";
                sendMessage += "\nNext Game Type: \n\t" + currentGameType;
                sendMessage += "\nNext AV type: \n\t" + currentAV + "\n";
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
            }
        },
        setBPM: function (newBPM) {
            currentSpeed = newBPM;
        },
        storeTempTypes: function () {
            tempGameType = currentGameType;
            tempAV = currentAV;
            currentGameType = DEFAULT_GAME_TYPE;
            currentAV = DEFAULT_AV;
        },
        toggleGame: function (id, param) {
            log(LOG_VALUE, "activeClientID", activeClientID);
            log(LOG_ENTER, "TOGGLEGAME CALLED");
            if (!gameRunning) {
                this.startGame();
            } else {
                this.stopGame();
            }
        },
        updateComponents: function () {
            var options = {
                directionOne: directionOne,
                directionTwo: directionTwo,
                av: currentAV,
                gameType: currentGameType,
                beat: currentBeat
            };
            var stringOptions = JSON.stringify(options);

            [BOUNDARY_LEFT, BOUNDARY_RIGHT, ORB].forEach(function (entity) {
                Entities.callEntityMethod(childrenIDS[entity], "update", [stringOptions]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[entity], "update", [stringOptions]);
            });
        },
        updateStatus: function () {
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
        }
    };

    return new Neuroscape_Gamezone_Server();
});
