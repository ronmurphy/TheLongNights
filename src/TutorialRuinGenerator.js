/**
 * TutorialRuinGenerator.js
 *
 * Generates the starter tutorial ruin at (0, 100) - North of spawn
 * 7-room dungeon teaching puzzle mechanics and basic combat
 * Designed as early-game home base (permanent structure)
 *
 * Layout:
 * Room 1: Entrance Hall
 * Room 2: First Corridor
 * Room 3: Puzzle Room #1 (Easy Sokoban - 1 block)
 * Room 4: Combat Room (1-2 rats/goblins)
 * Room 5: Puzzle Room #2 (Medium Sokoban - 2-3 blocks)
 * Room 6: Treasure Antechamber (Friendly ghost NPC)
 * Room 7: Treasure Chamber (Iron, gold, weapon)
 */

export class TutorialRuinGenerator {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;

        // Tutorial ruin coordinates (North of spawn)
        this.TUTORIAL_RUIN_X = 0;
        this.TUTORIAL_RUIN_Z = 100;

        // Room dimensions (blocks)
        this.ROOM_WIDTH = 7;
        this.ROOM_DEPTH = 7;
        this.ROOM_HEIGHT = 5;
        this.CORRIDOR_WIDTH = 3;
        this.CORRIDOR_LENGTH = 5;

        // Block types (will be enhanced with graphics by Brad)
        this.BLOCKS = {
            wall: 'ruin_stone_all',        // Special ruin wall texture
            floor: 'ruin_floor_all',       // Special ruin floor texture
            ceiling: 'ruin_ceiling_all',   // Special ruin ceiling texture
            door: 'ruin_door',             // Door block (can be locked)
            pedestal: 'pedestal',          // Sokoban pedestal (pressure plate)
            movableBlock: 'movable_block', // Sokoban pushable block
            cobweb: 'cobweb',              // Atmospheric decoration
            torch: 'torch'                 // Lighting
        };

        // Loot contents
        this.TREASURE_LOOT = {
            iron: 8,    // 8 iron blocks
            gold: 5,    // 5 gold blocks
            weapon: 'combat_sword' // Pre-crafted weapon
        };

