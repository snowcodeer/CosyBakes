/**
 * Mixer Scene
 * Handles all mixer-specific functionality including mixing ingredients
 */
class MixerScene extends BaseCountertopScene {
    constructor() {
        super('MixerScene');
        
        // Mixer-specific properties
        this.mixer = null;
        this.bowlInMixer = null;
        this.mixerRunning = false;
        this.mixingTween = null;
        
        // Mixing progress
        this.mixingLevel = 0; // 0 = not mixed, 100 = fully mixed
        this.mixingProgressBar = null;
        this.mixingProgressText = null;
    }

    preloadEquipmentAssets() {
        if (!this.textures.exists('mixer-nobowl')) {
            this.load.image('mixer-nobowl', 'assets/equipment/mixer-nobowl.png');
        }
    }

    create() {
        super.create();
        
        // Add mixing progress display
        this.createMixingProgressDisplay();
    }

    addEquipmentVisuals() {
        if (this.textures.exists('mixer-nobowl')) {
            console.log('Mixer texture found, displaying...');
            
            this.mixer = this.add.image(450, 270, 'mixer-nobowl');
            this.mixer.setOrigin(0.5);
            this.mixer.setScale(0.3);
            this.mixer.setInteractive({ useHandCursor: true });
            
            // Add hover effects
            this.mixer.on('pointerover', () => {
                if (!this.mixerRunning) {
                    this.mixer.setTint(0xF0F0F0);
                    this.tweens.add({
                        targets: this.mixer,
                        scaleX: 0.32,
                        scaleY: 0.32,
                        duration: 200,
                        ease: 'Power2'
                    });
                }
            });

            this.mixer.on('pointerout', () => {
                if (!this.mixerRunning) {
                    this.mixer.clearTint();
                    this.tweens.add({
                        targets: this.mixer,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        duration: 200,
                        ease: 'Power2'
                    });
                }
            });

            this.mixer.on('pointerdown', () => {
                this.handleMixerClick();
            });

        } else {
            console.warn('Mixer texture not found, creating placeholder...');
            this.createMixerPlaceholder();
        }
    }

    createMixerPlaceholder() {
        // Fallback rectangle if asset isn't found
        this.mixer = this.add.rectangle(450, 270, 200, 180, 0xCCCCCC);
        this.mixer.setStrokeStyle(3, 0x333333);
        this.mixer.setInteractive({ useHandCursor: true });
        
        // Add text label
        this.add.text(450, 270, 'MIXER', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#333333'
        }).setOrigin(0.5);

