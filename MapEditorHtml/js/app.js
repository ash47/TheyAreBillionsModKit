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

		// Update the entity display
		updateEntityMenu();

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

	function updateEntityMenu() {
		var entities = window.layerStore.entities;
		if(entities == null) return;

		var entityData = [];
		for(var entityName in entities) {
			var myEntities = entities[entityName];
			var thisEntityList = [];

			// Add all the subnodes
			for(var i=0; i<myEntities.length; ++i) {
				var myEntity = myEntities[i];

				thisEntityList.push({
					text: myEntity.ID + ' (' + myEntity.Position + ')',
					state: {
						checked: true
					},
					entityReference: {
						entityName: entityName,
						entryNumber: i
					}
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

			// Store it
			entityData.push({
				text: entityName,
				selectable: false,
				nodes: thisEntityList,
				state: {
					checked: true
				}
			});
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

		var theTree = $('#entityTree').treeview({
			showCheckbox: true,
			levels: 2,
			onNodeSelected: function(event, node) {
				if(node.entityReference != null) {
					var ref = node.entityReference;
					window.viewEntityProps(window.layerStore.entities[ref.entityName][ref.entryNumber]);
				}
			},
			onNodeChecked: function(event, node) {
				// Are there subnodes?
				if(node.nodes != null) {
					// Loop over all sub nodes
					for(var i=0; i<node.nodes.length; ++i) {
						// Mark as checked
						var subNode = node.nodes[i];

						theTree.treeview('checkNode', [subNode.nodeId]);
					}
				}

				// Is there an entity we are referencing
				if(node.entityReference != null) {
					var ref = node.entityReference;
					var ent = window.layerStore.entities[ref.entityName][ref.entryNumber];
					var mapEnt = ent.lastContainer;

					// Hide the entity
					mapEnt.show();
				}
			},
			onNodeUnchecked: function(event, node) {
				// Are there subnodes?
				if(node.nodes != null) {
					// Loop over all sub nodes
					for(var i=0; i<node.nodes.length; ++i) {
						// Mark as checked
						var subNode = node.nodes[i];

						theTree.treeview('uncheckNode', [subNode.nodeId]);
					}
				}

				// Is there an entity we are referencing
				if(node.entityReference != null) {
					var ref = node.entityReference;
					var ent = window.layerStore.entities[ref.entityName][ref.entryNumber];
					var mapEnt = ent.lastContainer;

					// Hide the entity
					mapEnt.hide();
				}
			},
			/*onNodeChecked: function(event, node) {
				console.log('asd');

				var sibs = theTree.treeview('getSiblings', node);
				for(var i=0; i<sibs.length; ++i) {
					var sib = sibs[i];

					console.log('sib');

					theTree.treeview('uncheckNode', sib);
				}

				if(node.entityReference != null) {
					var ref = node.entityReference;
					
					var thisEnt = window.layerStore.entities[ref.entityName][ref.entryNumber];



					alert(1)
				}
			},*/
			data: [
				{
					text: 'Entities',
					selectable: false,
					nodes: entityData,
					state: {
						checked: true
					}
				}
			]
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

	window.viewEntityProps = function(props) {
		window.viewEntityActive = props;

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
			if(key == 'rawXML') continue;
			if(key == 'ID') continue;
			if(key == 'Capacity') continue;
			if(key == 'IDEntity') continue;
			if(key == 'lastContainer') continue;

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