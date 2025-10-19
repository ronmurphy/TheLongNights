# Companion Introduction Script - Two-Phase Tutorial System

## Problem Analysis

### Current Flow (BROKEN)
```
1. Game loads → TutorialScriptSystem initializes
2. No playerData yet → companionId = 'rat' (fallback)
3. Personality quiz runs
4. Quiz completes → playerData saved with "elf_male"
5. App.js shows hardcoded chat (works, uses correct companion)
6. TutorialSystem STILL has "rat" cached until next refresh
7. Later tutorials might show "Rat" if triggered before refresh
```

### Root Cause
- TutorialScriptSystem initializes BEFORE character creation
- Uses fallback 'rat' when no playerData exists
- Even though `refreshCompanion()` exists, timing issues cause "Rat" to appear

## Proposed Solution: Two-Script System

### Phase 1: Generic Introduction (Pre-Quiz)
**New Script:** `intro_pre_quiz.json` (Sargem quest format)
- Generic NPC or narrator voice
- "Tell me about yourself..." intro
- Leads directly into personality quiz
- NO companion mentioned yet

### Phase 2: Personalized Welcome (Post-Quiz)
**New Script:** `companion_introduction.json` (Sargem quest format)
- Triggered AFTER playerData saved
- TutorialSystem loads with CORRECT companion ID
- Companion introduces themselves personally
- Shows backpack tutorial
- Links to main tutorial flow

## Implementation Plan

### Step 1: Create Pre-Quiz Introduction Script
**File:** `/assets/data/quests/intro_pre_quiz.json`

```json
{
  "questId": "intro_pre_quiz",
  "title": "Welcome to The Long Nights",
  "nodes": {
    "start": {
      "id": "start",
      "type": "dialogue",
      "data": {
        "character": "narrator",
        "name": "???",
        "emoji": "🌙",
        "text": "Welcome, traveler. The Long Nights are upon us...",
        "nextNode": "about_you"
      }
    },
    "about_you": {
      "id": "about_you",
      "type": "dialogue",
      "data": {
        "character": "narrator",
        "name": "???",
        "emoji": "🌙",
        "text": "But first, tell me about yourself. Who are you, really?",
        "nextNode": "lead_to_quiz"
      }
    },
    "lead_to_quiz": {
      "id": "lead_to_quiz",
      "type": "action",
      "data": {
        "action": "start_personality_quiz",
        "nextNode": "end"
      }
    },
    "end": {
      "id": "end",
      "type": "end",
      "data": {
        "questComplete": true
      }
    }
  },
  "startNode": "start"
}
```

### Step 2: Create Post-Quiz Companion Introduction
**File:** `/assets/data/quests/companion_introduction.json`

```json
{
  "questId": "companion_introduction",
  "title": "Meet Your Companion",
  "nodes": {
    "start": {
      "id": "start",
      "type": "dialogue",
      "data": {
        "character": "{{companion_id}}",
        "name": "{{companion_name}}",
        "text": "Hey there! I'm {{companion_name}}, your new companion. Let's get you set up for exploring!",
        "nextNode": "minimap_tutorial"
      }
    },
    "minimap_tutorial": {
      "id": "minimap_tutorial",
      "type": "dialogue",
      "data": {
        "character": "{{companion_id}}",
        "name": "{{companion_name}}",
        "text": "See that red dot on your minimap in the top-right? That's your Explorer's Pack with all your tools!",
        "nextNode": "movement_tutorial"
      }
    },
    "movement_tutorial": {
      "id": "movement_tutorial",
      "type": "dialogue",
      "data": {
        "character": "{{companion_id}}",
        "name": "{{companion_name}}",
        "text": "Use WASD to move and your mouse to look around. If you spawn in a tree, just punch the leaves to break free!",
        "nextNode": "backpack_tutorial"
      }
    },
    "backpack_tutorial": {
      "id": "backpack_tutorial",
      "type": "dialogue",
      "data": {
        "character": "{{companion_id}}",
        "name": "{{companion_name}}",
        "text": "Walk up to the backpack (🎒) and hold left-click to pick it up. That'll unlock your inventory and tools. Good luck, explorer!",
        "nextNode": "spawn_backpack"
      }
    },
    "spawn_backpack": {
      "id": "spawn_backpack",
      "type": "action",
      "data": {
        "action": "spawn_starter_backpack",
        "nextNode": "end"
      }
    },
    "end": {
      "id": "end",
      "type": "end",
      "data": {
        "questComplete": true
      }
    }
  },
  "startNode": "start"
}
```

### Step 3: Update QuestRunner to Support Template Variables

**Add to QuestRunner.js:**
```javascript
/**
 * Replace template variables in dialogue text
 * {{companion_id}} → "elf_male"
 * {{companion_name}} → "Elf"
 * {{player_race}} → "Human"
 */
replaceTemplateVariables(text) {
    const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    const companionId = playerData.activeCompanion || playerData.starterMonster || 'rat';
    
    // Load companion name from entities.json
    const companionName = this.getCompanionName(companionId);
    const playerRace = playerData.character?.race || 'unknown';
    
    return text
        .replace(/\{\{companion_id\}\}/g, companionId)
        .replace(/\{\{companion_name\}\}/g, companionName)
        .replace(/\{\{player_race\}\}/g, playerRace);
}

async getCompanionName(companionId) {
    try {
        const response = await fetch('art/entities/entities.json');
        const data = await response.json();
        return data.monsters[companionId]?.name || companionId;
    } catch (error) {
        return companionId;
    }
}
```

