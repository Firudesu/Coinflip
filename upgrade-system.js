// Coin Upgrade System for CoinFlipGame
// Permanent upgrades that persist across sessions

CoinFlipGame.prototype.initUpgradeSystem = function() {
    // Token-based workshop system
    this.tokens = 0;
    this.totalWins = 0;
    this.workshopUpgrades = {
        weightedCoin: { level: 0, max: 10, cost: 1, tier: 1 },
        secondChance: { level: 0, max: 3, cost: 3, tier: 2 },
        twinToss: { level: 0, max: 5, cost: 4, tier: 3 },
        momentumEngine: { level: 0, max: 10, cost: 2, tier: 4 },
        safetyNet: { level: 0, max: 2, cost: 5, tier: 3 },
        goldenEdge: { level: 0, max: 5, cost: 4, tier: 5 },
        echoFlip: { level: 0, max: 3, cost: 5, tier: 5 },
        bankShield: { level: 0, max: 3, cost: 6, tier: 6 },
        coinSoul: { level: 0, max: 1, cost: 8, tier: 7 },
        reinforcedAlloy: { level: 0, max: 5, cost: 3, tier: 4 },
        restorationCircuit: { level: 0, max: 3, cost: 5, tier: 5 },
        fortuneMemory: { level: 0, max: 3, cost: 6, tier: 6 }
    };
    
    this.workshopUnlocked = false;
    this.workshopTier = 1;
    this.refundMode = false;
    
    // Load saved upgrades
    this.loadUpgrades();
    
    // Setup workshop listeners
    this.setupWorkshopListeners();
    
    // Define upgrade details
    this.upgradeDefinitions = this.defineUpgrades();
};

CoinFlipGame.prototype.defineUpgrades = function() {
    return {
        weightedCoin: {
            name: 'Weighted Coin',
            icon: '⚖️',
            description: '+1% base win chance per upgrade',
            effect: (level) => `+${level}% win chance`,
            tier: 1,
            getValue: (level) => level * 0.01,
            category: 'basic'
        },
        secondChance: {
            name: 'Second Chance',
            icon: '🔄',
            description: '5% chance to reflip after a loss',
            effect: (level) => `${level * 5}% reflip chance`,
            tier: 2,
            getValue: (level) => level * 0.05,
            category: 'advanced'
        },
        twinToss: {
            name: 'Twin Toss',
            icon: '👯',
            description: '2% chance to land double result',
            effect: (level) => `${level * 2}% double result`,
            tier: 3,
            getValue: (level) => level * 0.02,
            category: 'advanced'
        },
        momentumEngine: {
            name: 'Momentum Engine',
            icon: '⚡',
            description: '+0.02 base multiplier growth per win',
            effect: (level) => `+${(level * 0.02).toFixed(2)} multiplier growth`,
            tier: 4,
            getValue: (level) => level * 0.02,
            category: 'master'
        },
        safetyNet: {
            name: 'Safety Net',
            icon: '🛡️',
            description: 'Lose streak but keep half multiplier',
            effect: (level) => level > 0 ? 'Keep 50% multiplier on loss' : 'Inactive',
            tier: 3,
            getValue: (level) => level > 0 ? 0.5 : 0,
            category: 'advanced'
        },
        goldenEdge: {
            name: 'Golden Edge',
            icon: '✨',
            description: '+1% chance to earn double coins on correct flip',
            effect: (level) => `${level}% double coins`,
            tier: 5,
            getValue: (level) => level * 0.01,
            category: 'master'
        },
        echoFlip: {
            name: 'Echo Flip',
            icon: '🔊',
            description: '2% chance that winning flip repeats instantly',
            effect: (level) => `${level * 2}% echo chance`,
            tier: 5,
            getValue: (level) => level * 0.02,
            category: 'master'
        },
        bankShield: {
            name: 'Bank Shield',
            icon: '🛡️',
            description: 'When banking, 5% of coins are protected from loss next round',
            effect: (level) => `${level * 5}% protection`,
            tier: 6,
            getValue: (level) => level * 0.05,
            category: 'legendary'
        },
        coinSoul: {
            name: 'Coin Soul',
            icon: '👻',
            description: 'Each 50 total wins adds +0.5% permanent win chance',
            effect: (level) => level > 0 ? 'Passive global buff' : 'Inactive',
            tier: 7,
            getValue: (level) => level > 0 ? 0.005 : 0,
            category: 'legendary'
        },
        reinforcedAlloy: {
            name: 'Reinforced Alloy',
            icon: '🔧',
            description: 'Reduces item durability loss chance by 15% per level',
            effect: (level) => `${level * 15}% durability protection`,
            tier: 4,
            getValue: (level) => level * 0.15,
            category: 'master'
        },
        restorationCircuit: {
            name: 'Restoration Circuit',
            icon: '🔄',
            description: '10% chance to repair 1 durability point after each win streak',
            effect: (level) => `${level * 10}% repair chance`,
            tier: 5,
            getValue: (level) => level * 0.10,
            category: 'master'
        },
        fortuneMemory: {
            name: 'Fortune Memory',
            icon: '🧠',
            description: '2% chance on flip to prevent item durability loss',
            effect: (level) => `${level * 2}% durability save`,
            tier: 6,
            getValue: (level) => level * 0.02,
            category: 'legendary'
        }
    };
};

