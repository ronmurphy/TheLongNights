/**
 * BigGhostEntity.js
 * 
 * Large atmospheric ghost billboard that follows the player during spectral hunts.
 * Similar to AtmosphericFog system - player-centered, cannot escape.
 * Looming presence that stays at fixed distance creating constant dread.
 * 
 * Features:
 * - Follows player at 50 blocks distance (player-centered)
 * - Massive 50x scale for intimidating presence
 * - Semi-transparent spooky appearance
 * - Black ghost on Day 7 (against red night sky)
 * - Ambient sound effects
 */

import * as THREE from 'three';

export class BigGhostEntity {
    constructor(scene, camera, voxelWorld, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.voxelWorld = voxelWorld;
        
        // Configuration - Player-centered atmospheric ghost
        this.baseSize = options.size || 20;
        this.distance = 50; // Fixed 50 blocks from player (like atmospheric fog)
        this.scale = 50; // Massive 50x scale for looming presence
        this.isBlackGhost = options.isBlackGhost || false;
        this.isHalloween = options.isHalloween || false;
        
        // State
        this.mesh = null;
        this.texture = null;
        this.offsetAngle = Math.random() * Math.PI * 2; // Random cardinal direction
        
        // Animation
        this.time = 0;
        this.bobSpeed = 0.5; // Slow bobbing
        this.bobAmount = 3; // Vertical bob distance
        
        // Sound
        this.lastSoundTime = 0;
        this.soundCooldown = 15000; // 15 seconds between sounds
        
        console.log(`👻 Atmospheric Ghost created: Distance=${this.distance} blocks, Scale=${this.scale}x, Black=${this.isBlackGhost}`);
        
        this.createGhost();
    }
    
    /**
     * Create the ghost billboard mesh
     */
    createGhost() {
        // Load ghost texture
        this.loadTexture();
        
        // Create geometry - scaled by massive factor
        const geometry = new THREE.PlaneGeometry(this.baseSize * this.scale, this.baseSize * this.scale);
        
        // Create material - semi-transparent and spooky
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: this.isBlackGhost ? 0.4 : 0.3, // Semi-transparent (spooky!)
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending // Normal blending for ghost effect
        });
        
        // Apply color tint
        if (this.isBlackGhost) {
            material.color.setHex(0x1a1a1a); // Dark gray (pure black too harsh)
        } else {
            material.color.setHex(0xaaaaaa); // Light gray (ethereal)
        }
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData.isAtmosphericGhost = true;
        
        // Position initially
        this.updatePosition();
        
        // Add to scene
        this.scene.add(this.mesh);
        
        console.log('👻 Atmospheric ghost mesh added to scene (50 blocks, 50x scale)');
    }
    
    /**
     * Load ghost texture (or create fallback)
     */
    loadTexture() {
        // Try to load enhanced ghost texture
        const enhancedData = this.voxelWorld.enhancedGraphics?.getEnhancedEntityImage?.('ghost');
        
        if (enhancedData?.path) {
            const loader = new THREE.TextureLoader();
            this.texture = loader.load(enhancedData.path);
            this.texture.magFilter = THREE.LinearFilter;
            this.texture.minFilter = THREE.LinearFilter;
            console.log('👻 Loaded ghost texture from enhanced graphics');
        } else {
            // Fallback: Create emoji texture
            this.texture = this.createEmojiTexture('👻');
            console.log('👻 Using emoji fallback texture');
        }
    }
    
    /**
     * Create emoji texture as fallback
     */
    createEmojiTexture(emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Draw emoji
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 64, 64);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        
        return texture;
    }
    
    /**
     * Update position (player-centered, like atmospheric fog)
     */
    updatePosition() {
        if (!this.mesh) return;
        
        // Get player position from camera
        const playerPos = this.voxelWorld.camera.position;
        
        // Position ghost at fixed distance in one cardinal direction
        // Uses offsetAngle to keep it in same relative position (not orbiting)
        const x = playerPos.x + Math.cos(this.offsetAngle) * this.distance;
        const z = playerPos.z + Math.sin(this.offsetAngle) * this.distance;
        const y = playerPos.y + 20; // Hover slightly above player eye level
        
        this.mesh.position.set(x, y, z);
        
        // Always face camera (billboard effect)
        this.mesh.lookAt(playerPos);
    }
    
    /**
     * Update loop (called every frame)
     */
    update(deltaTime) {
        if (!this.mesh) return;
        
        this.time += deltaTime;
        
        // Update position to follow player (like fog)
        this.updatePosition();
        
        // Slow vertical bobbing animation
        const bob = Math.sin(this.time * this.bobSpeed) * this.bobAmount;
        this.mesh.position.y += bob * deltaTime;
        
        // Slow rotation for ethereal effect (very subtle)
        this.mesh.rotation.z += deltaTime * 0.05;
        
        // Play ambient sound occasionally
        this.updateSound();
    }
    
    /**
     * Play ambient ghost sound with cooldown
     */
    updateSound() {
        const now = Date.now();
        if (now - this.lastSoundTime < this.soundCooldown) return;
        
        if (!this.voxelWorld.sfxSystem) return;
        
        // Play ambient ghost sound (always audible since ghost is always 50 blocks away)
        this.voxelWorld.sfxSystem.play('ghost', {
            volume: 0.25, // Quiet ambient presence
            rate: 0.7 // Lower pitch for atmospheric dread
        });
        
        this.lastSoundTime = now;
    }
    
    /**
     * Despawn the ghost with fadeout effect
     */
    despawn() {
        if (!this.mesh) return;
        
        console.log('👻 Big ghost despawning');
        
        // Fadeout animation (simple version - instant for now)
        this.scene.remove(this.mesh);
        
        // Cleanup resources
        if (this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
        if (this.mesh.material) {
            if (this.mesh.material.map) {
                this.mesh.material.map.dispose();
            }
            this.mesh.material.dispose();
        }
        
        this.mesh = null;
    }
    
    /**
     * Cleanup
     */
    dispose() {
        this.despawn();
    }
}
