const fs = require('fs');
const path = require('path');

// Load the previously extracted variables
const extractedVars = fs
  .readFileSync('css-variables-used.txt', 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

// Variables that we identified as defined in the codebase
const definedVars = [
  '--text-secondary',
  '--accent-cyan',
  '--accent-pink',
  '--text-primary',
  '--accent-violet',
  '--accent-primary',
  '--accent-secondary',
  '--accent-tertiary',
  '--bg-0',
  '--bg-1'
];

// Find missing variables
const missingVars = extractedVars.filter(variable => !definedVars.includes(variable));

console.log('\n--- CSS Variable Validation Results ---');
console.log(`Total variables used: ${extractedVars.length}`);
console.log(`Variables defined: ${definedVars.length}`);
console.log(`Variables missing: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log('\nMissing variables:');
  missingVars.forEach(v => console.log(` - ${v}`));
  
  // Suggest values for missing variables
  console.log('\nSuggested CSS definitions:');
  console.log(':root {');
  console.log('  /* Existing variables */');
  definedVars.forEach(v => {
    let value = '';
    if (v === '--text-secondary') value = '#A0A0A0';
    else if (v === '--accent-cyan') value = '#00F6FF';
    else if (v === '--accent-pink') value = '#FF007F';
    else if (v === '--text-primary') value = '#E0E0E0';
    else if (v === '--accent-violet') value = '#8C46FF';
    else if (v === '--bg-0') value = '#080A17';
    else if (v === '--bg-1') value = '#10131f';
    else value = 'VALUE_ALREADY_DEFINED';
    
    console.log(`  ${v}: ${value};`);
  });
  
  console.log('\n  /* Missing variables with suggested values */');
  missingVars.forEach(v => {
    let value = '';
    if (v === '--border-color') value = '#1A1A25';
    else if (v === '--packet-trace') value = '#00FFAA';
    else if (v === '--threat-green') value = '#00E676';
    else if (v === '--threat-yellow') value = '#FFEB3B';
    else if (v === '--threat-red') value = '#FF5252';
    else if (v === '--threat-orange') value = '#FF9800';
    else if (v === '--cb-green') value = '#4CAF50';
    else value = '#FFFFFF /* Placeholder */';
    
    console.log(`  ${v}: ${value};`);
  });
  console.log('}');
  
  // Suggest ECharts fallbacks
  console.log('\nSuggested ECharts fallbacks:');
  missingVars.forEach(v => {
    let value = '';
    if (v === '--border-color') value = '#1A1A25';
    else if (v === '--packet-trace') value = '#00FFAA';
    else if (v === '--threat-green') value = '#00E676';
    else if (v === '--threat-yellow') value = '#FFEB3B';
    else if (v === '--threat-red') value = '#FF5252';
    else if (v === '--threat-orange') value = '#FF9800';
    else if (v === '--cb-green') value = '#4CAF50';
    else value = '#FFFFFF';
    
    console.log(`For ${v}, use: var(${v}, ${value})`);
  });
  
  process.exit(1); // Exit with error if missing variables
} else {
  console.log('\nAll CSS variables are properly defined.');
  process.exit(0);
}