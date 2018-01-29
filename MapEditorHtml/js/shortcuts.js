/*
	Map Panning
*/

function moveView(direction) {
	var conMap = $('#mapDisplayHolder');

	var scrollTop = conMap.scrollTop();
	var scrollLeft = conMap.scrollLeft();

	var speed = 4 * window.zoomFactor;

	if(direction == 'left') {
		conMap.scrollLeft(scrollLeft - speed);
	} else if (direction == 'right') {
		conMap.scrollLeft(scrollLeft + speed);
	} else if(direction == 'up') {
		conMap.scrollTop(scrollTop - speed);
	} else if(direction == 'down') {
		conMap.scrollTop(scrollTop + speed);
	}
}

function addMovementBinding(key, direction) {
	$(document).bind('keydown', key, function() {
		if(!window.mapIsLoaded) return;

		moveView(direction);

		return false;
	});
}

(function() {
	var movementBindings = {
		'left': 'left',
		'right': 'right',
		'up': 'up',
		'down': 'down',
		'a': 'left',
		'd': 'right',
		'w': 'up',
		's': 'down'
	}

	for(var key in movementBindings) {
		addMovementBinding(key, movementBindings[key]);
	}
})();

/*
	Zooming into mouse
*/

function zoomIntoMouse(zoomAdjustFactor) {
	// Adjust the map zoom
	var newZoom = window.zoomFactor + zoomAdjustFactor;

	// Update the input box value
	$('#mapZoom').val(newZoom);

	// Update the map zoom
	window.updateMapZoom();

	// Adjust to centre in on the mouse

}

function addZoomBinding(key, mode) {
	$(document).bind('keydown', key, function() {
		if(!window.mapIsLoaded) return;

		zoomIntoMouse(mode);

		return false;
	});
}

(function() {
	var zoomBindings = {
		'q': 'zoomOut',
		'e': 'zoomIn',
		'-': 'zoomOut',
		'=': 'zoomIn'
	};

	for(var key in zoomBindings) {
		var zoomInScale = 1;
		if(zoomBindings[key] == 'zoomOut') {
			zoomInScale = -1;
		}
		addZoomBinding(key, zoomInScale);
	}
})();

/*
	Undo & Redo
*/

$(document).bind('keydown', 'ctrl+z', function() {
	if(!window.mapIsLoaded) return;

	window.executeUndo();

	return false;
});

$(document).bind('keydown', 'ctrl+y', function() {
	if(!window.mapIsLoaded) return;

	window.executeRedo();

	return false;
});

/*
	Saving
*/

$(document).bind('keydown', 'ctrl+s', function() {
	if(!window.mapIsLoaded) return;

	window.saveMap();

	return false;
});

/*
	Loading
*/

$(document).bind('keydown', 'ctrl+o', function() {
	// Try to load a file
	$('#file').click();

	return false;
});

/*
	Brush Sizes
*/

$(document).bind('keydown', '[', function() {
	if(!window.mapIsLoaded) return;

	var newBrushSize = window.brushSize - 1;
	if(newBrushSize <= 1) {
		newBrushSize = 1;
	}

	// Store the new brush size
	$('#brushSize').val(newBrushSize);

	// Try to update it
	window.updateBrushSize();

	return false;
});

$(document).bind('keydown', ']', function() {
	if(!window.mapIsLoaded) return;

	var newBrushSize = window.brushSize + 1;

	// Store the new brush size
	$('#brushSize').val(newBrushSize);

	// Try to update it
	window.updateBrushSize();

	return false;
});

/*
	Resources
*/

function addBrushShortcut(key, newBrush) {
	$(document).bind('keydown', key, function() {
		if(!window.mapIsLoaded) return;

		// Set the tool
		window.setTool('brushColor', newBrush)

		return false;
	});
}

(function() {
	var brushColors = {
		'shift+e': 'toolTerrainEarth',
		'shift+w': 'toolTerrainWater',
		'shift+r': 'toolTerrainGrass',
		'shift+k': 'toolTerrainSky',
		'shift+a': 'toolTerrainAbyse',

		'shift+n': 'toolObjectNone',
		'shift+m': 'toolObjectMountain',
		'shift+o': 'toolObjectWood',
		'shift+g': 'toolObjectGold',
		'shift+t': 'toolObjectStone',
		'shift+i': 'toolObjectIron'
	};

	for(var key in brushColors) {
		addBrushShortcut(key, brushColors[key]);
	}
})();
