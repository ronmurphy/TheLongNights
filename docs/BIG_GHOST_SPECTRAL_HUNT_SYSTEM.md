# 👻 Big Ghost Spectral Hunt System - Complete Design Document

## 🌙 System Overview

The **Big Ghost Spectral Hunt** is a procedural nightly event that scales with game progression. A massive ghostly entity appears in the background (9pm-2am), summoning colored ghost minions that players must hunt down for rewards.

### Core Concept
- **Probability**: Day × 10% chance (Day 1 = 10%, Day 7 = 70%)
- **Active Time**: 9pm (21:00) to 2am (02:00)
- **Hunt Targets**: Day-specific colored ghosts (1-7 ghosts)
- **Reward**: Loot upon killing all colored ghosts before 2am
- **Failure State**: Ghosts despawn at 2am (no harm to player)

---

## 🎨 Visual Design

### Big Ghost (Background Entity)

#### Appearance
```javascript
// Day 1-6: Translucent white/gray ghost
Size: 10-30 blocks (scales with day)
Opacity: 30-50% (semi-transparent)
Animation: Slow floating/bobbing motion
Position: 300-500 block radius from player

// Day 7: BLACK GHOST (against red night sky)
Size: 40 blocks (MASSIVE)
Opacity: 60% (more visible)
Color: Pure black (#000000) with red outline glow
Visual Impact: Stark contrast against red atmosphere

// Halloween Night (Oct 31): MEGA GHOST
Size: 60 blocks (COLOSSAL)
Opacity: 80% (very visible)
Special Effects: Purple particle aura, lightning flashes
```

#### Implementation Details
```javascript
// Simple Billboard System (NO AI logic needed)
- Rotating animated billboard (4-8 frames)
- Orbits player at fixed radius (400 blocks)
- Rotation speed: 0.1 rad/s (slow menacing circle)
- Always faces camera (standard billboard)
- Particle effects: Wisps flowing from ghost toward player
```

#### Technical Specs
```javascript
Material: THREE.MeshBasicMaterial({
    map: ghostTexture,
    transparent: true,
    opacity: 0.3-0.8 (varies by day),
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending // For glow effect
})

Geometry: THREE.PlaneGeometry(size, size)

Position Update (per frame):
- angle += rotationSpeed * deltaTime
- x = playerX + Math.cos(angle) * radius
- z = playerZ + Math.sin(angle) * radius
- y = playerY + 50 (hover above player)
```

### Colored Ghost Minions

#### Color Scheme (ROYGBIV + Black)
```javascript
Day 1: 🔴 Red      (#FF0000)
Day 2: 🟠 Orange   (#FF8800)
Day 3: 🟡 Yellow   (#FFFF00)
Day 4: 🟢 Green    (#00FF00)
Day 5: 🔵 Blue     (#0088FF)
Day 6: 🟣 Indigo   (#4400FF)
Day 7: ⚫ BLACK    (#000000) - Hardest to see against red night!
```

#### Visual Properties
```javascript
Size: 2 blocks (same as normal ghost)
Opacity: 80% (more visible than big ghost)
Color Tint: Applied to material.color
Particle Trail: Colored particles (matches ghost color)
Glow Effect: Slight emissive glow (easier to spot)

// Black Ghost (Day 7) Special Effects
Outline: Red glow outline (visible against red sky)
Particles: Red/purple mix (contrast against black)
Sound: Deeper, more ominous audio cue
```

---

## 🎮 Gameplay Mechanics

### Event Trigger System

#### Probability Check
```javascript
// Called at 9pm (21:00) each night
checkForSpectralHunt() {
    const currentDay = this.getDayNumber(); // 1-7+ (cycles)
    const chance = Math.min(currentDay * 0.1, 0.9); // Cap at 90%
    
    // Halloween bonus (Oct 31)
    const isHalloween = this.isHalloweenNight();
    if (isHalloween) {
        chance = 1.0; // 100% chance on Halloween!
    }
    
    if (Math.random() < chance) {
        this.startSpectralHunt(currentDay);
    }
}
```

#### Day Tracking
```javascript
// Track days since world creation
currentDay = Math.floor(totalGameTime / 24) % 7 + 1; // Cycles 1-7

// OR track total days elapsed
currentDay = totalDaysElapsed % 7 + 1;

// Halloween overrides
if (month === 10 && day === 31) {
    currentDay = 7; // Always spawn max ghosts on Halloween
    isMegaGhost = true; // Bigger ghost
}
```

### Ghost Spawning Logic

#### Spawn Waves
```javascript
// Don't spawn all ghosts at once - create tension!
startSpectralHunt(day) {
    this.totalGhostsToSpawn = Math.min(day, 7);
    this.ghostsKilled = 0;
    this.spawnedGhosts = [];
    
    // Spawn big ghost immediately
    this.spawnBigGhost(day);
    
    // Spawn colored ghosts in waves
    this.scheduleGhostWaves();
}

scheduleGhostWaves() {
    const spawnInterval = 45; // 45 seconds between spawns
    
    for (let i = 0; i < this.totalGhostsToSpawn; i++) {
        setTimeout(() => {
            this.spawnColoredGhost(i);
        }, i * spawnInterval * 1000);
    }
}
```

