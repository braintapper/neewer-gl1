gulp   = require('gulp')
rename = require("gulp-rename")


# set the compilation order of the client
sourcePaths = ["index.js"]




module.exports = (cb)->




  stream = gulp.src(sourcePaths).pipe(rename("index.mjs")).pipe(gulp.dest("."))
  stream.on 'end', ()->
    console.log "renamed js to mjs"
    cb()

module.exports.watch = sourcePaths
module.exports.displayName = "javascripts"
