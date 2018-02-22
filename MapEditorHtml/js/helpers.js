function loadSection(xmlData, startPoint, endPoint, editFunction, loopMatches, includeHeaders) {
	var firstMatchPos = null;

	// Infinite loop
	while(true) {
		// Grab the start chunk we were looking for
		var startPos = -1;
		if(typeof(startPoint) == 'string') {
			startPos = xmlData.indexOf(startPoint, firstMatchPos);
			if(startPos == -1) return xmlData;

			if(!includeHeaders) {
				startPos += startPoint.length;
			}
		} else {
			if(typeof(startPoint.exec) == 'function') {
				var match = startPoint.exec(xmlData.substr(firstMatchPos));

				if(match && match.index != -1) {
					startPos = match.index + firstMatchPos;

					if(!includeHeaders) {
						startPos += match[0].length;
					}
				}
			}
		}

		if(startPos == -1) return xmlData;

		// Grab the end chunk we were looking for
		var endPos = -1;
		if(typeof(endPoint) == 'string') {
			endPos = xmlData.indexOf(endPoint, startPos);

			if(includeHeaders) {
				endPos += endPoint.length;
			}
		} else {
			if(typeof(endPoint.exec) == 'function') {
				var match = endPoint.exec(xmlData.substr(startPos));

				if(match && match.index != -1) {
					endPos = match.index + startPos;

					if(includeHeaders) {
						endPos += match[0].length;
					}
				}
			}
		}
		
		if(endPos == -1) return xmlData;

		// Grab the data we wanted to edit
		var toEditData = xmlData.substring(startPos, endPos);

		// Attempt an edit
		var possibleReturn = editFunction(toEditData);
		if(possibleReturn != null) {
			// There was a change, merge the change
			xmlData = xmlData.substring(0, startPos) + possibleReturn + xmlData.substring(endPos);
		}

		// Are we going to continue looping and find more matches?
		if(!loopMatches) {
			// Nope, return the modified data
			return xmlData;
		}

		// Store where this match was
		firstMatchPos = endPos;
	}
}