#### Spawn Positions
```javascript
spawnColoredGhost(index) {
    // Spawn just outside render distance
    const angle = (Math.PI * 2 / this.totalGhostsToSpawn) * index;
    const distance = this.voxelWorld.renderDistance * 16 + 20; // Just beyond render
    
    const spawnX = playerX + Math.cos(angle) * distance;
    const spawnZ = playerZ + Math.sin(angle) * distance;
    const spawnY = this.getGroundHeight(spawnX, spawnZ) + 2;
    
    const color = this.getGhostColor(index);
    const ghost = this.createColoredGhost(spawnX, spawnY, spawnZ, color);
    
    this.spawnedGhosts.push(ghost);
}
```

#### Ghost Movement
```javascript
// Colored ghosts move toward player (like normal ghosts)
updateColoredGhost(ghost, deltaTime) {
    const direction = {
        x: playerX - ghost.position.x,
        y: 0, // Stay at ground level
        z: playerZ - ghost.position.z
    };
    
    const distance = Math.sqrt(direction.x ** 2 + direction.z ** 2);
    const normalizedDir = {
        x: direction.x / distance,
        z: direction.z / distance
    };
    
    // Move at slow speed (0.5 blocks/sec)
    ghost.position.x += normalizedDir.x * 0.5 * deltaTime;
    ghost.position.z += normalizedDir.z * 0.5 * deltaTime;
    
    // Keep at ground height
    ghost.position.y = this.getGroundHeight(ghost.position.x, ghost.position.z) + 2;
}
```

### Hit Detection & Combat

#### Hitbox System
```javascript
// Colored ghosts have collision (normal ghosts don't)
createColoredGhost(x, y, z, color) {
    // Visual billboard
    const billboard = this.createGhostBillboard(color);
    billboard.position.set(x, y, z);
    
    // Collision hitbox (invisible sphere)
    const hitboxGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
        visible: false // Invisible hitbox
    });
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.copy(billboard.position);
    
    billboard.userData.hitbox = hitbox;
    billboard.userData.isColoredGhost = true;
    billboard.userData.color = color;
    
    this.voxelWorld.scene.add(billboard);
    this.voxelWorld.scene.add(hitbox);
    
    return billboard;
}
```

#### Damage Detection
```javascript
// Hook into existing weapon systems
checkGhostHit(weaponPosition, weaponType) {
    for (const ghost of this.spawnedGhosts) {
        if (ghost.userData.isDead) continue;
        
        const distance = ghost.position.distanceTo(weaponPosition);
        
        // Check if weapon hit ghost hitbox
        if (distance < 2.0) {
            this.onGhostHit(ghost, weaponType);
            return true;
        }
    }
    return false;
}

onGhostHit(ghost, weaponType) {
    // Particle burst (color matches ghost)
    this.createHitParticles(ghost.position, ghost.userData.color);
    
    // Sound effect
    this.voxelWorld.soundEffects?.play('ghost_hit');
    
    // Remove ghost
    this.voxelWorld.scene.remove(ghost);
    this.voxelWorld.scene.remove(ghost.userData.hitbox);
    ghost.userData.isDead = true;
    
    // Track kills
    this.ghostsKilled++;
    
    // Small immediate reward
    this.giveSmallReward();
    
    // Check for victory
    if (this.ghostsKilled >= this.totalGhostsToSpawn) {
        this.onHuntComplete();
    }
    
    console.log(`👻 Colored ghost killed! (${this.ghostsKilled}/${this.totalGhostsToSpawn})`);
}
```

#### Compatible Weapons
```javascript
// Any weapon can hit colored ghosts
- Pickaxe (melee)
- Stone Spear (thrown or melee)
- Demolition Charge (explosion radius)
- Fists (low damage but works)
- Future weapons (sword, bow, etc.)
```

### Time Limit & Victory

#### Time Tracking
```javascript
update(deltaTime) {
    if (!this.isActive) return;
    
    const currentTime = this.voxelWorld.timeSystem.getCurrentTime();
    
    // Check if 2am (end of hunt window)
    if (currentTime >= 2.0 && currentTime < 3.0) {
        if (this.ghostsKilled < this.totalGhostsToSpawn) {
            this.onHuntFailed();
        }
    }
    
    // Update big ghost position
    this.updateBigGhost(deltaTime);
    
    // Update colored ghosts
    for (const ghost of this.spawnedGhosts) {
        if (!ghost.userData.isDead) {
            this.updateColoredGhost(ghost, deltaTime);
        }
    }
}
```

