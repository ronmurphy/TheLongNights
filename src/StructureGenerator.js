/**
 * StructureGenerator - Procedural ruins and structure generation
 * Generates small/medium/large/colossal ruins with hollow interiors
 * Minimal integration with BiomeWorldGen, no cache/worker modifications
 */
export class StructureGenerator {
    constructor(seed = 12345, billboardItems = {}, voxelWorld = null) {
        this.seed = seed;
        this.voxelWorld = voxelWorld; // Reference to The Long Nights for minimap tracking
        this.STRUCTURE_FREQUENCY = 0.03; // 3% of chunks - REDUCED for performance (~1 per 50 chunks)
        this.MIN_STRUCTURE_DISTANCE = 80; // Minimum blocks between structures

        // 🚀 PERFORMANCE: Cache structure check results to prevent duplicate calculations
        this.structureCache = new Map(); // Map<"chunkX,chunkZ", structureData|null>

        // Structure size definitions - weighted by rarity
        // Small ruins are very common (70%), larger ones progressively rarer
        this.SIZES = {
            small: { width: 5, height: 5, depth: 5, weight: 0.70 },      // 70% of ruins
            medium: { width: 9, height: 7, depth: 9, weight: 0.20 },     // 20% of ruins
            large: { width: 15, height: 10, depth: 15, weight: 0.08 },   // 8% of ruins
            colossal: { width: 25, height: 15, depth: 25, weight: 0.02 } // 2% of ruins (very rare!)
        };

        // 🏛️ Structure shape definitions - different architectural layouts
        this.SHAPES = {
            square: { weight: 0.30, name: 'Square Keep' },           // 30% - Classic square ruins
            rectangle: { weight: 0.15, name: 'Rectangular Hall' },   // 15% - Elongated structures
            lshape: { weight: 0.15, name: 'L-Shaped Wing' },         // 15% - L-shaped corner ruins
            tshape: { weight: 0.10, name: 'T-Shaped Temple' },       // 10% - T-shaped structures
            cross: { weight: 0.10, name: 'Cross Shrine' },           // 10% - Cross/plus shaped
            ushape: { weight: 0.10, name: 'U-Shaped Courtyard' },    // 10% - Courtyard with opening
            circle: { weight: 0.10, name: 'Circular Arena' }         // 10% - Arena/colosseum style
        };

        // Current available blocks (more can be added when textures available)
        this.BLOCK_PALETTE = {
            wall: 'stone',
            floor: 'dirt',
            rubble: 'dirt',
            treasure: 'skull' // Billboard treasure item
        };

        // Use centralized billboard items from The Long Nights
        // If not provided (fallback), use minimal set
        this.TREASURE_ITEMS = Object.keys(billboardItems).length > 0
            ? Object.keys(billboardItems)
            : ['skull', 'mushroom', 'flower', 'berry', 'leaf'];
        
        // Biome-specific blocks for ruins
        // Order: [primary (60%), secondary (25%), tertiary (15%)]
        this.BIOME_BLOCKS = {
            Desert: ['sandstone', 'sandstone', 'sand'],  // 🏜️ Desert ruins: mostly sandstone, some sand
            Mountain: ['stone', 'stone', 'stone'],       // ⛰️ Mountain ruins: all stone (weathered)
            Tundra: ['stone', 'snow', 'dirt'],          // 🌨️ Tundra ruins: stone with snow patches
            Forest: ['stone', 'oak_wood', 'dirt'],      // 🌲 Forest ruins: stone with wood accents
            Plains: ['stone', 'dirt', 'grass'],         // 🌾 Plains ruins: stone with grass/dirt
            default: ['stone', 'dirt', 'grass']
        };
    }
    
