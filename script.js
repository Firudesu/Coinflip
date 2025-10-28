class CoinFlipGame {
    constructor() {
        this.streak = 0;
        this.score = 0;
        this.multiplier = 1.0;
        this.selectedPrediction = null;
        this.isFlipping = false;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.coin = document.getElementById('coin');
        this.streakDisplay = document.getElementById('streak');
        this.multiplierDisplay = document.getElementById('multiplier');
        this.scoreDisplay = document.getElementById('score');
        this.headsBtn = document.getElementById('heads-btn');
        this.tailsBtn = document.getElementById('tails-btn');
        this.flipBtn = document.getElementById('flip-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.resultText = document.getElementById('result-text');
        this.streakText = document.getElementById('streak-text');
    }

    bindEvents() {
        this.headsBtn.addEventListener('click', () => this.selectPrediction('heads'));
        this.tailsBtn.addEventListener('click', () => this.selectPrediction('tails'));
        this.flipBtn.addEventListener('click', () => this.flipCoin());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Allow coin clicking to flip
        this.coin.addEventListener('click', () => {
            if (this.selectedPrediction && !this.isFlipping) {
                this.flipCoin();
            }
        });
    }

    selectPrediction(prediction) {
        if (this.isFlipping) return;
        
        this.selectedPrediction = prediction;
        
        // Update button styles
        this.headsBtn.classList.toggle('selected', prediction === 'heads');
        this.tailsBtn.classList.toggle('selected', prediction === 'tails');
        
        // Enable flip button
        this.flipBtn.disabled = false;
        
        // Clear previous results
        this.clearResults();
    }

    async flipCoin() {
        if (!this.selectedPrediction || this.isFlipping) return;
        
        this.isFlipping = true;
        this.flipBtn.disabled = true;
        this.headsBtn.disabled = true;
        this.tailsBtn.disabled = true;
        
        // Add flipping animation
        this.coin.classList.add('flipping');
        
        // Generate random result
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove flipping animation
        this.coin.classList.remove('flipping');
        
        // Show result
        this.showResult(result);
        
        // Check if prediction was correct
        const isCorrect = this.selectedPrediction === result;
        
        if (isCorrect) {
            this.streak++;
            this.multiplier = 1.0 + (this.streak * 0.1);
            this.score += Math.floor(10 * this.multiplier);
            this.showStreakMessage();
        } else {
            this.streak = 0;
            this.multiplier = 1.0;
            this.showLossMessage();
        }
        
        this.updateDisplay();
        this.resetForNextRound();
    }

    showResult(result) {
        // Update coin display
        this.coin.style.transform = result === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        
        // Show result text
        this.resultText.textContent = `RESULT: ${result.toUpperCase()}`;
        this.resultText.style.color = result === 'heads' ? '#f39c12' : '#95a5a6';
    }

    showStreakMessage() {
        const messages = [
            'NICE!',
            'GREAT!',
            'AWESOME!',
            'INCREDIBLE!',
            'LEGENDARY!',
            'UNSTOPPABLE!',
            'PHENOMENAL!',
            'MAGNIFICENT!',
            'EXTRAORDINARY!',
            'SUPERNATURAL!'
        ];
        
        const message = messages[Math.min(this.streak - 1, messages.length - 1)] || 'AMAZING!';
        this.streakText.textContent = `${message} STREAK: ${this.streak}`;
        this.streakText.style.color = '#2ecc71';
        
        // Add some visual feedback
        this.coin.style.transform += ' scale(1.1)';
        setTimeout(() => {
            this.coin.style.transform = this.coin.style.transform.replace(' scale(1.1)', '');
        }, 200);
    }

    showLossMessage() {
        this.streakText.textContent = 'STREAK BROKEN! TRY AGAIN!';
        this.streakText.style.color = '#e74c3c';
        
        // Add shake animation
        this.coin.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.coin.style.animation = '';
        }, 500);
    }

    clearResults() {
        this.resultText.textContent = '';
        this.streakText.textContent = '';
    }

    resetForNextRound() {
        this.selectedPrediction = null;
        this.headsBtn.classList.remove('selected');
        this.tailsBtn.classList.remove('selected');
        this.headsBtn.disabled = false;
        this.tailsBtn.disabled = false;
        this.flipBtn.disabled = true;
        this.isFlipping = false;
    }

    updateDisplay() {
        this.streakDisplay.textContent = this.streak;
        this.multiplierDisplay.textContent = this.multiplier.toFixed(1) + 'x';
        this.scoreDisplay.textContent = this.score;
    }

    resetGame() {
        this.streak = 0;
        this.score = 0;
        this.multiplier = 1.0;
        this.selectedPrediction = null;
        this.isFlipping = false;
        
        this.clearResults();
        this.updateDisplay();
        this.resetForNextRound();
        
        // Reset coin position
        this.coin.style.transform = 'rotateY(0deg)';
        this.coin.style.animation = '';
    }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CoinFlipGame();
});

// Add some fun sound effects using Web Audio API
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playSuccess() {
        // Play a success chord
        this.playTone(523.25, 0.2); // C5
        setTimeout(() => this.playTone(659.25, 0.2), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.3), 200); // G5
    }

    playFailure() {
        // Play a descending tone
        this.playTone(440, 0.3); // A4
        setTimeout(() => this.playTone(392, 0.3), 150); // G4
        setTimeout(() => this.playTone(349.23, 0.4), 300); // F4
    }

    playFlip() {
        // Play a quick ascending tone
        this.playTone(220, 0.1); // A3
        setTimeout(() => this.playTone(330, 0.1), 50); // E4
        setTimeout(() => this.playTone(440, 0.2), 100); // A4
    }
}

// Initialize sound effects
const soundEffects = new SoundEffects();

// Add sound effects to the game
document.addEventListener('DOMContentLoaded', () => {
    const game = new CoinFlipGame();
    
    // Override the flipCoin method to add sound effects
    const originalFlipCoin = game.flipCoin.bind(game);
    game.flipCoin = async function() {
        soundEffects.playFlip();
        return originalFlipCoin();
    };
    
    // Add sound effects to button clicks
    document.getElementById('heads-btn').addEventListener('click', () => {
        soundEffects.playTone(440, 0.1);
    });
    
    document.getElementById('tails-btn').addEventListener('click', () => {
        soundEffects.playTone(330, 0.1);
    });
    
    // Add success/failure sounds
    const originalShowStreakMessage = game.showStreakMessage.bind(game);
    game.showStreakMessage = function() {
        soundEffects.playSuccess();
        return originalShowStreakMessage();
    };
    
    const originalShowLossMessage = game.showLossMessage.bind(game);
    game.showLossMessage = function() {
        soundEffects.playFailure();
        return originalShowLossMessage();
    };
});