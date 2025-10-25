// Random Events System for CoinFlipGame
// Background modifiers that trigger occasionally during coin flips

CoinFlipGame.prototype.initRandomEvents = function() {
    this.eventActive = false;
    this.currentEvent = null;
    this.eventHistory = [];
    this.baseEventChance = 0.15; // 15% base chance per flip
    this.activeRandomEvents = {}; // Track active events with durations
    
    // Define all events
    this.randomEvents = this.defineRandomEvents();
    
    console.log('Random events initialized');
};

CoinFlipGame.prototype.defineRandomEvents = function() {
    return {
        coinCrack: {
            name: 'Coin Crack',
            description: 'Reduces chance of landing heads by 15%',
            duration: 5,
            triggerChance: 0.08,
            visual: 'crack',
            effect: {
                headsChance: -0.15
            },
            message: 'Coin Crack!',
            endMessage: 'Coin Crack Ended'
        },
        
        windShift: {
            name: 'Wind Shift',
            description: 'Increases chance of tails by 20%',
            duration: 5,
            triggerChance: 0.10,
            visual: 'wind',
            effect: {
                tailsChance: 0.20
            },
            message: 'Wind Shift!',
            endMessage: 'Wind Shift Ended'
        },
        
        luckySpark: {
            name: 'Lucky Spark',
            description: 'Increases streak gain by +1 for each successful flip',
            duration: 3,
            triggerChance: 0.06,
            visual: 'spark',
            effect: {
                streakBonus: 1
            },
            message: 'Lucky Spark Active!',
            endMessage: 'Lucky Spark Ended'
        },
        
        badToss: {
            name: 'Bad Toss',
            description: 'Reduces overall accuracy by 10% (chance for null result)',
            duration: 3,
            triggerChance: 0.07,
            visual: 'shake',
            effect: {
                nullChance: 0.10
            },
            message: 'Bad Toss!',
            endMessage: 'Bad Toss Ended'
        },
        
        coinOnSide: {
            name: 'Coin Lands on Side',
            description: 'Extremely rare; coin lands on its side. Streak and multiplier double instantly',
            duration: 0, // Instant effect
            triggerChance: 0.01,
            visual: 'side',
            effect: {
                instant: true,
                streakMultiplier: 2,
                multiplierBonus: 2
            },
            message: 'Coin on Edge!',
            endMessage: null
        },
        
        falseToss: {
            name: 'False Toss',
            description: 'Flip is voided; player gets no score this round',
            duration: 1,
            triggerChance: 0.05,
            visual: 'void',
            effect: {
                voidFlip: true
            },
            message: 'False Toss! Try Again.',
            endMessage: 'False Toss Ended'
        },
        
        hotStreak: {
            name: 'Hot Streak',
            description: 'Increases all rewards by 25%',
            duration: 4,
            triggerChance: 0.06,
            visual: 'hot',
            effect: {
                rewardMultiplier: 1.25
            },
            message: 'Hot Streak!',
            endMessage: 'Hot Streak Ended'
        },
        
        coldFlip: {
            name: 'Cold Flip',
            description: 'Decreases all rewards by 25%',
            duration: 4,
            triggerChance: 0.06,
            visual: 'cold',
            effect: {
                rewardMultiplier: 0.75
            },
            message: 'Cold Flip!',
            endMessage: 'Cold Flip Ended'
        },
        
        doubleFlipper: {
            name: 'Double Flip',
            description: 'Two flips occur in one round. Both results count',
            duration: 1,
            triggerChance: 0.03,
            visual: 'double',
            effect: {
                doubleFlip: true
            },
            message: 'Double Flip!',
            endMessage: 'Double Flip Ended'
        },
        
        reverseLuck: {
            name: 'Reverse Luck',
            description: 'Heads and Tails effects are swapped',
            duration: 4,
            triggerChance: 0.04,
            visual: 'reverse',
            effect: {
                reverseLogic: true
            },
            message: 'Reverse Luck!',
            endMessage: 'Reverse Luck Ended'
        }
    };
};

