# Tutorial Companion Name Fix - October 18, 2025

## 🐛 The Problem

Tutorials were showing messages from "Grunk" (a hardcoded nickname) instead of "Goblin Grunt" (the actual companion name from entities.json).

---

## 🔍 Root Causes

### Issue 1: Hardcoded Nicknames
`TutorialScriptSystem.js` had a hardcoded function assigning pet names:

```javascript
getCompanionName(companionId) {
    const names = {
        'rat': 'Scrappy',           // ❌ Should be "Rat"
        'goblin_grunt': 'Grunk',    // ❌ Should be "Goblin Grunt"
        'troglodyte': 'Troggle',    // ❌ Should be "Troglodyte"
        'skeleton': 'Bones',        // ❌ Should be "Skeleton"
        'ghost': 'Whisper',         // ❌ Should be "Ghost"
        'vampire': 'Vlad'           // ❌ Should be "Vampire"
    };
    return names[companionId] || 'Companion';
}
```

### Issue 2: Unused Old System
`CompanionTutorialSystem.js` exists but is NOT imported/used anywhere. It also has hardcoded names. This was confusing during debugging.

### Issue 3: Not Loading Entity Data
TutorialScriptSystem wasn't loading `entities.json` to get the official companion names.

---

## ✅ The Fix

### Changed: TutorialScriptSystem.js

#### 1. Added Entity Data Loading
```javascript
/**
 * Load entity data from entities.json
 */
async loadEntityData() {
    if (this.entityData) return this.entityData;

    try {
        const response = await fetch('art/entities/entities.json');
        this.entityData = await response.json();
        return this.entityData;
    } catch (error) {
        console.error('❌ Failed to load entity data:', error);
        return null;
    }
}
```

#### 2. Load Companion Name from entities.json
```javascript
/**
 * Load companion name from entities.json
 */
async loadCompanionName() {
    const data = await this.loadEntityData();
    if (data && data.monsters && data.monsters[this.companionId]) {
        this.companionName = data.monsters[this.companionId].name; // ✅ Uses official name!
        console.log(`🎓 Companion name loaded: ${this.companionName}`);
    } else {
        // Fallback to capitalized ID if not found
        this.companionName = this.companionId
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
```

#### 3. Removed Hardcoded getCompanionName()
Deleted the entire function with hardcoded nicknames.

#### 4. Updated refreshCompanion()
Now also loads name from entities.json when companion changes:

```javascript
async refreshCompanion() {
    const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
    const newCompanionId = playerData.activeCompanion || playerData.starterMonster || 'rat';
    
    if (newCompanionId !== this.companionId) {
        this.companionId = newCompanionId;
        
        // Load name from entities.json ✅
        const data = await this.loadEntityData();
        if (data && data.monsters && data.monsters[this.companionId]) {
            this.companionName = data.monsters[this.companionId].name;
        }
        // ... fallback logic
    }
}
```

---

## 📊 Before vs After

| Companion ID | OLD Name (Hardcoded) | NEW Name (From entities.json) |
|--------------|---------------------|-------------------------------|
| `rat` | Scrappy | **Rat** |
| `goblin_grunt` | Grunk | **Goblin Grunt** |
| `troglodyte` | Troggle | **Troglodyte** |
| `skeleton` | Bones | **Skeleton** |
| `ghost` | Whisper | **Ghost** |
| `vampire` | Vlad | **Vampire** |

---

## 🎮 What You'll See Now

### Scenario 1: Select Goblin Grunt
```
Console:
  🎓 TutorialScriptSystem using companion: goblin_grunt
  🎓 Companion name loaded: Goblin Grunt

Tutorial Message:
  [Portrait: Goblin Grunt image]
  Goblin Grunt: "This is your backpack! It has tons of space..."
```

### Scenario 2: Select Rat
```
Console:
  🎓 TutorialScriptSystem using companion: rat
  🎓 Companion name loaded: Rat

Tutorial Message:
  [Portrait: Rat image]
  Rat: "This is your backpack! It has tons of space..."
```

**No more "Grunk" or "Scrappy"!** Uses official entity names. ✅

---

## 🧪 Testing

1. **Start game**
2. **Choose Goblin Grunt** as companion
3. **Check console:**
   ```
   🎓 TutorialScriptSystem using companion: goblin_grunt
   🎓 Companion name loaded: Goblin Grunt
   ```
4. **Trigger tutorial** (e.g., pick up backpack)
5. **Expected:** Message from "**Goblin Grunt**"
6. **Not Expected:** Message from "Grunk"

---

## 🗂️ File Cleanup Recommendation

### Consider Deleting (Unused):
- `/src/ui/CompanionTutorialSystem.js`

**Why?** 
- Not imported anywhere in the codebase
- Only confuses debugging
- TutorialScriptSystem (Sargem-based) is the active system

**Before deleting:** Search for any references:
```bash
grep -r "CompanionTutorialSystem" src/
```

If no matches (except the file itself), safe to delete!

---

## 🎯 Benefits

1. ✅ **Consistent naming** - Uses official entity names
2. ✅ **Data-driven** - Names come from entities.json
3. ✅ **Maintainable** - Change names in one place (entities.json)
4. ✅ **Moddable** - Modders can rename companions via entities.json
5. ✅ **No hardcoding** - No need to update code when adding companions

---

## 🔮 Future: Custom Companion Names

Players could potentially **nickname** their companions by adding a field to playerData:

```javascript
// Future feature
playerData.companionNicknames = {
    'goblin_grunt': 'Grunky',  // Player's custom name
    'rat': 'Mr. Whiskers'
};

// TutorialScriptSystem could check:
this.companionName = playerData.companionNicknames[this.companionId] 
                  || entityData.monsters[this.companionId].name
                  || this.companionId;
```

But for now, using official entity names is the correct approach!

---

## ✅ Status

- ✅ Removed hardcoded companion nicknames
- ✅ Loading names from entities.json
- ✅ Auto-refresh when companion changes
- ✅ Fallback to formatted ID if entity not found
- ✅ Consistent with CompanionPortrait system

**Result:** Tutorials now use official companion names from entities.json! 🎉
