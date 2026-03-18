#!/usr/bin/env node

/**
 * Symphony Postinstall Script
 * Automatically builds the Next.js dashboard after `npm install`.
 * Skips build during development (when running from source directory).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

// Skip if .next/ already exists (already built)
if (fs.existsSync(path.join(ROOT, '.next'))) {
    console.log('✅ Symphony dashboard already built — skipping.');
    process.exit(0);
}

// Skip if we're in a CI environment that doesn't need the dashboard
if (process.env.CI || process.env.SYMPHONY_SKIP_BUILD) {
    console.log('⏭️  Skipping Symphony build (CI or SYMPHONY_SKIP_BUILD set).');
    process.exit(0);
}

console.log('');
console.log('🎼 Symphony — Building dashboard...');
console.log('   This only happens once after installation.');
console.log('');

try {
    execSync('npx next build', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
    });
    console.log('');
    console.log('✅ Symphony dashboard built successfully!');
    console.log('   Run `symphony start` to launch.');
    console.log('');
} catch (err) {
    console.error('');
    console.error('⚠️  Symphony dashboard build failed.');
    console.error('   You can manually build later with: symphony build');
    console.error('   The CLI commands will still work without the dashboard.');
    console.error('');
    // Don't fail the install — CLI/MCP still work without dashboard
    process.exit(0);
}
