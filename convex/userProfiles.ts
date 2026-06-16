import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user profile by userId
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    return {
      ...profile,
      id: profile._id,
    };
  },
});

// Save (create or update) user profile
export const save = mutation({
  args: {
    userId: v.string(),
    bodyType: v.optional(v.string()),
    skinTone: v.optional(v.string()),
    budgetTier: v.optional(v.string()),
    budgetMax: v.optional(v.number()),
    stylePrefs: v.optional(v.array(v.string())),
    events: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const now = Date.now();

    const data = {
      bodyType: args.bodyType,
      skinTone: args.skinTone,
      budgetTier: args.budgetTier,
      budgetMax: args.budgetMax,
      stylePrefs: args.stylePrefs ?? [],
      events: args.events ?? [],
      updatedAt: now,
    };

    if (existing) {
      // Update
      await ctx.db.patch(existing._id, data);
      const updated = await ctx.db.get(existing._id);
      return {
        ...updated,
        id: existing._id,
      };
    } else {
      // Create
      const id = await ctx.db.insert("userProfiles", {
        userId: args.userId,
        ...data,
      });
      const created = await ctx.db.get(id);
      return {
        ...created,
        id,
      };
    }
  },
});
