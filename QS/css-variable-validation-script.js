#!/usr/bin/env node
/**
 * CSS Variable Validation Script
 * 
 * This script validates that all CSS variables used in ECharts configs are properly defined.
 * It can be run as a pre-commit hook or in CI to prevent undefined CSS variables.
 */

const fs = require('fs');
const path = require('path');

// Function to find CSS variables in JS files
function extractCssVars(dir) {
  const files = fs.readdirSync(dir);
  let vars = new Set();
  let locationMap = {};
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively search directories
      const { vars: nestedVars, locationMap: nestedMap } = extractCssVars(filePath);
      for (const v of nestedVars) {
        vars.add(v);
      }
      // Merge location maps
      Object.assign(locationMap, nestedMap);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Process JS/TS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract CSS variables from content
      const regex = /var\(--([a-zA-Z0-9-_]+)(?:,\s*[^)]+)?\)/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        vars.add(varName);
        
        // Record the location where this variable is used
        if (!locationMap[varName]) {
          locationMap[varName] = [];
        }
        locationMap[varName].push(filePath);
      }
    }
  });
  
  return { vars, locationMap };
}

// Function to extract CSS variable definitions from CSS files
function extractCssVarDefinitions(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = new Set();
    const valueMap = {};
    
    // Match CSS variable definitions
    const regex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1];
      const value = match[2].trim();
      vars.add(varName);
      valueMap[varName] = value;
    }
    
    return { vars, valueMap };
  } catch (error) {
    console.error(`Error reading CSS file: ${error.message}`);
    return { vars: new Set(), valueMap: {} };
  }
}

// Function to check if fallbacks are present
function checkFallbacks(dir) {
  const files = fs.readdirSync(dir);
  const missingFallbacks = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively search directories
      missingFallbacks.push(...checkFallbacks(filePath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Process JS/TS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Find CSS variables without fallbacks
      const regex = /var\(--([a-zA-Z0-9-_]+)\)(?!,)/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        missingFallbacks.push({
          file: filePath,
          variable: varName,
          context: content.substring(Math.max(0, match.index - 40), match.index + match[0].length + 40)
        });
      }
    }
  });
  
  return missingFallbacks;
}

// Main execution
console.log('=== CSS Variables Validation ===');

// 1. Extract variables used in components
const componentsDir = path.join(__dirname, './QStrike/ui.bak.black/src/components');
const { vars: varsUsed, locationMap } = extractCssVars(componentsDir);

// 2. Extract variable definitions from theme.css
const themeCssPath = path.join(__dirname, './QStrike/ui.bak.black/src/theme.css');
const { vars: varsDefined, valueMap } = extractCssVarDefinitions(themeCssPath);

// 3. Find any variables that are used but not defined
const missingVars = [...varsUsed].filter(v => !varsDefined.has(v));

console.log(`Total CSS variables used: ${varsUsed.size}`);
console.log(`Total CSS variables defined: ${varsDefined.size}`);

if (missingVars.length > 0) {
  console.error('\n❌ ERROR: The following CSS variables are used but not defined:');
  missingVars.forEach(v => {
    console.error(`  - --${v} (used in: ${locationMap[v].map(p => path.basename(p)).join(', ')})`);
  });
  console.error('\nPlease define these variables in theme.css');
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: All CSS variables are properly defined!');
  
  // Check for fallbacks
  const missingFallbacks = checkFallbacks(componentsDir);
  
  if (missingFallbacks.length > 0) {
    console.warn('\n⚠️ WARNING: The following CSS variables do not have fallbacks:');
    missingFallbacks.forEach(item => {
      console.warn(`  - ${path.basename(item.file)}: var(--${item.variable})`);
    });
    console.warn('\nConsider adding fallbacks for better resilience.');
  } else {
    console.log('✅ All CSS variables have fallbacks defined!');
  }
  
  // Check for unused variables
  const unusedVars = [...varsDefined].filter(v => !varsUsed.has(v));
  if (unusedVars.length > 0) {
    console.log('\nNote: The following CSS variables are defined but not used in ECharts configs:');
    unusedVars.forEach(v => console.log(`  - --${v}: ${valueMap[v]}`));
  }
  
  process.exit(0);
}