#### Victory State
```javascript
onHuntComplete() {
    console.log('🎉 SPECTRAL HUNT COMPLETE!');
    
    // Calculate rewards based on day
    const rewards = this.calculateRewards(this.totalGhostsToSpawn);
    
    // Give rewards
    this.giveRewards(rewards);
    
    // Victory effects
    this.createVictoryEffect();
    
    // Despawn big ghost (dramatic fadeout)
    this.despawnBigGhost();
    
    // Remove any remaining ghosts
    this.cleanup();
    
    // Show status message
    this.voxelWorld.updateStatus('✨ SPECTRAL HUNT COMPLETE! Rewards claimed!', 'discovery');
    
    this.isActive = false;
}
```

#### Failure State (2am timeout)
```javascript
onHuntFailed() {
    console.log('⏰ SPECTRAL HUNT FAILED - Time ran out');
    
    // No damage to player
    // Ghosts simply despawn
    this.despawnBigGhost();
    this.cleanup();
    
    // Show status message
    this.voxelWorld.updateStatus('👻 The spectral hunt has ended...', 'warning');
    
    this.isActive = false;
}
```

---

## 🎁 Reward System

### Reward Scaling
```javascript
calculateRewards(day) {
    const baseRewards = {
        wheat: 5 * day,
        berry: 3 * day,
        carrot: 2 * day
    };
    
    // Bonus rewards for higher days
    if (day >= 3) {
        baseRewards.honey = 1;
    }
    
    if (day >= 5) {
        baseRewards.rare_item = 'blueprint_fragment';
    }
    
    if (day === 7) {
        baseRewards.legendary_item = 'spectral_essence'; // New crafting material
        baseRewards.wheat = 50;
        baseRewards.berry = 30;
    }
    
    return baseRewards;
}
```

### Reward Table

| Day | Ghosts | Basic Rewards | Special Rewards |
|-----|--------|---------------|-----------------|
| 1   | 1 🔴   | 5 wheat, 3 berry | - |
| 2   | 2 🟠   | 10 wheat, 6 berry | - |
| 3   | 3 🟡   | 15 wheat, 9 berry, 6 carrot | 1 honey |
| 4   | 4 🟢   | 20 wheat, 12 berry, 8 carrot | 1 honey, 1 mushroom |
| 5   | 5 🔵   | 25 wheat, 15 berry, 10 carrot | 1 Spectral Essence |
| 6   | 6 🟣   | 30 wheat, 18 berry, 12 carrot | 1 Spectral Essence |
| 7   | 7 ⚫   | **50 wheat, 30 berry, 20 carrot** | **2 Spectral Essence** |

### Spectral Essence System

**Spectral Essence** is a rare material that enhances crafted tools and weapons.

#### How It Works
When crafting at the **ToolBench**, players have TWO options:

```
Normal Craft:     2 stone + 1 stick → Stone Pickaxe
Enhanced Craft:   2 stone + 1 stick + 1 Spectral Essence → ✨ Enhanced Stone Pickaxe
```

#### Enhanced Tool Stats
```javascript
Enhanced Tools have:
- +20% damage (combat and harvesting)
- +15% harvest speed (faster gathering)
- Purple/blue particle glow effect
- Slight visual color tint (ethereal look)
```

#### UI Design
```
┌──────────────────────────────────────────┐
│  Stone Pickaxe                           │
│  ⛏️ Requires: 2 stone, 1 stick          │
│                                          │
│  [  Craft Normal  ]  [ ✨ Enhance! ]    │
│                       (1 Spectral Essence)│
│                                          │
│  Enhanced: +20% dmg, +15% speed, ✨ glow│
└──────────────────────────────────────────┘
```

#### Obtainability
- Day 5 Hunt: 1 Spectral Essence
- Day 6 Hunt: 1 Spectral Essence
- Day 7 Hunt: 2 Spectral Essence
- Halloween: 4 Spectral Essence (double rewards)

#### Strategic Value
- **Rare but renewable** - Get more by completing hunts
- **Meaningful choice** - Use on pickaxe? Sword? Axe?
- **Visible power** - Enhanced tools look and feel better
- **No punishment** - Can always craft normal version
- **Progression system** - Collect essences over multiple nights

### Small Rewards (Per Ghost Kill)
```javascript
giveSmallReward() {
    // Small drop on each ghost kill
    const drops = ['wheat', 'berry', 'carrot'];
    const randomDrop = drops[Math.floor(Math.random() * drops.length)];
    
    this.voxelWorld.inventory.addToInventory(randomDrop, 1);
    this.voxelWorld.updateStatus(`+1 ${randomDrop}`, 'discovery');
}
```

---

## 🩸 Bloodmoon Interaction

