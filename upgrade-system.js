// Coin Upgrade System for CoinFlipGame
// Permanent upgrades that persist across sessions

CoinFlipGame.prototype.initUpgradeSystem = function() {
    // Gold-based workshop system
    this.workshopUpgrades = {
        coinBias: { level: 0, max: 10, baseCost: 200, tier: 1 },
        streakProtector: { level: 0, max: 5, baseCost: 300, tier: 1 },
        flipForgiveness: { level: 0, max: 5, baseCost: 400, tier: 2 },
        doubleFace: { level: 0, max: 10, baseCost: 250, tier: 2 },
        streakBooster: { level: 0, max: 5, baseCost: 350, tier: 3 },
        coinEcho: { level: 0, max: 10, baseCost: 400, tier: 3 },
        metalCoin: { level: 0, max: 5, baseCost: 300, tier: 2 },
        goldenEdge: { level: 0, max: 10, baseCost: 250, tier: 1 },
        luckyMemory: { level: 0, max: 10, baseCost: 200, tier: 2 },
        safetyToss: { level: 0, max: 1, baseCost: 600, tier: 4 },
        fateControl: { level: 0, max: 5, baseCost: 400, tier: 3 }
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
        coinBias: {
            name: 'Coin Bias',
            icon: '⚖️',
            description: '+1% win chance per level',
            effect: (level) => `+${level}% win chance`,
            tier: 1,
            getValue: (level) => level * 0.01,
            category: 'basic'
        },
        streakProtector: {
            name: 'Streak Protector',
            icon: '🛡️',
            description: '-2% item break chance per level',
            effect: (level) => `${level * 2}% break protection`,
            tier: 1,
            getValue: (level) => level * 0.02,
            category: 'basic'
        },
        flipForgiveness: {
            name: 'Flip Forgiveness',
            icon: '🙏',
            description: '5% chance to ignore a losing flip per level',
            effect: (level) => `${level * 5}% ignore loss`,
            tier: 2,
            getValue: (level) => level * 0.05,
            category: 'advanced'
        },
        doubleFace: {
            name: 'Double Face',
            icon: '👯',
            description: '+1% chance per level for coin to roll "double same" (HH or TT)',
            effect: (level) => `${level}% double same`,
            tier: 2,
            getValue: (level) => level * 0.01,
            category: 'advanced'
        },
        streakBooster: {
            name: 'Streak Booster',
            icon: '📈',
            description: '+0.05 streak multiplier per level',
            effect: (level) => `+${(level * 0.05).toFixed(2)} multiplier`,
            tier: 3,
            getValue: (level) => level * 0.05,
            category: 'master'
        },
        coinEcho: {
            name: 'Coin Echo',
            icon: '🔊',
            description: '+1% chance per level that a win triggers a free bonus flip',
            effect: (level) => `${level}% bonus flip`,
            tier: 3,
            getValue: (level) => level * 0.01,
            category: 'master'
        },
        metalCoin: {
            name: 'Metal Coin',
            icon: '🔩',
            description: '+10% base durability across all equipped items',
            effect: (level) => `+${level * 10}% durability`,
            tier: 2,
            getValue: (level) => level * 0.10,
            category: 'advanced'
        },
        goldenEdge: {
            name: 'Golden Edge',
            icon: '✨',
            description: '+5% more gold earned per win',
            effect: (level) => `+${level * 5}% gold`,
            tier: 1,
            getValue: (level) => level * 0.05,
            category: 'basic'
        },
        luckyMemory: {
            name: 'Lucky Memory',
            icon: '🧠',
            description: '0.5% chance per level to remember last flip result (improves prediction odds)',
            effect: (level) => `${(level * 0.5).toFixed(1)}% memory`,
            tier: 2,
            getValue: (level) => level * 0.005,
            category: 'advanced'
        },
        safetyToss: {
            name: 'Safety Toss',
            icon: '🛡️',
            description: 'First losing flip each session doesn\'t reset streak',
            effect: (level) => level > 0 ? 'Active' : 'Inactive',
            tier: 4,
            getValue: (level) => level > 0 ? 1 : 0,
            category: 'legendary'
        },
        fateControl: {
            name: 'Fate Control',
            icon: '🎭',
            description: '+3% chance per level for positive events, -3% for negative ones',
            effect: (level) => `${level * 3}% event bias`,
            tier: 3,
            getValue: (level) => level * 0.03,
            category: 'master'
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
    // Update bank (gold)
    document.getElementById('workshopBank').textContent = this.bank;
    
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
        const cost = this.getUpgradeCost(key);
        
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        
        if (level >= maxLevel) {
            div.classList.add('maxed');
        } else if (this.bank < cost) {
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
                ${level >= maxLevel ? 'MAXED' : `${cost} 🪙`}
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
    const cost = this.getUpgradeCost(key);
    
    const selectedDiv = document.getElementById('selectedUpgrade');
    selectedDiv.innerHTML = `
        <h3>${upgrade.icon} ${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div>Current: Level ${upgradeData.level}/${upgradeData.max}</div>
        <div>Next Level: ${upgrade.effect(upgradeData.level + 1)}</div>
        <div>Cost: ${cost} gold</div>
    `;
    
    const purchaseBtn = document.getElementById('purchaseUpgradeBtn');
    purchaseBtn.disabled = this.bank < cost || upgradeData.level >= upgradeData.max;
};

CoinFlipGame.prototype.purchaseUpgrade = function(key) {
    const upgradeData = this.workshopUpgrades[key];
    const cost = this.getUpgradeCost(key);
    
    if (this.bank < cost || upgradeData.level >= upgradeData.max) return;
    
    // Purchase upgrade
    this.bank -= cost;
    upgradeData.level++;
    
    // Save
    this.saveUpgrades();
    localStorage.setItem('bank', this.bank);
    
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
    let totalSpent = 0;
    for (let i = 0; i < upgradeData.level; i++) {
        totalSpent += upgradeData.baseCost + (i * upgradeData.baseCost);
    }
    const refund = Math.floor(totalSpent * 0.5);
    
    // Refund
    this.bank += refund;
    upgradeData.level = 0;
    
    // Save
    this.saveUpgrades();
    localStorage.setItem('bank', this.bank);
    
    // Update
    this.updateDisplay();
    this.updateWorkshopDisplay();
    this.loadUpgradesList(this.upgradeDefinitions[key].category);
    
    this.showMessage(`REFUNDED! +${refund} GOLD`);
};

CoinFlipGame.prototype.getUpgradeCost = function(key) {
    const upgradeData = this.workshopUpgrades[key];
    return upgradeData.baseCost + (upgradeData.level * upgradeData.baseCost);
};

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
    
    // Remove token system
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

// Remove token earning methods

// Initialize upgrade system
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.game) {
            window.game.initUpgradeSystem();
        }
    }, 200);
});