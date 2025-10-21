/**
 * BigGhostEntity.js
 * 
 * Large atmospheric ghost billboard that follows the player during spectral hunts.
 * Follows AtmosphericFog.js pattern - player-centered, cannot escape.
 * Looming presence that stays at fixed distance creating constant dread.
 * 
 * Features:
 * - Follows player at configurable distance (player-centered like AtmosphericFog)
 * - 10 blocks tall for intimidating but visible presence
 * - Semi-transparent spooky appearance
 * - Black ghost on Day 7 (against red night sky)
 * - Ambient sound effects
 * - Proper async texture loading (like AtmosphericFog)
 */

import * as THREE from 'three';

export class BigGhostEntity {
    constructor(scene, camera, voxelWorld, options = {}) {
        this.scene = scene;
        this.camera = camera; // Stored reference
        this.voxelWorld = voxelWorld;
        
        console.log('👻 BigGhostEntity constructor - camera check:', {
            cameraProvided: !!camera,
            hasPosition: !!(camera?.position),
            voxelWorldCamera: !!voxelWorld?.camera,
            voxelWorldCameraPosition: !!(voxelWorld?.camera?.position)
        });
        
        // Configuration - Following AtmosphericFog pattern
        this.ghostSize = 25; // 15 blocks tall (bigger and more imposing)
        this.distance = 25; // Same distance as AtmosphericFog normal night
        this.isBlackGhost = options.isBlackGhost || false;
        this.isHalloween = options.isHalloween || false;
        
        // State
        this.mesh = null;
        this.ghostTexture = null;
        this.isActive = false;
        this.baseHeight = 15; // Hover height above player (looming)
        
        // Animation (matching AtmosphericFog pattern)
        this.baseAngle = Math.random() * Math.PI * 2; // Random starting position
        this.rotationSpeed = (Math.random() - 0.5) * 0.01; // Slower than fog (fog uses 0.02)
        this.phase = Math.random() * Math.PI * 2; // For wave motion
        
        // Sound
        this.lastSoundTime = 0;
        this.soundCooldown = 15000; // 15 seconds between sounds
        
        console.log(`👻 BigGhostEntity initialized: Size=${this.ghostSize} blocks, Distance=${this.distance}, Black=${this.isBlackGhost}`);
        
        // Load texture (async like AtmosphericFog)
        this.loadTexture();
    }
    
