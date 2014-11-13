var gulp = require('gulp');

var concat    = require('gulp-concat');
var connect   = require('gulp-connect');
var minifycss = require('gulp-minify-css');
var uglify    = require('gulp-uglify');

function notify(event) {
  console.log('File "' + event.path + '" was changed.');
}

gulp.task('js', function() {
  return gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('.'));
});

gulp.task('css', function() {
  return gulp.src('css/*.css')
    .pipe(concat('style.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('.'))
});

gulp.task('build', ['js', 'css']);

gulp.task('server', function() {
  connect.server({
    root: ['.'],
    port: process.env.PORT || 8000
  });
});

gulp.task('watch', ['server'], function () {
  gulp.watch('css/*.css', ['css']).on('change', notify);
  gulp.watch('css/*.js', ['js']).on('change', notify);
});

gulp.task('default', ['build']);
