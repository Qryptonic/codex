const fs = require('fs');
const path = require('path');

// Function to find CSS variables in ECharts configs
function findCSSVars(dir) {
  const files = fs.readdirSync(dir);
  let vars = new Set();
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Recursively search directories
      const nestedVars = findCSSVars(filePath);
      for (const v of nestedVars) {
        vars.add(v);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Process JS/TS files
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract CSS variables from content
      const regex = /var\(--([a-zA-Z0-9-_]+)(?:,\s*[^)]+)?\)/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        vars.add(varName);
        console.log(`Found variable --${varName} in ${filePath}`);
      }
    }
  });
  
  return vars;
}

// Find all CSS variables in the components directory
const componentDir = './QStrike/ui.bak.black/src/components';
const result = findCSSVars(componentDir);

// Output the results
console.log('\n--- CSS Variables Used in ECharts Configs ---');
console.log([...result].map(v => `--${v}`).join('\n'));
console.log(`\nTotal unique CSS variables found: ${result.size}`);

// Save results to a file
fs.writeFileSync('css-variables-used.txt', [...result].map(v => `--${v}`).join('\n'));
console.log('\nResults saved to css-variables-used.txt');