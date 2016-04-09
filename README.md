# Resumego [![Current Version](https://img.shields.io/npm/v/resumego.svg?style=flat-square)](https://www.npmjs.com/package/resumego) [![License](http://img.shields.io/badge/license-GPLv3-brightgreen.svg?style=flat-square)]()

Resumego (rez-uh-MAY-goh) is a modular, responsive, data-centric resume app written in Node.js, tasked with serving up the freshest resume possible. Keep it lean and clean.

The model used for JSON parsing and resume structure can be found at `templates/json/model.json`.

### Resume... Go!

Resume data can be pulled from a linked AWS account or a local JSON file that you specify.  To run resumego locally, simply use `startLocal` to pass in the filename of your JSON resume.  To link resumego to your AWS account, simply set up your AWS environment as you [normally would](https://aws.amazon.com/sdk-for-node-js/#Get_Started_Fast) via config files or environment variables, and use `startAWS` to pass in what region and table you want to use for DynamoDB.  To stop a resumego instance, use `stop`.
```javascript
var resumego = require('resumego')

// Start a resumego server
resumego.startLocal(8080, 'resume.json') // Local resume
resumego.startAWS(8080, 'us-west-2', 'ResumeData') // AWS resume

// Stop current server
resumego.stop()
```

### Resume Parsing

JSON resume data should be checked for proper parsing before being used with resumego.  Simply passing resume data through `JSON.parse` should be good enough for validity checking.
```javascript
// Parse a JSON resume file
require('fs').readFile('resume.json', 'utf-8', function(err, data) {
    if (!err) console.log(JSON.stringify(JSON.parse(data))) // Minified
    if (!err) console.log(JSON.stringify(JSON.parse(data), null, 4)) // Pretty
})
```

### AWS Resume Management

Management of AWS backed resume data is done easily through a few operations.  DynamoDB must be initialized through `bootstrapAWS`, which creates a given table and populates it with any relevant sections that are missing according to the JSON model.  Each section is a different row in a DynamoDB table to allow for optimized updates.  Updating AWS data can be done through `updateAWS`.  To simply see what JSON resume data AWS currently stores, run `getAWSData`.
```javascript
var resumego = require('resumego')

// Bootstrap AWS
resumego.bootstrapAWS('us-west-2', 'ResumeData', function(err, results) {
    if (!err) Object.keys(results).forEach(function(section, index) {
        console.log('Section "%s" bootstrapped: %s', section, results[section])})
})

// Update AWS with contents of a local JSON resume
require('fs').readFile('resume.json', 'utf-8', function(err, data) {
    if (!err) resumego.updateAWS('us-west-2', 'ResumeData', data, function(err2, results) {
        Object.keys(results).forEach(function(section, index) {
            console.log('Section "%s" updated: %s', section, results[section])})
    })
})

// Get current JSON data stored in AWS
resumego.getAWSData('us-west-2', 'ResumeData', function(err, data) {
    if (!err) console.log(data) // Default minified
    if (!err) console.log(JSON.stringify(JSON.parse(data), null, 4))
})
``` 