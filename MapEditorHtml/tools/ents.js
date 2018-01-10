var fs = require('fs');

function loadSection(xmlData, startPoint, endPoint, editFunction, loopMatches, includeHeaders) {
	var firstMatchPos = null;

	// Infinite loop
	while(true) {
		// Grab the start chunk we were looking for
		var startPos = -1;
		if(typeof(startPoint) == 'string') {
			startPos = xmlData.indexOf(startPoint, firstMatchPos);
			if(startPos == -1) return xmlData;

			if(!includeHeaders) {
				startPos += startPoint.length;
			}
		} else {
			if(typeof(startPoint.exec) == 'function') {
				var match = startPoint.exec(xmlData.substr(firstMatchPos));

				if(match && match.index != -1) {
					startPos = match.index + firstMatchPos;

					if(!includeHeaders) {
						startPos += match[0].length;
					}
				}
			}
		}

		if(startPos == -1) return xmlData;

		// Grab the end chunk we were looking for
		var endPos = -1;
		if(typeof(endPoint) == 'string') {
			endPos = xmlData.indexOf(endPoint, startPos);

			if(includeHeaders) {
				endPos += endPoint.length;
			}
		} else {
			if(typeof(endPoint.exec) == 'function') {
				var match = endPoint.exec(xmlData.substr(startPos));

				if(match && match.index != -1) {
					endPos = match.index + startPos;

					if(includeHeaders) {
						endPos += match[0].length;
					}
				}
			}
		}
		
		if(endPos == -1) return xmlData;

		// Grab the data we wanted to edit
		var toEditData = xmlData.substring(startPos, endPos);

		// Attempt an edit
		var possibleReturn = editFunction(toEditData);
		if(possibleReturn != null) {
			// There was a change, merge the change
			xmlData = xmlData.substring(0, startPos) + possibleReturn + xmlData.substring(endPos);
		}

		// Are we going to continue looping and find more matches?
		if(!loopMatches) {
			// Nope, return the modified data
			return xmlData;
		}

		// Store where this match was
		firstMatchPos = endPos;
	}
};

var allEnts = {};

var theData = '' + fs.readFileSync('allents.xml');


loadSection(
	theData,
	'<Item>',
	/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>/,
	function(thisItemData) {
		var entityType = (/<Complex type="([^"]*)">/.exec(thisItemData) || [])[1] || 'Unknown';
		if(entityType == 'Unknown') return;

		entityType = entityType.split(',')[0];

		if(allEnts[entityType] == null) {
			allEnts[entityType] = thisItemData;
		}
	}, 
true, true);

fs.writeFileSync('allents.js', 'window.entityTemplates = ' + JSON.stringify(allEnts, null, 4));
