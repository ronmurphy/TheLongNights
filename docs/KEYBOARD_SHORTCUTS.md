# Keyboard Shortcuts & Controls

## 🎮 Movement & Basic Controls

| Key | Action | Notes |
|-----|--------|-------|
| **W** | Move forward | Hold Shift to sprint |
| **A** | Move left (strafe) | |
| **S** | Move backward | |
| **D** | Move right (strafe) | |
| **Space** | Jump | |
| **Shift** | Sprint | While moving, consumes stamina |
| **Mouse Move** | Look around | When pointer is locked |
| **Left Click** | Mine/Attack/Harvest | Hold to break blocks or attack enemies |
| **Right Click** | Place block/Use item | Context-sensitive action |
| **Mouse Wheel** | Scroll hotbar | Navigate through hotbar slots |
| **1-5** | Select hotbar slot | Quick access to slots 1-5 |

---

## 📦 Inventory & Crafting

| Key | Action | Notes |
|-----|--------|-------|
| **E** | Open workbench | After finding backpack; Before backpack: cycle hotbar |
| **B** | Toggle backpack | Extended inventory storage (30 slots) |
| **T** | Open tool bench | Advanced crafting station |
| **K** | Open kitchen bench | Cooking & food crafting |
| **F** | Use nearby bench | When standing near kitchen bench |

---

## 🗺️ UI & Information

| Key | Action | Notes |
|-----|--------|-------|
| **M** | Toggle world map | Shows discovered areas and player location |
| **C** | Toggle Companion Codex | Pokédex-style companion collection |
| **I** | Block inspector | Shows detailed info about targeted block |
| **L** | Toggle LOD overlay | Shows level-of-detail debug info |
| **ESC** | Close/Cancel | Closes open UIs (map, workbench, backpack, etc.) |

---

## 🎵 Music & Audio

| Key | Action | Notes |
|-----|--------|-------|
| **+** or **=** | Volume up | Increases music volume |
| **-** | Volume down | Decreases music volume |
| **0** | Toggle mute | Mutes/unmutes all music |

---

## 🛠️ Developer & Debug

| Key | Action | Notes |
|-----|--------|-------|
| **Ctrl+D** | Toggle Dev Control Panel | **NEW!** Access all debug commands |
| **Ctrl+Shift+I** | Open DevTools | Browser developer console (Electron) |

### Dev Control Panel Features (Ctrl+D)
When you press **Ctrl+D** (or **Cmd+D** on Mac), you get access to:

#### ⏰ Time & Blood Moon Testing
- **Day 7 @ 7pm** - Jump to pre-blood moon time (Week 1, Day 7, 19:00)
- **Day 7 @ 10pm** - Jump directly to blood moon (Week 1, Day 7, 22:00)
- **Reset to Day 1** - Go back to Week 1, Day 1, 8am
- **Custom Time** - Set exact week/day/hour
- **Fast Time (10x)** - Speed up time progression
- **Normal Time (1x)** - Return to normal speed
- **Pause Time** - Freeze time completely
- **Force Blood Moon ON** - Activate blood moon regardless of time
- **Force Blood Moon OFF** - Deactivate and cleanup enemies
- **Spawn Enemy Wave** - Manually spawn blood moon enemies
- **Cleanup Enemies** - Remove all blood moon enemies

#### 🐈‍⬛ Quest & Tutorial Editors
- **Open Sargem Editor** - Visual node editor for quests/tutorials
- **Open Randy Editor** - Structure designer for buildings

#### 🔍 LOD System Controls
- **Toggle LOD** - Enable/disable level-of-detail optimization
- **Show LOD Stats** - Display LOD performance metrics
- **Set LOD Distance** - Adjust render distance (1-20 chunks)

#### ⚡ Performance Controls
- **Toggle FPS** - Show/hide FPS counter

#### 🎮 Game State
- **New Game** - Reset all progress and start fresh

---

## 🎯 Context-Sensitive Actions

Some actions change based on what you're looking at or holding:

### Left Click (Hold)
- **On blocks** → Mine/harvest (break block)
- **With weapon** → Attack nearby enemies
- **With machete** → Harvest trees AND attack
- **With stone hammer** → Mine AND attack (AoE damage!)
- **With tree feller** → Instant tree harvest AND attack
- **With torch** → Attack AND light area

### Right Click
- **With blocks** → Place block
- **With torch** → Place light source
- **With spear** → Throw spear at target
- **With crossbow/bow** → Fire projectile at target
- **With fire staff** → Launch fireball
- **With demo charge** → Place explosive (3-second timer)
- **With recall stone** → Teleport to campfire
- **On workbench** → Open crafting UI
- **On kitchen bench** → Open cooking UI

---

## 🔄 Quick Reference Card

**Most Used:**
- **WASD** - Move
- **Space** - Jump
- **Shift** - Sprint
- **E** - Workbench
- **M** - Map
- **C** - Companions
- **Ctrl+D** - Dev Panel ⭐ **NEW!**

**Combat:**
- **Left Click** - Melee attack
- **Right Click** - Ranged attack (with bow/staff)
- **1-5** - Switch weapons

**Survival:**
- **B** - Backpack
- **K** - Kitchen
- **T** - Tool Bench

---

## 🐛 Troubleshooting

### "Controls aren't working!"
- **ESC** to close any open UI
- Make sure pointer is locked (click on game screen)
- Check if a modal/menu is open (ESC to close)

### "I can't open the Dev Panel!"
- Try using the Electron menu: **View → Dev Controls**
- Make sure pointer is unlocked (ESC first if locked)
- Check browser console for errors (Ctrl+Shift+I)

### "Blood moon buttons don't work!"
- Check the output console at the bottom of the Dev Panel
- Make sure blood moon system is initialized (wait until game fully loads)
- Try setting time first, then forcing blood moon ON

### "Keyboard shortcut conflicts with browser"
- Some browsers may intercept Ctrl+D for bookmarks
- Use the Electron menu instead: **View → Dev Controls**
- Or use the browser console: `window.voxelWorld.openDevControlPanel()`

---

## 📝 Notes

- **Pointer Lock**: When active, mouse moves camera. Click ESC to unlock.
- **Stamina**: Sprinting and combat actions consume stamina.
- **Hotbar**: Limited to 5 slots; use backpack for extended storage.
- **Equipment Slots**: Separate from hotbar; some items auto-equip (machete, torch).

---

**Last Updated**: October 19, 2025  
**Game Version**: 0.7.5  
**New in this version**: Ctrl+D dev panel shortcut! 🎉
