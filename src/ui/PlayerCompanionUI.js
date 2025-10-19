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
        avatar.src = 'art/player_avatars/human_male.png'; // Default
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
     * Load sprite with caching
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
            console.warn(`⚠️ Failed to load sprite: ${path}, using fallback`);
            // Keep default/current sprite
        };
        img.src = path;
    }

    /**
     * Update loop (call from game loop)
     */
    update() {
        if (!this.voxelWorld || !this.voxelWorld.playerCharacter) return;

        // Update player
        this.updatePlayer(this.voxelWorld.playerCharacter);

        // Update companion (TODO: get companion data from game)
        // For now, just hide it
        // this.updateCompanion(null);
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
