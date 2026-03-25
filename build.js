#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { minifyHTMLLiterals, defaultMinifyOptions } from 'minify-html-literals';
import { compiler } from 'google-closure-compiler';
import minifyHTML from 'html-minifier-next';

async function main() {
  const tempFilesToCleanup = [];
  
  try {
    console.log('Starting build...\n');

    // Check if Java is available; install via direct download if not
    try {
      execSync('java -version', { stdio: 'pipe', timeout: 5000 });
    } catch (e) {
      console.log('Java not found. Downloading and installing OpenJDK 17...');
      try {
        const javaUrl = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.1+12/OpenJDK17U-jre_x64_linux_hotspot_17.0.1_12.tar.gz';
        const javaPath = join(tmpdir(), 'java.tar.gz');
        execSync(`curl -L --output ${javaPath} ${javaUrl}`, { stdio: 'inherit', timeout: 120000 });
        execSync(`tar -xzf ${javaPath} -C /usr/local/`, { stdio: 'inherit' });
        execSync(`ln -sf /usr/local/jdk-17.0.1+12/bin/java /usr/local/bin/java`, { stdio: 'inherit' });
        console.log('Java installed successfully.\n');
      } catch (err) {
        throw new Error('Failed to download and install Java. Check network access and disk space.');
      }
    }

    // Step 1: Minify HTML literals in main.js
    console.log('Minifying HTML literals in main.js...');
    let mainJsSource = readFileSync('script/main.js', 'utf-8');
    
    try {
      const minified = minifyHTMLLiterals(mainJsSource, {
        fileName: 'script/main.js',
        minifyOptions: {
          ...defaultMinifyOptions,
          minifyCSS: false
        },
        shouldMinifyCSS: () => false
      });
      
      // Only use minified version if result is valid
      if (minified && minified.length > 0) {
        mainJsSource = minified;
        console.log('✓ HTML literals minified\n');
      } else {
        console.log('⚠ No HTML literals found, using original source\n');
      }
    } catch (error) {
      console.log(`⚠ HTML literals minification skipped: ${error.message}\n`);
    }

    // Step 2: Compile main.js with Google Closure Compiler
    console.log('Compiling main.js with Google Closure Compiler...');
    const mainTmpFile = join(tmpdir(), `main-src-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    const mainOutFile = join(tmpdir(), `main-out-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    tempFilesToCleanup.push(mainTmpFile, mainOutFile);
    
    writeFileSync(mainTmpFile, mainJsSource);
    await compileWithClosureCompiler(mainTmpFile, mainOutFile, null);
    const mainCompiled = readFileSync(mainOutFile, 'utf-8');
    writeFileSync('script/main.js', mainCompiled);
    console.log('✓ main.js compiled\n');

    // Step 3: Compile service_worker.js with externs
    console.log('Compiling service_worker.js with Google Closure Compiler...');
    const serviceWorkerSource = readFileSync('service_worker.js', 'utf-8');
    const externsFile = join(tmpdir(), `externs-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    const swTmpFile = join(tmpdir(), `sw-src-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    const swOutFile = join(tmpdir(), `sw-out-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    tempFilesToCleanup.push(externsFile, swTmpFile, swOutFile);
    
    const externs = `/**
 * @type {CacheStorage}
 */
var caches;
`;
    writeFileSync(externsFile, externs);
    writeFileSync(swTmpFile, serviceWorkerSource);

    await compileWithClosureCompiler(swTmpFile, swOutFile, externsFile);
    const serviceWorkerCompiled = readFileSync(swOutFile, 'utf-8');
    writeFileSync('service_worker.js', serviceWorkerCompiled);
    console.log('✓ service_worker.js compiled\n');

    // Step 4: Minify index.html
    console.log('Minifying index.html...');
    const htmlContent = readFileSync('index.html', 'utf-8');
    const minifiedHtml = await minifyHTML.minify(htmlContent, {
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true
    });
    writeFileSync('index.html', minifiedHtml);
    console.log('✓ index.html minified\n');

    console.log('✓ Build completed successfully!');
  } catch (error) {
    console.error('✗ Build failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up temporary files
    tempFilesToCleanup.forEach(file => {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch (e) {
        // Silently ignore cleanup errors
      }
    });
  }
}

function compileWithClosureCompiler(inputFile, outputFile, externsFile = null) {
  return new Promise((resolve, reject) => {
    const options = {
      js: inputFile,
      js_output_file: outputFile,
      compilation_level: 'ADVANCED',
      warning_level: 'quiet'
    };

    if (externsFile) {
      options.externs = externsFile;
    }

    const c = new compiler(options);
    c.run((exitCode, stdout, stderr) => {
      // Log compiler output for debugging
      if (stdout && stdout.trim()) console.log('Compiler output:', stdout);
      if (stderr && stderr.trim()) console.error('Compiler errors:', stderr);
      
      // exitCode 0 = success, 1 = warnings (which we can ignore with warning_level: quiet)
      if (exitCode <= 1) {
        // Verify output file was actually created
        if (!existsSync(outputFile)) {
          reject(new Error(`Compilation succeeded (exit code ${exitCode}) but output file was not created at ${outputFile}. Check compiler errors above.`));
        } else {
          resolve();
        }
      } else {
        reject(new Error(`Compilation failed with exit code ${exitCode}. ${stderr || stdout || 'No error details available.'}`));
      }
    });
  });
}

main();