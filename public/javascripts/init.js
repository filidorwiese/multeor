// FIXME: test if sessionStorage/canvas/websockets is supported?

var socket = io.connect(window.location.hostname + ':3333');
var canvas = document.getElementById('canvas');
    canvas.width = 1000;
    canvas.height = 600;
var context = canvas.getContext('2d');
var fpsCounter = 0;
var previousTimer = 0;
var players = {};
var getReadyInterval = false;
var game = false;
var playerColors = shuffle([
                    'rgba(255,0,89,0.8)',
                    'rgba(255,255,255,0.8)',
                    'rgba(255,240,0,0.8)',
                    'rgba(204,0,255,0.8)',
                    'rgba(0,255,105,0.8)',
                    'rgba(0,179,255,0.8)',
                    'rgba(255,144,0,0.8)'
                    ]);

// Set gameRoom
var gameRoom = sessionStorage.getItem('game-room') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('game-room', gameRoom);

// Set viewerId
var viewerId = sessionStorage.getItem('viewer-id') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('viewer-id', viewerId);
    
$(document).ready(function(){
    
    var game = new Game('/javascripts/world.json', gameRoom);
    
    socket.emit('new-viewer', {viewerId: viewerId, gameRoom: gameRoom});
    
    socket.on('game-end', function(data){
        game.endGame();
    });
    
    socket.on('game-invalid', function(data){
        sessionStorage.setItem('viewer-id', '');
        sessionStorage.setItem('game-room', '');
        alert('Sorry, no game hijacking');
        document.location = '/';
    });

    socket.on('game-reset', function(data){
        //document.location.reload();
    });
    
    socket.on('update-game-state', function(data){
        console.log(data);

        // Start countdown on first joined player
        var playerCount = 0;
        for (var ii in data.players) { playerCount++; }
        if (playerCount === 1) {
            game.getReady();
        }
        
        // Add player to players array
        for (var ii in data.players) {
            var playerId = data.players[ii];
            if (typeof players[playerId] == 'undefined') {
                players[playerId] = new Player(canvas.width, canvas.height, playerColors.splice(0, 1)[0]);
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
        if (typeof players[data.playerId] == 'undefined') {
            return false;
        }
        players[data.playerId].updateProps(data.x, data.y, data.z);
    });
    
    var previousTime = 0;
    (function animloop(time){

        requestAnimationFrame(animloop);
        if (game) { game.tick(time); }
    })();
});

function shuffle(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
