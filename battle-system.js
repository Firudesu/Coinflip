// Coin Battle System - Streak-based duels with skills and opponents
// This file implements the new coin battle system

// Initialize the new battle system
CoinFlipGame.prototype.initBattleSystem = function() {
    this.battleMode = {
        wins: 0,
        bossDefeats: 0,
        currentBattle: null,
        battleInProgress: false,
        selectedSkills: [],
        availableSkills: [],
        lastCheckedWins: 0
    };
    
    // Load battle stats
    const savedBattle = localStorage.getItem('battleStats');
    if (savedBattle) {
        const stats = JSON.parse(savedBattle);
        this.battleMode.wins = stats.wins || 0;
        this.battleMode.bossDefeats = stats.bossDefeats || 0;
        this.battleMode.lastCheckedWins = stats.lastCheckedWins || 0;
    }
    
    // Define skills, opponents, and bosses
    this.skills = this.defineSkills();
    this.opponents = this.defineOpponents();
    this.bosses = this.defineBosses();
    
    // Setup battle event listeners
    this.setupBattleListeners();
};

// Define the 15 skills system
CoinFlipGame.prototype.defineSkills = function() {
    return [
        {
            id: 'lucky_toss',
            name: 'Lucky Toss',
            description: '+5% chance to win each flip. Stacks per successful streak.',
            effect: 'winChanceBonus',
            value: 0.05,
            stacks: true
        },
        {
            id: 'momentum',
            name: 'Momentum',
            description: 'Each consecutive win adds +1% win chance next round. Resets when you lose.',
            effect: 'momentum',
            value: 0.01
        },
        {
            id: 'reflip',
            name: 'Reflip',
            description: 'When you lose, 30% chance to reflip once. If successful, continue streak.',
            effect: 'reflip',
            value: 0.30
        },
        {
            id: 'reverse_fate',
            name: 'Reverse Fate',
            description: 'Once per round, if your choice was wrong, it counts as correct.',
            effect: 'reverseFate',
            value: 1,
            usesPerRound: 1
        },
        {
            id: 'pressure_drop',
            name: 'Pressure Drop',
            description: 'Opponent loses 1 streak if they reach streak 4 or higher.',
            effect: 'pressureDrop',
            value: 4
        },
        {
            id: 'sabotage',
            name: 'Sabotage',
            description: '20% chance per round to reduce opponent\'s win chance by 10%.',
            effect: 'sabotage',
            value: 0.20,
            reduction: 0.10
        },
        {
            id: 'echo_flip',
            name: 'Echo Flip',
            description: 'If you win 3 flips in a row, your next flip counts double.',
            effect: 'echoFlip',
            value: 3
        },
        {
            id: 'coin_magnet',
            name: 'Coin Magnet',
            description: 'You always go first this battle.',
            effect: 'goFirst',
            value: true
        },
        {
            id: 'comeback_chance',
            name: 'Comeback Chance',
            description: 'When losing, +10% win chance until next victory.',
            effect: 'comebackChance',
            value: 0.10
        },
        {
            id: 'tilt',
            name: 'Tilt',
            description: 'If opponent wins 2 flips in a row, their next flip has -15% win chance.',
            effect: 'tilt',
            value: 0.15
        },
        {
            id: 'flip_fever',
            name: 'Flip Fever',
            description: 'If you win 5 in a row, instantly gain +2 bonus streak.',
            effect: 'flipFever',
            value: 5,
            bonus: 2
        },
        {
            id: 'coin_control',
            name: 'Coin Control',
            description: '10% chance per flip to auto-correct the outcome to your favour.',
            effect: 'coinControl',
            value: 0.10
        },
        {
            id: 'mirrored_loss',
            name: 'Mirrored Loss',
            description: 'When you lose, opponent also loses 1 from their streak.',
            effect: 'mirroredLoss',
            value: 1
        },
        {
            id: 'drain_focus',
            name: 'Drain Focus',
            description: 'Opponent\'s skill effects are 50% less effective this round.',
            effect: 'drainFocus',
            value: 0.50
        },
        {
            id: 'perfect_call',
            name: 'Perfect Call',
            description: 'If you get 3 heads/tails in a row, next flip is an automatic win.',
            effect: 'perfectCall',
            value: 3
        }
    ];
};

