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
        
        // Progressive spawn tracking (Day 7: Noon to Midnight)
        this.lastSpawnHour = -1;
        this.spawnedThisBloodMoon = false;
        
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
        
        // Animation loop (60 FPS) - only runs during blood moon
        this.animationInterval = null;
        
        console.log('🩸 BloodMoonSystem initialized');
    }
    
    /**
     * Start animation loop (called when blood moon begins)
     */
    startAnimationLoop() {
        if (this.animationInterval) return; // Already running
        
        this.animationInterval = setInterval(() => this.updateEnemies(), 16); // ~60 FPS
        console.log('🩸 Animation loop started');
    }
    
    /**
     * Stop animation loop (called when blood moon ends)
     */
    stopAnimationLoop() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
            console.log('🩸 Animation loop stopped');
        }
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
     * Progressive spawn system - spawns more enemies each hour from Noon to Midnight on Day 7
     * This creates a building sense of panic as the player needs to return to base
     */
    checkProgressiveSpawn(week, currentTime) {
        // Only spawn during Day 7, from 12:00 (noon) to 24:00 (midnight)
        const currentHour = Math.floor(currentTime);
        
        // Check if we're in the spawn window (12:00 to 23:59)
        if (currentHour < 12 || currentHour >= 24) {
            return;
        }
        
        // Check if we already spawned this hour
        if (currentHour === this.lastSpawnHour) {
            return;
        }
        
        // Check if entity database is loaded
        if (!this.entityDatabase) {
            console.warn('🩸 Cannot spawn enemies - entity database not loaded yet. Retrying in 100ms...');
            setTimeout(() => this.checkProgressiveSpawn(week, currentTime), 100);
            return;
        }
        
        // Calculate spawn count based on time of day
        // Noon (12): 2-3 crawlers (warning signs)
        // Afternoon (14-18): 3-5 crawlers per hour (building threat)
        // Evening (19-21): 5-8 crawlers per hour (panic mode)
        // Night (22-23): 8-12 crawlers per hour (peak chaos)
        let spawnCount;
        if (currentHour === 12) {
            spawnCount = 2 + Math.floor(Math.random() * 2); // 2-3
        } else if (currentHour < 19) {
            spawnCount = 3 + Math.floor(Math.random() * 3); // 3-5
        } else if (currentHour < 22) {
            spawnCount = 5 + Math.floor(Math.random() * 4); // 5-8
        } else {
            spawnCount = 8 + Math.floor(Math.random() * 5); // 8-12
        }
        
        // Scale with week difficulty
        spawnCount = Math.floor(spawnCount * (1 + week * 0.3));
        
        // 🌙 PROGRESSIVE SPEED BOOST: As darkness approaches, they get faster!
        // Hour 12 (noon): 1.0x speed (base: 0.15 blocks/sec)
        // Hour 13-23: +0.05x speed per hour compounded
        // Hour 23 (11pm): ~1.7x speed (0.26 blocks/sec)
        // This creates escalating terror as night falls
        const hoursFromNoon = currentHour - 12;
        const speedMultiplier = 1.0 + (hoursFromNoon * 0.05);
        
        console.log(`🩸 Hour ${currentHour}:00 - Spawning ${spawnCount} crawlers (${speedMultiplier.toFixed(2)}x speed)...`);
        
        // Get player position
        const playerPos = this.voxelWorld.player.position;
        
        // Spawn enemies in a circle around player
        for (let i = 0; i < spawnCount; i++) {
            // Random angle around player
            const angle = Math.random() * Math.PI * 2;
            const distance = this.config.spawnDistance + Math.random() * this.config.spawnDistanceVariation;
            
            const x = playerPos.x + Math.cos(angle) * distance;
            const z = playerPos.z + Math.sin(angle) * distance;
            
            // Get ground height at spawn location
            const y = this.voxelWorld.getGroundHeight(x, z) + this.config.spawnHeight;
            
            // Spawn zombie crawler with speed boost
            this.spawnEnemy('zombie_crawler', x, y, z, speedMultiplier);
        }
        
        // Update last spawn hour
        this.lastSpawnHour = currentHour;
        
        console.log(`🩸 Total active enemies: ${this.activeEnemies.size}`);
    }
    
    /**
     * OLD: Spawn all blood moon enemies at once (kept for reference/backwards compatibility)
     */
    spawnEnemiesAllAtOnce(week) {
        // Check if entity database is loaded
        if (!this.entityDatabase) {
            console.warn('🩸 Cannot spawn enemies - entity database not loaded yet. Retrying in 100ms...');
            setTimeout(() => this.spawnEnemiesAllAtOnce(week), 100);
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
     * @param {number} speedMultiplier - Speed boost from time of day (default 1.0)
     */
    spawnEnemy(entityId, x, y, z, speedMultiplier = 1.0) {
        console.log(`🩸 spawnEnemy called: ${entityId} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) [${speedMultiplier.toFixed(2)}x speed]`);
        
        // Start animation loop when first enemy spawns
        if (this.activeEnemies.size === 0) {
            this.startAnimationLoop();
        }
        
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
        
        // 🎯 Zombie crawlers are weak - 1 hit kill (they have no legs!)
        const crawlerHP = entityId === 'zombie_crawler' ? 1 : entityData.hp;
        
        const enemyData = {
            id: enemyId,
            entityType: entityId,
            sprite: sprite,
            readyTexture: readyTexture,
            attackTexture: attackTexture,
            
            // Stats from entities.json
            health: crawlerHP,
            maxHealth: crawlerHP,
            attack: entityData.attack,
            defense: entityData.defense,
            baseSpeed: entityData.speed * 0.01, // Base speed from entities.json
            speedMultiplier: speedMultiplier,    // Time-of-day speed boost
            
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
                // Apply time-of-day speed multiplier (faster as darkness approaches)
                const crawlSpeed = this.config.crawlSpeed * deltaTime * enemy.speedMultiplier;
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
            // No fortifications nearby - attack player or companion
            console.log(`🩸 ${enemy.entityType} attacking!`);
            
            // ⚔️ Use Rule of 3rds damage distribution
            if (this.voxelWorld.companionCombatSystem) {
                const result = this.voxelWorld.companionCombatSystem.distributeEnemyDamage(
                    enemy.attack,
                    enemy.entityType
                );
                console.log(`🩸 ${enemy.entityType} attacked → ${result.target} (${result.actualDamage} damage)`);
            } else {
                // Fallback: Direct player damage
                if (this.voxelWorld.playerHP) {
                    this.voxelWorld.playerHP.takeDamage(enemy.attack);
                }
                this.voxelWorld.updateStatus(`🩸 ${enemy.entityType} hits you for ${enemy.attack} damage!`, 'danger');
            }
        }
    }
    
    /**
     * Find nearest player-placed block within attack range
     * TODO: This needs proper integration with block tracking system
     */
    findNearestPlayerBlock(position) {
        // For now, return null - block damage system not yet implemented
        // This will make zombies go after the player directly
        // Future: integrate with voxelWorld's block tracking system
        return null;
        
        /* PLACEHOLDER for future block damage system:
        let nearest = null;
        let minDistance = this.config.attackRange;
        
        // Check if modifiedBlocks exists and is iterable
        if (this.voxelWorld.modifiedBlocks && 
            typeof this.voxelWorld.modifiedBlocks[Symbol.iterator] === 'function') {
            
            for (const [key, blockData] of this.voxelWorld.modifiedBlocks) {
                if (blockData === null) continue;
                
                const [x, y, z] = key.split(',').map(Number);
                const dx = x - position.x;
                const dy = y - position.y;
                const dz = z - position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = { x, y, z, type: blockData };
                }
            }
        }
        
        return nearest;
        */
    }
    
    /**
     * Hit enemy with weapon (called by SpearSystem)
     */
    hitEnemy(enemyId, damage = 1) {
        const enemy = this.activeEnemies.get(enemyId);
        if (!enemy) return;
        
        // Apply damage
        enemy.health -= damage;
        
        console.log(`🎯 ${enemy.entityType} hit! HP: ${enemy.health}/${enemy.maxHealth}`);
        
        if (enemy.health <= 0) {
            // KILLED!
            console.log(`💀 ${enemy.entityType} defeated!`);
            this.voxelWorld.updateStatus(`💀 You killed a ${enemy.entityType}!`, 'success');
            
            // Remove from game
            this.removeEnemy(enemyId);
            
            // TODO: Drop loot (zombie flesh, bones, etc.)
        } else {
            // Still alive, show damage
            this.voxelWorld.updateStatus(`🎯 Hit ${enemy.entityType}! (${enemy.health} HP left)`, 'info');
        }
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
        
        // Stop animation loop when blood moon ends
        this.stopAnimationLoop();
        
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
