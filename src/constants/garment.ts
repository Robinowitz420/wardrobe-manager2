export const INVENTORY_STATES = [
  "Available",
  "Reserved",
  "Checked Out",
  "In Care",
] as const;

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

export const POCKETS = [
  "Pockets",
  "No Pockets",
] as const;

export const POCKET_BUTTON_IMAGE_MAP: Record<(typeof POCKETS)[number], string> = {
  "Pockets": "AAAAAAAAAA_r2_c2_processed_by_imagy.jpg",
  "No Pockets": "AAAAAAAAAA_r2_c3_processed_by_imagy.jpg",
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
  "Piping",
  "Pronounced Collar",
  "Sequins",
  "Sparkles",
  "Beadwork",
  "Pearls",
  "Studs",
  "Fringe",
  "Pompom",
  "Applique",
  "Fur trim",
  "Graffiti",
  "Lace",
  "Embroidery",
  "Not Special At All",
  "Jewels",
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
] as const;

export const VIBE_GROUPS = [
  {
    label: "Vibes",
    options: VIBES,
  },
] as const;

export type InventoryState = (typeof INVENTORY_STATES)[number];
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
export type GarmentType = (typeof GARMENT_TYPES)[number];
export type Vibe = (typeof VIBES)[number];
