var Destroyable = function(id, image, x, y, z, destroyable, destroyedColorIndex, currentSpriteFrame){
    this.props = {
        id: id,
        image: image,
        x: x,
        y: y,
        z: z,
        frameWidth: (destroyable ? image.width / 8 : image.width),
        frameHeight: (destroyable ? image.height / 2 : image.height),
        destroyable: destroyable,
        destroyedColorIndex: destroyedColorIndex,
        currentSpriteFrame: currentSpriteFrame
    };
}

Destroyable.prototype.draw = function(context, bgModulus) {
    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    if (this.props.destroyedColorIndex) {
        // When destroyed, show appropriate color
        context.drawImage(this.props.image, (this.props.frameWidth * (this.props.destroyedColorIndex - 1)), this.props.frameHeight, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    } else {
        // If not destroyed, animate the sprite in a ping-pong fashion
        context.drawImage(this.props.image, (this.props.frameWidth * (this.props.currentSpriteFrame - 1)), 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
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