// Define the new opponent pool
CoinFlipGame.prototype.defineOpponents = function() {
    return [
        {
            id: 'rookie',
            name: 'Rookie',
            avatar: '🆕',
            description: 'Overconfident beginner',
            baseWinChance: 0.45,
            behavior: 'random'
        },
        {
            id: 'gambler_joe',
            name: 'Gambler Joe',
            avatar: '🎲',
            description: 'Reckless but lucky',
            baseWinChance: 0.55,
            behavior: 'streak_boost'
        },
        {
            id: 'analyst',
            name: 'Analyst',
            avatar: '📊',
            description: 'Predictive thinker',
            baseWinChance: 0.60,
            behavior: 'adaptive'
        },
        {
            id: 'hotshot',
            name: 'Hotshot',
            avatar: '🔥',
            description: 'Talks big, wins big',
            baseWinChance: 0.65,
            behavior: 'early_strong'
        },
        {
            id: 'magpie',
            name: 'Magpie',
            avatar: '🪶',
            description: 'Mimics your previous choice',
            baseWinChance: 0.50,
            behavior: 'mimic'
        },
        {
            id: 'dealer',
            name: 'Dealer',
            avatar: '🎰',
            description: 'Calm and steady',
            baseWinChance: 0.70,
            behavior: 'consistent'
        },
        {
            id: 'jester',
            name: 'Jester',
            avatar: '🃏',
            description: 'Plays with luck',
            baseWinChance: 0.50,
            behavior: 'chaos'
        },
        {
            id: 'veteran',
            name: 'Veteran',
            avatar: '🎖️',
            description: 'Experienced opponent',
            baseWinChance: 0.75,
            behavior: 'experienced'
        },
        {
            id: 'phantom',
            name: 'Phantom',
            avatar: '👻',
            description: 'Cold and calculated',
            baseWinChance: 0.80,
            behavior: 'ignore_unlucky'
        },
        {
            id: 'coinmaster',
            name: 'Coinmaster',
            avatar: '🪙',
            description: 'The final normal enemy',
            baseWinChance: 0.85,
            behavior: 'has_echo_flip'
        }
    ];
};

// Define the boss pool with special mechanics
CoinFlipGame.prototype.defineBosses = function() {
    return [
        {
            id: 'the_collector',
            name: 'The Collector',
            avatar: '🗃️',
            description: 'Steals one of your skills at random',
            baseWinChance: 0.70,
            special: 'steal_skill',
            specialRule: 'Steals one of your skills at random meaning you lose it for that battle'
        },
        {
            id: 'the_doubler',
            name: 'The Doubler',
            avatar: '✖️',
            description: 'Every flip counts double toward streaks',
            baseWinChance: 0.65,
            special: 'double_streaks',
            specialRule: 'Every flip counts double toward streaks (e.g. 1 → 2).'
        },
        {
            id: 'the_shadow_toss',
            name: 'The Shadow Toss',
            avatar: '🌑',
            description: 'Copies your win chance and skills but flips after you',
            baseWinChance: 0.50, // Will be set to player's win chance
            special: 'mirror_match',
            specialRule: 'Copies your win chance and skills but flips after you. A mirror match that tests pure RNG and skill synergy.'
        },
        {
            id: 'the_void_dealer',
            name: 'The Void Dealer',
            avatar: '🕳️',
            description: 'Each lost flip permanently reduces your base win rate',
            baseWinChance: 0.60,
            special: 'void_drain',
            specialRule: 'Each lost flip permanently reduces your base win rate for the rest of the match.'
        },
        {
            id: 'the_coin_king',
            name: 'The Coin King',
            avatar: '👑',
            description: 'Must win twice in a row streak twice in a row',
            baseWinChance: 0.75,
            special: 'double_requirement',
            specialRule: 'Must win twice in a row streak twice in a row after you win you play again if you lose you lose you must win twice in a row. Longest, hardest endurance test.'
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
        this.cleanupBattleModal();
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
        this.cleanupBattleModal();
    });
    
    // Test battle button (temporary)
    const testBtn = document.getElementById('testBattleBtn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            this.openBattleMode();
        });
    }
    
    // Static start battle button
    const finalStartBtn = document.getElementById('finalStartBattleBtn');
    if (finalStartBtn) {
        finalStartBtn.addEventListener('click', () => {
            this.startCoinBattle();
        });
    }
};

// Check if battle should be available (every 5 wins)
CoinFlipGame.prototype.checkForBattle = function() {
    // Don't trigger during battles
    if (!this.battleMode || this.battleMode.battleInProgress) {
        return false;
    }
    
    // Trigger battle every 5 wins
    if (this.battleMode.wins > 0 && this.battleMode.wins % 5 === 0) {
        // Boss battle every 5 wins
        this.showBattleAvailable(true);
        return true;
    }
    
    return false;
};

// New method to trigger battles based on wins
CoinFlipGame.prototype.checkBattleTrigger = function() {
    // Check if we should trigger a battle based on wins
    // This should be called when the player banks or completes a streak
    const totalWins = Math.floor(this.bank / 100); // Approximate wins based on banked coins
    
    if (totalWins > this.battleMode.lastCheckedWins && totalWins % 5 === 0) {
        this.battleMode.lastCheckedWins = totalWins;
        this.showBattleAvailable(totalWins % 25 === 0); // Boss every 25 wins
        return true;
    }
    
    return false;
};

CoinFlipGame.prototype.showBattleAvailable = function(isBoss = false) {
    const btn = document.getElementById('floatingBattleBtn');
    btn.style.display = 'block';
    
    if (isBoss) {
        this.showMessage('BOSS BATTLE AVAILABLE! FACE A LEGENDARY OPPONENT!');
        btn.querySelector('.battle-text').textContent = 'BOSS BATTLE!';
        // Make coin glow purple for boss
        this.canvas.style.filter = 'drop-shadow(0 0 40px #8B00FF)';
    } else {
        this.showMessage('COIN BATTLE AVAILABLE! CHALLENGE AN OPPONENT!');
        btn.querySelector('.battle-text').textContent = 'BATTLE READY!';
        // Make coin glow red for normal battle
        this.canvas.style.filter = 'drop-shadow(0 0 40px #ff0000)';
    }
    
    setTimeout(() => {
        this.canvas.style.filter = '';
    }, 2000);
};

