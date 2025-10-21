/**
 * MapManager.js
 * Manages multiple map instances (overworld, dungeons, etc.)
 * Handles map switching, loading, and unloading
 */

export class MapManager {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.maps = new Map(); // mapId → mapData
        this.currentMapId = 'overworld';
        this.previousMapId = null;
        
        // Initialize overworld as default map
        this.maps.set('overworld', {
            id: 'overworld',
            type: 'overworld',
            chunks: this.voxelWorld.chunks,
            playerSpawn: { x: 0, y: 70, z: 0 },
            returnPoint: null
        });
        
        console.log('🗺️ MapManager initialized');
    }
    
    /**
     * Create a new dungeon instance
     * @param {string} dungeonId - Unique dungeon identifier
     * @param {number} tier - Dungeon difficulty tier (1-5)
     * @param {object} entrancePos - Position in overworld where player entered
     */
    createDungeon(dungeonId, tier, entrancePos) {
        const mapData = {
            id: dungeonId,
            type: 'dungeon',
            tier: tier,
            chunks: new Map(), // Fresh chunk map for dungeon
            playerSpawn: { x: 0, y: 10, z: 0 }, // Start position in dungeon
            returnPoint: entrancePos, // Where to return player in overworld
            generated: false,
            rooms: [],
            enemies: []
        };
        
        this.maps.set(dungeonId, mapData);
        console.log(`🏔️ Created dungeon: ${dungeonId} (Tier ${tier})`);
        
        return mapData;
    }
    
    /**
     * Switch to a different map
     * @param {string} targetMapId - Map to switch to
     */
    switchMap(targetMapId) {
        if (!this.maps.has(targetMapId)) {
            console.error(`❌ Map not found: ${targetMapId}`);
            return false;
        }
        
        const previousMap = this.maps.get(this.currentMapId);
        const targetMap = this.maps.get(targetMapId);
        
        console.log(`🚪 Switching map: ${this.currentMapId} → ${targetMapId}`);
        
        // Save current map state
        this.saveMapState(previousMap);
        
        // Unload current map chunks
        this.unloadMap(this.currentMapId);
        
        // Load target map
        this.loadMap(targetMapId);
        
        // Update current map
        this.previousMapId = this.currentMapId;
        this.currentMapId = targetMapId;
        
        // Move player to spawn point
        this.voxelWorld.player.position.set(
            targetMap.playerSpawn.x,
            targetMap.playerSpawn.y,
            targetMap.playerSpawn.z
        );
        
        // Reset camera
        if (this.voxelWorld.camera) {
            this.voxelWorld.camera.position.copy(this.voxelWorld.player.position);
        }
        
        console.log(`✅ Now in map: ${targetMapId}`);
        return true;
    }
    
    /**
     * Save current map state (enemies, modified blocks, etc.)
     */
    saveMapState(mapData) {
        if (mapData.type === 'overworld') {
            // Overworld chunks already stored in voxelWorld.chunks
            mapData.chunks = this.voxelWorld.chunks;
        } else if (mapData.type === 'dungeon') {
            // Save dungeon chunks
            mapData.chunks = new Map(this.voxelWorld.chunks);
            
            // Save enemy positions if roaming enemy system exists
            if (this.voxelWorld.roamingEnemySystem) {
                mapData.enemies = Array.from(
                    this.voxelWorld.roamingEnemySystem.enemies.values()
                );
            }
        }
    }
    
    /**
     * Unload map (clear chunks, remove entities)
     */
    unloadMap(mapId) {
        const mapData = this.maps.get(mapId);
        if (!mapData) return;
        
        // Clear all chunks from scene
        this.voxelWorld.chunks.forEach((chunk) => {
            if (chunk.mesh) {
                this.voxelWorld.scene.remove(chunk.mesh);
                chunk.mesh.geometry.dispose();
                chunk.mesh.material.dispose();
            }
        });
        
        // Clear enemies
        if (this.voxelWorld.roamingEnemySystem) {
            this.voxelWorld.roamingEnemySystem.enemies.clear();
        }
        
        console.log(`🗑️ Unloaded map: ${mapId}`);
    }
    
    /**
     * Load map (restore chunks, spawn entities)
     */
    loadMap(mapId) {
        const mapData = this.maps.get(mapId);
        if (!mapData) return;
        
        if (mapData.type === 'overworld') {
            // Restore overworld chunks
            this.voxelWorld.chunks = mapData.chunks;
            
            // Re-render visible chunks around player
            const playerChunkX = Math.floor(mapData.playerSpawn.x / this.voxelWorld.chunkSize);
            const playerChunkZ = Math.floor(mapData.playerSpawn.z / this.voxelWorld.chunkSize);
            
            for (let dx = -3; dx <= 3; dx++) {
                for (let dz = -3; dz <= 3; dz++) {
                    const chunkKey = `${playerChunkX + dx},${playerChunkZ + dz}`;
                    const chunk = this.voxelWorld.chunks.get(chunkKey);
                    if (chunk) {
                        this.voxelWorld.renderChunk(chunk);
                    }
                }
            }
        } else if (mapData.type === 'dungeon') {
            // Load dungeon
            if (!mapData.generated) {
                // Generate dungeon for first time
                this.voxelWorld.dungeonGenerator.generate(mapData);
                mapData.generated = true;
            } else {
                // Restore existing dungeon
                this.voxelWorld.chunks = new Map(mapData.chunks);
                
                // Restore enemies
                if (mapData.enemies && this.voxelWorld.roamingEnemySystem) {
                    mapData.enemies.forEach((enemyData) => {
                        this.voxelWorld.roamingEnemySystem.spawnEnemy(
                            enemyData.type,
                            enemyData.position
                        );
                    });
                }
            }
        }
        
        console.log(`📂 Loaded map: ${mapId}`);
    }
    
    /**
     * Return to previous map (for exiting dungeons)
     */
    returnToPreviousMap() {
        if (!this.previousMapId) {
            console.warn('⚠️ No previous map to return to');
            return false;
        }
        
        return this.switchMap(this.previousMapId);
    }
    
    /**
     * Get current map data
     */
    getCurrentMap() {
        return this.maps.get(this.currentMapId);
    }
    
    /**
     * Check if player is in a dungeon
     */
    isInDungeon() {
        const currentMap = this.getCurrentMap();
        return currentMap && currentMap.type === 'dungeon';
    }
    
    /**
     * Delete a map instance (for cleanup)
     */
    deleteMap(mapId) {
        if (mapId === 'overworld') {
            console.error('❌ Cannot delete overworld map');
            return false;
        }
        
        if (mapId === this.currentMapId) {
            console.error('❌ Cannot delete current map');
            return false;
        }
        
        this.maps.delete(mapId);
        console.log(`🗑️ Deleted map: ${mapId}`);
        return true;
    }
}
