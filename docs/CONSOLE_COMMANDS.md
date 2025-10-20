# Console Commands Reference

## �️ Weather System

### Start Weather
```javascript
// Start rain
voxelWorld.weatherSystem.startWeather('rain');

// Start thunder (requires elevation 50+, or falls back to rain)
voxelWorld.weatherSystem.startWeather('thunder', voxelWorld.player.position.y);

// Start snow
voxelWorld.weatherSystem.startWeather('snow');
```

### Stop Weather
```javascript
voxelWorld.weatherSystem.stopWeather();
```

### Check Current Weather
```javascript
voxelWorld.weatherSystem.getWeather();  // Returns 'rain', 'thunder', 'snow', or null
voxelWorld.weatherSystem.isWeatherActive();  // Returns true/false
```

---

## �🌫️ Fog Control (Silent Hill Style)

### Toggle Hard Fog (Wall Effect)
```javascript
// Enable Silent Hill hard fog (ends at render distance - creates fog wall)
// Fog wall moves with player and respects render distance setting
voxelWorld.toggleHardFog(true);

// Disable hard fog (return to soft gradual fog beyond render distance)
voxelWorld.toggleHardFog(false);
```

**How it works:**
- **Hard Fog (Silent Hill)**: Creates a fog wall that ends exactly at your render distance
  - Starts at: `(renderDistance - 0.5) * 64` blocks
  - Ends at: `renderDistance * 64` blocks
  - Creates a sharp cutoff wall effect
  - Moves with the player as chunks load/unload

- **Soft Fog (Normal)**: Gradual fade beyond render distance
  - Starts at: `(renderDistance + 1) * 64` blocks
  - Ends at: `(renderDistance + 3) * 64` blocks
  - Gentle fade effect

**Usage in browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Type: `voxelWorld.toggleHardFog(true)` for spooky hard fog
4. Type: `voxelWorld.toggleHardFog(false)` to turn it off

**Note**: Fog automatically adjusts to day/night cycle (dark at night, sky-colored during day)

---

## 🎨 Enhanced Graphics Assets

### Check What's Loaded
```javascript
// See all loaded enhanced graphics
voxelWorld.enhancedGraphics.getDebugInfo();

// Check specific tool/material images
voxelWorld.enhancedGraphics.toolImages.has('coal');    // Check if coal.png loaded
voxelWorld.enhancedGraphics.toolImages.has('fur');     // Check if fur.png loaded
voxelWorld.enhancedGraphics.toolImages.has('iron');    // Check if iron.png loaded
voxelWorld.enhancedGraphics.toolImages.has('gold');    // Check if gold.png loaded
voxelWorld.enhancedGraphics.toolImages.has('feather'); // Check if feather.png loaded
```

### Asset Naming Convention
Files should match these exact names in `/assets/art/tools/`:

**Materials (NEW - just added to system):**
- `coal.png` ✅ (you added this)
- `fur.png` ✅ (you added this)
- `iron.png` ❓ (add this if you want iron material icon)
- `gold.png` ❓ (add this if you want gold material icon)
- `feather.png` ❓ (add this if you want feather material icon)

**Tools (Already in system):**
- `backpack.png` ✅
- `machete.png` ✅
- `stone_hammer.png` ✅
- `compass.png` ✅
- `toolbench.png` ✅ (also works with tool_bench alias)
- `grapple.png` ✅ (also works with grappling_hook alias)
- `sword.png` ✅
- `pickaxe.png` ✅
- `boots_speed.png` ✅
- `torch.png` ✅
- `workbench.png` ✅

### Reload Enhanced Graphics
```javascript
// Reload all graphics (if you add new PNG files while game is running)
await voxelWorld.enhancedGraphics.initialize();
```

---

## 🔧 Other Useful Console Commands

### Player Position
```javascript
// Get current position
console.log(voxelWorld.player.position);

// Teleport to coordinates
voxelWorld.player.position.x = 100;
voxelWorld.player.position.y = 50;
voxelWorld.player.position.z = 100;
```

### Inventory Debug
```javascript
// See all inventory contents
voxelWorld.inventory.debugInventory();

// Add items to inventory
voxelWorld.inventory.addToInventory('coal', 10);
voxelWorld.inventory.addToInventory('fur', 5);
voxelWorld.inventory.addToInventory('iron', 3);
```

### Time Control
```javascript
// Check current time (0-24 hours)
console.log(voxelWorld.dayNightCycle.currentTime);

// Set specific time
voxelWorld.dayNightCycle.currentTime = 12;  // Noon
voxelWorld.dayNightCycle.currentTime = 0;   // Midnight
voxelWorld.dayNightCycle.currentTime = 6;   // Dawn
voxelWorld.dayNightCycle.currentTime = 18;  // Dusk (fog activates)
voxelWorld.dayNightCycle.currentTime = 22;  // Late night

// Speed up/slow down time
voxelWorld.dayNightCycle.timeScale = 10;  // 10x faster
voxelWorld.dayNightCycle.timeScale = 1;   // Normal speed (default)
voxelWorld.dayNightCycle.timeScale = 0;   // Pause time
```

### Atmospheric Fog Control
```javascript
// Manually disable volumetric fog (for performance testing)
if (voxelWorld.atmosphericFog) {
    voxelWorld.atmosphericFog.deactivate();
}

// Manually enable fog
if (voxelWorld.atmosphericFog) {
    voxelWorld.atmosphericFog.activate(false);  // Normal night fog
    voxelWorld.atmosphericFog.activate(true);   // Blood moon fog
}

// Check if fog is active
console.log(voxelWorld.atmosphericFog?.isActive);
```

### Biome Info
```javascript
// See current biome
const px = Math.floor(voxelWorld.player.position.x);
const pz = Math.floor(voxelWorld.player.position.z);
const biome = voxelWorld.biomeWorldGen.getBiomeAt(px, pz, voxelWorld.worldSeed);
console.log('Current biome:', biome.name);
```

---

## 🌦️ Weather Cycle Commands

### Automatic Weather (ON by default)
```javascript
// Start automatic weather cycles
voxelWorld.weatherCycleSystem.start();

// Stop automatic weather cycles
voxelWorld.weatherCycleSystem.stop();

// Toggle cycles on/off
voxelWorld.weatherCycleSystem.toggle();

// Force specific weather immediately
voxelWorld.weatherCycleSystem.forceWeather('rain');
voxelWorld.weatherCycleSystem.forceWeather('thunder');
voxelWorld.weatherCycleSystem.forceWeather('snow');

// Get debug info
voxelWorld.weatherCycleSystem.getDebugInfo();
// Returns: {active, currentWeather, timeUntilChange, playerElevation, canThunder}

// Check time until next weather change (in game hours)
voxelWorld.weatherCycleSystem.getTimeUntilNextChange();
```

---

## 📋 Notes

1. **Enhanced Graphics**: The system automatically checks for PNG files matching item/block names
2. **File Extensions**: Supports `.png`, `.jpg`, `.jpeg` (PNG preferred for transparency)
3. **Fallback**: If PNG not found, game uses emoji/procedural graphics
4. **Console Access**: `voxelWorld` is the global game instance (available in browser console)
5. **Fog Toggle**: Changes take effect immediately, updates fog rendering
6. **Weather Cycles**: Automatic weather starts on game load, cycles every 6-24 hours (randomized)

**Pro Tip**: Press F12 to open browser DevTools, then use Console tab for commands!
