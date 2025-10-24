# Render Optimization System - Design Document

**Date**: October 24, 2025  
**Status**: 📋 Design Phase - Clean Slate Implementation Plan  
**Goal**: Intelligent rendering that shows what players need to see, hides what they can't see

---

## 🎯 Core Principle

**Players MUST be able to:**
1. ✅ See the ground below them (even when flying/jumping)
2. ✅ See trees and structures above them (even when underground)
3. ✅ See caves and terrain around them (normal exploration)

**System MUST NOT:**
1. ❌ Render blocks deep underground when player is on surface
2. ❌ Render blocks high in sky when player is underground
3. ❌ Render blocks behind solid walls/cliffs that block view

---

## 🏗️ Two-Tier Optimization Strategy

### Tier 1: **Adaptive Visibility** (PRIMARY - Always Try First)
**Purpose**: Smart raycast-based detection of what's actually visible  
**Method**: Cast rays from camera to find surfaces player can see  
**Priority**: HIGHEST - This is the intelligent system

**How it works**:
1. Every 100-200ms, cast rays from the camera in all directions
2. Rays detect surfaces (ground, walls, ceilings, trees)
3. System determines Y-range of visible blocks based on ray hits
4. Only render blocks within this detected range

**Advantages**:
- ✅ Automatically sees ground when looking down
- ✅ Automatically sees trees when looking up  
- ✅ Adapts to caves, cliffs, overhangs
- ✅ Follows camera direction

### Tier 2: **Vertical Culling** (FALLBACK - Safety Net)
**Purpose**: Fixed-depth culling when adaptive system can't run  
**Method**: Simple player Y ± fixed depth  
**Priority**: BACKUP - Only used if adaptive fails

**How it works**:
1. If adaptive scan finds nothing (empty air, rare edge case)
2. Fall back to: `minY = playerY - 10, maxY = playerY + 10`
3. Ensures *something* always renders

**Advantages**:
- ✅ Dead simple, can't fail
- ✅ Guarantees reasonable performance
- ✅ Safety net for edge cases

---

## 📊 Profile System - User-Friendly Presets

### 🥔 Potato Mode (Low-End Hardware)
**Target**: Struggling systems, integrated graphics, old laptops

| Setting | Value | Why |
|---------|-------|-----|
| **Render Distance** | 0 chunks | Absolute minimum chunks loaded |
| **Adaptive Rays** | 16 rays | Fewer rays = less CPU overhead |
| **Scan Rate** | 5 Hz (200ms) | Less frequent updates |
| **Raycast Buffer** | 0 blocks | No safety margin for performance |
| **Fallback Depth** | 8 blocks | ±8 blocks if adaptive fails |

**Expected**: 2-3x FPS improvement on struggling hardware

---

### ⚙️ Balanced Mode (RECOMMENDED - Default)
**Target**: 90% of players, standard computers

| Setting | Value | Why |
|---------|-------|-----|
| **Render Distance** | 1 chunk | Sweet spot for quality/performance |
| **Adaptive Rays** | 24 rays | Good coverage without overhead |
| **Scan Rate** | 10 Hz (100ms) | Smooth updates |
| **Raycast Buffer** | 1 block | Small safety margin |
| **Fallback Depth** | 10 blocks | ±10 blocks if adaptive fails |

**Expected**: 40-60% FPS improvement with excellent visuals

---

### ✨ Gaming Mode (High-End Systems)
**Target**: Dedicated GPUs, enthusiast hardware

| Setting | Value | Why |
|---------|-------|-----|
| **Render Distance** | 2 chunks | Maximum interactive distance |
| **Adaptive Rays** | 32 rays | Maximum surface detection |
| **Scan Rate** | 12 Hz (83ms) | Near real-time updates |
| **Raycast Buffer** | 2 blocks | Extra safety margin |
| **Fallback Depth** | 12 blocks | ±12 blocks if adaptive fails |

**Expected**: 20-40% FPS improvement with maximum quality

---

### 🎨 Classic Mode (Debugging/Comparison)
**Target**: Developers, testers, nostalgia

| Setting | Value | Why |
|---------|-------|-----|
| **Render Distance** | 1 chunk | Original game setting |
| **Adaptive Visibility** | DISABLED | No optimization |
| **Vertical Culling** | DISABLED | No optimization |

**Expected**: Original performance (baseline for comparison)

---

## 🔄 System Flow - How It Works Together

