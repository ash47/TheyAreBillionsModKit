const fs = require('fs');
const PNGImage = require('pngjs-image');

// Data from a save file - from SerTerrainResourceCells
var data = '' + fs.readFileSync('input.txt');
var buf = new Buffer(data, 'base64');

// Map size info
var intSize = 4;
var mapSize = 512;
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
		case 0:
			return {
				red: 255,
				green: 255,
				blue: 255,
				alpha: 0
			};
		break;

		// Sea
		case 10:
			return {
				red: 0,
				green: 0,
				blue: 255,
				alpha: 255
			};
		break;

		// Earth
		case 20:
			return {
				red: 255,
				green: 255,
				blue: 0,
				alpha: 255
			};
		break;

		// Grass
		case 30:
			return {
				red: 0,
				green: 255,
				blue: 0,
				alpha: 255
			};
		break;

		// Stone
		case 40:
			return {
				red: 50,
				green: 50,
				blue: 50,
				alpha: 255
			};
		break;

		// Iron
		case 50:
			return {
				red: 150,
				green: 150,
				blue: 150,
				alpha: 255
			};
		break;

		// Oil
		case 60:
			return {
				red: 255,
				green: 0,
				blue: 255,
				alpha: 255
			};
		break;

		// Gold
		case 70:
			return {
				red: 255,
				green: 255,
				blue: 0,
				alpha: 255
			};
		break;

		// Road
		case 80:
			return {
				red: 255,
				green: 255,
				blue: 255,
				alpha: 255
			};
		break;

		// Wood
		case 90:
			return {
				red: 139,
				green: 69,
				blue: 19,
				alpha: 255
			};
		break;

		// Mountain
		case 100:
			return {
				red: 0,
				green: 0,
				blue: 0,
				alpha: 255
			};
		break;
	}
}

// Create an image
var image = PNGImage.createImage(512, 512);

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
