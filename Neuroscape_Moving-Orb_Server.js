
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
        startPosition,
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {};

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_MovingOrb_Server() {
        self = this;
    }

    Neuroscape_MovingOrb_Server.prototype = {
        remotelyCallable: [
            "moveOrb",
            "reset",
            "setOrbPositionTo"
        ],
        moveOrb: function(id, param) {
            log(LOG_ARCHIVE, "Moving Orb");
            var props = {};
            var velocity = JSON.parse(param[0]);
            log(LOG_ARCHIVE, "ORB VELOCITY", velocity);
            props.velocity = velocity;            
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
                DEBUG = userdataProperties.BASE_NAME.DEBUG;
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
        }
    };

    return new Neuroscape_MovingOrb_Server();
});
