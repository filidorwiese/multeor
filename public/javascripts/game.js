var Game = function(worldFile){
    var self = this;
    self.props = {
        started: false,
        message: false,
        imagesLoaded: true,
        preloadImages: [],
        images: [],
        world: false,
        worldX: 0
    };

    $.ajaxSetup({ cache: true });
    
    $.getJSON(worldFile, function(world){
        //console.log(world);
        self.props.world = world;
        for (var i=0; i < world.length; i++) {
            //console.log(world[i].background);
            if (typeof world[i].background != 'undefined') { self.props.preloadImages.push(world[i].background); }
            if (typeof world[i].background2 != 'undefined') { self.props.preloadImages.push(world[i].background2); }
            
            if (world[i].sprites.length) {
                for (var j=0; j< world[i].sprites.length; j++) {
                    //console.log(world[i].sprites[j]);
                    if (typeof world[i].sprites[j].path != 'undefined') {
                        self.props.preloadImages.push(world[i].sprites[j].path);
                    }
                }
            }
        }
        console.log('Preloading: ' + self.props.preloadImages);

        for (var t=0; t<self.props.preloadImages.length; t++) {
            //self.loadImage(self.props.preloadImages[t]);
        }
    }).fail(function(jqxhr, settings, exception){
        throw exception;
    });
}

Game.prototype.tick = function(time) {
    // Clear scherm
    context.clearRect(0,0, 1000, 600);

    // Teken achtergrond1 op basis van WorldX
    
    // Herorder entities op basis van diepte
    var entities = [];

    // Teken achtergrond2 op basis van WorldX
    //entites[10] = achtergrond2
    
    /*
    for (key in houses) {
        if (houses[key].props.loaded) {
            entities[houses[key].props.z] = houses[key];
        }
    }*/
    for(key in players) {
        var newKey = players[key].props.z;
        if (typeof entities[newKey] != 'undefined') { newKey++; }
        entities[newKey] = players[key];
    }

    // Collision detection
    // update player-score

    // Teken entities op canvas
    for (key in entities) {
        entities[key].draw(context);
    }

    // Text plaatsen
    if (this.props.message.length) {
        context.save();
        context.font = '30px ablas_altbold';
        context.fillStyle = '#FFFFFF';

        var metrics = context.measureText(this.props.message);
        var _x = (canvas.width / 2) - (metrics.width / 2);
        var _y = (canvas.height / 2);
        context.fillText(this.props.message, _x, _y);
        context.restore();
    }
    
    // fps canvas meten
    if (time - previousTimer > 1000) {
        previousTimer = time;
        $('#debug').html(fpsCounter);
        fpsCounter = 0;
    }
    fpsCounter++;
}

Game.prototype.message = function(message) {
    this.props.message = message;
}


Game.prototype.loadImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] == 'undefined') {
        var self = this;
        var image = new Image();
        image.src = imageSrc;
        image.onload = function() {
            self.prop.images[imageSrc] = {
                width: this.width,
                height: this.height,
                image: this
            }
            if (this.props.preloadImages >= this.props.images) {
                this.props.imagesLoaded = true;
            }
        }
        image.onerror = function() {
            throw 'image ' + imageSrc + ' not found';
        }
    }
}

Game.prototype.getImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] != 'undefined') {
        return this.props.images[imageSrc];
    }
}
