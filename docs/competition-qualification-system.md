# Competition Qualification System

This document describes the competition qualification system implemented in Vibtrix.

## Overview

The competition qualification system allows participants to progress through competition rounds based on the number of likes they receive on their posts. If a participant fails to receive the required number of likes in a round, they will be eliminated from the competition and will not proceed to the next round.

## Qualification Requirements

The qualification requirements for each round are as follows:

1. **Round 1**: Minimum 2 likes required to qualify for Round 2
2. **Round 2**: Minimum 3 likes required to qualify for Round 3
3. **Round 3**: Minimum 4 likes required to win the competition

## How It Works

1. When a round ends, the admin can process qualification for that round from the admin panel.
2. The system checks each participant's post for the number of likes it received.
3. If a post has received at least the required number of likes for that round, the participant qualifies for the next round.
4. If a post has not received the required number of likes, the participant is eliminated from the competition.
5. Eliminated participants' posts will still be visible in the regular feed but will not appear in the competition feed for subsequent rounds.
6. Eliminated participants can still upload posts for subsequent rounds, even before the round starts. These posts will only appear in the regular feed, not in the competition feed.

## Setting Up Qualification Requirements

The qualification requirements (minimum likes per round) can be set when creating or editing a competition in the admin panel. Each round has a "Likes to Pass" field where you can specify the minimum number of likes required to qualify for the next round.

Alternatively, you can use the provided script to update the qualification requirements for an existing competition:

```bash
node scripts/update-competition-likes-to-pass.js <competitionId>
```

This script will set the following values:

- Round 1: 2 likes
- Round 2: 3 likes
- Round 3: 4 likes

## Testing the Qualification System

You can test if the qualification system is working correctly using the provided scripts:

```bash
node scripts/test-competition-qualification.js <competitionId>
```

This script will:

1. Check the qualification status of all entries
2. Verify that disqualified entries are properly hidden from the competition feed
3. Confirm that posts from disqualified participants are still visible in the regular feed

To specifically test the disqualification system:

```bash
node scripts/test-competition-disqualification.js <competitionId>
```

This script will:

1. Check if disqualified users have entries in subsequent rounds
2. Verify that entries from disqualified users in subsequent rounds are only visible in the normal feed, not in the competition feed

To test if users can upload posts before a round starts, even if they've been eliminated:

```bash
node scripts/test-competition-upload-before-round.js <competitionId>
```

This script will:

1. Find disqualified participants
2. Check if they have entries in subsequent rounds
3. Verify that these entries are only visible in the normal feed, not in the competition feed
4. Identify upcoming rounds where users can still submit posts

To fix any existing entries that might have incorrect visibility settings:

```bash
node scripts/fix-competition-qualification-visibility.js <competitionId>
```

This script will:

1. Find disqualified participants from each round
2. Check if they have entries in subsequent rounds
3. Update those entries to be visible only in the normal feed, not in the competition feed

## Implementation Details

The qualification system is implemented in the following files:

1. `src/app/api/competitions/[competitionId]/process-qualification/route.ts`: Handles the qualification process when a round ends
2. `src/app/api/posts/competition-feed/route.ts`: Filters out posts from disqualified participants in the competition feed
3. `src/app/api/competitions/[competitionId]/submit-post/route.ts`: Allows disqualified users to submit posts to subsequent rounds, but marks them as only visible in the regular feed
4. `src/app/api/cron/update-competition-entries/route.ts`: Updates entry visibility while respecting qualification status
5. `src/app/admin/competitions/[competitionId]/sync-entries/action.ts`: Synchronizes entry visibility while respecting qualification status

The key changes made to implement this system are:

1. Setting `visibleInCompetitionFeed` to `false` for entries that don't qualify
2. Adding a filter in the competition feed API to only show posts with `visibleInCompetitionFeed: true`
3. Ensuring that posts from eliminated participants still appear in the regular feed by keeping `visibleInNormalFeed` set to `true`
4. Allowing disqualified users to submit posts to subsequent rounds, but marking them as only visible in the regular feed
5. Ensuring that background processes and cron jobs respect qualification status when updating entry visibility

## Admin Process

After each round ends, the admin should follow these steps:

1. Go to the admin panel
2. Navigate to the competition management section
3. Select the competition
4. Go to the "Process Qualification" page
5. Select the round that has just ended
6. Click "Process Qualification"

The system will automatically:

- Determine which participants qualify for the next round
- Create entries for qualified participants in the next round
- Update the visibility of posts in the competition feed
