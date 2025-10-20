/**
 * 💣 DEMOLITION CHARGE THROWING SYSTEM
 * 
 * Handles demolition charge projectile mechanics with sweet spot timing:
 * - Hold right-click to charge throw with visual sweet spot
 * - Release to throw with grenade arc
 * - Sweet spot accuracy: closer targets = easier, far targets = harder
 * - Collision detection: sticks to blocks mid-flight (leaves, walls, etc.)
 * - 3-second countdown after landing/sticking
 * - Missed throws still explode (player chases their mistake!)
 */

import * as THREE from 'three';

export class DemolitionChargeSystem {
    constructor(voxelWorld, craftedTools) {
        this.voxelWorld = voxelWorld;
        this.craftedTools = craftedTools;
        this.thrownCharges = []; // Array of {mesh, position, countdown, explodeTime}
        
        // 🎯 SWEET SPOT CHARGING MECHANIC
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeDuration = 3000; // 3 seconds (slower than spear)
        this.targetPos = null;
        this.sweetSpotCenter = 0.5;
        this.sweetSpotSize = 0.4;
        
        console.log('💣 DemolitionChargeSystem initialized');
    }

    /**
     * Start charging a demolition charge throw
     * @param {object} targetPos - Raycast target position {x, y, z}
     */
    startCharging(targetPos) {
        const selectedSlot = this.voxelWorld.hotbarSystem.getSelectedSlot();
        const selectedItem = selectedSlot?.itemType;

        // Check if holding a demolition charge
        const isDemolitionCharge = selectedItem === 'demolition_charge' || 
                                   selectedItem === 'crafted_demolition_charge';

        if (!isDemolitionCharge || selectedSlot.quantity < 1) {
            return false;
        }

        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.targetPos = targetPos;
        
        // Calculate sweet spot based on distance
        const playerPos = this.voxelWorld.camera.position;
        const distance = Math.sqrt(
            Math.pow(targetPos.x - playerPos.x, 2) +
            Math.pow(targetPos.z - playerPos.z, 2)
        );
        
        // Sweet spot size: 40% at 0 blocks, 15% at 100+ blocks
        this.sweetSpotSize = Math.max(0.15, 0.4 - (distance / 250));
        
        // Sweet spot center: shifts slightly left/right of 50%
        this.sweetSpotCenter = 0.5 + (Math.random() - 0.5) * 0.2; // 40-60%
        
        console.log(`💣 Charging throw: ${distance.toFixed(1)} blocks, sweet spot: ${(this.sweetSpotSize * 100).toFixed(0)}%`);
        
        // Show charge indicator with sweet spot
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.showChargeIndicator();
        }
        
