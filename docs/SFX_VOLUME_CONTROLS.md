# 🔊 Sound Effects Volume Controls - Quick Reference

**Status**: ✅ IMPLEMENTED  
**Date**: October 20, 2025

---

## 🎹 Hotkey Controls

### Music Controls (unchanged)
```
=  or  +     Volume Up
-            Volume Down
0            Toggle Mute
```

### Sound Effects Controls (NEW!)
```
Ctrl + =     SFX Volume Up
Ctrl + -     SFX Volume Down
Ctrl + 0     Toggle SFX Mute
```

### Debug Test (NEW!)
```
Ctrl + G     Test Ghost.ogg sound (non-spatial, full volume)
```

---

## 🧪 Testing Instructions

### Step 1: Test If Ghost.ogg Loads
1. **Check console** - Should see: `🔊 ✅ Sound loaded: ghost`
2. If you see `❌ Failed to load sound: ghost` - file path is wrong

### Step 2: Test Manual Sound
1. Press **Ctrl + G** in-game
2. Should hear ghost sound immediately (non-spatial)
3. Status message: "🔊 Testing Ghost.ogg sound..."
4. Console: `🔊 Testing ghost sound (non-spatial)...`

### Step 3: Test Volume Controls
1. Press **Ctrl + =** several times (volume up)
   - Status message shows: "🔊 SFX Volume: 80%", "90%", "100%"
2. Press **Ctrl + -** several times (volume down)
   - Status message shows: "🔊 SFX Volume: 60%", "50%", etc.
3. Press **Ctrl + 0** (toggle mute)
   - Status message: "🔊 SFX: MUTED" or "🔊 SFX: UNMUTED"

### Step 4: Test Spatial Sound
1. Find a ghost in-game (ruin or forest at night)
2. Make sure SFX not muted (Ctrl + 0 if needed)
3. Set volume high (Ctrl + = a few times)
4. Get within 30 blocks of ghost
5. Should hear ghost sound every 8 seconds

---

## 🐛 Troubleshooting

### "I pressed Ctrl+G but hear nothing"

**Possible causes:**

1. **SFX is muted**
   - Press **Ctrl + 0** to unmute
   - Status shows "🔊 SFX: UNMUTED"

2. **Volume is at 0%**
   - Press **Ctrl + =** multiple times
   - Status shows volume increasing

3. **Ghost.ogg didn't load**
   - Check console for error: `❌ Failed to load sound: ghost`
   - File path might be wrong (`sfx/Ghost.ogg`)

4. **Browser audio blocked**
   - Some browsers block audio until user interaction
   - Click in game first, then try Ctrl+G

### "Music drowns out SFX"

**Solution:**
1. Lower music: Press **-** key (without Ctrl) several times
2. Raise SFX: Press **Ctrl + =** several times
3. Recommended balance:
   - Music: 40-60%
   - SFX: 70-90%

### "Ctrl+G does nothing"

**Check:**
- Are you in text input mode? (quest, crafting, etc.)
- Try pressing Escape first, then Ctrl+G
- Check console for any JavaScript errors

---

## 📊 Default Volumes

```javascript
Music:  50%  (default from MusicSystem)
SFX:    70%  (default from SoundEffectsSystem)
```

Both saved to localStorage:
- `music_volume`
- `sfx_volume`

---

## 🔍 Console Messages to Watch For

### Successful Load:
```
🔊 Preloading sound: ghost → sfx/Ghost.ogg
🔊 ✅ Sound loaded: ghost
🔊 Sound effects preloaded: zombie, cat, ghost
```

### Failed Load:
```
🔊 Preloading sound: ghost → sfx/Ghost.ogg
🔊 ❌ Failed to load sound: ghost [Error details]
```

### Volume Changes:
```
🔊 SFX Volume: 80%
🔊 SFX Mute: ON
🔊 SFX Mute: OFF
```

### Test Sound:
```
🔊 Testing ghost sound (non-spatial)...
🔊 Playing: ghost (instance: 0, volume: 80%)
```

### Spatial Sound (in-game):
```
🔊 Playing spatial: ghost (volume: 45%)  ← Distance-based
```

---

## 🎮 Testing Workflow

### Quick Test (30 seconds):
1. Start game
2. Press **Ctrl + G** → Should hear ghost sound
3. Press **Ctrl + -** three times → Sound quieter
4. Press **Ctrl + =** three times → Sound louder
5. Press **Ctrl + 0** → Sound muted
6. Press **Ctrl + 0** → Sound unmuted
7. ✅ Controls work!

### Full Test (5 minutes):
1. Quick test (above)
2. Find ghost at ruin/forest
3. Approach slowly
4. Listen for spatial sound (8s intervals)
5. Move away → Volume decreases
6. Move closer → Volume increases
7. ✅ Spatial audio works!

---

## 🎯 Expected Results

### If Everything Works:
- ✅ Ctrl+G plays ghost sound immediately
- ✅ Volume controls change loudness
- ✅ Mute completely silences SFX (music still plays)
- ✅ Status messages confirm changes
- ✅ Console shows "Playing: ghost"

### If Ghost.ogg Doesn't Load:
- ❌ Console shows error
- ❌ Ctrl+G does nothing
- ❌ No spatial sounds in-game

**Fix:** Check file path in VoxelWorld.js:
```javascript
this.soundEffects.preloadBatch({
    'zombie': 'sfx/Zombie.ogg',
    'cat': 'sfx/CatMeow.ogg',
    'ghost': 'sfx/Ghost.ogg'  // ← Make sure this matches file location
});
```

---

## 💡 Pro Tips

1. **Balance Music vs SFX**
   - Music: 40-50% (ambient, less intrusive)
   - SFX: 70-80% (important feedback)

2. **Test before hunting ghosts**
   - Use Ctrl+G to verify audio works
   - Adjust volume before exploring

3. **Mute SFX during building**
   - Press Ctrl+0 to focus on music
   - Press Ctrl+0 again to re-enable

4. **Music too loud?**
   - Press **-** (without Ctrl) to lower music
   - Independent from SFX volume

---

## 🔧 Technical Details

### File Modified:
- `src/VoxelWorld.js` (lines ~11896-11923)

### Changes Made:
```javascript
// Added SFX volume controls
Ctrl + =  → this.soundEffects.volumeUp()
Ctrl + -  → this.soundEffects.volumeDown()
Ctrl + 0  → this.soundEffects.toggleMute()

// Added test sound
Ctrl + G  → this.soundEffects.play('ghost', { volume: 0.8 })
```

### Why Ctrl Modifier?
- Music uses bare keys (=, -, 0)
- SFX uses Ctrl+keys for same keys
- Familiar pattern, easy to remember
- Prevents accidental SFX volume changes

---

## 📝 Notes

- SFX volume persists between sessions (localStorage)
- Music and SFX volumes are independent
- Test sound (Ctrl+G) plays at 80% volume regardless of settings
- Spatial sounds respect volume/mute settings
- Cooldowns prevent audio spam (8-10 seconds)

---

**Ready to test! Press Ctrl+G in-game to hear ghost sound.** 🔊👻
