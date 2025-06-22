/**
 * Microwave Scene
 * Handles all microwave-specific functionality including heating and timing
 */
class MicrowaveScene extends BaseCountertopScene {
    constructor() {
        super('MicrowaveScene');
        
        // Microwave-specific properties
        this.microwaveOpen = false;
        this.microwaveOpenImage = null;
        this.microwave = null;
        
        // Bowl in microwave functionality
        this.bowlInMicrowave = null;
        
        // Timer system
        this.microwaveTimerText = null;
    }

    preloadEquipmentAssets() {
        if (!this.textures.exists('microwave-closed')) {
            this.load.image('microwave-closed', 'assets/equipment/microwave-closed.png');
        }
        if (!this.textures.exists('microwave-open')) {
            this.load.image('microwave-open', 'assets/equipment/microwave-open.png');
        }
    }

    addEquipmentVisuals() {
        if (this.textures.exists('microwave-closed')) {
            console.log('Microwave texture found, displaying...');
            
            this.microwave = this.add.image(450, 270, 'microwave-closed');
            this.microwave.setOrigin(0.5);
            this.microwave.setScale(0.3);
            this.microwave.setInteractive({ useHandCursor: true });

            this.microwave.on('pointerdown', () => {
                this.toggleMicrowave();
            });
        } else {
            console.warn('Microwave texture not found, creating placeholder...');
            this.createMicrowavePlaceholder();
        }
    }

    createMicrowavePlaceholder() {
        // Fallback rectangle if asset isn't found
        this.microwave = this.add.rectangle(450, 270, 200, 150, 0x888888);
        this.microwave.setStrokeStyle(3, 0x333333);
        this.microwave.setInteractive({ useHandCursor: true });
        
        // Add text label
        this.add.text(450, 270, 'MICROWAVE', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);

        this.microwave.on('pointerdown', () => {
            this.toggleMicrowave();
        });
    }

    getEquipmentName() {
        return 'microwave';
    }

    getEquipmentInstructions() {
        return 'Click the microwave to open/close the door! Place bowl inside and close to start timer. Right-click to reset.';
    }

    interactWithCarriedItem(pointer) {
        if (!this.carriedSprite || !this.carriedIngredient) return;

        // Check if carrying a bowl and microwave is open
        if (this.carriedIngredient === 'bowl' && this.microwaveOpen) {
            if (this.microwaveOpenImage) {
                const microwaveBounds = this.microwaveOpenImage.getBounds();
                if (Phaser.Geom.Rectangle.Contains(microwaveBounds, pointer.x, pointer.y)) {
                    this.placeBowlInMicrowave();
                    return;
                }
            } else if (this.microwave) {
                // Fallback for placeholder microwave
                const microwaveBounds = this.microwave.getBounds();
                if (Phaser.Geom.Rectangle.Contains(microwaveBounds, pointer.x, pointer.y)) {
                    this.placeBowlInMicrowave();
                    return;
                }
            }
        }

        this.showIngredientMessage(`Left-clicked with ${this.carriedIngredient} - no function yet!`);
    }

    // ===========================
    // MICROWAVE OPERATIONS
    // ===========================

    toggleMicrowave() {
        if (!this.microwaveOpen && this.textures.exists('microwave-open')) {
            // Open the microwave
            console.log('Opening microwave...');
            this.microwaveOpenImage = this.add.image(372, 274, 'microwave-open');
            this.microwaveOpenImage.setOrigin(0.5);
            this.microwaveOpenImage.setScale(0.3);
            this.microwaveOpen = true;

            this.microwaveOpenImage.setInteractive({ useHandCursor: true });
            this.microwaveOpenImage.on('pointerdown', () => {
                this.toggleMicrowave();
            });

            // Make bowl visible when door opens
            if (this.bowlInMicrowave) {
                this.bowlInMicrowave.setVisible(true);
            }

            this.showIngredientMessage('Microwave door opened!');
            
        } else if (this.microwaveOpen && this.microwaveOpenImage) {
            // Prevent closing if holding a bowl
            if (this.carriedIngredient === 'bowl') {
                this.showIngredientMessage("You can't close the microwave while holding the bowl!");
                return;
            }

            // Close the microwave
            console.log('Closing microwave...');
            this.microwaveOpenImage.destroy();
            this.microwaveOpenImage = null;
            this.microwaveOpen = false;

            // Make bowl invisible when door closes
            if (this.bowlInMicrowave) {
                this.bowlInMicrowave.setVisible(false);
                this.startMicrowaveTimer();
            } else {
                this.showIngredientMessage('Microwave door closed!');
            }
        }
        else if (!this.textures.exists('microwave-open')) {
            // Handle placeholder microwave toggle
            this.microwaveOpen = !this.microwaveOpen;
            const status = this.microwaveOpen ? 'opened' : 'closed';
            this.microwave.setTint(this.microwaveOpen ? 0xFFFFAA : 0xFFFFFF);

            // Show/hide bowl accordingly
            if (this.bowlInMicrowave) {
                this.bowlInMicrowave.setVisible(this.microwaveOpen);

                if (!this.microwaveOpen) {
                    this.startMicrowaveTimer();
                }
            }

            this.showIngredientMessage(`Microwave door ${status}!`);
        }
    }


