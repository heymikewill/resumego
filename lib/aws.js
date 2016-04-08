var AWS = require('aws-sdk')
var dynamoDB = null;

var path = require('path')
var rootDir = path.dirname(module.filename)
var manipulate = require(path.join(rootDir, 'manipulate.js'))

// Set AWS region
function setRegion(region) {
    if (dynamoDB && AWS.config.region == region) return
    
    AWS.config.region = region
    dynamoDB = new AWS.DynamoDB();
}

// Create resume data table in DynamoDB
function createResumeDataTable(params, callback) {
    dynamoDB.createTable(params, function(err, data) {
        if (err) callback(err, data)
        else dynamoDB.waitFor('tableExists', {TableName: params.TableName}, callback)
    })
}

// Save a section
function putResumeSection(params, callback) {
    dynamoDB.putItem(params, callback)
}

// Get resume data from DynamoDB
function getResumeData(table, callback) {
    dynamoDB.scan({TableName: table}, callback)
}

// Specify module exports
module.exports = {
    createResumeDataTable: createResumeDataTable,
    getResumeData: getResumeData,
    putResumeSection: putResumeSection,
    setRegion: setRegion
}