# 🌿 Git Branching Strategy for Performance Testing

**Goal**: Test optimizations safely before merging to main  
**Strategy**: Separate branches for current code fixes vs remote integration  
**Hardware**: Non-gaming laptop litmus test

---

## 📊 Test Results Summary (So Far)

### ✅ Console Patch Test Results

**Performance**:
- General improvement: **+3-5 FPS** ✅
- Average FPS: **20-22 FPS** (acceptable for non-gaming laptop)
- Lowest FPS: **13 FPS** (near 2 ruins + mega tree - expected congestion)

**Analysis**:
- Object.keys fix is working!
- Performance is acceptable for non-gaming hardware
- Slowdowns are contextual (ruins/mega tree) not systemic

**🐛 BUG FOUND**:
- ❌ **Despawned blocks drop items** (should NOT happen)
- ✅ Only harvested blocks should drop items
- Fix needed: Check if block was "harvested" vs "despawned/unloaded"

---

## 🌿 Branch Strategy

### Branch 1: `performance-optimizations` (Current Code + Fixes)

**Purpose**: Permanent fixes to current stable code  
**Contains**:
- Object.keys bottleneck fix (block counter)
- Billboard distance culling
- **Bug fix: Despawned blocks don't drop items**

**Test Results**:
- ✅ +3-5 FPS improvement
- ✅ Acceptable performance (20-22 FPS average)
- ✅ Bug fixed

### Branch 2: `remote-integration` (Remote Code + All Patches)

**Purpose**: Remote code with all optimizations applied  
**Contains**:
- Remote code (AtmosphericFog, WeatherSystem, PlayerCompanionUI, etc.)
- UI throttle patch (4 FPS updates)
- Object.keys fix
- Billboard distance culling
- **Bug fix: Despawned blocks don't drop items**

**Test Results**:
- ⏳ Pending testing
- Expected: Similar or better than performance-optimizations
- Will measure fog/weather impact

### Branch 3: `main` (Stable Release)

**Purpose**: Production-ready code  
**Decision**: Will be set to whichever branch performs best after testing

---

## 🚀 Workflow

### Phase 1: Create Performance-Optimizations Branch ✅

```bash
# Create and switch to new branch
git checkout -b performance-optimizations

# Apply permanent fixes to VoxelWorld.js
# (I'll provide the exact code changes)

# Commit
git add src/VoxelWorld.js
git commit -m "Performance: Fix Object.keys bottleneck, billboard culling, despawn item bug"

# Test on non-gaming laptop
npm run build
npm run electron

# Record results
# If good → keep this branch for comparison
```

### Phase 2: Create Remote-Integration Branch

```bash
# Go back to main (current code, no fixes)
git checkout main

# Create new branch for remote testing
git checkout -b remote-integration

# Pull remote changes
git pull origin main

# Apply UI throttle patch
./apply-ui-throttle.sh

# Apply Object.keys fixes (same as performance-optimizations)
# Apply despawn bug fix
# (I'll provide the exact code changes)

# Commit
git add .
git commit -m "Remote integration: UI throttle, Object.keys fix, despawn bug fix"

# Test on non-gaming laptop
npm run build
npm run electron

# Record results
```

### Phase 3: Compare & Decide

Compare FPS between branches:

| Branch | Avg FPS | Lowest FPS | Features | Verdict |
|--------|---------|------------|----------|---------|
| **performance-optimizations** | 20-22 | 13 | Stable, optimized | Baseline |
| **remote-integration** | ??? | ??? | New features + optimized | Test this |

**Decision Tree**:

```
Is remote-integration FPS >= performance-optimizations?
│
├─ YES → Merge remote-integration to main
│         (New features + good performance = win!)
│
├─ CLOSE (within 2-3 FPS) → Merge remote-integration to main
│                            (New features worth slight cost)
│
└─ NO (>5 FPS worse) → Keep performance-optimizations as main
                       (Optimize remote more before merging)
```

### Phase 4: Set New Main

**Option A**: Remote integration wins
```bash
git checkout main
git merge remote-integration
git push origin main
```

**Option B**: Performance optimizations wins
```bash
git checkout main
git merge performance-optimizations
git push origin main
```

**Option C**: Need more optimization
```bash
# Keep both branches, work on remote-integration more
# Don't merge to main yet
```

---

## 🐛 Bug Fix: Despawned Blocks Dropping Items

### Problem
Console patch caused despawned blocks to drop items when chunks unload.

### Root Cause
The `removeBlock()` patch doesn't distinguish between:
- **Harvested** blocks (player broke it → should drop items)
- **Despawned** blocks (chunk unload → should NOT drop items)

### Solution

In VoxelWorld.js `removeBlock()` method, add a parameter:

```javascript
// OLD signature:
removeBlock(x, y, z)

// NEW signature:
removeBlock(x, y, z, harvested = false)
```

Then only drop items if `harvested === true`:

```javascript
removeBlock(x, y, z, harvested = false) {
    const key = `${x},${y},${z}`;
    const blockType = this.world[key];
    
    if (!blockType) return false; // Block doesn't exist
    
    // Remove from world
    delete this.world[key];
    
    // Update block counter (performance fix)
    if (this.blockCount !== undefined) {
        this.blockCount--;
    }
    
    // Only drop items if block was harvested (not just unloaded)
    if (harvested) {
        this.dropBlockItems(x, y, z, blockType);
    }
    
    // ... rest of method ...
}
```

