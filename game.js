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
        
        // Shop system with durability
        this.equippedItems = [null, null, null]; // 3 equip slots
        this.unlockedSlots = 1; // Start with 1 slot unlocked
        this.shopUnlocked = false;
        this.shopRotationTimer = null;
        this.shopRotationTimeLeft = 300; // 5 minutes in seconds
        this.currentShopItems = []; // Currently displayed items
        this.activeEffects = {}; // Track active item effects
        this.shopItems = this.defineShopItems();
        this.ownedItems = []; // All purchased items (persist across sessions)
        this.tokens = 0; // Workshop currency
        
        // Workshop upgrades
        this.workshopUpgrades = {};
        
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
        this.ownedItems = JSON.parse(localStorage.getItem('ownedItems') || '[]');
        this.equippedItems = JSON.parse(localStorage.getItem('equippedItems') || '[null, null, null]');
        this.tokens = parseInt(localStorage.getItem('tokens') || '0');
        this.workshopUpgrades = JSON.parse(localStorage.getItem('workshopUpgrades') || '{}');
        
        // Check slot unlocks based on best streak
        if (this.bestStreak >= 25) {
            this.unlockedSlots = 3;
        } else if (this.bestStreak >= 10) {
            this.unlockedSlots = 2;
        } else {
            this.unlockedSlots = 1;
        }
        
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
        
        // Shop button - always available after unlock
        document.getElementById('shopBtn').addEventListener('click', () => {
            if (this.shopUnlocked) {
                this.openShop();
            } else {
                this.showMessage('SHOP UNLOCKS AT 3 STREAK!');
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
        
        // Equipment slots
        document.querySelectorAll('.equip-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.openEquipMenu(index);
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
        
        // Apply workshop upgrades
        if (this.workshopUpgrades.weightedCoin) {
            winChance += 0.01 * (this.workshopUpgrades.weightedCoin || 0);
        }
        if (this.workshopUpgrades.coinSoul) {
            const totalWins = this.streakRecords.reduce((sum, record) => sum + record.streak, 0);
            winChance += (Math.floor(totalWins / 50) * 0.005);
        }
        
        // Apply equipped item effects
        if (this.activeEffects.luckyCharmBonus) {
            winChance += this.activeEffects.luckyCharmBonus;
        }
        
        // Hot Hand effect
        if (this.activeEffects.hotHandActive && this.recentFlips) {
            const last3 = this.recentFlips.slice(-3);
            if (last3.length === 3 && last3.every(f => f === true)) {
                winChance += 0.05;
            }
        }
        
        // Cold Blooded effect
        if (this.activeEffects.coldBloodedActive && this.recentFlips) {
            const last2 = this.recentFlips.slice(-2);
            if (last2.length === 2 && last2.every(f => f === false)) {
                winChance += 0.05;
            }
        }
        
        // Mirror Coin effect
        if (this.activeEffects.mirrorCoinActive && this.lastFlipResult && Math.random() < 0.1) {
            result = this.lastFlipResult;
        } else {
            // Coin Splitter effect - double flip chance
            if (this.activeEffects.coinSplitterActive && Math.random() < 0.05) {
                // Two chances to win
                const flip1 = Math.random() < winChance;
                const flip2 = Math.random() < winChance;
                result = (flip1 || flip2) ? this.playerChoice : 
                         (this.playerChoice === 'heads' ? 'tails' : 'heads');
            } else {
                result = Math.random() < winChance ? this.playerChoice : 
                         (this.playerChoice === 'heads' ? 'tails' : 'heads');
            }
        }
        
        // Second Chance workshop upgrade
        if (this.workshopUpgrades.secondChance && result !== this.playerChoice) {
            if (Math.random() < 0.05 * (this.workshopUpgrades.secondChance || 0)) {
                result = this.playerChoice;
                this.showMessage('SECOND CHANCE ACTIVATED!');
            }
        }
        
        // Twin Toss workshop upgrade
        if (this.workshopUpgrades.twinToss && Math.random() < 0.02 * (this.workshopUpgrades.twinToss || 0)) {
            result = this.playerChoice; // Both sides match, auto-win
            this.showMessage('TWIN TOSS! DOUBLE RESULT!');
        }
        
        this.lastFlipResult = result;
        
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
        
        // Apply durability loss to equipped items
        this.applyDurabilityLoss();
        
        if (won) {
            this.streak++;
            
            // Track recent flips for Hot Hand/Cold Blooded
            if (this.recentFlips) {
                this.recentFlips.push(true);
                if (this.recentFlips.length > 3) this.recentFlips.shift();
            }
            
            // Apply multiplier growth
            let multiplierGrowth = 0.1;
            
            // Streak Booster effect
            if (this.activeEffects.streakBoosterActive) {
                multiplierGrowth += 0.05;
            }
            
            // Risk Taker effect
            if (this.activeEffects.riskTakerActive) {
                multiplierGrowth += 0.15;
            }
            
            // Workshop upgrade: Momentum Engine
            if (this.workshopUpgrades.momentumEngine) {
                multiplierGrowth += 0.02 * (this.workshopUpgrades.momentumEngine || 0);
            }
            
            // Apply multiplier
            this.multiplier = 1.0 + (this.streak * multiplierGrowth);
            
            // Multiplier Bond effect
            if (this.activeEffects.multiplierBondActive) {
                this.permanentMultiplier = Math.floor(this.streak / 10);
                this.multiplier += this.permanentMultiplier;
            }
            
            let points = Math.round(this.basePoints * this.multiplier);
            
            // Double Down effect
            if (this.activeEffects.doubleDownActive) {
                this.consecutiveWins = (this.consecutiveWins || 0) + 1;
                if (this.consecutiveWins >= 5) {
                    points *= 2;
                    this.consecutiveWins = 0;
                    this.showMessage('DOUBLE DOWN! 2X REWARD!');
                }
            }
            
            // Golden Edge workshop upgrade
            if (this.workshopUpgrades.goldenEdge && Math.random() < 0.01 * (this.workshopUpgrades.goldenEdge || 0)) {
                points *= 2;
                this.showMessage('GOLDEN EDGE! DOUBLE COINS!');
            }
            
            // Echo Flip workshop upgrade
            if (this.workshopUpgrades.echoFlip && Math.random() < 0.02 * (this.workshopUpgrades.echoFlip || 0)) {
                this.score += points;
                this.showMessage('ECHO FLIP! BONUS WIN!');
            }
            
            // Jackpot Fever effect
            if (this.activeEffects.jackpotFeverActive && Math.random() < 0.005) {
                const jackpot = points * 50;
                this.score += jackpot;
                this.showMessage(`JACKPOT FEVER! +${jackpot} COINS!`);
                this.triggerEpicBankCelebration(this.streak, jackpot);
            }
            
            this.score += points;
            
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
            
            // Track recent flips for Hot Hand/Cold Blooded
            if (this.recentFlips) {
                this.recentFlips.push(false);
                if (this.recentFlips.length > 3) this.recentFlips.shift();
            }
            
            // Coin Saver effect
            if (this.activeEffects.coinSaverActive && Math.random() < 0.25) {
                this.showMessage('COIN SAVER! STREAK PRESERVED!');
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Safety Net workshop upgrade
            if (this.workshopUpgrades.safetyNet && this.workshopUpgrades.safetyNet > 0) {
                this.multiplier = this.multiplier / 2;
                this.showMessage('SAFETY NET! KEPT HALF MULTIPLIER!');
                // Don't return, continue with normal loss but keep multiplier
            }
            
            // Reset consecutive wins for Double Down
            if (this.activeEffects.doubleDownActive) {
                this.consecutiveWins = 0;
            }
            
            // Reset Risk Taker multiplier
            if (this.activeEffects.riskTakerActive) {
                this.multiplier = 1.0;
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
            
            // Apply Bank Magnet effect
            if (this.activeEffects.bankMagnetBonus) {
                bankedAmount = Math.floor(bankedAmount * (1 + this.activeEffects.bankMagnetBonus));
                this.showMessage(`BANK MAGNET! +${Math.round(this.activeEffects.bankMagnetBonus * 100)}% BONUS!`);
            }
            
            // Bank Shield workshop upgrade
            if (this.workshopUpgrades.bankShield) {
                const shieldAmount = Math.floor(bankedAmount * 0.05 * (this.workshopUpgrades.bankShield || 0));
                this.shieldedCoins = (this.shieldedCoins || 0) + shieldAmount;
                this.showMessage(`BANK SHIELD! ${shieldAmount} COINS PROTECTED!`);
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
            localStorage.setItem('shopUnlocked', 'true');
            this.showShopUnlock();
            // Open shop automatically on first unlock
            setTimeout(() => {
                this.openShop();
            }, 2000);
        }
        
        // Check for slot unlocks
        if (this.streak === 10 && this.unlockedSlots < 2) {
            this.unlockedSlots = 2;
            this.showMessage('2ND EQUIPMENT SLOT UNLOCKED!');
        }
        if (this.streak === 25 && this.unlockedSlots < 3) {
            this.unlockedSlots = 3;
            this.showMessage('3RD EQUIPMENT SLOT UNLOCKED!');
        }
        
        // Award tokens at certain milestones
        const tokenMilestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
        if (tokenMilestones.includes(this.streak)) {
            const tokensEarned = Math.floor(this.streak / 5);
            this.tokens += tokensEarned;
            localStorage.setItem('tokens', this.tokens);
            this.showMessage(`EARNED ${tokensEarned} WORKSHOP TOKENS!`);
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
    
    // Shop System Methods with Durability
    defineShopItems() {
        return [
            // Common Items
            {
                id: 'lucky_charm',
                name: 'Lucky Charm',
                icon: '🍀',
                description: '+2% win chance',
                effect: 'Entry-level consistency boost',
                price: 500,
                rarity: 'common',
                durabilityLossChance: 0.01,
                durability: 100,
                maxDurability: 100,
                repairCost: 125
            },
            {
                id: 'streak_booster',
                name: 'Streak Booster',
                icon: '📈',
                description: '+0.05 multiplier gain per correct flip',
                effect: 'Core streak build item',
                price: 800,
                rarity: 'common',
                durabilityLossChance: 0.01,
                durability: 100,
                maxDurability: 100,
                repairCost: 200
            },
            {
                id: 'bank_magnet',
                name: 'Bank Magnet',
                icon: '🧲',
                description: '+10% bank value when cashing out',
                effect: 'Economic playstyle',
                price: 1000,
                rarity: 'common',
                durabilityLossChance: 0.01,
                durability: 100,
                maxDurability: 100,
                repairCost: 250
            },
            
            // Rare Items
            {
                id: 'coin_saver',
                name: 'Coin Saver',
                icon: '💾',
                description: '25% chance to not lose streak on fail',
                effect: 'Popular defensive item',
                price: 1200,
                rarity: 'rare',
                durabilityLossChance: 0.02,
                durability: 100,
                maxDurability: 100,
                repairCost: 300
            },
            {
                id: 'mirror_coin',
                name: 'Mirror Coin',
                icon: '🪞',
                description: '10% chance to copy previous flip result',
                effect: 'Great for pattern play',
                price: 1500,
                rarity: 'rare',
                durabilityLossChance: 0.02,
                durability: 100,
                maxDurability: 100,
                repairCost: 375
            },
            {
                id: 'hot_hand',
                name: 'Hot Hand',
                icon: '🔥',
                description: '+5% win chance if last 3 flips were wins',
                effect: 'Builds momentum',
                price: 1200,
                rarity: 'rare',
                durabilityLossChance: 0.02,
                durability: 100,
                maxDurability: 100,
                repairCost: 300
            },
            {
                id: 'cold_blooded',
                name: 'Cold Blooded',
                icon: '❄️',
                description: '+5% win chance if last 2 flips were losses',
                effect: 'Recovery-oriented build',
                price: 1200,
                rarity: 'rare',
                durabilityLossChance: 0.02,
                durability: 100,
                maxDurability: 100,
                repairCost: 300
            },
            
            // Epic Items
            {
                id: 'double_down',
                name: 'Double Down',
                icon: '💎',
                description: 'After 5 correct flips, next flip reward x2',
                effect: 'Mid-run risk-reward',
                price: 2500,
                rarity: 'epic',
                durabilityLossChance: 0.03,
                durability: 100,
                maxDurability: 100,
                repairCost: 625
            },
            {
                id: 'risk_taker',
                name: 'Risk Taker',
                icon: '🎲',
                description: 'Each consecutive win gives +0.15 multiplier, lose resets',
                effect: 'High-risk scaling item',
                price: 3000,
                rarity: 'epic',
                durabilityLossChance: 0.03,
                durability: 100,
                maxDurability: 100,
                repairCost: 750
            },
            {
                id: 'coin_splitter',
                name: 'Coin Splitter',
                icon: '➗',
                description: '5% chance for coin to double flip (two chances per guess)',
                effect: 'RNG amplifier',
                price: 3500,
                rarity: 'epic',
                durabilityLossChance: 0.03,
                durability: 100,
                maxDurability: 100,
                repairCost: 875
            },
            
            // Legendary Items
            {
                id: 'multiplier_bond',
                name: 'Multiplier Bond',
                icon: '🔗',
                description: 'Every 10 streaks adds +1 permanent multiplier until game over',
                effect: 'Strong late-game scaling',
                price: 6000,
                rarity: 'legendary',
                durabilityLossChance: 0.04,
                durability: 100,
                maxDurability: 100,
                repairCost: 1500
            },
            {
                id: 'jackpot_fever',
                name: 'Jackpot Fever',
                icon: '💰',
                description: '0.5% chance per flip to win 50× coins',
                effect: 'Rare event item',
                price: 10000,
                rarity: 'legendary',
                durabilityLossChance: 0.05,
                durability: 100,
                maxDurability: 100,
                repairCost: 2500
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
        
        // Start rotation timer if not already running
        if (!this.shopRotationTimer) {
            this.startShopRotation();
        }
        
        this.updateShopDisplay();
        this.generateShopStock();
    }
    
    startShopRotation() {
        // Rotate items every 5 minutes
        this.shopRotationTimeLeft = 300;
        this.rotateShopItems();
        
        // Clear any existing timer
        if (this.shopRotationTimer) {
            clearInterval(this.shopRotationTimer);
        }
        
        this.shopRotationTimer = setInterval(() => {
            this.shopRotationTimeLeft--;
            
            if (this.shopRotationTimeLeft <= 0) {
                this.shopRotationTimeLeft = 300;
                this.rotateShopItems();
                this.generateShopStock();
                this.showMessage('SHOP ITEMS ROTATED!');
            }
            
            this.updateRotationTimer();
        }, 1000);
    }
    
    rotateShopItems() {
        // Select 4 random items from the pool
        const availableItems = [...this.shopItems];
        this.currentShopItems = [];
        
        for (let i = 0; i < 4 && availableItems.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            this.currentShopItems.push(availableItems.splice(randomIndex, 1)[0]);
        }
    }
    
    updateRotationTimer() {
        const timerEl = document.getElementById('shopRotationTimer');
        if (timerEl) {
            const minutes = Math.floor(this.shopRotationTimeLeft / 60);
            const seconds = this.shopRotationTimeLeft % 60;
            timerEl.textContent = `New items in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateShopDisplay() {
        // Update bank display
        document.getElementById('shopBank').textContent = this.bank;
        
        // Update status
        const statusEl = document.getElementById('shopStatus');
        statusEl.textContent = 'SHOP OPEN - ITEMS ROTATE EVERY 5 MINUTES';
        statusEl.style.color = '#4ecdc4';
        
        // Update equipment display
        this.updateEquipmentDisplay();
    }
    
    generateShopStock() {
        const shopItemsDiv = document.getElementById('shopItems');
        shopItemsDiv.innerHTML = '';
        
        // Show current 4 items
        this.currentShopItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            // Check if player already owns this item
            const ownedItem = this.ownedItems.find(owned => owned.id === item.id);
            
            if (ownedItem) {
                // Show repair option if item is damaged
                if (ownedItem.durability < ownedItem.maxDurability) {
                    itemDiv.innerHTML = `
                        <div class="item-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>
                        <div class="item-header">
                            <span class="item-icon">${item.icon}</span>
                            <span class="item-price">${ownedItem.repairCost} 🪙</span>
                        </div>
                        <div class="item-title">${item.name} (OWNED)</div>
                        <div class="item-description">REPAIR ITEM</div>
                        <div class="item-effect">Durability: ${ownedItem.durability}%</div>
                        <div class="item-durability">Repair to 100%</div>
                    `;
                    
                    if (this.bank >= ownedItem.repairCost) {
                        itemDiv.addEventListener('click', () => {
                            this.repairItem(ownedItem);
                        });
                    } else {
                        itemDiv.classList.add('disabled');
                    }
                } else {
                    itemDiv.classList.add('owned');
                    itemDiv.innerHTML = `
                        <div class="item-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>
                        <div class="item-header">
                            <span class="item-icon">${item.icon}</span>
                            <span class="item-status">OWNED</span>
                        </div>
                        <div class="item-title">${item.name}</div>
                        <div class="item-description">${item.description}</div>
                        <div class="item-effect">${item.effect}</div>
                        <div class="item-durability">Durability: ${ownedItem.durability}%</div>
                    `;
                }
            } else {
                // Show purchase option
                if (this.bank < item.price) {
                    itemDiv.classList.add('disabled');
                }
                
                itemDiv.innerHTML = `
                    <div class="item-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>
                    <div class="item-header">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-price">${item.price} 🪙</span>
                    </div>
                    <div class="item-title">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                    <div class="item-effect">${item.effect}</div>
                    <div class="item-durability">Durability Loss: ${(item.durabilityLossChance * 100).toFixed(0)}% per flip</div>
                `;
                
                itemDiv.addEventListener('click', () => {
                    this.purchaseItem(item);
                });
            }
            
            shopItemsDiv.appendChild(itemDiv);
        });
    }
    
    purchaseItem(item) {
        if (this.bank < item.price) {
            this.showMessage('NOT ENOUGH COINS!');
            return;
        }
        
        // Check if already owned
        if (this.ownedItems.find(owned => owned.id === item.id)) {
            this.showMessage('ALREADY OWNED!');
            return;
        }
        
        // Purchase item
        this.bank -= item.price;
        localStorage.setItem('bank', this.bank);
        
        // Add to owned items with full durability
        const newItem = {
            ...item,
            durability: 100,
            maxDurability: 100,
            repairCost: Math.floor(item.price * 0.25)
        };
        
        this.ownedItems.push(newItem);
        localStorage.setItem('ownedItems', JSON.stringify(this.ownedItems));
        
        this.showMessage(`PURCHASED ${item.name.toUpperCase()}!`);
        this.updateDisplay();
        this.updateShopDisplay();
        this.generateShopStock();
        
        // Play purchase sound
        try {
            document.getElementById('celebrationSound').play();
        } catch(e) {}
    }
    
    repairItem(item) {
        if (this.bank < item.repairCost) {
            this.showMessage('NOT ENOUGH COINS!');
            return;
        }
        
        // Repair item
        this.bank -= item.repairCost;
        localStorage.setItem('bank', this.bank);
        
        item.durability = 100;
        localStorage.setItem('ownedItems', JSON.stringify(this.ownedItems));
        
        this.showMessage(`REPAIRED ${item.name.toUpperCase()}!`);
        this.updateDisplay();
        this.updateShopDisplay();
        this.generateShopStock();
    }
    
    applyDurabilityLoss() {
        // Apply durability loss to equipped items
        this.equippedItems.forEach((itemId, slotIndex) => {
            if (!itemId) return;
            
            const item = this.ownedItems.find(owned => owned.id === itemId);
            if (!item || item.durability <= 0) return;
            
            // Check for durability loss with workshop upgrades
            let durabilityLossChance = item.durabilityLossChance;
            
            // Apply Reinforced Alloy workshop upgrade
            if (this.workshopUpgrades.reinforcedAlloy) {
                durabilityLossChance *= (1 - 0.15 * this.workshopUpgrades.reinforcedAlloy);
            }
            
            // Apply Fortune Memory workshop upgrade
            if (this.workshopUpgrades.fortuneMemory && Math.random() < 0.02 * (this.workshopUpgrades.fortuneMemory || 0)) {
                return; // Prevent durability loss
            }
            
            // Roll for durability loss
            if (Math.random() < durabilityLossChance) {
                const loss = 1 + Math.floor(Math.random() * 3); // 1-3% loss
                item.durability = Math.max(0, item.durability - loss);
                
                if (item.durability <= 0) {
                    this.showMessage(`${item.name.toUpperCase()} BROKE!`);
                    // Unequip broken item
                    this.equippedItems[slotIndex] = null;
                    localStorage.setItem('equippedItems', JSON.stringify(this.equippedItems));
                    this.updateActiveEffects();
                }
                
                localStorage.setItem('ownedItems', JSON.stringify(this.ownedItems));
            }
        });
        
        // Restoration Circuit chance to repair
        if (this.workshopUpgrades.restorationCircuit && this.streak > 0 && this.streak % 5 === 0) {
            if (Math.random() < 0.1 * (this.workshopUpgrades.restorationCircuit || 0)) {
                this.equippedItems.forEach(itemId => {
                    if (!itemId) return;
                    const item = this.ownedItems.find(owned => owned.id === itemId);
                    if (item && item.durability < 100 && item.durability > 0) {
                        item.durability = Math.min(100, item.durability + 1);
                        this.showMessage(`${item.name.toUpperCase()} REPAIRED +1%!`);
                    }
                });
                localStorage.setItem('ownedItems', JSON.stringify(this.ownedItems));
            }
        }
    }
    
    updateEquipmentDisplay() {
        const container = document.getElementById('inventorySlots');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Display equipment slots
        for (let i = 0; i < 3; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equip-slot';
            slotDiv.dataset.slot = i;
            
            if (i >= this.unlockedSlots) {
                slotDiv.classList.add('locked');
                let unlockText = 'LOCKED';
                if (i === 1) unlockText = 'UNLOCKS AT STREAK 10';
                if (i === 2) unlockText = 'UNLOCKS AT STREAK 25';
                slotDiv.innerHTML = `<span class="slot-locked">${unlockText}</span>`;
            } else {
                const equippedItemId = this.equippedItems[i];
                if (equippedItemId) {
                    const item = this.ownedItems.find(owned => owned.id === equippedItemId);
                    if (item) {
                        const isLegendary = item.rarity === 'legendary';
                        slotDiv.classList.add('equipped', `rarity-${item.rarity}`);
                        slotDiv.innerHTML = `
                            <div class="equipped-item">
                                <span class="item-icon">${item.icon}</span>
                                <span class="item-name">${item.name}</span>
                                <div class="durability-bar">
                                    <div class="durability-fill" style="width: ${item.durability}%"></div>
                                </div>
                                <span class="durability-text">${item.durability}%</span>
                            </div>
                        `;
                        
                        if (item.durability <= 0) {
                            slotDiv.classList.add('broken');
                        }
                    }
                } else {
                    slotDiv.classList.add('empty');
                    slotDiv.innerHTML = '<span class="slot-empty">EMPTY SLOT</span>';
                }
                
                slotDiv.addEventListener('click', () => {
                    this.openEquipMenu(i);
                });
            }
            
            container.appendChild(slotDiv);
        }
        
        // Update active effects display
        this.updateActiveEffects();
    }
    
    openEquipMenu(slotIndex) {
        if (slotIndex >= this.unlockedSlots) {
            this.showMessage('SLOT LOCKED!');
            return;
        }
        
        // Create equip menu modal
        const modal = document.createElement('div');
        modal.className = 'equip-menu-modal';
        modal.innerHTML = `
            <div class="equip-menu-content">
                <h3>EQUIP ITEM TO SLOT ${slotIndex + 1}</h3>
                <div class="equip-items-list"></div>
                <button class="pixel-btn unequip-btn">UNEQUIP</button>
                <button class="pixel-btn close-equip-btn">CLOSE</button>
            </div>
        `;
        
        const itemsList = modal.querySelector('.equip-items-list');
        
        // Check for legendary limit
        const hasLegendaryEquipped = this.equippedItems.some(itemId => {
            if (!itemId) return false;
            const item = this.ownedItems.find(owned => owned.id === itemId);
            return item && item.rarity === 'legendary';
        });
        
        // Show owned items
        this.ownedItems.forEach(item => {
            if (item.durability <= 0) return; // Can't equip broken items
            
            const isEquipped = this.equippedItems.includes(item.id);
            const isLegendary = item.rarity === 'legendary';
            
            // Check if can equip (legendary limit)
            const canEquip = !isEquipped && (!isLegendary || !hasLegendaryEquipped || 
                             (this.equippedItems[slotIndex] && 
                              this.ownedItems.find(owned => owned.id === this.equippedItems[slotIndex])?.rarity === 'legendary'));
            
            const itemDiv = document.createElement('div');
            itemDiv.className = `equip-item rarity-${item.rarity}`;
            
            if (isEquipped) {
                itemDiv.classList.add('already-equipped');
            } else if (!canEquip) {
                itemDiv.classList.add('cannot-equip');
            }
            
            itemDiv.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <span class="item-name">${item.name}</span>
                <span class="item-durability">${item.durability}%</span>
                ${isEquipped ? '<span class="equipped-tag">EQUIPPED</span>' : ''}
                ${isLegendary && hasLegendaryEquipped && !isEquipped ? '<span class="limit-tag">LEGENDARY LIMIT</span>' : ''}
            `;
            
            if (canEquip) {
                itemDiv.addEventListener('click', () => {
                    this.equipItem(item.id, slotIndex);
                    document.body.removeChild(modal);
                });
            }
            
            itemsList.appendChild(itemDiv);
        });
        
        // Unequip button
        modal.querySelector('.unequip-btn').addEventListener('click', () => {
            this.equippedItems[slotIndex] = null;
            localStorage.setItem('equippedItems', JSON.stringify(this.equippedItems));
            this.updateActiveEffects();
            this.updateEquipmentDisplay();
            document.body.removeChild(modal);
        });
        
        // Close button
        modal.querySelector('.close-equip-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.body.appendChild(modal);
    }
    
    equipItem(itemId, slotIndex) {
        // Unequip from other slots if already equipped
        const currentSlot = this.equippedItems.indexOf(itemId);
        if (currentSlot !== -1) {
            this.equippedItems[currentSlot] = null;
        }
        
        // Equip to new slot
        this.equippedItems[slotIndex] = itemId;
        localStorage.setItem('equippedItems', JSON.stringify(this.equippedItems));
        
        const item = this.ownedItems.find(owned => owned.id === itemId);
        this.showMessage(`EQUIPPED ${item.name.toUpperCase()}!`);
        
        this.updateActiveEffects();
        this.updateEquipmentDisplay();
    }
    
    updateActiveEffects() {
        // Clear all item effects
        this.activeEffects = {};
        
        // Apply effects from equipped items
        this.equippedItems.forEach(itemId => {
            if (!itemId) return;
            
            const item = this.ownedItems.find(owned => owned.id === itemId);
            if (!item || item.durability <= 0) return;
            
            // Apply item effects based on ID
            this.applyItemEffect(item);
        });
        
        // Update display
        this.updateActiveItemsDisplay();
    }
    
    applyItemEffect(item) {
        switch(item.id) {
            case 'lucky_charm':
                this.activeEffects.luckyCharmBonus = (this.activeEffects.luckyCharmBonus || 0) + 0.02;
                break;
            case 'streak_booster':
                this.activeEffects.streakBoosterActive = true;
                break;
            case 'bank_magnet':
                this.activeEffects.bankMagnetBonus = (this.activeEffects.bankMagnetBonus || 0) + 0.1;
                break;
            case 'coin_saver':
                this.activeEffects.coinSaverActive = true;
                break;
            case 'mirror_coin':
                this.activeEffects.mirrorCoinActive = true;
                this.lastFlipResult = null;
                break;
            case 'hot_hand':
                this.activeEffects.hotHandActive = true;
                this.recentFlips = this.recentFlips || [];
                break;
            case 'cold_blooded':
                this.activeEffects.coldBloodedActive = true;
                this.recentFlips = this.recentFlips || [];
                break;
            case 'double_down':
                this.activeEffects.doubleDownActive = true;
                this.consecutiveWins = 0;
                break;
            case 'risk_taker':
                this.activeEffects.riskTakerActive = true;
                break;
            case 'coin_splitter':
                this.activeEffects.coinSplitterActive = true;
                break;
            case 'multiplier_bond':
                this.activeEffects.multiplierBondActive = true;
                this.permanentMultiplier = this.permanentMultiplier || 0;
                break;
            case 'jackpot_fever':
                this.activeEffects.jackpotFeverActive = true;
                break;
        }
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
    
    showShopUnlock() {
        const btn = document.getElementById('floatingShopBtn');
        btn.style.display = 'block';
        
        this.showMessage('SHOP UNLOCKED! BUY ITEMS WITH DURABILITY!');
        
        setTimeout(() => {
            if (btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }, 5000);
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
    
    // Initialize workshop system
    if (window.game.initWorkshopSystem) {
        window.game.initWorkshopSystem();
    }
});