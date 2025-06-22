/**
 * Base Countertop Scene Class
 * Shared functionality for all equipment scenes with persistent hint system
 */
class BaseCountertopScene extends Phaser.Scene {
    constructor(sceneKey) {
        super({ key: sceneKey });
        
        // Inventory system
        this.inventoryItems = [];
        this.inventoryContainer = null;
        this.inventoryScrollPosition = 0;
        this.maxScrollPosition = 0;
        this.minScrollPosition = 0;
        this.isScrolling = false;
        this.scrollDirection = 0;
        
        // Drag and drop system
        this.carriedIngredient = null;
        this.carriedSprite = null;
        this.originalIngredientPositions = new Map();
        
        // Message system
        this.lastMessage = '';
        this.currentMessageText = null;
        this.currentMessageTween = null;

        // Persistent hint system
        this.hintButton = null;
        this.hintContainer = null;
        this.hintScrollContainer = null;
        this.hintText = null;

        // Common baking ingredients
        this.ingredientList = [
            'bowl', 'flour', 'sugar', 'butter', 'egg', 'milk', 'chocchip', 
            'vanilla', 'bakingpowder', 'cocoa', 'chocbar'
        ];

        // Initialize or get persistent game state
        this.initializePersistentState();
    }

    initializePersistentState() {
        // Check if global game state exists, if not create it
        if (!window.CosyBakesGameState) {
            window.CosyBakesGameState = {
                playerActions: [],
                bowlContents: [], // Track what's in the bowl across scenes
                currentBowlState: 'empty', // empty, mixed, heated, etc.
                bowlLocation: 'inventory', // inventory, scale, microwave, mixer
                totalIngredientWeight: 0,
                actionCount: 0
            };
        }
        
        // Reference to global state for easy access
        this.gameState = window.CosyBakesGameState;
    }

    preload() {
        // Load common assets
        if (!this.textures.exists('countertop')) {
            this.load.image('countertop', 'assets/scenes/countertop.png');
        }
        if (!this.textures.exists('inventory')) {
            this.load.image('inventory', 'assets/equipment/inventory.png');
        }

        // Load ingredient assets
        this.ingredientList.forEach(ingredient => {
            if (!this.textures.exists(ingredient)) {
                this.load.image(ingredient, `assets/ingredients/${ingredient}.png`);
            }
        });

        // Call child class specific preload
        this.preloadEquipmentAssets();
    }

