# 🏔️ Mountain Dungeon System v2 - Separate Map Approach

**Date:** October 21, 2025  
**Status:** Design Phase  
**Approach:** Separate dungeon map instance (NOT modifying world generation)

---

## 🎯 Core Concept

**Instead of hollowing mountains in the main world:**
- Mountain gateway = portal to separate dungeon map
- Each dungeon is its own map instance
- Return portal at dungeon end brings player back
- Saves dungeon progress separately from main world

---

## ✅ Why This Works

### Advantages:
1. **No world generation changes needed** - mountains stay as-is
2. **Infinite complexity** - dungeon can be as large/detailed as needed
3. **Easy save/load** - dungeon state separate from main world
4. **Performance isolation** - dungeon doesn't affect overworld FPS
5. **Reuse existing systems** - BiomeWorldGen, StructureGenerator, scripts

### Solves Previous Issues:
- ❌ Mountains not tall enough → ✅ Doesn't matter, dungeon is separate
- ❌ Breaking world gen → ✅ World gen untouched
- ❌ Complex hollow detection → ✅ Not needed, bedrock is just boundaries
- ❌ Performance concerns → ✅ Isolated map instance

---

## 🏗️ System Architecture

### Map System
```javascript
// VoxelWorld needs to support multiple maps
class MapManager {
    constructor() {
        this.maps = {
            'overworld': {
                seed: 12345,
                playerData: {...},
                chunks: {...}
            },
            'dungeon_mountain_1': {
                seed: 67890,
                playerData: {...},
                chunks: {...},
                dungeonData: {...}
            }
        };
        this.currentMap = 'overworld';
    }
    
    switchMap(newMapName, spawnPoint) {
        // Save current map state
        this.saveMap(this.currentMap);
        
        // Load/generate new map
        this.currentMap = newMapName;
        this.loadMap(newMapName);
        
        // Teleport player
        this.teleportPlayer(spawnPoint);
    }
}
```

### Gateway Interaction
```javascript
// When player clicks mountain gateway
onMountainGatewayClick(gatewayPos) {
    // Show dialog
    this.questRunner.showChoice({
        text: "Enter the Mountain Dungeon?",
        character: this.companionId,
        choices: [
            {
                text: "Yes, let's explore!",
                action: () => {
                    // Save current position for return
                    const returnPoint = {...this.player.position};
                    localStorage.setItem('dungeon_return_point', JSON.stringify(returnPoint));
                    
                    // Switch to dungeon map
                    this.mapManager.switchMap('dungeon_mountain_1', {x: 0, y: 10, z: 0});
                    
                    this.updateStatus('🏔️ Entered the Mountain Dungeon!', 'discovery');
                }
            },
            {
                text: "Not yet...",
                action: () => {
                    this.updateStatus('Maybe another time...', 'info');
                }
            }
        ]
    });
}
```

---

## 🗺️ Dungeon Map Generation

### BiomeWorldGen Integration
```javascript
// In BiomeWorldGen.js - check map name
generateChunk(chunkX, chunkZ, worldSeed, addBlockFn, loadedChunks, chunkSize) {
    // Check if we're in a dungeon map
    const mapName = this.voxelWorld?.currentMapName || 'overworld';
    
    if (mapName.startsWith('dungeon_')) {
        return this.generateDungeonChunk(chunkX, chunkZ, worldSeed, addBlockFn);
    }
    
    // Normal overworld generation
    return this.generateOverworldChunk(chunkX, chunkZ, worldSeed, addBlockFn, loadedChunks, chunkSize);
}

generateDungeonChunk(chunkX, chunkZ, worldSeed, addBlockFn) {
    // Dungeon terrain:
    // - Mostly flat bedrock floor (y=0-2)
    // - Bedrock ceiling (y=30)
    // - Bedrock walls at world boundaries (±200 blocks?)
    // - Stone platforms at various heights
    // - Gaps/pits for vertical exploration
    
    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            const worldX = chunkX * 16 + x;
            const worldZ = chunkZ * 16 + z;
            
            // Check if we're at world boundary
            const maxDistance = 200; // Dungeon is 400x400 blocks
            if (Math.abs(worldX) > maxDistance || Math.abs(worldZ) > maxDistance) {
                // Bedrock wall
                for (let y = 0; y <= 30; y++) {
                    addBlockFn(worldX, y, worldZ, 'bedrock', false);
                }
            } else {
                // Floor
                addBlockFn(worldX, 0, worldZ, 'bedrock', false);
                addBlockFn(worldX, 1, worldZ, 'stone', false);
                
                // Ceiling
                addBlockFn(worldX, 30, worldZ, 'bedrock', false);
                
                // Varied floor height using Perlin noise
                const heightNoise = this.multiOctaveNoise(worldX, worldZ, this.noiseParams.continents, worldSeed);
                const floorHeight = Math.floor(2 + heightNoise * 3); // 2-5 blocks
                
                for (let y = 2; y <= floorHeight; y++) {
                    addBlockFn(worldX, y, worldZ, 'stone', false);
                }
            }
        }
    }
}
```

