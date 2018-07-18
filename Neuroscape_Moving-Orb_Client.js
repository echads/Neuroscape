/* globals Script, Entities, Controller*/
(function () {

    var _selfID;

    var LEFT_BOUNDARY_ID = "{0eedbea7-aea7-4807-bcbc-54e8b69a383f}";
    var RIGHT_BOUNDARY_ID = "{eddd740b-7574-432b-94f1-ce5bb413bf62}";

    var ORIGIN_POINT = { x: 22.5, y: -11.26, z: 3.6 };

    var diagnosticStartTime, mostRecentPointTimed, mostRecentTriggerTime, diagnosticEndTime;
    var DIAGNOSTIC_LENGTH = 30000;
    var DiagnosticOrb = function () { };

    var diagnosticBeginKey = 'r';

    var hasActiveDiagnostic = false;

    var lastCollisionTime = Date.now();

    var MAPPING_NAME = "Diagnostic Mapping";

    function beginDiagnostic() {
        print("Beginning Diagnostic");
        hasActiveDiagnostic = true;
        diagnosticStartTime = Date.now();
        lastCollisionTime = Date.now();
        Entities.callEntityServerMethod(_selfID, 'beginDiagnostic');
        Entities.editEntity(_selfID, { 'velocity': { x: 1.0, y: 0.0, z: 0.0 }, 'position': ORIGIN_POINT });
        var mapping = Controller.newMapping(MAPPING_NAME);
        mapping.from(Controller.Standard.A).to(recordTriggerPull);
        Controller.enableMapping(MAPPING_NAME);
        Script.update.connect(update);
    }

    function endDiagnostic() {
        print("Ending Diagnostic");
        hasActiveDiagnostic = false;
        diagnosticEndTime = Date.now();
        Entities.callEntityServerMethod(_selfID, 'endDiagnostic');
        Entities.editEntity(_selfID, { 'velocity': { x: 0.0, y: 0.0, z: 0.0 }, 'position': ORIGIN_POINT });
        Script.update.disconnect(update);
        Controller.disableMapping(MAPPING_NAME);
    }

    function recordTriggerPull() {
        if (hasActiveDiagnostic) {
            print("Trigger pull occurred: " + (Date.now() - lastCollisionTime) + "ms after last collision");
        }
    }

    function update() {
        if (Date.now() - diagnosticStartTime >= DIAGNOSTIC_LENGTH) {
            endDiagnostic();
        }
    }

    function enableDiagnosticTest(event) {
        if (event.text === diagnosticBeginKey && !hasActiveDiagnostic) {
            beginDiagnostic();
        } else if (event.text === diagnosticBeginKey && hasActiveDiagnostic) {
            endDiagnostic();
        }
    }

    DiagnosticOrb.prototype = {

        preload: function (entityID) {
            _selfID = entityID;
            Controller.keyReleaseEvent.connect(enableDiagnosticTest);
        },

        collisionWithEntity: function (myID, theirID, collision) {
            if (theirID === LEFT_BOUNDARY_ID) {
                lastCollisionTime = Date.now();
                Entities.editEntity(_selfID, { 'velocity': { x: -1.0, y: 0.0, z: 0.0 } });
            } else if (theirID === RIGHT_BOUNDARY_ID) {
                lastCollisionTime = Date.now();
                Entities.editEntity(_selfID, { 'velocity': { x: 1.0, y: 0.0, z: 0.0 } });
            }
        },

        unload: function () {
            Controller.disableMapping(MAPPING_NAME);
        }
    }

    return new DiagnosticOrb();

});
