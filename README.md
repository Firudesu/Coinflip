# Pixel Coin Flip Streak Game

A retro-style coin flipping game with streak tracking and score multipliers, featuring 16-bit pixel graphics and animations.

## How to Play

1. **Choose Your Side**: Click either "HEADS" or "TAILS" button to make your prediction
2. **Flip the Coin**: Click on the coin to flip it (50/50 random chance)
3. **Build Your Streak**: Guess correctly to build a winning streak
4. **Score Multiplier**: Each correct guess increases your multiplier by 0.1x
5. **Bank Your Score**: Click "BANK SCORE" to save your points before risking them
6. **Risk vs Reward**: If you lose, you lose ALL unbaked score and streak!
7. **Track Your Best**: The game saves your best streak and bank locally

## Features

- 🎮 Retro pixel-art style with 16-bit aesthetics
- 🪙 Animated coin flipping with 3D effect
- 🔥 Streak system with score multipliers
- 📊 Score tracking with best streak memory
- 🎨 Visual feedback for wins and losses
- 💾 Local storage for best streak persistence
- 📱 Responsive design for mobile and desktop

## Scoring System

- Base points per correct guess: 10 points
- Multiplier formula: 1.0 + (streak × 0.1)
- Example: 5 streak = 1.5x multiplier = 15 points per win

## How to Run

### Option 1: Direct File Opening
Simply open the `index.html` file in your web browser.

### Option 2: Using Python HTTP Server
```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

### Option 3: Using Node.js HTTP Server
```bash
npx http-server
# Then open http://localhost:8080 in your browser
```

## Files

- `index.html` - Main game structure
- `styles.css` - Pixel-art styling and animations
- `game.js` - Game logic and canvas rendering

## Browser Compatibility

Works on all modern browsers that support:
- HTML5 Canvas
- CSS3 Animations
- ES6 JavaScript
- Local Storage

## Controls

- **Mouse/Touch**: Click buttons and coin
- **Reset Button**: Start fresh (keeps best streak)

Enjoy the game! 🎮🪙