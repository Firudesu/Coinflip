// Random Events System for CoinFlipGame
// Adds variety and surprise elements to gameplay

CoinFlipGame.prototype.initRandomEvents = function() {
    this.eventActive = false;
    this.currentEvent = null;
    this.eventHistory = [];
    
    // Define all events by tier
    this.randomEvents = this.defineRandomEvents();
};

CoinFlipGame.prototype.defineRandomEvents = function() {
    return {
        // POSITIVE EVENTS
        common: {
            luckySurge: {
                name: 'Lucky Surge',
                tier: 'common',
                weight: 15,
                description: '+10% win rate for next 3 flips',
                effect: '+10% win chance for 3 flips',
                execute: () => {
                    this.activeEffects.luckySurge = 3;
                    this.showEventResult('LUCKY SURGE! +10% WIN CHANCE FOR 3 FLIPS!');
                }
            },
            coinWindfall: {
                name: 'Coin Windfall',
                tier: 'common',
                weight: 15,
                description: '+30 gold instantly',
                effect: 'Instant gold bonus',
                execute: () => {
                    this.bank += 30;
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult('COIN WINDFALL! +30 GOLD!');
                }
            },
            safeFlip: {
                name: 'Safe Flip',
                tier: 'common',
                weight: 10,
                description: 'Next flip can\'t break streak',
                effect: 'Streak protection',
                execute: () => {
                    this.activeEffects.safeFlip = true;
                    this.showEventResult('SAFE FLIP! NEXT FLIP CAN\'T BREAK STREAK!');
                }
            },
            charmDrop: {
                name: 'Charm Drop',
                tier: 'common',
                weight: 10,
                description: '+1 durability to random item',
                effect: 'Item repair',
                execute: () => {
                    const equippedItems = this.equippedItems.filter(item => item && item.durability < item.maxDurability);
                    if (equippedItems.length > 0) {
                        const randomItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
                        randomItem.durability = Math.min(randomItem.maxDurability, randomItem.durability + 1);
                        this.showEventResult(`CHARM DROP! ${randomItem.name.toUpperCase()} +1 DURABILITY!`);
                        this.saveEquippedItems();
                    } else {
                        this.showEventResult('CHARM DROP! NO ITEMS TO REPAIR!');
                    }
                }
            },
            doubleOrNothing: {
                name: 'Double or Nothing',
                tier: 'common',
                weight: 25,
                description: 'Next flip = double win or double loss',
                effect: 'High risk, high reward',
                execute: () => {
                    this.activeEffects.doubleOrNothing = true;
                    this.showEventResult('DOUBLE OR NOTHING! NEXT FLIP DOUBLED!');
                }
            },
            mirageToss: {
                name: 'Mirage Toss',
                tier: 'common',
                weight: 20,
                description: 'Flip result hidden for 3 turns',
                effect: 'Mystery flips',
                execute: () => {
                    this.activeEffects.mirageToss = 3;
                    this.showEventResult('MIRAGE TOSS! RESULTS HIDDEN FOR 3 FLIPS!');
                }
            },
            rustSpread: {
                name: 'Rust Spread',
                tier: 'common',
                weight: 20,
                description: '-1 durability on random item',
                effect: 'Item damage',
                execute: () => {
                    const equippedItems = this.equippedItems.filter(item => item && item.durability > 0);
                    if (equippedItems.length > 0) {
                        const randomItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
                        randomItem.durability = Math.max(0, randomItem.durability - 1);
                        if (randomItem.durability <= 0) {
                            this.showEventResult(`RUST SPREAD! ${randomItem.name.toUpperCase()} DESTROYED!`);
                            const index = this.equippedItems.indexOf(randomItem);
                            this.equippedItems[index] = null;
                        } else {
                            this.showEventResult(`RUST SPREAD! ${randomItem.name.toUpperCase()} -1 DURABILITY!`);
                        }
                        this.saveEquippedItems();
                    } else {
                        this.showEventResult('RUST SPREAD! NO ITEMS TO DAMAGE!');
                    }
                }
            },
            weightedCoin: {
                name: 'Weighted Coin',
                tier: 'common',
                weight: 15,
                description: '-10% win chance for 3 flips',
                effect: 'Temporary disadvantage',
                execute: () => {
                    this.activeEffects.weightedCoin = 3;
                    this.showEventResult('WEIGHTED COIN! -10% WIN CHANCE FOR 3 FLIPS!');
                }
            },
            misflip: {
                name: 'Misflip',
                tier: 'common',
                weight: 10,
                description: 'Next flip forced loss',
                effect: 'Guaranteed loss',
                execute: () => {
                    this.activeEffects.misflip = true;
                    this.showEventResult('MISFLIP! NEXT FLIP WILL LOSE!');
                }
            }
        },
        rare: {
            goldenShine: {
                name: 'Golden Shine',
                tier: 'rare',
                weight: 15,
                description: 'Double gold for next 2 flips',
                effect: 'Enhanced rewards',
                execute: () => {
                    this.activeEffects.goldenShine = 2;
                    this.showEventResult('GOLDEN SHINE! DOUBLE GOLD FOR 2 FLIPS!');
                }
            },
            echoToss: {
                name: 'Echo Toss',
                tier: 'rare',
                weight: 10,
                description: 'Free bonus flip (no streak risk)',
                effect: 'Risk-free flip',
                execute: () => {
                    this.activeEffects.echoToss = true;
                    this.showEventResult('ECHO TOSS! FREE BONUS FLIP!');
                }
            },
            workshopFind: {
                name: 'Workshop Find',
                tier: 'rare',
                weight: 10,
                description: '+50 gold for workshop',
                effect: 'Workshop bonus',
                execute: () => {
                    this.bank += 50;
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult('WORKSHOP FIND! +50 GOLD!');
                }
            },
            streakSwap: {
                name: 'Streak Swap',
                tier: 'rare',
                weight: 25,
                description: 'Halve streak, double gold',
                effect: 'Risk/reward trade',
                execute: () => {
                    const oldStreak = this.streak;
                    this.streak = Math.floor(this.streak / 2);
                    this.score *= 2;
                    this.showEventResult(`STREAK SWAP! ${oldStreak} → ${this.streak} STREAK, DOUBLE GOLD!`);
                }
            },
            coinMimic: {
                name: 'Coin Mimic',
                tier: 'rare',
                weight: 20,
                description: 'Temporarily copy one equipped item (3 flips)',
                effect: 'Item duplication',
                execute: () => {
                    const equippedItems = this.equippedItems.filter(item => item);
                    if (equippedItems.length > 0) {
                        const randomItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
                        this.activeEffects.coinMimic = { item: randomItem, flips: 3 };
                        this.showEventResult(`COIN MIMIC! COPYING ${randomItem.name.toUpperCase()} FOR 3 FLIPS!`);
                    } else {
                        this.showEventResult('COIN MIMIC! NO ITEMS TO COPY!');
                    }
                }
            },
            greedTax: {
                name: 'Greed Tax',
                tier: 'rare',
                weight: 15,
                description: 'Lose 10% of banked gold',
                effect: 'Bank penalty',
                execute: () => {
                    const loss = Math.floor(this.bank * 0.1);
                    this.bank = Math.max(0, this.bank - loss);
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult(`GREED TAX! LOST ${loss} GOLD!`);
                }
            },
            streakLeak: {
                name: 'Streak Leak',
                tier: 'rare',
                weight: 15,
                description: '-0.5 to streak multiplier',
                effect: 'Multiplier penalty',
                execute: () => {
                    this.multiplier = Math.max(1.0, this.multiplier - 0.5);
                    this.showEventResult('STREAK LEAK! -0.5 MULTIPLIER!');
                }
            },
            fakeFlip: {
                name: 'Fake Flip',
                tier: 'rare',
                weight: 10,
                description: 'Appears as win, counts as loss',
                effect: 'Deceptive result',
                execute: () => {
                    this.activeEffects.fakeFlip = true;
                    this.showEventResult('FAKE FLIP! BEWARE OF DECEPTION!');
                }
            }
        },
        epic: {
            blessedCoin: {
                name: 'Blessed Coin',
                tier: 'epic',
                weight: 15,
                description: 'Guarantees one winning flip soon',
                effect: 'Guaranteed win',
                execute: () => {
                    this.activeEffects.blessedCoin = true;
                    this.showEventResult('BLESSED COIN! NEXT FLIP GUARANTEED WIN!');
                }
            },
            reverseLuck: {
                name: 'Reverse Luck',
                tier: 'epic',
                weight: 20,
                description: 'Win/loss logic inverted for next flip',
                effect: 'Inverted logic',
                execute: () => {
                    this.activeEffects.reverseLuck = true;
                    this.showEventResult('REVERSE LUCK! WIN/LOSS INVERTED NEXT FLIP!');
                }
            },
            fateOffer: {
                name: 'Fate Offer',
                tier: 'epic',
                weight: 15,
                description: 'Lose half gold, gain +2 workshop levels',
                effect: 'Power trade',
                execute: () => {
                    const loss = Math.floor(this.bank / 2);
                    this.bank -= loss;
                    localStorage.setItem('bank', this.bank);
                    // Add 2 random workshop upgrades
                    this.showEventResult(`FATE OFFER! LOST ${loss} GOLD FOR POWER!`);
                }
            },
            tradersVisit: {
                name: 'Trader\'s Visit',
                tier: 'epic',
                weight: 15,
                description: 'Shop refreshes with 50% discounts',
                effect: 'Shop discount',
                execute: () => {
                    this.activeEffects.tradersVisit = true;
                    this.generateShopStock(); // Refresh shop
                    this.showEventResult('TRADER\'S VISIT! SHOP REFRESHED WITH 50% DISCOUNTS!');
                }
            },
            staticSurge: {
                name: 'Static Surge',
                tier: 'epic',
                weight: 15,
                description: '-2 durability on random item',
                effect: 'Heavy item damage',
                execute: () => {
                    const equippedItems = this.equippedItems.filter(item => item && item.durability > 0);
                    if (equippedItems.length > 0) {
                        const randomItem = equippedItems[Math.floor(Math.random() * equippedItems.length)];
                        randomItem.durability = Math.max(0, randomItem.durability - 2);
                        if (randomItem.durability <= 0) {
                            this.showEventResult(`STATIC SURGE! ${randomItem.name.toUpperCase()} DESTROYED!`);
                            const index = this.equippedItems.indexOf(randomItem);
                            this.equippedItems[index] = null;
                        } else {
                            this.showEventResult(`STATIC SURGE! ${randomItem.name.toUpperCase()} -2 DURABILITY!`);
                        }
                        this.saveEquippedItems();
                    } else {
                        this.showEventResult('STATIC SURGE! NO ITEMS TO DAMAGE!');
                    }
                }
            }
        }
    };
};

