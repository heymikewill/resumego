var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(module.filename)

var aws = require(path.join(rootDir, 'aws.js'))
var manipulate = require(path.join(rootDir, 'manipulate.js'))

var async = require('async')

var tableParams = {
    KeySchema: [
        { AttributeName: 'Section', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'Section', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
}

// Create the required data table
function createDataTable(region, table, callback) {
    console.log('Creating data table "%s"', table)
    tableParams.TableName = table
    aws.setRegion(region)
    aws.createResumeDataTable(tableParams, callback)
}

// Save all sections of resume data
function putAllSections(region, table, data, callback) {
    var sectionStatus = {}
    aws.setRegion(region)
    async.forEach(Object.keys(data), function(section, taskCallback) {
        var sectionData = JSON.stringify(data[section])
        var params = { 
            TableName: table,
            Item: {
                Section: { 'S': section },
                Data: { 'S': sectionData }
            }
        }
        
        aws.putResumeSection(params, function(err, result) {
            sectionStatus[section] = !err
            taskCallback(err)
        })
    }, function(err) {
        callback(err, sectionStatus)
    })
}

// Get current raw JSON data
function getAWSData(region, table, callback) {
    aws.setRegion(region)
    aws.getResumeData(table, function(err, data) {
        if (err) {
            callback(err, null)
            return
        }

        var resumeData = manipulate.generateJSONSkeleton()
        if (data.Items) data.Items.forEach(function(item, index) {
            resumeData[item.Section.S] = JSON.parse(item.Data.S)
        })
        callback(null, JSON.stringify(resumeData))
    })
}

// Populate initial minimum data
function bootstrapAWS(region, table, callback) {
    aws.setRegion(region)
    createDataTable(region, table, function(err, data) {
        if (err && err.code != 'ResourceInUseException') {
            console.log('Hit an error while creating table "%s" [%s]', table, region)
            console.error(err, err.stack)
            return
        }
        
        getAWSData(region, table, function(err, data) {
            if (err) {
                console.log('Hit an error while getting resume data')
                console.error(err, err.stack)
                return
            }

            // Determine which sections are already created
            var model = manipulate.generateJSONSkeleton()
            if (data.Items) data.Items.forEach(function(item, index) {
                console.log('Section "%s" already exists', item.Section.S)
                if (model[item.Section.S]) delete model[item.Section.S]
            })

            // Initialize remaining model
            putAllSections(region, table, model, callback)
        })
    })
}

// Update raw JSON data
function updateAWS(region, table, data, callback) {
    putAllSections(region, table, JSON.parse(data), callback)
}

module.exports = {
    bootstrapAWS: bootstrapAWS,
    getAWSData: getAWSData,
    updateAWS: updateAWS
}