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
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationFrameId = null;
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Courier New', monospace;
        `;

        // Create animated canvas background
        this.createAnimatedBackground();

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

        // Version info (loaded dynamically from version.json)
        const versionInfo = document.createElement('div');
        versionInfo.textContent = 'Loading...';
        versionInfo.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            color: rgba(255, 255, 255, 0.3);
            font-size: 0.9rem;
        `;
        this.menuElement.appendChild(versionInfo);

        // Load version from version.json
        this.loadVersion(versionInfo);

        document.body.appendChild(this.menuElement);
        console.log('🎮 Main Menu displayed');
    }

    /**
     * Load version from version.json and display it
     */
    async loadVersion(versionElement) {
        try {
            const response = await fetch('./version.json');
            if (response.ok) {
                const versionData = await response.json();
                let versionString = `v${versionData.major}.${versionData.minor}.${versionData.revision}`;
                
                // Add seasonal emoji based on real-world date
                const now = new Date();
                const month = now.getMonth() + 1; // 1-12
                const day = now.getDate();
                
                // 🎃 Halloween - October 31st
                if (month === 10 && day === 31) {
                    versionString = `👻🎃 ${versionString}`;
                    console.log('🎃 Halloween version display active!');
                }
                // 🎄 Christmas Eve & Christmas Day - December 24-25
                else if (month === 12 && (day === 24 || day === 25)) {
                    versionString = `🎁🎄 ${versionString}`;
                    console.log('🎄 Christmas version display active!');
                }
                
                versionElement.textContent = versionString;
                console.log(`📦 Version loaded: ${versionString}`);
            } else {
                // Fallback if version.json not found
                versionElement.textContent = 'v0.8.1';
                console.warn('⚠️ Could not load version.json, using fallback');
            }
        } catch (error) {
            // Fallback on error
            versionElement.textContent = 'v0.8.1';
            console.error('❌ Error loading version:', error);
        }
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
     * Create animated canvas background with floating particles
     */
    createAnimatedBackground() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        `;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        this.menuElement.appendChild(this.canvas);
        
        // Create particles (optimized count)
        const particleCount = Math.min(80, Math.floor(this.canvas.width * this.canvas.height / 8000));
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                hue: Math.random() * 60 + 200 // Blue-purple range
            });
        }
        
        // Start animation
        this.animateBackground();
        
        // Handle window resize
        this.resizeHandler = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', this.resizeHandler);
    }
    
    /**
     * Animate background particles
     */
    animateBackground() {
        if (!this.ctx || !this.canvas) return;
        
        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f1c30');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
            this.ctx.fill();
            
            // Draw connections to nearby particles (optimized)
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 70%, 70%, ${(1 - dist / 120) * 0.2})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
        
        // Continue animation
        this.animationFrameId = requestAnimationFrame(() => this.animateBackground());
    }
    
    /**
     * Hide the menu and clean up resources
     */
    hide() {
        // Stop animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Clean up canvas
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
        
        // Clear particles array
        this.particles = [];
        
        // Remove menu element
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
            this.menuElement = null;
            console.log('🎮 Main Menu hidden (resources cleaned up)');
        }
    }

    /**
     * Check if menu is currently showing
     */
    isShowing() {
        return this.menuElement !== null && this.menuElement.parentNode !== null;
    }
}
