/**
 * PlayerHP.js
 *
 * Player health system for battle arena
 * Displays hearts on HUD, handles damage, and respawn on defeat
 */

export class PlayerHP {
    constructor(voxelWorld) {
        this.voxelWorld = voxelWorld;

        // Health settings (synced with PlayerCharacter: 2 HP = 1 heart)
        this.maxHP = 6; // 6 HP = 3 hearts
        this.currentHP = 6;

        // Damage cooldown (prevent rapid damage)
        this.invulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second

        // Fall damage tracking
        this.lastYPosition = 0;
        this.highestYPosition = 0;
        this.isFalling = false;

        // HUD elements
        this.heartContainer = null;
        this.hearts = [];

        // Create HUD
        this.createHeartDisplay();

        console.log('❤️ PlayerHP system initialized: 6/6 HP (3 hearts)');
    }

    /**
     * Create heart HUD display
     */
    createHeartDisplay() {
        // Create container div
        // HIDDEN: Hearts now shown in Party UI instead
        this.heartContainer = document.createElement('div');
        this.heartContainer.id = 'player-hearts';
        this.heartContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            gap: 8px;
            font-size: 32px;
            z-index: 1000;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
            pointer-events: none;
        `;

        // Create 3 heart elements (maxHP / 2 = num hearts)
        const numHearts = Math.ceil(this.maxHP / 2);
        for (let i = 0; i < numHearts; i++) {
            const heart = document.createElement('span');
            heart.textContent = '❤️'; // Red heart emoji
            heart.style.cssText = `
                display: inline-block;
                transition: transform 0.2s ease;
            `;
            this.heartContainer.appendChild(heart);
            this.hearts.push(heart);
        }

        document.body.appendChild(this.heartContainer);
        console.log('❤️ Heart HUD created');
    }

    /**
     * Update heart display
     * DISABLED: Hearts now shown in PlayerCompanionUI instead
     */
    updateHeartDisplay() {
        // No-op - hearts are now displayed in PlayerCompanionUI
        return;
    }

    /**
     * Take damage
     * @param {number} amount - Amount of damage (default 1)
     * @returns {boolean} - True if damage was applied, false if invulnerable
     */
    takeDamage(amount = 1) {
        if (this.invulnerable || this.currentHP <= 0) {
            return false;
        }

        // 🛡️ WOODEN SHIELD: 30% chance to block damage
        const hasShield = this.voxelWorld.inventory && this.checkForShield();
        if (hasShield && Math.random() < 0.3) {
            console.log(`🛡️ BLOCKED! Wooden shield deflected ${amount} damage!`);
            this.voxelWorld.updateStatus(`🛡️ BLOCKED! Shield deflected attack!`, 'discovery');
            this.voxelWorld.createExplosionEffect(
                this.voxelWorld.player.position.x,
                this.voxelWorld.player.position.y + 1,
                this.voxelWorld.player.position.z,
                'shield_block'
            );
            return false; // Damage blocked!
        }

        // Apply damage
        this.currentHP = Math.max(0, this.currentHP - amount);
        console.log(`💔 Player took ${amount} damage! HP: ${this.currentHP}/${this.maxHP}`);

        // Update PlayerCharacter HP to stay in sync
        if (this.voxelWorld.playerCharacter) {
            this.voxelWorld.playerCharacter.currentHP = this.currentHP;
        }

        // Update display (old heart system - disabled)
        this.updateHeartDisplay();

        // 🔄 Update PlayerCompanionUI to show heart changes
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updatePlayer(this.voxelWorld.playerCharacter);
        }

        // ⚔️ Trigger companion combat system (player took damage)
        if (this.voxelWorld.companionCombatSystem) {
            this.voxelWorld.companionCombatSystem.onPlayerHit(amount);
        }

        // Flash screen red
        this.flashDamage();

        // Enable invulnerability
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerabilityDuration);

        // Pulse damaged heart (DISABLED - using PlayerCompanionUI now)
        // The old heart HUD is no longer used, hearts are in PlayerCompanionUI
        /*
        if (this.currentHP < this.maxHP) {
            const damagedHeart = this.hearts[this.currentHP];
            if (damagedHeart) {
                damagedHeart.style.animation = 'heartPulse 0.5s ease';
                setTimeout(() => {
                    damagedHeart.style.animation = '';
                }, 500);
            }
        }
        */

        // Check for death
        if (this.currentHP <= 0) {
            this.onDeath();
        }

        return true;
    }

    /**
     * Heal player
     * @param {number} amount - Amount to heal (default 1)
     */
    heal(amount = 1) {
        if (this.currentHP >= this.maxHP) {
            console.log('❤️ Player already at full health');
            return 0; // Return 0 HP healed
        }

        const oldHP = this.currentHP;
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
        const actualHealed = this.currentHP - oldHP;
        
        console.log(`💚 Player healed ${actualHealed} HP! HP: ${this.currentHP}/${this.maxHP}`);

        // Update PlayerCharacter HP to stay in sync
        if (this.voxelWorld.playerCharacter) {
            this.voxelWorld.playerCharacter.currentHP = this.currentHP;
            console.log(`💚 Synced PlayerCharacter HP to ${this.voxelWorld.playerCharacter.currentHP}`);
        }

        // Update display (old heart system - disabled)
        this.updateHeartDisplay();

        // 🔄 Update PlayerCompanionUI to show heart changes
        if (this.voxelWorld.playerCompanionUI) {
            // Small delay to ensure sync completes
            setTimeout(() => {
                this.voxelWorld.playerCompanionUI.updatePlayer(this.voxelWorld.playerCharacter);
                console.log(`💚 UI updated with HP: ${this.voxelWorld.playerCharacter?.currentHP}/${this.voxelWorld.playerCharacter?.maxHP}`);
            }, 10);
            
            // Show green heart animation over player panel (colorblind friendly)
            this.voxelWorld.playerCompanionUI.showHealingHeart();
        } else {
            // Fallback: Flash green healing indicator if no UI
            this.flashHeal();
        }

        // Pulse healed heart
        const healedHeart = this.hearts[oldHP];
        if (healedHeart) {
            healedHeart.style.animation = 'heartHeal 0.5s ease';
            setTimeout(() => {
                healedHeart.style.animation = '';
            }, 500);
        }

        // Auto-hide hearts when fully healed
        if (this.currentHP >= this.maxHP) {
            setTimeout(() => {
                this.hide();
                console.log('❤️ Fully healed - hearts hidden');
            }, 1000); // Wait 1 second so player sees the full heal
        }
        
        return actualHealed; // Return amount actually healed
    }

    /**
     * Flash red damage indicator
     */
    flashDamage() {
        // Create red overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 999;
            animation: damageFlash 0.3s ease;
        `;

        document.body.appendChild(overlay);
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }

