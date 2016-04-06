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

// Start resumego against an AWS account
function startAWS(port, region, table) {
    if (!region) {
        console.error('No AWS region specified!')
        return
    } else if (!table) {
        console.error('No DynamoDB table specified!')
        return
    }
    
    respond.initAWS(region, table)
    app.get('/',  respond.routerAWS)
    
    server = app.listen(port, function() {
        var addr = server.address()
        console.log('Serving up fresh ass resumes at http://%s:%s', addr.address, addr.port)
    })
}

// Start resumego against a local resume
function startLocal(port, resume) {
    if (!resume) {
        console.error('No resume file specified!')
        return
    }
    
    respond.resume = resume
    app.get('/',  respond.routerLocal)
    
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
    startAWS: startAWS,
    startLocal: startLocal,
    stop: stop
}