// Neuroscape_Diagnostic.js
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
    var isAppActive = false,
        isTabletUIOpen = false,
        MESSAGE_CHANNEL = "messages.neuroscape",
        UPDATE_PLAYER_NAME = "update_player_name",
        SAVE_JSON = "saveJSON",
        UPDATE_MESSAGE = "updateMessage",
        RESTART_GAME = "restart_game",
        UPDATE_UI = "update_ui";

    // Collections
    var defaultSettings = {
            playerName: "",
            gameRunning: false,
            message: null,
            ui: {
                enterPlayerName: true,
                showMessage: false,
                gameRunning: false,
                gameEnding: false
            }
        },
        settings = Object.assign({}, defaultSettings);


    // Helper Functions
    function setAppActive(active) {
        // Start/stop application activity.
        if (active) {
            console.log("Start app");
            // TODO: Start app activity.
        } else {
            console.log("Stop app");
            // TODO: Stop app activity.
        }
        isAppActive = active;
    }

    // Constructor Functions

    // Procedural Functions
    function updatePlayerName(playerName) {
        var message = JSON.stringify({
            type: UPDATE_PLAYER_NAME,
            value: playerName
        })
        Messages.sendMessage(MESSAGE_CHANNEL, message);
        settings.playerName = playerName;
        settings.ui.enterPlayerName = false;
    }

    function updateMessage(message) {
        settings.message = message;
        settings.ui.showMessage = true;
        doUIUpdate();
    }

    function restartGame() {
        var message = JSON.stringify({
            type: RESTART_GAME
        });

        Messages.sendMessage(MESSAGE_CHANNEL, message);
        settings.playerName = "";
        settings.ui.enterPlayerName = true;
        settings.ui.showMessage = false;
        settings.ui.gameEnding = false;
    }

    function saveJSON(gameData) {
        settings.ui.gameEnding = true;
        tablet.emitScriptEvent(JSON.stringify({
            type: SAVE_JSON,
            value: gameData
        }));        
    }

    function onMessageReceived(channel, message, sender, localOnly) {
        if (channel !== MESSAGE_CHANNEL) {
            return;
        }

        var data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        switch (data.type) {
            case UPDATE_MESSAGE:
                var newMessage = data.value;
                updateMessage(newMessage);
                break;
            case SAVE_JSON:
                var newMessage = data.value;
                saveJSON(newMessage);
                doUIUpdate();
                break;
            default:
        }
    }

    function setup() {
        tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
        tabletButton = tablet.addButton({
            text: buttonName,
            icon: "icons/tablet-icons/raise-hand-i.svg",
            activeIcon: "icons/tablet-icons/raise-hand-a.svg",
            isActive: isAppActive
        });
        if (tabletButton) {
            tabletButton.clicked.connect(onTabletButtonClicked);
        } else {
            console.error("ERROR: Tablet button not created! App not started.");
            tablet = null;
            return;
        }
        tablet.gotoHomeScreen();
        tablet.screenChanged.connect(onTabletScreenChanged);

        Messages.subscribe(MESSAGE_CHANNEL);
        Messages.messageReceived.connect(onMessageReceived);

        Script.require("./Neuroscape_Spawner.js?" + Date.now());

    }

    function doUIUpdate() {
        tablet.emitScriptEvent(JSON.stringify({
            type: UPDATE_UI,
            value: settings
        }));
    }

    // Tablet
    var tablet = null,
        buttonName = "Neuroscape",
        tabletButton = null,
        APP_URL = Script.resolvePath('./Tablet/Neuroscape-Tablet.html'),
        EVENT_BRIDGE_OPEN_MESSAGE = "eventBridgeOpen",
        SET_ACTIVE_MESSAGE = "setActive",
        CLOSE_DIALOG_MESSAGE = "closeDialog";


    function onTabletButtonClicked() {
        // Application tablet/toolbar button clicked.
        if (isTabletUIOpen) {
            tablet.gotoHomeScreen();
        } else {
            // Initial button active state is communicated via URL parameter so that active state is set immediately without 
            // waiting for the event bridge to be established.
            tablet.gotoWebScreen(APP_URL + "?active=" + isAppActive);
        }
    }

    function onTabletScreenChanged(type, url) {
        // Tablet screen changed / desktop dialog changed.
        var wasTabletUIOpen = isTabletUIOpen;

        isTabletUIOpen = url.substring(0, APP_URL.length) === APP_URL; // Ignore URL parameter.
        if (isTabletUIOpen === wasTabletUIOpen) {
            return;
        }

        if (isTabletUIOpen) {
            tablet.webEventReceived.connect(onTabletWebEventReceived);
        } else {
            // setUIUpdating(false);
            tablet.webEventReceived.disconnect(onTabletWebEventReceived);
        }
    }

    function onTabletWebEventReceived(data) {
        // EventBridge message from HTML script.
        var message;
        try {
            message = JSON.parse(data);
        } catch (e) {
            return;
        }

        switch (message.type) {
            case EVENT_BRIDGE_OPEN_MESSAGE:
                doUIUpdate();
                break;
            case SET_ACTIVE_MESSAGE:
                if (isAppActive !== message.value) {
                    tabletButton.editProperties({
                        isActive: message.value
                    });
                    setAppActive(message.value);
                }
                tablet.gotoHomeScreen(); // Automatically close app.
                break;
            case UPDATE_PLAYER_NAME:
                log(LOG_VALUE, "From TAblet: IN UPDATE PLAYER NAME", data);
                var playerName = message.value;
                updatePlayerName(playerName);
                doUIUpdate();
                break;
            case RESTART_GAME:
                restartGame();
                doUIUpdate();
                break;
            case CLOSE_DIALOG_MESSAGE:
                tablet.gotoHomeScreen();
                break;
        }
    }

    // Main
    setup();

    // Cleanup
    function scriptEnding() {
        console.log("### in script ending");
        if (isAppActive) {
            setAppActive(false);
        }
        if (isTabletUIOpen) {
            tablet.webEventReceived.disconnect(onTabletWebEventReceived);
        }
        if (tabletButton) {
            tabletButton.clicked.disconnect(onTabletButtonClicked);
            tablet.removeButton(tabletButton);
            tabletButton = null;
        }
        tablet = null;

        Messages.messageReceived.disconnect(onMessageReceived);
        Messages.unsubscribe(MESSAGE_CHANNEL);
    }

    Script.scriptEnding.connect(scriptEnding);
}());
