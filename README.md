Resumego [![Current Version](https://img.shields.io/npm/v/resumego.svg?style=flat-square)](https://github.com/heymikewill/resumego) [![License](http://img.shields.io/badge/license-GPLv3-brightgreen.svg?style=flat-square)]()
========

Resumego is a modular, responsive, data-centric resume app written in Node.js, tasked with serving up the freshest resume possible. Keep it lean.

To link resumego to your AWS account, simply set up your AWS environment as you [normally would](https://aws.amazon.com/sdk-for-node-js/#Get_Started_Fast) via config files or environment variables.  To run resumego locally, simply pass in the filename of your JSON resume.
```
require('resumego').start(8080) // Run against AWS data
require('resumego').start(8080, 'resume.json') // Run against local file
```

The model used for JSON parsing and resume structure can be found at `templates/json/model.json`.