function loadLayerSimple(layerName, mergeExtra, commitUpdate) {
	// Edit layer
	var res = loadSection(
		window.activeMap.Data,
		'<Simple name="' + layerName + '" value="',
		'" />',
		function(theData2) {
			// Load it

			if(mergeExtra != null) {
				theData2 = mergeExtra + theData2;
			}

			var thisRes = loadLayerDirect(layerName, theData2, true, commitUpdate);

			if(thisRes != null && mergeExtra != null) {
				thisRes = thisRes.substr(mergeExtra.length);
			}

			return thisRes;
		}
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

function loadLayer(layerName, commitUpdate) {
	// Edit layer
	var res = loadSection(
		window.activeMap.Data,
		'<Complex name="' + layerName + '">',
		'</Complex>',
		function(theData) {
			return loadSection(
				theData,
				'<Simple name="Cells" value="',
				'" />',
				function(theData2) {
					// Load it
					return loadLayerDirect(layerName, theData2, false, commitUpdate);
				}
			)
		}
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

function loadLayerDirect(layerName, layerData, isSigned, commitUpdate) {
	var dataParts = layerData.split('|');
	if(dataParts.length != 3) {
		alertify.error(
			window.getTranslation(
				'trErrorUnknownLengthForLayer',
				'Unknown length for terrain layer -- {{id}}',
				{
					id: dataParts.length
				}
			));
		return;
	}

	// Ensure there is a layer store
	window.layerStore[layerName] = window.layerStore[layerName] || {};
	var myLayer = window.layerStore[layerName];

	// Are we doing an update?
	if(commitUpdate) {
		// We are doing an update
		var base64Data = mapArrayToBase64(myLayer.data, isSigned);
		return myLayer.width + '|' + myLayer.height + '|' + base64Data;
	} else {
		// Store the data
		myLayer.width = parseInt(dataParts[0]);
		myLayer.height = parseInt(dataParts[1]);
		myLayer.data = base64MapToArray(dataParts[2], isSigned);
	}
}

// Converts a base64 string into a 1d array that can be used in other functions
function base64MapToArray(data, isSigned) {
	var buf = new buffer.Buffer(data, 'base64');

	// Map size info
	var intSize = 4;
	var totalData = Math.floor(buf.length / intSize);
	var outputArray = [];

	// Read in map
	for (var i = 0; i < totalData; i++) {
		if(isSigned) {
			outputArray[i] = buf.readInt32LE(i * intSize);
		} else {
			outputArray[i] = buf.readUInt32LE(i * intSize);
		}
	}

	return outputArray;
}

// Converts an array of image data to a base64 string
function mapArrayToBase64(someArray, isSigned) {
	var intSize = 4;

	var buff = new buffer.Buffer(someArray.length * intSize);

	for(var i=0; i<someArray.length; ++i) {
		if(isSigned) {
			buff.writeInt32LE(someArray[i], i * intSize);
		} else {
			buff.writeUInt32LE(someArray[i], i * intSize);
		}
	}

	return buff.toString('base64');
}

function getRBG(oldColor) {
	return 'rgba(' +
		oldColor.red + ', ' +
		oldColor.green + ', ' + 
		oldColor.blue + ', ' +
		(oldColor.alpha / 255) +
	')';
}

// Renders a terrain
function renderLayer(layerName) {
	var mapData = window.layerStore[layerName];

	// Grab the data
	var width = mapData.width;
	var height = mapData.height;

	// Grab the canvas
	var canvas = mapData.canvas;
	var ctx = canvas.getContext('2d');

	// Change the canvas's size
	canvas.width = width * window.pixelSize;
	canvas.height = height * window.pixelSize;

	// Popular the image based on the numbers from the files
	for(var y=0; y<height; ++y) {
		for(var x=0; x<width; ++x) {
			renderPixel(mapData, x, y);
		}
	}
}

// Renders a pixel
function renderPixel(mapData, x, y) {
	var canvas = mapData.canvas;
	var ctx = canvas.getContext('2d');

	var width = mapData.width;

	var mapPos = width * y + x;

	// Data is stored inverted
	if(mapData.name == 'LayerFog') {
		mapPos = width * x + y;
	}

	var theNumber = mapData.data[mapPos];
	var theColor = mapData.colorMap[theNumber] || mapData.defaultColor;

	var theX = (width - x - 1) * window.pixelSize;
	var theY = (y) * window.pixelSize;

	// Do we need to do a clear?
	if(theColor.alpha < 255) {
		ctx.clearRect(theX, theY, window.pixelSize, window.pixelSize);
	}

	ctx.fillStyle = getRBG(theColor);
	ctx.fillRect(theX, theY, window.pixelSize, window.pixelSize);
}

// Updates a pixel
function updatePixel(mapData, xReverse, y, theNumber, noHistory) {
	// Is the number well defined, or should we pick a random one?
	if(typeof(theNumber) != 'string' && typeof(theNumber) != 'number') {
		theNumber = theNumber[Math.floor(Math.random()*theNumber.length)];
	}

	var width = mapData.width;

	// do not allow invalid pixels to be updated
	if(x < 0 || x >= width || y < 0 || y >= mapData.height) return;

	// We need to convert xReverse into x
	var x = (width - xReverse - 1);

	// We need to grab the datastore position
	var mapPos = width * y + x;

	if(mapData.name == 'LayerFog') {
		mapPos = width * x + y;
	}

	if(mapData.data[mapPos] != theNumber) {
		// Add undo history
		if(!noHistory) {
			window.addHistory({
				actionSort: historyItemDrawPixel,
				stackable: true,
				data: [{
					layer: mapData.name,
					xReverse: xReverse,
					y: y,
					redo: theNumber,
					undo: mapData.data[mapPos]
				}]
			});
		}

		// Store it
		mapData.data[mapPos] = theNumber;

		// Re-render the canvas for this pixel
		renderPixel(mapData, x, y);

		// We are no longer up to date
		window.setMapExportUpToDate(false);
	}
}

function renderEntitiesLayer(entities, onlyUpdatePositions) {
	if(entities == null) return;

	for(var entityType in entities) {
		var entList = entities[entityType];

		for(var i=0; i<entList.length; ++i) {
			var theEnt = entList[i];

			if(onlyUpdatePositions) {
				if(theEnt.lastContainer != null && theEnt.__posInfo != null) {
					// Calculate offsets
					var newWidth = theEnt.__posInfo.width * window.zoomFactor + 'px';
					var newHeight = theEnt.__posInfo.height * window.zoomFactor + 'px';
					var newX = theEnt.__posInfo.posX * window.zoomFactor + 'px';
					var newY = theEnt.__posInfo.posY * window.zoomFactor + 'px';

					// Move the ent / resize it
					theEnt.lastContainer.css('width', newWidth);
					theEnt.lastContainer.css('height', newHeight);
					theEnt.lastContainer.css('left', newX);
					theEnt.lastContainer.css('top', newY);

					// Update draggable grid
					theEnt.lastContainer.draggable('option', 'grid', [window.zoomFactor, window.zoomFactor] );
				}
			} else {
				// Last entity is null
				theEnt.lastContainer = null;

				// Should we draw it?
				if(!theEnt.shouldHide) {
					// Add the visual ent
					addVisualEnt(entList[i]);
				}
			}
		}
	}
}

function renderEntities(onlyUpdatePositions) {
	if(!onlyUpdatePositions) {
		// Remove past entities
		$('.mapEntity').remove();
	}

	renderEntitiesLayer(window.layerStore.entities, onlyUpdatePositions);
	renderEntitiesLayer(window.layerStore.extraEntities, onlyUpdatePositions);
}

function getEntityOffsets(ent) {
	// Do we know what kind of entity this is?
	if(ent.__entityType != null) {
		// Yep, lets see if we have scaling information
		var niceEntityType = ent.__entityType.split(',')[0];

		var entitySizeInfo = window.entitySizes[niceEntityType];

		if(ent.Size != null) {
			var possibleParts = ent.Size.split(';');
			if(possibleParts.length == 2) {
				var partX = parseFloat(possibleParts[0]);
				var partY = parseFloat(possibleParts[1]);

				if(!isNaN(partX) && partX > 0 && !isNaN(partY) && partY > 0) {
					entitySizeInfo = {
						width: partX,
						height: partY
					};
				}
			}
		}

		if(entitySizeInfo != null) {
			// We do, store it
			var scaleWidth = entitySizeInfo.width;
			var scaleHeight = entitySizeInfo.height;

			// Adjust offset
			//var posX = - Math.ceil((entitySizeInfo.width - 1 - 0.5) / 2);
			//var posY = - Math.ceil((entitySizeInfo.height - 1) / 2);

			var posX = 0;
			var posY = 0;

			switch(scaleWidth) {
				case 3:
					posX -= 1;
				break;

				case 4:
					posX -= 1;
				break;

				case 5:
					posX = -2;
				break;
			}

			switch(scaleHeight) {
				case 2:
					posY -= 1;
				break;

				case 3:
					posY -= 1;
				break;

				case 4:
					posY -= 2;
				break;

				case 5:
					posY = -2;
				break;
			}

			if(ent.__entityType == 'ZX.Components.CUnitGenerator') {
				
			}

			return {
				width: scaleWidth,
				height: scaleHeight,
				offsetX: posX,
				offsetY: posY
			};
		}
	}

	return {
		width: 1,
		height: 1,
		offsetX: 0,
		offsetY: 0
	};
}

function addVisualEnt(ent) {
	var pos = ent.Position;
	if(pos == null) return;

	var width = window.layerStore.LayerTerrain.width;

	var posParts = pos.split(';');
	var posX = (width - parseInt(posParts[1]) - 1);
	var posY = parseInt(posParts[0]);

	// Remove it if it already exist
	if(ent.lastContainer != null) {
		ent.lastContainer.remove();
	}

	var entName = (ent.__entityType || 'unknown').split(',')[0];

	var red = Math.floor(Math.random() * 255);
	var green = Math.floor(Math.random() * 255);
	var blue = Math.floor(Math.random() * 255);

	if(unitColorMap[entName] != null) {
		red = unitColorMap[entName].red;
		green = unitColorMap[entName].green;
		blue = unitColorMap[entName].blue;
	}

	var cssColor = 'rgb(' + red + ',' + green + ',' + blue + ')';
	var cssColor2 = 'rgb(' + (255-red) + ',' + (255-green) + ',' + (255-blue) + ')';

	// Grab offsets and make adjustments
	var offsets = getEntityOffsets(ent);
	posX += offsets.offsetX;
	posY += offsets.offsetY;

	// Store vars onto it
	ent.__posInfo = {
		posX: posX,
		posY: posY,
		width: offsets.width,
		height: offsets.height
	};

	// Update position to reflect the actual drawing
	posX = posX * window.zoomFactor;
	posY = posY * window.zoomFactor;

	ent.lastContainer = $('<div>', {
		class: 'mapEntity',
		mousedown: function() {
			// Is this entity active?
			if(!ent.isActive) {
				// Nope, view it, and load the menu:
				window.viewEntityProps(ent);
				window.updateEntityMenu();
			}
		}
	})
		.css('width', (offsets.width * window.zoomFactor) + 'px')
		.css('height', (offsets.height * window.zoomFactor) + 'px')
		.css('background-color', cssColor)
		.css('border', '1px solid ' + cssColor2)
		.css('position', 'absolute')
		.css('top', posY + 'px')
		.css('left', posX + 'px')
		.appendTo($('#mapDisplayHolder'))
		.append($('<span>', {
			class: 'mapEntityText',
			text: entName
		}));

	if(entName == 'ZX.Components.CUnitGenerator') {
		ent.lastContainer.addClass('rotateEntity');
	}

	// Should we hide it?
	if(ent.shouldHide) {
		ent.lastContainer.hide();
	}

	// Are we active?
	if(ent.isActive) {
		ent.lastContainer.addClass('entityIsSelected');
	}

	// Make it dragable
	ent.lastContainer.draggable({
		// Not allowed out of terrain area
		containment: $('#helperLayer'),
		stack: '.mapEntity',
		grid: [window.zoomFactor, window.zoomFactor],
		stop: function(event, ui) {
			var xNice = ui.position.left;
			var yNice = ui.position.top;

			xNice -= offsets.offsetX;
			yNice -= offsets.offsetY;

			xNice = xNice / window.zoomFactor;
			yNice = yNice / window.zoomFactor;

			var x = (width - xNice - 1).toFixed(0);
			var y = yNice.toFixed(0);

			var mapCoords = y + ';' + x;

			ent.Position = mapCoords;

			// When props are changed
			window.onPropsChanged(ent);
		}
	});
}

// Generates a checksum for a string
function generateChecksum(str) {
	var buff = new buffer.Buffer(str);

	var num = 0;

	for(var i = 0; i < buff.length; i++) {
		num += buff.readUInt8(i);

		// Handle overflow
		num = num % 4294967296;
	}
	
	return (num * 157 + num) % 4294967296;
}

function blobToBuffer(blob, callback) {
	if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
		throw new Error('first argument must be a Blob');
	}

	if (typeof callback !== 'function') {
		throw new Error('second argument must be a function');
	}

	var reader = new FileReader();

	function onLoadEnd (e) {
		reader.removeEventListener('loadend', onLoadEnd, false);
		if(e.error) {
			callback(e.error);
		} else {
			callback(null, buffer.Buffer.from(reader.result));
		}
	}

	reader.addEventListener('loadend', onLoadEnd, false);
	reader.readAsArrayBuffer(blob);
}

function replaceEntityProperty(entityXML, useReplace1, regexMatch1, regexMatch2, replace1, replace2) {
	var theRes = null;
	if(useReplace1) {
		theRes = replace1;
	} else {
		theRes = replace2;
	}

	if(regexMatch1 != null) entityXML = entityXML.replace(regexMatch1, theRes);
	if(regexMatch2 != null) entityXML = entityXML.replace(regexMatch2, theRes);

	return entityXML;
}

function updateLayerSer() {
	// Edit layer
	var res = loadSection(
		window.activeMap.Data,
		'<Simple name="SerTerrainResourceCells" value="',
		'" />',
		function(theData) {
			var layerTerrain = window.layerStore.LayerTerrain;
			var layerObjects = window.layerStore.LayerObjects;

			var mergedBuff = [];

			for(var i=0; i<layerObjects.data.length; ++i) {
				// Get the number from objects
				var theNumber = layerObjects.data[i];

				var mapFile = mapSerTerrain.objects;

				// Was there nothing here?
				if(theNumber == 0) {
					// Get the number from terrain instead
					mapFile = mapSerTerrain.terrain;
				}

				mergedBuff[i] = mapFile[theNumber] || 0;
			}

			return layerTerrain.width + '|' + layerTerrain.height + '|' + mapArrayToBase64(mergedBuff, false);
		}
	);

	if(res != null) {
		window.activeMap.Data = res;
	}
}

function extractOrReplaceMapProp(theData, propName, storage, commitUpdate) {
	var regex = new RegExp('<Simple name="' + propName + '" value="([^"]*)" \\/>', 'g');

	if(commitUpdate) {
		if(storage[propName] != null) {
			theData = theData.replace(regex, '<Simple name="' + propName + '" value="' + storage[propName] + '" />');
		}
	} else {
		// Find and store the match
		var theMatch = (regex.exec(theData) || [])[1] || '';

		storage[propName] = theMatch;
	}

	return theData;
}

// Allows map props to be loaded / edited
function loadMapProps(commitUpdate) {
	// Grab useful stuff
	var theData = window.activeMap.Data;
	var storage = window.layerStore.MapProps || {};
	window.layerStore.MapProps = storage;

	// Extract / commit the data
	var toExtract = [
		'ShowFullMap',
		'FoodReserved',
		'WorkersReserved',
		'EnergyReserved',
		'WoodProductionReserved',
		'StoneProductionReserved',
		'IronProductionReserved',
		'OilProductionReserved',
		'NTurnsWithNegativeGold',
		'NTurnsWithNegativeFood',
		'ArmyGoldCost',
		'ArmyFoodPenaltyCost',
		'StructuresGoldCost',
		'TotalGoldPerColonists',
		'NMarkets',
		'MaxGoldByExportingExcedents',
		'Wood',
		'Stone',
		'Iron',
		'Oil',
		'Gold',
		'WoodProduction',
		'GoldProduction',
		'IronProduction',
		'StoneProduction',
		'OilProduction',
		'NZombiesDead',
		'NSoldiersDead',
		'NColonistsDead',
		'MaxColonists',
		'NColonistsInfected',
		'GameTime',
		'LastGameTimeIAUpdate',
		'Date',
		'Physics_TimeLastBodyPosition',
		'Physics_TimeBodyPosition',
		'Physics_FactorTimeForInterpolation',
		'Physics_LastTimeUpdatePhysics',
		'Seed',
		'ThemeType',
		'FactorGameDuration',
		'FactorZombiePopulation',
		'DifficultyType',
		'Difficulty',
		'PlayableArea',
		'FactorPlayableArea'
	];

	// We need two cell size values:
	/*loadSection(
		theData,
		'<Complex name="CurrentGeneratedLevel">',
		'<Simple name="FactorPlayableArea"',
		function(interestingData) {
			loadSection(
				interestingData,
				'<Simple name="NCells" value="',
				'" />',
				function(res) {
					storage.__ncells1 = parseInt(res);
				}
			);
		}
	);*/

	// Real ncells
	loadSection(
		theData,
		'<Complex name="SurvivalModeParams">',
		'</Complex>',
		function(theData2) {
			loadSection(
				theData2,
				'<Simple name="NCells" value="',
				'" />',
				function(interestingData) {
					storage._ncellsReal = parseInt(interestingData);
				}
			);
		}
	);

	// Map Theme
	if(commitUpdate) {
		storage.ThemeType = $('#dropdownMapTheme').val();
	}

	for(var i=0; i<toExtract.length; ++i) {
		theData = extractOrReplaceMapProp(theData, toExtract[i], storage, commitUpdate);
	}

	// Map Name
	var fieldName = '<Simple name="Name" value="';
	var fieldNamePos = theData.lastIndexOf(fieldName);
	if(fieldNamePos != -1) {
		fieldNamePos += fieldName.length;

		var endFieldPos = theData.indexOf('"', fieldNamePos);

		if(commitUpdate) {
			// Read in the new map name
			storage._mapName = $('#inputSaveFileName').val();

			if(storage._mapName != null && storage._mapName.length > 0) {
				theData = theData.substring(0, fieldNamePos) +
					storage._mapName +
					theData.substring(endFieldPos);
			}
		} else {
			var mapName = theData.substring(fieldNamePos, endFieldPos);
			storage._mapName = mapName;	

			// Put it into the element
			$('#inputSaveFileName').val(mapName);
		}
	}
	
	// Do we commit?
	if(commitUpdate) {
		window.activeMap.Data = theData;
	} else {
		// We need to store stuff back into the UI

		// Map Theme
		$('#dropdownMapTheme').val(storage['ThemeType']);
	}
};

// Loads info about the map
function loadInfo(commitUpdate) {
	if(commitUpdate) {
		var mapInfo = window.mapInfo;
		if(mapInfo == null) return;

		var info = window.activeMap.Info;
		if(info == null) return;

		var mapTitle = mapInfo.title;

		// Update title
		info = info.replace(
			/<Simple name="Name" value="([^"]*)" \/>/,
			'<Simple name="Name" value="' + mapTitle + '" />'
		);

		// Update filename
		info = info.replace(
			/<Simple name="FileName" value="([^"]*)" \/>/,
			'<Simple name="FileName" value="' + mapTitle + '.zxsav" />'
		);

		// This is now our active map name
		window.activeMap.name = mapTitle + '.zxsav'

		// Store the new info
		window.activeMap.Info = info;

		return;
	}

	var mapInfo = {};
	window.mapInfo = mapInfo;

	var info = window.activeMap.Info;
	if(info == null) return;

	var mapTitle = (/<Simple name="Name" value="([^"]*)" \/>/.exec(info) || [])[1] || 'Untitled';

	// Store the title
	mapInfo.title = mapTitle;

	// Update it in the UI
	$('#mapNameHolder').val(mapTitle);
};

