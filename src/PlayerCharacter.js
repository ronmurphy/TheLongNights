/**
 * 🧙 Player Character System
 * Manages player stats, race, equipment, and sprite rendering
 * Integrates with personality quiz for character creation
 */

export class PlayerCharacter {
    constructor() {
        // Base stats (all start at 2)
        this.stats = {
            STR: 2,  // Strength - melee damage, harvest speed
            DEX: 2,  // Dexterity - jump height, movement speed
            VIT: 2,  // Vitality - max HP, hunger resistance
            LCK: 2   // Luck - rare drops, crit chance
        };

        // Character customization
        this.race = 'human';  // human, elf, dwarf, goblin
        this.gender = 'male';  // male, female, nonbinary
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // HP system (matches companion heart system: 2 HP = 1 heart)
        this.maxHP = 6;  // 3 hearts
        this.currentHP = 6;

        // Stamina system
        this.maxStamina = 100;
        this.currentStamina = 100;
        this.staminaRegen = 10; // per second

        // Starting inventory bonuses (from quiz)
        this.startingItems = [];
        this.preferredCompanion = 'goblin_grunt'; // Default

        // Quiz answers (for debugging/tracking)
        this.quizAnswers = {
            survival: null,  // 0-3: STR, DEX, VIT, LCK
            gear: null,      // 0-3: weapon, tool, magic, food
            ancestry: null,  // 0-3: human, elf, dwarf, goblin
            companion: null, // 0-3: fighter, scavenger, wanderer, guardian
            gender: null     // 0-3: male, female, nonbinary, random
        };

        // Equipment slots (for sprite layering later)
        this.equipment = {
            helmet: null,
            chest: null,
            legs: null,
            weapon: null,
            tool: null
        };
    }

    /**
     * Process personality quiz answers and set stats/race/items
     * @param {Object} answers - { survival: 0-3, gear: 0-3, ancestry: 0-3, companion: 0-3 }
     */
    processQuizAnswers(answers) {
        this.quizAnswers = answers;

        console.log('🎭 Processing personality quiz answers:', answers);

        // Question 1: Survival Philosophy → Primary stat boost (+2)
        const survivalStats = ['STR', 'DEX', 'VIT', 'LCK'];
        const primaryStat = survivalStats[answers.survival];
        this.stats[primaryStat] += 2;
        console.log(`  Q1: Chose ${primaryStat} → +2 ${primaryStat}`);

        // Question 2: Gear Priority → Starting item + secondary stat (+1)
        const gearChoices = [
            { stat: 'STR', item: 'combat_sword' },   // Weapon
            { stat: 'DEX', item: 'watering_can' },   // Tool
            { stat: 'LCK', item: 'magic_amulet' },   // Magic
            { stat: 'VIT', item: 'berry' }           // Food
        ];
        const gearChoice = gearChoices[answers.gear];
        this.stats[gearChoice.stat] += 1;
        this.startingItems.push(gearChoice.item);
        if (gearChoice.item === 'berry') {
            // Give 10 berries instead of 1
            for (let i = 0; i < 9; i++) {
                this.startingItems.push('berry');
            }
        }
        console.log(`  Q2: Chose ${gearChoice.item} → +1 ${gearChoice.stat}`);

        // Question 3: Ancestry → Race + racial stat adjustments
        const races = ['human', 'elf', 'dwarf', 'goblin'];
        this.race = races[answers.ancestry];

        // Apply racial bonuses/penalties
        switch (this.race) {
            case 'human':
                // Balanced - no changes
                console.log('  Q3: Human - balanced stats');
                break;
            case 'elf':
                this.stats.DEX += 1;
                this.stats.STR -= 1;
                console.log('  Q3: Elf → +1 DEX, -1 STR');
                break;
            case 'dwarf':
                this.stats.VIT += 1;
                this.stats.DEX -= 1;
                console.log('  Q3: Dwarf → +1 VIT, -1 DEX');
                break;
            case 'goblin':
                this.stats.LCK += 1;
                this.stats.VIT -= 1;
                console.log('  Q3: Goblin → +1 LCK, -1 VIT');
                break;
        }

        // Question 4: Companion Race (assign one of the 3 non-player races)
        const allRaces = ['human', 'elf', 'dwarf', 'goblin'];
        const availableCompanions = allRaces.filter(r => r !== this.race);
        this.preferredCompanion = availableCompanions[answers.companion % availableCompanions.length];
        console.log(`  Q4: Preferred companion → ${this.preferredCompanion} (from ${availableCompanions.join(', ')})`);

        // Question 5: Gender Selection
        const genders = ['male', 'female', 'nonbinary', 'random'];
        const genderChoice = genders[answers.gender];

        if (genderChoice === 'random') {
            // "Surprise me!" - randomly pick male or female
            this.gender = Math.random() < 0.5 ? 'male' : 'female';
            console.log(`  Q5: Random gender → ${this.gender}`);
        } else {
            this.gender = genderChoice;
            console.log(`  Q5: Gender → ${this.gender}`);
        }

        // Calculate derived stats
        this.updateDerivedStats();

        console.log('✅ Character created:', this.getSummary());
    }

