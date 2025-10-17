# 🩸 Blood Moon System - Phase 1 Implementation Plan

**Date:** October 16, 2025  
**Status:** Ready to Implement  
**Priority:** HIGH - Core Gameplay Feature

---

## 📋 Overview

Transform The Long Nights from exploration sandbox into **7-day survival defense game** where players must prepare for increasingly difficult blood moon attacks each week.

### Core Concept:
- **Days 1-6:** Peaceful exploration, gathering, building
- **Night 7 (10pm-2am):** Blood moon spawns waves of enemies
- **Week progression:** Each week gets harder (more enemies, tougher types)
- **Player choice:** Fight enemies OR sleep through (enemies attack fortifications)
- **Victory:** Survive until dawn to start next week
- **Failure:** Enemies breach defenses → Game Over

---

## 🎮 Existing Systems We Can Use

### ✅ Already Implemented:
1. **Day/Night Cycle** - 20-minute real-time cycle (`this.dayNightCycle`)
   - `currentTime`: 0-24 hours
   - `currentDay`: Total days passed (currently used for farming)
   - `cycleDuration`: 1200 seconds (20 minutes)
   
2. **Billboard Entities** - Ghost/Angry Ghost system
   - `GhostSystem.js` - Friendly ghosts with floating animation
   - `AngryGhostSystem.js` - Hostile ghosts that trigger combat
   - Billboard sprites already face camera
   
3. **Combat System** - Battle Arena autobattler
   - `BattleArena.js` - 3D arena combat with circling animations
   - `CombatantSprite.js` - Animated sprite system
   - `entities.json` - Enemy stats (hp, attack, defense, speed)
   - Already loads enemy data from JSON
   
4. **Harvesting Damage System** - Block breaking mechanics
   - Damage accumulation system with visual feedback
   - Used for mining/chopping - can adapt for enemy attacks
   
5. **Companion System** - Auto-battle support
   - Companions can be "sent out" to fight
   - Already integrated with Battle Arena
   
6. **Player-Placed Block Tracking** - We know what player built
   - `this.modifiedBlocks` tracks all player changes
   - Can identify fortifications vs natural terrain

---

## 🗓️ Phase 1: Day/Week Tracking System

### Step 1.1: Add Week Counter to Day/Night Cycle

**File:** `src/VoxelWorld.js`  
**Location:** Lines 8312-8330 (where `dayNightCycle` is defined)

**Current code:**
```javascript
this.dayNightCycle = {
    currentTime: 12,
    cycleDuration: 1200,
    timeScale: 1.0,
    isActive: true,
    lastUpdate: Date.now(),
    directionalLight: directionalLight,
    ambientLight: ambientLight,
    currentDay: 0,
    lastDayTime: 12
};
```

**Add these properties:**
```javascript
this.dayNightCycle = {
    currentTime: 12,
    cycleDuration: 1200,
    timeScale: 1.0,
    isActive: true,
    lastUpdate: Date.now(),
    directionalLight: directionalLight,
    ambientLight: ambientLight,
    currentDay: 1, // Changed from 0 to 1 (Day 1 = start of Week 1)
    lastDayTime: 12,
    
    // 🩸 BLOOD MOON SYSTEM
    currentWeek: 1, // Start at Week 1
    dayOfWeek: 1, // Day 1-7 within current week
    bloodMoonActive: false, // Is blood moon currently happening?
    bloodMoonStartTime: 22, // 10pm
    bloodMoonEndTime: 26, // 2am (hour 26 = 2am next day)
    enemiesSpawnedThisBloodMoon: false, // Prevent duplicate spawns
    survivalMode: 'awake' // 'awake' or 'sleeping'
};
```

### Step 1.2: Update Day Counter Logic

**File:** `src/VoxelWorld.js`  
**Location:** Lines 9885-9901 (in `updateDayNightCycle` method)

