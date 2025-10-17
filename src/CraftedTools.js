/**
 * CraftedTools.js
 *
 * Handles special behaviors for crafted tools and equipment
 * Extracted from The Long Nights.js to improve code organization
 */

export class CraftedTools {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
    }

    /**
     * Handle left-click actions for crafted tools
     * @param {object} selectedSlot - The currently selected hotbar slot
     * @param {object} pos - Click position {x, y, z}
     * @returns {boolean} - true if tool action was handled, false to continue with default behavior
     */
    handleLeftClick(selectedSlot, pos) {
        const selectedItem = selectedSlot?.itemType;

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
            setTimeout(() => {
                clearInterval(countdownInterval);

                // Remove marker block
                this.voxelWorld.removeBlock(chargeX, chargeY, chargeZ, false);

                // EXPLODE!
                this.detonate(chargeX, chargeY, chargeZ, 4); // 4-block radius

                this.voxelWorld.updateStatus(`💥 BOOM! Demolition successful!`, 'discovery');
            }, 3000);

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
     */
    detonate(centerX, centerY, centerZ, radius) {
        console.log(`💥 DETONATING at (${centerX}, ${centerY}, ${centerZ}) with radius ${radius}`);

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

                            // Remove block and give player resources
                            this.voxelWorld.removeBlock(blockX, blockY, blockZ, true);
                        }
                    }
                }
            }
        }

        console.log(`💥 Destroyed ${blocksDestroyed.length} blocks`);

        // Create massive explosion particle effect at center
        this.voxelWorld.createExplosionEffect(centerX, centerY, centerZ, 'explosion');

        // Create additional particle bursts around the explosion
        const burstCount = 8;
        for (let i = 0; i < burstCount; i++) {
            const angle = (i / burstCount) * Math.PI * 2;
            const burstRadius = radius * 0.6;
            const burstX = centerX + Math.cos(angle) * burstRadius;
            const burstZ = centerZ + Math.sin(angle) * burstRadius;

            setTimeout(() => {
                this.voxelWorld.createExplosionEffect(burstX, centerY, burstZ, 'explosion');
            }, i * 50); // Stagger bursts for dramatic effect
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
}
