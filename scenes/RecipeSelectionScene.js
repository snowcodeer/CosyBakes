class RecipeSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RecipeSelectionScene' });
        this.stars = [];
        this.sparkles = [];
    }

    preload() {
        // Try to load kitchen asset early for better error detection
        this.load.on('loaderror', (file) => {
            console.error('Failed to load asset:', file.src);
            console.log('Make sure the file exists at:', file.src);
        });

        // Try loading kitchen asset
        this.load.image('kitchen', 'assets/scenes/kitchen.png');
        
        // Create pixel art textures programmatically
        this.createTextures();
    }

    createTextures() {
        // Brown gradient background
        const bgGraphics = this.add.graphics();
        bgGraphics.fillGradientStyle(0x8B4513, 0x8B4513, 0xA0522D, 0xA0522D);
        bgGraphics.fillRect(0, 0, 900, 600);
        bgGraphics.generateTexture('background', 900, 600);
        bgGraphics.destroy();

        // Recipe card texture - filled instead of outline
        const cardGraphics = this.add.graphics();
        cardGraphics.fillStyle(0xF5DEB3); // Wheat color fill
        cardGraphics.fillRoundedRect(0, 0, 350, 220, 12);
        // Add a subtle border
        cardGraphics.lineStyle(4, 0xDEB887);
        cardGraphics.strokeRoundedRect(0, 0, 350, 220, 12);
        cardGraphics.generateTexture('recipeCard', 350, 220);
        cardGraphics.destroy();

        // Star texture
        const starGraphics = this.add.graphics();
        starGraphics.fillStyle(0xFFD700);
        starGraphics.beginPath();
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? 8 : 4;
            starPoints.push(Math.cos(angle) * radius + 8);
            starPoints.push(Math.sin(angle) * radius + 8);
        }
        starGraphics.fillPoints(starPoints, true);
        starGraphics.generateTexture('star', 16, 16);
        starGraphics.destroy();

        // Sparkle texture
        const sparkleGraphics = this.add.graphics();
        sparkleGraphics.fillStyle(0xFFFACD);
        sparkleGraphics.fillCircle(3, 3, 3);
        sparkleGraphics.generateTexture('sparkle', 6, 6);
        sparkleGraphics.destroy();
    }

    create() {
        // Background
        this.add.image(450, 300, 'background').setOrigin(0.5);

        // Title
        const title = this.add.text(450, 100, 'COSY BAKES', {
            fontFamily: 'VT323',
            fontSize: '42px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(450, 160, 'Choose Your Recipe', {
            fontFamily: 'VT323',
            fontSize: '20px',
            fill: '#DEB887'
        }).setOrigin(0.5);

        // Brownie recipe card
        const recipeCard = this.add.image(450, 320, 'recipeCard').setOrigin(0.5);
        recipeCard.setInteractive({ useHandCursor: true });

        // Recipe card content
        const brownieTitle = this.add.text(450, 270, 'BROWNIES', {
            fontFamily: 'VT323',
            fontSize: '24px',
            fill: '#8B4513'
        }).setOrigin(0.5);

        const brownieDesc = this.add.text(450, 310, 'Fudgy & Delicious', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#A0522D'
        }).setOrigin(0.5);

        const difficulty = this.add.text(450, 350, 'Difficulty: Easy', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#654321'
        }).setOrigin(0.5);

        const timeText = this.add.text(450, 380, 'Time: 45 minutes', {
            fontFamily: 'VT323',
            fontSize: '14px',
            fill: '#654321'
        }).setOrigin(0.5);

        // Card hover effects
        recipeCard.on('pointerover', () => {
            this.tweens.add({
                targets: [recipeCard, brownieTitle, brownieDesc, difficulty, timeText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Power2'
            });
            
            // Add glow effect
            recipeCard.setTint(0xFFE4B5);
        });

        recipeCard.on('pointerout', () => {
            this.tweens.add({
                targets: [recipeCard, brownieTitle, brownieDesc, difficulty, timeText],
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Power2'
            });
            
            recipeCard.clearTint();
        });

        recipeCard.on('pointerdown', () => {
            // Click animation
            this.tweens.add({
                targets: [recipeCard, brownieTitle, brownieDesc, difficulty, timeText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });

            // Start sparkling effect
            this.createSparkleEffect(450, 320);
            
            // Transition to game
            this.time.delayedCall(500, () => {
                this.startBrownieRecipe();
            });
        });

        // Create twinkling stars
        this.createTwinklingStars();

        // Floating animation for the card
        this.tweens.add({
            targets: recipeCard,
            y: 310,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Pulsing animation for title
        this.tweens.add({
            targets: title,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createTwinklingStars() {
        // Create scattered twinkling stars
        for (let i = 0; i < 18; i++) {
            const x = Phaser.Math.Between(50, 850);
            const y = Phaser.Math.Between(50, 550);
            
            // Avoid placing stars too close to the recipe card
            if (Math.abs(x - 450) < 250 && Math.abs(y - 320) < 150) {
                continue;
            }
            
            const star = this.add.image(x, y, 'star');
            star.setAlpha(0.7);
            this.stars.push(star);
            
            // Random twinkling animation
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: Phaser.Math.Between(1000, 2500),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1000),
                ease: 'Sine.easeInOut'
            });
        }
    }

    createSparkleEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const sparkle = this.add.image(x, y, 'sparkle');
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100;
            
            sparkle.setAlpha(1);
            
            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }
    }

    startBrownieRecipe() {
        // Fade out current scene
        this.cameras.main.fadeOut(500, 139, 69, 19); // Brown fade
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('KitchenScene');
        });
    }

    update() {
        // Gentle floating animation for sparkles in background
        this.sparkles.forEach(sparkle => {
            sparkle.y -= 0.5;
            if (sparkle.y < -10) {
                sparkle.y = 610;
            }
        });
    }
}