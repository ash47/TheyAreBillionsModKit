# TheyAreBillionsModKit
Tools &amp; Research notes for modding "They Are Billions"

# What is this?

 - This is a set of tools and notes for creating mods for "They Are Billions". This project must not be used for illegal purposes, or for getting a highscore on any leaderboards that are present in the game, it is strictly for educational purposes and for people to experiment with.

# Tools

## MethodInjector

 - This tool is used to inject custom code into the memory of the game without modifying the actual executable itself.
 - If you are using this, you need to build RELEASE x64, or it WILL FAIL TO INJECT!

### Current Patches

 - Allow loading of hacked save games -- This simply turns of the save game checksum code that is being used.
 - Building costs no money -- This removes the cost of buildings, and allows you to build even if you have negative resources.
 - Enable DEV and PRIVATE modes.

### Cheats
 - Enable cheats by pressing `control` + `shift` + `H`

|  Hotkey	| Result                            	|
| --------	| ------------------------------------- |
| +			| Speed Up Time							|
| -			| Slow Down Time						|
| CTR + F	| Toggle Fog							|
| CTR + R	| Grant Resources						|
| CTR + L	| Toggle God Mode (Damage on / off)		|
| ALT + R	| Toggle Resource Grid					|
| CTR + F9	| Grant All Research					|
| F9		| Activate Cinematic Mode				|
| ALT + F12	| Instant Victory						|
| CTR + P	| ???									|


# Notes

## Enabling Development / Private Beta Tools
 - ZX.Program
   - ZXGame.IsDevelopmentVersion = true;
   - ZXGame.IsBetaPrivateVersion = true;

## Enabling Cheats
 - ZX.ZXSystem_GameLevel
   - OnKeyUp
     - Invert Logic: ZXGame.CheatsEnabled

## Allow loading of modifed save files
 - ZX.ZXGame
   - CheckSaveGame
     - Remove check from here

## Infinite Resources
 - ZX.ZXLevelState
   - CanPayResources
   - PayResources
   		- Remove / Change logic

