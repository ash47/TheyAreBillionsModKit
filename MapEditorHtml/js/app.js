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

	// update our previous maps
	updatePastMapsList();

	var mapRenderTerrainCanvas = document.getElementById('mapRenderTerrain');
	var mapRenderObjectsCanvas = document.getElementById('mapRenderObjects');
	var helperCanvas = document.getElementById('helperLayer');
	//var ctx = mapRenderCanvas.getContext('2d');

	window.pixelSize = 4;
	var activeMap = null;
	var isMouseDown = false;

	var activeLayer = null;
	var activeToolNumber = 0;

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
		}
	};

	// Saving the map
	window.saveMap = function() {
		// Set that we are saving
		setIsSaving(true);

		// Allow async
		setTimeout(function() {
			// Commit the updates to layers
			loadLayer('LayerTerrain', true);
			loadLayer('LayerObjects', true);

			// Commit the new ser layer
			updateLayerSer();

			// Commit updates to entities
			loadLevelEntities(true);

			// Commit updates to events
			loadLevelEvents(true);

			// Update our local storage
			updateLocalStorage();

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

				// Get the checksum
				blobToBuffer(content, function(err, buff) {
					// Store the checksum
					window.activeMap.checksum = generateChecksum(buff);

					// Set up to date
					window.setMapExportUpToDate(true, true);

					// Set that we are no longer saving
					setIsSaving(false);
				});

				// You can now export the map
				window.setMapExportUpToDate(true);
			});
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

	// Updates which tool is selected
	window.setTool = function(toolName) {
		// Deactivate all old tools buttons
		$('.btnSelectTool')
			.removeClass('btn-success')
			.addClass('btn-primary');

		$('#btn_' + toolName)
			.removeClass('btn-primary')
			.addClass('btn-success');

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

		// Update the preview
		updateMousePreview(true);
	};

	// Updates which layers are visible
	window.updateLayerToggles = function() {
		var terrainVisible = $('#toggleLayerTerrain').is(':checked');
		var objectsVisible = $('#toggleLayerObjects').is(':checked');
		var entitiesVisible = $('#toggleLayerEntities').is(':checked');

		var cTerrain = $(window.layerStore.LayerTerrain.canvas);
		var cObjects = $(window.layerStore.LayerObjects.canvas);
		var mainWindow = $('#mainContainer');

		// Toggle terrain layer
		terrainVisible ?
			cTerrain.show() : 
			cTerrain.hide();

		// Toggle objects later
		objectsVisible ?
			cObjects.show() : 
			cObjects.hide();

		entitiesVisible ? mainWindow.removeClass('hideEntities') : mainWindow.addClass('hideEntities');
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

		if(updateSize) {
			var theSize = window.brushSize * window.pixelSize;

			previewCon.width(theSize);
			previewCon.height(theSize);
		}

		var theOffset = Math.floor( (window.brushSize - 1) / 2);
		
		previewCon.css('left', (prevX - theOffset) * window.pixelSize);
		previewCon.css('top', (prevY - theOffset) * window.pixelSize);

		// Update the position text
		if(prevX != null && prevY != null) {
			var x = (activeLayer.width - prevX - 1);
  			$('#cursorPos').text(prevY + ';' + x);
		}
	};

	var prevX = null;
	var prevY = null;

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

  		// Run the callback
		clickPixel(mouseX, mouseY);
	}).mouseup(function(e) {
		// Mouse is no longer down
		isMouseDown = false;
	}).mousemove(function(e) {
		// Grab offset
		var offset = $(this).offset();

		// Calculate mouseX
		var mouseX = Math.floor((e.pageX - offset.left) / window.pixelSize);
  		var mouseY = Math.floor((e.pageY - offset.top) / window.pixelSize);

		if(isMouseDown) {
			// Run the cll
	  		clickPixel(mouseX, mouseY);

	  		// Calculate the max number of pixels the mouse travelled
	  		var xDist = mouseX - prevX;
	  		var yDist = mouseY - prevY;

	  		var dist = Math.max(
	  			Math.abs(xDist),
	  			Math.abs(yDist)
	  		);

	  		for(var i=1; i<dist; ++i) {
	  			clickPixel(Math.floor(mouseX - i/dist * xDist), Math.floor(mouseY - i/dist * yDist));
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
				updatePixel(activeLayer, x + xx - theOffset, y + yy - theOffset, activeToolNumber);
			}
		}
	}

	// Loads a map from data
	function loadMap() {
		// Ensure we have data loaded
		if(window.activeMap.Data == null || window.activeMap.Info == null) return;

		// Update the local storage of maps
		updateLocalStorage();

		// Set the active layer to terrain
		activeLayer = window.layerStore.LayerTerrain;

		// Load terrain
		loadLayer('LayerTerrain');

		// Load Objects
		loadLayer('LayerObjects');

		// Read main entities chunk
		loadLevelEntities();

		// Read fast entities
		loadFastEntities();

		// Read map events
		loadLevelEvents();

		// Update the entity display
		window.updateEntityMenu();

		// Perform a full re-render of the map
		mapFullRender();

		// Allow export
		$('#btnSaveChanges').removeAttr('disabled');

		// But we aren't up to date
		window.setMapExportUpToDate(false);

		// Update which tool is selected
		window.setTool('toolTerrainEarth');

		// We are no longer loading
		setIsLoading(false);

		// Map is loaded
		$('#mainContainer').addClass('mapIsLoaded	');
	}

	function generateEntityMenu(entityText, entities) {
		if(entities == null) return;

		var outerChildrenAreChecked = true;

		var shouldExpand0 = false;

		var entityData = [];
		for(var entityName in entities) {
			var myEntities = entities[entityName];
			var thisEntityList = [];

			// Used for if we should check this node
			var childrenAreChecked = true;

			// should we expand the node?
			var shouldExpand1 = false;

			// Add all the subnodes
			for(var i=0; i<myEntities.length; ++i) {
				var myEntity = myEntities[i];

				var shouldExpand2 = false;
				if(myEntity.isActive) {
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
					}
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
			text: entityText,
			selectable: false,
			nodes: entityData,
			state: {
				checked: outerChildrenAreChecked,
				expanded: shouldExpand0
			}
		};
	}

	window.updateEntityMenu = function() {
		var theNodeTree = [];

		// Generate the entities subMenu
		var treeEnts = generateEntityMenu('Entities', window.layerStore.entities);
		if(treeEnts != null) theNodeTree.push(treeEnts);

		var treeEnts = generateEntityMenu('FastEntities', window.layerStore.fastEntities);
		if(treeEnts != null) theNodeTree.push(treeEnts);

		var treeEnts = generateEntityMenu('Events', {
			addDirect: window.layerStore.events
		});
		if(treeEnts != null) theNodeTree.push(treeEnts);

		// Create the tree
		var theTree = $('#entityTree').treeview({
			showCheckbox: true,
			levels: 1,
			onNodeSelected: function(event, node) {
				// Check the sort
				if(node.entityReference != null) {
					if(node.__sort == 'Entities') {
						var ref = node.entityReference;
						window.viewEntityProps(window.layerStore.entities[ref.entityName][ref.entryNumber]);
					}

					if(node.__sort == 'FastEntities') {
						var ref = node.entityReference;
						window.viewEntityProps(window.layerStore.fastEntities[ref.entityName][ref.entryNumber]);
					}

					if(node.__sort == 'Events') {
						var ref = node.entityReference;
						window.viewEntityProps(window.layerStore.events[ref.entryNumber]);
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
			alertify.error('Please select an entity to clone.');
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
		alertify.success('Entity was successfully cloned!');
	};

	// Asks if the user really wants to delete the entity
	window.deleteEntityWarning = function() {
		alertify.confirm('Are you sure you want to delete this entity?', function() {
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
			alertify.error('Please select an entity to delete.');
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
				alertify.success('Entity was successfully removed.');

				return;
			}
		}

		// Alert the error
		alertify.error('Failed to get a reference to the entity!');
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
						text: 'Key'
					}))
					.append($('<th>', {
						text: 'Value'
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
						text: key
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
				alertify.success('Changed "' + propertyName + '" to "' + newValue + '"');

				// Mark dirty
				window.setMapExportUpToDate(false);
			});
	}

	function loadPastMap(mapName) {
		// Ensure they have local storage
		if(typeof(localStorage) == 'undefined') return;

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
									text: 'Load',
									click: function() {
										loadPastMap(mapName);
									}
								})
							).append(
								$('<button>', {
									class: 'btn btn-danger',
									text: 'Delete',
									click: function() {
										alertify.confirm('Are you sure you want to delete ' + mapName + '?',
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
				alertify.error('FAILED TO SAVE MAP LOCALLY!');
				alertify.error(e.message);
			}
			
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