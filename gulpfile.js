var args            = require('yargs').argv;
var autoprefixer    = require('gulp-autoprefixer');
var babel           = require('gulp-babel');
var browserSync     = require('browser-sync').create();
var bump            = require('gulp-bump');
var cache           = require('gulp-cache');
var checktextdomain = require('gulp-checktextdomain');
var concat          = require('gulp-concat');
var cssnano         = require('gulp-cssnano');
var gulp            = require('gulp');
var gulpif          = require('gulp-if');
var imagemin        = require('gulp-imagemin');
var jshint          = require('gulp-jshint');
var streams         = require('merge-stream')();
var moduleImporter  = require('sass-module-importer');
var plumber         = require('gulp-plumber');
var potomo          = require('gulp-potomo');
var pseudo          = require('gulp-pseudo-i18n');
var rename          = require('gulp-rename');
var runSequence     = require('run-sequence');
var sass            = require('gulp-sass');
var sort            = require('gulp-sort');
var uglify          = require('gulp-uglify');
var wpPot           = require('gulp-wp-pot');
var yaml            = require('yamljs');

var config = yaml.load('+/config.yml');

/* JSHint Task
 -------------------------------------------------- */
gulp.task('jshint', function()
{
	return gulp.src(config.watch.js)
	.pipe(plumber({
		errorHandler: function(error) {
		console.log(error.message);
		this.emit('end');
	}}))
	.pipe(jshint())
	.pipe(jshint.reporter('jshint-stylish'))
});

/* JS Task
 -------------------------------------------------- */
gulp.task('js', function() {
	for(var key in config.scripts) {
		streams.add(gulp.src(config.scripts[key]).pipe(concat(key)));
	}
	return streams
	.pipe(plumber({
		errorHandler: function(error) {
		console.log(error.message);
		this.emit('end');
	}}))
	.pipe(babel({
		presets: ["env"]
	}))
	.pipe(gulpif(args.production, uglify({
		preserveComments: 'license',
	})))
	.pipe(gulp.dest(config.dest.js))
	.pipe(browserSync.stream())
});

/* CSS Task
 -------------------------------------------------- */
gulp.task('css', function() {
	return gulp.src(config.watch.scss)
	.pipe(plumber({
		errorHandler: function(error) {
		console.log(error.message);
		this.emit('end');
	}}))
	.pipe(sass({
		importer: moduleImporter(),
		outputStyle: 'expanded',
	}))
	.pipe(autoprefixer('last 2 versions'))
	.pipe(gulpif(args.production, cssnano({
		minifyFontValues: false,
		discardComments: { removeAll: true }
	})))
	.pipe(gulp.dest(config.dest.css))
	.pipe(browserSync.stream())
});

/* Images Task
 -------------------------------------------------- */
gulp.task('images', function() {
	return gulp.src(config.watch.img)
	.pipe(cache(imagemin({
		optimizationLevel: 3,
		progressive: true,
		interlaced: true,
	})))
	.pipe(gulp.dest(config.dest.img))
});

/* Language Tasks
 -------------------------------------------------- */
gulp.task('languages', function() {
	return runSequence('po', 'mo')
});

gulp.task('po', function() {
	return gulp.src(config.watch.php)
	.pipe(checktextdomain({
		text_domain: config.language.domain,
		keywords: [
			'__:1,2d',
			'_e:1,2d',
			'_x:1,2c,3d',
			'esc_html__:1,2d',
			'esc_html_e:1,2d',
			'esc_html_x:1,2c,3d',
			'esc_attr__:1,2d',
			'esc_attr_e:1,2d',
			'esc_attr_x:1,2c,3d',
			'_ex:1,2c,3d',
			'_n:1,2,4d',
			'_nx:1,2,4c,5d',
			'_n_noop:1,2,3d',
			'_nx_noop:1,2,3c,4d',
		],
	}))
	.pipe(sort())
	.pipe(wpPot({
		domain: config.language.domain,
		lastTranslator: config.language.translator,
		team: config.language.team,
	}))
	.pipe(pseudo({
		// language: 'en_US',
		charMap: {},
	}))
	.pipe(rename(config.language.domain + '-en_US.po'))
	.pipe(gulp.dest(config.dest.lang));
});

gulp.task('mo', function() {
	return gulp.src(config.dest.lang + '*.po')
	.pipe(potomo())
	.pipe(gulp.dest(config.dest.lang));
});

/* Version Task
 -------------------------------------------------- */
gulp.task('bump', function() {
	return gulp.src('style.css')
	.pipe(gulpif(args.patch || Object.keys(args).length < 3, bump({
		type: 'patch'
	})))
	.pipe(gulpif(args.minor, bump({
		type: 'minor'
	})))
	.pipe(gulpif(args.major, bump({
		type: 'major'
	})))
	.pipe(gulp.dest('.'))
});

/* Watch Task
 -------------------------------------------------- */
gulp.task('watch', function() {
	browserSync.init({
		proxy: config.browsersync.proxy
	});
	gulp.watch(config.watch.js, ['jshint', 'js']);
	gulp.watch(config.watch.scss, ['css']);
	gulp.watch(config.watch.php).on('change', browserSync.reload);
});

/* Default Task
 -------------------------------------------------- */
gulp.task('default', function() {
	gulp.start('css', 'jshint', 'js')
});

/* Build Task
 -------------------------------------------------- */
gulp.task('build', function() {
	gulp.start('css', 'jshint', 'js', 'images', 'languages')
});