    /**
     * Flash green healing indicator
     * Using fade-in-out instead of full screen flash (better for colorblind users)
     */
    flashHeal() {
        // Create green overlay with fade animation
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 255, 0, 0);
            pointer-events: none;
            z-index: 999;
            transition: background 0.3s ease;
        `;

        document.body.appendChild(overlay);
        
        // Fade in
        requestAnimationFrame(() => {
            overlay.style.background = 'rgba(0, 255, 0, 0.15)';
        });
        
        // Fade out and remove
        setTimeout(() => {
            overlay.style.background = 'rgba(0, 255, 0, 0)';
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 300);
        }, 200);
        
        console.log('💚 Green heal flash displayed');
    }

    /**
     * Handle player death
     */
    onDeath() {
        console.log('💀 Player defeated!');

        // End battle immediately
        if (this.voxelWorld.battleArena && this.voxelWorld.battleArena.isActive) {
            // Show defeat dialogue
            this.voxelWorld.battleArena.showPlayerDefeatDialogue();
        }
    }

    /**
     * Reset HP to full (for respawn)
     */
    reset() {
        this.currentHP = this.maxHP;
        this.invulnerable = false;
        
        // Update PlayerCharacter HP to stay in sync
        if (this.voxelWorld.playerCharacter) {
            this.voxelWorld.playerCharacter.currentHP = this.currentHP;
        }
        
        this.updateHeartDisplay();
        
        // 🔄 Update PlayerCompanionUI
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updatePlayer(this.voxelWorld.playerCharacter);
        }
        
        console.log('❤️ Player HP reset: 6/6 HP (3 hearts)');
    }

    /**
     * Set HP to specific amount (for respawn with 1 heart)
     */
    setHP(amount) {
        this.currentHP = Math.max(0, Math.min(this.maxHP, amount));
        
        // Update PlayerCharacter HP to stay in sync
        if (this.voxelWorld.playerCharacter) {
            this.voxelWorld.playerCharacter.currentHP = this.currentHP;
        }
        
        this.updateHeartDisplay();
        
        // 🔄 Update PlayerCompanionUI
        if (this.voxelWorld.playerCompanionUI) {
            this.voxelWorld.playerCompanionUI.updatePlayer(this.voxelWorld.playerCharacter);
        }
        
        console.log(`❤️ Player HP set to: ${this.currentHP}/${this.maxHP}`);
    }

    /**
     * Check if player is in danger zone and near enemy
     * Called from BattleArena update loop
     */
    checkDangerZoneCollision(dangerZoneBounds, enemySprite) {
        if (!enemySprite || this.currentHP <= 0) return;

        const playerPos = this.voxelWorld.player.position;

        // Check if player is in danger zone
        const inDangerZone = (
            playerPos.x >= dangerZoneBounds.minX &&
            playerPos.x <= dangerZoneBounds.maxX &&
            playerPos.z >= dangerZoneBounds.minZ &&
            playerPos.z <= dangerZoneBounds.maxZ
        );

        if (!inDangerZone) return;

        // Check distance to enemy sprite
        const enemyPos = enemySprite.position;
        const distance = Math.sqrt(
            Math.pow(playerPos.x - enemyPos.x, 2) +
            Math.pow(playerPos.z - enemyPos.z, 2)
        );

        // Collision threshold (player hitbox radius + sprite radius)
        const collisionDistance = 1.0; // Adjust based on testing

        if (distance < collisionDistance) {
            console.log('💥 Player collided with enemy!');
            this.takeDamage(1);
        }
    }

    /**
     * 🛡️ Check if player has wooden shield in inventory or equipped
     */
    checkForShield() {
        if (!this.voxelWorld.inventory) return false;

        // Check hotbar slots
        const hotbarSlots = this.voxelWorld.inventory.hotbarSlots || [];
        for (const slot of hotbarSlots) {
            if (slot.itemType === 'wooden_shield' ||
                slot.itemType === 'crafted_wooden_shield' ||
                slot.itemType === 'wood_shield') {
                return true;
            }
        }

        // Check backpack slots
        const backpackSlots = this.voxelWorld.inventory.backpackSlots || [];
        for (const slot of backpackSlots) {
            if (slot.itemType === 'wooden_shield' ||
                slot.itemType === 'crafted_wooden_shield' ||
                slot.itemType === 'wood_shield') {
                return true;
            }
        }

        return false;
    }

    /**
     * 🪂 Update fall damage tracking (call every frame)
     */
    updateFallDamage() {
        if (!this.voxelWorld.player) return;

        const currentY = this.voxelWorld.player.position.y;

        // Track highest position
        if (currentY > this.highestYPosition) {
            this.highestYPosition = currentY;
            this.isFalling = false;
        }

        // Check if falling (moving downward)
        if (currentY < this.lastYPosition) {
            this.isFalling = true;
        }

        // Check if just landed (was falling, now stopped or moving up)
        if (this.isFalling && currentY >= this.lastYPosition) {
            const fallDistance = this.highestYPosition - currentY;

            // 💔 0.5 hearts per 5 blocks fallen
            if (fallDistance >= 5) {
                const damage = Math.floor(fallDistance / 5) * 0.5; // 0.5 hearts per 5 blocks

                console.log(`🪂 Fall damage! Fell ${fallDistance.toFixed(1)} blocks, taking ${damage} hearts damage`);

                this.takeDamage(damage);

                // Show broken heart for half-heart damage
                if (damage === 0.5) {
                    this.voxelWorld.updateStatus(`💔 Ouch! Fell ${fallDistance.toFixed(0)} blocks`, 'warning');
                } else {
                    this.voxelWorld.updateStatus(`💔💔 Heavy fall! Fell ${fallDistance.toFixed(0)} blocks`, 'warning');
                }
            }

            // Reset tracking
            this.highestYPosition = currentY;
            this.isFalling = false;
        }

        this.lastYPosition = currentY;
    }

    /**
     * Check if player is damaged (for UI display logic)
     */
    isDamaged() {
        return this.currentHP < this.maxHP;
    }

    /**
     * Get current HP percentage
     */
    getHPPercent() {
        return (this.currentHP / this.maxHP) * 100;
    }

    /**
     * Show/hide heart display
     */
    show() {
        if (this.heartContainer) {
            this.heartContainer.style.display = 'flex';
        }
    }

    hide() {
        if (this.heartContainer) {
            this.heartContainer.style.display = 'none';
        }
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.heartContainer && this.heartContainer.parentElement) {
            document.body.removeChild(this.heartContainer);
            this.heartContainer = null;
            this.hearts = [];
        }
        console.log('❤️ PlayerHP destroyed');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes damageFlash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
    }

    @keyframes heartPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(0.9); }
    }

    @keyframes heartHeal {
        0% { transform: scale(0.9); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// 🎮 Console commands for testing healing
window.damage_player = (amount = 3) => {
    if (window.voxelWorld?.playerHP) {
        window.voxelWorld.playerHP.takeDamage(amount);
        console.log(`💔 Player damaged: -${amount} HP (${window.voxelWorld.playerHP.currentHP}/${window.voxelWorld.playerHP.maxHP})`);
        return `Damaged player for ${amount} HP (now at ${window.voxelWorld.playerHP.currentHP}/${window.voxelWorld.playerHP.maxHP})`;
    }
    return 'Game not initialized yet';
};

window.heal_player = (amount = 3) => {
    if (window.voxelWorld?.playerHP) {
        window.voxelWorld.playerHP.heal(amount);
        console.log(`💚 Player healed: +${amount} HP (${window.voxelWorld.playerHP.currentHP}/${window.voxelWorld.playerHP.maxHP})`);
        return `Healed player for ${amount} HP (now at ${window.voxelWorld.playerHP.currentHP}/${window.voxelWorld.playerHP.maxHP})`;
    }
    return 'Game not initialized yet';
};

window.check_hp = () => {
    if (window.voxelWorld?.playerHP) {
        const hp = window.voxelWorld.playerHP.currentHP;
        const maxHP = window.voxelWorld.playerHP.maxHP;
        const percent = ((hp / maxHP) * 100).toFixed(0);
        console.log(`❤️ Player HP: ${hp}/${maxHP} (${percent}%)`);
        return `${hp}/${maxHP} HP (${percent}%)`;
    }
    return 'Game not initialized yet';
};

console.log('❤️ PlayerHP console commands: damage_player(3), heal_player(3), check_hp()');