        this.mixer.on('pointerdown', () => {
            this.handleMixerClick();
        });
    }

    createMixingProgressDisplay() {
        // Progress bar background
        const progressBg = this.add.rectangle(750, 200, 120, 20, 0x333333);
        progressBg.setStrokeStyle(2, 0x666666);
        
        // Progress bar fill
        this.mixingProgressBar = this.add.rectangle(750, 200, 0, 16, 0x00AA00);
        
        // Progress text
        this.mixingProgressText = this.add.text(750, 230, 'Mixing: 0%', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Initially hidden
        progressBg.setVisible(false);
        this.mixingProgressBar.setVisible(false);
        this.mixingProgressText.setVisible(false);
        
        // Store references for easy access
        this.progressBg = progressBg;
    }

    getEquipmentName() {
        return 'mixer';
    }

    getEquipmentInstructions() {
        return 'Place a bowl in the mixer, then click to start mixing! Right-click to reset.';
    }

    interactWithCarriedItem(pointer) {
        if (!this.carriedSprite || !this.carriedIngredient) return;

        // Check if placing bowl in mixer
        if (this.carriedIngredient === 'bowl' && this.mixer) {
            const mixerBounds = this.mixer.getBounds();
            if (Phaser.Geom.Rectangle.Contains(mixerBounds, pointer.x, pointer.y)) {
                this.placeBowlInMixer();
                return;
            }
        }

        this.showIngredientMessage(`Left-clicked with ${this.carriedIngredient} - no function yet!`);
    }

    // ===========================
    // MIXER OPERATIONS
    // ===========================

    handleMixerClick() {
        if (this.carriedSprite && this.carriedIngredient === 'bowl') {
            this.placeBowlInMixer();
        } else if (this.bowlInMixer && !this.mixerRunning) {
            this.startMixing();
        } else if (this.mixerRunning) {
            this.showIngredientMessage('Mixer is already running!');
        } else {
            this.showIngredientMessage('Need a bowl in the mixer first!');
        }
    }

    startMixing() {
        if (this.mixerRunning) {
            this.showIngredientMessage('Mixer is already running!');
            return;
        }

        this.mixerRunning = true;
        this.showIngredientMessage('Mixing started!');
        
        // Show progress display
        this.progressBg.setVisible(true);
        this.mixingProgressBar.setVisible(true);
        this.mixingProgressText.setVisible(true);
        
        // Visual effects for mixer
        this.mixer.setTint(0xAAFFAA);
        
        // Start mixing animation and progress
        this.runMixingCycle();
    }

    runMixingCycle() {
        const mixingDuration = 3000; // 3 seconds total
        const updateInterval = 50; // Update every 50ms
        const totalUpdates = mixingDuration / updateInterval;
        let currentUpdate = 0;

        // Bowl mixing animation
        this.mixingTween = this.tweens.add({
            targets: this.bowlInMixer,
            rotation: 0.1,
            duration: 100,
            yoyo: true,
            repeat: (mixingDuration / 100) - 1, // Total repeats for duration
            onComplete: () => {
                this.completeMixing();
            }
        });

        // Progress update timer
        this.mixingTimer = this.time.addEvent({
            delay: updateInterval,
            callback: () => {
                currentUpdate++;
                this.mixingLevel = Math.round((currentUpdate / totalUpdates) * 100);
                this.updateMixingProgress();
                
                if (currentUpdate >= totalUpdates) {
                    this.mixingTimer.destroy();
                }
            },
            repeat: totalUpdates - 1
        });
    }

    updateMixingProgress() {
        // Update progress bar width
        const maxWidth = 116; // Slightly less than background width
        const currentWidth = (this.mixingLevel / 100) * maxWidth;
        this.mixingProgressBar.setDisplaySize(currentWidth, 16);
        
        // Update progress text
        this.mixingProgressText.setText(`Mixing: ${this.mixingLevel}%`);
        
        // Change color as mixing progresses
        if (this.mixingLevel < 30) {
            this.mixingProgressBar.setFillStyle(0xFF4444); // Red - just started
        } else if (this.mixingLevel < 70) {
            this.mixingProgressBar.setFillStyle(0xFFAA44); // Orange - getting there
        } else {
            this.mixingProgressBar.setFillStyle(0x44AA44); // Green - almost done
        }
    }

    completeMixing() {
        this.mixerRunning = false;
        this.mixingLevel = 100;
        
        // Reset mixer visual state
        this.mixer.clearTint();
        if (this.bowlInMixer) {
            this.bowlInMixer.setRotation(0);
        }
        
        // Final progress update
        this.updateMixingProgress();
        
        // Hide progress after a delay
        this.time.delayedCall(2000, () => {
            this.progressBg.setVisible(false);
            this.mixingProgressBar.setVisible(false);
            this.mixingProgressText.setVisible(false);
        });
        
        this.showIngredientMessage('Mixing complete! Ingredients are well combined.');
        console.log('Mixing cycle completed');
    }

    stopMixing() {
        if (!this.mixerRunning) return;
        
        this.mixerRunning = false;
        
        // Stop animations
        if (this.mixingTween) {
            this.mixingTween.destroy();
            this.mixingTween = null;
        }
        
        if (this.mixingTimer) {
            this.mixingTimer.destroy();
            this.mixingTimer = null;
        }
        
        // Reset visual state
        this.mixer.clearTint();
        if (this.bowlInMixer) {
            this.bowlInMixer.setRotation(0);
        }
        
        this.showIngredientMessage('Mixing stopped.');
    }

    // ===========================
    // BOWL MANAGEMENT
    // ===========================

    placeBowlInMixer() {
        if (this.bowlInMixer) {
            this.showIngredientMessage('Mixer already has a bowl!');
            return;
        }

        console.log('Placing bowl in mixer');
        
        // Create bowl sprite in the mixer position
        this.bowlInMixer = this.add.image(390, 318, 'bowl');
        this.bowlInMixer.setDisplaySize(160, 120);
        this.bowlInMixer.setDepth(5);
        this.bowlInMixer.setInteractive({ useHandCursor: true });

        // Allow clicking bowl to remove it
        this.bowlInMixer.on('pointerdown', () => {
            if (!this.carriedSprite && !this.mixerRunning) {
                this.removeBowlFromMixer();
            } else if (this.mixerRunning) {
                this.showIngredientMessage('Wait for mixing to finish!');
            } else {
                this.showIngredientMessage("Can't remove bowl while holding an item!");
            }
        });
        
        // Remove carried bowl and reset state
        this.carriedSprite.destroy();
        this.resetCarriedState();
        
        // Reset mixing level for new bowl
        this.mixingLevel = 0;
        
        this.showIngredientMessage('Bowl placed in mixer!');
    }

    removeBowlFromMixer() {
        if (!this.bowlInMixer) return;
        
        if (this.mixerRunning) {
            this.showIngredientMessage('Wait for mixing to finish!');
            return;
        }

        this.bowlInMixer.destroy();
        this.bowlInMixer = null;
        
        // Hide progress display
        this.progressBg.setVisible(false);
        this.mixingProgressBar.setVisible(false);
        this.mixingProgressText.setVisible(false);
        
        this.showIngredientMessage('Removed bowl from mixer.');
        this.addBowlBackToInventory();
    }

    // ===========================
    // ADDITIONAL FEATURES
    // ===========================

    // Method to get mixing status (for future recipe systems)
    getMixingStatus() {
        return {
            hasBowl: !!this.bowlInMixer,
            isRunning: this.mixerRunning,
            mixingLevel: this.mixingLevel,
            isFullyMixed: this.mixingLevel >= 100
        };
    }

    // Method to reset mixer state
    resetMixer() {
        this.stopMixing();
        
        if (this.bowlInMixer) {
            this.removeBowlFromMixer();
        }
        
        this.mixingLevel = 0;
        this.showIngredientMessage('Mixer reset!');
    }
}