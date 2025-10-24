/**
 * RenderProfileUI.js
 * Simple 3-button UI for switching render profiles
 */

export class RenderProfileUI {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;
        this.container = null;
        this.createUI();
    }

    createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'render-profile-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;

        // Profile buttons data
        const profiles = [
            { name: 'POTATO', icon: '🥔', tooltip: 'Potato Mode - Maximum Performance' },
            { name: 'BALANCED', icon: '⚙️', tooltip: 'Balanced - Recommended' },
            { name: 'GAMING', icon: '✨', tooltip: 'Gaming - Maximum Quality' }
        ];

        // Create buttons
        profiles.forEach(profile => {
            const button = this.createProfileButton(profile);
            this.container.appendChild(button);
        });

        document.body.appendChild(this.container);
        this.updateActiveButton();
    }

    createProfileButton(profile) {
        const button = document.createElement('button');
        button.className = 'profile-button';
        button.dataset.profile = profile.name;
        button.innerHTML = `${profile.icon}`;
        button.title = profile.tooltip;
        
        button.style.cssText = `
            width: 48px;
            height: 48px;
            font-size: 24px;
            border: 2px solid #666;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Hover effect
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active')) {
                button.style.background = 'rgba(50, 50, 50, 0.9)';
                button.style.borderColor = '#999';
            }
        });

        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
                button.style.background = 'rgba(0, 0, 0, 0.7)';
                button.style.borderColor = '#666';
            }
        });

        // Click handler
        button.addEventListener('click', () => {
            this.switchProfile(profile.name);
        });

        return button;
    }

    switchProfile(profileName) {
        if (this.voxelWorld.renderProfileManager) {
            const success = this.voxelWorld.renderProfileManager.applyProfile(profileName, true);
            if (success) {
                this.updateActiveButton();
            }
        }
    }

    updateActiveButton() {
        const currentProfile = this.voxelWorld.renderProfileManager?.getCurrentProfile();
        if (!currentProfile) return;

        // Update all buttons
        const buttons = this.container.querySelectorAll('.profile-button');
        buttons.forEach(button => {
            const isActive = button.dataset.profile === currentProfile;
            button.classList.toggle('active', isActive);
            
            if (isActive) {
                button.style.background = 'rgba(100, 150, 255, 0.8)';
                button.style.borderColor = '#4CAF50';
                button.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
            } else {
                button.style.background = 'rgba(0, 0, 0, 0.7)';
                button.style.borderColor = '#666';
                button.style.boxShadow = 'none';
            }
        });
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
