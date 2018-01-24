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

var colorRoad = {
	red: 25,
	green: 25,
	blue: 25,
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

var colorRoad = {
	0: colorNone,
	1: colorRoad
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
	name: 'ZombieNone',
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

var colorZombieMedium3 = {	// Dark Yellow
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

/*var colorZombies = {
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
};*/

var colorZombies = {
	0: colorZombieNone,

	'17464596434855839240': /* ZombieWorkerA*/ {	// Very Light green
		name: 'ZombieWorkerA',
		red: 184,
		green: 238,
		blue: 184,
		alpha: 255
	},
	'10676594063526581': /* ZombieWorkerB*/ {	// Very Very Light green
		name: 'ZombieWorkerB',
		red: 224,
		green: 255,
		blue: 224,
		alpha: 255
	},

	'13102967879573781082': /* ZombieWeakA */ {	// Light green
		name: 'ZombieWeakA',
		red: 144,
		green: 238,
		blue: 144,
		alpha: 255
	},
	'11373321006229815036': /* ZombieWeakB */ {	// Lime
		name: 'ZombieWeakB',
		red: 0,
		green: 255,
		blue: 0,
		alpha: 255
	},
	'4497312170973781002': /* ZombieWeakC */ {	// Green
		name: 'ZombieWeakC',
		red: 0,
		green: 128,
		blue: 0,
		alpha: 255
	},

	'3569719832138441992': /* ZombieMediumA */ {	// Light Yellow
		name: 'ZombieMediumA',
		red: 255,
		green: 255,
		blue: 153,
		alpha: 255
	},
	'12882220683103625178': /* ZombieMediumB */ {	// Yellow
		name: 'ZombieMediumB',
		red: 255,
		green: 255,
		blue: 0,
		alpha: 255
	},
	'8945324363763426993': /* ZombieDressedA */ {	// Dark Yellow
		name: 'ZombieDressedA',
		red: 204,
		green: 204,
		blue: 0,
		alpha: 255
	},

	'1214272082232025268': /* ZombieHarpy */ {	// Red
		name: 'ZombieHarpy',
		red: 255,
		green: 0,
		blue: 0,
		alpha: 255
	},
	'12658363830661735733': /* ZombieVenom */ {	// Crimson
		name: 'ZombieVenom',
		red: 220,
		green: 20,
		blue: 60,
		alpha: 255
	},

	'6498716987293858679': /* ZombieStrongA */ {	// Orange
		name: 'ZombieStrongA',
		red: 255,
		green: 165,
		blue: 0,
		alpha: 255
	},
	'6179780658058987152': /* ZombieGiant */ {	// Coral
		name: 'ZombieGiant',
		hidden: true,
		red: 255,
		green: 127,
		blue: 80,
		alpha: 255
	},
	
	'4885015758634569309': /* ZombieLeader */ {	// Dark Red
		name: 'ZombieLeader',
		hidden: true,
		red: 139,
		green: 0,
		blue: 0,
		alpha: 255
	},
};

var colorGridLines = {
	red: 0,
	green: 0,
	blue: 0,
	alpha: 200
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
	__theStore: true,
	__posInfo: true
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
	ThemeType: true,
	_mapName: true,
	_ncellsReal: true,
};

var enum_toolPaint = 1;
var enum_toolSelection = 2;
var enum_toolEntity = 3;

var enum_brushSingle = 1;
var enum_brushLine = 2;


// History stuff
historyItemDrawPixel = 1;

var knownBonusEntsNice = {
	buildings: {
		'877281890077159856': 'AdvancedFarm',
		'6574833960938744452': 'AdvancedQuarry',
		'8857617519118038933': 'AdvancedUnitCenter',
		'1621013738552581284': 'Ballista',
		'5036892806562984913': 'Bank',
		'7736771959523609744': 'BunkerHouse',
		//'3153977018683405164': 'CommandCenter',
		'1886362466923065378': 'CottageHouse',
		//'3441286325348372349': 'DoomBuildingLarge',
		//'293812117068830615': 'DoomBuildingMedium',
		//'8702552346733362645': 'DoomBuildingSmall',
		'3581872206503330117': 'EnergyWoodTower',
		'782017986530656774': 'Executor',
		'7709119203238641805': 'Farm',
		'13910727858942983852': 'FishermanCottage',
		'14944401376001533849': 'Foundry',
		'18390252716895796075': 'GateStone',
		'8865737575894196495': 'GateWood',
		//'1313209346733379187': 'Heater',
		'706050193872584208': 'HunterCottage',
		//'2357834872970637499': 'InfectedNestBig',
		'9352245195514814739': 'LookoutTower',
		'5507471650351043258': 'Market',
		'12238914991741132226': 'MillIron',
		'869623577388046954': 'MillWood',
		'15110117066074335339': 'OilPlatform',
		'12703689153551509267': 'PowerPlant',
		'4012164333689948063': 'Quarry',
		'10083572309367106690': 'RadarTower',
		//'6362162278734053601': 'Refinery',
		'6484699889268923215': 'Sawmill',
		'7671446590444700196': 'ShockingTower',
		//'8537111584635793949': 'Shuttle',
		'17945382406851792953': 'SoldiersCenter',
		'17389931916361639317': 'StoneHouse',
		'11153810025740407576': 'StoneWorkshop',
		'17301104073651661026': 'TentHouse',
		'2562764233779101744': 'TrapBlades',
		//'3791255408779778776': 'TrapMine',
		//'17047104131874756555': 'TrapPetrol',
		'14605210100319949981': 'TrapStakes',
		'7684920400170855714': 'WallStone',
		'16980392503923994773': 'WallWood',
		'13640414733981798546': 'WareHouse',
		'16597317129181541225': 'WatchTowerStone',
		'11206202837167900273': 'WatchTowerWood',
		'2943963846200136989': 'WoodWorkshop'
	},

	units: {
		'16241120227094315491': 'Lucifer',
		'11462509610414451330': 'Ranger',
		//'12735209386004068058': 'Raven',
		'6536008488763521408': 'Sniper',
		'8122295062332983407': 'SoldierRegular',
		'13687916016325214957': 'Thanatos',
		'15625692077980454078': 'Titan',
		//'3208367948340991825': 'Worker_A',
		//'13977466055377379252': 'Worker_B',
		//'8049232565215955390': 'WorkerRunner_A',
		//'7404423790615406394': 'WorkerRunner_B',
	}
};
