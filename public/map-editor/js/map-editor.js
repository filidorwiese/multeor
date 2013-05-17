$.fn.moveUp = function() {
    $.each(this, function() {
         $(this).after($(this).prev());
    });
};

$.fn.moveDown = function() {
    $.each(this, function() {
         $(this).before($(this).next());
    });
};

var tiles = [ { sprites: []  } ];
var sprites = [];
var spriteDefault = {
	top: 0,
	left: 0,
	layer: 1,
	destroyable: false,
	animate: false,
	score: 1,
	audio: 'none'
};
var currentTileIndex = 0;
var levelPath = $('body').data('level-path');

function setBackground(path) {
	if (typeof path == 'undefined') { $('#grid').css('background-image', 'none'); return false; }
	$('#grid').css('background-image', 'url(' + levelPath + path + ')');
	tiles[currentTileIndex].background = path;
	$('#backgrounds').val(path);
}

function updateSprite() {
	$('#spriteProps :input').blur();
	var sprite = $('.sprite--selected');
	if (sprite.size() < 1) { return false; }
	var id = sprite.data('id');

	tiles[currentTileIndex].sprites[id] = {
		path: tiles[currentTileIndex].sprites[id].path,
		top: parseInt(sprite.css('top'), 10),
		left: parseInt(sprite.css('left'), 10),
		layer: sprite.data('layer'),
		destroyable: sprite.data('destroyable'),
		animate: sprite.data('animate'),
		score: sprite.data('score'),
		audio: sprite.data('audio')
	};

	if (sprite.data('destroyable')) {
		sprite.width(sprite.data('orig-width') / 8);
		sprite.height(sprite.data('orig-height') / 2);
	} else if (sprite.data('animate')) {
		sprite.width(sprite.data('orig-width') / 8);
		sprite.height(sprite.data('orig-height'));
	} else {
		sprite.width(sprite.data('orig-width'));
		sprite.height(sprite.data('orig-height'));
	}

	sprite.css({ zIndex: sprite.data('layer') });

	// Update bij iedere sprite update ook de sprite defaults om versneld
	// overeenkomstige sprites te kunnen plaatsen
	spriteDefault.layer = sprite.data('layer');
	spriteDefault.destroyable = sprite.data('destroyable');
	spriteDefault.animate = sprite.data('animate');
	spriteDefault.score = sprite.data('score');
	spriteDefault.audio = sprite.data('audio');

	Log('Sprite updated');
}

function selectSprite(sprite) {
	updateSprite();
	deselectSprite();
	var sprite = $(sprite).addClass('sprite--selected');

	$('#spriteProps').addClass('selected');
	$('#spriteProps #layer').val(sprite.data('layer'));
	$('#spriteProps #destroyable').prop('checked', sprite.data('destroyable'));
	$('#spriteProps #animate').prop('checked', sprite.data('animate'));
	$('#spriteProps #score').val(sprite.data('score'));
	$('#spriteProps #audio').val(sprite.data('audio'));
	$('#spriteProps #image').html(sprite.css('background-image').replace(/\\/g, '/').replace( /.*\//, '' ).replace(')', ''));
}

function deselectSprite() {
	updateSprite();
	$('#spriteProps').removeClass('selected');
	$('.sprite--selected').removeClass('sprite--selected');
}

function getOutput() {
	var resultTiles = [];
	var tileCounter = 0;
	var spriteCounter = 0;

	for (tile in tiles) {
		if (typeof tiles[tile].background !== 'undefined') {
			var resultSprites = [];
			tileCounter++;

			for (sprite in tiles[tile].sprites) {
				spriteCounter++;

	            var id = 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	                return v.toString(16);
	            });

				resultSprites.push({
					id: id,
					path: tiles[tile].sprites[sprite].path,
					top: parseInt(tiles[tile].sprites[sprite].top, 10),
					left: parseInt(tiles[tile].sprites[sprite].left, 10),
					layer: tiles[tile].sprites[sprite].layer,
					destroyable: tiles[tile].sprites[sprite].destroyable,
					animate: tiles[tile].sprites[sprite].animate,
					score: tiles[tile].sprites[sprite].score,
					audio: tiles[tile].sprites[sprite].audio
				});
			}

			resultTiles.push({
				background: tiles[tile].background,
				sprites: resultSprites
			});
		}
	}

	Log('Export ready: ' + tileCounter + ' tiles, ' + spriteCounter + ' sprites');

	return JSON.stringify(resultTiles);
}

function removeSprite(sprite) {
	var id = sprite.data('id');
	delete tiles[currentTileIndex].sprites[id];
	sprite.remove();
	deselectSprite();
	Log('Sprite removed');
}

