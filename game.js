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
        
        // Flip history for item effects
        this.flipHistory = [];
        this.lastTwoFlips = [];
        this.lastThreeFlips = [];
        
        // Shop system - new durability-based
        this.inventory = [null, null, null]; // 3 equip slots (progressive unlock)
        this.equippedItems = [null, null, null]; // Items currently equipped
        this.shopUnlocked = false;
        this.shopAvailable = false;
        this.lastShopStreak = 0;
        this.activeEffects = {};
        this.shopItems = this.defineShopItems();
        this.shopRotationTimer = null;
        this.nextRotationTime = 0;
        this.currentShopStock = [];
        this.equipSlotUnlocks = [true, false, false]; // Slot 1 unlocked, 2&3 locked
        
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
        this.equipSlotUnlocks[1] = localStorage.getItem('equipSlot2') === 'true';
        this.equipSlotUnlocks[2] = localStorage.getItem('equipSlot3') === 'true';
        this.equippedItems = JSON.parse(localStorage.getItem('equippedItems') || '[null, null, null]');
        this.loadInventoryItems();
        
        // Initialize shop rotation if unlocked
        if (this.shopUnlocked) {
            this.startShopRotation();
        }
        
        // Initialize game state
        this.riskTakerBonus = 0;
        this.bondMultiplier = 0;
        this.bankProtection = parseInt(localStorage.getItem('bankProtection') || '0');
        
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
        
        // Shop button - available once unlocked
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
        
        // Inventory slots - handled by inline onclick events now
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
        try {
            if (this.checkForRandomEvent) {
                const eventTriggered = this.checkForRandomEvent();
                if (eventTriggered) {
                    console.log('Random event triggered!');
                }
            } else {
                console.log('Random events not initialized yet');
            }
        } catch (error) {
            console.error('Error in random event check:', error);
        }
        
        this.isFlipping = true;
        this.canvas.classList.add('flipping', 'disabled');
        document.getElementById('choiceContainer').classList.add('hidden');
        
        // Determine result with item effects and upgrades
        let winChance = 0.5;
        
        // Apply workshop upgrades
        if (this.getUpgradeBonus) {
            winChance += this.getUpgradeBonus('winChance');
            
            // Coin Soul: Each 50 total wins adds +0.5% permanent win chance
            if (this.workshopUpgrades && this.workshopUpgrades.coinSoul.level > 0) {
                const coinSoulBonus = Math.floor(this.totalWins / 50) * 0.005;
                winChance += coinSoulBonus;
            }
        }
        
        // Apply equipped item effects
        this.equippedItems.forEach(item => {
            if (!item || item.durability <= 0) return;
            
            switch (item.effect) {
                case 'winChance':
                    winChance += item.value;
                    break;
                case 'richToss':
                    winChance += item.value.winPenalty; // -10% win chance
                    break;
            }
        });
        
        // Apply active event effects
        if (this.activeEffects) {
            if (this.activeEffects.luckySurge && this.activeEffects.luckySurge > 0) {
                winChance += 0.10; // +10% win chance
            }
            if (this.activeEffects.weightedCoin && this.activeEffects.weightedCoin > 0) {
                winChance -= 0.10; // -10% win chance
            }
            if (this.activeEffects.blessedCoin) {
                winChance = 1.0; // Guaranteed win
            }
            if (this.activeEffects.misflip) {
                winChance = 0.0; // Guaranteed loss
            }
            if (this.activeEffects.reverseLuck) {
                winChance = 1.0 - winChance; // Invert win chance
            }
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
        
        // Update flip history
        this.flipHistory.push(won);
        this.lastTwoFlips = this.flipHistory.slice(-2);
        this.lastThreeFlips = this.flipHistory.slice(-3);
        
        // Durability only processes on losses, not wins
        
        // Process active event effects (but don't change the main flow for now)
        try {
            if (this.activeEffects) {
                this.processActiveEventEffects(won);
            }
        } catch (error) {
            console.error('Error processing event effects:', error);
        }
        
        if (won) {
            this.streak++;
            
            // Apply equipped item effects for multiplier growth
            let multiplierGrowth = 0.1;
            
            // Apply Momentum Engine workshop upgrade
            if (this.workshopUpgrades && this.workshopUpgrades.momentumEngine.level > 0) {
                multiplierGrowth += this.workshopUpgrades.momentumEngine.level * 0.02;
            }
            
            this.equippedItems.forEach(item => {
                if (!item || item.durability <= 0) return;
                
                switch (item.effect) {
                    case 'multiplierGain':
                        multiplierGrowth += item.value;
                        break;
                    case 'riskTaker':
                        // Risk taker adds to multiplier but resets on loss
                        if (!this.riskTakerBonus) this.riskTakerBonus = 0;
                        this.riskTakerBonus += item.value;
                        break;
                    case 'multiplierBond':
                        // Every 10 streaks adds permanent multiplier
                        if (this.streak % 10 === 0) {
                            if (!this.bondMultiplier) this.bondMultiplier = 0;
                            this.bondMultiplier += item.value;
                        }
                        break;
                }
            });
            
            this.multiplier = 1.0 + (this.streak * multiplierGrowth) + (this.riskTakerBonus || 0) + (this.bondMultiplier || 0);
            
            let points = Math.round(this.basePoints * this.multiplier);
            
            // Apply event effects for points
            if (this.activeEffects && this.activeEffects.goldenShine && this.activeEffects.goldenShine > 0) {
                points *= 2; // Double gold
                this.showMessage('GOLDEN SHINE! DOUBLE GOLD!');
            }
            
            if (this.activeEffects && this.activeEffects.doubleOrNothing) {
                points *= 2; // Double reward
                delete this.activeEffects.doubleOrNothing;
                this.showMessage('DOUBLE OR NOTHING! DOUBLE REWARD!');
            }
            
            // Apply equipped item effects for gold
            this.equippedItems.forEach(item => {
                if (!item || item.durability <= 0) return;
                
                switch (item.effect) {
                    case 'goldBonus':
                        points = Math.floor(points * (1 + item.value)); // +50% gold
                        break;
                    case 'richToss':
                        points = Math.floor(points * (1 + item.value.goldBonus)); // +25% gold
                        break;
                    case 'bonusGold':
                        if (Math.random() < 0.10) { // 10% chance
                            points += item.value; // +5 bonus gold
                            this.showMessage('JACKPOT EDGE! BONUS GOLD!');
                        }
                        break;
                    case 'tenthFlipBonus':
                        if (this.streak % 10 === 0) {
                            points *= item.value; // Double gold every 10th flip
                            this.showMessage('TWIN FATE! 10TH FLIP BONUS!');
                        }
                        break;
                }
            });
            
            // Apply workshop upgrades for points
            if (this.workshopUpgrades) {
                // Golden Edge: +1% chance to earn double coins on correct flip
                if (this.workshopUpgrades.goldenEdge.level > 0) {
                    const doubleChance = this.workshopUpgrades.goldenEdge.level * 0.01;
                    if (Math.random() < doubleChance) {
                        points *= 2;
                        this.showMessage('GOLDEN EDGE! DOUBLE COINS!');
                    }
                }
                
                // Twin Toss: 2% chance to land double result
                if (this.workshopUpgrades.twinToss.level > 0) {
                    const twinChance = this.workshopUpgrades.twinToss.level * 0.02;
                    if (Math.random() < twinChance) {
                        points *= 2;
                        this.showMessage('TWIN TOSS! DOUBLE RESULT!');
                    }
                }
                
                // Echo Flip: 2% chance that winning flip repeats instantly
                if (this.workshopUpgrades.echoFlip.level > 0) {
                    const echoChance = this.workshopUpgrades.echoFlip.level * 0.02;
                    if (Math.random() < echoChance) {
                        points *= 2;
                        this.showMessage('ECHO FLIP! INSTANT REPEAT!');
                    }
                }
            }
            
            // Apply equipped item effects for points
            this.equippedItems.forEach(item => {
                if (!item || item.durability <= 0) return;
                
                switch (item.effect) {
                    case 'doubleReward':
                        // Double Down: After 5 correct flips, next flip reward x2
                        if (this.streak % 5 === 0) {
                            points *= item.value;
                            this.showMessage('DOUBLE DOWN! REWARD DOUBLED!');
                        }
                        break;
                    case 'jackpot':
                        // Jackpot Fever: 0.5% chance per flip to win 50× coins
                        if (Math.random() < 0.005) {
                            points *= item.value;
                            this.showMessage('JACKPOT FEVER! MASSIVE WIN!');
                        }
                        break;
                }
            });
            
            this.score += points;
            
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
            
            // Check workshop unlock
            if (this.checkWorkshopUnlock) {
                this.checkWorkshopUnlock();
            }
            if (this.updateWorkshopTier) {
                this.updateWorkshopTier();
            }
            
            // Track wins
            
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
            
            // Check for Second Chance workshop upgrade
            if (this.workshopUpgrades && this.workshopUpgrades.secondChance.level > 0) {
                const reflipChance = this.workshopUpgrades.secondChance.level * 0.05;
                if (Math.random() < reflipChance) {
                    this.showMessage('SECOND CHANCE! REFLIPPING...');
                    // Trigger another flip automatically
                    setTimeout(() => {
                        this.flipCoin();
                    }, 1000);
                    return;
                }
            }
            
            // Apply equipped item streak save effects
            let streakSaved = false;
            this.equippedItems.forEach(item => {
                if (!item || item.durability <= 0 || streakSaved) return;
                
                if (item.effect === 'streakSave' && Math.random() < item.value) {
                    this.showMessage(`${item.name.toUpperCase()} SAVED YOUR STREAK!`);
                    streakSaved = true;
                }
            });
            
            if (streakSaved) {
                this.updateDisplay();
                this.updateCoinEffects();
                return; // Don't continue with normal loss
            }
            
            // Process item durability loss on losing flip
            this.processItemDurabilityLoss();
            
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
            
            // Check Safety Net workshop upgrade
            const keepMultiplier = this.workshopUpgrades && this.workshopUpgrades.safetyNet.level > 0;
            
            // Reset score, streak, and multiplier on loss
            this.score = 0;
            this.streak = 0;
            
            // Reset risk taker bonus
            this.riskTakerBonus = 0;
            
            if (keepMultiplier) {
                this.showMessage('SAFETY NET! KEEPING HALF MULTIPLIER!');
                // Keep half multiplier
                this.multiplier = 1.0 + ((this.multiplier - 1.0) * 0.5);
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
            
            // Apply workshop banking upgrades
            if (this.workshopUpgrades && this.workshopUpgrades.bankShield.level > 0) {
                const protectionAmount = Math.floor(bankedAmount * this.workshopUpgrades.bankShield.level * 0.05);
                if (!this.bankProtection) this.bankProtection = 0;
                this.bankProtection += protectionAmount;
                localStorage.setItem('bankProtection', this.bankProtection);
                this.showMessage(`BANK SHIELD! ${protectionAmount} COINS PROTECTED!`);
            }
            
            // Apply equipped item banking effects
            this.equippedItems.forEach(item => {
                if (!item || item.durability <= 0) return;
                
                if (item.effect === 'bankBonus') {
                    bankedAmount = Math.floor(bankedAmount * (1 + item.value));
                    this.showMessage(`${item.name.toUpperCase()}! +${Math.round(item.value * 100)}% BANK BONUS!`);
                }
            });
            
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
            this.startShopRotation();
            // Open shop automatically on first unlock
            setTimeout(() => {
                this.openShop();
            }, 2000);
        }
        
        // Unlock equip slots at streak milestones
        if (this.streak === 10 && !this.equipSlotUnlocks[1]) {
            this.equipSlotUnlocks[1] = true;
            this.showMessage('2ND EQUIP SLOT UNLOCKED!');
            localStorage.setItem('equipSlot2', 'true');
        }
        
        if (this.streak === 25 && !this.equipSlotUnlocks[2]) {
            this.equipSlotUnlocks[2] = true;
            this.showMessage('3RD EQUIP SLOT UNLOCKED!');
            localStorage.setItem('equipSlot3', 'true');
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
    
    // Shop System Methods - New Equippable Items
    defineShopItems() {
        return [
            {
                id: 'lucky_charm',
                name: 'Lucky Charm',
                icon: '🍀',
                description: '+5% chance to guess correctly',
                rarity: 'common',
                price: 150,
                durability: 10,
                maxDurability: 10,
                breakRiskModifier: 0,
                effect: 'winChance',
                value: 0.05
            },
            {
                id: 'coin_doubler',
                name: 'Coin Doubler',
                icon: '💰',
                description: '+50% gold earned per correct guess',
                rarity: 'common',
                price: 200,
                durability: 10,
                maxDurability: 10,
                breakRiskModifier: 0,
                effect: 'goldBonus',
                value: 0.50
            },
            {
                id: 'streak_saver',
                name: 'Streak Saver',
                icon: '🛡️',
                description: '20% chance to not lose streak on a wrong guess',
                rarity: 'rare',
                price: 300,
                durability: 8,
                maxDurability: 8,
                breakRiskModifier: 0,
                effect: 'streakSave',
                value: 0.20
            },
            {
                id: 'mirror_flip',
                name: 'Mirror Flip',
                icon: '🪞',
                description: 'Once per streak, reroll a losing flip',
                rarity: 'rare',
                price: 250,
                durability: 5,
                maxDurability: 5,
                breakRiskModifier: 0,
                effect: 'mirrorFlip',
                value: 1
            },
            {
                id: 'greedy_toss',
                name: 'Greedy Toss',
                icon: '🎲',
                description: '+0.2 streak multiplier growth per flip but +10% break chance',
                rarity: 'epic',
                price: 180,
                durability: 8,
                maxDurability: 8,
                breakRiskModifier: 10,
                effect: 'multiplierGrowth',
                value: 0.2
            },
            {
                id: 'twin_fate',
                name: 'Twin Fate',
                icon: '👯',
                description: 'Every 10th flip earns double gold',
                rarity: 'rare',
                price: 220,
                durability: 10,
                maxDurability: 10,
                breakRiskModifier: 0,
                effect: 'tenthFlipBonus',
                value: 2
            },
            {
                id: 'jackpot_edge',
                name: 'Jackpot Edge',
                icon: '🎯',
                description: '10% chance per flip to get +5 bonus gold',
                rarity: 'common',
                price: 160,
                durability: 10,
                maxDurability: 10,
                breakRiskModifier: 0,
                effect: 'bonusGold',
                value: 5
            },
            {
                id: 'coin_shield',
                name: 'Coin Shield',
                icon: '🛡️',
                description: 'Prevents one equipped item from breaking this streak',
                rarity: 'rare',
                price: 120,
                durability: 1,
                maxDurability: 1,
                breakRiskModifier: 0,
                effect: 'itemProtection',
                value: 1
            },
            {
                id: 'paradox_coin',
                name: 'Paradox Coin',
                icon: '🌀',
                description: '1% chance to auto-win, 5% chance to instantly lose streak',
                rarity: 'legendary',
                price: 250,
                durability: 8,
                maxDurability: 8,
                breakRiskModifier: 0,
                effect: 'paradox',
                value: { autoWin: 0.01, autoLose: 0.05 }
            },
            {
                id: 'rich_mans_toss',
                name: 'Rich Man\'s Toss',
                icon: '💎',
                description: '+25% gold per win, -10% win chance',
                rarity: 'epic',
                price: 180,
                durability: 10,
                maxDurability: 10,
                breakRiskModifier: 0,
                effect: 'richToss',
                value: { goldBonus: 0.25, winPenalty: -0.10 }
            },
            {
                id: 'fortune_tuner',
                name: 'Fortune Tuner',
                icon: '🔮',
                description: '+10% higher chance for positive events, -5% for negative ones',
                rarity: 'rare',
                price: 250,
                durability: 8,
                maxDurability: 8,
                breakRiskModifier: 0,
                effect: 'fortuneTuner',
                value: { positiveBonus: 10, negativeReduction: -5 }
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
    
    startShopRotation() {
        // Start 5-minute rotation timer
        this.nextRotationTime = Date.now() + (5 * 60 * 1000); // 5 minutes
        this.generateShopStock();
        
        if (this.shopRotationTimer) {
            clearInterval(this.shopRotationTimer);
        }
        
        this.shopRotationTimer = setInterval(() => {
            this.nextRotationTime = Date.now() + (5 * 60 * 1000);
            this.generateShopStock();
            if (document.getElementById('shopModal').classList.contains('show')) {
                this.updateShopDisplay();
            }
            this.showMessage('SHOP ITEMS ROTATED! NEW ITEMS AVAILABLE!');
        }, 5 * 60 * 1000);
        
        // Update timer display every second
        setInterval(() => {
            this.updateRotationTimer();
        }, 1000);
    }
    
    updateRotationTimer() {
        if (!this.shopUnlocked) return;
        
        const timeLeft = Math.max(0, this.nextRotationTime - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        const timerEl = document.getElementById('rotationTimer');
        if (timerEl) {
            timerEl.textContent = `New items in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateShopDisplay() {
        // Update bank display
        document.getElementById('shopBank').textContent = this.bank;
        
        // Update status
        const statusEl = document.getElementById('shopStatus');
        if (this.shopUnlocked) {
            statusEl.textContent = 'SHOP OPEN - ITEMS ROTATE EVERY 5 MINUTES';
            statusEl.style.color = '#4ecdc4';
        } else {
            statusEl.textContent = 'STREAK 3+ TO UNLOCK';
            statusEl.style.color = '#ff6b6b';
        }
        
        // Update rotation timer
        this.updateRotationTimer();
        
        // Update inventory and equip displays
        this.updateInventoryDisplay();
        this.updateEquipDisplay();
    }
    
    generateShopStock() {
        // Rotate stock - show 4 random items
        const availableItems = [...this.shopItems];
        this.currentShopStock = [];
        
        for (let i = 0; i < Math.min(4, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            const item = availableItems.splice(randomIndex, 1)[0];
            // Create fresh copy with full durability
            this.currentShopStock.push({
                ...item,
                durability: item.maxDurability,
                id: item.id + '_' + Date.now() + '_' + i // Unique ID for this instance
            });
        }
        
        this.displayShopItems();
    }
    
    displayShopItems() {
        const shopItemsDiv = document.getElementById('shopItems');
        shopItemsDiv.innerHTML = '';
        
        this.currentShopStock.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
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
                <div class="item-durability" title="Durability only decreases when you lose a flip. Each loss has a 10% base chance to reduce durability by 1. Items are destroyed when durability reaches 0.">Durability: ${item.durability}/${item.maxDurability}</div>
            `;
            
            itemDiv.addEventListener('click', () => {
                this.purchaseItem(item);
            });
            
            shopItemsDiv.appendChild(itemDiv);
        });
    }
    
    purchaseItem(item) {
        if (this.bank < item.price) {
            this.showMessage('NOT ENOUGH COINS!');
            return;
        }
        
        // Check inventory space
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            this.showMessage('INVENTORY FULL! EQUIP OR SELL ITEMS FIRST!');
            return;
        }
        
        // Purchase item
        this.bank -= item.price;
        localStorage.setItem('bank', this.bank);
        
        // Add to inventory
        this.inventory[emptySlot] = {
            ...item,
            purchaseTime: Date.now()
        };
        
        this.saveInventory();
        this.showMessage(`PURCHASED ${item.name.toUpperCase()}!`);
        this.updateDisplay();
        this.updateShopDisplay();
        this.displayShopItems(); // Refresh shop display
        
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
                const durabilityColor = item.durability > 5 ? '#4ecdc4' : item.durability > 2 ? '#ffeb3b' : '#ff6b6b';
                slot.innerHTML = `
                    <div class="item-in-slot">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-durability" style="color: ${durabilityColor}" title="Durability only decreases when you lose a flip. Each loss has a 10% base chance to reduce durability by 1. Items are destroyed when durability reaches 0.">${item.durability}/${item.maxDurability}</span>
                        <button class="equip-btn" onclick="game.equipItem(${index})">EQUIP</button>
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
    
    updateEquipDisplay() {
        const container = document.getElementById('equippedItemsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.equippedItems.forEach((item, index) => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equip-slot';
            
            if (!this.equipSlotUnlocks[index]) {
                slotDiv.classList.add('locked');
                const unlockStreak = index === 1 ? 10 : 25;
                slotDiv.innerHTML = `<span class="slot-locked">UNLOCKS AT STREAK ${unlockStreak}</span>`;
            } else if (item) {
                const durabilityColor = item.durability > 5 ? '#4ecdc4' : item.durability > 2 ? '#ffeb3b' : '#ff6b6b';
                slotDiv.innerHTML = `
                    <div class="equipped-item">
                        <span class="item-icon">${item.icon}</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-durability" style="color: ${durabilityColor}" title="Durability only decreases when you lose a flip. Each loss has a 10% base chance to reduce durability by 1. Items are destroyed when durability reaches 0.">${item.durability}/${item.maxDurability}</span>
                        <button class="unequip-btn" onclick="game.unequipItem(${index})">UNEQUIP</button>
                    </div>
                `;
            } else {
                slotDiv.innerHTML = '<span class="slot-empty">EMPTY</span>';
            }
            
            container.appendChild(slotDiv);
        });
    }
    
    equipItem(inventoryIndex) {
        const item = this.inventory[inventoryIndex];
        if (!item) return;
        
        // Check if item is broken
        if (item.durability <= 0) {
            this.showMessage('ITEM IS BROKEN! REPAIR IT FIRST!');
            return;
        }
        
        // Find available equip slot
        let targetSlot = -1;
        for (let i = 0; i < this.equippedItems.length; i++) {
            if (this.equipSlotUnlocks[i] && !this.equippedItems[i]) {
                targetSlot = i;
                break;
            }
        }
        
        // Check legendary limit (only 1 legendary equipped at once)
        if (item.rarity === 'legendary') {
            const hasLegendary = this.equippedItems.some(equipped => equipped && equipped.rarity === 'legendary');
            if (hasLegendary) {
                this.showMessage('ONLY 1 LEGENDARY ITEM CAN BE EQUIPPED!');
                return;
            }
        }
        
        if (targetSlot === -1) {
            this.showMessage('NO AVAILABLE EQUIP SLOTS!');
            return;
        }
        
        // Equip item
        this.equippedItems[targetSlot] = item;
        this.inventory[inventoryIndex] = null;
        
        this.saveEquippedItems();
        this.saveInventory();
        this.showMessage(`EQUIPPED ${item.name.toUpperCase()}!`);
        this.updateShopDisplay();
    }
    
    unequipItem(equipIndex) {
        const item = this.equippedItems[equipIndex];
        if (!item) return;
        
        // Find empty inventory slot
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            this.showMessage('INVENTORY FULL!');
            return;
        }
        
        // Unequip item
        this.inventory[emptySlot] = item;
        this.equippedItems[equipIndex] = null;
        
        this.saveEquippedItems();
        this.saveInventory();
        this.showMessage(`UNEQUIPPED ${item.name.toUpperCase()}!`);
        this.updateShopDisplay();
    }
    
    // Process active event effects
    processActiveEventEffects(won) {
        if (!this.activeEffects) {
            this.activeEffects = {};
            return;
        }
        
        // Decrement duration-based effects
        if (this.activeEffects.luckySurge && this.activeEffects.luckySurge > 0) {
            this.activeEffects.luckySurge--;
            if (this.activeEffects.luckySurge <= 0) {
                delete this.activeEffects.luckySurge;
                this.showMessage('LUCKY SURGE ENDED!');
            }
        }
        
        if (this.activeEffects.weightedCoin && this.activeEffects.weightedCoin > 0) {
            this.activeEffects.weightedCoin--;
            if (this.activeEffects.weightedCoin <= 0) {
                delete this.activeEffects.weightedCoin;
                this.showMessage('WEIGHTED COIN EFFECT ENDED!');
            }
        }
        
        if (this.activeEffects.goldenShine && this.activeEffects.goldenShine > 0) {
            this.activeEffects.goldenShine--;
            if (this.activeEffects.goldenShine <= 0) {
                delete this.activeEffects.goldenShine;
                this.showMessage('GOLDEN SHINE ENDED!');
            }
        }
        
        if (this.activeEffects.mirageToss && this.activeEffects.mirageToss > 0) {
            this.activeEffects.mirageToss--;
            if (this.activeEffects.mirageToss <= 0) {
                delete this.activeEffects.mirageToss;
                this.showMessage('MIRAGE TOSS ENDED!');
            }
        }
        
        if (this.activeEffects.coinMimic && this.activeEffects.coinMimic.flips > 0) {
            this.activeEffects.coinMimic.flips--;
            if (this.activeEffects.coinMimic.flips <= 0) {
                delete this.activeEffects.coinMimic;
                this.showMessage('COIN MIMIC ENDED!');
            }
        }
        
        // Clear one-time effects
        if (this.activeEffects.blessedCoin) {
            delete this.activeEffects.blessedCoin;
        }
        
        if (this.activeEffects.misflip) {
            delete this.activeEffects.misflip;
        }
        
        if (this.activeEffects.reverseLuck) {
            delete this.activeEffects.reverseLuck;
        }
        
        if (this.activeEffects.doubleOrNothing) {
            delete this.activeEffects.doubleOrNothing;
        }
    }
    
    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }
    
    saveEquippedItems() {
        localStorage.setItem('equippedItems', JSON.stringify(this.equippedItems));
    }
    
    loadInventoryItems() {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            this.inventory = JSON.parse(saved);
        }
    }
    
    processItemDurabilityLoss() {
        // New durability system: only triggered on losing flips
        let baseBreakChance = 10; // 10% base break chance
        
        // Apply Streak Protector workshop upgrade
        if (this.workshopUpgrades && this.workshopUpgrades.streakProtector.level > 0) {
            baseBreakChance -= (this.workshopUpgrades.streakProtector.level * 2);
        }
        
        // Check each equipped item for potential breaking
        this.equippedItems.forEach((item, index) => {
            if (!item || item.durability <= 0) return;
            
            // Calculate final break chance for this item
            let finalBreakChance = Math.max(0, baseBreakChance + (item.breakRiskModifier || 0));
            
            // Roll for break chance
            if (Math.random() * 100 < finalBreakChance) {
                item.durability -= 1;
                
                if (item.durability <= 0) {
                    // Item is destroyed
                    this.showMessage(`${item.name.toUpperCase()} BROKE AND WAS DESTROYED!`);
                    this.equippedItems[index] = null;
                } else {
                    this.showMessage(`${item.name.toUpperCase()} LOST 1 DURABILITY! (${item.durability}/${item.maxDurability})`);
                }
            }
        });
        
        // Save equipped items after durability changes
        this.saveEquippedItems();
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
        
        this.showMessage('SHOP UNLOCKED! BUY DURABILITY-BASED ITEMS!');
        
        setTimeout(() => {
            if (btn.style.display === 'block') {
                btn.style.display = 'none';
            }
        }, 5000);
    }
    
    // Remove showShopAvailable method as shop stays open
    
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