# Tutorial Ruin System - Implementation Guide

## 🏛️ Overview

The Tutorial Ruin is a starter dungeon located at **(0, 100)** - 100 blocks North of spawn. It serves as:
- **Puzzle tutorial** (Sokoban block-pushing mechanics)
- **Combat tutorial** (1-2 weak enemies)
- **Early game home base** (permanent structure, can place workbench/campfire inside)
- **Loot reward** (Iron, gold, weapon)

---

## 📐 Structure Layout

**7 Rooms + 6 Corridors:**

```
[Entrance Hall] (South entrance - open to world)
       ↓
  [Corridor]
       ↓
[First Corridor] (Decorative - cobwebs)
       ↓
  [Corridor]
       ↓
[Puzzle Room #1] (Easy: 1 block → 1 pedestal)
       ↓
  [Corridor]
       ↓
[Combat Room] (1-2 rats/goblins)
       ↓
  [Corridor]
       ↓
[Puzzle Room #2] (Medium: 3 blocks → 3 pedestals → unlocks door)
       ↓
  [Corridor]
       ↓
[Treasure Antechamber] (Friendly ghost NPC)
       ↓
  [Corridor]
       ↓
[Treasure Chamber] (Iron, gold, weapon)
```

---

## 🎨 Block Types Needed (Brad's Task)

### **New Block Types to Add:**

