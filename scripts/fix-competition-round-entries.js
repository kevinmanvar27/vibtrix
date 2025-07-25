// This script calls the sync-round-entries API to fix competition round entries

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fixing competition round entries...');

    // Find active competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log(`Found ${activeCompetitions.length} active competitions`);

    if (activeCompetitions.length === 0) {
      console.log('No active competitions found.');
      return;
    }

    // Get admin user for authentication
    const adminUser = await prisma.user.findFirst({
      where: {
        isAdmin: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!adminUser) {
      console.log('No admin user found. Cannot proceed without authentication.');
      return;
    }

    console.log(`Using admin user: ${adminUser.email} for authentication`);

    // Call the sync-round-entries API for each competition
    for (const competition of activeCompetitions) {
      console.log(`\nProcessing competition: "${competition.title}" (ID: ${competition.id})`);
      
      try {
        // Call the API
        const response = await fetch(`http://localhost:3000/api/competitions/${competition.id}/sync-round-entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`Successfully synchronized entries for competition "${competition.title}"`);
          console.log(`Message: ${result.message}`);
          
          if (result.results && result.results.length > 0) {
            console.log(`Updated ${result.results.length} entries`);
          } else {
            console.log('No entries needed updating');
          }
        } else {
          console.error(`Failed to synchronize entries for competition "${competition.title}"`);
          console.error(`Error: ${result.error}`);
          console.error(`Details: ${result.details || 'No details provided'}`);
        }
      } catch (error) {
        console.error(`Error calling API for competition "${competition.title}":`, error);
      }
    }

  } catch (error) {
    console.error('Error fixing competition round entries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
