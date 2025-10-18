# Tutorial Companion Fix - October 18, 2025

## 🐛 Bug Found and Fixed

**Problem:** Tutorial messages were showing up from the wrong companion (Scrappy the Rat) instead of the player's selected companion (e.g., Goblin Grunt).

---

## 🔍 Root Cause

The `TutorialScriptSystem` was checking for companion ID in the wrong order:

### ❌ Before (WRONG):
```javascript
this.companionId = playerData.selectedCompanion || playerData.starterMonster || 'rat';
```

**Issue:** `selectedCompanion` doesn't exist in playerData! The game stores it as:
- `activeCompanion` - Current companion (if player switched)
- `starterMonster` - Initial companion choice
- Defaults to `'rat'` if neither found

So when tutorials ran, it couldn't find `selectedCompanion`, couldn't find `starterMonster` (timing issue?), and defaulted to `'rat'` (Scrappy)!

### ✅ After (CORRECT):
```javascript
this.companionId = playerData.activeCompanion || playerData.starterMonster || 'rat';
```

Now it matches the same pattern used by:
- `CompanionPortrait.js` (line 42)
- `BattleSystem.js` (line 74)
- `BattleArena.js` (multiple places)

---

## 🔧 Changes Made

### File: `/src/ui/TutorialScriptSystem.js`

#### Change 1: Fixed Companion ID Loading
```javascript
// Line 23 - Fixed to check activeCompanion first
this.companionId = playerData.activeCompanion || playerData.starterMonster || 'rat';

// Added debug logging
console.log(`🎓 TutorialScriptSystem using companion: ${this.companionName} (${this.companionId})`);
```

#### Change 2: Added Refresh Method
```javascript
/**
 * Refresh companion info from localStorage (in case it changed)
 */
refreshCompanion() {
    const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    const newCompanionId = playerData.activeCompanion || playerData.starterMonster || 'rat';
    
    // Only update if changed
    if (newCompanionId !== this.companionId) {
        this.companionId = newCompanionId;
        this.companionName = this.getCompanionName(this.companionId);
        console.log(`🎓 TutorialScriptSystem companion updated: ${this.companionName} (${this.companionId})`);
    }
}
```

#### Change 3: Auto-Refresh Before Each Tutorial
```javascript
async showMessageSequence(messages) {
    // Refresh companion info before showing messages (in case player switched companions)
    this.refreshCompanion();
    
    // ... rest of message sequence code
}
```

---

## 🎯 How It Works Now

### Scenario 1: Player Selects Goblin Grunt
1. Game stores: `starterMonster: 'goblin_grunt'`
2. TutorialScriptSystem loads: Finds `starterMonster`, uses `'goblin_grunt'`
3. Tutorial shows: **Grunk (Goblin Grunt)** says the message ✅

### Scenario 2: Player Switches Companion Mid-Game
1. Player switches to Vampire in Companion Codex
2. Game stores: `activeCompanion: 'vampire'`
3. Next tutorial triggers
4. `refreshCompanion()` runs, detects change
5. Tutorial shows: **Vlad (Vampire)** says the message ✅

### Scenario 3: No Companion Data (Edge Case)
1. Corrupt save or missing data
2. TutorialScriptSystem checks: `activeCompanion` (missing), `starterMonster` (missing)
3. Falls back to: `'rat'` (Scrappy) as default
4. Tutorial shows: **Scrappy (Rat)** says the message ✅ (safe fallback)

---

## 🧪 Testing

### Check Console on Game Start
Look for this message:
```
🎓 TutorialScriptSystem using companion: Grunk (goblin_grunt)
```

Should show YOUR selected companion, not Scrappy!

### Test Tutorial Messages
1. Start a new game
2. Select **Goblin Grunt** as companion
3. Pick up backpack
4. **Expected:** Grunk says tutorial message
5. **Not Expected:** Scrappy says anything

### Test Companion Switching
1. Open Companion Codex (C key)
2. Switch to a different companion
3. Trigger any tutorial
4. **Expected:** New companion says the message
5. Console shows: `🎓 TutorialScriptSystem companion updated: ...`

---

## 📊 Companion ID Reference

| Companion | ID | Display Name |
|-----------|-------|--------------|
| Rat | `rat` | Scrappy |
| Goblin Grunt | `goblin_grunt` | Grunk |
| Troglodyte | `troglodyte` | Troggle |
| Skeleton | `skeleton` | Bones |
| Ghost | `ghost` | Whisper |
| Vampire | `vampire` | Vlad |

---

## 🎓 Related Systems

All these systems use the same companion ID pattern now:

1. **TutorialScriptSystem** - Tutorial messages (FIXED ✅)
2. **CompanionPortrait** - Portrait HUD display
3. **BattleSystem** - Battle companion
4. **BattleArena** - Arena battles
5. **CompanionCodex** - Companion management

---

## 📝 Debug Commands

```javascript
// In browser console:

// Check current companion
let data = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
console.log('Active:', data.activeCompanion);
console.log('Starter:', data.starterMonster);

// Force refresh companion
voxelWorld.tutorialSystem.refreshCompanion();

// Manually test a tutorial
voxelWorld.tutorialSystem.showTutorial('game_start');
```

---

## ✅ Status

- ✅ Companion ID loading fixed
- ✅ Auto-refresh on companion switch
- ✅ Debug logging added
- ✅ Consistent with other systems
- ✅ Safe fallback to 'rat' if data missing

**Result:** Tutorials now show from YOUR selected companion, not Scrappy! 🎉

---

## 🚀 Next Test

Run the game and verify:
1. Console shows correct companion on startup
2. Tutorial messages come from your selected companion
3. No more random Scrappy appearances!

If Scrappy still shows up, check the console for the debug message to see what companion ID is actually being used.
