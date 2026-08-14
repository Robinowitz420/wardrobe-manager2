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
  "So Many Pockets",
  "Just One Pocket",
  "Hidden Pocket",
  "Fake Pocket",
] as const;

export const POCKET_BUTTON_IMAGE_MAP: Partial<Record<(typeof POCKETS)[number], string>> = {
  "Pockets": "AAAAAAAAAA_r2_c2_processed_by_imagy.jpg",
  "No Pockets": "AAAAAAAAAA_r2_c3_processed_by_imagy.jpg",
};

export const ENCLOSURES = [
  "Buttons",
  "Zippers",
  "Snaps",
  "Hook and Eye",
  "Velcro",
  "Drawstring",
  "Ribbon",
  "Belt",
  "Safety Pin",
  "Pin",
  "Clip",
  "Wrap Over Panel",
  "Rope/Cord",
  "Buckle",
  "Latch",
  "Lacing",
  "Elastic Band",
  "Chains",
  "Magnetic",
] as const;

export const LAUNDRY_INSTRUCTIONS = [
  "Machine Wash Cold",
  "Machine Wash Warm",
  "Hand Wash",
  "Dry Clean Only",
  "Do Not Wash",
  "Spot Clean",
  "Tumble Dry Low",
  "Do Not Tumble Dry",
  "Hang Dry",
  "Lay Flat to Dry",
  "Iron Low",
  "Do Not Iron",
  "Do Not Bleach",
] as const;

export const PATTERNS = [
  "Solid",
  "Stripes",
  "Pinstripe",
  "Polka Dots",
  "Floral",
  "Plaid",
  "Tartan",
  "Gingham",
  "Checkered",
  "Geometric",
  "Chevron",
  "Abstract",
  "Animal Print",
  "Leopard",
  "Zebra",
  "Cow Print",
  "Snakeskin",
  "Tie-Dye",
  "Ombre",
  "Colorblock",
  "Paisley",
  "Houndstooth",
  "Herringbone",
  "Camo",
  "Argyle",
  "Damask",
  "Toile",
  "Hearts",
  "Stars",
  "Graphic Print",
] as const;

/**
 * CSS `background-image` values used to preview each pattern on its chip.
 * Sized against a 1rem grid so chips of any size look consistent.
 */