CoinFlipGame.prototype.checkForRandomEvent = function() {
    // Don't trigger events if one is already processing
    if (this.processingEvent) return false;
    
    const roll = Math.random();
    console.log('Event check: rolled', roll.toFixed(3), 'vs chance', this.baseEventChance.toFixed(3));
    
    if (roll < this.baseEventChance) {
        // Select random event
        const eventKeys = Object.keys(this.randomEvents);
        const availableEvents = eventKeys.filter(key => {
            const event = this.randomEvents[key];
            return Math.random() < event.triggerChance;
        });
        
        if (availableEvents.length > 0) {
            const selectedKey = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            const selectedEvent = this.randomEvents[selectedKey];
            
            this.triggerRandomEvent(selectedKey, selectedEvent);
            return true;
        }
    }
    
    return false;
};

CoinFlipGame.prototype.triggerRandomEvent = function(eventKey, event) {
    console.log('Triggering event:', event.name);
    
    // Handle instant effects
    if (event.effect.instant) {
        this.executeInstantEvent(event);
        return;
    }
    
    // Add to active events
    this.activeRandomEvents[eventKey] = {
        ...event,
        flipsRemaining: event.duration,
        startTime: Date.now()
    };
    
    // Show visual feedback
    this.showRandomEventFeedback(event);
    this.updateRandomEventDisplay();
};

CoinFlipGame.prototype.executeInstantEvent = function(event) {
    if (event.effect.streakMultiplier) {
        this.streak *= event.effect.streakMultiplier;
    }
    if (event.effect.multiplierBonus) {
        this.multiplier *= event.effect.multiplierBonus;
    }
    
    this.showRandomEventFeedback(event);
    this.showFloatingText(event.message);
};

CoinFlipGame.prototype.applyRandomEventEffects = function() {
    let modifiers = {
        headsChance: 0,
        tailsChance: 0,
        streakBonus: 0,
        rewardMultiplier: 1,
        nullChance: 0,
        voidFlip: false,
        doubleFlip: false,
        reverseLogic: false
    };
    
    // Apply all active event effects
    Object.values(this.activeRandomEvents).forEach(event => {
        if (event.effect.headsChance) modifiers.headsChance += event.effect.headsChance;
        if (event.effect.tailsChance) modifiers.tailsChance += event.effect.tailsChance;
        if (event.effect.streakBonus) modifiers.streakBonus += event.effect.streakBonus;
        if (event.effect.rewardMultiplier) modifiers.rewardMultiplier *= event.effect.rewardMultiplier;
        if (event.effect.nullChance) modifiers.nullChance += event.effect.nullChance;
        if (event.effect.voidFlip) modifiers.voidFlip = true;
        if (event.effect.doubleFlip) modifiers.doubleFlip = true;
        if (event.effect.reverseLogic) modifiers.reverseLogic = true;
    });
    
    return modifiers;
};

CoinFlipGame.prototype.processRandomEventResults = function(won, result) {
    const modifiers = this.applyRandomEventEffects();
    
    // Apply streak bonus
    if (won && modifiers.streakBonus > 0) {
        this.streak += modifiers.streakBonus;
        this.showFloatingText(`+${modifiers.streakBonus} Bonus Streak!`);
    }
    
    // Apply reward multiplier
    if (won && modifiers.rewardMultiplier !== 1) {
        const oldScore = this.score;
        this.score = Math.round(this.score * modifiers.rewardMultiplier);
        const bonus = this.score - oldScore;
        if (bonus > 0) {
            this.showFloatingText(`+${bonus} Event Bonus!`);
        } else if (bonus < 0) {
            this.showFloatingText(`${bonus} Event Penalty!`);
        }
    }
    
    // Handle void flip
    if (modifiers.voidFlip) {
        this.showFloatingText('Flip Voided!');
        return 'void'; // Special return to indicate void
    }
    
    return result;
};

