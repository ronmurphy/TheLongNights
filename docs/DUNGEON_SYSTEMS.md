# Dungeon Systems - Design Document

## 🏛️ Overview

The Long Nights features a two-tier dungeon system:

1. **Tutorial Ruin** (Beginner) - Single dungeon at (0, 100), teaches puzzle mechanics
2. **Cardinal Mega Ruins** (Advanced) - Four dungeons at ±300 blocks, endgame content

Both systems use **Sokoban-style block-pushing puzzles** and **combat encounters**, but with escalating difficulty and rewards.

---

## 🎓 Tutorial Ruin (Starter Dungeon)

### **Location**
- **World Coordinates:** (0, 100) - Due North of spawn
- **Distance from Spawn:** 100 blocks (~12 chunks)
- **Chunk Coverage:** 2x2 chunks (approximately 16x16 blocks)

### **Discovery Method**
1. Player spawns at (0, 0) on stone platform
2. Finds backpack (existing tutorial)
3. **Companion dialogue triggers:** "I see a structure to the north!"
4. **Waypoint auto-added:** Red marker at (0, 100)
5. **Map shows directional arrow** pointing to ruin
6. Player follows arrow north

### **Purpose**
- Teach Sokoban puzzle mechanics (push blocks onto pedestals)
- Teach basic combat in controlled environment
- Introduce dungeon exploration
- **Serve as early-game home base** (permanent structure)

### **Structure Layout**

```
       [Entrance Hall]
              ↓
         [Corridor]
              ↓
      [First Corridor]
              ↓
         [Corridor]
              ↓
    [Puzzle Room #1 - Easy]
              ↓
         [Corridor]
              ↓
       [Combat Room]
              ↓
         [Corridor]
              ↓
   [Puzzle Room #2 - Medium]
              ↓
         [Corridor]
              ↓
   [Treasure Antechamber]
              ↓
         [Corridor]
              ↓
     [Treasure Chamber]
```

**Total:** 7 rooms + 6 connecting corridors

### **Room Details**

| Room | Size | Purpose | Contents |
|------|------|---------|----------|
| **Entrance Hall** | 7x7x5 | Entry point | Open south entrance, empty safe space |
| **First Corridor** | 3x5x5 | Transition | Cobwebs for atmosphere |
| **Puzzle Room #1** | 7x7x5 | Easy puzzle | 1 movable block, 1 pedestal |
| **Combat Room** | 7x7x5 | Combat tutorial | 1-2 rats or goblins |
| **Puzzle Room #2** | 7x7x5 | Medium puzzle | 3 movable blocks, 3 pedestals, locked door |
| **Treasure Antechamber** | 7x7x5 | Lore/atmosphere | Friendly ghost NPC (optional) |
| **Treasure Chamber** | 7x7x5 | Reward | 8 iron, 5 gold, 1 weapon |

### **Difficulty**
- **Enemies:** 1-2 weak enemies (rats, goblin_grunt)
- **Puzzles:** Easy (1 block) → Medium (3 blocks)
- **Estimated Time:** 5-10 minutes

### **Loot**
- **Iron Blocks:** 8
- **Gold Blocks:** 5
- **Weapon:** 1 combat_sword (pre-crafted)
- **Total Value:** Early-game starter pack

### **Companion Dialogue**

**Backpack Tutorial (Triggers Discovery):**
```
"Wait... I see something strange in the distance. To the north."
"It looks like... an old structure? Some kind of ruin, maybe?"
"I've marked it on your map! Press M to open your Explorer's Journal
 and you'll see a red waypoint pointing the way."
"We should investigate while it's still daylight. Ruins can be
 dangerous at night, but there might be treasure inside!"
```

**Ruin Entrance (Teaches Sokoban):**
```
"This place is ancient... I wonder who built it?"
"Stay alert. There might be enemies inside, and I see some kind
 of puzzle mechanisms."
"Those glowing pedestals... try walking INTO the stone blocks to
 push them onto the pedestals. That might unlock doors!"
```

