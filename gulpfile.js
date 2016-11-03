var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var es = require('event-stream');


gulp.task('sass', function() {
	return gulp.src('assets/sass/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('assets/css'))
});

gulp.task('scripts', function() {

	return gulp.src('assets/js/src/*.js')
		.pipe(concat('all.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('assets/js'));
});


gulp.task('watch', function () {
	gulp.watch('assets/js/src/*.js', ['scripts']);
	gulp.watch('assets/sass/**/*.scss', ['sass']);
});

gulp.task('default', ['sass','scripts','watch'], function() {

});
