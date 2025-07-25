#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompetitionSlugs() {
  console.log('🔍 Checking Competition Slugs');
  console.log('=============================\n');

  try {
    const competitions = await prisma.competition.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${competitions.length} competitions\n`);

    // Check for duplicates
    const slugCounts = {};
    const duplicates = [];

    competitions.forEach(comp => {
      if (comp.slug) {
        if (slugCounts[comp.slug]) {
          slugCounts[comp.slug]++;
          duplicates.push(comp);
        } else {
          slugCounts[comp.slug] = 1;
        }
      }
    });

    if (duplicates.length > 0) {
      console.log('❌ DUPLICATE SLUGS FOUND:');
      duplicates.forEach(comp => {
        console.log(`   - ID: ${comp.id}, Title: "${comp.title}", Slug: "${comp.slug}"`);
      });
    } else {
      console.log('✅ No duplicate slugs found');
    }

    console.log('\n📋 Recent Competitions:');
    competitions.slice(0, 10).forEach(comp => {
      console.log(`   - "${comp.title}" (${comp.slug || 'NO SLUG'})`);
    });

    const withoutSlugs = competitions.filter(comp => !comp.slug);
    if (withoutSlugs.length > 0) {
      console.log(`\n⚠️  ${withoutSlugs.length} competitions without slugs:`);
      withoutSlugs.forEach(comp => {
        console.log(`   - ID: ${comp.id}, Title: "${comp.title}"`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompetitionSlugs();
