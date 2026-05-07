import { db } from '@/lib/db';
import { notifications, teams, users, comments } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export type NotificationType =
  | 'comment'
  | 'reply'
  | 'like'
  | 'tier-list'
  | 'announcement'
  | 'follow-cta';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  teamId?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  // Don't notify yourself.
  if (input.actorUserId && input.actorUserId === input.userId) return null;
  const [row] = await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    actorUserId: input.actorUserId ?? null,
    actorName: input.actorName ?? null,
    teamId: input.teamId ?? null,
  }).returning();
  return row;
}

/**
 * Notify the team owner that someone commented on their team. If `parentCommentId`
 * is set, we ALSO notify the parent comment's author (a reply chain). The team
 * owner is skipped if they're the same as the actor; same for the parent author.
 */
export async function notifyComment(opts: {
  teamId: string;
  commentId: string;
  parentCommentId: string | null;
  actorUserId: string;
}) {
  const [team] = await db.select({
    id: teams.id, userId: teams.userId, name: teams.name, isPublic: teams.isPublic,
  }).from(teams).where(eq(teams.id, opts.teamId)).limit(1);
  if (!team || !team.isPublic) return;

  const [actor] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, opts.actorUserId)).limit(1);
  const actorName = actor?.name || 'Someone';
  const link = `/teams/${opts.teamId}#comment-${opts.commentId}`;

  // Notify team owner about the new top-level comment / reply.
  if (team.userId && team.userId !== opts.actorUserId) {
    await createNotification({
      userId: team.userId,
      type: 'comment',
      title: `${actorName} commented on "${team.name}"`,
      link,
      actorUserId: opts.actorUserId,
      actorName,
      teamId: team.id,
    });
  }

  // If reply, also notify the parent comment author (skip if same as team owner — they already got one).
  if (opts.parentCommentId) {
    const [parent] = await db.select({ userId: comments.userId }).from(comments)
      .where(eq(comments.id, opts.parentCommentId)).limit(1);
    if (parent?.userId && parent.userId !== opts.actorUserId && parent.userId !== team.userId) {
      await createNotification({
        userId: parent.userId,
        type: 'reply',
        title: `${actorName} replied to your comment`,
        link,
        actorUserId: opts.actorUserId,
        actorName,
        teamId: team.id,
      });
    }
  }
}

/**
 * Notify the team owner that someone upvoted their team. Only fires for +1
 * (downvotes don't notify — they're not the kind of news worth surfacing).
 * No-ops if the upvoter is the owner or if the team has no owner.
 */
export async function notifyUpvote(opts: {
  teamId: string;
  actorUserId: string;
}) {
  const [team] = await db.select({
    id: teams.id, userId: teams.userId, name: teams.name, isPublic: teams.isPublic,
  }).from(teams).where(eq(teams.id, opts.teamId)).limit(1);
  if (!team || !team.userId || !team.isPublic) return;
  if (team.userId === opts.actorUserId) return;

  // Coalesce: if there's already an unread "like" notif for this team, skip
  // creating another one. Owners get one ping per "batch of upvotes since last
  // checked" instead of one ping per upvote.
  const existingUnread = await db.select({ id: notifications.id })
    .from(notifications)
    .where(and(
      eq(notifications.userId, team.userId),
      eq(notifications.type, 'like'),
      eq(notifications.teamId, team.id),
      isNull(notifications.readAt),
    ))
    .limit(1);
  if (existingUnread.length > 0) return;

  const [actor] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, opts.actorUserId)).limit(1);
  const actorName = actor?.name || 'Someone';

  await createNotification({
    userId: team.userId,
    type: 'like',
    title: `${actorName} upvoted "${team.name}"`,
    link: `/teams/${team.id}`,
    actorUserId: opts.actorUserId,
    actorName,
    teamId: team.id,
  });
}
