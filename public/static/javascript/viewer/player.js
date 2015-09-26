'use strict';

var Player = function (context, playerId, playerIcon, playerColor, playerNumber, webAudioSupported) {
    var self = this;
    self.props = {
        playerId: playerId,
        playerNumber: playerNumber,
        webAudioSupported: webAudioSupported,
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
        image.crossOrigin = 'Anonymous';
        image.src = playerIcon;
        image.onload = function () {
            self.loadIcon(this);
        };
    } else {
        self.loadIcon();
    }
};

Player.prototype.draw = function (context) {
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

        var lingrad2 = context.createLinearGradient(0, 0, (headX - context.lineWidth / 2), 0);
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

            var w = Math.floor(this.props.z * 0.6);
            var h = Math.floor(this.props.z * 0.6);
            var x = Math.floor((w / 2) * -1);
            var y = Math.floor((h / 2) * -1);
            context.drawImage(this.props.icon, x, y, w, h);
            context.restore();
        }
    }
};

Player.prototype.shadow = function (context) {
    if (this.props.lastMoves.length > 9) {
        var offsetX = -50 * (this.props.z - this.props.minZ) / (this.props.maxZ - this.props.minZ);
        var offsetZ = this.props.minZ;
        var offsetY = (this.props.z * 1.5) - (offsetZ * 1.5);
        var alpha = .1;
        if (offsetY < 5) {
            return;
        }

        var tailX = 0 + offsetX;
        var tailY = this.props.lastMoves[0][1] + offsetY;
        var control1X = this.props.lastMoves[6][0] + offsetX;
        var control1Y = this.props.lastMoves[6][1] + offsetY;
        var control2X = this.props.lastMoves[7][0] + offsetX;
        var control2Y = this.props.lastMoves[7][1] + offsetY;
        var headX = 100 + this.props.lastMoves[9][0] + offsetX;
        var headY = this.props.lastMoves[9][1] + offsetY;
        context.lineWidth = offsetZ;

        var lingrad2 = context.createLinearGradient(0, 0, (headX - context.lineWidth / 2), 0);
        lingrad2.addColorStop(1, 'rgba(36,42,48,' + alpha + ')');
        lingrad2.addColorStop(0, 'rgba(36,42,48,0)');
        context.strokeStyle = lingrad2;
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();
    }
}

Player.prototype.updatePosition = function () {
    if (this.props.locked) {
        // Adjust player to endX / endY / endZ
        var xyStep = 2;
        var zStep = 1;
        if (this.props.x < this.props.endX) {
            this.props.x += xyStep;
        }
        if (this.props.y < this.props.endY) {
            this.props.y += xyStep;
        }
        if (this.props.z < this.props.endZ) {
            this.props.z += zStep;
        }

        if (this.props.x > this.props.endX) {
            this.props.x -= xyStep;
        }
        if (this.props.y > this.props.endY) {
            this.props.y -= xyStep;
        }
        if (this.props.z > this.props.endZ) {
            this.props.z -= zStep;
        }
        //Upon.log(this.props.playerId + ': ' + this.props.x + ', ' + this.props.y + ', ' + this.props.z);

    } else {
        // Adjust to player input
        var xSpeed = 0.1;
        var ySpeed = 0.1;
        var radians = this.props.vector[0] * (Math.PI / 180);

        var zSpeed = 3;
        if (this.props.z - zSpeed > (this.props.vector[2] * 50)) {
            this.props.z -= zSpeed;
        } else if (this.props.z + zSpeed < (this.props.vector[2] * 50)) {
            this.props.z += zSpeed;
        }
        if (this.props.z > this.props.maxZ) {
            this.props.z = this.props.maxZ;
        }
        if (this.props.z < this.props.minZ) {
            this.props.z = this.props.minZ;
        }

        if (this.props.vector[0] > 90 && this.props.vector[0] < 270) {
            xSpeed *= 2;
        } // If direction is backwards, double speed
        this.props.x += ((Math.cos(radians) * this.props.vector[1]) * xSpeed);
        if (this.props.x > this.props.maxX) {
            this.props.x = this.props.maxX;
        }
        if (this.props.x < this.props.minX) {
            this.props.x = this.props.minX;
        }

        var halfHeight = this.props.z / 2;
        this.props.y += ((Math.sin(radians) * this.props.vector[1]) * ySpeed);
        if (this.props.y > this.props.maxY - halfHeight) {
            this.props.y = this.props.maxY - halfHeight;
        }
        if (this.props.y < this.props.minY + halfHeight) {
            this.props.y = this.props.minY + halfHeight;
        }
    }

    this.props.lastMoves.push([this.props.x, this.props.y]); //, playerProps.z
    if (this.props.lastMoves.length > 10) {
        this.props.lastMoves.shift();
    }
};

