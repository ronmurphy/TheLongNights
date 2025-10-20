# 🌦️ Weather Cycle System - Quick Reference

**Status:** ✅ Implemented and Active (2025-10-19)
**Auto-start:** Yes (starts automatically on game load)

---

## 🎯 What It Does

Automatically cycles between clear weather and random weather events (rain, thunder, snow).

### Weather Schedule:
- **Clear periods:** 6-24 game hours (randomized)
- **Weather duration:** 2-8 game hours (randomized)
- **Weather types:**
  - 50% Rain ☔
  - 20% Thunder ⚡ (elevation 50+ only, otherwise rain)
  - 30% Snow ❄️

---

## 🎮 Quick Commands

### Check Weather Status
```javascript
// See current weather and time until change
voxelWorld.weatherCycleSystem.getDebugInfo();

// Example output:
// {
//   active: true,
//   currentWeather: 'rain',
//   timeUntilChange: '3.45',  // Game hours
//   playerElevation: '72',
//   canThunder: true
// }
```

### Control Cycles
```javascript
// Turn off automatic cycles
voxelWorld.weatherCycleSystem.stop();

// Turn on automatic cycles
voxelWorld.weatherCycleSystem.start();

// Toggle on/off
voxelWorld.weatherCycleSystem.toggle();
```

### Force Weather (Testing)
```javascript
// Make it rain immediately
voxelWorld.weatherCycleSystem.forceWeather('rain');

// Force thunderstorm
voxelWorld.weatherCycleSystem.forceWeather('thunder');

// Force snow
voxelWorld.weatherCycleSystem.forceWeather('snow');
```

---

## 🏔️ Thunder Elevation System

**Thunder only spawns at altitude 50+**

If player is below 50:
- Thunder attempts fall back to rain
- System logs: `"Thunder only at elevation 50+, using rain instead"`

**Reason:** Thematic! Thunderstorms happen in mountains, not valleys.

---

## ⏰ How Weather Timing Works

Weather uses **game time** (not real time):

```javascript
// Game time calculation
totalGameHours = (totalDays × 24) + currentTime

// Example:
// Day 5, 14:30 (2:30 PM)
// totalGameHours = (5 × 24) + 14.5 = 134.5 hours
```

### Timeline Example:
```
Hour 0:   Clear weather (start)
Hour 12:  Rain starts (12 hours clear)
Hour 16:  Rain stops (4 hours rain)
Hour 30:  Snow starts (14 hours clear)
Hour 36:  Snow stops (6 hours snow)
Hour 48:  Thunder starts (12 hours clear)
...and so on
```

---

## 🔧 Configuration

Edit `WeatherCycleSystem.config` for custom timing:

```javascript
// Change in src/WeatherCycleSystem.js
this.config = {
    // Clear periods
    minClearPeriod: 6,    // Default: 6 hours
    maxClearPeriod: 24,   // Default: 24 hours
    
    // Weather duration
    minWeatherDuration: 2,   // Default: 2 hours
    maxWeatherDuration: 8,   // Default: 8 hours
    
    // Weather chances (must total 1.0)
    weatherChances: {
        rain: 0.5,     // 50%
        thunder: 0.2,  // 20%
        snow: 0.3      // 30%
    },
    
    // Thunder elevation
    thunderElevation: 50  // Minimum Y for thunder
};
```

---

## 🐛 Troubleshooting

### Weather never changes
```javascript
// Check if cycles are active
voxelWorld.weatherCycleSystem.isActive;  // Should be true

// Check time until next change
voxelWorld.weatherCycleSystem.getTimeUntilNextChange();  // Should decrease

// Manually trigger next change
voxelWorld.weatherCycleSystem.forceWeather('rain');
```

### Always getting rain, never thunder
```javascript
// Check elevation
voxelWorld.player.position.y;  // Must be >= 50

// Lower thunder requirement (testing)
voxelWorld.weatherCycleSystem.config.thunderElevation = 0;

// Force thunder
voxelWorld.weatherCycleSystem.forceWeather('thunder');
```

### Too frequent/infrequent weather
```javascript
// Make weather less frequent
voxelWorld.weatherCycleSystem.config.minClearPeriod = 12;   // Was 6
voxelWorld.weatherCycleSystem.config.maxClearPeriod = 48;   // Was 24

// Make weather last longer
voxelWorld.weatherCycleSystem.config.minWeatherDuration = 4;  // Was 2
voxelWorld.weatherCycleSystem.config.maxWeatherDuration = 12; // Was 8
```

---

## 💡 Future Ideas (Later!)

### Snow Accumulation
```javascript
// If it snows long enough, turn grass/dirt to snow blocks
// User requested feature - save for later!

if (snowDuration > 4 && currentWeather === 'snow') {
    convertGrassDirtToSnow();
}
```

### Biome-Specific Weather
```javascript
// Desert: Sandstorms
// Ocean: More frequent rain
// Mountain: More frequent snow/thunder
// Forest: Light rain, rare thunder
```

### Seasonal Weather
```javascript
// Winter: More snow, less rain
// Summer: More thunder, less snow
// Spring: More rain
// Fall: Mixed weather
```

---

## ✅ System Status

- [x] WeatherSystem.js (particle rendering)
- [x] WeatherCycleSystem.js (automatic scheduling)
- [x] Integration with VoxelWorld.js
- [x] Elevation-based thunder
- [x] Console commands
- [x] Documentation
- [ ] Snow accumulation (future)
- [ ] Biome-specific weather (future)
- [ ] Seasonal weather (future)

---

**Happy weathering!** 🌦️⛈️❄️
