var Game = function(levelPath, code){
    var self = this;
    self.props = {
        state: 'LOADING', // LOADING, WAITING, GETREADY, STARTED, LEADERBOARD, ENDED, ABORTED
        message: false,
        defaultText: 'Go to http://game.multeor.com on your mobile and enter code ' + code + ' to join',
        levelPath: levelPath,
        preloadImages: [],
        images: {},
        audio: {},
        world: false,
        worldX: 0,
        worldSpeed: 10,
        destroyed: {},
        explosions: [],
        spriteAnimationFrame: 1
    };

    $.ajaxSetup({ cache: true });
    $.getJSON(self.props.levelPath + '/level.json', function(world){
        self.props.world = world;
        for (var i=0; i < world.length; i++) {
            if (typeof world[i].background !== 'undefined') {
                if ($.inArray(world[i].background, self.props.preloadImages) === -1) {
                    self.props.preloadImages.push(world[i].background);
                }
            }

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
        Upon.log('Preloading: ' + self.props.preloadImages);
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

Game.prototype.tick = function(context, delta) {
    if (this.props.state == 'LOADING') {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        if (this.props.message.length) { this.renderText(context); }
        return false;
    }

    /*
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.explosions.length < 2) {
        this.props.explosions = this.props.explosions.concat(Explosion(200, 200, 1000, 5, 1, '255,255,255'));
    }
    for (var i=0; i < this.props.explosions.length; i++) {
        var particle = this.props.explosions[i];

        if (particle.dead) {
            //this.props.explosions.splice(i, 1);
        }

        particle.draw(context);
    }
    return;*/

    // Update worldX
    if (this.props.state == 'STARTED' || this.props.state == 'LEADERBOARD') {
        if (this.props.worldX < ((this.props.world.length * 1000) - context.canvas.width)) {
            this.props.worldX += this.props.worldSpeed;
        } else {
            this.endGame();
        }
    }

    var numberOfTiles = Math.ceil(context.canvas.width / 1000);
    var bgBase = Math.floor(this.props.worldX / 1000);
    var bgModulus = Math.floor(this.props.worldX % 1000);
    //Upon.log(numberOfTiles + ', ' + bgBase + ', ' + bgModulus);

	// Draw background tiles
    this.renderBackgrounds(context, numberOfTiles, bgBase, bgModulus);

    // Draw entities, destroyables and players
    this.renderEntities(context, numberOfTiles, bgBase, bgModulus);

    // Draw on screen text
    if (this.props.message.length) {
        this.renderText(context);
    }

    // If near the end of the world, take over control and render to leaderboard positions
    if (this.props.state == 'STARTED' && this.props.worldX > ((this.props.world.length * 1000) - 7000)) {
        this.props.state = 'LEADERBOARD';
        this.prepareLeaderboard();
    }

    // Draw Leaderbord
    if (this.props.state == 'ENDED' || this.props.state == 'LEADERBOARD') {
        this.renderLeaderboard(context);
    }
}

Game.prototype.renderBackgrounds = function(context, numberOfTiles, bgBase, bgModulus) {
    for (var ii = 0; ii <= numberOfTiles; ii++) {
        var tile = this.props.world[bgBase + ii];
        if (typeof tile == 'undefined') { continue; }

        var x = (ii * 1000) - bgModulus;
        if (x > context.canvas.width) { continue; }

        var sx = 0;
        var sw = 1000;

        if (x + 1000 > context.canvas.width) {
            sw = context.canvas.width - x;
        }
        if (x < 0) {
            x = 0;
            sx = bgModulus;
            sw = 1000 - bgModulus;
        }

        // image, sx, sy, sw, sh, x, y, w, height
        var bgImage = this.getImage(tile.background);
        if (bgImage) {
            //Upon.log(tile.background + ', '+ sx + ', 0, ' + sw + ', ' + canvas.height + ', ' + x + ', 0, ' + sw + ', ' + canvas.height);
            //context.drawImage(bgImage, sx, 0, sw, canvas.height, x + (ii * 5), 0, sw, canvas.height);
            context.drawImage(bgImage, sx, 0, sw, context.canvas.height, x, 0, sw, context.canvas.height);
        }
    }
}

Game.prototype.renderEntities = function(context, numberOfTiles, bgBase, bgModulus) {
    // Entities bijhouden
    var entities = [];
    var entitiesOffset = 0;

    // Globally update destroyable spriteAnimationFrame
    var spriteAnimationStep = .1;
    if (this.props.spriteAnimationFrame < 9 - spriteAnimationStep) {
        this.props.spriteAnimationFrame += spriteAnimationStep;
    } else {
        this.props.spriteAnimationFrame = 1;
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
            var z = spriteObject.layer * 50;
            var zIndex = entitiesOffset + (spriteObject.layer * 1000);

            // Parallax fx
            spriteObject.left -= (spriteObject.layer - 1) * 1.5;

            // Draw entity
            entities[zIndex] = new Destroyable(spriteObject, this.getImage(spriteObject.path), x, y, z, destroyedColorIndex, currentSpriteFrame);

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

                    // Create explosion
                    var zIndex = entitiesOffset + (spriteObject.layer * 1000) + 200;
                    var scale = 4 * parseInt(spriteObject.layer, 10);
                    var yOffset = y - (players[playerCollidedId].props.z / 2) * -1;
                    var newParticles = Explosion(x - 50, yOffset, zIndex, scale, playerCollidedColor);
                    this.props.explosions = this.props.explosions.concat(newParticles);
                }
            }

            entitiesOffset++;
        }
    }

    // Players tekenen
    for (player in players) {
        var zIndex = (players[player].props.vector[2] * 1000) + 900 + players[player].props.playerNumber;
        entities[zIndex] = players[player];
    }

    // Explosies tekenen
    if (this.props.explosions.length) {
        for (i in this.props.explosions) {
            var particle = this.props.explosions[i];
            if (!particle.dead) {
                entities[particle.zIndex] = particle;
            }
        }
    }

    // Alle entities op canvas tekenen
    for (key in entities) {
        entities[key].draw(context, bgModulus);
    }
}

Game.prototype.renderText = function(context) {
    var maxWidth = context.canvas.width / 2;
    var x = (context.canvas.width - maxWidth) / 2;
    var y = (context.canvas.height / 2.2);
    this.drawMessage(context, this.props.message, x, y, maxWidth, 35, true);
}

Game.prototype.prepareLeaderboard = function() {
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

Game.prototype.renderLeaderboard = function(context) {
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

            var imagesLoaded = 0;
            for (var ii in self.props.images) { imagesLoaded++; }
            var progress = Math.floor((100 / self.props.preloadImages.length) * imagesLoaded);
            if (progress >= 100) {
                self.props.state = 'WAITING';
                self.message(self.props.defaultText);
            } else {
                self.message(progress + '%');
            }
        }
        image.onerror = function() {
            throw 'image ' + imageSrc + ' not found';
        }
    }
}

Game.prototype.getImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] !== 'undefined') {
        return this.props.images[imageSrc].image;
    }
    return false;
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

    //$(window).trigger('game-audio-start');

	self.props.state = 'GETREADY';
    socket.emit('game-get-ready', {viewerId: viewerId, gameRoom: gameRoom});
    var countDown = 4;
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
            x = (context.canvas.width / 2) - (testWidth / 2);
        }
        line = testLine;
      }
    }
    context.fillText(line, x, y);
    context.restore();
}