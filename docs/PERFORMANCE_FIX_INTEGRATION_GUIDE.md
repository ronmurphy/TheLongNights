# Performance Fix Integration Guide

**Apply these changes AFTER running `git pull origin main`**

This guide shows exactly what to modify to maintain good performance after merging remote code.

---

## Step 1: Add Performance Config System

**File:** `src/PerformanceConfig.js`  
**Status:** ✅ Already created - just add this import to VoxelWorld.js

---

## Step 2: Modify VoxelWorld.js

### Import Performance Config

Add to top of file (around line 40):

```javascript
import { performanceConfig } from './PerformanceConfig.js';
```

### Load Performance Config

In constructor, after stats initialization (around line 72):

```javascript
// 📊 FPS counter initialized (toggle with View > FPS menu)
console.log('📊 FPS counter initialized (toggle with View > FPS menu)');

// ⚙️ Load performance configuration
performanceConfig.load();
console.log('⚙️ Performance config loaded');
```

### Conditionally Initialize Atmospheric Fog

Find where AtmosphericFog is initialized (around line 397):

**BEFORE:**
```javascript
// 🌫️ Initialize Atmospheric Fog System
this.atmosphericFog = new AtmosphericFog(this.scene, this.camera);
```

**AFTER:**
```javascript
// 🌫️ Initialize Atmospheric Fog System (conditional based on performance config)
if (performanceConfig.get('enableAtmosphericFog')) {
    this.atmosphericFog = new AtmosphericFog(this.scene, this.camera);
    console.log('🌫️ Atmospheric fog enabled');
} else {
    this.atmosphericFog = null;
    console.log('⚠️ Atmospheric fog DISABLED (performance config)');
}
```

### Conditionally Initialize Weather System

Find where WeatherSystem is initialized (around line 400-420):

**BEFORE:**
```javascript
// 🌧️ Initialize Weather System
this.weatherSystem = new WeatherSystem(this.scene, this.camera);
this.weatherCycleSystem = new WeatherCycleSystem(this.weatherSystem);
```

**AFTER:**
```javascript
// 🌧️ Initialize Weather System (conditional based on performance config)
if (performanceConfig.get('enableWeather')) {
    this.weatherSystem = new WeatherSystem(this.scene, this.camera);
    this.weatherCycleSystem = new WeatherCycleSystem(this.weatherSystem);
    console.log('🌧️ Weather system enabled');
} else {
    this.weatherSystem = null;
    this.weatherCycleSystem = null;
    console.log('⚠️ Weather system DISABLED (performance config)');
}
```

### Add FPS Tracking to Animate Loop

Find the animate() function (around line 10930):

**BEFORE:**
```javascript
const animate = (currentTime = 0) => {
    this.animationId = requestAnimationFrame(animate);
    
    // 📊 FPS Counter: Begin measurement
    if (this.statsEnabled) {
        this.stats.begin();
    }
    
    // Calculate delta time
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30);
    lastTime = currentTime;
```

**AFTER:**
```javascript
const animate = (currentTime = 0) => {
    this.animationId = requestAnimationFrame(animate);
    
    // 📊 FPS Counter: Begin measurement
    if (this.statsEnabled) {
        this.stats.begin();
    }
    
    // Calculate delta time
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30);
    lastTime = currentTime;
    
    // ⚙️ Track FPS for auto-optimization
    performanceConfig.trackFPS(deltaTime);
```

### Update Weather System Calls

Find where weather is updated in animate() (around line 11100-11200):

**BEFORE:**
```javascript
// Update weather system
if (this.weatherSystem) {
    this.weatherSystem.update(deltaTime);
}
```

**AFTER:**
```javascript
// Update weather system (only if enabled)
if (this.weatherSystem && performanceConfig.get('enableWeather')) {
    this.weatherSystem.update(deltaTime);
}
```

### Update Atmospheric Fog Calls

Find where fog is updated:

**BEFORE:**
```javascript
// Update atmospheric fog
if (this.atmosphericFog) {
    this.atmosphericFog.update(deltaTime, this.timeOfDaySystem.currentPhase);
}
```

