/**
 * SoundEffectsSystem.js - One-shot sound effects player
 *
 * Features:
 * - Play sound effects once (no looping)
 * - Multiple simultaneous sounds
 * - Volume control (separate from music)
 * - Preloading for performance
 * - Powered by Howler.js
 */

import { Howl, Howler } from 'howler';

export class SoundEffectsSystem {
    constructor() {
        // Volume settings (0.0 to 1.0)
        this.volume = this.loadVolume();
        this.isMuted = false;

        // Sound cache (preloaded sounds)
        this.sounds = new Map();

        // Currently playing sounds (for tracking/cleanup)
        this.playingSounds = new Set();

        // CRITICAL: Set Howler.js global volume
        // Without this, ALL sounds are muted by default!
        Howler.volume(1.0); // Global volume at 100% (we control volume per-sound)
        
        // Check Web Audio API context state (might be suspended until user interaction)
        const ctx = Howler.ctx;
        if (ctx) {
            console.log(`🔊 Web Audio Context state: ${ctx.state}`);
            if (ctx.state === 'suspended') {
                console.warn('⚠️ Audio context is SUSPENDED - trying to resume...');
                ctx.resume().then(() => {
                    console.log('✅ Audio context resumed!');
                }).catch(err => {
                    console.error('❌ Failed to resume audio context:', err);
                });
            }
        }
        
        console.log('🔊 SoundEffectsSystem initialized');
        console.log(`   └─ Howler.js global volume: ${Howler.volume()}`);
    }

    /**
     * Load volume from localStorage
     */
    loadVolume() {
        const saved = localStorage.getItem('sfx_volume');
        if (saved !== null) {
            return parseFloat(saved);
        }
        return 0.7; // Default 70% volume (louder than music)
    }

    /**
     * Save volume to localStorage
     */
    saveVolume() {
        localStorage.setItem('sfx_volume', this.volume.toString());
    }

    /**
     * Preload a sound effect for instant playback
     * @param {string} soundId - Unique identifier for the sound (e.g., 'zombie_growl')
     * @param {string} filePath - Path to sound file (e.g., 'sfx/Zombie.ogg')
     */
    preload(soundId, filePath) {
        if (this.sounds.has(soundId)) {
            console.log(`🔊 Sound already preloaded: ${soundId}`);
            return;
        }

        // Fix path for electron
        const isElectron = window.isElectron?.platform;
        const fixedPath = isElectron && filePath.startsWith('/')
            ? filePath.substring(1)
            : filePath;

        console.log(`🔊 Preloading sound: ${soundId} → ${fixedPath}`);

        const howl = new Howl({
            src: [fixedPath],
            loop: false,  // One-shot sound
            volume: this.isMuted ? 0 : this.volume,
            html5: true, // Use HTML5 Audio for better compatibility (was false)
            preload: true,
            onload: () => {
                console.log(`🔊 ✅ Sound loaded: ${soundId}`);
            },
            onloaderror: (id, error) => {
                console.error(`🔊 ❌ Failed to load sound: ${soundId}`, error);
            }
        });

        this.sounds.set(soundId, {
            howl,
            path: fixedPath,
            playCount: 0
        });
    }

