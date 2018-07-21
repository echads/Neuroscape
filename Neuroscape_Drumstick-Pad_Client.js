
(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var debounce = Util.Functional.debounce(),    
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
        position,
        dimensions,
        gameZoneID,
        lineOverlay = null,
        bottomY = 0,
        Y_MARGIN = 0.070,
        DEBOUNCE_TIME = 200,
        LINEHEIGHT = 2,
        OVERLAY_DELETE_TIME = 200,
        LINE_WIDTH = 2.0,
        ORB = "Neuroscape_Orb",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        MOUSE_PRESS = "Mouse_Press",
        ON = "on",
        OFF = "off",
        CONTINUOUS = "continuous",
        AUDIO = "audio",
        VISUAL = "visual",
        AUDIOVISUAL = "audiovisual",
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        collisionIDS = {
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null,
            Neuroscape_Orb: null
        },
        collisionNames = Object.keys(collisionIDS);

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_DrumstickPad_Client() {
        self = this;
    }

    Neuroscape_DrumstickPad_Client.prototype = {
        remotelyCallable: [
            "update",
            "updateStickLatency"
        ],
        clickDownOnEntity: function (entityID, mouseEvent) {
            if (mouseEvent.isLeftButton) {
                this.makeOverlay(this.getOrbPosition());                
            }
        },
        collisionWithEntity: function (myID, theirID, collision) {
            if (collision.type === 0 ) {
                if (collision.contactPoint.y < bottomY + Y_MARGIN) {
                    log(LOG_ARCHIVE, "RETURNING FROM BOTTOM COLLISION");
                    return;
                }
                log(LOG_ARCHIVE, name + " Collision info", collision);
                switch (theirID) {
                    case collisionIDS[STICK_LEFT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + STICK_LEFT);

                        var newCollision = {
                            time: Date.now(),
                            id: STICK_LEFT
                        }
                        if (debounce(DEBOUNCE_TIME)) {
                            this.makeOverlay(this.getOrbPosition());
                            Entities.callEntityServerMethod(gameZoneID, "recordCollision", [JSON.stringify(newCollision)]);
                        }
                        break;
                    case collisionIDS[STICK_RIGHT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + STICK_RIGHT);

                        var newCollision = {
                            time: Date.now(),
                            id: STICK_RIGHT
                        }
                        if (debounce(DEBOUNCE_TIME)) {
                            this.makeOverlay(this.getOrbPosition());
                            Entities.callEntityServerMethod(gameZoneID, "recordCollision", [JSON.stringify(newCollision)]);
                        }
                        break;
                    default:
                }
            }
        },
        clickDownOnEntity: function (entityID, mouseEvent) {
            if (mouseEvent.isLeftButton) {
                var newCollision = {
                    time: Date.now(),
                    id: MOUSE_PRESS
                };
                if (debounce(DEBOUNCE_TIME)) {
                    this.makeOverlay(this.getOrbPosition());
                    Entities.callEntityServerMethod(gameZoneID, "recordCollision", [JSON.stringify(newCollision)]);
                }

            }
        },
        getOrbPosition: function () {
            return Entities.getEntityProperties(collisionIDS[ORB], ["position"]).position;
        },
        makeOverlay: function (position) {
            var start = Object.assign({}, position, { y: position.y - LINEHEIGHT});
            var end = Object.assign({}, position, { y: position.y + LINEHEIGHT});
            var lineProps = {
                lineWidth: LINE_WIDTH,
                isDashedLine: true,
                start: start,
                end: end
            };
            lineOverlay = Overlays.addOverlay("line3d", lineProps);
            Script.setTimeout(function() {
                Overlays.deleteOverlay(lineOverlay);
                lineOverlay = null;
            }, OVERLAY_DELETE_TIME);
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            position = currentProperties.position;
            dimensions = currentProperties.dimensions;
            gameZoneID = currentProperties.parentID;

            bottomY = position.y - (dimensions.y / 2);

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
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
        },
        updateStickLatency: function (id, param) {
            log(LOG_ENTER, name + " IN UPDATE STICK LATENCY", param);
            var stick = param[0];
            var speed = param[1];
            var latency = param[2];
            
            Entities.callEntityMethod(collisionIDS[stick], "editColor", [speed, latency]);
        },
        update: function (id, param) {
            log(LOG_ARCHIVE, "RECEIVED UPDATE:" + name, param);
            var options = JSON.parse(param[0]);
            visualCue = options.visualCue;
        }
    };

    return new Neuroscape_DrumstickPad_Client();
});
