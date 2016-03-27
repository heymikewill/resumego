var AWS = require('aws-sdk')
AWS.config.region = 'us-west-2'

var dynamoDB = new AWS.DynamoDB();
var tableName = 'ResumeData'

var path = require('path')
var rootDir = path.dirname(require.main.filename)
var libDir = path.join(rootDir, 'lib')
var manipulate = require(path.join(libDir, 'manipulate.js'))

// Create resume data table in DynamoDB
function createResumeDataTable(params, callback) {
    params.TableName = tableName;
    dynamoDB.createTable(params, callback)
}

// Save a section
function putResumeSection(params, callback) {
    params.TableName = tableName;
    dynamoDB.putItem(params, callback)
}

// Get resume data from DynamoDB
function getResumeData(callback) {
    dynamoDB.scan({TableName:tableName}, callback)
}

// Specify module exports
module.exports = {
    createResumeDataTable: createResumeDataTable,
    getResumeData: getResumeData,
    putResumeSection: putResumeSection
}