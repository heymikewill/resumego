/*********************************************
 * Serving up fresh ass resumes all day long *
 *********************************************/

var path = require('path')
var rootDir = path.dirname(module.filename)
var libDir = path.join(rootDir, 'lib')
var staticDir = path.join(rootDir, 'static')

var express = require('express')
var app = express()
app.use(express.static(staticDir))

var server = null
var respond = require(path.join(libDir, 'respond.js'))
var manage = require(path.join(libDir, 'manage.js'))
var manipulate = require(path.join(libDir, 'manipulate.js'))

// Start a resumego server on a given port
function startServer(port) {
    if (!port) {
        console.error('No port specified!')
        return
    }
    
    server = app.listen(port, function() {
        var addr = server.address()
        console.log('Serving up fresh ass resumes at http://%s:%s', addr.address, addr.port)
    })
}

// Start resumego against AWS
function startAWS(port, region, table) {
    if (!region) {
        console.error('No AWS region specified!')
        return
    } else if (!table) {
        console.error('No DynamoDB table specified!')
        return
    }
    
    respond.setAWSRegion(region, table)
    app.get('/',  respond.routerAWS)
    startServer(port)
}

// Start resumego against a local JSON resume
function startLocal(port, resume) {
    if (!resume) {
        console.error('No resume file specified!')
        return
    }
    
    respond.resume = resume
    app.get('/',  respond.routerLocal)
    startServer(port)
}

// Stop resumego
function stop() {
    if (server) server.close(function() {
        console.log('*cough* *cough*')
    })
    server = null
}

// Specify module exports
module.exports = {
    bootstrapAWS: manage.bootstrapAWS,
    getAWSData: manage.getAWSData,
    updateAWS: manage.updateAWS,
    
    startAWS: startAWS,
    startLocal: startLocal,
    stop: stop
}