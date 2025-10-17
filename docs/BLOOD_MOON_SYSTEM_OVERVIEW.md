# 🩸 Blood Moon System - Game Design Overview

**Game:** The Long Nights  
**Feature:** 7-Day Blood Moon Survival Cycle  
**Status:** Design Complete, Ready for Implementation

---

## 🎯 Core Concept

Transform The Long Nights from **aimless sandbox exploration** into **structured survival defense game** with clear progression and escalating difficulty.

### The 7-Day Cycle:
```
┌─────────────────────────────────────────┐
│  Days 1-6: PEACEFUL EXPLORATION         │
│  • Gather resources                     │
│  • Build fortifications                 │
│  • Craft weapons & tools                │
│  • Prepare for the coming storm         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Night 7: BLOOD MOON (10pm-2am)         │
│  🩸 Sky turns blood red                 │
│  🧟 Enemies spawn and attack            │
│  ⚔️ Player must survive until dawn      │
│  💤 OR sleep through (risky!)           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Dawn: WEEK COMPLETE!                   │
│  ✅ Week counter increments             │
│  ⬆️ Next blood moon is HARDER           │
│  🔄 Cycle repeats with progression      │
└─────────────────────────────────────────┘
```

---

## 🎮 Gameplay Mechanics

### Blood Moon Triggers:
- **When:** Day 7 of each week at **10:00 PM (22:00)**
- **Duration:** 4 in-game hours (10pm-2am) ≈ **3-4 real minutes**
- **Visual:** Sky changes to **dark red** (hex #8B0000)
- **Audio:** *(Future)* Ominous music / sound effects

### Enemy Spawning:
- **Formula:** `10 + (week × 10)` enemies (capped at 100)
- **Examples:**
  - Week 1: **10 enemies** (zombie crawlers only)
  - Week 5: **60 enemies** (zombies, rats, goblins, skeletons)
  - Week 10: **100 enemies** (all types + 5% killer rabbit chance)
- **Spawn location:** 30-40 blocks away from player in circle
- **Behavior:** Walk towards player, attack fortifications

### Enemy Types by Week:

| Week | Enemy Types | Total Count | Difficulty |
|------|-------------|-------------|------------|
| 1 | Zombie Crawler only | 10 | ⭐ Tutorial |
| 2-3 | Zombies + Rats | 20-30 | ⭐⭐ Easy |
| 4-5 | + Goblins | 40-60 | ⭐⭐⭐ Medium |
| 6-7 | + Skeletons | 60-80 | ⭐⭐⭐⭐ Hard |
| 8+ | All + Killer Rabbit (5%) | 80-100 | ⭐⭐⭐⭐⭐ Extreme |

### Enemy Stats (from entities.json):

**Zombie Crawler** (Week 1 starter enemy)
- HP: 15 | Attack: 4 | Defense: 10 | Speed: 2 (SLOW)
- Abilities: Relentless, Slow Movement
- Strategy: Easy to kite, perfect for learning

**Rat** (Week 2+)
- HP: 8 | Attack: 3 | Defense: 13 | Speed: 5 (FAST)
- Abilities: Pack Tactics, Quick Strike
- Strategy: Low HP but hard to hit

**Goblin Grunt** (Week 4+)
- HP: 12 | Attack: 4 | Defense: 12 | Speed: 4
- Abilities: Club Smash, Cowardly Retreat
- Strategy: Balanced threat, retreats when alone

**Skeleton Archer** (Week 6+)
- *(Needs to be added to entities.json)*
- Ranged attacks, medium HP
- Strategy: Priority target, attacks from distance

**Killer Rabbit** 🐰💀 (Week 8+ rare)
- HP: 50 | Attack: 20 | Defense: 15 | Speed: 10
- Abilities: Leap Attack, Ferocious, Death Incarnate
- **5% spawn chance** - Monty Python easter egg
- Strategy: RUN or use companion + best weapons!

---

## 🛡️ Player Strategies

### Option 1: FIGHT! ⚔️
**Active Defense**
- Stay awake during blood moon
- Fight enemies with spear/sword
- Send companion to auto-battle
- Defend fortifications actively
- **Reward:** Bonus XP, enemy drops, early completion

### Option 2: SLEEP 💤
**Passive Defense** *(Risky!)*
- Sleep through blood moon in bed
- Enemies attack fortifications in background
- Simplified damage calculation
- **Success:** Wake at dawn, fortifications held
- **Failure:** Fortifications breached → **GAME OVER**

### Preparation (Days 1-6):
**Early Game (Week 1-3):**
- Gather wood + stone
- Build simple 4×4 house
- Craft wooden spear
- Place torches to prevent spawns near base

**Mid Game (Week 4-7):**
- Upgrade to stone walls (2 blocks thick)
- Craft iron weapons
- Find companion (cat/bird)
- Unlock companion combat abilities
- Build moat or spike traps

**Late Game (Week 8+):**
- Legendary weapons from mountain dungeons
- Multiple layers of defense
- Companion fully upgraded
- Advanced traps and turrets *(future)*

---

## 📊 HUD & UI Elements

### 1. Week/Day Display (Top Right)
```
┌─────────────────────┐
│  Week 3 - Day 5/7   │  ← Normal days
└─────────────────────┘

┌─────────────────────┐
│ Week 3 - Day 7/7 ⚠️ │  ← Day 7 warning
└─────────────────────┘

┌─────────────────────┐
│  🩸 BLOOD MOON 🩸   │  ← During blood moon
└─────────────────────┘
```

### 2. Time Indicator Icon
- **Days 1-6:** Normal sun/moon cycle icons
- **Day 7 (before 10pm):** ⚠️ Warning icon (orange)
- **Blood Moon (10pm-2am):** 🩸 Blood moon PNG icon (red)
- **Post-Blood Moon:** Back to normal cycle

### 3. Enemy Counter *(Future Phase 2)*
```
┌─────────────────────┐
│  🧟 Enemies: 8/60   │  ← Remaining enemies
└─────────────────────┘
```

### 4. Fortification Health *(Future Phase 2)*
```
┌─────────────────────┐
│  🛡️ Defenses: 85%   │  ← Wall integrity
└─────────────────────┘
```

---

## 🎨 Visual & Audio Design

### Sky Colors:
- **Normal Day:** Sky blue (#87CEEB)
- **Normal Night:** Dark blue (#0A0A0F)
- **Day 7 Warning:** Orange tint during sunset
- **Blood Moon:** **Dark red (#8B0000)** with pulsing effect

### Lighting:
- **Blood Moon:** Dim red directional light
- **Ambient:** Darker than normal night
- **Player torches:** More important during blood moon

### Audio *(Future)*:
- Blood moon rising sound (ominous horn)
- Enemy spawn sound (growls/moans)
- Blood moon music (intense survival theme)
- Dawn victory fanfare

---

## 🔧 Technical Implementation

### Systems We Already Have:
✅ **Day/Night Cycle** - 20-minute cycle with hour tracking  
✅ **Billboard Enemies** - Ghost system can be adapted  
✅ **Combat System** - Battle Arena for auto-battles  
✅ **Harvesting Damage** - Can be used for enemy attacks on blocks  
✅ **Modified Block Tracking** - Know what player built  
✅ **Companion System** - Can send companion to fight  

### New Systems Needed:
🆕 **Week/Day Tracking** - Add counters to dayNightCycle  
🆕 **BloodMoonSystem.js** - Enemy spawning & AI  
🆕 **HUD Elements** - Week/day display, blood moon icon  
🆕 **Enemy Movement** - Path towards player, attack blocks  
🆕 **Sleep System** - Bed functionality with risk/reward  
🆕 **Victory/Defeat** - Game over conditions  

### File Changes Required:
```
MODIFY:
  src/VoxelWorld.js
    - Add week/day counters to dayNightCycle
    - Add blood moon detection logic
    - Add HUD elements (week/day display)
    - Integrate BloodMoonSystem

CREATE:
  src/BloodMoonSystem.js
    - Enemy spawning logic
    - Enemy movement AI
    - Attack fortifications
    - Cleanup methods

UPDATE:
  assets/art/entities/entities.json
    - Add zombie_crawler stats
    - Add killer_rabbit stats
    - Verify skeleton_archer exists

CREATE:
  assets/art/icons/bloodmoon.png
    - 64x64 or 128x128 PNG
    - Red/crimson moon with dripping blood
    - Transparent background
```

---

## 📈 Difficulty Progression

### Week-by-Week Breakdown:

**Week 1: Tutorial Blood Moon**
- 10 zombie crawlers (slow, predictable)
- Player likely has wooden spear + simple house
- Easy to survive, teaches mechanics
- **Goal:** Learn blood moon system

**Week 3: First Real Challenge**
- 30 enemies (zombies + rats)
- Need stone walls or better positioning
- Companion helpful but not required
- **Goal:** Test early-game preparation

**Week 5: Mid-Game Checkpoint**
- 60 enemies (all types except skeleton)
- NEED fortifications + iron weapons
- Companion combat highly recommended
- **Goal:** Reward grinding for upgrades

**Week 7: Late-Game Ramp**
- 80 enemies including skeleton archers
- Multi-layer defenses required
- Advanced tactics needed
- **Goal:** Push player towards mountain dungeons

**Week 10+: Endgame Content**
- 100 enemies (cap) with killer rabbit chance
- Epic battles with legendary gear
- Near-impossible without mountain loot
- **Goal:** Showcase full player power

---

## 🏆 Rewards & Progression

### Blood Moon Rewards:
- **Base XP:** 10 XP for surviving (sleeping)
- **Combat Bonus:** +50 XP for defeating all enemies
- **Enemy Drops:** Loot from killed enemies
- **Achievement:** "Survived Week X" milestones

### Unlockables *(Future)*:
- Week 3: Unlock traps
- Week 5: Unlock turrets
- Week 7: Unlock legendary crafting
- Week 10: Unlock ???

---

## 🐛 Edge Cases & Solutions

### Q: What if player is underground during blood moon?
**A:** Enemies still spawn at surface, try to pathfind down. If impossible, they despawn at dawn (player gets no rewards).

### Q: What if player has no fortifications?
**A:** Enemies attack player directly. Player takes damage, must kite/fight manually.

### Q: Can enemies break bedrock/unbreakable blocks?
**A:** No. Only player-placed blocks (from `modifiedBlocks` map) can be damaged.

### Q: What if player dies during blood moon?
**A:** Standard death mechanics apply (respawn, lose items?, etc.). Blood moon continues. *(Death system TBD)*

### Q: Can enemies spawn inside player's house?
**A:** No. Spawns check for clear line of sight and valid ground. Spawn circle is 30-40 blocks away minimum.

### Q: Does sleeping through blood moon feel like cheating?
**A:** It's a **risk/reward trade-off**:
  - **Sleep:** Less stressful but risk game over + no XP bonus
  - **Fight:** More engaging, XP bonus, loot drops
  - Both are valid strategies for different play styles!

---

## 🎯 Success Metrics

**Player Engagement:**
- Clear goal every 7 days (blood moon)
- Constant progression (weeks get harder)
- Preparation has purpose (survive blood moon)

**Difficulty Curve:**
- Week 1 beatable by any player (tutorial)
- Week 5 requires preparation (mid-game checkpoint)
- Week 10+ challenges even skilled players (endgame)

**Replayability:**
- Different strategies (fight vs sleep)
- Escalating difficulty (how many weeks can you survive?)
- Random elements (enemy spawns, killer rabbit chance)

---

## 🚀 Future Expansions (Phase 2+)

### Phase 2: Enhanced Combat
- Turrets / auto-defense systems
- Traps (spike pits, arrow traps)
- Player damage system (health bar)
- Enemy drops (crafting materials)

### Phase 3: Boss Blood Moons
- Every 10th week: Boss enemy spawns
- Unique mechanics per boss
- Legendary loot rewards

### Phase 4: Blood Moon Variants
- **Blue Moon** (rare, extra loot)
- **Eclipse** (double enemies, double rewards)
- **Crimson Hour** (shorter but more intense)

### Phase 5: Multiplayer
- Cooperative blood moon defense
- Competitive: Who survives longest?
- Raid other players' bases?

---

## 📝 Implementation Timeline

**Phase 1 (Core System):** ~12-16 hours
- Week/day tracking
- Blood moon detection
- HUD elements
- Enemy spawning
- Basic movement AI
- Attack fortifications

**Phase 2 (Polish):** ~6-8 hours
- Sleep system
- Victory/defeat conditions
- Save/load integration
- Sound effects
- Particle effects

**Phase 3 (Balance):** ~4-6 hours
- Playtesting
- Difficulty tuning
- Enemy stat adjustments
- Spawn rate tweaking

**Total Estimate:** ~22-30 hours for fully polished system

---

## ✅ Ready to Build!

All design decisions made, technical approach clear, existing systems identified, new systems planned.

**Next step:** Start with [BLOOD_MOON_PHASE_1_IMPLEMENTATION.md](./BLOOD_MOON_PHASE_1_IMPLEMENTATION.md) for detailed code-level implementation guide.

**Let's make The Long Nights legendary!** 🩸🌕🎮
