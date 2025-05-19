const fs = require('fs');
const path = require('path');

// Define missing variables and their fallbacks
const cssVarFallbacks = {
  '--text-primary': '#E0E0E0',
  '--text-secondary': '#A0A0A0',
  '--accent-cyan': '#00F6FF',
  '--accent-pink': '#FF007F',
  '--accent-violet': '#8C46FF',
  '--border-color': '#1A1A25',
  '--packet-trace': '#00FFAA',
  '--threat-green': '#00E676',
  '--threat-yellow': '#FFEB3B',
  '--threat-red': '#FF5252',
  '--threat-orange': '#FF9800',
  '--cb-green': '#4CAF50'
};

// Function to process a file and add fallbacks to CSS variables
function addFallbacksToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacements = 0;
    let modified = false;

    // Find all CSS variable usages without fallbacks
    for (const [varName, fallback] of Object.entries(cssVarFallbacks)) {
      // Regex to match CSS variable without a fallback
      const regex = new RegExp(`var\\(${varName}\\)`, 'g');
      
      // Replacement with fallback
      const replacement = `var(${varName}, ${fallback})`;
      
      // Check if replacements would be made
      if (content.match(regex)) {
        modified = true;
        replacements += (content.match(regex) || []).length;
        
        // Perform the replacement
        content = content.replace(regex, replacement);
      }
    }

    if (modified) {
      // Save the modified file
      fs.writeFileSync(filePath, content);
      console.log(`[UPDATED] ${filePath} - Added ${replacements} fallbacks`);
      return true;
    } else {
      console.log(`[SKIPPED] ${filePath} - No replacements needed`);
      return false;
    }
  } catch (error) {
    console.error(`[ERROR] Failed to process ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to recursively process all JS files in a directory
function processDirectory(dir) {
  let updatedFiles = 0;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Recurse into subdirectories
      updatedFiles += processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // Process JavaScript files
      if (addFallbacksToFile(filePath)) {
        updatedFiles++;
      }
    }
  });
  
  return updatedFiles;
}

// Main execution
console.log('Adding CSS variable fallbacks to ECharts configs...');
const componentsDir = './QStrike/ui.bak.black/src/components';
const totalUpdated = processDirectory(componentsDir);
console.log(`\nCompleted! ${totalUpdated} files were updated.`);

// Now create the theme.css file with all variables defined
console.log('\nCreating theme.css file with all CSS variables...');

const themeContent = `:root {
  /* Background colors */
  --bg-0: #080A17;
  --bg-1: #10131f;
  
  /* Text colors */
  --text-primary: #E0E0E0;
  --text-secondary: #A0A0A0;
  
  /* Accent colors */
  --accent-cyan: #00F6FF;
  --accent-pink: #FF007F;
  --accent-violet: #8C46FF;
  
  /* Provider theme variables - set dynamically */
  --accent-primary: var(--accent-cyan);
  --accent-secondary: var(--accent-violet);
  --accent-tertiary: #001141;
  
  /* Border colors */
  --border-color: #1A1A25;
  
  /* Visualization colors */
  --packet-trace: #00FFAA;
  
  /* Threat indicators */
  --threat-green: #00E676;
  --threat-yellow: #FFEB3B;
  --threat-orange: #FF9800;
  --threat-red: #FF5252;
  
  /* Other indicators */
  --cb-green: #4CAF50;
}

/* Tailwind CSS compatibility classes */
.text-text-primary { color: var(--text-primary); }
.text-text-secondary { color: var(--text-secondary); }
.text-accent-cyan { color: var(--accent-cyan); }
.text-accent-pink { color: var(--accent-pink); }
.text-accent-violet { color: var(--accent-violet); }
.text-accent-primary { color: var(--accent-primary); }
.bg-bg-0 { background-color: var(--bg-0); }
.bg-bg-1 { background-color: var(--bg-1); }
.border-border-color { border-color: var(--border-color); }
`;

fs.writeFileSync('./QStrike/ui.bak.black/src/theme.css', themeContent);
console.log('theme.css file created successfully!');

// Create validation script
console.log('\nCreating CSS validation script...');
const validationScript = `
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Function to find CSS variables in JS files
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
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Process JS/TS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract CSS variables from content
      const regex = /var\\(--([a-zA-Z0-9-_]+)(?:,\\s*[^)]+)?\\)/g;
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
    const regex = /--([a-zA-Z0-9-_]+)\\s*:/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    
    return vars;
  } catch (error) {
    console.error(\`Error reading CSS file: \${error.message}\`);
    return new Set();
  }
}

// Main execution
console.log('Validating CSS variables...');

// 1. Extract variables used in components
const componentsDir = path.join(__dirname, './src/components');
const varsUsed = extractCssVars(componentsDir);

// 2. Extract variable definitions from theme.css
const themeCssPath = path.join(__dirname, './src/theme.css');
const varsDefined = extractCssVarDefinitions(themeCssPath);

// 3. Find any variables that are used but not defined
const missingVars = [...varsUsed].filter(v => !varsDefined.has(v));

if (missingVars.length > 0) {
  console.error('❌ ERROR: The following CSS variables are used but not defined:');
  missingVars.forEach(v => console.error(\` - --\${v}\`));
  console.error('Please define these variables in theme.css');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: All CSS variables are properly defined!');
  
  // Optionally check for unused variables
  const unusedVars = [...varsDefined].filter(v => !varsUsed.has(v));
  if (unusedVars.length > 0) {
    console.log('\\nNote: The following CSS variables are defined but not used:');
    unusedVars.forEach(v => console.log(\` - --\${v}\`));
  }
  
  process.exit(0);
}
`;

fs.writeFileSync('./QStrike/ui.bak.black/validate-css-vars.js', validationScript);
console.log('validate-css-vars.js script created successfully!');
console.log('\nValidation script can be run with: node ./validate-css-vars.js');