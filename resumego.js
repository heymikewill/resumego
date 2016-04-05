/*********************************************
 * Serving up fresh ass resumes all day long *
 *********************************************/

var express = require('express')
var app = express()

var path = require('path')
var rootDir = path.dirname(module.filename)
var libDir = path.join(rootDir, 'lib')
var staticDir = path.join(rootDir, 'static')
app.use(express.static(staticDir))

var server = null
var respond = require(path.join(libDir, 'respond.js'))

// Start resumego
function start(port, resume) {
    if (typeof resume === 'undefined') {
        app.get('/',  respond.routerGET)
    } else {
        respond.resume = resume
        app.get('/',  respond.routerLocal)
    }
    server = app.listen(port, function() {
        var addr = server.address()
        console.log('Serving up fresh ass resumes at http://%s:%s', addr.address, addr.port)
    })
}

// Stop resumego
function stop() {
    if (server) {
        server.close(function() {
            console.log('*cough* *cough*')
        })
    }
}

// Specify module exports
module.exports = {
    start: start,
    stop: stop
}