### Dungeon Structure Placement
```javascript
// Use StructureGenerator to place pre-made rooms
class DungeonRoomGenerator {
    constructor(structureGenerator) {
        this.structureGenerator = structureGenerator;
        this.placedRooms = [];
    }
    
    // Room templates (like ruins, but for dungeons)
    roomTemplates = {
        corridor: {
            width: 5,
            height: 4,
            depth: 10,
            blocks: [...] // Pre-defined block layout
        },
        chamber: {
            width: 10,
            height: 6,
            depth: 10,
            blocks: [...],
            loot: ['chest', 'torch']
        },
        vertical_shaft: {
            width: 5,
            height: 20,
            depth: 5,
            blocks: [...],
            ladders: true
        },
        boss_room: {
            width: 15,
            height: 8,
            depth: 15,
            blocks: [...],
            spawner: 'mega_ghost'
        }
    };
    
    generateDungeon(dungeonSeed) {
        // Start at entrance (0, 5, 0)
        const entrance = {x: 0, y: 5, z: 0};
        
        // Generate main path
        const mainPath = this.generateMainPath(entrance, dungeonSeed);
        
        // Place rooms along path
        for (let i = 0; i < mainPath.length; i++) {
            const node = mainPath[i];
            
            // Corridor room
            this.placeRoom('corridor', node);
            
            // 30% chance for side room
            if (Math.random() < 0.3 && i > 2) {
                const sidePos = this.findSideRoomPosition(node);
                if (this.canPlaceRoom(sidePos, 'chamber')) {
                    this.placeRoom('chamber', sidePos);
                }
            }
            
            // 20% chance for vertical shaft
            if (Math.random() < 0.2 && i > 5) {
                if (this.canPlaceRoom(node, 'vertical_shaft')) {
                    this.placeRoom('vertical_shaft', node);
                }
            }
        }
        
        // Boss room at end
        const endPos = mainPath[mainPath.length - 1];
        this.placeRoom('boss_room', endPos);
        
        // Exit portal in boss room
        this.placeExitPortal(endPos);
    }
    
    canPlaceRoom(pos, roomType) {
        const template = this.roomTemplates[roomType];
        
        // Check if room would overlap existing rooms
        for (let room of this.placedRooms) {
            if (this.roomsOverlap(pos, template, room)) {
                return false;
            }
        }
        
        // Check if room would hit bedrock walls
        if (this.hitsBedrockWall(pos, template)) {
            return false;
        }
        
        return true;
    }
    
    generateMainPath(start, seed) {
        // Perlin worm pathfinding
        const path = [start];
        let current = {...start};
        
        // Path goes roughly toward center, then curves
        for (let i = 0; i < 20; i++) {
            const noise = this.perlin(current.x * 0.1, current.z * 0.1, seed);
            
            // Random direction influenced by Perlin noise
            const angle = noise * Math.PI * 2;
            const distance = 15; // 15 blocks between nodes
            
            current = {
                x: current.x + Math.cos(angle) * distance,
                y: current.y,
                z: current.z + Math.sin(angle) * distance
            };
            
            // Occasionally go up/down
            if (Math.random() < 0.2) {
                current.y += Math.random() > 0.5 ? 5 : -5;
                current.y = Math.max(5, Math.min(25, current.y)); // Keep in bounds
            }
            
            path.push({...current});
        }
        
        return path;
    }
}
```

---

## 🚪 Exit Portal System

