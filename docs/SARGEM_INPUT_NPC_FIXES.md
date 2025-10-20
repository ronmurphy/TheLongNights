# 🐈‍⬛ Sargem Input & NPC Spawn Fixes

**Date:** October 19, 2025  
**Issues Fixed:**
1. Text inputs in properties panel requiring dev console to be open to type
2. Spawned NPCs immediately despawning

---

## 🔧 Issue 1: Input Fields Requiring Dev Console

### Problem
User had to open the dev console to be able to type in the properties textboxes when Sargem is active.

### Root Cause
The canvas container's event handlers (`onmousedown`, `onclick`) were capturing all mouse events, including clicks on input fields in the properties panel. The properties panel is a sibling to the canvas container, but the canvas event handlers were interfering.

**Why dev console "fixed" it:** Opening dev console forces a repaint/focus shift that can sometimes allow inputs to receive focus as a side effect.

### Solution
Added explicit event isolation to the properties panel:

```javascript
createPropertiesPanel() {
    const panel = document.createElement('div');
    panel.id = 'sargem-properties';
    panel.style.cssText = `
        width: 300px;
        background: #252526;
        border-left: 1px solid #3e3e42;
        padding: 20px;
        overflow-y: auto;
        pointer-events: auto;      // ← ADDED: Explicitly enable pointer events
        position: relative;         // ← ADDED: Position context
        z-index: 100;              // ← ADDED: Above canvas
    `;
    
    // Prevent canvas panning when interacting with properties panel
    panel.onmousedown = (e) => {
        e.stopPropagation();       // ← ADDED: Stop event from reaching canvas
    };
    panel.onclick = (e) => {
        e.stopPropagation();       // ← ADDED: Stop event from reaching canvas
    };
    
    // ... rest of panel creation
}
```

**Key Changes:**
1. ✅ `pointer-events: auto` - Explicitly enables mouse interaction
2. ✅ `z-index: 100` - Ensures panel is above canvas in stacking context
3. ✅ `onmousedown` and `onclick` with `stopPropagation()` - Prevents canvas handlers from capturing events

---

## 🔧 Issue 2: Spawned NPCs Immediately Despawning

### Problem
When testing a quest with a single trigger node (spawnNPC), the NPC spawns and immediately despawns:

```
✅ Start node found: 1 (trigger)
⚡ Triggering event: spawnNPC
👤 Spawning NPC: goblin "Grik"
   ✅ NPC spawned with ID: quest_npc_goblin_1760916833627
✅ Quest complete - end of chain
🛑 Stopping quest
👋 Removed NPC: Grik    ← ❌ REMOVED IMMEDIATELY!
```

### Root Cause
The `executeTrigger()` method was calling `goToNext(node)` unconditionally after executing any trigger event. If there was no next node, `goToNext()` would call `stopQuest()`, which calls `cleanupNPCs()`, removing all quest-spawned NPCs including the one that just spawned.

**Old Code:**
```javascript
executeTrigger(node) {
    // ... execute trigger (spawn NPC)
    this.triggerSpawnNPC(params);
    
    // Continue to next node immediately (triggers are non-blocking)
    this.goToNext(node);  // ← Always called, even if no next node!
}

goToNext(currentNode, outputIndex = 0) {
    const nextNode = this.getNextNode(currentNode, outputIndex);
    
    if (nextNode) {
        this.executeNode(nextNode);
    } else {
        console.log('✅ Quest complete - end of chain');
        this.stopQuest();  // ← Cleans up NPCs!
    }
}
```

### Solution
Modified `executeTrigger()` to check if there's a next node before calling `goToNext()`. If there's no next node, mark the quest as paused but DON'T cleanup NPCs:

```javascript
executeTrigger(node) {
    // ... execute trigger (spawn NPC)
    
    // Check if there's a next node
    const hasNextNode = this.getNextNode(node) !== null;
    
    if (hasNextNode) {
        // Continue to next node (triggers are non-blocking)
        this.goToNext(node);
    } else {
        // No next node - trigger is terminal, just keep quest running
        // Don't call stopQuest() - let spawned NPCs persist
        console.log('🔚 Trigger node is terminal - quest paused (NPCs remain active)');
        this.isRunning = false; // Mark as not actively running, but don't cleanup
    }
}
```

**Benefits:**
- ✅ Single trigger nodes work correctly (spawn NPC, leave it there)
- ✅ Trigger chains still work (if there's a next node, continue)
- ✅ NPCs persist until manually removed or clicked (auto-remove on click)
- ✅ Quest is marked as "not running" but doesn't destroy its effects

**Note:** As of this fix, spawned NPCs now **automatically remove themselves when clicked** by the player. See `SARGEM_NPC_AUTO_REMOVE.md` for details.

---

## 📝 Testing Results

### Input Fields
✅ Click on text input in properties panel → Input receives focus  
✅ Type in text input → Characters appear immediately  
✅ No need to open dev console  
✅ Mouse events don't trigger canvas panning when clicking in properties panel  

### NPC Spawning
✅ Single trigger node spawns NPC → NPC persists  
✅ Trigger chain (trigger → dialogue → trigger) → All triggers execute, NPCs persist  
✅ Quest marked as paused after terminal trigger  
✅ NPCs remain interactable after quest "ends"  

---

## 🎯 Files Modified

1. **`src/ui/SargemQuestEditor.js`**
   - Added `pointer-events: auto` and `z-index: 100` to properties panel
   - Added `stopPropagation()` on panel mousedown and click events

2. **`src/quests/QuestRunner.js`**
   - Modified `executeTrigger()` to check for next node before calling `goToNext()`
   - Added terminal trigger handling (pause without cleanup)

---

## 📚 Technical Notes

### Event Propagation in Electron
In Electron apps, DOM events can be captured at multiple levels:
1. Target element (input field)
2. Parent containers (properties panel, modal)
3. Canvas/container with event handlers
4. Document-level handlers

Without `stopPropagation()`, events bubble up through all these levels. The canvas handlers were "seeing" clicks on inputs and preventing default focus behavior.

### Quest Runner State Machine
The quest runner now has three states:
1. **Running** (`isRunning = true`) - Actively executing nodes
2. **Paused** (`isRunning = false`, no cleanup) - Effects persist, waiting
3. **Stopped** (cleanup called) - All effects removed, NPCs destroyed

Terminal triggers now put the quest in "Paused" state rather than "Stopped".

---

## 🚀 Future Improvements

### For Input Fields
- [ ] Add visual focus indicators (blue border when focused)
- [ ] Add keyboard navigation (Tab between inputs)
- [ ] Consider making properties panel draggable/resizable

### For Quest NPCs
- [ ] Add explicit "cleanupQuestNPCs" trigger event
- [ ] Add option to mark NPCs as "permanent" (don't cleanup on quest stop)
- [ ] Add NPC persistence across game saves

---

**Author:** Claude (with Brad)  
**Status:** ✅ Fixed and Tested
