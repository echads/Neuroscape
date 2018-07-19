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
        gameInterval = null,
        overlay = null,
        position
        SEARCH_FOR_CHILDREN_TIMEOUT = 5000,
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
        overlayInfo = {},
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
            "toggleGame",
            "updateOverlay"
        ],
        preload: function (id) {
            entityID = id;
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

            // searchForChildren(entityID, childrenNames, function(children) {
            //     loadedChildren = true;
            //     Object.keys(children).forEach(function(name) {
            //         childrenIDS[name] = children[name];
            //     });
            //     log(LOG_ENTER, "FOUND ALL CHILDREN");
            //     self.setOrbPositions();
            // }, SEARCH_FOR_CHILDREN_TIMEOUT);

            overlay = Overlays.addOverlay("text3d", {
                position: Vec3.sum(
                    position, 
                    Vec3.sum(
                        Vec3.multiply(Quat.getForward(MyAvatar.orientation), 0.5),
                        Vec3.multiply(Quat.getRight(MyAvatar.orientation), 0.25)
                )
                ),
                // position: position,
                rotation: MyAvatar.orientation,
                isFacingAvatar: false,
                lineHeight: 0.030,
                backgroundAlpha: 0.85,
                text: "test"
            });
        },
        updateOverlay: function(id, param) {
            var text = JSON.parse(param[0]);
            text = JSON.stringify(text)
                .split(",").join("\n\t")
                .split("{").join("\n")
                .split("}").join("\n");

            var properties = {
                text: text
            };
            
            Overlays.editOverlay(overlay, properties);
        },
        reset: function() {
        },
        unload: function () {
            Overlays.deleteOverlay(overlay);
        }
    };

    return new Neuroscape_Gamezone_Server();
});
