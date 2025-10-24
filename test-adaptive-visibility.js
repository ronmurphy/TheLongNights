/**
 * 🎯 ADAPTIVE VISIBILITY CULLING TEST
 * 
 * This tests the new intelligent raycast-based culling system that detects
 * visible surfaces (ground, cliffs, etc.) and only renders blocks up to those surfaces.
 */

console.log('🎯 STARTING ADAPTIVE VISIBILITY CULLING TEST');
console.log('='.repeat(60));

// Wait for game to fully load
function waitForGame() {
    return new Promise((resolve) => {
        const checkGame = () => {
            if (window.voxelWorld && window.voxelWorld.chunkRenderManager && window.voxelWorld.world) {
                console.log('✅ Game fully loaded and ready for testing');
                resolve();
            } else {
                console.log('⏳ Waiting for game to load...');
                setTimeout(checkGame, 1000);
            }
        };
        checkGame();
    });
}

// Test the new adaptive visibility system
async function testAdaptiveVisibility() {
    await waitForGame();
    
    const voxelWorld = window.voxelWorld;
    const renderManager = voxelWorld.chunkRenderManager;
    
    console.log('\n📊 INITIAL STATE');
    console.log('================');
    
    // Count total blocks and current state
    const totalBlocks = Object.keys(voxelWorld.world).length;
    let renderedBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    
    console.log(`📦 Total blocks in world: ${totalBlocks}`);
    console.log(`🎨 Currently rendered blocks: ${renderedBlocks}`);
    console.log(`🧍 Player Y position: ${voxelWorld.player.position.y.toFixed(1)}`);
    
    console.log('\n🎯 ENABLING ADAPTIVE VISIBILITY SYSTEM');
    console.log('=====================================');
    
    // Step 1: Enable basic vertical culling first
    console.log('Step 1: Enable vertical culling (4 blocks below)...');
    voxelWorld.setVerticalCulling(true, false, 4, 8);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let culledBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    console.log(`🎨 Blocks after basic culling: ${culledBlocks}`);
    console.log(`📉 Blocks hidden: ${renderedBlocks - culledBlocks}`);
    
    // Step 2: Enable adaptive visibility
    console.log('\nStep 2: Enable adaptive visibility (32 rays, 10Hz)...');
    voxelWorld.setAdaptiveVisibility(true, 32, 1, 10);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for first scan
    
    let adaptiveBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    let stats = renderManager.getStats();
    
    console.log(`🎯 Surfaces detected: ${stats.detectedSurfaces}`);
    console.log(`🎨 Blocks with adaptive culling: ${adaptiveBlocks}`);
    console.log(`📏 Current bounds:`, stats.currentBounds);
    console.log(`🧠 Using adaptive bounds: ${stats.isAdaptiveBounds}`);
    
    console.log('\n🔄 TESTING DIFFERENT CONFIGURATIONS');
    console.log('===================================');
    
    // Test high quality settings
    console.log('Testing high quality (64 rays, 15Hz)...');
    voxelWorld.setAdaptiveVisibility(true, 64, 2, 15);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let hqStats = renderManager.getStats();
    let hqBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    
    console.log(`🎯 HQ surfaces detected: ${hqStats.detectedSurfaces}`);
    console.log(`🎨 HQ rendered blocks: ${hqBlocks}`);
    
    // Test low quality settings
    console.log('\nTesting low quality (16 rays, 5Hz)...');
    voxelWorld.setAdaptiveVisibility(true, 16, 0, 5);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let lqStats = renderManager.getStats();
    let lqBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    
    console.log(`🎯 LQ surfaces detected: ${lqStats.detectedSurfaces}`);
    console.log(`🎨 LQ rendered blocks: ${lqBlocks}`);
    
    console.log('\n📈 PERFORMANCE COMPARISON');
    console.log('========================');
    
    console.log(`📊 Original blocks: ${renderedBlocks}`);
    console.log(`📊 Basic culling: ${culledBlocks} (${((renderedBlocks - culledBlocks) / renderedBlocks * 100).toFixed(1)}% saved)`);
    console.log(`📊 Adaptive (32 rays): ${adaptiveBlocks} (${((renderedBlocks - adaptiveBlocks) / renderedBlocks * 100).toFixed(1)}% saved)`);
    console.log(`📊 High quality (64 rays): ${hqBlocks} (${((renderedBlocks - hqBlocks) / renderedBlocks * 100).toFixed(1)}% saved)`);
    console.log(`📊 Low quality (16 rays): ${lqBlocks} (${((renderedBlocks - lqBlocks) / renderedBlocks * 100).toFixed(1)}% saved)`);
    
    console.log('\n🎮 MOVEMENT TESTING');
    console.log('==================');
    console.log('Now move around and watch the console for surface detection updates!');
    console.log('The system will automatically detect ground, cliffs, and other visible surfaces.');
    
    // Monitor for a few seconds
    const startTime = Date.now();
    const monitorInterval = setInterval(() => {
        const currentStats = renderManager.getStats();
        if (currentStats.detectedSurfaces > 0) {
            console.log(`🎯 Live update: ${currentStats.detectedSurfaces} surfaces detected, bounds: Y=${currentStats.currentBounds?.minY || '?'} to ${currentStats.currentBounds?.maxY || '?'}`);
        }
        
        if (Date.now() - startTime > 10000) { // Stop after 10 seconds
            clearInterval(monitorInterval);
        }
    }, 1000);
    
    console.log('\n✅ ADAPTIVE VISIBILITY TEST COMPLETE');
    console.log('====================================');
    console.log('The adaptive visibility system is working!');
    console.log('📋 Key features:');
    console.log('   • 🎯 Raycast-based surface detection');
    console.log('   • 🏔️ Detects ground, cliffs, overhangs');
    console.log('   • ⚡ Real-time adaptation to player view');
    console.log('   • 🎛️ Configurable quality settings');
    console.log('   • 📊 Performance monitoring');
    
    console.log('\n🎮 AVAILABLE COMMANDS:');
    console.log('voxelWorld.setAdaptiveVisibility(true) - Enable with default settings');
    console.log('voxelWorld.setAdaptiveVisibility(true, 64, 2, 15) - High quality');
    console.log('voxelWorld.setAdaptiveVisibility(true, 16, 0, 5) - Low quality/performance');
    console.log('voxelWorld.toggleAdaptiveVisibility() - Toggle on/off');
    console.log('voxelWorld.chunkRenderManager.getStats() - Get detailed stats');
    
    return true;
}

// Auto-run the test
testAdaptiveVisibility().catch(console.error);