CoinFlipGame.prototype.setupWorkshopListeners = function() {
    // Workshop button
    document.getElementById('workshopBtn').addEventListener('click', () => {
        this.openWorkshop();
    });
    
    // Close workshop
    document.getElementById('closeWorkshop').addEventListener('click', () => {
        document.getElementById('workshopModal').classList.remove('show');
    });
    
    // Upgrade tabs
    document.querySelectorAll('.upgrade-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            this.switchUpgradeCategory(e.target.dataset.category);
        });
    });
    
    // Purchase button
    document.getElementById('purchaseUpgradeBtn').addEventListener('click', () => {
        if (this.selectedUpgrade) {
            this.purchaseUpgrade(this.selectedUpgrade);
        }
    });
    
    // Refund mode
    document.getElementById('refundBtn').addEventListener('click', () => {
        this.toggleRefundMode();
    });
};

CoinFlipGame.prototype.openWorkshop = function() {
    if (!this.workshopUnlocked) {
        this.showMessage('WIN A BATTLE TO UNLOCK WORKSHOP!');
        return;
    }
    
    const modal = document.getElementById('workshopModal');
    modal.classList.add('show');
    
    this.updateWorkshopDisplay();
    this.loadUpgradesList('basic');
};

CoinFlipGame.prototype.updateWorkshopDisplay = function() {
    // Update tokens
    document.getElementById('workshopTokens').textContent = this.tokens;
    
    // Update tier
    document.getElementById('workshopTier').textContent = this.workshopTier;
    
    // Update current bonuses
    this.updateBonusList();
};

CoinFlipGame.prototype.loadUpgradesList = function(category) {
    const list = document.getElementById('upgradesList');
    list.innerHTML = '';
    
    Object.entries(this.upgradeDefinitions).forEach(([key, upgrade]) => {
        if (upgrade.category !== category) return;
        if (upgrade.tier > this.workshopTier) return;
        
        const upgradeData = this.workshopUpgrades[key];
        const level = upgradeData.level;
        const maxLevel = upgradeData.max;
        const cost = upgradeData.cost;
        
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        
        if (level >= maxLevel) {
            div.classList.add('maxed');
        } else if (this.tokens < cost) {
            div.classList.add('disabled');
        }
        
        div.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-details">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-level">Level ${level}/${maxLevel}</div>
                <div class="upgrade-effect">${upgrade.effect(level)}</div>
            </div>
            <div class="upgrade-cost">
                ${level >= maxLevel ? 'MAXED' : `${cost} 🎫`}
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (this.refundMode && level > 0) {
                this.refundUpgrade(key);
            } else if (level < maxLevel) {
                this.selectUpgrade(key);
            }
        });
        
        list.appendChild(div);
    });
};

