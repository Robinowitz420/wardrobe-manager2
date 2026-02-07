import { z } from "zod";

import {
  COLORS,
  COLOR_TONES,
  ENCLOSURES,
  ERAS,
  FABRIC_TYPES,
  GARMENT_CATEGORIES,
  GARMENT_LAYERS,
  GARMENT_POSITIONS,
  GARMENT_TYPES,
  INVENTORY_STATES,
  ITEM_TIERS,
  LAUNDRY_DETAILS,
  PATTERNS,
  POCKETS,
  SPECIAL_FEATURES,
  SIZES,
  TEXTURES,
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
  position: z.array(z.enum(GARMENT_POSITIONS)).default([]),

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

  // Size & fit
  size: z.string().optional(),
  fit: z.array(z.enum(SIZES)).default([]),
  specialFitNotes: z.string().optional(),

  // Aesthetic metadata
  colors: z.array(z.enum(COLORS)).default([]),

  colorTones: z.array(z.enum(COLOR_TONES)).default([]),

  pockets: z.array(z.enum(POCKETS)).default([]),
  enclosures: z.array(z.enum(ENCLOSURES)).default([]),
  patterns: z.array(z.enum(PATTERNS)).default([]),
  specialFeatures: z.array(z.enum(SPECIAL_FEATURES)).default([]),
  fabricTypes: z.array(z.enum(FABRIC_TYPES)).default([]),
  texture: z.array(z.enum(TEXTURES)).default([]),
  laundryDetails: z.array(z.enum(LAUNDRY_DETAILS)).default([]),

  vibes: z.array(z.enum(VIBES)).default([]),

  // Era & story
  era: z.array(z.enum(ERAS)).default([]),
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
