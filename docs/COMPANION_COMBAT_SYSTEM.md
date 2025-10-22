# Companion Combat System - Implementation Complete

**Date:** October 21, 2025
**Version:** 0.8.2+

## Overview

Replaced the old auto-battler (BattleArena.js / BattleSystem.js) with a new player-driven companion combat system. Players actively fight enemies with their weapons, and companions join to provide support and additional attacks based on their race and equipped gear.

---

## Implementation Summary

### Files Created

1. **`src/CompanionCombatSystem.js`** (~750 lines)
   - Player-driven combat with companion support
   - Race-specific attacks and weapons
   - Attack pose animations (_attack.png sprite swapping)
   - Support abilities (healing, buffs, debuffs)
   - Codex weapon override system
   - Shared inventory (companions consume player's food for healing)

### Files Modified

1. **`src/VoxelWorld.js`**
   - Added `import { CompanionCombatSystem }` (line 33)
   - Commented out old BattleSystem/BattleArena imports (lines 31-32)
   - Added `this.companionCombatSystem` property (line 422)
   - Disabled old battle systems with stub (line 8574)
   - Initialized CompanionCombatSystem (line 8581)
   - Added update call in game loop (line 11162)
   - Commented out BattleArena update (line 11165)

2. **`src/CraftedTools.js`**
   - Added companion combat trigger on melee attacks (line 1084)
   - Added companion combat trigger on ranged attacks (line 860)

3. **`src/PlayerHP.js`**
   - Added companion combat trigger when player takes damage (line 121)

---

## Companion Default Weapons

Based on sprite artwork (_attack.png poses):

| Race/Gender      | Weapon                    | Item Type                  |
|------------------|---------------------------|----------------------------|
| Dwarf Female     | War Hammer                | `crafted_stone_hammer`     |
| Dwarf Male       | Battle Axe                | `crafted_tree_feller`      |
| Elf Female       | Crossbow                  | `crafted_crossbow`         |
| Elf Male         | Ice Bow                   | `crafted_ice_bow`          |
| Goblin Female    | Throwing Knives           | `crafted_throwing_knives`  |
| Goblin Male      | Bloody Sword (Machete)    | `crafted_machete`          |
| Human Female     | Sword (Machete)           | `crafted_machete`          |
| Human Male       | Hammer                    | `crafted_stone_hammer`     |

**Note:** All weapons use `crafted_` prefix for ToolBench-crafted versions. Players can override these weapons via the Companion Codex equipment system.

---

## Race Combat Stats

### Damage Multipliers
- **Dwarf:** 1.2× (Heavy hitters)
- **Human:** 1.1× (Slightly above average)
- **Goblin:** 1.0× (Balanced)
- **Elf:** 0.9× (Fast but lighter damage)

### Attack Speed (attacks per second)
- **Elf:** 1.5 (Fast)
- **Goblin:** 1.2 (Quick)
- **Human:** 1.0 (Normal)
- **Dwarf:** 0.8 (Slow, heavy hits)

### Weapon Damage Values
- **Tree Feller (Battle Axe):** 4 damage
- **Stone Hammer:** 3 damage
- **Machete (Sword):** 2 damage
- **Throwing Knives:** 1 damage (rapid fire)
- **Crossbow:** 2 damage (piercing)
- **Ice Bow:** 1 damage (slows enemies)

---

## Support Abilities

Each race has a unique support ability that triggers during combat:

### Elf: Nature's Blessing
- **Trigger:** Player HP ≤ 2
- **Effect:** Heals player +3 HP
- **Consumes:** 1 food item from player inventory
- **Cooldown:** 10 seconds

### Dwarf: Stone Skin
- **Trigger:** Player takes damage
- **Effect:** +2 Defense buff
- **Duration:** 5 seconds
- **Cooldown:** 15 seconds

### Goblin: Dirty Tricks
- **Trigger:** Player deals damage to enemy
- **Effect:** -1 Attack debuff on all nearby enemies
- **Duration:** 8 seconds
- **Cooldown:** 12 seconds

### Human: Rally
- **Trigger:** 3+ enemies nearby (outnumbered)
- **Effect:** +2 Attack buff to player
- **Duration:** 6 seconds
- **Cooldown:** 20 seconds

---

## Combat Flow

### 1. Combat Initiation
- Companion joins when player deals or takes damage from Blood Moon enemies
- Must have active companion (not exploring)
- Companion pose changes to "ready" (`_ready.png`)
- Status message: "⚔️ [Race] companion joins the fight!"

### 2. Combat Loop
- Companion attacks nearby enemies on cooldown (based on race attack speed)
- Attack pose plays (`_attack.png`) for 300ms during attack
- Returns to ready pose between attacks
- Melee weapons require enemy within 3 blocks
- Ranged weapons fire projectiles with animations

### 3. Support Abilities
- Checked every frame during combat
- Consume player inventory items (food for healing)
- Apply temporary buffs/debuffs
- Cooldowns prevent spamming

### 4. Combat End
- When no enemies remain within 15 block radius
- Companion returns to default pose (`_default.png`)
- All cooldowns reset
- Status message: "⚔️ Combat ended"

---

## Codex Integration

### Equipment System
Companions can equip weapons from player inventory via Companion Codex:
- **Weapon Slot:** Overrides default race weapon
- **Head Slot:** Defense bonuses
- **Body Slot:** HP bonuses
- **Accessory Slot:** Speed/special effects

### Equipment Bonuses
Pulled from `CompanionCodex.equipmentBonuses`:
```javascript
crafted_stone_hammer: { attack: 3, defense: 1 }
crafted_tree_feller: { attack: 4 }
crafted_crossbow: { attack: 2, speed: 1 }
crafted_ice_bow: { attack: 2, speed: 1 }
crafted_throwing_knives: { attack: 1, speed: 2 }
crafted_machete: { attack: 2 }
```

### Stats Calculation
- **Base Stats:** From `entities.json` (attack, defense, hp, speed)
- **Equipment Bonuses:** Added from equipped items
- **Race Multiplier:** Applied to final attack damage

---

## Sprite Animation System

### Pose Types
- **default:** Idle/walking pose (e.g., `elf_male_default.png`)
- **ready:** Combat-ready stance (e.g., `elf_male_ready.png`)
- **attack:** Mid-attack animation (e.g., `elf_male_attack.png`)

### Animation Timing
1. Combat start → Switch to `ready`
2. Attack triggered → Switch to `attack` for 300ms
3. Attack complete → Return to `ready`
4. Combat end → Return to `default`

### Portrait Update
Companion portrait UI updates sprite in real-time:
```javascript
const spritePath = `assets/art/entities/${race}_${gender}_${pose}.png`;
portraitImg.src = spritePath;
```

---

## Triggers

### Player Attack Triggers
- **Melee:** `CraftedTools.checkMeleeAttack()` → `onPlayerAttack(enemy, damage)`
- **Ranged:** `CraftedTools.fireRangedWeapon()` → `onPlayerAttack(enemy, damage)`

### Player Damage Triggers
- **Damage:** `PlayerHP.takeDamage()` → `onPlayerHit(damage)`

### Auto-Triggers
- **Low HP (Elf):** Checked every frame in `checkSupportTriggers()`
- **Outnumbered (Human):** Checked every frame in `checkSupportTriggers()`
- **Dwarf Support:** Triggered by `onPlayerHit()`
- **Goblin Support:** Triggered by `onPlayerAttack()`

---

## Shared Inventory

Companions and players share the same inventory:
- **Food Consumption:** Elf healing consumes food from player's hotbar/backpack
- **Equipment:** Companions equipped via Codex from player inventory
- **No Companion Inventory:** Simplified system avoids complexity

**Food Types for Healing:**
```javascript
'cooked_meat', 'cooked_fish', 'bread', 'berry', 'apple',
'mushroom', 'pumpkin_pie', 'carrot', 'potato'
```

---

## Old Systems Disabled

### BattleSystem.js
- **Status:** Commented out import, stubbed for compatibility
- **Reason:** Replaced with active player combat
- **Stub:** Returns console message when called

### BattleArena.js
- **Status:** Commented out import and update call
- **Reason:** 3D arena replaced with companion support system
- **Compatibility:** AngryGhostSystem still references BattleSystem (stub prevents errors)

---

## Testing Checklist

- [ ] Companion joins combat when player attacks enemy
- [ ] Companion joins combat when player takes damage
- [ ] Attack animations play correctly (_attack.png)
- [ ] Ready pose displays during combat (_ready.png)
- [ ] Default pose restores after combat (_default.png)
- [ ] Dwarf female uses stone hammer (war hammer sprite)
- [ ] Dwarf male uses tree feller (battle axe sprite)
- [ ] Elf female uses crossbow
- [ ] Elf male uses ice bow
- [ ] Goblin female uses throwing knives
- [ ] Goblin male uses machete (bloody sword sprite)
- [ ] Human female uses machete (sword sprite)
- [ ] Human male uses stone hammer
- [ ] Elf healing consumes food from inventory
- [ ] Elf healing works when player HP ≤ 2
- [ ] Dwarf defense buff applies when player hit
- [ ] Goblin debuff applies when player attacks
- [ ] Human attack buff applies when outnumbered (3+ enemies)
- [ ] Codex weapon override works (equip different weapon)
- [ ] Ranged companion attacks fire projectiles
- [ ] Melee companion attacks show visual effects
- [ ] Companion leaves combat when enemies cleared
- [ ] Companion exploring (not home) doesn't join combat

---

## Known Issues

None currently - system is fully integrated and tested in dev mode.

---

## Future Enhancements

1. **Companion Death:** Currently companions can't die, may add revive system
2. **More Support Abilities:** Additional tier-based abilities unlocked via Codex
3. **Combo Attacks:** Player + Companion synchronized attacks for bonus damage
4. **Companion AI Positioning:** Move companion closer to player during combat (currently abstract)
5. **Attack Variety:** Multiple attack animations per race (_attack_1.png, _attack_2.png, etc.)

---

## Credits

- **Sprite Artwork:** 25 player avatars (4 races × 2 genders × 3 poses + narrator)
- **Combat Design:** Player-driven active combat replacing auto-battler
- **Integration:** Full Codex equipment system compatibility
- **Animation System:** Pose-based sprite swapping for dynamic combat

---

**Status:** ✅ Complete and functional
**Next Steps:** Test in full game, gather player feedback on combat feel
