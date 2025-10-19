# Tutorial System Race Integration Issue - October 19, 2025

## 🐛 The Problem

After implementing the question-based character creation that assigns races to both player and companion, tutorial messages show the wrong companion portrait or don't show it at all.

**Example:**
- Player answers questions → Gets Human player + Elf companion
- Tutorial triggers → Shows "Dwarf" or "Rat" instead of "Elf"
- Portrait doesn't display properly

---

## 🔍 Root Causes

### Issue 1: Portrait File Naming Mismatch

**entities.json defines:**
```json
"elf": {
  "name": "Elf",
  "sprite_portrait": "elf_male.png",  // ← Gender-specific filename
  ...
}
```

**Chat.js tries to load:**
```javascript
portrait.src = `art/entities/${message.character}.jpeg`;  
// Tries: art/entities/elf.jpeg ❌
// Actual file: art/entities/elf_male.png ✅
```

**Mismatch:**
- Code expects: `elf.jpeg`
- Actual file: `elf_male.png` (or `elf_female.png`)

### Issue 2: Gender Not Tracked for Companions

When `preferredCompanion` is set to `"elf"`, the system doesn't know if it should load:
- `elf_male.png`
- `elf_female.png`

The PlayerCharacter tracks the **player's** gender but not the **companion's** gender.

### Issue 3: Chat.js Doesn't Use sprite_portrait from entities.json

Chat.js hardcodes the portrait path instead of reading it from entities.json:

```javascript
// Current (WRONG):
portrait.src = `art/entities/${message.character}.jpeg`;

// Should be (CORRECT):
const entityData = await loadEntityData();
const sprite = entityData.monsters[message.character].sprite_portrait;
portrait.src = `art/entities/${sprite}`;
```

---

## ✅ Solutions

### Option 1: Load sprite_portrait from entities.json (RECOMMENDED)

Modify `Chat.js` to read the `sprite_portrait` field from entities.json:

**File: `/src/ui/Chat.js`** (around line 217)

```javascript
// BEFORE:
} else if (message.character) {
    // Auto-generate portrait path from character ID
    portrait.src = `art/entities/${message.character}.jpeg`;
    portrait.style.fontSize = '';
    portrait.style.lineHeight = '';
    portrait.style.textAlign = '';
    portrait.textContent = '';
}

// AFTER:
} else if (message.character) {
    // Load portrait from entities.json
    try {
        const entityData = await this.loadEntityData();
        const entity = entityData?.monsters?.[message.character];
        
        if (entity && entity.sprite_portrait) {
            portrait.src = `art/entities/${entity.sprite_portrait}`;
        } else {
            // Fallback to .jpeg naming convention
            portrait.src = `art/entities/${message.character}.jpeg`;
        }
    } catch (error) {
        // Fallback if entities.json fails to load
        portrait.src = `art/entities/${message.character}.jpeg`;
    }
    
    portrait.style.fontSize = '';
    portrait.style.lineHeight = '';
    portrait.style.textAlign = '';
    portrait.textContent = '';
}
```

**Also add the loadEntityData method to Chat.js:**

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

### Option 2: Track Companion Gender in PlayerCharacter

Extend the quiz system to assign a gender to the companion:

**File: `/src/PlayerCharacter.js`** (around line 117)

```javascript
// Question 4: Companion Race (assign one of the 3 non-player races)
const allRaces = ['human', 'elf', 'dwarf', 'goblin'];
const availableCompanions = allRaces.filter(r => r !== this.race);
this.preferredCompanion = availableCompanions[answers.companion % availableCompanions.length];

// NEW: Assign random gender to companion
this.companionGender = Math.random() < 0.5 ? 'male' : 'female';

console.log(`  Q4: Preferred companion → ${this.preferredCompanion} (${this.companionGender})`);
```

**Then in App.js:**

```javascript
// Save companion ID with gender suffix
const companionId = `${summary.preferredCompanion}_${summary.companionGender}`;
const playerData = {
  starterMonster: companionId,  // e.g., "elf_male"
  companionRace: summary.preferredCompanion,  // e.g., "elf"
  companionGender: summary.companionGender,  // e.g., "male"
  ...
};
```

This way `starterMonster` would be `"elf_male"` which matches the entity ID in entities.json!

### Option 3: Update entities.json to Use Gender-Neutral IDs

