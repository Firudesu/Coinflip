// Random Events System for CoinFlipGame
// Adds variety and surprise elements to gameplay

CoinFlipGame.prototype.initRandomEvents = function() {
    this.eventActive = false;
    this.currentEvent = null;
    this.eventHistory = [];
    this.eventChance = 0.08; // 8% base chance per flip
    
    // Define all events
    this.randomEvents = this.defineRandomEvents();
};

CoinFlipGame.prototype.defineRandomEvents = function() {
    return {
        // COIN MUTATIONS
        coinGlitch: {
            name: 'Coin Glitch',
            type: 'mutation',
            minStreak: 0,
            description: 'Coin flickers rapidly!',
            effect: 'Double multiplier if right, lose half bank if wrong',
            visual: 'glitch',
            execute: (won) => {
                if (won) {
                    this.multiplier *= 2;
                    this.showEventResult('GLITCH SUCCESS! MULTIPLIER DOUBLED!');
                } else {
                    const loss = Math.floor(this.bank / 2);
                    this.bank = Math.max(0, this.bank - loss);
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult(`GLITCH FAIL! LOST ${loss} FROM BANK!`);
                }
            }
        },
        
        doubleFlip: {
            name: 'Double Flip',
            type: 'mutation',
            minStreak: 5,
            description: 'Two coins appear!',
            effect: 'Guess both for x3 reward',
            visual: 'double',
            execute: () => {
                this.showEventResult('DOUBLE FLIP! CHOOSE TWICE!');
                this.pendingDoubleFlip = true;
            }
        },
        
        heavyCoin: {
            name: 'Heavy Coin',
            type: 'mutation',
            minStreak: 0,
            description: 'Coin spins slower',
            effect: 'Can lock in guess early for bonus',
            visual: 'slow',
            execute: () => {
                this.flipSpeed = 40; // Slower animation
                this.showEventResult('HEAVY COIN! TAP TO LOCK IN!');
            }
        },
        
        ghostCoin: {
            name: 'Ghost Coin',
            type: 'mutation',
            minStreak: 3,
            description: 'Result hidden briefly',
            effect: '2 second suspense',
            visual: 'ghost',
            execute: (won) => {
                this.hideResult = true;
                setTimeout(() => {
                    this.hideResult = false;
                    this.showEventResult(won ? 'GHOST REVEALED: WIN!' : 'GHOST REVEALED: LOSS!');
                }, 2000);
            }
        },
        
        magnetFlip: {
            name: 'Magnet Flip',
            type: 'mutation',
            minStreak: 10,
            description: 'Coin lands on edge!',
            effect: '50/50 reflip, outcome doubled',
            visual: 'edge',
            execute: () => {
                this.showEventResult('EDGE LANDING! REFLIPPING...');
                this.edgeReflip = true;
                this.scoreMultiplier = 2;
            }
        },
        
        // RANDOM REWARDS
        luckySpark: {
            name: 'Lucky Spark',
            type: 'reward',
            minStreak: 0,
            description: 'Sparks fly!',
            effect: '+0.1 multiplier bonus',
            visual: 'spark',
            execute: () => {
                this.multiplier += 0.1;
                this.showEventResult('LUCKY SPARK! +0.1 MULTIPLIER!');
                this.createSparkEffect();
            }
        },
        
        coinDrop: {
            name: 'Coin Drop',
            type: 'reward',
            minStreak: 0,
            description: 'Coins fall out!',
            effect: 'Free bank bonus',
            visual: 'coins',
            execute: () => {
                const bonus = 10 + Math.floor(Math.random() * 91); // 10-100
                this.bank += bonus;
                localStorage.setItem('bank', this.bank);
                this.showEventResult(`COIN DROP! +${bonus} COINS!`);
                this.createCoinRain(bonus);
            }
        },
        
        mysteryChest: {
            name: 'Mystery Chest',
            type: 'reward',
            minStreak: 5,
            description: 'A chest appears!',
            effect: 'Win = item, Lose = nothing',
            visual: 'chest',
            execute: (won) => {
                if (won) {
                    this.showEventResult('CHEST OPENED! ITEM GAINED!');
                    // Give random item or bonus
                    this.grantRandomItem();
                } else {
                    this.showEventResult('CHEST LOCKED!');
                }
            }
        },
        
        goldenFlash: {
            name: 'Golden Flash',
            type: 'reward',
            minStreak: 15,
            description: 'Golden light!',
            effect: 'Next flip guaranteed win',
            visual: 'golden',
            rarity: 0.01, // 1% chance
            execute: () => {
                this.activeEffects.goldenFlash = true;
                this.showEventResult('GOLDEN FLASH! NEXT FLIP GUARANTEED!');
                this.createGoldenEffect();
            }
        },
        
        // RANDOM RISKS
        cursedFlip: {
            name: 'Cursed Flip',
            type: 'risk',
            minStreak: 15,
            description: 'Coin turns dark!',
            effect: 'Win drops multiplier, lose resets streak',
            visual: 'cursed',
            execute: (won) => {
                if (won) {
                    this.multiplier = Math.max(1, this.multiplier - 0.2);
                    this.showEventResult('CURSED WIN! MULTIPLIER DROPPED!');
                } else {
                    this.showEventResult('CURSED LOSS! STREAK RESET!');
                }
                this.createCurseEffect();
            }
        },
        
        staticInterference: {
            name: 'Static',
            type: 'risk',
            minStreak: 10,
            description: 'Display distorts!',
            effect: 'Input lag',
            visual: 'static',
            execute: () => {
                this.showEventResult('STATIC INTERFERENCE!');
                document.getElementById('gameContainer').classList.add('static-effect');
                setTimeout(() => {
                    document.getElementById('gameContainer').classList.remove('static-effect');
                }, 3000);
            }
        },
        
        greedyCoin: {
            name: 'Greedy Coin',
            type: 'risk',
            minStreak: 8,
            description: 'Coin demands decision!',
            effect: 'Must bank or continue immediately',
            visual: 'greedy',
            execute: (won) => {
                if (won) {
                    this.showEventResult('GREEDY COIN! BANK OR CONTINUE NOW!');
                    this.forceDecision = true;
                    this.showBankOrContinue();
                }
            }
        },
        
        reverseFlip: {
            name: 'Reverse Flip',
            type: 'risk',
            minStreak: 5,
            description: 'Outcome reverses!',
            effect: 'Heads becomes Tails',
            visual: 'reverse',
            execute: () => {
                this.reverseResult = true;
                this.showEventResult('REVERSE FLIP! OUTCOMES SWAPPED!');
            }
        },
        
        // SKILL MOMENTS
        timingWindow: {
            name: 'Perfect Timing',
            type: 'skill',
            minStreak: 3,
            description: 'Timing bar appears!',
            effect: 'Hit perfect = +0.2 multiplier',
            visual: 'timing',
            execute: () => {
                this.showTimingBar();
            }
        },
        
        catchTheCoin: {
            name: 'Catch!',
            type: 'skill',
            minStreak: 5,
            description: 'Catch the coin!',
            effect: 'Success = +50 coins',
            visual: 'catch',
            execute: () => {
                this.startCatchMiniGame();
            }
        },
        
        coinChase: {
            name: 'Rolling Away!',
            type: 'skill',
            minStreak: 10,
            description: 'Coin rolls off!',
            effect: 'Tap to save streak',
            visual: 'chase',
            execute: () => {
                this.startChaseMiniGame();
            }
        },
        
        // SPECIAL ENCOUNTERS
        coinSpirit: {
            name: 'Coin Spirit',
            type: 'encounter',
            minStreak: 20,
            description: 'A spirit appears!',
            effect: 'Offers challenge',
            visual: 'spirit',
            execute: () => {
                this.showSpiritChallenge();
            }
        },
        
        shadowFlipper: {
            name: 'Shadow Rival',
            type: 'encounter',
            minStreak: 15,
            description: 'Rival appears!',
            effect: 'Competes for multiplier',
            visual: 'shadow',
            execute: () => {
                this.startShadowDuel();
            }
        },
        
        bankRobber: {
            name: 'Bank Robber!',
            type: 'encounter',
            minStreak: 10,
            description: 'Thief alert!',
            effect: 'Defend your bank',
            visual: 'robber',
            execute: () => {
                this.defendBank();
            }
        },
        
        // COSMETIC EVENTS
        mimicCoin: {
            name: 'Mimic',
            type: 'cosmetic',
            minStreak: 0,
            description: 'Coin comes alive!',
            effect: 'Just for fun',
            visual: 'mimic',
            execute: () => {
                this.showEventResult('THE COIN HAS EYES! ??');
                this.animateMimic();
            }
        },
        
        coinJoke: {
            name: 'Comedian Coin',
            type: 'cosmetic',
            minStreak: 0,
            description: 'Coin tells joke',
            effect: 'Random text',
            visual: 'joke',
            execute: () => {
                const jokes = [
                    'Stop flipping me, I\'m dizzy!',
                    'Heads I win, Tails you lose!',
                    'I\'m two-faced and proud!',
                    'Flip me gently, I bruise easily!',
                    'Another day, another flip...'
                ];
                const joke = jokes[Math.floor(Math.random() * jokes.length)];
                this.showEventResult(joke);
            }
        },
        
        timeWarp: {
            name: 'Time Warp',
            type: 'cosmetic',
            minStreak: 7,
            description: 'Everything slows!',
            effect: 'Dramatic effect',
            visual: 'timewarp',
            execute: () => {
                this.showEventResult('TIME WARP ACTIVATED!');
                document.getElementById('gameContainer').classList.add('time-warp');
                setTimeout(() => {
                    document.getElementById('gameContainer').classList.remove('time-warp');
                }, 3000);
            }
        },
        
        // LEGENDARY EVENTS
        coinEclipse: {
            name: 'Coin Eclipse',
            type: 'legendary',
            minStreak: 30,
            description: 'Darkness falls!',
            effect: 'Win for rare reward',
            visual: 'eclipse',
            rarity: 0.005, // 0.5% chance
            execute: (won) => {
                this.createEclipseEffect();
                if (won) {
                    this.showEventResult('ECLIPSE MASTERED! LEGENDARY REWARD!');
                    this.grantLegendaryReward();
                } else {
                    this.showEventResult('ECLIPSE FAILED!');
                }
            }
        },
        
        treasureFlip: {
            name: 'Treasure Flip',
            type: 'legendary',
            minStreak: 50,
            description: 'Golden coin!',
            effect: 'Jackpot payout',
            visual: 'treasure',
            rarity: 0.003,
            execute: (won) => {
                if (won) {
                    const jackpot = 500 + this.streak * 10;
                    this.bank += jackpot;
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult(`TREASURE! +${jackpot} COINS!`);
                    this.launchFireworks();
                }
            }
        },
        
        devilsBargain: {
            name: 'Devil\'s Bargain',
            type: 'legendary',
            minStreak: 25,
            description: 'A dark offer...',
            effect: 'High risk, high reward',
            visual: 'devil',
            rarity: 0.01,
            execute: () => {
                this.showDevilsBargain();
            }
        }
    };
};

