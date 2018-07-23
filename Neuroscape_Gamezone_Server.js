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
    var getProps = Util.Entity.getProps,
        searchForChildren = Util.Entity.searchForChildren;

    // Log Setup
    var LOG_CONFIG = {},
        LOG_ENTER = Util.Debug.LOG_ENTER,
        LOG_UPDATE = Util.Debug.LOG_UPDATE,
        LOG_ERROR = Util.Debug.LOG_ERROR,
        LOG_VALUE = Util.Debug.LOG_VALUE,
        LOG_ARCHIVE = Util.Debug.LOG_ARCHIVE;

    LOG_CONFIG[LOG_ENTER] = false;
    LOG_CONFIG[LOG_UPDATE] = false;
    LOG_CONFIG[LOG_ERROR] = false;
    LOG_CONFIG[LOG_VALUE] = false;
    LOG_CONFIG[LOG_ARCHIVE] = false;
    var log = Util.Debug.log(LOG_CONFIG);

    // Init 
    var BASE_NAME = "Neuroscape_",
        entityID,
        name = null,
        DEBUG = false,
        loadedChildren = false,
        isAllowedToUnPause = false,
        isGameRunning = false,
        isGamePaused = false,
        isListenMode = true,
        isNameEntered = false,
        gameStartTime = null,
        gameEndTime = null,
        gameTimer = null,
        lastplay = null,
        rotation = null,
        position = null,
        nextLevel = null,
        currentPlayerName = null,
        continuousBeatCounter = 0,
        currentBeat = 1,
        currentSpeed = 0,
        currentDuration = 30000,
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
        ALLOW_HIT_TO_UNPAUSE_TIME = 1000,
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        ORB = "Neuroscape_Orb",
        MOUSE_PRESS = "Mouse_Press",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        PAD_LEFT = "Neuroscape_Drumstick_Pads_Left",
        PAD_RIGHT = "Neuroscape_Drumstick_Pads_Right",
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
        STARTING_MESSAGE = "Hit the drum pad to start",
        ENTER_NAME = "Please enter name\nin the Neuroscape tablet app",
        CONTINUE_MESSAGE = "Hit the drum pad \nto continue\n",
        DONE_MESSAGE = "Thanks for playing",
        GET_READY_MESSAGE = "GET READY IN: ",
        PLAY_MESSAGE = "Play the beat back",
        LISTEN_MESSAGE = "Listen to the beat",
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
        LISTEN = "listen",
        PLAY = "play",
        DEFAULT_AV = AUDIOVISUAL,
        DEFAULT_GAME_TYPE = ON,
        MESSAGE_CHANNEL = "messages.neuroscape",
        UPDATE_MESSAGE = "updateMessage",
        UPDATE_PLAYER_NAME = "update_player_name",
        RESTART_GAME = "restart_game",
        SAVE_JSON = "saveJSON",
        self;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        childrenIDS = {
            Neuroscape_Boundary_Left: null,
            Neuroscape_Boundary_Right: null,
            Neuroscape_Orb: null,
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
        collisionCollection = [],
        allLevelsData = [],
        levels = [];
        // testLevels = ["Level_1", "Level_2", "Level_3", "Level_10"];
        // testLevels = ["Level_1"];
        // testLevels = ["Level_1", "Level_2", "Level_3", "Level_10", "Level_11", "Level_12", "Level_19", "Level_20", "Level_21"];
        // testLevels = ["Level_1", "Level_2"];

    // Constructor Functions
    function CollisionRecord(duringBeat, collisionTime) {
        this.duringBeat = duringBeat;
        this.collisionTime = collisionTime;
    }

    function Level(level, speed, gameType, av) {
        this.level = level;
        this.speed = speed;
        this.gameType = gameType;
        this.av = av;
    }

    // Entity Definition
    function Neuroscape_Gamezone_Server() {
        self = this;
    }

    Neuroscape_Gamezone_Server.prototype = {
        remotelyCallable: [
            "incrementBeat",
            "handleCollision",
            "recordCollision",
            "updatePlayerName"
        ],
        calculateBPMAndDistance: function (position1, position2) {
            var localOffset = Quat.getRight(orbProps.rotation);
            milisecondsPerBeat = currentSpeed;
            distance = Vec3.distance(position2, position1);
            milisecondsPerMeter = Math.sqrt(distance) / milisecondsPerBeat;
            metersPerSecond = milisecondsPerMeter * 1000;
            directionOne = Vec3.multiply(metersPerSecond, localOffset);
            directionTwo = Vec3.multiply(-metersPerSecond, localOffset);
        },
        calculateLatency: function(collisionTime) {
            currentLatency = Math.abs(collisionTime - targetTime);
            prevLatency = Math.abs(collisionTime - previousTargetTime);
            finalLatency = Math.min(currentLatency, prevLatency);
        },
        createLevelMap: function () {
            var levelCounter = 1,
                BASENAME = "Level_",
                gameTypes = [ON, OFF, CONTINUOUS],
                speeds = [SLOW, MEDIUM, FAST],
                avs = [AUDIOVISUAL, AUDIO, VISUAL];

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
        handleCollision: function (id, param) {
            log(LOG_ARCHIVE, "IN HANDLE COLLISION");
            var collisionObject = JSON.parse(param[0]);
            
            if (!isNameEntered) {
                return;
            }

            if (!isGameRunning) {
                this.startGame();
                return;
            }

            if (isGamePaused && isAllowedToUnPause) {
                this.startLevel();
                isGamePaused = false;
                isAllowedToUnPause = false;
                return;
            } 

            if (collisionObject.id === ORB) {
                this.incrementBeat();
                if (currentBeat <= 0) {
                    return;
                } else {
                    log(LOG_ENTER, "About to record Orb collision Object");
                    this.recordCollision(collisionObject);
                }
            } else {
                if (currentBeat <= 0) {
                    return;
                } else {
                    log(LOG_ENTER, "About to record stick collision ");
                    this.recordCollision(collisionObject);
                }
            }
        },
        incrementBeat: function () {
            log(LOG_VALUE, "CURRENT BEAT IN START OF INCREMENT", currentBeat);
            // this is called whenenver the orb collides with a wall 
            var currentIndex = collisionCollection.length - 1,
                previousBeatRecord = null,
                previousOrbCollisionTime = 0,
                currentOrbCollisionTime = 0,
                beatDelta = 0,
                sendMessage = "",
                beatRecordKeys = Object.keys(currentBeatRecord);

            if (currentBeat >= 0) {
                // handles the post countdown period

                previousBeatRecord = collisionCollection[currentIndex];
                log(LOG_VALUE, "previousBeatRecord", previousBeatRecord);
                if (previousBeatRecord) {
                    // If there was a previous beat, get the last time it collided to calculate the beat delta
                    previousOrbCollisionTime = previousBeatRecord[nameMap[ORB]].collisionTime;
                }

                if (currentBeatRecord[nameMap[ORB]]) {
                    // Handles recording the delta time between beats
                    log(LOG_VALUE, "CURRENT BEAT RECORD For ORB", currentBeatRecord[nameMap[ORB]]);
                    currentOrbCollisionTime = currentBeatRecord[nameMap[ORB]].collisionTime;
                    beatDelta = currentOrbCollisionTime - previousOrbCollisionTime;
                    currentBeatRecord[nameMap[ORB]].beatDelta = beatDelta;
                }
                
                beatRecordKeys.forEach(function(key) {
                    (currentBeatRecord[key] === '' || 
                    currentBeatRecord[key] === null || 
                    currentBeatRecord[key].length === 0) && delete currentBeatRecord[key]
                });
                
                collisionCollection.push(currentBeatRecord);
                log(LOG_VALUE, "Collision collection before reset", collisionCollection);
                this.resetCurrentBeatRecord();
                previousTargetTime = targetTime;
                if (currentGameType === OFF) {
                    targetTime = Date.now() + currentSpeed / 2;
                } else {
                    targetTime = Date.now() + currentSpeed;
                }

                currentBeat++;

                if (currentGameType === ON || currentGameType === OFF) {
                    this.updateStatus();
                    Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
                    var message = JSON.stringify({
                        type: UPDATE_MESSAGE,
                        value: status
                    })
                    Messages.sendMessage(MESSAGE_CHANNEL, message);
                } else {
                    if (continuousBeatCounter <= 4) {
                        continuousBeatCounter++;
                        if (isListenMode) {
                            currentAV = tempAV;
                            this.updateComponents();
                            Entities.callEntityMethod(childrenIDS[ORB], "turnOrbVisible");
                            var sendMessage = "";
                            sendMessage += LISTEN_MESSAGE;
                            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
                            var message = JSON.stringify({
                                type: UPDATE_MESSAGE,
                                value: sendMessage
                            });
                            Messages.sendMessage(MESSAGE_CHANNEL, message);
                        } else {
                            currentAV = null;
                            this.updateComponents();
                            Entities.callEntityMethod(childrenIDS[ORB], "turnOrbInvisible");
                            var sendMessage = "";
                            sendMessage += PLAY_MESSAGE;
                            sendMessage += "\nLast latency: \n\t" + finalLatency + "\n";
                            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
                            var message = JSON.stringify({
                                type: UPDATE_MESSAGE,
                                value: sendMessage
                            })
                            Messages.sendMessage(MESSAGE_CHANNEL, sendMessage);
                        }

                        if (continuousBeatCounter === 4) {
                            isListenMode = !isListenMode;
                            continuousBeatCounter = 0;
                        }
                    }
                }

            } else {
                // This is handeling our Cout Down Period
                currentBeat++;
                sendMessage += GET_READY_MESSAGE + Math.abs(currentBeat);
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);

                var message = JSON.stringify({
                    type: UPDATE_MESSAGE,
                    value: sendMessage
                });
                Messages.sendMessage(MESSAGE_CHANNEL, message);
                
                if (currentBeat === 0) {
                    currentGameType = tempGameType;
                    currentAV = tempAV;
                    this.updateComponents();
                }
            }
        },
        initGame: function () {
            gameData = {};
            this.reset();
        },
        onMessageReceived: function (channel, message, sender, localOnly) {
            if (channel !== MESSAGE_CHANNEL) {
                return;
            }
            var data;
            try {
                data = JSON.parse(message);
            } catch (e) {
                return;
            }

            switch (data.type) {
                case UPDATE_PLAYER_NAME:
                    log(LOG_ARCHIVE, name + " IN UPDATE PLAYER NAME", data);
                    var newPlayerName = data.value;
                    currentPlayerName = newPlayerName;
                    isNameEntered = true;
                    var sendMessage = "Hi " + currentPlayerName + "!\n\n";
                    sendMessage += STARTING_MESSAGE;

                    Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
                    var message = JSON.stringify({
                        type: UPDATE_MESSAGE,
                        value: sendMessage
                    });
                    Messages.sendMessage(MESSAGE_CHANNEL, message);
                    break;
                case RESTART_GAME:
                    isNameEntered = false;
                    currentPlayerName = null;
                    Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [ENTER_NAME]);
                    break;
                default:
            }
        },
        preload: function (id) {
            entityID = id;
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

            function searchCallback(children) {
                loadedChildren = true;
                Object.keys(children).forEach(function (name) {
                    childrenIDS[name] = children[name];
                });
                log(LOG_ENTER, "FOUND ALL CHILDREN", children);
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [ENTER_NAME]);
                boundaryLeftProps = getProps(childrenIDS[BOUNDARY_LEFT]);
                boundaryRightProps = getProps(childrenIDS[BOUNDARY_RIGHT]);
                orbProps = getProps(childrenIDS[ORB]);
                self.setOrbPositions();
            }

            searchForChildren(entityID, childrenNames, searchCallback ,SEARCH_FOR_CHILDREN_TIMEOUT, true);

            currentSpeed = FAST;
            currentAV = AUDIOVISUAL;
            currentGameType = ON;
            currentLevel = 1;
            this.createLevelMap();

            Messages.subscribe(MESSAGE_CHANNEL);
            Messages.messageReceived.connect(this.onMessageReceived);
        },
        prepNextLevel: function () {
            nextLevel = levelMap[nextLevel];
            currentLevel = nextLevel.level;
            currentSpeed = nextLevel.speed;
            currentGameType = nextLevel.gameType;
            currentAV = nextLevel.av;
        },
        recordCollision: function (collisionObject) {
            var collisionRecord = new CollisionRecord(
                currentBeat,
                collisionObject.time
            );

            if (collisionObject.id === ORB) {
                log(LOG_ENTER, "IN RECORD COLLISION to record stick collision ");
                currentBeatRecord[nameMap[collisionObject.id]] = collisionRecord;
            }

            if (collisionObject.id === MOUSE_PRESS) {
                log(LOG_ENTER, "IN RECORD COLLISION about to record mouse press collision ");
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[MOUSE_PRESS].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });

            }

            if (collisionObject.id === STICK_LEFT) {
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[nameMap[STICK_LEFT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });
                log(LOG_ARCHIVE, "About to call update Stick Latency pad left", childrenIDS[PAD_LEFT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_LEFT], "updateStickLatency", [STICK_LEFT, String(currentSpeed), String(finalLatency)]);
            }

            if (collisionObject.id === STICK_RIGHT) {
                this.calculateLatency(collisionRecord.collisionTime);
                currentBeatRecord[nameMap[STICK_RIGHT]].push({
                    collisionRecord: collisionRecord,
                    latency: currentLatency
                });
                log(LOG_ARCHIVE, "About to call update Stick Latency pad Right", childrenIDS[PAD_RIGHT]);
                Entities.callEntityClientMethod(activeClientID, childrenIDS[PAD_RIGHT], "updateStickLatency", [STICK_RIGHT, String(currentSpeed), String(finalLatency)]);
            }

            this.updateStatus();
            if (currentGameType !== CONTINUOUS) {
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [JSON.stringify(status)]);
                var message = JSON.stringify({
                    type: UPDATE_MESSAGE,
                    value: status
                });
                Messages.sendMessage(MESSAGE_CHANNEL, message);
            }
        },
        reset: function () {
            isListenMode = true;
            currentBeat = 0 - COUNT_IN;
            currentLatency = 0;
            prevLatency = 0;
            continuousBeatCounter = 0;
            this.resetCurrentBeatRecord();
            Entities.callEntityMethod(childrenIDS[ORB], "turnOrbVisible");

        },
        resetCurrentBeatRecord: function () {
            currentBeatRecord = {};
            currentBeatRecord[nameMap[ORB]] = {};
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
            this.initGame();
            gameData.name = currentPlayerName;
            gameData.date = new Date();
            gameData.start = new Date();

            this.createLevelMap();

            isGameRunning = true;
            
            nextLevel = levels.shift();
            // nextLevel = testLevels.shift();
            this.prepNextLevel();
            this.reset();
            this.startLevel();
        },
        stopGame: function () {
            log(LOG_ENTER, "STOPPING GAME");
            gameData.stop = new Date();
            gameData.levels = allLevelsData;
            isGameRunning = false;
            isNameEntered = false;

            var sendMessage = DONE_MESSAGE + " " + currentPlayerName + "!";
            
            Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
            var message = JSON.stringify({
                type: UPDATE_MESSAGE,
                value: sendMessage
            });
            Messages.sendMessage(MESSAGE_CHANNEL, message);
            var gameDataMessage = JSON.stringify({
                type: SAVE_JSON,
                value: gameData
            });
            Messages.sendMessage(MESSAGE_CHANNEL, gameDataMessage);
            currentPlayerName = null;
            log(LOG_VALUE, "FINAL GAMEDATA", gameDataMessage);
        },
        startLevel: function () {
            log(LOG_ENTER, "START LEVEL");
            this.storeTempTypes();
            this.calculateBPMAndDistance(orbStartPosition, orbEndPosition);
            this.updateComponents();
            
            currentLevelStartTime = new Date();
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "moveDirection", [DIRECTION_ONE]);
            Script.setTimeout(this.stopLevel, currentDuration);
        },
        stopLevel: function () {
            log(LOG_ENTER, "STOP LEVEL");

            log(LOG_VALUE, "collisionCollection", collisionCollection);
            Entities.callEntityClientMethod(activeClientID, childrenIDS[ORB], "reset");
            levelData = {
                level: currentLevel,
                speed: currentSpeed,
                gameType: currentGameType,
                av: currentAV,
                startTime: currentLevelStartTime,
                stopTime: new Date(),
                collisionData: collisionCollection
            };
            log(LOG_ARCHIVE, "levelData", levelData);
            allLevelsData.push(levelData);
            collisionCollection = [];

            nextLevel = levels.shift();
            // nextLevel = testLevels.shift();
            if (!nextLevel) {
                self.stopGame();
            } else {
                isGamePaused = true;
                isAllowedToUnPause = false;
                Script.setTimeout(function() {
                    isAllowedToUnPause = true;
                }, ALLOW_HIT_TO_UNPAUSE_TIME);
                
                self.prepNextLevel();
                self.reset();

                var sendMessage = "";
                sendMessage += CONTINUE_MESSAGE;
                sendMessage += "\nNext Level: \n\t" + currentLevel;
                sendMessage += "\nNext Speed: \n\t" + currentSpeed + "ms";
                sendMessage += "\nNext Game Type: \n\t" + currentGameType;
                sendMessage += "\nNext AV type: \n\t" + currentAV + "\n";
                Entities.callEntityClientMethod(activeClientID, entityID, "updateOverlay", [sendMessage]);
                var message = JSON.stringify({
                    type: UPDATE_MESSAGE,
                    value: sendMessage
                })
                Messages.sendMessage(MESSAGE_CHANNEL, message);
            }
        },
        storeTempTypes: function () {
            tempGameType = currentGameType;
            tempAV = currentAV;
            currentGameType = DEFAULT_GAME_TYPE;
            currentAV = DEFAULT_AV;
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
        updatePlayerName: function (id, param) {
            currentPlayerName = param[0];
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
            Messages.messageReceived.disconnect(this.onMessageReceived);
            Messages.unsubscribe(MESSAGE_CHANNEL);
        }
    };

    return new Neuroscape_Gamezone_Server();
});
