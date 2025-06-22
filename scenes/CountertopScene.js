class CountertopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CountertopScene' });
        this.selectedEquipment = null;
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
        this.add.text(450, 43, instructions, {
            fontFamily: 'Press Start 2P',
            fontSize: '12px',
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

        console.log(`Countertop scene loaded for ${this.selectedEquipment}`);
    }

    addInventoryBar() {
        if (this.textures.exists('inventory')) {
            console.log('Inventory texture found, displaying...');
            
            // Add the inventory bar at the bottom of the screen
            const inventory = this.add.image(450, 530, 'inventory');
            inventory.setOrigin(0.5);
            
            // Scale the inventory bar to fit the screen width appropriately
            const scaleX = 900 / inventory.width;
            inventory.setScale(scaleX, scaleX);
            
            // Optional: Make inventory interactive for future functionality
            inventory.setInteractive({ useHandCursor: true });
            
            inventory.on('pointerdown', () => {
                console.log('Inventory bar clicked!');
                // Future: Add inventory functionality here
            });
            
        } else {
            console.warn('Inventory texture not found, creating placeholder...');
            // Create a simple placeholder if the asset isn't found
            const placeholder = this.add.rectangle(450, 570, 800, 60, 0x654321);
            placeholder.setStrokeStyle(2, 0x8B4513);
            
            const placeholderText = this.add.text(450, 570, 'INVENTORY', {
                fontFamily: 'Press Start 2P',
                fontSize: '16px',
                fill: '#F5DEB3'
            }).setOrigin(0.5);
        }
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
                // Future: Add weighing functionality here
                console.log('Scale clicked!');
            });
        }
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
            'stove': 'Ready to cook on the stovetop!',
            'oven': 'Perfect for baking brownies!',
            'microwave': 'Click the microwave to open/close the door!',
            'mixer': 'Click the mixer to start mixing ingredients!',
            'scale': 'Click the scale to weigh ingredients precisely!'
        };
        
        return instructions[equipment] || 'Use this equipment for baking!';
    }
}