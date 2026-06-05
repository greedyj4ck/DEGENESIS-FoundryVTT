# DEGENESIS: Rebirth -- Changelog

> **Beta Notice**: This fork has not been extensively tested. Please report any bugs or issues you encounter. It is based on the official DEGENESIS: Rebirth system v0.8 by Greedyj4ck and contributors. All original credits remain; this fork only adds community-driven gameplay features and compatibility fixes.

## Overview

This community fork of the DEGENESIS: Rebirth Foundry VTT system adds significant gameplay automation and quality-of-life improvements for both players and Game Masters. The highlights include a full combat automation pipeline with attack/defense resolution, new weapon qualities (Salvoes and Smooth Running), multi-effect modifiers with transparent source breakdown, a GM logging system, inventory management improvements, and several Foundry v13/v14 compatibility fixes.

---

## New Features

### Combat Automation System

A complete automated attack-vs-defense flow that streamlines DEGENESIS combat. When enabled via the system settings ("Automate attack vs defense flow"), targeting a single token before attacking triggers the full pipeline:

- WARNING : You need to allow this system to work in the global settings of Degenesis System. Just check the box and you'll be good to go.
- **Target selection**: The attacker selects a target token, then attacks with any weapon. The system automatically reads the target's passive defense as the roll difficulty.
- **Range validation**: An optional range check (enabled separately in settings) compares the grid distance between attacker and target tokens against the weapon's effective range band. Out-of-range attacks are blocked with an informative notification.
- **Active defense prompt**: After the attack roll, the defender (or GM if the defender is offline) is prompted to choose a reaction: Dodge (AGI+Mobility), Parry (with weapon selection), or Do Nothing.
- **Parry weapon selection**: If parrying, the system presents a list of equipped melee weapons (including intrinsic unarmed weapons) whose reach covers the engagement distance. The defender picks one and rolls defense.
- **Resolution card**: A chat card displays the outcome -- attack successes vs defense successes, hit/miss status, total damage with trigger bonus, and damage type (fleshwounds/ego/trauma).
- **GM damage application**: A "Apply damage" button on the resolution card lets the GM apply damage to the target. The system prompts whether armor mitigation applies (checking equipped armor for bulletproof or massive qualities), then splits damage across fleshwounds and trauma automatically.
- **Counter-attacks**: If a parry succeeds with 3+ triggers, the system prompts for an unblockable counter-attack per DEGENESIS rules, generating a separate damage card for the counter.
- **Distance measurement**: Uses the Foundry v14 `canvas.grid.measurePath` API with a fallback to the older `canvas.grid.measureDistances` for v12/v13 compatibility.

The `alreadyRendered` guard flag on card data prevents duplicate chat messages when attack rolls are processed both by the normal roll flow and the automation pipeline.

### Salvoes (Burst Fire)

Implements the Salvoes weapon quality for ranged weapons:

- Weapons with the `salvoes` quality (defined with a `rounds` value) automatically trigger a Salvoes dialog when making a ranged attack.
- The player chooses how many rounds to fire (1 up to the quality value or remaining magazine, whichever is lower).
- Each round fired adds +1D to the attack roll and factors into damage calculation.
- Ammunition is automatically deducted from the weapon's magazine after the roll.
- Works across all actor types: characters, NPCs, From Hell creatures, and aberrants.
- New dialog template (`salvoes-dialog.html`) with localized prompts.

### Smooth Running (Chain Attacks)

Implements the Smooth Running weapon quality for rapid successive attacks:

- After any attack roll with a Smooth Running weapon, if the trigger count meets or exceeds the quality's threshold, the system prompts the player to make an immediate follow-up attack.
- Each follow-up attack applies a cumulative -2D penalty (first follow-up: -2D, second: -4D, etc.).
- The chain can continue as long as the trigger threshold is met on each subsequent roll.
- Integrates with Salvoes -- if the weapon also has Salvoes, the burst fire dialog appears for each chain attack.
- Magazine deduction is applied per chain attack.
- Implemented via `handleRegularity()` in the actor class, which recursively calls itself for each eligible follow-up.

