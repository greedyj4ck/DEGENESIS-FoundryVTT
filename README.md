# DEGENESIS: Rebirth for Foundry VTT
![CurrentIssues](https://img.shields.io/github/issues/greedyj4ck/DEGENESIS-FoundryVTT?style=for-the-badge) 
![GitHub release (latest by date)](https://img.shields.io/github/downloads/greedyj4ck/DEGENESIS-FoundryVTT/latest/total?style=for-the-badge)

An unoffical, community-supported system for playing [Degenesis](https://degenesis.com/) on [Foundry VTT](http://foundryvtt.com/).

Degenesis® is ™ SIXMOREVODKA Studio GmbH. All rights reserved. This module contains information and graphics from Katharsys that have been used with permission from the publisher. All used content from the handbook belong to the respective authors.

**WARNING**: Data compendiums (`/packs` folder) are hosted as a submodule in https://github.com/greedyj4ck/degenesis-db/ and are included in the zip releases, but if you download the source code you have to fetch them (either by cloning/pulling with `--recurse-submodules` flag on git or manually if you're downloading the source code that way).

## Credits 

 * Code and UI authors:
   * Moo Man (Moo Man#7518)
   * Darkhan (Darkhan#1534)
   * ClemEvilzz (societe simulator#2110)
   * KristjanLaane
   * Greedyj4ck (GЯΣΣDYJΛCK#2690)
 * Item packs icons:
   * Renart de Maupertuis (Renart de Maupertuis#1302)
   * Pablo Ruiz Valls (Pabruva#1968)
   * Greedyj4ck (GЯΣΣDYJΛCK#2690)
 * Translations:
   * Meldinov
   * Herugrim (Herugrim#3880)
   * Pablo Ruiz Valls (Pabruva#1968)
   * Hozon - Nico (Hozon#7832)

> If you have worked on or contributed to the translation of the system and you are not on the list - please write a message.


## Artwork 
Default world background **Potentials** by **Claudiu-Antoniu Magherusan** https://www.artstation.com/artwork/PmA5aB  
Github banner **Homo Degenesis** by **Marko Djurdjevic** https://www.sixmorevodka.com/


## Work in progress disclaimer

The system module represented is not in its final version. Functionality and content will be subject to change. 

## System.json manifest

    https://github.com/greedyj4ck/DEGENESIS-FoundryVTT/releases/latest/download/system.json

## Developer Installation

- Git clone the repo. Use `--recurse-submodules` flag to get the packs.
- Rename the directory to "degenesis" under your Foundry _Data/systems_ directory.



### Live SASS Compiler settings
The new version of the system uses SCSS to compile the resulting CSS file. We recommend using VSCode with the Live SASS Compiler extension installed and the following settings.

    Insert settings inside .vscode/settings.json

```json
{
    "liveSassCompile.settings.formats": [
        {
            "format": "expanded",
            "extensionName": ".css",
            "savePath": "/styles"
        }
    ],
    "liveSassCompile.settings.excludeList": [
        "**/node_modules/**",
        ".vscode/**"
    ],
    "liveSassCompile.settings.generateMap": false,
    //autoprefix, will auto add perfix like -webkit- -moz-..
    "liveSassCompile.settings.autoprefix": [
        "> 1%",
        "last 2 versions"
    ]
}
```


