# Blood Moon Damage Scaling System

## 💔 Progressive Difficulty Through Damage Scaling

As weeks progress, enemies become more dangerous not just through numbers and speed, but through **increased damage output**. This creates a natural difficulty curve that rewards player skill and preparation.

---

## 📊 Damage Tiers by Week

### **Weeks 1-3: Learning Phase** 
- **Damage**: 0.5 hearts (½ ❤️) per hit
- **Hits to Death**: 6 hits (with 3 hearts)
- **Strategy**: Learn combat mechanics, safe to make mistakes
- **Enemy Types**: Zombie Crawlers only

### **Weeks 4-6: Intermediate Challenge**
- **Damage**: 1.0 heart (❤️) per hit  
- **Hits to Death**: 3 hits (with 3 hearts)
- **Strategy**: Must dodge effectively, fortifications important
- **Enemy Types**: Crawlers + new enemy (e.g., skeleton archers)

### **Weeks 7-9: Expert Difficulty**
- **Damage**: 1.5 hearts (❤️💔) per hit
- **Hits to Death**: 2 hits (with 3 hearts)
- **Strategy**: Nearly one-shot territory! Fortifications CRITICAL
- **Enemy Types**: Mix of all previous + tough enemy (e.g., armored goblins)

### **Week 10+: Maximum Carnage**
- **Damage**: 2.0 hearts (❤️❤️) per hit
- **Hits to Death**: 1-2 hits (with 3 hearts)
- **Strategy**: Perfect defense or death. Sleep system becomes essential.
- **Enemy Types**: All enemies, maximum spawn counts, fastest speeds

---

## 🎯 Design Rationale

### **Progressive Tension**
- Early weeks teach mechanics without severe punishment
- Mid-game introduces real consequences  
- Late game creates true horror (2-hit death!)
- Week 10+ is deliberately brutal to encourage escape/victory

### **Natural Difficulty Curve**
Combines with other scaling systems:
- **Speed scaling**: +5% per hour from noon
- **Spawn scaling**: 10 + (week × 10) enemies
- **Damage scaling**: Increases every 3 weeks
- **Enemy variety**: New types each week

### **Strategic Depth**
- **Weeks 1-3**: Focus on learning spear combat
- **Weeks 4-6**: Build fortifications, stockpile spears
- **Weeks 7-9**: Perfect your defense or flee
- **Week 10+**: Sleep system or perfect skill required

---

## 🛡️ Player Countermeasures

### **Defensive Options** (Future Phases)
1. **Fortifications**: Walls to keep enemies at bay
2. **Armor System**: Reduce damage taken per hit
3. **Healing Items**: Restore health during battle
4. **Sleep System**: Skip blood moon entirely (but lose loot)
5. **Escape Victory**: Survive 10 weeks to escape the nightmare

### **Offensive Options**
1. **Better Weapons**: Bow/crossbow for range (future)
2. **Traps**: Spikes, pits to thin the horde
3. **Fire**: Area damage for groups (future magic system?)
4. **Companions**: NPCs to help fight (from Mountain Dungeon system)

---

## 💡 Implementation Notes

### **Damage Formula**
```javascript
const baseDamage = enemy.attack; // From entities.json
const weekTier = Math.min(Math.floor((currentWeek - 1) / 3), 3); // 0-3
const damageMultipliers = [0.5, 1.0, 1.5, 2.0]; // Week tiers
const finalDamage = baseDamage * damageMultipliers[weekTier];
```

### **Heart Display**
- Current: 3 hearts (❤️❤️❤️)
- Half heart = 0.5 damage (❤️💔❤️)
- Full heart = 1.0 damage (❤️💚❤️)
- 1.5 hearts = (❤️💚💔)
- Death at 0 hearts (💚💚💚)

### **Emoji Hearts**
- Full: ❤️
- Half: 💔
- Empty: 🖤 or 💚

---

## 🎮 Gameplay Impact

### **Early Game (Weeks 1-3)**
*"I can tank a few hits while learning!"*
- Forgiving combat learning
- Focus on exploration and resource gathering
- Blood moon is a challenge, not a nightmare

### **Mid Game (Weeks 4-6)**  
*"I need to be more careful now!"*
- Strategic positioning matters
- Fortifications become valuable
- Each hit is meaningful

### **Late Game (Weeks 7-9)**
*"TWO HITS AND I'M DEAD?!"*
- Pure survival horror
- Every encounter is life-or-death
- Sleep system looks very appealing

### **Endgame (Week 10+)**
*"I'm either perfect or I'm dead."*
- Master-level difficulty
- Forces use of ALL systems (fortifications, sleep, traps)
- Escape becomes the only reasonable goal

---

## 🌟 Future Enhancements

### **Armor System** (Reduces damage)
- Leather Armor: -0.5 hearts per hit
- Iron Armor: -1.0 heart per hit  
- Diamond Armor: -1.5 hearts per hit

### **Healing Items**
- Bandages: +0.5 hearts
- Healing Potion: +1.5 hearts
- Golden Apple: Full heal + temporary resistance

### **Difficulty Modifiers**
- **Easy Mode**: Damage × 0.75
- **Normal Mode**: Standard damage
- **Hard Mode**: Damage × 1.5
- **Nightmare Mode**: Damage × 2.0 (always 2-shot death)

---

## 📈 Balance Testing Notes

### **Considerations**
1. Week 10+ should feel nearly impossible (intentional!)
2. Sleep system should be the "safety valve" for struggling players
3. Armor should extend survival but not trivialize danger
4. Victory condition (escape) should be achievable but challenging

### **Adjustments** (if needed)
- If too easy: Increase damage multipliers to 0.75, 1.0, 2.0, 2.5
- If too hard: Keep weeks 1-6 as is, cap at 1.5 hearts
- Alternative: Add more week tiers (every 2 weeks instead of 3)

---

## 🎯 Summary

**Perfect difficulty progression:**
- Learn → Challenge → Horror → Nightmare
- Combines with speed and spawn scaling
- Creates natural story arc toward escape
- Rewards skill while providing safety options (sleep, fortifications)

**Week 10+ design philosophy:**
*"This world wants you dead. Will you master it, fortify against it, or flee from it?"*

---

*Document created: 2025-10-16*  
*Status: Design Complete - Ready for Phase 2 Implementation*