    create() {
        // Fade in from the transition
        this.cameras.main.fadeIn(500, 139, 69, 19);

        // Add countertop background
        this.addCountertopBackground();

        // Add equipment-specific visuals (implemented by child classes)
        this.addEquipmentVisuals();

        // Equipment-specific title
        const equipmentTitle = this.add.text(450, 50, `${this.getEquipmentName().toUpperCase()} STATION`, {
            fontFamily: 'VT323',
            fontSize: '36px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Back to kitchen button
        this.addBackButton();

        // Add inventory bar at the bottom
        this.addInventoryBar();

        // Instructions
        const instructions = this.getEquipmentInstructions();
        this.add.text(450, 440, instructions, {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#DEB887',
            stroke: '#8B4513',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add title animation
        this.tweens.add({
            targets: equipmentTitle,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Set up global pointer events
        this.setupGlobalPointerEvents();

        // Create persistent hint system (visible across all scenes)
        this.createPersistentHintSystem();

        console.log(`${this.getEquipmentName()} scene loaded`);
    }

    addCountertopBackground() {
        if (this.textures.exists('countertop')) {
            const countertop = this.add.image(450, 300, 'countertop');
            countertop.setOrigin(0.5);
            const scaleX = 900 / countertop.width;
            const scaleY = 600 / countertop.height;
            const scale = Math.min(scaleX, scaleY);
            countertop.setScale(scale);
        }
    }

    addBackButton() {
        const backButton = this.add.text(50, 50, '< KITCHEN', {
            fontFamily: 'VT323',
            fontSize: '32px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        backButton.setInteractive({ useHandCursor: true });
        
        backButton.on('pointerover', () => backButton.setTint(0xFFE4B5));
        backButton.on('pointerout', () => backButton.clearTint());
        backButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 139, 69, 19);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('KitchenScene');
            });
        });
    }

    setupGlobalPointerEvents() {
        // Disable right-click context menu
        this.input.mouse.disableContextMenu();

        // Set up global pointer events for drag and drop (ORIGINAL WORKING VERSION)
        this.input.on('pointermove', (pointer) => {
            if (this.carriedSprite) {
                this.carriedSprite.x = pointer.x;
                this.carriedSprite.y = pointer.y;
            }
        });

        // Handle clicks while carrying items
        this.input.on('pointerdown', (pointer) => {
            if (this.carriedSprite) {
                if (pointer.leftButtonDown()) {
                    this.interactWithCarriedItem(pointer);
                } else if (pointer.rightButtonDown()) {
                    this.resetInventory();
                }
            }
        });
    }

    // ===========================
    // PERSISTENT HINT SYSTEM
    // ===========================

    createPersistentHintSystem() {
        // Create hint button (always visible)
        this.hintButton = this.add.text(100, 100, 'Recipe Log', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#FFFFFF',
            backgroundColor: '#8B4513',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Create hint panel background
        const hintBg = this.add.rectangle(100, 300, 180, 320, 0xF5F5DC)
            .setStrokeStyle(2, 0x8B4513)
            .setOrigin(0.5);

        // Create title for the hint panel
        const hintTitle = this.add.text(100, 170, 'RECIPE PROGRESS', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#8B4513',
            stroke: '#F5DEB3',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Create scrollable area for actions
        const hintMask = this.add.graphics();
        hintMask.fillRect(20, 190, 160, 220);
        
        this.hintScrollContainer = this.add.container(0, 0);
        this.hintScrollContainer.setMask(hintMask.createGeometryMask());

        // Create the main hint text
        this.hintText = this.add.text(100, 300, '', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#000000',
            align: 'left',
            wordWrap: { width: 160 }
        }).setOrigin(0.5, 0);

        this.hintScrollContainer.add(this.hintText);

        // Group all hint elements
        this.hintContainer = this.add.container(0, 0, [hintBg, hintTitle, this.hintScrollContainer]);
        this.hintContainer.setVisible(false);

        // Toggle visibility when button is clicked
        this.hintButton.on('pointerdown', () => {
            const isVisible = this.hintContainer.visible;
            this.hintContainer.setVisible(!isVisible);
            this.hintButton.setText(isVisible ? 'Recipe Log' : 'Hide Log');
            
            if (!isVisible) {
                this.updateHintDisplay();
            }
        });

        // Update display on creation
        this.updateHintDisplay();
    }

    updateHintDisplay() {
        if (!this.hintText) return;

        let displayText = '';
        
        // Show current bowl contents
        if (this.gameState.bowlContents.length > 0) {
            displayText += 'BOWL CONTAINS:\n';
            this.gameState.bowlContents.forEach(item => {
                if (item.ingredient === 'egg') {
                    const eggCount = item.amount / 68;
                    displayText += `• ${eggCount} egg${eggCount > 1 ? 's' : ''}\n`;
                } else {
                    displayText += `• ${item.amount}g ${item.ingredient}\n`;
                }
            });
            
            displayText += `\nBowl Status: ${this.gameState.currentBowlState}\n`;
            displayText += `Location: ${this.gameState.bowlLocation}\n\n`;
        }

        // Show action history
        if (this.gameState.playerActions.length > 0) {
            displayText += 'ACTIONS TAKEN:\n';
            this.gameState.playerActions.forEach((action, index) => {
                displayText += `${index + 1}. ${action}\n`;
            });
        } else {
            displayText += 'No actions yet.\nStart by placing ingredients in a bowl!';
        }

        this.hintText.setText(displayText);
    }

    // Track player actions across scenes
    addPlayerAction(action) {
        this.gameState.playerActions.push(action);
        this.gameState.actionCount++;
        console.log('Action added:', action);
        
        // Update hint display if visible
        if (this.hintContainer && this.hintContainer.visible) {
            this.updateHintDisplay();
        }
    }

    // Track ingredients added to bowl
    addIngredientToBowl(ingredient, amount, equipment = 'scale') {
        // Find existing ingredient or add new one
        const existingIngredient = this.gameState.bowlContents.find(item => item.ingredient === ingredient);
        if (existingIngredient) {
            existingIngredient.amount += amount;
        } else {
            this.gameState.bowlContents.push({ ingredient, amount });
        }

        // Update total weight
        this.gameState.totalIngredientWeight += amount;

        // Add action to history
        if (ingredient === 'egg') {
            this.addPlayerAction(`Added 1 egg to bowl (${equipment})`);
        } else {
            this.addPlayerAction(`Added ${amount}g ${ingredient} to bowl (${equipment})`);
        }

        // Update bowl state
        if (this.gameState.currentBowlState === 'empty') {
            this.gameState.currentBowlState = 'has ingredients';
        }
    }

    // Update bowl location
    updateBowlLocation(location, additionalAction = '') {
        this.gameState.bowlLocation = location;
        
        if (additionalAction) {
            this.addPlayerAction(additionalAction);
        }
    }

    // Update bowl state (mixed, heated, etc.)
    updateBowlState(newState, action = '') {
        this.gameState.currentBowlState = newState;
        
        if (action) {
            this.addPlayerAction(action);
        }
    }

    // Get current bowl contents (for equipment scenes to access)
    getBowlContents() {
        return this.gameState.bowlContents;
    }

    // Clear bowl contents (when bowl is removed/reset)
    clearBowl() {
        this.gameState.bowlContents = [];
        this.gameState.totalIngredientWeight = 0;
        this.gameState.currentBowlState = 'empty';
        this.gameState.bowlLocation = 'inventory';
        this.addPlayerAction('Bowl emptied and returned to inventory');
    }

    // Method to reset entire recipe (for testing or starting over)
    resetRecipeProgress() {
        this.gameState.playerActions = [];
        this.gameState.bowlContents = [];
        this.gameState.currentBowlState = 'empty';
        this.gameState.bowlLocation = 'inventory';
        this.gameState.totalIngredientWeight = 0;
        this.gameState.actionCount = 0;
        
        if (this.hintContainer && this.hintContainer.visible) {
            this.updateHintDisplay();
        }
        
        this.showIngredientMessage('Recipe progress reset!');
    }

    // ===========================
    // ORIGINAL INVENTORY SYSTEM (ORIGINAL WORKING VERSION)
    // ===========================

    addInventoryBar() {
        // Create inventory background using the inventory.png asset
        if (this.textures.exists('inventory')) {
            console.log('Inventory texture found, displaying...');
            
            const inventory = this.add.image(450, 530, 'inventory');
            inventory.setOrigin(0.5);
            
            // Scale the inventory bar to fit the screen width appropriately
            const scaleX = 900 / inventory.width;
            inventory.setScale(scaleX, scaleX);
        } else {
            console.warn('Inventory texture not found, creating placeholder...');
            // Fallback to rectangle if asset isn't found
            const inventoryBg = this.add.rectangle(450, 530, 880, 120, 0x654321);
            inventoryBg.setStrokeStyle(3, 0x8B4513);
        }

        // Create a mask for the inventory area to hide overflow
        const inventoryMask = this.add.graphics();
        inventoryMask.fillRect(50, 490, 800, 120); // Much wider mask with more empty space
        
        // Create container for inventory items
        this.inventoryContainer = this.add.container(0, 0);
        this.inventoryContainer.setMask(inventoryMask.createGeometryMask());

        // Add ingredient items to inventory
        this.populateInventory();

        // Add scroll indicators - positioned for wider inventory
        this.leftArrow = this.add.text(30, 530, '<<', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.rightArrow = this.add.text(870, 530, '>>', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Set up inventory hover scrolling
        this.setupInventoryScrolling();
    }

    populateInventory() {
        const itemSize = 90;
        const itemSpacing = 100;
        const startX = 350; // Much more space before flour

        this.ingredientList.forEach((ingredient, index) => {
            const x = startX + (index * itemSpacing);
            const y = 530;

            console.log(`Creating ingredient: ${ingredient} at position (${x}, ${y}), texture exists: ${this.textures.exists(ingredient)}`);

            // Add ingredient image directly (with fallback to colored rectangle)
            let ingredientSprite;
            if (this.textures.exists(ingredient)) {
                ingredientSprite = this.add.image(x, y, ingredient);
                ingredientSprite.setDisplaySize(itemSize, itemSize);
                console.log(`Created image sprite for ${ingredient}`);
            } else {
                // Fallback colored rectangle
                const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3, 0x54A0FF];
                ingredientSprite = this.add.rectangle(x, y, itemSize, itemSize, colors[index % colors.length]);
                ingredientSprite.setStrokeStyle(2, 0x333333);
                console.log(`Created rectangle sprite for ${ingredient} with color ${colors[index % colors.length].toString(16)}`);
            }

            // Make ingredient interactive
            this.setupIngredientInteractions(ingredientSprite, ingredient, x, y);

            this.inventoryContainer.add(ingredientSprite);
        });

        // Calculate max scroll position with extra space at the end
        const totalItemsWidth = this.ingredientList.length * itemSpacing;
        const extraSpaceAfter = 300; // Add 300px of space after the last ingredient
        const visibleAreaWidth = 800; // Width of the visible inventory area (matches wider mask)
        
        // Set initial scroll position so flour appears on the left side
        this.inventoryScrollPosition = -(startX - 100); // Move flour to x=100 on screen
        this.inventoryContainer.x = this.inventoryScrollPosition;
        
        // Calculate scroll range: from showing empty space (positive) to showing end content (negative)
        const maxScrollLeft = 50; // Allow scrolling to show empty space before flour
        const maxScrollRight = -(startX + totalItemsWidth + extraSpaceAfter - visibleAreaWidth);
        this.maxScrollPosition = Math.abs(maxScrollRight); // Store as positive value for easier calculation
        this.minScrollPosition = -maxScrollLeft;
        
        console.log(`Initial scroll: ${this.inventoryScrollPosition}, Range: ${this.minScrollPosition} to -${this.maxScrollPosition}`);
        
        // Update scroll arrows
        this.updateScrollArrows();
    }

    setupInventoryScrolling() {
        // Create larger invisible hover areas for scrolling - adjusted for wider mask
        const leftHoverArea = this.add.rectangle(150, 530, 200, 120, 0x000000, 0);
        const rightHoverArea = this.add.rectangle(750, 530, 200, 120, 0x000000, 0);

        leftHoverArea.setInteractive();
        rightHoverArea.setInteractive();

        // Left scroll on hover
        leftHoverArea.on('pointerover', () => {
            this.startScrolling(-1);
            this.leftArrow.setTint(0xFFE4B5);
        });

        leftHoverArea.on('pointerout', () => {
            this.stopScrolling();
            this.leftArrow.clearTint();
        });

        // Right scroll on hover
        rightHoverArea.on('pointerover', () => {
            this.startScrolling(1);
            this.rightArrow.setTint(0xFFE4B5);
        });

        rightHoverArea.on('pointerout', () => {
            this.stopScrolling();
            this.rightArrow.clearTint();
        });

        // Update arrow visibility
        this.updateScrollArrows();
    }

    startScrolling(direction) {
        this.isScrolling = true;
        this.scrollDirection = direction;
        
        // Start the scroll loop
        this.scrollLoop();
    }

    scrollLoop() {
        if (!this.isScrolling) return;

        const scrollSpeed = 5; // Increased scroll speed
        const newPosition = this.inventoryScrollPosition - (this.scrollDirection * scrollSpeed);
        const clampedPosition = Phaser.Math.Clamp(newPosition, -this.maxScrollPosition, this.minScrollPosition);

        if (clampedPosition !== this.inventoryScrollPosition) {
            this.inventoryScrollPosition = clampedPosition;
            this.inventoryContainer.x = this.inventoryScrollPosition;
            this.updateScrollArrows();
        }

        // Continue scrolling if we haven't reached the limits
        if (this.isScrolling && 
            ((this.scrollDirection < 0 && this.inventoryScrollPosition > -this.maxScrollPosition) ||
             (this.scrollDirection > 0 && this.inventoryScrollPosition < this.minScrollPosition))) {
            
            // Use requestAnimationFrame for smooth scrolling
            this.time.delayedCall(16, () => this.scrollLoop()); // ~60fps
        }
    }

    stopScrolling() {
        this.isScrolling = false;
        this.scrollDirection = 0;
    }

    updateScrollArrows() {
        // Safety check - make sure arrows exist before trying to update them
        if (!this.leftArrow || !this.rightArrow) {
            return;
        }
        
        // Update arrow visibility and opacity based on scroll position
        if (this.inventoryScrollPosition <= -this.maxScrollPosition) {
            // At right limit - can't scroll right anymore
            this.leftArrow.setAlpha(1);
            this.rightArrow.setAlpha(0.3);
        } else if (this.inventoryScrollPosition >= this.minScrollPosition) {
            // At left limit - can't scroll left anymore
            this.leftArrow.setAlpha(0.3);
            this.rightArrow.setAlpha(1);
        } else {
            // Can scroll both ways
            this.leftArrow.setAlpha(1);
            this.rightArrow.setAlpha(1);
        }
    }

    // ===========================
    // INGREDIENT INTERACTIONS (ORIGINAL WORKING VERSION)
    // ===========================

    setupIngredientInteractions(sprite, ingredient, x, y) {
        console.log(`Setting up interactions for ${ingredient} at (${x}, ${y})`);
        
        sprite.setInteractive({ useHandCursor: true });
        
        // Store original position for this ingredient
        this.originalIngredientPositions.set(sprite, { x: x, y: y });
        
        sprite.on('pointerover', () => {
            console.log(`Hover over ${ingredient}`);
            if (!this.carriedSprite) { // Only hover effect if not carrying something
                sprite.setTint(0xFFFFFF);
                this.tweens.add({
                    targets: sprite,
                    y: y - 5, // Pop up by 5px
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        sprite.on('pointerout', () => {
            console.log(`Hover out ${ingredient}`);
            if (!this.carriedSprite) { // Only hover effect if not carrying something
                sprite.clearTint();
                this.tweens.add({
                    targets: sprite,
                    y: y, // Return to original position
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        sprite.on('pointerdown', (pointer) => {
            console.log(`Clicked on ${ingredient}`);
            if (pointer.leftButtonDown()) {
                this.pickupIngredient(ingredient, sprite);
            }
        });
    }

    pickupIngredient(ingredient, sprite) {
        if (this.carriedSprite) return; // Already carrying something

        console.log(`Picking up ingredient: ${ingredient}`);
        
        this.carriedIngredient = ingredient;
        this.carriedSprite = sprite;

        this.inventoryContainer.remove(sprite);
        this.add.existing(sprite);

        // Disable interaction so it doesn't block clicks
        sprite.disableInteractive();

        sprite.setDepth(1000); // Stay visually on top
        sprite.setTint(0xFFFF99);

        // Slightly larger size
        const carriedSize = 100;
        if (this.textures.exists(ingredient)) {
            sprite.setDisplaySize(carriedSize, carriedSize);
        } else {
            sprite.setScale(1.1);
        }

        this.showIngredientMessage(`Picked up ${ingredient}! Hold left-click on bowl to add. Right-click to drop.`);
    }

    resetInventory() {
        console.log('Resetting inventory');
        
        // If carrying something, destroy it
        if (this.carriedSprite) {
            this.carriedSprite.destroy();
            this.resetCarriedState();
        }
        
        // Clear and repopulate the entire inventory
        this.inventoryContainer.removeAll(true); // Remove and destroy all children
        this.originalIngredientPositions.clear();
        
        // Repopulate inventory
        this.populateInventory();
        
        // Reset scroll position to default (showing flour on left)
        this.inventoryScrollPosition = -(350 - 100); // Move flour to x=100 on screen
        this.inventoryContainer.x = this.inventoryScrollPosition;
        this.updateScrollArrows();
        
        this.showIngredientMessage('Dropped item!');
    }

    resetCarriedState() {
        this.carriedIngredient = null;
        this.carriedSprite = null;
    }

    addBowlBackToInventory() {
        const itemSize = 90;
        const x = 350 + (this.ingredientList.indexOf('bowl') * 100); // same spacing as in populateInventory
        const y = 530;

        const bowlSprite = this.add.image(x, y, 'bowl');
        bowlSprite.setDisplaySize(itemSize, itemSize);
        this.setupIngredientInteractions(bowlSprite, 'bowl', x, y);

        this.inventoryContainer.add(bowlSprite);
        this.originalIngredientPositions.set(bowlSprite, { x, y });
    }

    // ===========================
    // MESSAGE SYSTEM (ORIGINAL WORKING VERSION)
    // ===========================

    showIngredientMessage(message) {
        this.lastMessage = message; // Track the latest message

        // Clear any existing message and tween
        if (this.currentMessageText) {
            if (this.currentMessageTween) {
                this.currentMessageTween.destroy();
                this.currentMessageTween = null;
            }
            this.currentMessageText.destroy();
            this.currentMessageText = null;
        }

        // Create new message
        this.currentMessageText = this.add.text(450, 420, message, {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#90EE90',
            stroke: '#006400',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Create new tween
        this.currentMessageTween = this.tweens.add({
            targets: this.currentMessageText,
            alpha: 0,
            y: 380,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                if (this.currentMessageText) {
                    this.currentMessageText.destroy();
                    this.currentMessageText = null;
                }
                this.currentMessageTween = null;
                this.lastMessage = ''; // Reset after fading out
            }
        });
    }

    // ===========================
    // ABSTRACT METHODS
    // Override these in child classes
    // ===========================

    preloadEquipmentAssets() {
        // Override in child classes
    }

    addEquipmentVisuals() {
        // Override in child classes
    }

    getEquipmentName() {
        return 'Equipment';
    }

    getEquipmentInstructions() {
        return 'Use this equipment for baking!';
    }

    interactWithCarriedItem(pointer) {
        this.showIngredientMessage(`Left-clicked with ${this.carriedIngredient} - no function yet!`);
    }
}