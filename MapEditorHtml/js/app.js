"use strict";

window.enableEditorTerrain = true;
window.enableEditorObjects = true;
window.enableEditorFog = true;
window.enableEditorSer = true;
window.enableEditorEntities = true;
window.enableEditorExtraEntities = true;
window.enableEditorEvents = true;
window.enableEditorMapProps = true;
window.enableEditorInfo = true;

window.enableEditorFastEntities = false;

// Turn features on and off, what a sad world that we have to even have this
window.updateSelectedFeatures = function() {
	window.enableEditorTerrain = $('#featureToggleTerrain').is(':checked');
	window.enableEditorObjects = $('#featureToggleObject').is(':checked');
	window.enableEditorSer = $('#featureToggleObject').is(':checked');
	window.featureToggleFog = $('#featureToggleFog').is(':checked');
	window.enableEditorFog = $('#featureToggleObject').is(':checked');
	window.enableEditorEntities = $('#featureToggleEntities').is(':checked');
	window.enableEditorExtraEntities = $('#featureToggleExtraEntities').is(':checked');
	window.enableEditorEvents = $('#featureToggleEventsEditor').is(':checked');
	window.enableEditorMapProps = $('#featureToggleMapProps').is(':checked');
	window.enableEditorInfo = $('#featureToggleMapInfo').is(':checked');
};

