
(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var makeColor = Util.Color.makeColor,
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
        RED = makeColor(255, 0, 0),
        GREEN = makeColor(0, 255, 0),
        BLUE = makeColor(0, 0, 255),
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {};

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_StartButton_Server() {
        self = this;
    }

    Neuroscape_StartButton_Server.prototype = {
        remotelyCallable: [
            "changeColor"
        ],
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            gameZoneID = currentProperties.parentID;
            
            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }
        },
        changeColor: function(id, param) {
            log(LOG_ENTER, "CHANGE COLOR CALLED");
            var colorToChangeTo = param[0];
            var color;
            if (colorToChangeTo === "red") {
                log(LOG_ENTER, "CHANGING COLOR TO RED");
                color = RED;
            } else {
                log(LOG_ENTER, "CHANGING COLOR TO GREEN");
                color = GREEN;
            }
            Entities.editEntity(entityID, { color: color });
        },
        unload: function () {
        }
    };

    return new Neuroscape_StartButton_Server();
});
