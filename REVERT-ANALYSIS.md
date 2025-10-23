# Revert Analysis & Fix Plan

## Status: REVERTED TO 8414bf0 ✅

**Reverted from:** commit 0f0d7c9 (HEAD with broken EntityPool)
**Reverted to:** commit 8414bf0 (Last known good "Combat targeting fixes + progressive bloodmoon difficulty system")
**Force pushed to:** origin/main

## What We Lost (Safe to Lose)

1. **EntityPool.js** - Object pooling system (added after 8414bf0)
   - Was trying to reuse sprites and add hitboxes
   - Added complexity without solving the problem
   - **BACKUP:** `_OPTIMIZATION_BACKUP/EntityPool.js`

2. **BloodMoonSystem.js EntityPool integration** (lines added after 8414bf0)
   - Calls to `entityPool.acquire()` instead of creating sprites
   - **BACKUP:** `_OPTIMIZATION_BACKUP/BloodMoonSystem.js.backup`

3. **VoxelWorld.js EntityPool integration**
   - Ranged weapon check was moved BEFORE hit.face check
   - But still had issues
   - **BACKUP:** `_OPTIMIZATION_BACKUP/VoxelWorld.js.backup`

## What We Have Now at 8414bf0

### ✅ Working Features
- **Progressive Bloodmoon Spawning** - Enemies spawn in waves by tier
- **BloodMoonSystem** - Sets `isEnemy = true` flag on sprites (line 364)
- **ColoredGhostSystem** - Ghosts work properly with:
  - Hitbox meshes for reliable raycasting
  - userData flags on both sprite AND hitbox
  - Position updates every frame
- **CraftedTools.fireRangedWeapon()** - Method exists and handles:
  - Distance-based collision detection
  - Damage application via UnifiedCombatSystem
  - Special effects (fire, ice, etc.)

### ❌ Missing Pieces for Bloodmoon Targeting
1. **No hitbox system** in BloodMoonSystem
   - ColoredGhostSystem creates invisible hitboxes (lines 155-176)
   - BloodMoonSystem only creates sprites, no hitboxes
   - This is why ranged weapons might not detect collisions properly

2. **No right-click ranged weapon firing**
   - `CraftedTools.handleRightClick()` doesn't check for ranged weapons
   - Wait, let me verify this...
   - Actually, it SHOULD check (lines 276-285)
   - But the issue is it's called AFTER hit.face check, which blocks sprites

3. **Right-click handler structure issue**
   - Line: `if (!hit.face) return;` happens BEFORE ranged weapon check
   - This blocks ranged weapons on sprites (enemies have no face!)

## The Solution

### Step 1: Fix Right-Click Handler (VoxelWorld.js)
Move ranged weapon check BEFORE `hit.face` validation:
```javascript
} else if (e.button === 2) {
    const selectedSlot = this.hotbarSystem.getSelectedSlot();
    const selectedBlock = selectedSlot?.itemType;

    // CHECK RANGED WEAPONS FIRST (before hit.face!)
    const isRangedWeapon = selectedBlock === 'crossbow' || ...;
    if (isRangedWeapon && selectedSlot.quantity > 0) {
        this.craftedTools.fireRangedWeapon(selectedBlock, pos);
        return;
    }

    // NOW can safely check hit.face (only needed for block placement)
    if (!hit.face) return;
    // ... rest of block placement logic
```

### Step 2: Add Hitbox System to BloodMoonSystem (Optional but Better)
Copy from ColoredGhostSystem:
- Create invisible SphereGeometry hitbox
- Set userData flags on hitbox (isEnemy=true, etc.)
- Update position every frame in updateEnemies()
- This makes raycasting more reliable

### Step 3: Fix Backpack Unlock
Add check in harvestWorldItem():
```javascript
if (itemType === 'backpack' && !this.hasBackpack) {
    this.hasBackpack = true;
    this.generateBackpackLoot();
    this.showHotbarTutorial();
    // ... etc
}
```

## Files to Modify

1. **VoxelWorld.js** - Right-click handler restructuring
2. **BloodMoonSystem.js** - Optional hitbox system (if Step 2 needed)
3. **VoxelWorld.js** - Backpack world item unlock logic

## Why We're Confident This Will Work

1. **ColoredGhostSystem proves it works** - Ranged weapons fire at colored ghosts
2. **CraftedTools.fireRangedWeapon() exists** - Already handles collision detection
3. **The only missing piece is execution order** - Ranged weapon check needs to happen before hit.face check
4. **Hitboxes are optional** - Sprites have userData.isEnemy flag which should be enough for collision detection

## Next Steps

1. ✅ Implement right-click handler fix
2. ⏳ Test ranged weapons at close range
3. ⏳ If it works, skip hitbox system for now (can add later)
4. ⏳ Implement backpack unlock
5. ⏳ Run full test suite

## Backup Location

All backup files in: `/home/brad/Documents/TheLongNights/_OPTIMIZATION_BACKUP/`
- Useful if we need to reference EntityPool or other optimizations later
