// FIXME: test if sessionStorage/canvas/websockets is supported?

// Setup canvas
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 600;

// Setup socket.io
var socket = io.connect(window.location.hostname + ':843');

// Setup game globals
var players = {};
var getReadyInterval = false;
var game = false;
var playerColors = [
                    '110,8,157',
                    '0,255,247',
                    '16,230,34',
                    '255,174,26',
                    '255,255,0',
                    '255,110,221',
                    '8,103,255',
                    '255,0,36'
                    ];
var playerColorsShuffled = shuffleArray(playerColors.slice(0)); // Clone it and shuffle

// Set gameRoom
var gameRoom = sessionStorage.getItem('game-room') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('game-room', gameRoom);

// Set viewerId
var viewerId = sessionStorage.getItem('viewer-id') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('viewer-id', viewerId);

$(document).ready(function(){
    var game = new Game('/levels/forest', gameRoom);

    socket.emit('new-viewer', {viewerId: viewerId, gameRoom: gameRoom});

    socket.on('game-end', function(data){
        game.abortGame();
    });

    socket.on('game-invalid', function(data){
        sessionStorage.setItem('viewer-id', '');
        sessionStorage.setItem('game-room', '');
        alert('Sorry, no game hijacking');
        document.location = '/';
        logGAEvent('Room hijacking?');
    });

    socket.on('update-game-state', function(data){
        // Start countdown on first joined player
        var playerCount = 0;
        for (var ii in data.players) { playerCount++; }
        if (playerCount === 1) {
            game.getReady();
        }

        // Add player to players array
        var numberOfPlayers = 0;
        for (var ii in data.players) {
            var playerId = data.players[ii];
            numberOfPlayers++;
            if (typeof players[playerId] == 'undefined') {
                var playerColor = playerColorsShuffled.splice(0, 1)[0];
                var playerIcon = '/tmp-facebook-icon-arjen.jpg';
                players[playerId] = new Player(context, playerId, playerIcon, playerColor, numberOfPlayers);
                socket.emit('update-player-color', {viewerId: viewerId, gameRoom: gameRoom, playerId: playerId, playerColor: playerColor});
            }
        }

        // Check for deleted players
        for (var oo in players) {
            var playerStillExists = false;
            for (var ii in data.players) {
                if (data.players[ii] == oo) {
                    playerStillExists = true;
                }
            }
            if (!playerStillExists) {
                delete players[oo];
            }
        }
    });

    socket.on('player-update', function(data){
        if (typeof players[data.pid] == 'undefined') {
            return false;
        }

        players[data.pid].props.vector = data.v;
    });


    profiler.start(context, 12, 245, 120, 1);

    var now;
    var delta;
    var then = new Date().getTime();
    var interval = 1000 / 60;

    (function gameLoop(time){

		requestAnimationFrame(gameLoop);

        now = new Date().getTime();
        delta = now - then;

        if (delta > interval) {
            then = now - (delta % interval);

            if (game) {
                //console.log(delta);
                game.tick(context, delta);
            }
        }

        //if (delta > interval) {
            //mainContext.drawImage(offscreenCanvas, 0, 0);
            //then = time;
        //}

        profiler.tick();

    })();
});



/** Some useful tools **/
function logGAEvent(action, label, value) {
    if (typeof _gaq !== 'undefined') {
        if (typeof label !== 'undefined' && typeof value !== 'undefined') {
            Upon.log('Viewer, ' + action + ', ' + label + ', ' + value);
            _gaq.push(['_trackEvent', 'Viewer', action, label, value]);
        } else {
            _gaq.push(['_trackEvent', 'Viewer', action]);
        }
    }
}

function shuffleArray(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {};
    return o;
}

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function randomFloat (min, max) {
    return min + Math.random()*(max-min);
}