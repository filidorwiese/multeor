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
        var countDown = 10;
        getReadyInterval = setInterval(function(){
            //if (game.props.started) { clearInterval(getReadyInterval); return false; }
            
            if (countDown < 1) {
                game.message('GO!');
                setTimeout(function(){
                    game.message('');
                    game.props.started = true;
                }, 1000);
                clearInterval(getReadyInterval);
            } else {
                game.message('Game starting in ' + countDown + ' seconds, get ready...');
                countDown--;
            }
        }, 1000);
    });
    
    socket.on('game-start', function(data){
        console.log('game-start');
        
    });

    socket.on('game-end', function(data){
        game.message('Game ended!');
        game.props.started = false;
        clearInterval(getReadyInterval);
        
        // TODO: update scores to players
        
        // TODO: restart game
        setTimeout(function(){
            game.message('');
            game.message('Go to http://10.0.0.10 on "Vlammen" WiFi to join');
        }, 10000);
    });
    
    game.message('Go to http://10.0.0.10 on "Vlammen" WiFi to join');

    var previousTime = 0;
    (function animloop(time){

        if (!game.props.started) {
            if (game.props.imagesLoaded) {
                //game.message('Go to http://10.0.0.10 on "Vlammen" WiFi to join');
            } else {
                game.message('Loading');
            }
        }
        
        requestAnimationFrame(animloop);
        if (game) { game.tick(time); }
    })();


    var world = [
        []
    ];
});
