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
            bottom: 80px;
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
            pointer-events: none;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            min-width: 120px;
        `;

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

        // Hearts container with lighter background for visibility
        const heartsContainer = document.createElement('div');
        heartsContainer.className = `${type}-hearts`;
        heartsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 2px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.2);
            padding: 3px 6px;
            border-radius: 4px;
            width: 100%;
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

        // Update avatar sprite
        const spritePath = `art/player_avatars/${playerCharacter.race}_${playerCharacter.gender}.png`;
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
        const spritePath = `art/player_avatars/${race}_${gender}.png`;
        this.loadSprite(spritePath, this.companionAvatar);

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
}