### Exit Gateway
```javascript
// Place exit portal in boss room
placeExitPortal(bossRoomPos) {
    const portalPos = {
        x: bossRoomPos.x,
        y: bossRoomPos.y + 1,
        z: bossRoomPos.z + 10
    };
    
    // Create portal blocks (iron bars? glowing stone?)
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = 0; dy <= 2; dy++) {
            this.voxelWorld.setBlock(
                portalPos.x + dx,
                portalPos.y + dy,
                portalPos.z,
                'portal_exit'
            );
        }
    }
    
    // Register click handler
    this.voxelWorld.registerPortal(portalPos, 'dungeon_exit');
}

// When player clicks exit portal
onExitPortalClick() {
    this.questRunner.showChoice({
        text: "Return to the surface?",
        character: this.companionId,
        choices: [
            {
                text: "Yes, I'm done here",
                action: () => {
                    // Load saved return point
                    const returnPoint = JSON.parse(
                        localStorage.getItem('dungeon_return_point')
                    );
                    
                    // Mark dungeon as completed
                    this.markDungeonComplete('dungeon_mountain_1');
                    
                    // Return to overworld
                    this.mapManager.switchMap('overworld', returnPoint);
                    
                    this.updateStatus('🏔️ Returned to the surface!', 'success');
                }
            },
            {
                text: "Not yet, I want to explore more",
                action: () => {
                    this.updateStatus('Keep exploring!', 'info');
                }
            }
        ]
    });
}
```

---

## 💾 Save/Load System

### Map State Storage
```javascript
class MapSaveSystem {
    saveDungeonState(dungeonName) {
        const state = {
            placedRooms: this.dungeonGenerator.placedRooms,
            modifiedBlocks: this.voxelWorld.getModifiedBlocks(),
            lootCollected: this.dungeonLootSystem.collected,
            enemiesDefeated: this.dungeonEnemySystem.defeated,
            completed: this.isDungeonComplete
        };
        
        localStorage.setItem(`dungeon_${dungeonName}`, JSON.stringify(state));
    }
    
    loadDungeonState(dungeonName) {
        const saved = localStorage.getItem(`dungeon_${dungeonName}`);
        if (!saved) return null;
        
        const state = JSON.parse(saved);
        
        // Restore dungeon state
        this.dungeonGenerator.placedRooms = state.placedRooms;
        this.voxelWorld.loadModifiedBlocks(state.modifiedBlocks);
        this.dungeonLootSystem.collected = state.lootCollected;
        this.dungeonEnemySystem.defeated = state.enemiesDefeated;
        this.isDungeonComplete = state.completed;
        
        return state;
    }
    
    resetDungeon(dungeonName) {
        // Clear saved state - dungeon will regenerate fresh
        localStorage.removeItem(`dungeon_${dungeonName}`);
    }
}
```

### Return Point Issue (SOLVED)
```javascript
// PROBLEM: First time loading overworld after dungeon completion
// SOLUTION: Always save overworld state before entering dungeon

switchToDungeon(dungeonName) {
    // 1. Force-save current overworld state
    this.saveMap('overworld');
    
    // 2. Save exact return position
    const returnPoint = {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
        mapName: 'overworld'
    };
    localStorage.setItem('dungeon_return_point', JSON.stringify(returnPoint));
    
    // 3. Switch to dungeon
    this.loadMap(dungeonName);
}

returnToOverworld() {
    // 1. Save dungeon state (if player wants to return)
    this.saveMap(this.currentMap);
    
    // 2. Load overworld (will restore from save)
    this.loadMap('overworld');
    
    // 3. Restore exact return position
    const returnPoint = JSON.parse(localStorage.getItem('dungeon_return_point'));
    this.player.position.set(returnPoint.x, returnPoint.y, returnPoint.z);
    
    // 4. Clear return point
    localStorage.removeItem('dungeon_return_point');
}
```

---

## 🎨 Dungeon Visuals

### Custom Block Textures
```javascript
// In BiomeWorldGen or texture loader
if (mapName.startsWith('dungeon_')) {
    // Use dungeon-specific textures
    blockTextures = {
        'stone': 'dungeon_stone.png',      // Darker, mossy stone
        'bedrock': 'dungeon_wall.png',     // Ominous black wall
        'torch': 'dungeon_torch.png',      // Blue flames
        'chest': 'dungeon_chest.png',      // Ancient chest
        'portal_exit': 'portal_glow.png'   // Glowing exit
    };
}
```

### Atmospheric Effects
```javascript
// Dungeon-specific lighting/fog
if (this.currentMapName.startsWith('dungeon_')) {
    // Darker ambient light
    this.scene.ambientLight.intensity = 0.2;
    
    // Thicker fog
    this.scene.fog.density = 0.01;
    this.scene.fog.color = new THREE.Color(0x1a1a2e); // Dark blue
    
    // Eerie sounds
    this.sfxSystem.playAmbient('dungeon_ambient', {loop: true, volume: 0.3});
}
```

