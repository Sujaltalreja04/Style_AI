import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get community feed (public posts, sorted by createdAt desc, up to 50 items)
export const getPublicFeed = query({
  args: {
    userId: v.optional(v.string()), // Optional, in case we want to check which posts the user has liked
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_isPublic_and_createdAt", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(50);

    // If userId is provided, we can fetch all likes for this user on these posts to mark them as liked
    let likedPostIds = new Set<string>();
    if (args.userId) {
      const userLikes = await ctx.db
        .query("likes")
        .withIndex("by_userId_postId", (q) => q.eq("userId", args.userId!))
        .collect();
      likedPostIds = new Set(userLikes.map((like) => like.postId));
    }

    return posts.map((post) => ({
      ...post,
      id: post._id,
      liked: likedPostIds.has(post._id),
    }));
  },
});

// Create/share a new post
export const create = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    userImage: v.optional(v.string()),
    caption: v.optional(v.string()),
    clothingIds: v.array(v.string()), // Array of clothing ID strings
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.clothingIds.length === 0) {
      throw new Error("No clothing items selected");
    }

    // Resolve the cover image from the first clothing item, verifying ownership
    const firstItem = await ctx.db.get(args.clothingIds[0] as Id<"clothing">);
    if (!firstItem || firstItem.userId !== args.userId) {
      throw new Error("First clothing item not found or unauthorized");
    }

    const now = Date.now();
    const id = await ctx.db.insert("posts", {
      userId: args.userId,
      userName: args.userName,
      userImage: args.userImage,
      caption: args.caption,
      coverImage: firstItem.imageUrl,
      clothingIds: args.clothingIds,
      likesCount: 0,
      isPublic: args.isPublic ?? true,
      createdAt: now,
    });

    const post = await ctx.db.get(id);
    return {
      ...post,
      id,
    };
  },
});
