const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Only run in production build
if (process.env.NODE_ENV !== 'production') {
  console.log('Skipping media optimization in development mode');
  process.exit(0);
}

console.log('Starting media optimization...');

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

  // Function to recursively find all image and video files in the public directory
  function findMediaFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        findMediaFiles(filePath, fileList);
      } else if (/\.(jpe?g|png|gif|webp)$/i.test(file)) {
        fileList.push({ path: filePath, type: 'image' });
      } else if (/\.(mp4|webm|mov)$/i.test(file)) {
        fileList.push({ path: filePath, type: 'video' });
      }
    });

    return fileList;
  }

  // Get all media files in the public directory
  const mediaFiles = findMediaFiles(path.join(process.cwd(), 'public'));
  console.log(`Found ${mediaFiles.length} media files to optimize`);

  // Optimize each file
  let totalSaved = 0;
  let totalFiles = 0;

  // Process images
  const imageFiles = mediaFiles.filter(file => file.type === 'image');
  console.log(`Processing ${imageFiles.length} image files...`);

  imageFiles.forEach(async (file) => {
    try {
      const filePath = file.path;
      const originalSize = fs.statSync(filePath).size;
      const ext = path.extname(filePath).toLowerCase();
      
      // Skip already optimized images (check for .webp version)
      const webpPath = filePath.replace(ext, '.webp');
      if (fs.existsSync(webpPath) && ext !== '.webp') {
        return;
      }

      // Process the image with sharp
      let sharpInstance = sharp(filePath);
      
      // Resize large images
      const metadata = await sharpInstance.metadata();
      if (metadata.width > 1920 || metadata.height > 1920) {
        sharpInstance = sharpInstance.resize({
          width: Math.min(metadata.width, 1920),
          height: Math.min(metadata.height, 1920),
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert to WebP for better compression
      const outputBuffer = await sharpInstance
        .webp({ quality: 80 })
        .toBuffer();
      
      // Save the WebP version if it doesn't already exist
      if (ext !== '.webp') {
        fs.writeFileSync(webpPath, outputBuffer);
      }
      
      // Also optimize the original format
      let optimizedBuffer;
      if (ext === '.jpg' || ext === '.jpeg') {
        optimizedBuffer = await sharpInstance.jpeg({ quality: 85, progressive: true }).toBuffer();
      } else if (ext === '.png') {
        optimizedBuffer = await sharpInstance.png({ compressionLevel: 9, progressive: true }).toBuffer();
      } else if (ext === '.webp') {
        optimizedBuffer = outputBuffer; // Already optimized above
      } else if (ext === '.gif') {
        // GIFs are kept as is, just convert to WebP
        optimizedBuffer = null;
      }
      
      // Save the optimized original if we have one
      if (optimizedBuffer) {
        fs.writeFileSync(filePath, optimizedBuffer);
        
        const newSize = optimizedBuffer.length;
        const saved = originalSize - newSize;
        const percentage = ((saved / originalSize) * 100).toFixed(2);
        
        if (saved > 0) {
          totalSaved += saved;
          totalFiles++;
          console.log(`Optimized ${filePath}: Saved ${(saved / 1024).toFixed(2)} KB (${percentage}%)`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${file.path}:`, err.message);
    }
  });

  // Process videos (using ffmpeg if available)
  const videoFiles = mediaFiles.filter(file => file.type === 'video');
  console.log(`Processing ${videoFiles.length} video files...`);

  try {
    // Check if ffmpeg is installed
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('FFmpeg is available, optimizing videos...');
    
    videoFiles.forEach(file => {
      try {
        const filePath = file.path;
        const originalSize = fs.statSync(filePath).size;
        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath);
        const baseName = path.basename(filePath, ext);
        const outputPath = path.join(dir, `${baseName}_optimized${ext}`);
        
        // Skip already optimized videos
        if (fs.existsSync(outputPath)) {
          return;
        }
        
        // Optimize video using ffmpeg
        execSync(`ffmpeg -i "${filePath}" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "${outputPath}"`, { stdio: 'ignore' });
        
        // Check if optimization was successful
        if (fs.existsSync(outputPath)) {
          const newSize = fs.statSync(outputPath).size;
          const saved = originalSize - newSize;
          const percentage = ((saved / originalSize) * 100).toFixed(2);
          
          if (saved > 0) {
            // Replace original with optimized version
            fs.unlinkSync(filePath);
            fs.renameSync(outputPath, filePath);
            
            totalSaved += saved;
            totalFiles++;
            console.log(`Optimized ${filePath}: Saved ${(saved / 1024).toFixed(2)} KB (${percentage}%)`);
          } else {
            // If no savings, remove the optimized version
            fs.unlinkSync(outputPath);
          }
        }
      } catch (err) {
        console.error(`Error processing video ${file.path}:`, err.message);
      }
    });
  } catch (e) {
    console.log('FFmpeg not available, skipping video optimization');
  }

  console.log(`\nMedia optimization complete!`);
  console.log(`Optimized ${totalFiles} files`);
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('Error during media optimization:', error);
  process.exit(1);
}