CoinFlipGame.prototype.openBattleMode = function() {
    const modal = document.getElementById('battleModal');
    
    // Clean up any previous battle state first
    this.cleanupBattleModal();
    
    modal.classList.add('show');
    
    // Update battle stats display
    document.getElementById('battleWins').textContent = this.battleMode.wins;
    document.getElementById('bossDefeats').textContent = this.battleMode.bossDefeats;
    
    // Start with skill selection phase
    this.startSkillSelection();
    
    // Update player info
    document.getElementById('playerBattleName').textContent = 'PLAYER';
    document.getElementById('playerBattleTitle').textContent = this.playerTitle || 'NOVICE';
};

// New skill selection system
CoinFlipGame.prototype.startSkillSelection = function() {
    // Randomly offer 6 skills for player to choose 3
    const availableSkills = [...this.skills];
    this.battleMode.availableSkills = [];
    
    for (let i = 0; i < 6 && availableSkills.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableSkills.length);
        this.battleMode.availableSkills.push(availableSkills.splice(randomIndex, 1)[0]);
    }
    
    this.battleMode.selectedSkills = [];
    this.displaySkillSelection();
};

CoinFlipGame.prototype.displaySkillSelection = function() {
    const skillsContainer = document.getElementById('skillSelectionContainer');
    skillsContainer.innerHTML = ''; // This clears any existing content
    
    // Create skill selection UI
    const title = document.createElement('h3');
    title.textContent = 'SELECT 3 SKILLS FOR BATTLE';
    title.className = 'skill-selection-title';
    skillsContainer.appendChild(title);
    
    const skillsGrid = document.createElement('div');
    skillsGrid.className = 'skills-grid';
    
    this.battleMode.availableSkills.forEach((skill, index) => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-option';
        skillDiv.innerHTML = `
            <div class="skill-name">${skill.name}</div>
            <div class="skill-description">${skill.description}</div>
        `;
        
        skillDiv.addEventListener('click', () => {
            this.selectSkill(skill, skillDiv);
        });
        
        skillsGrid.appendChild(skillDiv);
    });
    
    skillsContainer.appendChild(skillsGrid);
    
    // Add selected skills display
    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'selected-skills';
    selectedDiv.innerHTML = '<h4>SELECTED SKILLS (0/3)</h4><div id="selectedSkillsList"></div>';
    skillsContainer.appendChild(selectedDiv);
    
    // Add continue button (disabled initially)
    const continueBtn = document.createElement('button');
    continueBtn.className = 'pixel-btn continue-btn';
    continueBtn.textContent = 'CONTINUE TO BATTLE';
    continueBtn.disabled = true;
    continueBtn.id = 'continueToOpponentBtn';
    continueBtn.addEventListener('click', () => {
        this.proceedToOpponentSelection();
    });
    skillsContainer.appendChild(continueBtn);
};

CoinFlipGame.prototype.selectSkill = function(skill, skillElement) {
    if (this.battleMode.selectedSkills.length >= 3) {
        this.showMessage('MAXIMUM 3 SKILLS SELECTED!');
        return;
    }
    
    if (this.battleMode.selectedSkills.includes(skill)) {
        this.showMessage('SKILL ALREADY SELECTED!');
        return;
    }
    
    this.battleMode.selectedSkills.push(skill);
    skillElement.classList.add('selected');
    
    this.updateSelectedSkillsDisplay();
    
    if (this.battleMode.selectedSkills.length === 3) {
        document.getElementById('continueToOpponentBtn').disabled = false;
    }
};

CoinFlipGame.prototype.updateSelectedSkillsDisplay = function() {
    const selectedList = document.getElementById('selectedSkillsList');
    const selectedTitle = document.querySelector('.selected-skills h4');
    
    selectedTitle.textContent = `SELECTED SKILLS (${this.battleMode.selectedSkills.length}/3)`;
    
    selectedList.innerHTML = this.battleMode.selectedSkills.map(skill => `
        <div class="selected-skill">
            <span class="skill-name">${skill.name}</span>
        </div>
    `).join('');
};

CoinFlipGame.prototype.proceedToOpponentSelection = function() {
    // Hide skill selection and show opponent selection
    document.getElementById('skillSelectionSection').style.display = 'none';
    document.getElementById('opponentSection').style.display = 'block';
    
    // Select opponent with animation
    this.selectOpponentWithAnimation();
};