### Combined Event (Ultimate Challenge)
```javascript
// Check if bloodmoon is active during spectral hunt
checkBloodmoonOverlap() {
    if (this.voxelWorld.bloodMoonSystem?.isBloodMoonActive && this.isActive) {
        return true; // CHAOS MODE!
    }
    return false;
}

// Adjust difficulty for bloodmoon combo
if (checkBloodmoonOverlap()) {
    // Spawn extra colored ghost
    this.totalGhostsToSpawn += 1;
    
    // Faster spawn rate (30s instead of 45s)
    this.spawnInterval = 30;
    
    // Double rewards on success
    this.rewardMultiplier = 2.0;
    
    console.log('🌕👻 BLOODMOON + SPECTRAL HUNT ACTIVE! Ultimate challenge!');
}
```

### Gameplay Impact
```javascript
Bloodmoon Only:
- Zombies attack base (defensive)
- Player stays near campfire

Spectral Hunt Only:
- Hunt ghosts across map (offensive)
- Player explores world

BOTH TOGETHER:
- Must choose: Defend base OR hunt ghosts
- Can't do both effectively
- Risk/reward decision
- Ultimate endgame challenge
```

---

## 🎃 Halloween Special Event

### October 31st Bonuses
```javascript
checkHalloweenEvent() {
    const date = new Date();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();
    
    if (month === 9 && day === 31) { // October 31
        return {
            isMegaGhost: true,
            guaranteedSpawn: true,
            bonusGhosts: 3, // Spawn extra ghosts (up to 10 total)
            doubleRewards: true,
            specialEffects: true
        };
    }
    return null;
}

// Halloween modifications
if (halloween) {
    // MEGA GHOST
    bigGhostSize = 60; // Massive
    bigGhostOpacity = 0.8; // Very visible
    
    // More ghosts
    this.totalGhostsToSpawn = 10; // Instead of 7
    
    // Spawn rate faster
    this.spawnInterval = 30;
    
    // Special effects
    this.addLightningFlashes();
    this.addPurpleAura();
    
    // Double all rewards
    this.rewardMultiplier = 2.0;
    
    console.log('🎃 HALLOWEEN MEGA SPECTRAL HUNT ACTIVE!');
}
```

---

## 🔊 Audio Design

### Sound Effects Available
```javascript
// Already in /assets/sfx/
'Ghost.ogg'   - Ethereal wail (for ghosts)
'Zombie.ogg'  - Deep growl (for zombies)
'CatMeow.ogg' - Meow sound (for cats)
```

### Spatial Audio System
Using **Howler.js** with spatial audio support:

```javascript
// Play ghost sound near entity (distance falloff)
soundEffects.playSpatial(
    'ghost',              // Sound ID
    ghostPosition,        // Entity position {x, y, z}
    playerPosition,       // Player position {x, y, z}
    {
        maxDistance: 50,  // Audible up to 50 blocks
        pitchVariation: 0.15  // ±15% random pitch
    }
);
```

### Sound Triggers

#### Big Ghost Ambient
```javascript
// Low rumbling sound when big ghost is present
// Volume increases as ghost orbits closer
playSpatial('ghost', bigGhostPos, playerPos, {
    maxDistance: 100,
    volume: 0.3,  // Quiet ambient
    pitchVariation: 0.05  // Minimal variation
});

// Play every 15-30 seconds (not constant)
```

#### Colored Ghost Sounds
```javascript
// When colored ghost spawns
playSpatial('ghost', ghostPos, playerPos, {
    maxDistance: 60,
    pitchVariation: 0.2
});

// Occasional sounds when close (within 20 blocks)
// Play every 5-10 seconds if player nearby
```

#### Hit Sound
```javascript
// When ghost is hit (not spatial, plays at full volume)
soundEffects.play('ghost_hit', { 
    volume: 0.8,
    rate: 1.2  // Slightly higher pitch
});
```

### Sound Timing Strategy
```javascript
// Prevent sound spam
lastGhostSound = 0;
soundCooldown = 8000; // 8 seconds

update(deltaTime) {
    const now = Date.now();
    
    // Only play if cooldown expired AND ghost within range
    if (now - lastGhostSound > soundCooldown) {
        const distance = ghost.position.distanceTo(playerPos);
        
        if (distance < 30) {  // Within 30 blocks
            soundEffects.playSpatial('ghost', ghost.position, playerPos);
            lastGhostSound = now;
        }
    }
}
```

### Ambient Loop
```javascript
// Big ghost creates atmospheric tension
// Volume fades based on distance
updateBigGhostAmbient() {
    const distance = bigGhost.position.distanceTo(playerPos);
    const volume = Math.max(0, 1 - distance / 100) * 0.2;
    
    // Play ambient loop (if not already playing)
    if (!this.bigGhostAmbientPlaying) {
        this.bigGhostAmbientId = soundEffects.play('ghost', {
            volume: volume,
            rate: 0.7,  // Lower pitch for ominous feel
            loop: true  // Continuous ambient
        });
        this.bigGhostAmbientPlaying = true;
    } else {
        // Update volume based on distance
        soundEffects.sounds.get('ghost').howl.volume(volume);
    }
}
```

