var swig = require('swig')
var path = require('path')
var rootDir = path.dirname(module.filename)
var templateDir = path.join(rootDir, '..', 'templates')

// Safely escape data for RegExp parsing
function escapeRegExp(str) {
    return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&")
}

// Safely escape data for XML parsing
function escapeXML(data) {
    return !data ? '' : data.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
               .replace(/</g, '&lt;').replace(/>/g, '&gt;')
               .replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;')
}

// Return JSON without metadata
function trimJSON(data) {
    var json = generateJSONSkeleton()
    Object.keys(json).forEach(function(item, index) { if (data[item]) json[item] = data[item] })
    if (json.metadata) delete json.metadata
    return json
}

// Format JSON with given spacing
function pretty(data, spacing) {
    if (!spacing) spacing = 2
    return JSON.stringify(data, null, spacing)
}

// Provide proper indenting for a given line
function indentSpacing(indentLevel) {
    var spacing = ''
    for (var currentLevel = 0; currentLevel < indentLevel; currentLevel++) { spacing += '  ' }
    return spacing
}

// Iterate through given HTML data and tag notable words
function emphasizeHTML(data, metadata) {
    if (!metadata || !metadata.keywords) return data
    
    var tempData = data
    metadata.keywords.forEach(function(keyword, index) {
        tempData = tempData.replace(
            new RegExp(escapeRegExp(keyword), 'g'),
            '<span class="notable">' + keyword + '</span>'
        )
    })
    return tempData
}

// Generate JSON skeleton
function generateJSONSkeleton() {
    // TODO: generate skeleton from JSON model
    return {metadata:{},info:{},positions:[],projects:[]}
}

// Generate JSON data
function generateJSON(data) {
    return pretty(trimJSON(data), 4)
}

// Generate XML data
function generateXML(data, level, parentName) {
    if (!level) return '<?xml version="1.0" encoding="utf-8"?>\n<resume>\n'
                       + generateXML(trimJSON(data), 1) + '</resume>'

    var xmlData = ''
    Object.keys(data).forEach(function(property, index) {
        // Check for non-existent or null JSON property
        if (!data.hasOwnProperty(property) || !data[property]) return

        var propertyName = !isNaN(property) ? parentName.replace(/s$/, '') : property
        xmlData += indentSpacing(level) + '<' + propertyName + '>'

        // Check for property type
        if (typeof data[property] == 'object') {
            xmlData += '\n' + generateXML(data[property], level + 1, property) + indentSpacing(level)
        } else if (Array.isArray(data[property])) {
            data[property].forEach(function(item, itemIndex) {
                xmlData += generateXML(data[property][item], level + 1, property) + indentSpacing(level)})
        } else {
            xmlData += escapeXML(data[property])
        }

        xmlData += '</' + propertyName + '>\n'
    })

    return xmlData
}

// Generate HTML data
function generateHTML(data) {
    var renderedHTML = swig.renderFile(path.join(templateDir, 'html', 'resume.html'), trimJSON(data))
    return emphasizeHTML(renderedHTML, data.metadata)
}

// Specify module exports
module.exports = {
    pretty: pretty,
    generateJSONSkeleton: generateJSONSkeleton,
    generateJSON: generateJSON,
    generateXML: generateXML,
    generateHTML: generateHTML
}