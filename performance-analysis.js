/**
 * 🚀 PERFORMANCE ANALYSIS SCRIPT
 * 
 * Run this in the browser console to analyze the adaptive visibility system's performance
 */

console.log('🚀 PERFORMANCE ANALYSIS - ADAPTIVE VISIBILITY CULLING');
console.log('='.repeat(60));

function analyzePerformance() {
    const voxelWorld = window.voxelWorld;
    if (!voxelWorld || !voxelWorld.chunkRenderManager) {
        console.log('❌ Game not loaded or ChunkRenderManager not available');
        return;
    }

    const renderManager = voxelWorld.chunkRenderManager;
    const stats = renderManager.getStats();
    
    console.log('\n📊 CURRENT SYSTEM STATUS');
    console.log('========================');
    
    // Basic info
    const totalBlocks = Object.keys(voxelWorld.world).length;
    const renderedBlocks = Object.values(voxelWorld.world).filter(b => b.rendered !== false).length;
    const hiddenBlocks = totalBlocks - renderedBlocks;
    const cullingEfficiency = totalBlocks > 0 ? (hiddenBlocks / totalBlocks * 100) : 0;
    
    console.log(`📦 Total blocks in world: ${totalBlocks.toLocaleString()}`);
    console.log(`🎨 Currently rendered: ${renderedBlocks.toLocaleString()}`);
    console.log(`🚫 Currently hidden: ${hiddenBlocks.toLocaleString()}`);
    console.log(`📈 Culling efficiency: ${cullingEfficiency.toFixed(1)}%`);
    
    // Player position
    console.log(`🧍 Player position: X=${voxelWorld.player.position.x.toFixed(1)}, Y=${voxelWorld.player.position.y.toFixed(1)}, Z=${voxelWorld.player.position.z.toFixed(1)}`);
    
    // System configuration
    console.log('\n⚙️ SYSTEM CONFIGURATION');
    console.log('=======================');
    console.log(`🎯 Vertical culling: ${stats.verticalCulling ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🧠 Adaptive visibility: ${stats.adaptiveVisibility ? 'ENABLED' : 'DISABLED'}`);
    
    if (stats.verticalCulling) {
        console.log(`📉 Underground depth: ${stats.undergroundDepth} blocks`);
        console.log(`📈 Height limit: ${stats.verticalHeightLimit ? `${stats.abovegroundHeight} blocks` : 'DISABLED'}`);
    }
    
    if (stats.adaptiveVisibility) {
        console.log(`🔍 Ray count: ${stats.visibilityRayCount}`);
        console.log(`📏 Surface buffer: ${stats.visibilityBuffer} blocks`);
        console.log(`🎯 Detected surfaces: ${stats.detectedSurfaces}`);
        console.log(`🧠 Using adaptive bounds: ${stats.isAdaptiveBounds ? 'YES' : 'NO'}`);
    }
    
    // Current bounds
    if (stats.currentBounds) {
        console.log(`📐 Current Y bounds: ${stats.currentBounds.minY} to ${stats.currentBounds.maxY} (range: ${stats.currentBounds.maxY - stats.currentBounds.minY + 1} blocks)`);
    }
    
    // Performance metrics
    console.log('\n📈 PERFORMANCE METRICS');
    console.log('======================');
    
    // Estimate memory usage (rough calculation)
    const avgBlockMemory = 0.5; // KB per block mesh (rough estimate)
    const renderedMemory = (renderedBlocks * avgBlockMemory / 1024).toFixed(1);
    const savedMemory = (hiddenBlocks * avgBlockMemory / 1024).toFixed(1);
    
    console.log(`💾 Estimated rendered memory: ~${renderedMemory} MB`);
    console.log(`💾 Estimated memory saved: ~${savedMemory} MB`);
    
    // Render distance info
    console.log(`🔭 Render distance: ${stats.maxRenderDistance} chunks (${stats.maxRenderDistance * 8} blocks)`);
    console.log(`👁️ Visual distance: ${stats.maxVisualDistance} chunks (${stats.maxVisualDistance * 8} blocks)`);
    console.log(`🎮 GPU tier: ${stats.gpuTier.toUpperCase()}`);
    
    return {
        totalBlocks,
        renderedBlocks,
        hiddenBlocks,
        cullingEfficiency,
        adaptiveActive: stats.adaptiveVisibility,
        surfacesDetected: stats.detectedSurfaces,
        bounds: stats.currentBounds
    };
}