    /**
     * Load ghost texture (async like AtmosphericFog)
     */
    async loadTexture() {
        const loader = new THREE.TextureLoader();
        
        console.log('👻 Loading ghost texture...');
        
        // Try to load enhanced ghost texture
        const enhancedData = this.voxelWorld.enhancedGraphics?.getEnhancedEntityImage?.('ghost');
        
        console.log('👻 Enhanced graphics data:', enhancedData);
        
        if (enhancedData?.path) {
            try {
                console.log('👻 Attempting to load texture from:', enhancedData.path);
                this.ghostTexture = await loader.loadAsync(enhancedData.path);
                this.ghostTexture.magFilter = THREE.LinearFilter;
                this.ghostTexture.minFilter = THREE.LinearFilter;
                console.log('👻 ✅ Successfully loaded ghost texture from enhanced graphics');
            } catch (error) {
                console.warn('👻 ❌ Failed to load ghost texture, using emoji fallback:', error);
                this.ghostTexture = this.createEmojiTexture('👻');
            }
        } else {
            // Fallback: Create emoji texture
            console.log('👻 No enhanced graphics path, using emoji fallback');
            this.ghostTexture = this.createEmojiTexture('👻');
        }
        
        console.log('👻 Texture loaded, calling activate()...');
        // Now that texture is loaded, create the ghost mesh
        this.activate();
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
     * Activate ghost (create mesh after texture loads - like AtmosphericFog)
     */
    activate() {
        if (this.isActive) {
            console.log('👻 Ghost already active, skipping activation');
            return; // Already active
        }
        
        if (!this.ghostTexture) {
            console.warn('👻 ⚠️ Ghost texture not loaded yet, cannot activate');
            return;
        }
        
        console.log(`👻 Activating ${this.isBlackGhost ? 'BLACK' : 'normal'} ghost...`);
        
        this.isActive = true;
        
        // Create the ghost mesh
        this.createGhostMesh();
        
        console.log('👻 ✅ Ghost activation complete');
    }
    
    /**
     * Create the ghost mesh (called after texture loads)
     */
    createGhostMesh() {
        // Create geometry - 10 blocks tall, width auto-sized to texture aspect ratio
        // Assuming ghost texture is roughly square, make it 10x10
        const geometry = new THREE.PlaneGeometry(this.ghostSize, this.ghostSize);
        
        // Flip texture horizontally so ghost faces the correct direction
        this.ghostTexture.repeat.x = -1;
        this.ghostTexture.offset.x = 1;
        
        // Create material - semi-transparent and spooky (following AtmosphericFog pattern)
        const material = new THREE.MeshBasicMaterial({
            map: this.ghostTexture,
            transparent: true,
            opacity: this.isBlackGhost ? 0.5 : 0.4, // Visible but ghostly
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending,
            fog: false // Don't let scene fog affect ghost
        });
        
        // Apply color tint for visual effect
        if (this.isBlackGhost) {
            material.color.setHex(0x2a2a2a); // Dark gray (more visible than pure black)
        } else {
            material.color.setHex(0xdddddd); // Light gray (ethereal)
        }
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData.isBigGhost = true;
        
        // Prevent raycast from hitting this mesh (player can't select it with reticle)
        this.mesh.raycast = function() {}; // Override raycast to do nothing
        
        console.log('👻 Mesh created:', {
            visible: this.mesh.visible,
            position: this.mesh.position,
            scale: this.mesh.scale,
            opacity: material.opacity,
            hasTexture: !!material.map
        });
        
        // Position initially (following AtmosphericFog pattern)
        this.updatePosition();
        
        console.log('👻 After updatePosition:', {
            position: { x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z }
        });
        
        // Add to scene
        this.scene.add(this.mesh);
        
        console.log(`👻 Big ghost mesh added to scene (${this.ghostSize} blocks tall, ${this.distance} blocks away)`);
    }
    
    /**
     * Update position (player-centered, following AtmosphericFog pattern)
     */
    updatePosition() {
        if (!this.mesh) return;
        
        // Safety check: ensure camera exists (like AtmosphericFog)
        if (!this.camera || !this.camera.position) {
            console.warn('👻 Camera not available for ghost update');
            return;
        }
        
        // Get player position from camera
        const playerPos = this.camera.position;
        
        // Position ghost at fixed distance (like AtmosphericFog layers)
        // Uses baseAngle to keep it in same relative position around player
        const x = playerPos.x + Math.cos(this.baseAngle) * this.distance;
        const z = playerPos.z + Math.sin(this.baseAngle) * this.distance;
        const y = playerPos.y + this.baseHeight; // Loom above player
        
        this.mesh.position.set(x, y, z);
        
        // Always face camera (billboard effect)
        this.mesh.lookAt(playerPos);
    }
    
    /**
     * Deactivate and dispose of ghost (like AtmosphericFog)
     */
    deactivate() {
        if (!this.isActive) return;
        
        console.log('👻 Deactivating big ghost');
        
        if (this.mesh) {
            // Remove from scene
            this.scene.remove(this.mesh);
            
            // Dispose geometry
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            
            // Dispose material (but NOT the texture - we reuse it)
            if (this.mesh.material) {
                // Don't dispose the map here - we keep ghostTexture for reuse
                this.mesh.material.map = null; // Clear reference
                this.mesh.material.dispose();
            }
            
            this.mesh = null;
        }
        
        this.isActive = false;
    }
    
    /**
     * Update loop (called every frame - EXACT AtmosphericFog pattern, just slower)
     */
    update(delta) {
        if (!this.isActive || !this.mesh) {
            // Only log once when skipped
            if (!this._updateSkipLogged) {
                console.log('👻 Update skipped:', { isActive: this.isActive, hasMesh: !!this.mesh });
                this._updateSkipLogged = true;
            }
            return;
        }
        
        // Safety check: ensure camera exists (like AtmosphericFog)
        if (!this.camera || !this.camera.position) {
            console.warn('👻 Camera not available for ghost update');
            return;
        }
        
        // First successful update
        if (!this._updateStarted) {
            console.log('👻 ✅ Update loop started successfully!');
            this._updateStarted = true;
        }
        
        const playerPos = this.camera.position;
        
        // Slow rotation (update base angle - EXACT AtmosphericFog pattern)
        this.baseAngle += this.rotationSpeed;
        
        // Orbit around player with gentle wave motion (EXACT AtmosphericFog pattern)
        this.phase += delta * 0.05; // Half speed of fog (fog uses 0.1)
        const wave = Math.sin(this.phase) * 2; // Gentle drift
        
        const offsetAngle = this.baseAngle + delta * 0.025; // Half speed of fog (fog uses 0.05)
        this.mesh.position.x = playerPos.x + Math.cos(offsetAngle) * this.distance + wave;
        this.mesh.position.z = playerPos.z + Math.sin(offsetAngle) * this.distance + wave;
        this.mesh.position.y = playerPos.y + this.baseHeight + Math.sin(this.phase * 0.5) * 1.5; // Gentle bob
        
        // Debug: Log position every 60 frames
        if (Math.random() < 0.016) { // ~1 per second at 60fps
            console.log('👻 Ghost position:', {
                ghost: { x: this.mesh.position.x.toFixed(1), y: this.mesh.position.y.toFixed(1), z: this.mesh.position.z.toFixed(1) },
                player: { x: playerPos.x.toFixed(1), y: playerPos.y.toFixed(1), z: playerPos.z.toFixed(1) },
                distance: this.distance,
                visible: this.mesh.visible,
                opacity: this.mesh.material.opacity
            });
        }
        
        // Billboard effect: manually calculate rotation to face camera (EXACT AtmosphericFog method)
        const dx = this.camera.position.x - this.mesh.position.x;
        const dz = this.camera.position.z - this.mesh.position.z;
        this.mesh.rotation.y = Math.atan2(dx, dz);
        
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
        
        // Play ambient ghost sound (atmospheric presence)
        this.voxelWorld.sfxSystem.play('ghost', {
            volume: 0.3, // Audible atmospheric presence
            rate: 0.6 // Low pitch for dread
        });
        
        this.lastSoundTime = now;
    }
    
    /**
     * Complete cleanup (call when destroying the ghost - like AtmosphericFog)
     */
    dispose() {
        this.deactivate();
        
        // Dispose texture
        if (this.ghostTexture) {
            this.ghostTexture.dispose();
            this.ghostTexture = null;
        }
        
        console.log('👻 BigGhostEntity disposed');
    }
}
