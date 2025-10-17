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
        
        // Hover highlight for deletion
        this.hoveredBlock = null;
        this.originalEmissive = null;
        
        // Camera rotation state
        this.isRotating = false;
        this.rotationStart = new THREE.Vector2();
        this.cameraRotation = 0; // Current rotation angle in radians
        this.cameraDistance = 20; // Distance from center
        this.cameraHeight = 15;   // Height above ground
        
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
        
        // Main content area (side-by-side layout)
        const mainContent = document.createElement('div');
        mainContent.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;
        
        // Block palette sidebar
        const paletteContainer = document.createElement('div');
        paletteContainer.id = 'randym-block-palette';
        paletteContainer.style.cssText = `
            width: 200px;
            background: #1e2832;
            border-right: 2px solid #4a9eff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        const paletteHeader = document.createElement('div');
        paletteHeader.style.cssText = `
            padding: 10px;
            background: #2c3e50;
            color: #4a9eff;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1px solid #4a9eff;
            text-align: center;
        `;
        paletteHeader.textContent = '🎨 Block Palette';
        
        const paletteScroll = document.createElement('div');
        paletteScroll.id = 'randym-palette-scroll';
        paletteScroll.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
        `;
        
        // Custom scrollbar styling
        const style = document.createElement('style');
        style.textContent = `
            #randym-palette-scroll::-webkit-scrollbar {
                width: 8px;
            }
            #randym-palette-scroll::-webkit-scrollbar-track {
                background: #0a0a0a;
            }
            #randym-palette-scroll::-webkit-scrollbar-thumb {
                background: #4a9eff;
                border-radius: 4px;
            }
            #randym-palette-scroll::-webkit-scrollbar-thumb:hover {
                background: #6bb8ff;
            }
            .randym-block-item {
                display: flex;
                align-items: center;
                padding: 8px;
                margin-bottom: 5px;
                background: #2c3e50;
                border: 2px solid transparent;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .randym-block-item:hover {
                background: #34495e;
                border-color: #4a9eff;
            }
            .randym-block-item.selected {
                background: #34495e;
                border-color: #2ecc71;
                box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
            }
            .randym-block-thumbnail {
                width: 32px;
                height: 32px;
                margin-right: 10px;
                background: #0a0a0a;
                border: 1px solid #4a9eff;
                border-radius: 3px;
                flex-shrink: 0;
            }
            .randym-block-name {
                color: #ecf0f1;
                font-size: 12px;
                word-break: break-word;
            }
        `;
        document.head.appendChild(style);
        
        paletteContainer.appendChild(paletteHeader);
        paletteContainer.appendChild(paletteScroll);
        
        // Canvas container for THREE.js
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'randym-canvas-container';
        canvasContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: #0a0a0a;
        `;
        
        mainContent.appendChild(paletteContainer);
        mainContent.appendChild(canvasContainer);
        
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
            <span style="color: #2ecc71;">Click Palette:</span> Select Block | 
            <span style="color: #4a9eff;">Left Click:</span> Place | 
            <span style="color: #4a9eff;">Right Click:</span> Remove | 
            <span style="color: #f39c12;">Ctrl+Drag:</span> Rotate | 
            <span style="color: #4a9eff;">Wheel:</span> Zoom
        `;
        
        const stats = document.createElement('div');
        stats.id = 'randym-stats';
        stats.innerHTML = `<strong>Blocks:</strong> <span style="color: #2ecc71;">0</span>`;
        
        infoPanel.appendChild(instructions);
        infoPanel.appendChild(stats);
        
        // Assemble the UI
        this.container.appendChild(header);
        this.container.appendChild(mainContent);
        this.container.appendChild(infoPanel);
        this.modalOverlay.appendChild(this.container);
        document.body.appendChild(this.modalOverlay);
        
        // Load block palette asynchronously
        this.loadBlockPalette();
    }
    
    /**
     * Load and populate the block palette with mini textures
     */
    async loadBlockPalette() {
        const paletteScroll = document.getElementById('randym-palette-scroll');
        if (!paletteScroll) {
            console.error('❌ Palette scroll container not found');
            return;
        }
        
        // Get enhanced graphics system from VoxelWorld
        const enhancedGraphics = this.voxelWorld?.enhancedGraphics;
        if (!enhancedGraphics) {
            console.error('❌ EnhancedGraphics not available');
            paletteScroll.innerHTML = '<div style="color: #e74c3c; padding: 10px;">Graphics system not available</div>';
            return;
        }
        
        // Wait for assets to load if needed
        if (!enhancedGraphics.assetsLoaded) {
            console.log('⏳ Waiting for assets to load...');
            paletteScroll.innerHTML = '<div style="color: #4a9eff; padding: 10px;">Loading blocks...</div>';
            
            // Wait for assets with timeout
            const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 5000));
            const loaded = await Promise.race([enhancedGraphics.loadingPromise, timeout]);
            
            if (!loaded) {
                console.error('❌ Asset loading timeout');
                paletteScroll.innerHTML = '<div style="color: #e74c3c; padding: 10px;">Failed to load blocks</div>';
                return;
            }
        }
        
        // Get available blocks
        const blocks = enhancedGraphics.getAvailableBlocks();
        console.log(`🎨 Loading ${blocks.length} blocks into palette`);
        
        // Clear loading message
        paletteScroll.innerHTML = '';
        
        // Create block items
        for (const blockType of blocks) {
            const item = document.createElement('div');
            item.className = 'randym-block-item';
            item.dataset.blockType = blockType;
            
            // Add selected class if this is the current block
            if (blockType === this.selectedBlockType) {
                item.classList.add('selected');
            }
            
            // Thumbnail canvas for mini texture
            const thumbnail = document.createElement('canvas');
            thumbnail.className = 'randym-block-thumbnail';
            thumbnail.width = 32;
            thumbnail.height = 32;
            
            // Block name
            const name = document.createElement('div');
            name.className = 'randym-block-name';
            name.textContent = blockType.replace(/_/g, ' ');
            
            item.appendChild(thumbnail);
            item.appendChild(name);
            
            // Click handler
            item.onclick = () => this.selectBlock(blockType);
            
            paletteScroll.appendChild(item);
            
            // Load mini texture asynchronously
            this.loadBlockThumbnail(blockType, thumbnail);
        }
        
        console.log('✅ Block palette loaded');
    }
    
    /**
     * Load mini texture for a block thumbnail
     */
    async loadBlockThumbnail(blockType, canvas) {
        const enhancedGraphics = this.voxelWorld?.enhancedGraphics;
        if (!enhancedGraphics) return;
        
        // Try to load mini texture
        const texture = await enhancedGraphics.loadMiniTexture(blockType);
        
        if (texture && texture.image) {
            // Draw texture to canvas
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false; // Pixel art style
            
            // Wait for image to load
            if (texture.image.complete) {
                ctx.drawImage(texture.image, 0, 0, 32, 32);
            } else {
                texture.image.onload = () => {
                    ctx.drawImage(texture.image, 0, 0, 32, 32);
                };
            }
            
            // Cleanup texture (we only needed it for the canvas)
            texture.dispose();
        } else {
            // Fallback: draw colored square based on block type
            const ctx = canvas.getContext('2d');
            const color = this.getBlockColor(blockType);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 32, 32);
            
            // Add border
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, 32, 32);
        }
    }
    
    /**
     * Select a block type
     */
    selectBlock(blockType) {
        this.selectedBlockType = blockType;
        
        // Update UI - remove 'selected' class from all items
        document.querySelectorAll('.randym-block-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add 'selected' class to clicked item
        const selectedItem = document.querySelector(`[data-block-type="${blockType}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Update preview block if it exists
        if (this.previewBlock) {
            this.updatePreviewBlockAppearance();
        }
        
        console.log(`🎨 Selected block: ${blockType}`);
    }
    
    /**
     * Get fallback color for a block type
     */
    getBlockColor(blockType) {
        const colorMap = {
            dirt: '#8B4513',
            grass: '#228B22',
            stone: '#808080',
            sand: '#F4A460',
            snow: '#FFFFFF',
            bedrock: '#1a1a1a',
            oak_wood: '#8B4513',
            pine_wood: '#654321',
            birch_wood: '#D2B48C',
            palm_wood: '#CD853F',
            iron: '#B0C4DE',
            gold: '#FFD700',
            pumpkin: '#FF8C00'
        };
        
        return colorMap[blockType] || '#4a9eff';
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
        // Set initial rotation angle (45 degrees for nice isometric view)
        this.cameraRotation = Math.PI / 4;
        
        // Position camera using rotation system
        this.updateCameraPosition();
        
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
        
        // Check if hovering over an existing block (for delete highlight)
        this.updateHoverHighlight(intersects);
        
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
     * Update hover highlight for block deletion
     */
    updateHoverHighlight(intersects) {
        // Find if we're hovering over a placed block (not ground)
        const blockIntersect = intersects.find(i => i.object !== this.groundPlane);
        
        // Reset previous hover
        if (this.hoveredBlock && this.hoveredBlock !== blockIntersect?.object) {
            // Restore original emissive
            if (Array.isArray(this.hoveredBlock.material)) {
                this.hoveredBlock.material.forEach(mat => {
                    if (mat.emissive) mat.emissive.setHex(0x000000);
                });
            } else if (this.hoveredBlock.material.emissive) {
                this.hoveredBlock.material.emissive.setHex(0x000000);
            }
            this.hoveredBlock = null;
        }
        
        // Set new hover
        if (blockIntersect && blockIntersect.object !== this.groundPlane) {
            this.hoveredBlock = blockIntersect.object;
            
            // Add red emissive glow for delete indication
            if (Array.isArray(this.hoveredBlock.material)) {
                this.hoveredBlock.material.forEach(mat => {
                    if (mat.emissive) mat.emissive.setHex(0xff0000);
                });
            } else if (this.hoveredBlock.material.emissive) {
                this.hoveredBlock.material.emissive.setHex(0xff0000);
            }
            
            // Change cursor
            this.canvas.style.cursor = 'pointer';
        } else if (!this.isRotating) {
            this.canvas.style.cursor = 'default';
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
     * Update preview block appearance based on selected block type
     */
    updatePreviewBlockAppearance() {
        if (!this.previewBlock) return;
        
        // Get color for the block type
        const color = this.getBlockColor(this.selectedBlockType);
        
        // Update material color
        this.previewBlock.material.color.set(color);
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
        
        // Try to get textured material from EnhancedGraphics
        const enhancedGraphics = this.voxelWorld?.enhancedGraphics;
        let material;
        
        if (enhancedGraphics && enhancedGraphics.assetsLoaded) {
            // Get the color as fallback
            const color = this.getBlockColor(this.selectedBlockType);
            const fallbackMaterial = new THREE.MeshLambertMaterial({ 
                color: color,
                flatShading: true
            });
            
            // Try to get enhanced material (textured)
            material = enhancedGraphics.getEnhancedBlockMaterial(this.selectedBlockType, fallbackMaterial);
        } else {
            // No EnhancedGraphics available, use colored material
            const color = this.getBlockColor(this.selectedBlockType);
            material = new THREE.MeshLambertMaterial({ 
                color: color,
                flatShading: true
            });
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
            
            // Handle both single materials and material arrays (multi-face textures)
            if (Array.isArray(block.mesh.material)) {
                block.mesh.material.forEach(mat => mat.dispose());
            } else {
                block.mesh.material.dispose();
            }
            
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
        this.onMouseDown = (event) => this.handleMouseDown(event);
        this.onMouseUp = (event) => this.handleMouseUp(event);
        this.onClick = (event) => this.handleClick(event);
        this.onContextMenu = (event) => this.handleRightClick(event);
        this.onWheel = (event) => this.handleWheel(event);
        this.onResize = () => this.handleResize();
        
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
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
            this.canvas.removeEventListener('mousedown', this.onMouseDown);
            this.canvas.removeEventListener('mouseup', this.onMouseUp);
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
        
        // Handle camera rotation if Ctrl is held and dragging
        if (this.isRotating && event.ctrlKey) {
            const deltaX = event.clientX - this.rotationStart.x;
            
            // Update rotation (1 pixel = 0.01 radians)
            this.cameraRotation += deltaX * 0.01;
            
            // Update camera position based on rotation
            this.updateCameraPosition();
            
            // Update rotation start for next frame
            this.rotationStart.set(event.clientX, event.clientY);
        }
    }
    
    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        if (event.ctrlKey) {
            // Start rotation mode
            this.isRotating = true;
            this.rotationStart.set(event.clientX, event.clientY);
            this.canvas.style.cursor = 'grabbing';
            event.preventDefault();
        }
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp(event) {
        this.isRotating = false;
        this.canvas.style.cursor = 'default';
    }
    
    /**
     * Update camera position based on rotation angle
     */
    updateCameraPosition() {
        // Calculate new camera position orbiting around center (0, 0, 0)
        const x = Math.cos(this.cameraRotation) * this.cameraDistance;
        const z = Math.sin(this.cameraRotation) * this.cameraDistance;
        
        this.camera.position.set(x, this.cameraHeight, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Handle left click (place block)
     */
    handleClick(event) {
        // Don't place blocks if we were rotating
        if (event.ctrlKey) {
            return;
        }
        
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
            
            // Handle both single materials and material arrays (multi-face textures)
            if (Array.isArray(block.mesh.material)) {
                block.mesh.material.forEach(mat => mat.dispose());
            } else {
                block.mesh.material.dispose();
            }
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
