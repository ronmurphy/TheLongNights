/**
 * ColoredGhostSystem.js
 * 
 * Manages colored ghost minions for spectral hunt events.
 * Based on GhostSystem but adds:
 * - Color tinting
 * - Hitbox collision detection
 * - Combat/hit detection
 * - Reward drops on death
 * 
 * Ghost colors: ROYGBIV + Black (Day 1-7)
 */

import * as THREE from 'three';

export class ColoredGhostSystem {
    constructor(scene, voxelWorld, spectralHuntSystem) {
        this.scene = scene;
        this.voxelWorld = voxelWorld;
        this.spectralHuntSystem = spectralHuntSystem;
        this.enhancedGraphics = voxelWorld.enhancedGraphics;

        // Ghost registry - Map<ghostId, ghostData>
        this.ghosts = new Map();
        this.nextGhostId = 0;

        // Animation timing
        this.time = 0;

        // Sound effect timing
        this.lastGhostSound = 0;
        this.ghostSoundCooldown = 8000; // 8 seconds

        // Entity database (loaded from entities.json)
        this.entityDatabase = null;
        this.loadEntityData();

        // Configuration (same as GhostSystem)
        this.config = {
            // Visual
            spriteSize: 2.0,           // Slightly larger than normal ghosts
            opacity: 0.8,              // More visible
            
            // Animation
            floatSpeed: 1.5,
            floatAmount: 0.3,
            rotateSpeed: 0.5,
            
            // AI behavior (base values, overridden per ghost type)
            followRange: 30,           // Detect player from farther
            followSpeed: 0.05,         // Base speed
            maxFollowSpeed: 0.08,
            idleWanderSpeed: 0.01,
            attackRange: 2.5,          // Show attack pose within this range
            
            // Combat
            hitboxRadius: 1.5,         // Collision radius
            
            // Color-specific behaviors
            behaviors: {
                Red: {
                    // AGGRESSIVE RUSHER - Gets right in your face!
                    personalSpace: 0.5,  // Gets VERY close
                    followSpeed: 0.07,   // Fast
                    attackRange: 1.0,    // Attack pose when very close
                    description: 'Aggressive rusher - charges right at you!'
                },
                Orange: {
                    // CIRCLER - Circles around player
                    personalSpace: 3,
                    followSpeed: 0.06,
                    circleRadius: 4,     // Circles at 4 block radius
                    circleSpeed: 0.03,
                    description: 'Circler - orbits around you menacingly'
                },
                Yellow: {
                    // ZIGZAGGER - Unpredictable movement
                    personalSpace: 2,
                    followSpeed: 0.05,
                    zigzagInterval: 1.0, // Change direction every second
                    description: 'Zigzagger - unpredictable erratic movement'
                },
                Green: {
                    // TELEPORTER - Teleports closer periodically
                    personalSpace: 2,
                    followSpeed: 0.03,   // Slower (uses teleport)
                    teleportInterval: 5,  // Teleport every 5 seconds
                    teleportRange: 8,     // Teleport 8 blocks closer
                    description: 'Teleporter - blinks closer every 5 seconds'
                },
                Blue: {
                    // RANGED - Keeps distance, throws projectiles
                    personalSpace: 8,    // Stays far away
                    followSpeed: 0.04,
                    projectileInterval: 3, // Throw every 3 seconds
                    preferredDistance: 10,  // Tries to maintain 10 blocks
                    description: 'Ranged attacker - keeps distance and throws ice'
                },
                Indigo: {
                    // TANK - Slow but sturdy, blocks path
                    personalSpace: 1.5,
                    followSpeed: 0.03,   // Slow
                    maxFollowSpeed: 0.04,
                    hitboxRadius: 2.5,   // Larger hitbox
                    description: 'Tank - slow and sturdy, blocks your path'
                },
                Black: {
                    // BOSS - Combination of abilities, Day 7 only
                    personalSpace: 2,
                    followSpeed: 0.06,
                    canTeleport: true,
                    canCircle: true,
                    teleportInterval: 8,
                    description: 'Boss ghost - uses multiple abilities!'
                }
            }
        };
        
        console.log('👻 ColoredGhostSystem initialized');
    }

