class OvenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OvenScene' });
    }

    preload() {
        this.load.image('oven-open', 'assets/equipment/oven-open.png');
        this.load.image('brownies-raw', 'assets/bakes/brownies-raw.png');
        this.load.image('brownies-decorated', 'assets/bakes/brownies-decorated.png');
        this.load.image('kitchen', 'assets/scenes/kitchen.png');
        this.load.image('brownies-fail', 'assets/bakes/brownies-fail.png');

    }

    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Background
        this.add.image(450, 300, 'kitchen').setOrigin(0.5);

        // Oven overlay
        const ovenOverlay = this.add.image(450, 470, 'oven-open').setOrigin(0.5).setDepth(1);

        // Raw brownies drop
        const brownies = this.add.image(450, 100, 'brownies-raw')
            .setOrigin(0.5)
            .setScale(0.18)
            .setDepth(2);

        this.tweens.add({
            targets: brownies,
            y: 450,
            duration: 800,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.tweens.add({
                    targets: brownies,
                    scale: 0.1,
                    alpha: 0,
                    duration: 800,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        brownies.destroy();
                        ovenOverlay.destroy();
                        this.zoomOutCamera(); // Zoom out
                        this.startBakingTimer();
                    }
                });
            }
        });

        // Back button
        const backButton = this.add.text(50, 50, '< BACK', {
            fontFamily: 'VT323',
            fontSize: '28px',
            fill: '#F5DEB3',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            this.scene.start('KitchenScene');
        });
    }

    zoomOutCamera() {
        // Zoom out slightly for dramatic effect
        this.tweens.add({
            targets: this.cameras.main,
            zoom: 0.85,
            duration: 1000,
            ease: 'Sine.easeOut'
        });
    }

    startBakingTimer() {
        const timerText = this.add.text(450, 550, '0:00', {
            fontFamily: 'VT323',
            fontSize: '28px',
            fill: '#FFD700',
            stroke: '#8B4513',
            strokeThickness: 2
        }).setOrigin(0.5);

        let totalSeconds = 0;
        this.time.addEvent({
            delay: 100,        // Every 100ms = 1 fake second
            repeat: 34,        // So it ends at 35 (0–34)
            callback: () => {
                totalSeconds++;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

                if (totalSeconds === 35) {
                    this.showBakedBrownies();
                }
            },
            callbackScope: this
        });
    }

    showBakedBrownies() {
    // Show baked brownies (twice the original size)
    const finished = this.add.image(450, 300, 'brownies-decorated')
        .setOrigin(0.5)
        .setScale(0.1)
        .setAlpha(0)
        .setDepth(2);

    this.tweens.add({
        targets: finished,
        scale: 0.36, // double the old 0.18
        alpha: 1,
        duration: 800,
        ease: 'Back.easeOut'
    });

    // Show success text (big and bold)
    const successText = this.add.text(450, 500, 'Success!', {
        fontFamily: 'VT323',
        fontSize: '64px', // doubled
        fill: '#FFD700',
        stroke: '#8B4513',
        strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(3);

    this.tweens.add({
        targets: successText,
        alpha: 1,
        delay: 300,
        duration: 500
    });

    // Animate sparkles/confetti
    this.createCelebrationParticles();
}


}

window.OvenScene = OvenScene;
