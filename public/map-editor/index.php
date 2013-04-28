<?php

	$levelPath = '../levels/forest';

?>

<!doctype html>
<html lang="us">
<head>
	<meta charset="utf-8">
	<title></title>
	<style>
	h3 {
		margin-bottom:5px;
	}
	
	#grid {
		height:600px;
		position:relative;
		width:1000px;
		background-color:#DDD;
		background-repeat:no-repeat;
		float:left;
	}
	
	#output {
		height:410px;
		width:200px;
	}

	#settings {
		float:left;
		margin-left:10px;
	}

	#spriteProps {
		border:1px solid #000;
		padding:10px;
		margin-bottom:20px;
	}
	
	#spriteProps div {
		visibility: hidden;
	}
	#spriteProps.selected div {
		visibility: visible;
	}

	#spriteProps label {
		display: inline-block;
		width:80px;
	}
	
	#spriteProps input#score {
		width:20px;
	}

	.sprite--selected {
		background-color:orange;
		opacity:.5;
	}
	</style>
</head>
<body>
<div>
	<label for="backgrounds">Backgrounds:</label>
	<select id="backgrounds">
		<?php 
			foreach (glob($levelPath . "/images/maps/*.png") as $file) {
				echo '<option>' . str_replace($levelPath, '', $file) . '</option>';
			}
		?>
	</select>
	<input id="setBackground" type="button" value="set" />
	|
	<label for="sprites">Sprites:</label>
	<select id="sprites">
		<?php 
			foreach (glob($levelPath . "/images/sprites/*.png") as $file) {
				echo '<option>' . str_replace($levelPath, '', $file) . '</option>';
			}
		?>
	</select>
	<input id="addSprite" type="button" value="add" />
	|
	<input id="prevTile" type="button" value="prev tile" />
    <span id="tileIndexLabel">1</span>
	<input id="nextTile" type="button" value="next tile" />
	|
	<input id="export" type="button" value="export" />
	<input id="import" type="button" value="import" />
<div>
	<div id="grid"></div>
	<div id="settings">
		<h3>Sprite properties:</h3>
		<div id="spriteProps">
			<div class="prop">
				<label for="layer">Layer</label>
				<select id="layer">
					<option>1</option>
					<option>2</option>
					<option>3</option>
				</select>
			</div>
			<div class="prop">
				<label>Destroyable</label>
				<input id="destroyable" type="checkbox" />
			</div>
			<div class="prop">
				<label for="score">Score:</label>
				<input id="score" type="text" value="0" />
			</div>
		</div>
		<h3>JSON</h3>
		<div>
			<textarea id="output"></textarea>
		</div>
	</div>
	
</div>
<script src="js/jquery-1.9.1.js"></script>
<script src="js/jquery-ui-1.10.1.custom.js"></script>
<script>

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
	destroyable: true,
	score: 1
};
var currentTileIndex = 0;
var levelPath = '/levels/forest';

function setBackground(path) {
	if (typeof path == 'undefined') { $('#grid').css('background-image', 'none'); return false; }
	$('#grid').css('background-image', 'url(' + levelPath + path + ')');
	tiles[currentTileIndex].background = path;
	$('#backgrounds').val(path);
}

function updateSprite() {
	var sprite = $('.sprite--selected');
	if (sprite.size() < 1) { return false; }
	var id = sprite.data('id');

	tiles[currentTileIndex].sprites[id] = {
		path: tiles[currentTileIndex].sprites[id].path,
		top: sprite.css('top'),
		left: sprite.css('left'),
		layer: sprite.data('layer'),
		destroyable: sprite.data('destroyable'),
		score: sprite.data('score')
	};
}

function selectSprite(sprite) {
	deselectSprite();
	$(sprite).addClass('sprite--selected');

	$('#spriteProps').addClass('selected');
	$('#spriteProps #layer').val($('.sprite--selected').data('layer'));
	$('#spriteProps #destroyable').prop('checked', $('.sprite--selected').data('destroyable'));
	$('#spriteProps #score').val($('.sprite--selected').data('score'));
}

function deselectSprite() {
	$('#spriteProps').removeClass('selected');
	$('.sprite--selected').removeClass('sprite--selected');
}

function getOutput() {
	var resultTiles = [];
	
	for (tile in tiles) {
		var resultSprites = [];
		
		for (sprite in tiles[tile].sprites) {
            
            var id = 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
            
			resultSprites.push({
				id: id,
				path: tiles[tile].sprites[sprite].path,
				top: tiles[tile].sprites[sprite].top,
				left: tiles[tile].sprites[sprite].left,
				layer: tiles[tile].sprites[sprite].layer,
				destroyable: tiles[tile].sprites[sprite].destroyable,
				score: tiles[tile].sprites[sprite].score
			});
		}
		
		resultTiles.push({
			background: tiles[tile].background,
			sprites: resultSprites
		});
	}
	
	return JSON.stringify(resultTiles);
}

function removeSprite(sprite) {
	delete tiles[currentTileIndex].sprites[sprite.id];
	sprite.remove();
	deselectSprite();
}
	