### **Home Base Potential**
- Players can place workbench inside
- Players can place campfire for respawn point
- Stone walls provide pre-built shelter
- Close to spawn (easy to return)
- Protected from weather/night enemies

---

## ⚔️ Cardinal Mega Ruins (Endgame Dungeons)

### **Locations**

| Direction | World Coordinates | Distance from Spawn | Chunk Coords |
|-----------|------------------|---------------------|--------------|
| **North** | (0, 300) | 300 blocks North | (0, 37-38) |
| **South** | (0, -300) | 300 blocks South | (0, -38) |
| **East** | (300, 0) | 300 blocks East | (37-38, 0) |
| **West** | (-300, 0) | 300 blocks West | (-38, 0) |

### **Discovery Method**
- **No guided tutorial** - Players must explore to find them
- **Compass pointing system** (optional future feature)
- **Rumors from friendly ghosts** (optional lore integration)
- **Random discovery** through exploration

### **Purpose**
- **Alternative to Bloodmoon progression** (spectral essence farming)
- **Challenge content** for experienced players
- **Endgame loot** (rare equipment, crafted tools)
- **Spectral Essence source** (Ghost Rod crafting material)

### **Structure Size**
- **Chunk Coverage:** 4x4 chunks (32x32 blocks)
- **Room Count:** 12-20 rooms per dungeon
- **Height:** Multi-level (2-3 floors with stairs)

### **Room Types (Modular System)**

#### **1. Combat Rooms (40% of rooms)**
- **Easy Combat:** 2-3 bloodmoon enemies (zombies, troglodytes)
- **Medium Combat:** 4-6 mixed enemies + environmental hazards
- **Hard Combat:** 8+ enemies + boss-tier enemy
- **Arena Combat:** Wave-based enemy spawns (2-3 waves)

#### **2. Puzzle Rooms (30% of rooms)**
- **Easy Sokoban:** 2-3 blocks → 2-3 pedestals
- **Medium Sokoban:** 4-6 blocks, tight corridors, strategic planning required
- **Hard Sokoban:** 8+ blocks, multiple rooms, sequence puzzles
- **Combination Puzzles:** Sokoban + switches + timed doors

#### **3. Trap Rooms (15% of rooms)**
- **Spike Pits:** Step on wrong floor tile → spikes shoot up
- **Falling Blocks:** Ceiling collapses, must dodge
- **Poison Gas:** Enclosed room with damaging gas (health drain)
- **Arrow Traps:** Triggered by pressure plates

#### **4. Tower Rooms (10% of rooms)**
- **Vertical Climbing:** Grappling hook required (10-15 blocks tall)
- **Platforming:** Jump across gaps to reach upper levels
- **Spiral Staircase:** Winding path to treasure chamber
- **Observation Deck:** High vantage point to see dungeon layout

#### **5. Special Rooms (5% of rooms)**
- **Boss Chamber:** Single powerful enemy (Ruin Guardian)
- **Treasure Vault:** Multiple chests, high-value loot
- **Library:** Friendly ghost NPCs, lore books
- **Altar Room:** Spectral Essence pedestals (guaranteed 2-3 essence)

### **Difficulty Progression**

| Mega Ruin | Difficulty | Enemy Count | Puzzle Complexity | Loot Quality |
|-----------|-----------|-------------|-------------------|--------------|
| **North** | Medium | 15-20 enemies | Medium Sokoban | Good |
| **South** | Medium | 15-20 enemies | Medium Sokoban | Good |
| **East** | Hard | 20-30 enemies | Hard Sokoban | Excellent |
| **West** | Hard | 20-30 enemies | Hard Sokoban | Excellent |

*(Alternatively, all four can have identical difficulty - TBD)*

### **Loot Distribution**

**Per Mega Ruin:**
- **Spectral Essence:** 2-3 guaranteed (Altar Room)
- **Iron Blocks:** 20-30
- **Gold Blocks:** 15-20
- **Rare Equipment:** 3-5 items (skull, crystal, ancient amulet, etc.)
- **Pre-Crafted Tools:** 1-2 items (grappling hook, compass, magic amulet)
- **Consumables:** 5-10 potions/food items

