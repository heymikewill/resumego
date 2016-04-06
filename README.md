# Resumego [![Current Version](https://img.shields.io/npm/v/resumego.svg?style=flat-square)](https://www.npmjs.com/package/resumego) [![License](http://img.shields.io/badge/license-GPLv3-brightgreen.svg?style=flat-square)]()

Resumego (rez-uh-MAY-goh) is a modular, responsive, data-centric resume app written in Node.js, tasked with serving up the freshest resume possible. Keep it lean and clean.

The model used for JSON parsing and resume structure can be found at `templates/json/model.json`.

### Resume... Go!

Resume data can be pulled from a linked AWS account or a local JSON file that you specify.  To run resumego locally, simply pass in the filename of your JSON resume.  To link resumego to your AWS account, simply set up your AWS environment as you [normally would](https://aws.amazon.com/sdk-for-node-js/#Get_Started_Fast) via config files or environment variables, and pass in what region and table you want to use for DynamoDB.
```
require('resumego').start(8080, 'resume.json') // Run against local file
require('resumego').start(8080, 'us-west-2', 'ResumeData') // Run against AWS data
```

### Resume Management

Management of resume data, especially relating to interaction with AWS, currently has no mystical easy module-level solution.  If you would like to take advantage of the management functions that are not yet incorporated with resumego on the module level, it is best to run from within resumego itself.
```
$ cd resumego
$ node manage.js

Bootstrap usage: node manage.py bootstrap <region> <table>
Retrieve usage: node manage.py retrieve <region> <table>
Update usage: node manage.py update <region> <table> <resume.json>
Minify usage: node manage.py minify <resume.json>
Pretty usage: node manage.py pretty <resume.json>
```

**bootstrap**: bootstrap a resume data table in a given AWS region.  
**retrieve**: retrieve your current JSON resume data from AWS.  
**update**: update your JSON resume data in AWS.  
**minify**: parse a given JSON resume file and print out a minified version.  
**pretty**: parse a given JSON resume file and print out a formatted version.  