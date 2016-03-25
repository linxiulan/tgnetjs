var gulp = require('gulp');
var gutil = require("gulp-util");
var path = require("path");
var named = require("vinyl-named");
var webpack = require("webpack-stream");
var webpackConfig = require("./webpack.config.js");
var version = {};
var releasePath = "release/";
gulp.task("webpack", function () {
    return gulp.src(['plugins/**/*.js'])
               .pipe(named(function (file) {
                   var basename = path.dirname(file.history[0]);
                   basename = path.basename(basename);
                   return file.base.substr(file.cwd.length) + basename;
               }))
               .pipe(webpack(webpackConfig))
               .pipe(gulp.dest(releasePath));
});
gulp.task("default", ['webpack']);
gulp.watch('plugins/**/*.*', ['webpack']);