const fs = require('fs');
const PNGImage = require('pngjs-image');

// Data from a save file - from SerTerrainResourceCells
var data = '' + fs.readFileSync('input.txt');
var buf = new Buffer(data, 'base64');

// Map size info
var intSize = 4;
var mapSize = 256;
var totalData = buf.length / intSize;
var outputArray = [];

// Read in map
for (var i = 0; i < totalData; i++) {
	outputArray[i] = buf.readUInt32LE(i * intSize);
}

// Returns a color based on the numbers stored in the map file
function getColor(colorNumber) {
	switch(colorNumber) {
		// None
		case undefined:
		case 0:
			return {
				red: 255,
				green: 255,
				blue: 255,
				alpha: 0
			};
		break;

		// Sea - MidNightBlue
		case 10:
			return {
				red: 25,
				green: 25,
				blue: 112,
				alpha: 255
			};
		break;

		// Earth - Wheat
		case 20:
			return {
				red: 245,
				green: 222,
				blue: 179,
				alpha: 255
			};
		break;

		// Grass - LawnGreen
		case 30:
			return {
				red: 124,
				green: 252,
				blue: 0,
				alpha: 255
			};
		break;

		// Stone - Dark Gray
		case 40:
			return {
				red: 169,
				green: 169,
				blue: 169,
				alpha: 255
			};
		break;

		// Iron - LightSkyBlue
		case 50:
			return {
				red: 135,
				green: 206,
				blue: 250,
				alpha: 255
			};
		break;

		// Oil - Purple
		case 60:
			return {
				red: 128,
				green: 0,
				blue: 128,
				alpha: 255
			};
		break;

		// Gold - Gold
		case 70:
			return {
				red: 255,
				green: 215,
				blue: 0,
				alpha: 255
			};
		break;

		// Road - White
		case 80:
			return {
				red: 255,
				green: 255,
				blue: 255,
				alpha: 255
			};
		break;

		// Wood - Dark Green
		case 90:
			return {
				red: 0,
				green: 100,
				blue: 0,
				alpha: 255
			};
		break;

		// Mountain - Black
		case 100:
			return {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 255
			};
		break;

		// Unknown Color
		default:
			console.log('Unknown color: ' + colorNumber);
		break;
	}
}

var possibleColors = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
var inverseColors = possibleColors.map(function(a) {
	return getColor(a);
});

function getColorInverse(theirColor) {
	var maxDifference = 9999;
	var closestColor = 0;

	for(var i=0; i<possibleColors.length; ++i) {
		var possibleColor = possibleColors[i];
		var inverseColor = inverseColors[i];

		var difference = 
			Math.abs(theirColor.red - inverseColor.red) + 
			Math.abs(theirColor.green - inverseColor.green) + 
			Math.abs(theirColor.blue - inverseColor.blue) + 
			Math.abs(theirColor.alpha - inverseColor.alpha);

		if(difference < maxDifference) {
			maxDifference = difference;
			closestColor = possibleColors[i];
		}
	}

	return closestColor;
}

// Create an image
var image = PNGImage.createImage(256, 256);

// Popular the image based on the numbers from the files
for(var y=0; y<mapSize; ++y) {
	for(var x=0; x<mapSize; ++x) {
		var mapPos = mapSize * y + x;

		var theNumber = outputArray[mapPos];
		var theColor = getColor(theNumber);

		image.setAt(x, y, theColor);
	}
}

// Store the image
image.writeImage('test.png', function (err) {
    if (err) throw err;
    console.log('Written to the file');
});


PNGImage.readImage('map2.png', function (err, image) {
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
});