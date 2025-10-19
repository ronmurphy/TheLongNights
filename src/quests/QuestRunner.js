/**
 * 🐈‍⬛ Quest Runner
 * Executes quest scripts created in Sargem Quest Editor
 * Handles dialogue, choices, NPCs, items, combat, etc.
 */

import * as THREE from 'three';
import { ChatOverlay } from '../ui/Chat.js';

export class QuestRunner {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.chatOverlay = new ChatOverlay(this); // Pass reference to self

        // Current quest state
        this.currentQuest = null;
        this.currentNodeId = null;
        this.questNPCs = [];
        this.isRunning = false;

        // Quest data (nodes + connections from Sargem)
        this.nodes = [];
        this.connections = [];

        // Node counters for debug labels
        this.nodeCounters = {};

        // Choice tracking (for personality quiz)
        this.choiceTracking = {};  // { nodeId: chosenIndex }
        this.onQuestComplete = null;  // Callback when quest ends

        // Quest flags for condition checking
        this.questFlags = new Map();
        this.loadQuestFlags(); // Load saved flags from localStorage
    }

    /**
     * Load quest flags from localStorage
     */
    loadQuestFlags() {
        try {
            const savedFlags = JSON.parse(localStorage.getItem('questFlags') || '{}');
            for (const [key, value] of Object.entries(savedFlags)) {
                this.questFlags.set(key, value);
            }
            console.log('🚩 Loaded quest flags:', Object.keys(savedFlags));
        } catch (e) {
            console.error('❌ Failed to load quest flags:', e);
        }
    }

    /**
     * Load and start a quest
     * @param {Object} questData - Quest data from Sargem editor { nodes: [], connections: [] }
     * @param {Function} onComplete - Optional callback when quest completes (receives choiceTracking)
     * @param {boolean} isSargemTest - If true, uses black cat portrait for all dialogue
     */
    startQuest(questData, onComplete = null, isSargemTest = false) {
        if (this.isRunning) {
            console.warn('⚠️ Quest already running!');
            return;
        }

        this.nodes = questData.nodes || [];
        this.connections = questData.connections || [];
        this.isRunning = true;
        this.onQuestComplete = onComplete;
        this.isSargemTest = isSargemTest; // Store test mode flag

        // Reset node counters and choice tracking
        this.nodeCounters = {};
        this.choiceTracking = {};

        // Disable player controls during quest (for button clicks)
        if (this.voxelWorld && this.voxelWorld.controlsEnabled !== undefined) {
            this.voxelWorld.controlsEnabled = false;
            console.log('🎮 Player controls disabled for quest');
        }

        // Exit pointer lock so mouse cursor is visible for clicking buttons
        if (document.pointerLockElement) {
            document.exitPointerLock();
            console.log('🖱️ Pointer lock released for quest UI');
        }

        console.log('🎮 Starting quest with', this.nodes.length, 'nodes');

        // Find the start node (first node or node with no incoming connections)
        const startNode = this.findStartNode();
        if (startNode) {
            this.executeNode(startNode);
        } else {
            console.error('❌ No start node found!');
            this.stopQuest();
        }
    }

    /**
     * Find the starting node of the quest
     */
    findStartNode() {
        // Find node with no incoming connections (or just use first node)
        const nodesWithIncoming = new Set();
        this.connections.forEach(conn => {
            // Sargem uses 'toId', not 'targetId'
            nodesWithIncoming.add(conn.toId || conn.targetId);
        });

        console.log('🔍 Finding start node...');
        console.log('  Nodes:', this.nodes.map(n => ({ id: n.id, type: n.type })));
        console.log('  Connections:', this.connections.map(c => ({ from: c.fromId || c.sourceId, to: c.toId || c.targetId })));
        console.log('  Incoming targets:', Array.from(nodesWithIncoming));

        const startNode = this.nodes.find(node => !nodesWithIncoming.has(node.id));
        
        if (!startNode) {
            console.warn('⚠️ No node without incoming connections, using first node');
            return this.nodes[0];
        }
        
        console.log(`✅ Start node found: ${startNode.id} (${startNode.type})`);
        return startNode;
    }

    /**
     * Execute a node based on its type
     */
    async executeNode(node) {
        if (!node) {
            console.log('✅ Quest complete - no more nodes');
            this.stopQuest();
            return;
        }

        this.currentNodeId = node.id;
        
        // Create debug label with counter
        const type = node.type;
        if (!this.nodeCounters[type]) {
            this.nodeCounters[type] = 0;
        }
        this.nodeCounters[type]++;
        const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.nodeCounters[type]}`;
        
        console.log(`🎬 Executing ${label} (node ${node.id}):`, node.data);

        switch (node.type) {
            case 'dialogue':
                this.executeDialogue(node);
                break;
            
            case 'choice':
                this.executeChoice(node);
                break;
            
            case 'image':
                this.executeImage(node);
                break;
            
            case 'combat':
                this.executeCombat(node);
                break;
            
            case 'item':
                this.executeItem(node);
                break;
            
            case 'condition':
                this.executeCondition(node);
                break;
            
            case 'trigger':
                this.executeTrigger(node);
                break;
            
            case 'action':
                this.executeAction(node);
                break;
            
            case 'link_script':
                await this.executeLinkScript(node);
                break;
            
            case 'end':
                console.log('🏁 End node reached - quest complete');
                this.stopQuest();
                break;
            
            default:
                console.warn(`⚠️ Unknown node type: ${node.type}`);
                this.goToNext(node);
        }
    }

    /**
     * Show dialogue and spawn NPC if needed
     * Uses Storyboard pattern: execute node, then callback to next
     */
    executeDialogue(node) {
        const data = node.data;
        const speaker = data.speaker || 'companion';
        const character = data.character || speaker; // Character ID for portrait (e.g., 'elf_female')
        const text = data.text || 'Hello!';
        const emoji = speaker === 'companion' ? '🐈‍⬛' : data.emoji || '🙂';

        // Spawn NPC if speaker is 'companion' or an NPC name
        if (speaker === 'companion' && this.questNPCs.length === 0) {
            const npc = this.voxelWorld.spawnNPC('🐈‍⬛', 'Sargem', 3);
            if (npc) {
                this.questNPCs.push(npc);
            }
        }

        // Show dialogue using Chat overlay with callback
        console.log(`🎬 Showing dialogue, speaker="${speaker}", character="${character}", text="${text.substring(0, 50)}..."`);
        this.chatOverlay.showMessage({
            character: character,  // Use character ID for portrait lookup
            name: speaker,  // Use speaker for display name
            text: text,
            emoji: emoji
        }, () => {
            // Callback: Find next node and execute it
            console.log('🔄 Dialogue callback fired, calling goToNext');
            this.goToNext(node);
        });
    }

    /**
     * Show choice dialog (Yes/No or multiple options)
     * Uses Storyboard pattern: show choices, callback with selected index
     */
    executeChoice(node) {
        const data = node.data;
        const question = data.question || 'Choose:';
        const options = data.options || ['Yes', 'No'];

        // Create choice overlay with callback
        this.showChoiceDialog(question, options, (chosenIndex) => {
            // Track this choice (for personality quiz or quest tracking)
            this.choiceTracking[node.id] = chosenIndex;
            console.log(`📝 Choice tracked: ${node.id} = ${chosenIndex} (${options[chosenIndex]})`);

            // Find connection for this choice - Sargem uses fromId/toId
            const outgoing = this.connections.filter(c =>
                (c.fromId || c.sourceId) === node.id
            );

            // Sort by handle index (output_0, output_1, etc.)
            outgoing.sort((a, b) => {
                const aIndex = parseInt(a.sourceHandle?.split('_')[1] || 0);
                const bIndex = parseInt(b.sourceHandle?.split('_')[1] || 0);
                return aIndex - bIndex;
            });

            // Get the connection for chosen option
            const connection = outgoing[chosenIndex];
            if (connection) {
                const targetId = connection.toId || connection.targetId;
                const nextNode = this.nodes.find(n => n.id === targetId);
                this.executeNode(nextNode);
            } else {
                console.warn('⚠️ No connection found for choice', chosenIndex);
                this.stopQuest();
            }
        });
    }

    /**
     * Show choice dialog UI
     */
    showChoiceDialog(question, options, onChoose) {
        // Exit pointer lock to enable cursor
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Create simple choice overlay
        const overlay = document.createElement('div');
        overlay.id = 'quest-choice-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 60000;
        `;

        // Question text
        const questionEl = document.createElement('div');
        questionEl.textContent = question;
        questionEl.style.cssText = `
            color: white;
            font-size: 24px;
            margin-bottom: 30px;
            text-align: center;
            max-width: 600px;
        `;
        overlay.appendChild(questionEl);

        // Choice buttons - supports up to 4 options with 2x2 grid layout
        const buttonsContainer = document.createElement('div');
        const numOptions = options.length;

        // Use grid layout for 3+ options, flex for 2 or less
        if (numOptions >= 3) {
            buttonsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                max-width: 700px;
            `;
        } else {
            buttonsContainer.style.cssText = `
                display: flex;
                gap: 20px;
            `;
        }

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.style.cssText = `
                padding: 15px 40px;
                font-size: 18px;
                background: #4ec9b0;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.2s;
                min-width: 250px;
            `;
            button.onmouseover = () => button.style.background = '#6ed9c0';
            button.onmouseout = () => button.style.background = '#4ec9b0';
            button.onclick = () => {
                document.body.removeChild(overlay);

                // Re-request pointer lock after choice
                setTimeout(() => {
                    if (this.voxelWorld.controlsEnabled && this.voxelWorld.renderer?.domElement) {
                        this.voxelWorld.renderer.domElement.requestPointerLock();
                    }
                }, 100);

                onChoose(index);
            };
            buttonsContainer.appendChild(button);
        });

        overlay.appendChild(buttonsContainer);
        document.body.appendChild(overlay);
    }

    /**
     * Execute image node (show image overlay)
     */
    executeImage(node) {
        const data = node.data;
        let imagePath = data.path || '';
        const duration = data.duration || 3;

        // In Electron production mode, images are relative to dist/
        // The HTML is loaded from dist/index.html, so assets/ works correctly
        // But just in case, we can check if file doesn't load and show error
        console.log(`🖼️ Loading image from: ${imagePath}`);

        // Exit pointer lock to enable cursor
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        // Create image overlay with dimmed background
        const overlay = document.createElement('div');
        overlay.id = 'quest-image-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 60000;
        `;

        // Image container
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Image element
        const img = document.createElement('img');
        img.src = imagePath;
        img.style.cssText = `
            max-width: 100%;
            max-height: 90vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        // Close button [X]
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: -40px;
            right: -40px;
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            transition: background 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.4)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => {
            document.body.removeChild(overlay);
            
            // Re-request pointer lock
            setTimeout(() => {
                if (this.voxelWorld.controlsEnabled && this.voxelWorld.renderer?.domElement) {
                    this.voxelWorld.renderer.domElement.requestPointerLock();
                }
            }, 100);
            
            this.goToNext(node);
        };

        imgContainer.appendChild(img);
        imgContainer.appendChild(closeBtn);
        overlay.appendChild(imgContainer);
        document.body.appendChild(overlay);

        console.log(`🖼️ Showing image: ${imagePath}`);
    }

    /**
     * Execute combat node
     */
    executeCombat(node) {
        const data = node.data;
        const enemy = data.enemy || 'goblin_grunt';
        const level = data.level || 1;

        console.log(`⚔️ Starting combat with ${enemy} (level ${level})`);
        
        // TODO: Integrate with battle system
        // For now, just continue
        setTimeout(() => {
            this.goToNext(node);
        }, 1000);
    }

    /**
     * Execute item node (give/take items)
     */
    executeItem(node) {
        const data = node.data;
        const action = data.action || 'give';
        const itemId = data.itemId || '';
        const amount = data.amount || 1;

        if (!itemId) {
            console.warn('⚠️ Item node has no itemId specified!');
            this.goToNext(node);
            return;
        }

        console.log(`🎁 ${action} ${amount}x ${itemId}`);

        if (action === 'give') {
            // Add items to player inventory
            if (this.voxelWorld && this.voxelWorld.inventory) {
                this.voxelWorld.inventory.addToInventory(itemId, amount);
                
                // Show status message
                const itemName = this.getItemDisplayName(itemId);
                this.voxelWorld.updateStatus(`🎁 Received ${amount}x ${itemName}!`, 'discovery');
                
                console.log(`✅ Gave player ${amount}x ${itemId}`);
            } else {
                console.error('❌ Inventory system not available!');
            }
            
        } else if (action === 'take') {
            // Remove items from player inventory
            if (this.voxelWorld && this.voxelWorld.inventory) {
                // Check if player has enough items
                const currentAmount = this.voxelWorld.countItemInSlots(itemId);
                
                if (currentAmount >= amount) {
                    this.voxelWorld.inventory.removeFromInventory(itemId, amount);
                    
                    // Show status message
                    const itemName = this.getItemDisplayName(itemId);
                    this.voxelWorld.updateStatus(`📦 Removed ${amount}x ${itemName}`, 'info');
                    
                    console.log(`✅ Took ${amount}x ${itemId} from player`);
                } else {
                    console.warn(`⚠️ Player doesn't have enough ${itemId} (has ${currentAmount}, needs ${amount})`);
                    
                    // Show warning message
                    const itemName = this.getItemDisplayName(itemId);
                    this.voxelWorld.updateStatus(`❌ Not enough ${itemName}!`, 'error');
                }
            } else {
                console.error('❌ Inventory system not available!');
            }
        } else {
            console.warn(`⚠️ Unknown item action: ${action}`);
        }
        
        this.goToNext(node);
    }

    /**
     * Get display name for an item (capitalize and format)
     */
    getItemDisplayName(itemId) {
        // Remove prefixes like "crafted_"
        let name = itemId.replace(/^crafted_/, '');
        
        // Replace underscores with spaces and capitalize each word
        name = name.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return name;
    }

    /**
     * Execute condition node (check inventory/state)
     */
    executeCondition(node) {
        const data = node.data;
        const checkType = data.checkType || 'hasItem';
        const value = data.value || '';

        console.log(`🔀 Checking condition: ${checkType} = ${value}`);
        
        // TODO: Implement condition checking
        // For now, assume success and go to first output
        this.goToNext(node);
    }

    /**
     * Execute trigger node (fire game event)
     */
    executeTrigger(node) {
        const data = node.data;
        const event = data.event || '';
        const params = data.params || {};

        console.log(`⚡ Triggering event: ${event}`, params);
        
        if (!event) {
            console.warn('⚠️ Trigger node has no event specified');
            this.goToNext(node);
            return;
        }

        // Handle different trigger types
        switch (event.toLowerCase()) {
            case 'playmusic':
                this.triggerPlayMusic(params);
                break;
            
            case 'stopmusic':
                this.triggerStopMusic();
                break;
            
            case 'playsound':
                this.triggerPlaySound(params);
                break;
            
            case 'setflag':
                this.triggerSetFlag(params);
                break;
            
            case 'spawnnpc':
                this.triggerSpawnNPC(params);
                break;
            
            case 'removenpc':
                this.triggerRemoveNPC(params);
                break;
            
            case 'showstatus':
                this.triggerShowStatus(params);
                break;
            
            case 'teleport':
                this.triggerTeleport(params);
                break;
            
            case 'settime':
                this.triggerSetTime(params);
                break;
            
            case 'setweather':
                this.triggerSetWeather(params);
                break;
            
            default:
                console.warn(`⚠️ Unknown trigger event: ${event}`);
                break;
        }
        
        // Continue to next node immediately (triggers are non-blocking)
        this.goToNext(node);
    }

    // ========================================
    // TRIGGER EVENT HANDLERS
    // ========================================

    /**
     * Play music track
     * params: { trackPath: 'music/forest.ogg' }
     */
    triggerPlayMusic(params) {
        const trackPath = params.trackPath || params.track || '';
        if (!trackPath) {
            console.warn('⚠️ playMusic trigger missing trackPath parameter');
            return;
        }

        console.log(`🎵 Playing music: ${trackPath}`);
        if (this.voxelWorld?.musicSystem) {
            this.voxelWorld.musicSystem.play(trackPath);
            this.voxelWorld.updateStatus(`🎵 Now playing: ${trackPath}`, 'info');
        } else {
            console.warn('⚠️ MusicSystem not available');
        }
    }

    /**
     * Stop current music
     */
    triggerStopMusic() {
        console.log('🎵 Stopping music');
        if (this.voxelWorld?.musicSystem) {
            // Stop both legacy single track and day/night tracks
            this.voxelWorld.musicSystem.stop();
            this.voxelWorld.musicSystem.stopDayNightMusic();
            this.voxelWorld.updateStatus('🎵 Music stopped', 'info');
        }
    }

    /**
     * Play a sound effect
     * params: { soundId: 'zombie', variation: true }
     */
    triggerPlaySound(params) {
        const soundId = params.soundId || params.sound || '';
        if (!soundId) {
            console.warn('⚠️ playSound trigger missing soundId parameter');
            return;
        }

        console.log(`🔊 Playing sound: ${soundId}`);
        if (this.voxelWorld?.sfxSystem) {
            if (params.variation) {
                this.voxelWorld.sfxSystem.playWithVariation(soundId);
            } else {
                this.voxelWorld.sfxSystem.play(soundId);
            }
        } else {
            console.warn('⚠️ SoundEffectsSystem not available');
        }
    }

    /**
     * Set a quest flag for use in conditions
     * params: { flag: 'metKing', value: true }
     */
    triggerSetFlag(params) {
        const flag = params.flag || params.name || '';
        const value = params.value ?? true;

        if (!flag) {
            console.warn('⚠️ setFlag trigger missing flag parameter');
            return;
        }

        if (!this.questFlags) {
            this.questFlags = new Map();
        }

        this.questFlags.set(flag, value);
        console.log(`🚩 Set flag: ${flag} = ${value}`);
        
        // Also save to localStorage for persistence
        try {
            const savedFlags = JSON.parse(localStorage.getItem('questFlags') || '{}');
            savedFlags[flag] = value;
            localStorage.setItem('questFlags', JSON.stringify(savedFlags));
            console.log(`💾 Flag saved to localStorage: ${flag}`);
        } catch (e) {
            console.error('❌ Failed to save flag to localStorage:', e);
        }
    }

    /**
     * Parse coordinate that can be absolute or player-relative
     * Examples: 100, "PX", "PX+5", "PY-10"
     * @param {string|number} coord - Coordinate value
     * @param {string} axis - 'x', 'y', or 'z'
     * @returns {number} Parsed coordinate
     */
    parseCoordinate(coord, axis) {
        if (coord === null || coord === undefined) return 0;
        
        // If it's already a number, return it
        if (typeof coord === 'number') return coord;
        
        // Convert to string and trim
        const str = String(coord).trim().toUpperCase();
        
        // Check if it's player-relative
        const axisKey = 'P' + axis.toUpperCase();
        if (str.startsWith(axisKey)) {
            const playerPos = this.voxelWorld?.player?.position;
            if (!playerPos) {
                console.warn(`⚠️ Player position not available for ${str}`);
                return 0;
            }
            
            const basePos = playerPos[axis];
            
            // Check for offset (e.g., "PX+5" or "PY-10")
            const offsetMatch = str.match(/[+-]\d+/);
            if (offsetMatch) {
                const offset = parseFloat(offsetMatch[0]);
                return basePos + offset;
            }
            
            // No offset, just return player position
            return basePos;
        }
        
        // Try to parse as number
        const parsed = parseFloat(str);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Spawn an NPC
     * params: { npcId: 'goblin', x: 10 or "PX+5", y: 5 or "PY", z: -3 or "PZ-2", scale: 1 }
     */
    triggerSpawnNPC(params) {
        const npcId = params.npcId || params.id || '';
        const x = this.parseCoordinate(params.x ?? 0, 'x');
        const y = this.parseCoordinate(params.y ?? 5, 'y');
        const z = this.parseCoordinate(params.z ?? 0, 'z');
        const scale = params.scale ?? 1;
        const name = params.name || npcId;

        if (!npcId) {
            console.warn('⚠️ spawnNPC trigger missing npcId parameter');
            return;
        }

        const playerPos = this.voxelWorld?.player?.position;
        console.log(`👤 Spawning NPC: ${npcId} "${name}" at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`);
        if (playerPos) {
            console.log(`   Player is at (${playerPos.x.toFixed(1)}, ${playerPos.y.toFixed(1)}, ${playerPos.z.toFixed(1)})`);
            const dist = Math.sqrt(Math.pow(x - playerPos.x, 2) + Math.pow(z - playerPos.z, 2));
            console.log(`   Distance from player: ${dist.toFixed(1)} blocks`);
        }
        
        if (this.voxelWorld?.npcManager) {
            const npc = this.voxelWorld.npcManager.spawn({
                id: `quest_npc_${npcId}_${Date.now()}`,
                name: name,
                emoji: params.emoji || '👤',
                position: new THREE.Vector3(x, y, z),
                scale: scale,
                onInteract: params.onInteract || null
            });
            
            // Track quest NPCs for cleanup
            this.questNPCs.push(npc);
            
            console.log(`   ✅ NPC spawned with ID: ${npc.id}`);
            this.voxelWorld.updateStatus(`👤 ${name} appeared!`, 'discovery');
        } else {
            console.warn('⚠️ NPCManager not available');
        }
    }

    /**
     * Remove an NPC by ID
     * params: { npcId: 'quest_npc_goblin_123456' }
     */
    triggerRemoveNPC(params) {
        const npcId = params.npcId || params.id || '';
        
        if (!npcId) {
            console.warn('⚠️ removeNPC trigger missing npcId parameter');
            return;
        }

        console.log(`👤 Removing NPC: ${npcId}`);
        
        if (this.voxelWorld?.npcManager) {
            this.voxelWorld.npcManager.remove(npcId);
            this.voxelWorld.updateStatus(`👤 NPC removed`, 'info');
        }
    }

    /**
     * Show a status message
     * params: { message: 'You found a secret!', type: 'discovery' }
     */
    triggerShowStatus(params) {
        const message = params.message || params.text || '';
        const type = params.type || 'info';

        if (!message) {
            console.warn('⚠️ showStatus trigger missing message parameter');
            return;
        }

        console.log(`📢 Status: ${message}`);
        
        if (this.voxelWorld?.updateStatus) {
            this.voxelWorld.updateStatus(message, type);
        }
    }

    /**
     * Teleport player to coordinates
     * params: { x: 100 or "PX+10", y: 10 or "PY", z: -50 or "PZ-5" }
     */
    triggerTeleport(params) {
        const x = this.parseCoordinate(params.x, 'x');
        const y = this.parseCoordinate(params.y, 'y');
        const z = this.parseCoordinate(params.z, 'z');

        console.log(`🌀 Teleporting player to (${x}, ${y}, ${z})`);
        
        if (this.voxelWorld) {
            // Set both player position (physics) and camera position (view)
            this.voxelWorld.player.position.x = x;
            this.voxelWorld.player.position.y = y;
            this.voxelWorld.player.position.z = z;
            this.voxelWorld.camera.position.set(x, y, z);
            this.voxelWorld.updateStatus(`🌀 Teleported to (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`, 'info');
        }
    }

    /**
     * Set time of day
     * params: { hour: 12.5 }
     */
    triggerSetTime(params) {
        const hour = params.hour ?? params.time ?? null;

        if (hour === null) {
            console.warn('⚠️ setTime trigger missing hour parameter');
            return;
        }

        console.log(`⏰ Setting time to ${hour}:00`);
        
        if (this.voxelWorld) {
            this.voxelWorld.currentTime = hour;
            if (this.voxelWorld.updateDayNightCycle) {
                this.voxelWorld.updateDayNightCycle();
            }
            const formatted = Math.floor(hour).toString().padStart(2, '0') + ':' + 
                              Math.floor((hour % 1) * 60).toString().padStart(2, '0');
            this.voxelWorld.updateStatus(`⏰ Time set to ${formatted}`, 'info');
        }
    }

    /**
     * Set weather (if weather system exists)
     * params: { weather: 'rain' }
     */
    triggerSetWeather(params) {
        const weather = params.weather || params.type || '';

        if (!weather) {
            console.warn('⚠️ setWeather trigger missing weather parameter');
            return;
        }

        console.log(`🌦️ Setting weather: ${weather}`);
        
        if (this.voxelWorld?.weatherSystem) {
            this.voxelWorld.weatherSystem.setWeather(weather);
            this.voxelWorld.updateStatus(`🌦️ Weather: ${weather}`, 'info');
        } else {
            console.warn('⚠️ Weather system not implemented yet');
            this.voxelWorld?.updateStatus(`🌦️ Weather triggers not yet implemented`, 'info');
        }
    }

    /**
     * Execute custom action code
     */
    executeAction(node) {
        const data = node.data;
        const actionType = data.actionType || 'custom';
        const code = data.code || '';

        console.log(`🎬 Executing action: ${actionType}`);
        
        if (actionType === 'custom' && code) {
            try {
                // Execute the custom code
                // eslint-disable-next-line no-eval
                eval(code);
                console.log(`✅ Action code executed: ${code.substring(0, 50)}...`);
            } catch (error) {
                console.error(`❌ Action code failed:`, error);
            }
        }
        
        // Continue to next node
        this.goToNext(node);
    }

    /**
     * Go to the next connected node
     */
    goToNext(currentNode, outputIndex = 0) {
        const nextNode = this.getNextNode(currentNode, outputIndex);
        
        if (nextNode) {
            this.executeNode(nextNode);
        } else {
            console.log('✅ Quest complete - end of chain');
            this.stopQuest();
        }
    }

    /**
     * Get the next connected node without executing it
     */
    getNextNode(currentNode, outputIndex = 0) {
        // Find outgoing connection - Sargem uses fromId/toId
        const outgoing = this.connections.filter(c => 
            (c.fromId || c.sourceId) === currentNode.id
        );
        
        if (outgoing.length === 0) {
            return null;
        }

        // Use specified output or first one
        const connection = outgoing[outputIndex] || outgoing[0];
        const targetId = connection.toId || connection.targetId;
        const nextNode = this.nodes.find(n => n.id === targetId);
        
        return nextNode || null;
    }

    /**
     * Stop the quest and cleanup
     */
    stopQuest() {
        console.log('🛑 Stopping quest');

        // Call completion callback if it exists (pass choice tracking)
        if (this.onQuestComplete) {
            console.log('📊 Quest complete, calling callback with choices:', this.choiceTracking);
            this.onQuestComplete(this.choiceTracking);
        }

        // Re-enable player controls after quest
        if (this.voxelWorld && this.voxelWorld.controlsEnabled !== undefined) {
            this.voxelWorld.controlsEnabled = true;
            console.log('🎮 Player controls re-enabled after quest');
        }

        this.isRunning = false;
        this.currentQuest = null;
        this.currentNodeId = null;
        this.nodes = [];
        this.connections = [];
        this.onQuestComplete = null;
        this.isSargemTest = false; // Clear test mode flag

        // Cleanup quest NPCs
        this.cleanupNPCs();
    }

    /**
     * Cleanup all quest NPCs
     */
    cleanupNPCs() {
        this.questNPCs.forEach(npc => {
            if (npc && npc.id) {
                this.voxelWorld.npcManager?.remove(npc.id);
            }
        });
        this.questNPCs = [];
    }

    /**
     * 🔗 Execute link_script node - Load and run another quest script
     */
    async executeLinkScript(node) {
        const data = node.data;
        const scriptPath = data.scriptPath || data.nextScript;
        
        if (!scriptPath) {
            console.error('❌ link_script node missing scriptPath!');
            this.stopQuest();
            return;
        }

        console.log(`🔗 Linking to script: ${scriptPath}`);
        
        // IMPORTANT: Call the completion callback BEFORE linking
        // This ensures playerData is saved before the linked script needs template variables
        if (this.onQuestComplete) {
            console.log('📊 Link_script calling completion callback with choices:', this.choiceTracking);
            const callback = this.onQuestComplete;
            this.onQuestComplete = null; // Clear so stopQuest doesn't call it again
            callback(this.choiceTracking);
            
            // Wait a brief moment for the callback to finish saving data
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        try {
            // Load the linked script
            const linkedQuestData = await this.loadQuestFile(scriptPath);
            
            // Apply template variable replacement if enabled
            if (data.useTemplates) {
                this.applyTemplateVariables(linkedQuestData);
            }
            
            // DON'T stop the quest or call callbacks - just transition to new script
            // The callback will only fire when the FINAL script in the chain ends
            console.log('🔄 Transitioning to linked script (callback already fired)');
            
            // Clean up current quest state
            this.cleanupNPCs();
            
            // Replace quest data with linked script
            this.nodes = linkedQuestData.nodes || [];
            this.connections = linkedQuestData.connections || [];
            this.currentQuest = linkedQuestData;
            this.currentNodeId = null;
            
            // Find and execute start node of linked script
            const startNode = this.findStartNode();
            if (startNode) {
                this.executeNode(startNode);
            } else {
                console.error('❌ No start node in linked script!');
                this.stopQuest();
            }
            
        } catch (error) {
            console.error(`❌ Failed to load linked script: ${scriptPath}`, error);
            this.stopQuest();
        }
    }

    /**
     * Load a quest file from data/
     */
    async loadQuestFile(filename) {
        // Ensure .json extension
        const path = filename.endsWith('.json') ? filename : `${filename}.json`;
        const fullPath = `data/${path}`;
        
        console.log(`📖 Loading quest file: ${fullPath}`);
        
        const response = await fetch(fullPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const questData = await response.json();
        console.log(`✅ Loaded quest: ${questData.nodes?.length || 0} nodes`);
        
        return questData;
    }

    /**
     * Apply template variable replacement to all dialogue nodes
     * {{companion_id}} → "elf_male"
     * {{companion_name}} → "Elf"
     * {{player_race}} → "Human"
     */
    applyTemplateVariables(questData) {
        const playerDataRaw = localStorage.getItem('NebulaWorld_playerData');
        console.log(`📦 Raw playerData from localStorage:`, playerDataRaw);
        
        const playerData = JSON.parse(playerDataRaw || '{}');
        console.log(`📦 Parsed playerData:`, playerData);
        
        const companionId = playerData.activeCompanion || playerData.starterMonster || 'rat';
        
        // Get companion name from entities.json (synchronous for now, could be cached)
        let companionName = companionId;
        const parts = companionId.split('_');
        if (parts.length > 0) {
            companionName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }
        
        const playerRace = playerData.character?.race || 'unknown';
        const playerRaceName = playerRace.charAt(0).toUpperCase() + playerRace.slice(1);
        
        console.log(`🔄 Applying template variables:`, {
            '{{companion_id}}': companionId,
            '{{companion_name}}': companionName,
            '{{player_race}}': playerRaceName
        });
        
        // Replace variables in all dialogue and choice nodes
        if (questData.nodes) {
            questData.nodes.forEach(node => {
                if (node.data) {
                    // Replace in text fields
                    if (node.data.text) {
                        const originalText = node.data.text;
                        node.data.text = node.data.text
                            .replace(/\{\{companion_id\}\}/g, companionId)
                            .replace(/\{\{companion_name\}\}/g, companionName)
                            .replace(/\{\{player_race\}\}/g, playerRaceName);
                        
                        if (originalText !== node.data.text) {
                            console.log(`  ✏️  Replaced text in node ${node.id}:`);
                            console.log(`    Before: "${originalText}"`);
                            console.log(`    After: "${node.data.text}"`);
                        }
                    }
                    
                    // Replace in question fields
                    if (node.data.question) {
                        const originalQuestion = node.data.question;
                        node.data.question = node.data.question
                            .replace(/\{\{companion_id\}\}/g, companionId)
                            .replace(/\{\{companion_name\}\}/g, companionName)
                            .replace(/\{\{player_race\}\}/g, playerRaceName);
                        
                        if (originalQuestion !== node.data.question) {
                            console.log(`  ✏️  Replaced question in node ${node.id}:`);
                            console.log(`    Before: "${originalQuestion}"`);
                            console.log(`    After: "${node.data.question}"`);
                        }
                    }
                    
                    // Replace in speaker/character fields
                    if (node.data.speaker) {
                        const originalSpeaker = node.data.speaker;
                        node.data.speaker = node.data.speaker
                            .replace(/\{\{companion_id\}\}/g, companionId)
                            .replace(/\{\{companion_name\}\}/g, companionName)
                            .replace(/\{\{player_race\}\}/g, playerRaceName);
                        
                        if (originalSpeaker !== node.data.speaker) {
                            console.log(`  ✏️  Replaced speaker in node ${node.id}: "${originalSpeaker}" → "${node.data.speaker}"`);
                        }
                    }
                    
                    if (node.data.character) {
                        const originalCharacter = node.data.character;
                        node.data.character = node.data.character
                            .replace(/\{\{companion_id\}\}/g, companionId)
                            .replace(/\{\{companion_name\}\}/g, companionName)
                            .replace(/\{\{player_race\}\}/g, playerRaceName);
                        
                        if (originalCharacter !== node.data.character) {
                            console.log(`  ✏️  Replaced character in node ${node.id}: "${originalCharacter}" → "${node.data.character}"`);
                        }
                    }
                }
            });
        }
    }
}