**Replace current day counter with:**
```javascript
// Update time (cycleDuration seconds = 24 hours)
this.dayNightCycle.currentTime += (24 / this.dayNightCycle.cycleDuration) * deltaTime * this.dayNightCycle.timeScale;

if (this.dayNightCycle.currentTime >= 24) {
    this.dayNightCycle.currentTime -= 24;
    
    // 🩸 BLOOD MOON: Increment day and week
    this.dayNightCycle.currentDay++;
    this.dayNightCycle.dayOfWeek++;
    
    // Check if week ended (day 7 just passed)
    if (this.dayNightCycle.dayOfWeek > 7) {
        this.dayNightCycle.currentWeek++;
        this.dayNightCycle.dayOfWeek = 1;
        console.log(`🩸 Week ${this.dayNightCycle.currentWeek} begins!`);
    }
    
    console.log(`🌅 Day ${this.dayNightCycle.currentDay} (Week ${this.dayNightCycle.currentWeek}, Day ${this.dayNightCycle.dayOfWeek})`);
    
    // Reset blood moon flags for new day
    this.dayNightCycle.bloodMoonActive = false;
    this.dayNightCycle.enemiesSpawnedThisBloodMoon = false;
}
```

### Step 1.3: Blood Moon Detection Logic

**File:** `src/VoxelWorld.js`  
**Location:** After day counter logic (insert ~line 9900)

```javascript
// 🩸 BLOOD MOON: Check if we should trigger blood moon
if (this.dayNightCycle.dayOfWeek === 7) {
    const time = this.dayNightCycle.currentTime;
    
    // Blood moon period: 10pm (22:00) to 2am (26:00 / 2:00)
    const isBloodMoonTime = time >= this.dayNightCycle.bloodMoonStartTime && 
                            time < 24; // Only check before midnight wrap
    
    if (isBloodMoonTime && !this.dayNightCycle.bloodMoonActive) {
        // Start blood moon!
        this.dayNightCycle.bloodMoonActive = true;
        console.log(`🩸🌕 BLOOD MOON RISES! (Week ${this.dayNightCycle.currentWeek})`);
        
        // Change sky color to blood red
        this.scene.background = new THREE.Color(0x8B0000); // Dark red
        
        // Show blood moon notification
        this.updateStatus('🩸 BLOOD MOON RISES! Enemies approach...', 'danger');
        
        // Trigger enemy spawns (will implement in Step 2)
        this.spawnBloodMoonEnemies();
    }
}

// Handle blood moon continuation after midnight (22:00-2:00 spans midnight)
if (this.dayNightCycle.bloodMoonActive) {
    const time = this.dayNightCycle.currentTime;
    
    // End blood moon at 2am
    if (time >= 2 && time < this.dayNightCycle.bloodMoonStartTime) {
        this.dayNightCycle.bloodMoonActive = false;
        console.log('🌅 Blood moon has ended. You survived!');
        this.updateStatus('You survived the blood moon! +10 XP', 'success');
        
        // Restore normal sky (will update in next updateDayNightCycle call)
    }
}
```

---

## 🎨 Phase 2: HUD Blood Moon Indicator

### Step 2.1: Add Blood Moon Icon to Time Indicator

**File:** `src/VoxelWorld.js`  
**Location:** Lines 9967-10054 (in `updateTimeIndicator` method)

**Add blood moon check FIRST (before other time checks):**
```javascript
this.updateTimeIndicator = () => {
    if (!this.timeIndicator) return;

    const time = this.dayNightCycle.currentTime;
    let icon, color, title;
    let timePeriod;
    
    // 🩸 BLOOD MOON: Override all other indicators during blood moon
    if (this.dayNightCycle.bloodMoonActive) {
        icon = 'bloodmoon'; // Will use PNG icon
        color = '#8B0000'; // Dark red
        title = `🩸 BLOOD MOON - Week ${this.dayNightCycle.currentWeek} - SURVIVE!`;
        timePeriod = 'bloodmoon';
    }
    // 🩸 Day 7 indicator (before blood moon starts)
    else if (this.dayNightCycle.dayOfWeek === 7) {
        icon = 'warning'; // Material icon
        color = '#FF6B35'; // Orange-red
        title = `Day ${this.dayNightCycle.dayOfWeek}/7 - Blood moon tonight!`;
        timePeriod = 'warning';
    }
    // Normal time indicators (existing code)
    else if (time >= 6 && time < 8) {
        // Dawn - sunrise
        icon = 'wb_twilight';
        color = '#FF6B35';
        title = `Dawn (${Math.floor(time)}:${String(Math.floor((time % 1) * 60)).padStart(2, '0')})`;
        timePeriod = 'dawn';
    }
    // ... rest of existing time indicators ...
    
    // Apply icon and color
    const enhancedIcon = this.enhancedGraphics.getIcon(icon);
    // ... rest of existing icon code ...
};
```

