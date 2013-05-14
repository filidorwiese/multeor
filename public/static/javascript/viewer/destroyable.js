var Destroyable = function(id, image, x, y, z, destroyable, destroyedColorIndex, animate, currentSpriteFrame){
    this.props = {
        id: id,
        image: image,
        x: x,
        y: y,
        z: z,
        frameWidth: (destroyable || animate ? image.width / 8 : image.width),
        frameHeight: (destroyable ? image.height / 2 : image.height),
        animate: animate,
        destroyable: destroyable,
        destroyedColorIndex: destroyedColorIndex,
        currentSpriteFrame: currentSpriteFrame
    };
}

Destroyable.prototype.draw = function(context, bgModulus) {
    // Don't draw when not in view
    if (this.props.x < (this.props.frameWidth * -1) || this.props.x > canvas.width) { return false; }

    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    if (this.props.destroyedColorIndex) {
        // When destroyed, show appropriate color
        context.drawImage(this.props.image, (this.props.frameWidth * (this.props.destroyedColorIndex - 1)), this.props.frameHeight, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    } else {
        // If not destroyed, draw sprite (with or without animation)
        if (this.props.animate) {
            context.drawImage(this.props.image, (this.props.frameWidth * (this.props.currentSpriteFrame - 1)), 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
        } else {
            context.drawImage(this.props.image, 0, 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
        }
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
    // No collision detection if sprite isn't a destroyable, is already destroyed or isn't in view
    if (!this.props.destroyable || this.props.destroyedColorIndex) { return false; }
    if (this.props.x < (this.props.frameWidth * -1) || this.props.x > canvas.width) { return false; }

    var weirdnessOffset = 100;
    var houseLeft = this.props.x;
    var houseRight = houseLeft + this.props.frameWidth;
    var houseTop = this.props.y;
    var houseBottom = houseTop + this.props.frameHeight;
    var houseZmin = this.props.z - 20;
    var houseZmax = this.props.z + 20;

    // Uncomment to debug collision detection
    //context.fillRect(houseLeft, houseTop, houseRight - houseLeft, houseBottom - houseTop);

    for(player in players) {
        var playerYPadding = players[player].props.z * .2;
        var playerXPadding = players[player].props.z * .2;
        var playerLeft = players[player].props.x + playerXPadding + weirdnessOffset;
        var playerRight = players[player].props.x - playerXPadding + weirdnessOffset;
        var playerTop = players[player].props.y + playerYPadding;
        var playerBottom = players[player].props.y - playerYPadding;
        var playerZ = players[player].props.z;

        // Uncomment to debug collision detection
        //context.fillRect(playerLeft, playerTop, playerRight - playerLeft, playerBottom - playerTop);

        if (playerZ >= houseZmin && playerZ <= houseZmax) {
            if (playerRight >= houseLeft && playerLeft <= houseRight) {
                if (playerTop >= houseTop && playerBottom <= houseBottom) {
                    return player;
                }
            }
        }
    }

    return false;
}