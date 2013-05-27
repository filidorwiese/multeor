Upon.require({
    'third-party': [
        'http://game.multeor.com:843/socket.io/socket.io.js',
        'third-party/jquery-1.9.1.min.js',
        'third-party/howler.min.js'
    ],
    'title-screen-production': [
        'title-screen.min.js'
    ],
    'title-screen-development': [
        'title-screen/title-screen.js',
        'controller/facebook.js'
    ],
    'viewer-production': [
        'viewer.min.js'
    ],
    'viewer-development': [
        'viewer/profiler.js',
        'viewer/game.js',
        'viewer/player.js',
        'viewer/destroyable.js',
        'viewer/explosion.js',
        'viewer/shadows.js',
        'viewer/viewer.js'
    ],
    'controller-production': [
        'controller.min.js'
    ],
    'controller-development': [
        'controller/controller.js',
        'controller/facebook.js'
    ]
});