// Start websocket on port 443
// https://github.com/LearnBoost/socket.io/wiki/Socket.IO-and-firewall-software
// https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
var fs = require('fs');
var sys = require('sys');
var mkdirp = require('mkdirp');
var io = require('socket.io').listen(443);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);
io.set('transports', ['websocket']);//, 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

var ppsCounter = 0;
var previousTimer = new Date();
var currentGames = {};
var maxPlayers = 8;

// Read highscores from a private file
log('Working directory: ' + __dirname);
var highScorePrivateFile = __dirname + '/high-score-private.json';
var highScorePublicFile = __dirname + '/public/high-score-public.json';
var highestScore = [{"name": "Anonymous", "score": 10, "ip": "0.0.0.0"}];
fs.readFile(highScorePrivateFile, 'utf8', function (err, data) {
    if (!err) {
        highestScore = JSON.parse(data);
    }
});

// Store the highestscore in a public file (without ip)
var tmpObject = {name: highestScore[0].name, score: highestScore[0].score, icon: highestScore[0].icon};
fs.writeFile(highScorePublicFile, JSON.stringify(tmpObject), function (err) {
    if (err) {
        log(err);
    }
});

// PPS counter
setInterval(function () {
    var time = new Date();
    var timePast = time - previousTimer;
    if (timePast > 5000) {
        previousTimer = time;
        var currentPps = Math.round(ppsCounter / (timePast / 1000), 2);
        var currentGameCounter = 0;
        var currentPlayersCounter = 0;
        for (var ii in currentGames) {
            currentGameCounter++;
            for (var oo in currentGames[ii].players) {
                currentPlayersCounter++;
            }
        }
        if (currentPlayersCounter && currentPps > 0) {
            log('Stats: ' + currentGameCounter + ' games, ' + currentPlayersCounter + ' players, ' + currentPps + ' average PPS');
        }

        ppsCounter = 0;
    }
}, 1000);

