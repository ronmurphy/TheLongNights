# Console Logging Cleanup & Billboard Fix
**Date:** October 20, 2025  
**Status:** ✅ Logging Fixed | ⚠️ Billboard Issue Needs Investigation

---

## Issues Fixed

### 1. ✅ Console Spam Removed

Commented out excessive tree generation logging that was flooding the console:

**Files Modified:** `src/VoxelWorld.js`

**Logs Commented Out:**
- `🏛️ Scanning for pillars under tree...` (Line 9374)
- `🏛️✅ Tree X: Converted Y pillar blocks...` (Line 9402)
- `🌿 Generated Birch tree ID...` (Line 9563)
- `🌿 Birch tree X completed with...` (Line 9599)
- `✅ Tree placement approved at...` (Line 10051)
- `🌲 Attempting tree generation...` (Line 10063)
- All biome-specific tree generation logs (Lines 10067-10086)
- `🏛️ Pillar Tree spawned at...` (Line 9990)

**Result:** Console is now clean and usable for debugging! 🎉

### Quick Block Count Check (Run in Browser Console)

```javascript
// Copy/paste into F12 console while game is running:
console.log(`📊 Block Count: ${window.voxelApp.blockCount} blocks`);
console.log(`📊 Active Billboards: ${window.voxelApp.activeBillboards.length}`);
console.log(`📊 Loaded Chunks: ${window.voxelApp.loadedChunks.size}`);
```

---

## ⚠️ Issues Still Under Investigation

### 2. Billboard Items Disappearing

**Problem Reported:**  
- Player walked ~300 blocks from spawn
- Billboard discovery items (🐟🥚🍯🍎) appeared briefly then vanished
- Only the emoji sprite disappeared; blocks may still be there

**Current Analysis:**

The billboard animation distance culling we added **should not** be removing billboards from the scene - it only skips their animation. However, there are other systems that might be removing them:

1. **Chunk Unloading** - When chunks unload, blocks (including billboards) are removed
2. **Aggressive Cleanup** - The emergency cleanup system might be too aggressive
3. **World Item Despawn** - There might be a despawn timer on world items

**Need to Check:**
- Are billboard blocks actually being removed from `this.world`?
- Or just the billboard sprite being removed from scene?
- Is chunk unloading happening too close to player?

**Possible Fixes:**
1. Keep world items/billboards loaded even when chunk unloads
2. Increase chunk cleanup radius
3. Mark discovery items as "persistent" so they don't despawn

---

### 3. Movement Stutter

**Problem Reported:**
- Slight delay/stutter while moving (less than 1 second)
- Happens once or twice per chunk
- Gets worse farther from spawn

**Likely Causes:**
1. **Chunk Generation** - New chunks loading causes brief frame skip
2. **Block Counter** - If counter gets out of sync, emergency cleanup triggers
3. **Memory Accumulation** - Blocks not being properly cleaned up

**Current Observations:**
- FPS starts at 60 at spawn
- Drops to 50 at 100 blocks
- Drops to 30-40 at 300 blocks

This suggests **blocks are accumulating** rather than being cleaned up properly.

---

### 4. FPS Degradation Over Distance

**Problem:** FPS drops from 60 → 50 → 30-40 as player moves away from spawn

**This is NOT normal behavior.** FPS should stay consistent regardless of distance from spawn.

**Possible Causes:**

#### A. Block Count Growing Unbounded
```javascript
// Check this in console:
console.log(`Block count: ${window.voxelApp.blockCount}`);
console.log(`Expected max: ${window.voxelApp.renderDistance * 2 + 1}^2 * 8 * 64 blocks`);
// For render distance 1: (1*2+1)^2 * 8 * 64 = 4,608 blocks max
```

If block count is higher than expected, chunks aren't being unloaded properly.

#### B. Memory Leaks
- Billboard sprites not being disposed
- Geometries/materials not being released
- Event listeners accumulating