// Allows loading of extra entities
function loadLevelExtraEntites(commitUpdate) {
	var matchStart = '<Collection name="ExtraEntities" elementType="DXVision.DXEntity, DXVision">';
	var matchEnd = /<\/Complex>[\n\r ]*<\/Items>[\n\r ]*<\/Collection>/;

	// Attempt to load using standard mode
	var useAltMode = true;
	loadSection(window.activeMap.Data,
		matchStart,
		matchEnd,
		function() {
			// Standard mode works, don't use alt
			useAltMode = false;
		}, false, true
	);

	// If we should use alt, change it
	if(useAltMode) {
		matchEnd = /<\/Collection>/
	}

	// Find the part we need to edit
	var res = loadSection(
		window.activeMap.Data,
		matchStart,
		matchEnd,
		function(theData) {
			var theStorage;
			if(commitUpdate) {
				theStorage = window.layerStore.extraEntities || {};
			} else {
				theStorage = {};
				window.layerStore.extraEntities = theStorage;
			}

			// Used if we use commit mode
			//var newStorage = {};

			// Can we make changes?
			if(commitUpdate) {
				// We will use referenceData to build a new xmlData output

				var theOutput = '';
				theOutput += '<Collection name="ExtraEntities" elementType="DXVision.DXEntity, DXVision">\n';

				var totalNewEnts = 0;
				for(var key in theStorage) {
					totalNewEnts += theStorage[key].length;
				}

				theOutput += '<Properties>\n';
				theOutput += '<Simple name="Capacity" value="' + totalNewEnts + '" />\n';
				theOutput += '</Properties>\n';

				theOutput += '<Items>\n';
				
				for(var entityType in theStorage) {
					var allEntitiesOfThisType = theStorage[entityType];
					for(var i=0; i<allEntitiesOfThisType.length; ++i) {
						var thisEntity = allEntitiesOfThisType[i];
						var thisXML = thisEntity.rawXML;

						var newEntityId = ++window.totalEntities;

						// Normal properties
						for(propertyName in thisEntity) {
							// Ignore these properties
							if(hiddenFields[propertyName]) continue;

							var theValue = thisEntity[propertyName];
							theValue = '<Simple name="' + propertyName + '" value="' + theValue + '" />';
							/*if(theValue == null || theValue == "") {
								theValue = '<Null name="' + propertyName + '" />';
							} else {
								theValue = '<Simple name="' + propertyName + '" value="' + theValue + '" />';
							}*/

							// Replace the property
							thisXML = thisXML.replace(
								new RegExp('<Simple name="' + propertyName + '" value="[^"]*" \/>'),
								theValue
							);
						}

						// EntityId again
						/*thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple name="ID" value="[^"]*" \/>/,
							null,
							'<Simple name="ID" value="' + newEntityId + '" />'
						);*/

						// Add the XML
						theOutput += thisXML;
					}
				}

				theOutput += '</Items>\n';
				theOutput += '</Collection>';

				return theOutput;
			}

			loadSection(
				theData,
				/<Complex( type="[^"]*")?>/,
				/<Simple name="Z_Offset" value="[^"]*" \/>[\n\r ]*<\/Properties>[\n\r ]*<\/Complex>/,
				function(theData2) {
					var thisEntityStore = window.extractEntityInfo(theData2);

					var entityType = thisEntityStore.__entityType;
					theStorage[entityType] = theStorage[entityType] || [];
					theStorage[entityType].push(thisEntityStore);

					// Hidden by default
					thisEntityStore.shouldHide = true;

					// Store a reference to the store
					thisEntityStore.__theStore = theStorage[entityType];
				}, true, true
			);
		}, false, true
	);

	if(commitUpdate && res != null) {
		window.activeMap.Data = res;
	}
}

