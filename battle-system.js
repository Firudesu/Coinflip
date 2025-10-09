// Battle System Extension for CoinFlipGame
// This file extends the main game class with battle functionality

// Add battle properties to the game constructor
CoinFlipGame.prototype.initBattleSystem = function() {
    this.battleMode = {
        unlocked: false,
        wins: 0,
        bossDefeats: 0,
        lastBattleStreak: 0,
        currentBattle: null,
        battleInProgress: false
    };
    
    // Load battle stats
    const savedBattle = localStorage.getItem('battleStats');
    if (savedBattle) {
        const stats = JSON.parse(savedBattle);
        this.battleMode.unlocked = stats.unlocked || false;
        this.battleMode.wins = stats.wins || 0;
        this.battleMode.bossDefeats = stats.bossDefeats || 0;
    }
    
    // Define opponents
    this.opponents = this.defineOpponents();
    
    // Setup battle event listeners
    this.setupBattleListeners();
};

CoinFlipGame.prototype.defineOpponents = function() {
    return [
        {
            id: 'lucky_leo',
            name: 'Lucky Leo',
            avatar: '🎲',
            description: 'High risk, high reward',
            minStreak: 3,
            maxStreak: 15,
            strategy: 'aggressive',
            isBoss: false
        },
        {
            id: 'cautious_carla',
            name: 'Cautious Carla',
            avatar: '🛡️',
            description: 'Plays it safe',
            minStreak: 2,
            maxStreak: 8,
            strategy: 'conservative',
            isBoss: false
        },
        {
            id: 'dealer_77',
            name: 'Dealer 77',
            avatar: '🎰',
            description: 'Balanced approach',
            minStreak: 4,
            maxStreak: 10,
            strategy: 'balanced',
            isBoss: false
        },
        {
            id: 'probability_pete',
            name: 'Probability Pete',
            avatar: '📊',
            description: 'Learns your patterns',
            minStreak: 5,
            maxStreak: 12,
            strategy: 'adaptive',
            isBoss: false
        },
        {
            id: 'the_banker',
            name: 'The Banker',
            avatar: '🏦',
            description: 'BOSS: No mercy',
            minStreak: 8,
            maxStreak: 20,
            strategy: 'boss',
            isBoss: true,
            special: 'blindfold'
        },
        {
            id: 'coin_phantom',
            name: 'Coin Phantom',
            avatar: '👻',
            description: 'BOSS: Mind games',
            minStreak: 10,
            maxStreak: 25,
            strategy: 'boss',
            isBoss: true,
            special: 'flicker'
        },
        {
            id: 'lady_luck',
            name: 'Lady Luck',
            avatar: '👑',
            description: 'BOSS: 60% win rate',
            minStreak: 15,
            maxStreak: 30,
            strategy: 'boss',
            isBoss: true,
            special: 'enhanced',
            winRate: 0.6
        }
    ];
};

CoinFlipGame.prototype.setupBattleListeners = function() {
    // Battle button
    document.getElementById('floatingBattleBtn').addEventListener('click', () => {
        this.openBattleMode();
        document.getElementById('floatingBattleBtn').style.display = 'none';
    });
    
    // Skip battle
    document.getElementById('skipBattleBtn').addEventListener('click', () => {
        document.getElementById('battleModal').classList.remove('show');
    });
    
    // Wager slider
    const wagerSlider = document.getElementById('wagerSlider');
    const wagerAmount = document.getElementById('wagerAmount');
    const potAmount = document.getElementById('potAmount');
    
    wagerSlider.addEventListener('input', (e) => {
        const wager = parseInt(e.target.value);
        wagerAmount.textContent = wager;
        potAmount.textContent = wager * 2;
    });
    
    // Set max wager based on bank
    wagerSlider.max = Math.min(this.bank, 500);
    
    // Start battle button
    document.getElementById('startBattleBtn').addEventListener('click', () => {
        this.startBattle();
    });
    
    // Battle choice buttons
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (this.battleMode.battleInProgress) {
                this.makeBattleChoice(e.target.dataset.choice);
            }
        });
    });
    
    // Close battle result
    document.getElementById('closeBattleBtn').addEventListener('click', () => {
        document.getElementById('battleModal').classList.remove('show');
        this.battleMode.currentBattle = null;
    });
};