CoinFlipGame.prototype.checkForRandomEvent = function(flipContext = {}) {
    // Don't trigger during battles or other special modes
    if (this.battleMode?.battleInProgress || this.eventActive) return false;
    
    // Calculate event chance - increased base chance from 10% to 15%
    let chance = 0.15;
    
    // Increase chance based on streak
    if (this.streak > 10) chance += 0.05;  // +5% at streak 10+
    if (this.streak > 20) chance += 0.05;  // +5% at streak 20+
    if (this.streak > 30) chance += 0.10;  // +10% at streak 30+
    // Total max chance: 35% at streak 30+
    
    const multiplier = flipContext.eventChanceMultiplier ?? 1;
    const bonus = flipContext.eventChanceBonus ?? 0;
    chance = chance * multiplier + bonus;
    
    if (flipContext.cancelEvent) {
        const reason = flipContext.blockEventReason || 'Event cancelled.';
        this.showMessage(reason);
        return false;
    }
    
    const cancelRequests = flipContext.eventCancelRequests || [];
    const forceTrigger = !!flipContext.forceEventTrigger;
    
    const roll = Math.random();
    console.log(`Event check: rolled ${roll.toFixed(3)} vs chance ${chance.toFixed(3)}`);
    
    if (!forceTrigger && roll >= chance) return false;
    
    if (cancelRequests.length > 0) {
        const request = cancelRequests.pop();
        if (typeof this.applyItemHook === 'function') {
            this.applyItemHook('onEventCheck', flipContext, { triggered: true, cancelled: true });
        }
        this.showMessage(request.reason || 'An item cancelled the random event!');
        return false;
    }
    
    // Filter available events based on streak
    const availableEvents = Object.entries(this.randomEvents).filter(([key, event]) => {
        return this.streak >= event.minStreak;
    });
    
    if (availableEvents.length === 0) return false;
    
    // Consider rarity
    let selectedEvent;
    const rarityRoll = Math.random();
    
    // Check for rare events first
    const rareEvents = availableEvents.filter(([k, e]) => e.rarity && rarityRoll < e.rarity);
    if (rareEvents.length > 0) {
        selectedEvent = rareEvents[Math.floor(Math.random() * rareEvents.length)];
    } else {
        selectedEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    }
    
    // Trigger event
    this.triggerRandomEvent(selectedEvent[0], flipContext);
    return true;
};

