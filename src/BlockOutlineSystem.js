/**
 * BlockOutlineSystem.js
 * 
 * Context-aware colored edge highlighting for targeted blocks.
 * Uses Three.js EdgesGeometry for crisp, performant outlines.
 * 
 * Features:
 * - Different colors based on block context (mineable, placeable, interactive, etc.)
 * - Smooth color transitions
 * - Minimal performance impact (reuses geometry)
 * - Integrates with existing raycast system
 */

import * as THREE from 'three';

export class BlockOutlineSystem {
    constructor(scene, voxelWorld) {
        this.scene = scene;
        this.voxelWorld = voxelWorld;
        
        // Outline mesh (uses EdgesGeometry for crisp lines)
        this.outlineMesh = null;
        this.currentGeometry = null;
        
        // Color scheme
        this.colors = {
            mineable: 0x00ff00,      // Green - Can mine/break
            placeable: 0x4fc3f7,     // Cyan - Can place block here
            interactive: 0xffd700,    // Gold - Workbench, chest, etc.
            resource: 0xff6b6b,      // Red - Valuable resource (iron, gold)
            farming: 0x90ee90,       // Light green - Farmland, crops
            water: 0x1e90ff,         // Blue - Water blocks
            special: 0xff00ff,       // Magenta - Special blocks (pumpkin, etc.)
            bedrock: 0x808080,       // Gray - Unbreakable
            house: 0xffaa00,         // Orange - House placement footprint
            entity: 0xff4500,        // Orange-Red - Attackable entities (animals, enemies)
            crafted: 0x9370db,       // Purple - Crafted objects (campfire, ghost rod, etc.)
        };
        
        // Cache last target to avoid recreating geometry every frame
        this.lastTarget = { x: null, y: null, z: null, type: null, dimensions: null };
        
        this.init();
    }
    
    /**
     * Initialize the outline system
     */
    init() {
        // Create outline material (LineBasicMaterial for edges)
        const material = new THREE.LineBasicMaterial({
            color: this.colors.mineable,
            linewidth: 2, // Note: linewidth > 1 only works in WebGL 2
            transparent: true,
            opacity: 0.9,
            depthTest: true,
            depthWrite: false
        });
        
        // Create outline mesh with initial 1x1x1 box
        const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
        this.outlineMesh = new THREE.LineSegments(geometry, material);
        this.outlineMesh.visible = false;
        this.currentGeometry = geometry;
        
        this.scene.add(this.outlineMesh);
        
        console.log('🎨 BlockOutlineSystem initialized with colored edges');
    }
    
    /**
     * Update outline based on raycast hit
     * @param {THREE.Intersection} hit - Raycast intersection result
     * @param {Object} blockData - Block data from world
     */
    update(hit, blockData) {
        if (!hit) {
            this.hide();
            return;
        }
        
        const pos = hit.object.position;
        
        // Check if hitting an entity sprite or crafted object
        let blockType = null;
        let isEntity = false;
        let isCrafted = false;
        
        // Check for crafted objects (campfire, ghost rod, etc.)
        if (hit.object.userData && hit.object.userData.isCraftedObject) {
            blockType = hit.object.userData.itemId || 'crafted_object';
            isCrafted = true;
        }
        // Check for entities (sprites with entity data)
        else if (hit.object.isSprite && (hit.object.userData.isAnimal || hit.object.userData.isEnemy || hit.object.userData.isGhost)) {
            blockType = hit.object.userData.type || 'entity';
            isEntity = true;
        }
        // Regular block
        else if (blockData) {
            blockType = blockData.type;
        } else {
            this.hide();
            return;
        }
        
        // Check for house placement mode
        const selectedSlot = this.voxelWorld.hotbarSystem?.getSelectedSlot();
        const isHouseSelected = selectedSlot && selectedSlot.itemType && selectedSlot.itemType.includes('simple_house');
        
        // Determine dimensions and color
        let dimensions = { width: 1, height: 1, depth: 1 };
        let color;
        
        // Priority: crafted > entity > house > block type
        if (isCrafted) {
            color = this.colors.crafted;
        } else if (isEntity) {
            color = this.colors.entity;
        } else if (isHouseSelected) {
            // Get house dimensions
            const interiorLength = this.voxelWorld.workbenchSystem?.selectedShape === 'simple_house' 
                ? (this.voxelWorld.workbenchSystem.shapeLength || 4)
                : 4;
            const interiorWidth = this.voxelWorld.workbenchSystem?.selectedShape === 'simple_house' 
                ? (this.voxelWorld.workbenchSystem.shapeWidth || 4)
                : 4;
            
            const exteriorLength = interiorLength + 2;
            const exteriorWidth = interiorWidth + 2;
            
            dimensions = { width: exteriorLength, height: 1, depth: exteriorWidth };
            color = this.colors.house;
        } else {
            // Regular block - use context-aware color
            color = this.getColorForBlock(blockType, blockData);
        }
        
        // Check if we need to recreate geometry (position, type, or dimensions changed)
        const dimensionsKey = `${dimensions.width},${dimensions.height},${dimensions.depth}`;
        const needsUpdate = 
            this.lastTarget.x !== pos.x ||
            this.lastTarget.y !== pos.y ||
            this.lastTarget.z !== pos.z ||
            this.lastTarget.type !== blockType ||
            this.lastTarget.dimensions !== dimensionsKey;
        
        if (needsUpdate) {
            // Update position
            this.outlineMesh.position.copy(pos);
            
            // Recreate geometry if dimensions changed
            if (this.lastTarget.dimensions !== dimensionsKey) {
                this.updateGeometry(dimensions);
            }
            
            // Update color with smooth transition
            this.updateColor(color);
            
            // Cache current target
            this.lastTarget = { 
                x: pos.x, 
                y: pos.y, 
                z: pos.z, 
                type: blockType,
                dimensions: dimensionsKey
            };
        }
        
        // Show outline
        this.outlineMesh.visible = true;
    }
    
