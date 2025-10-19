# 🎮 Quest Designer Quick Reference

**Sargem Quest Editor Cheat Sheet**

## Available Node Types

### 🗨️ Dialogue
Show text with character portraits.

```json
{
  "speaker": "companion",
  "text": "Hello, traveler!"
}
```

### 🔀 Choice
Player decision with multiple options.

```json
{
  "question": "What will you do?",
  "options": ["Fight", "Run", "Talk"]
}
```

### 🖼️ Image
Display fullscreen image.

```json
{
  "path": "quest-images/castle.png",
  "duration": 3
}
```

### 📦 Item (NEW!)
Give or take items.

```json
{
  "action": "give",
  "itemId": "health_potion",
  "amount": 3
}
```

```json
{
  "action": "take",
  "itemId": "gold_key",
  "amount": 1
}
```

### ⚡ Trigger (NEW!)
Fire game events.

**Play Music:**
```json
{
  "event": "playMusic",
  "params": {
    "trackPath": "music/boss_battle.ogg"
  }
}
```

**Set Quest Flag:**
```json
{
  "event": "setFlag",
  "params": {
    "flag": "metKing",
    "value": true
  }
}
```

**Spawn NPC:**
```json
{
  "event": "spawnNPC",
  "params": {
    "npcId": "goblin",
    "emoji": "👹",
    "x": 10,
    "y": 5,
    "z": 0,
    "scale": 1.5
  }
}
```

**Show Status:**
```json
{
  "event": "showStatus",
  "params": {
    "message": "Quest objective updated!",
    "type": "info"
  }
}
```

**Teleport Player:**
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

**Set Time:**
```json
{
  "event": "setTime",
  "params": {
    "hour": 19.0
  }
}
```

**All Trigger Types:**
- `playMusic` / `stopMusic`
- `setFlag`
- `spawnNPC` / `removeNPC`
- `showStatus`
- `teleport`
- `setTime`
- `setWeather` (coming soon)

### ❓ Condition (Coming Soon)
Branch based on flags/inventory.

### ⚔️ Combat (Coming Soon)
Start battles.

---

## Common Patterns

### Quest with Reward
```
Dialogue → Choice → Item (give reward) → End
```

### Branching Story
```
Dialogue → Choice → [Path A] → ...
                  └→ [Path B] → ...
```

### Boss Encounter
```
Dialogue → Trigger (music) → Trigger (spawn enemy) → Combat → Item (loot) → End
```

### Time-Based Event
```
Dialogue → Trigger (setTime: 19.0) → Trigger (playMusic: night.ogg) → Dialogue → End
```

### Flagged Progression
```
Dialogue → Trigger (setFlag: stage1_complete) → Item (give key) → End
```

Later quest checks flag:
```
Condition (hasFlag: stage1_complete) → [True path] → ...
                                     └→ [False path] → "Come back later"
```

---

## Item IDs

Common items for quests:

**Potions:**
- `health_potion`
- `mana_potion`
- `stamina_potion`

**Keys:**
- `bronze_key`
- `silver_key`
- `gold_key`

**Food:**
- `bread`
- `cheese`
- `apple`

**Materials:**
- `wood`
- `stone`
- `iron_ore`

**Tools:**
- `pickaxe`
- `axe`
- `sword`

*(Check `/assets/data/` for full item list)*

---

## Music Tracks

Available music paths:

**Exploration:**
- `music/forestDay.ogg`
- `music/forestNight.ogg`

**Combat:**
- `music/boss_battle.ogg` (if exists)

*(Check `/assets/music/` folder)*

---

## Quest Flags Best Practices

### Naming Convention
```
questName_stageName_completed
```

Examples:
- `rescue_princess_started`
- `rescue_princess_got_key`
- `rescue_princess_completed`

### Flag Types
```javascript
// Boolean (most common)
{ "flag": "metKing", "value": true }

// Numbers (quest stages)
{ "flag": "main_quest_stage", "value": 3 }

// Strings (NPC relationships)
{ "flag": "king_opinion", "value": "friendly" }
```

---

## Testing Your Quest

1. **Open Sargem**: Press `Ctrl+S`
2. **Create Nodes**: Drag from palette
3. **Connect Nodes**: Click output → Click target node
4. **Test**: Click "Test Quest" button
5. **Click Cat**: Interact with spawned 🐈‍⬛ NPC
6. **Debug**: Check console (F12) for logs

### Test Mode Features
- Black cat portrait for all dialogue
- Test NPC spawns 3 blocks ahead
- Full quest execution
- Real game systems (inventory, music, etc.)

---

## Keyboard Shortcuts

**In Sargem Editor:**
- `Del` - Delete selected node/connection
- `Esc` - Deselect / Exit input focus
- Mouse wheel - Zoom canvas
- Middle mouse drag - Pan canvas

**In Game:**
- `Ctrl+S` - Open Sargem
- `Ctrl+D` - Dev Control Panel
- `F12` - Browser console

---

## Common Errors

### "Trigger has no event specified"
- Fill in "Event Name" field

### "Missing trackPath parameter"
- Add required params to JSON

### "Item not in inventory"
- Player doesn't have item for `take` action

### "THREE is not defined"
- Refresh page (import issue)

---

## Example: Complete Quest

**Quest**: Find the Lost Key

```
Node 1 (Dialogue):
  speaker: companion
  text: "I lost my key! Can you help me find it?"

Node 2 (Choice):
  question: "Will you help?"
  options: ["Yes, I'll help", "Not right now"]

Node 3 (Dialogue) [from "Yes"]:
  text: "Thank you! Check near the old oak tree."

Node 4 (Trigger):
  event: setFlag
  params: { "flag": "accepted_key_quest", "value": true }

Node 5 (Trigger):
  event: showStatus
  params: { "message": "Quest: Find the Lost Key", "type": "info" }

Node 6 (Item):
  action: take
  itemId: gold_key
  amount: 1

Node 7 (Dialogue):
  text: "You found it! Thank you so much!"

Node 8 (Item):
  action: give
  itemId: health_potion
  amount: 5

Node 9 (Trigger):
  event: setFlag
  params: { "flag": "key_quest_complete", "value": true }

Node 10 (Dialogue):
  text: "Take these potions as a reward!"

Node 11 (End)
```

**Connections:**
```
1→2, 2(0)→3, 3→4, 4→5, 5→6, 6→7, 7→8, 8→9, 9→10, 10→11
2(1)→11 (player declined)
```

---

## Tips & Tricks

1. **Use Flags Liberally**: Track quest state for complex branching
2. **Status Messages**: Keep player informed of objectives
3. **Music Changes**: Set mood for dramatic moments
4. **Spawn NPCs Strategically**: Place them near player or quest locations
5. **Test Early, Test Often**: Use test mode frequently
6. **Save Regularly**: Sargem auto-saves, but be safe

---

## Need Help?

- Check `/docs/QUEST_TRIGGER_NODE.md` for trigger details
- Check `/docs/QUEST_ITEM_NODE.md` for item node details
- Check console logs for debugging info
- All nodes log their execution: `🎬 Executing Dialogue 1`

**Happy Quest Designing!** 🐈‍⬛
