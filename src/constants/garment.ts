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
  "Tops",
  "Bottoms",
  "Dresses",
  "Jumpsuits & Rompers",
  "Outerwear",
  "Activewear",
  "Swimwear",
  "Shoes",
  "Accessories",
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

export const GARMENT_TYPE_BUTTONS = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Jumpsuits & Rompers",
  "Outerwear",
  "Activewear",
  "Swimwear",
  "Shoes",
  "Accessories",
] as const;

export const GARMENT_TYPE_BUTTON_IMAGE_FILES = [
  "AAAAAAAAAA_r1_c1_processed_by_imagy.jpg",
  "AAAAAAAAAA_r1_c2_processed_by_imagy.jpg",
  "AAAAAAAAAA_r1_c3_processed_by_imagy.jpg",
  "AAAAAAAAAA_r2_c1_processed_by_imagy.jpg",
  "AAAAAAAAAA_r2_c2_processed_by_imagy.jpg",
  "AAAAAAAAAA_r2_c3_processed_by_imagy.jpg",
  "AAAAAAAAAA_r3_c1_processed_by_imagy.jpg",
  "AAAAAAAAAA_r3_c2_processed_by_imagy.jpg",
  "AAAAAAAAAA_r3_c3_processed_by_imagy.jpg",
] as const;

export const GARMENT_TYPE_BUTTON_IMAGE_MAP: Record<(typeof GARMENT_TYPE_BUTTONS)[number], string> = {
  Tops: "Tops.jpg",
  Bottoms: "Bottoms.jpg",
  Dresses: "Dresses.jpg",
  "Jumpsuits & Rompers": "Jumpsuitsandrompers.jpg",
  Outerwear: "outerwear.jpg",
  Activewear: "activewear.jpg",
  Swimwear: "swimwear.jpg",
  Shoes: "shoes.jpg",
  Accessories: "accessories.jpg",
};

export const COLOR_TONES = [
  "BOLD",
  "Dark",
  "DarkHues",
  "Gothic",
  "High contrast",
  "Light",
  "Metallic",
  "Monochromatic",
  "Muted",
  "Soft Contrast",
] as const;

export const COLOR_TONE_IMAGE_MAP: Record<(typeof COLOR_TONES)[number], string> = {
  BOLD: "BOLD.jpg",
  Dark: "Dark.jpg",
  DarkHues: "DarkHues.jpg",
  Gothic: "Gothic.jpg",
  "High contrast": "High contrast.jpg",
  Light: "Light.jpg",
  Metallic: "Metallic.jpg",
  Monochromatic: "Monochromatic.jpg",
  Muted: "Muted.jpg",
  "Soft Contrast": "Soft Contrast.jpg",
};

export const POCKETS = [
  "No Pockets",
  "Patch Pockets",
  "Slash Pockets",
  "Welt Pockets",
  "Kangaroo Pocket",
  "Cargo Pockets",
  "Hidden Pockets",
  "Zippered Pockets",
] as const;

export const POCKET_BUTTON_IMAGE_MAP: Record<(typeof POCKETS)[number], string> = {
  "No Pockets": "AAAAAAAAAA_r2_c2_processed_by_imagy.jpg",
  "Patch Pockets": "AAAAAAAAAA_r2_c3_processed_by_imagy.jpg",
  "Slash Pockets": "AAAAAAAAAA_r2_c4_processed_by_imagy.jpg",
  "Welt Pockets": "AAAAAAAAAA_r2_c5_processed_by_imagy.jpg",
  "Kangaroo Pocket": "AAAAAAAAAA_r3_c2_processed_by_imagy.jpg",
  "Cargo Pockets": "AAAAAAAAAA_r3_c3_processed_by_imagy.jpg",
  "Hidden Pockets": "AAAAAAAAAA_r3_c4_processed_by_imagy.jpg",
  "Zippered Pockets": "AAAAAAAAAA_r3_c5_processed_by_imagy.jpg",
};

export const ENCLOSURES = [
  "Buttons",
  "Zipper",
  "Snaps",
  "Hooks & Eyes",
  "Laces",
  "Velcro",
  "Buckles",
  "Ties",
  "Toggles",
  "Magnetic Closure",
  "Pull-On (No Closure)",
] as const;

