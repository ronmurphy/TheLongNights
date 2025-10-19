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

        console.log('🔊 SoundEffectsSystem initialized');
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
            html5: false, // Web Audio API for better performance
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

        // Set volume (use override or system volume)
        const volume = options.volume !== undefined 
            ? options.volume 
            : (this.isMuted ? 0 : this.volume);
        
        howl.volume(volume);

        // Set playback rate if specified
        if (options.rate !== undefined) {
            howl.rate(options.rate);
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

        console.log(`🔊 Playing: ${soundId} (instance: ${soundInstanceId}, volume: ${Math.round(volume * 100)}%)`);

        return soundInstanceId;
    }

    /**
     * Play a sound with random pitch variation (more natural)
     * @param {string} soundId - Sound identifier
     * @param {number} pitchVariation - Amount of random pitch change (default: 0.1 = ±10%)
     */
    playWithVariation(soundId, pitchVariation = 0.1) {
        const randomRate = 1.0 + (Math.random() - 0.5) * 2 * pitchVariation;
        return this.play(soundId, { rate: randomRate });
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
