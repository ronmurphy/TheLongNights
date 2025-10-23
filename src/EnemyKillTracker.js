/**
 * EnemyKillTracker.js
 *
 * Tracks all enemies killed by the player for the Mega World Boss Ghost fight.
 *
 * Core Concept: "Your Past Comes Back to Haunt You"
 * - Every enemy with `isEnemy` flag is tracked when killed
 * - Data persists across deaths (your sins follow you)
 * - Capped at 100 per enemy type (performance + balancing)
 * - Used by Mega Boss system to spawn waves of all previously killed enemies
 * - Companion moral threshold system (Elves abandon you at 500+ kills, Goblins at 900+)
 *
 * What looks like a trophy system is actually building your final challenge.
 */

export class EnemyKillTracker {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;

        // Kill counts by enemy type (capped at 100 per type)
        this.enemyKills = {};  // { "zombie_crawler": 45, "colored_ghost_red": 12, ... }

        // Animal kills (tracked separately - red herring for player)
        this.animalKills = {}; // { "deer": 3, "rabbit": 1, ... }

        // Cap per enemy type (prevents impossible fights)
        this.killCap = 100;

        // Companion moral thresholds (loaded from entities.json)
        // If player exceeds their companion's threshold, companion refuses to help in boss fight
        this.companionMoralThresholds = {};

        // Load companion moral thresholds from entities.json
        this.loadCompanionMoralThresholds();