### Audio Polish
- **Distance falloff**: Linear dropoff from max volume to 0
- **Pitch variation**: 10-20% random variation prevents repetition
- **Cooldowns**: 5-10 second delays prevent audio spam
- **Max distance**: 50 blocks for colored ghosts, 100 for big ghost
- **Volume levels**: Ghosts 60-80% volume, ambient 20-30%

---

## 🎨 Particle Effects

### Big Ghost Particles
```javascript
// Wisps flowing from ghost to player
createBigGhostParticles() {
    const particles = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({
            color: 0x88FFFF,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        })
    );
    
    // Animate particles flowing toward player
    // Update positions each frame
}
```

### Colored Ghost Trail
```javascript
// Leave colored particle trail as ghost moves
createGhostTrail(ghost, color) {
    // Spawn particles behind ghost
    // Particles fade out over time
    // Color matches ghost color
}
```

### Hit Explosion
```javascript
createHitParticles(position, color) {
    // Burst of 20-30 particles
    // Radial explosion pattern
    // Particles fly outward then fade
    // Color matches ghost color
    
    // Special effect for black ghost (Day 7)
    if (color === 0x000000) {
        // Red/purple particle mix
        // More dramatic explosion
    }
}
```

### Victory Effect
```javascript
createVictoryEffect() {
    // All remaining colored particles burst
    // Rainbow cascade effect
    // Big ghost fades with particle trail
    // Screen flash (subtle)
}
```

---

## 📊 Technical Implementation

### File Structure
```javascript
src/
  SpectralHuntSystem.js      // Main system controller
  BigGhostEntity.js           // Big ghost billboard logic
  ColoredGhostEntity.js       // Colored ghost entities
  SpectralRewards.js          // Reward calculation/distribution
```

### Integration Points

#### VoxelWorld.js
```javascript
// Import
import { SpectralHuntSystem } from './SpectralHuntSystem.js';

// Initialize
this.spectralHuntSystem = new SpectralHuntSystem(this);

// Update loop
if (this.spectralHuntSystem) {
    this.spectralHuntSystem.update(deltaTime);
}

// Time check (at 9pm)
if (timeOfDay === 21 && !this.spectralHuntCheckedToday) {
    this.spectralHuntSystem.checkForSpectralHunt();
    this.spectralHuntCheckedToday = true;
}

// Reset daily flag
if (timeOfDay === 8) {
    this.spectralHuntCheckedToday = false;
}
```

#### Weapon Systems Integration
```javascript
// In weapon hit detection (pickaxe, spear, etc.)
onWeaponHit(hitPosition, weaponType) {
    // Check spectral hunt ghosts first
    if (this.voxelWorld.spectralHuntSystem?.isActive) {
        const hitGhost = this.voxelWorld.spectralHuntSystem.checkGhostHit(
            hitPosition,
            weaponType
        );
        if (hitGhost) return; // Hit a ghost, don't continue
    }
    
    // Normal hit detection continues...
}
```

#### Time System Integration
```javascript
// TimeSystem needs to expose current time
getCurrentTime() {
    return this.currentTime; // 0-24 hours
}

// Check for night time
isNightTime() {
    return this.currentTime >= 21 || this.currentTime <= 5;
}
```

### Performance Considerations
```javascript
Optimizations:
1. Big ghost: Single billboard (minimal performance impact)
2. Colored ghosts: Max 7-10 entities (10 on Halloween)
3. Particles: Use object pooling for reuse
4. Hit detection: Only check when weapon is swung
5. Update rate: Reduce to 30 FPS for ghost movement
6. Despawn: Clean up all entities at 2am
```

---

## 🎯 Player Experience Flow

### First Time (Day 1, 10% chance)
```
9:00pm → Roll 10% chance → SUCCESS!
9:01pm → Big ghost appears in distance (player confused)
9:05pm → Red ghost spawns, floats toward player
Player: "What is this?!"
Player: *hits red ghost with pickaxe*
Ghost: *explodes in red particles*
Status: "+1 wheat"
Player: "Oh! I need to hunt it!"
2:00am → Victory! Rewards given
Big ghost: *fades away*
Player: "That was cool!"
```

### Veteran (Day 7, 70% chance)
```
8:50pm → Player prepares (stocks food, weapons ready)
9:00pm → Roll 70% chance → SUCCESS!
9:01pm → MASSIVE BLACK GHOST appears against red sky
Player: "Oh no... Day 7..."
9:05pm-10:30pm → 7 ghosts spawn in waves
Player: *Hunts across map, using spears and strategy*
Bloodmoon: *Also active - zombies at base*
Player: "This is chaos! I love it!"
1:45am → Last black ghost killed
Status: "SPECTRAL HUNT COMPLETE!"
Rewards: *50 wheat, 30 berry, Spectral Essence*
Player: "YES! Worth it!"
```

