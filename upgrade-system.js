// Coin Upgrade System for CoinFlipGame
// Permanent upgrades that persist across sessions

CoinFlipGame.prototype.initUpgradeSystem = function() {
    this.upgrades = {
        winChance: { level: 0, max: 5, baseCost: 50, multiplier: 2.5 },
        streakSaver: { level: 0, max: 5, baseCost: 100, multiplier: 2 },
        multiplierGuard: { level: 0, max: 5, baseCost: 80, multiplier: 2 },
        luckySurge: { level: 0, max: 5, baseCost: 200, multiplier: 3 },
        battleBonus: { level: 0, max: 10, baseCost: 150, multiplier: 1.5 },
        bankBoost: { level: 0, max: 5, baseCost: 60, multiplier: 2 },
        charmSlot: { level: 0, max: 2, baseCost: 500, multiplier: 3 },
        reinforcedAlloy: { level: 0, max: 5, baseCost: 300, multiplier: 2 },
        restorationCircuit: { level: 0, max: 3, baseCost: 500, multiplier: 2.5 },
        fortuneMemory: { level: 0, max: 3, baseCost: 600, multiplier: 3 }
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
        winChance: {
            name: 'Lucky Flip',
            icon: '🎯',
            description: 'Increases base win chance',
            effect: (level) => `+${level}% win chance`,
            tier: 1,
            getValue: (level) => level * 0.01,
            category: 'basic'
        },
        streakSaver: {
            name: 'Streak Shield',
            icon: '🛡️',
            description: 'Chance to keep streak on loss',
            effect: (level) => `${level * 2}% save chance`,
            tier: 2,
            getValue: (level) => level * 0.02,
            category: 'advanced'
        },
        multiplierGuard: {
            name: 'Multi Guard',
            icon: '⚡',
            description: 'Keep multiplier on loss',
            effect: (level) => `${level * 5}% protection`,
            tier: 2,
            getValue: (level) => level * 0.05,
            category: 'advanced'
        },
        luckySurge: {
            name: 'Lucky Surge',
            icon: '🌟',
            description: 'Bonus multiplier every 10 streaks',
            effect: (level) => `+${level * 0.1} bonus`,
            tier: 3,
            getValue: (level) => level * 0.1,
            category: 'master'
        },
        battleBonus: {
            name: 'Battle Master',
            icon: '⚔️',
            description: 'Extra battle winnings',
            effect: (level) => `+${level * 5}% pot bonus`,
            tier: 2,
            getValue: (level) => level * 0.05,
            category: 'advanced'
        },
        bankBoost: {
            name: 'Bank Interest',
            icon: '💰',
            description: 'Better banking conversion',
            effect: (level) => `+${level * 5}% bank rate`,
            tier: 1,
            getValue: (level) => level * 0.05,
            category: 'basic'
        },
        charmSlot: {
            name: 'Extra Pocket',
            icon: '🎒',
            description: 'Additional item slot',
            effect: (level) => `+${level} slot${level > 1 ? 's' : ''}`,
            tier: 4,
            getValue: (level) => level,
            category: 'master'
        },
        reinforcedAlloy: {
            name: 'Reinforced Alloy',
            icon: '🔧',
            description: 'Reduces item durability loss chance',
            effect: (level) => `-${level * 15}% durability loss`,
            tier: 4,
            getValue: (level) => level * 0.15,
            category: 'advanced'
        },
        restorationCircuit: {
            name: 'Restoration Circuit',
            icon: '⚡',
            description: 'Chance to repair durability after wins',
            effect: (level) => `${level * 10}% repair chance`,
            tier: 5,
            getValue: (level) => level * 0.10,
            category: 'master'
        },
        fortuneMemory: {
            name: 'Fortune Memory',
            icon: '🧠',
            description: 'Chance to prevent durability loss',
            effect: (level) => `${level * 2}% prevention chance`,
            tier: 6,
            getValue: (level) => level * 0.02,
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
    if (!this.workshopUnlocked && (!this.battleMode || this.battleMode.wins < 1)) {
        this.showMessage('WIN A BATTLE TO UNLOCK WORKSHOP!');
        return;
    }
    
    const modal = document.getElementById('workshopModal');
    modal.classList.add('show');
    
    this.updateWorkshopDisplay();
    this.loadUpgradesList('basic');
};

CoinFlipGame.prototype.updateWorkshopDisplay = function() {
    // Update currency
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
        
        const upgradeData = this.upgrades[key];
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
    const upgradeData = this.upgrades[key];
    const cost = this.getUpgradeCost(key);
    
    const selectedDiv = document.getElementById('selectedUpgrade');
    selectedDiv.innerHTML = `
        <h3>${upgrade.icon} ${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <div>Current: Level ${upgradeData.level}/${upgradeData.max}</div>
        <div>Next Level: ${upgrade.effect(upgradeData.level + 1)}</div>
        <div>Cost: ${cost} coins</div>
    `;
    
    const purchaseBtn = document.getElementById('purchaseUpgradeBtn');
    purchaseBtn.disabled = this.bank < cost || upgradeData.level >= upgradeData.max;
};

CoinFlipGame.prototype.purchaseUpgrade = function(key) {
    const upgradeData = this.upgrades[key];
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
    const upgradeData = this.upgrades[key];
    if (upgradeData.level <= 0) return;
    
    // Calculate refund (50% of total spent)
    let totalSpent = 0;
    for (let i = 0; i < upgradeData.level; i++) {
        totalSpent += Math.floor(upgradeData.baseCost * Math.pow(upgradeData.multiplier, i));
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
    
    this.showMessage(`REFUNDED! +${refund} COINS`);
};

CoinFlipGame.prototype.getUpgradeCost = function(key) {
    const upgradeData = this.upgrades[key];
    return Math.floor(upgradeData.baseCost * Math.pow(upgradeData.multiplier, upgradeData.level));
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
    
    Object.entries(this.upgrades).forEach(([key, data]) => {
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
    Object.values(this.upgrades).forEach(u => totalLevel += u.level);
    
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
    if (this.battleMode) {
        if (this.battleMode.bossDefeats >= 1) {
            this.workshopTier = 4;
        } else if (this.battleMode.wins >= 3) {
            this.workshopTier = 3;
        } else if (this.battleMode.wins >= 1) {
            this.workshopTier = 2;
        }
    }
    
    if (this.bestStreak >= 10) {
        this.workshopTier = Math.max(this.workshopTier, 1);
    }
    
    localStorage.setItem('workshopTier', this.workshopTier);
};

CoinFlipGame.prototype.saveUpgrades = function() {
    const upgradeData = {};
    Object.entries(this.upgrades).forEach(([key, data]) => {
        upgradeData[key] = data.level;
    });
    localStorage.setItem('coinUpgrades', JSON.stringify(upgradeData));
};

CoinFlipGame.prototype.loadUpgrades = function() {
    const saved = localStorage.getItem('coinUpgrades');
    if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, level]) => {
            if (this.upgrades[key]) {
                this.upgrades[key].level = level;
            }
        });
    }
    
    this.workshopUnlocked = localStorage.getItem('workshopUnlocked') === 'true';
    this.workshopTier = parseInt(localStorage.getItem('workshopTier') || '1');
};

// Apply upgrade effects to gameplay
CoinFlipGame.prototype.getUpgradeBonus = function(type) {
    const upgrade = this.upgrades[type];
    const definition = this.upgradeDefinitions[type];
    
    if (!upgrade || upgrade.level === 0) return 0;
    
    return definition.getValue(upgrade.level);
};

// Initialize upgrade system
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.game) {
            window.game.initUpgradeSystem();
        }
    }, 200);
});