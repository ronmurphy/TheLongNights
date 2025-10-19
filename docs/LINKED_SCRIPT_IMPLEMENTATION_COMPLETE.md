# Linked Script System - Implementation Complete

## Overview

Successfully implemented a **linked script system** for The Long Nights quest framework, enabling Sargem quest scripts to chain together seamlessly. This solves the character creation flow where the personality quiz needs to transition into a companion-specific tutorial.

**Date Completed**: October 19, 2025

---

## What We Built

### 1. Link Script Node Type

A new quest node type that allows one quest script to link to another, creating seamless multi-part quest flows.

**Node Structure:**
```json
{
  "id": "end",
  "type": "link_script",
  "data": {
    "scriptPath": "companion_introduction.json",
    "useTemplates": true
  }
}
```

**Properties:**
- `scriptPath` (string) - Filename in `assets/data/` (`.json` extension optional)
- `useTemplates` (boolean) - Whether to apply template variable replacement

### 2. Template Variable System

Dynamic text replacement system that reads from saved player data.

**Available Variables:**

| Variable | Example Output | Source |
|----------|---------------|--------|
| `{{companion_id}}` | `elf_male` | `playerData.starterMonster` |
| `{{companion_name}}` | `Elf` | Extracted from companion_id |
| `{{player_race}}` | `Human` | `playerData.character.race` |

**Usage in Quest Scripts:**
```json
{
  "type": "dialogue",
  "data": {
    "character": "{{companion_id}}",
    "speaker": "{{companion_name}}",
    "text": "Greetings, {{player_race}}! Ready for adventure?"
  }
}
```

**At Runtime** (with male elf companion and human player):
```json
{
  "character": "elf_male",
  "speaker": "Elf",
  "text": "Greetings, Human! Ready for adventure?"
}
```

### 3. Character Creation Flow

**Old System (Hardcoded):**
```
personalityQuiz.json → App.js callback → Hardcoded chat messages
```

**New System (Linked Scripts):**
```
personalityQuiz.json → link_script → companion_introduction.json → End
```

**Benefits:**
- No hardcoded dialogue in JavaScript
- Tutorial text editable in Sargem visual editor
- Companion-specific content using templates
- Clean separation of concerns

---

## Files Modified

### Core Quest System

**`/src/quests/QuestRunner.js`** - Quest execution engine

**Added Methods:**
1. **`async executeNode(node)`** - Made async to support link_script
2. **`async executeLinkScript(node)`** - Execute link_script node type
3. **`async loadQuestFile(filename)`** - Load quest JSON from assets/data/
4. **`applyTemplateVariables(questData)`** - Replace template variables in dialogue

**Key Implementation Details:**
- Added `case 'link_script'` to executeNode() switch (line ~154)
- Calls completion callback BEFORE linking (fixes timing issue)
- 50ms delay ensures playerData is saved before templates applied
- Clears callback to prevent double-calling
- Keeps `isRunning = true` to maintain control lock

### Quest Data Files

**`/assets/data/personalityQuiz.json`** - Character creation quiz

**Changes:**
- Changed end node from `type: "dialogue"` to `type: "link_script"`
- Links to: `companion_introduction.json`
- Enables template variables: `useTemplates: true`

**`/assets/data/companion_introduction.json`** - NEW FILE

**Structure:**
- 6 nodes total: 4 dialogue + 1 action + 1 end
- Uses `{{companion_id}}` and `{{companion_name}}` templates
- Action node spawns starter backpack
- Completes character creation flow

### Application Code

**`/src/App.js`** - Main application initialization

**Changes:**
- Removed hardcoded chat sequence (lines 147-185 deleted)
- Callback now just processes quiz answers and saves playerData
- Linked script handles all companion introduction dialogue

### Build System

**`/package.json`** - Build scripts

**Added:**
```json
"copy-data": "mkdir -p dist/assets/data && cp -r assets/data/*.json dist/assets/data/ 2>/dev/null || true"
```

**Updated:**
```json
"copy-assets": "npm run copy-help && npm run copy-quest-images && npm run copy-data"
```

**Purpose:** Ensures quest JSON files are copied to dist during build

---

## Technical Deep Dive

### Execution Flow

**Step-by-Step Process:**

