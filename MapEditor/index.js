const fs = require('fs');
const PNGImage = require('pngjs-image');
const NodeZip = require('node-zip');
const path = require('path');
const deasync = require('deasync');

const dirInput = path.join(__dirname, 'input');
const dirWorking = path.join(__dirname, 'working');
const dirOutput = path.join(__dirname, 'output');

// Data from a save file - from SerTerrainResourceCells
//var data = '' + fs.readFileSync('input.txt');

var colorNone = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 0
};

var colorWater = {
	red: 25,
	green: 25,
	blue: 112,
	alpha: 255
};

var colorEarth = {
	red: 245,
	green: 222,
	blue: 179,
	alpha: 255
};

var colorGrass = {
	red: 124,
	green: 252,
	blue: 0,
	alpha: 255
};

var colorStone = {
	red: 169,
	green: 169,
	blue: 169,
	alpha: 255
};

var colorIron = {
	red: 135,
	green: 206,
	blue: 250,
	alpha: 255
};

var colorOil = {
	red: 128,
	green: 0,
	blue: 128,
	alpha: 255
};

var colorGold = {
	red: 255,
	green: 215,
	blue: 0,
	alpha: 255
};

var colorRoad = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 255
};

var colorWood = {
	red: 0,
	green: 100,
	blue: 0,
	alpha: 255
};