### Halloween Night
```
9:00pm → 100% GUARANTEED SPAWN
9:01pm → MEGA GHOST (60 blocks, purple aura, lightning)
Player: "IT'S HUGE!"
9:05pm-11:00pm → 10 ghosts spawn (faster rate)
Ghosts: *All colors + extras*
Player: *Intense combat, using all weapons*
1:50am → Final ghost killed
Victory effect: *Rainbow explosion, screen flash*
Rewards: *Double everything + special items*
Player: "HALLOWEEN VICTORY!"
```

---

## 🎨 Future Enhancements (Post-Release)

### 1. Achievement System 🏆

**Spectral Hunt Achievements:**
```javascript
{
    "first_hunt": {
        name: "First Spectral Hunt",
        desc: "Complete your first spectral hunt",
        reward: "+5% max HP (permanent)",
        icon: "👻"
    },
    "perfect_week": {
        name: "Rainbow Hunter",
        desc: "Complete all 7 day types (ROYGBIV + Black)",
        reward: "+10% movement speed (permanent)",
        icon: "🌈"
    },
    "halloween_master": {
        name: "Halloween Master",
        desc: "Complete the Halloween mega hunt",
        reward: "Ghost Pet companion (cosmetic)",
        icon: "🎃"
    },
    "bloodmoon_hunter": {
        name: "Ultimate Challenge",
        desc: "Complete spectral hunt during bloodmoon",
        reward: "+20% all weapon damage (permanent)",
        icon: "🌕👻"
    },
    "speed_runner": {
        name: "Efficient Hunter",
        desc: "Complete Day 7 hunt with 30+ minutes remaining",
        reward: "+15% stamina regeneration (permanent)",
        icon: "⚡"
    },
    "no_damage": {
        name: "Untouchable",
        desc: "Complete hunt without taking any damage",
        reward: "Companion gains +1 HP (permanent)",
        icon: "🛡️"
    }
}
```

**Achievement UI:**
```
┌─────────────────────────────────────┐
│  🏆 Achievements                    │
│  Progress: 3/6                      │
│                                     │
│  ✅ First Spectral Hunt             │
│     Reward: +5% max HP              │
│                                     │
│  ✅ Rainbow Hunter                  │
│     Reward: +10% movement speed     │
│                                     │
│  ❌ Halloween Master (Locked)       │
│     Complete Halloween mega hunt    │
│                                     │
│  ❌ Ultimate Challenge (Locked)     │
│     Hunt during bloodmoon           │
└─────────────────────────────────────┘
```

**System Benefits:**
- **Player Rewards**: HP, speed, stamina, damage boosts
- **Companion Rewards**: HP, damage, loyalty boosts
- **Progression**: Visible goals beyond resource gathering
- **Replayability**: Reason to replay hunts with challenges

---

### 2. Bed System (Sleep Mechanics) 🛏️

**Minecraft-inspired sleep system with danger:**

#### Crafting
```javascript
Recipe: "bed"
Requirements: 3 wheat + 2 stick
Crafted at: CraftingBench
```

#### Placement
```javascript
- Right-click with bed item to place
- Requires 2x1 flat ground space
- Cannot place on water or steep slopes
- Rotates to face player direction
```

#### Usage
```javascript
// Interact with bed to sleep
onBedInteract() {
    const timeOfDay = timeSystem.currentTime;
    const isDay = timeOfDay >= 6 && timeOfDay < 18;
    
    if (isDay) {
        // Safer to sleep during day
        this.showSleepPrompt("Sleep through the day? (Safer, but night is coming)", "day");
    } else {
        // Dangerous to sleep at night
        this.showSleepPrompt("Sleep through the night? ⚠️ Enemies may find you!", "night");
    }
}
```

#### Sleep Mechanics
```javascript
startSleep(timeOfDay) {
    const isDay = timeOfDay >= 6 && timeOfDay < 18;
    
    // Fade to black
    this.screenFade(1000);
    
    // Fast-forward time
    if (isDay) {
        // Sleep 6-12 hours (until night)
        timeSystem.skipToTime(18);  // Skip to 6pm
    } else {
        // Sleep until morning
        timeSystem.skipToTime(6);   // Skip to 6am
    }
    
    // DANGER: Chance of enemy spawn
    if (!isDay) {
        const enemyChance = 0.3;  // 30% chance at night
        
        if (Math.random() < enemyChance) {
            this.spawnNightmareEnemies();  // Spawn enemies near bed!
        }
    }
    
    // Wake up
    setTimeout(() => {
        this.screenFade(1000, 'in');
        this.updateStatus(isDay ? 'Slept through the day' : '⚠️ You awaken to danger!');
    }, 2000);
}
```

