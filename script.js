class CoinFlipGame {
    constructor() {
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.multiplier = 1.0;
        this.selectedChoice = null;
        this.isFlipping = false;
        
        // DOM elements
        this.coin = document.getElementById('coin');
        this.flipBtn = document.getElementById('flip-btn');
        this.headsBtn = document.getElementById('heads-btn');
        this.tailsBtn = document.getElementById('tails-btn');
        this.resultSection = document.getElementById('result-section');
        this.resultMessage = document.getElementById('result-message');
        this.streakDisplay = document.getElementById('streak');
        this.multiplierDisplay = document.getElementById('multiplier');
        this.bestStreakDisplay = document.getElementById('best-streak');
        
        this.initializeGame();
        this.loadGameData();
    }
    
    initializeGame() {
        // Add event listeners
        this.headsBtn.addEventListener('click', () => this.selectChoice('heads'));
        this.tailsBtn.addEventListener('click', () => this.selectChoice('tails'));
        this.flipBtn.addEventListener('click', () => this.flipCoin());
        
        // Initialize display
        this.updateDisplay();
        this.updateFlipButton();
    }
    
    loadGameData() {
        // Load saved game data from localStorage
        const savedData = localStorage.getItem('coinFlipGameData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.bestStreak = data.bestStreak || 0;
            this.updateDisplay();
        }
    }
    
    saveGameData() {
        // Save game data to localStorage
        const gameData = {
            bestStreak: this.bestStreak
        };
        localStorage.setItem('coinFlipGameData', JSON.stringify(gameData));
    }
    
    selectChoice(choice) {
        if (this.isFlipping) return;
        
        this.selectedChoice = choice;
        
        // Update button states
        this.headsBtn.classList.remove('selected');
        this.tailsBtn.classList.remove('selected');
        
        if (choice === 'heads') {
            this.headsBtn.classList.add('selected');
        } else {
            this.tailsBtn.classList.add('selected');
        }
        
        this.updateFlipButton();
        this.clearResult();
    }
    
    updateFlipButton() {
        if (this.selectedChoice && !this.isFlipping) {
            this.flipBtn.disabled = false;
            this.flipBtn.querySelector('.btn-text').textContent = 'FLIP THE COIN!';
        } else if (this.isFlipping) {
            this.flipBtn.disabled = true;
            this.flipBtn.querySelector('.btn-text').textContent = 'FLIPPING...';
        } else {
            this.flipBtn.disabled = true;
            this.flipBtn.querySelector('.btn-text').textContent = 'SELECT HEADS OR TAILS FIRST';
        }
    }
    
    flipCoin() {
        if (!this.selectedChoice || this.isFlipping) return;
        
        this.isFlipping = true;
        this.updateFlipButton();
        this.clearResult();
        
        // Add flipping animation
        this.coin.classList.add('flipping');
        
        // Generate random result
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Show coin flip animation and result after delay
        setTimeout(() => {
            this.showResult(result);
            this.coin.classList.remove('flipping');
            
            // Update coin face based on result
            if (result === 'heads') {
                this.coin.style.transform = 'rotateY(0deg)';
            } else {
                this.coin.style.transform = 'rotateY(180deg)';
            }
            
            this.isFlipping = false;
            this.updateFlipButton();
        }, 1000);
        
        // Add particle effects
        this.createParticles();
    }
    
    showResult(result) {
        const isCorrect = result === this.selectedChoice;
        
        if (isCorrect) {
            this.currentStreak++;
            this.multiplier = 1.0 + (this.currentStreak * 0.1);
            
            if (this.currentStreak > this.bestStreak) {
                this.bestStreak = this.currentStreak;
                this.saveGameData();
            }
            
            this.resultMessage.textContent = `🎉 CORRECT! It's ${result.toUpperCase()}! Streak: ${this.currentStreak}`;
            this.resultMessage.className = 'result-message success';
            
            // Add success sound effect (visual feedback)
            this.createSuccessEffect();
        } else {
            this.currentStreak = 0;
            this.multiplier = 1.0;
            
            this.resultMessage.textContent = `❌ WRONG! It's ${result.toUpperCase()}. Streak reset!`;
            this.resultMessage.className = 'result-message failure';
            
            // Add failure sound effect (visual feedback)
            this.createFailureEffect();
        }
        
        this.updateDisplay();
        
        // Clear selection for next round
        setTimeout(() => {
            this.selectedChoice = null;
            this.headsBtn.classList.remove('selected');
            this.tailsBtn.classList.remove('selected');
            this.updateFlipButton();
        }, 2000);
    }
    
    updateDisplay() {
        this.streakDisplay.textContent = this.currentStreak;
        this.multiplierDisplay.textContent = `${this.multiplier.toFixed(1)}x`;
        this.bestStreakDisplay.textContent = this.bestStreak;
        
        // Add glow effect for high streaks
        if (this.currentStreak >= 5) {
            this.streakDisplay.style.color = '#ff6b6b';
            this.streakDisplay.style.textShadow = '0 0 10px #ff6b6b';
        } else if (this.currentStreak >= 3) {
            this.streakDisplay.style.color = '#feca57';
            this.streakDisplay.style.textShadow = '0 0 10px #feca57';
        } else {
            this.streakDisplay.style.color = 'var(--accent-text)';
            this.streakDisplay.style.textShadow = 'none';
        }
        
        // Animate multiplier changes
        if (this.currentStreak > 0) {
            this.multiplierDisplay.style.color = '#00ff00';
            this.multiplierDisplay.style.textShadow = '0 0 10px #00ff00';
        } else {
            this.multiplierDisplay.style.color = 'var(--accent-text)';
            this.multiplierDisplay.style.textShadow = 'none';
        }
    }
    
    clearResult() {
        this.resultMessage.textContent = '';
        this.resultMessage.className = 'result-message';
    }
    
    createParticles() {
        const container = document.querySelector('.coin-container');
        const colors = ['#ffff00', '#00ff41', '#00ffff', '#ff6b6b'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    container.removeChild(particle);
                }, 1000);
            }, i * 100);
        }
    }
    
    createSuccessEffect() {
        // Flash the border green
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.borderColor = '#00ff00';
        gameContainer.style.boxShadow = '0 0 30px #00ff00, inset 0 0 30px rgba(0, 255, 0, 0.2)';
        
        setTimeout(() => {
            gameContainer.style.borderColor = 'var(--border-color)';
            gameContainer.style.boxShadow = '0 0 20px var(--border-color), inset 0 0 20px rgba(0, 255, 255, 0.1)';
        }, 500);
    }
    
    createFailureEffect() {
        // Flash the border red and shake
        const gameContainer = document.querySelector('.game-container');
        gameContainer.style.borderColor = '#ff0040';
        gameContainer.style.boxShadow = '0 0 30px #ff0040, inset 0 0 30px rgba(255, 0, 64, 0.2)';
        gameContainer.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            gameContainer.style.borderColor = 'var(--border-color)';
            gameContainer.style.boxShadow = '0 0 20px var(--border-color), inset 0 0 20px rgba(0, 255, 255, 0.1)';
            gameContainer.style.animation = 'none';
        }, 500);
    }
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoinFlipGame();
});

// Add some easter eggs for fun
document.addEventListener('keydown', (e) => {
    // Konami code easter egg (up, up, down, down, left, right, left, right, b, a)
    if (e.code === 'KeyC' && e.ctrlKey) {
        console.log('🎮 Pixel Coin Flip - Built with retro love!');
        console.log('🔥 Current streak multiplier system:');
        console.log('   • Each correct guess = +0.1x multiplier');
        console.log('   • Wrong guess resets streak and multiplier');
        console.log('   • Best streak is saved locally');
    }
});