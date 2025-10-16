# Tavern Background Image Setup

## Quick Setup

1. **Place your tavern image** in the root directory of this project (same folder as `index.html`)

2. **Name your image file** one of the following:
   - `tavern.jpg` (default - no changes needed)
   - `tavern.png`
   - `tavern.webp`
   - `tavern.gif`

3. **If using a different filename or extension**, update line 12 in `styles.css`:
   ```css
   background-image: url('your-tavern-filename.extension'), linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```

## Image Recommendations

- **Minimum Resolution**: 1920x1080 pixels for desktop
- **Aspect Ratio**: 16:9 works best, but any ratio will work
- **File Size**: Keep under 2MB for fast loading
- **Style**: Dark or muted colors work best with the game's UI

## How It Works

The tavern image is set as a fixed background that:
- **Covers the entire screen** on all devices
- **Stays in place** while scrolling
- **Has a dark overlay** to ensure game text remains readable
- **Scales responsively** for different screen sizes
- **Falls back to a gradient** if the image fails to load

## Responsive Behavior

- **Desktop (>1920px)**: Full coverage, centered
- **Laptop (1366px)**: Full coverage, optimized positioning
- **Tablet (768px)**: Darker overlay for better readability
- **Mobile (<600px)**: Maximum overlay darkness for text clarity
- **Portrait Mode**: Optimized for vertical screens
- **Landscape Mode**: Optimized for horizontal screens

## Customization Options

### Adjust Overlay Darkness
In `styles.css`, find the `body::before` rule and change the opacity:
```css
background: rgba(0, 0, 0, 0.4); /* 0.4 = 40% darkness, adjust 0-1 */
```

### Change Background Position
In `styles.css`, modify the `background-position`:
```css
background-position: center; /* Options: top, bottom, left, right, center */
```

### Disable Blur Effect
To remove the blur behind the game container, in `styles.css`:
```css
/* Comment out or remove these lines */
backdrop-filter: blur(5px);
-webkit-backdrop-filter: blur(5px);
```

## Troubleshooting

**Image not showing?**
- Check the filename matches exactly (case-sensitive)
- Ensure the image is in the root directory
- Verify the file extension in styles.css

**Image looks stretched?**
- The CSS uses `background-size: cover` which may crop edges but maintains aspect ratio
- Try `background-size: contain` in styles.css if you prefer to see the full image

**Text hard to read?**
- Increase the overlay darkness in `body::before`
- Increase the game container opacity in `.game-container`