CoinFlipGame.prototype.selectUpgrade = function(key) {
    this.selectedUpgrade = key;
    const upgrade = this.upgradeDefinitions[key];
    const upgradeData = this.workshopUpgrades[key];
    const cost = upgradeData.cost;
    
    const selectedDiv = document.getElementById('selectedUpgrade');
    selectedDiv.innerHTML = `
        <h3>${upgrade.icon} ${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div>Current: Level ${upgradeData.level}/${upgradeData.max}</div>
        <div>Next Level: ${upgrade.effect(upgradeData.level + 1)}</div>
        <div>Cost: ${cost} tokens</div>
    `;
    
    const purchaseBtn = document.getElementById('purchaseUpgradeBtn');
    purchaseBtn.disabled = this.tokens < cost || upgradeData.level >= upgradeData.max;
};

CoinFlipGame.prototype.purchaseUpgrade = function(key) {
    const upgradeData = this.workshopUpgrades[key];
    const cost = upgradeData.cost;
    
    if (this.tokens < cost || upgradeData.level >= upgradeData.max) return;
    
    // Purchase upgrade
    this.tokens -= cost;
    upgradeData.level++;
    
    // Save
    this.saveUpgrades();
    localStorage.setItem('tokens', this.tokens);
    
    // Update displays
    this.updateDisplay();
    this.updateWorkshopDisplay();
    this.loadUpgradesList(this.upgradeDefinitions[key].category);
    
    // Update coin visuals
    this.updateCoinVisuals();
    
    // Show message
    const upgrade = this.upgradeDefinitions[key];
    this.showMessage(`UPGRADED ${upgrade.name.toUpperCase()} TO LEVEL ${upgradeData.level}!`);
    
    // Play sound
    try {
        document.getElementById('celebrationSound').play();
    } catch(e) {}
};

CoinFlipGame.prototype.refundUpgrade = function(key) {
    const upgradeData = this.workshopUpgrades[key];
    if (upgradeData.level <= 0) return;
    
    // Calculate refund (50% of total spent)
    const totalSpent = upgradeData.level * upgradeData.cost;
    const refund = Math.floor(totalSpent * 0.5);
    
    // Refund
    this.tokens += refund;
    upgradeData.level = 0;
    
    // Save
    this.saveUpgrades();
    localStorage.setItem('tokens', this.tokens);
    
    // Update
    this.updateDisplay();
    this.updateWorkshopDisplay();
    this.loadUpgradesList(this.upgradeDefinitions[key].category);
    
    this.showMessage(`REFUNDED! +${refund} TOKENS`);
};

// Remove old getUpgradeCost method as we now use fixed token costs

CoinFlipGame.prototype.toggleRefundMode = function() {
    this.refundMode = !this.refundMode;
    const btn = document.getElementById('refundBtn');
    
    if (this.refundMode) {
        btn.textContent = 'EXIT REFUND';
        btn.style.background = '#ff6b6b';
        this.showMessage('CLICK UPGRADES TO REFUND (50% VALUE)');
    } else {
        btn.textContent = 'REFUND MODE';
        btn.style.background = '';
    }
};

