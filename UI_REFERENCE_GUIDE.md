# 🎮 COIN FLIP GAME - UI ELEMENT REFERENCE GUIDE

This guide provides all element names, sizes, locations, and descriptions for creating graphical assets.

## 📋 **COMMUNICATION SYSTEM**
When you want to change/create graphics, use these exact names:
- **Element Name**: The CSS class or ID name
- **Display Name**: What it shows to the user
- **Location**: Where it appears in the UI
- **Current State**: Text/emoji/canvas/image

---

## 🏠 **MAIN GAME SCREEN ELEMENTS**

### **Container & Background**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `game-container` | Main Game Area | 600px max-width | Center screen | Semi-transparent dark background |
| `table-image` | Table Background | 100% container | Behind all elements | PNG image (tabel.png) |
| `village-image` | Village Scene | 113% width on mobile | Top background | PNG image (village.png) |
| `game-title` | Game Logo | 43% width on mobile | Top center | PNG image (title.png) |

### **Player Information**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `player-title` | Player Rank | Font 12px | Top of game area | Text: "NOVICE", "COIN GOD", etc. |
| `player-name` | Player Name | Font 12px | Next to title | Text: "PLAYER" |

### **Statistics Display**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `stats-container` | Stats Grid | 2x2 grid, 15px gap | Below player info | Container for stat boxes |
| `stat-box` | Individual Stat | Padding 15px | In stats grid | Dark background with border |
| `stat-label` | Stat Name | Font 8px | Top of stat box | Text: "SCORE", "STREAK", etc. |
| `stat-value` | Stat Number | Font 16px, bold | Bottom of stat box | Numbers with color coding |

### **Banking System**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `bank-container` | Bank Area | Full width | Below stats | Container for bank elements |
| `bank-display` | Bank Info | Inline flex | Left side | Shows bank icon and amount |
| `bank-icon` | Bank Symbol | Font size 16px | In bank display | Emoji: 🏦 |
| `bank-label` | Bank Text | Font 10px | In bank display | Text: "BANK" |
| `bank-value` | Bank Amount | Font 14px | In bank display | Number with glow effect |
| `bank-btn` | Bank Button | Padding 15px 25px | Right side | Button with current score |

### **Main Coin Area**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `coin-container` | Coin Area | 200px x 220px | Center of game | Container for coin |
| `coinCanvas` | The Coin | 200px x 200px | Center of container | Canvas-drawn 3D coin |
| `coin-shadow` | Coin Shadow | Dynamic | Below coin | Canvas-drawn shadow |

### **Choice Buttons**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `choice-container` | Button Area | Flex, 20px gap | Below coin | Container for choice buttons |
| `choice-btn` | Heads/Tails Button | Padding 15px 25px | In choice container | Pixel-style buttons |
| `btn-text` | Button Text | Font 12px | On buttons | Text: "HEADS", "TAILS" |

### **Messages & Results**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `message-container` | Message Area | Full width | Below choices | Container for game messages |
| `message` | Game Message | Font 10px | In message container | Dynamic text feedback |
| `result-display` | Win/Lose Result | Overlay style | Over game area | Shows "WIN!" or "LOSE!" |
| `resultText` | Result Text | Font 24px | In result display | Animated result text |

### **Action Buttons**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `reset-btn` | Reset Button | Padding 15px 25px | Below messages | Red pixel button |
| `button-row` | Button Row | Flex row | Bottom of game | Container for multiple buttons |
| `hall-btn` | Hall of Fame | Padding 15px 25px | In button row | Blue pixel button |
| `shop-main-btn` | Item Shop | Padding 15px 25px | In button row | Green pixel button |
| `workshop-btn` | Workshop | Padding 15px 25px | In button row | Orange pixel button |
| `share-btn` | Share Button | Padding 15px 25px | In button row | Purple pixel button |

---

## ⚔️ **BATTLE SYSTEM ELEMENTS**

### **Battle Modal**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `battleModal` | Battle Screen | Full screen overlay | Over main game | Modal with dark background |
| `battle-content` | Battle Area | Max 800px width | Center of modal | Main battle container |
| `battle-title` | Battle Header | Font 18px | Top of battle | Text: "COIN BATTLE ARENA" |

### **Skill Selection**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `skillSelectionSection` | Skill Picker | Full width | In battle modal | First phase of battle |
| `skills-grid` | Skill Grid | 2 columns, 15px gap | In skill section | Grid of 6 skills |
| `skill-option` | Skill Card | Padding 15px | In skills grid | Individual skill with description |
| `skill-name` | Skill Title | Font 10px | Top of skill card | Skill name in cyan |
| `skill-description` | Skill Info | Font 8px | In skill card | Skill effect description |

