/**
 * SpectralHuntSystem.js
 * 
 * Main controller for the Spectral Hunt event system.
 * Manages probability checks, day tracking, hunt state, and orchestrates
 * the spawning of big ghost and colored ghost minions.
 * 
 * Features:
 * - Day-based probability (Day 1 = 10%, Day 7 = 70%)
 * - Time window: 9pm - 2am (5 hours)
 * - Big ghost + colored ghost minions (1-7 ghosts)
 * - Halloween special event (Oct 31)
 * - Bloodmoon interaction
 * - Console commands for testing
 */

import * as THREE from 'three';
import { BigGhostEntity } from './BigGhostEntity.js';
import { ColoredGhostSystem } from './ColoredGhostSystem.js';

export class SpectralHuntSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.scene = voxelWorld.scene;
        this.camera = voxelWorld.camera;
        
        // Hunt state
        this.isActive = false;
        this.huntStartTime = 0;
        this.currentDay = 1;
        
        // Big ghost entity
        this.bigGhost = null;
        
        // Colored ghosts system
        this.coloredGhostSystem = null;
        
        // Hunt tracking
        this.totalGhostsToSpawn = 0;
        this.ghostsKilled = 0;
        this.huntCheckedToday = false;
        
        // Blood Moon combo tracking
        this.bloodMoonComboCount = 0; // Track how many Blood Moon + Spectral Hunt combos have occurred
        this.demolitionGhost = null;  // Special boss ghost (7th combo)
        
        // Configuration
        this.config = {
            // Timing
            START_HOUR: 21,              // 9pm
            END_HOUR: 2,                 // 2am
            SPAWN_INTERVAL: 45,          // 45 seconds between colored ghost spawns
            
            // Probability
            BASE_CHANCE_PER_DAY: 0.1,    // 10% per day
            MAX_CHANCE: 0.9,             // Cap at 90%
            
            // Big ghost
            BIG_GHOST_RADIUS: 400,       // Distance from player
            BIG_GHOST_ROTATION_SPEED: 0.02, // Radians per second
            BIG_GHOST_BASE_SIZE: 10,     // Base size (Day 1)
            BIG_GHOST_MAX_SIZE: 40,      // Max size (Day 7)
            BIG_GHOST_HALLOWEEN_SIZE: 60, // Halloween mega ghost
            
            // Colored ghosts
            MAX_GHOSTS: 7,               // Max ghosts (Day 7)
            HALLOWEEN_GHOSTS: 10,        // Halloween special
            
            // Colors (ROYGBIV + Black)
            GHOST_COLORS: [
                { name: 'Red',    hex: 0xFF0000, day: 1 },
                { name: 'Orange', hex: 0xFF8800, day: 2 },
                { name: 'Yellow', hex: 0xFFFF00, day: 3 },
                { name: 'Green',  hex: 0x00FF00, day: 4 },
                { name: 'Blue',   hex: 0x0088FF, day: 5 },
                { name: 'Indigo', hex: 0x4400FF, day: 6 },
                { name: 'Black',  hex: 0x000000, day: 7 }
            ]
        };
        
        console.log('👻 SpectralHuntSystem initialized');
        this.registerConsoleCommands();
    }
    
    /**
     * Update loop - called every frame
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update big ghost
        if (this.bigGhost) {
            this.bigGhost.update(deltaTime);
        }
        
        // Update colored ghosts
        if (this.coloredGhostSystem) {
            this.coloredGhostSystem.update(deltaTime);
        }
        
        // Update demolition ghost
        if (this.demolitionGhost && this.demolitionGhost.isAlive) {
            this.updateDemolitionGhost(deltaTime);
        }
        
        // Check if time limit expired (2am)
        const currentTime = this.voxelWorld.dayNightCycle?.currentTime || 0;
        if (currentTime >= this.config.END_HOUR && currentTime < 3.0) {
            if (this.ghostsKilled < this.totalGhostsToSpawn) {
                this.onHuntFailed();
            }
        }
    }
    
    /**
     * Update demolition ghost AI and attacks
     */
    updateDemolitionGhost(deltaTime) {
        const ghost = this.demolitionGhost;
        const playerPos = this.voxelWorld.camera.position;
        
        // Calculate distance to player
        const dx = playerPos.x - ghost.sprite.position.x;
        const dy = playerPos.y - ghost.sprite.position.y;
        const dz = playerPos.z - ghost.sprite.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Keep distance from player (15-25 blocks)
        const preferredDist = 20;
        const moveSpeed = 0.1; // Increased from 0.03/0.04 for visibility
        
        if (distance < preferredDist - 5) {
            // Back away
            const dirX = -dx / distance;
            const dirZ = -dz / distance;
            ghost.sprite.position.x += dirX * moveSpeed;
            ghost.sprite.position.z += dirZ * moveSpeed;
            ghost.baseY = ghost.sprite.position.y; // Update base position
        } else if (distance > preferredDist + 5) {
            // Get closer
            const dirX = dx / distance;
            const dirZ = dz / distance;
            ghost.sprite.position.x += dirX * moveSpeed;
            ghost.sprite.position.z += dirZ * moveSpeed;
            ghost.baseY = ghost.sprite.position.y; // Update base position
        }
        
        // Adjust to player Y (slower vertical movement)
        ghost.baseY += dy * 0.03;
        
        // Floating animation
        const time = performance.now() / 1000;
        const floatY = ghost.baseY + Math.sin(time * 1.5 + ghost.floatOffset) * 0.5;
        ghost.sprite.position.y = floatY;
        
        // Throw demolition charges
        ghost.throwTimer -= deltaTime;
        if (ghost.throwTimer <= 0 && distance < 40) {
            this.throwDemolitionCharge(ghost, playerPos);
            ghost.throwTimer = 5; // Every 5 seconds
        }
    }
    
    /**
     * Throw a demolition charge from ghost toward player
     */
    throwDemolitionCharge(ghost, playerPos) {
        const startPos = ghost.sprite.position.clone();
        startPos.y += 0.5;
        
        console.log(`💣 DEMOLITION GHOST throws explosive!`);
        
        // Use the game's demolition charge throw system
        if (this.voxelWorld.craftedTools) {
            // Create a demolition charge mesh
            const geometry = new THREE.SphereGeometry(0.3, 8, 8);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 0.5
            });
            const charge = new THREE.Mesh(geometry, material);
            charge.position.copy(startPos);
            this.scene.add(charge);
            
            // Calculate arc toward player
            const targetPos = playerPos.clone();
            const distance = startPos.distanceTo(targetPos);
            const duration = Math.max(1.5, distance / 15); // Slower for longer distances
            
            // Animate charge in arc
            const startTime = performance.now();
            let hasExploded = false; // Prevent double explosion
            
            const animateCharge = () => {
                if (hasExploded) return;
                
                const now = performance.now();
                const elapsed = (now - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1.0);
                
                // Check for collision with blocks during flight
                const bx = Math.floor(charge.position.x);
                const by = Math.floor(charge.position.y);
                const bz = Math.floor(charge.position.z);
                const blockType = this.voxelWorld.getBlock(bx, by, bz);
                
                // If hit a solid block (not air/water), stick and explode
                if (blockType && blockType !== 'air' && blockType !== 'water') {
                    hasExploded = true;
                    console.log(`💣 Demolition charge stuck to ${blockType}!`);
                    
                    // Stick to block surface
                    charge.position.x = bx + 0.5;
                    charge.position.y = by + 0.5;
                    charge.position.z = bz + 0.5;
                    
                    // Wait 3 seconds then explode
                    setTimeout(() => {
                        this.explodeDemolitionCharge(charge, playerPos);
                    }, 3000);
                    return;
                }
                
                if (progress >= 1.0) {
                    // Reached target, explode
                    hasExploded = true;
                    this.explodeDemolitionCharge(charge, playerPos);
                    return;
                }
                
                // Update position with arc
                charge.position.lerpVectors(startPos, targetPos, progress);
                // Add vertical arc
                const arcHeight = 5;
                charge.position.y += Math.sin(progress * Math.PI) * arcHeight;
                
                // Spin the charge
                charge.rotation.x += 0.2;
                charge.rotation.y += 0.15;
                
                requestAnimationFrame(animateCharge);
            };
            
            animateCharge();
            
            // Sound
            if (this.voxelWorld.sfxSystem) {
                try {
                    this.voxelWorld.sfxSystem.playSpatial('ghost', startPos, playerPos, {
                        maxDistance: 50,
                        volume: 0.9,
                        pitchVariation: 0.1
                    });
                } catch (error) {
                    console.warn('Demolition ghost sound error:', error);
                }
            }
        }
    }
    
    /**
     * Explode a demolition charge (with bedrock protection)
     */
    explodeDemolitionCharge(charge, playerPos) {
        const explodePos = charge.position;
        this.scene.remove(charge);
        charge.geometry.dispose();
        charge.material.dispose();
        
        // Create explosion effect
        if (this.voxelWorld.createExplosionEffect) {
            this.voxelWorld.createExplosionEffect(
                explodePos.x,
                explodePos.y,
                explodePos.z,
                'demolition'
            );
        }
        
        // Damage blocks in 3-block radius (PROTECT BEDROCK!)
        const radius = 3;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (dx * dx + dy * dy + dz * dz <= radius * radius) {
                        const bx = Math.floor(explodePos.x + dx);
                        const by = Math.floor(explodePos.y + dy);
                        const bz = Math.floor(explodePos.z + dz);
                        
                        // PROTECT BEDROCK LAYER (Y = 0)
                        if (by === 0) {
                            continue; // Skip bedrock destruction
                        }
                        
                        this.voxelWorld.removeBlock(bx, by, bz);
                    }
                }
            }
        }
        
        // Damage player if close
        const distToPlayer = explodePos.distanceTo(playerPos);
        if (distToPlayer < radius + 1) {
            const damage = Math.ceil(3 * (1 - distToPlayer / (radius + 1)));
            console.log(`💥 Demolition charge hit player for ${damage} damage!`);
            if (this.voxelWorld.takeDamage) {
                this.voxelWorld.takeDamage(damage);
            }
        }
    }
    
    /**
     * Check if spectral hunt should spawn (called at 9pm)
     */
    checkForSpectralHunt() {
        if (this.isActive || this.huntCheckedToday) {
            return false;
        }
        
        this.huntCheckedToday = true;
        
        // Calculate current day (1-7, cycling)
        this.currentDay = this.calculateCurrentDay();
        
        // Check if Halloween
        const isHalloween = this.isHalloweenNight();
        
        // Calculate probability
        let chance = Math.min(this.currentDay * this.config.BASE_CHANCE_PER_DAY, this.config.MAX_CHANCE);
        
        if (isHalloween) {
            chance = 1.0; // 100% on Halloween!
            console.log('🎃 HALLOWEEN NIGHT - Spectral Hunt guaranteed!');
        }
        
        console.log(`👻 Spectral Hunt check: Day ${this.currentDay}, ${Math.round(chance * 100)}% chance`);
        
        // Roll for spawn
        if (Math.random() < chance) {
            this.startSpectralHunt(isHalloween);
            return true;
        }
        
        return false;
    }
    
    /**
     * Start the spectral hunt event
     */
    startSpectralHunt(isHalloween = false) {
        console.log(`👻 SPECTRAL HUNT STARTING - Day ${this.currentDay}${isHalloween ? ' (HALLOWEEN)' : ''}`);
        
        this.isActive = true;
        this.huntStartTime = Date.now();
        this.ghostsKilled = 0;
        
        // Determine ghost count
        this.totalGhostsToSpawn = isHalloween 
            ? this.config.HALLOWEEN_GHOSTS 
            : Math.min(this.currentDay, this.config.MAX_GHOSTS);
        
        // Check for bloodmoon combo
        const isBloodMoon = this.voxelWorld.bloodMoonSystem?.isBloodMoonActive;
        if (isBloodMoon) {
            this.bloodMoonComboCount++;
            console.log(`🌕👻 BLOODMOON + SPECTRAL HUNT COMBO! (Count: ${this.bloodMoonComboCount})`);
            this.totalGhostsToSpawn += 1; // Extra ghost
            
            // THE 7TH COMBO - DEMOLITION GHOST APPEARS!
            if (this.bloodMoonComboCount >= 7) {
                console.log('💣👻 THE 7TH BLOOD MOON COMBO - DEMOLITION GHOST AWAKENS!');
                this.voxelWorld.updateStatus(
                    '💣👻 WARNING! DEMOLITION GHOST APPEARED!',
                    'discovery'
                );
                this.spawnDemolitionGhost();
            }
        }
        
        // Spawn big ghost
        this.spawnBigGhost(isHalloween);
        
        // Initialize colored ghost system
        this.coloredGhostSystem = new ColoredGhostSystem(
            this.scene,
            this.voxelWorld,
            this
        );
        
        // Schedule colored ghost waves
        this.scheduleGhostWaves();
        
        // Status message
        this.voxelWorld.updateStatus(
            `👻 SPECTRAL HUNT ACTIVE! Hunt ${this.totalGhostsToSpawn} colored ghosts before 2am!`,
            'discovery'
        );
        
        // Play atmospheric sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.play('ghost', { 
                volume: 0.3,
                loop: true 
            });
        }
    }
    
    /**
     * Spawn the big ghost entity
     */
    spawnBigGhost(isHalloween = false) {
        // Calculate size based on day
        let size = this.config.BIG_GHOST_BASE_SIZE + 
                   (this.currentDay - 1) * 
                   ((this.config.BIG_GHOST_MAX_SIZE - this.config.BIG_GHOST_BASE_SIZE) / 6);
        
        if (isHalloween) {
            size = this.config.BIG_GHOST_HALLOWEEN_SIZE;
        }
        
        // Determine if black ghost (Day 7)
        const isBlackGhost = this.currentDay === 7;
        
        console.log(`👻 Spawning big ghost: Size=${size}, Black=${isBlackGhost}, Halloween=${isHalloween}`);
        
        // Create big ghost entity
        this.bigGhost = new BigGhostEntity(
            this.scene,
            this.camera,
            this.voxelWorld,
            {
                size: size,
                radius: this.config.BIG_GHOST_RADIUS,
                rotationSpeed: this.config.BIG_GHOST_ROTATION_SPEED,
                isBlackGhost: isBlackGhost,
                isHalloween: isHalloween
            }
        );
    }
    
    /**
     * Spawn the special Demolition Ghost (7th Blood Moon combo)
     */
    spawnDemolitionGhost() {
        if (this.demolitionGhost) {
            console.warn('Demolition ghost already exists!');
            return;
        }
        
        const playerPos = this.voxelWorld.camera.position;
        
        // Spawn at a dramatic distance
        const spawnDistance = 30 + Math.random() * 10; // 30-40 blocks away
        const angle = Math.random() * Math.PI * 2;
        
        const x = playerPos.x + Math.cos(angle) * spawnDistance;
        const z = playerPos.z + Math.sin(angle) * spawnDistance;
        const y = playerPos.y;
        
        // Create 1.5x sized white ghost sprite
        const texture = this.coloredGhostSystem?.createGhostTexture() || this.createFallbackTexture();
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            color: 0xFFFFFF // Pure white - stands out!
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3.0, 3.0, 1); // 1.5x the normal 2.0 size
        sprite.position.set(x, y, z);
        this.scene.add(sprite);
        
        this.demolitionGhost = {
            sprite: sprite,
            baseY: y,
            floatOffset: Math.random() * Math.PI * 2,
            throwTimer: 5, // Throw every 5 seconds
            isAlive: true,
            hp: 10 // Takes 10 hits to kill!
        };
        
        console.log(`💣👻 DEMOLITION GHOST spawned at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
    }
    
    /**
     * Create fallback ghost texture
     */
    createFallbackTexture() {
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
     * Schedule colored ghost spawns in waves
     */
    scheduleGhostWaves() {
        const interval = this.config.SPAWN_INTERVAL * 1000; // Convert to ms
        
        for (let i = 0; i < this.totalGhostsToSpawn; i++) {
            setTimeout(() => {
                if (this.isActive && this.coloredGhostSystem) {
                    const colorIndex = i % this.config.GHOST_COLORS.length;
                    const color = this.config.GHOST_COLORS[colorIndex];
                    this.coloredGhostSystem.spawnColoredGhost(color);
                }
            }, i * interval);
        }
    }
    
    /**
     * Called when a colored ghost is killed
     */
    onGhostKilled(ghost) {
        this.ghostsKilled++;
        
        console.log(`👻 Ghost killed! (${this.ghostsKilled}/${this.totalGhostsToSpawn})`);
        
        // Small reward
        this.giveSmallReward();
        
        // Check for victory
        if (this.ghostsKilled >= this.totalGhostsToSpawn) {
            this.onHuntComplete();
        } else {
            // Progress update
            this.voxelWorld.updateStatus(
                `👻 ${this.ghostsKilled}/${this.totalGhostsToSpawn} ghosts hunted`,
                'discovery'
            );
        }
    }
    
    /**
     * Hunt completed successfully
     */
    onHuntComplete() {
        console.log('🎉 SPECTRAL HUNT COMPLETE!');
        
        // Calculate rewards
        const rewards = this.calculateRewards();
        
        // Give rewards
        this.giveRewards(rewards);
        
        // Victory effects
        this.createVictoryEffect();
        
        // Status message
        this.voxelWorld.updateStatus(
            '✨ SPECTRAL HUNT COMPLETE! Rewards claimed!',
            'discovery'
        );
        
        // Cleanup
        this.endHunt();
    }
    
    /**
     * Hunt failed (time ran out)
     */
    onHuntFailed() {
        console.log('⏰ SPECTRAL HUNT FAILED - Time ran out');
        
        this.voxelWorld.updateStatus(
            '👻 The spectral hunt has ended...',
            'warning'
        );
        
        // Cleanup
        this.endHunt();
    }
    
    /**
     * End the hunt and cleanup
     */
    endHunt() {
        // Despawn big ghost
        if (this.bigGhost) {
            this.bigGhost.despawn();
            this.bigGhost = null;
        }
        
        // Cleanup colored ghosts
        if (this.coloredGhostSystem) {
            this.coloredGhostSystem.cleanup();
            this.coloredGhostSystem = null;
        }
        
        // Cleanup demolition ghost
        if (this.demolitionGhost) {
            this.scene.remove(this.demolitionGhost.sprite);
            this.demolitionGhost.sprite.material.dispose();
            if (this.demolitionGhost.sprite.material.map) {
                this.demolitionGhost.sprite.material.map.dispose();
            }
            this.demolitionGhost = null;
        }
        
        // Stop ambient sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.stop('ghost');
        }
        
        this.isActive = false;
    }
    
    /**
     * Calculate current day (1-7, cycling)
     */
    calculateCurrentDay() {
        // Get total days elapsed since world creation
        const totalDays = Math.floor((this.voxelWorld.totalGameTime || 0) / 24);
        return (totalDays % 7) + 1; // Cycles 1-7
    }
    
    /**
     * Check if tonight is Halloween (October 31)
     */
    isHalloweenNight() {
        const date = new Date();
        return date.getMonth() === 9 && date.getDate() === 31; // Month 9 = October
    }
    
    /**
     * Give small reward for each ghost kill
     */
    giveSmallReward() {
        const drops = ['wheat', 'berry', 'carrot'];
        const randomDrop = drops[Math.floor(Math.random() * drops.length)];
        
        if (this.voxelWorld.inventory) {
            this.voxelWorld.inventory.addToInventory(randomDrop, 1);
        }
    }
    
    /**
     * Calculate final rewards based on day
     */
    calculateRewards() {
        const day = this.currentDay;
        const isHalloween = this.isHalloweenNight();
        const multiplier = isHalloween ? 2 : 1;
        
        const rewards = {
            wheat: 5 * day * multiplier,
            berry: 3 * day * multiplier,
            carrot: 2 * day * multiplier
        };
        
        // Spectral essence for Day 5-7
        if (day >= 5) {
            rewards.spectral_essence = day === 7 ? 2 : 1;
            if (isHalloween) rewards.spectral_essence *= 2;
        }
        
        return rewards;
    }
    
    /**
     * Give rewards to player
     */
    giveRewards(rewards) {
        if (!this.voxelWorld.inventory) return;
        
        console.log('🎁 Giving rewards:', rewards);
        
        for (const [item, amount] of Object.entries(rewards)) {
            this.voxelWorld.inventory.addToInventory(item, amount);
            
            const icon = this.voxelWorld.getItemIcon?.(item, 'status') || '📦';
            this.voxelWorld.updateStatus(`+${amount} ${icon}`, 'discovery');
        }
    }
    
    /**
     * Create victory particle effect
     */
    createVictoryEffect() {
        // TODO: Rainbow particle burst
        console.log('✨ Victory effect!');
    }
    
    /**
     * Reset daily check flag (call at dawn)
     */
    resetDailyCheck() {
        this.huntCheckedToday = false;
    }
    
    /**
     * Register console commands for testing (window functions)
     */
    registerConsoleCommands() {
        // Make functions available globally for testing in console
        
        // spectral_hunt('start') or spectral_hunt('start', 5) for Day 5
        window.spectral_hunt = (action, param) => {
            if (action === 'start') {
                const day = param || this.currentDay;
                this.currentDay = Math.max(1, Math.min(7, day));
                this.startSpectralHunt(false);
                console.log(`👻 Started Spectral Hunt (Day ${this.currentDay})`);
                return `Started Spectral Hunt (Day ${this.currentDay})`;
            }
            
            if (action === 'stop') {
                this.endHunt();
                console.log('👻 Spectral Hunt stopped');
                return 'Spectral Hunt stopped';
            }
            
            if (action === 'test_big') {
                this.spawnBigGhost(false);
                console.log('👻 Big ghost spawned for testing');
                return 'Big ghost spawned for testing';
            }
            
            if (action === 'test_colored') {
                const colorName = param || 'Red';
                const color = this.config.GHOST_COLORS.find(c => 
                    c.name.toLowerCase() === colorName.toLowerCase()
                );
                if (color) {
                    if (!this.coloredGhostSystem) {
                        this.coloredGhostSystem = new ColoredGhostSystem(
                            this.scene,
                            this.voxelWorld,
                            this
                        );
                    }
                    // Activate system so update loop runs!
                    this.isActive = true;
                    
                    this.coloredGhostSystem.spawnColoredGhost(color);
                    console.log(`👻 Spawned ${color.name} ghost (system active for updates)`);
                    return `Spawned ${color.name} ghost`;
                }
                return 'Invalid color. Try: red, orange, yellow, green, blue, indigo, black';
            }
            
            if (action === 'test_demolition') {
                // Activate system so update loop runs
                this.isActive = true;
                this.spawnDemolitionGhost();
                console.log('💣 Demolition Ghost spawned for testing!');
                return 'Demolition Ghost spawned!';
            }
            
            if (action === 'set_combo') {
                const count = parseInt(param) || 0;
                this.bloodMoonComboCount = count;
                console.log(`📊 Blood Moon combo count set to ${count}`);
                return `Blood Moon combo count: ${count}`;
            }
            
            return 'Usage: spectral_hunt("start"), spectral_hunt("stop"), spectral_hunt("test_big"), spectral_hunt("test_colored", "red"), spectral_hunt("test_demolition"), spectral_hunt("set_combo", 6)';
        };
        
        console.log('👻 Spectral Hunt console commands registered (use: spectral_hunt("test_big"))');
    }
    
    /**
     * Cleanup on destruction
     */
    dispose() {
        this.endHunt();
        console.log('👻 SpectralHuntSystem disposed');
    }
}
