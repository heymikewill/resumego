var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(module.filename)

var aws = require(path.join(rootDir, 'aws.js'))
var manipulate = require(path.join(rootDir, 'manipulate.js'))

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

// Response router for GET requests
function routerGET(req, res) {
    aws.getResumeData(function(err, data) {
        var resumeData = manipulate.generateEmptyJSON()
        if (err) {
            resumeData = null;
            console.error(err, err.stack)
        } else {
            data.Items.forEach(function(item, index) {
                resumeData[item.Section.S] = JSON.parse(item.Data.S)
            })
        }
        getHandler(req)(res, resumeData)
    })

	console.log('Served fresh ass %s resume to \'%s\'',
        req.query.format, req.connection.remoteAddress)
}

// Response for local requests
function routerLocal(req, res) {
    var resumeFile = module.exports.resume
    if (typeof resumeFile === 'undefined') {
        response.send(500, 'Local response router cannot determine resume file')
        return
    }
    
    fs.readFile(resumeFile, function(err, data) {
        if (err) {
            res.send(404, 'Local response router cannot read resume file')
            console.error(err, err.stack)
        } else {
            getHandler(req)(res, JSON.parse(data))
            console.log('Served fresh ass local %s resume to \'%s\'',
                req.query.format, req.connection.remoteAddress)
        }
    })
}

// Specify module exports
module.exports = {
    routerGET: routerGET,
    routerLocal: routerLocal
}