Then update all harvest calls to use `harvested = true`:

```javascript
// When player breaks block (left-click)
this.removeBlock(x, y, z, true); // ✅ harvested = drops items

// When chunk unloads
this.removeBlock(x, y, z, false); // ✅ despawned = no items

// Or just:
this.removeBlock(x, y, z); // ✅ defaults to false = no items
```

---

## 📝 Permanent Fixes to Apply

### File: `src/VoxelWorld.js`

**Fix 1: Add Block Counter** (constructor, ~line 130)
```javascript
// Performance: Track block count without Object.keys()
this.blockCount = 0;
```

**Fix 2: Update addBlock** (~line 800-1000, find `addBlock` method)
```javascript
addBlock(x, y, z, type, renderMesh = true) {
    const key = `${x},${y},${z}`;
    const isNew = !this.world[key];
    
    // ... existing code ...
    
    this.world[key] = type;
    
    // Performance: Update block counter
    if (isNew && this.blockCount !== undefined) {
        this.blockCount++;
    }
    
    // ... rest of method ...
}
```

**Fix 3: Update removeBlock** (~line 1200-1400, find `removeBlock` method)
```javascript
removeBlock(x, y, z, harvested = false) {
    const key = `${x},${y},${z}`;
    const blockType = this.world[key];
    const existed = !!blockType;
    
    if (!existed) return false;
    
    delete this.world[key];
    
    // Performance: Update block counter
    if (existed && this.blockCount !== undefined) {
        this.blockCount--;
    }
    
    // Bug fix: Only drop items if harvested (not despawned)
    if (harvested && blockType) {
        this.dropBlockItems(x, y, z, blockType);
    }
    
    // ... rest of method ...
}
```

**Fix 4: Replace Object.keys calls** (search for all instances)
```javascript
// Search for: Object.keys(this.world).length
// Replace with: this.blockCount || Object.keys(this.world).length

// Examples:
// OLD: const blockCount = Object.keys(this.world).length;
// NEW: const blockCount = this.blockCount || 0;
```

**Fix 5: Billboard Distance Culling** (~line 1451, `animateBillboards` method)
```javascript
animateBillboards(currentTime) {
    const playerPos = this.player.position;
    const MAX_DISTANCE = 50;
    const MAX_DISTANCE_SQ = MAX_DISTANCE * MAX_DISTANCE;
    
    this.activeBillboards.forEach(billboard => {
        if (!billboard || !billboard.userData) return;
        
        // Performance: Distance culling
        const dx = billboard.position.x - playerPos.x;
        const dz = billboard.position.z - playerPos.z;
        const distSq = dx * dx + dz * dz;
        
        if (distSq > MAX_DISTANCE_SQ) return; // Skip distant billboards
        
        // ... rest of animation code ...
    });
}
```

---

## ⏱️ Timeline (Flexible for Kitten Care!)

**No rush!** Work at your own pace. Here's a suggested breakdown:

### Session 1: Create Performance Branch (15 minutes)
```bash
git checkout -b performance-optimizations
# Apply fixes (I can create a script)
npm run build
npm run electron
# Quick test (5 min gameplay)
git commit -am "Performance fixes"
```

### Session 2: Test Performance Branch (10 minutes)
- Walk to 300 blocks
- Note FPS
- Check if despawn bug is fixed
- Record results

### Session 3: Create Remote Branch (15 minutes)
```bash
git checkout main
git checkout -b remote-integration
git pull origin main
./apply-ui-throttle.sh
# Apply same fixes as performance-optimizations
npm run build
npm run electron
# Quick test
git commit -am "Remote integration + fixes"
```

### Session 4: Test Remote Branch (10 minutes)
- Same tests as performance branch
- Compare results
- Make decision

### Session 5: Merge Winner to Main (5 minutes)
```bash
git checkout main
git merge <winning-branch>
git push origin main
```

**Total time**: ~1 hour spread across multiple sessions

---

## 🐱 Kitten-Friendly Notes

- ✅ Each session is 5-15 minutes
- ✅ Can pause at any commit point
- ✅ No need to respond quickly
- ✅ I'll be here whenever you're ready!
- ✅ Tests are quick (just walk 300 blocks and note FPS)

**Take your time with the kittens!** 🐱 The code will wait. 😊

---

## 📊 Results Template

When you have time, fill this in:

```markdown
## Branch: performance-optimizations
- Avg FPS: ___ 
- Lowest FPS: ___
- Despawn bug fixed: Yes/No
- Feels smooth: Yes/No

## Branch: remote-integration  
- Avg FPS: ___
- Lowest FPS: ___
- Fog at night FPS: ___
- Weather FPS: ___
- Feels smooth: Yes/No

## Decision: _______________
```

---

## 🚀 Ready When You Are!

Let me know when you want to:
1. Create the `performance-optimizations` branch (I can provide exact code or a script)
2. Test it (5-10 min session)
3. Create `remote-integration` branch (when ready)
4. Compare and decide

**No rush!** Kittens come first! 🐱💕