### Step 2.2: Create Blood Moon PNG Icon

**Action Required:** User needs to create `assets/art/icons/bloodmoon.png`

**Recommended specs:**
- Size: 64x64 or 128x128 pixels
- Style: Red/crimson full moon with dripping blood effect
- Transparent background
- High contrast for visibility

**Fallback if PNG not created:** Use Material Icon `'warning'` with red color

### Step 2.3: Add Week/Day Display to HUD

**File:** `src/VoxelWorld.js`  
**Location:** Near time indicator creation (search for `this.timeIndicator`)

**Add text display next to time indicator:**
```javascript
// Create week/day display (shows "Week 1 - Day 3/7")
this.weekDayDisplay = document.createElement('div');
this.weekDayDisplay.style.cssText = `
    position: absolute;
    top: 70px;
    right: 20px;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    background: rgba(0,0,0,0.5);
    padding: 5px 10px;
    border-radius: 5px;
    pointer-events: none;
    z-index: 1000;
`;
this.container.appendChild(this.weekDayDisplay);

// Update method (call in updateDayNightCycle)
this.updateWeekDayDisplay = () => {
    if (!this.weekDayDisplay) return;
    
    const week = this.dayNightCycle.currentWeek;
    const day = this.dayNightCycle.dayOfWeek;
    
    let text = `Week ${week} - Day ${day}/7`;
    let color = 'white';
    
    // Color code day 7
    if (day === 7) {
        if (this.dayNightCycle.bloodMoonActive) {
            text = `🩸 BLOOD MOON 🩸`;
            color = '#FF0000';
        } else {
            text = `Week ${week} - Day ${day}/7 ⚠️`;
            color = '#FF6B35';
        }
    }
    
    this.weekDayDisplay.textContent = text;
    this.weekDayDisplay.style.color = color;
};
```

**Call `updateWeekDayDisplay()` in the main update loop (after `updateTimeIndicator()`).**

---

## 👻 Phase 3: Blood Moon Enemy Spawning

### Step 3.1: Create Blood Moon Enemy Spawn System

**File:** Create new `src/BloodMoonSystem.js`

