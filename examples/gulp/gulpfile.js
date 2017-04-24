var gulp = require('gulp');
var hercule = require('hercule');
var through = require('through2');

gulp.task('hercule', function() {
  function gulpHercule(options) {
    return through.obj( function(file, encoding, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isBuffer()) {
        hercule.transcludeString(file.contents.toString(encoding), options, function(err, output) {
          if (err) {
            return callback(err, null)
          }
          file.contents = new Buffer(output);
          return callback(null, file);
        })
      }

      if (file.isStream()) {
        var transcluder = new hercule.TranscludeStream(options);
        file.contents = file.contents.pipe(transcluder);
        return callback(null, file);
      }
    });
  };

  gulp.src('api.apib', { buffer: false })
    .pipe(gulpHercule())
    .pipe(gulp.dest('build'));
});