CoinFlipGame.prototype.selectOpponentWithAnimation = function() {
    const opponentAvatar = document.getElementById('opponentAvatar');
    const opponentName = document.getElementById('opponentName');
    const opponentDesc = document.getElementById('opponentDesc');
    
    // Determine if this is a boss battle (every 5 wins)
    const isBoss = this.battleMode.wins > 0 && this.battleMode.wins % 5 === 0;
    const pool = isBoss ? this.bosses : this.opponents;
    
    // Show rolling animation
    let rollCount = 0;
    const maxRolls = 20;
    const rollInterval = setInterval(() => {
        const randomOpponent = pool[Math.floor(Math.random() * pool.length)];
        opponentAvatar.textContent = randomOpponent.avatar;
        opponentName.textContent = randomOpponent.name;
        opponentDesc.textContent = 'SELECTING OPPONENT...';
        
        rollCount++;
        if (rollCount >= maxRolls) {
            clearInterval(rollInterval);
            this.finalizeOpponentSelection(isBoss);
        }
    }, 100);
};

CoinFlipGame.prototype.finalizeOpponentSelection = function(isBoss) {
    const pool = isBoss ? this.bosses : this.opponents;
    const selectedOpponent = pool[Math.floor(Math.random() * pool.length)];
    
    this.battleMode.currentOpponent = selectedOpponent;
    this.battleMode.isBossBattle = isBoss;
    
    // Update UI with final selection
    document.getElementById('opponentAvatar').textContent = selectedOpponent.avatar;
    document.getElementById('opponentName').textContent = selectedOpponent.name;
    document.getElementById('opponentDesc').textContent = selectedOpponent.description;
    
    // Clean up any existing dynamic elements first
    this.cleanupOpponentSection();
    
    // Add boss battle styling if needed
    if (isBoss) {
        document.getElementById('battleModal').classList.add('boss-battle');
        // Show special rule
        const specialRule = document.createElement('div');
        specialRule.className = 'boss-special-rule';
        specialRule.textContent = `SPECIAL RULE: ${selectedOpponent.specialRule}`;
        document.getElementById('opponentSection').appendChild(specialRule);
    } else {
        document.getElementById('battleModal').classList.remove('boss-battle');
    }
    
    // Show start battle button (use existing static button)
    setTimeout(() => {
        const startBtn = document.getElementById('finalStartBattleBtn');
        if (startBtn) {
            startBtn.style.display = 'block';
        }
    }, 1000);
};

// Helper function to clean up dynamically created elements in opponent section
CoinFlipGame.prototype.cleanupOpponentSection = function() {
    const opponentSection = document.getElementById('opponentSection');
    
    // Hide the start battle button
    const startBtn = document.getElementById('finalStartBattleBtn');
    if (startBtn) {
        startBtn.style.display = 'none';
    }
    
    // Remove any existing boss special rules
    const existingRules = opponentSection.querySelectorAll('.boss-special-rule');
    existingRules.forEach(rule => rule.remove());
};

// Helper function to clean up the entire battle modal
CoinFlipGame.prototype.cleanupBattleModal = function() {
    // Clean up opponent section
    this.cleanupOpponentSection();
    
    // Clean up skill selection container
    const skillsContainer = document.getElementById('skillSelectionContainer');
    if (skillsContainer) {
        skillsContainer.innerHTML = '';
    }
    
    // Reset battle mode state
    this.battleMode.selectedSkills = [];
    this.battleMode.availableSkills = [];
    this.battleMode.currentBattle = null;
    this.battleMode.battleInProgress = false;
    
    // Reset UI sections visibility
    document.getElementById('skillSelectionSection').style.display = 'block';
    document.getElementById('opponentSection').style.display = 'none';
    document.getElementById('battlePhase').style.display = 'none';
    document.getElementById('battleResult').style.display = 'none';
    
    // Remove boss battle styling
    document.getElementById('battleModal').classList.remove('boss-battle');
};

CoinFlipGame.prototype.startCoinBattle = function() {
    // Setup battle state
    this.battleMode.currentBattle = {
        playerStreak: 0,
        opponentStreak: 0,
        playerTurn: true,
        playerWinChance: 0.5,
        opponentWinChance: this.battleMode.currentOpponent.baseWinChance,
        playerConsecutiveWins: 0,
        opponentConsecutiveWins: 0,
        playerHadTurn: false,
        opponentHadTurn: false,
        skillEffects: {
            momentum: 0,
            reverseFateUsed: false,
            echoFlipReady: false,
            comebackActive: false,
            tiltActive: false,
            perfectCallSequence: [],
            voidDrainReduction: 0
        }
    };
    
    // Apply boss special effects
    if (this.battleMode.isBossBattle) {
        this.applyBossSpecialEffects();
    }
    
    // Apply skill effects
    this.applySkillEffects();
    
    // Determine who goes first
    this.determineFirstPlayer();
    
    // Switch UI
    document.getElementById('opponentSection').style.display = 'none';
    document.getElementById('battlePhase').style.display = 'block';
    
    // Start battle
    this.battleMode.battleInProgress = true;
    this.updateBattleDisplay();
    
    if (this.battleMode.currentBattle.playerTurn) {
        document.getElementById('battleMessage').textContent = 'YOUR TURN - FLIP UNTIL YOU LOSE!';
    } else {
        document.getElementById('battleMessage').textContent = 'OPPONENT GOES FIRST!';
        setTimeout(() => this.startOpponentTurn(), 1000);
    }
};

