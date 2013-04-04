var Game = function(worldFile, code){
    var self = this;
    self.props = {
        started: false,
        message: false,
        defaultText: 'Go to http://vlammen.fili.nl on your mobile and enter code ' + code + ' to join',
        imagesLoaded: false,
        preloadImages: [],
        images: [],
        world: false,
        worldX: 0,
        worldSpeed: 10,
        destroyed: []
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
                    var spriteObject = world[i].sprites[j];
                    //console.log(world[i].sprites[j]);
                    if (typeof spriteObject.path != 'undefined') {
                        self.props.preloadImages.push(spriteObject.path);
                    }
                }
            }
        }
        console.log('Preloading: ' + self.props.preloadImages);
        self.message('Loading');
        
        for (var t=0; t<self.props.preloadImages.length; t++) {
            self.loadImage(self.props.preloadImages[t]);
        }
    }).fail(function(jqxhr, settings, exception){
        throw exception;
    });
}

Game.prototype.tick = function(time) {
    if (!this.props.imagesLoaded) { return false; }
    //console.log(this.props.destroyables);
    
    // Clear scherm
    context.clearRect(0,0, canvas.width, canvas.height);
    
    // Update worldX if game started
    if (this.props.started) {
        if (this.props.worldX < ((this.props.world.length * canvas.width) - canvas.width)) {
            this.props.worldX += this.props.worldSpeed;
        } else {
            this.endGame();
        }
    }

    // Teken achtergrond1 op basis van WorldX
    var bgModulus = this.props.worldX % 1000;
    var bgBase = Math.floor(this.props.worldX / 1000);

    //console.log(this.getImage(this.props.world[bgBase].background));
    var tile1 = this.props.world[bgBase];
    var background1 = this.getImage(tile1.background);
    context.drawImage(background1, bgModulus, 0, canvas.width - bgModulus, canvas.height, 0, 0, canvas.width - bgModulus, canvas.height);

    var tile2 = this.props.world[bgBase + 1];
    if (typeof tile2 != 'undefined') {
        var background2 = this.getImage(tile2.background);
        context.drawImage(background2, 0, 0, bgModulus, canvas.height, canvas.width - bgModulus, 0, bgModulus, canvas.height);
    }

    // Herorder entities op basis van diepte
    var entities = [];
    var entitiesOffset = 0;
    
    // Teken destroyables
    if (tile1.sprites.length) {
        for (sprite in tile1.sprites) {
            //if (tile1.sprites[sprite].left > bgModulus) {
                var spriteObject = tile1.sprites[sprite];
                var destroyed = (typeof this.props.destroyed[spriteObject.id] != 'undefined') ? true : false;
                entities[entitiesOffset + sprite] = new Destroyable(spriteObject.id, this.getImage(spriteObject.path), spriteObject.left, spriteObject.top, 1, destroyed);
                if (!destroyed && entities[entitiesOffset + sprite].collides(players, bgModulus)) {
                    this.props.destroyed[spriteObject.id] = spriteObject.id;
                }
            //}
        }
    }
    entitiesOffset += tile1.sprites.length + 1;
    
    if (typeof tile2 != 'undefined') {
        if (tile2.sprites.length) {
            for (sprite in tile2.sprites) {
                //if (tile2.sprites[sprite].left < canvas.width - bgModulus) {
                    var spriteObject = tile2.sprites[sprite];
                    var destroyed = (typeof this.props.destroyed[spriteObject.id] != 'undefined') ? true : false;
                    entities[entitiesOffset + sprite] = new Destroyable(spriteObject.id, this.getImage(spriteObject.path), spriteObject.left, spriteObject.top, 2, destroyed);
                    if (!destroyed && entities[entitiesOffset + sprite].collides(players, bgModulus)) {
                        this.props.destroyed.push(spriteObject.id);
                    }
                //}
            }
        }
        entitiesOffset += tile2.sprites.length + 1;
    }
    
    for(player in players) {
        var newKey = entitiesOffset + players[player].props.z;
        if (typeof entities[newKey] != 'undefined') { newKey++; }
        entities[newKey] = players[player];
    }
    
    // Teken entities op canvas
    for (key in entities) {
        entities[key].draw(context, bgModulus);
    }

    // Text plaatsen
    if (this.props.message.length) {
        context.save();
        context.font = '30px ablas_altbold';
        context.fillStyle = '#FFFFFF';

        var _maxWidth = canvas.width / 1.7;
        var _x = (canvas.width - _maxWidth) / 2;
        var _y = (canvas.height / 2.2);
        this.drawMessage(context, this.props.message, _x, _y, _maxWidth, 35);
        
        //var metrics = context.measureText(this.props.message);
        //var _x = (canvas.width / 2) - (metrics.width / 2);
        //var _y = (canvas.height / 2);
        //context.fillText(this.props.message, _x, _y);
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
            self.props.images[imageSrc] = {
                width: this.width,
                height: this.height,
                image: this
            }
            if (self.props.preloadImages >= self.props.images) {
                self.props.imagesLoaded = true;
                self.message(self.props.defaultText);
            }
        }
        image.onerror = function() {
            throw 'image ' + imageSrc + ' not found';
        }
    }
}

Game.prototype.getImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] != 'undefined') {
        return this.props.images[imageSrc].image;
    }
}

Game.prototype.resetGame = function() {
    this.props.worldX = 0;
    this.props.started = false;
    this.message(this.props.defaultText);
    this.props.destroyed = [];
}

Game.prototype.endGame = function(){
    if (!this.props.started) return false;
    var self = this;
    self.message('Game ended!');
    socket.emit('game-end');
    //clearInterval(getReadyInterval);
    
    setTimeout(function(){
        self.resetGame();
    }, 8000);
}

Game.prototype.startGame = function(){
    var self = this;
    var countDown = 10;
    var getReadyInterval = setInterval(function(){
        if (countDown < 1) {
            self.message('GO!');
            setTimeout(function(){
                self.message('');
                self.props.started = true;
            }, 1000);
            clearInterval(getReadyInterval);
        } else {
            self.message('Game starting in ' + countDown + ' seconds, get ready...');
            countDown--;
        }
    }, 1000);
}

Game.prototype.drawMessage = function(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if(testWidth > maxWidth) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        x = (canvas.width / 2) - (testWidth / 2);
        line = testLine;
      }
    }
    context.fillText(line, x, y);
}
