/**
 * ChunkRenderManager.js - Clean LOD and Visibility System
 *
 * Responsibilities:
 * - Pull cached chunks from storage
 * - Apply LOD rules based on distance
 * - Manage frustum culling and visibility
 * - Prepare chunks for rendering based on player position and GPU tier
 *
 * Architecture:
 * - Tier 0: Full detail (interactive chunks) - 0 to renderDistance
 * - Tier 1: Simplified geometry (LOD chunks) - renderDistance+1 to renderDistance+visualDistance
 * - Tier 2: Billboards (far chunks) - beyond visualDistance (future)
 */

import * as THREE from 'three';

export class ChunkRenderManager {
    constructor(app) {
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;

        // Visible chunk tracking
        this.visibleChunks = new Map(); // Tier 0: Full detail chunks
        this.lodChunks = new Map();     // Tier 1: Simplified chunks
        this.billboardChunks = new Map(); // Tier 2: Far billboards (future)

        // Render settings
        this.maxRenderDistance = 3;     // Full detail distance
        this.maxVisualDistance = 1;     // LOD distance beyond render
        this.maxBillboardDistance = 2;  // Billboard distance (future)

        // 🚀 Vertical rendering optimization settings
        this.verticalCullingEnabled = false;    // Enable Y-axis depth limiting
        this.enableVerticalHeightLimit = false; // Optional upward height limit
        this.undergroundDepth = 2;              // Blocks below player's feet to render
        this.abovegroundHeight = 8;             // Blocks above player (when height limit enabled)
        this.playerHeight = 1.7;                // Player height in blocks
        this.currentPlayerY = null;             // Track current player Y position

        // GPU tier settings (auto-detected)
        this.gpuTier = 'medium'; // 'low', 'medium', 'high'
        this.applyGPUTierSettings();

        // Frustum for culling
        this.frustum = new THREE.Frustum();
        this.frustumMatrix = new THREE.Matrix4();

        // Performance tracking
        this.stats = {
            tier0Chunks: 0,
            tier1Chunks: 0,
            tier2Chunks: 0,
            culledChunks: 0
        };

        console.log('🎨 ChunkRenderManager initialized');
    }

    /**
     * Apply GPU-specific settings
     */
    applyGPUTierSettings() {
        switch (this.gpuTier) {
            case 'low':
                this.maxRenderDistance = 1;
                this.maxVisualDistance = 1;
                this.maxBillboardDistance = 0;
                break;
            case 'medium':
                this.maxRenderDistance = 2;
                this.maxVisualDistance = 1;
                this.maxBillboardDistance = 1;
                break;
            case 'high':
                this.maxRenderDistance = 3;
                this.maxVisualDistance = 2;
                this.maxBillboardDistance = 2;
                break;
        }
        console.log(`🎮 GPU Tier: ${this.gpuTier} - Render: ${this.maxRenderDistance}, LOD: ${this.maxVisualDistance}`);
    }

    /**
     * Main update loop - called every frame
     */
    update(playerChunkX, playerChunkZ, playerY = null) {
        // Store player Y position for vertical culling
        this.currentPlayerY = playerY;

        // Update frustum for culling
        this.frustumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);

        // Get camera direction for directional culling
        const cameraForward = new THREE.Vector3();
        this.camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;
        cameraForward.normalize();

        // Reset stats
        this.stats = { tier0Chunks: 0, tier1Chunks: 0, tier2Chunks: 0, culledChunks: 0 };

        // Track which chunks should exist at each tier
        const shouldExist = {
            tier0: new Set(),
            tier1: new Set(),
            tier2: new Set()
        };

        // Scan area around player
        const maxDist = this.maxRenderDistance + this.maxVisualDistance + this.maxBillboardDistance;

