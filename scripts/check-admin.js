const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking for admin user...');
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@rektech.uk'
      }
    });

    if (adminUser) {
      console.log('Admin user found:');
      console.log('ID:', adminUser.id);
      console.log('Username:', adminUser.username);
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('isAdmin:', adminUser.isAdmin);
      console.log('Has password hash:', !!adminUser.passwordHash);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
