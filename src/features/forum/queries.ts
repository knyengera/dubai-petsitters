import { entities } from "@/lib/data/entities";

export const forumQueries = {
  threads: (order = "-created_at") => entities.ForumThread.list(order),
  thread: (id: string) => entities.ForumThread.get(id),
  comments: (threadId: string) =>
    entities.ForumComment.filter({ thread_id: threadId }, "created_at"),
};
