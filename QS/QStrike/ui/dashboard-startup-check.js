/**
 * QStrike Dashboard Startup Check
 * 
 * This script verifies that all dependencies and configurations
 * required for running the QStrike dashboard are correctly set up.
 */

const fs = require('fs');
const path = require('path');

console.log('Running QStrike Dashboard startup checks...');

// Define the required files and modules
const requiredFiles = [
  { path: 'src/components/QStrikeEnhancedDashboard.tsx', name: 'Enhanced Dashboard Component' },
  { path: 'src/components/DashboardStyles.css', name: 'Dashboard Styles' },
  { path: 'src/css/splunk-theme.css', name: 'Splunk Theme CSS' },
  { path: 'express-sse-server.js', name: 'SSE Server' },
  { path: 'start-dashboard.sh', name: 'Dashboard Startup Script' },
  { path: 'src/static-simulation-data.json', name: 'Simulation Data' }
];

// Check if all required files exist
let allFilesExist = true;
console.log('\nChecking required files:');

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✓' : '✗'} ${file.name} (${file.path})`);
  if (!exists) allFilesExist = false;
});

// Check if the dashboard component is imported in App.tsx
let appContent = '';
try {
  appContent = fs.readFileSync(path.join(__dirname, 'src/App.tsx'), 'utf8');
  const hasImport = appContent.includes('import { QStrikeEnhancedDashboard }');
  const hasComponent = appContent.includes('<QStrikeEnhancedDashboard');
  
  console.log('\nChecking App.tsx integration:');
  console.log(`${hasImport ? '✓' : '✗'} Dashboard component import`);
  console.log(`${hasComponent ? '✓' : '✗'} Dashboard component usage`);
  
  if (!hasImport || !hasComponent) allFilesExist = false;
} catch (err) {
  console.log('\n✗ Could not read App.tsx');
  allFilesExist = false;
}

// Check if API proxy is configured in vite.config.ts
let viteConfigContent = '';
try {
  viteConfigContent = fs.readFileSync(path.join(__dirname, 'vite.config.ts'), 'utf8');
  const hasApiProxy = viteConfigContent.includes("'/api':");
  
  console.log('\nChecking Vite configuration:');
  console.log(`${hasApiProxy ? '✓' : '✗'} API proxy configuration`);
  
  if (!hasApiProxy) allFilesExist = false;
} catch (err) {
  console.log('\n✗ Could not read vite.config.ts');
  allFilesExist = false;
}

// Check dependencies in package.json
let packageContent = '';
try {
  packageContent = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  console.log('\nChecking required dependencies:');
  
  const requiredDeps = ['express', 'cors', 'echarts', 'echarts-for-react', 'framer-motion'];
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`${hasDep ? '✓' : '✗'} ${dep}`);
    if (!hasDep) allFilesExist = false;
  });
} catch (err) {
  console.log('\n✗ Could not read package.json');
  allFilesExist = false;
}

// Final result
console.log('\nStartup check result:');
if (allFilesExist) {
  console.log('✅ All checks passed! The dashboard is ready to run.');
  console.log('\nTo start the dashboard, run:');
  console.log('  ./start-dashboard.sh');
} else {
  console.log('❌ Some checks failed. Please fix the issues highlighted above.');
}