#### Enemy Spawn on Night Sleep
```javascript
spawnNightmareEnemies() {
    // Spawn 1-3 enemies near bed
    const enemyCount = Math.floor(Math.random() * 3) + 1;
    const bedPos = this.bedPosition;
    
    for (let i = 0; i < enemyCount; i++) {
        // Spawn in 10-15 block radius
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 5;
        
        const spawnX = bedPos.x + Math.cos(angle) * distance;
        const spawnZ = bedPos.z + Math.sin(angle) * distance;
        
        // Spawn zombie (most common night threat)
        this.ghostSystem.spawnEnemy('zombie', spawnX, spawnZ);
        
        // Play warning sound
        this.soundEffects.playSpatial('zombie', 
            {x: spawnX, y: bedPos.y, z: spawnZ}, 
            this.player.position
        );
    }
    
    console.log(`⚠️ ${enemyCount} enemies spawned near bed!`);
}
```

#### Strategic Gameplay
```javascript
Day Sleep (Safe):
- Skips boring daytime
- No enemy spawns
- But night arrives immediately
- Miss out on daytime activities (farming, building)

Night Sleep (Risky):
- Skips dangerous nighttime
- 30% chance of enemy ambush
- Wake up surrounded by zombies
- High risk, high reward (skip bloodmoon?)

Bloodmoon Sleep:
- 80% chance of enemy spawn
- Spawn 3-5 enemies instead of 1-3
- Extra dangerous but tempting shortcut
```

#### UI Prompt
```
┌─────────────────────────────────────┐
│  🛏️ Sleep in Bed?                   │
│                                     │
│  Time: 9:30 PM (Night)              │
│                                     │
│  ⚠️ WARNING: Sleeping at night is   │
│  dangerous! Enemies may find you.   │
│                                     │
│  Safer to sleep during the day.     │
│                                     │
│  [  Sleep  ]      [  Cancel  ]      │
└─────────────────────────────────────┘
```

#### Bed Benefits
- **Set Respawn Point**: Respawn at bed on death (optional mechanic)
- **Heal While Sleeping**: Restore 1-2 HP on successful sleep
- **Stamina Restore**: Full stamina on wake
- **Status Effects Clear**: Remove debuffs (poison, slowness)

#### Balance Considerations
```javascript
Pros of Sleeping:
+ Skip undesirable time period
+ Heal HP/stamina
+ Set respawn point
+ Clear debuffs

Cons of Sleeping:
- Enemy spawn risk (night only)
- Miss events (spectral hunt, bloodmoon)
- Skip resource gathering time
- Bed requires materials to craft
```

---

### 3. Additional Features

#### Ghost Variants
```javascript
#### Ghost Variants
- Fast ghosts (harder to hit)
- Tank ghosts (2 hits to kill)
- Teleporting ghosts (blink around)

4. Special Rewards
   - "Spectral Essence" enhances crafted tools ✅ (IMPLEMENTED)
   - Ghost-themed items (spectral sword, ghost lantern)
   - Cosmetic rewards (ghost pet companion)

5. Achievements ✅ (DESIGNED ABOVE)
   - "First Hunt" - Complete first spectral hunt
   - "Perfect Week" - Kill all 7 day types
   - "Halloween Master" - Complete Halloween mega hunt
   - "Bloodmoon Hunter" - Complete hunt during bloodmoon

6. Bed System ✅ (DESIGNED ABOVE)
   - Sleep through day (safe) or night (risky)
   - Enemy spawns during night sleep (30% chance)
   - Set respawn point, heal HP/stamina
   - Strategic time-skipping mechanic

7. Difficulty Modes
   - Easy: 5 minutes to hunt (until 2:30am)
   - Normal: 5 hours (until 2am) ← Current
   - Hard: 4 hours (until 1am)
   - Nightmare: 3 hours + ghosts move faster

5. Lore Integration
   - Big ghost has backstory (ancient spirit)
   - Colored ghosts are fragments of its power
   - Spectral essence unlocks ghost lore entries
```

---

## ✅ Implementation Checklist

### Phase 1: Core System (2-3 hours)
- [ ] Create `SpectralHuntSystem.js` class
- [ ] Implement day tracking system
- [ ] Add probability check at 9pm
- [ ] Create basic state management (active/inactive)

### Phase 2: Big Ghost (1-2 hours)
- [ ] Create billboard entity
- [ ] Implement orbit rotation logic
- [ ] Add size scaling by day
- [ ] Special case for Day 7 (black) and Halloween (mega)

### Phase 3: Colored Ghosts (2-3 hours)
- [ ] Create colored ghost entity class
- [ ] Implement spawn wave system
- [ ] Add movement toward player
- [ ] Create hitbox collision detection

### Phase 4: Combat Integration (1-2 hours)
- [ ] Hook into weapon hit detection
- [ ] Implement ghost kill tracking
- [ ] Add hit particle effects
- [ ] Create sound effect triggers

### Phase 5: Rewards (1 hour)
- [ ] Implement reward calculation
- [ ] Add inventory integration
- [ ] Create victory/failure states
- [ ] Add status messages

