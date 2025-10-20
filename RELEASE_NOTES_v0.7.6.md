# 🎮 The Long Nights v0.7.6 - Weather & Companions Update

**Release Date:** October 19, 2025  
**Build Type:** Pre-release (Alpha Testing)  
**Platforms:** Windows (Portable .exe) • Linux (AppImage)

---

## 🌟 What's New in v0.7.6

### 🌦️ Dynamic Weather System (NEW!)

**Automatic Weather Cycles**
- Rain, thunderstorms, and snowfall with realistic particle effects
- Weather changes naturally every 6-24 game hours
- Thunder and lightning only occur at high elevations (50+ blocks)
- 200-300 particles with minimal performance impact (~2ms per frame)
- Console commands for testing: `voxelWorld.weatherCycleSystem.forceWeather('rain')`

**Weather Types:**
- ☔ **Rain** - Light droplets, atmospheric ambience
- ⚡ **Thunder** - Heavy rain with dramatic lightning flashes (mountains only!)
- ❄️ **Snow** - Large slow-falling snowflakes with gentle drift

### 🐕 Companion Hunt System (NEW!)

**Send Your Companion on Expeditions!**
- Send companions on 2-4 day hunting expeditions
- Companions discover items based on biome (apples, honey, berries, mushrooms, flowers)
- **Purple waypoint markers** appear on minimap and journal when discoveries are made
- Navigate to waypoints to collect 1-4 clustered items
- Real-time item count tracking ("Apple ×3" updates as you collect)
- Waypoints auto-remove when all items are collected

**Biome-Specific Loot Tables:**
- Plains: Berries, flowers, mushrooms
- Forest: Apples, honey, mushrooms, berries
- Desert: Cactus fruit, desert flowers (rare)
- Mountains: Honey, rare flowers
- Tundra: Berries (rare finds)

### 🎨 UI/UX Improvements

**Companion UI Enhancements**
- Hunt status now shows in companion panel (no more floating boxes!)
- Clean "🎯 On Hunt: 2d 4h remaining" display
- Hunt glow effect on companion panel border
- Fixed heart overflow with proper flex-wrap
- Companion panel clickable to open codex

**Journal & Navigation**
- Purple pins (🟣) for companion discoveries
- Minimap integration with waypoint markers
- Smart waypoint removal system
- Item count display updates in real-time

---

## 🔧 Technical Improvements (v0.7.6)

### Memory & Performance
- ✅ **Zero memory leaks** - Full audit completed, all systems properly dispose resources
- ✅ **Weather system** - Efficient billboard particles with proper cleanup
- ✅ **Hunt system** - Proper item disposal and tracking
- ✅ **Atmospheric fog** optimizations (inherited from v0.7.5)

### Code Organization
- New modular systems: `WeatherSystem.js`, `WeatherCycleSystem.js`, `CompanionHuntSystem.js`
- Minimal VoxelWorld.js changes (clean integration)
- Comprehensive documentation added

---

## ✨ Major Features (Carried Forward)

### 🏗️ ShapeForge Crafting System
- Craft 3D structures: pyramids, cubes, spheres, cylinders
- Build defensive walls and towers
- Create custom houses with configurable dimensions
- All crafted objects save and load properly ✅

### 🌾 Complete Farming System
- Till soil with hoe, plant seeds (wheat, carrots, pumpkins, berries)
- Water crops with watering can for 2x faster growth
- Beautiful water particle effects
- 3-stage crop growth system with visual progression

### ⚔️ 3D Battle System
- Pokemon-style turn-based combat
- 6 dynamic enemy movement patterns
- 3D battle arena with visual boundaries
- Companion system with equipment and stats
- Player HP system with respawn at campfires

### 🗺️ World Exploration
- Climate-based biome generation (Plains, Forest, Desert, Mountains, Tundra)
- Procedural tree generation with ancient/mega trees
- Ruins and loot discovery
- Explorer's Journal with world map and pins
- Campfire respawn system

### 🎨 Enhanced Graphics
- Pixel-art texture system for tools and items
- Billboard sprites for floating elements
- Enhanced lighting and atmospheric fog effects
- LOD (Level of Detail) system for distant chunks

### 🎵 Immersive Audio
- Dynamic music system (OGG format, royalty-free)
- Biome-specific soundscapes
- Volume controls and mute toggle

### 🐱 Companion System
- Companion Codex (Pokedex-style registry)
- Equipment system with stat bonuses
- Context-aware battle dialogue
- Starter companion selection
- **NEW:** Hunt expedition system with waypoint navigation

---

## 🎯 Known Issues

### Minor Issues:
- Sargem Quest Editor has input field issues (use legacy tutorial system)
- Apples may spawn in tree canopies (thematically accurate - climb to get them!)
- Thunder weather requires elevation 50+ (intentional design)

### Non-Critical:
- Some terrain generation may create floating islands (intentional feature for exploration)
- Tutorial system uses legacy format (being migrated to Sargem visual editor)

---

## 🚀 Installation Instructions

### Windows (Portable)
1. Download `TheLongNights-0.7.6.exe`
2. Run the .exe file (no installation needed)
3. Game saves are stored in `%APPDATA%/TheLongNights/saves`

