/**
 * CompanionHuntSystem.js
 * 
 * Revolutionary companion hunting/gathering system where companions:
 * - Travel 2 chunks per in-game minute
 * - Search for rare ingredients (fish, egg, honey, apple)
 * - Mark discoveries on minimap AND journal map (purple dots)
 * - Drop billboard items at discovery locations
 * - Turn around at halfway point to return to player
 * - Show as cyan dot on maps during expedition
 */

export class CompanionHuntSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        
        // Expedition state
        this.isActive = false;
        this.companion = null;  // Which companion is hunting
        this.startTime = 0;
        this.duration = 0;  // Total duration in in-game minutes
        this.currentPosition = { x: 0, y: 0, z: 0 };
        this.startPosition = { x: 0, y: 0, z: 0 };
        this.discoveries = [];  // Array of {position, item, biome, timestamp}
        this.pathTrail = [];  // For visual trail on map
        
        // Movement parameters
        this.chunksPerMinute = 2;  // 2 chunks per in-game minute
        this.blocksPerChunk = 16;
        this.lastMoveTime = 0;
        this.lastCheckTime = 0;
        this.isReturning = false;
        this.explorationDirection = { x: 0, z: 0 };  // Direction companion is traveling
        
        // Loot tables by biome
        this.lootTables = this.defineLootTables();
        
        // Mini hunt indicator UI (below stamina bar)
        this.miniIndicator = null;
        this.miniPortrait = null;
        this.miniTimer = null;
        
        console.log('🐕 CompanionHuntSystem initialized');
    }

    /**
     * Define what items can be found in each biome
     */
    defineLootTables() {
        return {
            // 🌊 WATER BIOMES (Ocean, River)
            ocean: {
                fish: 0.7,      // 70% chance
                egg: 0.2,       // 20% chance (seabird nests)
                apple: 0.05,    // 5% chance
                honey: 0.05     // 5% chance
            },
            
            // 🌲 FOREST BIOMES
            forest: {
                apple: 0.5,     // 50% chance (apple trees)
                honey: 0.3,     // 30% chance (beehives)
                egg: 0.15,      // 15% chance (bird nests)
                fish: 0.05      // 5% chance (streams)
            },
            
            // 🌾 PLAINS BIOMES
            plains: {
                honey: 0.4,     // 40% chance (flower fields)
                apple: 0.3,     // 30% chance (scattered trees)
                egg: 0.2,       // 20% chance (ground nests)
                fish: 0.1       // 10% chance (ponds)
            },
            
            // 🏔️ MOUNTAIN BIOMES
            mountains: {
                egg: 0.5,       // 50% chance (cliff nests)
                fish: 0.25,     // 25% chance (mountain streams)
                honey: 0.15,    // 15% chance (rare)
                apple: 0.1      // 10% chance (hardy trees)
            },
            
            // 🏜️ DESERT BIOMES
            desert: {
                egg: 0.4,       // 40% chance (desert birds)
                honey: 0.3,     // 30% chance (desert flowers)
                apple: 0.2,     // 20% chance (oasis)
                fish: 0.1       // 10% chance (rare oasis)
            },
            
            // ❄️ TUNDRA BIOMES
            tundra: {
                fish: 0.5,      // 50% chance (ice fishing)
                egg: 0.3,       // 30% chance (arctic birds)
                honey: 0.1,     // 10% chance (rare)
                apple: 0.1      // 10% chance (hardy berries instead)
            },
            
            // 🌿 JUNGLE BIOMES
            jungle: {
                apple: 0.4,     // 40% chance (tropical fruit)
                honey: 0.35,    // 35% chance (many bees)
                egg: 0.2,       // 20% chance (exotic birds)
                fish: 0.05      // 5% chance (rivers)
            }
        };
    }

    /**
     * Start a companion hunt expedition
     * @param {Object} companion - The companion object
     * @param {number} durationDays - Duration in game-days (0.5, 1, or 2)
     */
    startHunt(companion, durationDays) {
        if (this.isActive) {
            this.voxelWorld.updateStatus('⚠️ A companion is already on an expedition!', 'warning');
            return false;
        }

        // Store expedition data
        this.companion = companion;
        this.duration = durationDays * 20 * 60;  // Convert days to in-game seconds (1 day = 20 real minutes = 1200 in-game seconds)
        this.startTime = this.voxelWorld.gameTime || 0;
        this.startPosition = {
            x: this.voxelWorld.camera.position.x,
            y: this.voxelWorld.camera.position.y,
            z: this.voxelWorld.camera.position.z
        };
        this.currentPosition = { ...this.startPosition };
        this.discoveries = [];
        this.pathTrail = [{ ...this.startPosition }];
        this.isActive = true;
        this.isReturning = false;
        this.lastMoveTime = this.startTime;
        this.lastCheckTime = this.startTime;

        // Calculate random exploration direction (normalized)
        const randomAngle = Math.random() * Math.PI * 2;
        this.explorationDirection = {
            x: Math.cos(randomAngle),
            z: Math.sin(randomAngle)
        };

        // Visual feedback
        this.voxelWorld.updateStatus(
            `🐕 ${companion.name || 'Companion'} is setting out to hunt for ${durationDays} day${durationDays > 1 ? 's' : ''}!`,
            'discovery'
        );

        // Update companion portrait (if exists) - handled in CompanionPortrait.startHunt()
        // (No need to modify portrait here, it's done in the UI layer)

        console.log(`🐕 Hunt started at gameTime=${this.startTime}:`);
        console.log(`   Duration: ${durationDays} days = ${this.duration} seconds`);
        console.log(`   Will turn around at: ${this.duration / 2} seconds`);
        console.log(`   Start position: (${Math.floor(this.startPosition.x)}, ${Math.floor(this.startPosition.z)})`);
        console.log(`   Exploration direction: (${this.explorationDirection.x}, ${this.explorationDirection.z})`);
        
        // Create mini hunt indicator below stamina bar
        this.createMiniHuntIndicator();
        
        return true;
    }

    /**
     * Create mini hunt indicator below stamina bar
     * DEPRECATED - Now integrated into PlayerCompanionUI
     */
    createMiniHuntIndicator() {
        // Hide old indicator if it exists
        if (this.miniIndicator) {
            this.miniIndicator.style.display = 'none';
        }
        
        // Use new PlayerCompanionUI system instead
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updateHuntStatus('Starting...');
        }
    }

    /**
     * Hide/remove mini hunt indicator
     * DEPRECATED - Now integrated into PlayerCompanionUI
     */
    hideMiniHuntIndicator() {
        // Hide old indicator if it exists
        if (this.miniIndicator) {
            this.miniIndicator.style.display = 'none';
        }
        
        // Clear hunt status in new UI
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updateHuntStatus(null);
        }
    }

    /**
     * Update companion position and check for discoveries
     * Called every frame in game loop
     */
    update(currentTime) {
        if (!this.isActive) return;

        const elapsedTime = currentTime - this.startTime;
        const halfwayPoint = this.duration / 2;

        // Check if expedition is complete
        if (elapsedTime >= this.duration) {
            console.log('⏰ Hunt duration reached, ending hunt');
            this.endHunt();
            return;
        }

        // Update portrait tooltip with remaining time
        this.updatePortraitTimer(currentTime);

        // Check if companion should turn around
        if (!this.isReturning && elapsedTime >= halfwayPoint) {
            this.isReturning = true;
            this.voxelWorld.updateStatus(
                `🔄 ${this.companion.name || 'Companion'} is heading back!`,
                'info'
            );
            console.log(`🔄 Companion turning around at halfway point (${Math.floor(elapsedTime)}s / ${this.duration}s)`);
        }

        // Move companion (every in-game minute = 60 in-game seconds)
        const minutesPassed = Math.floor(elapsedTime / 60);
        const lastMinutesPassed = Math.floor((this.lastMoveTime - this.startTime) / 60);
        
        if (minutesPassed > lastMinutesPassed) {
            console.log(`⏱️ Game minute ${minutesPassed} - Moving companion (elapsed: ${Math.floor(elapsedTime)}s, returning: ${this.isReturning})`);
            this.moveCompanion();
            this.lastMoveTime = currentTime;
            
            // Check for discoveries (only when moving outward, not returning)
            if (!this.isReturning) {
                this.checkForDiscovery();
            }
        }
    }

    /**
     * Move companion 2 chunks in a direction
     */
    moveCompanion() {
        const chunkSize = 16;
        const moveDistance = 2 * chunkSize; // Move 2 chunks

        if (this.isReturning) {
            // Move back toward start position
            const dx = this.startPosition.x - this.currentPosition.x;
            const dz = this.startPosition.z - this.currentPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            console.log(`🔙 Returning: distance to start = ${Math.floor(distance)} blocks`);
            
            if (distance <= moveDistance) {
                // Close enough to start, snap to start position
                this.currentPosition = { ...this.startPosition };
                console.log(`🏠 Companion reached start position (${Math.floor(this.currentPosition.x)}, ${Math.floor(this.currentPosition.z)})`);
            } else {
                // Move toward start
                const normalizedX = dx / distance;
                const normalizedZ = dz / distance;
                this.currentPosition.x += normalizedX * moveDistance;
                this.currentPosition.z += normalizedZ * moveDistance;
                console.log(`🔙 Companion moving toward start: (${Math.floor(this.currentPosition.x)}, ${Math.floor(this.currentPosition.z)})`);
            }
        } else {
            // Move in exploration direction
            this.currentPosition.x += this.explorationDirection.x * moveDistance;
            this.currentPosition.z += this.explorationDirection.z * moveDistance;
            console.log(`🚶 Companion exploring: moved to (${Math.floor(this.currentPosition.x)}, ${Math.floor(this.currentPosition.z)}) - direction: (${this.explorationDirection.x}, ${this.explorationDirection.z})`);
        }

        // Update path trail
        this.pathTrail.push({ ...this.currentPosition });
        
        // Limit trail length
        if (this.pathTrail.length > 100) {
            this.pathTrail.shift();
        }

        console.log(`🐕 Companion at (${Math.floor(this.currentPosition.x)}, ${Math.floor(this.currentPosition.z)}) - Trail length: ${this.pathTrail.length}`);
    }    /**
     * Check if companion found something at current location
     */
    checkForDiscovery() {
        const biome = this.getBiomeAtPosition(this.currentPosition);
        const lootTable = this.lootTables[biome] || this.lootTables.plains;

        // Roll for discovery
        const roll = Math.random();
        let cumulativeChance = 0;
        let foundItem = null;

        for (const [item, chance] of Object.entries(lootTable)) {
            cumulativeChance += chance;
            if (roll < cumulativeChance) {
                foundItem = item;
                break;
            }
        }

        if (foundItem) {
            // Discovery made!
            const discovery = {
                position: { ...this.currentPosition },
                item: foundItem,
                biome: biome,
                timestamp: this.voxelWorld.gameTime || 0,
                id: `discovery_${Date.now()}_${Math.random()}`
            };

            this.discoveries.push(discovery);

            // Spawn billboard item in world
            this.spawnBillboardItem(discovery);

            // Add purple marker to minimap and journal
            this.addDiscoveryMarker(discovery);

            // Notify player
            const itemEmoji = this.getItemEmoji(foundItem);
            this.voxelWorld.updateStatus(
                `🎯 ${this.companion.name || 'Companion'} found ${itemEmoji} ${foundItem} in ${biome}!`,
                'discovery'
            );

            console.log(`🎯 Discovery: ${foundItem} at (${Math.floor(discovery.position.x)}, ${Math.floor(discovery.position.z)})`);
        }
    }

    /**
     * Get biome at a position
     */
    getBiomeAtPosition(position) {
        // Use The Long Nights's biome detection
        if (this.voxelWorld.getBiomeAt) {
            return this.voxelWorld.getBiomeAt(position.x, position.z);
        }

        // Fallback: simple biome detection based on position
        const chunkX = Math.floor(position.x / 16);
        const chunkZ = Math.floor(position.z / 16);
        
        // Simple noise-based biome (placeholder - use real biome system)
        const noise = (Math.sin(chunkX * 0.1) + Math.cos(chunkZ * 0.1)) / 2;
        
        if (noise > 0.5) return 'mountains';
        if (noise > 0.2) return 'forest';
        if (noise > -0.2) return 'plains';
        if (noise > -0.5) return 'desert';
        return 'ocean';
    }

    /**
     * Spawn a billboard item at discovery location
     * Spawns 1-4 items in a cluster around the waypoint
     */
    spawnBillboardItem(discovery) {
        const { position, item, id } = discovery;

        // Determine how many items to spawn (1-4)
        const itemCount = Math.floor(Math.random() * 4) + 1; // Random 1-4
        
        // Get emoji from BILLBOARD_ITEMS or fallback
        const emoji = this.voxelWorld.BILLBOARD_ITEMS?.[item]?.emoji || this.getItemEmoji(item);

        console.log(`📍 Spawning ${itemCount}x ${emoji} ${item} near waypoint at (${Math.floor(position.x)}, ${Math.floor(position.z)})`);

        // Spawn multiple items in a cluster (radius 2-4 blocks)
        for (let i = 0; i < itemCount; i++) {
            // First item at center, others scattered around
            let offsetX = 0;
            let offsetZ = 0;
            
            if (i > 0) {
                // Random offset 2-4 blocks from center
                const angle = Math.random() * Math.PI * 2;
                const distance = 2 + Math.random() * 2; // 2-4 blocks
                offsetX = Math.cos(angle) * distance;
                offsetZ = Math.sin(angle) * distance;
            }

            const spawnX = Math.floor(position.x + offsetX);
            const spawnZ = Math.floor(position.z + offsetZ);

            // Get terrain height at spawn position
            const terrainY = this.voxelWorld.getTerrainHeight?.(spawnX, spawnZ) || position.y;

            // Spawn billboard item using createWorldItem
            this.voxelWorld.createWorldItem(
                spawnX,
                terrainY + 1,
                spawnZ,
                item,
                emoji
            );

            // Store discovery ID for tracking
            const worldItem = this.voxelWorld.worldItemPositions.find(wi => 
                wi.x === spawnX && 
                wi.y === terrainY + 1 && 
                wi.z === spawnZ
            );
            
            if (worldItem) {
                worldItem.discoveryId = id;
                worldItem.isCompanionDiscovery = true;
                console.log(`  ✓ Item ${i + 1}/${itemCount}: ${emoji} at (${spawnX}, ${terrainY + 1}, ${spawnZ})`);
            }
        }

        // Store item count in discovery for waypoint display
        discovery.itemCount = itemCount;

        console.log(`📍 Spawned ${itemCount}x companion discovery: ${emoji} ${item}`);
    }

    /**
     * Find a valid spawn location on solid ground (for NPCs, specific items, etc.)
     * Returns {x, y, z} or null if no valid location found
     * 
     * @param {number} centerX - Center X coordinate
     * @param {number} centerZ - Center Z coordinate
     * @param {number} radius - Search radius in blocks (default: 4)
     * @param {number} maxAttempts - Maximum spawn attempts (default: 10)
     * @returns {{x: number, y: number, z: number} | null}
     */
    findValidSpawnLocation(centerX, centerZ, radius = 4, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random offset from center
            let offsetX = 0;
            let offsetZ = 0;
            
            if (attempt > 0) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                offsetX = Math.cos(angle) * distance;
                offsetZ = Math.sin(angle) * distance;
            }

            const spawnX = Math.floor(centerX + offsetX);
            const spawnZ = Math.floor(centerZ + offsetZ);
            const terrainY = this.voxelWorld.getTerrainHeight?.(spawnX, spawnZ) || 15;

            // Validate surface block
            const blockBelow = this.voxelWorld.getBlock?.(spawnX, terrainY, spawnZ);
            const validSurfaces = ['dirt', 'grass', 'stone', 'sand', 'snow'];
            const isValidSurface = !blockBelow || validSurfaces.includes(blockBelow.type);

            // Validate spawn position is air
            const blockAtSpawn = this.voxelWorld.getBlock?.(spawnX, terrainY + 1, spawnZ);
            const isAir = !blockAtSpawn;

            // Validate headroom (2 blocks tall)
            const blockAbove = this.voxelWorld.getBlock?.(spawnX, terrainY + 2, spawnZ);
            const hasHeadroom = !blockAbove;

            if (isValidSurface && isAir && hasHeadroom) {
                console.log(`✅ Valid spawn location found at (${spawnX}, ${terrainY + 1}, ${spawnZ}) after ${attempt + 1} attempts`);
                return { x: spawnX, y: terrainY + 1, z: spawnZ };
            }
        }

        console.warn(`⚠️ No valid spawn location found near (${centerX}, ${centerZ}) after ${maxAttempts} attempts`);
        return null;
    }

    /**
     * Add purple discovery marker to maps AND create waypoint
     */
    addDiscoveryMarker(discovery) {
        const { position, item, id, itemCount = 1 } = discovery;
        const itemEmoji = this.getItemEmoji(item);

        // Create explorer pin/waypoint that can be navigated to
        if (this.voxelWorld.explorerPins) {
            // Show item count if more than 1
            const displayName = itemCount > 1 
                ? `${itemEmoji} ${item} (×${itemCount})`
                : `${itemEmoji} ${item}`;

            const waypoint = {
                id: id,
                name: displayName,
                color: '#a855f7',  // Purple
                x: position.x,
                z: position.z,
                created: new Date().toISOString(),
                isCompanionDiscovery: true,
                discoveryId: id,
                itemCount: itemCount
            };

            this.voxelWorld.explorerPins.push(waypoint);
            
            // Trigger pin list update if journal is open
            if (this.voxelWorld.updatePinList) {
                this.voxelWorld.updatePinList();
            }

            console.log(`🟣 Waypoint created: ${displayName} at (${Math.floor(position.x)}, ${Math.floor(position.z)})`);
        }
    }

    /**
     * Handle item collection - update waypoint count, remove when all items collected
     */
    onItemCollected(worldX, worldY, worldZ) {
        // Find the world item at this position
        const worldItem = this.voxelWorld.worldItemPositions.find(wi => 
            wi.x === worldX && wi.y === worldY && wi.z === worldZ
        );

        if (!worldItem || !worldItem.isCompanionDiscovery) {
            return; // Not a companion discovery item
        }

        const discoveryId = worldItem.discoveryId;

        // Find the waypoint/pin
        if (this.voxelWorld.explorerPins) {
            const pin = this.voxelWorld.explorerPins.find(p => p.discoveryId === discoveryId);
            
            if (pin && pin.itemCount !== undefined) {
                // Decrement item count
                pin.itemCount--;

                console.log(`📍 Item collected from "${pin.name}" - ${pin.itemCount} remaining`);

                // Update waypoint name to show remaining count
                const discovery = this.discoveries.find(d => d.id === discoveryId);
                if (discovery && pin.itemCount > 0) {
                    const itemEmoji = this.getItemEmoji(discovery.item);
                    pin.name = pin.itemCount > 1 
                        ? `${itemEmoji} ${discovery.item} (×${pin.itemCount})`
                        : `${itemEmoji} ${discovery.item}`;

                    // Update pin list if journal is open
                    if (this.voxelWorld.updatePinList) {
                        this.voxelWorld.updatePinList();
                    }

                    // Re-render journal map
                    if (this.voxelWorld.renderWorldMap) {
                        this.voxelWorld.renderWorldMap();
                    }
                }

                // Remove waypoint only when ALL items are collected
                if (pin.itemCount <= 0) {
                    const pinIndex = this.voxelWorld.explorerPins.indexOf(pin);
                    if (pinIndex !== -1) {
                        this.voxelWorld.explorerPins.splice(pinIndex, 1);
                        console.log(`🗑️ All items collected! Removed waypoint: ${pin.name}`);
                        
                        // Remove from discoveries list
                        this.discoveries = this.discoveries.filter(d => d.id !== discoveryId);

                        // Update pin list if journal is open
                        if (this.voxelWorld.updatePinList) {
                            this.voxelWorld.updatePinList();
                        }
                        
                        // Re-render journal map
                        if (this.voxelWorld.renderWorldMap) {
                            this.voxelWorld.renderWorldMap();
                        }
                    }
                }
            }
        }

        console.log(`✅ Companion discovery item collected`);
    }

    /**
     * End the hunt expedition
     */
    endHunt() {
        this.isActive = false;

        const itemCount = this.discoveries.length;
        const itemList = this.discoveries
            .map(d => this.getItemEmoji(d.item))
            .join(' ');

        // Give items to player's inventory
        if (itemCount > 0) {
            console.log(`🎁 Giving ${itemCount} items to player:`, this.discoveries.map(d => d.item));
            this.discoveries.forEach(discovery => {
                const added = this.voxelWorld.inventory.addToInventory(discovery.item, 1);
                if (added > 0) {
                    console.log(`✅ Added ${discovery.item} to inventory`);
                } else {
                    console.warn(`❌ Failed to add ${discovery.item} to inventory - might be full`);
                }
            });
            
            // Update hotbar to show new items
            this.voxelWorld.updateHotbarCounts();
        }

        // Update companion portrait (remove hunting indicator)
        if (this.voxelWorld.companionPortrait?.portraitElement) {
            this.voxelWorld.companionPortrait.portraitElement.style.border = '4px solid #4A3728'; // Original border
            this.voxelWorld.companionPortrait.portraitElement.style.opacity = '1'; // Restore full opacity
            this.voxelWorld.companionPortrait.portraitElement.title = `${this.companion.name} - Click to interact`;
        }

        // Hide mini hunt indicator
        this.hideMiniHuntIndicator();

        // Notify player
        if (itemCount > 0) {
            this.voxelWorld.updateStatus(
                `🎉 ${this.companion.name || 'Companion'} returned! Found: ${itemList} - Added to inventory!`,
                'discovery'
            );
        } else {
            this.voxelWorld.updateStatus(
                `😔 ${this.companion.name || 'Companion'} returned empty-handed. Try a longer expedition!`,
                'warning'
            );
        }

        console.log(`🏁 Hunt ended: ${itemCount} discoveries made`);
    }

    /**
     * Get emoji for item type
     */
    getItemEmoji(item) {
        const emojis = {
            fish: '🐟',
            egg: '🥚',
            honey: '🍯',
            apple: '🍎'
        };
        return emojis[item] || '❓';
    }

    /**
     * Get companion position for minimap rendering
     */
    getCompanionMapPosition() {
        if (!this.isActive) {
            return null;
        }
        
        const position = {
            x: this.currentPosition.x,
            z: this.currentPosition.z,
            color: '#06b6d4',  // Cyan
            label: this.companion.name || 'Companion',
            isReturning: this.isReturning
        };
        
        // Debug log every 5 seconds to avoid spam
        const now = Date.now();
        if (!this.lastMinimapLog || now - this.lastMinimapLog > 5000) {
            console.log(`🗺️ Minimap companion position: (${Math.floor(position.x)}, ${Math.floor(position.z)}) returning=${position.isReturning}`);
            this.lastMinimapLog = now;
        }
        
        return position;
    }

    /**
     * Update portrait tooltip with remaining time
     */
    updatePortraitTimer(currentTime) {
        const remainingTime = this.duration - (currentTime - this.startTime);
        const timeString = this.formatHuntTime(remainingTime);
        const itemsFound = this.discoveries.length;
        
        // Update old companion portrait if it exists (legacy support)
        if (this.voxelWorld.companionPortrait?.portraitElement) {
            const status = this.isReturning ? 'returning' : 'exploring';
            this.voxelWorld.companionPortrait.portraitElement.title = 
                `${this.companion.name} (${status}) - ${timeString}\nItems found: ${itemsFound}`;
        }

        // Update NEW PlayerCompanionUI hunt status
        if (this.voxelWorld.playerCompanionUI) {
            const statusEmoji = this.isReturning ? '🔄' : '🎯';
            this.voxelWorld.playerCompanionUI.updateHuntStatus(
                `${statusEmoji} ${timeString} (${itemsFound})`
            );
        }

        // Update old mini timer (legacy support)
        if (this.miniTimer) {
            this.miniTimer.textContent = `${timeString} (${itemsFound} items)`;
        }
    }

    /**
     * Format hunt time in game-time units
     */
    formatHuntTime(seconds) {
        if (seconds <= 0) return 'Arriving soon...';
        
        const gameDays = Math.floor(seconds / 1200); // 1 game day = 20 minutes = 1200 seconds
        const gameMinutes = Math.floor((seconds % 1200) / 60); // 1 game minute = 60 seconds
        
        if (gameDays > 0) {
            return `${gameDays}d ${gameMinutes}m remaining`;
        } else if (gameMinutes > 0) {
            return `${gameMinutes}m remaining`;
        } else {
            return `${Math.floor(seconds)}s remaining`;
        }
    }

    /**
     * Get path trail for map visualization
     */
    getPathTrail() {
        if (!this.isActive) return [];
        return this.pathTrail;
    }

    /**
     * Cancel active hunt
     */
    cancelHunt() {
        if (!this.isActive) {
            console.log('⚠️ Cannot recall: no active hunt');
            return;
        }

        const itemsFound = this.discoveries.length;
        const currentTime = this.voxelWorld.gameTime || 0;
        const elapsedTime = currentTime - this.startTime;

        console.log(`📢 Companion recalled!`);
        console.log(`   Elapsed time: ${Math.floor(elapsedTime)}s`);
        console.log(`   Items found: ${itemsFound}`);
        console.log(`   Current position: (${Math.floor(this.currentPosition.x)}, ${Math.floor(this.currentPosition.z)})`);

        this.voxelWorld.updateStatus(
            `📢 ${this.companion.name || 'Companion'} recalled! They're heading back.`,
            'info'
        );

        // Force companion to return
        this.isReturning = true;
        this.duration = (this.voxelWorld.gameTime - this.startTime) + 60;  // Return in 1 minute
        
        console.log(`   New duration set to: ${this.duration}s (will arrive in ~60s)`);
    }

    /**
     * Check if companion is currently hunting (for combat system)
     * @returns {boolean} true if companion is away hunting, false if with player
     */
    get isCompanionHunting() {
        return this.isActive;
    }
}
