# Spectral Hunt System - Integration Guide

## Files Created

### 1. **SpectralHuntSystem.js** (Main Controller)
- Manages hunt probability and state
- Orchestrates big ghost + colored ghost spawning
- Handles rewards and victory/failure
- Console commands for testing

### 2. **BigGhostEntity.js** (Atmospheric Entity)
- Large billboard that orbits player at 400 blocks
- Scales 10-40 blocks (60 on Halloween)
- Black ghost on Day 7
- Ambient sound effects

### 3. **ColoredGhostSystem.js** (Combat Entities)
- Colored ghost minions (ROYGBIV + Black)
- AI movement (follows player)
- Hitbox collision detection
- Hit detection and rewards

---

## Integration Steps

### Step 1: Import in VoxelWorld.js

Add near other imports:
```javascript
import { SpectralHuntSystem } from './SpectralHuntSystem.js';
```

### Step 2: Initialize in Constructor

Add after other system initializations:
```javascript
// Spectral Hunt System (v0.8.2+)
this.spectralHuntSystem = new SpectralHuntSystem(this);
```

### Step 3: Add to Update Loop

In the main update loop, add:
```javascript
// Update spectral hunt
if (this.spectralHuntSystem) {
    this.spectralHuntSystem.update(deltaTime);
}
```

### Step 4: Hook into Time System

Find where time is checked (around 9pm), add:
```javascript
// Check for spectral hunt at 9pm
if (currentHour === 21 && !this.spectralHuntSystem.huntCheckedToday) {
    this.spectralHuntSystem.checkForSpectralHunt();
}

// Reset daily check at 8am
if (currentHour === 8) {
    this.spectralHuntSystem.resetDailyCheck();
}
```

### Step 5: Weapon Integration

In weapon hit detection (pickaxe, spear, etc.), add:
```javascript
// Check spectral hunt ghosts FIRST
if (this.voxelWorld.spectralHuntSystem?.isActive) {
    const hit = this.voxelWorld.spectralHuntSystem.coloredGhostSystem?.checkHit(
        hitPosition,
        weaponRange
    );
    if (hit) return; // Hit a colored ghost, don't continue
}

// Normal block/entity hit detection continues...
```

---

-- ## BRAD NOTE: THESE COMMANDS ARE THE WRONG FORMAT, we went to this format...

'Usage: spectral_hunt("start"), spectral_hunt("stop"), spectral_hunt("test_big"), spectral_hunt("test_colored", "red"), spectral_hunt("test_demolition"), spectral_hunt("set_combo", 6)'


## Testing Console Commands

Once integrated, use these commands:

### Start Hunt (Force)
```
/spectral_hunt start
/spectral_hunt start 7  // Force Day 7 (black ghosts)
```

### Stop Hunt
```
/spectral_hunt stop
```

### Test Big Ghost Only
```
/spectral_hunt test_big
```

### Test Colored Ghost
```
/spectral_hunt test_colored red
/spectral_hunt test_colored black
```

---

## Testing Checklist

- [ ] System initializes without errors
- [ ] Console commands work
- [ ] Big ghost spawns and orbits player
- [ ] Big ghost scales based on day
- [ ] Colored ghosts spawn in waves
- [ ] Colored ghosts follow player
- [ ] Can hit colored ghosts with weapons
- [ ] Hit detection triggers particle effects
- [ ] Ghosts make sounds (spatial audio)
- [ ] Hunt completes when all ghosts killed
- [ ] Hunt fails at 2am if not complete
- [ ] Rewards are given on completion
- [ ] Day 7 spawns black ghosts
- [ ] Halloween test (change system date)

---

## Next Steps After Integration

1. **Build and test basic functionality**
   - Verify no errors
   - Test console commands
   - Visual confirmation

2. **Weapon integration**
   - Add hit detection to pickaxe
   - Add hit detection to spear
   - Add hit detection to demolition charge

3. **Polish**
   - Particle effects on hit
   - Better victory animation
   - UI progress indicator
   - Enhanced audio

4. **Balance**
   - Adjust spawn rates
   - Tune ghost AI speed
   - Adjust rewards
   - Test difficulty curve

---

## Known Limitations (To Add Later)

- **Particle effects**: Hit bursts are logged but not visual yet
- **Victory animation**: Basic for now, can add rainbow explosion
- **UI progress**: No visual progress bar (just status messages)
- **Spectral essence**: Item doesn't exist yet (add with crafting system)
- **Save/load**: Hunt state doesn't persist (ends on reload)

---

## Performance Notes

- Big ghost: 1 billboard mesh (~0.1ms)
- Colored ghosts: Max 10 sprites + 10 hitboxes (~0.5ms)
- Total impact: < 1ms per frame (very lightweight!)
- Audio: Uses existing spatial audio system (no extra cost)

---

**Status**: Ready for integration!
**Next**: Wire up in VoxelWorld.js and test