### Linux (AppImage)
1. Download `TheLongNights-0.7.6.AppImage`
2. Make it executable: `chmod +x TheLongNights-0.7.6.AppImage`
3. Run: `./TheLongNights-0.7.6.AppImage`
4. Game saves are stored in `~/.config/TheLongNights/saves`

---

## 🎮 Controls

**Movement:**
- WASD - Move
- Space - Jump
- Mouse - Look around (click to lock pointer)
- ESC - Unlock pointer / Close menus

**Actions:**
- Left Click (hold) - Harvest blocks
- Right Click - Place blocks / Use tools
- 1-5 Keys - Select hotbar slots
- E - Open workbench/crafting
- M - Toggle world map
- C - Toggle companion codex
- ESC - Close menus

**Debug:**
- F11 - Toggle fullscreen
- F12 - Developer console (testing only)
- Ctrl+D - Dev control panel

---

## 🧪 For Testers

### What to Test (v0.7.6 Specific):

1. **Companion Hunt System:**
   - Send companion on hunt (2-4 day expedition)
   - Wait for discoveries (or skip time with console)
   - Purple waypoints appear on minimap?
   - Navigate to waypoints and collect items
   - Item count updates correctly? ("×3" → "×2" → "×1")
   - Waypoint removes when all items collected?

2. **Weather System:**
   - Does weather cycle automatically? (6-24 hour intervals)
   - Rain, thunder, snow all appear correctly?
   - Thunder only at high elevation? (climb mountain to test)
   - Performance stable during weather? (check FPS)
   - Console test: `voxelWorld.weatherCycleSystem.getDebugInfo()`

3. **UI/UX:**
   - Hunt status shows in companion panel?
   - Hearts wrap properly (no overflow)?
   - Companion panel clickable?
   - Purple pins visible on journal map?

4. **Performance:**
   - Play for 30+ minutes - memory stable?
   - Weather cycling doesn't cause lag?
   - Multiple companion discoveries don't break things?

### Reporting Bugs:

Please include:
- **Platform:** Windows or Linux
- **What happened:** Detailed description
- **Steps to reproduce:** How to trigger the bug
- **Expected behavior:** What should happen instead
- **Screenshots/logs:** If available
- **Version:** v0.7.6

---

## 🔄 Auto-Update System

This build includes an auto-update system!

To check for updates:
1. Click **Help → Check for Updates...**
2. If an update is available, click **Download**
3. Update installs when you close the game

Updates are hosted on GitHub Releases and are safe and verified.

---

## 📦 File Information

| File | Platform | Size | Type |
|------|----------|------|------|
| `TheLongNights-0.7.6-6.exe` | Windows x64 | ~253 MB | NSIS |
| `TheLongNights-0.7.6.AppImage` | Linux x64 | ~281 MB | Portable (no install) |
| `latest.yml` | Windows | ~1 KB | Update metadata |
| `latest-linux.yml` | Linux | ~1 KB | Update metadata |

---

## 🙏 Credits

**Development:**
- Original Code: Ron Murphy (solo.dev)
- Code Refinements & Weather System: Claude (Anthropic)

**Art & Audio:**
- Artwork: m0use
- Music: Jason Heaberlin
- SFX: Connor Allen

**Testing Team:**
- Michelle Smith
- David Daniels
- Chris Mahan
- Connor Allen
- Special thanks to Condor for finding critical bugs! 🥤

---

## 📝 Changelog Summary (v0.7.4 → v0.7.6)

### v0.7.6 (October 19, 2025)
- ✨ Added dynamic weather system (rain, thunder, snow)
- ✨ Added companion hunt expedition system
- ✨ Added waypoint navigation with purple markers
- ✨ Enhanced companion UI panel
- 🐛 Fixed companion panel overflow issues
- 🐛 Fixed hunt status display (no more floating boxes)
- ⚡ Memory leak audit completed (all systems safe)
- 📚 Added comprehensive documentation

### v0.7.5 (Between releases)
- ⚡ Atmospheric fog optimizations
- 🐛 Minor bug fixes and stability improvements

See [CHANGELOG.md](https://github.com/ronmurphy/TheLongNights/blob/main/CHANGELOG.md) for detailed development history.

---

## ⚠️ Alpha Testing Notice

**This is pre-release software for testing purposes only.**

- Bugs and crashes may occur
- Save files may not be compatible with future versions
- Features are subject to change
- Not recommended for production use

We appreciate your help in testing The Long Nights! Your feedback makes the game better.

---

## 🔗 Links

- **GitHub Repository:** [https://github.com/ronmurphy/TheLongNights](https://github.com/ronmurphy/TheLongNights)
- **Report Issues:** [https://github.com/ronmurphy/TheLongNights/issues](https://github.com/ronmurphy/TheLongNights/issues)
- **Documentation:** See included README.md

---

## 🚀 What's Next?

**Coming Soon:**
- 🏔️ **Mountain Dungeon System** - Explorable hollow mountains with procedural interiors
- 💀 **Companion Death & Replacement** - Blood Moon defense hunting, memorial system
- 🌨️ **Snow Accumulation** - Snow blocks form after prolonged snowfall
- 🎯 **More Hunt Features** - Color-coded waypoints, companion preferences

---

Thank you for playtesting! 🎮

**Built with:** Three.js • Electron • Vite • Cannon-ES

---

**🎉 Enjoy the new weather and companion hunting system!**