1. **Quiz Completion**
   - User answers final question (q5_gender)
   - Quest reaches "end" node (type: link_script)

2. **Link Script Execution** (`executeLinkScript()`)
   ```
   a. Call completion callback with quiz choices
   b. App.js processes answers → creates character → saves playerData
   c. Wait 50ms for save to complete
   d. Load companion_introduction.json from disk
   e. Apply template variables (reads saved playerData)
   f. Replace quest nodes/connections with linked script
   g. Find start node of linked script
   h. Execute start node
   ```

3. **Companion Introduction**
   - Shows 4 dialogue messages with actual companion name
   - Action node spawns backpack in world
   - End node calls stopQuest() → re-enables controls

### Timing Solution

**The Problem:**
- Templates need playerData to exist
- PlayerData is saved in callback AFTER quiz completes
- Linked script loads BEFORE callback fires

**The Solution:**
```javascript
// In executeLinkScript() - Call callback FIRST
if (this.onQuestComplete) {
    console.log('📊 Link_script calling completion callback');
    const callback = this.onQuestComplete;
    this.onQuestComplete = null; // Clear to prevent double-call
    callback(this.choiceTracking);
    
    await new Promise(resolve => setTimeout(resolve, 50)); // Wait for save
}

// NOW load and apply templates - playerData exists!
const linkedQuestData = await this.loadQuestFile(scriptPath);
if (data.useTemplates) {
    this.applyTemplateVariables(linkedQuestData); // ✅ Reads saved data
}
```

### State Management

**Quest Runner State:**
- `isRunning` - Stays `true` throughout link (controls locked)
- `onQuestComplete` - Cleared after first call, set to null
- `choiceTracking` - Preserved through transition
- `nodes` / `connections` - Replaced with linked script data
- `currentNodeId` - Reset to null

**Control Flow:**
- Quiz start: `controlsEnabled = false`
- Link transition: Controls stay locked
- Companion intro end: `controlsEnabled = true`

---

## Testing Guide

### Manual Testing Steps

1. **Clear localStorage** (browser console):
   ```javascript
   localStorage.clear()
   ```

2. **Reload game**

3. **Answer personality questions** (5 questions total)

4. **Expected Console Output:**
   ```
   📝 Choice tracked: q5_gender = 0 (Male)
   🔗 Linking to script: companion_introduction.json
   📊 Link_script calling completion callback with choices: {...}
   🎭 Personality quiz complete! Choices: {...}
   🎁 Giving 1 starting items to inventory...
   ✅ Player data saved: {starterMonster: 'elf_male', ...}
   📖 Loading quest file: assets/data/companion_introduction.json
   ✅ Loaded quest: 6 nodes
   🔄 Applying template variables: {
     '{{companion_id}}': 'elf_male',
     '{{companion_name}}': 'Elf',
     '{{player_race}}': 'Human'
   }
   🔄 Transitioning to linked script (callback already fired)
   🎬 Executing Dialogue 1 (node start): {
     character: 'elf_male',
     speaker: 'Elf',
     text: 'Hey there! I'm your new companion...'
   }
   ```

5. **Verify Behavior:**
   - ✅ See 4 tutorial messages from companion
   - ✅ Companion name appears correctly (e.g., "Elf" not "{{companion_name}}")
   - ✅ Correct companion sprite shown (matches quiz choice)
   - ✅ Backpack spawns after final message
   - ✅ Controls re-enable after companion intro completes
   - ✅ No "Rat" fallback messages

### Debug Checklist

**If templates show literally** (e.g., "{{companion_name}}"):
- Check: playerData saved before applyTemplateVariables called?
- Check: 50ms delay sufficient for async save?
- Check: localStorage.getItem('NebulaWorld_playerData') returns data?

**If wrong companion shown:**
- Check: Quiz choice tracking correct? (console: choiceTracking)
- Check: companionGender included in getSummary()?
- Check: companionId format is "race_gender" (e.g., "elf_male")?

**If linked script doesn't load:**
- Check: dist/assets/data/companion_introduction.json exists?
- Check: npm run copy-data executed during build?
- Check: Network tab shows 200 response for JSON file?

**If controls don't re-enable:**
- Check: Companion intro reaches end node?
- Check: stopQuest() called at end? (console: "🛑 Stopping quest")

---

