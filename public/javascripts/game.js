var Game = function(){
    this.props = {
        started: false,
        message: false
    };
}

Game.prototype.tick = function(time) {
    // Clear scherm
    context.clearRect(0,0, 1000, 600);

    // Herorder entities op basis van diepte
    var entities = [];
    /*
    for (key in houses) {
        if (houses[key].props.loaded) {
            entities[houses[key].props.z] = houses[key];
        }
    }*/
    for(key in players) {
        var newKey = players[key].props.z;
        if (typeof entities[newKey] != 'undefined') { newKey++; }
        entities[newKey] = players[key];
    }

    // Collision detection
    // update player-score

    // Teken entities op canvas
    for (key in entities) {
        entities[key].draw(context);
    }

    // Text plaatsen
    if (this.props.message.length) {
        context.save();
        context.font = '30px ablas_altbold';
        context.fillStyle = '#FFFFFF';

        var metrics = context.measureText(this.props.message);
        var _x = (canvas.width / 2) - (metrics.width / 2);
        var _y = (canvas.height / 2);
        context.fillText(this.props.message, _x, _y);
        context.restore();
    }
    
    // fps canvas meten
    if (time - previousTimer > 1000) {
        previousTimer = time;
        $('#debug').html(fpsCounter);
        fpsCounter = 0;
    }
    fpsCounter++;
}

Game.prototype.message = function(message) {
    this.props.message = message;
}
