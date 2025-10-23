/**
 * EntityPool.js
 *
 * Object pool for enemy/NPC sprites to reduce garbage collection and improve performance
 *
 * Benefits:
 * - Reuses sprites instead of creating/destroying them repeatedly
 * - Shares textures across all sprites of the same type (massive memory savings)
 * - Reduces GC pauses during intense battles (bloodmoon, spectral hunt)
 * - Faster spawning (no texture loading overhead)
 *
 * Usage:
 * const sprite = entityPool.acquire(entityType, entityData, x, y, z);
 * // ... use sprite ...
 * entityPool.release(sprite); // Return to pool for reuse
 */

import * as THREE from 'three';

export class EntityPool {
    constructor(scene, enhancedGraphics) {
        this.scene = scene;
        this.enhancedGraphics = enhancedGraphics;

        // Pool of inactive sprites ready for reuse (by entity type)
        this.availableSprites = new Map(); // entityType → Array<sprite>

        // Active sprites currently in use
        this.activeSprites = new Set();

        // Shared texture cache (one set of textures per entity type)
        this.textureCache = new Map(); // entityType → {ready, attack, dodge, fallback}

        // Pool limits (prevent infinite growth)
        this.maxPoolSize = 200; // Max 200 pooled sprites total
        this.maxPerType = 50;   // Max 50 sprites per entity type

        console.log('♻️ EntityPool initialized');
    }

    /**
     * Get or create sprite from pool
     * @param {string} entityType - Entity ID (e.g., 'zombie_crawler', 'angry_ghost')
     * @param {object} entityData - Entity data from entities.json
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} z - Spawn Z position
     * @returns {THREE.Sprite} - Ready-to-use sprite
     */
    acquire(entityType, entityData, x, y, z) {
        // Try to get from pool
        let sprite = this.getFromPool(entityType);

        if (!sprite) {
            // Pool empty, create new sprite
            sprite = this.createSprite(entityType, entityData);
            console.log(`♻️ Created new sprite for ${entityType} (pool was empty)`);
        } else {
            console.log(`♻️ Reused sprite from pool for ${entityType}`);
        }

        // Reset sprite state for reuse
        this.resetSprite(sprite, entityData, x, y, z);

        // Mark as active
        this.activeSprites.add(sprite);
        sprite.visible = true;

        // Show hitbox and restore to default layer for raycasting
        if (sprite.userData.hitbox) {
            sprite.userData.hitbox.visible = true;
            sprite.userData.hitbox.layers.set(0); // Restore to default layer for raycasting
        }

        return sprite;
    }

    /**
     * Return sprite to pool for reuse
     * @param {THREE.Sprite} sprite - Sprite to return to pool
     */
    release(sprite) {
        if (!sprite) return;

        // Hide sprite (don't remove from scene - keep it for reuse)
        sprite.visible = false;

        // Hide hitbox and disable raycasting
        if (sprite.userData.hitbox) {
            sprite.userData.hitbox.visible = false;
            sprite.userData.hitbox.layers.set(31); // Move to unused layer to prevent raycasting

            // Clear userData flags so it's not recognized as targetable
            delete sprite.userData.hitbox.userData.isEnemy;
            delete sprite.userData.hitbox.userData.isGhost;
            delete sprite.userData.hitbox.userData.isAnimal;
            delete sprite.userData.hitbox.userData.isFriendly;
        }

        // Clear sprite userData flags too
        delete sprite.userData.isEnemy;
        delete sprite.userData.isGhost;
        delete sprite.userData.isAnimal;
        delete sprite.userData.isFriendly;

        // Remove from active set
        this.activeSprites.delete(sprite);

        // Add to pool for reuse
        const entityType = sprite.userData.entityType;
        if (!entityType) {
            console.warn('⚠️ Sprite missing entityType, cannot pool');
            this.disposeSprite(sprite);
            return;
        }

        if (!this.availableSprites.has(entityType)) {
            this.availableSprites.set(entityType, []);
        }

        const pool = this.availableSprites.get(entityType);

        // Check if pool is full for this type
        if (pool.length < this.maxPerType) {
            pool.push(sprite);
            console.log(`♻️ Returned ${entityType} to pool (${pool.length}/${this.maxPerType})`);
        } else {
            // Pool full for this type, actually dispose
            console.log(`♻️ Pool full for ${entityType}, disposing sprite`);
            this.disposeSprite(sprite);
        }
    }

