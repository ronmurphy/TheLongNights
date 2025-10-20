# 🍖 Food Eating System

## Overview
Complete food consumption system that allows players to eat food items for healing, stamina restoration, and temporary buffs. Buffs stack and last 30 seconds each.

## How to Use
1. **Craft or gather food** (bread, cooked meat, berries, etc.)
2. **Add food to hotbar** (slots 1-8)
3. **Right-click** to eat the food
4. **Effects apply immediately** (healing, stamina, buffs)

## Food Types & Effects

### 🍳 Cooked Foods (Best)

| Food | Emoji | Healing | Stamina | Buff | Duration |
|------|-------|---------|---------|------|----------|
| **Bread** | 🍞 | 1 heart | +20 | None | - |
| **Baked Potato** | 🥔 | 1 heart | +15 | None | - |
| **Berry Bread** | 🍓🍞 | 1 heart | +25 | +20% speed | 30s |
| **Carrot Stew** | 🥕🍲 | 2 hearts | +30 | +50% stamina regen | 30s |
| **Grilled Fish** | 🐟🔥 | 2 hearts | +35 | +30% speed | 30s |

### 🥗 Raw Foods (Less Effective)

| Food | Emoji | Healing | Stamina | Buff |
|------|-------|---------|---------|------|
| **Berry** | 🍓 | 0 hearts | +10 | None |
| **Wheat** | 🌾 | 0 hearts | +5 | None |
| **Carrot** | 🥕 | Half heart | +8 | None |
| **Potato** | 🥔 | Half heart | +8 | None |
| **Fish** | 🐟 | Half heart | +10 | None |

## Smart Healing System

The food system uses **intelligent healing** that respects the broken heart emoji system:

### Healing Logic:
- **2 HP = ❤️** (full heart)
- **1 HP = 💔** (broken/half heart)
- **0 HP = 💜** (empty heart)

### Smart Healing Example:
```javascript
// Player at 5 HP (2.5 hearts: ❤️❤️💔)
// Eats Bread (heals 2 HP)
// Result: 6 HP (3 hearts: ❤️❤️❤️) ✅

// Player at 5 HP (2.5 hearts: ❤️❤️💔)
// System detects odd HP (broken heart)
// Heals 1 HP first to complete heart: 💔 → ❤️
// Then heals remaining 1 HP
// Result: ❤️❤️❤️ with proper emoji display!
```

### Status Messages:
- **Broken heart completed**: "💔 → ❤️"
- **Full heart restored**: "+1❤️"
- **Half heart**: "+💔"
- **Already full HP**: "Already at full HP"

## Buff System

### How Buffs Work:
1. **Multiple buffs stack** - Eat 3 Berry Breads = +60% speed total
2. **Duration: 30 seconds** each
3. **Buffs expire independently** - Each food's buff times out separately
4. **Visual feedback** - Status message shows active buffs

### Buff Types:

#### 🏃 **Speed Buff**
- Increases movement speed
- From: Berry Bread (+20%), Grilled Fish (+30%)
- Stacks additively: 2× Berry Bread = +40% speed

#### ⚡ **Stamina Regen Buff**
- Increases stamina regeneration rate
- From: Carrot Stew (+50%)
- Stacks additively: 2× Carrot Stew = +100% stamina regen

## Implementation Details

### Files Modified:
1. **`src/FoodSystem.js`** (NEW) - Core food eating logic
2. **`src/VoxelWorld.js`** - Integration:
   - Import FoodSystem
   - Initialize in constructor
   - Right-click handler for eating
   - Update loop for buff expiration

### Key Methods:

#### `FoodSystem.eatFood(itemType)`
- Handles food consumption
- Applies healing, stamina, and buffs
- Shows status messages
- Returns true if food was consumed

#### `FoodSystem.addBuff(type, amount, duration)`
- Adds a buff to active buffs array
- Buffs stack (multiple of same type allowed)
- Each buff tracks its own expiration time

#### `FoodSystem.update(deltaTime)`
- Called every frame
- Removes expired buffs
- Reapplies buff calculations

#### `FoodSystem.getFoodInfo(itemType)`
- Returns food name and effects
- Used for tooltips (future feature)

### Healing Potion Update:
The healing potion was also updated to use smart healing:
```javascript
// OLD: Always heal 1 heart (2 HP)
this.playerHP.heal(1);

// NEW: Smart healing for broken hearts
const isOddHP = (this.playerHP.currentHP % 2) === 1;
const healAmount = isOddHP ? 1 : 2; // Complete broken heart or full heart
this.playerHP.heal(healAmount);
```

## Future Enhancements

### 🍱 Food Box Item (Planned)
- Special inventory item (bento box emoji: 🍱)
- Takes 1 hotbar/backpack slot
- Stores up to 4 food items (stacked)
- Can include healing potions
- Quick access without cluttering inventory

### 🐾 Companion Food System (Future)
- Same food effects for companions
- Feed companion during exploration (not just arena)
- Companion-specific buffs (attack, defense)

### 📊 Food Tooltips (Future)
- Hover over food in inventory
- Show: Healing, stamina, buffs, duration
- Color-coded by quality (raw = gray, cooked = gold)

## Testing Checklist

- [x] Right-click bread → heals 1 heart, +20 stamina
- [x] Right-click berry bread → speed buff shows in status
- [x] Multiple foods → buffs stack correctly
- [x] Wait 30 seconds → buff expires, speed returns to normal
- [x] Eat when full HP → "Already at full HP" message
- [x] Broken heart (odd HP) → completes heart properly
- [x] Food consumption → item quantity decreases
- [x] Empty food slot → slot clears from hotbar

## Version History

- **v0.8.0** - Initial food eating system implementation
- **v0.8.0** - Healing potion smart healing fix
- **October 20, 2025** - System completed and documented

## Notes

- Raw foods are intentionally less effective to encourage cooking
- Buffs don't save between sessions (temporary power-ups)
- Speed buffs affect `StaminaSystem.normalSpeedMultiplier`
- Stamina regen buffs affect `PlayerCharacter.staminaRegen`
- All healing goes through `PlayerHP.heal()` for proper UI sync
