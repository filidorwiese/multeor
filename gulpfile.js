var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    path = require('path'),
    packageJson = require('./package.json');

var config = {
    banner: '/*! Version ' + packageJson.version + ' - ' + new Date().toString() + ' */\n',
    version: packageJson.version,
    dirs: {
        css: './public/static/css',
        sass: './public/static/sass',
        js: './public/'
    }
};

gulp.task('build', function (cb) {
    runSequence('build:sass', cb); //build:js
});

gulp.task('build:sass', function () {
    function processWinPath(file) {
        if (process.platform === 'win32') {
            file.path = path.relative('.', file.path);
            file.path = file.path.replace(/\\/g, '/');
        }
    }

    return gulp.src(config.dirs.sass + '/*.scss')
        .on('data', processWinPath)
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            errLogToConsole: true,
            sourceComments: 'map',
            sourceMap: 'sass'
        }))
        .pipe($.minifyCss())
        .pipe($.sourcemaps.write('./'))
        .pipe($.header(config.banner))
        .pipe(gulp.dest(config.dirs.css));
});


//
//gulp.task('build:js', function () {
//    return gulp.src(manifest['common-dev'], {cwd: config.dirs.src + '/'})
//        .pipe($.concat('common.js'))
//        .pipe($.sourcemaps.init())
//        .pipe($.uglify({mangle: false}))
//        .pipe($.sourcemaps.write('./'))
//        .pipe($.header(config.banner))
//        .pipe(gulp.dest(config.dirs.build + '/'));
//});
//
//gulp.task('build:copy', function () {
//    gulp.src(config.dirs.src + '/manifest.json')
//        .pipe(gulp.dest(config.dirs.build + '/'));
//    gulp.src(config.dirs.src + '/assets/images/**/*')
//        .pipe(gulp.dest(config.dirs.build + '/images/'));
//    gulp.src(config.dirs.src + '/assets/fonts/**/*')
//        .pipe(gulp.dest(config.dirs.build + '/fonts/'));
//    gulp.src([
//        config.dirs.src + '/bower_components/angular-i18n/*',
//        '!' + config.dirs.src + '/bower_components/angular-i18n/angular-locale_fi-fi.js' // exclude finnish locale with incorrect formatting (angular issue #11148)
//    ])
//        .pipe(gulp.dest(config.dirs.build + '/i18n/'));
//    gulp.src(config.dirs.src + '/missing-locales/*')
//        .pipe(gulp.dest(config.dirs.build + '/i18n/'));
//});
//
//gulp.task('watch', function () {
//    gulp.watch([config.dirs.src + '/assets/sass/**/*.scss'], ['build:sass']);
//    gulp.watch([config.globs.js, config.globs.templates], ['jshint', 'build:js']);
//});
//
//gulp.task('default', function (cb) {
//    runSequence('build', 'watch', cb);
//});
