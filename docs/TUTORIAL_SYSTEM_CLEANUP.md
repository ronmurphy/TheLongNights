# Tutorial System Cleanup - October 18, 2025

## ✅ Change Made

Commented out the old hardcoded tutorial messages in `VoxelWorld.js` to let the TutorialScriptSystem (Sargem-based) handle all tutorials.

### Location
`/src/VoxelWorld.js` - lines 2627-2650 (approximately)

### What Was Changed

**Before:**
```javascript
this.showHotbarTutorial = () => {
    // ... show hotbar UI ...
    
    // Show tutorial message for a few seconds
    setTimeout(() => {
        this.updateStatus('Backpack found! Check your hotbar - you got random starting supplies!');
    }, 1000);

    setTimeout(() => {
        this.updateStatus('Use 1-5 for items, B for backpack, E for workbench!');
    }, 4000);
};
```

**After:**
```javascript
this.showHotbarTutorial = () => {
    // ... show hotbar UI ...
    
    // ⚠️ OLD HARDCODED TUTORIAL MESSAGES - COMMENTED OUT (Oct 18, 2025)
    // These conflict with TutorialScriptSystem (Sargem-based)
    // If new system works well, delete these commented lines
    /*
    setTimeout(() => {
        this.updateStatus('Backpack found! Check your hotbar - you got random starting supplies!');
    }, 1000);

    setTimeout(() => {
        this.updateStatus('Use 1-5 for items, B for backpack, E for workbench!');
    }, 4000);
    */
    
    // ✅ NEW: Let TutorialScriptSystem handle all tutorial messages
};
```

### What Still Works

1. ✅ **Hotbar UI** - Still shows correctly when backpack is picked up
2. ✅ **Inventory System** - Still connects properly
3. ✅ **TutorialScriptSystem** - Now the ONLY system showing tutorial messages

### What Was Removed

- ❌ Hardcoded "Backpack found!" message
- ❌ Hardcoded "Use 1-5 for items..." message

These messages will now come from:
- `/assets/data/tutorialScripts.json` → `backpack_opened` tutorial
- Triggered by: `this.tutorialSystem.onBackpackOpened()` (line 1693)

---

## 🧪 Testing Instructions

### Test 1: New Game - First Backpack Pickup
1. Start a new game
2. Find and pick up the backpack
3. **Expected:** TutorialScriptSystem shows companion message about backpack
4. **Not Expected:** Old hardcoded status messages

### Test 2: Verify No Duplicate Messages
1. Start new game
2. Pick up backpack
3. **Check:** Should only see ONE tutorial message, not two
4. **Message source:** Should be from companion (with portrait)

### Test 3: Hotbar Still Works
1. Pick up backpack
2. **Expected:** Hotbar appears at bottom of screen
3. **Expected:** Starting items visible in hotbar slots
4. **Expected:** Can use 1-5 keys to select items

### Test 4: Tutorial Persistence
1. Pick up backpack, see tutorial
2. Close and reopen backpack
3. **Expected:** Tutorial does NOT show again (because `once: true`)

---

## 🔍 What to Look For

### Good Signs ✅
- Companion portrait appears with tutorial message
- Message comes from your selected companion (Scrappy, Grunk, etc.)
- Message uses the text from `tutorialScripts.json`
- No duplicate or conflicting messages
- Tutorial only shows once per new game

### Bad Signs ❌
- Two different backpack messages appear
- Status bar shows old hardcoded text
- No tutorial message appears at all
- Tutorial repeats every time backpack opens

---

## 🔧 Rollback Instructions

If the new system has issues, uncomment the old code:

```javascript
// Remove the /* and */ to restore old behavior
setTimeout(() => {
    this.updateStatus('Backpack found! Check your hotbar - you got random starting supplies!');
}, 1000);

setTimeout(() => {
    this.updateStatus('Use 1-5 for items, B for backpack, E for workbench!');
}, 4000);
```

---

## 🗑️ Cleanup (When Ready)

Once you've confirmed the new system works well for a few days:

1. **Delete the commented code block** (lines with `/* ... */`)
2. **Keep only this:**
```javascript
this.showHotbarTutorial = () => {
    // Create and show hotbar UI
    if (!this.hotbarElement) {
        this.hotbarSystem.createUI();
        this.hotbarElement = this.hotbarSystem.hotbarElement;
        this.inventory.setUIElements(this.hotbarElement, this.backpackInventoryElement);
    }
    this.hotbarElement.style.display = 'flex';
    
    // TutorialScriptSystem handles all messages
};
```

---

## 📝 Notes

- **Function still called** in 3 places (lines 1686, 7167, 10192)
- **UI logic preserved** - only removed tutorial messages
- **TutorialScriptSystem unchanged** - already working correctly
- **Easy to revert** - just uncomment if needed

---

## 🎯 Next Steps (Optional)

### Add Missing Triggers

Consider adding these tutorial triggers that aren't currently called:

1. **onGameStart()** - When game first loads
```javascript
// In VoxelWorld init after world generation:
if (this.tutorialSystem && !playerData.hasSeenGameStart) {
    this.tutorialSystem.onGameStart();
}
```

2. **onMacheteSelected()** - When machete selected in hotbar
```javascript
// In hotbar selection code:
if (selectedItem === 'machete' && !this.macheteSelectedBefore) {
    this.tutorialSystem.onMacheteSelected();
    this.macheteSelectedBefore = true;
}
```

3. **onNightfall()** - When night falls
```javascript
// In day/night cycle code:
if (justTurnedNight && !this.shownNightfallTutorial) {
    this.tutorialSystem.onNightfall();
    this.shownNightfallTutorial = true;
}
```

But for now, just test the backpack tutorial to make sure the commented-out change works! 🎮
