# Make sure that all gulp libs below are installed using `npm install`

'use strict'

series = require("gulp").series
parallel = require("gulp").parallel
watch = require("gulp").watch
task = require("gulp").task


javascriptsTask = require("./javascripts.coffee")
mjsTask = require("./mjs.coffee")

task "javascripts", javascriptsTask


task "bot", (cb)->
  watch javascriptsTask.watch, javascriptsTask
  watch mjsTask.watch, mjsTask

