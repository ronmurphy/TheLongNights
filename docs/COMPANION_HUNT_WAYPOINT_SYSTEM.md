# 🐕 Companion Hunt Waypoint System

## Overview
Companion hunt discoveries now create **interactive waypoints** in the journal/map system that lead to actual harvestable items in the world. Players can navigate to these discoveries and collect 1-4 harvestable billboards.

## System Flow

### 1. Companion Finds Item During Hunt
```javascript
// CompanionHuntSystem.checkForDiscovery()
const discovery = {
    position: { x, y, z },
    item: 'fish' | 'egg' | 'honey' | 'apple',
    biome: 'forest' | 'plains' | 'mountains' | 'ocean' | 'desert',
    timestamp: gameTime,
    id: `discovery_${Date.now()}_${Math.random()}`,
    itemCount: 1-4  // Random quantity spawned
};
```

### 2. Spawn Billboard Items in World (1-4 items)
- **1-4 billboard items** spawned at discovery location
- First item spawns at center (waypoint location)
- Additional items spawn in a **cluster** (2-4 blocks radius)
- Items are harvestable (click to collect)
- Items marked with `isCompanionDiscovery: true`
- Each item stores `discoveryId` for tracking

```javascript
// Clustering algorithm
for (let i = 0; i < itemCount; i++) {
    if (i === 0) {
        // First item at center
        spawn at (x, z)
    } else {
        // Scatter around center
        angle = random * 2π
        distance = 2-4 blocks
        spawn at (x + cos(angle) * distance, z + sin(angle) * distance)
    }
}
```

### 3. Create Waypoint in Journal
```javascript
// Added to this.voxelWorld.explorerPins array
const waypoint = {
    id: discoveryId,
    name: `🐟 fish (×3)`,  // Shows item count if > 1
    color: '#a855f7', // Purple
    x: position.x,
    z: position.z,
    created: new Date().toISOString(),
    isCompanionDiscovery: true,
    discoveryId: id,
    itemCount: 3  // Tracks remaining items
};
```

### 4. Player Interaction
1. **Open Journal** (J key)
2. **View waypoints list** - Shows purple companion discoveries with item count
3. **Click waypoint** → Shows on map with purple pin
4. **Click compass button** → Navigate to waypoint on minimap
5. **Travel to location** → Find 1-4 harvestable billboards clustered together
6. **Left-click billboards** → Collect items one by one

### 5. Smart Waypoint Management
When billboard is harvested:
```javascript
// VoxelWorld.harvestWorldItem()
if (isCompanionDiscovery && this.companionHuntSystem) {
    this.companionHuntSystem.onItemCollected(x, y, z);
}

// CompanionHuntSystem.onItemCollected()
1. Decrement waypoint.itemCount
2. Update waypoint name: "🐟 fish (×2)" → "🐟 fish (×1)" → "🐟 fish"
3. Only remove waypoint when itemCount reaches 0
4. Updates journal pin list and map in real-time
```

**Example:**
- Discovery spawns 3 fish
- Waypoint shows: "🐟 fish (×3)"
- Player collects 1 → "🐟 fish (×2)"
- Player collects 1 → "🐟 fish (×1)" or "🐟 fish"
- Player collects last → Waypoint removed ✅

## Visual Indicators

### Hunt Status (NEW - Integrated into Companion Panel)
```
┌─────────────┐
│  [Avatar]   │  ← Companion portrait
│   Elf       │
│  ❤️❤️❤️💜💜 │  ← HP hearts (wrapping support)
│  [═════]    │  ← Stamina bar
│ 🎯 2d 5m (3)│  ← Hunt status! (only visible when hunting)
└─────────────┘
     ↑ Cyan glowing border when hunting
```

**Hunt Status Indicators:**
- `🎯` = Exploring
- `🔄` = Returning
- Time format: `2d 5m` (game-time remaining)
- Item count: `(3)` items found so far
- **No more floating mini-indicator!**

### Waypoint Display
- **Journal Map:** Purple 🟣 pins with item emoji
- **Minimap:** Purple dots (when navigating)
- **Waypoint List:** Shows emoji + item name

### Heart Overflow Fix
Hearts now wrap to multiple rows:
```css
display: flex;
flex-wrap: wrap;        /* Allows wrapping */
max-height: 50px;       /* Prevents vertical overflow */
overflow: hidden;       /* Clips excess */
line-height: 1;         /* Tight spacing */
```

**Example with high HP:**
```
┌─────────────┐
│  [Avatar]   │
│   Dwarf     │
│ ❤️❤️❤️❤️❤️  │ ← Wraps to
│ ❤️❤️💜💜💜  │ ← multiple rows!
│  [════]     │
└─────────────┘
```

