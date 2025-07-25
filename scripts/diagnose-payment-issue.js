#!/usr/bin/env node

/**
 * Payment Issue Diagnostic Script
 * 
 * This script will diagnose the current payment configuration
 * and identify why you're getting "Payment system authentication failed"
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnosing Payment System Issue...');
  console.log('====================================\n');

  try {
    // Check 1: Environment Variables
    console.log('1️⃣ Checking Environment Variables:');
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log(`   RAZORPAY_KEY_ID: ${envKeyId ? '✅ Present (' + envKeyId.substring(0, 8) + '...)' : '❌ Missing'}`);
    console.log(`   RAZORPAY_KEY_SECRET: ${envKeySecret ? '✅ Present (' + envKeySecret.length + ' chars)' : '❌ Missing'}`);
    
    if (envKeyId && envKeySecret) {
      console.log('   Format validation:');
      console.log(`   - Key ID starts with "rzp_": ${envKeyId.startsWith('rzp_') ? '✅' : '❌'}`);
      console.log(`   - Key Secret length ≥20: ${envKeySecret.length >= 20 ? '✅' : '❌'}`);
    }

    // Check 2: Database Settings
    console.log('\n2️⃣ Checking Database Settings:');
    
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'settings' },
        select: {
          razorpayEnabled: true,
          razorpayKeyId: true,
          razorpayKeySecret: true,
        },
      });

      if (settings) {
        console.log(`   Settings record: ✅ Found`);
        console.log(`   Razorpay enabled: ${settings.razorpayEnabled ? '✅' : '❌'}`);
        console.log(`   Key ID in DB: ${settings.razorpayKeyId ? '✅ Present (' + settings.razorpayKeyId.substring(0, 8) + '...)' : '❌ Missing'}`);
        console.log(`   Key Secret in DB: ${settings.razorpayKeySecret ? '✅ Present (' + settings.razorpayKeySecret.length + ' chars)' : '❌ Missing'}`);
        
        if (settings.razorpayKeyId && settings.razorpayKeySecret) {
          console.log('   Format validation:');
          console.log(`   - Key ID starts with "rzp_": ${settings.razorpayKeyId.startsWith('rzp_') ? '✅' : '❌'}`);
          console.log(`   - Key Secret length ≥20: ${settings.razorpayKeySecret.length >= 20 ? '✅' : '❌'}`);
        }
      } else {
        console.log('   Settings record: ❌ Not found');
      }
    } catch (error) {
      console.log('   Database error: ❌', error.message);
    }

    // Check 3: Database Schema
    console.log('\n3️⃣ Checking Database Schema:');
    
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'site_settings' 
        AND column_name IN ('razorpayKeyId', 'razorpayKeySecret', 'razorpayEnabled')
        ORDER BY column_name
      `;
      
      console.log('   Required columns:');
      const requiredColumns = ['razorpayEnabled', 'razorpayKeyId', 'razorpayKeySecret'];
      const foundColumns = columns.map(col => col.column_name);
      
      requiredColumns.forEach(col => {
        const exists = foundColumns.includes(col);
        console.log(`   - ${col}: ${exists ? '✅' : '❌'}`);
      });
      
    } catch (error) {
      console.log('   Schema check error: ❌', error.message);
    }

    // Check 4: Recent Payment Attempts
    console.log('\n4️⃣ Checking Recent Payment Attempts:');
    
    try {
      const recentPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          gateway: true,
          createdAt: true,
          amount: true,
        }
      });

      if (recentPayments.length > 0) {
        console.log(`   Found ${recentPayments.length} recent payment attempts:`);
        recentPayments.forEach(payment => {
          console.log(`   - ${payment.createdAt.toISOString()}: ${payment.status} (₹${payment.amount})`);
        });
      } else {
        console.log('   No recent payment attempts found');
      }
    } catch (error) {
      console.log('   Payment check error: ❌', error.message);
    }

    // Diagnosis Summary
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('====================');

    const hasEnvVars = envKeyId && envKeySecret;
    const hasValidEnvFormat = hasEnvVars && envKeyId.startsWith('rzp_') && envKeySecret.length >= 20;
    
    let hasDbSettings = false;
    let hasValidDbFormat = false;
    
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'settings' },
        select: { razorpayEnabled: true, razorpayKeyId: true, razorpayKeySecret: true },
      });
      
      hasDbSettings = settings && settings.razorpayEnabled && settings.razorpayKeyId && settings.razorpayKeySecret;
      hasValidDbFormat = hasDbSettings && settings.razorpayKeyId.startsWith('rzp_') && settings.razorpayKeySecret.length >= 20;
    } catch (error) {
      // Database check failed
    }

    if (hasValidEnvFormat) {
      console.log('✅ SOLUTION: Environment variables are properly configured');
      console.log('   The system should use environment variables and work correctly.');
    } else if (hasValidDbFormat) {
      console.log('✅ SOLUTION: Database settings are properly configured');
      console.log('   The system should use database settings and work correctly.');
    } else if (hasEnvVars && !hasValidEnvFormat) {
      console.log('❌ ISSUE: Environment variables have invalid format');
      console.log('   Fix: Check that RAZORPAY_KEY_ID starts with "rzp_" and RAZORPAY_KEY_SECRET is at least 20 characters');
    } else if (hasDbSettings && !hasValidDbFormat) {
      console.log('❌ ISSUE: Database settings have invalid format');
      console.log('   Fix: Update database settings with valid Razorpay credentials');
    } else {
      console.log('❌ ISSUE: No valid Razorpay configuration found');
      console.log('   Fix: Run the setup script to configure your credentials');
    }

    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (!hasValidEnvFormat && !hasValidDbFormat) {
      console.log('1. Run: node scripts/setup-razorpay-credentials.js');
      console.log('2. Or add credentials to .env.local file');
      console.log('3. Restart your Next.js development server');
    } else {
      console.log('1. Restart your Next.js development server');
      console.log('2. Try making a payment again');
      console.log('3. Check browser console for any additional errors');
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);
