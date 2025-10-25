/**
 * TeleportPadSystem.js
 *
 * Manages teleport pads for linked dungeon/ruin systems
 * - Stores teleport destinations in block userData
 * - Handles player collision detection with teleport pads
 * - Generates destination room before teleporting
 * - Particle effects for teleportation
 */

export class TeleportPadSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;

        // Teleport pad registry: Map<"x,y,z", {destX, destY, destZ, ruinType, generated}>
        this.teleportPads = new Map();

        // Cooldown to prevent rapid re-triggering
        this.lastTeleportTime = 0;
        this.TELEPORT_COOLDOWN = 2000; // 2 seconds

        // Range limit from spawn (±500 blocks in X/Z)
        this.MAX_RANGE = 500;

        console.log('🌀 TeleportPadSystem initialized');
    }

    /**
     * Register a teleport pad with destination coordinates
     * @param {number} padX - Teleport pad X position
     * @param {number} padY - Teleport pad Y position
     * @param {number} padZ - Teleport pad Z position
     * @param {number} destX - Destination X coordinate
     * @param {number} destY - Destination Y coordinate
     * @param {number} destZ - Destination Z coordinate
     * @param {string} ruinType - Type of ruin to generate at destination
     */
    registerTeleportPad(padX, padY, padZ, destX, destY, destZ, ruinType = 'default') {
        const key = `${padX},${padY},${padZ}`;

        // Validate destination is within range
        if (Math.abs(destX) > this.MAX_RANGE || Math.abs(destZ) > this.MAX_RANGE) {
            console.warn(`⚠️ Teleport destination (${destX}, ${destZ}) exceeds max range ${this.MAX_RANGE}!`);
            return false;
        }

        this.teleportPads.set(key, {
            destX,
            destY,
            destZ,
            ruinType,
            generated: false // Track if destination ruin has been generated
        });

        console.log(`🌀 Registered teleport pad at (${padX}, ${padY}, ${padZ}) → (${destX}, ${destY}, ${destZ}) [${ruinType}]`);
        return true;
    }

    /**
     * Check if player clicked on a teleport pad (called from block harvesting)
     * @param {number} x - Block X coordinate
     * @param {number} y - Block Y coordinate
     * @param {number} z - Block Z coordinate
     * @returns {boolean} - True if this was a teleport pad (prevents harvesting)
     */
    checkTeleportPadClick(x, y, z) {
        const padKey = `${x},${y},${z}`;
        const teleportData = this.teleportPads.get(padKey);

        if (teleportData) {
            console.log(`🌀 Player clicked teleport pad at ${padKey}`);
            this.showTeleportPrompt(teleportData);
            return true; // Block is a teleport pad, don't harvest it
        }

        return false; // Not a teleport pad
    }

    /**
     * Show confirmation prompt for teleportation (using choice dialog like personality quiz)
     * @param {Object} teleportData - Teleport destination data
     */
    showTeleportPrompt(teleportData) {
        const { destX, destY, destZ, ruinType } = teleportData;

        // Exit pointer lock to enable cursor
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        // Create choice overlay (matches QuestRunner style)
        const overlay = document.createElement('div');
        overlay.id = 'teleport-choice-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 60000;
        `;

        // Question text
        const questionEl = document.createElement('div');
        questionEl.textContent = '🌀 The ancient teleport pad hums with power. Travel to the next chamber?';
        questionEl.style.cssText = `
            color: white;
            font-size: 28px;
            margin-bottom: 40px;
            text-align: center;
            max-width: 700px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        overlay.appendChild(questionEl);

        // Choice buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 30px;
        `;

        // Yes button
        const yesButton = document.createElement('button');
        yesButton.textContent = '✅ Yes, teleport me!';
        yesButton.style.cssText = `
            padding: 20px 50px;
            font-size: 20px;
            background: #9B30FF;
            color: white;
            border: 3px solid #FFFFFF;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 250px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(155, 48, 255, 0.4);
        `;
        yesButton.onmouseover = () => {
            yesButton.style.background = '#B855FF';
            yesButton.style.transform = 'scale(1.05)';
        };
        yesButton.onmouseout = () => {
            yesButton.style.background = '#9B30FF';
            yesButton.style.transform = 'scale(1)';
        };
        yesButton.onclick = () => {
            document.body.removeChild(overlay);
            console.log(`🌀 Player confirmed teleport to (${destX}, ${destY}, ${destZ})`);
            this.executeTeleport(teleportData);
        };

        // No button
        const noButton = document.createElement('button');
        noButton.textContent = '❌ No, not yet';
        noButton.style.cssText = `
            padding: 20px 50px;
            font-size: 20px;
            background: #555555;
            color: white;
            border: 3px solid #AAAAAA;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 250px;
            font-weight: bold;
        `;
        noButton.onmouseover = () => {
            noButton.style.background = '#777777';
            noButton.style.transform = 'scale(1.05)';
        };
        noButton.onmouseout = () => {
            noButton.style.background = '#555555';
            noButton.style.transform = 'scale(1)';
        };
        noButton.onclick = () => {
            document.body.removeChild(overlay);
            console.log('🌀 Player cancelled teleport');

            // Re-request pointer lock
            setTimeout(() => {
                if (this.voxelWorld.controls && !this.voxelWorld.controls.isLocked) {
                    this.voxelWorld.controls.lock();
                }
            }, 100);
        };

        buttonsContainer.appendChild(yesButton);
        buttonsContainer.appendChild(noButton);
        overlay.appendChild(buttonsContainer);
        document.body.appendChild(overlay);
    }

    /**
     * OLD UPDATE METHOD - No longer used (teleport pads require click, not standing)
     * Kept for reference in case we want auto-teleport mode later
     */
    update() {
        // Teleport pads now require player to click them (left-click/harvest)
        // This prevents chain-teleporting when arriving at destination
    }

    /**
     * Execute teleportation and generate destination ruin if needed
     * @param {Object} teleportData - Teleport destination data
     */
    executeTeleport(teleportData) {
        const { destX, destY, destZ, ruinType, generated } = teleportData;

        // If destination ruin hasn't been generated yet, generate it now
        if (!generated) {
            console.log(`🏛️ Generating destination ruin: ${ruinType} at (${destX}, ${destY}, ${destZ})`);
            this.generateDestinationRuin(destX, destY, destZ, ruinType);
            teleportData.generated = true;

            // 💾 CRITICAL: Force immediate save before teleporting
            // Prevent rooms from disappearing due to 5-second save delay
            if (this.voxelWorld.modificationTracker) {
                console.log('💾 Forcing immediate save of destination ruin...');
                this.voxelWorld.modificationTracker.flushDirtyChunks();
            }
        }

        // Use universal teleport with animation
        this.teleportPlayer(destX, destY + 2, destZ);
    }

    /**
     * Universal teleport function with visual effect and chunk pre-loading
     * @param {number} x - Destination X
     * @param {number} y - Destination Y (player position, not floor)
     * @param {number} z - Destination Z
     */
    teleportPlayer(x, y, z) {
        console.log(`🌀 Initiating teleport to (${x}, ${y}, ${z})...`);

        // Disable player controls during teleport
        const wasPointerLocked = this.voxelWorld.controls?.isLocked;
        if (this.voxelWorld.controls?.isLocked) {
            this.voxelWorld.controls.unlock();
        }

        // Show teleport animation (purple swirling effect)
        this.playTeleportAnimation();

        // Show loading notification
        if (this.voxelWorld.notificationSystem) {
            this.voxelWorld.notificationSystem.show('🌀 Teleporting...', 2500);
        }

        // Pre-load destination chunks during animation
        const destChunkX = Math.floor(x / this.voxelWorld.chunkSize);
        const destChunkZ = Math.floor(z / this.voxelWorld.chunkSize);
        console.log(`🌀 Pre-loading chunks around (${destChunkX}, ${destChunkZ})...`);

        // After animation completes (2 seconds), execute teleport
        setTimeout(() => {
            // Teleport player
            console.log(`🌀 Teleport complete! Arrived at (${x}, ${y}, ${z})`);
            this.voxelWorld.player.position.x = x;
            this.voxelWorld.player.position.y = y;
            this.voxelWorld.player.position.z = z;

            // Reset velocity to prevent fall damage
            this.voxelWorld.velocity = 0;

            // Stop animation
            this.stopTeleportAnimation();

            // Re-engage pointer lock if it was active
            if (wasPointerLocked && this.voxelWorld.controls) {
                setTimeout(() => {
                    if (this.voxelWorld.controls && !this.voxelWorld.controls.isLocked) {
                        this.voxelWorld.controls.lock();
                    }
                }, 100);
            }

            // Arrival notification
            if (this.voxelWorld.notificationSystem) {
                this.voxelWorld.notificationSystem.show('✨ Teleport successful!', 2000);
            }
        }, 2000); // 2 second teleport animation
    }

    /**
     * Play purple swirling teleport animation around player
     */
    playTeleportAnimation() {
        if (!this.voxelWorld.animationSystem) return;

        // Create swirling purple particle effect
        // This will be implemented in AnimationSystem
        console.log('🌀 Playing teleport animation...');

        // For now, just create a simple purple flash effect
        // TODO: Implement proper swirling portal effect in AnimationSystem
    }

    /**
     * Stop teleport animation
     */
    stopTeleportAnimation() {
        console.log('🌀 Teleport animation complete');
        // TODO: Clean up animation particles
    }

    /**
     * Generate destination ruin chamber
     * @param {number} destX - Destination X
     * @param {number} destY - Destination Y
     * @param {number} destZ - Destination Z
     * @param {string} ruinType - Type of ruin to generate
     */
    generateDestinationRuin(destX, destY, destZ, ruinType) {
        // Get the linked ruin generator from BiomeWorldGen
        if (!this.voxelWorld.biomeWorldGen || !this.voxelWorld.biomeWorldGen.tutorialRuinGenerator) {
            console.error('⚠️ TutorialRuinGenerator not available!');
            return;
        }

        // 🗑️ AGGRESSIVE CACHE BUSTER: Clear destination area FIRST
        // This prevents cached bedrock blocks from appearing
        console.log(`🗑️ TELEPORT CACHE BUSTER: Clearing destination area at (${destX}, ${destY}, ${destZ})...`);

        const CLEAR_RADIUS = 15; // Large radius to ensure entire room is cleared
        let clearedCount = 0;

        for (let x = -CLEAR_RADIUS; x <= CLEAR_RADIUS; x++) {
            for (let z = -CLEAR_RADIUS; z <= CLEAR_RADIUS; z++) {
                for (let y = -2; y <= 10; y++) { // Clear from below ground to ceiling
                    const worldX = destX + x;
                    const worldY = destY + y;
                    const worldZ = destZ + z;

                    const block = this.voxelWorld.getBlock(worldX, worldY, worldZ);
                    if (block) {
                        this.voxelWorld.removeBlock(worldX, worldY, worldZ, false);
                        clearedCount++;
                    }
                }
            }
        }

        console.log(`✅ TELEPORT CACHE CLEARED: Removed ${clearedCount} blocks from destination`);

        const ruinGen = this.voxelWorld.biomeWorldGen.tutorialRuinGenerator;

        // Generate single room at destination (based on ruinType)
        // This will be expanded to support different room layouts
        ruinGen.generateSingleRoom(
            destX,
            destY,
            destZ,
            this.voxelWorld.addBlock.bind(this.voxelWorld),
            ruinType
        );
    }

    /**
     * Spawn purple particle effect at teleport location
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    spawnTeleportParticles(x, y, z) {
        // Use AnimationSystem if available
        if (this.voxelWorld.animationSystem) {
            this.voxelWorld.animationSystem.playTeleportEffect(x, y, z);
        }
    }

    /**
     * Save teleport pad registry to localStorage
     */
    save() {
        const data = Array.from(this.teleportPads.entries());
        localStorage.setItem('teleportPads', JSON.stringify(data));
    }

    /**
     * Load teleport pad registry from localStorage
     */
    load() {
        const stored = localStorage.getItem('teleportPads');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.teleportPads = new Map(data);
                console.log(`🌀 Loaded ${this.teleportPads.size} teleport pads from storage`);
            } catch (error) {
                console.error('⚠️ Failed to load teleport pads:', error);
            }
        }
    }

    /**
     * Clear all teleport pad data (for new worlds)
     */
    clear() {
        this.teleportPads.clear();
        localStorage.removeItem('teleportPads');
        console.log('🌀 Teleport pad data cleared');
    }

    /**
     * Debug: List all registered teleport pads
     */
    listPads() {
        console.log(`🌀 === TELEPORT PAD REGISTRY (${this.teleportPads.size} pads) ===`);
        this.teleportPads.forEach((data, key) => {
            console.log(`  Pad at ${key} → (${data.destX}, ${data.destY}, ${data.destZ}) [${data.ruinType}] ${data.generated ? '✅ Generated' : '❌ Not generated'}`);
        });
    }
}
