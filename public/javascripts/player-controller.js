var socket = io.connect();
var touchEnabled = "ontouchend" in document;

$(document).ready(function(){
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var fresh = true;
    var player = {
        x: 0,
        y: 0,
        z: 20,
        maxSpeedX: 20,
        maxSpeedY: 10,
        maxFriction: 50,
        speedX: 0,
        speedY: 0,
        joined: false,
        waiting: true,
        score: 0
    };
    var radialCounter = 0;

    var playerWaitingtoJoin = function() {
        //if (!player.waiting) { return false; }
        var waitingInterval = setInterval(function(){
            //console.log('emit i-am-player');
            socket.emit('i-am-player');
            player.waiting = false;
        }, 1500);
        
        socket.on('game-joined', function(data){
            //console.log('game-joined');
            player.joined = true;
            clearInterval(waitingInterval);
            playerUpdate();
        });
        
        socket.on('game-end', function(data){
            console.log('game-end');
            // TODO: audio effect, update DOM
            player.score = data;

            setTimeout(function(){
                player.joined = false;
                player.waiting = true;
                player.score = 0;
            });
        });
        
        socket.on('update-score', function(data){
            console.log('update-score');
            // TODO: audio effect, update DOM
            player.score = data;
        });
    }
    
    var playerUpdate = function() {
        if (!player.joined) {
            playerWaitingtoJoin();
            return false;
        }

        //console.log('player-update');
        if (fresh) {

            // X/Y en Z besturing
            //player.z += 20;
            player.speedX = (((player.maxSpeedX / 100) * player.x) / 100) * player.z;
            player.speedY = (((player.maxSpeedY / 100) * player.y) / 100) * player.z;
            
            // X is gelijk aan Z besturing
            //player.x = player.z;
            //player.speedX = ((player.maxSpeedX / 100) * player.x) - (player.maxSpeedX / 2);
            //player.speedY = ((player.maxSpeedY / 100) * player.y);
            
            console.log({x: player.speedX, y: player.speedY, z: player.z});
            
        } else {
            var maxFriction = (player.maxFriction / 100) * player.z;
            player.speedX -= maxFriction / player.z;
        }
        
        socket.emit('player-update', {x: player.speedX, y: player.speedY, z: player.z});
        
        setTimeout(playerUpdate, 60);
    };

    /*
    $('body').on('touchstart mousedown', function(event) {
        playerWaitingtoJoin();
    });*/
    
    $('#compass').on('touchmove mousemove', function(event) {
        event.preventDefault();
        if (touchEnabled) {
            player.x = Math.floor(((event.originalEvent.targetTouches[0].clientX - $(this).offset().left) / $(this).width()) * 200) - 100;
            player.y = Math.floor(((event.originalEvent.targetTouches[0].clientY - $(this).offset().top) / $(this).height()) * 200) - 100;
        } else {
            player.x = Math.floor((event.offsetX / $(this).width()) * 200) - 100;
            player.y = Math.floor((event.offsetY / $(this).height()) * 200) - 100;
        }
        fresh = true;
    });
    $('#compass').on('touchend mouseup', function(event) {
        fresh = false;
    });
    $('#slider').on('touchmove mousedown', function(event) {
        event.preventDefault();
        
        if (touchEnabled) {
            player.z = 100 - Math.floor(((event.originalEvent.targetTouches[0].clientY - $(this).offset().top) / $(this).height()) * 100);
        } else {
            player.z = 100 - Math.floor((event.offsetY / $(this).height()) * 100);
        }
        player.z += 20;
        fresh = true;
    });

    playerWaitingtoJoin();
});