    // ===========================
    // BOWL MANAGEMENT
    // ===========================

    placeBowlInMicrowave() {
        if (this.bowlInMicrowave) {
            this.showIngredientMessage('Microwave already has a bowl!');
            return;
        }

        console.log('Placing bowl in microwave');
        
        // Create bowl sprite inside the microwave
        this.bowlInMicrowave = this.add.image(420, 274, 'bowl');
        this.bowlInMicrowave.setDisplaySize(160, 120);
        this.bowlInMicrowave.setDepth(5);
        this.bowlInMicrowave.setInteractive({ useHandCursor: true });
        
        // Allow clicking bowl to remove it (only when microwave is open)
        this.bowlInMicrowave.on('pointerdown', () => {
            if (this.microwaveOpen && !this.carriedSprite) {
                this.removeBowlFromMicrowave();
            } else if (!this.microwaveOpen) {
                this.showIngredientMessage('Open the microwave first!');
            } else {
                this.showIngredientMessage("Can't remove bowl while holding an item!");
            }
        });
        
        // Remove carried bowl and reset state
        this.carriedSprite.destroy();
        this.resetCarriedState();
        
        this.showIngredientMessage('Bowl placed in microwave!');
    }

    removeBowlFromMicrowave() {
        if (!this.bowlInMicrowave) return;
        
        if (!this.microwaveOpen) {
            this.showIngredientMessage('Open the microwave first!');
            return;
        }
        
        this.bowlInMicrowave.destroy();
        this.bowlInMicrowave = null;
        
        this.showIngredientMessage('Removed bowl from microwave.');
        this.addBowlBackToInventory();
    }

    // ===========================
    // TIMER SYSTEM
    // ===========================

    startMicrowaveTimer() {
        console.log('Starting microwave timer...');
        this.showMicrowaveTimerPopup();
    }

    showMicrowaveTimerPopup() {
        // Clear any existing timer text
        if (this.microwaveTimerText) {
            this.microwaveTimerText.destroy();
        }
        
        // Create the "+2mins" popup text
        this.microwaveTimerText = this.add.text(450, 200, '+2mins', {
            fontFamily: 'VT323',
            fontSize: '32px',
            fill: '#00FF00',
            stroke: '#008000',
            strokeThickness: 2,
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Start with invisible and small
        this.microwaveTimerText.setAlpha(0);
        this.microwaveTimerText.setScale(0.5);
        
        // Animate the popup entrance
        this.tweens.add({
            targets: this.microwaveTimerText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Keep it visible for 2 seconds, then fade out
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: this.microwaveTimerText,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            if (this.microwaveTimerText) {
                                this.microwaveTimerText.destroy();
                                this.microwaveTimerText = null;
                            }
                        }
                    });
                });
            }
        });
        
        // Also show a message at the bottom
        this.showIngredientMessage('Microwave started! 2 minutes remaining.');
    }

    // ===========================
    // ADDITIONAL FEATURES
    // ===========================

    // Method to simulate microwave completion (for future use)
    completeMicrowaving() {
        if (this.bowlInMicrowave) {
            // Add visual effects or state changes here
            this.showIngredientMessage('Microwave finished! Food is heated.');
            
            // Could add heated effect to bowl
            if (this.bowlInMicrowave) {
                this.bowlInMicrowave.setTint(0xFFAAAA); // Slight red tint for "heated"
            }
        }
    }

    // Method to reset microwave state (for future use)
    resetMicrowave() {
        if (this.bowlInMicrowave) {
            this.removeBowlFromMicrowave();
        }
        
        if (this.microwaveOpen) {
            this.toggleMicrowave();
        }
        
        if (this.microwaveTimerText) {
            this.microwaveTimerText.destroy();
            this.microwaveTimerText = null;
        }
        
        this.showIngredientMessage('Microwave reset!');
    }
}