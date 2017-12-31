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
		dataObject.layers[dataObject.layerName] = {
			width: sizeWidth,
			height: sizeHeight,
			data: dataArray
		};

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
function renderLayer(dataObject) {
	var canvas = dataObject.canvas;
	var ctx = canvas.getContext('2d');

	// Grab the data
	var colorMap = dataObject.colorMap;
	var colorDefault = dataObject.defaultColor;
	var pixelSize = dataObject.pixelSize;

	var mapData = dataObject.data;
	var width = mapData.width;
	var height = mapData.height;
	var rawData = mapData.data;

	// Change the canvas's size
	canvas.width = width * pixelSize;
	canvas.height = height * pixelSize;

	var seen = {}

	// Popular the image based on the numbers from the files
	for(var y=0; y<height; ++y) {
		for(var x=0; x<width; ++x) {
			var mapPos = width * y + x;

			var theNumber = rawData[mapPos];
			var theColor = colorMap[theNumber] || colorDefault;

			var theX = (width - x) * pixelSize;
			var theY = (y) * pixelSize;

			ctx.fillStyle = getRBG(theColor);
			ctx.fillRect(theX, theY, pixelSize, pixelSize);
		}
	}
}