### **Battle Arena**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `battle-arena` | Battle Field | Flex layout | In battle phase | Player vs Opponent layout |
| `battle-participant` | Player/Opponent | Flex: 1 | Sides of arena | Player info and skills |
| `participant-icon` | Avatar | Font 24px | Top of participant | Emoji avatar |
| `participant-name` | Name | Font 10px | Below avatar | Player/opponent name |
| `participant-skills` | Skills List | 60px min height | Below name | Active skills/effects |
| `streak-value` | Streak Count | Font 16px | Bottom | Current streak number |

### **Battle Center**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `battle-center` | Center Area | 200px width | Middle of arena | VS symbol and coin |
| `vs-symbol` | VS Text | Font 18px | Top of center | Text: "VS" in red |
| `battleCoinCanvas` | Battle Coin | 120px x 120px | Center | Smaller battle coin |
| `battle-controls` | Battle Buttons | Below coin | In center area | Heads/Tails for battle |
| `battle-choice` | Battle Button | Padding 10px 15px | In controls | Smaller battle buttons |

---

## 🛍️ **SHOP & INVENTORY ELEMENTS**

### **Shop Modal**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `shopModal` | Shop Screen | Full screen overlay | Over main game | Item shop interface |
| `shop-content` | Shop Area | Max width | Center of modal | Main shop container |
| `shop-title` | Shop Header | Font 16px | Top of shop | Text: "TACTICAL ITEM SHOP" |
| `inventory-slots` | Inventory | 2 slots | Top of shop | Player's current items |
| `inventory-slot` | Item Slot | Square boxes | In inventory | Individual item containers |
| `shop-items` | Shop Grid | Dynamic grid | Main shop area | Available items for purchase |

### **Floating Buttons**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `floatingShopBtn` | Shop Alert | Padding 15px 25px | Fixed position | Appears when shop opens |
| `floatingBattleBtn` | Battle Alert | Padding 15px 25px | Fixed position | Appears when battle ready |

---

## 🎨 **VISUAL EFFECTS & OVERLAYS**

### **Announcements**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `streakAnnouncement` | Streak Alert | Full width overlay | Over game | Big streak announcements |
| `announcementText` | Alert Text | Font 20px | In announcement | Dynamic streak messages |

### **Celebration Effects**
| Element Name | Display Name | Size | Location | Current State |
|--------------|--------------|------|----------|---------------|
| `celebrationOverlay` | Victory Screen | Full screen | Over everything | Epic win celebrations |
| `fireworksCanvas` | Fireworks | Full screen | In celebration | Animated fireworks |
| `epicFailOverlay` | Defeat Screen | Full screen | Over everything | Epic loss effects |

---

## 📏 **STANDARD SIZES & MEASUREMENTS**

### **Button Specifications**
- **Standard Button**: `padding: 15px 25px`, `font-size: 12px`
- **Small Button**: `padding: 10px 15px`, `font-size: 10px`
- **Large Button**: `padding: 20px 30px`, `font-size: 14px`

### **Font Sizes**
- **Tiny Text**: `8px` (descriptions, labels)
- **Small Text**: `10px` (UI text, messages)
- **Normal Text**: `12px` (buttons, titles)
- **Large Text**: `16px` (values, important info)
- **Huge Text**: `20px+` (announcements, results)

### **Color Scheme**
- **Primary**: `#4ecdc4` (cyan/teal)
- **Secondary**: `#ff6b6b` (red/pink)
- **Success**: `#4ecdc4` (same as primary)
- **Warning**: `#ffeb3b` (yellow)
- **Error**: `#ff6b6b` (red)
- **Background**: `#2a2a2a` (dark gray)
- **Text**: `#ffffff` (white)

### **Container Sizes**
- **Game Container**: `max-width: 600px`
- **Modal Content**: `max-width: 800px`
- **Coin Canvas**: `200px x 200px`
- **Battle Coin**: `120px x 120px`
- **Stat Boxes**: `padding: 15px`

---

## 🗣️ **HOW TO COMMUNICATE CHANGES**

### **Examples of Clear Communication:**

✅ **GOOD**: "Change the `coin-canvas` to use a sprite image instead of canvas drawing"
✅ **GOOD**: "Make the `choice-btn` buttons use custom button graphics"
✅ **GOOD**: "Replace the `bank-icon` emoji with a custom bank icon image"
✅ **GOOD**: "Add a background image to the `stat-box` elements"

❌ **UNCLEAR**: "Change the coin"
❌ **UNCLEAR**: "Make the buttons look better"
❌ **UNCLEAR**: "Add graphics to the game"

### **When Requesting Changes:**
1. **Use the exact element name** from this guide
2. **Specify the type of change** (replace with image, add background, change style, etc.)
3. **Mention the size/dimensions** if creating new graphics
4. **Describe the visual style** you want (pixel art, realistic, cartoon, etc.)

### **Current Asset Files:**
- `tabel.png` - Table background image
- `village.png` - Village background scene  
- `title.png` - Game title logo
- All other elements are currently CSS/text/canvas based

---

This reference guide ensures we can communicate precisely about any UI element changes or graphic creation needs!