        console.log('⚰️ EnemyKillTracker initialized (Your past will haunt you...)');
    }

    /**
     * Load companion moral thresholds from entities.json
     */
    async loadCompanionMoralThresholds() {
        try {
            const response = await fetch('art/entities/entities.json');
            const entityDb = await response.json();

            // Extract moral thresholds from companion data
            if (entityDb.monsters) {
                for (const [companionId, companionData] of Object.entries(entityDb.monsters)) {
                    if (companionData.type === 'companion' && companionData.moralThreshold) {
                        this.companionMoralThresholds[companionId] = companionData.moralThreshold;
                    }
                }
            }

            console.log('⚰️ Loaded companion moral thresholds:', this.companionMoralThresholds);
        } catch (error) {
            console.error('❌ Failed to load companion moral thresholds:', error);

            // Fallback to hardcoded values if JSON fails to load
            this.companionMoralThresholds = {
                elf_male: 500,
                elf_female: 500,
                human_male: 700,
                human_female: 700,
                dwarf_male: 800,
                dwarf_female: 800,
                goblin_male: 900,
                goblin_female: 900
            };
        }
    }

    /**
     * Record an enemy kill
     * @param {string} enemyType - Enemy ID from entities.json (e.g., "zombie_crawler")
     * @param {boolean} isEnemy - True if enemy has isEnemy flag
     * @param {boolean} isAnimal - True if enemy has isAnimal flag
     */
    recordKill(enemyType, isEnemy = true, isAnimal = false) {
        if (!enemyType) return;

        if (isAnimal) {
            // Track animals separately (doesn't count toward boss waves or moral threshold)
            this.animalKills[enemyType] = (this.animalKills[enemyType] || 0) + 1;
            console.log(`🦌 Animal killed: ${enemyType} (Total: ${this.animalKills[enemyType]})`);

            // Save to localStorage
            this.saveToLocalStorage();
            return;
        }

        if (!isEnemy) {
            // Not an enemy, don't track
            return;
        }

        // Track enemy kill (capped at 100 per type)
        if (!this.enemyKills[enemyType]) {
            this.enemyKills[enemyType] = 0;
        }

        if (this.enemyKills[enemyType] >= this.killCap) {
            // Already at cap, don't increment
            console.log(`⚰️ ${enemyType} kill cap reached (${this.killCap})`);
            return;
        }

        this.enemyKills[enemyType]++;

        const totalKills = this.getTotalEnemyKills();
        console.log(`⚰️ Enemy killed: ${enemyType} (${this.enemyKills[enemyType]}/${this.killCap}) | Total: ${totalKills}`);

        // Check companion moral threshold
        this.checkCompanionMoralThreshold(totalKills);

        // Save to localStorage
        this.saveToLocalStorage();
    }

    /**
     * Get kill count for specific enemy type
     * @param {string} enemyType - Enemy ID
     * @returns {number} Kill count
     */
    getKillCount(enemyType) {
        return this.enemyKills[enemyType] || 0;
    }

    /**
     * Get total enemy kills (isEnemy flagged only)
     * @returns {number} Total kill count
     */
    getTotalEnemyKills() {
        return Object.values(this.enemyKills).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get total animal kills
     * @returns {number} Total animal kill count
     */
    getTotalAnimalKills() {
        return Object.values(this.animalKills).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get all enemy types killed (for wave generation)
     * @returns {Array<{type: string, count: number}>} Array of enemy types and counts
     */
    getEnemyTypesKilled() {
        return Object.entries(this.enemyKills)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count); // Sort by kill count descending
    }

    /**
     * Check if companion will abandon player in boss fight (moral threshold exceeded)
     * @returns {object} {willAbandon: boolean, threshold: number, totalKills: number, companionId: string}
     */
    checkCompanionMoralStatus() {
        const companionId = this.voxelWorld.companionCodex?.activeCompanion;

        // Debug logging
        console.log(`⚰️ DEBUG: Checking moral status for companion: ${companionId || 'none'}`);
        console.log(`⚰️ DEBUG: Available thresholds:`, this.companionMoralThresholds);

        if (!companionId) {
            return { willAbandon: false, threshold: 0, totalKills: 0, companionId: null };
        }

        const totalKills = this.getTotalEnemyKills();
        const threshold = this.companionMoralThresholds[companionId] || 999999;

        return {
            willAbandon: totalKills >= threshold,
            threshold: threshold,
            totalKills: totalKills,
            companionId: companionId,
            remaining: Math.max(0, threshold - totalKills)
        };
    }

    /**
     * Check companion moral threshold and warn player (internal)
     * @param {number} totalKills - Current total kill count
     */
    checkCompanionMoralThreshold(totalKills) {
        const status = this.checkCompanionMoralStatus();

        if (!status.companionId) return;

        // Warning thresholds (10 kills before limit)
        const warningDistance = 10;
        const isNearThreshold = status.remaining <= warningDistance && status.remaining > 0;
        const justCrossedThreshold = status.willAbandon && totalKills === status.threshold;

        if (isNearThreshold) {
            // Warn player they're close to moral limit
            console.warn(`⚠️ Companion moral warning: ${status.remaining} kills until ${status.companionId} abandons you!`);

            // Could trigger companion dialogue here
            // this.voxelWorld.chatOverlay?.queueMessage(...)
        }

        if (justCrossedThreshold) {
            // Just crossed threshold - companion is disappointed
            console.error(`❌ Companion moral threshold exceeded! ${status.companionId} will refuse to help in the boss fight.`);

            // Could trigger companion dialogue here
            // this.voxelWorld.chatOverlay?.queueMessage(...)
        }
    }

    /**
     * Get statistics for UI display
     * @returns {object} Kill statistics
     */
    getStats() {
        const enemyTypes = this.getEnemyTypesKilled();
        const mostKilled = enemyTypes.length > 0 ? enemyTypes[0] : null;
        const moralStatus = this.checkCompanionMoralStatus();

        return {
            totalEnemyKills: this.getTotalEnemyKills(),
            totalAnimalKills: this.getTotalAnimalKills(),
            uniqueEnemyTypes: enemyTypes.length,
            mostKilledEnemy: mostKilled,
            enemyKills: this.enemyKills,
            animalKills: this.animalKills,
            companionMoralStatus: moralStatus
        };
    }

    /**
     * Save kill data to localStorage (persists across sessions and deaths)
     */
    saveToLocalStorage() {
        try {
            const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');

            playerData.killTracker = {
                enemyKills: this.enemyKills,
                animalKills: this.animalKills,
                lastUpdated: Date.now()
            };

            localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
        } catch (error) {
            console.error('❌ Failed to save kill tracker data:', error);
        }
    }

    /**
     * Load kill data from localStorage
     */
    loadFromLocalStorage() {
        try {
            const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');

            if (playerData.killTracker) {
                this.enemyKills = playerData.killTracker.enemyKills || {};
                this.animalKills = playerData.killTracker.animalKills || {};

                const totalKills = this.getTotalEnemyKills();
                console.log(`⚰️ Loaded kill tracker: ${totalKills} total enemy kills`);

                // Show stats
                const stats = this.getStats();
                if (stats.mostKilledEnemy) {
                    console.log(`⚰️ Most killed: ${stats.mostKilledEnemy.type} (${stats.mostKilledEnemy.count})`);
                }

                // Check companion moral status
                const moralStatus = this.checkCompanionMoralStatus();
                if (moralStatus.willAbandon) {
                    console.warn(`⚠️ ${moralStatus.companionId} will abandon you in boss fight (${moralStatus.totalKills}/${moralStatus.threshold} kills)`);
                }
            } else {
                console.log('⚰️ No kill tracker data found (new save)');
            }
        } catch (error) {
            console.error('❌ Failed to load kill tracker data:', error);
        }
    }

    /**
     * Reset all kill data (for testing or new game+)
     */
    resetAllKills() {
        this.enemyKills = {};
        this.animalKills = {};
        this.saveToLocalStorage();
        console.log('⚰️ Kill tracker reset');
    }

    /**
     * Debug: Show kill stats in console
     */
    showStats() {
        const stats = this.getStats();

        console.log('═══════════════════════════════════════');
        console.log('⚰️ ENEMY KILL TRACKER STATS');
        console.log('═══════════════════════════════════════');
        console.log(`Total Enemy Kills: ${stats.totalEnemyKills}`);
        console.log(`Total Animal Kills: ${stats.totalAnimalKills} (doesn't affect boss)`);
        console.log(`Unique Enemy Types Killed: ${stats.uniqueEnemyTypes}`);

        if (stats.mostKilledEnemy) {
            console.log(`\nMost Killed: ${stats.mostKilledEnemy.type} (${stats.mostKilledEnemy.count})`);
        }

        console.log('\n--- Enemy Kills by Type ---');
        const sorted = this.getEnemyTypesKilled();
        sorted.forEach(({type, count}) => {
            const cappedMarker = count >= this.killCap ? ' [CAPPED]' : '';
            console.log(`  ${type}: ${count}${cappedMarker}`);
        });

        if (Object.keys(stats.animalKills).length > 0) {
            console.log('\n--- Animal Kills (Red Herring) ---');
            Object.entries(stats.animalKills).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        }

        console.log('\n--- Companion Moral Status ---');
        const moral = stats.companionMoralStatus;
        if (moral.companionId) {
            console.log(`Companion: ${moral.companionId}`);
            console.log(`Threshold: ${moral.threshold}`);
            console.log(`Current Kills: ${moral.totalKills}`);
            console.log(`Remaining: ${moral.remaining}`);
            console.log(`Will Abandon: ${moral.willAbandon ? '❌ YES' : '✅ NO'}`);
        } else {
            console.log('No active companion');
        }

        console.log('═══════════════════════════════════════');
    }
}
