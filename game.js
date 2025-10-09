class CoinFlipGame {
    constructor() {
        this.canvas = document.getElementById('coinCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
        
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.bank = 0; // Banked currency
        this.multiplier = 1.0;
        this.basePoints = 10;
        
        this.playerChoice = null;
        this.isFlipping = false;
        this.coinSide = 'heads'; // Current coin side
        
        this.coinRotation = 0;
        this.flipAnimation = null;
        
        this.init();
    }
    
    init() {
        // Load from localStorage
        this.bestStreak = parseInt(localStorage.getItem('bestStreak') || '0');
        this.bank = parseInt(localStorage.getItem('bank') || '0');
        this.updateDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Draw initial coin
        this.drawCoin();
        
        // Show initial message
        this.showMessage('CHOOSE HEADS OR TAILS');
    }
    
    setupEventListeners() {
        // Choice buttons
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isFlipping) {
                    this.playerChoice = e.target.closest('.choice-btn').dataset.choice;
                    this.highlightChoice(this.playerChoice);
                    this.showMessage('CLICK THE COIN TO FLIP!');
                    this.canvas.classList.remove('disabled');
                }
            });
        });
        
        // Coin click
        this.canvas.addEventListener('click', () => {
            if (this.playerChoice && !this.isFlipping) {
                this.flipCoin();
            }
        });
        
        // Bank button
        document.getElementById('bankBtn').addEventListener('click', () => {
            this.bankScore();
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    highlightChoice(choice) {
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-choice="${choice}"]`).classList.add('selected');
    }
    
    flipCoin() {
        if (this.isFlipping) return;
        
        this.isFlipping = true;
        this.canvas.classList.add('flipping', 'disabled');
        document.getElementById('choiceContainer').classList.add('hidden');
        
        // Determine result (50/50 chance)
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Enhanced animation parameters
        let frame = 0;
        const totalFrames = 60; // More frames for smoother animation
        const flipSpeed = 20; // ms per frame (faster updates)
        
        // Add some vertical movement for more dynamic feel
        let baseY = 0;
        let velocity = -8; // Initial upward velocity
        const gravity = 0.4;
        
        this.flipAnimation = setInterval(() => {
            frame++;
            
            // Easing function for more natural rotation
            const progress = frame / totalFrames;
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Calculate rotation with easing
            const totalRotation = Math.PI * 8; // 4 full rotations
            this.coinRotation = easedProgress * totalRotation;
            
            // Add vertical bounce
            if (frame < totalFrames * 0.7) {
                velocity += gravity;
                baseY += velocity;
                if (baseY > 0) {
                    baseY = 0;
                    velocity *= -0.5; // Bounce with dampening
                }
            } else {
                baseY = 0; // Settle down
            }
            
            // Update coin side based on rotation
            const rotationCount = Math.floor(this.coinRotation / Math.PI);
            this.coinSide = (rotationCount % 2 === 0) ? 
                (result === 'heads' ? 'heads' : 'tails') : 
                (result === 'heads' ? 'tails' : 'heads');
            
            // Ensure we end on the correct side
            if (frame >= totalFrames - 5) {
                this.coinSide = result;
            }
            
            // Save and restore for vertical movement
            const canvas = this.canvas;
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(0, baseY);
            
            this.drawCoin(true);
            
            ctx.restore();
            
            if (frame >= totalFrames) {
                clearInterval(this.flipAnimation);
                this.coinSide = result;
                this.coinRotation = 0;
                this.drawCoin();
                this.handleResult(result);
            }
        }, flipSpeed);
    }
    
    handleResult(result) {
        const won = result === this.playerChoice;
        
        if (won) {
            this.streak++;
            this.multiplier = 1.0 + (this.streak * 0.1);
            const points = Math.round(this.basePoints * this.multiplier);
            this.score += points;
            
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak;
                localStorage.setItem('bestStreak', this.bestStreak);
            }
            
            this.showResult('WIN!', true);
            this.showMessage(`CORRECT! +${points} POINTS`);
            
            // Add visual effects
            this.celebrateWin();
        } else {
            // Show what was lost
            const lostScore = this.score;
            const lostStreak = this.streak;
            
            this.showResult('LOSE!', false);
            if (lostScore > 0) {
                this.showMessage(`WRONG! LOST ${lostScore} POINTS & ${lostStreak} STREAK`);
            } else {
                this.showMessage(`WRONG! THE COIN WAS ${result.toUpperCase()}`);
            }
            
            // Reset score, streak, and multiplier on loss
            this.score = 0;
            this.streak = 0;
            this.multiplier = 1.0;
            
            // Add visual effects
            this.showLoss();
        }
        
        this.updateDisplay();
        
        // Reset for next round
        setTimeout(() => {
            this.isFlipping = false;
            this.playerChoice = null;
            this.canvas.classList.remove('flipping', 'disabled');
            document.getElementById('choiceContainer').classList.remove('hidden');
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.showMessage('CHOOSE HEADS OR TAILS');
        }, 2000);
    }
    
    drawCoin(isFlipping = false) {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radiusX = 80;
        const radiusY = 60; // Base elliptical shape for perspective
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Isometric angle adjustment (slight tilt)
        const perspectiveTilt = 0.7; // Makes coin appear tilted
        
        let scaleY = perspectiveTilt;
        let thickness = 15; // Coin thickness for 3D effect
        
        if (isFlipping) {
            // Enhanced 3D flip effect with rotation
            const rotation = this.coinRotation;
            scaleY = perspectiveTilt * Math.cos(rotation);
            thickness = 15 * Math.abs(Math.sin(rotation * 0.5)) + 5;
        }
        
        // Draw coin edge/thickness (3D effect)
        if (Math.abs(scaleY) < perspectiveTilt * 0.98) {
            // Draw the edge of the coin
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(-radiusX, -thickness/2, radiusX * 2, thickness);
            
            // Add edge highlights
            ctx.fillStyle = '#D4AF37';
            ctx.fillRect(-radiusX, -thickness/2, radiusX * 2, 2);
            ctx.fillRect(-radiusX, thickness/2 - 2, radiusX * 2, 2);
            
            // Add ridges on the edge
            for (let i = -radiusX; i < radiusX; i += 8) {
                ctx.strokeStyle = '#8B6914';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(i, -thickness/2);
                ctx.lineTo(i, thickness/2);
                ctx.stroke();
            }
        }
        
        // Draw main coin face
        ctx.scale(1, Math.abs(scaleY));
        
        // Gradient for more realistic metallic look
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
        gradient.addColorStop(0, '#FFEB3B');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(0.8, '#FFC700');
        gradient.addColorStop(1, '#B8860B');
        
        // Draw coin background with ellipse for perspective
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusX, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner circle with perspective
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX - 10, radiusX - 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Only show face details when coin is mostly facing us
        if (scaleY > 0.2) {
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Adjust text position for perspective
            const yOffset = -10 / Math.abs(scaleY);
            
            if (this.coinSide === 'heads') {
                ctx.fillText('H', 0, yOffset);
                this.drawPixelCrown(ctx, 0, 15 / Math.abs(scaleY));
            } else {
                ctx.fillText('T', 0, yOffset);
                this.drawPixelTail(ctx, 0, 15 / Math.abs(scaleY));
            }
        } else if (scaleY < -0.2) {
            // Show opposite side when flipped
            ctx.font = 'bold 24px "Press Start 2P"';
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const yOffset = -10 / Math.abs(scaleY);
            
            // Show opposite side
            if (this.coinSide === 'tails') {
                ctx.fillText('H', 0, yOffset);
                this.drawPixelCrown(ctx, 0, 15 / Math.abs(scaleY));
            } else {
                ctx.fillText('T', 0, yOffset);
                this.drawPixelTail(ctx, 0, 15 / Math.abs(scaleY));
            }
        }
        
        ctx.restore();
        
        // Draw shadow that changes with rotation
        if (isFlipping) {
            const shadowScale = 1 - Math.abs(scaleY) * 0.3;
            const shadowOpacity = 0.3 + Math.abs(scaleY) * 0.2;
            ctx.save();
            ctx.translate(centerX, centerY + 90);
            ctx.scale(shadowScale, 0.2);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX * 0.8, radiusX * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawPixelCrown(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        const pixelSize = 4;
        
        // Crown pattern (simplified pixel art)
        const crown = [
            [0,1,0,1,0],
            [1,1,1,1,1],
            [1,1,1,1,1]
        ];
        
        crown.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
                if (pixel) {
                    ctx.fillRect(
                        x + (colIndex - 2) * pixelSize,
                        y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    drawPixelTail(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        const pixelSize = 4;
        
        // Tail pattern (simplified pixel art)
        const tail = [
            [0,1,1,0,0],
            [1,1,1,1,0],
            [0,0,1,1,1]
        ];
        
        tail.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
                if (pixel) {
                    ctx.fillRect(
                        x + (colIndex - 2) * pixelSize,
                        y + rowIndex * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    showResult(text, isWin) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultText = document.getElementById('resultText');
        
        resultText.textContent = text;
        resultDisplay.className = 'result-display show';
        resultDisplay.classList.add(isWin ? 'win' : 'lose');
        
        setTimeout(() => {
            resultDisplay.classList.remove('show');
        }, 1500);
    }
    
    celebrateWin() {
        // Add a pulse effect to score
        const scoreElement = document.getElementById('score');
        scoreElement.style.animation = 'none';
        setTimeout(() => {
            scoreElement.style.animation = 'pulse 0.5s';
        }, 10);
        
        // Flash the canvas border
        this.canvas.style.filter = 'drop-shadow(0 0 30px #4ecdc4)';
        setTimeout(() => {
            this.canvas.style.filter = 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))';
        }, 500);
    }
    
    showLoss() {
        // Shake effect
        this.canvas.style.animation = 'shake 0.5s';
        setTimeout(() => {
            this.canvas.style.animation = '';
        }, 500);
        
        // Flash red
        this.canvas.style.filter = 'drop-shadow(0 0 30px #ff6b6b)';
        setTimeout(() => {
            this.canvas.style.filter = 'drop-shadow(0 0 20px rgba(255, 235, 59, 0.5))';
        }, 500);
    }
    
    showMessage(text) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.style.animation = 'none';
        setTimeout(() => {
            messageEl.style.animation = 'fadeIn 0.5s';
        }, 10);
    }
    
    bankScore() {
        if (this.score > 0 && !this.isFlipping) {
            const bankBtn = document.getElementById('bankBtn');
            bankBtn.classList.add('banking');
            
            // Add score to bank
            const bankedAmount = this.score;
            this.bank += bankedAmount;
            localStorage.setItem('bank', this.bank);
            
            // Show banking message
            this.showMessage(`BANKED ${bankedAmount} COINS! SAFE FROM LOSS`);
            
            // Reset current score and streak
            this.score = 0;
            this.streak = 0;
            this.multiplier = 1.0;
            
            // Update display
            this.updateDisplay();
            
            // Visual feedback
            this.celebrateBank();
            
            setTimeout(() => {
                bankBtn.classList.remove('banking');
            }, 600);
        }
    }
    
    celebrateBank() {
        const bankDisplay = document.querySelector('.bank-display');
        bankDisplay.style.animation = 'pulse 0.5s';
        setTimeout(() => {
            bankDisplay.style.animation = '';
        }, 500);
        
        // Flash gold color
        const bankValue = document.getElementById('bank');
        bankValue.style.color = '#ffd700';
        bankValue.style.textShadow = '0 0 20px #ffd700';
        setTimeout(() => {
            bankValue.style.color = '#4ecdc4';
            bankValue.style.textShadow = '0 0 10px #4ecdc4';
        }, 500);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('multiplier').textContent = `x${this.multiplier.toFixed(1)}`;
        document.getElementById('best-streak').textContent = this.bestStreak;
        document.getElementById('bank').textContent = this.bank;
        
        // Update bank button
        const bankBtn = document.getElementById('bankBtn');
        const bankAmount = document.getElementById('bankAmount');
        bankAmount.textContent = `(${this.score})`;
        
        if (this.score > 0) {
            bankBtn.disabled = false;
        } else {
            bankBtn.disabled = true;
        }
    }
    
    resetGame() {
        this.score = 0;
        this.streak = 0;
        this.multiplier = 1.0;
        this.playerChoice = null;
        this.isFlipping = false;
        this.coinSide = 'heads';
        // Note: Bank is NOT reset - it's permanent currency
        
        this.updateDisplay();
        this.drawCoin();
        this.showMessage('GAME RESET! BANK IS SAFE');
        
        // Reset UI state
        document.getElementById('choiceContainer').classList.remove('hidden');
        this.canvas.classList.remove('disabled', 'flipping');
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoinFlipGame();
});