### Multi-Effect Modifiers

Modifiers can now carry multiple effects instead of being limited to a single action/type/number combination:

- Modifier items now store an `effects` array in their system data, where each effect has its own `action`, `type`, and `number`.
- Example: a single "Explorer" modifier can grant +2D on INS+Orienteering AND +2D on INT+Legends simultaneously.
- The modifier sheet template has been rewritten with a scrollable effect list, add/remove buttons per effect row, and per-effect action/type/number selectors.
- Backward compatibility: existing modifiers with the old single-field format are automatically migrated to the new effects array on world load (via a `ready` hook in `degenesis.mjs`).
- The `ModifierManager` processes all effects from each modifier item, building composite modifier totals correctly.

### Modifier Breakdown Display

Roll dialogs now show exactly where each modifier comes from:

- The "Static Modifiers" section in roll dialogs now uses `displayDice`, `displaySuccess`, and `displayTrigger` values that include ALL relevant modifiers for the current roll context (action modifiers, attribute/skill modifiers, attack/defense modifiers).
- A new breakdown panel (styled with gold/green/red colors) lists each source modifier by name with its signed value and type (e.g., "Encumbrance -2D", "Explorer +2D", "In Motion -2D", "Trauma -1D").
- The `ModifierManager` tracks source attribution via `_modifierSources` and `actionDiceBreakdown` arrays, populated during modifier construction.
- This replaces the old behavior where players could only see a single aggregated total with no indication of its composition.

### GM Logs System

A toggleable logging system for Game Masters:

- Type `/logs` in the chat to enable/disable GM-only logging.
- When enabled, every actor stat change is captured with before/after values and posted as a blind chat message visible only to GMs.
- Changes are categorized (Attribute, Skill, Condition, Modifier, Other) with timestamps and the modifying user's name.
- Uses `preUpdateActor` to snapshot previous values and `updateActor` to detect and report deltas.
- Log messages use the `degenesis.isSystemLog` flag for identification.

### Inventory Stow System

Items can now be stowed inside transportation containers:

- A "stow" button appears on eligible inventory items (weapons, armor, ammunition, equipment, mods, shields, artifacts).
- Clicking it opens a dialog listing all transportation items owned by the actor.
- Selecting a transport and confirming sets the item's `system.location` to the transport's ID, visually moving it into that container's contents.
- The module `inventory-stow.js` provides `promptStowInTransport()` and `setItemTransportLocation()` functions.
- Character and NPC sheet `activateListeners()` methods wire up the stow button handlers.

### Collapsible Inventory Categories

Inventory sections can be collapsed and expanded with persistent state:

- Each inventory category header gains a toggle button (chevron icon).
- Clicking it collapses/expands the category's item list.
- Collapsed state is persisted per actor per world via `localStorage`, surviving page reloads and re-renders.
- Implemented in `sheet-inventory-collapse.js` with `loadInventoryCollapsedSet()`, `saveInventoryCollapsedSet()`, `applyInventoryCollapsedState()`, and `registerInventoryCategoryCollapse()`.
- Applied to both character and NPC inventory tabs.

---

## Bug Fixes & Improvements

### Die Evaluation Fix (Damage Bonus)

The official system used `new Die({ faces: 6, number: N }).evaluate().total` for damage bonus calculations (the +1D, +2D, +1D/2 damage formulas). In Foundry v12+, `Die.evaluate()` became asynchronous and returns a Promise, making the synchronous `.total` access return `undefined` or `NaN`. This fork replaces all such calls with a `degenesisSyncD6Total()` helper that uses `new Roll().evaluate({ async: false })`, restoring correct damage bonus calculations.

### `requiresReload` Fix for Game Settings

The official system used `onChange: () => { location.reload(); }` on two settings (AutomateEncumbrancePenalty and ShowInventoryHeaders). This pattern is deprecated in Foundry v13+ and can cause unexpected full page reloads during settings changes. This fork replaces both with the standard `requiresReload: true` property, which shows a native Foundry "reload required" notification instead.

### `alreadyRendered` Guard for Chat Cards

