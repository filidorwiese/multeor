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
var playerColors = [ 'rgba(255,0,89,0.8)', 'rgba(255,255,255,0.8)',  'rgba(255,240,0,0.8)', 'rgba(204,0,255,0.8)',
                     'rgba(0,255,105,0.8)', 'rgba(0,179,255,0.8)', 'rgba(255,144,0,0.8)' ];
playerColors = shuffle(playerColors);

// Set gameRoom
var gameRoom = sessionStorage.getItem('game-room') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('game-room', gameRoom);

// Set viewerId
var viewerId = sessionStorage.getItem('viewer-id') || Math.floor((Math.random() * 10000) + 10000);
sessionStorage.setItem('viewer-id', viewerId);
    
$(document).ready(function(){
    
    var game = new Game('/javascripts/world.json', gameRoom);
    
    socket.emit('new-viewer', {viewerId: viewerId, gameRoom: gameRoom});

    /*
    socket.on('new-player', function(data){
        console.log('player ' + data.number + ' entered game');
        players[data.number] = new Player(canvas.width, canvas.height);
        var playerProps = players[data.number].props;
        playerProps.color = data.color;
    });

    socket.on('removed-player', function(data){
        if (typeof data != 'object') { return false; }
        console.log('player ' + data.number + ' left the game');
        delete players[data.number];
    });
    
    socket.on('player-update', function(data){
        if (typeof players[data.number] == 'undefined') {
            return false;
        }
        players[data.number].updateProps(data.x, data.y, data.z);
    });

    socket.on('game-countdown', function(data){
        console.log('game-countdown');
        $(window).trigger('game-audio-start');
        game.startGame();
    });
    
    socket.on('game-end', function(data){
        game.endGame();
    });*/

    socket.on('game-invalid', function(data){
        sessionStorage.setItem('viewer-id', '');
        sessionStorage.setItem('game-room', '');
        alert('Sorry, no game hijacking');
        document.location = '/';
    });

    socket.on('update-game-state', function(data){
        console.log(data);

        // Start countdown on first joined player
        var playerCount = 0;
        for (var ii in data.joinedPlayers) { playerCount++; }
        if (playerCount === 1) {
            game.startGame();
        }
        
        // Add player to players array
        for (var ii in data.joinedPlayers) {
            if (typeof players[ii] == 'undefined') {
                players[ii] = new Player(canvas.width, canvas.height, playerColors.splice(0, 1)[0]);
            }
        }
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
