var socket = io.connect(window.location.hostname + ':3333');

$(document).ready(function(){
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var player = {
		id: sessionStorage.getItem('player-id') || Math.floor((Math.random() * 10000) + 10000),
        angle: 0,
        length: 0,
        layer: 1,
        maxSpeedX: 50,
        maxSpeedY: 70,
        maxFriction: 80,
        speedX: 0,
        speedY: 0,
        joined: false,
        score: 0,
        color: '',
        fresh: true
    };
    sessionStorage.setItem('player-id', player.id);
    var gameRoom = parseInt(sessionStorage.getItem('game-room'), 10);

    // Verify gameRoom
    socket.emit('verify-game-room', {gameRoom: gameRoom});

    var playerWaitingtoJoin = function() {
        player.joined = false;
        $('#score').html('Click to join game');
        $('body').on('click touchstart', function(){
            $('body').off('click touchstart');
            socket.emit('new-player', {playerId: player.id, gameRoom: gameRoom});
        });
    }
    playerWaitingtoJoin();

    socket.on('disconnect', function(){
        document.location = '/';
    });

    socket.on('game-invalid', function(data){
        sessionStorage.setItem('player-id', '');
        sessionStorage.setItem('game-room', '');
        document.location = '/';
    });

	socket.on('game-has-started', function(data){
        $('#score').html('Sorry, game already started');
    });

    socket.on('game-full', function(data){
        $('#score').html('Too many players');
    });

    socket.on('player-joined', function(data){
        player.joined = true;
        emitPlayerUpdate();
        $('#score').html('Waiting for other players');
    });

    socket.on('game-reset', function(data){
        playerWaitingtoJoin();
    });

    socket.on('game-get-ready', function(data){
        Upon.log('game-get-ready');
        $('#score').html('Get ready');
    });

    socket.on('game-start', function(data){
        Upon.log('game-start');
        $('#score').html(0);
    });

    socket.on('game-end', function(data){
        Upon.log('game-end');

        $('#score').html(player.score);
        player.joined = false;
    });

    socket.on('update-score', function(data){
        Upon.log('update-score');

        $('html,body').css({ backgroundColor: '#FFF' });
        setTimeout(function(){
            $('html,body').css({ backgroundColor: 'rgba(' + player.color + ',.8)' });
        }, 250);

		player.score = data.score;
        $('#score').html(player.score);
    });

    socket.on('update-player-color', function(data){
        player.color = data.playerColor;
        $('html, body').css({ backgroundColor: 'rgba(' + player.color + ',.8)' });
    });

    var emitPlayerUpdate = function() {
        if (!player.joined) { return false; }

        if (player.fresh) {
            socket.emit('player-update', {
    			pid: player.id,
    			gr: gameRoom,
    			v: [Math.floor(player.angle), Math.floor(player.length), player.layer]
    		});
            player.fresh = false;
        }

        setTimeout(emitPlayerUpdate, 40);
    };

    var updatePlayerXY = function(x, y) {
        var radius = $('#leftControls').width() / 3;
        var vector = toDegrees(x, y, radius);

        player.angle = vector.deg;
        player.length = vector.length;

        $('#joystick').width(vector.length).css({
            '-webkit-transform': 'rotate(' + vector.deg + 'deg)',
            '-ms-transform': 'rotate(' + vector.deg + 'deg)'
        });

        player.fresh = true;
    };

    var updatePlayerZ = function(z) {
        player.layer = z;
        player.fresh = true;
    };

    if (window.navigator.msPointerEnabled) {
        //http://blogs.msdn.com/b/ie/archive/2011/09/20/touch-input-for-ie10-and-metro-style-apps.aspx
        /*$('#leftControls').on('MSPointerDown', function(event) {
            event.preventDefault();
        });*/
        $('#leftControls').on('MSPointerMove', function(event) {
            event.preventDefault();

            //$('#message').html(event.originalEvent.clientX + '!');
            var x = (event.originalEvent.clientX.toFixed(0) - $(this).offset().left);
            var y = (event.originalEvent.clientY.toFixed(0) - $(this).offset().top);
            updatePlayerXY(x, y);
        });
        $('#leftControls').on('MSPointerUp', function(event) {
            $('#joystick').animate({'width': 5}, 400);
        });
        $('#rightControls #button').on('MSPointerDown', function(event) {
            event.preventDefault();

            updatePlayerZ(3);
            $(this).toggleClass('pressed');
        });
        $('#rightControls #button').on('MSPointerUp', function(event) {
            event.preventDefault();

            updatePlayerZ(1);
            $(this).toggleClass('pressed');
        });
    } else {
        /*$('#leftControls').on('touchstart', function(event) {
            event.preventDefault();
        });*/
        $('#leftControls').on('touchmove', function(event) {
            event.preventDefault();

            var x = (event.originalEvent.targetTouches[0].clientX - $(this).offset().left);
            var y = (event.originalEvent.targetTouches[0].clientY - $(this).offset().top);
            updatePlayerXY(x, y);
        });
        $('#leftControls').on('touchend', function(event) {
    		$('#joystick').animate({'width': 5}, 400);
        });
        $('#rightControls #button').on('touchstart', function(event) {
            event.preventDefault();

            updatePlayerZ(3);
            $(this).toggleClass('pressed');
        });
        $('#rightControls #button').on('touchend', function(event) {
            event.preventDefault();

            updatePlayerZ(1);
            $(this).toggleClass('pressed');
        });
    }
});



function toDegrees(x, y, radius){
	var degrees = 0;
	var overstaand = y - radius;
	var aanliggend = x - radius;
	var schuin = Math.sqrt(Math.pow(overstaand,2) + Math.pow(aanliggend,2));
	var sinJ = overstaand/schuin;
	var cosJ = aanliggend/schuin;

	degrees = Math.asin(sinJ)*180/Math.PI;
	if(aanliggend < 0) {
		degrees = 180 - degrees;
	}

	if(schuin > radius) {
		schuin = radius;
		overstaand = cosJ * radius;
		aanliggend = sinJ * radius;
	}

	return {'deg': degrees, 'length': schuin};
}
