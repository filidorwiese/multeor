var Destroyable = function(id, image, x, y, tile, destroyed){
    this.props = {
        id: id,
        image: image,
        x: x,
        y: y,
        tile: tile,
        destroyed: destroyed
    };
}

Destroyable.prototype.draw = function(context, bgModulus) {
    if (this.props.destroyed) {
        if (this.props.tile == 1) {
            context.drawImage(this.props.image, this.props.image.width/2, 0, this.props.image.width/2, this.props.image.height, this.props.x - bgModulus, this.props.y, this.props.image.width/2, this.props.image.height);
        } else {
            context.drawImage(this.props.image, this.props.image.width/2, 0, this.props.image.width/2, this.props.image.height, (canvas.width - bgModulus) + this.props.x, this.props.y, this.props.image.width/2, this.props.image.height);
        }
    } else {
        if (this.props.tile == 1) {
            context.drawImage(this.props.image, 0, 0, this.props.image.width/2, this.props.image.height, this.props.x - bgModulus, this.props.y, this.props.image.width/2, this.props.image.height);
        } else {
            context.drawImage(this.props.image, 0, 0, this.props.image.width/2, this.props.image.height, (canvas.width - bgModulus) + this.props.x, this.props.y, this.props.image.width/2, this.props.image.height);
        }
    }
};

Destroyable.prototype.collides = function(players, bgModulus) {
    for(player in players) {
        //FIXME: + players[player].props.z ?
        //if (players[player].props.z < 120) {
            if (this.props.tile == 1) {
                if ((players[player].props.x > this.props.x - bgModulus -this.props.image.width) && (players[player].props.x < this.props.x - bgModulus + (this.props.image.width/2))) { // 
                    if ((players[player].props.y < this.props.y+this.props.image.height) && (players[player].props.y > this.props.y)) {
                        socket.emit('update-score', { player: player, points: 1});
                        return true;
                    }
                }
            } else {
                if ((players[player].props.x > this.props.x + (bgModulus - 1000 - this.props.image.width)) && (players[player].props.x < (this.props.x + 1000 - bgModulus) + (this.props.image.width/2))) { // 
                    if ((players[player].props.y < this.props.y+this.props.image.height) && (players[player].props.y > this.props.y)) {
                        socket.emit('update-score', { player: player, points: 1});
                        return true;
                    }
                }
            }
        //}
    }
    
    return false;
}