```javascript
import * as THREE from 'three';

export class BloodMoonSystem {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.scene = voxelWorld.scene;
        this.camera = voxelWorld.camera;
        
        // Enemy tracking
        this.activeEnemies = []; // {mesh, target, speed, health, maxHealth, attack, entityId}
        this.enemyUpdateInterval = null;
        
        // Spawn config
        this.spawnDistance = 30; // Blocks away from player
        this.spawnHeight = 2; // Height above ground
    }
    
    /**
     * Spawn blood moon enemies based on current week
     */
    spawnEnemies(week) {
        // Calculate enemy count based on week (10 + 10 per week)
        const enemyCount = 10 + (week * 10);
        const maxEnemies = 100; // Cap at 100
        const finalCount = Math.min(enemyCount, maxEnemies);
        
        console.log(`🩸 Spawning ${finalCount} enemies for Week ${week}...`);
        
        // Determine enemy types for this week
        const enemyPool = this.getEnemyPoolForWeek(week);
        
        // Spawn enemies in circle around player
        const playerPos = this.camera.position;
        
        for (let i = 0; i < finalCount; i++) {
            // Random angle around player
            const angle = (Math.PI * 2 * i) / finalCount + Math.random() * 0.3;
            const distance = this.spawnDistance + Math.random() * 10;
            
            const x = playerPos.x + Math.cos(angle) * distance;
            const z = playerPos.z + Math.sin(angle) * distance;
            
            // Get ground height at spawn location
            const y = this.voxelWorld.getGroundHeight(x, z) + this.spawnHeight;
            
            // Pick random enemy type from pool
            const enemyType = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            
            // Spawn enemy
            this.spawnEnemy(enemyType, x, y, z);
        }
        
        // Start enemy update loop
        this.startEnemyUpdates();
    }
    
    /**
     * Get enemy types available for this week
     */
    getEnemyPoolForWeek(week) {
        if (week === 1) {
            // Week 1: Only zombie crawlers (slow)
            return ['zombie_crawler'];
        } else if (week <= 3) {
            // Week 2-3: Zombies + rats
            return ['zombie_crawler', 'zombie_crawler', 'rat'];
        } else if (week <= 5) {
            // Week 4-5: Add goblins
            return ['zombie_crawler', 'rat', 'goblin_grunt'];
        } else if (week <= 7) {
            // Week 6-7: Add skeletons
            return ['zombie_crawler', 'rat', 'goblin_grunt', 'skeleton_archer'];
        } else {
            // Week 8+: All enemy types + 5% chance for killer rabbit
            const pool = ['zombie_crawler', 'rat', 'goblin_grunt', 'skeleton_archer', 'troglodyte'];
            
            // 5% chance for Monty Python killer rabbit!
            if (Math.random() < 0.05) {
                pool.push('killer_rabbit');
            }
            
            return pool;
        }
    }
    
    /**
     * Spawn individual enemy
     */
    spawnEnemy(entityId, x, y, z) {
        // Load enemy data from entities.json
        const entityData = this.voxelWorld.enhancedGraphics.getEntityData(entityId);
        
        if (!entityData) {
            console.warn(`Enemy type "${entityId}" not found in entities.json`);
            return;
        }
        
        // Create billboard sprite (similar to GhostSystem)
        const spriteMaterial = new THREE.SpriteMaterial({
            map: this.voxelWorld.enhancedGraphics.getEntityTexture(entityId),
            transparent: true,
            opacity: 1.0
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 1.5, 1); // Size
        sprite.position.set(x, y, z);
        
        // Store enemy data
        sprite.userData = {
            type: 'bloodmoon_enemy',
            entityId: entityId,
            health: entityData.hp,
            maxHealth: entityData.hp,
            attack: entityData.attack,
            defense: entityData.defense,
            speed: entityData.speed * 0.1 // Convert to blocks/second
        };
        
        this.scene.add(sprite);
        this.activeEnemies.push(sprite);
        
        console.log(`Spawned ${entityData.name} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
    }
    
    /**
     * Start enemy movement/attack updates
     */
    startEnemyUpdates() {
        if (this.enemyUpdateInterval) return; // Already running
        
        this.enemyUpdateInterval = setInterval(() => {
            this.updateEnemies();
        }, 100); // Update every 100ms
    }
    
    /**
     * Update enemy positions and attacks
     */
    updateEnemies() {
        const playerPos = this.camera.position;
        
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];
            
            // Check if enemy is dead
            if (enemy.userData.health <= 0) {
                this.removeEnemy(i);
                continue;
            }
            
            // Move towards player
            const dx = playerPos.x - enemy.position.x;
            const dz = playerPos.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 2) {
                // Move towards player
                const speed = enemy.userData.speed * 0.1; // 0.1 = deltaTime approximation
                enemy.position.x += (dx / distance) * speed;
                enemy.position.z += (dz / distance) * speed;
                
                // Update Y to follow terrain
                enemy.position.y = this.voxelWorld.getGroundHeight(enemy.position.x, enemy.position.z) + this.spawnHeight;
            } else {
                // Attack range - check for player fortifications
                this.attemptAttack(enemy, playerPos);
            }
        }
        
        // Check if all enemies defeated
        if (this.activeEnemies.length === 0) {
            this.stopEnemyUpdates();
            this.voxelWorld.updateStatus('All blood moon enemies defeated! Bonus +50 XP', 'success');
        }
    }
    
    /**
     * Enemy attacks player or fortifications
     */
    attemptAttack(enemy, playerPos) {
        // Find nearest player-placed block
        const nearestBlock = this.findNearestPlayerBlock(enemy.position);
        
        if (nearestBlock) {
            // Attack block (use harvesting damage system)
            const blockKey = `${nearestBlock.x},${nearestBlock.y},${nearestBlock.z}`;
            const damagePerHit = enemy.userData.attack * 2; // Scale damage
            
            // TODO: Apply damage to block (integrate with harvesting system)
            // this.voxelWorld.damageBlock(nearestBlock.x, nearestBlock.y, nearestBlock.z, damagePerHit);
            
            console.log(`Enemy attacking block at (${nearestBlock.x}, ${nearestBlock.y}, ${nearestBlock.z})`);
        } else {
            // No fortifications - attack player directly
            // TODO: Implement player damage system
            console.log('Enemy attacking player!');
        }
    }
    
    /**
     * Find nearest player-placed block
     */
    findNearestPlayerBlock(position) {
        let nearest = null;
        let minDistance = 5; // Max search radius
        
        // Check modified blocks for player-placed blocks
        for (const [key, blockData] of this.voxelWorld.modifiedBlocks) {
            const [x, y, z] = key.split(',').map(Number);
            
            // Skip removed blocks
            if (blockData === null) continue;
            
            // Calculate distance
            const dx = x - position.x;
            const dy = y - position.y;
            const dz = z - position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = {x, y, z, type: blockData};
            }
        }
        
        return nearest;
    }
    
    /**
     * Remove enemy from scene
     */
    removeEnemy(index) {
        const enemy = this.activeEnemies[index];
        this.scene.remove(enemy);
        enemy.geometry?.dispose();
        enemy.material?.dispose();
        this.activeEnemies.splice(index, 1);
    }
    
    /**
     * Stop enemy updates
     */
    stopEnemyUpdates() {
        if (this.enemyUpdateInterval) {
            clearInterval(this.enemyUpdateInterval);
            this.enemyUpdateInterval = null;
        }
    }
    
    /**
     * Clean up all enemies (called when blood moon ends or player sleeps)
     */
    cleanup() {
        this.stopEnemyUpdates();
        
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            this.removeEnemy(i);
        }
        
        console.log('Blood moon enemies cleaned up');
    }
}
```

### Step 3.2: Integrate Blood Moon System into VoxelWorld

**File:** `src/VoxelWorld.js`

**Add import at top:**
```javascript
import { BloodMoonSystem } from './BloodMoonSystem.js';
```

**Initialize in constructor (after other systems):**
```javascript
// 🩸 Initialize Blood Moon System
this.bloodMoonSystem = new BloodMoonSystem(this);
```

**Add spawn method:**
```javascript
this.spawnBloodMoonEnemies = () => {
    if (this.dayNightCycle.enemiesSpawnedThisBloodMoon) return;
    
    this.dayNightCycle.enemiesSpawnedThisBloodMoon = true;
    this.bloodMoonSystem.spawnEnemies(this.dayNightCycle.currentWeek);
};
```

---

## 🌙 Phase 4: Sleep System (Optional but Recommended)

### Step 4.1: Add Bed Item

**Action:** Add bed to crafting system or place bed block type

**Bed functionality:**
- Player right-clicks bed during blood moon
- Shows dialog: "Sleep through blood moon? (Enemies will attack your fortifications)"
- If YES: Screen fades to black, fast-forward to dawn
- Enemies attack fortifications in background (simplified calculation)
- If fortifications destroyed → Game Over
- If survived → Wake up with success message

---

## 📊 Phase 5: Enemy Stats Configuration

### Step 5.1: Add Zombie Crawler to entities.json

**File:** `assets/art/entities/entities.json`

**Add zombie_crawler entry:**
```json
"zombie_crawler": {
  "name": "Zombie Crawler",
  "type": "enemy",
  "tier": 1,
  "hp": 15,
  "attack": 4,
  "defense": 10,
  "speed": 2,
  "abilities": ["Slow Movement", "Relentless"],
  "sprite_ready": "zombie_crawler_ready_pose_enhanced.png",
  "sprite_attack": "zombie_crawler_attack_pose_enhanced.png",
  "sprite_portrait": "zombie_crawler.png",
  "description": "Slow but relentless undead creature. Perfect for first blood moon.",
  "craftable": false
}
```

**Add killer_rabbit (Monty Python easter egg):**
```json
"killer_rabbit": {
  "name": "Killer Rabbit",
  "type": "enemy",
  "tier": 3,
  "hp": 50,
  "attack": 20,
  "defense": 15,
  "speed": 10,
  "abilities": ["Leap Attack", "Ferocious", "Death Incarnate"],
  "sprite_ready": "killer_rabbit_ready.png",
  "sprite_attack": "killer_rabbit_attack.png",
  "sprite_portrait": "killer_rabbit.png",
  "description": "Look at the bones! 5% spawn chance during blood moons.",
  "craftable": false
}
```

### Step 5.2: Simplify Enemy Stats from enemies.json

**Files:** `enemies.json` already has detailed stats - `entities.json` is the simplified version

**Make sure entities.json has these blood moon enemy types:**
- `zombie_crawler` (NEW - slow but tanky)
- `rat` (EXISTING - fast, low HP)
- `goblin_grunt` (EXISTING - balanced)
- `skeleton_archer` (needs to be added if missing)
- `troglodyte` (EXISTING - tough)
- `killer_rabbit` (NEW - rare, deadly)

---

## 🎯 Phase 6: Companion Auto-Battle Integration

### Step 6.1: Send Companion to Fight

**Current system:** Companions can enter Battle Arena

**New feature:** During blood moon, player can send companion to auto-fight enemies

**Implementation:**
- Add "Send companion to battle" button during blood moon
- Companion leaves player side, seeks nearest enemy
- Triggers Battle Arena combat automatically
- Companion returns when enemy defeated
- Companion can die (needs respawn mechanic or permanent death?)

**Integrate with existing `BattleArena.js` system**

---

## 💾 Phase 7: Save/Load Integration

### Step 7.1: Add Blood Moon Progress to Save Data

**File:** `src/SaveSystem.js`

**Add to save data:**
```javascript
// Blood moon progress
currentWeek: this.voxelWorld.dayNightCycle.currentWeek,
dayOfWeek: this.voxelWorld.dayNightCycle.dayOfWeek,
bloodMoonsCompleted: this.voxelWorld.dayNightCycle.currentWeek - 1
```

**Load on game start**

---

## 🚦 Implementation Order (Recommended)

### Week 1 (Core System):
1. ✅ **Day/Week tracking** - Add counters and logic (2 hours)
2. ✅ **HUD display** - Week/Day indicator (1 hour)
3. ✅ **Blood moon detection** - Trigger at 10pm on day 7 (1 hour)
4. ✅ **Blood moon sky color** - Red atmosphere (30 min)

**Milestone:** Blood moon triggers correctly, sky turns red, HUD shows week/day

### Week 2 (Enemy Spawning):
5. ✅ **BloodMoonSystem.js** - Create enemy spawn system (3 hours)
6. ✅ **Enemy movement** - Enemies move towards player (2 hours)
7. ✅ **Add zombie_crawler to entities.json** - Stats and sprites (1 hour)
8. ✅ **Test spawning** - Verify 10 enemies spawn Week 1 (1 hour)

**Milestone:** 10 zombie crawlers spawn and walk towards player

### Week 3 (Combat Integration):
9. ✅ **Enemy attacks blocks** - Use harvesting damage system (2 hours)
10. ✅ **Enemy attacks player** - Basic damage (if no fortifications) (1 hour)
11. ✅ **Companion auto-battle** - Send companion to fight (2 hours)
12. ✅ **Enemy progression** - More enemies each week (1 hour)

**Milestone:** Full combat loop working, enemies attack fortifications

### Week 4 (Polish):
13. ✅ **Sleep system** - Bed to skip blood moon (2 hours)
14. ✅ **Victory/defeat conditions** - Game over/success messages (1 hour)
15. ✅ **Save/load integration** - Persist week progress (1 hour)
16. ✅ **Blood moon icon PNG** - Create art asset (user task)
17. ✅ **Killer rabbit easter egg** - 5% spawn chance (30 min)

**Milestone:** Fully playable blood moon survival loop!

---

## 🎨 Assets Needed (User Action Required)

### PNG Icons:
1. **bloodmoon.png** - Red moon icon for HUD (64x64 or 128x128)

### Entity Sprites (if missing):
2. **zombie_crawler.png** - Main sprite
3. **zombie_crawler_ready_pose_enhanced.png** - Battle ready
4. **zombie_crawler_attack_pose_enhanced.png** - Attack animation
5. **killer_rabbit.png** - Monty Python rabbit (white rabbit with bloodshot eyes)
6. **killer_rabbit_ready.png** - Battle ready
7. **killer_rabbit_attack.png** - Attack animation

**Fallbacks:** Can use existing ghost sprites temporarily for testing

---

## ⚡ Quick Start Commands (After Implementation)

### Console Test Commands:
```javascript
// Jump to day 7 (blood moon day)
voxelWorld.dayNightCycle.dayOfWeek = 7;

