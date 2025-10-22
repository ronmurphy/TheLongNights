/**
 * CompanionCombatSystem.js
 *
 * Active combat system where player fights enemies with their weapons,
 * and companions join to provide support when combat starts.
 * 
 * Features:
 * - Player-driven combat (no auto-battler)
 * - Companion joins when player deals/takes damage
 * - Race-specific attacks with unique weapons
 * - Attack pose animations (_attack.png sprite swapping)
 * - Support roles (healing, buffs) consume player inventory
 * - Codex weapon override system
 * - Shared inventory between player and companion
 */

import * as THREE from 'three';

export class CompanionCombatSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.companionInCombat = false;
        this.combatStartTime = 0;
        this.companionAttackCooldown = 0;
        this.companionPose = 'default'; // 'default', 'attack', 'ready'
        this.supportCooldown = 0;
        
        // Default weapons per race (matching sprite artwork)
        this.defaultWeapons = {
            // Dwarf
            dwarf_female: 'crafted_stone_hammer',  // War hammer
            dwarf_male: 'crafted_tree_feller',     // Battle axe
            
            // Elf
            elf_female: 'crafted_crossbow',        // Crossbow
            elf_male: 'crafted_ice_bow',           // Ice bow
            
            // Goblin
            goblin_female: 'crafted_throwing_knives', // Throwing knives
            goblin_male: 'crafted_machete',           // Bloody sword (machete)
            
            // Human
            human_female: 'crafted_machete',       // Sword (using machete)
            human_male: 'crafted_stone_hammer'     // Hammer
        };
        
        // Attack damage multipliers per race (base stats from entities.json)
        this.raceDamageMultipliers = {
            dwarf: 1.2,   // Dwarves hit harder
            elf: 0.9,     // Elves are faster but lighter
            goblin: 1.0,  // Balanced
            human: 1.1    // Slightly above average
        };
        
        // Attack speed per race (attacks per second)
        this.raceAttackSpeed = {
            dwarf: 0.8,   // Slow, heavy hits
            elf: 1.5,     // Fast attacks
            goblin: 1.2,  // Quick
            human: 1.0    // Normal
        };
        
        // Support abilities per race
        this.supportAbilities = {
            elf: {
                name: 'Nature\'s Blessing',
                description: 'Heals player when HP ≤ 2',
                trigger: 'low_hp',
                effect: 'heal',
                amount: 3,
                consumesFood: true,
                cooldown: 10000 // 10 seconds
            },
            dwarf: {
                name: 'Stone Skin',
                description: 'Increases defense when player is hit',
                trigger: 'player_hit',
                effect: 'defense_buff',
                amount: 2,
                duration: 5000,
                cooldown: 15000
            },
            goblin: {
                name: 'Dirty Tricks',
                description: 'Weakens enemies when player deals damage',
                trigger: 'player_attack',
                effect: 'enemy_debuff',
                amount: -1,
                duration: 8000,
                cooldown: 12000
            },
            human: {
                name: 'Rally',
                description: 'Boosts player attack when outnumbered',
                trigger: 'outnumbered',
                effect: 'attack_buff',
                amount: 2,
                duration: 6000,
                cooldown: 20000
            }
        };
        
        console.log('⚔️ CompanionCombatSystem initialized');
    }
    
    /**
     * Update combat system (called every frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.voxelWorld.bloodMoonSystem) return;
        
        // Update cooldowns
        if (this.companionAttackCooldown > 0) {
            this.companionAttackCooldown -= deltaTime;
        }
        
        if (this.supportCooldown > 0) {
            this.supportCooldown -= deltaTime;
        }
        
        // Check if companion should join combat
        if (!this.companionInCombat && this.shouldCompanionJoinCombat()) {
            this.joinCombat();
        }
        
        // Update companion combat actions
        if (this.companionInCombat) {
            this.updateCompanionCombat(deltaTime);
        }
        
        // Check support ability triggers
        this.checkSupportTriggers();
    }
    
    /**
     * Check if companion should join combat
     * @returns {boolean}
     */
    shouldCompanionJoinCombat() {
        // Must have active companion
        if (!this.voxelWorld.companionCodex?.activeCompanion) return false;
        
        // Companion is exploring (not home)
        const companionStatus = this.voxelWorld.companionPortrait?.companionStatus;
        if (companionStatus === 'exploring') return false;
        
        // Check if player is in active combat with Blood Moon enemies
        const hasNearbyEnemies = this.getNearbyEnemies().length > 0;
        
        return hasNearbyEnemies;
    }
    
    /**
     * Companion joins combat
     */
    joinCombat() {
        this.companionInCombat = true;
        this.combatStartTime = Date.now();
        this.companionPose = 'ready';
        
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (companionId) {
            const race = companionId.split('_')[0]; // Extract race from "elf_male"
            this.voxelWorld.updateStatus(`⚔️ ${this.capitalize(race)} companion joins the fight!`, 'combat');
            
            // Update companion portrait to show ready pose
            this.updateCompanionSprite('ready');
        }
    }
    
    /**
     * Companion leaves combat
     */
    leaveCombat() {
        this.companionInCombat = false;
        this.companionPose = 'default';
        this.companionAttackCooldown = 0;
        
        // Reset companion portrait to default pose
        this.updateCompanionSprite('default');
        
        this.voxelWorld.updateStatus('⚔️ Combat ended', 'info');
    }
    
    /**
     * Update companion combat behavior
     * @param {number} deltaTime - Time since last frame
     */
    updateCompanionCombat(deltaTime) {
        const enemies = this.getNearbyEnemies();
        
        // Leave combat if no enemies nearby
        if (enemies.length === 0) {
            this.leaveCombat();
            return;
        }
        
        // Attack cooldown based on race speed
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (!companionId) return;
        
        const race = companionId.split('_')[0];
        const attackSpeed = this.raceAttackSpeed[race] || 1.0;
        const attackInterval = 1000 / attackSpeed; // Convert to milliseconds
        
        // Attack when cooldown is ready
        if (this.companionAttackCooldown <= 0) {
            this.companionAttack(enemies);
            this.companionAttackCooldown = attackInterval;
        }
    }
    
    /**
     * Companion performs attack
     * @param {Array} enemies - List of nearby enemies
     */
    companionAttack(enemies) {
        if (enemies.length === 0) return;
        
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (!companionId) return;
        
        const race = companionId.split('_')[0];
        
        // Get weapon from Codex equipment or use default
        const weapon = this.getCompanionWeapon(companionId);
        const weaponData = this.getWeaponData(weapon);
        
        // Calculate damage
        const baseStats = this.voxelWorld.companionCodex?.calculateStats(companionId);
        const baseAttack = baseStats?.attack || 2;
        const damageMultiplier = this.raceDamageMultipliers[race] || 1.0;
        const weaponAttack = weaponData?.attack || 1;
        const totalDamage = Math.floor((baseAttack + weaponAttack) * damageMultiplier);
        
        // Show attack pose
        this.companionPose = 'attack';
        this.updateCompanionSprite('attack');
        
        // Return to ready pose after animation
        setTimeout(() => {
            this.companionPose = 'ready';
            this.updateCompanionSprite('ready');
        }, 300);
        
        // Select target (closest enemy)
        const target = this.getClosestEnemy(enemies);
        if (!target) return;
        
        // Apply damage based on weapon type
        if (this.isRangedWeapon(weapon)) {
            this.fireCompanionRangedAttack(target, weapon, totalDamage);
        } else {
            this.executeCompanionMeleeAttack(target, weapon, totalDamage);
        }
    }
    
    /**
     * Get companion's equipped weapon or default
     * @param {string} companionId - Companion ID (e.g., "elf_male")
     * @returns {string} Weapon item type
     */
    getCompanionWeapon(companionId) {
        // Check Codex equipment first
        const equipment = this.voxelWorld.companionCodex?.companionEquipment?.[companionId];
        if (equipment?.weapon) {
            return equipment.weapon;
        }
        
        // Use default weapon for this race/gender
        return this.defaultWeapons[companionId] || 'stick';
    }
    
    /**
     * Get weapon data from Codex
     * @param {string} weaponType - Weapon item type
     * @returns {object} Weapon stats
     */
    getWeaponData(weaponType) {
        return this.voxelWorld.companionCodex?.equipmentBonuses?.[weaponType] || { attack: 1 };
    }
    
    /**
     * Check if weapon is ranged
     * @param {string} weaponType - Weapon item type
     * @returns {boolean}
     */
    isRangedWeapon(weaponType) {
        const rangedWeapons = [
            'crossbow', 'crafted_crossbow',
            'ice_bow', 'crafted_ice_bow',
            'fire_staff', 'crafted_fire_staff',
            'throwing_knives', 'crafted_throwing_knives'
        ];
        return rangedWeapons.includes(weaponType);
    }
    
    /**
     * Fire ranged attack from companion
     * @param {object} target - Enemy entity
     * @param {string} weapon - Weapon type
     * @param {number} damage - Damage amount
     */
    fireCompanionRangedAttack(target, weapon, damage) {
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        const race = companionId?.split('_')[0];
        
        // Get player position as companion position (companion is near player)
        const startPos = {
            x: this.voxelWorld.player.position.x,
            y: this.voxelWorld.player.position.y + 1,
            z: this.voxelWorld.player.position.z
        };
        
        const targetPos = {
            x: target.position.x,
            y: target.position.y + 0.5,
            z: target.position.z
        };
        
        // Create projectile effect
        let projectileType = 'arrow';
        if (weapon.includes('ice_bow')) projectileType = 'ice';
        if (weapon.includes('fire_staff')) projectileType = 'fire';
        if (weapon.includes('throwing_knives')) projectileType = 'knife';
        
        // Animate projectile
        this.createProjectile(startPos, targetPos, projectileType, () => {
            // Hit callback
            this.damageEnemy(target, damage, weapon);
            
            // Visual effect at target
            this.voxelWorld.createExplosionEffect?.(
                targetPos.x,
                targetPos.y,
                targetPos.z,
                projectileType
            );
        });
        
        const weaponName = this.getWeaponName(weapon);
        console.log(`🏹 Companion ranged attack: ${weapon} → ${projectileType} projectile`);
        this.voxelWorld.updateStatus(`🏹 ${this.capitalize(race)} fires ${weaponName}!`, 'combat');
    }
    
    /**
     * Execute melee attack from companion
     * @param {object} target - Enemy entity
     * @param {string} weapon - Weapon type
     * @param {number} damage - Damage amount
     */
    executeCompanionMeleeAttack(target, weapon, damage) {
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        const race = companionId?.split('_')[0];
        
        // Melee range check
        const distance = this.getDistanceToEnemy(target);
        if (distance > 3) {
            // Too far for melee
            return;
        }
        
        // Apply damage
        this.damageEnemy(target, damage, weapon);
        
        // Visual effect
        let effectType = 'slash';
        if (weapon.includes('hammer')) effectType = 'stone';
        if (weapon.includes('machete')) effectType = 'slash';
        if (weapon.includes('tree_feller')) effectType = 'slash';
        
        this.voxelWorld.createExplosionEffect?.(
            target.position.x,
            target.position.y,
            target.position.z,
            effectType
        );
        
        const weaponName = this.getWeaponName(weapon);
        this.voxelWorld.updateStatus(`⚔️ ${this.capitalize(race)} strikes with ${weaponName}!`, 'combat');
    }
    
    /**
     * Damage enemy entity
     * @param {object} enemy - Enemy entity
     * @param {number} damage - Damage amount
     * @param {string} weapon - Weapon used
     */
    damageEnemy(enemy, damage, weapon) {
        if (!enemy || !enemy.userData) return;
        
        // Apply damage
        enemy.userData.hp = (enemy.userData.hp || enemy.userData.maxHp || 10) - damage;
        
        console.log(`⚔️ Companion dealt ${damage} damage to ${enemy.userData.type || 'enemy'} (HP: ${enemy.userData.hp}/${enemy.userData.maxHp})`);
        
        // Check if enemy died
        if (enemy.userData.hp <= 0) {
            this.onEnemyKilled(enemy);
        }
    }
    
    /**
     * Handle enemy death
     * @param {object} enemy - Killed enemy
     */
    onEnemyKilled(enemy) {
        const enemyType = enemy.userData.type || 'enemy';
        this.voxelWorld.updateStatus(`💀 Companion defeated ${enemyType}!`, 'combat');
        
        // Let Blood Moon system handle death effects and drops
        if (this.voxelWorld.bloodMoonSystem?.handleEnemyDeath) {
            this.voxelWorld.bloodMoonSystem.handleEnemyDeath(enemy);
        }
    }
    
    /**
     * Check support ability triggers
     */
    checkSupportTriggers() {
        if (this.supportCooldown > 0) return;
        if (!this.companionInCombat) return;
        
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (!companionId) return;
        
        const race = companionId.split('_')[0];
        const ability = this.supportAbilities[race];
        if (!ability) return;
        
        // Check trigger conditions
        let shouldTrigger = false;
        
        if (ability.trigger === 'low_hp') {
            const playerHp = this.voxelWorld.playerHp || 10;
            shouldTrigger = playerHp <= 2;
        } else if (ability.trigger === 'player_hit') {
            // Triggered by onPlayerHit() method
            shouldTrigger = false;
        } else if (ability.trigger === 'player_attack') {
            // Triggered by onPlayerAttack() method
            shouldTrigger = false;
        } else if (ability.trigger === 'outnumbered') {
            const enemies = this.getNearbyEnemies();
            shouldTrigger = enemies.length >= 3;
        }
        
        if (shouldTrigger) {
            this.activateSupportAbility(ability, race);
        }
    }
    
    /**
     * Activate companion support ability
     * @param {object} ability - Ability data
     * @param {string} race - Companion race
     */
    activateSupportAbility(ability, race) {
        console.log(`✨ ${this.capitalize(race)} companion activates ${ability.name}!`);
        
        // Apply effect
        if (ability.effect === 'heal') {
            // Consume food from player inventory for healing
            if (ability.consumesFood) {
                const food = this.consumeFood();
                if (!food) {
                    this.voxelWorld.updateStatus(`❌ No food for healing!`, 'warning');
                    return;
                }
            }
            
            const healAmount = ability.amount || 3;
            this.voxelWorld.playerHp = Math.min(
                (this.voxelWorld.playerHp || 10) + healAmount,
                this.voxelWorld.maxHp || 10
            );
            
            this.voxelWorld.updateStatus(`💚 ${ability.name}: Healed ${healAmount} HP!`, 'discovery');
            this.voxelWorld.updateHpDisplay?.();
            
        } else if (ability.effect === 'defense_buff') {
            // Temporary defense boost
            this.voxelWorld.defenseBoost = (this.voxelWorld.defenseBoost || 0) + ability.amount;
            this.voxelWorld.updateStatus(`🛡️ ${ability.name}: Defense +${ability.amount}!`, 'discovery');
            
            // Remove buff after duration
            setTimeout(() => {
                this.voxelWorld.defenseBoost = Math.max(0, (this.voxelWorld.defenseBoost || 0) - ability.amount);
            }, ability.duration);
            
        } else if (ability.effect === 'attack_buff') {
            // Temporary attack boost
            this.voxelWorld.attackBoost = (this.voxelWorld.attackBoost || 0) + ability.amount;
            this.voxelWorld.updateStatus(`⚔️ ${ability.name}: Attack +${ability.amount}!`, 'discovery');
            
            // Remove buff after duration
            setTimeout(() => {
                this.voxelWorld.attackBoost = Math.max(0, (this.voxelWorld.attackBoost || 0) - ability.amount);
            }, ability.duration);
            
        } else if (ability.effect === 'enemy_debuff') {
            // Weaken all nearby enemies
            const enemies = this.getNearbyEnemies();
            enemies.forEach(enemy => {
                if (enemy.userData) {
                    enemy.userData.attackDebuff = (enemy.userData.attackDebuff || 0) + Math.abs(ability.amount);
                }
            });
            
            this.voxelWorld.updateStatus(`💀 ${ability.name}: Enemies weakened!`, 'discovery');
            
            // Remove debuff after duration
            setTimeout(() => {
                enemies.forEach(enemy => {
                    if (enemy.userData) {
                        enemy.userData.attackDebuff = Math.max(0, (enemy.userData.attackDebuff || 0) - Math.abs(ability.amount));
                    }
                });
            }, ability.duration);
        }
        
        // Set cooldown
        this.supportCooldown = ability.cooldown;
    }
    
    /**
     * Consume food from player inventory for healing
     * @returns {string|null} Food item type consumed, or null if no food
     */
    consumeFood() {
        if (!this.voxelWorld.inventory) return null;
        
        const foodTypes = [
            'cooked_meat', 'cooked_fish', 'bread', 'berry', 'apple',
            'mushroom', 'pumpkin_pie', 'carrot', 'potato'
        ];
        
        // Check hotbar and backpack for food
        const allSlots = [
            ...(this.voxelWorld.inventory.hotbarSlots || []),
            ...(this.voxelWorld.inventory.backpackSlots || [])
        ];
        
        for (const slot of allSlots) {
            if (slot && slot.itemType && foodTypes.includes(slot.itemType) && slot.quantity > 0) {
                // Consume one food item
                slot.quantity--;
                
                // Clear slot if empty
                if (slot.quantity === 0) {
                    slot.itemType = '';
                }
                
                this.voxelWorld.updateHotbarCounts?.();
                this.voxelWorld.updateBackpackInventoryDisplay?.();
                
                console.log(`🍖 Companion consumed ${slot.itemType} for healing`);
                return slot.itemType;
            }
        }
        
        return null;
    }
    
    /**
     * Get nearby enemies
     * @returns {Array} List of enemy entities
     */
    getNearbyEnemies() {
        if (!this.voxelWorld.bloodMoonSystem?.enemies) return [];
        
        const playerPos = this.voxelWorld.player.position;
        const combatRange = 15; // 15 block radius
        
        return this.voxelWorld.bloodMoonSystem.enemies.filter(enemy => {
            if (!enemy || !enemy.position) return false;
            
            const distance = playerPos.distanceTo(enemy.position);
            return distance <= combatRange && (enemy.userData?.hp || 0) > 0;
        });
    }
    
    /**
     * Get closest enemy to player
     * @param {Array} enemies - List of enemies
     * @returns {object|null} Closest enemy or null
     */
    getClosestEnemy(enemies) {
        if (!enemies || enemies.length === 0) return null;
        
        const playerPos = this.voxelWorld.player.position;
        let closest = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            if (!enemy || !enemy.position) return;
            
            const distance = playerPos.distanceTo(enemy.position);
            if (distance < minDistance) {
                minDistance = distance;
                closest = enemy;
            }
        });
        
        return closest;
    }
    
    /**
     * Get distance to enemy
     * @param {object} enemy - Enemy entity
     * @returns {number} Distance in blocks
     */
    getDistanceToEnemy(enemy) {
        if (!enemy || !enemy.position) return Infinity;
        return this.voxelWorld.player.position.distanceTo(enemy.position);
    }
    
    /**
     * Create projectile animation
     * @param {object} startPos - Start position {x, y, z}
     * @param {object} targetPos - Target position {x, y, z}
     * @param {string} type - Projectile type ('arrow', 'ice', 'fire', 'knife')
     * @param {function} onHit - Callback when projectile hits
     */
    createProjectile(startPos, targetPos, type, onHit) {
        // Create projectile mesh (larger and more visible)
        let geometry, material, color;
        
        if (type === 'ice') {
            geometry = new THREE.ConeGeometry(0.2, 1.0, 6);
            color = 0x00FFFF;
        } else if (type === 'fire') {
            geometry = new THREE.SphereGeometry(0.25);
            color = 0xFF4500;
        } else if (type === 'knife') {
            geometry = new THREE.ConeGeometry(0.15, 0.8, 4);
            color = 0xC0C0C0;
        } else { // arrow
            geometry = new THREE.ConeGeometry(0.15, 1.0, 6);
            color = 0x8B4513;
        }
        
        material = new THREE.MeshBasicMaterial({ 
            color,
            transparent: true,
            opacity: 0.9
        });
        const projectile = new THREE.Mesh(geometry, material);
        
        projectile.position.set(startPos.x, startPos.y, startPos.z);
        this.voxelWorld.scene.add(projectile);
        
        // Add glowing effect for visibility
        const glowGeometry = geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.multiplyScalar(1.5); // Larger glow
        projectile.add(glow);
        
        // Play projectile sound
        if (this.voxelWorld.sfxSystem) {
            try {
                const soundType = type === 'ice' ? 'whoosh' : type === 'fire' ? 'fire' : 'whoosh';
                this.voxelWorld.sfxSystem.playSpatial(soundType, startPos, this.voxelWorld.camera.position, {
                    maxDistance: 30,
                    volume: 0.4,
                    pitchVariation: 0.2
                });
            } catch (error) {
                console.warn('Companion projectile sound error:', error);
            }
        }
        
        // Animate projectile
        const duration = 500; // 0.5 seconds
        const startTime = Date.now();
        
        const animateProjectile = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Lerp position
            projectile.position.x = startPos.x + (targetPos.x - startPos.x) * progress;
            projectile.position.y = startPos.y + (targetPos.y - startPos.y) * progress;
            projectile.position.z = startPos.z + (targetPos.z - startPos.z) * progress;
            
            // Rotate projectile to face direction
            const direction = new THREE.Vector3(
                targetPos.x - startPos.x,
                targetPos.y - startPos.y,
                targetPos.z - startPos.z
            ).normalize();
            projectile.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            
            // Spin knives for effect
            if (type === 'knife') {
                projectile.rotation.z += 0.3;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateProjectile);
            } else {
                // Hit!
                this.voxelWorld.scene.remove(projectile);
                geometry.dispose();
                material.dispose();
                glowGeometry.dispose();
                glowMaterial.dispose();
                if (onHit) onHit();
            }
        };
        
        animateProjectile();
        
        console.log(`🏹 Companion fired ${type} projectile!`);
    }
    
    /**
     * Update companion sprite in portrait
     * @param {string} pose - Pose name ('default', 'attack', 'ready')
     */
    updateCompanionSprite(pose) {
        // Update companion portrait UI to show different pose
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updateCompanionPose(pose);
        }
    }
    
    /**
     * Get weapon display name
     * @param {string} weaponType - Weapon item type
     * @returns {string} Display name
     */
    getWeaponName(weaponType) {
        const weaponData = this.getWeaponData(weaponType);
        if (weaponData?.label) {
            return weaponData.label.replace(/[⚔️🏹🔨🪓🔪💀]/g, '').trim();
        }
        
        return weaponType.replace('crafted_', '').replace(/_/g, ' ');
    }
    
    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Called when player deals damage to enemy
     * @param {object} enemy - Enemy damaged
     * @param {number} damage - Damage dealt
     */
    onPlayerAttack(enemy, damage) {
        console.log('⚔️ onPlayerAttack called - enemy:', enemy, 'damage:', damage);
        
        // Trigger companion to join combat if not already
        if (!this.companionInCombat && this.shouldCompanionJoinCombat()) {
            this.joinCombat();
        }
        
        // Make companion react with pose animation and delayed attack
        if (this.companionInCombat && enemy) {
            const companionId = this.voxelWorld.companionCodex?.activeCompanion;
            if (companionId) {
                const race = companionId.split('_')[0];
                const weapon = this.getCompanionWeapon(companionId);
                const isRanged = this.isRangedWeapon(weapon);
                
                // Calculate attack delay based on race and weapon type
                // Elf: 300ms (fast), Human/Goblin: 500ms, Dwarf: 700ms (slow)
                // Ranged weapons add 200ms (draw/aim time)
                let baseDelay = 500; // Default for human
                if (race === 'elf') baseDelay = 300;
                else if (race === 'goblin') baseDelay = 400;
                else if (race === 'dwarf') baseDelay = 700;
                
                const totalDelay = isRanged ? baseDelay + 200 : baseDelay;
                
                console.log(`⚔️ ${race} companion reacting - attack in ${totalDelay}ms (${isRanged ? 'ranged' : 'melee'})`);
                
                // Show ready pose immediately (companion prepares to attack)
                this.companionPose = 'ready';
                this.updateCompanionSprite('ready');
                
                // Delayed attack with attack pose animation
                setTimeout(() => {
                    // Only attack if companion still in combat and enemy still exists
                    if (this.companionInCombat) {
                        this.companionAttack([enemy]);
                    }
                }, totalDelay);
            }
        }
        
        // Trigger goblin support ability (enemy debuff)
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (companionId) {
            const race = companionId.split('_')[0];
            if (race === 'goblin' && this.supportCooldown <= 0) {
                const ability = this.supportAbilities.goblin;
                this.activateSupportAbility(ability, race);
            }
        }
    }
    
    /**
     * Called when player takes damage
     * @param {number} damage - Damage taken
     */
    onPlayerHit(damage) {
        // Trigger companion to join combat if not already
        if (!this.companionInCombat && this.shouldCompanionJoinCombat()) {
            this.joinCombat();
        }
        
        // Trigger dwarf support ability (defense buff)
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;
        if (companionId) {
            const race = companionId.split('_')[0];
            if (race === 'dwarf' && this.supportCooldown <= 0) {
                const ability = this.supportAbilities.dwarf;
                this.activateSupportAbility(ability, race);
            }
        }
    }
}