// Extracts the info from an entity
window.extractEntityInfo = function(thisItemData) {
	var entityType = (/<Complex type="([^"]*)">/.exec(thisItemData) || [])[1] || 'Unknown';

	/*var findEntityId = /<Simple[ ]*value="([^"]*)"[ ]*\/>/;
	var possibleEntityId = findEntityId.exec(thisItemData);
	if(possibleEntityId == null || possibleEntityId.length != 2) return;
	var entityId = possibleEntityId[1];*/

	var thisEntityStore = {};

	var blackListedProps = {};

	var propertyExtractor = /<Simple name="([^"]*)" value="([^"]*)" \/>/g;
	var theMatch;
	while((theMatch = propertyExtractor.exec(thisItemData)) != null) {
		if(theMatch.length < 3) continue;

		// Grab stuff
		var propertyName = theMatch[1];
		var propertyValue = theMatch[2];

		// Is this blacklisted?
		if(blackListedProps[propertyName]) continue;

		// Have we already collected this prop?
		if(thisEntityStore[propertyName] != null) {
			// We are not touching this prop
			delete thisEntityStore[propertyName];
			blackListedProps[propertyName] = true;
			continue;
		}

		// Store it
		thisEntityStore[propertyName] = propertyValue;
	}

	// Add raw xml
	thisEntityStore.rawXML = thisItemData;

	// Store the entity type
	thisEntityStore.__entityType = entityType;

	// Return it
	return thisEntityStore;
}

// Load in the bonus entities
function loadBonusEntities(commitUpdate) {
	var res = loadSection(
		window.activeMap.Data,
		'<Dictionary name="BonusEntityTemplates" keyType="System.UInt64, mscorlib" valueType="System.Int32, mscorlib">',
		'</Dictionary>',
		function(theData) {
			if(commitUpdate) {
				// Commit the update

				var theOutput = '';
				theOutput += '<Dictionary name="BonusEntityTemplates" keyType="System.UInt64, mscorlib" valueType="System.Int32, mscorlib">\n';

				var bonusEnts = window.layerStore.bonusEntities;

				if(bonusEnts.length <= 0) {
					theOutput += '<Items />\n'
				} else {
					theOutput += '<Items>\n';

					for(var i=0; i<bonusEnts.length; ++i) {
						var bonusEnt = bonusEnts[i];

						theOutput += '<Item>\n'
						theOutput += '<Simple value="' + bonusEnt[0] + '" />\n'
						theOutput += '<Simple value="' + bonusEnt[1] + '" />\n'
						theOutput += '</Item>\n';
					}

					theOutput += '</Items>\n';
				}

				theOutput += '</Dictionary>';

				return theOutput;
			}

			// Empty the layer store
			window.layerStore.bonusEntities = [];

			loadSection(
				theData,
				'<Item>',
				'</Item>',
				function(theData2) {
					var dataParts = [];

					loadSection(
						theData2,
						'<Simple value="',
						'" />',
						function(theData3) {
							// Push the data parts;
							dataParts.push(theData3);
						}, true, false
					)

					// Check if this is a valid bonus entity
					if(dataParts.length == 2) {
						window.layerStore.bonusEntities.push(dataParts);
					}
				}, true, true
			);

			// Add these bonus entities into the display
			window.rebuildBonusEntities();
		}, false, true
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

// Allows entities in the level to be edited
function loadLevelEntities(commitUpdate) {
	// Find the part we need to edit
	var res = loadSection(
		window.activeMap.Data,
		'<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">',
		/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>[\n\r ]*<\/Items>[\n\r ]*<\/Dictionary>/,
		function(theData) {
			// We need to break this into individual entities

			// Can we make changes?
			if(commitUpdate) {
				// We will use referenceData to build a new xmlData output

				var theOutput = '';
				theOutput += '<Dictionary name="LevelEntities" keyType="System.UInt64, mscorlib" valueType="DXVision.DXEntity, DXVision">\n';
				theOutput += '<Items>\n';
				
				for(var entityType in window.layerStore.entities) {
					var allEntitiesOfThisType = window.layerStore.entities[entityType];
					for(var i=0; i<allEntitiesOfThisType.length; ++i) {
						var thisEntity = allEntitiesOfThisType[i];
						var thisXML = thisEntity.rawXML;

						var newEntityId = ++window.totalEntities;

						// Normal properties
						for(propertyName in thisEntity) {
							// Ignore these properties
							if(hiddenFields[propertyName]) continue;

							var theValue = thisEntity[propertyName];
							if(theValue == null || theValue == "") {
								theValue = '<Null name="' + propertyName + '" />';
							} else {
								theValue = '<Simple name="' + propertyName + '" value="' + theValue + '" />';
							}

							// Replace the property
							thisXML = thisXML.replace(
								new RegExp('<Simple name="' + propertyName + '" value="[^"]*" \/>'),
								theValue
							);
						}

						// EntityId
						thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple value="[^"]*" \/>/,
							null,
							'<Simple value="' + newEntityId + '" />'
						);

						// EntityId again
						thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple name="ID" value="[^"]*" \/>/,
							null,
							'<Simple name="ID" value="' + newEntityId + '" />'
						);

						// Add the XML
						theOutput += thisXML;
					}
				}

				theOutput += '</Items>\n';
				theOutput += '</Dictionary>';

				return theOutput;
			}

			var allEntities = {};
			
			// This will edit every individual item in the map
			loadSection(
				theData,
				'<Item>',
				/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Item>/,
				function(thisItemData) {
					// Return an empty string from here to delete the entity!

					var thisEntityStore = window.extractEntityInfo(thisItemData);

					var entityType = thisEntityStore.__entityType;
					allEntities[entityType] = allEntities[entityType] || [];
					allEntities[entityType].push(thisEntityStore);

					// Hidden by default
					thisEntityStore.shouldHide = true;

					// Store a reference to the store
					thisEntityStore.__theStore = allEntities[entityType];
				}, true, true);

			// Store all the entities
			window.layerStore.entities = allEntities;
		}, false, true
	);

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

