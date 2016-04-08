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
function sendJSON(res, data) {
    res.set('Content-Type', 'application/json')
    if (!data) {
        res.status(503).send('Resume data unavailable')
        return
    }

    var jsonData = manipulate.generateJSON(data)
    res.status(200).send(jsonData)
}

// Respond with XML formatted resume
function sendXML(res, data) {
    res.set('Content-Type', 'application/xml')
    if (!data) {
        res.status(503).send('Resume data unavailable')
        return
    }

    var xmlData = manipulate.generateXML(data)
    res.status(200).send(xmlData)
}

// Respond with HTML formatted resume
function sendHTML(res, data) {
    res.set('Content-Type', 'text/html')
    if (!data) {
        res.status(503).send('Resume data unavailable')
        return
    }

    var htmlData = manipulate.generateHTML(data)
    res.status(200).send(htmlData)
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
        res.status(400).send('AWS response router cannot determine DynamoDB region')
        return
    } else if (!module.exports.table) {
        res.status(400).send('AWS response router cannot determine DynamoDB table name')
        return
    }
    
    manage.getAWSData(module.exports.region, module.exports.table, function(err, data) {
        if (!err) {
            serveResume(req, res, JSON.parse(data))
        } else {
            console.error(err, err.stack)
            res.status(500).send('AWS response router cannot read resume file')
            return
        }
    })
}

// Response router for local requests
function routerLocal(req, res) {
    if (!module.exports.resume) {
        res.status(400).send('Local response router cannot determine resume file')
        return
    }
    
    fs.readFile(module.exports.resume, 'utf-8', function(err, data) {
        if (err) {
            console.error(err, err.stack)
            res.status(404).send('Local response router cannot read resume file')
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