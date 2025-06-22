/**
 * Main Game Configuration and Initialization
 * Updated to work with RecipeSelectionScene as starting scene
 */

// Game configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#8B4513',
    parent: 'game-container', // Attach to your styled container
    
    // Scene configuration - RecipeSelectionScene starts first
    scene: [
        RecipeSelectionScene,    // Starting scene
        KitchenScene,            // Kitchen hub
        ScaleScene,              // Scale equipment scene
        MicrowaveScene,          // Microwave equipment scene  
        MixerScene,              // Mixer equipment scene
        OvenScene
        // Add more equipment scenes here as needed (StoveScene, OvenScene, etc.)
    ],
    
    // Physics configuration (if needed for future features)
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 } // No gravity for this type of game
        }
    },
    
    // Input configuration
    input: {
        mouse: {
            target: null // Use default canvas
        },
        touch: {
            target: null // Use default canvas
        }
    },
    
    // Scale configuration for different screen sizes
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 450,
            height: 300
        },
        max: {
            width: 1800,
            height: 1200
        }
    },
    
    // Performance optimizations
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    }
};

// Initialize the game
let game;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Cosy Bakes Game...');
    
    // Initialize the game
    try {
        game = new Phaser.Game(gameConfig);
        console.log('Cosy Bakes Game initialized successfully!');
        console.log('Starting with RecipeSelectionScene...');
        
        // Optional: Add global game event listeners
        setupGlobalGameEvents();
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.log('Check that all scene files are loaded properly');
    }
});

/**
 * Set up global game event listeners
 */
function setupGlobalGameEvents() {
    // Handle window resize
    window.addEventListener('resize', () => {
        if (game && game.scale) {
            game.scale.refresh();
        }
    });
    
    // Handle page visibility changes (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (game && game.scene) {
            if (document.hidden) {
                // Page is hidden - pause active scenes
                game.scene.getScenes(true).forEach(scene => {
                    if (scene.scene.isActive()) {
                        scene.scene.pause();
                    }
                });
            } else {
                // Page is visible - resume paused scenes
                game.scene.getScenes(false).forEach(scene => {
                    if (scene.scene.isPaused()) {
                        scene.scene.resume();
                    }
                });
            }
        }
    });
    
    // Global error handler for debugging
    window.addEventListener('error', (event) => {
        console.error('Game Error:', event.error);
    });
}

/**
 * Utility functions for game management
 */

// Function to restart the game
function restartGame() {
    if (game) {
        game.destroy(true);
        game = new Phaser.Game(gameConfig);
    }
}

// Function to get current active scene
function getCurrentScene() {
    if (game && game.scene) {
        const activeScenes = game.scene.getScenes(true);
        return activeScenes.length > 0 ? activeScenes[0] : null;
    }
    return null;
}

// Function to switch to a specific scene
function switchToScene(sceneKey) {
    const currentScene = getCurrentScene();
    if (currentScene) {
        currentScene.scene.start(sceneKey);
    }
}

// Function to go back to recipe selection
function goToRecipeSelection() {
    switchToScene('RecipeSelectionScene');
}

// Function to go to kitchen
function goToKitchen() {
    switchToScene('KitchenScene');
}

// Debug functions (remove in production)
if (typeof window !== 'undefined') {
    // Make debug functions available globally
    window.CosyBakes = {
        restart: restartGame,
        getCurrentScene: getCurrentScene,
        switchToScene: switchToScene,
        goToRecipeSelection: goToRecipeSelection,
        goToKitchen: goToKitchen,
        game: () => game
    };
    
    console.log('Debug functions available via window.CosyBakes');
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameConfig,
        restartGame,
        getCurrentScene,
        switchToScene,
        goToRecipeSelection,
        goToKitchen
    };
}