var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(module.filename)
var libDir = path.join(rootDir, 'lib')

var aws = require(path.join(libDir, 'aws.js'))
var manipulate = require(path.join(libDir, 'manipulate.js'))

var commands = {
    'bootstrap': ['Bootstrap', ''],
    'retrieve': ['Retrieve', ''],
    'update': ['Update', '<resume.json>'],
    'minify': ['Minify', '<resume.json>'],
    'pretty': ['Pretty', '<resume.json>']
}

var tableParams = {
    KeySchema: [
        { AttributeName: 'Section', KeyType: 'HASH' },
        { AttributeName: 'Data', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'Section', AttributeType: 'S' },
        { AttributeName: 'Data', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
}

// Print management usage
function printUsage(command) {
    if (commands[command])
        console.error('%s usage: node manage.py %s %s',
                      commands[command][0], command, commands[command][1])
    else for (var cmd in commands)
        console.log('%s usage: node manage.py %s %s',
                      commands[cmd][0], cmd, commands[cmd][1])
}

// Create the required data table
function createDataTable(callback) {
    console.log('Creating data table')
    aws.createResumeDataTable(tableParams, callback)
}

// Save all sections of resume data
function putAllSections(data) {
    for (var section in data) {
        var params = { Item: {
            Section: { 'S': section },
            Data: { 'S': JSON.stringify(data[section]) }
        }}

        console.log('Putting section "%s"', section)
        aws.putResumeSection(params, function(err, data) {
            if (err) console.error('Section bootstrap failed - %s', err.stack)
        })
    }
}

// Populate initial minimum data
function bootstrapData() {
    var model = manipulate.generateEmptyJSON()
    aws.getResumeData(function(err, data) {
        if (err) {
            console.log('Hit an error while getting resume data')
            console.error(err.stack)
            return
        }

        // Determine which sections are already created
        data.Items.forEach(function(item, index) {
            console.log('Section "%s" already exists', item.Section.S)
            if (model[item.Section.S]) delete model[item.Section.S]
        })

        // Initialize remaining model
        putAllSections(model)
    })
}

// Get current raw JSON data
function getCurrentData(callback) {
    console.log('Getting current resume data')
    aws.getResumeData(function(err, data) {
        if (err) {
            callback(err, null)
            return
        }

        var resumeData = manipulate.generateEmptyJSON()
        data.Items.forEach(function(item, index) {
            resumeData[item.Section.S] = JSON.parse(item.Data.S)
        })
        callback(null, resumeData)
    })
}

// Parse data to JSON
function parseData(data) {
    return JSON.parse(manipulate.stripJSON(data))
}

// Format JSON data minimally
function formatMin(data) {
    return JSON.stringify(parseData(data))
}

// Format JSON with proper tabbing
function formatPretty(data) {
    return JSON.stringify(parseData(data), null, '  ')
}

// Update raw JSON data
function updateData(newData) {
    var json = parseData(newData)
    getCurrentData(function(err, data) {
        if (err) {
            console.error(err.stack)
            return
        }

        for (var section in json) {
            console.log('Setting updated section "%s"', section)
            data[section] = json[section]
        }
        putAllSections(data)
    })
}

// Main management logic
var args = process.argv.slice(2)
if (args.length < 1) printUsage()
else switch (args[0]) {
    case 'bootstrap':
        createDataTable(function(err, data) {
            if (err && err.message.indexOf('Table already exists') > 1) console.error(err.stack)
            else bootstrapData()
        })
        break

    case 'retrieve':
        getCurrentData(function(err, data) {
            if (err) console.error(err.stack)
            else console.log(JSON.stringify(data))
        })
        break

    case 'minify':
        if (!args[1]) {
            printUsage('minify')
            break
        }
        console.log(formatMin(fs.readFileSync(args[1], 'utf8')))
        break

    case 'pretty':
        if (!args[1]) {
            printUsage('pretty')
            break
        }
        console.log(formatPretty(fs.readFileSync(args[1], 'utf8')))
        break

    case 'update':
        if (!args[1]) {
            printUsage('update')
            break
        }
        updateData(fs.readFileSync(args[1], 'utf8'))
        break

    default:
        printUsage()
}