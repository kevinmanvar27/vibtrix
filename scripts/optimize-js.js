const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Only run in production build
if (process.env.NODE_ENV !== "production") {
  console.log("Skipping JS optimization in development mode");
  process.exit(0);
}

// Check if we should skip optimization (for debugging)
if (process.env.SKIP_JS_OPTIMIZATION === "true") {
  console.log("Skipping JS optimization due to SKIP_JS_OPTIMIZATION flag");
  process.exit(0);
}

console.log("Starting JavaScript optimization...");

try {
  // Install terser if not already installed
  try {
    require.resolve("terser");
    console.log("Terser is already installed");
  } catch (e) {
    console.log("Installing terser...");
    execSync("npm install --save-dev terser");
  }

  const terser = require("terser");

  // Function to recursively find all JS files in the .next directory
  function findJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip certain directories that might contain already optimized files
        if (!filePath.includes('chunks') && !filePath.includes('webpack')) {
          findJsFiles(filePath, fileList);
        }
      } else if (file.endsWith(".js") && !file.endsWith(".min.js")) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  // Get all JS files in the .next directory
  const jsFiles = findJsFiles(path.join(process.cwd(), ".next"));
  console.log(`Found ${jsFiles.length} JavaScript files to optimize`);

  // Minify each file
  let totalSaved = 0;
  let totalFiles = 0;

  // Create a backup directory
  const backupDir = path.join(process.cwd(), ".next-backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Process files sequentially to avoid async issues
  for (const filePath of jsFiles) {
    try {
      const code = fs.readFileSync(filePath, "utf8");
      const originalSize = Buffer.byteLength(code, "utf8");

      // Skip already minified files or files that are too small
      if (code.split("\n").length <= 3 || originalSize < 1000) {
        console.log(`Skipping already minified or small file: ${filePath}`);
        continue;
      }

      // Create a backup of the original file
      const relativePath = path.relative(path.join(process.cwd(), ".next"), filePath);
      const backupPath = path.join(backupDir, relativePath);
      const backupDirPath = path.dirname(backupPath);

      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }

      fs.writeFileSync(backupPath, code);

      // Use safer minification settings
      const result = await terser.minify(code, {
        compress: {
          ecma: 2020,
          passes: 1,
          keep_fnames: true,
          keep_classnames: true,
          // Disable advanced optimizations that might break code
          reduce_vars: false,
          collapse_vars: false
        },
        mangle: {
          keep_fnames: true,
          keep_classnames: true,
          // Disable property mangling which can cause issues
          properties: false
        },
        format: {
          ecma: 2020,
          comments: false,
        },
      });

      if (result.code) {
        const minifiedSize = Buffer.byteLength(result.code, "utf8");
        const saved = originalSize - minifiedSize;
        const percentage = ((saved / originalSize) * 100).toFixed(2);

        if (saved > 0) {
          fs.writeFileSync(filePath, result.code);
          totalSaved += saved;
          totalFiles++;
          console.log(
            `Optimized ${filePath}: Saved ${(saved / 1024).toFixed(2)} KB (${percentage}%)`,
          );
        } else {
          console.log(`No savings for ${filePath}, keeping original`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
      // If there's an error, try to restore from backup
      const relativePath = path.relative(path.join(process.cwd(), ".next"), filePath);
      const backupPath = path.join(backupDir, relativePath);
      if (fs.existsSync(backupPath)) {
        console.log(`Restoring ${filePath} from backup due to error`);
        fs.copyFileSync(backupPath, filePath);
      }
    }
  }

  console.log(`\nOptimization complete!`);
  console.log(`Optimized ${totalFiles} files`);
  console.log(`Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Backup of original files saved to ${backupDir}`);
} catch (error) {
  console.error("Error during JavaScript optimization:", error);
  process.exit(1);
}