CoinFlipGame.prototype.checkBattleAvailability = function() {
    // Check if battle mode should unlock permanently at streak 10
    if (this.streak >= 10 && !this.battleMode.unlocked) {
        this.battleMode.unlocked = true;
        this.saveBattleStats();
        this.showMessage('BATTLE MODE UNLOCKED! FIGHT OPPONENTS!');
    }
    
    // Check if battle is available every 5 streaks after unlock
    if (this.battleMode.unlocked && this.streak >= 5 && this.streak % 5 === 0) {
        if (this.streak !== this.battleMode.lastBattleStreak) {
            this.showBattleAvailable();
            this.battleMode.lastBattleStreak = this.streak;
        }
    }
};

CoinFlipGame.prototype.showBattleAvailable = function() {
    const btn = document.getElementById('floatingBattleBtn');
    btn.style.display = 'block';
    
    this.showMessage('BATTLE AVAILABLE! CHALLENGE AN OPPONENT!');
    
    // Make coin glow red
    this.canvas.style.filter = 'drop-shadow(0 0 40px #ff0000)';
    
    setTimeout(() => {
        this.canvas.style.filter = '';
    }, 2000);
};

CoinFlipGame.prototype.openBattleMode = function() {
    const modal = document.getElementById('battleModal');
    modal.classList.add('show');
    
    // Update battle stats display
    document.getElementById('battleWins').textContent = this.battleMode.wins;
    document.getElementById('bossDefeats').textContent = this.battleMode.bossDefeats;
    
    // Select opponent
    this.selectOpponent();
    
    // Update player info
    document.getElementById('playerBattleName').textContent = 'PLAYER';
    document.getElementById('playerBattleTitle').textContent = this.playerTitle;
    
    // Reset battle UI
    document.getElementById('wagerSection').style.display = 'block';
    document.getElementById('battlePhase').style.display = 'none';
    document.getElementById('battleResult').style.display = 'none';
};

CoinFlipGame.prototype.selectOpponent = function() {
    let opponent;
    
    // Check if boss battle (every 5 wins)
    if (this.battleMode.wins > 0 && this.battleMode.wins % 5 === 0) {
        // Select a boss
        const bosses = this.opponents.filter(o => o.isBoss);
        opponent = bosses[Math.floor(Math.random() * bosses.length)];
        
        // Add boss battle class
        document.getElementById('battleModal').classList.add('boss-battle');
    } else {
        // Select regular opponent
        const regulars = this.opponents.filter(o => !o.isBoss);
        opponent = regulars[Math.floor(Math.random() * regulars.length)];
        
        document.getElementById('battleModal').classList.remove('boss-battle');
    }
    
    this.battleMode.currentOpponent = opponent;
    
    // Update UI
    document.getElementById('opponentAvatar').textContent = opponent.avatar;
    document.getElementById('opponentName').textContent = opponent.name;
    document.getElementById('opponentDesc').textContent = opponent.description;
};

CoinFlipGame.prototype.startBattle = function() {
    const wager = parseInt(document.getElementById('wagerSlider').value);
    
    if (wager > this.bank) {
        this.showMessage('NOT ENOUGH COINS!');
        return;
    }
    
    // Deduct wager
    this.bank -= wager;
    this.updateDisplay();
    
    // Setup battle
    this.battleMode.currentBattle = {
        wager: wager,
        pot: wager * 2,
        playerStreak: 0,
        opponentStreak: 0,
        playerTurn: true
    };
    
    // Switch UI
    document.getElementById('wagerSection').style.display = 'none';
    document.getElementById('battlePhase').style.display = 'block';
    
    // Start player turn
    this.battleMode.battleInProgress = true;
    this.updateBattleDisplay();
    document.getElementById('battleMessage').textContent = 'YOUR TURN - FLIP UNTIL YOU LOSE!';
};

CoinFlipGame.prototype.makeBattleChoice = function(choice) {
    if (!this.battleMode.currentBattle.playerTurn) return;
    
    // Simulate flip
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    
    if (won) {
        this.battleMode.currentBattle.playerStreak++;
        this.updateBattleDisplay();
        document.getElementById('battleMessage').textContent = `CORRECT! STREAK: ${this.battleMode.currentBattle.playerStreak}`;
    } else {
        // Player turn ends
        document.getElementById('battleMessage').textContent = `WRONG! YOUR STREAK: ${this.battleMode.currentBattle.playerStreak}`;
        this.battleMode.currentBattle.playerTurn = false;
        
        // Start opponent turn after delay
        setTimeout(() => {
            this.startOpponentTurn();
        }, 2000);
    }
};

