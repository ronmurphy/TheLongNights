/**
 * Chat.js
 *
 * Visual novel-style dialogue overlay system
 * Used for companion dialogue, tutorials, NPC interactions, story moments
 */

export class ChatOverlay {
    constructor(questRunner = null) {
        this.overlayElement = null;
        this.messageQueue = [];
        this.currentMessageIndex = 0;
        this.onSequenceComplete = null;
        this.questRunner = questRunner; // Reference to QuestRunner for test mode flag
    }

    /**
     * Show a single message
     * @param {Object} message - Message configuration
     * @param {string} message.character - Character ID (e.g., 'rat', 'goblin_grunt')
     * @param {string} message.name - Display name (e.g., 'Scrappy the Rat')
     * @param {string} message.portrait - Path to portrait image (optional, auto-loads from character ID)
     * @param {string} message.text - Dialogue text
     * @param {Function} onComplete - Callback when message is dismissed
     */
    showMessage(message, onComplete = null) {
        this.showSequence([message], onComplete);
    }

    /**
     * Show a sequence of messages
     * @param {Array} messages - Array of message objects
     * @param {Function} onComplete - Callback when all messages are shown
     */
    showSequence(messages, onComplete = null) {
        this.messageQueue = messages;
        this.currentMessageIndex = 0;
        this.onSequenceComplete = onComplete;

        // Create overlay if it doesn't exist
        if (!this.overlayElement) {
            this.createOverlay();
        }

        // Show first message
        this.showNextMessage();
    }

    createOverlay() {
        // Release pointer lock when chat opens
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        // Main overlay container (semi-transparent background)
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'chat-overlay';
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: flex-end;
            z-index: 50002;
            opacity: 0;
            transition: opacity 0.3s ease;
            padding-bottom: 40px;
        `;

        // Visual Novel style: Two portraits on sides
        const portraitsContainer = document.createElement('div');
        portraitsContainer.id = 'chat-portraits';
        portraitsContainer.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 5%;
            pointer-events: none;
            z-index: 50003;
        `;

        // Left portrait (Player)
        const leftPortraitContainer = document.createElement('div');
        leftPortraitContainer.id = 'chat-portrait-left-container';
        leftPortraitContainer.style.cssText = `
            position: relative;
            transition: opacity 0.3s, filter 0.3s;
        `;
        
        const leftPortrait = document.createElement('img');
        leftPortrait.id = 'chat-portrait-left';
        leftPortrait.style.cssText = `
            width: 300px;
            height: 400px;
            object-fit: contain;
            object-position: bottom;
            filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.8));
        `;
        
        const leftNameTag = document.createElement('div');
        leftNameTag.id = 'chat-name-left';
        leftNameTag.style.cssText = `
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%);
            border: 2px solid #D4AF37;
            border-radius: 20px;
            padding: 8px 20px;
            font-size: 18px;
            font-weight: bold;
            color: #2C1810;
            text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3);
            white-space: nowrap;
        `;
        
        leftPortraitContainer.appendChild(leftPortrait);
        leftPortraitContainer.appendChild(leftNameTag);
        portraitsContainer.appendChild(leftPortraitContainer);

        // Right portrait (Companion) - flipped horizontally
        const rightPortraitContainer = document.createElement('div');
        rightPortraitContainer.id = 'chat-portrait-right-container';
        rightPortraitContainer.style.cssText = `
            position: relative;
            transition: opacity 0.3s, filter 0.3s;
        `;
        
        const rightPortrait = document.createElement('img');
        rightPortrait.id = 'chat-portrait-right';
        rightPortrait.style.cssText = `
            width: 300px;
            height: 400px;
            object-fit: contain;
            object-position: bottom;
            transform: scaleX(-1);
            filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.8));
        `;
        
        const rightNameTag = document.createElement('div');
        rightNameTag.id = 'chat-name-right';
        rightNameTag.style.cssText = `
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%);
            border: 2px solid #D4AF37;
            border-radius: 20px;
            padding: 8px 20px;
            font-size: 18px;
            font-weight: bold;
            color: #2C1810;
            text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3);
            white-space: nowrap;
        `;
        
        rightPortraitContainer.appendChild(rightPortrait);
        rightPortraitContainer.appendChild(rightNameTag);
        portraitsContainer.appendChild(rightPortraitContainer);

        // Chat box container (now simpler, just text and button)
        const chatBox = document.createElement('div');
        chatBox.id = 'chat-box';
        chatBox.style.cssText = `
            width: 80%;
            max-width: 900px;
            background: linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%);
            border: 4px solid #4A3728;
            border-radius: 12px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
            padding: 20px;
            font-family: 'Georgia', serif;
            position: relative;
        `;

        // Speaker name (centered above text)
        const speakerName = document.createElement('div');
        speakerName.id = 'chat-speaker-name';
        speakerName.style.cssText = `
            font-size: 20px;
            font-weight: bold;
            color: #2C1810;
            text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3);
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #D4AF37;
        `;

        // Dialogue text area
        const textArea = document.createElement('div');
        textArea.id = 'chat-text';
        textArea.style.cssText = `
            font-size: 18px;
            line-height: 1.6;
            color: #2C1810;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            min-height: 80px;
        `;

        // Continue button
        const continueBtn = document.createElement('button');
        continueBtn.id = 'chat-continue-btn';
        continueBtn.textContent = 'Continue ▶';
        continueBtn.style.cssText = `
            float: right;
            padding: 10px 25px;
            font-size: 16px;
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #D4AF37 0%, #F4E4A6 50%, #D4AF37 100%);
            color: #2C1810;
            border: 2px solid #8B7355;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
        `;

        continueBtn.addEventListener('mouseover', () => {
            continueBtn.style.transform = 'scale(1.05)';
            continueBtn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
        });

        continueBtn.addEventListener('mouseout', () => {
            continueBtn.style.transform = 'scale(1)';
            continueBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
        });

        continueBtn.addEventListener('click', () => {
            console.log(`🖱️ Continue clicked: currentIndex=${this.currentMessageIndex}, queueLength=${this.messageQueue.length}`);
            
            // Check if there are more messages IN THE QUEUE after this one
            if (this.currentMessageIndex + 1 < this.messageQueue.length) {
                // There are more messages - advance to next one
                this.currentMessageIndex++;
                console.log(`➡️ Advancing to next message (index ${this.currentMessageIndex})`);
                this.showNextMessage();
            } else {
                // This was the last message - hide and call callback
                console.log('✅ Last message, hiding chat and calling callback');
                this.hide();
                if (this.onSequenceComplete) {
                    this.onSequenceComplete();
                }
            }
        });

        // Assemble chat box
        chatBox.appendChild(speakerName);
        chatBox.appendChild(textArea);
        chatBox.appendChild(continueBtn);
        
        // Add portraits and chat box to overlay
        this.overlayElement.appendChild(portraitsContainer);
        this.overlayElement.appendChild(chatBox);

        // Add to DOM but keep invisible
        document.body.appendChild(this.overlayElement);
        
        // DON'T fade in here - let showNextMessage do it after loading portrait
    }

