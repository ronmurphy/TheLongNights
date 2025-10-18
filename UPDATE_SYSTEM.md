# 🔄 Auto-Update System

## Overview

The game now has a fully custom in-game auto-update system that replaces the large system dialogs with styled in-game modals that match the game's UI.

## Features

### ✅ Custom In-Game Modals
- **No more huge system dialogs** covering the entire screen
- Beautiful in-game modals matching the game's existing UI style
- Shows version info, release date, and release notes
- Real-time download progress bar with percentage and MB downloaded

### ✅ User-Controlled Updates
- Manual check via **Help → Check for Updates** menu item
- User decides whether to download or skip each update
- User decides whether to restart immediately or later after download
- No automatic downloads without user permission

### ✅ Progress Tracking
- Live progress bar showing download percentage
- File size display (MB downloaded / total MB)
- Smooth transitions between modal states

### ✅ Works in All Build Types
- Development builds (`npm run electron-dev`)
- Built executables (Windows .exe, Linux .AppImage)
- Both dev and production builds can check for updates

## How It Works

### 1. User Checks for Updates
- Click **Help → Check for Updates** in the menu
- System contacts GitHub Releases to check for newer version

### 2. Update Available Modal
If an update is found:
```
┌─────────────────────────────────────┐
│  🔄 Update Available                │
│  Version X.X.X is ready to download │
├─────────────────────────────────────┤
│  New Version: X.X.X                 │
│  Released: Oct 18, 2025             │
│                                     │
│  📝 What's New:                     │
│  ┌─────────────────────────────┐   │
│  │ (scrollable release notes)  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Update installs when game closes   │
├─────────────────────────────────────┤
│    [Download Update]    [Later]     │
└─────────────────────────────────────┘
```

### 3. Downloading Modal
When user clicks "Download Update":
```
┌─────────────────────────────────────┐
│  🔄 Update Available                │
├─────────────────────────────────────┤
│  📥 Downloading Update...           │
│  Please wait while update downloads │
│                                     │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 52.3%         │
│                                     │
│  Downloaded 243.5 MB / 465.2 MB     │
└─────────────────────────────────────┘
```

### 4. Download Complete Modal
```
┌─────────────────────────────────────┐
│  🔄 Update Available                │
├─────────────────────────────────────┤
│  ✅ Update Downloaded!              │
│  Version X.X.X downloaded           │
│                                     │
│  Update installs when you restart   │
├─────────────────────────────────────┤
│    [Restart Now]    [Later]         │
└─────────────────────────────────────┘
```

### 5. No Updates Available
```
System Dialog (small):
─────────────────────
  No Updates Available

  You are already running
  the latest version!

  Current version: X.X.X

       [OK]
─────────────────────
```

## Technical Implementation

### IPC Communication
The system uses Electron IPC (Inter-Process Communication):

**Preload API** (`electron-preload.cjs`):
- `window.electronAPI.startUpdateDownload()` - Start downloading
- `window.electronAPI.onDownloadProgress(callback)` - Listen for progress
- `window.electronAPI.restartAndInstall()` - Restart and install update

**Main Process** (`electron.cjs`):
- `update:start-download` - Triggers download via electron-updater
- `update:download-progress` - Sends progress to renderer
- `update:restart-and-install` - Quits and installs update

### Modal States

1. **Available** - Shows version info + release notes
2. **Downloading** - Shows progress bar + download stats
3. **Downloaded** - Shows success message + restart options
4. **Error** - Modal closes, system dialog shows error details

### Files Modified

- `electron.cjs` - Main process update logic + IPC handlers
- `electron-preload.cjs` - IPC bridge to renderer
- `package.json` - electron-updater moved to dependencies

## Publishing Updates

### 1. Bump Version
```bash
node bump-version.cjs
```

### 2. Build Executables
```bash
npm run build-wl  # Windows + Linux
# or
npm run build-all # All platforms
```

### 3. Create GitHub Release
- Go to: https://github.com/YOUR-USERNAME/TheLongNights/releases/new
- Tag: `vX.X.X` (e.g., `v0.6.8`)
- Title: `Version X.X.X - Release Name`
- Description: Use template from `GITHUB_RELEASE_v0.6.7.md`
- Upload files from `dist-electron/`:
  - `TheLongNights-X.X.X.exe` (Windows installer)
  - `TheLongNights-X.X.X-portable.exe` (Windows portable)
  - `TheLongNights-X.X.X.AppImage` (Linux)
- **Important**: Check "Set as a pre-release" for beta releases
- Click "Publish release"

### 4. Users Get Update
- Next time they click **Help → Check for Updates**, they'll see the new version!

## Configuration

### Auto-Download (Currently OFF)
```javascript
// In electron.cjs
autoUpdater.autoDownload = false; // User must click "Download"
```

To enable automatic downloads:
```javascript
autoUpdater.autoDownload = true; // Auto-download when update found
```

### Auto-Install (Currently ON)
```javascript
autoUpdater.autoInstallOnAppQuit = true; // Install when app closes
```

### Check on Startup (Currently OFF)
To check for updates automatically when app starts:
```javascript
// In electron.cjs createWindow() function
app.whenReady().then(() => {
  createWindow();

  // Auto-check for updates on startup
  if (autoUpdater && app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
});
```

## Troubleshooting

### "electron-updater not installed"
- Make sure it's in `dependencies` (not `devDependencies`)
- Run: `npm install`
- Rebuild: `./desktopBuild.sh` or `npm run build-electron-win`

### Updates not showing in built app
- Check GitHub Releases page exists
- Verify `package.json` has correct `publish.owner` and `publish.repo`
- Make sure release is published (not draft)
- Check console logs for errors

### Modal not appearing
- Open DevTools in Electron: Press `F12`
- Check console for JavaScript errors
- Verify modal CSS classes exist in game's stylesheet

### Progress bar not updating
- Check IPC communication in console
- Verify `mainWindow.webContents.send()` is working
- Make sure preload script is loaded correctly

## Future Enhancements

### Possible Features:
- [ ] Auto-check on startup (configurable in settings)
- [ ] Update notification badge on menu
- [ ] Background download (download while playing)
- [ ] Changelog viewer (show previous versions)
- [ ] Update size warning (if > 500MB)
- [ ] Delta updates (only download changed files)
- [ ] Update scheduling (install at specific time)

## Credits

**System designed by**: Brad & Claude
**Inspired by**: Brad's VB6/Pastebin update system (early 2000s)
**Motivation**: "we .. may want to make a modal for that ... because it completly covered my entire screen, the msgbox"
