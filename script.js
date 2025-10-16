class CoinFlipGame {
    constructor() {
        this.coin = document.getElementById('coin');
        this.flipBtn = document.getElementById('flipBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.result = document.getElementById('result');
        this.streak = document.getElementById('streak');
        this.headsCount = document.getElementById('headsCount');
        this.tailsCount = document.getElementById('tailsCount');
        this.totalFlips = document.getElementById('totalFlips');
        
        this.stats = {
            heads: 0,
            tails: 0,
            total: 0,
            currentStreak: 0,
            lastResult: null
        };
        
        this.isFlipping = false;
        this.loadStats();
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.flipBtn.addEventListener('click', () => this.flipCoin());
        this.resetBtn.addEventListener('click', () => this.resetStats());
        
        // Add keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isFlipping) {
                e.preventDefault();
                this.flipCoin();
            } else if (e.code === 'KeyR' && e.ctrlKey) {
                e.preventDefault();
                this.resetStats();
            }
        });
        
        // Add coin click support
        this.coin.addEventListener('click', () => {
            if (!this.isFlipping) {
                this.flipCoin();
            }
        });
    }
    
    flipCoin() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.flipBtn.disabled = true;
        this.flipBtn.textContent = 'Flipping...';
        this.result.textContent = '';
        
        // Remove any existing animation classes
        this.coin.classList.remove('flip-heads', 'flip-tails');
        
        // Generate random result
        const isHeads = Math.random() < 0.5;
        const resultText = isHeads ? 'heads' : 'tails';
        
        // Add animation class
        setTimeout(() => {
            this.coin.classList.add(isHeads ? 'flip-heads' : 'flip-tails');
        }, 50);
        
        // Show result after animation
        setTimeout(() => {
            this.showResult(resultText);
            this.updateStats(resultText);
            this.isFlipping = false;
            this.flipBtn.disabled = false;
            this.flipBtn.textContent = 'Flip Coin';
        }, 2000);
    }
    
    showResult(result) {
        const resultEmoji = result === 'heads' ? '👑' : '⚡';
        this.result.textContent = `${resultEmoji} ${result.toUpperCase()}! ${resultEmoji}`;
        
        // Add celebration effect for streaks
        if (this.stats.currentStreak >= 3) {
            this.result.style.animation = 'none';
            setTimeout(() => {
                this.result.style.animation = 'celebration 0.5s ease-in-out';
            }, 10);
        }
    }
    
    updateStats(result) {
        this.stats.total++;
        
        if (result === 'heads') {
            this.stats.heads++;
        } else {
            this.stats.tails++;
        }
        
        // Update streak
        if (this.stats.lastResult === result) {
            this.stats.currentStreak++;
        } else {
            this.stats.currentStreak = 1;
        }
        this.stats.lastResult = result;
        
        this.updateDisplay();
        this.saveStats();
    }
    
    updateDisplay() {
        this.headsCount.textContent = this.stats.heads;
        this.tailsCount.textContent = this.stats.tails;
        this.totalFlips.textContent = this.stats.total;
        
        const streakText = this.stats.currentStreak > 1 
            ? `Current Streak: ${this.stats.currentStreak} ${this.stats.lastResult}!`
            : 'Current Streak: 0';
        this.streak.textContent = streakText;
        
        // Add streak highlighting
        if (this.stats.currentStreak >= 5) {
            this.streak.style.color = '#FF6B6B';
            this.streak.style.fontWeight = 'bold';
        } else if (this.stats.currentStreak >= 3) {
            this.streak.style.color = '#FFD93D';
            this.streak.style.fontWeight = 'bold';
        } else {
            this.streak.style.color = '#F5DEB3';
            this.streak.style.fontWeight = 'normal';
        }
    }
    
    resetStats() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            this.stats = {
                heads: 0,
                tails: 0,
                total: 0,
                currentStreak: 0,
                lastResult: null
            };
            
            this.result.textContent = '';
            this.updateDisplay();
            this.saveStats();
            
            // Reset coin animation
            this.coin.classList.remove('flip-heads', 'flip-tails');
            
            // Show reset confirmation
            this.result.textContent = '📊 Stats Reset! 📊';
            setTimeout(() => {
                this.result.textContent = '';
            }, 2000);
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('coinFlipStats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Could not save stats to localStorage:', e);
        }
    }
    
    loadStats() {
        try {
            const savedStats = localStorage.getItem('coinFlipStats');
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
                this.updateDisplay();
            }
        } catch (e) {
            console.warn('Could not load stats from localStorage:', e);
        }
    }
}

// Add celebration animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes celebration {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.1) rotate(-5deg); }
        50% { transform: scale(1.2); }
        75% { transform: scale(1.1) rotate(5deg); }
    }
`;
document.head.appendChild(style);

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoinFlipGame();
    
    // Add welcome message
    console.log('🎲 Welcome to the Tavern Coin Flip Game! 🎲');
    console.log('💡 Tips:');
    console.log('   - Press SPACE to flip the coin');
    console.log('   - Press Ctrl+R to reset stats');
    console.log('   - Click the coin to flip it');
    console.log('   - Your stats are automatically saved!');
});

// Add some tavern atmosphere sounds (optional - requires audio files)
class TavernAmbience {
    constructor() {
        this.sounds = {
            coinFlip: null,
            tavernNoise: null
        };
        this.initSounds();
    }
    
    initSounds() {
        // This would require actual audio files
        // For now, we'll use the Web Audio API for simple sounds
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playFlipSound() {
        if (!this.audioContext) return;
        
        // Create a simple coin flip sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
}

// Initialize ambience (optional)
let tavernAmbience = null;
document.addEventListener('click', () => {
    if (!tavernAmbience) {
        tavernAmbience = new TavernAmbience();
    }
}, { once: true });