# Linked Script System

## Overview

The **linked script system** allows Sargem quest scripts to seamlessly chain together, enabling complex multi-stage quest flows with template variable support.

## Implementation

### QuestRunner Changes

Added three new methods to `/src/quests/QuestRunner.js`:

1. **`executeLinkScript(node)`** - Handles `link_script` node type
   - Loads the next script file
   - Applies template variables if enabled
   - Preserves quest completion callback
   - Transitions smoothly between scripts

2. **`loadQuestFile(filename)`** - Loads quest JSON from `assets/data/`
   - Automatically adds `.json` extension if missing
   - Returns parsed quest data
   - Throws on HTTP errors

3. **`applyTemplateVariables(questData)`** - Replaces template variables in dialogue
   - Reads from `localStorage.NebulaWorld_playerData`
   - Supports: `{{companion_id}}`, `{{companion_name}}`, `{{player_race}}`
   - Replaces in all `text`, `question`, `speaker`, and `character` fields

### Node Type: link_script

```json
{
  "id": "link_to_next",
  "type": "link_script",
  "data": {
    "scriptPath": "companion_introduction.json",
    "useTemplates": true
  }
}
```

**Properties:**
- `scriptPath` (string) - Filename in `assets/data/` (`.json` optional)
- `useTemplates` (boolean) - Whether to apply template variable replacement

## Template Variables

### Available Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `{{companion_id}}` | `elf_male` | Full companion ID from playerData |
| `{{companion_name}}` | `Elf` | Capitalized race name |
| `{{player_race}}` | `Human` | Player's race from character data |

### Usage in Scripts

```json
{
  "id": "greeting",
  "type": "dialogue",
  "data": {
    "character": "{{companion_id}}",
    "speaker": "{{companion_name}}",
    "text": "Greetings, {{player_race}}! Ready for adventure?"
  }
}
```

At runtime with a male elf companion and human player:
```json
{
  "character": "elf_male",
  "speaker": "Elf",
  "text": "Greetings, Human! Ready for adventure?"
}
```

## Character Creation Flow

### Before (Hardcoded)
```
personality_quiz → App.js hardcoded chat → spawn backpack
```

### After (Linked Scripts)
```
personality_quiz → link_script → companion_introduction → spawn backpack
```

### Files

1. **`assets/data/personalityQuiz.json`**
   - Ends with `link_script` node instead of dialogue
   - Links to: `companion_introduction.json`
   - `useTemplates: true`

2. **`assets/data/companion_introduction.json`**
   - Uses `{{companion_id}}` and `{{companion_name}}`
   - Shows tutorial messages
   - Spawns starter backpack via action node

3. **`src/App.js`**
   - Removed hardcoded chat (lines 147-185)
   - Now just saves playerData and lets linked scripts handle intro

## Benefits

### 1. **Separation of Concerns**
- Quiz logic separate from companion introduction
- Intro text editable in Sargem, not hardcoded
- No async chat wrapper in App.js

### 2. **Timing Fix**
- Player data saved BEFORE companion introduction
- No more "Rat" fallback messages
- Templates ensure correct companion always displayed

### 3. **Reusability**
- Template system works for any quest
- Link any script from any other script
- Chain multiple scripts: A → B → C → D

### 4. **Maintainability**
- Edit quest flows in visual editor
- No code changes for dialogue updates
- Template variables prevent hardcoding

## Future Enhancements

### Conditional Linking
```json
{
  "type": "link_script",
  "data": {
    "scriptPath": "elf_specific_intro.json",
    "condition": "player_race == 'elf'",
    "fallbackScript": "generic_intro.json"
  }
}
```

### Variable Passing
```json
{
  "type": "link_script",
  "data": {
    "scriptPath": "quest_part_2.json",
    "variables": {
      "npc_name": "Gandor",
      "reward_amount": 100
    }
  }
}
```

### Script Returns
```json
{
  "type": "link_script",
  "data": {
    "scriptPath": "companion_side_quest.json",
    "returnOnComplete": true  // Return to calling script after
  }
}
```

## Testing

### Manual Test

1. Clear localStorage: `localStorage.clear()`
2. Reload game
3. Answer personality questions
4. **Expected behavior:**
   - Quiz ends → Loads companion_introduction.json
   - Chat shows correct companion sprite (e.g., `elf_male`)
   - Messages use companion name (e.g., "Elf")
   - No "Rat" fallback
   - Backpack spawns after final message

### Console Logs

Look for:
```
🔗 Linking to script: companion_introduction.json
📖 Loading quest file: assets/data/companion_introduction.json
✅ Loaded quest: 6 nodes
🔄 Applying template variables: { '{{companion_id}}': 'elf_male', '{{companion_name}}': 'Elf', '{{player_race}}': 'Human' }
```

## Sargem Editor Integration (Future)

To add link_script node type to visual editor:

1. **Node Palette** - Add "Link Script" icon/button
2. **Node Renderer** - Custom styling (different color, chain icon)
3. **Properties Panel** - Input fields for `scriptPath` and `useTemplates` checkbox
4. **Validation** - Warn if target file doesn't exist

### Visual Design
```
┌─────────────────────────┐
│  🔗 Link Script         │
├─────────────────────────┤
│ File: companion_intro.j │  [📁]
│ ☑ Use Templates         │
└─────────────────────────┘
         ↓
```

## Related Files

- `/src/quests/QuestRunner.js` - Quest execution engine
- `/src/App.js` - First-time player flow
- `/assets/data/personalityQuiz.json` - Character creation quiz
- `/assets/data/companion_introduction.json` - Post-quiz tutorial
- `/src/PlayerCharacter.js` - Character data and stats
- `/src/ui/PlayerCompanionUI.js` - Companion portrait display

## Changelog

**2025-01-XX - v1.0 Initial Implementation**
- Added `link_script` node type to QuestRunner
- Created `companion_introduction.json` template script
- Updated personality quiz to use linked script
- Removed hardcoded chat from App.js
- Added template variable system (companion_id, companion_name, player_race)
- Fixed timing issue causing "Rat" fallback messages

---

*This system enables Daggerfall-style question-based character creation with seamless transition to companion-specific tutorial content.*