```
┌─────────────────────────────────────────┐
│  Every Frame: Check What to Render      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  1. Try Adaptive Visibility              │
│     • Is it enabled? (Yes for all modes) │
│     • Cast rays from camera              │
│     • Detect visible surfaces            │
└─────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         │  Did it find any    │
         │  surfaces?          │
         └──────────┬──────────┘
                    │
        YES ────────┼──────── NO
         │                      │
         ↓                      ↓
┌────────────────────┐  ┌──────────────────┐
│ Use Adaptive Bounds│  │ Use Fallback     │
│ minY = detected    │  │ minY = playerY-10│
│ maxY = detected    │  │ maxY = playerY+10│
└────────────────────┘  └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
         ┌─────────────────────┐
         │ Render only blocks  │
         │ within Y range      │
         └─────────────────────┘
```

---

## 🎯 Critical Requirements

### Ground Visibility (HIGH PRIORITY)
**Scenario**: Player jumps high, flies, or spawns above ground

**Solution**:
```javascript
// Downward rays MUST detect ground
for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    
    // Cast downward at 45° angle
    const downwardDir = new Vector3(
        Math.cos(angle) * 0.3,  // Slight horizontal spread
        -0.8,                    // Mostly downward
        Math.sin(angle) * 0.3
    ).normalize();
    
    castRay(cameraPos, downwardDir, renderDistance);
}
```

**Result**: Ground always visible when looking down

---

### Tree/Structure Visibility (HIGH PRIORITY)
**Scenario**: Player underground or in cave looking up

**Solution**:
```javascript
// Upward rays MUST detect ceilings/trees
if (i % 4 === 0) {  // Every 4th ray
    const upwardDir = new Vector3(
        Math.cos(angle) * 0.2,  // Slight horizontal spread
        0.7,                     // Mostly upward
        Math.sin(angle) * 0.2
    ).normalize();
    
    castRay(cameraPos, upwardDir, renderDistance);
}
```

**Result**: Trees, structures, cave ceilings visible when looking up

---

### Cave Exploration (MEDIUM PRIORITY)
**Scenario**: Player in underground cave system

**Solution**:
```javascript
// Horizontal rays detect cave walls
const horizontalDir = new Vector3(
    Math.cos(angle),
    0,  // Perfectly horizontal
    Math.sin(angle)
);

castRay(cameraPos, horizontalDir, renderDistance);
```

**Result**: Cave walls visible in all directions

---

## 🐛 Past Issues & Solutions

### Issue 1: Ground Not Visible from Height
**Problem**: At Y=12, ground at Y=0 was culled  
**Cause**: Adaptive bounds clamped to `playerY - depth * 2`  
**Solution**: Remove artificial clamping, trust raycast detection

```javascript
// ❌ WRONG (old code):
minVisibleY = Math.max(minVisibleY, playerY - depth * 2);
// At Y=12: min clamped to -8, ground at Y=0 culled!

// ✅ CORRECT (new code):
minVisibleY = Math.max(0, minVisibleY);  // Only clamp to world floor
// At Y=12: raycasts detect Y=0, ground renders!
```

---

### Issue 2: Trees Cut Off Underground
**Problem**: When underground, trees above were culled  
**Cause**: Fallback depth too shallow (5-6 blocks)  
**Solution**: Increase fallback depth (8/10/12 blocks per profile)

```javascript
// ❌ WRONG (old code):
fallbackDepth = 5;  // Tree roots go deeper!

// ✅ CORRECT (new code):
fallbackDepth = 8;   // Potato mode
fallbackDepth = 10;  // Balanced mode
fallbackDepth = 12;  // Gaming mode
```

---

### Issue 3: Stress Benchmark Blocks Not Visible
**Problem**: Spawned blocks outside render distance  
**Cause**: Block spawn radius (8 chunks) > render distance (0 chunks on Potato)  
**Solution**: Spawn blocks closer (radius 4 blocks)

```javascript
// ❌ WRONG (old code):
const spawnRadius = 8;  // Too far for Potato mode!

// ✅ CORRECT (new code):
const spawnRadius = 4;  // Always within render distance
```

---

## 🎨 UI Design - Simplicity First