function addSprite(id, path, top, left, layer, destroyable, animate, score, audio) {
	if (typeof top == 'undefined') top = spriteDefault.top;
	if (typeof left == 'undefined') left = spriteDefault.left;
	if (typeof layer == 'undefined') layer = spriteDefault.layer;
	if (typeof destroyable == 'undefined') destroyable = spriteDefault.destroyable;
	if (typeof animate == 'undefined') animate = spriteDefault.animate;
	if (typeof score == 'undefined') score = spriteDefault.score;
	if (typeof audio == 'undefined') audio = spriteDefault.audio;

	var img = new Image();
	var sprite = $('<div style="position:absolute;top:' + top + ';left:' + left + ';"></div>')
		.data('id', id)
		.data('path', path)
		.data('layer', layer)
		.data('destroyable', destroyable)
		.data('animate', animate)
		.data('score', score)
		.data('audio', audio);

	img.onload = function() {
		sprite.data('orig-width', img.width).data('orig-height', img.height);
		sprite.width(img.width).height(img.height)
			.css('background-image', 'url(' + img.src + ')')
			.css('top', top)
			.css('left', left);

		if (sprite.data('destroyable')) {
			sprite.width(sprite.data('orig-width') / 8);
			sprite.height(sprite.data('orig-height') / 2);
		} else if (sprite.data('animate')) {
			sprite.width(sprite.data('orig-width') / 8);
			sprite.height(sprite.data('orig-height'));
		} else {
			sprite.width(sprite.data('orig-width'));
			sprite.height(sprite.data('orig-height'));
		}
	};

	img.src = levelPath + path;

	tiles[currentTileIndex].sprites[id] = {
		path: path,
		top: top,
		left: left,
		layer: layer,
		destroyable: destroyable,
		animate: animate,
		score: score,
		audio: audio
	};
	// containment: 'parent',
	sprite.draggable({ distance: 10, stop: updateSprite } ).appendTo($('#grid'));
	return sprite;
}

$('#backgrounds').on('change', function(event) {
	deselectSprite();
	setBackground($('#backgrounds').val());
});

$('#setBackground').on('click', function(event) {
	deselectSprite();
	setBackground($('#backgrounds').val());
});

$('#export').on('click', function(event) {
	deselectSprite();
	$('#output').val(getOutput());
});

$('#import').on('click', function(event) {
	var input = $('#output').val();
	if (typeof input === 'undefined' || input === '') {
		return false;
	}

	deselectSprite();
	tiles = [];

	var resultTiles = JSON.parse(input);

	for (tile in resultTiles) {
		var sprites = [];

		for(sprite in resultTiles[tile].sprites) {
			if (typeof resultTiles[tile].sprites[sprite].path == 'undefined') throw 'Undefined path in sprite';
			if (typeof resultTiles[tile].sprites[sprite].top == 'undefined') resultTiles[tile].sprites[sprite].top = spriteDefault.top;
			if (typeof resultTiles[tile].sprites[sprite].left == 'undefined') resultTiles[tile].sprites[sprite].left = spriteDefault.left;
			if (typeof resultTiles[tile].sprites[sprite].layer == 'undefined') resultTiles[tile].sprites[sprite].layer = spriteDefault.layer;
			if (typeof resultTiles[tile].sprites[sprite].destroyable == 'undefined') resultTiles[tile].sprites[sprite].destroyable = spriteDefault.destroyable;
			if (typeof resultTiles[tile].sprites[sprite].animate == 'undefined') resultTiles[tile].sprites[sprite].animate = spriteDefault.animate;
			if (typeof resultTiles[tile].sprites[sprite].score == 'undefined') resultTiles[tile].sprites[sprite].score = spriteDefault.score;
			if (typeof resultTiles[tile].sprites[sprite].audio == 'undefined') resultTiles[tile].sprites[sprite].audio = spriteDefault.audio;

			sprites[Math.random()] = {
				path: resultTiles[tile].sprites[sprite].path,
				top: resultTiles[tile].sprites[sprite].top,
				left: resultTiles[tile].sprites[sprite].left,
				layer: resultTiles[tile].sprites[sprite].layer,
				destroyable: resultTiles[tile].sprites[sprite].destroyable,
				animate: resultTiles[tile].sprites[sprite].animate,
				score: resultTiles[tile].sprites[sprite].score,
				audio: resultTiles[tile].sprites[sprite].audio
			};
		}

		tiles.push({
			background: resultTiles[tile].background,
			sprites: sprites
		});
	}

	currentTileIndex = 0;

	if(tiles.length == 0) {
		tiles.push( { sprites: []  } );
	}

	renderTile(tiles[currentTileIndex]);

    updateTileCounter();

	$('#output').val('');
	Log('Import complete');
});

function updateTileCounter() {
	var numberOfTiles = 0;
    for (var ii in tiles) { numberOfTiles++; }
    $('#tileIndexLabel').html(currentTileIndex+1 + ' / ' + numberOfTiles);
}

function renderTile(tile) {
	$('#grid').children().remove();
	setBackground(tile.background);

	var numberOfSprites = 0;
	for(sprite in tile.sprites) {
		numberOfSprites++;
		addSprite(
			sprite,
			tile.sprites[sprite].path,
			tile.sprites[sprite].top,
			tile.sprites[sprite].left,
			tile.sprites[sprite].layer,
			tile.sprites[sprite].destroyable,
			tile.sprites[sprite].animate,
			tile.sprites[sprite].score,
			tile.sprites[sprite].audio
		);
	}

	$('#log').html('Sprites: ' + numberOfSprites);
}