**AFTER:**
```javascript
// Update atmospheric fog (only if enabled)
if (this.atmosphericFog && performanceConfig.get('enableAtmosphericFog')) {
    this.atmosphericFog.update(deltaTime, this.timeOfDaySystem.currentPhase);
}
```

---

## Step 3: Add Console Commands

These are already available via `window.perfConfig` from PerformanceConfig.js

**Test in console:**

```javascript
// Check current settings
perfConfig.getReport()

// Apply presets
perfConfig.applyPreset('low')     // Best performance
perfConfig.applyPreset('medium')  // Balanced
perfConfig.applyPreset('high')    // Best quality

// Toggle individual features
perfConfig.set('enableAtmosphericFog', true)
perfConfig.set('enableWeather', true)

// Reset to defaults
perfConfig.resetToDefaults()
```

---

## Step 4: Optional - Add Settings UI

Add to MainMenu.js or DevControlPanel.js:

```javascript
// Performance Settings Section
const perfSection = document.createElement('div');
perfSection.innerHTML = `
    <h3>🎮 Performance Settings</h3>
    <label>
        <input type="checkbox" id="perf-fog" ${performanceConfig.get('enableAtmosphericFog') ? 'checked' : ''}>
        Atmospheric Fog (Heavy)
    </label><br>
    <label>
        <input type="checkbox" id="perf-weather" ${performanceConfig.get('enableWeather') ? 'checked' : ''}>
        Weather Effects (Heavy)
    </label><br>
    <label>
        <input type="checkbox" id="perf-auto" ${performanceConfig.get('autoOptimize') ? 'checked' : ''}>
        Auto-Optimize (Recommended)
    </label><br>
    <button id="perf-low">Low (Best FPS)</button>
    <button id="perf-medium">Medium</button>
    <button id="perf-high">High (Best Quality)</button>
`;

// Add event listeners
document.getElementById('perf-fog').addEventListener('change', (e) => {
    performanceConfig.set('enableAtmosphericFog', e.target.checked);
    alert('Restart game for changes to take effect');
});

document.getElementById('perf-weather').addEventListener('change', (e) => {
    performanceConfig.set('enableWeather', e.target.checked);
    alert('Restart game for changes to take effect');
});

document.getElementById('perf-auto').addEventListener('change', (e) => {
    performanceConfig.set('autoOptimize', e.target.checked);
});

document.getElementById('perf-low').addEventListener('click', () => {
    performanceConfig.applyPreset('low');
    alert('Low performance preset applied. Restart game.');
});

document.getElementById('perf-medium').addEventListener('click', () => {
    performanceConfig.applyPreset('medium');
    alert('Medium performance preset applied. Restart game.');
});

document.getElementById('perf-high').addEventListener('click', () => {
    performanceConfig.applyPreset('high');
    alert('High performance preset applied. Restart game.');
});
```

---

## Step 5: Reduce Particle Counts

### Weather System Particles

**File:** `src/WeatherSystem.js`

Find the constructor (around line 10-20):

**BEFORE:**
```javascript
this.maxParticles = 1000; // Maximum rain/snow particles
```

**AFTER:**
```javascript
// Use performance config for particle count
this.maxParticles = performanceConfig.get('maxWeatherParticles') || 300;
console.log(`🌧️ Weather particles limited to ${this.maxParticles}`);
```

### Explosion Particles

**File:** `src/VoxelWorld.js`

Find stone hammer explosion effect (around line 7000):

**BEFORE:**
```javascript
const particleCount = 40; // Number of particles in explosion
```

**AFTER:**
```javascript
const particleCount = performanceConfig.get('maxExplosionParticles') || 20;
```

---

## Step 6: Optimize Companion Map Updates

**File:** `src/CompanionHuntSystem.js`

Find the update method or map marker update code:

**BEFORE:**
```javascript
// Update companion position on map every frame
updateMapMarker() {
    // ... marker update code
}
```

**AFTER:**
```javascript
// Update companion position on map (throttled for performance)
updateMapMarker() {
    const now = Date.now();
    const interval = performanceConfig.get('companionMapUpdateInterval') || 500;
    
    if (now - this.lastMapUpdate < interval) return;
    this.lastMapUpdate = now;
    
    // ... marker update code
}

// In constructor:
constructor() {
    // ...
    this.lastMapUpdate = 0;
}
```