CoinFlipGame.prototype.applyBossSpecialEffects = function() {
    const boss = this.battleMode.currentOpponent;
    const battle = this.battleMode.currentBattle;
    
    switch (boss.special) {
        case 'steal_skill':
            // Remove one random skill
            if (this.battleMode.selectedSkills.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.battleMode.selectedSkills.length);
                const stolenSkill = this.battleMode.selectedSkills.splice(randomIndex, 1)[0];
                this.showMessage(`THE COLLECTOR STOLE YOUR ${stolenSkill.name.toUpperCase()}!`);
            }
            break;
        case 'mirror_match':
            // Copy player's win chance and skills
            battle.opponentWinChance = battle.playerWinChance;
            this.showMessage('THE SHADOW TOSS MIRRORS YOUR ABILITIES!');
            break;
        case 'void_drain':
            battle.skillEffects.voidDrainReduction = 0;
            this.showMessage('THE VOID DEALER WILL DRAIN YOUR POWER WITH EACH LOSS!');
            break;
    }
};

CoinFlipGame.prototype.applySkillEffects = function() {
    const battle = this.battleMode.currentBattle;
    
    this.battleMode.selectedSkills.forEach(skill => {
        switch (skill.id) {
            case 'lucky_toss':
                battle.playerWinChance += skill.value;
                break;
            case 'coin_magnet':
                battle.playerTurn = true; // Force player to go first
                break;
            case 'drain_focus':
                // Reduce opponent skill effectiveness by 50%
                battle.opponentWinChance *= (1 - skill.value * 0.5);
                break;
        }
    });
};

CoinFlipGame.prototype.determineFirstPlayer = function() {
    // Check for Coin Magnet skill
    const hasCoinMagnet = this.battleMode.selectedSkills.some(skill => skill.id === 'coin_magnet');
    
    if (hasCoinMagnet) {
        this.battleMode.currentBattle.playerTurn = true;
        this.showMessage('COIN MAGNET ACTIVATED - YOU GO FIRST!');
    } else {
        // Random selection
        this.battleMode.currentBattle.playerTurn = Math.random() < 0.5;
    }
};

CoinFlipGame.prototype.makeBattleChoice = function(choice) {
    if (!this.battleMode.currentBattle.playerTurn) return;
    
    const battle = this.battleMode.currentBattle;
    let winChance = battle.playerWinChance;
    
    // Apply skill effects that modify win chance
    winChance += this.getSkillWinChanceBonus();
    
    // Apply boss effects
    if (this.battleMode.isBossBattle && this.battleMode.currentOpponent.special === 'void_drain') {
        winChance -= battle.skillEffects.voidDrainReduction;
    }
    
    // Simulate flip with modified win chance
    const result = Math.random() < winChance ? choice : (choice === 'heads' ? 'tails' : 'heads');
    let won = result === choice;
    
    // Apply skill effects that can change the outcome
    won = this.applySkillOutcomeEffects(won, choice, result);
    
    if (won) {
        // Player wins this flip
        battle.playerStreak++;
        battle.playerConsecutiveWins++;
        battle.opponentConsecutiveWins = 0;
        
        // Apply streak-based skill effects
        this.applyStreakSkillEffects();
        
        // Apply boss effects for double streaks
        if (this.battleMode.isBossBattle && this.battleMode.currentOpponent.special === 'double_streaks') {
            battle.playerStreak++; // Double the streak gain
        }
        
        this.updateBattleDisplay();
        document.getElementById('battleMessage').textContent = `CORRECT! STREAK: ${battle.playerStreak}`;
        
        // Update skill effects for next flip
        this.updateSkillEffectsAfterWin();
        
    } else {
        // Player loses - apply loss effects first
        this.applyLossSkillEffects();
        
        // Check for reflip skill
        if (this.canReflip()) {
            this.showMessage('REFLIP ACTIVATED! SECOND CHANCE!');
            return; // Don't end turn, allow another flip
        }
        
        // Apply void drain if boss
        if (this.battleMode.isBossBattle && this.battleMode.currentOpponent.special === 'void_drain') {
            battle.skillEffects.voidDrainReduction += 0.05; // Reduce win chance by 5%
        }
        
        // Player turn ends
        document.getElementById('battleMessage').textContent = `WRONG! YOUR FINAL STREAK: ${battle.playerStreak}`;
        battle.playerTurn = false;
        battle.playerConsecutiveWins = 0;
        battle.playerHadTurn = true;
        
        // Check if opponent already had their turn
        if (battle.opponentHadTurn) {
            // Both players have had their turn, determine winner
            setTimeout(() => {
                this.determineBattleWinner();
            }, 2000);
        } else {
            // Start opponent turn
            setTimeout(() => {
                this.startOpponentTurn();
            }, 2000);
        }
    }
};

CoinFlipGame.prototype.getSkillWinChanceBonus = function() {
    let bonus = 0;
    const battle = this.battleMode.currentBattle;
    
    this.battleMode.selectedSkills.forEach(skill => {
        switch (skill.id) {
            case 'lucky_toss':
                // Stacks per successful streak
                bonus += skill.value * battle.playerStreak;
                break;
            case 'momentum':
                bonus += battle.skillEffects.momentum;
                break;
            case 'comeback_chance':
                if (battle.skillEffects.comebackActive) {
                    bonus += skill.value;
                }
                break;
        }
    });
    
    return bonus;
};

