var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(module.filename)

var aws = require(path.join(rootDir, 'aws.js'))
var manage = require(path.join(rootDir, 'manage.js'))
var manipulate = require(path.join(rootDir, 'manipulate.js'))

// Initialize AWS config
function setAWSRegion(region, table) {
    module.exports.region = region
    module.exports.table = table
}

// Respond with JSON formatted resume
function sendJSON(response, data) {
    response.set('Content-Type', 'application/json')
    if (!data) {
        response.send(503, 'Resume data unavailable')
        return
    }

    var jsonData = manipulate.generateJSON(data)
    response.send(200, jsonData)
}

// Respond with XML formatted resume
function sendXML(response, data) {
    response.set('Content-Type', 'application/xml')
    if (!data) {
        response.send(503, 'Resume data unavailable')
        return
    }

    var xmlData = manipulate.generateXML(data)
    response.send(200, xmlData)
}

// Respond with HTML formatted resume
function sendHTML(response, data) {
    response.set('Content-Type', 'text/html')
    if (!data) {
        response.send(503, 'Resume data unavailable')
        return
    }

    var htmlData = manipulate.generateHTML(data)
    response.send(200, htmlData)
}

// Determine the type of response handler
function getHandler(req) {
    var handler = null;
    req.query.format = !req.query.format ? 'html' : req.query.format.toLowerCase()
    switch (req.query.format) {
        case 'json':
            handler = sendJSON
            break

        case 'xml':
            handler = sendXML
            break

        case 'html':
        default:
           req.query.format = 'html'
           handler = sendHTML
    }
    
    return handler;
}

// Route resume data to the appropriate handler
function serveResume(req, res, jsonData) {
    getHandler(req)(res, jsonData)
    console.log('Served fresh ass %s resume to \'%s\'',
        req.query.format, req.connection.remoteAddress)
}

// Response router for AWS requests
function routerAWS(req, res) {
    if (!module.exports.region) {
        response.send(400, 'AWS response router cannot determine DynamoDB region')
        return
    } else if (!module.exports.table) {
        response.send(400, 'AWS response router cannot determine DynamoDB table name')
        return
    }
    
    manage.getAWSData(module.exports.region, module.exports.table, function(err, data) {
        if (!err) {
            serveResume(req, res, JSON.parse(data))
        } else {
            console.error(err, err.stack)
            res.send(500, 'AWS response router cannot read resume file')
            return
        }
    })
}

// Response router for local requests
function routerLocal(req, res) {
    if (!module.exports.resume) {
        response.send(400, 'Local response router cannot determine resume file')
        return
    }
    
    fs.readFile(module.exports.resume, 'utf-8', function(err, data) {
        if (err) {
            console.error(err, err.stack)
            res.send(404, 'Local response router cannot read resume file')
            return
        }
        
        serveResume(req, res, JSON.parse(data))
    })
}

// Specify module exports
module.exports = {
    setAWSRegion: setAWSRegion,
    routerAWS: routerAWS,
    routerLocal: routerLocal
}