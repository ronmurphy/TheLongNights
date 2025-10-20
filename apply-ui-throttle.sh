#!/usr/bin/env fish
# UI Throttle Quick Patch
# Throttles PlayerCompanionUI updates from 60 FPS to 4 FPS for +5-7 FPS gain

echo "🎯 Applying PlayerCompanionUI throttle patch..."
echo ""

# Check if we're in the right directory
if not test -f "src/VoxelWorld.js"
    echo "❌ Error: src/VoxelWorld.js not found!"
    echo "   Run this script from the TheLongNights root directory"
    exit 1
end

echo "📁 Found src/VoxelWorld.js"
echo ""

# Backup original file
cp src/VoxelWorld.js src/VoxelWorld.js.backup-ui-throttle
echo "💾 Backup created: src/VoxelWorld.js.backup-ui-throttle"
echo ""

# Create a temporary Python script to do the patching
cat > /tmp/patch_ui.py << 'PYTHON_EOF'
import re

# Read the file
with open('src/VoxelWorld.js', 'r') as f:
    content = f.read()

# Pattern 1: Find the animate() method and add timer initialization
# Look for the PlayerCompanionUI update section
pattern1 = r'(// 🖼️ Update Player \+ Companion UI\s+if \(this\.playerCompanionUI\) \{\s+)(this\.playerCompanionUI\.update\(\);)'

replacement1 = r'''\1// Throttled to 4 FPS for performance (+5-7 FPS gain)
            this.uiUpdateTimer = (this.uiUpdateTimer || 0) + deltaTime;
            if (this.uiUpdateTimer >= 0.25) { // 250ms = 4 updates/sec
                this.playerCompanionUI.update();
                this.uiUpdateTimer = 0;
            }'''

# Try to apply the patch
new_content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)

if new_content == content:
    print("⚠️  Warning: Could not find exact pattern to patch")
    print("   Searching for PlayerCompanionUI update...")
    
    # Try a more lenient pattern
    if 'this.playerCompanionUI.update()' in content:
        print("✅ Found playerCompanionUI.update() - manual patch needed")
        print("")
        print("Add this code AFTER the line with 'this.playerCompanionUI.update():'")
        print("")
        print("REPLACE:")
        print("    if (this.playerCompanionUI) {")
        print("        this.playerCompanionUI.update();")
        print("    }")
        print("")
        print("WITH:")
        print("    if (this.playerCompanionUI) {")
        print("        this.uiUpdateTimer = (this.uiUpdateTimer || 0) + deltaTime;")
        print("        if (this.uiUpdateTimer >= 0.25) {")
        print("            this.playerCompanionUI.update();")
        print("            this.uiUpdateTimer = 0;")
        print("        }")
        print("    }")
        exit(1)
    else:
        print("❌ Error: Could not find playerCompanionUI.update() in file")
        exit(1)
else:
    print("✅ Patch applied successfully!")
    
    # Write the patched content
    with open('src/VoxelWorld.js', 'w') as f:
        f.write(new_content)
    
    print("")
    print("📝 Changes made:")
    print("   • PlayerCompanionUI updates throttled to 4 FPS")
    print("   • Added uiUpdateTimer with 250ms interval")
    print("")
    print("📊 Expected performance gain: +5-7 FPS")
PYTHON_EOF

# Run the Python patcher
python3 /tmp/patch_ui.py
set patch_result $status

# Clean up temp file
rm /tmp/patch_ui.py

if test $patch_result -eq 0
    echo ""
    echo "✅ ========================================="
    echo "✅   UI THROTTLE PATCH APPLIED!"
    echo "✅ ========================================="
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Build: npm run build"
    echo "   2. Test:  npm run electron"
    echo "   3. Check FPS improvement (+5-7 expected)"
    echo ""
    echo "💡 To verify throttling is working:"
    echo "   • Open browser console (F12)"
    echo "   • UI should update ~4 times per second (not 60)"
    echo "   • Hearts/stamina still smooth enough"
    echo ""
    echo "⚠️  If you need to revert:"
    echo "   cp src/VoxelWorld.js.backup-ui-throttle src/VoxelWorld.js"
    echo ""
else
    echo ""
    echo "⚠️  Automatic patch failed - manual edit needed"
    echo ""
    echo "📖 See SMART_UI_OPTIMIZATION_GUIDE.md for manual instructions"
    echo "   Location: docs/SMART_UI_OPTIMIZATION_GUIDE.md"
    echo "   Section: 'Phase 1: PlayerCompanionUI Throttling'"
    echo ""
end