CoinFlipGame.prototype.startOpponentTurn = function() {
    const opponent = this.battleMode.currentOpponent;
    const battle = this.battleMode.currentBattle;
    
    document.getElementById('battleMessage').textContent = `${opponent.name.toUpperCase()} IS FLIPPING...`;
    
    // Disable player controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = true;
    });
    
    // Simulate opponent flips
    let opponentFlips = 0;
    const targetStreak = battle.playerStreak + 1; // Try to beat player
    
    const flipInterval = setInterval(() => {
        // Calculate win chance based on opponent strategy
        let winChance = 0.5;
        
        if (opponent.winRate) {
            winChance = opponent.winRate;
        } else if (opponent.strategy === 'aggressive') {
            winChance = 0.45; // More risky
        } else if (opponent.strategy === 'conservative') {
            winChance = 0.52; // Slightly safer
        }
        
        const won = Math.random() < winChance;
        
        if (won && opponentFlips < targetStreak) {
            opponentFlips++;
            battle.opponentStreak = opponentFlips;
            this.updateBattleDisplay();
            document.getElementById('battleMessage').textContent = `OPPONENT STREAK: ${opponentFlips}`;
        } else {
            clearInterval(flipInterval);
            
            // Determine winner
            if (battle.opponentStreak > battle.playerStreak) {
                this.endBattle(false);
            } else {
                this.endBattle(true);
            }
        }
    }, 1000);
};

CoinFlipGame.prototype.endBattle = function(playerWon) {
    const battle = this.battleMode.currentBattle;
    
    // Hide battle phase
    document.getElementById('battlePhase').style.display = 'none';
    document.getElementById('battleResult').style.display = 'block';
    
    const resultTitle = document.getElementById('battleResultTitle');
    const rewards = document.getElementById('battleRewards');
    
    if (playerWon) {
        // Victory
        resultTitle.textContent = 'VICTORY!';
        resultTitle.className = 'result-title victory';
        
        // Award pot
        this.bank += battle.pot;
        this.battleMode.wins++;
        
        // Bonus multiplier
        this.multiplier += 0.5;
        
        rewards.innerHTML = `
            <div>WON: ${battle.pot} COINS!</div>
            <div>MULTIPLIER +0.5!</div>
            <div>BATTLE WINS: ${this.battleMode.wins}</div>
        `;
        
        // Check for boss defeat
        if (this.battleMode.currentOpponent.isBoss) {
            this.battleMode.bossDefeats++;
            rewards.innerHTML += `<div>BOSS DEFEATED! 🏆</div>`;
        }
        
        this.saveBattleStats();
        this.updateDisplay();
        
        // Victory effects
        this.launchFireworks();
    } else {
        // Defeat
        resultTitle.textContent = 'DEFEAT!';
        resultTitle.className = 'result-title defeat';
        
        rewards.innerHTML = `
            <div>LOST: ${battle.wager} COINS!</div>
            <div>STREAK RESET TO 0!</div>
        `;
        
        // Reset main streak
        this.streak = 0;
        this.score = 0;
        this.multiplier = 1.0;
        this.updateDisplay();
        
        // Screen crack effect
        document.getElementById('gameContainer').classList.add('epic-fail-shake');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('epic-fail-shake');
        }, 1000);
    }
    
    // Re-enable controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = false;
    });
    
    this.battleMode.battleInProgress = false;
};

CoinFlipGame.prototype.updateBattleDisplay = function() {
    document.getElementById('playerBattleStreak').textContent = this.battleMode.currentBattle.playerStreak;
    document.getElementById('opponentBattleStreak').textContent = this.battleMode.currentBattle.opponentStreak;
};

CoinFlipGame.prototype.saveBattleStats = function() {
    localStorage.setItem('battleStats', JSON.stringify({
        unlocked: this.battleMode.unlocked,
        wins: this.battleMode.wins,
        bossDefeats: this.battleMode.bossDefeats
    }));
};

// Initialize battle system when game loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for main game to initialize, then add battle system
    setTimeout(() => {
        if (window.game) {
            window.game.initBattleSystem();
        }
    }, 100);
});