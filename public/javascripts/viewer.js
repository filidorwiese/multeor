// FIXME: test if sessionStorage/canvas/websockets is supported?

var socket = io.connect(window.location.hostname + ':3333');
var canvas = document.getElementById('canvas');
    canvas.width = $(window).width();
    canvas.height = 600;
var context = canvas.getContext('2d');
var fpsCounter = 0;
var previousTimer = 0;
var players = {};
var getReadyInterval = false;
var game = false;
var playerColors = shuffle([
                    'rgba(255, 0, 36, 0.8)',
                    'rgba(8, 103, 255, 0.8)',
                    'rgba(255,110, 221, 0.8)',
                    'rgba(255, 255, 0, 0.8)',
                    'rgba(110, 8, 157, 0.8)',
                    'rgba(0, 255, 247, 0.8)',
                    'rgba(16, 230, 34, 0.8)',
                    'rgba(255, 174, 26, 0.8)'
                    ]);

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
                var playerColor = playerColors.splice(0, 1)[0];
                players[playerId] = new Player(playerId, canvas.width, canvas.height, playerColor, numberOfPlayers);
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

