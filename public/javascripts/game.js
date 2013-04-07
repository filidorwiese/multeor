var Game = function(worldFile, code){
    var self = this;
    self.props = {
        started: false,
        getReady: false,
        message: false,
        defaultText: 'Go to http://game.multeor.com on your mobile and enter code ' + code + ' to join',
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
    
    // Clear scherm
    context.clearRect(0,0, canvas.width, canvas.height);
    
    // Update worldX if game started
    if (this.props.started) {
        if (this.props.worldX < ((this.props.world.length * 1000) - canvas.width)) {
            this.props.worldX += this.props.worldSpeed;
        } else {
            this.endGame();
        }
    }
	
	// Draw background tiles
	var numberOfTiles = Math.ceil(canvas.width / 1000);
    var bgBase = Math.floor(this.props.worldX / 1000);
    var bgModulus = this.props.worldX % 1000;
    
	for (var ii = 0; ii <= numberOfTiles; ii++) {
		var tile = this.props.world[bgBase + ii];
		if (typeof tile == 'undefined') { continue; }
		var bgImage = this.getImage(tile.background);
		
		var x = (ii * 1000) - bgModulus;
		var sx = 0;
		var sw = 1000;
		
		if (x < 0) {
			x = 0;
			sx = bgModulus;
			sw = 1000 - bgModulus;
		}
		if (x + 1000 > canvas.width) {
			sw = canvas.width - x;
		}
		
		// image, sx, sy, sw, sh, x, y, w, h
		context.drawImage(bgImage, sx, 0, sw, canvas.height, x, 0, sw, canvas.height);
	}
	
    // Entities bijhouden
    var entities = [];
    var entitiesOffset = 0;
    
    // Destroyables tekenen en collisions detecten
    for (var ii = 0; ii <= numberOfTiles; ii++) {
		var tile = this.props.world[bgBase + ii];
		if (typeof tile == 'undefined') { continue; }
		
		for (sprite in tile.sprites) {
            var spriteObject = tile.sprites[sprite];
			var destroyed = ($.inArray(spriteObject.id, this.props.destroyed) > -1 ? true : false);
			var x = (ii * 1000) - bgModulus + spriteObject.left;
			var y = spriteObject.top;
			
            entities[entitiesOffset] = new Destroyable(spriteObject.id, this.getImage(spriteObject.path), x, y, destroyed);
            
			if (!destroyed) {
				var playerCollidedId = entities[entitiesOffset].collides(players, bgModulus);
				if (playerCollidedId !== false) {
					players[playerCollidedId].updateScore(1);
					this.props.destroyed.push(spriteObject.id);
				}
			}
			
            entitiesOffset++;
		}
	}

	// Players tekenen
    for (player in players) {
        var newKey = entitiesOffset + players[player].props.z;
        if (typeof entities[newKey] != 'undefined') { newKey++; }
        entities[newKey] = players[player];
    }
    
    // Alle entities op canvas tekenen
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
    
    socket.emit('game-reset', {viewerId: viewerId, gameRoom: gameRoom});
    clearInterval(getReadyInterval);
}

Game.prototype.endGame = function(){
    if (!this.props.started) return false;
    var self = this;
    self.props.started = false;
    self.message('Game ended!');
    socket.emit('game-end', {viewerId: viewerId, gameRoom: gameRoom});
    players = {};
    
    setTimeout(function(){
        self.resetGame();
    }, 8000);
}

Game.prototype.getReady = function(){
    var self = this;
    if (self.props.getReady || self.props.started) { return false; }
    
	self.props.getReady = true;
    socket.emit('game-get-ready', {viewerId: viewerId, gameRoom: gameRoom});
    var countDown = 10;
    var getReadyInterval = setInterval(function(){
        if (countDown < 1) {
            self.message('GO!');
            clearInterval(getReadyInterval);
            setTimeout(function(){
				self.props.getReady = false;
                self.message('');
                self.startGame();
            }, 1000);
        } else {
            self.message('Game starting in ' + countDown + ' seconds, get ready...');
            countDown--;
        }
    }, 1000);
}

Game.prototype.startGame = function(){
    var self = this;

    self.props.started = true;
    socket.emit('game-start', {viewerId: viewerId, gameRoom: gameRoom});
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
