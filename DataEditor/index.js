// Imports
const AdmZip = require('adm-zip');
const nodeZip = require('node-zip');	// Because AdmZip isnt creating zips correctly
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Key information on where to store stuff
// Read XML from input
// Output CSV into workingDirectory
// Modify XML based on workingDirectory
// Output XML to output directory
const inputDirectory = path.join(__dirname, 'input');
const workingDirectory = path.join(__dirname, 'working');
const outputDirectory = path.join(__dirname, 'output');

function ensureDirectoryExists(dir) {
	try {
		fs.mkdirSync(dir);
	} catch(e) {
		// do nothing
	}
}

// Ensure we have directories
ensureDirectoryExists(inputDirectory);
ensureDirectoryExists(workingDirectory);
ensureDirectoryExists(outputDirectory);

function processFile(filePath) {
	try {
		var zip = new AdmZip(path.join(inputDirectory, filePath));
	} catch(e) {
		// Return nothing
		return;
	}
	
	var zipEntries = zip.getEntries();

	zipEntries.forEach(function(zipEntry) {
		// Process info
		var info = {
	    	fileName: zipEntry.entryName,
	    	xmlData: '' + zip.readFile(zipEntry)
	    };

	    // Try to read in the editable JSON
	    try {
	    	info.editableJson = JSON.parse(fs.readFileSync(path.join(workingDirectory, filePath + '.json')))
	    } catch(e) {
	    	// Do nothing
	    }

	    // Process the XML Data
	    // Note that info will be mutated
	    processXML(info);

	    // Should we store the editable file?
	    if(info.shouldStoreEditable) {
			fs.writeFileSync(
				path.join(workingDirectory, filePath + '.json'),
				JSON.stringify(info.editableJson, null, 4)
			);
		}

		// Store the new XML
		if(info.newXML != null) {
			var newZip = new nodeZip();
			newZip.file(zipEntry.entryName, info.newXML);

			// Store the modified zip
			var zipData = newZip.generate({
				base64:false,
				compression:'DEFLATE'
			});

			fs.writeFileSync(path.join(outputDirectory, filePath), zipData, 'binary');
		}
	});

	
}

// Processes XML
function processXML(info) {
	console.log('processing XML')
	xml2js.parseString(info.xmlData, {
		explicitChildren: true,
		preserveChildrenOrder: true
	}, function(err, result) {
		if(err) {
			console.log(err);
			return;
		}

		console.log('done parsing');

		// Store the JSON version
		info.json = result;
		info.editableJsonMeta = {};

		//fs.writeFileSync('test.json', JSON.stringify(result, null, 4));

		// Store the editable JSON version
		if(info.editableJson == null) {
			info.editableJson = {};
			info.shouldStoreEditable = true;
		} else {
			info.shouldStoreEditable = false;
		}
		

		if(info.fileName == 'ZXRules.dat') {
			try {
				processZXRules(info);
				rebuildZXRules(info);
			} catch(e) {
				console.log('Failed to process ' + info.fileName);
				throw e;
			}
		}

		// Convert the modified JSON back to XML
		/*console.log('Rebuilding XML...');
		var builder = new xml2js.Builder();
		info.newXML = builder.buildObject(info.json);
		console.log('XML Built Successfully!');*/
	});
}

