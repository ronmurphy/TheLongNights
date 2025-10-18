# Tutorial System Audit - October 18, 2025

## 📋 Summary

Your game has **TWO tutorial systems** running simultaneously:

1. **✅ TutorialScriptSystem (Sargem-based)** - The CORRECT one (JSON-driven)
2. **⚠️ Legacy Hardcoded Messages** - The OLD one (still active!)

---

## 🎯 The Correct System: TutorialScriptSystem

### Location
- `/src/ui/TutorialScriptSystem.js` (301 lines)
- `/assets/data/tutorialScripts.json` (380 lines)

### How It Works
```javascript
// In VoxelWorld.js constructor:
this.tutorialSystem = new TutorialScriptSystem(this);

// Trigger events from game code:
this.tutorialSystem.onGameStart();
this.tutorialSystem.onMacheteSelected();
this.tutorialSystem.onBackpackOpened();
this.tutorialSystem.onItemCrafted('workbench');
// ... etc
```

### Features
- ✅ Loads scripts from `/assets/data/tutorialScripts.json`
- ✅ Event-driven (onGameStart, onBackpackOpened, etc.)
- ✅ Tracks seen tutorials in localStorage
- ✅ `once: true` flag prevents repeating
- ✅ Sequential messages with delays
- ✅ Uses CompanionPortrait for display
- ✅ Context-aware (item, animal triggers)

### Triggers Currently Implemented
```javascript
onGameStart()           // Game starts
onMacheteSelected()     // Machete selected in hotbar
onBackpackOpened()      // Backpack opened (E key)
onItemCrafted(itemId)   // Item crafted at bench
onWorkbenchPlaced()     // Workbench placed in world
onWorkbenchOpened()     // Workbench UI opened
onToolBenchOpened()     // Tool bench UI opened
onKitchenBenchOpened()  // Kitchen bench UI opened
onCampfirePlaced()      // Campfire placed
onNightfall()           // Night falls
onGhostSpawn()          // Ghost spawns
onAnimalSpawn(type)     // Animal spawns
```

---

## ⚠️ The OLD System: showHotbarTutorial()

### Location
`/src/VoxelWorld.js` lines 2627-2650

### The Hardcoded Function
```javascript
this.showHotbarTutorial = () => {
    // Create hotbar if it doesn't exist
    if (!this.hotbarElement) {
        this.hotbarSystem.createUI();
        this.hotbarElement = this.hotbarSystem.hotbarElement;
        this.inventory.setUIElements(this.hotbarElement, this.backpackInventoryElement);
    }

    // Show the hotbar
    this.hotbarElement.style.display = 'flex';

    // ⚠️ LEGACY HARDCODED TUTORIALS:
    setTimeout(() => {
        this.updateStatus('Backpack found! Check your hotbar - you got random starting supplies!');
    }, 1000);

    setTimeout(() => {
        this.updateStatus('Use 1-5 for items, B for backpack, E for workbench!');
    }, 4000);
};
```

### Where It's Called (Still Active!)
1. **Line 1686** - When backpack is picked up from ground
2. **Line 7167** - When Explorer's Pack is received
3. **Line 10192** - When loading a saved game with backpack

### The Problem
These messages are **hardcoded** and will **conflict** with the TutorialScriptSystem messages!

**Example Conflict:**
- TutorialScriptSystem shows: `"This is your backpack! It has tons of space..."`
- OLD system shows: `"Backpack found! Check your hotbar..."`
- **Result:** Player sees TWO different tutorial messages! 😵

---

## 🔧 Recommended Fix

### Option 1: Remove Hardcoded Messages (Recommended)

Replace the `showHotbarTutorial()` function to ONLY show the hotbar, not tutorial messages:

```javascript
// VoxelWorld.js line 2627
this.showHotbarTutorial = () => {
    // Create hotbar if it doesn't exist
    if (!this.hotbarElement) {
        this.hotbarSystem.createUI();
        this.hotbarElement = this.hotbarSystem.hotbarElement;
        this.inventory.setUIElements(this.hotbarElement, this.backpackInventoryElement);
    }

    // Show the hotbar
    this.hotbarElement.style.display = 'flex';
    
    // ✅ Let TutorialScriptSystem handle all messages
    // (No more hardcoded tutorial messages here!)
};
```

### Option 2: Integrate Old Messages into TutorialScriptSystem

