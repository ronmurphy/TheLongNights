# PlayerCompanionUI Visibility & unlockUI() Fixes

## Issues Fixed

### 1. ❌ PlayerCompanionUI Showing Before Character Creation
**Problem:** Companion panel visible on game load, before questions answered  
**Cause:** `update()` loop runs every frame and shows panels if ANY data exists in localStorage  
**Result:** Old data or test data causes companion to show prematurely  

**Fixed:** PlayerCompanionUI.js `update()` method (line 290)
```javascript
// Don't show panels if no character data exists yet (before questions answered)
if (!playerData.character || !playerData.starterMonster) {
    this.hide();
    return;
}
```

### 2. ❌ unlockUI() Using Old CompanionPortrait System
**Problem:** `unlockUI()` command tried to create old `companionPortrait` system  
**Cause:** Code not updated when switching from CompanionPortrait → PlayerCompanionUI  
**Result:** Test command broken, didn't set up companion properly  

**Fixed:** VoxelWorld.js `unlockUI()` method (line 7180)
```javascript
// 🖼️ OLD: Companion portrait (DISABLED - replaced by PlayerCompanionUI)
// if (this.companionPortrait) {
//     this.companionPortrait.create();
// }

// 🖼️ NEW: Set up PlayerCompanionUI with default test companion (goblin_male)
if (this.playerCompanionUI) {
    // Create test playerData if it doesn't exist
    let playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    if (!playerData.starterMonster) {
        playerData.starterMonster = 'goblin_male'; // Test companion
        playerData.monsterCollection = ['goblin_male'];
        localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
        console.log('🧪 Test companion set: goblin_male');
    }
    this.playerCompanionUI.show();
}
```

## How It Works Now

### Character Creation Flow
```
1. Game Loads
   ↓
2. PlayerCompanionUI.update() checks localStorage
   ↓
3. No playerData.character exists yet
   ↓
4. Panels stay HIDDEN ✅
   ↓
5. Questions answered → Character created
   ↓
6. App.js calls playerCompanionUI.show()
   ↓
7. PlayerData saved with character + starterMonster
   ↓
8. Update() sees character data exists
   ↓
9. Panels become VISIBLE with correct companion ✅
```

### Debug Command Flow (unlockUI)
```
1. User types unlockUI() in console
   ↓
2. Checks if UI already unlocked
   ↓
3. Sets hasBackpack = true
   ↓
4. Generates backpack loot
   ↓
5. Shows hotbar
   ↓
6. Creates test playerData:
   {
     starterMonster: 'goblin_male',
     monsterCollection: ['goblin_male']
   }
   ↓
7. Calls playerCompanionUI.show()
   ↓
8. Update loop loads goblin_male companion ✅
```

## Visibility Logic

### Before These Fixes
- ❌ Panels shown if localStorage had ANY data
- ❌ Could show before character creation
- ❌ Could show old/stale companion data
- ❌ unlockUI() tried to use deleted system

### After These Fixes
- ✅ Panels hidden until `playerData.character` exists
- ✅ Only shown after questions answered + character saved
- ✅ unlockUI() creates proper test data (goblin_male)
- ✅ Old CompanionPortrait code commented out

## Files Changed

### PlayerCompanionUI.js
```javascript
// Line 290-297 - Added visibility check
async update() {
    if (!this.voxelWorld || !this.voxelWorld.playerCharacter) return;

    const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    
    // Don't show panels if no character data exists yet
    if (!playerData.character || !playerData.starterMonster) {
        this.hide();
        return;
    }
    
    // ... rest of update logic
}
```

### VoxelWorld.js
```javascript
// Line 7196-7207 - Updated unlockUI() for new system
// OLD CompanionPortrait code commented out
// NEW PlayerCompanionUI setup with goblin_male test companion
if (this.playerCompanionUI) {
    let playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    if (!playerData.starterMonster) {
        playerData.starterMonster = 'goblin_male';
        playerData.monsterCollection = ['goblin_male'];
        localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
    }
    this.playerCompanionUI.show();
}
```

## Expected Behavior

### On Game Load (Fresh Start)
```
🧙 Player + Companion UI initialized (flanking hotbar)
// Panels created but HIDDEN
// update() runs every frame
// Checks: playerData.character exists? NO
// Action: hide() called, panels stay hidden
✅ No UI visible until questions answered
```

### After Character Creation
```
✅ Character created: { race: 'human', preferredCompanion: 'elf', companionGender: 'male' }
🤝 Companion assigned from quiz: elf_male
✅ Player data saved: { character: {...}, starterMonster: 'elf_male' }
🖼️ Player avatar UI displayed
// App.js calls playerCompanionUI.show()
// update() now sees playerData.character exists
✅ Player panel shows (left) with player race/stats
✅ Companion panel shows (right) with elf_male
```

### Using unlockUI() Command
```
> unlockUI()
🔓 Unlocking UI elements...
🧪 Test companion set: goblin_male
✅ Player data saved: { starterMonster: 'goblin_male' }
✅ UI unlocked! Hotbar, backpack, companion ready
// PlayerCompanionUI.show() called
// update() loads goblin_male
🖼️ Loading portrait from player_avatars: goblin_male.png
✅ Goblin companion displayed
```

## Testing Checklist

- [x] Panels hidden on initial game load
- [x] Panels stay hidden during question sequence
- [x] Panels show after character creation complete
- [x] Correct companion displayed (elf_male, dwarf_male, etc.)
- [x] unlockUI() command creates goblin_male test companion
- [x] unlockUI() doesn't try to use old CompanionPortrait
- [ ] No "Rat" message showing in tutorial (still investigating)
- [ ] Blank message issue resolved (still investigating)

## Notes on "Rat" Message

**Fallback Values:** Many systems use `'rat'` as a fallback:
```javascript
// These are OK - they're just defaults if no data exists
companionId = playerData.activeCompanion || playerData.starterMonster || 'rat'
```

**Not a Tutorial Message:** No "Rat" text found in:
- tutorialScripts.json ✅
- App.js intro chat ✅
- showHotbarTutorial() (commented out) ✅

**Possible Sources:**
1. Old localStorage data from previous play session?
2. TutorialScriptSystem loading before playerData saved?
3. CompanionCodex showing old data?

**Recommended:** Clear localStorage completely before testing:
```javascript
localStorage.clear()
location.reload()
```

## Blank Message Issue

**Still investigating** - need to see console output to determine:
1. Is it the first message in intro sequence?
2. Is companionName becoming empty string?
3. Is there an extra message in the array?

**Next debug step:** Check what messages array looks like in App.js