When the combat automation system processes attack and defense rolls, the roll methods (`rollWeapon`, `rollFightRoll`, etc.) already render chat cards internally. Without a guard, the automation code would render a second duplicate card. The `alreadyRendered` flag on card data prevents this, set to `true` by the roll method after rendering, and checked by sheet event handlers before rendering.

### Chat Rendering Safety

The `DegenesisChat.renderRollCard` method was made `async` and now uses optional chaining (`rollResult.rolls?.forEach`) to prevent crashes when roll data is incomplete (e.g., during automated defense rolls where secondary rolls may be absent).

### Combat Round Hook -- Motion State Reset

A new `updateCombat` hook (`module/hooks/combat.js`) resets the `system.state.motion` flag on all combatants at the start of each new combat round, reflecting the DEGENESIS rule that "In Motion" status expires at round boundaries.

### Motion Status Effect Sync

The actor hooks now bidirectionally sync the `system.state.motion` actor flag with a token status effect icon:
- When `system.state.motion` changes on an actor, the corresponding token status effect is toggled to match.
- When a token status effect is toggled manually, the actor's `system.state.motion` flag is updated to match.
- The system searches for the motion status effect by both ID candidates and localized label matching across six languages.

### Damage Preview in Roll Dialog

When making a weapon attack roll, the roll dialog now displays a base damage preview line (e.g., "Base damage (no triggers): 5 (fleshwounds)") so players can see expected damage before committing to the roll.

### Magazine Reload System

New i18n keys and logic support a magazine reload workflow with load/unload prompts, amount validation, and insufficient ammo warnings (14 new `UI.ReloadMagazine*` keys).

---

## Foundry VTT Compatibility

- **Minimum version**: Foundry VTT v13
- **Verified version**: Foundry VTT v14.359
- **`CONST.CHAT_MESSAGE_STYLES`**: The system uses the v14-compatible `CONST.CHAT_MESSAGE_STYLES` constants (not the deprecated `CONST.CHAT_MESSAGE_TYPES`).
- **`canvas.grid.measurePath`**: The combat automation's distance measurement uses the v14 API with a fallback to the older `canvas.grid.measureDistances` for backward compatibility.
- **`requiresReload`**: Game settings use the standard `requiresReload: true` property instead of the deprecated `onChange: () => location.reload()` pattern.
- **Async Die evaluation**: Damage bonus dice use synchronous `Roll.evaluate({ async: false })` instead of the broken synchronous `Die.evaluate().total` pattern.

---

## Files Changed

### New Files (8)
| File | Purpose |
|---|---|
| `module/combat-automation.js` | Full attack vs defense automation pipeline |
| `module/hooks/combat.js` | Combat round hooks (motion reset) |
| `module/intrinsic-melee-weapons.js` | Unarmed punch/kick weapon definitions |
| `module/inventory-stow.js` | Item stowing into transportation containers |
| `module/sheet-inventory-collapse.js` | Collapsible inventory category state |
| `templates/apps/salvoes-dialog.html` | Salvoes round count dialog |
| `templates/chat/auto-combat-card.html` | Combat resolution chat card |
| `styles/degenesis.css` | Main stylesheet (restored/modified) |

