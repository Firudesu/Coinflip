// Game state
let playerChoice = null;
let wins = 0;
let losses = 0;
let isFlipping = false;

// Get DOM elements
const coin = document.getElementById('coin');
const flipBtn = document.getElementById('flipBtn');
const resultText = document.getElementById('resultText');
const scoreText = document.getElementById('scoreText');
const choiceButtons = document.querySelectorAll('.choice-btn');

// Function to handle player choice
function makeChoice(choice) {
    if (isFlipping) return;
    
    playerChoice = choice;
    
    // Update button styles
    choiceButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent.toLowerCase() === choice) {
            btn.classList.add('selected');
        }
    });
    
    // Enable flip button
    flipBtn.disabled = false;
    
    // Clear previous result
    resultText.textContent = `You chose ${choice.toUpperCase()}. Ready to flip!`;
    resultText.className = '';
}

// Function to flip the coin
function flipCoin() {
    if (!playerChoice || isFlipping) return;
    
    isFlipping = true;
    flipBtn.disabled = true;
    
    // Clear previous result
    resultText.textContent = 'Flipping...';
    resultText.className = '';
    
    // Remove previous animation classes
    coin.classList.remove('show-heads', 'show-tails', 'flipping');
    
    // Trigger reflow to restart animation
    void coin.offsetWidth;
    
    // Add flipping animation
    coin.classList.add('flipping');
    
    // Determine random result
    const isHeads = Math.random() < 0.5;
    const result = isHeads ? 'heads' : 'tails';
    
    // Show result after animation
    setTimeout(() => {
        coin.classList.remove('flipping');
        
        if (isHeads) {
            coin.classList.add('show-heads');
            coin.classList.remove('show-tails');
        } else {
            coin.classList.add('show-tails');
            coin.classList.remove('show-heads');
        }
        
        // Check if player won
        const won = playerChoice === result;
        
        if (won) {
            wins++;
            resultText.textContent = `🎉 You WIN! It was ${result.toUpperCase()}!`;
            resultText.classList.add('win');
        } else {
            losses++;
            resultText.textContent = `😔 You LOSE! It was ${result.toUpperCase()}.`;
            resultText.classList.add('lose');
        }
        
        // Update score
        updateScore();
        
        // Reset for next round
        setTimeout(() => {
            resetRound();
        }, 2000);
        
    }, 2000);
}

// Function to update score display
function updateScore() {
    scoreText.textContent = `Wins: ${wins} | Losses: ${losses}`;
}

// Function to reset the round
function resetRound() {
    isFlipping = false;
    playerChoice = null;
    flipBtn.disabled = true;
    
    // Remove selected class from buttons
    choiceButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Update result text
    if (wins > 0 || losses > 0) {
        const winRate = wins > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
        resultText.textContent = `Win rate: ${winRate}% - Choose again!`;
        resultText.className = '';
    } else {
        resultText.textContent = 'Make your choice to start!';
        resultText.className = '';
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // Set initial coin state
    coin.classList.add('show-heads');
    resultText.textContent = 'Welcome! Choose heads or tails to begin.';
    updateScore();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (isFlipping) return;
    
    if (e.key === 'h' || e.key === 'H') {
        makeChoice('heads');
    } else if (e.key === 't' || e.key === 'T') {
        makeChoice('tails');
    } else if (e.key === ' ' || e.key === 'Enter') {
        if (!flipBtn.disabled) {
            flipCoin();
        }
    }
});