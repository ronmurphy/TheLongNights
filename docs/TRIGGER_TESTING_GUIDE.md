# 🧪 Trigger Node Testing Guide

**Ready to test all trigger functionality!**

## Quick Console Tests

Open the game, press **F12** for console, then try these:

### 🔊 Sound Effects

```javascript
// Play zombie sound
playSFX('zombie')

// Play with random pitch variation
playSFX('zombie', true)

// Play cat meow
playSFX('cat')

// Play ghost sound
playSFX('ghost')

// Check SFX stats
sfxSystem.getStats()

// Adjust volume
sfxSystem.volumeUp()
sfxSystem.volumeDown()
sfxSystem.setVolume(0.8)
```

### 🎵 Music (Already Working)

```javascript
// Play music
voxelWorld.musicSystem.play('music/forestDay.ogg')

// Stop music
voxelWorld.musicSystem.stop()
```

---

## Sargem Quest Testing

### Test Quest: Full Trigger Showcase

**Create this quest in Sargem (Ctrl+S):**

1. **Node 1: Dialogue**
   - Speaker: `companion`
   - Text: `"Listen carefully... I'm going to demonstrate all trigger types!"`

2. **Node 2: Trigger (playMusic)**
   - Event Type: `playMusic`
   - Params: `{ "trackPath": "music/forestNight.ogg" }`

3. **Node 3: Dialogue**
   - Text: `"Hear that? The music changed to night theme!"`

4. **Node 4: Trigger (playSound)**
   - Event Type: `playSound`
   - Params: `{ "soundId": "zombie", "variation": true }`

5. **Node 5: Dialogue**
   - Text: `"Did you hear that zombie growl?!"`

6. **Node 6: Trigger (setFlag)**
   - Event Type: `setFlag`
   - Params: `{ "flag": "trigger_test_complete", "value": true }`

7. **Node 7: Trigger (showStatus)**
   - Event Type: `showStatus`
   - Params: `{ "message": "🎉 All triggers working!", "type": "discovery" }`

8. **Node 8: Trigger (setTime)**
   - Event Type: `setTime`
   - Params: `{ "hour": 19.0 }`

9. **Node 9: Dialogue**
   - Text: `"Look! It's now 7 PM! All triggers are working perfectly!"`

10. **Node 10: End**

**Connect them in sequence**: 1→2→3→4→5→6→7→8→9→10

---

## Expected Results

### ✅ What Should Happen:

1. **Music Changes**: Background music switches to night theme
2. **Zombie Sound**: Hear growl with random pitch
3. **Flag Set**: Check console: `🚩 Set flag: trigger_test_complete = true`
4. **Status Message**: Green notification appears: "🎉 All triggers working!"
5. **Time Changes**: Sky becomes evening (7 PM)
6. **Quest Completes**: Chat closes, controls restored

---

## Individual Trigger Tests

### 🎵 playMusic

```
Event Type: playMusic
Params: { "trackPath": "music/forestDay.ogg" }
```

**Expected**: Music changes to day theme, status message appears

### 🔊 playSound

```
Event Type: playSound
Params: { "soundId": "cat", "variation": false }
```

**Expected**: Cat meow plays once

### 🚩 setFlag

```
Event Type: setFlag
Params: { "flag": "test_flag", "value": true }
```

**Expected**: Console shows flag set, saved to localStorage

### 👤 spawnNPC

```
Event Type: spawnNPC
Params: {
  "npcId": "test_goblin",
  "emoji": "👹",
  "name": "Test Goblin",
  "x": 10,
  "y": 5,
  "z": 0,
  "scale": 1.5
}
```

**Expected**: Goblin appears at coordinates, status message

### 📢 showStatus

```
Event Type: showStatus
Params: {
  "message": "This is a test!",
  "type": "info"
}
```

**Expected**: Blue status message at top of screen

### 🌀 teleport

```
Event Type: teleport
Params: { "x": 0, "y": 10, "z": 0 }
```

**Expected**: Player moves to spawn area, status message

### ⏰ setTime

```
Event Type: setTime
Params: { "hour": 0.0 }
```

**Expected**: Sky becomes midnight, lighting changes

---

## Debugging

### Check SFX Loaded:
```javascript
sfxSystem.getStats()
```

Should show:
```
{
  totalSounds: 3,
  currentlyPlaying: 0,
  sounds: [
    { id: 'zombie', path: 'sfx/Zombie.ogg', playCount: 0, isPlaying: false },
    { id: 'cat', path: 'sfx/CatMeow.ogg', playCount: 0, isPlaying: false },
    { id: 'ghost', path: 'sfx/Ghost.ogg', playCount: 0, isPlaying: false }
  ]
}
```

### Check Quest Flags:
```javascript
// In console after setting flags
JSON.parse(localStorage.getItem('questFlags'))
```

### Test Music System:
```javascript
voxelWorld.musicSystem.volume // Should be 0.0-1.0
voxelWorld.musicSystem.isPlaying // Should be true/false
```

---

## Common Issues

### "Sound not preloaded"
- Restart game (sounds preload on init)
- Check console for load errors

### Music doesn't change
- Check volume: `voxelWorld.musicSystem.volumeUp()`
- Check if muted: `voxelWorld.musicSystem.toggleMute()`

### Status message doesn't show
- Message might be too fast
- Try longer text

### Time doesn't change
- Check day/night cycle is enabled
- Look at sky - lighting should change

---

## Success Criteria

✅ **All 10 trigger types work:**
1. ✅ playMusic - Changes background music
2. ✅ stopMusic - Silences music
3. ✅ playSound - Plays one-shot SFX
4. ✅ setFlag - Persists to localStorage
5. ✅ spawnNPC - Creates NPC entity
6. ✅ removeNPC - Deletes NPC
7. ✅ showStatus - Displays notification
8. ✅ teleport - Moves player
9. ✅ setTime - Changes world time
10. ⚠️ setWeather - Placeholder (shows message)

✅ **Sargem UX:**
- Dropdown shows all events
- Auto-fill works for each type
- Help text displays correctly
- Parameters editable

✅ **Console Commands:**
- `playSFX('zombie')` works
- `sfxSystem.getStats()` shows data
- `voxelWorld.musicSystem` accessible

---

## Next Steps After Testing

Once all triggers work:

1. **Add more sounds** to `/assets/sfx/`
2. **Test in real quests** (companion intro, etc.)
3. **Wire SFX into combat** (zombie hits, player damage)
4. **Wire SFX into animals** (cat meow on interact)
5. **Implement Condition Node** (check flags set by triggers)
6. **Implement Combat Node** (final quest node type)

---

**Ready to test!** 🚀

Start the game, open Sargem (Ctrl+S), create the test quest, and see all triggers in action!
