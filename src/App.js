// App.js - Entry point for unified The Long Nights + ShapeForge app (Vite version)
import './style.css';
import '@mdi/font/css/materialdesignicons.min.css'; // Material Design Icons (local)
import { initVoxelWorld } from './VoxelWorld.js';
import { SplashScreen } from './SplashScreen.js';
import { GameIntroOverlay } from './ui/GameIntroOverlay.js';
import { ChatOverlay } from './ui/Chat.js';
import { MainMenu } from './ui/MainMenu.js';
// import { initWorkbench } from './ShapeForgeWorkbench.js'; // To be created

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');

  const gameContainer = document.getElementById('gameContainer');
  const workbenchContainer = document.getElementById('workbenchContainer');
  const playModeBtn = document.getElementById('playModeBtn');
  const workbenchBtn = document.getElementById('workbenchBtn');

  console.log('Elements found:', { gameContainer, playModeBtn, workbenchBtn });

  // Initialize splash screen
  const splashScreen = new SplashScreen();

  function showGame() {
    console.log('showGame() called');
    gameContainer.style.display = 'block';
    workbenchContainer.style.display = 'none';
    // Hide header for fullscreen game experience
    document.querySelector('header').style.display = 'none';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
  }

  function showWorkbench() {
    console.log('showWorkbench() called');
    gameContainer.style.display = 'none';
    workbenchContainer.style.display = 'block';
    // Show header for workbench mode
    document.querySelector('header').style.display = 'flex';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.overflow = '';
  }

  // Show Play Mode before initializing The Long Nights
  console.log('Calling showGame() initially');
  showGame();

  console.log('Calling initVoxelWorld...');
  initVoxelWorld(gameContainer, splashScreen).then((app) => {
    console.log('✅ The Long Nights initialized successfully');
    // Expose app to window for debugging
    window['voxelApp'] = app;
    window['voxelWorld'] = app; // Also expose as voxelWorld for electron menu
    console.log('🐛 voxelApp and voxelWorld exposed to window for debugging');

    // Add global convenience function for testing combat
    window['testCombat'] = (enemyId) => app.testCombat(enemyId);
    console.log('🎮 testCombat() available globally');

    // Add global convenience functions for testing Douglas Fir trees
    window['testDouglas'] = () => app.testDouglas();
    window['testChristmas'] = () => app.testChristmas();
    console.log('🎄 testDouglas() and testChristmas() available globally');

    // Add global convenience functions for testing sound effects
    window['sfxSystem'] = app.sfxSystem;
    window['playSFX'] = (soundId, variation = false) => {
      if (variation) {
        return app.sfxSystem.playWithVariation(soundId);
      }
      return app.sfxSystem.play(soundId);
    };
    console.log('🔊 sfxSystem and playSFX() available globally');

    // === MAIN MENU SYSTEM ===
    // Show main menu with New Game / Load Game / Dev Mode options
    const mainMenu = new MainMenu(
      () => startNewGame(app),      // NEW GAME callback
      () => loadExistingGame(app),  // LOAD GAME callback
      () => startDevMode(app)        // DEV MODE callback
    );
    
    mainMenu.show();
    console.log('🎮 Main Menu displayed - awaiting player choice');

    // === GAME MODE FUNCTIONS ===

    /**
     * 🆕 NEW GAME: Clear saves and start personality quiz
     */
    function startNewGame(app) {
      console.log('🆕 Starting new game - loading personality quiz...');
      
      // Clear any existing save data
      localStorage.removeItem('NebulaWorld_playerData');
      localStorage.removeItem('NebulaWorld_devMode');

      // Load personality quiz data
      fetch('data/personalityQuiz.json')
        .then(r => r.json())
        .then(quizData => {
          console.log('🎭 Loaded personality quiz, starting quest...');

          // Run personality quiz with completion callback
          app.questRunner.startQuest(quizData, (choices) => {
            console.log('🎭 Personality quiz complete! Choices:', choices);

            // Convert choices to quiz answer format
            const answers = {
              survival: choices['q1_survival'],   // 0-3
              gear: choices['q2_gear'],           // 0-3
              ancestry: choices['q3_ancestry'],   // 0-3
              companion: choices['q4_companion'], // 0-3
              gender: choices['q5_gender']        // 0-3
            };

            // Process quiz answers and create player character
            app.playerCharacter.processQuizAnswers(answers);

            // Give starting items to inventory
            const startingItems = app.playerCharacter.startingItems;
            if (startingItems && startingItems.length > 0) {
              console.log(`🎁 Giving ${startingItems.length} starting items to inventory...`);
              startingItems.forEach(itemId => {
                if (app.inventory && app.inventory.addItem) {
                  app.inventory.addItem(itemId);
                  console.log(`  ✅ Added ${itemId} to inventory`);
                } else {
                  console.warn(`  ⚠️ Inventory not ready, skipping ${itemId}`);
                }
              });
            }

            // Log character summary to console
            console.log('═══════════════════════════════════════');
            console.log('🎭 PERSONALITY QUIZ RESULTS');
            console.log('═══════════════════════════════════════');
            const summary = app.playerCharacter.getSummary();
            console.log(`Race: ${summary.race.toUpperCase()}`);
            console.log(`Level: ${summary.level}`);
            console.log(`Stats: STR ${summary.stats.STR}, DEX ${summary.stats.DEX}, VIT ${summary.stats.VIT}, LCK ${summary.stats.LCK}`);
            console.log(`HP: ${summary.hp}`);
            console.log(`Stamina: ${summary.stamina}`);
            console.log(`Starting Items: ${summary.startingItems.join(', ')}`);
            console.log(`Preferred Companion: ${summary.preferredCompanion}`);
            console.log('═══════════════════════════════════════');

            // Use companion from quiz Q4 with randomly assigned gender (Daggerfall-style)
            // Fallback to 'male' if gender somehow undefined
            const companionGender = summary.companionGender || 'male';
            const companionId = `${summary.preferredCompanion}_${companionGender}`;
            console.log(`🤝 Companion assigned from quiz: ${companionId}`);
            console.log(`   Race: ${summary.preferredCompanion}, Gender: ${companionGender}`);
            console.log(`   Summary object:`, summary);

            // Save player data with starter companion AND character data
            const playerData = {
              starterMonster: companionId,  // Full ID with gender: "elf_male", "dwarf_female", etc.
              monsterCollection: [companionId],
              firstPlayTime: Date.now(),
              character: app.playerCharacter.save()  // Save character stats
            };
            localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
            console.log('✅ Player data saved:', playerData);

            // Show player avatar UI now that character data is saved
            if (app.playerCompanionUI) {
              app.playerCompanionUI.update().then(() => {
                app.playerCompanionUI.show();
                console.log('🖼️ Player avatar UI displayed');
              });
            }

            // 🔗 Linked script handles companion introduction
            // The personality quiz now links to companion_introduction.json
            // which shows tutorial chat with template variables ({{companion_id}}, etc.)
            // and spawns the starter backpack
            console.log('📜 Quiz will link to companion_introduction.json...');
          });
        })
        .catch(error => {
          console.error('❌ Failed to load personality quiz:', error);
        });
    }

    /**
     * 📁 LOAD GAME: Load existing save file
     */
    function loadExistingGame(app) {
      console.log('📁 Loading existing game...');
      
      const playerData = JSON.parse(localStorage.getItem('NebulaWorld_playerData') || '{}');
      
      if (playerData.character) {
        // Load character data
        app.playerCharacter.load(playerData.character);
        console.log('✅ Character loaded:', app.playerCharacter.getSummary());
        
        // Update and show UI
        if (app.playerCompanionUI) {
          app.playerCompanionUI.update().then(() => {
            app.playerCompanionUI.show();
            console.log('🖼️ Player avatar UI displayed');
          });
        }
        
        // TODO: Load world state, inventory, quest progress, etc.
        console.log('🌍 Game loaded - ready to play!');
      } else {
        console.error('❌ No character data found in save file');
      }
    }

    /**
     * 🔧 DEV MODE: Skip setup for testing
     */
    function startDevMode(app) {
      console.log('🔧 Starting dev mode...');
      
      // Set dev mode flag (separate from player data)
      localStorage.setItem('NebulaWorld_devMode', 'true');
      
      // Call unlockUI() to set up test environment
      if (window.unlockUI) {
        window.unlockUI();
        console.log('✅ Dev mode active - UI unlocked with test data');
      } else {
        console.error('❌ unlockUI() not available');
      }
    }

  }).catch(error => {
    console.error('❌ Failed to initialize The Long Nights:', error);
    console.error('Error stack:', error.stack);
    // Hide splash on error
    if (splashScreen) {
      splashScreen.updateProgress(100, 'Error loading game');
      setTimeout(() => splashScreen.hide(), 2000);
    }
  });

  playModeBtn.addEventListener('click', () => {
    console.log('Play Mode button clicked');
    showGame();
  });
  
  workbenchBtn.addEventListener('click', () => {
    console.log('Workbench button clicked');
    showWorkbench();
  });

  // Placeholder: Initialize ShapeForgeWorkbench in workbenchContainer
  // initWorkbench(workbenchContainer);
});
