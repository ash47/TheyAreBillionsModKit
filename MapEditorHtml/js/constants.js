var colorNone = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 0
};

var colorWater = {
	red: 25,
	green: 25,
	blue: 112,
	alpha: 255
};

var colorEarth = {
	red: 245,
	green: 222,
	blue: 179,
	alpha: 255
};

var colorGrass = {
	red: 124,
	green: 252,
	blue: 0,
	alpha: 255
};

var colorStone = {
	red: 169,
	green: 169,
	blue: 169,
	alpha: 255
};

var colorIron = {
	red: 135,
	green: 206,
	blue: 250,
	alpha: 255
};

var colorOil = {
	red: 128,
	green: 0,
	blue: 128,
	alpha: 255
};

var colorGold = {
	red: 255,
	green: 215,
	blue: 0,
	alpha: 255
};

var colorRoad = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 255
};

var colorWood = {
	red: 0,
	green: 100,
	blue: 0,
	alpha: 255
};

var colorMountain = {
	red: 0,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorSky = {
	red: 30,
	green: 144,
	blue: 255,
	alpha: 255
};

var colorAbyse = {
	red: 255,
	green: 69,
	blue: 0,
	alpha: 255
};

var colorDefault = {
	red: 255,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorFogOfWar = {
	red: 0,
	green: 0,
	blue: 0,
	alpha: 200
};

var colorFogOfWarOff = {
	red: 0,
	green: 0,
	blue: 0,
	alpha: 100
};

var colorFoWMap = {
	[-16777216]: colorFogOfWar,
	0: colorFogOfWarOff
};

var colorObject = {
	0: colorNone,
	1: colorMountain,
	2: colorWood,
	3: colorGold,
	4: colorStone,
	5: colorIron
};

var colorTerrain = {
	0: colorEarth,
	1: colorWater,
	2: colorGrass,
	3: colorSky,
	4: colorAbyse
};

var mapSerTerrain = {
	terrain: {
		0: 20,
		1: 10,
		2: 30,
		3: 0,
		4: 10
	},
	objects: {
		1: 100,
		2: 90,
		3: 70,
		4: 40,
		5: 50
	}
};

var colorSerTerrain = {
	0: colorNone,
	10: colorWater,
	20: colorEarth,
	30: colorGrass,
	40: colorStone,
	50: colorIron,
	60: colorOil,
	70: colorGold,
	80: colorRoad,
	90: colorWood,
	100: colorMountain
};

var colorZombieNone = {
	red: 255,
	green: 255,
	blue: 255,
	alpha: 0
};

var colorZombieWeak1 = {	// Light green
	red: 144,
	green: 238,
	blue: 144,
	alpha: 255
};

var colorZombieWeak2 = {	// Lime
	red: 0,
	green: 255,
	blue: 0,
	alpha: 255
};

var colorZombieWeak3 = {	// Green
	red: 0,
	green: 128,
	blue: 0,
	alpha: 255
};

var colorZombieMedium1 = {	// Light Yellow
	red: 255,
	green: 255,
	blue: 153,
	alpha: 255
};

var colorZombieMedium2 = {	// Yellow
	red: 255,
	green: 255,
	blue: 0,
	alpha: 255
};

var colorZombieMedium3 = {	// Yellow
	red: 204,
	green: 204,
	blue: 0,
	alpha: 255
};

var colorZombieStrong1 = {	// Orange
	red: 255,
	green: 165,
	blue: 0,
	alpha: 255
};

var colorZombieStrong2 = {	// Coral
	red: 255,
	green: 127,
	blue: 80,
	alpha: 255
};

var colorZombieStrong3 = {	// Orange Red
	red: 255,
	green: 69,
	blue: 0,
	alpha: 255
};

var colorZombiePowerful1 = {	// Red
	red: 255,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorZombiePowerful2 = {	// Crimson
	red: 220,
	green: 20,
	blue: 60,
	alpha: 255
};

var colorZombieUltra1 = {	// Dark Red
	red: 139,
	green: 0,
	blue: 0,
	alpha: 255
};

var colorZombies = {
	0: colorZombieNone,
	1: colorZombieWeak1,
	2: colorZombieWeak2,
	3: colorZombieWeak3,
	4: colorZombieMedium1,
	5: colorZombieMedium2,
	6: colorZombieMedium3,
	7: colorZombieStrong1,
	8: colorZombieStrong2,
	9: colorZombieStrong3,
	10: colorZombiePowerful1,
	11: colorZombiePowerful2,
	12: colorZombieUltra1
};

var hiddenFields = {
	rawXML: true,
	ID: true,
	Capacity: true,
	IDEntity: true,
	lastContainer: true,
	isActive: true,
	__entityType: true,
	shouldHide: true,
	__theStore: true
};

// Allow custom colors to be defined
var unitColorMap = {
	['ZX.Entities.CommandCenter']: {
		red: 255,
		blue: 255,
		green: 255
	}, 
};

var hiddenMapProps = {
	ThemeType: true
};

var enum_toolPaint = 1;
var enum_toolSelection = 2;
var enum_toolEntity = 3;

var enum_brushSingle = 1;
var enum_brushLine = 2;


// History stuff
historyItemDrawPixel = 1;

