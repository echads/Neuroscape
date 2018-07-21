// Neuroscape_Diagnostic.js
//
// Created by Milad Nazeri on 2018-06-19
//
// Copyright 2018 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function() {
    // Polyfills
    Script.require(Script.resolvePath('./Polyfills.js'));

    // Init
    var isAppActive = false,
        isTabletUIOpen = false,
        SETTINGS_STRING = "io.kayla.camera.settings",
        LOAD_JSON = "loadJSON",
        UPDATE_CONFIG_NAME = "updateConfigName",
        ENABLE_CUSTOM_LISTENER = "enableCustomListener",
        DISABLE_CUSTOM_LISTENER = "disableCustomListener",
        UPDATE_CUSTOM_LISTENER = "updateCustomListener",
        ADD_CAMERA_POSITION = "addCameraPosition",
        EDIT_CAMERA_POSITION_KEY = "editCameraPositionKey",
        REMOVE_CAMERA_POSITION = "removeCameraPosition",
        EDIT_CAMERA_POSITION_NAME = "editCameraPositionName",
        CHANGE_AVATAR_TO_CAMERA = "changeAvatarToCamera",
        CHANGE_AVATAR_TO_INVISIBLE = "changeAvatarToInvisible",
        TOGGLE_AVATAR_COLLISIONS = "toggleAvatarCollisions",
        UPDATE_UI = "update_ui";

    // Collections
    var defaultSettings = {
        configName: "Rename config",
        mapping: {},
        listener: {
            isCustomListening: false,
            customPosition: {
                x: 0,
                y: 0,
                z: 0
            },
            customOrientation: {
                x: 0,
                y: 0,
                z: 0,
                w: 0
            }
        }
    };
    var settings;
    var oldSettings = Settings.getValue(SETTINGS_STRING);
    console.log("oldSettings", JSON.stringify(oldSettings));
    if (oldSettings === "") {
        settings = defaultSettings;
        Settings.setValue(SETTINGS_STRING, settings);
    } else {
        settings = oldSettings;
    }
    
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
    function loadJSON(newSettings) {
        settings = newSettings;
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
    }

    function doUIUpdate() {
        console.log("SETTINGs", JSON.stringify(settings));
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
            case LOAD_JSON:
                var settings = message.value;
                loadJSON(settings);
                updateSettings();
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
    }

    Script.scriptEnding.connect(scriptEnding);
}());
