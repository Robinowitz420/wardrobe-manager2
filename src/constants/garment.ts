export const INVENTORY_STATES = [
  "Available",
  "Reserved",
  "Checked Out",
  "In Care",
] as const;

export const ITEM_TIERS = ["Everyday", "Statement", "High Risk", "Sacred"] as const;

export const GARMENT_LAYERS = ["Base", "Outer"] as const;

export const GARMENT_POSITIONS = ["Top", "Bottom"] as const;

export const GARMENT_CATEGORIES = [
  "Outerwear",
  "Top",
  "Bottom",
  "Dress",
  "Shoes",
  "Accessory",
  "Set",
  "Other",
] as const;

export const GARMENT_TYPES = [
  "Robe",
  "Jacket",
  "Coat",
  "Dress",
  "Skirt",
  "Pants",
  "Jeans",
  "Top",
  "Blouse",
  "Shirt",
  "Tee",
  "Sweater",
  "Jumpsuit",
  "Suit",
  "Hat",
  "Bag",
  "Scarf",
  "Belt",
  "Shoes",
  "Accessory",
  "Other",
] as const;

export const COLORS = [
  "Black",
  "White",
  "Cream",
  "Gray",
  "Brown",
  "Beige",
  "Tan",
  "Navy",
  "Blue",
  "Green",
  "Red",
  "Burgundy",
  "Maroon",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Metallic",
  "Silver",
  "Gold",
  "Multicolor",
] as const;

export const COLOR_GROUPS = [
  {
    label: "Neutrals",
    options: ["Black", "White", "Cream", "Gray", "Brown", "Beige", "Tan"],
  },
  {
    label: "Blues",
    options: ["Navy", "Blue"],
  },
  {
    label: "Greens",
    options: ["Green"],
  },
  {
    label: "Reds & pinks",
    options: ["Red", "Burgundy", "Maroon", "Pink"],
  },
  {
    label: "Purples",
    options: ["Purple"],
  },
  {
    label: "Warm",
    options: ["Yellow", "Orange"],
  },
  {
    label: "Metallics",
    options: ["Metallic", "Silver", "Gold"],
  },
  {
    label: "Special",
    options: ["Multicolor"],
  },
] as const;

export const TONES = [
  "Dark",
  "Dark Hues",
  "Light",
  "Gothic",
  "Muted",
  "Soft Contrast",
  "High Contrast",
  "Bold",
  "Metallic",
  "Monochromatic",
] as const;

export const TONE_GROUPS = [
  {
    label: "Light / dark",
    options: ["Dark", "Dark Hues", "Light", "Muted", "Bold"],
  },
  {
    label: "Contrast",
    options: ["Soft Contrast", "High Contrast"],
  },
  {
    label: "Style",
    options: ["Gothic", "Metallic", "Monochromatic"],
  },
] as const;

export const PATTERNS = [
  "Solid",
  "Stripe",
  "Pinstripe",
  "Plaid",
  "Polka Dot",
  "Floral",
  "Animal",
  "Snakeskin",
  "Graphic",
  "Geometric",
  "Textured",
  "Other",
] as const;

export const PATTERN_GROUPS = [
  {
    label: "Basics",
    options: ["Solid", "Stripe", "Pinstripe", "Plaid"],
  },
  {
    label: "Motifs",
    options: ["Polka Dot", "Floral", "Animal", "Snakeskin"],
  },
  {
    label: "Graphics",
    options: ["Graphic", "Geometric", "Textured"],
  },
] as const;

export const TEXTURES = [
  "Matte",
  "Shiny",
  "Smooth",
  "Lucious",
  "Plush",
  "Sheer",
  "Structured",
  "Stretchy",
  "Crisp",
  "Worn-in",
  "Other",
] as const;

export const TEXTURE_GROUPS = [
  {
    label: "Finish",
    options: ["Matte", "Shiny"],
  },
  {
    label: "Feel",
    options: ["Smooth", "Plush", "Sheer", "Lucious"],
  },
  {
    label: "Structure",
    options: ["Structured", "Stretchy", "Crisp"],
  },
  {
    label: "Wear",
    options: ["Worn-in"],
  },
] as const;

