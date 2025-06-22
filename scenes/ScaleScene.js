/**
 * Scale Scene
 * Handles all scale-specific functionality including weighing ingredients
 */
class ScaleScene extends BaseCountertopScene {
    constructor() {
        super('ScaleScene');
        
        // Scale-specific properties
        this.scaleItems = [];
        this.scaleWeight = 0;
        this.tareOffset = 0;
        this.scaleWeightText = null;
        
        // Bowl on scale functionality
        this.bowlOnScale = null;
        this.bowlContents = [];
        
        // Ingredient adding system
        this.isAddingIngredient = false;
        this.addStartTime = 0;
        this.addingInterval = null;
        this.lastEggAddTime = 0;
        
        // Hint system
        this.bowlNotepadText = null;
        this.notepadContainer = null;
        this.hintButton = null;
    }

    preloadEquipmentAssets() {
        if (!this.textures.exists('scale')) {
            this.load.image('scale', 'assets/equipment/scale.png');
        }
    }

    create() {
        super.create();

        // Add scale weight display
        this.scaleWeightText = this.add.text(450, 365, '0g', {
            fontFamily: 'VT323',
            fontSize: '28px',
            fill: '#000000',
            stroke: '#F5DEB3',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Set up pointer up for ingredient adding
        this.input.on('pointerup', (pointer) => {
            if (this.isAddingIngredient) {
                this.stopAddingIngredient();
            }
        });

        // Create Hint button and notepad
        this.createHintSystem();
    }

    addEquipmentVisuals() {
        if (this.textures.exists('scale')) {
            const scale = this.add.image(450, 360, 'scale');
            scale.setOrigin(0.5);
            scale.setScale(0.25);
            scale.setInteractive({ useHandCursor: true });
            
            scale.on('pointerover', () => scale.setTint(0xF0F0F0));
            scale.on('pointerout', () => scale.clearTint());

            scale.on('pointerdown', () => {
                if (this.carriedSprite && this.carriedIngredient === 'bowl') {
                    if (this.bowlOnScale) {
                        this.showIngredientMessage('Scale already has a bowl!');
                    } else {
                        this.placeBowlOnScale();
                    }
                } else if (this.carriedSprite) {
                    this.showIngredientMessage("Can't tare while holding an item!");
                } else {
                    this.tareScale();
                }
            });
        }
    }

    createHintSystem() {
        this.hintButton = this.add.text(100, 100, 'Show Hint', {
            fontFamily: 'VT323',
            fontSize: '18px',
            fill: '#FFFFFF',
            backgroundColor: '#8B4513',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const notepadBg = this.add.rectangle(100, 280, 160, 300, 0xF5F5DC)
            .setStrokeStyle(2, 0x8B4513)
            .setOrigin(0.5);

        this.bowlNotepadText = this.add.text(100, 300, 'Bowl is empty', {
            fontFamily: 'VT323',
            fontSize: '16px',
            fill: '#000000',
            align: 'left',
            wordWrap: { width: 140 }
        }).setOrigin(0.5);

        this.notepadContainer = this.add.container(0, 0, [notepadBg, this.bowlNotepadText]);
        this.notepadContainer.setVisible(false);

        this.hintButton.on('pointerdown', () => {
            const isVisible = this.notepadContainer.visible;
            this.notepadContainer.setVisible(!isVisible);
            this.hintButton.setText(isVisible ? 'Show Hint' : 'Hide Hint');
        });
    }

    getEquipmentName() {
        return 'scale';
    }

    getEquipmentInstructions() {
        return 'Place bowl on scale to start. Left-click to pick up items, right-click to drop. Click scale to tare.';
    }

    interactWithCarriedItem(pointer) {
        if (!this.carriedSprite || !this.carriedIngredient) return;

        if (this.bowlOnScale) {
            const bowlBounds = this.bowlOnScale.getBounds();
            if (Phaser.Geom.Rectangle.Contains(bowlBounds, pointer.x, pointer.y)) {
                this.startAddingIngredient();
                return;
            }
        }

        if (this.lastMessage === "Can't tare while holding an item!") {
            return;
        }

        this.showIngredientMessage(`Left-clicked with ${this.carriedIngredient} - no function yet!`);
    }

    // ===========================
    // BOWL MANAGEMENT
    // ===========================

    placeBowlOnScale() {
        this.bowlOnScale = this.add.image(450, 230, 'bowl').setInteractive({ useHandCursor: true });
        this.bowlOnScale.setDisplaySize(240, 200);
        this.bowlOnScale.setDepth(10);
        this.bowlContents = [];
        this.addToScale('bowl');

        this.bowlOnScale.on('pointerdown', () => {
            if (!this.carriedSprite) {
                this.removeBowlFromScale();
            } else {
                this.showIngredientMessage("Can't remove bowl while holding an item!");
            }
        });

        this.carriedSprite.destroy();
        this.resetCarriedState();
        this.showIngredientMessage('Bowl placed on scale!');
    }

    removeBowlFromScale() {
        if (!this.bowlOnScale) return;

        this.bowlOnScale.destroy();
        this.bowlOnScale = null;

        this.scaleWeight -= 250;
        this.scaleItems = this.scaleItems.filter(item => item.ingredient !== 'bowl');
        this.bowlContents = [];

        this.updateScaleDisplay();
        this.showIngredientMessage('Returned bowl to inventory.');
        this.addBowlBackToInventory();
        this.updateBowlNotepad();
    }

    // ===========================
    // SCALE OPERATIONS
    // ===========================

    addToScale(ingredient) {
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
        this.updateScaleDisplay();
        this.showIngredientMessage(`Added ${weight}g of ${ingredient} to scale!`);
    }

    updateScaleDisplay() {
        if (this.scaleWeightText) {
            const displayWeight = this.scaleWeight - this.tareOffset;
            this.scaleWeightText.setText(`${displayWeight}g`);
        }
    }

    tareScale() {
        this.tareOffset = this.scaleWeight;
        this.updateScaleDisplay();
        this.showIngredientMessage('Scale tared!');
        console.log(`Tare set at: ${this.tareOffset}g, display now shows: ${this.scaleWeight - this.tareOffset}g`);
    }

    // ===========================
    // INGREDIENT ADDING SYSTEM
    // ===========================

    startAddingIngredient() {
        if (this.isAddingIngredient || !this.carriedIngredient || this.carriedIngredient === 'bowl') {
            return;
        }

        console.log(`Starting to add ${this.carriedIngredient} to bowl`);
        this.isAddingIngredient = true;
        this.addStartTime = this.time.now;
        this.addIngredientToBowl(Phaser.Math.Between(1, 3));

        this.addingInterval = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.isAddingIngredient) return;

                if (this.carriedIngredient === 'egg') {
                    const now = this.time.now;
                    if (now - this.lastEggAddTime >= 1000) {
                        this.addIngredientToBowl();
                        this.lastEggAddTime = now;
                    }
                } else {
                    const holdDuration = this.time.now - this.addStartTime;
                    const baseAmount = Math.min(1 + Math.floor(holdDuration / 500), 10);
                    const randomAmount = Phaser.Math.Between(1, baseAmount);
                    this.addIngredientToBowl(randomAmount);
                }
            },
            loop: true
        });
    }

