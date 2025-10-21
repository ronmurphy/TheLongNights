# 🗡️ Enemy & Companion Combat System - Overhaul Plan

**Date:** October 21, 2025  
**Status:** Planning Phase  
**Priority:** HIGH (Needed for dungeon system)

---

## 🎯 Three Interconnected Systems

### 1. **Enemy Data Migration** (entities.json expansion)
### 2. **Roaming Dungeon Enemies** (billboard AI system)
### 3. **Companion Combat AI** (FPV ally system)

---

## 📊 System 1: Enemy Data Migration

### Current State:
- ✅ `entities.json` - Has ~15 enemies (current format)
- ✅ `enemies.json` - Has ~50+ enemies (old format)
- ✅ Art files exist: `_ready.png`, `_attack.png`, `.jpeg` portraits

### Goal:
Migrate all enemies from `enemies.json` into `entities.json` format

### entities.json Format:
```json
{
  "monsters": {
    "enemy_id": {
      "name": "Enemy Name",
      "type": "enemy" | "friendly",
      "tier": 1-5,
      "hp": 10,
      "attack": 5,
      "defense": 12,
      "speed": 4,
      "abilities": ["Ability 1", "Ability 2"],
      "sprite_ready": "enemy_ready_pose_enhanced.png",
      "sprite_attack": "enemy_attack_pose_enhanced.png",
      "sprite_portrait": "enemy.jpeg",
      "description": "Description text",
      "craftable": true | false,
      "craft_materials": { "item": count } OR "drops": ["item1", "item2"]
    }
  }
}
```

### enemies.json Format (OLD):
```json
{
  "floor_1": {
    "enemies": {
      "enemy_id": {
        "name": "Enemy Name",
        "level": 2,
        "hp": 8,
        "stats": { "str": 1, "dex": 5, ... },
        "attacks": [ {...} ],
        "special_abilities": [...],
        "ac": 13,
        "loot": [...]
      }
    }
  }
}
```

### Conversion Script Needed:
```javascript
// convertEnemies.js - Convert enemies.json → entities.json format
function convertEnemy(oldEnemy) {
    return {
        name: oldEnemy.name,
        type: "enemy",
        tier: Math.ceil(oldEnemy.level / 2), // Level 1-2 = tier 1, 3-4 = tier 2, etc.
        hp: oldEnemy.hp,
        attack: oldEnemy.stats.str + Math.floor(oldEnemy.level / 2),
        defense: oldEnemy.ac,
        speed: oldEnemy.stats.dex,
        abilities: oldEnemy.special_abilities,
        sprite_ready: `${enemy_id}_ready_pose_enhanced.png`,
        sprite_attack: `${enemy_id}_attack_pose_enhanced.png`,
        sprite_portrait: `${enemy_id}.jpeg`,
        description: oldEnemy.ai_notes || "No description",
        craftable: false,
        drops: oldEnemy.loot || []
    };
}
```

### TODO:
- [ ] Create conversion script
- [ ] Verify all art files exist in `/art/entities/`
- [ ] Run conversion
- [ ] Merge into entities.json
- [ ] Test loading in game

---

## 🧟 System 2: Roaming Dungeon Enemies

### Current State:
- ✅ GhostSystem exists (floating billboard AI)
- ✅ AngryGhostSystem exists (battle trigger AI)
- ❌ No general "roaming enemy" system

### Goal:
Create `RoamingEnemySystem.js` for dungeon enemies