    async showNextMessage() {
        console.log(`💬 showNextMessage: displaying message at index ${this.currentMessageIndex}`);
        
        const message = this.messageQueue[this.currentMessageIndex];
        // DON'T increment here - let the Continue button handler do it

        // Get portrait elements
        const leftPortrait = document.getElementById('chat-portrait-left');
        const rightPortrait = document.getElementById('chat-portrait-right');
        const leftName = document.getElementById('chat-name-left');
        const rightName = document.getElementById('chat-name-right');
        const leftContainer = document.getElementById('chat-portrait-left-container');
        const rightContainer = document.getElementById('chat-portrait-right-container');
        const speakerName = document.getElementById('chat-speaker-name');
        
        if (!leftPortrait || !rightPortrait) {
            console.warn('⚠️ Portrait elements not found - overlay may have been removed');
            return;
        }

        // Load player portrait (left side) - get from localStorage
        const playerDataRaw = localStorage.getItem('NebulaWorld_playerData');
        const playerData = JSON.parse(playerDataRaw || '{}');
        const playerRace = playerData.character?.race || 'human';
        const playerGender = playerData.character?.gender || 'male';
        const playerPortraitPath = `art/player_avatars/${playerRace}_${playerGender}.png`;
        
        leftPortrait.src = playerPortraitPath;
        leftName.textContent = 'You';
        
        // Determine who is speaking and load companion portrait (right side)
        const isNarrator = message.name === 'Narrator' || message.character === 'narrator';
        const isCompanionSpeaking = message.character && message.character !== 'player' && !isNarrator;
        
        if (isNarrator) {
            // Narrator mode - show narrator.png on both sides
            const narratorPath = 'art/player_avatars/narrator.png';
            leftPortrait.src = narratorPath;
            rightPortrait.src = narratorPath;
            leftName.textContent = 'Narrator';
            rightName.textContent = 'Narrator';
            
            // Both portraits equally visible for narrator
            leftContainer.style.opacity = '1';
            leftContainer.style.filter = 'brightness(1)';
            rightContainer.style.opacity = '1';
            rightContainer.style.filter = 'brightness(1)';
            
        } else if (isCompanionSpeaking) {
            // Check if we're in Sargem test mode
            const isSargemTest = this.questRunner && this.questRunner.isSargemTest;
            
            if (isSargemTest) {
                // Sargem test mode - always use black cat portrait
                console.log('🐈‍⬛ Sargem test mode - using cat_sit.png for companion portrait');
                const catPortraitPath = 'art/animals/cat_sit.png';
                
                const currentRightPortrait = document.getElementById('chat-portrait-right');
                if (currentRightPortrait) {
                    await new Promise((resolve) => {
                        currentRightPortrait.onload = () => {
                            console.log('✅ Sargem test cat portrait loaded');
                            resolve();
                        };
                        currentRightPortrait.onerror = (err) => {
                            console.error('❌ Sargem test cat portrait failed to load', err);
                            resolve();
                        };
                        currentRightPortrait.src = catPortraitPath;
                    });
                }
            } else {
                // Normal mode - load companion portrait from entities.json
                console.log(`🔍 Loading portrait for character: ${message.character}`);
                const loadStartTime = performance.now();
                
                const entityData = await ChatOverlay.loadCompanionData(message.character);
                const loadEndTime = performance.now();
                console.log(`⏱️ Entity data loaded in ${(loadEndTime - loadStartTime).toFixed(2)}ms`);
                
                // Check if elements still exist after async load
                const currentRightPortrait = document.getElementById('chat-portrait-right');
                if (!currentRightPortrait) {
                    console.warn('⚠️ Portrait element removed during async load');
                    return;
                }
                
                if (entityData && entityData.sprite_portrait) {
                    const isCompanion = entityData.type === 'companion';
                    const folder = isCompanion ? 'player_avatars' : 'entities';
                    const portraitPath = `art/${folder}/${entityData.sprite_portrait}`;
                    
                    console.log(`📸 Setting companion portrait: ${portraitPath}`);
                    const imgLoadStart = performance.now();
                    
                    // WAIT for image to load
                    await new Promise((resolve) => {
                        currentRightPortrait.onload = () => {
                            const imgLoadEnd = performance.now();
                            console.log(`✅ Companion portrait loaded in ${(imgLoadEnd - imgLoadStart).toFixed(2)}ms`);
                            resolve();
                        };
                        currentRightPortrait.onerror = (err) => {
                            console.error(`❌ Companion portrait failed to load: ${portraitPath}`, err);
                            resolve();
                        };
                        currentRightPortrait.src = portraitPath;
                    });
                }
            }
            
            // Set companion name
            rightName.textContent = message.name || message.character;
            
            // Highlight companion, dim player
            rightContainer.style.opacity = '1';
            rightContainer.style.filter = 'brightness(1)';
            leftContainer.style.opacity = '0.5';
            leftContainer.style.filter = 'brightness(0.6) grayscale(0.3)';
            
        } else {
            // Player is speaking - dim companion
            rightContainer.style.opacity = '0.5';
            rightContainer.style.filter = 'brightness(0.6) grayscale(0.3)';
            leftContainer.style.opacity = '1';
            leftContainer.style.filter = 'brightness(1)';
        }
        
        // Update speaker name and text
        speakerName.textContent = message.name || (isNarrator ? 'Narrator' : (isCompanionSpeaking ? 'Companion' : 'You'));
        
        const textArea = document.getElementById('chat-text');
        textArea.textContent = message.text;

        // Update continue button text
        const continueBtn = document.getElementById('chat-continue-btn');
        // Check if there are more messages AFTER this one
        if (this.currentMessageIndex + 1 >= this.messageQueue.length) {
            continueBtn.textContent = 'Close ✓';
        } else {
            continueBtn.textContent = 'Continue ▶';
        }
        
        // Fade in overlay now that everything is loaded
        if (this.overlayElement) {
            setTimeout(() => {
                if (this.overlayElement) {
                    this.overlayElement.style.opacity = '1';
                }
            }, 10);
        }
    }

