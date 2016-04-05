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
    var json = generateEmptyJSON()
    for (var item in json) if (data[item]) json[item] = data[item]
    if (json.metadata) delete json.metadata
    return json
}

// Strip all comments from JSON
function stripJSON(json) {
    /**
     * Taken under MIT licence from getify/JSON.minify
     * https://github.com/getify/JSON.minify
     */
    var tokenizer = /"|(\/\*)|(\*\/)|(\/\/)|\n|\r/g
	var in_string = false
	var in_multiline_comment = false
	var in_singleline_comment = false
	var tmp
    var tmp2
    var new_str = []
    var ns = 0
    var from = 0
    var lc
    var rc

	tokenizer.lastIndex = 0
	while (tmp = tokenizer.exec(json)) {
		lc = RegExp.leftContext
		rc = RegExp.rightContext
		if (!in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.substring(from)
			if (!in_string) tmp2 = tmp2.replace(/(\n|\r|\s)*/g,"")
			new_str[ns++] = tmp2
		}
		from = tokenizer.lastIndex

		if (tmp[0] == "\"" && !in_multiline_comment && !in_singleline_comment) {
			tmp2 = lc.match(/(\\)*$/)
			if (!in_string || !tmp2 || (tmp2[0].length % 2) == 0) {
				in_string = !in_string
			}
			from--
			rc = json.substring(from)
		}
		else if (tmp[0] == "/*" && !in_string && !in_multiline_comment && !in_singleline_comment)
			in_multiline_comment = true
		else if (tmp[0] == "*/" && !in_string && in_multiline_comment && !in_singleline_comment)
			in_multiline_comment = false
		else if (tmp[0] == "//" && !in_string && !in_multiline_comment && !in_singleline_comment)
			in_singleline_comment = true
		else if ((tmp[0] == "\n" || tmp[0] == "\r") && !in_string && !in_multiline_comment && in_singleline_comment)
			in_singleline_comment = false
		else if (!in_multiline_comment && !in_singleline_comment && !(/\n|\r|\s/.test(tmp[0])))
			new_str[ns++] = tmp[0]
	}
	new_str[ns++] = rc;
	return new_str.join("")
}

// Provide proper indenting for a given line
function indentSpacing(indentLevel) {
    var spacing = ''
    for (var currentLevel = 0; currentLevel < indentLevel; currentLevel++) {
        spacing += '  '
    }
    return spacing
}

// Iterate through given HTML data and tag notable words
function emphasizeHTML(data, metadata) {
    var tempData = data
    if (metadata && metadata.keywords) {
        metadata.keywords.forEach(function(keyword, index) {
            tempData = tempData.replace(
                new RegExp(escapeRegExp(keyword), 'g'),
                '<span class="notable">' + keyword + '</span>'
            )
        })
    }
    return tempData
}

// Generate JSON skeleton
function generateEmptyJSON() {
    return {"metadata":{},"info":{},"positions":[],"projects":[]}
}

// Generate JSON data
function generateJSON(data) {
    return JSON.stringify(trimJSON(data), null, 4)
}

// Generate XML data
function generateXML(data, level, parentName) {
    if (!level) {
        return '<?xml version="1.0" encoding="utf-8"?>\n<resume>\n'
            + generateXML(trimJSON(data), 1) + '</resume>'
    }

    var xmlData = ''
    for (var property in data) {
        // Check for non-existent or null JSON property
        if (!data.hasOwnProperty(property) || !data[property]) {
            return
        }

        var propertyName = !isNaN(property) ? parentName.replace(/s$/, '') : property
        xmlData += indentSpacing(level) + '<' + propertyName + '>'

        // Check for property type
        if (typeof data[property] == 'object') {
            xmlData += '\n' + generateXML(data[property], level + 1, property) + indentSpacing(level)
        }
        else if (Array.isArray(data[property])) {
            data[property].forEach(function(item, itemIndex) {
                xmlData += generateXML(data[property][item], level + 1, property) + indentSpacing(level)
            })
        }
        else {
            xmlData += escapeXML(data[property])
        }

        xmlData += '</' + propertyName + '>\n'
    }

    return xmlData
}

// Generate HTML data
function generateHTML(data) {
    var renderedHTML = swig.renderFile(path.join(templateDir, 'html', 'resume.html'), trimJSON(data))
    return emphasizeHTML(renderedHTML, data.metadata)
}

// Specify module exports
module.exports = {
    stripJSON: stripJSON,
    generateEmptyJSON: generateEmptyJSON,
    generateJSON: generateJSON,
    generateXML: generateXML,
    generateHTML: generateHTML
}