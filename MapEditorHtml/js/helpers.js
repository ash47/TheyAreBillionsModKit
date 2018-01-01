function loadSection(xmlData, startPoint, endPoint, editFunction, loopMatches, includeHeaders) {
	var firstMatchPos = null;

	// Infinite loop
	while(true) {
		// Grab the start chunk we were looking for
		var startPos = xmlData.indexOf(startPoint, firstMatchPos);
		if(startPos == -1) return xmlData;

		if(!includeHeaders) {
			startPos += startPoint.length;
		}

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
}

function loadLayer(layerName, commitUpdate) {
	// Edit layer
	var res = loadSection(
		window.activeMap.Data,
		'<Complex name="' + layerName + '">',
		'</Complex>',
		function(theData) {
			return loadSection(
				theData,
				'<Simple name="Cells" value="',
				'" />',
				function(theData2) {
					// Load it
					return loadLayerDirect(layerName, theData2, commitUpdate);
				}
			)
		}
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

function loadLayerDirect(layerName, layerData, commitUpdate) {
	var dataParts = layerData.split('|');
	if(dataParts.length != 3) {
		alertify.error('Unknown length for terrain layer -- ' + dataParts.length);
		return;
	}

	// Ensure there is a layer store
	window.layerStore[layerName] = window.layerStore[layerName] || {};
	var myLayer = window.layerStore[layerName];

	// Are we doing an update?
	if(commitUpdate) {
		// We are doing an update
		var base64Data = mapArrayToBase64(myLayer.data);
		return myLayer.width + '|' + myLayer.height + '|' + base64Data;
	} else {
		// Store the data
		myLayer.width = parseInt(dataParts[0]);
		myLayer.height = parseInt(dataParts[1]);
		myLayer.data = base64MapToArray(dataParts[2]);

		var toTest = mapArrayToBase64(myLayer.data);
	}
}

// Converts a base64 string into a 1d array that can be used in other functions
function base64MapToArray(data) {
	var buf = new buffer.Buffer(data, 'base64');

	// Map size info
	var intSize = 4;
	var totalData = Math.floor(buf.length / intSize);
	var outputArray = [];

	// Read in map
	for (var i = 0; i < totalData; i++) {
		outputArray[i] = buf.readUInt32LE(i * intSize);
	}

	return outputArray;
}

// Converts an array of image data to a base64 string
function mapArrayToBase64(someArray) {
	var intSize = 4;

	var buff = new buffer.Buffer(someArray.length * intSize);

	for(var i=0; i<someArray.length; ++i) {
		buff.writeUInt32LE(someArray[i], i * intSize);
	}

	return buff.toString('base64');
}

function getRBG(oldColor) {
	return 'rgba(' +
		oldColor.red + ', ' +
		oldColor.green + ', ' + 
		oldColor.blue + ', ' +
		(oldColor.alpha / 255) +
	')';
}

// Renders a terrain
function renderLayer(layerName) {
	var mapData = window.layerStore[layerName];

	// Grab the data
	var width = mapData.width;
	var height = mapData.height;

	// Grab the canvas
	var canvas = mapData.canvas;
	var ctx = canvas.getContext('2d');

	// Change the canvas's size
	canvas.width = width * window.pixelSize;
	canvas.height = height * window.pixelSize;

	// Popular the image based on the numbers from the files
	for(var y=0; y<height; ++y) {
		for(var x=0; x<width; ++x) {
			renderPixel(mapData, x, y);
		}
	}
}

// Renders a pixel
function renderPixel(mapData, x, y) {
	var canvas = mapData.canvas;
	var ctx = canvas.getContext('2d');

	var width = mapData.width;

	var mapPos = width * y + x;

	var theNumber = mapData.data[mapPos];
	var theColor = mapData.colorMap[theNumber] || mapData.defaultColor;

	var theX = (width - x - 1) * window.pixelSize;
	var theY = (y) * window.pixelSize;

	// Do we need to do a clear?
	if(theColor.alpha < 255) {
		ctx.clearRect(theX, theY, window.pixelSize, window.pixelSize);
	}

	ctx.fillStyle = getRBG(theColor);
	ctx.fillRect(theX, theY, window.pixelSize, window.pixelSize);
}

// Updates a pixel
function updatePixel(mapData, xReverse, y, theNumber) {
	var width = mapData.width;

	// do not allow invalid pixels to be updated
	if(x < 0 || x >= width || y < 0 || y >= mapData.height) return;

	// We need to convert xReverse into x
	var x = (width - xReverse - 1);

	// We need to grab the datastore position
	var mapPos = width * y + x;

	// Store it
	mapData.data[mapPos] = theNumber;

	// Re-render the canvas for this pixel
	renderPixel(mapData, x, y);

	// We are no longer up to date
	window.setMapExportUpToDate(false);
}

// Generates a checksum for a string
function generateChecksum(str) {
	var buff = new buffer.Buffer(str);

	var num = 0;

	for(var i = 0; i < buff.length; i++) {
		num += buff.readUInt8(i);

		// Handle overflow
		num = num % 4294967296;
	}
	
	return (num * 157 + num) % 4294967296;
}

function blobToBuffer(blob, callback) {
	if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
		throw new Error('first argument must be a Blob');
	}

	if (typeof callback !== 'function') {
		throw new Error('second argument must be a function');
	}

	var reader = new FileReader();

	function onLoadEnd (e) {
		reader.removeEventListener('loadend', onLoadEnd, false);
		if(e.error) {
			callback(e.error);
		} else {
			callback(null, buffer.Buffer.from(reader.result));
		}
	}

	reader.addEventListener('loadend', onLoadEnd, false);
	reader.readAsArrayBuffer(blob);
}

function replaceEntityProperty(entityXML, useReplace1, regexMatch1, regexMatch2, replace1, replace2) {
	var theRes = null;
	if(useReplace1) {
		theRes = replace1;
	} else {
		theRes = replace2;
	}

	if(regexMatch1 != null) entityXML = entityXML.replace(regexMatch1, theRes);
	if(regexMatch2 != null) entityXML = entityXML.replace(regexMatch2, theRes);

	return entityXML;
}

// Allows entities in the level to be edited
function loadLevelEntities(commitUpdate) {
	// Find the part we need to edit
	var res = loadSection(
		window.activeMap.Data,
		'<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">',
		/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>[\n\r ]*<\/Items>[\n\r ]*<\/Dictionary>/,
		function(theData) {
			// We need to break this into individual entities

			// Can we make changes?
			if(commitUpdate) {
				// We will use referenceData to build a new xmlData output

				var theOutput = '';
				theOutput += '<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">\n';
				theOutput += '<Items>\n';

				var totalEntities = 0;
				
				for(var entityType in window.layerStore.entities) {
					var allEntitiesOfThisType = window.layerStore.entities[entityType];
					for(var i=0; i<allEntitiesOfThisType.length; ++i) {
						var thisEntity = allEntitiesOfThisType[i];
						var thisXML = thisEntity.rawXML;

						var newEntityId = ++totalEntities;

						// Normal properties
						for(propertyName in thisEntity) {
							// Ignore these properties
							if(propertyName == 'Capacity') continue;
							if(propertyName == 'rawXML') continue;
							if(propertyName == 'ID') continue;
							if(propertyName == 'IDEntity') continue;

							var theValue = thisEntity[propertyName];
							if(theValue == null || theValue == "") {
								theValue = '<Null name="' + propertyName + '" />';
							} else {
								theValue = '<Simple name="' + propertyName + '" value="' + theValue + '" />';
							}

							// Replace the property
							thisXML = thisXML.replace(
								new RegExp('<Simple name="' + propertyName + '" value="[^"]*" \/>'),
								theValue
							);
						}

						// EntityId
						thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple value="[^"]*" \/>/,
							null,
							'<Simple value="' + newEntityId + '" />'
						);

						// EntityId again
						thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple name="ID" value="[^"]*" \/>/,
							null,
							'<Simple name="ID" value="' + newEntityId + '" />'
						);

						// Add the XML
						theOutput += thisXML;
					}
				}

				theOutput += '</Items>\n';
				theOutput += '</Dictionary>';

				return theOutput;
			}

			var allEntities = {};
			
			// This will edit every individual item in the map
			loadSection(
				theData,
				'<Item>',
				/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>/,
				function(thisItemData) {
					// Return an empty string from here to delete the entity!

					var entityType = (/<Complex type="([^"]*)">/.exec(thisItemData) || [])[1] || 'Unknown';

					allEntities[entityType] = allEntities[entityType] || [];

					/*var findEntityId = /<Simple[ ]*value="([^"]*)"[ ]*\/>/;
					var possibleEntityId = findEntityId.exec(thisItemData);
					if(possibleEntityId == null || possibleEntityId.length != 2) return;
					var entityId = possibleEntityId[1];*/

					var thisEntityStore = {};
					allEntities[entityType].push(thisEntityStore);

					var blackListedProps = {};

					var propertyExtractor = /<Simple name="([^"]*)" value="([^"]*)" \/>/g;
					var theMatch;
					while((theMatch = propertyExtractor.exec(thisItemData)) != null) {
						if(theMatch.length < 3) continue;

						// Grab stuff
						var propertyName = theMatch[1];
						var propertyValue = theMatch[2];

						// Is this blacklisted?
						if(blackListedProps[propertyName]) continue;

						// Have we already collected this prop?
						if(thisEntityStore[propertyName] != null) {
							// We are not touching this prop
							delete thisEntityStore[propertyName];
							blackListedProps[propertyName] = true;
							continue;
						}

						// Store it
						thisEntityStore[propertyName] = propertyValue;
					}

					// Add raw xml
					thisEntityStore.rawXML = thisItemData;
				}, true, true);

			// Store all the entities
			window.layerStore.entities = allEntities;
		}, false, true
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}