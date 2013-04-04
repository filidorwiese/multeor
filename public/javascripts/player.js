var Player = function(viewportWidth, viewportHeight, color){
    this.props = {
        x: 0,
        y: 0,
        z: 0,
        minX: 60,
        maxX: viewportWidth - 180,
        minY: 60,
        maxY: viewportHeight - 60,
        minZ: 40,
        maxZ: 120,
        color: color,
        lastMoves: [],
        score: 0,
        angle: 0
    };
}

Player.prototype.draw = function(context) {
    if (this.props.lastMoves.length > 9) {
        var tailX = 0;
        var tailY = this.props.lastMoves[0][1];
        var control1X = this.props.lastMoves[6][0];
        var control1Y = this.props.lastMoves[6][1];
        var control2X = this.props.lastMoves[7][0];
        var control2Y = this.props.lastMoves[7][1];
        var headX = 100 + this.props.lastMoves[9][0];
        var headY = this.props.lastMoves[9][1];
        context.lineWidth = this.props.z;
        
        var lingrad2 = context.createLinearGradient(0,0, (headX - context.lineWidth / 2),0);
        lingrad2.addColorStop(1, this.props.color);
        lingrad2.addColorStop(0, 'rgba(0,0,0,0)');
        context.strokeStyle = lingrad2;
        //context.strokeStyle = 'rgba('+this.props.color[0]+','+this.props.color[1]+','+this.props.color[2]+', 1)';
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();

        // meteoor
        var weirdnessOffset = 100;
        var playerYPadding = 10;
        var playerXPadding = 10;
        var playerRight = players[player].props.x - playerXPadding;
        var playerLeft = players[player].props.x + playerXPadding;
        var playerTop = players[player].props.y + playerYPadding;
        var playerBottom = players[player].props.y - playerYPadding;
        context.save();
        context.fillStyle = 'rgba(0,0,0,.6)';
        context.translate(headX , headY );
        this.props.angle++;
        context.rotate((Math.PI / 180) * this.props.angle);
        context.fillRect(10, 10, playerRight-playerLeft, playerBottom-playerTop);
        context.restore();

    }    
};

Player.prototype.updateProps = function(x, y, z) {
    //console.log(x + ' ' + y + ' ' + z);
    this.props.x += x;
    if (this.props.x > this.props.maxX) { this.props.x = this.props.maxX; }
    if (this.props.x < this.props.minX) { this.props.x = this.props.minX; }

    this.props.y += y;
    if (this.props.y > this.props.maxY) { this.props.y = this.props.maxY; }
    if (this.props.y < this.props.minY) { this.props.y = this.props.minY; }

    this.props.z = z;
    if (this.props.z > this.props.maxZ) { this.props.z = this.props.maxZ; }
    if (this.props.z < this.props.minZ) { this.props.z = this.props.minZ; }


    //console.log(this.props.x + ' ' + this.props.y + ' ' + this.props.z);
    
    this.props.lastMoves.push([this.props.x, this.props.y]); //, playerProps.z
    if (this.props.lastMoves.length > 10) { this.props.lastMoves.shift(); }
}

Player.prototype.updateScore = function(points) {
    player.score += points;
}