$(document).ready(function() {
	// Update allowed features
	window.updateSelectedFeatures();

	function setIsLoading(isLoading) {
		var mainCon = $('#mainContainer');

		if(isLoading) {
			mainCon.addClass('isLoading');
		} else {
			mainCon.removeClass('isLoading');
		}

		// Update to be 0%
		$('#loadingPercentage').text('0%');
	}

	// update our previous maps
	updatePastMapsList();

	var mapRenderTerrainCanvas = document.getElementById('mapRenderTerrain');
	var mapRenderObjectsCanvas = document.getElementById('mapRenderObjects');
	var mapRenderFoWCanvas = document.getElementById('mapRenderFoW');
	var helperCanvas = document.getElementById('helperLayer');
	//var ctx = mapRenderCanvas.getContext('2d');

	window.pixelSize = 4;
	var activeMap = null;
	var isMouseDown = false;

	var activeLayer = null;

	// Which primary tool is currently activated
	var activePrimaryTool = 0;

	// Which brush is currently selected
	var activeBrush = 0;

	// Which color is currently active
	var activeToolColor = 0;

	window.brushSize = 1;

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
		},
		LayerFog: {
			name: 'LayerFog',
			canvas: mapRenderFoWCanvas,
			colorMap: colorFoWMap,
			defaultColor: colorFogOfWarOff,
		}
	};

	// Updating the map title
	window.updateSaveName = function() {
		// Store the new title
		window.mapInfo.title = $('#mapNameHolder').val();
	};

	// Saving the map
	window.saveMap = function() {
		// Set that we are saving
		setIsSaving(true);

		var totalParts = 13;
		var currentPart = 0;

		// Update to be 0%
		$('#savingPercentage').text('0%');

		var updatePercentage = function() {
			++currentPart;

			var percent = (currentPart / totalParts * 100).toFixed(2);
			$('#savingPercentage').text(percent + '%');
		};

		// Reset Total Entities
		window.totalEntities = 0;

		// Allow async
		setTimeout(function() {
			if(enableEditorTerrain) {
				// Commit the updates to layers
				loadLayer('LayerTerrain', true);
			}
			updatePercentage();

		setTimeout(function() {
			if(enableEditorObjects) {
				loadLayer('LayerObjects', true);
			}
			updatePercentage();

		setTimeout(function() {
			// Fog of War
			if(enableEditorFog) {
				loadLayerSimple(
					'LayerFog',
					window.layerStore.LayerTerrain.width + '|' + window.layerStore.LayerTerrain.height + '|',
					true
				);
			}
			updatePercentage();

		setTimeout(function() {
			// Commit the new ser layer
			if(enableEditorSer) {
				updateLayerSer();
			}
			updatePercentage();

		setTimeout(function() {
			// Commit updates to entities
			if(window.enableEditorEntities) {
				loadLevelEntities(true);
			}
			updatePercentage();

		setTimeout(function() {
			if(window.enableEditorExtraEntities) {
				// Commit updates to extra entites
				loadLevelExtraEntites(true);
			}
			updatePercentage();

		setTimeout(function() {
			// Commit updates to events
			if(window.enableEditorEvents) {
				loadLevelEvents(true);
			}
			updatePercentage();

		setTimeout(function() {
			// Commit updates to map props
			if(enableEditorMapProps) {
				loadMapProps(true);
			}
			updatePercentage();

		setTimeout(function() {
			// Commit the changes to the map info
			if(window.enableEditorInfo) {
				loadInfo(true);
			}
			updatePercentage();

		setTimeout(function() {
			// Update our local storage
			updateLocalStorage();
			updatePercentage();

		setTimeout(function() {
			// Generate the save file
			var zip = new JSZip();

			zip.file('Data', window.activeMap.Data);
			zip.file('Info', window.activeMap.Info);

			zip.generateAsync({
				type: 'blob',
				compression: 'DEFLATE',
			    compressionOptions: {
			        level: 9
			    }
			}).then(function(content) {
				window.activeMap.downloadableZip = content;
				updatePercentage();

				setTimeout(function () {
					// Get the checksum
					blobToBuffer(content, function(err, buff) {
						updatePercentage();

						// Store the checksum
						window.activeMap.checksum = generateChecksum(buff);

						// Set up to date
						window.setMapExportUpToDate(true, true);

						// Set that we are no longer saving
						setIsSaving(false);
					});

					// You can now export the map
					window.setMapExportUpToDate(true);
				}, 1);
			});
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
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

	// Updates which tool brush section thing is visible
	window.setActiveLayerSelectionGroupSub = function(newSection) {
		// Cleanup old selections
		$('.layerSelectionGroupSub').removeClass('btn-success');
		$('.layerSelectionGroupSub').addClass('btn-primary');

		var header = 'requireSubClass_';
		var classes = ['terrain', 'object', 'fog'];

		for(var i=0; i<classes.length; ++i) {
			var fullClass = header + classes[i];

			$('.' + fullClass).hide();
		}
		$('.' + header + newSection).show();

		var highlightClassName = $('#layerSelectionGroupSub_' + newSection);
		highlightClassName.removeClass('btn-primary');
		highlightClassName.addClass('btn-success');
	};

	// Updates which tool is selected
	window.setTool = function(toolSort, toolName) {
		if(toolSort == 'primaryTool') {
			$('.btnSelectTool')
				.removeClass('btn-success')
				.addClass('btn-primary');

			$('#btn_' + toolName)
				.removeClass('btn-primary')
				.addClass('btn-success');

			// Remove classes
			$('#mainContainer').removeClass('paintToolActivated');
			$('#mainContainer').removeClass('selectionToolActivated');
			$('#mainContainer').removeClass('entityToolActivated');

			switch(toolName) {
				case 'setToolMapPainter':
					activePrimaryTool = enum_toolPaint;
					$('#mainContainer').addClass('paintToolActivated');
				break;

				case 'setToolSelection':
					activePrimaryTool = enum_toolSelection;
					$('#mainContainer').addClass('selectionToolActivated');
				break;

				case 'setToolEntity':
					activePrimaryTool = enum_toolEntity;
					$('#mainContainer').addClass('entityToolActivated');
				break;
			}
		}

		if(toolSort == 'brushType') {
			$('.btnSelectPaintType')
				.removeClass('btn-success')
				.addClass('btn-primary');

			$('#btn_' + toolName)
				.removeClass('btn-primary')
				.addClass('btn-success');

			switch(toolName) {
				case 'setToolMapPainterSingle':
					activeBrush = enum_brushSingle;
				break;

				case 'setToolMapPainterLine':
					activeBrush = enum_brushLine;
				break;
			}
		}

		if(toolSort == 'brushColor') {
			// Deactivate all old tools buttons
			$('.btnSelectToolColor')
				.removeClass('btn-success')
				.addClass('btn-primary');

			$('#btn_' + toolName)
				.removeClass('btn-primary')
				.addClass('btn-success');

			switch(toolName) {
				case 'toolTerrainEarth':
					window.setActiveLayerSelectionGroupSub('terrain');
					activeLayer = window.layerStore.LayerTerrain;
					activeToolColor = 0;
				break;

				case 'toolTerrainWater':
					window.setActiveLayerSelectionGroupSub('terrain');
					activeLayer = window.layerStore.LayerTerrain;
					activeToolColor = 1;
				break;

				case 'toolTerrainGrass':
					window.setActiveLayerSelectionGroupSub('terrain');
					activeLayer = window.layerStore.LayerTerrain;
					activeToolColor = 2;
				break;

				case 'toolTerrainSky':
					window.setActiveLayerSelectionGroupSub('terrain');
					activeLayer = window.layerStore.LayerTerrain;
					activeToolColor = 3;
				break;

				case 'toolTerrainAbyse':
					window.setActiveLayerSelectionGroupSub('terrain');
					activeLayer = window.layerStore.LayerTerrain;
					activeToolColor = 4;
				break;

				case 'toolObjectNone':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 0;
				break;

				case 'toolObjectMountain':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 1;
				break;

				case 'toolObjectWood':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 2;
				break;

				case 'toolObjectGold':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 3;
				break;

				case 'toolObjectStone':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 4;
				break;

				case 'toolObjectIron':
					window.setActiveLayerSelectionGroupSub('object');
					activeLayer = window.layerStore.LayerObjects;
					activeToolColor = 5;
				break;

				case 'toolFoWEnabled':
					window.setActiveLayerSelectionGroupSub('fog');
					activeLayer = window.layerStore.LayerFog;
					activeToolColor = -16777216;
				break;

				case 'toolFoWDisabled':
					window.setActiveLayerSelectionGroupSub('fog');
					activeLayer = window.layerStore.LayerFog;
					activeToolColor = 0;
				break;
			}
		}

		

		// Update the preview
		updateMousePreview(true);
	};

	// Set the active entity template
	window.setActiveTemplate = function(templateName) {
		// Ensure the template exists
		if(window.entityTemplates[templateName] == null) {
			alertify.error(window.getTranslation(
				'trErrorInvalidTemplate',
				'Unknown template: {{template}}', {
					template: templateName
				}
			));
			return;
		}

		// Store the new active template
		window.activeTemplate = templateName;

		// Data on the currently active template
		window.activeTemplateData = window.extractEntityInfo(
			window.entityTemplates[templateName]
		);

		// Calculate offsets
		window.activeTemplateSizeInfo = getEntityOffsets(window.activeTemplateData);

		// Update the mouse preview
		window.updateMousePreview(true);

		$('#activeEntityGoesHere').text(window.getTranslation(
			'trEntitySelected_' + (templateName).replace(/ /g, ''),
			templateName
		));
	};

	// Prompt to select which entity
	window.promptSelectActiveTemplate = function() {
		alertify.genericDialog(
			$('#selectEntityBrushMain')[0]
		);
	};

	// Updates which layers are visible
	window.updateLayerToggles = function() {
		var terrainVisible = $('#toggleLayerTerrain').is(':checked');
		var objectsVisible = $('#toggleLayerObjects').is(':checked');
		var entitiesVisible = $('#toggleLayerEntities').is(':checked');
		var entityLabelsVisible = $('#toggleLayerEntityLabels').is(':checked');
		var fogOfWarVisible = $('#toggleLayerFoW').is(':checked');

		var cTerrain = $(window.layerStore.LayerTerrain.canvas);
		var cObjects = $(window.layerStore.LayerObjects.canvas);
		var cFoW = $(window.layerStore.LayerFog.canvas);
		var mainWindow = $('#mainContainer');

		// Toggle terrain layer
		terrainVisible ?
			cTerrain.show() : 
			cTerrain.hide();

		// Toggle objects layer
		objectsVisible ?
			cObjects.show() : 
			cObjects.hide();

		// Toggle fog of war layer
		fogOfWarVisible ?
			cFoW.show() :
			cFoW.hide();

		entitiesVisible ? mainWindow.removeClass('hideEntities') : mainWindow.addClass('hideEntities');
		entityLabelsVisible ? mainWindow.removeClass('hideEntityLabels') : mainWindow.addClass('hideEntityLabels');
	};

	// Updates the map zoom
	window.updateMapZoom = function() {
		var conMapZoom = $('#mapZoom');
		var possibleNewZoomSize = parseInt(conMapZoom.val());
		possibleNewZoomSize = Math.floor(Math.max(possibleNewZoomSize, 1));

		// Store the new pixel size
		window.pixelSize = possibleNewZoomSize;

		// Update brush size
		window.updateBrushSize(true);

		// Perform a full re-render
		mapFullRender();
	};

	// Update brush sizes
	window.updateBrushSize = function() {
		var conBrushSize = $('#brushSize');
		var possibleNewBrushSize = parseInt(conBrushSize.val());
		possibleNewBrushSize = Math.floor(Math.max(possibleNewBrushSize, 1));

		// Push the value back
		conBrushSize.val(possibleNewBrushSize);

		// Update the brushSize
		window.brushSize = possibleNewBrushSize;

		// Update preview
		window.updateMousePreview(true);
	};

	window.updateMousePreview = function(updateSize) {
		var previewCon = $('#mousePreview');

		var theOffsetX = 0;
		var theOffsetY = 0;

		if(activePrimaryTool == enum_toolPaint) {
			theOffsetX = Math.floor( (window.brushSize - 1) / 2);
			theOffsetY = theOffsetX;

			if(updateSize) {
				var theSize = window.brushSize * window.pixelSize;

				previewCon.width(theSize);
				previewCon.height(theSize);
			}
		}

		if(activePrimaryTool == enum_toolEntity) {
			if(updateSize) {
				previewCon.width(window.activeTemplateSizeInfo.width * window.pixelSize);
				previewCon.height(window.activeTemplateSizeInfo.height * window.pixelSize);
			}

			theOffsetX = -window.activeTemplateSizeInfo.offsetX;
			theOffsetY = -window.activeTemplateSizeInfo.offsetY;
		}
		
		previewCon.css('left', (prevX - theOffsetX) * window.pixelSize);
		previewCon.css('top', (prevY - theOffsetY) * window.pixelSize);

		// Update the position text
		if(prevX != null && prevY != null) {
			var x = (activeLayer.width - prevX - 1);
  			$('#cursorPos').text(prevY + ';' + x);
		}
	};

	var prevX = null;
	var prevY = null;

	var startX = null;
	var startY = null;

	$('#helperLayer').mousedown(function(e) {
		// Grab offset
		var offset = $(this).offset();

		// Calculate mouseX
		var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

  		// Mouse is down
  		isMouseDown = true;

  		// Update the previous mouse positions
  		prevX = mouseX;
  		prevY = mouseY;

  		// Store the starting position
  		startX = prevX;
  		startY = prevY;

  		if(activePrimaryTool == enum_toolPaint) {
  			if(activeBrush == enum_brushSingle) {
  				// Run the callback
				clickPixel(mouseX, mouseY);
  			}
  		}

  		// Entiy placement
  		if(activePrimaryTool == enum_toolEntity) {
  			var templateName = window.activeTemplate;

  			// Create the new entity
  			var newEntity = window.extractEntityInfo(
				window.entityTemplates[templateName]
			);

			var entityType = newEntity.__entityType;

			// Do we have a store for this entity?
			if(window.layerStore.entities[entityType] == null) {
				window.layerStore.entities[entityType] = [];
			}

			// Store the new entity
			window.layerStore.entities[entityType].push(newEntity);
			newEntity.__theStore = window.layerStore.entities[entityType];

			// Get the position of the entity
			var x = (activeLayer.width - prevX - 1);
  			var entPos = '' + prevY + ';' + x;
  			newEntity.Position = entPos;

  			// We should show this entity
  			newEntity.shouldHide = false;

  			// Visually create it
  			addVisualEnt(newEntity);

  			// View this entity
  			window.viewEntityProps(newEntity);

  			// Update entity menu
  			window.updateEntityMenu();
  		}
	}).mouseup(function(e) {
		// Mouse is no longer down
		isMouseDown = false;

		// Line tool?
		if(activePrimaryTool == enum_toolPaint) {
			// Brush tool
		  	if(activeBrush == enum_brushLine) {
		  		// Clear the helper canvas
		  		var ctx = helperCanvas.getContext('2d');
		  		ctx.clearRect(0, 0, helperCanvas.width, helperCanvas.height);

		  		// Grab offset
				var offset = $(this).offset();

				// Calculate mouseX
				var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
		  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

		  		// Calculate the max number of pixels the mouse travelled
		  		var xDist = mouseX - startX;
		  		var yDist = mouseY - startY;

		  		var dist = Math.max(
		  			Math.abs(xDist),
		  			Math.abs(yDist)
		  		);

		  		var width = window.layerStore.LayerTerrain.width;

		  		// Render a line
		  		for(var i=0; i<=dist; ++i) {
		  			var renderPixelAtX = Math.round(startX + i/dist * xDist);
		  			var renderPixelAtY = Math.round(startY + i/dist * yDist);

		  			// Actually click it
					clickPixel(renderPixelAtX, renderPixelAtY);
		  		}
		  	}

		  	// Mark off this history item
		  	window.closeHistoryStack();
		}
	}).mousemove(function(e) {
		// Grab offset
		var offset = $(this).offset();

		// Calculate mouseX
		var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

		if(isMouseDown) {
			if(activePrimaryTool == enum_toolPaint) {
				// Single point tool
				if(activeBrush == enum_brushSingle) {
					// Run the call
			  		clickPixel(mouseX, mouseY);

			  		// Calculate the max number of pixels the mouse travelled
			  		var xDist = mouseX - prevX;
			  		var yDist = mouseY - prevY;

			  		var dist = Math.max(
			  			Math.abs(xDist),
			  			Math.abs(yDist)
			  		);

			  		for(var i=1; i<dist; ++i) {
			  			clickPixel(Math.round(mouseX - i/dist * xDist), Math.round(mouseY - i/dist * yDist));
			  		}
			  	}

			  	// Brush tool
			  	if(activeBrush == enum_brushLine) {
			  		// Update the preview

			  		var ctx = helperCanvas.getContext('2d');

			  		// Clear the helper canvas
			  		ctx.clearRect(0, 0, helperCanvas.width, helperCanvas.height);

			  		// Calculate the max number of pixels the mouse travelled
			  		var xDist = mouseX - startX;
			  		var yDist = mouseY - startY;

			  		var dist = Math.max(
			  			Math.abs(xDist),
			  			Math.abs(yDist)
			  		);

			  		var width = window.layerStore.LayerTerrain.width;
			  		var theColor = activeLayer.colorMap[activeToolColor];

			  		// Render a line
			  		for(var i=0; i<=dist; ++i) {
			  			var renderPixelAtX = Math.round(startX + i/dist * xDist);
			  			var renderPixelAtY = Math.round(startY + i/dist * yDist);

						ctx.fillStyle = getRBG(theColor);
						ctx.fillRect(renderPixelAtX * window.pixelSize, renderPixelAtY * pixelSize, window.pixelSize, window.pixelSize);
			  		}
			  	}
			}
		}

  		// Update Previous mouse positions
  		prevX = mouseX;
  		prevY = mouseY;

  		// Update preview
		updateMousePreview();
	});

	// Mouse no longer down
	$('body').mouseup(function() {
		isMouseDown = false;
	});

	function clickPixel(x, y) {
		// Calculate the top left pixel
		var theOffset = Math.floor( (window.brushSize - 1) / 2);

		for(var xx=0; xx<window.brushSize; ++xx) {
			for(var yy=0; yy<window.brushSize; ++yy) {
				// Update the pixel
				updatePixel(activeLayer, x + xx - theOffset, y + yy - theOffset, activeToolColor);
			}
		}
	}

	// Loads a map from data
	function loadMap() {
		// Ensure we have data loaded
		if(window.activeMap.Data == null || window.activeMap.Info == null) return;

		// We are loading
		setIsLoading(true);
		var totalParts = 14;
		var currentPart = 0;

		var updatePercentage = function() {
			++currentPart;

			var percent = (currentPart / totalParts * 100).toFixed(2);
			$('#loadingPercentage').text(percent + '%');
		};

		setTimeout(function() {
			// Update the local storage of maps
			updateLocalStorage();
			updatePercentage();

		setTimeout(function() {
			// Set the active layer to terrain
			activeLayer = window.layerStore.LayerTerrain;
			updatePercentage();

		setTimeout(function() {
			// Load terrain
			loadLayer('LayerTerrain');
			updatePercentage();

		setTimeout(function() {
			// Load Objects
			loadLayer('LayerObjects');
			updatePercentage();

		setTimeout(function() {
			// Load Activity Layer
			loadLayerSimple(
				'LayerFog',
				window.layerStore.LayerTerrain.width + '|' + window.layerStore.LayerTerrain.height + '|'
			);
			updatePercentage();

		setTimeout(function() {
			// Read main entities chunk
			loadLevelEntities();
			updatePercentage();

		setTimeout(function() {
			// Read extra entities
			loadLevelExtraEntites();
			updatePercentage();

		setTimeout(function() {
			// Read fast entities
			loadFastEntities();
			updatePercentage();

		setTimeout(function() {
			// Read map events
			loadLevelEvents();
			updatePercentage();

		setTimeout(function (){
			// Load map props
			loadMapProps();
			updatePercentage();

		setTimeout(function() {
			// Load info about map
			loadInfo();
			updatePercentage();

		setTimeout(function() {
			// Update the entity display
			window.updateEntityMenu();
			updatePercentage();

		setTimeout(function() {
			// Perform a full re-render of the map
			mapFullRender();
			updatePercentage();

		setTimeout(function() {
			// Allow export
			$('#btnSaveChanges').removeAttr('disabled');

			// But we aren't up to date
			window.setMapExportUpToDate(false);

			// Update which tool is selected
			window.setTool('primaryTool', 'setToolMapPainter');
			window.setTool('brushType', 'setToolMapPainterSingle');
			window.setTool('brushColor', 'toolTerrainEarth');

			window.setActiveTemplate('ZX.Entities.StoneHouse');

			// Update what is displayed
			window.updateLayerToggles();

			// We are no longer loading
			setIsLoading(false);

			// Map is loaded
			$('#mainContainer').addClass('mapIsLoaded');

			updatePercentage();
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
		}, 1);
	}

	var entityExpandedPath = {};
	function generateEntityMenu(entityText, entities) {
		if(entities == null) return;

		// Entity Expansion remembering
		entityExpandedPath[entityText] = entityExpandedPath[entityText] || {};
		var expandList1 = entityExpandedPath[entityText];

		var outerChildrenAreChecked = true;

		var shouldExpand0 = false;
		if(expandList1.expanded) {
			shouldExpand0 = true;
		}

		var entityData = [];
		for(var entityName in entities) {
			var myEntities = entities[entityName];
			var thisEntityList = [];

			// Used for if we should check this node
			var childrenAreChecked = true;

			// should we expand the node?
			var shouldExpand1 = false;

			expandList1[entityName] = expandList1[entityName] || {};
			if(expandList1[entityName].expanded) {
				shouldExpand1 = true;
				shouldExpand0 = true;
			}

			// Add all the subnodes
			for(var i=0; i<myEntities.length; ++i) {
				var myEntity = myEntities[i];

				expandList1[entityName][i] = expandList1[entityName][i] || {};

				var shouldExpand2 = false;
				if(myEntity.isActive || (
					expandList1[entityName][i].expanded
				)) {
					shouldExpand0 = true;
					shouldExpand1 = true;
					shouldExpand2 = true;
				}

				if(myEntity.shouldHide) {
					childrenAreChecked = false;
					outerChildrenAreChecked = false;
				}

				var displayText = myEntity.ID;

				thisEntityList.push({
					text: displayText,
					state: {
						checked: (myEntity.shouldHide) ? false : true,
						selected: shouldExpand2
					},
					entityReference: {
						entityName: entityName,
						entryNumber: i
					},
					path: [entityText, entityName, i],
					__sort: entityText
				});
			}

			// Sort lowest to highest
			thisEntityList.sort(function(a, b) {
				if(a.text < b.text) {
					return -1;
				} else if(a.text > b.text) {
					return 1;
				} else {
					return 0;
				}
			});

			if(entityName == 'addDirect') {
				// All of these sit directly in the main one
				for(var i=0; i<thisEntityList.length; ++i) {
					entityData.push(thisEntityList[i]);
				}
			} else {
				// Store it
				entityData.push({
					text: entityName,
					selectable: false,
					nodes: thisEntityList,
					state: {
						checked: childrenAreChecked,
						expanded: shouldExpand1
					},
					path: [entityText, entityName]
				});
			}
		}

		// Sort it alphabetically
		entityData.sort(function(a, b) {
			if(a.text < b.text) {
				return -1;
			} else if(a.text > b.text) {
				return 1;
			} else {
				return 0;
			}
		});

		// Remove old tree
		$('#entityTree').empty();

		return {
			text: window.getTranslation(
				'trInfoMapProperties_menu_' + (entityText).replace(/ /g, ''),
				entityText
			),
			selectable: false,
			nodes: entityData,
			state: {
				checked: outerChildrenAreChecked,
				expanded: shouldExpand0
			},
			path: [entityText]
		};
	}

	window.updateEntityMenu = function() {
		var theNodeTree = [];

		// Text for these menu's is auto translated based on:
		// 'trInfoMapProperties_menu_' + (entityText).replace(/ /g, '')

		// Generate the entities subMenu
		var treeEnts = generateEntityMenu('Entities', window.layerStore.entities);
		if(treeEnts != null) theNodeTree.push(treeEnts);

		var treeEnts = generateEntityMenu('FastEntities', window.layerStore.fastEntities);
		if(treeEnts != null) theNodeTree.push(treeEnts);

		var treeEnts = generateEntityMenu('ExtraEntities', window.layerStore.extraEntities);
		if(treeEnts != null) theNodeTree.push(treeEnts);

		var treeEnts = generateEntityMenu('Events', {
			addDirect: window.layerStore.events
		});
		if(treeEnts != null) theNodeTree.push(treeEnts);

		// Add entity editor
		theNodeTree.push({
			text: window.getTranslation(
				'trInfoMapProperties',
				'Map Properties'
			),
			selectable: true,
			entityReference: {},
			__sort: 'MapProps'
		});

		// Create the tree
		var theTree = $('#entityTree').treeview({
			showCheckbox: true,
			levels: 1,
			onNodeExpanded: function(event, node) {
				if(node.path) {
					var toSearch = entityExpandedPath;
					node.path.map(function(a) {
						toSearch = toSearch[a] || {};
					});

					toSearch.expanded = true;
				}
			},
			onNodeCollapsed: function(event, node) {
				if(node.path) {
					var toSearch = entityExpandedPath;
					node.path.map(function(a) {
						toSearch = toSearch[a] || {};
					});

					toSearch.expanded = false;
				}
			},
			onNodeSelected: function(event, node) {
				// Check the sort
				if(node.entityReference != null) {
					var ref = node.entityReference;

					if(node.__sort == 'Entities') {
						window.viewEntityProps(window.layerStore.entities[ref.entityName][ref.entryNumber]);
					}

					if(node.__sort == 'FastEntities') {
						window.viewEntityProps(window.layerStore.fastEntities[ref.entityName][ref.entryNumber]);
					}

					if(node.__sort == 'Events') {
						window.viewEntityProps(window.layerStore.events[ref.entryNumber]);
					}
					
					if(node.__sort == 'MapProps') {
						window.viewEntityProps(window.layerStore.MapProps);	
					}

					if(node.__sort == 'ExtraEntities') {
						window.viewEntityProps(window.layerStore.extraEntities[ref.entityName][ref.entryNumber]);
					}
				}
			},
			onNodeChecked: function(event, node) {
				// Are there subnodes?
				if(node.nodes != null) {
					var thei = 0;
					var theCont = function() {
						setTimeout(function() {
							if(thei < node.nodes.length) {
								// Mark as checked
								var subNode = node.nodes[thei];

								theTree.treeview('checkNode', [subNode.nodeId]);

								++thei;
								theCont();
							}
						}, 1);
					};

					theCont();
				}

				// Is there an entity we are referencing
				if(node.entityReference != null) {
					if(node.__sort == 'Entities') {
						// Check the sort
						var ref = node.entityReference;
						var ent = window.layerStore.entities[ref.entityName][ref.entryNumber];

						// Change the default view
						ent.shouldHide = false;

						// Hide the entity
						var mapEnt = ent.lastContainer;

						// Does that exist?
						if(mapEnt == null) {
							addVisualEnt(ent);
						} else {
							mapEnt.show();
						}
					}

					if(node.__sort == 'FastEntities') {
						// Check the sort
						var ref = node.entityReference;
						var ent = window.layerStore.fastEntities[ref.entityName][ref.entryNumber];

						// Change the default view
						ent.shouldHide = false;

						// Hide the entity
						var mapEnt = ent.lastContainer;

						// Does that exist?
						if(mapEnt == null) {
							addVisualEnt(ent);
						} else {
							mapEnt.show();
						}
					}

					if(node.__sort == 'ExtraEntities') {
						// Check the sort
						var ref = node.entityReference;
						var ent = window.layerStore.extraEntities[ref.entityName][ref.entryNumber];

						// Change the default view
						ent.shouldHide = false;

						// Hide the entity
						var mapEnt = ent.lastContainer;

						// Does that exist?
						if(mapEnt == null) {
							addVisualEnt(ent);
						} else {
							mapEnt.show();
						}
					}
				}
			},
			onNodeUnchecked: function(event, node) {
				// Are there subnodes?
				if(node.nodes != null) {
					var thei = 0;
					var theCont = function() {
						setTimeout(function() {
							if(thei < node.nodes.length) {
								// Mark as checked
								var subNode = node.nodes[thei];

								theTree.treeview('uncheckNode', [subNode.nodeId]);

								++thei;
								theCont();
							}
						}, 1);
					};

					theCont();
				}

				// Is there an entity we are referencing
				if(node.entityReference != null) {
					// Check the sort
					if(node.__sort == 'Entities') {
						var ref = node.entityReference;
						var ent = window.layerStore.entities[ref.entityName][ref.entryNumber];
						var mapEnt = ent.lastContainer;

						// Shouldn't show
						ent.shouldHide = true;

						if(mapEnt != null) {
							// Hide the entity
							mapEnt.hide();
						}
					}

					// Check the sort
					if(node.__sort == 'FastEntities') {
						var ref = node.entityReference;
						var ent = window.layerStore.fastEntities[ref.entityName][ref.entryNumber];
						var mapEnt = ent.lastContainer;

						// Shouldn't show
						ent.shouldHide = true;

						// Hide the entity
						mapEnt.hide();
					}

					// Check the sort
					if(node.__sort == 'ExtraEntities') {
						var ref = node.entityReference;
						var ent = window.layerStore.extraEntities[ref.entityName][ref.entryNumber];
						var mapEnt = ent.lastContainer;

						// Shouldn't show
						ent.shouldHide = true;

						// Hide the entity
						mapEnt.hide();
					}
				}
			},
			data: theNodeTree
		});
	}

	function mapFullRender() {
		// We are loading
		setIsLoading(true);

		setTimeout(function() {
			// Update the helper's canvas size
			helperCanvas.width = window.pixelSize * window.layerStore.LayerTerrain.width;
			helperCanvas.height = window.pixelSize * window.layerStore.LayerTerrain.height;

			// Render Terrain
			renderLayer('LayerTerrain');

			// Render Objects
			renderLayer('LayerObjects');

			// Render Fog of War
			renderLayer('LayerFog');

			// Render entities (oh god)
			renderEntities();

			// We are no longer loading
			setIsLoading(false);
		}, 1)
	}

	window.onPropsChanged = function(props) {
		// Were we looking at this?
		if(props == window.viewEntityActive) {
			// Redo
			window.viewEntityProps(window.viewEntityActive);
		}
	}

	// Clones an entity
	window.cloneEntity = function() {
		var toClone = window.viewEntityActive;

		if(toClone == null) {
			alertify.error(window.getTranslation(
				'trErrorNoEntitySelected',
				'Please select an entity.'
			));
			return;
		}

		var newEnt = {};
		for(var key in toClone) {
			if(hiddenFields[key] != null) continue;

			// Copy keys
			newEnt[key] = toClone[key];
		}

		// Copy the rawXML
		newEnt.rawXML = toClone.rawXML;

		// Set the ID to be "cloned"
		newEnt.ID = toClone.ID + ' (cloned)';

		// Copy props
		newEnt.__entityType = toClone.__entityType;
		newEnt.__theStore = toClone.__theStore;
		newEnt.isActive = false;
		newEnt.shouldHide = true;

		// Push it into the list of entities
		window.viewEntityActive.__theStore.push(newEnt);

		// Rebuild the UI
		window.updateEntityMenu();

		// Tell the user it was cloned
		alertify.success(window.getTranslation(
			'trSuccessEntityCloned',
			'Entity was successfully cloned!'
		));
	};

	// Asks if the user really wants to delete the entity
	window.deleteEntityWarning = function() {
		var toDelete = window.viewEntityActive;

		if(toDelete == null) {
			alertify.error(window.getTranslation(
				'trErrorNoEntitySelected',
				'Please select an entity.'
			));
			return;
		}

		alertify.confirm(window.getTranslation(
			'trConfirmDeleteEntity',
			'Are you sure you want to delete this entity?'
		), function() {
			// Actually delete the entity
			window.deleteEntity();
		}, function() {
			// Do nothing
		});
	};

	// Actually deletes an entity
	window.deleteEntity = function() {
		var toDelete = window.viewEntityActive;

		if(toDelete == null) {
			alertify.error(window.getTranslation(
				'trErrorNoEntitySelected',
				'Please select an entity.'
			));
			return;
		}

		var store = toDelete.__theStore;

		for(var i=0; i<store.length; ++i) {
			if(store[i] == toDelete) {
				// Remove the entity
				store.splice(i, 1);

				// We no longer have an active entity
				window.viewEntityActive = null;

				// Delete the drag and drop prop
				if(toDelete.lastContainer != null) {
					toDelete.lastContainer.remove();
				}

				// Update the display
				window.updateEntityMenu();

				// Notify Success
				alertify.success(window.getTranslation(
					'trSuccessEntityDeleted',
					'Entity was successfully removed.'
				));

				return;
			}
		}

		// Alert the error
		alertify.error(window.getTranslation(
			'trErrorNoEntityReference',
			'Failed to get a reference to the entity!'
		));
	};

	window.viewEntityProps = function(props) {
		// Remove that the old entity is active
		if(window.viewEntityActive != null) {
			window.viewEntityActive.isActive = false;
		}
		$('.entityIsSelected').removeClass('entityIsSelected')

		window.viewEntityActive = props;

		// Add that our one is active
		if(props.lastContainer != null) {
			props.isActive = true;
			props.lastContainer.addClass('entityIsSelected');
		}

		var entityProps = $('#entityProps');
		entityProps.empty();

		var theTable = $('<table>', {
			class: 'table table-striped'
		}).appendTo(entityProps)
			.append(
				$('<tr>')
					.append($('<th>', {
						text: window.getTranslation(
							'trMapPropertiesKey',
							'Key'
						)
					}))
					.append($('<th>', {
						text: window.getTranslation(
							'trMapPropertiesValue',
							'Value'
						)
					}))
			);

		var toAdd = [];

		for(var key in props) {
			if(hiddenFields[key]) continue;

			toAdd.push(key);
		}

		// Sort a-z
		toAdd.sort();

		// Add tables
		for(var i=0; i<toAdd.length; ++i) {
			var key = toAdd[i];

			theTable.append(
				$('<tr>')
					.append($('<td>', {
						// Auto translation of attributes
						text: window.getTranslation(
							'trInfoMapProperties_key_' + (key).replace(/ /g, ''),
							key
						)
					}))
					.append($('<td>', {
						text: props[key],
						propertyName: key
					}))
			)
		}

		// Allow editing
		theTable
			.editableTableWidget()
			.on('change', function(e, newValue) {
				var propertyName = $(e.target).attr('propertyName');

				// Update the value
				props[propertyName] = '' + newValue;

				// Notify
				alertify.success(window.getTranslation(
					'trSuccessEntityPropertyUpdated',
					'Changed "{{propertyName}}" to "{{newValue}}"', {
						propertyName: propertyName,
						newValue: newValue
					}
				));

				// Mark dirty
				window.setMapExportUpToDate(false);
			});
	}

	function loadPastMap(mapName) {
		// Ensure they have local storage
		if(typeof(localStorage) == 'undefined') return;

		// Set that we are loading
		setIsLoading(true);

		setTimeout(function() {
			ldb.get('maps', function(pastMaps) {
				if(pastMaps == null) return;

				try {
					pastMaps = JSON.parse(pastMaps);
				} catch(e) {
					return;
				}

				var ourPastMap = pastMaps[mapName];
				if(ourPastMap == null) return;

				// Set this as our active map
				window.activeMap = {
					Data: ourPastMap.Data,
					Info: ourPastMap.Info,
					name: mapName
				};

				// Load it
				loadMap();
			});
		}, 1);
	}

	function deletePastMap(mapName) {
		// Ensure they have local storage
		if(typeof(localStorage) == 'undefined') return;

		ldb.get('maps', function(pastMaps) {
			if(pastMaps == null) return;

			try {
				pastMaps = JSON.parse(pastMaps);
			} catch(e) {
				return;
			}

			// Delete it
			delete pastMaps[mapName];

			// Store the change
			ldb.set('maps', JSON.stringify(pastMaps));

			// Update the list
			updatePastMapsList();
		});
	}

	function updatePastMapsList() {
		// Ensure they have local storage
		if(typeof(localStorage) == 'undefined') return;

		// Do we have any past maps?
		ldb.get('maps', function(pastMaps) {
			if(pastMaps == null) return;

			try {
				pastMaps = JSON.parse(pastMaps);
			} catch(e) {
				// do nothing
				return;
			}

			var pastMapsCon = $('#previousMapStore');
			pastMapsCon.empty();

			for(var _mapName in pastMaps) {
				if(pastMaps[_mapName].Data == null || pastMaps[_mapName].Info == null) continue;

				(function(mapName) {
					$('<li>')
						.appendTo(pastMapsCon)
						.append(
							$('<p>', {
								text: mapName
							}).append(
								$('<button>', {
									class: 'btn btn-primary',
									'data-translate': 'trBtnOldSaveLoad',
									text: window.getTranslation(
										'trBtnOldSaveLoad',
										'Load'
									),
									click: function() {
										loadPastMap(mapName);
									}
								})
							).append(
								$('<button>', {
									class: 'btn btn-danger',
									'data-translate': 'trBtnOldSaveDelete',
									text: window.getTranslation(
										'trBtnOldSaveDelete',
										'Delete'
									),
									click: function() {
										alertify.confirm(
											window.getTranslation(
												'trConfirmDeleteMap',
												'Are you sure you want to delete {{0}}?',
												{
													mapName: mapName
												}
											),
											function(){
												// Delete it
												deletePastMap(mapName);
											},
											function(){
												// Do nothing
											});
									}
								})
							)
						);
				})(_mapName);
			}
		});
	}

	// Updates our current map into local storage
	function updateLocalStorage() {
		// Ensure they have local storage
		if(typeof(localStorage) == 'undefined') return;

		// Grab the stored maps
		ldb.get('maps', function(storedMaps) {
			if(storedMaps == null) {
				storedMaps = {};
			} else {
				try {
					storedMaps = JSON.parse(storedMaps);
				} catch(e) {
					storedMaps = {};
				}
			}

			// Store our map
			storedMaps[window.activeMap.name] = {
				Data: window.activeMap.Data,
				Info: window.activeMap.Info
			};

			try {
				// Store into local storage
				ldb.set('maps', JSON.stringify(storedMaps));
			} catch(e) {
				alertify.error(window.getTranslation(
					'trErrorSaveMapLocal',
					'FAILED TO SAVE MAP LOCALLY!'
				));
				alertify.error(e.message);
			}
			
		});
	}

	//ctx.fillStyle = 'green';
	//ctx.fillRect(10, 10, 100, 100);

	window.loadTemplateSave = function(fileName) {
		// Set that it is loading
		setIsLoading(true);

		// Load it, and do it
		/*$.get('../TemplateMaps/' + fileName + '.zxsav', function(data) {
			console.log(data.length);
			loadDataFromFile(data);
		})*/

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../TemplateMaps/' + fileName + '.zxsav', true);
		xhr.responseType = 'blob';
		 
		xhr.onload = function(e) {
			if (this.status == 200) {
				// get binary data as a response
				var blob = this.response;

				var fileOfBlob = new File([blob], fileName + '.zxsav');
				loadDataFromFile(fileOfBlob);
			}
		};

		xhr.onerror = function() {
			// Tell them about the error
			alertify.error(window.getTranslation(
				'trErrorFailedLoadTemplate',
				'Failed to load template.'
			));

			// We are no longer loading
			setIsLoading(false);
		}
		 
		xhr.send();
	}

	// Closure to capture the file information.
    function loadDataFromFile(f) {
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
            	alertify.error(window.getTranslation(
					'trErrorInvalidSaveFile',
					'This does not appear to be a valid "They Are Billions" save file. It is missing "Data" or "Info".'
				));
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
        	alertify.error(window.getTranslation(
				'trErrorLoadingZip',
				'Error loading zip file! {{fileName}} - {{errorMessage}}', {
					fileName: f.name,
					errorMessage: e.message
				}
			));
        	setIsLoading(false);
        });
    }

	$("#file").on("change", function(evt) {
		var files = evt.target.files;
		if(files.length != 1) {
			alertify.error(window.getTranslation(
				'trErrorMultipleFilesSelected',
				'Please select ONLY ONE "They Are Billions" save file.'
			));
			return;
		}

	    loadDataFromFile(files[0]);
	});

	// Undo & Redo
	var _undoHistory = {
		undo: [],
		redo: []
	};

	// Adds undo history
	window.addHistory = function(info) {
		// We can no longer redo actions
		if(_undoHistory.redo.length > 0) {
			_undoHistory.redo = [];
		}

		var shouldAdd = true;

		// Do we have any previous history?
		if(_undoHistory.undo.length > 0) {
			var lastItem = _undoHistory.undo[_undoHistory.undo.length-1];
			if(lastItem.actionSort == info.actionSort) {
				if(lastItem.stackable) {
					// We can totally stack
					shouldAdd = false;

					for(var i=0; i<info.data.length; ++i) {
						lastItem.data.push(info.data[i]);
					}
				}
			}
		}

		// Don't need to add if we already stacked
		if(shouldAdd) {
			// Add to the list of things we can undo
			_undoHistory.undo.push(info);
		}

		// Update the button states
		window.updateHistoryButtonStates();
	};

	// Closes the current stack
	window.closeHistoryStack = function() {
		if(_undoHistory.undo.length > 0) {
			_undoHistory.undo[_undoHistory.undo.length - 1].stackable = false;
		}
	}

	// Updates the buttons
	window.updateHistoryButtonStates = function() {
		var btnUndo = $('#btnHistoryUndo');
		var btnRedo = $('#btnHistoryRedo');

		// Undo
		if(_undoHistory.undo.length > 0) {
			btnUndo.prop('disabled', false);
		} else {
			btnUndo.prop('disabled', true);
		}

		// Redo
		if(_undoHistory.redo.length > 0) {
			btnRedo.prop('disabled', false);
		} else {
			btnRedo.prop('disabled', true);
		}
	}

	// Runs the undo function
	window.executeUndo = function() {
		if(_undoHistory.undo.length <= 0) {
			alertify.error(window.getTranslation(
				'trErrorUndoNothingLeft',
				'There is nothing left to undo.'
			));
			return;
		}

		// Grab the next action
		var nextAction = _undoHistory.undo.pop();

		// Mark it as no longer stackable
		nextAction.stackable = false;

		// Store it onto the list of redo actions
		_undoHistory.redo.push(nextAction);

		// Try to execute it
		switch(nextAction.actionSort) {
			case historyItemDrawPixel:
				handleHistoryDraw(nextAction, false);
			break;

			default:
				alertify.error(window.getTranslation(
					'trErrorNoActionSortHandler',
					'No undo handler for {{actionSort}}', {
						actionSort: nextAction.actionSort
					}
				));
			break;
		}

		// Update the button states
		window.updateHistoryButtonStates();
	};

	// Runs the undo function
	window.executeRedo = function() {
		if(_undoHistory.redo.length <= 0) {
			alertify.error(window.getTranslation(
				'trErrorRedoNothingLeft',
				'There is nothing left to redo.'
			));
			return;
		}

		// Grab the next action
		var nextAction = _undoHistory.redo.pop();

		// Store it onto the list of undo actions
		_undoHistory.undo.push(nextAction);

		// Try to execute it
		switch(nextAction.actionSort) {
			case historyItemDrawPixel:
				handleHistoryDraw(nextAction, true);
			break;

			default:
				alertify.error(window.getTranslation(
					'trErrorNoActionSortHandler',
					'No redo handler for {{actionSort}}', {
						actionSort: nextAction.actionSort
					}
				));
			break;
		}

		// Update the button states
		window.updateHistoryButtonStates();
	};

	// Drawing undo / redo handler
	function handleHistoryDraw(action, shouldRedo) {
		for(var i=0; i<action.data.length; ++i) {
			var theItem = action.data[i];

			var theLayer = window.layerStore[theItem.layer];

			var theNumber;
			if(shouldRedo) {
				theNumber = theItem.redo;
			} else {
				theNumber = theItem.undo;
			}

			// Update the pixel
			updatePixel(
				theLayer,
				theItem.xReverse,
				theItem.y,
				theNumber,
				true
			);
		}
	}
});
