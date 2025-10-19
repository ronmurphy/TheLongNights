# ⚡ Quest Trigger Node System

**Status**: ✅ Complete  
**Date**: October 19, 2025  
**Files Modified**: `/src/quests/QuestRunner.js`

## Overview

Trigger nodes allow quest designers to fire game events that affect the world state. Triggers are **non-blocking** - they execute immediately and the quest continues to the next node without waiting.

## Supported Trigger Events

### 1. 🎵 `playMusic` - Play Background Music

Starts playing a music track (with crossfade if supported).

**Parameters:**
```json
{
  "event": "playMusic",
  "params": {
    "trackPath": "music/forest.ogg"
  }
}
```

**Alternative param names:** `track` (alias for `trackPath`)

**Example Use Cases:**
- Boss battle music when entering combat
- Mysterious music when discovering a secret area
- Victory fanfare after completing a quest

---

### 2. 🎵 `stopMusic` - Stop Current Music

Stops the currently playing music track.

**Parameters:**
```json
{
  "event": "stopMusic",
  "params": {}
}
```

**Example Use Cases:**
- Silence before a dramatic reveal
- Stopping battle music after victory
- Transitioning to ambient sounds

---

### 3. 🚩 `setFlag` - Set Quest Flag

Sets a persistent quest flag that can be checked by Condition nodes.

**Parameters:**
```json
{
  "event": "setFlag",
  "params": {
    "flag": "metKing",
    "value": true
  }
}
```

**Alternative param names:** `name` (alias for `flag`)

**Storage:**
- Stored in QuestRunner's `questFlags` Map
- Persisted to localStorage as `questFlags` JSON object
- Survives game restarts

**Example Use Cases:**
- Mark quest stages completed (`flag: "killedDragon"`)
- Track player choices (`flag: "helpedVillagers"`)
- Unlock areas (`flag: "hasCastleKey"`)
- Story branching (`flag: "betrayedKing"`)

---

### 4. 👤 `spawnNPC` - Spawn an NPC

Creates an NPC entity in the world at specific coordinates.

**Parameters:**
```json
{
  "event": "spawnNPC",
  "params": {
    "npcId": "goblin_chief",
    "name": "Grik the Goblin",
    "emoji": "👹",
    "x": 10,
    "y": 5,
    "z": -3,
    "scale": 1.5
  }
}
```

**Required:** `npcId` or `id`  
**Optional:** `name`, `emoji`, `x`, `y`, `z`, `scale`, `onInteract`

**Defaults:**
- `x, y, z`: `0, 5, 0`
- `scale`: `1`
- `name`: Same as `npcId`
- `emoji`: `'👤'`

**Notes:**
- Spawned NPCs are tracked in `questNPCs` array
- Auto-cleaned up when quest ends
- Unique IDs generated: `quest_npc_{npcId}_{timestamp}`

**Example Use Cases:**
- Spawn quest-giver after dialogue
- Summon enemies for battle
- Create temporary merchants
- Spawn companion followers

---

### 5. 👤 `removeNPC` - Remove an NPC

Removes an NPC entity from the world by ID.

**Parameters:**
```json
{
  "event": "removeNPC",
  "params": {
    "npcId": "quest_npc_goblin_123456"
  }
}
```

**Alternative param names:** `id` (alias for `npcId`)

**Example Use Cases:**
- Remove defeated enemies
- Despawn temporary NPCs
- Clean up quest characters

---

### 6. 📢 `showStatus` - Display Status Message

Shows a status message at the top of the screen.

**Parameters:**
```json
{
  "event": "showStatus",
  "params": {
    "message": "You found a secret!",
    "type": "discovery"
  }
}
```

**Alternative param names:** `text` (alias for `message`)

**Message Types:**
- `'info'` - Blue info message (default)
- `'error'` - Red error message
- `'discovery'` - Green discovery/success message
- `'warning'` - Yellow warning message

**Example Use Cases:**
- Quest objective updates
- Discovery notifications
- Hints and tips
- World state changes

---

