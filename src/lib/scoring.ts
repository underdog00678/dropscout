import type { ScoreBreakdown, ValidationResult } from "./types";

type ValidationInput = {
  productText: string;
};

const commodityKeywords = [
  "phone case",
  "t-shirt",
  "tshirt",
  "hoodie",
  "mug",
  "water bottle",
  "bottle",
  "charger",
  "keychain",
  "sticker",
  "poster",
  "hat",
  "cap",
  "earbuds",
  "socks",
  "mouse pad",
];

const highCompetitionKeywords = [
  "phone case",
  "keychain",
  "t-shirt",
  "tshirt",
  "socks",
  "charger",
  "earbuds",
  "sticker",
  "poster",
  "led lights",
  "led light",
  "water bottle",
];

const phoneAccessoryKeywords = [
  "phone case",
  "screen protector",
  "magsafe",
  "magnetic phone",
  "phone grip",
  "phone stand",
  "wireless charger",
];

const techAccessoryKeywords = [
  "charger",
  "charging cable",
  "usb cable",
  "adapter",
  "power bank",
  "dock",
  "hub",
  "keyboard",
  "mouse",
  "laptop stand",
];

const beautySkincareKeywords = [
  "skincare",
  "beauty",
  "facial",
  "serum",
  "mask",
  "gua sha",
  "microcurrent",
  "led",
];

const babyKidsKeywords = [
  "baby",
  "toddler",
  "kids",
  "infant",
  "newborn",
  "nursery",
  "stroller",
  "breastfeeding",
];

const wellnessKeywords = [
  "wellness",
  "massage",
  "posture",
  "sleep",
  "relief",
  "therapy",
  "yoga",
];

const kitchenKeywords = [
  "kitchen",
  "cooking",
  "pantry",
  "food",
  "spice",
  "meal",
];

const officeKeywords = [
  "office",
  "desk",
  "workspace",
  "cable management",
  "notebook",
  "planner",
];

const homeImprovementKeywords = [
  "tool",
  "tools",
  "home improvement",
  "repair",
  "drill",
  "hardware",
];

const carAccessoryKeywords = [
  "car",
  "vehicle",
  "auto",
  "dashboard",
  "windshield",
  "mount",
];

const petSupplyKeywords = [
  "pet",
  "cat",
  "dog",
  "litter",
  "grooming",
  "collar",
  "leash",
];

const fitnessKeywords = [
  "fitness",
  "gym",
  "workout",
  "training",
  "exercise",
  "yoga",
];

const problemSolvingKeywords = [
  "ergonomic",
  "organizer",
  "organiser",
  "management",
  "tray",
  "holder",
  "stand",
  "support",
  "relief",
  "fix",
  "solution",
  "tangle",
  "storage",
  "organize",
  "organise",
];

const intentContextKeywords = [
  "long flights",
  "back pain",
  "neck pain",
  "shoulder pain",
  "posture",
  "sleep",
  "relief",
];

const compoundUtilityKeywords = [
  "2-in-1",
  "two-in-one",
  "combo",
  "bundle",
  "all-in-one",
  "multi",
  "dual",
  "mount charger",
];

const nicheModifierKeywords = [
  "for travel",
  "for kids",
  "for baby",
  "for fitness",
  "for gym",
  "for office",
  "for desk",
  "for outdoor",
  "for pets",
  "for car",
  "for kitchen",
];

const nicheKeywords = [
  "pet",
  "cat",
  "dog",
  "baby",
  "toddler",
  "travel",
  "camp",
  "outdoor",
  "fitness",
  "gym",
  "gamer",
  "gaming",
  "kitchen",
  "office",
  "desk",
  "teacher",
  "student",
  "beauty",
  "makeup",
  "bike",
  "cycling",
];

const differentiationKeywords = [
  "custom",
  "customized",
  "personalized",
  "engraved",
  "monogram",
  "handmade",
  "artisan",
  "limited",
  "bundle",
  "kit",
  "starter",
  "set",
];

const trendKeywords = [
  "tiktok",
  "viral",
  "trend",
  "trending",
  "instagram",
  "reel",
  "reels",
  "shorts",
  "fidget",
];

const trendBoostKeywords = [
  "wireless",
  "smart",
  "charger",
  "skincare",
  "beauty",
  "baby",
  "portable",
];

const competitiveElectronicsKeywords = [
  "bluetooth",
  "wireless earbuds",
  "smartwatch",
  "smart watch",
  "power bank",
  "usb cable",
  "charging cable",
  "phone charger",
  "earbuds",
];