var colorMountain = {
	red: 0,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorSky = {
	red: 30,
	green: 144,
	blue: 255,
	alpha: 255
};

var colorAbyse = {
	red: 255,
	green: 69,
	blue: 0,
	alpha: 255
};

var colorDefault = {
	red: 255,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorObject = {
	0: colorNone,
	1: colorMountain,
	2: colorWood,
	3: colorGold,
	4: colorStone,
	5: colorIron
};

var colorTerrain = {
	0: colorEarth,
	1: colorWater,
	2: colorGrass,
	3: colorSky,
	4: colorAbyse
};

var colorSerTerrain = {
	0: colorNone,
	10: colorWater,
	20: colorEarth,
	30: colorGrass,
	40: colorStone,
	50: colorIron,
	60: colorOil,
	70: colorGold,
	80: colorRoad,
	90: colorWood,
	100: colorMountain
};

// Creates a directory if it doesn't exist
function ensureDirectoryExists(dir) {
	try {
		fs.mkdirSync(dir);
	} catch(e) {
		// do nothing
	}
}

// Ensure we have all our dirs
ensureDirectoryExists(dirInput);
ensureDirectoryExists(dirWorking);
ensureDirectoryExists(dirOutput);

/*var possibleColors = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
var inverseColors = possibleColors.map(function(a) {
	return getColorTerrain(a);
});*/

// Create an image
/*var image = PNGImage.createImage(256, 256);

// Popular the image based on the numbers from the files
for(var y=0; y<mapSize; ++y) {
	for(var x=0; x<mapSize; ++x) {
		var mapPos = mapSize * y + x;

		var theNumber = outputArray[mapPos];
		var theColor = getColorTerrain(theNumber);

		image.setAt(x, y, theColor);
	}
}

// Store the image
image.writeImage('test.png', function (err) {
    if (err) throw err;
    console.log('Written to the file');
});*/


/*PNGImage.readImage('map2.png', function (err, image) {
    if (err) throw err;
 
 	var totalSize = mapSize * mapSize * 4;
    var array = new Buffer(totalSize);

    for(var y=0; y<mapSize; ++y) {
		for(var x=0; x<mapSize; ++x) {
			var mapPos = mapSize * y + x;

			var theIndex = image.getIndex(x, y);
			var theColor = {
				red: image.getRed(theIndex),
				green: image.getGreen(theIndex),
				blue: image.getBlue(theIndex),
				alpha: image.getAlpha(theIndex)
			}

			var theirRealColor = getColorInverse(theColor);

			var writePos = Math.floor(mapPos * 4);
			array.writeUInt32LE(theirRealColor, writePos);
		}
	}

	// Convert to base64
	var theOutput = array.toString('base64');

	fs.writeFile('custommap.txt', theOutput, function(err) {
		if(err) {
			console.log(err);
		}

		console.log('all good!');
	});
});*/

// Converts a base64 string into a 1d array that can be used in other functions
function base64MapToArray(data) {
	var buf = new Buffer(data, 'base64');

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

// Converts a 1d array + size information into an image
function mapArrayToImage(dataArray, dataWidth, dataHeight, dataMapObject) {
	var image = PNGImage.createImage(dataWidth, dataHeight);

	// Popular the image based on the numbers from the files
	for(var y=0; y<dataHeight; ++y) {
		for(var x=0; x<dataWidth; ++x) {
			var mapPos = dataWidth * y + x;

			var theNumber = dataArray[mapPos];
			var theColor = dataMapObject[theNumber] || colorDefault;

			image.setAt(dataWidth - x, y, theColor);
		}
	}

	return image;
}

// Converts an image to a 1d array format
function mapImageToBase64(dataImage, dataMapObject) {
	var dataWidth = dataImage.getWidth();
	var dataHeight = dataImage.getHeight();

	var totalSize = dataWidth * dataHeight * 4;
    var outputStorage = new Buffer(totalSize);

	for(var y=0; y<dataHeight; ++y) {
		for(var x=0; x<dataWidth; ++x) {
			var mapPos = dataWidth * y + x;

			var theColorPos = dataImage.getIndex(dataWidth - x, y);
			var theColor = {
				red: dataImage.getRed(theColorPos),
				green: dataImage.getGreen(theColorPos),
				blue: dataImage.getBlue(theColorPos),
				alpha: dataImage.getAlpha(theColorPos)
			};

			var theColorNumber = getColorInverse(theColor, dataMapObject);

			var writePos = Math.floor(mapPos * 4);
			outputStorage.writeUInt32LE(theColorNumber, writePos);
		}
	}
	
	return outputStorage.toString('base64');
}

function getColorInverse(theirColor, theColorObject) {
	var maxDifference = 9999;
	var closestColor = 0;

	for(var colorNumber in theColorObject) {
		var inverseColor = theColorObject[colorNumber];

		var difference = getColorDifference(theirColor, inverseColor);

		if(difference < maxDifference) {
			maxDifference = difference;
			closestColor = colorNumber;
		}
	}

	return closestColor;
}

function getColorDifference(color1, color2) {
	return (
		Math.abs(color1.red - color2.red) + 
		Math.abs(color1.green - color2.green) + 
		Math.abs(color1.blue - color2.blue) + 
		Math.abs(color1.alpha - color2.alpha)
	);
}

function getClosestColor(theirColor, theColorObject, maxDifference, colorDefault) {
	var closestColor = colorDefault;

	if(maxDifference == null) {
		maxDifference = 9999;
	}

	for(var key in theColorObject) {
		var possibleColor = theColorObject[key];

		var difference = getColorDifference(possibleColor, theirColor);

		if(difference <= maxDifference) {
			maxDifference = difference;
			closestColor = possibleColor;
		}
	}

	return closestColor;
}

function readImageSync(fileLocation) {
	var toReturn = null;

	PNGImage.readImage(fileLocation, function (err, image) {
	    if (err) throw err;

	    toReturn = image;
	});

	while(toReturn == null) {
		deasync.sleep(1);
	}

	return toReturn;
}

function mergeImages(baseFilename, overlayFilename, newFilename) {
	var baseFile = readImageSync(baseFilename);
	var overlayFile = readImageSync(overlayFilename);

	var newImage = PNGImage.copyImage(baseFile);

	// Ensure we loaded the files
	if(baseFile == null || overlayFile == null) return;

	var imageWidth = baseFile.getWidth();
	var imageHeight = baseFile.getHeight();

	for(var y=0; y<imageHeight; ++y) {
		for(var x=0; x<imageWidth; ++x) {
			var possibleColorIndex = overlayFile.getIndex(x, y);
			var theColor = {
				red: overlayFile.getRed(possibleColorIndex),
				green: overlayFile.getGreen(possibleColorIndex),
				blue: overlayFile.getBlue(possibleColorIndex),
				alpha: overlayFile.getAlpha(possibleColorIndex)
			};

			// Is there nothing here?
			if(theColor.alpha > 0) {
				newImage.setAt(x, y, theColor);
			}
		}
	}

	var done = false;

	newImage.writeImage(newFilename, function(err) {
		if(err) throw err;

		console.log('wrote merged image');

		done = true;
	});

	while(!done) {
		deasync.sleep(1);
	}

	return newImage;
}

// Unmerged images
function unmergeImages(mergedImageFilename, imageProps) {
	// Ensure there is something to actually unmerge
	if(!fs.existsSync(mergedImageFilename)) return;

	// Read in the image
	var mergedImage = readImageSync(mergedImageFilename);

	var dataWidth = mergedImage.getWidth();
	var dataHeight = mergedImage.getHeight();

	var outputImage = PNGImage.createImage(dataWidth, dataHeight);

	for(var y=0; y<dataHeight; ++y) {
		for(var x=0; x<dataWidth; ++x) {
			var theColorIndex = mergedImage.getIndex(x, y);

			var theColor = {
				red: mergedImage.getRed(theColorIndex),
				green: mergedImage.getGreen(theColorIndex),
				blue: mergedImage.getBlue(theColorIndex),
				alpha: mergedImage.getAlpha(theColorIndex)
			};

			var newColor = getClosestColor(theColor, imageProps.objectMap, 0, imageProps.bg);

			outputImage.setAt(x, y, newColor);
		}
	}

	outputImage.writeImage(imageProps.file, function(err) {
		if(err) throw err;
	});
}

// Processes a save file
function processSaveFile(fileName) {
	const dirMyWorking = path.join(dirWorking, fileName);
	ensureDirectoryExists(dirMyWorking);

	var theData = fs.readFileSync(path.join(dirInput, fileName));

	var zip = new NodeZip(theData, {
		base64: false,
		checkCRC32: true
	});

	// Attempt to merge layers
	const mergedFileName = path.join(dirMyWorking, 'merged.png');
	const mergedFileName2 = path.join(dirMyWorking, 'merged2.png');
	const terrainFileName = path.join(dirMyWorking, 'terrain.png');
	const objectFileName = path.join(dirMyWorking, 'object.png');

	// Attempt an unmerge
	unmergeImages(mergedFileName2, {
		file: terrainFileName,
		objectMap: colorTerrain,
		bg: colorEarth
	});

	unmergeImages(mergedFileName2, {
		file: objectFileName,
		objectMap: colorObject,
		bg: colorNone
	});

	var xmlData = zip.files.Data.asText();
	xmlData = editLayer(dirMyWorking, xmlData, 'LayerTerrain', 'terrain.png', colorTerrain);
	xmlData = editLayer(dirMyWorking, xmlData, 'LayerObjects', 'object.png', colorObject);
	//xmlData = editLayer(dirMyWorking, xmlData, 'LayerZombies', 'object.png', colorObject);

	// Merge the images, used in ser terrain gen
	var mergedImage = mergeImages(
		terrainFileName,
		objectFileName,
		mergedFileName
	);

	// Copy merged image in
	xmlData = editLayerSer(dirMyWorking, xmlData, 'SerTerrainResourceCells', 'merged.png', colorSerTerrain);

	zip.file('Data', xmlData);
	var toWrite = zip.generate({
		base64:false,
		compression:'DEFLATE'
	});

	// Store it
	fs.writeFileSync(path.join(dirOutput, fileName), toWrite, 'binary');

	// Store checksum
	var checksum = generateChecksum(toWrite);
	fs.writeFileSync(path.join(dirOutput, path.basename(fileName, '.zxsav') + '.zxcheck'), checksum);
}

// Generates a checksum for a string
function generateChecksum(str) {
	var buff = new Buffer(str);

	var num = 0;

	for(var i = 0; i < buff.length; i++) {
		num += buff.readUInt8(i);
	}
	
	return num * 157 + num;
}

function editLayer(workingDir, xmlData, layerText, layerFileName, objectMap) {
	// Edit layer
	return editSection(
		xmlData,
		'<Complex name="' + layerText + '">',
		'</Complex>',
		function(theData) {
			return editSection(
				theData,
				'<Simple name="Cells" value="',
				'" />',
				function(theData2) {
					return editLayerDirect(workingDir, theData2, layerFileName, objectMap);
				}
			)
		}
	);
}

function editLayerSer(workingDir, xmlData, layerText, layerFileName, objectMap) {
	// Edit layer
	return editSection(
		xmlData,
		'<Simple name="' + layerText + '" value="',
		'" />',
		function(theData) {
			return editLayerDirect(workingDir, theData, layerFileName, objectMap);
		}
	);
}

function editLayerDirect(workingDir, theData2, layerFileName, objectMap) {
	var dataParts = theData2.split('|');
	if(dataParts.length != 3) {
		console.log('Unknown length for terrain layer -- ' + dataParts.length);
		return;
	}

	var myFileName = path.join(workingDir, layerFileName);

	if(fs.existsSync(myFileName)) {
		// File exists, read in the array
		var dataImage = readImageSync(myFileName);
		var theWidth = dataImage.getWidth();
		var theHeight = dataImage.getHeight();

		var base64Data = mapImageToBase64(dataImage, objectMap);
		return theWidth + '|' + theHeight + '|' + base64Data;
	} else {
		// File does not exist
		var sizeWidth = parseInt(dataParts[0]);
		var sizeHeight = parseInt(dataParts[1]);

		// Load in the data array
		var dataArray = base64MapToArray(dataParts[2]);
		var dataImage = mapArrayToImage(dataArray, sizeWidth, sizeHeight, objectMap);

		dataImage.writeImage(myFileName, function (err) {
		    if (err) throw err;
		    console.log('Written to the file');
		});
	}
}

function editSection(xmlData, startPoint, endPoint, editFunction) {
	// Grab the start chunk we were looking for
	var startPos = xmlData.indexOf(startPoint);
	if(startPos == -1) return xmlData;
	startPos += startPoint.length;

	// Grab the end chunk we were looking for
	var endPos = xmlData.indexOf(endPoint, startPos);
	if(endPoint == -1) return xmlData;

	// Grab the data we wanted to edit
	var toEditData = xmlData.substring(startPos, endPos);

	// Attempt an edit
	var possibleReturn = editFunction(toEditData);
	if(possibleReturn != null) {
		// There was a change, merge the change
		return xmlData.substring(0, startPos) + possibleReturn + xmlData.substring(endPos);
	} else {
		// There was no change, return original data
		return xmlData;
	}
}

processSaveFile('challenge01.zxsav');