        for (let cx = playerChunkX - maxDist; cx <= playerChunkX + maxDist; cx++) {
            for (let cz = playerChunkZ - maxDist; cz <= playerChunkZ + maxDist; cz++) {
                const dist = Math.max(Math.abs(cx - playerChunkX), Math.abs(cz - playerChunkZ));

                // Determine LOD tier based on distance
                const lod = this.determineLOD(dist);

                if (lod === -1) continue; // Too far, skip

                // Directional culling (skip chunks behind camera)
                const chunkDir = new THREE.Vector3(
                    (cx - playerChunkX),
                    0,
                    (cz - playerChunkZ)
                ).normalize();

                const dot = chunkDir.dot(cameraForward);

                // Skip chunks behind camera (but be less aggressive than before)
                if (dot < -0.3) {
                    this.stats.culledChunks++;
                    continue;
                }

                const chunkKey = `${cx},${cz}`;

                // Add to appropriate tier
                if (lod === 0) {
                    shouldExist.tier0.add(chunkKey);
                } else if (lod === 1) {
                    shouldExist.tier1.add(chunkKey);
                } else if (lod === 2) {
                    shouldExist.tier2.add(chunkKey);
                }
            }
        }

        // Update Tier 0 (full detail) - handled by main The Long Nights
        this.stats.tier0Chunks = shouldExist.tier0.size;

        // Update Tier 1 (LOD chunks) - use existing LOD manager
        if (this.app.lodManager) {
            // Let LOD manager handle tier 1
            this.stats.tier1Chunks = this.app.lodManager.lodChunks.size;
        }

