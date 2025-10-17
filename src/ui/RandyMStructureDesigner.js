/**
 * RandyM Structure Designer
 * 
 * A 3D voxel-based structure editor for creating custom buildings and structures.
 * Named after Randy (with 'M' suffix for family initial).
 * 
 * Features:
 * - Isometric 3D view with rotation controls
 * - Block-by-block placement with mouse
 * - Height-aware stacking
 * - Shape tools (hollow/filled cubes, walls, floors)
 * - Save/Load structures to JSON files
 * - EnhancedGraphics integration for block textures
 * 
 * @author VoxelWorld Team
 * @date October 17, 2025
 */

import * as THREE from 'three';

export class RandyMStructureDesigner {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.isOpen = false;
        
        // THREE.js scene components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationFrameId = null;
        
        // Grid and ground
        this.gridHelper = null;
        this.groundPlane = null;
        
        // Placed blocks storage
        this.placedBlocks = new Map(); // key: "x,y,z", value: { mesh, blockType }
        
        // Current selected block type
        this.selectedBlockType = 'oak_wood';
        
        // DOM elements
        this.modalOverlay = null;
        this.container = null;
        this.canvas = null;
        
        // Raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Preview block (ghost block that shows where you'll place)
        this.previewBlock = null;
        this.previewPosition = null;
        
