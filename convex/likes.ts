import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Check if a post is liked by a specific user
export const checkLiked = query({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .unique();
    return !!like;
  },
});

// Toggle like (Like / Unlike) on a post
export const toggle = mutation({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // 1. Check if the post exists
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // 2. Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .unique();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      
      // Decrement likesCount (ensuring it doesn't go below 0)
      const newLikesCount = Math.max(0, post.likesCount - 1);
      await ctx.db.patch(args.postId, { likesCount: newLikesCount });
      
      return { liked: false, likesCount: newLikesCount };
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId: args.userId,
        postId: args.postId,
        createdAt: Date.now(),
      });
      
      // Increment likesCount
      const newLikesCount = post.likesCount + 1;
      await ctx.db.patch(args.postId, { likesCount: newLikesCount });
      
      return { liked: true, likesCount: newLikesCount };
    }
  },
});