// Processor for ZXRules.dat
function processZXRules(info) {
	console.log('Processing ZXRules...');

	var json = info.json;

	//var outerItems = json.Complex.$$.Properties[0].$$.Dictionary[0].$$.Items[0].$$.Item;
	var outerItems = json.Complex
		.$$[0]	// Properties
		.$$[0]	// Dictionary
		.$$[0]	// Items
		.$$;	// Access children

	for(var i=0; i<outerItems.length; ++i) {
		var outerItem = outerItems[i];

		var tableName = outerItem.Simple[0].$.value;

		// Work with the editable JSON
		if(info.editableJson[tableName] == null) {
			info.editableJson[tableName] = {};
		}
		var myEditableJson = info.editableJson[tableName];

		if(info.editableJsonMeta[tableName] == null) {
			info.editableJsonMeta[tableName] = {};	
		}
		var myMetaInfo = info.editableJsonMeta[tableName];

		var cols = null;
		var rows = null;

		if(outerItem.Complex == null) continue;

		var properties = outerItem.Complex[0]
			.$$[0];	// Properties

		for(var j=0; j<properties.$$.length; ++j) {
			var dictonary = properties.$$[j];

			if(dictonary == null || dictonary.$$ == null) continue;

			var name = dictonary.$.name;
			var dictonaryItems = dictonary
				.$$[0]	// Items
				.$$;
			
			switch(name) {
				case 'Cols':
					cols = dictonaryItems;
				break;

				case 'Rows':
					rows = dictonaryItems;
				break;
			}
		}

		// Ensure we have cols and rows to work with
		if(cols == null || rows == null) continue;
		
		// Process Columns
		var easyColumns = [];
		for(var j=0; j<cols.length; ++j) {
			var col = cols[j];

			var columnName = col.$$[0].$.value;
			var columnId = col.$$[1].$.value;

			easyColumns[columnId] = columnName;
		}
		myMetaInfo.cols = easyColumns;

		// Process rows
		for(var j=0; j<rows.length; ++j) {
			var row = rows[j];

			var unitName = row.$$[0].$.value;
			var unitData = row
				.$$[1]	// SingleArray
				.$$[0]	// Items
				.$$;

			if(myEditableJson[unitName] == null) {
				myEditableJson[unitName] = {};
			}
			var myData = myEditableJson[unitName];

			for(var k=0; k<unitData.length; ++k) {
				var unitInfo = unitData[k];

				// TODO: Fix this
				if(unitInfo.$ == null) continue;
				var unitValue = unitInfo.$.value;

				//console.log(unitValue)

				// Decide which way to copy the data
				if(myData[easyColumns[k]] == null) {
					// Store Data
					myData[easyColumns[k]] = unitValue;
				} else {
					// Modify XML Data
					//unitInfo.$.value = myData[easyColumns[k]];
				}
			}
		}
	}

	console.log('Done processing ZXRules!');
}

// Rebuilds ZXRules based on the given input
function rebuildZXRules(info) {
	console.log('Rebuilding ZXRules...');

	var toOutput = '';

	toOutput += '<Complex name="Root" type="DXVision.DXTableManager, DXVision">\n';
	toOutput += '<Properties>\n';
	toOutput += '<Dictionary name="Tables" keyType="System.String, mscorlib" valueType="DXVision.DXTable, DXVision">\n';
	toOutput += '<Items>\n'; 

	for(var tableName in info.editableJson) {
		var thisData = info.editableJson[tableName];

		toOutput += '<Item>\n';
		toOutput += '<Simple value="' + tableName + '" />\n';
		toOutput += '<Complex>\n';
		toOutput += '<Properties>\n';

		// Column Headers
		toOutput += '<Dictionary name="Cols" keyType="System.String, mscorlib" valueType="System.Int32, mscorlib">\n';
		toOutput += '<Items>\n';

		var myMetaData = info.editableJsonMeta[tableName];
		for(var colNum=0; colNum<myMetaData.cols.length; ++colNum) {
			var colName = myMetaData.cols[colNum];

			toOutput += '<Item>\n';
			toOutput += '<Simple value="' + colName + '" />';
			toOutput += '<Simple value="' + colNum + '" />';
			toOutput += '</Item>\n';
		}

		toOutput += '</Items>';
		toOutput += '</Dictionary>\n';

		// Data
		toOutput += '<Dictionary name="Rows" keyType="System.String, mscorlib" valueType="System.String[], mscorlib">\n';
		toOutput += '<Items>\n';

		for(var itemName in thisData) {
			var data = thisData[itemName];

			//console.log(data)

			toOutput += '<Item>\n';
			toOutput += '<Simple value="' + itemName + '" />\n';
			toOutput += '<SingleArray elementType="System.String, mscorlib">\n';
			toOutput += '<Items>\n';

			for(var colNum=0; colNum<myMetaData.cols.length; ++colNum) {
				var colName = myMetaData.cols[colNum];
				var colData = data[colName];

				if(colData == null) {
					toOutput += '<Null />\n';
				} else {
					toOutput += '<Simple value="' + colData + '" />\n';
				}
			}

			toOutput += '</Items>\n';
			toOutput += '</SingleArray>\n';
			toOutput += '</Item>\n';
		}

		toOutput += '</Items>\n';
		toOutput += '</Dictionary>\n'

		toOutput += '</Properties>\n';
		toOutput += '</Complex>\n'
		toOutput += '</Item>\n';
	}

	toOutput += '</Items>\n';
	toOutput += '</Dictionary>\n';
	toOutput += '</Properties>\n';
	toOutput += '</Complex>\n';

	info.newXML = toOutput;

	//console.log(toOutput)

	console.log('Done rebuilding ZXRules!');
}

// Read all the input files
const toProcess = fs.readdirSync(inputDirectory);

for(var i=0; i<toProcess.length; ++i) {
	processFile(toProcess[i]);
}