const commonPetAccessoryKeywords = [
  "dog collar",
  "cat collar",
  "leash",
  "pet toy",
  "cat toy",
  "dog toy",
  "pet bowl",
];

const seasonalKeywords = [
  "holiday",
  "christmas",
  "halloween",
  "summer",
  "winter",
  "seasonal",
  "valentine",
];

const fragileKeywords = [
  "glass",
  "ceramic",
  "porcelain",
  "fragile",
  "mirror",
  "vase",
  "lamp",
];

const bulkyKeywords = [
  "large",
  "bulky",
  "oversized",
  "furniture",
  "chair",
  "table",
  "desk",
  "sofa",
  "mattress",
  "treadmill",
  "patio",
];

const electronicKeywords = [
  "electronic",
  "electronics",
  "battery",
  "lithium",
  "bluetooth",
  "smart",
  "gadget",
  "charger",
  "powered",
  "usb",
  "led",
];

const smallItemKeywords = [
  "charger",
  "case",
  "tool",
  "portable",
  "cable",
  "adapter",
  "clip",
  "mount",
  "organizer",
];

const saturatedGenericKeywords = [
  "phone case",
  "water bottle",
  "led lights",
  "led light",
  "t-shirt",
  "tshirt",
  "earbuds",
];

const returnRiskKeywords = [
  "wearable",
  "shoes",
  "shoe",
  "apparel",
  "clothing",
  "shirt",
  "dress",
  "pants",
  "leggings",
  "bra",
  "jacket",
  "skincare device",
  "beauty device",
  "face wand",
  "device",
  "wand",
  "gadget",
];

const baseScores: ScoreBreakdown = {
  demand: 5,
  competition: 5,
  margin: 5,
  shipping: 5,
  trend: 5,
  brandability: 5,
  total: 50,
};

const clampScore = (value: number) =>
  Math.max(0, Math.min(10, Math.round(value)));

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasKeyword = (text: string, keyword: string) => {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text);
};

const hasAny = (text: string, keywords: string[]) =>
  keywords.some((keyword) => hasKeyword(text, keyword));

