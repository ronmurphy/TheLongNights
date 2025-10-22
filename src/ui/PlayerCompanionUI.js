/**
 * 🧙 Player + Companion Avatar UI
 * Flanks hotbar (player left, companion right) for combat visibility
 * Displays: Avatar sprite with animation frames, name, hearts (HP), stamina bar
 */

export class PlayerCompanionUI {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.playerPanel = null;
        this.companionPanel = null;
        this.playerAvatar = null;
        this.companionAvatar = null;

        // Sprite cache
        this.spriteCache = {};

        this.init();
    }

    init() {
        // Create player panel (LEFT of hotbar)
        this.playerPanel = this.createPanel('player', 'left');
        document.body.appendChild(this.playerPanel);

        // Create companion panel (RIGHT of hotbar)
        this.companionPanel = this.createPanel('companion', 'right');
        document.body.appendChild(this.companionPanel);

        console.log('🧙 Player + Companion UI initialized (flanking hotbar)');
    }

    /**
     * Create a character panel (player or companion)
     * @param {string} type - 'player' or 'companion'
     * @param {string} side - 'left' or 'right' (for positioning)
     */
    createPanel(type, side) {
        const panel = document.createElement('div');
        panel.className = `character-panel ${type}-panel`;

        // Position based on side
        const leftPos = side === 'left' ? '20px' : 'auto';
        const rightPos = side === 'right' ? '20px' : 'auto';

        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            ${side}: 20px;
            background: rgba(40, 30, 20, 0.95);
            border: 3px solid #8b7355;
            border-radius: 8px;
            padding: 10px;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            z-index: 100;
            pointer-events: auto;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            min-width: 120px;
            cursor: ${type === 'companion' ? 'pointer' : 'default'};
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;

        // Add click handler for companion panel
        if (type === 'companion') {
            panel.addEventListener('click', () => {
                this.openCompanionMenu();
            });

            // Hover effects for companion panel
            panel.addEventListener('mouseover', () => {
                panel.style.transform = 'scale(1.05)';
                panel.style.boxShadow = '0 6px 12px rgba(139, 115, 85, 0.8)';
            });

            panel.addEventListener('mouseout', () => {
                panel.style.transform = 'scale(1)';
                panel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
            });
        }

        // Avatar image (larger for combat visibility)
        const avatar = document.createElement('img');
        avatar.className = `${type}-avatar`;
        avatar.style.cssText = `
            width: 80px;
            height: 80px;
            display: block;
            image-rendering: pixelated;
            object-fit: contain;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            margin: 0 auto;
        `;
        // Don't set src here - wait for update() to load actual sprite
        // This prevents loading errors for avatars that don't exist yet
        panel.appendChild(avatar);

        // Store reference
        if (type === 'player') {
            this.playerAvatar = avatar;
        } else {
            this.companionAvatar = avatar;
        }

        // Name + Level
        const nameLabel = document.createElement('div');
        nameLabel.className = `${type}-name`;
        nameLabel.style.cssText = `
            color: #f4e4c1;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            width: 100%;
        `;
        nameLabel.textContent = type === 'player' ? 'You' : 'Companion';
        panel.appendChild(nameLabel);

        // Hearts container with lighter background for visibility and wrapping
        const heartsContainer = document.createElement('div');
        heartsContainer.className = `${type}-hearts`;
        heartsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 2px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.2);
            padding: 3px 6px;
            border-radius: 4px;
            width: 100%;
            max-height: 50px;
            overflow: hidden;
            line-height: 1;
        `;
        panel.appendChild(heartsContainer);

        // Stamina bar
        const staminaContainer = document.createElement('div');
        staminaContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #555;
            border-radius: 3px;
            height: 8px;
            overflow: hidden;
            width: 100%;
        `;

        const staminaBar = document.createElement('div');
        staminaBar.className = `${type}-stamina-bar`;
        staminaBar.style.cssText = `
            background: linear-gradient(to bottom, #90EE90, #228B22);
            height: 100%;
            width: 100%;
            transition: width 0.3s;
        `;
        staminaContainer.appendChild(staminaBar);
        panel.appendChild(staminaContainer);

        // Hunt status display (for companion only - shows "Exploring..." and timer)
        if (type === 'companion') {
            const huntStatus = document.createElement('div');
            huntStatus.className = 'companion-hunt-status';
            huntStatus.style.cssText = `
                display: none;
                color: #4fc3f7;
                font-size: 10px;
                font-weight: bold;
                text-align: center;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                width: 100%;
                background: rgba(79, 195, 247, 0.2);
                padding: 2px 4px;
                border-radius: 3px;
                margin-top: 2px;
            `;
            huntStatus.textContent = 'Starting...';
            panel.appendChild(huntStatus);
        }

        // Power bar (for spear charge - hidden by default, only shows for player)
        if (type === 'player') {
            const powerContainer = document.createElement('div');
            powerContainer.className = 'player-power-container';
            powerContainer.style.cssText = `
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 165, 0, 0.5);
                border-radius: 3px;
                height: 6px;
                overflow: hidden;
                width: 100%;
                display: none;
            `;

            const powerBar = document.createElement('div');
            powerBar.className = 'player-power-bar';
            powerBar.style.cssText = `
                background: linear-gradient(to right, #f59e0b, #ef4444);
                height: 100%;
                width: 0%;
                transition: width 0.05s linear;
            `;
            powerContainer.appendChild(powerBar);
            panel.appendChild(powerContainer);
        }

        return panel;
    }

    /**
     * Update player avatar and stats
     */
    updatePlayer(playerCharacter) {
        if (!playerCharacter) return;

        // Ensure gender is male or female for sprite loading
        // (nonbinary/random were converted to male/female during quiz)
        const spriteGender = (playerCharacter.gender === 'male' || playerCharacter.gender === 'female') 
            ? playerCharacter.gender 
            : 'male'; // Fallback to male if somehow invalid

        // Update avatar sprite
        const spritePath = `art/player_avatars/${playerCharacter.race}_${spriteGender}.png`;
        this.loadSprite(spritePath, this.playerAvatar);

        // Update name with race and level
        const nameLabel = this.playerPanel.querySelector('.player-name');
        const raceName = playerCharacter.race.charAt(0).toUpperCase() + playerCharacter.race.slice(1);
        nameLabel.textContent = `${raceName} (Lv ${playerCharacter.level})`;

        // Update hearts
        this.updateHearts(
            this.playerPanel.querySelector('.player-hearts'),
            playerCharacter.currentHP,
            playerCharacter.maxHP
        );

        // Update stamina
        const staminaPercent = (playerCharacter.currentStamina / playerCharacter.maxStamina) * 100;
        const staminaBar = this.playerPanel.querySelector('.player-stamina-bar');
        staminaBar.style.width = `${staminaPercent}%`;
    }

    /**
     * Update companion avatar and stats
     */
    updateCompanion(companionData) {
        if (!companionData) {
            // Hide companion panel if no companion
            this.companionPanel.style.display = 'none';
            return;
        }

        this.companionPanel.style.display = 'block';

        // For now, companions will use same race sprites
        // Later we'll have companion-specific sprites
        const race = companionData.race || 'human';
        const gender = companionData.gender || 'male';
        
        // Use current pose (default, attack, ready) - stored in voxelWorld.companionCombatSystem
        const pose = this.voxelWorld.companionCombatSystem?.companionPose || 'default';
        // Default pose has no suffix, attack/ready have _attack/_ready
        const spritePath = pose === 'default'
            ? `art/player_avatars/${race}_${gender}.png`
            : `art/player_avatars/${race}_${gender}_${pose}.png`;
        this.loadSprite(spritePath, this.companionAvatar);
        
        // Store companion info for pose updates
        this.currentCompanionData = { race, gender };

        // Update name
        const nameLabel = this.companionPanel.querySelector('.companion-name');
        nameLabel.textContent = companionData.name || 'Companion';

        // Update hearts
        this.updateHearts(
            this.companionPanel.querySelector('.companion-hearts'),
            companionData.currentHP || companionData.hp || 10,
            companionData.maxHP || companionData.hp || 10
        );

        // Update stamina (companions don't have stamina yet, so show full)
        const staminaBar = this.companionPanel.querySelector('.companion-stamina-bar');
        staminaBar.style.width = '100%';
    }

    /**
     * Update companion sprite pose (for combat animations)
     * @param {string} pose - 'default', 'attack', or 'ready'
     */
    updateCompanionPose(pose) {
        if (!this.currentCompanionData || !this.companionAvatar) return;
        
        const { race, gender } = this.currentCompanionData;
        // Default pose has no suffix, attack/ready have _attack/_ready
        const spritePath = pose === 'default' 
            ? `art/player_avatars/${race}_${gender}.png`
            : `art/player_avatars/${race}_${gender}_${pose}.png`;
        
        console.log(`🎨 Companion pose update requested: ${pose} (${spritePath})`);
        
        // Force browser to reload image by clearing src first, then setting new one
        // This ensures visual update even if it's the same image file
        this.companionAvatar.src = '';
        
        // Use requestAnimationFrame to ensure DOM updates between clearing and setting
        requestAnimationFrame(() => {
            if (this.spriteCache[spritePath]) {
                this.companionAvatar.src = this.spriteCache[spritePath];
            } else {
                this.loadSprite(spritePath, this.companionAvatar);
            }
        });
    }

    /**
     * Update player sprite pose (for combat animations)
     * @param {string} pose - 'default', 'attack', or 'ready'
     */
    updatePlayerPose(pose) {
        if (!this.voxelWorld.playerCharacter || !this.playerAvatar) return;
        
        const race = this.voxelWorld.playerCharacter.race || 'human';
        const gender = this.voxelWorld.playerCharacter.gender || 'male';
        // Default pose has no suffix, attack/ready have _attack/_ready
        const spritePath = pose === 'default' 
            ? `art/player_avatars/${race}_${gender}.png`
            : `art/player_avatars/${race}_${gender}_${pose}.png`;
        
        console.log(`🎨 Player pose update requested: ${pose} (${spritePath})`);
        
        // Force browser to reload image by clearing src first, then setting new one
        // This ensures visual update even if it's the same image file
        this.playerAvatar.src = '';
        
        // Use requestAnimationFrame to ensure DOM updates between clearing and setting
        requestAnimationFrame(() => {
            if (this.spriteCache[spritePath]) {
                this.playerAvatar.src = this.spriteCache[spritePath];
            } else {
                this.loadSprite(spritePath, this.playerAvatar);
            }
        });
    }

    /**
     * Update hearts display (2 HP = 1 ❤️, 1 HP = 1 💔, 0 HP = 1 💜)
     */
    updateHearts(container, currentHP, maxHP) {
        container.innerHTML = '';

        const maxHearts = Math.ceil(maxHP / 2);
        const fullHearts = Math.floor(currentHP / 2);
        const hasHalfHeart = (currentHP % 2) === 1;

        // Add full hearts (red)
        for (let i = 0; i < fullHearts; i++) {
            const heart = document.createElement('span');
            heart.textContent = '❤️';
            container.appendChild(heart);
        }

        // Add half heart (broken) if 1 HP remaining
        if (hasHalfHeart) {
            const halfHeart = document.createElement('span');
            halfHeart.textContent = '💔';
            container.appendChild(halfHeart);
        }

        // Add empty hearts (purple for "dead" hearts)
        const emptyHearts = maxHearts - fullHearts - (hasHalfHeart ? 1 : 0);
        for (let i = 0; i < emptyHearts; i++) {
            const emptyHeart = document.createElement('span');
            emptyHeart.textContent = '💜';
            emptyHeart.style.opacity = '0.6';
            container.appendChild(emptyHeart);
        }
    }

    /**
     * Update companion hunt status display
     * Called by CompanionHuntSystem to show timer
     */
    updateHuntStatus(statusText) {
        const huntStatus = this.companionPanel?.querySelector('.companion-hunt-status');
        if (huntStatus) {
            if (statusText) {
                huntStatus.textContent = statusText;
                huntStatus.style.display = 'block';
                
                // Add visual feedback when hunting
                if (this.companionPanel) {
                    this.companionPanel.style.border = '3px solid #4fc3f7';
                    this.companionPanel.style.boxShadow = '0 4px 8px rgba(79, 195, 247, 0.6), inset 0 0 10px rgba(79, 195, 247, 0.3)';
                }
            } else {
                huntStatus.style.display = 'none';
                
                // Reset visual feedback
                if (this.companionPanel) {
                    this.companionPanel.style.border = '3px solid #8B7355';
                    this.companionPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
                }
            }
        }
    }

    /**
     * Load sprite with caching and gender fallback
     * If female/nonbinary sprite doesn't exist, falls back to male sprite
     */
    loadSprite(path, imgElement) {
        if (this.spriteCache[path]) {
            imgElement.src = this.spriteCache[path];
            return;
        }

        // Try to load the sprite
        const img = new Image();
        img.onload = () => {
            this.spriteCache[path] = path;
            imgElement.src = path;
            console.log(`✅ Loaded sprite: ${path}`);
        };
        img.onerror = () => {
            // Fallback logic: Try male version if female/nonbinary sprite doesn't exist
            const fallbackPath = path.replace(/_female\.png$/, '_male.png')
                                     .replace(/_nonbinary\.png$/, '_male.png');
            
            if (fallbackPath !== path && !this.spriteCache[fallbackPath]) {
                console.warn(`⚠️ Failed to load sprite: ${path}, trying fallback: ${fallbackPath}`);
                
                // Try loading male version
                const fallbackImg = new Image();
                fallbackImg.onload = () => {
                    this.spriteCache[path] = fallbackPath; // Cache the fallback for this path
                    imgElement.src = fallbackPath;
                    console.log(`✅ Loaded fallback sprite: ${fallbackPath}`);
                };
                fallbackImg.onerror = () => {
                    console.error(`❌ Failed to load fallback sprite: ${fallbackPath}`);
                    // Keep default/current sprite - no image loaded
                };
                fallbackImg.src = fallbackPath;
            } else {
                console.warn(`⚠️ Failed to load sprite: ${path}, no fallback available`);
                // Keep default/current sprite
            }
        };
        img.src = path;
    }

    /**
     * Update loop (call from game loop)
     */
    async update() {
        if (!this.voxelWorld || !this.voxelWorld.playerCharacter) return;

        // Only show if player has created their character (has playerData saved)
        const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
        
        // Don't show panels if no character data exists yet (before questions answered)
        if (!playerData.character || !playerData.starterMonster) {
            this.hide();
            return;
        }

        // Update player
        this.updatePlayer(this.voxelWorld.playerCharacter);

        // Update companion - load from playerData
        const companionId = playerData.activeCompanion || playerData.starterMonster;
        
        if (companionId) {
            // Parse companion ID (e.g., "elf_male" → race: "elf", gender: "male")
            const parts = companionId.split('_');
            const race = parts[0] || 'human';
            const gender = parts[1] || 'male';
            
            // Load companion data from entities.json
            const entityData = await this.loadCompanionData(companionId);
            const companionData = {
                race: race,
                gender: gender,
                name: entityData ? entityData.name : race.charAt(0).toUpperCase() + race.slice(1),
                currentHP: playerData.companionHP?.[companionId] || (entityData?.hp || 10),
                maxHP: entityData?.hp || 10
            };
            
            this.updateCompanion(companionData);
        } else {
            this.updateCompanion(null);
        }
    }
    
    /**
     * Load companion data from entities.json
     */
    async loadCompanionData(companionId) {
        try {
            const response = await fetch('art/entities/entities.json');
            const data = await response.json();
            return data.monsters[companionId];
        } catch (error) {
            console.error('Failed to load companion data:', error);
            return null;
        }
    }

    /**
     * Show UI
     */
    show() {
        if (this.playerPanel) {
            this.playerPanel.style.display = 'flex';
        }
        if (this.companionPanel) {
            this.companionPanel.style.display = 'flex';
        }
    }

    /**
     * Hide UI
     */
    hide() {
        if (this.playerPanel) {
            this.playerPanel.style.display = 'none';
        }
        if (this.companionPanel) {
            this.companionPanel.style.display = 'none';
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.playerPanel && this.playerPanel.parentNode) {
            this.playerPanel.parentNode.removeChild(this.playerPanel);
        }
        if (this.companionPanel && this.companionPanel.parentNode) {
            this.companionPanel.parentNode.removeChild(this.companionPanel);
        }
    }

    /**
     * Open companion menu modal
     */
    openCompanionMenu() {
        // Get companion data
        const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
        const companionId = playerData.activeCompanion || playerData.starterMonster;
        
        if (!companionId) {
            console.warn('⚠️ No companion found');
            return;
        }

        // Close existing menu if open
        this.closeCompanionMenu();

        // Disable controls and pause game
        this.voxelWorld.controlsEnabled = false;
        this.voxelWorld.isPaused = true;

        // Create menu modal
        const menu = document.createElement('div');
        menu.id = 'companion-menu-modal';
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50000;
            animation: fadeIn 0.3s ease;
        `;

        // Menu container
        const container = document.createElement('div');
        container.style.cssText = `
            background: linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%);
            border: 6px solid #4A3728;
            border-radius: 16px;
            padding: 30px;
            min-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            font-family: 'Georgia', serif;
        `;

        // Parse companion ID
        const parts = companionId.split('_');
        const race = parts[0] || 'human';
        const companionName = race.charAt(0).toUpperCase() + race.slice(1);

        // Title
        const title = document.createElement('h2');
        title.textContent = `${companionName} 🐕`;
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #2C1810;
            text-align: center;
            font-size: 24px;
            text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3);
        `;

        // HP Display (load from playerData)
        const companionHP = playerData.companionHP?.[companionId] || 10;
        const hpDisplay = document.createElement('div');
        hpDisplay.textContent = `❤️ HP: ${companionHP}`;
        hpDisplay.style.cssText = `
            text-align: center;
            font-size: 16px;
            color: #2C1810;
            margin-bottom: 20px;
        `;

        // Check if companion is currently exploring
        const isExploring = this.voxelWorld.companionHuntSystem?.isActive;

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;

        // SEND TO HUNT button (or RECALL if exploring)
        if (isExploring) {
            const itemsFound = this.voxelWorld.companionHuntSystem.discoveries?.length || 0;
            const recallBtn = this.createMenuButton(
                `📢 Recall Companion (${itemsFound} items found)`, 
                '#F44336'
            );
            recallBtn.addEventListener('click', () => {
                this.voxelWorld.companionHuntSystem.cancelHunt();
                this.closeCompanionMenu();
            });
            buttonContainer.appendChild(recallBtn);
        } else {
            const huntBtn = this.createMenuButton('🎯 Send to Hunt', '#4CAF50');
            huntBtn.addEventListener('click', () => {
                this.closeCompanionMenu();
                this.openHuntDurationPicker(companionId, companionName);
            });
            buttonContainer.appendChild(huntBtn);
        }

        // CODEX button
        const codexBtn = this.createMenuButton('📖 Open Codex', '#2196F3');
        codexBtn.addEventListener('click', () => {
            this.closeCompanionMenu();
            if (this.voxelWorld.companionCodex) {
                this.voxelWorld.companionCodex.show();
            }
        });
        buttonContainer.appendChild(codexBtn);

        // CLOSE button
        const closeBtn = this.createMenuButton('✕ Close', '#757575');
        closeBtn.addEventListener('click', () => {
            this.closeCompanionMenu();
        });
        buttonContainer.appendChild(closeBtn);

        // Assemble menu
        container.appendChild(title);
        container.appendChild(hpDisplay);
        container.appendChild(buttonContainer);
        menu.appendChild(container);
        document.body.appendChild(menu);

        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeCompanionMenu();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        console.log('🐕 Companion menu opened');
    }

    /**
     * Close companion menu
     */
    closeCompanionMenu() {
        const menu = document.getElementById('companion-menu-modal');
        if (menu) {
            menu.remove();
        }

        // Re-enable controls and unpause game
        this.voxelWorld.controlsEnabled = true;
        this.voxelWorld.isPaused = false;

        // Re-request pointer lock
        setTimeout(() => {
            if (this.voxelWorld.controlsEnabled && this.voxelWorld.renderer?.domElement) {
                this.voxelWorld.renderer.domElement.requestPointerLock();
            }
        }, 100);
    }

    /**
     * Create a menu button
     */
    createMenuButton(text, bgColor) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            background: ${bgColor};
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-family: 'Georgia', serif;
            transition: opacity 0.2s, transform 0.1s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;
        btn.addEventListener('mouseover', () => {
            btn.style.opacity = '0.8';
            btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0)';
        });
        return btn;
    }

    /**
     * Open hunt duration picker
     */
    openHuntDurationPicker(companionId, companionName) {
        // Create picker modal
        const picker = document.createElement('div');
        picker.id = 'hunt-duration-picker';
        picker.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50001;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background: linear-gradient(135deg, #8B7355 0%, #A0826D 50%, #8B7355 100%);
            border: 6px solid #4A3728;
            border-radius: 16px;
            padding: 30px;
            min-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            font-family: 'Georgia', serif;
        `;

        const title = document.createElement('h2');
        title.textContent = `🎯 Hunt Duration`;
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #2C1810;
            text-align: center;
            font-size: 24px;
        `;

        const description = document.createElement('p');
        description.textContent = `How long should ${companionName} explore?`;
        description.style.cssText = `
            color: #2C1810;
            text-align: center;
            margin-bottom: 20px;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;

        // Duration options
        const durations = [
            { days: 0.5, label: '½ Day (10 min)', color: '#4CAF50' },
            { days: 1, label: '1 Day (20 min)', color: '#2196F3' },
            { days: 2, label: '2 Days (40 min)', color: '#FF9800' }
        ];

        durations.forEach(({ days, label, color }) => {
            const btn = this.createMenuButton(label, color);
            btn.addEventListener('click', () => {
                this.startHunt(companionId, companionName, days);
                picker.remove();
            });
            buttonContainer.appendChild(btn);
        });

        // Cancel button
        const cancelBtn = this.createMenuButton('✕ Cancel', '#757575');
        cancelBtn.addEventListener('click', () => {
            picker.remove();
            // Re-open companion menu
            this.openCompanionMenu();
        });
        buttonContainer.appendChild(cancelBtn);

        container.appendChild(title);
        container.appendChild(description);
        container.appendChild(buttonContainer);
        picker.appendChild(container);
        document.body.appendChild(picker);
    }

    /**
     * Start companion hunt
     */
    startHunt(companionId, companionName, durationDays) {
        // Load full companion data
        this.loadCompanionData(companionId).then(entityData => {
            const companion = {
                id: companionId,
                name: companionName,
                hp: entityData?.hp || 10,
                maxHP: entityData?.hp || 10
            };

            if (this.voxelWorld.companionHuntSystem) {
                const success = this.voxelWorld.companionHuntSystem.startHunt(companion, durationDays);
                
                if (success) {
                    console.log(`🐕 ${companionName} started ${durationDays}-day hunt`);
                } else {
                    console.warn('⚠️ Failed to start hunt');
                }
            } else {
                console.error('❌ CompanionHuntSystem not available');
            }
        });
    }
}