// Performance monitoring function
function startPerformanceMonitoring(duration = 30000) {
    console.log('\n🔄 STARTING PERFORMANCE MONITORING');
    console.log(`⏱️ Duration: ${duration / 1000} seconds`);
    console.log('📊 Move around and the system will track performance...\n');
    
    const startTime = Date.now();
    const samples = [];
    
    const monitorInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        
        if (elapsed >= duration) {
            clearInterval(monitorInterval);
            
            // Analysis
            console.log('\n📈 MONITORING RESULTS');
            console.log('====================');
            
            if (samples.length > 0) {
                const avgEfficiency = samples.reduce((sum, s) => sum + s.efficiency, 0) / samples.length;
                const maxSurfaces = Math.max(...samples.map(s => s.surfaces));
                const minSurfaces = Math.min(...samples.map(s => s.surfaces));
                const avgSurfaces = samples.reduce((sum, s) => sum + s.surfaces, 0) / samples.length;
                
                console.log(`📊 Average culling efficiency: ${avgEfficiency.toFixed(1)}%`);
                console.log(`🎯 Surface detection: Min=${minSurfaces}, Max=${maxSurfaces}, Avg=${avgSurfaces.toFixed(1)}`);
                console.log(`📝 Total samples collected: ${samples.length}`);
                
                // Performance recommendations
                console.log('\n💡 RECOMMENDATIONS');
                console.log('==================');
                
                if (avgEfficiency > 50) {
                    console.log('✅ Excellent culling performance! System is working well.');
                } else if (avgEfficiency > 30) {
                    console.log('⚠️ Good performance. Consider enabling height limits for more savings.');
                } else {
                    console.log('❌ Low culling efficiency. Check if adaptive visibility is properly enabled.');
                }
                
                if (avgSurfaces < 5) {
                    console.log('⚠️ Low surface detection. Try increasing ray count or moving to more varied terrain.');
                } else if (avgSurfaces > 40) {
                    console.log('⚠️ High surface detection overhead. Consider reducing ray count for better performance.');
                }
            }
            
            return;
        }
        
        // Collect sample
        const result = analyzePerformance();
        if (result) {
            samples.push({
                time: elapsed,
                efficiency: result.cullingEfficiency,
                surfaces: result.surfacesDetected || 0,
                rendered: result.renderedBlocks
            });
            
            console.log(`📊 [${(elapsed/1000).toFixed(1)}s] Efficiency: ${result.cullingEfficiency.toFixed(1)}%, Surfaces: ${result.surfacesDetected || 0}, Rendered: ${result.renderedBlocks.toLocaleString()}`);
        }
        
    }, 2000); // Sample every 2 seconds
    
    return monitorInterval;
}

// Test different configurations
function testConfigurations() {
    console.log('\n🧪 TESTING DIFFERENT CONFIGURATIONS');
    console.log('===================================');
    
    const voxelWorld = window.voxelWorld;
    const configs = [
        { name: 'Disabled', cmd: () => voxelWorld.setVerticalCulling(false) },
        { name: 'Basic (4 deep)', cmd: () => { voxelWorld.setVerticalCulling(true, false, 4); voxelWorld.setAdaptiveVisibility(false); } },
        { name: 'Adaptive Low', cmd: () => { voxelWorld.setVerticalCulling(true, false, 4); voxelWorld.setAdaptiveVisibility(true, 16, 0, 5); } },
        { name: 'Adaptive Medium', cmd: () => { voxelWorld.setVerticalCulling(true, false, 4); voxelWorld.setAdaptiveVisibility(true, 32, 1, 10); } },
        { name: 'Adaptive High', cmd: () => { voxelWorld.setVerticalCulling(true, false, 4); voxelWorld.setAdaptiveVisibility(true, 64, 2, 15); } },
    ];
    
    console.log('This will test each configuration for 3 seconds...');
    
    async function testConfig(config, index) {
        return new Promise(resolve => {
            console.log(`\n[${index + 1}/5] Testing: ${config.name}`);
            config.cmd();
            
            setTimeout(() => {
                const result = analyzePerformance();
                console.log(`Result: ${result.cullingEfficiency.toFixed(1)}% efficiency, ${result.renderedBlocks.toLocaleString()} blocks rendered`);
                resolve(result);
            }, 3000);
        });
    }
    
    // Run tests sequentially
    (async () => {
        const results = [];
        for (let i = 0; i < configs.length; i++) {
            const result = await testConfig(configs[i], i);
            results.push({ name: configs[i].name, ...result });
        }
        
        console.log('\n📊 CONFIGURATION COMPARISON');
        console.log('===========================');
        results.forEach(r => {
            console.log(`${r.name.padEnd(15)}: ${r.cullingEfficiency.toFixed(1).padStart(5)}% efficiency, ${r.renderedBlocks.toLocaleString().padStart(8)} blocks`);
        });
        
        // Restore medium settings
        voxelWorld.setVerticalCulling(true, false, 4);
        voxelWorld.setAdaptiveVisibility(true, 32, 1, 10);
        console.log('\n✅ Restored to medium adaptive settings');
    })();
}

// Auto-run analysis
console.log('Running initial analysis...');
analyzePerformance();

console.log('\n🎮 AVAILABLE FUNCTIONS:');
console.log('analyzePerformance() - Get current performance snapshot');
console.log('startPerformanceMonitoring(30000) - Monitor for 30 seconds');
console.log('testConfigurations() - Compare different culling settings');