# 👻 Ghost Systems - TODO & Design Notes

**Date**: October 21, 2025

## Current Ghost Systems Overview

### 1. 🎃 Halloween All-Day Big Ghost (NEW - IMPLEMENTED)
- **Trigger**: October 31st only
- **Distance**: 50 blocks from player
- **Size**: 120 blocks tall
- **Behavior**: Orbits player all day, uncatchable
- **Purpose**: Atmospheric Halloween feature
- **Status**: ✅ COMPLETE

### 2. 👻 Spectral Hunt Event (IMPLEMENTED)
- **Trigger**: Nightly at 9pm (Day × 10% chance, 100% on Halloween)
- **Big Ghost**: 400 blocks away, 10-40 blocks tall (scales with day)
- **Colored Ghosts**: 1-7 spawn in waves, must hunt them
- **Duration**: 9pm - 2am
- **Purpose**: Timed hunting challenge with rewards
- **Status**: ✅ COMPLETE

### 3. 💀 Demolition Ghost (IMPLEMENTED)
- **Trigger**: 7th Blood Moon + Spectral Hunt combo
- **Behavior**: Throws TNT charges at player
- **HP**: 10 hits to kill
- **Purpose**: Mini-boss encounter
- **Status**: ✅ COMPLETE

### 4. 🌟 MEGA WORLD BOSS GHOST (TODO - NOT IMPLEMENTED YET)
- **Trigger**: Player crafts Ghost Rod after 4 Blood Moons with Spectral Hunt events
- **Requires**: Spectral essence from hunts → craft Ghost Rod → summon boss
- **Status**: ⚠️ DESIGN PHASE

---

## 🔧 TODO: Mega World Boss Ghost Design

### Problem Identified:
Currently, the 400-block distance big ghost in Spectral Hunt is NOT the mega world boss. Need to:

1. **Keep Spectral Hunt ghost at 400 blocks** (current implementation is correct)
2. **Create NEW mega world boss ghost system** for summoned boss fight

### Design Options:

#### Option A: Reuse Big Ghost Code
- Use existing BigGhostEntity class
- Make it **closer** (maybe 100-150 blocks?)
- Add attack patterns and HP system
- Make it **catchable/fightable** (unlike spectral hunt version)

#### Option B: New Boss Ghost Class
- Create `MegaGhostBoss.js` extending BigGhostEntity
- Custom animations and attack patterns
- Multi-phase boss fight
- Destructible/interactive

### Requirements for Mega Boss:
- [ ] Craft system: 4× Spectral Essence → Ghost Rod
- [ ] Summoning mechanic (use Ghost Rod to spawn boss)
- [ ] Boss HP system (maybe 100+ HP)
- [ ] Attack patterns (projectiles, area effects?)
- [ ] Phase transitions (visual changes as HP drops)
- [ ] Epic loot drops on defeat
- [ ] Closer distance than spectral hunt (100-200 blocks?)
- [ ] Larger size for epic feel (80-150 blocks?)
- [ ] Different texture/appearance (glowing? particle effects?)

### File Structure:
```
src/
  ├── SpectralHuntSystem.js        [✅ Keep as-is - 400 block distant ghost]
  ├── BigGhostEntity.js             [✅ Current - orbital ghost entity]
  ├── MegaGhostBoss.js              [❌ TODO - New boss fight system]
  └── GhostRodItem.js               [❌ TODO - Summoning item]
```

---

## 📊 Ghost Distance Comparison

| Ghost Type | Distance | Size | Purpose |
|------------|----------|------|---------|
| Halloween Special | 50 blocks | 120 | Atmospheric horror |
| Spectral Hunt | 400 blocks | 10-40 | Distant world boss presence |
| Mega Boss (TODO) | 100-150 blocks? | 80-150? | Epic summoned boss fight |
| Demolition Ghost | Follows player | 3.0 | Mini-boss |

---

## 🎯 Next Steps

1. **Design mega boss mechanics**
   - Attack patterns
   - HP scaling
   - Loot table
   - Visual effects

2. **Implement Ghost Rod crafting**
   - Recipe: 4× Spectral Essence + materials?
   - Add to crafting benches
   - Add item sprite/icon

3. **Create MegaGhostBoss class**
   - Extend or modify BigGhostEntity
   - Add combat logic
   - Add phase system

4. **Test balance**
   - Is boss too easy/hard?
   - Are rewards worth the effort?
   - Does distance/size feel right?

---

## 💡 Design Notes

- **Spectral Hunt ghost should stay at 400 blocks** - it's meant to be unreachable
- **Mega boss ghost should be closer** - needs to feel like an actual fight
- **Consider using particle effects** to differentiate mega boss visually
- **Maybe add music change** when mega boss is summoned?
- **Arena mechanics?** - Does boss create a battle arena? Or free-roam fight?

---

**Status**: Documentation complete - ready for implementation when you tackle the mega boss system! 👻
