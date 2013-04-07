var Destroyable = function(id, image, x, y, destroyed){
    this.props = {
        id: id,
        image: image,
        x: x,
        y: y,
        destroyed: destroyed
    };
}

Destroyable.prototype.draw = function(context, bgModulus) {
    if (this.props.destroyed) {
		context.drawImage(this.props.image, this.props.image.width/2, 0, this.props.image.width/2, this.props.image.height, this.props.x, this.props.y, this.props.image.width/2, this.props.image.height);
    } else {
		context.drawImage(this.props.image, 0, 0, this.props.image.width/2, this.props.image.height, this.props.x, this.props.y, this.props.image.width/2, this.props.image.height);
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
    if (this.props.destroyed) { return false; }
     
    var weirdnessOffset = 100;
    var playerYPadding = 10;
    var playerXPadding = 10;
    var houseLeft = this.props.x;
    var houseRight = houseLeft + (this.props.image.width/2);
    var houseTop = this.props.y;
    var houseBottom = houseTop + this.props.image.height;
    
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
