/**
 * RoamingEnemySystem.js
 * Manages roaming enemies in dungeons and overworld
 * AI behaviors: idle, patrol, chase, attack
 */

import * as THREE from 'three';

export class RoamingEnemySystem {
    constructor(scene, voxelWorld) {
        this.scene = scene;
        this.voxelWorld = voxelWorld;
        this.enemies = new Map(); // enemyId → enemyData
        this.nextId = 0;
        
        // Entity data from entities.json
        this.entityData = null;
        
        console.log('🧟 RoamingEnemySystem initialized');
    }
    
    /**
     * Load entity data from entities.json
     */
    async loadEntityData() {
        try {
            const response = await fetch('./assets/art/entities/entities.json');
            const data = await response.json();
            this.entityData = data.monsters;
            console.log('📚 Loaded entity data:', Object.keys(this.entityData).length, 'entities');
        } catch (error) {
            console.error('❌ Failed to load entity data:', error);
        }
    }
    
    /**
     * Get entity data by type
     */
    getEntityData(entityType) {
        if (!this.entityData) {
            console.error('❌ Entity data not loaded');
            return null;
        }
        
        return this.entityData[entityType] || null;
    }
    
    /**
     * Spawn roaming enemy at position
     * @param {string} enemyType - ID from entities.json
     * @param {object} pos - {x, y, z}
     */
    spawnEnemy(enemyType, pos) {
        const entityData = this.getEntityData(enemyType);
        if (!entityData) {
            console.error(`❌ Unknown enemy type: ${enemyType}`);
            return null;
        }
        
        // Create billboard sprite
        const sprite = this.createEnemySprite(entityData, pos);
        
        // Create enemy data
        const enemyId = `enemy_${this.nextId++}`;
        const enemy = {
            id: enemyId,
            type: enemyType,
            sprite: sprite,
            position: { ...pos },
            hp: entityData.hp,
            maxHp: entityData.hp,
            attack: entityData.attack,
            defense: entityData.defense,
            speed: entityData.speed * 0.01,
            state: 'idle',
            target: null,
            patrolPath: [],
            patrolIndex: 0,
            detectionRange: 16,
            attackRange: 3,
            attackCooldown: 0,
            attackSpeed: 2.0
        };
        
        this.enemies.set(enemyId, enemy);
        console.log(`👹 Spawned ${enemyType} at (${pos.x}, ${pos.y}, ${pos.z})`);
        
        return enemyId;
    }
    
    /**
     * Create billboard sprite for enemy
     */
    createEnemySprite(entityData, pos) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(
            `./assets/art/entities/${entityData.sprite_ready}`,
            () => console.log(`✅ Loaded sprite: ${entityData.sprite_ready}`),
            undefined,
            () => console.error(`❌ Failed to load sprite: ${entityData.sprite_ready}`)
        );
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(pos.x, pos.y + 1, pos.z);
        sprite.scale.set(2, 2, 1);
        
        this.scene.add(sprite);
        
