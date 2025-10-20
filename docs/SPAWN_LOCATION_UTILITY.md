# 📍 Spawn Location Utility - Usage Guide

## Overview
The `findValidSpawnLocation()` utility finds safe spawn points on solid ground with proper headroom. Perfect for NPCs, quest triggers, and items that need ground placement.

## Location

**File:** `/src/CompanionHuntSystem.js`  
**Method:** `findValidSpawnLocation(centerX, centerZ, radius = 4, maxAttempts = 10)`

## Validation Checks

✅ **Surface Block** - Must be solid ground:
- `dirt`
- `grass`
- `stone`
- `sand`
- `snow`

✅ **Spawn Position** - Must be air (not inside block/tree)

✅ **Headroom** - 2 blocks tall clearance for NPCs

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `centerX` | number | - | Center X coordinate to search from |
| `centerZ` | number | - | Center Z coordinate to search from |
| `radius` | number | 4 | Search radius in blocks |
| `maxAttempts` | number | 10 | Maximum spawn attempts before giving up |

## Returns

- **Success:** `{x: number, y: number, z: number}` - Valid spawn coordinates
- **Failure:** `null` - No valid location found

## Usage Examples

### Example 1: Sargem NPC Spawning (Quest Editor)

```javascript
// In QuestRunner.js or Sargem trigger handler
const spawnNPC = (npcConfig, targetX, targetZ) => {
    // Find valid spawn location near target
    const location = this.voxelWorld.companionHuntSystem.findValidSpawnLocation(
        targetX, 
        targetZ, 
        5,  // Search within 5 blocks
        15  // Try up to 15 times
    );

    if (location) {
        // Spawn NPC at valid location
        this.voxelWorld.npcManager.spawn({
            ...npcConfig,
            x: location.x,
            y: location.y,
            z: location.z
        });
        console.log(`✅ NPC spawned at (${location.x}, ${location.y}, ${location.z})`);
    } else {
        console.error('❌ Failed to find valid NPC spawn location');
        // Fallback: spawn at original location anyway
        this.voxelWorld.npcManager.spawn({
            ...npcConfig,
            x: targetX,
            y: this.voxelWorld.getTerrainHeight(targetX, targetZ) + 1,
            z: targetZ
        });
    }
};
```

### Example 2: Quest Item Drop

```javascript
// Drop quest item on ground near player
const playerPos = this.voxelWorld.camera.position;
const location = this.voxelWorld.companionHuntSystem.findValidSpawnLocation(
    Math.floor(playerPos.x),
    Math.floor(playerPos.z),
    3  // Within 3 blocks of player
);

if (location) {
    this.voxelWorld.createWorldItem(
        location.x,
        location.y,
        location.z,
        'quest_key',
        '🔑'
    );
}
```

### Example 3: Structure Marker Placement

```javascript
// Place structure marker on valid ground
const markerPos = {
    x: structure.x + 5,
    z: structure.z + 5
};

const location = this.voxelWorld.companionHuntSystem.findValidSpawnLocation(
    markerPos.x,
    markerPos.z,
    2  // Very close to intended location
);

if (location) {
    this.createStructureMarker(location.x, location.y, location.z);
}
```

### Example 4: Companion Discovery (Current Use)

```javascript
// Already implemented in CompanionHuntSystem
spawnBillboardItem(discovery) {
    // Items spawn anywhere (even in trees!)
    // No validation needed for companion discoveries
    this.voxelWorld.createWorldItem(x, y, z, item, emoji);
}
```

## Algorithm

1. **First Attempt** - Try center position exactly
2. **Subsequent Attempts** - Radial scatter around center
   - Random angle: `0` to `2π`
   - Random distance: `0` to `radius`
   - Position: `(centerX + cos(angle) * distance, centerZ + sin(angle) * distance)`

3. **Validation** for each position:
   - Check block below is solid ground
   - Check spawn position is air
   - Check 2 blocks above for headroom

4. **Return** first valid location or `null` after max attempts

## Best Practices

### ✅ DO:
- Use for NPC spawning
- Use for quest triggers on ground
- Use for structure markers
- Provide reasonable `radius` (3-10 blocks)
- Handle `null` return gracefully

### ❌ DON'T:
- Use for items that can spawn anywhere (apples in trees!)
- Use for flying/floating entities
- Set radius too small (< 2) - may fail often
- Set radius too large (> 20) - may spawn far from intended location
- Forget to check for `null` return

## Integration with Sargem Quest Editor

### Proposed Enhancement

Add a checkbox in Sargem's "Spawn NPC" node:

```
┌─────────────────────────────┐
│ 📍 Spawn NPC                │
│                             │
│ NPC Type: [Merchant ▼]     │
│ Position: (42, 15, -8)     │
│                             │
│ ☑ Find safe ground         │ ← NEW!
│   Radius: [5] blocks       │ ← NEW!
│                             │
│ Interaction: [Quest Giver] │
└─────────────────────────────┘
```

**Implementation:**
```javascript
// In QuestRunner.triggerSpawnNPC()
if (nodeData.findSafeGround) {
    const location = this.voxelWorld.companionHuntSystem.findValidSpawnLocation(
        nodeData.x,
        nodeData.z,
        nodeData.searchRadius || 5
    );
    
    if (location) {
        npcConfig.x = location.x;
        npcConfig.y = location.y;
        npcConfig.z = location.z;
    }
}

this.voxelWorld.npcManager.spawn(npcConfig);
```

## Performance

- **Fast:** ~10 attempts = ~0.1ms
- **Efficient:** Early exit on first valid location
- **Safe:** Bounded by `maxAttempts`

## Future Enhancements

- [ ] Custom validation function parameter
- [ ] Min/max height constraints
- [ ] Biome-specific validation
- [ ] Avoid water/lava surfaces
- [ ] Cluster avoidance (don't spawn too close to existing entities)

---

**Created:** October 19, 2025  
**Status:** ✅ Ready for Sargem integration
