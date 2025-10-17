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
        
        // Tool mode and shape tools
        this.toolMode = 'place'; // 'place', 'fill_cube', 'hollow_cube', 'wall', 'floor', 'line'
        this.shapeStart = null; // First click position for shape tools
        this.shapeEnd = null; // Second click position for shape tools
        this.shapePreview = []; // Array of preview meshes
        
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
        
        // Axis lock toggles
        this.axisLocks = {
            x: false,
            y: false,
            z: false
        };
        
        // Undo/Redo system
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSize = 50; // Limit history to prevent memory issues
        
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
        
        // Tool palette sidebar (right side)
        const toolPaletteContainer = document.createElement('div');
        toolPaletteContainer.id = 'randym-tool-palette';
        toolPaletteContainer.style.cssText = `
            width: 180px;
            background: #1e2832;
            border-left: 2px solid #4a9eff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        const toolHeader = document.createElement('div');
        toolHeader.style.cssText = `
            padding: 10px;
            background: #2c3e50;
            color: #4a9eff;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1px solid #4a9eff;
            text-align: center;
        `;
        toolHeader.textContent = '🛠️ Tools';
        
        const toolContent = document.createElement('div');
        toolContent.id = 'randym-tool-content';
        toolContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        `;
        
        // Add tool mode selector
        this.createToolModeSelector(toolContent);
        
        // Add axis lock section
        this.createAxisLockSection(toolContent);
        
        // Add undo/redo section
        this.createUndoRedoSection(toolContent);
        
        toolPaletteContainer.appendChild(toolHeader);
        toolPaletteContainer.appendChild(toolContent);
        
        mainContent.appendChild(paletteContainer);
        mainContent.appendChild(canvasContainer);
        mainContent.appendChild(toolPaletteContainer);
        
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
     * Create tool mode selector in tool palette
     */
    createToolModeSelector(container) {
        // Section title
        const sectionTitle = document.createElement('div');
        sectionTitle.style.cssText = `
            color: #ecf0f1;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #4a9eff;
        `;
        sectionTitle.textContent = 'Tool Mode';
        
        container.appendChild(sectionTitle);
        
        // Tool buttons
        const tools = [
            { id: 'place', icon: '🖌️', name: 'Place', desc: 'Single block placement' },
            { id: 'fill_cube', icon: '🧊', name: 'Fill Cube', desc: 'Solid rectangular volume' },
            { id: 'wall', icon: '🧱', name: 'Wall', desc: 'Vertical plane' },
            { id: 'floor', icon: '⬛', name: 'Floor', desc: 'Horizontal plane' },
            { id: 'line', icon: '📏', name: 'Line', desc: 'Straight line' },
            { id: 'door', icon: '🚪', name: 'Door', desc: 'Cut 2x2 opening' }
        ];
        
        tools.forEach(tool => {
            const button = document.createElement('button');
            button.id = `tool-${tool.id}`;
            button.className = 'tool-mode-btn';
            if (tool.id === this.toolMode) {
                button.classList.add('active');
            }
            
            button.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">${tool.icon}</span>
                    <div style="flex: 1; text-align: left;">
                        <div style="font-weight: bold; font-size: 12px;">${tool.name}</div>
                        <div style="font-size: 10px; color: #95a5a6;">${tool.desc}</div>
                    </div>
                </div>
            `;
            
            button.style.cssText = `
                width: 100%;
                padding: 10px;
                margin-bottom: 8px;
                background: #2c3e50;
                color: #ecf0f1;
                border: 2px solid transparent;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            `;
            
            button.onmouseover = () => {
                if (!button.classList.contains('active')) {
                    button.style.background = '#34495e';
                    button.style.borderColor = '#4a9eff';
                }
            };
            
            button.onmouseout = () => {
                if (!button.classList.contains('active')) {
                    button.style.background = '#2c3e50';
                    button.style.borderColor = 'transparent';
                }
            };
            
            button.onclick = () => this.setToolMode(tool.id);
            
            container.appendChild(button);
        });
        
        // Hollow Shapes expandable section
        this.createHollowShapesSection(container);
        
        // Add CSS for active state
        const style = document.createElement('style');
        style.textContent = `
            .tool-mode-btn.active {
                background: #34495e !important;
                border-color: #2ecc71 !important;
                box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Create hollow shapes expandable section
     */
    createHollowShapesSection(container) {
        // Hollow Shapes header button
        const headerBtn = document.createElement('button');
        headerBtn.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📦</span>
                    <span style="font-weight: bold; font-size: 12px;">Hollow Shapes</span>
                </div>
                <span id="hollow-chevron" style="transition: transform 0.2s;">▼</span>
            </div>
        `;
        
        headerBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-bottom: 8px;
            background: #34495e;
            color: #ecf0f1;
            border: 2px solid #4a9eff;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        
        // Submenu container
        const submenu = document.createElement('div');
        submenu.id = 'hollow-submenu';
        submenu.style.cssText = `
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            margin-bottom: 8px;
        `;
        
        const hollowShapes = [
            { id: 'hollow_cube', icon: '📦', name: 'Cube', desc: 'Rectangular shell' },
            { id: 'hollow_sphere', icon: '⚽', name: 'Sphere', desc: 'Spherical shell' },
            { id: 'hollow_cylinder', icon: '🛢️', name: 'Cylinder', desc: 'Cylindrical shell' },
            { id: 'hollow_pyramid', icon: '🔺', name: 'Pyramid', desc: 'Pyramidal shell' }
        ];
        
        hollowShapes.forEach(shape => {
            const btn = document.createElement('button');
            btn.id = `tool-${shape.id}`;
            btn.className = 'tool-mode-btn hollow-shape-btn';
            if (shape.id === this.toolMode) {
                btn.classList.add('active');
            }
            
            btn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding-left: 10px;">
                    <span style="font-size: 16px;">${shape.icon}</span>
                    <div style="flex: 1; text-align: left;">
                        <div style="font-weight: bold; font-size: 11px;">${shape.name}</div>
                        <div style="font-size: 9px; color: #95a5a6;">${shape.desc}</div>
                    </div>
                </div>
            `;
            
            btn.style.cssText = `
                width: 100%;
                padding: 8px;
                margin-bottom: 6px;
                background: #2c3e50;
                color: #ecf0f1;
                border: 2px solid transparent;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            btn.onmouseover = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = '#34495e';
                    btn.style.borderColor = '#4a9eff';
                }
            };
            
            btn.onmouseout = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = '#2c3e50';
                    btn.style.borderColor = 'transparent';
                }
            };
            
            btn.onclick = () => this.setToolMode(shape.id);
            
            submenu.appendChild(btn);
        });
        
        // Toggle submenu
        let isExpanded = false;
        headerBtn.onclick = () => {
            isExpanded = !isExpanded;
            submenu.style.maxHeight = isExpanded ? '300px' : '0';
            document.getElementById('hollow-chevron').style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        };
        
        container.appendChild(headerBtn);
        container.appendChild(submenu);
    }
    
    /**
     * Set tool mode
     */
    setToolMode(mode) {
        this.toolMode = mode;
        
        // Clear any active shape selection
        this.cancelShape();
        
        // Update UI
        document.querySelectorAll('.tool-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`tool-${mode}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update status
        const modeNames = {
            'place': 'Single Block Placement',
            'fill_cube': 'Fill Cube (click 2 corners)',
            'hollow_cube': 'Hollow Cube (click 2 corners)',
            'hollow_sphere': 'Hollow Sphere (click center & radius)',
            'hollow_cylinder': 'Hollow Cylinder (click base center & radius)',
            'hollow_pyramid': 'Hollow Pyramid (click 2 corners)',
            'wall': 'Wall (click 2 points)',
            'floor': 'Floor (click 2 points)',
            'line': 'Line (click 2 points)',
            'door': 'Door (click bottom-left corner)'
        };
        
        console.log(`🛠️ Tool mode: ${modeNames[mode]}`);
    }
    
    /**
     * Cancel current shape selection
     */
    cancelShape() {
        this.shapeStart = null;
        this.shapeEnd = null;
        this.clearShapePreview();
    }
    
    /**
     * Clear shape preview meshes
     */
    clearShapePreview() {
        this.shapePreview.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.shapePreview = [];
    }
    
    /**
     * Update shape preview during mouse move
     */
    updateShapePreview(endPos) {
        // Clear existing preview
        this.clearShapePreview();
        
        if (!this.shapeStart || !endPos) return;
        
        // Get positions that would be affected by this shape
        const positions = this.getShapePositions(this.shapeStart, endPos);
        
        // Create preview meshes (semi-transparent)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({
            color: this.getBlockColor(this.selectedBlockType),
            transparent: true,
            opacity: 0.4,
            flatShading: true
        });
        
        positions.forEach(pos => {
            const mesh = new THREE.Mesh(geometry, material.clone());
            mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
            this.scene.add(mesh);
            this.shapePreview.push(mesh);
        });
    }
    
    /**
     * Get positions for shape based on tool mode
     */
    getShapePositions(start, end) {
        switch (this.toolMode) {
            case 'fill_cube':
                return this.getFillCubePositions(start, end);
            case 'hollow_cube':
                return this.getHollowCubePositions(start, end);
            case 'hollow_sphere':
                return this.getHollowSpherePositions(start, end);
            case 'hollow_cylinder':
                return this.getHollowCylinderPositions(start, end);
            case 'hollow_pyramid':
                return this.getHollowPyramidPositions(start, end);
            case 'wall':
                return this.getWallPositions(start, end);
            case 'floor':
                return this.getFloorPositions(start, end);
            case 'line':
                return this.getLinePositions(start, end);
            case 'door':
                return this.getDoorPositions(start);
            default:
                return [];
        }
    }
    
    /**
     * Get positions for fill cube
     */
    getFillCubePositions(start, end) {
        const positions = [];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    positions.push({ x, y, z });
                }
            }
        }
        return positions;
    }
    
    /**
     * Get positions for hollow cube
     */
    getHollowCubePositions(start, end) {
        const positions = [];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    // Only place on the outer shell
                    if (x === minX || x === maxX || 
                        y === minY || y === maxY || 
                        z === minZ || z === maxZ) {
                        positions.push({ x, y, z });
                    }
                }
            }
        }
        return positions;
    }
    
    /**
     * Get positions for hollow sphere
     */
    getHollowSpherePositions(start, end) {
        const positions = [];
        const center = start;
        const radius = Math.round(Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.y - start.y, 2) +
            Math.pow(end.z - start.z, 2)
        ));
        
        // Create sphere shell (thickness = 1 block)
        for (let x = center.x - radius; x <= center.x + radius; x++) {
            for (let y = center.y - radius; y <= center.y + radius; y++) {
                for (let z = center.z - radius; z <= center.z + radius; z++) {
                    // Skip blocks below ground level
                    if (y < 0) continue;
                    
                    const dist = Math.sqrt(
                        Math.pow(x - center.x, 2) +
                        Math.pow(y - center.y, 2) +
                        Math.pow(z - center.z, 2)
                    );
                    // Only place blocks on the outer shell
                    if (dist >= radius - 0.5 && dist <= radius + 0.5) {
                        positions.push({ x, y, z });
                    }
                }
            }
        }
        return positions;
    }
    
    /**
     * Get positions for hollow cylinder
     */
    getHollowCylinderPositions(start, end) {
        const positions = [];
        const baseCenter = { x: start.x, y: start.y, z: start.z };
        const radius = Math.round(Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.z - start.z, 2)
        ));
        const height = Math.abs(end.y - start.y);
        
        // Create cylinder shell (no caps)
        for (let x = baseCenter.x - radius; x <= baseCenter.x + radius; x++) {
            for (let z = baseCenter.z - radius; z <= baseCenter.z + radius; z++) {
                const dist = Math.sqrt(
                    Math.pow(x - baseCenter.x, 2) +
                    Math.pow(z - baseCenter.z, 2)
                );
                // Only place blocks on the outer ring
                if (dist >= radius - 0.5 && dist <= radius + 0.5) {
                    for (let y = baseCenter.y; y <= baseCenter.y + height; y++) {
                        // Skip blocks below ground
                        if (y >= 0) {
                            positions.push({ x, y, z });
                        }
                    }
                }
            }
        }
        return positions;
    }
    
    /**
     * Get positions for hollow pyramid
     */
    getHollowPyramidPositions(start, end) {
        const positions = [];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        
        const baseWidth = maxX - minX + 1;
        const baseDepth = maxZ - minZ + 1;
        const height = maxY - minY + 1;
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // Create pyramid by layers
        for (let y = 0; y < height; y++) {
            const layer = minY + y;
            const progress = y / height;
            const layerWidth = Math.round(baseWidth * (1 - progress));
            const layerDepth = Math.round(baseDepth * (1 - progress));
            
            if (layerWidth <= 0 || layerDepth <= 0) break;
            
            const layerMinX = Math.round(centerX - layerWidth / 2);
            const layerMaxX = Math.round(centerX + layerWidth / 2);
            const layerMinZ = Math.round(centerZ - layerDepth / 2);
            const layerMaxZ = Math.round(centerZ + layerDepth / 2);
            
            // Only place blocks on edges of each layer
            for (let x = layerMinX; x <= layerMaxX; x++) {
                for (let z = layerMinZ; z <= layerMaxZ; z++) {
                    if (x === layerMinX || x === layerMaxX || z === layerMinZ || z === layerMaxZ) {
                        // Skip blocks below ground
                        if (layer >= 0) {
                            positions.push({ x, y: layer, z });
                        }
                    }
                }
            }
        }
        return positions;
    }
    
    /**
     * Get positions for wall (vertical plane)
     */
    getWallPositions(start, end) {
        const positions = [];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        
        // Determine if wall is along X or Z axis
        const xRange = maxX - minX;
        const zRange = maxZ - minZ;
        
        if (xRange >= zRange) {
            // Wall along X axis (XY plane)
            const z = start.z; // Use start Z
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    positions.push({ x, y, z });
                }
            }
        } else {
            // Wall along Z axis (ZY plane)
            const x = start.x; // Use start X
            for (let z = minZ; z <= maxZ; z++) {
                for (let y = minY; y <= maxY; y++) {
                    positions.push({ x, y, z });
                }
            }
        }
        
        return positions;
    }
    
    /**
     * Get positions for floor (horizontal plane)
     */
    getFloorPositions(start, end) {
        const positions = [];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minZ = Math.min(start.z, end.z);
        const maxZ = Math.max(start.z, end.z);
        const y = start.y; // Use start Y for floor height
        
        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                positions.push({ x, y, z });
            }
        }
        return positions;
    }
    
    /**
     * Get positions for line (3D Bresenham)
     */
    getLinePositions(start, end) {
        const positions = [];
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const dz = Math.abs(end.z - start.z);
        const sx = start.x < end.x ? 1 : -1;
        const sy = start.y < end.y ? 1 : -1;
        const sz = start.z < end.z ? 1 : -1;
        
        let x = start.x;
        let y = start.y;
        let z = start.z;
        
        // 3D Bresenham algorithm
        if (dx >= dy && dx >= dz) {
            let err1 = 2 * dy - dx;
            let err2 = 2 * dz - dx;
            
            while (x !== end.x) {
                positions.push({ x, y, z });
                
                if (err1 > 0) {
                    y += sy;
                    err1 -= 2 * dx;
                }
                if (err2 > 0) {
                    z += sz;
                    err2 -= 2 * dx;
                }
                
                err1 += 2 * dy;
                err2 += 2 * dz;
                x += sx;
            }
        } else if (dy >= dx && dy >= dz) {
            let err1 = 2 * dx - dy;
            let err2 = 2 * dz - dy;
            
            while (y !== end.y) {
                positions.push({ x, y, z });
                
                if (err1 > 0) {
                    x += sx;
                    err1 -= 2 * dy;
                }
                if (err2 > 0) {
                    z += sz;
                    err2 -= 2 * dy;
                }
                
                err1 += 2 * dx;
                err2 += 2 * dz;
                y += sy;
            }
        } else {
            let err1 = 2 * dy - dz;
            let err2 = 2 * dx - dz;
            
            while (z !== end.z) {
                positions.push({ x, y, z });
                
                if (err1 > 0) {
                    y += sy;
                    err1 -= 2 * dz;
                }
                if (err2 > 0) {
                    x += sx;
                    err2 -= 2 * dz;
                }
                
                err1 += 2 * dy;
                err2 += 2 * dx;
                z += sz;
            }
        }
        
        // Add final position
        positions.push({ x: end.x, y: end.y, z: end.z });
        
        return positions;
    }
    
    /**
     * Fill cube with blocks
     */
    fillCube(start, end) {
        const positions = this.getFillCubePositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create hollow cube
     */
    hollowCube(start, end) {
        const positions = this.getHollowCubePositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create wall
     */
    createWall(start, end) {
        const positions = this.getWallPositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create floor
     */
    createFloor(start, end) {
        const positions = this.getFloorPositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create line
     */
    createLine(start, end) {
        const positions = this.getLinePositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create hollow sphere
     */
    hollowSphere(start, end) {
        const positions = this.getHollowSpherePositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create hollow cylinder
     */
    hollowCylinder(start, end) {
        const positions = this.getHollowCylinderPositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create hollow pyramid
     */
    hollowPyramid(start, end) {
        const positions = this.getHollowPyramidPositions(start, end);
        const batchAction = { type: 'batch_place', blocks: [] };
        
        positions.forEach(pos => {
            this.placeBlockAt(pos.x, pos.y, pos.z, this.selectedBlockType);
            batchAction.blocks.push({ x: pos.x, y: pos.y, z: pos.z, blockType: this.selectedBlockType });
        });
        
        this.pushUndoAction(batchAction);
        this.clearRedoStack();
    }
    
    /**
     * Create door (remove 2x2 blocks)
     */
    createDoor(pos) {
        const positions = this.getDoorPositions(pos);
        const batchAction = { type: 'batch_remove', blocks: [] };
        
        positions.forEach(p => {
            const key = `${p.x},${p.y},${p.z}`;
            const block = this.placedBlocks.get(key);
            
            if (block) {
                // Store block info for undo
                batchAction.blocks.push({ x: p.x, y: p.y, z: p.z, blockType: block.blockType });
                
                // Remove block
                this.scene.remove(block.mesh);
                block.mesh.geometry.dispose();
                
                if (Array.isArray(block.mesh.material)) {
                    block.mesh.material.forEach(mat => mat.dispose());
                } else {
                    block.mesh.material.dispose();
                }
                
                this.placedBlocks.delete(key);
            }
        });
        
        if (batchAction.blocks.length > 0) {
            this.pushUndoAction(batchAction);
            this.clearRedoStack();
            this.updateStats();
        }
    }
    
    /**
     * Get positions for door (2x2 opening)
     */
    getDoorPositions(pos) {
        // Bottom-left corner at pos, create 2 wide x 2 tall
        return [
            { x: pos.x, y: pos.y, z: pos.z },
            { x: pos.x + 1, y: pos.y, z: pos.z },
            { x: pos.x, y: pos.y + 1, z: pos.z },
            { x: pos.x + 1, y: pos.y + 1, z: pos.z }
        ];
    }
    
    /**
     * Create axis lock toggle section in tool palette
     */
    createAxisLockSection(container) {
        // Section title
        const sectionTitle = document.createElement('div');
        sectionTitle.style.cssText = `
            color: #ecf0f1;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #4a9eff;
        `;
        sectionTitle.textContent = 'Rotation Axis Lock';
        
        // Add CSS for toggle switches
        const style = document.createElement('style');
        style.textContent = `
            .axis-lock-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                margin-bottom: 8px;
                background: #2c3e50;
                border-radius: 5px;
                transition: background 0.2s;
            }
            .axis-lock-row:hover {
                background: #34495e;
            }
            .axis-lock-label {
                color: #ecf0f1;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .axis-toggle-switch {
                position: relative;
                width: 50px;
                height: 24px;
                background: #7f8c8d;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .axis-toggle-switch.active {
                background: #2ecc71;
            }
            .axis-toggle-knob {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: left 0.3s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .axis-toggle-switch.active .axis-toggle-knob {
                left: 28px;
            }
        `;
        document.head.appendChild(style);
        
        container.appendChild(sectionTitle);
        
        // Create toggle for each axis
        ['X', 'Y', 'Z'].forEach(axis => {
            const row = document.createElement('div');
            row.className = 'axis-lock-row';
            
            const label = document.createElement('div');
            label.className = 'axis-lock-label';
            label.textContent = `${axis}-Axis`;
            label.style.color = this.getAxisColor(axis);
            
            const toggleSwitch = document.createElement('div');
            toggleSwitch.className = 'axis-toggle-switch';
            toggleSwitch.id = `axis-lock-${axis.toLowerCase()}`;
            
            const knob = document.createElement('div');
            knob.className = 'axis-toggle-knob';
            
            toggleSwitch.appendChild(knob);
            
            // Click handler
            toggleSwitch.onclick = () => this.toggleAxisLock(axis.toLowerCase());
            
            row.appendChild(label);
            row.appendChild(toggleSwitch);
            container.appendChild(row);
        });
        
        // Info text
        const info = document.createElement('div');
        info.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background: rgba(74, 158, 255, 0.1);
            border-radius: 5px;
            color: #95a5a6;
            font-size: 11px;
            line-height: 1.4;
        `;
        info.textContent = 'Lock axes to constrain camera rotation. Useful for viewing from specific angles.';
        container.appendChild(info);
    }
    
    /**
     * Get color for axis labels
     */
    getAxisColor(axis) {
        const colors = {
            'X': '#e74c3c', // Red
            'Y': '#2ecc71', // Green
            'Z': '#3498db'  // Blue
        };
        return colors[axis] || '#ecf0f1';
    }
    
    /**
     * Toggle axis lock
     */
    toggleAxisLock(axis) {
        this.axisLocks[axis] = !this.axisLocks[axis];
        
        // Update UI
        const toggle = document.getElementById(`axis-lock-${axis}`);
        if (toggle) {
            if (this.axisLocks[axis]) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
        
        console.log(`🔒 ${axis.toUpperCase()}-axis lock: ${this.axisLocks[axis] ? 'LOCKED' : 'UNLOCKED'}`);
    }
    
    /**
     * Create undo/redo section in tool palette
     */
    createUndoRedoSection(container) {
        // Section title
        const sectionTitle = document.createElement('div');
        sectionTitle.style.cssText = `
            color: #ecf0f1;
            font-size: 13px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #4a9eff;
        `;
        sectionTitle.textContent = 'History';
        
        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 8px;
        `;
        
        // Undo button
        const undoBtn = document.createElement('button');
        undoBtn.id = 'randym-undo-btn';
        undoBtn.innerHTML = '↶ Undo';
        undoBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #34495e;
            color: #ecf0f1;
            border: 1px solid #4a9eff;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        `;
        undoBtn.onclick = () => this.undo();
        undoBtn.onmouseover = () => {
            if (this.undoStack.length > 0) {
                undoBtn.style.background = '#4a9eff';
            }
        };
        undoBtn.onmouseout = () => {
            undoBtn.style.background = '#34495e';
        };
        
        // Redo button
        const redoBtn = document.createElement('button');
        redoBtn.id = 'randym-redo-btn';
        redoBtn.innerHTML = '↷ Redo';
        redoBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #34495e;
            color: #ecf0f1;
            border: 1px solid #4a9eff;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        `;
        redoBtn.onclick = () => this.redo();
        redoBtn.onmouseover = () => {
            if (this.redoStack.length > 0) {
                redoBtn.style.background = '#4a9eff';
            }
        };
        redoBtn.onmouseout = () => {
            redoBtn.style.background = '#34495e';
        };
        
        buttonContainer.appendChild(undoBtn);
        buttonContainer.appendChild(redoBtn);
        
        // Info text
        const info = document.createElement('div');
        info.style.cssText = `
            margin-top: 10px;
            padding: 10px;
            background: rgba(74, 158, 255, 0.1);
            border-radius: 5px;
            color: #95a5a6;
            font-size: 11px;
            line-height: 1.4;
        `;
        info.innerHTML = '<strong>Ctrl+Z:</strong> Undo<br><strong>Ctrl+Y:</strong> Redo';
        
        container.appendChild(sectionTitle);
        container.appendChild(buttonContainer);
        container.appendChild(info);
        
        // Update button states
        this.updateUndoRedoButtons();
    }
    
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('randym-undo-btn');
        const redoBtn = document.getElementById('randym-redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.style.opacity = this.undoStack.length === 0 ? '0.5' : '1';
            undoBtn.style.cursor = this.undoStack.length === 0 ? 'not-allowed' : 'pointer';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
            redoBtn.style.cursor = this.redoStack.length === 0 ? 'not-allowed' : 'pointer';
        }
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
        
        // Record action for undo
        this.pushUndoAction({
            type: 'place',
            position: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) },
            blockType: this.selectedBlockType
        });
        
        this.updateStats();
        console.log('✅ Placed block at', key, '| Type:', this.selectedBlockType);
    }
    
    /**
     * Place a block at specific coordinates (used by undo/redo)
     */
    placeBlockAt(x, y, z, blockType) {
        const key = `${x},${y},${z}`;
        
        // Don't place if block already exists
        if (this.placedBlocks.has(key)) {
            return;
        }
        
        // Create block mesh
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Try to get textured material from EnhancedGraphics
        const enhancedGraphics = this.voxelWorld?.enhancedGraphics;
        let material;
        
        if (enhancedGraphics && enhancedGraphics.assetsLoaded) {
            const color = this.getBlockColor(blockType);
            const fallbackMaterial = new THREE.MeshLambertMaterial({ 
                color: color,
                flatShading: true
            });
            
            material = enhancedGraphics.getEnhancedBlockMaterial(blockType, fallbackMaterial);
        } else {
            const color = this.getBlockColor(blockType);
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
        this.placedBlocks.set(key, { mesh, blockType });
    }
    
    /**
     * Remove a block at position
     */
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const block = this.placedBlocks.get(key);
        
        if (block) {
            // Record action for undo
            this.pushUndoAction({
                type: 'remove',
                position: { x, y, z },
                blockType: block.blockType
            });
            
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
        this.onKeyDown = (event) => this.handleKeyDown(event);
        
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('wheel', this.onWheel);
        window.addEventListener('resize', this.onResize);
        window.addEventListener('keydown', this.onKeyDown);
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
        window.removeEventListener('keydown', this.onKeyDown);
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
        
        // Update shape preview if in shape mode and start point is set
        if (this.toolMode !== 'place' && this.shapeStart && !this.isRotating) {
            const currentPos = this.getPlacementPosition();
            if (currentPos) {
                this.updateShapePreview(currentPos);
            }
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
     * Handle left click (place block or shape selection)
     */
    handleClick(event) {
        // Don't place blocks if we were rotating
        if (event.ctrlKey) {
            return;
        }
        
        event.preventDefault();
        
        // Check tool mode
        if (this.toolMode === 'place') {
            // Single block placement
            this.placeBlock();
        } else if (this.toolMode === 'door') {
            // Door tool - single click
            const pos = this.getPlacementPosition();
            if (pos) {
                this.shapeStart = pos.clone();
                this.shapeEnd = pos.clone(); // Door only needs one point
                this.executeShape();
            }
        } else {
            // Shape tool - two-point selection
            if (!this.shapeStart) {
                // First click - set start point
                const pos = this.getPlacementPosition();
                if (pos) {
                    this.shapeStart = pos.clone();
                    console.log(`📍 Shape start: ${pos.x}, ${pos.y}, ${pos.z}`);
                }
            } else {
                // Second click - set end point and execute shape
                const pos = this.getPlacementPosition();
                if (pos) {
                    this.shapeEnd = pos.clone();
                    console.log(`📍 Shape end: ${pos.x}, ${pos.y}, ${pos.z}`);
                    this.executeShape();
                }
            }
        }
    }
    
    /**
     * Get placement position from current mouse raycast
     */
    getPlacementPosition() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections with existing blocks
        const blocks = Array.from(this.placedBlocks.values()).map(b => b.mesh);
        const intersects = this.raycaster.intersectObjects(blocks);
        
        if (intersects.length > 0) {
            // Place adjacent to existing block
            const intersect = intersects[0];
            const normal = intersect.face.normal;
            const pos = intersect.object.position.clone();
            
            pos.x = Math.floor(pos.x) + normal.x;
            pos.y = Math.floor(pos.y) + normal.y;
            pos.z = Math.floor(pos.z) + normal.z;
            
            return pos;
        } else {
            // Place on ground plane
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const planeIntersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(groundPlane, planeIntersect);
            
            if (planeIntersect) {
                planeIntersect.x = Math.floor(planeIntersect.x);
                planeIntersect.y = 0;
                planeIntersect.z = Math.floor(planeIntersect.z);
                return planeIntersect;
            }
        }
        
        return null;
    }
    
    /**
     * Execute the selected shape tool
     */
    executeShape() {
        if (!this.shapeStart || !this.shapeEnd) return;
        
        // Clear preview
        this.clearShapePreview();
        
        // Execute appropriate shape tool
        const blocksBefore = this.placedBlocks.size;
        
        switch (this.toolMode) {
            case 'fill_cube':
                this.fillCube(this.shapeStart, this.shapeEnd);
                break;
            case 'hollow_cube':
                this.hollowCube(this.shapeStart, this.shapeEnd);
                break;
            case 'hollow_sphere':
                this.hollowSphere(this.shapeStart, this.shapeEnd);
                break;
            case 'hollow_cylinder':
                this.hollowCylinder(this.shapeStart, this.shapeEnd);
                break;
            case 'hollow_pyramid':
                this.hollowPyramid(this.shapeStart, this.shapeEnd);
                break;
            case 'wall':
                this.createWall(this.shapeStart, this.shapeEnd);
                break;
            case 'floor':
                this.createFloor(this.shapeStart, this.shapeEnd);
                break;
            case 'line':
                this.createLine(this.shapeStart, this.shapeEnd);
                break;
            case 'door':
                this.createDoor(this.shapeStart);
                break;
        }
        
        const blocksPlaced = this.placedBlocks.size - blocksBefore;
        console.log(`✅ ${this.toolMode}: placed ${blocksPlaced} blocks`);
        
        // Reset for next shape
        this.shapeStart = null;
        this.shapeEnd = null;
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
     * Handle keyboard shortcuts
     */
    handleKeyDown(event) {
        // ESC: Cancel shape selection
        if (event.key === 'Escape') {
            if (this.shapeStart) {
                console.log('❌ Shape selection cancelled');
                this.cancelShape();
                event.preventDefault();
            }
        }
        
        // Undo: Ctrl+Z
        if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.undo();
        }
        
        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if ((event.ctrlKey && event.key === 'y') || 
            (event.ctrlKey && event.shiftKey && event.key === 'z')) {
            event.preventDefault();
            this.redo();
        }
    }
    
    /**
     * Push action to undo stack
     */
    pushUndoAction(action) {
        this.undoStack.push(action);
        
        // Limit stack size
        if (this.undoStack.length > this.maxUndoSize) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.clearRedoStack();
        
        this.updateUndoRedoButtons();
    }
    
    /**
     * Clear redo stack
     */
    clearRedoStack() {
        this.redoStack = [];
    }
    
    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            console.log('⚠️ Nothing to undo');
            return;
        }
        
        const action = this.undoStack.pop();
        
        if (action.type === 'place') {
            // Undo place = remove block
            const { x, y, z } = action.position;
            const key = `${x},${y},${z}`;
            const block = this.placedBlocks.get(key);
            
            if (block) {
                this.scene.remove(block.mesh);
                block.mesh.geometry.dispose();
                
                if (Array.isArray(block.mesh.material)) {
                    block.mesh.material.forEach(mat => mat.dispose());
                } else {
                    block.mesh.material.dispose();
                }
                
                this.placedBlocks.delete(key);
            }
        } else if (action.type === 'remove') {
            // Undo remove = place block back
            this.placeBlockAt(action.position.x, action.position.y, action.position.z, action.blockType);
        } else if (action.type === 'batch_place') {
            // Undo batch place = remove all blocks
            action.blocks.forEach(blockInfo => {
                const key = `${blockInfo.x},${blockInfo.y},${blockInfo.z}`;
                const block = this.placedBlocks.get(key);
                
                if (block) {
                    this.scene.remove(block.mesh);
                    block.mesh.geometry.dispose();
                    
                    if (Array.isArray(block.mesh.material)) {
                        block.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        block.mesh.material.dispose();
                    }
                    
                    this.placedBlocks.delete(key);
                }
            });
        } else if (action.type === 'batch_remove') {
            // Undo batch remove = place all blocks back
            action.blocks.forEach(blockInfo => {
                this.placeBlockAt(blockInfo.x, blockInfo.y, blockInfo.z, blockInfo.blockType);
            });
        }
        
        // Push to redo stack
        this.redoStack.push(action);
        
        this.updateStats();
        this.updateUndoRedoButtons();
        console.log('↶ Undid action:', action.type);
    }
    
    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) {
            console.log('⚠️ Nothing to redo');
            return;
        }
        
        const action = this.redoStack.pop();
        
        if (action.type === 'place') {
            // Redo place = place block again
            this.placeBlockAt(action.position.x, action.position.y, action.position.z, action.blockType);
        } else if (action.type === 'remove') {
            // Redo remove = remove block again
            const { x, y, z } = action.position;
            const key = `${x},${y},${z}`;
            const block = this.placedBlocks.get(key);
            
            if (block) {
                this.scene.remove(block.mesh);
                block.mesh.geometry.dispose();
                
                if (Array.isArray(block.mesh.material)) {
                    block.mesh.material.forEach(mat => mat.dispose());
                } else {
                    block.mesh.material.dispose();
                }
                
                this.placedBlocks.delete(key);
            }
        } else if (action.type === 'batch_place') {
            // Redo batch place = place all blocks again
            action.blocks.forEach(blockInfo => {
                this.placeBlockAt(blockInfo.x, blockInfo.y, blockInfo.z, blockInfo.blockType);
            });
        } else if (action.type === 'batch_remove') {
            // Redo batch remove = remove all blocks again
            action.blocks.forEach(blockInfo => {
                const key = `${blockInfo.x},${blockInfo.y},${blockInfo.z}`;
                const block = this.placedBlocks.get(key);
                
                if (block) {
                    this.scene.remove(block.mesh);
                    block.mesh.geometry.dispose();
                    
                    if (Array.isArray(block.mesh.material)) {
                        block.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        block.mesh.material.dispose();
                    }
                    
                    this.placedBlocks.delete(key);
                }
            });
        }
        
        // Push back to undo stack
        this.undoStack.push(action);
        
        this.updateStats();
        this.updateUndoRedoButtons();
        console.log('↷ Redid action:', action.type);
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
