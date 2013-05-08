var Game = function(levelPath, code){
    var self = this;
    self.props = {
        state: 'LOADING', // LOADING, WAITING, GETREADY, STARTED, LEADERBOARD, ENDED, ABORTED
        message: false,
        defaultText: 'Go to http://game.multeor.com on your mobile and enter code ' + code + ' to join',
        preloadImages: [],
        audio: {},
        images: [],
        world: false,
        worldX: 0,
        worldSpeed: 10,
        destroyed: {},
        levelPath: levelPath,
        spriteAnimationDirection: 'forwards',
        spriteAnimationStep: .1,
        spriteAnimationFrame: 1
    };
    
    $.ajaxSetup({ cache: true });
    $.getJSON(self.props.levelPath + '/level.json', function(world){
        self.message('Loading');

        self.props.world = world;
        for (var i=0; i < world.length; i++) {
            if (typeof world[i].background != 'undefined') { self.props.preloadImages.push(world[i].background); }
            
            if (world[i].sprites.length) {
                for (var j=0; j< world[i].sprites.length; j++) {
                    var spriteObject = world[i].sprites[j];
                    if (typeof spriteObject.path != 'undefined') {
                        if ($.inArray(spriteObject.path, self.props.preloadImages) === -1) {
                            self.props.preloadImages.push(spriteObject.path);
                        }
                    }
                    if (typeof spriteObject.audio != 'undefined') {
                        if (typeof self.props.audio[spriteObject.audio] == 'undefined' && spriteObject.audio != 'none') {
                            self.props.audio[spriteObject.audio] = null;
                        }
                    }
                }
            }
        }

        // Preload images
        console.log('Preloading: ' + self.props.preloadImages);
        for (var t=0; t<self.props.preloadImages.length; t++) {
            self.loadImage(self.props.preloadImages[t]);
        }

        // Attach audio
        self.loadAudio();

    }).fail(function(jqxhr, settings, exception){
        throw exception;
    });
}

Game.prototype.loadAudio = function() {
    var self = this;
    
    // Load soundtrack
    var soundtrack = new Howl({
        urls: [self.props.levelPath + '/audio/level.mp3', self.props.levelPath + '/audio/level.ogg'],
        loop: true
    });
    $(window).off('game-audio-start').on('game-audio-start', function(e){
        var audio = { volume: 0 };
        soundtrack.volume(audio.volume);
        soundtrack.play();
        $(audio).animate({
            volume: 1
        }, {
            easing: 'linear',
            duration: 5000,
            step: function(now, tween){
                soundtrack.volume(now);
            }
        });
    });

    $(window).off('game-audio-stop').on('game-audio-stop', function(e){
        var audio = { volume: 1 };
        $(audio).animate({
            volume: 0
        }, {
            easing: 'linear',
            duration: 5000,
            step: function(now, tween){
                soundtrack.volume(now);
            },
            complete:function(){
                soundtrack.stop();
            }
        });
    });

    // Load and attach effects
    for (var i in self.props.audio) {
        self.props.audio[i] = new Howl({
            urls: [self.props.levelPath + '/audio/sprites/' + i + '.mp3', self.props.levelPath + '/audio/sprites/' + i + '.ogg']
        });
    }
}

Game.prototype.tick = function(time) {
    if (this.props.state == 'LOADING') { return false; }
    
    // Clear scherm
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update worldX
    if (this.props.state == 'STARTED' || this.props.state == 'LEADERBOARD') {
        if (this.props.worldX < ((this.props.world.length * 1000) - canvas.width)) {
            this.props.worldX += this.props.worldSpeed;
        } else {
            this.endGame();
        }
    }

    var numberOfTiles = Math.ceil(canvas.width / 1000);
    var bgBase = Math.floor(this.props.worldX / 1000);
    var bgModulus = this.props.worldX % 1000;
    
	// Draw background tiles
    this.renderBackgrounds(numberOfTiles, bgBase, bgModulus);

    // Draw entities, destroyables and players	
    this.renderEntities(numberOfTiles, bgBase, bgModulus);

    // Draw on screen text
    if (this.props.message.length) {
        this.renderText();
    }

    // If near the end of the world, take over control and render to leaderboard positions
    if (this.props.state == 'STARTED' && this.props.worldX > ((this.props.world.length * 1000) - 7000)) {
        this.props.state = 'LEADERBOARD';
        this.renderToLeaderboard();
    }

    // Draw Leaderbord
    if (this.props.state == 'ENDED' || this.props.state == 'LEADERBOARD') {
        this.renderLeaderboard();
    }    
}