    /**
     * Preload multiple sounds at once
     * @param {Object} soundMap - Object mapping soundId → filePath
     * 
     * Example:
     * preloadBatch({
     *   'zombie': 'sfx/Zombie.ogg',
     *   'cat': 'sfx/CatMeow.ogg',
     *   'ghost': 'sfx/Ghost.ogg'
     * })
     */
    preloadBatch(soundMap) {
        console.log(`🔊 Preloading ${Object.keys(soundMap).length} sounds...`);
        for (const [soundId, filePath] of Object.entries(soundMap)) {
            this.preload(soundId, filePath);
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundId - Sound identifier (must be preloaded)
     * @param {Object} options - Optional configuration
     * @param {number} options.volume - Override volume for this play (0.0-1.0)
     * @param {number} options.rate - Playback speed (0.5-4.0, default 1.0)
     * @param {boolean} options.interrupt - Stop previous instance if playing (default: false)
     * @param {Object} options.pos - 3D position [x, y, z] for spatial audio
     * @param {Object} options.playerPos - Player position [x, y, z] for distance calculation
     * @param {number} options.maxDistance - Max audible distance (default: 50 blocks)
     * @returns {number|null} Sound instance ID (can be used to stop later)
     */
    play(soundId, options = {}) {
        const sound = this.sounds.get(soundId);
        
        if (!sound) {
            console.warn(`🔊 ⚠️ Sound not preloaded: ${soundId} (call preload() first)`);
            return null;
        }

        const { howl } = sound;

        // Stop previous instance if interrupt=true
        if (options.interrupt && howl.playing()) {
            howl.stop();
        }

        // Calculate volume based on distance (spatial audio)
        let volume = options.volume !== undefined 
            ? options.volume 
            : (this.isMuted ? 0 : this.volume);

        if (options.pos && options.playerPos) {
            const maxDistance = options.maxDistance || 50;
            const distance = Math.sqrt(
                Math.pow(options.pos[0] - options.playerPos[0], 2) +
                Math.pow(options.pos[1] - options.playerPos[1], 2) +
                Math.pow(options.pos[2] - options.playerPos[2], 2)
            );

            // Volume falloff: 100% at 0 distance, 0% at maxDistance
            const distanceFactor = Math.max(0, 1 - (distance / maxDistance));
            volume *= distanceFactor;

            // Don't play if too far away
            if (volume < 0.01) {
                return null;
            }
        }
        
        howl.volume(volume);

        // Set playback rate if specified
        if (options.rate !== undefined) {
            howl.rate(options.rate);
        }

        // Set 3D position for Howler's spatial audio
        if (options.pos) {
            howl.pos(options.pos[0], options.pos[1], options.pos[2]);
        }

        // Play the sound
        const soundInstanceId = howl.play();
        sound.playCount++;

        // Track playing sound
        this.playingSounds.add(soundInstanceId);

        // Auto-remove from tracking when finished
        howl.once('end', () => {
            this.playingSounds.delete(soundInstanceId);
        }, soundInstanceId);

        if (options.pos) {
            console.log(`🔊 Playing spatial: ${soundId} (volume: ${Math.round(volume * 100)}%)`);
        } else {
            console.log(`🔊 Playing: ${soundId} (instance: ${soundInstanceId}, volume: ${Math.round(volume * 100)}%, muted: ${this.isMuted})`);
        }

        // Extra debug for testing
        if (volume === 0.8 && !options.pos) {
            console.log(`   ├─ Howl state: playing=${howl.playing()}, loaded=${howl.state()}`);
            console.log(`   ├─ Actual volume set: ${howl.volume()}`);
            console.log(`   └─ HTML5 Audio: ${howl._html5 ? 'YES' : 'NO (Web Audio API)'}`);
        }

        return soundInstanceId;
    }

    /**
     * Play a sound with random pitch variation (more natural)
     * @param {string} soundId - Sound identifier
     * @param {number} pitchVariation - Amount of random pitch change (default: 0.1 = ±10%)
     * @param {Object} options - Additional play options (spatial audio, etc.)
     */
    playWithVariation(soundId, pitchVariation = 0.1, options = {}) {
        const randomRate = 1.0 + (Math.random() - 0.5) * 2 * pitchVariation;
        return this.play(soundId, { ...options, rate: randomRate });
    }

    /**
     * Play a spatial sound effect (3D positioned audio with distance falloff)
     * @param {string} soundId - Sound identifier
     * @param {Object} entityPos - Entity position {x, y, z}
     * @param {Object} playerPos - Player position {x, y, z}
     * @param {Object} options - Additional options
     * @param {number} options.maxDistance - Max audible distance (default: 50 blocks)
     * @param {number} options.pitchVariation - Random pitch variation (default: 0.1)
     * @returns {number|null} Sound instance ID
     */
    playSpatial(soundId, entityPos, playerPos, options = {}) {
        const { maxDistance = 50, pitchVariation = 0.1, ...otherOptions } = options;
        
        // Calculate distance first (early exit if too far)
        const distance = Math.sqrt(
            Math.pow(entityPos.x - playerPos.x, 2) +
            Math.pow(entityPos.y - playerPos.y, 2) +
            Math.pow(entityPos.z - playerPos.z, 2)
        );

        // Don't play if too far
        if (distance > maxDistance) {
            return null;
        }

        // Add pitch variation
        const randomRate = 1.0 + (Math.random() - 0.5) * 2 * pitchVariation;

        return this.play(soundId, {
            pos: [entityPos.x, entityPos.y, entityPos.z],
            playerPos: [playerPos.x, playerPos.y, playerPos.z],
            maxDistance,
            rate: randomRate,
            ...otherOptions
        });
    }

    /**
     * Stop a specific sound instance
     * @param {string} soundId - Sound identifier
     * @param {number} instanceId - Instance ID returned from play()
     */
    stopInstance(soundId, instanceId) {
        const sound = this.sounds.get(soundId);
        if (!sound) return;

        sound.howl.stop(instanceId);
        this.playingSounds.delete(instanceId);
        console.log(`🔊 Stopped instance: ${soundId} (${instanceId})`);
    }

    /**
     * Stop all instances of a sound
     * @param {string} soundId - Sound identifier
     */
    stopAll(soundId) {
        const sound = this.sounds.get(soundId);
        if (!sound) return;

        sound.howl.stop();
        console.log(`🔊 Stopped all instances: ${soundId}`);
    }

    /**
     * Stop ALL currently playing sounds
     */
    stopAllSounds() {
        for (const [soundId, sound] of this.sounds.entries()) {
            sound.howl.stop();
        }
        this.playingSounds.clear();
        console.log('🔊 All sounds stopped');
    }

    /**
     * Set volume for all sound effects
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0.0, Math.min(1.0, volume));
        this.saveVolume();

        // Update all loaded sounds
        const targetVolume = this.isMuted ? 0 : this.volume;
        for (const sound of this.sounds.values()) {
            sound.howl.volume(targetVolume);
        }

        console.log(`🔊 SFX Volume: ${Math.round(this.volume * 100)}%`);
    }

    /**
     * Increase volume by 10%
     */
    volumeUp() {
        this.setVolume(this.volume + 0.1);
    }

    /**
     * Decrease volume by 10%
     */
    volumeDown() {
        this.setVolume(this.volume - 0.1);
    }

    /**
     * Toggle mute for all sound effects
     */
    toggleMute() {
        this.isMuted = !this.isMuted;

        const targetVolume = this.isMuted ? 0 : this.volume;
        for (const sound of this.sounds.values()) {
            sound.howl.volume(targetVolume);
        }

        console.log(`🔊 SFX Mute: ${this.isMuted ? 'ON' : 'OFF'}`);
    }

    /**
     * Get statistics about loaded sounds
     */
    getStats() {
        const stats = {
            totalSounds: this.sounds.size,
            currentlyPlaying: this.playingSounds.size,
            sounds: []
        };

        for (const [soundId, sound] of this.sounds.entries()) {
            stats.sounds.push({
                id: soundId,
                path: sound.path,
                playCount: sound.playCount,
                isPlaying: sound.howl.playing()
            });
        }

        return stats;
    }

    /**
     * Unload a sound from memory
     * @param {string} soundId - Sound identifier
     */
    unload(soundId) {
        const sound = this.sounds.get(soundId);
        if (!sound) return;

        sound.howl.unload();
        this.sounds.delete(soundId);
        console.log(`🔊 Unloaded: ${soundId}`);
    }

    /**
     * Unload all sounds and clean up
     */
    cleanup() {
        for (const [soundId, sound] of this.sounds.entries()) {
            sound.howl.unload();
        }
        this.sounds.clear();
        this.playingSounds.clear();
        console.log('🔊 SoundEffectsSystem cleaned up');
    }

    /**
     * Dispose of the system (call on game shutdown)
     */
    dispose() {
        this.stopAllSounds();
        this.cleanup();
        console.log('🔊 SoundEffectsSystem disposed');
    }
}
