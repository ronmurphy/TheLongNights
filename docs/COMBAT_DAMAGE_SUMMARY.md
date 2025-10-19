# Combat Damage System Summary

## ✅ Weapons That Deal Damage to Blood Moon Enemies

### 🔪 Melee Weapons (Left-Click)
All melee weapons check for nearby enemies and apply damage when you left-click:

| Weapon | Damage | Range | Effect | Notes |
|--------|--------|-------|--------|-------|
| **Torch** 🔥 | 1 | 1.5 blocks | Fire burst | Light damage, dual-function (combat + lighting) |
| **Machete** 🔪 | 2 | 1.5 blocks | Slash | Medium damage, dual-function (combat + leaf harvesting) |
| **Stone Hammer** 🔨 | 3 | 2.0 blocks | Stone smash | **AoE damage!** Hits multiple enemies, dual-function (combat + mining) |
| **Tree Feller** 🪓 | 4 | 1.5 blocks | Slash | Highest melee damage, dual-function (combat + tree felling) |

**How it works:**
- Left-click near an enemy with weapon equipped
- Weapon checks for enemies within range using `checkMeleeAttack()`
- Applies damage and creates visual effect
- Most weapons continue with their normal function (mining, chopping, etc.)

---

### 🏹 Ranged Weapons (Right-Click)
All ranged weapons fire projectiles that track and damage enemies during flight:

| Weapon | Damage | Speed | Stamina Cost | Effect | Notes |
|--------|--------|-------|--------------|--------|-------|
| **Throwing Knives** 🔪 | 1 | 0.3 (fastest) | 5 | Slash | Consumes 1 knife per throw, rapid fire |
| **Ice Bow** ❄️ | 1 | 0.45 | 12 | Ice | Low damage but slows enemies |
| **Crossbow** 🏹 | 2 | 0.4 | 10 | Piercing | Fast projectile, good accuracy |
| **Fire Staff** 🔥 | 3 | 0.5 | 15 | Fire AoE | Highest damage, can ignite demo charges! |

**How it works:**
- Right-click to aim at target position (raycast)
- Projectile flies toward target checking for enemies every frame
- Hit detection uses 1.5 block radius around projectile
- On hit: applies damage, creates effect, projectile disappears
- On miss: creates impact effect at target location

**Special Mechanics:**
- **Fire Staff + Demolition Charge Combo**: Fire staff can ignite demo charges for 2x explosion radius!
- **Ice Bow**: Applies slow effect to enemies (future implementation)
- **Throwing Knives**: Only ranged weapon that consumes ammo

---

### 🗡️ Spear (Right-Click Throw)
Special throwable melee weapon:

| Weapon | Damage | Speed | Stamina Cost | Notes |
|--------|--------|-------|--------------|-------|
| **Stone Spear** 🗡️ | 1 | 0.4 | 5 | Hits animals AND enemies, sticks in ground after impact |

**How it works:**
- Right-click to throw spear at target
- Checks for both wild animals AND blood moon enemies during flight
- On hit: deals 1 damage, spear sticks in ground at impact location
- Can be picked up again after thrown

---

### 💣 Demolition Charge (Right-Click Place)
Explosive trap that damages enemies AND the player:

| Type | Blast Radius | Enemy Damage | Player Damage | Timer |
|------|--------------|--------------|---------------|-------|
| **Normal** 💣 | 4 blocks | 5 (center) to 1 (edge) | 4 (center) to 1 (edge) | 3 seconds |
| **Combo** 🔥💣 | 8 blocks | 10 (center) to 1 (edge) | 8 (center) to 1 (edge) | Instant (when hit by fire staff) |

**How it works:**
1. Right-click to place demolition charge
2. 3-second countdown with beeping sound effects
3. On detonation:
   - Destroys all blocks in spherical radius (except bedrock & Christmas tree)
   - Damages all enemies within radius (falloff damage)
   - **DAMAGES PLAYER if within blast radius!** ⚠️
   - Gives destroyed blocks to inventory
   - Creates massive particle effects

**Damage Calculation:**
```javascript
damagePercent = 1.0 - (distance / radius)
damage = Math.max(1, Math.ceil(baseDamage * damagePercent))
```