---

## Complete Integration Checklist

After pulling remote code:

- [ ] Add `src/PerformanceConfig.js` (already done)
- [ ] Import in `src/VoxelWorld.js`
- [ ] Load config in VoxelWorld constructor
- [ ] Wrap AtmosphericFog initialization in conditional
- [ ] Wrap WeatherSystem initialization in conditional
- [ ] Add FPS tracking to animate() loop
- [ ] Update all fog/weather update calls
- [ ] Reduce particle counts in WeatherSystem
- [ ] Throttle companion map updates
- [ ] Test with `perfConfig.getReport()` in console
- [ ] Optional: Add settings UI

---

## Testing After Integration

### 1. Test with Everything Disabled (Best Performance)

```javascript
// In console:
perfConfig.applyPreset('low')
```

Then reload. Expected FPS: Same as your local code (~60 FPS)

### 2. Test with Medium Settings

```javascript
perfConfig.applyPreset('medium')
```

Then reload. Expected FPS: 45-55 FPS (weather enabled, fog disabled)

### 3. Test with Everything Enabled

```javascript
perfConfig.applyPreset('high')
```

Then reload. Expected FPS: 30-45 FPS (all systems active)

### 4. Test Auto-Optimization

```javascript
perfConfig.set('autoOptimize', true)
perfConfig.applyPreset('high')
```

Then reload and walk around. Watch console - it should auto-disable features if FPS drops below 30.

---

## Expected Results

| Preset | Atmospheric Fog | Weather | Particles | Expected FPS |
|--------|----------------|---------|-----------|--------------|
| **Low** (Default) | ❌ OFF | ❌ OFF | 100 | 55-60 FPS |
| **Medium** | ❌ OFF | ✅ ON | 300 | 45-55 FPS |
| **High** | ✅ ON | ✅ ON | 600 | 30-45 FPS |

**Recommendation:** Default to LOW preset for best compatibility, let users opt-in to fancy graphics.

---

## Merge Workflow

```bash
# 1. Backup your work
git add -A
git commit -m "Local performance optimizations (pre-merge backup)"

# 2. Create performance branch
git checkout -b performance-optimized

# 3. Go back to main and pull
git checkout main
git pull origin main

# 4. Apply performance fixes
# - Add PerformanceConfig.js
# - Modify VoxelWorld.js (see above)
# - Modify WeatherSystem.js (see above)
# - Modify CompanionHuntSystem.js (see above)

# 5. Test
npm run build
npm run electron
# Check console: perfConfig.getReport()

# 6. Commit performance fixes
git add -A
git commit -m "Add performance configuration system - fog/weather toggleable"

# 7. Optional: Merge your local branch
git merge performance-optimized
```

---

## Troubleshooting

### Issue: "Performance config not loading"

**Fix:** Check browser console for errors. Clear localStorage and try again:
```javascript
localStorage.removeItem('longNights_performanceConfig')
perfConfig.resetToDefaults()
```

### Issue: "Fog/weather still enabled even with config OFF"

**Fix:** Make sure you're checking the config in ALL places:
```bash
# Search for all fog references:
grep -n "atmosphericFog" src/VoxelWorld.js

# Make sure each one checks the config
```

### Issue: "Auto-optimize not working"

**Fix:** Verify trackFPS() is being called in animate loop:
```javascript
// In console:
perfConfig.fpsHistory.length  // Should be > 0 and increasing
```

### Issue: "Low FPS even with everything disabled"

**Potential causes:**
1. Render distance too high (reduce in settings)
2. Too many chunks loaded (increase cleanup radius)
3. Browser issue (try different browser)
4. Check console for errors

---

## Summary

After following this guide:
- ✅ Fog and weather OFF by default (like your local code)
- ✅ Auto-optimization system monitors FPS
- ✅ User can enable features via console/UI
- ✅ Performance presets for easy configuration
- ✅ Same FPS as your current local code on LOW preset

**Your fast local code will remain fast!** 🚀
