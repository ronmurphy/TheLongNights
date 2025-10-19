# 🎨 Sargem Trigger Node - Visual Guide

## New User Experience

### Step 1: Select Event Type
```
┌─────────────────────────────────────┐
│ ⚡ Trigger 1                        │
├─────────────────────────────────────┤
│                                     │
│ Event Type: [playMusic ▼]          │
│             ├─ playMusic            │
│             ├─ stopMusic            │
│             ├─ setFlag              │
│             ├─ spawnNPC             │
│             ├─ removeNPC            │
│             ├─ showStatus           │
│             ├─ teleport             │
│             ├─ setTime              │
│             └─ setWeather           │
│                                     │
└─────────────────────────────────────┘
```

### Step 2: See Help Text
```
┌─────────────────────────────────────┐
│ Event Type: playMusic               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ℹ️ playMusic:                   │ │
│ │ Play a background music track.  │ │
│ │ Use path like "music/boss.ogg"  │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Step 3: Edit Auto-Filled Parameters
```
┌─────────────────────────────────────┐
│ Parameters (JSON)                   │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "trackPath": "music/forest.og"│ │
│ │ }                               │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Edit: change "forest" → "boss"]    │
│                                     │
└─────────────────────────────────────┘
```

### Step 4: Done!
```
┌─────────────────────────────────────┐
│ Parameters (JSON)                   │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "trackPath": "music/boss.ogg" │ │
│ │ }                               │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✅ Ready to use!                    │
│                                     │
└─────────────────────────────────────┘
```

---

## All Event Examples

### 🎵 playMusic
```
Event Type: playMusic

ℹ️ Play a background music track. Use path like "music/boss.ogg"

Parameters:
{
  "trackPath": "music/forest.ogg"
}
```

### 🎵 stopMusic
```
Event Type: stopMusic

ℹ️ Stop the currently playing music. No parameters needed.

Parameters:
{}
```

### 🚩 setFlag
```
Event Type: setFlag

ℹ️ Set a persistent quest flag. Use for tracking quest progress.

Parameters:
{
  "flag": "example_flag",
  "value": true
}
```

### 👤 spawnNPC
```
Event Type: spawnNPC

ℹ️ Spawn an NPC at coordinates. Set emoji, position, and scale.

Parameters:
{
  "npcId": "goblin",
  "emoji": "👹",
  "name": "Grik",
  "x": 10,
  "y": 5,
  "z": 0,
  "scale": 1
}
```

### 👤 removeNPC
```
Event Type: removeNPC

ℹ️ Remove an NPC by its ID. Use the ID from spawnNPC.

Parameters:
{
  "npcId": "quest_npc_goblin_123"
}
```

### 📢 showStatus
```
Event Type: showStatus

ℹ️ Display a status message. Types: info, error, discovery, warning

Parameters:
{
  "message": "Quest objective updated!",
  "type": "info"
}
```

### 🌀 teleport
```
Event Type: teleport

ℹ️ Teleport player to coordinates. Requires x, y, z.

Parameters:
{
  "x": 100,
  "y": 10,
  "z": -50
}
```

### ⏰ setTime
```
Event Type: setTime

ℹ️ Change time of day. Hour is 0-24 (e.g. 12.5 = 12:30 PM)

Parameters:
{
  "hour": 12.0
}
```

### 🌦️ setWeather
```
Event Type: setWeather

ℹ️ Set weather type: clear, rain, storm, snow, fog (coming soon)

Parameters:
{
  "weather": "rain"
}
```

---

## Common Use Cases

### Boss Battle Setup
```
Node 1: Trigger (playMusic)
{
  "trackPath": "music/boss_battle.ogg"
}
        ↓
Node 2: Trigger (setFlag)
{
  "flag": "boss_encountered",
  "value": true
}
        ↓
Node 3: Trigger (spawnNPC)
{
  "npcId": "dragon",
  "emoji": "🐉",
  "x": 50,
  "y": 20,
  "z": -30,
  "scale": 3
}
```

### Time-Based Quest
```
Node 1: Dialogue
"You must wait until midnight..."
        ↓
Node 2: Trigger (setTime)
{
  "hour": 0.0
}
        ↓
Node 3: Trigger (showStatus)
{
  "message": "Midnight approaches...",
  "type": "discovery"
}
```

### Teleport to Location
```
Node 1: Dialogue
"I'll take you to the castle!"
        ↓
Node 2: Trigger (showStatus)
{
  "message": "Teleporting...",
  "type": "info"
}
        ↓
Node 3: Trigger (teleport)
{
  "x": 100,
  "y": 15,
  "z": -75
}
```

---

## Tips for Quest Designers

### ✅ DO:
- Use dropdown to select events (prevents typos)
- Edit the auto-filled parameters
- Check help text if unsure
- Test frequently with Test Quest button

### ❌ DON'T:
- Type event names manually (use dropdown!)
- Delete all params and start from scratch
- Ignore help text
- Forget to save quest

### 💡 PRO TIPS:
1. **Copy Triggers**: Select node, copy, paste to reuse config
2. **Chain Triggers**: Multiple triggers execute in sequence
3. **Set Flags Early**: Use setFlag to track quest state
4. **Status Messages**: Keep player informed of progress
5. **Test Music**: Verify track paths exist before shipping

---

## Troubleshooting

### "Invalid JSON" Error
**Problem**: Syntax error in parameters
**Solution**: Look for:
- Missing commas
- Missing quotes around strings
- Extra/missing braces

### "Missing trackPath parameter"
**Problem**: Wrong parameter name
**Solution**: Check auto-filled template for correct names

### Music Doesn't Play
**Problem**: Wrong file path
**Solution**: Verify file exists at `assets/music/yourfile.ogg`

### NPC Doesn't Spawn
**Problem**: Coordinates out of bounds
**Solution**: Use reasonable x, y, z values (check player position)

---

## Keyboard Shortcuts in Sargem

- **Delete** - Delete selected node
- **Escape** - Deselect / Exit input focus
- **Ctrl+S** - Save quest (TODO: add this!)
- **Mouse Wheel** - Zoom canvas
- **Middle Mouse** - Pan canvas

---

**Remember**: The dropdown + auto-fill system is your friend! 
No more guessing what parameters to use. 🎉
