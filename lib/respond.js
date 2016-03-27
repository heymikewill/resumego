var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(require.main.filename)
var libDir = path.join(rootDir, 'lib')

var aws = require(path.join(libDir, 'aws.js'))
var manipulate = require(path.join(libDir, 'manipulate.js'))

// Respond with JSON formatted resume
function sendJSON(response, data) {
    response.set('Content-Type', 'application/json')
    if (!data) {
        response.send(503, 'empty')
        return
    }

    var jsonData = manipulate.generateJSON(data)
    response.send(200, jsonData)
}

// Respond with XML formatted resume
function sendXML(response, data) {
    response.set('Content-Type', 'application/xml')
    if (!data) {
        response.send(503, 'empty')
        return
    }

    var xmlData = manipulate.generateXML(data)
    response.send(200, xmlData)
}

// Respond with HTML formatted resume
function sendHTML(response, data) {
    response.set('Content-Type', 'text/html')
    if (!data) {
        response.send(503, 'empty')
        return
    }

    var htmlData = manipulate.generateHTML(data)
    response.send(200, htmlData)
}

// Response router for GET requests
function routerGET(req, res) {
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

    // Go handle that request
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
        handler(res, resumeData)
    })

	console.log('Served fresh ass %s resume to \'%s\'',
        req.query.format, req.connection.remoteAddress)
}

// Specify module exports
module.exports = {
    routerGET: routerGET
}