function loadLevelEvents(commitUpdate) {
	var res = loadSection(
		window.activeMap.Data,
		'<Collection name="LevelEvents" elementType="ZX.GameSystems.ZXLevelEvent, TheyAreBillions">',
		/<\/Properties>[\n\r ]*<\/Complex>[\n\r ]*<\/Items>[\n\r ]*<\/Collection>/, function(theData) {
			if(commitUpdate) {
				var events = window.layerStore.events || [];

				var theOutput = '';
				theOutput += '<Collection name="LevelEvents" elementType="ZX.GameSystems.ZXLevelEvent, TheyAreBillions">\n';
				theOutput += '<Properties>\n';
				theOutput += '<Simple name="Capacity" value="' + events.length + '" />\n';
				theOutput += '</Properties>\n';
				theOutput += '<Items>\n';

				var entProp = function(ent, prop) {
					if(ent[prop] == null || ent[prop] == '') {
						return '<Null name="' + prop + '" />\n';
					} else {
						return '<Simple name="' + prop + '" value="' + ent[prop] + '" />\n';
					}
				};

				var totalEvents = 0;

				for(var i=0; i<events.length; ++i) {
						var thisEntity = events[i];
						var thisXML = thisEntity.rawXML;

						var newEntityId = ++totalEvents;

						// Normal properties
						for(propertyName in thisEntity) {
							// Ignore these properties
							if(hiddenFields[propertyName]) continue;

							var theValue = thisEntity[propertyName];
							if(theValue == null || theValue == "") {
								theValue = '<Null name="' + propertyName + '" />';
							} else {
								theValue = '<Simple name="' + propertyName + '" value="' + theValue + '" />';
							}

							// Replace the property
							thisXML = thisXML.replace(
								new RegExp('<Simple name="' + propertyName + '" value="[^"]*" \/>'),
								theValue
							);
						}

						// EntityId again
						thisXML = replaceEntityProperty(
							thisXML,
							true,
							/<Simple name="ID" value="[^"]*" \/>/,
							null,
							'<Simple name="ID" value="' + newEntityId + '" />'
						);

						// Add the XML
						theOutput += thisXML;
					}

				theOutput += '</Items>\n';
				theOutput += '</Collection>\n';

				return theOutput;
			}

			var allEvents = [];

			loadSection(
				theData,
				/<Complex>[\n\r ]*<Properties>/,
				/name="Music"( value="[^"]*")? \/>[\n\r ]*<\/Properties>[\n\r ]*<\/Complex>/,
				function(possibleEntity) {
					var thisEntityStore = {};
					allEvents.push(thisEntityStore);

					var blackListedProps = {};

					var propertyExtractor = /<Simple name="([^"]*)" value="([^"]*)" \/>/g;
					var theMatch;
					while((theMatch = propertyExtractor.exec(possibleEntity)) != null) {
						if(theMatch.length < 3) continue;

						// Grab stuff
						var propertyName = theMatch[1];
						var propertyValue = theMatch[2];

						// Is this blacklisted?
						if(blackListedProps[propertyName]) continue;

						// Have we already collected this prop?
						if(thisEntityStore[propertyName] != null) {
							// We are not touching this prop
							delete thisEntityStore[propertyName];
							blackListedProps[propertyName] = true;
							continue;
						}

						// Store it
						thisEntityStore[propertyName] = propertyValue;
					}

					// Add raw xml
					thisEntityStore.rawXML = possibleEntity;

					// Hide it
					thisEntityStore.shouldHide = true;

					// Add a reference to the store
					thisEntityStore.__theStore = allEvents;
				},
				true, true
			);

			// Store it
			window.layerStore.events = allEvents;
		}, false, true);

	if(commitUpdate && res != null) {
		window.activeMap.Data = res;
	}
}

