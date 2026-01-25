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
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Metallic",
  "Silver",
  "Multicolor",
] as const;

export const TONES = [
  "Dark",
  "Light",
  "Muted",
  "Soft Contrast",
  "High Contrast",
  "Bold",
] as const;

export const PATTERNS = [
  "Solid",
  "Stripe",
  "Plaid",
  "Polka Dot",
  "Floral",
  "Animal",
  "Graphic",
  "Geometric",
  "Textured",
  "Other",
] as const;

export const TEXTURES = [
  "Matte",
  "Shiny",
  "Smooth",
  "Plush",
  "Sheer",
  "Structured",
  "Stretchy",
  "Crisp",
  "Worn-in",
  "Other",
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

export const LENGTHS = [
  "Micro",
  "Mini",
  "Midi",
  "Maxi",
  "Floor-length",
  "Other",
] as const;

export const FITS = [
  "True to size",
  "Runs small",
  "Runs large",
  "Relaxed",
  "Oversized",
  "Cropped",
  "Fitted",
  "Other",
] as const;

export const FABRICS = [
  "Cotton",
  "Denim",
  "Linen",
  "Silk",
  "Wool",
  "Cashmere",
  "Leather",
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

export const CARE_INSTRUCTIONS = [
  "Wash/Dry",
  "Hand Wash",
  "Dry Clean Only",
  "Do Not Wash",
] as const;

export const SPECIAL_FEATURES = [
  "Piping",
  "Collar",
  "Cut-outs",
  "Lining",
  "Shoulder pads",
  "Corset/boning",
  "Slit",
  "Ruching",
  "Other",
] as const;

export const ENCLOSURES = [
  "Buttons",
  "Zipper",
  "Wrap",
  "Hooks/Eyes",
  "Snaps",
  "Tie",
  "None",
  "Other",
] as const;

export const POCKETS = ["Yes", "Fake", "Damaged", "None"] as const;

export const ERAS = [
  "60s",
  "70s",
  "80s",
  "90s",
  "Y2K",
  "2010s",
  "Contemporary",
  "Unknown",
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
  "Other",
] as const;

export type InventoryState = (typeof INVENTORY_STATES)[number];
export type ItemTier = (typeof ITEM_TIERS)[number];
export type GarmentLayer = (typeof GARMENT_LAYERS)[number];
export type GarmentPosition = (typeof GARMENT_POSITIONS)[number];
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
export type GarmentType = (typeof GARMENT_TYPES)[number];
