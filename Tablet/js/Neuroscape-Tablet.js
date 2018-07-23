(function() {

    "use strict";
    
    var EVENT_BRIDGE_OPEN_MESSAGE = "eventBridgeOpen",
        UPDATE_UI = "update_ui",
        SAVE_JSON = "saveJSON",
        UPDATE_PLAYER_NAME = "update_player_name",
        RESTART_GAME = "restart_game",
        EVENTBRIDGE_SETUP_DELAY = 50;

    Vue.component('restart-game', {
        methods: {
            restartGame(){
                EventBridge.emitWebEvent(JSON.stringify({
                    type: RESTART_GAME
                }));
            }
        },
        template:`
            <div class="card">
                <div class="card-header">
                </div>
                <div class="card-body">
                        <button class="btn-sm btn-primary mt-1 mr-1" v-on:click="restartGame()">Restart Game</button>
                </div>
            </div>
        `
    })

    Vue.component('enter-player-name', {
        data: function(){
            return {
                newPlayerName: "",
                editing: false,
                editingJSONURL: false,
            }
        },
        methods: {
            updateName(name){
                this.editing = false;
                EventBridge.emitWebEvent(JSON.stringify({
                    type: UPDATE_PLAYER_NAME,
                    value: name
                }));
                this.newPlayerName = "";
            }
        },
        template:`
            <div class="card">
                <div class="card-header">
                </div>
                <div class="card-body">
                        Please Enter Your Name
                        <input id="enter-player-name" type="text" class="form-control" v-model="newPlayerName">
                        <button class="btn-sm btn-primary mt-1 mr-1" v-on:click="updateName(newPlayerName)">Save Player Name</button>
                </div>
            </div>
        `
    })

    Vue.component('show-message', {
        props: ["message"],
        methods: {
            updateName(name){
                this.editing = false;
                EventBridge.emitWebEvent(JSON.stringify({
                    type: UPDATE_PLAYER_NAME,
                    value: name
                }));
                this.newPlayerName = "";
            }
        },
        computed: {
            formatedMessage() {
                console.log("FORMATTED MESSAGES")
                var newMessage = JSON.stringify(this.message)
                .replace(/\\n/g, "<br>")
                .replace(/\"/g, "")
                .replace(/\\t/g, "    ")
                .split(",").join("<br>\   ")
                .split("{").join("")
                .split("}").join("<br>").replace(/"/g,"");
                return newMessage;
            }
        },
        template:`
            <div class="card">
                <div class="card-header">

                </div>
                <div class="card-body" v-html="formatedMessage">
                        {{formatedMessage}}
                </div>
            </div>
        `
    })

    var app = new Vue({
        el: '#app',
        data: {
            settings: {
                playerName: "",
                gameRunning: false,
                message: null,
                gameData: null,
                ui: {
                    enterPlayerName: true,
                    showMessage: true,
                    gameRunning: false,
                    gameEnding: false
                }
            }
        }
    });

    var test = {
        array: {
            test: [],
            test: ["1", 2]
        }
    }

    function removeEmpty(obj) {
        Object.keys(obj).forEach(function(key) {
            (obj[key] && Array.isArray(obj[key])) && obj[key].forEach(function(item){removeEmpty(item)}) ||
            (obj[key] && typeof obj[key] === 'object') && removeEmpty(obj[key]) ||
            (obj[key] === '' || obj[key] === null || obj[key].length === 0) && delete obj[key]
        });
        return obj;
    };

    function saveJSON(gameData){
        var gameDataBase = Object.assign({}, gameData),
            levels = gameDataBase.levels,
            POST_URL = "https://neuroscape.glitch.me/json/";

            $.post(POST_URL, gameData);
        // if (levels.length < 3) {
        //     $.post(POST_URL, gameData);
        // } else {
        //     var splitAmount = Math.ceil(levels.length / 4),
        //         levels_part1 = levels.slice(0, splitAmount),
        //         levels_part2 = levels.slice(splitAmount, splitAmount * 2),
        //         levels_part3 = levels.slice(splitAmount * 2, splitAmount * 3),
        //         levels_part4 = levels.slice(splitAmount * 3, levels.length - 1),
        //         gameData_part1 = Object.assign({}, gameData, {playerName: gameData.playerName + "_" + "part1", part: 1, levelsData: levels_part1}),
        //         gameData_part2 = Object.assign({}, gameData, {playerName: gameData.playerName + "_" + "part2", part: 2, levelsData: levels_part2}),
        //         gameData_part3 = Object.assign({}, gameData, {playerName: gameData.playerName + "_" + "part3", part: 3, levelsData: levels_part3});
        //         gameData_part4 = Object.assign({}, gameData, {playerName: gameData.playerName + "_" + "part4", part: 4, levelsData: levels_part4});
            
        //     $.post(POST_URL, gameData_part1);
        //     $.post(POST_URL, gameData_part2);
        //     $.post(POST_URL, gameData_part3);
        //     $.post(POST_URL, gameData_part4);

        // }
        
    }

    function onScriptEventReceived(message) {
        var data;
        try {
            data = JSON.parse(message);
            switch (data.type) {
                case UPDATE_UI:
                    app.settings = data.value;
                    break;
                case SAVE_JSON:
                    saveJSON(data.value);
                    break;
                default:
            }
        } catch (e) {
            console.log(e)
            return;
        }
    }
    
    function onLoad() {
        
        // Initial button active state is communicated via URL parameter.
        // isActive = location.search.replace("?active=", "") === "true";

        setTimeout(function () {
            // Open the EventBridge to communicate with the main script.
            // Allow time for EventBridge to become ready.
            EventBridge.scriptEventReceived.connect(onScriptEventReceived);
            EventBridge.emitWebEvent(JSON.stringify({
                type: EVENT_BRIDGE_OPEN_MESSAGE
            }));
        }, EVENTBRIDGE_SETUP_DELAY);
    }

    onLoad();

}());
