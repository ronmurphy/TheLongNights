# 🔊 Sound Effects System

**Date**: October 19, 2025  
**Status**: ✅ Complete  
**Files Created**: `/src/SoundEffectsSystem.js`

## Overview

New **one-shot sound effects** system using Howler.js. Plays short audio clips (zombie growls, cat meows, etc.) without looping.

## Available Sound Effects

Located in `/assets/sfx/` (or `/dist/sfx/` in Electron):

| Sound ID | File | Description |
|----------|------|-------------|
| `zombie` | `Zombie.ogg` | Zombie growl/moan |
| `cat` | `CatMeow.ogg` | Cat meow |
| `ghost` | `Ghost.ogg` | Ghostly wail |

## Quick Usage

### 1. Initialize and Preload

```javascript
// In VoxelWorld constructor or init
import { SoundEffectsSystem } from './SoundEffectsSystem.js';

this.sfxSystem = new SoundEffectsSystem();

// Preload sounds for instant playback
this.sfxSystem.preloadBatch({
    'zombie': 'sfx/Zombie.ogg',
    'cat': 'sfx/CatMeow.ogg',
    'ghost': 'sfx/Ghost.ogg'
});
```

### 2. Play Sounds

```javascript
// Simple play
this.sfxSystem.play('zombie');

// Play with random pitch variation (more natural)
this.sfxSystem.playWithVariation('zombie', 0.2); // ±20% pitch

// Play with custom volume
this.sfxSystem.play('cat', { volume: 0.5 }); // 50% volume

// Play with custom speed
this.sfxSystem.play('ghost', { rate: 0.8 }); // Slower/deeper

// Interrupt previous instance
this.sfxSystem.play('zombie', { interrupt: true }); // Stop old zombie sound
```

## Quest Trigger Integration

### In Sargem Quest Editor

```json
{
  "event": "playSound",
  "params": {
    "soundId": "zombie",
    "variation": false
  }
}
```

**Available Options:**
- `soundId`: `"zombie"`, `"cat"`, `"ghost"` (must be preloaded)
- `variation`: `true` = random pitch, `false` = normal pitch

### Example: Zombie Encounter Quest

```
Node 1: Dialogue
"What's that noise?"
    ↓
Node 2: Trigger (playSound)
{
  "soundId": "zombie",
  "variation": true
}
    ↓
Node 3: Dialogue
"A zombie!"
```

## API Reference

### Preloading

```javascript
// Preload single sound
sfxSystem.preload('zombie', 'sfx/Zombie.ogg');

// Preload multiple
sfxSystem.preloadBatch({
    'zombie': 'sfx/Zombie.ogg',
    'cat': 'sfx/CatMeow.ogg'
});
```

### Playback

```javascript
// Play with default settings
sfxSystem.play('zombie');

// Play with options
sfxSystem.play('zombie', {
    volume: 0.8,      // Override volume (0.0-1.0)
    rate: 1.2,        // Playback speed (0.5-4.0)
    interrupt: true   // Stop previous instance
});

// Play with random pitch
sfxSystem.playWithVariation('zombie', 0.15); // ±15% pitch
```

### Volume Control

```javascript
// Set volume
sfxSystem.setVolume(0.7); // 70% volume

// Adjust volume
sfxSystem.volumeUp();   // +10%
sfxSystem.volumeDown(); // -10%

// Mute/unmute
sfxSystem.toggleMute();
```

### Stopping Sounds

```javascript
// Stop all instances of a sound
sfxSystem.stopAll('zombie');

// Stop ALL sounds
sfxSystem.stopAllSounds();

// Stop specific instance
const instanceId = sfxSystem.play('zombie');
sfxSystem.stopInstance('zombie', instanceId);
```

### Statistics

```javascript
const stats = sfxSystem.getStats();
console.log(stats);
// {
//   totalSounds: 3,
//   currentlyPlaying: 1,
//   sounds: [
//     { id: 'zombie', path: 'sfx/Zombie.ogg', playCount: 5, isPlaying: false },
//     { id: 'cat', path: 'sfx/CatMeow.ogg', playCount: 2, isPlaying: true },
//     ...
//   ]
// }
```

### Cleanup

```javascript
// Unload single sound
sfxSystem.unload('zombie');

// Cleanup everything
sfxSystem.cleanup();

// Full disposal (on game shutdown)
sfxSystem.dispose();
```

## Features

✅ **Multiple Simultaneous Sounds** - Play many sounds at once  
✅ **Pitch Variation** - Random pitch for natural variety  
✅ **Volume Control** - Separate from music volume  
✅ **Preloading** - Zero delay when playing  
✅ **Persistent Volume** - Saved to localStorage  
✅ **Memory Efficient** - Proper cleanup and unloading  
✅ **Electron Compatible** - Works in both web and Electron builds

## Adding New Sounds

1. **Add OGG file** to `/assets/sfx/`
2. **Preload** in VoxelWorld init:
   ```javascript
   this.sfxSystem.preload('newsound', 'sfx/NewSound.ogg');
   ```
3. **Play** anywhere:
   ```javascript
   this.sfxSystem.play('newsound');
   ```

## Integration with Game Systems

### NPCs

```javascript
// In NPCManager
onZombieSpawn(zombie) {
    this.voxelWorld.sfxSystem.playWithVariation('zombie', 0.2);
}
```

### Combat

```javascript
// In CraftedTools melee attack
onMeleeHit(enemy) {
    if (enemy.type === 'zombie') {
        this.voxelWorld.sfxSystem.play('zombie');
    }
}
```

### Animals

```javascript
// In AnimalSystem
onCatInteract(cat) {
    this.voxelWorld.sfxSystem.play('cat');
}
```

## Differences from Music System

| Feature | Music System | SFX System |
|---------|--------------|------------|
| **Looping** | ✅ Yes | ❌ No (one-shot) |
| **Multiple Simultaneous** | ❌ No (one track) | ✅ Yes |
| **Use Case** | Background ambience | Short events |
| **File Size** | Large (MB) | Small (KB) |
| **Volume** | `music_volume` | `sfx_volume` |

## Performance Notes

- ✅ Preloaded sounds have **zero delay**
- ✅ Uses Web Audio API (hardware accelerated)
- ✅ Multiple sounds don't impact performance
- ✅ Auto-cleanup when sounds finish playing

## Troubleshooting

### "Sound not preloaded" Warning
**Problem**: Tried to play before preloading  
**Solution**: Call `preload()` or `preloadBatch()` first

### Sound Doesn't Play
**Problem**: File path incorrect  
**Solution**: Check console for load errors, verify path

### Volume Too Quiet
**Problem**: SFX volume set low  
**Solution**: `sfxSystem.setVolume(0.8)` or `volumeUp()`

---

**Next Steps:**
1. Initialize sfxSystem in VoxelWorld
2. Preload available sounds
3. Test with `window.voxelWorld.sfxSystem.play('zombie')`
4. Add to combat/NPC systems
5. Create more sound effects!
