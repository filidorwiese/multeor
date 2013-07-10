'use strict';

var Game = function(levelPath, code) {
    var self = this;
    self.props = {
        state: 'LOADING', // LOADING, WAITING, GETREADY, STARTED, LEADERBOARD, ENDED, ABORTED
        message: false,
        levelPath: levelPath,
        preloadImages: [],
        images: {},
        audio: {},
        world: false,
        worldX: 55000,
        worldSpeed: 10,
        destroyed: {},
        explosions: [],
        spriteAnimationFrame: 1
    };

    $.ajaxSetup({ cache: true });
    $.getJSON(self.props.levelPath + '/level.json', function(world){
        self.props.world = world;
        for (var ii=0; ii < world.length; ii++) {
            if (typeof world[ii].background !== 'undefined') {
                if ($.inArray(world[ii].background, self.props.preloadImages) === -1) {
                    self.props.preloadImages.push(world[ii].background);
                }
            }

            if (world[ii].sprites.length) {
                for (var jj=0; jj< world[ii].sprites.length; jj++) {
                    var spriteObject = world[ii].sprites[jj];
                    world[ii].sprites[jj].origLeft = spriteObject.left; // needed for parallax reset
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
        for (var tt=0; tt < self.props.preloadImages.length; tt++) {
            self.loadImage(self.props.preloadImages[tt]);
        }

        // Attach audio
        self.loadAudio();

    }).fail(function(jqxhr, settings, exception){
        throw exception;
    });
};

Game.prototype.loadAudio = function() {
    var self = this;

    // Load soundtrack
    var soundtrack = new Howl({
        urls: [self.props.levelPath + '/audio/level.mp3', self.props.levelPath + '/audio/level.ogg'],
        loop: true
    });
    $(window).off('game-audio-start').on('game-audio-start', function(e){
        soundtrack.volume(0.5);
        soundtrack.play();
    });

    $(window).off('game-audio-stop').on('game-audio-stop', function(e){
        var audio = { volume: 0.5 };
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
    for (var key in self.props.audio) {
        self.props.audio[key] = new Howl({
            urls: [self.props.levelPath + '/audio/sprites/' + key + '.mp3', self.props.levelPath + '/audio/sprites/' + key + '.ogg']
        });
    }

    // Enable audio-toggle
    $('.audio-toggle').off('click').on('click', function(event){
        event.preventDefault();
        $(this).toggleClass('is-muted');

        if ($(this).hasClass('is-muted')) {
           Howler.mute();
           sessionStorage.setItem('audio-muted', true);
        } else {
           Howler.unmute();
           sessionStorage.removeItem('audio-muted');
        }
    });
    if (sessionStorage.getItem('audio-muted')) {
        $('.audio-toggle').trigger('click');
    }
};

Game.prototype.tick = function(context, delta) {
    if (this.props.state == 'LOADING') {
        return false;
    }

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

	// Draw background tiles
    this.renderBackgrounds(context, numberOfTiles, bgBase, bgModulus);

    // Draw entities, destroyables and players
    this.renderEntities(context, numberOfTiles, bgBase, bgModulus);

    // If near the end of the world, take over control and render to leaderboard positions
    if (this.props.state == 'STARTED' && this.props.worldX > ((this.props.world.length * 1000) - 8000)) {
        this.props.state = 'LEADERBOARD';
        this.prepareLeaderboard();
    }

    // Draw Leaderbord
    if (this.props.state == 'ENDED' || this.props.state == 'LEADERBOARD') {
        this.renderLeaderboard(context);
    }
};

Game.prototype.renderBackgrounds = function(context, numberOfTiles, bgBase, bgModulus) {
    for (var ii = 0; ii <= numberOfTiles; ii++) {
        var tile = this.props.world[bgBase + ii];
        if (typeof tile == 'undefined') { continue; }

        var x = (ii * 1000) - bgModulus;
        if (x > context.canvas.width) { continue; }

        var sx = 0;
        var sw = 1000;

        if (x < 0) {
            x = 0;
            sx = bgModulus;
            sw = 1000 - bgModulus;
        }

        // image, sx, sy, sw, sh,  x,    y, w, height
        var bgImage = this.getImage(tile.background);
        if (bgImage) {
            context.drawImage(bgImage, sx, 0, sw, context.canvas.height, x, 0, sw, context.canvas.height);
        }
    }
};

Game.prototype.renderEntities = function(context, numberOfTiles, bgBase, bgModulus) {
    // Maintain entities array
    var entities = {};
    var entitiesKeys = [];
    var entitiesOffset = 0;

    // Globally update destroyable spriteAnimationFrame
    var spriteAnimationStep = 0.1;
    if (this.props.spriteAnimationFrame < 9 - spriteAnimationStep) {
        this.props.spriteAnimationFrame += spriteAnimationStep;
    } else {
        this.props.spriteAnimationFrame = 1;
    }
    var currentSpriteFrame = Math.floor(this.props.spriteAnimationFrame);

    // Render destroyables
    // Note: it needs to look at some tiles backwards/ahead in case of bigger sprites that don't fit in one screen
    for (var ii = -3; ii <= numberOfTiles + 1; ii++) {
        var tile = this.props.world[bgBase + ii];
        if (typeof tile == 'undefined') { continue; }

        for (var sprite in tile.sprites) {
            entitiesOffset++;
            var spriteObject = tile.sprites[sprite];
            var destroyedColorIndex = this.props.destroyed[spriteObject.id] || false;
            var x = (ii * 1000) - bgModulus + spriteObject.left;
            var y = spriteObject.top;
            var z = spriteObject.layer * 50;
            var spriteZindex = entitiesOffset + (spriteObject.layer * 1000);
            var spriteImage = this.getImage(spriteObject.path);

            // Only render/draw/collide sprites that are actually within view
            if (x < (spriteImage.width * -1) || x > canvas.width) { continue; }

            // Parallax fx
            if (this.props.state == 'STARTED') {
                spriteObject.left -= (spriteObject.layer - 1) * 1.25;
            }

            // Draw entity
            entities[spriteZindex] = new Destroyable(spriteObject, spriteImage, x, y, z, destroyedColorIndex, currentSpriteFrame);
            entitiesKeys.push(spriteZindex);

            // Do collision detection
            if (spriteObject.destroyable && !destroyedColorIndex) {
                var playerCollidedId = entities[spriteZindex].collides(players);

                if (playerCollidedId > 0) {
                    // Remember destroyed state
                    var playerCollidedColor = players[playerCollidedId].props.color;
                    var playerCollidedColorIndex = $.inArray(playerCollidedColor, playerColors) + 1;
                    this.props.destroyed[spriteObject.id] = playerCollidedColorIndex;

                    // If entity has a destroylink, then also destroy linked entity
                    if (spriteObject.destroylink) {
                        this.props.destroyed[spriteObject.destroylink] = playerCollidedColorIndex;                        
                    }

                    // Update playerScore
                    if (spriteObject.score > 0) {
                        players[playerCollidedId].updateScore(spriteObject.score);

                        // Create explosion
                        var explosionZindex = entitiesOffset + (spriteObject.layer * 1000) + 200;
                        var scale = 5 * parseInt(spriteObject.layer, 10);
                        var yOffset = y - (players[playerCollidedId].props.z / 2) * -1;
                        var newParticles = Explosion(x - 50, yOffset, explosionZindex, scale, playerCollidedColor);
                        this.props.explosions = this.props.explosions.concat(newParticles);
                    }

                    // Play audio effect
                    if (spriteObject.audio && spriteObject.audio != 'none') {
                        this.props.audio[spriteObject.audio].volume(1).play();
                    }
                }
            }
        }
    }

    // Render Players
    var playerZindex, shadowZindex;
    for (var player in players) {
        playerZindex = (players[player].props.vector[2] * 1000) + 900 + players[player].props.playerNumber;
        entities[playerZindex] = players[player];
        entitiesKeys.push(playerZindex);

        // Render Players shadows
        shadowZindex = players[player].props.playerNumber + 1500;
        entities[shadowZindex] = new PlayerShadow(players[player]);
        entitiesKeys.push(shadowZindex);
    }

    // Render explosions
    if (this.props.explosions.length) {
        for (var key in this.props.explosions) {
            var particle = this.props.explosions[key];
            if (!particle.dead) {
                entities[particle.zIndex] = particle;
                entitiesKeys.push(particle.zIndex);
            }
        }
    }
    
    // Sort entities by key
    entitiesKeys.sort();
    
    // Render all entities on canvas
    for (var ii = 0; ii < entitiesKeys.length; ii++) {
        entities[entitiesKeys[ii]].draw(context);
    }
};

Game.prototype.renderText = function(context) {
    var maxWidth = context.canvas.width / 2;
    var x = (context.canvas.width - maxWidth) / 2;
    var y = (context.canvas.height / 2.2);
    this.drawMessage(context, this.props.message, x, y, maxWidth, 35, true);
};

Game.prototype.prepareLeaderboard = function() {
    // Prevent player input and determine leaderboard position
    var highestScore = 0;
    var lowestScore = 10000;
    var leaderboardPositions = [];
    for (var player in players) {
        players[player].lockPlayer();
        if (players[player].props.score > highestScore) { highestScore = players[player].props.score; }
        if (players[player].props.score < lowestScore) { lowestScore = players[player].props.score; }
        leaderboardPositions.push([players[player], players[player].props.score]);
    }
    leaderboardPositions.sort(function(a, b) {return b[1] - a[1] });
    logGAEvent('Ended', 'Highest score', highestScore);

    // Calculate player leaderboard position
    var numberOfPlayers = 0;
    for (var ii in players) { numberOfPlayers++; }

    var headerHeight = ((600 - (numberOfPlayers * 60)) / 2);
    var leaderboardWidth = 800;
    var leaderboardLeft = (canvas.width / 2) - (leaderboardWidth / 2);
    var numberOfPlayer = 0;
    for (var player in leaderboardPositions) {
        numberOfPlayer++;
        var thePlayer = leaderboardPositions[player][0];
        var thePlayerPercent = ((thePlayer.props.score - lowestScore) / highestScore);
        thePlayer.props.endX = Math.floor((thePlayerPercent * leaderboardWidth) + leaderboardLeft);
        thePlayer.props.endY = Math.floor((numberOfPlayer * thePlayer.props.endZ) - (thePlayer.props.endZ / 2) + headerHeight);
    }
};

Game.prototype.renderLeaderboard = function(context) {
    var maxWidth = canvas.width / 2;
    var fuzzyNumber = 10;
    for (var player in players) {
        if (players[player].props.x < players[player].props.endX + fuzzyNumber && players[player].props.x > players[player].props.endX - fuzzyNumber) {
            if (players[player].props.y < players[player].props.endY + fuzzyNumber && players[player].props.y > players[player].props.endY - fuzzyNumber) {
                this.drawMessage(context, players[player].props.score, players[player].props.endX + 140, players[player].props.endY + 9, maxWidth, 35, false);
            }
        }
    }

    // Emit game-end
    var leaderboardImage = false;
    socket.emit('game-end', {viewerId: viewerId, gameRoom: gameRoom, leaderboard: leaderboardImage});
};

Game.prototype.message = function(message) {
    this.props.message = message;
};

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
            }
        }
        image.onerror = function() {
            throw 'image ' + imageSrc + ' not found';
        }
    }
};

Game.prototype.getImage = function(imageSrc) {
    if (typeof this.props.images[imageSrc] !== 'undefined') {
        return this.props.images[imageSrc].image;
    }
    return false;
};

Game.prototype.resetGame = function() {
    socket.emit('game-reset', {viewerId: viewerId, gameRoom: gameRoom});
    document.location.reload();
    return;
};

Game.prototype.abortGame = function() {
    var self = this;
    socket.emit('game-end', {viewerId: viewerId, gameRoom: gameRoom});

    self.props.state = 'ABORTED';
    $(window).trigger('game-audio-stop');

    logGAEvent('Aborted');

    setTimeout(function(){
        self.resetGame();
    }, 2000);
};

Game.prototype.endGame = function(){
    var self = this;

    self.props.state = 'ENDED';
    $(window).trigger('game-audio-stop');

    setTimeout(function(){
        // Save Leaderboard image-data
        var image = context.getImageData(((canvas.width - 1000) / 2), 0, 1000, 600);
        var buffer = document.createElement('canvas');
        var bufferCtx = buffer.getContext('2d');
        buffer.width = 1000;
        buffer.height = 600;
        bufferCtx.putImageData(image, 0, 0);
        bufferCtx.font = '80px NevisRegular';
        bufferCtx.fillStyle = '#FFFFFF';
        bufferCtx.fillText('Multeor', 650, 550);
        var leaderboardImage = buffer.toDataURL();
        socket.emit('store-leaderboard', {viewerId: viewerId, gameRoom: gameRoom, leaderboard: leaderboardImage});
        
        $('.leaderboard-container').fadeIn(1000);
    }, 1000);
};

Game.prototype.getReady = function(){
    var self = this;
    if (self.props.state != 'WAITING') { return false; }

    $(window).trigger('game-audio-start');

    self.props.state = 'GETREADY';
    socket.emit('game-get-ready', {viewerId: viewerId, gameRoom: gameRoom});
    setTimeout(function(){
        self.startGame();
    }, 4000);
};

Game.prototype.startGame = function(){
    var self = this;
    if (self.props.state != 'GETREADY') { return false; }

    self.props.state = 'STARTED';
    socket.emit('game-start', {viewerId: viewerId, gameRoom: gameRoom});

    var numberOfPlayers = 0;
    for (var ii in players) { numberOfPlayers++; }
    logGAEvent('Started', 'Players', numberOfPlayers);

    // Fade in canvas
    var from = {i:.5};
    var to = {i:1};
    $(from).animate(to, {duration: 2000, step: function(step){
        context.globalAlpha = step;
    }});
};

Game.prototype.drawMessage = function(context, text, x, y, maxWidth, lineHeight, center) {
    context.save();
    context.font = '30px NevisRegular';
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
};