Game.prototype.renderBackgrounds = function(numberOfTiles, bgBase, bgModulus) {
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
        
        // image, sx, sy, sw, sh, x, y, w, height
        if (typeof bgImage != 'undefined') {
           context.drawImage(bgImage, sx, 0, sw, canvas.height, x, 0, sw, canvas.height);
        }
    }
}

Game.prototype.renderEntities = function(numberOfTiles, bgBase, bgModulus) {
    // Entities bijhouden
    var entities = [];
    var entitiesOffset = 0;

    // Globally update destroyable spriteAnimationFram
    if (this.props.spriteAnimationDirection === 'forwards') {
        if (this.props.spriteAnimationFrame < 9 - this.props.spriteAnimationStep) {
            this.props.spriteAnimationFrame += this.props.spriteAnimationStep;
        } else {
            this.props.spriteAnimationDirection = 'backwards';
        }
    } else {
        if (this.props.spriteAnimationFrame > 1 + this.props.spriteAnimationStep) {
            this.props.spriteAnimationFrame -= this.props.spriteAnimationStep;
        } else {
            this.props.spriteAnimationDirection = 'forwards';
        }
    }
    var currentSpriteFrame = Math.floor(this.props.spriteAnimationFrame);


    // Destroyables tekenen en collisions detecten
    for (var ii = 0; ii <= numberOfTiles; ii++) {
        var tile = this.props.world[bgBase + ii];
        if (typeof tile == 'undefined') { continue; }
        
        for (sprite in tile.sprites) {
            var spriteObject = tile.sprites[sprite];
            var destroyedColorIndex = this.props.destroyed[spriteObject.id] || false;
            var x = (ii * 1000) - bgModulus + spriteObject.left;
            var y = spriteObject.top;
            var zIndex =  entitiesOffset + (spriteObject.layer * 1000);

            // Parallax fx
            spriteObject.left -= (spriteObject.layer - 1) * 2;

            // Draw entity
            entities[zIndex] = new Destroyable(spriteObject.id, this.getImage(spriteObject.path), x, y, spriteObject.destroyable, destroyedColorIndex, currentSpriteFrame);
            
            // Do collision detection
            if (spriteObject.destroyable && !destroyedColorIndex) {
                var playerCollidedId = entities[zIndex].collides(players, bgModulus);
                if (playerCollidedId !== false) {
                    // Remember destroyed state
                    var playerCollidedColor = players[playerCollidedId].props.color;
                    var playerCollidedColorIndex = $.inArray(playerCollidedColor, playerColors) + 1;
                    this.props.destroyed[spriteObject.id] = playerCollidedColorIndex;

                    // Update playerScore
                    if (spriteObject.score > 0) {
                       players[playerCollidedId].updateScore(spriteObject.score);

                        // Play audio effect
                        if (spriteObject.audio && spriteObject.audio != 'none') {
                            this.props.audio[spriteObject.audio].volume(.2).play();
                        }
                    }
                }
            }
            
            entitiesOffset++;
        }
    }

    // Players tekenen
    for (player in players) {
        var zIndex = (players[player].props.layer * 1000) + 900 + players[player].props.playerNumber;
        entities[zIndex] = players[player];
    }
    
    // Alle entities op canvas tekenen
    for (key in entities) {
        entities[key].draw(context, bgModulus);
    }
}

Game.prototype.renderText = function() {
    var maxWidth = canvas.width / 2;
    var x = (canvas.width - maxWidth) / 2;
    var y = (canvas.height / 2.2);
    this.drawMessage(context, this.props.message, x, y, maxWidth, 35, true);
}

