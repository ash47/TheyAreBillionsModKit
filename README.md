# TheyAreBillionsModKit
Tools &amp; Research notes for modding "They Are Billions"

# What is this?

 - This is a set of tools and notes for creating mods for "They Are Billions". This project must not be used for illegal purposes, or for getting a highscore on any leaderboards that are present in the game, it is strictly for educational purposes and for people to experiment with.

# Tools

## Map Editor
 - The map editor allows you to edit save files
 - You can use the map editor in your browser [here](https://ash47.github.io/TheyAreBillionsModKit/MapEditorHtml/)
 - Simply load in a save file, and the editor will let you edit it

## Hotkeys
 - Move Camera: arrow keys, WADS
 - Map Zoom: Q / E, - =
 - Undo: ctrl + z
 - Redo: ctrl + y
 - Save: ctrl + s
 - Load: ctrl + o
 - Decrease Brush Size: [
 - Increase Brush Size: ]
 - Paint Earth: shift+e
 - Paint Water: shift+w
 - Paint Grass: shift+r
 - Paint Sky: shift+k
 - Paint Abyse: shift+a
 - Paint no object: shift+n
 - Paint Mountain: shift+m
 - Paint Wood: shift+o
 - Paint Gold: shift+g
 - Paint Stone: shift+t
 - Paint Iron: shift+i

## Data Editors
 - Currently only `ZXRules.dat` can be edited.
 - These files are simply ZIP files. You need to extract it using the password `-2099717824-430703793638994083`, and then rezip it without a password, make sure to rename it to `ZXRules.dat` after you've removed the password.
 - Place `.dat` files into `DataEditor/input/` folder.
 - Execute `run.bat` (ensure you ran `npm install` if it's your first use)
 - The `working` folder will contain a JSON editable file, any changes made to this will be updated in the `output` folder after you run `run.bat` again
 - Copy the file from `output` into your game's directory

## ZXCheck Generator
 - The ZXCheck generator is a tool that will generate .ZXCheck files for you.
 - Download a copy from the releases section, and put it into your game's directory.
 - The tool will instruction "TheyAreBillions.exe" to generate a .ZXSav file for you.
