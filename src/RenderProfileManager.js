/**
 * RenderProfileManager.js
 * Manages render optimization profiles
 * Strategy: Adaptive Visibility FIRST, Vertical Culling SECOND (fallback)
 */

export class RenderProfileManager {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.currentProfile = null;

        this.profiles = {
            POTATO: {
                name: 'Potato Mode',
                description: 'Maximum performance',
                icon: '🥔',
                renderDistance: 0,
                adaptiveVisibility: { enabled: true, rayCount: 16, buffer: 0, scanRate: 5 },
                verticalCulling: { enabled: true, enableHeightLimit: false, undergroundDepth: 8, abovegroundHeight: 8 }
            },
            BALANCED: {
                name: 'Balanced',
                description: 'Recommended',
                icon: '⚙️',
                renderDistance: 1,
                adaptiveVisibility: { enabled: true, rayCount: 24, buffer: 1, scanRate: 10 },
                verticalCulling: { enabled: false } // Vertical culling disabled - adaptive works alone
            },
            GAMING: {
                name: 'Gaming',
                description: 'Maximum quality',
                icon: '✨',
                renderDistance: 2,
                adaptiveVisibility: { enabled: true, rayCount: 32, buffer: 2, scanRate: 12 },
                verticalCulling: { enabled: true, enableHeightLimit: false, undergroundDepth: 12, abovegroundHeight: 12 }
            },
            CLASSIC: {
                name: 'Classic Mode',
                description: 'No optimizations',
                icon: '🎨',
                renderDistance: 1,
                adaptiveVisibility: { enabled: false },
                verticalCulling: { enabled: false }
            },
            TEST: {
                name: 'TEST - Everything Off',
                description: 'Disable all optimizations',
                icon: '🔧',
                renderDistance: 1,
                adaptiveVisibility: { enabled: false },
                verticalCulling: { enabled: false }
            },
            TEST_ADAPTIVE: {
                name: 'TEST - Adaptive Only',
                description: 'Adaptive visibility, no vertical culling',
                icon: '🎯',
                renderDistance: 1,
                adaptiveVisibility: { enabled: true, rayCount: 24, buffer: 1, scanRate: 10 },
                verticalCulling: { enabled: false }
            },
            TEST_VERTICAL: {
                name: 'TEST - Vertical Only',
                description: 'Vertical culling only, no adaptive',
                icon: '📏',
                renderDistance: 1,
                adaptiveVisibility: { enabled: false },
                verticalCulling: { enabled: true, enableHeightLimit: false, undergroundDepth: 10, abovegroundHeight: 10 }
            }
        };
        console.log('🎨 Render Profile Manager initialized');
    }

    initialize() {
        const saved = this.loadFromStorage();
        if (saved && this.profiles[saved]) {
            this.applyProfile(saved, false);
        } else {
            this.applyProfile('BALANCED', false); // Use BALANCED (adaptive only, no vertical culling)
        }
    }

    applyProfile(name, verbose = true) {
        const p = this.profiles[name];
        if (!p) return false;
        
        this.currentProfile = name;
        this.voxelWorld.renderDistance = p.renderDistance;
        if (this.voxelWorld.updateFog) this.voxelWorld.updateFog();
        
        const av = p.adaptiveVisibility;
        if (av.enabled) {
            this.voxelWorld.chunkRenderManager.setAdaptiveVisibility(true, av.rayCount, av.buffer, av.scanRate);
        } else {
            this.voxelWorld.chunkRenderManager.setAdaptiveVisibility(false);
        }
        
        const vc = p.verticalCulling;
        if (vc.enabled) {
            this.voxelWorld.chunkRenderManager.setVerticalCulling(true, vc.enableHeightLimit, vc.undergroundDepth, vc.abovegroundHeight);
        } else {
            this.voxelWorld.chunkRenderManager.setVerticalCulling(false);
        }
        
        this.saveToStorage(name);
        if (verbose) console.log(`✅ Profile: ${p.icon} ${p.name}`);
        return true;
    }

    getProfile(name) { return this.profiles[name] || null; }
    getCurrentProfile() { return this.currentProfile; }
    saveToStorage(name) { try { localStorage.setItem('renderProfile', name); } catch (e) {} }
    loadFromStorage() { try { return localStorage.getItem('renderProfile'); } catch (e) { return null; } }
}