**Total Across All Four Ruins:**
- **Spectral Essence:** 8-12 total (enough for 1-2 Ghost Rods)
- **Alternative to Bloodmoons:** No need to fight 20+ bloodmoons for essence

### **Enemy Types**

**Common (70%):**
- Zombies (zombie_crawler)
- Troglodytes
- Goblin Grunts
- Rats (swarm encounters)

**Uncommon (20%):**
- Angry Ghosts
- Colored Ghosts (red, blue, green)
- Goblin Warriors

**Rare (10%):**
- **Ruin Guardian** (mini-boss) - Custom enemy type
  - Higher HP than normal enemies
  - Special attack patterns
  - Guards treasure vaults or altar rooms
  - Drops rare loot on defeat

### **Puzzle Examples**

#### **Easy Sokoban (Tutorial Ruin):**
```
[W] [W] [W] [W] [W]
[W] [P] [ ] [B] [W]
[W] [ ] [X] [ ] [W]
[W] [W] [W] [W] [W]

W = Wall, P = Player, B = Block, X = Pedestal
Solution: Push block East → South → West onto pedestal
```

#### **Medium Sokoban (Mega Ruins):**
```
[W] [W] [W] [W] [W] [W] [W]
[W] [P] [ ] [B] [ ] [B] [W]
[W] [ ] [X] [ ] [X] [ ] [W]
[W] [ ] [ ] [B] [ ] [ ] [W]
[W] [ ] [X] [ ] [ ] [ ] [W]
[W] [W] [W] [W] [W] [W] [W]

Solution: Multi-step, strategic block placement
```

#### **Hard Sokoban (Mega Ruins):**
```
[W] [W] [W] [W] [W] [W] [W] [W] [W]
[W] [ ] [B] [ ] [ ] [B] [ ] [ ] [W]
[W] [ ] [W] [W] [W] [W] [W] [ ] [W]
[W] [P] [ ] [ ] [D] [ ] [ ] [B] [W]
[W] [ ] [W] [W] [W] [W] [W] [ ] [W]
[W] [X] [ ] [ ] [X] [ ] [ ] [X] [W]
[W] [W] [W] [W] [W] [W] [W] [W] [W]

D = Locked Door, requires solving to unlock
```

### **Procedural Generation (Future)**

**Option 1: Fixed Layouts**
- Four hand-designed mega ruins (one per cardinal direction)
- Each ruin has unique layout
- Consistent experience across playthroughs

**Option 2: Room-Based Procedural**
- Pool of 30-40 pre-designed rooms
- Randomly connect rooms per playthrough
- Ensures 1 entrance, 1 treasure vault, 1 altar room
- Different experience each playthrough

**Recommended:** Start with **fixed layouts**, transition to **procedural later** if needed.

---

## 🧩 Sokoban Puzzle System

### **Core Mechanics**

**Movable Blocks:**
- Cannot be harvested or destroyed
- Can only be pushed (not pulled)
- Push by walking into them (collision-based)
- Move 1 space in direction player is moving
- Cannot push through walls or other blocks
- Cannot push multiple blocks at once

**Pedestals (Pressure Plates):**
- Light up when movable block placed on top
- Visual feedback: Gold glow effect
- When ALL pedestals lit → locked door opens
- Pedestals do not activate from player standing on them (blocks only)

**Locked Doors:**
- Block passage until puzzle solved
- Open automatically when all pedestals activated
- Slide open or disappear (remove block)
- Cannot be harvested while locked

### **Puzzle Difficulty Tiers**

| Tier | Blocks | Pedestals | Corridors | Estimated Time |
|------|--------|-----------|-----------|----------------|
| **Easy** | 1 | 1 | Open room | 10-30 seconds |
| **Medium** | 2-3 | 2-3 | Some walls | 1-3 minutes |
| **Hard** | 4-8 | 4-8 | Tight maze | 5-10 minutes |

### **Puzzle Design Principles**

1. **No Unsolvable States** - Must be possible to reset or backtrack
2. **Visual Clarity** - Pedestals clearly visible, blocks distinct from walls
3. **Incremental Learning** - Easy puzzle teaches basics, hard puzzles build on knowledge
4. **Fair Challenge** - Solution requires logic, not trial-and-error
5. **Companion Hints** - Friendly ghost NPCs can provide optional hints

