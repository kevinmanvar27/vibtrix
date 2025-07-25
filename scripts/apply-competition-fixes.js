const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting competition fixes...');

  try {
    // Check if the isDisqualified column exists
    const columnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'competition_participants'
        AND column_name = 'isDisqualified'
      );
    `;

    if (!columnExists[0].exists) {
      console.log('Column "isDisqualified" does not exist, adding it...');
      await prisma.$executeRaw`
        ALTER TABLE competition_participants ADD COLUMN "isDisqualified" BOOLEAN NOT NULL DEFAULT false;
      `;
      console.log('Column "isDisqualified" added successfully');
    } else {
      console.log('Column "isDisqualified" already exists');
    }

    // Check if the disqualifyReason column exists
    const reasonColumnExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'competition_participants'
        AND column_name = 'disqualifyReason'
      );
    `;

    if (!reasonColumnExists[0].exists) {
      console.log('Column "disqualifyReason" does not exist, adding it...');
      await prisma.$executeRaw`
        ALTER TABLE competition_participants ADD COLUMN "disqualifyReason" TEXT;
      `;
      console.log('Column "disqualifyReason" added successfully');
    } else {
      console.log('Column "disqualifyReason" already exists');
    }

    // Verify competitions have slugs
    const competitionsWithoutSlugs = await prisma.competition.findMany({
      where: {
        slug: null
      },
      select: {
        id: true,
        title: true
      }
    });

    if (competitionsWithoutSlugs.length > 0) {
      console.log(`Found ${competitionsWithoutSlugs.length} competitions without slugs, fixing...`);
      
      for (const competition of competitionsWithoutSlugs) {
        // Generate a slug from the title
        let slug = competition.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        // Add a timestamp to ensure uniqueness
        slug = `${slug}-${Date.now()}`;
        
        // Update the competition with the new slug
        await prisma.competition.update({
          where: { id: competition.id },
          data: { slug }
        });
        
        console.log(`Updated competition "${competition.title}" with slug "${slug}"`);
      }
    } else {
      console.log('All competitions have slugs');
    }

    console.log('Competition fixes completed successfully');
  } catch (error) {
    console.error('Error applying competition fixes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