### Design:
```javascript
// RoamingEnemySystem.js
export class RoamingEnemySystem {
    constructor(scene, voxelWorld) {
        this.scene = scene;
        this.voxelWorld = voxelWorld;
        this.enemies = new Map(); // enemyId → enemyData
    }
    
    /**
     * Spawn roaming enemy at position
     * @param {string} enemyType - ID from entities.json
     * @param {object} pos - {x, y, z}
     */
    spawnEnemy(enemyType, pos) {
        const entityData = this.getEntityData(enemyType);
        
        // Create billboard sprite
        const sprite = this.createEnemySprite(entityData, pos);
        
        // Create enemy data
        const enemyId = `enemy_${this.nextId++}`;
        const enemy = {
            id: enemyId,
            type: enemyType,
            sprite: sprite,
            position: {...pos},
            hp: entityData.hp,
            maxHp: entityData.hp,
            attack: entityData.attack,
            defense: entityData.defense,
            speed: entityData.speed * 0.01,
            state: 'idle', // idle, patrol, chase, attack
            target: null,
            patrolPath: this.generatePatrolPath(pos),
            detectionRange: 16, // Blocks
            attackRange: 3, // Melee: 3 blocks, Ranged: 16 blocks
            attackCooldown: 0
        };
        
        this.enemies.set(enemyId, enemy);
        return enemyId;
    }
    
    /**
     * Update all enemies (AI + animation)
     */
    update(deltaTime, playerPos) {
        this.enemies.forEach((enemy) => {
            // AI state machine
            switch (enemy.state) {
                case 'idle':
                    this.updateIdleState(enemy, playerPos);
                    break;
                case 'patrol':
                    this.updatePatrolState(enemy, deltaTime);
                    break;
                case 'chase':
                    this.updateChaseState(enemy, playerPos, deltaTime);
                    break;
                case 'attack':
                    this.updateAttackState(enemy, playerPos, deltaTime);
                    break;
            }
            
            // Update sprite position/animation
            this.updateEnemySprite(enemy, deltaTime);
        });
    }
    
    updateIdleState(enemy, playerPos) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist < enemy.detectionRange) {
            // Player detected!
            enemy.state = 'chase';
            enemy.target = playerPos;
            console.log(`👹 ${enemy.type} detected player!`);
        } else if (Math.random() < 0.01) {
            // Start patrolling randomly
            enemy.state = 'patrol';
        }
    }
    
    updateChaseState(enemy, playerPos, deltaTime) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist < enemy.attackRange) {
            // In attack range!
            enemy.state = 'attack';
            enemy.attackCooldown = 0;
        } else if (dist > enemy.detectionRange * 2) {
            // Lost player
            enemy.state = 'idle';
        } else {
            // Move toward player
            this.moveToward(enemy, playerPos, deltaTime);
        }
    }
    
    updateAttackState(enemy, playerPos, deltaTime) {
        const dist = this.distance(enemy.position, playerPos);
        
        if (dist > enemy.attackRange) {
            // Player escaped
            enemy.state = 'chase';
            return;
        }
        
        // Attack cooldown
        enemy.attackCooldown -= deltaTime;
        if (enemy.attackCooldown <= 0) {
            this.performAttack(enemy, playerPos);
            enemy.attackCooldown = 2.0; // 2 second cooldown
        }
    }
    
    performAttack(enemy, playerPos) {
        // Show attack sprite
        this.showAttackAnimation(enemy);
        
        // Deal damage to player
        const damage = Math.max(1, enemy.attack - (this.voxelWorld.playerDefense || 0));
        this.voxelWorld.playerHP.takeDamage(damage);
        
        console.log(`👹 ${enemy.type} attacked player for ${damage} damage!`);
        
        // Play attack sound
        if (this.voxelWorld.sfxSystem) {
            this.voxelWorld.sfxSystem.play('enemy_attack');
        }
    }
    
    takeDamage(enemyId, damage) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        enemy.hp -= damage;
        
        if (enemy.hp <= 0) {
            this.killEnemy(enemyId);
        } else {
            // Show hurt animation
            this.showHurtAnimation(enemy);
            
            // Aggro player if not already
            if (enemy.state === 'idle' || enemy.state === 'patrol') {
                enemy.state = 'chase';
            }
        }
    }
    
    killEnemy(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        console.log(`💀 ${enemy.type} defeated!`);
        
        // Drop loot
        this.dropLoot(enemy);
        
        // Remove sprite
        this.scene.remove(enemy.sprite);
        enemy.sprite.material.dispose();
        if (enemy.sprite.material.map) {
            enemy.sprite.material.map.dispose();
        }
        
        // Remove from system
        this.enemies.delete(enemyId);
    }
}
```

### Dungeon Enemy Spawning:
```javascript
// In dungeon room generation
placeRoom(roomType, pos) {
    // ... place room blocks ...
    
    // Spawn enemies in room
    if (roomType === 'chamber' || roomType === 'monster_room') {
        const enemyCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.selectRandomEnemy(this.dungeonTier);
            const spawnPos = {
                x: pos.x + Math.random() * 8 - 4,
                y: pos.y + 1,
                z: pos.z + Math.random() * 8 - 4
            };
            
            this.roamingEnemySystem.spawnEnemy(enemyType, spawnPos);
        }
    }
}

selectRandomEnemy(dungeonTier) {
    const tierEnemies = {
        1: ['rat', 'goblin_grunt', 'troglodyte'],
        2: ['angry_ghost', 'vine_creeper', 'goblin_engineer'],
        3: ['zombie', 'skeleton', 'goblin_shamanka'],
        4: ['dark_knight', 'vampire', 'demon'],
        5: ['dragon', 'lich', 'mega_boss']
    };
    
    const enemies = tierEnemies[dungeonTier] || tierEnemies[1];
    return enemies[Math.floor(Math.random() * enemies.length)];
}
```

