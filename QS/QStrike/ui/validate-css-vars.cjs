#!/usr/bin/env node
/**
 * CSS Variable Validation Script
 * 
 * This script validates that all CSS variables used in the application
 * are properly defined in the theme-variables.css file.
 */

const fs = require('fs');
const path = require('path');

// Function to find CSS variables in JS/TS/JSX/TSX files
function extractCssVars(dir) {
  const files = fs.readdirSync(dir);
  let vars = new Set();
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively search directories
      const nestedVars = extractCssVars(filePath);
      for (const v of nestedVars) {
        vars.add(v);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || 
               file.endsWith('.ts') || file.endsWith('.tsx') || 
               file.endsWith('.css')) {
      // Process JS/TS/CSS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract CSS variables from content
      const regex = /var\(--([a-zA-Z0-9-_]+)(?:,\s*[^)]+)?\)/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        vars.add(varName);
      }
    }
  });
  
  return vars;
}

// Function to extract CSS variable definitions from CSS files
function extractCssVarDefinitions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = new Set();
    
    // Match CSS variable definitions
    const regex = /--([a-zA-Z0-9-_]+)\s*:/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    
    return vars;
  } catch (error) {
    console.error(`Error reading CSS file: ${error.message}`);
    return new Set();
  }
}

// Main execution
console.log('Validating CSS variables...');

// 1. Extract variables used in components and other source files
const srcDir = path.join(__dirname, './src');
const varsUsed = extractCssVars(srcDir);

// 2. Extract variable definitions from theme-variables.css
const themeCssPath = path.join(__dirname, './src/css/theme-variables.css');
const varsDefined = extractCssVarDefinitions(themeCssPath);

// 3. Find any variables that are used but not defined
const missingVars = [...varsUsed].filter(v => !varsDefined.has(v));

if (missingVars.length > 0) {
  console.error('❌ ERROR: The following CSS variables are used but not defined:');
  missingVars.forEach(v => console.error(` - --${v}`));
  console.error('Please define these variables in theme-variables.css');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: All CSS variables are properly defined!');
  
  // Optionally check for unused variables
  const unusedVars = [...varsDefined].filter(v => !varsUsed.has(v));
  if (unusedVars.length > 0) {
    console.log('\nNote: The following CSS variables are defined but not used:');
    unusedVars.forEach(v => console.log(` - --${v}`));
  }
  
  console.log(`\nTotal variables used: ${varsUsed.size}`);
  console.log(`Total variables defined: ${varsDefined.size}`);
  process.exit(0);
}