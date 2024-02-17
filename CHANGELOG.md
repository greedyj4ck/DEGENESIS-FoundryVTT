# **CHANGELOG 0.6.2 (17.02.24)**

This will be final major release on Foundry V11 (0.7 planned for V12 release).

> **This update contains heavy changes to code, data structures, application behaviour etc, which are not final and may change in a future. Before migrating your world to newest version, please create a backup using Foundry's built-in backup system.**

> Minimum Foundry version: **11.311** (with backup features)
> Recommended Foundry version: **11.315**

## New Features

- Aberrant character sheet (similar in design to NPC and From Hell)
- New item type: **Phenomenon** (with compendium)
- Added some acronyms to translation strings (dice, triggers, sucesses - feature will be expanded on in the next release)

## Fixes

- Loading ammo issues
- Encumbrance penalty now works while using arsenal
- Windows will now remember positions during editing of items on sheets
- Distance value of weapons is now correct for numerous sheets

# **CHANGELOG** 0.6.1.2 (28.10.2023)

This is the last patch for 0.6.1 version - next fixes will be introduced in 0.6.2 or 0.7 for Foundry V12.

> Minimum Foundry version: **11.311** (with backup features)

```
This update contains heavy changes to code, data structures, application behaviour etc, which are not final and may change in a future. Before migrating your world to newest version, please create a backup using Foundry's built-in backup system.
```

## Quick patches

- Added new font replacement for Calluna - Crimson Pro (very similar, without numbers alignment issues)
- Added translation strings for ammo types

> **Warning!** Ammo count and reload scripts looks for ammo inside inventory that has a same name. If you are using translated strings, your ammo must use the same names!

- Added **TACTICS** field on From Hell sheet
- Added missing translation strings for various things
- Fixed minor styling issues
- Fixed minor UI and functionality bugs

# **CHANGELOG** 0.6.1.1 (24.10.2023)

> Minimum Foundry version: **11.311** (with backup features)

```
This update contains heavy changes to code, data structures, application behaviour etc, which are not final and may change in a future. Before migrating your world to newest version, please create a backup using Foundry's built-in backup system.
```

## Quick patches

- Fixed some styling issues that prevents from proper fields rendering
- Fixed and added missing translation strings
- New version of French translation by Calion16

# **CHANGELOG** 0.6.1 (23.10.2023)

> Minimum Foundry version: **11.311** (with backup features)

```
This update contains heavy changes to code, data structures, application behaviour etc, which are not final and may change in a future. Before migrating your world to newest version, please create a backup using Foundry's built-in backup system.
```

## Features

- New actor sheet design for simplified 'From Hell' entities
- New actor sheet design for simplified 'NPC' entities
- New item types - simplified attacks and defences for NPC and From Hell entities (compendium is coming in next release)
- New simplified code routines for future updates

## Bug fixes

- Ego points now working correctly during sonic attack rolls
- Weapon items templates are showing correctly fields now based on type
- Standard roll dice styiling is now more readable
- Arsenal armor special quality description is beeing fetched now

## Translations

- French localization fixes by Calion16

# **CHANGELOG** 0.6.0 (02.06.2023)

```
WARNING! THIS VERSION IS COMPATIBLE WITH FOUNDRY 11! ALWAYS BACKUP YOUR FOUNDRY SYSTEM DATA (WORLDS AND MEDIA) BEFORE UPDATING TO NEW MAJOR VERSION OF FOUNDRY OR THIS SYSTEM!
```

**Degenesis 0.6.0** release focuses on ensuring compatibility with version 11 of Foundry VTT. In addition, a few bugs have been fixed and some functionality has been improved. Also some groundwork has been laid for future functionality updates.

## Features

- Compatibility with Foundry V11 release.
- New compendium banners and some new UI styling

## Bug fixes

- Fixed deprecated V10 translation strings
- Fixed transportation items issues
- Fixed numerous small issues
- Cleared up deprecated npc sheet left overs

## Translations

- Small fixes to some translation strings

Remember to report all the encountered bugs [**here.**](https://github.com/greedyj4ck/DEGENESIS-FoundryVTT/issues)