### Modified Files (27)
| File | Changes |
|---|---|
| `degenesis.mjs` | Modifier migration hook on ready, imports |
| `module/config.js` | New weapon qualities (salvoes, smoothRunning), degenesisSyncD6Total helper, damageModifiers fix |
| `module/settings.js` | requiresReload fix, new combat automation settings (2 new settings) |
| `module/modifier-manager.js` | Multi-effect processing, source tracking, breakdown generation, encumbrance tracking |
| `module/dice.js` | promptSalvoesCount method |
| `module/chat.js` | Async renderRollCard, optional chaining safety |
| `module/hooks/hooks.js` | Register combatHooks |
| `module/hooks/chat.js` | /logs command, auto-combat damage button handler |
| `module/hooks/actor.js` | GM logs system, motion status effect sync, preUpdateActor snapshot |
| `module/hooks/ui.js` | Minor rendering adjustments |
| `module/actor/actor-degenesis.js` | rollWeapon with Salvoes/Smooth Running/automation, setupWeapon/setupFightRoll with display values, handleRegularity, damage preview |
| `module/actor/character-sheet.js` | Intrinsic melee weapons, stow buttons, collapsible inventory, combat automation integration, alreadyRendered guards |
| `module/actor/npc-sheet.js` | Intrinsic melee weapons, stow buttons, collapsible inventory, combat automation integration |
| `module/actor/aberrant-sheet.js` | Combat automation integration, alreadyRendered guards |
| `module/actor/fromHell-sheet.js` | Combat automation integration, alreadyRendered guards |
| `module/item/item-degenesis.js` | salvoesMaxRounds getter, regularityTriggers getter, fullDamage unification across actor types |
| `module/item/item-sheet.js` | Multi-effect modifier UI (add/remove effect rows) |
| `templates/apps/roll-dialog.html` | Modifier breakdown panel, contextNote display, displayDice/displaySuccess/displayTrigger |
| `templates/item/item-modifier-sheet.html` | Multi-effect editor with dynamic rows |
| `templates/actor/character/character-combat.html` | Intrinsic melee weapons section |
| `templates/actor/character/character-inventory.html` | Stow buttons, collapsible category headers |
| `templates/actor/npc/npc-combat.html` | Intrinsic melee weapons section |
| `templates/actor/npc/npc-inventory.html` | Stow buttons, collapsible category headers |
| `lang/en.json` | 94 new translation keys |
| `lang/fr.json` | 94 new translation keys (full French translation) |
| `template.json` | Effects array field for modifier items |
| `module/hooks/handlebars.js` | New Handlebars helpers for templates |

---

## Internationalization

94 new translation keys were added in both English (`lang/en.json`) and French (`lang/fr.json`), covering:

- Combat automation prompts, labels, and notifications (49 keys: `DGNS.Auto*`)
- Salvoes dialog (7 keys: `UI.SalvoesDialog*`)
- Inventory stow dialog (6 keys: `UI.StowDialog*`)
- Magazine reload workflow (14 keys: `UI.ReloadMagazine*`)
- Modifier breakdown display (6 keys: `DGNS.ActionModBreakdown*`)
- Smooth Running prompts (3 keys: `DGNS.Regularity*`)
- GM logs system (3 keys: `DGNS.Logs*`)
- Intrinsic weapons hints (2 keys)
- Damage preview and misc (4 keys)

Existing translations in German, Spanish, Italian, and Polish include the new weapon quality names and descriptions (Salvoes, Smooth Running) but do not yet include the full set of 94 new UI keys.

---

## Known Issues

- **Intrinsic melee weapons require world Items**: The punch and kick weapons are referenced by hardcoded world Item document IDs (`0QODrW1e8iCzdIp4`, `jlAw3QBDSNPpfS1d`). These Items must exist in the world's Items directory as type "weapon" for intrinsic unarmed attacks to appear. If they are missing, a warning is displayed but combat continues without them.
- **Combat automation requires single target**: The automated attack flow only activates when exactly one token is targeted. Multi-target attacks are not automated.
- **Defender must be online or GM-controlled**: If the defending player is offline and the current user is not the GM, the defense phase is skipped. The GM can resolve defense for offline players.
- **Die evaluation uses `async: false`**: The `degenesisSyncD6Total` helper uses the deprecated `{ async: false }` parameter for `Roll.evaluate()`. While functional, Foundry may remove this option in a future major version.
- **Incomplete i18n for DE/ES/IT/PL**: Only English and French have the complete 94 new translation keys. German, Spanish, Italian, and Polish have partial coverage (weapon quality names/descriptions only).

---

## Credits

- **Original system**: Greedyj4ck, Moo Man, Darkhan, ClemEvilzz, KristjanLaane, Pierre (Pabruva)
- **Community fork features**: Combat automation, Salvoes, Smooth Running, multi-effect modifiers, modifier breakdown, GM logs, intrinsic melee weapons, inventory stow, collapsible inventory, v14 compatibility fixes
- **DEGENESIS** is a tabletop RPG by SIXMOREVODKA
