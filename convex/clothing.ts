import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all clothing items for a user
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const clothes = await ctx.db
      .query("clothing")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Map _id to id to maintain compatibility with existing frontend models
    return clothes.map((item) => ({
      ...item,
      id: item._id,
    }));
  },
});

// Get a specific clothing item by ID
export const getById = query({
  args: { id: v.id("clothing"), userId: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== args.userId) {
      return null;
    }
    return {
      ...item,
      id: item._id,
    };
  },
});

// Create a new clothing item
export const create = mutation({
  args: {
    userId: v.string(),
    imageUrl: v.string(),
    category: v.string(),
    color: v.string(),
    pattern: v.optional(v.string()),
    season: v.optional(v.string()),
    formality: v.optional(v.string()),
    brand: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("clothing", {
      userId: args.userId,
      imageUrl: args.imageUrl,
      category: args.category,
      color: args.color,
      pattern: args.pattern ?? "solid",
      season: args.season ?? "all",
      formality: args.formality ?? "casual",
      brand: args.brand,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    const item = await ctx.db.get(id);
    if (!item) {
      throw new Error("Failed to retrieve created clothing item");
    }

    return {
      ...item,
      id: item._id,
    };
  },
});

// Update a clothing item
export const update = mutation({
  args: {
    id: v.id("clothing"),
    userId: v.string(),
    category: v.optional(v.string()),
    color: v.optional(v.string()),
    pattern: v.optional(v.string()),
    season: v.optional(v.string()),
    formality: v.optional(v.string()),
    brand: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== args.userId) {
      throw new Error("Item not found or unauthorized");
    }

    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };
    if (args.category !== undefined) updates.category = args.category;
    if (args.color !== undefined) updates.color = args.color;
    if (args.pattern !== undefined) updates.pattern = args.pattern;
    if (args.season !== undefined) updates.season = args.season;
    if (args.formality !== undefined) updates.formality = args.formality;
    if (args.brand !== undefined) updates.brand = args.brand;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.id, updates);

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      throw new Error("Failed to retrieve updated item");
    }

    return {
      ...updated,
      id: updated._id,
    };
  },
});
