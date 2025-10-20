/**
 * PerformanceConfig - Centralized performance settings
 * 
 * Controls expensive rendering features like fog, weather, particles
 * Auto-detects hardware capabilities and saves user preferences
 */

export class PerformanceConfig {
    constructor() {
        // Default settings (conservative for compatibility)
        this.settings = {
            // Visual Effects
            enableAtmosphericFog: false,     // Volumetric fog (expensive)
            enableWeather: false,             // Rain/snow particles (expensive)
            enableAdvancedLighting: true,     // Normal lighting is fine
            
            // Particle Limits
            maxWeatherParticles: 300,         // Rain/snow (reduced from 1000)
            maxExplosionParticles: 20,        // Stone hammer effects
            maxFireParticles: 50,             // Campfires, etc
            
            // Update Frequencies (ms)
            companionMapUpdateInterval: 500,  // Companion marker updates
            performanceLogInterval: 10000,    // Performance stats logging
            
            // Auto-Optimization
            autoOptimize: true,               // Auto-disable features if FPS drops
            fpsThreshold: 30,                 // FPS below this triggers auto-disable
            
            // Audio
            enableSpatialAudio: true,         // 3D audio (minimal cost)
            maxSimultaneousSounds: 8,         // Limit concurrent sounds
            
            // Debug
            showPerformanceWarnings: true     // Log when systems are disabled
        };
        
        // FPS tracking for auto-optimization
        this.fpsHistory = [];
        this.maxFPSHistory = 180; // 3 seconds at 60 FPS
        this.lastOptimizationCheck = Date.now();
        this.optimizationCheckInterval = 5000; // Check every 5 seconds
        
        // Track what we've auto-disabled (don't re-enable)
        this.autoDisabled = new Set();
    }
    
