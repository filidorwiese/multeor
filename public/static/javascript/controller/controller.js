'use strict';

var socket = io.connect('game.multeor.com:843'); //window.location.hostname + ':843'

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
        document.location = '/controller/';
    });

    socket.on('game-has-started', function(data){
        //alert('Game full');
        $('#score').html('Game started');
    });

    socket.on('game-full', function(data){
        //alert('Game full');
        $('#score').html('Game full');
    });

    socket.on('game-invalid', function(data){
        if (!player.joined) { return; }
        sessionStorage.setItem('player-id', '');
        sessionStorage.setItem('game-room', '');
        document.location = '/controller/';
    });

    socket.on('player-joined', function(data){
        player.joined = true;
        emitPlayerUpdate();
        $('#score').html('Press start');
    });

    socket.on('game-reset', function(data){
        //document.location.reload();
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

        $('#game-start, #controller').hide();
        $('#game-end').show();

        $('#game-end h1 span').html(player.score);
        if (player.facebookProfile) {
            $('#facebook-share').show().find('button').off('click').on('click', function(event){
                event.preventDefault();
                if ($(this).hasClass('disabled')) { return false; }
                fbPublish(player.score, data.leaderboard, function(status){
                    if (status) {
                        $('#facebook-share').hide();
                    }
                });
            });
        } else {
            $('#facebook-share').hide();
        }
    });

    socket.on('update-score', function(data){
        Upon.log('update-score');

        $('#controller').css({ backgroundColor: '#FFF' });
        setTimeout(function(){
            $('#controller').css({ backgroundColor: 'rgba(' + player.color + ',1)' });
        }, 250);

		player.score = data.score;
        $('#score').html(player.score);
    });

    socket.on('update-player-color', function(data){
        player.color = data.playerColor;
        $('#controller').css({ backgroundColor: 'rgba(' + player.color + ',1)' });
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
            //$('#message').html(currentPps + ' average PPS');
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
        var radius = $('#joystick').width() / 3;
        var centerX = $('#leftControls').width() / 2;
        var centerY = $('#leftControls').height() / 2;
        var vector = toDegrees(x, y, centerX, centerY, radius);
        var y = Math.sin(vector.rad) * vector.length;
        var x = Math.cos(vector.rad) * vector.length;

        player.angle = vector.deg;
        player.length = vector.length;

        $('#stick').css({
            left: x,
            top: y
        });

        player.fresh = true;
    };

    var updatePlayerZ = function(z) {
        player.layer = z;
        player.fresh = true;
    };

    var toDegrees = function(x, y, centerX, centerY, radius) {
        var degrees = 0;
        var overstaand = y - centerY;
        var aanliggend = x - centerX;
        var schuin = Math.sqrt(Math.pow(overstaand,2) + Math.pow(aanliggend,2));
        var sinJ = overstaand/schuin;
        var cosJ = aanliggend/schuin;

        var radian = Math.asin(sinJ);

        degrees = Math.asin(sinJ)*180/Math.PI;
        if(aanliggend < 0) {
            degrees = 180 - degrees;
            radian = Math.PI - radian;
        }

        if(schuin > radius) {
            schuin = radius;
            overstaand = cosJ * radius;
            aanliggend = sinJ * radius;
        }

        return {'deg': degrees, 'rad': radian, 'length': schuin};
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
            $('#stick').animate({left:0, top: 0}, 250);
        });
        $('#rightControls #boost').on('MSPointerDown', function(event) {
            event.preventDefault();

            updatePlayerZ(3);
            $(this).toggleClass('pressed');
        });
        $('#rightControls #boost').on('MSPointerUp', function(event) {
            event.preventDefault();

            updatePlayerZ(1);
            $(this).toggleClass('pressed');
        });
    } else {
        $('#leftControls').on('touchmove', function(event) {
            event.preventDefault();

            var x = (event.originalEvent.targetTouches[0].clientX);
            var y = (event.originalEvent.targetTouches[0].clientY);
            updatePlayerXY(x, y);
        });
        $('#leftControls').on('touchend', function(event) {
            $('#stick').animate({left:0, top: 0}, 250);
        });
        $('#rightControls').on('touchstart', function(event) {
            event.preventDefault();

            updatePlayerZ(3);
            $('#boostBg').addClass('pressed');
        });
        $('#rightControls').on('touchend', function(event) {
            event.preventDefault();

            updatePlayerZ(1);
            $('#boostBg').removeClass('pressed');
        });
    }

    $('#join-game').removeClass('disabled');
    $('#join-game button').text('Join Game').on('click', function(event){
        event.preventDefault();
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

    $('#game-reset button').on('click', function(event){
        event.preventDefault();
        document.location.reload();
    });

    // Insert game-code if available in storage
    if(player.gameRoom) { $('input[name=game-code]').val(player.gameRoom); }
    $('input[name=game-code]').focus();

    // Show Facebook icon if connected
    if (player.facebookProfile) {
        $('.buddy-icon').append('<img src="' + player.facebookProfile.picture.data.url + '" /><div>Playing as<br />' + player.facebookProfile.name + '</div>').show();
    }

});