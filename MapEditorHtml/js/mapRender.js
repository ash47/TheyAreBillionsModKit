function MapRenderer() {
	// The size of tiles in the image
	this.tileSize = 64;

	// A map of tilename --> image info
	this.tileMap = {};

	// Adds a source image
	this.tileSource = new Image();
	this.tileSource.src = 'img/tiles.png';

	this.cameraX = 0;
	this.cameraY = 0;

	this.viewWidth = 480;
	this.viewHeight = 320;
}

MapRenderer.prototype.addTile = function(tileName, squareX, squareY) {
	this.tileMap[tileName] = {
		sx: this.tileSize * squareX,
		sy: this.tileSize * squareY,
		sWitdh: this.tileSize,
		sHeight: this.tileSize
	};
};



// Create the map
window.map = new MapRenderer();
window.map.addTile('earth', 0, 0);
window.map.addTile('water', 1, 0);
