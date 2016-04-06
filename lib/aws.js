var AWS = require('aws-sdk')
var dynamoDB = null;

var path = require('path')
var rootDir = path.dirname(module.filename)
var manipulate = require(path.join(rootDir, 'manipulate.js'))

// Set AWS region
function setRegion(region) {
    AWS.config.region = region
    module.exports.region = region
    
    dynamoDB = new AWS.DynamoDB();
}

// Create resume data table in DynamoDB
function createResumeDataTable(params, callback) {
    dynamoDB.createTable(params, callback)
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