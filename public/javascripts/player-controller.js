var socket = io.connect();
var touchEnabled = "ontouchend" in document;

// TODO: joystick
// TODO: audio soundjs
// TODO: color chooser?

$(document).ready(function(){
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var fresh = true;
    var player = {
        x: 0,
        y: 0,
        z: 20,
        maxSpeed: 20,
        maxFriction: 50,
        speedX: 0,
        speedY: 0
    };
    var radialCounter = 0;
    
    var playerUpdate = function() {
        if (fresh) {
            
            //var maxSpeed = ((player.maxSpeed / 100) * (player.z * .5));
            player.speedX = (((player.maxSpeed / 100) * player.x) / 100) * player.z;
            player.speedY = (((player.maxSpeed / 100) * player.y) / 100) * player.z;

            //console.log(maxSpeed);
            console.log({x: player.speedX, y: player.speedY, z: player.z});
            
            //fresh = false;
        } else {
            var maxFriction = (player.maxFriction / 100) * player.z;
            player.speedX -= maxFriction / player.z;
            //console.log(maxFriction + ' ' + player.speedX);
            //player.speedY -= (player.friction / 100 * player.y);
        }
        
            
            socket.emit('player-update', {x: player.speedX, y: player.speedY, z: player.z});
        /*
        if (fresh) {
            
            socket.emit('player-update', {x: player.x, y: player.y, z: player.z});
            fresh = false;
        } else {
            if (player.x > 0) {
                player.x -= 1;
            }

            radialCounter += .2;
            if (radialCounter > 360) { radialCounter = 0; }
            player.y += (Math.cos(radialCounter));

            $('#debug').html(player.y);

            socket.emit('player-update', {x: player.x, y: player.y, z: player.z});

        }*/
        setTimeout(playerUpdate, 60);
    };

    $('#compass').on('touchmove mousemove', function(event) {
        event.preventDefault();
        if (touchEnabled) {
            player.x = Math.floor(((event.originalEvent.targetTouches[0].clientX - $(this).offset().left) / $(this).width()) * 200) - 100;
            player.y = Math.floor(((event.originalEvent.targetTouches[0].clientY - $(this).offset().top) / $(this).height()) * 200) - 100;
        } else {
            player.x = Math.floor((event.offsetX / $(this).width()) * 200) - 100;
            player.y = Math.floor((event.offsetY / $(this).height()) * 200) - 100;
            //console.log(player.x + ', ' + player.y);
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
        console.log(player.z);
        fresh = true;
    });

    playerUpdate();
});
