/**
 * WeatherSystem.js
 * 
 * Lightweight particle-based weather system using billboard sprites.
 * Follows the same efficient pattern as AtmosphericFog.js
 * 
 * Features:
 * - Rain: Falling droplets (light/heavy)
 * - Thunder: Rain + lightning flashes at elevation
 * - Snow: Larger particles (scaled rain) with slower fall
 * - Minimal performance impact (reuses particles)
 * - Proper cleanup and disposal
 */

import * as THREE from 'three';

export class WeatherSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.particles = [];
        this.isActive = false;
        this.currentWeather = null; // 'rain', 'thunder', 'snow', null
        
        // Particle pool for reuse
        this.particlePool = {
            geometry: null,
            material: null
        };
        
        // Thunder/lightning
        this.thunderTimer = 0;
        this.thunderInterval = 5; // Seconds between strikes
        this.lightningFlash = null;
        
        // Configuration
        this.config = {
            rain: {
                particleCount: 200,
                speed: 15,
                size: 0.1,
                opacity: 0.6,
                color: 0x7fa8d6, // Light blue
                spawnRadius: 30,
                spawnHeight: 25
            },
            thunder: {
                particleCount: 300, // More intense rain
                speed: 18,
                size: 0.12,
                opacity: 0.7,
                color: 0x4a5f7a, // Darker blue
                spawnRadius: 30,
                spawnHeight: 25,
                lightningChance: 0.3, // 30% chance per thunder interval
                minElevation: 50 // Only thunderstorms at elevation
            },
            snow: {
                particleCount: 150,
                speed: 3, // Much slower
                size: 0.3, // Larger particles
                opacity: 0.8,
                color: 0xffffff, // White
                spawnRadius: 30,
                spawnHeight: 25,
                drift: 2 // Side-to-side movement
            }
        };
        
        console.log('🌦️ WeatherSystem initialized');
    }
    
    /**
     * Initialize particle pool (call once)
     */
    initializeParticlePool() {
        // Simple plane geometry for billboard particles
        this.particlePool.geometry = new THREE.PlaneGeometry(1, 1);
        
        // Basic material (will be cloned for different weather types)
        this.particlePool.material = new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            fog: false
        });
        
        console.log('🌦️ Particle pool initialized');
    }
    
    /**
     * Start weather effect
     * @param {string} type - 'rain', 'thunder', or 'snow'
     * @param {number} playerElevation - Player's Y position (for thunder elevation check)
     */
    startWeather(type, playerElevation = 0) {
        if (this.isActive && this.currentWeather === type) {
            return; // Already active
        }
        
        // Stop any existing weather
        this.stopWeather();
        
        if (!this.particlePool.geometry) {
            this.initializeParticlePool();
        }
        
        const config = this.config[type];
        if (!config) {
            console.warn(`🌦️ Unknown weather type: ${type}`);
            return;
        }
        
        // Check elevation for thunder
        if (type === 'thunder' && playerElevation < config.minElevation) {
            console.log(`🌦️ Thunder only at elevation ${config.minElevation}+, using rain instead`);
            type = 'rain';
        }
        
        this.isActive = true;
        this.currentWeather = type;
        this.thunderTimer = 0;
        
        console.log(`🌦️ Starting ${type} weather (${config.particleCount} particles)`);
        
        // Create particles
        for (let i = 0; i < config.particleCount; i++) {
            const particle = this.createParticle(config, type);
            this.particles.push(particle);
            this.scene.add(particle.mesh);
        }
        
        // Create lightning flash for thunder
        if (type === 'thunder') {
            this.createLightningFlash();
        }
    }
    
    /**
     * Create a single weather particle
     */
    createParticle(config, weatherType) {
        const geometry = this.particlePool.geometry.clone();
        const material = this.particlePool.material.clone();
        
        material.opacity = config.opacity;
        material.color.setHex(config.color);
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(config.size, config.size * 3, 1); // Elongated for rain
        
        // Random spawn position around camera
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * config.spawnRadius;
        
        mesh.position.set(
            Math.cos(angle) * radius,
            config.spawnHeight + Math.random() * 10,
            Math.sin(angle) * radius
        );
        
        // Store particle data
        const particleData = {
            mesh,
            geometry,
            material,
            speed: config.speed + (Math.random() - 0.5) * 2,
            drift: weatherType === 'snow' ? (Math.random() - 0.5) * config.drift : 0,
            phase: Math.random() * Math.PI * 2, // For snow drift
            spawnRadius: config.spawnRadius,
            spawnHeight: config.spawnHeight
        };
        
        return particleData;
    }
    
    /**
     * Create lightning flash effect (hemisphere light)
     */
    createLightningFlash() {
        this.lightningFlash = new THREE.HemisphereLight(
            0xffffff, // Sky color
            0x333333, // Ground color  
            0 // Start at 0 intensity
        );
        this.scene.add(this.lightningFlash);
    }
    
    /**
     * Trigger lightning strike
     */
    triggerLightning() {
        if (!this.lightningFlash) return;
        
        console.log('⚡ Lightning strike!');
        
        // Flash on
        this.lightningFlash.intensity = 2;
        
        // Flash off after brief delay
        setTimeout(() => {
            if (this.lightningFlash) {
                this.lightningFlash.intensity = 0;
            }
        }, 100);
        
        // Second flash (common in lightning)
        setTimeout(() => {
            if (this.lightningFlash) {
                this.lightningFlash.intensity = 1.5;
                setTimeout(() => {
                    if (this.lightningFlash) {
                        this.lightningFlash.intensity = 0;
                    }
                }, 50);
            }
        }, 200);
    }
    
    /**
     * Stop weather and clean up particles
     */
    stopWeather() {
        if (!this.isActive) return;
        
        console.log(`🌦️ Stopping ${this.currentWeather} weather (${this.particles.length} particles)`);
        
        // Remove and dispose all particles
        for (const particle of this.particles) {
            this.scene.remove(particle.mesh);
            particle.geometry.dispose();
            particle.material.dispose();
        }
        
        this.particles = [];
        
        // Remove lightning
        if (this.lightningFlash) {
            this.scene.remove(this.lightningFlash);
            this.lightningFlash.dispose();
            this.lightningFlash = null;
        }
        
        this.isActive = false;
        this.currentWeather = null;
    }
    
    /**
     * Update weather animation (call once per frame)
     */
    update(delta) {
        if (!this.isActive || this.particles.length === 0) return;
        
        if (!this.camera || !this.camera.position) {
            console.warn('🌦️ Camera not available for weather update');
            return;
        }
        
        const playerPos = this.camera.position;
        const config = this.config[this.currentWeather];
        
        // Update thunder timer
        if (this.currentWeather === 'thunder') {
            this.thunderTimer += delta;
            if (this.thunderTimer >= this.thunderInterval) {
                this.thunderTimer = 0;
                if (Math.random() < config.lightningChance) {
                    this.triggerLightning();
                }
            }
        }
        
        // Update particles
        for (const particle of this.particles) {
            // Fall down
            particle.mesh.position.y -= particle.speed * delta;
            
            // Snow drift (side-to-side)
            if (this.currentWeather === 'snow') {
                particle.phase += delta;
                particle.mesh.position.x += Math.sin(particle.phase) * particle.drift * delta;
            }
            
            // Respawn if below player
            if (particle.mesh.position.y < playerPos.y - 5) {
                // Reset to top
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * particle.spawnRadius;
                
                particle.mesh.position.x = playerPos.x + Math.cos(angle) * radius;
                particle.mesh.position.y = playerPos.y + particle.spawnHeight + Math.random() * 10;
                particle.mesh.position.z = playerPos.z + Math.sin(angle) * radius;
            }
            
            // Keep particles around player (horizontal repositioning)
            const dx = particle.mesh.position.x - playerPos.x;
            const dz = particle.mesh.position.z - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > particle.spawnRadius * 1.5) {
                // Respawn closer to player
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * particle.spawnRadius;
                
                particle.mesh.position.x = playerPos.x + Math.cos(angle) * radius;
                particle.mesh.position.z = playerPos.z + Math.sin(angle) * radius;
            }
            
            // Billboard effect: face camera (efficient rotation)
            const cameraAngle = Math.atan2(
                this.camera.position.x - particle.mesh.position.x,
                this.camera.position.z - particle.mesh.position.z
            );
            particle.mesh.rotation.y = cameraAngle;
        }
    }
    
    /**
     * Get current weather type
     */
    getWeather() {
        return this.currentWeather;
    }
    
    /**
     * Check if weather is active
     */
    isWeatherActive() {
        return this.isActive;
    }
    
    /**
     * Complete cleanup (call when game is destroyed)
     */
    dispose() {
        this.stopWeather();
        
        // Dispose particle pool
        if (this.particlePool.geometry) {
            this.particlePool.geometry.dispose();
            this.particlePool.geometry = null;
        }
        if (this.particlePool.material) {
            this.particlePool.material.dispose();
            this.particlePool.material = null;
        }
        
        console.log('🌦️ WeatherSystem disposed');
    }
}
