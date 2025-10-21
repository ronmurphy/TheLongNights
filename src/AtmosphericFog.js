/**
 * AtmosphericFog.js
 * 
 * Low-impact volumetric fog system that augments THREE.Fog.
 * Creates layered smoke sprites for atmospheric effect during night/blood moon.
 * 
 * Features:
 * - Normal night: 2-3 ambient fog layers
 * - Blood moon: 5-7 intense fog layers (red-tinted)
 * - Proper disposal to prevent memory leaks
 * - Minimal performance impact (~1-2ms per frame)
 */

import * as THREE from 'three';

export class AtmosphericFog {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.fogLayers = [];
        this.isActive = false;
        this.isBloodMoon = false;
        
        // Smoke texture
        this.smokeTexture = null;
        this.loadTexture();
        
        // Configuration
        this.config = {
            normalNight: {
                layerCount: 3,
                opacity: 0.2,
                color: 0x4a5568, // Bluish-grey fog
                size: 40,
                distance: 25
            },
            bloodMoon: {
                layerCount: 7,
                opacity: 0.35,
                color: 0x8B0000, // Dark red fog
                size: 50,
                distance: 30
            }
        };
        
        console.log('🌫️ AtmosphericFog system initialized');
    }
    
    /**
     * Load smoke texture
     */
    async loadTexture() {
        const loader = new THREE.TextureLoader();
        try {
            this.smokeTexture = await loader.loadAsync('art/efx/Smoke-Element.png');
            console.log('🌫️ Smoke texture loaded');
        } catch (error) {
            console.error('🌫️ Failed to load smoke texture:', error);
        }
    }
    
    /**
     * Activate fog layers (night or blood moon)
     */
    activate(isBloodMoon = false) {
        if (this.isActive && this.isBloodMoon === isBloodMoon) {
            return; // Already active with same mode
        }
        
        // Clear existing layers first
        this.deactivate();
        
        if (!this.smokeTexture) {
            console.warn('🌫️ Smoke texture not loaded yet');
            return;
        }
        
        this.isActive = true;
        this.isBloodMoon = isBloodMoon;
        
        const config = isBloodMoon ? this.config.bloodMoon : this.config.normalNight;
        
        console.log(`🌫️ Activating ${isBloodMoon ? 'BLOOD MOON' : 'normal night'} fog (${config.layerCount} layers)`);
        
        // Create fog layers
        for (let i = 0; i < config.layerCount; i++) {
            const layer = this.createFogLayer(config, i);
            this.fogLayers.push(layer);
            this.scene.add(layer.mesh);
        }
    }
    
    /**
     * Create a single fog layer
     */
    createFogLayer(config, index) {
        const geometry = new THREE.PlaneGeometry(config.size, config.size);
        
        const material = new THREE.MeshBasicMaterial({
            map: this.smokeTexture,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide,
            fog: false // Don't let scene fog affect fog layers (avoid double-fog)
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Prevent raycast from hitting fog layers (player can't select them with reticle)
        mesh.raycast = function() {}; // Override raycast to do nothing
        
        // Position layer in a circle around player at varying depths
        const angle = (index / config.layerCount) * Math.PI * 2;
        const radius = config.distance + (Math.random() - 0.5) * 10;
        const height = 2 + Math.random() * 3; // Float at 2-5 blocks high
        
        mesh.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Random initial rotation
        mesh.rotation.z = Math.random() * Math.PI * 2;
        
        // Store animation data
        const layerData = {
            mesh,
            geometry,
            material,
            baseAngle: angle,
            rotationSpeed: (Math.random() - 0.5) * 0.02, // Slow rotation
            radius,
            height,
            phase: Math.random() * Math.PI * 2 // For wave motion
        };
        
        return layerData;
    }
    
    /**
     * Deactivate and dispose of all fog layers
     */
    deactivate() {
        if (!this.isActive) return;
        
        console.log(`🌫️ Deactivating fog (disposing ${this.fogLayers.length} layers)`);
        
        // Properly dispose of all layers
        for (const layer of this.fogLayers) {
            // Remove from scene
            this.scene.remove(layer.mesh);
            
            // Dispose geometry and material
            layer.geometry.dispose();
            layer.material.dispose();
        }
        
        this.fogLayers = [];
        this.isActive = false;
        this.isBloodMoon = false;
    }
    
    /**
     * Update fog animation (call once per frame)
     */
    update(delta) {
        if (!this.isActive || this.fogLayers.length === 0) return;
        
        // Safety check: ensure camera exists and has position
        if (!this.camera || !this.camera.position) {
            console.warn('🌫️ Camera not available for fog update');
            return;
        }
        
        const playerPos = this.camera.position;
        
        for (const layer of this.fogLayers) {
            // Slow rotation (update base angle instead of recalculating every frame)
            layer.baseAngle += layer.rotationSpeed;
            
            // Orbit around player with gentle wave motion
            layer.phase += delta * 0.1;
            const wave = Math.sin(layer.phase) * 2; // Gentle drift
            
            const offsetAngle = layer.baseAngle + delta * 0.05; // Slow orbit
            layer.mesh.position.x = playerPos.x + Math.cos(offsetAngle) * layer.radius + wave;
            layer.mesh.position.z = playerPos.z + Math.sin(offsetAngle) * layer.radius + wave;
            layer.mesh.position.y = layer.height + Math.sin(layer.phase * 0.5) * 0.5; // Gentle bob
            
            // Billboard effect: manually calculate rotation to face camera (faster than lookAt)
            const dx = this.camera.position.x - layer.mesh.position.x;
            const dz = this.camera.position.z - layer.mesh.position.z;
            layer.mesh.rotation.y = Math.atan2(dx, dz);
        }
    }
    
    /**
     * Check time and activate/deactivate fog accordingly
     */
    checkTimeAndUpdate(isNight, isBloodMoonActive) {
        if (isNight) {
            // Activate appropriate fog mode
            this.activate(isBloodMoonActive);
        } else {
            // Deactivate during day
            this.deactivate();
        }
    }
    
    /**
     * Complete cleanup (call when game is destroyed)
     */
    dispose() {
        this.deactivate();
        
        // Dispose texture
        if (this.smokeTexture) {
            this.smokeTexture.dispose();
            this.smokeTexture = null;
        }
        
        console.log('🌫️ AtmosphericFog disposed');
    }
}
