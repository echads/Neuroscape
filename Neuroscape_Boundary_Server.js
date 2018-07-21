
(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var makeColor = Util.Color.makeColor;
    
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
        restColor,
        hitColor = makeColor(80, 120, 255),
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
        userdataProperties = {};

    // Entity Definition
    function Neuroscape_Boundary_Server() {
        self = this;
    }

    Neuroscape_Boundary_Server.prototype = {
        remotelyCallable: [
            "hitColor",
            "restColor",
            "update"
        ],
        hitColor: function(id, param) {
            log(LOG_ARCHIVE, "Hit Color");
            var props = {};
            props.color = hitColor;            
            Entities.editEntity(entityID, props);
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            gameZoneID = currentProperties.parentID;
            restColor = currentProperties.color;

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }
        },
        restColor: function(id, param) {
            log(LOG_ARCHIVE, "Rest Color");
            var props = {};
            props.color = restColor;
            Entities.editEntity(entityID, props);
        },
        unload: function () {
        },
        update: function (id, param) {
            log(LOG_ARCHIVE, "RECEIVED UPDATE:" + name, param);
            var options = JSON.parse(param[0]);
        }
    };

    return new Neuroscape_Boundary_Server();
});
