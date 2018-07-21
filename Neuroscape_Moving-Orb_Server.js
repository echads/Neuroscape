
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

    LOG_CONFIG[LOG_ENTER] = false;
    LOG_CONFIG[LOG_UPDATE] = false;
    LOG_CONFIG[LOG_ERROR] = false;
    LOG_CONFIG[LOG_VALUE] = false;
    LOG_CONFIG[LOG_ARCHIVE] = false;
    var log = Util.Debug.log(LOG_CONFIG);

    // Init 
    var BASE_NAME = "Neuroscape_",
        entityID,
        name,
        gameZoneID,
        startPosition,
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
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
        directionOne = {},
        directionTwo = {};

        // Entity Definition
    function Neuroscape_MovingOrb_Server() {
        self = this;
    }

    Neuroscape_MovingOrb_Server.prototype = {
        remotelyCallable: [
            "moveOrb",
            "moveDirection",
            "reset",
            "setOrbPositionTo",
            "update"
        ],
        moveOrb: function(id, param) {
            log(LOG_ARCHIVE, "Moving Orb");
            var props = {};
            var velocity = JSON.parse(param[0]);
            log(LOG_ARCHIVE, "ORB VELOCITY", velocity);
            props.velocity = velocity;            
            Entities.editEntity(entityID, props);
        },
        moveDirection: function(id, param) {
            log(LOG_ARCHIVE, "Moving Orb Direction");
            var props = {};
            var direction = param[0];
            if (direction === DIRECTION_ONE) {
                props.velocity = directionOne;  
            } else {
                props.velocity = directionTwo;  
            }
            Entities.editEntity(entityID, props);
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            gameZoneID = currentProperties.parentID;
            startPosition = currentProperties.position;

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }
        },
        reset: function() {
            var props = {};
            props.position = startPosition;
            props.velocity = vec(0,0,0);
            Entities.editEntity(entityID, props);
        },
        setOrbPositionTo: function(id, param) {
            log(LOG_ARCHIVE, "SETTING MOVE ORB POSITION TO");
            var positionToMoveTo = JSON.parse(param[0]);
            var props = {};
            props.position = positionToMoveTo;
            Entities.editEntity(entityID, props);
        },
        unload: function () {
        },
        update: function (id, param) {
            log(LOG_ARCHIVE, "RECEIVED UPDATE:" + name, param);
            var options = JSON.parse(param[0]);
            visualCue = options.visualCue;
            audioCue = options.audioCue;
            directionOne = options.directionOne;
            directionTwo = options.directionTwo;
        }
    };

    return new Neuroscape_MovingOrb_Server();
});
