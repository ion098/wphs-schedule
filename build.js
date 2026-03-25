#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { minifyHTMLLiterals, defaultMinifyOptions } from 'minify-html-literals';
import { compiler } from 'google-closure-compiler';
import minifyHTML from 'html-minifier-next';

async function main() {
  try {
    console.log('Starting build...\n');

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
    const mainTmpFile = join(tmpdir(), `main-src-${Date.now()}.js`);
    const mainOutFile = join(tmpdir(), `main-out-${Date.now()}.js`);
    writeFileSync(mainTmpFile, mainJsSource);
    
    await compileWithClosureCompiler(mainTmpFile, mainOutFile, null);
    const mainCompiled = readFileSync(mainOutFile, 'utf-8');
    writeFileSync('script/main.js', mainCompiled);
    console.log('✓ main.js compiled\n');

    // Step 3: Compile service_worker.js with externs
    console.log('Compiling service_worker.js with Google Closure Compiler...');
    const serviceWorkerSource = readFileSync('service_worker.js', 'utf-8');
    const externsFile = join(tmpdir(), `externs-${Date.now()}.js`);
    const swTmpFile = join(tmpdir(), `sw-src-${Date.now()}.js`);
    const swOutFile = join(tmpdir(), `sw-out-${Date.now()}.js`);
    
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
    process.exit(0);
  } catch (error) {
    console.error('✗ Build failed:', error.message);
    process.exit(1);
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
      // exitCode 0 = success, 1 = warnings (which we can ignore with warning_level: quiet)
      if (exitCode <= 1) {
        resolve();
      } else {
        reject(new Error(`Compilation failed: ${stderr || stdout}`));
      }
    });
  });
}

main();