"use strict";

$(document).ready(function() {
	function setIsLoading(isLoading) {
		var mainCon = $('#mainContainer');

		if(isLoading) {
			mainCon.addClass('isLoading');
		} else {
			mainCon.removeClass('isLoading');
		}
	}

	var mapRenderTerrainCanvas = document.getElementById('mapRenderTerrain');
	var mapRenderObjectsCanvas = document.getElementById('mapRenderObjects');
	var helperCanvas = document.getElementById('helperLayer');
	//var ctx = mapRenderCanvas.getContext('2d');

	window.pixelSize = 4;
	var activeMap = null;
	var isMouseDown = false;

	var activeLayer = null;
	var activeToolNumber = 0;

	// Create a place to store layers
	var layerStore = {
		LayerTerrain: {
			canvas: mapRenderTerrainCanvas,
			colorMap: colorTerrain,
			defaultColor: colorEarth,
		},
		LayerObjects: {
			canvas: mapRenderObjectsCanvas,
			colorMap: colorObject,
			defaultColor: colorNone,
		}
	};

	window.setTool = function(toolName) {
		switch(toolName) {
			case 'toolTerrainEarth':
				activeLayer = layerStore.LayerTerrain;
				activeToolNumber = 0;
			break;

			case 'toolTerrainWater':
				activeLayer = layerStore.LayerTerrain;
				activeToolNumber = 1;
			break;

			case 'toolTerrainGrass':
				activeLayer = layerStore.LayerTerrain;
				activeToolNumber = 2;
			break;

			case 'toolTerrainSky':
				activeLayer = layerStore.LayerTerrain;
				activeToolNumber = 3;
			break;

			case 'toolTerrainAbyse':
				activeLayer = layerStore.LayerTerrain;
				activeToolNumber = 4;
			break;

			case 'toolObjectNone':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 0;
			break;

			case 'toolObjectMountain':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 1;
			break;

			case 'toolObjectWood':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 2;
			break;

			case 'toolObjectGold':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 3;
			break;

			case 'toolObjectStone':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 4;
			break;

			case 'toolObjectIron':
				activeLayer = layerStore.LayerObjects;
				activeToolNumber = 5;
			break;
		}
	}

	$('#helperLayer').mousedown(function(e) {
		// Grab offset
		var offset = $(this).offset();

		// Calculate mouseX
		var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

  		// Mouse is down
  		isMouseDown = true;

  		// Run the callback
		clickPixel(mouseX, mouseY);
	});

	$('#helperLayer').mouseup(function(e) {
		// Mouse is no longer down
		isMouseDown = false;
	});

	$('#helperLayer').mousemove(function(e) {
		if(!isMouseDown) return;

		// Grab offset
		var offset = $(this).offset();

		// Calculate mouseX
		var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

  		// Run the cll
  		clickPixel(mouseX, mouseY);
	});

	function clickPixel(x, y) {
		updatePixel(activeLayer, x, y, activeToolNumber);
	}

	// Loads a map from data
	function loadMap(data) {
		// Set the active layer to terrain
		activeLayer = layerStore.LayerTerrain;

		// Stores info about the map that is currently loaded
		activeMap = {
			rawData: data,
			layerStore: layerStore
		}

		// Load terrain
		loadLayer({
			data: data,
			layerName: 'LayerTerrain',
			layers: layerStore
		});

		// Load Objects
		loadLayer({
			data: data,
			layerName: 'LayerObjects',
			layers: layerStore
		});

		// Render Terrain
		renderLayer(layerStore.LayerTerrain);

		// Render Objects
		renderLayer(layerStore.LayerObjects);

		// Size
		helperCanvas.width = window.pixelSize * layerStore.LayerTerrain.width;
		helperCanvas.height = window.pixelSize * layerStore.LayerTerrain.height;

	}

	//ctx.fillStyle = 'green';
	//ctx.fillRect(10, 10, 100, 100);

	$("#file").on("change", function(evt) {
		var files = evt.target.files;
		if(files.length != 1) {
			alertify.error('Please select one "They Are Billions" save file.');
			return;
		}

	    // Closure to capture the file information.
	    function handleFile(f) {
	        /*var $title = $("<h4>", {
	            text : f.name
	        });

	        var $fileContent = $("<ul>");
	        $result.append($title);
	        $result.append($fileContent);

	        var dateBefore = new Date();*/

	        setIsLoading(true);

	        JSZip.loadAsync(f)                                   // 1) read the Blob
	        .then(function(zip) {
	            //var dateAfter = new Date();
	            /*$title.append($("<span>", {
	                "class": "small",
	                text:" (loaded in " + (dateAfter - dateBefore) + "ms)"
	            }));*/

	            var fileData = zip.file('Data');
	            var fileInfo = zip.file('Info');
	            if(fileData == null || fileInfo == null) {
	            	setIsLoading(false);
	            	alertify.error('This does not appear to be a valid "They Are Billions" save file. It is missing "Data" or "Info".');
	            	return;
	            }

	            fileData.async('string').then(function (data) {
	            	// We are no longer loading
					setIsLoading(false);

					// Load the map
					loadMap(data);
				});
	        }, function (e) {
	        	alertify.error('Error loading zip file! ' + f.name + ' - ' + e.message);
	            /*$result.append($("<div>", {
	                "class" : "alert alert-danger",
	                text : "Error reading " + f.name + ": " + e.message
	            }));*/
	        });
	    }
	    
	    handleFile(files[0]);
	});
});