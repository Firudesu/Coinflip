// Workshop System for CoinFlipGame
// Token-based permanent upgrades

CoinFlipGame.prototype.initWorkshopSystem = function() {
    this.workshopDefinitions = {
        // Tier 1 - Basic upgrades
        weightedCoin: {
            name: 'Weighted Coin',
            icon: '🎯',
            description: '+1% base win chance per upgrade',
            cost: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            maxLevel: 10,
            tier: 1,
            effect: (level) => `+${level}% win chance`
        },
        momentumEngine: {
            name: 'Momentum Engine',
            icon: '⚙️',
            description: '+0.02 base multiplier growth per win',
            cost: [2, 3, 4, 5, 6, 8, 10, 12, 14, 16],
            maxLevel: 10,
            tier: 4,
            effect: (level) => `+${(level * 0.02).toFixed(2)} multiplier growth`
        },
        
        // Tier 2 - Intermediate upgrades
        secondChance: {
            name: 'Second Chance',
            icon: '🔄',
            description: '5% chance to reflip after a loss',
            cost: [3, 6, 9],
            maxLevel: 3,
            tier: 2,
            effect: (level) => `${level * 5}% reflip chance`
        },
        goldenEdge: {
            name: 'Golden Edge',
            icon: '✨',
            description: '+1% chance to earn double coins on correct flip',
            cost: [4, 8, 12, 16, 20],
            maxLevel: 5,
            tier: 5,
            effect: (level) => `${level}% double coin chance`
        },
        
        // Tier 3 - Advanced upgrades
        twinToss: {
            name: 'Twin Toss',
            icon: '👯',
            description: '2% chance to land double result (auto-win)',
            cost: [4, 8, 12, 16, 20],
            maxLevel: 5,
            tier: 3,
            effect: (level) => `${level * 2}% twin toss chance`
        },
        safetyNet: {
            name: 'Safety Net',
            icon: '🛡️',
            description: 'Lose streak but keep half multiplier',
            cost: [5, 10],
            maxLevel: 2,
            tier: 3,
            effect: (level) => `${level} uses`
        },
        
        // Tier 4 - Expert upgrades
        reinforcedAlloy: {
            name: 'Reinforced Alloy',
            icon: '🔧',
            description: 'Reduces item durability loss chance by 15%',
            cost: [3, 6, 9, 12, 15],
            maxLevel: 5,
            tier: 4,
            effect: (level) => `${level * 15}% reduction`
        },
        
        // Tier 5 - Master upgrades
        echoFlip: {
            name: 'Echo Flip',
            icon: '🔊',
            description: '2% chance that winning flip repeats instantly',
            cost: [5, 10, 15],
            maxLevel: 3,
            tier: 5,
            effect: (level) => `${level * 2}% echo chance`
        },
        restorationCircuit: {
            name: 'Restoration Circuit',
            icon: '🔌',
            description: '10% chance to repair 1 durability after win streak',
            cost: [5, 10, 15],
            maxLevel: 3,
            tier: 5,
            effect: (level) => `${level * 10}% repair chance`
        },
        
        // Tier 6 - Legendary upgrades
        bankShield: {
            name: 'Bank Shield',
            icon: '🏦',
            description: 'When banking, 5% of coins are protected from loss',
            cost: [6, 12, 18],
            maxLevel: 3,
            tier: 6,
            effect: (level) => `${level * 5}% protected`
        },
        fortuneMemory: {
            name: 'Fortune Memory',
            icon: '🍀',
            description: '2% chance on flip to prevent item durability loss',
            cost: [5, 10, 15],
            maxLevel: 3,
            tier: 6,
            effect: (level) => `${level * 2}% prevention chance`
        },
        
        // Tier 7 - Godlike upgrade
        coinSoul: {
            name: 'Coin Soul',
            icon: '👻',
            description: 'Each 50 total wins adds +0.5% permanent win chance',
            cost: [8],
            maxLevel: 1,
            tier: 7,
            effect: (level) => 'Passive global buff'
        }
    };
    
    // Initialize upgrade levels if not loaded
    if (!this.workshopUpgrades) {
        this.workshopUpgrades = {};
    }
    
    // Setup workshop listeners
    this.setupWorkshopListeners();
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
};

CoinFlipGame.prototype.openWorkshop = function() {
    const modal = document.getElementById('workshopModal');
    modal.classList.add('show');
    
    this.updateWorkshopDisplay();
};

CoinFlipGame.prototype.updateWorkshopDisplay = function() {
    // Update tokens display
    document.getElementById('workshopTokens').textContent = this.tokens || 0;
    
    // Generate upgrades list
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    
    Object.entries(this.workshopDefinitions).forEach(([key, upgrade]) => {
        const currentLevel = this.workshopUpgrades[key] || 0;
        const maxLevel = upgrade.maxLevel;
        
        if (currentLevel >= maxLevel) {
            return; // Don't show maxed upgrades
        }
        
        const cost = upgrade.cost[currentLevel];
        const canAfford = this.tokens >= cost;
        
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'workshop-upgrade';
        if (!canAfford) {
            upgradeDiv.classList.add('disabled');
        }
        
        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-icon">${upgrade.icon}</span>
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-tier">Tier ${upgrade.tier}</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-level">Level ${currentLevel}/${maxLevel}</div>
            <div class="upgrade-effect">${upgrade.effect(currentLevel + 1)}</div>
            <div class="upgrade-cost">
                <span>Cost: ${cost} Tokens</span>
            </div>
        `;
        
        if (canAfford) {
            upgradeDiv.addEventListener('click', () => {
                this.purchaseWorkshopUpgrade(key);
            });
        }
        
        upgradesList.appendChild(upgradeDiv);
    });
    
    // Update active upgrades list
    const bonusList = document.getElementById('bonusList');
    bonusList.innerHTML = '';
    
    Object.entries(this.workshopUpgrades).forEach(([key, level]) => {
        if (level > 0) {
            const upgrade = this.workshopDefinitions[key];
            const bonusDiv = document.createElement('div');
            bonusDiv.className = 'active-upgrade';
            bonusDiv.innerHTML = `
                <span class="upgrade-icon">${upgrade.icon}</span>
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-level">Lv.${level}</span>
            `;
            bonusList.appendChild(bonusDiv);
        }
    });
    
    if (bonusList.children.length === 0) {
        bonusList.innerHTML = '<div class="no-upgrades">No active upgrades yet</div>';
    }
};

CoinFlipGame.prototype.purchaseWorkshopUpgrade = function(upgradeKey) {
    const upgrade = this.workshopDefinitions[upgradeKey];
    const currentLevel = this.workshopUpgrades[upgradeKey] || 0;
    const cost = upgrade.cost[currentLevel];
    
    if (this.tokens < cost) {
        this.showMessage('NOT ENOUGH TOKENS!');
        return;
    }
    
    if (currentLevel >= upgrade.maxLevel) {
        this.showMessage('ALREADY MAXED!');
        return;
    }
    
    // Purchase upgrade
    this.tokens -= cost;
    this.workshopUpgrades[upgradeKey] = currentLevel + 1;
    
    // Save to localStorage
    localStorage.setItem('tokens', this.tokens);
    localStorage.setItem('workshopUpgrades', JSON.stringify(this.workshopUpgrades));
    
    this.showMessage(`UPGRADED ${upgrade.name.toUpperCase()}!`);
    this.updateWorkshopDisplay();
    
    // Play purchase sound
    try {
        document.getElementById('celebrationSound').play();
    } catch(e) {}
};