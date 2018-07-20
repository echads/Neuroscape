// NeuroSpanwer.js
//
// Created by Liv Erikson and Milad Nazeri on 2018-07-16
//
// Copyright 2018 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function () {

    // Polyfill
    Script.require("./Polyfills.js")();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());

    var axisAlignedOrientation = Util.Maths.axisAlignedOrientation,
        getNameProps = Util.Entity.getNameProps,
        inFrontOf = Util.Avatar.inFrontOf,
        makeColor = Util.Color.makeColor,
        vec = Util.Maths.vec;

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
        // baseURL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/",
        baseURL = "file:///D:/Dropbox%20(milad%20productions)/_ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/",
        movingOrbClientScript = baseURL + "Neuroscape_Moving-Orb_Client.js" + "?v=" + Date.now(),
        movingOrbServerScript = baseURL + "Neuroscape_Moving-Orb_Server.js" + "?v=" + Date.now(),
        boundaryClientScript = baseURL + "Neuroscape_Boundary_Client.js" + "?v=" + Date.now(),
        drumStickClientScript = baseURL + "Neuroscape_Drumstick_Client.js" + "?v=" + Date.now(),
        boundaryServerScript = baseURL + "Neuroscape_Boundary_Server.js" + "?v=" + Date.now(),
        drumStickPadClientScript = baseURL + "Neuroscape_Drumstick-Pad_Client.js" + "?v=" + Date.now(),
        gameZoneClientScript = baseURL + "Neuroscape_Gamezone_Client.js" + "?v=" + Date.now(),
        gameZoneServerScript = baseURL + "Neuroscape_Gamezone_Server.js" + "?v=" + Date.now(),
        startButtonClientScript = baseURL + "Neuroscape_Start-Button_Client.js" + "?v=" + Date.now(),
        startButtonServerScript = baseURL + "Neuroscape_Start-Button_Server.js" + "?v=" + Date.now(),
        drumStickModelURL = "http://hifi-content.s3-us-west-1.amazonaws.com/rebecca/DrumKit/Models/Drum_Stick.obj",
        DEBUG = false,
        DISTANCE_IN_FRONT = 1,
        zoneID,
        LEFT = "Left",
        RIGHT = "Right",
        LEFT_HAND = "LeftHand",
        RIGHT_HAND = "RightHand";

    // Collections
    var allEnts = [],
        entityNames = [],
        centerPlacement = inFrontOf(DISTANCE_IN_FRONT),
        avatarPosition = MyAvatar.position,
        avatarOrientation = MyAvatar.orientation,
        RED = makeColor(255, 0, 0),
        GREEN = makeColor(0, 255, 0),
        BLUE = makeColor(0, 0, 255);

    // Procedural Functions
    function deleteIfExists() {
        var deleteNames = Settings.getValue(BASE_NAME);
        var SEARCH_RADIUS = 100;
        if (deleteNames) {
            deleteNames.forEach(function (name) {
                var found = Entities.findEntitiesByName(name, avatarPosition, SEARCH_RADIUS);
                try {
                    if (found[0]) {
                        Entities.deleteEntity(found[0]);
                    }
                } catch (e) {
                    log(LOG_ERROR, "DELETING ENTITY", e);
                }
            });
        }
    }

    function createBoundaryBoxEntity(name, position, rotation, dimensions, color, userData, parentID) {
        name = name || 1;
        dimensions = dimensions || vec(1, 1, 1);
        color = color || makeColor(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Box",
            position: position,
            rotation: rotation,
            locked: false,
            script: boundaryClientScript,
            serverScripts: boundaryServerScript,
            dimensions: dimensions,
            color: color,
            visible: true,
            dynamic: false,
            collisionless: false,
            friction: 10.0,
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createBoundaryDecoraterBoxEntity(name, position, rotation, dimensions, color, userData, parentID) {
        name = name || 1;
        dimensions = dimensions || vec(1, 1, 1);
        color = color || makeColor(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Box",
            position: position,
            rotation: rotation,
            locked: false,
            script: boundaryClientScript,
            serverScripts: boundaryServerScript,
            dimensions: dimensions,
            color: color,
            visible: true,
            dynamic: false,
            collisionless: true,
            friction: 10.0,
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createStartButtonEntity(name, position, rotation, dimensions, color, userData, parentID) {
        name = name || 1;
        dimensions = dimensions || vec(1, 1, 1);
        color = color || makeColor(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Box",
            position: position,
            rotation: rotation,
            locked: false,
            script: startButtonClientScript,
            serverScripts: startButtonServerScript,
            dimensions: dimensions,
            color: color,
            visible: true,
            collisionless: false,
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createOrbEntity(name, position, rotation, dimensions, color, userData, parentID) {
        name = name || 1;
        dimensions = dimensions || vec(1, 1, 1);
        color = color || makeColor(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Sphere",
            position: position,
            rotation: rotation,
            locked: false,
            script: movingOrbClientScript,
            serverScripts: movingOrbServerScript,
            dimensions: dimensions,
            damping: 0,
            friction: 10.0,
            angularDamping: 1.0,
            color: color,
            visible: true,
            collisionless: false,
            dynamic: true,
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createDrumstickModelEntity(name, position, dimensions, rotation, url, userData, parentID) {
        name = name || "";
        dimensions = dimensions || vec(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Model",
            modelURL: url,
            position: position,
            script: drumStickClientScript,
            rotation: rotation,
            locked: false,
            dimensions: dimensions,
            collisionless: false,
            dynamic: true,
            shapeType: "simple-compound",
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createDebugstickEntity(name, position, dimensions, rotation, userData, parentID) {
        name = name || "";
        dimensions = dimensions || vec(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Sphere",
            position: position,
            rotation: rotation,
            locked: false,
            dimensions: dimensions,
            script: drumStickClientScript,
            damping: 1.0,
            collisionless: false,
            dynamic: true,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createDrumstickPadEntity(name, position, dimensions, rotation, url, userData, parentID) {
        name = name || "";
        dimensions = dimensions || vec(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Model",
            modelURL: url,
            position: position,
            script: drumStickPadClientScript,
            rotation: rotation,
            locked: false,
            dimensions: dimensions,
            collisionless: false,
            dynamic: false,
            shapeType: "simple-compound",
            parentID: parentID,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createGameZoneEntity(name, position, rotation, dimensions, userData) {
        name = name || 1;
        dimensions = dimensions || vec(1, 1, 1);
        userData = userData || {};
        var properties = {
            name: name,
            type: "Zone",
            position: position,
            // rotation: rotation,
            locked: false,
            script: gameZoneClientScript,
            serverScripts: gameZoneServerScript,
            dimensions: dimensions,
            collisionless: true,
            userData: userData
        };
        var id = Entities.addEntity(properties);
        return id;
    }

    function createBoundaryBoxes() {
        [LEFT, RIGHT].forEach(function (side) {
            var name,
                entID,
                boundaryPosition,
                color,
                stringified,
                userData = {},
                direction = Quat.getRight(avatarOrientation),
                BOUNDARY_WIDTH = 0.025,
                BOUNDARY_HEIGHT = 1,
                BOUNDARY_DEPTH = 0.4,
                DISTANCE_RIGHT = 0.65,
                DISTANCE_HEIGHT = 0,
                DISTANCE_BACK = 1;

            if (side === RIGHT) {
                boundaryPosition = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        DISTANCE_RIGHT
                    ),
                    centerPlacement
                );
                log(LOG_ARCHIVE, "boundaryPosition1", boundaryPosition)
            } else {
                boundaryPosition = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        -DISTANCE_RIGHT
                    ),
                    centerPlacement
                );
                log(LOG_ARCHIVE, "boundaryPosition2", boundaryPosition)
            }
            userData[BASE_NAME] = { DEBUG: DEBUG };

            userData.grabbableKey = { grabbable: false };
            stringified = JSON.stringify(userData);
            name = BASE_NAME + "Boundary_" + side;
            color = BLUE,
                entID = createBoundaryBoxEntity(
                    name,
                    boundaryPosition,
                    avatarOrientation,
                    vec(BOUNDARY_WIDTH, BOUNDARY_HEIGHT, BOUNDARY_DEPTH),
                    color,
                    stringified,
                    zoneID
                );
            allEnts.push(entID);
            entityNames.push(name);
        });
    }

    function createBoundaryDecoratorBoxes() {
        [LEFT, RIGHT].forEach(function (side) {
            var name,
                name2,
                entID,
                endID2,
                boundaryPosition,
                boundaryPosition2,
                color,
                stringified,
                userData = {},
                direction = Quat.getRight(avatarOrientation),
                ORB_DIAMATER = 0.3,
                BOUNDARY_WIDTH = 0.025,
                BOUNDARY_HEIGHT = (1 - ORB_DIAMATER) / 2,
                BOUNDARY_DEPTH = 0.4,
                DISTANCE_RIGHT = 0.65,
                DISTANCE_HEIGHT = 0,
                DISTANCE_BACK = 1;

            if (side === RIGHT) {
                log(LOG_VALUE, "centerPlacement", centerPlacement);
                var adjustedCenterPlacement = Object.assign({}, centerPlacement);
                adjustedCenterPlacement.y = adjustedCenterPlacement.y - BOUNDARY_HEIGHT;
                log(LOG_VALUE, "adjustedCenterPlacement", adjustedCenterPlacement);
                boundaryPosition = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        DISTANCE_RIGHT - (ORB_DIAMATER / 2)
                    ),
                    adjustedCenterPlacement
                );
                adjustedCenterPlacement = Object.assign({}, centerPlacement);
                adjustedCenterPlacement.y = adjustedCenterPlacement.y + BOUNDARY_HEIGHT;
                log(LOG_VALUE, "adjustedCenterPlacement", adjustedCenterPlacement);
                boundaryPosition2 = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        DISTANCE_RIGHT - (ORB_DIAMATER / 2)
                    ),
                    adjustedCenterPlacement
                );
            } else {
                var adjustedCenterPlacement = Object.assign({}, centerPlacement);
                adjustedCenterPlacement.y = adjustedCenterPlacement.y - BOUNDARY_HEIGHT;
                boundaryPosition = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        -DISTANCE_RIGHT + (ORB_DIAMATER / 2)
                    ),
                    adjustedCenterPlacement
                );
                adjustedCenterPlacement = Object.assign({}, centerPlacement);
                adjustedCenterPlacement.y = adjustedCenterPlacement.y + BOUNDARY_HEIGHT;
                boundaryPosition2 = Vec3.sum(
                    Vec3.multiply(
                        direction,
                        -DISTANCE_RIGHT + (ORB_DIAMATER / 2)
                    ),
                    adjustedCenterPlacement
                );
            }
            userData[BASE_NAME] = { DEBUG: DEBUG };

            userData.grabbableKey = { grabbable: false };
            stringified = JSON.stringify(userData);
            name = BASE_NAME + "Boundary_Decorater_Top" + side;
            name2 = BASE_NAME + "Boundary_Decorater_Bottom" + side;
            color = BLUE,
                entID = createBoundaryDecoraterBoxEntity(
                    name,
                    boundaryPosition,
                    avatarOrientation,
                    vec(BOUNDARY_WIDTH, BOUNDARY_HEIGHT, BOUNDARY_DEPTH),
                    color,
                    stringified,
                    zoneID
                );
            entID2 = createBoundaryDecoraterBoxEntity(
                name2,
                boundaryPosition2,
                avatarOrientation,
                vec(BOUNDARY_WIDTH, BOUNDARY_HEIGHT, BOUNDARY_DEPTH),
                color,
                stringified,
                zoneID
            );
            allEnts.push(entID, entID2);
            entityNames.push(name, name2);
        });
    }

    function createOrb() {
        var name,
            entID,
            orbPosition,
            color,
            stringified,
            userData = {},
            ORB_WIDTH = 0.3,
            ORB_HEIGHT = 0.3,
            ORB_DEPTH = 0.3,
            DISTANCE_LEFT = 0,
            DISTANCE_HEIGHT = 0,
            DISTANCE_BACK = 0;

        orbPosition = Vec3.sum(
            centerPlacement,
            vec(DISTANCE_LEFT, DISTANCE_HEIGHT, DISTANCE_BACK)
        );
        userData[BASE_NAME] = { DEBUG: DEBUG };

        userData.grabbableKey = { grabbable: false };
        stringified = JSON.stringify(userData);
        name = BASE_NAME + "Orb";
        color = RED,
            entID = createOrbEntity(
                name,
                orbPosition,
                avatarOrientation,
                vec(ORB_WIDTH, ORB_HEIGHT, ORB_DEPTH),
                color,
                stringified,
                zoneID
            );
        allEnts.push(entID);
        entityNames.push(name);
    }

    function createDrumstickModels() {
        [LEFT, RIGHT].forEach(function (side) {
            var name,
                entID,
                modelPosition,
                rotation,
                url,
                stringified,
                userData = {},
                DISTANCE_RIGHT = 0.52,
                HEIGHT = 0,
                DISTANCE_BACK = -0.70,
                MODEL_WIDTH = 0.0131,
                MODEL_HEIGHT = 0.4144,
                MODEL_DEPTH = 0.0131,
                leftHandPosition = {
                    "x": -0.02,//-0.0881,
                    "y": 0.135,
                    "z": 0.02
                },
                leftHandRotation = Quat.fromPitchYawRollDegrees(90, -45, 0),
                rightHandPosition = Vec3.multiplyVbyV(leftHandPosition, { x: -1, y: 1, z: 1 }),
                rightHandRotation = Quat.fromPitchYawRollDegrees(90, 45, 0);

            if (side === RIGHT) {
                modelPosition = Vec3.sum(
                    Vec3.multiply(
                        Quat.getRight(avatarOrientation),
                        DISTANCE_RIGHT
                    ),
                    avatarPosition
                );
                userData.equipHotspots = [{
                    position: { x: 0, y: 0, z: 0 },
                    radius: 0.25,
                    joints: {
                        RightHand: [
                            rightHandPosition,
                            rightHandRotation
                        ],
                        LeftHand: [
                            leftHandPosition,
                            leftHandRotation
                        ]
                    }
                }];
            } else {
                modelPosition = Vec3.sum(
                    Vec3.multiply(
                        Quat.getRight(avatarOrientation),
                        -DISTANCE_RIGHT
                    ),
                    avatarPosition
                );
                // userData.wearable = {
                //     joints: {
                //         LeftHand: [
                //             leftHandPosition,
                //             leftHandRotation
                //         ]
                //     }
                // }
            }

            name = BASE_NAME + "Drumstick_" + side;
            rotation = Quat.fromPitchYawRollDegrees(0, 0, 0);
            userData.grabbableKey = { grabbable: true };
            userData[BASE_NAME] = { DEBUG: DEBUG };
            stringified = JSON.stringify(userData);
            url = drumStickModelURL;
            entID = createDrumstickModelEntity(
                name,
                modelPosition,
                vec(MODEL_WIDTH, MODEL_HEIGHT, MODEL_DEPTH),
                rotation,
                url,
                stringified,
                zoneID
            );
            allEnts.push(entID);
            entityNames.push(name);
        });
    }

    function createDebugSticks() {
        [LEFT, RIGHT].forEach(function (side) {
            var name,
                entID,
                modelPosition,
                rotation,
                url,
                stringified,
                userData = {},
                DISTANCE_RIGHT = 0.52,
                MODEL_WIDTH = 0.0131,
                MODEL_HEIGHT = 0.4544,
                MODEL_DEPTH = 0.0131,
                leftHandPosition = {
                    "x": -MODEL_HEIGHT / 2,
                    "y": 0.06,
                    "z": 0.03
                },
                leftHandRotation = Quat.fromPitchYawRollDegrees(90, 90, 0),
                rightHandPosition = Vec3.multiplyVbyV(leftHandPosition, { x: -1, y: 1, z: 1 }),
                rightHandRotation = Quat.fromPitchYawRollDegrees(90, 90, 0);

            userData.equipHotspots = [{
                position: { x: 0, y: +MODEL_HEIGHT / 2, z: 0 },
                radius: 0.25,
                joints: {
                    RightHand: [
                        rightHandPosition,
                        rightHandRotation
                    ],
                    LeftHand: [
                        leftHandPosition,
                        leftHandRotation
                    ]
                }
            }];

            if (side === RIGHT) {
                modelPosition = Vec3.sum(
                    Vec3.multiply(
                        Quat.getRight(avatarOrientation),
                        DISTANCE_RIGHT
                    ),
                    avatarPosition
                );
            } else {
                modelPosition = Vec3.sum(
                    Vec3.multiply(
                        Quat.getRight(avatarOrientation),
                        -DISTANCE_RIGHT
                    ),
                    avatarPosition
                );
            }

            name = BASE_NAME + "Drumstick_" + side;
            rotation = Quat.fromPitchYawRollDegrees(0, 0, 0);
            userData.grabbableKey = { grabbable: true };
            userData[BASE_NAME] = { DEBUG: DEBUG };
            stringified = JSON.stringify(userData);
            entID = createDebugstickEntity(
                name,
                modelPosition,
                vec(MODEL_WIDTH, MODEL_HEIGHT, MODEL_DEPTH),
                rotation,
                stringified
            );
            allEnts.push(entID);
            entityNames.push(name);
        });
    }

    function createDrumstickPads() {
        [LEFT, RIGHT].forEach(function (side) {
            var name,
                entID,
                modelPosition,
                rotation,
                url,
                stringified,
                userData = {},
                DISTANCE_RIGHT = 0.30,
                DISTANCE_FORWARD = 0.30,
                MODEL_WIDTH = 0.3,
                MODEL_HEIGHT = 0.2,
                MODEL_DEPTH = 0.3;

            if (side === RIGHT) {
                modelPosition = Vec3.sum(
                    avatarPosition,
                    Vec3.sum(
                        Vec3.multiply(Quat.getForward(avatarOrientation), DISTANCE_FORWARD),
                        Vec3.multiply(Quat.getRight(avatarOrientation), DISTANCE_RIGHT)
                    )
                );
            } else {
                modelPosition = Vec3.sum(
                    avatarPosition,
                    Vec3.sum(
                        Vec3.multiply(Quat.getForward(avatarOrientation), DISTANCE_FORWARD),
                        Vec3.multiply(Quat.getRight(avatarOrientation), -DISTANCE_RIGHT)
                    )
                );
            }

            name = BASE_NAME + "Drumstick_Pads_" + side;
            rotation = Quat.fromPitchYawRollDegrees(0, 0, 0);
            userData.grabbableKey = { grabbable: false };
            userData[BASE_NAME] = { DEBUG: DEBUG };
            stringified = JSON.stringify(userData);
            url = drumStickModelURL;
            entID = createDrumstickPadEntity(
                name,
                modelPosition,
                vec(MODEL_WIDTH, MODEL_HEIGHT, MODEL_DEPTH),
                rotation,
                url,
                stringified,
                zoneID
            );
            allEnts.push(entID);
            entityNames.push(name);
        });
    }

    function createGameZone() {
        var name,
            entID,
            stringified,
            userData = {},
            HEIGHT = 0.0,
            DISTANCE_BACK = -0.9,
            ZONE_WIDTH = 2,
            ZONE_HEIGHT = 2,
            ZONE_DEPTH = 1.3;

        name = BASE_NAME + "Gamezone";
        userData.grabbableKey = { grabbable: false };
        userData[BASE_NAME] = { DEBUG: DEBUG };
        stringified = JSON.stringify(userData);
        entID = createGameZoneEntity(
            name,
            centerPlacement,
            avatarOrientation,
            vec(ZONE_WIDTH, ZONE_HEIGHT, ZONE_DEPTH),
            stringified
        );
        zoneID = entID;
        allEnts.push(entID);
        entityNames.push(name);
    }

    function createStartButton() {
        var name,
            entID,
            buttonPosition,
            color,
            stringified,
            userData = {},
            direction = Quat.getRight(avatarOrientation),
            BUTTON_WIDTH = 0.2,
            BUTTON_HEIGHT = 0.2,
            BUTTON_DEPTH = 0.4,
            DISTANCE_RIGHT = 1,
            DISTANCE_HEIGHT = 0,
            DISTANCE_BACK = 0;

        buttonPosition = Vec3.sum(
            Vec3.multiply(
                direction,
                DISTANCE_RIGHT
            ),
            avatarPosition
        );
        userData[BASE_NAME] = { DEBUG: DEBUG };

        userData.grabbableKey = { grabbable: false };
        stringified = JSON.stringify(userData);
        name = BASE_NAME + "StartButton";
        color = GREEN,
            entID = createStartButtonEntity(
                name,
                buttonPosition,
                avatarOrientation,
                vec(BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_DEPTH),
                color,
                stringified,
                zoneID
            );
        allEnts.push(entID);
        entityNames.push(name);
    }

    // Main
    deleteIfExists();
    createGameZone();
    createBoundaryBoxes();
    createBoundaryDecoratorBoxes();
    createOrb();
    // createDrumstickModels();
    createDebugSticks();
    createDrumstickPads();
    createStartButton();

    Settings.setValue(BASE_NAME, entityNames);

    // Cleanup
    function scriptEnding() {
        allEnts.forEach(function (ent) {
            Entities.deleteEntity(ent);
        });
    }

    Script.scriptEnding.connect(scriptEnding);
}());