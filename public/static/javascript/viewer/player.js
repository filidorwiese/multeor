var Player = function(context, playerId, playerIcon, playerColor, playerNumber) {

    var self = this;
    self.props = {
		playerId: playerId,
        playerNumber: playerNumber,
        icon: false,
        score: 0,
        x: 0,
        y: 0,
        z: 0,
        vector: [0, 0, 0], // Angle, length, layer
        minX: 60,
        maxX: context.canvas.width - 180,
        minY: 0,
        maxY: context.canvas.height,
        minZ: 50,
        maxZ: 150,
        color: playerColor,
        lastMoves: [],
        meteorHeadAngle: (playerNumber * 45),
        locked: false,
        endX: 0,
        endY: 0,
        endZ: 60
    };

    self.props.y = (playerNumber * (self.props.minZ + 18));

    if (playerIcon) {
        var image = new Image();
        image.src = playerIcon;
        image.onload = function() {
            self.loadIcon(this);
        }
    } else {
        self.loadIcon();
    }
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
        lingrad2.addColorStop(1, 'rgba(' + this.props.color + ',1)');
        lingrad2.addColorStop(0, 'rgba(' + this.props.color + ',0)');
        context.strokeStyle = lingrad2;
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();

        // Meteor head
        if (this.props.icon) {
            context.save();
            context.translate(headX, headY);
            context.rotate((Math.PI / 180) * this.props.meteorHeadAngle);
            this.props.meteorHeadAngle++;

            var w = Math.floor(this.props.z * .5);
            var h = Math.floor(this.props.z * .5);
            var x = Math.floor((w / 2) * -1); //(0.5 + somenum) << 0;
            var y = Math.floor((h / 2) * -1);
            context.drawImage(this.props.icon, x, y, w, h);
            context.restore();
        }
    }
};

Player.prototype.updatePosition = function() {
    if (this.props.locked) {
        // Adjust player to endX / endY / endZ
        var xyStep = 2;
        var zStep = 1;
        if (this.props.x < this.props.endX) { this.props.x += xyStep; }
        if (this.props.y < this.props.endY) { this.props.y += xyStep; }
        if (this.props.z < this.props.endZ) { this.props.z += zStep; }

        if (this.props.x > this.props.endX) { this.props.x -= xyStep; }
        if (this.props.y > this.props.endY) { this.props.y -= xyStep; }
        if (this.props.z > this.props.endZ) { this.props.z -= zStep; }
        //Upon.log(this.props.playerId + ': ' + this.props.x + ', ' + this.props.y + ', ' + this.props.z);

    } else {
        // Adjust to player input
        var xSpeed = ySpeed = .1;
    	var radians = this.props.vector[0] * (Math.PI / 180);

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

Player.prototype.loadIcon = function(image) {
    var self = this;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    var a = canvas.width, r = a / 2;

    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, a, a);
    }

    // http://stackoverflow.com/questions/8778864/cropping-an-image-into-hexagon-shape-in-a-web-page
    // http://jsfiddle.net/XnzP8/1/
    // http://blog.riacode.in/2011/03/03/drawing-regular-polygons-in-html5-canvas/
    ctx.globalCompositeOperation = 'destination-in';
    ctx.globalAlpha = .3;
    self.drawPolygon(ctx, 50, 50, r, 8);

    self.props.icon = canvas;
}

Player.prototype.drawPolygon = function(context, x, y, radius, numOfSides) {
    var angChange = (360 / numOfSides) * (Math.PI / 180.0);
    var prevX, prevY, firstX, firstY;

    context.beginPath();
    context.moveTo(Math.cos(angle) * radius, Math.cos(angle) * radius);

    for(var i=0; i < numOfSides; i++) {
        var angle = i * angChange;
        prevX = x1;
        prevY = y1;
        var x1 = x + Math.cos(angle) * radius;
        var y1 = y + Math.sin(angle) * radius;
        if(i > 0) {
            context.lineTo(x1,y1);
        } else {
            firstX = x1;
            firstY = y1;
        }
        if(i == numOfSides-1) {
            context.lineTo(firstX,firstY);
        }
    }

    context.closePath();
    context.fill();
}