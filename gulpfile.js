var gulp = require('gulp');

var concat    = require('gulp-concat');
var uglify    = require('gulp-uglify');
var minifycss = require('gulp-minify-css');

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

gulp.task('watch', function () {
  var watcher = gulp.watch('*', ['build']);

  watcher.on('change', function(event) {
    console.log('File "' + event.path + '" changed.');
  });
});

gulp.task('default', ['build']);