Add these to `/assets/data/tutorialScripts.json`:

```json
{
  "backpack_found": {
    "id": "backpack_found",
    "title": "Backpack Found",
    "trigger": "onBackpackPickedUp",
    "once": true,
    "messages": [
      {
        "text": "Backpack found! Check your hotbar - you got random starting supplies!",
        "delay": 1000
      },
      {
        "text": "Use 1-5 for items, B for backpack, E for workbench!",
        "delay": 3000
      }
    ]
  }
}
```

Then call from VoxelWorld.js:
```javascript
// Instead of: this.showHotbarTutorial();
// Do this:
this.tutorialSystem.showTutorial('backpack_found');
this.showHotbarTutorial(); // Just show UI, no messages
```

---

## 🔍 Other Potential Conflicts

### Status Messages (updateStatus calls)

These are **NOT tutorials** - they're just informational status updates:
- `"⛏️ Iron ore discovered!"` (line 1710)
- `"🌾 Found wheat seeds!"` (line 1748)
- `"🏰 Built wall 5 blocks long!"` (line 664)

These are **fine to keep** - they're immediate feedback, not tutorials.

### TutorialScriptSystem Integration Points

Currently properly integrated:
- ✅ `this.tutorialSystem.onBackpackOpened()` - Line 1693
- ✅ `this.tutorialSystem.onCampfirePlaced()` - Line 1103

**Missing integrations** (need to add):
- ❌ `onGameStart()` - Not called anywhere!
- ❌ `onMacheteSelected()` - Not called when machete selected
- ❌ `onNightfall()` - Not called when night falls
- ❌ `onGhostSpawn()` - Not called when ghost spawns
- ❌ `onItemCrafted()` - Not called after crafting

---

## 📝 Action Items

### 1. Fix Conflicting Messages (HIGH PRIORITY)
- [ ] Remove hardcoded tutorial messages from `showHotbarTutorial()`
- [ ] Keep the hotbar UI showing logic
- [ ] Let TutorialScriptSystem handle ALL tutorial messages

### 2. Add Missing Trigger Calls (MEDIUM PRIORITY)
- [ ] Call `onGameStart()` when game first loads
- [ ] Call `onMacheteSelected()` in hotbar selection code
- [ ] Call `onNightfall()` in day/night cycle code
- [ ] Call `onGhostSpawn()` in mob spawning code
- [ ] Call `onItemCrafted(itemId)` after successful crafting

### 3. Test Tutorial Flow (TESTING)
- [ ] Start new game → Should see game_start tutorial
- [ ] Pick up backpack → Should see backpack_opened tutorial (no duplicates!)
- [ ] Select machete → Should see machete_selected tutorial
- [ ] Craft workbench → Should see workbench_crafted tutorial
- [ ] Night falls → Should see nightfall tutorial

### 4. Debug Commands (Already Available)
```javascript
// In browser console:
voxelWorld.tutorialSystem.resetAllTutorials(); // Reset all seen tutorials
voxelWorld.tutorialSystem.stopAll();           // Stop current tutorials
voxelWorld.tutorialSystem.showTutorial('game_start'); // Test specific tutorial
```

---

## 🎯 Sargem Integration Status

Your Sargem node-based scripting system **IS properly integrated**:

- ✅ TutorialScriptSystem loads `/assets/data/tutorialScripts.json`
- ✅ JSON file is Sargem-generated (node-based editor)
- ✅ Event triggers work correctly
- ✅ Message sequencing with delays works
- ✅ Once-only flags work
- ✅ Context-based triggers work (item, animal)

**The only issue:** Old hardcoded messages are conflicting with Sargem-generated ones!

---

## 🚀 Next Steps

1. **Fix the conflict:** Remove hardcoded tutorial messages
2. **Add missing triggers:** Connect all tutorial events to game code
3. **Test thoroughly:** Make sure no duplicate messages
4. **Document for modders:** Show how to add custom tutorials via Sargem

---

## 📚 Related Files

- `/src/ui/TutorialScriptSystem.js` - The main tutorial engine
- `/assets/data/tutorialScripts.json` - Tutorial script data (Sargem-generated)
- `/src/VoxelWorld.js` - Game integration points
- `/src/ui/CompanionPortrait.js` - Visual display for tutorials
- `/src/ui/Chat.js` - Message display system

---

Would you like me to implement the fix to remove the conflicting hardcoded messages?
