
var socketio = require('socket.io');
var io;
var players = [];
var nextPlayerNumber = 1;
var currentViewers = [];
var currentGame = 'Level1';
var fpsCounter = 0;
var previousTimer = 0;
var maxPlayers = 8;
var gameStarted = false;

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function(socket) {
        
        socket.on('i-am-viewer', function(){
            if (typeof players[socket.id] == 'undefined') {
                assignNewViewer(socket);
            }
        });
        
        socket.on('i-am-player', function(){
            if (typeof players[socket.id] == 'undefined') {
                nextPlayerNumber = assignNewPlayerConfig(socket);
            }

            if (players[socket.id].joined) {
                return false;
            }
            
            var readyCount = 0;
            for (player in players) {
                if (players[player].joined) { readyCount++; }
            }
            console.log(readyCount + ', ' + gameStarted);
            if (readyCount < maxPlayers && !gameStarted && currentViewers.length) {
                players[socket.id].joined = true;
                if (readyCount == 0) {
                    console.log('game-countdown');
                    socket.broadcast.to(currentGame).emit('game-countdown');
                    setTimeout(function(){
                        startGame(socket);
                    }, 11000);
                }
                io.sockets.socket(socket.id).emit('game-joined');
                console.log('game-joined');
            } else {
                console.log('game-full');
                io.sockets.socket(socket.id).emit('game-full');
            }
        });
        
        socket.on('player-update', function(data){
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
            }
        });

        socket.on('update-score', function(data){
            //console.log(data.player + ' ' + data.points);
            for (player in players) {
                if (players[player].number == data.player) {
                    io.sockets.socket(player).emit('update-score', {points: data.points});
                }
            }
        });
        
        socket.on('game-start', function(data){
            startGame(socket);
        });
        
        socket.on('game-end', function(data){
            console.log('game-end received');
            endGame(socket);
        });

        socket.on('disconnect', function() {
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
            }
        });
    });
}

function startGame(socket) {
    socket.broadcast.to(currentGame).emit('game-start');
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
}

function assignNewPlayerConfig(socket) {
    console.log('New player entered game ' + socket.id);
    
    players[socket.id] = {
        number: nextPlayerNumber,
        color: [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)],
        x: 0,
        y: 0,
        z: 0,
        ready: false
    };
    socket.join(currentGame);

    // Emit new player to all viewers
    //console.log(currentViewers);
    if (currentViewers.length) {
        for (viewer in currentViewers) {
            io.sockets.socket(currentViewers[viewer]).emit('new-player', players[socket.id]);
        }
    }

    console.log(players);
    return nextPlayerNumber + 1;
}

function assignNewViewer(socket) {
    console.log('Viewer identified as ' + socket.id);

    currentViewers.push(socket.id);
    socket.join(currentGame);

    // Emit all players
    for (viewer in currentViewers) {
        for (player in players) {
            console.log(currentViewers[viewer] + ' ' + players[player]);
            io.sockets.socket(currentViewers[viewer]).emit('new-player', players[player]);
            //socket.broadcast.to('Game1').emit('this-is-the-viewer', currentViewers);
        }
    }
}
