var socket = io.connect();
var canvas = document.getElementById('canvas');
    canvas.width = 1000;
    canvas.height = 600;
var context = canvas.getContext('2d');
var fpsCounter = 0;
var previousTimer = 0;
var players = [];
var getReadyInterval = false;
var game = false;

$(document).ready(function(){

    var game = new Game('/javascripts/world.json');

    socket.emit('i-am-viewer');
    
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
    });
    
    var previousTime = 0;
    (function animloop(time){

        requestAnimationFrame(animloop);
        if (game) { game.tick(time); }
    })();
});
