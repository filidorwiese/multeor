var Destroyable = function(id, image, x, y, destroyable, destroyedByColorIndex){
    this.props = {
        id: id,
        image: image,
        x: x,
        y: y,
        frameWidth: (destroyable ? image.width / 9 : image.width),
        frameHeight: image.height,
        destroyable: destroyable,
        destroyedByColorIndex: destroyedByColorIndex
    };
}

Destroyable.prototype.draw = function(context, bgModulus) {
    if (this.props.destroyedByColorIndex) {
        context.drawImage(this.props.image, (this.props.frameWidth * this.props.destroyedByColorIndex), 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    } else {
		context.drawImage(this.props.image, 0, 0, this.props.frameWidth, this.props.frameHeight, this.props.x, this.props.y, this.props.frameWidth, this.props.frameHeight);
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
    var weirdnessOffset = 100;
    var playerYPadding = 10;
    var playerXPadding = 10;
    var houseLeft = this.props.x;
    var houseRight = houseLeft + this.props.frameWidth;
    var houseTop = this.props.y;
    var houseBottom = houseTop + this.props.frameHeight;
    
    for(player in players) {
        var playerRight = players[player].props.x - playerXPadding;
        var playerLeft = players[player].props.x + playerXPadding;
        var playerTop = players[player].props.y + playerYPadding;
        var playerBottom = players[player].props.y - playerYPadding;
        
        if (playerRight + weirdnessOffset >= houseLeft && playerLeft <= houseRight) {
            if (playerTop >= houseTop && playerBottom <= houseBottom) {
                return player;
            }
        }
    }
    
    return false;
}
