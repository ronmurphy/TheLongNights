# RandyM Structure Designer - Fixes (October 18, 2025)

## Issues Fixed

### 1. ✅ Ctrl+Mouse Tilt Not Working Properly

**Problem:** The vertical tilt with Ctrl+Drag was being blocked when X-axis was locked, which didn't make sense.

**Root Cause:** The code was checking `if (!this.axisLocks.x)` before allowing vertical tilt. Axis locks are meant for WASD camera panning, not for Ctrl+Drag rotation/tilt.

**Fix:** Removed the X-axis lock check from vertical tilt. Now Ctrl+Drag vertical movement always works for tilting the camera up/down.

```javascript
// Before (WRONG):
if (!this.axisLocks.x) {
    this.cameraTilt -= deltaY * 0.01;
}

// After (CORRECT):
// Vertical tilt - not affected by axis locks
this.cameraTilt -= deltaY * 0.01;
```

### 2. ✅ Block Placement in Gaps Between Blocks

**Problem:** When trying to place a block in a space between existing blocks, the preview/reticle wouldn't snap to the gap properly. It would only work on top of blocks or on the ground.

**Root Cause:** The raycasting logic was using face normals incorrectly in `updatePreview()`, always placing on top instead of adjacent to clicked faces.

**Fix:** 
- Updated `updatePreview()` to use face normals properly for adjacent placement
- Improved `getPlacementPosition()` to check both ground plane and blocks in one pass
- Now correctly places blocks adjacent to any face of existing blocks

```javascript
// Now uses face normal to place adjacent:
if (intersect.object !== this.groundPlane && intersect.face) {
    const normal = intersect.face.normal;
    const blockPos = intersect.object.position;
    
    // Calculate position adjacent to the hit face
    x = Math.floor(blockPos.x) + normal.x + 0.5;
    y = Math.floor(blockPos.y) + normal.y + 0.5;
    z = Math.floor(blockPos.z) + normal.z + 0.5;
}
```

### 3. ✅ Axis Lock Confusion (X/Y/Z Toggles)

**Problem:** User was confused about what the axis locks actually do, especially during Shift+vertical adjustment.

**Root Cause:** Documentation and UI text didn't clearly explain that axis locks control WASD camera panning and Y-axis controls horizontal rotation, NOT vertical tilt.

**Fix:**
- Updated documentation to clarify:
  - **X-Lock**: Prevents A/D horizontal panning
  - **Y-Lock**: Prevents Ctrl+Drag horizontal rotation
  - **Z-Lock**: Prevents W/S forward/back panning
  - **Ctrl+Drag Vertical Tilt**: Always works (not affected by axis locks)
  
- Updated in-game info text in the axis lock section
- Added note that Ctrl+Drag tilt always works

### 4. ✅ Shift+Vertical Adjustment Axis Locking

**Status:** This was actually working correctly!

**How It Works:**
1. Click to set first point
2. Hold Shift to enter vertical adjustment mode
3. System automatically locks X and Z axes (saving previous state)
4. Mouse movement only affects Y height
5. Release Shift to restore previous axis lock state

**Note:** The visual toggles correctly show the locked state when Shift is held. The confusion was about what the axis locks control (camera pan vs. rotation).

---

## Testing Instructions

1. **Test Ctrl+Drag Tilt:**
   - Open designer
   - Hold Ctrl and drag mouse up/down
   - Camera should tilt smoothly regardless of axis lock settings
   - Try locking X-axis and verify tilt still works

2. **Test Block Placement in Gaps:**
   - Build two blocks with a 1-block gap between them
   - Hover mouse in the gap on a block's face
   - Preview should appear in the gap adjacent to the clicked face
   - Left-click should place block in the gap

3. **Test Axis Locks:**
   - Lock X-axis → A/D keys should not pan camera
   - Lock Y-axis → Ctrl+Drag horizontal should not rotate
   - Lock Z-axis → W/S keys should not pan camera
   - Ctrl+Drag vertical should ALWAYS tilt camera

4. **Test Shift+Vertical Adjustment:**
   - Select a shape tool (e.g., Fill Cube)
   - Click first point
   - Hold Shift and move mouse up/down
   - Notice X and Z axis toggles light up (auto-locked)
   - Preview should only grow vertically
   - Release Shift → axis toggles return to previous state

---

## Changed Files

1. `/src/ui/RandyMStructureDesigner.js`
   - Fixed Ctrl+Drag tilt axis lock check
   - Improved block placement raycasting
   - Updated axis lock info text

2. `/docs/RANDYM_STRUCTURE_DESIGNER.md`
   - Clarified axis lock descriptions
   - Added note about vertical tilt always working

---

## Known Behavior (Not Bugs)

These are intentional design choices:

1. **Axis Locks Control Camera Pan, Not Rotation Tilt**
   - X/Z locks affect WASD movement
   - Y lock affects Ctrl+Drag horizontal rotation
   - Ctrl+Drag vertical tilt is ALWAYS available (needed for viewing structures from different angles)

2. **Shift Auto-Locks X/Z During Vertical Adjustment**
   - This is intentional for precise height control
   - Prevents accidental horizontal drift
   - Auto-restores when Shift is released

3. **Preview Block Snaps to Grid**
   - All blocks snap to integer coordinates
   - This is for clean alignment and voxel-based building

---

## Future Enhancements (Optional)

- [ ] Add visual indicator showing which axis locks are active
- [ ] Add tooltip hints when hovering axis lock toggles
- [ ] Consider separate "Rotation Lock" and "Pan Lock" sections
- [ ] Add keyboard shortcuts for axis locks (e.g., X key for X-lock)

---

Randy would approve of these fixes! 🐱✨
