const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

async function checkImageUrl() {
  console.log('Checking image URL for the post...');
  
  const postId = 'cm9l8up8x000ltu1gh5yfv61d';

  try {
    // Get the post with its attachments
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        attachments: true
      }
    });

    if (!post) {
      console.log(`Post with ID ${postId} not found.`);
      return;
    }

    console.log(`Found post with ${post.attachments.length} attachments.`);
    
    // Check each attachment URL
    for (const attachment of post.attachments) {
      console.log(`Checking attachment: ${attachment.id}`);
      console.log(`URL: ${attachment.url}`);
      console.log(`Type: ${attachment.type}`);
      
      // For local URLs, check if they start with the correct path
      if (attachment.url.startsWith('/uploads/')) {
        console.log('This is a local URL. Checking if it exists on the server...');
        
        // Try to fetch the URL from the local server
        try {
          const response = await fetch(`http://localhost:3000${attachment.url}`);
          if (response.ok) {
            console.log('✅ Image is accessible on the server.');
          } else {
            console.log(`❌ Image is NOT accessible. Status: ${response.status}`);
            console.log('This could be causing the post not to display properly.');
          }
        } catch (error) {
          console.log(`❌ Error fetching image: ${error.message}`);
        }
      } else {
        console.log('This is an external URL.');
        
        // Try to fetch the external URL
        try {
          const response = await fetch(attachment.url);
          if (response.ok) {
            console.log('✅ Image is accessible.');
          } else {
            console.log(`❌ Image is NOT accessible. Status: ${response.status}`);
            console.log('This could be causing the post not to display properly.');
          }
        } catch (error) {
          console.log(`❌ Error fetching image: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking image URL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageUrl()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script failed:', error));
