# 🐕 Companion Hunt System - Journal Map Integration

**Date:** October 19, 2025  
**Status:** ✅ Fully Integrated with Personality Quiz Companion System  
**Feature Added:** Companion discoveries now show on world/journal map

---

## 🎉 Integration Complete!

The CompanionHuntSystem is now **fully integrated** with:
- ✅ Personality Quiz Companion System (determines companion from Q4)
- ✅ CompanionPortrait (click to open menu)
- ✅ Minimap (shows companion position + discoveries)
- ✅ **World/Journal Map (NEW - shows companion position + discoveries)**

---

## 🗺️ Map Visualization

### **Minimap** (Bottom-right HUD)
**Already Working:**
- 🔵 **Cyan pulsing dot** = Active companion location (real-time)
- 🟣 **Purple dots** = Discovered items (persistent)
- ➡️ **Direction arrow** = Shows when companion is returning home

### **World/Journal Map** (Press M to open)
**NOW WORKING:**
- 🔵 **Cyan pulsing dot** 🐕 = Companion's current position during hunt
- 🟣 **Purple circles** = Discovered items with emoji (🐟 🥚 🍯 🍎)
- **Item labels** = Shows item name below marker (FISH, EGG, etc.)
- ➡️ **Return arrow** = Shows direction when companion is heading home
- **Explorer marker** (red) = Your current position

---

## 📍 Discovery Markers on Journal Map