### 7. 🌀 `teleport` - Teleport Player

Instantly moves the player camera to new coordinates.

**Parameters:**
```json
{
  "event": "teleport",
  "params": {
    "x": 100,
    "y": 10,
    "z": -50
  }
}
```

**Required:** All three coordinates (`x`, `y`, `z`)

**Example Use Cases:**
- Fast travel unlocks
- Portal/gateway interactions
- Quest cutscene positioning
- Escape from dungeon

---

### 8. ⏰ `setTime` - Change Time of Day

Sets the in-game time (triggers day/night cycle updates).

**Parameters:**
```json
{
  "event": "setTime",
  "params": {
    "hour": 12.5
  }
}
```

**Alternative param names:** `time` (alias for `hour`)

**Format:** 24-hour decimal (e.g., `12.5` = 12:30 PM, `19.0` = 7:00 PM)

**Effects:**
- Updates `voxelWorld.currentTime`
- Triggers day/night lighting changes
- May trigger music crossfades (day/night tracks)

**Example Use Cases:**
- "Time passed..." transitions
- Set dramatic lighting for cutscenes
- Trigger night events
- Speed up/skip time

---

### 9. 🌦️ `setWeather` - Change Weather

Sets the weather state (if weather system exists).

**Parameters:**
```json
{
  "event": "setWeather",
  "params": {
    "weather": "rain"
  }
}
```

**Alternative param names:** `type` (alias for `weather`)

**Status:** ⚠️ Placeholder - Shows message but weather system not implemented yet

**Planned Weather Types:**
- `'clear'` - Sunny/normal
- `'rain'` - Rainfall
- `'storm'` - Heavy rain + lightning
- `'snow'` - Snowfall
- `'fog'` - Dense fog

---

## Implementation Details

### Flow Diagram

```
Quest Node (Trigger)
    ↓
executeTrigger()
    ↓
Switch on event type
    ↓
Call specific trigger handler
    ↓
Execute game system action
    ↓
Continue to next node (non-blocking)
```

### Code Structure

```javascript
executeTrigger(node) {
    const event = node.data.event;
    const params = node.data.params;
    
    // Route to specific handler
    switch (event.toLowerCase()) {
        case 'playmusic': this.triggerPlayMusic(params); break;
        case 'setflag': this.triggerSetFlag(params); break;
        // ... etc
    }
    
    // Always continue immediately
    this.goToNext(node);
}
```

### Quest Flag System

Flags are stored in two places:

1. **Runtime**: `QuestRunner.questFlags` (Map)
2. **Persistent**: `localStorage['questFlags']` (JSON)

```javascript
// Set flag
this.questFlags.set('metKing', true);
localStorage.setItem('questFlags', JSON.stringify({
    metKing: true
}));

// Check flag (used by Condition nodes)
const hasMetKing = this.questFlags.get('metKing');
```

---

## Sargem Editor Usage

### Creating a Trigger Node

1. **Add Node**: Drag "Trigger" node from palette (⚡ icon)
2. **Set Event**: Enter event name (e.g., `playMusic`)
3. **Set Parameters**: JSON object with event-specific params

### Example Configurations

**Play Boss Music:**
```
Event Name: playMusic
Parameters:
{
  "trackPath": "music/boss_battle.ogg"
}
```

**Mark Quest Complete:**
```
Event Name: setFlag
Parameters:
{
  "flag": "rescuedPrincess",
  "value": true
}
```

**Spawn Enemy:**
```
Event Name: spawnNPC
Parameters:
{
  "npcId": "dragon",
  "name": "Ancient Dragon",
  "emoji": "🐉",
  "x": 50,
  "y": 20,
  "z": -30,
  "scale": 3
}
```

**Teleport to Throne Room:**
```
Event Name: teleport
Parameters:
{
  "x": 100,
  "y": 15,
  "z": -75
}
```

---

## Error Handling

### Missing Event Name
```
⚠️ Trigger node has no event specified
```
Quest continues to next node (no-op).