CoinFlipGame.prototype.applySkillOutcomeEffects = function(won, choice, result) {
    const battle = this.battleMode.currentBattle;
    
    // Coin Control - 10% chance to auto-correct
    if (this.hasSkill('coin_control') && !won && Math.random() < 0.10) {
        this.showMessage('COIN CONTROL ACTIVATED!');
        return true;
    }
    
    // Reverse Fate - once per round
    if (this.hasSkill('reverse_fate') && !won && !battle.skillEffects.reverseFateUsed) {
        battle.skillEffects.reverseFateUsed = true;
        this.showMessage('REVERSE FATE ACTIVATED!');
        return true;
    }
    
    // Perfect Call - automatic win after 3 same choices
    if (this.hasSkill('perfect_call')) {
        battle.skillEffects.perfectCallSequence.push(choice);
        if (battle.skillEffects.perfectCallSequence.length > 3) {
            battle.skillEffects.perfectCallSequence.shift();
        }
        
        if (battle.skillEffects.perfectCallSequence.length === 3 && 
            battle.skillEffects.perfectCallSequence.every(c => c === choice)) {
            this.showMessage('PERFECT CALL ACTIVATED!');
            return true;
        }
    }
    
    return won;
};

CoinFlipGame.prototype.applyStreakSkillEffects = function() {
    const battle = this.battleMode.currentBattle;
    
    // Echo Flip - counts double after 3 wins
    if (this.hasSkill('echo_flip') && battle.playerConsecutiveWins === 3) {
        battle.playerStreak++; // Extra streak point
        this.showMessage('ECHO FLIP ACTIVATED! DOUBLE STREAK!');
    }
    
    // Flip Fever - bonus streak at 5 wins
    if (this.hasSkill('flip_fever') && battle.playerConsecutiveWins === 5) {
        battle.playerStreak += 2; // +2 bonus streak
        this.showMessage('FLIP FEVER ACTIVATED! +2 BONUS STREAK!');
    }
};

CoinFlipGame.prototype.updateSkillEffectsAfterWin = function() {
    const battle = this.battleMode.currentBattle;
    
    // Momentum - increase win chance
    if (this.hasSkill('momentum')) {
        battle.skillEffects.momentum += 0.01;
    }
    
    // Comeback Chance - deactivate after win
    battle.skillEffects.comebackActive = false;
};

CoinFlipGame.prototype.applyLossSkillEffects = function() {
    const battle = this.battleMode.currentBattle;
    
    // Mirrored Loss - opponent loses 1 streak
    if (this.hasSkill('mirrored_loss') && battle.opponentStreak > 0) {
        battle.opponentStreak--;
        this.showMessage('MIRRORED LOSS ACTIVATED!');
    }
    
    // Comeback Chance - activate for next attempts
    if (this.hasSkill('comeback_chance')) {
        battle.skillEffects.comebackActive = true;
    }
    
    // Reset momentum
    battle.skillEffects.momentum = 0;
};

CoinFlipGame.prototype.canReflip = function() {
    if (this.hasSkill('reflip') && Math.random() < 0.30) {
        return true;
    }
    return false;
};

CoinFlipGame.prototype.hasSkill = function(skillId) {
    return this.battleMode.selectedSkills.some(skill => skill.id === skillId);
};

CoinFlipGame.prototype.startOpponentTurn = function() {
    const opponent = this.battleMode.currentOpponent;
    const battle = this.battleMode.currentBattle;
    
    document.getElementById('battleMessage').textContent = `${opponent.name.toUpperCase()} IS FLIPPING...`;
    
    // Disable player controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = true;
    });
    
    // Reset opponent consecutive wins
    battle.opponentConsecutiveWins = 0;
    
    // Simulate opponent flips with behavior patterns
    this.simulateOpponentFlips();
};

CoinFlipGame.prototype.simulateOpponentFlips = function() {
    const opponent = this.battleMode.currentOpponent;
    const battle = this.battleMode.currentBattle;
    
    const flipInterval = setInterval(() => {
        let winChance = battle.opponentWinChance;
        
        // Apply opponent behavior modifiers
        winChance = this.applyOpponentBehavior(winChance);
        
        // Apply player skill effects on opponent
        winChance = this.applyPlayerSkillsOnOpponent(winChance);
        
        const won = Math.random() < winChance;
        
        if (won) {
            battle.opponentStreak++;
            battle.opponentConsecutiveWins++;
            battle.playerConsecutiveWins = 0;
            
            // Apply opponent special abilities
            this.applyOpponentSpecialAbilities();
            
            // Apply boss double streaks
            if (this.battleMode.isBossBattle && opponent.special === 'double_streaks') {
                battle.opponentStreak++; // Double the streak gain
            }
            
            this.updateBattleDisplay();
            document.getElementById('battleMessage').textContent = `${opponent.name.toUpperCase()} STREAK: ${battle.opponentStreak}`;
            
            // Apply player skills that trigger on opponent wins
            this.applySkillsOnOpponentWin();
            
        } else {
            // Opponent loses, their turn ends
            clearInterval(flipInterval);
            document.getElementById('battleMessage').textContent = `${opponent.name.toUpperCase()} FINAL STREAK: ${battle.opponentStreak}`;
            battle.opponentHadTurn = true;
            
            // Check if player already had their turn
            if (battle.playerHadTurn) {
                // Both players have had their turn, determine winner
                setTimeout(() => {
                    this.determineBattleWinner();
                }, 2000);
            } else {
                // Switch to player turn
                setTimeout(() => {
                    this.startPlayerTurn();
                }, 2000);
            }
        }
    }, 1000);
};