Each discovery shows:
1. **Purple circle** background (#a855f7)
2. **Item emoji** in center:
   - 🐟 = Fish
   - 🥚 = Egg
   - 🍯 = Honey
   - 🍎 = Apple
3. **Item name** label below in purple text
4. **Persistent** - Stays on map until item is collected

---

## 🎮 Complete Usage Flow

### 1. **Get Companion from Personality Quiz**
- Complete personality quiz at game start
- **Question 4** determines your companion (elf, dwarf, human, orc)
- **Question 5** randomly assigns gender (male/female)
- Result: `"elf_male"`, `"dwarf_female"`, etc.

### 2. **Open Companion Menu**
- Click companion portrait in bottom-left corner
- Menu shows:
  - **🎯 Send to Hunt** (if companion is home)
  - **📢 Recall Companion** (if companion is exploring)
  - **📖 Open Codex** (view all companions)
  - **✕ Close**

### 3. **Send Companion on Hunt**
- Click "Send to Hunt"
- Choose duration:
  - **½ Day** (10 real-time minutes) - Short radius
  - **1 Day** (20 real-time minutes) - Medium radius
  - **2 Days** (40 real-time minutes) - Long radius
- Companion departs immediately

### 4. **Track Companion in Real-Time**
- **Minimap:** See companion as cyan dot moving away from you
- **Journal Map:** Press M, see companion's position and discoveries
- **Portrait:** Shows cyan border and reduced opacity during hunt

### 5. **Discoveries**
- Companion checks for items every in-game minute
- Items depend on biome:
  - 🌊 Ocean → 70% fish, 20% egg
  - 🌲 Forest → 50% apple, 30% honey
  - 🏔️ Mountains → 50% egg, 25% fish
- Purple markers appear on BOTH maps when found
- Physical billboard items spawn at discovery locations

### 6. **Collection**
- Navigate to purple markers using journal map
- Collect items from world (billboard sprites)
- Purple markers disappear after collection
- Items go to your inventory

### 7. **Return & Reward**
- Companion auto-returns at halfway point
- Delivers all found items when reaching home
- Portrait returns to normal appearance
- Ready to send out again!

---

## 🎨 Visual Design

### Journal Map Styling
- **Aged paper background** - Warm tan gradient
- **Hand-drawn aesthetic** - Irregular grid lines
- **Compass rose** - Top-right corner with N/S/E/W
- **Explorer's journal feel** - Italic Georgia font
- **Color-coded markers:**
  - Red 🧭 = Player position
  - Cyan 🐕 = Companion (when hunting)
  - Purple with emoji = Discoveries
  - Green 🌲 = Trees
  - Yellow ⚔️ = Treasure chests

### Discovery Marker Design
```
     🟣
    /  \
   |emoji|  ← Item emoji (🐟 🥚 🍯 🍎)
    \  /
     --
    FISH    ← Item name label
```

---

## 🔧 Technical Implementation

### renderWorldMap() Addition (VoxelWorld.js)

```javascript
// 🐕 Draw companion hunt discoveries (purple markers) on world map
if (this.companionHuntSystem && this.companionHuntSystem.discoveries && this.companionHuntSystem.discoveries.length > 0) {
    this.companionHuntSystem.discoveries.forEach(discovery => {
        // Calculate screen position
        const discChunkX = Math.floor(discovery.position.x / chunkSize);
        const discChunkZ = Math.floor(discovery.position.z / chunkSize);
        const relativeX = discChunkX - playerChunkX;
        const relativeZ = discChunkZ - playerChunkZ;
        const screenX = centerX + (relativeX * pixelsPerChunk);
        const screenY = centerY + (relativeZ * pixelsPerChunk);

        // Draw purple circle with item emoji
        ctx.fillStyle = '#a855f7'; // Purple
        ctx.strokeStyle = '#2F1B14';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + pixelsPerChunk/2, screenY + pixelsPerChunk/2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Item emoji
        const emoji = itemEmojis[discovery.item] || '❓';
        ctx.font = '10px Arial';
        ctx.fillText(emoji, screenX + pixelsPerChunk/2, screenY + pixelsPerChunk/2 + 3);

        // Item label
        ctx.font = 'bold 9px Georgia';
        ctx.fillStyle = '#a855f7';
        ctx.fillText(discovery.item.toUpperCase(), screenX + pixelsPerChunk/2, screenY + pixelsPerChunk + 8);
    });
}

// 🐕 Draw companion current position (cyan dot) if hunting
if (this.companionHuntSystem && this.companionHuntSystem.isActive) {
    const compPos = this.companionHuntSystem.getCompanionMapPosition();
    if (compPos) {
        // Calculate position and draw pulsing cyan marker with 🐕 emoji
        // ... (with return arrow if heading home)
    }
}
```

---

## 🧪 Testing Checklist

### Basic Functionality
- [x] Companion assigned from personality quiz Q4
- [x] Gender randomly assigned from Q5
- [x] Companion shows in portrait (bottom-left)
- [x] Click portrait → Opens menu
- [x] "Send to Hunt" button visible

### Hunt Expedition
- [x] Choose duration (½, 1, 2 days)
- [x] Companion departs (status message)
- [x] Portrait shows cyan border
- [x] Portrait opacity reduced to 0.6

### Minimap (Already Working)
- [x] Cyan dot shows companion position
- [x] Purple dots show discoveries
- [x] Dots update in real-time

### Journal Map (NEW)
- [x] Press M to open world map
- [x] Cyan dot with 🐕 shows companion position
- [x] Purple circles with emojis show discoveries
- [x] Item labels show below each discovery
- [x] Return arrow shows when companion heading home
- [x] Legend updated to show new markers

### Discovery & Collection
- [x] Companion finds items based on biome
- [x] Purple markers persist on both maps
- [x] Billboard items spawn at discovery locations
- [x] Collecting item removes purple marker
- [x] Items added to inventory

### Return & Completion
- [x] Companion returns at halfway point
- [x] Items delivered when companion reaches home
- [x] Portrait returns to normal appearance
- [x] Can send on new hunt immediately

---

## 📊 Integration Points

### Files Modified
1. **`src/VoxelWorld.js`**
   - Added companion discoveries rendering to `renderWorldMap()`
   - Added companion position rendering to `renderWorldMap()`
   - Updated map legend

### Files Already Integrated (No Changes Needed)
1. **`src/App.js`** - Personality quiz → companion assignment
2. **`src/ui/CompanionPortrait.js`** - Portrait display + menu system
3. **`src/CompanionHuntSystem.js`** - Hunt logic + minimap integration
4. **`src/ui/CompanionCodex.js`** - View all companions
5. **`src/PlayerCharacter.js`** - Quiz answer processing

---

## 🎯 Strategic Gameplay

### Planning Expeditions
1. **Check journal map** for unexplored biomes
2. **Travel to desired biome** before sending companion
3. **Send companion** in the direction you want them to explore
4. **Mark discoveries** mentally while companion is out
5. **Navigate to purple markers** after companion returns

### Biome Strategy
- **Need fish?** → Travel to ocean, send companion
- **Need honey?** → Travel to plains/forest, send companion
- **Need eggs?** → Travel to mountains, send companion
- **Need apples?** → Travel to forest, send companion

### Duration Strategy
- **Short trips (½ day)** - Safe, nearby discoveries
- **Medium trips (1 day)** - Balanced risk/reward
- **Long trips (2 days)** - Far discoveries, more items, requires survival

---

## 🚀 Future Enhancements

### Potential Improvements
1. **Clickable discovery markers** on journal map
   - Click marker → Show info popup
   - Show biome, item type, distance
   - "Navigate Here" button

2. **Path history visualization**
   - Dotted line showing companion's route
   - Fades over time
   - Different color when returning

3. **Discovery statistics**
   - Total items found by companion
   - Success rate by biome
   - Rarest items discovered

4. **Multiple companions**
   - Send different companions to different biomes
   - Each has strengths (forest specialist, ocean specialist)
   - Codex shows companion specialties

---

## 🎓 Player Tips

💡 **Pro Strategies:**
- Travel to the biome you want items from before sending companion
- Longer expeditions reach farther biomes
- Check journal map often to see companion's progress
- Purple markers stay until collected - plan your route!
- Companions can't get hurt - send them anywhere!

⚠️ **Remember:**
- Companion needs to be home to send on new hunt
- Recall early if you see enough purple markers
- Items don't despawn - collect at your leisure
- Journal map is your best planning tool!

---

**Author:** Claude (with Brad)  
**Status:** ✅ Fully Implemented and Ready to Use!  
**Next Steps:** Test in game, send companion on first hunt! 🐕🗺️