### TODO:
- [ ] Create RoamingEnemySystem.js
- [ ] Implement AI state machine
- [ ] Add billboard sprite management
- [ ] Add attack animations
- [ ] Add loot dropping
- [ ] Test in overworld first
- [ ] Integrate with dungeon system

---

## 🤝 System 3: Companion Combat AI

### Current State:
- ✅ Companion system exists (PlayerCompanionUI)
- ✅ Arena combat exists (OBSOLETE - needs removal)
- ❌ No FPV companion combat

### Goal:
Companion fights alongside player in real-time

### Design Philosophy:
- **Companion is visible in UI panel** (bottom-right)
- **Companion animates** (ready → attack → ready)
- **Companion targets enemies** automatically
- **Companion helps player** (heals at low HP, uses food/potions)
- **Different races have different behaviors:**
  - **Melee races** (Dwarf, Orc) - Attack what player attacks
  - **Ranged races** (Elf, Human) - Attack nearest visible enemy
  - **Support behavior** (all races) - Heal player at 1-2 hearts

### Implementation:
```javascript
// CompanionCombatAI.js
export class CompanionCombatAI {
    constructor(voxelWorld, companionUI) {
        this.voxelWorld = voxelWorld;
        this.companionUI = companionUI;
        this.attackCooldown = 0;
        this.attackSpeed = 2.0; // Attacks every 2 seconds
        this.currentTarget = null;
    }
    
    update(deltaTime) {
        // Get companion data
        const companion = this.getCompanionData();
        if (!companion) return;
        
        // Check if player needs healing
        if (this.shouldHealPlayer()) {
            this.healPlayer(companion);
            return;
        }
        
        // Update attack cooldown
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown > 0) return;
        
        // Find target
        const target = this.findTarget(companion);
        if (!target) {
            this.companionUI.setState('ready'); // Idle animation
            return;
        }
        
        // Perform attack
        this.performAttack(companion, target);
        this.attackCooldown = this.attackSpeed;
    }
    
    shouldHealPlayer() {
        const playerHP = this.voxelWorld.playerHP;
        return playerHP.currentHP <= 2; // 1-2 hearts remaining
    }
    
    healPlayer(companion) {
        // Check inventory for healing items
        const healingItems = ['cooked_meat', 'berry', 'healing_potion'];
        
        for (let item of healingItems) {
            if (this.voxelWorld.inventory.hasItem(item)) {
                // Use item
                this.voxelWorld.inventory.removeItem(item, 1);
                
                // Heal player
                const healAmount = item === 'healing_potion' ? 10 : 5;
                this.voxelWorld.playerHP.heal(healAmount);
                
                // Show companion animation
                this.companionUI.showHealAnimation();
                
                // Status message
                this.voxelWorld.updateStatus(
                    `${companion.name} used ${item} to heal you!`,
                    'success'
                );
                
                console.log(`🤝 Companion healed player with ${item}`);
                return true;
            }
        }
        
        return false;
    }
    
    findTarget(companion) {
        const companionRace = this.getCompanionRace();
        const isRanged = ['elf', 'human'].includes(companionRace);
        const maxRange = isRanged ? 16 : 5;
        
        // Get all enemies in range
        const enemies = this.getEnemiesInRange(maxRange);
        if (enemies.length === 0) return null;
        
        // Targeting logic by race
        if (isRanged) {
            // Ranged: Target nearest visible enemy
            return this.getNearestEnemy(enemies);
        } else {
            // Melee: Target what player is looking at
            const playerTarget = this.getPlayerTarget();
            if (playerTarget && enemies.includes(playerTarget)) {
                return playerTarget;
            }
            // Fallback: nearest enemy
            return this.getNearestEnemy(enemies);
        }
    }
    
    performAttack(companion, target) {
        // Calculate damage
        const baseDamage = companion.attack || 5;
        const randomVariance = Math.floor(Math.random() * 3) - 1; // -1 to +1
        const damage = Math.max(1, baseDamage + randomVariance);
        
        // Show attack animation in UI
        this.companionUI.setState('attack');
        
        // Deal damage to enemy
        if (target.takeDamage) {
            target.takeDamage(damage);
        } else if (this.voxelWorld.roamingEnemySystem) {
            this.voxelWorld.roamingEnemySystem.takeDamage(target.id, damage);
        }
        
        // Play attack sound
        if (this.voxelWorld.sfxSystem) {
            const companionRace = this.getCompanionRace();
            const isRanged = ['elf', 'human'].includes(companionRace);
            const sound = isRanged ? 'arrow_shoot' : 'sword_swing';
            this.voxelWorld.sfxSystem.play(sound);
        }
        
        // Show damage number (optional)
        this.showDamageNumber(target.position, damage);
        
        console.log(`🤝 ${companion.name} attacked for ${damage} damage!`);
        
        // Return to ready after 500ms
        setTimeout(() => {
            this.companionUI.setState('ready');
        }, 500);
    }
    
    getEnemiesInRange(maxRange) {
        const playerPos = this.voxelWorld.player.position;
        const enemies = [];
        
        // Check roaming enemies
        if (this.voxelWorld.roamingEnemySystem) {
            this.voxelWorld.roamingEnemySystem.enemies.forEach((enemy) => {
                const dist = this.distance(playerPos, enemy.position);
                if (dist <= maxRange) {
                    enemies.push(enemy);
                }
            });
        }
        
        // Check blood moon enemies
        if (this.voxelWorld.bloodMoonSystem?.activeEnemies) {
            this.voxelWorld.bloodMoonSystem.activeEnemies.forEach((enemy) => {
                const dist = this.distance(playerPos, enemy.position);
                if (dist <= maxRange) {
                    enemies.push(enemy);
                }
            });
        }
        
        return enemies;
    }
}
```