CoinFlipGame.prototype.checkForRandomEvent = function() {
    try {
        // Don't trigger during battles or other special modes
        if (this.battleMode?.battleInProgress || this.eventActive) return false;
    
    // New event trigger logic
    let baseEventChance = 8; // 8% base chance per winning flip
    let streakBonus = Math.floor(this.streak / 10) * 1; // +1% per 10 streaks
    let maxEventChance = 15; // hard cap
    
    // Apply Fortune Tuner item effect (+10% positive, -5% negative)
    let positiveModifier = 0;
    let negativeModifier = 0;
    
    this.equippedItems.forEach(item => {
        if (item && item.effect === 'fortuneTuner' && item.durability > 0) {
            positiveModifier += 10;
            negativeModifier -= 5;
        }
    });
    
    // Apply Fate Control workshop upgrade (+3% positive, -3% negative per level)
    if (this.workshopUpgrades && this.workshopUpgrades.fateControl && this.workshopUpgrades.fateControl.level > 0) {
        const fateLevel = this.workshopUpgrades.fateControl.level;
        positiveModifier += fateLevel * 3;
        negativeModifier -= fateLevel * 3;
    }
    
    let finalEventChance = Math.min(baseEventChance + streakBonus, maxEventChance);
    
    const roll = Math.random() * 100;
    
    if (roll >= finalEventChance) return false;
    
    // Determine tier based on streak
    let tierChances = { common: 65, rare: 25, epic: 10 };
    
    // Select tier
    const tierRoll = Math.random() * 100;
    let selectedTier;
    
    if (tierRoll < tierChances.common) {
        selectedTier = 'common';
    } else if (tierRoll < tierChances.common + tierChances.rare) {
        selectedTier = 'rare';
    } else {
        selectedTier = 'epic';
    }
    
    // Get events from selected tier
    const tierEvents = this.randomEvents[selectedTier];
    const eventKeys = Object.keys(tierEvents);
    
    if (eventKeys.length === 0) return false;
    
    // Calculate total weight for tier
    let totalWeight = 0;
    eventKeys.forEach(key => {
        totalWeight += tierEvents[key].weight;
    });
    
    // Select event based on weight
    const weightRoll = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedEventKey = null;
    
    for (const key of eventKeys) {
        currentWeight += tierEvents[key].weight;
        if (weightRoll <= currentWeight) {
            selectedEventKey = key;
            break;
        }
    }
    
    if (!selectedEventKey) return false;
    
    // Determine if event is positive or negative and apply modifiers
    const event = tierEvents[selectedEventKey];
    const isPositive = this.isPositiveEvent(selectedEventKey);
    
    let finalChance = 100; // Base 100% chance to trigger
    
    if (isPositive) {
        finalChance += positiveModifier;
    } else {
        finalChance += negativeModifier; // negativeModifier is negative, so this reduces chance
    }
    
    // Final roll to see if event actually triggers
    if (Math.random() * 100 > finalChance) return false;
    
    // Trigger event
    this.triggerRandomEvent(selectedTier, selectedEventKey);
    return true;
    
    } catch (error) {
        console.error('Error in checkForRandomEvent:', error);
        return false;
    }
};

