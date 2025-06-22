class CountertopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CountertopScene' });
        this.selectedEquipment = null;
        this.inventoryItems = [];
        this.inventoryContainer = null;
        this.inventoryScrollPosition = 0;
        this.maxScrollPosition = 0;
        this.minScrollPosition = 0;
        this.scaleItems = [];
        this.scaleWeight = 0;
        this.isScrolling = false;
        this.scrollDirection = 0;
        this.carriedIngredient = null;
        this.carriedSprite = null;
        this.originalIngredientPositions = new Map();
        this.bowlOnScale = null;
        
        // Common baking ingredients - adjust these names to match your actual asset files
        this.ingredientList = [
            'bowl', 'flour', 'sugar', 'butter', 'egg', 'milk', 'chocchip', 
            'vanilla', 'bakingpowder', 'cocoa',
            'chocbar'
        ];
    }

    init(data) {
        this.selectedEquipment = data.selectedEquipment || 'unknown';
    }

    preload() {
        // Countertop asset should already be loaded from KitchenScene, but check
        if (!this.textures.exists('countertop')) {
            this.load.image('countertop', 'assets/scenes/countertop.png');
        }

        // Load inventory bar asset
        if (!this.textures.exists('inventory')) {
            this.load.image('inventory', 'assets/equipment/inventory.png');
        }

        // Load ingredient assets
        this.ingredientList.forEach(ingredient => {
            if (!this.textures.exists(ingredient)) {
                this.load.image(ingredient, `assets/ingredients/${ingredient}.png`);
            }
        });

        // Load equipment-specific assets
        if (this.selectedEquipment === 'mixer' && !this.textures.exists('mixer-nobowl')) {
            this.load.image('mixer-nobowl', 'assets/equipment/mixer-nobowl.png');
        }
        
        if (this.selectedEquipment === 'microwave' && !this.textures.exists('microwave-closed')) {
            this.load.image('microwave-closed', 'assets/equipment/microwave-closed.png');
        }
        
        if (this.selectedEquipment === 'microwave' && !this.textures.exists('microwave-open')) {
            this.load.image('microwave-open', 'assets/equipment/microwave-open.png');
        }
        
        if (this.selectedEquipment === 'scale' && !this.textures.exists('scale')) {
            this.load.image('scale', 'assets/equipment/scale.png');
        }
    }

    create() {
        // Fade in from the transition
        this.cameras.main.fadeIn(500, 139, 69, 19);

        // Add countertop background
        if (this.textures.exists('countertop')) {
            console.log('Countertop texture found, displaying...');
            
            const countertop = this.add.image(450, 300, 'countertop');
            countertop.setOrigin(0.5);
            
            // Scale to fit the screen while maintaining aspect ratio
            const scaleX = 900 / countertop.width;
            const scaleY = 600 / countertop.height;
            const scale = Math.min(scaleX, scaleY);
            countertop.setScale(scale);
        }

        // Add equipment-specific visuals
        this.addEquipmentVisuals();

        // Equipment-specific title
        const equipmentTitle = this.add.text(450, 50, `${this.selectedEquipment.toUpperCase()} STATION`, {
            fontFamily: 'Press Start 2P',
            fontSize: '28px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Back to kitchen button
        const backButton = this.add.text(50, 50, '< KITCHEN', {
            fontFamily: 'Press Start 2P',
            fontSize: '16px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        backButton.setInteractive({ useHandCursor: true });
        
        backButton.on('pointerover', () => {
            backButton.setTint(0xFFE4B5);
        });

        backButton.on('pointerout', () => {
            backButton.clearTint();
        });

        backButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(300, 139, 69, 19);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('KitchenScene');
            });
        });

        // Add inventory bar at the bottom
        this.addInventoryBar();

        // Instructions based on equipment (moved up slightly to account for inventory bar)
        const instructions = this.getEquipmentInstructions(this.selectedEquipment);
        this.add.text(450, 430, instructions, {
            fontFamily: 'Press Start 2P',
            fontSize: '12px',
            fill: '#DEB887',
            stroke: '#8B4513',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add scale weight display if scale is selected
        if (this.selectedEquipment === 'scale') {
            this.scaleWeightText = this.add.text(450, 320, '0 g', {
                fontFamily: 'Press Start 2P',
                fontSize: '32px',
                fill: '#000000',
                stroke: '#F5DEB3',
                strokeThickness: 2
            }).setOrigin(0.5);
        }

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

        // Disable right-click context menu
        this.input.mouse.disableContextMenu();

        // Set up global pointer events for drag and drop
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

        console.log(`Countertop scene loaded for ${this.selectedEquipment}`);
    }

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
            fontFamily: 'Press Start 2P',
            fontSize: '18px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.rightArrow = this.add.text(870, 530, '>>', {
            fontFamily: 'Press Start 2P',
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

    useIngredient(ingredient) {
        console.log(`Using ingredient: ${ingredient}`);
        
        if (this.selectedEquipment === 'scale') {
            this.addToScale(ingredient);
        } else {
            // For other equipment, just show a message for now
            this.showIngredientMessage(`Added ${ingredient} to ${this.selectedEquipment}!`);
        }
    }

    pickupIngredient(ingredient, sprite) {
    if (this.carriedSprite) return; // Already carrying something

    console.log(`Picking up ingredient: ${ingredient}`);
    
    this.carriedIngredient = ingredient;
    this.carriedSprite = sprite;

    this.inventoryContainer.remove(sprite);
    this.add.existing(sprite);

    // Disable interaction so it doesn’t block clicks
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

    this.showIngredientMessage(`Picked up ${ingredient}! Left-click to interact, right-click to drop.`);
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
        
        this.showIngredientMessage('Inventory reset!');
    }

    interactWithCarriedItem(pointer) {
        if (!this.carriedSprite || !this.carriedIngredient) {
            return;
        }

        console.log(`Interacting with carried ingredient: ${this.carriedIngredient}`);
        
        // For all other ingredients or equipment combinations
        // this.showIngredientMessage(`Left-clicked with ${this.carriedIngredient} - no function yet!`);
    }

    placeBowlOnScale(pointer) {
        if (this.bowlOnScale) {
            this.showIngredientMessage('Scale already has a bowl!');
            return;
        }

        console.log('Placing bowl on scale');
        
        // Create bowl sprite on the scale at normal inventory size (90px)
        const bowlOnScale = this.add.image(450, 350, 'bowl');
        bowlOnScale.setDisplaySize(90, 90); // Normal inventory size, not carried size
        bowlOnScale.setDepth(10); // Above scale
        
        this.bowlOnScale = bowlOnScale;
        
        // Add bowl weight to scale
        this.addToScale('bowl');
        
        // Remove carried bowl and reset state
        this.carriedSprite.destroy();
        this.resetCarriedState();
        
        this.showIngredientMessage('Bowl placed on scale!');
    }

    returnIngredientToInventory() {
        if (!this.carriedSprite || !this.carriedIngredient) {
            return;
        }

        // Get original position
        const originalPos = this.originalIngredientPositions.get(this.carriedSprite);
        
        // Reset visual state to correct inventory size
        this.carriedSprite.clearTint();
        this.carriedSprite.setDepth(0);
        
        // Set correct inventory size for both image and rectangle sprites
        const itemSize = 90;
        if (this.textures.exists(this.carriedIngredient)) {
            this.carriedSprite.setDisplaySize(itemSize, itemSize);
        } else {
            this.carriedSprite.setScale(1); // For rectangle sprites
        }
        
        // Animate back to original position
        this.tweens.add({
            targets: this.carriedSprite,
            x: originalPos.x,
            y: originalPos.y,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Add back to inventory container
                this.inventoryContainer.add(this.carriedSprite);
                this.resetCarriedState();
            }
        });

        this.showIngredientMessage(`Returned ${this.carriedIngredient} to inventory.`);
    }

    resetCarriedState() {
        this.carriedIngredient = null;
        this.carriedSprite = null;
    }

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

    addToScale(ingredient) {
        // Simulate different weights for different ingredients (in grams)
        const weights = {
            'bowl': 250,
            'flour': 125,
            'sugar': 200,
            'butter': 115,
            'egg': 50,
            'milk': 240,
            'chocchip': 100,
            'vanilla': 5,
            'cocoa': 4,
            'salt': 6,
            'cocoa-powder': 20,
        };

        const weight = weights[ingredient] || 100;
        this.scaleWeight += weight;
        this.scaleItems.push({ ingredient, weight });

        // Update scale display
        if (this.scaleWeightText) {
            this.scaleWeightText.setText(`${this.scaleWeight} g`);
        }

        this.showIngredientMessage(`Added ${weight}g of ${ingredient} to scale!`);
        console.log(`Scale now contains:`, this.scaleItems);
    }

    showIngredientMessage(message) {
        // Create a temporary message that fades out
        const messageText = this.add.text(450, 400, message, {
            fontFamily: 'Press Start 2P',
            fontSize: '10px',
            fill: '#90EE90',
            stroke: '#006400',
            strokeThickness: 1
        }).setOrigin(0.5);

        this.tweens.add({
            targets: messageText,
            alpha: 0,
            y: 380,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    addEquipmentVisuals() {
        // Add equipment-specific visual elements
        if (this.selectedEquipment === 'mixer') {
            this.addMixerVisuals();
        } else if (this.selectedEquipment === 'microwave') {
            this.addMicrowaveVisuals();
        } else if (this.selectedEquipment === 'scale') {
            this.addScaleVisuals();
        }
        // Add other equipment visuals here as needed
        // else if (this.selectedEquipment === 'stove') { this.addStoveVisuals(); }
        // else if (this.selectedEquipment === 'oven') { this.addOvenVisuals(); }
        // etc.
    }

    addMixerVisuals() {
        if (this.textures.exists('mixer-nobowl')) {
            console.log('Mixer texture found, displaying...');
            
            // Add the mixer in the center of the scene
            const mixer = this.add.image(450, 270, 'mixer-nobowl');
            mixer.setOrigin(0.5);
            
            // Scale the mixer appropriately (adjust as needed)
            mixer.setScale(0.3);
            
            // Make the mixer interactive for future functionality
            mixer.setInteractive({ useHandCursor: true });
            
            // Add hover effects
            mixer.on('pointerover', () => {
                mixer.setTint(0xF0F0F0);
                this.tweens.add({
                    targets: mixer,
                    scaleX: 0.32,
                    scaleY: 0.32,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            mixer.on('pointerout', () => {
                mixer.clearTint();
                this.tweens.add({
                    targets: mixer,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            mixer.on('pointerdown', () => {
                // Future: Add mixing functionality here
                console.log('Mixer clicked!');
            });

        } else {
            console.warn('Mixer texture not found, creating placeholder...');
            this.createMixerPlaceholder();
        }
    }

    addMicrowaveVisuals() {
        if (this.textures.exists('microwave-closed')) {
            console.log('Microwave texture found, displaying...');
            
            // Add the microwave in the center of the scene
            this.microwave = this.add.image(450, 270, 'microwave-closed');
            this.microwave.setOrigin(0.5);
            
            // Scale the microwave appropriately (adjust as needed)
            this.microwave.setScale(0.3);
            
            // Make the microwave interactive for future functionality
            this.microwave.setInteractive({ useHandCursor: true });
            
            // Variable to track if microwave is open
            this.microwaveOpen = false;
            this.microwaveOpenImage = null;

            this.microwave.on('pointerdown', () => {
                this.toggleMicrowave();
            });
        }
    }

    addScaleVisuals() {
        if (this.textures.exists('scale')) {
            console.log('Scale texture found, displaying...');
            
            // Add the scale in the center of the scene
            const scale = this.add.image(450, 360, 'scale');
            scale.setOrigin(0.5);
            
            // Scale the scale appropriately (adjust as needed)
            scale.setScale(0.25);
            
            // Make the scale interactive for future functionality
            scale.setInteractive({ useHandCursor: true });
            
            // Add hover effects
            scale.on('pointerover', () => {
                scale.setTint(0xF0F0F0);
                this.tweens.add({
                    targets: scale,
                    scaleX: 0.30,
                    scaleY: 0.25,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            scale.on('pointerout', () => {
                scale.clearTint();
                this.tweens.add({
                    targets: scale,
                    scaleX: 0.25,
                    scaleY: 0.25,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            scale.on('pointerdown', () => {
                if (this.carriedSprite && this.carriedIngredient === 'bowl') {
                    // Place bowl on scale
                    if (this.bowlOnScale) {
                        this.showIngredientMessage('Scale already has a bowl!');
                    } else {
                        this.bowlOnScale = this.add.image(450, 230, 'bowl');
                        this.bowlOnScale.setDisplaySize(240, 200);
                        this.bowlOnScale.setDepth(10);
                        this.addToScale('bowl');

                        this.carriedSprite.destroy();
                        this.resetCarriedState();
                        this.showIngredientMessage('Bowl placed on scale!');
                    }
                } else if (this.carriedSprite) {
                    this.showIngredientMessage("Can't tare while holding an item!");
                } else {
                    this.tareScale();
                }
            });


        }
    }

    clearScale() {
        this.scaleWeight = 0;
        this.scaleItems = [];
        
        // Remove bowl from scale if present
        if (this.bowlOnScale) {
            this.bowlOnScale.destroy();
            this.bowlOnScale = null;
        }
        
        if (this.scaleWeightText) {
            this.scaleWeightText.setText('Weight: 0g');
        }
        
        this.showIngredientMessage('Scale cleared!');
        console.log('Scale cleared');
    }

    toggleMicrowave() {
        if (!this.microwaveOpen && this.textures.exists('microwave-open')) {
            // Open the microwave
            console.log('Opening microwave...');
            this.microwaveOpenImage = this.add.image(372, 274, 'microwave-open');
            this.microwaveOpenImage.setOrigin(0.5);
            this.microwaveOpenImage.setScale(0.3);
            this.microwaveOpen = true;
            
            // Make the open microwave clickable to close it
            this.microwaveOpenImage.setInteractive({ useHandCursor: true });
            this.microwaveOpenImage.on('pointerdown', () => {
                this.toggleMicrowave();
            });
            
            
        } else if (this.microwaveOpen && this.microwaveOpenImage) {
            // Close the microwave
            console.log('Closing microwave...');
            this.microwaveOpenImage.destroy();
            this.microwaveOpenImage = null;
            this.microwaveOpen = false;
        }
    }

    getEquipmentInstructions(equipment) {
        const instructions = {
            'stove': 'Ready to cook on the stovetop! Pick up ingredients and left-click to use. Right-click to reset.',
            'oven': 'Perfect for baking brownies! Pick up ingredients and left-click to use. Right-click to reset.',
            'microwave': 'Click the microwave to open/close the door! Pick up ingredients and left-click to use. Right-click to reset.',
            'mixer': 'Click the mixer to start mixing! Pick up ingredients and left-click to use. Right-click to reset.',
            'scale': 'Pick up the bowl and left-click to place it on the scale! Right-click to reset inventory.'
        };
        
        return instructions[equipment] || 'Use this equipment for baking! Pick up ingredients and left-click to use. Right-click to reset.';
    }

    tareScale() {
    // Set the current weight as the tare offset
    this.tareOffset = this.scaleWeight;

    this.showIngredientMessage('Scale tared!');
    console.log(`Tare set at: ${this.tareOffset}g`);
}

}