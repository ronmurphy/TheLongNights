/**
 * DebugPanel.js
 * 
 * In-game debug UI for testing day/night cycle, blood moon, and performance.
 * Toggle with F3 key.
 * 
 * Features:
 * - Quick jump to Day 7 @ 7pm (blood moon test)
 * - Set specific time/day
 * - Toggle FPS counter
 * - Force blood moon on/off
 * - Cleanup blood moon enemies
 * - Current game state display
 */

export class DebugPanel {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.isVisible = false;
        this.panelElement = null;
        this.updateInterval = null;
        
        this.createPanel();
        console.log('🛠️ DebugPanel initialized (toggle with F3)');
    }
    
    createPanel() {
        // Main panel container
        this.panelElement = document.createElement('div');
        this.panelElement.id = 'debug-panel';
        this.panelElement.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            width: 320px;
            background: rgba(20, 20, 20, 0.95);
            border: 2px solid #D4AF37;
            border-radius: 8px;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            color: #D4AF37;
            z-index: 10000;
            display: none;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        `;
        
        // Title
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
            color: #FFD700;
            border-bottom: 2px solid #8B7355;
            padding-bottom: 5px;
        `;
        title.textContent = '🛠️ DEBUG PANEL (F3)';
        this.panelElement.appendChild(title);
        
        // Current state display
        const stateDiv = document.createElement('div');
        stateDiv.id = 'debug-state';
        stateDiv.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 11px;
            line-height: 1.6;
        `;
        this.panelElement.appendChild(stateDiv);
        
        // Quick actions section
        this.addSection('Quick Actions', [
            { label: '📅 Day 7 @ 7pm', action: () => this.setDay7Evening() },
            { label: '🌙 Day 7 @ 10pm (Blood Moon)', action: () => this.setDay7BloodMoon() },
            { label: '☀️ Reset to Day 1 Noon', action: () => this.resetToDay1() },
        ]);
        
        // Time controls
        this.addSection('Time Controls', [
            { label: '⏩ Fast Time (10x)', action: () => this.setTimeScale(10) },
            { label: '▶️ Normal Time (1x)', action: () => this.setTimeScale(1) },
            { label: '⏸️ Pause Time', action: () => this.setTimeScale(0) },
        ]);
        
        // Blood moon controls
        this.addSection('Blood Moon', [
            { label: '🩸 Force Blood Moon ON', action: () => this.forceBloodMoon(true) },
            { label: '🌅 Force Blood Moon OFF', action: () => this.forceBloodMoon(false) },
            { label: '💀 Spawn Wave (Current Hour)', action: () => this.spawnEnemyWave() },
            { label: '🧹 Cleanup All Enemies', action: () => this.cleanupEnemies() },
        ]);
        
        // Performance
        this.addSection('Performance', [
            { label: '📊 Toggle FPS Counter', action: () => this.toggleFPS() },
            { label: '🌫️ Toggle Atmospheric Fog', action: () => this.toggleFog() },
        ]);
        
        // Manual time input
        this.addManualTimeInput();
        
        document.body.appendChild(this.panelElement);
        
        // Update state display every second when visible
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateStateDisplay();
            }
        }, 1000);
    }
    
    addSection(title, buttons) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 12px;
        `;
        
        const sectionTitle = document.createElement('div');
        sectionTitle.style.cssText = `
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #FFA500;
        `;
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.label;
            button.style.cssText = `
                width: 100%;
                padding: 8px;
                margin-bottom: 4px;
                background: linear-gradient(135deg, #2C1810, #3C2820);
                border: 1px solid #8B7355;
                border-radius: 4px;
                color: #D4AF37;
                font-family: monospace;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            button.addEventListener('mouseover', () => {
                button.style.background = 'linear-gradient(135deg, #3C2820, #4C3830)';
                button.style.borderColor = '#D4AF37';
                button.style.transform = 'scale(1.02)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = 'linear-gradient(135deg, #2C1810, #3C2820)';
                button.style.borderColor = '#8B7355';
                button.style.transform = 'scale(1)';
            });
            
            button.addEventListener('click', () => {
                btn.action();
                this.updateStateDisplay();
            });
            
            section.appendChild(button);
        });
        
        this.panelElement.appendChild(section);
    }
    
    addManualTimeInput() {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #8B7355;
        `;
        
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #FFA500;
        `;
        title.textContent = 'Manual Time Set';
        section.appendChild(title);
        
        // Week input
        const weekInput = this.createInput('Week:', 'week-input', '1', 1, 99);
        section.appendChild(weekInput.container);
        
        // Day input
        const dayInput = this.createInput('Day (1-7):', 'day-input', '7', 1, 7);
        section.appendChild(dayInput.container);
        
        // Time input
        const timeInput = this.createInput('Time (0-23):', 'time-input', '19', 0, 23);
        section.appendChild(timeInput.container);
        
        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✓ Apply Time';
        applyBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-top: 6px;
            background: linear-gradient(135deg, #1a5928, #2a6938);
            border: 1px solid #4CAF50;
            border-radius: 4px;
            color: #90EE90;
            font-family: monospace;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
        `;
        
        applyBtn.addEventListener('click', () => {
            const week = parseInt(weekInput.input.value) || 1;
            const day = parseInt(dayInput.input.value) || 1;
            const time = parseInt(timeInput.input.value) || 12;
            this.setManualTime(week, day, time);
        });
        
        section.appendChild(applyBtn);
        this.panelElement.appendChild(section);
    }
    
    createInput(label, id, defaultValue, min, max) {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 6px;
        `;
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = `
            display: inline-block;
            width: 90px;
            font-size: 11px;
        `;
        
        const input = document.createElement('input');
        input.id = id;
        input.type = 'number';
        input.value = defaultValue;
        input.min = min;
        input.max = max;
        input.style.cssText = `
            width: 60px;
            padding: 4px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #8B7355;
            border-radius: 3px;
            color: #D4AF37;
            font-family: monospace;
            font-size: 11px;
        `;
        
        container.appendChild(labelEl);
        container.appendChild(input);
        
        return { container, input };
    }
    
    updateStateDisplay() {
        const stateDiv = document.getElementById('debug-state');
        if (!stateDiv) return;
        
        const cycle = this.voxelWorld.dayNightCycle;
        const bloodMoon = this.voxelWorld.bloodMoonSystem;
        const fog = this.voxelWorld.atmosphericFog;
        
        const hour = Math.floor(cycle.currentTime);
        const minute = Math.floor((cycle.currentTime % 1) * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        stateDiv.innerHTML = `
            <div style="color: #90EE90;">⏰ Time: ${timeStr} (${cycle.currentTime.toFixed(2)})</div>
            <div>📅 Week ${cycle.currentWeek}, Day ${cycle.dayOfWeek}/7 (Total: ${cycle.currentDay})</div>
            <div>⏱️ Time Scale: ${cycle.timeScale}x</div>
            <div style="color: ${cycle.bloodMoonActive ? '#FF4444' : '#888'};">
                🩸 Blood Moon: ${cycle.bloodMoonActive ? 'ACTIVE' : 'Inactive'}
            </div>
            <div>💀 Enemies: ${bloodMoon?.activeEnemies.size || 0}</div>
            <div>🔄 Animation Loop: ${bloodMoon?.animationInterval ? 'Running' : 'Stopped'}</div>
            <div>🌫️ Fog: ${fog?.isActive ? (fog.isBloodMoon ? 'Blood Moon' : 'Night') : 'Inactive'} (${fog?.fogLayers.length || 0} layers)</div>
            <div>📊 FPS: ${this.voxelWorld.statsEnabled ? 'Visible' : 'Hidden'}</div>
        `;
    }
    
    // Quick action methods
    setDay7Evening() {
        const cycle = this.voxelWorld.dayNightCycle;
        cycle.currentWeek = 1;
        cycle.dayOfWeek = 7;
        cycle.currentDay = 7;
        cycle.currentTime = 19; // 7pm
        cycle.lastDayTime = cycle.currentTime;
        console.log('🛠️ Set to Week 1, Day 7 @ 7pm (19:00)');
        this.showMessage('📅 Set to Day 7 @ 7pm');
    }
    
    setDay7BloodMoon() {
        const cycle = this.voxelWorld.dayNightCycle;
        cycle.currentWeek = 1;
        cycle.dayOfWeek = 7;
        cycle.currentDay = 7;
        cycle.currentTime = 22; // 10pm (blood moon starts)
        cycle.lastDayTime = cycle.currentTime;
        cycle.bloodMoonActive = true;
        this.voxelWorld.atmosphericFog?.activate(true);
        console.log('🛠️ Set to Week 1, Day 7 @ 10pm (Blood Moon Active)');
        this.showMessage('🩸 Blood Moon Test Mode Active!');
    }
    
    resetToDay1() {
        const cycle = this.voxelWorld.dayNightCycle;
        cycle.currentWeek = 1;
        cycle.dayOfWeek = 1;
        cycle.currentDay = 1;
        cycle.currentTime = 12; // Noon
        cycle.lastDayTime = cycle.currentTime;
        cycle.bloodMoonActive = false;
        this.voxelWorld.atmosphericFog?.deactivate();
        this.voxelWorld.bloodMoonSystem?.cleanup();
        console.log('🛠️ Reset to Week 1, Day 1 @ Noon');
        this.showMessage('☀️ Reset to Day 1');
    }
    
    setTimeScale(scale) {
        this.voxelWorld.dayNightCycle.timeScale = scale;
        console.log(`🛠️ Time scale: ${scale}x`);
        this.showMessage(`⏱️ Time: ${scale}x`);
    }
    
    forceBloodMoon(enable) {
        this.voxelWorld.dayNightCycle.bloodMoonActive = enable;
        if (enable) {
            this.voxelWorld.atmosphericFog?.activate(true);
            console.log('🛠️ Blood moon forced ON');
            this.showMessage('🩸 Blood Moon: ON');
        } else {
            this.voxelWorld.atmosphericFog?.deactivate();
            console.log('🛠️ Blood moon forced OFF');
            this.showMessage('🌅 Blood Moon: OFF');
        }
    }
    
    spawnEnemyWave() {
        if (this.voxelWorld.bloodMoonSystem) {
            const cycle = this.voxelWorld.dayNightCycle;
            this.voxelWorld.bloodMoonSystem.checkProgressiveSpawn(
                cycle.currentWeek,
                cycle.currentTime
            );
            console.log('🛠️ Triggered enemy wave spawn');
            this.showMessage('💀 Spawning enemies...');
        } else {
            this.showMessage('❌ Blood moon system not available');
        }
    }
    
    cleanupEnemies() {
        if (this.voxelWorld.bloodMoonSystem) {
            this.voxelWorld.bloodMoonSystem.cleanup();
            console.log('🛠️ Cleaned up all blood moon enemies');
            this.showMessage('🧹 Enemies removed');
        }
    }
    
    toggleFPS() {
        const stats = this.voxelWorld.stats;
        this.voxelWorld.statsEnabled = !this.voxelWorld.statsEnabled;
        stats.dom.style.display = this.voxelWorld.statsEnabled ? 'block' : 'none';
        console.log(`🛠️ FPS counter: ${this.voxelWorld.statsEnabled ? 'ON' : 'OFF'}`);
        this.showMessage(`📊 FPS: ${this.voxelWorld.statsEnabled ? 'ON' : 'OFF'}`);
    }
    
    toggleFog() {
        const fog = this.voxelWorld.atmosphericFog;
        if (fog?.isActive) {
            fog.deactivate();
            this.showMessage('🌫️ Fog: OFF');
        } else {
            const isBloodMoon = this.voxelWorld.dayNightCycle.bloodMoonActive;
            fog?.activate(isBloodMoon);
            this.showMessage('🌫️ Fog: ON');
        }
    }
    
    setManualTime(week, day, time) {
        const cycle = this.voxelWorld.dayNightCycle;
        cycle.currentWeek = Math.max(1, Math.min(99, week));
        cycle.dayOfWeek = Math.max(1, Math.min(7, day));
        cycle.currentDay = (cycle.currentWeek - 1) * 7 + cycle.dayOfWeek;
        cycle.currentTime = Math.max(0, Math.min(23.99, time));
        cycle.lastDayTime = cycle.currentTime;
        console.log(`🛠️ Set to Week ${cycle.currentWeek}, Day ${cycle.dayOfWeek} @ ${time}:00`);
        this.showMessage(`⏰ Week ${cycle.currentWeek}, Day ${cycle.dayOfWeek} @ ${time}:00`);
    }
    
    showMessage(text) {
        // Show temporary message at bottom of panel
        const msg = document.createElement('div');
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 340px;
            background: rgba(20, 20, 20, 0.95);
            border: 2px solid #4CAF50;
            border-radius: 4px;
            padding: 10px 15px;
            color: #90EE90;
            font-family: monospace;
            font-size: 13px;
            z-index: 10001;
            animation: slideIn 0.3s, slideOut 0.3s 2.7s;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        }, 3000);
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        this.panelElement.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.updateStateDisplay();
            console.log('🛠️ Debug panel opened');
        } else {
            console.log('🛠️ Debug panel closed');
        }
    }
    
    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.panelElement && this.panelElement.parentNode) {
            this.panelElement.parentNode.removeChild(this.panelElement);
        }
    }
}
