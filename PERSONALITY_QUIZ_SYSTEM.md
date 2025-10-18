# 🎭 Personality Quiz Character Creation System

## Overview

Daggerfall-style personality quiz that determines player stats, race, and starting items through story-driven questions instead of boring stat allocation screens.

## ✅ What's Been Implemented

### 1. Enhanced Choice System
**File**: `src/quests/QuestRunner.js`

- ✅ Supports 4-button choices with 2x2 grid layout
- ✅ Tracks all player choices during quest
- ✅ Callback system when quest completes
- ✅ Auto-adapts: 2 buttons = flex row, 3-4 buttons = grid layout

### 2. Personality Quiz Questions
**File**: `assets/data/personalityQuiz.json`

Four personality questions that replace stat allocation:

1. **Survival Philosophy** → Primary stat (+2 bonus)
   - Strength, Dexterity, Vitality, or Luck

2. **Gear Priority** → Starting item + secondary stat (+1 bonus)
   - Weapon (combat_sword, +STR)
   - Tool (watering_can, +DEX)
   - Magic (magic_amulet, +LCK)
   - Food (10 berries, +VIT)

3. **Ancestry** → Race selection + racial bonuses
   - Human (balanced)
   - Elf (+1 DEX, -1 STR)
   - Dwarf (+1 VIT, -1 DEX)
   - Goblin (+1 LCK, -1 VIT)

4. **Companion Preference** → Starting companion
   - Goblin Grunt (fighter)
   - Rat (scavenger)
   - Wanderer (mysterious)
   - Guardian (loyal)

### 3. Player Character System
**File**: `src/PlayerCharacter.js`

Complete stat system with quiz integration:

**Base Stats** (all start at 2):
- **STR** - Melee damage, harvest speed
- **DEX** - Jump height, movement speed
- **VIT** - Max HP, stamina, hunger resistance
- **LCK** - Crit chance, drop rates

**Derived Stats**:
- HP: 6 base + (VIT-2) × 2 HP
- Stamina: 100 base + (VIT-2) × 10
- Stamina Regen: 10 + (DEX-2) × 2 per second

**Methods**:
- `processQuizAnswers(answers)` - Apply quiz results to stats
- `getJumpMultiplier()` - DEX affects jump (+10% per point)
- `getSpeedMultiplier()` - DEX affects speed (+5% per point)
- `getHarvestSpeedMultiplier()` - STR affects harvesting (+15% per point)
- `getMeleeDamageBonus()` - STR adds flat damage
- `getCritChance()` - LCK affects crits (5% + 5% per point)
- `getDropRateMultiplier()` - LCK affects loot (+10% per point)

## 📋 What's Left To Do

### Phase 1: Integration (Next Steps)
1. Load personalityQuiz.json on new game
2. Run quiz BEFORE companion selection screen
3. Pass quiz results to PlayerCharacter class
4. Give player starting items based on answers
5. Pre-select preferred companion

### Phase 2: Player Avatar UI
1. Create base sprite for each race (32x32 or 64x64 pixels)
2. Build player avatar component (bottom-right corner)
3. Move hearts + stamina into avatar area
4. Show level and race label

### Phase 3: Sprite Layering
1. Equipment layering system (helmet, chest, weapon, etc.)
2. Debug tool to position items on sprite
3. Render equipped items in correct layer order

### Phase 4: Companion Heart System
1. Convert companion HP to hearts (2 HP = 1 heart)
2. Use ❤️ for full hearts, 💔 for half hearts
3. Match visual style with player

## 🎯 Example Quiz Flow

```
Game Start
  ↓
"Before your journey begins..." (intro text)
  ↓
Q1: "What keeps someone alive in the wild?"
  → Player picks "Speed to escape danger"
  → +2 DEX applied
  ↓
Q2: "If you could only carry one thing?"
  → Player picks "A reliable tool"
  → +1 DEX, gets watering_can
  ↓
Q3: "Which heritage calls to you?"
  → Player picks "Elf - swift and graceful"
  → +1 DEX, -1 STR, race = 'elf'
  ↓
Q4: "Who would you trust?"
  → Player picks "A clever scavenger"
  → preferredCompanion = 'rat'
  ↓
"Your journey begins..." (end text)
  ↓
[Character Created]
  Race: Elf
  Stats: STR 1, DEX 6, VIT 2, LCK 2
  Items: watering_can
  Companion: Rat (pre-selected)
  ↓
Normal game intro with companion selection
(Rat is highlighted/pre-selected)
```

