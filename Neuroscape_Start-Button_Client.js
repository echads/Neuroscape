
(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var searchForEntityNames = Util.Entity.searchForEntityNames;


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
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        position = {},
        collisionIDS = {
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null
        },
        collisionNames = Object.keys(collisionIDS);

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_StartButton_Client() {
        self = this;
    }

    Neuroscape_StartButton_Client.prototype = {
        remotelyCallable: [
        ],
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
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
        onClick: function () {
            log(LOG_ENTER, "START BUTTON CLICKED");
            Entities.callEntityServerMethod(gameZoneID, "toggleGame", [MyAvatar.sessionUUID]);
        },
        clickDownOnEntity: function (entityID, mouseEvent) {
            if (mouseEvent.isLeftButton) {
                this.onClick();
            }
        },
        stopNearTrigger: function () {
            this.onClick();
        },
        stopFarTrigger: function () {
            this.onClick();
        },
        collisionWithEntity: function (myID, theirID, collision) {
            if (collision.type === 0 ) {
                switch (theirID) {
                    case collisionIDS[STICK_LEFT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + STICK_LEFT);
                        this.onClick();

                        break;
                    case collisionIDS[STICK_RIGHT]:
                        log(LOG_ENTER, name + " COLLISION WITH: " + STICK_RIGHT);
                        this.onClick();
                        break;
                    default:
                }
            }
        },
        unload: function () {
        }
    };

    return new Neuroscape_StartButton_Client();
});