### Streamlined Interface
```
┌────────────────────────────────────────┐
│ 🎨 Graphics Preset                     │
├────────────────────────────────────────┤
│                                        │
│  [🥔 Potato] [⚙️ Balanced] [✨ Gaming]│
│                                        │
│  ⚙️ Balanced (Recommended)            │
│  Best performance/quality balance      │
│  Render: 1 chunk | Depth: 10 blocks   │
│                                        │
│  [🧪 Smart Benchmark - Test My System]│
│                                        │
│  ▶ Advanced Options                    │
│    └─ 🎨 Classic Mode (No Optimization)│
└────────────────────────────────────────┘
```

**Key Points**:
- Three big buttons (not dropdowns)
- Profile info updates live
- One benchmark button
- Classic mode hidden in Advanced

---

## 🧪 Testing Protocol

### Test 1: Ground Visibility
1. Start game at spawn (Y ≈ 5)
2. Jump high (Y ≈ 15)
3. Look straight down
4. **Expected**: Ground clearly visible

### Test 2: Tree Visibility from Underground
1. Dig down to Y = -5
2. Look straight up
3. **Expected**: See tree trunks, leaves, sky

### Test 3: Cave Walls
1. Enter cave system
2. Rotate 360°
3. **Expected**: All walls visible around you

### Test 4: Performance
1. Run stress benchmark (30s)
2. Compare FPS: Classic vs Balanced vs Gaming
3. **Expected**: 
   - Classic: Baseline FPS
   - Balanced: +40-60% FPS
   - Gaming: +20-40% FPS

### Test 5: Profile Persistence
1. Select Gaming mode
2. Reload page
3. **Expected**: Gaming mode still active

---

## 📐 Implementation Checklist

### Phase 1: Core Adaptive Visibility ✅
- [x] Create `ChunkRenderManager.js`
- [x] Implement raycast scanning (horizontal, downward, upward)
- [x] Calculate adaptive Y bounds from detected surfaces
- [x] Fallback to vertical culling if no surfaces found

### Phase 2: Profile System ✅
- [x] Create `RenderProfileManager.js`
- [x] Define 4 profiles (Potato/Balanced/Gaming/Classic)
- [x] Set render distances (0/1/2/1 chunks)
- [x] Set raycast parameters (16/24/32/0 rays)
- [x] Smart initialization (auto-apply Balanced)

### Phase 3: Benchmark System ✅
- [x] Create `PerformanceBenchmark.js`
- [x] Implement stress test with block spawning
- [x] Disable controls during benchmark
- [x] 360° camera rotation
- [x] FPS measurement and recommendation

### Phase 4: UI Integration ✅
- [x] Create `RenderOptimizationPanel.js`
- [x] Three-button preset selector
- [x] Profile info display
- [x] Smart benchmark button
- [x] Advanced options (collapsible)

### Phase 5: Bug Fixes (IN PROGRESS)
- [ ] Fix ground visibility from height
- [ ] Fix tree visibility from underground
- [ ] Ensure fog adapts to render distance
- [ ] Test all edge cases

---

## 🚀 Expected Outcomes

### Performance Targets
| Profile | Min FPS | Target FPS | Use Case |
|---------|---------|------------|----------|
| Potato | 15 FPS | 30+ FPS | Old laptops, tablets |
| Balanced | 20 FPS | 45+ FPS | Standard computers |
| Gaming | 30 FPS | 60+ FPS | Dedicated GPUs |

### Visual Quality
| Profile | Render Dist | Visibility | Quality |
|---------|-------------|------------|---------|
| Potato | 0 chunks | 8 blocks | Playable |
| Balanced | 1 chunk | 10 blocks | Excellent |
| Gaming | 2 chunks | 12 blocks | Maximum |

---

## 💡 Design Philosophy

### Always Prefer Intelligence Over Brute Force
- Use raycasts to detect *what's actually visible*
- Don't just cull based on fixed distances
- Adapt to player's current view

### Graceful Degradation
- If adaptive fails, fall back to simple culling
- Never leave player in broken state
- Always render *something*

### Player Experience First
- Ground must be visible (navigation)
- Trees must be visible (world feel)
- Caves must work (exploration)
- FPS must be smooth (playability)

---

## 📝 Next Steps (Clean Implementation)

1. **Review origin/main code** - What's already there?
2. **Identify what works** - Keep good systems
3. **Identify what's broken** - Fix core issues
4. **Test incrementally** - Don't break working features
5. **Document as we go** - Update this file with findings

---

**Remember**: The goal is **intelligent culling that helps FPS without hurting gameplay**.

Ground visibility, tree visibility, and cave exploration are NON-NEGOTIABLE requirements.