Player.prototype.updateScore = function (points, audio) {
    this.props.score += points;
    socket.emit('update-score', {
        viewerId: viewerId,
        gameRoom: gameRoom,
        playerId: this.props.playerId,
        score: this.props.score,
        audio: audio
    });
};

Player.prototype.lockPlayer = function () {
    this.props.locked = true;
};

Player.prototype.loadIcon = function (image) {
    var self = this;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    var r = canvas.width / 2;

    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // http://stackoverflow.com/questions/8778864/cropping-an-image-into-hexagon-shape-in-a-web-page
    // http://jsfiddle.net/XnzP8/1/
    // http://blog.riacode.in/2011/03/03/drawing-regular-polygons-in-html5-canvas/
    ctx.globalCompositeOperation = 'destination-in';
    //ctx.globalAlpha = .9;
    self.drawPolygon(ctx, r, r, r, 8);

    self.props.icon = canvas;
};

Player.prototype.drawPolygon = function (context, x, y, radius, numOfSides) {
    var angChange = (360 / numOfSides) * (Math.PI / 180.0);
    var prevX, prevY, firstX, firstY;

    context.beginPath();
    context.moveTo(Math.cos(angle) * radius, Math.cos(angle) * radius);

    var angle, x1, y1;
    for (var i = 0; i < numOfSides; i++) {
        angle = i * angChange;
        prevX = x1;
        prevY = y1;
        x1 = x + Math.cos(angle) * radius;
        y1 = y + Math.sin(angle) * radius;
        if (i > 0) {
            context.lineTo(x1, y1);
        } else {
            firstX = x1;
            firstY = y1;
        }
        if (i == numOfSides - 1) {
            context.lineTo(firstX, firstY);
        }
    }

    context.closePath();
    context.fill();
};

var PlayerShadow = function (player) {
    var self = this;
    self.props = {
        player: player.props
    };
};

PlayerShadow.prototype.draw = function (context) {
    if (this.props.player.lastMoves.length > 9) {

        var offsetX = -50 * (this.props.player.z - this.props.player.minZ) / (this.props.player.maxZ - this.props.player.minZ);
        var offsetZ = this.props.player.minZ;
        var offsetY = (this.props.player.z * 1.5) - (offsetZ * 1.5);
        var alpha = .1;
        if (offsetY < 5) {
            return;
        }

        var tailX = 0 + offsetX;
        var tailY = this.props.player.lastMoves[0][1] + offsetY;
        var control1X = this.props.player.lastMoves[6][0] + offsetX;
        var control1Y = this.props.player.lastMoves[6][1] + offsetY;
        var control2X = this.props.player.lastMoves[7][0] + offsetX;
        var control2Y = this.props.player.lastMoves[7][1] + offsetY;
        var headX = 100 + this.props.player.lastMoves[9][0] + offsetX;
        var headY = this.props.player.lastMoves[9][1] + offsetY;
        context.lineWidth = offsetZ;

        var lingrad2 = context.createLinearGradient(0, 0, (headX - context.lineWidth / 2), 0);
        lingrad2.addColorStop(1, 'rgba(36,42,48,' + alpha + ')');
        lingrad2.addColorStop(0, 'rgba(36,42,48,0)');
        context.strokeStyle = lingrad2;
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(tailX, tailY);
        context.bezierCurveTo(control1X, control1Y, control2X, control2Y, headX, headY);
        context.stroke();
    }
};