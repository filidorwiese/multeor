var socket = io.connect();
var canvas = document.getElementById('spook');
    canvas.width = 1000;
    canvas.height = 800;
var context = document.getElementById('spook').getContext('2d');
var fpsCounter = 0;
var previousTimer = 0;
var players = [];
var houses = [];

function render(time){

    // TODO: sppoks/houses collision detection
    // bij hit verdiepingen open, spooks punten toekennen






    // Clear scherm
    context.clearRect(0,0, 1000, 800);

    // Herorder entities op basis van diepte
    var entities = [];
    for (key in houses) {
        if (houses[key].props.loaded) {
            entities[houses[key].props.z] = houses[key];
        }
    }
    for(key in players) {
        var newKey = players[key].props.z;
        if (typeof entities[newKey] != 'undefined') { newKey++; }
        entities[newKey] = players[key];
    }

    // Teken entities op canvas
    for (key in entities) {
        entities[key].draw(context);
    }
    
    // fps canvas meten
    if (time - previousTimer > 1000) {
        previousTimer = time;
        $('#debug').html(fpsCounter);
        fpsCounter = 0;
    }
    fpsCounter++;
}


$(document).ready(function(){
    // Bot
    /*
    players[0] = new Player();
    setInterval(function(){
        // Update bot
        var playerProps = players[0].props;
        playerProps.x = (canvas.width / 100) * Math.floor(Math.random()*100);
        playerProps.y = (canvas.height / 100) * Math.floor(Math.random()*100);
        playerProps.z = 20;
        playerProps.color = [255,0,0];
        playerProps.lastMoves.push([playerProps.posX, playerProps.posY]);
        if (playerProps.lastMoves.length > 10) { playerProps.lastMoves.shift(); }
    }, 100);*/
    

    socket.emit('i-am-viewer');
    
    socket.on('new-player', function(data){
        console.log('player ' + data.number + ' entered game');
        players[data.number] = new Player();
        var playerProps = players[data.number].props;
        playerProps.color = data.color;
    });

    socket.on('removed-player', function(data){
        console.log('player ' + data.number + ' left the game');
        delete players[data.number];
    });
    
    socket.on('player-update', function(data){
        if (typeof players[data.number] == 'undefined') {
            return;
        }
        var playerProps = players[data.number].props;
        playerProps.x = (canvas.width / 100) * data.x;
        playerProps.y = (canvas.height / 100) * data.y;
        playerProps.z = data.z + 20;
        
        playerProps.lastMoves.push([playerProps.x, playerProps.y]); //, playerProps.z
        if (playerProps.lastMoves.length > 10) { playerProps.lastMoves.shift(); }
    });

    // Huis laden
    houses.push(new House('/images/gebouwlos_groot.png'));
    
    
    var previousTime = 0;
    var mistPositionX = 0;
    (function animloop(time){
        requestAnimationFrame(animloop);
        render(time);


        // Mist
        /*
        if (time - previousTime > 50) {
            mistPositionX -= 5;
            if (mistPositionX < -5048) { mistPositionX = 0 }
            $('#mist-layer').css({ backgroundPosition: mistPositionX + 'px 0' });
            previousTime = time;
        }*/
    })();

});