export const SILHOUETTES = [
  "Oversized",
  "Fitted",
  "Cropped",
  "Boxy",
  "Draped",
  "Straight",
  "A-Line",
  "Flared",
  "Tailored",
  "Other",
] as const;

export const SILHOUETTE_GROUPS = [
  {
    label: "Volume",
    options: ["Oversized", "Fitted", "Boxy"],
  },
  {
    label: "Cut",
    options: ["Cropped", "Straight", "Tailored"],
  },
  {
    label: "Drape",
    options: ["Draped"],
  },
  {
    label: "Skirt shape",
    options: ["A-Line", "Flared"],
  },
] as const;

export const LENGTHS = [
  "Micro",
  "Mini",
  "Midi",
  "Maxi",
  "Floor-length",
  "Other",
] as const;

export const LENGTH_GROUPS = [
  {
    label: "Short",
    options: ["Micro", "Mini"],
  },
  {
    label: "Medium",
    options: ["Midi"],
  },
  {
    label: "Long",
    options: ["Maxi", "Floor-length"],
  },
] as const;

export const FITS = [
  "True to size",
  "Runs small",
  "Runs large",
  "Relaxed",
  "Oversized",
  "Cropped",
  "Fitted",
  "Loose",
  "Medium",
  "Other",
] as const;

export const FIT_GROUPS = [
  {
    label: "Sizing",
    options: ["True to size", "Runs small", "Runs large"],
  },
  {
    label: "Shape",
    options: ["Relaxed", "Oversized", "Cropped", "Fitted", "Loose", "Medium"],
  },
] as const;

export const FABRICS = [
  "Cotton",
  "Denim",
  "Linen",
  "Silk",
  "Wool",
  "Cashmere",
  "Leather",
  "Patent Leather",
  "Snakeskin",
  "Faux Leather",
  "Suede",
  "Polyester",
  "Nylon",
  "Rayon",
  "Viscose",
  "Spandex",
  "Velvet",
  "Faux Fur",
  "Sequins",
  "Other",
] as const;

export const FABRIC_GROUPS = [
  {
    label: "Natural",
    options: ["Cotton", "Denim", "Linen", "Silk", "Wool", "Cashmere"],
  },
  {
    label: "Leather",
    options: ["Leather", "Patent Leather", "Faux Leather", "Suede", "Snakeskin"],
  },
  {
    label: "Synthetic",
    options: ["Polyester", "Nylon", "Rayon", "Viscose", "Spandex"],
  },
  {
    label: "Special",
    options: ["Velvet", "Faux Fur", "Sequins"],
  },
] as const;

export const CARE_INSTRUCTIONS = [
  "Wash/Dry",
  "Hand Wash",
  "Dry Clean Only",
  "Do Not Wash",
] as const;

export const CARE_INSTRUCTION_GROUPS = [
  {
    label: "Machine",
    options: ["Wash/Dry"],
  },
  {
    label: "Hand",
    options: ["Hand Wash"],
  },
  {
    label: "Dry clean",
    options: ["Dry Clean Only"],
  },
  {
    label: "Avoid",
    options: ["Do Not Wash"],
  },
] as const;

export const SPECIAL_FEATURES = [
  "Piping",
  "Collar",
  "Pronounced Collar",
  "Cut-outs",
  "Lining",
  "Shoulder pads",
  "Corset/boning",
  "Slit",
  "Ruching",
  "Sparkles",
  "Sequins",
  "Other",
] as const;

export const SPECIAL_FEATURE_GROUPS = [
  {
    label: "Structure",
    options: ["Piping", "Collar", "Pronounced Collar", "Lining", "Shoulder pads"],
  },
  {
    label: "Shape",
    options: ["Cut-outs", "Corset/boning", "Slit", "Ruching"],
  },
  {
    label: "Sparkle",
    options: ["Sparkles", "Sequins"],
  },
] as const;

