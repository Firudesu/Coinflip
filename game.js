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
        this.maxInventorySlots = 4;
        this.inventory = new Array(this.maxInventorySlots).fill(null);
        this.shopUnlocked = true;
        this.activeEffects = {}; // Track active item effects
        this.itemRuntimeState = {
            lastFlipResult: null,
            flipCount: 0
        };
        this.lossStreak = 0;
        this.lastWinDetails = null;
        this.shopItems = this.defineShopItems();
        
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
        this.shopUnlocked = true;
        localStorage.setItem('shopUnlocked', 'true');
        
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
        
        // Shop button
        document.getElementById('shopBtn').addEventListener('click', () => {
            this.openShop();
        });
        
        // Floating shop button
        document.getElementById('floatingShopBtn').addEventListener('click', () => {
            this.openShop();
            document.getElementById('floatingShopBtn').style.display = 'none';
        });
        
        // Close shop button - marks shop as used for this streak
        document.getElementById('closeShop').addEventListener('click', () => {
            document.getElementById('shopModal').classList.remove('show');
            document.getElementById('floatingShopBtn').style.display = 'none';
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
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const index = parseInt(slot.dataset.slot, 10);
                this.useItem(index);
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
        
        const context = this.buildFlipContext();
        this.currentFlipContext = context;
        
        // Check for random event before flip
        if (this.checkForRandomEvent) {
            const eventTriggered = this.checkForRandomEvent(context);
            if (eventTriggered) {
                console.log('Random event triggered!');
            }
        } else {
            console.log('Random events not initialized yet');
        }
        
        this.isFlipping = true;
        this.canvas.classList.add('flipping', 'disabled');
        document.getElementById('choiceContainer').classList.add('hidden');
        
        const payload = this.determineFlipOutcome(context);
        const result = payload.result;
        
        const willLose = result !== this.playerChoice;
        const isEpicMoment = this.streak >= 10 && willLose;
        
        // Apply tactical delay
        const hasDelay = this.activeEffects.tacticalDelay > 0;
        
        if (context.messages && context.messages.length > 0) {
            this.showMessage(context.messages[context.messages.length - 1]);
        }
        
        this.pendingFlipPayload = payload;
        
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
                const finalPayload = this.pendingFlipPayload || { result, context };
                this.pendingFlipPayload = null;
                this.finalizeFlipOutcome(finalPayload);
            }
        }, flipSpeed);
    }
    
    handleResult(result, context = {}) {
        const won = result === this.playerChoice;
        
        // Process active event if any
        if (this.currentEvent && this.currentEvent.execute) {
            if (this.currentEvent.type !== 'skill' && this.currentEvent.type !== 'encounter') {
                this.currentEvent.execute(won);
            }
        }
        
        if (won) {
            this.streak++;
            const rewardMultiplier = context.rewardMultiplier ?? 1;
            
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
            
            const points = Math.round(this.basePoints * this.multiplier * rewardMultiplier);
            this.score += points;
            this.lastWinDetails = {
                points,
                multiplierGrowth,
                rewardMultiplier
            };
            
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
            this.lossStreak = 0;
        } else {
            // Show what was lost
            const lostScore = this.score;
            const lostStreak = this.streak;
            this.lastWinDetails = null;
            
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
            this.lossStreak += 1;
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
            
            // Check for battle trigger after banking
            if (this.checkBattleTrigger) {
                this.checkBattleTrigger();
            }
            
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
        
        const message = `?? COIN FLIP STREAK
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
        const priceByRarity = {
            common: 450,
            uncommon: 900,
            rare: 1700,
            legendary: 3200
        };
        
        const makeItem = (config) => {
            const item = {
                id: config.id,
                name: config.name,
                icon: config.icon || '??',
                description: config.description,
                effect: config.effect,
                rarity: config.rarity,
                durability: config.durability,
                price: config.price ?? priceByRarity[config.rarity] ?? 1200,
                initState: config.initState || (() => ({}))
            };
            
            if (config.onPreFlip) item.onPreFlip = config.onPreFlip;
            if (config.onResult) item.onResult = config.onResult;
            if (config.onAfterResult) item.onAfterResult = config.onAfterResult;
            if (config.onEventCheck) item.onEventCheck = config.onEventCheck;
            if (config.onRandomEvent) item.onRandomEvent = config.onRandomEvent;
            if (config.onFlipEnd) item.onFlipEnd = config.onFlipEnd;
            
            return item;
        };
        
        const getMultiplier = (item) => (item?.state?.inverted ? -1 : 1);
        
        return [
            makeItem({
                id: 'lucky_thumb',
                name: 'Lucky Thumb',
                icon: '??',
                rarity: 'common',
                durability: 20,
                description: 'Makes heads slightly more likely but can break if luck turns bad.',
                effect: '+10% heads. Breaks after 3 tails in a row.',
                initState: () => ({ failureStreak: 0 }),
                onPreFlip(context, game, item) {
                    context.headsChance += 0.10 * getMultiplier(item);
                },
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    const failureSide = mult > 0 ? 'tails' : 'heads';
                    if (payload.result === failureSide) {
                        item.state.failureStreak = (item.state.failureStreak || 0) + 1;
                    } else {
                        item.state.failureStreak = 0;
                    }
                    if (item.state.failureStreak >= 3) {
                        item.state.forceBreak = mult > 0
                            ? 'Lucky Thumb snapped after a nasty streak.'
                            : 'Entropy backlash shattered the Lucky Thumb.';
                    }
                }
            }),
            makeItem({
                id: 'bent_penny',
                name: 'Bent Penny',
                icon: '??',
                rarity: 'common',
                durability: 25,
                description: 'Favors tails and gives small payouts when you land tails.',
                effect: '+5% tails. +2 coins on winning tails.',
                onPreFlip(context, game, item) {
                    context.tailsChance += 0.05 * getMultiplier(item);
                },
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    const targetSide = mult > 0 ? 'tails' : 'heads';
                    if (payload.won && payload.result === targetSide) {
                        payload.context.scoreBonusOnWin = (payload.context.scoreBonusOnWin || 0) + 2 * mult;
                    }
                }
            }),
            makeItem({
                id: 'weighted_edge',
                name: 'Weighted Edge',
                icon: '??',
                rarity: 'uncommon',
                durability: 15,
                description: 'Balances your coin odds so both sides become fairer.',
                effect: '+15% to whichever side is currently weaker.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0) {
                        if (context.headsChance < context.tailsChance) {
                            context.headsChance += 0.15;
                        } else if (context.tailsChance < context.headsChance) {
                            context.tailsChance += 0.15;
                        } else {
                            context.headsChance += 0.075;
                            context.tailsChance += 0.075;
                        }
                    } else {
                        if (context.headsChance < context.tailsChance) {
                            context.headsChance = Math.max(0, context.headsChance - 0.15);
                        } else if (context.tailsChance < context.headsChance) {
                            context.tailsChance = Math.max(0, context.tailsChance - 0.15);
                        } else {
                            context.headsChance = Math.max(0, context.headsChance - 0.075);
                            context.tailsChance = Math.max(0, context.tailsChance - 0.075);
                        }
                    }
                }
            }),
            makeItem({
                id: 'double_or_nothing',
                name: 'Double or Nothing',
                icon: '??',
                rarity: 'rare',
                durability: 12,
                description: 'Occasionally gives you double credit on a flip.',
                effect: '20% chance the next flip counts twice.',
                initState: () => ({ triggered: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.triggered = Math.random() < 0.2;
                    if (!item.state.triggered) return;
                    context.messages = context.messages || [];
                    if (mult > 0) {
                        context.doubleOutcome = true;
                        context.messages.push('Double or Nothing is primed!');
                    } else {
                        context.halfOutcome = true;
                        context.messages.push('Double or Nothing misfires: payouts halved.');
                    }
                },
                onFlipEnd(context, game, item) {
                    item.state.triggered = false;
                }
            }),
            makeItem({
                id: 'burnt_coin',
                name: 'Burnt Coin',
                icon: '??',
                rarity: 'uncommon',
                durability: 18,
                description: 'Makes you less lucky but pays out more when you win.',
                effect: '-5% win chance. +50% coin reward.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    context.playerWinChanceModifier -= 0.05 * mult;
                    context.rewardMultiplier *= 1 + (0.5 * mult);
                }
            }),
            makeItem({
                id: 'counterfeit_coin',
                name: 'Counterfeit Coin',
                icon: '??',
                rarity: 'uncommon',
                durability: 25,
                description: 'Protects you from bad random events occasionally.',
                effect: 'Ignores one random event every 10 flips.',
                initState: () => ({ flips: 0, pendingCancel: false, pendingForce: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.flips = (item.state.flips || 0) + 1;
                    if (item.state.flips >= 10) {
                        if (mult > 0) {
                            item.state.pendingCancel = true;
                        } else {
                            item.state.pendingForce = true;
                        }
                        item.state.flips = 0;
                    }
                    if (item.state.pendingCancel && mult > 0) {
                        context.eventCancelRequests = context.eventCancelRequests || [];
                        context.eventCancelRequests.push({ id: item.id, reason: 'Counterfeit Coin absorbs the next event.' });
                    }
                    if (item.state.pendingForce && mult < 0) {
                        context.forceEventTrigger = true;
                    }
                },
                onEventCheck(eventContext, game, item, outcome) {
                    const mult = getMultiplier(item);
                    if (mult > 0 && item.state.pendingCancel && outcome?.triggered) {
                        item.state.pendingCancel = false;
                    }
                    if (mult < 0 && item.state.pendingForce && outcome?.triggered) {
                        item.state.pendingForce = false;
                    }
                }
            }),
            makeItem({
                id: 'rabbits_foot',
                name: 'Rabbit?s Foot',
                icon: '??',
                rarity: 'common',
                durability: 20,
                description: 'Rewards you after a losing streak by improving heads.',
                effect: '+3% heads per tails until a heads resets it.',
                initState: () => ({ headsBoost: 0 }),
                onPreFlip(context, game, item) {
                    if (item.state.headsBoost) {
                        context.headsChance += item.state.headsBoost * getMultiplier(item);
                    }
                },
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (payload.result === 'tails') {
                        item.state.headsBoost = (item.state.headsBoost || 0) + 0.03;
                    } else if (payload.result === 'heads') {
                        item.state.headsBoost = 0;
                    }
                    if (mult < 0 && item.state.headsBoost) {
                        item.state.headsBoost = Math.min(item.state.headsBoost, 0.3);
                    }
                }
            }),
            makeItem({
                id: 'rusty_nickel',
                name: 'Rusty Nickel',
                icon: '??',
                rarity: 'common',
                durability: 30,
                description: 'Lasts a while but might suddenly break.',
                effect: 'Every 5 flips, 10% chance to break early.',
                initState: () => ({ flips: 0 }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.flips = (item.state.flips || 0) + 1;
                    if (item.state.flips % 5 !== 0) return;
                    if (mult > 0 && Math.random() < 0.1) {
                        item.state.forceBreak = 'Rusty Nickel crumbled from age.';
                    }
                    if (mult < 0 && Math.random() < 0.1) {
                        item.remainingDurability = Math.min(
                            item.maxDurability ?? item.durability,
                            (item.remainingDurability ?? item.durability) + 5
                        );
                    }
                }
            }),
            makeItem({
                id: 'mirror_coin',
                name: 'Mirror Coin',
                icon: '??',
                rarity: 'uncommon',
                durability: 18,
                description: 'Prevents long bad streaks by forcing a heads.',
                effect: 'If tails twice in a row, next flip is guaranteed heads.',
                initState: () => ({ tailStreak: 0, headStreak: 0, forceHeads: false, forceTails: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0 && item.state.forceHeads) {
                        context.forceResult = 'heads';
                        item.state.forceHeads = false;
                    }
                    if (mult < 0 && item.state.forceTails) {
                        context.forceResult = 'tails';
                        item.state.forceTails = false;
                    }
                },
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0) {
                        if (payload.result === 'tails') {
                            item.state.tailStreak = (item.state.tailStreak || 0) + 1;
                        } else {
                            item.state.tailStreak = 0;
                        }
                        if (item.state.tailStreak >= 2) {
                            item.state.forceHeads = true;
                        }
                    } else {
                        if (payload.result === 'heads') {
                            item.state.headStreak = (item.state.headStreak || 0) + 1;
                        } else {
                            item.state.headStreak = 0;
                        }
                        if (item.state.headStreak >= 2) {
                            item.state.forceTails = true;
                        }
                    }
                }
            }),
            makeItem({
                id: 'magnet_token',
                name: 'Magnet Token',
                icon: '??',
                rarity: 'rare',
                durability: 15,
                description: 'Always blocks random events while active.',
                effect: 'Cancels one random event per round.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0) {
                        context.cancelEvent = true;
                        context.blockEventReason = 'Magnet Token nullifies random events.';
                    } else {
                        context.eventChanceMultiplier *= 1.5;
                    }
                }
            }),
            makeItem({
                id: 'weighted_decision',
                name: 'Weighted Decision',
                icon: '??',
                rarity: 'uncommon',
                durability: 25,
                description: 'Makes events rarer and slightly improves luck.',
                effect: '-10% event chance. +5% heads.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    context.headsChance += 0.05 * mult;
                    context.eventChanceMultiplier *= mult > 0 ? 0.9 : 1.1;
                }
            }),
            makeItem({
                id: 'fortune_band',
                name: 'Fortune Band',
                icon: '???',
                rarity: 'common',
                durability: 25,
                description: 'Rewards consecutive wins.',
                effect: '+1 coin for each streaked win.',
                onAfterResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (payload.won) {
                        payload.context.scoreBonusOnWin = (payload.context.scoreBonusOnWin || 0) + (game.streak * mult);
                    }
                }
            }),
            makeItem({
                id: 'chaos_token',
                name: 'Chaos Token',
                icon: '??',
                rarity: 'rare',
                durability: 20,
                description: 'Sometimes flips your result to the opposite but pays big.',
                effect: '10% chance to invert result and double reward.',
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (Math.random() >= 0.1) return;
                    payload.context.messages = payload.context.messages || [];
                    if (mult > 0) {
                        payload.context.messages.push('Chaos Token flips fate!');
                        payload.result = payload.result === 'heads' ? 'tails' : 'heads';
                        payload.won = payload.result === payload.playerChoice;
                        payload.context.rewardMultiplier *= 2;
                    } else {
                        payload.context.messages.push('Chaos Token backlash!');
                        payload.result = payload.result === 'heads' ? 'tails' : 'heads';
                        payload.won = payload.result === payload.playerChoice;
                        payload.context.rewardMultiplier *= 0.5;
                    }
                }
            }),
            makeItem({
                id: 'silver_edge',
                name: 'Silver Edge',
                icon: '???',
                rarity: 'rare',
                durability: 25,
                description: 'Strong item that might shatter anytime.',
                effect: '+10% heads. 1% self-break per flip.',
                onPreFlip(context, game, item) {
                    context.headsChance += 0.10 * getMultiplier(item);
                },
                onAfterResult(payload, game, item) {
                    if (Math.random() < 0.01) {
                        item.state.forceBreak = getMultiplier(item) > 0
                            ? 'Silver Edge shattered!'
                            : 'Silver Edge dissolved under chaos!';
                    }
                }
            }),
            makeItem({
                id: 'black_coin',
                name: 'Black Coin',
                icon: '?',
                rarity: 'legendary',
                durability: 1,
                description: 'Saves you from one loss, then disappears.',
                effect: 'Cancels your next loss.',
                initState: () => ({ used: false }),
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (item.state.used) return;
                    payload.context.messages = payload.context.messages || [];
                    if (mult > 0 && !payload.won) {
                        payload.forceWin = true;
                        item.state.used = true;
                        item.state.forceBreak = 'Black Coin crumbled saving your streak.';
                        payload.context.messages.push('Black Coin saved you!');
                    }
                    if (mult < 0 && payload.won) {
                        payload.forceLoss = true;
                        item.state.used = true;
                        item.state.forceBreak = 'Black Coin demanded a loss.';
                        payload.context.messages.push('Black Coin twisted your victory!');
                    }
                }
            }),
            makeItem({
                id: 'tricksters_charm',
                name: 'Trickster?s Charm',
                icon: '??',
                rarity: 'uncommon',
                durability: 15,
                description: 'Turns some bad events into good ones.',
                effect: '50% chance to turn triggered event into positive.',
                onRandomEvent(eventPayload, game, item) {
                    const mult = getMultiplier(item);
                    if (!eventPayload?.event) return;
                    const event = eventPayload.event;
                    const isPositive = ['reward', 'cosmetic'].includes(event.type);
                    eventPayload.messages = eventPayload.messages || [];
                    if (mult > 0 && !isPositive && Math.random() < 0.5) {
                        eventPayload.convertToPositive = true;
                        eventPayload.messages.push('Trickster?s Charm flipped the event!');
                    }
                    if (mult < 0 && isPositive && Math.random() < 0.5) {
                        eventPayload.convertToNegative = true;
                        eventPayload.messages.push('Trickster?s Charm corrupted the event!');
                    }
                }
            }),
            makeItem({
                id: 'golden_flick',
                name: 'Golden Flick',
                icon: '??',
                rarity: 'common',
                durability: 20,
                description: 'Simple extra money from heads.',
                effect: '+1 coin on every heads win.',
                onAfterResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (payload.won && payload.result === 'heads') {
                        payload.context.scoreBonusOnWin = (payload.context.scoreBonusOnWin || 0) + 1 * mult;
                    }
                }
            }),
            makeItem({
                id: 'cursed_penny',
                name: 'Cursed Penny',
                icon: '??',
                rarity: 'rare',
                durability: 18,
                description: 'High rewards but invites trouble.',
                effect: '+25% reward. Doubles event chance.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    context.rewardMultiplier *= 1 + (0.25 * mult);
                    context.eventChanceMultiplier *= mult > 0 ? 2 : 0.5;
                }
            }),
            makeItem({
                id: 'echo_coin',
                name: 'Echo Coin',
                icon: '??',
                rarity: 'uncommon',
                durability: 15,
                description: 'Creates predictable patterns to plan around.',
                effect: 'Every 3rd flip repeats the previous outcome.',
                initState: () => ({ flips: 0 }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.flips = (item.state.flips || 0) + 1;
                    if (item.state.flips % 3 !== 0) return;
                    const last = game.lastFlipResult;
                    if (!last) return;
                    context.forceResult = mult > 0 ? last : (last === 'heads' ? 'tails' : 'heads');
                }
            }),
            makeItem({
                id: 'fractured_edge',
                name: 'Fractured Edge',
                icon: '??',
                rarity: 'common',
                durability: 25,
                description: 'Makes luck swing back and forth.',
                effect: 'Tails: -5% heads next turn; Heads: +5%.',
                initState: () => ({ nextHeadModifier: 0 }),
                onPreFlip(context, game, item) {
                    if (item.state.nextHeadModifier) {
                        context.headsChance += item.state.nextHeadModifier * getMultiplier(item);
                    }
                },
                onResult(payload, game, item) {
                    if (payload.result === 'heads') {
                        item.state.nextHeadModifier = 0.05;
                    } else if (payload.result === 'tails') {
                        item.state.nextHeadModifier = -0.05;
                    }
                    if (getMultiplier(item) < 0 && item.state.nextHeadModifier) {
                        item.state.nextHeadModifier *= -1;
                    }
                }
            }),
            makeItem({
                id: 'coin_purse',
                name: 'Coin Purse',
                icon: '??',
                rarity: 'common',
                durability: 10,
                description: 'Quick money maker but burns out fast.',
                effect: '+1 coin each flip.',
                onAfterResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    payload.context.flatCoinGain = (payload.context.flatCoinGain || 0) + 1 * mult;
                }
            }),
            makeItem({
                id: 'glass_coin',
                name: 'Glass Coin',
                icon: '??',
                rarity: 'rare',
                durability: 1,
                description: 'High-risk, single-use power boost.',
                effect: '+20% heads but breaks if tails.',
                onPreFlip(context, game, item) {
                    context.headsChance += 0.20 * getMultiplier(item);
                },
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    const breakSide = mult > 0 ? 'tails' : 'heads';
                    if (payload.result === breakSide) {
                        item.state.forceBreak = 'The Glass Coin shattered.';
                    }
                }
            }),
            makeItem({
                id: 'collectors_token',
                name: 'Collector?s Token',
                icon: '???',
                rarity: 'rare',
                durability: 20,
                description: 'Encourages you to fill all four slots.',
                effect: '+2% heads for each active item.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    const activeItems = context.activeItems ?? game.inventory.filter(Boolean);
                    context.headsChance += (activeItems.length * 0.02) * mult;
                }
            }),
            makeItem({
                id: 'clover_band',
                name: 'Clover Band',
                icon: '??',
                rarity: 'uncommon',
                durability: 15,
                description: 'Helps you recover after bad luck.',
                effect: '+10% heads if previous flip was tails.',
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    const targetLast = mult > 0 ? 'tails' : 'heads';
                    if (game.itemRuntimeState?.lastFlipResult === targetLast) {
                        context.headsChance += 0.10 * mult;
                    }
                }
            }),
            makeItem({
                id: 'magpie_feather',
                name: 'Magpie Feather',
                icon: '??',
                rarity: 'uncommon',
                durability: 20,
                description: 'Rewards streak play.',
                effect: 'On 3-win streak, +5 coins.',
                onAfterResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (payload.won && game.streak > 0 && game.streak % 3 === 0) {
                        payload.context.scoreBonusOnWin = (payload.context.scoreBonusOnWin || 0) + 5 * mult;
                    }
                }
            }),
            makeItem({
                id: 'fate_chip',
                name: 'Fate Chip',
                icon: '??',
                rarity: 'rare',
                durability: 25,
                description: 'Turns bad events into bonuses.',
                effect: 'Negative events give +2 coins instead of penalties.',
                onRandomEvent(eventPayload, game, item) {
                    const mult = getMultiplier(item);
                    if (!eventPayload?.event) return;
                    const event = eventPayload.event;
                    const isNegative = ['risk', 'mutation', 'legendary'].includes(event.type);
                    if (mult > 0 && isNegative) {
                        eventPayload.overrideWithReward = { type: 'coins', amount: 2 };
                    }
                    if (mult < 0 && !isNegative) {
                        eventPayload.overrideWithPenalty = { type: 'coins', amount: -2 };
                    }
                }
            }),
            makeItem({
                id: 'counter_token',
                name: 'Counter Token',
                icon: '???',
                rarity: 'rare',
                durability: 25,
                description: 'Reliable defense item.',
                effect: '-10% event chance, cancels 1 event every 10 flips.',
                initState: () => ({ flips: 0, pendingCancel: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    context.eventChanceMultiplier *= mult > 0 ? 0.9 : 1.1;
                    item.state.flips = (item.state.flips || 0) + 1;
                    if (item.state.flips >= 10) {
                        if (mult > 0) {
                            item.state.pendingCancel = true;
                        }
                        item.state.flips = 0;
                    }
                    if (item.state.pendingCancel && mult > 0) {
                        context.eventCancelRequests = context.eventCancelRequests || [];
                        context.eventCancelRequests.push({ id: item.id, reason: 'Counter Token nullifies the next event.' });
                    }
                },
                onEventCheck(eventContext, game, item, outcome) {
                    if (getMultiplier(item) > 0 && item.state.pendingCancel && outcome?.triggered) {
                        item.state.pendingCancel = false;
                    }
                }
            }),
            makeItem({
                id: 'coin_splitter',
                name: 'Coin Splitter',
                icon: '??',
                rarity: 'rare',
                durability: 10,
                description: 'Gives extra chance to win sometimes.',
                effect: '10% chance to flip twice and keep the best result.',
                initState: () => ({ triggered: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.triggered = Math.random() < 0.1;
                    if (!item.state.triggered) return;
                    if (mult > 0) {
                        context.coinSplitter = true;
                    } else {
                        context.coinSplitterPenalty = true;
                    }
                },
                onFlipEnd(context, game, item) {
                    item.state.triggered = false;
                }
            }),
            makeItem({
                id: 'mercy_coin',
                name: 'Mercy Coin',
                icon: '??',
                rarity: 'rare',
                durability: 15,
                description: 'Stops you from getting crushed by bad luck.',
                effect: 'Prevents losing streaks longer than 3 by forcing a win.',
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0 && !payload.won && game.lossStreak >= 3) {
                        payload.forceWin = true;
                        item.state.forceBreak = 'Mercy Coin prevented another loss.';
                    }
                    if (mult < 0 && payload.won && game.streak >= 3) {
                        payload.forceLoss = true;
                        item.state.forceBreak = 'Mercy Coin demanded a loss.';
                    }
                }
            }),
            makeItem({
                id: 'entropy_shard',
                name: 'Entropy Shard',
                icon: '??',
                rarity: 'legendary',
                durability: 20,
                description: 'Makes your items chaotic ? effects invert randomly.',
                effect: 'Each round, inverts one equipped item?s effect.',
                initState: () => ({ target: null, previousInversion: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    if (item.state.target && item.state.target.state) {
                        item.state.target.state.inverted = item.state.previousInversion;
                        item.state.target = null;
                    }
                    if (mult < 0) {
                        return;
                    }
                    const activeItems = context.activeItems ?? game.inventory.filter(Boolean);
                    const candidates = activeItems.filter(inst => inst !== item);
                    if (candidates.length === 0) return;
                    const target = candidates[Math.floor(Math.random() * candidates.length)];
                    target.state = target.state || {};
                    item.state.previousInversion = !!target.state.inverted;
                    target.state.inverted = !target.state.inverted;
                    item.state.target = target;
                    context.messages = context.messages || [];
                    context.messages.push(`Entropy Shard warps ${target.name}!`);
                },
                onFlipEnd(context, game, item) {
                    if (item.state.target && item.state.target.state) {
                        item.state.target.state.inverted = item.state.previousInversion;
                        item.state.target = null;
                    }
                }
            })
        ];
    }
                initState: () => ({ triggered: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    item.state.triggered = Math.random() < 0.1;
                    if (!item.state.triggered) return;
                    if (mult > 0) {
                        context.coinSplitter = true;
                    } else {
                        context.coinSplitterPenalty = true;
                    }
                },
                onFlipEnd(context, game, item) {
                    item.state.triggered = false;
                }
            }),
            makeItem({
                id: 'mercy_coin',
                name: 'Mercy Coin',
                icon: '??',
                rarity: 'rare',
                durability: 15,
                description: 'Stops you from getting crushed by bad luck.',
                effect: 'Prevents losing streaks longer than 3 by forcing a win.',
                onResult(payload, game, item) {
                    const mult = getMultiplier(item);
                    if (mult > 0 && !payload.won && game.lossStreak >= 3) {
                        payload.forceWin = true;
                        item.state.forceBreak = 'Mercy Coin prevented another loss.';
                    }
                    if (mult < 0 && payload.won && game.streak >= 3) {
                        payload.forceLoss = true;
                        item.state.forceBreak = 'Mercy Coin demanded a loss.';
                    }
                }
            }),
            makeItem({
                id: 'entropy_shard',
                name: 'Entropy Shard',
                icon: '??',
                rarity: 'legendary',
                durability: 20,
                description: 'Makes your items chaotic ? effects invert randomly.',
                effect: 'Each round, inverts one equipped item?s effect.',
                initState: () => ({ target: null, previousInversion: false }),
                onPreFlip(context, game, item) {
                    const mult = getMultiplier(item);
                    if (item.state.target && item.state.target.state) {
                        item.state.target.state.inverted = item.state.previousInversion;
                        item.state.target = null;
                    }
                    if (mult < 0) {
                        return;
                    }
                    const activeItems = context.activeItems ?? game.inventory.filter(Boolean);
                    const candidates = activeItems.filter(inst => inst !== item);
                    if (candidates.length === 0) return;
                    const target = candidates[Math.floor(Math.random() * candidates.length)];
                    target.state = target.state || {};
                    item.state.previousInversion = !!target.state.inverted;
                    target.state.inverted = !target.state.inverted;
                    item.state.target = target;
                    context.messages = context.messages || [];
                    context.messages.push(`Entropy Shard warps ${target.name}!`);
                },
                onFlipEnd(context, game, item) {
                    if (item.state.target && item.state.target.state) {
                        item.state.target.state.inverted = item.state.previousInversion;
                        item.state.target = null;
                    }
                }
            })
        ];
    }



    openShop() {
        const modal = document.getElementById('shopModal');
        modal.classList.add('show');
        
        this.updateShopDisplay();
        this.generateShopStock();
    }
    
    updateShopDisplay() {
        // Update bank display
        document.getElementById('shopBank').textContent = this.bank;
        
        // Update status
        const statusEl = document.getElementById('shopStatus');
        statusEl.textContent = 'SHOP OPEN 24/7 ? STOCK REFRESHES EACH VISIT';
        statusEl.style.color = '#4ecdc4';
        
        // Update inventory display
        this.updateInventoryDisplay();
    }
    
    generateShopStock() {
        const shopItemsDiv = document.getElementById('shopItems');
        shopItemsDiv.innerHTML = '';
        
        // Rotate stock - show 6 random items
        const availableItems = [...this.shopItems];
        const stock = [];
        
        for (let i = 0; i < Math.min(6, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            stock.push(availableItems.splice(randomIndex, 1)[0]);
        }
        
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
                    <span class="item-price">${scaledPrice} coins</span>
                </div>
                <div class="item-title">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-effect">${item.effect}</div>
                <div class="item-durability">Durability: ${item.durability ?? item.maxDurability ?? item.uses ?? 'N/A'}</div>
            `;
            
            itemDiv.addEventListener('click', () => {
                this.purchaseItem(item, scaledPrice);
            });
            
            shopItemsDiv.appendChild(itemDiv);
        });
    }
    
    createItemInstance(definition) {
        const baseDurability = definition.durability ?? definition.maxDurability ?? definition.uses ?? 1;
        return {
            id: definition.id,
            name: definition.name,
            icon: definition.icon,
            rarity: definition.rarity,
            description: definition.description,
            effect: definition.effect,
            price: definition.price,
            durability: baseDurability,
            maxDurability: baseDurability,
            remainingDurability: baseDurability,
            onPreFlip: definition.onPreFlip,
            onResult: definition.onResult,
            onAfterResult: definition.onAfterResult,
            onEventCheck: definition.onEventCheck,
            onRandomEvent: definition.onRandomEvent,
            onFlipEnd: definition.onFlipEnd,
            state: definition.initState ? definition.initState() : {}
        };
    }
    
    forEachActiveItem(callback) {
        this.inventory.forEach((item, index) => {
            if (item) {
                callback(item, index);
            }
        });
    }
    
    getActiveItems() {
        const items = [];
        this.forEachActiveItem((item) => items.push(item));
        return items;
    }
    
    applyItemHook(hookName, ...args) {
        this.forEachActiveItem((item, index) => {
            const handler = item[hookName];
            if (typeof handler === 'function') {
                handler(...args, this, item, index);
            }
        });
    }
    
    buildFlipContext() {
        const context = {
            playerChoice: this.playerChoice,
            headsChance: 0.5,
            tailsChance: 0.5,
            playerWinChanceModifier: 0,
            rewardMultiplier: 1,
            rewardBonus: 0,
            scoreBonusOnWin: 0,
            flatCoinGain: 0,
            eventChanceMultiplier: 1,
            eventChanceBonus: 0,
            cancelEvent: false,
            blockEventReason: null,
            eventCancelRequests: [],
            forceEventTrigger: false,
            forceResult: null,
            doubleOutcome: false,
            halfOutcome: false,
            coinSplitter: false,
            coinSplitterPenalty: false,
            messages: [],
            activeItems: this.getActiveItems()
        };
        this.applyItemHook('onPreFlip', context);
        return context;
    }
    
    determineFlipOutcome(context) {
        const opposite = this.playerChoice === 'heads' ? 'tails' : 'heads';
        let headsChance = Math.max(0, context.headsChance);
        let tailsChance = Math.max(0, context.tailsChance);
        const total = headsChance + tailsChance;
        if (total <= 0) {
            headsChance = 0.5;
            tailsChance = 0.5;
        } else {
            headsChance /= total;
            tailsChance /= total;
        }
        let winChance = this.playerChoice === 'heads' ? headsChance : tailsChance;
        winChance += context.playerWinChanceModifier || 0;
        
        if (this.getUpgradeBonus) {
            winChance += this.getUpgradeBonus('winChance');
        }
        
        if (this.activeEffects.predictionBuff) {
            winChance += this.activeEffects.predictionBuff;
        }
        
        if (this.activeEffects.steadyCore) {
            winChance += 0.08;
        }
        
        if (this.activeEffects.edgeBias) {
            const edgeBiasTier = Math.min(this.activeEffects.edgeBias, 4);
            const edgeBiasValues = [0.01, 0.02, 0.03, 0.05];
            winChance += edgeBiasValues[edgeBiasTier - 1];
        }
        
        if (this.activeEffects.coinParadox) {
            winChance += 0.08;
        }
        
        if (this.activeEffects.luckyCharm) {
            winChance = 1;
            this.activeEffects.luckyCharm = false;
        }
        
        winChance = Math.min(Math.max(winChance, 0), 1);
        
        let result;
        if (context.forceResult) {
            result = context.forceResult;
        } else {
            result = Math.random() < winChance ? this.playerChoice : opposite;
            if (context.coinSplitter && result !== this.playerChoice) {
                const secondWin = Math.random() < winChance;
                const secondResult = secondWin ? this.playerChoice : opposite;
                if (secondResult === this.playerChoice) {
                    result = secondResult;
                }
            }
            if (context.coinSplitterPenalty && result === this.playerChoice) {
                const penaltyWin = Math.random() < winChance;
                const penaltyResult = penaltyWin ? this.playerChoice : opposite;
                if (penaltyResult !== this.playerChoice) {
                    result = penaltyResult;
                }
            }
        }
        
        const payload = {
            result,
            originalResult: result,
            playerChoice: this.playerChoice,
            won: result === this.playerChoice,
            context
        };
        payload.upcomingStreak = this.streak + (payload.won ? 1 : 0);
        payload.upcomingLossStreak = this.lossStreak + (payload.won ? 0 : 1);
        payload.upcomingFlipCount = this.itemRuntimeState.flipCount + 1;
        
        this.applyItemHook('onResult', payload);
        
        if (payload.forceWin) {
            payload.result = this.playerChoice;
            payload.won = true;
        } else if (payload.forceLoss) {
            payload.result = opposite;
            payload.won = false;
        } else {
            payload.won = payload.result === this.playerChoice;
        }
        
        return payload;
    }
    
    finalizeFlipOutcome(payload) {
        const context = payload.context || {};
        this.handleResult(payload.result, context);
        this.applyItemHook('onAfterResult', payload);
        
        if (payload.won && context.scoreBonusOnWin) {
            this.score += Math.round(context.scoreBonusOnWin);
            this.updateDisplay();
        }
        
        if (context.flatCoinGain) {
            this.bank += Math.round(context.flatCoinGain);
            localStorage.setItem('bank', this.bank);
            this.updateDisplay();
        }
        
        if (payload.won && context.doubleOutcome) {
            this.applyAdditionalWin(payload);
        }
        
        if (payload.won && context.halfOutcome) {
            this.applyHalfOutcome(payload);
        }
        
        this.itemRuntimeState.lastFlipResult = payload.result;
        this.itemRuntimeState.flipCount += 1;
        
        this.applyItemHook('onFlipEnd', context);
        const brokenMessages = this.consumeItemDurability(context);
        if (brokenMessages.length > 0) {
            this.showMessage(brokenMessages[brokenMessages.length - 1]);
        }
        this.updateInventoryDisplay();
    }
    
    applyAdditionalWin(payload) {
        if (!this.lastWinDetails) return;
        const context = payload.context || {};
        const rewardMultiplier = context.rewardMultiplier ?? 1;
        const multiplierGrowth = this.lastWinDetails.multiplierGrowth ?? 0.1;
        this.streak += 1;
        this.multiplier = 1.0 + (this.streak * multiplierGrowth);
        const bonusPoints = Math.round(this.basePoints * this.multiplier * rewardMultiplier);
        this.score += bonusPoints;
        this.showMessage('DOUBLE OR NOTHING! EXTRA WIN COUNTED!');
        this.checkStreakMilestones();
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
            localStorage.setItem('bestStreak', this.bestStreak);
            this.updatePlayerTitle();
        }
        this.checkAchievements();
        this.updateCoinEffects();
        this.updateDisplay();
    }
    
    applyHalfOutcome(payload) {
        if (!this.lastWinDetails) return;
        const reduction = Math.round(this.lastWinDetails.points / 2);
        if (reduction > 0) {
            this.score = Math.max(0, this.score - reduction);
            this.showMessage('DOUBLE OR NOTHING BACKFIRED! REWARD HALVED.');
            this.updateDisplay();
        }
    }
    
    consumeItemDurability(context) {
        const messages = [];
        this.forEachActiveItem((item, index) => {
            const max = item.maxDurability ?? item.durability ?? null;
            if (item.remainingDurability == null && max != null) {
                item.remainingDurability = max;
            }
            const forceBreakReason = item.state?.forceBreak;
            if (forceBreakReason) {
                this.inventory[index] = null;
                messages.push(forceBreakReason);
                delete item.state.forceBreak;
                return;
            }
            if (item.remainingDurability != null) {
                item.remainingDurability = Math.max(0, item.remainingDurability - 1);
                if (item.remainingDurability <= 0) {
                    this.inventory[index] = null;
                    messages.push(`${item.name} has broken.`);
                }
            }
        });
        return messages;
    }
    
    purchaseItem(item, price) {
        if (this.bank < price) {
            this.showMessage('NOT ENOUGH COINS!');
            return;
        }
        
        // Check inventory space
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            this.showMessage('INVENTORY FULL! USE AN ITEM FIRST!');
            return;
        }
        
        // Purchase item
        this.bank -= price;
        localStorage.setItem('bank', this.bank);
        
        // Add to inventory
        this.inventory[emptySlot] = this.createItemInstance(item);
        
        this.showMessage(`PURCHASED ${item.name.toUpperCase()}!`);
        this.updateDisplay();
        this.updateShopDisplay();
        this.generateShopStock(); // Refresh shop
        
        // Play purchase sound
        try {
            document.getElementById('celebrationSound').play();
        } catch(e) {}
    }
    
    updateInventoryDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        slots.forEach(slot => {
            const index = parseInt(slot.dataset.slot, 10);
            const item = this.inventory[index];
            
            if (item) {
                const remaining = item.remainingDurability ?? item.durability ?? item.uses ?? 0;
                const maxDurability = item.maxDurability ?? item.durability ?? item.uses ?? remaining;
                slot.classList.remove('empty');
                slot.innerHTML = `
                    <div class="item-in-slot">
                        <span class="item-icon">${item.icon || '??'}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-durability">Durability: ${remaining}/${maxDurability || '?'}</span>
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
                    
                    let icon = '?';
                    let name = effect;
                    let duration = '';
                    
                    if (effect === 'freezeMultiplier') {
                        icon = '??';
                        name = 'Frozen Multi';
                        duration = `${value.flips} flips`;
                    } else if (effect === 'greedGauge') {
                        icon = '??';
                        name = 'Greed Gauge';
                        duration = `${value} uses`;
                    } else if (effect === 'tacticalDelay') {
                        icon = '??';
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
        
        const durabilityText = `${item.remainingDurability ?? item.durability ?? 'N/A'}/${item.maxDurability ?? item.durability ?? 'N/A'}`;
        this.showMessage(`${item.name.toUpperCase()}: ${item.effect} (Durability ${durabilityText})`);
    }
    
    showShopUnlock() {
        const btn = document.getElementById('floatingShopBtn');
        btn.style.display = 'block';
        
        this.showMessage('SHOP IS NOW ALWAYS OPEN! STOCK REFRESHES OFTEN.');
        
        setTimeout(() => {
            if (btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }, 5000);
    }
    
    showShopAvailable() {
        this.showMessage('SHOP OPEN! CHECK OUT THE NEW STOCK.');
        
        const btn = document.getElementById('floatingShopBtn');
        btn.querySelector('.shop-text').textContent = 'SHOP OPEN!';
        btn.style.display = 'block';
        
        // Auto-hide after 5 seconds if not clicked
        setTimeout(() => {
            if (btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }, 5000);
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