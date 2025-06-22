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

        // Check if kitchen texture exists and add fallback
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
            console.warn('Kitchen texture not found, creating fallback...');
            
            // Create a fallback kitchen background
            this.createFallbackKitchen();
        }

        // Back button
        const backButton = this.add.text(50, 50, '< BACK', {
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
                this.scene.start('RecipeSelectionScene');
            });
        });

        // Placeholder instruction text
        const instruction = this.add.text(450, 600, 'Click around to explore the kitchen!', {
            fontFamily: 'Press Start 2P',
            fontSize: '14px',
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

    createFallbackKitchen() {
        // Create a simple fallback kitchen scene
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xDEB887, 0xDEB887, 0xF5DEB3, 0xF5DEB3);
        bg.fillRect(0, 0, 900, 600);

        // Add some basic kitchen elements as placeholders
        const counter = this.add.graphics();
        counter.fillStyle(0x8B4513);
        counter.fillRect(0, 400, 900, 200);

        const wall = this.add.graphics();
        wall.fillStyle(0xF5DEB3);
        wall.fillRect(0, 0, 900, 400);

        // Add text indicating this is a fallback
        this.add.text(450, 200, 'KITCHEN PLACEHOLDER', {
            fontFamily: 'Press Start 2P',
            fontSize: '20px',
            fill: '#8B4513',
            stroke: '#F5DEB3',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add.text(450, 250, 'kitchen.png not found', {
            fontFamily: 'Press Start 2P',
            fontSize: '14px',
            fill: '#A0522D'
        }).setOrigin(0.5);

        this.add.text(450, 280, 'Check: assets/scenes/kitchen.png', {
            fontFamily: 'Press Start 2P',
            fontSize: '12px',
            fill: '#654321'
        }).setOrigin(0.5);
    }

    createEquipmentHotspots() {
        // Define equipment locations based on the actual kitchen.png layout
        const equipment = [
            { name: 'scale', x: 270, y: 310, width: 80, height: 80 },      // Left counter, bowl-shaped scale
            { name: 'stove', x: 430, y: 350, width: 200, height: 30 },     // Center, top of cream appliance (burners)
            { name: 'oven', x: 430, y: 470, width: 230, height: 190 },      // Center, bottom of cream appliance (oven door)
            { name: 'microwave', x: 630, y: 310, width: 130, height: 100 },  // Right side, brown microwave
            { name: 'mixer', x: 800, y: 310, width: 130, height: 120 }       // Far right, stand mixer
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
                fontFamily: 'Press Start 2P',
                fontSize: '10px',
                fill: '#F5DEB3',
                stroke: '#8B4513',
                strokeThickness: 1
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

                // Transition to countertop scene
                this.time.delayedCall(200, () => {
                    this.transitionToCountertop(item.name);
                });
            });
        });
    }

    transitionToCountertop(equipmentName) {
        console.log(`Clicked on ${equipmentName}, transitioning to countertop...`);
        
        this.cameras.main.fadeOut(500, 139, 69, 19);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('CountertopScene', { selectedEquipment: equipmentName });
        });
    }
}