import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clothing: defineTable({
    userId: v.string(),
    imageUrl: v.string(),
    category: v.string(),
    color: v.string(),
    pattern: v.string(),
    season: v.string(),
    formality: v.string(),
    brand: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index("by_userId", ["userId"]),

  userProfiles: defineTable({
    userId: v.string(),
    bodyType: v.optional(v.string()),
    skinTone: v.optional(v.string()),
    budgetTier: v.optional(v.string()),
    budgetMax: v.optional(v.float64()),
    stylePrefs: v.array(v.string()),
    events: v.array(v.string()),
    updatedAt: v.float64(),
  }).index("by_userId", ["userId"]),

  posts: defineTable({
    userId: v.string(),
    userName: v.string(),
    userImage: v.optional(v.string()),
    caption: v.optional(v.string()),
    coverImage: v.string(),
    clothingIds: v.array(v.string()),
    likesCount: v.float64(),
    isPublic: v.boolean(),
    createdAt: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_isPublic_and_createdAt", ["isPublic", "createdAt"]),

  likes: defineTable({
    userId: v.string(),
    postId: v.string(),
    createdAt: v.float64(),
  })
    .index("by_userId_postId", ["userId", "postId"])
    .index("by_postId", ["postId"]),
});