// Bind listeners
io.sockets.on('connection', function (socket) {
    log('New connection from ' + socket.handshake.address.address + ' on socket ' + socket.id);

    socket.on('new-viewer', function (data) {
        assignNewViewer(socket, data.viewerId, data.gameRoom);
    });

    socket.on('new-player', function (data) {
        assignNewPlayer(socket, data.playerId, data.gameRoom, data.playerIcon, data.playerName);
    });

    // Controller broadcasting user-input to viewer
    socket.on('player-update', function (data) {
        //log('Player-update: ' + JSON.stringify(data));

        // Verify if gameRoom exists
        if (!(verifyGameRoom(data.gr))) {
            log('Player-update: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Check if player is joined in gameRoom
        if (currentGames[data.gr].players[socket.id].playerId != data.pid) {
            kickClient(socket);
            return false;
        }

        // Emit player-update to viewer
        io.sockets.socket(currentGames[data.gr].viewer).emit('player-update', data);

        ppsCounter++;
    });

    socket.on('update-score', function (data) {
        //log('Update-score: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Update-score: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Lookup player and emit update-score
        for (var ii in currentGames[data.gameRoom].players) {
            if (currentGames[data.gameRoom].players[ii].playerId == data.playerId) {
                currentGames[data.gameRoom].players[ii].score = data.score;
                io.sockets.socket(ii).emit('update-score', data);
            }
        }
    });

    socket.on('update-player-color', function (data) {
        //log('Update-player-color: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Update-player-color: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Lookup player and emit update-score
        for (var ii in currentGames[data.gameRoom].players) {
            if (currentGames[data.gameRoom].players[ii].playerId == data.playerId) {
                io.sockets.socket(ii).emit('update-player-color', data);
            }
        }
    });

    socket.on('game-start', function (data) {
        log('Game-start: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Game-start: kickPlayer');
            kickClient(socket);
            return false;
        }

        currentGames[data.gameRoom].started = true;

        // Emit game-start to all joined players
        socket.broadcast.to('room-' + data.gameRoom).emit('game-start');
    });

    socket.on('game-get-ready', function (data) {
        log('Game-get-ready: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Game-get-ready: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Emit game-get-ready to all joined players
        socket.broadcast.to('room-' + data.gameRoom).emit('game-get-ready');
    });

    socket.on('store-leaderboard', function (data) {
        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Game-end: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Store leaderboard image
        var leaderboardImage = false;
        if (data.leaderboard) {
            var date = new Date();
            var leaderboardPath = __dirname + '/public/leaderboards/' + date.getUTCFullYear() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/';
            mkdirp(leaderboardPath, function (err) {
                if (err) {
                    log(err);
                } else {
                    var leaderboardImage = 'leaderboard_' + new Date().getTime() + '_' + data.gameRoom + '.png';
                    var image = data.leaderboard.replace(/^data:image\/\w+;base64,/, '');
                    var buf = new Buffer(image, 'base64');
                    fs.writeFile(leaderboardPath + leaderboardImage, buf);
                    log('Game-end: Saving leaderboard to ' + leaderboardPath + leaderboardImage);
                }
            });
        }
    });

    socket.on('game-end', function (data) {
        log('Game-end: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Game-end: kickPlayer');
            kickClient(socket);
            return false;
        }

        for (var ii in currentGames[data.gameRoom].players) {
            // High-score?
            var highScore = false;
            if (currentGames[data.gameRoom].players[ii].playerName && currentGames[data.gameRoom].players[ii].score > highestScore[0].score) {
                highScore = true;

                // Store playerIcon to file
                var httpRequest = require('http-request');
                var options = {url: currentGames[data.gameRoom].players[ii].playerIcon};
                var randomName = '/leaderboards/avatars/' + data.gameRoom + '_' + (+new Date()).toString(36) + '.jpg';
                httpRequest.get(options, __dirname + '/public/' + randomName, function (err, result) {
                    if (err) {
                        log(err);
                    }
                });

                // Update high-score
                var tmpObject = {
                    name: currentGames[data.gameRoom].players[ii].playerName,
                    score: currentGames[data.gameRoom].players[ii].score,
                    icon: randomName
                };

                // Write to private file
                fs.writeFile(highScorePublicFile, JSON.stringify(tmpObject), function (err) {
                    if (err) {
                        log(err);
                    }
                });

                // Write to public file (with ipaddress added)
                tmpObject.ip = socket.handshake.address.address;
                highestScore.unshift(tmpObject);
                fs.writeFile(highScorePrivateFile, JSON.stringify(highestScore), function (err) {
                    if (err) {
                        log(err);
                    }
                });

                log('New highscore ' + tmpObject.score + ' by ' + tmpObject.name + ' from ip ' + tmpObject.ip + ' using icon ' + randomName);
            }

            // Emit Game-end to players
            io.sockets.socket(ii).emit('game-end', {
                highScore: highScore
            });
        }
    });

    socket.on('game-reset', function (data) {
        log('Game-reset: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
            log('Game-reset: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Unjoin players and make them leave the room
        for (var ii in currentGames[data.gameRoom].players) {
            io.sockets.socket(ii).emit('game-reset');
            io.sockets.socket(ii).leave('room-' + data.gameRoom);
        }
        currentGames[data.gameRoom].players = {};

        // Unstart game
        currentGames[data.gameRoom].started = false;
    });

    socket.on('disconnect', function () {
        // if viewer disconnects, delete game and emit game-invalid
        var isViewer = false;
        for (var ii in currentGames) {
            if (currentGames[ii].viewer == socket.id) {
                isViewer = true;
                log('Viewer on socket ' + socket.id + ' disconnected');
                socket.broadcast.to('room-' + ii).emit('game-invalid');
                delete currentGames[ii];
            }
        }

        // if player disconnects, delete player and emit game-reset
        if (!isViewer) {
            log('Player on socket ' + socket.id + ' disconnected');

            var gameRoom = false;
            for (var ii in currentGames) {
                for (var oo in currentGames[ii].players) {
                    if (oo == socket.id) {
                        gameRoom = ii;
                        delete currentGames[ii].players[oo];
                    }
                }
            }

            if (gameRoom) {
                var playerCount = 0;
                for (var ii in currentGames[gameRoom].players) {
                    playerCount++;
                }
                if (playerCount < 1) {
                    socket.broadcast.to('room-' + gameRoom).emit('game-end');
                } else {
                    // Emit updated gameState to viewer
                    io.sockets.socket(currentGames[gameRoom].viewer).emit('update-game-state', currentGames[gameRoom]);
                }
            }
        }
    });
});

function assignNewPlayer(socket, playerId, gameRoom, playerIcon, playerName) {
    log('New player entered game ' + socket.id + ' using playerId ' + playerId + ' and gameRoom ' + gameRoom);

    // Check if gameRoom exists
    if (!verifyGameRoom(gameRoom)) {
        io.sockets.socket(socket.id).emit('game-not-available');
        return false;
    }

    // If player already exists, return
    if (typeof currentGames[gameRoom].players[socket.id] != 'undefined') {
        return false;
    }

    // Game already started
    if (currentGames[gameRoom].started) {
        io.sockets.socket(socket.id).emit('game-has-started');
        return false;
    }

    // If more then allowed players, cancel
    var playerCount = 0;
    for (var ii in currentGames[gameRoom].players) {
        playerCount++;
    }
    if (playerCount >= maxPlayers) {
        io.sockets.socket(socket.id).emit('game-full');
        return false;
    }

    // Add player to gameRoom
    socket.join('room-' + gameRoom);

    // Update gameState
    currentGames[gameRoom].players[socket.id] = {
        playerId: playerId,
        playerIcon: playerIcon,
        playerName: playerName,
        score: 0
    };

    // Emit join succes to player
    io.sockets.socket(socket.id).emit('player-joined');

    // Emit updated gameState to viewer
    io.sockets.socket(currentGames[gameRoom].viewer).emit('update-game-state', currentGames[gameRoom]);
}

function assignNewViewer(socket, viewerId, gameRoom) {
    log('Viewer identified as ' + socket.id + ' using viewerId ' + viewerId + ' and gameRoom ' + gameRoom);

    // Create gameRoom if it doesn't exist
    if (verifyGameRoom(gameRoom)) {
        if (viewerId != currentGames[gameRoom].viewerId) {
            log('AssignNewViewer: kickPlayer');
            kickClient(socket);
            return false;
        }
    } else {
        currentGames[gameRoom] = {
            viewerId: viewerId,
            gameRoom: gameRoom
        };
    }

    // New viewer in game state
    currentGames[gameRoom].viewer = socket.id;

    // Unjoin all players and clear players
    currentGames[gameRoom].players = {};

    // Game not yet started
    currentGames[gameRoom].started = false;

    // Add viewer to gameRoom
    socket.join('room-' + gameRoom);

    // Emit reset-game to players/viewer
    socket.broadcast.to('room-' + gameRoom).emit('game-reset');

    // Emit updated gameState to viewer
    io.sockets.socket(socket.id).emit('update-game-state', currentGames[gameRoom]);
}

function verifyGameRoom(gameRoom, viewerId) {
    // Check if gameRoom exists
    if (isNaN(gameRoom) || gameRoom < 10000 || gameRoom > 99999) {
        return false;
    }
    if (typeof currentGames[gameRoom] == 'undefined') {
        return false;
    }

    // If supplied, check if viewerId is autorative for this gameRoom
    if (typeof viewerId != 'undefined') {
        if (currentGames[gameRoom].viewerId != viewerId) {
            return false;
        }
    }

    return true;
}

function kickClient(socket) {
    log('Client kicked ' + socket.id);
    io.sockets.socket(socket.id).emit('game-invalid');
    socket.disconnect();
}

function log(logline) {
    console.log('[' + new Date().toUTCString() + '] ' + logline);
}