### Step 4: Update App.js to Use Sargem Scripts

**Replace hardcoded chat with:**
```javascript
// After playerData saved (line 144)
localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
console.log('✅ Player data saved:', playerData);

// Load and run companion introduction Sargem script
(async () => {
    // Force tutorial system to refresh with new companion
    if (window.voxelApp && window.voxelApp.tutorialSystem) {
        await window.voxelApp.tutorialSystem.refreshCompanion();
    }
    
    // Run companion introduction script
    if (window.voxelApp && window.voxelApp.questRunner) {
        window.voxelApp.questRunner.loadAndStartQuest('companion_introduction.json', (results) => {
            console.log('✅ Companion introduction complete!');
            // Backpack spawned by script action
        });
    }
})();
```

## Alternative: Simpler TutorialScriptSystem Approach

### Update tutorialScripts.json
**Add new companion_introduction tutorial:**

```json
"companion_introduction": {
  "id": "companion_introduction",
  "title": "Meet Your Companion",
  "trigger": "onCompanionAssigned",
  "once": true,
  "messages": [
    {
      "text": "Hey there! I'm your new companion. Let's get you set up for exploring!",
      "delay": 2000
    },
    {
      "text": "See that red dot on your minimap in the top-right? That's your Explorer's Pack with all your tools!",
      "delay": 2000
    },
    {
      "text": "Use WASD to move and your mouse to look around. If you spawn in a tree, just punch the leaves to break free!",
      "delay": 2000
    },
    {
      "text": "Walk up to the backpack (🎒) and hold left-click to pick it up. That'll unlock your inventory and tools. Good luck, explorer!",
      "delay": 0
    }
  ]
}
```

### Add to TutorialScriptSystem.js:
```javascript
/**
 * Called after character creation when companion is assigned
 */
async onCompanionAssigned() {
    // Force refresh to load new companion
    await this.refreshCompanion();
    console.log(`🎓 Companion assigned: ${this.companionName} (${this.companionId})`);
    
    // Show companion introduction
    await this.showTutorial('companion_introduction');
    
    // Spawn backpack after tutorial
    if (this.voxelWorld && this.voxelWorld.spawnStarterBackpack) {
        this.voxelWorld.spawnStarterBackpack();
    }
}
```

### Update App.js:
```javascript
// Replace hardcoded chat (line 147-185) with:
(async () => {
    if (window.voxelApp && window.voxelApp.tutorialSystem) {
        await window.voxelApp.tutorialSystem.onCompanionAssigned();
    }
})();
```

## Linked Scripts Feature for Sargem

### Proposed Node Type: "link_quest"
```json
{
  "id": "end_quiz",
  "type": "link_quest",
  "data": {
    "nextQuest": "companion_introduction.json",
    "preserveContext": true
  }
}
```

### Implementation in QuestRunner:
```javascript
case 'link_quest':
    const nextQuest = currentNode.data.nextQuest;
    console.log(`🔗 Linking to quest: ${nextQuest}`);
    
    // Save current context if needed
    if (currentNode.data.preserveContext) {
        this.questContext = this.questContext || {};
    }
    
    // Load and start next quest
    this.loadAndStartQuest(nextQuest, this.onComplete);
    break;
```

## Benefits of Two-Script Approach

### ✅ Pros
1. **Clean separation** - Pre-quiz vs post-quiz content
2. **Correct companion data** - Always uses assigned companion
3. **No "Rat" fallback issues** - Companion exists before introduction
4. **Maintainable** - Scripts in JSON, easy to edit
5. **Extensible** - Linked scripts enable complex tutorial flows
6. **Reusable** - Template variables work for any companion

### ⚠️ Considerations
1. Need to implement template variable system
2. Need to implement linked scripts feature
3. Slight complexity increase in flow

## Recommended Next Steps

### Phase 1: Quick Fix (Use TutorialScriptSystem)
1. Add `onCompanionAssigned()` method to TutorialScriptSystem
2. Update App.js to call it instead of hardcoded chat
3. Ensure `refreshCompanion()` is called first

### Phase 2: Sargem Enhancement (Linked Scripts)
1. Implement `link_quest` node type in QuestRunner
2. Add template variable replacement
3. Create proper intro script flow

### Phase 3: Full Tutorial Overhaul
1. Convert all tutorial messages to Sargem scripts
2. Use linked scripts for tutorial progression
3. Add branching based on player choices

## Testing Checklist

- [ ] nuclearClear() before test
- [ ] No "Rat" message appears
- [ ] Correct companion shown in intro
- [ ] Companion name displays correctly
- [ ] Backpack spawns after intro complete
- [ ] No blank messages
- [ ] Portrait shows correct sprite from player_avatars

## Files to Modify

1. `/src/App.js` - Replace hardcoded chat with tutorial trigger
2. `/src/ui/TutorialScriptSystem.js` - Add onCompanionAssigned()
3. `/assets/data/tutorialScripts.json` - Add companion_introduction
4. `/src/quests/QuestRunner.js` (future) - Add linked scripts + templates

## Current Status

- ✅ PlayerCompanionUI fixed
- ✅ Sprite paths corrected
- ✅ companionGender system working
- ⚠️ "Rat" message due to timing issue
- ⚠️ Hardcoded chat should be replaced with script
- 🔮 Linked scripts feature not yet implemented

This two-script approach solves the timing issue and sets up a foundation for the linked scripts feature you want in Sargem! 🎯
