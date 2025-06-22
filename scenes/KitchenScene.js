/**
 * Kitchen Scene - Updated Original Version
 * Main hub where players can select different equipment to use
 */
class KitchenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KitchenScene' });
    }

    preload() {
        // Add loading progress for debugging
        this.load.on('loaderror', (file) => {
            console.error('Failed to load:', file.src);
        });

        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
        });

        // Try loading countertop asset for later use
        if (!this.textures.exists('countertop')) {
            this.load.image('countertop', 'assets/scenes/countertop.png');
        }

        // Kitchen asset should already be loaded from RecipeSelectionScene
        if (!this.textures.exists('kitchen')) {
            console.log('Loading kitchen asset...');
            this.load.image('kitchen', 'assets/scenes/kitchen.png');
        }
    }

    create() {
        // Fade in from the transition
        this.cameras.main.fadeIn(500, 139, 69, 19);

        // Check if kitchen texture exists
        if (this.textures.exists('kitchen')) {
            console.log('Kitchen texture found, displaying...');
            
            // Add kitchen background
            const kitchen = this.add.image(450, 300, 'kitchen');
            kitchen.setOrigin(0.5);
            
            // Scale to fit the screen while maintaining aspect ratio
            const scaleX = 900 / kitchen.width;
            const scaleY = 600 / kitchen.height;
            const scale = Math.min(scaleX, scaleY);
            kitchen.setScale(scale);
            
            console.log(`Kitchen scaled to: ${scale}, original size: ${kitchen.width}x${kitchen.height}`);
        } else {
            console.warn('Kitchen texture not found - please add kitchen.png to assets/scenes/');
            
            // Simple background without placeholder
            const bg = this.add.rectangle(450, 300, 900, 600, 0x8B4513);
            bg.setStrokeStyle(5, 0x654321);
        }

        // Back button
        const backButton = this.add.text(50, 50, '< BACK', {
            fontFamily: 'VT323',
            fontSize: '32px',
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
                // Check if RecipeSelectionScene exists, otherwise stay in kitchen
                if (this.scene.manager.getScene('RecipeSelectionScene')) {
                    this.scene.start('RecipeSelectionScene');
                } else {
                    console.log('RecipeSelectionScene not found - staying in kitchen');
                }
            });
        });

        // Instruction text
        const instruction = this.add.text(450, 580, 'Click on equipment to start baking!', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#DEB887',
            stroke: '#8B4513',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Add subtle floating animation to instruction text
        this.tweens.add({
            targets: instruction,
            alpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add interactive equipment areas
        this.createEquipmentHotspots();

        console.log('Kitchen scene loaded! Ready to add baking mechanics.');
    }

    createEquipmentHotspots() {
        // Define equipment locations based on the actual kitchen.png layout
        const equipment = [
            { 
                name: 'scale', 
                scene: 'ScaleScene',
                x: 270, 
                y: 310, 
                width: 80, 
                height: 80,
                description: 'Weigh ingredients precisely'
            },
            { 
                name: 'stove', 
                scene: 'StoveScene', // Future scene
                x: 430, 
                y: 350, 
                width: 200, 
                height: 30,
                description: 'Cook on the stovetop'
            },
            { 
                name: 'oven', 
                scene: 'OvenScene', // Future scene
                x: 430, 
                y: 470, 
                width: 230, 
                height: 190,
                description: 'Bake in the oven'
            },
            { 
                name: 'microwave', 
                scene: 'MicrowaveScene',
                x: 630, 
                y: 310, 
                width: 130, 
                height: 100,
                description: 'Heat and warm ingredients'
            },
            { 
                name: 'mixer', 
                scene: 'MixerScene',
                x: 800, 
                y: 310, 
                width: 130, 
                height: 120,
                description: 'Mix ingredients together'
            }
        ];

        equipment.forEach(item => {
            // Create invisible interactive area
            const hotspot = this.add.rectangle(item.x, item.y, item.width, item.height, 0x000000, 0);
            hotspot.setInteractive({ useHandCursor: true });

            // Add visual feedback for debugging (semi-transparent overlay)
            const visual = this.add.rectangle(item.x, item.y, item.width, item.height, 0xFFD700, 0.2);
            visual.setVisible(false); // Hidden by default

            // Add equipment label
            const label = this.add.text(item.x, item.y - item.height/2 - 20, item.name.toUpperCase(), {
                fontFamily: 'VT323',
                fontSize: '20px',
                fill: '#F5DEB3',
                stroke: '#8B4513',
                strokeThickness: 2
            }).setOrigin(0.5).setVisible(false);

            // Hover effects
            hotspot.on('pointerover', () => {
                visual.setVisible(true);
                label.setVisible(true);
                
                // Add subtle glow animation
                this.tweens.add({
                    targets: visual,
                    alpha: 0.4,
                    duration: 300,
                    ease: 'Power2'
                });

                // Scale up labels slightly
                this.tweens.add({
                    targets: [label],
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200,
                    ease: 'Power2'
                });
            });

            hotspot.on('pointerout', () => {
                visual.setVisible(false);
                label.setVisible(false);
            });

            hotspot.on('pointerdown', () => {
                // Click feedback
                this.tweens.add({
                    targets: visual,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });

                // Transition to specific equipment scene
                this.time.delayedCall(200, () => {
                    this.transitionToEquipment(item.name, item.scene);
                });
            });
        });
    }

    transitionToEquipment(equipmentName, sceneKey) {
        console.log(`Clicked on ${equipmentName}, transitioning to ${sceneKey}...`);
        
        // Check if the target scene exists
        if (this.scene.manager.getScene(sceneKey)) {
            this.cameras.main.fadeOut(500, 139, 69, 19);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start(sceneKey);
            });
        } else {
            // Scene doesn't exist yet - show message
            console.warn(`${sceneKey} not implemented yet`);
            
            // Show temporary message
            const message = this.add.text(450, 300, `${equipmentName.toUpperCase()} COMING SOON!`, {
                fontFamily: 'VT323',
                fontSize: '32px',
                fill: '#FFD700',
                stroke: '#8B4513',
                strokeThickness: 2,
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);

            // Animate message
            message.setAlpha(0);
            this.tweens.add({
                targets: message,
                alpha: 1,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 300,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Auto-hide after 2 seconds
                    this.time.delayedCall(2000, () => {
                        this.tweens.add({
                            targets: message,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                message.destroy();
                            }
                        });
                    });
                }
            });
        }
    }

    // Optional: Method to return from equipment scenes
    returnFromEquipment() {
        this.cameras.main.fadeIn(500, 139, 69, 19);
        console.log('Returned to kitchen from equipment');
    }

    // Optional: Method to track equipment usage statistics
    trackEquipmentUsage(equipmentName) {
        // Could store usage statistics here for future features
        console.log(`${equipmentName} was used`);
    }
}