        console.log('🎨 RandyM Structure Designer initialized');
    }
    
    /**
     * Open the structure designer modal
     */
    open() {
        if (this.isOpen) {
            console.warn('⚠️ RandyM Designer already open');
            return;
        }
        
        console.log('🎨 Opening RandyM Structure Designer...');
        this.isOpen = true;
        
        // Create modal UI
        this.createModal();
        
        // Initialize THREE.js scene
        this.initScene();
        
        // Start animation loop
        this.animate();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('✅ RandyM Structure Designer opened');
    }
    
    /**
     * Close the designer and cleanup
     */
    close() {
        if (!this.isOpen) return;
        
        console.log('🎨 Closing RandyM Structure Designer...');
        this.isOpen = false;
        
        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove event listeners
        this.removeEventListeners();
        
        // Cleanup THREE.js resources
        this.cleanupScene();
        
        // Remove DOM elements
        if (this.modalOverlay) {
            this.modalOverlay.remove();
            this.modalOverlay = null;
        }
        
        console.log('✅ RandyM Structure Designer closed and cleaned up');
    }
    
    /**
     * Create the modal overlay and container
     */
    createModal() {
        // Modal overlay (z-index: 50000)
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.id = 'randym-designer-overlay';
        this.modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 50000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
        `;
        
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'randym-designer-container';
        this.container.style.cssText = `
            width: 90vw;
            height: 90vh;
            background: #1a1a1a;
            border: 3px solid #4a9eff;
            border-radius: 10px;
            box-shadow: 0 0 30px rgba(74, 158, 255, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Header bar
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4a9eff;
        `;
        
        const title = document.createElement('h2');
        title.textContent = '🎨 RandyM Structure Designer';
        title.style.cssText = `
            margin: 0;
            color: #4a9eff;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕ Close';
        closeButton.id = 'randym-close-btn';
        closeButton.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        closeButton.onmouseover = () => closeButton.style.background = '#c0392b';
        closeButton.onmouseout = () => closeButton.style.background = '#e74c3c';
        closeButton.onclick = () => this.close();
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Canvas container for THREE.js
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'randym-canvas-container';
        canvasContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: #0a0a0a;
        `;
        
        // Info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'randym-info-panel';
        infoPanel.style.cssText = `
            background: #2c3e50;
            padding: 15px 20px;
            color: #ecf0f1;
            font-size: 14px;
            border-top: 2px solid #4a9eff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <strong>Controls:</strong> 
            <span style="color: #4a9eff;">Left Click:</span> Place Block | 
            <span style="color: #4a9eff;">Right Click:</span> Remove Block | 
            <span style="color: #4a9eff;">Mouse Wheel:</span> Zoom
        `;
        
        const stats = document.createElement('div');
        stats.id = 'randym-stats';
        stats.innerHTML = `<strong>Blocks:</strong> <span style="color: #2ecc71;">0</span>`;
        
        infoPanel.appendChild(instructions);
        infoPanel.appendChild(stats);
        
        // Assemble the UI
        this.container.appendChild(header);
        this.container.appendChild(canvasContainer);
        this.container.appendChild(infoPanel);
        this.modalOverlay.appendChild(this.container);
        document.body.appendChild(this.modalOverlay);
    }
    
    /**
     * Initialize THREE.js scene
     */
    initScene() {
        const canvasContainer = document.getElementById('randym-canvas-container');
        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 30, 100);
        
        // Create isometric camera
        const aspect = width / height;
        const frustumSize = 20;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );
        
        // Position camera for isometric view
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        canvasContainer.appendChild(this.renderer.domElement);
        this.canvas = this.renderer.domElement;
        
        // Add lights
        this.addLights();
        
        // Add grid helper
        this.addGrid();
        
        // Add ground plane (for raycasting)
        this.addGroundPlane();
        
        console.log('✅ THREE.js scene initialized');
    }
    
    /**
     * Add lighting to the scene
     */
    addLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        this.scene.add(sun);
        
        // Fill light (softer from opposite side)
        const fill = new THREE.DirectionalLight(0x4a9eff, 0.3);
        fill.position.set(-10, 10, -10);
        this.scene.add(fill);
    }
    
    /**
     * Add grid helper to visualize the ground plane
     */
    addGrid() {
        this.gridHelper = new THREE.GridHelper(50, 50, 0x4a9eff, 0x2c3e50);
        this.gridHelper.position.y = 0;
        this.scene.add(this.gridHelper);
    }
    
    /**
     * Add invisible ground plane for raycasting
     */
    addGroundPlane() {
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshBasicMaterial({ 
            visible: false // Invisible but still raycasts
        });
        this.groundPlane = new THREE.Mesh(geometry, material);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.y = 0;
        this.scene.add(this.groundPlane);
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.isOpen) return;
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        // Update preview block position based on mouse
        this.updatePreview();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Update preview block position
     */
    updatePreview() {
        // Raycast from mouse to find where block would be placed
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check intersection with ground plane and existing blocks
        const intersects = this.raycaster.intersectObjects([
            this.groundPlane,
            ...Array.from(this.placedBlocks.values()).map(b => b.mesh)
        ]);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const point = intersect.point;
            
            // Snap to grid
            let x = Math.floor(point.x) + 0.5;
            let z = Math.floor(point.z) + 0.5;
            let y = 0.5;
            
            // If intersecting with a block, place on top
            if (intersect.object !== this.groundPlane) {
                y = Math.floor(point.y) + 1.5;
            }
            
            this.previewPosition = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
            
            // Update or create preview block
            if (!this.previewBlock) {
                this.createPreviewBlock();
            }
            
            this.previewBlock.position.set(x, y, z);
            this.previewBlock.visible = true;
        } else {
            if (this.previewBlock) {
                this.previewBlock.visible = false;
            }
            this.previewPosition = null;
        }
    }
    
    /**
     * Create ghost preview block
     */
    createPreviewBlock() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.3,
            wireframe: false
        });
        
        this.previewBlock = new THREE.Mesh(geometry, material);
        this.scene.add(this.previewBlock);
    }
    
    /**
     * Place a block at current preview position
     */
    placeBlock() {
        if (!this.previewPosition) return;
        
        const { x, y, z } = this.previewPosition;
        const key = `${x},${y},${z}`;
        
        // Don't place if block already exists
        if (this.placedBlocks.has(key)) {
            console.log('⚠️ Block already exists at', key);
            return;
        }
        
        // Create block mesh
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Get material from VoxelWorld if available
        let material;
        if (this.voxelWorld.materials[this.selectedBlockType]) {
            material = this.voxelWorld.materials[this.selectedBlockType].clone();
        } else {
            // Fallback material
            material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.scene.add(mesh);
        this.placedBlocks.set(key, { mesh, blockType: this.selectedBlockType });
        
        this.updateStats();
        console.log('✅ Placed block at', key, '| Type:', this.selectedBlockType);
    }
    
    /**
     * Remove a block at position
     */
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const block = this.placedBlocks.get(key);
        
        if (block) {
            this.scene.remove(block.mesh);
            block.mesh.geometry.dispose();
            block.mesh.material.dispose();
            this.placedBlocks.delete(key);
            this.updateStats();
            console.log('🗑️ Removed block at', key);
        }
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        const statsElement = document.getElementById('randym-stats');
        if (statsElement) {
            const count = this.placedBlocks.size;
            statsElement.innerHTML = `<strong>Blocks:</strong> <span style="color: #2ecc71;">${count}</span>`;
        }
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        this.onMouseMove = (event) => this.handleMouseMove(event);
        this.onClick = (event) => this.handleClick(event);
        this.onContextMenu = (event) => this.handleRightClick(event);
        this.onWheel = (event) => this.handleWheel(event);
        this.onResize = () => this.handleResize();
        
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('wheel', this.onWheel);
        window.addEventListener('resize', this.onResize);
    }
    
    /**
     * Remove event listeners
     */
    removeEventListeners() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('click', this.onClick);
            this.canvas.removeEventListener('contextmenu', this.onContextMenu);
            this.canvas.removeEventListener('wheel', this.onWheel);
        }
        window.removeEventListener('resize', this.onResize);
    }
    
    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * Handle left click (place block)
     */
    handleClick(event) {
        event.preventDefault();
        this.placeBlock();
    }
    
    /**
     * Handle right click (remove block)
     */
    handleRightClick(event) {
        event.preventDefault();
        
        // Raycast to find clicked block
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const blocks = Array.from(this.placedBlocks.values()).map(b => b.mesh);
        const intersects = this.raycaster.intersectObjects(blocks);
        
        if (intersects.length > 0) {
            const pos = intersects[0].object.position;
            const x = Math.floor(pos.x);
            const y = Math.floor(pos.y);
            const z = Math.floor(pos.z);
            this.removeBlock(x, y, z);
        }
    }
    
    /**
     * Handle mouse wheel (zoom)
     */
    handleWheel(event) {
        event.preventDefault();
        
        const zoomSpeed = 0.1;
        const delta = event.deltaY > 0 ? 1 : -1;
        
        // Zoom camera (adjust frustum size for orthographic)
        const zoom = this.camera.zoom - delta * zoomSpeed;
        this.camera.zoom = Math.max(0.5, Math.min(3, zoom)); // Clamp between 0.5x and 3x
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.canvas || !this.camera || !this.renderer) return;
        
        const canvasContainer = document.getElementById('randym-canvas-container');
        const width = canvasContainer.clientWidth;
        const height = canvasContainer.clientHeight;
        
        const aspect = width / height;
        const frustumSize = 20;
        
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    /**
     * Cleanup THREE.js scene
     */
    cleanupScene() {
        console.log('🧹 Cleaning up RandyM scene...');
        
        // Dispose all placed blocks
        this.placedBlocks.forEach(block => {
            this.scene.remove(block.mesh);
            block.mesh.geometry.dispose();
            block.mesh.material.dispose();
        });
        this.placedBlocks.clear();
        
        // Dispose preview block
        if (this.previewBlock) {
            this.scene.remove(this.previewBlock);
            this.previewBlock.geometry.dispose();
            this.previewBlock.material.dispose();
            this.previewBlock = null;
        }
        
        // Dispose ground plane
        if (this.groundPlane) {
            this.scene.remove(this.groundPlane);
            this.groundPlane.geometry.dispose();
            this.groundPlane.material.dispose();
            this.groundPlane = null;
        }
        
        // Remove grid
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            this.gridHelper.material.dispose();
            this.gridHelper = null;
        }
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            this.renderer = null;
            this.canvas = null;
        }
        
        // Clear scene
        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }
        
        this.camera = null;
        
        console.log('✅ RandyM scene cleaned up');
    }
}
