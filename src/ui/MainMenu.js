/**
 * 🎮 Main Menu System
 * Shows on game startup with options for:
 * - New Game (triggers personality quiz)
 * - Load Game (loads from localStorage)
 * - Dev Mode (calls unlockUI() with test data)
 */

export class MainMenu {
    constructor(onNewGame, onLoadGame, onDevMode) {
        this.onNewGame = onNewGame;
        this.onLoadGame = onLoadGame;
        this.onDevMode = onDevMode;
        this.menuElement = null;
    }

    /**
     * Create and show the main menu
     */
    show() {
        // Check if save game exists
        const hasSaveGame = localStorage.getItem('NebulaWorld_playerData') !== null;

        // Create menu overlay
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'main-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Courier New', monospace;
        `;

        // Title
        const title = document.createElement('h1');
        title.textContent = 'The Long Nights';
        title.style.cssText = `
            color: #f4e4c1;
            font-size: 4rem;
            margin-bottom: 1rem;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            letter-spacing: 2px;
        `;
        this.menuElement.appendChild(title);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.textContent = 'A Voxel Survival Adventure';
        subtitle.style.cssText = `
            color: #b8a68a;
            font-size: 1.2rem;
            margin-bottom: 3rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        this.menuElement.appendChild(subtitle);

        // Menu buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-width: 300px;
        `;

        // New Game button
        const newGameBtn = this.createMenuButton('🆕 New Game', 'Start a fresh adventure');
        newGameBtn.addEventListener('click', () => {
            this.hide();
            if (this.onNewGame) this.onNewGame();
        });
        buttonContainer.appendChild(newGameBtn);

        // Load Game button (disabled if no save exists)
        const loadGameBtn = this.createMenuButton(
            '📁 Load Game', 
            hasSaveGame ? 'Continue your adventure' : 'No saved game found',
            !hasSaveGame
        );
        if (hasSaveGame) {
            loadGameBtn.addEventListener('click', () => {
                this.hide();
                if (this.onLoadGame) this.onLoadGame();
            });
        }
        buttonContainer.appendChild(loadGameBtn);

        // Dev Mode button (always available)
        const devModeBtn = this.createMenuButton('🔧 Dev Mode', 'Skip setup for testing');
        devModeBtn.style.marginTop = '2rem';
        devModeBtn.style.opacity = '0.7';
        devModeBtn.addEventListener('click', () => {
            this.hide();
            if (this.onDevMode) this.onDevMode();
        });
        buttonContainer.appendChild(devModeBtn);

        this.menuElement.appendChild(buttonContainer);

        // Version info
        const versionInfo = document.createElement('div');
        versionInfo.textContent = 'v0.7.5';
        versionInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: rgba(255, 255, 255, 0.3);
            font-size: 0.9rem;
        `;
        this.menuElement.appendChild(versionInfo);

        document.body.appendChild(this.menuElement);
        console.log('🎮 Main Menu displayed');
    }

    /**
     * Create a styled menu button
     */
    createMenuButton(text, subtitle, disabled = false) {
        const button = document.createElement('button');
        button.style.cssText = `
            background: ${disabled ? 'rgba(100, 100, 100, 0.3)' : 'rgba(139, 115, 85, 0.9)'};
            border: 2px solid ${disabled ? '#555' : '#8b7355'};
            color: ${disabled ? '#888' : '#f4e4c1'};
            padding: 1rem 2rem;
            font-size: 1.2rem;
            font-family: 'Courier New', monospace;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            border-radius: 8px;
            text-align: left;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        `;

        const mainText = document.createElement('div');
        mainText.textContent = text;
        mainText.style.fontWeight = 'bold';
        button.appendChild(mainText);

        const subText = document.createElement('div');
        subText.textContent = subtitle;
        subText.style.cssText = `
            font-size: 0.8rem;
            opacity: 0.7;
        `;
        button.appendChild(subText);

        if (!disabled) {
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(139, 115, 85, 1)';
                button.style.transform = 'translateX(10px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(139, 115, 85, 0.9)';
                button.style.transform = 'translateX(0)';
            });
        }

        return button;
    }

    /**
     * Hide the menu
     */
    hide() {
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
            this.menuElement = null;
            console.log('🎮 Main Menu hidden');
        }
    }

    /**
     * Check if menu is currently showing
     */
    isShowing() {
        return this.menuElement !== null && this.menuElement.parentNode !== null;
    }
}
