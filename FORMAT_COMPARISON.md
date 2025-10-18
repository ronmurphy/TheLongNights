# 📚 Tutorial/Quest Format Comparison

This document explains the differences between the three formats used in the game:

## 1️⃣ tutorialScripts.json (Original Format)

**Purpose:** Store companion tutorial scripts that trigger based on game events
**Used by:** `TutorialScriptSystem.js`
**Location:** `assets/data/tutorialScripts.json`

**Structure:**
```json
{
  "version": "1.0.0",
  "tutorials": {
    "tutorial_id": {
      "id": "tutorial_id",
      "title": "Tutorial Title",
      "trigger": "onGameStart",
      "once": true,
      "messages": [
        {
          "text": "Dialogue text here",
          "delay": 2000
        }
      ]
    }
  }
}
```

**Key Features:**
- ✅ Simple sequential messages
- ✅ Trigger-based activation (onGameStart, onBackpackOpened, etc.)
- ✅ One-time execution flag
- ✅ Message delays for pacing
- ❌ No branching/choices
- ❌ No visual editing

---

## 2️⃣ Sargem Node Format (Visual Editor)

**Purpose:** Visual node-based quest/tutorial editor
**Used by:** `SargemQuestEditor.js`
**Storage:** Auto-saved to `localStorage.sargem_autosave`

**Structure:**
```javascript
{
  "nodes": [
    {
      "id": 0,
      "type": "dialogue",  // dialogue, choice, item, entity, image, condition, trigger
      "name": "Node Display Name",
      "x": 100,
      "y": 100,
      "data": {
        "text": "Dialogue text",
        "delay": 2000,
        // Additional metadata based on node type
        "tutorialId": "game_start",  // From converted tutorialScripts
        "trigger": "onGameStart",
        "once": true
      }
    }
  ],
  "connections": [
    {
      "id": 0,
      "fromId": 0,
      "toId": 1,
      "label": ""  // Optional label for choice branches
    }
  ]
}
```

**Key Features:**
- ✅ Visual node graph editing
- ✅ Multiple node types (7 types)
- ✅ Branching paths via connections
- ✅ Drag & drop positioning
- ✅ Can convert to/from tutorialScripts.json
- ✅ Auto-save to localStorage

**Node Types:**
1. **dialogue** 💬 - Show companion/NPC dialogue
2. **choice** ❓ - Yes/No or multiple choice branches
3. **image** 🖼️ - Show image from `/art/pictures/`
4. **entity** 👾 - Spawn entity (enemy/NPC/animal)
5. **item** 🎁 - Give/take items from player
6. **condition** 🔀 - Check inventory/quest state
7. **trigger** ⚡ - Fire game event (unlock, spawn)

---

## 3️⃣ QuestRunner Format (Execution)

**Purpose:** Execute quests created in Sargem
**Used by:** `QuestRunner.js`
**Input:** Same as Sargem format (nodes + connections)

**Runtime Structure:**
```javascript
{
  "id": "quest_id",
  "name": "Quest Name",
  "nodes": [...],      // Same as Sargem nodes
  "connections": [...]  // Same as Sargem connections
}
```

**Key Features:**
- ✅ Executes Sargem node graphs at runtime
- ✅ Follows connection paths (fromId → toId)
- ✅ Handles all 7 node types
- ✅ Finds start node automatically (no incoming connections)
- ✅ Integrates with ChatOverlay for dialogue
- ✅ Can stop/resume quests

**Connection Resolution:**
- Supports both `fromId/toId` (Sargem) and `sourceId/targetId` (legacy)
- Uses `ChatOverlay` for dialogue display
- Handles node execution based on type

---

## 🔄 Conversion Flow

### tutorialScripts.json → Sargem Nodes

**Tool:** `TutorialToSargemParser.convertToNodes()`

**Process:**
1. Each tutorial becomes a chain of dialogue nodes
2. Each message becomes one dialogue node
3. Nodes auto-connected in sequence
4. Metadata preserved (tutorialId, trigger, once, delay)
5. Nodes laid out visually (200px vertical spacing per tutorial)

**Example:**
```javascript
// tutorialScripts.json
{
  "game_start": {
    "messages": [
      { "text": "Message 1", "delay": 2000 },
      { "text": "Message 2", "delay": 0 }
    ]
  }
}

// Converts to:
{
  "nodes": [
    { id: 0, type: "dialogue", data: { text: "Message 1", delay: 2000 } },
    { id: 1, type: "dialogue", data: { text: "Message 2", delay: 0 } }
  ],
  "connections": [
    { id: 0, fromId: 0, toId: 1 }
  ]
}
```

### Sargem Nodes → tutorialScripts.json

**Tool:** `TutorialToSargemParser.convertFromNodes()`

**Process:**
1. Groups nodes by `tutorialId` metadata
2. Sorts nodes by connection order
3. Extracts trigger/once from first node
4. Converts nodes back to message array
5. Recreates tutorial structure

---

## 💾 Backup System

**Location:** `localStorage` with timestamp keys
**Format:** `tutorial_backup_YYYY-MM-DDTHH-MM-SS`

**Tools:**
```javascript
// Create backup
TutorialToSargemParser.createBackup(tutorialData);

// List all backups
TutorialToSargemParser.listBackups();

// Restore backup
const data = TutorialToSargemParser.restoreBackup('tutorial_backup_2025-01-15T10-30-00');
```

---

## 📊 Summary Table

| Feature | tutorialScripts.json | Sargem Nodes | QuestRunner |
|---------|---------------------|--------------|-------------|
| **Visual Editing** | ❌ | ✅ | ❌ |
| **Branching** | ❌ | ✅ | ✅ |
| **Multiple Node Types** | ❌ (dialogue only) | ✅ (7 types) | ✅ (7 types) |
| **Auto-save** | ❌ | ✅ | N/A |
| **Trigger-based** | ✅ | ✅ (preserved) | ❌ |
| **Runtime Execution** | ✅ | ❌ | ✅ |
| **Storage** | File | localStorage | Memory |
| **Used By** | TutorialScriptSystem | SargemQuestEditor | QuestRunner |

---

## 🎯 Workflow

1. **Create tutorials** in `tutorialScripts.json` (simple format)
2. **Load into Sargem** using "📚 Load Tutorial" button
3. **Edit visually** with nodes and connections
4. **Test** using "▶️ Test Quest" button (runs in QuestRunner)
5. **Save** back to Sargem format (localStorage or file)
6. *(Optional)* **Export** back to tutorialScripts.json format

---

## 🔧 Key Technical Details

### Connection Property Names

⚠️ **Important:** Sargem uses `fromId` and `toId` for connections.

```javascript
// Correct (Sargem format)
{ fromId: 0, toId: 1 }

// Incorrect (old format)
{ from: 0, to: 1 }
```

### Node ID Assignment

- **tutorialScripts.json**: No IDs (sequential messages)
- **Sargem**: Auto-incrementing integer IDs starting from 0
- **QuestRunner**: Uses same IDs from Sargem

### Canvas Size

- **Original**: 3000x3000px
- **Updated**: 10000x10000px (to fit all 17 tutorials)

### Grid Layout

- **X-axis**: `startX + (messageIndex * 200)`
- **Y-axis**: `startY + (tutorialIndex * 200)`
- **Node size**: 150px width

---

## 📝 Notes

- **Backups are automatic** when loading tutorialScripts.json into Sargem
- **Autosave runs every 30 seconds** in Sargem editor
- **QuestRunner supports both old and new connection formats** (fromId/toId and sourceId/targetId)
- **TutorialScriptSystem** only uses original tutorialScripts.json format (not Sargem)
