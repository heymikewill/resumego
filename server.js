/*********************************************
 * Serving up fresh ass resumes all day long *
 *********************************************/

var express = require('express')
var app = express()

var path = require('path')
var libDir = path.join(__dirname, 'lib')
var staticDir = path.join(__dirname, 'static')
app.use(express.static(staticDir))

var respond = require(path.join(libDir, 'respond.js'))
app.get('/', respond.routerGET)

// Start server
var server = app.listen(8081, function() {
    var addr = server.address()
    console.log('Serving up fresh ass resumes at http://%s:%s', addr.address, addr.port)
})
