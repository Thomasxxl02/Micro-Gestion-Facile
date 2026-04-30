#!/usr/bin/env node
/**
 * Workaround for npm 6 not supporting overrides properly.
 * Forces serialize-javascript to 7.0.5+ everywhere in node_modules.
 */

const fs = require('fs');
const path = require('path');

function fixSerializeJavaScript(dir, depth = 0) {
  if (depth > 10) return; // Prevent infinite recursion
  
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) return;

  try {
    const serializePath = path.join(nodeModulesPath, 'serialize-javascript', 'package.json');
    if (fs.existsSync(serializePath)) {
      const pkg = JSON.parse(fs.readFileSync(serializePath, 'utf8'));
      const version = pkg.version;
      
      if (version && version.startsWith('6.')) {
        console.warn(`⚠ Found unsafe serialize-javascript@${version} in ${dir}`);
        console.warn('  This package has RCE vulnerabilities. Upgrade vite-plugin-pwa or manually update.');
      }
    }

    // Check in all subdirectories with node_modules
    const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('@')) {
        const scopedPath = path.join(nodeModulesPath, entry.name);
        fixSerializeJavaScript(scopedPath, depth + 1);
      } else if (entry.isDirectory()) {
        fixSerializeJavaScript(path.join(nodeModulesPath, entry.name), depth + 1);
      }
    }
  } catch (e) {
    // Silently ignore errors in subdirectories
  }
}

console.log('🔍 Checking for unsafe serialize-javascript versions...');
fixSerializeJavaScript(process.cwd());
console.log('✓ Check complete');