CoinFlipGame.prototype.isPositiveEvent = function(eventKey) {
    const positiveEvents = [
        'luckySurge', 'coinWindfall', 'safeFlip', 'charmDrop', 
        'goldenShine', 'echoToss', 'workshopFind', 'blessedCoin'
    ];
    return positiveEvents.includes(eventKey);
};

CoinFlipGame.prototype.triggerRandomEvent = function(tier, eventKey) {
    const event = this.randomEvents[tier][eventKey];
    if (!event) return;
    
    this.eventActive = true;
    this.currentEvent = event;
    
    // Show event notification
    this.showEventNotification(event);
    
    // Store in history
    this.eventHistory.push({
        name: event.name,
        tier: tier,
        streak: this.streak,
        timestamp: Date.now()
    });
    
    // Execute event immediately
    event.execute();
    
    // Reset event state after execution
    setTimeout(() => {
        this.eventActive = false;
        this.currentEvent = null;
    }, 100);
};

CoinFlipGame.prototype.showEventNotification = function(event) {
    const notification = document.createElement('div');
    notification.className = `event-notification event-${event.tier}`;
    notification.innerHTML = `
        <div class="event-icon">${this.getEventIcon(event.tier)}</div>
        <div class="event-name">${event.name.toUpperCase()}!</div>
        <div class="event-desc">${event.description}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
};

CoinFlipGame.prototype.getEventIcon = function(tier) {
    const icons = {
        common: '🎲',
        rare: '⭐',
        epic: '👑'
    };
    return icons[tier] || '❓';
};

CoinFlipGame.prototype.applyEventVisual = function(visual) {
    const container = document.getElementById('gameContainer');
    const canvas = this.canvas;
    
    switch(visual) {
        case 'glitch':
            canvas.classList.add('glitch-effect');
            break;
        case 'cursed':
            canvas.style.filter = 'hue-rotate(180deg) saturate(2)';
            break;
        case 'golden':
            canvas.style.filter = 'brightness(1.5) saturate(2)';
            break;
        case 'static':
            container.classList.add('static-overlay');
            break;
        case 'eclipse':
            container.classList.add('eclipse-effect');
            break;
    }
};

CoinFlipGame.prototype.showEventResult = function(message) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'event-result';
    resultDiv.textContent = message;
    
    document.body.appendChild(resultDiv);
    
    setTimeout(() => {
        resultDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        resultDiv.remove();
    }, 3000);
};

// Mini-game implementations
CoinFlipGame.prototype.showTimingBar = function() {
    const bar = document.createElement('div');
    bar.className = 'timing-bar';
    bar.innerHTML = `
        <div class="timing-track">
            <div class="timing-marker"></div>
            <div class="timing-target"></div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(bar);
    
    // Animate marker
    let position = 0;
    let direction = 1;
    const interval = setInterval(() => {
        position += direction * 5;
        if (position >= 100 || position <= 0) direction *= -1;
        bar.querySelector('.timing-marker').style.left = position + '%';
    }, 20);
    
    // Listen for click
    bar.addEventListener('click', () => {
        clearInterval(interval);
        const perfect = position > 45 && position < 55;
        
        if (perfect) {
            this.multiplier += 0.2;
            this.showEventResult('PERFECT TIMING! +0.2 MULTIPLIER!');
        } else {
            this.showEventResult('MISSED TIMING!');
        }
        
        bar.remove();
        this.eventActive = false;
    });
};