**Combo System:**
- Fire staff projectile can hit placed demo charges
- Triggers instant detonation with 2x radius (8 blocks!)
- 2x damage to enemies (10 base instead of 5)
- 2x visual effects (extra fire particles)
- Status message: "🔥💣 COMBO! MEGA EXPLOSION!"

**Safety Tips:**
- **Stay back!** Player takes damage if too close
- Combo explosions have huge radius - run far!
- Can be used tactically to clear large enemy waves
- Good for mining, but dangerous during combat

---

## 🎮 Combat System Integration

### File Locations
- **Melee Combat**: `/src/CraftedTools.js` → `handleLeftClick()`
- **Ranged Combat**: `/src/CraftedTools.js` → `fireRangedWeapon()`
- **Spear System**: `/src/SpearSystem.js` → `throwSpear()`
- **Demolition**: `/src/CraftedTools.js` → `detonate()`
- **Enemy Hit Detection**: `/src/CraftedTools.js` → `checkMeleeAttack()`

### Damage Application
All weapons call `BloodMoonSystem.hitEnemy(enemyId, damage)`:
```javascript
this.voxelWorld.bloodMoonSystem.hitEnemy(enemyId, damage);
```

This method:
1. Subtracts damage from enemy HP
2. Logs hit to console
3. Updates status bar
4. Removes enemy if HP <= 0
5. (Future: drops loot)

---

## 🔮 Future Enhancements

### Planned Features
- [ ] **Loot drops** - Enemies drop items when killed (zombie flesh, bones, etc.)
- [ ] **Ice Bow slow effect** - Actually slow enemy movement speed
- [ ] **Torch burn DOT** - 20% chance to apply damage-over-time effect
- [ ] **Critical hits** - Random chance for 2x damage
- [ ] **Weapon durability** - Weapons degrade with use
- [ ] **Explosion knockback** - Push enemies away from blast
- [ ] **Stamina regeneration** - Slower stamina regen during combat

### Companion Combat Stats (already defined)
Companions can equip weapons for stat bonuses:
- `machete: { attack: 2 }`
- `torch: { speed: 1, effect: 'burn' }`
- `stone_hammer: { attack: 3, defense: 1 }`
- `combat_sword: { attack: 4 }`
- `stone_spear: { attack: 4, speed: 1, effect: 'pierce' }`

---

## 📊 Weapon Comparison Chart

### By Damage Output
1. **Tree Feller** - 4 damage (melee, single target)
2. **Fire Staff** - 3 damage (ranged, AoE)
3. **Stone Hammer** - 3 damage (melee, AoE)
4. **Machete** - 2 damage (melee, single target)
5. **Crossbow** - 2 damage (ranged, piercing)
6. **Torch** - 1 damage (melee, burn chance)
7. **Ice Bow** - 1 damage (ranged, slow effect)
8. **Throwing Knives** - 1 damage (ranged, rapid fire)
9. **Spear** - 1 damage (thrown, reusable)
10. **Demolition Charge** - 5-10 damage (explosive, AoE, self-damage!)

### Best Weapons for Different Scenarios

**Early Game (Week 1-2):**
- Torch (always available, dual-function)
- Machete (good damage, harvesting bonus)

**Mid Game (Week 3-5):**
- Stone Hammer (AoE damage for groups)
- Crossbow (ranged safety, good damage)

**Late Game (Week 6+):**
- Tree Feller (highest melee damage)
- Fire Staff (highest ranged damage, combo potential)
- Demolition Charges (tactical nuke option)

**Blood Moon Defense:**
- Stone Hammer (AoE for zombie hordes)
- Fire Staff (high damage, ignite demo traps)
- Demolition Charges (pre-placed around base)

---

## 🐛 Known Issues
- ✅ Machete wasn't dealing damage (FIXED)
- ✅ Torch wasn't dealing damage (FIXED)
- ⚠️ Demolition charges don't apply knockback yet
- ⚠️ No loot drops from killed enemies yet
- ⚠️ Ice Bow slow effect not implemented
- ⚠️ Torch burn DOT not implemented

---

**Last Updated**: October 19, 2025
**Game Version**: 0.7.5
**Status**: All weapons functional ✅