export const ENCLOSURES = [
  "Buttons",
  "Zipper",
  "Zippers",
  "Wrap",
  "Hooks/Eyes",
  "Snaps",
  "Tie",
  "None",
  "Something is Missing",
  "Other",
] as const;

export const ENCLOSURE_GROUPS = [
  {
    label: "Closures",
    options: ["Buttons", "Zipper", "Zippers", "Hooks/Eyes", "Snaps"],
  },
  {
    label: "Wrap / tie",
    options: ["Wrap", "Tie"],
  },
  {
    label: "None",
    options: ["None"],
  },
  {
    label: "Unknown",
    options: ["Something is Missing"],
  },
] as const;

export const POCKETS = ["Yes", "POCKETS", "Fake", "Fake pocket", "Damaged", "None"] as const;

export const POCKET_GROUPS = [
  {
    label: "Real",
    options: ["Yes", "POCKETS"],
  },
  {
    label: "Fake",
    options: ["Fake", "Fake pocket"],
  },
  {
    label: "Issues",
    options: ["Damaged"],
  },
  {
    label: "None",
    options: ["None"],
  },
] as const;

export const ERAS = [
  "60s",
  "70s",
  "80s",
  "90s",
  "Y2K",
  "2010s",
  "NOW",
  "Contemporary",
  "Unknown",
] as const;

export const ERA_GROUPS = [
  {
    label: "Vintage",
    options: ["60s", "70s", "80s", "90s"],
  },
  {
    label: "Modern",
    options: ["Y2K", "2010s", "NOW", "Contemporary"],
  },
  {
    label: "Unknown",
    options: ["Unknown"],
  },
] as const;

export const VIBES = [
  "Romantic",
  "Goth",
  "Avant-garde",
  "Minimal",
  "Maximal",
  "Vintage",
  "Futurist",
  "Party",
  "Office",
  "Formal",
  "Casual",
  "Loungewear",
  "Performance",
  "Soft",
  "Hard",
  "Playful",
  "Sexy",
  "Cozy",
  "Powerful",
  "Cowgirl",
  "Sacred",
  "Androgynous",
  "Street",
  "Grandpa",
  "Daddy",
  "Classic",
  "Gentleman",
  "Sleepover",
  "Nautical",
  "Main Character",
  "Trendy",
  "Glam",
  "Club Kid",
  "Boss Bitch",
  "Cunt",
  "Acid Trip",
  "Cougar",
  "Y2K",
  "Showgirl",
  "Other",
] as const;

export const VIBE_GROUPS = [
  {
    label: "Aesthetic",
    options: ["Romantic", "Goth", "Avant-garde", "Minimal", "Maximal", "Vintage", "Futurist"],
  },
  {
    label: "Occasion",
    options: ["Party", "Office", "Formal", "Casual", "Loungewear", "Performance"],
  },
  {
    label: "Energy",
    options: ["Soft", "Hard", "Playful", "Sexy", "Cozy", "Powerful", "Sacred"],
  },
  {
    label: "Archetype",
    options: ["Cowgirl", "Androgynous", "Street", "Grandpa", "Daddy", "Gentleman"],
  },
  {
    label: "Vibe",
    options: [
      "Classic",
      "Sleepover",
      "Nautical",
      "Main Character",
      "Trendy",
      "Glam",
      "Club Kid",
      "Boss Bitch",
      "Acid Trip",
      "Cougar",
      "Y2K",
      "Showgirl",
      "Cunt",
    ],
  },
] as const;

export type InventoryState = (typeof INVENTORY_STATES)[number];
export type ItemTier = (typeof ITEM_TIERS)[number];
export type GarmentLayer = (typeof GARMENT_LAYERS)[number];
export type GarmentPosition = (typeof GARMENT_POSITIONS)[number];
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
export type GarmentType = (typeof GARMENT_TYPES)[number];
