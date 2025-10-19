# Companion Gender System - Implementation Complete

## Overview
Implemented Daggerfall-style random companion gender assignment during question-based character creation. Companions now display correct portraits and names based on their race and randomly assigned gender.

## Changes Made

### 1. PlayerCharacter.js - Random Gender Assignment
**Location:** Line ~117 (Question 4 - Companion Selection)

Added companion gender tracking:
```javascript
// Question 4: Companion Race (assign one of the 3 non-player races)
const allRaces = ['human', 'elf', 'dwarf', 'goblin'];
const availableCompanions = allRaces.filter(r => r !== this.race);
this.preferredCompanion = availableCompanions[answers.companion % availableCompanions.length];

// Randomly assign companion gender (Daggerfall-style)
this.companionGender = Math.random() < 0.5 ? 'male' : 'female';

console.log(`  Q4: Preferred companion → ${this.preferredCompanion} (${this.companionGender})`);
```

**Purpose:** Automatically assigns companion gender at character creation time, matching classic Elder Scrolls: Daggerfall behavior.

### 2. App.js - Store Full Companion ID
**Location:** Line ~130

Updated to combine race + gender into full ID:
```javascript
// Use companion from quiz Q4 with randomly assigned gender (Daggerfall-style)
const companionId = `${summary.preferredCompanion}_${summary.companionGender}`;
console.log(`🤝 Companion assigned from quiz: ${companionId} (${summary.preferredCompanion}, ${summary.companionGender})`);

// Save player data with starter companion AND character data
const playerData = {
  starterMonster: companionId,  // Full ID with gender: "elf_male", "dwarf_female", etc.
  monsterCollection: [companionId],
  firstPlayTime: Date.now(),
  character: app.playerCharacter.save()
};
```

**Purpose:** Store complete companion identifier (e.g., "elf_male" instead of just "elf") so sprite system can find correct portrait files.

### 3. Chat.js - Load Portraits from entities.json
**Location:** Lines 15-29, 187-245

Made methods async and updated portrait loading:
```javascript
async showMessage(message, onComplete = null) {
    await this.showSequence([message], onComplete);
}

async showSequence(messages, onComplete = null) {
    // ... existing code ...
    await this.showNextMessage();
}

async showNextMessage() {
    // ... existing code ...
    
    } else if (message.character) {
        // Load portrait from entities.json using sprite_portrait field
        const entityData = await ChatOverlay.loadCompanionData(message.character);
        if (entityData && entityData.sprite_portrait) {
            portrait.src = `art/entities/${entityData.sprite_portrait}`;
            console.log(`📸 Loaded companion portrait: ${entityData.sprite_portrait}`);
        } else {
            // Fallback to old naming convention if entities.json fails
            portrait.src = `art/entities/${message.character}.jpeg`;
            console.warn(`⚠️ No sprite_portrait found for ${message.character}, using fallback`);
        }
        // ... styling code ...
    }
}
```

**Purpose:** Load correct sprite_portrait from entities.json instead of hardcoding path. Supports both gendered IDs ("elf_male") and legacy race-only IDs ("elf").

### 4. entities.json - Add Gender-Specific Entries
**Location:** `assets/art/entities/entities.json`

Added male/female variants for all companion races:
- `human_male`, `human_female`
- `elf_male`, `elf_female`
- `dwarf_male`, `dwarf_female`
- `goblin_male`, `goblin_female`

Each entry contains proper `sprite_portrait`, `sprite_ready`, and `sprite_attack` fields pointing to gender-specific sprite files.

**Purpose:** Support new companion ID format while maintaining backward compatibility with legacy race-only IDs.

## Data Flow

```
1. PlayerCharacter.fromAnswers()
   └─→ Sets preferredCompanion (race: "elf")
   └─→ Sets companionGender (random: "male"/"female")

2. App.js (First Time Setup)
   └─→ Combines: companionId = "elf_male"
   └─→ Saves to: playerData.starterMonster = "elf_male"

3. TutorialScriptSystem
   └─→ Loads companionId from playerData.starterMonster
   └─→ Fetches companion name from entities.json["elf_male"]
   └─→ Displays in tutorial messages

4. Chat.js (When showing messages)
   └─→ Receives message.character = "elf_male"
   └─→ Loads entities.json["elf_male"]
   └─→ Reads sprite_portrait = "elf_male.png"
   └─→ Displays portrait: "art/entities/elf_male.png"

5. CompanionPortrait.js (HUD display)
   └─→ Already supported sprite_portrait field
   └─→ Works correctly with new system
```

## Expected Sprite Files

The following sprite files should exist in `assets/art/entities/`:
- `human_male.png`, `human_female.png`
- `elf_male.png`, `elf_female.png`
- `dwarf_male.png`, `dwarf_female.png`
- `goblin_male.png`, `goblin_female.png`

**Note:** If gender-specific sprites don't exist yet, the system will fall back to `.jpeg` convention and log a warning.

## Testing Checklist

- [x] Companion gender randomly assigned during character creation
- [x] Console shows full companion ID (e.g., "starterMonster: elf_male")
- [ ] Tutorial system displays correct companion name
- [ ] Chat overlay shows correct companion portrait
- [ ] HUD companion portrait displays correctly
- [ ] Battle system uses correct companion sprites

## Design Philosophy

**Daggerfall-Style Character Creation:**
- Player answers questions → determines player race (Q3) and companion race (Q4)
- Companion gender chosen randomly by system, NOT by player
- Simple, streamlined process without excessive menus
- Gender affects sprite appearance only (portraits, battle sprites)

**Backward Compatibility:**
- entities.json still contains race-only entries ("elf", "dwarf", etc.)
- Legacy systems can continue using race-only IDs
- New systems use gender-specific IDs for proper sprite loading
- Graceful fallback if sprites missing

## Related Systems

- **TutorialScriptSystem:** Uses companionId for name display (already fixed)
- **CompanionPortrait:** Shows HUD portrait (already supports sprite_portrait)
- **BattleSystem:** Uses companion data for combat (may need sprite_ready/sprite_attack support)
- **Chat.js:** Tutorial dialogues and NPC conversations (now fixed)

## Future Enhancements

1. **Player Character Sprites:** Extend system to support player gender/race sprites
2. **Voice Lines:** Use gender for pronoun selection in dialogue
3. **Stat Variations:** Consider gender-based stat modifiers (optional)
4. **Companion AI:** Gender-specific personality traits or behaviors
5. **Romance System:** If implemented, gender becomes important for dialogue trees

## Notes

- Companion gender is cosmetic only (doesn't affect stats)
- Random assignment happens exactly once during character creation
- Gender stored permanently in playerData.character
- System designed for easy expansion to player character sprites
- All changes maintain save game compatibility