Game.prototype.renderToLeaderboard = function() {
    // Prevent player input and determine leaderboard position
    var highestScore = 0;
    var leaderboardPositions = [];
    for (player in players) {
        players[player].lockPlayer();
        if (players[player].props.score > highestScore) { highestScore = players[player].props.score; }
        leaderboardPositions.push([players[player], players[player].props.score]);
    }
    leaderboardPositions.sort(function(a, b) {return b[1] - a[1] });
    logGAEvent('Ended', 'Highest score', highestScore);

    // Calculate player leaderboard position
    var numberOfPlayer = 0;
    var headerHeight = 70;
    var leaderboardWidth = canvas.width / 4;
    for (player in leaderboardPositions) {
        var thePlayer = leaderboardPositions[player][0];
        numberOfPlayer++;
        thePlayer.props.endX = Math.floor((thePlayer.props.score / highestScore) * ((canvas.width / 2) + leaderboardWidth));
        if (thePlayer.props.endX < (canvas.width / 2) - leaderboardWidth) {
            thePlayer.props.endX = (canvas.width / 2) - leaderboardWidth;
        }
        thePlayer.props.endY = Math.floor((numberOfPlayer * (thePlayer.props.minZ + 30)) + headerHeight);
    }
}

Game.prototype.renderLeaderboard = function() {
    // Draw leaderboard header
    var maxWidth = canvas.width / 2;
    var x = (canvas.width - maxWidth) / 2;
    var y = 70;
    this.drawMessage(context, 'SCORES', x, y, maxWidth, 35, true);

    // Draw score
    var fuzzyNumber = 10;
    for (player in players) {
        if (players[player].props.x < players[player].props.endX + fuzzyNumber && players[player].props.x > players[player].props.endX - fuzzyNumber) {
            if (players[player].props.y < players[player].props.endY + fuzzyNumber && players[player].props.y > players[player].props.endY - fuzzyNumber) {
                this.drawMessage(context, players[player].props.score, players[player].props.endX + 130, players[player].props.endY + 9, maxWidth, 35, false);
            }
        }
    }
}

Game.prototype.message = function(message) {
    this.props.message = message;
}

Game.prototype.loadImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] == 'undefined') {
        var self = this;
        var image = new Image();
        image.src = this.props.levelPath + imageSrc;
        image.onload = function() {
            self.props.images[imageSrc] = {
                width: this.width,
                height: this.height,
                image: this
            }
            if (self.props.preloadImages.length >= self.props.images.length) {
                self.props.state = 'WAITING';
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
    this.props.state = 'WAITING';
    this.message(this.props.defaultText);
    this.props.destroyed = [];
    players = {};

    socket.emit('game-reset', {viewerId: viewerId, gameRoom: gameRoom});
    clearInterval(getReadyInterval);
}

Game.prototype.abortGame = function() {
    var self = this;
    socket.emit('game-end', {viewerId: viewerId, gameRoom: gameRoom});
    
    self.props.state = 'ABORTED';
    $(window).trigger('game-audio-stop');
    self.message('Game aborted!');

    logGAEvent('Aborted');

    setTimeout(function(){
        self.resetGame();
    }, 2000);
}

Game.prototype.endGame = function(){
    var self = this;
    socket.emit('game-end', {viewerId: viewerId, gameRoom: gameRoom});

    self.props.state = 'ENDED';
    $(window).trigger('game-audio-stop');

    setTimeout(function(){
        self.resetGame();
    }, 10000);
}

Game.prototype.getReady = function(){
    var self = this;
    if (self.props.state != 'WAITING') { return false; }
    
    $(window).trigger('game-audio-start');

	self.props.state = 'GETREADY';
    socket.emit('game-get-ready', {viewerId: viewerId, gameRoom: gameRoom});
    var countDown = 10;
    var getReadyInterval = setInterval(function(){
        if (self.props.state != 'GETREADY') { clearInterval(getReadyInterval); return false; }
        if (countDown < 1) {
            self.message('GO!');
            clearInterval(getReadyInterval);
            setTimeout(function(){
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
    if (self.props.state != 'GETREADY') { return false; }

    self.props.state = 'STARTED';
    socket.emit('game-start', {viewerId: viewerId, gameRoom: gameRoom});

    var numberOfPlayers = 0;
    for (var ii in players) { numberOfPlayers++; }
    logGAEvent('Started', 'Players', numberOfPlayers);
}

Game.prototype.drawMessage = function(context, text, x, y, maxWidth, lineHeight, center) {
    context.save();
    context.font = '30px ablas_altbold';
    context.fillStyle = '#FFFFFF';

    var words = text.toString().split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        if (center) {
            x = (canvas.width / 2) - (testWidth / 2);
        }
        line = testLine;
      }
    }
    context.fillText(line, x, y);
    context.restore();
}
