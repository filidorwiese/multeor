
var socketio = require('socket.io');
var io;
var players = [];
var playerNumber = 1;
var currentViewer = false;
var currentRoom = 'Game1';
var fpsCounter = 0;
var previousTimer = 0;

exports.listen = function(server) {
    io = socketio.listen(server);
    io.set('log level', 0);
    io.sockets.on('connection', function(socket) {
        
        playerNumber = assignNewPlayerConfig(socket);
        
        joinGame(socket, currentRoom);

        socket.on('player-update', function(data){
            var time = new Date();
            if (time - previousTimer > 1000) {
                previousTimer = time;
                console.log('Packet per seconds: ' + fpsCounter);
                fpsCounter = 0;
            }
            fpsCounter++;
        
            data.number = players[socket.id].number;
            if (currentViewer !== false) {
                //console.log(data);
                io.sockets.socket(currentViewer).emit('player-update', data);
            }
        });
        
        socket.on('i-am-viewer', function(){
            //if (!currentViewer) {
                delete players[currentViewer];
                delete players[socket.id];
                currentViewer = socket.id;
                console.log('Viewer identified as ' + currentViewer);
                for (player in players) {
                    io.sockets.socket(currentViewer).emit('new-player', players[player]);
                }
                //socket.broadcast.to('Game1').emit('this-is-the-viewer', currentViewer);
            //}
        });

        handleClientDisconnect(socket);
    });
}

function assignNewPlayerConfig(socket) {
    if (socket.id != currentViewer) {
        players[socket.id] = {
            number: playerNumber,
            color: [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)],
            x: 0,
            y: 0,
            z: 0
        };
        io.sockets.socket(currentViewer).emit('new-player', players[socket.id]);
        console.log('New player entered game ' + socket.id);
        return playerNumber + 1;
    }
}

function joinGame(socket, game) {
    socket.join(game);
    currentRoom[socket.id] = game;
}

function handleClientDisconnect(socket) {
    socket.on('disconnect', function() {
        io.sockets.socket(currentViewer).emit('removed-player', players[socket.id]);
        delete players[socket.id];
    });
}