    /**
     * 🧊 Generate tundra igloos (small hollow sphere, mostly buried)
     * 1 chunk size (8x8), hollow sphere with entrance
     * ~2% spawn chance in tundra biomes (REDUCED for performance)
     */
    generateIgloo(chunkX, chunkZ, addBlockFn, getHeightFn) {
        // 2% spawn rate (REDUCED from 5%)
        const noise = this.seededNoise(chunkX * 59, chunkZ * 61);
        const threshold = 1.0 - 0.02;
        if (noise < threshold) return;

        // Random position within chunk
        const offsetX = Math.floor(this.seededNoise(chunkX * 67, chunkZ * 71) * 8);
        const offsetZ = Math.floor(this.seededNoise(chunkX * 73, chunkZ * 79) * 8);
        const centerX = chunkX * 16 + offsetX;
        const centerZ = chunkZ * 16 + offsetZ;

        // Get ground height
        let groundY = getHeightFn(centerX, centerZ);
        if (groundY === null || groundY < 0) {
            groundY = 8;
        }

        // Igloo dimensions (small - fits in 1 chunk)
        const radius = 4; // 8 block diameter
        const centerY = groundY + 2; // Slightly buried (2 blocks above ground = half buried)

        console.log(`🧊 Igloo at (${centerX}, ${groundY}, ${centerZ}): radius=${radius}`);

        // Build hollow sphere
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const worldX = centerX + dx;
                    const worldY = centerY + dy;
                    const worldZ = centerZ + dz;

                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // Only build the SHELL (hollow - outer radius but not inner)
                    const isShell = distance <= radius && distance >= radius - 1;

                    // 2x2 entrance on south side (low blocks only)
                    const isEntrance = (dy <= -1) && // Bottom half only
                                      (dz === radius) && // South face
                                      (Math.abs(dx) <= 1); // 2 blocks wide

                    if (isShell && !isEntrance && worldY >= 0) {
                        addBlockFn(worldX, worldY, worldZ, 'snow', false);
                    }
                }
            }
        }
    }
    
    /**
     * 🏜️ Generate desert pyramids (test for mountain system)
     * 3x3 chunk size, tall pyramid with hollow interior and 2x2 entrance
     * Uses same rarity system as ruins (~2% spawn chance - REDUCED)
     */
    generateDesertPyramid(chunkX, chunkZ, addBlockFn, getHeightFn) {
        // Use same spawn system as ruins (2% chance - REDUCED)
        const noise = this.seededNoise(chunkX * 31, chunkZ * 37);
        const threshold = 1.0 - 0.02; // 2% spawn rate
        if (noise < threshold) return;

        // Random position within chunk (center-ish)
        const offsetX = Math.floor(this.seededNoise(chunkX * 41, chunkZ * 43) * 8) + 4;
        const offsetZ = Math.floor(this.seededNoise(chunkX * 47, chunkZ * 53) * 8) + 4;
        const centerX = chunkX * 16 + offsetX;
        const centerZ = chunkZ * 16 + offsetZ;

        // Get ground height at pyramid center
        let groundY = getHeightFn(centerX, centerZ);
        if (groundY === null || groundY < 0) {
            groundY = 8;
        }

        // Pyramid dimensions (smaller for performance)
        const baseSize = 16; // 2x2 chunks (32 block diameter)
        const height = 16; // 16 blocks tall

        console.log(`🏜️ Desert Pyramid at (${centerX}, ${groundY}, ${centerZ}): base=${baseSize}, height=${height}`);

        // Build hollow pyramid layer by layer
        for (let y = 0; y < height; y++) {
            // Calculate size at this height (pyramid tapers from base to peak)
            const heightRatio = y / height;
            const currentSize = Math.floor(baseSize * (1 - heightRatio));
            
            if (currentSize < 1) continue;

            // Build square layer
            for (let dx = -currentSize; dx <= currentSize; dx++) {
                for (let dz = -currentSize; dz <= currentSize; dz++) {
                    const worldX = centerX + dx;
                    const worldZ = centerZ + dz;
                    const worldY = groundY + y;

                    // Only build on the EDGES (hollow interior)
                    const isEdge = Math.abs(dx) === currentSize || Math.abs(dz) === currentSize;
                    
                    // 2x2 entrance on south side (dz = currentSize)
                    const isEntrance = (y < 3) && // First 3 layers
                                      (dz === currentSize) && // South face
                                      (Math.abs(dx) <= 1); // 2 blocks wide

                    if (isEdge && !isEntrance) {
                        addBlockFn(worldX, worldY, worldZ, 'sandstone', false);
                    }
                }
            }
        }

        // Add capstone at peak
        addBlockFn(centerX, groundY + height, centerZ, 'sandstone', false);
    }
    
    /**
     * Main entry point - called from BiomeWorldGen after terrain generation
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkZ - Chunk Z coordinate
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height at position
     * @param {string} biome - Current biome name (optional, for future biome-specific ruins)
     */
    generateStructuresForChunk(chunkX, chunkZ, addBlockFn, getHeightFn, biome = 'default') {
        // 🏜️ DESERT PYRAMID: Hollow structure test (5% spawn rate, same as ruins)
        if (biome === 'Desert' || (biome && biome.name === 'Desert')) {
            this.generateDesertPyramid(chunkX, chunkZ, addBlockFn, getHeightFn);
        }

        // 🧊 TUNDRA IGLOO: Small hollow sphere test (5% spawn rate)
        if (biome === 'Tundra' || (biome && biome.name === 'Tundra')) {
            this.generateIgloo(chunkX, chunkZ, addBlockFn, getHeightFn);
        }

        // Check if this chunk should have a structure origin point
        const structureData = this.checkForStructure(chunkX, chunkZ);

        if (structureData) {
            const { worldX, worldZ, size, shape, buried } = structureData;
            this.generateStructure(worldX, worldZ, size, shape, buried, addBlockFn, getHeightFn, biome);
        }

        // 🚀 OPTIMIZED: Check nearby chunks for structures that might extend into this chunk
        // Reduced from ±2 to ±1 (25 checks → 9 checks)
        // Even colossal ruins (25 blocks) only need ±1 chunk overlap check
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue; // Skip center (already checked above)

                const nearbyData = this.checkForStructure(chunkX + dx, chunkZ + dz);
                if (nearbyData) {
                    const { worldX, worldZ, size, shape, buried } = nearbyData;
                    const sizeData = this.SIZES[size];

                    // Check if structure extends into current chunk
                    const currentChunkWorldX = chunkX * 16;
                    const currentChunkWorldZ = chunkZ * 16;

                    if (Math.abs(worldX - currentChunkWorldX) < sizeData.width + 16 &&
                        Math.abs(worldZ - currentChunkWorldZ) < sizeData.depth + 16) {
                        this.generateStructure(worldX, worldZ, size, shape, buried, addBlockFn, getHeightFn, biome);
                    }
                }
            }
        }
    }
    
    /**
     * Deterministic check if a chunk should have a structure
     * Uses seed-based noise for consistent placement across sessions
     * 🚀 CACHED: Results are cached to prevent duplicate calculations
     */
    checkForStructure(chunkX, chunkZ) {
        // 🚀 Check cache first
        const cacheKey = `${chunkX},${chunkZ}`;
        if (this.structureCache.has(cacheKey)) {
            return this.structureCache.get(cacheKey);
        }

        // Use noise-based generation for structure placement
        const noise = this.seededNoise(chunkX, chunkZ);
        const threshold = 1.0 - this.STRUCTURE_FREQUENCY;

        // Only generate if noise exceeds threshold
        if (noise < threshold) {
            this.structureCache.set(cacheKey, null); // Cache negative result
            return null;
        }

        // Determine structure size based on noise value
        const sizeNoise = this.seededNoise(chunkX * 2, chunkZ * 2);
        let size = 'small';
        let cumulative = 0;

        for (const [sizeName, data] of Object.entries(this.SIZES)) {
            cumulative += data.weight;
            if (sizeNoise < cumulative) {
                size = sizeName;
                break;
            }
        }

        // 🏛️ Determine structure shape based on noise value
        const shapeNoise = this.seededNoise(chunkX * 6, chunkZ * 6);
        let shape = 'square';
        cumulative = 0;

        for (const [shapeName, data] of Object.entries(this.SHAPES)) {
            cumulative += data.weight;
            if (shapeNoise < cumulative) {
                shape = shapeName;
                break;
            }
        }

        // Determine if structure should be buried (25% chance)
        const burialNoise = this.seededNoise(chunkX * 3, chunkZ * 3);
        const buried = burialNoise > 0.75;

        // Calculate world position (center of chunk with some variation)
        const offsetX = Math.floor(this.seededNoise(chunkX * 4, chunkZ * 4) * 16);
        const offsetZ = Math.floor(this.seededNoise(chunkX * 5, chunkZ * 5) * 16);

        const structureData = {
            worldX: chunkX * 16 + offsetX,
            worldZ: chunkZ * 16 + offsetZ,
            size,
            shape,
            buried,
            groundY: null  // Will be set when structure is actually generated
        };

        // 🌳🏛️ COLLISION DETECTION: Check if a tree is too close to this ruin location
        // Prevent ruins from spawning on top of trees (especially rare Douglas Firs!)
        if (this.voxelWorld && this.voxelWorld.treePositions) {
            const sizeData = this.SIZES[size];
            const ruinRadius = Math.max(sizeData.width, sizeData.depth) / 2 + 10; // Ruin half-size + 10 block buffer

            for (const tree of this.voxelWorld.treePositions) {
                const dx = structureData.worldX - tree.x;
                const dz = structureData.worldZ - tree.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance < ruinRadius) {
                    console.log(`🚫 Ruin at (${structureData.worldX}, ${structureData.worldZ}) CANCELLED - ${tree.type} tree at (${tree.x}, ${tree.z}) is ${Math.floor(distance)} blocks away (min: ${Math.floor(ruinRadius)})`);
                    this.structureCache.set(cacheKey, null); // Cache negative result
                    return null; // Don't spawn this ruin
                }
            }
        }

        // 🚀 Cache positive result
        this.structureCache.set(cacheKey, structureData);

        // 🏛️ LOG: Ruin generation for debugging
        const shapeName = this.SHAPES[shape]?.name || shape;
        console.log(`🏛️ Ruin spawned! Type: ${shapeName}, Size: ${size}, Position: (${structureData.worldX}, ${structureData.worldZ}), Buried: ${buried}, Chunk: (${chunkX}, ${chunkZ})`);

        // 🗺️ Track ruin position for minimap
        if (this.voxelWorld && this.voxelWorld.ruinPositions) {
            this.voxelWorld.ruinPositions.push({
                x: structureData.worldX,
                z: structureData.worldZ,
                size: size,
                buried: buried
            });
        }

        return structureData;
    }
    
    /**
     * Generate a structure at the specified world position
     * @param {number} playerY - Optional player Y position for debug mode
     */
    generateStructure(worldX, worldZ, size, shape = 'square', buried, addBlockFn, getHeightFn, biome, playerY = null) {
        const sizeData = this.SIZES[size];
        const { width, height, depth } = sizeData;
        
        // Get ground level at structure center
        let groundHeight;
        if (playerY !== null) {
            // Debug mode - use player Y as reference for more accurate placement
            groundHeight = Math.floor(playerY);
            console.log(`🔧 Debug mode: Using player Y (${groundHeight}) for structure placement`);
        } else {
            // Normal mode - detect ground height with multi-point sampling for reliability
            groundHeight = getHeightFn(worldX, worldZ);

            // If center fails, try sampling nearby points (more reliable during chunk gen)
            if (groundHeight === null || groundHeight === undefined || groundHeight < 0 || groundHeight > 64) {
                const offsets = [[0, 2], [2, 0], [0, -2], [-2, 0]]; // Sample 4 cardinal directions
                for (const [dx, dz] of offsets) {
                    const sampledHeight = getHeightFn(worldX + dx, worldZ + dz);
                    if (sampledHeight !== null && sampledHeight >= 0 && sampledHeight <= 64) {
                        groundHeight = sampledHeight;
                        console.log(`🔍 Used nearby sample for ground height: ${groundHeight}`);
                        break;
                    }
                }
            }

            // Final safety check: if all sampling failed, use safe default
            if (groundHeight === null || groundHeight === undefined || groundHeight < 0 || groundHeight > 64) {
                console.warn(`⚠️ All ground detection failed at (${worldX}, ${worldZ}), using fallback y=8`);
                groundHeight = 8; // Safe default above most terrain
            }
        }
        
        // Calculate base Y position
        let baseY = groundHeight;
        if (buried) {
            // Bury 3/4 of the structure, but never go below y=1 (bedrock is y=0)
            const burialDepth = Math.floor(height * 0.75);
            baseY = Math.max(1, groundHeight - burialDepth);
        } else {
            // Not buried - place 1-2 blocks lower than ground for better integration
            // This makes ruins look like they're partially sunken/settled into terrain
            // Use seeded random for deterministic placement (not Math.random())
            const settlementDepth = Math.floor(this.seededNoise(worldX * 7, worldZ * 11) * 2) + 1; // 1-2 blocks
            baseY = Math.max(1, groundHeight - settlementDepth);
        }
        
        // Final safety check: ensure structure doesn't go below bedrock
        // If structure base + height would go below y=1, adjust upward
        if (baseY < 1) {
            baseY = 1;
            console.warn(`⚠️ Structure adjusted to y=1 to avoid bedrock`);
        }
        
        // Generate structure blocks
        const halfWidth = Math.floor(width / 2);
        const halfDepth = Math.floor(depth / 2);
        
        // Determine block types based on biome (future expansion)
        const palette = this.BIOME_BLOCKS[biome] || this.BIOME_BLOCKS.default;
        
        for (let x = -halfWidth; x <= halfWidth; x++) {
            for (let z = -halfDepth; z <= halfDepth; z++) {
                for (let y = 0; y < height; y++) {
                    const worldPosX = worldX + x;
                    const worldPosZ = worldZ + z;
                    const worldPosY = baseY + y;
                    
                    // Don't place blocks at or below bedrock
                    if (worldPosY <= 0) continue;

                    // 🏛️ SHAPE-BASED WALL DETECTION: Different logic for each shape
                    const isWall = this.isWallBlock(x, y, z, width, height, depth, shape);
                    const isDoorway = this.isDoorway(x, y, z, width, height, depth, shape);

                    // Place wall blocks, but skip doorways
                    if (isWall && !isDoorway) {
                        // Add some variation - occasionally use dirt/grass instead of stone
                        const blockType = this.getBlockType(x, y, z, palette);
                        addBlockFn(worldPosX, worldPosY, worldPosZ, blockType, false);
                    }
                }
            }
        }
        
        // Add interior details (treasure chests)
        this.addInteriorDetails(worldX, worldZ, baseY, width, height, depth, addBlockFn);

        // 👻 Spawn friendly ghost at ruin location (80% chance, 2x at night) using actual ground height
        if (this.voxelWorld && this.voxelWorld.ghostSystem && !buried) {
            // Get current game time for night spawn boost
            const gameTime = this.voxelWorld.gameTime || 12;
            const isNight = gameTime >= 19 || gameTime < 6;
            const spawnChance = isNight ? 0.95 : 0.80; // 95% at night, 80% during day

            if (Math.random() < spawnChance) {
                this.voxelWorld.ghostSystem.spawnGhost(worldX, groundHeight, worldZ, 'ruin');
            }

            // 🌙 At night, 50% chance for SECOND friendly ghost at same ruin
            if (isNight && Math.random() < 0.5) {
                this.voxelWorld.ghostSystem.spawnGhost(
                    worldX + (Math.random() - 0.5) * 5, // Offset slightly
                    groundHeight,
                    worldZ + (Math.random() - 0.5) * 5
                , 'ruin');
            }
        }

        // 💀 Spawn angry ghost at ruin location (60% chance, 90% at night) - triggers battles
        if (this.voxelWorld && this.voxelWorld.angryGhostSystem && !buried) {
            const gameTime = this.voxelWorld.gameTime || 12;
            const isNight = gameTime >= 19 || gameTime < 6;
            const spawnChance = isNight ? 0.90 : 0.60; // 90% at night, 60% during day

            if (Math.random() < spawnChance) {
                this.voxelWorld.angryGhostSystem.spawnAngryGhost(worldX, groundHeight, worldZ);
            }

            // 🌙 At night, 40% chance for SECOND angry ghost at same ruin
            if (isNight && Math.random() < 0.4) {
                this.voxelWorld.angryGhostSystem.spawnAngryGhost(
                    worldX + (Math.random() - 0.5) * 6, // Offset slightly
                    groundHeight,
                    worldZ + (Math.random() - 0.5) * 6
                );
            }
        }
    }
    
    /**
     * Determine if a position is a wall block (shape-aware)
     */
    isWallBlock(x, y, z, width, height, depth, shape = 'square') {
        const halfWidth = Math.floor(width / 2);
        const halfDepth = Math.floor(depth / 2);

        // Check if position is within the shape's footprint
        const inShape = this.isInShape(x, z, width, depth, shape);
        if (!inShape) return false;

        // Floor - always solid within shape
        if (y === 0) return true;

        // Ceiling (partial - ruins have holes)
        if (y === height - 1) {
            // Only 40% of ceiling remains
            return this.seededNoise(x * 7, z * 7) < 0.4;
        }

        // Walls - check if on edge of shape
        const onEdge = this.isOnShapeEdge(x, z, width, depth, shape);

        if (onEdge) {
            // Add some crumbling - 10% of wall blocks missing
            return this.seededNoise(x * 11, y * 13 + z * 17) > 0.1;
        }

        return false;
    }

    /**
     * Check if position is within the shape's footprint
     */
    isInShape(x, z, width, depth, shape) {
        const halfWidth = Math.floor(width / 2);
        const halfDepth = Math.floor(depth / 2);

        switch (shape) {
            case 'square':
                return Math.abs(x) <= halfWidth && Math.abs(z) <= halfDepth;

            case 'rectangle':
                // Make it 1.5x longer in Z direction
                return Math.abs(x) <= halfWidth && Math.abs(z) <= Math.floor(halfDepth * 1.5);

            case 'lshape':
                // L-shape: two rectangles forming an L
                const inMainWing = Math.abs(x) <= halfWidth && z <= halfDepth && z >= -halfDepth / 2;
                const inSideWing = x <= halfWidth && x >= halfWidth / 2 && Math.abs(z) <= halfDepth;
                return inMainWing || inSideWing;

            case 'tshape':
                // T-shape: horizontal bar + vertical stem
                const inTopBar = Math.abs(x) <= halfWidth && z >= halfDepth / 2 && z <= halfDepth;
                const inStem = Math.abs(x) <= halfWidth / 3 && Math.abs(z) <= halfDepth;
                return inTopBar || inStem;

            case 'cross':
                // Cross/plus shape: horizontal + vertical bars
                const inHorizontal = Math.abs(x) <= halfWidth && Math.abs(z) <= halfDepth / 3;
                const inVertical = Math.abs(x) <= halfWidth / 3 && Math.abs(z) <= halfDepth;
                return inHorizontal || inVertical;

            case 'ushape':
                // U-shape: square with opening on one side
                const inOuter = Math.abs(x) <= halfWidth && Math.abs(z) <= halfDepth;
                const inHollow = Math.abs(x) <= halfWidth / 2 && z >= 0 && z <= halfDepth;
                return inOuter && !inHollow;

            case 'circle':
                // Circular arena
                const radius = Math.min(halfWidth, halfDepth);
                const distance = Math.sqrt(x * x + z * z);
                return distance <= radius;

            default:
                return Math.abs(x) <= halfWidth && Math.abs(z) <= halfDepth;
        }
    }

    /**
     * Check if position is on the edge of the shape
     */
    isOnShapeEdge(x, z, width, depth, shape) {
        const halfWidth = Math.floor(width / 2);
        const halfDepth = Math.floor(depth / 2);

        switch (shape) {
            case 'square':
                const isEdgeX = Math.abs(x) === halfWidth;
                const isEdgeZ = Math.abs(z) === halfDepth;
                return isEdgeX || isEdgeZ;

            case 'rectangle':
                const rectDepth = Math.floor(halfDepth * 1.5);
                return Math.abs(x) === halfWidth || Math.abs(z) === rectDepth;

            case 'lshape':
                // Check edges of both L sections
                const onMainEdge = (Math.abs(x) === halfWidth && z >= -halfDepth / 2 && z <= halfDepth) ||
                                   (z === -halfDepth / 2 || z === halfDepth) && Math.abs(x) <= halfWidth;
                const onSideEdge = (x === halfWidth / 2 || x === halfWidth) && Math.abs(z) <= halfDepth ||
                                   (Math.abs(z) === halfDepth && x >= halfWidth / 2 && x <= halfWidth);
                return onMainEdge || onSideEdge;

            case 'tshape':
            case 'cross':
            case 'ushape':
                // For complex shapes, check if adjacent cell is outside shape
                const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
                for (const [dx, dz] of dirs) {
                    if (!this.isInShape(x + dx, z + dz, width, depth, shape)) {
                        return true;
                    }
                }
                return false;

            case 'circle':
                const radius = Math.min(halfWidth, halfDepth);
                const distance = Math.sqrt(x * x + z * z);
                const innerRadius = radius - 1;
                return distance > innerRadius && distance <= radius;

            default:
                return Math.abs(x) === halfWidth || Math.abs(z) === halfDepth;
        }
    }
    
    /**
     * Check if position is a doorway (2x2 opening) - shape-aware
     */
    isDoorway(x, y, z, width, _height, depth, shape = 'square') {
        const halfWidth = Math.floor(width / 2);
        const halfDepth = Math.floor(depth / 2);

        // Only at ground level (y = 0, 1, 2 for 2-high + 1 above head)
        if (y > 2) return false;

        switch (shape) {
            case 'square':
            case 'rectangle':
                // Front wall doorway (centered)
                if (z === Math.floor(halfDepth * (shape === 'rectangle' ? 1.5 : 1)) && Math.abs(x) <= 1) return true;
                // Side doorways for larger structures
                if (width >= 15) {
                    if (x === halfWidth && Math.abs(z) <= 1) return true;
                    if (x === -halfWidth && Math.abs(z) <= 1) return true;
                }
                return false;

            case 'lshape':
                // Doorway at each wing
                if (z === halfDepth && Math.abs(x) <= 1) return true; // Main wing
                if (x === halfWidth && Math.abs(z) <= 1) return true; // Side wing
                return false;

            case 'tshape':
                // Doorway at stem bottom
                if (z === -halfDepth && Math.abs(x) <= 1) return true;
                return false;

            case 'cross':
                // Doorways at each arm of the cross
                if (z === -halfDepth && Math.abs(x) <= 1) return true; // Bottom
                if (z === halfDepth && Math.abs(x) <= 1) return true;  // Top
                if (x === -halfWidth && Math.abs(z) <= 1) return true; // Left
                if (x === halfWidth && Math.abs(z) <= 1) return true;  // Right
                return false;

            case 'ushape':
                // Doorway at the opening of the U
                if (z === halfDepth && Math.abs(x) <= 1) return true;
                return false;

            case 'circle':
                // One doorway on south side
                const radius = Math.min(halfWidth, halfDepth);
                const distance = Math.sqrt(x * x + z * z);
                return distance >= radius - 1 && distance <= radius && z > 0 && Math.abs(x) <= 1;

            default:
                return z === halfDepth && Math.abs(x) <= 1;
        }
    }
    
    /**
     * Get block type with some variation (biome-aware)
     */
    getBlockType(x, y, z, palette) {
        const noise = this.seededNoise(x * 19, y * 23 + z * 29);

        // Use primary material from palette (sandstone for desert, stone for others)
        const primaryMaterial = palette[0]; // First item is primary (sandstone, stone, etc.)
        const secondaryMaterial = palette.length > 1 ? palette[1] : 'dirt';
        const tertiaryMaterial = palette.length > 2 ? palette[2] : 'dirt';

        // 60% primary material, 25% secondary, 15% tertiary
        if (noise < 0.60) return primaryMaterial;
        if (noise < 0.85) return secondaryMaterial;
        return tertiaryMaterial;
    }
    
    /**
     * Add interior details - random billboard treasure items
     */
    addInteriorDetails(worldX, worldZ, baseY, width, _height, depth, addBlockFn) {
        // Small structures: 1 treasure, Medium: 1-2, Large: 2-3, Colossal: 3-5
        const treasureCount = width < 7 ? 1 : width < 12 ? 2 : width < 20 ? 3 : 4;
        
        for (let i = 0; i < treasureCount; i++) {
            // Random position inside structure (away from walls)
            const x = Math.floor(this.seededNoise(i * 31, worldX) * (width - 4)) - Math.floor(width / 2) + 2;
            const z = Math.floor(this.seededNoise(i * 37, worldZ) * (depth - 4)) - Math.floor(depth / 2) + 2;
            const y = 1; // Place on floor
            
            // Random selection from treasure items
            const randomIndex = Math.floor(this.seededNoise(i * 43, worldZ * 47) * this.TREASURE_ITEMS.length);
            const treasureType = this.TREASURE_ITEMS[randomIndex];
            
            addBlockFn(worldX + x, baseY + y, worldZ + z, treasureType, false);
        }
    }
    
    /**
     * Seeded noise function for deterministic generation
     * Returns value between 0 and 1
     */
    seededNoise(x, z) {
        const n = Math.sin(x * 12.9898 + z * 78.233 + this.seed) * 43758.5453123;
        return n - Math.floor(n);
    }
    
    /**
     * 🔧 DEBUG: Generate a ruin near player position for testing
     * Usage: window.makeRuins("small", "lshape") or window.makeRuins("medium"), etc.
     * @param {string} size - "small", "medium", "large", or "colossal"
     * @param {string} shape - "square", "rectangle", "lshape", "tshape", "cross", "ushape", "circle" (optional)
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position (used for accurate placement)
     * @param {number} playerZ - Player Z position
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     * @param {string} biome - Biome name (optional)
     */
    debugGenerateRuin(size, shape, playerX, playerY, playerZ, addBlockFn, getHeightFn, biome = 'default') {
        // Validate size
        if (!this.SIZES[size]) {
            console.error(`❌ Invalid size "${size}". Use: small, medium, large, or colossal`);
            return;
        }

        // Validate shape
        if (!this.SHAPES[shape]) {
            console.error(`❌ Invalid shape "${shape}". Use: square, rectangle, lshape, tshape, cross, ushape, circle`);
            return;
        }

        // Place structure 10-20 blocks in front of player (positive Z direction)
        const distance = 15;
        const offsetX = Math.floor((Math.random() - 0.5) * 10); // Random offset ±5 blocks
        const offsetZ = distance + Math.floor(Math.random() * 10); // 15-25 blocks away

        const structureX = Math.floor(playerX + offsetX);
        const structureZ = Math.floor(playerZ + offsetZ);

        // Don't bury debug structures - place them on surface at player's Y level
        const buried = false;

        const shapeName = this.SHAPES[shape]?.name || shape;
        console.log(`🏛️ Generating ${size} ${shapeName} at (${structureX}, ${playerY}, ${structureZ}) near player at (${playerX}, ${playerY}, ${playerZ})`);

        // Pass playerY to use player's current height instead of ground detection
        this.generateStructure(structureX, structureZ, size, shape, buried, addBlockFn, getHeightFn, biome, playerY);

        console.log(`✅ ${size} ${shapeName} generated! Look around position (${structureX}, ${structureZ})`);
    }

    /**
     * 🏰 Generate a defensive stone wall section with battlements
     * Can be placed in sequence to create long defensive walls
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} length - Wall length (blocks)
     * @param {number} height - Wall height (blocks, min 3 for battlements)
     * @param {number} thickness - Wall thickness (blocks, default 2)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {string} material - Wall material (default 'stone')
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateWall(worldX, worldZ, length, height, thickness, orientation, material, addBlockFn, getHeightFn) {
        console.log(`🏰 Generating wall at (${worldX}, ${worldZ}): ${length}×${height}×${thickness}, ${orientation}`);

        // Get ground height
        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8; // Safe fallback
        }

        const baseY = groundY;

        // Battlements on top (every 2 blocks)
        const battlementSpacing = 2;

        // Build wall based on orientation
        const isNorthSouth = orientation === 'north-south';

        for (let i = 0; i < length; i++) {
            for (let t = 0; t < thickness; t++) {
                for (let h = 0; h < height; h++) {
                    let blockX, blockZ;

                    if (isNorthSouth) {
                        blockX = worldX + t - Math.floor(thickness / 2);
                        blockZ = worldZ + i - Math.floor(length / 2);
                    } else {
                        blockX = worldX + i - Math.floor(length / 2);
                        blockZ = worldZ + t - Math.floor(thickness / 2);
                    }

                    addBlockFn(blockX, baseY + h, blockZ, material, true);
                }

                // Add battlements (crenellations) on top
                if (i % battlementSpacing === 0 && height >= 3) {
                    let battlementX, battlementZ;

                    if (isNorthSouth) {
                        battlementX = worldX + t - Math.floor(thickness / 2);
                        battlementZ = worldZ + i - Math.floor(length / 2);
                    } else {
                        battlementX = worldX + i - Math.floor(length / 2);
                        battlementZ = worldZ + t - Math.floor(thickness / 2);
                    }

                    addBlockFn(battlementX, baseY + height, battlementZ, material, true);
                }
            }
        }

        console.log(`✅ Wall built: ${length} blocks long, ${height} blocks tall, ${thickness} blocks thick`);
    }

    /**
     * 🗼 Generate a defensive tower with multiple levels
     * Square tower with arrow slits and battlements
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} baseSize - Tower base width/depth (blocks, min 3)
     * @param {number} height - Total tower height (blocks, min 8)
     * @param {string} material - Tower material (default 'stone')
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateTower(worldX, worldZ, baseSize, height, material, addBlockFn, getHeightFn) {
        console.log(`🗼 Generating tower at (${worldX}, ${worldZ}): ${baseSize}×${baseSize}×${height}`);

        // Get ground height
        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8; // Safe fallback
        }

        const baseY = groundY;
        const halfSize = Math.floor(baseSize / 2);

        // Build tower structure
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                for (let y = 0; y < height; y++) {
                    const isEdge = Math.abs(x) === halfSize || Math.abs(z) === halfSize;
                    const isCorner = Math.abs(x) === halfSize && Math.abs(z) === halfSize;

                    // Solid floor every 3 levels
                    const isFloorLevel = y % 3 === 0;

                    // 🚪 Doorway - 2×2 opening on south side (z = halfSize), ground level (y = 1, 2)
                    const isDoorway = (z === halfSize && y >= 1 && y <= 2) &&
                                     (x === -1 || x === 0);

                    // Arrow slits (openings) on walls at levels 3, 6, 9, etc. (not on corners or floor levels)
                    const isArrowSlitLevel = y % 3 === 1;
                    const isArrowSlit = isArrowSlitLevel && isEdge && !isCorner &&
                                       ((x === 0 && Math.abs(z) === halfSize) ||
                                        (z === 0 && Math.abs(x) === halfSize));

                    // Build walls (hollow interior except floors)
                    if (isEdge || isFloorLevel) {
                        if (!isArrowSlit && !isDoorway) {
                            addBlockFn(worldX + x, baseY + y, worldZ + z, material, true);
                        }
                    }
                }

                // Battlements on top (corners + center of each wall)
                const isBattlement = Math.abs(x) === halfSize || Math.abs(z) === halfSize;
                const isCenterOfWall = (x === 0 && Math.abs(z) === halfSize) ||
                                      (z === 0 && Math.abs(x) === halfSize);
                const isBattlementCorner = Math.abs(x) === halfSize && Math.abs(z) === halfSize;

                if (isBattlement && (isBattlementCorner || isCenterOfWall)) {
                    addBlockFn(worldX + x, baseY + height, worldZ + z, material, true);
                    addBlockFn(worldX + x, baseY + height + 1, worldZ + z, material, true);
                }
            }
        }

        console.log(`✅ Tower built: ${baseSize}×${baseSize}×${height + 2} with doorway, arrow slits, and battlements`);
    }

    /**
     * 🏰 Generate a castle wall section with integrated towers
     * Combines walls and corner towers for proper fortifications
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} wallLength - Length of wall section (blocks)
     * @param {number} wallHeight - Height of wall (blocks)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {string} material - Wall material (default 'stone')
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateCastleWall(worldX, worldZ, wallLength, wallHeight, orientation, material, addBlockFn, getHeightFn) {
        console.log(`🏰 Generating castle wall at (${worldX}, ${worldZ}): ${wallLength} blocks long`);

        // Main wall section
        this.generateWall(worldX, worldZ, wallLength, wallHeight, 2, orientation, material, addBlockFn, getHeightFn);

        // Add towers at each end
        const towerSize = 5;
        const towerHeight = wallHeight + 3;
        const halfLength = Math.floor(wallLength / 2);

        if (orientation === 'north-south') {
            // Towers on north and south ends
            this.generateTower(worldX, worldZ - halfLength, towerSize, towerHeight, material, addBlockFn, getHeightFn);
            this.generateTower(worldX, worldZ + halfLength, towerSize, towerHeight, material, addBlockFn, getHeightFn);
        } else {
            // Towers on east and west ends
            this.generateTower(worldX - halfLength, worldZ, towerSize, towerHeight, material, addBlockFn, getHeightFn);
            this.generateTower(worldX + halfLength, worldZ, towerSize, towerHeight, material, addBlockFn, getHeightFn);
        }

        console.log(`✅ Castle wall with towers complete`);
    }

    /**
     * 🛡️ Generate a wooden barricade - EARLY GAME
     * Simple criss-cross wood barrier for quick defense
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} length - Barricade length (blocks)
     * @param {number} height - Barricade height (blocks, typically 3-4)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {string} material - Barricade material (wood)
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateBarricade(worldX, worldZ, length, height, orientation, material, addBlockFn, getHeightFn) {
        console.log(`🛡️ Generating barricade at (${worldX}, ${worldZ}): ${length}×${height}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY;
        const isNorthSouth = orientation === 'north-south';

        // Build criss-cross pattern
        for (let i = 0; i < length; i++) {
            for (let h = 0; h < height; h++) {
                let blockX, blockZ;

                if (isNorthSouth) {
                    blockX = worldX;
                    blockZ = worldZ + i - Math.floor(length / 2);
                } else {
                    blockX = worldX + i - Math.floor(length / 2);
                    blockZ = worldZ;
                }

                // Diagonal criss-cross pattern (every other height level)
                if ((i + h) % 2 === 0) {
                    addBlockFn(blockX, baseY + h, blockZ, material, true);
                }
            }
        }

        console.log(`✅ Barricade built: ${length} blocks long, ${height} blocks tall`);
    }

    /**
     * 🔱 Generate a spike wall - EARLY GAME
     * Pointed stakes to damage enemies
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} length - Spike wall length (blocks)
     * @param {number} height - Spike height (blocks, typically 2-3)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {string} material - Spike material (wood)
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateSpikeWall(worldX, worldZ, length, height, orientation, material, addBlockFn, getHeightFn) {
        console.log(`🔱 Generating spike wall at (${worldX}, ${worldZ}): ${length}×${height}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY;
        const isNorthSouth = orientation === 'north-south';

        // Build spike pattern - pyramids every 2 blocks
        for (let i = 0; i < length; i++) {
            // Base spike
            for (let h = 0; h < height; h++) {
                let blockX, blockZ;

                if (isNorthSouth) {
                    blockX = worldX;
                    blockZ = worldZ + i - Math.floor(length / 2);
                } else {
                    blockX = worldX + i - Math.floor(length / 2);
                    blockZ = worldZ;
                }

                // Create pointed spike (narrower at top)
                if (h < height - 1 || i % 2 === 0) {
                    addBlockFn(blockX, baseY + h, blockZ, material, true);
                }
            }
        }

        console.log(`✅ Spike wall built: ${length} blocks long, ${height} spikes tall`);
    }

    /**
     * 🚧 Generate a trench - EARLY/MID GAME
     * Defensive ditch to slow enemies
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} length - Trench length (blocks)
     * @param {number} depth - Trench depth (blocks, typically 2-3)
     * @param {number} width - Trench width (blocks, typically 2-3)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateTrench(worldX, worldZ, length, depth, width, orientation, addBlockFn, getHeightFn) {
        console.log(`🚧 Generating trench at (${worldX}, ${worldZ}): ${length}×${depth}×${width}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY;
        const isNorthSouth = orientation === 'north-south';

        // Dig out trench by placing air blocks (removing terrain)
        for (let i = 0; i < length; i++) {
            for (let w = 0; w < width; w++) {
                for (let d = 1; d <= depth; d++) {
                    let blockX, blockZ;

                    if (isNorthSouth) {
                        blockX = worldX + w - Math.floor(width / 2);
                        blockZ = worldZ + i - Math.floor(length / 2);
                    } else {
                        blockX = worldX + i - Math.floor(length / 2);
                        blockZ = worldZ + w - Math.floor(width / 2);
                    }

                    // Remove blocks to create trench (place air)
                    addBlockFn(blockX, baseY - d, blockZ, null, false);
                }
            }
        }

        console.log(`✅ Trench dug: ${length}×${depth}×${width}`);
    }

    /**
     * 🏹 Generate an archer platform - MID GAME
     * Raised platform for shooting over walls
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} size - Platform size (square, blocks)
     * @param {number} height - Platform height (blocks)
     * @param {string} material - Platform material
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateArcherPlatform(worldX, worldZ, size, height, material, addBlockFn, getHeightFn) {
        console.log(`🏹 Generating archer platform at (${worldX}, ${worldZ}): ${size}×${size}×${height}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY;
        const halfSize = Math.floor(size / 2);

        // Build support pillars at corners
        for (let x = -halfSize; x <= halfSize; x += size) {
            for (let z = -halfSize; z <= halfSize; z += size) {
                for (let h = 0; h < height; h++) {
                    addBlockFn(worldX + x, baseY + h, worldZ + z, material, true);
                }
            }
        }

        // Build platform floor
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                addBlockFn(worldX + x, baseY + height, worldZ + z, material, true);
            }
        }

        // Build protective railings on 3 sides (leave one open for access)
        for (let x = -halfSize; x <= halfSize; x++) {
            // Front and back railings
            if (Math.abs(x) === halfSize || x % 2 === 0) {
                addBlockFn(worldX + x, baseY + height + 1, worldZ - halfSize, material, true);
                addBlockFn(worldX + x, baseY + height + 1, worldZ + halfSize, material, true);
            }
        }
        for (let z = -halfSize; z <= halfSize; z++) {
            // Side railing (one side only)
            if (Math.abs(z) === halfSize || z % 2 === 0) {
                addBlockFn(worldX - halfSize, baseY + height + 1, worldZ + z, material, true);
            }
        }

        console.log(`✅ Archer platform built: ${size}×${size} at height ${height}`);
    }

    /**
     * 🏰 Generate a gatehouse - MID/LATE GAME
     * Fortified entrance with murder holes
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} width - Gatehouse width (blocks)
     * @param {number} height - Gatehouse height (blocks)
     * @param {string} orientation - 'north-south' or 'east-west'
     * @param {string} material - Gatehouse material
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateGatehouse(worldX, worldZ, width, height, orientation, material, addBlockFn, getHeightFn) {
        console.log(`🏰 Generating gatehouse at (${worldX}, ${worldZ}): ${width}×${height}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY;
        const halfWidth = Math.floor(width / 2);
        const isNorthSouth = orientation === 'north-south';
        const passageWidth = 3; // 3-block wide passage

        // Build main structure
        for (let w = -halfWidth; w <= halfWidth; w++) {
            for (let h = 0; h < height; h++) {
                for (let d = -2; d <= 2; d++) {
                    let blockX, blockZ;

                    if (isNorthSouth) {
                        blockX = worldX + w;
                        blockZ = worldZ + d;
                    } else {
                        blockX = worldX + d;
                        blockZ = worldZ + w;
                    }

                    const isEdge = Math.abs(w) === halfWidth || Math.abs(d) === 2;
                    const isPassage = Math.abs(w) <= Math.floor(passageWidth / 2) && h < 4;

                    // Build walls, leave passage open
                    if (isEdge && !isPassage) {
                        addBlockFn(blockX, baseY + h, blockZ, material, true);
                    }

                    // Murder holes in ceiling above passage
                    if (h === 4 && Math.abs(w) <= Math.floor(passageWidth / 2) && d === 0) {
                        // Leave holes for dropping things on enemies
                        if (w % 2 === 0) {
                            // Skip block to create hole
                        } else {
                            addBlockFn(blockX, baseY + h, blockZ, material, true);
                        }
                    } else if (h === 4 && Math.abs(w) <= Math.floor(passageWidth / 2)) {
                        addBlockFn(blockX, baseY + h, blockZ, material, true);
                    }
                }
            }
        }

        // Add battlements on top
        for (let w = -halfWidth; w <= halfWidth; w += 2) {
            for (let d = -2; d <= 2; d += 2) {
                let blockX, blockZ;

                if (isNorthSouth) {
                    blockX = worldX + w;
                    blockZ = worldZ + d;
                } else {
                    blockX = worldX + d;
                    blockZ = worldZ + w;
                }

                addBlockFn(blockX, baseY + height, blockZ, material, true);
            }
        }

        console.log(`✅ Gatehouse built: ${width}×${height} with murder holes`);
    }

    /**
     * ⚔️ Generate a bunker - LATE GAME
     * Underground fortification with firing positions
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} size - Bunker size (square)
     * @param {number} depth - How deep underground (blocks)
     * @param {string} material - Bunker material (stone)
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateBunker(worldX, worldZ, size, depth, material, addBlockFn, getHeightFn) {
        console.log(`⚔️ Generating bunker at (${worldX}, ${worldZ}): ${size}×${size}, depth ${depth}`);

        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8;
        }

        const baseY = groundY - depth;
        const halfSize = Math.floor(size / 2);

        // Build underground chamber
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                const isEdge = Math.abs(x) === halfSize || Math.abs(z) === halfSize;

                // Floor
                addBlockFn(worldX + x, baseY, worldZ + z, material, true);

                // Walls (hollow interior)
                if (isEdge) {
                    for (let h = 1; h <= depth; h++) {
                        // Add firing slits at eye level
                        const isFiringSlit = h === depth - 1 &&
                                           ((x === 0 && Math.abs(z) === halfSize) ||
                                            (z === 0 && Math.abs(x) === halfSize));

                        if (!isFiringSlit) {
                            addBlockFn(worldX + x, baseY + h, worldZ + z, material, true);
                        }
                    }
                }

                // Roof
                addBlockFn(worldX + x, baseY + depth + 1, worldZ + z, material, true);
            }
        }

        // Add entrance stairs on one side
        for (let d = 0; d <= depth; d++) {
            addBlockFn(worldX, baseY + d, worldZ + halfSize + d, material, true);
        }

        console.log(`✅ Bunker built: ${size}×${size} at depth ${depth}`);
    }

    /**
     * 🏠 Generate a simple house with sloped roof
     * Flexible dimensions controlled by workbench sliders (minimum 4×4×4 interior)
     * Walls use selected wood block, floor/roof use stone
     *
     * @param {number} worldX - World X position (center)
     * @param {number} worldZ - World Z position (center)
     * @param {number} interiorLength - Interior walkable length (min 4)
     * @param {number} interiorWidth - Interior walkable width (min 4)
     * @param {number} interiorHeight - Interior walkable height (min 4)
     * @param {string} wallMaterial - Material for walls (wood type, e.g. 'oak_wood')
     * @param {string} floorMaterial - Material for floor/roof (usually 'stone')
     * @param {string} doorSide - Which side has door: 'north', 'south', 'east', 'west'
     * @param {Function} addBlockFn - Function to place blocks
     * @param {Function} getHeightFn - Function to get ground height
     */
    generateHouse(worldX, worldZ, interiorLength, interiorWidth, interiorHeight,
                  wallMaterial, floorMaterial, doorSide, addBlockFn, getHeightFn) {
        
        console.log(`🏠 Generating house at (${worldX}, ${worldZ}): ${interiorLength}×${interiorWidth}×${interiorHeight} interior, door on ${doorSide}`);
        console.log(`   Materials: walls=${wallMaterial}, floor/roof=${floorMaterial}`);
        
        // Get ground height
        let groundY = getHeightFn(worldX, worldZ);
        if (groundY === null || groundY === undefined) {
            groundY = 8; // Safe fallback
        }
        
        // Floor is at ground level
        const baseY = groundY;
        
        // Wall thickness
        const wallThickness = 1;
        
        // Total structure dimensions (interior + walls)
        const totalLength = interiorLength + (wallThickness * 2);
        const totalWidth = interiorWidth + (wallThickness * 2);
        const totalHeight = interiorHeight + wallThickness; // +1 for floor
        
        // Calculate bounds for building (simpler approach)
        const minX = -Math.floor(totalLength / 2);
        const maxX = minX + totalLength - 1;
        const minZ = -Math.floor(totalWidth / 2);
        const maxZ = minZ + totalWidth - 1;
        
        // Door dimensions (2 blocks wide × 2 blocks tall for easy player access)
        const doorWidth = 2;
        const doorHeight = 2;
        
        // Parse wall material - handle block sides if passed as array
        let actualWallMaterial = wallMaterial;
        if (typeof wallMaterial === 'object' && wallMaterial.sides) {
            // If material has sides array (like multi-face blocks), use first side
            actualWallMaterial = wallMaterial.sides[0] || 'oak_wood';
        }
        
        console.log(`   Using wall material: ${actualWallMaterial}`);
        console.log(`   Building: ${totalLength}×${totalWidth}×${totalHeight + 2} exterior (${interiorLength}×${interiorWidth}×${interiorHeight} interior)`);
        console.log(`   Bounds: X[${minX} to ${maxX}], Z[${minZ} to ${maxZ}]`);
        
        // Build structure
        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                for (let y = 0; y <= totalHeight + 2; y++) { // +2 for sloped roof peak
                    const worldPosX = worldX + x;
                    const worldPosZ = worldZ + z;
                    const worldPosY = baseY + y;
                    
                    // Determine if this is interior space (not including walls)
                    const isInterior = x > minX && x < maxX && z > minZ && z < maxZ;
                    
                    // Floor - stone, full coverage including interior
                    if (y === 0) {
                        addBlockFn(worldPosX, worldPosY, worldPosZ, floorMaterial, true);
                        continue;
                    }
                    
                    // Skip interior space entirely (hollow for walking)
                    if (isInterior && y > 0 && y < totalHeight) continue;
                    
                    // Walls - wood, check if on edge
                    const onNorthEdge = z === minZ;
                    const onSouthEdge = z === maxZ;
                    const onEastEdge = x === maxX;
                    const onWestEdge = x === minX;
                    
                    const onEdge = onNorthEdge || onSouthEdge || onEastEdge || onWestEdge;
                    
                    if (onEdge && y > 0 && y <= totalHeight) {
                        // Check if this is the door side
                        const isDoorSide = (doorSide === 'north' && onNorthEdge) ||
                                         (doorSide === 'south' && onSouthEdge) ||
                                         (doorSide === 'east' && onEastEdge) ||
                                         (doorSide === 'west' && onWestEdge);
                        
                        // Door cutout - exactly 2 blocks wide × 2 blocks tall
                        if (isDoorSide && y >= 1 && y <= doorHeight) {
                            // Door at positions -1 and 0 (centered on wall)
                            
                            let inDoor = false;
                            if (doorSide === 'north' || doorSide === 'south') {
                                // Door on N/S wall, check X position
                                inDoor = (x === -1 || x === 0);
                            } else {
                                // Door on E/W wall, check Z position
                                inDoor = (z === -1 || z === 0);
                            }
                            
                            if (inDoor) continue; // Skip door blocks
                        }
                        
                        // Determine wall height (taller on one side for sloped roof)
                        let wallHeight = totalHeight;
                        
                        // Make opposite wall taller (+2 blocks) for roof slope
                        if ((doorSide === 'north' && onSouthEdge) || 
                            (doorSide === 'south' && onNorthEdge) ||
                            (doorSide === 'east' && onWestEdge) ||
                            (doorSide === 'west' && onEastEdge)) {
                            wallHeight = totalHeight + 2; // Tall wall opposite door
                        }
                        
                        if (y <= wallHeight) {
                            addBlockFn(worldPosX, worldPosY, worldPosZ, actualWallMaterial, true);
                        }
                    }
                    
                    // Sloped roof - stone, connects tall wall to short wall
                    if (y > totalHeight && y <= totalHeight + 2) {
                        const roofY = y - totalHeight; // 1 or 2
                        
                        // Calculate slope based on door side
                        let inRoof = false;
                        
                        if (doorSide === 'north' || doorSide === 'south') {
                            // Slope runs along Z axis
                            const slopeProgress = doorSide === 'north' ? 
                                (z - minZ) / (totalWidth) : 
                                (maxZ - z) / (totalWidth);
                            const roofZ = Math.floor(slopeProgress * 2); // 0, 1, or 2
                            inRoof = roofY === (2 - roofZ) && x >= minX && x <= maxX;
                        } else {
                            // Slope runs along X axis
                            const slopeProgress = doorSide === 'west' ? 
                                (x - minX) / (totalLength) : 
                                (maxX - x) / (totalLength);
                            const roofX = Math.floor(slopeProgress * 2); // 0, 1, or 2
                            inRoof = roofY === (2 - roofX) && z >= minZ && z <= maxZ;
                        }
                        
                        if (inRoof) {
                            addBlockFn(worldPosX, worldPosY, worldPosZ, floorMaterial, true);
                        }
                    }
                }
            }
        }
        
        console.log(`✅ House built: ${totalLength}×${totalWidth}×${totalHeight + 2} total exterior, ${interiorLength}×${interiorWidth}×${interiorHeight} interior walkable space`);
    }
}