export const PATTERN_BACKGROUNDS: Record<string, string> = {
  Solid: "linear-gradient(0deg, #cbd5e1, #cbd5e1)",
  Stripes:
    "repeating-linear-gradient(90deg, #64748b 0 6px, #f8fafc 6px 12px)",
  Pinstripe:
    "repeating-linear-gradient(90deg, #1e293b 0 2px, #e2e8f0 2px 10px)",
  "Polka Dots":
    "radial-gradient(#0f172a 22%, transparent 24%), radial-gradient(#0f172a 22%, transparent 24%), linear-gradient(0deg, #f8fafc, #f8fafc)",
  Floral:
    "radial-gradient(#f472b6 26%, transparent 28%), radial-gradient(#84cc16 22%, transparent 24%), linear-gradient(0deg, #fdf2f8, #fdf2f8)",
  Plaid:
    "repeating-linear-gradient(0deg, rgba(15,23,42,.45) 0 4px, transparent 4px 16px), repeating-linear-gradient(90deg, rgba(15,23,42,.45) 0 4px, transparent 4px 16px), linear-gradient(0deg, #b91c1c, #b91c1c)",
  Tartan:
    "repeating-linear-gradient(0deg, rgba(250,250,250,.7) 0 2px, transparent 2px 14px), repeating-linear-gradient(90deg, rgba(15,23,42,.6) 0 6px, transparent 6px 18px), linear-gradient(0deg, #166534, #166534)",
  Gingham:
    "repeating-linear-gradient(0deg, rgba(37,99,235,.45) 0 8px, transparent 8px 16px), repeating-linear-gradient(90deg, rgba(37,99,235,.45) 0 8px, transparent 8px 16px), linear-gradient(0deg, #ffffff, #ffffff)",
  Checkered:
    "conic-gradient(#0f172a 0 25%, #f8fafc 0 50%, #0f172a 0 75%, #f8fafc 0)",
  Geometric:
    "repeating-conic-gradient(#0ea5e9 0 25%, #f8fafc 0 50%)",
  Chevron:
    "repeating-linear-gradient(135deg, #0f172a 0 6px, #f8fafc 6px 12px), repeating-linear-gradient(45deg, #0f172a 0 6px, #f8fafc 6px 12px)",
  Abstract:
    "radial-gradient(circle at 20% 30%, #f59e0b 18%, transparent 20%), radial-gradient(circle at 70% 60%, #6366f1 22%, transparent 24%), linear-gradient(120deg, #fef3c7, #ede9fe)",
  "Animal Print":
    "radial-gradient(ellipse at 30% 30%, #78350f 30%, transparent 32%), radial-gradient(ellipse at 70% 70%, #78350f 26%, transparent 28%), linear-gradient(0deg, #fbbf24, #fbbf24)",
  Leopard:
    "radial-gradient(ellipse at 25% 35%, #451a03 28%, transparent 30%), radial-gradient(ellipse at 65% 65%, #451a03 24%, transparent 26%), linear-gradient(0deg, #f59e0b, #f59e0b)",
  Zebra:
    "repeating-linear-gradient(115deg, #0f172a 0 5px, #ffffff 5px 13px)",
  "Cow Print":
    "radial-gradient(ellipse at 30% 40%, #0f172a 34%, transparent 36%), radial-gradient(ellipse at 75% 70%, #0f172a 30%, transparent 32%), linear-gradient(0deg, #ffffff, #ffffff)",
  Snakeskin:
    "repeating-conic-gradient(from 45deg, #a16207 0 12%, #fef9c3 0 25%)",
  "Tie-Dye":
    "radial-gradient(circle at 40% 40%, #f472b6 12%, #a78bfa 30%, #38bdf8 55%, #facc15 80%)",
  Ombre: "linear-gradient(180deg, #1d4ed8, #93c5fd, #ffffff)",
  Colorblock:
    "linear-gradient(90deg, #ef4444 0 33%, #facc15 33% 66%, #2563eb 66% 100%)",
  Paisley:
    "radial-gradient(circle at 35% 35%, #14b8a6 20%, transparent 22%), radial-gradient(circle at 60% 60%, #f472b6 16%, transparent 18%), linear-gradient(0deg, #ecfeff, #ecfeff)",
  Houndstooth:
    "conic-gradient(from 135deg, #0f172a 0 25%, #ffffff 0 50%, #0f172a 0 75%, #ffffff 0)",
  Herringbone:
    "repeating-linear-gradient(45deg, #94a3b8 0 4px, #f1f5f9 4px 8px), repeating-linear-gradient(-45deg, #94a3b8 0 4px, #f1f5f9 4px 8px)",
  Camo:
    "radial-gradient(ellipse at 25% 30%, #365314 34%, transparent 36%), radial-gradient(ellipse at 70% 65%, #713f12 32%, transparent 34%), radial-gradient(ellipse at 50% 80%, #1c1917 26%, transparent 28%), linear-gradient(0deg, #a3a380, #a3a380)",
  Argyle:
    "repeating-conic-gradient(from 45deg, #7c3aed 0 25%, #ede9fe 0 50%)",
  Damask:
    "radial-gradient(circle at 50% 20%, #c7d2fe 20%, transparent 22%), radial-gradient(circle at 50% 70%, #c7d2fe 24%, transparent 26%), linear-gradient(0deg, #312e81, #312e81)",
  Toile:
    "radial-gradient(circle at 40% 40%, #1d4ed8 14%, transparent 16%), radial-gradient(circle at 70% 75%, #1d4ed8 10%, transparent 12%), linear-gradient(0deg, #f8fafc, #f8fafc)",
  Hearts:
    "radial-gradient(circle at 35% 40%, #e11d48 24%, transparent 26%), radial-gradient(circle at 65% 40%, #e11d48 24%, transparent 26%), linear-gradient(0deg, #fff1f2, #fff1f2)",
  Stars:
    "radial-gradient(circle at 30% 30%, #fde047 16%, transparent 18%), radial-gradient(circle at 70% 65%, #fde047 12%, transparent 14%), linear-gradient(0deg, #1e1b4b, #1e1b4b)",
  "Graphic Print":
    "linear-gradient(135deg, #f97316 0 40%, #0f172a 40% 60%, #22d3ee 60% 100%)",
};

/** Background sizes paired with `PATTERN_BACKGROUNDS` (defaults to `auto`). */
export const PATTERN_BACKGROUND_SIZES: Record<string, string> = {
  "Polka Dots": "14px 14px, 14px 14px, 100% 100%",
  Floral: "18px 18px, 18px 18px, 100% 100%",
  Checkered: "16px 16px",
  Geometric: "18px 18px",
  "Animal Print": "20px 20px, 20px 20px, 100% 100%",
  Leopard: "18px 18px, 18px 18px, 100% 100%",
  "Cow Print": "24px 24px, 24px 24px, 100% 100%",
  Snakeskin: "16px 16px",
  Paisley: "20px 20px, 20px 20px, 100% 100%",
  Houndstooth: "14px 14px",
  Argyle: "20px 20px",
  Damask: "22px 22px, 22px 22px, 100% 100%",
  Toile: "22px 22px, 22px 22px, 100% 100%",
  Hearts: "18px 18px, 18px 18px, 100% 100%",
  Stars: "20px 20px, 20px 20px, 100% 100%",
  Camo: "30px 30px, 30px 30px, 30px 30px, 100% 100%",
};

