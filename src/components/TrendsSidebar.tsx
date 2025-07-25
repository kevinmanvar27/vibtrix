import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import UserTooltip from "./UserTooltip";
import RecentlyJoinedSidebarWrapper from "./RecentlyJoinedSidebarWrapper";

import debug from "@/lib/debug";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <RecentlyJoinedSidebarWrapper />
      </Suspense>
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  try {
    const { user } = await validateRequest();

    if (!user) return null;

    const usersToFollow = await prisma.user.findMany({
      where: {
        NOT: {
          id: user.id,
        },
        followers: {
          none: {
            followerId: user.id,
          },
        },
        isActive: true,
      },
      select: getUserDataSelect(user.id),
      take: 5,
    });

    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Who to follow</div>
        {usersToFollow.length > 0 ? (
          usersToFollow.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <UserTooltip user={user}>
                <Link
                  href={`/users/${user.username}`}
                  className="flex items-center gap-3"
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    className="flex-none"
                    showStatus={true}
                    status={user.onlineStatus}
                    statusSize="sm"
                  />
                  <div>
                    <p className="line-clamp-1 break-all font-semibold hover:underline">
                      {user.displayName}
                    </p>
                    <p className="line-clamp-1 break-all text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </Link>
              </UserTooltip>
              <FollowButton
                userId={user.id}
                initialState={{
                  followers: user._count.followers,
                  isFollowedByUser: user.followers.some(
                    ({ followerId }) => followerId === user.id,
                  ),
                }}
              />
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No users to follow at the moment.</p>
        )}
      </div>
    );
  } catch (error) {
    debug.error("Error in WhoToFollow component:", error);
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Who to follow</div>
        <p className="text-muted-foreground">Unable to load user recommendations.</p>
      </div>
    );
  }
}

const getTrendingTopics = unstable_cache(
  async () => {
    try {
      // First check if the posts table exists and has data
      const postCount = await prisma.post.count();

      if (postCount === 0) {
        return [];
      }

      const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
              SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
              FROM posts
              GROUP BY (hashtag)
              ORDER BY count DESC, hashtag ASC
              LIMIT 5
          `;

      return result.map((row) => ({
        hashtag: row.hashtag,
        count: Number(row.count),
      }));
    } catch (error) {
      debug.error("Error fetching trending topics:", error);
      return [];
    }
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  try {
    const trendingTopics = await getTrendingTopics();

    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Trending topics</div>
        {trendingTopics.length > 0 ? (
          trendingTopics.map(({ hashtag, count }) => {
            const title = hashtag.split("#")[1];

            return (
              <Link key={title} href={`/hashtag/${title}`} className="block">
                <p
                  className="line-clamp-1 break-all font-semibold hover:underline"
                  title={hashtag}
                >
                  {hashtag}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(count)} {count === 1 ? "post" : "posts"}
                </p>
              </Link>
            );
          })
        ) : (
          <p className="text-muted-foreground">No trending topics yet. Start posting with hashtags!</p>
        )}
      </div>
    );
  } catch (error) {
    debug.error("Error in TrendingTopics component:", error);
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Trending topics</div>
        <p className="text-muted-foreground">Unable to load trending topics.</p>
      </div>
    );
  }
}