---

## 🎨 Block Types & Graphics

### **Required Block Types**

| Block Type | Description | Texture Style | Priority |
|-----------|-------------|---------------|----------|
| `ruin_stone_all` | Dungeon walls | Weathered gray stone, cracks, moss | HIGH |
| `ruin_floor_all` | Dungeon floor | Cracked tiles, flagstones | HIGH |
| `ruin_ceiling_all` | Dungeon ceiling | Stone ceiling, darker than walls | MEDIUM |
| `pedestal` | Puzzle pressure plate | Gold/brass plate, glows when active | HIGH |
| `movable_block` | Pushable block | Wooden crate or stone cube | HIGH |
| `ruin_door` | Locked door | Ornate door, rusted metal | MEDIUM |
| `cobweb` | Decoration | Semi-transparent white web | LOW |
| `torch` | Light source | Glowing torch, warm light | LOW |

**Textures Location:** `/assets/art/blocks/`

**Naming Convention:** `[blockname]-all.png` (all six faces use same texture)

---

## 🗺️ Waypoint System Integration

### **Auto-Waypoint Creation**

When backpack tutorial completes:
1. Companion dialogue mentions ruin
2. **Waypoint auto-created:**
   - Name: "Mysterious Ruin"
   - Coords: (0, 100)
   - Color: Red
   - Set as **active waypoint**
3. **Map shows directional arrow** pointing toward waypoint
4. Player opens map (M key) to see marker

### **MapManager.js Update Needed**

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

**Call from Tutorial System:**
```javascript
// After backpack_opened dialogue
this.mapManager.createWaypointFromScript(
    'Mysterious Ruin',
    0,
    100,
    'red',
    true // Set as active
);
```

---

## 🔧 Implementation Roadmap

### **Phase 1: Tutorial Ruin Foundation** ✅ COMPLETE
- [x] TutorialRuinGenerator.js created
- [x] 7-room layout designed
- [x] Integrated into BiomeWorldGen
- [x] Tutorial dialogue added
- [x] Documentation created

### **Phase 2: Block Types & Graphics** 🔄 IN PROGRESS
- [ ] Create block textures (8 textures)
- [ ] Add block types to VoxelWorld.js
- [ ] Add texture mappings to EnhancedGraphics.js
- [ ] Test block rendering

### **Phase 3: Sokoban Puzzle Mechanics** ⏳ PENDING
- [ ] Create SokobanPuzzle.js
- [ ] Implement collision-based pushing
- [ ] Implement pedestal detection
- [ ] Implement door unlock logic
- [ ] Add visual feedback (pedestal glow)
- [ ] Test puzzle solutions

### **Phase 4: Waypoint Integration** ⏳ PENDING
- [ ] Add createWaypointFromScript() to MapManager
- [ ] Trigger waypoint creation in backpack tutorial
- [ ] Test directional arrow on map
- [ ] Verify waypoint persistence

### **Phase 5: Enemy Spawning** ⏳ PENDING
- [ ] Verify enemy spawn system compatibility
- [ ] Test 1-2 enemy spawns in combat room
- [ ] Balance enemy difficulty
- [ ] Add combat tutorial dialogue

### **Phase 6: Loot System** ⏳ PENDING
- [ ] Place iron/gold blocks in treasure chamber
- [ ] Place weapon billboard item
- [ ] Test loot collection
- [ ] Verify inventory integration

### **Phase 7: Tutorial Ruin Testing** ⏳ PENDING
- [ ] Full playthrough test (spawn → ruin → completion)
- [ ] Verify all dialogue triggers
- [ ] Test puzzle solutions
- [ ] Test enemy combat
- [ ] Polish and bug fixes