#### C. Chunk Cleanup Not Working
The cleanup system should keep only `renderDistance` chunks loaded. Check:
```javascript
console.log(`Loaded chunks: ${window.voxelApp.loadedChunks.size}`);
// Should be: (renderDistance * 2 + 1)^2
// For render distance 1: (1*2+1)^2 = 9 chunks
```

---

## 🔍 Debugging Steps

### Step 1: Check Block Accumulation

While game is running, press F12 and run:

```javascript
// Check every 30 seconds
setInterval(() => {
    const expected = Math.pow(window.voxelApp.renderDistance * 2 + 1, 2) * 8 * 64;
    console.log(`📊 Performance Check:
    Block Count: ${window.voxelApp.blockCount} / ${expected} expected
    Loaded Chunks: ${window.voxelApp.loadedChunks.size}
    Active Billboards: ${window.voxelApp.activeBillboards.length}
    Player Position: (${Math.floor(window.voxelApp.player.position.x)}, ${Math.floor(window.voxelApp.player.position.z)})`);
}, 30000);
```

### Step 2: Test Billboard Persistence

1. Walk forward and note billboard positions
2. Walk back to same location
3. Check if billboards are still there

If billboards are **gone when you return**, they're being unloaded with chunks.
If billboards are **still there**, it's just a visual culling issue.

### Step 3: Monitor Chunk Unloading

Add temporary logging to see chunk behavior:

```javascript
// In console:
const originalUnload = window.voxelApp.loadedChunks.delete.bind(window.voxelApp.loadedChunks);
window.voxelApp.loadedChunks.delete = function(key) {
    console.log(`🗑️ Unloading chunk: ${key}`);
    return originalUnload(key);
};
```

---

## 🛠️ Potential Fixes

### Fix 1: Increase Chunk Cleanup Radius

The `chunkCleanupRadius` is currently 8. This might be too small.

**File:** `src/VoxelWorld.js` line 105

```javascript
// CURRENT:
this.chunkCleanupRadius = 8;

// TRY:
this.chunkCleanupRadius = 12; // Keep more chunks loaded
```

### Fix 2: Mark Discovery Items as Persistent

Billboard discovery items should NOT be removed when chunks unload. They're rare and valuable.

**Approach:** Add a "persistent" flag to world items:

```javascript
// When creating billboard items:
this.world[key] = { 
    type, 
    mesh: cube, 
    playerPlaced: false, 
    billboard,
    persistent: true  // Don't unload with chunk!
};
```

### Fix 3: Fix Block Counter Sync

If block counter is wrong, it triggers emergency cleanup. Add validation:

```javascript
// In console, check if counter matches reality:
const actualCount = Object.keys(window.voxelApp.world).length;
const trackedCount = window.voxelApp.blockCount;
console.log(`Block count accuracy: ${trackedCount} tracked vs ${actualCount} actual (${trackedCount === actualCount ? 'OK' : 'MISMATCH!'})`);

// If mismatch, reset it:
if (trackedCount !== actualCount) {
    window.voxelApp.blockCount = actualCount;
    console.log('✅ Block counter reset');
}
```

---

## 🎯 Next Steps

1. **Run the debugging commands** to identify root cause
2. **Test billboard persistence** (walk away and back)
3. **Monitor block count growth** as you move
4. **If blocks are growing unbounded** → Fix chunk cleanup
5. **If billboards vanish permanently** → Mark them persistent
6. **If FPS still drops** → Profile for memory leaks

Once we identify the exact cause, we can apply the targeted fix!

---

## 📝 Notes

- Console is now clean - you can see errors and run commands
- Block counter optimization is working (O(1) access)
- Billboard animation culling is working (they don't animate when far)
- But something is either:
  - Removing billboard visuals improperly
  - Not cleaning up old chunks properly
  - Accumulating blocks beyond expected limits

**The good news:** We now have the tools to debug it properly! 🔧
