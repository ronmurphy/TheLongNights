# Console Commands for Testing

Open the Electron app's Developer Console (F12 or right-click → Inspect Element → Console tab)

## Bloodmoon Testing

### Quick Bloodmoon Setup
```javascript
bloodmoonTest()
```
- Sets day to 7 and time to 22:00 (10 PM)
- Bloodmoon will be ACTIVE
- Ready to test ranged weapons

### Individual Controls
```javascript
setDay(7)        // Set day of week (1-7)
setTime(22)      // Set time in 24-hour format (0-23)
```

Examples:
```javascript
setDay(7)        // Day 7 (the bloodmoon day)
setTime(22)      // 10 PM (when bloodmoon starts)
setTime(23)      // 11 PM (during bloodmoon)
setTime(0)       // Midnight (during bloodmoon)
setTime(1)       // 1 AM (during bloodmoon)
setTime(2)       // 2 AM (bloodmoon ends at 02:00)
```

## Item Spawning

### Get Ice Bow (for testing)
```javascript
giveItem('ice_bow')
```

### Get Any Tool or Item
```javascript
giveItem('crossbow')           // Ranged weapon
giveItem('fire_staff')         // Ranged weapon
giveItem('throwing_knives')    // Ranged weapon
giveItem('crafted_crossbow')   // Crafted version
giveItem('hoe')                // Farming tool
giveItem('watering_can')       // Farming tool
giveItem('backpack')           // Testing world items
```

## Enemy Spawning

### Start Bloodmoon Battle
```javascript
testCombat()                    // Spawns angry_ghost
testCombat('zombie_crawler')    // Specific bloodmoon enemy
```

## Bloodmoon Testing Flow

1. **Setup the time:**
   ```javascript
   bloodmoonTest()
   ```

2. **Get your ranged weapon:**
   ```javascript
   giveItem('ice_bow')
   ```

3. **Spawn enemies:**
   ```javascript
   testCombat('zombie_crawler')
   ```

4. **Test ranged weapons:**
   - Right-click directly on the enemy
   - Should fire projectile at close range
   - Enemy should take damage

## Bloodmoon Times

| Time | Hour | Phase |
|------|------|-------|
| Midnight | 0 | Active |
| 1 AM | 1 | Active |
| 1:59 AM | 1.59 | Active |
| 2 AM | 2 | ENDS |
| 10 PM | 22 | STARTS |
| 11 PM | 23 | Active |

- Bloodmoon is ACTIVE from 22:00 to 02:00
- Only on Day 7 (dayOfWeek = 7)
- Enemies spawn during this time

## What to Look For When Testing

✅ **Ranged Weapon Success:**
- Projectile appears when you right-click
- Projectile travels toward enemy
- Projectile hits enemy (visual effect)
- Enemy health decreases

❌ **If it doesn't work:**
- Check console for errors (F12)
- Make sure day is 7: `this.dayNightCycle.dayOfWeek`
- Make sure time is 22-23 or 0-1: `this.dayNightCycle.currentTime`
- Check if enemy has `isEnemy` flag: look at ranged weapon log output

## Debug Info

Check these in console:
```javascript
// Check current day/time
this.dayNightCycle.dayOfWeek    // Should be 7
this.dayNightCycle.currentTime  // Should be 22+

// Check if bloodmoon is active
this.dayNightCycle.bloodMoonActive  // Should be true

// Check active enemies
this.bloodMoonSystem.activeEnemies.size  // Number of enemies

// Check ranged weapon collision detection
// Watch console during projectile flight for hit messages
```

## No Rebuild Needed!

These commands are added to the existing Electron app - just refresh (Ctrl+R) if needed!
