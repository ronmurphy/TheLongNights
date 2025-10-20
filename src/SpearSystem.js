/**
 * 🗡️ SPEAR THROWING SYSTEM
 * 
 * Handles spear projectile mechanics:
 * - Throw spear at target location (uses existing trajectory animation)
 * - Spear sticks in ground as billboard
 * - Player can pick up thrown spears
 * - No durability - spears are reusable
 */

import * as THREE from 'three';

export class SpearSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.thrownSpears = []; // Array of {mesh, position, chunkKey}
        this.pickupDistance = 2; // Blocks away to pick up
        
        // 🎯 CHARGING MECHANIC
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeDuration = 2000; // 2 seconds max charge
        this.chargeIndicator = null; // Visual indicator
        
        console.log('🗡️ SpearSystem initialized');
    }

    /**
     * Start charging a spear throw with sweet spot targeting
     */
    startCharging() {
        const selectedSlot = this.voxelWorld.hotbarSystem.getSelectedSlot();
        const selectedItem = selectedSlot?.itemType;

        // Check if holding a spear
        const isSpear = selectedItem === 'stone_spear' || 
                       selectedItem === 'crafted_stone_spear';

        if (!isSpear || selectedSlot.quantity < 1) {
            return false;
        }

        this.isCharging = true;
        this.chargeStartTime = Date.now();
        
        // 🎯 Calculate sweet spot (shifts dynamically)
        this.sweetSpotSize = 0.25; // 25% sweet spot for spears (moderate difficulty)
        this.sweetSpotCenter = 0.5 + (Math.random() - 0.5) * 0.2; // 40-60%
        
        // Show charge indicator
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.showChargeIndicator();
        }
        
        console.log(`🗡️ Started charging spear throw... Sweet spot: ${(this.sweetSpotSize * 100).toFixed(0)}%`);
        
        return true;
    }

    /**
     * Release charged throw with sweet spot accuracy
     */
    releaseThrow(targetPos) {
        if (!this.isCharging) {
            return false;
        }

        const chargeDuration = Date.now() - this.chargeStartTime;
        const chargePercent = Math.min(chargeDuration / this.maxChargeDuration, 1.0);
        
        // 🎯 Check if player hit the sweet spot
        const sweetSpotMin = this.sweetSpotCenter - this.sweetSpotSize / 2;
        const sweetSpotMax = this.sweetSpotCenter + this.sweetSpotSize / 2;
        const hitSweetSpot = chargePercent >= sweetSpotMin && chargePercent <= sweetSpotMax;
        
        // Power scaling based on sweet spot accuracy
        let power;
        if (hitSweetSpot) {
            // Perfect! Full power range 1.5x to 2.0x
            const centerOffset = Math.abs(chargePercent - this.sweetSpotCenter) / (this.sweetSpotSize / 2);
            power = 2.0 - (centerOffset * 0.5); // 1.5x to 2.0x
        } else {
            // Missed sweet spot - reduced power 0.5x to 1.2x
            const missAmount = Math.min(
                Math.abs(chargePercent - sweetSpotMin),
                Math.abs(chargePercent - sweetSpotMax)
            );
            power = 0.5 + (0.7 * (1.0 - Math.min(missAmount * 2, 1.0))); // 0.5x to 1.2x
        }
        
        // Stamina cost: 5 base + (power * 10) = 5 to 25 stamina
        const staminaCost = Math.floor(5 + (power * 10));

        this.isCharging = false;
        
        // Hide charge indicator
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.hideChargeIndicator();
        }
        
        const accuracyText = hitSweetSpot ? '🎯 PERFECT!' : '⚠️ Off-target';
        console.log(`🗡️ Released: ${(chargePercent * 100).toFixed(0)}% charge, ${power.toFixed(1)}x power, ${staminaCost} stamina, ${accuracyText}`);
        
        // Check stamina
        if (this.voxelWorld.staminaSystem && this.voxelWorld.staminaSystem.currentStamina < staminaCost) {
            this.voxelWorld.updateStatus('❌ Not enough stamina to throw!', 'error');
            return false;
        }

        // Throw with power multiplier
        this.throwSpear(targetPos, power, staminaCost);
        
        return true;
    }

    /**
     * Cancel charging (if player switches items, etc.)
     */
    cancelCharging() {
        if (this.isCharging) {
            this.isCharging = false;
            console.log('🗡️ Spear throw cancelled');
        }
    }

    /**
     * Throw a spear from player position to target
     * @param {Object} targetPos - {x, y, z} target position
     * @param {number} power - Power multiplier (0.5 to 2.0)
     * @param {number} staminaCost - Stamina to consume
     */
    throwSpear(targetPos, power = 1.0, staminaCost = 5) {
        const selectedSlot = this.voxelWorld.hotbarSystem.getSelectedSlot();
        const selectedItem = selectedSlot?.itemType; // FIX: Use itemType not type!

        // Check if holding a spear
        const isSpear = selectedItem === 'stone_spear' || 
                       selectedItem === 'crafted_stone_spear';

        if (!isSpear) {
            this.voxelWorld.updateStatus('❌ No spear equipped!', 'error');
            return false;
        }

        if (selectedSlot.quantity < 1) {
            this.voxelWorld.updateStatus('❌ No spears left!', 'error');
            return false;
        }

        // Get player position (eye level for throwing)
        const startPos = {
            x: this.voxelWorld.camera.position.x,
            y: this.voxelWorld.camera.position.y,
            z: this.voxelWorld.camera.position.z
        };

        // Apply power multiplier to target distance
        const direction = {
            x: targetPos.x - startPos.x,
            y: targetPos.y - startPos.y,
            z: targetPos.z - startPos.z
        };

        // Extend target position based on power
        const poweredTarget = {
            x: startPos.x + (direction.x * power),
            y: startPos.y + (direction.y * power),
            z: startPos.z + (direction.z * power)
        };

        // Create spear projectile billboard
        const spearMesh = this.createSpearProjectile(startPos);

        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        console.log(`🗡️ Throwing spear with ${power.toFixed(1)}x power (${distance.toFixed(1)} → ${(distance * power).toFixed(1)} blocks), -${staminaCost} stamina`);

        // Use grappling hook animation for trajectory!
        this.voxelWorld.animationSystem.animateProjectile(
            startPos,
            poweredTarget, // Use powered target instead
            0.6, // Duration (faster than grapple)
            (progress, currentPos) => {
                // Update spear position along curve
                spearMesh.position.set(currentPos.x, currentPos.y, currentPos.z);
                
                // 🐰 Check for animal collision during flight
                if (this.voxelWorld.animalSystem && progress > 0.1) {
                    const spearPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
                    const animals = this.voxelWorld.animalSystem.getAnimals();
                    
                    for (const animal of animals) {
                        if (!animal.alive || animal.state === 'hunted') continue;
                        
                        const distance = spearPos.distanceTo(animal.position);
                        if (distance < 1.5) { // Hit detection range
                            // HIT!
                            this.voxelWorld.animalSystem.hitAnimal(animal.billboard, 1);
                            
                            // Stop animation early, spear lands where animal was
                            this.stickSpearInGround(spearMesh, {
                                x: animal.position.x,
                                y: animal.position.y,
                                z: animal.position.z
                            }, selectedItem);
                            
                            console.log(`🎯 Spear hit ${animal.type}!`);
                            return true; // Stop animation callback
                        }
                    }
                }
                
                // 🩸 Check for blood moon enemy collision during flight
                if (this.voxelWorld.bloodMoonSystem && progress > 0.1) {
                    const spearPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
                    const enemies = this.voxelWorld.bloodMoonSystem.activeEnemies;
                    
                    for (const [enemyId, enemy] of enemies) {
                        if (enemy.health <= 0) continue;
                        
                        const enemyPos = enemy.sprite.position;
                        const distance = spearPos.distanceTo(enemyPos);
                        if (distance < 1.5) { // Hit detection range
                            // HIT!
                            console.log(`🎯 Spear hit ${enemy.entityType}!`);
                            this.voxelWorld.bloodMoonSystem.hitEnemy(enemyId, 1);
                            
                            // Stop animation early, spear lands where enemy was
                            this.stickSpearInGround(spearMesh, {
                                x: enemyPos.x,
                                y: enemyPos.y,
                                z: enemyPos.z
                            }, selectedItem);
                            
                            return true; // Stop animation callback
                        }
                    }
                }
                
                // Make spear point in direction of travel (optional rotation)
                if (progress > 0.01) {
                    const prevPos = spearMesh.userData.prevPos || startPos;
                    const direction = new THREE.Vector3(
                        currentPos.x - prevPos.x,
                        currentPos.y - prevPos.y,
                        currentPos.z - prevPos.z
                    ).normalize();
                    
                    // Rotate spear to point forward
                    spearMesh.lookAt(
                        spearMesh.position.x + direction.x,
                        spearMesh.position.y + direction.y,
                        spearMesh.position.z + direction.z
                    );
                    spearMesh.rotateX(Math.PI / 2); // Adjust for billboard orientation
                }
                
                spearMesh.userData.prevPos = {...currentPos};
            },
            () => {
                // On complete: Stick spear in ground (use powered target)
                this.stickSpearInGround(spearMesh, poweredTarget, selectedItem);
            }
        );

        // Consume stamina
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.currentStamina = Math.max(
                0, 
                this.voxelWorld.staminaSystem.currentStamina - staminaCost
            );
        }

        // Remove spear from inventory (will be picked up later)
        selectedSlot.quantity--;
        
        // Clear slot if empty
        if (selectedSlot.quantity === 0) {
            selectedSlot.itemType = '';
        }
        
        this.voxelWorld.updateHotbarCounts();
        this.voxelWorld.updateStatus(`🗡️ Spear thrown! (-${staminaCost} stamina)`, 'action');

        return true;
    }

    /**
     * Create a spear billboard projectile
     */
    createSpearProjectile(position) {
        // Use cached texture or create new one
        const textureKey = 'stone_spear';
        let texture;

        // Check if cache exists first (it's initialized in The Long Nights constructor)
        if (this.voxelWorld.billboardTextureCache && this.voxelWorld.billboardTextureCache.has(textureKey)) {
            texture = this.voxelWorld.billboardTextureCache.get(textureKey);
        } else {
            // Use EnhancedGraphics to get proper path
            let texturePath = 'assets/art/tools/stone_spear.png'; // Fallback
            
            if (this.voxelWorld.enhancedGraphics && this.voxelWorld.enhancedGraphics.isReady()) {
                if (this.voxelWorld.enhancedGraphics.toolImages.has(textureKey)) {
                    const imageData = this.voxelWorld.enhancedGraphics.toolImages.get(textureKey);
                    texturePath = imageData.path;
                }
            }
            
            texture = this.voxelWorld.textureLoader.load(texturePath);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            // Cache if possible
            if (this.voxelWorld.billboardTextureCache) {
                this.voxelWorld.billboardTextureCache.set(textureKey, texture);
            }
        }

        // Create billboard (larger and more visible during flight)
        const geometry = new THREE.PlaneGeometry(0.6, 1.8); // Larger: 0.6x1.8 blocks
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: true, // Ensure proper depth sorting
            depthTest: true
        });

        const spearMesh = new THREE.Mesh(geometry, material);
        spearMesh.position.set(position.x, position.y, position.z);
        spearMesh.userData.isSpear = true;
        spearMesh.userData.prevPos = position;
        spearMesh.userData.isFlying = true; // Track if currently in flight

        this.voxelWorld.scene.add(spearMesh);
        console.log(`🗡️ Created spear projectile at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        return spearMesh;
    }

    /**
     * Stick spear in ground at target position
     */
    stickSpearInGround(spearMesh, targetPos, spearType) {
        // Mark as no longer flying
        spearMesh.userData.isFlying = false;
        
        // Position spear at ground level, slightly raised
        const groundY = Math.floor(targetPos.y) + 0.8; // Raised more to be visible
        spearMesh.position.set(
            targetPos.x,
            groundY,
            targetPos.z
        );

        // Reset rotation and tilt spear (45 degrees forward tilt)
        spearMesh.rotation.set(Math.PI / 4, 0, 0);

        // Make it always face camera and harvestable like world items
        spearMesh.userData.isBillboard = true;
        spearMesh.userData.type = 'worldItem'; // Make it harvestable!
        spearMesh.userData.itemType = spearType;
        spearMesh.userData.quantity = 1;

        // Store in thrown spears array for tracking/cleanup
        const chunkX = Math.floor(targetPos.x / 16);
        const chunkZ = Math.floor(targetPos.z / 16);
        const chunkKey = `${chunkX},${chunkZ}`;

        this.thrownSpears.push({
            mesh: spearMesh,
            position: {x: targetPos.x, y: groundY, z: targetPos.z},
            chunkKey: chunkKey,
            spearType: spearType
        });

        console.log(`🗡️ Spear stuck in ground at (${targetPos.x.toFixed(1)}, ${groundY.toFixed(1)}, ${targetPos.z.toFixed(1)}) - Chunk ${chunkKey}`);
    }

    /**
     * Update spear billboards and charge indicator
     * Call this in main update loop
     */
    update(deltaTime) {
        // Update charge indicator with sweet spot visualization
        if (this.isCharging && this.voxelWorld.staminaSystem) {
            const elapsed = Date.now() - this.chargeStartTime;
            const percent = Math.min(elapsed / this.maxChargeDuration, 1.0);
            
            // 🎯 Check if in sweet spot
            const sweetSpotMin = this.sweetSpotCenter - this.sweetSpotSize / 2;
            const sweetSpotMax = this.sweetSpotCenter + this.sweetSpotSize / 2;
            const inSweetSpot = percent >= sweetSpotMin && percent <= sweetSpotMax;
            
            this.voxelWorld.staminaSystem.updateChargeIndicatorWithSweetSpot(
                percent,
                this.sweetSpotCenter,
                this.sweetSpotSize,
                inSweetSpot
            );
        }

        // Update flying spears (billboard facing)
        for (const spearData of this.thrownSpears) {
            if (spearData.mesh.userData.isBillboard && !spearData.mesh.userData.isFlying) {
                // Make spear face camera (billboard effect) when stuck in ground
                const cameraPos = this.voxelWorld.camera.position;
                const dx = cameraPos.x - spearData.mesh.position.x;
                const dz = cameraPos.z - spearData.mesh.position.z;
                const angle = Math.atan2(dx, dz);
                spearData.mesh.rotation.y = angle;
            }
        }
    }

    /**
     * Remove a spear from tracking when harvested
     * Called by The Long Nights when spear is harvested like a world item
     */
    removeSpear(spearMesh) {
        const index = this.thrownSpears.findIndex(s => s.mesh === spearMesh);
        if (index !== -1) {
            this.thrownSpears.splice(index, 1);
            console.log(`🗡️ Spear harvested! ${this.thrownSpears.length} spears remaining in world`);
        }
    }

    /**
     * Remove spears from unloaded chunks (cleanup)
     */
    cleanupUnloadedChunks(activeChunks) {
        for (let i = this.thrownSpears.length - 1; i >= 0; i--) {
            const spear = this.thrownSpears[i];
            if (!activeChunks.has(spear.chunkKey)) {
                // Chunk unloaded, remove spear (could save to disk in future)
                this.voxelWorld.scene.remove(spear.mesh);
                spear.mesh.geometry.dispose();
                spear.mesh.material.dispose();
                this.thrownSpears.splice(i, 1);
                console.log(`🗡️ Removed spear from unloaded chunk ${spear.chunkKey}`);
            }
        }
    }
}
