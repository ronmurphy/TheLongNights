# 🎮 The Long Nights v0.7.3 - Alpha Testing Release

**Release Date:** October 18, 2025
**Build Type:** Pre-release (Alpha Testing)
**Platforms:** Windows (Portable .exe) • Linux (AppImage)

---

## 🌟 What is The Long Nights?

A 3D voxel-based survival adventure game built with Three.js and Electron. Explore procedurally generated worlds, craft tools and structures, farm crops, battle enemies, and survive the long nights with your companions.

**This is an early alpha build for testing purposes.**

---

## ✨ Major Features (v0.7.3)

### 🏗️ **ShapeForge Crafting System**
- Craft 3D structures: pyramids, cubes, spheres, cylinders
- Build defensive walls and towers
- Create custom houses with configurable dimensions
- All crafted objects now **save and load properly** ✅

### 🌾 **Complete Farming System**
- Till soil with hoe, plant seeds (wheat, carrots, pumpkins, berries)
- Water crops with watering can for **2x faster growth**
- Beautiful water particle effects
- 3-stage crop growth system with visual progression

### ⚔️ **3D Battle System**
- Pokemon-style turn-based combat
- 6 dynamic enemy movement patterns
- 3D battle arena with visual boundaries
- Companion system with equipment and stats
- Player HP system with respawn at campfires

### 🗺️ **World Exploration**
- Climate-based biome generation (Plains, Forest, Desert, Mountains, Tundra)
- Procedural tree generation with ancient/mega trees
- Ruins and loot discovery
- Explorer's Journal with world map and pins
- Campfire respawn system

### 🎨 **Enhanced Graphics**
- Pixel-art texture system for tools and items
- Billboard sprites for floating elements
- Enhanced lighting and fog effects
- LOD (Level of Detail) system for distant chunks

### 🎵 **Immersive Audio**
- Dynamic music system (OGG format, royalty-free)
- Biome-specific soundscapes
- Volume controls and mute toggle

### 🐱 **Companion System**
- Companion Codex (Pokedex-style registry)
- Equipment system with stat bonuses
- Context-aware battle dialogue
- Starter companion selection

---

## 🔧 Recent Bug Fixes (This Build)

### Critical Fixes:
- ✅ **Crafted objects now save/load properly** - All ShapeForge items persist across sessions
- ✅ **Campfire placement fixed** - No longer floats 0.5 blocks above ground
- ✅ **Campfire collision fixed** - Players can now stand on campfires without falling to void
- ✅ **Inventory metadata handling** - New items won't break old save files

### Quality of Life:
- ✅ Auto-update system implemented (Help → Check for Updates)
- ✅ Watering can works from any equipment slot
- ✅ Improved farming crop detection
- ✅ Better error handling for missing textures

---

## 🎯 Known Issues

- Climbing claws feature temporarily disabled (being redesigned)
- Some terrain generation may create floating islands (intentional feature for exploration)
- Tutorial system uses legacy format (being migrated to Sargem visual editor)

---

## 🚀 Installation Instructions

### Windows (Portable)
1. Download `TheLongNights-0.7.3-portable.exe`
2. Run the .exe file (no installation needed)
3. Game saves are stored in `%APPDATA%/TheLongNights/saves`

### Linux (AppImage)
1. Download `TheLongNights-0.7.3.AppImage`
2. Make it executable: `chmod +x TheLongNights-0.6.7.AppImage`
3. Run: `./TheLongNights-0.7.3.AppImage`
4. Game saves are stored in `~/.config/TheLongNights/saves`

---

## 🎮 Controls

**Movement:**
- WASD - Move
- Space - Jump
- Mouse - Look around (click to lock pointer)

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

### What to Test:

1. **Save/Load System:**
   - Build structures with ShapeForge
   - Place campfires
   - Save and reload - do objects persist?

2. **Farming:**
   - Craft hoe and watering can
   - Plant and water crops
   - Check growth rates (watered = 2x faster)

3. **Combat:**
   - Fight enemies
   - Test respawn at campfire
   - Verify HP system works correctly

4. **Performance:**
   - Report FPS issues
   - Check for memory leaks during long sessions
   - Test chunk loading/unloading

### Reporting Bugs:

Please include:
- **Platform:** Windows or Linux
- **What happened:** Detailed description
- **Steps to reproduce:** How to trigger the bug
- **Expected behavior:** What should happen instead
- **Screenshots/logs:** If available

---

## 🔄 Auto-Update System

This build includes an auto-update system!

**To check for updates:**
1. Click **Help → Check for Updates...**
2. If an update is available, click "Download"
3. Update installs when you close the game

Updates are hosted on GitHub Releases and are safe and verified.

---

## 📦 File Information

| File | Platform | Size | Type |
|------|----------|------|------|
| `TheLongNights-0.7.3-portable.exe` | Windows x64 | ~465 MB | Portable (no install) |
| `TheLongNights-0.7.3.AppImage` | Linux x64 | ~TBD MB | Portable (no install) |
| `latest.yml` | Windows | ~1 KB | Update metadata |
| `latest-linux.yml` | Linux | ~1 KB | Update metadata |

---

## 🙏 Credits

**Development:**
- Original Code: Ron Murphy (solo.dev)
- Code Refinements: Claude (Anthropic)

**Art & Audio:**
- Artwork: m0use
- Music: Jason Heaberlin
- SFX: Connor Allen

**Testing Team:**
- Michelle Smith
- David Daniels
- Chris Mahan
- Connor Allen
- **Special thanks to Condor for finding critical bugs!** 🥤

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed development history.

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

- **GitHub Repository:** https://github.com/your-username/TheLongNights
- **Report Issues:** https://github.com/your-username/TheLongNights/issues
- **Documentation:** See included README.md

---

**Thank you for playtesting! 🎮**

*Built with Three.js • Electron • Vite • Cannon-ES*
