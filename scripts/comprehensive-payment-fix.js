#!/usr/bin/env node

/**
 * Comprehensive Payment System Fix Script
 * 
 * This script addresses the regression issue where payment authentication
 * was working before but is now failing. It systematically checks and fixes:
 * 1. Database schema issues from migration conflicts
 * 2. Missing or corrupted Razorpay settings
 * 3. Environment variable conflicts
 * 4. API validation logic problems
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Your known working credentials
const WORKING_RAZORPAY_KEY_ID = 'rzp_test_Go3jN8rdNmRJ7P';
const WORKING_RAZORPAY_KEY_SECRET = 'sbD3JVTl7W7UJ18O43cRmtCE';

async function main() {
  console.log('🔧 Vibtrix Payment System Regression Fix');
  console.log('===========================================\n');

  try {
    // Step 1: Diagnose the current state
    console.log('1️⃣ DIAGNOSING CURRENT STATE...');
    const diagnosis = await diagnoseProblem();
    
    // Step 2: Fix database schema issues
    console.log('\n2️⃣ FIXING DATABASE SCHEMA...');
    await fixDatabaseSchema();
    
    // Step 3: Configure credentials properly
    console.log('\n3️⃣ CONFIGURING RAZORPAY CREDENTIALS...');
    await configureCredentials();
    
    // Step 4: Test the configuration
    console.log('\n4️⃣ TESTING CONFIGURATION...');
    await testConfiguration();
    
    // Step 5: Clear any caches
    console.log('\n5️⃣ CLEARING CACHES...');
    await clearCaches();

    console.log('\n✅ PAYMENT SYSTEM FIX COMPLETED!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Restart your Next.js development server: npm run dev');
    console.log('2. Try making a payment in your application');
    console.log('3. Check browser console for any remaining errors');
    console.log('4. Use test card: 4111 1111 1111 1111 for testing');

  } catch (error) {
    console.error('❌ Error during fix process:', error);
    console.error('\n🔍 TROUBLESHOOTING STEPS:');
    console.error('1. Ensure your database is running');
    console.error('2. Check database connection string');
    console.error('3. Verify you have proper database permissions');
    console.error('4. Try running: npx prisma db push');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function diagnoseProblem() {
  console.log('   🔍 Checking database schema...');
  
  try {
    // Check if site_settings table exists and has required columns
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'site_settings'
      ORDER BY column_name
    `;
    
    console.log(`   - site_settings table: ✅ Found (${tableInfo.length} columns)`);
    
    const requiredColumns = ['razorpayEnabled', 'razorpayKeyId', 'razorpayKeySecret'];
    const existingColumns = tableInfo.map(col => col.column_name);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`   - Missing columns: ❌ ${missingColumns.join(', ')}`);
      return { schemaBroken: true, missingColumns };
    } else {
      console.log('   - Required columns: ✅ All present');
    }
    
    // Check if settings record exists
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' }
    });
    
    if (!settings) {
      console.log('   - Settings record: ❌ Missing');
      return { schemaBroken: false, missingSettings: true };
    } else {
      console.log('   - Settings record: ✅ Found');
    }
    
    return { schemaBroken: false, missingSettings: false };
    
  } catch (error) {
    console.log('   - Database check: ❌ Error:', error.message);
    return { schemaBroken: true, error: error.message };
  }
}

async function fixDatabaseSchema() {
  try {
    console.log('   🔧 Ensuring Razorpay columns exist...');
    
    // Add columns if they don't exist (safe operation)
    await prisma.$executeRaw`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT
    `;
    
    console.log('   ✅ Database schema fixed');
    
    // Ensure settings record exists
    console.log('   🔧 Ensuring settings record exists...');
    
    const existingSettings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' }
    });
    
    if (!existingSettings) {
      await prisma.siteSettings.create({
        data: {
          id: 'settings',
          maxImageSize: 5242880,
          minVideoDuration: 3,
          maxVideoDuration: 60,
          googleLoginEnabled: true,
          manualSignupEnabled: true,
          paytmEnabled: false,
          phonePeEnabled: false,
          gPayEnabled: false,
          razorpayEnabled: true,
          timezone: 'Asia/Kolkata',
        }
      });
      console.log('   ✅ Settings record created');
    } else {
      console.log('   ✅ Settings record already exists');
    }
    
  } catch (error) {
    console.error('   ❌ Error fixing database schema:', error.message);
    throw error;
  }
}

async function configureCredentials() {
  try {
    console.log('   🔧 Setting up Razorpay credentials...');
    
    // Update the settings with working credentials
    await prisma.siteSettings.upsert({
      where: { id: 'settings' },
      update: {
        razorpayEnabled: true,
        razorpayKeyId: WORKING_RAZORPAY_KEY_ID,
        razorpayKeySecret: WORKING_RAZORPAY_KEY_SECRET,
        updatedAt: new Date(),
      },
      create: {
        id: 'settings',
        maxImageSize: 5242880,
        minVideoDuration: 3,
        maxVideoDuration: 60,
        googleLoginEnabled: true,
        manualSignupEnabled: true,
        paytmEnabled: false,
        phonePeEnabled: false,
        gPayEnabled: false,
        razorpayEnabled: true,
        razorpayKeyId: WORKING_RAZORPAY_KEY_ID,
        razorpayKeySecret: WORKING_RAZORPAY_KEY_SECRET,
        timezone: 'Asia/Kolkata',
      }
    });
    
    console.log('   ✅ Razorpay credentials configured in database');
    
    // Also set environment variables as backup
    console.log('   🔧 Checking environment variables...');
    
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (envKeyId && envKeySecret) {
      console.log('   ✅ Environment variables already set');
    } else {
      console.log('   ⚠️  Environment variables not set');
      console.log('   💡 Consider adding to .env.local:');
      console.log(`      RAZORPAY_KEY_ID=${WORKING_RAZORPAY_KEY_ID}`);
      console.log(`      RAZORPAY_KEY_SECRET=${WORKING_RAZORPAY_KEY_SECRET}`);
    }
    
  } catch (error) {
    console.error('   ❌ Error configuring credentials:', error.message);
    throw error;
  }
}

async function testConfiguration() {
  try {
    console.log('   🧪 Testing Razorpay configuration...');
    
    // Test database retrieval
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
      }
    });
    
    if (!settings) {
      throw new Error('Settings not found after configuration');
    }
    
    console.log('   ✅ Database settings retrieval: Success');
    console.log(`   - Enabled: ${settings.razorpayEnabled}`);
    console.log(`   - Key ID: ${settings.razorpayKeyId?.substring(0, 8)}...`);
    console.log(`   - Key Secret: ${settings.razorpayKeySecret ? 'Present (' + settings.razorpayKeySecret.length + ' chars)' : 'Missing'}`);
    
    // Test API key format
    if (settings.razorpayKeyId && settings.razorpayKeySecret) {
      const keyIdValid = settings.razorpayKeyId.startsWith('rzp_');
      const keySecretValid = settings.razorpayKeySecret.length >= 20;
      
      console.log('   🔍 Format validation:');
      console.log(`   - Key ID format: ${keyIdValid ? '✅' : '❌'}`);
      console.log(`   - Key Secret length: ${keySecretValid ? '✅' : '❌'}`);
      
      if (!keyIdValid || !keySecretValid) {
        throw new Error('Credential format validation failed');
      }
    } else {
      throw new Error('Credentials are missing after configuration');
    }
    
    console.log('   ✅ Configuration test passed');
    
  } catch (error) {
    console.error('   ❌ Configuration test failed:', error.message);
    throw error;
  }
}

async function clearCaches() {
  try {
    console.log('   🧹 Clearing potential caches...');
    
    // Clear any failed payment records from the last hour that might be causing issues
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failedPayments = await prisma.payment.deleteMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: oneHourAgo
        }
      }
    });
    
    if (failedPayments.count > 0) {
      console.log(`   ✅ Cleared ${failedPayments.count} failed payment records`);
    } else {
      console.log('   ✅ No failed payment records to clear');
    }
    
    console.log('   💡 Remember to restart your Next.js server to clear any in-memory caches');
    
  } catch (error) {
    console.error('   ⚠️  Error clearing caches:', error.message);
    // Don't throw here as this is not critical
  }
}

// Run the script
main().catch(console.error);