    /**
     * Update derived stats based on primary stats
     */
    updateDerivedStats() {
        // VIT affects max HP (base 6 + VIT bonus)
        this.maxHP = 6 + (this.stats.VIT - 2) * 2;  // Each point of VIT = +2 HP
        this.currentHP = Math.min(this.currentHP, this.maxHP);

        // VIT affects max stamina
        this.maxStamina = 100 + (this.stats.VIT - 2) * 10;
        this.currentStamina = Math.min(this.currentStamina, this.maxStamina);

        // DEX affects stamina regen
        this.staminaRegen = 10 + (this.stats.DEX - 2) * 2;
    }

    /**
     * Get stat bonuses for various game mechanics
     */
    getStatBonus(stat) {
        const value = this.stats[stat];
        return (value - 2);  // Base is 2, so 0 bonus at 2, +1 at 3, etc.
    }

    /**
     * Get jump height multiplier based on DEX
     */
    getJumpMultiplier() {
        return 1.0 + (this.getStatBonus('DEX') * 0.1);  // +10% per DEX point
    }

    /**
     * Get movement speed multiplier based on DEX
     */
    getSpeedMultiplier() {
        return 1.0 + (this.getStatBonus('DEX') * 0.05);  // +5% per DEX point
    }

    /**
     * Get harvest speed multiplier based on STR
     */
    getHarvestSpeedMultiplier() {
        return 1.0 + (this.getStatBonus('STR') * 0.15);  // +15% per STR point
    }

    /**
     * Get melee damage bonus based on STR
     */
    getMeleeDamageBonus() {
        return this.getStatBonus('STR');  // +1 damage per STR point
    }

    /**
     * Get crit chance based on LCK
     */
    getCritChance() {
        return 0.05 + (this.getStatBonus('LCK') * 0.05);  // 5% base, +5% per LCK
    }

    /**
     * Get drop rate multiplier based on LCK
     */
    getDropRateMultiplier() {
        return 1.0 + (this.getStatBonus('LCK') * 0.1);  // +10% per LCK point
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.currentHP = Math.max(0, this.currentHP - amount);
        return this.currentHP <= 0;  // Return true if dead
    }

    /**
     * Heal HP
     */
    heal(amount) {
        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    }

    /**
     * Use stamina
     */
    useStamina(amount) {
        this.currentStamina = Math.max(0, this.currentStamina - amount);
        return this.currentStamina > 0;
    }

    /**
     * Regenerate stamina
     */
    regenStamina(deltaTime) {
        this.currentStamina = Math.min(
            this.maxStamina,
            this.currentStamina + (this.staminaRegen * deltaTime)
        );
    }

    /**
     * Get character summary for debugging
     */
    getSummary() {
        return {
            race: this.race,
            level: this.level,
            stats: { ...this.stats },
            hp: `${this.currentHP}/${this.maxHP}`,
            stamina: `${Math.floor(this.currentStamina)}/${this.maxStamina}`,
            startingItems: this.startingItems,
            preferredCompanion: this.preferredCompanion
        };
    }

    /**
     * Save character data to localStorage
     */
    save() {
        const data = {
            stats: this.stats,
            race: this.race,
            level: this.level,
            xp: this.xp,
            maxHP: this.maxHP,
            currentHP: this.currentHP,
            maxStamina: this.maxStamina,
            currentStamina: this.currentStamina,
            startingItems: this.startingItems,
            preferredCompanion: this.preferredCompanion,
            quizAnswers: this.quizAnswers,
            equipment: this.equipment
        };
        return data;
    }

    /**
     * Load character data from saved state
     */
    load(data) {
        if (!data) return;

        this.stats = data.stats || this.stats;
        this.race = data.race || 'human';
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.maxHP = data.maxHP || 6;
        this.currentHP = data.currentHP || 6;
        this.maxStamina = data.maxStamina || 100;
        this.currentStamina = data.currentStamina || 100;
        this.startingItems = data.startingItems || [];
        this.preferredCompanion = data.preferredCompanion || 'goblin_grunt';
        this.quizAnswers = data.quizAnswers || this.quizAnswers;
        this.equipment = data.equipment || this.equipment;

        console.log('✅ Player character loaded:', this.getSummary());
    }
}