export const ENCLOSURE_BUTTON_IMAGE_MAP: Record<(typeof ENCLOSURES)[number], string> = {
  Buttons: "AAAAAAAAAA_r2_c2_processed_by_imagy.jpg",
  Zipper: "AAAAAAAAAA_r2_c3_processed_by_imagy.jpg",
  Snaps: "AAAAAAAAAA_r2_c4_processed_by_imagy.jpg",
  "Hooks & Eyes": "AAAAAAAAAA_r2_c5_processed_by_imagy.jpg",
  Laces: "AAAAAAAAAA_r3_c2_processed_by_imagy.jpg",
  Velcro: "AAAAAAAAAA_r3_c3_processed_by_imagy.jpg",
  Buckles: "AAAAAAAAAA_r3_c4_processed_by_imagy.jpg",
  Ties: "AAAAAAAAAA_r3_c5_processed_by_imagy.jpg",
  Toggles: "AAAAAAAAAA_r4_c2_processed_by_imagy.jpg",
  "Magnetic Closure": "AAAAAAAAAA_r4_c3_processed_by_imagy.jpg",
  "Pull-On (No Closure)": "AAAAAAAAAA_r4_c4_processed_by_imagy.jpg",
};

export const PATTERNS = [
  "Solid",
  "Stripes",
  "Polka Dots",
  "Floral",
  "Plaid",
  "Checkered",
  "Geometric",
  "Abstract",
  "Animal Print",
  "Tie-Dye",
  "Paisley",
  "Houndstooth",
  "Herringbone",
  "Camo",
  "Argyle",
] as const;

export const SPECIAL_FEATURES = [
  "Reversible",
  "Convertible",
  "Adjustable",
  "Detachable Elements",
  "Built-in Belt",
  "Hooded",
  "Lined",
  "Padded",
  "Peplum",
  "Cutouts",
  "Ruffles",
  "Pleats",
  "Drawstring",
  "Elastic Waist",
  "Pockets (feature)",
] as const;

export const FABRIC_TYPES = [
  "Cotton",
  "Linen",
  "Silk",
  "Wool",
  "Cashmere",
  "Denim",
  "Leather",
  "Suede",
  "Polyester",
  "Nylon",
  "Spandex",
  "Rayon",
  "Velvet",
  "Satin",
  "Chiffon",
  "Tweed",
  "Corduroy",
  "Jersey",
  "Fleece",
  "Mesh",
] as const;

export const TEXTURES = [
  "Smooth",
  "Textured",
  "Ribbed",
  "Cable Knit",
  "Quilted",
  "Embossed",
  "Fuzzy",
  "Slub",
  "Brushed",
  "Distressed",
  "Crinkled",
  "Nubby",
  "Waffle Weave",
] as const;

export const LAUNDRY_DETAILS = [
  "Machine Wash Cold",
  "Hand Wash Only",
  "Dry Clean Only",
  "Tumble Dry Low",
  "Air Dry",
  "Do Not Bleach",
  "Iron Low Heat",
  "Iron Medium Heat",
  "Delicate Cycle",
  "Wash Separately",
] as const;

export const COLORS = [
  "Black",
  "White",
  "Gray",
  "Brown",
  "Navy",
  "Blue",
  "Green",
  "Red",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Multicolor",
] as const;

export const COLOR_GROUPS = [
  {
    label: "Neutrals",
    options: ["Black", "White", "Gray", "Brown"],
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
    options: ["Red", "Pink"],
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
    label: "Special",
    options: ["Multicolor"],
  },
] as const;


export const SIZES = [
  "True to size",
  "Runs small",
  "Runs large",
  "Relaxed",
  "Oversized",
  "Fitted",
  "Loose",
] as const;

export const SIZE_GROUPS = [
  {
    label: "Sizing",
    options: ["True to size", "Runs small", "Runs large"],
  },
  {
    label: "Fit",
    options: ["Relaxed", "Oversized", "Fitted", "Loose"],
  },
] as const;


export const ERAS = [
  "1940's",
  "1950's",
  "60s",
  "70s",
  "80s",
  "90s",
  "Y2K",
  "Contemporary",
] as const;

export const ERA_GROUPS = [] as const;

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
  "Edgy",
  "Preppy",
  "Bohemian",
  "Athletic",
  "Corporate",
  "Grunge",
  "Ethereal",
  "Punk",
  "Luxury",
  "Artsy",
  "Retro",
  "Tomboy",
  "Baddie",
  "Clean Girl",
  "Cottage Core",
  "Dark Academia",
] as const;

export const VIBE_GROUPS = [
  {
    label: "Vibes",
    options: VIBES,
  },
] as const;

export type InventoryState = (typeof INVENTORY_STATES)[number];
export type ItemTier = (typeof ITEM_TIERS)[number];
export type GarmentLayer = (typeof GARMENT_LAYERS)[number];
export type GarmentPosition = (typeof GARMENT_POSITIONS)[number];
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
export type GarmentType = (typeof GARMENT_TYPES)[number];
export type Size = (typeof SIZES)[number];
export type Era = (typeof ERAS)[number];
export type Vibe = (typeof VIBES)[number];
