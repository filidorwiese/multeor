'use strict';

var Destroyable = function(sprite, image, x, y, z, destroyedColorIndex, currentSpriteFrame){
    this.props = {
        sprite: sprite,
        image: image,
        x: x,
        y: y,
        z: z,
        frameWidth: (sprite.destroyable || sprite.animate ? image.width / 8 : image.width),
        frameHeight: (sprite.destroyable ? image.height / 2 : image.height),
        destroyedColorIndex: destroyedColorIndex,
        currentSpriteFrame: currentSpriteFrame
    };
};

Destroyable.prototype.draw = function(context, bgModulus) {
    // Don't draw when not in view
    if (this.props.x < (this.props.frameWidth * -1) || this.props.x > context.canvas.width) { return false; }

    if (this.props.destroyedColorIndex) {
        // When destroyed, show appropriate color
        context.drawImage(this.props.image, (this.props.frameWidth * (this.props.destroyedColorIndex - 1)), this.props.frameHeight, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    } else {
        // If not destroyed, draw sprite (with or without animation)
        if (this.props.sprite.animate) {
            context.drawImage(this.props.image, (this.props.frameWidth * (this.props.currentSpriteFrame - 1)), 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
        } else {
            context.drawImage(this.props.image, 0, 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
        }
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
    // No collision detection if sprite isn't a destroyable, is already destroyed or isn't in view
    if (!this.props.sprite.destroyable || this.props.destroyedColorIndex) { return false; }
    if (this.props.x < (this.props.frameWidth * -1) || this.props.x > canvas.width) { return false; }

    var weirdnessOffset = 100;
    var entityLeft = Math.floor(this.props.x);
    var entityRight = Math.floor(this.props.x + this.props.frameWidth);
    var entityTop = Math.floor(this.props.y);
    var entityBottom = Math.floor(this.props.y + this.props.frameHeight);
    var entityZmin = Math.floor(this.props.z - 20);
    var entityZmax = Math.floor(this.props.z + 20);

    // Uncomment to debug collision detection
    //context.save();
    //context.fillStyle = 'rgba(255,0,0,1)';
    //context.fillRect(entityLeft, entityTop, entityRight - entityLeft, entityBottom - entityTop);

    for(var player in players) {
        var playerYPadding = Math.floor(players[player].props.z * 0.3);
        var playerXPadding = Math.floor(players[player].props.z * 0.3);
        var playerLeft = Math.floor(players[player].props.x + playerXPadding + weirdnessOffset);
        var playerRight = Math.floor(players[player].props.x - playerXPadding + weirdnessOffset);
        var playerTop = Math.floor(players[player].props.y + playerYPadding);
        var playerBottom = Math.floor(players[player].props.y - playerYPadding);
        var playerZ = Math.floor(players[player].props.z);

        // Uncomment to debug collision detection
        //context.fillRect(playerLeft, playerTop, playerRight - playerLeft, playerBottom - playerTop);

        if (playerZ >= entityZmin && playerZ <= entityZmax) {
            if (playerLeft >= entityLeft && playerRight <= entityRight) {
                if (playerTop >= entityTop && playerBottom <= entityBottom) {
                    return player;
                }
            }
        }
    }

    //context.restore();

    return false;
};