function loadFastEntities(commitUpdate) {
	var fastEnts = {};

	if(commitUpdate) {
		fastEnts = window.layerStore.fastEntities;
	}

	// Find the part we need to edit
	var res = loadSection(
		window.activeMap.Data,
		'<Dictionary name="LevelFastSerializedEntities" keyType="System.UInt64, mscorlib" valueType="System.Collections.Generic.List`1[[DXVision.DXTupla2`2[[System.UInt64, mscorlib],[System.Drawing.PointF, System.Drawing]], DXVision]], mscorlib">',
		'</Dictionary>',
		function(theData) {
			if(commitUpdate) {
				// TODO: Commit the update

				var theOutput = '';
				theOutput += '<Dictionary name="LevelFastSerializedEntities" keyType="System.UInt64, mscorlib" valueType="System.Collections.Generic.List`1[[DXVision.DXTupla2`2[[System.UInt64, mscorlib],[System.Drawing.PointF, System.Drawing]], DXVision]], mscorlib">\n';
				theOutput += '<Items>\n';

				for(var entType in fastEnts) {
					var theseEnts = fastEnts[entType];

					if(theseEnts.length > 0) {
						theOutput += '<Item>\n';
						theOutput += '<Simple value="' + entType + '" />\n';
						theOutput += '<Collection elementType="DXVision.DXTupla2`2[[System.UInt64, mscorlib],[System.Drawing.PointF, System.Drawing]], DXVision">\n';

						theOutput += '<Properties>\n';
						theOutput += '<Simple name="Capacity" value="' + theseEnts.length + '" />\n';
						theOutput += '</Properties>\n';

						theOutput += '<Items>\n';

						for(var i=0; i<theseEnts.length; ++i) {
							var thisEnt = theseEnts[i];

							var newEntityId = ++window.totalEntities;

							theOutput += '<Complex>\n';
							theOutput += '<Properties>\n';

							theOutput += '<Simple name="A" value="' + newEntityId + '" />\n';
							theOutput += '<Simple name="B" value="' + thisEnt.Position + '" />\n';

							theOutput += '</Properties>\n';
							theOutput += '</Complex>\n';							
						}

						theOutput += '</Items>\n';
						theOutput += '</Collection>\n';
						theOutput += '</Item>\n';
					}
				}

				theOutput += '</Items>\n';
				theOutput += '</Dictionary>\n';

				return theOutput;
			}

			// We need to break this into individual entities
			loadSection(
				theData,
				'<Item>',
				'</Item>',
				function(theData2) {
					var entType = (/<Simple value="([^"]*)" \/>/.exec(theData2) || [])[1] || 'Unknown';

					// Ensure we have a store for this kind of entity
					fastEnts[entType] = fastEnts[entType] || [];

					loadSection(
						theData2,
						'<Complex>',
						'</Complex>',
						function(possibleFastEnt) {
							var entId = (/<Simple name="A" value="([^"]*)" \/>/.exec(possibleFastEnt) || [])[1] || 'Unknown';
							var position = (/<Simple name="B" value="([^"]*)" \/>/.exec(possibleFastEnt) || [])[1] || 'Unknown';

							// Push it in
							fastEnts[entType].push({
								ID: entId,
								Position: position,
								shouldHide: true,
								__entityType: entType,
								__theStore: fastEnts[entType]
							});
						}, true, true
					);
				}, true, true
			);
			
		}, false, true
	);

	// Store them
	window.layerStore.fastEntities = fastEnts;

	if(commitUpdate && res != null) {
		// Update the res
		window.activeMap.Data = res;
	}
}