---

## 🗺️ Multiple Dungeon Support

### Dungeon Registry
```javascript
// Each mountain gateway links to unique dungeon
const dungeonRegistry = {
    'mountain_1000_2000': {
        dungeonMap: 'dungeon_mountain_1',
        seed: 12345,
        difficulty: 1,
        completed: false
    },
    'mountain_5000_-3000': {
        dungeonMap: 'dungeon_mountain_2',
        seed: 67890,
        difficulty: 2,
        completed: false
    }
    // ... each mountain has its own dungeon instance
};

// When player finds mountain gateway
onMountainGatewayClick(gatewayPos) {
    const gatewayKey = `mountain_${gatewayPos.x}_${gatewayPos.z}`;
    const dungeonInfo = this.getDungeonInfo(gatewayKey);
    
    // Create dungeon if first time
    if (!dungeonInfo) {
        this.createNewDungeon(gatewayKey);
    }
    
    // Show entrance dialog
    this.showDungeonEntranceDialog(dungeonInfo);
}
```

---

## 📋 Implementation Checklist

### Phase 1: Map System
- [ ] Create MapManager class
- [ ] Modify VoxelWorld to support `currentMapName`
- [ ] Implement `switchMap()` function
- [ ] Test map switching (create test map)

### Phase 2: Dungeon Terrain
- [ ] Add dungeon check to BiomeWorldGen
- [ ] Generate flat bedrock floor/ceiling
- [ ] Add bedrock boundary walls
- [ ] Add varied terrain height (platforms, gaps)

### Phase 3: Room Generation
- [ ] Create DungeonRoomGenerator class
- [ ] Design room templates (corridor, chamber, shaft, boss)
- [ ] Implement Perlin worm pathfinding
- [ ] Implement room placement with collision detection
- [ ] Add vertical shaft support

### Phase 4: Gateway System
- [ ] Place gateway blocks at mountain bases
- [ ] Add gateway click handler
- [ ] Show entrance dialog with choice
- [ ] Implement teleport to dungeon

### Phase 5: Exit System
- [ ] Place exit portal in boss room
- [ ] Add exit portal click handler
- [ ] Save return point before entering
- [ ] Test return to overworld (position restoration)

### Phase 6: Save/Load
- [ ] Implement dungeon state saving
- [ ] Implement dungeon state loading
- [ ] Test dungeon persistence across sessions
- [ ] Test overworld state preservation

### Phase 7: Visuals & Polish
- [ ] Add dungeon block textures
- [ ] Add dungeon lighting/fog
- [ ] Add ambient sounds
- [ ] Add loot chests
- [ ] Add completion rewards

---

## 🐛 Known Challenges & Solutions

### Challenge 1: Return Position Lost
**Problem:** Player returns to wrong location after dungeon  
**Solution:** Force-save overworld state + save exact return coordinates before entering

### Challenge 2: Dungeon Performance
**Problem:** Large dungeons lag  
**Solution:** Use chunk system like overworld, lazy-load rooms

### Challenge 3: Room Overlap
**Problem:** Procedural rooms intersect  
**Solution:** Collision detection using placed room bounding boxes

### Challenge 4: Bedrock Detection
**Problem:** Need to know when room hits boundary  
**Solution:** Check for bedrock blocks during room placement

### Challenge 5: Multiple Dungeons
**Problem:** Managing many dungeon instances  
**Solution:** Dungeon registry with unique seeds per mountain

---

## 🎯 Success Criteria

✅ Player can enter mountain gateway  
✅ Loads into separate dungeon map  
✅ Dungeon has procedural layout  
✅ Exit portal returns to exact overworld position  
✅ Dungeon state persists across sessions  
✅ Multiple mountains = multiple unique dungeons  
✅ No world generation modification needed  

---

## 💡 Future Enhancements

- **Progressive difficulty:** Deeper rooms = stronger enemies
- **Themed dungeons:** Fire mountain, ice mountain, shadow mountain
- **Unique rewards:** Mountain-specific loot tables
- **Achievements:** "Clear 5 mountain dungeons"
- **Speedrun mode:** Timer for dungeon completion
- **Co-op support:** Multiple players in same dungeon (future)

---

**This approach solves ALL the previous issues! 🎉**

**No world generation changes = no breaking the codebase!**
