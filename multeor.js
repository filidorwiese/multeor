// Start websocket
var io = require('socket.io').listen(3333);
io.set('log level', 1);

//var players = [];
var maxPlayers = 8;

//var nextPlayerNumber = 1;
//var currentViewers = [];
//var currentGame = 'Level1';
var fpsCounter = 0;
var previousTimer = 0;
//var maxPlayers = 8;
//var gameStarted = false;
var currentGames = {};


// Bind listeners
io.sockets.on('connection', function(socket) {
	
	socket.on('new-viewer', function(data){
		assignNewViewer(socket, data.viewerId, data.gameRoom);
	});
	
	socket.on('new-player', function(data){
		assignNewPlayer(socket, data.playerId, data.gameRoom);
	});

	socket.on('verify-game-room', function(data){
		if (!verifyGameRoom(data.gameRoom)) { kickClient(socket); return false; }
	});
	
	socket.on('player-update', function(data){
		//console.log('player-update: ' + JSON.stringify(data));
		/*
		if (typeof players[socket.id] == 'undefined' || currentViewers.length < 1) { return false; }
		if (!players[socket.id].joined) { return false; }
		
		var time = new Date();
		if (time - previousTimer > 1000) {
			previousTimer = time;
			console.log('Packet per seconds: ' + fpsCounter);
			fpsCounter = 0;
		}
		fpsCounter++;
		
		data.number = players[socket.id].number;
		for (viewer in currentViewers) {
			io.sockets.socket(currentViewers[viewer]).emit('player-update', data);
		}*/
	});

	socket.on('update-score', function(data){
		console.log('update-score: ' + JSON.stringify(data));
		/*
		//console.log(data.player + ' ' + data.points);
		for (player in players) {
			if (players[player].number == data.player) {
				io.sockets.socket(player).emit('update-score', {points: data.points});
			}
		}*/
	});
	
	socket.on('game-start', function(data){
		console.log('game-start: ' + JSON.stringify(data));
		//startGame(socket);
	});
	
	socket.on('game-end', function(data){
		console.log('game-end: ' + JSON.stringify(data));
		//endGame(socket);
	});

	socket.on('disconnect', function() {
		console.log(socket.id + ' disconnected');
		/*
		for (viewer in currentViewers) {
			io.sockets.socket(currentViewers[viewer]).emit('removed-player', players[socket.id]);
		}
		delete players[socket.id];
		
		var playerCount = 0;
		for (player in players) {
			if (players[player].joined) playerCount++;
		}
		
		//console.log('playerCount ' + playerCount);
		if (playerCount < 1) {
			endGame(socket);
		}*/
	});
});


/*
function startGame(socket) {
    socket.broadcast.to(currentGames).emit('game-start');
    io.sockets.socket(socket.id).emit('game-start');
    gameStarted = true;
}

function endGame(socket) {
    if (!gameStarted) { return false; }
    
    gameStarted = false;
    for (player in players) {
        players[player].joined = false;
    }
    
    socket.broadcast.to(currentGame).emit('game-end');
}*/

function assignNewPlayer(socket, playerId, gameRoom) {
    console.log('New player entered game ' + socket.id + ' using playerId ' + playerId + ' and gameRoom ' + gameRoom);
    
    // Check if gameRoom exists
    if (!verifyGameRoom(gameRoom)) { kickClient(socket); return; }
    
    // If player already exists, return
    if (typeof currentGames[gameRoom].players[socket.id] != 'undefined') {
        return false;
    }
    
    // Add player to gameRoom
    socket.join('room-' + gameRoom);

    // If more then allowed players, cancel
    var playerCount = 0;
    for (var ii in currentGames[gameRoom].joinedPlayers) { playerCount++; }
    if (playerCount >= maxPlayers) {
        io.sockets.socket(socket.id).emit('game-full');
        return false;
    }

    // Add player to joinedPlayers
    currentGames[gameRoom].joinedPlayers[playerId] = true;
    
    // Update gameState
    currentGames[gameRoom].players[socket.id] = playerId;

    // Update gameState to viewer
    io.sockets.socket(currentGames[gameRoom].viewer).emit('update-game-state', currentGames[gameRoom]);

    // Emit succes
    io.sockets.socket(socket.id).emit('player-joined');
}

function assignNewViewer(socket, viewerId, gameRoom) {
    console.log('Viewer identified as ' + socket.id + ' using viewerId ' + viewerId + ' and gameRoom ' + gameRoom);

    // Create gameRoom if it doesn't exist
    if (verifyGameRoom(gameRoom)) {
		if (viewerId != currentGames[gameRoom].viewerId)  {
			kickClient(socket);
            return false;
		}
	} else {
		currentGames[gameRoom] = {
            viewerId: viewerId,
            gameRoom: gameRoom,
            players: {}
        };
	}
    
    // New viewer in game state
    currentGames[gameRoom].viewer = socket.id;

    // Add viewer to gameRoom
    socket.join('room-' + gameRoom);
    
    // Tell viewer current game state
    currentGames[gameRoom].players;

    // Unjoin all players
    currentGames[gameRoom].joinedPlayers = {};
    
    // Update gameState to viewer
    io.sockets.socket(socket.id).emit('update-game-state', currentGames[gameRoom]);

    // Emit reset-game to players/viewer
    socket.broadcast.to('room-' + gameRoom).emit('game-reset');
}

function verifyGameRoom(gameRoom) {
    if (isNaN(gameRoom) || gameRoom < 10000 || gameRoom > 99999) {
        return false;
    }
    return typeof currentGames[gameRoom] != 'undefined';
}

function kickClient(socket) {
	console.log('Client kicked ' + socket.id);
	io.sockets.socket(socket.id).emit('game-invalid');
	socket.disconnect();
}
