const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Only run in production build
if (process.env.NODE_ENV !== 'production') {
  console.log('Skipping image optimization in development mode');
  process.exit(0);
}

console.log('Starting image optimization...');

try {
  // Install sharp if not already installed
  try {
    require.resolve('sharp');
    console.log('Sharp is already installed');
  } catch (e) {
    console.log('Installing sharp...');
    execSync('npm install --save-dev sharp');
  }

  const sharp = require('sharp');

  // Function to recursively find all image files in the public directory
  function findImageFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        findImageFiles(filePath, fileList);
      } else if (/\.(jpe?g|png|gif)$/i.test(file)) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  // Get all image files in the public directory
  const imageFiles = findImageFiles(path.join(process.cwd(), 'public'));
  console.log(`Found ${imageFiles.length} image files to optimize`);

  // Optimize each image
  let totalSaved = 0;
  let totalFiles = 0;

  imageFiles.forEach(async (filePath) => {
    try {
      const originalSize = fs.statSync(filePath).size;
      const ext = path.extname(filePath).toLowerCase();
      
      // Skip already optimized images (check for .webp version)
      const webpPath = filePath.replace(ext, '.webp');
      if (fs.existsSync(webpPath)) {
        return;
      }

      // Process the image with sharp
      let sharpInstance = sharp(filePath);
      
      // Convert to WebP for better compression
      const outputBuffer = await sharpInstance
        .webp({ quality: 80 })
        .toBuffer();
      
      // Save the WebP version
      fs.writeFileSync(webpPath, outputBuffer);
      
      const newSize = outputBuffer.length;
      const saved = originalSize - newSize;
      const percentage = ((saved / originalSize) * 100).toFixed(2);
      
      if (saved > 0) {
        totalSaved += saved;
        totalFiles++;
        console.log(`Optimized ${filePath}: Saved ${(saved / 1024).toFixed(2)} KB (${percentage}%)`);
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  });

  console.log(`\nImage optimization complete!`);
  console.log(`Optimized ${totalFiles} files`);
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('Error during image optimization:', error);
  process.exit(1);
}
