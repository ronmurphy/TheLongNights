# 🐈‍⬛ Sargem & RandyM Editor Fixes

**Date:** October 19, 2025  
**Issues Addressed:**
1. Text input areas in Sargem properties panel only working when dev console is open
2. Hotbar and other input handlers not being disabled when Sargem/RandyM are open
3. Electron View menu not calling the editors properly

---

## 🔧 Problems Identified

### 1. Text Input Accessibility Issue
**Problem:** Input fields in Sargem's properties panel were not receiving focus/clicks unless the dev console was open.

**Root Cause:**
- Input elements lacked explicit `pointer-events: auto`
- No z-index positioning relative to canvas/parent
- Click events were being captured by canvas or parent containers
- No explicit event stopPropagation on input elements

**Solution Applied:**
```javascript
// Added to all input, textarea, and select elements
input.style.cssText = `
    ...existing styles...
    pointer-events: auto;
    position: relative;
    z-index: 10;
`;

// Added explicit click and focus handlers
input.onclick = (e) => {
    e.stopPropagation();
    input.focus();
};
input.onfocus = (e) => {
    e.stopPropagation();
};
```

### 2. Input Handlers Not Disabled
**Problem:** Hotbar number keys (1-8) and mouse wheel were responding even when `controlsEnabled = false`.

**Root Cause:**
- Keyboard events from Sargem/RandyM weren't calling `event.stopPropagation()`
- Events were bubbling up to the game's keyboard handlers
- While `controlsEnabled` checks were in place, events were still propagating

**Solution Applied:**

#### Sargem Quest Editor
```javascript
document.addEventListener('keydown', (e) => {
    if (!this.isOpen) return;
    
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );
    
    if (isTyping) {
        // Stop propagation for ALL keys when typing
        e.stopPropagation();
        if (e.key === 'Escape') {
            activeElement.blur();
            return;
        }
        return;
    }
    
    // NOT typing - prevent ALL keys from reaching the game
    e.stopPropagation();
    e.preventDefault();
    
    if (e.key === 'Escape') this.close();
    // ... rest of shortcuts
});
```

#### RandyM Structure Designer
```javascript
handleKeyDown(event) {
    if (!this.isOpen) return;
    
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );
    
    if (isTyping) {
        event.stopPropagation();
        return;
    }
    
    // Stop all key events from reaching the game
    event.stopPropagation();
    
    // ... rest of handler
}
```

#### Hotbar System Checks (Already in place, working correctly)
```javascript
setupNumberKeySelection() {
    document.addEventListener('keydown', (e) => {
        if (!this.hotbarElement || this.hotbarElement.style.display === 'none') return;
        if (this.voxelWorld.isPaused) return;
        if (!this.voxelWorld.controlsEnabled) return; // ✅ Blocks when editors open
        // ... handle keys
    });
}

setupMouseWheelNavigation() {
    document.addEventListener('wheel', (e) => {
        if (!this.hotbarElement || this.hotbarElement.style.display === 'none') return;
        if (this.voxelWorld.isPaused) return;
        if (!this.voxelWorld.controlsEnabled) return; // ✅ Blocks when editors open
        // ... handle wheel
    }, { passive: false });
}
```

### 3. Electron Menu Integration
**Problem:** Ctrl+S and Ctrl+M shortcuts from Electron View menu weren't opening the editors.

**Root Cause:**
- Electron menu was looking for wrong property names:
  - Looking for `voxelWorld.sargemQuestEditor` → Actual: `voxelWorld.sargemEditor`
  - Looking for `voxelWorld.randyMStructureDesigner` → Actual: `voxelWorld.randyMDesigner`

**Solution Applied:**
```javascript
// electron.cjs - View Menu
{
  label: 'Sargem Quest Editor',
  accelerator: 'CmdOrCtrl+S',
  click: () => {
    mainWindow.webContents.executeJavaScript(`
      if (window.voxelWorld && window.voxelWorld.sargemEditor) {
        window.voxelWorld.sargemEditor.open();
      } else {
        console.error('❌ Sargem Quest Editor not initialized');
      }
    `);
  }
},
{
  label: 'RandyM Structure Designer',
  accelerator: 'CmdOrCtrl+M',
  click: () => {
    mainWindow.webContents.executeJavaScript(`
      if (window.voxelWorld && window.voxelWorld.randyMDesigner) {
        window.voxelWorld.randyMDesigner.open();
      } else {
        console.error('❌ RandyM Structure Designer not initialized');
      }
    `);
  }
}
```

