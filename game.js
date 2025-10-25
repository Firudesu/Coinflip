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
        this.inventory = [null, null]; // Max 2 items
        this.shopUnlocked = false;
        this.shopAvailable = false; // Whether shop can be opened at current streak
        this.lastShopStreak = 0;
        this.activeEffects = {}; // Track active item effects
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
                this.showMessage('SHOP UNLOCKS AT 5 STREAK!');
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
        
        // Close shop button - marks shop as used for this streak
        document.getElementById('closeShop').addEventListener('click', () => {
            document.getElementById('shopModal').classList.remove('show');
            this.shopAvailable = false;  // Shop is now closed until next milestone
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
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
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
        
        // Check for random event before flip
        if (this.checkForRandomEvent) {
            const eventTriggered = this.checkForRandomEvent();
            if (eventTriggered) {
                console.log('Random event triggered!');
            }
        } else {
            console.log('Random events not initialized yet');
        }
        
        this.isFlipping = true;
        this.canvas.classList.add('flipping', 'disabled');
        document.getElementById('choiceContainer').classList.add('hidden');
        
        // Determine result with item effects and upgrades
        let winChance = 0.5;
        let isDoubleToss = false;
        let isSideLand = false;
        
        // Apply upgrade bonus
        if (this.getUpgradeBonus) {
            winChance += this.getUpgradeBonus('winChance');
        }
        
        // Apply coin flip item effects
        if (this.activeEffects.luckyCoin && this.activeEffects.luckyCoin.flips > 0) {
            if (this.playerChoice === 'heads') {
                winChance += this.activeEffects.luckyCoin.bonus;
            }
        }
        
        if (this.activeEffects.weightedTail && this.activeEffects.weightedTail.flips > 0) {
            if (this.playerChoice === 'tails') {
                winChance += this.activeEffects.weightedTail.bonus;
            }
        }
        
        if (this.activeEffects.luckySurge && this.activeEffects.luckySurge.flips > 0) {
            this.activeEffects.luckySurge.flipCount++;
            if (this.activeEffects.luckySurge.flipCount % 10 === 0) {
                this.activeEffects.luckySurge.surgeActive = true;
                this.activeEffects.luckySurge.surgeFlipsLeft = 3;
                this.showFloatingText(`⚡ Surge Active (+${Math.round(this.activeEffects.luckySurge.surgeChance * 100)}% Heads)`);
            }
            if (this.activeEffects.luckySurge.surgeActive && this.activeEffects.luckySurge.surgeFlipsLeft > 0) {
                if (this.playerChoice === 'heads') {
                    winChance += this.activeEffects.luckySurge.surgeChance;
                }
                this.activeEffects.luckySurge.surgeFlipsLeft--;
                if (this.activeEffects.luckySurge.surgeFlipsLeft <= 0) {
                    this.activeEffects.luckySurge.surgeActive = false;
                }
            }
        }
        
        if (this.activeEffects.perfectToss && this.activeEffects.perfectToss.flips > 0) {
            // For now, just add the bonus - could implement timing mini-game later
            winChance += this.activeEffects.perfectToss.skillBonus;
            this.showFloatingText(`🎯 Perfect Flip +${Math.round(this.activeEffects.perfectToss.skillBonus * 100)}%!`);
        }
        
        // Check for side land
        if (this.activeEffects.sideMaster && this.activeEffects.sideMaster.flips > 0) {
            if (Math.random() < this.activeEffects.sideMaster.sideChance) {
                isSideLand = true;
            }
        }
        
        // Handle double toss
        if (this.activeEffects.doubleToss && this.activeEffects.doubleToss.flips > 0) {
            isDoubleToss = true;
            let anyHeads = false;
            for (let i = 0; i < this.activeEffects.doubleToss.coinCount; i++) {
                if (Math.random() < winChance) {
                    anyHeads = true;
                    break;
                }
            }
            result = anyHeads ? this.playerChoice : (this.playerChoice === 'heads' ? 'tails' : 'heads');
        } else if (isSideLand) {
            result = 'side'; // Special side result
        } else {
            result = Math.random() < winChance ? this.playerChoice : 
                     (this.playerChoice === 'heads' ? 'tails' : 'heads');
        }
        
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
        const won = result === this.playerChoice || result === 'side';
        
        // Handle side land special case
        if (result === 'side' && this.activeEffects.sideMaster) {
            this.streak += this.activeEffects.sideMaster.streakBonus;
            this.multiplier += this.activeEffects.sideMaster.multiplier;
            this.showFloatingText(`💫 SIDE LAND! +${this.activeEffects.sideMaster.multiplier}x Multiplier!`);
        }
        
        // Process active event if any
        if (this.currentEvent && this.currentEvent.execute) {
            if (this.currentEvent.type !== 'skill' && this.currentEvent.type !== 'encounter') {
                this.currentEvent.execute(won);
            }
        }
        
        if (won) {
            this.streak++;
            
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
            
            // Process coin flip item effects on win
            this.processCoinFlipItemEffects(result, true);
            
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
            
            // Check new coin flip item streak saver first
            const streakSaved = this.processCoinFlipItemEffects(result, false);
            if (streakSaved) {
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Apply old streak saver (if still exists)
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
            
            // Process coin flip item effects on loss
            this.processCoinFlipItemEffects(result, false);
            
            // Clear some active effects
            delete this.activeEffects.freezeMultiplier;
        }
        
        // Decrease flip counts for all active coin flip items
        this.decreaseFlipCounts();
        
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
        
        // Shop unlocks at streak 5 and opens immediately
        if (this.streak === 5 && !this.shopUnlocked) {
            this.shopUnlocked = true;
            this.lastShopStreak = 5;
            localStorage.setItem('shopUnlocked', 'true');
            this.showShopUnlock();
            // Open shop automatically on first unlock
            setTimeout(() => {
                this.openShop();
            }, 2000);
        }
        
        // Shop reopens every 3 streaks after being unlocked (8, 11, 14, 17, 20, etc.)
        if (this.shopUnlocked && this.streak > 5 && (this.streak - 5) % 3 === 0) {
            // Shop is now available at this streak
            this.shopAvailable = true;
            this.lastShopStreak = this.streak;
            this.showShopAvailable();
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
                id: 'lucky_coin',
                name: 'Lucky Coin',
                icon: '✨',
                description: '+10% chance for the coin to land on Heads',
                effect: 'Coin Flip Item',
                price: 200,
                rarity: 'common',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 25,
                maxFlips: 25,
                costs: [200, 350, 500],
                bonuses: [0.1, 0.2, 0.3],
                apply: (level = 1) => {
                    const bonus = this.shopItems.find(item => item.id === 'lucky_coin').bonuses[level - 1];
                    this.activeEffects.luckyCoin = { level, bonus, flips: 25 };
                    this.showFloatingText(`✨ Lucky Coin Active (+${Math.round(bonus * 100)}% Heads)`);
                }
            },
            {
                id: 'weighted_tail',
                name: 'Weighted Tail',
                icon: '✨',
                description: '+10% chance for the coin to land on Tails',
                effect: 'Coin Flip Item',
                price: 200,
                rarity: 'common',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 25,
                maxFlips: 25,
                costs: [200, 350, 500],
                bonuses: [0.1, 0.2, 0.3],
                apply: (level = 1) => {
                    const bonus = this.shopItems.find(item => item.id === 'weighted_tail').bonuses[level - 1];
                    this.activeEffects.weightedTail = { level, bonus, flips: 25 };
                    this.showFloatingText(`✨ Weighted Tail (+${Math.round(bonus * 100)}% Tails)`);
                }
            },
            {
                id: 'double_toss',
                name: 'Double Toss',
                icon: '🪙',
                description: 'Flips two coins. If either lands Heads, it counts as a win',
                effect: 'Coin Flip Item',
                price: 350,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 10,
                maxFlips: 10,
                costs: [350, 500, 700],
                coinCounts: [2, 3, 4],
                apply: (level = 1) => {
                    const coinCount = this.shopItems.find(item => item.id === 'double_toss').coinCounts[level - 1];
                    this.activeEffects.doubleToss = { level, coinCount, flips: 10 };
                    this.showFloatingText(`✨ Multi Flip Active`);
                }
            },
            {
                id: 'jackpot_toss',
                name: 'Jackpot Toss',
                icon: '🔥',
                description: 'When 3 consecutive flips land the same, gain +5 multiplier for next flip',
                effect: 'Coin Flip Item',
                price: 400,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 30,
                maxFlips: 30,
                costs: [400, 600, 850],
                multipliers: [5, 10, 15],
                apply: (level = 1) => {
                    const multiplier = this.shopItems.find(item => item.id === 'jackpot_toss').multipliers[level - 1];
                    this.activeEffects.jackpotToss = { level, multiplier, flips: 30, consecutiveHistory: [] };
                    this.showFloatingText(`🔥 Jackpot Toss Active`);
                }
            },
            {
                id: 'streak_booster',
                name: 'Streak Booster',
                icon: '📈',
                description: 'Each time you win a flip, gain +1 streak bonus',
                effect: 'Coin Flip Item',
                price: 300,
                rarity: 'common',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 20,
                maxFlips: 20,
                costs: [300, 500, 700],
                bonuses: [1, 2, 3],
                apply: (level = 1) => {
                    const bonus = this.shopItems.find(item => item.id === 'streak_booster').bonuses[level - 1];
                    this.activeEffects.streakBooster = { level, bonus, flips: 20 };
                    this.showFloatingText(`📈 Streak Booster Active`);
                }
            },
            {
                id: 'streak_saver',
                name: 'Streak Saver',
                icon: '🛡️',
                description: 'When you lose, there\'s a 50% chance your streak is not reset',
                effect: 'Coin Flip Item',
                price: 400,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 15,
                maxFlips: 15,
                costs: [400, 600, 800],
                saveChances: [0.5, 0.75, 1.0],
                apply: (level = 1) => {
                    const saveChance = this.shopItems.find(item => item.id === 'streak_saver').saveChances[level - 1];
                    this.activeEffects.streakSaver = { level, saveChance, flips: 15 };
                    this.showFloatingText(`🛡️ Streak Saver Active`);
                }
            },
            {
                id: 'coin_combo',
                name: 'Coin Combo',
                icon: '🔥',
                description: 'Every time you land on Heads twice in a row, add +2x multiplier for the next flip',
                effect: 'Coin Flip Item',
                price: 350,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 25,
                maxFlips: 25,
                costs: [350, 500, 700],
                multipliers: [2, 4, 6],
                apply: (level = 1) => {
                    const multiplier = this.shopItems.find(item => item.id === 'coin_combo').multipliers[level - 1];
                    this.activeEffects.coinCombo = { level, multiplier, flips: 25, consecutiveHeads: 0 };
                    this.showFloatingText(`🔥 Coin Combo Active`);
                }
            },
            {
                id: 'tail_chain',
                name: 'Tail Chain',
                icon: '⚙️',
                description: 'Each time you land on Tails consecutively, gain +1 to total multiplier',
                effect: 'Coin Flip Item',
                price: 300,
                rarity: 'common',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 25,
                maxFlips: 25,
                costs: [300, 500, 700],
                bonuses: [1, 2, 3],
                apply: (level = 1) => {
                    const bonus = this.shopItems.find(item => item.id === 'tail_chain').bonuses[level - 1];
                    this.activeEffects.tailChain = { level, bonus, flips: 25, consecutiveTails: 0 };
                    this.showFloatingText(`⚙️ Tail Chain Active`);
                }
            },
            {
                id: 'side_master',
                name: 'Side Master',
                icon: '💫',
                description: 'If a coin lands on its side (rare 1% base chance), gain +10x multiplier and +3 streak',
                effect: 'Coin Flip Item',
                price: 500,
                rarity: 'epic',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 40,
                maxFlips: 40,
                costs: [500, 700, 950],
                multipliers: [10, 20, 30],
                streakBonuses: [3, 5, 8],
                sideChances: [0.01, 0.02, 0.03],
                apply: (level = 1) => {
                    const item = this.shopItems.find(item => item.id === 'side_master');
                    const multiplier = item.multipliers[level - 1];
                    const streakBonus = item.streakBonuses[level - 1];
                    const sideChance = item.sideChances[level - 1];
                    this.activeEffects.sideMaster = { level, multiplier, streakBonus, sideChance, flips: 40 };
                    this.showFloatingText(`💫 Side Master Active`);
                }
            },
            {
                id: 'lucky_surge',
                name: 'Lucky Surge',
                icon: '⚡',
                description: 'Every 10 flips, gain a burst +50% chance for Heads for the next 3 flips',
                effect: 'Coin Flip Item',
                price: 400,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 30,
                maxFlips: 30,
                costs: [400, 600, 800],
                surgeChances: [0.5, 0.75, 1.0],
                apply: (level = 1) => {
                    const surgeChance = this.shopItems.find(item => item.id === 'lucky_surge').surgeChances[level - 1];
                    this.activeEffects.luckySurge = { level, surgeChance, flips: 30, flipCount: 0, surgeActive: false, surgeFlipsLeft: 0 };
                    this.showFloatingText(`⚡ Lucky Surge Active`);
                }
            },
            {
                id: 'golden_streak',
                name: 'Golden Streak',
                icon: '💰',
                description: 'Each time streak hits 5, double your coin reward next flip',
                effect: 'Coin Flip Item',
                price: 400,
                rarity: 'rare',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 30,
                maxFlips: 30,
                costs: [400, 650, 900],
                rewardMultipliers: [2, 3, 4],
                apply: (level = 1) => {
                    const rewardMultiplier = this.shopItems.find(item => item.id === 'golden_streak').rewardMultipliers[level - 1];
                    this.activeEffects.goldenStreak = { level, rewardMultiplier, flips: 30 };
                    this.showFloatingText(`💰 Golden Streak Active`);
                }
            },
            {
                id: 'perfect_toss',
                name: 'Perfect Toss',
                icon: '🎯',
                description: 'Adds a visual skill-based quick-time flip chance for +20% success boost',
                effect: 'Coin Flip Item',
                price: 450,
                rarity: 'epic',
                category: 'Flip',
                type: 'consumable',
                maxLevel: 3,
                level: 1,
                flipsRemaining: 25,
                maxFlips: 25,
                costs: [450, 650, 850],
                skillBonuses: [0.2, 0.3, 0.4],
                apply: (level = 1) => {
                    const skillBonus = this.shopItems.find(item => item.id === 'perfect_toss').skillBonuses[level - 1];
                    this.activeEffects.perfectToss = { level, skillBonus, flips: 25 };
                    this.showFloatingText(`🎯 Perfect Toss Active`);
                }
            }
        ];
    }
    
    openShop() {
        // Check if shop should be accessible
        if (!this.shopUnlocked) {
            this.showMessage('SHOP UNLOCKS AT 5 STREAK!');
            return;
        }
        
        if (!this.shopAvailable && this.streak !== this.lastShopStreak) {
            const nextShop = this.getNextShopStreak();
            this.showMessage(`SHOP REOPENS AT STREAK ${nextShop}!`);
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
        if (this.streak >= 5 && this.streak % 5 === 0) {
            statusEl.textContent = 'NEW ITEMS AVAILABLE!';
            statusEl.style.color = '#4ecdc4';
        } else if (this.streak < 5) {
            statusEl.textContent = 'STREAK 5+ TO UNLOCK';
            statusEl.style.color = '#ff6b6b';
        } else {
            const nextShop = Math.ceil(this.streak / 5) * 5;
            statusEl.textContent = `NEXT SHOP AT ${nextShop} STREAK`;
            statusEl.style.color = '#ff6b6b';
        }
        
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
            // Check if item exists in inventory to determine price
            const existingItem = this.inventory.find(invItem => invItem && invItem.id === item.id);
            let currentPrice = item.price;
            let levelText = 'Level 1';
            let actionText = 'BUY';
            
            if (existingItem) {
                if (existingItem.level >= item.maxLevel) {
                    // At max level - show refill price (same as current level)
                    currentPrice = item.costs[existingItem.level - 1];
                    levelText = `Max Level - Refill Durability`;
                    actionText = 'REFILL';
                } else {
                    // Show next level price
                    currentPrice = item.costs[existingItem.level];
                    levelText = `Upgrade to Level ${existingItem.level + 1}`;
                    actionText = 'UPGRADE';
                }
            } else {
                currentPrice = item.costs[0];
            }
            
            const scaledPrice = Math.round(currentPrice * (1 + this.streak * 0.05)); // Price scales with streak
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
                <div class="item-level-info">${levelText}</div>
                <div class="item-description">${item.description}</div>
                <div class="item-effect">${item.effect}</div>
                <div class="item-flips">${item.maxFlips} flips duration</div>
                <div class="item-action">${actionText}</div>
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
        
        // Check if item already exists in inventory (for stacking)
        const existingSlot = this.inventory.findIndex(slot => slot && slot.id === item.id);
        
        if (existingSlot !== -1) {
            const existingItem = this.inventory[existingSlot];
            
            // If at max level, refill durability
            if (existingItem.level >= item.maxLevel) {
                existingItem.flipsRemaining = item.maxFlips;
                this.showMessage(`${item.name.toUpperCase()} DURABILITY RESTORED!`);
            } else {
                // Upgrade to next level
                existingItem.level++;
                existingItem.flipsRemaining = item.maxFlips;
                const nextCost = item.costs[existingItem.level - 1];
                this.showMessage(`${item.name.toUpperCase()} UPGRADED TO LEVEL ${existingItem.level}!`);
            }
        } else {
            // Check inventory space for new item
            const emptySlot = this.inventory.findIndex(slot => slot === null);
            if (emptySlot === -1) {
                this.showMessage('INVENTORY FULL! USE AN ITEM FIRST!');
                return;
            }
            
            // Add new item to inventory
            this.inventory[emptySlot] = {
                ...item,
                level: 1,
                flipsRemaining: item.maxFlips
            };
            this.showMessage(`PURCHASED ${item.name.toUpperCase()}!`);
        }
        
        // Purchase item
        this.bank -= price;
        localStorage.setItem('bank', this.bank);
        
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
        
        slots.forEach((slot, index) => {
            const item = this.inventory[index];
            
            if (item) {
                slot.classList.remove('empty');
                slot.innerHTML = `
                    <div class="item-in-slot">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-level">Lv.${item.level}/${item.maxLevel}</span>
                        <span class="item-flips">${item.flipsRemaining}/${item.maxFlips} flips</span>
                    </div>
                `;
                
                // Add visual indicator if item is depleted
                if (item.flipsRemaining <= 0) {
                    slot.classList.add('depleted');
                } else {
                    slot.classList.remove('depleted');
                }
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
        
        if (!item || item.flipsRemaining <= 0) {
            return;
        }
        
        // Apply item effect with current level
        item.apply(item.level);
        
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
    
    // Coin Flip Item System Methods
    processCoinFlipItemEffects(result, won) {
        // Streak Booster
        if (won && this.activeEffects.streakBooster && this.activeEffects.streakBooster.flips > 0) {
            this.streak += this.activeEffects.streakBooster.bonus;
            this.showFloatingText(`+${this.activeEffects.streakBooster.bonus} Streak!`);
        }
        
        // Jackpot Toss - track consecutive results
        if (this.activeEffects.jackpotToss && this.activeEffects.jackpotToss.flips > 0) {
            this.activeEffects.jackpotToss.consecutiveHistory.push(result);
            if (this.activeEffects.jackpotToss.consecutiveHistory.length > 3) {
                this.activeEffects.jackpotToss.consecutiveHistory.shift();
            }
            
            if (this.activeEffects.jackpotToss.consecutiveHistory.length === 3) {
                const allSame = this.activeEffects.jackpotToss.consecutiveHistory.every(r => r === this.activeEffects.jackpotToss.consecutiveHistory[0]);
                if (allSame) {
                    this.multiplier += this.activeEffects.jackpotToss.multiplier;
                    this.showFloatingText(`🔥 JACKPOT +${this.activeEffects.jackpotToss.multiplier}x Multiplier!`);
                }
            }
        }
        
        // Coin Combo - track consecutive heads
        if (this.activeEffects.coinCombo && this.activeEffects.coinCombo.flips > 0) {
            if (result === 'heads') {
                this.activeEffects.coinCombo.consecutiveHeads++;
                if (this.activeEffects.coinCombo.consecutiveHeads >= 2) {
                    this.multiplier += this.activeEffects.coinCombo.multiplier;
                    this.showFloatingText(`🔥 Combo x${this.activeEffects.coinCombo.multiplier} Active!`);
                    this.activeEffects.coinCombo.consecutiveHeads = 0;
                }
            } else {
                this.activeEffects.coinCombo.consecutiveHeads = 0;
            }
        }
        
        // Tail Chain - track consecutive tails
        if (this.activeEffects.tailChain && this.activeEffects.tailChain.flips > 0) {
            if (result === 'tails') {
                this.activeEffects.tailChain.consecutiveTails++;
                this.multiplier += this.activeEffects.tailChain.bonus;
                this.showFloatingText(`⚙️ Tail Chain +${this.activeEffects.tailChain.bonus} Multiplier!`);
            } else {
                this.activeEffects.tailChain.consecutiveTails = 0;
            }
        }
        
        // Golden Streak - check for streak milestones
        if (this.activeEffects.goldenStreak && this.activeEffects.goldenStreak.flips > 0) {
            if (this.streak > 0 && this.streak % 5 === 0) {
                // Apply reward multiplier on next win
                this.activeEffects.goldenStreakBonus = this.activeEffects.goldenStreak.rewardMultiplier;
                this.showFloatingText(`💰 Golden Streak Bonus!`);
            }
        }
        
        // Apply Golden Streak bonus if active
        if (won && this.activeEffects.goldenStreakBonus) {
            this.score *= this.activeEffects.goldenStreakBonus;
            delete this.activeEffects.goldenStreakBonus;
        }
        
        // Streak Saver - handle loss protection
        if (!won && this.activeEffects.streakSaver && this.activeEffects.streakSaver.flips > 0) {
            if (Math.random() < this.activeEffects.streakSaver.saveChance) {
                this.showFloatingText(`🛡️ Streak Saved!`);
                // Don't reset streak - return early to prevent normal loss handling
                return true; // Indicates streak was saved
            }
        }
        
        return false; // Normal processing
    }
    
    decreaseFlipCounts() {
        // Decrease flip counts for all active items
        Object.keys(this.activeEffects).forEach(key => {
            const effect = this.activeEffects[key];
            if (effect && typeof effect === 'object' && effect.flips !== undefined) {
                effect.flips--;
                if (effect.flips <= 0) {
                    delete this.activeEffects[key];
                    this.showFloatingText(`${key} expired!`);
                }
            }
        });
        
        // Update inventory item flip counts
        this.inventory.forEach(item => {
            if (item && item.flipsRemaining > 0) {
                // Check if this item type is active
                const effectKey = this.getEffectKeyFromItemId(item.id);
                if (this.activeEffects[effectKey]) {
                    item.flipsRemaining--;
                }
            }
        });
    }
    
    getEffectKeyFromItemId(itemId) {
        const mapping = {
            'lucky_coin': 'luckyCoin',
            'weighted_tail': 'weightedTail',
            'double_toss': 'doubleToss',
            'jackpot_toss': 'jackpotToss',
            'streak_booster': 'streakBooster',
            'streak_saver': 'streakSaver',
            'coin_combo': 'coinCombo',
            'tail_chain': 'tailChain',
            'side_master': 'sideMaster',
            'lucky_surge': 'luckySurge',
            'golden_streak': 'goldenStreak',
            'perfect_toss': 'perfectToss'
        };
        return mapping[itemId];
    }
    
    showFloatingText(text) {
        // Create floating text element
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text';
        floatingText.textContent = text;
        floatingText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #4ecdc4;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            font-weight: bold;
            text-shadow: 2px 2px 0px #000;
            pointer-events: none;
            z-index: 1000;
            animation: floatUp 2s ease-out forwards;
        `;
        
        // Add to game container
        document.getElementById('gameContainer').appendChild(floatingText);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 2000);
    }
}

// Add animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -70%) scale(1.1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -90%) scale(0.8);
        }
    }
    
    .depleted {
        opacity: 0.5;
        filter: grayscale(100%);
    }
    
    .item-level {
        font-size: 10px;
        color: #4ecdc4;
    }
    
    .item-flips {
        font-size: 10px;
        color: #ff6b6b;
    }
    
    .item-level-info {
        font-size: 11px;
        color: #ffeb3b;
        margin: 2px 0;
    }
    
    .item-action {
        font-size: 10px;
        color: #4ecdc4;
        font-weight: bold;
        margin-top: 4px;
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CoinFlipGame();
});