function addSprite(id, path, top, left, layer, destroyable, score) {
	if (typeof top == 'undefined') top = spriteDefault.top;
	if (typeof left == 'undefined') left = spriteDefault.left;
	if (typeof layer == 'undefined') layer = spriteDefault.layer;
	if (typeof destroyable == 'undefined') destroyable = spriteDefault.destroyable;
	if (typeof score == 'undefined') score = spriteDefault.score;

	var img = new Image();
	var sprite = $('<div style="position:absolute;top:' + top + ';left:' + left + ';"></div>')
		.data('id', id)
		.data('path', path)
		.data('layer', layer)
		.data('destroyable', destroyable)
		.data('score', score);
			
	img.onload = function() {
		sprite.width(img.width/2).height(img.height)
			.css('background-image', 'url(' + img.src + ')')
			.css('top', top)
			.css('left', left);
	};
	
	img.src = levelPath + path;
	
	tiles[currentTileIndex].sprites[id] = {
		path: path,	
		top: top,
		left: left,
		layer: layer,
		destroyable: destroyable,
		score: score
	};
	
	sprite.draggable( { containment: 'parent', distance: 10, stop: updateSprite } ).appendTo($('#grid'));
}

$('#setBackground').on('click', function(event) {
	deselectSprite();
	setBackground($('#backgrounds').val());
});

$('#export').on('click', function(event) {
	deselectSprite();
	$('#output').val(getOutput());
});

$('#import').on('click', function(event) {
	deselectSprite();
	tiles = [];

	var resultTiles = JSON.parse($('#output').val());
	
	for	(tile in resultTiles) {
		var sprites = [];
		
		for(sprite in resultTiles[tile].sprites) {
			if (typeof resultTiles[tile].sprites[sprite].path == 'undefined') throw 'Undefined path in sprite';
			if (typeof resultTiles[tile].sprites[sprite].top == 'undefined') resultTiles[tile].sprites[sprite].top = spriteDefault.top;
			if (typeof resultTiles[tile].sprites[sprite].left == 'undefined') resultTiles[tile].sprites[sprite].left = spriteDefault.left;
			if (typeof resultTiles[tile].sprites[sprite].layer == 'undefined') resultTiles[tile].sprites[sprite].layer = spriteDefault.layer;
			if (typeof resultTiles[tile].sprites[sprite].destroyable == 'undefined') resultTiles[tile].sprites[sprite].destroyable = spriteDefault.destroyable;
			if (typeof resultTiles[tile].sprites[sprite].score == 'undefined') resultTiles[tile].sprites[sprite].score = spriteDefault.score;

			sprites[Math.random()] = {
				path: resultTiles[tile].sprites[sprite].path,
				top: resultTiles[tile].sprites[sprite].top,
				left: resultTiles[tile].sprites[sprite].left,
				layer: resultTiles[tile].sprites[sprite].layer,
				destroyable: resultTiles[tile].sprites[sprite].destroyable,
				score: resultTiles[tile].sprites[sprite].score
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
	$('#output').val('');
	alert('Import complete');
});

function renderTile(tile) {
	$('#grid').children().remove();
	setBackground(tile.background);
	
	for(sprite in tile.sprites) {
		addSprite(
			sprite,
			tile.sprites[sprite].path,
			tile.sprites[sprite].top,
			tile.sprites[sprite].left,
			tile.sprites[sprite].layer,
			tile.sprites[sprite].destroyable,
			tile.sprites[sprite].score
			);
	}
}

$('#nextTile').on('click', function(event) {
	deselectSprite();
    currentTileIndex++;
    $('#tileIndexLabel').html(currentTileIndex+1);

    if(tiles.length == currentTileIndex) {
		tiles.push( { sprites: []  } );
    }

    renderTile(tiles[currentTileIndex]);
});

$('#prevTile').on('click', function(event) {
	deselectSprite();
	if (currentTileIndex > 0) {
		currentTileIndex--;
		$('#tileIndexLabel').html(currentTileIndex+1);
		renderTile(tiles[currentTileIndex]);
	}
});

$('#addSprite').on('click', function(event){
	var id = Math.random();
	var path = $('#sprites').val();
	
	addSprite(id, path);
});

function setSprites() {
	tiles[currentTileIndex].sprites = [];

	$.each($('#grid').children(), function(key, object) {
		var sprite = $(object);
	
		tiles[currentTileIndex].sprites[sprite.data('id')] = {
			path: sprite.data('path'),
			top: sprite.css('top'),
			left: sprite.css('left'),
			layer: sprite.data('layer'),
			destroyable: sprite.data('destroyable'),
			score: 	sprite.data('score')
		};
	});
}

$('body').on('keydown', function (event) {
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
		else if (event.which == 46) { // Del
			event.preventDefault();
			removeSprite(selectedSprite);
		}
		else if (event.which == 38) { // Up
			event.preventDefault();
			selectedSprite.css({ top: '-=1' });
		}
		else if (event.which == 40) { // Down
			event.preventDefault();
			selectedSprite.css({ top: '+=1' });
		}
		else if (event.which == 37) { // Left
			event.preventDefault();
			selectedSprite.css({ left: '-=1' });
		}
		else if (event.which == 39) { // Right
			event.preventDefault();
			selectedSprite.css({ left: '+=1' });
		}
		else if (event.which == 27) { // Esc
			event.preventDefault();
			deselectSprite();
		}
	}

	//console.log(event.which);
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
		.data('score', $('#spriteProps #score').val().toString());

		updateSprite();
	});

	$('#grid').on('mousedown', 'div.ui-draggable', function(event){
		event.preventDefault();
		event.stopPropagation();
		selectSprite($(this));
	})
	setBackground($('#backgrounds').val());
});

</script>
</body>
</html>
