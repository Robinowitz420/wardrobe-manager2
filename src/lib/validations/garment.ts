import { z } from "zod";

import {
  COLORS,
  FABRIC_TYPES,
  GARMENT_CATEGORIES,
  GARMENT_TYPES,
  INVENTORY_STATES,
  PATTERNS,
  POCKETS,
  SPECIAL_FEATURES,
  VIBES,
} from "@/constants/garment";

export const garmentPhotoSchema = z.object({
  id: z.string().min(1),
  dataUrl: z.string().min(1).optional(),
  src: z.string().min(1).optional(),
  isPrimary: z.boolean(),
  fileName: z.string().optional(),
}).refine((p) => Boolean(p.dataUrl || p.src), { message: "Photo must have dataUrl or src" });

export const garmentReviewSchema = z.object({
  id: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});

export const garmentSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  state: z.enum(INVENTORY_STATES),

  completionStatus: z.enum(["DRAFT", "COMPLETE"]).default("COMPLETE"),
  intakeSessionId: z.string().min(1).optional(),
  intakeOrder: z.number().int().nonnegative().optional(),

  photos: z.array(garmentPhotoSchema).min(1).max(5),

  // Vision-assisted suggestions (always editable)
  suggested: z
    .object({
      garmentType: z.enum(GARMENT_TYPES).optional(),
      category: z.enum(GARMENT_CATEGORIES).optional(),
      dominantColor: z.enum(COLORS).optional(),
      secondaryColor: z.enum(COLORS).optional(),
      notes: z.string().optional(),
    })
    .default({}),

  // Core identity
  sku: z.string().min(1).optional(),
  garmentType: z.enum(GARMENT_TYPES).optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  dateAdded: z.string().min(1),

  // Size
  size: z.string().optional(),

  // Aesthetic metadata
  colors: z.array(z.enum(COLORS)).default([]),

  pockets: z.array(z.enum(POCKETS)).default([]),
  patterns: z.array(z.enum(PATTERNS)).default([]),
  specialFeatures: z.array(z.enum(SPECIAL_FEATURES)).default([]),
  fabricTypes: z.array(z.enum(FABRIC_TYPES)).default([]),

  vibes: z.array(z.enum(VIBES)).default([]),

  // Story
  stories: z.string().optional(),

  reviews: z.array(garmentReviewSchema).default([]),

  // Economics (manual)
  glitcoinBorrow: z.number().int().nonnegative().optional(),
  glitcoinLustLost: z.number().int().nonnegative().optional(),

  // Notes
  internalNotes: z.string().optional(),
});

export type Garment = z.infer<typeof garmentSchema>;
export type GarmentPhoto = z.infer<typeof garmentPhotoSchema>;
export type GarmentReview = z.infer<typeof garmentReviewSchema>;

export const garmentCreateInputSchema = garmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GarmentCreateInput = z.infer<typeof garmentCreateInputSchema>;
