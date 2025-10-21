/**
 * DungeonGenerator.js
 * Procedurally generates dungeon layouts with rooms and corridors
 */

export class DungeonGenerator {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        
        // Room templates
        this.roomTypes = [
            'entrance',
            'chamber',
            'corridor',
            'monster_room',
            'treasure_room',
            'boss_room',
            'exit'
        ];
        
        // Block types for dungeons
        this.blocks = {
            floor: 1,    // Stone
            wall: 1,     // Stone
            ceiling: 1,  // Stone
            air: 0,      // Air
            torch: 2     // Placeholder for light source
        };
        
        console.log('🏗️ DungeonGenerator initialized');
    }
    
    /**
     * Generate a complete dungeon
     * @param {object} mapData - Map data from MapManager
     */
    generate(mapData) {
        console.log(`🏔️ Generating dungeon: ${mapData.id} (Tier ${mapData.tier})`);
        
        // Clear existing chunks
        this.voxelWorld.chunks.clear();
        
        // Determine dungeon size based on tier
        const roomCount = 5 + (mapData.tier * 3); // Tier 1: 8 rooms, Tier 5: 20 rooms
        
        // Generate layout
        const layout = this.generateLayout(roomCount, mapData.tier);
        
        // Build rooms
        layout.forEach((room) => {
            this.buildRoom(room, mapData);
        });
        
        // Spawn enemies
        this.spawnEnemies(layout, mapData);
        
        // Place entrance portal (to return to overworld)
        this.placeExitPortal(layout[0], mapData);
        
        mapData.rooms = layout;
        
        console.log(`✅ Dungeon generated: ${roomCount} rooms`);
    }
    
    /**
     * Generate dungeon layout (room positions and connections)
     */
    generateLayout(roomCount, tier) {
        const layout = [];
        const roomSize = 16; // Blocks per room
        const spacing = 4;   // Blocks between rooms
        
        // Start with entrance room at origin
        layout.push({
            id: 'entrance',
            type: 'entrance',
            position: { x: 0, y: 10, z: 0 },
            size: { w: roomSize, h: 8, d: roomSize },
            connections: []
        });
        
        // Generate additional rooms in a branching pattern
        let currentX = 0;
        let currentZ = 0;
        
        for (let i = 1; i < roomCount; i++) {
            // Random direction (north, south, east, west)
            const direction = Math.floor(Math.random() * 4);
            
            switch (direction) {
                case 0: currentZ += roomSize + spacing; break; // North
                case 1: currentZ -= roomSize + spacing; break; // South
                case 2: currentX += roomSize + spacing; break; // East
                case 3: currentX -= roomSize + spacing; break; // West
            }
            
            // Determine room type
            let roomType = 'chamber';
            if (i === roomCount - 1) {
                roomType = 'boss_room'; // Last room is boss
            } else if (Math.random() < 0.3) {
                roomType = 'monster_room';
            } else if (Math.random() < 0.1) {
                roomType = 'treasure_room';
            }
            
            layout.push({
                id: `room_${i}`,
                type: roomType,
                position: { x: currentX, y: 10, z: currentZ },
                size: { w: roomSize, h: 8, d: roomSize },
                connections: [layout[i - 1].id] // Connect to previous room
            });
            
            // Connect previous room to this one
            layout[i - 1].connections.push(`room_${i}`);
        }
        
        return layout;
    }
    
    /**
     * Build a single room
     */
    buildRoom(room, mapData) {
        const { x, y, z } = room.position;
        const { w, h, d } = room.size;
        
        // Build floor
        for (let bx = 0; bx < w; bx++) {
            for (let bz = 0; bz < d; bz++) {
                this.voxelWorld.setBlock(
                    x + bx, y - 1, z + bz,
                    this.blocks.floor
                );
            }
        }
        
        // Build walls
        for (let by = 0; by < h; by++) {
            for (let bx = 0; bx < w; bx++) {
                // North wall
                this.voxelWorld.setBlock(x + bx, y + by, z, this.blocks.wall);
                // South wall
                this.voxelWorld.setBlock(x + bx, y + by, z + d - 1, this.blocks.wall);
            }
            for (let bz = 0; bz < d; bz++) {
                // East wall
                this.voxelWorld.setBlock(x, y + by, z + bz, this.blocks.wall);
                // West wall
                this.voxelWorld.setBlock(x + w - 1, y + by, z + bz, this.blocks.wall);
            }
        }
        
        // Build ceiling
        for (let bx = 0; bx < w; bx++) {
            for (let bz = 0; bz < d; bz++) {
                this.voxelWorld.setBlock(
                    x + bx, y + h, z + bz,
                    this.blocks.ceiling
                );
            }
        }
        
        // Clear interior (air blocks)
        for (let by = 0; by < h; by++) {
            for (let bx = 1; bx < w - 1; bx++) {
                for (let bz = 1; bz < d - 1; bz++) {
                    this.voxelWorld.setBlock(
                        x + bx, y + by, z + bz,
                        this.blocks.air
                    );
                }
            }
        }
        
        // Add doorways to connected rooms
        this.createDoorways(room, mapData);
        
        // Add torches for lighting
        this.placeTorches(room);
        
        console.log(`🚪 Built room: ${room.id} (${room.type})`);
    }
    
    /**
     * Create doorways between connected rooms
     */
    createDoorways(room, mapData) {
        // TODO: Calculate doorway positions based on room connections
        // For now, create a simple doorway in the center of each wall
        
        const { x, y, z } = room.position;
        const { w, h, d } = room.size;
        
        const doorWidth = 3;
        const doorHeight = 4;
        
        // Center doorway on north wall
        const doorX = Math.floor(w / 2) - Math.floor(doorWidth / 2);
        
        for (let dy = 0; dy < doorHeight; dy++) {
            for (let dx = 0; dx < doorWidth; dx++) {
                this.voxelWorld.setBlock(
                    x + doorX + dx, y + dy, z,
                    this.blocks.air
                );
            }
        }
    }
    
    /**
     * Place torches for lighting
     */
    placeTorches(room) {
        const { x, y, z } = room.position;
        const { w, d } = room.size;
        
        // Place torches in corners
        const torchY = y + 2;
        
        this.voxelWorld.setBlock(x + 2, torchY, z + 2, this.blocks.torch);
        this.voxelWorld.setBlock(x + w - 3, torchY, z + 2, this.blocks.torch);
        this.voxelWorld.setBlock(x + 2, torchY, z + d - 3, this.blocks.torch);
        this.voxelWorld.setBlock(x + w - 3, torchY, z + d - 3, this.blocks.torch);
    }
    
    /**
     * Spawn enemies in rooms
     */
    spawnEnemies(layout, mapData) {
        if (!this.voxelWorld.roamingEnemySystem) {
            console.warn('⚠️ RoamingEnemySystem not found, skipping enemy spawning');
            return;
        }
        
        layout.forEach((room) => {
            if (room.type === 'monster_room' || room.type === 'chamber') {
                const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies
                
                for (let i = 0; i < enemyCount; i++) {
                    const enemyType = this.selectRandomEnemy(mapData.tier);
                    const spawnPos = {
                        x: room.position.x + Math.random() * (room.size.w - 4) + 2,
                        y: room.position.y + 1,
                        z: room.position.z + Math.random() * (room.size.d - 4) + 2
                    };
                    
                    this.voxelWorld.roamingEnemySystem.spawnEnemy(enemyType, spawnPos);
                }
            } else if (room.type === 'boss_room') {
                // Spawn boss
                const bossType = this.selectBoss(mapData.tier);
                const spawnPos = {
                    x: room.position.x + room.size.w / 2,
                    y: room.position.y + 1,
                    z: room.position.z + room.size.d / 2
                };
                
                this.voxelWorld.roamingEnemySystem.spawnEnemy(bossType, spawnPos);
            }
        });
    }
    
    /**
     * Select random enemy based on tier
     */
    selectRandomEnemy(tier) {
        const tierEnemies = {
            1: ['rat', 'goblin_grunt', 'troglodyte'],
            2: ['angry_ghost', 'vine_creeper', 'goblin_engineer', 'zombie_crawler', 'skeleton_archer'],
            3: ['goblin_shamanka', 'goblin_killdozer', 'skeleton_mage', 'wraith', 'zombie_brute'],
            4: ['goblin_war_chieftain', 'urban_predator', 'scolopendra_spawn', 'tunnel_rat'],
            5: ['mechanical_spider', 'iron_golem', 'alien_hunter', 'dire_wolf', 'hunting_construct']
        };
        
        const enemies = tierEnemies[tier] || tierEnemies[1];
        return enemies[Math.floor(Math.random() * enemies.length)];
    }
    
    /**
     * Select boss for tier
     */
    selectBoss(tier) {
        const bosses = {
            1: 'goblin_king_krogg',
            2: 'lich_lord_morteus',
            3: 'goblin_war_chieftain',
            4: 'iron_golem',
            5: 'hunting_construct'
        };
        
        return bosses[tier] || 'goblin_king_krogg';
    }
    
    /**
     * Place exit portal to return to overworld
     */
    placeExitPortal(entranceRoom, mapData) {
        const portalPos = {
            x: entranceRoom.position.x + entranceRoom.size.w / 2,
            y: entranceRoom.position.y + 1,
            z: entranceRoom.position.z + 2
        };
        
        // TODO: Create portal entity/marker
        // For now, just log position
        console.log(`🚪 Exit portal at: (${portalPos.x}, ${portalPos.y}, ${portalPos.z})`);
    }
}
