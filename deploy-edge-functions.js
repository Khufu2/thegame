#!/usr/bin/env node

/**
 * 🚀 Deploy Edge Functions
 * Usage: node deploy-edge-functions.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const functions = [
  'fetch-matches',
  'fetch-standings',
  'fetch-scorers'
];

const requiredEnvVars = [
  'API_FOOTBALL_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🚀 Deploying Edge Functions...\n');

// Check environment variables
console.log('✓ Checking environment variables...');
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
  console.error('Set them in Supabase Dashboard → Edge Functions → Secrets');
  process.exit(1);
}
console.log(`✓ All environment variables set\n`);

// Deploy each function
for (const func of functions) {
  try {
    console.log(`📦 Deploying ${func}...`);
    execSync(`supabase functions deploy ${func}`, { stdio: 'inherit' });
    console.log(`✅ ${func} deployed successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to deploy ${func}`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log('✅ All edge functions deployed successfully!');
console.log('\n📊 Next steps:');
console.log('1. Set up scheduled runs (GitHub Actions or Vercel)');
console.log('2. Monitor logs: supabase functions logs fetch-matches');
console.log('3. Connect frontend to edge functions');
console.log('\n📚 See EDGE_FUNCTIONS_GUIDE.md for full setup');