CoinFlipGame.prototype.decreaseRandomEventDurations = function() {
    const eventsToRemove = [];
    
    Object.keys(this.activeRandomEvents).forEach(eventKey => {
        const event = this.activeRandomEvents[eventKey];
        event.flipsRemaining--;
        
        if (event.flipsRemaining <= 0) {
            eventsToRemove.push(eventKey);
            if (event.endMessage) {
                this.showFloatingText(event.endMessage);
            }
        }
    });
    
    // Remove expired events
    eventsToRemove.forEach(eventKey => {
        delete this.activeRandomEvents[eventKey];
    });
    
    this.updateRandomEventDisplay();
};

CoinFlipGame.prototype.showRandomEventFeedback = function(event) {
    // Show visual effect based on event type
    const canvas = this.canvas;
    
    switch(event.visual) {
        case 'crack':
            canvas.style.filter = 'drop-shadow(0 0 20px #ff0000) hue-rotate(0deg)';
            break;
        case 'wind':
            canvas.style.filter = 'drop-shadow(0 0 20px #00ffff) blur(2px)';
            break;
        case 'spark':
            canvas.style.filter = 'drop-shadow(0 0 30px #ffd700) brightness(1.5)';
            break;
        case 'shake':
            canvas.style.animation = 'shake 0.5s infinite';
            break;
        case 'side':
            canvas.style.filter = 'drop-shadow(0 0 40px #ffffff) contrast(2)';
            break;
        case 'void':
            canvas.style.filter = 'grayscale(100%) blur(1px)';
            break;
        case 'hot':
            canvas.style.filter = 'drop-shadow(0 0 25px #ff4500) hue-rotate(20deg)';
            break;
        case 'cold':
            canvas.style.filter = 'drop-shadow(0 0 25px #0080ff) hue-rotate(200deg)';
            break;
        case 'double':
            canvas.style.filter = 'drop-shadow(0 0 20px #ff00ff) saturate(2)';
            break;
        case 'reverse':
            canvas.style.filter = 'invert(1) drop-shadow(0 0 20px #ffffff)';
            break;
    }
    
    // Reset visual effect after 2 seconds
    setTimeout(() => {
        canvas.style.filter = 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))';
        canvas.style.animation = '';
    }, 2000);
    
    // Show floating text
    this.showFloatingText(event.message);
};

CoinFlipGame.prototype.updateRandomEventDisplay = function() {
    // Update the right side panel with active events
    let eventContainer = document.getElementById('randomEventsContainer');
    if (!eventContainer) {
        // Create container if it doesn't exist
        eventContainer = document.createElement('div');
        eventContainer.id = 'randomEventsContainer';
        eventContainer.className = 'random-events-panel';
        eventContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #4ecdc4;
            border-radius: 8px;
            padding: 10px;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            color: #4ecdc4;
            z-index: 1000;
            max-height: 300px;
            overflow-y: auto;
        `;
        document.body.appendChild(eventContainer);
    }
    
    // Clear and update content
    eventContainer.innerHTML = '<div style="text-align: center; margin-bottom: 10px; color: #ffeb3b;">ACTIVE EVENTS</div>';
    
    const activeEventKeys = Object.keys(this.activeRandomEvents);
    if (activeEventKeys.length === 0) {
        eventContainer.innerHTML += '<div style="text-align: center; color: #888;">No active events</div>';
    } else {
        activeEventKeys.forEach(eventKey => {
            const event = this.activeRandomEvents[eventKey];
            const eventDiv = document.createElement('div');
            eventDiv.style.cssText = `
                margin: 5px 0;
                padding: 5px;
                background: rgba(78, 205, 196, 0.1);
                border-radius: 4px;
                border-left: 3px solid #4ecdc4;
            `;
            eventDiv.innerHTML = `
                <div style="color: #ffeb3b; font-weight: bold;">${event.name}</div>
                <div style="color: #fff; font-size: 8px; margin: 2px 0;">${event.description}</div>
                <div style="color: #4ecdc4; font-size: 8px;">${event.flipsRemaining} flips left</div>
            `;
            eventContainer.appendChild(eventDiv);
        });
    }
};

CoinFlipGame.prototype.getRandomEventModifiers = function() {
    return this.applyRandomEventEffects();
};

// Initialize random events when game loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.game) {
            window.game.initRandomEvents();
        }
    }, 300);
});