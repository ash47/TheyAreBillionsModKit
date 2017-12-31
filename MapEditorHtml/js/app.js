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
	window.layerStore = {
		LayerTerrain: {
			name: 'LayerTerrain',
			canvas: mapRenderTerrainCanvas,
			colorMap: colorTerrain,
			defaultColor: colorEarth,
		},
		LayerObjects: {
			name: 'LayerObjects',
			canvas: mapRenderObjectsCanvas,
			colorMap: colorObject,
			defaultColor: colorNone,
		}
	};

	// Saving the map
	window.saveMap = function() {
		// Set that we are saving
		setIsSaving(true);

		// Commit the update
		loadLayer('LayerTerrain', true);
		loadLayer('LayerObjects', true);

		// Generate the save file
		var zip = new JSZip();

		zip.file('Data', window.activeMap.Data);
		zip.file('Info', window.activeMap.Info);

		zip.generateAsync({
			type: 'blob'
		}).then(function(content) {
			window.activeMap.downloadableZip = content;

			// Get the checksum
			blobToBuffer(content, function(err, buff) {
				// Store the checksum
				window.activeMap.checksum = generateChecksum(buff);

				// Set up to date
				window.setMapExportUpToDate(true, true);
			});

			// You can now export the map
			window.setMapExportUpToDate(true);

			// Set that we are no longer saving
			setIsSaving(false);
		});
	};

	function setIsSaving(isSaving) {
		var theCon = $('#mainContainer');

		if(isSaving) {
			theCon.addClass('isSaving');
		} else {
			theCon.removeClass('isSaving');
		}
	}

	var _isUpToDate = null;
	var _isChecksumUpToDate = null;
	window.setMapExportUpToDate = function(upToDate, isChecksum) {
		if(!isChecksum && _isUpToDate == upToDate) return;
		if(isChecksum && _isChecksumUpToDate == upToDate) return;
		if(!isChecksum) _isUpToDate = upToDate;
		if(isChecksum) _isChecksumUpToDate = upToDate;

		var exportBtnZip = $('#btnExportSave');
		var exportBtnChecksum = $('#btnExportChecksum');

		if(upToDate) {
			if(isChecksum) {
				// The checksum
				exportBtnChecksum.removeAttr('disabled');
				exportBtnChecksum.removeClass('btn-danger');
				exportBtnChecksum.addClass('btn-primary');
			} else {
				// The Download
				exportBtnZip.removeAttr('disabled');
				exportBtnZip.removeClass('btn-danger');
				exportBtnZip.addClass('btn-primary');
			}
		} else {
			exportBtnZip.removeClass('btn-primary');
			exportBtnZip.addClass('btn-danger');

			exportBtnChecksum.removeClass('btn-primary');
			exportBtnChecksum.addClass('btn-danger');
		}
	}

	// Downloading the zxsav
	window.downloadZXSave = function() {
		// Do the save
		saveAs(window.activeMap.downloadableZip, window.activeMap.name);
	};

	// Download the checksum
	window.downloadZXChecksum = function() {
		// Do the saveas
		saveAs(
			new Blob([window.activeMap.checksum], {type : 'text/plain'}),
			window.activeMap.name.replace('.zxsav', '.zxcheck')
		);
	};

	window.setTool = function(toolName) {
		switch(toolName) {
			case 'toolTerrainEarth':
				activeLayer = window.layerStore.LayerTerrain;
				activeToolNumber = 0;
			break;

			case 'toolTerrainWater':
				activeLayer = window.layerStore.LayerTerrain;
				activeToolNumber = 1;
			break;

			case 'toolTerrainGrass':
				activeLayer = window.layerStore.LayerTerrain;
				activeToolNumber = 2;
			break;

			case 'toolTerrainSky':
				activeLayer = window.layerStore.LayerTerrain;
				activeToolNumber = 3;
			break;

			case 'toolTerrainAbyse':
				activeLayer = window.layerStore.LayerTerrain;
				activeToolNumber = 4;
			break;

			case 'toolObjectNone':
				activeLayer = window.layerStore.LayerObjects;
				activeToolNumber = 0;
			break;

			case 'toolObjectMountain':
				activeLayer = window.layerStore.LayerObjects;
				activeToolNumber = 1;
			break;

			case 'toolObjectWood':
				activeLayer = window.layerStore.LayerObjects;
				activeToolNumber = 2;
			break;

			case 'toolObjectGold':
				activeLayer = window.layerStore.LayerObjects;
				activeToolNumber = 3;
			break;

			case 'toolObjectStone':
				activeLayer = window.layerStore.LayerObjects;
				activeToolNumber = 4;
			break;

			case 'toolObjectIron':
				activeLayer = window.layerStore.LayerObjects;
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
	function loadMap() {
		// Ensure we have data loaded
		if(window.activeMap.Data == null || window.activeMap.Info == null) return;

		// Set the active layer to terrain
		activeLayer = window.layerStore.LayerTerrain;

		// Load terrain
		loadLayer('LayerTerrain');

		// Load Objects
		loadLayer('LayerObjects');

		// Render Terrain
		renderLayer('LayerTerrain');

		// Render Objects
		renderLayer('LayerObjects');

		// Size
		helperCanvas.width = window.pixelSize * window.layerStore.LayerTerrain.width;
		helperCanvas.height = window.pixelSize * window.layerStore.LayerTerrain.height;

		// Allow export
		$('#btnSaveChanges').removeAttr('disabled');

		// But we aren't up to date
		window.setMapExportUpToDate(false);

		// We are no longer loading
		setIsLoading(false);

		// Map is loaded
		$('#mainContainer').addClass('mapIsLoaded	');
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

	            // Stores info about the map that is currently loaded
				window.activeMap = {
					name: f.name
				};

	            fileData.async('string').then(function(data) {
	            	// Store the Data
					window.activeMap.Data = data;

					// Load the map
					loadMap();
				});

				fileInfo.async('string').then(function(data) {
					// Store the Data
					window.activeMap.Info = data;

					// Load the map
					loadMap();
				})
	        }, function (e) {
	        	alertify.error('Error loading zip file! ' + f.name + ' - ' + e.message);
	        	setIsLoading(false);
	            /*$result.append($("<div>", {
	                "class" : "alert alert-danger",
	                text : "Error reading " + f.name + ": " + e.message
	            }));*/
	        });
	    }
	    
	    handleFile(files[0]);
	});
});