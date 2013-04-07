var Player = function(playerId, viewportWidth, viewportHeight, color){
    this.props = {
		playerId: playerId,
        x: 0,
        y: 0,
        z: 0,
        vector: [0, 0, 0], // Angle, length, depth
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

Player.prototype.updatePosition = function() {
	var xySpeed = .1;
	var radians = this.props.vector[0] * (Math.PI / 180);
	
	this.props.x += ((Math.cos(radians) * this.props.vector[1]) * xySpeed);
	if (this.props.x > this.props.maxX) { this.props.x = this.props.maxX; }
    if (this.props.x < this.props.minX) { this.props.x = this.props.minX; }
    
    this.props.y += ((Math.sin(radians) * this.props.vector[1]) * xySpeed);
	if (this.props.y > this.props.maxY) { this.props.y = this.props.maxY; }
    if (this.props.y < this.props.minY) { this.props.y = this.props.minY; }
	
	var zSpeed = 3;
	if (this.props.z > this.props.vector[2]) {
		this.props.z -= zSpeed;
	} else {
		this.props.z += zSpeed;
	}
	if (this.props.z > this.props.maxZ) { this.props.z = this.props.maxZ; }
	if (this.props.z < this.props.minZ) { this.props.z = this.props.minZ; }
	
    this.props.lastMoves.push([this.props.x, this.props.y]); //, playerProps.z
    if (this.props.lastMoves.length > 10) { this.props.lastMoves.shift(); }
}

Player.prototype.updateScore = function(points) {
    this.props.score += points;
	socket.emit('update-score', {viewerId: viewerId, gameRoom: gameRoom, playerId: this.props.playerId, score: this.props.score});
	$(window).trigger('audio-destroy');
}
