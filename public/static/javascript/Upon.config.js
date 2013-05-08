Upon.require({
	'third-party': [
		'http://game.multeor.com:3333/socket.io/socket.io.js',
		'third-party/jquery-1.9.1.min.js',
		'third-party/howler.min.js'
	],
	'title-screen-production': [
		'title-screen/title-screen.js'
	],
	'title-screen-development': [
		'title-screen.min.js'
	],
	'viewer-production': [
		'viewer.min.js'
	],
	'viewer-development': [
		'viewer/profiler.js',
		'viewer/game.js',
		'viewer/player.js',
		'viewer/destroyable.js',
		'viewer/viewer.js'
	],
	'controller-production': [
		'controller.min.js'
	],
	'controller-development': [
		'controller/controller.js'
	]
});