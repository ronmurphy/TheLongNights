/**
 * UnifiedCombatSystem.js
 * 
 * Centralized combat damage system for ALL weapons against ALL enemies
 * Handles: Blood Moon enemies, colored ghosts, angry ghosts, animals
 * Used by: Click attacks, ranged weapons, melee weapons, spears
 */

export class UnifiedCombatSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        
        // Last enemy hit by player (for companion targeting)
        this.lastEnemyHit = null; // {target: sprite, position: {x,y,z}, timestamp: number}
        
        // Weapon damage table (shared across all combat systems)
        this.weaponDamage = {
            // Bare hands
            bare_hands: 1,
            
            // Crafted tools
            crafted_stone_hammer: 3,
            crafted_tree_feller: 4,
            crafted_machete: 2,
            crafted_crossbow: 2,
            crafted_ice_bow: 2,
            crafted_throwing_knives: 2,
            crafted_spear: 3,
            
            // Legacy items
            stone_hammer: 3,
            tree_feller: 4,
            machete: 2,
            crossbow: 2,
            ice_bow: 2,
            throwing_knives: 2,
            spear: 3
        };
        
        // Attack range by weapon type (in blocks)
        this.weaponRange = {
            melee: 2.5,      // Melee weapons (hammer, axe, machete)
            ranged: 50,      // Ranged weapons (bow, crossbow)
            thrown: 30,      // Thrown weapons (spear, knives)
        };
        
        console.log('⚔️ UnifiedCombatSystem initialized');
    }
    
    /**
     * Get damage for a weapon type
     * @param {string} weaponType - Weapon item ID
     * @returns {number} Damage amount
     */
    getWeaponDamage(weaponType) {
        return this.weaponDamage[weaponType] || 1; // Default 1 (bare hands)
    }
    
    /**
     * Check if weapon is ranged
     * @param {string} weaponType - Weapon item ID
     * @returns {boolean} True if ranged weapon
     */
    isRangedWeapon(weaponType) {
        return weaponType && (
            weaponType.includes('bow') ||
            weaponType.includes('crossbow') ||
            weaponType.includes('knives')
        );
    }
    
    /**
     * Check if weapon is throwable
     * @param {string} weaponType - Weapon item ID
     * @returns {boolean} True if throwable weapon
     */
    isThrowableWeapon(weaponType) {
        return weaponType && (
            weaponType.includes('spear') ||
            weaponType.includes('knives')
        );
    }
    
    /**
     * Apply damage to any enemy type
     * @param {object} target - Target entity (enemy, ghost, animal)
     * @param {number} damage - Damage to apply
     * @param {string} attackType - Type of attack ('player' or 'companion')
     * @returns {object} Result {hit: bool, killed: bool, targetId: string}
     */
    applyDamage(target, damage, attackType = 'player') {
        const result = {
            hit: false,
            killed: false,
            targetId: null,
            targetType: null,
            remainingHP: 0,
            maxHP: 0
        };

        // ⚔️ FAIR COMBAT: Hit/Miss System for Player Attacks
        // Roll 1-3: 1-2 = HIT (50% chance), 3 = MISS (50% chance)
        // Only applies to player/companion attacks, not enemy internal damage
        if (attackType === 'player' || attackType === 'companion') {
            const hitRoll = Math.floor(Math.random() * 3) + 1;

            if (hitRoll === 3) {
                // MISS! No damage dealt
                console.log(`🎲 ${attackType} Roll=${hitRoll}: MISSED!`);
                this.voxelWorld.updateStatus(`💨 Attack missed!`, 'info');
                result.hit = false;
                return result;
            }

            // HIT! Proceed with damage
            console.log(`🎲 ${attackType} Roll=${hitRoll}: HIT for ${damage} damage!`);
        }

        // Store last enemy hit by PLAYER (for companion targeting)
        if (attackType === 'player' && target && target.position) {
            this.lastEnemyHit = {
                target: target,
                position: {
                    x: target.position.x,
                    y: target.position.y,
                    z: target.position.z
                },
                timestamp: Date.now()
            };
            console.log(`🎯 Player hit enemy - stored for companion targeting`);
        }
        
        // Identify target type and apply damage accordingly
        
        // 1. BLOOD MOON ENEMIES
        if (this.voxelWorld.bloodMoonSystem?.activeEnemies) {
            for (const [enemyId, enemy] of this.voxelWorld.bloodMoonSystem.activeEnemies) {
                if (enemy.sprite === target || (target.sprite && enemy.sprite === target.sprite)) {
                    if (enemy.health > 0) {
                        this.voxelWorld.bloodMoonSystem.hitEnemy(enemyId, damage);
                        result.hit = true;
                        result.killed = enemy.health <= 0;
                        result.targetId = enemyId;
                        result.targetType = 'blood_moon_enemy';
                        result.remainingHP = enemy.health;
                        result.maxHP = enemy.maxHealth;
                        
                        // Create hit effect
                        const pos = enemy.sprite.position;
                        this.voxelWorld.createExplosionEffect(pos.x, pos.y, pos.z, 'hit');
                        
                        return result;
                    }
                }
            }
        }
        
        // 2. COLORED GHOSTS (Spectral Hunt)
        if (this.voxelWorld.spectralHuntSystem?.coloredGhostSystem) {
            const coloredGhostSystem = this.voxelWorld.spectralHuntSystem.coloredGhostSystem;
            for (const [ghostId, ghostData] of coloredGhostSystem.ghosts) {
                if (ghostData.sprite === target || (target.sprite && ghostData.sprite === target.sprite)) {
                    if (!ghostData.isDead) {
                        ghostData.hp = (ghostData.hp || 5) - damage;
                        result.hit = true;
                        result.targetId = ghostId;
                        result.targetType = 'colored_ghost';
                        result.remainingHP = ghostData.hp;
                        result.maxHP = 5;
                        
                        // Create hit effect
                        const pos = ghostData.sprite.position;
                        this.voxelWorld.createExplosionEffect(pos.x, pos.y, pos.z, 'hit');
                        
                        if (ghostData.hp <= 0) {
                            result.killed = true;
                            ghostData.isDead = true;
                            coloredGhostSystem.removeGhost(ghostId);
                            this.voxelWorld.updateStatus(`👻 Defeated ${ghostData.color.name} ghost!`, 'combat');
                        } else {
                            this.voxelWorld.updateStatus(`👻 Hit ${ghostData.color.name} ghost for ${damage} damage! (${ghostData.hp}/5 HP)`, 'combat');
                        }
                        
                        return result;
                    }
                }
            }
        }
        
        // 3. ANIMALS (for hunting)
        if (this.voxelWorld.animalSystem?.animals) {
            for (const [animalId, animal] of this.voxelWorld.animalSystem.animals) {
                if (animal.sprite === target || (target.sprite && animal.sprite === target.sprite)) {
                    if (animal.health > 0) {
                        animal.health -= damage;
                        result.hit = true;
                        result.targetId = animalId;
                        result.targetType = 'animal';
                        result.remainingHP = animal.health;
                        result.maxHP = animal.maxHealth || 10;
                        
                        // Create hit effect
                        const pos = animal.sprite.position;
                        this.voxelWorld.createExplosionEffect(pos.x, pos.y, pos.z, 'hit');
                        
                        if (animal.health <= 0) {
                            result.killed = true;
                            this.voxelWorld.animalSystem.killAnimal(animalId);
                        }
                        
                        return result;
                    }
                }
            }
        }
        
        // Target not found or invalid
        return result;
    }
    
    /**
     * Find target at position (for projectile collision detection)
     * @param {THREE.Vector3} position - Position to check
     * @param {number} radius - Search radius
     * @returns {object|null} Target entity or null
     */
    findTargetAtPosition(position, radius = 1.5) {
        // Check Blood Moon enemies
        if (this.voxelWorld.bloodMoonSystem?.activeEnemies) {
            for (const [enemyId, enemy] of this.voxelWorld.bloodMoonSystem.activeEnemies) {
                if (enemy.health <= 0) continue;
                const distance = position.distanceTo(enemy.sprite.position);
                if (distance < radius) {
                    return { sprite: enemy.sprite, type: 'blood_moon_enemy', id: enemyId };
                }
            }
        }
        
        // Check colored ghosts
        if (this.voxelWorld.spectralHuntSystem?.coloredGhostSystem) {
            for (const [ghostId, ghostData] of this.voxelWorld.spectralHuntSystem.coloredGhostSystem.ghosts) {
                if (ghostData.isDead) continue;
                const distance = position.distanceTo(ghostData.sprite.position);
                if (distance < radius) {
                    return { sprite: ghostData.sprite, type: 'colored_ghost', id: ghostId };
                }
            }
        }
        
        // Check animals
        if (this.voxelWorld.animalSystem?.animals) {
            for (const [animalId, animal] of this.voxelWorld.animalSystem.animals) {
                if (animal.health <= 0) continue;
                const distance = position.distanceTo(animal.sprite.position);
                if (distance < radius) {
                    return { sprite: animal.sprite, type: 'animal', id: animalId };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Trigger player attack pose animation
     * Uses cinematic sequence: default(3s)→ready(2s)→attack(2s)→fade to default
     */
    triggerPlayerAttackPose() {
        if (this.voxelWorld.playerCompanionUI) {
            // Start full cinematic attack sequence
            this.voxelWorld.playerCompanionUI.updatePlayerPose('attack', true);
        }
    }
    
    /**
     * Trigger companion combat response
     * @param {object} target - Target entity
     * @param {number} damage - Damage dealt by player
     */
    triggerCompanionResponse(target, damage) {
        if (this.voxelWorld.companionCombatSystem) {
            this.voxelWorld.companionCombatSystem.onPlayerAttack(target, damage);
        }
    }
}