    /**
     * Load entity data from entities.json
     */
    async loadEntityData() {
        try {
            const response = await fetch('art/entities/entities.json');
            const data = await response.json();
            this.entityDatabase = data;
            console.log('👻 ColoredGhost entity database loaded:', data.ghosts ? Object.keys(data.ghosts).length : 0, 'ghost types');
        } catch (error) {
            console.error('👻 Failed to load entities.json:', error);
        }
    }

    /**
     * Get ghost data from entities.json by color name
     * @param {string} colorName - Color name (e.g., 'Red', 'Orange', etc.)
     * @returns {object} Ghost data from JSON
     */
    getGhostData(colorName) {
        if (!this.entityDatabase || !this.entityDatabase.ghosts) {
            console.warn(`👻 Entity database not loaded yet for ${colorName} ghost`);
            return null;
        }

        const ghostKey = `colored_ghost_${colorName.toLowerCase()}`;
        const ghostData = this.entityDatabase.ghosts[ghostKey];

        if (!ghostData) {
            console.warn(`👻 Ghost data not found for ${colorName} (looking for "${ghostKey}")`);
            return null;
        }

        return ghostData;
    }

    /**
     * Spawn a colored ghost
     */
    spawnColoredGhost(colorData) {
        // Load ghost data from entities.json
        const ghostData = this.getGhostData(colorData.name);

        if (!ghostData) {
            console.error(`👻 Cannot spawn ${colorData.name} ghost - data not loaded from entities.json`);
            return null;
        }

        // Get player position
        const playerPos = this.voxelWorld.camera.position;

        // Find spawn position (just outside render distance)
        const spawnPos = this.findSpawnPosition(playerPos);

        // Create ghost texture
        const texture = this.createGhostTexture();

        // Parse color from JSON (hex string to THREE.Color)
        const colorHex = parseInt(ghostData.color.replace('#', '0x'));

        // Create sprite material with color tint
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: this.config.opacity,
            depthWrite: false,
            color: new THREE.Color(colorHex) // Color tint from JSON!
        });

        // Create sprite
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(this.config.spriteSize, this.config.spriteSize, 1);
        sprite.position.set(spawnPos.x, spawnPos.y, spawnPos.z);

        // Add user data for targeting/outline system (from JSON)
        sprite.userData.isGhost = true;
        sprite.userData.isEnemy = true; // Colored ghosts are attackable
        sprite.userData.type = `${ghostData.name}_ghost`;
        sprite.userData.hp = ghostData.hp;
        sprite.userData.maxHp = ghostData.hp;

        // Get behavior config from JSON (fallback to hardcoded if needed)
        const behaviorConfig = ghostData.ai_config || this.config.behaviors[colorData.name] || this.config.behaviors.Red;
        
        // Create hitbox (size based on behavior - Indigo has larger hitbox)
        const hitboxRadius = behaviorConfig.hitboxRadius || this.config.hitboxRadius;
        const hitboxGeometry = new THREE.SphereGeometry(hitboxRadius, 8, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false, // Invisible visually
            transparent: true,
            opacity: 0
        });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.copy(sprite.position);
        
        // Copy userData to hitbox so raycasting works on either (use JSON HP values)
        hitbox.userData.isGhost = true;
        hitbox.userData.isEnemy = true;
        hitbox.userData.type = `${ghostData.name}_ghost`;
        hitbox.userData.hp = ghostData.hp;
        hitbox.userData.maxHp = ghostData.hp;
        hitbox.userData.ghostSprite = sprite; // Reference to sprite for position updates

        // Add both to scene
        this.scene.add(sprite);
        this.scene.add(hitbox);

        // Create ghost data object (name collision - use ghostInstance)
        const ghostId = `colored_ghost_${this.nextGhostId++}`;
        const ghostInstance = {
            id: ghostId,
            sprite: sprite,
            hitbox: hitbox,
            color: colorData, // Keep original colorData for compatibility
            colorName: ghostData.name, // From JSON
            behavior: behaviorConfig,
            baseY: spawnPos.y,
            floatOffset: Math.random() * Math.PI * 2,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderChangeTime: 0,
            isFollowing: false,
            isDead: false,

            // Combat stats from JSON
            hp: ghostData.hp,
            maxHp: ghostData.hp,
            
            // Texture swapping for attack pose
            normalTexture: texture,
            attackTexture: null, // Lazy load when needed
            isAttacking: false,
            
            // Behavior-specific state
            circleAngle: Math.random() * Math.PI * 2,    // For Orange (circler)
            zigzagTimer: 0,                               // For Yellow (zigzagger)
            teleportTimer: 0,                             // For Green/Black (teleporter)
            projectileTimer: 0                            // For Blue (ranged)
        };

        this.ghosts.set(ghostId, ghostInstance);

        // Use description from JSON if available, fallback to behaviorConfig
        const description = ghostData.description || behaviorConfig.description || 'Unknown behavior';

        console.log(`👻 Colored ghost spawned: ${ghostData.name} at (${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)}) - ${description}`);

        // Status message
        this.voxelWorld.updateStatus(
            `👻 ${ghostData.name} ghost appeared! (${description})`,
            'warning'
        );

        // Play spawn sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.playSpatial('ghost', spawnPos, this.voxelWorld.camera.position, {
                maxDistance: 60,
                volume: 0.7,
                pitchVariation: 0.2
            });
        }

        return ghostId;
    }
    
    /**
     * Find a valid spawn position around the player
     */
    findSpawnPosition(playerPos) {
        // Spawn just beyond billboard cull distance for dramatic fog entrance
        // Cull distance = (renderDistance + 1) * chunkSize
        // For renderDistance=1: (1+1)*8 = 16 blocks
        // Spawn at 10-14 blocks for immediate visibility, or 16-20 for fog entrance
        const renderDist = this.voxelWorld.renderDistance || 1;
        const chunkSize = 8;
        const cullDistance = (renderDist + 1) * chunkSize;
        
        // Spawn just inside cull distance (visible immediately) to just outside (fog entrance)
        const spawnDistance = cullDistance - 2 + Math.random() * 6; // cullDist-2 to cullDist+4
        const angle = Math.random() * Math.PI * 2;
        
        const x = playerPos.x + Math.cos(angle) * spawnDistance;
        const z = playerPos.z + Math.sin(angle) * spawnDistance;
        
        // Spawn at player height (ghosts will follow vertically)
        const y = playerPos.y;
        
        console.log(`👻 Colored ghost spawn: (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) - ${spawnDistance.toFixed(1)} blocks away (cull distance: ${cullDistance})`);
        
        return { x, y, z };
    }    /**
     * Create ghost texture (normal passive pose)
     */
    createGhostTexture() {
        // Try enhanced graphics
        const entityData = this.enhancedGraphics?.getEnhancedEntityImage?.('ghost');
        
        if (entityData?.path) {
            const texture = new THREE.TextureLoader().load(entityData.path);
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
            return texture;
        }
        
        // Fallback: emoji
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    /**
     * Create attack pose texture
     */
    createAttackTexture() {
        // Try enhanced graphics - use angry ghost attack pose
        const entityData = this.enhancedGraphics?.getEnhancedEntityImage?.('angry_ghost_attack_pose');
        
        if (entityData?.path) {
            const texture = new THREE.TextureLoader().load(entityData.path);
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
            return texture;
        }
        
        // Fallback: angry emoji
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('😈', 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    /**
     * Update ghost behavior based on its color type
     */
    updateGhostBehavior(ghost, playerPos, distance, dx, dy, dz, deltaTime) {
        const colorName = ghost.color.name;
        const behavior = ghost.behavior;
        const personalSpace = behavior.personalSpace || 2;
        const followSpeed = behavior.followSpeed || this.config.followSpeed;
        const maxSpeed = behavior.maxFollowSpeed || this.config.maxFollowSpeed;
        
        const dirX = dx / (distance || 1);
        const dirY = dy / (distance || 1);
        const dirZ = dz / (distance || 1);
        
        // Color-specific behaviors
        switch(colorName) {
            case 'Red': // AGGRESSIVE RUSHER
                if (distance > personalSpace) {
                    const speed = Math.min(followSpeed, maxSpeed);
                    ghost.sprite.position.x += dirX * speed;
                    ghost.sprite.position.z += dirZ * speed;
                    ghost.baseY += dirY * speed * 0.3;
                }
                break;
                
            case 'Orange': // CIRCLER
                ghost.circleAngle += behavior.circleSpeed * deltaTime;
                const circleX = playerPos.x + Math.cos(ghost.circleAngle) * behavior.circleRadius;
                const circleZ = playerPos.z + Math.sin(ghost.circleAngle) * behavior.circleRadius;
                const toCircleX = circleX - ghost.sprite.position.x;
                const toCircleZ = circleZ - ghost.sprite.position.z;
                const circleDist = Math.sqrt(toCircleX * toCircleX + toCircleZ * toCircleZ);
                if (circleDist > 0.5) {
                    ghost.sprite.position.x += (toCircleX / circleDist) * followSpeed;
                    ghost.sprite.position.z += (toCircleZ / circleDist) * followSpeed;
                }
                ghost.baseY += dirY * followSpeed * 0.2; // Still follows Y
                break;
                
            case 'Yellow': // ZIGZAGGER
                ghost.zigzagTimer -= deltaTime;
                if (ghost.zigzagTimer <= 0) {
                    ghost.wanderAngle = Math.random() * Math.PI * 2;
                    ghost.zigzagTimer = behavior.zigzagInterval;
                }
                const zigzagX = dirX + Math.cos(ghost.wanderAngle) * 0.5;
                const zigzagZ = dirZ + Math.sin(ghost.wanderAngle) * 0.5;
                const zigzagNorm = Math.sqrt(zigzagX * zigzagX + zigzagZ * zigzagZ);
                if (distance > personalSpace && zigzagNorm > 0) {
                    ghost.sprite.position.x += (zigzagX / zigzagNorm) * followSpeed;
                    ghost.sprite.position.z += (zigzagZ / zigzagNorm) * followSpeed;
                    ghost.baseY += dirY * followSpeed * 0.3;
                }
                break;
                
            case 'Green': // TELEPORTER
                ghost.teleportTimer -= deltaTime;
                if (ghost.teleportTimer <= 0 && distance > behavior.teleportRange) {
                    // Teleport closer to player
                    const teleportDist = Math.min(distance - behavior.teleportRange, behavior.teleportRange);
                    ghost.sprite.position.x += dirX * teleportDist;
                    ghost.sprite.position.z += dirZ * teleportDist;
                    ghost.baseY = playerPos.y; // Match player Y on teleport
                    ghost.teleportTimer = behavior.teleportInterval;
                    console.log(`👻 Green ghost teleported closer!`);
                } else if (distance > personalSpace) {
                    // Normal movement when not teleporting
                    ghost.sprite.position.x += dirX * followSpeed;
                    ghost.sprite.position.z += dirZ * followSpeed;
                    ghost.baseY += dirY * followSpeed * 0.3;
                }
                break;
                
            case 'Blue': // RANGED
                // Try to maintain preferred distance
                const preferredDist = behavior.preferredDistance || 10;
                if (distance < preferredDist) {
                    // Back away
                    ghost.sprite.position.x -= dirX * followSpeed;
                    ghost.sprite.position.z -= dirZ * followSpeed;
                } else if (distance > preferredDist + 3) {
                    // Get closer
                    ghost.sprite.position.x += dirX * followSpeed * 0.5;
                    ghost.sprite.position.z += dirZ * followSpeed * 0.5;
                }
                ghost.baseY += dirY * followSpeed * 0.2;
                
                // Projectile attack - shoot ice at player
                ghost.projectileTimer -= deltaTime;
                if (ghost.projectileTimer <= 0 && distance < 15) {
                    this.shootIceProjectile(ghost, playerPos);
                    ghost.projectileTimer = behavior.projectileInterval;
                }
                break;
                
            case 'Indigo': // TANK
                // Slow but relentless
                if (distance > personalSpace) {
                    const speed = Math.min(followSpeed, maxSpeed);
                    ghost.sprite.position.x += dirX * speed;
                    ghost.sprite.position.z += dirZ * speed;
                    ghost.baseY += dirY * speed * 0.2; // Slower Y movement
                }
                break;
                
            case 'Black': // BOSS
                // Combines teleport and circle behaviors
                ghost.teleportTimer -= deltaTime;
                if (ghost.teleportTimer <= 0 && distance > 10) {
                    // Teleport
                    const teleportDist = Math.min(distance - 8, 8);
                    ghost.sprite.position.x += dirX * teleportDist;
                    ghost.sprite.position.z += dirZ * teleportDist;
                    ghost.baseY = playerPos.y;
                    ghost.teleportTimer = behavior.teleportInterval;
                    console.log(`👻 BLACK GHOST teleported!`);
                } else {
                    // Circle when close
                    ghost.circleAngle += 0.02 * deltaTime;
                    const circX = playerPos.x + Math.cos(ghost.circleAngle) * 5;
                    const circZ = playerPos.z + Math.sin(ghost.circleAngle) * 5;
                    const toCX = circX - ghost.sprite.position.x;
                    const toCZ = circZ - ghost.sprite.position.z;
                    const cDist = Math.sqrt(toCX * toCX + toCZ * toCZ);
                    if (cDist > 0.5) {
                        ghost.sprite.position.x += (toCX / cDist) * followSpeed;
                        ghost.sprite.position.z += (toCZ / cDist) * followSpeed;
                    }
                    ghost.baseY += dirY * followSpeed * 0.3;
                }
                break;
                
            default:
                // Fallback: standard chase
                if (distance > personalSpace) {
                    ghost.sprite.position.x += dirX * followSpeed;
                    ghost.sprite.position.z += dirZ * followSpeed;
                    ghost.baseY += dirY * followSpeed * 0.3;
                }
        }
        
        // Update hitbox position
        ghost.hitbox.position.x = ghost.sprite.position.x;
        ghost.hitbox.position.z = ghost.sprite.position.z;
    }
    
    /**
     * Shoot ice projectile from Blue ghost toward player
     */
    shootIceProjectile(ghost, playerPos) {
        const startPos = ghost.sprite.position.clone();
        startPos.y += 0.5; // Shoot from ghost center
        
        // Create ice arrow projectile
        const geometry = new THREE.ConeGeometry(0.15, 0.9, 6);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(ghost.color.hex).lerp(new THREE.Color(0x87CEEB), 0.5), // Mix ghost color with ice blue
            transparent: true,
            opacity: 0.8
        });
        const arrow = new THREE.Mesh(geometry, material);
        arrow.position.copy(startPos);
        arrow.rotation.x = Math.PI / 2; // Point forward
        this.scene.add(arrow);
        
        console.log(`❄️ Blue ghost shoots ice projectile!`);
        
        // Animate projectile toward player
        const targetPos = playerPos.clone();
        const duration = 1.5; // 1.5 seconds to reach target
        const startTime = performance.now();
        
        const animateProjectile = () => {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1.0);
            
            if (progress >= 1.0) {
                // Hit or miss
                this.scene.remove(arrow);
                arrow.geometry.dispose();
                arrow.material.dispose();
                
                // Check if player got hit
                const finalDist = arrow.position.distanceTo(this.voxelWorld.camera.position);
                if (finalDist < 2) {
                    console.log(`❄️ Ice projectile hit player!`);
                    // ⚔️ Use Rule of 3rds damage distribution
                    if (this.voxelWorld.companionCombatSystem) {
                        this.voxelWorld.companionCombatSystem.distributeEnemyDamage(1, 'Ice Ghost');
                    } else {
                        // Fallback: Direct damage
                        if (this.voxelWorld.playerHP) {
                            this.voxelWorld.playerHP.takeDamage(1);
                        }
                    }
                    // Ice impact effect
                    if (this.voxelWorld.createExplosionEffect) {
                        this.voxelWorld.createExplosionEffect(
                            arrow.position.x,
                            arrow.position.y,
                            arrow.position.z,
                            'ice'
                        );
                    }
                }
                return;
            }
            
            // Update position
            arrow.position.lerpVectors(startPos, targetPos, progress);
            
            // Rotate to face direction of travel
            const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
            arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            
            requestAnimationFrame(animateProjectile);
        };
        
        animateProjectile();
        
        // Play sound
        if (this.voxelWorld.sfxSystem) {
            try {
                this.voxelWorld.sfxSystem.playSpatial('ghost', startPos, playerPos, {
                    maxDistance: 30,
                    volume: 0.5,
                    pitchVariation: 0.3
                });
            } catch (error) {
                console.warn('Ice projectile sound error:', error);
            }
        }
    }
    
    /**
     * Update all colored ghosts (AI, animation, sound)
     */
    update(deltaTime) {
        if (!this.voxelWorld?.camera?.position) return; // Safety check
        
        this.time += deltaTime;
        
        const playerPos = this.voxelWorld.camera.position;
        
        this.ghosts.forEach((ghost) => {
            if (!ghost || ghost.isDead) return;
            
            // Calculate distance to player (3D distance including Y)
            const dx = playerPos.x - ghost.sprite.position.x;
            const dy = playerPos.y - ghost.sprite.position.y;
            const dz = playerPos.z - ghost.sprite.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Check if in attack range - swap to attack pose
            const attackRange = ghost.behavior.attackRange || this.config.attackRange;
            const wasAttacking = ghost.isAttacking;
            ghost.isAttacking = distance <= attackRange;
            
            if (ghost.isAttacking && !wasAttacking) {
                // Lazy load attack texture on first use
                if (!ghost.attackTexture) {
                    ghost.attackTexture = this.createAttackTexture();
                }
                // Swap to attack texture (preserve color tint)
                ghost.sprite.material.map = ghost.attackTexture;
                ghost.sprite.material.needsUpdate = true;
            } else if (!ghost.isAttacking && wasAttacking) {
                // Swap back to normal texture
                ghost.sprite.material.map = ghost.normalTexture;
                ghost.sprite.material.needsUpdate = true;
            }
            
            // Behavior-specific AI
            if (distance < this.config.followRange) {
                this.updateGhostBehavior(ghost, playerPos, distance, dx, dy, dz, deltaTime);
                ghost.isFollowing = true;
            } else {
                // Idle wander when far from player
                ghost.wanderChangeTime -= deltaTime;
                if (ghost.wanderChangeTime <= 0) {
                    ghost.wanderAngle = Math.random() * Math.PI * 2;
                    ghost.wanderChangeTime = 2 + Math.random() * 3; // 2-5 seconds
                }
                
                ghost.sprite.position.x += Math.cos(ghost.wanderAngle) * this.config.idleWanderSpeed;
                ghost.sprite.position.z += Math.sin(ghost.wanderAngle) * this.config.idleWanderSpeed;
                ghost.hitbox.position.x = ghost.sprite.position.x;
                ghost.hitbox.position.z = ghost.sprite.position.z;
                
                ghost.isFollowing = false;
            }
            
            // Floating animation (AFTER AI movement)
            const floatY = ghost.baseY + Math.sin(this.time * this.config.floatSpeed + ghost.floatOffset) * this.config.floatAmount;
            ghost.sprite.position.y = floatY;
            ghost.hitbox.position.y = floatY;
            
            // Play sound occasionally when close
            this.playGhostSound(ghost, playerPos, distance);
        });
    }
    
    /**
     * Play ghost sound occasionally when close to player
     */
    playGhostSound(ghost, playerPos, distance) {
        if (!ghost || !playerPos) return; // Safety check
        
        const now = Date.now();
        if (now - this.lastGhostSound < this.ghostSoundCooldown) return;
        if (distance > 30) return; // Too far
        
        if (this.voxelWorld?.sfxSystem) {
            try {
                this.voxelWorld.sfxSystem.playSpatial('ghost', ghost.sprite.position, playerPos, {
                    maxDistance: 30,
                    volume: 0.8,
                    pitchVariation: 0.15
                });
                
                this.lastGhostSound = now;
            } catch (error) {
                console.warn('Ghost sound error:', error);
            }
        }
    }
    
    /**
     * Check if weapon hit any ghost
     * Called from weapon systems (pickaxe, spear, etc.)
     */
    checkHit(weaponPosition, weaponRange = 3) {
        for (const [ghostId, ghost] of this.ghosts) {
            if (ghost.isDead) continue;
            
            const distance = ghost.hitbox.position.distanceTo(weaponPosition);
            
            if (distance <= weaponRange) {
                this.onGhostHit(ghost);
                return true; // Hit detected
            }
        }
        
        return false; // No hit
    }
    
    /**
     * Handle ghost being hit
     */
    onGhostHit(ghost) {
        console.log(`👻 ${ghost.color.name} ghost hit!`);
        
        ghost.isDead = true;
        
        // Particle burst
        this.createHitParticles(ghost.sprite.position, ghost.color.hex);
        
        // Sound effect
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.play('ghost', {
                volume: 0.8,
                rate: 1.2 // Higher pitch
            });
        }
        
        // Remove from scene
        this.scene.remove(ghost.sprite);
        this.scene.remove(ghost.hitbox);
        
        // Cleanup
        ghost.sprite.material.dispose();
        ghost.sprite.material.map.dispose();
        ghost.hitbox.geometry.dispose();
        ghost.hitbox.material.dispose();
        
        // Remove from registry
        this.ghosts.delete(ghost.id);
        
        // Notify hunt system
        if (this.spectralHuntSystem) {
            this.spectralHuntSystem.onGhostKilled(ghost);
        }
    }
    
    /**
     * Create particle burst on hit
     */
    createHitParticles(position, color) {
        // TODO: Particle system
        // For now, just log
        console.log(`✨ Particle burst at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
    }
    
    /**
     * Remove a specific ghost (when defeated)
     */
    removeGhost(ghostId) {
        const ghost = this.ghosts.get(ghostId);
        if (!ghost) return;
        
        console.log(`👻 Removing colored ghost: ${ghost.color.name} (${ghostId})`);
        
        // Remove from scene
        this.scene.remove(ghost.sprite);
        this.scene.remove(ghost.hitbox);
        
        // Dispose materials and geometries
        ghost.sprite.material.dispose();
        ghost.sprite.material.map.dispose();
        ghost.hitbox.geometry.dispose();
        ghost.hitbox.material.dispose();
        
        // Remove from map
        this.ghosts.delete(ghostId);
        
        // Particle effect (use VoxelWorld's explosion effect)
        if (this.voxelWorld.createExplosionEffect) {
            this.voxelWorld.createExplosionEffect(
                ghost.sprite.position.x,
                ghost.sprite.position.y,
                ghost.sprite.position.z,
                'ghost_death'
            );
        }
        
        // Play death sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.playSpatial('ghost_death', ghost.sprite.position, this.voxelWorld.camera.position, {
                maxDistance: 40,
                volume: 0.6,
                pitchVariation: 0.3
            });
        }
    }
    
    /**
     * Cleanup all ghosts
     */
    cleanup() {
        console.log(`👻 Cleaning up ${this.ghosts.size} colored ghosts`);
        
        this.ghosts.forEach((ghost) => {
            this.scene.remove(ghost.sprite);
            this.scene.remove(ghost.hitbox);
            
            ghost.sprite.material.dispose();
            ghost.sprite.material.map.dispose();
            ghost.hitbox.geometry.dispose();
            ghost.hitbox.material.dispose();
        });
        
        this.ghosts.clear();
    }
    
    /**
     * Dispose
     */
    dispose() {
        this.cleanup();
    }
}
