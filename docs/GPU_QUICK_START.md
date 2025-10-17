# 🎮 The Long Nights GPU Switches - Quick Guide

## 🪟 **Windows Users**

### Quick Setup (30 seconds):
1. Right-click **The Long Nights.exe**
2. Select "**Create shortcut**"
3. Right-click the shortcut → "**Properties**"
4. In "**Target**" field, add at the end:
   ```
   --force_high_performance_gpu --disable-gpu-vsync
   ```
5. Should look like:
   ```
   "C:\...\The Long Nights.exe" --force_high_performance_gpu --disable-gpu-vsync
   ```
6. Click "**OK**"
7. Use this shortcut to launch game

---

## 🐧 **Linux Users**

### Quick Setup (30 seconds):
1. Open terminal where The Long Nights is located
2. Make executable (first time only):
   ```bash
   chmod +x The Long Nights
   ```
3. Launch with switches:
   ```bash
   ./The Long Nights --force_high_performance_gpu --disable-gpu-vsync
   ```

Or create a launcher script:
```bash
echo '#!/bin/bash
cd /path/to/The Long Nights
./The Long Nights --force_high_performance_gpu --disable-gpu-vsync' > ~/launch-voxel.sh
chmod +x ~/launch-voxel.sh
~/launch-voxel.sh
```

---

## ✅ **Verify It's Working**

1. Launch game with switches
2. Press **F12** (Developer Tools)
3. Look for:
   ```
   🎮 GPU DETECTION REPORT:
   ✅ STATUS: dGPU requested and dGPU detected - MATCH! 🎯
   ```
4. If you see "✅ MATCH! 🎯" - **SUCCESS!** dGPU is being used
5. If you see "⚠️ WARNING: mismatch" - Need Windows Graphics Settings fix (see below)

---

## 🚨 **Still Using Wrong GPU? (Windows Only)**

Windows can override the switches. Fix:

1. **Windows Settings** > **System** > **Display** > **Graphics Settings**
2. Click "**Browse**"
3. Find and select **The Long Nights.exe**
4. Click "**Options**"
5. Select "**High Performance**"
6. Click "**Save**"
7. **Restart game**

---

## 📊 **Check FPS Improvement**

1. In game, click **View** menu > **FPS Counter**
2. Note your FPS before switches
3. Close game, add switches, relaunch
4. Check FPS again - should be higher!

**Typical improvements:**
- iGPU: 20-45 FPS
- dGPU with switches: 60-120 FPS

---

## ❓ **Problems?**

### Shortcut won't run (Windows)
- Make sure switches are OUTSIDE the quotes:
  - ✅ Correct: `"C:\...\The Long Nights.exe" --force_high_performance_gpu`
  - ❌ Wrong: `"C:\...\The Long Nights.exe --force_high_performance_gpu"`

### Command not found (Linux)
- Use full path: `/full/path/to/The Long Nights --force_high_performance_gpu`
- Or navigate there first: `cd /path/to/The Long Nights` then `./The Long Nights --switches`

### Switches don't work
- Check Windows Graphics Settings (overrides switches)
- Make sure you're using the shortcut/command with switches
- Try restarting your computer

---

## 🎯 **That's It!**

For more details, see `COMMAND_LINE_SWITCHES.md` in the docs folder.

---

**Quick Test Checklist:**
- [ ] Created shortcut/launcher with switches
- [ ] Launched game with switches
- [ ] Pressed F12 to check GPU Detection Report
- [ ] Verified "✅ MATCH! 🎯" appears
- [ ] Enabled FPS counter (View > FPS Counter)
- [ ] Noted FPS improvement
