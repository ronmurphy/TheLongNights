/**
 * WeatherCycleSystem.js
 * 
 * Manages automatic weather cycles with random timing.
 * Triggers weather based on time, biome, and elevation.
 * 
 * Features:
 * - Random weather events
 * - Clear periods between weather
 * - Elevation-based thunder
 * - Configurable frequency and duration
 */

export class WeatherCycleSystem {
    constructor(weatherSystem, player, dayNightCycle) {
        this.weatherSystem = weatherSystem;
        this.player = player;
        this.dayNightCycle = dayNightCycle;
        
        this.isActive = false;
        this.currentCycleTimer = 0;
        this.nextWeatherChangeTime = 0;
        
        // Configuration
        this.config = {
            // How often weather can occur (in game hours)
            minClearPeriod: 6,    // At least 6 hours of clear weather
            maxClearPeriod: 24,   // Up to 24 hours of clear weather
            
            // How long weather lasts (in game hours)
            minWeatherDuration: 2,  // At least 2 hours
            maxWeatherDuration: 8,  // Up to 8 hours
            
            // Weather type chances (must total 1.0)
            weatherChances: {
                rain: 0.5,    // 50% rain
                thunder: 0.2, // 20% thunder (if elevation allows)
                snow: 0.3     // 30% snow
            },
            
            // Elevation for thunder
            thunderElevation: 50
        };
        
        this.scheduleNextWeather();
        
        console.log('🌦️ WeatherCycleSystem initialized');
    }
    
    /**
     * Start automatic weather cycles
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🌦️ Weather cycles started');
    }
    
    /**
     * Stop automatic weather cycles
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.weatherSystem.stopWeather();
        console.log('🌦️ Weather cycles stopped');
    }
    
    /**
     * Toggle weather cycles on/off
     */
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    /**
     * Schedule next weather event
     */
    scheduleNextWeather() {
        const currentWeather = this.weatherSystem.getWeather();
        
        if (currentWeather) {
            // Currently has weather - schedule it to stop
            const duration = this.getRandomDuration(
                this.config.minWeatherDuration,
                this.config.maxWeatherDuration
            );
            this.nextWeatherChangeTime = this.getGameTimeInHours() + duration;
            
            console.log(`🌦️ Current ${currentWeather} will last ${duration.toFixed(1)} game hours`);
        } else {
            // Currently clear - schedule next weather
            const clearPeriod = this.getRandomDuration(
                this.config.minClearPeriod,
                this.config.maxClearPeriod
            );
            this.nextWeatherChangeTime = this.getGameTimeInHours() + clearPeriod;
            
            console.log(`🌦️ Next weather in ${clearPeriod.toFixed(1)} game hours`);
        }
    }
    
    /**
     * Get random duration between min and max
     */
    getRandomDuration(min, max) {
        return min + Math.random() * (max - min);
    }
    
    /**
     * Get current game time in hours (continuous, not 0-24)
     */
    getGameTimeInHours() {
        if (!this.dayNightCycle) return 0;
        
        // Calculate total hours including full days
        const totalDays = this.dayNightCycle.totalDays || 0;
        const currentTime = this.dayNightCycle.currentTime || 0;
        
        return (totalDays * 24) + currentTime;
    }
    
    /**
     * Choose random weather type based on chances
     */
    chooseWeatherType() {
        const playerY = this.player?.position?.y || 0;
        const chances = { ...this.config.weatherChances };
        
        // If below thunder elevation, redistribute thunder chance to rain
        if (playerY < this.config.thunderElevation) {
            chances.rain += chances.thunder;
            chances.thunder = 0;
        }
        
        // Roll random number
        const roll = Math.random();
        let cumulative = 0;
        
        for (const [type, chance] of Object.entries(chances)) {
            cumulative += chance;
            if (roll <= cumulative) {
                return type;
            }
        }
        
        // Fallback to rain
        return 'rain';
    }
    
    /**
     * Start weather event
     */
    startWeather() {
        const weatherType = this.chooseWeatherType();
        const playerY = this.player?.position?.y || 0;
        
        this.weatherSystem.startWeather(weatherType, playerY);
        
        console.log(`🌦️ Weather started: ${weatherType} at elevation ${playerY.toFixed(0)}`);
        
        // Schedule when this weather will stop
        this.scheduleNextWeather();
    }
    
    /**
     * Stop current weather
     */
    stopWeather() {
        this.weatherSystem.stopWeather();
        
        console.log('🌦️ Weather stopped (clear skies)');
        
        // Schedule next weather event
        this.scheduleNextWeather();
    }
    
    /**
     * Update weather cycle (call once per frame)
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        const currentGameTime = this.getGameTimeInHours();
        
        // Check if it's time to change weather
        if (currentGameTime >= this.nextWeatherChangeTime) {
            const currentWeather = this.weatherSystem.getWeather();
            
            if (currentWeather) {
                // Stop current weather
                this.stopWeather();
            } else {
                // Start new weather
                this.startWeather();
            }
        }
    }
    
    /**
     * Force weather immediately (for testing/events)
     */
    forceWeather(type) {
        const playerY = this.player?.position?.y || 0;
        this.weatherSystem.startWeather(type, playerY);
        this.scheduleNextWeather();
        console.log(`🌦️ Forced weather: ${type}`);
    }
    
    /**
     * Get time until next weather change (in game hours)
     */
    getTimeUntilNextChange() {
        const currentTime = this.getGameTimeInHours();
        return Math.max(0, this.nextWeatherChangeTime - currentTime);
    }
    
    /**
     * Get debug info
     */
    getDebugInfo() {
        const currentWeather = this.weatherSystem.getWeather();
        const timeUntilChange = this.getTimeUntilNextChange();
        const playerY = this.player?.position?.y || 0;
        
        return {
            active: this.isActive,
            currentWeather: currentWeather || 'clear',
            timeUntilChange: timeUntilChange.toFixed(2),
            playerElevation: playerY.toFixed(0),
            canThunder: playerY >= this.config.thunderElevation
        };
    }
}