### Unknown Event Type
```
⚠️ Unknown trigger event: invalidEvent
```
Logs warning, quest continues normally.

### Missing Required Parameters
Each trigger handler validates params:
```
⚠️ playMusic trigger missing trackPath parameter
⚠️ teleport trigger missing x/y/z parameters
```

### Missing Game Systems
If required system unavailable:
```
⚠️ MusicSystem not available
⚠️ NPCManager not available
⚠️ Weather system not implemented yet
```

---

## Testing Examples

### Test: Play Music + Set Flag
```json
{
  "nodes": [
    {
      "id": "1",
      "type": "dialogue",
      "data": { "text": "The boss approaches!" }
    },
    {
      "id": "2",
      "type": "trigger",
      "data": {
        "event": "playMusic",
        "params": { "trackPath": "music/boss.ogg" }
      }
    },
    {
      "id": "3",
      "type": "trigger",
      "data": {
        "event": "setFlag",
        "params": { "flag": "bossEncounter", "value": true }
      }
    }
  ],
  "connections": [
    { "fromId": "1", "toId": "2" },
    { "fromId": "2", "toId": "3" }
  ]
}
```

### Test: Spawn NPC + Teleport
```json
{
  "nodes": [
    {
      "id": "1",
      "type": "trigger",
      "data": {
        "event": "spawnNPC",
        "params": {
          "npcId": "merchant",
          "emoji": "🧙",
          "x": 10,
          "y": 5,
          "z": 0
        }
      }
    },
    {
      "id": "2",
      "type": "dialogue",
      "data": { "text": "A merchant appears!" }
    },
    {
      "id": "3",
      "type": "trigger",
      "data": {
        "event": "teleport",
        "params": { "x": 12, "y": 5, "z": 0 }
      }
    }
  ],
  "connections": [
    { "fromId": "1", "toId": "2" },
    { "fromId": "2", "toId": "3" }
  ]
}
```

---

## Future Enhancements

### Planned Triggers
- [ ] `playSound` - One-shot sound effects
- [ ] `giveXP` - Award experience points
- [ ] `unlockRecipe` - Unlock crafting recipes
- [ ] `startCutscene` - Trigger camera animations
- [ ] `setFogDistance` - Visual atmosphere control
- [ ] `shake` - Screen shake effect
- [ ] `flash` - Screen flash (lightning, etc.)

### Advanced Features
- [ ] Delayed triggers (wait X seconds before firing)
- [ ] Conditional triggers (only fire if flag set)
- [ ] Repeating triggers (fire every X seconds)
- [ ] Random triggers (random from list)

---

## Related Systems

- **Condition Node**: Uses quest flags set by `setFlag` trigger
- **Combat Node**: Could use `playMusic` for battle themes
- **Item Node**: Works with `setFlag` to track quest items received
- **Dialogue Node**: Often precedes triggers for story beats

---

## Performance Notes

- ✅ **Non-blocking**: All triggers execute synchronously and immediately
- ✅ **No memory leaks**: NPCs tracked and cleaned up properly
- ✅ **Persistent flags**: Saved to localStorage for cross-session persistence
- ✅ **Fail-safe**: Missing systems/params don't crash quest execution

---

## Console Logging

All triggers log to console for debugging:

```
⚡ Triggering event: playMusic { trackPath: 'music/boss.ogg' }
🎵 Playing music: music/boss.ogg
🎵 Now playing: music/boss.ogg (Volume: 50%)

⚡ Triggering event: setFlag { flag: 'metKing', value: true }
🚩 Set flag: metKing = true
💾 Flag saved to localStorage: metKing

⚡ Triggering event: spawnNPC { npcId: 'goblin', x: 10, y: 5, z: 0 }
👤 Spawning NPC: goblin at (10, 5, 0)
👤 Goblin appeared!
```

---

**Quest Design Tip**: Chain multiple triggers together to create complex sequences! For example:
1. Stop music
2. Set flag "entered_dungeon"
3. Spawn enemy
4. Set time to midnight
5. Play spooky music
