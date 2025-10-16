class CoinFlipGame {
    constructor() {
        this.canvas = document.getElementById('coinCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
        
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.bank = 0; // Banked currency
        this.multiplier = 1.0;
        this.basePoints = 10;
        
        this.playerChoice = null;
        this.isFlipping = false;
        this.coinSide = 'heads'; // Current coin side
        
        this.coinRotation = 0;
        this.flipAnimation = null;
        
        // New features
        this.streakRecords = [];
        this.achievements = {};
        this.playerTitle = 'NOVICE';
        this.fireMode = false;
        this.coinEffects = [];
        
        // Shop system
        this.equippedItems = [null, null, null]; // 3 equip slots
        this.shopUnlocked = false;
        this.shopAvailable = true; // Shop stays open forever once unlocked
        this.activeEffects = {}; // Track active item effects
        this.shopItems = this.defineShopItems();
        this.shopRotationTimer = null;
        this.shopRotationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.currentShopItems = [];
        this.itemDurability = {}; // Track durability for owned items
        this.lastRotationTime = Date.now();
        this.timerUpdateInterval = null;
        
        // Titles based on best streak
        this.titles = [
            { streak: 0, title: 'NOVICE' },
            { streak: 5, title: 'COIN FLIPPER' },
            { streak: 10, title: 'LUCKY ONE' },
            { streak: 15, title: 'THE LUCKY' },
            { streak: 25, title: 'PROBABILITY BREAKER' },
            { streak: 50, title: 'COIN GOD' },
            { streak: 100, title: 'INFINITY MASTER' }
        ];
        
        // Achievement definitions
        this.achievementDefs = [
            { id: 'first_win', title: 'FIRST WIN', desc: 'Win your first flip', threshold: 1 },
            { id: 'streak_5', title: 'HOT HAND', desc: 'Reach 5 streak', threshold: 5 },
            { id: 'streak_10', title: 'ON FIRE', desc: 'Reach 10 streak', threshold: 10 },
            { id: 'streak_25', title: 'UNSTOPPABLE', desc: 'Reach 25 streak', threshold: 25 },
            { id: 'streak_50', title: 'LEGENDARY', desc: 'Reach 50 streak', threshold: 50 },
            { id: 'bank_100', title: 'BANKER', desc: 'Bank 100 coins', threshold: 100 },
            { id: 'bank_1000', title: 'RICH', desc: 'Bank 1000 coins', threshold: 1000 }
        ];
        
        this.init();
    }
    
    init() {
        // Load from localStorage
        this.bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
        this.bank = parseInt(localStorage.getItem('bank') || '0');
        this.streakRecords = JSON.parse(localStorage.getItem('streakRecords') || '[]');
        this.achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        this.shopUnlocked = localStorage.getItem('shopUnlocked') === 'true';
        
        // Update title based on best streak
        this.updatePlayerTitle();
        this.updateDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Draw initial coin
        this.drawCoin();
        
        // Show initial message
        this.showMessage('CLICK HEADS OR TAILS TO FLIP!');
    }
    
    setupEventListeners() {
        // Choice buttons - clicking immediately flips the coin or triggers battle
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isFlipping) {
                    this.playerChoice = e.target.closest('.choice-btn').dataset.choice;
                    this.highlightChoice(this.playerChoice);
                    
                    // Check for battle trigger
                    if (this.checkForBattle && this.checkForBattle()) {
                        // Battle triggered, don't flip
                        this.showMessage('BATTLE INCOMING!');
                        setTimeout(() => {
                            this.openBattleMode();
                            document.getElementById('floatingBattleBtn').style.display = 'none';
                        }, 1000);
                    } else {
                        // Normal flip
                        this.flipCoin();
                    }
                }
            });
        });
        
        // Coin click (optional - can still click coin if choice is made)
        this.canvas.addEventListener('click', () => {
            if (this.playerChoice && !this.isFlipping) {
                this.flipCoin();
            }
        });
        
        // Bank button
        document.getElementById('bankBtn').addEventListener('click', () => {
            this.bankScore();
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // Hall of Fame button
        document.getElementById('hallBtn').addEventListener('click', () => {
            this.showHallOfFame();
        });
        
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareStreak();
        });
        
        // Shop button - only works when shop is available
        document.getElementById('shopBtn').addEventListener('click', () => {
            if (this.shopAvailable || this.streak === this.lastShopStreak) {
                this.openShop();
            } else if (!this.shopUnlocked) {
                this.showMessage('SHOP UNLOCKS AT 3 STREAK!');
            } else {
                const nextShop = this.getNextShopStreak();
                this.showMessage(`SHOP REOPENS AT STREAK ${nextShop}!`);
            }
        });
        
        // Floating shop button
        document.getElementById('floatingShopBtn').addEventListener('click', () => {
            this.openShop();
            document.getElementById('floatingShopBtn').style.display = 'none';
        });
        
        // Close shop button
        document.getElementById('closeShop').addEventListener('click', () => {
            document.getElementById('shopModal').classList.remove('show');
            document.getElementById('floatingShopBtn').style.display = 'none';
        });
        
        // Close item selection
        document.getElementById('closeItemSelection').addEventListener('click', () => {
            document.getElementById('itemSelectionModal').classList.remove('show');
        });
        
        // Modal close button
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('hallOfFameModal').classList.remove('show');
        });
        
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Inventory slots
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            slot.addEventListener('click', (e) => {
                if (e.target.classList.contains('unequip-btn')) {
                    this.unequipItem(index);
                } else {
                    this.openItemSelection(index);
                }
            });
        });
    }
    
    highlightChoice(choice) {
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-choice="${choice}"]`).classList.add('selected');
    }
    
    flipCoin() {
        if (this.isFlipping) return;
        
        // Check for random event before flip
        if (this.checkForRandomEvent) {
            const eventTriggered = this.checkForRandomEvent();
            if (eventTriggered) {
                console.log('Random event triggered!');
            }
        } else {
            console.log('Random events not initialized yet');
        }
        
        // Process durability loss for equipped items
        this.processDurabilityLoss();
        
        this.isFlipping = true;
        this.canvas.classList.add('flipping', 'disabled');
        document.getElementById('choiceContainer').classList.add('hidden');
        
        // Determine result with item effects and upgrades
        let winChance = 0.5;
        
        // Apply upgrade bonus
        if (this.getUpgradeBonus) {
            winChance += this.getUpgradeBonus('winChance');
        }
        
        // Apply equipped item effects
        this.applyEquippedItemEffects();
        
        // Apply item win chance bonuses
        if (this.activeEffects.winChance) {
            winChance += this.activeEffects.winChance;
        }
        
        // Apply hot hand bonus
        if (this.activeEffects.hotHand && this.checkLastWins(3)) {
            winChance += 0.05;
        }
        
        // Apply cold blooded bonus
        if (this.activeEffects.coldBlooded && this.checkLastLosses(2)) {
            winChance += 0.05;
        }
        
        // Apply jackpot fever
        if (this.activeEffects.jackpotFever && Math.random() < 0.005) {
            winChance = 1; // Guaranteed win for jackpot
        }
        
        let result = Math.random() < winChance ? this.playerChoice : 
                     (this.playerChoice === 'heads' ? 'tails' : 'heads');
        
        const willLose = result !== this.playerChoice;
        const isEpicMoment = this.streak >= 10 && willLose;
        
        // Apply tactical delay
        const hasDelay = this.activeEffects.tacticalDelay > 0;
        
        // Enhanced animation parameters (slow motion for epic fails)
        let frame = 0;
        const totalFrames = isEpicMoment ? 120 : 60; // Double frames for epic fail
        const flipSpeed = isEpicMoment ? 25 : 20; // Slower for epic fail
        
        // Add some vertical movement for more dynamic feel
        let baseY = 0;
        let velocity = -8; // Initial upward velocity
        const gravity = 0.4;
        
        this.flipAnimation = setInterval(() => {
            frame++;
            
            // Easing function for more natural rotation
            const progress = frame / totalFrames;
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Calculate rotation with easing
            const totalRotation = Math.PI * 8; // 4 full rotations
            this.coinRotation = easedProgress * totalRotation;
            
            // Add vertical bounce
            if (frame < totalFrames * 0.7) {
                velocity += gravity;
                baseY += velocity;
                if (baseY > 0) {
                    baseY = 0;
                    velocity *= -0.5; // Bounce with dampening
                }
            } else {
                baseY = 0; // Settle down
            }
            
            // Update coin side based on rotation
            const rotationCount = Math.floor(this.coinRotation / Math.PI);
            this.coinSide = (rotationCount % 2 === 0) ? 
                (result === 'heads' ? 'heads' : 'tails') : 
                (result === 'heads' ? 'tails' : 'heads');
            
            // Ensure we end on the correct side
            if (frame >= totalFrames - 5) {
                this.coinSide = result;
            }
            
            // Save and restore for vertical movement
            const canvas = this.canvas;
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(0, baseY);
            
            this.drawCoin(true);
            
            ctx.restore();
            
            if (frame >= totalFrames) {
                clearInterval(this.flipAnimation);
                this.coinSide = result;
                this.coinRotation = 0;
                this.drawCoin();
                this.handleResult(result);
            }
        }, flipSpeed);
    }
    
    handleResult(result) {
        const won = result === this.playerChoice;
        
        // Process active event if any
        if (this.currentEvent && this.currentEvent.execute) {
            if (this.currentEvent.type !== 'skill' && this.currentEvent.type !== 'encounter') {
                this.currentEvent.execute(won);
            }
        }
        
        if (won) {
            this.streak++;
            
            // Apply durability loss to equipped items
            this.applyDurabilityLoss();
            
            // Apply restoration circuit upgrade
            this.applyRestorationCircuit();
            
            // Apply restoration circuit upgrade
            if (this.getUpgradeBonus) {
                const restorationChance = this.getUpgradeBonus('restorationCircuit');
                if (Math.random() < restorationChance) {
                    this.restoreItemDurability();
                }
            }
            
            // Apply greed gauge
            let multiplierGrowth = 0.1;
            if (this.activeEffects.greedGauge > 0) {
                multiplierGrowth = 0.2;
                this.activeEffects.greedGauge--;
            }
            
            // Apply greed engine
            if (this.activeEffects.greedEngine) {
                multiplierGrowth = 0.15;
            }
            
            // Apply double streak
            if (this.activeEffects.doubleStreak) {
                multiplierGrowth *= 2;
            }
            
            // Apply coin of paradox
            if (this.activeEffects.coinParadox) {
                multiplierGrowth += 0.05;
            }
            
            // Apply freeze multiplier
            if (this.activeEffects.freezeMultiplier && this.activeEffects.freezeMultiplier.flips > 0) {
                this.multiplier = this.activeEffects.freezeMultiplier.value;
                this.activeEffects.freezeMultiplier.flips--;
                if (this.activeEffects.freezeMultiplier.flips <= 0) {
                    delete this.activeEffects.freezeMultiplier;
                }
            } else {
                this.multiplier = 1.0 + (this.streak * multiplierGrowth);
            }
            
            const points = Math.round(this.basePoints * this.multiplier);
            this.score += points;
            
            // Apply doubletap core (bonus every 5th win)
            if (this.activeEffects.doubletapCore && this.streak % 5 === 0) {
                this.score += points;
                this.showMessage('DOUBLETAP CORE! BONUS WIN!');
            }
            
            // Use up tactical delay if active
            if (this.activeEffects.tacticalDelay > 0) {
                this.activeEffects.tacticalDelay--;
            }
            
            // Use up prediction buff
            if (this.activeEffects.predictionBuff > 0 && !this.activeEffects.luckyCharm) {
                this.activeEffects.predictionBuff = Math.max(0, this.activeEffects.predictionBuff - 0.05);
            }
            
            // Check for streak milestones and announcements
            this.checkStreakMilestones();
            
            // Update best streak and title
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak;
                localStorage.setItem('bestStreak', this.bestStreak);
                this.updatePlayerTitle();
            }
            
            // Check achievements
            this.checkAchievements();
            
            // Update coin effects based on streak
            this.updateCoinEffects();
            
            this.showResult('WIN!', true);
            this.showMessage(`CORRECT! +${points} POINTS`);
            
            // Add visual effects
            this.celebrateWin();
        } else {
            // Show what was lost
            const lostScore = this.score;
            const lostStreak = this.streak;
            
            // Check streak saver upgrade
            if (this.getUpgradeBonus && Math.random() < this.getUpgradeBonus('streakSaver')) {
                this.showMessage('STREAK SAVED BY UPGRADE!');
                return; // Don't lose!
            }
            
            // Apply streak saver
            if (this.activeEffects.streakSaver && Math.random() < 0.15) {
                this.showMessage('STREAK SAVER! STREAK PRESERVED!');
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Apply coin of paradox streak save
            if (this.activeEffects.coinParadox && Math.random() < 0.05) {
                this.showMessage('COIN OF PARADOX! STREAK SAVED!');
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Apply second chance
            if (this.activeEffects.secondChance) {
                this.streak = Math.floor(this.streak / 2);
                this.score = Math.floor(this.score / 2);
                this.multiplier = 1.0 + (this.streak * 0.1);
                this.activeEffects.secondChance = false;
                this.showMessage(`SECOND CHANCE! STREAK NOW ${this.streak}`);
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Apply insurance
            if (this.activeEffects.insurance && lostScore > 0) {
                const recovered = Math.floor(lostScore * 0.25);
                this.bank += recovered;
                localStorage.setItem('bank', this.bank);
                this.activeEffects.insurance = false;
                this.showMessage(`INSURANCE! RECOVERED ${recovered} COINS TO BANK!`);
            }
            
            // Apply insurance module
            if (this.activeEffects.insuranceModule && lostScore > 0 && !this.insuranceModuleUsed) {
                const recovered = Math.floor(lostScore * 0.25);
                this.bank += recovered;
                localStorage.setItem('bank', this.bank);
                this.insuranceModuleUsed = true;
                this.showMessage(`INSURANCE MODULE! RECOVERED ${recovered} COINS TO BANK!`);
            }
            
            // Check for epic fail
            if (lostStreak >= 10) {
                this.triggerEpicFail(lostStreak, lostScore);
            } else {
                // Normal fail
                this.showResult('LOSE!', false);
                if (lostScore > 0) {
                    this.showMessage(`WRONG! LOST ${lostScore} POINTS & ${lostStreak} STREAK`);
                } else {
                    this.showMessage(`WRONG! THE COIN WAS ${result.toUpperCase()}`);
                }
                this.showLoss();
            }
            
            // Save streak record if it was significant
            if (lostStreak >= 3) {
                this.saveStreakRecord(lostStreak, lostScore);
            }
            
            // Disable fire mode
            this.disableFireMode();
            this.updateCoinEffects();
            
            // Check multiplier guard upgrade
            const keepMultiplier = this.getUpgradeBonus && Math.random() < this.getUpgradeBonus('multiplierGuard');
            
            // Reset score, streak, and multiplier on loss
            this.score = 0;
            this.streak = 0;
            
            if (keepMultiplier) {
                this.showMessage('MULTIPLIER PROTECTED!');
                // Keep current multiplier
            } else {
                this.multiplier = 1.0;
            }
            
            // Clear some active effects
            delete this.activeEffects.freezeMultiplier;
        }
        
        this.updateDisplay();
        
        // Reset for next round
        setTimeout(() => {
            this.isFlipping = false;
            this.playerChoice = null;
            this.canvas.classList.remove('flipping', 'disabled');
            document.getElementById('choiceContainer').classList.remove('hidden');
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Clean up event effects if any
            if (this.cleanupEventEffects) {
                this.cleanupEventEffects();
            }
            
            this.showMessage('CLICK HEADS OR TAILS TO FLIP!');
        }, 2000);
    }
    
    drawCoin(isFlipping = false) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radiusX = 80;
        const radiusY = 60; // Base elliptical shape for perspective
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw special effects based on streak
        if (this.streak >= 5) {
            this.drawStreakEffects(ctx, centerX, centerY, radiusX);
        }
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Isometric angle adjustment (slight tilt)
        const perspectiveTilt = 0.7; // Makes coin appear tilted
        
        let scaleY = perspectiveTilt;
        let thickness = 15; // Coin thickness for 3D effect
        
        if (isFlipping) {
            // Enhanced 3D flip effect with rotation
            const rotation = this.coinRotation;
            scaleY = perspectiveTilt * Math.cos(rotation);
            thickness = 15 * Math.abs(Math.sin(rotation * 0.5)) + 5;
        }
        
        // Draw coin edge/thickness (3D effect)
        if (Math.abs(scaleY) < perspectiveTilt * 0.98) {
            // Draw the edge of the coin
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(-radiusX, -thickness/2, radiusX * 2, thickness);
            
            // Add edge highlights
            ctx.fillStyle = '#D4AF37';
            ctx.fillRect(-radiusX, -thickness/2, radiusX * 2, 2);
            ctx.fillRect(-radiusX, thickness/2 - 2, radiusX * 2, 2);
            
            // Add ridges on the edge
            for (let i = -radiusX; i < radiusX; i += 8) {
                ctx.strokeStyle = '#8B6914';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(i, -thickness/2);
                ctx.lineTo(i, thickness/2);
                ctx.stroke();
            }
        }
        
        // Draw main coin face
        ctx.scale(1, Math.abs(scaleY));
        
        // Gradient changes based on streak level
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
        
        if (this.streak >= 25) {
            // Rainbow/Legendary coin
            gradient.addColorStop(0, '#FF00FF');
            gradient.addColorStop(0.2, '#FF0080');
            gradient.addColorStop(0.4, '#FF8000');
            gradient.addColorStop(0.6, '#FFFF00');
            gradient.addColorStop(0.8, '#00FF00');
            gradient.addColorStop(1, '#00FFFF');
        } else if (this.streak >= 15) {
            // Electric blue coin
            gradient.addColorStop(0, '#00FFFF');
            gradient.addColorStop(0.5, '#0080FF');
            gradient.addColorStop(0.8, '#0040FF');
            gradient.addColorStop(1, '#000080');
        } else if (this.streak >= 10) {
            // Fire coin
            gradient.addColorStop(0, '#FFFF00');
            gradient.addColorStop(0.3, '#FF8800');
            gradient.addColorStop(0.6, '#FF4400');
            gradient.addColorStop(1, '#FF0000');
        } else if (this.streak >= 5) {
            // Enhanced gold
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.3, '#FFEB3B');
            gradient.addColorStop(0.6, '#FFD700');
            gradient.addColorStop(1, '#FF8800');
        } else {
            // Normal gold
            gradient.addColorStop(0, '#FFEB3B');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(0.8, '#FFC700');
            gradient.addColorStop(1, '#B8860B');
        }
        
        // Draw coin background with ellipse for perspective
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusX, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner circle with perspective
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX - 10, radiusX - 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Only show face details when coin is mostly facing us
        if (scaleY > 0.2) {
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Adjust text position for perspective
            const yOffset = -10 / Math.abs(scaleY);
            
            if (this.coinSide === 'heads') {
                ctx.fillText('H', 0, yOffset);
                this.drawPixelCrown(ctx, 0, 15 / Math.abs(scaleY));
            } else {
                ctx.fillText('T', 0, yOffset);
                this.drawPixelTail(ctx, 0, 15 / Math.abs(scaleY));
            }
        } else if (scaleY < -0.2) {
            // Show opposite side when flipped
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const yOffset = -10 / Math.abs(scaleY);
            
            // Show opposite side
            if (this.coinSide === 'tails') {
                ctx.fillText('H', 0, yOffset);
                this.drawPixelCrown(ctx, 0, 15 / Math.abs(scaleY));
            } else {
                ctx.fillText('T', 0, yOffset);
                this.drawPixelTail(ctx, 0, 15 / Math.abs(scaleY));
            }
        }
        
        ctx.restore();
        
        // Draw shadow that changes with rotation
        if (isFlipping) {
            const shadowScale = 1 - Math.abs(scaleY) * 0.3;
            const shadowOpacity = 0.3 + Math.abs(scaleY) * 0.2;
            ctx.save();
            ctx.translate(centerX, centerY + 90);
            ctx.scale(shadowScale, 0.2);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX * 0.8, radiusX * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawPixelCrown(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        const pixelSize = 4;
        
        // Crown pattern (simplified pixel art)
        const crown = [
            [0,1,0,1,0],
            [1,1,1,1,1],
            [1,1,1,1,1]
        ];
        
        crown.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
                if (pixel) {
                    ctx.fillRect(
                        x + (colIndex - 2) * pixelSize,
                        y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    drawPixelTail(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        const pixelSize = 4;
        
        // Tail pattern (simplified pixel art)
        const tail = [
            [0,1,1,0,0],
            [1,1,1,1,0],
            [0,0,1,1,1]
        ];
        
        tail.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
                if (pixel) {
                    ctx.fillRect(
                        x + (colIndex - 2) * pixelSize,
                        y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    showResult(text, isWin) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultText = document.getElementById('resultText');
        
        resultText.textContent = text;
        resultDisplay.className = 'result-display show';
        resultDisplay.classList.add(isWin ? 'win' : 'lose');
        
        setTimeout(() => {
            resultDisplay.classList.remove('show');
        }, 1500);
    }
    
    celebrateWin() {
        // Add a pulse effect to score
        const scoreElement = document.getElementById('score');
        scoreElement.style.animation = 'none';
        setTimeout(() => {
            scoreElement.style.animation = 'pulse 0.5s';
        }, 10);
        
        // Flash the canvas border
        this.canvas.style.filter = 'drop-shadow(0 0 30px #4ecdc4)';
        setTimeout(() => {
            this.canvas.style.filter = 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))';
        }, 500);
    }
    
    showLoss() {
        // Shake effect
        this.canvas.style.animation = 'shake 0.5s';
        setTimeout(() => {
            this.canvas.style.animation = '';
        }, 500);
        
        // Flash red
        this.canvas.style.filter = 'drop-shadow(0 0 30px #ff6b6b)';
        setTimeout(() => {
            this.canvas.style.filter = 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))';
        }, 500);
    }
    
    showMessage(text) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.style.animation = 'none';
        setTimeout(() => {
            messageEl.style.animation = 'fadeIn 0.5s';
        }, 10);
    }
    
    bankScore() {
        if (this.score > 0 && !this.isFlipping) {
            const bankBtn = document.getElementById('bankBtn');
            bankBtn.classList.add('banking');
            
            // Add score to bank with potential boost
            let bankedAmount = this.score;
            const bankedStreak = this.streak;
            
            // Apply bank boost
            if (this.activeEffects.bankBoost) {
                bankedAmount = Math.floor(bankedAmount * this.activeEffects.bankBoost);
                this.activeEffects.bankBoost = null;
                this.showMessage(`BANK BOOST! +20% BONUS!`);
            }
            
            // Apply bank buffer
            if (this.activeEffects.bankBuffer) {
                const bankBufferTier = Math.min(this.activeEffects.bankBuffer, 2);
                const bankBufferValues = [0.15, 0.30];
                const bonus = bankBufferValues[bankBufferTier - 1];
                bankedAmount = Math.floor(bankedAmount * (1 + bonus));
                this.showMessage(`BANK BUFFER! +${Math.round(bonus * 100)}% BONUS!`);
            }
            
            this.bank += bankedAmount;
            localStorage.setItem('bank', this.bank);
            
            // Check for epic bank celebration
            if (bankedStreak >= 10) {
                this.triggerEpicBankCelebration(bankedStreak, bankedAmount);
            } else {
                // Normal banking
                this.showMessage(`BANKED ${bankedAmount} COINS! SAFE FROM LOSS`);
                this.celebrateBank();
            }
            
            // Save streak record if significant
            if (bankedStreak >= 3) {
                this.saveStreakRecord(bankedStreak, bankedAmount);
            }
            
            // Reset current score and streak
            this.score = 0;
            this.streak = 0;
            this.multiplier = 1.0;
            
            // Disable fire mode if active
            this.disableFireMode();
            this.updateCoinEffects();
            
            // Update display
            this.updateDisplay();
            
            setTimeout(() => {
                bankBtn.classList.remove('banking');
            }, 600);
        }
    }
    
    celebrateBank() {
        const bankDisplay = document.querySelector('.bank-display');
        bankDisplay.style.animation = 'pulse 0.5s';
        setTimeout(() => {
            bankDisplay.style.animation = '';
        }, 500);
        
        // Flash gold color
        const bankValue = document.getElementById('bank');
        bankValue.style.color = '#ffd700';
        bankValue.style.textShadow = '0 0 20px #ffd700';
        setTimeout(() => {
            bankValue.style.color = '#4ecdc4';
            bankValue.style.textShadow = '0 0 10px #4ecdc4';
        }, 500);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('multiplier').textContent = `x${this.multiplier.toFixed(1)}`;
        document.getElementById('best-streak').textContent = this.bestStreak;
        document.getElementById('bank').textContent = this.bank;
        
        // Update bank button
        const bankBtn = document.getElementById('bankBtn');
        const bankAmount = document.getElementById('bankAmount');
        bankAmount.textContent = `(${this.score})`;
        
        if (this.score > 0) {
            bankBtn.disabled = false;
        } else {
            bankBtn.disabled = true;
        }
    }
    
    resetGame() {
        this.score = 0;
        this.streak = 0;
        this.multiplier = 1.0;
        this.playerChoice = null;
        this.isFlipping = false;
        this.coinSide = 'heads';
        // Note: Bank is NOT reset - it's permanent currency
        
        this.disableFireMode();
        this.updateCoinEffects();
        this.updateDisplay();
        this.drawCoin();
        this.showMessage('GAME RESET! BANK IS SAFE');
        
        // Reset UI state
        document.getElementById('choiceContainer').classList.remove('hidden');
        this.canvas.classList.remove('disabled', 'flipping');
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    // New methods for enhanced features
    checkStreakMilestones() {
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
        if (milestones.includes(this.streak)) {
            this.showStreakAnnouncement();
        }
        
        // Shop unlocks at streak 3 and stays open forever
        if (this.streak === 3 && !this.shopUnlocked) {
            this.shopUnlocked = true;
            this.shopAvailable = true;
            localStorage.setItem('shopUnlocked', 'true');
            this.showShopUnlock();
            // Start item rotation timer
            this.startShopRotation();
            // Open shop automatically on first unlock
            setTimeout(() => {
                this.openShop();
            }, 2000);
        }
        
        // Enable fire mode at streak 10
        if (this.streak === 10) {
            this.enableFireMode();
        }
    }
    
    showStreakAnnouncement() {
        const announcement = document.getElementById('streakAnnouncement');
        const text = document.getElementById('announcementText');
        
        let message = `${this.streak} STREAK!`;
        if (this.streak >= 50) {
            message = `LEGENDARY ${this.streak}!`;
        } else if (this.streak >= 25) {
            message = `UNSTOPPABLE ${this.streak}!`;
        } else if (this.streak >= 10) {
            message = `ON FIRE! ${this.streak}!`;
        }
        
        text.textContent = message;
        announcement.classList.add('show');
        
        setTimeout(() => {
            announcement.classList.remove('show');
        }, 2000);
    }
    
    enableFireMode() {
        this.fireMode = true;
        document.getElementById('fireModeOverlay').classList.add('active');
        document.getElementById('gameContainer').classList.add('fire-mode');
    }
    
    disableFireMode() {
        this.fireMode = false;
        document.getElementById('fireModeOverlay').classList.remove('active');
        document.getElementById('gameContainer').classList.remove('fire-mode');
    }
    
    updateCoinEffects() {
        const canvas = this.canvas;
        canvas.className = '';
        
        if (this.streak >= 15) {
            canvas.classList.add('coin-glow-3');
        } else if (this.streak >= 10) {
            canvas.classList.add('coin-glow-2');
        } else if (this.streak >= 5) {
            canvas.classList.add('coin-glow-1');
        }
    }
    
    drawStreakEffects(ctx, centerX, centerY, radius) {
        const time = Date.now() / 100;
        
        if (this.streak >= 25) {
            // Lightning effects
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const angle = (time + i * 120) * Math.PI / 180;
                ctx.beginPath();
                const x1 = centerX + Math.cos(angle) * (radius + 20);
                const y1 = centerY + Math.sin(angle) * (radius + 20);
                const x2 = centerX + Math.cos(angle) * (radius + 40);
                const y2 = centerY + Math.sin(angle) * (radius + 40);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else if (this.streak >= 15) {
            // Electric sparks
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (time * 2 + i * 45) * Math.PI / 180;
                ctx.beginPath();
                ctx.arc(
                    centerX + Math.cos(angle) * (radius + 10),
                    centerY + Math.sin(angle) * (radius + 10),
                    3, 0, Math.PI * 2
                );
                ctx.stroke();
            }
        } else if (this.streak >= 10) {
            // Fire particles
            ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
            for (let i = 0; i < 5; i++) {
                const angle = (time * 3 + i * 72) * Math.PI / 180;
                const dist = radius + 15 + Math.sin(time / 10 + i) * 10;
                ctx.beginPath();
                ctx.arc(
                    centerX + Math.cos(angle) * dist,
                    centerY + Math.sin(angle) * dist,
                    4, 0, Math.PI * 2
                );
                ctx.fill();
            }
        } else if (this.streak >= 5) {
            // Glowing orbs
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            for (let i = 0; i < 3; i++) {
                const angle = (time + i * 120) * Math.PI / 180;
                ctx.beginPath();
                ctx.arc(
                    centerX + Math.cos(angle) * (radius + 10),
                    centerY + Math.sin(angle) * (radius + 10),
                    5, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    updatePlayerTitle() {
        let newTitle = 'NOVICE';
        for (let i = this.titles.length - 1; i >= 0; i--) {
            if (this.bestStreak >= this.titles[i].streak) {
                newTitle = this.titles[i].title;
                break;
            }
        }
        
        this.playerTitle = newTitle;
        const titleElement = document.getElementById('playerTitle');
        titleElement.textContent = newTitle;
        
        // Add special class for legendary titles
        if (this.bestStreak >= 50) {
            titleElement.classList.add('legendary');
        } else {
            titleElement.classList.remove('legendary');
        }
    }
    
    checkAchievements() {
        this.achievementDefs.forEach(achievement => {
            if (!this.achievements[achievement.id]) {
                let unlocked = false;
                
                if (achievement.id.startsWith('streak_')) {
                    unlocked = this.streak >= achievement.threshold;
                } else if (achievement.id.startsWith('bank_')) {
                    unlocked = this.bank >= achievement.threshold;
                } else if (achievement.id === 'first_win') {
                    unlocked = this.streak >= 1;
                }
                
                if (unlocked) {
                    this.achievements[achievement.id] = true;
                    localStorage.setItem('achievements', JSON.stringify(this.achievements));
                    this.showAchievementUnlock(achievement.title);
                }
            }
        });
    }
    
    showAchievementUnlock(title) {
        const announcement = document.getElementById('streakAnnouncement');
        const text = document.getElementById('announcementText');
        
        text.textContent = `ACHIEVEMENT: ${title}!`;
        announcement.classList.add('show');
        
        setTimeout(() => {
            announcement.classList.remove('show');
        }, 3000);
    }
    
    saveStreakRecord(streak, score) {
        const record = {
            streak: streak,
            score: score,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.streakRecords.push(record);
        // Keep only top 10 records
        this.streakRecords.sort((a, b) => b.streak - a.streak);
        this.streakRecords = this.streakRecords.slice(0, 10);
        
        localStorage.setItem('streakRecords', JSON.stringify(this.streakRecords));
    }
    
    showHallOfFame() {
        const modal = document.getElementById('hallOfFameModal');
        modal.classList.add('show');
        this.loadRecords();
        this.loadAchievements();
    }
    
    loadRecords() {
        const recordsDiv = document.getElementById('streakRecords');
        
        if (this.streakRecords.length === 0) {
            recordsDiv.innerHTML = '<p style="color: #888; text-align: center;">NO RECORDS YET</p>';
            return;
        }
        
        recordsDiv.innerHTML = this.streakRecords.map((record, index) => {
            const date = new Date(record.date).toLocaleDateString();
            return `
                <div class="record-item">
                    <div>
                        <span class="record-streak">#${index + 1} - ${record.streak} STREAK</span>
                        <div class="record-date">${date}</div>
                    </div>
                    <span class="record-score">${record.score} PTS</span>
                </div>
            `;
        }).join('');
    }
    
    loadAchievements() {
        const achievementsDiv = document.getElementById('achievements');
        
        achievementsDiv.innerHTML = this.achievementDefs.map(achievement => {
            const unlocked = this.achievements[achievement.id] || false;
            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : ''}">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            `;
        }).join('');
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (tab === 'records') {
            document.getElementById('recordsTab').classList.add('active');
        } else {
            document.getElementById('achievementsTab').classList.add('active');
        }
    }
    
    shareStreak() {
        const shareData = {
            title: `${this.playerTitle}`,
            streak: this.streak,
            bestStreak: this.bestStreak,
            bank: this.bank,
            achievements: Object.keys(this.achievements).length,
            totalAchievements: this.achievementDefs.length
        };
        
        const message = `🎮 COIN FLIP STREAK
${shareData.title}
Current Streak: ${shareData.streak}
Best Streak: ${shareData.bestStreak}
Banked: ${shareData.bank} coins
Achievements: ${shareData.achievements}/${shareData.totalAchievements}

Play at: ${window.location.href}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Coin Flip Streak',
                text: message
            }).catch(err => {
                // Fallback to copy to clipboard
                this.copyToClipboard(message);
            });
        } else {
            this.copyToClipboard(message);
        }
    }
    
    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        this.showMessage('STATS COPIED TO CLIPBOARD!');
    }
    
    // Epic celebration and fail methods
    triggerEpicBankCelebration(streak, amount) {
        // Play celebration sound
        try {
            document.getElementById('celebrationSound').play();
        } catch(e) {}
        
        // Show celebration overlay
        const overlay = document.getElementById('celebrationOverlay');
        const text = document.getElementById('celebrationText');
        
        let message = `BANKED ${streak} STREAK!`;
        if (streak >= 50) {
            message = `LEGENDARY BANK! ${amount} COINS!`;
        } else if (streak >= 25) {
            message = `MASSIVE BANK! ${amount} COINS!`;
        } else {
            message = `BIG BANK! ${amount} COINS!`;
        }
        
        text.textContent = message;
        overlay.classList.add('active');
        
        // Trigger fireworks
        this.launchFireworks();
        
        // Add crowd wave effect
        const wave = document.createElement('div');
        wave.className = 'crowd-wave';
        document.body.appendChild(wave);
        
        // Screen flash effect
        document.getElementById('gameContainer').style.animation = 'celebrationFlash 0.5s';
        
        setTimeout(() => {
            overlay.classList.remove('active');
            wave.remove();
            document.getElementById('gameContainer').style.animation = '';
        }, 3000);
    }
    
    triggerEpicFail(streak, score) {
        // Play fail sound
        try {
            document.getElementById('failSound').play();
        } catch(e) {}
        
        // Show epic fail overlay
        const overlay = document.getElementById('epicFailOverlay');
        const failStreak = document.getElementById('failStreak');
        const failMessage = document.getElementById('failMessage');
        
        failStreak.textContent = `STREAK ${streak}`;
        
        let message = 'SO CLOSE...';
        if (streak >= 50) {
            message = 'LEGENDARY LOSS';
        } else if (streak >= 30) {
            message = 'DEVASTATING';
        } else if (streak >= 20) {
            message = 'HEARTBREAKING';
        }
        failMessage.textContent = message;
        
        overlay.classList.add('active');
        
        // Add screen shake
        document.getElementById('gameContainer').classList.add('epic-fail-shake');
        
        // Dramatic pause before showing result
        setTimeout(() => {
            this.showResult('RIP!', false);
        }, 1000);
        
        setTimeout(() => {
            overlay.classList.remove('active');
            document.getElementById('gameContainer').classList.remove('epic-fail-shake');
        }, 3000);
    }
    
    launchFireworks() {
        const canvas = document.getElementById('fireworksCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const fireworks = [];
        const particles = [];
        
        // Create firework class
        class Firework {
            constructor(x, y) {
                this.x = x;
                this.y = canvas.height;
                this.targetY = y;
                this.speed = 10;
                this.exploded = false;
            }
            
            update() {
                if (!this.exploded) {
                    this.y -= this.speed;
                    if (this.y <= this.targetY) {
                        this.explode();
                        this.exploded = true;
                    }
                }
            }
            
            explode() {
                const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFEB3B', '#FF00FF'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 / 30) * i;
                    const velocity = 2 + Math.random() * 3;
                    particles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * velocity,
                        vy: Math.sin(angle) * velocity,
                        color: color,
                        size: 3 + Math.random() * 3,
                        life: 1
                    });
                }
            }
            
            draw() {
                if (!this.exploded) {
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
                }
            }
        }
        
        // Launch multiple fireworks
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = Math.random() * canvas.width;
                const y = 100 + Math.random() * 200;
                fireworks.push(new Firework(x, y));
            }, i * 200);
        }
        
        // Animation loop
        let animationId;
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw fireworks
            for (let i = fireworks.length - 1; i >= 0; i--) {
                fireworks[i].update();
                fireworks[i].draw();
                if (fireworks[i].exploded) {
                    fireworks.splice(i, 1);
                }
            }
            
            // Update and draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= 0.02;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
                    ctx.globalAlpha = 1;
                }
            }
            
            if (fireworks.length > 0 || particles.length > 0) {
                animationId = requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        
        animate();
    }
    
    // Shop System Methods
    defineShopItems() {
        return [
            {
                id: 'lucky_charm',
                name: 'Lucky Charm',
                icon: '🍀',
                description: '+2% win chance',
                effect: 'Consistency boost',
                price: 500,
                rarity: 'common',
                category: 'Basic',
                type: 'equip',
                durabilityLossChance: 0.01,
                values: { win_chance: 0.02 }
            },
            {
                id: 'streak_booster',
                name: 'Streak Booster',
                icon: '📈',
                description: '+0.05 multiplier gain per correct flip',
                effect: 'Core streak build item',
                price: 800,
                rarity: 'common',
                category: 'Basic',
                type: 'equip',
                durabilityLossChance: 0.01,
                values: { multiplier_gain: 0.05 }
            },
            {
                id: 'coin_saver',
                name: 'Coin Saver',
                icon: '🛡️',
                description: '25% chance to not lose streak on fail',
                effect: 'Defensive item',
                price: 1200,
                rarity: 'rare',
                category: 'Defense',
                type: 'equip',
                durabilityLossChance: 0.02,
                values: { save_chance: 0.25 }
            },
            {
                id: 'mirror_coin',
                name: 'Mirror Coin',
                icon: '🪞',
                description: '10% chance to copy previous flip result',
                effect: 'Great for pattern play',
                price: 1500,
                rarity: 'rare',
                category: 'Strategy',
                type: 'equip',
                durabilityLossChance: 0.02,
                values: { copy_chance: 0.10 }
            },
            {
                id: 'double_down',
                name: 'Double Down',
                icon: '💎',
                description: 'After 5 correct flips, next flip reward x2',
                effect: 'Mid-run risk–reward',
                price: 2500,
                rarity: 'epic',
                category: 'Risk',
                type: 'equip',
                durabilityLossChance: 0.03,
                values: { trigger_flips: 5, reward_multiplier: 2 }
            },
            {
                id: 'bank_magnet',
                name: 'Bank Magnet',
                icon: '💰',
                description: '+10% bank value when cashing out',
                effect: 'Economic playstyle',
                price: 1000,
                rarity: 'common',
                category: 'Economy',
                type: 'equip',
                durabilityLossChance: 0.01,
                values: { bank_bonus: 0.10 }
            },
            {
                id: 'hot_hand',
                name: 'Hot Hand',
                icon: '🔥',
                description: '+5% win chance if last 3 flips were wins',
                effect: 'Builds momentum',
                price: 1200,
                rarity: 'rare',
                category: 'Momentum',
                type: 'equip',
                durabilityLossChance: 0.02,
                values: { win_chance: 0.05, required_wins: 3 }
            },
            {
                id: 'cold_blooded',
                name: 'Cold Blooded',
                icon: '❄️',
                description: '+5% win chance if last 2 flips were losses',
                effect: 'Recovery-oriented build',
                price: 1200,
                rarity: 'rare',
                category: 'Recovery',
                type: 'equip',
                durabilityLossChance: 0.02,
                values: { win_chance: 0.05, required_losses: 2 }
            },
            {
                id: 'risk_taker',
                name: 'Risk Taker',
                icon: '🎲',
                description: 'Each consecutive win gives +0.15 multiplier, lose resets multiplier',
                effect: 'High-risk scaling item',
                price: 3000,
                rarity: 'epic',
                category: 'Scaling',
                type: 'equip',
                durabilityLossChance: 0.03,
                values: { multiplier_per_win: 0.15 }
            },
            {
                id: 'coin_splitter',
                name: 'Coin Splitter',
                icon: '⚡',
                description: '5% chance for coin to double flip (two chances per guess)',
                effect: 'RNG amplifier',
                price: 3500,
                rarity: 'epic',
                category: 'RNG',
                type: 'equip',
                durabilityLossChance: 0.03,
                values: { double_flip_chance: 0.05 }
            },
            {
                id: 'multiplier_bond',
                name: 'Multiplier Bond',
                icon: '🔗',
                description: 'Every 10 streaks adds +1 permanent multiplier until game over',
                effect: 'Strong late-game scaling',
                price: 6000,
                rarity: 'legendary',
                category: 'Legendary',
                type: 'equip',
                durabilityLossChance: 0.04,
                values: { trigger_streaks: 10, multiplier_bonus: 1 }
            },
            {
                id: 'jackpot_fever',
                name: 'Jackpot Fever',
                icon: '🎰',
                description: '0.5% chance per flip to win 50× coins',
                effect: 'Rare event item',
                price: 10000,
                rarity: 'legendary',
                category: 'Legendary',
                type: 'equip',
                durabilityLossChance: 0.05,
                values: { jackpot_chance: 0.005, jackpot_multiplier: 50 }
            }
        ];
    }
    
    openShop() {
        // Check if shop should be accessible
        if (!this.shopUnlocked) {
            this.showMessage('SHOP UNLOCKS AT 3 STREAK!');
            return;
        }
        
        const modal = document.getElementById('shopModal');
        modal.classList.add('show');
        
        this.updateShopDisplay();
        this.generateShopStock();
    }
    
    getNextShopStreak() {
        if (this.streak < 5) return 5;
        // Calculate next shop opening: 5, 8, 11, 14, 17, 20, etc.
        const streaksSinceUnlock = this.streak - 5;
        const nextInterval = Math.floor(streaksSinceUnlock / 3) + 1;
        return 5 + (nextInterval * 3);
    }
    
    updateShopDisplay() {
        // Update bank display
        document.getElementById('shopBank').textContent = this.bank;
        
        // Update status
        const statusEl = document.getElementById('shopStatus');
        const timerEl = document.getElementById('rotationTimer');
        const timerDisplay = document.getElementById('timerDisplay');
        
        if (this.streak < 3) {
            statusEl.textContent = 'STREAK 3+ TO UNLOCK';
            statusEl.style.color = '#ff6b6b';
            timerEl.style.display = 'none';
        } else {
            statusEl.textContent = 'SHOP OPEN - ITEMS ROTATE EVERY 5 MINUTES';
            statusEl.style.color = '#4ecdc4';
            timerEl.style.display = 'block';
            
            // Update timer display
            const timeLeft = this.getTimeUntilRotation();
            timerDisplay.textContent = timeLeft;
        }
        
        // Update equipped items display
        this.updateEquippedItemsDisplay();
    }
    
    restoreItemDurability() {
        this.equippedItems.forEach((item, index) => {
            if (item && this.itemDurability[item.id] < 100) {
                const currentDurability = this.itemDurability[item.id];
                const restoreAmount = 1; // Restore 1% per trigger
                this.itemDurability[item.id] = Math.min(100, currentDurability + restoreAmount);
                
                if (this.itemDurability[item.id] === 100) {
                    this.showMessage(`${item.name} FULLY RESTORED!`);
                } else {
                    this.showMessage(`${item.name} PARTIALLY RESTORED!`);
                }
            }
        });
    }
    
    openItemSelection(slotIndex) {
        // Check if slot is unlocked
        if (slotIndex === 1 && this.streak < 10) {
            this.showMessage('SLOT 2 UNLOCKS AT STREAK 10!');
            return;
        }
        if (slotIndex === 2 && this.streak < 25) {
            this.showMessage('SLOT 3 UNLOCKS AT STREAK 25!');
            return;
        }
        
        this.selectedSlot = slotIndex;
        this.showOwnedItems();
        document.getElementById('itemSelectionModal').classList.add('show');
    }
    
    showOwnedItems() {
        const ownedItemsDiv = document.getElementById('ownedItems');
        ownedItemsDiv.innerHTML = '';
        
        if (!this.itemDurability) {
            ownedItemsDiv.innerHTML = '<p>No items owned yet!</p>';
            return;
        }
        
        Object.entries(this.itemDurability).forEach(([itemId, data]) => {
            if (data.owned) {
                const item = this.shopItems.find(i => i.id === itemId);
                if (item) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'owned-item';
                    
                    const isEquipped = this.equippedItems.includes(item);
                    const isBroken = data.durability <= 0;
                    
                    if (isEquipped) {
                        itemDiv.classList.add('equipped');
                    }
                    if (isBroken) {
                        itemDiv.classList.add('broken');
                    }
                    
                    itemDiv.innerHTML = `
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-durability">Durability: ${Math.round(data.durability)}%</div>
                            <div class="item-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>
                        </div>
                        <div class="item-actions">
                            ${isEquipped ? '<span class="equipped-text">EQUIPPED</span>' : 
                              isBroken ? '<button class="repair-btn" data-item="${itemId}">REPAIR</button>' :
                              '<button class="equip-btn" data-item="${itemId}">EQUIP</button>'}
                        </div>
                    `;
                    
                    // Add event listeners
                    const equipBtn = itemDiv.querySelector('.equip-btn');
                    const repairBtn = itemDiv.querySelector('.repair-btn');
                    
                    if (equipBtn) {
                        equipBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.equipItem(itemId);
                        });
                    }
                    
                    if (repairBtn) {
                        repairBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.repairItem(itemId);
                        });
                    }
                    
                    ownedItemsDiv.appendChild(itemDiv);
                }
            }
        });
    }
    
    equipItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        // Check if legendary and already have one equipped
        if (item.rarity === 'legendary') {
            const hasLegendary = this.equippedItems.some(eq => eq && eq.rarity === 'legendary');
            if (hasLegendary) {
                this.showMessage('ONLY 1 LEGENDARY ITEM ALLOWED!');
                return;
            }
        }
        
        // Equip item
        this.equippedItems[this.selectedSlot] = item;
        this.updateEquippedItemsDisplay();
        this.applyEquippedItemEffects();
        this.showMessage(`EQUIPPED ${item.name}!`);
        
        // Close modal
        document.getElementById('itemSelectionModal').classList.remove('show');
    }
    
    repairItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        let repairCost = Math.floor(item.price * (0.25 + Math.random() * 0.25)); // 25-50% of price
        
        // Apply workshop upgrades for repair cost reduction
        if (this.getUpgradeBonus) {
            const alloyBonus = this.getUpgradeBonus('reinforcedAlloy');
            repairCost = Math.floor(repairCost * (1 - alloyBonus * 0.5)); // 50% of alloy bonus reduces repair cost
        }
        
        if (this.bank < repairCost) {
            this.showMessage(`NEED ${repairCost} COINS TO REPAIR!`);
            return;
        }
        
        this.bank -= repairCost;
        this.itemDurability[itemId].durability = 100;
        localStorage.setItem('bank', this.bank);
        
        this.showMessage(`REPAIRED ${item.name} FOR ${repairCost} COINS!`);
        this.updateDisplay();
        this.showOwnedItems();
    }
    
    getTimeUntilRotation() {
        if (!this.lastRotationTime) return '5:00';
        
        const now = Date.now();
        const timeSinceLastRotation = now - this.lastRotationTime;
        const timeLeft = Math.max(0, this.shopRotationTime - timeSinceLastRotation);
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    generateShopStock() {
        const shopItemsDiv = document.getElementById('shopItems');
        shopItemsDiv.innerHTML = '';
        
        // If no current items, generate new ones
        if (this.currentShopItems.length === 0) {
            this.currentShopItems = this.selectRandomShopItems(4);
        }
        
        // Show current items
        const stock = this.currentShopItems;
        
        stock.forEach(item => {
            const scaledPrice = Math.round(item.price * (1 + this.streak * 0.05)); // Price scales with streak
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            if (this.bank < scaledPrice) {
                itemDiv.classList.add('disabled');
            }
            
            itemDiv.innerHTML = `
                <div class="item-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>
                <div class="item-header">
                    <span class="item-icon">${item.icon}</span>
                    <span class="item-price">${scaledPrice} 🪙</span>
                </div>
                <div class="item-title">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-effect">${item.effect}</div>
                <div class="item-durability">Durability Loss: ${(item.durabilityLossChance * 100).toFixed(1)}% per flip</div>
            `;
            
            itemDiv.addEventListener('click', () => {
                this.purchaseItem(item, scaledPrice);
            });
            
            shopItemsDiv.appendChild(itemDiv);
        });
    }
    
    purchaseItem(item, price) {
        if (this.bank < price) {
            this.showMessage('NOT ENOUGH COINS!');
            return;
        }
        
        // Purchase item
        this.bank -= price;
        localStorage.setItem('bank', this.bank);
        
        // Add to owned items with full durability
        if (!this.itemDurability[item.id]) {
            this.itemDurability[item.id] = {
                durability: 100,
                owned: true
            };
        }
        
        this.showMessage(`PURCHASED ${item.name.toUpperCase()}! ITEM ADDED TO COLLECTION!`);
        this.updateDisplay();
        this.updateShopDisplay();
        this.generateShopStock(); // Refresh shop
        
        // Play purchase sound
        try {
            document.getElementById('celebrationSound').play();
        } catch(e) {}
    }
    
    startShopRotation() {
        if (this.shopRotationTimer) {
            clearInterval(this.shopRotationTimer);
        }
        
        this.shopRotationTimer = setInterval(() => {
            this.rotateShopItems();
        }, this.shopRotationTime);
        
        // Generate initial items
        this.currentShopItems = this.selectRandomShopItems(4);
    }
    
    selectRandomShopItems(count) {
        const availableItems = [...this.shopItems];
        const selected = [];
        
        for (let i = 0; i < Math.min(count, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            selected.push(availableItems.splice(randomIndex, 1)[0]);
        }
        
        return selected;
    }
    
    rotateShopItems() {
        this.currentShopItems = this.selectRandomShopItems(4);
        this.showMessage('SHOP ITEMS ROTATED! NEW SELECTION AVAILABLE!');
        
        // Update shop display if open
        if (document.getElementById('shopModal').classList.contains('show')) {
            this.generateShopStock();
        }
    }
    
    updateEquippedItemsDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        slots.forEach((slot, index) => {
            const item = this.equippedItems[index];
            
            if (item) {
                const durability = this.itemDurability[item.id]?.durability || 100;
                const isBroken = durability <= 0;
                
                slot.classList.remove('empty');
                if (isBroken) {
                    slot.classList.add('broken');
                } else {
                    slot.classList.remove('broken');
                }
                
                slot.innerHTML = `
                    <div class="item-in-slot">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-durability">Durability: ${durability}%</span>
                        <span class="item-rarity">${item.rarity.toUpperCase()}</span>
                    </div>
                `;
            } else {
                slot.classList.add('empty');
                slot.innerHTML = '<span class="slot-empty">EMPTY</span>';
            }
        });
        
        // Update active items display
        this.updateActiveItemsDisplay();
    }
    
    updateActiveItemsDisplay() {
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        
        // Show active effects
        if (Object.keys(this.activeEffects).length > 0) {
            Object.entries(this.activeEffects).forEach(([effect, value]) => {
                if (value && value !== true && value !== 0) {
                    const div = document.createElement('div');
                    div.className = 'active-item';
                    
                    let icon = '✨';
                    let name = effect;
                    let duration = '';
                    
                    if (effect === 'freezeMultiplier') {
                        icon = '❄️';
                        name = 'Frozen Multi';
                        duration = `${value.flips} flips`;
                    } else if (effect === 'greedGauge') {
                        icon = '📈';
                        name = 'Greed Gauge';
                        duration = `${value} uses`;
                    } else if (effect === 'tacticalDelay') {
                        icon = '⏱️';
                        name = 'Tactical Delay';
                        duration = `${value} uses`;
                    }
                    
                    div.innerHTML = `
                        <span class="active-item-icon">${icon}</span>
                        <div class="active-item-info">
                            <span class="active-item-name">${name}</span>
                            <span class="active-item-duration">${duration}</span>
                        </div>
                    `;
                    
                    container.appendChild(div);
                }
            });
        }
    }
    
    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        
        if (!item) {
            return;
        }
        
        // Apply item effect
        item.apply();
        
        // Reduce uses
        item.uses--;
        
        if (item.uses <= 0) {
            // Remove item from inventory
            this.inventory[slotIndex] = null;
        }
        
        // Update displays
        this.updateInventoryDisplay();
        this.updateShopDisplay();
    }
    
    showShopUnlock() {
        const btn = document.getElementById('floatingShopBtn');
        btn.style.display = 'block';
        
        this.showMessage('SHOP UNLOCKED! BUY TACTICAL ITEMS!');
        
        setTimeout(() => {
            if (btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }, 5000);
    }
    
    showShopAvailable() {
        this.showMessage(`SHOP OPEN NOW! STREAK ${this.streak} - CLOSES AFTER USE!`);
        
        const btn = document.getElementById('floatingShopBtn');
        btn.querySelector('.shop-text').textContent = 'SHOP OPEN!';
        btn.style.display = 'block';
        
        // Auto-hide after 5 seconds if not clicked
        setTimeout(() => {
            if (btn.style.display === 'block' && this.shopAvailable) {
                btn.style.display = 'none';
            }
        }, 5000);
    }
    
    startShopRotation() {
        if (this.shopRotationTimer) {
            clearInterval(this.shopRotationTimer);
        }
        
        this.shopRotationTimer = setInterval(() => {
            this.rotateShopItems();
        }, this.shopRotationTime);
        
        // Generate initial items
        this.currentShopItems = this.selectRandomShopItems(4);
    }
    
    selectRandomShopItems(count) {
        const availableItems = [...this.shopItems];
        const selected = [];
        
        for (let i = 0; i < Math.min(count, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            selected.push(availableItems.splice(randomIndex, 1)[0]);
        }
        
        return selected;
    }
    
    rotateShopItems() {
        this.currentShopItems = this.selectRandomShopItems(4);
        this.showMessage('SHOP ITEMS ROTATED! NEW SELECTION AVAILABLE!');
        
        // Update shop display if open
        if (document.getElementById('shopModal').classList.contains('show')) {
            this.generateShopStock();
        }
    }
    
    updateEquippedItemsDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        slots.forEach((slot, index) => {
            const item = this.equippedItems[index];
            
            if (item) {
                slot.classList.remove('empty');
                const durability = this.itemDurability[item.id] || 100;
                const isBroken = durability <= 0;
                slot.innerHTML = `
                    <div class="item-in-slot ${isBroken ? 'broken' : ''}">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-durability">Durability: ${durability}%</span>
                        ${isBroken ? '<span class="broken-text">BROKEN!</span>' : ''}
                        <button class="unequip-btn" data-slot="${index}">UNEQUIP</button>
                        ${isBroken ? `<button class="repair-btn" data-item="${item.id}">REPAIR</button>` : ''}
                    </div>
                `;
            } else {
                slot.classList.add('empty');
                slot.innerHTML = '<span class="slot-empty">EMPTY</span>';
            }
        });
    }
    
    applyDurabilityLoss() {
        this.equippedItems.forEach((item, index) => {
            if (item && this.itemDurability[item.id] > 0) {
                let lossChance = item.durabilityLossChance || 0.01;
                
                // Apply reinforced alloy upgrade
                if (this.getUpgradeBonus) {
                    const alloyBonus = this.getUpgradeBonus('reinforcedAlloy');
                    lossChance *= (1 - alloyBonus);
                }
                
                // Apply fortune memory upgrade
                if (this.getUpgradeBonus) {
                    const fortuneBonus = this.getUpgradeBonus('fortuneMemory');
                    if (Math.random() < fortuneBonus) {
                        return; // Prevent durability loss
                    }
                }
                
                if (Math.random() < lossChance) {
                    const currentDurability = this.itemDurability[item.id];
                    const lossAmount = Math.random() * 3 + 1; // 1-3% loss
                    this.itemDurability[item.id] = Math.max(0, currentDurability - lossAmount);
                    
                    if (this.itemDurability[item.id] <= 0) {
                        this.showMessage(`${item.name} BROKE! NEEDS REPAIR!`);
                        this.updateEquippedItemsDisplay();
                    }
                }
            }
        });
    }
    
    applyRestorationCircuit() {
        if (this.getUpgradeBonus) {
            const repairChance = this.getUpgradeBonus('restorationCircuit');
            if (Math.random() < repairChance) {
                // Repair 1 durability point on a random equipped item
                const equippedItems = this.equippedItems.filter(item => item && this.itemDurability[item.id] < 100);
                if (equippedItems.length > 0) {
                    const randomItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
                    this.itemDurability[randomItem.id] = Math.min(100, this.itemDurability[randomItem.id] + 1);
                    this.showMessage(`RESTORATION CIRCUIT! ${randomItem.name} REPAIRED!`);
                }
            }
        }
    }
    
    applyEquippedItemEffects() {
        // Reset active effects from items
        this.activeEffects = {};
        
        this.equippedItems.forEach((item, index) => {
            if (item && this.itemDurability[item.id] > 0) {
                this.applyItemEffect(item);
            }
        });
    }
    
    applyItemEffect(item) {
        const values = item.values;
        
        switch (item.id) {
            case 'lucky_charm':
                this.activeEffects.winChance = (this.activeEffects.winChance || 0) + values.win_chance;
                break;
            case 'streak_booster':
                this.activeEffects.multiplierGain = (this.activeEffects.multiplierGain || 0) + values.multiplier_gain;
                break;
            case 'coin_saver':
                this.activeEffects.saveChance = (this.activeEffects.saveChance || 0) + values.save_chance;
                break;
            case 'mirror_coin':
                this.activeEffects.copyChance = (this.activeEffects.copyChance || 0) + values.copy_chance;
                break;
            case 'double_down':
                this.activeEffects.doubleDown = true;
                break;
            case 'bank_magnet':
                this.activeEffects.bankBonus = (this.activeEffects.bankBonus || 0) + values.bank_bonus;
                break;
            case 'hot_hand':
                this.activeEffects.hotHand = true;
                break;
            case 'cold_blooded':
                this.activeEffects.coldBlooded = true;
                break;
            case 'risk_taker':
                this.activeEffects.riskTaker = true;
                break;
            case 'coin_splitter':
                this.activeEffects.doubleFlipChance = (this.activeEffects.doubleFlipChance || 0) + values.double_flip_chance;
                break;
            case 'multiplier_bond':
                this.activeEffects.multiplierBond = true;
                break;
            case 'jackpot_fever':
                this.activeEffects.jackpotFever = true;
                break;
        }
    }
    
    // Shop Rotation System
    startShopRotation() {
        if (this.shopRotationTimer) {
            clearInterval(this.shopRotationTimer);
        }
        
        // Generate initial shop items
        this.generateShopStock();
        
        // Set up rotation timer
        this.shopRotationTimer = setInterval(() => {
            this.generateShopStock();
            this.updateShopDisplay();
        }, this.shopRotationTime);
        
        // Start countdown display
        this.startRotationCountdown();
    }
    
    startRotationCountdown() {
        const countdownElement = document.getElementById('rotationCountdown');
        if (!countdownElement) return;
        
        let timeLeft = this.shopRotationTime / 1000; // Convert to seconds
        
        const updateCountdown = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = Math.floor(timeLeft % 60);
            countdownElement.textContent = `New items in ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                timeLeft = this.shopRotationTime / 1000;
            } else {
                timeLeft--;
                setTimeout(updateCountdown, 1000);
            }
        };
        
        updateCountdown();
    }
    
    generateShopStock() {
        // Show only 4 items at once
        const availableItems = [...this.shopItems];
        this.currentShopItems = [];
        
        for (let i = 0; i < Math.min(4, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            this.currentShopItems.push(availableItems.splice(randomIndex, 1)[0]);
        }
    }
    
    triggerShadowBet() {
        const wager = Math.floor(this.score / 2);
        if (wager <= 0) {
            this.showMessage('NEED SCORE TO WAGER!');
            return;
        }
        
        this.showMessage(`SHADOW BET! WAGERING ${wager} COINS!`);
        
        setTimeout(() => {
            const won = Math.random() < 0.5;
            
            if (won) {
                this.score += wager * 2;
                this.showMessage(`SHADOW BET WON! +${wager * 2} COINS!`);
                this.celebrateWin();
            } else {
                this.score = Math.max(0, this.score - wager);
                this.showMessage(`SHADOW BET LOST! -${wager} COINS!`);
                this.showLoss();
            }
            
            this.updateDisplay();
        }, 1500);
    }
    
    equipItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        // Check if already owned
        if (!this.itemDurability[itemId]?.owned) {
            this.showMessage('ITEM NOT OWNED! PURCHASE IT FIRST!');
            return;
        }
        
        // Check if item is broken
        if (this.itemDurability[itemId].durability <= 0) {
            this.showMessage('ITEM IS BROKEN! REPAIR IT FIRST!');
            return;
        }
        
        // Check legendary limit
        if (item.rarity === 'legendary') {
            const hasLegendary = this.equippedItems.some(eq => eq && eq.rarity === 'legendary');
            if (hasLegendary) {
                this.showMessage('ONLY 1 LEGENDARY ITEM CAN BE EQUIPPED!');
                return;
            }
        }
        
        // Find empty slot
        const emptySlot = this.equippedItems.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            this.showMessage('NO EMPTY EQUIP SLOTS! UNEQUIP AN ITEM FIRST!');
            return;
        }
        
        // Equip item
        this.equippedItems[emptySlot] = item;
        this.applyItemEffects();
        this.updateEquippedItemsDisplay();
        this.showMessage(`EQUIPPED ${item.name.toUpperCase()}!`);
    }
    
    unequipItem(slotIndex) {
        const item = this.equippedItems[slotIndex];
        if (!item) return;
        
        this.equippedItems[slotIndex] = null;
        this.applyItemEffects();
        this.updateEquippedItemsDisplay();
        this.showMessage(`UNEQUIPPED ${item.name.toUpperCase()}!`);
    }
    
    applyItemEffects() {
        // Clear all active effects
        this.activeEffects = {};
        
        // Apply effects from equipped items
        this.equippedItems.forEach(item => {
            if (!item) return;
            
            const durability = this.itemDurability[item.id]?.durability || 100;
            if (durability <= 0) return; // Don't apply effects if broken
            
            switch (item.id) {
                case 'lucky_charm':
                    this.activeEffects.luckyCharm = item.values.win_chance;
                    break;
                case 'streak_booster':
                    this.activeEffects.streakBooster = item.values.multiplier_gain;
                    break;
                case 'coin_saver':
                    this.activeEffects.coinSaver = item.values.save_chance;
                    break;
                case 'mirror_coin':
                    this.activeEffects.mirrorCoin = item.values.copy_chance;
                    break;
                case 'double_down':
                    this.activeEffects.doubleDown = item.values;
                    break;
                case 'bank_magnet':
                    this.activeEffects.bankMagnet = item.values.bank_bonus;
                    break;
                case 'hot_hand':
                    this.activeEffects.hotHand = item.values;
                    break;
                case 'cold_blooded':
                    this.activeEffects.coldBlooded = item.values;
                    break;
                case 'risk_taker':
                    this.activeEffects.riskTaker = item.values.multiplier_per_win;
                    break;
                case 'coin_splitter':
                    this.activeEffects.coinSplitter = item.values.double_flip_chance;
                    break;
                case 'multiplier_bond':
                    this.activeEffects.multiplierBond = item.values;
                    break;
                case 'jackpot_fever':
                    this.activeEffects.jackpotFever = item.values;
                    break;
            }
        });
    }
    
    processDurabilityLoss() {
        this.equippedItems.forEach((item, slotIndex) => {
            if (!item) return;
            
            const durabilityData = this.itemDurability[item.id];
            if (!durabilityData || durabilityData.durability <= 0) return;
            
            // Check if durability should be lost
            if (Math.random() < item.durabilityLossChance) {
                const lossAmount = Math.random() * 3 + 1; // 1-3% loss
                durabilityData.durability = Math.max(0, durabilityData.durability - lossAmount);
                
                if (durabilityData.durability <= 0) {
                    this.showMessage(`${item.name.toUpperCase()} BROKE! REPAIR NEEDED!`);
                    // Unequip broken item
                    this.equippedItems[slotIndex] = null;
                    this.applyItemEffects();
                }
                
                this.updateEquippedItemsDisplay();
            }
        });
    }
    
    repairItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        const durabilityData = this.itemDurability[itemId];
        if (!durabilityData || durabilityData.durability >= 100) return;
        
        let repairCost = Math.floor(item.price * (0.25 + Math.random() * 0.25)); // 25-50% of price
        
        // Apply workshop upgrades to reduce repair cost
        if (this.getUpgradeBonus) {
            const costReduction = this.getUpgradeBonus('restorationCircuit') * 0.1; // 10% reduction per level
            repairCost = Math.floor(repairCost * (1 - costReduction));
        }
        
        if (this.bank < repairCost) {
            this.showMessage(`NOT ENOUGH COINS! REPAIR COSTS ${repairCost}!`);
            return;
        }
        
        this.bank -= repairCost;
        durabilityData.durability = 100;
        localStorage.setItem('bank', this.bank);
        
        this.updateDisplay();
        this.updateEquippedItemsDisplay();
        this.showMessage(`REPAIRED ${item.name.toUpperCase()} FOR ${repairCost} COINS!`);
    }
    
    openItemSelection(slotIndex) {
        // Show owned items for selection
        const ownedItems = Object.keys(this.itemDurability).filter(id => this.itemDurability[id].owned);
        if (ownedItems.length === 0) {
            this.showMessage('NO ITEMS OWNED! BUY SOME FROM THE SHOP!');
            return;
        }
        
        // Create item selection modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>SELECT ITEM TO EQUIP</h2>
                <div class="item-selection">
                    ${ownedItems.map(id => {
                        const item = this.shopItems.find(i => i.id === id);
                        const durability = this.itemDurability[id].durability;
                        return `
                            <div class="selectable-item ${durability <= 0 ? 'broken' : ''}" data-item-id="${id}">
                                <span class="item-icon">${item.icon}</span>
                                <span class="item-name">${item.name}</span>
                                <span class="item-durability">Durability: ${durability}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="pixel-btn close-btn" onclick="this.parentElement.parentElement.remove()">CANCEL</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handlers
        modal.querySelectorAll('.selectable-item').forEach(item => {
            item.addEventListener('click', () => {
                const itemId = item.dataset.itemId;
                this.equipItem(itemId, slotIndex);
                modal.remove();
            });
        });
    }
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CoinFlipGame();
});