## Control States

### Modal System (ALL MODALS)
All modals now properly disable/enable controls:

**On Open:**
```javascript
this.voxelWorld.controlsEnabled = false;  // Disable WASD/mouse
this.voxelWorld.isPaused = true;          // Pause game logic
```

**On Close:**
```javascript
this.voxelWorld.controlsEnabled = true;   // Re-enable controls
this.voxelWorld.isPaused = false;         // Resume game
// Re-request pointer lock after 100ms delay
```

**Affected modals:**
- ✅ Companion Menu (PlayerCompanionUI)
- 🔄 Sargem Quest Editor (needs update)
- 🔄 RandyM Structure Designer (needs update)
- 🔄 Journal/Map (already implemented)
- 🔄 Workbench (already implemented)
- 🔄 Codex (already implemented)

## Files Modified

### `/src/CompanionHuntSystem.js`
- **`addDiscoveryMarker()`**: Creates waypoint in `explorerPins` instead of just map marker
- **`onItemCollected(x, y, z)`**: Takes coordinates instead of discoveryId, removes waypoint
- **`createMiniHuntIndicator()`**: DEPRECATED - Now uses PlayerCompanionUI
- **`hideMiniHuntIndicator()`**: DEPRECATED - Clears hunt status in PlayerCompanionUI
- **`updatePortraitTimer()`**: Updates new PlayerCompanionUI hunt status

### `/src/ui/PlayerCompanionUI.js`
- **`createPanel()`**: Added hunt status div to companion panel
- **`createPanel()` hearts**: Added `flex-wrap`, `max-height`, `overflow: hidden`
- **`updateHuntStatus(statusText)`**: NEW - Shows/hides hunt timer in companion panel
- **`openCompanionMenu()`**: Sets `controlsEnabled = false`
- **`closeCompanionMenu()`**: Sets `controlsEnabled = true`

### `/src/VoxelWorld.js`
- **`harvestWorldItem()`**: Passes coordinates to `companionHuntSystem.onItemCollected()` instead of discoveryId

## Biome-Based Loot Tables

| Biome     | Items Found                    |
|-----------|--------------------------------|
| Ocean     | 🐟 fish (high), 🥚 egg (low)   |
| Forest    | 🍯 honey, 🍎 apple             |
| Plains    | 🥚 egg (high), 🍎 apple (med)  |
| Mountains | 🥚 egg (very high)             |
| Desert    | 🥚 egg (low)                   |

## Hunt Duration

| Duration | Real Time | Game Time | Max Distance |
|----------|-----------|-----------|--------------|
| ½ Day    | 10 min    | 0.5 days  | ~60 chunks   |
| 1 Day    | 20 min    | 1 day     | ~120 chunks  |
| 2 Days   | 40 min    | 2 days    | ~240 chunks  |

**Movement Speed:** 2 chunks per in-game minute

## Future Enhancements

### Phase 3 (Advanced)
- [ ] Waypoint colors based on item rarity/type
  - Fish/Egg: Blue `#4444FF`
  - Honey: Yellow `#FFFF44`
  - Apple: Red `#FF4444`
- [ ] Waypoint "freshness" indicator (items despawn after X days)
- [ ] Multiple companions can hunt simultaneously
- [ ] Companion level affects discovery rate and item quantity
- [ ] Rare items require higher-level companions
- [ ] Discovery notifications show item quantity
- [ ] Companion can automatically bring back 1 item (others stay as waypoints)

## Testing Checklist

- [x] Companion finds item during hunt
- [x] Multiple billboards spawn at discovery location (1-4)
- [x] Billboards clustered around waypoint (2-4 block radius)
- [x] Waypoint appears in journal
- [x] Waypoint has purple color
- [x] Waypoint shows item count: "🐟 fish (×3)"
- [x] Can navigate to waypoint using compass
- [x] Can harvest billboard items one by one
- [x] Waypoint count decrements as items collected
- [x] Waypoint name updates: (×3) → (×2) → (×1) → no count
- [x] Waypoint auto-removes only when all items collected
- [x] Hunt status shows in companion panel
- [x] Hunt status updates in real-time
- [x] Hearts wrap to multiple rows
- [x] Controls disable when menu open
- [x] Controls re-enable when menu closes
- [x] Pin list updates correctly after each collection
- [x] Journal map re-renders after harvest

## Known Issues

- Sargem/RandyM modals still need `controlsEnabled` integration
- No waypoint expiration system yet

---

**Status:** ✅ **Phase 2 Complete** - Multiple billboard spawning with smart waypoint tracking  
**Next:** Phase 3 - Advanced features (rarity colors, expiration, multiple companions)