### **Phase 8: Mega Ruins Design** 📋 PLANNED
- [ ] Create MegaRuinGenerator.js
- [ ] Design room templates (30-40 rooms)
- [ ] Design room connection logic
- [ ] Implement at 4 cardinal points
- [ ] Add harder puzzles (4-8 blocks)
- [ ] Add more enemies (15-30 per ruin)
- [ ] Add spectral essence loot
- [ ] Add boss chambers
- [ ] Add tower/climbing rooms

### **Phase 9: Mega Ruins Testing** 📋 PLANNED
- [ ] Test all 4 cardinal ruins
- [ ] Balance difficulty progression
- [ ] Test spectral essence drop rates
- [ ] Test boss encounters
- [ ] Polish and bug fixes

---

## 🎯 Design Goals

### **Tutorial Ruin Goals:**
1. ✅ Teach puzzle mechanics clearly
2. ✅ Introduce combat in safe environment
3. ✅ Provide early-game loot boost
4. ✅ Serve as permanent home base
5. ✅ Feel like discovery, not forced tutorial
6. ⏳ Quick completion time (5-10 minutes)

### **Mega Ruins Goals:**
1. 📋 Provide endgame challenge content
2. 📋 Alternative to Bloodmoon grinding
3. 📋 Reward exploration (far from spawn)
4. 📋 Test player skill (puzzles + combat)
5. 📋 Spectral essence farming
6. 📋 Replayable content (if procedural)

---

## 🐛 Debug Commands

### **Tutorial Ruin:**
```javascript
// Force regenerate tutorial ruin
localStorage.removeItem('tutorialRuinGenerated');

// Mark tutorial as completed (skip generation)
localStorage.setItem('tutorialRuinCompleted', 'true');

// Check if current chunk should have tutorial ruin
const chunkX = Math.floor(player.position.x / 8);
const chunkZ = Math.floor(player.position.z / 8);
voxelApp.worldGen.tutorialRuinGenerator.shouldGenerateTutorialRuin(chunkX, chunkZ);

// Teleport to tutorial ruin
player.position.set(0, 12, 100);
```

### **Mega Ruins:**
```javascript
// Teleport to North Mega Ruin
player.position.set(0, 12, 300);

// Teleport to South Mega Ruin
player.position.set(0, 12, -300);

// Teleport to East Mega Ruin
player.position.set(300, 12, 0);

// Teleport to West Mega Ruin
player.position.set(-300, 12, 0);
```

---

## 💡 Future Expansion Ideas

### **Tutorial Ruin Enhancements:**
- Add friendly ghost NPC with lore dialogue
- Add secret room behind hidden wall
- Add multiple difficulty modes (easy/hard)
- Add completion rewards (achievement system)

### **Mega Ruins Enhancements:**
- **Procedural generation** (random room order)
- **Biome-specific themes** (desert pyramid, ice temple, forest shrine, mountain fortress)
- **Multi-level dungeons** (basement levels, underground rivers)
- **Boss variety** (unique boss per ruin)
- **Puzzle variety** (lever puzzles, timed puzzles, light puzzles)
- **Environmental hazards** (lava, water flooding, collapsing floors)
- **Hidden treasures** (secret rooms, bonus chests)
- **Dungeon events** (enemy waves, ghost patrols)

### **Meta Progression:**
- Track ruins completed (achievement system)
- Unlock harder ruins after completing easier ones
- Rewards scale with ruins completed
- Leaderboard for speedruns

---

## 📝 Notes

**Performance Considerations:**
- Tutorial ruin = ~1500 blocks total (manageable)
- Mega ruins = ~8000 blocks each (test performance)
- Use chunk flagging to prevent tree spawning in ruins
- Cache generated ruins to avoid regeneration

**Balance Considerations:**
- Tutorial ruin should feel rewarding but not game-breaking
- Mega ruins should feel challenging but fair
- Spectral essence drop rate: 2-3 per mega ruin = 8-12 total (2-3 Ghost Rods)
- Bloodmoon alternative: 1 mega ruin ≈ 5 bloodmoons in difficulty

**Lore Integration:**
- Who built these ruins?
- What happened to the builders?
- Why are spectral essences found here?
- Connection to Ghost Rod / Mega World Boss?

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Status:** Tutorial Ruin in Phase 2, Mega Ruins in Planning