## Future Enhancements

### 1. Sargem Editor Integration

Add visual node type to quest editor:

**Node Appearance:**
```
┌─────────────────────────┐
│  🔗 Link Script         │
├─────────────────────────┤
│ Script: [dropdown]  📁  │
│ ☑ Use Templates         │
└─────────────────────────┘
```

**Implementation Steps:**
1. Add "Link Script" button to node palette in SargemQuestEditor.js
2. Create link_script node renderer with custom styling
3. Add properties panel with script file dropdown
4. File picker showing available .json files in assets/data/
5. Template checkbox
6. Validation: Warn if target file doesn't exist

### 2. Advanced Template Features

**Pass Variables Between Scripts:**
```json
{
  "type": "link_script",
  "data": {
    "scriptPath": "quest_part_2.json",
    "variables": {
      "npc_name": "Gandor",
      "reward_amount": 100,
      "completed_part_1": true
    }
  }
}
```

**Conditional Linking:**
```json
{
  "type": "link_script",
  "data": {
    "condition": "player_race == 'elf'",
    "scriptPath": "elf_specific_intro.json",
    "fallbackScript": "generic_intro.json"
  }
}
```

**Script Returns:**
```json
{
  "type": "link_script",
  "data": {
    "scriptPath": "companion_side_quest.json",
    "returnOnComplete": true  // Return to calling script when done
  }
}
```

### 3. Additional Template Variables

Expand available variables:

```javascript
{{player_name}}       // Player's chosen name
{{player_level}}      // Current level
{{player_class}}      // Class/archetype
{{companion_hp}}      // Companion current/max HP
{{companion_level}}   // Companion level
{{time_of_day}}       // Dawn/Day/Dusk/Night
{{current_biome}}     // Plains/Forest/Desert/etc
{{days_survived}}     // In-game days
{{inventory_count}}   // Number of items
{{quest_progress}}    // % completion of main quest
```

### 4. Script Chains

Support multi-level linking:

```
intro.json → personality_quiz.json → companion_intro.json → tutorial_part_1.json → tutorial_part_2.json
```

**Benefits:**
- Modular quest design
- Reusable components
- Easy to edit individual parts
- Clear narrative structure

### 5. Variable Replacement in Choices

Support templates in choice options:

```json
{
  "type": "choice",
  "data": {
    "question": "What do you think, {{companion_name}}?",
    "options": [
      "I trust your judgment, {{companion_name}}",
      "Let's ask {{player_race}} traditions",
      "We should consider both options"
    ]
  }
}
```

---

## Architecture Decisions

### Why Call Callback Before Linking?

**Options Considered:**

1. **Pass data through link node** - Complex, requires modifying node structure
2. **Save playerData before quiz ends** - Breaks callback pattern
3. **Call callback before linking** ✅ - Simple, preserves existing patterns

**Trade-offs:**
- ✅ Uses existing callback mechanism
- ✅ No changes to node data structure
- ✅ PlayerData guaranteed to exist for templates
- ⚠️ Callback doesn't fire at "true" quest end (acceptable)

### Why 50ms Delay?

**Purpose:** Ensure localStorage.setItem() completes before reading

**Alternatives:**
- Make callback async (requires changing many callers)
- Use Promise-based storage (major refactor)
- Polling until data exists (overcomplicated)

**Trade-off:** 50ms is imperceptible to user, simple, reliable

### Why Clear Callback After First Call?

**Problem:** Without clearing:
1. Link calls callback → saves playerData
2. Linked script ends → stopQuest() called
3. stopQuest() tries to call callback again → undefined behavior

**Solution:** Set `this.onQuestComplete = null` after first call

---

## Related Systems

### Dependencies

**This system interacts with:**

- **PlayerCharacter** (`/src/PlayerCharacter.js`) - Character creation and stats
- **ChatOverlay** (`/src/ui/Chat.js`) - Dialogue display
- **PlayerCompanionUI** (`/src/ui/PlayerCompanionUI.js`) - Companion portraits
- **VoxelWorld** (`/src/VoxelWorld.js`) - Control lock/unlock
- **Sargem Editor** (`/mapgate/sargem/SargemQuestEditor.js`) - Visual quest editing

### Data Flow