### Phase 6: Polish (2-3 hours)
- [ ] Add particle effects (wisps, trails, explosions)
- [ ] Implement audio (ambient, hits, victory)
- [ ] Create victory/failure visual effects
- [ ] Halloween special event code

### Phase 7: Testing & Balance (1-2 hours)
- [ ] Test all 7 day types
- [ ] Verify Halloween event
- [ ] Test bloodmoon combination
- [ ] Balance difficulty and rewards

**Total Estimated Time: 10-16 hours**

---

## 📝 Configuration Variables

### Easy Tweaking
```javascript
// In SpectralHuntSystem.js constructor
CONFIG = {
    // Timing
    START_HOUR: 21,              // 9pm
    END_HOUR: 2,                 // 2am
    SPAWN_INTERVAL: 45,          // 45 seconds between ghost spawns
    
    // Big Ghost
    BIG_GHOST_RADIUS: 400,       // Orbit distance
    BIG_GHOST_SIZE_BASE: 10,     // Base size (scales with day)
    BIG_GHOST_SIZE_MAX: 40,      // Max size (Day 7)
    BIG_GHOST_SIZE_HALLOWEEN: 60,// Halloween mega size
    BIG_GHOST_ROTATION_SPEED: 0.1, // Rad/sec
    
    // Colored Ghosts
    GHOST_SPEED: 0.5,            // Blocks per second
    GHOST_HITBOX_RADIUS: 1.5,    // Hit detection radius
    MAX_GHOSTS_NORMAL: 7,        // Max ghosts (Day 7)
    MAX_GHOSTS_HALLOWEEN: 10,    // Halloween max
    
    // Rewards
    REWARD_BASE_WHEAT: 5,        // Per day multiplier
    REWARD_BASE_BERRY: 3,
    REWARD_BASE_CARROT: 2,
    
    // Bloodmoon
    BLOODMOON_SPAWN_INTERVAL: 30,  // Faster spawns
    BLOODMOON_REWARD_MULT: 2.0,    // Double rewards
    
    // Colors
    GHOST_COLORS: [
        0xFF0000, // Red
        0xFF8800, // Orange
        0xFFFF00, // Yellow
        0x00FF00, // Green
        0x0088FF, // Blue
        0x4400FF, // Indigo
        0x000000  // Black (Day 7)
    ]
};
```

---

## 🎮 Player Strategy Guide (For Documentation)

### Tips for Success
1. **Prepare at 8:50pm** - Stock up on food, weapons, stamina
2. **Listen for audio cues** - Big ghost rumble means event started
3. **Scan horizon** - Colored ghosts spawn at render distance edge
4. **Prioritize close ghosts** - They move toward you
5. **Use spears** - Ranged combat is effective
6. **Watch the clock** - Don't waste time, hunt efficiently
7. **Day 7 strategy** - Black ghosts hard to see, use sound cues
8. **Bloodmoon combo** - Bring companion, lots of food, defensive strategy

### When to Skip Event
- Low on stamina/health
- Night 7 (too many ghosts)
- During bloodmoon (if unprepared)
- No weapons available
- Building/exploring priority

### When to Engage
- Well-stocked on supplies
- Need food/resources
- Want challenge/rewards
- Halloween night (double rewards!)
- High-level player (confident)

---

## 🌟 Why This System Is Great

1. **Scales Naturally** - Day 1 (easy) → Day 7 (intense)
2. **Optional Content** - Players choose to engage
3. **Visual Spectacle** - Big ghost creates atmosphere
4. **Time Pressure** - Creates urgency and tension
5. **No Punishment** - Failure doesn't harm player
6. **Rewarding** - Tangible loot for success
7. **Replayable** - Different experience each night
8. **Synergy** - Works with bloodmoon for ultimate challenge
9. **Seasonal** - Halloween special event
10. **Memorable** - Signature feature of The Long Nights

---

## 📅 Post-Implementation

### Testing Scenarios
```javascript
Test Case 1: Day 1 spawn
- Verify 10% chance
- Check single red ghost
- Confirm basic rewards

Test Case 2: Day 7 spawn
- Verify 70% chance
- Check 7 black ghosts spawn
- Confirm legendary rewards
- Test visibility against red sky

Test Case 3: Halloween
- Force Oct 31 date
- Verify 100% spawn
- Check mega ghost size (60 blocks)
- Confirm 10 ghosts spawn
- Test double rewards

Test Case 4: Bloodmoon combo
- Activate bloodmoon + spectral hunt
- Verify faster spawn rate
- Check double rewards
- Test gameplay balance

Test Case 5: Failure state
- Spawn ghosts
- Wait until 2am without killing
- Verify no damage to player
- Confirm ghosts despawn
```

---

**Document Version**: 1.0
**Created**: October 20, 2025
**Status**: Ready for Implementation
**Estimated Completion**: 10-16 hours of dev time

---

**READY TO BEGIN WHEN YOU RETURN! 👻🌙**
