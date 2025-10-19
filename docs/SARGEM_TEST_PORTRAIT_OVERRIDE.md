# 🐈‍⬛ Sargem Test Portrait Override

**Status**: ✅ Complete  
**Date**: 2024-01-XX  
**Files Modified**: 3

## Overview

When testing quests in Sargem Quest Editor, ALL companion dialogue now displays the black cat portrait (`art/animals/cat_sit.png`) instead of loading entity portraits from `entities.json`. This provides a consistent visual identity during test mode.

## Implementation

### 1. QuestRunner Flag (`/src/quests/QuestRunner.js`)

Added `isSargemTest` boolean flag to track test mode:

```javascript
// In startQuest()
startQuest(questData, onComplete = null, isSargemTest = false) {
    // ... existing code ...
    this.isSargemTest = isSargemTest; // Store test mode flag
}

// In stopQuest()
stopQuest() {
    // ... existing code ...
    this.isSargemTest = false; // Clear test mode flag
}

// Pass QuestRunner reference to ChatOverlay
constructor(voxelWorld) {
    this.chatOverlay = new ChatOverlay(this); // Pass reference to self
}
```

### 2. SargemQuestEditor Flag (`/src/ui/SargemQuestEditor.js`)

Pass `true` for test mode when spawning test NPC:

```javascript
onInteract: (npc) => {
    console.log('🐈‍⬛ Sargem clicked - starting test quest!');
    this.questRunner.startQuest(questData, null, true); // Pass true for isSargemTest
}
```

### 3. Chat Portrait Override (`/src/ui/Chat.js`)

Check test flag and use black cat portrait:

```javascript
// Accept QuestRunner reference in constructor
constructor(questRunner = null) {
    this.questRunner = questRunner; // Reference to QuestRunner for test mode flag
}

// In showNextMessage() companion portrait loading
} else if (isCompanionSpeaking) {
    // Check if we're in Sargem test mode
    const isSargemTest = this.questRunner && this.questRunner.isSargemTest;
    
    if (isSargemTest) {
        // Sargem test mode - always use black cat portrait
        console.log('🐈‍⬛ Sargem test mode - using cat_sit.png for companion portrait');
        const catPortraitPath = 'art/animals/cat_sit.png';
        // ... load portrait ...
    } else {
        // Normal mode - load companion portrait from entities.json
        // ... existing entity loading code ...
    }
}
```

## How It Works

1. **Test Quest Start**: When clicking "Test Quest" in Sargem, a test NPC spawns with the quest attached
2. **Flag Set**: When the test NPC is clicked, `startQuest()` is called with `isSargemTest = true`
3. **Portrait Override**: Chat.js checks `questRunner.isSargemTest` before loading companion portraits
4. **Test Mode Active**: All companion dialogue displays black cat portrait (`cat_sit.png`)
5. **Normal Mode Preserved**: Real quests continue to load portraits from `entities.json`
6. **Flag Cleared**: When quest ends via `stopQuest()`, the flag is reset to `false`

## Visual Result

**Before**:
- Test mode tried to load entity portraits (often missing/broken)
- Confusing for quest designers testing dialogue

**After**:
- Test mode shows consistent black cat (Sargem mascot) for all companion dialogue
- Clear visual indicator that you're in test mode
- Player portrait still shows on left side normally

## Asset Used

- **Portrait**: `assets/art/animals/cat_sit.png`
- **Size**: 124KB
- **Description**: Black cat sitting, matches Sargem emoji (🐈‍⬛)

## Testing

1. Open Sargem Quest Editor (Ctrl+S)
2. Create a dialogue node with a companion character
3. Click "Test Quest" button
4. Click the spawned black cat NPC
5. Verify ALL companion dialogue shows black cat portrait

## Notes

- Only affects companion dialogue (right portrait)
- Player portrait (left) remains unchanged
- Narrator mode (both sides narrator.png) unaffected
- Test flag automatically clears when quest ends
- Works with all quest node types (dialogue, choice, image, item, etc.)

## Future Enhancements

- [ ] Optional: Allow custom test portrait per quest
- [ ] Optional: Add visual "TEST MODE" indicator in dialogue UI
- [ ] Optional: Test mode could use different color scheme
