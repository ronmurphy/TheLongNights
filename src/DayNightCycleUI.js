/**
 * DayNightCycleUI.js
 * 
 * Animated day/night cycle indicator synchronized with game time.
 * Uses pure CSS animations with JavaScript sync for performance.
 * Based on CodePen: https://codepen.io/wimbarelds/pen/zYyjYJZ
 * 
 * Features:
 * - Smooth sun/moon transitions
 * - Animated clouds
 * - Sky color gradients (dawn, day, dusk, night)
 * - Clickable to open time menu
 * - GPU-accelerated CSS animations (minimal CPU cost)
 */

export class DayNightCycleUI {
    constructor(container, voxelWorld) {
        this.container = container;
        this.voxelWorld = voxelWorld;
        this.element = null;
        
        this.create();
    }
    
    /**
     * Create the day/night cycle UI element
     */
    create() {
        // Create container button
        this.element = document.createElement('button');
        this.element.className = 'day-night-cycle-container';
        this.element.title = 'Click to open menu';
        this.element.style.cssText = `
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 2000;
            width: 64px;
            height: 64px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            background: transparent;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease;
        `;
        
        // Hover effect
        this.element.addEventListener('mouseenter', () => {
            this.element.style.transform = 'scale(1.1)';
        });
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'scale(1.0)';
        });
        
        // Create inner HTML with CSS structure
        this.element.innerHTML = `
            <div class="day-night-sky">
                <div class="sun"></div>
                <div class="moon"></div>
                <div class="stars"></div>
                <div class="cloud cloud-1"></div>
                <div class="cloud cloud-2"></div>
            </div>
        `;
        
        // Add to container
        this.container.appendChild(this.element);
        
        // Inject CSS
        this.injectStyles();
        
        console.log('🌅 Day/Night Cycle UI created');
    }
    
    /**
     * Inject CSS styles for the animation
     */
    injectStyles() {
        // Check if styles already injected
        if (document.getElementById('day-night-cycle-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'day-night-cycle-styles';
        style.textContent = `
            .day-night-sky {
                position: relative;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                overflow: hidden;
                background: linear-gradient(
                    to bottom,
                    var(--sky-top, #1a1a2e) 0%,
                    var(--sky-bottom, #0f0f1e) 100%
                );
                transition: background 1s ease;
            }
            
            /* Sun */
            .sun {
                position: absolute;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) translateY(var(--sun-y, 100px));
                opacity: var(--sun-opacity, 0);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
                transition: opacity 1s ease, transform 1s ease;
            }
            
            /* Moon */
            .moon {
                position: absolute;
                width: 18px;
                height: 18px;
                background: radial-gradient(circle at 30% 30%, #FFF 0%, #C0C0C0 100%);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) translateY(var(--moon-y, -100px));
                opacity: var(--moon-opacity, 0);
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                transition: opacity 1s ease, transform 1s ease;
            }
            
            /* Stars */
            .stars {
                position: absolute;
                width: 100%;
                height: 100%;
                opacity: var(--stars-opacity, 0);
                background-image: 
                    radial-gradient(1px 1px at 20% 30%, white, transparent),
                    radial-gradient(1px 1px at 60% 70%, white, transparent),
                    radial-gradient(1px 1px at 50% 50%, white, transparent),
                    radial-gradient(1px 1px at 80% 10%, white, transparent),
                    radial-gradient(1px 1px at 90% 60%, white, transparent);
                background-size: 100% 100%;
                background-position: 0 0;
                transition: opacity 1s ease;
            }
            
            /* Clouds */
            .cloud {
                position: absolute;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 100px;
                opacity: var(--cloud-opacity, 0);
                transition: opacity 1s ease;
            }
            
            .cloud::before,
            .cloud::after {
                content: '';
                position: absolute;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 100px;
            }
            
            .cloud-1 {
                width: 16px;
                height: 4px;
                top: 20%;
                left: 10%;
                animation: cloud-drift-1 8s ease-in-out infinite;
            }
            
            .cloud-1::before {
                width: 8px;
                height: 4px;
                top: -2px;
                left: 4px;
            }
            
            .cloud-1::after {
                width: 6px;
                height: 4px;
                top: -3px;
                left: 8px;
            }
            
            .cloud-2 {
                width: 12px;
                height: 3px;
                top: 60%;
                right: 15%;
                animation: cloud-drift-2 10s ease-in-out infinite;
            }
            
            .cloud-2::before {
                width: 6px;
                height: 3px;
                top: -2px;
                left: 3px;
            }
            
            @keyframes cloud-drift-1 {
                0%, 100% { transform: translateX(0px); }
                50% { transform: translateX(8px); }
            }
            
            @keyframes cloud-drift-2 {
                0%, 100% { transform: translateX(0px); }
                50% { transform: translateX(-6px); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Update the cycle based on game time (0-24 hours)
     */
    update(gameTime) {
        const skyElement = this.element.querySelector('.day-night-sky');
        if (!skyElement) return;
        
        // Normalize time to 0-1 range
        const timePercent = gameTime / 24;
        
        // Calculate sun/moon positions and visibility
        let sunY, sunOpacity, moonY, moonOpacity, starsOpacity, cloudOpacity;
        let skyTop, skyBottom;
        
        // DAWN (6am - 8am): time 6-8, percent 0.25-0.33
        if (gameTime >= 6 && gameTime < 8) {
            const dawnProgress = (gameTime - 6) / 2; // 0-1 during dawn
            
            skyTop = this.interpolateColor('#1a1a2e', '#FF6B6B', dawnProgress);
            skyBottom = this.interpolateColor('#0f0f1e', '#FFD93D', dawnProgress);
            
            sunY = this.lerp(30, -10, dawnProgress); // Sun rising
            sunOpacity = this.lerp(0, 1, dawnProgress);
            
            moonY = this.lerp(-10, -40, dawnProgress); // Moon setting
            moonOpacity = this.lerp(0.5, 0, dawnProgress);
            
            starsOpacity = this.lerp(0.8, 0, dawnProgress);
            cloudOpacity = this.lerp(0.3, 0.8, dawnProgress);
        }
        // DAY (8am - 5pm): time 8-17, percent 0.33-0.71
        else if (gameTime >= 8 && gameTime < 17) {
            const dayProgress = (gameTime - 8) / 9; // 0-1 during day
            
            skyTop = '#4FB3D9';
            skyBottom = '#87CEEB';
            
            sunY = this.lerp(-10, -15, Math.sin(dayProgress * Math.PI)); // Arc across sky
            sunOpacity = 1;
            
            moonY = -50;
            moonOpacity = 0;
            
            starsOpacity = 0;
            cloudOpacity = 1;
        }
        // DUSK (5pm - 7pm): time 17-19, percent 0.71-0.79
        else if (gameTime >= 17 && gameTime < 19) {
            const duskProgress = (gameTime - 17) / 2; // 0-1 during dusk
            
            skyTop = this.interpolateColor('#FF6B6B', '#2C1E4A', duskProgress);
            skyBottom = this.interpolateColor('#FFD93D', '#1a1a2e', duskProgress);
            
            sunY = this.lerp(-15, 30, duskProgress); // Sun setting
            sunOpacity = this.lerp(1, 0, duskProgress);
            
            moonY = this.lerp(40, -10, duskProgress); // Moon rising
            moonOpacity = this.lerp(0, 0.8, duskProgress);
            
            starsOpacity = this.lerp(0, 0.8, duskProgress);
            cloudOpacity = this.lerp(0.8, 0.3, duskProgress);
        }
        // NIGHT (7pm - 6am): time 19-24 and 0-6
        else {
            const nightTime = gameTime >= 19 ? gameTime : gameTime + 24;
            const nightProgress = (nightTime - 19) / 11; // 0-1 during night
            
            skyTop = '#1a1a2e';
            skyBottom = '#0f0f1e';
            
            sunY = 50;
            sunOpacity = 0;
            
            moonY = this.lerp(-10, -15, Math.sin(nightProgress * Math.PI)); // Arc across sky
            moonOpacity = 1;
            
            starsOpacity = 1;
            cloudOpacity = 0.2;
        }
        
        // Apply CSS variables
        skyElement.style.setProperty('--sky-top', skyTop);
        skyElement.style.setProperty('--sky-bottom', skyBottom);
        skyElement.style.setProperty('--sun-y', `${sunY}px`);
        skyElement.style.setProperty('--sun-opacity', sunOpacity);
        skyElement.style.setProperty('--moon-y', `${moonY}px`);
        skyElement.style.setProperty('--moon-opacity', moonOpacity);
        skyElement.style.setProperty('--stars-opacity', starsOpacity);
        skyElement.style.setProperty('--cloud-opacity', cloudOpacity);
    }
    
    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Interpolate between two hex colors
     */
    interpolateColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(this.lerp(c1.r, c2.r, t));
        const g = Math.round(this.lerp(c1.g, c2.g, t));
        const b = Math.round(this.lerp(c1.b, c2.b, t));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    /**
     * Add click handler
     */
    onClick(callback) {
        this.element.addEventListener('click', callback);
    }
    
    /**
     * Clean up
     */
    dispose() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
