# Important: JavaScript Naming Conventions

## Issue Encountered During Rename

When renaming the project from "VoxelWorld" to "The Long Nights", the automated script incorrectly replaced identifiers that cannot contain spaces in JavaScript.

### What Went Wrong

❌ **Invalid replacements:**
- `function initVoxelWorld()` → `function initThe Long Nights()` (INVALID)
- `import { initVoxelWorld }` → `import { initThe Long Nights }` (INVALID)

### The Rules

✅ **CAN have spaces (strings/comments):**
- String literals: `"The Long Nights"`
- Database names: `indexedDB.open('The Long Nights')`
- localStorage keys: `localStorage.getItem('The Long Nights_save')`
- Comments: `// The Long Nights game engine`
- UI text/HTML: `<title>The Long Nights</title>`

❌ **CANNOT have spaces (identifiers):**
- Function names: `initVoxelWorld` (not `initThe Long Nights`)
- Variable names: `voxelWorld` (not `the long nights`)
- File names: `VoxelWorld.js` (not `The Long Nights.js`)
- Class names: `class VoxelWorld` (not `class The Long Nights`)
- Object properties accessed with dot notation

### What We Kept as "VoxelWorld"

For **code identifiers**, we kept the original names:
- ✅ `VoxelWorld.js` - Main source file
- ✅ `initVoxelWorld()` - Initialization function
- ✅ `window.voxelWorld` - Global reference
- ✅ `this.voxelWorld` - Object properties

### What We Changed to "The Long Nights"

For **display/storage**, we use the new name:
- ✅ Database names: `'The Long Nights'`
- ✅ HTML titles: `<title>The Long Nights</title>`
- ✅ Console messages: `"✅ The Long Nights initialized"`
- ✅ Package name: `"the-long-nights"` (kebab-case, no spaces)
- ✅ Comments describing the game

### Lesson Learned

When doing mass find-and-replace:
1. **Never replace in code identifiers** (functions, variables, file names)
2. **Always test build after rename** (`npm run build`)
3. **Use camelCase/PascalCase/kebab-case** for identifiers, never spaces
4. **String literals and UI text** can have any formatting

### Quick Reference

| Context | Old | New | Valid? |
|---------|-----|-----|--------|
| Function name | `initVoxelWorld` | `initThe Long Nights` | ❌ NO |
| Database name | `'VoxelWorld'` | `'The Long Nights'` | ✅ YES |
| Package name | `"voxelworld-1-vite"` | `"the-long-nights"` | ✅ YES |
| File name | `VoxelWorld.js` | `The Long Nights.js` | ❌ NO |
| HTML title | `VoxelWorld` | `The Long Nights` | ✅ YES |
| Comment | `// VoxelWorld` | `// The Long Nights` | ✅ YES |

---

**Fix Applied:** 2025-10-16
- Reverted function names to `initVoxelWorld`
- Kept file names as `VoxelWorld.js`
- Preserved "The Long Nights" in strings, UI, and documentation