// Jump to blood moon time (10pm)
voxelWorld.dayNightCycle.currentTime = 22;

// Manually trigger blood moon
voxelWorld.spawnBloodMoonEnemies();

// Skip to next week
voxelWorld.dayNightCycle.currentWeek++;
voxelWorld.dayNightCycle.dayOfWeek = 1;

// Test specific week difficulty (e.g., Week 5 = 60 enemies)
voxelWorld.bloodMoonSystem.spawnEnemies(5);
```

---

## 🔥 Key Design Decisions

### 1. Enemy Count Scaling
**Formula:** `10 + (week * 10)` capped at 100
- Week 1: 10 enemies
- Week 5: 60 enemies
- Week 10: 100 enemies (cap)

### 2. Blood Moon Duration
**4 hours game time** (10pm-2am) = ~3-4 minutes real time
- Long enough to be challenging
- Short enough not to be tedious

### 3. Enemy Types by Week
- **Week 1:** Only zombie crawlers (easy to learn)
- **Week 2-3:** Add rats (faster)
- **Week 4-5:** Add goblins (ranged)
- **Week 6-7:** Add skeletons (archers)
- **Week 8+:** All types + killer rabbit

### 4. Player Choice: Fight or Sleep
- **Fight:** Active gameplay, can win early, get bonus XP
- **Sleep:** Passive, enemies attack fortifications, risk game over
- Both are valid strategies!

---

## 🎮 Gameplay Loop Verification

**Week 1:**
- Day 1-6: Gather wood, stone, build simple house
- Night 7: 10 slow zombie crawlers spawn
- Player: Can fight with spear OR sleep in house
- Result: Survive → Week 2 begins

**Week 5:**
- Day 1-6: Reinforce walls, craft better weapons, send companion hunting
- Night 7: 60 enemies (zombies, rats, goblins) spawn
- Player: Needs stone walls + companion support
- Result: Intense battle, survive → Week 6 begins

**Week 10:**
- Day 1-6: End-game preparation, legendary gear from mountain dungeons
- Night 7: 100 enemies including killer rabbit
- Player: Epic defense with maxed fortifications
- Result: Ultimate challenge!

---

## ✅ Success Criteria

**Phase 1 Complete When:**
- ✅ Week/Day counter visible on HUD
- ✅ Day 7 shows blood moon warning
- ✅ 10pm on Day 7 triggers blood moon (red sky)
- ✅ 10 zombie crawlers spawn around player
- ✅ Enemies walk towards player position
- ✅ Enemies attack player-placed blocks
- ✅ 2am ends blood moon, clears enemies
- ✅ Week counter increments to Week 2

---

**Ready to implement! Start with Phase 1 (Day/Week tracking) and test each phase before moving to next.** 🚀