### Integration with PlayerCompanionUI:
```javascript
// In PlayerCompanionUI.js - add animation states
setState(state) {
    // state: 'ready', 'attack', 'heal'
    this.currentState = state;
    
    // Update sprite based on state
    if (state === 'attack') {
        this.companionSprite.src = this.companionData.sprite_attack;
    } else if (state === 'heal') {
        // Show heal animation (maybe green glow?)
        this.showHealEffect();
    } else {
        this.companionSprite.src = this.companionData.sprite_ready;
    }
}
```

### TODO:
- [ ] Create CompanionCombatAI.js
- [ ] Add AI update to game loop
- [ ] Implement targeting logic
- [ ] Add attack animations to UI
- [ ] Add healing behavior
- [ ] Add ranged weapon support
- [ ] Test with different races
- [ ] Remove/comment out old arena system

---

## 🗑️ Arena Combat System - Deprecation Plan

### What to Remove/Comment:
```javascript
// In VoxelWorld.js:
// ❌ this.battleArena = new BattleArena(this);
// ❌ this.battleSystem = new BattleSystem(this);

// In BattleArena.js:
// Comment out entire file (keep for reference)

// In AngryGhostSystem.js:
// Remove battle arena trigger, replace with direct combat
```

### Replacement:
```javascript
// When angry ghost reaches player
onAngryGhostReachPlayer(ghost) {
    // OLD: this.voxelWorld.battleArena.startBattle(...)
    
    // NEW: Just deal damage directly
    const damage = 5; // Ghost attack damage
    this.voxelWorld.playerHP.takeDamage(damage);
    
    // Ghost takes damage if player is attacking
    if (this.voxelWorld.playerItemsSystem.isAttacking()) {
        this.takeDamage(ghost.id, this.voxelWorld.playerItemsSystem.getWeaponDamage());
    }
}
```

---

## 📋 Implementation Order

### Phase 1: Enemy Data (1-2 hours)
1. Create conversion script
2. Migrate enemies.json → entities.json
3. Verify art files
4. Test loading

### Phase 2: Roaming Enemies (4-6 hours)
1. Create RoamingEnemySystem.js
2. Implement basic AI
3. Add billboard rendering
4. Test in overworld
5. Integrate with dungeons

### Phase 3: Companion Combat (3-4 hours)
1. Create CompanionCombatAI.js
2. Add to game update loop
3. Implement targeting
4. Add animations
5. Add healing behavior
6. Test with all races

### Phase 4: Arena Removal (1 hour)
1. Comment out arena code
2. Remove arena triggers
3. Test that game still works
4. Update angry ghosts

---

## 🎯 Success Criteria

✅ All enemies from enemies.json available in entities.json  
✅ Dungeon rooms spawn roaming enemies  
✅ Enemies patrol, detect, chase, and attack player  
✅ Companion attacks enemies alongside player  
✅ Companion heals player at low HP  
✅ Different races have different behaviors  
✅ Arena system removed/disabled  
✅ All systems work together smoothly  

---

## 💡 Future Enhancements

- **Enemy difficulty scaling** - Harder enemies deeper in dungeon
- **Companion leveling** - Companion gets stronger over time
- **Companion equipment** - Give weapons/armor to companion
- **Formation system** - Command companion to stay close/far
- **Companion death** - Companion can be knocked out (respawns after rest)
- **Multiple companions** - Party system (future)

---

**Three systems, one goal: Make combat feel alive! ⚔️**
