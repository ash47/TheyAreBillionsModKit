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

var colorZombieNone = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 0
};

var colorZombieWeak1 = {	// Light green
	red: 144,
	green: 238,
	blue: 144,
	alpha: 255
};

var colorZombieWeak2 = {	// Lime
	red: 0,
	green: 255,
	blue: 0,
	alpha: 255
};

var colorZombieWeak3 = {	// Green
	red: 0,
	green: 128,
	blue: 0,
	alpha: 255
};

var colorZombieMedium1 = {	// Light Yellow
	red: 255,
	green: 255,
	blue: 153,
	alpha: 255
};

var colorZombieMedium2 = {	// Yellow
	red: 255,
	green: 255,
	blue: 0,
	alpha: 255
};

var colorZombieMedium3 = {	// Yellow
	red: 204,
	green: 204,
	blue: 0,
	alpha: 255
};

var colorZombieStrong1 = {	// Orange
	red: 255,
	green: 165,
	blue: 0,
	alpha: 255
};

var colorZombieStrong2 = {	// Coral
	red: 255,
	green: 127,
	blue: 80,
	alpha: 255
};

var colorZombieStrong3 = {	// Orange Red
	red: 255,
	green: 69,
	blue: 0,
	alpha: 255
};

var colorZombiePowerful1 = {	// Red
	red: 255,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorZombiePowerful2 = {	// Crimson
	red: 220,
	green: 20,
	blue: 60,
	alpha: 255
};

var colorZombieUltra1 = {	// Dark Red
	red: 139,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorZombies = {
	0: colorZombieNone,
	1: colorZombieWeak1,
	2: colorZombieWeak2,
	3: colorZombieWeak3,
	4: colorZombieMedium1,
	5: colorZombieMedium2,
	6: colorZombieMedium3,
	7: colorZombieStrong1,
	8: colorZombieStrong2,
	9: colorZombieStrong3,
	10: colorZombiePowerful1,
	11: colorZombiePowerful2,
	12: colorZombieUltra1
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
	console.log('Processing save file: ' + fileName);
	console.log('Opening save file...');

	const dirMyWorking = path.join(dirWorking, fileName);
	ensureDirectoryExists(dirMyWorking);

	var theData = fs.readFileSync(path.join(dirInput, fileName));

	var zip = new NodeZip(theData, {
		base64: false,
		checkCRC32: true
	});

	console.log('Save file opened! Reading data...');

	// Grab the data
	var xmlData = zip.files.Data.asText();

	console.log('Data was read!');

	// Extract entities
	xmlData = editLevelEntities(dirMyWorking, xmlData);

	// Attempt to merge layers
	const mergedFileName = path.join(dirMyWorking, 'merged.png');
	const mergedFileName2 = path.join(dirMyWorking, 'merged2.png');
	const terrainFileName = path.join(dirMyWorking, 'terrain.png');
	const objectFileName = path.join(dirMyWorking, 'object.png');

	console.log('Attempting to perform map unmerging...');

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

	console.log('Map unmerging complete!');
	console.log('Editing various layers...');

	xmlData = editLayer(dirMyWorking, xmlData, 'LayerTerrain', 'terrain.png', colorTerrain);
	xmlData = editLayer(dirMyWorking, xmlData, 'LayerObjects', 'object.png', colorObject);
	xmlData = editLayer(dirMyWorking, xmlData, 'LayerZombies', 'zombies.png', colorZombies);

	console.log('Layers successfully edited!');
	console.log('Merging images...');

	// Merge the images, used in ser terrain gen
	var mergedImage = mergeImages(
		terrainFileName,
		objectFileName,
		mergedFileName
	);

	// Copy merged image in
	xmlData = editLayerSer(dirMyWorking, xmlData, 'SerTerrainResourceCells', 'merged.png', colorSerTerrain);

	console.log('Done merging images!');
	console.log('Generating save file...');

	zip.file('Data', xmlData);
	var toWrite = zip.generate({
		base64:false,
		compression:'DEFLATE'
	});

	console.log('Save file generated! Saving to disk...');

	// Store it
	fs.writeFileSync(path.join(dirOutput, fileName), toWrite, 'binary');

	// Store checksum
	var checksum = generateChecksum(toWrite);
	fs.writeFileSync(path.join(dirOutput, path.basename(fileName, '.zxsav') + '.zxcheck'), checksum);

	console.log('Save file written to disk!');
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

function editSection(xmlData, startPoint, endPoint, editFunction, loopMatches, includeHeaders) {
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
function editLevelEntities(workingDir, xmlData) {
	console.log('Loading entities...');

	return editSection(
		xmlData,
		'<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">',
		/<\/Items>[\n\r ]*<\/Dictionary>/,
		function(theData) {
			// We need to break this into individual entities

			console.log('Done loading entites, making changes...');

			// Dump the entity map
			var myFileName = path.join(workingDir, 'entities.json');

			var referneceData = null;
			if(fs.existsSync(myFileName)) {
				try {
					referneceData = require(myFileName);
				} catch(e) {
					// Failure, log it
					console.log('Failed to read input entity file:');
					console.log(myFileName);
				}
			}

			// Can we make changes?
			if(referneceData != null) {
				// We will use referenceData to build a new xmlData output

				var theOutput = '';
				theOutput += '<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">\n';
				theOutput += '<Items>\n';
				
				for(entityId in referneceData) {
					var thisEntity = referneceData[entityId];
					var thisXML = thisEntity.rawXML;

					// Normal properties
					for(propertyName in thisEntity) {
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
						'<Simple value="' + entityId + '" />'
					);

					// EntityId again
					thisXML = replaceEntityProperty(
						thisXML,
						true,
						/<Simple name="ID" value="[^"]*" \/>/,
						null,
						'<Simple name="ID" value="' + entityId + '" />'
					);

					// Add the XML
					theOutput += thisXML;
				}

				theOutput += '</Items>\n';
				theOutput += '</Dictionary>';

				console.log('Done importing entity changes!');

				return theOutput;
			}

			var allEntities = {};
			
			// This will edit every individual item in the map
			var toReturn = editSection(
				theData,
				'<Item>',
				/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>/,
				function(thisItemData) {
					// Return an empty string from here to delete the entity!

					var findEntityId = /<Simple[ ]*value="([^"]*)"[ ]*\/>/;
					var possibleEntityId = findEntityId.exec(thisItemData);
					if(possibleEntityId == null || possibleEntityId.length != 2) return;
					var entityId = possibleEntityId[1];

					allEntities[entityId] = {
						Type: (/<Complex type="([^"]*)">/.exec(thisItemData) || [])[1]
					}

					var thisEntityStore = allEntities[entityId];

					var propertyExtractor = /<Simple name="([^"]*)" value="([^"]*)" \/>/g;
					var theMatch;
					while((theMatch = propertyExtractor.exec(thisItemData)) != null) {
						if(theMatch.length < 3) continue;

						// Grab stuff
						var propertyName = theMatch[1];
						var propertyValue = theMatch[2];

						// Store it
						thisEntityStore[propertyName] = propertyValue;
					}

					// Add raw xml
					thisEntityStore.rawXML = thisItemData;
				}, true, true);

			console.log('Done making entity changes, saving...');

			fs.writeFileSync(myFileName, JSON.stringify(allEntities, null, 4));

			// Return it
			return toReturn;
		}, false, true
	)
}

processSaveFile('SageePrime.zxsav');