## 🎮 How Quiz Results Affect Gameplay

### STR (Strength)
- **Melee damage**: +1 damage per point
- **Harvest speed**: +15% per point (chop wood/mine faster)
- **Example**: STR 5 = +3 damage, 45% faster harvesting

### DEX (Dexterity)
- **Jump height**: +10% per point
- **Movement speed**: +5% per point
- **Example**: DEX 6 = 40% higher jumps, 20% faster running

### VIT (Vitality)
- **Max HP**: +2 HP per point (above base 6)
- **Max Stamina**: +10 per point
- **Example**: VIT 4 = 10 HP (5 hearts), 120 stamina

### LCK (Luck)
- **Crit chance**: 5% base + 5% per point
- **Drop rates**: +10% per point
- **Example**: LCK 4 = 15% crit, 20% better loot

## 🔧 Integration Points

### VoxelWorld.js
- Add `this.playerCharacter = new PlayerCharacter()`
- Load quiz on new game (no existing save)
- Run quiz → get answers → process stats → continue to intro

### GameIntroOverlay.js
- Receive preferred companion from quiz
- Pre-select that companion in UI
- Player can still change if they want

### InventorySystem.js
- Add starting items from quiz results
- Grant items after quiz completes

### Physics/Movement
- Apply DEX multipliers to jump/speed
- Apply STR multiplier to harvest timers

## 📝 Code Example: Running the Quiz

```javascript
// In VoxelWorld.js or game start logic

import { QuestRunner } from './quests/QuestRunner.js';
import { PlayerCharacter } from './PlayerCharacter.js';

// Check if new game (no save file)
if (!hasSaveFile) {
    // Load quiz data
    const quizData = await fetch('assets/data/personalityQuiz.json')
        .then(r => r.json());

    // Run quiz with completion callback
    this.questRunner.startQuest(quizData, (choices) => {
        // Convert choices to quiz answer format
        const answers = {
            survival: choices['q1_survival'],   // 0-3
            gear: choices['q2_gear'],           // 0-3
            ancestry: choices['q3_ancestry'],   // 0-3
            companion: choices['q4_companion']  // 0-3
        };

        // Create and configure player character
        this.playerCharacter = new PlayerCharacter();
        this.playerCharacter.processQuizAnswers(answers);

        // Give starting items
        answers.startingItems.forEach(item => {
            this.inventory.addItem(item);
        });

        // Show companion selection with pre-selected choice
        this.showIntroOverlay(this.playerCharacter.preferredCompanion);
    });
}
```

## 🎨 UI Layout (Planned)

```
┌──────────────────────────────────────┐
│      [First Person View]             │
│                                      │
│                                      │
│  ┌───────────┐  ┌──────────────┐   │
│  │  🧝 Elf   │  │  🐀 Rat      │   │
│  │  Lv 1     │  │  Lv 1        │   │
│  │           │  │              │   │
│  │  ❤️❤️❤️   │  │  ❤️❤️❤️❤️  │   │
│  │  [sprite] │  │  [sprite]    │   │
│  │  ▓▓▓▓▓░░  │  │              │   │
│  │  Stamina  │  │              │   │
│  └───────────┘  └──────────────┘   │
│  [      Hotbar (1-5)        ]      │
└──────────────────────────────────────┘
```

## 🚀 Next Session Goals

1. Integrate quiz into new game flow
2. Test quiz → stats → items chain
3. Create placeholder sprites for 4 races
4. Build basic player avatar UI component

---

**Status**: Core logic complete ✅ | UI integration pending ⏳
**Date**: 2025-10-18
**Inspiration**: Daggerfall (1996) personality quiz system