    /**
     * Load settings from localStorage
     */
    load() {
        const saved = localStorage.getItem('longNights_performanceConfig');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                // Merge with defaults (in case new settings were added)
                this.settings = { ...this.settings, ...loaded };
                console.log('⚙️ Performance config loaded from localStorage');
            } catch (error) {
                console.warn('⚠️ Failed to load performance config, using defaults');
            }
        } else {
            console.log('⚙️ No saved performance config, using defaults');
        }
    }
    
    /**
     * Save settings to localStorage
     */
    save() {
        try {
            localStorage.setItem('longNights_performanceConfig', JSON.stringify(this.settings));
            console.log('⚙️ Performance config saved');
        } catch (error) {
            console.warn('⚠️ Failed to save performance config');
        }
    }
    
    /**
     * Get a specific setting
     */
    get(key) {
        return this.settings[key];
    }
    
    /**
     * Set a specific setting and save
     */
    set(key, value) {
        this.settings[key] = value;
        this.save();
        console.log(`⚙️ Performance setting updated: ${key} = ${value}`);
    }
    
    /**
     * Update FPS tracking and auto-optimize if needed
     * Call this from the main animate() loop
     */
    trackFPS(deltaTime) {
        if (!this.settings.autoOptimize) return;
        
        // Calculate FPS from delta time
        const fps = 1000 / (deltaTime * 1000);
        this.fpsHistory.push(fps);
        
        // Keep only recent history
        if (this.fpsHistory.length > this.maxFPSHistory) {
            this.fpsHistory.shift();
        }
        
        // Check if we should optimize (every 5 seconds)
        const now = Date.now();
        if (now - this.lastOptimizationCheck > this.optimizationCheckInterval) {
            this.checkAndOptimize();
            this.lastOptimizationCheck = now;
        }
    }
    
    /**
     * Check average FPS and auto-disable expensive features if needed
     */
    checkAndOptimize() {
        if (this.fpsHistory.length < 60) return; // Need at least 1 second of data
        
        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        console.log(`📊 Performance check: ${avgFPS.toFixed(1)} FPS average`);
        
        // If FPS is below threshold, start disabling features
        if (avgFPS < this.settings.fpsThreshold) {
            // Priority order: fog > weather > particles
            if (this.settings.enableAtmosphericFog && !this.autoDisabled.has('fog')) {
                this.settings.enableAtmosphericFog = false;
                this.autoDisabled.add('fog');
                if (this.settings.showPerformanceWarnings) {
                    console.warn(`⚠️ AUTO-OPTIMIZATION: Atmospheric fog disabled (FPS: ${avgFPS.toFixed(1)})`);
                }
                return; // Check again in 5 seconds
            }
            
            if (this.settings.enableWeather && !this.autoDisabled.has('weather')) {
                this.settings.enableWeather = false;
                this.autoDisabled.add('weather');
                if (this.settings.showPerformanceWarnings) {
                    console.warn(`⚠️ AUTO-OPTIMIZATION: Weather disabled (FPS: ${avgFPS.toFixed(1)})`);
                }
                return;
            }
            
            if (this.settings.maxWeatherParticles > 100 && !this.autoDisabled.has('particles')) {
                this.settings.maxWeatherParticles = 100;
                this.autoDisabled.add('particles');
                if (this.settings.showPerformanceWarnings) {
                    console.warn(`⚠️ AUTO-OPTIMIZATION: Particle count reduced (FPS: ${avgFPS.toFixed(1)})`);
                }
                return;
            }
            
            // If we've disabled everything and FPS is still low, warn user
            if (this.autoDisabled.size >= 3 && avgFPS < this.settings.fpsThreshold) {
                if (this.settings.showPerformanceWarnings) {
                    console.warn(`⚠️ Low FPS detected (${avgFPS.toFixed(1)}) even with optimizations. Consider lowering render distance.`);
                }
            }
        }
    }
    
    /**
     * Reset to defaults
     */
    resetToDefaults() {
        this.settings = {
            enableAtmosphericFog: false,
            enableWeather: false,
            enableAdvancedLighting: true,
            maxWeatherParticles: 300,
            maxExplosionParticles: 20,
            maxFireParticles: 50,
            companionMapUpdateInterval: 500,
            performanceLogInterval: 10000,
            autoOptimize: true,
            fpsThreshold: 30,
            enableSpatialAudio: true,
            maxSimultaneousSounds: 8,
            showPerformanceWarnings: true
        };
        this.autoDisabled.clear();
        this.save();
        console.log('⚙️ Performance config reset to defaults');
    }
    
    /**
     * Get performance preset (low/medium/high)
     */
    applyPreset(preset) {
        switch (preset) {
            case 'low':
                this.settings.enableAtmosphericFog = false;
                this.settings.enableWeather = false;
                this.settings.maxWeatherParticles = 100;
                this.settings.maxExplosionParticles = 10;
                this.settings.maxFireParticles = 25;
                this.settings.companionMapUpdateInterval = 1000;
                console.log('⚙️ Applied LOW performance preset');
                break;
                
            case 'medium':
                this.settings.enableAtmosphericFog = false;
                this.settings.enableWeather = true;
                this.settings.maxWeatherParticles = 300;
                this.settings.maxExplosionParticles = 20;
                this.settings.maxFireParticles = 50;
                this.settings.companionMapUpdateInterval = 500;
                console.log('⚙️ Applied MEDIUM performance preset');
                break;
                
            case 'high':
                this.settings.enableAtmosphericFog = true;
                this.settings.enableWeather = true;
                this.settings.maxWeatherParticles = 600;
                this.settings.maxExplosionParticles = 40;
                this.settings.maxFireParticles = 100;
                this.settings.companionMapUpdateInterval = 250;
                console.log('⚙️ Applied HIGH performance preset');
                break;
                
            default:
                console.warn(`⚠️ Unknown preset: ${preset}`);
                return;
        }
        this.save();
    }
    
    /**
     * Get performance report
     */
    getReport() {
        const avgFPS = this.fpsHistory.length > 0
            ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            : 0;
            
        return {
            averageFPS: avgFPS.toFixed(1),
            settings: { ...this.settings },
            autoDisabled: Array.from(this.autoDisabled),
            performanceLevel: avgFPS >= 55 ? 'Excellent' :
                            avgFPS >= 40 ? 'Good' :
                            avgFPS >= 25 ? 'Fair' : 'Poor'
        };
    }
}

// Export singleton instance
export const performanceConfig = new PerformanceConfig();

// Console commands for debugging
if (typeof window !== 'undefined') {
    window.perfConfig = performanceConfig;
    
    // Quick console commands:
    // perfConfig.applyPreset('low')
    // perfConfig.set('enableWeather', true)
    // perfConfig.getReport()
    // perfConfig.resetToDefaults()
}