        // Update Tier 2 (billboards) - future implementation
        this.stats.tier2Chunks = shouldExist.tier2.size;
    }

    /**
     * Determine LOD tier based on distance
     * @returns {number} -1 = too far, 0 = full detail, 1 = simplified, 2 = billboard
     */
    determineLOD(distance) {
        if (distance <= this.maxRenderDistance) {
            return 0; // Tier 0: Full detail
        } else if (distance <= this.maxRenderDistance + this.maxVisualDistance) {
            return 1; // Tier 1: Simplified LOD
        } else if (distance <= this.maxRenderDistance + this.maxVisualDistance + this.maxBillboardDistance) {
            return 2; // Tier 2: Billboard (future)
        } else {
            return -1; // Too far
        }
    }

    /**
     * Check if chunk is visible in frustum
     */
    isChunkVisible(chunkX, chunkZ) {
        const chunkSize = this.app.chunkSize;
        const worldX = chunkX * chunkSize;
        const worldZ = chunkZ * chunkSize;

        // Calculate Y bounds based on player position and settings
        let minY = 0;
        let maxY = 32;

        if (this.enableVerticalCulling && this.currentPlayerY !== null) {
            // Calculate player's feet position
            const playerFeetY = this.currentPlayerY - this.playerHeight;

            // Underground culling: only render blocks up to N blocks below player's feet
            minY = Math.max(0, Math.floor(playerFeetY - this.undergroundDepth));

            // Optional upward height limiting
            if (this.enableVerticalHeightLimit) {
                maxY = Math.ceil(playerFeetY + this.abovegroundHeight);
            }

            // Ensure we don't go below bedrock or above reasonable limits
            minY = Math.max(0, minY);
            maxY = Math.min(64, maxY);
        }

        // Create bounding box for chunk with calculated Y bounds
        const box = new THREE.Box3(
            new THREE.Vector3(worldX, minY, worldZ),
            new THREE.Vector3(worldX + chunkSize, maxY, worldZ + chunkSize)
        );

        return this.frustum.intersectsBox(box);
    }

    /**
     * Set GPU tier (adjusts quality settings)
     */
    setGPUTier(tier) {
        this.gpuTier = tier;
        this.applyGPUTierSettings();
    }

    /**
     * 🚀 Configure vertical rendering optimization
     * @param {boolean} enableCulling - Enable Y-axis depth limiting
     * @param {boolean} enableHeightLimit - Enable upward height limit (optional)
     * @param {number} undergroundDepth - Blocks below player's feet to render (default: 2)
     * @param {number} abovegroundHeight - Blocks above player when height limit enabled (default: 8)
     */
    setVerticalCulling(enableCulling = true, enableHeightLimit = false, undergroundDepth = 2, abovegroundHeight = 8) {
        this.verticalCullingEnabled = enableCulling;
        this.enableVerticalHeightLimit = enableHeightLimit;
        this.undergroundDepth = Math.max(1, undergroundDepth); // At least 1 block below
        this.abovegroundHeight = Math.max(3, abovegroundHeight); // At least 3 blocks above

        console.log(`🎯 Vertical Culling: ${enableCulling ? 'ENABLED' : 'DISABLED'}`);
        if (enableCulling) {
            console.log(`   📉 Underground depth: ${this.undergroundDepth} blocks below feet`);
            console.log(`   📈 Height limit: ${enableHeightLimit ? `${this.abovegroundHeight} blocks above` : 'DISABLED'}`);
        }
    }

    /**
     * 🎯 Get current vertical bounds for block filtering
     * @returns {Object|null} Current vertical bounds or null if disabled
     */
    getVerticalBounds() {
        if (!this.verticalCullingEnabled || this.currentPlayerY === null) {
            return null;
        }

        const playerY = this.currentPlayerY;
        const minY = playerY - this.undergroundDepth;
        const maxY = this.enableVerticalHeightLimit ? 
            playerY + this.abovegroundHeight : 
            32; // Default world height

        return { minY, maxY };
    }

    /**
     * 🔄 Update visibility of existing blocks based on current vertical bounds
     * @param {Object} world - VoxelWorld.world object containing all blocks
     * @param {THREE.Scene} scene - Three.js scene for adding/removing meshes
     */
    updateExistingBlocksVisibility(world, scene) {
        if (!this.verticalCullingEnabled) {
            // If culling disabled, make sure all blocks are visible
            for (const [key, blockData] of Object.entries(world)) {
                if (blockData.mesh && !blockData.rendered) {
                    scene.add(blockData.mesh);
                    blockData.rendered = true;
                }
                if (blockData.billboard && !blockData.rendered) {
                    scene.add(blockData.billboard);
                }
            }
            return;
        }

        const bounds = this.getVerticalBounds();
        if (!bounds) return;

        let blocksHidden = 0;
        let blocksShown = 0;

        for (const [key, blockData] of Object.entries(world)) {
            const coords = key.split(',').map(Number);
            const y = coords[1];

            const shouldRender = y >= bounds.minY && y <= bounds.maxY;
            
            // Initialize rendered property if missing (for existing blocks)
            if (blockData.rendered === undefined) {
                blockData.rendered = blockData.mesh && blockData.mesh.parent === scene;
            }

            // Update visibility if it changed
            if (shouldRender && !blockData.rendered && blockData.mesh) {
                scene.add(blockData.mesh);
                if (blockData.billboard) {
                    scene.add(blockData.billboard);
                }
                blockData.rendered = true;
                blocksShown++;
            } else if (!shouldRender && blockData.rendered && blockData.mesh) {
                scene.remove(blockData.mesh);
                if (blockData.billboard) {
                    scene.remove(blockData.billboard);
                }
                blockData.rendered = false;
                blocksHidden++;
            }
        }

        if (blocksHidden > 0 || blocksShown > 0) {
            console.log(`🎯 Vertical culling: ${blocksHidden} blocks hidden, ${blocksShown} blocks shown`);
        }
    }

    /**
     * Get render stats
     */
    getStats() {
        return {
            ...this.stats,
            gpuTier: this.gpuTier,
            maxRenderDistance: this.maxRenderDistance,
            maxVisualDistance: this.maxVisualDistance,
            verticalCulling: this.verticalCullingEnabled,
            verticalHeightLimit: this.enableVerticalHeightLimit,
            undergroundDepth: this.undergroundDepth,
            abovegroundHeight: this.abovegroundHeight
        };
    }
}