---

## ✅ Changes Summary

### Files Modified

1. **`src/ui/SargemQuestEditor.js`**
   - Added `pointer-events: auto` and `z-index: 10` to input/textarea/select elements
   - Added click and focus handlers with `stopPropagation()`
   - Enhanced keyboard event handler to call `stopPropagation()` for all keys

2. **`src/ui/RandyMStructureDesigner.js`**
   - Enhanced `handleKeyDown()` to check for typing and call `stopPropagation()`
   - Added `pointer-events: auto` and `z-index: 10` to save modal input
   - Added click and focus handlers with `stopPropagation()` to input

3. **`electron.cjs`**
   - Fixed property names in View menu shortcuts
   - Added error logging when systems aren't initialized

4. **`src/HotbarSystem.js`** *(No changes needed - already correct)*
   - Confirmed `controlsEnabled` checks are in place
   - Both number key and mouse wheel handlers properly gate on `controlsEnabled`

---

## 🧪 Testing Checklist

- [ ] Open Sargem with Ctrl+S from Electron menu
- [ ] Open RandyM with Ctrl+M from Electron menu
- [ ] Click in text input in Sargem properties panel (should work without dev console)
- [ ] Type in text area in Sargem (text should appear, hotbar keys 1-8 should not fire)
- [ ] Try mouse wheel while Sargem is open (should NOT change hotbar selection)
- [ ] Try number keys 1-8 while Sargem is open (should NOT select hotbar slots)
- [ ] Press Escape in text input (should unfocus input, not close editor)
- [ ] Press Escape outside text input (should close editor)
- [ ] Test RandyM save modal input field (should be clickable and typeable)
- [ ] Verify WASD keys in RandyM move camera, not game character

---

## 🎯 Expected Behavior

### When Sargem/RandyM is Open:
✅ `controlsEnabled` is set to `false`  
✅ Keyboard events call `stopPropagation()` to prevent bubbling to game  
✅ Hotbar handlers check `controlsEnabled` and exit early  
✅ Input fields have `pointer-events: auto` and can receive focus  
✅ Input fields stop event propagation when clicked/focused  
✅ Game hotkeys (1-8, mouse wheel, WASD) are blocked  
✅ ESC key unfocuses inputs first, then closes editor on second press  

### When Sargem/RandyM is Closed:
✅ `controlsEnabled` is set to `true`  
✅ Game keyboard handlers function normally  
✅ Hotbar keys (1-8) and mouse wheel work  
✅ Player can move with WASD  

---

## 📝 Technical Notes

### Event Propagation Chain
```
User presses key
    ↓
Sargem/RandyM keydown handler (calls stopPropagation)
    ↓ (stopped here)
    ✗ Does not reach VoxelWorld keydownHandler
    ✗ Does not reach HotbarSystem handlers
```

### Without stopPropagation (old behavior):
```
User presses "1"
    ↓
Sargem keydown handler (no stopPropagation)
    ↓
VoxelWorld keydownHandler (checks controlsEnabled = false, returns)
    ↓
HotbarSystem keydown handler (checks controlsEnabled = false, returns)
    ↓
❌ But event still bubbled through multiple handlers
```

### With stopPropagation (new behavior):
```
User presses "1"
    ↓
Sargem keydown handler (calls stopPropagation)
    ✓ Event stops here
✅ Cleaner, more efficient
```

---

## 🚀 Future Improvements

1. **Input Field Focus Styling**
   - Add visual indication when input is focused
   - Consider blue border or shadow effect

2. **Tab Navigation**
   - Verify tab order works correctly in properties panel
   - Add tabindex if needed

3. **Touch/Mobile Support**
   - Ensure touch events work on inputs
   - Test on touchscreen devices

4. **Accessibility**
   - Add ARIA labels to input fields
   - Ensure screen readers can navigate properly

---

**Author:** Claude (with Brad)  
**Status:** ✅ Fixed and Ready for Testing
