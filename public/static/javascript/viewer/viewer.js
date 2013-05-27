'use strict';

// Support for canvas, socket.io, sessionstorage and websockets?
if (typeof io === 'undefined' || !window.sessionStorage || !isCanvasSupported() || !'WebSocket' in window) {
    $('.main').hide();
    $('#error').show();
} else {
    // Setup canvas
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = 600;
        context.globalAlpha = 0.5;

    // Setup socket.io
    var socket = io.connect(window.location.hostname + ':843');

    // Setup game globals
    var players = {};
    var game = false;
    var playerColors = [
                        '110,8,157',
                        '0,255,247',
                        '16,230,34',
                        '255,174,26',
                        '255,255,0',
                        '255,110,221',
                        '8,103,255',
                        '255,0,36'
                        ];
    var playerColorsShuffled = shuffleArray(playerColors.slice(0)); // Clone it and shuffle

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
            logGAEvent('Game hijacking?');
        });

        socket.on('update-game-state', function(data){
            // Enable button on first joined player
            var playerCount = 0;
            for (var ii in data.players) { playerCount++; }
            if (playerCount) {
                $('#gameStart').removeClass('disabled');
            }

            // Add player to players array
            var numberOfPlayers = 0;

            //for (var oo=0; oo < 8; oo++) {

                for (var ii in data.players) {
                    //var playerId = data.players[ii] + oo;
                    var playerId = data.players[ii].playerId;
                    numberOfPlayers++;
                    if (typeof players[playerId] == 'undefined') {
                        var playerColor = playerColorsShuffled.splice(0, 1)[0];
                        var playerIcon = data.players[ii].playerIcon;
                        players[playerId] = new Player(context, playerId, playerIcon, playerColor, numberOfPlayers);
                        //playerId++;
                        socket.emit('update-player-color', {viewerId: viewerId, gameRoom: gameRoom, playerId: playerId, playerColor: playerColor});
                    }
                }
            //}

            // Check for deleted players
            for (var oo in players) {
                var playerStillExists = false;
                for (var ii in data.players) {
                    if (data.players[ii].playerId == oo) {
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

        //profiler.start(context, 12, 245, 120, 1);

        var now;
        var delta;
        var then = new Date().getTime();
        var interval = 1000 / 60;

        (function gameLoop(time){

            requestAnimationFrame(gameLoop);

            now = new Date().getTime();
            delta = now - then;

            if (delta > interval) {
                then = now - (delta % interval);

                if (game) {
                    //console.log(delta);
                    game.tick(context, delta);
                }
            }

            //if (delta > interval) {
                //mainContext.drawImage(offscreenCanvas, 0, 0);
                //then = time;
            //}

            //profiler.tick();

        })();


        $('.gamecode-container').html(gameRoom);

        $('#gameStart').off('click').on('click', function(event){
            event.preventDefault();
            if ($(this).hasClass('disabled')) { return false; }
            hideInstructions();
            game.getReady();
        });

        $('#gameReset button').off('click').on('click', function(event){
            event.preventDefault();
            game.resetGame();
        });
    });
}


function hideInstructions(){
    $.each($('.step'), function(key, val){
        $(val).delay(key*200).animate({top: '+='+346}, function(){
            if(key == $('.step').length-1 ) {
                var delay = 200;
                for(var i=$('.step-header').length-1; i >= 0; i--){
                    $('.step-header').eq(i).delay(delay).animate({opacity: 0});
                    delay += 750;
                }
            }
        });
    });
    setTimeout(function(){
        $('.destroy-container').show();
        setTimeout(function(){
            $('.destroy-container').fadeOut(750);
        }, 1000);
        $('.instructions-container').hide();
    }, 3650);
}

function showInstructions(){
    $('.leaderboard-container').hide();
    $('.instructions-container').show();
    $('.step').css({top: 0, opacity: 0}).animate({opacity: 1}, 300);
    $('.step-header').animate({opacity: 1}, 300);
}

function shuffleArray(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {};
    return o;
}

function randomFloat (min, max) {
    return min + Math.random()*(max-min);
}

function logGAEvent(action, label, value) {
    if (typeof _gaq !== 'undefined') {
        if (typeof label !== 'undefined' && typeof value !== 'undefined') {
            Upon.log('Viewer, ' + action + ', ' + label + ', ' + value);
            _gaq.push(['_trackEvent', 'Viewer', action, label, value]);
        } else {
            _gaq.push(['_trackEvent', 'Viewer', action]);
        }
    }
}

function isCanvasSupported(){
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}