CoinFlipGame.prototype.applyOpponentBehavior = function(baseWinChance) {
    const opponent = this.battleMode.currentOpponent;
    const battle = this.battleMode.currentBattle;
    let winChance = baseWinChance;
    
    switch (opponent.behavior) {
        case 'random':
            // Rookie - truly random
            winChance = 0.5;
            break;
        case 'streak_boost':
            // Gambler Joe - small chance for unexpected streaks
            if (Math.random() < 0.1) {
                winChance += 0.2; // 10% chance for big boost
            }
            break;
        case 'adaptive':
            // Analyst - increases odds each win
            winChance += battle.opponentConsecutiveWins * 0.05;
            break;
        case 'early_strong':
            // Hotshot - strong early, weak after 4
            if (battle.opponentStreak < 4) {
                winChance += 0.1;
            } else {
                winChance -= 0.2; // Collapses after 4
            }
            break;
        case 'mimic':
            // Magpie - copies player patterns (simplified)
            winChance = battle.playerWinChance;
            break;
        case 'consistent':
            // Dealer - rarely loses early
            if (battle.opponentStreak < 3) {
                winChance += 0.15;
            }
            break;
        case 'chaos':
            // Jester - random outcome swaps
            if (Math.random() < 0.1) {
                winChance = 1 - winChance; // Swap outcome 10% of time
            }
            break;
        case 'experienced':
            // Veteran - consistent, few mistakes
            winChance = Math.max(winChance, 0.7); // Minimum 70%
            break;
        case 'ignore_unlucky':
            // Phantom - ignores unlucky streaks 1 in 3 times
            if (battle.opponentConsecutiveWins === 0 && Math.random() < 0.33) {
                winChance = 0.8; // Force good outcome
            }
            break;
        case 'has_echo_flip':
            // Coinmaster - has echo flip skill
            if (battle.opponentConsecutiveWins === 3) {
                battle.opponentStreak++; // Extra streak like echo flip
                this.showMessage('COINMASTER USES ECHO FLIP!');
            }
            break;
    }
    
    return Math.min(Math.max(winChance, 0.05), 0.95); // Clamp between 5% and 95%
};

CoinFlipGame.prototype.applyPlayerSkillsOnOpponent = function(opponentWinChance) {
    const battle = this.battleMode.currentBattle;
    let winChance = opponentWinChance;
    
    // Sabotage - 20% chance to reduce opponent win chance by 10%
    if (this.hasSkill('sabotage') && Math.random() < 0.20) {
        winChance -= 0.10;
        this.showMessage('SABOTAGE ACTIVATED!');
    }
    
    // Tilt - reduce win chance if opponent won 2 in a row
    if (this.hasSkill('tilt') && battle.opponentConsecutiveWins >= 2) {
        winChance -= 0.15;
        this.showMessage('TILT ACTIVATED!');
    }
    
    return winChance;
};

CoinFlipGame.prototype.applyOpponentSpecialAbilities = function() {
    const battle = this.battleMode.currentBattle;
    
    // Pressure Drop - opponent loses 1 streak if they reach 4+
    if (this.hasSkill('pressure_drop') && battle.opponentStreak >= 4) {
        battle.opponentStreak--;
        this.showMessage('PRESSURE DROP ACTIVATED!');
    }
};

CoinFlipGame.prototype.applySkillsOnOpponentWin = function() {
    // Currently no skills trigger specifically on opponent wins
    // This is a placeholder for future skills
};

CoinFlipGame.prototype.startPlayerTurn = function() {
    const battle = this.battleMode.currentBattle;
    
    // Set player turn
    battle.playerTurn = true;
    
    // Re-enable player controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = false;
    });
    
    document.getElementById('battleMessage').textContent = 'YOUR TURN - FLIP UNTIL YOU LOSE!';
};

