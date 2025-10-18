/**
 * CraftedTools.js
 *
 * Handles special behaviors for crafted tools and equipment
 * Extracted from The Long Nights.js to improve code organization
 */

import * as THREE from 'three';

export class CraftedTools {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.activeDemolitionCharges = []; // Track placed charges for combo system
        this.isClimbing = false; // Track if player is wall climbing
    }

    /**
     * 🧗 DISABLED: Climbing claws system - too many issues with key detection and physics
     * Kept for future reference if we want to revisit this feature
     */
    updateClimbingClaws() {
        // DISABLED - feature not working reliably
        return;

        /* ORIGINAL CODE - DISABLED
        // Must be ACTIVELY SELECTED in hotbar (uses HotbarSystem's getSelectedSlot for proper detection)
        const selectedSlot = this.voxelWorld.hotbarSystem?.getSelectedSlot();
        const selectedBlock = selectedSlot?.itemType;

        const hasClawsSelected = selectedBlock === 'climbing_claws' ||
                                selectedBlock === 'crafted_climbing_claws';

        if (!hasClawsSelected) {
            this.isClimbing = false;
            return;
        }

        // Check if player is pressing W (forward movement) for climbing
        const keys = this.voxelWorld.keys || {};
        const wPressed = keys["w"];

        if (wPressed) {
            const playerPos = this.voxelWorld.player.position;
            const playerRotation = this.voxelWorld.player.rotation.y;

            // Calculate forward direction based on player rotation
            const forwardX = Math.sin(playerRotation);
            const forwardZ = Math.cos(playerRotation);

            // Check for wall directly in front of player (1 block ahead)
            const checkDistance = 0.6; // Detection distance
            const checkX = playerPos.x + (forwardX * checkDistance);
            const checkZ = playerPos.z + (forwardZ * checkDistance);

            const checkXFloor = Math.floor(checkX);
            const checkYFloor = Math.floor(playerPos.y);
            const checkZFloor = Math.floor(checkZ);

            // Check current height and 1 block above for wall
            const blockAtEyeLevel = this.voxelWorld.getBlock(
                checkXFloor,
                checkYFloor,
                checkZFloor
            );

            const blockAbove = this.voxelWorld.getBlock(
                checkXFloor,
                checkYFloor + 1,
                checkZFloor
            );

            // Non-climbable blocks
            const nonClimbable = ['air', 'water', undefined, null];

            // Check if there's a wall in front and no overhang blocking from above
            const wallInFront = blockAtEyeLevel && !nonClimbable.includes(blockAtEyeLevel);
            const noOverhang = !blockAbove || nonClimbable.includes(blockAbove);

            if (wallInFront && noOverhang) {
                // Climb up the wall - override gravity with upward velocity
                this.voxelWorld.player.velocity = 5.0; // Climb speed (same as jump speed)
                this.isClimbing = true;

                // Optional: Show climbing message
                if (!this.lastClimbMessage || Date.now() - this.lastClimbMessage > 3000) {
                    this.voxelWorld.updateStatus('🧗 Climbing with claws!', 'discovery');
                    this.lastClimbMessage = Date.now();
                }
            } else if (wallInFront && !noOverhang) {
                // Wall with overhang - can't climb
                this.isClimbing = false;
                if (!this.lastOverhangWarning || Date.now() - this.lastOverhangWarning > 2000) {
                    this.voxelWorld.updateStatus('⚠️ Overhang blocking climb!', 'error');
                    this.lastOverhangWarning = Date.now();
                }
            } else {
                // No wall to climb
                this.isClimbing = false;
            }
        } else {
            this.isClimbing = false;
        }

        // 🛡️ NO FALL DAMAGE: Works even if not selected, just in inventory
        const hasClawsAnywhere = this.checkForClimbingClaws();
        if (hasClawsAnywhere && this.voxelWorld.player.velocity && this.voxelWorld.player.velocity < -0.5) {
            // Player is falling fast - prepare to negate fall damage
            this.voxelWorld.player.userData = this.voxelWorld.player.userData || {};
            this.voxelWorld.player.userData.hasClimbingClaws = true;
        }
        */
    }

    /**
     * 🧗 Check if player has climbing claws anywhere in inventory
     */
    checkForClimbingClaws() {
        if (!this.voxelWorld.inventory) return false;

        const checkSlots = [
            ...(this.voxelWorld.inventory.hotbarSlots || []),
            ...(this.voxelWorld.inventory.backpackSlots || [])
        ];

        for (const slot of checkSlots) {
            if (slot.itemType === 'climbing_claws' || slot.itemType === 'crafted_climbing_claws') {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle left-click actions for crafted tools
     * @param {object} selectedSlot - The currently selected hotbar slot
     * @param {object} pos - Click position {x, y, z}
     * @returns {boolean} - true if tool action was handled, false to continue with default behavior
     */
    handleLeftClick(selectedSlot, pos) {
        const selectedItem = selectedSlot?.itemType;

        // 🔨 STONE HAMMER COMBAT: AoE melee weapon
        const isStoneHammer = selectedItem === 'stone_hammer' || selectedItem === 'crafted_stone_hammer';
        if (isStoneHammer && this.voxelWorld.bloodMoonSystem) {
            const hitEnemy = this.checkMeleeAttack(pos, 3, 2); // 3 damage, radius 2 (AoE)
            if (hitEnemy) {
                this.voxelWorld.createExplosionEffect(pos.x, pos.y, pos.z, 'stone');
                this.voxelWorld.updateStatus('🔨 Stone Hammer smash!', 'combat');
                return false; // Continue to harvesting (dual function!)
            }
        }

        // 🪓 TREE FELLER COMBAT: High damage cleave
        const isTreeFeller = selectedItem === 'tree_feller' || selectedItem === 'crafted_tree_feller';
        if (isTreeFeller && this.voxelWorld.bloodMoonSystem) {
            const hitEnemy = this.checkMeleeAttack(pos, 4, 1.5); // 4 damage, single target
            if (hitEnemy) {
                this.voxelWorld.createExplosionEffect(pos.x, pos.y, pos.z, 'slash');
                this.voxelWorld.updateStatus('🪓 Battle Axe cleave!', 'combat');
                return false; // Continue to tree felling (dual function!)
            }
        }

        // 🪓 TREE FELLER: One-hit entire tree harvest
        const isTreeFellerSelected = selectedItem === 'tree_feller' || selectedItem === 'crafted_tree_feller';

        if (isTreeFellerSelected) {
            const blockX = Math.floor(pos.x);
            const blockY = Math.floor(pos.y);
            const blockZ = Math.floor(pos.z);
            const blockData = this.voxelWorld.getBlock(blockX, blockY, blockZ);
            const blockType = blockData?.type || blockData;

            // 🎄 PROTECT MEGA DOUGLAS FIR (CHRISTMAS TREE) - magical and indestructible!
            if (this.voxelWorld.christmasSystem && this.voxelWorld.christmasSystem.isMegaFirBlock(blockX, blockY, blockZ)) {
                this.voxelWorld.updateStatus(`🎄 The Christmas tree is magical and indestructible!`, 'warning');
                return true; // Block the action
            }

            // Check if block is a tree (wood block)
            const isWoodBlock = this.voxelWorld.isWoodBlock(blockType);

            if (isWoodBlock) {
                // Get tree ID from block
                const treeId = this.voxelWorld.getTreeIdFromBlock(blockX, blockY, blockZ);

                if (treeId) {
                    // Instant tree harvest!
                    this.fellEntireTree(treeId, blockX, blockY, blockZ);
                    this.voxelWorld.updateStatus(`🪓 TIMBER! Tree felled instantly!`, 'discovery');
                    return true;
                } else {
                    // Not a registered tree - must be player-placed wood
                    this.voxelWorld.updateStatus(`🪓 Tree Feller only works on natural trees!`, 'warning');
                    return true;
                }
            } else {
                // Non-tree block - apply 3x harvest time penalty
                // Return false to continue with default harvesting, but modify the harvest time
                this.voxelWorld.treeFellerPenalty = true; // Flag for harvest time calculation
                this.voxelWorld.updateStatus(`🪓 Tree Feller works best on trees...`, 'warning');
                return false; // Let default harvesting handle this, but slower
            }
        }

        // 🌾 HOE TILLING: Only when hoe is SELECTED in hotbar (Minecraft-style)
        const isHoeSelected = selectedItem === 'hoe' || selectedItem === 'crafted_hoe';

        if (isHoeSelected) {
            const blockData = this.voxelWorld.getBlock(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
            const blockType = blockData?.type || blockData; // Handle both object and string return

            if (blockType === 'grass' || blockType === 'dirt') {
                // Quick till with hoe - instant action, no harvesting timer
                const success = this.voxelWorld.farmingSystem.handleHoeUse({
                    x: Math.floor(pos.x),
                    y: Math.floor(pos.y),
                    z: Math.floor(pos.z)
                });
                if (success) {
                    this.voxelWorld.updateStatus(`🌾 Soil tilled!`, 'craft');
                }
                return true; // Tool action handled, don't continue to harvesting
            }
        }

        return false; // No tool action, continue with default behavior
    }

    /**
     * Handle right-click actions for crafted tools
     * @param {object} selectedSlot - The currently selected hotbar slot
     * @param {object} pos - Click position {x, y, z}
     * @param {object} placePos - Placement position (pos + normal) {x, y, z}
     * @returns {boolean} - true if tool action was handled, false to continue with default behavior
     */
    handleRightClick(selectedSlot, pos, placePos) {
        const selectedBlock = selectedSlot?.itemType;

        // 🗡️ STONE SPEAR: Charging handled in mousedown/mouseup, skip here
        const isSpear = selectedBlock === 'stone_spear' || selectedBlock === 'crafted_stone_spear';
        if (isSpear) {
            return true; // Prevent block placement
        }

        // 🔮 RECALL STONE: Teleport to campfire
        const isRecallStone = selectedBlock === 'recall_stone' || selectedBlock === 'crafted_recall_stone';
        if (isRecallStone && selectedSlot.quantity > 0) {
            this.useRecallStone();
            return true; // Prevent block placement
        }

        // 🏹 RANGED WEAPONS: Crossbow, Fire Staff, Ice Bow, Throwing Knives
        const isRangedWeapon = selectedBlock === 'crossbow' || selectedBlock === 'crafted_crossbow' ||
                              selectedBlock === 'fire_staff' || selectedBlock === 'crafted_fire_staff' ||
                              selectedBlock === 'ice_bow' || selectedBlock === 'crafted_ice_bow' ||
                              selectedBlock === 'throwing_knives' || selectedBlock === 'crafted_throwing_knives';

        if (isRangedWeapon && selectedSlot.quantity > 0 && pos) {
            this.fireRangedWeapon(selectedBlock, pos);
            return true; // Prevent block placement
        }

        // 🕸️ GRAPPLING HOOK: Check FIRST (before watering can) - consumes on use
        const metadata = this.voxelWorld.inventoryMetadata?.[selectedBlock];
        const isGrapplingHook = metadata?.isGrapplingHook ||
                               selectedBlock === 'grapple_hook' ||
                               selectedBlock === 'grappling_hook' ||
                               selectedBlock === 'crafted_grappling_hook';

        if (isGrapplingHook && selectedSlot.quantity > 0 && placePos) {
            // Calculate target position
            const targetX = Math.floor(placePos.x);
            const targetY = Math.floor(placePos.y) + 2;  // +2 blocks above target to avoid collision
            const targetZ = Math.floor(placePos.z);

            // Get current player position
            const startPos = {
                x: this.voxelWorld.player.position.x,
                y: this.voxelWorld.player.position.y,
                z: this.voxelWorld.player.position.z
            };

            const endPos = {
                x: targetX,
                y: targetY,
                z: targetZ
            };

            console.log(`🕸️ Grappling hook! Animating from (${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)}, ${startPos.z.toFixed(1)}) to (${endPos.x}, ${endPos.y}, ${endPos.z})`);

            // ✨ TRAJECTORY ANIMATION: Smooth arc animation with bezier curve
            this.voxelWorld.animationSystem.animateGrapplingHook(startPos, endPos, 0.8, () => {
                // Animation complete callback
                this.voxelWorld.updateStatus(`🕸️ Grappled to (${endPos.x}, ${endPos.y}, ${endPos.z})!`, 'craft');
            });

            // Consume one grappling hook charge
            selectedSlot.quantity--;

            // Clear slot if empty
            if (selectedSlot.quantity === 0) {
                selectedSlot.itemType = '';
            }

            this.voxelWorld.updateHotbarCounts();
            this.voxelWorld.updateBackpackInventoryDisplay();
            console.log(`🕸️ Grappling hook used, ${selectedSlot.quantity} charges remaining`);
            return true; // Tool action handled, don't continue to block placement
        }

        // 💣 DEMOLITION CHARGE: Place explosive that detonates after 3 seconds
        const isDemolitionCharge = selectedBlock === 'demolition_charge' || selectedBlock === 'crafted_demolition_charge';

        if (isDemolitionCharge && selectedSlot.quantity > 0 && placePos) {
            const chargeX = Math.floor(placePos.x);
            const chargeY = Math.floor(placePos.y);
            const chargeZ = Math.floor(placePos.z);

            console.log(`💣 Placing demolition charge at (${chargeX}, ${chargeY}, ${chargeZ})`);

            // Place a temporary marker block (glowing red)
            this.voxelWorld.addBlock(chargeX, chargeY, chargeZ, 'glowstone', false);

            // 🔥💣 Track charge for combo system
            const chargeData = {
                x: chargeX,
                y: chargeY,
                z: chargeZ,
                radius: 4,
                timestamp: Date.now()
            };
            this.activeDemolitionCharges.push(chargeData);

            // Update status immediately
            this.voxelWorld.updateStatus(`💣 Demolition charge armed! 3 seconds...`, 'warning');

            // Start 3-second countdown
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    this.voxelWorld.updateStatus(`💣 Detonation in ${countdown}...`, 'warning');
                }
            }, 1000);

            // Detonate after 3 seconds
            const timeoutId = setTimeout(() => {
                clearInterval(countdownInterval);

                // Remove marker block
                this.voxelWorld.removeBlock(chargeX, chargeY, chargeZ, false);

                // EXPLODE!
                this.detonate(chargeX, chargeY, chargeZ, 4); // 4-block radius

                // Remove from active charges
                const index = this.activeDemolitionCharges.findIndex(c =>
                    c.x === chargeX && c.y === chargeY && c.z === chargeZ
                );
                if (index !== -1) {
                    this.activeDemolitionCharges.splice(index, 1);
                }

                this.voxelWorld.updateStatus(`💥 BOOM! Demolition successful!`, 'discovery');
            }, 3000);

            // Store timeout ID for early detonation
            chargeData.timeoutId = timeoutId;
            chargeData.countdownInterval = countdownInterval;

            // Consume one demolition charge
            selectedSlot.quantity--;

            // Clear slot if empty
            if (selectedSlot.quantity === 0) {
                selectedSlot.itemType = '';
            }

            this.voxelWorld.updateHotbarCounts();
            this.voxelWorld.updateBackpackInventoryDisplay();
            console.log(`💣 Demolition charge placed, ${selectedSlot.quantity} charges remaining`);
            return true; // Tool action handled, don't continue to block placement
        }

        // 💧 WATERING CAN: Only when watering can is SELECTED in hotbar (Minecraft-style)
        const isWateringCanSelected = selectedBlock === 'watering_can' || selectedBlock === 'crafted_watering_can';

        if (isWateringCanSelected) {
            const blockData = this.voxelWorld.getBlock(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
            const blockType = blockData?.type || blockData; // Handle both object and string return

            // Check if block is a crop (any farming block that is a crop)
            const isCrop = blockType && this.voxelWorld.farmingSystem?.getFarmingBlockTypes()[blockType]?.isCrop;

            if (isCrop) {
                const success = this.voxelWorld.farmingSystem.waterCrop(
                    Math.floor(pos.x),
                    Math.floor(pos.y),
                    Math.floor(pos.z)
                );
                if (success) {
                    this.voxelWorld.updateStatus(`💧 Crop watered!`, 'craft');
                }
                return true; // Tool action handled, don't continue to seed planting or block placement
            }
        }

        return false; // No tool action, continue with default behavior
    }

    /**
     * Check if selected item is a seed (for farming)
     * @param {string} selectedBlock - The selected item type
     * @returns {boolean} - true if item is a seed
     */
    isSeedItem(selectedBlock) {
        return this.voxelWorld.farmingSystem?.isSeedItem(selectedBlock) || false;
    }

    /**
     * Handle seed planting
     * @param {object} pos - Click position {x, y, z}
     * @param {string} selectedBlock - The seed type
     * @returns {boolean} - true if seed was planted
     */
    handleSeedPlanting(pos, selectedBlock) {
        const success = this.voxelWorld.farmingSystem.handleSeedUse({
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)
        }, selectedBlock);

        if (success) {
            // Seed was planted and inventory already updated by farmingSystem
            // Just refresh the UI displays
            this.voxelWorld.updateHotbarCounts();
            this.voxelWorld.updateBackpackInventoryDisplay();
        }

        return success;
    }

    /**
     * 💣 Detonate explosion at position, destroying blocks in radius
     * @param {number} centerX - Explosion center X
     * @param {number} centerY - Explosion center Y
     * @param {number} centerZ - Explosion center Z
     * @param {number} radius - Explosion radius in blocks
     * @param {boolean} isCombo - Is this a combo explosion? (2x particles)
     */
    detonate(centerX, centerY, centerZ, radius, isCombo = false) {
        const comboText = isCombo ? ' 🔥💣 COMBO' : '';
        console.log(`💥 DETONATING${comboText} at (${centerX}, ${centerY}, ${centerZ}) with radius ${radius}`);

        const blocksDestroyed = [];

        // Scan all blocks in spherical radius
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    const blockX = centerX + x;
                    const blockY = centerY + y;
                    const blockZ = centerZ + z;

                    // Check if within spherical radius (not cube)
                    const distance = Math.sqrt(x * x + y * y + z * z);
                    if (distance <= radius) {
                        const blockData = this.voxelWorld.getBlock(blockX, blockY, blockZ);
                        const blockType = blockData?.type || blockData;

                        // 🎄 PROTECT MEGA DOUGLAS FIR (CHRISTMAS TREE) - magical and indestructible!
                        const isMegaFir = this.voxelWorld.christmasSystem &&
                                         this.voxelWorld.christmasSystem.isMegaFirBlock(blockX, blockY, blockZ);

                        // Skip bedrock, empty blocks, and Christmas tree
                        if (blockType && blockType !== 'bedrock' && !isMegaFir) {
                            blocksDestroyed.push({ x: blockX, y: blockY, z: blockZ, type: blockType });

                            // Give resource to player's inventory FIRST
                            this.voxelWorld.inventory.addToInventory(blockType, 1);

                            // Remove block visually (don't give items again, we already did)
                            this.voxelWorld.removeBlock(blockX, blockY, blockZ, false);
                        }
                    }
                }
            }
        }

        console.log(`💥 Destroyed ${blocksDestroyed.length} blocks`);

        // Create massive explosion particle effect at center
        this.voxelWorld.createExplosionEffect(centerX, centerY, centerZ, isCombo ? 'fire' : 'explosion');

        // Create additional particle bursts around the explosion
        const burstCount = isCombo ? 16 : 8; // 2x particles for combo!
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const burstRadius = radius * 0.6;
            const burstX = centerX + Math.cos(angle) * burstRadius;
            const burstZ = centerZ + Math.sin(angle) * burstRadius;

            setTimeout(() => {
                this.voxelWorld.createExplosionEffect(burstX, centerY, burstZ, isCombo ? 'fire' : 'explosion');
            }, i * 50); // Stagger bursts for dramatic effect
        }

        // 🔥💣 COMBO BONUS: Extra ring of fire particles!
        if (isCombo) {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const ringRadius = radius * 0.9;
                const ringX = centerX + Math.cos(angle) * ringRadius;
                const ringZ = centerZ + Math.sin(angle) * ringRadius;

                setTimeout(() => {
                    this.voxelWorld.createExplosionEffect(ringX, centerY + 1, ringZ, 'fire');
                }, i * 30);
            }
        }

        // Play explosion sound if available
        if (this.voxelWorld.audioManager) {
            // TODO: Add explosion sound
            // this.voxelWorld.audioManager.playSFX('explosion');
        }

        this.voxelWorld.updateStatus(`💥 ${blocksDestroyed.length} blocks destroyed!`, 'discovery');
    }

    /**
     * 🪓 Fell entire tree at once, giving player all resources
     * @param {number} treeId - Tree registry ID
     * @param {number} clickX - Block clicked X coordinate
     * @param {number} clickY - Block clicked Y coordinate
     * @param {number} clickZ - Block clicked Z coordinate
     */
    fellEntireTree(treeId, clickX, clickY, clickZ) {
        console.log(`🪓 TREE FELLER: Harvesting entire tree ${treeId}`);

        // Get complete tree metadata
        const treeMetadata = this.voxelWorld.getTreeMetadata(treeId);

        if (!treeMetadata) {
            console.error(`🚨 Tree metadata not found for ID ${treeId}`);
            return;
        }

        const allBlocks = [...treeMetadata.trunkBlocks, ...treeMetadata.leafBlocks];
        console.log(`🌳 Tree has ${treeMetadata.trunkBlocks.length} trunk blocks and ${treeMetadata.leafBlocks.length} leaf blocks`);

        // 🎒 HARVEST BLOCKS IMMEDIATELY (give resources to player)
        let woodCount = 0;
        let leafCount = 0;

        allBlocks.forEach(block => {
            const blockData = this.voxelWorld.getBlock(block.x, block.y, block.z);
            const blockType = blockData?.type || blockData;

            if (blockType) {
                // Give resource to player's inventory FIRST
                this.voxelWorld.inventory.addToInventory(blockType, 1);

                // Remove block visually (don't give items again, we already did)
                this.voxelWorld.removeBlock(block.x, block.y, block.z, false);

                // Track harvest counts
                if (this.voxelWorld.isWoodBlock(blockType)) {
                    woodCount++;
                } else {
                    leafCount++;
                }
            }
        });

        // Remove tree from registry (cleanup)
        this.voxelWorld.removeTreeFromRegistry(treeId);

        console.log(`🪓 Tree harvested! ${woodCount} wood and ${leafCount} leaf blocks added to inventory`);

        // 🎬 NOW PLAY VISUAL ANIMATION (tree already harvested, this is just for show)
        const treeOrigin = {
            x: treeMetadata.basePosition.x,
            y: treeMetadata.basePosition.y,
            z: treeMetadata.basePosition.z
        };

        // Start animation (visual effect only)
        this.voxelWorld.animationSystem.animateTreeFall(allBlocks, treeOrigin, 2.0, () => {
            // AFTER ANIMATION: Update status and show particle burst
            this.voxelWorld.updateStatus(`🪓 Harvested ${woodCount} wood and ${leafCount} leaves!`, 'discovery');

            // Create particle burst at tree origin
            this.voxelWorld.createExplosionEffect(treeOrigin.x, treeOrigin.y + 2, treeOrigin.z, 'wood_particles');
        });
    }

    /**
     * 🏹 Fire ranged weapon (Crossbow, Fire Staff, Ice Bow, Throwing Knives)
     * @param {string} weaponType - The weapon type
     * @param {object} targetPos - Target position {x, y, z}
     */
    fireRangedWeapon(weaponType, targetPos) {
        console.log(`🏹 Firing ${weaponType} at (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)}, ${targetPos.z.toFixed(1)})`);

        // Get player position (eye level)
        const startPos = {
            x: this.voxelWorld.camera.position.x,
            y: this.voxelWorld.camera.position.y,
            z: this.voxelWorld.camera.position.z
        };

        // Weapon-specific properties
        let projectileMesh, damage, speed, effectType, stamina;

        switch (weaponType) {
            case 'crossbow':
            case 'crafted_crossbow':
                projectileMesh = this.createCrossbowBolt(startPos);
                damage = 2; // High damage, piercing
                speed = 0.4; // Fast projectile
                effectType = 'piercing';
                stamina = 10;
                this.voxelWorld.updateStatus(`🏹 Crossbow fired!`, 'combat');
                break;

            case 'fire_staff':
            case 'crafted_fire_staff':
                projectileMesh = this.createFireball(startPos);
                damage = 3; // High damage, AoE
                speed = 0.5; // Medium speed
                effectType = 'fire';
                stamina = 15;
                this.voxelWorld.updateStatus(`🔥 Fireball launched!`, 'combat');
                break;

            case 'ice_bow':
            case 'crafted_ice_bow':
                projectileMesh = this.createIceArrow(startPos);
                damage = 1; // Lower damage, but slows
                speed = 0.45; // Medium-fast speed
                effectType = 'ice';
                stamina = 12;
                this.voxelWorld.updateStatus(`❄️ Ice arrow released!`, 'combat');
                break;

            case 'throwing_knives':
            case 'crafted_throwing_knives':
                projectileMesh = this.createThrowingKnife(startPos);
                damage = 1; // Low damage, but rapid
                speed = 0.3; // Very fast
                effectType = 'slash';
                stamina = 5;
                this.voxelWorld.updateStatus(`🔪 Knife thrown!`, 'combat');
                break;
        }

        // Check stamina
        if (this.voxelWorld.staminaSystem && this.voxelWorld.staminaSystem.currentStamina < stamina) {
            this.voxelWorld.updateStatus('❌ Not enough stamina!', 'error');
            // Remove projectile mesh if created
            if (projectileMesh) {
                this.voxelWorld.scene.remove(projectileMesh);
            }
            return false;
        }

        // Animate projectile
        this.voxelWorld.animationSystem.animateProjectile(
            startPos,
            targetPos,
            speed,
            (progress, currentPos) => {
                // Update projectile position
                projectileMesh.position.set(currentPos.x, currentPos.y, currentPos.z);

                // 🔥 Update flame particles for fire staff
                if (projectileMesh.userData.flameParticles) {
                    const particles = projectileMesh.userData.flameParticles;
                    const velocities = projectileMesh.userData.flameVelocities;

                    particles.forEach((particle, i) => {
                        // Move particle along with fireball, slightly trailing
                        particle.position.x += velocities[i].x;
                        particle.position.y += velocities[i].y;
                        particle.position.z += velocities[i].z;

                        // Fade out older particles
                        particle.material.opacity = Math.max(0, 0.8 - (progress * 1.5));

                        // Respawn particle if it's too far from fireball
                        const dist = Math.sqrt(
                            Math.pow(particle.position.x - currentPos.x, 2) +
                            Math.pow(particle.position.y - currentPos.y, 2) +
                            Math.pow(particle.position.z - currentPos.z, 2)
                        );

                        if (dist > 1.0) {
                            // Respawn at fireball position with small random offset
                            particle.position.set(
                                currentPos.x + (Math.random() - 0.5) * 0.2,
                                currentPos.y + (Math.random() - 0.5) * 0.2,
                                currentPos.z + (Math.random() - 0.5) * 0.2
                            );
                            particle.material.opacity = 0.8;
                        }
                    });
                }

                // Rotate projectile to face direction of travel
                if (progress > 0.01 && projectileMesh.userData.prevPos) {
                    const prevPos = projectileMesh.userData.prevPos;
                    const direction = new THREE.Vector3(
                        currentPos.x - prevPos.x,
                        currentPos.y - prevPos.y,
                        currentPos.z - prevPos.z
                    ).normalize();

                    projectileMesh.lookAt(
                        projectileMesh.position.x + direction.x,
                        projectileMesh.position.y + direction.y,
                        projectileMesh.position.z + direction.z
                    );
                }

                projectileMesh.userData.prevPos = {...currentPos};

                // 🔥💣 COMBO SYSTEM: Check for demolition charge collision
                if (effectType === 'fire') {
                    const projectilePos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

                    for (let i = this.activeDemolitionCharges.length - 1; i >= 0; i--) {
                        const charge = this.activeDemolitionCharges[i];
                        const chargePos = new THREE.Vector3(charge.x + 0.5, charge.y + 0.5, charge.z + 0.5);
                        const distance = projectilePos.distanceTo(chargePos);

                        if (distance < 1.5) {
                            // 🔥💣 COMBO HIT! Fire staff ignites demolition charge!
                            console.log(`🔥💣 COMBO! Fire staff ignited demolition charge at (${charge.x}, ${charge.y}, ${charge.z})`);

                            // Clear the normal 3-second timer
                            clearTimeout(charge.timeoutId);
                            clearInterval(charge.countdownInterval);

                            // Remove marker block
                            this.voxelWorld.removeBlock(charge.x, charge.y, charge.z, false);

                            // MEGA EXPLOSION! 2x radius
                            const comboRadius = charge.radius * 2; // 8 blocks instead of 4!
                            this.detonate(charge.x, charge.y, charge.z, comboRadius, true); // Pass combo flag

                            // Remove from active charges
                            this.activeDemolitionCharges.splice(i, 1);

                            // Remove fireball
                            this.cleanupProjectile(projectileMesh);

                            this.voxelWorld.updateStatus(`🔥💣 COMBO! MEGA EXPLOSION!`, 'discovery');

                            return true; // Stop animation
                        }
                    }
                }

                // Check for enemy collision
                if (this.voxelWorld.bloodMoonSystem && progress > 0.1) {
                    const projectilePos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
                    const enemies = this.voxelWorld.bloodMoonSystem.activeEnemies;

                    for (const [enemyId, enemy] of enemies) {
                        if (enemy.health <= 0) continue;

                        const enemyPos = enemy.sprite.position;
                        const distance = projectilePos.distanceTo(enemyPos);

                        if (distance < 1.5) {
                            // HIT!
                            console.log(`🎯 ${weaponType} hit ${enemy.entityType}! Damage: ${damage}`);
                            this.voxelWorld.bloodMoonSystem.hitEnemy(enemyId, damage);

                            // Apply special effects
                            this.applyWeaponEffect(effectType, enemyPos, enemyId);

                            // Remove projectile and flame particles
                            this.cleanupProjectile(projectileMesh);

                            return true; // Stop animation
                        }
                    }
                }
            },
            () => {
                // On complete: Remove projectile and particles
                this.cleanupProjectile(projectileMesh);

                // Create impact effect at target
                this.createImpactEffect(effectType, targetPos);
            }
        );

        // Consume stamina
        if (this.voxelWorld.staminaSystem) {
            this.voxelWorld.staminaSystem.currentStamina = Math.max(
                0,
                this.voxelWorld.staminaSystem.currentStamina - stamina
            );
        }

        // Consume charge for throwing knives only
        if (weaponType === 'throwing_knives' || weaponType === 'crafted_throwing_knives') {
            const selectedSlot = this.voxelWorld.inventory.hotbarSlots[this.voxelWorld.selectedSlot];
            selectedSlot.quantity--;
            if (selectedSlot.quantity === 0) {
                selectedSlot.itemType = '';
            }
            this.voxelWorld.updateHotbarCounts();
        }

        return true;
    }

    /**
     * 🏹 Create crossbow bolt projectile
     */
    createCrossbowBolt(position) {
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown
        const bolt = new THREE.Mesh(geometry, material);
        bolt.position.set(position.x, position.y, position.z);
        bolt.rotation.x = Math.PI / 2; // Point forward
        this.voxelWorld.scene.add(bolt);
        return bolt;
    }

    /**
     * 🔥 Create fireball projectile with flame particles
     */
    createFireball(position) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFF4500, // Orange-red
            transparent: true,
            opacity: 0.9
        });
        const fireball = new THREE.Mesh(geometry, material);
        fireball.position.set(position.x, position.y, position.z);
        this.voxelWorld.scene.add(fireball);

        // 🔥 Add trailing flame particles
        const particleCount = 8;
        const fireSprites = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const spriteMaterial = new THREE.SpriteMaterial({
                color: 0xff8844,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.15, 0.15, 0.15);
            sprite.position.set(position.x, position.y, position.z);

            this.voxelWorld.scene.add(sprite);
            fireSprites.push(sprite);

            // Particles trail behind and rise slightly
            velocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: Math.random() * 0.1 + 0.05, // Rise upward
                z: (Math.random() - 0.5) * 0.05
            });
        }

        // Store flame particles in fireball userData
        fireball.userData.flameParticles = fireSprites;
        fireball.userData.flameVelocities = velocities;
        fireball.userData.particleLifetime = 0; // Track age for fade out

        return fireball;
    }

    /**
     * ❄️ Create ice arrow projectile
     */
    createIceArrow(position) {
        const geometry = new THREE.ConeGeometry(0.1, 0.8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Sky blue
            transparent: true,
            opacity: 0.8
        });
        const arrow = new THREE.Mesh(geometry, material);
        arrow.position.set(position.x, position.y, position.z);
        arrow.rotation.x = Math.PI / 2; // Point forward
        this.voxelWorld.scene.add(arrow);
        return arrow;
    }

    /**
     * 🔪 Create throwing knife projectile
     */
    createThrowingKnife(position) {
        const geometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0xC0C0C0 }); // Silver
        const knife = new THREE.Mesh(geometry, material);
        knife.position.set(position.x, position.y, position.z);
        this.voxelWorld.scene.add(knife);
        return knife;
    }

    /**
     * ✨ Apply weapon special effects
     */
    applyWeaponEffect(effectType, position, enemyId) {
        switch (effectType) {
            case 'fire':
                // Fire explosion effect
                this.voxelWorld.createExplosionEffect(position.x, position.y, position.z, 'fire');
                break;
            case 'ice':
                // Ice slow effect (could add slow debuff to enemy here)
                this.voxelWorld.createExplosionEffect(position.x, position.y, position.z, 'ice');
                console.log(`❄️ Enemy ${enemyId} slowed by ice!`);
                break;
            case 'piercing':
                // Piercing effect (could pierce through multiple enemies)
                console.log(`🏹 Piercing shot!`);
                break;
        }
    }

    /**
     * 💥 Create impact effect when projectile hits ground
     */
    createImpactEffect(effectType, position) {
        switch (effectType) {
            case 'fire':
                this.voxelWorld.createExplosionEffect(position.x, position.y, position.z, 'fire');
                break;
            case 'ice':
                this.voxelWorld.createExplosionEffect(position.x, position.y, position.z, 'ice');
                break;
            default:
                // Small dust puff for physical projectiles
                this.voxelWorld.createExplosionEffect(position.x, position.y, position.z, 'dust');
                break;
        }
    }

    /**
     * 🧹 Cleanup projectile and associated particles
     */
    cleanupProjectile(projectileMesh) {
        // Clean up flame particles (fire staff)
        if (projectileMesh.userData.flameParticles) {
            projectileMesh.userData.flameParticles.forEach(particle => {
                this.voxelWorld.scene.remove(particle);
                if (particle.material) particle.material.dispose();
            });
        }

        // Remove main projectile mesh
        this.voxelWorld.scene.remove(projectileMesh);
        if (projectileMesh.geometry) projectileMesh.geometry.dispose();
        if (projectileMesh.material) projectileMesh.material.dispose();
    }

    /**
     * ⚔️ Check for melee attack on nearby enemies
     * @param {object} pos - Click position {x, y, z}
     * @param {number} damage - Damage to deal
     * @param {number} range - Attack range in blocks
     * @returns {boolean} - true if enemy was hit
     */
    checkMeleeAttack(pos, damage, range) {
        if (!this.voxelWorld.bloodMoonSystem) return false;

        const attackPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        const enemies = this.voxelWorld.bloodMoonSystem.activeEnemies;
        let hitAny = false;

        for (const [enemyId, enemy] of enemies) {
            if (enemy.health <= 0) continue;

            const enemyPos = enemy.sprite.position;
            const distance = attackPos.distanceTo(enemyPos);

            if (distance < range) {
                // HIT!
                console.log(`⚔️ Melee hit ${enemy.entityType}! Damage: ${damage}, Range: ${range}`);
                this.voxelWorld.bloodMoonSystem.hitEnemy(enemyId, damage);

                // Create impact effect at enemy position
                this.voxelWorld.createExplosionEffect(enemyPos.x, enemyPos.y, enemyPos.z, 'hit');

                hitAny = true;

                // For single-target attacks, only hit one enemy
                if (range < 2) break;
            }
        }

        return hitAny;
    }

    /**
     * 🔮 Use Recall Stone to teleport to campfire
     */
    useRecallStone() {
        console.log('🔮 Using Recall Stone...');

        // Check if player has set a campfire respawn point
        if (!this.voxelWorld.respawnCampfire) {
            this.voxelWorld.updateStatus('🔮 No campfire found! Place a campfire first.', 'error');
            return false;
        }

        // Get campfire position
        const campfire = this.voxelWorld.respawnCampfire;
        const targetX = campfire.x + 0.5; // Center of block
        const targetY = campfire.y + 2;   // 2 blocks above campfire
        const targetZ = campfire.z + 0.5; // Center of block

        console.log(`🔮 Teleporting to campfire at (${targetX}, ${targetY}, ${targetZ})`);

        // Create teleport effect at current position
        const currentPos = {
            x: this.voxelWorld.player.position.x,
            y: this.voxelWorld.player.position.y,
            z: this.voxelWorld.player.position.z
        };
        this.voxelWorld.createExplosionEffect(currentPos.x, currentPos.y, currentPos.z, 'teleport');

        // Teleport player
        this.voxelWorld.player.position.x = targetX;
        this.voxelWorld.player.position.y = targetY;
        this.voxelWorld.player.position.z = targetZ;
        this.voxelWorld.player.velocity = 0; // Reset velocity

        // Create arrival effect at campfire
        setTimeout(() => {
            this.voxelWorld.createExplosionEffect(targetX, targetY, targetZ, 'teleport');
            this.voxelWorld.updateStatus('🔮 Recalled to campfire!', 'discovery');
        }, 100);

        // Consume stamina (high cost for instant travel)
        if (this.voxelWorld.staminaSystem) {
            const staminaCost = 30; // High cost for teleportation
            this.voxelWorld.staminaSystem.currentStamina = Math.max(
                0,
                this.voxelWorld.staminaSystem.currentStamina - staminaCost
            );
            console.log(`🔮 Recall Stone used -${staminaCost} stamina`);
        }

        return true;
    }
}
