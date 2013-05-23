// Start websocket on port 843
// https://github.com/LearnBoost/socket.io/wiki/Socket.IO-and-firewall-software
// https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
var fs = require('fs');
var sys = require('sys');
var io = require('socket.io').listen(843);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);
//io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

var ppsCounter = 0;
var previousTimer = new Date();
var currentGames = {};
var maxPlayers = 8;

// PPS counter
setInterval(function(){
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
io.sockets.on('connection', function(socket) {
    log('New connection from ' + socket.handshake.address.address + ' on socket ' + socket.id);

    socket.on('new-viewer', function(data){
        assignNewViewer(socket, data.viewerId, data.gameRoom);
    });

    socket.on('new-player', function(data){
        assignNewPlayer(socket, data.playerId, data.gameRoom, data.playerIcon);
    });

    socket.on('verify-game-room', function(data){
        if (!verifyGameRoom(data.gameRoom)) {
			log('Verify-game-room: kickPlayer');
			kickClient(socket); return false;
		}
    });

    // Controller broadcasting user-input to viewer
    socket.on('player-update', function(data){
        //log('player-update: ' + JSON.stringify(data));

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

    socket.on('update-score', function(data){
        log('Update-score: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
			log('Update-score: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Lookup player and emit update-score
        for (var ii in currentGames[data.gameRoom].players) {
			if (currentGames[data.gameRoom].players[ii].playerId == data.playerId) {
				io.sockets.socket(ii).emit('update-score', data);
			}
		}
    });

    socket.on('update-player-color', function(data){
        log('Update-player-color: ' + JSON.stringify(data));

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

    socket.on('game-start', function(data){
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

    socket.on('game-get-ready', function(data){
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

    socket.on('game-end', function(data){
        //log('Game-end: ' + JSON.stringify(data));

        // Verify if this viewer is authorative for this gameRoom and that is exists
        if (!(verifyGameRoom(data.gameRoom, data.viewerId))) {
			log('Game-end: kickPlayer');
            kickClient(socket);
            return false;
        }

        // Store leaderboard image
        var leaderboardImage = false;
        if (data.leaderboard) {
            var leaderboardPath = __dirname + '/public/leaderboards/';
            var leaderboardImage = 'leaderboard_' + data.gameRoom + '_' + new Date().getTime() + '.png';
            var image = data.leaderboard.replace(/^data:image\/\w+;base64,/, '');
            var buf = new Buffer(image, 'base64');
            fs.writeFile(leaderboardPath + leaderboardImage, buf);
            log('Game-end: Saving leaderboard to ' + leaderboardPath + leaderboardImage);
        }

        // Emit Game-end to players
        for (var ii in currentGames[data.gameRoom].players) {
            io.sockets.socket(ii).emit('game-end', { leaderboard: 'http://game.multeor.com/leaderboards/' + leaderboardImage });
        }
    });

    socket.on('game-reset', function(data){
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

    socket.on('disconnect', function() {
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
                for (var ii in currentGames[gameRoom].players) { playerCount++; }
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

function assignNewPlayer(socket, playerId, gameRoom, playerIcon) {
    log('New player entered game ' + socket.id + ' using playerId ' + playerId + ' and gameRoom ' + gameRoom);

    // Check if gameRoom exists
    if (!verifyGameRoom(gameRoom)) {
		log('AssignNewPlayer: kickPlayer');
		kickClient(socket); return;
	}

    // If player already exists, return
    if (typeof currentGames[gameRoom].players[socket.id] != 'undefined') {
        return false;
    }

    // Game already started
    if (currentGames[gameRoom].started) {
		// FIXME
        io.sockets.socket(socket.id).emit('game-has-started');
        return false;
    }

    // If more then allowed players, cancel
    var playerCount = 0;
    for (var ii in currentGames[gameRoom].players) { playerCount++; }
    if (playerCount >= maxPlayers) {
        io.sockets.socket(socket.id).emit('game-full');
        return false;
    }

    // Add player to gameRoom
    socket.join('room-' + gameRoom);

    // Update gameState
    currentGames[gameRoom].players[socket.id] = { playerId: playerId, playerIcon: playerIcon };

    // Emit join succes to player
    io.sockets.socket(socket.id).emit('player-joined');

    // Emit updated gameState to viewer
    io.sockets.socket(currentGames[gameRoom].viewer).emit('update-game-state', currentGames[gameRoom]);
}

function assignNewViewer(socket, viewerId, gameRoom) {
    log('Viewer identified as ' + socket.id + ' using viewerId ' + viewerId + ' and gameRoom ' + gameRoom);

    // Create gameRoom if it doesn't exist
    if (verifyGameRoom(gameRoom)) {
        if (viewerId != currentGames[gameRoom].viewerId)  {
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