CoinFlipGame.prototype.determineBattleWinner = function() {
    const battle = this.battleMode.currentBattle;
    
    // Re-enable player controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = false;
    });
    
    // Determine winner based on highest streak
    if (battle.playerStreak > battle.opponentStreak) {
        this.endBattle(true);
    } else if (battle.opponentStreak > battle.playerStreak) {
        this.endBattle(false);
    } else {
        // Tie - player wins ties
        this.endBattle(true);
    }
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
        
        // Calculate rewards based on streak performance
        const baseReward = 100;
        const streakBonus = battle.playerStreak * 20;
        const totalReward = baseReward + streakBonus;
        
        // Award coins
        this.bank += totalReward;
        this.battleMode.wins++;
        
        // Bonus multiplier for main game
        this.multiplier += 0.2;
        
        let rewardText = `
            <div>BASE REWARD: ${baseReward} COINS</div>
            <div>STREAK BONUS: ${streakBonus} COINS</div>
            <div>TOTAL WON: ${totalReward} COINS!</div>
            <div>BATTLE WINS: ${this.battleMode.wins}</div>
        `;
        
        // Check for boss defeat
        if (this.battleMode.isBossBattle) {
            this.battleMode.bossDefeats++;
            const bossBonus = 500;
            this.bank += bossBonus;
            rewardText += `<div>BOSS DEFEATED! +${bossBonus} BONUS! 🏆</div>`;
        }
        
        rewards.innerHTML = rewardText;
        
        this.saveBattleStats();
        this.updateDisplay();
        
        // Victory effects
        this.launchFireworks();
        
        // Show streak comparison
        setTimeout(() => {
            this.showStreakComparison(battle.playerStreak, battle.opponentStreak);
        }, 1000);
        
    } else {
        // Defeat
        resultTitle.textContent = 'DEFEAT!';
        resultTitle.className = 'result-title defeat';
        
        rewards.innerHTML = `
            <div>YOUR STREAK: ${battle.playerStreak}</div>
            <div>OPPONENT STREAK: ${battle.opponentStreak}</div>
            <div>BETTER LUCK NEXT TIME!</div>
        `;
        
        // Small penalty - lose some current score but not bank
        if (this.score > 0) {
            const penalty = Math.min(this.score, 100);
            this.score -= penalty;
            rewards.innerHTML += `<div>LOST ${penalty} CURRENT SCORE</div>`;
        }
        
        this.updateDisplay();
        
        // Screen shake effect
        document.getElementById('gameContainer').classList.add('epic-fail-shake');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('epic-fail-shake');
        }, 1000);
        
        // Show streak comparison
        setTimeout(() => {
            this.showStreakComparison(battle.playerStreak, battle.opponentStreak);
        }, 1000);
    }
    
    // Re-enable controls
    document.querySelectorAll('.battle-choice').forEach(btn => {
        btn.disabled = false;
    });
    
    this.battleMode.battleInProgress = false;
};

CoinFlipGame.prototype.showStreakComparison = function(playerStreak, opponentStreak) {
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'streak-comparison';
    comparisonDiv.innerHTML = `
        <h4>FINAL STREAKS</h4>
        <div class="streak-bars">
            <div class="player-streak-bar">
                <span>YOU: ${playerStreak}</span>
                <div class="streak-bar" style="width: ${Math.max(playerStreak * 10, 10)}px; background: #4ecdc4;"></div>
            </div>
            <div class="opponent-streak-bar">
                <span>OPPONENT: ${opponentStreak}</span>
                <div class="streak-bar" style="width: ${Math.max(opponentStreak * 10, 10)}px; background: #ff6b6b;"></div>
            </div>
        </div>
    `;
    
    document.getElementById('battleRewards').appendChild(comparisonDiv);
};

CoinFlipGame.prototype.updateBattleDisplay = function() {
    const battle = this.battleMode.currentBattle;
    
    // Update streak displays
    document.getElementById('playerBattleStreak').textContent = battle.playerStreak;
    document.getElementById('opponentBattleStreak').textContent = battle.opponentStreak;
    
    // Update player skills display in battle
    this.updatePlayerSkillsDisplay();
    
    // Update opponent info in battle
    this.updateOpponentBattleDisplay();
};

CoinFlipGame.prototype.updatePlayerSkillsDisplay = function() {
    const skillsContainer = document.getElementById('playerBattleSkills');
    
    skillsContainer.innerHTML = this.battleMode.selectedSkills.map(skill => `
        <div class="player-skill-item">
            ${skill.name}
        </div>
    `).join('');
};

CoinFlipGame.prototype.updateOpponentBattleDisplay = function() {
    const opponent = this.battleMode.currentOpponent;
    
    // Update opponent avatar and name in battle
    document.getElementById('opponentBattleAvatar').textContent = opponent.avatar;
    document.getElementById('opponentBattleName').textContent = opponent.name;
    
    // Update opponent effects
    const effectsContainer = document.getElementById('opponentBattleEffects');
    let effects = [];
    
    if (this.battleMode.isBossBattle) {
        effects.push(opponent.specialRule);
    } else {
        effects.push(`${Math.round(opponent.baseWinChance * 100)}% Base Win Rate`);
        effects.push(`Behavior: ${opponent.behavior.replace('_', ' ').toUpperCase()}`);
    }
    
    effectsContainer.innerHTML = effects.map(effect => `
        <div class="opponent-effect-item">
            ${effect}
        </div>
    `).join('');
};

CoinFlipGame.prototype.saveBattleStats = function() {
    localStorage.setItem('battleStats', JSON.stringify({
        wins: this.battleMode.wins,
        bossDefeats: this.battleMode.bossDefeats,
        lastCheckedWins: this.battleMode.lastCheckedWins
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