    /**
     * Get sprite from pool (internal)
     */
    getFromPool(entityType) {
        const pool = this.availableSprites.get(entityType);
        if (!pool || pool.length === 0) {
            return null;
        }

        return pool.pop();
    }

    /**
     * Create new sprite (internal)
     */
    createSprite(entityType, entityData) {
        // Load or get cached textures for this entity type
        const textures = this.getTextures(entityType, entityData);

        // Create sprite material with ready pose
        const material = new THREE.SpriteMaterial({
            map: textures.ready,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
        });

        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 1.5, 1); // Default size (can be overridden)

        // Store entity type for pool management
        sprite.userData.entityType = entityType;

        // Store texture references for animation
        sprite.userData.textures = textures;

        // Create invisible hitbox for reliable raycasting (like ColoredGhostSystem)
        const hitboxRadius = 1.0; // Standard size for most enemies
        const hitboxGeometry = new THREE.SphereGeometry(hitboxRadius, 8, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false, // Invisible visually
            transparent: true,
            opacity: 0
        });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.copy(sprite.position);
        
        // Store hitbox reference in sprite
        sprite.userData.hitbox = hitbox;
        
        // Copy userData to hitbox for raycasting
        hitbox.userData.entityType = entityType;
        hitbox.userData.entitySprite = sprite; // Reference back to sprite

        // Add both to scene
        this.scene.add(sprite);
        this.scene.add(hitbox);
        
        console.log(`♻️ DEBUG: Created hitbox for ${entityType} at (${sprite.position.x.toFixed(1)}, ${sprite.position.y.toFixed(1)}, ${sprite.position.z.toFixed(1)})`);

        return sprite;
    }

    /**
     * Reset sprite state for reuse
     */
    resetSprite(sprite, entityData, x, y, z) {
        // Reset position
        sprite.position.set(x, y, z);
        
        // Reset hitbox position to match sprite
        if (sprite.userData.hitbox) {
            sprite.userData.hitbox.position.copy(sprite.position);
        }

        // Reset scale (some enemies might be bigger/smaller)
        sprite.scale.set(1.5, 1.5, 1);

        // Reset material properties
        sprite.material.opacity = 1.0;
        sprite.material.color.setHex(0xFFFFFF); // Reset to white

        // Switch back to ready pose
        const textures = sprite.userData.textures;
        if (textures && textures.ready) {
            sprite.material.map = textures.ready;
            sprite.material.needsUpdate = true;
        }

        // Reset userData (combat stats, etc.)
        // Clear all identification flags first
        delete sprite.userData.isEnemy;
        delete sprite.userData.isGhost;
        delete sprite.userData.isAnimal;
        delete sprite.userData.isFriendly;
        
        // Set identification flags based on entity type from entities.json OR entity name
        const entityType = entityData.type || 'enemy'; // Default to enemy if no type
        const entityName = sprite.userData.entityType || '';
        
        if (entityType === 'ghost' || entityName.includes('ghost')) {
            sprite.userData.isGhost = true;
            sprite.userData.isEnemy = true; // Ghosts are also enemies (attackable)
        } else if (entityType === 'animal' || entityName.includes('animal')) {
            sprite.userData.isAnimal = true;
        } else if (entityType === 'friendly' || entityType === 'companion') {
            sprite.userData.isFriendly = true;
        } else {
            // All other entities (including Blood Moon enemies) are attackable enemies
            sprite.userData.isEnemy = true;
        }
        
        sprite.userData.type = sprite.userData.entityType;
        sprite.userData.hp = entityData.hp;
        sprite.userData.maxHp = entityData.hp;

        // Copy identification flags to hitbox for raycasting
        if (sprite.userData.hitbox) {
            const hitbox = sprite.userData.hitbox;
            
            // Clear old flags
            delete hitbox.userData.isEnemy;
            delete hitbox.userData.isGhost;
            delete hitbox.userData.isAnimal;
            delete hitbox.userData.isFriendly;
            
            // Copy new flags
            if (sprite.userData.isEnemy) hitbox.userData.isEnemy = true;
            if (sprite.userData.isGhost) hitbox.userData.isGhost = true;
            if (sprite.userData.isAnimal) hitbox.userData.isAnimal = true;
            if (sprite.userData.isFriendly) hitbox.userData.isFriendly = true;
            
            console.log(`♻️ DEBUG: Reset hitbox flags for ${sprite.userData.entityType}, isEnemy: ${!!hitbox.userData.isEnemy}`);
            
            hitbox.userData.type = sprite.userData.type;
            hitbox.userData.hp = sprite.userData.hp;
            hitbox.userData.maxHp = sprite.userData.maxHp;
        }

        // Reset animation state
        sprite.userData.animationTime = Math.random() * Math.PI * 2;
    }

    /**
     * Get or load textures for entity type (cached)
     */
    getTextures(entityType, entityData) {
        // Check cache first
        if (this.textureCache.has(entityType)) {
            return this.textureCache.get(entityType);
        }

        // Load textures (will be shared across all sprites of this type)
        const textures = {
            ready: this.loadTexture(entityData.sprite_ready),
            attack: this.loadTexture(entityData.sprite_attack),
            dodge: entityData.sprite_dodge ? this.loadTexture(entityData.sprite_dodge) : null,
            fallback: entityData.sprite_fallback ? this.loadTexture(entityData.sprite_fallback) : null,
        };

        // Cache for reuse
        this.textureCache.set(entityType, textures);
        console.log(`♻️ Cached textures for ${entityType}`);

        return textures;
    }

    /**
     * Load texture using EnhancedGraphics
     */
    loadTexture(spriteName) {
        if (!spriteName) return null;

        const texturePath = `entities/${spriteName}`;
        return this.enhancedGraphics.loadEntityTexture(texturePath);
    }

    /**
     * Dispose sprite completely (remove from scene and cleanup)
     */
    disposeSprite(sprite) {
        if (!sprite) return;

        // Remove from scene
        this.scene.remove(sprite);
        
        // Remove and dispose hitbox
        if (sprite.userData.hitbox) {
            this.scene.remove(sprite.userData.hitbox);
            sprite.userData.hitbox.geometry.dispose();
            sprite.userData.hitbox.material.dispose();
            sprite.userData.hitbox = null;
        }

        // Dispose material (but NOT textures - they're shared!)
        if (sprite.material) {
            // DON'T dispose map - it's shared in textureCache!
            sprite.material.dispose();
        }

        console.log('♻️ Disposed sprite and hitbox (textures kept in cache)');
    }

    /**
     * Get pool statistics (for debugging)
     */
    getStats() {
        const stats = {
            activeSprites: this.activeSprites.size,
            pooledSprites: 0,
            cachedTextures: this.textureCache.size,
            pools: {}
        };

        for (const [entityType, pool] of this.availableSprites.entries()) {
            stats.pooledSprites += pool.length;
            stats.pools[entityType] = pool.length;
        }

        return stats;
    }

    /**
     * Clear all pooled sprites (called on cleanup)
     */
    clearPool() {
        console.log('♻️ Clearing entity pool...');

        // Dispose all pooled sprites
        for (const [entityType, pool] of this.availableSprites.entries()) {
            for (const sprite of pool) {
                this.disposeSprite(sprite);
            }
        }

        // Clear pool
        this.availableSprites.clear();

        console.log(`♻️ Pool cleared (${this.textureCache.size} textures kept in cache)`);
    }

    /**
     * Full cleanup (called on game shutdown)
     */
    dispose() {
        console.log('♻️ Disposing EntityPool...');

        // Clear pool
        this.clearPool();

        // Dispose all active sprites
        for (const sprite of this.activeSprites) {
            this.disposeSprite(sprite);
        }
        this.activeSprites.clear();

        // Dispose cached textures
        for (const [entityType, textures] of this.textureCache.entries()) {
            if (textures.ready) textures.ready.dispose();
            if (textures.attack) textures.attack.dispose();
            if (textures.dodge) textures.dodge.dispose();
            if (textures.fallback) textures.fallback.dispose();
        }
        this.textureCache.clear();

        console.log('♻️ EntityPool fully disposed');
    }
}