1. **ruin_stone_all** - Ruin wall texture (all sides)
2. **ruin_floor_all** - Ruin floor texture (all sides)
3. **ruin_ceiling_all** - Ruin ceiling texture (all sides)
4. **ruin_door** - Door block (can be locked/unlocked)
5. **pedestal** - Sokoban pressure plate (lights up when block on top)
6. **movable_block** - Sokoban pushable block (can't be harvested, only pushed)
7. **cobweb** - Atmospheric decoration (non-solid, transparent)
8. **torch** - Light source (optional, for wall decoration)

### **Where to Add:**

#### `VoxelWorld.js` - BlockTypes definition:
```javascript
this.BlockTypes = {
    // ... existing blocks ...

    // 🏛️ RUIN BLOCKS
    ruin_stone_all: { color: 0x696969, name: 'Ruin Stone' },
    ruin_floor_all: { color: 0x4A4A4A, name: 'Ruin Floor' },
    ruin_ceiling_all: { color: 0x5A5A5A, name: 'Ruin Ceiling' },
    ruin_door: { color: 0x8B4513, name: 'Ruin Door' },

    // 🧩 PUZZLE BLOCKS
    pedestal: { color: 0xD4AF37, name: 'Pedestal' },
    movable_block: { color: 0xA0522D, name: 'Movable Block' },

    // 🕸️ DECORATION
    cobweb: { color: 0xF5F5F5, name: 'Cobweb', transparent: true },
    torch: { color: 0xFFAA00, name: 'Torch', emissive: true }
};
```

#### `EnhancedGraphics.js` - Texture mappings:
```javascript
// 🏛️ RUIN TEXTURES
ruin_stone_all: {
    top: 'art/blocks/ruin_stone.png',
    bottom: 'art/blocks/ruin_stone.png',
    sides: 'art/blocks/ruin_stone.png'
},
ruin_floor_all: {
    top: 'art/blocks/ruin_floor.png',
    bottom: 'art/blocks/ruin_floor.png',
    sides: 'art/blocks/ruin_floor.png'
},
ruin_ceiling_all: {
    top: 'art/blocks/ruin_ceiling.png',
    bottom: 'art/blocks/ruin_ceiling.png',
    sides: 'art/blocks/ruin_ceiling.png'
},
ruin_door: {
    top: 'art/blocks/ruin_door_top.png',
    bottom: 'art/blocks/ruin_door_bottom.png',
    sides: 'art/blocks/ruin_door_side.png'
},
pedestal: {
    top: 'art/blocks/pedestal_top.png',
    bottom: 'art/blocks/pedestal_bottom.png',
    sides: 'art/blocks/pedestal_side.png'
},
movable_block: {
    top: 'art/blocks/movable_block.png',
    bottom: 'art/blocks/movable_block.png',
    sides: 'art/blocks/movable_block.png'
},
cobweb: {
    top: 'art/blocks/cobweb.png',
    bottom: 'art/blocks/cobweb.png',
    sides: 'art/blocks/cobweb.png'
},
torch: {
    top: 'art/blocks/torch_top.png',
    bottom: 'art/blocks/torch_bottom.png',
    sides: 'art/blocks/torch_side.png'
}
```

---

## 🔧 Files Created/Modified

### **Created:**
- ✅ `src/TutorialRuinGenerator.js` - Complete 7-room dungeon generator
- ✅ `docs/TUTORIAL_RUIN_IMPLEMENTATION.md` - This file

### **Modified:**
- ✅ `src/BiomeWorldGen.js` - Added TutorialRuinGenerator integration
- ✅ `src/VoxelWorld.js` - Removed "Press M to close" from map

### **To Do (Next Steps):**
- ⏳ Add block types to `VoxelWorld.js` BlockTypes definition
- ⏳ Add texture mappings to `EnhancedGraphics.js`
- ⏳ Create block textures in `assets/art/blocks/`
- ⏳ Add Sokoban puzzle mechanics (separate system)
- ⏳ Update `tutorialScripts.json` with ruin discovery dialogue
- ⏳ Add waypoint auto-creation from tutorial script

---

## 🎮 Player Experience Flow

1. Player spawns on stone platform at (0, 0)
2. Finds backpack 3-6 blocks away (existing tutorial)
3. **NEW:** Companion dialogue triggers: "I see a structure to the north!"
4. **NEW:** Waypoint auto-added to map: "Mysterious Ruin" at (0, 100)
5. **NEW:** Directional arrow appears on map (active waypoint)
6. Player walks north ~100 blocks (~12 chunks)
7. **NEW:** Discovers 7-room tutorial ruin
8. Completes easy puzzle (1 block → 1 pedestal)
9. Fights 1-2 weak enemies (rat/goblin)
10. Completes medium puzzle (3 blocks → 3 pedestals → unlock door)
11. Enters treasure chamber, collects iron + gold + weapon
12. **NEW:** Can use ruin as home base (place workbench/campfire inside)
13. Continues exploring world, eventually finds 4 mega ruins at ±300 blocks

---

## 🧩 Sokoban Puzzle Mechanics (Future Implementation)

### **How It Works:**

1. **Movable Block:**
   - Can be pushed (not harvested)
   - Player walks into block → block moves 1 space forward
   - Cannot be pulled (only pushed)
   - Cannot push through walls or other blocks

2. **Pedestal (Pressure Plate):**
   - Lights up when movable block placed on top
   - When ALL pedestals lit → locked door opens
   - Visual feedback: Pedestal glows gold when activated

3. **Puzzle Room Layout:**
   - **Easy:** 1 block, 1 pedestal (tutorial puzzle)
   - **Medium:** 3 blocks, 3 pedestals (unlocks treasure wing)

### **Files Needed:**
- `src/SokobanPuzzle.js` - Push mechanics, pedestal detection, door unlock logic
- Integration with VoxelWorld collision system

---

## 🗺️ tutorialScripts.json Integration (Future Implementation)

### **New Dialogue Entry:**

```json
{
  "id": "tutorial_ruin_discovery",
  "triggerCondition": "backpack_found",
  "companionId": "active_companion",
  "dialogue": [
    {
      "text": "Wait... I see something strange in the distance.",
      "emotion": "curious"
    },
    {
      "text": "It looks like an old structure. A ruin, perhaps?",
      "emotion": "intrigued"
    },
    {
      "text": "I've marked it on your map. Press M to open your Explorer's Journal.",
      "emotion": "helpful"
    },
    {
      "text": "The waypoint shows which direction to go. We should investigate while it's still day!",
      "emotion": "encouraging"
    }
  ],
  "actions": [
    {
      "type": "createWaypoint",
      "name": "Mysterious Ruin",
      "x": 0,
      "z": 100,
      "color": "red",
      "setActive": true
    },
    {
      "type": "showNotification",
      "text": "📍 Waypoint added: Mysterious Ruin (North)"
    }
  ]
}
```

### **MapManager.js Update Needed:**

Add method to create waypoints from scripts:

```javascript
createWaypointFromScript(name, x, z, color, setActive = false) {
    const waypoint = {
        name: name,
        x: x,
        z: z,
        color: color,
        timestamp: Date.now()
    };

    this.waypoints.push(waypoint);

    if (setActive) {
        this.activeWaypoint = waypoint;
    }

    this.saveWaypoints();
    console.log(`📍 Waypoint created: ${name} at (${x}, ${z})`);
}
```

---

## 📊 Coordinates Reference

| Location | World Coords | Chunk Coords | Distance from Spawn |
|----------|-------------|--------------|---------------------|
| **Spawn** | (0, 0) | (0, 0) | 0 blocks |
| **Tutorial Ruin** | (0, 100) | (0, 12-13) | 100 blocks North |
| **North Mega Ruin** | (0, 300) | (0, 37-38) | 300 blocks North |
| **South Mega Ruin** | (0, -300) | (0, -38) | 300 blocks South |
| **East Mega Ruin** | (300, 0) | (37, 0) | 300 blocks East |
| **West Mega Ruin** | (-300, 0) | (-38, 0) | 300 blocks West |

---

## 🐛 Debug Commands

```javascript
// Clear tutorial ruin generation flag (force regenerate)
localStorage.removeItem('tutorialRuinGenerated');

// Mark tutorial as completed (skip generation)
localStorage.setItem('tutorialRuinCompleted', 'true');

// Check if tutorial ruin should generate in current chunk
const chunkX = Math.floor(player.position.x / 8);
const chunkZ = Math.floor(player.position.z / 8);
window.voxelApp.worldGen.tutorialRuinGenerator.shouldGenerateTutorialRuin(chunkX, chunkZ);
```

---

## 🎯 Implementation Status

### **Phase 1: Core Structure** ✅ COMPLETE
- [x] TutorialRuinGenerator.js created
- [x] 7-room layout designed
- [x] Integrated into BiomeWorldGen
- [x] Coordinates calculated (0, 100)
- [x] Room generation logic implemented
- [x] Corridor connections implemented

### **Phase 2: Block Types & Graphics** 🔄 IN PROGRESS (Brad)
- [ ] Add block types to VoxelWorld.js
- [ ] Add texture mappings to EnhancedGraphics.js
- [ ] Create block textures (8 new textures)
- [ ] Test block rendering in-game

### **Phase 3: Puzzle Mechanics** ⏳ PENDING
- [ ] Create SokobanPuzzle.js
- [ ] Implement push mechanics
- [ ] Implement pedestal detection
- [ ] Implement door unlock logic
- [ ] Test puzzle solutions

### **Phase 4: Tutorial Integration** ⏳ PENDING
- [ ] Update tutorialScripts.json
- [ ] Add ruin discovery dialogue
- [ ] Implement waypoint auto-creation
- [ ] Add directional arrow to map
- [ ] Test full tutorial flow

### **Phase 5: Mega Ruins (Future)** 📋 PLANNED
- [ ] Create MegaRuinGenerator.js
- [ ] Design room templates
- [ ] Implement at 4 cardinal points (±300 blocks)
- [ ] Add harder puzzles + more enemies
- [ ] Add spectral essence loot

---

## 💡 Design Notes

### **Why This Approach Works:**

1. **Natural Discovery** - Player finds ruin organically via companion guidance
2. **No Forced Tutorial** - Optional content, player can skip if experienced
3. **Permanent Structure** - Serves as home base, not temporary
4. **Clear Progression** - Tutorial ruin → Mega ruins (harder content)
5. **Existing Systems** - Uses waypoints, companion dialogue, billboard items
6. **Performance Safe** - Single structure, no chunk generation overhead

### **Future Expansion Ideas:**

1. **Multiple Tutorial Ruins** - Different layouts at different world seeds
2. **Procedural Room Order** - Randomize room connections
3. **Biome-Specific Ruins** - Different block palettes per biome
4. **Hidden Rooms** - Secret chambers with rare loot
5. **Multi-Level Dungeons** - Stairs leading to basement levels
6. **Boss Chambers** - Final room with mini-boss fight

---

## 📝 Notes for Brad

**Block Graphics Priority:**
1. **ruin_stone_all** (walls) - Most visible, needs good texture
2. **ruin_floor_all** (floor) - Second most visible
3. **pedestal** (puzzle mechanic) - Needs clear visual (pressure plate style)
4. **movable_block** (puzzle mechanic) - Needs to look "pushable" (crate/box style)
5. **ruin_door** (door) - Can reuse existing door texture if needed
6. **cobweb** (decoration) - Low priority, optional atmosphere
7. **ruin_ceiling_all** (ceiling) - Low priority, often not visible
8. **torch** (lighting) - Low priority, decorative only

**Texture Style Suggestions:**
- **Ruin stone:** Weathered gray stone with cracks, moss, age marks
- **Ruin floor:** Cracked tiles, ancient flagstones
- **Pedestal:** Gold/brass pressure plate, glowing when activated
- **Movable block:** Wooden crate or stone cube with rope/handles
- **Cobweb:** Semi-transparent white/gray web texture

Let me know when textures are ready and I'll test the full system! 🎨