const extractPrices = (text: string) => {
  const matches = [...text.matchAll(/\$ ?(\d+(?:\.\d+)?)/g)];
  return matches
    .map((match) => Number(match[1]))
    .filter((price) => !Number.isNaN(price));
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9$.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const addUnique = (list: string[], item: string) => {
  if (!list.includes(item)) {
    list.push(item);
  }
};

const summarizeSignals = (signals: string[]) => {
  if (signals.length === 0) {
    return "";
  }
  if (signals.length === 1) {
    return signals[0];
  }
  if (signals.length === 2) {
    return `${signals[0]} and ${signals[1]}`;
  }
  return `${signals[0]}, ${signals[1]}`;
};

export function validateProduct(input: ValidationInput): ValidationResult {
  const normalized = normalizeText(input.productText ?? "");

  if (!normalized) {
    return {
      decision: "red",
      summary:
        "Red: not enough product detail to evaluate demand, margins, or risk.",
      scores: {
        demand: 0,
        competition: 0,
        margin: 0,
        shipping: 0,
        trend: 0,
        brandability: 0,
        total: 0,
      },
      warnings: ["Provide a clear product description or URL."],
      reasons: ["Insufficient information to score the product fairly."],
    };
  }

  const scores: ScoreBreakdown = { ...baseScores };
  const warnings: string[] = [];
  const reasons: string[] = [];
  const hasExplicitUseCase = normalized.includes(" for ");
  const hasWithModifier = normalized.includes(" with ");
  const hasNicheModifiers =
    hasAny(normalized, nicheModifierKeywords) || hasExplicitUseCase;
  const hasCommodity = hasAny(normalized, commodityKeywords);

  if (hasAny(normalized, problemSolvingKeywords)) {
    scores.demand += 2;
    scores.brandability += 2;
    addUnique(
      reasons,
      "Problem-solving positioning supports demand and brandability.",
    );
  }

  if (hasAny(normalized, nicheKeywords)) {
    scores.demand += 1;
    scores.brandability += 1;
    addUnique(reasons, "A clear niche audience makes targeting easier.");
  }

  let intentStrength = 0;
  if (hasExplicitUseCase) {
    intentStrength += 2;
  }
  if (hasWithModifier) {
    intentStrength += 1;
  }
  if (hasAny(normalized, problemSolvingKeywords)) {
    intentStrength += 2;
  }
  if (hasAny(normalized, intentContextKeywords)) {
    intentStrength += 2;
  }
  if (hasAny(normalized, compoundUtilityKeywords)) {
    intentStrength += 2;
  }
  if (hasCommodity && !hasNicheModifiers) {
    intentStrength -= 2;
  }
  if (normalized.split(" ").length <= 2 && !hasNicheModifiers) {
    intentStrength -= 2;
  }
  intentStrength = Math.max(0, Math.min(10, intentStrength));
  const intentBoost = intentStrength >= 6 ? 2 : intentStrength >= 3 ? 1 : 0;
  if (intentBoost > 0) {
    scores.demand += intentBoost;
    scores.brandability += intentBoost;
    addUnique(reasons, "Clear intent and use-case detail strengthen demand.");
  } else if (hasCommodity && !hasNicheModifiers) {
    addUnique(
      warnings,
      "Description feels broad; a clearer use case would improve confidence.",
    );
  }

  const categorySignals = [
    {
      keywords: phoneAccessoryKeywords,
      demand: 2,
      brandability: 1,
      reason: "Phone accessories show steady shopper demand.",
    },
    {
      keywords: beautySkincareKeywords,
      demand: 2,
      brandability: 1,
      reason: "Beauty and personal care see consistent repeat demand.",
    },
    {
      keywords: kitchenKeywords,
      demand: 1,
      margin: 1,
      reason: "Kitchen helpers remain popular for everyday needs.",
    },
    {
      keywords: babyKidsKeywords,
      demand: 2,
      brandability: 1,
      reason: "Baby products sustain recurring demand from parents.",
    },
    {
      keywords: petSupplyKeywords,
      demand: 1,
      brandability: 1,
      reason: "Pet supplies have reliable repeat purchases.",
    },
    {
      keywords: officeKeywords,
      demand: 1,
      brandability: 1,
      reason: "Office essentials stay relevant for remote and hybrid work.",
    },
    {
      keywords: homeImprovementKeywords,
      demand: 1,
      margin: 1,
      reason: "Tools and home improvement items keep steady interest.",
    },
    {
      keywords: carAccessoryKeywords,
      demand: 1,
      brandability: 1,
      reason: "Car accessories maintain steady demand from commuters.",
    },
    {
      keywords: fitnessKeywords,
      demand: 1,
      brandability: 1,
      reason: "Fitness and wellness categories see ongoing interest.",
    },
  ];

  categorySignals.forEach((signal) => {
    if (!hasAny(normalized, signal.keywords)) return;
    if (signal.demand) scores.demand += signal.demand;
    if (signal.brandability) scores.brandability += signal.brandability;
    if (signal.margin) scores.margin += signal.margin;
    addUnique(reasons, signal.reason);
  });

  if (hasAny(normalized, phoneAccessoryKeywords)) {
    scores.demand += 1; // Additional lift for a core demand category.
  }

  if (hasAny(normalized, techAccessoryKeywords)) {
    scores.demand += 2; // Tech add-ons are frequent repeat purchases.
    addUnique(reasons, "Tech accessories benefit from ongoing replacement cycles.");
  }

  if (hasAny(normalized, beautySkincareKeywords)) {
    scores.demand += 1; // Extra demand boost for repeat purchase behavior.
  }

  if (hasAny(normalized, babyKidsKeywords)) {
    scores.demand += 1; // Extra demand boost for baby essentials.
  }

  if (hasAny(normalized, wellnessKeywords)) {
    scores.demand += 1; // Wellness stays steady but competitive.
  }

  if (hasAny(normalized, differentiationKeywords)) {
    scores.brandability += 2;
    scores.competition -= 1;
    addUnique(reasons, "Differentiation can reduce direct competition.");
  }

  if (hasAny(normalized, nicheModifierKeywords)) {
    scores.brandability += 1; // Clear modifiers sharpen positioning.
    addUnique(reasons, "Specific use-case modifiers improve brand focus.");
  }

  let differentiation = 0;
  if (hasAny(normalized, nicheModifierKeywords) || hasExplicitUseCase) {
    differentiation += 3;
  }
  if (hasAny(normalized, problemSolvingKeywords)) {
    differentiation += 2;
  }
  if (hasAny(normalized, differentiationKeywords)) {
    differentiation += 2;
  }
  if (hasAny(normalized, nicheKeywords)) {
    differentiation += 1;
  }
  if (hasCommodity) {
    differentiation -= 2;
  }
  if (hasAny(normalized, saturatedGenericKeywords) && !hasNicheModifiers) {
    differentiation -= 3;
  }
  differentiation = Math.max(0, Math.min(10, differentiation));

  if (differentiation >= 6) {
    scores.brandability += 1;
    addUnique(reasons, "Differentiation signals support clearer positioning.");
  }

  if (
    differentiation <= 2 &&
    hasCommodity &&
    !hasAny(normalized, babyKidsKeywords)
  ) {
    scores.competition += 1;
    scores.brandability -= 1;
    addUnique(
      warnings,
      "Looks generic—competition may be overwhelming without a clear differentiator.",
    );
  }

  if (hasCommodity) {
    const hasBottle = hasKeyword(normalized, "bottle");
    const hasWaterBottle = hasKeyword(normalized, "water bottle");
    const hasBabyContext = hasAny(normalized, babyKidsKeywords);
    const softenedBottleCompetition =
      hasBottle && hasBabyContext && !hasWaterBottle;
    const competitionBump = softenedBottleCompetition ? 2 : 3;
    scores.competition += competitionBump;
    scores.brandability -= 1;
    addUnique(reasons, "Commodity products typically face heavy competition.");
    if (softenedBottleCompetition) {
      addUnique(
        reasons,
        "Baby-specific context slightly reduces direct commodity competition.",
      );
    }
    addUnique(warnings, "Commodity category likely crowded with similar items.");
  }

  const hasDifferentiators =
    hasNicheModifiers ||
    hasAny(normalized, problemSolvingKeywords) ||
    hasAny(normalized, differentiationKeywords);
  if (hasAny(normalized, saturatedGenericKeywords) && !hasDifferentiators) {
    scores.competition += 2; // Generic items get flooded quickly.
    scores.brandability -= 2;
    addUnique(
      warnings,
      "Generic commodity detected without clear niche differentiation.",
    );
  }

  if (hasAny(normalized, highCompetitionKeywords)) {
    scores.competition += 2;
    addUnique(warnings, "High-competition category detected.");
  }

  if (hasAny(normalized, competitiveElectronicsKeywords)) {
    scores.competition += 2; // Generic electronics are crowded.
    scores.trend -= 1; // Fast-moving catalog cycles add volatility.
    addUnique(warnings, "Generic electronics are highly competitive.");
  }

  if (hasAny(normalized, commonPetAccessoryKeywords)) {
    scores.competition += 2; // Common pet accessories compete on price.
    scores.trend -= 1;
    addUnique(warnings, "Common pet accessories face heavy competition.");
  }

  const prices = extractPrices(normalized);
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    if (minPrice < 10) {
      scores.margin -= 4;
      addUnique(warnings, "Price under $10 usually leaves thin margins.");
      addUnique(reasons, "Low price suggests limited margin headroom.");
    } else if (minPrice < 15) {
      scores.margin -= 3;
      addUnique(warnings, "Price under $15 can make margins tight.");
      addUnique(reasons, "Low price makes profitability harder.");
    } else if (minPrice >= 100) {
      scores.margin += 2;
      addUnique(reasons, "Higher ticket price supports healthier margins.");
    } else if (minPrice >= 50) {
      scores.margin += 1;
      addUnique(reasons, "Mid-ticket pricing can improve margin potential.");
    }
  }

  let shippingSignals = 0;
  let marginShippingPenalty = 0;
  if (hasAny(normalized, fragileKeywords)) {
    scores.shipping += 4;
    shippingSignals += 1;
    marginShippingPenalty += 2;
    addUnique(warnings, "Fragile materials increase shipping risk.");
  }

  if (hasAny(normalized, bulkyKeywords)) {
    scores.shipping += 5;
    shippingSignals += 1;
    marginShippingPenalty += 3;
    addUnique(warnings, "Large or bulky items raise fulfillment costs.");
  }

  if (hasAny(normalized, electronicKeywords)) {
    scores.shipping += 2;
    shippingSignals += 1;
    addUnique(warnings, "Electronics can trigger returns and carrier limits.");
  }

  if (shippingSignals > 0) {
    addUnique(reasons, "Shipping risk appears elevated for this product.");
  }
  if (marginShippingPenalty > 0) {
    scores.margin -= marginShippingPenalty;
    addUnique(
      reasons,
      "Bulky or fragile handling can compress margins after fulfillment costs.",
    );
  }

  if (hasAny(normalized, returnRiskKeywords)) {
    scores.shipping += 1;
    addUnique(
      warnings,
      "Return risk may be higher for fit or expectation-sensitive items.",
    );
  }

  if (hasAny(normalized, smallItemKeywords)) {
    scores.shipping -= 1; // Small/light items lower shipping risk.
    addUnique(reasons, "Compact items are typically easier to ship.");
  }

  if (hasAny(normalized, trendKeywords)) {
    scores.trend -= 2;
    scores.demand += 1;
    addUnique(warnings, "Trend-driven demand can fade quickly.");
    addUnique(reasons, "Trend signals boost demand but add volatility.");
  }

  if (hasAny(normalized, trendBoostKeywords)) {
    scores.trend += 1; // Core categories hold steady demand over time.
    addUnique(reasons, "Category demand looks fairly stable.");
  }

  if (hasAny(normalized, seasonalKeywords)) {
    scores.trend -= 1;
    addUnique(warnings, "Seasonal demand may limit year-round sales.");
  }

  const finalScoresBase = {
    demand: clampScore(scores.demand),
    competition: clampScore(scores.competition),
    margin: clampScore(scores.margin),
    shipping: clampScore(scores.shipping),
    trend: clampScore(scores.trend),
    brandability: clampScore(scores.brandability),
  };

  if (finalScoresBase.competition >= 7) {
    addUnique(reasons, "Competition looks crowded for this category.");
  }
  if (finalScoresBase.margin <= 3) {
    addUnique(reasons, "Margins look too thin to absorb ad and shipping costs.");
    addUnique(warnings, "Margin viability is a major risk.");
  }
  if (finalScoresBase.shipping >= 7) {
    addUnique(reasons, "Shipping risk is high relative to typical products.");
    addUnique(warnings, "Shipping risk could lead to returns or damage.");
  }
  if (finalScoresBase.trend <= 3) {
    addUnique(reasons, "Trend health appears unstable or short-lived.");
  }
  if (finalScoresBase.demand <= 3) {
    addUnique(reasons, "Demand signals appear weak based on the description.");
  }
  if (finalScoresBase.demand >= 7) {
    addUnique(reasons, "Demand signals look strong for this idea.");
  }
  if (finalScoresBase.brandability >= 7) {
    addUnique(reasons, "Brandability looks strong for a focused audience.");
  }

  const fatalCombination =
    finalScoresBase.margin <= 3 &&
    finalScoresBase.shipping >= 7 &&
    finalScoresBase.competition >= 7;

  const normalizedCompetition = 10 - finalScoresBase.competition;
  const normalizedShipping = 10 - finalScoresBase.shipping;
  const overallScore =
    (finalScoresBase.demand +
      finalScoresBase.margin +
      finalScoresBase.trend +
      finalScoresBase.brandability +
      normalizedCompetition +
      normalizedShipping) /
    6;
  const totalScore = Math.max(0, Math.min(100, Math.round(overallScore * 10)));
  const finalScores: ScoreBreakdown = {
    ...finalScoresBase,
    total: totalScore,
  };

  let decision: ValidationResult["decision"] = "yellow";
  if (fatalCombination || overallScore < 4.5) {
    decision = "red";
  } else if (overallScore >= 7) {
    decision = "green";
  }

  const positiveSignals: string[] = [];
  if (finalScores.demand >= 7) positiveSignals.push("strong demand");
  if (finalScores.brandability >= 7) positiveSignals.push("clear brandability");
  if (finalScores.margin >= 7) positiveSignals.push("healthy margins");
  if (finalScores.trend >= 7) positiveSignals.push("stable trend");
  if (finalScores.competition <= 3) positiveSignals.push("low competition");
  if (finalScores.shipping <= 3) positiveSignals.push("low shipping risk");

  const riskSignals: string[] = [];
  if (finalScores.competition >= 7) riskSignals.push("high competition");
  if (finalScores.shipping >= 7) riskSignals.push("high shipping risk");
  if (finalScores.margin <= 3) riskSignals.push("thin margins");
  if (finalScores.trend <= 3) riskSignals.push("trend volatility");
  if (finalScores.demand <= 3) riskSignals.push("weak demand");

  let summary = "";
  if (decision === "green") {
    const positives = summarizeSignals(positiveSignals);
    summary = positives
      ? `Green light: ${positives} support a viable launch.`
      : "Green light: overall signals are strong with manageable risk.";
  } else if (decision === "yellow") {
    const positives = summarizeSignals(positiveSignals) || "some positive signals";
    const risks = summarizeSignals(riskSignals) || "manageable risks";
    summary = `Yellow: ${positives} but ${risks} need attention.`;
  } else {
    if (fatalCombination) {
      summary =
        "Red: thin margins combined with high competition and shipping risk make this a poor candidate.";
    } else {
      const risks = summarizeSignals(riskSignals) || "insufficient viable signals";
      summary = `Red: ${risks} make this a weak candidate right now.`;
    }
  }

  return {
    decision,
    summary,
    scores: finalScores,
    warnings: warnings.slice(0, 6),
    reasons: reasons.slice(0, 6),
  };
}