        return true;
    }

    /**
     * Release charged throw
     */
    releaseThrow() {
        if (!this.isCharging) {
            return false;
        }

        const chargeDuration = Date.now() - this.chargeStartTime;
        const chargePercent = Math.min(chargeDuration / this.maxChargeDuration, 1.0);
        
        // Calculate if player hit the sweet spot
        const sweetSpotMin = this.sweetSpotCenter - this.sweetSpotSize / 2;
        const sweetSpotMax = this.sweetSpotCenter + this.sweetSpotSize / 2;
        const hitSweetSpot = chargePercent >= sweetSpotMin && chargePercent <= sweetSpotMax;
        
        // Accuracy: 1.0 = perfect, 0.3 = way off
        let accuracy;
        if (hitSweetSpot) {
            // Perfect! Calculate how centered in sweet spot
            const centerOffset = Math.abs(chargePercent - this.sweetSpotCenter) / (this.sweetSpotSize / 2);
            accuracy = 1.0 - (centerOffset * 0.2); // 0.8 to 1.0
        } else {
            // Missed sweet spot - calculate how far off
            const missAmount = Math.min(
                Math.abs(chargePercent - sweetSpotMin),
                Math.abs(chargePercent - sweetSpotMax)
            );
            accuracy = Math.max(0.2, 0.6 - missAmount * 2); // 0.2 to 0.6
        }

        this.isCharging = false;
        
        // Hide charge indicator
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.hideChargeIndicator();
        }
        
        console.log(`💣 Released: ${(chargePercent * 100).toFixed(0)}% charge, accuracy: ${(accuracy * 100).toFixed(0)}%, sweet spot: ${hitSweetSpot ? '✓ HIT' : '✗ MISS'}`);
        
        // Throw the charge!
        this.throwCharge(this.targetPos, accuracy);
        
        return true;
    }

    /**
     * Cancel charging (if player switches items, etc.)
     */
    cancelCharging() {
        if (this.isCharging) {
            this.isCharging = false;
            if (this.voxelWorld.staminaSystem) {
                this.voxelWorld.staminaSystem.hideChargeIndicator();
            }
            console.log('💣 Demolition charge throw cancelled');
        }
    }

    /**
     * Throw a demolition charge with grenade arc
     * @param {object} targetPos - Target position {x, y, z}
     * @param {number} accuracy - Accuracy (0.2 to 1.0)
     */
    throwCharge(targetPos, accuracy) {
        const selectedSlot = this.voxelWorld.hotbarSystem.getSelectedSlot();
        const selectedItem = selectedSlot?.itemType;

        // Check if holding a charge
        const isDemolitionCharge = selectedItem === 'demolition_charge' || 
                                   selectedItem === 'crafted_demolition_charge';

        if (!isDemolitionCharge) {
            this.voxelWorld.updateStatus('❌ No demolition charge equipped!', 'error');
            return false;
        }

        if (selectedSlot.quantity < 1) {
            this.voxelWorld.updateStatus('❌ No charges left!', 'error');
            return false;
        }

        // Get player position (eye level for throwing)
        const startPos = {
            x: this.voxelWorld.camera.position.x,
            y: this.voxelWorld.camera.position.y,
            z: this.voxelWorld.camera.position.z
        };

        // Apply accuracy to target position (spread based on accuracy)
        const maxSpread = 5; // Max 5 blocks off-target
        const spread = maxSpread * (1.0 - accuracy);
        const adjustedTarget = {
            x: targetPos.x + (Math.random() - 0.5) * spread * 2,
            y: targetPos.y,
            z: targetPos.z + (Math.random() - 0.5) * spread * 2
        };

        // Create charge projectile
        const chargeMesh = this.createChargeProjectile(startPos);

        const distance = Math.sqrt(
            Math.pow(adjustedTarget.x - startPos.x, 2) +
            Math.pow(adjustedTarget.z - startPos.z, 2)
        );
        
        const accuracyText = accuracy > 0.8 ? '🎯 PERFECT!' : accuracy > 0.6 ? '👍 Good' : '⚠️ Off-target';
        console.log(`💣 Throwing charge: ${distance.toFixed(1)} blocks, accuracy: ${(accuracy * 100).toFixed(0)}% ${accuracyText}`);

        // Use grenade arc animation!
        this.voxelWorld.animationSystem.animateProjectile(
            startPos,
            adjustedTarget,
            0.8, // Duration (slower than spear, visible arc)
            (progress, currentPos) => {
                // Update charge position along arc
                chargeMesh.position.set(currentPos.x, currentPos.y, currentPos.z);
                
                // 🧱 COLLISION DETECTION: Check for blocks in flight path
                if (progress > 0.05) { // Skip first 5% to avoid self-collision
                    const blockX = Math.floor(currentPos.x);
                    const blockY = Math.floor(currentPos.y);
                    const blockZ = Math.floor(currentPos.z);
                    const key = `${blockX},${blockY},${blockZ}`;
                    
                    if (this.voxelWorld.world[key]) {
                        // HIT A BLOCK!
                        console.log(`💣💥 Charge hit block at (${blockX}, ${blockY}, ${blockZ})!`);
                        this.stickChargeToBlock(chargeMesh, currentPos, selectedItem);
                        return true; // Stop animation
                    }
                }
                
                // Rotate slightly for visual effect
                chargeMesh.rotation.y += 0.1;
            },
            () => {
                // On complete: Charge lands on ground
                this.stickChargeToBlock(chargeMesh, adjustedTarget, selectedItem);
            }
        );

        // Consume charge from inventory
        selectedSlot.quantity--;
        
        // Clear slot if empty
        if (selectedSlot.quantity === 0) {
            selectedSlot.itemType = '';
        }
        
        this.voxelWorld.updateHotbarCounts();
        this.voxelWorld.updateStatus(`💣 Demolition charge thrown! ${accuracyText}`, 'action');

        return true;
    }

    /**
     * Create a demolition charge billboard projectile
     */
    createChargeProjectile(position) {
        // Create emoji canvas for 💣
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Clear background
        ctx.clearRect(0, 0, 128, 128);

        // Draw bomb emoji
        ctx.font = '96px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 64, 64);

        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const geometry = new THREE.PlaneGeometry(0.8, 0.8); // Square bomb
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
        });

        const chargeMesh = new THREE.Mesh(geometry, material);
        chargeMesh.position.set(position.x, position.y, position.z);
        chargeMesh.userData.isDemolitionCharge = true;
        chargeMesh.userData.isFlying = true;

        this.voxelWorld.scene.add(chargeMesh);
        console.log(`💣 Created charge projectile at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        return chargeMesh;
    }

    /**
     * Stick charge to block or ground
     */
    stickChargeToBlock(chargeMesh, targetPos, chargeType) {
        // Mark as no longer flying
        chargeMesh.userData.isFlying = false;
        
        // Position at landing spot
        const landY = Math.floor(targetPos.y) + 0.5; // Center on block
        chargeMesh.position.set(
            Math.floor(targetPos.x) + 0.5,
            landY,
            Math.floor(targetPos.z) + 0.5
        );

        // Store charge data for tracking
        const chargeData = {
            mesh: chargeMesh,
            position: { x: Math.floor(targetPos.x), y: Math.floor(landY), z: Math.floor(targetPos.z) },
            landTime: Date.now(),
            explodeTime: Date.now() + 3000, // 3 seconds
            countdown: 3
        };
        
        this.thrownCharges.push(chargeData);

        console.log(`💣 Charge stuck at (${chargeData.position.x}, ${chargeData.position.y}, ${chargeData.position.z}), detonation in 3 seconds...`);
        
        // Start countdown
        this.voxelWorld.updateStatus('💣 Charge armed! 3 seconds...', 'warning');
        
        // Start countdown interval
        chargeData.countdownInterval = setInterval(() => {
            chargeData.countdown--;
            if (chargeData.countdown > 0) {
                this.voxelWorld.updateStatus(`💣 Detonation in ${chargeData.countdown}...`, 'warning');
                
                // Visual pulse effect
                const scale = 1.0 + (Math.sin(Date.now() / 100) * 0.2);
                chargeMesh.scale.set(scale, scale, scale);
            }
        }, 1000);
    }

    /**
     * Update charges and handle detonation
     * Call this in main update loop
     */
    update() {
        // Update charge indicator with sweet spot
        if (this.isCharging) {
            const chargeDuration = Date.now() - this.chargeStartTime;
            const chargePercent = Math.min(chargeDuration / this.maxChargeDuration, 1.0);
            
            // Calculate if in sweet spot
            const sweetSpotMin = this.sweetSpotCenter - this.sweetSpotSize / 2;
            const sweetSpotMax = this.sweetSpotCenter + this.sweetSpotSize / 2;
            const inSweetSpot = chargePercent >= sweetSpotMin && chargePercent <= sweetSpotMax;
            
            // Update visual charge bar with sweet spot highlighting
            if (this.voxelWorld.staminaSystem) {
                this.voxelWorld.staminaSystem.updateChargeIndicatorWithSweetSpot(
                    chargePercent, 
                    this.sweetSpotCenter,
                    this.sweetSpotSize,
                    inSweetSpot
                );
            }
        }
        
        if (this.thrownCharges.length === 0) return;

        const now = Date.now();
        const playerPos = this.voxelWorld.camera.position;

        // Check for detonations
        for (let i = this.thrownCharges.length - 1; i >= 0; i--) {
            const charge = this.thrownCharges[i];

            // Billboard effect - face camera
            if (!charge.mesh.userData.isFlying) {
                charge.mesh.lookAt(playerPos);
            }

            // Check if time to explode
            if (now >= charge.explodeTime) {
                console.log(`💥 BOOM! Charge detonating at (${charge.position.x}, ${charge.position.y}, ${charge.position.z})`);
                
                // Clear countdown
                if (charge.countdownInterval) {
                    clearInterval(charge.countdownInterval);
                }
                
                // Remove mesh
                this.voxelWorld.scene.remove(charge.mesh);
                charge.mesh.geometry.dispose();
                charge.mesh.material.dispose();
                if (charge.mesh.material.map) {
                    charge.mesh.material.map.dispose();
                }
                
                // EXPLODE!
                if (this.craftedTools) {
                    this.craftedTools.detonate(charge.position.x, charge.position.y, charge.position.z, 4);
                }
                
                this.voxelWorld.updateStatus('💥 BOOM! Demolition successful!', 'discovery');
                
                // Remove from tracking
                this.thrownCharges.splice(i, 1);
            }
        }
    }
}