```
User Input → Quest Choice → choiceTracking → Callback → PlayerCharacter.processQuizAnswers()
                                                      → localStorage.setItem()
                                                      → Template System reads localStorage
                                                      → Linked Script executes
```

### Storage Schema

**localStorage Key:** `NebulaWorld_playerData`

**Relevant Fields:**
```javascript
{
  starterMonster: "elf_male",      // Used by {{companion_id}}
  character: {
    race: "human",                  // Used by {{player_race}}
    level: 1,
    stats: { STR: 5, DEX: 2, ... }
  }
}
```

---

## Known Issues & Limitations

### Current Limitations

1. **Template Variables are Read-Only** - Can't modify playerData from templates
2. **No Conditional Templates** - Can't use if/else logic in text
3. **Single Callback Only** - Each link clears callback, can't chain multiple
4. **No Error Recovery** - If linked script fails to load, quest stops entirely
5. **Hard-coded 50ms Delay** - Not configurable, might need adjustment on slow systems

### Edge Cases Handled

✅ **Missing linked file** - Calls stopQuest(), shows error in console
✅ **No callback set** - Skip callback call, continue with link
✅ **Missing playerData** - Falls back to 'rat' companion (with console warning)
✅ **Invalid template variables** - Leaves unreplaced (visible for debugging)
✅ **Multiple links in sequence** - Each link preserves state correctly

### Not Yet Implemented

- ⏳ Script return/resume functionality
- ⏳ Link conditions based on player state
- ⏳ Variable passing between scripts
- ⏳ Sargem editor UI for link_script nodes
- ⏳ Link preview in editor
- ⏳ Template variable validation

---

## Documentation Files

### Created

- **`/docs/LINKED_SCRIPT_SYSTEM.md`** - Technical specification and examples
- **`/docs/LINKED_SCRIPT_IMPLEMENTATION_COMPLETE.md`** - This file (implementation summary)

### Related

- **`/docs/COMPANION_TUTORIAL_SUMMARY.md`** - Companion system overview
- **`/docs/COMPANION_TUTORIAL_INTEGRATION.md`** - Tutorial integration
- **`/README.md`** - Main project README (update recommended)

---

## Quick Reference Commands

### Development

```bash
# Build and run
npm run build && npm run electron

# Build only
npm run build

# Dev mode (hot reload)
npm run dev
npm run electron-dev

# Clear test data
# In browser console:
localStorage.clear()
```

### Debugging

```javascript
// Check playerData
JSON.parse(localStorage.getItem('NebulaWorld_playerData'))

// Check quest runner state
window.voxelApp.questRunner.isRunning
window.voxelApp.questRunner.choiceTracking
window.voxelApp.questRunner.nodes.length

// Manually trigger quest
fetch('assets/data/companion_introduction.json')
  .then(r => r.json())
  .then(data => window.voxelApp.questRunner.startQuest(data))
```

### File Locations

```
/assets/data/personalityQuiz.json         - Character creation quiz
/assets/data/companion_introduction.json  - Tutorial dialogue
/src/quests/QuestRunner.js                - Quest execution engine
/src/App.js                               - Application initialization
/src/PlayerCharacter.js                   - Character system
/package.json                             - Build scripts
```

---

## Summary

**What Changed:**
- ✅ Added link_script node type to QuestRunner
- ✅ Implemented template variable system
- ✅ Created companion_introduction.json script
- ✅ Updated personality quiz to use linking
- ✅ Removed hardcoded chat from App.js
- ✅ Fixed timing issues with callback/playerData
- ✅ Added copy-data build script

**What Works:**
- ✅ Seamless quest chaining (quiz → intro)
- ✅ Dynamic companion-specific dialogue
- ✅ Template variable replacement
- ✅ Controls stay locked during transition
- ✅ Callback fires at correct time
- ✅ PlayerData saved before templates applied

**What's Next:**
- ⏳ Add link_script node to Sargem visual editor
- ⏳ Implement advanced template features (conditionals, variables)
- ⏳ Create more linked quest chains
- ⏳ Add script return/resume functionality
- ⏳ Build template variable library

---

**Status:** ✅ COMPLETE AND FUNCTIONAL

**Last Updated:** October 19, 2025

**Implementation Time:** ~3 hours

**Lines of Code:** ~250 (added), ~40 (removed)
