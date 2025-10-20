/**
 * MountainDetector.js
 * 
 * Scans the world for mountain plateaus (5-6+ blocks of stone)
 * and identifies them as candidates for hollow mountain generation.
 * 
 * Phase 1: Detection (this file)
 * - Scan chunks for tall stone formations
 * - Mark mountain centers and boundaries
 * - Store mountain metadata for dungeon generation
 * 
 * Phase 2: Hollowing (future)
 * - Replace interior with bedrock shell
 * - Create gateway entrance
 * - Generate dungeon inside
 */

export class MountainDetector {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        
        // Detected mountains (Map: chunkKey → mountainData)
        this.detectedMountains = new Map();
        
        // Configuration - mountains are tall vertical stone pillars/formations (15-20+ blocks)
        this.config = {
            minMountainHeight: 15,       // Minimum height for mountain detection (tall stone formations)
            minStoneDepth: 8,            // Minimum consecutive stone blocks (thick stone columns)
            scanRadius: 16,              // Scan area around player (in blocks)
            minMountainRadius: 8,        // Minimum mountain footprint
            debounceTime: 5000           // 5 seconds between scans
        };
        
        this.lastScanTime = 0;
        this.isScanning = false;
        
        console.log('🏔️ MountainDetector initialized');
    }
    
    /**
     * Update - called each frame from VoxelWorld
     */
    update(deltaTime) {
        // Debounce scanning (only scan every 5 seconds)
        const now = Date.now();
        if (now - this.lastScanTime < this.config.debounceTime) {
            return;
        }
        
        if (!this.isScanning && this.voxelWorld.player) {
            this.scanNearbyPlayer();
        }
    }
    
    /**
     * Scan for mountains near player position
     */
    async scanNearbyPlayer() {
        if (!this.voxelWorld.player || !this.voxelWorld.player.position) {
            return;
        }
        
        this.isScanning = true;
        this.lastScanTime = Date.now();
        
        const playerX = Math.floor(this.voxelWorld.player.position.x);
        const playerZ = Math.floor(this.voxelWorld.player.position.z);
        
        console.log(`🔍 Scanning for mountains near player (${playerX}, ${playerZ})...`);
        
        // Scan chunks in a grid around player
        const chunkSize = 16;
        const scanRadiusChunks = Math.ceil(this.config.scanRadius / chunkSize);
        
        const playerChunkX = Math.floor(playerX / chunkSize);
        const playerChunkZ = Math.floor(playerZ / chunkSize);
        
        let foundCount = 0;
        
        for (let cz = -scanRadiusChunks; cz <= scanRadiusChunks; cz++) {
            for (let cx = -scanRadiusChunks; cx <= scanRadiusChunks; cx++) {
                const chunkX = playerChunkX + cx;
                const chunkZ = playerChunkZ + cz;
                const chunkKey = `${chunkX},${chunkZ}`;
                
                // Skip if already scanned
                if (this.detectedMountains.has(chunkKey)) {
                    continue;
                }
                
                // Scan this chunk for mountain formation
                const mountainData = this.scanChunkForMountain(chunkX, chunkZ);
                
                if (mountainData) {
                    this.detectedMountains.set(chunkKey, mountainData);
                    foundCount++;
                    
                    console.log(`⛰️ MOUNTAIN FOUND in chunk (${chunkX}, ${chunkZ}):`, {
                        center: mountainData.center,
                        height: mountainData.height,
                        radius: mountainData.radius,
                        stoneDepth: mountainData.stoneDepth
                    });
                }
            }
        }
        
        if (foundCount > 0) {
            console.log(`🏔️ Scan complete: Found ${foundCount} new mountains (${this.detectedMountains.size} total)`);
        }
        
        this.isScanning = false;
    }
    
    /**
     * Scan a specific chunk for mountain formation
     * Returns mountain data if found, null otherwise
     */
    scanChunkForMountain(chunkX, chunkZ) {
        const chunkSize = 16;
        const baseX = chunkX * chunkSize;
        const baseZ = chunkZ * chunkSize;
        
        // Sample points in chunk (every 4 blocks to reduce overhead)
        let maxHeight = 0;
        let maxHeightPos = null;
        let stoneCount = 0;
        let totalSamples = 0;
        
        for (let z = 0; z < chunkSize; z += 4) {
            for (let x = 0; x < chunkSize; x += 4) {
                const worldX = baseX + x;
                const worldZ = baseZ + z;
                
                // Get terrain height at this position
                const surfaceY = this.voxelWorld.getTerrainHeight?.(worldX, worldZ);
                if (!surfaceY) continue;
                
                totalSamples++;
                
                // Track highest point
                if (surfaceY > maxHeight) {
                    maxHeight = surfaceY;
                    maxHeightPos = { x: worldX, y: surfaceY, z: worldZ };
                }
                
                // Check if this is a tall stone formation
                if (surfaceY >= this.config.minMountainHeight) {
                    // Sample blocks below surface to check for stone depth
                    const stoneDepth = this.getStoneDepth(worldX, surfaceY, worldZ);
                    
                    if (stoneDepth >= this.config.minStoneDepth) {
                        stoneCount++;
                    }
                }
            }
        }
        
        // Calculate percentage of chunk that's mountain
        const mountainPercentage = totalSamples > 0 ? (stoneCount / totalSamples) : 0;
        
        // Chunk is a mountain if:
        // 1. Max height is above threshold
        // 2. At least 25% of samples are tall stone formations
        if (maxHeight >= this.config.minMountainHeight && mountainPercentage >= 0.25) {
            // Estimate mountain radius (very rough!)
            const estimatedRadius = Math.sqrt(stoneCount * 16); // Approximate
            
            return {
                chunkX,
                chunkZ,
                center: maxHeightPos,
                height: maxHeight,
                radius: Math.max(this.config.minMountainRadius, estimatedRadius),
                stoneDepth: this.config.minStoneDepth,
                mountainPercentage: mountainPercentage.toFixed(2),
                scannedAt: Date.now()
            };
        }
        
        return null;
    }
    
    /**
     * Get depth of consecutive stone blocks below a position
     */
    getStoneDepth(x, y, z) {
        let depth = 0;
        
        // Scan downward from surface
        for (let checkY = y; checkY > Math.max(0, y - 15); checkY--) {
            const block = this.voxelWorld.getBlock?.(x, checkY, z);
            
            if (block === 'stone' || block === 'grass' || block === 'dirt') {
                depth++;
            } else {
                break; // Hit air or different block type
            }
        }
        
        return depth;
    }
    
    /**
     * Get all detected mountains
     */
    getAllMountains() {
        return Array.from(this.detectedMountains.values());
    }
    
    /**
     * Get mountain at specific chunk
     */
    getMountainAt(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        return this.detectedMountains.get(key);
    }
    
    /**
     * Find nearest mountain to a position
     */
    findNearestMountain(worldX, worldZ) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const mountain of this.detectedMountains.values()) {
            const dx = mountain.center.x - worldX;
            const dz = mountain.center.z - worldZ;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = mountain;
            }
        }
        
        return nearest ? { mountain: nearest, distance: nearestDist } : null;
    }
    
    /**
     * Debug: Get detection stats
     */
    getStats() {
        return {
            totalDetected: this.detectedMountains.size,
            lastScanTime: this.lastScanTime,
            isScanning: this.isScanning,
            config: this.config
        };
    }
    
    /**
     * Debug: Clear all detected mountains (for testing)
     */
    clear() {
        this.detectedMountains.clear();
        console.log('🗑️ Cleared all detected mountains');
    }
}