    /**
     * Update outline geometry for different dimensions
     * @param {Object} dimensions - {width, height, depth}
     */
    updateGeometry(dimensions) {
        // Dispose old geometry
        if (this.currentGeometry) {
            this.currentGeometry.dispose();
        }
        
        // Create new box with specified dimensions
        const boxGeometry = new THREE.BoxGeometry(
            dimensions.width + 0.02,
            dimensions.height + 0.02,
            dimensions.depth + 0.02
        );
        
        // Create edges geometry
        this.currentGeometry = new THREE.EdgesGeometry(boxGeometry);
        this.outlineMesh.geometry = this.currentGeometry;
        
        // Dispose temporary box geometry
        boxGeometry.dispose();
    }
    
    /**
     * Get color based on block type and context
     * @param {string} blockType - Block type name
     * @param {Object} blockData - Block data
     * @returns {number} Hex color code
     */
    getColorForBlock(blockType, blockData) {
        // Bedrock - unbreakable
        if (blockType === 'bedrock') {
            return this.colors.bedrock;
        }
        
        // Water - special handling
        if (blockType === 'water') {
            return this.colors.water;
        }
        
        // Valuable resources
        if (blockType === 'iron' || blockType === 'gold') {
            return this.colors.resource;
        }
        
        // Interactive blocks
        if (blockType === 'workbench' || blockType === 'tool_bench' || 
            blockType === 'kitchen_bench' || blockType === 'chest') {
            return this.colors.interactive;
        }
        
        // Farming blocks
        if (blockType === 'farmland' || blockType === 'wheat' || blockType === 'carrot' || 
            blockType === 'potato' || blockType === 'beetroot') {
            return this.colors.farming;
        }
        
        // Special blocks
        if (blockType === 'pumpkin' || blockType.includes('ancient')) {
            return this.colors.special;
        }
        
        // Wood blocks (all tree types)
        if (blockType && (blockType.includes('wood') || blockType.includes('leaves'))) {
            return this.colors.mineable;
        }
        
        // Default - mineable
        return this.colors.mineable;
    }
    
    /**
     * Update outline color with smooth transition
     * @param {number} targetColor - Hex color code
     */
    updateColor(targetColor) {
        const material = this.outlineMesh.material;
        const currentColor = material.color.getHex();
        
        // Only update if color changed
        if (currentColor !== targetColor) {
            // Direct color change (no lerp smoothing - too slow)
            material.color.setHex(targetColor);
        }
    }
    
    /**
     * Hide the outline
     */
    hide() {
        this.outlineMesh.visible = false;
        this.lastTarget = { x: null, y: null, z: null, type: null, dimensions: null };
    }
    
    /**
     * Set outline color manually
     * @param {number} color - Hex color code
     */
    setColor(color) {
        this.outlineMesh.material.color.setHex(color);
    }
    
    /**
     * Clean up
     */
    dispose() {
        if (this.currentGeometry) {
            this.currentGeometry.dispose();
        }
        if (this.outlineMesh) {
            this.outlineMesh.material.dispose();
            this.scene.remove(this.outlineMesh);
        }
    }
}
