const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function applySticker() {
  try {
    // Define paths
    const originalPath = path.join(process.cwd(), 'public', '/uploads/original/caa993ef-b83b-41ee-be55-3e7e56340eb8.jpeg');
    const stickerPath = path.join(process.cwd(), 'public', '/uploads/sticker.png');
    const stickeredDir = path.join(process.cwd(), 'public', '/uploads/stickered');
    const stickeredPath = path.join(stickeredDir, 'caa993ef-b83b-41ee-be55-3e7e56340eb8.jpeg');
    
    // Ensure stickered directory exists
    if (!fs.existsSync(stickeredDir)) {
      fs.mkdirSync(stickeredDir, { recursive: true });
    }
    
    // Load images
    console.log('Loading original image...');
    const image = await loadImage(originalPath);
    console.log('Loading sticker...');
    const sticker = await loadImage(stickerPath);
    
    // Create canvas
    console.log('Creating canvas...');
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw original image
    ctx.drawImage(image, 0, 0, image.width, image.height);
    
    // Calculate sticker dimensions and position
    const stickerSize = 0.2; // 20% of image width
    const stickerWidth = image.width * stickerSize;
    const stickerHeight = (sticker.height / sticker.width) * stickerWidth;
    const padding = image.width * 0.02; // 2% padding
    
    // Position at bottom right
    const x = image.width - stickerWidth - padding;
    const y = image.height - stickerHeight - padding;
    
    // Draw sticker
    console.log('Drawing sticker...');
    ctx.drawImage(sticker, x, y, stickerWidth, stickerHeight);
    
    // Save result
    console.log('Saving stickered image...');
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
    fs.writeFileSync(stickeredPath, buffer);
    
    console.log('Sticker applied successfully!');
    console.log(`Stickered image saved to: ${stickeredPath}`);
  } catch (error) {
    console.error('Error applying sticker:', error);
  }
}

applySticker();