        // Enemy spawn data
        this.ENEMY_SPAWNS = [
            { type: 'rat', x: 0, z: 0 },          // Combat room center
            { type: 'goblin_grunt', x: 2, z: 2 }  // Combat room corner
        ];
    }

    /**
     * Check if current chunk should contain tutorial ruin
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @returns {boolean} True if this chunk contains tutorial ruin
     */
    shouldGenerateTutorialRuin(chunkX, chunkZ) {
        // Tutorial ruin at world coords (0, 100)
        // Chunk size is 8x8 blocks, so:
        // chunkX = 0 / 8 = 0
        // chunkZ = 100 / 8 = 12.5 → chunk 12 or 13

        // Ruin spans 2x2 chunks approximately (14 blocks wide)
        const ruinChunkX = Math.floor(this.TUTORIAL_RUIN_X / 8);
        const ruinChunkZ = Math.floor(this.TUTORIAL_RUIN_Z / 8);

        // Check if current chunk is within ruin area
        return (chunkX >= ruinChunkX - 1 && chunkX <= ruinChunkX + 1) &&
               (chunkZ >= ruinChunkZ - 1 && chunkZ <= ruinChunkZ + 1);
    }

    /**
     * Generate the complete tutorial ruin structure
     * @param {Function} addBlockFn - Function to add blocks: (x, y, z, type, solid, color)
     * @param {Function} getHeightFn - Function to get terrain height
     */
    generateTutorialRuin(addBlockFn, getHeightFn) {
        // Check if tutorial already completed (localStorage flag)
        const tutorialCompleted = localStorage.getItem('tutorialRuinCompleted') === 'true';
        if (tutorialCompleted) {
            console.log('🏛️ Tutorial ruin already completed, skipping generation');
            return;
        }

        const centerX = this.TUTORIAL_RUIN_X;
        const centerZ = this.TUTORIAL_RUIN_Z;

        // Get ground height
        let groundY = getHeightFn(centerX, centerZ);
        if (groundY === null || groundY < 0) {
            groundY = 8;
        }

        console.log(`🏛️ Generating Tutorial Ruin at (${centerX}, ${groundY}, ${centerZ})`);

        // Generate all 7 rooms in sequence
        let currentX = centerX;
        let currentZ = centerZ;

        // Room 1: Entrance Hall (South entrance)
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'entrance',
            hasDoor: false, // Open entrance
            hasEntrance: 'south'
        });

        // Corridor connecting to Room 2
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 2: First Corridor (transitional)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'corridor',
            hasDecoration: true
        });

        // Corridor connecting to Room 3
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 3: Puzzle Room #1 (Easy Sokoban)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'puzzle_easy',
            puzzleBlocks: 1,
            pedestals: 1
        });

        // Corridor connecting to Room 4
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 4: Combat Room (1-2 enemies)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        const combatRoomZ = currentZ; // Store for enemy spawning
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'combat',
            spawnEnemies: true
        });

        // Corridor connecting to Room 5
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 5: Puzzle Room #2 (Medium Sokoban)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'puzzle_medium',
            puzzleBlocks: 3,
            pedestals: 3,
            hasLockedDoor: true // Door to treasure wing
        });

        // Corridor connecting to Room 6
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 6: Treasure Antechamber (Friendly ghost)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'antechamber',
            spawnFriendlyGhost: true
        });

        // Corridor connecting to Room 7
        currentZ += this.ROOM_DEPTH / 2 + this.CORRIDOR_LENGTH / 2;
        this.generateCorridor(currentX, groundY + 1, currentZ, 'north', addBlockFn);

        // Room 7: Treasure Chamber (Iron, gold, weapon)
        currentZ += this.CORRIDOR_LENGTH / 2 + this.ROOM_DEPTH / 2;
        this.generateRoom(currentX, groundY + 1, currentZ, addBlockFn, {
            type: 'treasure',
            loot: this.TREASURE_LOOT
        });

        // Mark ruin location for minimap
        if (this.voxelWorld.ruinPositions) {
            this.voxelWorld.ruinPositions.push({
                x: centerX,
                z: centerZ,
                type: 'tutorial',
                name: 'Mysterious Ruin'
            });
        }

        // Schedule enemy spawning after generation complete
        setTimeout(() => {
            this.spawnRuinEnemies(centerX, groundY + 2, combatRoomZ);
        }, 1000);

        console.log('🏛️ Tutorial Ruin generation complete!');
    }

    /**
     * Generate a single room
     * @param {number} centerX - Room center X
     * @param {number} baseY - Room base Y (floor level)
     * @param {number} centerZ - Room center Z
     * @param {Function} addBlockFn - Block placement function
     * @param {Object} options - Room configuration
     */
    generateRoom(centerX, baseY, centerZ, addBlockFn, options = {}) {
        const halfWidth = Math.floor(this.ROOM_WIDTH / 2);
        const halfDepth = Math.floor(this.ROOM_DEPTH / 2);

        // Build room structure
        for (let x = -halfWidth; x <= halfWidth; x++) {
            for (let z = -halfDepth; z <= halfDepth; z++) {
                for (let y = 0; y <= this.ROOM_HEIGHT; y++) {
                    const worldX = centerX + x;
                    const worldY = baseY + y;
                    const worldZ = centerZ + z;

                    const isEdgeX = (x === -halfWidth || x === halfWidth);
                    const isEdgeZ = (z === -halfDepth || z === halfDepth);
                    const isFloor = (y === 0);
                    const isCeiling = (y === this.ROOM_HEIGHT);

                    // Entrance opening (if specified)
                    const isEntrance = options.hasEntrance === 'south' &&
                                      z === -halfDepth &&
                                      Math.abs(x) <= 1 &&
                                      y >= 1 && y <= 3;

                    // North exit opening (connect to corridor)
                    const isNorthExit = z === halfDepth &&
                                       Math.abs(x) <= 1 &&
                                       y >= 1 && y <= 3;

                    if (isEntrance || isNorthExit) {
                        continue; // Leave openings empty
                    }

                    // Place walls
                    if ((isEdgeX || isEdgeZ) && !isFloor && !isCeiling) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.wall, true);

                        // Add torches on walls (every 3 blocks)
                        if (y === 2 && (x % 3 === 0 || z % 3 === 0)) {
                            // Torch placement handled by separate system
                        }
                    }

                    // Place floor
                    if (isFloor) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.floor, true);
                    }

                    // Place ceiling
                    if (isCeiling) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.ceiling, true);
                    }
                }
            }
        }

        // Room-specific decorations
        this.decorateRoom(centerX, baseY, centerZ, addBlockFn, options);
    }

    /**
     * Generate a corridor connecting rooms
     * @param {number} centerX - Corridor center X
     * @param {number} baseY - Corridor base Y
     * @param {number} centerZ - Corridor center Z
     * @param {string} direction - 'north', 'south', 'east', 'west'
     * @param {Function} addBlockFn - Block placement function
     */
    generateCorridor(centerX, baseY, centerZ, direction, addBlockFn) {
        const halfWidth = Math.floor(this.CORRIDOR_WIDTH / 2);
        const halfLength = Math.floor(this.CORRIDOR_LENGTH / 2);

        for (let i = -halfLength; i <= halfLength; i++) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
                for (let y = 0; y <= this.ROOM_HEIGHT; y++) {
                    let worldX, worldZ;

                    if (direction === 'north' || direction === 'south') {
                        worldX = centerX + w;
                        worldZ = centerZ + i;
                    } else {
                        worldX = centerX + i;
                        worldZ = centerZ + w;
                    }

                    const worldY = baseY + y;
                    const isEdge = (w === -halfWidth || w === halfWidth);
                    const isFloor = (y === 0);
                    const isCeiling = (y === this.ROOM_HEIGHT);

                    // Walls
                    if (isEdge && !isFloor && !isCeiling) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.wall, true);
                    }

                    // Floor
                    if (isFloor) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.floor, true);
                    }

                    // Ceiling
                    if (isCeiling) {
                        addBlockFn(worldX, worldY, worldZ, this.BLOCKS.ceiling, true);
                    }
                }
            }
        }
    }

    /**
     * Add room-specific decorations (pedestals, puzzles, cobwebs)
     * @param {number} centerX - Room center X
     * @param {number} baseY - Room base Y
     * @param {number} centerZ - Room center Z
     * @param {Function} addBlockFn - Block placement function
     * @param {Object} options - Room configuration
     */
    decorateRoom(centerX, baseY, centerZ, addBlockFn, options) {
        switch (options.type) {
            case 'puzzle_easy':
                // 1 pedestal at center
                addBlockFn(centerX, baseY + 1, centerZ, this.BLOCKS.pedestal, true);
                // 1 movable block nearby
                addBlockFn(centerX - 2, baseY + 1, centerZ, this.BLOCKS.movableBlock, true);
                break;

            case 'puzzle_medium':
                // 3 pedestals in a line
                addBlockFn(centerX - 2, baseY + 1, centerZ, this.BLOCKS.pedestal, true);
                addBlockFn(centerX, baseY + 1, centerZ, this.BLOCKS.pedestal, true);
                addBlockFn(centerX + 2, baseY + 1, centerZ, this.BLOCKS.pedestal, true);
                // 3 movable blocks scattered
                addBlockFn(centerX - 2, baseY + 1, centerZ + 2, this.BLOCKS.movableBlock, true);
                addBlockFn(centerX, baseY + 1, centerZ - 2, this.BLOCKS.movableBlock, true);
                addBlockFn(centerX + 2, baseY + 1, centerZ + 2, this.BLOCKS.movableBlock, true);
                break;

            case 'corridor':
                // Add cobwebs for atmosphere
                if (options.hasDecoration) {
                    addBlockFn(centerX - 2, baseY + 3, centerZ, this.BLOCKS.cobweb, false);
                    addBlockFn(centerX + 2, baseY + 3, centerZ, this.BLOCKS.cobweb, false);
                }
                break;

            case 'treasure':
                // Place loot blocks
                if (options.loot) {
                    // Iron blocks (in a cluster)
                    for (let i = 0; i < options.loot.iron; i++) {
                        const offsetX = (i % 3) - 1;
                        const offsetZ = Math.floor(i / 3) - 1;
                        addBlockFn(centerX + offsetX, baseY + 1, centerZ + offsetZ, 'iron', true);
                    }

                    // Gold blocks (in a separate cluster)
                    for (let i = 0; i < options.loot.gold; i++) {
                        const offsetX = (i % 3) - 1;
                        const offsetZ = Math.floor(i / 3) + 1;
                        addBlockFn(centerX + offsetX, baseY + 1, centerZ + offsetZ, 'gold', true);
                    }

                    // Weapon (billboard item) - handled separately via billboard system
                    // Store weapon spawn location for later
                    if (this.voxelWorld.worldItemPositions) {
                        this.voxelWorld.worldItemPositions.push({
                            x: centerX,
                            y: baseY + 2,
                            z: centerZ + 2,
                            type: options.loot.weapon
                        });
                    }
                }
                break;
        }
    }

    /**
     * Spawn combat enemies in the combat room
     * @param {number} centerX - Combat room center X
     * @param {number} centerY - Spawn Y height
     * @param {number} centerZ - Combat room center Z
     */
    spawnRuinEnemies(centerX, centerY, centerZ) {
        if (!this.voxelWorld.enemySystem) {
            console.warn('⚠️ Enemy system not available, skipping tutorial ruin enemies');
            return;
        }

        console.log(`⚔️ Spawning tutorial ruin enemies at (${centerX}, ${centerY}, ${centerZ})`);

        // Spawn 1-2 weak enemies
        this.ENEMY_SPAWNS.forEach(spawn => {
            const spawnX = centerX + spawn.x;
            const spawnZ = centerZ + spawn.z;

            // Use existing enemy spawn system
            // Adjust based on actual enemy system API
            if (typeof this.voxelWorld.spawnEnemy === 'function') {
                this.voxelWorld.spawnEnemy(spawn.type, spawnX, centerY, spawnZ);
            } else {
                console.warn(`⚠️ Cannot spawn ${spawn.type} - spawnEnemy method not found`);
            }
        });
    }
}