    hide() {
        if (!this.overlayElement) return;

        // Immediately remove and clean up - no setTimeout!
        if (this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        this.overlayElement = null;

        // Re-request pointer lock after chat closes (multiple attempts for reliability)
        const reacquirePointerLock = () => {
            const canvas = document.querySelector('canvas');
            const voxelApp = window.voxelApp;

            // Don't re-engage pointer lock if workbench or other modals are open
            if (canvas && voxelApp) {
                const isWorkbenchOpen = voxelApp.workbenchSystem?.isOpen;
                const isToolBenchOpen = voxelApp.toolBenchSystem?.isOpen;
                const isKitchenOpen = voxelApp.kitchenBenchSystem?.isOpen;

                if (!isWorkbenchOpen && !isToolBenchOpen && !isKitchenOpen && !document.pointerLockElement) {
                    console.log('🔒 Re-acquiring pointer lock after chat close');
                    canvas.requestPointerLock();
                    
                    // Verify it worked after a short delay
                    setTimeout(() => {
                        if (!document.pointerLockElement) {
                            console.warn('⚠️ Pointer lock failed, retrying...');
                            canvas.requestPointerLock();
                        }
                    }, 50);
                }
            }
        };
        
        // Try immediately and again after a short delay
        setTimeout(reacquirePointerLock, 10);
        setTimeout(reacquirePointerLock, 100);
    }

    /**
     * Utility: Load companion data from entities.json
     * Returns promise with companion info
     */
    static async loadCompanionData(companionId) {
        try {
            const response = await fetch('art/entities/entities.json');
            const data = await response.json();
            return data.monsters[companionId];
        } catch (error) {
            console.error('Failed to load companion data:', error);
            return null;
        }
    }
}
