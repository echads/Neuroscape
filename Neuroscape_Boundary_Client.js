
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
        gameZoneID,
        currentAV = null,
        lineOverlay = null,
        LINEHEIGHT = 2,
        OVERLAY_DELETE_TIME = 200,
        LINE_WIDTH = 2.0,
        SOUND_URL = "https://hifi-content.s3.amazonaws.com/milad/ROLC/Organize/O_Projects/Hifi/Scripts/Neuroscape/bell.wav?3",
        sound = null,
        HIT_TIME = 100,
        ORB = "Neuroscape_Orb",
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        DEBOUNCE_TIME = 250,
        ON = "on",
        OFF = "off",
        CONTINUOUS = "continuous",
        AUDIO = "audio",
        VISUAL = "visual",
        AUDIOVISUAL = "audiovisual",
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
    function Neuroscape_Boundary_Client() {
        self = this;
    }

    Neuroscape_Boundary_Client.prototype = {
        remotelyCallable: [
            "update"
        ],
        clickDownOnEntity: function (entityID, mouseEvent) {
            if (mouseEvent.isLeftButton) {
                this.makeOverlay(this.getOrbPosition());                
            }
        },
        collisionWithEntity: function (myID, theirID, collision) {
            if (collision.type === 0 ) {
                switch (theirID) {
                    case collisionIDS[STICK_LEFT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + STICK_LEFT);

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
                        log(LOG_ENTER, name + " COLLISION WITH: " + STICK_RIGHT);

                        var newCollision = {
                            time: Date.now(),
                            id: STICK_RIGHT
                        }
                        if (debounce(DEBOUNCE_TIME)) {
                            this.makeOverlay(this.getOrbPosition());
                            Entities.callEntityServerMethod(gameZoneID, "recordCollision", [JSON.stringify(newCollision)]);
                        }
                        break;
                    case collisionIDS[ORB]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + ORB);
                        if (currentAV === AUDIOVISUAL || currentAV === AUDIO) {
                            this.playSound(position);
                        }
                        if (currentAV === AUDIOVISUAL || currentAV === VISUAL) {
                            Entities.callEntityServerMethod(entityID, "hitColor");
                            Script.setTimeout(function() {
                                Entities.callEntityServerMethod(entityID, "restColor");
                            }, HIT_TIME);
                        }
                        
                        var newCollision = {
                            time: Date.now(),
                            id: ORB
                        };

                        Entities.callEntityServerMethod(gameZoneID, "recordCollision", [JSON.stringify(newCollision)]);
                        break;

                    default:
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
            }
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
            gameZoneID = currentProperties.parentID;

            sound = SoundCache.getSound(SOUND_URL);
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
        playSound: function(position) {
            if (typeof position === "string") {
                position = JSON.parse(position);
            }
            Audio.playSound(sound, {
                position: position,
                volume: 0.5
            });
        },
        unload: function () {
        },
        update: function (id, param) {
            log(LOG_VALUE, name + " RECEIVED UPDATE:" + name, param);
            var options = JSON.parse(param[0]);
            currentAV = options.av;
        }
    };

    return new Neuroscape_Boundary_Client();
});
