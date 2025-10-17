# Project Rename: VoxelWorld → The Long Nights

**Date:** October 16, 2025  
**Status:** ✅ Complete

## Summary

Successfully renamed the project from "VoxelWorld" to "The Long Nights" across the entire codebase while preserving historical references in changelogs.

## What Changed

### 📊 Statistics
- **Files Modified:** 141 files
- **Occurrences Replaced:** 585
- **Historical References Preserved:** 128 (in CHANGELOGs)

### 📁 Files by Type
- **89 Markdown files** (.md) - Documentation
- **33 JavaScript files** (.js) - Source code
- **10 Shell scripts** (.sh) - Build/setup scripts
- **3 HTML files** (.html) - UI templates
- **2 JSON files** (.json) - Configuration
- **1 CSS file** (.css) - Styles
- **1 CJS file** (.cjs) - CommonJS modules
- **2 Backup files** (.backup) - Safety backups

## Specific Changes

### 🔧 Source Code
- `VoxelWorld` → `The Long Nights` in all .js, .html, .css files
- `voxelWorld_` → `longNights_` in localStorage keys
- Updated all comments and string references

### 📚 Documentation  
- Updated all active documentation in `docs/` folder
- **Preserved:** CHANGELOG.md and CHANGELOG2.md (historical record)

### ⚙️ Configuration
- **package.json:** `"name": "the-long-nights"`
- **package-lock.json:** Updated package name
- Shell scripts and desktop files updated

### 🔐 LocalStorage Keys Changed
All localStorage keys were updated from `voxelWorld_*` to `longNights_*`:
- `voxelWorld_gpuPreference` → `longNights_gpuPreference`
- `voxelWorld_discovered_foods` → `longNights_discovered_foods`
- And all other game state keys

## Files Preserved (Intentionally Kept "VoxelWorld")

The following files **still contain "VoxelWorld"** for historical accuracy:
- `CHANGELOG.md` - Project history
- `CHANGELOG2.md` - Extended changelog

These preserve the project's development history and document when the name change occurred.

## Backups Created

Safety backups of critical files:
- `package.json.backup`
- `package-lock.json.backup`

## Next Steps

1. ✅ **Test the game:** Run `npm start` to ensure everything works
2. ✅ **Review changes:** Check `git diff` for any issues
3. 🔄 **Rebuild:** Run `npm run build` to generate updated builds
4. 📤 **Commit:** Commit these changes to git
5. 🚀 **Push:** Push to GitHub repository

## Notes for Users

⚠️ **Important:** Players with existing save data may need to:
- Their localStorage keys will have the old `voxelWorld_` prefix
- Game should continue to work, but saved preferences might reset
- This is a one-time migration

## Implementation Details

The rename was performed using `rename-to-long-nights.sh` script with:
- Selective replacement (Option B)
- Preserved historical references
- Automatic backups
- Smart filtering to avoid binary/build directories

---

**Script Location:** `/home/brad/Documents/TheLongNights/rename-to-long-nights.sh`

**Commit Message Suggestion:**
```
refactor: Rename project from VoxelWorld to The Long Nights

- Update all source code, documentation, and configs
- Preserve historical references in CHANGELOGs  
- Update localStorage keys to longNights_ prefix
- 585 occurrences replaced across 141 files
```
