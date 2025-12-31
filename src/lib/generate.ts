import type { ValidationResult } from "./types";

type ListingContent = {
  titles: string[];
  bullets: string[];
  description: string;
  hooks: string[];
  faqs: { q: string; a: string }[];
  positioning: {
    audience: string;
    angle: string;
    upsells: string[];
  };
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9$.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const removePrice = (value: string) =>
  value.replace(/\$ ?\d+(?:\.\d+)?/g, "").replace(/\s+/g, " ").trim();

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const truncateWords = (value: string, limit: number) => {
  const words = value.split(" ").filter(Boolean);
  return words.slice(0, limit).join(" ");
};

const hasAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

const organizerKeywords = [
  "organizer",
  "organiser",
  "management",
  "tray",
  "holder",
  "storage",
  "cable",
  "tangle",
];
const comfortKeywords = [
  "ergonomic",
  "support",
  "relief",
  "posture",
  "neck",
  "back",
  "wrist",
];
const travelKeywords = ["travel", "portable", "compact", "on-the-go"];
const petKeywords = ["pet", "cat", "dog"];
const babyKeywords = ["baby", "toddler", "infant"];
const kitchenKeywords = ["kitchen", "cook", "bake", "grill"];
const deskKeywords = ["desk", "office", "workspace", "keyboard", "monitor"];
const beautyKeywords = ["beauty", "skincare", "makeup", "hair"];
const fitnessKeywords = ["fitness", "gym", "workout", "yoga"];
const homeKeywords = ["home", "living", "decor", "lamp", "light"];
const techKeywords = [
  "electronic",
  "electronics",
  "battery",
  "bluetooth",
  "usb",
  "charger",
  "gadget",
];

const buildAudience = (text: string, brandable: boolean) => {
  let audience = "everyday shoppers";
  if (hasAny(text, petKeywords)) audience = "pet owners";
  else if (hasAny(text, babyKeywords)) audience = "new parents";
  else if (hasAny(text, travelKeywords)) audience = "travelers";
  else if (hasAny(text, deskKeywords)) audience = "desk-focused teams";
  else if (hasAny(text, kitchenKeywords)) audience = "home cooks";
  else if (hasAny(text, fitnessKeywords)) audience = "fitness routines";
  else if (hasAny(text, beautyKeywords)) audience = "beauty routines";
  else if (hasAny(text, homeKeywords)) audience = "home refreshers";

  if (brandable) {
    return `style-minded ${audience}`;
  }
  return audience;
};

const buildBenefits = (text: string) => {
  const benefits: string[] = [];
  if (hasAny(text, organizerKeywords)) {
    benefits.push("Keeps your space tidy and clutter-free.");
    benefits.push("Reduces daily setup time with a cleaner layout.");
  }
  if (hasAny(text, comfortKeywords)) {
    benefits.push("Supports comfort during long use.");
    benefits.push("Helps reduce everyday strain.");
  }
  if (hasAny(text, travelKeywords)) {
    benefits.push("Packs easily without adding bulk.");
    benefits.push("Ready for on-the-go routines.");
  }
  if (hasAny(text, petKeywords)) {
    benefits.push("Makes pet care routines feel simpler.");
  }
  if (hasAny(text, kitchenKeywords)) {
    benefits.push("Streamlines daily prep and cleanup.");
  }
  if (hasAny(text, beautyKeywords)) {
    benefits.push("Keeps routines organized and easy to reach.");
  }
  if (benefits.length === 0) {
    benefits.push("Solves a small but persistent daily hassle.");
    benefits.push("Brings a practical upgrade to your routine.");
  }
  return benefits;
};

const buildBenefitLabel = (text: string) => {
  if (hasAny(text, organizerKeywords)) return "Cleaner setups";
  if (hasAny(text, comfortKeywords)) return "Everyday comfort";
  if (hasAny(text, travelKeywords)) return "On-the-go ease";
  if (hasAny(text, petKeywords)) return "Pet-friendly care";
  if (hasAny(text, kitchenKeywords)) return "Kitchen-ready";
  if (hasAny(text, beautyKeywords)) return "Routine-ready";
  if (hasAny(text, homeKeywords)) return "Home refresh";
  return "Practical upgrade";
};

const buildUpsells = (text: string) => {
  if (hasAny(text, organizerKeywords)) {
    return ["Cable clip add-on pack", "Adhesive mounts", "Two-pack bundle"];
  }
  if (hasAny(text, techKeywords)) {
    return ["Spare charging cable", "Protective travel pouch", "Bundle set"];
  }
  if (hasAny(text, travelKeywords)) {
    return ["Travel pouch", "Compact bundle", "Extra set for luggage"];
  }
  if (hasAny(text, petKeywords)) {
    return ["Replacement pack", "Multi-pet bundle", "Matching accessory"];
  }
  return ["Bundle pack", "Protective case", "Replacement set"];
};

const ensureCount = (
  items: string[],
  target: number,
  fallback: (index: number) => string,
) => {
  const unique: string[] = [];
  items.forEach((item) => {
    if (!unique.includes(item)) {
      unique.push(item);
    }
  });
  let index = 1;
  while (unique.length < target) {
    const next = fallback(index);
    if (!unique.includes(next)) {
      unique.push(next);
    }
    index += 1;
    if (index > 12) {
      break;
    }
  }
  return unique.slice(0, target);
};

export function generateListingContent(input: {
  productText: string;
  validation: ValidationResult;
}): ListingContent {
  const rawText = input.productText.trim();
  const normalized = normalizeText(rawText);
  const nameBase = truncateWords(removePrice(rawText), 6) || rawText || "Product";
  const productName = toTitleCase(nameBase);

  const brandable = input.validation.scores.brandability >= 7;
  const competitionHigh = input.validation.scores.competition >= 7;
  const marginLow = input.validation.scores.margin <= 4;
  const shippingRiskHigh = input.validation.scores.shipping >= 7;
  const trendLow = input.validation.scores.trend <= 4;
  const warningsText = input.validation.warnings.join(" ").toLowerCase();
  const volatile =
    trendLow || warningsText.includes("trend") || warningsText.includes("season");

  const audience = buildAudience(normalized, brandable);
  const benefits = buildBenefits(normalized);
  const benefitLabel = buildBenefitLabel(normalized);
  const upsells = marginLow ? buildUpsells(normalized) : [];

  const angle = brandable
    ? `A clean, brandable ${productName} for ${audience}.`
    : competitionHigh
      ? `A focused ${audience} solution that avoids generic designs.`
      : `A practical upgrade built for ${audience}.`;

  const differentiation = competitionHigh
    ? "Purpose-built for a specific routine"
    : "Simple, dependable upgrade";

  const titles = ensureCount(
    [
      `${productName} for ${toTitleCase(audience)}`,
      `${benefitLabel} ${productName}`,
      `${productName} | ${differentiation}`,
      `Designed to simplify your routine: ${productName}`,
      `${productName} - ${benefitLabel}`,
    ],
    5,
    (index) => `${productName} - Practical Upgrade ${index}`,
  );

  const bullets = ensureCount(
    [
      benefits[0],
      benefits[1] ?? "Designed for easy everyday use.",
      `Built with a ${competitionHigh ? "focused" : "clean"} look that stands out.`,
      `Sized for easy placement in most routines and spaces.`,
      shippingRiskHigh
        ? "Handled and packed with extra care due to material sensitivity."
        : "Ready for quick setup without extra tools.",
    ],
    5,
    (index) => `A simple, reliable addition to your day (${index}).`,
  );

  const descriptionLines: string[] = [
    `${productName} is a practical solution for ${audience}.`,
    benefits[0] ?? "It removes friction from a common daily task.",
    competitionHigh
      ? "It focuses on the core job without unnecessary extras."
      : "Its clean design fits seamlessly into everyday spaces.",
  ];

  if (shippingRiskHigh) {
    descriptionLines.push(
      "Because of the materials, it ships with protective packaging and should be handled with care on arrival.",
    );
  }

  if (volatile) {
    descriptionLines.push(
      "This idea tracks current demand, so it works best for shoppers looking for timely drops.",
    );
  }

  const description = descriptionLines.slice(0, 4).join(" ");

  const hooks = ensureCount(
    [
      `Turn a small daily hassle into a clean win with ${productName}.`,
      `${benefitLabel} in one simple upgrade.`,
      `Made for ${audience} who want less clutter and more ease.`,
      competitionHigh
        ? "Skip the generic options and choose the focused solution."
        : "A calm, practical upgrade for busy days.",
      volatile
        ? "Trend-aware drop: best for shoppers who want what is current."
        : "Reliable everyday upgrade without the hype.",
    ],
    5,
    (index) => `A smarter way to use ${productName} (${index}).`,
  );

  const faqs = [
    {
      q: "How is it packaged for shipping?",
      a: shippingRiskHigh
        ? "We use protective packaging to reduce risk in transit. Inspect on arrival and reach out if anything looks off."
        : "Items are packed to arrive safely with standard protective materials.",
    },
    {
      q: "What if it is not the right fit?",
      a: "Returns follow the store policy listed at checkout. Reach out if you need help.",
    },
    {
      q: "Will it work with my setup?",
      a: "It is designed for everyday setups. Check the product details to confirm fit for your space.",
    },
    {
      q: "What size is it?",
      a: "Exact dimensions are listed on the product page. Compare them to your space before ordering.",
    },
    {
      q: "How is the quality handled?",
      a: "We focus on consistent materials and finish. Contact support if you notice any issues.",
    },
    {
      q: "What is included?",
      a: "The listing includes the main product as shown. Any accessories are noted in the details.",
    },
  ];

  return {
    titles,
    bullets,
    description,
    hooks,
    faqs,
    positioning: {
      audience: `Best for ${audience}.`,
      angle,
      upsells,
    },
  };
}