/** Patterns whose background is dark enough that chip text must be light. */
export const PATTERN_LIGHT_TEXT = new Set<string>([
  "Plaid",
  "Tartan",
  "Damask",
  "Stars",
  "Camo",
  "Graphic Print",
]);

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

export const COLOR_SWATCHES: Record<string, string> = {
  // Neutrals
  Black: "#000000",
  "Off Black": "#1c1c1c",
  Charcoal: "#36454f",
  "Dark Gray": "#5a5a5a",
  Gray: "#9ca3af",
  "Light Gray": "#d1d5db",
  Silver: "#c0c0c0",
  White: "#ffffff",
  "Off White": "#f7f4ef",
  Ivory: "#fffff0",
  Cream: "#fffdd0",
  Beige: "#f5f5dc",
  Ecru: "#c2b280",
  Taupe: "#8b8589",
  Khaki: "#c3b091",
  Camel: "#c19a6b",
  Tan: "#d2b48c",
  Brown: "#8b5a2b",
  Chocolate: "#5b3a1a",
  Espresso: "#3b2314",
  Chestnut: "#954535",
  Rust: "#b7410e",
  Terracotta: "#e2725b",

  // Reds & pinks
  Red: "#e11d48",
  "Cherry Red": "#d2042d",
  Crimson: "#dc143c",
  Scarlet: "#ff2400",
  Maroon: "#800000",
  Burgundy: "#800020",
  Wine: "#722f37",
  Oxblood: "#4a0000",
  Coral: "#ff7f50",
  Salmon: "#fa8072",
  Blush: "#f4c2c2",
  Pink: "#ec4899",
  "Hot Pink": "#ff69b4",
  Fuchsia: "#ff00ff",
  Magenta: "#d1006f",
  Rose: "#ff007f",
  "Dusty Rose": "#c48793",
  Mauve: "#e0b0ff",

  // Oranges & yellows
  Orange: "#f97316",
  "Burnt Orange": "#cc5500",
  Apricot: "#fbceb1",
  Peach: "#ffe5b4",
  Amber: "#ffbf00",
  Gold: "#d4af37",
  Mustard: "#d4a017",
  Yellow: "#facc15",
  "Lemon Yellow": "#fff44f",
  Butter: "#f6e199",

  // Greens
  Green: "#22c55e",
  "Kelly Green": "#4cbb17",
  "Forest Green": "#228b22",
  Emerald: "#046307",
  Hunter: "#355e3b",
  Olive: "#808000",
  "Army Green": "#4b5320",
  Sage: "#9caf88",
  Mint: "#98ff98",
  Lime: "#bfff00",
  Seafoam: "#71eeb8",
  Teal: "#008080",

  // Blues
  Blue: "#2563eb",
  "Baby Blue": "#89cff0",
  "Sky Blue": "#87ceeb",
  Cornflower: "#6495ed",
  "Royal Blue": "#4169e1",
  Cobalt: "#0047ab",
  Navy: "#1e3a8a",
  Midnight: "#191970",
  Denim: "#1560bd",
  Turquoise: "#40e0d0",
  Aqua: "#00ffff",
  Cyan: "#22d3ee",
  Periwinkle: "#ccccff",

  // Purples
  Purple: "#7c3aed",
  Violet: "#8f00ff",
  Lavender: "#b57edc",
  Lilac: "#c8a2c8",
  Orchid: "#da70d6",
  Plum: "#8e4585",
  Eggplant: "#3d0734",
  Indigo: "#4b0082",

  // Metallics & specials
  "Metallic Gold": "#d4af37",
  "Metallic Silver": "#aaa9ad",
  "Rose Gold": "#b76e79",
  Bronze: "#cd7f32",
  Copper: "#b87333",
  Gunmetal: "#2a3439",
  Pearl: "#eae0c8",
  Iridescent: "#a0e7e5",
  Neon: "#39ff14",
  Clear: "#e8f4f8",
  Multicolor: "#7c3aed",
};

export const COLORS = Object.keys(COLOR_SWATCHES) as unknown as readonly string[];

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
export type Enclosure = (typeof ENCLOSURES)[number];
export type LaundryInstruction = (typeof LAUNDRY_INSTRUCTIONS)[number];
