<?php
	error_reporting(E_ALL);
	ini_set(display_errors,1);

	$levelBasePath = '../levels';
	$levelPath = false;
	if (count($_POST)) {
		//var_dump($_POST);die;
		$load = (isset($_POST['loadlevelsubmit']) ? true : false);
		$level = ($load ? $_POST['loadlevel'] : $_POST['newlevel']);

		if (strstr($level, '.') !== false || strstr($level, '/') !== false) {
			die('403');
		}
		$levelPath = $levelBasePath . '/' . $level;
		if (!is_dir($levelPath)) { die('Level not found' . $levelPath); }

		$levelJson = '';
		if ($load) {
			$levelJson = file_get_contents($levelPath . '/level.json');
		}
	}
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

	fieldset {
		display:inline-block;
		margin-top:30px;
	}

	#grid-and-settings {
		width:1275px;
	}

	#grid {
		height:600px;
		position:relative;
		width:1000px;
		background-color:#DDD;
		background-repeat:no-repeat;
		float:left;
		overflow:hidden;
		border:1px solid #000;
		margin:10px 0;
	}

	#output {
		height:280px;
		width:256px;
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

	#log {
		clear:both;
		float:left;
		width:600px;
	}

	#prev-next-tile {
		float:right;
		margin-right:270px;
	}
	</style>
</head>

<? if (!$levelPath): ?>
	<body>
	<h3>Multeor - map editor</h3>
	<div id="loadlevel">
		<form action="?" method="post">
			<fieldset>
				<legend>New level</legend>
				Choose an existing level for it's assets
				<select name="newlevel">
					<?php
						foreach (glob($levelBasePath . "/*", GLOB_ONLYDIR) as $dir) {
							echo '<option>' . basename($dir) . '</option>';
						}
					?>
				</select>
				<input type="submit" name="newlevelsubmit" value="Continue" />
			</fieldset>
			<br />
			<fieldset>
				<legend>Load level</legend>
				Load an existing level
				<select name="loadlevel">
					<?php
						foreach (glob($levelBasePath . "/*", GLOB_ONLYDIR) as $dir) {
							echo '<option>' . basename($dir) . '</option>';
						}
					?>
				</select>
				<input type="submit" name="loadlevelsubmit" value="Continue" />
			</fieldset>
		</form>
	</div>

<? else: ?>
	<body data-level-path="<?= $levelPath; ?>">
	<h3>Multeor - map editor</h3>
	<div id="assets">
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
	</div>

	<div id="grid-and-settings">
		<div id="grid"></div>
		<div id="settings">
			<h3>Sprite properties:</h3>
			<div id="spriteProps">
				<div class="prop">
					<label>Sprite:</label>
					<span id="image"></span>
				</div>
				<div class="prop">
					<label>Id:</label>
					<span id="id"></span>
				</div>
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
					<label>Destroylink</label>
					<input id="destroylink" type="text" />
				</div>
				<div class="prop">
					<label>Animate</label>
					<input id="animate" type="checkbox" />
				</div>
				<div class="prop">
					<label for="audio">Audio on hit</label>
					<select id="audio">
						<?php
							foreach (glob($levelPath . "/audio/sprites/*.ogg") as $file) {
								echo '<option>' . str_replace('.ogg', '', basename($file)) . '</option>';
							}
						?>
						<option>none</option>
					</select>
				</div>
				<div class="prop">
					<label for="score">Score:</label>
					<input id="score" type="text" value="0" />
				</div>
			</div>
			<h3>JSON</h3>
			<div>
				<textarea id="output"><?= $levelJson; ?></textarea><br />
				<input id="export" type="button" value="export" />
				<input id="import" type="button" value="import" />

				<input id="start-over" type="button" value="start over" />
			</div>
		</div>
		<div id="log"></div>
		<div id="prev-next-tile">
			<input id="firstTile" type="button" value="first tile" />
			<input id="prevTile" type="button" value="prev tile" />
		    <span id="tileIndexLabel">1 / 1</span>
			<input id="nextTile" type="button" value="next tile" />
			<input id="lastTile" type="button" value="last tile" />
		</div>
	</div>

	<script src="js/jquery-1.9.1.js"></script>
	<script src="js/jquery-ui-1.10.1.custom.js"></script>
	<script src="js/map-editor.js"></script>

<? endif; ?>

</body>
</html>
