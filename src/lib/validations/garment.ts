import { z } from "zod";

import {
  CARE_INSTRUCTIONS,
  COLORS,
  ENCLOSURES,
  ERAS,
  FABRICS,
  FITS,
  GARMENT_CATEGORIES,
  GARMENT_LAYERS,
  GARMENT_POSITIONS,
  GARMENT_TYPES,
  INVENTORY_STATES,
  ITEM_TIERS,
  LENGTHS,
  PATTERNS,
  POCKETS,
  SILHOUETTES,
  SPECIAL_FEATURES,
  TEXTURES,
  TONES,
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

  layer: z.enum(GARMENT_LAYERS).optional(),
  position: z.enum(GARMENT_POSITIONS).optional(),

  completionStatus: z.enum(["DRAFT", "COMPLETE"]).default("COMPLETE"),
  intakeSessionId: z.string().min(1).optional(),
  intakeOrder: z.number().int().nonnegative().optional(),

  photos: z.array(garmentPhotoSchema).min(1).max(1),

  // Vision-assisted suggestions (always editable)
  suggested: z
    .object({
      garmentType: z.enum(GARMENT_TYPES).optional(),
      category: z.enum(GARMENT_CATEGORIES).optional(),
      dominantColor: z.enum(COLORS).optional(),
      secondaryColor: z.enum(COLORS).optional(),
      pattern: z.enum(PATTERNS).optional(),
      texture: z.enum(TEXTURES).optional(),
      silhouette: z.enum(SILHOUETTES).optional(),
      length: z.enum(LENGTHS).optional(),
      notes: z.string().optional(),
    })
    .default({}),

  // Core identity
  sku: z.string().min(1).optional(),
  garmentType: z.string().min(1).optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  dateAdded: z.string().min(1),

  // Size & fit
  size: z.string().optional(),
  fit: z.array(z.string().min(1)).default([]),
  specialFitNotes: z.string().optional(),

  // Material & care (risk-critical: never inferred)
  fabrics: z.array(z.string().min(1)).default([]),
  care: z.array(z.string().min(1)).default([]),
  careNotes: z.string().optional(),

  // Aesthetic metadata
  vibes: z.array(z.string().min(1)).default([]),
  colors: z.array(z.string().min(1)).default([]),
  tones: z.array(z.string().min(1)).default([]),
  pattern: z.array(z.string().min(1)).default([]),
  texture: z.array(z.string().min(1)).default([]),

  silhouette: z.array(z.string().min(1)).default([]),
  length: z.array(z.string().min(1)).default([]),

  // Construction details
  specialFeatures: z.array(z.string().min(1)).default([]),
  enclosures: z.array(z.string().min(1)).default([]),
  pockets: z.array(z.string().min(1)).default([]),

  // Era & story
  era: z.array(z.string().min(1)).default([]),
  stories: z.string().optional(),

  reviews: z.array(garmentReviewSchema).default([]),

  // Economics (manual)
  glitcoinBorrow: z.number().int().nonnegative().optional(),
  glitcoinLustLost: z.number().int().nonnegative().optional(),
  tier: z.array(z.string().min(1)).default([]),

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
