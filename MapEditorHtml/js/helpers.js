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

function loadLayer(dataObject) {
	// Edit layer
	return loadSection(
		dataObject.data,
		'<Complex name="' + dataObject.layerName + '">',
		'</Complex>',
		function(theData) {
			return loadSection(
				theData,
				'<Simple name="Cells" value="',
				'" />',
				function(theData2) {
					// Store the raw data
					dataObject.rawData = theData2;

					// Load it
					return loadLayerDirect(dataObject);
				}
			)
		}
	);
}

function loadLayerDirect(dataObject) {
	var dataParts = dataObject.rawData.split('|');
	if(dataParts.length != 3) {
		alertify.error('Unknown length for terrain layer -- ' + dataParts.length);
		return;
	}

	/*var myFileName = path.join(workingDir, layerFileName);

	if(fs.existsSync(myFileName)) {
		// File exists, read in the array
		var dataImage = readImageSync(myFileName);
		var theWidth = dataImage.getWidth();
		var theHeight = dataImage.getHeight();

		var base64Data = mapImageToBase64(dataImage, objectMap);
		return theWidth + '|' + theHeight + '|' + base64Data;
	} else {*/
		// File does not exist
		var sizeWidth = parseInt(dataParts[0]);
		var sizeHeight = parseInt(dataParts[1]);

		// Load in the data array
		var dataArray = base64MapToArray(dataParts[2]);

		// Ensure there is a layer store
		dataObject.layers = dataObject.layers || {};
		dataObject.layers[dataObject.layerName] = dataObject.layers[dataObject.layerName] || {};

		var myLayer = dataObject.layers[dataObject.layerName];
		myLayer.width = sizeWidth;
		myLayer.height = sizeHeight;
		myLayer.data = dataArray;

		/*var dataImage = mapArrayToImage(dataArray, sizeWidth, sizeHeight, objectMap);

		dataImage.writeImage(myFileName, function (err) {
		    if (err) throw err;
		    console.log('Written to the file');
		});*/
	//}
}

// Converts a base64 string into a 1d array that can be used in other functions
function base64MapToArray(data) {
	var buf = new buffer.Buffer(data, 'base64');

	// Map size info
	var intSize = 4;
	var totalData = buf.length / intSize;
	var outputArray = [];

	// Read in map
	for (var i = 0; i < totalData; i++) {
		outputArray[i] = buf.readUInt32LE(i * intSize);
	}

	return outputArray;
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
function renderLayer(mapData) {
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
	var theColor = mapData.colorMap[theNumber] || mapData.colorDefault;

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

	// We need to convert xReverse into x
	var x = (width - xReverse - 1);

	// We need to grab the datastore position
	var mapPos = width * y + x;

	// Store it
	mapData.data[mapPos] = theNumber;

	// Re-render the canvas for this pixel
	renderPixel(mapData, x, y);
}