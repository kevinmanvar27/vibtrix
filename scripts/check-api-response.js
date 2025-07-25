const fetch = require('node-fetch');

async function checkApiResponse() {
  console.log('Checking API response for the for-you feed...');
  
  const postId = 'cm9l8up8x000ltu1gh5yfv61d';
  
  try {
    // Call the for-you API endpoint
    const response = await fetch('http://localhost:3000/api/posts/for-you');
    
    if (!response.ok) {
      console.log(`API returned status: ${response.status}`);
      console.log(`Error: ${await response.text()}`);
      return;
    }
    
    const data = await response.json();
    
    console.log(`API returned ${data.posts.length} posts`);
    
    // Check if our post is in the results
    const foundPost = data.posts.find(post => post.id === postId);
    
    if (foundPost) {
      console.log('The post IS found in the API response.');
      
      // Find its position in the results
      const position = data.posts.findIndex(post => post.id === postId) + 1;
      console.log(`It appears at position ${position} out of ${data.posts.length} posts.`);
      
      // Print some details about the post
      console.log('\nPost details from API:');
      console.log(`ID: ${foundPost.id}`);
      console.log(`Content: ${foundPost.content}`);
      console.log(`User: ${foundPost.user.displayName} (@${foundPost.user.username})`);
      console.log(`Created At: ${new Date(foundPost.createdAt).toLocaleString()}`);
      console.log(`Likes: ${foundPost._count.likes}`);
      console.log(`Comments: ${foundPost._count.comments}`);
      
      if (foundPost.attachments && foundPost.attachments.length > 0) {
        console.log(`Has ${foundPost.attachments.length} attachments`);
        foundPost.attachments.forEach((attachment, index) => {
          console.log(`  Attachment ${index + 1}: ${attachment.type} - ${attachment.url}`);
        });
      } else {
        console.log('No attachments');
      }
    } else {
      console.log('The post is NOT found in the API response.');
      console.log('This suggests there might be an issue with the API or caching.');
      
      // Print the IDs of the posts that were returned
      console.log('\nIDs of posts returned by the API:');
      data.posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.id} - ${post.user.username}: ${post.content.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('Error checking API response:', error);
  }
}

checkApiResponse()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script failed:', error));