CoinFlipGame.prototype.showBankOrContinue = function() {
    const modal = document.createElement('div');
    modal.className = 'decision-modal';
    modal.innerHTML = `
        <div class="decision-content">
            <h3>GREEDY COIN DEMANDS!</h3>
            <p>Bank now or continue?</p>
            <p>If you continue and lose, you lose last banked amount!</p>
            <button class="pixel-btn" onclick="game.greedyBank()">BANK</button>
            <button class="pixel-btn" onclick="game.greedyContinue()">CONTINUE</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
};

CoinFlipGame.prototype.greedyBank = function() {
    this.bankScore();
    document.querySelector('.decision-modal').remove();
    this.forceDecision = false;
    this.eventActive = false;
};

CoinFlipGame.prototype.greedyContinue = function() {
    this.greedyRisk = this.bank; // Remember amount at risk
    document.querySelector('.decision-modal').remove();
    this.forceDecision = false;
    this.eventActive = false;
    this.showEventResult('GREEDY RISK ACCEPTED!');
};

// Clean up event effects
CoinFlipGame.prototype.cleanupEventEffects = function() {
    const container = document.getElementById('gameContainer');
    const canvas = this.canvas;
    
    // Remove visual effects
    canvas.style.filter = '';
    canvas.classList.remove('glitch-effect');
    container.classList.remove('static-overlay', 'eclipse-effect', 'time-warp');
    
    // Reset event state
    this.eventActive = false;
    this.currentEvent = null;
};

// Initialize random events
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.game) {
            window.game.initRandomEvents();
            console.log('Random events initialized');
        }
    }, 300);
});