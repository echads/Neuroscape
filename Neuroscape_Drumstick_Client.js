
(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var vec = Util.Maths.vec,
        searchForEntityNames = Util.Entity.searchForEntityNames;

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
        name,
        gameZoneID,
        position,
        startPosition,
        hand = null,
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        HAPTIC_STRENGTH = 1.0,
        HAPTIC_DURATION = 100,
        LEFT_HAND = 0,
        RIGHT_HAND = 1,
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        PAD_LEFT = "Neuroscape_Drumstick_Pads_Left",
        PAD_RIGHT = "Neuroscape_Drumstick_Pads_Right",
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        collisionIDS = {
            Neuroscape_Boundary_Left: null,
            Neuroscape_Boundary_Right: null,
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null,
            Neuroscape_Drumstick_Pads_Left: null,
            Neuroscape_Drumstick_Pads_Right: null
        },
        collisionNames = Object.keys(collisionIDS);

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_Drumstick_Client() {
        self = this;
    }

    Neuroscape_Drumstick_Client.prototype = {
        remotelyCallable: [
            "update",
            "moveDirection",
            "reset",
            "setOrbPositionTo"
        ],
        collisionWithEntity: function (myID, theirID, collision) {
            if (collision.type === 0 ) {
                switch (theirID) {
                    case collisionIDS[BOUNDARY_LEFT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + BOUNDARY_LEFT);
                        // Entities.callEntityServerMethod(entityID, "moveDirection", [DIRECTION_ONE]);

                        Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        break;
                    case collisionIDS[BOUNDARY_RIGHT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + BOUNDARY_RIGHT);
                        // Entities.callEntityServerMethod(entityID, "moveDirection", [DIRECTION_TWO]);
                        Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        break;
                    case collisionIDS[PAD_LEFT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + PAD_LEFT);
                        // Entities.callEntityServerMethod(entityID, "moveDirection", [DIRECTION_ONE]);
                        Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        break;
                    case collisionIDS[PAD_RIGHT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + PAD_RIGHT);
                        // Entities.callEntityServerMethod(entityID, "moveDirection", [DIRECTION_TWO]);
                        Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        break;
                    default:
                }
            }
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            hand = name.indexOf("Left") > -1 ? LEFT_HAND : RIGHT_HAND;
            position = currentProperties.position;
            gameZoneID = currentProperties.parentID;

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties.BASE_NAME.DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }
            searchForEntityNames(collisionNames, position, function(children) {
                Object.keys(children).forEach(function(name) {
                    collisionIDS[name] = children[name];
                });
                log(LOG_ENTER, "FOUND ALL COLLISION NAMES");
            }, SEARCH_FOR_NAMES_TIMEOUT);
        },
        unload: function () {
        }
    };

    return new Neuroscape_Drumstick_Client();
});
