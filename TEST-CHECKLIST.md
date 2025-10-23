# Quick Test Checklist

## Test Environment
- **Dev Server:** Running (should auto-reload browser)
- **Test Type:** New game start
- **Time:** ~10 minutes per test

---

## Test #1: Backpack Unlock on New Game

### Setup
1. Open browser with dev server
2. Click "New Game"
3. Observe hotbar area (should be DISABLED/greyed out)

### Execute
1. Walk to starting backpack (should be marked on minimap)
2. Left-click on the backpack icon (the 🎒 sprite)
3. Watch for status notification

### Expected Results
- ✅ Status shows: "🎒 Found backpack! Inventory system unlocked!"
- ✅ Hotbar becomes ENABLED (you can now click it)
- ✅ Tool buttons appear on screen
- ✅ Companion portrait appears
- ✅ Backpack loot shows in inventory
- ✅ Hotbar tutorial appears

### If It Fails
- Check browser console for errors
- Verify backpack is `type: 'worldItem'` not a block
- Check that `itemType` is `'backpack'`

---

## Test #2: Ranged Weapons on Close Enemies

### Setup
1. Complete Test #1 (so hotbar is unlocked)
2. Get a ranged weapon using debug command:
   ```javascript
   giveItem('ice_bow')  // or 'crossbow', 'fire_staff', 'throwing_knives'
   ```
3. Find or spawn bloodmoon enemies (should be spawning at night)

### Execute
1. Select ranged weapon in hotbar (should show as selected)
2. Walk CLOSE to an enemy (within arm's reach)
3. Look directly at enemy (reticle should outline it in orange)
4. Right-click directly on the enemy

### Expected Results
- ✅ Projectile fires from your position
- ✅ Projectile travels toward enemy
- ✅ Projectile hits and deals damage
- ✅ Enemy health decreases
- ✅ Impact effect visible
- ✅ Status message shows weapon type (e.g., "❄️ Ice arrow released!")

### Debug Output (Console)
Should see:
```
🏹 Firing ice_bow at (x, y, z)
🎯 ice_bow hit [enemy_type]! Damage: 1
```

### If It Fails (Close Range)
- Check console for: "No projectile mesh created"
- Verify enemy is detected: reticle should be orange
- Try from farther away (should work for far enemies)
- Check if `hit.face` is blocking (should not with our fix)

---

## Test #3: Ranged Weapons on Far Enemies

### Setup
1. Same as Test #2
2. But spawn enemies FARTHER away (50+ blocks)

### Execute
1. Select ranged weapon
2. Look at distant enemy (reticle outline should show)
3. Right-click on empty space near enemy (or on enemy)

### Expected Results
- ✅ Projectile fires
- ✅ Travels across distance
- ✅ Hits enemy or ground nearby
- ✅ Works the same as Test #2

### Why This Test?
Confirms that both close AND far range targeting works with the fix.

---

## Test #4: Block Placement Still Works

### Setup
1. Select a placeable block (wood, stone, etc.)
2. Look at ground/wall

### Execute
1. Right-click on block surface

### Expected Results
- ✅ Block places normally
- ✅ Ranged weapon check doesn't interfere
- ✅ No status message about weapon fire

### Why This Test?
Confirms our fix didn't break normal block placement.

---

## Test #5: Tools Still Work (Grappling Hook)

### Setup
1. Get grappling hook: `giveItem('crafted_grappling_hook')`
2. Look at a block

### Execute
1. Right-click on block surface

### Expected Results
- ✅ Grappling hook animation plays
- ✅ You move to target location
- ✅ Status shows: "🕸️ Grappled to..."

### Why This Test?
Confirms other tools still work with our fix.

---

## Console Commands for Testing

```javascript
// Give items for testing
giveItem('ice_bow')
giveItem('crafted_crossbow')
giveItem('crafted_fire_staff')
giveItem('crafted_throwing_knives')

// Spawn enemies
testCombat()  // Start bloodmoon battle
testCombat('zombie_crawler')  // Specific enemy type

// Check status
window.voxelApp.hasBackpack  // Should be true after pickup
window.voxelApp.bloodMoonSystem.activeEnemies.size  // Count enemies
```

---

## Success Criteria

All tests pass if:
- [ ] Backpack unlocks hotbar on pickup
- [ ] Ranged weapons fire at close enemies
- [ ] Ranged weapons fire at far enemies
- [ ] Block placement still works
- [ ] Tool actions still work
- [ ] No console errors
- [ ] No broken functionality

**Time to complete:** ~10-15 minutes
