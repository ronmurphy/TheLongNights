# 🎮 Quick Testing Guide - Ghost Spatial Audio

**Status**: ✅ Ghost audio is now wired up and ready to test!  
**Date**: October 20, 2025

---

## 🔊 What Was Changed

### Files Modified:
1. **`src/GhostSystem.js`**
   - Added `voxelWorld` parameter to constructor
   - Added sound cooldown tracking (8 seconds)
   - Added spatial audio in `update()` method

2. **`src/AngryGhostSystem.js`**
   - Added `voxelWorld` parameter to constructor
   - Added sound cooldown tracking (10 seconds)
   - Added spatial audio in `update()` method

3. **`src/VoxelWorld.js`**
   - Updated ghost system initialization to pass `this` reference

### Audio Configuration:

#### Friendly Ghosts (👻)
```javascript
Sound: Ghost.ogg
Trigger Range: 30 blocks (starts playing when ghost within 30 blocks)
Max Distance: 50 blocks (audible up to 50 blocks)
Cooldown: 8 seconds (prevents spam)
Volume: 60%
Pitch Variation: ±15% (natural variation)
```

#### Angry Ghosts (💀)
```javascript
Sound: Ghost.ogg
Trigger Range: 40 blocks (larger range for danger warning)
Max Distance: 60 blocks (more audible)
Cooldown: 10 seconds (less frequent than friendly)
Volume: 80% (LOUDER)
Pitch: 0.8× (lower pitch = more menacing)
Pitch Variation: ±20%
```

---

## 🎯 How to Test

### Step 1: Find Ghosts

**Friendly Ghosts** spawn at:
- 🏛️ **Ruins**: 80% chance per ruin
- 🌲 **Forests at night**: 5% chance per chunk (19:00-6:00)

**Angry Ghosts** spawn at:
- 🏛️ **Ruins**: 60% chance per ruin
- Trigger battles when you get within 3 blocks

### Step 2: Test Audio

1. **Approach a ghost slowly** from 60+ blocks away
2. **Listen for Ghost.ogg sound** starting at ~50 blocks
3. **Volume should get louder** as you get closer
4. **Sound should fade** as you move away
5. **Cooldown test**: Wait near ghost, sound plays every 8-10 seconds

### Step 3: Test Differences

**Friendly Ghost Test**:
- Sound is quieter (60% volume)
- Higher pitch (normal)
- Sounds every 8 seconds
- Ghost floats gently, follows slowly

**Angry Ghost Test**:
- Sound is louder (80% volume)
- Lower pitch (more ominous)
- Sounds every 10 seconds
- Ghost triggers battle when close

---

## 🎵 Expected Behavior

### Distance-Based Volume
```
Distance    | Volume
------------|--------
0-10 blocks | 100%
20 blocks   | 60%
30 blocks   | 40%
40 blocks   | 20%
50 blocks   | 10%
60+ blocks  | 0% (silent)
```

### Pitch Variation
Each sound plays with slightly different pitch to prevent repetition:
- Friendly: 85%-115% normal pitch
- Angry: 64%-96% normal pitch (lower overall)

### Cooldown System
Prevents audio spam by limiting sounds:
- Only ONE ghost makes sound at a time (per system)
- 8-10 second delays between sounds
- Even if 10 ghosts nearby, you hear sound every 8s max

---

## 🐛 Troubleshooting

### "I don't hear any sounds!"

**Check:**
1. Are you near a ghost? (within 50 blocks)
2. Is sound effects volume turned up? (separate from music)
3. Wait 8-10 seconds (cooldown might be active)
4. Check console for: `🔊 Playing spatial: ghost`

### "Sound plays constantly!"

**Should NOT happen** - cooldown prevents this
- If it does, check console for errors
- Cooldown is 8000ms (8 seconds)

### "Sound doesn't get quieter with distance"

**Expected behavior:**
- Full volume at 0-10 blocks
- Gradual falloff to 50 blocks
- Silent beyond 50 blocks

If broken:
- Check `maxDistance` parameter (should be 50 for friendly, 60 for angry)
- Check `playSpatial()` method in SoundEffectsSystem.js

### "Angry ghost sounds the same as friendly"

**Check:**
- Angry ghost should have `rate: 0.8` (lower pitch)
- Angry ghost should have `volume: 0.8` (louder)
- If same pitch, check AngryGhostSystem.js line ~167

---

## 📋 Full Test Checklist

### Ghost Audio Tests
- [ ] Find friendly ghost at ruin
- [ ] Hear Ghost.ogg sound when approaching
- [ ] Volume increases as you get closer
- [ ] Volume decreases as you move away
- [ ] Sound plays every ~8 seconds
- [ ] Pitch varies slightly each time
- [ ] Find angry ghost at ruin
- [ ] Angry ghost sounds louder/lower than friendly
- [ ] Sound plays every ~10 seconds

### Other System Tests (While You're Here)
- [ ] Test heart updates: Take fall damage (jump from height)
- [ ] Test heart updates: Fight enemy, check hearts update
- [ ] Test food eating: Right-click bread/berry
- [ ] Test food healing: Eat at low HP, hearts restore
- [ ] Test food buffs: Eat energy bar, notice speed boost
- [ ] Test spear throw: Hold Q, release at sweet spot
- [ ] Test spear flight: Watch spear arc through air
- [ ] Test demolition charge: Throw explosive, watch countdown

---

## 🎉 Success Criteria

**You'll know it works when:**

1. ✅ Ghosts make sounds when you're near
2. ✅ Volume changes based on distance
3. ✅ Sounds don't spam constantly
4. ✅ Friendly ghosts sound different than angry ghosts
5. ✅ Multiple ghosts don't create audio chaos

**Extra Credit:**

- Find 3+ ghosts in one area
- Notice only ONE makes sound at a time
- Angry ghost sound is more menacing
- Pitch variation prevents monotony

---

## 📊 Console Messages to Look For

```
🔊 Playing spatial: ghost (volume: 60%)   ← Friendly ghost
🔊 Playing spatial: ghost (volume: 80%)   ← Angry ghost
👻 Ghost spawned at (123.4, 56.7, -89.0)  ← New ghost
💀 Battle triggered by angry_ghost_3      ← Angry ghost fight
```

---

## 🎵 Audio Files Used

- **Ghost.ogg** (in `assets/sfx/`)
  - Ethereal wail sound
  - Used for both friendly and angry ghosts
  - Pitch/volume modified based on ghost type

---

## 🚀 Next Steps After Testing

If audio works great:
1. Implement Big Ghost Spectral Hunt (uses same audio system)
2. Add Zombie.ogg sounds to zombie enemies
3. Add more sound effects (sweet spot, throws, etc.)

If issues found:
1. Check console for errors
2. Verify Ghost.ogg file exists
3. Test with simple `soundEffects.play('ghost')` first
4. Debug distance calculations

---

**Have fun testing! The night is full of ghostly sounds now...** 👻🔊