        return sprite;
    }
    
    /**
     * Update all enemies (called every frame)
     */
    update(deltaTime, playerPos) {
        this.enemies.forEach((enemy) => {
            // AI state machine
            switch (enemy.state) {
                case 'idle':
                    this.updateIdleState(enemy, playerPos);
                    break;
                case 'patrol':
                    this.updatePatrolState(enemy, deltaTime);
                    break;
                case 'chase':
                    this.updateChaseState(enemy, playerPos, deltaTime);
                    break;
                case 'attack':
                    this.updateAttackState(enemy, playerPos, deltaTime);
                    break;
            }
            
            // Update sprite position
            this.updateEnemySprite(enemy);
            
            // Update attack cooldown
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= deltaTime;
            }
        });
    }
    
    /**
     * Idle state: Wait and detect player
     */
    updateIdleState(enemy, playerPos) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist < enemy.detectionRange) {
            // Player detected!
            enemy.state = 'chase';
            console.log(`👹 ${enemy.type} detected player!`);
        }
    }
    
    /**
     * Patrol state: Move along patrol path
     */
    updatePatrolState(enemy, deltaTime) {
        // TODO: Implement patrol movement
        // For now, just return to idle
        if (Math.random() < 0.01) {
            enemy.state = 'idle';
        }
    }
    
    /**
     * Chase state: Move toward player
     */
    updateChaseState(enemy, playerPos, deltaTime) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist < enemy.attackRange) {
            // In attack range!
            enemy.state = 'attack';
        } else if (dist > enemy.detectionRange * 2) {
            // Lost player
            enemy.state = 'idle';
            console.log(`👹 ${enemy.type} lost player`);
        } else {
            // Move toward player
            this.moveToward(enemy, playerPos, deltaTime);
        }
    }
    
    /**
     * Attack state: Attack player
     */
    updateAttackState(enemy, playerPos, deltaTime) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist > enemy.attackRange) {
            // Player escaped
            enemy.state = 'chase';
            return;
        }
        
        // Attack cooldown
        if (enemy.attackCooldown <= 0) {
            this.performAttack(enemy);
            enemy.attackCooldown = enemy.attackSpeed;
        }
    }
    
    /**
     * Perform attack on player
     */
    performAttack(enemy) {
        // Show attack sprite
        this.showAttackAnimation(enemy);
        
        // Deal damage to player
        const damage = Math.max(1, enemy.attack - (this.voxelWorld.playerDefense || 0));
        
        // ⚔️ Use Rule of 3rds damage distribution
        if (this.voxelWorld.companionCombatSystem) {
            const result = this.voxelWorld.companionCombatSystem.distributeEnemyDamage(damage, enemy.type);
            console.log(`👹 ${enemy.type} attacked → ${result.target} (${result.actualDamage} damage)`);
        } else {
            // Fallback: Direct damage to player
            if (this.voxelWorld.playerHP) {
                this.voxelWorld.playerHP.takeDamage(damage);
            }
            console.log(`👹 ${enemy.type} attacked player for ${damage} damage!`);
        }
        
        // Play attack sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.play('enemy_attack');
        }
    }
    
    /**
     * Show attack animation
     */
    showAttackAnimation(enemy) {
        const entityData = this.getEntityData(enemy.type);
        if (!entityData || !entityData.sprite_attack) return;
        
        // Load attack sprite
        const textureLoader = new THREE.TextureLoader();
        const attackTexture = textureLoader.load(
            `./assets/art/entities/${entityData.sprite_attack}`
        );
        
        enemy.sprite.material.map = attackTexture;
        enemy.sprite.material.needsUpdate = true;
        
        // Return to ready sprite after 500ms
        setTimeout(() => {
            const readyTexture = textureLoader.load(
                `./assets/art/entities/${entityData.sprite_ready}`
            );
            enemy.sprite.material.map = readyTexture;
            enemy.sprite.material.needsUpdate = true;
        }, 500);
    }
    
    /**
     * Move enemy toward target position
     */
    moveToward(enemy, targetPos, deltaTime) {
        const dx = targetPos.x - enemy.position.x;
        const dz = targetPos.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.1) {
            const moveSpeed = enemy.speed * deltaTime * 60;
            enemy.position.x += (dx / dist) * moveSpeed;
            enemy.position.z += (dz / dist) * moveSpeed;
        }
    }
    
    /**
     * Update sprite position to match enemy position
     */
    updateEnemySprite(enemy) {
        enemy.sprite.position.set(
            enemy.position.x,
            enemy.position.y + 1,
            enemy.position.z
        );
    }
    
    /**
     * Enemy takes damage
     */
    takeDamage(enemyId, damage) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        enemy.hp -= damage;
        
        if (enemy.hp <= 0) {
            this.killEnemy(enemyId);
        } else {
            // Aggro player if not already
            if (enemy.state === 'idle' || enemy.state === 'patrol') {
                enemy.state = 'chase';
            }
        }
    }
    
    /**
     * Kill enemy and drop loot
     */
    killEnemy(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        console.log(`💀 ${enemy.type} defeated!`);
        
        // TODO: Drop loot
        
        // Remove sprite
        this.scene.remove(enemy.sprite);
        enemy.sprite.material.dispose();
        if (enemy.sprite.material.map) {
            enemy.sprite.material.map.dispose();
        }
        
        // Remove from system
        this.enemies.delete(enemyId);
    }
    
    /**
     * Calculate distance between two points
     */
    distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    /**
     * Clear all enemies
     */
    clear() {
        this.enemies.forEach((enemy) => {
            this.scene.remove(enemy.sprite);
            enemy.sprite.material.dispose();
            if (enemy.sprite.material.map) {
                enemy.sprite.material.map.dispose();
            }
        });
        
        this.enemies.clear();
        console.log('🗑️ Cleared all enemies');
    }
}