CoinFlipGame.prototype.switchUpgradeCategory = function(category) {
    // Update tabs
    document.querySelectorAll('.upgrade-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Load upgrades
    this.loadUpgradesList(category);
};

CoinFlipGame.prototype.updateBonusList = function() {
    const list = document.getElementById('bonusList');
    list.innerHTML = '';
    
    Object.entries(this.workshopUpgrades).forEach(([key, data]) => {
        if (data.level > 0) {
            const upgrade = this.upgradeDefinitions[key];
            const div = document.createElement('div');
            div.className = 'bonus-item';
            div.innerHTML = `${upgrade.icon} ${upgrade.name}: ${upgrade.effect(data.level)}`;
            list.appendChild(div);
        }
    });
    
    if (list.innerHTML === '') {
        list.innerHTML = '<div class="bonus-item">No upgrades yet</div>';
    }
};

CoinFlipGame.prototype.updateCoinVisuals = function() {
    // Calculate total upgrade level
    let totalLevel = 0;
    Object.values(this.workshopUpgrades).forEach(u => totalLevel += u.level);
    
    // Update coin glow based on upgrades
    const canvas = this.canvas;
    canvas.classList.remove('upgrade-glow-1', 'upgrade-glow-2', 'upgrade-glow-3');
    
    if (totalLevel >= 15) {
        canvas.classList.add('upgrade-glow-3');
    } else if (totalLevel >= 8) {
        canvas.classList.add('upgrade-glow-2');
    } else if (totalLevel >= 3) {
        canvas.classList.add('upgrade-glow-1');
    }
};

CoinFlipGame.prototype.checkWorkshopUnlock = function() {
    if (this.battleMode && this.battleMode.wins >= 1 && !this.workshopUnlocked) {
        this.workshopUnlocked = true;
        localStorage.setItem('workshopUnlocked', 'true');
        this.showMessage('WORKSHOP UNLOCKED! UPGRADE YOUR COIN!');
        
        // Update workshop tier based on progression
        this.updateWorkshopTier();
    }
};

CoinFlipGame.prototype.updateWorkshopTier = function() {
    let newTier = 1;
    
    if (this.bestStreak >= 100) {
        newTier = 7;
    } else if (this.bestStreak >= 75) {
        newTier = 6;
    } else if (this.bestStreak >= 50) {
        newTier = 5;
    } else if (this.bestStreak >= 25) {
        newTier = 4;
    } else if (this.bestStreak >= 15) {
        newTier = 3;
    } else if (this.bestStreak >= 10) {
        newTier = 2;
    }
    
    if (newTier > this.workshopTier) {
        this.workshopTier = newTier;
        localStorage.setItem('workshopTier', this.workshopTier);
        this.showMessage(`WORKSHOP TIER ${newTier} UNLOCKED!`);
    }
};

CoinFlipGame.prototype.saveUpgrades = function() {
    const upgradeData = {};
    Object.entries(this.workshopUpgrades).forEach(([key, data]) => {
        upgradeData[key] = data.level;
    });
    localStorage.setItem('workshopUpgrades', JSON.stringify(upgradeData));
};

CoinFlipGame.prototype.loadUpgrades = function() {
    const saved = localStorage.getItem('workshopUpgrades');
    if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, level]) => {
            if (this.workshopUpgrades[key]) {
                this.workshopUpgrades[key].level = level;
            }
        });
    }
    
    this.tokens = parseInt(localStorage.getItem('tokens') || '0');
    this.totalWins = parseInt(localStorage.getItem('totalWins') || '0');
    this.workshopUnlocked = localStorage.getItem('workshopUnlocked') === 'true';
    this.workshopTier = parseInt(localStorage.getItem('workshopTier') || '1');
};

// Apply upgrade effects to gameplay
CoinFlipGame.prototype.getUpgradeBonus = function(type) {
    // Map old upgrade types to new workshop upgrades
    const typeMapping = {
        'winChance': 'weightedCoin',
        'streakSaver': 'secondChance',
        'multiplierGuard': 'safetyNet'
    };
    
    const mappedType = typeMapping[type] || type;
    const upgrade = this.workshopUpgrades[mappedType];
    const definition = this.upgradeDefinitions[mappedType];
    
    if (!upgrade || upgrade.level === 0) return 0;
    
    return definition.getValue(upgrade.level);
};

// Add token earning methods
CoinFlipGame.prototype.earnTokens = function(amount, reason) {
    this.tokens += amount;
    localStorage.setItem('tokens', this.tokens);
    this.showMessage(`EARNED ${amount} TOKENS! (${reason})`);
    this.updateWorkshopDisplay();
};

CoinFlipGame.prototype.checkTokenMilestones = function() {
    // Award tokens for streak milestones
    const streakMilestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    if (streakMilestones.includes(this.streak)) {
        const tokenAmount = Math.floor(this.streak / 5);
        this.earnTokens(tokenAmount, `${this.streak} STREAK MILESTONE`);
    }
};

// Initialize upgrade system
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.game) {
            window.game.initUpgradeSystem();
        }
    }, 200);
});