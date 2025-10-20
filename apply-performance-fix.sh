#!/bin/bash

# Performance Fix Auto-Patcher
# Run this AFTER git pull origin main
# It will automatically apply performance optimizations to maintain fast FPS

echo "🎮 The Long Nights - Performance Fix Auto-Patcher"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "src/VoxelWorld.js" ]; then
    echo "❌ Error: Not in The Long Nights directory!"
    echo "   Please run this from the project root."
    exit 1
fi

echo "✅ Found project directory"
echo ""

# Check if PerformanceConfig.js exists
if [ ! -f "src/PerformanceConfig.js" ]; then
    echo "❌ Error: src/PerformanceConfig.js not found!"
    echo "   Please make sure you have this file from the docs."
    exit 1
fi

echo "✅ PerformanceConfig.js found"
echo ""

# Create backup
BACKUP_DIR="pre-performance-fix-backup"
mkdir -p "$BACKUP_DIR"
cp src/VoxelWorld.js "$BACKUP_DIR/VoxelWorld.js.backup"
echo "✅ Created backup: $BACKUP_DIR/VoxelWorld.js.backup"
echo ""

# Apply patches
echo "🔧 Applying performance patches..."
echo ""

# Patch 1: Add import
echo "  1. Adding PerformanceConfig import..."
if grep -q "import { performanceConfig }" src/VoxelWorld.js; then
    echo "     ⚠️  Import already exists, skipping"
else
    # Add after MusicSystem import
    sed -i "/import { MusicSystem } from '.\/MusicSystem.js';/a import { performanceConfig } from './PerformanceConfig.js';" src/VoxelWorld.js
    echo "     ✅ Import added"
fi

# Patch 2: Load config in constructor
echo "  2. Adding config load in constructor..."
if grep -q "performanceConfig.load()" src/VoxelWorld.js; then
    echo "     ⚠️  Config load already exists, skipping"
else
    # Add after FPS counter initialization
    sed -i "/📊 FPS counter initialized/a \\
\\
        // ⚙️ Load performance configuration\\
        performanceConfig.load();\\
        console.log('⚙️ Performance config loaded');" src/VoxelWorld.js
    echo "     ✅ Config load added"
fi

echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "The following changes need to be done manually (too complex for auto-patch):"
echo ""
echo "1. Wrap AtmosphericFog initialization:"
echo "   Find: this.atmosphericFog = new AtmosphericFog(...)"
echo "   Replace with:"
echo "   if (performanceConfig.get('enableAtmosphericFog')) {"
echo "       this.atmosphericFog = new AtmosphericFog(...);"
echo "   } else {"
echo "       this.atmosphericFog = null;"
echo "   }"
echo ""
echo "2. Wrap WeatherSystem initialization:"
echo "   Find: this.weatherSystem = new WeatherSystem(...)"
echo "   Replace with:"
echo "   if (performanceConfig.get('enableWeather')) {"
echo "       this.weatherSystem = new WeatherSystem(...);"
echo "   } else {"
echo "       this.weatherSystem = null;"
echo "   }"
echo ""
echo "3. Add FPS tracking in animate() loop:"
echo "   After: const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30);"
echo "   Add: performanceConfig.trackFPS(deltaTime);"
echo ""
echo "📖 See PERFORMANCE_FIX_INTEGRATION_GUIDE.md for detailed instructions"
echo ""
echo "✅ Automatic patches complete!"
echo "✅ Backup saved to: $BACKUP_DIR/"
echo ""
echo "🧪 After manual changes, test with:"
echo "   npm run build"
echo "   npm run electron"
echo "   (in console) perfConfig.getReport()"
echo ""
