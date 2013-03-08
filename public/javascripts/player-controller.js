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
        z: 0
    };
    var radialCounter = 0;
    
    var playerUpdate = function() {
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

        }
        setTimeout(playerUpdate, 30);
    };

    $('#left').on('touchmove mousemove', function(event) {
        event.preventDefault();
        if (touchEnabled) {
            player.x = Math.floor(event.originalEvent.targetTouches[0].pageX / (viewportWidth / 2) * 100);
            player.y = Math.floor(event.originalEvent.targetTouches[0].pageY / viewportHeight * 100);
        } else {
            player.x = Math.floor(event.pageX / (viewportWidth / 2) * 100);
            player.y = Math.floor(event.pageY / viewportHeight * 100);
        }
        fresh = true;
    });
    $('#right').on('touchmove mousemove', function(event) {
        event.preventDefault();
        
        if (touchEnabled) {
            player.z = 100 - Math.floor(event.originalEvent.targetTouches[0].pageY / viewportHeight * 100);
        } else {
            player.z = 100 - Math.floor(event.pageY / viewportHeight * 100);
        }
        
        fresh = true;
    });

    playerUpdate();
});
