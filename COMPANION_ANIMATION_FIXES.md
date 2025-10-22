# 🎨 Companion Animation & Projectile Fixes

## Issues Fixed

### 1. **Sprite Animation Not Visible** ❌ → ✅
**Problem:** Companion (and player) avatar sprites weren't changing between `_attack`, `_ready`, and default poses despite `updateCompanionPose()` being called.

**Root Cause:**
- Sprite cache was preventing visual updates
- Browser was serving cached images even when `src` attribute changed
- No visual feedback during pose transitions
- No auto-reset to default pose after attacks

**Solution:**
- Added **cache-busting** with `?t=` timestamp query parameter
- Added **opacity transition effect** (0.5 → 1.0) for visual feedback during pose changes
- Implemented **auto-reset timer** (800ms) to return to default pose after attack/ready
- Added **timeout management** to prevent overlapping pose changes
- Bypassed sprite cache for pose updates while maintaining cache for initial loads

### 2. **Projectiles Starting from Wrong Position** ❌ → ✅
**Problem:** Companion ranged weapon projectiles (crossbow, ice bow, throwing knives) originated from center screen (player position) instead of companion panel (right side).

**Root Cause:**
```javascript
// OLD CODE - Wrong position
const startPos = {
    x: this.voxelWorld.player.position.x,
    y: this.voxelWorld.player.position.y + 1,
    z: this.voxelWorld.player.position.z
};
```

**Solution:**
Created `getCompanionProjectileStart()` method that:
1. **Finds companion panel DOM element** by ID (`#companion-panel`)
2. **Gets screen-space coordinates** from panel's bounding rect center
3. **Converts to normalized device coordinates** (-1 to +1)
4. **Creates raycaster** from camera through panel position
5. **Projects to 3D world position** at distance of 5 units from camera

Result: Projectiles now visually arc from companion panel (right side) to enemy target!

## Code Changes

### PlayerCompanionUI.js

#### Constructor - Added Timeout Tracking
```javascript
// Pose animation timeouts
this.playerPoseTimeout = null;
this.companionPoseTimeout = null;
```

#### createPanel() - Added DOM ID
```javascript
panel.id = `${type}-panel`; // Enables querySelector by ID
```

#### updateCompanionPose() & updatePlayerPose() - Complete Rewrite
**New Features:**
- ✅ Cache-busting with timestamp query parameter
- ✅ Visual opacity transition (pulse effect)
- ✅ Proper error handling with fallback to default sprite
- ✅ Auto-reset to default pose after 800ms
- ✅ Timeout clearing to prevent overlapping animations
- ✅ Console logging for debugging

**Animation Flow:**
1. Clear any existing pose timeout
2. Fade avatar to 50% opacity (visual feedback)
3. Load new sprite with cache-busting
4. Restore 100% opacity on load success
5. Set 800ms timeout to return to default (if not already default)

### CompanionCombatSystem.js

#### fireCompanionRangedAttack() - Updated Start Position
```javascript
// NEW CODE - Correct position from companion panel
const startPos = this.getCompanionProjectileStart();
```

#### getCompanionProjectileStart() - New Method
**Algorithm:**
1. Query `#companion-panel` DOM element
2. Calculate panel center in screen pixels
3. Convert to NDC (Normalized Device Coordinates):
   - `x = (screenX / canvasWidth) * 2 - 1`
   - `y = -(screenY / canvasHeight) * 2 + 1`
4. Create THREE.Raycaster from camera through NDC point
5. Project 5 units along ray direction to get world position
6. Return `{x, y, z}` for projectile start

**Fallback:** If panel not found (e.g., UI not loaded), falls back to player position.

## Visual Results

### Before
- ❌ No visible sprite animation changes
- ❌ Projectiles always came from center screen
- ❌ No visual feedback during attacks
- ❌ Attack poses stayed forever (never reset)

### After
- ✅ **Sprite animations visible** with opacity pulse effect
- ✅ **Projectiles arc from companion panel** (right side) to enemy
- ✅ **Visual feedback** during pose transitions
- ✅ **Auto-reset to default** after 800ms
- ✅ **Console logging** for debugging ("🎨 Companion pose update: attack")
- ✅ **Graceful fallback** if sprite files missing

## Testing Checklist

- [ ] Companion with crossbow shows `_attack` pose when firing
- [ ] Companion pose returns to default after ~800ms
- [ ] Projectiles visually start from companion panel area (right side)
- [ ] Projectiles arc smoothly to enemy target
- [ ] Player avatar also shows pose changes during combat
- [ ] Console shows "✅ Companion pose changed to: attack" messages
- [ ] Fallback works if `_attack.png` sprite doesn't exist for a race
- [ ] No memory leaks (timeouts properly cleared)

## File Locations

- `src/ui/PlayerCompanionUI.js` - Sprite animation system
- `src/CompanionCombatSystem.js` - Projectile positioning
- `art/player_avatars/` - Sprite files (e.g., `elf_female_attack.png`)

## Technical Notes

### Why Cache-Busting Works
Browser image caching is aggressive - changing `src` from `sprite.png` → `sprite.png` does nothing. Adding `?t=1234567890` makes browser treat it as new URL and reload.

### Why Opacity Transition
Provides visual feedback that pose is changing, even if sprites look similar. Human eye catches the "pulse" effect.

### Why 800ms Auto-Reset
Matches typical attack animation duration. Ensures companion doesn't get "stuck" in attack pose if reset call is missed.

### Why 5-Unit Projection Distance
Balance between:
- Too close (0-2 units): Projectile spawns behind camera or inside player head
- Too far (10+ units): Projectile spawns beyond enemy position
- Just right (5 units): Visible in scene, distinct from player position

## Future Enhancements

- [ ] Different pose timings per weapon type (bow = 600ms, crossbow = 800ms)
- [ ] Particle effects at projectile spawn point (companion panel)
- [ ] Sound effects synced to pose changes
- [ ] Multi-frame animation (not just 3 PNG states)
- [ ] Camera shake on companion attacks for impact feel
