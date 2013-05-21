var socket = io.connect(window.location.hostname + ':843');

$(document).ready(function(){
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var player = {
		id: sessionStorage.getItem('player-id') || Math.floor((Math.random() * 10000) + 10000),
        gameRoom: parseInt(sessionStorage.getItem('game-room'), 10),
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
        fresh: true,
        facebookProfile: JSON.parse(sessionStorage.getItem('facebook-profile'))
    };
    sessionStorage.setItem('player-id', player.id);

    socket.on('disconnect', function(){
        player.joined = false;
        document.location = '/controller/';
    });

    socket.on('game-invalid', function(data){
        player.joined = false;
        sessionStorage.setItem('player-id', '');
        sessionStorage.setItem('game-room', '');
        document.location = '/controller/';
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
        document.location.reload();
        //playerWaitingtoJoin();
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
        player.joined = false;

        //data.leaderboard;
        $('#game-start, #controller').hide();
        $('#game-end').show();

        $('#game-end h1 span').html(player.score);
        if (player.facebookProfile) {
            $('#facebook-share').show().off('click').on('click', function(event){
                event.preventDefault();
                fbPublish(player.score, data.leaderboard);
            });
        } else {
            $('#facebook-share').hide();
        }
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
        $('#game-start, #game-end').hide();
        $('#controller').show();
    });

    var ppsCounter = 0;
    var previousTimer = new Date();
    setInterval(function(){
        var time = new Date();
        var timePast = time - previousTimer;
        if (timePast > 1000) {
            previousTimer = time;
            var currentPps = Math.round(ppsCounter / (timePast / 1000), 2);
            $('#message').html(currentPps + ' average PPS');
            ppsCounter = 0;
        }
    }, 500);

    var emitPlayerUpdate = function() {
        if (!player.joined) { return false; }

        if (player.fresh) {
            socket.emit('player-update', {
    			pid: player.id,
    			gr: player.gameRoom,
    			v: [Math.floor(player.angle), Math.floor(player.length), player.layer]
    		});
            ppsCounter++;
            player.fresh = false;
        }

        setTimeout(emitPlayerUpdate, 20);
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

    var toDegrees = function(x, y, radius) {
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
    };

    if (window.navigator.msPointerEnabled) {
        //http://blogs.msdn.com/b/ie/archive/2011/09/20/touch-input-for-ie10-and-metro-style-apps.aspx
        $('#leftControls').on('MSPointerMove', function(event) {
            event.preventDefault();
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

    $('#join-game').on('click', function(){
        var gameRoomInput = $('input[name=game-code]');
        var gameRoom = parseInt(gameRoomInput.val(), 10);
        if (isNaN(gameRoom) || gameRoom < 10000 || gameRoom > 99999) {
            alert('Not a valid code');
            gameRoomInput.val('').focus();
        } else {

            sessionStorage.setItem('game-room', gameRoom);
            player.gameRoom = gameRoom;

            var playerIcon = player.facebookProfile ? player.facebookProfile.picture.data.url : false;
            socket.emit('new-player', {playerId: player.id, gameRoom: gameRoom, playerIcon: playerIcon});
        }
    });

    // Insert game-code if available in storage
    if (player.gameRoom) { $('input[name=game-code]').val(player.gameRoom); }
    $('input[name=game-code]').focus();

    // Show Facebook icon if connected
    if (player.facebookProfile) {
        $('.buddy-icon').append('<img src="' + player.facebookProfile.picture.data.url + '" /><div>' + player.facebookProfile.name + '</div>').show();
    }

});