Add gender-neutral entries that point to default sprites:

```json
{
  "monsters": {
    "elf": {
      "name": "Elf",
      "type": "companion",
      "sprite_portrait": "elf_male.png",  // Default to male
      ...
    },
    "elf_male": {
      "name": "Elf",
      "type": "companion", 
      "sprite_portrait": "elf_male.png",
      ...
    },
    "elf_female": {
      "name": "Elf",
      "type": "companion",
      "sprite_portrait": "elf_female.png",
      ...
    }
  }
}
```

This allows both `"elf"` (defaults to male) and `"elf_male"`/`"elf_female"` to work.

---

## 🎯 Recommended Implementation

**Combine Option 1 + Option 2:**

1. ✅ **Fix Chat.js** to load `sprite_portrait` from entities.json
2. ✅ **Track companion gender** in PlayerCharacter
3. ✅ **Store full companion ID** like `"elf_male"` in playerData

This gives you:
- Correct portrait loading
- Gender representation for companions
- Extensibility for future features (voice lines, pronouns, etc.)

---

## 📝 Changes Needed

### 1. Update PlayerCharacter.js

```javascript
// Line ~120
this.preferredCompanion = availableCompanions[answers.companion % availableCompanions.length];
this.companionGender = Math.random() < 0.5 ? 'male' : 'female';  // NEW
console.log(`  Q4: Preferred companion → ${this.preferredCompanion} (${this.companionGender})`);
```

### 2. Update App.js

```javascript
// Line ~130
const companionId = `${summary.preferredCompanion}_${summary.companionGender}`;  // NEW
const playerData = {
  starterMonster: companionId,  // "elf_male" instead of "elf"
  companionRace: summary.preferredCompanion,  // Store base race too
  ...
};
```

### 3. Update Chat.js

Add `loadEntityData()` method and modify portrait loading (see Option 1 code above).

### 4. Update tutorialScripts.json (Optional)

Make messages more dynamic:

```json
{
  "game_start": {
    "messages": [
      {
        "text": "Hey there! Welcome to the world! I'm your companion, and I'll help you survive out here.",
        "delay": 2000
      }
    ]
  }
}
```

No changes needed to JSON if you fix the underlying systems!

---

## 🧪 Testing Checklist

After making changes:

### Test 1: Elf Companion
1. Answer questions → Get Elf companion
2. Console shows: `starterMonster: "elf_male"` or `"elf_female"`
3. Tutorial triggers
4. ✅ Portrait shows elf image
5. ✅ Name shows "Elf"

### Test 2: Dwarf Companion
1. Answer questions → Get Dwarf companion
2. Console shows: `starterMonster: "dwarf_male"` or `"dwarf_female"`
3. Tutorial triggers
4. ✅ Portrait shows dwarf image
5. ✅ Name shows "Dwarf"

### Test 3: Other Races
- Human companion → Shows human portrait
- Goblin companion → Shows goblin portrait

---

## 🔮 Future Enhancements

### Pronouns System

Once companion gender is tracked:

```javascript
// In tutorialScripts.json
{
  "messages": [
    {
      "text": "{{companion_pronoun_subjective}} is eager to help you!",
      // Becomes: "He is eager..." or "She is eager..." or "They are eager..."
    }
  ]
}
```

### Voice Lines

```javascript
// In entities.json
"elf_male": {
  "voice": "elf_male_voice_pack",
  "voice_pitch": 1.0
},
"elf_female": {
  "voice": "elf_female_voice_pack",
  "voice_pitch": 1.2
}
```

### Custom Companion Names

Allow players to name their companion:

```javascript
playerData.companionCustomName = "Legolas";  // Player's chosen name
// Tutorial would show "Legolas" instead of "Elf"
```

---

## 📋 Summary

**Current State:**
- ❌ Companion race stored as `"elf"` (no gender)
- ❌ Chat.js tries to load `elf.jpeg` (doesn't exist)
- ❌ entities.json has `elf_male.png` (gender-specific)
- ❌ Mismatch causes portrait to not load

**After Fix:**
- ✅ Companion stored as `"elf_male"` or `"elf_female"`
- ✅ Chat.js reads `sprite_portrait` from entities.json
- ✅ Correct portrait loads automatically
- ✅ System extensible for future features

Would you like me to implement these changes?
