'use strict';

// Support for socket.io, sessionstorage, touch and websockets?
if (typeof io === 'undefined') {
    $('#game-start, #game-end, #controller').hide();
    $('#error').show();
    $('#error-message').html('Can\'t connect to Multeor server');

// Detecting Facebook builtin browser
} else if (navigator.userAgent.indexOf("FBAN") > 0 && navigator.userAgent.indexOf("FBAV") > 0) {
    $('#game-start, #game-end, #controller').hide();
    $('#error').show();
    $('#error-message').html('Sadly the Facebook in-app browser isn\'t supported. Go to ' + window.location.hostname + ' with a different mobile browser to play');

// Some basic feature detection
} else if (!Modernizr.sessionstorage || !Modernizr.websockets) { //|| !Modernizr.touch) {
    $('#game-start, #game-end, #controller').hide();
    $('#error').show();
    $('#error-message').html('Device not supported<br />(<a href="/about/#requirements">read more</a>)');

// Everything looks good
} else {
    // If use didn't came from title-screen, redirect to give the option to log into facebook
    if (!sessionStorage.getItem('came-from-title-screen')) {
        document.location = '/';
    }

    var socket = io.connect(window.location.hostname + ':443');
    // development
    // var socket = io.connect('http://dev.multeor.com:443');
    // local
    //var socket = io.connect('10.0.1.104:443');

    $(document).ready(function () {
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
            webAudioSupported: false,
            facebookProfile: JSON.parse(sessionStorage.getItem('facebook-profile'))
        };
        sessionStorage.setItem('player-id', player.id);

        socket.on('disconnect', function () {
            sessionStorage.setItem('player-id', '');
            sessionStorage.setItem('game-room', '');
            document.location.reload();
        });

        socket.on('game-has-started', function (data) {
            $('#message').html('Unable to join, game already started');
        });

        socket.on('game-full', function (data) {
            $('#message').html('Unable to join, game is full');
        });

        socket.on('game-not-available', function (data) {
            sessionStorage.setItem('game-room', '');
            $('input[name=game-code]').val('');
            $('#message').html('Unable to join, game not available<br />try again...');
        });

        socket.on('game-invalid', function (data) {
            if (!player.joined) {
                return;
            }
            sessionStorage.setItem('game-room', '');
            document.location.reload();
        });

        socket.on('player-joined', function (data) {
            player.joined = true;
            emitPlayerUpdate();
            $('#score').html('Synced');
        });

        socket.on('game-get-ready', function (data) {
            Upon.log('game-get-ready');
            $('#score').html('Get ready');
        });

        socket.on('game-start', function (data) {
            Upon.log('game-start');
            $('#score').html(0);
        });

        socket.on('game-end', function (data) {
            if (!player.joined) {
                return false;
            }
            Upon.log('game-end');

            player.joined = false;
            if (data.highScore) {
                var fbText = 'Playing Multeor I scored a new highscore of ' + player.score + ' points!';
                var scoreText = '<h1>Awesome, you scored a new highscore: <span>' + player.score + '</span></h1>';
                var opengraphImage = 'http://multeor.com/static/images/opengraph-600x600-highscore.png';
            } else {
                var fbText = 'Playing Multeor I scored ' + player.score + ' points!';
                var scoreText = '<h1>Good job, you scored: <span>' + player.score + '</span></h1>';
                var opengraphImage = 'http://multeor.com/static/images/opengraph-600x600.png';
            }

            $('#game-start, #controller').hide();
            $('#game-end').fadeIn(1000);
            $('#game-end .you-scored-text').html(scoreText);
            $('#facebook-share a').on('click', function (event) {
                event.preventDefault();
                fbPublish(fbText, opengraphImage, function (status) {
                    if (status) {
                        $('#facebook-share').hide();
                    }
                });
            });
        });

        socket.on('update-score', function (data) {
            Upon.log('update-score');

            $('#controller').css({backgroundColor: '#FFF'});
            setTimeout(function () {
                $('#controller').css({backgroundColor: 'rgba(' + player.color + ',1)'});
            }, 250);

            player.score = data.score;
            $('#score').html(player.score);

            // play different sounds for normal and bonus hits
            // play bonus sound
            var audio = data.audio;
            play(1, audio);

        });

        socket.on('update-player-color', function (data) {
            player.color = data.playerColor;
            $('#controller').css({backgroundColor: 'rgba(' + player.color + ',1)'});
            $('#game-start, #game-end').hide();
            $('#controller').show();
        });

        var ppsCounter = 0;
        var previousTimer = new Date();
        setInterval(function () {
            var time = new Date();
            var timePast = time - previousTimer;
            if (timePast > 1000) {
                previousTimer = time;
                var currentPps = Math.round(ppsCounter / (timePast / 1000), 2);
                //$('#message').html(currentPps + ' average PPS');
                ppsCounter = 0;
            }
        }, 500);

        var emitPlayerUpdate = function () {
            if (!player.joined) {
                return false;
            }

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

        var updatePlayerXY = function (x, y) {
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

        var updatePlayerZ = function (z) {
            player.layer = z;
            player.fresh = true;
        };

        var toDegrees = function (x, y, centerX, centerY, radius) {
            var degrees = 0;
            var overstaand = y - centerY;
            var aanliggend = x - centerX;
            var schuin = Math.sqrt(Math.pow(overstaand, 2) + Math.pow(aanliggend, 2));
            var sinJ = overstaand / schuin;
            var cosJ = aanliggend / schuin;

            var radian = Math.asin(sinJ);

            degrees = Math.asin(sinJ) * 180 / Math.PI;
            if (aanliggend < 0) {
                degrees = 180 - degrees;
                radian = Math.PI - radian;
            }

            if (schuin > radius) {
                schuin = radius;
                overstaand = cosJ * radius;
                aanliggend = sinJ * radius;
            }

            return {'deg': degrees, 'rad': radian, 'length': schuin};
        };

        if (window.navigator.msPointerEnabled) {
            //http://blogs.msdn.com/b/ie/archive/2011/09/20/touch-input-for-ie10-and-metro-style-apps.aspx
            $('#leftControls').on('MSPointerMove', function (event) {
                event.preventDefault();
                var x = (event.originalEvent.clientX.toFixed(0) - $(this).offset().left);
                var y = (event.originalEvent.clientY.toFixed(0) - $(this).offset().top);
                updatePlayerXY(x, y);
            });
            $('#leftControls').on('MSPointerUp', function (event) {
                $('#stick').animate({left: 0, top: 0}, 250);
            });
            $('#rightControls #boost').on('MSPointerDown', function (event) {
                event.preventDefault();

                updatePlayerZ(3);
                $(this).toggleClass('pressed');
            });
            $('#rightControls #boost').on('MSPointerUp', function (event) {
                event.preventDefault();

                updatePlayerZ(1);
                $(this).toggleClass('pressed');
            });
        } else {

            // fix to get audio running on iOS first audio has to be initiated by user action
            // this plays the audio with gain parameter set to 0
            $('#leftControls').on('touchstart', function (event) {
                play(0);
                $('#leftControls').off('touchstart');
            });
            $('#leftControls').on('touchmove', function (event) {
                event.preventDefault();
                var x = (event.originalEvent.targetTouches[0].clientX);
                var y = (event.originalEvent.targetTouches[0].clientY);
                updatePlayerXY(x, y);
            });
            $('#leftControls').on('touchend', function (event) {
                $('#stick').animate({left: 0, top: 0}, 250);
            });
            $('#rightControls').on('touchstart', function (event) {
                event.preventDefault();
                updatePlayerZ(3);
                $('#boost').addClass('pressed');
            });
            $('#rightControls').on('touchend', function (event) {
                event.preventDefault();

                updatePlayerZ(1);
                $('#boost').removeClass('pressed');
            });
        }

        // Tested in Android Chrome
        var sensorsMode = false;
        $(window).on("deviceorientation", function (event) {
            if (sensorsMode) {
                var x = (event.originalEvent.beta + 86) * 2.3;
                var y = (event.originalEvent.gamma*-1 + 10) * 2.3 + 50;
                updatePlayerXY(x, y);
            }
        });
        $(window).on("devicemotion", function (a) {
            if (sensorsMode) {
                var acc = a.originalEvent.acceleration;
                if (acc.z < -2){
                    updatePlayerZ(3);
                    $("#boost").addClass("pressed")
                } else if (acc.z > 1) {
                    updatePlayerZ(1);
                    $("#boost").removeClass("pressed")
                }
            }
        });
        $("#sensors").on("touchstart", function(event) {
            event.preventDefault();
            sensorsMode = !sensorsMode;
            if (sensorsMode)
                $("#sensors").addClass("enabled");
            else
                $("#sensors").removeClass("enabled");
        });

        $('input[name=game-code]').on('blur', function () {
            $('#join-game button').trigger('click');
        });
        $('#join-game').removeClass('disabled');
        $('#join-game button').text('Join Game').on('click', function (event) {
            event.preventDefault();
            var gameRoomInput = $('input[name=game-code]');
            if (gameRoomInput.val().length > 0) {
                var gameRoom = parseInt(gameRoomInput.val(), 10);
                if (isNaN(gameRoom) || gameRoom < 10000 || gameRoom > 99999) {
                    $('#message').html('Game code invalid<br />try again...');
                    gameRoomInput.val('');
                } else {
                    sessionStorage.setItem('game-room', gameRoom);
                    player.gameRoom = gameRoom;
                    var playerIcon = player.facebookProfile ? player.facebookProfile.picture.data.url : false;
                    var playerName = player.facebookProfile ? player.facebookProfile.name : false;
                    socket.emit('new-player', {
                        playerId: player.id,
                        gameRoom: gameRoom,
                        playerIcon: playerIcon,
                        playerName: playerName,
                        webAudioSupported: player.webAudioSupported
                    });
                }
            }
        });

        $('#game-reset a').on('click', function (event) {
            event.preventDefault();
            document.location.reload();
        });

        // Insert game-code if available in storage
        if (player.gameRoom) {
            $('input[name=game-code]').val(player.gameRoom);
        }
        $('input[name=game-code]').focus();

        // Show Facebook icon if connected
        if (player.facebookProfile) {
            $('#game-start, #game-end').removeClass('anon');
            $('.buddy-icon').css({backgroundImage: 'url(' + player.facebookProfile.picture.data.url + ')'});
        } else {
            $('#game-start, #game-end').addClass('anon');
        }

        $('#game-start').show();


        // setup audio for ios/Iphone
        if ('webkitAudioContext' in window) {
            player.webAudioSupported = true;
            myAudioContext = new webkitAudioContext();
            volume = myAudioContext.createGainNode();
            volume.gain.value = 1; // values 0.00 - 1
            volume.connect(myAudioContext.destination);

            var audioElem = document.createElement('audio');
            var fileType = "mp3";

            // returns 'probably', 'maybe' or ''. Only when it's probably we'll use ogg.
            var isSupported = audioElem.canPlayType('audio/ogg; codecs="vorbis"');

            if (isSupported == "probably") {
                fileType = "ogg";
            }


            // FIX: Preload audio files from level.json
            request = new XMLHttpRequest();
            request._fileName = 'bonus';
            request.open('GET', '/levels/forest/audio/sprites/bonus.' + fileType, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', bufferSound, false);
            request.send();

            request = new XMLHttpRequest();
            request._fileName = 'explosion';
            request.open('GET', '/levels/forest/audio/sprites/explosion.' + fileType, true);
            request.responseType = 'arraybuffer';
            request.addEventListener('load', bufferSound, false);
            request.send();
        }

        // Scroll to 0 to make some mobile browser go into fullscreen mode
        setTimeout(function () {
            window.scrollTo(0, 1);
        }, 0);
    });
}

// continue audio setup and play code
var myAudioContext;
var mySource;
var volume;
var request;
var buffers = {};

function bufferSound(event) {
    var request = event.target;
    var buffer = myAudioContext.createBuffer(request.response, false);
    buffers[request._fileName] = buffer;
}

function play(gain, audio) {

    // this happens on the 'touchstart' event of the left controller,
    // needed to trigger audio in iOS, it wont play audio unless first initiated by user interaction
    if (typeof audio === 'undefined') {
        audio = 'bonus';
    }

    mySource = myAudioContext.createBufferSource();
    mySource.buffer = buffers[audio];
    volume.gain.value = gain;
    mySource.connect(volume);
    mySource.noteOn(0);
}

