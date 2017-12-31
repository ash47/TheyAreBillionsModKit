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
	//var ctx = mapRenderCanvas.getContext('2d');

	var pixelSize = 4;

	var activeMap = null;

	// Loads a map from data
	function loadMap(data) {
		// Create a place to store layers
		var layerStore = {};

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
		renderLayer({
			canvas: mapRenderTerrainCanvas,
			data: layerStore.LayerTerrain,
			colorMap: colorTerrain,
			defaultColor: colorEarth,
			pixelSize: pixelSize
		});

		// Render Objects
		renderLayer({
			canvas: mapRenderObjectsCanvas,
			data: layerStore.LayerObjects,
			colorMap: colorObject,
			defaultColor: colorNone,
			pixelSize: pixelSize
		});
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