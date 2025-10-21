/**
 * ChunkLoadingSpinner.js
 * 
 * Simple CSS loading spinner displayed during chunk generation.
 * Based on CodePen simple spinner concept.
 * 
 * Features:
 * - Lightweight pure CSS animation
 * - GPU-accelerated rotation
 * - Automatic show/hide based on chunk loading state
 * - Positioned in bottom-right corner
 */

export class ChunkLoadingSpinner {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.isVisible = false;
        this.activeChunks = new Set();
        this.showTime = null; // Track when spinner was shown
        this.minDisplayTime = 300; // Minimum time to show spinner (ms)
        
        this.create();
    }
    
    /**
     * Create the loading spinner element
     */
    create() {
        // Create container
        this.element = document.createElement('div');
        this.element.className = 'chunk-loading-spinner';
        this.element.style.cssText = `
            position: absolute;
            bottom: 270px;
            right: 24px;
            z-index: 1500;
            display: none;
            pointer-events: none;
        `;
        
        // Create spinner with label
        this.element.innerHTML = `
            <div class="spinner-content">
                <div class="spinner-ring"></div>
                <div class="spinner-label">Loading chunks...</div>
            </div>
        `;
        
        // Add to container
        this.container.appendChild(this.element);
        
        // Inject CSS
        this.injectStyles();
        
        console.log('🔄 Chunk Loading Spinner created');
    }
    
    /**
     * Inject CSS styles for the spinner
     */
    injectStyles() {
        // Check if styles already injected
        if (document.getElementById('chunk-loading-spinner-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'chunk-loading-spinner-styles';
        style.textContent = `
            .spinner-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .spinner-ring {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.2);
                border-top-color: #4FB3D9;
                border-radius: 50%;
                animation: spinner-rotate 0.8s linear infinite;
            }
            
            .spinner-label {
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.9);
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                letter-spacing: 0.5px;
            }
            
            @keyframes spinner-rotate {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
            
            /* Fade in/out animation */
            .chunk-loading-spinner {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .chunk-loading-spinner.visible {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Show the loading spinner
     */
    show() {
        if (!this.isVisible) {
            console.log('🔄 SHOWING chunk loading spinner');
            this.element.style.display = 'block';
            // Force reflow for animation
            this.element.offsetHeight;
            this.element.classList.add('visible');
            this.isVisible = true;
            this.showTime = Date.now(); // Record when shown
        }
    }
    
    /**
     * Hide the loading spinner
     */
    hide() {
        if (this.isVisible) {
            // Calculate how long the spinner has been visible
            const elapsed = Date.now() - this.showTime;
            const remainingTime = Math.max(0, this.minDisplayTime - elapsed);
            
            console.log(`✅ HIDING chunk loading spinner (shown for ${elapsed}ms, waiting ${remainingTime}ms more)`);
            
            // Wait for minimum display time before hiding
            setTimeout(() => {
                this.element.classList.remove('visible');
                // Wait for fade out before hiding
                setTimeout(() => {
                    this.element.style.display = 'none';
                }, 200);
                this.isVisible = false;
            }, remainingTime);
        }
    }
    
    /**
     * Track a chunk being loaded
     * @param {string} chunkKey - Unique chunk identifier
     */
    addChunk(chunkKey) {
        this.activeChunks.add(chunkKey);
        console.log(`🔄 Chunk loading started: ${chunkKey} (${this.activeChunks.size} active)`);
        this.show();
    }
    
    /**
     * Mark a chunk as loaded
     * @param {string} chunkKey - Unique chunk identifier
     */
    removeChunk(chunkKey) {
        this.activeChunks.delete(chunkKey);
        console.log(`✅ Chunk loading complete: ${chunkKey} (${this.activeChunks.size} remaining)`);
        
        // Hide if no more active chunks
        if (this.activeChunks.size === 0) {
            this.hide();
        }
    }
    
    /**
     * Get the number of chunks currently loading
     */
    getActiveChunkCount() {
        return this.activeChunks.size;
    }
    
    /**
     * Update the label text
     * @param {string} text - New label text
     */
    updateLabel(text) {
        const label = this.element.querySelector('.spinner-label');
        if (label) {
            label.textContent = text;
        }
    }
    
    /**
     * Clean up
     */
    dispose() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.activeChunks.clear();
    }
}