CoinFlipGame.prototype.triggerRandomEvent = function(eventKey, flipContext = {}) {
    const event = this.randomEvents[eventKey];
    if (!event) return;
    
    const eventPayload = {
        event,
        context: flipContext,
        messages: []
    };
    
    if (typeof this.applyItemHook === 'function') {
        this.applyItemHook('onRandomEvent', eventPayload);
    }
    
    const selectEventByType = (types) => {
        const candidates = Object.entries(this.randomEvents).filter(([key, evt]) => types.includes(evt.type) && this.streak >= evt.minStreak);
        if (candidates.length === 0) return null;
        const [key, value] = candidates[Math.floor(Math.random() * candidates.length)];
        return { key, value };
    };
    
    let chosenEvent = event;
    let chosenKey = eventKey;
    
    if (eventPayload.convertToPositive) {
        const positive = selectEventByType(['reward', 'cosmetic']);
        if (positive) {
            chosenKey = positive.key;
            chosenEvent = positive.value;
        }
    }
    
    if (eventPayload.convertToNegative) {
        const negative = selectEventByType(['risk', 'mutation', 'legendary']);
        if (negative) {
            chosenKey = negative.key;
            chosenEvent = negative.value;
        }
    }
    
    this.eventActive = true;
    this.currentEvent = { ...chosenEvent };
    eventPayload.event = this.currentEvent;
    const originalExecute = this.currentEvent.execute?.bind(this);
    
    if (typeof this.applyItemHook === 'function') {
        this.applyItemHook('onEventCheck', flipContext, { triggered: true, event: this.currentEvent });
    }
    
    if (eventPayload.overrideWithReward || eventPayload.overrideWithPenalty) {
        this.currentEvent.execute = (won) => {
            if (eventPayload.overrideWithReward && won) {
                const reward = eventPayload.overrideWithReward;
                if (reward.type === 'coins') {
                    const amount = reward.amount || 0;
                    this.bank += amount;
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult(`BONUS REWARD! +${amount} COINS`);
                }
            } else if (eventPayload.overrideWithPenalty && !won) {
                const penalty = eventPayload.overrideWithPenalty;
                if (penalty.type === 'coins') {
                    const amount = Math.abs(penalty.amount || 0);
                    this.bank = Math.max(0, this.bank - amount);
                    localStorage.setItem('bank', this.bank);
                    this.showEventResult(`PENALTY! -${amount} COINS`);
                }
            } else if (originalExecute) {
                originalExecute(won);
            }
        };
    }
    
    // Show event notification
    this.showEventNotification(this.currentEvent);
    
    // Apply visual effect
    this.applyEventVisual(this.currentEvent.visual);
    
    // Store in history
    this.eventHistory.push({
        name: this.currentEvent.name,
        streak: this.streak,
        timestamp: Date.now()
    });
    
    if (eventPayload.messages && eventPayload.messages.length > 0) {
        this.showMessage(eventPayload.messages[eventPayload.messages.length - 1]);
    }
    
    // Some events execute immediately, others after flip
    if (this.currentEvent.type === 'skill' || this.currentEvent.type === 'encounter') {
        this.currentEvent.execute();
    }
};

CoinFlipGame.prototype.showEventNotification = function(event) {
    const notification = document.createElement('div');
    notification.className = `event-notification event-${event.type}`;
    notification.innerHTML = `
        <div class="event-icon">${this.getEventIcon(event.type)}</div>
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

CoinFlipGame.prototype.getEventIcon = function(type) {
    const icons = {
        mutation: '??',
        reward: '??',
        risk: '??',
        skill: '??',
        encounter: '??',
        cosmetic: '?',
        legendary: '??'
    };
    return icons[type] || '?';
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