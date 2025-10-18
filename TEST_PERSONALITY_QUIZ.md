# 🎭 Testing the Personality Quiz

## How to Test

### Recommended: Use Existing Clear Functions
```javascript
// Nuclear option - wipes everything and reloads
window.voxelApp.nuclearClear();

// Or just clear caches (preserves saves)
window.voxelApp.clearCaches();
// Then manually remove player data:
localStorage.removeItem('NebulaWorld_playerData');
location.reload();
```

### Alternative: Manual Clear in Browser
1. Open DevTools (F12)
2. Go to Application tab
3. Storage → Local Storage → your site
4. Delete `NebulaWorld_playerData` key
5. Refresh page (F5)

## What Should Happen

1. **Game loads** → Shows splash screen
2. **World initializes** → Generates terrain
3. **Quiz starts** → "Before your journey begins..." message
4. **Question 1** → "What keeps someone alive in the wild?" (4 buttons in 2x2 grid)
5. **Question 2** → "If you could only carry one thing?" (4 buttons)
6. **Question 3** → "Which heritage calls to you?" (4 buttons)
7. **Question 4** → "Who would you trust?" (4 buttons)
8. **Results logged** → Check console for character summary
9. **Companion selection** → Normal intro overlay
10. **Tutorial chat** → Companion talks about backpack
11. **Game starts** → Play as normal

## Expected Console Output

After completing the quiz, you should see:

```
═══════════════════════════════════════
🎭 PERSONALITY QUIZ RESULTS
═══════════════════════════════════════
Race: ELF
Level: 1
Stats: STR 1, DEX 6, VIT 2, LCK 2
HP: 6/6
Stamina: 100/100
Starting Items: watering_can
Preferred Companion: rat
═══════════════════════════════════════
```

(Values will vary based on your choices!)

## Debugging

### If quiz doesn't appear:
1. Check console for errors
2. Verify `assets/data/personalityQuiz.json` exists
3. Check that `hasPlayerData` is `false` in App.js
4. Make sure localStorage is empty

### If quiz appears but choices don't work:
1. Check browser console for JavaScript errors
2. Verify QuestRunner loaded correctly
3. Check that buttons are clickable (not covered by other elements)

### If character stats are wrong:
1. Check console logs for "Choice tracked" messages
2. Verify choice tracking object has all 4 questions
3. Check PlayerCharacter.processQuizAnswers() logic

## Current Implementation Status

✅ QuestRunner supports 4-choice grid layout
✅ personalityQuiz.json created with 4 questions
✅ PlayerCharacter processes quiz answers
✅ Stats calculated based on choices
✅ Race selection with bonuses/penalties
✅ Starting items distributed (logged to console)
✅ Integration into game start flow

⏳ Actually giving items to inventory (next step)
⏳ Player avatar UI component
⏳ Sprite layering system
