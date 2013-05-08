var Player = function(playerId, viewportWidth, viewportHeight, playerColor, playerNumber){

    var self = this;
    self.props = {
		playerId: playerId,
        playerNumber: playerNumber,
        score: 0,
        x: 0,
        y: 0,
        z: 0,
        vector: [0, 0, 0], // Angle, length, layer
        minX: 60,
        maxX: viewportWidth - 180,
        minY: 0,
        maxY: viewportHeight,
        minZ: 50,
        maxZ: 150,
        color: playerColor,
        lastMoves: [],
        meteorHeadAngle: 0,
        locked: false,
        endX: 0,
        endY: 0,
        endZ: 60
    };
    
    self.props.y = (playerNumber * (self.props.minZ + 18));
}

Player.prototype.draw = function(context) {
	this.updatePosition();
	
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

        // meteor head
        var playerYPadding = this.props.z * .2;
        var playerXPadding = this.props.z * .2;
        var playerRight = this.props.x - playerXPadding;
        var playerLeft = this.props.x + playerXPadding;
        var playerTop = this.props.y + playerYPadding;
        var playerBottom = this.props.y - playerYPadding;
        context.save();
        context.fillStyle = 'rgba(0,0,0,.6)';
        context.translate(headX , headY);
        this.props.meteorHeadAngle++;
        context.rotate((Math.PI / 180) * this.props.meteorHeadAngle);
        context.fillRect(playerXPadding, playerYPadding, playerRight - playerLeft, playerBottom - playerTop);
        context.restore();
    }    
};

Player.prototype.updatePosition = function() {
    if (this.props.locked) {
        // Adjust player to endX / endY / endZ
        var xyStep = 2;
        var zStep = .5;
        if (this.props.x + xyStep < this.props.endX) { this.props.x += xyStep; }
        if (this.props.y + xyStep < this.props.endY) { this.props.y += xyStep; }
        if (this.props.z + zStep < this.props.endZ) { this.props.z += zStep; }

        if (this.props.x - xyStep > this.props.endX) { this.props.x -= xyStep; }
        if (this.props.y - xyStep > this.props.endY) { this.props.y -= xyStep; }
        if (this.props.z - zStep > this.props.endZ) { this.props.z -= zStep; }
        //Upon.log(this.props.playerId + ': ' + this.props.x + ', ' + this.props.y + ', ' + this.props.z);

    } else {
        // Adjust to player input
        var xSpeed = ySpeed = .1;
    	var radians = this.props.vector[0] * (Math.PI / 180);
        //Upon.log(this.props.vector[0]);

    	var zSpeed = 3;
    	if (this.props.z - zSpeed > (this.props.vector[2] * 50)) {
    		this.props.z -= zSpeed;
    	} else if (this.props.z + zSpeed < (this.props.vector[2] * 50)) {
    		this.props.z += zSpeed;
    	}
    	if (this.props.z > this.props.maxZ) { this.props.z = this.props.maxZ; }
    	if (this.props.z < this.props.minZ) { this.props.z = this.props.minZ; }


        if (this.props.vector[0] > 90 && this.props.vector[0] < 270) { xSpeed *= 2; } // If direction is backwards, double speed
        this.props.x += ((Math.cos(radians) * this.props.vector[1]) * xSpeed);
        if (this.props.x > this.props.maxX) { this.props.x = this.props.maxX; }
        if (this.props.x < this.props.minX) { this.props.x = this.props.minX; }
        
        var halfHeight = this.props.z / 2;
        this.props.y += ((Math.sin(radians) * this.props.vector[1]) * ySpeed);
        if (this.props.y > this.props.maxY - halfHeight) { this.props.y = this.props.maxY - halfHeight; }
        if (this.props.y < this.props.minY + halfHeight) { this.props.y = this.props.minY + halfHeight; }
    }

    this.props.lastMoves.push([this.props.x, this.props.y]); //, playerProps.z
    if (this.props.lastMoves.length > 10) { this.props.lastMoves.shift(); }
}

Player.prototype.updateScore = function(points) {
    this.props.score += points;
	socket.emit('update-score', {viewerId: viewerId, gameRoom: gameRoom, playerId: this.props.playerId, score: this.props.score});
}

Player.prototype.lockPlayer = function() {
    this.props.locked = true;
}
