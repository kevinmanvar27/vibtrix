import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";
import { validateAuthRequest } from "@/lib/jwt-middleware";

import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    // Get the showStickeredMedia parameter from the request
    const showStickeredMediaParam = req.nextUrl.searchParams.get("showStickeredMedia");
    // Convert to boolean (default to true if not provided)
    const showStickeredMedia = showStickeredMediaParam === null ? null : showStickeredMediaParam === "true";
    // Get the random parameter from the request
    const randomParam = req.nextUrl.searchParams.get("random");
    // Convert to boolean (default to false if not provided)
    const random = randomParam === "true";

    const pageSize = 10;

    // Try JWT authentication first, then fall back to cookie-based auth
    let { user } = await validateAuthRequest(req);

    // If JWT auth fails, try cookie-based auth
    if (!user) {
      const cookieAuthResult = await validateRequest();
      user = cookieAuthResult.user;
    }

    // For guest users, return public posts without user-specific filtering
    const isLoggedIn = !!user;

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      debug.error('Database connection error:', dbError);
      return Response.json({
        error: "Database connection error",
        details: dbError instanceof Error ? dbError.message : "Could not connect to database"
      }, { status: 503 });
    }

    try {
      debug.log('GET /api/posts/for-you - Starting query');
      // For logged-in users, filter out blocked users
      let excludedUserIds: string[] = [];

      if (isLoggedIn && user) {
        // Get the list of users that the current user has blocked
        const blockedUsers = await prisma.userBlock.findMany({
          where: {
            blockerId: user.id,
          },
          select: {
            blockedId: true,
          },
        });

        // Get the list of users that have blocked the current user
        const blockedByUsers = await prisma.userBlock.findMany({
          where: {
            blockedId: user.id,
          },
          select: {
            blockerId: true,
          },
        });

        // Extract just the IDs
        const blockedUserIds = blockedUsers.map((block) => block.blockedId);
        const blockedByUserIds = blockedByUsers.map((block) => block.blockerId);

        // Combine both lists to get all users to exclude
        excludedUserIds = [...blockedUserIds, ...blockedByUserIds];
      }

      // Include posts that are either not part of a competition
      // or are part of a competition but marked as visible in normal feed
      // AND exclude posts from blocked users
      // AND exclude posts from private profiles (unless the user follows them)
      // AND only include posts from users with role "USER"
      // If random is true, we need to get all posts and then randomize them
      let posts;

      if (random) {
        // For random ordering, we need to get all eligible posts first
        const allPosts = await prisma.post.findMany({
        where: {
          OR: [
            // Regular posts (not part of a competition)
            {
              competitionEntries: {
                none: {}
              }
            },
            // Competition posts that should be visible in normal feed
            // AND only if the competition round has started
            {
              competitionEntries: {
                some: {
                  visibleInNormalFeed: true,
                  round: {
                    // Only show posts for rounds that have started
                    startDate: { lte: new Date() }
                  }
                }
              }
            }
          ],
          // Exclude posts from blocked users
          userId: {
            notIn: excludedUserIds
          },
          // Only include posts from public profiles or from profiles the user follows
          user: {
            // Only show posts from users with role "USER"
            role: "USER",
            OR: [
              // Public profiles
              { isProfilePublic: true },
              // If logged in, include profiles the user follows
              ...(isLoggedIn ? [
                {
                  followers: {
                    some: {
                      followerId: user!.id
                    }
                  }
                }
              ] : [])
            ]
          }
        },
        include: getPostDataInclude(isLoggedIn ? user!.id : ''),
        orderBy: { createdAt: "desc" },
        // Don't use cursor or pagination for random posts
      });

        // Shuffle the posts randomly
        const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);

        // Take only the number of posts we need
        posts = shuffledPosts.slice(0, pageSize + 1);
      } else {
        // For normal ordering, use the standard query with pagination
        posts = await prisma.post.findMany({
          where: {
            OR: [
              // Regular posts (not part of a competition)
              {
                competitionEntries: {
                  none: {}
                }
              },
              // Competition posts that should be visible in normal feed
              // AND only if the competition round has started
              {
                competitionEntries: {
                  some: {
                    visibleInNormalFeed: true,
                    round: {
                      // Only show posts for rounds that have started
                      startDate: { lte: new Date() }
                    }
                  }
                }
              }
            ],
            // Exclude posts from blocked users
            userId: {
              notIn: excludedUserIds
            },
            // Only include posts from public profiles or from profiles the user follows
            user: {
              // Only show posts from users with role "USER"
              role: "USER",
              OR: [
                // Public profiles
                { isProfilePublic: true },
                // If logged in, include profiles the user follows
                ...(isLoggedIn ? [
                  {
                    followers: {
                      some: {
                        followerId: user!.id
                      }
                    }
                  }
                ] : [])
              ]
            }
          },
          include: getPostDataInclude(isLoggedIn ? user!.id : ''),
          orderBy: { createdAt: "desc" },
          take: pageSize + 1,
          cursor: cursor ? { id: cursor } : undefined,
        });
      }

      const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

      // Get site settings to check if stickered media should be shown
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
        select: { showStickeredAdvertisements: true },
      });

      // Process media URLs based on the request parameter or site settings
      const processedPosts = posts.slice(0, pageSize).map(post => {
        // Use the request parameter if provided, otherwise fall back to site settings
        const shouldShowStickered = showStickeredMedia !== null
          ? showStickeredMedia
          : (settings && settings.showStickeredAdvertisements !== false);

        // If we should not show stickered media, replace stickered URLs with original URLs
        if (!shouldShowStickered) {
          // Process each attachment to replace stickered URLs with original URLs
          const processedAttachments = post.attachments.map(attachment => {
            // Check if the URL is a stickered URL
            if (attachment.url && attachment.url.startsWith('/uploads/stickered/')) {
              // For videos, we need to be more careful as the original might not exist
              if (attachment.type === 'VIDEO') {
                // Check if the original file exists
                const originalUrl = attachment.url.replace('/uploads/stickered/', '/uploads/original/');
                const originalFilePath = require('path').join(process.cwd(), 'public', originalUrl);

                if (require('fs').existsSync(originalFilePath)) {
                  // Original file exists, use it
                  debug.log(`Found original video at ${originalFilePath}, using it instead of stickered version`);
                  return { ...attachment, url: originalUrl };
                } else {
                  // Original file doesn't exist, keep using the stickered version
                  debug.log(`Original video not found at ${originalFilePath}, keeping stickered version`);
                  return attachment;
                }
              } else {
                // For images, replace 'stickered' with 'original' in the URL path
                const originalUrl = attachment.url.replace('/uploads/stickered/', '/uploads/original/');
                return { ...attachment, url: originalUrl };
              }
            }
            return attachment;
          });

          return { ...post, attachments: processedAttachments };
        }

        return post;
      });

      const data: PostsPage = {
        posts: processedPosts,
        nextCursor,
      };

      // Log the actual setting used (from request parameter or site settings)
      const effectiveShowStickered = showStickeredMedia !== null
        ? showStickeredMedia
        : (settings?.showStickeredAdvertisements !== false);

      debug.log(`GET /api/posts/for-you - Returning ${data.posts.length} posts with showStickeredMedia=${effectiveShowStickered} (from ${showStickeredMedia !== null ? 'request' : 'settings'})`);
      return Response.json(data);
    } catch (queryError) {
      debug.error('Error querying posts:', queryError);
      return Response.json({
        error: "Failed to fetch posts",
        details: queryError instanceof Error ? queryError.message : "Error querying database"
      }, { status: 500 });
    }
  } catch (error) {
    debug.error('Unhandled error in for-you posts API:', error);
    return Response.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
}