    stopAddingIngredient() {
        if (!this.isAddingIngredient) return;

        console.log(`Stopped adding ${this.carriedIngredient} to bowl`);
        this.isAddingIngredient = false;

        if (this.addingInterval) {
            this.addingInterval.destroy();
            this.addingInterval = null;
        }

        this.displayBowlContents();
    }

    addIngredientToBowl(amount) {
        if (!this.carriedIngredient || !this.bowlOnScale) return;

        if (this.carriedIngredient === 'egg') {
            const eggWeight = 68;
            this.scaleWeight += eggWeight;
            this.updateScaleDisplay();

            const existingIngredient = this.bowlContents.find(item => item.ingredient === 'egg');
            if (existingIngredient) {
                existingIngredient.amount += eggWeight;
            } else {
                this.bowlContents.push({ ingredient: 'egg', amount: eggWeight });
            }

            this.showIngredientMessage(`+1 egg`);
        } else {
            this.scaleWeight += amount;
            this.updateScaleDisplay();

            const existingIngredient = this.bowlContents.find(item => item.ingredient === this.carriedIngredient);
            if (existingIngredient) {
                existingIngredient.amount += amount;
            } else {
                this.bowlContents.push({ ingredient: this.carriedIngredient, amount: amount });
            }

            this.showIngredientMessage(`+${amount}g ${this.carriedIngredient}`);
        }

        this.updateBowlNotepad();
    }

    // ===========================
    // BOWL CONTENTS TRACKING
    // ===========================

    displayBowlContents() {
        console.log('=== BOWL CONTENTS ===');
        let totalWeight = 0;

        this.bowlContents.forEach(item => {
            if (item.ingredient === 'egg') {
                console.log(`${item.amount} egg${item.amount > 1 ? 's' : ''}`);
                totalWeight += item.amount * 68;
            } else {
                console.log(`${item.ingredient}: ${item.amount}g`);
                totalWeight += item.amount;
            }
        });

        console.log(`Total ingredients: ${totalWeight}g`);
        console.log('====================');
    }

    updateBowlNotepad() {
        if (!this.bowlNotepadText) return;

        if (this.bowlContents.length === 0) {
            this.bowlNotepadText.setText('Bowl is empty');
            return;
        }

        let lines = [];
        this.bowlContents.forEach(item => {
            if (item.ingredient === 'egg') {
                const eggCount = item.amount / 68;
                lines.push(`${eggCount} egg${eggCount > 1 ? 's' : ''}`);
            } else {
                lines.push(`${item.amount}g ${item.ingredient}`);
            }
        });

        this.bowlNotepadText.setText(lines.join('\n'));
    }
}