var fs = require('fs')
var path = require('path')
var rootDir = path.dirname(module.filename)
var libDir = path.join(rootDir, 'lib')

var aws = require(path.join(libDir, 'aws.js'))
var manipulate = require(path.join(libDir, 'manipulate.js'))

var commands = {
    'bootstrap': ['Bootstrap', ['<region>', '<table>']],
    'retrieve': ['Retrieve', ['<region>', '<table>']],
    'update': ['Update', ['<region>', '<table>', '<resume.json>']],
    'minify': ['Minify', ['<resume.json>']],
    'pretty': ['Pretty', ['<resume.json>']]
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

// Create the required data table
function createDataTable(region, table, callback) {
    console.log('Creating data table "%s"', table)
    tableParams.TableName = table
    aws.setRegion(region)
    aws.createResumeDataTable(tableParams, callback)
}

// Save all sections of resume data
function putAllSections(region, table, data) {
    aws.setRegion(region)
    for (var section in data) {
        var params = { 
            TableName: table,
            Item: {
                Section: { 'S': section },
                Data: { 'S': JSON.stringify(data[section]) }
            }
        }

        console.log('Putting section "%s"', section)
        aws.putResumeSection(params, function(err, data) {
            if (err) console.error('Section bootstrap failed - %s', err.stack)
        })
    }
}

// Populate initial minimum data
function bootstrapData(region, table) {
    var model = manipulate.generateEmptyJSON()
    aws.setRegion(region)
    aws.getResumeData(table, function(err, data) {
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
        putAllSections(table, model)
    })
}

// Get current raw JSON data
function getCurrentData(region, table, callback) {
    aws.setRegion(region)
    aws.getResumeData(table, function(err, data) {
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
function updateData(region, table, newData) {
    var json = parseData(newData)
    aws.setRegion(region)
    getCurrentData(table, function(err, data) {
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

// Print management usage
function printUsage(command) {
    if (commands[command])
        console.log('%s usage: node manage.py %s %s',
                      commands[command][0], command, commands[command][1].join(' '))
    else for (var cmd in commands)
        console.log('%s usage: node manage.py %s %s',
                      commands[cmd][0], cmd, commands[cmd][1].join(' '))
}

// Check to see if args are valid
function checkCommandArgs(args) {
    var commandInfo = commands[args[0]]
    if (!commandInfo) return false
    if (args.length - 1 != commandInfo[1].length) return false
    return true
}

// Main management logic
var args = process.argv.slice(2)
if (args.length < 1) {
    printUsage()
} else if (!checkCommandArgs(args)) {
    printUsage(args[0])
} else switch (args[0]) {
    case 'bootstrap':
        createDataTable(args[1], args[2], function(err, data) {
            if (err && err.message.indexOf('Table already exists') > 1) console.error(err.stack)
            else bootstrapData(args[1], args[2])
        })
        break

    case 'retrieve':
        getCurrentData(args[1], args[2], function(err, data) {
            if (err) console.error(err.stack)
            else console.log(JSON.stringify(data))
        })
        break

    case 'minify':
        console.log(formatMin(fs.readFileSync(args[1], 'utf8')))
        break

    case 'pretty':
        console.log(formatPretty(fs.readFileSync(args[1], 'utf8')))
        break

    case 'update':
        updateData(args[1], args[2], fs.readFileSync(args[3], 'utf8'))
        break

    default:
        printUsage(args[0])
}