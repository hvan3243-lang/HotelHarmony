#!/usr/bin/env node

import crypto from 'crypto';

console.log('🔐 Generating secure secrets for HotelLux...\n');

// Generate strong secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy these secrets to your .env file or Replit Secrets:');
console.log('='.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('='.repeat(60));

console.log('\n📝 Next steps:');
console.log('1. Add these secrets to your environment variables');
console.log('2. Get Google OAuth credentials from Google Cloud Console');
console.log('3. Get Stripe keys from Stripe Dashboard');
console.log('4. Get SendGrid API key (optional)');
console.log('\nFor detailed setup, see ENVIRONMENT_SETUP.md');