// App.js - Entry point for unified The Long Nights + ShapeForge app (Vite version)
import './style.css';
import '@mdi/font/css/materialdesignicons.min.css'; // Material Design Icons (local)
import { initVoxelWorld } from './VoxelWorld.js';
import { SplashScreen } from './SplashScreen.js';
import { GameIntroOverlay } from './ui/GameIntroOverlay.js';
import { ChatOverlay } from './ui/Chat.js';
import { initEmojiSupport } from './EmojiRenderer.js'; // Universal emoji support
// import { initWorkbench } from './ShapeForgeWorkbench.js'; // To be created

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');

  // Initialize universal emoji support (works on Wine, Windows, Linux, macOS)
  initEmojiSupport();

  const gameContainer = document.getElementById('gameContainer');
  const workbenchContainer = document.getElementById('workbenchContainer');
  const playModeBtn = document.getElementById('playModeBtn');
  const workbenchBtn = document.getElementById('workbenchBtn');

  console.log('Elements found:', { gameContainer, playModeBtn, workbenchBtn });

  // Initialize splash screen
  const splashScreen = new SplashScreen();

  // Check if this is a first-time player (no saved game)
  const hasPlayerData = localStorage.getItem('NebulaWorld_playerData') !== null;

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

    // If first-time player, show personality quiz THEN intro overlay AFTER world loads
    if (!hasPlayerData) {
      console.log('👋 First-time player detected! Starting personality quiz...');

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
              companion: choices['q4_companion']  // 0-3
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

            // Now show companion selection with preferred companion
            console.log('👋 Showing companion selection overlay...');
            const introOverlay = new GameIntroOverlay();

            introOverlay.setCompletionCallback(async (selectedCompanion) => {
              console.log(`🎮 Player selected starter companion: ${selectedCompanion}`);

              // Save player data with starter companion AND character data
              const playerData = {
                starterMonster: selectedCompanion,
                monsterCollection: [selectedCompanion],
                firstPlayTime: Date.now(),
                character: app.playerCharacter.save()  // Save character stats
              };
              localStorage.setItem('NebulaWorld_playerData', JSON.stringify(playerData));
              console.log('✅ Player data saved!');

              // Load companion data for chat
              const companionData = await ChatOverlay.loadCompanionData(selectedCompanion);
              const companionName = companionData ? companionData.name : selectedCompanion;

              // Show tutorial chat sequence
              const chat = new ChatOverlay();
              chat.showSequence([
                {
                  character: selectedCompanion,
                  name: companionName,
                  text: `Hey there! I'm your new companion. Let's get you set up for exploring!`
                },
                {
                  character: selectedCompanion,
                  name: companionName,
                  text: `See that red dot on your minimap in the top-right? That's your Explorer's Pack with all your tools!`
                },
                {
                  character: selectedCompanion,
                  name: companionName,
                  text: `Use WASD to move and your mouse to look around. If you spawn in a tree, just punch the leaves to break free!`
                },
                {
                  character: selectedCompanion,
                  name: companionName,
                  text: `Walk up to the backpack (🎒) and hold left-click to pick it up. That'll unlock your inventory and tools. Good luck, explorer!`
                }
              ], () => {
                // After chat sequence completes, spawn backpack in front of player
                console.log('💬 Tutorial chat complete, spawning starter backpack...');
                if (window.voxelApp && window.voxelApp.spawnStarterBackpack) {
                  window.voxelApp.spawnStarterBackpack();
                }
              });
            });

            // Show overlay after a short delay (let world finish loading)
            setTimeout(() => {
              introOverlay.show();
            }, 500);
          });
        })
        .catch(error => {
          console.error('❌ Failed to load personality quiz:', error);
        });
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