$('#firstTile').on('click', function(event) {
	deselectSprite();

	currentTileIndex=0;
	renderTile(tiles[currentTileIndex]);

    updateTileCounter();
});

$('#nextTile').on('click', function(event) {
	deselectSprite();
    currentTileIndex++;

    if(tiles.length == currentTileIndex) {
		tiles.push( { sprites: []  } );
    }

    renderTile(tiles[currentTileIndex]);

    updateTileCounter();
});

$('#prevTile').on('click', function(event) {
	deselectSprite();
	if (currentTileIndex > 0) {
		currentTileIndex--;
		renderTile(tiles[currentTileIndex]);
	}

    updateTileCounter();
});

$('#lastTile').on('click', function(event) {
	deselectSprite();

	currentTileIndex=tiles.length-1;
	renderTile(tiles[currentTileIndex]);

    updateTileCounter();
});

$('#addSprite').on('click', function(event){
	var id = Math.random();
	var path = $('#sprites').val();

	sprite = addSprite(id, path);
	selectSprite(sprite);
});

$('#start-over').on('click', function(event){
	if (confirm('Sure?')) {
		document.location = '/map-editor/';
	}
});

function setSprites() {
	tiles[currentTileIndex].sprites = [];

	$.each($('#grid').children(), function(key, object) {
		var sprite = $(object);

		tiles[currentTileIndex].sprites[sprite.data('id')] = {
			path: sprite.data('path'),
			top: sprite.position().top,
			left: sprite.position().left,
			layer: sprite.data('layer'),
			destroyable: sprite.data('destroyable'),
			animate: sprite.data('animate'),
			score: sprite.data('score'),
			audio: sprite.data('audio')
		};
	});
}

$('body').on('keydown', function (event) {
	if (event.which == 8) { // backspace, prevent going back on mac
		event.preventDefault();
	}

	var selectedSprite = $('.sprite--selected');
	if (selectedSprite) {
		if (event.which == 187) { // -
			event.preventDefault();
			selectedSprite.moveDown();
			setSprites();
		}
		else if (event.which == 189) { // +
			event.preventDefault();
			selectedSprite.moveUp();
			setSprites();
		}
		else if (event.which == 68 || event.which == 46) { // d or del
			event.preventDefault();
			removeSprite(selectedSprite);
		}
		else if (event.which == 38) { // Up
			event.preventDefault();
			if (event.shiftKey) {
				selectedSprite.css({ top: '-=20' });
			} else {
				selectedSprite.css({ top: '-=1' });
			}
			updateSprite();
		}
		else if (event.which == 40) { // Down
			event.preventDefault();
			if (event.shiftKey) {
				selectedSprite.css({ top: '+=20' });
			} else {
				selectedSprite.css({ top: '+=1' });
			}
			updateSprite();
		}
		else if (event.which == 37) { // Left
			event.preventDefault();
			if (event.shiftKey) {
				selectedSprite.css({ left: '-=20' });
			} else {
				selectedSprite.css({ left: '-=1' });
			}
			updateSprite();
		}
		else if (event.which == 39) { // Right
			event.preventDefault();
			if (event.shiftKey) {
				selectedSprite.css({ left: '+=20' });
			} else {
				selectedSprite.css({ left: '+=1' });
			}
			updateSprite();
		}
		else if (event.which == 219 || event.which == 33) { // [ or PgUp
			event.preventDefault();
			$('#prevTile').trigger('click');
		}
		else if (event.which == 221 || event.which == 34) { // ] or PgDown
			event.preventDefault();
			$('#nextTile').trigger('click');
		}
		else if (event.which == 220) { // \
			event.preventDefault();
			$('#addSprite').trigger('click');
		}
		else if (event.which == 27) { // Esc
			event.preventDefault();
			deselectSprite();
		}
	}

	Log('Key pressed: ' + event.which);
});

$(document).ready(function() {
	$('#grid').on('mouseup', function(event){
		if ($(event.target).attr('id') == 'grid') {
			deselectSprite();
		}
	});

	$('#spriteProps :input').on('change', function(){
		$('.sprite--selected').data('layer', $('#spriteProps #layer').val())
		.data('destroyable', ($('#spriteProps #destroyable').is(':checked') ? true : false))
		.data('animate', ($('#spriteProps #animate').is(':checked') ? true : false))
		.data('score', parseInt($('#spriteProps #score').val(), 10) || 0)
		.data('audio', $('#spriteProps #audio').val());
		updateSprite();
	});

	$('#grid').on('mousedown', 'div.ui-draggable', function(event){
		event.preventDefault();
		event.stopPropagation();
		selectSprite($(this));
	})
	setBackground($('#backgrounds').val());

	$('#import').trigger('click');
});


Log = function(logline) {
	$('#log').html(logline);
	/*setTimeout(function(){
		var numberOfSprites = 0;
    	for (sprite in tiles[currentTileIndex].sprites) { numberOfSprites++; }
		$('#log').html('Sprites: ' + numberOfSprites);
	}, 3000);*/
}