// Generates a map from the fast entities
function generateFastEntitiesMap(reverse) {
	// If it's reverse, it means we're converting from a map to fastEntities
	if(reverse) {
		window.layerStore.fastEntities = {};
		var fastEnts = window.layerStore.fastEntities;

		var zombieLayer = window.layerStore.LayerZombies;
		var width = zombieLayer.width;
		var height = zombieLayer.height;

		var theData = zombieLayer.data;

		for(var yy=0; yy<height; ++yy) {
			for(var xx=0; xx<width; ++xx) {
				var mapPos = width * yy + xx;

				var entType = theData[mapPos];

				// We don't write null zombies back into fast ents
				if(entType == 0) continue;

				// Ensure we have an array to store the new ent into
				fastEnts[entType] = fastEnts[entType] || [];

				// Add this entity
				fastEnts[entType].push({
					Position: '' + yy + ';' + xx
				});
			}
		}

		return;
	}

	// We are converting from fast entities to a map

	var width = window.layerStore.LayerTerrain.width;
	var height = window.layerStore.LayerTerrain.height;

	// Grab the zombie later, update it
	var zombieLayer = window.layerStore.LayerZombies;
	zombieLayer.width = width;
	zombieLayer.height = height;

	// Create an array with one slot for each square
	var dataArray = new Array(width * height);
	zombieLayer.data = dataArray;

	// Fill with 0s
	dataArray.fill(0);

	// Grab the fast entities store
	var fastEnts = window.layerStore.fastEntities;

	for(var entType in fastEnts) {
		var theseEnts = fastEnts[entType];

		// Ensure there are some ents to play with
		if(theseEnts == null || theseEnts.length <= 0) continue;

		// Loop over all the ents
		for(var i=0; i<theseEnts.length; ++i) {
			var thisEnt = theseEnts[i];

			var pos = thisEnt.Position.split(';');
			if(pos.length != 2) continue;

			var posX = Math.round(parseFloat(pos[1]));
			var posY = Math.round(parseFloat(pos[0]));

			// Sanity checking
			if(isNaN(posX) || isNaN(posY)) continue;
			if(posX < 0 || posY < 0) continue;
			if(posX >= width || posY >= height) continue;

			// Convert to a map pos
			var mapPos = width * posY + posX;

			// Store the data
			dataArray[mapPos] = entType;
		}
	}
}