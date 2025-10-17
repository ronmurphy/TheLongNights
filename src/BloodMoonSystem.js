/**
 * BloodMoonSystem.js
 * 
 * Manages blood moon enemy spawning and AI behavior.
 * Spawns waves of enemies during blood moons (Day 7, 10pm-2am).
 * Enemies move towards player and attack fortifications.
 */

import * as THREE from 'three';

export class BloodMoonSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.scene = voxelWorld.scene;
        
        // Enemy tracking
        this.activeEnemies = new Map(); // Map<enemyId, enemyData>
        this.nextEnemyId = 0;
        
        // Entity data (loaded from entities.json)
        this.entityDatabase = null;
        this.loadEntityData();
        
        // Animation timing
        this.time = 0;
        this.lastUpdateTime = Date.now();
        
        // Spawn config
        this.config = {
            spawnDistance: 30,       // Blocks away from player
            spawnDistanceVariation: 10, // Random variation (+/- blocks)
            spawnHeight: 1,          // Height above ground
            
            // Animation
            animationSpeed: 2.0,     // Speed of animation cycle (crawler push-ups)
            crawlSpeed: 0.15,        // Blocks per second (VERY SLOW - no legs! Relentless but slow)
            
            // AI
            attackRange: 2,          // Blocks - distance to start attacking
            attackDamage: 5,         // Damage per attack
            attackCooldown: 2000,    // Milliseconds between attacks
        };
        
        // Animation loop (60 FPS)
        this.animationInterval = setInterval(() => this.updateEnemies(), 16); // ~60 FPS
        
        console.log('🩸 BloodMoonSystem initialized');
    }
    
    /**
     * Load entity data from entities.json
     */
    async loadEntityData() {
        try {
            const response = await fetch('art/entities/entities.json');
            const data = await response.json();
            this.entityDatabase = data;
            console.log('🩸 Entity database loaded:', Object.keys(data).length, 'categories');
        } catch (error) {
            console.error('🩸 Failed to load entities.json:', error);
        }
    }
    
    /**
     * Get entity data by ID
     */
    getEntityData(entityId) {
        if (!this.entityDatabase) {
            console.warn('🩸 Entity database not loaded yet');
            return null;
        }
        
        // Search through all categories (monsters, companions, etc.)
        for (const category in this.entityDatabase) {
            if (this.entityDatabase[category][entityId]) {
                return this.entityDatabase[category][entityId];
            }
        }
        
        console.warn(`🩸 Entity "${entityId}" not found in database`);
        return null;
    }
    
    /**
     * Spawn blood moon enemies based on current week
     */
    spawnEnemies(week) {
        // Check if entity database is loaded
        if (!this.entityDatabase) {
            console.warn('🩸 Cannot spawn enemies - entity database not loaded yet. Retrying in 100ms...');
            setTimeout(() => this.spawnEnemies(week), 100);
            return;
        }
        
        // Calculate enemy count based on week (10 + 10 per week)
        const enemyCount = 10 + (week * 10);
        const maxEnemies = 100; // Cap at 100
        const finalCount = Math.min(enemyCount, maxEnemies);
        
        console.log(`🩸 Spawning ${finalCount} zombie crawlers for Week ${week}...`);
        
        // Get player position (same as Animal system)
        const playerPos = this.voxelWorld.player.position;
        console.log(`🩸 Player position: (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}, ${playerPos.z.toFixed(1)})`);
        
        // Spawn enemies in a circle around player
        for (let i = 0; i < finalCount; i++) {
            // Random angle around player
            const angle = (Math.PI * 2 * i) / finalCount + (Math.random() * 0.5 - 0.25);
            const distance = this.config.spawnDistance + Math.random() * this.config.spawnDistanceVariation;
            
            const x = playerPos.x + Math.cos(angle) * distance;
            const z = playerPos.z + Math.sin(angle) * distance;
            
            // Get ground height at spawn location
            const y = this.voxelWorld.getGroundHeight(x, z) + this.config.spawnHeight;
            
            console.log(`🩸 Attempting to spawn zombie ${i+1}/${finalCount} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
            
            // Spawn zombie crawler (only enemy type for now)
            const enemy = this.spawnEnemy('zombie_crawler', x, y, z);
            if (enemy) {
                console.log(`✅ Zombie ${i+1} spawned successfully`);
            } else {
                console.error(`❌ Failed to spawn zombie ${i+1}`);
            }
        }
        
        console.log(`🩸 Spawned ${this.activeEnemies.size} enemies`);
    }
    
    /**
     * Spawn individual enemy
     */
    spawnEnemy(entityId, x, y, z) {
        console.log(`🩸 spawnEnemy called: ${entityId} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
        
        // Load enemy data from entities.json
        const entityData = this.getEntityData(entityId);
        
        if (!entityData) {
            console.warn(`🩸 Enemy type "${entityId}" not found in entities.json`);
            return null;
        }
        
        console.log(`🩸 Entity data found:`, entityData);
        
        // Load textures for animation (ready_pose and attack_pose)
        // Note: Textures load asynchronously, so we don't validate them here
        console.log(`🩸 Loading textures: ${entityData.sprite_ready}, ${entityData.sprite_attack}`);
        const readyTexture = this.loadEntityTexture(entityData.sprite_ready);
        const attackTexture = this.loadEntityTexture(entityData.sprite_attack);
        
        // Create sprite material with ready pose
        const material = new THREE.SpriteMaterial({
            map: readyTexture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 1.5, 1); // Size
        sprite.position.set(x, y, z);
        
        // Add to scene
        this.scene.add(sprite);
        
        // Create enemy data
        const enemyId = `bloodmoon_${this.nextEnemyId++}`;
        const enemyData = {
            id: enemyId,
            entityType: entityId,
            sprite: sprite,
            readyTexture: readyTexture,
            attackTexture: attackTexture,
            
            // Stats from entities.json
            health: entityData.hp,
            maxHealth: entityData.hp,
            attack: entityData.attack,
            defense: entityData.defense,
            speed: entityData.speed * 0.01, // Convert to blocks/frame (speed=2 → 0.02 blocks/frame)
            
            // AI state
            target: { 
                x: this.voxelWorld.player.position.x, 
                y: this.voxelWorld.player.position.y, 
                z: this.voxelWorld.player.position.z 
            },
            lastAttackTime: 0,
            
            // Animation state
            animationTime: Math.random() * Math.PI * 2, // Random start time for variation
        };
        
        this.activeEnemies.set(enemyId, enemyData);
        
        return enemyData;
    }
    
    /**
     * Load entity texture from assets
     * Uses EnhancedGraphics for proper texture loading with filters
     */
    loadEntityTexture(spriteName) {
        // Use EnhancedGraphics like the Animal system does
        // This ensures proper texture filters and loading
        const texturePath = `entities/${spriteName}`;
        return this.voxelWorld.enhancedGraphics.loadEntityTexture(texturePath);
    }
    
    /**
     * Update all enemies (movement, animation, attacks)
     */
    updateEnemies() {
        if (this.activeEnemies.size === 0) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Seconds
        this.lastUpdateTime = now;
        this.time += deltaTime;
        
        // Update player position (target) - same as Animal system
        const playerPos = this.voxelWorld.player.position;
        
        // Update each enemy
        for (const [enemyId, enemy] of this.activeEnemies) {
            // Check if dead
            if (enemy.health <= 0) {
                this.removeEnemy(enemyId);
                continue;
            }
            
            // Calculate distance to player
            const dx = playerPos.x - enemy.sprite.position.x;
            const dz = playerPos.z - enemy.sprite.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Update animation time
            enemy.animationTime += deltaTime * this.config.animationSpeed;
            
            // Animate between ready pose and attack pose (crawling push-ups!)
            // sin wave oscillates between -1 and 1, map to 0-1 for texture blend
            const animPhase = (Math.sin(enemy.animationTime) + 1) / 2;
            
            // Switch texture based on animation phase
            if (animPhase < 0.5) {
                // Ready pose (pushing up)
                if (enemy.sprite.material.map !== enemy.readyTexture) {
                    enemy.sprite.material.map = enemy.readyTexture;
                    enemy.sprite.material.needsUpdate = true;
                }
            } else {
                // Attack pose (dragging forward)
                if (enemy.sprite.material.map !== enemy.attackTexture) {
                    enemy.sprite.material.map = enemy.attackTexture;
                    enemy.sprite.material.needsUpdate = true;
                }
            }
            
            // Movement - crawl towards player
            if (distance > this.config.attackRange) {
                // Move towards player (VERY slow crawl - they have no legs!)
                // Use deltaTime to make it frame-rate independent
                const crawlSpeed = this.config.crawlSpeed * deltaTime;
                const moveX = (dx / distance) * crawlSpeed;
                const moveZ = (dz / distance) * crawlSpeed;
                
                enemy.sprite.position.x += moveX;
                enemy.sprite.position.z += moveZ;
                
                // Update Y to follow terrain
                enemy.sprite.position.y = this.voxelWorld.getGroundHeight(
                    enemy.sprite.position.x, 
                    enemy.sprite.position.z
                ) + this.config.spawnHeight;
                
            } else {
                // In attack range - attack!
                if (now - enemy.lastAttackTime > this.config.attackCooldown) {
                    this.attemptAttack(enemy);
                    enemy.lastAttackTime = now;
                }
            }
        }
        
        // Check if all enemies defeated
        if (this.activeEnemies.size === 0 && this.voxelWorld.dayNightCycle.bloodMoonActive) {
            this.voxelWorld.updateStatus('🩸 All blood moon enemies defeated! Bonus +50 XP', 'success');
            console.log('🩸 All enemies defeated!');
        }
    }
    
    /**
     * Enemy attacks player or nearest fortification
     */
    attemptAttack(enemy) {
        const enemyPos = enemy.sprite.position;
        
        // Find nearest player-placed block within range
        const nearestBlock = this.findNearestPlayerBlock(enemyPos);
        
        if (nearestBlock) {
            // Attack block
            const blockKey = `${nearestBlock.x},${nearestBlock.y},${nearestBlock.z}`;
            console.log(`🩸 ${enemy.entityType} attacking block at ${blockKey}`);
            
            // TODO: Implement block damage system
            // For now, just log the attack
            // this.voxelWorld.damageBlock(nearestBlock.x, nearestBlock.y, nearestBlock.z, enemy.attack);
            
        } else {
            // No fortifications nearby - attack player
            console.log(`🩸 ${enemy.entityType} attacking player!`);
            
            // TODO: Implement player damage system
            // For now, just show a warning
            this.voxelWorld.updateStatus(`🩸 ${enemy.entityType} hits you for ${enemy.attack} damage!`, 'danger');
        }
    }
    
    /**
     * Find nearest player-placed block within attack range
     */
    findNearestPlayerBlock(position) {
        let nearest = null;
        let minDistance = this.config.attackRange;
        
        // Check modified blocks for player-placed blocks
        for (const [key, blockData] of this.voxelWorld.modifiedBlocks) {
            // Skip removed blocks (null)
            if (blockData === null) continue;
            
            const [x, y, z] = key.split(',').map(Number);
            
            // Calculate distance
            const dx = x - position.x;
            const dy = y - position.y;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { x, y, z, type: blockData };
            }
        }
        
        return nearest;
    }
    
    /**
     * Remove enemy from scene
     */
    removeEnemy(enemyId) {
        const enemy = this.activeEnemies.get(enemyId);
        if (!enemy) return;
        
        // Remove sprite from scene
        this.scene.remove(enemy.sprite);
        
        // Dispose of textures and materials
        if (enemy.sprite.material) {
            if (enemy.sprite.material.map) enemy.sprite.material.map.dispose();
            enemy.sprite.material.dispose();
        }
        
        if (enemy.readyTexture) enemy.readyTexture.dispose();
        if (enemy.attackTexture) enemy.attackTexture.dispose();
        
        // Remove from active enemies
        this.activeEnemies.delete(enemyId);
        
        console.log(`🩸 Removed enemy ${enemyId} (${this.activeEnemies.size} remaining)`);
    }
    
    /**
     * Clean up all enemies (called when blood moon ends or player sleeps)
     */
    cleanup() {
        console.log(`🩸 Cleaning up ${this.activeEnemies.size} enemies...`);
        
        // Remove all enemies
        const enemyIds = Array.from(this.activeEnemies.keys());
        for (const enemyId of enemyIds) {
            this.removeEnemy(enemyId);
        }
        
        console.log('🩸 Blood moon enemies cleaned up');
    }
    
    /**
     * Dispose of blood moon system
     */
    dispose() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        this.cleanup();
        console.log('🩸 BloodMoonSystem disposed');
    }
}
